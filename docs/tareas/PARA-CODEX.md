# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 8 de noviembre de 2026 (2) · Claude · candado de la Academy: arreglos de la revisión independiente

Misma rama `claude/academy-candado`, encima del commit del candado. Revisores independientes confirmaron 9 hallazgos; están todos arreglados y cada uno tiene su prueba. **Sin publicar.**

- **Redirección abierta en `volver` (ya existía, antes del candado).** `regresar()` de `acceso.js` y `retornoSeguro()` del servidor comprobaban la cadena, pero navegaban a la ruta ya normalizada. `/.//otra-web`, `/%2e//otra-web` o `/academy/..//otra-web` acababan en otra web tras entrar con la contraseña. Ahora también se rechaza la ruta normalizada que empiece por `//`. Pruebas en `servidor.test.mjs`, `alta-avisos-navegador.test.mjs` y Chromium.
- **Quien ya tiene cuenta veía «Crear cuenta gratis» al cargar.** El script del candado va ahora en `<head>` sin `defer` (en el índice y en la portada). Marca `html.candado-comprobando` y el recuadro dice «Comprobando tu sesión…» hasta que el servidor responde. Con un 401, un fallo de red o a los 8 s salen los botones; sin JavaScript se ven desde el principio. **Lo que queda:** con sesión, durante una ida y vuelta al servidor (unos 0,2-0,5 s) se ven las lecciones difuminadas con «Comprobando tu sesión…», y luego se desvanecen en 0,35 s. Si el foco estaba en el recuadro, pasa a la primera lección.
- **Con zoom al 200 % o 400 % el botón «entrar» quedaba cortado.** El recuadro solo es fijo con 600 px de alto o más. Por debajo queda arriba del bloque y más compacto. Medido a 683×319, 640×290 y 320×256: los dos botones se ven enteros.
- **Los saltos «Nivel 1/2/3» llevaban a contenido oculto.** Ahora van dentro de lo difuminado e inerte. Si se llega sin sesión con `#intermedio`, el foco pasa al título del recuadro y el Tab sigue en «Crear cuenta gratis». Chromium aplica el ancla al terminar de cargar, así que el foco se pone después de `load`.
- **La primera pantalla no enseñaba el candado.** La fila «Gratis con tu cuenta / Crea tu cuenta gratis…» del índice es ahora un aviso con el candado, «Lecciones bloqueadas». Con sesión pasa a «Lecciones desbloqueadas», así que al volver de `/acceso` se ve arriba que se ha abierto. El tutorial 3D sigue nítido y fuera. En el escritorio, lo difuminado sigue empezando bajo el tutorial 3D, por debajo de la primera pantalla.
- **La portada con sesión seguía invitando a crear cuenta.** Ahora lleva `data-academy-sin-cuenta` y su versión `data-academy-con-cuenta`, que el script cambia al abrir.
- **«Cuenta confirmada: Academy desbloqueada»** solo sale con la sesión ya confirmada. Antes salía también con el candado cerrado.
- **Pruebas que faltaban:** `probar-precarga.cjs` rechaza tres índices mutados (abierto, sin `inert` o sin el script con huella). Con esa compuerta apagada, la prueba falla. La parte de Chromium comprueba antes que `rwadar-publicado/` está construido con el código de hoy; si no, falla con «ejecuta antes npm run test:web».
- Textos nuevos ES/EN en `idioma-en.js`, copiados a la web: «Lecciones bloqueadas», «Lecciones desbloqueadas» y dos frases con cuenta. «Comprobando tu sesión…» ya existía. La app no los enseña; el guardián de la OTA da `ok`.

**Pendiente (Víctor):** publicar la web cuando lo autorice.

## 8 de noviembre de 2026 (1) · Claude · Academy con candado en la web (difuminada sin cuenta, se abre al entrar)

Víctor: «Quiero que esté bloqueado Academy, que solo se desbloquee al crearse la cuenta, que salga difuminada la página y con un candado, y al registrarse y entrar ya se desbloquee». Rama `claude/academy-candado`. **Sin publicar.**

**Qué hace**
- Sin sesión, `/academy/` y el bloque de lecciones de la portada enseñan las tarjetas difuminadas, con `inert` y `aria-hidden` (no se pulsan, no se enfocan y el lector no las oye). Encima, un recuadro con un candado SVG, «Las lecciones se abren con tu cuenta gratuita», «Es gratis…», «Crear cuenta gratis» (`/acceso?volver=/academy/`) y «Ya tengo cuenta: entrar» (`/acceso?volver=/academy/&vista=entrar`).
- El HTML nace bloqueado. `assets/academy-candado-20261108.js` lo abre solo si `RWADAR_ACCESO.verificar()` (la pasarela de siempre, `/api/acceso/sesion`) devuelve una cuenta. Con un 401 o una respuesta rara, sigue igual. Si la red o el servicio fallan, sigue bloqueado con «No hemos podido comprobar tu sesión. Recarga la página». Al volver con «Atrás» (caché del navegador) pregunta otra vez. En el WebView del tutorial de la app no pregunta.
- Hoja y script nuevos con fecha 20261108, compartidos por las dos páginas. El HTML sale de `htmlCandado` en `rwadar-academy.js`. Con `"publico"` no hay candado.
- `acceso.js`: `vista=entrar` abre «Entrar» cuando se llega desde la Academy.
- El tutorial 3D sigue nítido y público. La puerta del servidor de las lecciones no cambia. La app no cambia: ya exige cuenta para todo (`AccesoObligatorio`).

**`volver`, comprobado en el código**
- Tras entrar con la contraseña: `regresar()` lee `volver=/academy/` y va a `/academy/`, que se abre.
- Tras crear la cuenta: no se entra sola. El índice no guarda vuelta. Si después se pulsa «Entrar con mi cuenta» en esa misma pestaña, vuelve a `/academy/`.
- Tras confirmar el correo: el enlace lleva a la raíz y de ahí a `/acceso`. «Continuar con esta cuenta» deja la sesión y va a la lección guardada o, si no hay, a `/academy/#cuenta-confirmada`, que se ve abierta y con «Cuenta confirmada: Academy desbloqueada».

**Pruebas**
- Nuevo `rwadar-acceso/academy-candado-navegador.test.mjs`, con 12 pruebas: el HTML, el script en una VM con la pasarela de verdad y Chromium con el worker local (incluye entrar desde el candado). La parte de Chromium se omite si no hay Playwright, como en CI.
- Dos pruebas más en `alta-avisos-navegador.test.mjs` (`vista=entrar` y la vuelta tras el alta).
- Ajustadas las pruebas de hojas y scripts de la portada (`probar-web.mjs`, `probar-web-escritorio.mjs`). `comprobar-publicado.mjs` comprueba ahora que el índice llega bloqueado.
- `npm test` de la raíz termina con código 0: web 642/0, móvil 491/0 con 2 omitidas, acceso 231/231. El guardián de la OTA con la base `fa30779…` da `ok`.

**Pendiente (Víctor):**
- Publicar la web (preview y producción) cuando lo autorice.
- `idioma-en.js` solo suma textos de la web que la app no enseña, así que no hace falta OTA por esto.

## 7 de noviembre de 2026 (1) · Claude · ahorro de minutos, vigilante diario, copias, correo Lettermint, textos legales

Víctor: «todo lo que puedas hacer tú, todo lo haces». Rama `claude/apanarse-0711`. Lo hicieron agentes por zonas, con revisión adversarial: se confirmaron 22 de 29 hallazgos y se corrigieron todos. `npm test` de la raíz termina con código 0 (web 641/0, móvil 491/0 con 2 omitidas, acceso 217/217, `.github` 43/43, avisos 275/0).

**Minutos de GitHub Actions**
- `ci.yml` ya no corre al unir a main: solo en los PR y a mano.
- Si el PR solo toca `docs/**` o `.md` de la raíz que no lee ninguna prueba, se salta la batería (`.github/cambios-ci.sh`). gitleaks corre siempre.
- Los 4 flujos de QA viejos (1.4.0 y 1.4.1) pasan a `.github/qa-archivo/`.
- `compilar-app.yml` usa `upload-artifact` v7.0.1.

**Vigilante diario** (`vigilante.yml`, 05:17 UTC)
- Comprueba la caducidad del catálogo, `security.txt`, `version-android.json`, la web y los fallos de pg_cron de las últimas 48 h.
- Un fallo que ya se corrigió sale en verde.
- Cada fallo lleva «Qué hacer:» en llano.

**Copias**
- `copia-seguridad.yml` admite el modo «prueba» y la cartera (solo en prueba, nunca se sube).
- `copia-seguridad.sh` detecta FORCE RLS y compara filas.
- Nuevo `ensayo-restauracion.yml`: restaura la última copia en un Postgres de usar y tirar, con los registros del servidor apagados, y solo enseña recuentos.

**Correo**
- Nuevo flujo «Correo Lettermint» (`correo-lettermint.yml` y `.sh`) con `prueba-correo` y `sincronizar-bajas`. Está apagado hasta la ronda 2.
- TLS obligatorio (`PGSSLMODE=require`) en todos los flujos que usan `SUPABASE_DB_URL`.

**Web**
- `_routes.json` saca `/assets/*` del worker para ahorrar cupo de Functions; `/academy/*` sigue dentro.
- `_headers` pasa a `Referrer-Policy: no-referrer`, igual que el worker.
- `comprobar-publicado.mjs` prueba que `/assets/../academy/…` no abre una lección.

**Legal 5.3**
- «Datos comprobados a favor».
- El botón dice «Ver oferta en X» solo si se contrata hoy desde España **y** está supervisada; en los demás casos dice «Ir a la web del proveedor (sales de RWAdar)».

**Privacidad**
- El «latido» de Firebase, en la web y en la app.
- El registro de actividades, al día.

**Otros**
- Bandeja de avisos `AVISOS_BANDEJA_REMOTA`, apagada.
- Noticia del 05/11 corregida (Casa de Outeiro).
- Nuevos `BRECHAS-DE-DATOS.md`, los DPA de Netlify y Proton en `encargados/` y el borrador del formulario de Lettermint.

**Necesita OTA:** `App.js`, `Ofertas.js`, `idioma-en.js` y `noticias-contenido.js`. El guardián lo permite con la base `fa30779…`.

**Pendiente:**
- La LSSI 22.2 sobre el latido, antes de encender el push.
- Para que el correo de fallo del vigilante le llegue a Víctor: Actions › Vigilante diario › Disable y luego Enable.
- `rest-cerrada` y el vigilante no se han probado contra el Supabase real.

## 6 de noviembre de 2026 (8) · Claude · plan para encender los avisos (orden decidido)

Víctor: «Hacemos lo que tú como CEO creas que es mejor». Orden decidido en [`PLAN-CEO-2026-11-06.md`](PLAN-CEO-2026-11-06.md):
1. Correo propio con Lettermint. Quita el Gmail sin contrato, que la revisión legal marcó como infracción grave, y desbloquea los avisos.
2. GitHub Team.
3. Notificaciones del móvil, con prueba en un Android físico.

Coste: unos 60 $ al año.

El plan va por rondas:
- Ronda 1, Víctor: dominio, Lettermint y GitHub Team.
- Claude: Vault, privacidad y publicar.
- Ronda 2, Víctor: plantillas y SMTP de Supabase Auth.
- Claude: prueba real, encender el correo y la casilla.
- Ronda 3: el push.

## 6 de noviembre de 2026 (7) · Claude · GitHub: decisión de pasar a una organización con GitHub Team

Víctor: «Decide tú lo mejor para el proyecto» (el hueco de GitHub sin contrato de encargo).

**Decisión: opción A**, organización `rwadar` con **GitHub Team** (4 $ al mes) y el «GitHub Customer Agreement», que incluye el DPA. Motivos, comprobados en las páginas oficiales:
1. El DPA de GitHub solo se aplica a Team y Enterprise. Una organización gratuita no basta.
2. Supabase gratuito no hace copias, así que las de GitHub son las únicas. Sacar de GitHub los datos personales dejaría las cuentas sin copia.
3. Es lo más barato que cierra el hueco. Supabase Pro cuesta 25 $ al mes y no quitaría los flujos de GitHub.
4. Al trasladar el repositorio se conservan los secretos y las direcciones redirigen. Solo los flujos antiguos de pruebas de la 1.4.0 y la 1.4.1 nombran `victorJorques/RWADAR`, y ya no se usan.

`RWAdar-downloads` se queda en la cuenta personal: es público, no trata datos de usuarios y las apps instaladas usan su dirección exacta.

**Corrección del README de encargados:** decía que GitHub no tenía la clave de las copias. Sí la tiene, porque `COPIA_CLAVE` es un secreto de GitHub.

**Pendiente de Víctor** (pasos en `docs/legal/encargados/README.md`, «GitHub · hueco»):
1. Crear la organización con Team.
2. Firmar el «Customer Agreement».
3. Trasladar `RWADAR`.
4. Instalar Claude y Codex en la organización.
5. Probar la copia de seguridad.

Mientras tanto, las copias siguen como están.

## 6 de noviembre de 2026 (6) · Claude · app 1.4.2 publicada; base de OTA a la 1.4.2; migración 31 aplicada; web publicada

**Lo que se hizo:**
- **App 1.4.2 (código 24).**
  - Compilada en EAS desde `main` `fa30779f7d1d671f56b5f711cde9cac9eb090310` («Compilar app», run 42201003691).
  - APK: SHA-256 `89aeee5a76cb4e702590088a98d9b3688613131b59d908bf11a5e1ca081108e7`, 88.073.983 bytes, misma firma de siempre (`f506dea7…`).
  - Publicada en [RWAdar-downloads v1.4.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.2) con `version-android.json`, `SHA256SUMS.txt` y `QA-1.4.2.json`.
  - Comprobado desde fuera: el `version-android.json` de la última versión es el exacto, y el APK público coincide byte a byte.
- **Prueba en emulador.** Flujo nuevo `android-142.yml` en RWAdar-downloads; [ejecución que publicó](https://github.com/victorJorques/RWAdar-downloads/actions/runs/42207814749). Android 15 con Google Play:
  - permisos: los de la 1.4.1 más `POST_NOTIFICATIONS`, `c2dm…RECEIVE` y `WAKE_LOCK`;
  - Firebase sin arranque automático, del proyecto `rwadar-14e3d`, e icono de notificación;
  - la 1.4.1 se instala y se abre; la 1.4.2 se instala encima sin desinstalar y se abre dos veces en frío sin cierres;
  - el permiso de notificaciones no se concede solo;
  - red: un proxy del sistema apunta cada servidor. Con la 1.4.2 abierta solo salen `u.expo.dev`, `github.com`, `release-assets.githubusercontent.com` y las comprobaciones de Android. **Ninguna conexión a Firebase.**
  - Los dos primeros intentos de grabar la red no valían, y el flujo los paró como debía. Con `-tcpdump` el wifi simulado no se graba, y sin wifi no hay internet. Quedó el proxy.
- **Base de OTA.** `ota-android.yml` pasa a la 1.4.2 (`fa30779…`). El guardián da `ok` con runtime `1.4.2(24)`. Desde ahora las OTA van a la 1.4.2. La 1.4.1 sigue funcionando y avisa de la versión nueva.
- **Migración 31.** Aplicada en producción con copia previa: ensayo (run 42204084669) y aplicar (run 42204422901). Verificadores 30 y 31 «OK». El correo sigue apagado.
- **Web.** Sello (PR #81) y publicada en revisión y en producción (runs 42204901001 y 42205768477). La privacidad nombra a Lettermint. Las lecciones siguen pidiendo cuenta: 303 a `/acceso`.

**Para encender el push, más adelante:**
1. Privacidad del push en la web y en la app, incluido el «latido» de Firebase; ver `APK-1.4.2-NOTIFICACIONES.md`.
2. Revisión legal de ese texto.
3. OTA con `AVISOS_NOVEDADES_REMOTOS = true`.
4. Prueba en un **Android físico**, porque Víctor usa iPhone.
5. `activar-push`.

**Pendiente menor.** En `main` hay cambios de texto de Lettermint en la app (ocultos mientras el correo esté apagado) que todavía no han ido por OTA. Irán en la próxima.

## 6 de noviembre de 2026 (5) · Claude · correo de los avisos con Lettermint (31, apagado), contratos de encargado, permiso de Eric y manual

Rama `claude/avisos-pendientes-0611`. Órdenes de Víctor: «haz todo lo que puedas, apáñate, te doy permiso de todo», «ya tenemos permiso de eric por escrito».

**Proveedor de correo: Lettermint en lugar de Brevo.** Brevo mete píxel de apertura en el correo transaccional (revisión legal). Lettermint B.V. es de Países Bajos y guarda los datos en la UE. No hace seguimiento por defecto, y además se fuerza en cada correo.

**Base de datos.** `rwadar-app/db/31_correo_lettermint.sql`, con su copia idéntica en `supabase/migrations/`, sustituye `correo_mensaje`, `leer_correos` y `enviar_correos`:
- envía a `api.lettermint.co` con `Idempotency-Key` en la cabecera HTTP (la misma en cada reintento) y `settings` con `track_opens` y `track_clicks` en `false`;
- usa la ruta `broadcast` solo para anuncios; el slug está sin confirmar;
- respuestas: 202 → aceptado; 409 → incierto, sin reenviar;
- pie con la dirección postal, que ya está publicada en el aviso legal y la exige la política de uso de Lettermint;
- el correo sigue **apagado**.

Archivos de apoyo:
- verificador 31;
- `31_correo_lettermint_guardar.sql`: guarda el token y el remitente en Vault sin que el token quede en los registros de Postgres;
- `activar_correo` exige la 31.

En el flujo «Avisos a registrados (base)», acciones nuevas `ensayo-31`, `verificar-31`, `aplicar-31` y `guardar-correo`. Plantillas de Auth (confirmar y la nueva `recuperar-acceso.html`) con la dirección postal.

**Web y app.**
- «Información básica» y Privacidad nombran a Lettermint.
- Privacidad de la web (apartado 8, proveedores), en condicional.
- Párrafo de Privacidad de la app, oculto mientras el correo esté apagado.

**Revisión independiente.** 4 enfoques, cada hallazgo verificado por otro agente: 18 confirmados y todos corregidos. Lo más importante:
- token en los registros de Postgres;
- dirección postal en las plantillas de Auth;
- prueba de idempotencia dentro de 25 minutos;
- privacidad publicada **antes** de pasar el SMTP de Auth a Lettermint (paso 5.8, con las frases ya escritas).

**Contratos de encargado.** [`docs/legal/encargados/`](../legal/encargados/): PDF fechados de los DPA de Supabase, Cloudflare, Google Firebase, Expo, GitHub y Lettermint (y de Postmark y Resend, descartados), con README y RAT v2.
- Firebase: proyecto `rwadar-14e3d`, condiciones aceptadas el 06/11/2026.
- **Hueco real:** GitHub gratuito no tiene DPA, y sus runners ven datos en claro en las copias de seguridad. Víctor elige: organización con GitHub Team y Customer Agreement, o sacar esos datos de los runners.

**Eric.** Licencia escrita recibida por WhatsApp; Víctor confirma que existe y la conserva (`docs/academy/VISTO-BUENO-ERIC-2026-11-06.md`). No se copia el texto.

**Manual PDF** (`docs/manual/`). La página 9 dice que la cuenta abre la Academy con 9 lecciones. Quita «baja en un clic» y «cuando una plataforma que vigila cambie» (revisión legal 5.13). Las demás páginas quedan idénticas píxel a píxel.

**Dominio.**
- rwadar.com y rwadar.io están aparcados en Afternic por un tercero.
- rwadar.app y rwadar.es parecen libres; no se ha comprado nada.

**Pruebas:**
- avisos: 248 correctas de 248;
- `npm --prefix rwadar-app test` sin fallos;
- app: 489 pruebas, 487 correctas, 2 omitidas y 0 fallos (con la 1.4.2 ya en `main`);
- `npm test` de la raíz sin fallos;
- diccionarios idénticos.

**Pendiente de Víctor**, paso 5 del contrato en orden:
- comprar el dominio;
- cuenta y proyecto en Lettermint y DNS;
- secreto `LETTERMINT_API_TOKEN` en GitHub;
- `aplicar-31` y `guardar-correo`;
- privacidad publicada y SMTP de Auth;
- pedir a Lettermint que quite su enlace de baja de la ruta de difusión;
- prueba real, y solo entonces `activar-correo`.

## 6 de noviembre de 2026 (4) · Claude · APK 1.4.2: Firebase hecho, revisión aplicada, unir y compilar

Firebase y EAS ya están listos. Los dejó la sesión local de Víctor:

- proyecto `rwadar-14e3d` (plan Spark), condiciones aceptadas el 06/11/2026;
- app `com.rwadar.app`;
- variable `GOOGLE_SERVICES_JSON` (archivo, secreta, `production`);
- clave FCM V1 de `firebase-adminsdk-fbsvc@rwadar-14e3d…` asignada a la app.

Detalle en [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md),
apartado «Al día (06/11/2026, tarde)».

- **Revisión independiente de la rama (3 enfoques, cada hallazgo verificado).**
  Cambios aplicados:
  - icono propio de notificación (`assets/notification-icon.png`);
  - `RECEIVE_BOOT_COMPLETED` vuelve a estar bloqueado, porque no hay
    notificaciones locales programadas;
  - la guía parte la prueba en dos: emulador antes de publicar, Android
    físico antes de encender el push;
  - queda anotado el «latido» de Firebase, para la privacidad antes de
    encender el push.
- **Pruebas:** `npm --prefix rwadar-movil test` da 489, de ellas 487
  correctas, 0 fallos y 2 omitidas. `expo config --type introspect` enseña el
  icono `notification_icon` y `RECEIVE_BOOT_COMPLETED` retirado.
- **Emulador y publicación:** nuevo flujo `android-142.yml` en
  RWAdar-downloads (PR #1 unido). No usa cuentas ni secretos.
- **Pendiente:** unir a `main`, «Compilar app» `editorial`, `android-142.yml`
  sin publicar y después con `publicar=si`, y cambiar la base de OTA el mismo
  día.
- **Para encender el push, más adelante:** privacidad de web y app, revisión
  legal del «latido», OTA con `AVISOS_NOVEDADES_REMOTOS = true` y prueba en un
  **Android físico**. Víctor usa iPhone.

## 6 de noviembre de 2026 (3) · Claude · APK 1.4.2 con notificaciones: rama preparada (sin unir, sin compilar)

Rama `claude/apk-142-notificaciones`, sobre `main`, un solo commit. **Sin push,
sin merge, sin EAS, sin Firebase, sin Supabase.** Estado y pasos que faltan:
[`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md), apartado
«Estado: rama preparada».

- **Cambios:** `rwadar-movil/app.json` (1.4.2, código 24, sin bloquear
  `POST_NOTIFICATIONS`, `c2dm…RECEIVE`, `WAKE_LOCK` ni
  `RECEIVE_BOOT_COMPLETED`, `pushDeliveryEnabled: true`, plugin local),
  `rwadar-movil/app.config.js` (Firebase solo desde la variable de EAS
  `GOOGLE_SERVICES_JSON`; falla en EAS Build sin ella),
  `rwadar-movil/plugins/firebase-sin-autoarranque.js` (las dos `meta-data` de
  Firebase en `false`), `.easignore`, `LEEME.md` y pruebas (`flujo`,
  `actualizaciones-app`, `avisos-ui`, `empaquetado`, y nuevas `app-config` y
  `firebase-sin-autoarranque`).
- **Pruebas:** `npm --prefix rwadar-movil test` (486 + 2 omitidas, 0 fallos),
  `copiar-idiomas-web.cjs --comprobar` y `expo config --type introspect` sin
  red (runtime `1.4.2(24)`, las dos claves en `false`, sin
  `googleServicesFile` sin la variable).
- **Guardián de OTA con la base de la 1.4.1:** rechaza la rama, como debe
  («Requiere revisión nativa y otro APK»). **No unir a `main` hasta el día que
  se compile:** desde ese merge no se puede enviar OTA a la 1.4.1.
- **Sin tocar, a propósito:** `AVISOS_NOVEDADES_REMOTOS = false`, la base por
  defecto de `ota-android.yml` (se cambia el día que se publique el APK) y la
  privacidad de la web (frases de «Al encender el push», antes de encenderlo).
- **Pendiente de Víctor:** Firebase y `google-services.json`, la variable de
  EAS, la credencial FCM V1; después, merge y «Compilar app» desde `main`,
  prueba en móvil real, release `v1.4.2` con `version-android.json` y cambio
  de la base de OTA.

## 6 de noviembre de 2026 (2) · Claude · publicado: Academy con cuenta y 9 lecciones; migración 30 aplicada (avisos apagados); revisión legal

Órdenes de Víctor del 06/11: «Eric da el visto bueno», «La revisión legal hazla
tú», «3 hazlo tú» (aplicar la 30), «Sí, publica hoy», «Publicar las 9 ya» y
tutorial 3D «público en ambos». PR #74.

- **Revisión legal** hecha por Claude, con contraste adversarial:
  [`legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](../legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md).
  Sus cambios obligatorios ya están en el código:
  - permiso `novedades-v2-2026-11-06` con el texto nuevo;
  - información básica junto a la casilla y en Perfil;
  - historial del permiso, bloqueado 3 años tras borrar la cuenta;
  - `rwadar_novedades.baja_por_correo`;
  - pie con el responsable;
  - riesgo delante en el aviso de ofertas;
  - canales Android `cuenta` y `novedades`;
  - condiciones mínimas de la cuenta y `/condiciones` (antes 404).

  Registro de actividades: [`legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`](../legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md).
- **Academy:** las 9 lecciones publicadas; el tutorial 3D, público otra vez.
  Visto bueno de Eric en
  [`academy/VISTO-BUENO-ERIC-2026-11-06.md`](../academy/VISTO-BUENO-ERIC-2026-11-06.md).
- **Base de datos:** flujo nuevo «Avisos a registrados (base)»
  (`.github/workflows/avisos-base.yml`): `ensayo-30`, `aplicar-30`,
  `verificar-30` y las activaciones, con copia previa y la palabra `AVISOS`.
- **Publicado y aplicado (06/11, ~03:00-03:12 UTC):**
  - PR #74 (todo), #75 (diagnóstico), #76 (sello) y #77 (verificador). Las
    cuatro pasaron CI.
  - «Publicar web» en preview y producción. Comprobado en
    https://rwadar.pages.dev con curl y Playwright (390 y 1366 px):
    - las lecciones sin sesión dan 303 a `/acceso?volver=…`;
    - una lección inventada da 404;
    - `/condiciones` da 301;
    - `/baja` da 200;
    - «9 de 9 lecciones disponibles»;
    - el tutorial 3D sigue público;
    - sin errores de JS;
    - el catálogo intacto: 22 ofertas y 25 plataformas.
  - «OTA Android» sobre la base `c1f7106` (1.4.1(23)), correcta.
  - **Migración 30 aplicada en Supabase** con «Avisos a registrados (base)»:
    primero el ensayo y después aplicar, con copia cifrada guardada 35 días.
    El verificador dice «RWAdar 30 OK: casilla del alta inactiva, correo
    apagado, push apagado, aviso automático de ofertas apagado, 0 anuncios
    retenidos, sin reloj de envío, reloj diario de limpieza». Las 9 cuentas
    existentes tienen preferencias con `novedades = false`.
  - **El primer ensayo paró**, y fue lo correcto: Supabase abre a todos los
    roles las colas de pg_net (las concede `supabase_admin`) y `postgres` no
    puede cerrarlas. Vault sí está cerrado.
    - Desde fuera, la API solo publica `public` y `graphql_public`
      (PGRST106 para `net` y `vault`), y pg_graphql está apagado.
    - Ahora el verificador para si Vault se abre y solo avisa de las colas.
    - Antes de encender el correo hay que repetir esa comprobación (contrato,
      paso 5).
- **Pendiente de Víctor:**
  - dominio propio y un proveedor de correo sin píxel (Brevo no lo quita en
    los transaccionales);
  - contratos de encargo en `docs/legal/encargados/`;
  - Firebase y credencial FCM V1 en expo.dev para compilar el APK 1.4.2;
  - licencia escrita de Eric.

## 6 de noviembre de 2026 · Claude · lecciones 8 y 9 de la Academy publicadas en el repositorio (sin publicar la web ni enviar OTA)

Orden de Víctor del 06/11/2026: «Publicar las 9 ya». Rama `lecciones-8-9`,
sobre `claude/avisos-y-academy-registro` (`fe3a9d2`). **Nada publicado, sin
Supabase, sin EAS, sin push.**

- **Academy:** `expediente-de-tokenizacion` (8) y
  `despues-de-emitir-ciclo-de-vida` (9) pasan a `"publicado"` en
  `academy.json` y entran en `PAGINAS_ACADEMY`. Regenerado con
  `node rwadar-academy.js`: sus dos páginas, el índice (9 de 9, ninguna
  «Próximamente»), «Lección N de 9» en todas, la portada («9 de 9 lecciones
  disponibles», «9 lecciones gratis en Academy») y `academy-contenido.js` de la
  app. Siguen en modo `"cuenta"`: `noindex`, fuera del `sitemap.xml` (sin
  cambios) y 303 a `/acceso` sin sesión. Revisión legal del 02/10/2026, válida
  hasta el 02/04/2027 (el generador no avisa).
- **Destinos que no existen:** el Evaluador de Viabilidad y la checklist del
  expediente salen como «Próximamente» en la web y en la app (comprobado y
  fijado en pruebas).
- **Inglés:** el diccionario cambia «7 de 9» por «9 de 9 lecciones
  disponibles» y añade «Preparación · 15 min» y «Post-emisión · 17 min»
  (copiado a la web con `copiar-idiomas-web.cjs`).
- **Pruebas adaptadas** a 9 publicadas y 0 «Próximamente»: `probar-web.mjs`,
  `probar-precarga.cjs`, `rwadar-acceso/academy-cuenta.test.mjs`,
  `rwadar-acceso/comprobar-publicado.test.mjs` y
  `rwadar-movil/tests/academy.test.cjs`. Siguen exigiendo 404 a una lección
  inventada, y el camino «Próximamente» se prueba con una Academy simulada.
  `.github/comprobar-publicado.mjs` no fija lecciones: no cambia.
- **Verificación de producción de la precarga** (`rwadar-precargar-imagenes.js`,
  `verificarHTTP`): sin «Próximamente» ya no pedía ningún 404 de la Academy;
  ahora pide también `/academy/rwadar-comprobacion-leccion-inexistente` y exige
  404 (la misma ruta que usa `comprobar-publicado.mjs`).
- **Pruebas:** `node rwadar-academy.js --comprobar` (9 de 9), `npm run
  test:web` (web 631, páginas 69, precarga 39), `npm run test:acceso` (201),
  `npm --prefix rwadar-movil test` (472 + 2 omitidas), `npm run test:tools`,
  `npm run test:qr` y guardián de OTA de la 1.4.1 con la base `c1f7106`:
  `ok:true`.
- **Se quedan como están, a propósito:** la noticia del 05/10 («Siete
  lecciones gratuitas…», en `noticias.json`, `cambios.html`, `novedades.xml` y
  su traducción), los flujos antiguos de QA de Android
  (`.github/pruebas-android/*`, esperan «de 7 lecciones leídas» del APK de
  entonces) y los informes con fecha.
- **Pendiente:** publicar la web y enviar la OTA, con permiso de Víctor (y lo
  que diga la entrada siguiente sobre unir la Academy con cuenta a `main`). El
  manual corregido de Eric (`docs/manual/`, sin publicar) aún dice «siete
  lecciones publicadas… y dos más en preparación»: cambiarlo exige regenerar el
  PDF con `corregir-manual.py`.

## 5 de noviembre de 2026 (8) · Claude · avisos a registrados y Academy con cuenta (preparado, sin aplicar ni publicar)

Petición de Víctor: «al registrarse, al sacar una nueva actualización o nuevas
ofertas se enviará un correo de aviso y una notificación a la aplicación» y
«que el apartado de Academy se desbloquee solo a los que se han registrado».
Rama `claude/avisos-y-academy-registro` (sin PR). **Nada aplicado en Supabase,
nada publicado, sin EAS.** Plan, decisiones y pasos de activación:
[`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).

- **Academy con cuenta (web).** El worker (`rwadar-acceso/servidor.mjs`) cierra
  `/academy/<slug>`: sin sesión, 303 a `/acceso?volver=…` (401 si no es HTML),
  lecciones no publicadas 404, fallo de Supabase 503 (nunca manda a entrar),
  con sesión `private, no-store`, `noindex` y `Vary: Cookie`. El índice
  `/academy/` sigue público. Interruptor `"acceso"` en `rwadar-academy/academy.json`.
  El tutorial 3D sigue público en la web (decisión de Víctor del 06/11/2026;
  se quitó la puerta que se le había puesto). En la app ya pedía cuenta para
  todo desde la 1.4.1. Las capturas de Víctor (iPhone) eran de la web
  instalada en la pantalla de inicio.
- **Avisos (todo apagado).** Migración `rwadar-app/db/30_avisos_registrados.sql`
  (esquema `rwadar_novedades`; copia en `supabase/migrations/20261105200000_…`):
  bienvenida al confirmar; avisos de ofertas (disparador del catálogo, nacen
  **retenidos**) y de actualizaciones (flujo manual «Avisar novedad»); correo
  por Brevo y push por Expo con pg_net; baja sin cuenta (`/baja`); lista de
  avisos dentro de la app. El permiso es una casilla aparte, sin marcar, que se
  guarda al confirmar el correo y solo si `casilla_activa`. Interruptores:
  `AVISOS_NOVEDADES_REMOTOS` en `acceso.js`, `rwadar-20260820.js`,
  `servidor.mjs` y `rwadar-movil/lib/modo-local.js`, todos `false`.
- **Alta:** la casilla obligatoria dice ya «Tengo 18 años o más…» (web y app).
- **Push del sistema:** necesita el APK 1.4.2 (permisos y Firebase). Guía:
  [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md). La rama no toca
  `app.json`: la OTA a la 1.4.1 sigue compatible (guardián `ok:true`).
- **Revisión:** diseño revisado antes de programar (legal, seguridad,
  operaciones); dos revisiones independientes del código, cada hallazgo
  verificado por dos agentes, y corrección de todo lo confirmado. La segunda
  comprobó que la primera ronda de arreglos funcionaba y cazó, entre otros:
  que «apagar» desactivaba la casilla del alta para siempre (ahora hay
  `30_avisos_registrados_apagar_casilla.sql` aparte); que un alta anterior a
  la casilla y confirmada después daba permiso (ahora se exige
  `confirmation_sent_at` ≥ `casilla_activada_el`); que sin envío activo no se
  limpiaba nada (reloj diario `rwadar-novedades-limpieza`), y una carrera
  entre «Borrar datos» y la renovación diaria del móvil. Lo más grave que se cazó: el `_worker.js`
  exportaba un texto y Cloudflare no lo habría desplegado (comprobado con
  workerd: «Incorrect type for map entry … not of type 'function or
  ExportedHandler'»), y el comprobador posterior a publicar habría fallado
  siempre en la vista previa.
- **Pruebas (al cerrar):** `npm test` en verde: web 619, acceso 201, móvil
  472 + 2 omitidas, avisos 175, el resto de la base sin fallos. Guardián de
  OTA de la 1.4.1: `ok:true`. El worker
  compilado arranca en workerd (Miniflare) y da 303/404/200 donde toca.
  Capturas en local con el arnés `rwadar-acceso/probar-worker-local.mjs`.
- **Copias:** `copia-seguridad.sh` añade `rwadar_novedades`. La cartera
  (`rwadar_cuentas_privadas`) sigue fuera a propósito: lleva FORCE RLS y, si
  `postgres` no puede saltarla, fallaría la copia entera, también la previa de
  «Aplicar catálogo». Incluirla es otro cambio, a probar antes con una copia manual.
- **Ojo al unir a `main`:** el siguiente «Publicar web» del ciclo del catálogo
  publicaría el cierre de la Academy. Antes, visto bueno escrito de Eric (su
  especificación decía «sin cuentas») y permiso de Víctor, o poner
  `"acceso": "publico"` (ver `rwadar-academy/LEEME.md`: hay textos que
  revertir a mano).
- **Pendiente de Víctor, cada paso con su permiso:** revisión legal (casilla,
  privacidad y avisos de ofertas); aplicar la 30 en el SQL Editor con copia
  previa (nunca `db push`); plantilla de Auth y `activar_casilla`; encender los
  interruptores y publicar web y OTA; dominio propio y Brevo para el correo;
  Firebase y APK 1.4.2 para el push; decidir si se publican las lecciones 8 y 9.

## 5 de noviembre de 2026 (7) · Claude · entrega 2026-11-05.2 y remates publicados: Supabase, web y app

Orden de Víctor: «Arregla todo, no dejes nada para mañana»; retiradas decididas
por él: «Retirar las dos hoy».

- **PRs unidas:** #70 (remates: transparencia 48/48 al 05/11, Hausera en
  Orihuela Costa, datos personales recortados en copias antiguas), #71 (entrega
  2026-11-05.2) y #72 (sincronización y sello).
- **Supabase:** «Aplicar catálogo» con `2026-11-05.2` (run 42082712442), tras
  releer como visitante la `cede1f27` a las 18:16 UTC. En línea, `88d5a757`:
  25 plataformas, **22 ofertas (8/13/1)**, sin BILLA ni Casa de Outeiro, Pax Gold
  con https://www.paxg.com/ y el acceso de Spiko con lo que muestra la CNMV.
- **Web:** «Publicar web» en preview (run 42083927291) y producción (run
  42084230282). Comprobado con curl en https://rwadar.pages.dev: revisión
  `88d5a757`, `/ofertas/casa-de-outeiro` y `/ofertas/terreno-con-arrendamiento-billa`
  dan 404, Pax Gold enlaza a paxg.com, Spiko cita a Aldana Capital y Hausera dice
  «Orihuela Costa · Alicante».
- **App:** OTA Android (run 42083933359), correcta, base c1f7106 (1.4.1(23)).
- **Pruebas:** `npm test` en verde tras sincronizar (web 601, móvil 410 + 2
  omitidas, acceso 146, base de datos sin fallos).
- **Pendiente (solo Víctor):** borrar en GitHub la rama `claude/catalogo-2026-11-05`.
  Lleva copias sin recortar con nombres de personas, no se unió a `main` y la
  herramienta no puede borrar ramas. Los nombres siguen en el historial de
  `main` de ciclos anteriores; borrarlos de ahí exigiría reescribir la historia
  y Víctor tendría que pedirlo expresamente.

## 5 de noviembre de 2026 (6) · Claude · entrega 2026-11-05.2 revisada; registro de Casa de Outeiro corregido

Misma orden de Víctor: «Arregla todo, no dejes nada para mañana». Rama
`claude/catalogo-2026-11-05-2`.

- **Revisión independiente** del SQL y de la entrega:
  [`REVISION-ENTREGA.md`](../../rwadar-app/data/verificaciones/2026-11-05.2-v2/REVISION-ENTREGA.md).
  Veredicto: aprobado con cambios. El SQL se puede aplicar tal cual.
- **El cambio obligatorio, hecho.** Era solo de documentación, en la retirada
  de Casa de Outeiro.
  - En la plataforma hay dos documentos del 30/10 que citan el 31/03/2027: la
    ficha de datos (263) y los anexos (264). El registro decía que nada más que
    la ficha lo confirmaba. Ahora lo dice bien: la campaña no lo recoge.
  - El 264 entra entre las fuentes.
  - Texto de la retirada: «sin ampliación registrada en la campaña».
  - El SQL no cambia: su SHA sigue siendo `24073c9f…ba19`, y la revisión,
    `88d5a757`.
- **Pruebas repetidas:** `preparar-entrega.mjs` dos veces (solo cambia el
  contraste); PGlite correcto; ensayo «después de aplicar» en una copia aparte,
  con `npm test` en verde, el 404 del worker para las dos fichas y la OTA
  compatible. El detalle está al final de `REVISION-ENTREGA.md`.
- **Commits:** el de la corrección y el de la revisión con este traspaso.
- **Pendiente:**
  - PR y merge; «Aplicar catálogo» `2026-11-05.2` antes del 12/11 incluido;
    después, `despues-de-aplicar.mjs` y la secuencia del informe (§5); publicar
    la web y enviar la OTA.
  - Para otra entrega:
    - el aval de Pax Gold dice NYDFS, y su web dice OCC;
    - la comprobación de la CNMV de Spiko no mira a Aldana Capital;
    - una nota interna del escaparate aún dice «sin prórroga publicada».

## 5 de noviembre de 2026 (5) · Claude · entrega 2026-11-05.2 preparada (sin aplicar ni publicar)

Orden de Víctor: «Arregla todo, no dejes nada para mañana». Sobre BILLA y Casa
de Outeiro, preguntado hacia las 17:10 UTC: «Retirar las dos hoy». Rama
`claude/catalogo-2026-11-05-2`. Informe en llano:
[`INFORME-ENTREGA.md`](../../rwadar-app/data/verificaciones/2026-11-05.2-v2/INFORME-ENTREGA.md).

- **Qué cambia** (revisión `88d5a757`, sobre la publicada `cede1f27`):
  - salen BILLA y Casa de Outeiro; quedan 22 ofertas (8/13/1);
  - la web de Pax Gold en `public.plataformas` pasa a `https://www.paxg.com/`;
  - el acceso de Spiko dice lo que muestra la CNMV, con dos fuentes nuevas de
    la CNMV.
  - Todo lo demás, igual. SHA del aplicador: `24073c9f…ba19`. Hay que aplicarla
    antes del 12/11 incluido.
- **Commits:** `205cead` (la entrega) y el de ensayo, informe y traspaso.
- **Pruebas:**
  - PGlite: 22 pruebas, de ellas 12 de funcionamiento y 10 casos de fallo que
    no dejan nada a medias;
  - `npm test` en verde antes de aplicar y en el ensayo «después de aplicar»
    (copia aparte);
  - worker: 404 para las dos fichas;
  - OTA compatible;
  - gitleaks sin hallazgos.
- **Fuera del encargo:**
  - una segunda fuente de la CNMV (Spiko Finance, n.º 5325), para que ese dato
    tenga la suya;
  - la ficha editorial de las dos sale ya, como con mF-ONE;
  - una prueba de la app ya no exige 24 ofertas fijas.
- **Pendiente:**
  - revisión independiente del SQL; PR y merge; «Aplicar catálogo» `2026-11-05.2`;
  - después, `despues-de-aplicar.mjs` y la secuencia del informe (§5);
  - publicar la web y enviar la OTA (cambian la transparencia y las
    ilustraciones de la app).
  - Para otro día: el «aval» de Pax Gold aún dice NYDFS, y su web dice OCC.

## 5 de noviembre de 2026 (6) · Claude · datos personales: segunda pasada pedida por la revisión independiente (sin publicar)

Misma orden de Víctor («Arregla todo, no dejes nada para mañana») y misma rama
`claude/remates-1105`. El revisor independiente de los remates encontró datos
personales que la primera pasada (`a5b6934`) no había recortado. **Sin tocar
Supabase, sin publicar la web y sin OTA.** Commit `ef893e6`.

- **IOD Occasio (Alius), copias del 01/11** (`2026-11-01-v2/grupos/alius-hausera/fuentes/iod-*.txt`):
  el FDF y la escritura de emisión llevaban los nombres de dos socios personas
  físicas (uno es también el administrador único), de la administradora de
  Alius Capital y de cuatro notarios; la escritura, además, la dirección y el
  estado civil de una persona física y el domicilio «a estos efectos» del
  administrador (calle, portal y piso, el mismo que el domicilio social).
  Ahora dicen «[nombre recortado]» y «[domicilio recortado]», sin estado civil
  (se deja el municipio). La primera línea de cada copia dice qué se recortó.
  En `inventario-consultas.json` el sha256 es el del PDF original: solo
  cambia la nota, que antes decía «datos personales omitidos» cuando solo
  faltaban los DNI y el correo.
- **Copia de exa de IOD del 23/10** (`docs/investigacion/2026-10-23/primaria/iod-aktionariat-documentos-exa.md`):
  los mismos nombres, el correo personal del administrador y los dos
  firmantes del contrato de Aktionariat que copia, recortados. En
  `huellas-capturas.json`, sha256 y bytes de la copia recortada;
  `sha256Captura` guarda la huella anotada al capturar (46347 bytes, la que
  cita `REVISION-IOD-OUTEIRO-SPIKO.md`, que no se toca). La nota explica que la
  copia que había en Git ya no cuadraba con ella (46346 bytes).
- **Hausera ETI, copias del 05/11** (folleto base y condiciones finales, en
  `grupos/candidatas-espana/fuentes/hausera-eti/` y en
  `revision-independiente/fuentes/candidatas-espana/hausera/`, idénticas dos a
  dos): recortado entero el registro de firma electrónica del final del
  folleto (nombre, correo, IP, ID de sesión y navegador de los dos firmantes),
  el dato familiar de un consejero y, de las dos opciones que dio el revisor,
  **también los nombres de consejeros y titulares reales** (folleto y
  condiciones finales, en inglés, castellano y alemán). Las funciones se
  mantienen («[nombre recortado] is a director and an owner of…»), así que el
  conflicto de intereses se sigue leyendo. En los dos inventarios,
  `sha256`/`bytes` siguen siendo los del PDF original (si se cambiaran,
  dejarían de describir el PDF de la URL); se añaden `sha256Texto`/`bytesTexto`
  (copia recortada) y `sha256TextoCaptura` (copia anterior), y en el de la
  revisión independiente, `textoExtraido`.
- **Aviso de la FMA de 2006** con el nombre de una persona física, que salió
  en el barrido: recortado en la copia de
  `2026-11-03.3-v2/grupos/brickwise-alius-hausera/` (nota en el inventario,
  cuyo sha256 es el del HTML) y en la de Brickwise del 05/11 (sha256 y bytes
  al día, `sha256Captura` con el anterior).
- **Comprobaciones después de recortar:**
  - todos los nombres recortados hoy (los de esta pasada y los de
    `a5b6934`), los correos, las dos IP y los dos ID de sesión: 0
    coincidencias en todos los archivos de Git y en los 6 `.gz`;
  - barrido de las 162 copias de Alius, Casa de Outeiro, IOD y Hausera
    (texto y `.gz`) en busca de correos, IP, rastros de sesión y tratamientos
    («Sr.», «Mr.»…) seguidos de un nombre: solo quedan correos de empresa
    (reclamaciones, protección de datos, contacto) y el de ejemplo
    `tu@email.com`; ninguna IP y ningún rastro de sesión;
  - los 6 JSON tocados son válidos y las 6 huellas nuevas cuadran con sus
    archivos;
  - gitleaks 8.30.1 sobre los 15 archivos cambiados: sin hallazgos;
  - `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso 146, base
    de datos sin fallos); guardián de la OTA contra `c1f7106`: correcto (1.4.1(23)).
- **Pendiente:**
  - lo del traspaso anterior sigue igual: unir la rama a `main` y, con permiso
    de Víctor, publicar la web y enviar la OTA; borrar la rama
    `claude/catalogo-2026-11-05` de origin, que conserva los nombres; las
    copias crudas de la carpeta local (fuera de Git) tampoco están
    recortadas;
  - fuera de estas cuatro plataformas siguen, como hasta ahora en `main`, los
    nombres de consejeros de otros folletos regulados (Backed, Spiko,
    Franklin Templeton), los firmantes en las demás copias de Aktionariat y
    algunos nombres de directivos en las lecturas del radar del 02/11. Si
    Víctor quiere el mismo criterio que en Hausera, hace falta otra pasada.

## 5 de noviembre de 2026 (5) · Claude · remates del día: transparencia, lugar de Hausera y datos personales (sin publicar)

Orden de Víctor: «Arregla todo, no dejes nada para mañana». Rama
`claude/remates-1105` (desde `main`), con push y sin PR. **Sin tocar Supabase,
sin publicar la web y sin OTA.** No toca Billa ni Casa de Outeiro en el
catálogo (se retiran en la entrega `2026-11-05.2`, en otra rama).

- **Transparencia** (commit `8633019`): las cuatro comprobaciones que seguían
  con fecha 03/11 se han vuelto a leer hoy y dicen lo mismo: condiciones
  finales n.º 159 de Backed (Kraken; mismo SHA-256 que el 03/11, solo
  Liechtenstein y Suiza), KID en español de Robinhood (01/07/2026, enlazado
  desde `robinhood.com/eu/es/` y su página legal), BaFin (para «Midas» solo
  la sociedad danesa; para «Midas Software», sin resultados) y aviso legal del
  portal de Boss Info («not subject to prudential supervision»). Solo cambia
  `consultadaEl` a 2026-11-05. Copias de texto y SHA-256 en
  `rwadar-app/data/verificaciones/2026-11-05-v2/remates/inventario-remates.json`
  (los PDF y HTML originales, fuera de Git). Regenerados el bloque de la web,
  `lib/transparencia-contenido.js` y las fichas.
- **Hausera** (commit `42f0f65`): el lugar de la ilustración pasa de
  «Alicante · España» a «Orihuela Costa · Alicante» (Alicante 2 son 14
  viviendas en La Zenia), como «Ribeira Sacra · Lugo». El texto alternativo
  dice «en la costa de Orihuela (Alicante)». La foto sirve igual (edificio
  mediterráneo blanco con balcones y palmeras, sin nada propio de la ciudad);
  su `prompt` no cambia porque es el que la generó. `generar.mjs`: las 24 webp
  salen idénticas; cambian el manifiesto de la app, el bloque de la web y la
  ficha publicada, y `npm test` reescribe la tarjeta pre-renderizada de
  `rwadar-site/index.html` (commit `d53bf50`). `generar.mjs --comprobar` en verde.
- **Datos personales** (commit `a5b6934`): los nombres recortados hoy en
  `2026-11-05-v2` seguían en copias de `2026-11-01-v2` y `2026-11-03.3-v2`, y
  también en `docs/investigacion/2026-10-23` (incluida la portada de Hausera
  en `.html.gz`). Ahora dicen «[nombre recortado]». En esas copias también se
  recortaron un correo y un teléfono personales y dos NIF que quedaban en el
  texto del FDF de la revisión del 01/11. Inventarios al día (`sha256` de la
  copia recortada y `sha256Captura` con el anterior). El informe con fecha
  `REVISION-IOD-OUTEIRO-SPIKO.md` no se toca.
- **Pruebas:** `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso
  146, base de datos sin fallos). Guardián de la OTA contra `c1f7106`: correcto
  (1.4.1(23)). gitleaks 8.30.1 sobre los 43 archivos cambiados: sin hallazgos.
- **Pendiente:**
  - unir la rama a `main` y, con permiso de Víctor, publicar la web y enviar
    la OTA: hasta entonces, la web y la app siguen enseñando «Alicante · España»
    y las fechas del 03/11;
  - la entrega `2026-11-05.2` también toca `fichas.json`, `fotos.json` y lo
    generado (manifiesto, bloque de la web): al unir las dos ramas, si chocan
    los archivos generados, volver a ejecutar `generar.mjs`,
    `transparencia.mjs` y `node rwadar-fichas.js` en vez de resolverlos a mano;
  - las copias crudas de la carpeta local (fuera de Git) y la rama
    `claude/catalogo-2026-11-05` de origin siguen con los nombres sin recortar:
    borrar esa rama (no se unió);
  - quedan del traspaso anterior: web de PAX Gold en `public.plataformas` y
    texto de acceso de Spiko en el radar.

## 5 de noviembre de 2026 (4) · Claude · investigación del día publicada: Supabase, web y app

Orden de Víctor: «Hazme la investigación de hoy de las ofertas, y actualiza la
web y la app». Informe: [`INVESTIGACION-CATALOGO-2026-11-05.md`](../INVESTIGACION-CATALOGO-2026-11-05.md).

- **Investigación:** 7 grupos con revisor independiente cada uno. Entrega
  `2026-11-05`, revisión `cede1f27`. SQL revisado por un agente independiente,
  con sus correcciones; el SQL corregido lo volvió a comprobar el coordinador.
  Sin altas ni retiradas.
- **PRs:** #66 (catálogo, rama limpia de un commit), #67 (tarjetas sencillas en
  web y app) y #68 (sincronización y sello). Las tres, unidas a `main`.
- **Supabase:** «Aplicar catálogo» run 42050045063. En línea, `cede1f27` con
  25/24 (8/13/3), vigente hasta el 12/11.
- **OTA Android:** run 42052119704, correcto (base c1f7106, 1.4.1(23)).
- **Web:** «Publicar web» en preview (run 42052080652, 220/0) y en producción
  (run 42069278129). Comprobado con curl en `https://rwadar.pages.dev`:
  catálogo `cede1f27`, Spiko 2,39 % y 3,99 %, «66,67 € la participación en
  reventa (05/11)» y tarjetas sencillas. Captura del móvil hecha.
- **Pruebas:** `npm test` en verde (web 601, móvil 410 + 2 omitidas, acceso
  146, base de datos sin fallos). La prueba de la tarjeta de la app sigue ahora
  al catálogo publicado.
- **Nuevo:** skill `investigacion-catalogo` y flujo guardado
  `investigacion-catalogo` en `.claude/`. `.gitignore` admite solo `skills/` y
  `workflows/`. Con «haz la investigación» se hace el ciclo entero ese día.
- **Pendiente:**
  - web de PAX Gold en `public.plataformas` (paxg.com);
  - texto de acceso de Spiko en el radar;
  - ilustración de Hausera (Orihuela Costa);
  - nombres de personas en copias de `2026-11-01-v2` y `2026-11-03.3-v2`;
  - la rama `claude/catalogo-2026-11-05` de origin lleva esas copias sin
    recortar: borrarla (no se unió).

## 5 de noviembre de 2026 (3) · Claude · correcciones de la revisión de las tarjetas sencillas (sin publicar)

Misma rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`), un
commit encima de los dos de abajo. **Sin push, sin OTA, sin EAS y sin tocar
Supabase.** Un revisor independiente pidió dos correcciones y propuso varias
mejoras. Están todas hechas salvo las dos que no hacían falta.

**Correcciones obligatorias (web, en inglés):**
- **El lugar de la tarjeta de Ofertas** salía en castellano en las 24 ofertas
  («Estados Unidos», «Limasol · Chipre»), mientras «Recién añadidas» y la app
  ya decían «United States» y «Limasol · Cyprus». Ahora la tarjeta pinta el
  lugar con `lugarTarjetaHtml`: la ciudad es un dato y no se traduce; el país,
  sí. En `idioma-web`, `originales` protege solo la ciudad
  (`#emiLista .emi-lugar [lang="es"]`).
- **El aviso crítico** empezaba por «Importante» también en inglés. Ahora dice
  «Important · …» y el texto del aviso, que viene del catálogo, sigue en
  castellano (`<span lang="es" translate="no">`, y `originales` protege solo
  ese texto). Igual en «Recién añadidas».

**Mejoras propuestas por el revisor, aplicadas:**
- **Escritorio y tableta**: ya no queda un hueco bajo los títulos cortos. Las
  tarjetas de una fila miden lo mismo y la línea «Mínimo · España» va al pie,
  alineada en toda la fila (medido a 820 y 1366 px).
- **«Patrocinada»** va en gris neutro, como en la app. El verde queda para
  «Nueva» y la acción principal.
- **«No disponible en España»** va en rojo en la web, como en la app.
- **España dice «No»** (web y app) cuando la oferta no se contrata desde
  España. Antes podía decir a la vez «España Sin confirmar» y «No disponible
  en España». Hoy no pasa con datos reales.
- **Teclado**: al cerrar la ficha con Escape o con ×, el foco vuelve a la
  tarjeta. Antes acababa en `<body>`, porque al volver atrás en el historial
  Chrome aplica otra vez el `#emisiones`. Si la persona ya ha movido el foco,
  no se lo quita.
- El texto del aviso crítico ya no sale atenuado. Quité la regla antigua que
  apagaba el «N más en la ficha», que ya no existe.
- Corregida la nota de la entrada «(2)» sobre Spiko Euro: ese fallo no existe.

**No hacía falta tocar:** con el catálogo caducado, a 390 px «Mínimo No
verificado · España Sin confirmar» ocupa dos líneas y se lee bien. Los mínimos
de Reventa llevan su fecha dentro del valor (sale de `minimoCorto`, como
antes).

**Pruebas:**
- `npm test` completo en verde:
  - web: 601/0, más 71 de páginas y 32 de precarga;
  - móvil: 412 pruebas, 410 correctas, 0 fallidas y 2 omitidas;
  - acceso: 146/0;
  - db: 11/11 y 30 comprobaciones SQL;
  - tools en verde, con «Motor y diccionario ES/EN web/móvil idénticos».
- `comprobar-ota-compatible.cjs --base c1f7106…`: `ok: true`.
- Pruebas nuevas en `rwadar-app/probar-web-tarjeta.mjs`, que se llaman desde
  `probar-web.mjs`. Ejecutan el traductor real de la web (`idioma-en`, `idioma`
  e `idioma-web`) sobre el HTML real de las 24 tarjetas, en un DOM mínimo, y
  leen lo que sale. Comprueban que:
  - el país va en inglés y la ciudad tal cual;
  - el aviso crítico dice «Important ·» y su texto sigue en castellano, en
    Ofertas y en «Recién añadidas»;
  - el botón de cada tarjeta se llama «View details for <título> from
    <plataforma>».

  Además, el foco al cerrar la ficha, el gris de «Patrocinada», el rojo de «No
  disponible en España», la línea de datos al pie y el «No» de España en la
  web y en la app.
- Comprobación de las pruebas: provoqué 10 fallos a propósito y las pruebas
  pillaron los 10 (2 del lugar, 4 del aviso, 2 de España y 2 del foco).
- Capturas (Chromium, modo oscuro) en el scratchpad, `tarjetas-simples/final-*.png`:
  390×844 ES/EN, 1366×860 ES/EN, 360 y 820, y un ensayo con «Patrocinada»,
  «No disponible en España» y un aviso crítico. Sin errores de página ni
  desborde horizontal.

**Queda pendiente:**
- Probar la app en un Android de verdad: las capturas de la app de la entrada
  «(2)» se hicieron con react-native-web.
- Publicar la web y enviar la OTA necesitan el permiso de Víctor.
- `probar-web.mjs` sigue por encima del aviso 5S (243 KB; ya lo estaba). Las
  pruebas nuevas van en su propio archivo.

---

## 5 de noviembre de 2026 (2) · Claude · la misma tarjeta sencilla en la app Android (sin publicar)

Misma rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`), un
commit encima del de la web. **Sin push, sin OTA, sin EAS y sin tocar
Supabase.** Completa lo que la entrada de abajo dejaba pendiente para la app.

- **La fila de Ofertas** (`FichaOferta`, `componentes/Ofertas.js`) sigue el
  mismo criterio que la web:
  - la miniatura (80 px);
  - «Patrocinada» y «Nueva», si lo son;
  - el título, en dos líneas como mucho;
  - proveedor · lugar;
  - una línea con el mínimo y el acceso desde España, por ejemplo «Mínimo 1 € ·
    España Sí»;
  - un «›» discreto.

  Solo si existen, por seguridad, enseña también un problema de la revisión
  («Cifras por actualizar», «Apertura no confirmada» o «Fuentes en
  conflicto»), «No disponible en España» y el aviso crítico entero. Ya no
  lleva el «· N más en la ficha».
- **Sale de la fila y sigue en la ficha**: los puntos fuertes, «Cifras válidas
  N días más», «Liquidez/Apertura no confirmada», la salida, «Revisa · N avisos
  en la ficha», el aviso ordinario, la fecha y «Ver ficha →». La ficha no
  cambia.
- **Accesibilidad**: toda la fila es un único botón, sin botones dentro.
  - Su nombre empieza por «Ver ficha de <título> en <plataforma>». En inglés
    es «View details for <título> from <plataforma>».
  - El nombre se compone en el componente, porque el patrón del diccionario
    corta mal los títulos que llevan «en».
  - Después dice solo lo que se ve. Ya no lee la fecha, los puntos fuertes ni
    los avisos ordinarios.
  - El «›» no se lee.
  - En la app, «Guardar» sigue en la cabecera de la ficha. La fila no lo
    tenía y no se ha añadido.
- **España en corto**: `textoEspanaOferta(resumen, corto)` y
  `datosTarjetaOferta` en `lib/transparencia.js`. Son la misma función que usa
  la ficha («Sí, según la fuente»), así que no hay cifras nuevas. Con el
  catálogo caducado (probado con el real al 12/11), las 24 fichas dicen
  «Mínimo No verificado · España Sin confirmar».
- **Encima de la lista**: una sola línea, «No es una recomendación de
  inversión · RWAdar no recibe dinero de las inversiones.». La cabecera de la
  Selección ya no repite la frase.
- **«Recién añadidas»** (`RecienAnadidas.js`): sin «Revisa · N avisos en la
  ficha» ni «N más en la ficha». Solo queda el aviso crítico, si lo hay.
- **Perfil**: no cambia, porque ya usa una fila corta propia.
- **Inglés**: no hay textos nuevos. Basta con los dos que añadió la web en
  `lib/idioma-en.js`.
- **Medidas** (react-native-web en Chrome, 412 px de ancho):

  | | Antes | Después |
  |---|---|---|
  | 3 primeras tarjetas, castellano | 575 px | 367 px (−36 %) |
  | 3 primeras tarjetas, inglés | 695 px | 367 px (−47 %) |
  | 8 principales, castellano | 1596 px | 999 px |
  | 8 principales, inglés | 1776 px | 981 px |

  Sin desborde a 360 px.
- **Contraste**: todo pasa AA. El texto suave da 6,1:1, el ámbar 11,2:1 y el
  aviso crítico 7,7:1.

**Pruebas:**
- `npm test` completo en verde:
  - web: 595/0, 71 de páginas y 32 de precarga;
  - móvil: 412 pruebas, 410 correctas, 0 fallidas y 2 omitidas;
  - tools en verde, con «Motor y diccionario ES/EN web/móvil idénticos»;
  - acceso: 146/0;
  - db y qr: sin fallos.
- `comprobar-ota-compatible.cjs --base c1f7106…`: `ok: true`, sin cambios
  nativos ni dependencias.
- Prueba nueva: recorre las 24 ofertas reales por `adaptarCatalogoV2`. Comprueba
  que:
  - la fila lleva solo Mínimo y España, y que coinciden con «Lo esencial» de la
    ficha;
  - no aparecen la salida, la vigencia, las fechas, los puntos fuertes ni los
    avisos ordinarios;
  - la ficha conserva todo eso.
- Comprobación de las pruebas: provoqué 7 fallos a propósito y las pruebas
  pillaron los 7. Fueron estos:
  - la salida vuelve a la fila;
  - la ficha pierde la salida;
  - desaparece el aviso crítico;
  - vuelve el aviso ordinario;
  - la fila dice España en largo;
  - se anida un botón;
  - desaparece el problema de la revisión.

**Queda pendiente:**
- ~~Web, accesibilidad en inglés: el nombre del botón de Spiko Euro se parte
  por su primer «en».~~ **No pasa** (corregido en la revisión de abajo, entrada
  «(3)»): antes de aplicar el patrón, `idioma-web` cambia el título y la
  plataforma por marcadores, así que en el navegador se lee entero: «View
  details for Spiko Euro (Smart Cash): fondo en euros ligado al €STR from
  Spiko». Una prueba nueva lo comprueba en las 24 ofertas.
- **Probarlo en un Android de verdad**: las capturas se hicieron con
  react-native-web, no en el dispositivo.
- **Publicar** la web y enviar la OTA necesitan el permiso de Víctor.

---

## 5 de noviembre de 2026 · Claude · tarjetas de Ofertas más sencillas en la web (sin publicar)

Rama local `claude/tarjetas-simples` (worktree `tarjetas-simples`, sale de
`main` 5a97fd2), un commit con esta entrada. **Sin push ni publicación, sin
tocar Supabase, sin OTA ni EAS.**

Encargo de Víctor, con una captura de Ofertas en el iPhone: «veo demasiada
información así de primeras, me marea; hazlo simple y fácil de leer; el que
quiera más detalle ya entrará en la tarjeta».

- **La tarjeta de la lista** (web en móvil y escritorio; una sola función,
  `tarjetaOfertaLocal`) enseña ahora:
  - la imagen con «Guardar»;
  - «Nueva» y «Patrocinada», si lo son;
  - el título, con dos líneas como mucho (entero en `title` y en el nombre del
    botón);
  - proveedor · lugar;
  - una línea con el mínimo y el acceso desde España: «Mínimo 1 € · España Sí».

  Solo si existen, por seguridad, enseña también el aviso crítico entero, un
  problema de la revisión (cifras por actualizar, apertura no confirmada en
  las principales o fuentes en conflicto) y «No disponible en España».

  Toda la tarjeta abre la ficha con un único botón «›», cuyo nombre accesible
  es «Ver ficha de <título> en <plataforma>». «Guardar» va aparte y no hay
  botones anidados. El foco marca la tarjeta entera.
- **Sale de la lista y sigue en la ficha**: los puntos fuertes, «cifras
  válidas N días más», «Liquidez/Apertura no confirmada», la salida, los
  avisos ordinarios y su recuento, la fecha de revisión y «Dato del …». Se
  comprobó oferta por oferta (24 de 24), en el navegador y en una prueba nueva.
- **España en corto**: `textoEspanaOferta(resumen, true)` devuelve «Sí», «No»
  o «Sin confirmar». La ficha sigue diciendo «Sí, según la fuente». No hay
  cifras nuevas: con el catálogo caducado manda `resumenOferta` y la tarjeta
  dice «Mínimo No verificado · España Sin confirmar» y «Cifras por actualizar».
- **Encima de la lista** (móvil), una sola línea pequeña: «No es una
  recomendación de inversión · RWAdar no recibe dinero de las inversiones.».
  La cabecera de la Selección ya no repite la frase.
- **«Recién añadidas» de Inicio** sigue el mismo criterio: quita «Revisa · N
  avisos en la ficha» y el «· N más en la ficha» del aviso crítico. Perfil no
  cambia: ya es una fila corta propia.
- **Inglés**: «Sí» → «Yes» y la línea de encima de la lista. Van en
  `rwadar-movil/lib/idioma-en.js` y en su copia web.
- **Normas**: el párrafo de las tarjetas de `CICLO-DIARIO-CATALOGO.md` dice
  ahora que la ficha lleva los tres datos y la lista, dos.
- **Medidas** (alto de las 3 primeras tarjetas): 390 px en castellano,
  469 → 359; 390 px en inglés, 621 → 359; 1366 px, 2228 → 1199. Sin errores
  de página. Sin desborde horizontal a 360 y 820 px.

**Pruebas:** `npm run test:web` 595 correctas y 0 fallidas, más 71 de páginas
y 32 de precarga. `npm run test:mobile`: 409 correctas, 0 fallidas y 2
omitidas. `npm run test:tools` en verde, con `copiar-idiomas-web.cjs
--comprobar`. Las pruebas de tarjeta comprueban qué se ve y qué no: con
mutaciones (la Salida vuelve a la tarjeta, la ficha pierde la Salida o
desaparece el aviso crítico), las pruebas fallan.

**Toqué `rwadar-movil` solo en dos sitios:**
- el diccionario, que se comparte con la web;
- tres aserciones de `tests/ofertas-vigencia.test.cjs` que comprueban la
  tarjeta **web** («cifras válidas hasta hoy» y «Fuente revisada el» pasan a
  comprobarse en la ficha).

**Queda pendiente:**
- **App Android** (otro agente): la misma tarjeta en la lista de Ofertas y en
  «Recién añadidas» (`RecienAnadidas.js`). Las pruebas de la app que esperan
  «Ver ficha →» y la Salida en la tarjeta (`ofertas-presentacion`,
  `navegacion`) siguen como estaban.
- Los títulos largos se cortan a dos líneas con «…». En escritorio, el título
  reserva dos líneas para que la línea de datos quede alineada en la fila.
- `probar-web.mjs` sigue por encima del aviso 5S (241 KB; ya lo estaba).
- Publicar la web necesita el permiso de Víctor.

---

## 4 de noviembre de 2026 (noche, 6) · Claude · publicadas la tercera y la cuarta subida: todo el barrido de calidad en producción

Cierra lo que quedaba pendiente en la entrada «(noche, 4)».

- **Tercera subida** (PR #59, merge `27d0cff`; sello `c65b0f4`): corrección de
  la revisión de `claude/qa-escritorio`. `idioma-previo` solo oculta en
  escritorio, con el tope contado desde la navegación y sin tocar `lang`; así
  desaparece la pantalla en blanco de 2–3 s en inglés en móviles lentos. También
  incluye la barra de filtros al filtrar, «No aplica» en el comparador y los
  botones de /acceso. Publicar web: runs 41913445850 (preview) y 41913969673
  (producción).
- **Cuarta subida** (PR #60, merge `6abdf94`; sello `9d06bca`): `claude/remates-3`,
  revisada y corregida.
  - Inicio sin salto al cargar: `escritorio-relato` y `movil-relato` desde
    `<head>`, el panel ya en su sitio en el HTML, Geist precargada y
    «Recién añadidas» visible desde el principio.
  - Inicio como historia también en tableta.
  - Sin la marca «Original source text» en la leyenda del radar.
  - «Qué se adquiere» una sola vez.

  Publicar web: runs 41926176848 (preview) y 41926601445 (producción). La app
  no cambia, así que no hubo OTA.
- **CLS medido en la web de prueba** (Playwright a través de curl, 3,5 s tras
  cargar): 1024 ES 0,874 → 0; 1366 EN 0,887 → 0,027; 820 ES/EN 0; 390 ES/EN 0.
  Sin «NaN», sin claves internas y sin aviso al cargar.

**Queda anotado** (no bloquea):
- Con el catálogo caducado, «Recién añadidas» nace visible y se oculta, lo que
  da un salto pequeño.
- Kraken xStocks y Spiko Smart Cash Euro conservan «Qué se adquiere» en el
  párrafo, porque su texto es distinto y más completo.
- La web hace una consulta 401 de sesión por carga: necesita tocar el worker de
  acceso.
- mTBILL necesita otra fuente de acceso desde España.
- Toucan: sin confirmar el estado de hoy.
- ARTEX no usa blockchain: decisión editorial de Víctor.
- /para-empresas sigue en noindex: decisión de Víctor.

## 4 de noviembre de 2026 (noche, 4) · Claude · remates 3: Inicio sin salto, tableta, leyenda en inglés y «Qué se adquiere» (sin publicar)

Rama local `claude/remates-3` (worktree `remates-3`, sale de `main` 857ef73,
que es lo publicado), commits 09fe24f, a43cd81 y 43c00e7, y tras la
revisión 663b309 y 484f977. **Sin push, nada publicado, Supabase sin tocar,
sin OTA ni EAS.** Sin textos nuevos.

- **Corrección tras la revisión (663b309 y 484f977):**
  - **Se une limpio con `claude/subida-3`.** Antes chocaba justo en
    `idioma-previo`. Ahora el bloque que marca `escritorio-relato` va aparte,
    al final del archivo, y el bloque del idioma queda como en `main`: los
    `return` que añade subida-3 no lo cortan. La prueba nueva se movió lejos
    de las de subida-3. `git merge-tree claude/subida-3 claude/remates-3`:
    solo choca este `PARA-CODEX.md` (dos entradas arriba; se quedan las dos).
    En una copia unida: web 593/0 y CLS 0 en castellano e inglés a 1024×768,
    1366×860, 820, 768, 390 y 360 (1920: 0,0015 en castellano); con el JS
    retrasado 1,5 s, inglés a 1024 y 1366: 0,007 y 0,018 (`main`: 0,84 y 0,85).
  - **Móvil con el JS tarde: 0,063 → 0.** Con el JS principal retrasado
    (primera visita con datos móviles), la página pintaba Ofertas con el hueco
    del selector de idioma y luego saltaba a Inicio (`<main>` subía 57 px).
    Ahora `idioma-previo` marca `html.movil-relato` en «/» sin ancla (misma
    consulta que `Movil`) y el CSS enseña ya Inicio, oculta Ofertas y el
    selector y marca la pestaña Inicio. La clase se quita en
    `DOMContentLoaded`; si el JS no llega, vuelve el catálogo sin JS de
    siempre. Con ancla (`/#emisiones`) sigue como en `main` (0,063 si el JS
    tarda). Castellano a 390 y 360, retrasos de 600 y 1500 ms: 0. Inglés con
    subida-3 (que en el móvil ya no oculta): 0,031 y 0,035 por el cambio de
    castellano a inglés (subida-3 sola: 0,105 y 0,065). Las posiciones finales
    de las 5 pestañas a 390 y 360 son las de `main`.
  - **«Recién añadidas» con el catálogo caducado: aceptado.** Con el lote
    vencido (reloj el 12/11) nace visible y se oculta: 0,011 (1024×768) y
    0,0065 (1366×860); en el móvil con el JS tarde, 0,020. Muy por debajo de
    0,1 (`main` daba 0,874 en escritorio). Evitarlo exige repetir en `<head>`
    la vigencia del lote y la ventana de 30 días de altas; no compensa.

- **Inicio ya no salta al cargar (09fe24f).** Medido con el reloj fijo
  (04/11 12:00 UTC) y el mismo catálogo, `main` local frente a la rama, en
  castellano: 1024×768 **0,874 → 0**; 1366×860 **0,886 → 0**; 1920×1080
  0,90 → 0,0015. En inglés ya era 0 (la página espera oculta a traducirse).
  Había tres causas: el JS subía el panel de Inicio y ponía la clase después
  de pintar; la letra Geist llegaba tarde (el subtítulo pasaba de 3 a 2
  líneas y el botón subía 29 px); y «Recién añadidas» aparecía de golpe en la
  franja que asoma bajo la portada. Ahora: `idioma-previo` marca
  `html.escritorio-relato` en `<head>` (solo en «/», misma consulta que
  `Movil.adaptar()`); el panel va en el HTML el primero dentro de `<main>`
  (el JS ya no lo mueve) y el CSS lo enseña aunque nazca con `hidden`;
  `<link rel="preload">` de `geist-normal`; «Recién añadidas» nace visible
  (`pintarInicio` la oculta si no hay altas). Con la letra retrasada 1 s,
  0,015. Cambio de tamaño en caliente 1366→900→390→1366, ES y EN: bien.
- **Tableta (768–1023 px):** cuenta la misma historia que el escritorio, en
  una columna: titular, «Ver las 24 ofertas» y su aviso antes del radar
  (a 820×1180, botón en 439–495 y aviso en 515–563). Cuatro tarjetas, dos y
  dos. El radar interactivo pasa a Plataformas, como en escritorio. Con
  pantalla baja (900×600) el aviso va antes del botón.
- **Inglés (a43cd81):** «Original source text (Spanish)» ya no sale sobre la
  leyenda del radar («26 platforms on the radar…»), solo sobre el punto
  leído al pasar el ratón; en Ofertas va sobre las tarjetas y no sobre
  «Main offers / 8 of 8 entries…». En el panel de Inicio no había ninguno.
- **«Qué se adquiere» (43c00e7):** en la ficha fija sale del párrafo inicial
  y va como fila de «Qué es y quién lo ofrece», con punto final (22 de 24).
  La ficha fija no tiene un apartado «Características»: esa lista es su
  equivalente. Kraken xStocks y Spiko Smart Cash Euro cuentan en el párrafo
  algo distinto y más detallado: no se toca. En el panel de la web tampoco
  se repite ya cuando la descripción no empieza por el resumen (17 ofertas).
- **Pruebas:** `npm test` completo en verde (base de datos 27 scripts con 886
  comprobaciones, 30 SQL y 11 del mapa; web 592; fichas 71; precarga 32;
  móvil 411 con 409 bien y 2 omitidas; acceso 145; herramientas sin
  diferencias). Pruebas nuevas funcionales, sin frases: `probar-web-escritorio.mjs`
  (clases en `<head>` para escritorio y móvil, panel primero en `<main>`,
  precarga de la letra) y
  `probar-fichas.cjs`. Guardián OTA `ok` (1.4.1(23)). CSS 178 462 B.
  `probar-orden.mjs` solo avisa de `rwadar-movil/App.js`, como en `main`.
- **Al unir:** el panel de Inicio se ha movido de sitio en `index.html`
  (430 líneas): si otra rama cambió algo dentro de ese panel, el conflicto se
  resuelve aplicando su cambio en la nueva posición y regenerando con
  `npm test`. `idioma-web` solo cambia la línea de `superficies`. Con
  `claude/subida-3` el código se une solo; choca únicamente este archivo.
- **Capturas y medidas:** `scratchpad/remates-3/` (`medidas.json`, con la
  corrección en `correccion_tras_revision`; `capturas/antes-*`, `despues-*`,
  `*-movil-primera-pintura` y `unida-subida3-*`).

## 4 de noviembre de 2026 (noche, 4) · Claude · publicado: Academy, Inicio en escritorio, barrido de calidad y catálogo 2026-11-04

Orden de Víctor: «hay que subirlo cuanto antes». Todo publicado en dos subidas,
cada una con npm test completo, CI (pruebas + secretos), web de prueba
comprobada a mano (Playwright a través de curl) y después producción.

**Primera subida** (PR #55, merge `f1b0426`; sello `24963d4`): Academy en
llano y tablas de Privacidad (`claude/academy-pulido`) e Inicio como historia
en escritorio desde 1024 px (`claude/escritorio-inicio`). Web: Publicar web
runs 41900720101 (preview) y 41901555827 (producción), ambos success.

**Segunda subida** (PR #56, merge `38eaa07`; PR #57, merge `857ef73`):
- Arreglos del barrido en móvil (`claude/qa-movil`, revisado y corregido):
  rótulos legibles en la ficha, test de Academy sin sesión, sin aviso
  «Registro actualizado» al cargar, saltar al contenido, inglés, una sola
  consulta de sesión, «de 7», toque de 44 px y menores.
- Arreglos del barrido en escritorio (`claude/qa-escritorio`, **solo la
  implementación**; la revisión y su corrección irán en la tercera subida):
  sin «NaN», inglés sin salto (idioma-previo en `<head>`), barra fija bajo la
  cabecera real, cabecera en una fila desde 820 px, consultas técnicas sin
  enlace, comparador, «Entrar», «Novedades», og/twitter.
- Ajuste de integración: `rotuloReferencia` acepta la clave interna y el
  rótulo legible de la entrega, quita la fecha y traduce; nombres alineados
  con `rwadar-app/rotulos-referencias.js`.
- Entrega de catálogo 2026-11-04 aplicada con «Aplicar catálogo» (run
  41904025384) tras releer como visitante la f2732257 a las 20:10 UTC.
  Comprobado en línea: revisión `cf79e4a4`, 26/24 (8/13/3), 20 «Acceso desde
  España · consulta …» y 0 «accesoEspana», Aktionariat con `/trade`, ARTEX
  «No usa blockchain», Toucan con 4 fuentes. Sincronizado (seed 12 fuentes,
  transparencia lote 2026-11-04). `probar-fichas.cjs`: SwitzerLend y Spiko ya
  no citan ninguna API.
- Sello `f17f460`. Publicar web runs 41905751641 (preview) y 41906630808
  (producción); OTA Android run 41906657970 (base c1f7106), todos success.

Medido en la web de prueba frente a la real: cabecera a 820/1024 de 117 a
69 px; CLS de Inicio en inglés a 1366 de 1,08 a 0; ningún «NaN», ninguna
clave interna, ningún aviso al cargar.

**Pendiente (tercera subida, en marcha):** corrección de la revisión de
`claude/qa-escritorio`; `claude/remates-3`: CLS 0,87 a 1024 en castellano
(viene de la primera subida), Inicio de tableta como historia, marca «texto
original» en la leyenda del radar en inglés y «Qué se adquiere» repetido en
la ficha fija. Sigue anotado: mTBILL necesita otra fuente de acceso desde
España; Toucan, sin confirmar si el bloqueo sigue hoy (Verra da 403); ARTEX
no usa blockchain (decisión editorial de Víctor si sigue en el radar).

## 4 de noviembre de 2026 (noche, 2) · Claude · entrega 2026-11-04: arreglos de datos del catálogo (sin aplicar)

Rama local `claude/catalogo-2026-11-04` (worktree `catalogo-1104`, sale de
`main` 081fc27), dos commits (preparación y corrección tras la revisión
independiente). **Sin push, Supabase solo leído como visitante,
nada publicado, sin OTA ni workflows.** Solo datos; la web va en otras ramas.

- **Parte de la publicada:** lectura como visitante a las 19:07:11 UTC del 04/11:
  `f2732257` (la .7 con los textos de la .8), 26 plataformas, 24 ofertas
  (8/13/3). Guardada en `verificaciones/2026-11-04-v2/lectura-publica/`; el
  preparador comprueba que coincide con la base local.
- **Etiqueta `2026-11-04`**, revisión nueva `cf79e4a4…`, `aplicar-y-aprobar.sql`
  SHA `85e848edc433efa6d1a240a16438e9ccfbce5061ef9be53444f81a4e081df464`.
  Entrega documental: radar, cifras y vigencia siguen del 03/11 (vence el 11/11).
- **Qué cambia:**
  - «Datos con su fecha»: 228 rótulos internos («accesoEspana · consulta …»)
    pasan a castellano («Acceso desde España · consulta …») en 21 ofertas;
    valores, fuentes y fechas iguales.
  - 39 referencias en 18 ofertas y 2 fuentes del radar (REGAFI de Spiko) dejan
    la dirección de API por la página para personas (Aktionariat, BOSS Info y
    SwitzerLend `/trade` e `/invest`; Spiko `data.spiko.io`; Brickwise
    `www.brickwise.at/assets/<isin>` o el mercado de la app; Alius Capital;
    buscador de ESMA; ficha del REGAFI). Comprobadas hoy con curl y Chrome sin
    interfaz. **Se decide por referencia:** si la página no enseña ese mismo
    dato, la referencia conserva la API (`seQuedan[].referencias`).
  - ARTEX «Blockchains»: «Mercado regulado (MTF)» → «No usa blockchain» (su FAQ).
  - Toucan: fuente nueva del ACR (30/05/2022) y motivo fechado en mayo de 2022.
- **Generador arreglado:** diccionario de los 67 campos en
  `rwadar-app/rotulos-referencias.js`; lo usan `2026-11-02-v2/preparar-lote.mjs`
  y `montar-revision.mjs` (que falla si llega un campo sin rótulo).
- **Lo que no se pudo:** el libro de órdenes de Brickwise
  (`api.app.brickwise.at/api/v1/assets`, 11 fichas) no tiene página pública y
  se queda; también se quedan 14 referencias de Brickwise (precio de emisión,
  disponibles en emisión, etapa, condiciones; y precio y rentabilidad de
  Cohotel y GreenPoint, que el mercado da con otra medida) y las 6 del mínimo
  y la salida de Aktionariat y BOSS Info (solo en la configuración que carga
  `/invest`, no en pantalla); el JS de Midas (mTBILL) no tiene equivalente; el
  estado de hoy de Verra/ACR no se pudo leer (Verra da 403). Detalle en el
  informe, §3.
- **Corrección tras la revisión independiente** (informe §7): Brickwise 15
  referencias (12 conservan la API; las 3 de «Precio más bajo en mercado
  secundario» enlazan el mercado, que enseña «Preis pro Anteil ab») y, con el
  mismo criterio, 2 más («disponibles en emisión» de Pottendorfer y
  Sonnleithnergasse); Aktionariat y BOSS Info 6 referencias con la API; Toucan
  «que la permitiría» → «que permitiría tokenizarlos». Tras corregir: PGlite correcto
  (27 + 16 fallos), preparador reproducible y `npm test` completo, salida 0.
- **Pruebas:** `comprobar-entrega.mjs` correcto (27 comprobaciones, 16 casos de
  fallo que no dejan nada); `preparar-entrega.mjs` reproducible; `npm test`
  completo en verde.
- **Pendiente (coordinador):** revisión independiente; unir a `main`; releer
  como visitante (con hora); «Aplicar catálogo» con `2026-11-04`; sincronizar,
  fichas, `volcar-seed.js`, `transparencia.json`, sello y «Publicar web». Sin OTA.
  Pasos en `rwadar-app/data/verificaciones/2026-11-04-v2/INFORME-ENTREGA.md` §6.

## 4 de noviembre de 2026 (noche, 2) · Claude · QA de escritorio: 9 arreglos de la web publicada (sin publicar)

**Corrección tras la revisión** (fb7dc26, 8e9a3d3, e1760bd, 88e938d; 5
hallazgos, 1 importante y 4 menores, todos corregidos):
- **idioma-previo (importante + menor):** solo oculta en escritorio (mismo
  corte que la vista móvil de la web); en el móvil no saltaba y ocultarla
  solo retrasaba la primera pintura (390 px con CPU x4: 2,2 s → 0,18 s, CLS
  0). El tope de 1,5 s cuenta desde el inicio de la navegación, no desde que
  corre el script. **Ojo:** no es un tope duro; el temporizador no puede
  cortar el JS diferido, así que en escritorio con la CPU x4 la página sale
  a los ~2–2,5 s, al terminar la traducción (CLS 0). Ya no pone `lang="en"`:
  lo pone idioma-web; si no carga, queda `lang="es"` con el texto en
  castellano.
- **Barra de filtros al filtrar (menor):** el ResizeObserver observa también
  `#plataformasResultados`. Si se filtra desde la barra con la lista
  desplazada, la vista vuelve al principio de los resultados, bajo la barra;
  antes la barra se quedaba sobre Academy y se iba al primer giro de rueda
  con el foco dentro.
- **/acceso (menor):** el botón que queda solo de su pareja ocupa la fila
  (solo CSS, con `+` y `:has()`); los botones con caja y los enlaces de texto
  ya no se mezclan. A 390 px la vista de entrar vuelve a medir 1010 px.
- **Comparador (menor):** Blocksquare, Fireblocks, Taurus y Tokeny vuelven a
  decir «No aplica» (no venden inversiones), no «Sin documentar».
- Pruebas funcionales nuevas o ajustadas en
  `rwadar-app/probar-web-escritorio.mjs` (idioma-previo en escritorio y
  móvil, barra al cambiar la lista, «No aplica»); fallan con el código de
  d469e06. `npm test` completo en verde (base de datos 886 en 27 scripts,
  30 SQL y 11 del mapa; web 590, fichas 70, precarga 32, móvil 409 + 2
  omitidas, acceso 145; herramientas al día). OTA `--base c1f7106…` `ok`;
  CSS 168 389 B. `probar-orden.mjs` sigue con el único aviso de
  `rwadar-movil/App.js`, que ya salía en `main` (no se toca la app).

Rama local `claude/qa-escritorio` (sale de `main`, 081fc27). **Sin push, sin
publicar, Supabase sin tocar, sin OTA ni EAS.** Los números son los de la
tabla del barrido de calidad (HALLAZGOS.md del coordinador). Va en paralelo
con `claude/qa-movil` y `claude/escritorio-inicio`; se unirán después.

- **n.º 1 · «0 €» → «NaN»** (94feb93): la franja de cifras anima solo el
  número y conserva prefijo y sufijo; sin cifra o con 0 no anima, y si otra
  parte de la página reescribe la cifra, se retira. Antes: «NaN» en inglés y
  «0» en castellano; ahora «€0» y «0 €».
- **n.º 7 · el inglés saltaba** (8570810, 1f8e32e): nuevo
  `assets/idioma-previo-20261104.js` (en `ARCHIVOS_PUBLICABLES`), externo y
  sin defer en `<head>` porque la CSP no admite scripts en línea. En
  escritorio, si la preferencia guardada es inglés, pone la clase
  `idioma-previo` (`body{visibility:hidden}` en idioma-20261022.css) hasta
  que idioma-web avisa de que ha traducido y ha llegado DOMContentLoaded;
  tope de 1,5 s desde la navegación (ver la corrección arriba).
  Va en Inicio, las páginas de rwadar-fichas.js, Academy, 404, privacidad,
  transparencia comercial y para empresas. CLS en inglés: **0,22 → 0** a
  1366 y **0,067 → 0** a 820; en escritorio la primera pintura en inglés
  pasa de ~0,25 s a ~0,6 s (espera a la traducción); en castellano y en el
  móvil no cambia.
- **n.º 8 · barra de filtros** (b315a15): `.barra` usa `top:var(--alto-cabecera)`
  (ResizeObserver sobre `.hdr`) y al acabar `#plataformasResultados` se
  empuja hacia arriba (`--barra-empuje`); no se mueven nodos del DOM, así que
  el orden móvil/escritorio de `Movil` no cambia. Tapado: 57 → 0 px a 1024 y
  820; ya no queda fija sobre Descartadas ni el pie, tampoco tras filtrar.
- **n.º 9 · cabecera de tableta** (38eb8f7): por debajo de 1280 px «Sonido y
  vibración» solo con icono (aria-label y title), enlaces y botones más
  juntos; por debajo de 1024 px salen el lema de la marca y «Ver ofertas →»
  (repite «Ofertas»). Una fila (69 px) de 768 a 1366, ES y EN, también con
  «Mis inversiones» e inicial. No toca la estructura de Inicio.
- **n.º 12 · fuentes que son API** (c6ece17): una URL con `/api/`, que acaba
  en `.json` o pide `format=json` no se enlaza; se cita «Consulta técnica ·
  fecha» (con su título si lo tiene). En rwadar-fichas.js
  (`sinEnlacesTecnicos` sobre el contenido de cada página, sin tocar las
  plantillas de secciones), ficha-pagina y la web (ficha de oferta y panel de
  plataforma; fbd7d91 la llama con guarda `typeof`, porque las pruebas de
  rwadar-movil ejecutan un trozo del script sin el ayudante). Cero enlaces a
  API en /ofertas/aktionariat, /boss-info, /switzerlend y /plataformas/spiko.
  Si al lado ya pone «consultada el …», no repite la fecha (bebc45d).
- **n.º 18 · comparador** (daf08ca): «Mínimo» es el mínimo más bajo
  documentado en euros entre las ofertas de esa plataforma («Desde 1 €» en
  Spiko), «No aplica» en los proveedores de infraestructura o «Sin
  documentar», no «Alto». `textoEspanaOferta` y
  `textoSalidaOferta`: una sola función para la tarjeta (escritorio y móvil)
  y «Lo esencial» de la ficha. **No hecho:** el campo «Blockchains» de ARTEX
  («Mercado regulado (MTF)») es un dato de Supabase; corregirlo va en una
  entrega del catálogo.
- **n.º 27 · «Mis inversiones» sin sesión** (df52b2e): rotula «Entrar»; en
  /acceso el botón de la vista abierta se oculta («Ya tengo cuenta» ya no
  repite «Entrar»).
- **n.º 28 · «Noticias de RWAdar»** (77a773a): el menú de las páginas fijas
  dice «Novedades» («Updates»). og.png regenerado con
  `rwadar-editorial-source/og.mjs`: sectores como en el radar (Inmobiliario,
  Crédito, Tesoro…) y un punto por plataforma del catálogo (26).
- **n.º 29 · compartir** (8570810, 141ad06): og:* y `twitter:card` en
  privacidad, transparencia comercial y para empresas, y `twitter:card` en
  todas las páginas de rwadar-fichas.js. Sin imágenes nuevas (las ofertas
  siguen con su .webp). **Decisión de Víctor:** /para-empresas sigue con
  `noindex,nofollow`; no se ha cambiado.
- **Pruebas** (1a90a20): funcionales nuevas en
  `rwadar-app/probar-web-escritorio.mjs` (las llama probar-web.mjs, que así
  no pasa su presupuesto de 240 000 B), `probar-fichas.cjs` y
  `rwadar-acceso/acceso-sin-duplicados.test.mjs`. Ninguna fija frases
  legales. `npm test` completo en verde (base de datos: 27 scripts con 886
  comprobaciones, 30 SQL y 11 del mapa; web 589, fichas 70, precarga 32, móvil 409 + 2 omitidas, acceso 145,
  herramientas y `copiar-idiomas-web --comprobar` sin diferencias). OTA:
  `comprobar-ota-compatible.cjs --base c1f7106…` da `ok`; no se tocan
  archivos protegidos. CSS 168 389 B. `probar-orden.mjs` solo avisa de
  `rwadar-movil/App.js` (119 KB > 110 KB), que ya pasaba en `main`.
- **Al unir con `claude/qa-movil`:** el código se une sin conflictos; chocan
  solo las páginas generadas de ofertas, plataformas y Descartadas (una
  línea cada una). Se resuelven regenerando con `node rwadar-fichas.js` y
  `node rwadar-academy.js` tras la unión. Con `claude/escritorio-inicio`, sin
  conflictos.
- **Pendiente:** publicar (con la sincronización completa) y comprobar en
  producción; la tarjeta de plataforma y el panel siguen diciendo «Mínimo:
  alto» / «Importe de entrada: Alto» (nivel de entrada; el barrido solo
  pedía el comparador). En inglés, «Sin documentar» y «Desde 1 €» del
  comparador siguen en castellano: idioma-web protege entera la celda
  `#modal tbody td` (frente de inglés de `claude/qa-movil`).

## 4 de noviembre de 2026 (noche, 3) · Claude · QA móvil: arreglos de la revisión

Misma rama local `claude/qa-movil`, 6 commits más sobre ee25496 (de 0595f79
a 7b28852, y este traspaso). **Sin push, nada publicado, Supabase sin tocar, sin OTA ni
workflows.** Solo cambia cómo se pinta; los datos del catálogo, igual.

- **Importante (arreglado):** 5 fichas fijas `/ofertas/<slug>` (aktionariat,
  prosegur-digital-gold, robinhood-classic-stock-tokens y las dos de Spiko)
  enseñaban «· comisiones · consulta 01/11/2026» en Costes. Ahora el enlace
  usa `rotuloReferencia()`: «· Comisiones · consultada el 01/11/2026 ↗».
  Comprobado en navegador: 0 de 24 fichas con claves internas.
- **Menores (arreglados):**
  - **Costes (web y app):** «Comisiones» va aparte y se traduce («Fees»); la
    cita lleva `lang` y la nota «Cita literal de la fuente, en inglés.», como
    en «Datos con su fecha».
  - **Idioma de la cita:** las 12 de Brickwise («Vermittlungsgebühr…») salen
    como alemán (más palabras alemanas, ä/ö/ü/ß y «Investor:in» no cuenta
    como «in»); «Start with as little as €1», como inglés. Sobre las 476
    referencias del catálogo de hoy solo cambian esas 17, todas a mejor.
  - **A 360 px:** «Mercado de compraventa» en dos líneas sin cortar; títulos
    de «Recién añadidas» a cuatro líneas, sin cortes; rótulos del radar a
    44 px (65-70×44); chips cortos («All», 37 px) con diana de 44×46.
  - **Inglés:** «+ Follow this platform» y su nota en la ficha de plataforma.
  - **App Academy:** «7 LECCIONES · 3 NIVELES» (antes 9, junto a «de 7»).
- **No hecho:** la página no vuelve a preguntar por la sesión tras el primer
  401 (`acceso-privado.js`). Vale mientras las cuentas sigan en pausa; al
  reabrirlas, comprobar al volver a la pestaña o con un evento `storage`.
- **Pruebas:** `npm test` en verde (1.466 correctas, 0 fallidas; node --test
  11/11, 409/411 con 2 omitidas, 144/144). Guardián OTA `ok` (1.4.1(23)).
  Ajustadas dos comprobaciones existentes de costes (web y app) al nuevo
  marcado; sin pruebas nuevas de textos. Medidas y capturas en
  `scratchpad/qa-movil-fix2/` (`resultados.json`, `capturas/`).
- **Al publicar:** web y OTA (la app cambia en Costes y Academy).

## 4 de noviembre de 2026 (noche, 2) · Claude · arreglos del barrido de calidad de la web en el móvil

Rama local `claude/qa-movil` (sale de `main`, 081fc27). **Sin push, nada
publicado, Supabase sin tocar, sin OTA ni workflows.** Los datos del catálogo
no cambian: todo es de cómo se pinta. Hallazgos en
`scratchpad/qa-prod/movil.json` (20).

- **Graves:**
  - **Ficha de oferta:** «accesoEspana · consulta 01/11/2026» pasa a
    «Acceso desde España» (y «Mínimo de inversión», «Qué se adquiere»,
    «Comisiones»…) en la web (panel y fichas fijas) y en la app, con
    `rotuloReferencia()` en `rwadar-movil/lib/ficha-editorial.js`. Las
    búsquedas internas por etiqueta siguen con la clave. La cita de la fuente
    lleva su `lang` y, si está en inglés, francés o alemán, la nota «Cita
    literal de la fuente, en inglés.». En inglés se traducen rótulos, «Fecha
    del dato», «Ver fuente» y «Fuente N». **Pendiente para el próximo ciclo
    del catálogo:** que `preparar-lote.mjs` escriba ya el rótulo legible.
  - **Academy:** el test funciona sin cuenta y no espera a la sesión; solo
    «Marcar como leída» y el progreso necesitan cuenta.
- **Importantes:** «Registro actualizado» ya no sale al cargar (solo si el
  catálogo cambia con la página abierta, y en inglés); «Saltar al
  contenido» lleva al contenido de la pestaña visible; inglés de Perfil,
  Descartadas, avisos flotantes, tipo y región de las plataformas y países de
  «Recién añadidas»; sin sondeos de sesión sin cuenta (queda **un** 401 al
  cargar; quitarlo exige que el servidor responda 200 sin sesión, que es
  Auth y no lo he tocado); «Lección 1 de 7» (web y app); toque de 44 px en
  radar (diana en pantalla), rótulos del radar, controles del mapa,
  «Descartadas, con su motivo» y enlaces de las fichas fijas (chips y
  estrella ya llegaban a 44 con su `::before`).
- **Menores:** fechas dd/mm/aaaa en la ficha de plataforma; sin «Actividad»
  repetida ni «Qué se adquiere» repetido (web y app); búsqueda vacía con
  «Borrar búsqueda»; «de 1 € o de 1 $» (web y app); «Austria» en el popup
  del mapa (al pintar); redirecciones de `/fuera-del-radar`, `/plataformas/`
  y `/ofertas/`; nota de uso personal bajo el CSV; títulos a tres líneas y
  tipo/región en dos líneas en la galería.
- **No hecho:** frases del capítulo 04, «mF-ONE» y advertencia repetida en
  Inicio (las toca el otro agente en `index.html`); barra de 5 botones en
  Academy y fichas fijas (plantillas de otro agente); fuentes externas que
  no responden a curl (abrir a mano); alt de las imágenes por oferta (texto
  editorial del catálogo, ya marcado como castellano).
- **Pruebas:** `npm test` completo en verde; guardián OTA `ok` (runtime
  1.4.1(23)); sin cambios en package.json, app.json, eas.json ni scripts/.
  Ajustadas tres comprobaciones de código existentes (radar, Academy,
  fuentes de plataforma) y la frase de mínimos de la app; sin pruebas
  nuevas de textos. Capturas antes/después en `scratchpad/qa-movil/`.
- **Pendiente (coordinador):** revisión, unir a `main` (choques posibles en
  `rwadar-20260820.js` e `index.html` pre-renderizado: regenerar con
  `npm test`), publicar web y OTA (la app cambia: rótulos, «de 7», mínimos).

## 4 de noviembre de 2026 (noche, 3) · Claude · Inicio en escritorio: arreglos de la revisión (sin publicar)

Misma rama `claude/escritorio-inicio`, commits 800b2d2 (CSS) y 1bdb505 (JS).
**Sin push, nada publicado, Supabase sin tocar, sin OTA.**

- **Pantallas bajas (importante):** con 760 px de alto o menos, el aviso de
  riesgo va antes de «Ver las 24 ofertas» y la portada encoge. Medido en
  294 tamaños (1024–1920 de ancho, 560–960 de alto, ES y EN): en ninguno se
  ve el botón sin el aviso. A 1366×650 el aviso queda en 425–473 y el botón
  en 493–549; a 1024×600 en inglés, aviso 495–543.
- **Foco (importante):** los botones del relato llevan el foco al título del
  destino («Activos y ofertas documentados», «El radar», «Plataformas
  descartadas»), como Movil.ir en el móvil.
- **Menores:** el título de Inicio hace de h1 en escritorio (`aria-level=1`;
  se quita por debajo de 1024); el logo y `/#top` llevan a scrollY 0;
  `#fuentes-…` deja el grupo bajo la cabecera real (132 px con cabecera de
  117 a 1024); los títulos de «Recién añadidas» salen enteros.
- **Pruebas:** `npm test` en verde (web 580, fichas 68, precarga 32, móvil
  411 con 409 bien y 2 omitidas, acceso 144/144, db 0 fallos + 30 SQL +
  11/11, Node seguro 16); guardián OTA ok, runtime 1.4.1(23). El móvil a
  390 px no cambia (barra de progreso a 59 px, sin `aria-level`).
- **Capturas:** `scratchpad/escritorio/corr/` (c-es-1366x650-arriba,
  c-en-1024x600-arriba, c-es-1024x768-logo, c-es-1024-nuevas-ancho…).

## 4 de noviembre de 2026 (noche, 2) · Claude · Inicio como historia también en escritorio (sin publicar)

Rama local `claude/escritorio-inicio` (sobre `main` 320ec05), commits
a213955 (CSS) y 12455de (JS). **Sin push, nada publicado, Supabase sin
tocar, sin OTA.** Solo cambian `rwadar-20260820.css` y `rwadar-20260820.js`;
`index.html` no hizo falta tocarlo.

- **Qué se ve:** a partir de 1024 px, Inicio es la misma historia que en el
  móvil y con el mismo texto: portada a dos columnas (titular, subtítulo,
  botón y aviso a la izquierda; el radar grande con sus cifras a la
  derecha), «Recién añadidas», capítulos 01–06 en una columna de 720 px con
  las cifras grandes, Selección, fuentes y nota legal. «Quién más se ha
  movido», «Recién añadidas» y la Selección pasan de carrusel a cuadrícula
  más ancha (3 por fila; 4 si son 4; si sobran 2, a medias). Debajo siguen
  Ofertas, Plataformas, Método, Descartadas y Academy como antes.
- **Cómo:** el JS mueve el panel de Inicio al principio de `<main>` y pone
  `html.escritorio-relato`; por debajo de 1024 px lo devuelve a su sitio. El
  radar interactivo de la portada antigua pasa a Plataformas, justo después
  de «El radar»; el titular antiguo y el marcador se ocultan en ese ancho.
  En escritorio, los botones del relato bajan a su sección, «Explorar el
  radar» lleva a Plataformas y las tarjetas abren su ficha. La barra de
  lectura va bajo la cabecera y solo mientras se lee Inicio.
- **Lo que no cambia:** el móvil y el escritorio de 768 a 1023 px. Comparado
  con `main` estilo a estilo (390 px en Inicio, Ofertas y Plataformas; 800 y
  1000 px): idéntico. Ofertas, Plataformas, Método, Descartadas y Academy a
  1366 y 1024: idénticos; solo se mueve el radar.
- **Pruebas:** `npm test` completo en verde; guardián de la OTA ok. CSS:
  173 579 B (presupuesto 180 000). Sin textos nuevos, así que sin cambios en
  inglés.
- **Pendiente:** que Víctor lo vea y, si le vale, unir y publicar la web.
  La cabecera de escritorio ya se partía en dos líneas a 1024 px antes de
  este cambio; no se ha tocado.

## 4 de noviembre de 2026 (tarde, 5) · Claude · corrector de Academy y Privacidad (sin publicar)

Misma rama `claude/academy-pulido`, encima de la entrada de abajo. **Sin push,
Supabase sin tocar, nada publicado, sin OTA.**

- **Fecha de revisión legal:** vuelve a **2026-10-02** en las lecciones 1-7
  (frontmatter, cabecera, pie, JSON-LD y sitemap). El pulido fue de estilo, no
  una revisión legal; la última que consta es la de Víctor del 2/10. Si Víctor
  revisa de nuevo, se cambia la fecha (y en la 04, «A 21 de agosto de 2026»
  con lo que haya hoy sobre el umbral de 12 millones).
- **Lección 6:** el título vuelve a «Cuatro espejismos de liquidez» y una
  línea explica la palabra, para que el aviso reforzado («Las condiciones,
  espejismos y preguntas…») siga remitiendo a algo que está en la lección.
  El aviso no se toca.
- **Lección 5:** primer punto del resumen acortado; la tarjeta vuelve a caber
  en 3 líneas a 390 px en castellano y en inglés (clave nueva en
  `idioma-en.js` y `copiar-idiomas-web.cjs`).
- **Hechos:** EBITDA = resultado bruto de explotación (no «beneficio de
  explotación», que es el EBIT); tanteo y retracto explicados los dos.
  Retoques de redacción en 02, 05, 06 y 07.
- **Privacidad:** espacio tras cada etiqueta de celda (al copiar ya no sale
  «Por qué ocurreEs lo mínimo…»). Visualmente igual.
- **Caché del CSS y del diccionario:** no se renombran. `rwadar-publicar.js`
  ya pone una huella del contenido en el nombre al publicar
  (`privacidad-20260820.<hash>.css`), así que el `immutable` nunca sirve bytes
  viejos con un nombre nuevo.
- **Pruebas:** `npm test` en verde; `comprobar-ota-compatible.cjs --base
  c1f7106` en ok.

## 4 de noviembre de 2026 (tarde, 4) · Claude · lecciones de Academy en llano y tablas de Privacidad en el móvil (sin publicar)

Rama local `claude/academy-pulido` (worktree `.claude/worktrees/academy-pulido`),
commits 969ab22 (lecciones), c9a19ab (Privacidad) y f6382f4 (retoque de la lección 6). **Sin push,
Supabase sin tocar, nada publicado, sin OTA.**

- **Academy, lecciones 1-7:** cuerpo pulido con la guía de LISTA-FINAL y
  «Frases de ese estilo» (metáforas, frases de folleto, calcos, rayas a la
  inglesa y jerga sin explicar). Sin cambiar hechos ni quitar avisos; el aviso
  legal común y el reforzado de cada lección no se tocan. Fecha de revisión
  legal **2026-11-04** en las siete (frontmatter, cabecera y pie). En la 04,
  «A fecha de esta revisión (21 de agosto de 2026)» pasa a «A 21 de agosto de
  2026». Regenerado con `node rwadar-academy.js` (web, sitemap y
  `rwadar-movil/lib/academy-contenido.js`). Inglés de los cuatro resúmenes de
  tarjeta que cambian (02, 03, 05, 06) y `copiar-idiomas-web.cjs`.
- **Privacidad:** por debajo de 600 px, las cuatro tablas pasan a filas
  apiladas con su etiqueta (`.tabla-apilada`, `.celda-etiqueta` en
  `privacidad-20260820.css`). En escritorio, la tabla de siempre. El texto
  legal, comparado con main sin las etiquetas, es idéntico.
- **Pruebas:** `npm test` en verde (web 580, móvil 409, acceso 144);
  `comprobar-ota-compatible.cjs --base c1f7106` en ok.
- **Pendiente:** la palabra «espejismos» sigue en el aviso reforzado de la
  lección 6 (texto legal, no lo he tocado). Las lecciones 8 y 9 («Próximamente»)
  no se han revisado.

## 4 de noviembre de 2026 (noche) · Claude · entrega 2026-11-03.8: textos de Reental, Toucan y RealT (sin aplicar)

Víctor: «hasta que no esté todo no has acabado». Rama local
`claude/catalogo-2026-11-03.8` (sale de `main`, b98719d), un commit.
**Sin push, Supabase sin tocar, nada publicado, sin OTA ni workflows.**

- **Qué es:** solo los textos de `public.plataformas` y `public.fuentes` que
  quedaron fuera de la .7. No crea revisión del catálogo: exige que la
  publicada sea la `f2732257` (aprobada y con su huella) y la deja publicada.
  `aplicar-y-aprobar.sql` SHA `c353e6d901f730b31b7be791c1d08e127c1c232b734c40d930bbe7f1847ea772`.
  - **Reental:** la nota sin «La opción más accesible…».
  - **Toucan:** «El bloqueo no viene de Toucan, sino de los registros de
    carbono: …» (el resto, igual).
  - **RealT:** «Liquidación anunciada» y un motivo nuevo que dice solo lo que
    dicen sus fuentes (BridgeDetroit ×2 y Outlier, abiertas con WebFetch hoy):
    la demanda «según la demanda», la orden «provisional», la liquidación «la
    dijo su cofundador» y «unos 700»; sin «la mayor demanda». Sus 3 fuentes,
    iguales, y una nueva: Outlier Media (16/07/2026), «RealT planea vender sus
    inmuebles de Detroit».
- **Guardas:** una transacción serializable; o todo como antes o todo ya como
  quedaría; las fuentes de RealT y de Toucan se comparan por **dirección y
  título** (el hueco del revisor), y Outlier también por sus fechas. Si algo
  no es exactamente lo previsto, no cambia nada.
- **Pruebas:** `comprobar-entrega.mjs` (PGlite) correcto, 29 comprobaciones,
  20 casos de fallo que no dejan nada; `preparar-entrega.mjs` reproducible;
  `npm test` completo en verde.
- **`comprobar-revision.mjs`:** una entrega sin revisión nueva no entra en la
  cadena de PGlite de las siguientes (su guarda depende de `02_seed.sql`).
- **El `textos-plataformas.sql` de la .7 queda superado: no aplicarlo.**
- **Pendiente (coordinador):** revisión independiente; unir a `main`; releer
  como visitante (compuerta, con hora); «Aplicar catálogo» con `2026-11-03.8`;
  comprobar en línea; `sincronizar.js`, `rwadar-fichas.js`, `volcar-seed.js`,
  `npm test`; sellar; «Publicar web». No hace falta OTA (la app lee estos
  textos de Supabase). Detalle en
  `rwadar-app/data/verificaciones/2026-11-03.8-v2/INFORME-ENTREGA.md`.


## 4 de noviembre de 2026 (tarde, 2) · Claude · remates, «Recién añadidas» y textos del catálogo publicados

Víctor: «hasta que no esté todo no has acabado» y «súbelo en cuanto esté».
PR #50 (remates, «Recién añadidas» y entrega 2026-11-03.7), unida a `main`.

- **Catálogo 2026-11-03.7:**
  - **Antes de aplicar:** lectura como visitante a las 16:58:48 UTC; la publicada
    era la `344a86aa`, con 24 ofertas (8/13/3).
  - **Aplicado** con «Aplicar catálogo» desde `main` (725a153).
  - **Después:** en línea, la `f2732257-206d-48ce-2067-c7e19fa33002`, con 24
    ofertas (8/13/3) y 26 plataformas. Sale el aviso nuevo («No está abierta a
    cualquier inversor minorista…») y ya no sale «No presentar como…».
  - **Sincronizado:** `sincronizar.js`, `rwadar-fichas.js` y
    `transparencia.json` (revisión y lote nuevos). `npm test` en verde.
- **Publicado:**
  - **Web:** «Publicar web» en preview y en producción desde `main` (d8dc6f5); la comprobación automática pasa en las dos. Comprobado con curl en producción: marca «Ofertas y plataformas tokenizadas», «Recién añadidas», el enlace a Academy, el aviso nuevo y el catálogo `f2732257`. `/ofertas/mf-one` sigue en 404.
  - **App:** OTA al canal production, runtime `1.4.1(23)`, con la comprobación de compatibilidad superada. No comprobada en un móvil.
- **Decisión de Víctor (04/11):** la nota legal NO lleva frase de «posiciones
  propias». Hoy no tiene inversiones en el radar y RWAdar no hace
  recomendaciones: valora datos y documentos. Si un día invierte en algo del
  radar, revisarlo con él.
- **Pendiente:** Reental, Toucan y RealT (`public.plataformas`), en otra
  entrega. El texto nuevo de RealT tiene que decir solo lo que dice su fuente.

## 4 de noviembre de 2026 (tarde, 3) · Claude · correcciones de la revisión a la entrega 2026-11-03.7 (sin aplicar)

Misma rama local `claude/catalogo-2026-11-04`, commits dd1cef2, 8caf488,
c72b09b, 37fc303, ca59546 y el de este traspaso. **Sin push, Supabase sin
tocar, nada publicado, sin OTA.** La entrada de abajo queda superada en lo
que diga distinto.

- **Revisión nueva `bd1f873b`** (la 89e88b04 no vale; sigue exigiendo la
  344a86aa publicada). 58 textos en vez de 51: además, el acceso de Spiko,
  Maple y Fireblocks (los vio la revisión) y, con la misma regla, Courtyard,
  OpenEden, Swarm y Reental. ARTEX ya no se contradice; retoques de
  castellano; la nota de RealT explica bien por qué se quita «la mayor
  demanda» (Outlier lo atribuye a la ciudad). Nada más cambia.
  `aplicar-y-aprobar.sql` d57b5dbc… (con `--con-textos-plataformas`,
  d2fecfef…).
- **App:** quitado el cambio a «Importante» (chocaba con `claude/remates`,
  que ya lo hace). La OTA tiene que salir después de unir remates.
- **Fila 19 hecha en el código:** «Marketplace» se lee «Mercado de
  compraventa» en la web, las fichas fijas y la app (en inglés,
  «Marketplace»); el valor de la base no cambia. La línea de tipo y región
  de la tarjeta móvil ocupa hasta dos líneas para no cortar la región.
- **Informe y revisión en el repositorio:**
  `rwadar-app/data/verificaciones/2026-11-03.7-v2/INFORME-ENTREGA.md` (pasos
  exactos en su §7) y `REVISION-ENTREGA.md`.
- **Pruebas:** ensayo PGlite correcto en las dos variantes; `npm test`
  completo en verde (web 579, fichas 68, precarga 32, móvil 406 + 2
  omitidas, acceso 144, base de datos sin fallos); guardián de la OTA ok;
  visto en Chrome sin red externa.
- **Unir con remates:** el código y los datos se unen sin conflictos; solo
  choca este archivo (las dos ramas añaden su entrada arriba): conservar las
  dos.
- **Pendiente (coordinador):** revisar los 15 textos marcados
  «(corrección)» y la fila 19; decidir `public.plataformas`; unir a `main`;
  leer como visitante que la publicada es la 344a86aa (compuerta, con hora);
  «Aplicar catálogo» con `2026-11-03.7`; sincronizar, regenerar y sellar;
  «Publicar web»; «OTA Android» después de remates.

## 4 de noviembre de 2026 (tarde, 2) · Claude · textos del catálogo para el lector (entrega 2026-11-03.7, sin aplicar)

Víctor: «hasta que no esté todo no has acabado». Rama local
`claude/catalogo-2026-11-04`, commits 7900819 (entrega) y 141812b (app).
**Sin push, Supabase sin tocar, nada publicado, sin OTA.**

- **Entrega `2026-11-03.7`** (revisión 89e88b04; exige que la publicada sea
  la 344a86aa). Solo cambian textos que ve el lector: los 26 avisos de
  plataforma (anexo A de la lista de frases), 22 notas de estado (anexo B) y
  tres detalles con «onboarding» o «ya se leen» (Ondo, Taurus, Blocksquare).
  Cifras, fechas, fuentes, colecciones y las 24 ofertas, idénticas a la .6.
  Cada texto, antes y después, en `textos-lector.json`; donde me aparto de
  la lista para no cambiar un hecho (ARTEX, INX, Lofty, Securitize, Swarm,
  Superstate, tZERO), lo explica su nota.
- **Por qué `.7` del 03/11 y no `2026-11-04`:** los datos son del 03/11 y el
  cargador exige esa fecha; fecharla el 04/11 alargaría la vigencia un día sin
  releer fuentes. No se usa `npm run catalogo` porque relee fuentes y renueva
  cifras; se hace como la .6, con `preparar-entrega.mjs`.
- **Reental (fila 18), Toucan (fila 75) y RealT** están en
  `public.plataformas` y `public.fuentes`, que el lote diario solo lee
  (CICLO-DIARIO §5). Van aparte en `textos-plataformas.sql`, con guarda e
  idempotente. Si se acepta tocar esas tablas,
  `preparar-entrega.mjs --con-textos-plataformas` los mete en el aplicador.
  RealT: sin «la mayor demanda…» (no está en las fuentes legibles; la de la
  ciudad da 403), «Liquidación anunciada», «unos 700» y una fuente nueva
  (Outlier Media, 16/07/2026) para la liquidación y la venta, que no tenían.
- **No se puede como dato (fila 19, «Marketplace»):** es un valor del tipo
  enumerado `rwa_actor`; cambiarlo es cambiar el esquema. Hay que hacerlo en
  el código de web y app, en lo que se enseña.
- **App:** el aviso de plataforma dice «Importante», como la web (antes
  «Alerta crítica»). El inglés ya existía.
- **Pruebas:** ensayo PGlite de la entrega correcto en las dos variantes;
  `npm test` completo en verde; `comprobar-ota-compatible.cjs` ok.
- **Pendiente (coordinador):** revisión independiente; decidir los textos de
  `public.plataformas`; unir a `main`; «Aplicar catálogo» con `2026-11-03.7`;
  sincronizar, regenerar fichas y sellar; «Publicar web» y «OTA Android».
  Si se aplican los textos de `public.plataformas`, `node rwadar-app/volcar-seed.js`
  para que `02_seed.sql` no se quede con los viejos.

## 4 de noviembre de 2026 (tarde, 3) · Claude · arreglos de la revisión de «Recién añadidas» (sin publicar)

Rama `claude/recien-anadidas`, commits 90b92c6 (web), 78ed069 (inglés) y
14c9510 (app); nada publicado, sin push ni OTA. Las
tarjetas del carrusel llevan su línea de riesgo (la de la Selección) y
«Revisa · N avisos en la ficha», o el aviso crítico entero, como la fila de
Ofertas; «Nueva» solo si tiene menos de 14 días; solo Principales.
«Ver todas las ofertas nuevas» quita filtros y búsqueda; con «Más nuevas
primero» no hay grupos por proveedor (escritorio y tableta). App: chips de
«Ordenar por» con diana de 48 px y «¿Cómo ordenamos?» propio para ese orden
(su inglés en el bloque «Recién añadidas (04/11)»). Web: una sola raya bajo
la portada, también con el carrusel oculto. Fuera dos pruebas que miraban el
texto del código. `npm test` en verde y OTA compatible con c1f7106.

## 4 de noviembre de 2026 (tarde, 2) · Claude · «Recién añadidas» en Inicio y «Nueva» en Ofertas, web y app (sin publicar)

Víctor: «pondría las más nuevas o las recién añadidas, algo así que venda».
Rama local `claude/recien-anadidas` (sale de `claude/remates`, 38cf6f1),
commits 574bb9a (web), 1872c68 (inglés) y 43cd0d5 (app). **Nada publicado,
sin push, Supabase y EAS sin tocar, sin OTA.** La novedad es un hecho: la
fecha de alta en el radar (`anadidaEl` de `transparencia.json`, que ya
llevaban la web y la app); sin «oportunidad», urgencia ni rentabilidades.

- **Inicio** (web y app): carrusel «Recién añadidas» justo bajo la portada y
  antes del 01, con las tarjetas de la Selección: foto, título en 2 líneas,
  proveedor y lugar, «Nueva» y «Añadida el 03/11/2026»; la tarjeta entera abre
  su ficha (los avisos siguen en ella). Altas de los últimos 30 días, de la
  más nueva a la más antigua y 6 como mucho: hoy Kraken xStocks y Spiko Smart
  Cash (03/11), Robinhood y Spiko Dólar (02/11). Sin ninguna, o con el
  catálogo caducado, no sale. Debajo, «Imágenes ilustrativas…» y «Ver todas
  las ofertas nuevas ›», que abre Principales con «Más nuevas primero».
- **Ofertas:** etiqueta de estado «Nueva» (verde suave, sin borde) en las
  filas de menos de 14 días y la opción «Más nuevas primero» (en la web, en
  el selector; en la app, nuevo «Ordenar por» con «Las más al día primero» y
  «Más nuevas primero»). Con ese orden la lista va seguida, sin separar la
  Selección, para que la más nueva quede arriba.
- **Código:** web en `rwadar-20260820.js` (`altaOferta`, `ofertaNueva`,
  `masNuevasPrimero` junto a `transparenciaOferta`; `ofertasRecienAnadidas` y
  `tarjetaNuevaHtml` junto a la Selección), `index.html` y 17 líneas de CSS;
  app en `lib/recien-anadidas.js` (la misma lógica),
  `componentes/RecienAnadidas.js`, y pocas líneas en `Inicio.js`,
  `Ofertas.js` (prop `nueva`) y `App.js`. El `index.html` se sube con el
  pre-renderizado de antes: lo rehace `rwadar-publicar.js` al publicar.
- **Inglés:** bloque «// Recién añadidas (04/11)» en `lib/idioma-en.js`, antes
  de las entradas del mapa («Just added», «New», «Added on…», «See all new
  offers», «Newest first»…); fuera dos entradas viejas sin uso. Copiado a la
  web con `copiar-idiomas-web.cjs`.
- **Pruebas** (sin fijar textos): `rwadar-movil/tests/recien-anadidas.test.cjs`
  (3) y una en `probar-web.mjs` (altas de 30 días, ordenadas, oculto sin
  ninguna); la de «Imágenes ilustrativas…» en Inicio cuenta ahora 2.
  `npm test` completo en verde (web 580, fichas 68, precarga 32, móvil 411:
  409 + 2 omitidas, acceso 144, base de datos sin fallos; `probar-orden.mjs`
  solo avisa de `App.js`, como antes). OTA compatible con c1f7106 (`ok: true`).
- **Capturas** (390 × 844, dsf 2, sin red) en el scratchpad de la sesión,
  `recien/`: `web-inicio-carrusel`, `web-ofertas-nuevas`,
  `app-inicio-carrusel` y `app-ofertas-nuevas`.
- **Al mezclar con `claude/remates`:** el bloque de inglés va aparte para no
  chocar; después, `node rwadar-movil/scripts/copiar-idiomas-web.cjs`.
  `probar-web.mjs` queda en 239,7 KB (presupuesto 240 KB).
- **Pendiente:** publicar web y OTA, solo con permiso de Víctor; probarlo en
  un Android real.

## 4 de noviembre de 2026 (noche, 2) · Claude · corrector de los remates (sin publicar)

Sigue la rama local `claude/remates`, sin push. **Nada publicado, Supabase y
EAS sin tocar, sin OTA.** `comprobar-ota-compatible.cjs --base c1f7106…` da
ok; el `package.json` raíz y los archivos protegidos de `rwadar-movil` no
cambian.

- **Fila 17 completa:** quedaban cinco «ha vencido» (aviso del catálogo, fila
  «Revisada esta semana» de la ficha, página fija y app). Ahora todo dice «la
  revisión semanal ha caducado». Comprobado con el reloj en el 12/11/2026.
- **Inglés que faltaba** (web y app comparten diccionario y motor):
  Academy (progreso, niveles, rótulos y resúmenes de las tarjetas, migas,
  fechas, índice, paginación y test de las lecciones, y las etiquetas
  accesibles de la app), Plataformas (recuento, «Show 20 more», filtros,
  regiones, radar, comparación, ficha), cabeceras de las colecciones de
  Ofertas, avisos del catálogo caducado y las filas del menú de Perfil de la
  app. Las dos etiquetas de filtros que la rama había dejado a medias
  («Filter by tipo de inversor») ya salen enteras. Un barrido en inglés de la
  web (390 y 1366 px) ya solo encuentra en castellano datos del catálogo
  (nombres, tipo · región de las plataformas, avisos de la fila 11) y el
  cuerpo de las lecciones.
- **Cuerpo de las lecciones y aviso legal de Academy:** siguen en castellano,
  ahora marcados como «Original source text (Spanish)» también en la app y en
  el índice de la web. **Lo decide Víctor** si el aviso legal se traduce.
- **«Registro» → «catálogo»** donde es interfaz: pie («Última revisión del
  catálogo»), «Explorar el catálogo», «Alcance del catálogo…», «El catálogo en
  cifras», el radar, el aviso de «Nada abierto con ese filtro» y el pie de
  Academy. **Quedan para Víctor** las frases legales que usan «registro»: «RWAdar
  es un registro editorial independiente…» (Inicio y app), «El registro y su
  selección no pueden reproducirse…» (pie) y la de Privacidad.
- **Aviso de correo** al aceptar los avisos: ya no habla de Brevo ni de la
  prueba «de extremo a extremo».
- **Tablas legales en el móvil:** letra un punto menor y menos relleno; por
  debajo de 380 px, guiones en las palabras largas. Las cuatro de Privacidad,
  la de Transparencia comercial y la de Para empresas caben en su caja a 390,
  360 y 320 px. El texto legal no cambia.
- **Corrección a la entrada anterior:** el enlace a Academy de Inicio solo se
  ve por debajo de 768 px. En escritorio no aparece; Academy sigue en el menú
  de arriba y en su sección de la portada.
- **Pruebas:** `npm test` completo en verde: rwadar-app sin fallos (27
  bloques, 30 comprobaciones SQL y el mapa, 11 de 11), web 579, fichas 68,
  precarga 32, QR, móvil 406 + 2 omitidas, herramientas al día, acceso 144.
  Gitleaks sin hallazgos en cada commit.
- **Capturas** a 390 × 844, dsf 2, en el scratchpad de la sesión
  (`corr-remates/capturas/`): Academy, Plataformas y ficha en inglés (web),
  índice de Academy en inglés con el aviso legal, tabla de Privacidad, ficha
  fija con la revisión caducada (12/11) y, en la app en inglés, Perfil,
  Academy y una lección con su aviso legal.

**Pendiente:** lo mismo que en la entrada anterior (catálogo, cuerpo de las
lecciones) y las decisiones de Víctor de arriba. En la ficha de plataforma,
los valores de la tabla de datos (acceso, tipo de activo, región) siguen en
castellano a propósito: se tratan como dato de la fuente.

---

## 4 de noviembre de 2026 (noche) · Claude · remates de web y app (sin publicar)

Víctor: «hasta que no esté todo no has acabado». Rama local `claude/remates`
(sale de `main` 2f9348d), commits f8f10a8…dae1ded. **Nada publicado, sin
push, Supabase y EAS sin tocar, sin OTA.** El `package.json` raíz y
`rwadar-movil/package.json`, `package-lock.json`, `app.json`, `eas.json` y
`scripts/` no cambian; `comprobar-ota-compatible.cjs --base c1f7106…` da ok.

- **Marca** (decisión de Víctor, fila 10): «Ofertas y plataformas
  tokenizadas» bajo el logo (cabecera y pie), en el título, el JSON-LD, el
  nombre al instalar y `og.png`; «Catálogo independiente» en vez de «Registro
  independiente». Inglés: «Tokenised offers and platforms». `og.mjs` incrusta
  ya las fuentes (antes salía con letra de sustitución), lleva el titular de la
  web y los sectores sin abreviar (filas 2, 71 y 92). La app no enseña
  subtítulo bajo el logo: no había dónde cambiarlo.
- **Academy desde Inicio** (decisión de Víctor): «¿Empiezas de cero? 7
  lecciones gratis en Academy ›» junto a «Mira, compara y decide tú», en la web
  (lo escribe `rwadar-academy.js` con el número real; solo se ve por
  debajo de 768 px, donde abre la pestaña Academy) y en la app (cuenta las lecciones
  publicadas y abre Academy). Inglés incluido.
- **Lista de frases, todo lo que vive en el código:** cuentas y seguimiento
  (49-51, 53, 54: «Seguir» y «lista de seguimiento» también en la app y en
  Privacidad; el aviso de correo sin Brevo ni «de extremo a extremo»), Academy
  (59-62, 64-69; solo títulos y rótulos, el cuerpo y las fechas de revisión
  legal de las lecciones no cambian), legales y comerciales (77, 78, 84, 85,
  88 y 89, sin cambiar ningún hecho; el ancla `#consultas-b2b` se queda), las
  partes que faltaban de 20, 23 y 39, y 6, 11, 13, 15, 16, 17, 21, 22, 26, 32,
  35, 37, 38, 42, 43, 44, 47 y 55 donde quedaban (sobre todo en la app). El
  texto centinela «Salida por volver a comprobar» cambia a la vez en web,
  fichas, `ficha-editorial` (web y app) y app.
- **App igual que la web:** la foto de la ficha sin etiqueta encima y con el
  pie «Imágenes ilustrativas, no fotos del activo» (el manifiesto exige ahora
  `pieVisibleObligatorio`; el alt sigue empezando por «Ilustración
  editorial»); «Ficha completa ↗» (abre /ofertas/<slug> con Linking) y
  «Compartir» (Share de react-native); la línea de novedades con el resumen
  corto (`rwadar-noticias.js` lo copia a la app); inglés que faltaba
  (categorías y niveles de Academy, chips con recuento, «Comprobado en»,
  etiquetas accesibles…).
- **Fuentes de Inicio en inglés:** `texto_en` en las 38 y `titulo_en` en los
  grupos; `fuentes.mjs` pinta las dos en la web (se ve la del idioma elegido) y
  genera `rwadar-movil/lib/inicio-fuentes.js`, que era copia a mano.
- **Fechas** de las fichas generadas en dd/mm/aaaa.
- **Prueba del mapa** al día: cuenta del catálogo (hoy 12 de 24 ofertas con
  ubicación), recoge el mapa nuevo (JSON local al abrir Mapa, `#mapaMargen`,
  marcadores agrupados por zoom, aviso sin teselas) y entra en la cadena
  `test` de `rwadar-app/package.json`.
- **Otros:** «Consúltalo en su web» no sale en grande donde va el precio; las
  tablas de las páginas legales caben a 390 px en Transparencia comercial.
- **Pruebas:** `npm test` completo en verde (rwadar-app con el mapa, 11
  pruebas; web 579; fichas 68; precarga 32; QR; móvil 406 + 2 omitidas;
  herramientas; acceso 144). Gitleaks sin hallazgos en cada commit.
- **Capturas** a 390 × 844, dsf 2, en el scratchpad de la sesión
  (`remates/`): cabecera (móvil y escritorio), Inicio con el enlace a Academy
  (web y app), ficha de la app, Academy (web y app), Transparencia comercial y
  Privacidad, y `og.png`.

**Pendiente:**
- **Ciclo de catálogo (otro agente, con permiso):** filas 11 (textos), 12, 18,
  19 y 75, anexos A y B y RealT. Esos textos siguen en castellano también en
  inglés: son datos.
- Las lecciones citan en su cuerpo «aprenderás a leer el radar» (lección 06),
  «Trazabilidad» (03) y «Mercado secundario»: cambiarlas obliga a renovar su
  fecha de revisión legal, así que no se han tocado.
- Las tablas de Privacidad siguen con desplazamiento lateral dentro de su caja
  a 390 px (como antes).
- Publicar web y OTA: lo hace el coordinador.

---

## 4 de noviembre de 2026 (tarde) · Claude · rediseño publicado en web y app

Víctor: «súbelo todo en cuanto esté». PR #47 (rediseño) y #48 (arreglo de la
OTA), unidas a `main` con merge commit.

- **Web:** preview y producción publicadas desde `main` (7df24f3) con
  `publicar.yml`; la comprobación automática pasa en las dos. Comprobado
  también con curl en producción: el nuevo Inicio, la barra de 5 y
  «Descartadas»; las fichas dan 200 y `/ofertas/mf-one` sigue en 404.
- **App:** OTA `ota-android.yml` al canal production, runtime `1.4.1(23)`,
  desde 8118886. La primera se paró en «Compatibilidad con el APK instalado»
  porque el `package.json` raíz había cambiado (solo `test:tools`). Ahora
  vuelve a ser el del APK y `generar.mjs --comprobar` lanza también
  `transparencia.mjs` y `fuentes.mjs` (PR #48). No comprobada en un móvil.
- **Sello:** `estado.json` sobre 031ac44, auditoría «LISTO PARA CORTE FINAL».
- **Las entradas de abajo marcadas «sin publicar» ya están publicadas.**
- **Pendiente:**
  - textos del catálogo en Supabase (alertas y notas de plataformas, Reental,
    RealT): necesitan un ciclo de catálogo con permiso de Víctor;
  - decisiones de Víctor sobre el subtítulo «Registro de tokenización» y sobre
    el acceso a Academy desde Inicio;
  - `rwadar-app/probar-mapa-buscar.test.cjs` está fuera de `npm test` y espera
    49 ofertas: hay que ponerlo al día.

## 4 de noviembre de 2026 (5) · Claude · revisión app frente a web final y arreglos pequeños (sin publicar)

- Rama local `claude/inicio-historia`, commits 8f2332b y 3e36d1d (**nada publicado, sin push, Supabase y EAS sin tocar, sin OTA**; `package.json`, `app.json`, `eas.json` y `scripts/` sin cambios desde 6b008ca). Comparado el texto visible de Inicio, Ofertas (las tres pestañas), la ficha (Robinhood, mTBILL, Boss Info) y el inglés en Expo web y en la web local: portada con «Fuentes» como la web; fila con el estado de la web («Cifras por actualizar», «Fuentes en conflicto», «Liquidez no confirmada», «Apertura no confirmada») en ámbar y la fecha de la revisión; reventa y próximas enseñan su mínimo y su salida documentados (antes «No verificado» en todas, porque el catálogo remoto las marca `cifrasPendientes`); «Otras ofertas principales» y buscador «Ej.: Spiko, Suiza…»; en la ficha, «Cifras» solo con el estado, la salida sin «Salida:» y los costes con la métrica. Zonas de toque ≥ 44 px. `npm test` completo en verde (móvil 406 + 2 omitidas). Pendiente (fuera de `rwadar-movil/`): la línea de novedades de la app usa el `titulo` y no el `resumen` porque `rwadar-noticias.js` no copia `resumen` a la app.

## 4 de noviembre de 2026 (4) · Claude · la app dice y enseña lo mismo que la web final (sin publicar)

- Rama local `claude/inicio-historia`, commits a485ded…a787dde encima del merge 6b008ca (**nada publicado, sin push, Supabase y EAS sin tocar, sin OTA**): Inicio con los textos cortos de la web (03 con carrusel de 5, nota legal corta con la completa plegada, aviso de riesgo junto a «Mira, compara y decide tú», «Ver las 24 ofertas» en el 06); ficha de oferta como `abrirDetalleOfertaLocal` («Lo esencial» y avisos arriba; «Antes de invertir», «No es una recomendación…» y «Ver oferta en <proveedor> ↗»; lo demás plegado; sin «Consultar fuente» grande); «Cifras válidas N días más», comprobación 2 y «Inscrita en la CNMV (UE)», «Selección RWAdar · pasan nuestras 5 comprobaciones», pestañas de Ofertas en inglés y fechas dd/mm/aaaa; fila con los puntos fuertes en la columna del texto; diccionario con 5 claves nuevas y una repetida fuera, copiado a la web; `npm test` completo en verde (móvil 406 + 2 omitidas); capturas en el scratchpad (`app-final/`). Pendiente: la app conserva su etiqueta obligatoria «Ilustración editorial» sobre la foto en vez del pie «Imágenes ilustrativas…», y no tiene «Ficha completa · Copiar enlace».

## 4 de noviembre de 2026 · Claude · corrector del Inicio: menos reglas, más fácil de leer (sin publicar)

Rama local `claude/inicio-historia`, commits c6a5475…0004444 (encima de
61cf23e). **Nada publicado, nada en `main`, Supabase sin tocar, sin push.**

- **Pruebas de frases, fuera** (decisión de Víctor del 04/11: «ese tipo de
  reglas quítalas… hay que tener en cuenta la legalidad y ya está»). Se
  quitan de `probar-web.mjs` la lista de frases prohibidas, la de llamadas
  [n], la de «Descartadas»/«Fuera del radar», la del tamaño de los avisos, la
  de notas x/5 y las frases exactas de Inicio, Perfil, Avisos, Buscar, la
  Selección y la ficha; en `probar-para-empresas.mjs`, «no es una oferta
  comercial» (y se aplica la fila 83). Se quedan las funcionales. Los avisos
  legales siguen en la web: los cuida la revisión editorial.
- **Inicio más corto** (textos del revisor de lectura, con su inglés): de
  1.833 a 1.118 palabras visibles y de 10.215 a 7.873 px a 390. Capítulo 03 con
  dos frases y un carrusel de 5 («1 de 5»); lo que sale de la vista va al
  «Saber más» de su capítulo, con las mismas fuentes. Aviso de riesgo junto a
  «Mira, compara y decide tú»; nota legal corta con la completa plegada;
  «Ver las 24 ofertas» junto a «Explorar el radar» en el 06.
- **Ficha de oferta:** «Lo esencial» y «Avisos de esta oferta» arriba;
  luego foto, «Antes de invertir», «No es una recomendación de inversión…»
  y «Ver oferta en <proveedor> ↗»; lo demás plegado. Robinhood: de 3.891 a
  1.978 px y los avisos a 641 px (antes, 3.241). El pie era un `<footer>` y la
  regla global lo ocultaba en el móvil. Página fija: supervisión con el
  motivo de la comprobación, los avisos arriba y el botón tras los riesgos.
- **Legal:** la comprobación 2 dice «autorizada por un supervisor de la UE e
  inscrita en la CNMV» y la cápsula «Inscrita en la CNMV (UE)»
  (`transparencia.json`, regenerado para web y app).
- **Otros:** «cifras válidas 6 días más»; fechas dd/mm/aaaa en la web
  dinámica (y el pie); Plataformas con la foto limpia y el texto debajo; el
  orden de Ofertas cabe entero; «Descartadas» en Academy, la noticia del
  28/09, /cambios y el RSS (regenera `academy-contenido.js` y
  `noticias-contenido.js` de la app); «Excluded» en inglés; Atrás cierra la
  ficha sin salir de la web y, desde Inicio, vuelve a Inicio; /#fuera y
  /#metodo abren su detalle y /#fuentes-cap3 se queda en Inicio; con el
  catálogo caducado, pasar de inglés a castellano ya no deja la portada en
  inglés (`data-rel-sin`); 320 px sin cortes; Academy y páginas legales sin
  mayúsculas de máquina ni borde verde.
- **Pruebas:** `npm test` completo en verde (web 579, fichas 68, precarga 32,
  móvil 394 + 2 omitidas, acceso 144, base de datos sin fallos).
  `probar-orden.mjs` solo avisa de `App.js`, como antes. CSS 165 279 B,
  `probar-web.mjs` 238 362 B. Capturas y `medidas.json` en el scratchpad de
  la sesión (`inicio-real/`), 0 errores y 0 peticiones externas.

**Pendiente:**
- **Víctor:** la línea de posiciones propias de la nota legal (MAR art. 20;
  no se ha escrito nada sin su respuesta), el relato en escritorio, el acceso
  a Academy desde Inicio (ya no lo frena ninguna prueba), el subtítulo
  «Registro de tokenización».
- **Ciclo de catálogo (con su permiso):** RealT («la mayor demanda…», «En
  liquidación» → «Liquidación anunciada», «unos 700»), la categoría de los
  derivados y la métrica de costes en castellano donde no exista.
- **Sin hacer por tamaño:** las 38 descripciones de fuentes en inglés
  (`texto_en` en `fuentes.json`), el texto del enlace de cada fuente, la
  página fija con todo plegado como la ficha y la app (otro agente).

## 4 de noviembre de 2026 · Claude · correcciones del revisor en el mapa de Ofertas (sin publicar)

Misma rama local `claude/mapa-ofertas`, commits efb366c, f095a09, f10ecf7 y
ad2749c sobre la entrada de abajo. **Nada publicado, sin push, Supabase sin
tocar.** Solo los tres archivos del mapa, el bloque `#buscarMapa` de
`index.html` y cuatro entradas junto a las del mapa en `idioma-en.js`
(copiadas con `copiar-idiomas-web.cjs`).

- **Marcadores que se tapaban:** `agruparCerca()` (en `mapa-buscar-util`)
  junta los que en pantalla quedarían a menos de 40 px con el zoom actual y
  se rehace al cambiar de zoom (si los grupos no cambian, no se toca nada y
  la ficha sigue abierta). El grupo muestra el número; su ficha dice «N
  ofertas en esta zona» y, si los puntos no son el mismo, trae «Acercar»,
  que amplía hasta separarlos. Leyenda: «Varias ofertas juntas». Medido: 0
  marcadores tapados a 320, 360, 390 y 1366 px, en castellano e inglés.
- **Teclado:** al abrir una ficha el foco va a su título; Escape (Leaflet no
  lo atendía con el foco dentro), la X o «Acercar» lo devuelven al marcador.
  «Quitar mi ubicación» pasa el foco a «Usar mi ubicación».
- **Avisos en una franja arriba del mapa** (`#mapaAvisos`, fuera del lienzo
  de Leaflet): «No se ha podido cargar el mapa base» con «Reintentar» ya no
  queda bajo los puntos, y los avisos que piden hacer algo (ubicación
  denegada, zona sin resultados) salen ahí con una X en vez de empujar los
  mandos. Antes de cargar siguen bajo la tarjeta. La ficha se abre por
  debajo de la franja y con alto máximo que no tapa el zoom.
- **Chips:** «Buscar aquí» (con `title` «Buscar en la zona visible del
  mapa») y «Quitar mi ubicación» baja junto a la línea de distancias. Caben
  en una línea de 320 a 1366 px; si no cupieran (iOS pone el selector a
  16 px), bajan de línea en vez de cortarse.
- **Contraste:** aro oscuro fino por fuera del blanco en cada marcador
  (borde 7,2:1 sobre el mapa claro). «Fuente» de la ficha, gris como se
  quería.
- **«Usar mi ubicación» desde España** encuadra tu punto y las tres ofertas
  más cercanas (hoy, un grupo «12» en Austria), en vez de un zoom 10 vacío.
- **Cifras con el idioma:** «1,558 km» y «± 15 km» en inglés (antes
  «± 15.000 m»); de 1 km en adelante el margen va en km.
- **Pruebas:** `npm test` completo en verde (probar-web 578 correctas;
  fichas 68; precarga 32; móvil 394; acceso 144; base de datos sin fallos).
  `probar-web.mjs` sin cambios. `rwadar-app/probar-mapa-buscar.test.cjs`
  sigue fuera de `npm test` y falla los mismos 6 de 10 que antes, por las
  mismas razones (catálogo de 49, JSON local al abrir Mapa, margen en
  `#mapaMargen`); no lo toqué porque estaba fuera del alcance de esta tanda.
- Capturas con teselas reales en el scratchpad de la sesión (`mapa/`, con
  `medidas.json`): 19 teselas nuevas bajadas con curl, 49 en la caché (tope
  80). Antes de «Cargar mapa», 0 teselas y sin Leaflet.

**Pendiente:** actualizar `probar-mapa-buscar.test.cjs` (24 ofertas, 12 con
ubicación, una petición local antes de cargar, margen en `#mapaMargen`) y
meterlo en `npm test`, si Víctor quiere. Publicar necesita su permiso.

---

## 4 de noviembre de 2026 · Claude · mapa de Ofertas claro (sin publicar)

Rama local `claude/mapa-ofertas` (sale de `claude/inicio-historia`), commits
25a3a14 y c341f0e. **Nada publicado, nada en `main`, Supabase sin tocar, app
sin tocar** (salvo el diccionario común `rwadar-movil/lib/idioma-en.js`).
Decisión de Víctor del 04/11: «Oscuro no me gusta el mapa, mejóralo».

- **Solo** `mapa-buscar-20261027.js`, `mapa-buscar-20261027.css`, el bloque
  `#buscarMapa` de `index.html` y 69 entradas de inglés junto a «Lista» y
  «Mapa» en `idioma-en.js` (copiadas con `copiar-idiomas-web.cjs`).
  `mapa-buscar-util-20261027.js` no cambia.
- **Antes de cargar:** «Dónde están los activos», «12 de 24 ofertas tienen
  ubicación documentada» (sale del JSON local de ubicaciones, que ahora se
  pide al abrir Mapa; es del propio sitio y no contacta con OpenStreetMap),
  una línea de privacidad, «Cargar mapa» y el detalle en «Más información».
- **Mandos:** buscador con botón de icono y «Usar mi ubicación» como botón de
  icono en una fila; selector «Todas», «Ver todo» y «Buscar en esta zona»
  como chips de 36 px en la segunda (caben enteros a 390 px). La instrucción
  queda para el lector de pantalla. Los avisos rutinarios solo se anuncian;
  los que piden hacer algo (permiso denegado, fallo) también se ven.
- **Mapa claro:** teselas estándar de OpenStreetMap sin filtro oscuro, solo
  `saturate(.72)`; 60 vh en el móvil, a todo el ancho y con radio de 16 px.
  Zoom blanco de 44 px abajo a la derecha. Si no llega ninguna tesela, aviso
  blanco «No se ha podido cargar el mapa base» con «Reintentar», bajo los
  puntos y la ficha. Las teselas se piden ya con la vista ajustada a las
  ofertas (antes se pedía primero el mundo entero). Fuera el
  `mix-blend-mode: plus-lighter` de Leaflet en las teselas: con el lienzo en
  fracción de píxel dejaba una raya blanca en cada junta.
- **Marcadores:** `divIcon` con el color de su tipo (clases `cat-N` del
  radar), icono del tipo o el número centrado si hay varias en el mismo
  punto, 44 px de toque; «ciudad aproximada» con halo. Leyenda bajo el mapa
  con los tipos presentes.
- **Ficha emergente blanca:** título en dos líneas que no tapa nada, tipo y
  colección, lugar, precisión en una línea («Punto indicado por el proveedor»
  o «Ciudad aproximada»), «Ver ficha» (abre la misma ficha que la lista:
  botón con `data-oferta-detalle`; Leaflet 1.9 deja subir el clic) y la fuente
  con su fecha. AutoPan con margen calculado al abrir: cabecera fija, barra
  inferior y zoom.
- **Debajo del mapa** (al lado en escritorio): «N ofertas en el mapa / en
  esta zona / por distancia a tu ubicación» y filas compactas con miniatura,
  como las de Ofertas; toda la fila abre la ficha, la fuente abre su pestaña.
  Las notas de precisión del JSON van una sola vez en el pie.
- **Privacidad igual:** teselas solo tras «Cargar mapa» (comprobado: 0
  teselas y 0 Leaflet antes), aviso de IP, ubicación con permiso, una vez y
  sin guardar, atribución de OpenStreetMap.
- **Pruebas:** `probar-web.mjs` sin cambios (578 correctas). `npm test`
  completo en verde. Ojo: `rwadar-app/probar-mapa-buscar.test.cjs` no está en
  `npm test` y ya fallaba 5 de 10 antes de este cambio (espera el catálogo de
  49 y hoy hay 24). Ahora fallan además, a propósito, dos comprobaciones: que
  abrir Mapa no pida nada (pide el JSON local para la cuenta) y que «140 m»
  esté en `#mapaOrigen` (el margen va en `#mapaMargen` para que la frase se
  traduzca). Siguen bien la del publicador, la de Leaflet y la de cabeceras.
- Capturas con teselas reales (30 descargadas con curl a una caché, de un
  máximo de 80) a 390 × 844 y 1366 × 900 en el scratchpad de la sesión
  (`mapa/`), con `medidas.json`; inglés comprobado sin restos en castellano.

**Pendiente:** actualizar `probar-mapa-buscar.test.cjs` al catálogo de 24 y
meterlo en `npm test`, si Víctor quiere. Publicar necesita su permiso.

---

## 4 de noviembre de 2026 · Claude · Inicio como historia, barra de 5 y «Descartadas» (sin publicar)

Rama local `claude/inicio-historia` (sale de `claude/acabados`), commits
cc11db1…fe349fb. **Nada publicado, nada en `main`, Supabase sin tocar, app sin
tocar** (salvo el diccionario `rwadar-movil/lib/idioma-en.js`, que es común).

- **Inicio cuenta la historia** de HISTORIA-v2 con el orden de ESPEC-INICIO:
  radar vivo arriba, seis capítulos, novedades, Selección con sus 5
  comprobaciones a la vista, «Mira, compara y decide tú», fuentes y nota legal.
  Sin buscador. La comunidad pasa a Perfil.
- **Texto limpio, sin llamadas [n]** (decisión de Víctor del 04/11: «Los
  números 9 10 14 18, ¿los puedes quitar del texto?»). Cada apartado acaba en
  «Fuentes de este apartado ›», que abre su grupo en la lista del final, con
  «Volver al texto». Las 38 fuentes viven en
  `rwadar-editorial-source/inicio/fuentes.json` y las escribe `fuentes.mjs`
  (con `--comprobar` en `test:tools`).
- **Cifras del catálogo** (24, 26, 4, 3, 5, «una de ellas, de 1 $», fechas) solo
  en `cifrasInicio()`; sin catálogo vigente se ocultan la Selección, los
  mínimos y la vigencia, y la línea de riesgo se queda.
- **Barra de 5:** Inicio · Ofertas · Plataformas · Academy · Perfil. Fuera el
  selector de Buscar; la vista sigue en `body[data-movil-buscar]`. Siguen
  igual `data-movil-ir`, `data-movil-tab`, los hash (`#tool` marca
  Plataformas), «Explorar el radar», las fichas y su vuelta. Escritorio igual.
- **«Descartadas»** («Discarded» en inglés) en todos los rótulos de la web y en
  las fichas de descarte («… · Plataforma descartada»). La ruta
  `/fuera-del-radar/` y `#fuera` no cambian.
- **Frases de LISTA-FINAL.md** que están en el código de la web: filas 1-3,
  5, 7-9, 11 (solo el rótulo), 13, 16, 20, 22, 23 (solo la tercera frase),
  24-34, 35, 36-42, 44-48, 52, 55-58, 63, 70-74, 76, 77, 79-83, 85-87, 89-91
  y 93, con su inglés.
- **Inglés:** Inicio entero (comprobado: ningún texto en castellano queda en
  el panel) y las frases nuevas; plantillas propias en `idioma-web`.
- **Pruebas** (`probar-web.mjs`, comentario con la decisión en cada cambio):
  la barra pasa a 5 botones, Inicio nuevo, Selección, comprobaciones y cifras;
  nuevas: sin `[n]` visible y cada apartado con su grupo de fuentes, frases
  prohibidas, «Descartadas» sí y «Fuera del radar» no, y los enlaces de
  siempre. Los arneses del service worker pasan a `probar-web-pwa.mjs` para
  que `probar-web.mjs` siga por debajo de su presupuesto (239 854 B). También
  `probar-fichas.cjs`, `rwadar-app/probar-verificacion-local-ui.mjs` y
  `rwadar-app/probar-transparencia-comercial.mjs` (frases nuevas).
- `npm test` completo en verde; `probar-orden.mjs` solo avisa de `App.js`,
  como antes. CSS 165 074 B (de 155 166), JS 381 378 B.
- Capturas a 390 × 844, 360 × 780, 375 × 667 y 1366 × 900, y `medidas.json`, en
  el scratchpad de la sesión (`inicio-real/`). La portada mide lo mismo que la
  maqueta: botón 595-643, aviso 651-723 y «Explorar el radar» 723-767 a 390 px.

**Pendiente:**
- **Datos del catálogo (ciclo con permiso de Víctor):** avisos y notas de
  plataforma (filas 11-12, anexos A y B), Reental (18), «Marketplace» (19) y
  el motivo de Toucan (75).
- **Decisión de Víctor:** el subtítulo «Registro de tokenización» (fila 10 y
  92, con `og.png`), el acceso a Academy desde Inicio, sus posiciones propias,
  la relación pagada y «la mayor demanda» de RealT (ESPEC-INICIO §10).
- **Ciclo de la app** (mismo texto o pruebas de paridad en `rwadar-movil`):
  filas 14, 17, 23 (dos primeras frases) y 43; «Descartadas» en `App.js`,
  `Inicio.js`, Academy y noticias (`noticias.json` y `academy.json` reescriben
  archivos de la app; por eso «Fuera del radar» sigue en las lecciones, en
  `/cambios` y en el RSS), y la barra de 5 en la app.
- **No aplicadas por ahora:** cuentas y vigilancia (49-51, 53, 54: la cuenta
  está en pausa y sus pruebas fijan esas frases), Academy (59-62, 64-69),
  conversión y B2B (78, 84, 88), y la fila 83 conserva «no es una oferta
  comercial» porque lo exige `probar-para-empresas.mjs`.
- `transparencia.json` sigue con sus criterios antiguos: Inicio enseña los de
  HISTORIA-v2 en llano y la ficha los del archivo (cambiarlo reescribe
  `rwadar-movil/lib/transparencia-contenido.js`).
- Notas del coordinador, confirmadas: portadas de Plataformas con texto y
  cápsula encima, «Cifras vigentes 6 d» y el «Consultar fuente» grande en el
  sitio del precio de la ficha. El tren del capítulo 6 es el único y no mete
  prisa.
- Publicar necesita el permiso de Víctor.

## 4 de noviembre de 2026 (3) · Claude · corrector del port a la app (sin publicar)

Misma rama local `claude/app-rediseno`, commits 9c8fcd9…12e8d44 encima de
7b09367, solo en `rwadar-movil/` y este archivo. **Nada publicado, sin push,
sin OTA ni EAS, Supabase sin tocar**, sin dependencias ni código nativo; ni
`package.json`, ni `app.json`, ni `eas.json`, ni `scripts/`, ni la web.

- **Aviso de riesgo medido** (ESPEC-INICIO §3): va antes del botón si,
  después, quedaría bajo la barra (lo mide con `onLayout`, así que cuenta la
  letra grande de Android y «Revisión pendiente» arriba). Medido en Expo
  web: 390 × 844 aviso después (botón 608-656, aviso 666-738, barra 776);
  360 × 780, 375 × 667, 320 × 640 y 390 × 844 caducado, aviso antes y
  entero sobre la barra. A 375 × 667 el botón ya cabe entero (518-566,
  barra 599): radar de 132 px y márgenes más cortos.
- **«Está en «Descartadas»»** abre Plataformas y baja a «Descartadas»
  (estaba 5.924 px más abajo). Captura `09-tras-descartadas.png`.
- **Inglés «Excluded»** (ESPEC §2.11 y HISTORIA-v2), no «Discarded»: 1
  entrada de `lib/idioma-en.js` y **3** de `lib/inicio-contenido.js`
  (no 2, como decía la entrada de abajo), con «we exclude».
- **Selección de Inicio como la web:** solo principales, en el orden de la
  web (Robinhood, Euro, Dólar), nota de riesgo de respaldo «Puedes perder
  parte o todo lo que inviertas.» si entra otra oferta, y «1 $».
- **Las cifras de mercado del 03 caducan solas:** pasados 7 días desde
  `CIFRAS_MERCADO_EL` (`lib/inicio-contenido.js`, hoy 2026-11-03) se quitan
  125, 14.230 millones, −3,9 % y las barras, y queda una frase sin cifra
  (`10-mercado-caducado.png`, reloj al 11/11). **Al rehacer las cifras en
  cada ciclo, cambiar a la vez el texto y esa fecha** (la prueba lo exige).
- **Menores:** «Fuentes de este apartado» del 05 antes del puente;
  «¿Cómo ordenamos?» solo nombra la Selección cuando la lista la lleva;
  cita a 28 y cifras a 36; «Revisión pendiente» sin mono; Academy sin mono;
  radios sueltos a R (BloqueoApp, Cuenta, segmentado); los enlaces de una
  fuente en fila (Inicio) y la fecha junto al enlace (ficha).
- **No hecho, a propósito:** puntos suspensivos en la barra (la prueba de
  `radar-geometria` prohíbe `numberOfLines` y `maxFontSizeMultiplier` en la
  barra para no bloquear la letra del sistema; que lo decida Víctor) y los
  nombres y el solape del radar de Plataformas («Materias primas» pisaría
  más el punto naranja; necesita recolocar rótulos).
- **CONDICIÓN DE LA OTA:** no enviarla hasta regenerar
  `lib/academy-contenido.js` y `lib/noticias-contenido.js` desde
  `rwadar-academy/` y `rwadar-noticias/` con «Descartadas» (hoy dicen
  «Fuera del radar» en 7 sitios de Academy). Es de la web: no se toca aquí.
- **Pruebas:** `npm --prefix rwadar-movil test` 408: 406 bien, 0 fallos y
  2 omitidas. Nuevas en `inicio-historia` (orden y nota de la Selección,
  caducidad de las cifras); cambiadas con comentario: el aviso medido y
  «Excluded» (`inicio-historia`) y el simulador de tema con `R`
  (`desbloqueo-app`).
- **Capturas** rehechas desde HEAD en el scratchpad, `app-rediseno/01` a
  `07`, más `08-inicio-360x780.png`, `09-tras-descartadas.png` y
  `10-mercado-caducado.png`. 0 errores y 0 peticiones externas.

## 4 de noviembre de 2026 (2) · Claude · la app con el rediseño de la web (sin publicar)

Rama local `claude/app-rediseno` (sale de `claude/acabados`, 2bcbd20), commits
d73ccc4…e4521db, solo en `rwadar-movil/`. **Nada publicado, sin OTA ni EAS,
Supabase sin tocar, sin dependencias ni código nativo** (todo cabe en una OTA).
Ni `package.json`, ni `app.json`, ni `eas.json`, ni `scripts/`, ni la web.

- **Acabados** (`lib/tema.js`, GUIA-ACABADOS §13): superficies s0-s3,
  relleno tonal, una sola línea al 8 %, radios 8 · 12 · 16 · 24 · píldora,
  dos elevaciones, tres botones con su pulsado (sin encoger con «reducir
  movimiento»), chips tonales sin borde, ✓ en texto, rótulos en frase normal
  y sin mono (la mono queda en las cifras del radar). Cabecera y barra opacas.
- **Barra de 5:** Inicio · Ofertas · Plataformas · Academy · Perfil. Fuera
  el selector de Buscar; Ofertas y Plataformas son sus dos vistas, así que
  los avisos, Academy, «fuera» y Perfil siguen llevando a donde iban. Las
  fichas se cierran con Atrás como antes (`onRequestClose`). El idioma, solo
  arriba de Perfil.
- **Ofertas:** fila compacta de la web (miniatura, 2 líneas, proveedor y
  lugar, 2 puntos fuertes ✓, Mínimo · España · Salida cortos, «Revisa · N
  avisos en la ficha», fecha y «Ver ficha»). Arriba, «Selección RWAdar · la
  documentación más completa» con «No es una recomendación de inversión» y
  luego «Resto de principales». `lib/transparencia.js` copia la lógica de la
  web y falla cerrado; con el catálogo de hoy salen las mismas 3.
- **Ficha:** «Transparencia: lo que hemos comprobado», con ✓/✗, el motivo y
  la fuente con su fecha, y los puntos fuertes con su fuente.
- **Inicio como historia** (ESPEC-INICIO y HISTORIA-v2, titular n.º 1):
  radar vivo sin buscador y con sus 4 cifras, «Ver las 24 ofertas» con el
  aviso pegado (antes del botón por debajo de 700 px), seis capítulos,
  novedad, Selección con las 5 comprobaciones a la vista, «Mira, compara y
  decide tú», fuentes y nota legal. **Sin llamadas [n]** (decisión de
  Víctor): cada apartado acaba en «Fuentes de este apartado», que abre la
  lista agrupada y baja a su grupo. Las cifras salen del catálogo y sin
  catálogo vigente no hay Selección, mínimos ni vigencia.
- **«Descartadas»** en la app; en inglés quedó «Excluded» en la entrada (3),
  como manda ESPEC-INICIO §2.11 (1 entrada de `lib/idioma-en.js` y 3 de
  `lib/inicio-contenido.js`).
- **Inglés:** 54 entradas nuevas al final de `lib/idioma-en.js`; el texto
  de Inicio va en `lib/inicio-contenido.js` en los dos idiomas.
- **Pruebas:** `npm --prefix rwadar-movil test` 406, 404 bien y 2 omitidas.
  Nuevas: `transparencia.test.cjs` (5) e `inicio-historia.test.cjs` (5).
  Cambiadas con comentario: barra de 5 y sin `SelectorBuscar`
  (`navegacion`), rótulo de barra a 11 px (`radar-geometria`), fila compacta
  (`ofertas-presentacion`, `ofertas-vigencia`) y rótulos en frase normal
  (`academy`, `cuentas-ui`, `verificacion-local`, `navegacion`).
- **Capturas** (Expo web en local, sin red, 390 × 844 y dsf 2) en el
  scratchpad de la sesión, `app-rediseno/01-inicio.png` a `07-ingles.png`,
  más `01b-inicio-375x667.png` y `02b-fuentes-del-apartado.png`. La cuenta se
  simula con el catálogo publicado (`app-rediseno/scripts/preparar.sh`).
- **Al mezclar con la web:** las dos ramas añaden entradas al final de
  `rwadar-movil/lib/idioma-en.js` (choque trivial: quedarse con las dos).
  Después, `node rwadar-movil/scripts/copiar-idiomas-web.cjs`, porque el
  `test:tools` de la raíz exige la copia idéntica en la web.
- **Pendiente:** regenerar `lib/academy-contenido.js` y
  `lib/noticias-contenido.js` cuando la web cambie «Fuera del radar» en
  `rwadar-academy/` y `rwadar-noticias/` (son generados); que
  `rwadar-editorial-source/inicio/fuentes.mjs` escriba también
  `lib/inicio-fuentes.js`; la etiqueta sobre la foto grande de la ficha
  (la web ya la quitó); probarlo en un Android real; y la OTA, solo con el
  permiso expreso de Víctor.

## 4 de noviembre de 2026 · Claude · acabados de la web (sin publicar)

Rama local `claude/acabados` (sale de 1b0e1e3), commits 53bb826…8a6afdb.
**Nada publicado, nada en `main`, Supabase sin tocar.** Aplica la guía de
acabados del diseñador (botones, bordes y rótulos que «se veían baratos»)
al CSS real, sustituyendo reglas, sin una capa encima.

- **Tokens** en `:root`: superficies, relleno tonal, una sola línea al 8 %,
  radios 8 · 12 · 16 · 24 · píldora, dos elevaciones, escala de letra y
  movimiento de 120-200 ms sin rebote. Los tokens viejos apuntan a los nuevos.
- **Botones:** tres (verde relleno, tonal y de texto) y uno de icono
  redondo de 44 px, cada uno en una sola regla; al pulsar se oscurecen y
  encogen (nada con «reducir movimiento»). «Ver ficha» no encoge (su
  `::after` abre la fila). Segmentados: la opción elegida en relieve, nunca
  en verde; el idioma, con la misma paleta y foco verde.
- **Chips, etiquetas y ✓:** píldora tonal sin borde (la elegida, blanca);
  etiquetas de estado en un rectángulo de 8 px y frase normal; el punto
  fuerte es texto con ✓ verde, sin cápsula.
- **Cajas:** una línea tenue y un solo nivel de caja (Academy, Perfil,
  ficha); vacíos sin discontinuas; campos tonales; fuera todo el cristal
  y las sombras sueltas; cabecera y barra opacas, también en escritorio.
- **Rótulos:** de mayúsculas de máquina a frase normal de 12 px; la mono
  solo en el radar. 16 textos del HTML/JS pasan a frase normal y sus claves
  de `idioma-en.js` también (el motor sigue traduciendo la versión en
  mayúsculas que usa la app); copiado a la web.
- **Iconos:** un solo trazo de 1,75; SVG en el menú de Perfil y en la
  estrella; chevrones de trazo. **Pesos** 400-700 e interletraje −.02em.
- **Pruebas cambiadas** (`probar-web.mjs`, comentario que cita la guía):
  la barra inferior sobre `--noche` (§6), «Ofertas específicas» en frase
  normal (§12.4) y el microtexto del secundario a 12 px (§5).
- **Medidas** (`medidas.json` y capturas antes/después en el scratchpad de
  la sesión): CSS 177 610 → 155 166 B; radios 35 → 15, bordes 33 → 20,
  sombras 29 → 7, cristal 14 → 0, mayúsculas 45 → 5; 4 filas enteras en
  Ofertas y Reventa a 390 px; CLS de Inicio en escritorio 0,039 → 0,000
  (el selector de idioma tiene su hueco reservado).
- `npm test` completo en verde; `probar-orden.mjs` solo avisa de `App.js`.
- **Pendiente:** la escala de letra completa (quedan 79 tamaños; solo se
  subieron los de menos de 11 px y los rótulos); las páginas sueltas con
  su propia hoja (lecciones de Academy, privacidad, 404); la app (§13 de la
  guía); los chips de Plataformas en una fila desplazable. Inicio, el
  cambio a «Descartadas» y la barra de 5 botones van en el paso de Inicio.
  Publicar necesita el permiso de Víctor.

## 3 de noviembre de 2026 (noche, 2) · Claude · corrección de la versión final de Inicio y Buscar (sin publicar)

Misma rama local `claude/rediseno-final-wf1`, seis commits sobre la entrada
de abajo. **Nada publicado, nada en `main`, Supabase sin tocar.** Recoge lo
que el corrector anterior dejó a medias y los fallos de la revisión.

- **Buscar › Ofertas:** fila compacta (todo junto a la miniatura y el pie
  debajo): 146-183 px, 4 filas enteras por pantalla a 390×844 desde
  cualquier fila (Principales y Reventa) y la primera en y=520. Mínimo, España y Salida
  a 12 px; el lugar nunca se corta; puntos fuertes y estado como texto, sin
  cápsulas. Chips y estrella con diana de 44 px; el orden del foco sigue al de
  la vista (Lista/Mapa va justo después del buscador, también en escritorio);
  «Ordenar por» ya no corta «Fuente y fecha»; recuento visible al filtrar;
  cabecera y barra inferior opacas; `scroll-padding-bottom` para que la barra
  no tape el foco. En escritorio vuelven los datos largos de las tarjetas.
- **Transparencia:** con el catálogo caducado «se contrata hoy» y «mínimo y
  salida» pasan a ✗ («pendiente de revalidar»), en la ficha y en la página
  fija (`ficha-pagina` lo mira con la fecha de hoy). La página fija enlaza la
  fuente fechada de las cuatro primeras, como la ficha. Una oferta con aviso
  crítico (tono stop) nunca entra en la Selección y su tarjeta de Inicio lo
  enseña entero. «Revisa · N avisos» cuenta también el aviso general, como la
  ficha.
- **Inglés:** solo `transparencia.json`, los datos del catálogo y el nombre
  de cada fuente quedan como texto de la fuente; los motivos que escribe
  RWAdar se traducen (27 frases y 3 patrones nuevos). Inicio ya no lleva el
  rótulo «Original source text (Spanish)».
- **Inicio (solo lo barato; se rehará entero):** fuera el botón con aspecto de
  buscador; tarjetas de los carruseles del mismo ancho; leyenda oculta de
  verdad con el catálogo caducado; recuentos del radar para el lector de
  pantalla; vigencia a 12 px; la tarjeta enfocada entra entera en su
  carrusel; «reducir movimiento» solo repinta el radar (no se pierde el foco).
- **Presupuestos:** CSS 177 610 B (comentarios largos en una línea);
  `probar-web.mjs` por debajo de 240 000 B. `probar-orden.mjs` solo avisa de
  `App.js`, como antes.
- **Pruebas:** 10 nuevas en `probar-web.mjs` y 2 en `probar-fichas.cjs`;
  `npm test` completo en verde.
- **Pendiente:** lo mismo que abajo (sellar, merge commit y permiso de Víctor
  para preview, producción y OTA), y la guía de acabados, que va en un paso
  aparte. Ver «No corregido» en el informe de esta corrección.

## 3 de noviembre de 2026 (noche) · Claude · versión final de Inicio y Buscar en la web móvil (sin publicar)

Víctor y Claude como CEO decidieron la versión final (base A «radar vivo» con
injertos de B y C). Rama local `claude/rediseno-final-wf1` (parte de
`claude/rediseno-inicio-buscar`, 7b951ed). **Nada publicado, nada en `main`,
Supabase sin tocar.** Falta sellar y el permiso de Víctor para publicar.

- **Transparencia (datos):** `rwadar-editorial-source/ofertas/transparencia.mjs`
  valida `transparencia.json` contra el catálogo publicado (slug y
  `verificadaEl`, textos cortos de 40 caracteres, sin «%», «rentab»,
  «garantiz», «benefici», «gananci», «recomend» ni «mejor», fuentes https) y
  escribe el bloque `TRANSPARENCIA_POR_SLUG` del JS web y
  `rwadar-movil/lib/transparencia-contenido.js`. Su `--comprobar` va en
  `test:tools`. **En cada ciclo del catálogo hay que revisar este archivo:** si
  cambia la `verificadaEl` de una oferta, `npm test` se para y la web no
  enseña nada de esa oferta (falla cerrado).
- **Imágenes limpias:** fuera todas las etiquetas sobre las fotos (tarjetas,
  filas, carruseles, detalle, galería). El `alt` sigue empezando por
  «Ilustración editorial»; línea visible «Imágenes ilustrativas, no fotos del
  activo» bajo la lista, cada carrusel y la foto del detalle, y «Portadas
  ilustrativas, no logotipos ni fotos de la empresa» bajo la galería.
- **Inicio:** radar vivo con los nombres cortos (Inmobiliario, Crédito,
  Tesoro, Acciones, Materias primas, Infraestructura), leyenda «Plataformas
  por tipo de activo», esquinas, vigencia «Revisado el … · vigente hasta el
  …» con pastilla «Vigente» (o «Revisión pendiente» y sin cifras), etiqueta
  «REGISTRO INDEPENDIENTE · NO VENDE NI ASESORA», botón con aspecto de
  buscador que enfoca `#emiBuscar`, «Ver ofertas» y «Ver plataformas»;
  carruseles «Selección RWAdar · la documentación más completa» (las 3 que
  cumplen las 5 comprobaciones; «No es una recomendación de inversión»;
  «Cómo elegimos») y «Recién añadidas» (4, por fecha de alta); por tipo,
  colecciones, noticias, fuera del radar y nota legal. Las fotos se piden al
  acercarse: la primera pantalla carga 0 KB de imágenes (antes 378 KB).
- **Buscar › Ofertas (móvil):** fila de una columna con miniatura de 88 px,
  título de 2 líneas con `title=`, proveedor · lugar, hasta 2 puntos fuertes,
  Mínimo · España · Salida en corto y pie «Revisa · N avisos en la ficha» con
  la fecha; el aviso crítico va entero. Selección arriba dentro de
  Principales y después «Resto de principales». Sin grupos por proveedor en
  el móvil. Primera fila en y=520 a 390×844; filas de 207-209 px.
- **Ficha:** apartado «Transparencia: lo que hemos comprobado» en el diálogo
  y en `/ofertas/<slug>` (la quinta comprobación la mira `ficha-pagina` con la
  fecha de hoy). Nada de notas «x/5».
- **Plataformas:** miniatura del radar y «0 € · Por aparecer en el radar» en
  la franja plegada; recuentos en los chips; nombres cortos en la galería y
  en el radar grande (también en la portada de escritorio).
- **Técnica:** CSS 179 674 B (poda de 31 declaraciones pisadas y comentarios
  largos); JS 372 188 B; CLS 0 al cargar en el móvil (0,033 con 4G lento y CPU
  ×4); 59 frases nuevas en inglés y patrones para «8 de 8 principales» y
  «cifras vigentes 7 d»; movimiento reducido también si cambia con la página
  abierta.
- **Pruebas cambiadas** (con comentario que cita la decisión): etiqueta
  «Ilustración» de las portadas, miniatura móvil centrada, `title=` del
  título, etiquetas «Mínimo · España · Salida», «Doc.» en su span y
  agrupación por proveedor solo en escritorio. 14 pruebas nuevas en
  `probar-web.mjs` y 1 en `probar-fichas.cjs`. `npm test` completo en verde
  (web 567, fichas 66, precarga 32, app 394, acceso 144).
- **Pendiente:**
  - sellar (`auditar-relanzamiento.mjs` → `estado.json`), unir con merge
    commit y pedir permiso a Víctor para preview, producción y OTA;
  - la app no cambia todavía (`transparencia-contenido.js` está listo);
  - en escritorio los chips siguen con el nombre largo, como pedía «no
    cambiar de aspecto»; si Víctor quiere el corto también ahí, es un cambio
    de una línea en el CSS.

## 3 de noviembre de 2026 (tarde, 5) · Claude · el worker da 404 a lo retirado aunque Cloudflare guarde copia

Víctor: «arréglalo», sobre la ficha de mF-ONE que seguía saliendo en
`/ofertas/mf-one`. PR #45, unida a `main`, publicada en preview y producción
(219/219).

- **Causa:** el servidor de archivos de Cloudflare Pages
  (`@cloudflare/pages-shared`, `asset-server/handler.ts`,
  `ASSET_PRESERVATION_CACHE`) guarda una semana, en cada centro de datos, una
  «copia de conservación» de cada archivo que sirve. Si el archivo desaparece
  del despliegue, la devuelve con `cf-cache-status: HIT` y
  `x-robots-tag: noindex`. Por eso mF-ONE solo seguía en IAD.
- **Arreglo** (`rwadar-acceso/compilar.cjs`):
  - el worker lleva la lista cerrada de fichas, sacada del manifiesto. En
    `ofertas/`, `plataformas/` y `fuera-del-radar/`, cualquier otra ficha da
    el 404 de `/404`, sin pedirla a ASSETS. Las barras repetidas se
    normalizan antes;
  - fuera de `/assets/`, una respuesta de ASSETS con `HIT` + `noindex` se
    trata como copia de un archivo retirado y da 404. Si la respuesta es un
    304 de una revalidación, se repite la consulta sin condiciones. Así queda
    cubierta, por ejemplo, la ilustración de mF-ONE;
  - el 404 del worker lleva `x-robots-tag: noindex, nofollow` y
    `cache-control: no-store`. El 404 propio de Pages no lleva esa marca.
- **Precarga:** `rwadar-precargar-imagenes.js` compila el worker esperado con
  las fichas del snapshot de la base, no con el manifiesto. Si no, un alta ya
  añadida al manifiesto bloquearía la precarga (prueba nueva en
  `probar-precarga.cjs`).
- **Comprobación tras publicar** (`.github/comprobar-publicado.mjs`):
  - las 29 fichas retiradas del historial de Git, y una que nunca existió,
    deben dar el 404 del worker;
  - las 29 ilustraciones retiradas deben dar 404, también al revalidar.
- **Pruebas:** `npm test` 394 + 144. `compilar.test.mjs` tiene 8 casos que ya
  no dependen de las fichas de hoy. Revisión con un workflow de 4 enfoques, con
  escépticos, y segunda verificación sin falsos positivos en unos 2.000 casos
  reales de producción y preview. Sello nuevo.
- **Retirar una ficha** sigue igual: quitarla del manifiesto y borrar su
  página. Ver `docs/tareas/CICLO-DIARIO-CATALOGO.md` §6.
- **Queda:** los despliegues antiguos con huella (`<hash>.rwadar.pages.dev`)
  siguen enseñando su versión, con `noindex`. Son inmutables: solo se quitarían
  borrándolos en Cloudflare, con permiso de Víctor, y algunos los citan
  informes de `docs/`.

## 3 de noviembre de 2026 (tarde, 4) · Claude · retirada de mF-ONE (entrega 2026-11-03.6)

Víctor: «retira las ofertas que ya no valgan o ya no estén». PR #42 (lote) y
#43 (web y app), unidas a `main`.

- **Cómo se decidió:** las 25 ofertas se releyeron esta tarde con sus fuentes
  primarias, contra cuatro criterios: ya no existe, campaña terminada sin
  prórroga publicada, no abierta al particular, o fuente caída o
  contradictoria. Cada propuesta de retirada pasó por dos escépticos que
  intentaron rebatirla. Resultado en
  `verificaciones/2026-11-03.6-v2/comprobacion-retiradas.json`.
- **Sale mF-ONE (Midas):** la web la trata como «Exempt offer», el memorando
  solo se ve con wallet en lista blanca y los dos contratos tienen la lista
  blanca activada (`greenlistEnabled()=true`). No hay folleto en ESMA. Es para
  inversores profesionales.
- **Se quedan:**
  - **Terreno BILLA:** la propuesta de retirarla se rebatió. Brickwise la
    sigue vendiendo en fase de financiación, a finales de octubre se
    suscribieron 20 participaciones más, y el contrato permite prorrogar.
  - **Casa de Outeiro:** la ficha de datos v5, firmada el 30/10, fija como
    fecha límite el 31/03/2027.
  - **Hausera:** su preventa empieza el 04/11.
  - **Las otras 21:** siguen abiertas.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.6`. Revisión `344a86aa`
  (antes `d75a22fb`): 24 ofertas (8 principales, 13 de reventa y 3 en
  camino), 26 plataformas. Las otras 24 ofertas no cambian. Revisión
  independiente: `REVISION-ENTREGA.md`, aprobada sin cambios obligatorios.
- **Web:** borrada `rwadar-site/ofertas/mf-one.html`, quitada su ruta de
  `rwadar-fichas-manifiesto.js` y borradas su ilustración y la de la app.
  Preview y producción: 158/158. En el navegador se ven 8 principales sin
  errores.
- **Caché de Cloudflare:** `/ofertas/mf-one` siguió dando 200 en IAD por la
  copia de conservación de Cloudflare Pages. Ya está arreglado: ver la entrada
  de arriba («tarde, 5»).
- **App:** OTA, grupo `a468d25f`, runtime `1.4.1(23)`, con el mensaje
  «Catálogo 2026-11-03.6: retirada mF-ONE». No comprobada en un móvil.
- **Pendiente:**
  - revisar Casa de Outeiro el 10/11;
  - en BILLA, si no hay prórroga publicada con fecha, decidir en el próximo
    ciclo;
  - a partir del 04/11, que la tarjeta de Hausera diga «preventa desde el
    04/11».

## 3 de noviembre de 2026 (tarde, 3) · Claude · alta de Spiko Smart Cash Euro (entrega 2026-11-03.5)

Víctor: «si es tan buena oferta y tú lo ves bien y tú lo subirías, adelante».
La revisión independiente de la mañana la había rechazado: no consta en
ningún registro público su alta en España (la CNMV no muestra compartimentos
de fondos extranjeros) y la web contradice al KID. PR #39 y #40, unidas a
`main`.

- **Ficha** (`verificaciones/2026-11-03.5-v2/preparar-entrega.mjs`), en
  principales:
  - 2,84 % neto: lo publica Spiko con el valor liquidativo del 02/11; variable,
    sigue al €STR;
  - desde 1 €; reembolso diario con límite del 25 %;
  - riesgo KID 1/7 sin contar la contraparte;
  - 8 datos, porque la web enseña como mucho 8.
- **Avisos:**
  - no consta en ningún registro público su alta en España;
  - no es cuenta ni depósito, con las citas literales de la web frente al KID;
  - no es un fondo monetario: invierte en títulos y los cambia con bancos;
  - el límite del 25 %;
  - la gestora es Twenty First Capital;
  - todavía no tiene ficha en GECO.
- **Revisión independiente:** workflow de 3 enfoques (hechos, protección del
  inversor y entrega técnica) más una síntesis. `REVISION-ALTA.md`:
  `aprobado_con_cambios`, con los 13 cambios obligatorios aplicados.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.5`. Revisión `d75a22fb`
  (antes `f26bba19`): 25 ofertas (8/14/3). Las otras 24, idénticas.
- **Imagen:** RealVisXL, semilla 37, con una calle parisina genérica. El
  concepto no puede llevar «€»: la compuerta de `generar.mjs --comprobar` lo
  toma por cifra; así falló una vez la CI.
- **Web:** preview y producción (160/160); revisada en navegador.
- **App:** OTA, grupo `43d5e26a`, runtime `1.4.1(23)`; no comprobada en un móvil.
- **Pendiente:**
  - preguntar por escrito a la CNMV o a Aldana Capital A.V. si FR0014015LD3
    está notificado: si sí, se quita el primer aviso; si no, se retira la ficha;
  - en Spiko Letras del Tesoro Euro, poner primero la limitación en «Salida»,
    porque la fila se corta.

## 3 de noviembre de 2026 (tarde, 2) · Claude · alta de Kraken xStocks (entrega 2026-11-03.4)

Víctor pidió incluir xStocks: «si es online como las demás… apáñate». La
revisión independiente lo había rechazado porque las condiciones finales del
emisor solo ofrecen el producto en Liechtenstein y Suiza. Víctor decidió
publicarlo con ese aviso. PR #36 y #37, unidas a `main`.

- **Ficha** (`verificaciones/2026-11-03.4-v2/preparar-entrega.mjs`), en
  principales:
  - desde 1 €; acceso «según Kraken UE»; salida por venta a Kraken en USD
    (24/5) o retirada a wallet;
  - avisos 1 y 2: «el folleto no cubre su venta en España» y «RWAdar no ha
    encontrado ningún documento oficial que explique en qué se basa la venta
    en España»;
  - sin datos del KID ni enlaces a `l-p-a.com`; las condiciones finales se
    citan desde la web oficial del emisor.
  - Revisión independiente `REVISION-ALTA.md`: `aprobado_con_cambios`, con
    todo aplicado.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.4`. Revisión `f26bba19`
  (antes `fab6d2e4`): 24 ofertas (7/14/3). Las otras 23, idénticas.
- **Imagen:** RealVisXL, semilla 29, con un distrito financiero mediterráneo
  genérico (`fotos/kraken-xstocks.webp`). La tarjeta se compuso después del
  SQL. Ruta `ofertas/kraken-xstocks.html` en `rwadar-fichas-manifiesto.js`.
- **Arreglos:**
  - `rwadar-servir.js` cargaba solo la fecha de un lote `.N`;
  - `probar-fichas.cjs` buscaba la entrega por la fecha;
  - ahora los dos usan la etiqueta completa y la revisión publicada.
- **Web:** preview y producción (158/158); revisada en navegador.
- **App:** OTA, grupo `9e9d54ef`, runtime `1.4.1(23)`; no comprobada en un móvil.
- **Pendiente:** si el emisor publica condiciones finales con España (o la CNMV
  aclara la base de la venta), quitar los avisos 1 y 2.

## 3 de noviembre de 2026 (tarde) · Claude · investigación del día, normas de tarjeta y entrega 2026-11-03.3

Víctor pidió otra investigación para publicar lo más actualizado posible, el
cambio de las reglas de permisos y «normas del catálogo con sentido». Dio
permiso expreso a todo. PR #30 a #34, todas unidas a `main`.

- **Reglas (PR #30):** `AGENTS.md`, `CLAUDE.md` y el ciclo dicen ahora que la
  orden de Víctor de investigar o actualizar el catálogo autoriza ese ciclo
  completo: «Aplicar catálogo», «Publicar web» y «OTA Android», si pasan
  pruebas, PGlite, revisión independiente y sello. Siguen fuera cuentas,
  credenciales, `eas build`/`submit`, tiendas, visibilidad y migraciones.
- **Normas de tarjeta (PR #31):** en reventa y próximas, `ficha-editorial`
  (mismo archivo en web y app) enseña mínimo, acceso desde España y salida
  si hay una referencia con etiqueta fija:
  - `Mínimo de inversión`, `Acceso desde España`, `Salida` o `Reembolso`;
  - con paréntesis opcional;
  - la ficha tiene que estar vigente.

  Siguen sin rentabilidad ni precio, como exige la restricción
  `oferta_coleccion_documental`; no hubo migración. Las citas literales no
  suben a la tarjeta. Está documentado en `CICLO-DIARIO-CATALOGO.md`.
- **Investigación (PR #32):** `verificaciones/2026-11-03.3-v2/`.
  - 6 grupos y 35 expedientes: las 23 publicadas y 12 candidatas.
  - Tres revisiones independientes: candidatas, cambios y SQL
    (`REVISION-ENTREGA.md`, `aprobado_con_cambios`, ya aplicados).
  - Kraken xStocks rechazada: las condiciones finales oficiales solo ofrecen el
    producto en Liechtenstein y Suiza (`revision-independiente/kraken-xstocks-addenda.md`,
    con copias de la web del emisor).
  - Spiko Smart Cash Euro rechazada: no consta su venta en España en ningún
    supervisor.
  - Informe: `docs/INVESTIGACION-CATALOGO-2026-11-03.md`.
- **Supabase:** «Aplicar catálogo» con `2026-11-03.3` y copia previa. Revisión
  `fab6d2e4` (antes `62dca2f9`): 26 plataformas y 23 ofertas (6/14/3),
  comprobadas el 03/11 y vigentes hasta el 10/11. Spiko al 2,34 % y 3,95 %.
  La lectura pública posterior lo confirma.
- **Radar:** 69/69 fuentes. El PDF de la OCC (Paxos) se leyó con WebFetch
  porque al navegador le llegaba otra cosa; su SHA-256 queda en la captura.
  Antes, un `curl` con agente de navegador fue denegado por el control de
  seguridad («bot check») y no se insistió.
- **Web (PR #33 y #34):** sincronizada, sellada y publicada en preview y en
  producción (156/156). Revisada en navegador: tarjetas principales y de
  reventa, Spiko euro al 2,34 %, retiradas con 404. Además, la PR #34 apila
  etiqueta y dato cuando la zona de datos mide menos de 260 px, porque en los
  grupos abiertos del móvil el dato se cortaba («1 partici…»).
- **App:** OTA al canal production, runtime `1.4.1(23)`, grupo `0a4700ab`,
  394 pruebas. Lleva las normas de tarjeta. No comprobada en un móvil.
- **Escáner de secretos:** 4 copias de páginas públicas con parámetros
  `access=`/`token=` (Hausera, docs de Midas) salieron de Git; se conservan en
  disco. Desde entonces solo se guarda si el escáner da 0. Todo lo crudo va en
  `grupos/**/crudo/`, que está en el `.gitignore`.
- **Pendiente:**
  - Kraken xStocks: condiciones finales con España.
  - Spiko Smart Cash Euro: confirmación de su notificación a España.
  - Casa de Outeiro: retirarla si el 10/11 sigue igual.
  - `actualizar-catalogo.mjs` aún quita los avisos con fecha que no sabe
    rehacer; hay que revisarlos a mano.

## 3 de noviembre de 2026 (mediodía) · Claude · entrega 2026-11-03.2, varias entregas al día y tarjetas

Con permiso expreso de Víctor (cifras «7 días mejor», «quita el límite de
cargar dos veces en un día», «que se pueda modificar en cualquier momento»).
PR #26, #27 y #28 unidas a `main`.

- **Supabase:** flujo «Aplicar catálogo» con la etiqueta `2026-11-03.2` y copia
  previa. Ahora está publicada la revisión `62dca2f9`, antes `a4792f79`: 26
  plataformas y 23 ofertas (6/14/3). Las cifras de cada ficha valen 7 días
  (`vigenciaDias: 7`). Las 6 principales tienen referencias en castellano para
  «Mínimo de inversión», «Acceso desde España» y «Salida/Reembolso». La
  revisión independiente (`2026-11-03.2-v2/REVISION-ENTREGA.md`) aprobó con dos
  cambios ya aplicados: Spiko EUR «clase EUTBL» y Robinhood «24/5». La lectura
  pública posterior lo confirma.
- **Varias entregas el mismo día:** etiquetas `AAAA-MM-DD` y `AAAA-MM-DD.N`
  (`esRevisionLocal`/`ordenRevisionLocal` en `catalogo-publico.js`). Las
  aceptan `montar-revision`, `comprobar-revision`, `actualizar-catalogo`,
  `capturar-fuentes`, `generar.mjs`, el flujo `aplicar-catalogo.yml`,
  `rwadar-servir.js` y el lector web. Las fechas de los datos son siempre
  `slice(0,10)`.
- **`npm run catalogo` (`actualizar-catalogo.mjs`):**
  - elige sola la siguiente etiqueta libre;
  - parte de la revisión publicada en la última sincronización, y `--desde`
    la cambia;
  - con fichas retiradas ya no falla;
  - no da cifras a colecciones no principales ni pisa un
    `fuentes_en_conflicto`;
  - lee Spiko euro y dólar de `public-api.spiko.io` (31 días, como la
    investigación) sin borrar las demás métricas;
  - una ficha sin regla y con cifras pasa a `noRevisada`.

  Probado de punta a punta en una copia aparte: entrega `2026-11-03.3`, radar
  69/69 y PGlite correcto. Esa prueba no se guardó en Git ni se aplicó. **Ojo
  para el ciclo:** quita los avisos con fecha que no sabe rehacer (BILLA,
  Aktionariat, Casa de Outeiro…) y los lista en el informe. Quien revise los
  tiene que reponer si siguen vigentes.
- **Tarjetas (web y app):** un mínimo documentado en otra moneda o unidad se
  ve tal cual y la fila se llama «Mínimo»: «500 CHF…», «1 gramo de oro»,
  «1 USD». Si está en euros sigue siendo «Mínimo (EUR)». La fila «Salida» ya no
  repite «Salida:». Hay una prueba móvil nueva y la traducción EN «Minimum».
- **Web:** sello sobre `2ce46b0` y auditoría «LISTO PARA CORTE FINAL».
  «Publicar web» en preview y en producción (156/156; el primer intento
  falló dos comprobaciones por la caché del CDN con el JS de idioma nuevo y el
  reintento pasó). Revisado en navegador, en móvil y escritorio.
- **App:** OTA `ota-android.yml` al canal production, runtime `1.4.1(23)`,
  grupo `96bab3a2`. No comprobada en un móvil.
- **Docs:** `CICLO-DIARIO-CATALOGO.md` y `RUNBOOK.md` explican las entregas
  `.N` y que ya no hay mínimo respecto del lote anterior.
- **No hecho (bloqueado):** quise escribir en `AGENTS.md` y `CLAUDE.md` que
  la orden de Víctor de investigar o actualizar el catálogo autoriza, para ese
  ciclo, «Aplicar catálogo», «Publicar web» y la OTA si pasan las compuertas.
  El control de seguridad de Claude no deja que una herramienta se amplíe sus
  propios permisos. Si Víctor lo quiere, lo cambia él o lo pide a Codex. El
  texto propuesto está en el informe a Víctor de esta sesión.
- **Pruebas:** `npm test` completo en verde tres veces (antes de sincronizar,
  después y con el arreglo de tarjetas) y CI de las tres PR en verde.

## 3 de noviembre de 2026 · Claude · catálogo de 23 ofertas aplicado, web publicada y OTA enviada

**Añadido por la tarde:** tarjetas de oferta más limpias en la web (PR #24, solo
CSS al final de `rwadar-20260820.css`; mismo contenido y reglas editoriales),
selladas y publicadas en preview y producción. La app no cambia. El contenido
de «Mínimo / España / Salida» sigue saliendo de las referencias del 01/11 (citas
en inglés): se arregla con referencias en castellano en la próxima entrega
documental, que no puede ser del mismo día que una ya aplicada.

Con permiso expreso de Víctor («camino B», «te doy permiso a todo», 02-03/11).
Todo unido a `main` (PR #20, #21 y #22, con commit de unión).

- **Supabase:** flujo «Aplicar catálogo» dos veces, con copia previa en cada
  una: lote del 02/11 (`f2be1f5e`, 26 plataformas y 23 ofertas, 6/14/3) y
  corrección documental del 03/11 (`a4792f79`). La corrección solo cambia un
  localizador de Aktionariat («…onlyBuySide=true») que la compuerta CSP del
  publicador confundía con un manejador `on…=`. Lectura pública posterior: 23
  ofertas de `a4792f79`.
- **Sin mínimo de 49:** `contrato-catalogo.js`, el lector web y
  `sincronizar.js` aceptan un lote coherente más pequeño o reclasificado; lo
  cortado o mezclado se sigue rechazando. Las pruebas de la web leen las
  cantidades del propio lote.
- **Web:** «Publicar web» preview y producción desde GitHub, ya con el secreto
  `CLOUDFLARE_API_TOKEN`. Sello en `estado.json` sobre `f8a5a85`. En
  producción, en navegador real: 23 fichas, sin aviso de revisión pendiente,
  páginas de las altas 200 y de las retiradas 404. Los 401 de la consola son
  `/api/acceso/sesion` sin sesión, como antes.
- **App:** nuevo flujo `.github/workflows/ota-android.yml` (manual, solo
  `main`, pruebas y guard con `--base` del APK 1.4.1). OTA enviada al canal
  production, runtime `1.4.1(23)`. Todavía no se ha comprobado en un móvil.
- **Escáner de secretos:** 40 capturas JSON de la investigación con
  identificadores públicos de blockchain salen de Git (`.gitignore` del
  ciclo). No se tocó `gitleaks.toml`.
- **Pruebas:** `npm test` completo en verde y CI de las tres PR en verde.
- **Pendiente para el siguiente ciclo:**
  - El resumen de las tarjetas muestra «Mínimo: No verificado / España: Sin
    confirmar / Salida» con citas en inglés del 01/11. Hay que añadir
    referencias en castellano (`Mínimo de inversión`, `Acceso desde España`,
    `Reembolso`).
  - Las cifras de las ofertas caducan al día (`vigenciaDias: 1`).
  - Para un lote del mismo día que otro ya aplicado no queda carpeta de
    fecha libre: hay que esperar al día siguiente.

## 2 de noviembre de 2026 · Claude · investigación del catálogo (ciclo manual del 01/11), preparada sin aplicar

**Rama:** `claude/investigacion-catalogo-2026-11-01`. Nada aplicado en Supabase,
nada publicado. Víctor inició el ciclo el 01/11 («haz la investigación») y pidió
priorizar ofertas que un particular en España pueda comprar de verdad y que den
confianza. Informe: [`../INVESTIGACION-CATALOGO-2026-11-01.md`](../INVESTIGACION-CATALOGO-2026-11-01.md).

- **Expedientes:** 105 (49 publicadas + 56 candidatas) en
  `rwadar-app/data/verificaciones/2026-11-01-v2/expedientes/`, de 9 agentes
  investigadores, y 5 revisiones independientes en `revision-independiente/`.
  Lectura pública previa: lote del 23/10, 49 ofertas (24/21/4), vencido el 29/10.
- **Altas aprobadas con cambios:** `spiko-letras-del-tesoro-dolar` y
  `robinhood-classic-stock-tokens`. Kraken xStocks, rechazada en este ciclo.
- **28 retiradas justificadas por la revisión** (22 Reental, mGLO, mGLOBAL,
  mGLOeuro, IOD, wemakeit y quitt). **Las decide Víctor.**
- **Límite de 49 quitado** (commit «Quita el mínimo de 49 ofertas», con orden
  expresa de Víctor del 02/11). `contrato-catalogo.js`, el lector de
  `rwadar-20260820.js` y `sincronizar.js` ya no comparan con la copia anterior:
  aceptan un lote más pequeño o reclasificado si cuadra con su propio
  manifiesto. Lotes cortados o mezclados se siguen rechazando. Pruebas: web
  553/0, móvil 392/0, db, tools, acceso 140/140 y QR. **Sin publicar:** falta
  sellar `estado.json` y publicar la web, y la OTA de Android (permiso de
  Víctor), antes del lote reducido. La lista cerrada `rwadar-fichas-manifiesto.js`
  se edita a mano en ese lote (quitar retiradas, añadir altas).
- `propuesta-tarjetas.json` (con `preparar-propuesta.py`) trae las tarjetas
  con los cambios obligatorios aplicados y lo que hay que **releer el día de
  publicación** (Spiko, oráculo de mTBILL, precios de Brickwise y Aktionariat).
  `consolidar.py` valida los expedientes: solo quedan 2 errores de formato
  conocidos (mGLO y mGLOBAL citan el oráculo con la dirección abreviada).
- **PDF/HTML originales fuera de Git** (`.gitignore` del ciclo); SHA-256 en
  cada inventario. Se pierden si se recicla este contenedor.
- **Pendiente:** decisión de Víctor (A/B y retiradas), ilustraciones de las 2
  altas, montar lote, PGlite, revisión del SQL, precarga, SQL y publicación,
  cada paso con su permiso. No se ejecutaron `npm run catalogo`,
  `montar-revision.mjs` ni `npm test`: no hubo cambios de código.

---

## 1 de noviembre de 2026 · Claude · anti-robots y límite de intentos, preparados sin activar

**Rama:** `claude/anti-robots-2026-10-30`. Sin unir a `main`, porque toca
`rwadar-acceso/` y `rwadar-site/`, que están sellados. Nada publicado, nada
tocado en Supabase ni en Cloudflare. Plan completo y orden de activación en
[`ANTI-ROBOTS-Y-LIMITES-2026-11-01.md`](ANTI-ROBOTS-Y-LIMITES-2026-11-01.md).

- **Hallazgo:** el BFF llama a Supabase desde Cloudflare, y Supabase ve una IP
  compartida (`2a06:98c0:3600::103`), así que toda la web comparte un único cupo
  de intentos de Auth. Se puede confirmar sin tocar nada en Supabase › Logs › Auth.
- **BFF:** límite en memoria por visitante (IPv4 o bloque IPv6 /64): 30
  entradas y 10 envíos de correo cada 10 minutos. A propósito no hay
  límite por correo: la revisión independiente mostró que permitía bloquear a
  otra persona. Además, reenvío del testigo Turnstile como
  `gotrue_meta_security.captcha_token` y `captcha_fallido` claro. Sin testigo, el
  cuerpo que recibe Supabase es idéntico al de antes.
- **Web (`acceso.js`/`acceso.html`):** Turnstile listo y apagado
  (`TURNSTILE_SITEKEY = ''`); la CSP no cambia.
- **Pruebas con Node 22.23.4:** `test:acceso` 140/140 (14 nuevas en
  `anti-robots.test.mjs`) y `test:web` 550/0. En Chromium real, con el BFF
  verdadero y el `siteverify` de Cloudflare con sus claves de prueba: apagado
  entra sin peticiones externas, la clave que aprueba entra y la que rechaza lo
  explica.
- **Estado (01/11, tarde): unido a `main` y aprobado, pendiente solo de
  publicar.** PR #18 unida con merge commit (`ac4b26b`). Codex la revisó en
  GitHub (código y seguridad); su único aviso, que con *squash* se perdería el
  commit sellado, se evitó uniéndola con merge commit. Con autorización expresa
  de Víctor, Claude selló `estado.json` (`9cdeb13`) aprobando `7ff6537`. El
  auditor y la compuerta pasan en `main`.
- **La publicación desde GitHub falla** porque no existe el secreto
  `CLOUDFLARE_API_TOKEN` (ejecución del 01/11; la del 22/10 falló igual).
  **Para Codex:** publicar desde el PC con la sesión de Wrangler,
  `node rwadar-publicar.js --preview`, comprobar `revision.rwadar.pages.dev/acceso`
  (lleva `id="robot"` oculto y `acceso.js` nuevo) y después `--produccion`.
  Publicar solo activa el límite. No encender el CAPTCHA en Supabase hasta que
  Android mande `captchaToken` (fase 2 del plan).
- **Node del PC:** Codex usó un Node 22.23.4 portable y la instalación global
  seguía sin el parche. Víctor lanzó el 30/10 una tarea en su PC para
  actualizarla; confirmar con `node --version` (≥ 22.23.4).

---

## 30 de octubre de 2026 · Claude · web en iPhone, cuenta QA baneada y pruebas en UTC

- **Víctor usa iPhone**, así que en su móvil RWAdar es la web. En iPhone/iPad
  los enlaces a `/android` (icono de descarga de la cabecera móvil, «App
  Android») abren ahora instrucciones para «Añadir a pantalla de inicio»
  (es/en) en vez del APK. Ya instalada (`standalone`), se ocultan. Android y
  escritorio no cambian. Bloque `instalarEnIphone` en `rwadar-20260820.js`;
  estilos `.instalar-iphone` en la hoja principal.
- **Pruebas PGlite en UTC** (`rwadar-app/pruebas-soporte.mjs`): entre las 00:00
  y la 01:00 de España, `current_date` iba un día por delante y las pruebas del
  catálogo fallaban con revisiones «del futuro».
- **Cuenta QA** `8871c88e…` baneada de forma reversible (`ban_duration
  876000h`, como tus cierres). Seguía activa desde tu última ejecución. Para
  reactivarla: PUT `{"ban_duration":"none"}` con la clave del panel.
- Tu trabajo sin commitear de `Downloads` está en `main` (PR #16) y `Downloads`
  ya está en `main`. Lo del panel (scripts y `.gitignore`) sigue en
  `claude/panel-control`.

---

## 30 de octubre de 2026 · Claude · secretos QA retirados y rama unida a main

Con permiso expreso de Víctor («haz ambos arreglos»):

- **Secretos QA retirados** de GitHub: `RWADAR_QA_EMAIL` y
  `RWADAR_QA_PASSWORD`. Quedan `COPIA_CLAVE` y `SUPABASE_DB_URL`. Tus flujos
  `android-*`/`web-chrome-141` los necesitan: créalos solo para cada ejecución
  y retíralos al terminar. La cuenta QA de Supabase no se ha tocado (puede
  seguir habilitada).
- **PR #15**: esta rama a `main` por avance directo, sin perder nada de `main`.
  El escáner de secretos daba 23 falsos positivos en tus archivos (tokenId de
  Brickwise, enlaces PDF de mTBILL, JWT de prueba, clave publicable). Ahora hay
  excepciones acotadas en `rwadar-app/gitleaks.toml` (`25410a2`), comprobadas
  con gitleaks 8.30.1 y un canario que sigue detectando 3 de 3. **Si añades
  fuentes de investigación con IDs o enlaces firmados, el escáner volverá a
  pararse**: tapa el valor o añade una excepción igual de estrecha.
- Desde ahora trabaja sobre `main` actualizado. La carpeta `Downloads` sigue en
  el `main` antiguo con tu trabajo sin commitear: guárdalo en una rama propia
  antes de traerte `main`.

---

## 29 de octubre de 2026 · Claude · botón «Actualizar» enviado por OTA a la 1.4.1

Víctor pidió que la app se actualice con un botón, sin desinstalar. Hecho y
publicado con su permiso expreso («Sí, envíalo»):

- **OTA** `01a189a8-1c8d-781a-aaa1-4591b88c277f` (grupo `a9306bfa…`), canal
  `production`, Android, runtime `1.4.1(23)`, desde `ae36f05`. Guard
  `comprobar-ota-compatible.cjs --base c1f7106` correcto; sin permisos nuevos.
- **Qué hace** (`b32ef29`): mejora ya descargada → aviso «Aplicar» (reinicia
  solo al pulsar). Versión Android nueva → «Actualizar» descarga el APK tras
  confirmar. El aviso sale bajo la cabecera y en acceso, error de restauración
  y desbloqueo. Perfil › «Versión de la app» comprueba a mano.
- **Cada versión Android nueva debe subir `version-android.json`** a su
  release, con la forma exacta de `rwadar-movil/LEEME.md`. Ya está subido a
  v1.4.1 (código 23). Sin él, la app no avisa de APK nuevos.
- **Web** `1778479b`: privacidad con Expo y GitHub; sello en `ae36f05`;
  `comprobar-publicado.mjs` 208/208.
- `npm test` completo en verde; revisión independiente sin CRITICAL/HIGH y
  sus 7 avisos menores aplicados. No hay prueba en un móvil real todavía:
  Víctor lo verá en Perfil tras abrir la app dos veces.

Commits subidos a `origin/codex/claridad-cartera-sesion-141-20261028`
(sin unir a `main`). Siguen pendientes los secretos QA y unir esta rama a
`main`.

---

## 29 de octubre de 2026 · Claude · web y Android 1.4.1 publicadas; cierre de esta entrega

Tu sesión del 22/10 se cortó a las 00:44 UTC sin cerrar. Víctor pidió terminar
y publicar. Hecho, con su permiso expreso en el chat:

- **Web en producción**: `node rwadar-publicar.js --produccion` desde esta rama
  (despliegue `a83ea0bd`, caché `rwadar-v-ef591c2273229df5`, idéntico a la
  preview `revision`). `sw.js` de producción = local; `comprobar-publicado.mjs`
  208/208. **Víctor entró con su cuenta en la preview y se queda dentro**:
  el retorno al acceso está resuelto.
- **`npm test` completo en verde** (Node 22.23.4, EXIT 0). Se paraba en
  `probar-para-empresas.mjs`, que seguía exigiendo `ventana.navigate()` en el
  service worker; ahora exige `claim()` y ausencia de navegación (`d8c185e`).
  Ese commit incluye tu arreglo de reloj AMR que estaba sin guardar.
- **Android 1.4.1/código 23 publicado como Latest** en
  https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.1
  (APK `33663d48…`, descarga pública con la misma huella; `/android` lleva a
  ella). README de descargas actualizado (`66113346`). QA-1.4.1.json recoge
  las ejecuciones 40783151032 y 40795909732: actualización sobre 22 sin
  desinstalar, misma firma, sesión, cartera en la nube leída por la web y OTA
  descargada y lanzada. La 40795909732 falló **en el comprobador**: la captura
  del fallo muestra la cartera correcta (2,00 / 2,20 / 0,10 / 0,30 / 15 %).
  Cierre de sesión no se repitió en 23: su código no cambia desde 22.

**Pendiente, sin tocar por falta de permiso:** los secretos `RWADAR_QA_EMAIL` y
`RWADAR_QA_PASSWORD` siguen en el repo desde las 00:41 y la cuenta QA puede
seguir habilitada en Supabase. Esta rama va 116 commits por delante de `main`
y producción sale de ella: falta unirla. No relances QA nativa de 1.4.1 ni
compiles otra vez: está publicada.

---

## 29 de octubre de 2026 · Codex · recarga bloqueante aislada y corregida

Chrome real anónimo se bloquea con el trabajador y responde con 49 tarjetas al bloquear solo ese trabajador; WebGL no es la causa aislada. Quitada navegación de ventanas dentro de la activación, sin cambiar cachés privadas ni sesión. Dos pruebas y revisión independiente pasan; comprobación web y preview pendientes. `npm test` se detuvo antes en una prueba de sesión/baja y no se declara aprobado. APK23 sin recompilar; investigación pausada. [Detalle](../VERIFICACION-SW-ACCESO-2026-10-29.md). Fuente en el commit de esta entrada.

---
## 29 de octubre de 2026 · Codex · causas reales de acceso y valoración corregidas

Chrome reproduce sesión200 seguida de rechazo secundario convertido en401: corregidos BFF/cliente y consulta innecesaria de avisos;65 pruebas pasan. Reparado el validador SQL29 previamente autorizado mediante una pareja de paréntesis, con guarda;30 pruebasPGlite,8 independientes y comprobación remota positiva, sin ampliar permisos. Nueva preview/producción pendientes. Android23 conserva instalación y sesión acreditadas; se comprueba solo cartera/OTA/ficha/salida. [Detalle y reversión](../VERIFICACION-ACCESO-WEB-2026-10-29.md). InvestigaciónPAUSADA; main compartido intacto. Cambios en el commit que contiene esta entrada.

---

## 29 de octubre de 2026 · Codex · retorno al acceso web reproducido

Víctor confirma que el primer arreglo no basta. Corregidos errores transitorios del puente y comprobación de la sesión del navegador antes de regresar;37 controles dirigidos y generación local26/49 aprobados. Fuente en el commit de esta entrada; nueva preview y producción pendientes. [Detalle breve](../VERIFICACION-ACCESO-WEB-2026-10-29.md). APK23 conservado, recorrido40785078896 en curso; no recompilar. InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · cierre reanudado y corrección del bucle web

APK1.4.1/código23 terminado, sin otra compilación; OTA compatible preparada y recorrido nativo40783151032 en curso. El arnés de recursos se corrigió en7945f62. Web: corregidos cierre por fallo secundario y clic prematuro durante restauración;18 pruebas dirigidas pasan y generación local26/49 correcta. Cambios web en el commit que contiene esta entrada; preview y producción pendientes. BFF de producción comprobado de nuevo con nuestra cuentaQA. [Detalle](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). InvestigaciónPAUSADA; main compartido intacto.

---

## 28 de octubre de 2026 · Codex · web con cartera publicada; Android1.4.1 en cola

Producción https://rwadar.pages.dev actualizada (despliegue89a6801d): tarjetas claras, avisos íntegros y Mis inversiones. SQL29 privado aplicado con permiso;24controles públicos pasan. Previewmóvil/escritorio y CSS final comprobados con sus límites en [detalle](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). Android1.4.1/código23 está en cola gratuita, fuente c1f7106; no volver a compilar. Arnés dirigido preparado para actualizar22sin desinstalar, cartera privada y unaOTAcompatible del mismo móvil; aún no hay aprobación ni publicación de1.4.1. CuentaQA sigue limpiada: no se ha reactivado este ciclo. InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · actualización1.4.1 preparada

SQL29 privado autorizado y aplicado, RLS/ACL comprobadas. Corregida carrera real de renovación de sesión; tarjetas simplificadas sin perder avisos; Mis inversiones de cuenta en web/app y privacidad actualizada. PróximoAPK1.4.1/código23 activa Updates compatible y deberá reemplazar22 sin desinstalar. Fuente y pruebas en el commit de esta entrada. Compilación, comprobación nativa y publicación nuevas pendientes;1.4.0 sigue pública. [Detalle breve](../VERIFICACION-ACTUALIZACION-141-2026-10-28.md). InvestigaciónPAUSADA, main compartido intacto.

---

## 28 de octubre de 2026 · Codex · Android 1.4.0 publicado y cierre de QA

Android1.4.0/código22 ya publicado en https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.0. Descarga pública real, firma y SHA comprobados; web pública actualizada el28/10 en https://rwadar.pages.dev. Fuente móvil c663e35; arnés final 3c18055. Se conservan siete pruebas reales de sesión/PIN del mismo APK y las pruebas equivalentes anteriores; tutorial4pasos aprobado por revisión directa de capturas; cartera y cierre final aprobados. CuentaQA inhabilitada, sesiones revocadas y dos secretos retirados. Sin más builds por fallos del capturador. Investigación PAUSADA. Main compartido intacto. [Detalle breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md).

---

## 28 de octubre de 2026 · Codex · APK22 compilado, cierre asistido en curso

APK1.4.0/código22 compilado desde c663e35. Identidad, firma,49imágenes, entrada y siete pruebas reales de sesión/PIN aprobadas; se conservan sus evidencias. Los intentos siguientes fallan en el lector del tutorial: no equivalen a defectos demostrados de la app ni a aprobación final. Arnés9848c75 usa capturas consecutivas para revisión directa de los cuatro pasos, cartera y salida, sin recompilar. La descarga final aún es1.3.2. Web pública actualizada el28/10. [Seguridad verificada y pendientes](../SEGURIDAD-WEB-REVISION-2026-10-28.md). Investigación pausada; main compartido intacto.

---

## 28 de octubre de 2026 · Codex · acceso móvil persistente y bloqueo opcional

Víctor informa fallo de entrada móvil y pide conservar sesión y desbloquear con huella/cara/PIN. Se prepara APK nuevo sin repetir pruebas equivalentes: refresh seguro, restauración, errores de red sin expulsión y vigilancia separada del acceso; opción única en Perfil. Cuentas52 y UI8 criterios dirigidos aprobados; PIN Android y build pendientes. El tutorial web ya está corregido y publicado (502eb88/fbcc0d9, producción d2ad2a83): la última captura nativa muestra 3D; falló el capturador, no acredita cuatro pasos. La QA anterior quedó limpiada el 28/10. [Estado breve](../VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md). No iniciar investigación ni compilar de nuevo por fallos del arnés. Main compartido intacto.

---

## 28 de octubre de 2026 · Codex · nueva pieza «Ahora sabes dónde mirar»

Víctor rechazó «Hay más» y aportó una referencia de motion design. Nueva
propuesta de 28 s/25 fps en `rwadar-descubre-2026-10-28/output/`, con copia
ligera y reproductor. Rodaje real nuevo con app auténtica integrada en la
pantalla mediante tracking/perspectiva, escenario 3D, búsqueda, oferta limpia
Casa de Outeiro/Alius Capital y web actual. Música distinta: Gimme that Groove!,
Michael Ramir C.; no reutiliza temas/stems anteriores y no contiene locución.
[Informe](../VERIFICACION-ANUNCIO-DESCUBRE-2026-10-28.md).

Exportaciones descodificadas completas, 700 fotogramas/28 s, BT.709 y audio
verificados; setecientos hashes de píxeles main/picture iguales. Reproducción
silenciada del SHA definitivo completa, sin saltos. Correcciones visuales de
paneles, búsqueda y etiqueta editorial. No se presume aceptación creativa.
Capturas nuevas de Expo Web a 860 × 1790; adquisición 9–12 fps reales,
conformada a 25 respetando tiempos, sin interpolación inventada. No es APK.
Servidor temporal cerrado, producto sin cambios. Música para publicidad
online, no emisión de TV/radio. Sin commit, push, publicación, SQL, catálogo
nuevo, cuentas, build/OTA o créditos de generación. WIP compartido conservado.

---

## 28 de octubre de 2026 · Codex · anuncio rehecho con personas reales

Nueva propuesta local de 26 s en
`rwadar-spot-reboot-2026-10-27/output/rwadar-hay-mas-1080p.mp4`, con copia
ligera y reproductor. Sustituye el corte de treinta segundos que Víctor
rechazó. Rodaje humano licenciado de la misma actriz con móvil y portátil,
radar auténtico, selección real de Spiko en Expo Web, modelo educativo WebGL
real y una oferta de Spiko en alta resolución. Se retiró toda locución
generada. La web aparece como contexto de portátil, mención y URL, sin captura
de su interfaz. [Informe](../VERIFICACION-REBOOT-RWADAR-2026-10-28.md).

Dos exportaciones: descodificación completa, 624 fotogramas/24 fps/26 s,
BT.709 completo y AAC final dentro del objetivo. Reproducción del SHA final
completa, silenciada, sin errores ni pérdidas. Revisión visual muestreada
independiente y corrección de recortes, fuentes y párrafos ampliados.
Investigación documental de referentes con fuentes primarias; no se afirma
haber visionado sus spots. Calidad creativa pendiente de valorar por Víctor.

Sin commit ni push, créditos adicionales, publicación, SQL, catálogo nuevo,
cuentas, cambios de producto o build/OTA. Se conserva el WIP compartido.
Las capturas Expo Web no acreditan un APK. La música permite publicidad
online, pero no emisión de televisión/radio.

---

## 27 de octubre de 2026 · Codex · mapa publicado en producción

Web publicada en https://rwadar.pages.dev con Buscar → Lista/Mapa, 26 fichas geográficas (24 puntos, 4 aproximadas) y catálogo49 conservado. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5; autorización y publicación registradas en552845c. Deployment https://0d881a1d.rwadar.pages.dev;8 controles HTTPS en producción y2 GET independientes con bytes exactos aprobados. Se reutilizan web549/fichas90/acceso55/mapa10/precarga31; no repetir. La revisión visual no quedó acreditada por el controlador. [Informe](../VERIFICACION-MAPA-2026-10-27.md). Android1.4.0 sigue pendiente, con APK20 y pruebas conservadas; no está publicado. CuentaQA limpiada. Investigación pausada. Main compartido intacto; fuente en rama aislada.

---

## 27 de octubre de 2026 · Codex · mapa en preview; control visual bloqueado

Mapa en Buscar, 26 ubicaciones documentadas y consulta pública. Fuente e1923c297dfd17924fd1a9cd2fee9d8b217f62d5. Pasan web549, fichas/RSS90, acceso55, mapa10 y precarga31. Preview https://3fbac666.rwadar.pages.dev desplegada y 8controlesHTTP aprobados. El control visual se detuvo al no poder verificar la URL de Chrome. Producción no promovida; no volver a desplegar preview ni repetir pruebas locales que pasan. Falta revisión visual y producción. [Informe breve](../VERIFICACION-MAPA-2026-10-27.md). App: idiomas/favorito57/57 y lección completados en40562598549; falló después por lectura temprana del tutorial aún cargando. PatchLF preparado en W/android-tutorial-continuation-40562598549.patch, sin aplicar. Generador público W/generar-qa-publica-c20-language-reuse-27.propuesto.py. Faltan tutorial, cartera y salida. CuentaQA limpiada al cierre del turno. APK20 sin recompilar. Investigación pausada; main compartido intacto.

---

## 27 de octubre de 2026 · Codex · anuncio centrado en app y web, con navegación

Víctor pidió rehacer el anuncio: aspecto de spot televisivo, app/web como
protagonistas, mensaje aspiracional y voz de España. Rechazó Elvira por
robótica e Ines por acento latino; ambas quedan fuera del corte vigente.
La nueva revisión de **30 s** está en
`rwadar-comercial-valencia-v2-2026-10-27/output/rwadar-mas-cerca-app-y-web-1080p.mp4`,
con copia ligera y reproductor. [Informe](../VERIFICACION-ANUNCIO-APP-WEB-2026-10-27.md).

UI durante 20,708 s, incluidos 14 s seleccionados de navegación real del
código React Native en **Expo Web**: buscar Casa, abrir Outeiro, recorrer la
ficha, cerrarla y volver al radar. Catálogo público real, cuatro GET 200;
sin mocks, cuentas, favoritos, mutaciones ni cambios de fuente/dependencias.
No se presenta como captura del APK. El servidor temporal quedó cerrado.
La web se capturó el 27/10; las imágenes nativas de apoyo son del 22/10.
Avisos y rótulos editoriales preservados. Cierre acordado:
«La inversión en activos tokenizados no está exenta de riesgos».

Dos copias descodificadas completas; 720 fotogramas, 24 fps, Full HD. AAC final
idéntico al máster director comprobado: −14,22 LUFS y −1,17 dBTP. Reproducción
completa de 30 s en Chrome aislado en silencio, sin pérdida de fotogramas ni
errores; revisión visual independiente muestreada sin bloqueantes. La nueva
voz se dirigió como narradora de Madrid y el guion se transcribió completo;
estas mediciones no certifican acento ni interpretación por escucha humana.

Esta revisión consumió 53,25 créditos: total acumulado 615,95 de los 650
autorizados, sin compras ni cambios de plan. Sin commit, push, publicación,
SQL, catálogo nuevo, cuentas, build/OTA ni cambios del producto. Se conserva
el WIP compartido. Falta la valoración creativa de Víctor de la revisión
entregada; no se afirma que haya aceptado la voz ni el resultado.

---

## 26 de octubre de 2026 · Codex · cierre Android en curso, sin otra compilación

La 1.4.0 corregida ya está compilada como APK20. No volver a compilar por fallos
del comprobador. Pasan 92 pruebas locales, firma y 49 recursos, acceso, radar26,
catálogo49, ficha con letra1.5 (título, X, Atrás y fuente) y grupo Brickwise12.
Faltan Reental21, contenido/idiomas, Academy, cartera y cierre de sesión.
La descarga final sigue en1.3.2; el draft1.4.0 conserva el APK19 y no debe publicarse así.
Fuente móvil en7c64b6c; arnés y pruebas conservadas hasta a501a3d, en rama aislada.
Investigación PAUSADA. [Estado breve](../VERIFICACION-ANDROID-140-CIERRE-2026-10-26.md).
No sobrescribir el main compartido con cambios de otras herramientas.

---

## 26 de octubre de 2026 · Codex · defecto real del catálogo Android corregido

APK19 entra con la cuentaQA, pero rechaza el catálogo real por tamaño y muestra0/0.
Arreglo mínimo en cuentas.js: soloGET de dos vistas V2 permite2MiB/15s;
Auth/privados conservan128KiB/8s.28pruebas nuevas+64regresiones pasan;
revisión independiente aprobada y contrato real26/49 correcto. NuevoAPKpendiente;
no publicar el19. Investigación pausada. [Informe breve](../VERIFICACION-CORRECCION-CATALOGO-ANDROID-2026-10-26.md).
Cambios en el commit que incorpora esta entrada. Main compartido no se toca.

---

## 26 de octubre de 2026 · Codex · web pública publicada; Android sigue pendiente

Web publicada en https://rwadar.pages.dev (despliegue
https://f0ec3606.rwadar.pages.dev), después de la preview
https://99d594e3.rwadar.pages.dev. Consulta sin registro y cuenta para funciones
personales; corregido el doble cierre que podía borrar la sesión recién abierta.
37 pruebas locales dirigidas, 16 comprobaciones HTTP en preview y otras 16 en
producción; login, sesión y logout reales pasaron en ambos entornos. No se
repite la inspección visual anterior: la nueva del 26/10 quedó bloqueada porque
Computer Use no pudo verificar la URL del navegador.

SQL28 revertido con permiso: 26 plataformas y 49 referencias conservadas,
lectura pública restaurada y RLS de perfiles/vigilancia mantenida. Se restaura
el contrato de sincronización de 1.3.2, sin nueva prueba en dispositivo.
Investigación PAUSADA; sin nuevas ofertas ni fechas rejuvenecidas.

Fuente y aprobación en `093ec47`, `9cfe70e`, `f2915dc`; arnés en `6c9373c`.
Android 1.4.0/código 19 sigue como draft: mismo APK y baselines conservados,
sin nueva compilación. Las tres continuaciones del 26/10 suman 442 segundos y
fallaron en el arnés; no acreditan 20/20 ni autorizan afirmar publicación.
El EOF de arranque del capturador ya está corregido y probado con un socket
local real; ampliar el límite es requisito para otra ejecución completa.
Cierre nativo, limpieza de QA y publicación si pasa siguen pendientes.
[Informe vigente](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
No integrar ni sobrescribir el main compartido con WIP de otras herramientas.

---

## 26 de octubre de 2026 · Codex · web pública y cierre del mismo APK

Por nueva orden expresa: web legible sin registro, cuenta para funciones personales
y cierre/publicación del APK19 existente. Investigación sigue PAUSADA.
SQL28 revertido con autorización específica:26/49conservados y lectura pública
restaurada; perfiles/vigilancia mantienenRLS. Worker y bridge públicos, login
serializado para evitar doble logout;34+3pruebas dirigidas aprobadas. Se conservan
los baselines APK19 y99/11 anteriores. Sin nueva compilación ni cambio móvil.
El arnés incorpora foco/IME actuales, cierre observado del radar y menos snapshots;
14simulaciones dirigidas. Estado de despliegue y QA aún pendientes en el
[informe26/10](../VERIFICACION-ACCESO-PUBLICO-2026-10-26.md).
Los commits que incorporan esta entrada contienen la fuente preparada y su
aprobación separada; no integrar el main compartido con WIP de otras herramientas.

---

## 26 de octubre de 2026 · Codex · anuncio cinematográfico Valencia terminado

Víctor rechazó la primera animación y después sustituyó el concepto por un
spot con mujer, coche de lujo, Valencia nocturna, edificio aspiracional y
cierre en casa con pijama y perro. **La entrega principal ahora es el anuncio
de 34 s** en `rwadar-comercial-valencia-2026-10-26/output/`, con copia para
compartir y portada. [Verificación](../VERIFICACION-ANUNCIO-VALENCIA-2026-10-26.md).

Cinco planos fotorrealistas y voz generados; pantalla auténtica integrada
en perspectiva, música licenciada para web/redes, foley, color y mezcla.
13 controles técnicos aprobados, 816 fotogramas descodificados, AAC final
−14,0 LUFS / −1,2 dBTP. Revisión visual muestreada del archivo completo.
No se afirma escucha humana ni funcionamiento nativo actual: las pantallas
proceden de la QA del 22/10. Edificio/precio ficticios, sin compra inventada
ni rentabilidad garantizada dentro de RWAdar.

Autorización expresa de 650 créditos Higgsfield; consumo real 562,70, sin
compras, cambio de plan ni reintentos. Se mantiene todo local sin publicar
web, app o redes. Sin commit y sin cambios del producto; se conserva el WIP.
Las animaciones anteriores quedan como material secundario, no como el spot
solicitado. No queda trabajo de producción requerido para entregar este MP4.

---

## 26 de octubre de 2026 · Codex · vídeo promocional «Sigue la fuente»

Víctor pidió una pieza de animación como la referencia adjunta, con edición,
postproducción y motivos para usar la app. Entrega local terminada en
`rwadar-promo-2026-10-26/`: MP4 principal de 24 s, vertical 1080 × 1920 a
60 fps, copia ligera, portada, reproductor y fuentes editables. Animación 3D,
música y efectos originales; tres agentes apoyaron sonido, recursos y revisión.
Sin commit de esta sesión y sin publicar.

La [verificación del vídeo](../VERIFICACION-VIDEO-PROMOCIONAL-2026-10-26.md)
registra 14 comprobaciones técnicas aprobadas, 1.440 fotogramas descodificados,
−14,1 LUFS / −1,7 dBTP en el AAC final, revisión visual muestreada y fuentes.
Las pantallas auténticas son de la QA aprobada del APK 1.3.2 del **22/10**;
no son capturas actuales ni una nueva validación nativa. Se conservan sus
rótulos editoriales. El intento de captura nueva se cerró por bloqueo del
navegador y no se presenta como completado.

Pendiente solo la decisión editorial de Víctor de usar/publicar el vídeo;
la entrega local no autoriza difusión. No hay nueva investigación, SQL,
build/OTA, cambios del producto ni pruebas nativas. Se preservó el trabajo
compartido anterior. No se afirma escucha humana ni reproducción del usuario.

---

## 24 de octubre de 2026 · Codex · revisión integral y compatibilidad pendiente

Se revisó la entrega desde `9d51f8b`, con tres ayudantes de lectura y cierre
acotado. No cambió la fuente del producto. Se corrigieron contradicciones del
estado vigente y se añadió la [revisión integral](../REVISION-INTEGRAL-2026-10-24.md).
GitHub consultado: latest sigue en1.3.2 y1.4.0 es draft. La última QA Android
fallida conserva todas sus evidencias y no se repite.

Hallazgo prioritario por código:1.3.2 consulta con cliente anónimo separado de
Perfil; SQL28 ya impide esa sincronización. Con caché válida conserva la copia;
sin ella el lector devuelve listas vacías. Falta observación actual en dispositivo.
El panel de Claude usa también lectura anónima y rutas web ahora protegidas;
necesita adaptación, sin tocar su WIP. Main aún no contiene la web publicada.

Solo se hicieron cuatro lecturas HTTP nuevas: robots200; sitemap/RSS401;
fichaHTML303 al acceso. No se repitieron11/99 ni baterías locales. Automatización
leída PAUSED; no se inicia investigación. Cartera sigue manual/local, investigación
49 incompleta, recuperación del titular sin guardado acreditado, seguridad y
vídeos con los límites del informe. Los tres ayudantes han terminado.

Los cambios de esta entrada son documentales, en el commit que la incorpora.
No hay SQL, correos, cuentas nuevas, builds, otra ejecución nativa ni despliegues.

---

## 24 de octubre de 2026 · Codex · web con cuenta y radar publicada

Producción real: https://414005a7.rwadar.pages.dev y https://rwadar.pages.dev.
Preview revisada: https://2b48b963.rwadar.pages.dev/acceso. Fuente visual en
46f38a0; aprobación web en9f7ea9f. El titular autorizó expresamente esta
producción después de que la revisión automática distinguiera app y web.
SQL28 aplicado con autorización:24 relaciones protegidas,26 plataformas,
49 referencias,retirado=false y SELECT anónimo denegado. No se alteraron filas
ni fechas del catálogo. Once comprobaciones dirigidas de producción aprobadas,
incluida identidad de los recursos de acceso. Investigación PAUSADA.

APK19 inmutable y con la misma firma, sin nueva compilación. Subido como borrador
v1.4.0 conRWAdar.apk ySHA256SUMS.txt; no es una release pública ni cambia latest.
Run privado40121753928 aprobó99peticionesweb/3páginas/87recursos y falló después
por importjson del arnés. Run40122469905 reutilizó esePASS y confirmó login,
pero falló en reauth al redimensionar. Corregido en2496686; UTF8 de etiquetas
restaurado y contrastado en2e6e96f antes de otra ejecución. Nunca atribuir20/20
ni publicar por estos resultados parciales. Víctor autorizó una última
ejecución≤9min:40123408614 falló en login_confirmed al perder la ventana de la
app. El XML final muestra Launcher/QuickSearchBox y ninguna ventana deRWAdar;
no determina si lo causó un gesto del arnés, cierre del proceso o cambio de
foco. Se detuvo conforme al acuerdo: no hay más ejecuciones ni release. Los
ayudantes han terminado.

La cuentaQA temporal se confirmó con un único correo. Limpieza terminada:
wrapper19417 salió con0, inhabilitación reversible comprobada, cero sesiones
restantes y los dos secretos temporales eliminados. No
guardar enlaces de confirmación, JWT ni passwords. Fuentes y resultados en
[verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).

---

## 24 de octubre de 2026 · Codex · correo y validación del mismo APK

Continúa en la rama aislada, sin tocar el main compartido. El alta que parecía
no enviar correo era repetida. Se comprobó recepción real de recuperación;
el primer enlace validó y el segundo intento reutilizó elOTP. Se corrige el
retorno de preview a revision, evitando producción antigua, y se aclara cómo
continuar tras alta200 sin revelar existencia de cuentas. Tres casos nuevos
dirigidos aprobados, sin repetir33/549. No guardar contraseñas ni enlacesOTP.

APK19 se reutiliza: QA40027041965 falló al desplazar sobre Nombre; se conservan
sus originales y fallo. El arnés usa ahora márgenes libres observados y la
continuación40119180570 comprueba solo fuente1,5/giro/excepciones. Aún no hay
aprobación autenticada ni release. SQL28 autorizado, reservado para la activación
web; lote editorial23 aplicado con26/49. [Verificación24/10](../VERIFICACION-CORREO-Y-ANDROID-2026-10-24.md).
La investigación sigue PAUSADA; no iniciar otro ciclo por horario.

---

## 24 de octubre de 2026 · Codex · revisión integral de la entrega actual

La [revisión integral](../../rwadar-entrega-integral-20261022/integracion-140/docs/REVISION-INTEGRAL-2026-10-24.md)
está en el checkout aislado `rwadar-entrega-integral-20261022/integracion-140`,
rama `codex/cierre-android-140-20261023`. Revisión guardada localmente en8f4e9dc,
sin push. Base revisada:9d51f8b. Cambios de esta
sesión: informe, evidencia de cuatro rutas nuevas y corrección del estado vigente;
sin cambios del producto. Se preservan los cambios compartidos de esta carpeta.

Web24/10 publicada; main remoto aún no la integra. GitHub confirma latest1.3.2
y1.4.0draft. El lector anónimo del APK132 no puede sincronizar tras SQL28 y el
panel también necesita adaptar su lectura del catálogo y rutas protegidas.
No hay observación nueva en dispositivo132. El APK19 conserva QA pendiente y
se mantiene detenido tras el último fallo autorizado. Tres ayudantes revisaron
áreas separadas y han terminado; no se repitieron tests aprobados.

InvestigaciónPAUSED, solo manual. Sin SQL, correo, cuentas nuevas, builds,
otra ejecución nativa ni publicación durante la revisión. El traspaso completo
de esta entrega está en el PARA-CODEX del checkout aislado.

---

## 23 de octubre de 2026 · Codex · acceso obligatorio, cartera y tutorial Academy

Se trabajó en la rama aislada codex/cierre-android-140-20261023 sin tocar el
main compartido ni el panel de Claude. Fuente Android consolidada en
`1ecf7e7aa8941400d6ad954680cd6deb89107c42`: acceso obligatorio, cartera manual
local por cuenta, fichas más legibles, aviso desplazable y tutorial de cuatro
pasos dentro de Academy. El APK18 falló de verdad con fuente1,5/lista de altura0;
no reutilizarlo ni reanudar su workflow desactivado como release. Víctor autorizó
una compilación corregida gratuita, terminada como1.4.0/código19. APK de88.961.445
bytes, SHA-256 `f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624`.
CRC y49 imágenes exactas aprobados. La QA anónima `40022139423` aprobó firma,
paquete y permisos y recorre los formularios; no autoriza la release.

Web: entrada/registro/recuperación, Worker sobre todas las rutas, cookie protegida,
progreso/favoritos UUID, limpieza de caché PWA y tutorial guiado. 549 comprobaciones
web locales al final del recolector sin fallos; 33 de acceso, incluyendo Worker
compilado, sesión, esquema real26/49, reversión y bloqueo de producción si la base
sigue admitiendo anónimos. La pasada móvil inicial223PASS tuvo11 fallos resueltos
con repeticiones dirigidas; los módulos antes bloqueados arrancaron22+18 casos.
QR y herramientas aprobados. Web integrada en `f3cfb1a`, manifiesto `ea64ca2`,
plantilla QA inerte `9c1f2ec`; ancla legal corregida en `3f9ce53`.
Preview final: https://648eaf1f.rwadar.pages.dev y https://revision.rwadar.pages.dev.
Navegador real390/1440 y revisión independiente HTTP de diez rutas protegidas
aprobados; el único hallazgo fue el ancla de condiciones, corregida y comprobada
en la preview final. Supabase continúa con sus permisos anteriores: SQL28 pendiente.
No presentar npm test interrumpido como ejecución
monolítica exitosa. Informe: [cierre local](../CIERRE-LOCAL-1.4.0-Y-ACCESO-2026-10-23.md).

El ciclo manual de hoy preparó cuatro referencias en tres fichas, sin nuevas
altas ni rejuvenecer las otras fechas. SQL editorial revisado independientemente;
SQL28 de acceso y reversión probados. Se solicitó permiso literal
para sus comprobaciones y aplicación: la revisión automática rechazó antes una
consulta de solo lectura por la regla de AGENTS.md. No ejecutar por silencio.
Víctor autorizó ambos cambios: el editorial quedó aplicado a21:19UTC con26/49,
retirado=false y las siete tablas anteriores idénticas por huella. Evidencia en
docs/investigacion/2026-10-23/aplicacion-supabase-editorial.json. SQL28 aún no
se aplica: coordinarlo con la web verificada. No renovar las fechas generales.
La tarea de investigación está PAUSADA; nunca reactivar el horario.

El usuario probó acceso y encontró fallo genérico. Diagnóstico en runtime
Cloudflare: redirect:error no implementado, antes deGoTrue. Parche manual+
rechazo3xx comprobado en workerd y dos pruebas enfocadas. Publicar en preview
antes de pedir otro intento. No cambiar Auth ni crear usuarios de prueba.

Pendientes: activar SQL28 junto a web verificada, cuenta/buzón controlados para alta-confirmación y
recuperación reales, QA autenticada del APK19 y publicación tras compuertas. Los originales
de los dos vídeos siguen sin enlaces recuperables; no atribuirles revisión.
Los ayudantes entregaron cada área y están detenidos, sin trabajo abierto.

---


## 23 de octubre de 2026 · Claude · panel: correos, fechas, velocidad, planes y catálogo

Víctor eligió seis añadidos para el panel (`rwadar-panel/`, rama
`claude/panel-control`). Todo es **de solo lectura**; no se tocó la web, la
app ni la base:

- **Cuentas › Correos** (`lib/correos.js`): remitente y límite por hora (de
  la configuración de Auth, **solo campos no secretos**), altas confirmadas y
  cuánto tardan, cuentas >24 h sin confirmar, y errores de envío de 24 h en
  `auth_logs` con correos e IP tapados.
- **Límites y fechas** (`lib/fechas.js`, `lib/planes.js`): caducidad del
  catálogo, `security.txt` (22/08/2027) y claves del panel; uso de Workers y
  KV de Cloudflare por día, Supabase (plan, salud, último uso), minutos de
  GitHub Actions del mes exactos por trabajo (13 % el 23/10) y compilaciones
  de Expo lanzadas desde GitHub (1 de 15).
- **Tráfico › Velocidad real** (`lib/velocidad.js`): LCP, INP y CLS p75 de 7
  días por móvil/ordenador; sin nota con menos de 10 visitas medidas.
- **Catálogo y Academy** (`lib/contenido.js`): inventario de lo publicado y
  lecciones más leídas. **Ojo:** la web solo carga la analítica en portada,
  Academy y legales (`assets/analitica-*.js`), así que **no se sabe qué
  fichas de oferta/plataforma se abren**. Medirlo (y los clics «Ir a la
  plataforma») es un cambio de la web propuesto aparte; el panel lo cruzará
  solo si aparecen rutas `/ofertas/…` en Web Analytics.
- Hallazgos para revisar: las **26 plataformas** llevan 76–89 días sin
  verificar; **23 de 26** no tienen ninguna oferta y hay ofertas de
  proveedores sin ficha de plataforma (Aktionariat · BOSS, Midas, Alius…).
- Salud pasa de 11 a 14 comprobaciones. Pruebas: `npm run test:panel` 45/45.

---

## 23 de octubre de 2026 · Codex · revisión de pendientes e investigación manual

Víctor pidió contrastar la lista completa, reutilizar el APK 1.4.0 y evitar
repetir pruebas. Tres ayudantes recibieron áreas separadas: web/catálogo,
Android y seguridad/vídeo. Sus revisiones de evidencias no ejecutaron nuevas
baterías ni operaciones remotas. La matriz está en
[`../REVISION-PENDIENTES-2026-10-23.md`](../REVISION-PENDIENTES-2026-10-23.md).
La web integral tiene comprobación de producción del 22/10; eso no se presenta
como una nueva inspección remota del 23/10. GitHub sí se consultó el 23/10:
la última versión pública sigue siendo **1.3.2**. El APK **1.4.0/código 18**
ya está compilado; falta cerrar las fases nativas pendientes antes de publicarlo.

**Corrección efectiva del programador:** la tarea existente se actualizó a
«RWAdar · investigación profunda bajo demanda», con estado **PAUSED**,
comprobado después en su configuración guardada. Solo se inicia al pulsar
**Ejecutar** o con una orden expresa de Víctor; cada inicio corresponde a un
solo ciclo y no reactiva el horario. Investigar no concede por sí solo permiso
para SQL remoto o publicación web. Esta entrada sustituye las referencias a
«ACTIVA a las 09:00» de los traspasos históricos inferiores. No se investigó
ni se publicó catálogo durante esta revisión.

Quedan parciales la investigación documental de las 49 ofertas, el plan 5S y
la revisión exhaustiva de textos. Comunidad sigue apagada: sus refuerzos
adicionales tienen pruebas locales, pero la migración no está aplicada.
Turnstile, allowlist de Auth y pruebas reales de cuentas/dispositivo mantienen
sus pendientes documentados. El vídeo local usa nueve perfiles simulados:
45 tareas observables no acreditan satisfacción humana del 90 %.

---

## 23 de octubre de 2026 · Claude · parche de seguridad de Node.js (aviso de Render)

**Rama:** `claude/node-seguro-2026-10-23`. Nada publicado, nada tocado en Supabase.

- **Origen:** correo auténtico de Render (`no-reply@render.com`) sobre el aviso de
  Node.js del 21/10 (Brotli con ejecución remota, saltos de la comprobación de
  nombre TLS y certificados comprometidos de eMudhra; corregido en 22.23.4,
  24.22.1 y 26.12.1) y PHP2Shell. RWAdar no usa Render ni PHP: la web es
  estática en Cloudflare Pages. Lo afectado es Node en GitHub Actions y en el PC.
- **Cambios:** `rwadar-node-seguro.js` (comprueba la versión y explica cómo
  actualizar; `--comprobar` prueba 16 versiones); los flujos `ci`, `publicar` y
  `compilar-app` fijan `node-version: 22.23.4` (antes `22`, que podía usar el
  Node anterior en caché del runner) y lo comprueban antes de usar la red;
  `test:tools` incluye la tabla; el ciclo diario lo ejecuta en su paso 1 y,
  si falla, sigue igual pero avisa a Víctor al principio del resumen.
- **EAS:** la imagen de Android de SDK 57 trae Node 22.23.1 (vulnerable), así
  que los cuatro perfiles de `rwadar-movil/eas.json` fijan `"node": "22.23.4"`.
  Solo afecta a la próxima compilación (la app no lleva Node dentro y
  `runtimeVersion` es `appVersion`); no se ejecutó EAS. Si esa compilación
  falla al instalar Node, mirar el registro «Spin up build environment».
- **No toqué** `rwadar-publicar.js` ni `rwadar-precargar-imagenes.js`: están en
  `RUTAS_CONTENIDO_APROBADO` y cambiarlos invalidaría la huella aprobada.
- **Pruebas con Node 22.23.4** (descargado y cotejado con `SHASUMS256.txt`):
  todo lo que toca este cambio pasa (`test:tools`, la tabla de 16 versiones,
  la compuerta de publicación sigue aprobada y el detector de secretos no
  encuentra nada). La comprobación para con v22.22.0 (salida 2 y mensaje) y
  deja pasar v22.23.4.
- **`main` ya estaba en rojo antes de esto** (Verificación de `1a0643d`), no por
  Node: con v22.22.0 falla igual. Víctor pidió no tocar el trabajo de Codex, así
  que **no se cambió**; queda para Codex, con el arreglo ya probado en una copia:
  1. `probar-precarga.cjs:47` crea su temporal dentro de
     `rwadar-entrega-integral-20261022/`, que solo existe en el PC → `ENOENT` en
     GitHub. Basta con `fs.mkdirSync(path.join(raiz,'rwadar-entrega-integral-20261022'),{recursive:true})`
     justo antes.
  2. `rwadar-movil/tests/ofertas-vigencia.test.cjs`: 16 pruebas fallan con
     `P is not defined`, porque el fragmento web usa `P` y `EMI` para
     `RUTAS_FICHAS_DESPLEGADAS`; basta con añadir `P: [], EMI: []` al contexto de
     `cargarWeb`. Otras 2 (líneas 681 y 699) siguen la regla antigua de imágenes;
     hay que ponerlas al día con el contrato que ya prueba `probar-precarga.cjs`
     (`oferta-<slug>.webp`, la categoría como `respaldo` y `null` con un slug no
     válido). Con esos tres cambios, en una copia limpia con Node 22.23.4:
     web 551/551, app 233/233, precarga 29/29 y `npm test` correcto.
- **Pendiente para Víctor:** actualizar Node en el PC a la última de su rama
  (`node --version`; instalador en `https://nodejs.org/dist/latest-v22.x/` o
  `latest-v24.x/`), o pedírselo a Codex en el PC. Hasta entonces el ciclo diario
  funciona igual y lo recuerda cada día.
  Después, `node rwadar-node-seguro.js` debe decir que lleva el parche.
  Navegadores y Android reciben la retirada de eMudhra con sus propias
  actualizaciones; no hace falta compilar la app.

---

## 22 de octubre de 2026 · Claude · panel de control (`rwadar-panel/`)

Víctor pidió un panel para controlarlo todo y compartirlo con sus socios por
WhatsApp, entrando solo con un enlace. **Commits en la rama local
`claude/panel-control`** (no subida a GitHub, no unida a `main`); en la carpeta
de trabajo los mismos archivos siguen sin seguimiento sobre `main`, junto a los
cambios sin subir de Codex en `AGENTS.md` y `docs/`, que no se han tocado.
**No se ha publicado nada ni se ha tocado Supabase ni Cloudflare**: todo se
probó contra un simulador local (`rwadar-panel/demo/simulador.js`).

- **23/10 (cierre):** rama `claude/panel-control` subida a GitHub (7 commits, sin unir a `main`; no lanza ningún flujo). Traspaso completo en `docs/tareas/PANEL-DE-CONTROL.md` de esa rama.
- **23/10 (tarde):** `GITHUB_TOKEN` fino de solo lectura (RWADAR y
  RWAdar-downloads; comprobado que no ve Calix) subido al Worker: la nube ya
  ve copia de seguridad, tareas y descargas. El uso de la app tiene 25 s de
  margen y, si Supabase no contesta, sale de lo apuntado cada hora. Recorrido
  final en la nube: todo correcto salvo el aviso real de Actions (Compilar
  app Android, Publicar web, Verificación). Pruebas 36/36.
- **23/10:** Víctor decidió que el panel **no apague la web** (cuando haga
  falta os lo pide a vosotros): quitados el botón, la página de
  mantenimiento y los despliegues de Pages (rama, commit `e174ccb`). Panel
  subido de nuevo con los mismos enlaces (huellas comprobadas). Cloudflare
  solo cuenta exacto los últimos 7 días (más allá muestrea 1/10): el panel
  apunta cada día las visitas exactas en KV. Retirar el catálogo solo se
  ofrece si la base da permiso (hoy no: 42501). Pruebas 35/35 y recorrido
  completo con datos reales, local y nube.
- **Estado al cierre (22/10, noche):** Víctor puso sus claves y dio permiso
  expreso para subirlo. Worker `rwadar-panel` subido a
  <https://rwadar-panel.victorjorquesgranero.workers.dev> con KV
  `rwadar-panel-almacen` y cron horario. Se renovó `wrangler login` (la sesión
  anterior solo tenía Pages; ahora tiene los permisos por defecto). Comprobado
  desde fuera: sin enlace 401, enlace falso 403, enlace real entra; salud,
  visitas, cuentas (9) y uso de la app (95 app / 81 web en 24 h) con datos
  reales. Rama con 4 commits (`f2441b3` y el de GitHub). **Pendiente de
  Víctor:** permiso «Cloudflare Pages · Edit» en el token del panel (sin él
  no hay encender/apagar), un `GITHUB_TOKEN` de solo lectura (desde Cloudflare
  GitHub limita las consultas sin clave) y decidir si se da a `service_role`
  `SELECT, UPDATE` en `catalogo_publicacion` (hoy el botón de retirar el
  catálogo da 42501; también `perfiles` y `vigilancia` están cerradas).
- **Segunda tanda:** datos de la app (aperturas del catálogo desde la app y la
  web por hora, leídas de los registros de Supabase con `SUPABASE_ACCESS_TOKEN`;
  historial por día y descargas por día) y entrada por **enlace personal** sin
  cuentas (llave tras `#`, cookie firmada 90 días, solo huellas en el Worker,
  anulable por persona). Cloudflare Access queda como opción. Cron horario en
  el Worker. Pruebas 31/31.
- **Sin comprobar contra producción (además de lo de abajo):** la consulta
  ClickHouse a `logs` (`source_name`, `log_attributes[...]`) y el formato de
  `event_message`; la doc de Supabase no es del todo coherente.

- **Qué hace:** encender/apagar la web (sube una página de mantenimiento 503 y
  vuelve al despliegue anterior con la API de Pages), retirar/mostrar el
  catálogo (`catalogo_publicacion.retirado`), salud con doce comprobaciones y
  qué hacer, visitas de Web Analytics (GraphQL `rumPageloadEventsAdaptiveGroups`),
  descargas del APK por versión, cuentas (listar, confirmar, bloquear, borrar
  con el correo escrito) y registro de acciones con quién las hizo.
- **Dos modos:** `npm run panel` (local, 127.0.0.1, sesión por arranque) y el
  Worker `rwadar-panel` en Cloudflare detrás de Cloudflare Access + lista
  `PANEL_SOCIOS`, con verificación propia del JWT (falla cerrado).
  Detalle y pasos en `rwadar-panel/LEEME.md`.
- **Toca fuera de la carpeta:** `.gitignore` (readmite `rwadar-panel/`,
  ignora `datos/`, `datos-demo/` y `nube/generado/`) y `package.json`
  (`panel`, `panel:demo`, `panel:nube`, `panel:nube:demo`, `test:panel`, y
  `test:panel` dentro de `npm test`). No toca `rwadar-site/` ni ninguna ruta
  con huella aprobada.
- **Pruebas:** `npm run test:panel` 25/25; `npm run test:tools` correcto;
  `npm run panel:nube -- --ensayo` empaqueta el Worker con wrangler 4.125.0
  (62 KB, sin módulos de Node ni claves); el Worker se ejecutó en `wrangler dev`
  con Access simulado y se recorrió en el navegador (socio, intruso, móvil).
- **Sin comprobar contra producción:** los nombres de campos de la consulta
  GraphQL de visitas, la vuelta atrás de Pages, la API de administrador de
  Supabase y el PATCH del catálogo con la clave secreta. Se verán la primera
  vez que Víctor abra el panel con sus claves.
- **Pendiente de Víctor:** crear el token de Cloudflare y la clave secreta de
  Supabase, rellenar `PANEL_SOCIOS`, ejecutar `npm run panel:nube`, activar
  Access en el Worker y apagar/encender una vez desde el ordenador para dejar
  subida la página de mantenimiento.

---

## 22 de octubre de 2026 · Codex · cierre de reintentos por consumo

Víctor ha reprochado el consumo desproporcionado. Se detuvieron los agentes y
las revisiones delegadas; no lanzar más reintentos por iniciativa automática.
La web integral está publicada en `rwadar.pages.dev` (e764634c) y comprobada.
Android público sigue en 1.3.2. El APK 1.4.0/código18 está compilado, pero sus
ensayos no han cerrado correctamente: **no está aprobado ni publicado**.
Último ensayo: 39812931682, head público40f926f, fallo en el recorrido;
la descarga diagnóstica no equivale a una QA superada.

El soporte de precarga está en `de7f2b1`, aprobado para preview en `b3deb41`;
`1a0643d` separa referencias documentales duplicadas. Preview `b0fa07a6`
publicada, sin comprobación remota final ni producción de ese soporte.
Pruebas locales:551web+90fichas+29precarga; no repetirlas sin un cambio o fallo.
La tarea diaria sigue ACTIVA a09:00localPC, pero las altas nuevas están
bloqueadas hasta publicar/verificar la compatibilidad web y Android>=1.4.0.
No se aplicó SQL nuevo durante este cierre. Revisar workingtree y
`rwadar-entrega-integral-20261022/CONTINUACION.md` antes de retomar; conservar
el catálogo completo y la versión pública. Falta cerrar también la lectura
canónica de Cloudflare mediante su autenticación vigente y el texto del horario.

## 22 de octubre de 2026 · Codex · segunda revisión integral, idiomas y ciclo diario

Trabajo posterior al cierre de la web y Android 1.3.2 descrito debajo. Se integró
la reorganización de Claude y se atendió la ampliación pedida por Víctor. La
publicación nueva se documenta por separado; no reutilizar la prueba de 1.3.2
como si demostrase el APK 1.4.0.

- **Fuente móvil:** `6735317` y `3af2033`, Android 1.4.0, fichas acotadas al área visible,
  radar y sus toques corregidos, datos editoriales citables e idiomas ES/EN.
  Suite final 233/233 y comprobación Expo/Metro correcta. El candidato de código
  17 se canceló por una modificación durante la preparación del archivo; se
  consolidó esa corrección y se inició el código 18 dentro de la cuota gratuita.
  La QA y publicación se cierran con sus propios identificadores cuando terminen.
- **Catálogo aplicado:** lote del 22/10, vigente hasta el 29/10, 26 plataformas,
  49 referencias y 4 descartes. SQL editorial revisado, PGlite y lectura pública
  posterior. IOD cerrado. Los nuevos detalles investigados en el informe de
  condiciones no se aplicaron automáticamente como hechos acreditados.
- **Web publicada y comprobada:** segunda mitad de la reorganización, detalle sin
  recorte, campos mínimo EUR/España/salida/costes, 49 páginas de oferta,
  26 de plataforma, 4 de descarte, metodología, cambios y RSS. Snapshot
  separado del comportamiento, helper común y fuentes WOFF2 reutilizadas.
  Fuente integrada en `ab61990`, correcciones públicas `386f86f`, `da2ae49`,
  `f0a413a` y comparación móvil `2c98d46`. Cuarta preview aprobada y producción
  desde `08b18a4`: 208/208 HTTP, 206/206 recursos idénticos y Chrome real a
  320/390/1440, ES/EN, persistencia, búsqueda, foco y comparación. Suite web
  final 551/0 y 90 comprobaciones de páginas; cobertura transversal completada
  por áreas en logs preservados, sin atribuir un único `npm test` final exitoso.
- **Vídeo local entregado:** evaluación grabada de la interfaz real mediante
  nueve perfiles simulados, 45/45 tareas observables y reproducción completa
  de la edición final. No es investigación con nueve personas reales.
- **Tarea diaria activa:** «RWAdar · investigación y publicación diaria», a las
  09:00 locales del PC por autorización expresa de Víctor; actualmente coincide
  con España peninsular. Investigación documental profunda, decisión diaria
  binaria, sin cola «en investigación», revisión independiente y publicación
  editorial tras las compuertas. PC y aplicación deben estar encendidos.
- **Seguridad:** comunidad OFF y su refuerzo probado localmente, sin aplicar
  esa migración; callback de cuentas corregido. Turnstile, allowlist real de
  Auth y los flujos con credenciales del titular siguen separados y pendientes.

Detalle: [`VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md`](../VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md),
[`CICLO-DIARIO-CATALOGO.md`](CICLO-DIARIO-CATALOGO.md) y los informes de
condiciones y seguridad fechados el 22/10. No borrar informes anteriores.

## 22 de octubre de 2026 · Codex · web desde main y Android 1.3.2 publicados

**Rama:** `main` de `victorJorques/RWADAR`, privado. Víctor autorizó en el turno
la preview, producción, EAS editorial y la distribución Android como 1.3.1.
Se leyó primero la entrada del 21/10 y se hizo `git pull --ff-only origin main`.

- **Web publicada:** <https://rwadar.pages.dev>. El catálogo del 21/10 ya estaba
  aplicado por Víctor; se leyó y sincronizó sin escribir en Supabase. Snapshot
  26 plataformas, 4 descartadas y 49 referencias (24/21/4), vigente hasta el
  28/10. Las 49 fichas tienen su imagen nueva. El primer intento se detuvo por
  snapshot modificado; se revisó y consolidó antes de publicar. Preview y
  producción tienen 35/35 controles HTTP y 113/113 recursos idénticos.
- **Commits fuente enviados:** `0a49969` (snapshot y preparación), `9f5ab61`
  (huella aprobada) y `8821228` (preview y dependencias). Web y APK salen de
  ese corte de main. El cierre documental y las copias inertes de workflows
  están en el commit que contiene esta entrada; no cambian el binario entregado.
- **Android final:** [RWAdar 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2),
  código **16**, perfil editorial. Una sola compilación EAS, misma firma que
  1.3.1. Publicada como latest final el 22/10; APK, sumas y ZIP de evidencia
  descargados sin autenticación y cotejados. `/android` lleva a 1.3.2.
- **QA del APK:** ejecución `39701844100` exitosa con el binario exacto:
  instalación, cuatro pestañas, catálogo, Academy, favorito tras reiniciar,
  cinco fotos y formularios sin credenciales. Capturas propias revisadas por
  tres agentes; separación de la nota de favoritos 92 px. La primera ejecución
  pasó el uso pero falló por el límite inicial del ZIP; se amplió solo ese
  límite y se repitió el mismo APK conservando todas las capturas.
- **Publicación Android:** ejecución `39702655647` exitosa; commits públicos
  `3b366a3` (QA definitiva), `77371f1` (publicación tras revisión) y `340a906`
  (controles de publicación devueltos a `NO`, sin repetir Actions). El origen
  privado no cambió de visibilidad. No se publicaron tiendas ni OTA.
- **Pruebas y coste:** `npm ci` raíz y móvil; `npm test` completo correcto,
  web 502/502, móvil 184/184, base/QR/herramientas correctos; compuerta final
  51/51. Navegador real
  móvil y escritorio y formularios observados sin envíos. EAS Free después:
  Android 5/15, total 6/30, cero exceso, complementos y coste estimado.
- **Avisos pendientes:** Expo Doctor 20/21 por seis parches recomendados;
  `npm audit` conserva 21 avisos móviles y uno alto en raíz, cero críticos.
  No se cambiaron locks ni se silenciaron avisos. Quedan Auth con credenciales
  reales, recuperación efectiva, entrega de correo y teléfono físico;
  no se atribuyen a la QA del emulador. Renovar catálogo antes del 28/10.
- **Archivos locales preservados:** los tres archivos sin seguimiento del
  manual están en `rwadar-respaldo-local-20261022/`, con manifiesto y SHA,
  fuera de rutas publicables. La evidencia detallada queda en la carpeta
  ignorada `rwadar-entrega-20261022/`; no restaurar el PDF al sitio público.

Informes: [`VERIFICACION-PUBLICACION-2026-10-22.md`](../VERIFICACION-PUBLICACION-2026-10-22.md),
[`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](../VERIFICACION-ANDROID-1.3.2-2026-10-22.md)
y [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

## 21 de octubre de 2026 · Claude (10) · catálogo del 21/10, fotos por ficha, revisión de la web y comunidad

**Rama:** `claude/integracion-2026-10-19` (une lo publicado por Codex el 11/10 con todo lo del catálogo). **Nada aplicado en Supabase ni publicado.** Codex no ha subido nada desde el 11/10, así que no hay solapes.

- **Catálogo:** lotes del 20/10 (`504bee7d`) y **21/10 (`c3b71e81`, vigente hasta el 28/10)** con `npm run catalogo`; 69/69 fuentes, PGlite OK dos veces. Vale el del 21/10. Detalle: `docs/CATALOGO-V2-2026-10-21.md`.
- **Imágenes por ficha (contrato editorial v2):** las 49 fichas tienen foto generada del activo (44 con RealVisXL V5.0 Lightning en la sesión, 5 con Canva), retocada y con lugar y tres pasos. Fuente en `rwadar-editorial-source/ofertas/` (`fotos.json`, `fotos/`, `fotografiar.py`, `generar.mjs`). La app las enseña desde su próxima versión: **hace falta 1.3.2 (número y EAS son tuyos)**. Revisión: `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`.
- **Tarjetas al estilo Booking:** web: «Guardar» sobre la foto (solo móvil, 44 px), lugar con chincheta, tarjeta entera abre la ficha (el control sigue siendo «Ver ficha»), aviso no bloqueante a dos líneas. App: lugar con icono `lugar` en `FichaOferta`.
- **Revisión de 20 puntos de la web:** títulos de la Academy ≤ 65 caracteres (`tituloPestana`, el `og:title` conserva el completo), descripción del índice ≤ 160, objetivos táctiles del pie y migas ≥ 24 px, `og.png` rehecho con `rwadar-editorial-source/og.mjs` (decía `rwadar.netlify.app` y «26 pasan el filtro»; 639 → 75 KB).
- **Comunidad (27, preparada y sin aplicar):** se podía saltar «una al día» publicando, borrando y volviendo a publicar, y borrar una oculta por denuncias. Ahora el cupo vive en `cupos_publicacion` (no se libera al borrar) y la oculta no la borra su autor. `probar-comunidad.mjs` 33/33. Se editó `27_comunidad.sql` directamente porque **no está aplicada**: si alguien la aplicó, hace falta una migración aparte.
- **Pendiente de seguridad para Víctor/Codex** (revisión de solo lectura, sin verificar del todo): activar Turnstile (las altas y recuperaciones agotan los 30 correos/hora); dejar en Supabase solo `https://rwadar.pages.dev/` como URL de redirección; valorar en la comunidad comprobar `sesion_confirmada()`, filtrar enlaces también en `autor` y que tres cuentas nuevas no basten para ocultar; en la web, no pintar el `error_description` crudo y avisar con qué correo se entra al adoptar una sesión del enlace.

## 19 de octubre de 2026 · Claude (9) · orden única del catálogo y revisión total

**Rama:** `claude/revision-catalogo-2026-10-19` (PR #12). **Nada aplicado en Supabase ni publicado.**

- **`npm run catalogo`** (`rwadar-app/actualizar-catalogo.mjs`): captura,
  comprueba las 69 fuentes del radar contra `rwadar-app/data/comprobaciones-fuentes.json`
  (reintenta una vez las que fallan), pone al día las 49 fichas con lo leído
  (Brickwise app y API, Aktionariat y portales, Spiko, Prosegur, Alius,
  Hausera, P2P de Reental, Midas), monta, prueba en PGlite y escribe
  `informe-<fecha>.md`. Si falla una fuente del radar no monta nada (sale con 2).
  Probada de punta a punta con captura real simulando el 20/10: 69/69, lote OK.
- `capturar-fuentes.mjs`: hora de Madrid, PDF siempre con curl (dos
  identidades, comprueba `%PDF`), segundo intento por HTTP (navegador y curl)
  si hay bloqueo o 5xx, y paginación del P2P de Reental esperando a sus textos.
- **Lote del 19/10 rehecho:** `aa3aebce` (antes `f9876935`). Fuente de la
  portada de Midas → `midas.app/llms.txt` (la portada ya bloquea la nube);
  aviso general con la redacción de producción («Referencia editorial
  gratuita…»); aviso de quitt (encabezado y tabla no coinciden); número de
  accionistas.
- **Producción ≠ `main`:** Supabase tiene el lote `966c230c` (fichas del 11/10)
  cuya fuente no está en GitHub, y la web/app publicadas salen de
  `codex/cuentas-web-movil`, sin unir. El lote nuevo se probó también en una
  copia de esa rama: `comprobar-revision` OK, `probar-web` 501/501 y la web
  generada con las vistas que saldrán de Supabase se ve bien en Chromium
  (19.10.2026, Spiko 2,41 %, sin cookies ni errores). **Publicar desde esa
  rama**, no desde `main`.
- Revisión total: web en producción 35/35 y base 2/2 en solo lectura; sin
  cookies propias (la `__cf_bm` de Supabase no se guarda); cabeceras de
  seguridad presentes; `/android` → última release; copias diarias correctas
  hasta hoy; `npm audit` raíz y base 0, móvil 23 (los que Codex ya evaluó).

## 19 de octubre de 2026 · Claude (8) · revisión del catálogo del 19/10, preparada sin aplicar

**Rama:** `claude/revision-catalogo-2026-10-19`. **Nada aplicado en Supabase ni publicado.**

- Herramientas nuevas (primera sesión del día, sin internet):
  `rwadar-app/capturar-fuentes.mjs`, `montar-revision.mjs` y
  `comprobar-revision.mjs`, para cualquier fecha. Estado y reglas en
  `docs/tareas/REVISION-CATALOGO-2026-10-19.md`.
- **Revisión del 19/10** (segunda sesión, con internet): lote `aa3aebce`,
  vigente hasta el 26/10. 69 fuentes del radar y las 49 fichas consultadas el
  19/10 desde la nube (salida en EE. UU.). Mismo manifiesto 26/49 (24/21/4).
  Detalle en `docs/CATALOGO-V2-2026-10-19.md`; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json`.
- **Retirado el documento de claude.ai** de las 49 fichas (205 referencias);
  los textos que lo citaban se reescriben con la fuente oficial.
- Midas bloquea la nube: mF-ONE y mTBILL pierden la cifra; las cuatro de Midas
  quedan «no verificable» con aviso. Spiko 2,41 %. IOD Occasio, ya en campaña.
- Pruebas: `comprobar-revision.mjs 2026-10-19` OK (aplicado dos veces sobre la
  cadena de producción en PGlite). `npm test`: db, qr, móvil y herramientas en
  verde; `test:web` falla hoy **también en `main`** porque el catálogo
  incrustado en la web (06/10) caducó; con el reloj al 10/10, 501/501.
- **Pendiente de Víctor:** pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase › SQL Editor › Run y publicar la web como el 06/10
  (sincronizar, dos rondas de commit + aprobación en `estado.json`,
  `--preview`, `--produccion`). Al sincronizar, `test:web` vuelve a verde.
## 11 de octubre de 2026 · Codex · cierre publicado: cuentas web y Android 1.3.1

Fuente en worktree `codex/cuentas-web-movil`; **no modificar la carpeta
principal**, que está atrasada y conserva material de Academy sin seguimiento.
Commit de contenido **`a213373`** (autor Codex): panel de cuentas Android
1.3.0, aislamiento de sesiones y carreras web, transporte acotado y baja
reautenticada, pruebas, privacidad y cuatro parches compatibles Expo SDK 57.
Fuente Android final en **`53d4c33`**: separación propia positiva de la nota
local, «1 guardado», versión 1.3.1 y dos regresiones; dependencias y motor de
cuentas intactos. El cierre técnico/documental conserva este commit compilado
y la huella web aprobada, sin regenerar ni volver a desplegar contenido web.
**Cierre guardado y sincronizado en `1148323`**: informes, manifiesto,
documentación vigente y QA de APK14; auditor local posterior con árbol limpio,
«LISTO PARA CORTE FINAL» y huellas de contenido/alcance idénticas a las aprobadas.

**Verificado:** `npm test` final salida 0, web 501/móvil 182/SQL de sesión 196;
Chrome aislado 61 y 30, revisión independiente 54 nativos/196 SQL/30 Chrome,
sin otro bloqueo del núcleo. Gitleaks 8.30.1 limpio y `git diff --check` limpio.
Los ensayos usan datos ficticios y no demuestran correo ni un APK instalado.

**En línea:** Víctor introdujo personalmente la contraseña de aplicación de
Gmail; confirmó recepción de alta y enlace válido (llegó a spam). Codex vio
el perfil y comprobó salir. Recuperación pedida a las 08:14:18 UTC y recibida
en INBOX, con DKIM/SPF/DMARC correctos, solo metadatos y sin leer el token.
El cambio final real de contraseña todavía **no se ha realizado**.

La migración `20261011074218_cuentas_sesion_confirmada.sql` **ya se aplicó**
con permiso expreso y se verificó en producción. No reaplicar la 26 sin
rehacer después este refuerzo. El catálogo sigue público (26/49 y 4
descartes), lote del 6/10 vigente hasta el 13/10. El asesor da 0 ERROR,
4 WARN y 3 INFO; límites documentados, no «seguridad absoluta».

**Web publicada y comprobada:** revisión `d91d4e14`, producción `4c7d38e5`,
<https://rwadar.pages.dev>. Las cuentas ya están abiertas; formularios de
acceso/alta y Perfil observados en navegador. HTTP **35/35** y huellas
**64/64** idénticas al artefacto aprobado. Aprobación y QA Android en
`aa886d2`, después del manifiesto `3a0d953`. La fuente web es `a213373`.

**Android autorizado solo sin cargos:** EAS terminó 1.3.0/código 13,
commit compilado `3a0d953`, 85.622.388 bytes. Firma y manifiesto comprobados
localmente; instalación y ejecución del APK exacto aprobadas en emulador API35. Expo Doctor
**21/21** y pruebas **180/180** en copia aislada, nunca sobre las junctions
principales. EAS Free: 2/15 usados y cargos cero. Publicación real
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0>, a las
09:17:18 UTC, QA/release `38127611672` exitoso. La descarga anónima posterior
coincide byte a byte con el APK ensayado y conserva la firma. Evidencia pública
ZIP y sumas verificadas. Flujo publicado en `f01dbc2` y desarmado en `6d4280e`;
README público actualizado en `d045b4c`. No hay publicación en las tiendas.

La revisión visual posterior detectó una nota local que cruzaba el borde del
panel de recuperación. **Corregida, publicada y verificada en 1.3.1/código14**:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
EAS terminó a las 09:36:36 UTC, fuente `53d4c33`, APK **85.622.508 bytes**;
cuota Free posterior Android **3/15**, total **4/30**, cero coste/exceso/addons.
QA y release propias `38129282799`, jobs `114440050549`/`114440579448`,
exitosas; publicación **09:45:05 UTC**, latest pública, no draft/prerelease.
Descarga anónima posterior comprobada: APK y ZIP idénticos a sumas/evidencia,
firma v2 válida y certificado anterior. Resultado propio: separación **92px**,
navegación, catálogo, Academy, favorito persistente y formularios correctos.
Cuatro capturas propias de cuentas revisadas por Codex y otro agente; nota
fuera del borde, singular correcto, sin otro bloqueo visual observado.
No atribuir al APK14 las pruebas históricas del13 ni declarar Auth real desde
Android, SMTP nativo o teléfono físico. Commit público de lanzamiento
`8c49368`; `2f44074` dejó `PUBLICAR_RELEASE=NO` con `[skip ci]`.
El espejo privado queda en NO; plantilla auxiliar no utilizada retirada,
recuperable en Git. Móvil **182/182** y Doctor **21/21** correctos.
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](../VERIFICACION-ANDROID-1.3.1-2026-10-11.md).
La auditoría npm no es limpia: 23 avisos, evaluados sin vía vulnerable
demostrada en el alcance analizado, con inventario estático adicional 1.3.1.
No equivale a descompilar Hermes. No ocultarlos ni forzar downgrades incompatibles.
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

Publicidad, cobros, comisiones, opiniones, comunidad, avisos y manual siguen
apagados. El manual se reserva a usuarios registrados: no publicar un PDF
estático como entrega. Codex asume configuración, código, pruebas y despliegue;
Víctor solo introduce credenciales/identidad y autoriza operaciones reservadas.

Continuar según [`CUENTAS-WEB-MOVIL-2026-10-11.md`](CUENTAS-WEB-MOVIL-2026-10-11.md).
Evidencia en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
Publicación y descarga ya cerradas y comprobadas; queda mejorar entregabilidad
del correo en spam, cambio real de contraseña y entrada posterior, prueba de
Auth nativo con credenciales reales y teléfono físico. Son límites de evidencia,
no tareas de código asignadas a Víctor. No activar monetización, manual ni
tiendas sin cumplir sus requisitos separados. Repetición HTTP final: 35/35.


## 8 de octubre de 2026 · Claude (8) · cuentas fase 1: casi abiertas, falta que Gmail acepte la contraseña

**Rama:** `claude/abrir-cuentas` (sale de `main` tras el PR #10). PR abierto
para que lo revises. **La web pública NO tiene las cuentas encendidas**;
solo la vista previa `https://revision.rwadar.pages.dev`.

### Ya hecho y comprobado

| Qué | Dónde / cómo se comprobó |
|---|---|
| Web: `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`; opiniones, avisos por correo, comunidad, manual y Turnstile siguen apagados | `rwadar-site/assets/rwadar-20260820.js` |
| Privacidad reescrita para cuentas abiertas (7/10/2026): apartado «Tu cuenta (opcional)», correos de confirmación/recuperación por una cuenta de Gmail de RWAdar, sesión solo en memoria, borrado desde Perfil, conservación | `rwadar-site/privacidad.html`, `sitemap.xml` |
| Pruebas: el camino cerrado se sigue probando sobre la misma web con los interruptores apagados (`jsCerrado` en `probar-web.mjs`) | `npm test` en verde |
| Ensayo E2E en Chrome real contra Supabase simulado (PGlite + 26): alta, confirmación, entrar, vigilar, recuperar, móvil, borrar, Turnstile | `node rwadar-app/ensayo-cuentas-web.mjs` → **61/61** (Playwright con `RWADAR_CHROMIUM` = Chrome instalado) |
| Migración 26 + verificador en una transacción | `rwadar-app/db/26_abrir_cuentas_un_paso.sql`; probado en PGlite (dos veces) |
| **Supabase producción:** 26 aplicada (SQL Editor, «Success», verificador sin excepción) | 07/10, 23:3x |
| **Supabase Auth:** SMTP propio activado (remitente y usuario `rwadares@gmail.com`, nombre `RWAdar`, `smtp.gmail.com`, puerto 587); plantillas en español «Confirma tu cuenta de RWAdar» y «Recupera tu acceso a RWAdar» (texto de `REABRIR-CUENTAS.md`); **altas abiertas**; confirmación de correo obligatoria; contraseña mínima 12 (ya estaba); Redirect URLs: añadido `https://revision.rwadar.pages.dev/` | `GET /auth/v1/settings` → `disable_signup:false`, `mailer_autoconfirm:false` |
| Vista previa con cuentas | despliegue `b8745f05`, alias `revision.rwadar.pages.dev`; `comprobar-publicado.mjs` 35/35; aprobación en `estado.json` (commit `e87141c`) |

### Lo que falla ahora (bloqueante)

Al crear una cuenta en la vista previa sale «Error sending confirmation
email». En *Logs › Auth* de Supabase:
1. Primer intento: `535 5.7.8 Username and Password not accepted` (credenciales).
2. Último intento (08/10 00:02): `534 5.7.9 Application-specific password required`.
   Es decir: la verificación en dos pasos de `rwadares@gmail.com` ya está
   activa, pero en *SMTP Settings › Password* sigue la contraseña normal de
   Gmail. Hay que generar una **contraseña de aplicación** en
   https://myaccount.google.com/apppasswords (16 letras, **sin espacios**) y
   pegarla ahí › *Save changes*. Esto solo lo puede hacer Víctor: ni Claude
   ni Codex deben crear credenciales ni escribir contraseñas.

Quedó una cuenta de prueba de Víctor **sin confirmar** en Auth › Users: al
registrarse otra vez con el mismo correo se reenvía la confirmación; si no,
borrarla desde ahí.

### Lo que falta, en orden

1. Víctor: contraseña de aplicación en Supabase (arriba).
2. Prueba real en `https://revision.rwadar.pages.dev`: crear cuenta, recibir
   «Confirma tu cuenta de RWAdar», confirmar, vigilar una plataforma, salir y
   entrar, «He olvidado la contraseña», borrar la cuenta. Si un paso falla,
   el motivo está en Supabase › Logs › Auth (abrir la fila y leer `error`).
3. Publicar en producción desde la rama: `node rwadar-publicar.js --produccion`
   (si sincroniza y ensucia JS/portada/sitemap: commit + nueva aprobación en
   `estado.json` y repetir, como siempre) y comprobar con
   `node .github/comprobar-publicado.mjs https://rwadar.pages.dev`.
4. Supabase › URL Configuration: quitar `https://revision.rwadar.pages.dev/`
   (y valorar quitar `https://rwadar.netlify.app/`, que es solo la página de
   limpieza). Deben quedar solo los de `rwadar.pages.dev`.
5. Unir el PR de `claude/abrir-cuentas` a `main`.
6. Recomendado antes de anunciar cuentas: anti-robots Turnstile (sección
   «Anti-robots» de `REABRIR-CUENTAS.md`: Víctor crea el widget y pega la
   Secret Key en Supabase; la Site Key va al JS, CSP en `_headers` y
   `rwadar-servir.js`, privacidad y pruebas).
7. Gmail no está pensado para envíos masivos (unos cientos al día). A medio
   plazo: dominio propio + Brevo (`REABRIR-CUENTAS.md`, opción B).

### Otros pendientes que no son de cuentas

- **El catálogo vence el 13/10** (lote `a0df3111`). Repetir la revisión antes
  (`docs/CATALOGO-V2-2026-10-06.md`); si no, web y app muestran «Revisión
  pendiente».
- Modo de la sesión de Claude: aun fuera de «Auto», el filtro de Claude bloquea
  pulsar «Run» en el SQL Editor de producción; Víctor tuvo que pulsarlo.

## 7 de octubre de 2026 · Claude (7) · catálogo del 06/10 en producción, web y app 1.2.0 publicadas

- **Supabase:** Víctor pegó `aplicar-y-aprobar.sql` tres veces (SQL Editor).
  Lote vigente **`a0df3111`** (06/10, hasta el 13/10). Sustituye a `36945ee9`
  (cifra principal de mF-ONE y Spiko sin actualizar: el montador buscaba la
  etiqueta en métricas ya cambiadas) y a `c0e20ca3` (texto de Spiko con
  «observado el 30/09»). Cada corrección se probó en PGlite encima de los
  lotes ya aplicados. Comprobado por REST anónimo: 26/49 y contrato de la app.
- **Web:** despliegue de producción `b3fcc32f` desde el ordenador de Víctor;
  `comprobar-publicado.mjs` 35/35 en `rwadar.pages.dev`; mF-ONE 7,58 %,
  Spiko 2,16 % «observado el 06/10/2026», «Última revisión del registro:
  06.10.2026». Sincronizar cambia JS y portada: dos rondas de commit +
  aprobación en `estado.json`, como siempre.
- **Pruebas:** `probar-web.mjs` tenía el reloj de la pestaña simulada fijo
  en el 30/09 y fichas sintéticas de septiembre; ahora se fechan respecto al
  lote incrustado (`fechaLoteEmbebido`, `pestanaCatalogo({ inicio })`).
  Sin esto, cualquier lote nuevo rompía `npm test`.
- **App 1.2.0, versionCode 12:** build EAS `99fd77d8` (la `6c3ed542` murió
  por un fallo del servidor de Expo). APK 85 558 264 bytes, SHA-256
  `87900ef2…b8e3ea`, certificado `f506dea7…` (el de siempre). Probada en
  emulador Android 15 con el flujo nuevo `android-smoke-120.yml` del repo
  `RWAdar-downloads` (run 37446968987: Inicio, Buscar 24/21/4, Spiko 2,16 %,
  Academy 7 lecciones, Perfil; sin errores). Release `v1.2.0` marcada como
  latest; `/android` lleva a ella y la descarga anónima coincide byte a byte.
- `gh` instalado en el ordenador de Víctor (cuenta victorJorques, con
  permiso `workflow`).

## 6 de octubre de 2026 · Claude (6) · revisión nueva del catálogo, app 1.2.0 compilando

**Rama:** `claude/revision-catalogo-2026-10-06` (sale de `claude/publicar-2026-10-05`,
PR #9 aún sin unir). **Nada aplicado en Supabase todavía.**

- **Revisión del 06/10** (lote `36945ee9`, vigente hasta el 13/10): 70 fuentes
  del radar y 49 fichas consultadas de nuevo; mismo manifiesto 26/49 (24/21/4).
  Detalle y criterios en `docs/CATALOGO-V2-2026-10-06.md`. No se alargó la
  vigencia de la anterior (la base limita a 7 días y la app instalada también).
- **Para publicarla:** pegar `rwadar-app/data/importaciones/catalogo-2026-10-06-v2/aplicar-y-aprobar.sql`
  entero en Supabase › SQL Editor › Run, **después de las 02:00 de España**
  (Supabase va en UTC; antes falla a propósito y no cambia nada). Importa y
  aprueba en una transacción y se deshace si el lote no queda publicable.
  Después: `rwadar-publicar.js --preview` (sincroniza; habrá que commitear JS
  y portada y reaprobar en `estado.json` dos veces, como el 5/10), comprobar
  y `--produccion`.
- Comprobado: `node -r <reloj+3h> rwadar-app/comprobar-revision-2026-10-06.mjs`
  aplica ese mismo SQL sobre la cadena de producción en PGlite: 26/49, 9 fichas
  con cifras el 06/10, caduca el 14/10. `npm test` en verde. Sin el reloj
  adelantado se ejecuta tal cual a partir de las 02:00 del 06/10.
- **App 1.2.0, versionCode 11:** build EAS `6c3ed542-aa13-45c6-9e4d-9c4dbd144cf9`
  (perfil `editorial`, misma clave), lanzada desde el ordenador de Víctor;
  estaba en cola. Falta: descargar APK, comprobar firma/huella, probar en un
  móvil real y publicarlo como release `v1.2.0` en `RWAdar-downloads`
  (`/android` apunta a `releases/latest`). `gh` no está instalado: hacerlo
  desde el Chrome de Víctor.
- Pendiente de Víctor: «Merge» en el PR #9 y en el de esta rama.

## 5 de octubre de 2026 · Claude (5) · web publicada en producción desde el ordenador de Víctor

- **Publicado** con `rwadar-publicar.js --produccion` desde una copia limpia
  de `main` (`23f9faf`) en el ordenador de Víctor, con su sesión de
  Wrangler (cuenta `52d07be0…`). Despliegue `cbe0aa77`; antes, preview
  `a060c69e` (alias `revision.rwadar.pages.dev`). Ya no hace falta el
  secreto `CLOUDFLARE_API_TOKEN` para esta publicación, aunque sigue
  pendiente para publicar desde GitHub.
- La sincronización con Supabase cambió dos archivos, igual que el 2/10:
  `eee89fc` (catálogo en el JS: 10 fichas del 30/09 con vigencia de 1 día
  pasan a «Cifras pendientes de nueva revisión») y `e320b21` (portada
  pre-renderizada). Aprobaciones en `589be2c` y `4e06d9e`, por orden expresa
  de Víctor en el chat.
- Comprobado: `npm test` en verde; `.github/comprobar-publicado.mjs` 35/35
  sobre la preview y sobre `https://rwadar.pages.dev`; en Chromium móvil, la
  barra Inicio · Buscar · Academy · Perfil cambia de panel, Academy muestra
  «0 de 7 lecciones leídas», Perfil muestra «Cuentas en pausa»; consola sin
  errores; cabeceras (CSP, HSTS, X-Frame-Options DENY, nosniff) presentes;
  `/.git/config`, `/package.json`, `/.env` y el código fuente dan 404;
  barrido de secretos de `rwadar-publicado/` sin coincidencias.
- **Cuentas: siguen en pausa.** Para abrirlas faltan los pasos 1 a 3 de
  `docs/tareas/REABRIR-CUENTAS.md` (SMTP, ajustes de Auth y SQL 26), que
  solo puede hacer Víctor.
- **Ojo:** el lote del catálogo vence el 5/10 inclusive; a partir del 6/10
  la web lo enseña con «Revisión pendiente» hasta que haya revisión nueva.

## 5 de octubre de 2026 · Claude (4) · #6 y #7 unidos, manual corregido, anti-robots preparado

- **PR #6 unido a `main`** (`ecba31e`): comunidad apagada, app 1.2.0, flujo
  «Compilar app Android» y tu mejora de tarjetas. CI verde (pruebas + gitleaks).
  `main` es idéntico a lo aprobado en `estado.json` (`70b2346`).
- **Publicar sigue bloqueado por la clave**: lancé «Publicar web» (preview)
  desde `main` y se paró en «Comprobar que existe la credencial de
  Cloudflare» (run 37311901615). No se tocó nada en línea. La aprobación
  caduca el 7/10.
- **Manual de Eric corregido** (sin tocar el original):
  `docs/manual/corregir-manual.py` → `RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`.
  Página 9: lista de vigilancia hoy, guías y avisos «próximamente», Academy
  con 7 lecciones. Página 7: el checklist «llegará próximamente». Las demás
  páginas salen idénticas píxel a píxel. Falta el visto bueno de Eric; se
  enciende con las cuentas (`docs/manual/LEEME.md`).
- **Anti-robots (Turnstile), apagado**: `TURNSTILE_SITEKEY=''` en el módulo
  `Cuenta`. Encendido, alta, entrada con contraseña, recuperación y reenvío
  piden un testigo nuevo cada vez y lo mandan como
  `gotrue_meta_security.captcha_token` (formato comprobado en
  `@supabase/auth-js`). El script de Cloudflare solo se carga al pedir algo
  a Auth. Caja `#cuentaRobot` en la ventana de cuenta. Para encenderlo hay
  que tocar CSP, pruebas y privacidad: pasos en
  `docs/tareas/REABRIR-CUENTAS.md`, «Anti-robots». Ensayo, sección 11, con
  Turnstile y Supabase de mentira: alta, reenvío y entrada con testigos
  distintos, bloqueador que impide cargarlo, y Supabase que lo exige sin
  que la web lo lleve.
- **Fallo real arreglado** gracias al ensayo, que fallaba 1 de cada 3
  vueltas. Al abrir la ventana de cuenta, un temporizador de 60 ms movía el
  cursor a «Correo» aunque ya se estuviera escribiendo en «Contraseña», y la
  clave acababa en el campo del correo (`correo=[ana@ejemplo.testuna clave…]`).
  Ahora no mueve el cursor si ya hay un campo de la ventana activo. El ensayo
  también espera ya a que la lista de la comunidad se refresque.
- **Segundo fallo, del propio anti-robots, arreglado antes de salir**: si se
  cerraba la ventana mientras cargaba Turnstile, la entrada cancelada se
  enviaba igual en segundo plano. `antiRobots`/`conAntiRobots` comprueban
  ahora `operacionCuenta` tras cargar y tras el testigo.
- Pruebas: web 501, `rwadar-app` completo, móvil 126, QR, tools; ensayo en
  el navegador 61/61, repetido varias veces seguidas.

## 5 de octubre de 2026 · Claude (3) · comunidad preparada y app lista para compilar

- **Comunidad** (apagada, `PUBLICACIONES_REMOTAS=false`): `rwadar-app/db/27_comunidad.sql`
  + `27_comunidad_cerrar.sql`. Una publicación por cuenta y día de España
  (`unique (usuario_id, dia)`), 10–500 caracteres, sin enlaces (CHECK), autor
  «Miembro de RWAdar» salvo que elija su nombre, lectura pública solo de
  `id, autor, texto, creada_el`, escritura solo por RPC (`publicar`,
  `mis_publicaciones`, `borrar_mi_publicacion`, `denunciar_publicacion`,
  `moderar_publicacion`, `cola_publicaciones`), tres denuncias la ocultan.
  Prueba `probar-comunidad.mjs` 30/30 (en `npm test`). Web: módulo
  `Comunidad` (`comunidad:inicio/fin`) en Inicio, escucha el evento
  `rwadar:sesion` que lanza `Cuenta.pinta()`. Ensayo en el navegador 48/48.
  Moderación por SQL documentada en `docs/tareas/REABRIR-CUENTAS.md`.
- **App 1.2.0** y flujo manual `.github/workflows/compilar-app.yml` (pruebas →
  EAS → artefacto con SHA-256). Necesita el secreto `EXPO_TOKEN`
  (`rwadar-movil/LEEME.md`, «Compilar desde GitHub»).
- Pruebas: web 407, `rwadar-app` completo, móvil 104, tools y QR.
- **Tu mejora de tarjetas (`mejora-tarjetas-local`) está integrada** en esta
  rama: tarjeta nueva + botón «☆ Guardar», pruebas adaptadas (web 499, móvil
  126). `lib/config-ios-uuid-seguro.js` se conserva con sus pruebas pero se
  quitó de `app.json`: choca con `scripts/parchear-expo-uuidv5.cjs` (mismo
  archivo, huella distinta) y rompería la build de iOS. Hay que elegir uno.

## 5 de octubre de 2026 · Claude (2) · nueva barra: Inicio · Buscar · Academy · Perfil

**Rama:** `claude/zealous-shannon-endwcn` (reiniciada desde `main` tras unir
#4). Petición de Víctor: reorganizar la barra del móvil y dejar los avisos
como «próximamente». No toca producción, Supabase ni EAS.

### Web (móvil; el escritorio no cambia)

- Pestañas `inicio` · `buscar` · `academy` · `cuenta` (rótulo «Perfil»). Con
  JavaScript el móvil abre en Inicio salvo que la URL traiga ancla; sin él se
  ve Buscar (`movilPanelRadar` no lleva `hidden`, como el escritorio).
- **Inicio** (`movilPanelInicio`): presentación, atajos, noticias generadas
  (marcas `<!--noticias:ini-->`), Comunidad «próximamente» (una publicación al
  día por cuenta cuando haya cuentas) y Método/Fuera/3D.
- **Academy** (`movilPanelAcademy`): en el móvil se **mueve** el bloque real
  `.academia-lecciones` de la portada (con ancla para devolverlo en
  escritorio) y se cuenta lo leído con la clave `rwadar.academy.v1`.
- **Perfil** (`movilPanelMas`): tarjeta de cuenta (en pausa), empresas y
  ofertas guardadas, Avisos «llegarán próximamente a la app» con la vía para
  retirar un consentimiento anterior, privacidad, sonido, borrar guardados,
  CSV y contacto. Desaparecen Favoritos, Inversiones y la subvista de Avisos
  (su JS queda inerte: sin esos nodos no hace nada).
- **Favoritos locales**: módulo `Favoritos` (`favoritos-locales:inicio/fin`,
  al principio del JS porque las tarjetas se pintan antes), clave
  `rwadar.favoritos.v1` (nombres de empresa y slugs de oferta). Botón
  «Guardar en favoritos» en la ficha (cuando no hay cuentas) y «☆ Guardar» en
  las tarjetas de oferta; solo visibles en el móvil (`.fav-local`).
- Privacidad actualizada (5/10/2026) y `sitemap.xml`.

### Noticias

Fuente única `rwadar-noticias/noticias.json` → `rwadar-noticias.js` escribe
el bloque de Inicio de la web y `rwadar-movil/lib/noticias-contenido.js`.
`--comprobar` en `test:tools`; `rwadar-publicar.js` bloquea si no está al día;
añadido a `RUTAS_CONTENIDO_APROBADO`. **Ojo:** la noticia «RWAdar Academy ya
está abierta» lleva fecha 5/10; si se publica otro día, cambia la fecha.

### App (necesita versión nueva para llegar a los móviles)

- `Navegacion.js`: Inicio · Buscar · Academy · Perfil (iconos nuevos; insignia
  de guardados en Perfil).
- `componentes/Inicio.js` nuevo. Buscar = selector «Empresas | Ofertas» sobre
  las dos listas de siempre. Academy pasa de modal a pestaña (`onCerrar`
  opcional). `PantallaPerfil` sustituye a «Más», «Siguiendo» y «Avisos»: en
  modo editorial enseña «Avisos · próximamente»; con la capacidad remota
  vuelve a usar `PanelAvisos`.
- Ofertas guardadas en el dispositivo (`ofertasGuardadas`,
  `alternarOfertaGuardada`, clave `…ofertas.guardadas.v1`, borrada con el
  resto) y estrella en `DetalleOferta`.

### Pruebas

Web 406, `rwadar-app` completo, móvil 104, tools, QR y ensayo de cuentas 37.
Capturas reales en Chromium (web móvil y app exportada con react-native-web).

## 5 de octubre de 2026 · Claude · cuentas (fase 1) preparadas, manual, seguridad

**Rama:** `claude/zealous-shannon-endwcn`. **No toca producción:** nada
publicado, nada aplicado en Supabase, sin EAS. Todo lo nuevo queda apagado.

### Qué hay

| Pieza | Dónde |
|---|---|
| Migración de reapertura, fase 1: perfil, vigilancia, baja y fecha de descarga del manual. Opiniones, moderación, dispositivos y push siguen cerrados | `rwadar-app/db/26_reabrir_cuentas.sql` + `_verificar.sql`; marcha atrás = reaplicar 25 |
| Prueba sobre la cadena de producción (01-22, 24, 25, catálogo) | `rwadar-app/probar-reabrir-cuentas.mjs` (36/36), dentro de `npm test` |
| Ensayo E2E en Chromium: la web real con cuentas encendidas en memoria contra un Supabase simulado sobre PGlite + 26 | `rwadar-app/ensayo-cuentas-web.mjs` (37/37; necesita Playwright, no está en `npm test`) |
| Web: interruptores separados `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` (todos apagados, igual que `SERVICIOS_USUARIO_REMOTOS` y `CORREO_AUTH_E2E`) | `rwadar-site/assets/rwadar-20260820.js` |
| Dos fallos corregidos que solo salían con cuentas abiertas: botón de cuenta del móvil siempre desactivado; botón «Entrar» bloqueado tras «Confirma tu correo» | mismo archivo; pruebas fijas en `probar-web.mjs` |
| Textos de cuenta sin promesas de opiniones mientras estén cerradas (etiqueta del nombre, aviso legal del alta, subtítulo) | `rwadar-site/index.html` |
| Manual de bienvenida de Eric (PDF original, revisión y cómo encenderlo). **Sección 8 promete avisos y guías por correo que no existen; la 6 remite a un checklist que no tenemos** | `docs/manual/` |
| Pasos de Víctor para abrir cuentas (SMTP, Auth, SQL, prueba real) | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| Pasos exactos para crear la clave de Cloudflare | `docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub» |

Academy «ENTREGA_WEB_1_2»: las 9 lecciones son idénticas byte a byte a la
entrega del 2/10 (commit `5cecbb8`); no hay nada nuevo que montar.

### Pruebas

`npm test` por partes en verde: web 405, `rwadar-app` completo (incluida la
nueva), móvil 101, tools y QR. Gitleaks sobre 74 commits: 10 avisos, todos
falsos (detalle en la revisión de seguridad).

### Pendiente (de Víctor)

1. Secreto `CLOUDFLARE_API_TOKEN` en GitHub → Claude publica (la aprobación
   caduca el 7/10).
2. Pasos 1 a 3 de `REABRIR-CUENTAS.md` → Claude enciende cuentas en
   `revision`, Víctor prueba, se reescribe la privacidad y se publica.
3. Eric: corregir la sección 8 del manual y enviar el Checklist de
   Elegibilidad.

---

## 2 de octubre de 2026 · Claude · RWAdar Academy en la web y en la app

**Rama:** `claude/zealous-shannon-endwcn`, commit «feat(academy): …». No toca
producción: ni web publicada, ni Supabase, ni EAS.

Víctor pasó la entrega de Eric (`RWAdar_Academy_ENTREGA_WEB`): 9 lecciones en
Markdown y una especificación. Está montada en la web y en la app.

### Qué hay

| Pieza | Dónde |
|---|---|
| Fuente única: las 9 lecciones tal cual, `academy.json` (qué se publica, niveles, destinos de los botones) y el aviso legal común | `rwadar-academy/` (léete su `LEEME.md`) |
| Generador: valida las lecciones y escribe web + app; `--comprobar` no escribe | `rwadar-academy.js` |
| Web: índice `/academy/` y una página por lección publicada (TL;DR, índice lateral, recuadros, test con explicación, siguiente paso, aviso legal, progreso en `localStorage`) | `rwadar-site/academy/`, `assets/academy-20261002.{css,js}` |
| Portada: bloque de lecciones (entre `<!--academy:ini-->` y `<!--academy:fin-->`), enlace «Academy» en cabecera y pie, ancla `#comparador` | `rwadar-site/index.html` |
| App: pantalla nativa (Más › RWAdar Academy y aviso en el radar), test, progreso en el dispositivo | `rwadar-movil/componentes/Academy.js`, `lib/academy-contenido.js` (generado), `lib/academy-progreso.js` |
| Revisión del contenido y decisiones | `docs/academy/REVISION-CONTENIDO-2026-10-02.md` |

**Publicadas:** lecciones 1–6. **Próximamente:** 7 (sus «cuatro criterios» no
coinciden con el Método), 8 y 9 (calendario de Eric). Evaluador de Viabilidad
y checklist del expediente: «Próximamente», nunca enlace roto.

### Cambios en piezas existentes

- `rwadar-publicacion-segura.js`: `PAGINAS_ACADEMY` (lista cerrada) dentro de
  `ARCHIVOS_PUBLICABLES`, más los dos assets; `rwadar-academy` y
  `rwadar-academy.js` añadidos a `RUTAS_CONTENIDO_APROBADO`.
- `rwadar-publicar.js`: `PAGINAS_HTML` común (CSP estricta y assets con
  huella también en la Academy) y bloqueo si la Academy no está al día o no
  coincide con `PAGINAS_ACADEMY`.
- `rwadar-servir.js`: URL limpias `/academy/…` como en Cloudflare.
- `_headers` (`/academy/*` sin caché), analítica (mide `/academy/…` limpias),
  `sitemap.xml` (solo lo publicado).
- **`privacidad.html`**: dice que el progreso de la Academy se guarda en el
  navegador o en el dispositivo y no se envía. Fecha de revisión → 2/10/2026.
  En la app, «Borrar datos del dispositivo» también borra el progreso.
- Pruebas antiguas ajustadas: la «videoteca» ya no existe, y dos pruebas de
  `rwadar-app` contaban apariciones de nombres de página en el publicador.

### Pruebas

- `npm test` completo en verde: web 394 (48 nuevas de la Academy), app 101
  (8 nuevas, una pinta las 6 lecciones con react-native-web) y todas las de
  `rwadar-app`.
- Chromium real, web en escritorio y móvil: sin desbordamiento horizontal,
  test corrige y abre las explicaciones, «Marcar como leída» sobrevive a
  recargar y se ve en el índice, sin errores de consola.
- App exportada a web (copia aislada con datos locales, sin Supabase):
  índice, lección, test, tabla con desplazamiento, aviso reforzado, botón al
  radar y progreso tras recargar.

### Cierre del 2 de octubre (petición de Víctor)

- **Lección 7 publicada** (7 de 9). `PAGINAS_ACADEMY` ya la incluye.
- **Revisión legal:** Víctor la ha verificado; las nueve lecciones dicen
  2 de octubre de 2026.
- **Lectura:** letra mayor, más interlineado y gris más claro en web y app;
  cursiva real de Geist en la app.
- **Tipografía de toda la web arreglada:** la Geist incrustada en
  `rwadar-20260820.css` era solo el recorte «latin-ext» (sin a-z), así que la
  web se veía con la letra del sistema. Ahora es el paquete oficial `geist`
  1.7.2 recortado a latín (22 kB sans, 16 kB mono; la Academy lleva además
  la cursiva). Comprobado en Chromium: el 100 % del texto sale en Geist.
- **Aprobación registrada** en `estado.json` (commit propio) y **unido a
  `main`** con merge commit (PR #1); la auditoría sobre `main` da «LISTO PARA
  CORTE FINAL». Desde la nube de Claude no hay red ni credenciales de
  Cloudflare: la subida la hace Víctor o Codex en local (`git pull`,
  `--preview`, comprobar y `--produccion`).

### Pendiente

1. ~~Decidir con Eric los criterios y las funciones prometidas.~~ **Hecho**
   por petición de Víctor (tercer commit): las lecciones usan los cuatro
   criterios del Método y anuncian como «próximamente» el Evaluador, los
   filtros por categoría y por supervisión y la checklist. Detalle en
   `docs/academy/REVISION-CONTENIDO-2026-10-02.md`. La lección 7 ya se
   podría publicar (solo espera al calendario).
2. **Para publicar la web (con permiso de Víctor):** registrar la aprobación
   en `estado.json` (la auditoría dirá que el contenido cambió), `--preview`,
   comprobar `/academy/`, `--produccion`.
3. **App:** entra en la próxima compilación; subir versión al compilar.
4. ~~Cabecera compacta de la PWA móvil que solapaba «RWAdar» con el título.~~
   **Arreglado** en un segundo commit: los laterales de la rejilla ya no
   pueden medir menos que la marca y los botones, el título es lo único que
   cede (con «…»), la marca se aprieta un poco por debajo de 350 px y el
   título de la subvista pasa a «Academy». Medido en 320, 360, 390 y 430 px
   en Buscar, Academy, Método, Fuera, Favoritos, Inversiones y Mi cuenta:
   ningún solape. En la app nativa, «PRÓXIMAMENTE» ya no se parte en dos
   líneas a 320 px y las tarjetas anterior/siguiente dicen «← LECCIÓN 1».

---

## 1 de octubre de 2026 · Claude (2) · catálogo siempre disponible

Víctor se quedó sin créditos de Codex y pidió a Claude que siguiera. Regla
nueva de Víctor: **el catálogo tiene que estar siempre disponible para el
público, salvo que él diga lo contrario.** He hecho la tarea
[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md) con esa
regla ampliada.

### Qué hace ahora

| Situación | Antes | Ahora |
|---|---|---|
| La revisión vence (7 días) | Web y app vacías | Se ve la última copia completa con el aviso «Revisión pendiente» |
| Cifras de una oferta vencidas | Ocultas | Ocultas (sin cambios) |
| Supabase responde vacío o incompleto | Web y app vacías | Se conserva la última copia completa con el aviso «No hemos podido comprobar…» |
| Revisión incompleta, futura o mezclada | No se publica | No se publica (sin cambios); nunca se vuelve a una anterior |
| Víctor quiere quitar el catálogo | No había forma clara | `public.catalogo_publicacion.retirado = true` (ver `RUNBOOK.md`) |

### Qué he cambiado

- **Base:** `rwadar-app/supabase/migrations/20261001150000_catalogo_siempre_disponible.sql`.
  - Políticas nuevas `*_de_revision_publicada_v2`: se puede leer la revisión
    del puntero `publicacion_v2` aunque haya vencido.
  - `revision_publicable_v2`: igual que antes, salvo que ya no exige
    vigencia.
  - Tabla `public.catalogo_publicacion`: es la orden expresa. Un disparador la
    activa al retirar la revisión publicada y la desactiva al aprobar otra.
  - **Las vistas públicas no cambian de columnas:** la web y el APK de hoy
    rechazan un lote caducado igual que antes.
- **Contrato compartido:** `validarLotePublicoV2(..., { permitirCaducado })`
  en `rwadar-movil/lib/contrato-catalogo.js`. Por defecto se comporta como
  antes; con la opción devuelve `caducado`.
- **Web** (`rwadar-site/assets/rwadar-20260820.js`, `index.html`, `.css`):
  - La caducidad ya no vacía nada. `alDia` consulta además
    `/catalogo_publicacion` y solo `retirado === true` oculta el catálogo.
  - Una vista vacía, incompleta o un lote fuera de contrato conservan la copia
    embebida o la descargada antes, con aviso.
  - Avisos nuevos: `#avisoCatalogoRadar` y `#avisoCatalogoOfertas`. El pie y
    el contador dicen «pendiente de renovar».
- **App** (`lib/catalogo-remoto.js`, `App.js`):
  - Al vencer se recarga en lugar de borrar.
  - Ya caducado, se refresca una vez al día (`programarRevisionDiaria`) para
    ocultar las cifras que vayan venciendo.
  - Solo la orden expresa borra la caché.
- **Publicación:** `sincronizar.js` admite un lote V2 caducado y avisa por
  pantalla. Así se puede publicar aunque la revisión haya vencido.

### Pruebas

- Nueva: `rwadar-app/probar-catalogo-siempre-disponible.mjs` → 29/29 contra
  PGlite. Cubre vigente, caducada, nueva revisión, incompleta, futura,
  retirada, reaprobación, orden manual y permisos.
- Web: 346/346. Las pruebas de caducidad ahora exigen que todo siga visible
  con aviso. Hay pruebas nuevas de la orden expresa y de una base antigua sin
  la tabla. Las 4 consultas anónimas están vigiladas.
- App: 93/93. Las pruebas de «retira la caché» ahora exigen que la conserve,
  y hay pruebas nuevas de la orden expresa, de una base antigua y de la
  revisión diaria.
- `npm test` completo en verde.
- Navegador real (Chromium) con la fecha fijada en el 10/10/2026 y Supabase
  caído: 26 plataformas, 49 referencias y el aviso visible, en escritorio y
  en móvil.

### Para ponerlo en producción (Víctor o Codex, con permiso de Víctor)

1. **Primero la migración** en el editor SQL de Supabase. Después del 5/10 es
   imprescindible: sin ella, Supabase devuelve las vistas vacías y la
   sincronización no puede publicar.
2. Registrar la aprobación (commit y huellas en `estado.json`, paso 2 de
   `docs/OPERACION-LANZAMIENTO.md`). La compuerta lo pide porque cambia
   `rwadar-site`, `sincronizar.js` y `contrato-catalogo.js`.
3. `--preview`, comprobar, y `--produccion`.
4. App: entra en la próxima compilación (no hay OTA).

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. ~~Unir esta rama a `main`.~~ Hecho el 1 de octubre: `main` incluye todo.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.

# Notificaciones sin cuenta · contrato de la base y del servidor (14/11/2026)

Encargo de la dirección (14/11/2026): «que salga tanto en iPhone como en
Android; muy importante que funcionen las notificaciones y los avisos aunque
no tengan cuenta o no hayan iniciado sesión: que puedan activarlas».

Este documento es el contrato entre la **parte 1** (base y servidor, ya
hecha en la rama `avisos-sin-cuenta`) y la **parte 2** (web, app y textos
legales). Todo lo que la web y la app necesitan saber está aquí.

**Estado:** nada publicado ni aplicado. La parte 2 (web, app y legal) también
está hecha en la misma rama (abajo, «Parte 2»). La migración 36 está escrita y
probada en local (PGlite); el servidor de la web tiene las rutas nuevas con
su interruptor **encendido en el código**. La base nace **apagada**: mientras
no se lance `activar-sin-cuenta`, el servidor contesta «apagado» y la web y
la app tienen que decir con calma que «todavía no está disponible».

## Decisiones ya tomadas por la dirección

- El texto del permiso dice «Solo para mayores de 18 años», igual que con
  cuenta. No se comprueba nada más.
- Los interruptores de la **web**, del **servidor** y de la **app** quedan
  **encendidos** en el código. La base nace apagada y se enciende aparte con
  `activar-sin-cuenta`.
- La cabecera secreta opcional entre el servidor y la base **no se hace
  ahora**: las funciones de la base son la barrera de verdad (cupos, forma,
  versión, interruptor). **Antes de `activar-sin-cuenta` hay que volver a
  decidirlo sabiendo esto** (revisión del 14/11): la clave publicable va en
  la web, así que cualquiera puede llamar a la base sin pasar por el
  servidor. Con 300 altas falsas por hora agota el cupo de todos (la gente
  de verdad ve «cupo») y en unas 17 horas llena los 5 000 navegadores
  («lleno»). Para acotar el daño, la web tiene su propio máximo (5 000) y un
  tope de 30 000 notificaciones web sin cuenta en 24 horas (el cupo gratis de
  Cloudflare es de 100 000 al día; si se agota, la Academy sale sin pedir
  cuenta), y el verificador 36 avisa si el cupo de una hora se llenó. Lo que
  lo cierra de verdad es la cabecera secreta (un secreto nuevo en Cloudflare
  y en Vault). Es la condición S5 del anexo.

## El texto del permiso (versionado)

La web y la app lo piden a `GET /api/avisos/texto` y lo enseñan **tal cual**
junto al botón, en el idioma de la persona. Cambiar una sola palabra obliga a
una versión nueva (en la base, reaplicando la 36 con el texto nuevo).

- **Versión:** `sin-cuenta-v1-2026-11-14`
- **Castellano:** Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.
- **Inglés:** I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It's optional and doesn't need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.

El alta lleva la `version` que se enseñó y el `idioma` (`es` o `en`) en que
se enseñó: así queda en el historial qué texto exacto se aceptó.

## La API del servidor de la web

Origen: el mismo de la página (`https://rwadar.pages.dev`, o la revisión).
La app de Android llama a `https://rwadar.pages.dev`.

### Reglas comunes

- **Sin sesión y sin cookies.** El servidor no lee ni escribe ninguna cookie
  y llama a Supabase solo con la clave publicable. No hace falta (ni sirve)
  mandar credenciales.
- **Origin:** si llega, tiene que ser el mismo origen; si no llega (la app
  nativa no lo manda), se admite. `sec-fetch-site: cross-site` da 403.
- **POST:** `Content-Type: application/json`, como mucho **4 kB**, un objeto
  JSON con **exactamente** las claves de esa acción (ni una más ni una menos).
- **GET:** sin parámetros en la dirección (con `?` da 400).
- Las respuestas son siempre JSON. Los POST van con
  `Cache-Control: private, no-store`; los GET buenos, con
  `Cache-Control: public, max-age=60` (el servidor también los guarda 60 s).

### `GET /api/avisos/texto`

```json
200 {"v": 1, "activo": true, "version": "sin-cuenta-v1-2026-11-14",
     "texto": {"es": "Quiero recibir…", "en": "I want to receive…"},
     "clavePublica": "B…(87 caracteres)"}
```

- `activo`: `true` solo si se puede activar ahora (interruptor sin cuenta de
  la base, push encendido, clave VAPID creada y el interruptor del servidor).
  Con `false`, enseñar «Todavía no está disponible» y no pedir permisos.
- `clavePublica`: la `applicationServerKey` para `pushManager.subscribe`
  (la misma de las cuentas). Puede ser `null`.
- Sin la migración 36 en la base: `{"v":1,"activo":false,"version":null,"texto":null,"clavePublica":null}`.
- `503 {"error":"servicio_no_disponible"}` o `{"error":"configuracion_pendiente"}`, con `Retry-After: 30`.

### `GET /api/avisos/recientes`

```json
200 {"v": 1, "avisos": [{"id": "7", "tipo": "novedad", "titulo": "…", "texto": "…",
     "enlace": "https://rwadar.pages.dev/…", "creado_el": "2026-11-14T12:00:00+00:00"}]}
```

Los anuncios publicados de los últimos 90 días, del más nuevo al más viejo,
como mucho 20, sin la bienvenida (es de las cuentas). `tipo` es `ofertas`,
`actualizacion` o `novedad`; `creado_el`, la fecha de publicación (las mismas
claves que `mis_avisos_recientes` de las cuentas). Es lo que enseña
`?avisos=1` sin sesión. Sin la 36: `{"v":1,"avisos":[]}`. Fallo: 503.

### `POST /api/avisos/web` (un navegador)

| acción | cuerpo (claves exactas) | respuesta buena |
|---|---|---|
| `alta` | `{"accion":"alta","endpoint","p256dh","auth","version","idioma","origen"}` | `200 {"ok":true,"estado":"activa","nueva":true\|false}` |
| `baja` | `{"accion":"baja","endpoint","auth"}` | `200 {"ok":true,"borrada":true\|false}` |
| `estado` | `{"accion":"estado","endpoint","auth"}` | `200 {"ok":true,"activa","vigente","servicio"}` |

- `endpoint`, `p256dh` y `auth` son los de `PushSubscription.toJSON()`
  (`keys.p256dh` y `keys.auth`). Se admiten en base64url o base64 con `+/` y
  relleno `=`: el servidor los pasa a base64url.
- `endpoint`: `https://` y solo de los servicios de push conocidos, como mucho
  2048 caracteres:
  `^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$`
- `p256dh` (base64url): `^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$`;
  `auth` (base64url): `^[A-Za-z0-9_-]{21}[AQgw]$`.
- `version`: la de `/api/avisos/texto` que se enseñó
  (`^[a-z0-9][a-z0-9.-]{2,79}$`). `idioma`: `es` o `en`. `origen`: dónde se
  activó: `novedades` (el recuadro de la ventana de novedades), `perfil`
  (Perfil › Avisos) o `avisos` (la lista de avisos, `?avisos=1`).
- **La clave `auth` hace de llave:** solo el navegador y RWAdar la conocen.
  La baja y el estado la exigen; con otra, contestan `borrada:false` y
  `activa:false`. Un alta con la misma dirección y otra `auth` se rechaza
  (`en_uso`).
- `nueva:false` = era una renovación (no gasta cupo). `estado`: `activa` =
  está dada de alta; `vigente` = con la versión actual del texto (si es
  `false`, volver a pedir el alta con la versión nueva, enseñando el texto
  nuevo); `servicio` = ahora se envía.
- **Renovar:** al abrir la web con el permiso dado, `estado` y, si sigue
  activa, `alta` otra vez como mucho cada 12 horas. La base borra a los 180
  días sin renovar.

### `POST /api/avisos/movil` (la app de Android)

| acción | cuerpo (claves exactas) | respuesta buena |
|---|---|---|
| `alta` | `{"accion":"alta","token","plataforma":"android","version","idioma","origen"}` | `200 {"ok":true,"estado":"activa","nueva":true\|false}` |
| `baja` | `{"accion":"baja","token"}` | `200 {"ok":true,"borrada":true\|false}` |
| `estado` | `{"accion":"estado","token"}` | `200 {"ok":true,"activa","vigente","servicio"}` |

- `token`: el de Expo, `^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$`.
- `plataforma`: solo `android` (no hay app de iPhone; en iPhone, la web
  añadida a la pantalla de inicio).
- Renovar una vez al día al abrir la app; si el permiso del sistema se quitó,
  `baja`.

### Lo que no sale bien

| estado HTTP | cuerpo | qué pasa y qué enseñar |
|---|---|---|
| 409 | `{"ok":false,"error":"apagado"}` | La base no admite altas ahora (apagada, push apagado o sin la 36). «Todavía no está disponible.» |
| 409 | `{"ok":false,"error":"version"}` | El texto cambió: volver a pedir `/api/avisos/texto` y enseñarlo. |
| 409 | `{"ok":false,"error":"en_uso"}` | Esa dirección está dada de alta con otra clave: quitar la suscripción del navegador, crear otra y repetir. |
| 409 | `{"ok":false,"error":"lleno"}` | Se llegó al máximo total. «Ahora no se puede; inténtalo más tarde.» |
| 429 | `{"ok":false,"error":"cupo"}` + `Retry-After: 900` | Demasiadas altas nuevas en la última hora (cupo de la base). |
| 429 | `{"ok":false,"error":"intentos_excedidos"}` + `Retry-After` | Límite por visitante del servidor. |
| 404 | `{"ok":false,"error":"no_disponible"}` | El interruptor del servidor está apagado (solo el alta). |
| 400 | `{"ok":false,"error":"solicitud_invalida"}` | Cuerpo, claves o forma no válidos. |
| 413 | `{"ok":false,"error":"solicitud_excesiva"}` | Más de 4 kB. |
| 403 | `{"ok":false,"error":"origen_no_permitido"}` | Otro Origin o `sec-fetch-site: cross-site`. |
| 405 | `{"ok":false,"error":"metodo_no_permitido"}` + `Allow` | GET en las de cambiar o POST en las de leer. |
| 404 | `{"ok":false,"error":"ruta_no_permitida"}` | Otra ruta bajo `/api/avisos/`. |
| 503 | `{"ok":false,"error":"servicio_no_disponible"}` o `"configuracion_pendiente"` + `Retry-After: 30` | Supabase no responde o respondió algo raro. Reintentar más tarde. |

La **baja** y el **estado** funcionan siempre, también con todo apagado.
Sin la 36 en la base, la baja contesta `{"ok":true,"borrada":false}` y el
estado `{"ok":true,"activa":false,"vigente":false,"servicio":false}`.

### Límites por visitante (servidor, cada 10 minutos)

Altas 20, bajas 60, estados 120 (por IPv4 o por /64 de IPv6). Son de mejor
esfuerzo: viven en la memoria de cada instancia. Una petición mal formada no
gasta cupo. Los GET no tienen límite (salen de la memoria).

## Lo que llega al móvil

- **Web:** exactamente lo mismo que con cuenta: la carga
  `{"v":1,"titulo","texto","url":"https://rwadar.pages.dev/?avisos=1","etiqueta":"rwadar-<id>"}`
  (`#emisiones` detrás para las ofertas), cifrada y firmada por
  `/api/interno/webpush`. `sw.js` no cambia. Al tocarla se abre `?avisos=1`:
  sin sesión, la web tiene que enseñar `/api/avisos/recientes` y el botón
  «Desactivar las notificaciones de este móvil» (baja en cada aviso, LSSI
  art. 21.2).
- **App:** Expo, canal de Android `novedades`, prioridad alta, `sound`
  `default`, `data` solo `{"tipo","destino"}` (como las de cuenta). La
  prueba lleva `{"tipo":"novedad","destino":"inicio"}`: la app la reconoce
  como un aviso de novedad y, sin sesión, enseña arriba la frase de baja.
- La prueba (acción `prueba-sin-cuenta`) se titula «Prueba de RWAdar» con el
  texto «Si ves esto, las notificaciones funcionan en este móvil.».

## Lo que hace la base (migración 36)

- **Quién recibe:** los navegadores y móviles dados de alta sin cuenta, con
  la versión vigente del texto, de los anuncios **publicados en los últimos 7
  días**, después de su alta y después de encender el push y lo de sin
  cuenta. Nada viejo sale de golpe.
- **Sin duplicados:** en la web, si esa misma dirección está en una cuenta
  que lo va a recibir (permiso vigente y alta anterior al anuncio), no sale el
  de sin cuenta. En el móvil cuenta lo que ya repartió `repartir()` (30), que
  va antes en la misma vuelta: el de sin cuenta espera a que el anuncio esté
  repartido y no sale si ese token estaba en una cuenta a la que se le
  repartió (ya estaba en ella al repartirlo). Si la cuenta da el permiso o
  mete el móvil después de repartir, sí sale el de sin cuenta: ni dos ni
  ninguno.
- **Borrados:** 404 o 410 del servicio de push, `DeviceNotRegistered` de Expo
  o tres rechazos seguidos de esa suscripción (en la web, 400 o 413 del
  servicio de push) borran la fila y apuntan la baja. Un envío que llega pone
  los fallos a cero. **Un fallo general nuestro no borra a nadie:** en la web,
  -1 (nuestro servidor, también si falla el cifrado), 401 y 403 (la clave
  VAPID o la firma) y cualquier otro código dejan el envío «fallido» sin
  contar; en Expo, `MismatchSenderId` (las credenciales de FCM del proyecto)
  y cualquier otro error también, como con las cuentas (30).
- **Plazos (limpiar(), cada día):** envíos 90 días; navegadores y móviles sin
  renovar, 180 días; historial del permiso, 3 años desde la baja.
- **Historial del permiso** (`historial_sin_cuenta`, solo añadir): cada alta
  (nueva o con versión nueva) y cada baja (botón, servicio, fallos o
  caducada), con versión, idioma y origen. Sin dirección ni token: solo un
  número al azar (`ref`). Es la prueba del consentimiento (RGPD art. 7.1).
- **Cupos de la base:** 300 altas nuevas por hora en cada canal
  (`sin_cuenta_cupo_hora`); como mucho 5 000 navegadores
  (`sin_cuenta_maximo_web`) y 20 000 móviles (`sin_cuenta_maximo`); y un tope
  de 30 000 notificaciones web sin cuenta en 24 horas, reintentos incluidos
  (`sin_cuenta_tope_dia_web`): llegado, no se pide nada más hasta que baje.
  El verificador 36 avisa (sin fallar) si el cupo de una hora se llenó en los
  últimos 7 días, si se llegó al tope diario o a un máximo, y con 10 bajas o
  más por fallos en 24 horas; y siempre dice cuántas notificaciones web y
  cuántas bajas por fallos hubo en 24 horas.
- **Capacidad:** tandas de 200 por vuelta (cada 5 minutos) en la web y en
  Expo: unas 2 400 por hora en cada canal. Cada notificación web gasta una
  petición del cupo gratis de Cloudflare (100 000 al día).

### Funciones de la base (para anon y authenticated)

`avisos_sin_cuenta_texto()`, `alta_aviso_sin_cuenta_web(p_endpoint, p_p256dh, p_auth, p_version, p_idioma, p_origen)`,
`baja_aviso_sin_cuenta_web(p_endpoint, p_auth)`, `aviso_sin_cuenta_web_activo(p_endpoint, p_auth)`,
`alta_aviso_sin_cuenta_movil(p_token, p_plataforma, p_version, p_idioma, p_origen)`,
`baja_aviso_sin_cuenta_movil(p_token)`, `aviso_sin_cuenta_movil_activo(p_token)` y
`avisos_publicos(p_limite)`. Todas devuelven `jsonb`. La web y la app **no**
las llaman directamente: van por el servidor (`/api/avisos/*`).

## Para la parte 2 (web, app y textos legales)

- La web y la app solo hablan con `/api/avisos/*` (nunca con Supabase para
  esto). Si el servidor dice `apagado`, `no_disponible` o `activo:false`, el
  bloque explica con calma que todavía no está disponible y no rompe nada.
- Al cerrar sesión en la web, si la suscripción del navegador también está
  dada de alta sin cuenta, **no** quitarla (cada navegador tiene una sola
  suscripción).
- La «Información básica» sin cuenta: responsable (el titular de RWAdar);
  finalidad (avisos de novedades y fichas nuevas); base (consentimiento, RGPD
  art. 6.1.a y LSSI arts. 21 y 22.2); datos (la dirección de entrega y las
  claves del navegador, o el identificador del móvil, con la versión, la
  fecha, el idioma y el canal); encargados (Supabase, Cloudflare y el
  servicio de push de Apple, Google, Mozilla o Microsoft; en la app, Expo y
  Firebase); plazos (hasta la baja o 180 días sin abrir; envíos, 90 días;
  historial, 3 años); baja (el botón, los ajustes del móvil o desinstalar).
- Privacidad, registro de actividades (ficha A5) y anexo: ver el estudio,
  apartado 3.5.

## Operación (cada paso, con orden expresa de Víctor)

Flujo «Avisos a registrados (base)» (`avisos-base.yml`):

0. Antes de nada, Víctor decide lo de la cabecera secreta (arriba,
   «Decisiones»; condición S5 del anexo).
1. `ensayo-36` (no cambia nada) → `aplicar-36` (copia antes, `AVISOS`) →
   `verificar-36` (pasa los verificadores 30, 31, 32, 33, 34 y 36). Con la base
   apagada, no cambia nada para nadie.
2. `activar-sin-cuenta` (`AVISOS`; exige el push encendido y la clave VAPID).
   La web de producción todavía es la vieja: no tiene `/api/avisos/*` ni el
   bloque, así que nadie puede activarlas allí.
3. Web en revisión → activarlas en un iPhone (web en la pantalla de inicio) y
   en un Android con Chrome → `prueba-sin-cuenta` (`AVISOS`; solo sale con 5
   suscripciones sin cuenta o menos). Aquí solo se comprueba que **llega**:
   cada notificación abre `https://rwadar.pages.dev/?avisos=1`, que hasta el
   paso 4 es la web vieja («Entra en tu cuenta…»). **Al terminar, pulsar
   «Desactivar» en la revisión**, en los dos móviles: si no, esa suscripción
   de revisión seguiría recibiendo hasta 180 días y, con la de producción,
   llegarían dos por aviso.
4. Web en producción, con la privacidad nueva en el mismo despliegue. Repetir
   la prueba completa allí (condición S3): activar, `prueba-sin-cuenta`,
   tocarla (se abre la lista con la baja) y «Desactivar».
5. OTA de Android, después de la web (la app llama a `/api/avisos/movil` en
   producción). Prueba en un Android físico (C6): activar en la primera
   pantalla, `prueba-sin-cuenta` (llega como aviso de novedad), tocarla (sin
   sesión, la frase de baja arriba) y «Desactivar».
6. «Avisar novedad» (`anunciar`, tipo `novedad`, enlace
   `/novedades-rwadar/#avisos-movil`).
7. Marcha atrás: `apagar-sin-cuenta` (corta altas y envíos sin cuenta; la baja
   sigue). `fallo_cerrado.sql` también lo apaga.

**Ojo:** reaplicar la 30, la 32 o la 33 quita lo de sin cuenta de
`procesar()` o `limpiar()`: después hay que reaplicar la 36 (el verificador 36
lo detecta y el flujo lo avisa).

## Parte 2 (web, app y textos legales) · hecha el 14/11/2026, sin publicar

- **Web** (`rwadar-site/assets/rwadar-20260820.js`, bloque
  `avisos-sin-cuenta:inicio`…`fin`, interruptor `AVISOS_SIN_CUENTA_REMOTO`
  encendido): Perfil › Avisos sin sesión con el bloque «Notificaciones en este
  móvil» (sin cuenta), arriba de la tarjeta de la cuenta (`index.html`,
  `#perfilAvisosSinCuenta`). El texto se pide a `/api/avisos/texto` solo
  cuando el bloque se ve. «Activar…» en el mismo toque (permiso, service
  worker, suscripción reutilizada si es de la misma clave, alta con `origen`
  `perfil` o `novedades`, notificación de muestra). Marca en el navegador:
  `rwadar.avisos.sin-cuenta.v1` (huella de la dirección, versión, idioma,
  origen y renovación). Renovación al abrir, como mucho cada 12 h.
  `?avisos=1` sin sesión: diálogo con `/api/avisos/recientes` y «Desactivar
  las notificaciones de este móvil». Con sesión: activar con cuenta reutiliza
  la suscripción de sin cuenta; «Desactivar» de la cuenta quita las dos;
  cerrar sesión o borrar la cuenta deja la de sin cuenta.
  `window.RWAdarAvisosSinCuenta` (`paraVentana`, `activar`, `estado`) para la
  ventana de novedades.
- **Ventana de novedades** (web y app): el recuadro arriba y compacto; en la
  web, sin sesión, activa directamente (o lleva a los pasos del iPhone, o a
  Perfil › Avisos). `novedades-producto.json` a `2026-11-14.3` y, tras la
  revisión, `2026-11-14.4` (el tercer paso vale para la web y la app con
  sesión). En modo «directo», la frase de quién interviene va a la vista
  debajo del botón, antes de la información básica plegada (anexo, 7.3).
- **App** (`lib/avisos-sin-cuenta.js`, `componentes/AvisosSinCuenta.js`,
  interruptor `AVISOS_SIN_CUENTA_REMOTOS` encendido): dentro de
  `AccesoObligatorio`, encima del formulario; token de Expo y
  `/api/avisos/movil`; renovación diaria al abrir (y baja si el permiso se
  quitó); desde una notificación sin sesión, la baja arriba; con sesión,
  «Desactivar» del móvil quita también las de sin cuenta y hay un botón para
  quitar solo esas; «Borrar datos del dispositivo» da de baja primero
  (`rwadar.editorial.avisos.sin-cuenta.v1`). Solo JavaScript: OTA compatible
  con la 1.4.2.
- **Legal:** privacidad §2, §5, §6 «Notificaciones sin cuenta», §8, §9, §11 y
  §12; registro, A5 «Sin cuenta» (versión 9); anexo, apartado 7.
- **Pruebas:** `probar-web.mjs` (bloque «NOTIFICACIONES SIN CUENTA»),
  `rwadar-acceso/avisos-sin-cuenta-navegador.test.mjs` (Chromium, por el
  worker de verdad), `novedades-producto-navegador.test.mjs` (390 × 664 y
  360 × 640) y `rwadar-movil/tests/avisos-sin-cuenta.test.cjs`.
- **Orden al publicar:** la web (con la privacidad) antes que la OTA: la app
  llama a `/api/avisos/movil` en producción.

## Arreglos de la revisión (14/11/2026, sin publicar)

1. Un fallo general nuestro ya no borra las suscripciones sin cuenta: en la
   web solo cuentan 400 y 413; -1, 401 y 403 dejan el envío «fallido» sin
   contar; en Expo, `MismatchSenderId` no cuenta (arriba, «Borrados»).
2. Abuso llamando directamente a la base: máximo propio de la web (5 000),
   tope de 30 000 notificaciones web en 24 horas y avisos en el verificador
   36. La cabecera secreta queda para que la decida Víctor (S5).
3. La ventana de novedades, en modo «directo», enseña a la vista la frase de
   quién interviene debajo del botón, con «Privacidad» a
   `/privacidad#garantias-push` (anexo, 7.3).
4. La prueba llega a la app como `{"tipo":"novedad","destino":"inicio"}`, y el
   orden de la operación (arriba) separa lo que se comprueba en revisión
   (que llega, y «Desactivar» al terminar) de lo que se comprueba en
   producción (tocarla y la baja).
5. Móvil: ni dos ni ninguno; cuenta lo que ya repartió `repartir()`.
6. App: con un texto nuevo del permiso, el estado `texto-nuevo` (y no
   «Activadas»), con el texto nuevo y «Activar…» otra vez, que renueva la
   versión con el mismo token.
7. `novedades-producto.json` `2026-11-14.4`: el tercer paso dice «en la web o
   en la app».
8. En la app, el origen `perfil` del historial es su primera pantalla sin
   sesión (privacidad §6 y registro A5 lo aclaran).

## Archivos

- Base: `rwadar-app/db/36_avisos_sin_cuenta.sql` (+ copia
  `rwadar-app/supabase/migrations/20261114180000_avisos_sin_cuenta.sql`),
  `36_avisos_sin_cuenta_verificar.sql`, `_activar.sql`, `_apagar.sql`,
  `_prueba.sql`; `fallo_cerrado.sql` también lo apaga.
- Pruebas de la base: `rwadar-app/probar-avisos-sin-cuenta.mjs` (en `npm test`).
- Servidor: `rwadar-acceso/avisos-sin-cuenta-servidor.mjs`, enganchado en
  `servidor.mjs` (interruptor `AVISOS_SIN_CUENTA`) y en `compilar.cjs`;
  pruebas en `rwadar-acceso/avisos-sin-cuenta.test.mjs`.

# Avisos a registrados y Academy solo con cuenta (05/11/2026)

Petición de Víctor del 05/11/2026:

> «Podrías hacer en RWAdar, tanto en la app como en la web, que al
> registrarse, al sacar una nueva actualización o nuevas ofertas se enviará un
> correo de aviso y una notificación a la aplicación? Y que el apartado de
> Academy se desbloquee solo a los que se han registrado. O sea, que por
> registrarse tendrán un aviso de todas las novedades y un curso gratuito, que
> es la Academy de las 9 lecciones.»

Este documento es el **contrato** que siguen la base de datos, la web y la app.
Si algo cambia al implementarlo, se corrige aquí. Es la versión 2: incorpora
una revisión independiente del diseño en tres frentes (legal y privacidad,
seguridad, y compatibilidad y operaciones), hecha antes de escribir código.

## Lo que queda decidido y por qué

### 1. Academy solo con cuenta confirmada

**App.** Ya lo cumple: desde la 1.4.1 toda la app exige una cuenta confirmada
(`App.js`, `AccesoObligatorio`). Solo se retocan textos.

**Web.** El índice `/academy/` sigue público, como escaparate: dice que el
curso es gratis con cuenta. Cada lección exige una sesión confirmada, y eso
lo comprueba **el servidor** (`rwadar-acceso/servidor.mjs`, compilado en
`_worker.js`).

- **Ruta normalizada antes de decidir**, igual que `rutaNormalizadaRWAdar`:
  - se decodifica;
  - con `%2F`, `%5C` o `\`, o si no se puede decodificar, la respuesta es 400;
  - se juntan las `//`;
  - el primer segmento se compara sin distinguir mayúsculas;
  - valen igual `/academy/x`, `/academy/x/`, `/academy/x.html` y HEAD.
- **Lista cerrada de lecciones publicadas.** Sale de
  `rwadar-academy/academy.json` y la mete `construirWorker` dentro del worker.
- **Respuestas:**

  | Petición | Respuesta |
  |---|---|
  | Lección que no está en la lista (lecciones 8 y 9, o inventada) | 404, sin mirar la cookie |
  | Sin sesión, página HTML | 303 a `/acceso?volver=/academy/<slug>` con `no-store` |
  | Sin sesión, cualquier otra cosa | 401 con `no-store` |
  | Supabase lento o caído (timeout, 5xx, 429) | 503 con `Retry-After` y `no-store`, sin tocar la cookie. Nunca se manda a entrar por un fallo pasajero. |
  | Con sesión | La lección, servida por `servirArchivoRWAdar`, con `Cache-Control: private, no-store`, `X-Robots-Tag: noindex` y `Vary: Cookie` |

- **Buscadores:** las lecciones llevan `noindex` en su HTML y salen del sitemap.
  El índice sigue `index,follow`.
- **Interruptor único:** `"acceso": "cuenta"` en `rwadar-academy/academy.json`.
  Con `"publico"` se reabren las lecciones y el tutorial 3D. Sirve para retener
  el cierre si Eric no da su visto bueno; ver «Pendiente de personas». Los
  textos de privacidad sobre la Academy con cuenta y el destino tras confirmar
  el alta no dependen de él: hay que revertirlos a mano (lista en
  `rwadar-academy/LEEME.md`).
- **Tutorial 3D en el móvil:** vive dentro de la pestaña Academy de la web y
  también pide cuenta (puerta de interfaz). En escritorio sigue siendo la
  sección pública «Qué es tokenizar» de la portada.
- **Volver a la lección tras registrarse:**
  - si `/acceso` llega con `volver=/academy/…`, se abre en «Crear cuenta
    gratis» con el texto «Las lecciones son gratis con cuenta»;
  - al registrarse se guarda ese `volver`, ya validado, 24 horas en el
    navegador;
  - al volver del correo de confirmación se usa. Si no hay ninguno (por
    ejemplo, en otro navegador), se va a `/academy/` con «Cuenta confirmada:
    Academy desbloqueada».
- **Límite conocido:** la sesión web dura una hora y no se renueva. Después,
  la lección vuelve a pedir que se entre, y el progreso se conserva. Se deja
  escrito; no se cambia aquí.
- **No es un candado del contenido.** El texto va dentro del paquete de la app
  y en despliegues antiguos `https://<hash>.rwadar.pages.dev`. Es una puerta
  para animar a registrarse. Nunca se pone material privado en la Academy.

**Lecciones 8 y 9.** Siguen «Próximamente», en revisión por el calendario
editorial de Eric. Publicarlas es decisión de Víctor (ver `rwadar-academy/LEEME.md`).

### 2. Correo de bienvenida al confirmar el registro: a todos

Es un correo de servicio. Su contenido está cerrado:

- Dice que ya tienen la Academy gratis y enlaza `/academy/`.
- No lleva ofertas, enlaces a plataformas ni invitaciones a apuntarse a avisos.
  Según la AEPD, pedir el permiso por correo ya es comunicación comercial.
- No da número de lecciones.
- Cierra con «Si no creaste esta cuenta, escríbenos o bórrala».
- Solo lleva `List-Unsubscribe` si la persona se apuntó a los avisos.
- A quien se apuntó le confirma la suscripción y le da el enlace de baja.

### 3. Avisos de novedades: ofertas nuevas y actualizaciones, solo con permiso

La LSSI (art. 21) y el RGPD (art. 7.4) no dejan apuntar a nadie a avisos de
ofertas por el mero hecho de registrarse, ni condicionar la Academy a ello.

**Casilla aparte, sin marcar, al crear la cuenta.** Versión `novedades-v1-2026-11-05`.

- Texto en español:
  > Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil,
  > como notificaciones: ofertas nuevas en el radar y novedades de la web y la
  > app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en
  > cada aviso o en Perfil. Más información en Privacidad.
- Texto en inglés:
  > I want to receive RWAdar notices by email and, if I turn them on in my
  > phone, as notifications: new offers on the radar and news about the website
  > and the app. It's optional: the Academy unlocks anyway. You can unsubscribe
  > in every notice or in Profile. More information in Privacy.

La base guarda los dos textos. Una prueba exige que la web, la app y la base
digan lo mismo. Cambiar una sola palabra obliga a crear una versión nueva.

**Doble confirmación.**

- El permiso se guarda **solo** cuando `email_confirmed_at` pasa de vacío a
  una fecha (UPDATE), y solo si los metadatos del alta traen
  `avisos_novedades` como booleano JSON `true` (comprobado con `jsonb_typeof`)
  y `avisos_version` igual a la vigente.
- Si la cuenta ya nace confirmada (INSERT), se crea la fila de preferencias y
  se envía la bienvenida, pero **no** se guarda el permiso.
- La plantilla de confirmación de Supabase Auth dice, con
  `{{ if .Data.avisos_novedades }}`: «Al confirmar activas también los avisos
  de novedades. Si no lo pediste, no confirmes o date de baja en el primer
  correo».
- La casilla no se enseña hasta que esa plantilla esté puesta.
- Se guardan la fecha de alta, la fecha del permiso, la versión y el canal
  (`web`/`app`).
- Si ya hay preferencias, los metadatos no se vuelven a leer, para que una baja
  no se deshaga.
- **Barrera en la base:** el disparador solo lee los metadatos si
  `configuracion.casilla_activa` está encendido. Nace apagado y se enciende en
  el paso 4 (`30_avisos_registrados_activar_casilla.sql`), junto con la
  plantilla de Auth. El servidor web también ignora `avisosNovedades`
  mientras su `AVISOS_NOVEDADES_REMOTOS` esté apagado.

**Cuentas que ya existen.** La 30 les crea las preferencias con
`novedades = false`. Nadie se apunta solo: lo activan en Perfil.

**Baja.**

- Cada aviso lleva un enlace a `/baja?t=<token>` y un `mailto:` de baja a
  RWAdar@protonmail.com. Las dos cosas van en el pie y en `List-Unsubscribe`.
- No se promete la baja «en un clic» ni se añade `List-Unsubscribe-Post`.
- La baja corta el correo **y** el push de novedades.

**Push de novedades.** Solo llega a los móviles de cuentas con `novedades = true`.

**Edad.** La casilla obligatoria pasa a decir: «Tengo 18 años o más, acepto las
condiciones y he leído la privacidad». Va en la web, en la app y en inglés.

### 4. El ciclo del catálogo no envía nada por su cuenta

`AGENTS.md` dice que la orden de actualizar el catálogo «no incluye correos».
Por eso:

- **Al aprobar una revisión V2 con ofertas nuevas,** el disparador solo crea
  el anuncio.
  - Nace `retenido`, salvo que el interruptor `ofertas_automaticas` esté
    encendido. Ese interruptor nace apagado.
  - Un anuncio retenido no se reparte ni se ve en la app. Solo sale con
    `rwadar_novedades.publicar_anuncio(id)`, desde el flujo «Avisar novedad»
    y con orden expresa de Víctor.
- **`ofertas_automaticas` solo lo enciende Víctor,** tras la revisión legal.
  Ese mismo día se cambian `AGENTS.md`, la skill `investigacion-catalogo` y
  `CICLO-DIARIO-CATALOGO.md`.
- **Las actualizaciones se avisan con el flujo manual «Avisar novedad»,** con
  orden de Víctor. `ota-android.yml` **no** cambia.
- **Plantilla cerrada para el anuncio de ofertas:**
  - no nombra productos ni emisores, tampoco en el push;
  - título: «N fichas nuevas en el radar de RWAdar», sin «oportunidad» ni cifras;
  - enlace a `https://rwadar.pages.dev/#emisiones`;
  - aviso fijo: «RWAdar no intermedia ni recomienda. Aparecer en el radar no es
    un respaldo y se puede perder lo invertido. Nadie paga por aparecer en este
    aviso».
  - Si hace falta el prefijo «Publi» (LSSI art. 20), lo decide la revisión
    legal.
- **Como mucho un anuncio de ofertas al día** (clave `ofertas:AAAA-MM-DD`),
  aunque haya entregas `.2` y `.3`.
- **Los anuncios `novedad` y `actualizacion` pasan un filtro de palabras:** sin
  «oportunidad», «rentabilidad», «garantiz…» ni «%».

### 5. Notificaciones en la app

- **Avisos dentro de la app** (lista «Avisos» en Inicio y en Perfil). Llegan
  por OTA a la 1.4.1 y no necesitan permiso del sistema. Muestran los anuncios
  publicados y la bienvenida.
- **Notificaciones push del sistema.** Necesitan el APK 1.4.2: la 1.4.1
  bloquea `POST_NOTIFICATIONS` y no lleva Firebase. Transición:
  1. Primero, la OTA con los avisos internos a la 1.4.1.
  2. El cambio nativo entra en `main` el mismo día que se compila la 1.4.2
     desde `main`, con permiso de Víctor.
  3. Desde entonces la base por defecto de `ota-android.yml` es ese commit. La
     1.4.1 deja de recibir OTA y ve el aviso de versión nueva.

  Guía: [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md).
  `google-services.json` va como archivo de EAS, nunca en Git.
- **Dos interruptores en Perfil, en la app:**
  - «Avisos de novedades (correo y móvil)», que es el permiso;
  - «Notificaciones en este móvil», que registra el dispositivo y pide permiso
    al sistema.
  - El push de novedades necesita los dos. La bienvenida por push (de
    servicio) sale una vez por cuenta, al registrar el primer móvil.
  - En la 1.4.1, el segundo interruptor dice que llega con la 1.4.2. La
    capacidad se mira con `codigoNativoInstalado(Updates.runtimeVersion) >= 24`.

### 6. Todo nace apagado

Nada se envía hasta que Víctor da cada paso de la sección «Activación».

## Base de datos: `rwadar-app/db/30_avisos_registrados.sql`

Preparada y probada en local; **no aplicada**. Va después de:

- 22;
- 24, 25 y las migraciones del catálogo;
- 26;
- el refuerzo de sesión (`supabase/migrations/20261011074218_…`);
- 28 y `28_REVERTIR`;
- 29.

Hay una copia idéntica en `rwadar-app/supabase/migrations/20261105200000_avisos_registrados.sql`.
Se aplica en el SQL Editor con una copia de seguridad hecha antes, **nunca**
con `supabase db push`: eso aplicaría también la 27 (comunidad), que nunca se
ha aplicado.

**Esquema privado `rwadar_novedades`.**

- Se llama así para que ningún filtro antiguo lo confunda. Los `LIKE
  '%avisos_ciclo%'` o `'%push_soltar%'` de 22, 23, `correo_fallo_cerrado` y los
  verificadores no lo tocan.
- No tiene `usage` para `public`, `anon` ni `authenticated`, ni se expone por REST.
- Cada función nueva lleva `revoke all … from public, anon, authenticated` y
  después solo el permiso justo.
- Se repiten los `revoke` de 23 sobre `vault.decrypted_secrets` y `net.*`.

**Tablas.** Todas las que apuntan a una cuenta lo hacen con `on delete cascade`
hacia `auth.users`, para que `borrar_mi_cuenta` funcione.

| Tabla | Para qué |
|---|---|
| `configuracion` | Fila única. Interruptores `correo_habilitado`, `push_habilitado` y `ofertas_automaticas`, los tres `false` al instalar, con `correo_activado_el` y `push_activado_el`. También `version_consentimiento = 'novedades-v1-2026-11-05'`, `texto_consentimiento_es` y `texto_consentimiento_en`. |
| `preferencias` | Una fila por cuenta: `usuario_id`, `novedades`, `aceptado_el`, `version`, `origen` (`alta`/`perfil`), `canal` (`web`/`app`), `alta_el`, `baja_token` (`gen_random_uuid()`, único), `baja_el` y `actualizado_el`. |
| `anuncios` | `id`, `tipo` (`ofertas`, `actualizacion` o `novedad`), `clave` única, `estado` (`retenido` o `publicado`), `titulo` (3-90 caracteres), `texto` (3-400), `enlace` y `revision_id`. Fechas: `creado_el`, `publicado_el`, `correo_repartido_el` y `push_repartido_el`. Título y texto sin caracteres de control. El enlace debe cumplir `^https://rwadar\.pages\.dev(/[A-Za-z0-9._~%-]+)*/?([?#][A-Za-z0-9._~%=&-]*)?$` y tener 200 caracteres como mucho. |
| `dispositivos` | Clave `token`, con formato `^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$`. Más `usuario_id`, `plataforma` (`android`/`ios`) y fechas. Hasta 5 por cuenta. El último que registra un token se lo queda, y se borran los push pendientes de ese token. **No** reutiliza `public.dispositivos`, que sigue cerrada. |
| `correos` | Cola: `usuario_id`, `tipo` (`bienvenida` o `anuncio`), `anuncio_id`, estado, idempotencia, petición, mensaje del proveedor, error y fechas. Una bienvenida por cuenta; un correo por cuenta y anuncio. |
| `pushes` | Cola: `token`, `usuario_id`, `tipo`, `anuncio_id`, estado, ticket, recibo, error y fechas. Una bienvenida por cuenta; un push por token y anuncio. |

**Disparadores.**

- Son funciones `security definer`, de `postgres`, con `search_path = ''` y
  nombres completos.
- No hacen conversiones en `declare`. Si fallan, lo capturan y dejan solo un
  `warning` con el `sqlstate`, nunca el mensaje, que podría llevar el correo.
- Nunca pueden tumbar un alta, una confirmación ni la aprobación del catálogo.

| Cuándo | Qué hace |
|---|---|
| Al confirmar el correo: `after insert or update of email_confirmed_at on auth.users`, solo si pasa de vacío a fecha (o la cuenta nace confirmada) y `is_anonymous is not true` | Crea las preferencias. El permiso, solo en el UPDATE y con las condiciones del punto 3. Si `correo_habilitado`, encola la bienvenida. |
| Al aprobar el catálogo: `avisar_ofertas_nuevas`, `after update of estado on rwadar_catalogo.revisiones` | Su nombre va antes que `fijar_publicacion_v2` en orden alfabético, así que todavía ve el puntero viejo. Compara los `slug` de la nueva revisión V2 aprobada con los de `publicacion_v2.revision_id` de ese momento. Si no hay puntero o no hay altas, no hace nada. Si hay altas, inserta el anuncio del día (`on conflict (clave) do nothing`), retenido o publicado según `ofertas_automaticas`. **No reparte nada.** |

**Reparto y envío: `rwadar_novedades.procesar()`.**

- Es la única función que llama el reloj `rwadar-novedades`, cada 5 minutos.
  El reloj solo lo crean los scripts de activación.
- **Reparte** los anuncios `publicado` no repartidos y creados después de
  `correo_activado_el` (o de `push_activado_el`):
  - correo: a cada cuenta confirmada con `novedades = true` y versión vigente;
  - push: a cada dispositivo de esas cuentas.
- **Envía y recoge los resultados** como 22 y 23: pg_net, Vault, dos fases e
  idempotencia.
  - Correo con Brevo: `BREVO_API_KEY` y `RWADAR_REMITENTE`, HTML escapado,
    `Idempotency-Key` y `contactPixelTrackingConsent: false`.
  - Push con Expo: canal `novedades`, `data: {tipo, destino}` con `destino` ∈
    `inicio`, `buscar`, `academy`, sin datos personales. `getReceipts` lee los
    resultados y `DeviceNotRegistered` borra el token.
  - Si existe `EXPO_ACCESS_TOKEN` en el Vault, va como `Authorization`.
- **Justo antes de enviar vuelve a mirar** que la cuenta siga confirmada, con
  `novedades` y versión vigente (salvo la bienvenida), y que el token exista.
  Si no, lo cierra sin enviarlo.
- **Pie de cada aviso:**
  - quién envía (RWAdar, con enlace al aviso legal y la privacidad);
  - por qué lo recibe;
  - la baja (enlace y `mailto:`).
- **Limpieza:** colas terminadas (también las bienvenidas, que se recuerdan
  con una marca en preferencias para no repetirse), a los 90 días;
  dispositivos sin actualizar, a los 180. La app renueva el registro de su
  móvil una vez al día mientras las notificaciones estén activas.
- **Copias de seguridad:** `copia-seguridad.sh` incluye `rwadar_novedades`
  (y `rwadar_cuentas_privadas`).

**Funciones para la app y la web.**

- Todas son `security definer` con `search_path` vacío.
- Todas exigen `rwadar_cuentas_privadas.sesion_confirmada()`, salvo la baja.
- Ninguna devuelve ids de las colas.

| Función | Qué hace |
|---|---|
| `public.estado_mis_avisos() → jsonb` | Devuelve `{novedades, version, aceptado_el, version_vigente, texto_es, texto_en, dispositivos, correo_activo, push_activo}`. Si no hay fila, valores por defecto. |
| `public.configurar_avisos_novedades(p_activar boolean, p_version text, p_canal text) → jsonb` | Para activar, `p_version` debe ser la vigente. Crea la fila si falta y devuelve lo mismo que la anterior. |
| `public.registrar_aviso_push(p_token text, p_plataforma text) → boolean` | Aplica el formato y el límite de 5. Si es el primer dispositivo de la cuenta y `push_habilitado`, encola la bienvenida una sola vez por cuenta. |
| `public.quitar_aviso_push(p_token text) → boolean` | Quita un token propio. |
| `public.mis_avisos_recientes(p_limite int default 20) → setof jsonb` | `p_limite` va de 1 a 50. Devuelve los anuncios `publicado` de los últimos 90 días más la bienvenida de la cuenta, con `id` `'bienvenida'`. Cada uno lleva `{id, tipo, titulo, texto, enlace, creado_el}`. |
| `public.baja_avisos(p_token uuid) → boolean` | Para `anon` y `authenticated`. Pone `novedades = false` y `baja_el`. |
| `rwadar_novedades.anunciar(p_tipo, p_clave, p_titulo, p_texto, p_enlace) → bigint` | Solo el propietario de la base. Crea el anuncio ya `publicado` y no repite claves. |
| `rwadar_novedades.publicar_anuncio(p_id bigint) → boolean` | Solo el propietario de la base. Pasa un retenido a `publicado`. |

**Scripts que acompañan a la 30.**

| Script | Qué hace |
|---|---|
| `30_avisos_registrados_verificar.sql` | Solo lee. Comprueba los interruptores, los permisos de cada función, que no haya ninguna cuenta confirmada sin preferencias y el reloj. |
| `30_avisos_registrados_activar_correo.sql` | Exige los secretos en el Vault. Enciende el correo, fija `correo_activado_el` y crea el reloj. |
| `30_avisos_registrados_activar_push.sql` | Lo mismo para el push. |
| `30_avisos_registrados_apagar.sql` | Apaga los tres interruptores y quita el reloj. |
| `fallo_cerrado.sql` | Además, quita cualquier reloj cuya orden contenga `rwadar_novedades.` y apaga los interruptores si existe el esquema. |

**Pruebas: `rwadar-app/probar-avisos-registrados.mjs`,** sobre la cadena de
producción. Dentro de `npm --prefix rwadar-app test`. Cubre:

- **Altas y confirmación:**
  - con el rol `supabase_auth_admin`;
  - con metadatos raros (texto, número, array y uno muy grande);
  - con una avería forzada en la tabla. La confirmación siempre pasa.
- **Permiso:**
  - solo en la confirmación;
  - una baja no se deshace;
  - las cuentas existentes rellenadas;
  - `borrar_mi_cuenta` con filas en todas las tablas.
- **Catálogo:**
  - los lotes reales 2026-11-05 y 2026-11-05.2 dan 0 anuncios;
  - un lote inventado con una alta da 1 anuncio retenido y nada en las colas;
  - con `ofertas_automaticas`, publicado; `procesar()` lo reparte.
- **Envío:**
  - las peticiones a Brevo y Expo, con su pie y su baja;
  - la segunda comprobación antes de enviar;
  - límites y permisos de las funciones.
- **Convivencia con los filtros antiguos:** activar, reaplicar la 22, pasar los
  verificadores de 22 y 23 y fresh-install y `correo_fallo_cerrado`: el reloj
  nuevo sigue.
- **Textos:** el de la casilla coincide en la base, la web y la app.

## Web

- **Interruptor** `AVISOS_NOVEDADES_REMOTOS = false`. Con él apagado, la web no
  muestra nada de avisos y sus textos de hoy siguen siendo ciertos. La Academy
  con cuenta depende de `academy.json`, no de este interruptor.
- **Alta** (`acceso.html`, `assets/acceso.js`, `servidor.mjs`):
  - casilla obligatoria con los 18 años;
  - casilla `#avisos-novedades`, sin marcar, solo al crear la cuenta y con el
    interruptor encendido;
  - el servidor acepta `avisosNovedades` (booleano estricto). Si es `true`,
    añade a los metadatos `avisos_novedades: true`, `avisos_version` y
    `avisos_canal: 'web'`;
  - se aplica la vuelta a la lección del punto 1.
- **Perfil** (con el interruptor encendido):
  - tarjeta «Avisos de novedades» con su interruptor;
  - sustituye la tarjeta «Próximamente · Avisos de cambios»;
  - `/api/acceso/datos` admite `rpc/estado_mis_avisos`,
    `rpc/configurar_avisos_novedades` y `rpc/mis_avisos_recientes`.
- **Baja sin cuenta:**
  - `rwadar-site/baja.html` (con `noindex` y `no-store` en `_headers`) más
    `assets/baja-20261105.js`, porque la CSP no admite scripts dentro de la
    página;
  - el script lee `t`, lo quita de la dirección con `history.replaceState` y,
    al pulsar el botón, hace `POST /api/acceso/baja {token}`;
  - ese endpoint exige el mismo origen, un UUID y su propio límite por IP, y
    responde siempre lo mismo. Llama a `rpc/baja_avisos` con la clave
    publicable;
  - las dos páginas nuevas van a `ARCHIVOS_PUBLICABLES`.
- **Publicación:**
  - `.github/comprobar-publicado.mjs`, `rwadar-precargar-imagenes.js` y
    `probar-precarga.cjs` esperan 303, 404 o 401 en las lecciones, según el
    caso, y no 200;
  - el contenido de las lecciones se comprueba en `rwadar-publicado/` antes de
    subir;
  - prueba local del comprobador contra el `_worker.js` compilado.
- **Privacidad:** se cambia en dos momentos.
  - *Al cerrar la Academy:* `privacidad.html:55` y la finalidad del correo
    (`:230`) pasan a decir que la Academy es con cuenta. Se añade a las
    condiciones y se explica que «para abrir una lección comprobamos tu
    sesión; no guardamos qué lecciones lees».
  - *Avisos:* nueva sección con permiso, casilla sin marcar, baja en cada
    aviso, sin píxel ni seguimiento de clics, proveedores Brevo y Expo/FCM,
    plazos de conservación y el aviso de que **todavía no están activos**.
    Cuando se activen, se cambian además las frases de la tabla de abajo.

## App (solo JS: compatible con la OTA de la 1.4.1)

- **Interruptor** `AVISOS_NOVEDADES_REMOTOS = false` en `lib/modo-local.js`. No
  se toca `SERVICIOS_USUARIO_REMOTOS`, ni `app.json`, ni las dependencias, ni
  `scripts/`.
- **Alta** (`Cuenta.js`, `lib/cuentas.js`): las mismas casillas, los mismos
  metadatos y `avisos_canal: 'app'`.
- **Perfil › Avisos:** los dos interruptores del punto 5.
- **Inicio:** tarjeta «Avisos» con los últimos de `mis_avisos_recientes` y un
  punto de no leído, guardado en local y por cuenta.
- **Al tocar una notificación:**
  - `data.tipo` ∈ `bienvenida`, `ofertas`, `actualizacion`, `novedad`;
  - `data.destino` ∈ `inicio`, `buscar`, `academy`;
  - se sigue aceptando el `slug` antiguo.
- **Al cerrar sesión:** `quitar_aviso_push` del token de este móvil.

## Frases que dejan de ser ciertas al encender cada cosa

| Cuándo | Dónde |
|---|---|
| Al cerrar la Academy | `privacidad.html:55, 110-127, 230` y textos de `rwadar-academy.js` |
| Al mostrar la casilla (interruptores encendidos) | `privacidad.html:62-64, 78, 230, 268-272`<br>`Cuenta.js:210, 308`<br>`App.js:1711`<br>`idioma-en.js:11, 148, 384, 543`<br>`rwadar-20260820.js:4463, 4491, 4817`<br>`index.html:1553-1561` |
| Al encender el correo | `privacidad.html:361, 367-370, 453-454`<br>`App.js:1705` |
| Al encender el push (1.4.2) | `privacidad.html:349-351, 455-459, 493-494`<br>`App.js:1733, 1756` y su inglés<br>`App.js`, diálogo de «Borrar datos del dispositivo»: «No se borran datos del servidor» (al borrar se quita también el registro push del móvil) |
| Ya hoy | `docs/manual/LEEME.md:59-64` («baja en un clic») |

Con cada interruptor apagado, las pruebas exigen las frases de hoy. Con cada
uno encendido, exigen las nuevas.

## Avisar de una actualización o publicar un anuncio retenido

`.github/workflows/avisar-novedad.yml` es manual.

- **Entradas:**
  - `accion`: `anunciar` o `publicar-retenido`, como `type: choice`;
  - `tipo`: `actualizacion` o `novedad`, como `choice`;
  - `titulo`, `texto` y `enlace`;
  - `id`, para un retenido;
  - la palabra `ENVIAR`.
- **Cómo corre:** un único trabajo, en máquina nueva, con `permissions: {}` y
  sin npm. Instala solo `psql`, igual que «Aplicar catálogo».
- **Entradas y secreto:**
  - las entradas llegan por `env:` y se validan en bash;
  - pasan a `psql -X -v ON_ERROR_STOP=1 -v titulo="$TITULO" … -f rwadar-app/db/anunciar.sql`,
    que las usa como `:'titulo'`;
  - nunca `${{ inputs.* }}` dentro de `run:`;
  - el secreto `SUPABASE_DB_URL`, solo en ese paso.
- **Permiso:** lanzarlo necesita orden expresa de Víctor, igual que los
  scripts de activación. Se apunta en `AGENTS.md`.

## Plantilla de Supabase Auth

`rwadar-app/plantillas-auth/confirmar-alta.html` es el correo de confirmación
de hoy, que sale por Gmail, convertido en bienvenida: «Confirma tu correo y
desbloquea gratis la Academy». Lleva el bloque `{{ if .Data.avisos_novedades }}`
del punto 3.

Ponerla en el panel de Supabase es tocar Supabase en línea: requiere permiso
de Víctor.

## Activación (cada paso, con permiso expreso de Víctor)

1. **Cierre de la Academy.** Visto bueno escrito de Eric (ver «Pendiente de
   personas»). Después: sellar, PR, merge, «Publicar web» y la OTA de textos.
   Unir a `main` equivale a publicar en el siguiente ciclo.
2. **Revisión legal** de la casilla, la privacidad, las plantillas de correo y
   el anuncio de ofertas.
3. **Base de datos:** copia de seguridad; aplicar la 30 en el SQL Editor y
   pasar el verificador.
4. **Casilla visible:**
   - plantilla de Auth puesta y `30_avisos_registrados_activar_casilla.sql`;
   - `AVISOS_NOVEDADES_REMOTOS = true` en la web y la app;
   - privacidad al día;
   - publicar la web y enviar la OTA.
5. **Correo:**
   - dominio propio;
   - Brevo con el dominio autenticado, el contrato de encargo aceptado y
     archivado, y el seguimiento de aperturas y clics desactivado;
   - secretos en el Vault;
   - `30_avisos_registrados_activar_correo.sql`;
   - prueba con una cuenta propia: sin píxel, enlaces directos y baja de
     principio a fin; confirmar con Brevo el nombre de la cabecera de
     idempotencia, el código de duplicado y que `List-Unsubscribe` llega.
6. **Push:**
   - proyecto de Firebase y credencial FCM V1 en EAS;
   - APK 1.4.2 (guía);
   - `30_avisos_registrados_activar_push.sql`;
   - prueba en un móvil real.
7. **Aviso automático de ofertas,** si Víctor lo quiere:
   - `update rwadar_novedades.configuracion set ofertas_automaticas = true`;
   - cambiar `AGENTS.md`, la skill y `CICLO-DIARIO-CATALOGO.md`.

## Pendiente de personas

- **Eric:**
  - visto bueno escrito para las lecciones solo con cuenta, con `noindex` y
    fuera del sitemap;
  - visto bueno para usar la Academy como reclamo del alta;
  - licencia de las 9 lecciones para la web y la app.

  Su especificación decía «sin cuentas» (`docs/academy/ESPECIFICACION_WEB.md:152`).
  Se archiva en `docs/academy/`.
- **Víctor:**
  - dominio propio;
  - cuenta de Brevo;
  - Firebase;
  - permiso para cada paso de la activación;
  - si se publican las lecciones 8 y 9.
- **Abogado:** el texto de la casilla, los avisos de ofertas (comunicación
  comercial y publicidad financiera) y si hace falta el prefijo «Publi».

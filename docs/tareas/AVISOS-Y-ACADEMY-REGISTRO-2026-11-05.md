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
  Con `"publico"` se reabren las lecciones. Eric dio su visto bueno el
  06/11/2026 ([nota](../academy/VISTO-BUENO-ERIC-2026-11-06.md)). Los
  textos de privacidad sobre la Academy con cuenta y el destino tras confirmar
  el alta no dependen de él: hay que revertirlos a mano (lista en
  `rwadar-academy/LEEME.md`).
- **Tutorial 3D:** público en la web, en ordenador y en móvil (decisión de
  Víctor del 06/11/2026). En la app nativa está, como todo, detrás de la
  cuenta desde la 1.4.1.
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
- La casilla no se enseña hasta que esa plantilla esté puesta. Y la base no
  hace caso de los metadatos hasta que se aplica
  `30_avisos_registrados_activar_casilla.sql` (`casilla_activa = true`, paso 4
  de la activación, justo después de poner la plantilla). Antes, quien escriba
  `avisos_novedades` a mano en un alta no queda apuntado.
- Se guardan la fecha de alta, la fecha del permiso, la versión y el canal
  (`web`/`app`).
- Si ya hay preferencias, los metadatos no se vuelven a leer, para que una baja
  no se deshaga.
- **Solo correos de confirmación enviados con la casilla activa:** además, el
  disparador exige que `auth.users.confirmation_sent_at` sea posterior a
  `configuracion.casilla_activada_el`. Un alta hecha antes de activar la
  casilla (su correo era el antiguo, sin el aviso) y confirmada después no da
  permiso. Si falta ese dato, tampoco. Se comprueba con una cuenta propia en el
  paso 4.
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

- **Avisos dentro de la app** (tarjeta «Avisos» en Inicio: enseña 3 y «Ver
  todos» despliega los demás; Perfil solo tiene los interruptores). Llegan por
  OTA a la 1.4.1 y no necesitan permiso del sistema. Muestran los anuncios
  publicados y la bienvenida.
- **Cerrar sesión sin conexión:** si no se puede quitar el token, la clave se
  conserva y se vuelve a intentar en la siguiente salida, desactivación o
  «Borrar datos» de esa misma cuenta (solo su sesión puede quitarlo). Mientras
  tanto el móvil puede recibir avisos generales, que no llevan datos
  personales; si otra cuenta registra ese móvil, pasa a ser suyo, y si no, la
  limpieza de 180 días lo borra.
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
| `configuracion` | Fila única. Interruptores `correo_habilitado`, `push_habilitado` y `ofertas_automaticas`, los tres `false` al instalar, con `correo_activado_el` y `push_activado_el`. `casilla_activa`, también `false` al instalar: sin ella, los metadatos del alta no dan permiso. `casilla_activada_el`: cuándo se encendió la casilla (la base no deja encenderla sin esa fecha). También `version_consentimiento = 'novedades-v1-2026-11-05'`, `texto_consentimiento_es` y `texto_consentimiento_en`. |
| `preferencias` | Una fila por cuenta: `usuario_id`, `novedades`, `aceptado_el`, `version`, `origen` (`alta`/`perfil`), `canal` (`web`/`app`), `alta_el`, `baja_token` (`gen_random_uuid()`, único), `baja_el` y `actualizado_el`. Más `bienvenida_correo_el` y `bienvenida_push_el`: cuándo se encoló cada bienvenida. Con la marca puesta no se vuelve a encolar. |
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
| Al confirmar el correo: `after insert or update of email_confirmed_at on auth.users`, solo si pasa de vacío a fecha (o la cuenta nace confirmada) y `is_anonymous is not true` | Crea las preferencias. El permiso, solo en el UPDATE, con `casilla_activa`, con las condiciones del punto 3 y si el correo de confirmación salió **después** de encender la casilla: `confirmation_sent_at` de Auth `>= casilla_activada_el`. Un alta anterior recibió el correo antiguo, sin el aviso, y confirmarla después no la apunta (se apunta en Perfil); si Auth le reenvía la confirmación ya con la plantilla nueva, sí cuenta. `confirmation_sent_at` se lee con `to_jsonb(new)`: si falta o está vacía, no hay permiso, y la confirmación pasa igual. Si `correo_habilitado` y la cuenta aún no tiene `bienvenida_correo_el`, pone la marca y encola la bienvenida. |
| Al aprobar el catálogo: `avisar_ofertas_nuevas`, `after update of estado on rwadar_catalogo.revisiones` | Su nombre va antes que `fijar_publicacion_v2` en orden alfabético, así que todavía ve el puntero viejo. Compara los `slug` de la nueva revisión V2 aprobada con los de `publicacion_v2.revision_id` de ese momento. Si no hay puntero o no hay altas, no hace nada. Si hay altas, inserta el anuncio del día (`on conflict (clave) do nothing`), retenido o publicado según `ofertas_automaticas`. **No reparte nada.** |

**Reparto y envío: `rwadar_novedades.procesar()`.**

- Es la única función que llama el reloj `rwadar-novedades`, cada 5 minutos.
  El reloj solo lo crean los scripts de activación.
- **Reparte** los anuncios `publicado` no repartidos y **publicados** después
  de `correo_activado_el` (o de `push_activado_el`). Cuenta
  `coalesce(publicado_el, creado_el)`: un retenido creado antes de activar y
  publicado después también sale.
  - correo: a cada cuenta confirmada con `novedades = true` y versión vigente;
  - push: a cada dispositivo de esas cuentas.
- **Envía y recoge los resultados** como 22 y 23: pg_net, Vault, dos fases e
  idempotencia.
  - Correo con Brevo: `BREVO_API_KEY` y `RWADAR_REMITENTE`, HTML escapado,
    `Idempotency-Key` y `contactPixelTrackingConsent: false`. Un 400 con
    `duplicate_parameter` o `duplicate_request` cuenta como aceptado (Brevo ya
    lo tenía). El nombre exacto de la cabecera de idempotencia, ese código y
    si `List-Unsubscribe` llega al buzón se confirman en la prueba real del
    paso 5 de la activación.
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
- **Limpieza (`limpiar()`):**
  - colas terminadas, a los 90 días, también las bienvenidas. No se repiten:
    la marca `bienvenida_correo_el`/`bienvenida_push_el` vive en preferencias
    y se va con la cuenta;
  - dispositivos sin actualizar, a los 180. La app volverá a llamar a
    `registrar_aviso_push` una vez al día, lo que renueva `actualizado_el`;
  - **reloj propio y diario, `rwadar-novedades-limpieza`** (`41 4 * * *`,
    orden `select rwadar_novedades.limpiar()`). Lo crea la 30 al aplicarse,
    también al reaplicarla, y existe con todo apagado: los plazos que promete
    la privacidad se cumplen aunque no se active nunca ningún canal.
    `limpiar()` solo borra filas de `rwadar_novedades`: no hace red ni lee
    Vault. Comparte cerrojo con `procesar()`, que también la llama en cada
    vuelta;
  - su orden no casa con ningún `LIKE` de 22, 23, `correo_fallo_cerrado`,
    `push_fallo_cerrado` ni `fresh_install_verificar`. Los scripts de
    activación y `30_avisos_registrados_apagar.sql` no lo quitan; solo
    `fallo_cerrado.sql` (emergencia), y reaplicar la 30 lo vuelve a crear. El
    verificador exige que esté, uno y tal cual.
- **Copias de seguridad:** `copia-seguridad.sh` incluye `rwadar_novedades`.
  `rwadar_cuentas_privadas` (cartera, ya en producción) sigue fuera: su tabla
  `carteras` lleva RLS forzado y podría hacer fallar la copia, que también hace
  «Aplicar catálogo». Incluirla es una decisión aparte, tras comprobarlo. Al
  restaurar, después de cargar los datos se reaplica la 30 (recrea la fila de
  `configuracion` con todo apagado si la copia no la trae) y se pasa su
  verificador: `docs/COPIAS-DE-SEGURIDAD.md`.

**Funciones para la app y la web.**

- Todas son `security definer` con `search_path` vacío.
- Todas exigen `rwadar_cuentas_privadas.sesion_confirmada()`, salvo la baja.
- Ninguna devuelve ids de las colas.

| Función | Qué hace |
|---|---|
| `public.estado_mis_avisos() → jsonb` | Devuelve `{novedades, version, aceptado_el, version_vigente, texto_es, texto_en, dispositivos, correo_activo, push_activo}`. Si no hay fila, valores por defecto. |
| `public.configurar_avisos_novedades(p_activar boolean, p_version text, p_canal text) → jsonb` | Para activar, `p_version` debe ser la vigente. Crea la fila si falta y devuelve lo mismo que la anterior. |
| `public.registrar_aviso_push(p_token text, p_plataforma text) → boolean` | Aplica el formato y el límite de 5. Si `push_habilitado` y la cuenta aún no tiene `bienvenida_push_el`, pone la marca y encola la bienvenida: una sola vez por cuenta (si se quita el móvil antes de que salga, no se vuelve a encolar). Volver a llamarla con el mismo token renueva `actualizado_el`; la app lo hará una vez al día. |
| `public.quitar_aviso_push(p_token text) → boolean` | Quita un token propio. |
| `public.mi_aviso_push_registrado(p_token text) → boolean` | Dice si ese token sigue registrado **en la cuenta de la sesión**; nunca mira los de otras. Sirve a la app para saber si debe volver a registrar su móvil (la base lo borra a los 180 días sin renovar, con `DeviceNotRegistered` o al pasar de 5). |
| `public.mis_avisos_recientes(p_limite int default 20) → setof jsonb` | `p_limite` va de 1 a 50. Devuelve los anuncios `publicado` de los últimos 90 días más la bienvenida de la cuenta, con `id` `'bienvenida'`. Cada uno lleva `{id, tipo, titulo, texto, enlace, creado_el}`. |
| `public.baja_avisos(p_token uuid) → boolean` | Para `anon` y `authenticated`. Pone `novedades = false` y `baja_el`. |
| `rwadar_novedades.anunciar(p_tipo, p_clave, p_titulo, p_texto, p_enlace) → bigint` | Solo el propietario de la base. Crea el anuncio ya `publicado` y no repite claves. |
| `rwadar_novedades.publicar_anuncio(p_id bigint) → boolean` | Solo el propietario de la base. Pasa un retenido a `publicado`. |

**Scripts que acompañan a la 30.**

| Script | Qué hace |
|---|---|
| `30_avisos_registrados.sql` (reaplicada) | Vuelve al estado de instalación: todo apagado, **casilla incluida** (`casilla_activa = false`, `casilla_activada_el` vacía), sin reloj de envío y con el de limpieza. No borra filas. |
| `30_avisos_registrados_verificar.sql` | Solo lee. Comprueba los interruptores, los permisos de cada función, que no haya ninguna cuenta confirmada sin preferencias, el reloj de envío y el diario de limpieza. Informa de si la casilla del alta está activa; si no lo está, avisa (WARNING): «casilla del alta inactiva: si la web o la app enseñan la casilla, ejecuta `30_avisos_registrados_activar_casilla.sql`». |
| `30_avisos_registrados_activar_casilla.sql` | Paso 4, con la plantilla de Auth ya puesta. Pone `casilla_activa = true` y `casilla_activada_el` (si ya estaba activa, conserva la fecha): desde entonces cuenta el permiso de las altas cuyo correo de confirmación sale desde ese momento. No envía nada ni crea reloj. |
| `30_avisos_registrados_activar_correo.sql` | Exige los secretos en el Vault. Enciende el correo, fija `correo_activado_el` y crea el reloj de envío. No toca el de limpieza. |
| `30_avisos_registrados_activar_push.sql` | Lo mismo para el push. |
| `30_avisos_registrados_apagar.sql` | Apaga el **envío**: correo, push, `ofertas_automaticas` y el reloj de envío. **No** toca la casilla del alta (la web y la app la siguen enseñando y quien la marca guarda su permiso) ni el reloj de limpieza. |
| `30_avisos_registrados_apagar_casilla.sql` | Solo para **retirar la casilla**, al quitar el párrafo de avisos de la plantilla de Auth: `casilla_activa = false` y `casilla_activada_el` vacía. Antes, `AVISOS_NOVEDADES_REMOTOS = false` en la web y la app. No toca el envío ni los relojes. |
| `fallo_cerrado.sql` | Emergencia. Además, quita cualquier reloj cuya orden contenga `rwadar_novedades.`, **también el de limpieza**, y apaga los interruptores y la casilla (con su fecha) si existe el esquema. |

Tras `fallo_cerrado.sql` o tras reaplicar la 30, la casilla queda apagada: si
la web o la app la siguen enseñando, hay que repetir
`30_avisos_registrados_activar_casilla.sql` (el verificador lo recuerda).
Tras `fallo_cerrado.sql`, además, reaplicar la 30 para recuperar el reloj de
limpieza.

**Pruebas: `rwadar-app/probar-avisos-registrados.mjs`,** sobre la cadena de
producción. Dentro de `npm --prefix rwadar-app test`. Cubre:

- **Altas y confirmación:**
  - con el rol `supabase_auth_admin`;
  - con metadatos raros (texto, número, array y uno muy grande);
  - con una avería forzada en la tabla. La confirmación siempre pasa.
- **Permiso:**
  - solo en la confirmación;
  - con `casilla_activa = false`, unos metadatos válidos no dan permiso; con
    `true`, sí;
  - un alta hecha antes de activar la casilla y confirmada después no lo da;
    alta y confirmación después, sí; una confirmación reenviada después de
    activar, también; sin `confirmation_sent_at` (vacía o sin la columna), no;
  - `apagar.sql` no toca la casilla; `apagar_casilla.sql`, reaplicar la 30 y
    `fallo_cerrado.sql` sí, y el verificador avisa;
  - una baja no se deshace;
  - las cuentas existentes rellenadas;
  - `borrar_mi_cuenta` con filas en todas las tablas.
- **Catálogo:**
  - los lotes reales 2026-11-05 y 2026-11-05.2 dan 0 anuncios;
  - un lote inventado con una alta da 1 anuncio retenido y nada en las colas;
  - con `ofertas_automaticas`, publicado; `procesar()` lo reparte.
- **Envío:**
  - las peticiones a Brevo y Expo, con su pie y su baja;
  - las respuestas de Brevo, `duplicate_parameter` y `duplicate_request`
    incluidas;
  - un retenido creado antes de activar y publicado después se reparte;
  - la segunda comprobación antes de enviar;
  - límites y permisos de las funciones, `mi_aviso_push_registrado` incluida.
- **Limpieza:** colas y bienvenidas terminadas a los 90 días sin que la
  bienvenida se repita; también con todo apagado y sin haber activado nunca
  nada, con la orden del reloj diario; `limpiar()` no hace ninguna petición.
- **Convivencia con los filtros antiguos:** las órdenes de los dos relojes no
  casan con ningún `LIKE` de esos archivos (leídos de ellos); activar,
  reaplicar la 22, pasar los verificadores de 22 y 23 y fresh-install,
  `correo_fallo_cerrado` y `push_fallo_cerrado`, y otra vez la 22: los dos
  relojes nuevos siguen.
- **Restauración:** con la tabla `configuracion` vacía (copia anterior a la
  30), reaplicar la 30 recrea la fila apagada y el verificador pasa.
- **Textos:** el de la casilla coincide en la base, la web y la app.

## Web

- **Interruptor** `AVISOS_NOVEDADES_REMOTOS = false`. Con él apagado, la web no
  muestra nada de avisos y sus textos de hoy siguen siendo ciertos. La Academy
  con cuenta depende de `academy.json`, no de este interruptor.
- **Alta** (`acceso.html`, `assets/acceso.js`, `servidor.mjs`):
  - casilla obligatoria con los 18 años;
  - casilla `#avisos-novedades`, sin marcar, solo al crear la cuenta y con el
    interruptor encendido;
  - el servidor acepta `avisosNovedades` (booleano estricto). Si es `true` y
    su propio `AVISOS_NOVEDADES_REMOTOS` (en `servidor.mjs`) está encendido,
    añade a los metadatos `avisos_novedades: true`, `avisos_version` y
    `avisos_canal: 'web'`. Los tres interruptores de la web (`acceso.js`,
    `rwadar-20260820.js` y `servidor.mjs`) se encienden a la vez;
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
  - **Límite conocido:** la precarga ya no puede comparar con producción los
    bytes de las lecciones (sin sesión dan 303). Comprueba su estructura en la
    base sellada (`comprobarLeccionesPublicadas`); el texto de una lección solo
    cambia por el flujo normal desde `main`.
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
   pasar el verificador. Desde ese momento corre el reloj diario de limpieza,
   aunque todo siga apagado.
4. **Casilla visible:**
   - plantilla de Auth puesta;
   - `30_avisos_registrados_activar_casilla.sql` y el verificador 30 («casilla
     del alta activa»). Las altas cuyo correo de confirmación salió antes
     (con la plantilla antigua) no guardan el permiso aunque se confirmen
     después: se apuntan en Perfil;
   - `AVISOS_NOVEDADES_REMOTOS = true` en la web y la app;
   - privacidad al día;
   - publicar la web y enviar la OTA;
   - prueba con una cuenta propia: alta con la casilla marcada, confirmar y
     ver en Perfil que los avisos están activos.

   Si después se aplica `fallo_cerrado.sql` o se reaplica la 30, la casilla se
   apaga: mientras la web o la app la enseñen, repetir
   `30_avisos_registrados_activar_casilla.sql`. Para retirarla de verdad:
   `AVISOS_NOVEDADES_REMOTOS = false` (web y OTA),
   `30_avisos_registrados_apagar_casilla.sql` y la plantilla anterior
   (`plantillas-auth/LEEME.md`). `30_avisos_registrados_apagar.sql` no la toca.
5. **Correo:**
   - dominio propio;
   - Brevo con el dominio autenticado, el contrato de encargo aceptado y
     archivado, y el seguimiento de aperturas y clics desactivado;
   - secretos en el Vault;
   - **envío de prueba a una cuenta propia ANTES de dejar el reloj encendido
     para todos.** Lo que no se puede saber sin Brevo de verdad (el nombre de
     la cabecera de idempotencia, el código con que responde a un duplicado y
     si `List-Unsubscribe` llega al buzón) se comprueba aquí, no se supone.
     Durante la prueba no se publica ningún anuncio ni se lanza «Avisar
     novedad», y `ofertas_automaticas` sigue apagado: así solo pueden salir
     bienvenidas.
     1. `30_avisos_registrados_activar_correo.sql` y el verificador 30.
     2. Registrar una cuenta propia con la casilla marcada y confirmarla. En
        unos minutos llega la bienvenida.
     3. En el buzón: sin píxel, enlaces directos a `rwadar.pages.dev`, pie
        completo y la baja de principio a fin. En el original del mensaje,
        la cabecera `List-Unsubscribe` con el enlace y el `mailto:`.
     4. Idempotencia, en los 25 minutos siguientes al primer envío y cuando
        la cola ya la marca `aceptado`: devolver esa bienvenida a la cola con
        la misma clave
        (`update rwadar_novedades.correos set estado = 'pendiente', terminado_el = null where tipo = 'bienvenida' and estado = 'aceptado' and usuario_id = (select id from auth.users where email = '<la cuenta propia>');`)
        y ejecutar `select rwadar_novedades.procesar();`, y otra vez al cabo
        de un minuto para leer la respuesta
        (`select status_code, content from net._http_response order by id desc limit 3;`).
        Tiene que llegar **un solo** correo. Si Brevo responde 400, su `code`
        debe ser `duplicate_parameter` o `duplicate_request`; si usa otro, se
        añade a `leer_correos()` (nueva versión de la 30, con su prueba)
        antes de seguir.
     5. Si algo no cuadra (llegan dos correos, falta la cabecera, el código es
        otro): `30_avisos_registrados_apagar.sql` en ese momento (apaga el
        correo y su reloj; la casilla y el reloj de limpieza siguen), corregir
        y repetir la prueba desde el principio.

     Con todo correcto, el reloj se queda encendido para todos y se cambian
     las frases de «Al encender el correo».
   - **Si Brevo descarta `List-Unsubscribe`** (no llega al buzón): se quita
     del contrato (punto 3, «Baja») y de la privacidad, y la cabecera de
     `enviar_correos()` en una nueva versión de la 30 con su prueba. No se
     promete lo que no llega. La baja sigue en el pie de cada aviso (enlace y
     `mailto:`) y en Perfil.
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

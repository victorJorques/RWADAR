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

**Cambio del 08/11/2026 (petición de Víctor):** sin sesión, el índice y el
bloque de lecciones de la portada enseñan las lecciones difuminadas y con un
candado; se abren al entrar con una cuenta confirmada. Detalle en
`rwadar-academy/LEEME.md`, «El candado del índice y de la portada». La puerta
del servidor no cambia.

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
  Por prudencia: la AEPD (E/01415/2017) no consideró comercial un correo que
  solo pide el permiso, pero el ICO británico sí, y mezclarlo con la
  bienvenida la volvería comercial.
- No da número de lecciones.
- Cierra con «Si no creaste esta cuenta, escríbenos y la borramos».
- El pie de todos los correos nombra al responsable (Víctor Manuel Jorques
  Granero, con la dirección postal del aviso legal) y enlaza el aviso legal y
  la privacidad.
- Solo lleva `List-Unsubscribe` si la persona se apuntó a los avisos.
- A quien se apuntó le confirma la suscripción y le da el enlace de baja.

### 3. Avisos de novedades: ofertas nuevas y actualizaciones, solo con permiso

La LSSI (art. 21) y el RGPD (art. 7.4) no dejan apuntar a nadie a avisos de
ofertas por el mero hecho de registrarse, ni condicionar la Academy a ello.

**Casilla aparte, sin marcar, al crear la cuenta.** Versión `novedades-v2-2026-11-06`
(la v1 se sustituyó tras la revisión legal del 06/11/2026 sin haber recogido
ningún permiso: la casilla nunca se llegó a mostrar).

- Texto en español:
  > Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil,
  > como notificaciones: fichas nuevas en el radar y novedades de la web y la
  > app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en
  > Perfil o con el enlace de cada correo; las notificaciones también se quitan
  > en los ajustes del móvil. Más información en Privacidad.
- Texto en inglés:
  > I want to receive RWAdar notices by email and, if I enable them on my
  > phone, as notifications: new listings on the radar and news about the
  > website and the app. It's optional: the Academy unlocks anyway. You can
  > unsubscribe in Profile or with the link in every email; notifications can
  > also be turned off in your phone settings. More information in Privacy.
- Junto a la casilla (y junto al interruptor de Perfil) va la información
  básica de protección de datos: responsable, datos, finalidad, base,
  proveedores y derechos. No forma parte del texto versionado.

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
  `{{ if .Data.avisos_novedades }}`: «Marcaste también la casilla de avisos
  de novedades: al confirmar tu correo quedarán activados. Si solo querías la
  cuenta, confírmala igualmente y desactívalos en Perfil».
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
  rwadares@gmail.com. Las dos cosas van en el pie y en `List-Unsubscribe`.
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
  - texto fijo, con el riesgo delante: «Información, no recomendación:
    aparecer en el radar no es un respaldo y puedes perder lo invertido. RWAdar
    no intermedia y nadie paga por aparecer en este aviso. Consulta en el radar
    qué ha entrado y con qué fuentes.»
  - No se pone «Publi»: el art. 20.1 LSSI no lo exige desde la Ley 9/2014 y
    aquí haría pensar que alguien paga. Si algún día hay contenido pagado, se
    marca como publicidad (LSSI 20.1, Ley de Competencia Desleal 26) y se
    revisa aparte.
- **Como mucho un anuncio de ofertas al día** (clave `ofertas:AAAA-MM-DD`),
  aunque haya entregas `.2` y `.3`.
- **Todos los anuncios pasan un filtro de palabras** (comprobación de la
  tabla): sin «oportunidad», «rentabilidad», «garantiz…», «%», «rendimiento»,
  «APY», «APR», «sin riesgo», «exclusiv…», «últimas plazas», «no te lo
  pierdas», «gana…», «regalo», «bono», «descuento» ni «autorizad…».

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

**Cambios de la revisión legal del 06/11/2026** (LSSI, RGPD y LOPDGDD), dentro
de la 30 antes de aplicarla:

- Versión del permiso **`novedades-v2-2026-11-06`**, con los textos de abajo.
  Sustituye a la v1 (`novedades-v1-2026-11-05`), con la que nunca se recogió
  ningún permiso: la casilla no llegó a enseñarse. La base ya no acepta la v1
  ni en el alta ni en Perfil.
- **Historial del permiso** (`historial_permiso`), solo de añadir, que
  sobrevive bloqueado 3 años al borrado de la cuenta (LOPDGDD art. 32).
- **Baja por correo** (`rwadar_novedades.baja_por_correo`), solo para el
  propietario.
- Titular en el pie de todos los correos, bienvenida y aviso fijo de ofertas
  nuevos, filtro de palabras ampliado y canales de Android separados.
- Los anuncios no se borran nunca: son la copia de cada aviso enviado.

**Textos exactos en la base** (cambiar una sola palabra de la casilla obliga a
una versión nueva; la web y la app deben decir lo mismo):

- Casilla, en español (`texto_consentimiento_es`):
  > Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil,
  > como notificaciones: fichas nuevas en el radar y novedades de la web y la
  > app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en
  > Perfil o con el enlace de cada correo; las notificaciones también se quitan
  > en los ajustes del móvil. Más información en Privacidad.
- Casilla, en inglés (`texto_consentimiento_en`):
  > I want to receive RWAdar notices by email and, if I enable them on my
  > phone, as notifications: new listings on the radar and news about the
  > website and the app. It's optional: the Academy unlocks anyway. You can
  > unsubscribe in Profile or with the link in every email; notifications can
  > also be turned off in your phone settings. More information in Privacy.
- Aviso fijo del anuncio de ofertas (el riesgo va delante):
  > Información, no recomendación: aparecer en el radar no es un respaldo y
  > puedes perder lo invertido. RWAdar no intermedia y nadie paga por aparecer
  > en este aviso. Consulta en el radar qué ha entrado y con qué fuentes.
- Bienvenida por correo (asunto «Te damos la bienvenida a RWAdar», sin
  cambios). Párrafo para quien se apuntó: «Además, te has apuntado a los
  avisos de novedades: te avisaremos de las fichas nuevas que entren en el
  radar y de las novedades de la web y la app. Puedes darte de baja cuando
  quieras con el enlace del final o en tu Perfil.» Cierre: «Si no creaste esta
  cuenta, escríbenos y la borramos» (en HTML, «escríbenos» enlaza al
  `mailto:`; en texto, «escríbenos a rwadares@gmail.com y la borramos»).
- Primera línea del pie de todos los correos (desde la 31): «Te escribe
  RWAdar, un radar independiente de plataformas de tokenización. Responsable:
  Víctor Manuel Jorques Granero, Plaza Generalitat, s/n, 46600 Alzira
  (Valencia), España (aviso legal · privacidad).» En texto plano, la misma
  frase terminada en «España.», sin el paréntesis: los enlaces del aviso
  legal y de la privacidad van en las líneas siguientes. (En la 30 decía
  solo «Víctor Manuel Jorques Granero, España».) **Desde la 34**
  (12/11/2026, a petición de Víctor: «todo lo que puedas quitar mi nombre
  hazlo»), «Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600
  Alzira (Valencia), España (aviso legal · privacidad).»: el nombre queda en
  el aviso legal enlazado. Las plantillas de Auth, igual: «RWAdar · Plaza
  Generalitat, s/n, 46600 Alzira (Valencia), España · Aviso legal ·
  Privacidad · rwadares@gmail.com».
- Bienvenida por push (título «RWAdar», canal `cuenta`): «Notificaciones
  activadas en este móvil. Las de novedades solo llegan si las tienes
  activadas en Perfil.»

**Esquema privado `rwadar_novedades`.**

- Se llama así para que ningún filtro antiguo lo confunda. Los `LIKE
  '%avisos_ciclo%'` o `'%push_soltar%'` de 22, 23, `correo_fallo_cerrado` y los
  verificadores no lo tocan.
- No tiene `usage` para `public`, `anon` ni `authenticated`, ni se expone por REST.
- Cada función nueva lleva `revoke all … from public, anon, authenticated` y
  después solo el permiso justo.
- Se repiten los `revoke` de 23 sobre `vault.decrypted_secrets` y `net.*`.

**Tablas.** Todas las que apuntan a una cuenta lo hacen con `on delete cascade`
hacia `auth.users`, para que `borrar_mi_cuenta` funcione, **salvo
`historial_permiso`**, que a propósito no tiene clave ajena: se queda al borrar
la cuenta.

| Tabla | Para qué |
|---|---|
| `configuracion` | Fila única. Interruptores `correo_habilitado`, `push_habilitado` y `ofertas_automaticas`, los tres `false` al instalar, con `correo_activado_el` y `push_activado_el`. `casilla_activa`, también `false` al instalar: sin ella, los metadatos del alta no dan permiso. `casilla_activada_el`: cuándo se encendió la casilla (la base no deja encenderla sin esa fecha). También `version_consentimiento = 'novedades-v2-2026-11-06'`, `texto_consentimiento_es` y `texto_consentimiento_en` (los de arriba). |
| `preferencias` | Una fila por cuenta: `usuario_id`, `novedades`, `aceptado_el`, `version`, `origen` (`alta`/`perfil`), `canal` (`web`/`app`), `alta_el`, `baja_token` (`gen_random_uuid()`, único), `baja_el` y `actualizado_el`. Más `bienvenida_correo_el` y `bienvenida_push_el`: cuándo se encoló cada bienvenida. Con la marca puesta no se vuelve a encolar. |
| `historial_permiso` | Solo de añadir. Una fila por cada alta y cada baja del permiso: `usuario_id` (**sin** clave ajena), `correo` (el de `auth.users` en ese momento), `accion` (`alta`/`baja`), `version` (obligatoria en las altas; en una baja, la retirada si estaba apuntada), `idioma` (`es`/`en` o vacío), `origen` (`alta`, `perfil`, `enlace` o `correo`), `canal` (`web`/`app` o vacío), `creado_el` y `cuenta_borrada_el`. Filas: al guardar el permiso en la confirmación (alta/alta, idioma de `avisos_idioma` si es `'es'` o `'en'`), en `configurar_avisos_novedades` solo si cambia el estado (perfil), en `baja_avisos` (enlace) y en `baja_por_correo` (correo). El alta y su fila van juntas (sin la prueba no hay permiso); una baja se aplica aunque su fila fallara (warning con el sqlstate). El disparador `historial_solo_anadir` no deja cambiar nada salvo poner `cuenta_borrada_el` una vez, ni borrar filas antes de 3 años desde esa fecha. Mismos `revoke` que el resto. |
| `anuncios` | `id`, `tipo` (`ofertas`, `actualizacion` o `novedad`), `clave` única, `estado` (`retenido` o `publicado`), `titulo` (3-90 caracteres), `texto` (3-400), `enlace` y `revision_id`. Fechas: `creado_el`, `publicado_el`, `correo_repartido_el` y `push_repartido_el`. Título y texto sin caracteres de control. El enlace debe cumplir `^https://rwadar\.pages\.dev(/[A-Za-z0-9._~%-]+)*/?([?#][A-Za-z0-9._~%=&-]*)?$` y tener 200 caracteres como mucho. Filtro de palabras (`anuncio_sin_palabras_vetadas`, sin distinguir mayúsculas): «oportunidad», «rentabilidad», «garantiz…», «%», «rendimiento», «APY» y «APR» (sueltas: «aprende» pasa), «sin riesgo», «exclusiv…», «últimas plazas», «no te lo pierdas», «gana…» (al empezar palabra: «veganas» y «organización» pasan), «regalo», «bono» (suelto: «bonos» y «abono» pasan), «descuento» y «autorizad…». Ojo: «mejoras de rendimiento» no pasa. Reaplicar la 30 rehace el filtro sin tocar los anuncios guardados: si alguno antiguo no lo cumple, se conserva, queda sin validar (warning) y ya no se puede publicar. **No se borra nunca**: es la copia de cada aviso, para posibles requerimientos. |
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
| Al confirmar el correo: `after insert or update of email_confirmed_at on auth.users`, solo si pasa de vacío a fecha (o la cuenta nace confirmada) y `is_anonymous is not true` | Crea las preferencias. El permiso, solo en el UPDATE, con `casilla_activa`, con las condiciones del punto 3 y si el correo de confirmación salió **después** de encender la casilla: `confirmation_sent_at` de Auth `>= casilla_activada_el`. Un alta anterior recibió el correo antiguo, sin el aviso, y confirmarla después no la apunta (se apunta en Perfil); si Auth le reenvía la confirmación ya con la plantilla nueva, sí cuenta. `confirmation_sent_at` se lee con `to_jsonb(new)`: si falta o está vacía, no hay permiso, y la confirmación pasa igual. Con el permiso, en el mismo bloque, la fila alta/alta del historial con el correo, el canal y el idioma (`avisos_idioma` de los metadatos, solo `'es'` o `'en'` como texto): si esa fila falla, no se guarda el permiso (la confirmación pasa igual y la cuenta queda para el relleno, sin permiso). Si `correo_habilitado` y la cuenta aún no tiene `bienvenida_correo_el`, pone la marca y encola la bienvenida. |
| Al borrar una cuenta: `rwadar_novedades_borrado`, `before delete on auth.users` (borrar_mi_cuenta, el panel o la API de Auth; el «soft delete» no lo dispara) | Pone `cuenta_borrada_el = now()` en su historial del permiso, que se queda bloqueado. **Nunca impide el borrado:** captura cualquier error, deja un warning con el sqlstate y siempre devuelve `OLD`. Si falla, `limpiar()` marca después las filas que se quedaron sin cuenta. |
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
  - **Correo con Lettermint** (migración 31, `31_correo_lettermint.sql`, del
    06/11/2026). La 30 lo hacía con Brevo, que la revisión legal descartó por
    el píxel de apertura; la 31 sustituye solo las tres funciones del correo
    (`correo_mensaje`, `enviar_correos` y `leer_correos`) y no enciende nada:
    - `POST https://api.lettermint.co/v1/send` con el token del proyecto en
      la cabecera `x-lettermint-token`. En el Vault: `LETTERMINT_API_TOKEN` y
      `RWADAR_REMITENTE`. Si faltan o no valen: «correo bloqueado:
      credenciales de Lettermint ausentes o no válidas en Vault»;
    - HTML escapado, y siempre
      `"settings": {"track_opens": false, "track_clicks": false}`;
    - la bienvenida, por la ruta de servicio (la de por defecto, sin
      `route`); los anuncios, por la de difusión (`"route": "broadcast"`);
    - la clave idempotente de la fila va en la cabecera HTTP
      `Idempotency-Key`, la misma en cada reintento (no dentro de las
      cabeceras del correo). Lettermint la guarda 24 horas: con la misma clave
      y el mismo cuerpo devuelve el mismo `message_id` y no envía otro;
    - respuestas: 202 con `message_id`, aceptado. 409, «incierto»: nunca se
      reenvía solo («Lettermint: clave idempotente ya usada o en curso;
      revisar en el panel, no reenviar automáticamente»). Otro 4xx salvo 408
      y 429, fallido («Lettermint rechazó la petición (HTTP n)»). 5xx, 408,
      429 o sin respuesta: reintento, como en la 30 (hasta 5, y la regla de
      «incierto» a los 25 minutos);
    - sin `tag` ni `metadata`: no se manda a Lettermint nada que no haga falta.

    Se confirma en la prueba real del paso 5 de la activación: el nombre de la
    ruta de difusión, qué hace con nuestro `List-Unsubscribe` (esa ruta pone
    el suyo) y que el correo llega sin píxel ni enlaces reescritos.
    **Ojo:** reaplicar la 30 devuelve esas tres funciones a Brevo; después
    hay que reaplicar la 31.
  - Push con Expo: canales de Android separados, la bienvenida por `cuenta`
    y los anuncios por `novedades` (la app tiene que crear los dos), con
    `data: {tipo, destino}` con `destino` ∈
    `inicio`, `buscar`, `academy`, sin datos personales. `getReceipts` lee los
    resultados y `DeviceNotRegistered` borra el token.
  - Si existe `EXPO_ACCESS_TOKEN` en el Vault, va como `Authorization`.
- **Justo antes de enviar vuelve a mirar** que la cuenta siga confirmada, con
  `novedades` y versión vigente (salvo la bienvenida), y que el token exista.
  Si no, lo cierra sin enviarlo.
- **Pie de cada aviso:**
  - quién envía (RWAdar y su responsable, Víctor Manuel Jorques Granero,
    con enlace al aviso legal y la privacidad). Desde la 31, con su dirección
    postal, la del aviso legal: «Plaza Generalitat, s/n, 46600 Alzira
    (Valencia), España». La pide la política de uso de Lettermint en cada
    correo;
  - por qué lo recibe;
  - la baja (enlace y `mailto:`).
- **Limpieza (`limpiar()`):**
  - colas terminadas, a los 90 días, también las bienvenidas. No se repiten:
    la marca `bienvenida_correo_el`/`bienvenida_push_el` vive en preferencias
    y se va con la cuenta;
  - dispositivos sin actualizar, a los 180. La app volverá a llamar a
    `registrar_aviso_push` una vez al día, lo que renueva `actualizado_el`;
  - historial del permiso de cuentas borradas, a los 3 años de
    `cuenta_borrada_el` (prescripción, LOPDGDD art. 72); nunca el de una
    cuenta viva. Antes marca hoy las filas de cuentas que ya no existen y
    seguían sin marca (si falló el disparador de borrado);
  - **los anuncios no se borran nunca**: son la copia de cada aviso enviado;
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
| `public.configurar_avisos_novedades(p_activar boolean, p_version text, p_canal text, p_idioma text default null) → jsonb` | Para activar, `p_version` debe ser la vigente (la v1 ya no vale). `p_idioma`, opcional: `'es'`, `'en'` o nada (otro valor, 22023); las llamadas de hoy con tres argumentos siguen valiendo. La firma antigua de tres argumentos se quita. Crea la fila si falta y devuelve lo mismo que la anterior. Solo un cambio de estado deja fila en el historial (perfil): activar ya activado o desactivar ya desactivado no cambia nada. |
| `public.registrar_aviso_push(p_token text, p_plataforma text) → boolean` | Aplica el formato y el límite de 5. Si `push_habilitado` y la cuenta aún no tiene `bienvenida_push_el`, pone la marca y encola la bienvenida: una sola vez por cuenta (si se quita el móvil antes de que salga, no se vuelve a encolar). Volver a llamarla con el mismo token renueva `actualizado_el`; la app lo hará una vez al día. |
| `public.quitar_aviso_push(p_token text) → boolean` | Quita un token propio. |
| `public.mi_aviso_push_registrado(p_token text) → boolean` | Dice si ese token sigue registrado **en la cuenta de la sesión**; nunca mira los de otras. Sirve a la app para saber si debe volver a registrar su móvil (la base lo borra a los 180 días sin renovar, con `DeviceNotRegistered` o al pasar de 5). |
| `public.mis_avisos_recientes(p_limite int default 20) → setof jsonb` | `p_limite` va de 1 a 50. Devuelve los anuncios `publicado` de los últimos 90 días más la bienvenida de la cuenta, con `id` `'bienvenida'`. Cada uno lleva `{id, tipo, titulo, texto, enlace, creado_el}`. |
| `public.baja_avisos(p_token uuid) → boolean` | Para `anon` y `authenticated`. Pone `novedades = false` y `baja_el` y añade la fila baja/enlace del historial (con la versión retirada si estaba apuntada). |
| `rwadar_novedades.baja_por_correo(p_email text) → boolean` | Solo el propietario de la base (`revoke` a `public`, `anon`, `authenticated` y `service_role`; el verificador lo comprueba), desde el SQL Editor, antes del siguiente envío: `select rwadar_novedades.baja_por_correo('persona@ejemplo.com');`. Busca la cuenta por su correo sin distinguir mayúsculas, pone `novedades = false` y `baja_el`, añade la fila baja/correo y devuelve si la encontró. Si la cuenta aún no tiene preferencias (sin confirmar), se las crea dadas de baja: confirmar después no la apunta. |
| `rwadar_novedades.anunciar(p_tipo, p_clave, p_titulo, p_texto, p_enlace) → bigint` | Solo el propietario de la base. Crea el anuncio ya `publicado` y no repite claves. |
| `rwadar_novedades.publicar_anuncio(p_id bigint) → boolean` | Solo el propietario de la base. Pasa un retenido a `publicado`. |

**Scripts que acompañan a la 30.**

| Script | Qué hace |
|---|---|
| `30_avisos_registrados.sql` (reaplicada) | Vuelve al estado de instalación: todo apagado, **casilla incluida** (`casilla_activa = false`, `casilla_activada_el` vacía), sin reloj de envío y con el de limpieza. No borra filas. |
| `30_avisos_registrados_verificar.sql` | Solo lee. Comprueba la versión v2 y sus textos, los interruptores, los permisos de cada función (`baja_por_correo` solo del propietario), que no haya ninguna cuenta confirmada sin preferencias, el reloj de envío y el diario de limpieza, el historial del permiso (sin clave ajena, con `historial_solo_anadir` y el disparador `BEFORE DELETE` en `auth.users`), que no quede la firma antigua de `configurar_avisos_novedades`, que `limpiar()` limpie el historial a los 3 años y nunca los anuncios, y el filtro de palabras ampliado. Informa de si la casilla del alta está activa; si no lo está, avisa (WARNING): «casilla del alta inactiva: si la web o la app enseñan la casilla, ejecuta `30_avisos_registrados_activar_casilla.sql`». |
| `30_avisos_registrados_activar_casilla.sql` | Paso 4, con la plantilla de Auth ya puesta. Pone `casilla_activa = true` y `casilla_activada_el` (si ya estaba activa, conserva la fecha): desde entonces cuenta el permiso de las altas cuyo correo de confirmación sale desde ese momento. No envía nada ni crea reloj. |
| `30_avisos_registrados_activar_correo.sql` | Exige la 31, la 34 (el pie sin el nombre del titular) y los secretos en el Vault. Enciende el correo, fija `correo_activado_el` y crea el reloj de envío. No toca el de limpieza. |
| `30_avisos_registrados_activar_push.sql` | Lo mismo para el push. |
| `30_avisos_registrados_apagar.sql` | Apaga el **envío**: correo, push, `ofertas_automaticas` y el reloj de envío. **No** toca la casilla del alta (la web y la app la siguen enseñando y quien la marca guarda su permiso) ni el reloj de limpieza. |
| `30_avisos_registrados_apagar_casilla.sql` | Solo para **retirar la casilla**, al quitar el párrafo de avisos de la plantilla de Auth: `casilla_activa = false` y `casilla_activada_el` vacía. Antes, `AVISOS_NOVEDADES_REMOTOS = false` en la web y la app. No toca el envío ni los relojes. |
| `fallo_cerrado.sql` | Emergencia. Además, quita cualquier reloj cuya orden contenga `rwadar_novedades.`, **también el de limpieza**, y apaga los interruptores y la casilla (con su fecha) si existe el esquema. No toca el historial del permiso ni su disparador de borrado. |

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
    incluidas (con la 31, las de correo pasan a Lettermint: petición,
    cabeceras, `settings`, ruta y los códigos 202, 409, otros 4xx y 5xx);
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
- **Ensayo del flujo «Avisos a registrados (base)»:** la 30 sin su `commit;`
  final, el verificador sin su `begin` ni su `rollback;` y un `rollback`, igual
  que en `.github/workflows/avisos-base.yml`: pasa y no deja nada.
- **Historial del permiso:** alta → baja (enlace) → alta (Perfil) deja 3
  filas con su origen, canal, idioma y correo; activar ya activado o
  desactivar ya desactivado no deja fila; `baja_por_correo` sin distinguir
  mayúsculas, solo para el propietario, también con una cuenta sin confirmar;
  no se puede cambiar ni borrar una fila; con el historial averiado, la
  confirmación pasa sin guardar el permiso; borrar la cuenta (con
  `borrar_mi_cuenta` o con el rol de Auth) conserva las filas con
  `cuenta_borrada_el`; con el disparador de borrado averiado, la cuenta se
  borra igual y `limpiar()` marca después las filas; `limpiar()` las borra a
  los 3 años, no antes, y nunca las de cuentas vivas.
- **Anuncios:** el filtro ampliado (y con límites de palabra para «bonos»,
  «aprende» u «organización»); los anuncios no se limpian, tampoco uno de
  hace 4 años; reaplicar la 30 con un anuncio antiguo que el filtro nuevo veta
  pasa, lo conserva y ya no deja publicarlo.
- **Textos:** el de la casilla v2, el aviso fijo, la bienvenida, el pie con el
  titular y el push de bienvenida, literales. La casilla coincide con la de la
  web y la app en cuanto declaran la v2 (mientras declaren la v1, la prueba
  solo lo avisa).

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
    aviso, sin píxel ni seguimiento de clics, proveedores Lettermint y
    Expo/FCM,
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
| Al pasar Auth a Lettermint (punto 5.8 de «Activación») | `privacidad.html:376-379` (§6: «a través de una cuenta de Gmail de RWAdar»), `495-501` (§8, Google / Gmail: «envía además los correos de confirmación y de recuperación»), `502-508` (§8, Lettermint: «solo si se activa en el futuro el envío de avisos por correo») y la fecha<br>«Información básica», ES y EN, web y app: `acceso.html:56`, `index.html:1575`, `rwadar-20260820.js:4182`, `avisos-cuenta.js:24-25`, `idioma-en.js` (y su copia de la web): «Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo»<br>Las pruebas que exigen las frases de hoy: `probar-web.mjs:2852, 2928-2934` y las de `rwadar-movil` y `rwadar-acceso` |
| Al encender el correo | `privacidad.html:380-382, 407-409, 502-508`<br>`App.js:1807-1809` |
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
del punto 3. `recuperar-acceso.html` es la recuperación de contraseña. Las dos
llevan en el pie la dirección postal del responsable, como los avisos: desde
el punto 5.8 de «Activación» salen por el SMTP de Lettermint, cuya política
de uso la pide en cada correo.

Ponerla en el panel de Supabase es tocar Supabase en línea: requiere permiso
de Víctor.

## Activación (cada paso, con permiso expreso de Víctor)

1. **Cierre de la Academy.** ✅ Visto bueno de Eric (06/11/2026) y orden de
   Víctor de publicar hoy. Sellar, PR, merge, «Publicar web» y la OTA.
2. **Revisión legal.** ✅ Hecha por Claude a petición de Víctor (06/11/2026):
   [`legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`](../legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md).
   Sus cambios obligatorios antes de los pasos 4 a 6 ya están en el código;
   lo que queda (contratos de encargo, proveedor de correo sin píxel,
   autoarranque de Firebase) está en su apartado de pendientes. El proveedor
   ya está elegido: Lettermint (ver su anexo del 06/11/2026), y los contratos
   están archivados en
   [`legal/encargados/`](../legal/encargados/README.md). La licencia escrita de Eric
   ya existe (06/11, la guarda Víctor fuera de Git).
3. **Base de datos:** ✅ la 30 se aplicó el 06/11/2026 con el flujo «Avisos a
   registrados (base)», con copia previa, y pasó el verificador. Desde ese
   momento corre el reloj diario de limpieza (`rwadar-novedades-limpieza`,
   04:41 UTC), aunque todo siga apagado.
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
5. **Correo, con Lettermint.** Lo hace Víctor, en este orden. Cada paso que
   toca Supabase, con su orden expresa. Ni bienvenidas ni avisos salen hasta
   el punto 11; desde el punto 8, eso sí, la confirmación y la recuperación de
   las cuentas ya salen por Lettermint en vez de por Gmail.
   1. **Comprar el dominio.** Recomendado `rwadar.app`, en Cloudflare ›
      Domain Registration: la web ya está en Cloudflare, así que los registros
      DNS se ponen en el mismo panel. `rwadar.com` y `rwadar.io` los tiene
      aparcados un tercero, a la venta en Afternic. `rwadar.es` también parece
      libre, pero Cloudflare no vende `.es`: habría que comprarlo en otro
      sitio. (Un `.app` solo abre webs con `https`; para el correo da igual.)
      Precio: Cloudflare cobra lo que pide el registro, sin margen. Para
      `.app`, unos 8 $ el primer año y unos 14 $ cada renovación
      (cfdomainpricing.com, que no es de Cloudflare: «.app US$8.20
      US$14.20», consultado el 07/11/2026). La página de Cloudflare no se
      pudo abrir sin sesión: el precio exacto sale en el carrito
      (**verificar** al pagar).
   2. **Crear la cuenta de Lettermint y un proyecto** («RWAdar»). Al crear la
      cuenta se acepta su contrato de encargo: apuntar la fecha en
      [`legal/encargados/README.md`](../legal/encargados/README.md). Usar un
      correo de cuenta que se revise: ahí avisan de brechas y de subencargados
      nuevos.

      **Y pedir la verificación de la cuenta** con su formulario de
      cumplimiento. Borrador de las respuestas:
      [`LETTERMINT-VERIFICACION-RESPUESTAS.md`](LETTERMINT-VERIFICACION-RESPUESTAS.md).
      Lettermint revisa cada equipo nuevo, y hasta que lo aprueba «Unverified
      teams can only send to verified team members and test addresses»
      (https://docs.lettermint.co/platform/onboarding/compliance-verification,
      consultado el 07/11/2026). Su página no dice cuánto tarda. Mientras
      tanto se puede avanzar con el dominio, los tokens, el Vault, las
      plantillas y la privacidad (puntos 3 a 8.3), y hacer la prueba del
      punto 10 al buzón de la cuenta de Víctor, pero **no el 5.8.4**: con la
      cuenta sin aprobar, las confirmaciones y recuperaciones de la gente no
      saldrían.

      Lo que da el plan gratis (https://lettermint.co/pricing, consultado el
      07/11/2026): **300 correos al mes en total**, sin límite diario; 1
      dominio de envío, 1 proyecto y 1 usuario; sin seguimiento de aperturas
      ni de clics; historial de mensajes de 28 días. Los 300 son para todo:
      confirmaciones y recuperaciones de Auth, bienvenidas y anuncios (ver el
      punto 11).
   3. **Añadir el dominio en Lettermint** y copiar los registros DNS que pida
      (normalmente SPF, DKIM y DMARC) en Cloudflare › el dominio › DNS.
      Esperar a que Lettermint lo dé por verificado.
   4. **Crear dos tokens del proyecto** en Lettermint, uno para cada uso. Su
      lista de comprobación para producción pide «a separate Project API token
      for each app, worker, or environment»
      (https://docs.lettermint.co/production-checklist, consultado el
      07/11/2026), y un proyecto puede tener varios («Each project can have
      multiple Project API tokens»). Así, si uno se filtra, se revoca solo ese:
      - **«RWAdar base (API)»:** el de la base de datos. Va al secreto de
        GitHub del punto 5 y de ahí al Vault (punto 7);
      - **«RWAdar Auth (SMTP)»:** el de Supabase Auth. Víctor lo pega
        **directamente** como contraseña en el panel de Supabase (punto
        5.8.4). No pasa por GitHub.

      Cada token se ve una sola vez al crearlo. No se pega en ningún chat,
      archivo ni captura. Si se usa la sincronización automática de bajas
      (punto 9), hace falta además un token **de equipo** (Team API), con el
      menor permiso que deje leer las supresiones: el de proyecto no sirve
      para listarlas. Los tokens de equipo tienen permisos por partes, pero la
      página de supresiones solo nombra `write:suppressions`, que es para
      borrarlas (**verificar** en el panel cuál basta para leer).
   5. **Guardar el token «RWAdar base (API)» como secreto de GitHub** con el
      nombre `LETTERMINT_API_TOKEN` (repositorio › Settings › Secrets and
      variables › Actions › New repository secret).
   6. **Aplicar la 31.** ✅ Hecho el 06/11/2026 (ensayo y aplicar con copia
      previa; verificadores 30 y 31 «OK»; el correo sigue apagado). Si alguna
      vez hay que repetirlo: GitHub › Actions › «Avisos a registrados (base)»,
      primero `ensayo-31` (la prueba y la deshace; no cambia nada) y después
      `aplicar-31` escribiendo `AVISOS` (hace una copia antes y pasa los
      verificadores). No enciende nada.
   7. **Guardar el correo en el Vault.** Mismo flujo, acción
      `guardar-correo`, con `remitente` = `avisos@<dominio>` (por ejemplo,
      `avisos@rwadar.app`) y `AVISOS`. Copia el secreto de GitHub al Vault y
      guarda el remitente. Tampoco enciende nada.
   8. **Pasar los correos de Auth a Lettermint** (confirmación de cuenta y
      recuperación de contraseña). En este orden; cada parte que toca
      Supabase o publica, con orden de Víctor:
      1. **Plantillas con la dirección postal.** La política de uso de
         Lettermint pide una dirección física en cada correo, también en los
         de servicio. Supabase › Authentication › Emails › Templates:
         `rwadar-app/plantillas-auth/confirmar-alta.html` en *Confirm signup*
         y `recuperar-acceso.html` en *Reset password*, con sus asuntos
         ([`plantillas-auth/LEEME.md`](../../rwadar-app/plantillas-auth/LEEME.md)).
         Si hay otra plantilla activa en el panel, el mismo pie.
      2. **Privacidad al día y publicada antes de cambiar el SMTP** (fila «Al
         pasar Auth a Lettermint» de la tabla «Frases que dejan de ser
         ciertas»). Si no, cada alta y cada recuperación pasarían por un
         encargado que la privacidad no nombra (RGPD, art. 13.1.e):
         - §6: «Salen del servicio de autenticación de Supabase a través de
           Lettermint (apartado 8).», en lugar de «… a través de una cuenta de
           Gmail de RWAdar (apartado 8).»;
         - §8, entrada de Google / Gmail: se quita la frase de la
           confirmación y la recuperación; Gmail queda solo para los
           contactos de empresa;
         - §8, entrada de Lettermint: «envía los correos de confirmación y de
           recuperación de la cuenta (apartado 6) y, si se activan, los avisos
           por correo», en lugar de «solo si se activa en el futuro el envío
           de avisos por correo»;
         - la «Información básica» (web y app, ES y EN): Lettermint pasa a la
           lista de proveedores de la cuenta, y Google sale de ella si, sin el
           Gmail, ya no trata datos de la cuenta. No es el texto del permiso:
           la versión `novedades-v2-2026-11-06` no cambia;
         - la fecha de la privacidad y las pruebas que exigen las frases de
           hoy.

         Publicar la web y, si cambia la app, enviar la OTA.
      3. **Seguimiento apagado en la ruta de servicio.** Por SMTP no van los
         `settings` de la API. En el plan gratis Lettermint no ofrece el
         seguimiento: su página de rutas dice «Email tracking is available on
         paid plans» (https://docs.lettermint.co/platform/projects-and-routes/routes)
         y la de precios marca «-» en aperturas y clics del plan Free (las dos,
         consultadas el 07/11/2026). Aun así, mirar en el panel que la ruta de
         servicio (la de por defecto) no lo tiene encendido. Si algún día se
         pasa a un plan de pago, volver a comprobarlo aquí.
      4. **El SMTP.** Solo cuando Lettermint haya **aprobado la verificación
         de la cuenta** (punto 2): antes, los correos de Auth a la gente no
         saldrían. Supabase › Authentication › Emails › SMTP Settings:
         - Host `smtp.lettermint.co` · Port `587` (STARTTLS);
         - Username `lettermint` · Password: el token **«RWAdar Auth (SMTP)»**
           del punto 4, no el de la base;
         - Sender email: el mismo remitente, `avisos@<dominio>` · Sender
           name: `RWAdar`.

         Datos del SMTP según https://lettermint.co/docs/guides/send-email-with-smtp
         (consultado el 07/11/2026): host `smtp.lettermint.co`, puerto 587 con
         STARTTLS o 465 con TLS directo, usuario `lettermint` y como contraseña
         un token de proyecto. Sin la cabecera `X-Lettermint-Route`, el correo
         va por la ruta por defecto del proyecto.
      5. **Prueba:** «¿Has olvidado tu contraseña?» con una cuenta propia. En
         el original del mensaje: ningún píxel, el enlace sin reescribir y el
         pie con la dirección postal. Si algo falla, se vuelve a poner el
         Gmail en SMTP Settings (y la privacidad anterior) y no se sigue.
      6. Con todo bien, quitar el Gmail: borrar la contraseña de aplicación de
         `rwadares@gmail.com` (myaccount.google.com › Seguridad › Contraseñas
         de aplicaciones). Desde aquí ningún correo de RWAdar sale sin
         contrato de encargo (revisión legal, 5.8).
   9. **Pedir al soporte de Lettermint** que quite de la ruta de difusión su
      enlace de baja automático, porque RWAdar ya tiene su baja (enlace
      `/baja`, `mailto:` y `List-Unsubscribe` en cada aviso, y el interruptor
      de Perfil). **Lo más probable es que en el plan gratis digan que no.**
      Su página de rutas (consultada el 07/11/2026) dice que la baja alojada
      «automatically adds an unsubscribe link to broadcast emails», que para
      quitarla hay que escribir al soporte, que «This option is only granted
      to trusted senders» y, en la lista de funciones, «Hosted unsubscribe
      pages (can be disabled on higher plans)». Por eso la sincronización de
      bajas se automatiza: flujo «Correo Lettermint», acción
      `sincronizar-bajas` (preparado el 07/11/2026, apagado; usa el token de
      equipo del punto 4). Pide a Lettermint sus bajas de las rutas de
      difusión y aplica cada una con `rwadar_novedades.baja_por_correo`.
      Hasta que esté encendido y probado, se hace a mano: antes de cada
      anuncio y, si `ofertas_automaticas` está encendido, cada día, mirar en
      Lettermint su lista de bajas (supresión) de la ruta de difusión y, por
      cada dirección nueva, ejecutar en Supabase › SQL Editor
      `select rwadar_novedades.baja_por_correo('correo@de.la.persona');`.
      Con `ofertas_automaticas` encendido, el anuncio sale minutos después de
      aprobar el catálogo, sin un «antes» en el que mirar; si nadie puede
      revisar esa lista a diario, `ofertas_automaticas` se queda apagado hasta
      que el soporte quite su enlace. `baja_por_correo` corta también los push
      de novedades: una baja dada solo en Lettermint los deja llegando. Es lo
      mismo que con las bajas que llegan por correo (RUNBOOK).
   10. **Prueba real a un buzón propio, antes de encender nada.** Enviar desde
       Lettermint dos correos a un buzón tuyo: uno por la ruta de servicio y
       otro por la de difusión, con el seguimiento apagado. Si la cuenta aún
       no está verificada (punto 2), el buzón tiene que ser el de la cuenta de
       Lettermint de Víctor: a cualquier otro no llegaría. Desde GitHub lo
       hace el flujo «Correo Lettermint», acción `prueba-correo` (preparado
       el 07/11/2026). Claude o Codex también lo pueden lanzar en tu
       ordenador con el token en una variable, sin verlo:

       ```bash
       curl -sS https://api.lettermint.co/v1/send \
         -H "x-lettermint-token: $LETTERMINT_API_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"from":"RWAdar <avisos@rwadar.app>","to":["tu-buzon@ejemplo.com"],
              "subject":"Prueba de RWAdar (difusión)","text":"Prueba",
              "html":"<p>Prueba <a href=\"https://rwadar.pages.dev/\">enlace</a></p>",
              "route":"broadcast",
              "settings":{"track_opens":false,"track_clicks":false}}'
       ```

       Para la ruta de servicio, lo mismo sin `"route"`. Cada uno tiene que
       responder 202 con un `message_id`. En el buzón, abrir el original del
       mensaje (en Gmail, «Mostrar original») y comprobar:
       - **sin píxel:** ningún `<img>` que no hayamos puesto;
       - **enlaces directos** a `rwadar.pages.dev`, sin reescribir;
       - la cabecera **`List-Unsubscribe`**: en la de difusión, si es la de
         Lettermint, la nuestra o las dos;
       - **el nombre de la ruta:** si `broadcast` no existe (responde 4xx), se
         mira en el panel cómo se llama y se corrige la 31, con su prueba,
         antes de seguir.

       Si aparece un píxel o enlaces reescritos, **no se enciende**.
   11. **Encender el correo**, solo entonces, y comprobarlo dentro del sistema
       antes de dejarlo para todos. Durante la comprobación no se publica
       ningún anuncio ni se lanza «Avisar novedad», y `ofertas_automaticas`
       sigue apagado: así solo pueden salir bienvenidas.
       1. Antes, repetir desde fuera que ni `net` ni `vault` están publicados
          en la API: `GET …/rest/v1/http_request_queue` con
          `Accept-Profile: net` debe dar `PGRST106 Invalid schema: net`. Las
          colas de pg_net las abre Supabase a todos los roles y postgres no
          puede cerrarlas (diagnóstico de producción del 06/11/2026); por ahí
          pasa el token de Lettermint.
       2. Antes, `ensayo-34` y `aplicar-34` del mismo flujo (el pie de los
          correos sin el nombre del titular). Después, flujo «Avisos a
          registrados (base)», acción `activar-correo` con `AVISOS`. Se niega
          si falta la 31, la 34 (o se reaplicó la 31 después) o los secretos
          del Vault, y pasa los verificadores 30, 31 y 34.
       3. Registrar una cuenta propia con la casilla marcada y confirmarla (la
          confirmación ya llega por Lettermint). En unos minutos llega la
          bienvenida.
       4. En el buzón: sin píxel, enlaces directos a `rwadar.pages.dev` y pie
          completo (con la dirección postal). En el original del mensaje, la
          cabecera `List-Unsubscribe` con el enlace y el `mailto:`. La baja
          todavía no: se prueba en el punto 6, porque darse de baja cambia el
          cuerpo del correo y la repetición del punto 5 daría 409 en vez del
          202 guardado.
       5. Idempotencia, **en los 25 minutos siguientes al primer envío** y con
          la bienvenida ya en `aceptado`. Pasados los 25 minutos, la cola la
          marca «incierta» sin pedir nada a Lettermint (aunque Lettermint
          guarde la clave 24 horas) y la prueba no comprueba nada.
          1. Anotar el número que da
             `select max(id) from net._http_response;`.
          2. Devolver esa bienvenida a la cola con la misma clave
             (`update rwadar_novedades.correos set estado = 'pendiente', terminado_el = null where tipo = 'bienvenida' and estado = 'aceptado' and usuario_id = (select id from auth.users where email = '<la cuenta propia>');`),
             ejecutar `select rwadar_novedades.procesar();` y otra vez al
             cabo de un minuto, para leer la respuesta.
          3. Comprobar que hay una petición nueva y qué contestó:
             `select id, status_code, content from net._http_response where id > <el número anotado> order by id;`
             tiene que salir una fila nueva con 202 y el mismo `message_id`
             que guarda la cola
             (`select estado, intentos, proveedor_mensaje_id from rwadar_novedades.correos where tipo = 'bienvenida' and usuario_id = (select id from auth.users where email = '<la cuenta propia>');`),
             y la bienvenida, otra vez en `aceptado` con `intentos` = 2.

          Tiene que llegar **un solo** correo. Si no hay fila nueva y la
          bienvenida sale «incierta», ya habían pasado los 25 minutos: no
          está probado, se repite con otra cuenta propia. Un 409 también evita
          el duplicado, pero deja la fila «incierta»: mirar en el panel de
          Lettermint por qué antes de seguir.
       6. La baja de principio a fin: el enlace del pie y, con otra alta, el
          interruptor de Perfil.
       7. Si algo no cuadra (llegan dos correos, falta la cabecera, aparece un
          píxel): acción `apagar` en ese momento
          (`30_avisos_registrados_apagar.sql`: apaga el correo y su reloj; la
          casilla y el reloj de limpieza siguen), corregir y repetir desde el
          punto 10.

       Con todo correcto, el reloj se queda encendido para todos y se cambian
       las frases de «Al encender el correo».

       **El cupo de 300 al mes es compartido** (punto 2). Un anuncio gasta un
       correo por persona apuntada, y lo que gaste ya no queda para las
       confirmaciones y recuperaciones de ese mes. La página de precios no
       dice qué pasa al llegar a 300 en el plan gratis (**verificar** si
       Lettermint rechaza o retiene los envíos). Mientras se esté en el plan
       gratis: antes de cada anuncio, mirar en el panel cuántos van ese mes y
       no publicarlo si, con él, quedarían menos de unos 50 para las cuentas.
       Si se queda corto, el siguiente plan es Starter (10 € al mes por 10.000
       correos, según la misma página).
   - **Si Lettermint descarta nuestro `List-Unsubscribe`** (no llega al
     buzón): se quita del contrato (punto 3, «Baja») y de la privacidad, y la
     cabecera de `enviar_correos()` en una nueva versión de la 31 con su
     prueba. No se promete lo que no llega. La baja sigue en el pie de cada
     aviso (enlace y `mailto:`) y en Perfil.
   - **Si alguna vez se reaplica la 30** (por ejemplo, tras
     `fallo_cerrado.sql`), el envío vuelve al código de Brevo: hay que
     reaplicar la 31 (`aplicar-31`) y después la 32, la 33 y la 34.
     `activar-correo` se niega a encender sin la 31 y sin la 34.
6. **Push:**
   - ✅ proyecto de Firebase y credencial FCM V1 en EAS (06/11/2026);
   - ✅ APK 1.4.2 publicada el 06/11/2026 (guía);
   - privacidad del push publicada, con el «latido» de Firebase, y su
     revisión legal;
   - OTA con `AVISOS_NOVEDADES_REMOTOS = true`;
   - prueba en un Android físico (Víctor usa iPhone);
   - `30_avisos_registrados_activar_push.sql`.
7. **Aviso automático de ofertas,** si Víctor lo quiere:
   - antes, que Lettermint haya quitado su enlace de baja de la ruta de
     difusión o que `sincronizar-bajas` corra cada día y esté probada (punto
     5.9), y que alguien revise cada día el buzón rwadares@gmail.com
     (RUNBOOK, «Bajas»): con el aviso automático no hay un «antes de cada
     anuncio»;
   - con el plan gratis, que el cupo de 300 al mes alcance (punto 5.11);
   - `update rwadar_novedades.configuracion set ofertas_automaticas = true`;
   - cambiar `AGENTS.md`, la skill y `CICLO-DIARIO-CATALOGO.md`.

## Pendiente de personas

- **Eric:** ✅ todo hecho el 06/11/2026: visto bueno para las lecciones solo
  con cuenta (con `noindex` y fuera del sitemap) y para usar la Academy como
  reclamo del alta, y licencia escrita de las 9 lecciones para la web y la
  app (la guarda Víctor fuera de Git). Su especificación decía «sin cuentas»
  (`docs/academy/ESPECIFICACION_WEB.md:152`); el visto bueno está en
  `docs/academy/VISTO-BUENO-ERIC-2026-11-06.md`.
- **Víctor:**
  - dominio propio;
  - cuenta de Lettermint y su verificación (paso 5.2; borrador de respuestas
    en [`LETTERMINT-VERIFICACION-RESPUESTAS.md`](LETTERMINT-VERIFICACION-RESPUESTAS.md));
  - ✅ Firebase (06/11/2026, proyecto `rwadar-14e3d`);
  - el contrato de encargo de GitHub
    ([`legal/encargados/`](../legal/encargados/README.md#github--hueco));
  - permiso para cada paso de la activación;
  - ✅ lecciones 8 y 9: publicadas el 06/11/2026.
- **Profesional (opcional):** la revisión legal la hizo Claude; lo que
  conviene confirmar con un profesional está en su apartado 6 (actividad
  económica y publicidad financiera si algún día hay ingresos).

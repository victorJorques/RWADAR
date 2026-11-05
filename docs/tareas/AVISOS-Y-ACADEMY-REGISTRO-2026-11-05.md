# Avisos a registrados y Academy solo con cuenta (05/11/2026)

Petición de Víctor del 05/11/2026:

> «Podrías hacer en RWAdar, tanto en la app como en la web, que al
> registrarse, al sacar una nueva actualización o nuevas ofertas se enviará un
> correo de aviso y una notificación a la aplicación? Y que el apartado de
> Academy se desbloquee solo a los que se han registrado. O sea, que por
> registrarse tendrán un aviso de todas las novedades y un curso gratuito, que
> es la Academy de las 9 lecciones.»

Este documento es el **contrato** que siguen la base de datos, la web y la app.
Si algo cambia al implementarlo, se corrige aquí.

## Lo que queda decidido y por qué

1. **Academy solo con cuenta confirmada.**
   - **App:** ya lo cumple. Desde la 1.4.1 toda la app exige cuenta confirmada
     (`App.js`, `AccesoObligatorio`). Solo se retocan textos.
   - **Web:** el índice `/academy/` sigue público, como escaparate: dice que
     el curso es gratis con cuenta. Cada lección `/academy/<slug>` exige una
     sesión confirmada **en el servidor** (`rwadar-acceso/servidor.mjs`):
     - sin sesión, una página HTML responde 303 a `/acceso?volver=/academy/<slug>`
       y cualquier otra petición responde 401;
     - con sesión, la respuesta lleva `Cache-Control: private, no-store`,
       `X-Robots-Tag: noindex` y `Vary: Cookie`;
     - las lecciones salen del sitemap y llevan `noindex` en su HTML.
   - Las lecciones 8 y 9 siguen «Próximamente» (en revisión por el calendario
     de Eric). Publicarlas es decisión de Víctor; se hace cambiando
     `rwadar-academy/academy.json` (ver `rwadar-academy/LEEME.md`).
2. **Correo de bienvenida al confirmar el registro: a todos.** Es un correo de
   servicio, no publicidad. Dice que ya tienen la Academy gratis.
3. **Avisos de novedades (ofertas nuevas y actualizaciones), con permiso.**
   La ley (LSSI art. 21 y RGPD art. 7.4) no deja suscribir a nadie a avisos de
   ofertas por el mero hecho de registrarse ni condicionar la Academy a ello.
   Por eso:
   - al registrarse hay una **casilla aparte, sin marcar**: «Quiero recibir
     avisos de novedades: ofertas nuevas en el radar y actualizaciones de
     RWAdar». No es obligatoria y la Academy se desbloquea igual;
   - el permiso se guarda **cuando se confirma el correo** (doble
     confirmación), con la fecha y la versión del texto;
   - se cambia cuando se quiera desde Perfil, en la web y en la app;
   - cada correo lleva un enlace de **baja sin entrar en la cuenta**;
   - las cuentas que ya existen no se apuntan solas: lo activan en Perfil.
4. **Notificaciones en la app.**
   - **Avisos dentro de la app** (lista «Avisos» en Inicio y Perfil): llegan
     por OTA a la 1.4.1 y no necesitan permiso del sistema.
   - **Notificaciones push del sistema:** necesitan un APK nuevo (1.4.2). La
     1.4.1 bloquea el permiso de notificaciones y no lleva Firebase. Para
     no romper las OTA de la 1.4.1, el cambio nativo **no entra en `main`**:
     está descrito en [`APK-1.4.2-NOTIFICACIONES.md`](APK-1.4.2-NOTIFICACIONES.md).
   - El push se activa con un interruptor del propio móvil («Recibir
     notificaciones en este móvil»). Al darlo, el sistema pide permiso.
5. **Todo nace apagado.** Nada se envía hasta que Víctor:
   - aplica la migración 30;
   - enciende los interruptores de la web y la app;
   - configura el proveedor de correo (Brevo con dominio propio) y lanza la
     activación;
   - publica el APK 1.4.2 para el push.

## Base de datos: `rwadar-app/db/30_avisos_registrados.sql`

Preparada y probada en local; **no aplicada**. Va después de 26, del refuerzo
de sesión confirmada (`supabase/migrations/20261011074218_…`) y de 29. Se guarda
una copia idéntica en `rwadar-app/supabase/migrations/20261105200000_avisos_registrados.sql`.

**Esquema privado `rwadar_avisos`.** No se expone por REST:
`revoke all … from public, anon, authenticated`.

| Tabla | Para qué |
|---|---|
| `configuracion` | Fila única. `correo_habilitado` y `push_habilitado` (los dos `false` al instalar), `version_consentimiento = 'novedades-v1-2026-11-05'`. |
| `preferencias` | Una fila por cuenta: `usuario_id` (FK a `auth.users`, `on delete cascade`), `novedades` (bool), `aceptado_el`, `version`, `origen` (`alta`/`perfil`), `baja_token` (uuid aleatorio, único), `baja_el`, `actualizado_el`. |
| `anuncios` | Lo que se avisa. `tipo` ∈ `ofertas`, `actualizacion`, `novedad`; `clave` única (para no repetir); `titulo` (3-90); `texto` (3-400); `enlace` (solo `https://rwadar.pages.dev/…`); `revision_id` opcional; `creado_el`. |
| `dispositivos` | Tokens push ligados a la cuenta: `token` (PK, `ExponentPushToken[…]`), `usuario_id` (cascade), `plataforma` (`android`/`ios`), fechas. **No** reutiliza `public.dispositivos`, que sigue cerrada. |
| `correos` | Cola de correo: `usuario_id`, `tipo` (`bienvenida`/`anuncio`), `anuncio_id`, estado, idempotencia, petición, error… Una bienvenida por cuenta y un correo por cuenta y anuncio. |
| `pushes` | Cola de push: `token`, `usuario_id`, `tipo`, `anuncio_id`, estado, ticket y recibo de Expo. Una bienvenida por cuenta y un push por token y anuncio. |

**Disparadores.** Ninguno puede tumbar lo que los dispara: capturan su propio
error y lo dejan como `warning`.

- **Al confirmar el correo** (`auth.users`: alta ya confirmada o paso de
  `email_confirmed_at` de nulo a fecha; nunca anónimos):
  - crea `preferencias`;
  - si los metadatos del alta traen `avisos_novedades = true` y
    `avisos_version` igual a la versión vigente, guarda el permiso con
    `origen = 'alta'`;
  - si `correo_habilitado`, encola la bienvenida.
- **Al aprobar una revisión V2 del catálogo** (`rwadar_catalogo.revisiones`
  pasa a `aprobada`):
  - compara los `slug` de `rwadar_catalogo.ofertas` con la revisión V2
    aprobada anterior (por `aprobada_el`);
  - si hay altas, crea un anuncio `ofertas` con clave `ofertas:<revision_id>`;
  - sin revisión anterior o sin altas, no avisa;
  - título sin «oportunidad» ni cifras de rentabilidad.
- **Al crear un anuncio:**
  - si `correo_habilitado`, encola un correo por cada cuenta confirmada con
    `novedades = true`;
  - si `push_habilitado`, encola un push por cada dispositivo registrado.

**Funciones para la app y la web.** Todas son `security definer` con
`search_path` vacío y exigen `rwadar_cuentas_privadas.sesion_confirmada()`,
salvo la baja.

| Función | Qué hace |
|---|---|
| `public.estado_mis_avisos() → jsonb` | `{novedades, version, aceptado_el, version_vigente, dispositivos, correo_activo, push_activo}` |
| `public.configurar_avisos_novedades(p_activar boolean, p_version text) → jsonb` | Para activar, `p_version` debe ser la vigente. Devuelve lo mismo que `estado_mis_avisos`. |
| `public.registrar_aviso_push(p_token text, p_plataforma text) → boolean` | Liga el token a la cuenta. Si es el primer dispositivo de la cuenta y `push_habilitado`, encola el push de bienvenida (una vez por cuenta). |
| `public.quitar_aviso_push(p_token text) → boolean` | Quita un token propio. La app lo llama al cerrar sesión. |
| `public.mis_avisos_recientes(p_limite int default 20) → setof jsonb` | Anuncios de los últimos 90 días más la bienvenida de la cuenta: `{id, tipo, titulo, texto, enlace, creado_el}`. |
| `public.baja_avisos(p_token uuid) → boolean` | Para `anon` y `authenticated`. Pone `novedades = false` con ese token y dice si existía. |
| `rwadar_avisos.anunciar(p_tipo, p_clave, p_titulo, p_texto, p_enlace) → bigint` | Solo el propietario de la base (el flujo de GitHub). Si la clave ya existe, no repite el anuncio: devuelve el que había. |

**Envío.** Sigue el modelo de 22 y 23: pg_net, Vault y dos fases.

- `rwadar_avisos.correo_soltar(lote)`, `correo_confirmar()`, `push_soltar(lote)`,
  `push_confirmar()` y `ciclo()`.
- **Correo:** Brevo con `BREVO_API_KEY` y `RWADAR_REMITENTE` del Vault.
  - HTML escapado, `Idempotency-Key` y `contactPixelTrackingConsent: false`.
  - Cabecera `List-Unsubscribe: <https://rwadar.pages.dev/baja?t=…>`.
  - El pie identifica a RWAdar, dice por qué recibe el correo y enlaza la baja
    y la privacidad.
- **Push:** Expo (`exp.host/--/api/v2/push/send`), canal Android `novedades`,
  `data: {tipo, destino}` con `destino` ∈ `inicio`, `buscar`, `academy`.
  - Los recibos se leen con `getReceipts`.
  - `DeviceNotRegistered` borra el token.
- **Reloj** `rwadar-avisos-registrados` cada 5 minutos. Solo lo crean los
  scripts de activación, nunca la migración.

**Scripts que acompañan a la 30:**

- `30_avisos_registrados_verificar.sql`: comprueba el estado; es de solo lectura.
- `30_avisos_registrados_activar_correo.sql`: exige los secretos del Vault,
  enciende el correo y crea el reloj.
- `30_avisos_registrados_activar_push.sql`: enciende el push y crea el reloj.
- `30_avisos_registrados_apagar.sql`: apaga los dos interruptores y quita el
  reloj.
- `fallo_cerrado.sql`: también quita el reloj nuevo y apaga los interruptores.

**Pruebas:** `rwadar-app/probar-avisos-registrados.mjs`, sobre la cadena de
producción (base 01-22, 24, 25, catálogo, 26, refuerzo de sesión, 29 y 30).
Está en `npm --prefix rwadar-app test`.

## Web

- **Interruptor** `AVISOS_NOVEDADES_REMOTOS = false`. Mientras esté apagado no
  aparece nada de avisos. La Academy con cuenta **no** depende de él.
- **Alta** (`acceso.html`, `assets/acceso.js`, `servidor.mjs`):
  - casilla `#avisos-novedades` sin marcar, solo al crear cuenta y con el
    interruptor encendido;
  - el servidor acepta `avisosNovedades` (booleano) y, si es `true`, añade a
    los metadatos `avisos_novedades: true` y `avisos_version: 'novedades-v1-2026-11-05'`.
- **Perfil:** tarjeta «Avisos de novedades» con su interruptor, que llama a
  `rpc/configurar_avisos_novedades` y `rpc/estado_mis_avisos` por
  `/api/acceso/datos` (se añaden a la lista cerrada, junto con
  `rpc/mis_avisos_recientes`).
- **Baja sin cuenta:**
  - página `/baja` (`rwadar-site/baja.html`, `noindex`) que lee `t` y, con un
    botón, hace `POST /api/acceso/baja {token}`;
  - ese POST exige el mismo origen, tiene límite por IP y llama a
    `rpc/baja_avisos` con la clave publicable.
- **Privacidad:**
  - la Academy pasa a ser con cuenta;
  - sección de avisos de novedades: con permiso, casilla sin marcar, baja en
    cada correo, proveedores Brevo y Expo/FCM, «todavía no activos».

## App (solo JS: compatible con la OTA de la 1.4.1)

- **Interruptor** `AVISOS_CUENTA_REMOTOS = false` en `lib/modo-local.js`. No
  se toca `SERVICIOS_USUARIO_REMOTOS`.
- **Alta** (`Cuenta.js`, `lib/cuentas.js`): la misma casilla y los mismos
  metadatos que en la web.
- **Perfil › Avisos:**
  - interruptor de correo de novedades;
  - interruptor «Recibir notificaciones en este móvil». Solo aparece si el
    binario lo admite (código nativo 24 o superior). En la 1.4.1 dice que
    llega con la 1.4.2.
- **Inicio:** tarjeta «Avisos» con los últimos de `mis_avisos_recientes`, con
  punto de no leído (guardado en local, por cuenta).
- **Al tocar una notificación:** `data.tipo` ∈ `bienvenida`, `ofertas`,
  `actualizacion` y `novedad`; `data.destino` ∈ `inicio`, `buscar` y
  `academy`. Se sigue aceptando el `slug` antiguo.
- **Al cerrar sesión:** `quitar_aviso_push` del token de este móvil.

## Avisar de una actualización

- El flujo manual `.github/workflows/avisar-novedad.yml` lleva tipo, título,
  texto, enlace y la palabra de confirmación `ENVIAR`. Llama a
  `rwadar_avisos.anunciar` con `SUPABASE_DB_URL` en un paso aislado.
- `ota-android.yml` gana una entrada opcional `aviso`. Si se rellena y la OTA
  sale bien, hace lo mismo con el tipo `actualizacion`.
- Las ofertas nuevas no necesitan flujo: las anuncia el disparador al aplicar
  el catálogo.

## Plantilla de Supabase Auth

El correo de confirmación sale hoy por Gmail desde Supabase Auth.
`rwadar-app/plantillas-auth/confirmar-alta.html` lo convierte en un correo de
bienvenida: «Confirma tu correo y desbloquea gratis la Academy». Ponerla en el
panel de Supabase es tocar Supabase en línea, así que requiere permiso de Víctor.

## Activación (cada paso, con permiso expreso de Víctor)

1. Aplicar la 30 y comprobarla con `30_avisos_registrados_verificar.sql`.
2. Encender `AVISOS_NOVEDADES_REMOTOS` (web) y `AVISOS_CUENTA_REMOTOS` (app),
   publicar la web y enviar la OTA.
3. **Correo:**
   - dominio propio;
   - cuenta de Brevo con el dominio autenticado;
   - `BREVO_API_KEY` y `RWADAR_REMITENTE` en el Vault;
   - `30_avisos_registrados_activar_correo.sql`;
   - una prueba a una cuenta propia.
4. **Push:**
   - proyecto de Firebase;
   - credencial FCM V1 en EAS;
   - APK 1.4.2 ([guía](APK-1.4.2-NOTIFICACIONES.md));
   - `30_avisos_registrados_activar_push.sql`;
   - una prueba en un móvil real.
5. Revisión legal del texto de la casilla y de la privacidad antes del primer
   envío de ofertas: son comunicaciones comerciales y tocan publicidad
   financiera.

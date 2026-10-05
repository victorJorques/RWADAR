# Reabrir las cuentas de RWAdar · qué falta y quién lo hace

*5 de octubre de 2026 · Claude.* Fase 1: **crear cuenta, entrar, recuperar
la contraseña, guardar la lista de vigilancia y borrar la cuenta.** Siguen
cerrados, por decisión de Víctor: opiniones, avisos por correo y avisos push.

## Lo que ya está hecho (en el código, probado, sin tocar nada en línea)

| Pieza | Dónde | Prueba |
|---|---|---|
| Permisos de la base de datos para la fase 1 | `rwadar-app/db/26_reabrir_cuentas.sql` | `node rwadar-app/probar-reabrir-cuentas.mjs`: 36/36 sobre la misma cadena que producción (01-22, 24, 25 y catálogo) |
| Verificador de solo lectura | `rwadar-app/db/26_reabrir_cuentas_verificar.sql` | Falla si algo de más queda abierto o si falta algo |
| Marcha atrás | Volver a ejecutar `rwadar-app/db/25_servicios_editoriales_solo_lectura.sql` | Probado en la misma batería |
| Web: cuentas sin opiniones ni avisos | `rwadar-site/assets/rwadar-20260820.js`: `SERVICIOS_USUARIO_REMOTOS`, `CORREO_AUTH_E2E`, `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` | Todo sigue **apagado** en lo publicado |
| Ensayo completo en el navegador | `node rwadar-app/ensayo-cuentas-web.mjs` | 61/61: la web real con las cuentas encendidas contra la base con la 26 y la 27, y con el anti-robots encendido contra un Supabase que lo exige |
| Anti-robots (Cloudflare Turnstile) | `TURNSTILE_SITEKEY` en `rwadar-site/assets/rwadar-20260820.js` | **Apagado**: no carga nada de fuera. Ver «Anti-robots» más abajo |

El ensayo encontró y ya están corregidos dos fallos que habrían salido al
abrir: en el móvil el botón «Entrar» seguía bloqueado, y tras «Confirma tu
correo» el botón «Entrar» se quedaba desactivado hasta recargar.

## Lo que tiene que hacer Víctor (por orden)

Nada de esto se puede hacer desde la sesión de Claude: no tiene tu usuario de
Supabase, ni de Google, ni de Cloudflare. **Nunca pegues contraseñas, claves
ni tokens en el chat.**

### Paso 1 · Un remitente para los correos de confirmación (obligatorio)

Supabase solo envía sus correos de prueba a los miembros del equipo del
proyecto, y como mucho dos por hora
([documentación oficial](https://supabase.com/docs/guides/auth/auth-smtp)).
Para que cualquiera reciba el correo de «confirma tu cuenta» hace falta un
servidor de correo propio (SMTP). Dos caminos:

**A · Rápido (hoy): una cuenta de Gmail solo para RWAdar.**
1. Crea una cuenta de Gmail nueva, por ejemplo «rwadar.cuentas@gmail.com».
   No uses la personal: esa dirección la verá todo el que se registre.
2. En esa cuenta activa la verificación en dos pasos
   (myaccount.google.com › Seguridad).
3. Entra en myaccount.google.com/apppasswords, crea una contraseña de
   aplicación llamada «Supabase RWAdar» y guárdala un momento: son 16 letras.
4. Supabase › proyecto RWAdar › **Authentication › Emails › SMTP Settings** ›
   activa *Enable custom SMTP* y rellena:
   - Sender email: la dirección de Gmail nueva · Sender name: `RWAdar`
   - Host: `smtp.gmail.com` · Port: `587`
   - Username: la dirección de Gmail · Password: la contraseña de aplicación
   - Guarda.

Límite: Gmail no está pensado para envíos masivos (unos cientos al día). Para
empezar sobra.

**B · El bueno (recomendado a medio plazo): dominio propio + Brevo.**
Brevo no deja autenticar direcciones gratuitas como Gmail o Proton: les
cambia el remitente por uno de `@brevosend.com`
([ayuda de Brevo](https://help.brevo.com/hc/en-us/articles/17286219877778)).
Con un dominio propio (ya estaba en la lista, unos 12 € al año, se compra en
Cloudflare › Domain Registration) se autentica en Brevo con los registros DNS
que te da, y en Supabase se pone Host `smtp-relay.brevo.com`, Port `587` y
el usuario y la clave SMTP de Brevo (Brevo › SMTP & API). El remitente sería
`no-responder@tudominio`. Se puede empezar con A y pasar a B sin tocar la web.

### Paso 2 · Ajustes de Auth en Supabase

En **Authentication**:
- **Sign In / Providers › Email:** *Confirm email* **activado**, *Secure email
  change* activado, *Minimum password length* **12**.
- **Sign In / Providers:** *Allow new users to sign up* **activado** (hoy está
  apagado desde el 27/09).
- **URL Configuration:** *Site URL* `https://rwadar.pages.dev`. En *Redirect
  URLs* deja solo `https://rwadar.pages.dev/` y, mientras dure la prueba del
  paso 4, también `https://revision.rwadar.pages.dev/`.
- **Rate Limits:** deja el de correos en 30 por hora.
- **Emails › Templates:** cambia *Confirm signup* y *Reset password* por los
  textos en español del final de este documento.

### Paso 3 · Los permisos de la base de datos (copiar y pegar)

1. Abre en GitHub `rwadar-app/db/26_reabrir_cuentas.sql` y pulsa el botón
   *Copy raw file*.
2. Supabase › **SQL Editor › New query** › pega › **Run**. Debe terminar en
   *Success*.
3. Otra *New query* con `rwadar-app/db/26_reabrir_cuentas_verificar.sql` ›
   **Run**. Debe salir el aviso
   `RWAdar 26 OK: perfil, vigilancia y baja abiertos; opiniones, moderación,
   dispositivos y push siguen cerrados`. Si sale un error, cópiame el texto
   del error (no contiene datos privados).

Si algo va mal: pega y ejecuta `25_servicios_editoriales_solo_lectura.sql` y
todo vuelve a estar cerrado como hoy.

### Paso 4 · La prueba de verdad (10 minutos)

Avísame en el chat con «pasos 1 a 3 hechos». Yo enciendo las cuentas en la
versión de prueba (`https://revision.rwadar.pages.dev`) y te aviso. Entonces:
1. Crea una cuenta con un correo tuyo. Te llega el correo: ábrelo y pulsa el
   enlace. Mira también en spam.
2. Abre una ficha y pulsa «Vigilar esta plataforma».
3. Cierra sesión, entra otra vez y comprueba que la lista sigue ahí.
4. Pulsa «He olvidado la contraseña», abre el correo y pon una nueva.
5. Borra la cuenta desde «Tu cuenta».

Dime qué ha pasado en cada punto (si algo falla, una captura).

### Paso 5 · Publicar

Con la prueba bien, actualizo la política de privacidad para las cuentas
(qué datos, para qué, cuánto tiempo, y el proveedor de correo que elijas en
el paso 1), quito la dirección de prueba de *Redirect URLs* y publico para
todo el mundo. Necesita la clave de Cloudflare en GitHub
(`docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub»).

## Seguridad al abrir

- La contraseña mínima es de 12 caracteres en la web y en Supabase (paso 2).
- La sesión vive solo en la memoria de la pestaña: no queda guardada en el
  navegador.
- Cada persona solo ve y toca lo suyo (RLS, probado con dos cuentas).
- Recomendado antes de anunciar las cuentas en redes: el anti-robots (abajo).

## Anti-robots: que nadie use el alta para mandar correos en masa

La web ya lo tiene hecho y probado, pero **apagado**. Encendido, crear cuenta,
entrar y pedir correos pasan antes por Cloudflare Turnstile (gratis). Casi
nunca pide nada a la persona: solo enseña una casilla si sospecha. La web
carga Turnstile solo cuando alguien pulsa uno de esos botones, nunca al abrir
la página.

**Víctor (5 minutos), mejor junto con los pasos 1 a 3:**
1. Cloudflare › **Turnstile** › *Add widget*. Nombre `RWAdar cuentas`.
   Hostnames: `rwadar.pages.dev` y `revision.rwadar.pages.dev`. Modo
   *Managed*. Crear.
2. Salen dos claves:
   - La **Site Key** es pública (va dentro de la web): pégala en el chat sin
     problema.
   - La **Secret Key** no se pega en el chat nunca. Va directa a Supabase en
     el paso 4.
3. Espera a que te diga «anti-robots publicado en revisión».
4. Supabase › **Authentication › Attack Protection** › *Enable Captcha
   protection* › proveedor *Turnstile* › pega la Secret Key › *Save*.

El orden importa. Si Supabase exige el anti-robots antes de que la web lo
lleve, nadie puede entrar ni darse de alta. La web lo explica con «No hemos
podido comprobar que no eres un robot», pero no deja seguir. Mientras las
cuentas sigan cerradas al público, esto no afecta a nadie.

**Lo que hace Claude o Codex con la Site Key:**
- `const TURNSTILE_SITEKEY='<site key>';` en `rwadar-site/assets/rwadar-20260820.js`.
- La CSP, en `rwadar-site/_headers` y en `rwadar-servir.js`:
  - `script-src` añade `https://challenges.cloudflare.com`;
  - `frame-src 'none'` pasa a `frame-src https://challenges.cloudflare.com`.

  Hay que ajustar las tres pruebas de CSP de `probar-web.mjs` («la CSP
  permite solo el beacon adicional…», «impide formularios, marcos…» y la del
  servidor local). Es la misma CSP con la que pasa el ensayo, sección 11.
- Privacidad: añadir que, al crear cuenta, entrar o pedir un correo,
  Cloudflare Turnstile comprueba que no es un robot (datos técnicos del
  navegador; Cloudflare como encargado; sin cookies de seguimiento).
- Pruebas, aprobación, publicar en revisión y probar con Víctor (paso 4 de
  arriba); después, producción.

## Plantillas de correo (Supabase › Authentication › Emails › Templates)

**Confirm signup.** Asunto: `Confirma tu cuenta de RWAdar`

```html
<h2>Confirma tu cuenta de RWAdar</h2>
<p>Hola. Alguien (esperamos que tú) ha creado una cuenta en RWAdar con esta dirección.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si no has sido tú, ignora este mensaje: sin confirmar, la cuenta no se puede usar.</p>
<p>RWAdar es un registro informativo: no te pediremos nunca datos bancarios, claves de monederos ni frases de recuperación.</p>
<p>RWAdar · <a href="https://rwadar.pages.dev/privacidad">Privacidad</a> · RWAdar@protonmail.com</p>
```

Cuando el manual de bienvenida esté encendido (`docs/manual/LEEME.md`),
añadir antes del pie:

```html
<p>Tu manual de uso, para cuando quieras: <a href="https://rwadar.pages.dev/descargas/como-usar-rwadar.pdf">Cómo usar RWAdar (PDF)</a></p>
```

**Reset password.** Asunto: `Recupera tu acceso a RWAdar`

```html
<h2>Recupera tu acceso a RWAdar</h2>
<p>Has pedido poner una contraseña nueva.</p>
<p><a href="{{ .ConfirmationURL }}">Elegir una contraseña nueva</a></p>
<p>Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.</p>
<p>RWAdar · <a href="https://rwadar.pages.dev/privacidad">Privacidad</a> · RWAdar@protonmail.com</p>
```

## Lo que hará Claude cuando Víctor termine los pasos 1 a 3

1. Poner `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true` (las
   opiniones y los avisos siguen en `false`).
2. Reescribir la privacidad para las cuentas abiertas. Si ya está la Site
   Key de Turnstile, encender también el anti-robots (sección «Anti-robots»).
3. Pruebas, renovar la aprobación en `estado.json`, publicar en `revision`
   para el paso 4 y, con el visto bueno, en producción.

## Comunidad: una publicación al día (preparada, apagada)

Cuando las cuentas funcionen, la comunidad se abre igual:

1. Víctor: SQL Editor › pegar `rwadar-app/db/27_comunidad.sql` › Run.
2. Claude: `PUBLICACIONES_REMOTAS=true`, privacidad (qué se publica, quién lo
   ve, denuncias, cuánto se guarda) y publicar.

Lo que impone la base de datos (no la pantalla): una por cuenta y día de
España, 10–500 caracteres, sin enlaces, nombre solo si la persona lo elige,
una denuncia por cuenta y tres la ocultan, borrar lo propio y todo se borra
con la cuenta. Prueba: `node rwadar-app/probar-comunidad.mjs` (30/30) y el
ensayo en el navegador (48/48 con todo lo de las cuentas).

**Moderar** (hasta que haya un panel): en el SQL Editor,

```sql
-- lo denunciado u oculto
select id, autor, texto, creada_el, estado, denuncias
  from publicaciones where denuncias > 0 or estado = 'oculta'
 order by denuncias desc;
-- restaurar una que no merecía ocultarse
update publicaciones set estado = 'visible', denuncias = 0 where id = '…';
delete from denuncias_publicaciones where publicacion_id = '…';
-- ocultar una a mano
update publicaciones set estado = 'oculta' where id = '…';
```

Cerrar la comunidad sin borrar nada: `rwadar-app/db/27_comunidad_cerrar.sql`.

## Después (no es esta fase)

- **App:** la app guarda los favoritos en el móvil. Sincronizarlos con la
  cuenta necesita pantallas de entrar y registrarse en la app y una versión
  nueva.
- Opiniones, avisos por correo y push: cada uno con su migración y su prueba.
- Comunidad en la app: hoy la anuncia como «próximamente»; leerla es fácil
  (es pública), publicar necesita entrar con cuenta en la app.

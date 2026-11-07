# Lettermint · borrador de respuestas para la verificación de la cuenta (07/11/2026)

**Para qué sirve.** Lettermint revisa cada equipo nuevo antes de dejarle
enviar a cualquiera. Mientras no lo aprueba, solo se puede enviar a los
miembros verificados del equipo y a sus direcciones de prueba:

> «Lettermint reviews new teams before unrestricted production sending.»
> «Unverified teams can only send to verified team members and test addresses.»
> «Wait for verification before sending production traffic to non-team recipients.»

Fuente: <https://docs.lettermint.co/platform/onboarding/compliance-verification>
(redirige a `https://lettermint.co/docs/platform/onboarding/compliance-verification`),
consultada el 07/11/2026.

Esa página dice qué conviene tener preparado, pero **no enseña las preguntas
exactas del formulario** ni cuánto tarda la aprobación. Por eso este borrador
sigue su lista: descripción del proyecto, web, volumen previsto, tipos de
correo, cómo se apunta la gente y cómo se tratan rebotes, quejas y bajas.
Cuando Víctor abra el formulario, se adapta cada respuesta a la pregunta que
salga (**verificar** los nombres de los campos).

**Consecuencia para el plan.** Hasta que Lettermint apruebe la cuenta:

- **no se cambia el SMTP de Supabase Auth** (contrato de avisos, punto 5.8.4).
  Si se cambiara antes, las confirmaciones de cuenta y las recuperaciones de
  contraseña de la gente no saldrían;
- la prueba real (punto 5.10) solo puede ir al buzón de la cuenta de
  Lettermint de Víctor (el único miembro del equipo en el plan gratis) o a las
  direcciones de prueba de Lettermint.

**Datos personales en este borrador.** Solo los que ya publica el aviso legal
(`rwadar-site/privacidad.html`, apartado 1): el nombre del titular, su
domicilio y el correo de contacto. El NIF también está publicado allí; se pone
solo si el formulario lo pide.

**Cómo usarlo.** Cada respuesta va en inglés, lista para copiar, con una nota
en castellano debajo. Las cifras son las del 07/11/2026: si cambian antes de
enviar el formulario, se corrigen aquí primero.

---

## 1. Qué es RWAdar (descripción del proyecto o del negocio)

```text
RWAdar is an independent, free editorial "radar" of real-world-asset
tokenization platforms (real estate, treasury funds, commodities, credit).
For each platform it lists whether it exists, whether it is supervised and
why some are discarded, always with the source next to it. RWAdar does not
sell assets, does not take money from investors, does not intermediate any
investment and does not charge users. It is run by an individual in Spain,
Víctor Manuel Jorques Granero (no company has been incorporated). The web
app is at https://rwadar.pages.dev and there is an Android app distributed
through GitHub releases.
```

Nota: es lo que dicen la privacidad (§1) y `docs/INTERNO.md`. No se promete
nada que no haga hoy.

## 2. Web o aplicación

```text
Website: https://rwadar.pages.dev
Legal notice and privacy policy: https://rwadar.pages.dev/privacidad
Android app: https://github.com/victorJorques/RWAdar-downloads/releases/latest
Sending domain: rwadar.app (sender avisos@rwadar.app, display name "RWAdar")
Reply-to and contact: RWAdar@protonmail.com
Postal address (shown in every email footer): Plaza Generalitat, s/n,
46600 Alzira, Valencia, Spain
```

Nota: `rwadar.app` es el dominio recomendado y todavía **no se ha comprado**.
Si se compra otro, se cambia aquí. La dirección postal va en el pie de cada
correo porque la exige la política de uso de Lettermint
(<https://lettermint.co/acceptable-use>).

## 3. Volumen previsto

```text
Very low volume. Today the service has fewer than 20 registered accounts.
We expect well under 300 emails per month in total for the next months,
which is why we start on the Free plan:
- account emails (sign-up confirmation and password reset) as people
  register: a few dozen per month at most;
- one welcome email per newly confirmed account;
- announcements only to people who opted in: at most one per day, usually
  a few per month.
There is no daily peak beyond the number of opted-in subscribers on the day
of an announcement.
```

Nota: el 06/11/2026 había 9 cuentas (traspaso del 06/11, «Las 9 cuentas
existentes tienen preferencias con `novedades = false`»). Los avisos siguen
apagados y nadie está apuntado. Los 300 correos del plan gratis son **para
todo**: confirmaciones, recuperaciones, bienvenidas y anuncios
(<https://lettermint.co/pricing>, «Monthly limit 300», consultado el
07/11/2026). Ver el punto 5.11 del contrato.

## 4. Tipos de correo

```text
1. Account emails (transactional, sent by Supabase Auth through Lettermint
   SMTP): sign-up confirmation link and password reset link. Tracking off.
2. Welcome email (transactional, sent through the Sending API, default
   route): one per account, right after the person confirms their email.
   It only says the free lessons are unlocked and, if the person opted in,
   confirms it and gives the unsubscribe link. No promotion.
3. Announcements (broadcast route, Sending API): only to people who opted
   in. Two kinds: new entries in the radar (without naming products or
   issuers, with a risk warning) and news about the website and the app.
   At most one per day.

No purchased, rented or scraped lists. No cold email. No third-party
advertising, no affiliate links. Open and click tracking are disabled in
every request ("track_opens": false, "track_clicks": false).
```

Nota: es lo que hace `rwadar-app/db/31_correo_lettermint.sql` (aplicada el
06/11/2026, con el correo apagado) y lo que describen la privacidad y el
contrato de avisos (puntos 2 y 3). En el plan gratis Lettermint no ofrece el
seguimiento de aperturas ni de clics (precios: «Open tracking -», «Click
tracking -»; rutas: «Email tracking is available on paid plans»,
<https://docs.lettermint.co/platform/projects-and-routes/routes>).

## 5. Cómo se apunta la gente (consentimiento con doble confirmación)

```text
Only people who create an account themselves on rwadar.pages.dev or in the
Android app can receive anything. Every account must confirm its email
address through the confirmation link before it can sign in, so every
address is confirmed by its owner (double opt-in).

Announcements need a separate, unticked checkbox at sign-up, or a switch
in the profile. The permission only becomes active after the email is
confirmed. For each permission we store the date, the exact version of the
text shown, the language, where it was given (sign-up or profile) and the
channel (web or app), in an append-only history kept as proof of consent.
Existing accounts are not opted in: their permission is off until they
switch it on themselves.
```

Nota: casilla aparte y sin marcar, versión `novedades-v2-2026-11-06`,
historial `rwadar_novedades.historial_permiso` (solo añadir; tras borrar la
cuenta queda bloqueado y se borra a los 3 años). Hoy la casilla **no se ve**
(`AVISOS_NOVEDADES_REMOTOS = false`): se enciende después de la prueba real
(contrato, punto 4).

## 6. Bajas

```text
Every announcement includes:
- a link to https://rwadar.pages.dev/baja that unsubscribes without signing
  in;
- the reply address RWAdar@protonmail.com: replying "baja" (unsubscribe)
  is enough;
- a List-Unsubscribe header with that link and a mailto: address.
People can also switch announcements off in their profile at any time.
An unsubscribe stops both emails and app notifications, and is never
reversed by us.

We keep Lettermint's hosted unsubscribe link on the broadcast route.
Unsubscribes stored by Lettermint are synced into our own database before
every announcement (and daily if automatic announcements are ever enabled),
so they are honoured everywhere. Requests by email are applied before the
next send and always within 10 business days.
```

Nota: el pie y la cabecera los pone la 31 (`List-Unsubscribe` sin
`List-Unsubscribe-Post`: no se promete la baja «en un clic»). El enlace de baja
propio de la ruta de difusión de Lettermint **probablemente no se puede quitar
en el plan gratis**: su documentación dice «Hosted unsubscribe pages (can be
disabled on higher plans)» y «This option is only granted to trusted senders»
(rutas, consultado el 07/11/2026). Por eso se automatiza la sincronización de
bajas (flujo «Correo Lettermint», acción `sincronizar-bajas`, preparado el
07/11/2026 y apagado; ver el punto 5.9 del contrato). Mientras no esté en
marcha, la sincronización es a mano, como dice el punto 5.9. Los 10 días
hábiles son el máximo de la política de uso de Lettermint.

## 7. Rebotes y quejas

```text
We rely on Lettermint suppressions: hard bounces are suppressed for the
whole team and spam complaints and unsubscribes for the route, so those
addresses are skipped automatically. Our sending queue does not retry
requests that Lettermint rejects (4xx); it only retries timeouts, 429 and
5xx, with the same Idempotency-Key so a retry never sends twice. Before each
announcement we check Email Activity and the suppression list. A spam
complaint is treated as an unsubscribe on our side too, and we review the
content that caused it. Volume is low and every address is confirmed by its
owner, so we expect very few bounces.
```

Nota: así lo describe la página de supresiones de Lettermint
(<https://lettermint.co/docs/platform/emails/suppressions>: rebote duro en el
equipo, queja y baja en la ruta; los rebotes blandos no suprimen) y así lo
hace la 31 (`leer_correos`: 4xx salvo 408 y 429 = fallido sin reintento; 5xx,
408 y 429 vuelven a la cola con la misma clave). «Tratar la queja como baja en
RWAdar» es un compromiso nuevo: si se pone en el formulario, se cumple a mano
con `rwadar_novedades.baja_por_correo` hasta que la sincronización recoja
también las quejas (**verificar** si `sincronizar-bajas` las lee; hoy solo
pide las de tipo «unsubscribe»).

## 8. Otras preguntas que pueden salir

- **¿Quién envía?** «The data controller is Víctor Manuel Jorques Granero,
  an individual in Spain. Lettermint acts as processor under its standard
  DPA, accepted when the account was created.»
- **¿Dónde están los destinatarios?** «Mostly in Spain and the rest of the
  EU.»
- **¿Datos sensibles?** «No. Emails never include financial details,
  documents or passwords. Links point only to rwadar.pages.dev.»
- **¿Cuántos usuarios en la cuenta?** El plan gratis admite uno: Víctor.
- **¿NIF?** Solo si lo piden: el del aviso legal.

---

## Antes de enviarlo

1. Comprar el dominio y verificarlo en Lettermint (contrato, puntos 5.1 y
   5.3). Si el formulario pide el dominio antes, se puede enviar con la web y
   apuntar que el dominio de envío se añade después (**verificar** si lo
   aceptan así).
2. Releer las cifras del punto 3 con el número de cuentas del día.
3. Guardar en esta carpeta una nota con la fecha de envío y la de aprobación
   (sin datos de nadie). La aprobación desbloquea el punto 5.8.4 del contrato.

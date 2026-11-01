# Anti-robots y límite de intentos de las cuentas · preparado, sin activar

1 de noviembre de 2026 · Claude. Pedido por Víctor: «prepara el plan del CAPTCHA
y del límite de intentos, sin activarlo, para que lo revise»; «haz lo mejor para
el proyecto sin romper la web».

**Nada de esto está publicado ni activado.** El código está en la rama
`claude/anti-robots-2026-10-30`. Toca `rwadar-acceso/` y `rwadar-site/`, que están
sellados por `RUTAS_CONTENIDO_APROBADO`: unirlo a `main` sin una nueva aprobación
pararía la publicación. No se tocó Supabase ni Cloudflare, y no se hicieron
intentos de entrada reales.

## Por qué hace falta

1. **Cupo de intentos compartido por toda la web (riesgo de bloqueo).**
   - Supabase Auth limita por IP: 30 altas, recuperaciones o reenvíos y 150
     entradas con contraseña cada 5 minutos
     ([límites](https://supabase.com/docs/guides/auth/rate-limits)).
   - El formulario web entra a través del BFF (`rwadar-acceso/servidor.mjs`), que
     llama a Supabase desde Cloudflare. Supabase también está detrás de
     Cloudflare, y en una petición de un Worker a otra zona de Cloudflare la IP
     del visitante se sustituye por la fija `2a06:98c0:3600::103`
     ([cabeceras](https://developers.cloudflare.com/fundamentals/reference/http-headers/)).
   - Muy probablemente **todas las personas que entran por la web comparten un
     solo cupo**: alguien puede agotarlo a propósito y dejar a todos sin entrar
     por la web durante 5 minutos.
   - La forma oficial de pasar la IP real (`Sb-Forwarded-For`) exige una clave
     secreta en el BFF. El BFF solo tiene la publicable, a propósito.
   - **Cómo confirmarlo sin cambiar nada:** en Supabase › Logs › Auth, mirar la IP
     de una entrada hecha desde la web. Si aparece `2a06:98c0:3600::103`, está
     confirmado.
2. **Sin CAPTCHA**, un programa puede pedir altas o recuperaciones en masa y
   agotar los correos de Gmail (ya señalado en `REABRIR-CUENTAS.md` y en
   `SEGURIDAD-WEB-REVISION-2026-10-28.md`).
3. **El BFF descartaba el testigo anti-robots.** Encender el CAPTCHA en Supabase
   habría roto la entrada por la web aunque esta llevara Turnstile.

## Lo preparado (rama `claude/anti-robots-2026-10-30`)

**BFF (`rwadar-acceso/servidor.mjs`):**

- Límite propio, en la memoria de cada instancia de Cloudflare, **por
  visitante**: su IPv4 (`CF-Connecting-IP`) o, en IPv6, su bloque /64 completo.
  Así nadie lo reinicia cambiando de dirección dentro de su bloque. Cuenta cada
  petición que llega a Supabase, como hace Supabase; las mal escritas no cuentan.

  | Qué | Por visitante |
  |---|---|
  | Entrar y reautenticar (contraseña) | 30 cada 10 min |
  | Alta, recuperar y reenviar (pueden enviar correo) | 5 cada hora |

  Al pasarse, devuelve 429 `intentos_excedidos` con `Retry-After`, sin llegar a
  Supabase. Sin IP del visitante (ensayos locales) no se crea un cupo común.
- **A propósito no hay límite por correo.** La revisión independiente del 1/11
  mostró que cualquiera podría usarlo para dejar a otra persona sin entrar
  (10 claves falsas de su correo) y que apenas protege: un atacante puede llamar
  a Supabase directamente, sin pasar por la web.
- Si el formulario manda `captcha`, se valida (texto imprimible, hasta 2048
  caracteres) y se reenvía una sola vez a Supabase como
  `gotrue_meta_security.captcha_token`. Sin `captcha`, Supabase recibe
  exactamente lo mismo que antes.
- Si Supabase responde `captcha_failed`, el BFF devuelve 400 `captcha_fallido`.
  Del cuerpo de error solo se lee ese código.
- **No valida Turnstile por su cuenta**: cada testigo es de un solo uso, y si lo
  gastara el BFF, Supabase lo rechazaría.

**Web (`rwadar-site/assets/acceso.js` y `acceso.html`):**

- Turnstile antes de entrar, crear cuenta, recuperar y reenviar, con el mismo
  diseño que ya tenía el JS antiguo: carga explícita, `interaction-only` y un
  testigo nuevo por petición.
- `TURNSTILE_SITEKEY = ''` lo deja **apagado**: no carga nada de fuera y la CSP
  sigue igual.

**Pruebas (Node 22.23.4):**

- `npm run test:acceso`: 139/139, 13 nuevas en
  `rwadar-acceso/anti-robots.test.mjs`: cuerpos sin cambios, reenvío del
  testigo, testigos malformados, CAPTCHA fallido, cupo por visitante, bloque
  IPv6 /64, IPv4 escrita como IPv6, que nadie pueda bloquear a otra persona,
  datos mal escritos e intentos simultáneos.
- `npm run test:web`: 550/0, 90 páginas, precarga 31.
- Chromium real con el BFF verdadero y un Supabase simulado que valida con el
  `siteverify` real de Cloudflare, usando sus [claves de prueba](https://developers.cloudflare.com/turnstile/troubleshooting/testing/):
  - apagado: entra, sin peticiones externas ni avisos de CSP;
  - clave que aprueba: entra, y el testigo llega y lo valida Cloudflare;
  - clave que rechaza: no entra y lo explica.

## Orden para activarlo sin romper nada

Cada fase necesita permiso expreso de Víctor en su turno.

1. **Revisar y aprobar esta rama** (Codex): nueva huella aprobada, preview,
   pruebas en `revision.rwadar.pages.dev` y producción.
   - Desde aquí el límite ya protege la web.
   - El CAPTCHA sigue apagado.
   - Android no cambia, porque no usa el BFF.
2. **Android con testigo**, antes de encender nada en Supabase:
   - El APK 1.4.x llama directamente a Supabase con `supabase-js` y no manda
     testigo. Con el CAPTCHA encendido mostraría «Inténtalo en la web oficial»
     (`rwadar-movil/lib/cuentas.js`).
   - Turnstile necesita un dominio: una página propia en `rwadar.pages.dev`,
     abierta en un `WebView`, que devuelva el testigo con `postMessage`.
   - Pasarlo como `options: { captchaToken }` en `signInWithPassword`, `signUp`,
     `resend` y `resetPasswordForEmail`.
   - Publicar (EAS u OTA) y esperar a que la mayoría actualice.
3. **Widget de Turnstile** (Víctor, 5 minutos): Cloudflare › Turnstile › *Add
   widget*, con hostnames `rwadar.pages.dev` y `revision.rwadar.pages.dev`, modo
   *Managed*.
   - La **Site Key** es pública y va en `TURNSTILE_SITEKEY` de `acceso.js` y del
     JS antiguo.
   - La **Secret Key** nunca va al chat ni al repositorio.
4. **CSP y privacidad** (Codex), en `rwadar-site/_headers`,
   `rwadar-acceso/compilar.cjs` (`CABECERAS_SEGURIDAD`) y `rwadar-servir.js`:
   - `script-src` añade `https://challenges.cloudflare.com`;
   - `frame-src 'none'` pasa a `frame-src https://challenges.cloudflare.com`;
   - `rwadar-site/assets/acceso-privado.js` (`reautenticar`, que usa el JS
     principal para acciones delicadas como borrar la cuenta) también debe pedir
     el testigo y mandarlo como `captcha`; el BFF ya lo reenvía;
   - ajustar las pruebas de CSP de `probar-web.mjs`;
   - añadir el texto de privacidad de `REABRIR-CUENTAS.md`;
   - aprobar, preview, prueba y producción.
5. **Encender en Supabase** (Víctor): Authentication › Bot and Abuse Protection
   › *Enable CAPTCHA protection* › Turnstile › Secret Key. Probar en revisión con
   la web y con Android.

**Para dar marcha atrás:** primero apagar el CAPTCHA en Supabase y después vaciar
la Site Key. El límite del BFF se puede quitar volviendo a la versión anterior
de `servidor.mjs`.

## Límites conocidos y opciones

- El límite vive en la memoria de cada instancia de Cloudflare. Es aproximado:
  frena a quien insiste desde una conexión, no a una red grande de máquinas.
  Para eso están el CAPTCHA y los límites propios de Supabase.
- Detrás de una IP compartida (oficina, universidad, operador móvil), 30
  entradas en 10 minutos se reparten entre todos. Con el volumen actual de
  RWAdar no se espera.
- Pages no admite el *binding* de Rate Limiting de Workers
  ([bindings de Pages](https://developers.cloudflare.com/pages/functions/bindings/)).
  Un límite global exacto exigiría un Worker aparte con Durable Objects. No
  parece necesario con el volumen actual.
- No se recomienda poner una clave secreta de Supabase en el BFF solo para
  reenviar la IP: daría al BFF acceso por encima de RLS.

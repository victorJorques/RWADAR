# Reabrir las cuentas de RWAdar · qué falta y quién lo hace

## Estado vigente · 11 de octubre de 2026 · Codex

**Las cuentas ya están activadas en la web pública desde el 11/10**, en
`https://rwadar.pages.dev`. La publicación pasó **35/35** comprobaciones HTTP y
**64/64** comparaciones de recursos por huella; se observaron alta, entrada y
Perfil en el navegador de producción. **Android 1.3.1, código 14, también está
publicado** en [GitHub](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1),
con cuentas opcionales. El flujo de QA y release terminó correctamente y la
API anónima confirmó un lanzamiento final, no borrador ni prerelease.
En la revisión, Víctor confirmó que **el correo de alta llega y su enlace
funciona**, aunque llega a spam. También se mostró el perfil confirmado y
funcionó cerrar sesión. Codex solicitó recuperación desde esa revisión: el
correo **llegó a la bandeja de entrada**, con DKIM, SPF y DMARC correctos,
comprobados solo mediante metadatos. No se leyeron cuerpo, enlace ni token.
El cambio final de contraseña y la entrada posterior todavía no se han
verificado; requieren que Víctor introduzca su contraseña directamente. No se
considera terminado el recorrido por mostrar un mensaje de envío.

El panel nativo nuevo está en el APK 1.3.1 publicado; los refuerzos de la
web están publicados. **El refuerzo de sesión ya está aplicado en Supabase** con
permiso expreso del turno actual. La lectura posterior verificó RLS restrictivo,
sesiones confirmadas y vigentes, exclusión de usuarios anónimos y esquema privado
fuera de REST. El catálogo público sigue disponible: **26 plataformas y 49
referencias; no está retirado**.

La web publicada y el APK nativo publicado **1.3.1** tienen encendidas solo las
guardas de cuentas; las de servicios antiguos, instalaciones y push siguen
apagadas. Víctor autorizó expresamente EAS Android y publicación en GitHub
**sin cargos**. El APK **1.3.1, código 14**, se compiló gratis y pasó la
comprobación de firma y tamaño. La cuota posterior de EAS es Android **3/15**
y total **4/30**, sin cargos, exceso ni complementos; Expo Doctor pasó **21/21**.
**La QA de ejecución del mismo APK intacto pasó en un emulador API 35:**
Inicio, búsqueda con 26 plataformas y 49
referencias, Spiko, Academy con siete lecciones y una lección abierta, favorito
conservado tras reiniciar y formularios de cuentas. Los campos estaban vacíos
y las contraseñas enmascaradas; la entrada vacía se rechazó localmente.
No se introdujeron contraseñas, enviaron correos ni crearon cuentas: **no es
Auth E2E nativo ni una prueba en hardware físico**. El flujo de la 1.3.1
terminó con **QA y publicación exitosas**: pública desde el
**11/10 a las 09:45:05 UTC**, como última versión final. La API publica el APK,
evidencia y sumas; no se modificó el APK probado. La descarga anónima local
ya terminó correctamente:
tamaño y huellas de APK y ZIP coinciden con la API y `SHA256SUMS.txt`, y
`apksigner` volvió a confirmar la firma prevista. Se validaron las entradas
del ZIP antes de extraerlo y se leyó el resultado completo de QA, que conserva
sus límites de Auth E2E, SMTP y hardware físico.

La revisión de las capturas de la **anterior 1.3.0** detectó un pequeño solape
de la nota de favoritos con el formulario de recuperación. La **1.3.1 publicada**
lo corrige, con separación positiva propia y cabecera singular. Su prueba
geométrica midió **92 píxeles**, superando el mínimo de 40. Codex revisó sus
capturas propias de recuperación, confirmación, alta y Perfil: nota fuera del
borde y «1 guardado» correcto. No se reutiliza como prueba del nuevo binario
la evidencia de 1.3.0; la revisión visual no es exhaustiva. Detalle específico:
[`../VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](../VERIFICACION-ANDROID-1.3.1-2026-10-11.md).

La ejecución final de `npm test` con las guardas de cuentas activadas y la
versión nativa 1.3.1 finalizó correctamente: web 501, móvil 182 y SQL 196;
QR y herramientas al día. Los ensayos finales de Chrome con servicios
simulados pasaron 61 y 30 casos. La revisión independiente terminó sin bloqueos.
Son pruebas locales independientes de la QA del APK instalado en emulador;
no acreditan la recuperación real terminada ni Auth E2E nativo.

La auditoría de dependencias **no está limpia**: 23 avisos de paquetes
(16 high y 7 moderate), derivados de tres advisories. El análisis de alcance
no demostró una vía vulnerable en el APK actual para esos tres problemas;
no garantiza que no existan otros. No se hicieron cambios de paquetes ni
arreglos forzados para ocultar los avisos. Codex mantiene el seguimiento y
prepara una actualización compatible. Detalle y límites en
[`../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

El plan actualizado para **web y app**, pruebas y orden de publicación está
en [`CUENTAS-WEB-MOVIL-2026-10-11.md`](CUENTAS-WEB-MOVIL-2026-10-11.md).
Codex asume integración, configuración técnica, pruebas y publicación
autorizada. Víctor solo introduce credenciales, abre sus enlaces, verifica su
identidad y decide sobre las operaciones reservadas. No tiene tareas de código.
Publicidad, pagos, opiniones, comunidad, avisos y manual continúan apagados.

**No ejecutar los pasos históricos de abajo como una receta vigente.** La
migración `20261011074218_cuentas_sesion_confirmada.sql` se aplicó después de
la 26 y se verificó en línea. Reaplicar 26 sustituiría funciones reforzadas:
habría que volver a aplicar el refuerzo con autorización. La web ya se publicó
y el APK nuevo se compiló, pasó su prueba de ejecución en emulador y se publicó
en GitHub; su descarga pública, sumas y firma también se comprobaron.
Quedan el flujo completo de cuentas nativas y la prueba en un teléfono físico;
no se presentan como realizados. El cambio final de contraseña real también
sigue pendiente; el acabado 1.3.1, su QA y su descarga pública ya están verificados.

**Antecedente del correo, no estado actual:** el 11/10 a las 07:46 UTC Gmail
rechazó el intento con SMTP 535. Después, Víctor confirmó la recepción y el
enlace de alta. No recuperar contraseñas de historiales ni pedirlas en el chat.

---

## Plan histórico · 5 de octubre de 2026

*5 de octubre de 2026 · Claude.* Fase 1: **crear cuenta, entrar, recuperar
la contraseña, guardar la lista de vigilancia y borrar la cuenta.** Siguen
cerrados, por decisión de Víctor: opiniones, avisos por correo y avisos push.

**Todo el contenido que sigue pertenece a ese plan histórico.** Sus asignaciones
a Víctor y sus estados de permisos, correo o publicación no son los vigentes.
Para continuar se utiliza el plan del 11/10 enlazado arriba; Codex se encarga
del trabajo técnico pendiente.

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

> **Nota del 06/11/2026:** el camino B ya no es con Brevo, sino con
> **Lettermint** (Países Bajos, UE): Brevo quedó descartado porque mete un
> píxel de apertura. Host `smtp.lettermint.co`, Port `587`, usuario
> `lettermint` y, como contraseña, el token del proyecto. Pasos y orden: paso 5
> de la activación en
> [`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).

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

**Aviso de compatibilidad del 28/10/2026: no ejecutar el procedimiento
antiguo de esta sección con Android 1.4.0/código 22 publicado.** El APK
envía la entrada con contraseña, el registro, el reenvío y la recuperación
directamente a Supabase, sin token CAPTCHA. Activar la protección global de
Auth rechazaría esas operaciones. La renovación de una sesión existente no
demuestra que sea posible volver a entrar después de cerrarla.

El formulario web vigente usa el BFF de `rwadar-acceso/servidor.mjs` y
`rwadar-site/assets/acceso.js`; cambiar solo la `TURNSTILE_SITEKEY` del
JavaScript anterior no integra este acceso. Validar Turnstile únicamente en
el BFF, con CAPTCHA global desactivado, protege sus formularios pero permite
eludirlo llamando directamente a Supabase: no cierra la protección de Auth.

El texto y los pasos siguientes se conservan como antecedente y no autorizan
activaciones. La protección completa requiere adaptar y coordinar web y
clientes móviles antes de habilitarla; no se debe romper el APK publicado
para darla por terminada. El estado real de CAPTCHA y los límites de Auth
debe comprobarse en la configuración vigente. Hasta entonces, este refuerzo
sigue pendiente; no se habilitan WAF, servicios nuevos ni cambios de Auth
por este aviso.

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

> **Desde el 06/11/2026** la versión que vale es
> [`rwadar-app/plantillas-auth/recuperar-acceso.html`](../../rwadar-app/plantillas-auth/recuperar-acceso.html):
> el mismo texto con el pie del titular y la dirección postal, que pide
> Lettermint en cada correo. Se pega antes de pasar el SMTP de Auth a
> Lettermint (paso 5.8 de
> [`AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md)).

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

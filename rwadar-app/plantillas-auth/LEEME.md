# Plantillas de correo de Supabase Auth

Contrato: [`docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](../../docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md)
(«Plantilla de Supabase Auth» y punto 3).

| Archivo | Plantilla del panel | Asunto |
|---|---|---|
| `confirmar-alta.html` | *Confirm signup* | `Confirma tu correo y desbloquea gratis la Academy` |

Es el correo de confirmación de hoy (sale por el SMTP de Gmail) convertido en
bienvenida. Es HTML sencillo: sin imágenes remotas, sin píxel y sin enlaces de
seguimiento. Solo enlaza a `{{ .ConfirmationURL }}`, a `rwadar.pages.dev` y al
correo de RWAdar.

El bloque `{{ if .Data.avisos_novedades }}` lee los metadatos del alta. Solo
aparece si la persona marcó la casilla de avisos: la web y la app envían
`avisos_novedades: true` (booleano) y nada en otro caso. Dice que al confirmar
se activan también los avisos y cómo no hacerlo. La base de datos solo guarda
el permiso si el valor es el booleano `true` y la versión es la vigente
(`30_avisos_registrados.sql`).

## Ponerla en el panel (solo con permiso de Víctor)

Cambiar la plantilla es tocar Supabase en línea: **solo con permiso expreso de
Víctor**.

1. Supabase › **Authentication › Emails › Templates › Confirm signup**.
2. Asunto: `Confirma tu correo y desbloquea gratis la Academy`.
3. Cuerpo: borra lo que haya y pega el contenido entero de `confirmar-alta.html`.
4. **Save changes**.
5. Prueba con una cuenta propia, dos veces: sin marcar la casilla (no debe
   salir el párrafo de los avisos) y marcándola (debe salir).

**Orden:** primero esta plantilla; después
`db/30_avisos_registrados_activar_casilla.sql` (hasta entonces la base no
guarda el permiso del alta aunque lleguen los metadatos); y solo entonces la
casilla de avisos de la web y de la app (`AVISOS_NOVEDADES_REMOTOS`).

La base solo guarda el permiso si el correo de confirmación salió **después**
de `activar_casilla` (`confirmation_sent_at` de Auth): quien se dio de alta
antes recibió esta plantilla sin el aviso, o la anterior, y confirmarlo después
no lo apunta (puede apuntarse en Perfil).

`fallo_cerrado.sql` y reaplicar `30_avisos_registrados.sql` apagan la casilla
en la base. Si la plantilla sigue puesta y la web o la app enseñan la casilla,
hay que repetir `db/30_avisos_registrados_activar_casilla.sql` (el verificador
30 lo avisa). `db/30_avisos_registrados_apagar.sql` solo apaga el envío y no
la toca.

**Marcha atrás (retirar la casilla):**

1. `AVISOS_NOVEDADES_REMOTOS = false` en la web y la app, publicar la web y
   enviar la OTA: la casilla deja de enseñarse.
2. `db/30_avisos_registrados_apagar_casilla.sql`: la base deja de guardar el
   permiso del alta.
3. Pegar la plantilla anterior, que está en
   [`docs/tareas/REABRIR-CUENTAS.md`](../../docs/tareas/REABRIR-CUENTAS.md)
   («Plantillas de correo»), con su asunto `Confirma tu cuenta de RWAdar`.

Si además hay que dejar de enviar avisos: `db/30_avisos_registrados_apagar.sql`.

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

**Orden:** la casilla de avisos de la web y de la app (`AVISOS_NOVEDADES_REMOTOS`)
no se enciende hasta que esta plantilla esté puesta.

**Marcha atrás:** pegar la plantilla anterior, que está en
[`docs/tareas/REABRIR-CUENTAS.md`](../../docs/tareas/REABRIR-CUENTAS.md)
(«Plantillas de correo»), con su asunto `Confirma tu cuenta de RWAdar`.

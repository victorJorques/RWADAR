# RWAdar · estado para la presentación

> Escrito el 13 de agosto de 2026 y revisado el **14 de agosto** atacando la
> base en línea, no leyendo el código. Si abres un chat nuevo, empieza por
> aquí: está comprobado, no supuesto.

---

## Lo que funciona y puedes enseñar sin miedo

Comprobado contra https://rwadar.netlify.app hace minutos:

| | |
|---|---|
| La web carga | 200, 751 ms |
| Las 26 fichas del radar | sí, pre-renderizadas |
| Los 4 descartes con su fuente | sí |
| El explicador 3D | sí |
| El radar de portada | sí |
| La descarga de datos (CSV) | 200 |
| La política de privacidad | 200 |
| La página 404 | 404 correcto |

Ese es el producto. **Es real, los datos son verdad y cada descarte tiene su fuente.**

## Las cuentas y las opiniones · TODO FUNCIONA (14 de agosto)

`cd rwadar-app && node probar-produccion.mjs` da **20 correctas, 0 fallidas**
contra la base en línea: se registra, opina, comprueba que la opinión sale
publicada, la borra, vigila una plataforma, intenta moderar sin ser admin y
borra su cuenta sin dejar rastro.

Lo único que sigue sin funcionar es **recibir un aviso por correo**: falta la
cuenta de Brevo, que es el paso 3 de aquí abajo.

### Había TRES fallos, y dos no estaban escritos en ningún sitio

1. `moderar(p_usuario, p_plataforma, …)` no existía. *(Ya se sabía)*
2. **Faltaban los GRANT** sobre `opiniones` y `denuncias`: quien intentaba
   opinar recibía `403 · 42501 permission denied for table opiniones`.
3. **La base prohíbe escribir en esas tablas directamente** y publica
   funciones para ello — y la web seguía haciendo el INSERT de siempre.

Los dos últimos no se ven leyendo el código: el repositorio sí concede los
permisos (`09_opiniones.sql:156`) y no sabe nada de esas funciones, así que
las pruebas locales pasaban en verde mientras la web estaba muerta para todo
el mundo.

### El contrato real de producción

Medido, no leído. Lo dejaron las migraciones fantasma 14 y 15:

| Operación | Producción |
|---|---|
| `insert into opiniones` | **prohibido** · «las opiniones se modifican mediante las operaciones publicadas» |
| `insert into denuncias` | **prohibido** · «las denuncias se crean mediante la operacion publicada» |
| `update` / `delete` sobre `opiniones` | permitidos |

```
guardar_opinion(p_plataforma uuid, p_nota integer, p_texto text)  → devuelve el uuid
denunciar_opinion(p_opinion_id uuid, p_motivo text)
borrar_mi_opinion(p_opinion_id uuid)
```

**Corrección importante a lo que decía este documento:** en producción la tabla
`opiniones` **sí tiene columna `id`**, y la vista `opiniones_publicas` expone
`opinion_id` y ya **no** expone `usuario_id`. Por eso la `moderar()` de
producción pedía `p_opinion_id`: no estaba rota, estaba al día de un esquema
que el repositorio no conoce. La firma por par (usuario, plataforma) se añadió
igualmente y las dos conviven; la web prueba las dos.

La web ya llama a las tres operaciones publicadas, con vuelta atrás al INSERT
directo por si algún día se levanta la base solo desde el repositorio.

---

## Los 3 pasos, por orden de importancia

### 1 · Que el registro funcione en directo · HECHO

**Authentication → Sign In / Providers → «Confirm email» → apagar → Save**

Comprobado: el alta devuelve sesión al momento. Contrapartida honesta: no se
verifica que el correo sea real. Para una demo es lo correcto; para abrir al
público de verdad, hace falta el paso 3.

### 2 · Aplicar `16_reparacion.sql` · HECHO

Aplicado pegándolo entero en el editor SQL del panel. Devolvió los permisos
perdidos, añadió la firma de `moderar()` que usa la web e instaló el reloj de
avisos (`pg_cron` + `pg_net`), que no hace nada hasta que exista la clave de
Brevo. Las tres cosas están demostradas antes de tocar producción con
`node probar-reparacion.mjs`: 52 comprobaciones contra un Postgres real,
reproduciendo primero el estado roto.

Si hubiera que volver a aplicar algo, hay dos vías. Pegarlo en el editor del
panel funciona. Con token, `rwadar-app\aplicar-sql.cmd` (se genera en
https://supabase.com/dashboard/account/tokens y **se revoca al terminar**).

**Dos trampas del editor SQL, las dos costaron un rato:**

*Ejecuta pero no pinta el resultado.* Se queda en «Click Run to execute your
query» aunque la consulta haya ido bien — se ve en la pestaña de red:
`POST /pg-meta/…/query → 201`. Es facilísimo creer que ha fallado. Para leer
lo que devuelve sin fiarse de esa pantalla, se engancha la respuesta desde la
consola del navegador:

```js
const orig = window.fetch;
window.fetch = async function (...a) {
  const r = await orig.apply(this, a);
  if (String(a[0]).includes('/pg-meta/')) window.__ultima = await r.clone().json();
  return r;
};
// pulsar Run y luego:  window.__ultima
```

*Rellenarlo por JavaScript no basta para verlo funcionar.* `setValue` mete el
texto y el botón *Run* incluso lo ejecuta, pero la aplicación no lo registra
en su estado y no pinta nada. Para trabajar de verdad hay que pegarlo a mano.

Después, para ver que ha quedado bien:

```
cd rwadar-app && node probar-produccion.mjs
```

### 3 · Que los correos salgan de verdad (5 minutos, gratis) — puede esperar

1. Cuenta en **Brevo** (300 correos/día gratis, **no exige dominio propio**).
2. Verifica `rwadar@protonmail.com` como remitente.
3. Copia la clave de API.
4. En Supabase, *Integrations → Vault*, crea dos secretos:
   - `BREVO_API_KEY` → la clave
   - `RWADAR_REMITENTE` → `rwadar@protonmail.com`

El reloj ya instalado en el paso 2 empieza a enviar solo, cada 5 minutos.

---

## Cómo se comprueba esto sin creerse nada

Tres comandos, ninguno necesita token:

```
node rwadar-arrancar.js                    # web, ficheros publicables y Supabase
cd rwadar-app && node probar-reparacion.mjs   # la migración 16, contra Postgres real
cd rwadar-app && node probar-produccion.mjs   # la base EN LÍNEA, atacándola como la web
```

El último se registra de verdad, opina, vigila e intenta moderar, y termina
llamando a `borrar_mi_cuenta()`. No deja rastro y lo comprueba después. Es la
única forma de ver los fallos de permisos: contra el Postgres embebido, el
esquema del repositorio pasa en verde porque el repositorio está bien. Lo que
está mal es la base de producción.

## Deuda que hay que saldar, pero no mañana

**El repositorio ya no describe la base.** Se aplicaron a producción migraciones «14 y 15» que **no existen como fichero** en `rwadar-app/db/`. Hasta que se recuperen, nadie puede reconstruir este proyecto desde cero — y eso es justo lo que se estuvo cuidando durante semanas.

Y ya ha costado algo, no es una deuda teórica: **los permisos que faltaban sobre `opiniones` y `denuncias` los quitó algo que no está escrito en ningún sitio.** El repositorio los concede; producción no los tenía. La explicación más probable es que una de esas dos migraciones fantasma hiciera un `revoke` amplio para tapar la fuga de la cola de moderación y no volviera a conceder estas dos. Mientras 14 y 15 sigan sin fichero no hay forma de saberlo, y tampoco de saber qué más se llevaron por delante.

Cuando haya token a mano, esto lo saca casi entero —definiciones de funciones, vistas, políticas y permisos actuales— para poder escribir los ficheros que faltan:

```sql
select p.proname, pg_get_functiondef(p.oid) from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public';
select table_name, grantee, privilege_type from information_schema.role_table_grants
  where table_schema = 'public' order by table_name, grantee;
```

Además, en producción hay una `moderar(p_accion, p_motivo, p_opinion_id)` que espera un id de opinión **que no existe**: la tabla tiene clave compuesta `(usuario_id, plataforma_id)`. Conviene borrarla cuando se conozcan sus tipos exactos.

---

## Recoger lo que se deja encendido

Trabajar en esto levanta procesos que se quedan vivos horas si nadie los para:
`rwadar-servir.js` (puerto 4173) y `expo start --tunnel` (puerto 8081). Para
verlos y pararlos:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'rwadar|expo' } |
  Select-Object ProcessId, CreationDate
```

Se paran con `Stop-Process -Id <id> -Force`. Conviene mirarlo al terminar cada
sesión: no rompen nada, pero se acumulan.

## Trampas que ya nos costaron horas

**Chrome estrangula las pestañas que no están en primer plano.** El panel de Supabase no arranca en ellas y parece que el servidor está caído. Pasó dos veces: una «encontrando» un fallo inexistente en el 3D, otra culpando a Supabase de una caída que no existía. Si el editor SQL no carga, mira `document.visibilityState` antes de culpar a nadie.

**El editor SQL trunca y duplica lo que se escribe con teclado.** Llegó a dejar `desc;desc;`. La vía fiable es `monaco.editor.getModels()[0].setValue(...)`.

**Pero rellenar el editor así NO permite ejecutarlo desde fuera.** El texto entra y se ve, y el botón *Run* no hace nada: la aplicación ejecuta lo que tiene en su propio estado, que sigue vacío. Probado con clic real, con clic sintético y con la secuencia entera de eventos de puntero. Para aplicar SQL sin manos hace falta token y `aplicar-sql.cmd`; el panel es solo para mirar.

**Un fallo de permisos no se ve desde el código.** `permission denied for table X` (código 42501) es un GRANT que falta, no una política de RLS: RLS devuelve una lista vacía, la falta de permiso devuelve 403. Las pruebas contra el Postgres embebido nunca lo cazan, porque aplican el esquema del repositorio, que sí está bien. Solo aparece atacando la base de verdad — para eso está `probar-produccion.mjs`.

**El `Forbidden` al publicar en Netlify es normal.** El script lo detecta, sube como borrador y lo promueve. No es falta de créditos.

**Una vista de Postgres se salta el RLS** si no lleva `security_invoker = true`. Así se filtró la cola de moderación entera a cualquier usuario registrado. Si el panel marca una vista como `UNRESTRICTED`, hazle caso.

**Comprobar con las tablas vacías no prueba nada.** «Devuelve vacío» puede significar «está protegido» o «no hay datos». Hay que meter datos reales y volver a atacar.

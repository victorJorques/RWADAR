# Copias de seguridad, ensayo de restauración y actualización de Postgres

Supabase gratuito **no guarda copias que puedas descargar**. Si la base se
estropea, se pierden las cuentas, el catálogo editorial y el historial. Esta
guía lo resuelve en cuatro partes:

1. **Una copia automática cada noche**, cifrada y guardada en GitHub 35 días.
2. **Un ensayo de restauración** que comprueba que esa copia se puede
   recuperar de verdad, sin tocar Supabase.
3. **Cómo recuperar los datos en Supabase** si algún día hace falta, sin
   revivir lo que la gente borró.
4. **Cómo actualizar Postgres sin miedo**, una vez que ya hay copia.

---

## Parte 1 · La copia automática

### Qué se copia

| Se copia | No se copia (y no hace falta) |
|---|---|
| Cuentas de usuario (`auth`) | Secretos del Vault: van cifrados con la clave del proyecto y no sirven fuera |
| Datos de la app (`public`) | Lo que Supabase vuelve a montar solo (almacenamiento interno, extensiones) |
| Catálogo editorial (`rwadar_catalogo`) | El código: ya está en este repositorio |
| Avisos a registrados (`rwadar_novedades`): quién se apuntó y cuándo, las bajas, los móviles, los anuncios y las colas de envío | Las suscripciones de las notificaciones web y sus envíos (`suscripciones_web`, `envios_web`): se copia la tabla, sin filas. Llevan la dirección de entrega y las claves de cada navegador y así no pasan en claro por GitHub (anexo legal del 12/11/2026, C3). Tras restaurar, cada persona vuelve a pulsar «Activar» en la web |

Si un esquema aún no existe en la base (por ejemplo, `rwadar_novedades` antes
de aplicar la migración 30), la copia sigue adelante sin él: `pg_dump` solo se
para si no encuentra **ninguno** de la lista.

**La cartera («Mis inversiones», `rwadar_cuentas_privadas`) todavía no entra
en la copia de cada noche.** Tiene una protección extra (cada persona solo ve
la suya, incluso para el dueño de la tabla: `FORCE ROW LEVEL SECURITY`) y la
copia solo puede leerla si el usuario de la conexión (`postgres` de Supabase)
puede saltarse esa protección (superusuario o `BYPASSRLS`). Si no puede, falla
la copia entera, también la que hacen «Aplicar catálogo» y «Avisos a
registrados (base)» antes de cambiar nada. Por eso primero se prueba, sin riesgo: ver
[Probar la cartera](#probar-la-cartera).

La copia va **cifrada** con una contraseña que solo tú conoces. Sin ella el
archivo no se puede abrir, aunque alguien lo descargue.

### Activarla (una sola vez, unos 5 minutos)

**1 · Copia la dirección de la base.**
En Supabase, abre el proyecto de RWAdar → botón **Connect** (arriba) →
pestaña **Session pooler**. Copia la dirección que empieza por
`postgresql://postgres.` y sustituye `[YOUR-PASSWORD]` por la contraseña de
la base. Si no la recuerdas: *Project Settings → Database → Reset database
password*.

> Usa **Session pooler**, no «Direct connection»: la directa solo funciona por
> IPv6 y los servidores de GitHub no lo tienen.

**2 · Inventa una contraseña para las copias.**
Larga, de 16 caracteres o más, distinta de todas las demás. **Apúntala en tu
gestor de contraseñas.** Si la pierdes, las copias no se pueden abrir.

**3 · Guarda las dos en GitHub.**
Repositorio `RWADAR` → **Settings → Secrets and variables → Actions → New
repository secret**:

| Nombre | Valor |
|---|---|
| `SUPABASE_DB_URL` | la dirección del paso 1 |
| `COPIA_CLAVE` | la contraseña del paso 2 |

GitHub no deja volver a leer un secreto una vez guardado, ni siquiera a ti.

**4 · Haz la primera copia ahora.**
Pestaña **Actions → Copia de seguridad → Run workflow**, con lo que sale por
defecto (`habituales`, `normal`). Tarda 2 o 3 minutos. Si sale en verde, ya
está.

> GitHub solo enseña el botón y ejecuta el horario nocturno si el workflow
> está en la rama principal (`main`).

A partir de ahí se hace sola **todas las noches a las 02:43 UTC**, siempre con
los esquemas habituales y guardándola 35 días. Si una noche falla, GitHub te
manda un correo.

### Las dos opciones del botón «Run workflow»

| Opción | Valores | Qué hace |
|---|---|---|
| `esquemas` | `habituales` (por defecto) | Lo mismo que cada noche. |
| | `habituales-y-cartera` | Añade la cartera (`rwadar_cuentas_privadas`). De momento solo se admite con `modo` = `prueba`. |
| `modo` | `normal` (por defecto) | Hace la copia, la comprueba y la guarda 35 días como `copia-rwadar-N`. |
| | `prueba` | Hace la copia y la comprueba igual (descifra, compara, cuenta), pero **no la guarda en ningún sitio**: se borra con la máquina de GitHub al terminar. |

El horario de la noche no usa estas opciones: siempre `habituales` y `normal`.

### Probar la cartera

Sirve para saber, sin riesgo, si el usuario de la copia puede leer la cartera.
No cambia la copia de cada noche ni guarda nada.

1. **Actions → Copia de seguridad → Run workflow**.
2. `esquemas` = `habituales-y-cartera`, `modo` = `prueba` → **Run workflow**.
3. Abre la ejecución → paso **Hacer, comprobar y cifrar la copia**.

Qué puede salir (ejemplo real del ensayo en local, con una base de imitación):

**En verde.** El usuario puede saltarse la protección y la cartera entra entera:

```text
1/4 · Copiando esquemas: public rwadar_catalogo auth rwadar_novedades rwadar_cuentas_privadas
    Con protección forzada (FORCE RLS): rwadar_cuentas_privadas.carteras
    ¿Puede el usuario de la copia saltársela (superusuario o BYPASSRLS)? sí
2/4 · Comprobando que la copia se puede leer
    41 tablas con datos; imprescindibles presentes.
    rwadar_cuentas_privadas.carteras: 2 filas en la base, 2 en la copia.
```

Solo salen números: nunca el contenido de una cartera.

Qué hacer: incluir la cartera en la copia de cada noche, como **cambio
aparte y con el visto bueno de Víctor**, porque cambia qué datos personales
se guardan 35 días en GitHub:

- en `rwadar-app/copia-seguridad.sh`, añadir `rwadar_cuentas_privadas` a la
  lista por defecto (`ESQUEMAS`); eso vale también para las copias previas
  de «Aplicar catálogo» y «Avisos a registrados (base)»;
- en `.github/workflows/copia-seguridad.yml`, quitar el paso «Comprobar lo
  elegido», que ahora solo deja la cartera en modo prueba;
- actualizar el registro de actividades
  (`docs/legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`, que hoy dice «no se
  copia: la cartera») y, si hace falta, la privacidad;
- lanzar una copia `normal` y después el [ensayo de
  restauración](#parte-2--ensayo-de-restauración), que comprobará que la
  cartera también se recupera.

**En rojo, con «no» y este error de `pg_dump`.** El usuario de la copia no
puede saltarse la protección:

```text
    ¿Puede el usuario de la copia saltársela (superusuario o BYPASSRLS)? no
pg_dump: error: query failed: ERROR:  query would be affected by row-level security policy for table "carteras"
ERROR: pg_dump no ha podido hacer la copia: el usuario de la copia no puede leer las tablas con protección forzada (le falta BYPASSRLS). …
```

No se ha roto nada: la copia de cada noche sigue igual, sin la cartera. Qué
hacer:

- de momento, nada: la cartera se queda fuera de las copias, como hoy (el
  registro de actividades ya lo dice);
- para incluirla haría falta un usuario que pueda saltarse la protección, o
  quitar la protección forzada de la tabla. Las dos cosas son decisiones de
  seguridad que se estudian aparte, con revisión y permiso de Víctor. **No
  se resuelve con `--enable-row-security`**: con esa opción `pg_dump` no
  falla, pero saca la cartera **vacía sin avisar** (comprobado en local:
  0 filas y salida correcta).

**En rojo por otra cosa** (conexión, contraseña de la base…): lo mismo que
con la copia normal. Revisa el secreto `SUPABASE_DB_URL`.

#### Por qué la prueba no puede engañar

- `pg_dump` lee con la protección desactivada (`row_security = off`): si el
  usuario no puede saltársela, falla en vez de copiar a medias.
- El script nunca usa `--enable-row-security`.
- Aun así, cuenta las filas de cada tabla con protección forzada en la copia
  y en la base. Si la base no se deja contar entera, o si la copia sale vacía
  con la base llena, se para con error. Las dos cosas están ensayadas en
  local, forzando el fallo.

### Comprobar a mano que una copia se abre

Lo cómodo es el [ensayo de restauración](#parte-2--ensayo-de-restauración),
que lo hace todo en GitHub. Si quieres verlo en tu ordenador:

1. *Actions → Copia de seguridad →* la ejecución más reciente → abajo,
   **Artifacts** → descarga `copia-rwadar-N`.
2. Descomprime el zip. Dentro hay un `.dump.gpg`, su `.sha256` y un
   `LEEME.txt`.
3. En **Git Bash** (viene con Git para Windows), dentro de esa carpeta:

   ```bash
   gpg --decrypt rwadar-FECHA.dump.gpg > rwadar.dump
   pg_restore --list rwadar.dump | grep "TABLE DATA" | head
   ```

   Te pedirá la contraseña de las copias. Si ves una lista de tablas
   (`auth users`, `public plataformas`…), la copia está bien.
4. **Borra `rwadar.dump` al terminar**: es la copia sin cifrar.

---

## Parte 2 · Ensayo de restauración

Una copia que nunca se ha restaurado no es una copia, es una esperanza. El
flujo **«Ensayo de restauración»** coge la última copia buena, la descifra y la
restaura entera en un Postgres 17 **de usar y tirar** que vive dentro de la
misma máquina de GitHub. No se conecta a Supabase ni a nada en línea.

### Cuándo lanzarlo

- **Ahora**, la primera vez (nunca se ha hecho).
- Una vez al mes.
- Antes de actualizar Postgres (parte 4) o de cualquier cambio arriesgado en
  la base.

Cada vez gasta unos 3 minutos de Actions. No tiene horario, para no gastar
minutos solo.

### Cómo lanzarlo

**Actions → Ensayo de restauración → Run workflow.** No pide nada. Usa el
secreto `COPIA_CLAVE` que ya existe. Como todos los flujos, tiene que estar
en `main` para que salga el botón.

### Qué hace, paso a paso

1. Busca la ejecución correcta más reciente de «Copia de seguridad» que tenga
   un artefacto `copia-rwadar-N` sin caducar (las de modo prueba no tienen y
   se saltan) y lo descarga.
2. Comprueba la suma SHA-256 y descifra la copia con `COPIA_CLAVE`.
3. Prepara el Postgres vacío con **lo mínimo de Supabase** (ver la tabla de
   abajo) y restaura la copia con `pg_restore`.
4. Comprueba que `pg_restore` termina sin ningún error, que **cada tabla
   tiene exactamente las mismas filas que la copia** y que las imprescindibles
   existen y tienen filas: `public.plataformas`, `public.fuentes`,
   `rwadar_catalogo.revisiones` y `auth.users`.
5. Borra la base de ensayo, los roles de imitación, la copia descifrada y la
   descargada. La máquina de GitHub se destruye al terminar.

Solo enseña **recuentos por tabla**, en el registro y en el resumen de la
ejecución. Nunca filas ni correos. Si `pg_restore` falla, enseña qué objeto
falló y la primera línea del error; si el error viene de cargar datos, lo
oculta, porque podría llevar datos personales (ensayado en local: el error
en bruto traía un correo dos veces; lo que enseña el ensayo, ninguna).

El propio Postgres de ensayo tampoco apunta esos errores en su registro. Sin
eso, la fila que falla saldría entera (correo y hash de la contraseña) en el
paso «Stop containers», que GitHub imprime al final de cada trabajo con
contenedores de servicio. El script lo pide con `PGOPTIONS` (`log_min_messages`
y `log_min_error_statement` a `panic`) y se para si el servidor no lo acepta,
así que necesita un superusuario. Ensayado en local el 07/11/2026 con una fila
que rompe un `CHECK`: el correo sale 0 veces en la salida y 0 en el registro
del servidor (antes, 2).

Ejemplo real del ensayo en local, con una base de imitación hecha con las
migraciones del repositorio (los números de producción serán otros):

```text
1/5 · Comprobando y descifrando rwadar-20261107-1250.dump.gpg
    suma SHA-256 correcta.
    copia hecha el 2026-11-07 12:50:03 UTC desde Postgres 17.11.
    esquemas: auth public rwadar_catalogo rwadar_novedades
2/5 · Preparando un Postgres vacío con lo mínimo de Supabase
    roles de imitación creados: anon authenticated service_role.
3/5 · Restaurando con pg_restore
    pg_restore ha terminado sin errores.
4/5 · Comprobando las tablas (solo recuentos)
    tabla                                                     filas
    auth.users                                                    3
    public.plataformas                                           30
    rwadar_catalogo.revisiones                                   14
    …
    40 tablas, 4171 filas en total.
    imprescindibles con filas: public.plataformas public.fuentes rwadar_catalogo.revisiones auth.users.
    todas las tablas tienen las mismas filas que la copia.
5/5 · Ensayo correcto: esta copia se puede restaurar. Ahora se borra todo.
Limpieza:
    base de ensayo rwadar_ensayo_restauracion borrada.
    roles de imitación borrados: anon authenticated service_role.
    archivo descifrado y temporales borrados.
```

### Lo mínimo de Supabase que prepara

La copia trae solo algunos esquemas, pero sus políticas y vistas se refieren
a cosas de Supabase y de otros esquemas que no van en ella. En un Postgres
vacío no existen, y sin ellas `pg_restore` no puede crear esos objetos. Lo
que prepara `rwadar-app/ensayo-restauracion.sh` antes de restaurar, solo si
la copia no lo trae:

| Qué | Por qué |
|---|---|
| Roles `anon`, `authenticated` y `service_role` (sin acceso a nada) | Las políticas dicen `to anon, authenticated` |
| Quita el esquema `public` vacío de la base nueva | La copia trae su propio `CREATE SCHEMA public` |
| Esquema `extensions` con `pgcrypto` y `uuid-ossp` | Es donde Supabase tiene sus extensiones, por si algo de la copia las usa |
| `rwadar_cuentas_privadas.sesion_confirmada()` (devuelve siempre «no»), y una tabla `carteras` vacía | Las políticas de `public` la llaman y la vista `public.mi_cartera` lee esa tabla |
| `rwadar_comunidad_privada.sin_enlaces()` (devuelve siempre «sí») | Dos restricciones de `public.publicaciones` la llaman |

Las imitaciones no dan acceso a nada y no se cuentan en el resultado. El
resto (`net`, `cron`, `vault`, `rwadar_acceso_privado`) solo aparece dentro
del código de funciones, que Postgres no comprueba al restaurar, así que no
hace falta imitarlo.

### Qué no comprueba

- **Los permisos.** La copia se hace sin permisos (`--no-privileges`), así que
  lo restaurado no sabe quién puede leer qué. Por eso la recuperación de
  verdad monta la estructura con las migraciones y solo carga los **datos**
  de la copia (parte 3).
- Que la web funcione contra esa base: el ensayo no publica nada.

### Si el ensayo falla

Lee las líneas `from TOC entry …` del paso «Restaurar en el Postgres de usar
y tirar y comprobar»: dicen qué objeto falló.

| Mensaje | Qué pasa | Qué hacer |
|---|---|---|
| `No hay ninguna copia correcta sin caducar` | Las copias caducan a los 35 días, o la copia nocturna lleva tiempo fallando | Mira «Copia de seguridad»; lanza una a mano |
| `la suma SHA-256 no coincide` | El archivo está dañado | Prueba con otra copia (descárgala y ensáyala a mano, abajo) |
| `no se ha podido descifrar` | `COPIA_CLAVE` no es la contraseña con la que se hizo esa copia | Comprueba el secreto con tu gestor de contraseñas |
| `role "…" does not exist` | Una política nueva usa un rol que no está en la lista | Añádelo a `ROLES_IMITACION` en `rwadar-app/ensayo-restauracion.sh` |
| `schema "…" does not exist` o `function … does not exist` | Algo de la copia llama a un esquema que no va en ella | Añade su imitación mínima en el mismo script, con su porqué |
| `lo restaurado no coincide con la copia` | Faltan filas en alguna tabla | No te fíes de esa copia; avisa y revisa |

Un ensayo en rojo no toca nada: ni Supabase ni las copias guardadas.

### Ensayarlo en tu ordenador

Con Postgres 17 instalado y un servidor local que puedas tirar después:

```bash
COPIA_CLAVE='...' PGHOST=localhost PGPORT=5432 PGUSER=postgres \
  bash rwadar-app/ensayo-restauracion.sh carpeta-de-la-copia
```

El script se niega si `PGHOST` no es tu propio equipo, si ese Postgres tiene
roles de Supabase (no es de usar y tirar) o si ya existe la base
`rwadar_ensayo_restauracion`. Al terminar la borra, con sus roles de
imitación y el archivo descifrado.

---

## Parte 3 · Recuperar de verdad en Supabase

Es una operación delicada y **toca Supabase en línea: solo con permiso
expreso de Víctor**. Ensáyala antes en un proyecto de Supabase de prueba,
nunca directamente encima de la base en uso.

### Antes de empezar

1. **Si la base actual todavía responde, haz una copia ahora** (*Run workflow*,
   `habituales`, `normal`). Es tu vuelta atrás y, además, la necesitas para no
   revivir datos borrados (más abajo).
2. **Elige la copia**: la más reciente que esté bien. Pásale el [ensayo de
   restauración](#parte-2--ensayo-de-restauración). Si no sale en verde, no la
   uses.
3. **Trabaja en una carpeta de tu ordenador que no se sincronice** (ni
   OneDrive, ni Google Drive, ni Dropbox). Ahí vas a tener los datos sin
   cifrar mientras dura la recuperación. Necesitas Git Bash y Postgres 17 al
   día (17.6 o posterior: el archivo de datos empieza por `\restrict`, que los
   `psql` anteriores no entienden).

### No revivir lo que la gente borró (RGPD, art. 17)

Una copia es una foto del día en que se hizo. Si la cargas, vuelve **todo**
lo que había ese día, también lo que alguien borró después:

- **las cuentas** que sus dueños borraron con «Borrar mi cuenta» después de
  la copia: reaparecerían con su correo y sus datos. Eso iría contra su
  derecho de supresión (RGPD, art. 17);
- **las bajas de los avisos**: quien se dio de baja después de la copia
  volvería a estar apuntado (retirar el permiso tiene que ser definitivo,
  art. 7.3).

Cómo evitarlo depende de si la base vieja todavía se puede leer:

- **Se puede leer** (lo normal: una migración que salió mal, unos datos
  estropeados, una actualización fallida). Antes de cargar, saca de la base
  vieja dos listas con **solo identificadores**, sin correos:

  ```bash
  psql "BASE-VIEJA" -X -At -c 'select id from auth.users' > vivas.txt
  psql "BASE-VIEJA" -X -At -c 'select usuario_id from rwadar_novedades.preferencias where not novedades' > sin-avisos.txt
  ```

  `BASE-VIEJA` es la dirección del Session pooler del proyecto viejo. Toda
  cuenta que esté en la copia y no en `vivas.txt` se borró después de la
  copia: se borra otra vez al cargar (pasos 4 y 5). Quien esté en
  `sin-avisos.txt` vuelve a quedar de baja.

  **Ojo:** si lo que se perdió son precisamente las cuentas (por ejemplo, se
  borraron muchas por error), no uses `vivas.txt`, porque borrarías las que
  quieres recuperar: sigue como en el caso siguiente.
- **No se puede leer** (la base se ha perdido del todo). No hay forma
  automática de saber quién se borró entre la copia y el fallo. Como las
  copias son diarias, el hueco es de menos de un día. Restaura la copia más
  reciente, salta el archivo `no-revivir.sql` del paso 4 y, antes de abrir la
  web, revisa en `rwadares@gmail.com` las peticiones de borrado y de baja
  de esas horas y aplícalas a mano (las bajas, con
  `select rwadar_novedades.baja_por_correo('correo@de.la.persona');`).

En los dos casos, **los avisos se quedan apagados** después de recuperar
(paso 6) hasta que Víctor los encienda. Antes de encenderlos, repasa también
la lista de bajas de Lettermint y el buzón, y quita en
`rwadar_novedades.dispositivos` los móviles que ya no estaban en la base
vieja.

### Pasos

Probado en local de principio a fin con una base de imitación: tras cargar,
la cuenta borrada después de la copia no vuelve, la baja se mantiene y nada
choca.

1. **Estructura.** Crea un proyecto nuevo en Supabase y aplica las
   migraciones del repositorio: las de `rwadar-app/db/` en el orden que indica
   `rwadar-app/LEEME.md` y después las de `rwadar-app/supabase/migrations/`.
   Así se recuperan también los permisos, que la copia no trae. Los lotes del
   catálogo no hace falta aplicarlos: vienen en la copia.

   Recuperar encima del proyecto en uso no está cubierto por esta guía: sus
   cuentas chocarían con las de la copia. Y el proyecto nuevo tiene otra
   dirección: la web y la app apuntan a la vieja (`rwadar-site/assets`,
   `rwadar-movil/lib`). Pasarlas al nuevo es publicar la web y enviar una OTA,
   y configurar en él Auth (plantillas, direcciones de vuelta) y los secretos
   del Vault: cada cosa, con permiso de Víctor.

2. **Archivo de datos.** Descifra la copia y prepara los datos, sin la tabla
   interna de Auth (`auth.schema_migrations`), que el proyecto nuevo ya trae
   con sus propias filas:

   ```bash
   gpg --decrypt rwadar-FECHA.dump.gpg > rwadar.dump
   pg_restore --list rwadar.dump | grep -v ' TABLE DATA auth schema_migrations ' > lista.txt
   pg_restore --data-only --use-list=lista.txt --file=datos.sql rwadar.dump
   ```

3. **Orden para vaciar.** Las migraciones dejan filas de partida (las
   plataformas del catálogo, la configuración de los avisos…) que chocarían
   con las de la copia. Esta línea escribe la orden que vacía las tablas de
   la app que trae la copia (no toca `auth`):

   ```bash
   awk '$4 == "TABLE" && $5 == "DATA" && $6 != "auth" { printf "%s%s.%s", (n++ ? ", " : "truncate table "), $6, $7 } END { print ";" }' lista.txt > vaciar.sql
   ```

   El proyecto tiene que estar **sin cuentas** (nuevo): si alguien se ha
   registrado ya en él, la carga choca y no entra nada.

4. **No revivir.** Si tienes `vivas.txt` y `sin-avisos.txt`, guarda esto como
   `no-revivir.sql` en la misma carpeta:

   ```sql
   create temp table vivas (id uuid primary key);
   \copy pg_temp.vivas from 'vivas.txt'
   create temp table sin_avisos (id uuid primary key);
   \copy pg_temp.sin_avisos from 'sin-avisos.txt'
   do $$
   begin
     if (select count(*) from pg_temp.vivas) = 0 then
       raise exception 'vivas.txt está vacío: no sigas, borrarías todas las cuentas';
     end if;
   end $$;
   -- Cuentas de la copia que ya no estaban: se borraron después de la copia.
   select count(*) as cuentas_que_no_se_reviven
     from auth.users u where not exists (select 1 from pg_temp.vivas v where v.id = u.id);
   delete from auth.users u where not exists (select 1 from pg_temp.vivas v where v.id = u.id);
   -- Quien se dio de baja de los avisos después de la copia sigue de baja.
   select count(rwadar_novedades.baja_por_correo(u.email)) as bajas_aplicadas
     from auth.users u
     join rwadar_novedades.preferencias p on p.usuario_id = u.id
     join pg_temp.sin_avisos s on s.id = u.id
    where p.novedades;
   ```

   Borrar en `auth.users` es lo mismo que hace «Borrar mi cuenta»: se llevan
   por delante sus datos en cascada.

5. **Carga, todo en una transacción.** Vacía, carga con los automatismos de
   la base apagados (si no, al recuperar los usuarios la base les crearía un
   perfil vacío nuevo que chocaría con el de la copia; es el método que
   recomienda Supabase), los vuelve a encender y quita lo que no hay que
   revivir:

   ```bash
   psql "DIRECCIÓN-DEL-SESSION-POOLER" -X --single-transaction -v ON_ERROR_STOP=1 \
     -f vaciar.sql \
     -c 'SET session_replication_role = replica' -f datos.sql \
     -c 'SET session_replication_role = origin' -f no-revivir.sql
   ```

   Si no tienes `vivas.txt` (la base vieja se perdió del todo), quita
   `-f no-revivir.sql` del final de la orden. O entra todo o no entra nada.

   Si algún día la copia incluye la cartera, cargarla exige lo mismo que
   copiarla: un usuario que pueda saltarse su protección (ver [Probar la
   cartera](#probar-la-cartera)).

6. **Avisos a registrados (migración 30), siempre tras cargar:** vuelve a
   aplicar `rwadar-app/db/30_avisos_registrados.sql` y pasa
   `rwadar-app/db/30_avisos_registrados_verificar.sql`.
   - Si la copia es anterior a la 30, no trae su fila de configuración y la
     tabla se habría quedado vacía: la 30 la vuelve a crear (su `insert … on
     conflict`).
   - Si la trae, la 30 la deja con todo apagado: correo, push, aviso
     automático de ofertas y casilla del alta, sin reloj de envío y con el
     reloj diario de limpieza.
   - Los avisos quedan apagados hasta que Víctor los vuelva a encender (antes,
     lo dicho arriba sobre las bajas). Si la web o la app enseñan la casilla
     de avisos, ejecuta también
     `rwadar-app/db/30_avisos_registrados_activar_casilla.sql` (el
     verificador lo avisa).
7. **Comprueba** que la web enseña el catálogo con las mismas plataformas que
   antes del problema, y que los recuentos de las tablas cuadran con los del
   ensayo de esa copia.
8. **Borra la carpeta de trabajo entera** (`rwadar.dump`, `datos.sql`,
   `vivas.txt`, `sin-avisos.txt`…): son datos personales sin cifrar.

---

## Parte 4 · Actualizar Postgres

Supabase ofrece pasar de la versión **17.6** a la **17.11**, que corrige fallos
de seguridad. La actualización:

- deja la base **sin servicio hasta una hora**: la web enseña su copia, pero
  no puede refrescar datos;
- **no tiene vuelta atrás** a la versión anterior;
- en el plan gratuito no hay copia automática por si sale mal.

Por eso el orden es este:

1. **Ten una copia de hoy y pásale el [ensayo de
   restauración](#parte-2--ensayo-de-restauración)** (en verde).
2. Elige una hora con poco tráfico, por ejemplo de madrugada.
3. Supabase → *Project Settings → Infrastructure* → **Upgrade project**.
   Comprueba que el destino es **17.11** (o la versión estable que ofrezca) y
   **no** una «preview». Confirma.
4. Espera a que el panel diga que el proyecto vuelve a estar activo.
5. Comprueba:
   - la web carga y enseña el catálogo con las mismas plataformas y
     referencias que antes;
   - en el editor SQL, esta consulta devuelve **0 filas** (ninguna función
     peligrosa abierta al público):

     ```sql
     select p.oid::regprocedure as funcion
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and (has_function_privilege('anon', p.oid, 'EXECUTE')
            or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
     ```

   - lanza otra copia a mano (*Run workflow*) para tener una ya en la versión
     nueva, y su ensayo.

Si algo falla después de actualizar, tienes la copia del paso 1 para
recuperar los datos (parte 3).

---

## Preguntas rápidas

**¿Cuánto cuesta?** Nada en dinero. Las copias pesan muy poco y caben de
sobra en lo que GitHub da gratis a un repositorio privado. En minutos de
Actions: unos 3 por copia (cada noche) y unos 3 por ensayo (solo cuando lo
lances).

**¿Quién puede descargarlas?** Quien tenga acceso al repositorio privado. Aun
así, sin la contraseña de las copias no pueden abrirlas.

**¿Y si cambio la contraseña de la base?** Actualiza el secreto
`SUPABASE_DB_URL` en GitHub. Si no, la copia de esa noche fallará y te llegará
un correo.

**¿Y si cambio la contraseña de las copias?** Las copias ya hechas siguen
abriéndose solo con la contraseña vieja. Guarda las dos hasta que caduquen
las copias viejas (35 días). El ensayo usa la del secreto `COPIA_CLAVE`, así
que fallará con las copias anteriores al cambio hasta que haya una nueva.

**¿Puedo hacer una copia desde mi ordenador?** Sí, con Git Bash y Postgres 17
instalados:

```bash
SUPABASE_DB_URL='...' COPIA_CLAVE='...' bash rwadar-app/copia-seguridad.sh mis-copias
```

Para probar la cartera desde tu ordenador, añade
`COPIA_ESQUEMAS_EXTRA=rwadar_cuentas_privadas` delante. Esa copia sí se
queda en tu carpeta: bórrala al terminar.

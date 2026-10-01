# Copias de seguridad y actualización de Postgres

Supabase gratuito **no guarda copias que puedas descargar**. Si la base se
estropea, se pierden las cuentas, el catálogo editorial y el historial. Esta
guía lo resuelve en dos partes:

1. **Una copia automática cada noche**, cifrada y guardada en GitHub 35 días.
2. **Cómo actualizar Postgres sin miedo**, una vez que ya hay copia.

---

## Parte 1 · La copia automática

### Qué se copia

| Se copia | No se copia (y no hace falta) |
|---|---|
| Cuentas de usuario (`auth`) | Secretos del Vault: van cifrados con la clave del proyecto y no sirven fuera |
| Datos de la app (`public`) | Lo que Supabase vuelve a montar solo (almacenamiento interno, extensiones) |
| Catálogo editorial (`rwadar_catalogo`) | El código: ya está en este repositorio |

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
Pestaña **Actions → Copia de seguridad → Run workflow**. Tarda 2 o 3
minutos. Si sale en verde, ya está.

> GitHub solo enseña el botón y ejecuta el horario nocturno si el workflow
> está en la rama principal (`main`).

A partir de ahí se hace sola **todas las noches a las 02:43 UTC**. Si una noche
falla, GitHub te manda un correo.

### Comprobar que una copia se puede abrir

Hazlo la primera vez y luego de vez en cuando. Una copia que nunca se ha
abierto no es una copia, es una esperanza.

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

### Recuperar los datos (si algún día hace falta)

Es una operación delicada. **Ensáyala antes en un proyecto de Supabase de
prueba**, nunca directamente encima de la base en uso.

1. Crea un proyecto nuevo en Supabase (o usa el mismo si solo se han perdido
   datos y la estructura sigue bien).
2. Aplica las migraciones del repositorio para tener la estructura: las de
   `rwadar-app/db/` en el orden que indica `rwadar-app/LEEME.md` y después
   las de `rwadar-app/supabase/migrations/`.
3. Descifra la copia y conviértela en un archivo de datos:

   ```bash
   gpg --decrypt rwadar-FECHA.dump.gpg > rwadar.dump
   pg_restore --data-only --file=datos.sql rwadar.dump
   ```

4. Carga los datos con los automatismos de la base apagados mientras dura
   la carga. Si no se apagan, al recuperar los usuarios la base les crearía
   un perfil vacío nuevo y chocaría con el que viene en la copia. Es el
   método que recomienda Supabase:

   ```bash
   psql "DIRECCIÓN-DEL-SESSION-POOLER" --single-transaction -v ON_ERROR_STOP=1 \
     -c 'SET session_replication_role = replica' -f datos.sql
   ```

   Va todo en una sola transacción: o entra todo o no entra nada.
5. Abre la web y comprueba que salen las 26 plataformas.

---

## Parte 2 · Actualizar Postgres

Supabase ofrece pasar de la versión **17.6** a la **17.11**, que corrige fallos
de seguridad. La actualización:

- deja la base **sin servicio hasta una hora**: la web enseña su copia, pero
  no puede refrescar datos;
- **no tiene vuelta atrás** a la versión anterior;
- en el plan gratuito no hay copia automática por si sale mal.

Por eso el orden es este:

1. **Ten una copia de hoy y comprueba que se abre** (parte 1).
2. Elige una hora con poco tráfico, por ejemplo de madrugada.
3. Supabase → *Project Settings → Infrastructure* → **Upgrade project**.
   Comprueba que el destino es **17.11** (o la versión estable que ofrezca) y
   **no** una «preview». Confirma.
4. Espera a que el panel diga que el proyecto vuelve a estar activo.
5. Comprueba:
   - la web carga y enseña 26 plataformas y las referencias del catálogo;
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
     nueva.

Si algo falla después de actualizar, tienes la copia del paso 1 para
recuperar los datos (parte 1, «Recuperar los datos»).

---

## Preguntas rápidas

**¿Cuánto cuesta?** Nada. Las copias pesan muy poco y caben de sobra en lo que
GitHub da gratis a un repositorio privado.

**¿Quién puede descargarlas?** Quien tenga acceso al repositorio privado. Aun
así, sin la contraseña de las copias no pueden abrirlas.

**¿Y si cambio la contraseña de la base?** Actualiza el secreto
`SUPABASE_DB_URL` en GitHub. Si no, la copia de esa noche fallará y te llegará
un correo.

**¿Puedo hacer una copia desde mi ordenador?** Sí, con Git Bash y Postgres 17
instalados:

```bash
SUPABASE_DB_URL='...' COPIA_CLAVE='...' bash rwadar-app/copia-seguridad.sh mis-copias
```

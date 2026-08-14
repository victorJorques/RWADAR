# RWAdar · la base de datos

Todo el contenido del proyecto vive aquí. La web y la app móvil no son más
que dos formas de leer esta base: **si un dato está mal, se corrige en
Supabase, nunca en el HTML ni en la app.**

Panel: https://supabase.com/dashboard/project/exgpmjpaaebyoolpwced

```
db/01_schema.sql   Catálogo, plataformas, fuentes y las reglas editoriales
db/02_seed.sql     El contenido. Se genera desde producción, no se edita
db/03_app.sql      Historial, dispositivos y seguimiento (avisos push)
db/04_rls.sql      Seguridad por fila
db/06_archax...    Alta de Archax y Republic (8 ago 2026) · ya aplicado
db/07_cuentas.sql  Cuentas, lista de vigilancia y avisos por correo · SIN APLICAR
probar-db.mjs      19 comprobaciones del registro
probar-cuentas.mjs 17 comprobaciones de las cuentas
volcar-seed.js     Regenera 02_seed.sql desde la base en producción
sincronizar.js     Vuelca el contenido en index.html y genera rwadar.csv
instalar-base-de-datos.cmd   Instala los cuatro primeros en un proyecto nuevo
aplicar-sql.cmd    Aplica UN fichero suelto (para migraciones posteriores)
```

**No apliques migraciones desde el editor SQL del panel.** Con ficheros de
varios kB parte el pegado por la mitad y deja la migración a medias: pasó
con `07_cuentas.sql`. Para eso está `aplicar-sql.cmd`, que va entero o no va.

Los cuatro `db/*.sql` **son la instalación entera y la única fuente de verdad
del esquema.** Hubo un `supabase_completo.sql` que los juntaba en uno; se
quedó atrás sin que nadie lo notara y se ha retirado. Si vuelve a hacer falta
un fichero único, que lo genere un script, no una copia a mano.

## Lo que hay que saber antes de tocar nada

**Las reglas editoriales viven en la base, no en la aplicación.** Una ficha
sin licencia, sin acceso o con una web en `http://` la rechaza Postgres al
escribirla. Un motivo de descarte de menos de 40 caracteres, también. No
depende de que nadie valide bien: es que el dato incoherente no cabe.

**Ninguna descartada sin fuente. Nunca.**

```sql
select * from descartadas_sin_fuente;
```

Debe devolver **cero filas siempre**. Hoy las devuelve: 4 descartadas con 10
fuentes. Señalar por su nombre a una empresa sin poder demostrarlo es el
único riesgo legal serio del proyecto, y Apple y Google retiran una app de
inmediato ante la reclamación de una empresa nombrada.

Es lo primero que comprueba `node rwadar-arrancar.js`, y también lo primero
que hay que mirar antes de enviar una versión a revisión.

**El historial se escribe solo.** Mover una plataforma al descarte dispara un
registro en `cambios_estado` mediante un *trigger*. Es imposible degradar una
plataforma sin dejar rastro, y ese rastro es lo que alimenta los avisos push.

**Seguir plataformas no exige registrarse.** El dispositivo se identifica con
un código anónimo de instalación: menos abandono en la primera pantalla y
ningún dato personal almacenado, que en una app financiera es una ventaja
legal además de una de producto.

**La clave publicable no puede escribir.** Va dentro de la web y de la app, o
sea que es pública por definición; comprobado contra el servidor: un INSERT
con ella devuelve 401. El catálogo solo se modifica desde el panel o con un
token personal.

## Operaciones

Las pruebas no necesitan Supabase ni Docker: levantan un Postgres embebido,
aplican los cuatro ficheros y comprueban 19 reglas, del recuento de fichas a
que un cambio de estado genere el aviso correcto a quien seguía esa ficha.

```bash
npm install        # solo la primera vez
node probar-db.mjs
```

Cuando cambie el contenido en producción, para que el fichero de instalación
no se separe de la base real:

```bash
node volcar-seed.js
```

Instalar el esquema en un proyecto de Supabase nuevo (hace falta un token
personal de *Account → Access Tokens*, y conviene revocarlo al terminar):

```bash
instalar-base-de-datos.cmd sbp_xxxxxxxx
```

`sincronizar.js` no se ejecuta a mano: lo llama `rwadar-publicar.js` como
primer paso de cada publicación.

## Historia que explica el estado actual

La lista de descartadas empezó con **12 nombres y ninguna fuente**. Se
retiraron ocho porque el motivo era juicio de valor —"escala pequeña", "poca
transparencia", "nicho"—, entre ellas Kinesis, cuya crítica sobre auditorías
es de 2021, procede de un blog enmarcado en una disputa por difamación y
quedó desmentida por auditorías posteriores. De las cuatro que quedaron se
corrigieron errores de hecho: RealT no estaba en liquidación en abril sino
desde julio, y lo pendiente en Goldfinch no eran 18 M$ sino más de 50 M$.

Esa depuración era una migración aparte (`05_descartadas_verificadas.sql`).
Ya está absorbida en `02_seed.sql`, que se regenera desde producción, así que
el fichero se ha retirado: aplicado sobre una instalación nueva habría
duplicado fuentes.

## Pendiente

En *Storage → Buckets* quedó un bucket **vacío** llamado `setup-temporal` de
un intento fallido. No contiene ni expone nada, pero conviene borrarlo desde
el panel: el CLI borra objetos, no el bucket.

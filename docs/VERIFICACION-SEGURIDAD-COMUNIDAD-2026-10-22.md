# Seguridad de cuentas y comunidad · revisión del 22/10/2026

## Estado y alcance

La comunidad sigue apagada. No se publicó la web, compiló la app, activó una
función remota ni aplicó una migración a producción durante este trabajo.
Los cambios siguientes son locales y se ensayaron en Postgres PGlite.

La lectura real de metadatos de Supabase confirmó que **no existen** las tablas
`public.publicaciones`, `public.cupos_publicacion` ni
`public.denuncias_publicaciones`, ni las seis RPC de comunidad. Sí existe
`rwadar_cuentas_privadas.sesion_confirmada()`. Por tanto, la 27 continúa sin
aplicar: no se ha supuesto su estado a partir del traspaso antiguo.

## Fallos encontrados y cambios preparados

El SQL preparado de comunidad comprobaba `auth.uid()` pero no la sesión real:
un JWT aún no vencido después de revocarse podía seguir llamando a las RPC.
Las seis operaciones ahora exigen el helper de sesión confirmada existente:
correo confirmado, usuario no anónimo, `session_id` perteneciente al usuario,
sesión no revocada ni vencida y JWT vigente y coherente.

La entrada `autor` solo tenía límite de longitud y admitía enlaces en el nombre
del perfil. Ahora comparte filtro con `texto`, incluidos dominios fuera de la
lista antigua y caracteres invisibles básicos. Un nombre rechazado no consume
el cupo, y publicar sin mostrarlo conserva «Miembro de RWAdar». Este filtro no
es una garantía de detectar toda estafa u ofuscación: sigue haciendo falta
moderación humana.

Tres cuentas recién creadas podían ocultar una publicación legítima. Todas las
denuncias válidas siguen entrando en la cola; para contar en el umbral de
ocultación automática, tanto el alta como la confirmación del correo deben
haber ocurrido **al menos siete días antes de denunciar**. La aptitud se guarda
al crear la denuncia: esperar o repetirla no aumenta su peso. Tres cuentas
consolidadas distintas conservan el umbral. Los siete días son una política
conservadora de esta preparación, no un mecanismo completo contra cuentas
coordinadas antiguas. La fila se bloquea al denunciar para serializar sus
recuentos con la moderación.

Las seis firmas RPC públicas se conservan como `SECURITY INVOKER`. La
implementación privilegiada pasa a `rwadar_comunidad_privada`, con `search_path`
vacío, referencias cualificadas, sin permisos de `PUBLIC`/`anon` y sin conceder
al cliente lectura de `auth.users` o `auth.sessions`. Ese esquema debe permanecer
fuera de los esquemas expuestos por la Data API.

La reaplicación conserva publicaciones anteriores, reconstruye sus cupos y no
da peso automático a denuncias históricas. Las restricciones nuevas permiten
ocultar un autor antiguo con enlace, pero impiden restaurarlo sin corregirlo;
no se borra ni oculta contenido por ejecutar la migración. El cierre revoca
también la implementación privada, conservando todos los datos.

## Archivos y aplicación futura

La CLI Supabase **2.120.0**, ya instalada, creó mediante `migration new`:

`rwadar-app/supabase/migrations/20261022010741_comunidad_confirmada_y_moderacion.sql`.

Su contenido coincide exactamente con `rwadar-app/db/27_comunidad.sql`, que es
el instalador preparado y nunca aplicado. La prueba exige esa igualdad para
evitar divergencias. La marcha atrás está en `27_comunidad_cerrar.sql`.

**Aplicar cualquiera de los dos archivos de apertura habilitaría las tablas,
la lectura y las RPC de comunidad en la base.** No debe ejecutarse con un
`db push` genérico ni como refuerzo de cuentas aislado. Su aplicación, el papel
de los administradores y la apertura de la interfaz requieren la decisión y
autorización concretas del titular. La migración de sesión del 11/10 debe estar
aplicada antes; si falta, se rechaza la instalación completa.

## Pruebas locales

`node rwadar-app/probar-comunidad.mjs` ejecutado desde `rwadar-app/`:
**64 comprobaciones correctas, cero fallidas**. Se aplicaron literalmente el
instalador y la migración varias veces. Incluye:

- Las seis RPC ante JWT vencido, `session_id` inexistente/ausente, usuario anónimo
  y `sub` ajeno; revocación y `not_after` vencido reales en la tabla Auth simulada.
- Correo sin confirmar, claims que contradicen el estado anónimo de Auth,
  separación de privilegios y ausencia de lectura de tablas Auth por clientes.
- Enlaces en texto y autor, validación sin consumir cupo, pseudónimo seguro,
  propiedad de filas, datos personales no expuestos y favorito no involucrado.
- Tres cuentas nuevas, cuenta antigua recién confirmada, duplicados y umbral
  de tres cuentas consolidadas; todas las denuncias siguen llegando a la cola.
- Actualización con contenido anterior, restauración segura, cupos persistentes,
  borrado de cuenta y cierre sin borrar datos ni dejar llamadas privadas abiertas.

Auth/GoTrue, la firma de JWT y el correo se simulan. PGlite verifica el SQL y
los privilegios, no la autenticación completa del servicio ni una app real.

También terminaron con **salida 0** `npm --prefix rwadar-app run test:cuentas`
y `npm --prefix rwadar-app run test:seguridad`, incluido el refuerzo anterior
de cuentas (196 comprobaciones) y ACL/cierre posteriores. Logs locales en
`rwadar-entrega-20261022/test-cuentas-refuerzo-comunidad.log` y
`test-seguridad-refuerzo-comunidad.log`. `git diff --check` de estos archivos
de SQL y prueba, correcto.

## Configuración remota pendiente de inventario y decisión

**Turnstile:** no se activó. Supabase exige la integración en los clientes y el
`captchaToken` en las llamadas de Auth protegidas. Antes de cambiar la opción
global hay que comprobar el widget existente, sus dominios, la clave pública
y el paso del desafío tanto en web como en Android. La 1.3.2 publicada no debe
quedar bloqueada por activar una exigencia que su cliente no satisface. No se
crearon widgets ni claves ni se leyeron secretos. La clave secreta se introduce
solo en el servidor correspondiente, nunca en Git, documentación o cliente.

**Redirecciones:** el objetivo es el Site URL y la allowlist de producción
`https://rwadar.pages.dev/`, sin dominios antiguos, comodines o previews
innecesarias. El inventario real de configuración Auth no estaba disponible
en las herramientas de lectura empleadas; no se afirma que ya se haya corregido.
Se debe revisar la lista exacta antes de retirar entradas y comprobar el flujo
de confirmación y recuperación después, sin fabricar cuentas ni enviar correos
durante este ensayo.

El agente web coordina la corrección de `error_description` no confiable y el
aviso de identidad al adoptar una sesión de enlace. Este trabajo no modifica
el JS web ni los módulos nativos de cuentas.

El asesor de seguridad remoto de solo lectura conserva avisos previos: tres
informativos de RLS sin políticas en tablas push/cierre, `pg_net` en `public`,
dos RPC `SECURITY DEFINER` de cuentas ejecutables por authenticated y protección
de contraseñas filtradas desactivada. No se han ocultado esos avisos ni cambiado
permisos de producción. En las dos RPC de cuentas, el refuerzo de sesión y la
reautenticación de baja existentes siguen siendo relevantes; el aviso no prueba
por sí mismo una explotación. Este asesor describe producción, no la migración
de comunidad que continúa sin aplicar.

## Fuentes primarias revisadas

Se leyó el changelog actual y la documentación de Supabase antes de preparar el
SQL. El aviso de retirada de cifrados TLS CBC afecta a clientes HTTP antiguos
a partir del 10/11, no cambia el contrato de estas funciones SQL; no se hizo
ninguna afirmación nueva de compatibilidad de teléfonos físicos.

- [Changelog de Supabase](https://supabase.com/changelog).
- [Aviso TLS CBC del 12/10](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).
- [RLS y autorización](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Usuarios anónimos y rol authenticated](https://supabase.com/docs/guides/auth/auth-anonymous).
- [CAPTCHA en Auth](https://supabase.com/docs/guides/auth/auth-captcha).
- [URLs de redirección](https://supabase.com/docs/guides/auth/redirect-urls).
- [Avisos sobre funciones privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- [Protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

# RWAdar · backend y base de datos

Esta carpeta contiene el esquema reproducible, los instaladores y las pruebas
locales. El contrato fresh-install actual termina en la migración 22 y debe
producir exactamente **las plataformas en radar y descartadas que trae
`db/02_seed.sql`** (el volcado de producción de `volcar-seed.js`; las pruebas
las cuentan ahí, sin fijar un número) **y ninguna descartada sin fuente**.

## Estado de producción · 20 de agosto de 2026

En `exgpmjpaaebyoolpwced`, la migración 22 (`02F2...0666`) terminó en
`COMMIT` mediante SQL Editor y devolvió `schedule=19`. Su verificador interno
de solo lectura (`4182...2C3`) terminó con `Success. No rows returned` y el
aviso `RWAdar 22 OK: permisos, RPC, correo/push apagados y retención diaria
verificados`.

El smoke público posterior confirmó radar 26, descartadas 4,
`opiniones.usuario_id` 401, moderación directa 401, ausencia de la firma antigua
de `moderar` (404/PGRST202) y rechazo anónimo de la firma nueva (401/42501).
Security Advisor quedó en **0 Critical** y **0 Security Definer View**. La 22
está aplicada y verificada en producción; no se debe reaplicar para comprobarla.

La suite raíz local terminó con código 0 e incluyó DB (270 aserciones + 8 gates
SQL), web 122/122, QR 6/6, móvil 7/7 y tools. En Auth todavía figura
`mailer_autoconfirm=false`, Confirm email está activo y signup sigue habilitado.
No hay SMTP propio y todavía faltan pruebas E2E reales de confirmación y
recuperación. Correo de avisos y push siguen apagados.

## Cadena vigente

El instalador nuevo ejecuta, en este orden:

```text
01, 02, 03, 04,
06, 07, 08, 09, 10, 11, 12,
14_seguridad_integral, 15_acl_funciones,
17_avisos_push (capacidad instalada, envío apagado),
18, 19, 20, 21 (emisiones),
22_cierre_regresiones
```

Después ejecuta cuatro verificadores SQL de solo lectura: 14, 15, 22 y el
contrato fresh-install 26/4. Una excepción en cualquiera significa que la
instalación no está aprobada.

Estos ficheros **no pertenecen a la cadena automática**:

- `13_envio_avisos.sql`: histórico no replayable. Usa el dominio antiguo,
  interpola HTML sin escapar y el cierre 22 lo vuelve a apagar. No se aplica.
- `23_activar_correo.sql`: opt-in idempotente posterior a 22. Solo se ejecuta
  mediante `aplicar-envio-avisos.cmd`; exige Vault/Brevo y aprobación explícita.
  Está inactivo; si algún día se reactiva, también tiene que dejar Brevo (la
  revisión legal del 06/11/2026 lo descartó por el píxel de apertura en el
  correo transaccional), como ya hizo la 31 con los avisos a registrados.
  Su verificador es read-only y `correo_fallo_cerrado.sql` apaga únicamente
  correo sin cortar la API, push ni la retención.
- `16_reparacion.sql`: histórico; reabrió permisos que exponen `usuario_id` y
  escritura directa. No se aplica. La migración 22 conserva su parte útil y
  cierra la regresión.
- `14-15_recuperado.sql`: retrato de producción, expresamente no replayable.
- `RECUPERAR-14-15.sql`: consulta de diagnóstico, no una migración.
- `activar_push.sql`: opt-in posterior a una prueba E2E; solo se ejecuta con
  `activar-push.cmd`. Fresh-install y 22 nunca lo llaman.

## Seguridad que no se puede relajar

- `anon` nunca puede leer `opiniones.usuario_id`.
- El cliente no hace `INSERT/UPDATE/DELETE` directo en opiniones o denuncias;
  usa RPC autenticadas que derivan la identidad con `auth.uid()`.
- Solo `service_role` puede ejecutar `establecer_admin`.
- Las funciones auxiliares/trigger no conservan `EXECUTE` para
  `PUBLIC`, `anon` ni `authenticated`.
- Todas las vistas expuestas son `security_invoker`.
- `x-instalacion` es una credencial bearer aleatoria (`inst_` + UUID), no un
  dato para publicar. RLS solo acepta ese formato y los grants de dispositivo
  enumeran las columnas que la app puede insertar/actualizar; `user_id` y las
  fechas de retención quedan fuera.
- La cola push tiene RLS y ningún permiso cliente. Un ticket aceptado por
  Expo no se confunde con una entrega: a los 15 minutos se consulta su recibo
  y solo un recibo positivo marca `enviado_el`. La ventana máxima es 24 horas.
  El token copiado se borra al finalizar y el rastro final caduca a los 30
  días. Fresh-install, 17, 22, rollback y recuperación dejan
  `push_configuracion.habilitado=false`, no crean el cron `rwadar-push` y las
  propias funciones rechazan llamadas mientras el interruptor esté apagado.
- El correo heredado de 13/16 queda también apagado al aplicar 22, aunque el
  Vault conserve credenciales: se eliminan todos los relojes que invoquen sus
  tres funciones y esas firmas se sustituyen por bloqueos fail-closed sin
  acceso a `net` ni `vault`. La cola `avisos_correo` se conserva intacta. El
  opt-in 23 añade un interruptor privado y auditable, rechaza Vault ausente o
  inválido sin revelar secretos, escapa todo dato interpolado en HTML, usa solo
  `https://rwadar.pages.dev` y mantiene un único cron. No envía el histórico
  acumulado antes de activarse, comprueba la baja y la confirmación del correo
  de nuevo justo antes de entregar y limita los reintentos a cinco. Cada fila
  conserva un UUID idempotente: se reintenta dentro del TTL de Brevo y a los
  25 minutos pasa a «entrega incierta» en vez de arriesgar un duplicado. El
  payload omite el nombre de perfil, desactiva tracking identificable por
  contacto y las ACL ocultan tanto Vault como las colas internas de `pg_net`.
- El `true` heredado de `perfiles.avisos_correo` no se considera consentimiento:
  la primera 23 lo invalida, cambia el valor por defecto a `false` y bloquea el
  `PATCH` directo. Solo `configurar_avisos_correo(habilitado, version)` puede
  registrar fecha y versión (`correo-v1-2026-08-22`) desde una sesión
  autenticada. La web debe mostrar ese texto y usar la RPC antes de desplegar
  correo; mientras no lo haga, el artefacto es deliberadamente NO-GO para
  producción aunque sus pruebas locales pasen.
- La retención de dispositivos no depende del tráfico ni del push. El cron
  independiente `rwadar-retencion-dispositivos` ejecuta cada día a las 03:17
  una limpieza acotada de filas con más de 180 días. La tabla no expuesta
  `retencion_dispositivos_estado` registra la última ejecución, filas borradas,
  acumulado y si quedó atraso; `cron.job_run_details` conserva los fallos del
  trabajo. La FK elimina los seguimientos asociados en cascada.
- Solo existe `moderar(opinion_id, accion, motivo)`. La firma antigua basada
  en `(usuario_id, plataforma_id)` está eliminada.

`db/22_cierre_regresiones_verificar.sql` comprueba estos puntos de forma
fail-closed. `db/22_cierre_regresiones_rollback.sql` es un interruptor de
emergencia: no vuelve al estado vulnerable; desactiva mutaciones y detiene el
reloj push conservando datos y catálogo. Reaplicar 22 recupera la API, pero no
reactiva correo ni push.

Si un instalador falla después de enlazar el proyecto ejecuta automáticamente
`db/fallo_cerrado.sql`. Ese cierre universal no borra datos: revoca todo acceso
de `anon`/`authenticated` a la API `public`, activa RLS y detiene los relojes
de salida de correo/push. La retención diaria permanece activa porque minimiza
datos y no realiza red. La aplicación quedará deliberadamente indisponible hasta que se repare
y se vuelvan a superar los verificadores. Si también fallase el cierre, el
mensaje `ALERTA` obliga a aislar el proyecto manualmente.

## Pruebas locales

No necesitan Supabase ni Docker. Usan PostgreSQL embebido y dobles locales de
`pg_net`, `pg_cron` y Vault; no realizan llamadas de red.

```bat
npm install
npm test
```

La suite general incluye el fresh-install completo, seguridad/RLS/ACL,
opiniones, moderación, push, correo 23, emisiones, instaladores, verificadores y la
reproducción explícita de la regresión 16 seguida de la reparación 22. También
incluye una revisión estática que impide que el smoke remoto recupere el
fallback de escritura directa o la firma antigua de moderación.

`probar-produccion.mjs` no forma parte de `npm test` y no contiene proyecto ni
clave predeterminados. Con `RWADAR_SMOKE_URL` y `RWADAR_SMOKE_ANON_KEY`, su
modo predeterminado solo lee el radar y sus fuentes. Crear la cuenta efímera y
probar mutaciones exige además `RWADAR_SMOKE_MUTANTE=SI` y
`RWADAR_SMOKE_CONFIRMACION=PROBAR-MUTACIONES-REFERENCIA`. Ese modo exige la RPC
nueva, comprueba que `INSERT/UPDATE/DELETE` directos fallen y que la firma vieja
de `moderar` no exista. Su bloque `finally` reintenta `borrar_mi_cuenta` y solo
declara la limpieza confirmada si además el login queda revocado y desaparece
el contenido público; cualquier duda muestra la dirección residual y falla.
Nunca debe ejecutarse sin autorización explícita.

`probar-app-movil.mjs` sigue el mismo patrón con
`RWADAR_MOVIL_SMOKE_URL`/`RWADAR_MOVIL_SMOKE_ANON_KEY`: por defecto solo lee.
El modo de escritura exige `RWADAR_MOVIL_SMOKE_MUTANTE=SI` y
`RWADAR_MOVIL_SMOKE_CONFIRMACION=PROBAR-MOVIL-MUTACIONES-REFERENCIA`. Un
`finally` borra y comprueba la ausencia de dispositivo y seguimiento incluso
si una petición intermedia falla. No guarda tokens Expo ficticios: esa ruta
solo se valida en un E2E push real y separado. Las pruebas locales inyectan
fallos después de cada alta para demostrar ambos cierres sin usar red.

## Instalar un proyecto nuevo

Los instaladores nunca aceptan el token como argumento, nunca usan un proyecto
por defecto y nunca descargan `supabase@latest`. Antes de usarlos:

1. Configura una sesión del CLI o `SUPABASE_ACCESS_TOKEN` en un entorno seguro.
2. Define `RWADAR_SUPABASE_CLI_VERSION` con un SemVer exacto ya validado,
   **2.79.0 o posterior** (`db query` no existe en versiones anteriores). El
   script también comprueba el subcomando antes de enlazar el proyecto.
3. Pasa explícitamente la referencia de 20 caracteres y escribe la frase de
   confirmación que muestra el script.

```bat
instalar-base-de-datos.cmd REFERENCIA_DEL_PROYECTO
```

El correo sigue apagado y bloqueado. Solo después de aprobar proveedor,
privacidad y consentimiento se puede sustituir deliberadamente ese bloqueo:

```bat
set SUPABASE_ACCESS_TOKEN=credencial_configurada_fuera_del_repo
set RWADAR_SUPABASE_CLI_VERSION=VERSION_EXACTA_VALIDADA
set RWADAR_CORREO_PROVEEDOR_APROBADO=SI
set RWADAR_CORREO_PRIVACIDAD_APROBADA=SI
aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
```

Antes, Vault debe contener `BREVO_API_KEY` y `RWADAR_REMITENTE`; el script no
acepta ni imprime sus valores. Ejecuta únicamente `23_activar_correo.sql` y su
verificador read-only, nunca el histórico 13 ni una reaplicación de 22 que lo
volvería a apagar. Si algo falla tras enlazar, aplica
`correo_fallo_cerrado.sql`. Un verificador verde demuestra configuración,
ACL, origen, escape y cron. Un `201` con `messageId` solo demuestra aceptación
por Brevo, no entrega: hay que confirmar el evento `Delivered` o el buzón real,
además de revisar el tracking global de aperturas/clics de la cuenta, antes de
anunciar el correo como operativo.

Push también queda apagado y sin cron. Solo después de completar y documentar
una prueba E2E real se permite configurar, en un entorno seguro,
`SUPABASE_ACCESS_TOKEN`, `RWADAR_PUSH_E2E_APROBADO=SI` y la versión CLI exacta,
y ejecutar:

```bat
activar-push.cmd REFERENCIA_DEL_PROYECTO
```

El script exige la frase `ACTIVAR-PUSH-E2E-REFERENCIA`, valida primero el
estado apagado de 22, aplica únicamente el opt-in y ejecuta
`activar_push_verificar.sql`. Si algo falla tras enlazar, ejecuta
`push_fallo_cerrado.sql`: apaga solo push, minimiza tokens pendientes y no
corta la API ni el reloj de retención.

## Actualizar un proyecto existente

`aplicar-sql.cmd` aplica **solo la migración 22 aprobada**, nunca un histórico,
un rango o un glob. Los históricos 01-21 se reproducen únicamente en orden
mediante el fresh-install (13 mantiene su flujo separado). Para cerrar en un
proyecto que ya tiene 14-21:

```bat
aplicar-sql.cmd REFERENCIA_DEL_PROYECTO db\22_cierre_regresiones.sql
```

En el proyecto de producción de RWAdar este paso ya terminó y pasó su
verificador interno; la receta queda para otra instalación que todavía no tenga
la 22. No se debe anunciar el cierre en otro proyecto hasta que el propio
comando haya superado los verificadores 14, 15, 22 y la paridad 26/4. Aplicar
22 cambia producción y no se hace desde las pruebas locales de este repositorio.
El resultado deliberado es API reparada, retención diaria activa y correo/push
apagados, bloqueados y sin cron.

## Avisos a registrados (30 y 31)

La 30 está **aplicada** en producción desde el 06/11/2026, con todo apagado;
por eso ya no se edita: cualquier cambio va en una migración nueva, como la
31. La 31 está preparada y probada en local; **no aplicada**. Contrato:
[`docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](../docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).

- `db/30_avisos_registrados.sql` (copia idéntica en
  `supabase/migrations/20261105200000_avisos_registrados.sql`): esquema privado
  `rwadar_novedades`, preferencias con permiso versionado
  (`novedades-v2-2026-11-06`, de la revisión legal del 06/11/2026; sustituye a
  la v1, con la que nunca se recogió ningún permiso), bienvenida, anuncios,
  móviles y colas de correo y push (Expo). La 30 sola enviaba el correo con
  Brevo; desde la 31, con Lettermint. Va después de 22, 24-26, el refuerzo de sesión, 28,
  28_REVERTIR y 29. Se aplica en el SQL Editor con una copia hecha antes,
  **nunca** con `supabase db push` (subiría también la 27).
- Todo nace **apagado**, también la casilla del alta (`casilla_activa`: sin
  ella, los metadatos del alta no dan permiso). Reaplicar la 30 vuelve a
  apagarlo todo, casilla incluida, y quita el reloj de envío, como la 22.
  Cada paso necesita permiso expreso de Víctor:
  `30_avisos_registrados_activar_casilla.sql` (con la plantilla de Auth ya
  puesta; fija `casilla_activada_el`; no envía nada ni crea reloj),
  `30_avisos_registrados_activar_correo.sql` (exige la 31 aplicada y
  `LETTERMINT_API_TOKEN` y `RWADAR_REMITENTE` en Vault) y `30_avisos_registrados_activar_push.sql`
  (`EXPO_ACCESS_TOKEN` opcional). Estos dos crean un único reloj de envío
  `rwadar-novedades` cada 5 minutos que solo llama a `rwadar_novedades.procesar()`.
- El permiso del alta solo cuenta si el correo de confirmación salió después
  de activar la casilla (`confirmation_sent_at >= casilla_activada_el`): un
  alta anterior se confirmó con el correo antiguo, sin el aviso.
- Retención: la 30 crea además un reloj diario propio,
  `rwadar-novedades-limpieza` (`41 4 * * *`, solo `rwadar_novedades.limpiar()`,
  sin red), que existe también con todo apagado: colas a los 90 días, móviles
  a los 180.
- Apagar el envío: `30_avisos_registrados_apagar.sql` (correo, push, aviso
  automático de ofertas y reloj de envío; **no** toca la casilla ni el reloj
  de limpieza). Retirar la casilla, al quitar la plantilla de Auth:
  `30_avisos_registrados_apagar_casilla.sql`. Emergencia: `fallo_cerrado.sql`
  lo apaga todo, casilla y reloj de limpieza incluidos.
- **Tras `fallo_cerrado.sql` o tras reaplicar la 30, la casilla queda
  apagada:** si la web o la app la siguen enseñando, repite
  `30_avisos_registrados_activar_casilla.sql` (tras `fallo_cerrado.sql`,
  reaplica antes la 30 para recuperar el reloj de limpieza, y después la 31
  para que el correo vuelva a salir por Lettermint). Comprobar:
  `30_avisos_registrados_verificar.sql` (solo lee; pasa apagado y encendido, y
  avisa si la casilla está inactiva).
- Historial del permiso (`rwadar_novedades.historial_permiso`), solo de
  añadir: cada alta y cada baja con el correo de ese momento, el origen
  (`alta`, `perfil`, `enlace`, `correo`), el canal y el idioma. Sin clave
  ajena: al borrar la cuenta (disparador `BEFORE DELETE` en `auth.users`, que
  nunca impide el borrado) se queda bloqueado con `cuenta_borrada_el`
  (LOPDGDD art. 32) y `limpiar()` lo borra a los 3 años, nunca el de una cuenta
  viva. `configurar_avisos_novedades` admite un cuarto argumento opcional,
  `p_idioma` (`'es'`/`'en'`); el alta lee `avisos_idioma` de los metadatos.
- Baja que llega por correo (RWAdar@protonmail.com), antes del siguiente
  envío y solo el propietario, desde el SQL Editor:
  `select rwadar_novedades.baja_por_correo('persona@ejemplo.com');` (sin
  distinguir mayúsculas; devuelve si encontró la cuenta y deja la fila
  baja/correo en el historial).
- Los anuncios no se borran nunca (copia de lo enviado). Su filtro de palabras
  veta, además de «oportunidad», «rentabilidad», «garantiz…» y %:
  «rendimiento», APY, APR, «sin riesgo», «exclusiv…», «últimas plazas», «no te
  lo pierdas», «gana…», «regalo», «bono», «descuento» y «autorizad…» (p. ej.,
  «mejoras de rendimiento» no pasa). Push: la bienvenida por el canal de
  Android `cuenta` y los anuncios por `novedades`.
- El catálogo no envía nada por su cuenta: una revisión V2 con ofertas nuevas
  crea un anuncio al día, **retenido**. Solo sale con el flujo «Avisar novedad»
  (`.github/workflows/avisar-novedad.yml`, que ejecuta `db/anunciar.sql`) y
  con orden de Víctor; el mismo flujo anuncia actualizaciones y novedades.
- Plantillas de Auth (confirmación de cuenta y recuperación de contraseña): [`plantillas-auth/`](plantillas-auth/LEEME.md).
- **31 · el correo sale por Lettermint** (`db/31_correo_lettermint.sql`, copia
  idéntica en `supabase/migrations/20261106120000_correo_lettermint.sql`). La
  revisión legal del 06/11/2026 descartó Brevo porque mete un píxel de apertura
  también en el correo transaccional. La 31 solo sustituye `correo_mensaje`,
  `leer_correos` y `enviar_correos` (misma firma, dueño, `security definer`,
  `search_path` vacío y ningún permiso para clientes); no enciende nada ni
  toca la configuración, los relojes ni Vault.
  - Envío: `POST https://api.lettermint.co/v1/send` con el token de proyecto
    (Vault `LETTERMINT_API_TOKEN`) en `x-lettermint-token`; `from` «RWAdar
    <`RWADAR_REMITENTE`>», `reply_to` RWAdar@protonmail.com; `settings` con
    `track_opens` y `track_clicks` en `false` en cada correo; sin `tag` ni
    `metadata`. La bienvenida va por la ruta transaccional (la de por defecto,
    sin `route`) y los anuncios por `route: "broadcast"`. `List-Unsubscribe`
    solo para quien está apuntado, sin `List-Unsubscribe-Post`.
  - Idempotencia: la clave uuid de cada fila va en la cabecera HTTP
    `Idempotency-Key`, la misma en cada reintento (Lettermint la guarda 24 h).
  - Respuestas: 202 con `message_id` = aceptado (no es entrega); 409 =
    «incierto» (clave ya usada o en curso: se revisa en el panel y nunca se
    reenvía solo); otro 4xx salvo 408 y 429 = fallido («Lettermint rechazó la
    petición (HTTP n)»); 5xx, 408, 429 o sin respuesta = reintento, hasta 5, y
    a los 25 minutos «incierto», como en la 30.
  - Pie de cada correo con la dirección postal del responsable (Plaza
    Generalitat, s/n, 46600 Alzira, Valencia): la exige la política de uso de
    Lettermint y es la del aviso legal de la web.
  - Si el correo estuviera encendido con Brevo, la 31 se niega (apagar antes);
    lo que hubiera quedado pedido con Brevo pasa a «incierto», nunca se reenvía.
  - **Reaplicar la 30 devuelve el correo a Brevo**: después hay que reaplicar
    la 31. `30_avisos_registrados_activar_correo.sql` se niega a encender sin
    ella (y sin `LETTERMINT_API_TOKEN` y `RWADAR_REMITENTE` con forma válida).
  - Comprobar: `31_correo_lettermint_verificar.sql` (solo lee; junto al
    verificador 30, que ahora es neutral respecto al proveedor).
  - Flujo «Avisos a registrados (base)» (`.github/workflows/avisos-base.yml`):
    `ensayo-31` (la 31 y los verificadores 30 y 31 en una transacción que se
    deshace), `verificar-31`, `aplicar-31` (copia antes y `AVISOS`) y
    `guardar-correo` (copia antes y `AVISOS`): lee el secreto de GitHub
    `LETTERMINT_API_TOKEN` y la entrada `remitente` y los guarda en Vault con
    `db/31_correo_lettermint_guardar.sql` (`vault.create_secret` o
    `vault.update_secret`; psql recibe los valores como variables `-v` desde
    el entorno y no los imprime). No enciende el correo: eso es
    `activar-correo`, que ahora pasa también el verificador 31.
  - Pendiente de la prueba real del paso 5: que la ruta de difusión se llama
    `broadcast`, qué hace con nuestro `List-Unsubscribe` (añade el suyo) y que
    el correo llega sin píxel ni enlaces reescritos.
- Prueba: `node probar-avisos-registrados.mjs` (también en `npm test`): la 30
  y la 31 sobre la cadena de producción, con los pasos del flujo ejecutados de
  verdad con bash y un doble de psql.

## Contenido y sincronización

`02_seed.sql` contiene el bloque inicial; `06_archax_republic.sql` completa la
paridad 26/4. `volcar-seed.js` regenera el seed desde una base autorizada y
`sincronizar.js` genera los datos consumidos por la web. Una descartada sin
fuente bloquea la verificación:

```sql
select * from descartadas_sin_fuente;
```

Debe devolver cero filas siempre.

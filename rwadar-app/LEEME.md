# RWAdar · backend y base de datos

Esta carpeta contiene el esquema reproducible, los instaladores y las pruebas
locales. El contrato fresh-install actual termina en la migración 22 y debe
producir exactamente **26 plataformas en radar, 4 descartadas y ninguna
descartada sin fuente**.

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

- `13_envio_avisos.sql`: activa correo, `pg_net` y `pg_cron`; solo mediante
  `aplicar-envio-avisos.cmd`, después de configurar Vault/Brevo y privacidad.
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
reactiva push.

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
opiniones, moderación, push, emisiones, instaladores, verificadores y la
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

El correo sigue apagado. Para activarlo deliberadamente:

```bat
aplicar-envio-avisos.cmd REFERENCIA_DEL_PROYECTO
```

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

No se debe anunciar el cierre hasta que el propio comando haya superado los
verificadores 14, 15, 22 y la paridad 26/4. Aplicar 22 cambia producción y no
se hace desde las pruebas locales de este repositorio. El resultado deliberado
de aplicar 22 es API reparada, retención diaria activa y push apagado/sin cron.

## Contenido y sincronización

`02_seed.sql` contiene el bloque inicial; `06_archax_republic.sql` completa la
paridad 26/4. `volcar-seed.js` regenera el seed desde una base autorizada y
`sincronizar.js` genera los datos consumidos por la web. Una descartada sin
fuente bloquea la verificación:

```sql
select * from descartadas_sin_fuente;
```

Debe devolver cero filas siempre.

# Revisión de seguridad del 27 de septiembre de 2026

Esta revisión separa la contención actual de la investigación histórica, que
no puede reconstruirse por falta de registros. No se recuperó ni probó el valor
del token. El titular declaró su revocación. CALIX permanece fuera del alcance.

## Corte de servidor para el lanzamiento

Tras la autorización específica de SQL y la autorización completa posterior del
titular, se aplicaron las migraciones24 y25 exclusivamente en RWAdar. Se verificó:

- Borrador oculto bajo rol anon antes de aprobarlo; lote aprobado con26plataformas,
  28referencias,69fuentes y0fechas canónicas incompatibles.
- Cero cifras de precio o rentabilidad en las21referencias no verificables.
- Cero privilegios de mutación por tabla/columna y cero funciones SECURITY DEFINER
  ejecutables por anon/authenticated en public. El catálogo REST sigue funcionando.
- Esquema rwadar_catalogo no expuesto en DataAPI (406/PGRST106); vistas invoker.
- Nuevas altas desactivadas en Auth, confirmación de correo mantenida; comprobación
  HTTP de settings con disable_signup=true y mailer_autoconfirm=false.
- Proceso existente de limpieza de dispositivos de más de180días: cron diario
  activo, ejecuciones succeeded del26y27/09. No se ha ejecutado una purga manual.

70pruebas locales del catálogo reproducen defaults heredados y permisos de columna,
además de integridad, RLS y caducidad. El acceso histórico al token no puede
descartarse retrospectivamente; esto no se presenta como una auditoría histórica
completa. La edición editorial no distribuye secretos ni historial Git.

## Comprobaciones en el proveedor

En la sesión autorizada del panel oficial se observaron dos tokens personales
heredados: `calix-production`, sin caducidad y con último uso mostrado hace
14 días, y `calix-fase3-migraciones`, caducado. No hay un token inequívocamente
identificado como RWAdar. Se guardan aquí solo nombres y estado, no sus valores
ni prefijos parciales.

La consulta del registro de auditoría de la cuenta para el periodo del
14 de agosto al 27 de septiembre fue rechazada por el proveedor: el periodo
solicitado supera la retención de **un día**. La vista de las últimas 24 horas
mostró cero registros; esto no permite inferir ausencia de actividad durante
la ventana completa del incidente.

El conector oficial devolvió una lista vacía de Edge Functions para el proyecto
RWAdar `exgpmjpaaebyoolpwced`. Es un inventario puntual y no acredita su estado
histórico, el de las claves, los miembros o las integraciones.

Referencias del proveedor:

- [Tokens de la cuenta](https://supabase.com/dashboard/account/tokens).
- [Auditoría de la cuenta](https://supabase.com/dashboard/account/audit).
- [Soporte del proveedor](https://supabase.com/dashboard/support/new).

## Escaneo local

Se utilizó Gitleaks **8.30.1**, descargado de la publicación oficial y verificado
antes de ejecutarlo. SHA256 del ZIP de Windows:
`d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`.

Se extendieron sus reglas con `rwadar-app/gitleaks.toml` para detectar tokens
administrativos de Supabase, incluido el prefijo del incidente. No se excluyen
secretos históricos. La única excepción posterior corresponde al identificador
público de Web Analytics, con valor, archivo y regla delimitados como se explica abajo.

- Árbol actual: copia de los 413 archivos regulares que Git enumeraba como
  versionados o no ignorados, más la nueva configuración del escáner, con las
  correcciones posteriores de documentación y CI. No se escaneó el resto de
  Downloads ni otros proyectos.
- Resultado inicial del árbol: una coincidencia `curl-auth-header` en la guía
  archivada `RWADAR-MAPA.md`. Se comprobó sin imprimirla que era una clave
  **publicable**, no un token personal, y se sustituyó por un marcador local
  para no seguir duplicándola en documentación.
- Resultado tras la corrección: **código 0, ningún hallazgo** en ese contenido.
  Un escaneo por patrones no acredita por sí solo ausencia de cualquier secreto.
- Se repitió el escaneo sobre un corte nuevo de **416 archivos** y 16.837.025
  bytes a las 09:36 UTC, incluyendo el código de la integración y el perfil
  editorial gratuito. Volvió a terminar con **código 0, ningún hallazgo**.
  El inventario privado conserva la ruta y SHA256 de cada archivo para
  identificar cambios posteriores; no contiene secretos. Tras las pruebas
  finales del otro chat, solo `docs/INTERNO.md` había cambiado respecto a ese
  corte. Los documentos de cierre posteriores requieren el mismo control
  antes de consolidar el commit.
- Historial local: **38 commits**, todas las referencias locales que Git
  enumeró, con `--all --full-history --root`; **cinco coincidencias**. Una
  confirma el token personal del incidente en
  `rwadar-app/instalar-base-de-datos.cmd:20`, commit
  `229450ce4ee1690f26e3f7c52e9f0e57d8794ea6`. Las otras cuatro son candidatos
  de las reglas `curl-auth-header` y `generic-api-key`; no se declaran todos
  secretos confirmados ni todos falsos positivos sin revisión adicional.
- Informes privados: `rwadar-contactos-2026-09-27/seguridad/`. Una plantilla
  limita los campos a regla, ruta, línea y commit. No contiene el secreto ni
  el fragmento de código que lo incluye.

Se incorporó a CI un escaneo del contenido actual, con versión y SHA256 fijados,
redacción completa y reglas específicas de Supabase. Todavía no se ha ejecutado
ese trabajo en GitHub; se probó localmente el mismo escáner y configuración.
El historial comprometido no se excluye ni se da por resuelto por ese control.

### Integración de Web Analytics y corte final

La suite raíz `npm test` terminó con código 0 después de integrar identidad,
analítica y paridad del catálogo móvil: 315 comprobaciones web y 50 pruebas
móviles, además de base de datos aislada, QR y herramientas. El escaneo de
424 archivos a las 10:17 UTC señaló una coincidencia en el nuevo cargador de
analítica: el identificador público que Cloudflare entrega para insertar en
la página. Ese valor no permite entrar al panel ni administrar la cuenta.
Su origen se comprobó en la instalación oficial de Web Analytics.

`rwadar-app/gitleaks.toml` limita la excepción a la regla `generic-api-key`,
al valor completo conocido y al archivo exacto del cargador, combinados con
`AND`. No se excluye todo el archivo, un prefijo de tokens ni las reglas
administrativas de Supabase. Cinco comprobaciones con valores sintéticos
verifican que solo esa combinación se acepta: el mismo valor en otro archivo,
una clave diferente y ambos tipos de credencial de Supabase siguen detectándose.
La configuración sigue el [formato oficial de Gitleaks 8.30.1](https://github.com/gitleaks/gitleaks/blob/v8.30.1/README.md#configuration).

El resultado del escaneo posterior a esa clasificación queda en el expediente
privado `rwadar-contactos-2026-09-27/seguridad/resultado-final.json`, junto al
inventario por archivo y el informe limitado a regla, ruta, línea y commit.
No se ha reescaneado sin necesidad el historial sin cambios ni convertido
el resultado del árbol en una afirmación sobre toda la actividad del servidor.

### Cierre posterior de servicios de usuario

El corte de las 10:32 UTC supera nuevamente `npm test`: web 329, móvil 56,
base de datos aislada, QR y herramientas. Las pruebas nuevas ejecutan las
capacidades cerradas en dominios públicos y locales, rechazan llamadas directas
a Auth/datos/opiniones y comprueban callbacks sin canje ni persistencia. El
catálogo mantiene sus consultas públicas independientes. Los dos clientes
móviles fijan también `detectSessionInUrl:false`; la exportación final offline
se generó después de ese cambio. No equivale a una build firmada o instalada.

La interfaz y la privacidad no ofrecen acceso a cuentas ni borrado remoto
durante la pausa; mantienen el canal de derechos por correo. Las claves de datos
móviles de versiones anteriores permanecen separadas, sin borrado automático.
Esto reduce las peticiones iniciadas por el cliente nuevo; no revoca sesiones,
elimina datos o cambia RLS en Supabase, ni retira por sí solo clientes antiguos.
Ese corte de cliente fue seguido por la validación y cierre de servidor
documentados al inicio de este informe; la autorización SQL ya no está pendiente.

El escaneo del árbol se repite sobre este corte y su documentación; el registro
`resultado-final.json` indica fecha, inventario exacto, código y número de
hallazgos sin incluir valores de credenciales. La declaración del titular y los
límites históricos siguientes permanecen separados de esta prueba local.

## Límites de la comprobación independiente

El nombre de un token no demuestra su relación con la exposición. Revocar el
único token activo a ciegas afectaría a una integración identificada como CALIX,
fuera del alcance de esta intervención. El titular confirmó después la revocación,
como se registra a continuación. Supabase podría aportar metadatos o evidencia
independiente y aclarar si conserva registros del periodo que el panel ya no
muestra. Hay un borrador privado de esa consulta, sin credenciales, no enviado.

No se rotan tokens identificados como CALIX para suplir la falta de registros
históricos. Cualquier acción sobre sus consumidores requiere un alcance propio.
No se puede fabricar evidencia del proveedor ni restaurar logs inexistentes;
la revocación declarada y la investigación histórica son comprobaciones distintas.

## Confirmación posterior del titular

El 27 de septiembre de 2026, durante esta revisión, el titular comunicó que la
revocación de la credencial antigua ya estaba realizada. Se registra como
**revocación declarada por el titular**. No se afirma que la haya ejecutado el
agente ni que el proveedor haya aportado una fecha o justificante independiente.

Esa confirmación resuelve la falta de declaración del responsable. El historial
de actividad fuera del día conservado por Supabase sigue sin poder contrastarse;
la declaración no se convierte en una auditoría histórica ni en prueba de otras
rotaciones. La comprobación del artefacto y de la beta se evalúa por separado.

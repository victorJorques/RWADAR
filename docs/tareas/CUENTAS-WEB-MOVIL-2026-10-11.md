# Cuentas de RWAdar · web y app · 11 de octubre de 2026

## Resultado y ubicación

Implementación local preparada sobre `claude/abrir-cuentas`, en la rama
`codex/cuentas-web-movil` del worktree adjunto a este chat. No se tocó la copia
antigua de `Downloads` ni sus carpetas sin seguimiento de manual/descargas.
No se ha publicado la web candidata, compilado con EAS, enviado a tiendas
ni activado publicidad o cobros. El refuerzo SQL sí se ha aplicado con permiso
expreso y se ha verificado después mediante consultas de lectura.

La web pública responde, pero sigue con las cuentas pausadas. La revisión
existente permite probar el registro. Supabase acepta altas y exige confirmar
el correo. **Víctor confirmó que el correo de alta llega y que el enlace
funciona; llega a spam.** Se mostró el perfil confirmado y cerrar sesión
funcionó en la revisión existente. Codex solicitó la recuperación desde esa
interfaz el **11/10 a las 08:14:18 UTC**. Los metadatos de Gmail confirman el
asunto «Recupera tu acceso a RWAdar», llegada a **INBOX** y **DKIM/SPF/DMARC
correctos**, sin leer cuerpo, enlace ni token. Todavía no se han verificado
el cambio final de contraseña ni la entrada posterior con esa contraseña
nueva. Víctor la introduce directamente, nunca en el chat. La recuperación
real no se declara completada.
El catálogo público sigue disponible, con **26 plataformas y 49 referencias**;
no está retirado. El APK disponible continúa siendo el **1.2.0**, anterior a
estos cambios. La versión nativa candidata **1.3.0** está preparada para
compilar, pero aún no existe un APK nuevo verificado ni publicado.

## Cambios preparados

- Motor nativo con Supabase JS fijado a `2.112.1`, sesión solo en memoria y
  validación de usuario confirmado mediante `getUser()`. Panel de alta,
  reenvío, entrada, recuperación, perfil, nombre y vigilancia compartida con la
  web. Los favoritos locales siguen siendo independientes.
- Baja nativa y web con contraseña recién comprobada de la misma identidad
  y escritura de BORRAR. Cancelar, cambiar de formulario, desmontar la app o
  iniciar otra sesión invalida respuestas antiguas. Salir retira los datos
  locales antes de esperar a la red; si el servidor no confirma la revocación,
  se informa de que la sesión remota podría seguir activa.
- Web: protección ante carreras de identidad/renovación/carga; no declarar
  guardado si RLS devuelve cero filas; contraseña en campo oculto, no en un
  diálogo de texto del navegador; respuestas y cuerpo limitados a 8 segundos
  y 128 KiB. No se guarda la sesión en caché ni almacenamiento persistente.
- SQL adicional: sesión confirmada, vigente y propia en RLS restrictivo,
  sin reemplazar las reglas de propiedad; baja exige AMR de contraseña de
  los últimos cinco minutos y revoca todas las sesiones antes de borrar datos.
- Privacidad actualizada para diferenciar cuentas, vigilancia y favoritos,
  las versiones nativas anteriores y la sesión nativa en memoria. Manual,
  opiniones, avisos, instalación histórica, publicidad y cobros siguen apagados.

La migración aplicada es
`rwadar-app/supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql`.
Se creó con el CLI oficial fijado a `2.120.0`, y se probó su SQL literal
localmente. **Ya se aplicó en producción, después de la 26, con permiso expreso
de Víctor en este turno.** La lectura posterior verificó las tres políticas
RLS restrictivas, la comprobación de sesión confirmada y vigente, la exclusión
de usuarios anónimos, el esquema privado fuera de REST y la comprobación AMR
de contraseña reciente para la baja. No se activaron opiniones, dispositivos
históricos ni push.

## Compuertas, sin atajos

En la web candidata `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`
permiten comprobar las cuentas en revisión. La recepción de confirmación ya
está acreditada por Víctor; la recuperación real todavía no se considera
completada. El valor del interruptor no es una prueba por sí mismo ni cambia
la web publicada: producción sigue con las cuentas apagadas.
La app candidata **1.3.0** tiene `CUENTAS_REMOTAS=true` y
`CORREO_AUTH_E2E=true` para comprobar estos mismos flujos. Su guarda antigua
`SERVICIOS_USUARIO_REMOTOS=false` se conserva. No existe todavía una app
compilada e instalada que acredite la prueba real nativa.

Víctor autorizó expresamente en este turno la compilación **Android con EAS**
y publicación del APK verificado en **GitHub, sin cargos**. El build todavía
no se ha iniciado mientras Codex comprueba plan y cuota. Si la operación exige
un cargo, esa autorización no permite aceptarlo. Web candidata y APK siguen
pendientes de sus controles y publicación.

**No encender `SERVICIOS_USUARIO_REMOTOS` de la app**: protege la identidad
de instalación, sincronización y push antiguos. Las cuentas usan su guarda
independiente. No activar opiniones, manual, publicidad ni cobros por abrir
las cuentas. El catálogo público tampoco depende de estas compuertas.

## Lo que hace Codex a continuación

1. Completar la recuperación real en revisión: el correo ya está entregado;
   falta abrir su enlace, cambiar la contraseña y entrar con la nueva. Comprobar
   también alta sin confirmar bloqueada, entrada, vigilancia propia y salida
   sobre la versión candidata. No basta un mensaje de envío exitoso. Víctor
   introduce contraseñas y abre sus enlaces; Codex comprueba resultados y
   errores sin leer secretos. No borrar una cuenta real sin autorización de baja.
2. Mejorar la entrega que llega a spam y conservar la confirmación obligatoria.
   El refuerzo de sesión ya está aplicado y verificado; no repetir 26 sin una
   necesidad concreta y nueva autorización. Reejecutarla reemplaza funciones:
   en ese caso hay que reaplicar el refuerzo. Para cerrar, 25 sigue disponible
   y el refuerzo detecta sus ACL; para reabrir: 26 y luego refuerzo.
3. Las pruebas finales de `npm test` y Chrome offline sobre las guardas
   candidatas activadas ya han pasado. Con los flujos reales comprobados,
   revisar privacidad y generar una aprobación nueva. La publicación web está
   autorizada expresamente en este
   turno, pero todavía no ejecutada: respetar la compuerta, publicar revisión,
   comprobar lo servido y los flujos reales antes de producción. No reciclar
   aprobaciones de hashes anteriores ni declarar terminado lo no comprobado.
4. Conservar solo las guardas nativas de cuentas activadas en la candidata
   1.3.0. Verificar paquete/firma/permisos y completar la comprobación de
   plan/cuota de EAS; la autorización actual es **sin cargos**. Si requiere
   pagar, detener ese paso, no aceptar el coste. Compilar,
   instalar el mismo APK y comprobar interfaz y flujos en Android. No presentar
   pruebas Node/SSR como una instalación real; no publicar un binario sin esa QA.
5. Entregar el enlace público verificado y el APK nuevo verificado. La 1.2.0
   existente no incorpora estos cambios. Tiendas e iOS siguen siendo entregas
   distintas, con sus requisitos de identidad y pruebas.

Codex asume toda integración, configuración no secreta, pruebas y publicación
que se autoricen. A Víctor solo le corresponden credenciales/verificación de
identidad, comprobación de su correo y las autorizaciones de producción,
compilación, costes o borrado. No se le asignan cambios de código.

## Pruebas y límites

Evidencia detallada en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
La ejecución final de `npm test`, sobre las guardas de cuentas de web y app
**activadas** y la candidata nativa **1.3.0**, terminó con **código de salida 0**:
web **501**, móvil **180** y SQL **196**; QR y herramientas al día.
Chrome con servicios simulados pasó
**61/61** en el ensayo general y **30/30** en las regresiones adversariales
de sesión, callback, transporte y baja.

La revisión independiente pasó **54/54** casos nativos, **196** SQL y **30**
de Chrome, sin bloqueos. Estos resultados finales no son una prueba de
instalación nativa ni de cambio real de contraseña.

Esas pruebas locales usan fixtures y no envían correos, no escriben en Supabase
y no prueban ni la firma de los JWT reales ni los triggers internos de GoTrue.
La aplicación y postlectura del refuerzo SQL, la confirmación de correo por
Víctor, el perfil y la salida visibles, y los metadatos de entrega de recuperación
son evidencias en línea distintas. No acreditan todavía una recuperación real
completada ni un APK nuevo instalado.
La comprobación móvil interactiva no llegó a completarse con Metro local:
no se conserva ni se contabiliza como prueba un arnés no verificado.

## Antecedente histórico del correo · 11/10, 07:46 UTC

El intento anterior falló con **Gmail 535, credenciales rechazadas**. El
remitente configurado es `rwadares@gmail.com`; las credenciales las introduce
Víctor directamente en Supabase, nunca en el chat ni recuperándolas de
historiales. Este fallo queda como diagnóstico anterior, no como estado actual:
después Víctor confirmó la recepción del correo de alta y su enlace funcionando.

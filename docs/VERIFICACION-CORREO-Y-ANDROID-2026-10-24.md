# Correo y continuación Android · 24/10/2026

El alta del23/10 a21:27:20UTC fue `user_repeated_signup`: cuenta existente,
respuesta200 y ningún envío nuevo. SMTP Gmail ya estaba configurado; no hubo
error SMTP ni429. No se cambió Auth ni se desactivó la confirmación.

El24/10 se solicitó una recuperación al buzón que indicó el titular.
Gmail confirma recepción en la bandeja de entrada a18:04:04UTC, asunto
«Recupera tu acceso a RWAdar». La primera apertura18:06:24 validóOTP, login y
/user200. La segunda18:06:32 falló `One-time token not found`; caducidad3600s.
No se acreditó un cambio de contraseña. La primera pestaña ya no estaba visible.

La preview pedía volver a producción antigua. Ahora registro/recuperación/
reenvío desde revision o un despliegue8hex del mismo proyecto vuelven a la raíz
de revision; producción conserva su raíz. Ambas ya estaban permitidas en Auth.
No se refleja ningún otro origen ni se amplía la lista. Tras cualquier alta200
se explican ambos casos con botones Entrar/Recuperar, conservando correo y
limpiando contraseña. No se revela si existe una dirección.

Después de corregir el destino se pidió un único enlace nuevo, recibido en
Gmail a las 18:19:44 UTC. Se abrió la URL exacta de ese mensaje: la revisión mostró
la identidad del buzón corregido por el titular y, tras pulsar Continuar,
el formulario «Elige tu nueva contraseña», con el botón «Guardar nueva
contraseña». La captura `recuperacion-lista-20261024.jpg`, conservada fuera
de Git en la carpeta de entrega, acredita ese punto. No se ha observado
guardar la contraseña ni entrar después con esa cuenta. El titular aclaró
que el acceso desde Safari a las 18:20 correspondía a otra cuenta en su móvil;
no acredita la recuperación de este buzón. No se atribuye el incidente a
una prelectura automática del correo.

Tres casos nuevos dirigidos aprobados: cuatro recorridos de alta,18 combinaciones
acción/dominio y fragmento de recuperación→identidad→formulario de contraseña.
Sintaxis y diff-check aprobados; no se repitieron33/549 pruebas anteriores.
La contraseña la introduce el titular, sin compartirla por el chat.

El titular indicó después la dirección de producción. Se comprobó en su pestaña
de Chrome el panel «Tu cuenta», con el buzón vcicrack@gmail.com y el nombre visible
«ADMIN». Esto acredita una sesión de esa cuenta en la web pública anterior; el
nombre no demuestra un rol administrativo ni acredita el formulario nuevo de
contraseña. Se conservó su sesión sin modificar el perfil.

Víctor autorizó un ciclo de QA con una cuenta propia temporal, un único correo,
dos secretos temporales en el repositorio privado y limpieza mediante cierre de
sesiones e inhabilitación reversible de esa cuenta. El primer canal de consola
cerró su entrada antes de confirmar; la cuenta quedó limpiada y sin secretos.
Se reanudó esa misma cuenta, sin otra alta ni otro correo, se confirmó el único
enlace real recibido y se prepararon los secretos. No se utilizó la contraseña
del titular. La cuota local registrada de Actions suma 260 minutos en 81
ejecuciones, con la copia posterior de menos de un minuto por añadir; referencia
aproximada de consumo del repositorio, sin autorizar gasto adicional.

El publicador entrega ahora el token editorial únicamente al sincronizador,
retirándolo del entorno heredado por Wrangler. Sintaxis y construcción local
aprobadas tras ese cambio: 26 plataformas, cuatro descartadas y 49 referencias.
No se repitieron las baterías anteriores.

Evidencia sanitizada fuera del repositorio, carpeta de entrega:
`diagnostico-correo-auth-20261024.json` y
`diagnostico-enlace-recuperacion-20261024.json`.

## Android

Mismo APK1.4.0/código19, sin nueva compilación. QA40027041965 conservó estándar,
firma, paquete y49 imágenes del origen40023081613. Falló al alcanzar Crear cuenta
con fuente1,5; el gesto empezaba dentro de Nombre según PNG/XML. Esto no acredita
un fallo del producto ni aprueba el criterio. Solo se corrigió el arnés para usar
márgenes libres observados, fuera de controles. Geometría real, sintaxis y
diff-check aprobados; los controles no se relajaron.

La continuación 40119180570 produjo
`qa-c19-40119180570-20261024/evidence/anonymous-access-result.json`, fuera de
Git, con estado `passed-scoped-only`. Los pasos nuevos aprueban alcanzar los
controles con fuente 1,5, mantener ausente el catálogo sin cuenta, mostrar
el requisito de 12 caracteres y llegar a recuperación sin enviarla. También
aprueban ausencia de excepciones de ejecución. La red de los formularios
estaba bloqueada en modo avión, sin wifi ni datos. La validación de correo
inválido no queda acreditada en estos pasos nuevos.

Se intentó el giro, pero la salida real siguió en 900×1600 y la política de
la app es vertical: no acredita un diseño apaisado. Identidad del paquete,
49 imágenes y recorrido estándar proceden de la evidencia anterior
40023081613, con su procedencia conservada; no se presentan como pruebas
nuevas de esta continuación. La ejecución global 40119180570 terminó
cancelada. El resultado acotado no equivale a 20/20 ni aprueba una release:
el propio informe mantiene `full20PointQA=false`, `releaseApproved=false`
y la QA autenticada pendiente con una cuenta real confirmada.

SQL28 sigue autorizado, sin activar hasta coordinarlo con la web verificada.
El lote editorial23 ya está aplicado con26/49 y revisión anterior intacta.
Investigación pausada para inicio manual; no se inició otro ciclo.

## Acceso real de la preview y continuación nativa

La ejecución privada 40121753928 aprobó el acceso real de la preview con la
cuenta temporal confirmada: 99 peticiones, tres páginas, 87 recursos, 26
plataformas y 49 referencias, cookie protegida, tutorial con Bearer y cierre
local que invalida la cookie anterior. Su informe saneado conserva la huella
fb15292bb142a902260781be434c2a436ac289795664f153c75ab9e85304637c.
El ZIP privado completo tiene 11.486 bytes y huella
48027132a4e57cdb82d8ebdb8d7280bafb6631deb3e1b965d13a95a97819ca05.

El recorrido nativo se detuvo a los nueve segundos, antes de aprobar ningún
criterio, por un import de json ausente en el arnés. Se reprodujo con XML
real y ADB simulado y se corrigió ese import. El chequeo estático de los tres
módulos no encontró más globales sin definir. Se añade diagnóstico de archivo,
línea y función sin datos de sesión. La continuación conserva el PASS web y
los baselines del mismo APK; no vuelve a enviarse el correo ni a ejecutarse
la prueba de preview. La autorización de esa continuación se solicita aparte.

Víctor pidió después elevar el diseño de acceso al nivel de la app y mostrar
el radar. Solo cambian HTML/CSS: Geist local, verde de RWAdar, radar ilustrativo
con categorías genéricas y barrido que respeta reducción de movimiento,
escritorio en dos columnas y composición móvil. Se conservan los 19 IDs y
controles. Construcción local correcta; falta inspeccionar la nueva preview.

## Producción web y cierre del ciclo

La preview2b48b963 se inspeccionó en navegador a390×844 y1440×900: radar
ilustrativo visible, formulario legible y sin controles nuevos ni cambios de
AuthJS. Se conservan las capturas en la carpeta de entrega, fuera de Git.
El titular autorizó expresamente publicar esta web después del rechazo de la
revisión automática que distinguía la autorización Android de la web.

SQL28 se aplicó mediante migración catalogo_cuenta_confirmada_20261024.
Huella del SQL autorizado:
998320cd7808ee91a00c0b4537a928b371e9bad4d3bc678a5d77183fc3ae2950.
La comprobación posterior obtuvo24 relaciones protegidas,26 plataformas,
49 referencias,retirado=false ySELECT anónimo denegado en ambas vistasV2.
No modifica filas, fechas ni puntero del catálogo.

El publicador terminó con0 y devolvió https://414005a7.rwadar.pages.dev;
https://rwadar.pages.dev muestra la misma entrega. Once comprobaciones dirigidas
de producción aprobadas en VERIFICACION-ACCESO-PRODUCCION-2026-10-24.json:
HTML de acceso conradar, tres recursos públicos idénticos al artefacto aprobado,
redirecciónHTML al acceso y denegaciónAPI sin cuenta. La primera expectativa
de redirección se corrigió para enviar Accept:text/html; sin esa cabecera el
401 anterior ya denegaba correctamente el acceso. No fue un fallo del Worker.

El APK exacto se subió como borradorv1.4.0: RWAdar.apk ySHA256SUMS.txt.
GitHub confirma88.961.445bytes y el digestf384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624.
isDraft=true; no se alteró latest ni se publicó1.4.0.

La continuación40122469905 confirmó login, pero falló durante el cambio de
tamaño. Sus originales se conservan: ZIP173.250bytes,
SHA28211daed814fc0f7af1df414b7a2ddd6bcb2179a64db9617a61b7eab23914df.
Se corrigieron las reautenticaciones redundantes y la restauración del arnés;
antes de otro lanzamiento se detectó y reparó una conversión incorrecta deUTF8.
Todos los literales noASCII originales quedaron contrastados con el código
anterior y ambos módulos compilan. No se cambió la fuente de la app ni elAPK.

Víctor autorizó una última comprobación≤9min y pidió dejar elAPK sin publicar
si fallaba. Run40123408614 terminó en fallo en login_confirmed, con
«Login left the app window; no scroll or submit was attempted». El XML final
muestra com.android.launcher3 ycom.android.quicksearchbox, sin ventanaRWAdar.
No se determina la causa del cambio de ventana; no se atribuye a un defecto
confirmado de la app ni se aprueban los criterios sin observar. ZIP12.022bytes,
SHAbe939a2ace43e1e26198ceb3751fb1468f698bcc61bc04fff64e9adb97efeb97.
full20PointQA=false yreleaseApproved=false. Se detuvieron las pruebas: no se
publica, no se compila de nuevo y no se pide otra ejecución en este cierre.

La limpieza terminó con0: inhabilitación reversible de la cuentaQA propia,
cierre global de sus sesiones y eliminación verificada deRWADAR_QA_EMAIL y
RWADAR_QA_PASSWORD. Una consulta independiente confirmó la cuenta inhabilitada
y cero sesiones restantes. La cuenta del titular no se modificó. Todos los
ayudantes terminaron sus tareas, sin vigilancia abierta. InvestigaciónPAUSADA.

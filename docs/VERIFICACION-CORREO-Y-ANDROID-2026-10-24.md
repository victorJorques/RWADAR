# Correo y continuación Android · 24/10/2026

El alta del23/10 a21:27:20UTC fue `user_repeated_signup`: cuenta existente,
respuesta200 y ningún envío nuevo. SMTP Gmail ya estaba configurado; no hubo
error SMTP ni429. No se cambió Auth ni se desactivó la confirmación.

El24/10 se solicitó una sola recuperación al buzón que indicó el titular.
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

Tres casos nuevos dirigidos aprobados: cuatro recorridos de alta,18 combinaciones
acción/dominio y fragmento de recuperación→identidad→formulario de contraseña.
Sintaxis y diff-check aprobados; no se repitieron33/549 pruebas anteriores.
La contraseña la introduce el titular, sin compartirla por el chat.

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

40119180570 continúa únicamente fuente1,5/giro/excepciones. Queda su resultado y
la QA autenticada del mismo APK; no se declara20/20 ni release publicada.
SQL28 sigue autorizado, sin activar hasta coordinarlo con la web verificada.
El lote editorial23 ya está aplicado con26/49 y revisión anterior intacta.
Investigación pausada para inicio manual; no se inició otro ciclo.

# Acceso web · 29 de octubre de 2026

Víctor confirma que la primera corrección publicada sigue devolviéndole al acceso en Chrome/Safari. No se presenta esa corrección como solución completa.

- Reproducido con el JS real: una respuesta503 de `/sesion` borraba la identidad, recargaba y después mandaba al acceso aunque la cookie siguiera presente.
- El puente conserva la última identidad ante503/429/red, bloquea operaciones privadas hasta verificar de nuevo y permite reintentar.401/403, identidad distinta o respuesta inválida siguen retirando los datos privados.
- El formulario comprueba la sesión del navegador y el mismo usuario antes de regresar. Si falta, permanece visible con S401/S503/SRED/SID, sin incluir datos personales ni secretos.
-37 controles dirigidos aprobados:27 de puente/restauración,7 de formulario/altas y3 de cierre ordenado. Generación local26/49 correcta. Se conserva la verificación previa del servidor; esta no sustituye un navegador real.
- Las cabeceras públicas no contienen Clear-Site-Data y la cookie mantiene Secure/HttpOnly/Path=/, sin cambios de Auth ni SQL. Falta comprobar el recorrido positivo de Chrome con nuestra cuentaQA y la publicación de esta segunda corrección.

Android usa el mismo APK1.4.1/código23. Firma e instalación sobre22 ya observadas; faltan cartera/OTA/salida del recorrido. Los fallos de lector/espera/preparación del emulador se registran sin recompilar. Investigación pausada.

Chrome real con cookies gestionadas por el navegador reprodujo la causa: formulario200 y sesión200, después datos200 seguido de datos401, identidad y DOM eliminados. El BFF convertía un rechazo de recurso privado en401 aunque la identidad fuera válida. Se corrige la clasificación400/403/404/409 y el cliente conserva la cuenta ante rechazos de operación. La lectura de preferencias de correo se omite mientras avisos esté apagado.65 pruebas del área pasan. No se atribuye el fallo a cookies bloqueadas ni a una columna concreta no verificada. Nueva preview y recorrido Chrome completo pendientes.

SQL29: reproducido tanto en PGlite como en producción mediante SELECT sintético, sin leer cuentas: una valoración no nula producía22P02. Reparación aplicada con guarda de la definición anterior, únicamente CREATE OR REPLACE del validador, con una pareja de paréntesis.30 controles PGlite y8 independientes pasan; verificación remota posterior acepta valoración1.1 y rechaza claves extra y precio numérico. Propietario, ACL, IMMUTABLE/INVOKER y RLS forzada conservados; anon no puede ejecutar. No se modifican tablas, datos, políticas, Auth ni comunidad. [Operación aplicada](sql/2026-10-29-sql29-validador-reparar.sql), [reversión guardada](sql/2026-10-29-sql29-validador-revertir.sql). La precedencia está documentada por [PostgreSQL](https://www.postgresql.org/docs/17/sql-syntax-lexical.html#SQL-PRECEDENCE).

Android: en40786386594 se registró la compra. El precio fue rechazado por el falloSQL real; no se declara aprobado. El borrado sí mostró Inversión eliminada fuera del área visible y desapareció la ficha; se corrige el arnés para esperar y comprobar el estado después de recargar. Los controles de instalación/sesión del40783151032 se conservan por huella exacta en un bloque separado, manteniendo el resultado global failed. Mismo APK23, sin otro build; faltan valoración/cobro/OTA/ficha/salida y publicación.

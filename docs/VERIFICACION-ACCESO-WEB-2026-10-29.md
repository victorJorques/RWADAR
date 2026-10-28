# Acceso web · 29 de octubre de 2026

Víctor confirma que la primera corrección publicada sigue devolviéndole al acceso en Chrome/Safari. No se presenta esa corrección como solución completa.

- Reproducido con el JS real: una respuesta503 de `/sesion` borraba la identidad, recargaba y después mandaba al acceso aunque la cookie siguiera presente.
- El puente conserva la última identidad ante503/429/red, bloquea operaciones privadas hasta verificar de nuevo y permite reintentar.401/403, identidad distinta o respuesta inválida siguen retirando los datos privados.
- El formulario comprueba la sesión del navegador y el mismo usuario antes de regresar. Si falta, permanece visible con S401/S503/SRED/SID, sin incluir datos personales ni secretos.
-37 controles dirigidos aprobados:27 de puente/restauración,7 de formulario/altas y3 de cierre ordenado. Generación local26/49 correcta. Se conserva la verificación previa del servidor; esta no sustituye un navegador real.
- Las cabeceras públicas no contienen Clear-Site-Data y la cookie mantiene Secure/HttpOnly/Path=/, sin cambios de Auth ni SQL. Falta comprobar el recorrido positivo de Chrome con nuestra cuentaQA y la publicación de esta segunda corrección.

Android usa el mismo APK1.4.1/código23. Firma e instalación sobre22 ya observadas; faltan cartera/OTA/salida del recorrido. Los fallos de lector/espera/preparación del emulador se registran sin recompilar. Investigación pausada.

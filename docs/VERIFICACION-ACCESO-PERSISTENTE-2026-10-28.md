# Acceso persistente y desbloqueo · 28 de octubre de 2026

Por nueva petición de Víctor se prepara otro APK 1.4.0: el APK20 no puede incorporar persistencia ni autenticación del dispositivo sin recompilar. Se conservan sus evidencias por el alcance que siga siendo equivalente.

- Solo refresh token y UUID en SecureStore, clave fija y registro ASCII acotado; nunca contraseña ni biometría.
- Restauración con renovación y comprobación remota de identidad/perfil. Red/503 no borra la sesión; vigilancia no bloquea la entrada.
- Opción única en Perfil para la seguridad del teléfono; cancelación no abre el contenido y cerrar sesión retira el guardado.
- Cuentas: 52 criterios únicos dirigidos aprobados. Integración UI: ocho. Bloqueo y traducción probados; cuatro casos del PIN Android aprobados. Solo se acepta éxito del sistema reciente, con cuenta e intento vigentes y app en primer plano.
- Cuota comprobada: plan gratuito, siete builds Android disponibles; no se admite coste adicional.
- El ciclo QA anterior se recuperó y limpió: sesiones revocadas, cuenta temporal inhabilitada y sus dos secretos retirados el 28/10. La cuenta del titular no se toca.

Regresión completada por áreas sin repetir las partes aprobadas: base local, web549, fichas/RSS90, precarga31, QR, móvil340 con dos exclusiones históricas, herramientas y acceso53. Se actualizaron dos expectativas documentales antiguas; los fallos iniciales se conservan en sus registros. Exportación Android/Hermes real aprobada. Pendientes: una compilación editorial, validación nativa dirigida y publicación. Web pública vigente: https://rwadar.pages.dev. Investigación pausada, sin modificar ofertas ni fechas.

APK21 ab304084 (fuente e90bcd6) pasó identidad, 49 recursos, entrada y catálogo26/49 en40667743655, pero falló la integración: USUARIO_LOCAL también depende del legado de avisos y anulaba los siete gates nuevos. Se separa CUENTA_REMOTA_ACTIVA; la prueba con los flags reales reproduce rojo/verde y las26 pruebas de interfaz de cuentas pasan. El APK21 no se publica. Se necesita la compilación corregida, conservando las otras pruebas. La cuentaQA del intento ya está limpiada.

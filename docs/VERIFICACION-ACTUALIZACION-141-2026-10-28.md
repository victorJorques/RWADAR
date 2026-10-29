# Actualización 1.4.1 · 28 de octubre de 2026

Estado: Android1.4.1/código23 ya compilado; validación nativa dirigida en curso. Android1.4.0/código22 sigue siendo la descarga pública estable.

- Sesión: reproducida y corregida una carrera real del SDK: una respuesta401 antigua ya no borra un token recién renovado. Un rechazo vigente sigue cerrando el acceso. Cinco controles dirigidos con SDK real.
- Presentación: tres datos de decisión por tarjeta; avisos materiales íntegros, fechas y fuentes conservadas. Mis inversiones primero en Perfil, resumen por moneda, compras, precios, cobros, gastos y resultado sin anualizar.
- Cartera privada de cuenta: SQL29 autorizado expresamente y aplicado hoy. RLS forzada y sesión vigente; anon sin acceso, vista/RPC invoker, sin cambiar propietario ni sobrescribir versiones concurrentes. Comprobación sin sesión: cero filas. Queda prueba positiva con nuestra cuentaQA.
- Privacidad: sincronización Supabase descrita en web y app. Precios y movimientos son manuales; RWAdar no accede a compras ni cotizaciones de proveedores. Copia local anterior conservada e importación explícita.
- Actualizaciones: próxima1.4.1/código23, mismo paquete y firma esperada; Updates activo en runtime1.4.1(23), canalproduction. Mejora compatible descargada automáticamente para el siguiente arranque, sin recargar formularios. Falta comprobar reemplazo real sobre22 y metadatos del APK. No se afirma una OTA recibida.

Pruebas conservadas por área: DB completa incluida SQL29(24); web550; fichas/RSS90; precarga31; QR; herramientas; acceso96. Regresión móvil inicial358 aprobadas,20 fallos revisados: correcciones dirigidas77 aprobadas y carteraUI7. Updates6 y guardOTA8 controles. Exportación HermesAndroid aprobada. Dos pruebas móviles históricas continúan omitidas. Sin repetir las áreas ya aprobadas por fallos de expectativas antiguas.

Revisión independiente de SQL/API, aislamiento entre cuentas, cartera y avisos. Comprobado planFree EAS con cinco buildsAndroid disponibles y estimación0 antes de preparar compilación. Investigación pausada, catálogo49 y fechas sin cambios. Sin modificar main compartido.

Seguridad pendiente ajena a este corte: CAPTCHA coordinado web/nativo y ajustes del panel; no se declara completado ni se activa uno que impida entrar al APK existente. Comunidad permanece apagada.

Preview real fdade885: revisión directa escritorio1442×732 y móvil390×844, ficha Casa de Outeiro con título y X visibles y cierre correcto. Detectado recorte CSS a dos líneas del aviso de tarjeta; retirado antes de producción. Texto antiguo del modal corregido: cuenta opcional. Falta verificar la preview corregida. El navegador aislado local falló DNS; no se le atribuyen comprobaciones.

Web publicada en producción: https://rwadar.pages.dev (despliegue89a6801d),24controlesHTTPS aprobados. Previewcorregidaceba1ccf con HTML/CSS exactos; CSS final en navegador local390px muestra el aviso íntegro (clientHeight=scrollHeight=96px, overflowvisible, lineClampnone). La revisión directa previa de ficha móvil/escritorio sigue válida: no cambió el diálogo. Queda prueba autenticada del BFF de cartera con nuestra cuentaQA al abrir el ciclo del APK.

Continuación autorizada tras la pausa: se conserva el mismo APK23, SHA25633663d489ff759b66d2a06e53989a6e7bdddd2b0005c7cf25bf46c968c9c6f63, fuente móvil c1f7106. Una OTA compatible real ya está publicada para runtime1.4.1(23); falta acreditar recepción y arranque. El intento40782553650 falló antes del recorrido por el lector de recursos del arnés: corregido en7945f62 con regresión dirigida, sin recompilar. Continuación40783151032 en curso. La cuentaQA y los dos secretos se limpiarán al terminar.

Acceso web: corregido un defecto real al restaurar la cuenta. Un fallo503/red en perfil o vigilancia ya no provoca cierre real de una sesión válida; se vacían los datos parciales y se ofrece reintentar. Un clic durante la restauración espera su resultado; un rechazo vigente de Auth sigue retirando el acceso privado.18 controles dirigidos aprobados (6 nuevos y12 del área), revisión del módulo Cuenta y puente, generación local26/49 correcta. La prueba real del BFF de producción vuelve a pasar con nuestra cuentaQA: entrada, sesión, cartera vacía y salida local. Esto no reproduce por sí solo la cuenta del titular. El controlador Chrome no respondió a la inspección; no se atribuye una prueba visual nueva. Publicación de este arreglo todavía pendiente.

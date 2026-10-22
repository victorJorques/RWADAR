# Android 1.4.0 · comprobación del 22 de octubre de 2026

## Fuente y compilación

Fuente móvil `3af20333d042cbd9b8981fbe9613d909b7be3f99`, con los cambios
principales de `6735317e62d88a9abea99568fbabd641e86efb39`. Perfil editorial,
paquete `com.rwadar.app`, APK de distribución directa, código previsto 18.
La app incorpora el selector español/inglés, conserva los textos originales
de documentos y datos de usuario, corrige las fichas que se cortaban por arriba
y resuelve los toques cuando se solapan las cajas del radar.

La suite móvil completa pasa **233/233**, sin pruebas omitidas. Una primera
ejecución local quedó bloqueada al crear enlaces temporales dentro del sandbox;
la ejecución con permisos para ese ensayo pasó completa. El arnés Expo/Metro
Android pasa siete comprobaciones de integración. Las pruebas de callbacks
simulados y accesibilidad se separan de la ejecución real del APK.

El candidato de código 17, EAS `ccea6b27-51ab-4929-b438-1602330f048f`,
se canceló antes de publicar: el módulo de idioma recibió una corrección de
literalidad después de su commit, durante la preparación del archivo. No se
reutiliza ni se atribuye su archivo a una fuente exacta no demostrada.
Se consolidó la corrección y se confirmó su cancelación antes de iniciar el
código 18. La cuota consultada tras cancelar seguía en Android 5/15, total 6/30,
sin exceso, complementos ni coste estimado.

La compilación de código 18 es `47bdced4-0217-4b83-8642-24f20b476d74`, iniciada
a las 02:09:08 UTC. Una revisión independiente cotejó los 98 archivos admitidos
por `.easignore` (4.696.006 bytes) contra los blobs de su commit: cero diferencias,
faltantes, archivos inesperados o enlaces. Esto acredita la fuente local congelada;
no se presenta como una comprobación criptográfica del archivo remoto de EAS.
El build terminó a las 02:17:06 UTC. La descarga local requirió ocho rangos
HTTP 206, con offsets y total comprobados, por la lentitud de la transferencia
completa. La concatenación tiene 88.898.873 bytes y SHA-256
`350276ec8ed734801d86f5c739596e0e16bea4c6757a97b69b2737a67a7ce3d9`.
Una comprobación independiente en el runner público, ejecución `39711939041`,
obtuvo la misma identidad y firma. No ejecutó el recorrido nativo ni publicó.

El binario local supera apksigner v2 con un único firmante y el certificado
histórico `f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72`.
Aapt confirma paquete, 1.4.0/código 18, SDK 24/36 y los cuatro permisos previstos.
Backup y OTA siguen apagados, sin activación explícita de debug o cleartext.
El ZIP pasa CRC en sus 1.349 entradas y conserva 49/49 imágenes idénticas.

La QA del APK exacto se inició en la ejecución `39712140320`, intento 1,
commit público `c81322c336086798a140634e71fa3aea92c7c442`. Su resultado,
evidencia, revisión visual y publicación continúan pendientes hasta completarse.

## Comprobaciones exigidas al binario nuevo

Las plantillas de QA verifican instalación, versión, certificado histórico,
catálogo completo, las cuatro pestañas y las cinco fotos de referencia. Exigen
toques físicos en los 26 centros visibles del radar con eventos nativos,
lectura de título largo, fuentes y controles alcanzables en pantalla corta y
escala de texto 1,5. El giro solicitado se documenta sin atribuir soporte
horizontal a una app configurada en vertical.

El recorrido de idiomas debe cambiar ES a EN, reiniciar y conservar EN, abrir
la ficha inglesa con documentos originales identificados, cotejar cifras,
unidades, fechas y URL con ES, volver a ES y conservarlo tras otro reinicio.
Los costes de éxito y gestión de mF-ONE y mGLO deben aparecer juntos, con sus
citas separadas; un cero de éxito no sustituye el coste de gestión.

Los formularios se prueban sin credenciales ni envíos. No se atribuyen altas,
SMTP, recuperación, baja real, uso de TalkBack ni teléfono físico a este ensayo.
La revisión visual del mismo APK y la descarga pública se documentan aparte.

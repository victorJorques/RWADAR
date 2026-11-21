# Android 1.4.0 · continuación y defecto confirmado · 23/10/2026

## Alcance y autorización

Víctor pidió inicialmente terminar la validación y publicar el APK existente, sin repetir
las fases correctas ni compilar otra vez. Esta continuación no cambia código
del producto, catálogo, cuentas o servicios remotos. La lista completa de lo
hecho y pendiente figura en [la revisión del 23/10](archive/2026-10/REVISION-PENDIENTES-2026-10-23.md).

APK: versión 1.4.0, código 18, paquete `com.rwadar.app`, 88.898.873 bytes.
SHA-256: `350276ec8ed734801d86f5c739596e0e16bea4c6757a97b69b2737a67a7ce3d9`.
Fuente: `3af20333d042cbd9b8981fbe9613d909b7be3f99`.
EAS: `47bdced4-0217-4b83-8642-24f20b476d74`.
Certificado: `f506dea70ad644184161542d583455d2ad849c4dea3fffa0469c9ca400f58b72`.
La actualización posterior de `eas.json` en main fija una versión corregida de
Node para futuras compilaciones; no transforma el APK existente en otro build.

## Fases conservadas y continuación

La ejecución histórica `39812931682`, intento 1, trabajo `119943744862`, commit
`40f926f8ff4eeb3c99293b16a9c9a5dad9740c69`, **sigue siendo un fallo**.
Sus metadatos finales se volvieron a leer en GitHub: `completed/failure`.
Su ZIP tiene 26.986.584 bytes, 159 archivos y SHA-256
`497e69dae6ca957347e5f3887072e5c2374d9ad31063448d3b889732394a982a`.

El módulo `android-baseline-140.py` exige esos metadatos, tamaño, SHA, CRC,
inventario y evidencia XML/PNG/eventos nativos. Conserva los originales con
prefijo `baseline-`, sus huellas y la procedencia por criterio. No fabrica un
resultado exitoso de aquel fallo. Se conservan los criterios 03–14: radar,
tarjetas, grupos, lectura documental, imágenes y costes ya observados.

La nueva ejecución `40004871653`, trabajo `120590104460`, commit público
`f899ca420a1e4522a8dcfbfe30bea2ca7af04348`, ejecuta los criterios 01, 02 y
15–20: instalación del mismo APK, fuente 1,5/pantalla corta, orientación,
Academy, formularios sin credenciales, persistencia del favorito, idiomas y
excepciones. Se obtiene una lectura española completa como preparación del
cotejo ES/EN aún pendiente; mantiene la igualdad exacta de cifras, fechas y URL.

Las guardas de reconstrucción y publicación conservan los veinte criterios,
comprueban que cada origen coincide con la partición y verifican las huellas
de los 159 originales incluidos. El resultado de la continuación y la revisión
visual siguen siendo requisitos previos a publicar.

## Verificación de la preparación

- Revisión independiente del módulo, suite, workflow y guardas, sin repetir QA.
- Validación local del ZIP real: 159 archivos, 26 eventos, dos cabeceras,
  grupos de 12/21 referencias y dos muestras de costes.
- Rechazo de ZIP alterado, commit de metadatos falso y XML conservado modificado.
- Sintaxis de ambos módulos y parseo YAML/Python de los trece bloques incluidos.
- No se repitieron las baterías web, SQL ni móviles de la entrega anterior.

## Investigación bajo demanda

La automatización existente `rwadar-investigaci-n-y-publicaci-n-diaria` se
actualizó efectivamente el 23/10: nombre «RWAdar · investigación profunda bajo
demanda», estado `PAUSED`, comprobado en su configuración guardada después del
cambio. Cada orden manual inicia un solo ciclo; no reactiva el horario ni
concede por sí sola permiso para SQL remoto o publicación web.

## Resultado

La continuación `40004871653` falló por un defecto real del APK18: el aviso de
copia guardada y la fuente1,5 dejaban la lista con altura0. No es una aprobación
ni se corrige cambiando una tolerancia del ensayo. Su workflow se desactivó.

Víctor autorizó después una única compilación corregida gratuita. Con sus nuevas
peticiones de cuenta obligatoria, cartera local y tutorial en Academy, se inició
1.4.0/código19 en EAS, identificador `215e184c-2856-408f-9323-ed285f41b3ed`,
desde `1ecf7e7aa8941400d6ad954680cd6deb89107c42`. Terminó correctamente a20:33:31UTC.
El APK descargado tiene88.961.445bytes y SHA-256
`f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624`.
CRC del ZIP y49 imágenes exactas comprobados. La ejecución acotada
`40022139423` ya aprobó identidad, firma y permisos y comprueba el acceso anónimo
en emulador; no contiene trabajo de release ni sustituye la QA autenticada.
No hay release1.4.0 acreditada. La app pública sigue siendo1.3.2.
Ver [el cierre de implementación](CIERRE-LOCAL-1.4.0-Y-ACCESO-2026-10-23.md).

# Español e inglés en RWAdar

Implementación del 22 de octubre de 2026, coordinada desde la conversación
lateral con la tarea principal. Publicación y APK se comprueban en el informe
de entrega de la tarea principal; estos módulos por sí solos no acreditan una
publicación.

La interfaz ofrece una elección explícita entre Español y English y conserva
la preferencia `rwadar.idioma` en localStorage en web y AsyncStorage en móvil.
El valor inicial es español. El cambio actualiza la presentación y sus etiquetas
accesibles; no modifica el catálogo, las claves de búsqueda, los IDs, URLs,
cuentas, favoritos, filtros ni formularios del usuario.

## Fuentes y límites

- `rwadar-movil/lib/idioma-en.js`: traducciones completas revisadas de interfaz.
- `rwadar-movil/lib/idioma.js`: motor puro UMD compartido, selección y persistencia.
  Solo reconoce frases completas o plantillas de interfaz explícitas. No utiliza
  sustituciones generales de palabras ni servicios de traducción remotos.
- `rwadar-movil/lib/idioma-nativo.js`: adaptadores inyectables. Conservan refs,
  eventos, value/defaultValue, acciones y propiedades de entrada.
- `rwadar-movil/componentes/Idioma.js`: selector y `FuenteOriginal`.
- `rwadar-site/assets/idioma-web-20261022.js`: textos y atributos de presentación,
  guardando sus originales para volver a español. No usa innerHTML ni parámetros
  de URL para seleccionar el idioma.

Los nombres de personas, proveedores y productos y los valores recibidos del
catálogo se conservan. En React Native se marcan con `noTraducir` y su
`idiomaOriginal`; los bloques documentales usan `FuenteOriginal`. En web se usa
`translate="no"` para nombres/valores y `data-idioma-fuente="es"` para documentos
originales: mantienen `lang="es"` y muestran un aviso en inglés. No envolver todo
el diálogo: sus controles y etiquetas sí deben ser traducibles.

Una traducción nueva de documentación exige revisar la frase completa y sus
límites, no sustituir vocabulario dentro de una condición financiera. Si falta,
se conserva el original identificado. No se generan hreflang ni rutas SEO
inglesas ficticias: las rutas canónicas siguen correspondiendo a sus páginas
reales. Las fuentes externas conservan su propio idioma.

Las URLs y correos se comprueban byte a byte antes de aceptar una traducción.
La palabra de confirmación **BORRAR** se mantiene también en las instrucciones
inglesas: no se modifica el contrato de borrado de cuentas.

## Copias web y pruebas

Después de cambiar motor o diccionario:

```powershell
node rwadar-movil/scripts/copiar-idiomas-web.cjs
node rwadar-movil/scripts/copiar-idiomas-web.cjs --comprobar
node --test rwadar-movil/tests/idioma.test.cjs
```

El copiador mantiene byte idéntico el motor y diccionario de móvil y web.
La web carga con defer, en este orden, `idioma-en-20261022.js`,
`idioma-20261022.js` e `idioma-web-20261022.js`, además de su CSS. Los archivos
deben estar en la lista cerrada del publicador y el armazón del service worker.

Las 17 pruebas iniciales cubren español exacto, traducciones esenciales,
URLs/correos embebidos, ausencia de sustituciones parciales, caché recursiva,
fragmentos JSX, accesibilidad, reinicio y persistencia, lecturas antiguas,
cambios rápidos, fallos de almacenamiento, suscripción, refs/eventos/inputs,
documentación original y BORRAR. La revisión de interfaz y el APK exacto
requieren sus comprobaciones reales adicionales.

La revisión de integración debe comprobar también:

1. Español → English → Español sin perder búsqueda, filtros o guardados.
2. Reiniciar y recuperar English; almacenamiento bloqueado sin pantalla rota.
3. Textos nuevos tras abrir una ficha o cambiar de pestaña en English.
4. Controles y lector de pantalla con la misma lengua y nombres originales.
5. 320/390/768/1440 px y tamaño de letra del sistema aumentado.
6. Fuentes, figuras, nombres, URLs y campos del usuario idénticos al original.

Limitación identificada en el corte móvil congelado para 1.4.0: los encabezados
dinámicos «Ofertas guardadas · N» y «Plataformas guardadas · N» permanecen en
español. Son interfaz pendiente de completar, no documentos financieros.
No afecta a selección, persistencia, datos ni controles. Añadir plantillas
explícitas y regresión en la siguiente modificación del motor; no atribuir a
este APK una traducción exhaustiva de cada encabezado.

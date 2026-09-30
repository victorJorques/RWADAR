# Corrección de las fichas de activos · 30/09/2026

**Evidencia de la etapa V1 anterior.** Este documento conserva la corrección
inicial de documentación para el catálogo de 28 ofertas y sus comprobaciones.
La revisión, los recuentos y la preview descritos abajo corresponden a esa
etapa. El estado actual está en
[Catálogo V2](CATALOGO-V2-2026-09-30.md) y en
[Verificación y publicación Android](VERIFICACION-ANDROID-2026-09-30.md).

La caducidad de las cifras estaba ocultando también la descripción y las
características del activo. Se separan mediante `documentacion`, un objeto
validado con fuentes, fechas, características y referencias históricas.
No modifica la apertura de la oferta ni convierte observaciones en precios
ejecutables. La ficha pública permite abrir el detalle completo.

## Catálogo y servidor

Migración `ofertas_documentacion_publica` aplicada a RWAdar
`exgpmjpaaebyoolpwced` el 30/09. Se añade una columna nullable, conservando
vistas invoker, propietario, ACL, RLS y los controles de caducidad anteriores.
No cambia Auth ni permisos de escritura.

Revisión final de esta etapa V1 `1b910634-8d87-a657-33f7-63e22e28b6cc`, SHA256
`1b9106348d87a65733f763e22e28b6cc95b70eee4fc0e66ac4d5ffcd665f6372`.
Importación reproducible en
`rwadar-app/data/importaciones/catalogo-2026-09-30/documentacion-final.sql`.
El archivo `catalogo.sql` del mismo directorio fue una preparación previa
no aplicada; solo la revisión final indicada se importó y aprobó.

Se comprobó en SQL real que el borrador era invisible para anon, incluso en
la tabla privada protegida por RLS. Tras aprobarlo, anon obtiene 26 plataformas,
28 ofertas y 28 documentos, sin precios ni rentabilidades caducados. Los roles
públicos conservan cero permisos de mutación. REST y el sincronizador cargaron
el lote completo.

El radar mantiene 28/09 y las cifras anteriores 27/09. El lote vence al terminar
el 05/10 si no se revisa. Las únicas consultas documentales nuevas del 30/09
son Spiko y DAKS; todas las demás conservan sus fechas originales. Se recuperan
52 observaciones fechadas de las fuentes aportadas y revisadas. Procedencia
detallada en `rwadar-app/data/verificaciones/2026-09-30/README.md`.

## Verificación local

La prueba SQL PGlite aplica la migración y compara permisos y vista previa.
Prueba la frontera de caducidad, la conservación documental y la desaparición
de cifras, disponibilidad y puntuación vencidas; también el cierre del lote
a ocho días. Las 76 pruebas anteriores del catálogo pasan.

`npm test` completo aprobado el 30/09 tras corregir las integraciones con los
simuladores DOM: 329 pruebas web, 74 móviles y toda la cadena de base de datos,
QR y herramientas. Log privado `pruebas-20260930-integradas.log`.
El escaneo Gitleaks del árbol enumerado por Git terminó sin hallazgos.

Preview `https://c0e96231.rwadar.pages.dev`, caché
`rwadar-v-b5e379f4e13cdfbe`: HTTP54/54 recursos idénticos, CSP, 404 y
redirecciones correctos. Navegador real: 28 fichas, detalles BOSS y Spiko con
fechas y fuentes, filtro de fondos devuelve cinco, búsqueda Spiko devuelve una
de 26 plataformas. Sin errores de consola observados. Escritorio1280px y
móvil390/320px sin desbordamiento horizontal, incluido el diálogo.
Capturas privadas `preview-oferta-escritorio-20260930.png` y
`preview-oferta-movil-20260930.png`.

## Cierre posterior y estado actual

La etapa V1 fue sucedida por el catálogo V2. La web está pública con el
despliegue `78977d11`; su estado y los recuentos actuales se documentan en
[CATALOGO-V2-2026-09-30.md](CATALOGO-V2-2026-09-30.md). La preview V1 anterior
se conserva como evidencia histórica, no como la producción vigente.

Android **1.1.2 / código10** está publicado en la
[release v1.1.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.1.2).
El mismo APK superó el
[run final 36703760962](https://github.com/victorJorques/RWAdar-downloads/actions/runs/36703760962)
y su descarga pública anónima se verificó con SHA256
`0e06d6c4f8e32048fc761b8630467dd91b5a57940f577263571c7915fdd5b574`.
El alcance de la prueba en emulador y sus limitaciones están en
[VERIFICACION-ANDROID-2026-09-30.md](VERIFICACION-ANDROID-2026-09-30.md).
Las referencias anteriores a código9 compilándose, código8 como última
publicación y producción pendiente quedan superadas por esta evidencia.

## Observaciones de seguridad de la etapa V1

Los avisos de seguridad de Supabase siguen limitados a configuración anterior:
tablas internas cerradas sin políticas, pg_net en public y protección contra
contraseñas filtradas desactivada con altas cerradas. No se cambiaron para esta
corrección. Referencias del proveedor:
[extensiones en public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public),
[protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

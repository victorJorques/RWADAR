# Corrección de las fichas de activos · 30/09/2026

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

Revisión final `1b910634-8d87-a657-33f7-63e22e28b6cc`, SHA256
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

La revisión final de web, Android y publicación se incorpora al terminar sus
comprobaciones. Este registro por sí solo no acredita un despliegue.

Los avisos de seguridad de Supabase siguen limitados a configuración anterior:
tablas internas cerradas sin políticas, pg_net en public y protección contra
contraseñas filtradas desactivada con altas cerradas. No se cambiaron para esta
corrección. Referencias del proveedor:
[extensiones en public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public),
[protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

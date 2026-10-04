# Operación de la edición editorial

Responsable y soporte: titular de RWAdar, por el correo público de la aplicación.
Codex ejecuta la preparación, pruebas y despliegue autorizados de esta entrega;
no se presupone un servicio humano de vigilancia permanente tras cerrar el chat.

## Despliegue y verificación

1. `npm test`, revisión de cambios y escaneo de secretos del árbol final.
2. Commit del contenido revisado. Registrar su commit y huellas de contenido y
   alcance en el manifiesto; commit separado del manifiesto.
3. `node rwadar-publicar.js --preview`: mismo catálogo real, permisos, identidad,
   derechos y alcance editorial que producción. Solo permite la beta en curso si
   tiene evidencia previa. No omite los otros controles ni admite monetización.
4. Verificar preview con HTTP y navegador: cabeceras, rutas, catálogo, fuentes,
   filtros, búsqueda, visuales, ausencia de cuentas y funcionamiento PWA.
5. Documentar beta aprobada, actualizar únicamente manifiesto/evidencia y crear
   commit. `node rwadar-publicar.js --produccion` exige todos los controles.
6. Comprobar dominio canónico y recursos tras desplegar. La publicación no queda
   acreditada por un build local, una URL reservada o un comando iniciado.

### Publicar desde GitHub (sin ordenador)

El flujo **Publicar web** (`.github/workflows/publicar.yml`) hace los pasos 3
a 6 en una máquina de GitHub: se lanza a mano desde *Actions › Publicar web ›
Run workflow* eligiendo `preview` o `produccion`, solo desde `main`. Ejecuta el
mismo `rwadar-publicar.js` con todas sus compuertas y, al terminar, comprueba
la web real con `.github/comprobar-publicado.mjs` (portada, privacidad, mapa
del sitio, Academy, lecciones, assets, CSP y 404 de lo no publicado).

Necesita una vez el secreto de repositorio `CLOUDFLARE_API_TOKEN`
(*Settings › Secrets and variables › Actions*), creado en Cloudflare con la
plantilla «Edit Cloudflare Workers» o un token propio con permiso
*Account › Cloudflare Pages › Edit*. Sin él, el flujo se para avisando.

## Restauración y retirada

Cloudflare cuenta `52d07be006e7a27f5f793c59e1796b13`, proyecto `rwadar`.
Punto de retirada comprobado en listado de producción el 27/09/2026:
`237c1ed9-feaf-44ea-b408-bac23f904f27`, rama `main`.
En Pages → rwadar → Deployments, seleccionar ese despliegue y Rollback.
[Procedimiento oficial](https://developers.cloudflare.com/pages/configuration/rollbacks/).
El destino sigue disponible y la carpeta local `rwadar-limpieza` se conserva.
No se afirma que se haya ejecutado un rollback público de ensayo.

Si se detecta un secreto, contenido sensible, pérdida de integridad del catálogo
o fallo general de carga, retirar el despliegue antes de seguir difundiendo su URL.
La migración25 no borra datos; una reapertura de cuentas requiere restaurar solo
los permisos necesarios con otra migración revisada, nunca GRANT ALL.

## Catálogo y métricas

El catálogo vigente es V2: 26 plataformas y 49 referencias, distribuidas en
24 principales, 21 del secundario y 4 en preparación. Su fuente versionada es
`rwadar-app/data/verificaciones/2026-09-30-v2/`, con manifiesto explícito
`manifiesto-catalogo.json`. El radar conserva el corte del 28/09, la documentación
se actualizó el 30/09 y cada cifra mantiene su fecha propia. Secundario y
preparación no acreditan liquidez ni apertura. La vigencia máxima del lote es
el 05/10 inclusive; después se oculta si no se revisa. Una actualización debe
contrastar fuentes, importar un nuevo borrador, probarlo y aprobarlo. Nunca
cambiar una fecha para aparentar una revisión nueva.

La reconstrucción local del borrador del snapshot V2 del 30/09 utiliza las
funciones existentes de `rwadar-app/catalogo-publico.js`:
`cargarFuentesLocales(raiz, { revision: '2026-09-30', versionEsquema: 2 })`
y `construirSqlImportacion(fuentes)`. El SQL y su identidad reproducible están
en `rwadar-app/data/importaciones/catalogo-2026-09-30-v2/`. Ese snapshot ya fue
aplicado y aprobado; reconstruirlo no crea una revisión nueva ni justifica
repetir su importación o migración. No renueva fechas ni escribe en Supabase.
Una revisión futura exige fuentes nuevas contrastadas y un borrador distinto;
la importación y aprobación son pasos remotos independientes. Los clientes
nuevos leen V2 y no vuelven silenciosamente a V1 ni a un lote retirado.

V1 se mantiene para los APK anteriores, con 26 plataformas y 28 ofertas y sus
cifras/fechas históricas conservadas. La reparación del 30/09 está en
`rwadar-app/data/verificaciones/2026-09-30/`. El corte original de plataformas
del 28/09 y ofertas del 27/09 queda como contexto histórico; la orden
`node rwadar-app/preparar-catalogo-publico.mjs --revision 2026-09-28 --salida rwadar-app/data/importaciones/<nuevo-directorio>/catalogo.sql`
reproduce ese V1 histórico, no el V2 vigente: ese CLI no acepta un selector V2.
El resultado publicado y las pruebas están en `docs/CATALOGO-V2-2026-09-30.md`.

El panel de visitas y las limitaciones de medición están en `docs/ANALITICA.md`.
Las estadísticas de web no equivalen a usuarios únicos ni cubren el binario Android.

La comprobación del catálogo y su mantenimiento corresponden al trabajo operativo
de RWAdar. Una programación automática de revisiones requiere una tarea programada
real; este documento por sí solo no crea avisos ni ejecuta revisiones futuras.

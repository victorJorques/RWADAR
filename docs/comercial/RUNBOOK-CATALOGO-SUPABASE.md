# Catálogo verificado en Supabase · runbook de aplicación futura

**Estado:** preparado y probado solo en PGlite. No aplicado a Supabase, no
publicado y no añadido a ningún instalador remoto.

## Qué resuelve

`rwadar-app/db/24_catalogo_publico_verificado.sql` crea un esquema interno para
revisiones, fuentes, plataformas y ofertas, y expone únicamente dos vistas:

- `public.catalogo_plataformas_publicas`: exactamente 26 plataformas con
  estado operativo, licencia/registro, acceso, alertas y fuentes primarias;
- `public.catalogo_ofertas_publicas`: exactamente 28 ofertas clasificadas. Las
  no verificables, con fuentes en conflicto o cuya vigencia individual haya
  terminado devuelven precio, rentabilidad, disponibilidad en España y
  puntuación a `null`, con resumen/métricas neutrales. Se conservan fecha,
  fuentes y advertencias; no se modifica la evidencia original.

La vigencia individual puede ser más corta que la del lote. El último día
completo sigue siendo válido; al día siguiente SQL retira las cifras aunque
el lote aún tenga menos de siete días. La interfaz no es la única defensa.
La prueba local cubre esa frontera para `anon` y `authenticated`, sin red.

La identidad del lote y las fechas son campos distintos. Ambas vistas exponen
el mismo `revision_id`; sincronizador, lector web y caché embebida rechazan una
mezcla de revisiones aunque coincidan sus fechas. `revisiones.verificado_el`
ancla la revisión del radar y sus fuentes. Cada oferta conserva su propio
`verificada_el`, sin renovar las plataformas ni las otras ofertas. Una fecha
individual futura o posterior al máximo de vigencia del radar cierra el lote;
una fecha anterior conserva su trazabilidad y pierde las cifras al vencer su TTL.

Las vistas comparten una compuerta. Solo devuelven filas si existe una revisión
aprobada, no futura, con siete días o menos, 26/28 elementos y toda la
evidencia completa. Si falta una fila o fuente, ambas quedan vacías. Usan
`security_invoker`; las tablas están fuera de `public`, con RLS y sin políticas
de escritura para clientes. Es coherente con las guías actuales de Supabase:
[Securing your API](https://supabase.com/docs/guides/api/securing-your-api) y
[Views](https://supabase.com/docs/guides/database/views).

`rwadar_catalogo` debe permanecer fuera de los esquemas expuestos por la Data
API. Sus permisos de lectura permiten resolver las vistas con `security_invoker`;
no equivalen a autorizar publicar las tablas internas como endpoints REST.
Comprobar esa configuración en staging y producción forma parte del corte.

## Preparación local reproducible

```powershell
cd rwadar-app
npm run test:catalogo-publico
node preparar-catalogo-publico.mjs
```

Para reconstruir el fixture compartido a partir de la evidencia versionada,
desde la raíz del repositorio y sin volver a transformar imágenes:

```powershell
git status --short --branch
node rwadar-app/generar-escaparate-local.mjs --solo-datos
git status --short --branch
```

Este modo valida los hashes de las 52 imágenes ya existentes antes de escribir
datos. El adaptador enlaza la revisión anterior con cada fuente de la siguiente;
no convierte precios históricos en precios actuales ni inventa admisión desde
España. Es preparación local, no una nueva comprobación de las fuentes en red.

Para crear un SQL de importación revisable, siempre dentro del área local de
importaciones:

```powershell
node preparar-catalogo-publico.mjs --salida rwadar-app/data/importaciones/catalogo-2026-09-27/catalogo.sql
```

`--salida` se resuelve contra la raíz del repositorio aunque el comando se
ejecute desde `rwadar-app`. No sobrescribe un SQL existente.

El SQL generado importa el lote como **borrador**. Nunca lo aprueba ni contacta
Supabase. Omite las fotografías de terceros; las tarjetas usan únicamente las
ilustraciones editoriales propias sujetas a su manifiesto.

## Aplicación futura, no autorizada todavía

1. Cerrar el P0 de la credencial histórica y disponer de staging aislado.
2. Revisar migración, SQL generado, SHA-256 y fuentes de las 26/28 fichas.
3. Con autorización expresa, aplicar 24 y el borrador primero en staging. No
   añadir 24 a los instaladores antes de esa revisión.
4. Confirmar que ambas vistas dan cero filas mientras siga en borrador.
5. Tras el corte legal, fiscal, comercial y de derechos, registrar doble
   control y aprobar el lote mediante una operación separada y auditable.
6. Desde `anon` y `authenticated`, exigir 26 plataformas, 28 ofertas, un único
   `revision_id`, fuentes fechadas del radar y fechas individuales válidas. Las
   bloqueadas o vencidas deben devolver cero cifras/condiciones comerciales.
   Probar fechas de consulta distintas, una oferta con TTL menor que el lote y
   una fecha futura. Al retirar una evidencia, ambas vistas deben dar cero.
   Confirmar que el esquema interno no está expuesto por REST.
7. Ejecutar `sincronizar.js` contra staging: solo puede consultar las dos vistas
   nuevas. Una respuesta vacía, parcial o de más de siete días debe fallar antes
   de escribir JS o CSV.
8. Producción se decide después. Aplicar SQL, retirar `MODO_PRIVADO` y desplegar
   son acciones distintas con comprobaciones y autorizaciones propias.

## Retirada

Cambiar una revisión a `retirada` vacía las vistas sin borrar la trazabilidad.
Ante cualquier duda, no aprobar otro lote y conservar la página de limpieza.
Una revisión caducada nunca se usa como fallback.

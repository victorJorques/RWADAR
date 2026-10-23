# Acceso obligatorio: entrega local del 23/10/2026

Estado: cambios locales revisables. No se ha aplicado el SQL remoto, publicado
la web, creado ninguna cuenta real ni compilado/subido un APK en esta tarea.
El APK previamente compilado no incorpora estos cambios nuevos de acceso.

## Qué cambia

- Web: `rwadar-acceso/servidor.mjs` valida el usuario mediante GoTrue y comprueba
  el perfil propio protegido por la política existente de sesión confirmada.
  El catálogo, sus páginas, imágenes, JSON, sitemap y RSS requieren esa sesión
  también en el servidor. Cada respuesta privada utiliza `private, no-store`
  y `noindex, nofollow`.
- Inicio de sesión con cookie `__Host-rwadar-acceso`, `HttpOnly`, `Secure`,
  `SameSite=Lax`, limitada al host y sin token de renovación. Los tokens no se
  devuelven al JS de la aplicación ni se guardan en el almacenamiento web.
  Confirmación y recuperación procesan el fragmento en la página de acceso,
  lo borran del historial antes de consultar y exigen identificar la cuenta
  antes de adoptar el enlace. Un registro nunca inicia sesión automáticamente.
- `acceso-privado.js` conecta el catálogo y la cuenta existente con la pasarela
  del servidor. La pasarela conserva las rutas y permisos de las operaciones
  existentes; no crea RPC, tablas de usuarios ni privilegios nuevos.
  Se comprueban Origin, método, JSON, longitud, rutas y parámetros permitidos.
  La reautenticación para borrar una cuenta debe corresponder al mismo usuario.
- Un fallo de red al comprobar la sesión elimina el contenido visible. Un
  cierre sin respuesta deja un marcador de cierre pendiente, obliga a terminar
  el cierre en el servidor antes de otro login y no se anuncia como confirmado.
  Un cambio de cuenta en otra pestaña elimina la interfaz anterior.
- App: `AccesoObligatorio` reutiliza el controlador y el formulario de cuenta.
  La puerta precede a Inicio, Buscar, Academy y Perfil. El lector del catálogo
  utiliza el mismo cliente SDK autenticado después de comprobar identidad y
  perfil protegido. Las respuestas antiguas no deben reemplazar ni vaciar el
  estado de otra cuenta.
- Favoritos, seguimiento local, progreso Academy y caché V2 se separan por UUID
  en la app. Favoritos y Academy también se separan por UUID en la web. No se
  importan los datos personales de las claves anónimas anteriores.
- Borrar los datos del dispositivo elimina las carteras y cachés de todas las
  cuentas de RWAdar con claves exactas, sin tocar otras aplicaciones. Perfil se
  vuelve a montar para eliminar la cartera conservada en memoria. La confirmación
  y la privacidad de la app mencionan las inversiones registradas.

## SQL preparado, sin aplicar

`rwadar-app/db/28_catalogo_cuenta_obligatoria.sql` cubre 24 relaciones conocidas:
15 tablas de catálogo/publicación/legado y 9 vistas V1/V2/legado. Retira SELECT
de anon y PUBLIC, incluidos los permisos por columna, conserva los permisos
previos de authenticated y comprueba que no desaparecen. No amplía privilegios
de authenticated. Añade una política SELECT restrictiva que utiliza
`rwadar_cuentas_privadas.sesion_confirmada()` y fija las vistas como invoker.
No actualiza datos, fechas, revisiones, punteros ni la orden de retirada.

Guarda los permisos SELECT anteriores de PUBLIC, anon y authenticated y las
opciones de vista/RLS en un esquema privado. La reversión restaura los permisos
efectivos y sus grant options, las opciones de vista y el estado RLS previo.
No pretende conservar la atribución histórica del grantor. Reaplicar después
de una reversión requiere una nueva revisión explícita. Un inventario incompleto,
un OID/tipo cambiado, un propietario cliente o permisos anónimos heredados abortan.

`28_catalogo_cuenta_obligatoria_REVERTIR.sql` es la reversión preparada. Ambas
operaciones requieren autorización específica antes de ejecutarse en remoto.
El inventario real remoto no se consultó en esta tarea. Cualquier divergencia
respecto al esquema versionado debe revisarse antes de aplicar.

## Pruebas ejecutadas

Se reutilizaron las dependencias ya instaladas. No se ejecutó npm ci, EAS, un
smoke mutante ni un envío de correo. Las pruebas siguientes son locales.

| Área | Evidencia |
| --- | --- |
| BFF | 15 casos aprobados en `rwadar-acceso/servidor.test.mjs`: anonimato, recursos privados, sesión revocada, correo sin confirmar, perfil ajeno, cookie, Origin, registro, callback, configuración, retorno, catálogo y rutas de cuenta. |
| Navegador aislado | 4 casos aprobados en `navegador.test.mjs`: favoritos UUID, red caída, cierre pendiente y cambio de cuenta entre pestañas. |
| SQL/ACL aislado | 2 casos aprobados: las 24 relaciones, permisos de columna/PUBLIC, confirmado/no confirmado, conservación de filas, doble aplicación, doble reversión y aborto atómico por inventario incompleto. |
| SQL sobre esquema real del repositorio | 1 caso adicional aprobado, ejecutado por separado: migraciones literales y lote real del 22/10 con 26 plataformas/49 ofertas; lectura anónima denegada tras 28, lectura confirmada idéntica con joins y fechas intactos, sin confirmar cero filas, sesión revocada cero filas aun con JWT no vencido, 15 tablas conservadas y reversión a la lectura anónima 26/49 y ACL anteriores. |
| Nuevos controles nativos | 6 casos aprobados entre `cuentas.test.cjs` y `datos-acceso.test.cjs`: cliente autenticado, perfil protegido, carrera A/B, favoritos/seguimiento/progreso UUID, limpieza de carteras y cierre al no poder corroborar el perfil. |
| Flujo nativo existente afectado | 17 casos comprobados: 16 aprobaron en la ejecución completa tras actualizar las precondiciones de cuenta y el mock getAllKeys; el caso restante se corrigió para reconocer la caché UUID y aprobó en repetición enfocada. No se volvió a ejecutar lo ya aprobado. |
| Sintaxis | Parse JSX de App/puerta/datos y `node --check` de scripts web/servidor aprobados; `git diff --check` sin incidencias en los archivos comprobados. |

La prueba SQL con esquema real reutiliza `pruebas-soporte.mjs`. Únicamente la
infraestructura GoTrue, el origen de `auth.uid()` y la firma/transporte del JWT
se simulan en Postgres embebido. Las migraciones, el helper de sesión, RLS, ACL,
vistas, joins y el lote de 49 ofertas son los SQL reales del repositorio.
No equivale a probar Supabase remoto ni la entrega de correo.

Antes de estas adiciones también se había comprobado la batería existente de
cuentas con el SDK instalado y transporte simulado. Sus 50 resultados aprobados
incluían los primeros tests de servidor/puerta. No se vuelven a contar como una
batería final distinta ni como evidencia de una cuenta real.

## Huellas del corte revisable

| Archivo | SHA-256 |
| --- | --- |
| `rwadar-acceso/servidor.mjs` | `f02fe6ee51ef518952ea4dbe34ea57f2809ede52aee3caaad1988d47fdeceae2` |
| `rwadar-app/db/28_catalogo_cuenta_obligatoria.sql` | `998320cd7808ee91a00c0b4537a928b371e9bad4d3bc678a5d77183fc3ae2950` |
| `rwadar-app/db/28_catalogo_cuenta_obligatoria_REVERTIR.sql` | `85ae53e6793dcbeb2865b1058aa0b385bed1008ae622a3e1c68bd60335b13c83` |

## Integración y límites pendientes

1. El coordinador integra el servidor en `_worker.js` avanzado y `_routes.json`
   sin exclusiones del catálogo, con la URL y clave publicable existentes.
   No se utiliza una clave service_role. El adaptador `functions/_middleware.js`
   queda como alternativa para Pages Functions con esos bindings; no se mezcla
   con el worker avanzado.
2. El coordinador inyecta `acceso-privado.js` antes del script de cada página
   protegida, incluidas Academy, ofertas y novedades generadas. El índice ya lo
   incluye. Debe comprobarse el paquete generado, sus rutas y assets.
3. El coordinador corrige el service worker para retirar las copias públicas
   antiguas y dejar de cachear contenido autenticado. `/sw.js` es público para
   permitir que las instalaciones existentes reciban ese cambio.
4. El publicador/sincronizador editorial debe poder leer el catálogo tras cerrar
   anon con una sesión editorial efímera confirmada. No se omite la sincronización
   para disimular una denegación ni se utiliza service_role.
5. Al exigir cuenta también a las fichas, sitemap y RSS se pierde el acceso e
   indexación públicos de ese contenido. Es consecuencia de la nueva orden de
   cuenta obligatoria, no una mejora SEO.
6. Web: la cookie dura la sesión del navegador y contiene solo el JWT de acceso.
   Al vencer es necesario volver a entrar; no hay renovación mediante refresh
   token. Sin conexión no puede borrarse una cookie HttpOnly desde JavaScript:
   el cierre queda pendiente hasta que responde el servidor. El marcador de la
   pestaña evita presentar ese cierre como completado, pero no constituye una
   revocación remota ni borra el historial de lo que el usuario ya vio.
7. App: el SDK conserva la sesión solo en memoria. Un reinicio exige login real;
   arrancar sin conexión no da acceso al catálogo. En una sesión abierta se
   revalida al volver a primer plano y cada minuto; un fallo al corroborar el
   perfil cierra el acceso. No se promete persistencia entre reinicios ni acceso
   offline autenticado. No se guardan contraseñas.
8. Falta QA con una cuenta controlada y un buzón real: registrar, recibir el
   correo, confirmar, entrar, recuperar y elegir una contraseña nueva. Debe
   hacerse manualmente sin contraseñas en workflows, informes, capturas ni logs.
   No se ha creado esa cuenta ni inventado el resultado. El escenario nativo
   usa login real en el dispositivo y también comprueba el reinicio y el arranque
   offline; no utiliza un bypass ni tokens simulados para aprobar el APK.
9. El APK anterior queda como evidencia histórica de su propio código. Estos
   cambios necesitan un binario que los contenga y su validación antes de poder
   afirmar que se han publicado en Android. No se ha pedido ni ejecutado un build
   desde esta tarea auxiliar.

Sin commit propio en este corte: el coordinador integra los archivos en la rama
compartida y registra el traspaso principal. No se han modificado lib/cartera.js,
lib/cartera-local.js, el publicador, sincronizar.js ni el service worker desde esta
tarea auxiliar.

## Adición acotada: tutorial 3D de Academy en WebView

La app no comparte su sesión SDK con las cookies del WebView. Se añadió
`GET /api/acceso/tutorial`, que exige Authorization Bearer válido, usuario
confirmado y perfil propio protegido. Una cookie previa sin cabecera no basta,
no se permiten parámetros y no se habilita CORS.

El endpoint responde un HTML mínimo sin scripts, tokens ni datos y crea la
cookie HttpOnly. No hace un redirect HTTP: algunos WebView conservan Authorization
al seguir redirects del mismo origen. Al terminar esa carga, el componente
nativo cambia explícitamente su source a `/#explain` SIN cabeceras. La navegación
queda limitada al endpoint y la raíz del mismo origen. El WebView es privado y
no usa caché HTTP. El token nunca se coloca en URL, JS web, logs ni respuesta.

`cuentas.accesoTutorial()` corrobora primero la sesión y el perfil con el cliente
actual y devuelve solo la fuente/cabecera de ese endpoint fijo. El tutorial se
monta al abrirse, se desmonta al cerrarse o salir de la cuenta y vuelve a Academy.
No se implementa un login alternativo, un bypass ni almacenamiento de refresh
token. El tutorial nativo sigue siendo la alternativa si el 3D no carga.

Tres pruebas nuevas enfocadas aprobaron: el puente rechaza cookie sola y token
en URL, rechaza sesión revocada y el controlador nativo entrega el acceso al
único endpoint después de corroborar la cuenta. JSX y diff comprobados. Falta
la prueba real en WebView con la cuenta controlada; no se ha compilado otro APK.

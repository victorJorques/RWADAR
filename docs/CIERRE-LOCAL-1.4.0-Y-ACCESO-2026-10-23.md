# Cierre de implementación del 23/10/2026

Este documento distingue código, pruebas locales, compilación y publicación.
La web y la app públicas anteriores no se han sustituido por este corte.

## Android

El APK 1.4.0/código18 existente no es publicable. La continuación selectiva
`40004871653` encontró un defecto real: con fuente1,5 y el aviso de copia guardada,
el área desplazable de Buscar medía cero píxeles de alto. No se rebajó la guarda
ni se atribuyó el fallo a una incidencia de red. Su workflow quedó desactivado.
La ejecución previa fallida y sus159 originales se conservan como evidencia.

Víctor autorizó una única compilación corregida dentro de la cuota gratuita.
Antes de iniciarla se incorporaron también sus nuevas peticiones:

- Aviso desplazable dentro de la lista, cuatro datos de decisión antes del texto
  extenso y explicación de orden desplegable.
- Apertura/cierre de fichas compartidos, protección contra dobles pulsaciones y
  movimiento reducido.
- «Mis inversiones»: compras, cantidad, precio, comisiones, ventas, cobros y
  valoración manual fechada. Cálculo decimal con enteros, sin sumar monedas ni
  convertir APY anunciado en resultado real. Falta de valoración no significa
  pérdida del100%. Almacenamiento local separado por cuenta, sin sincronización.
- Cuenta confirmada antes de todas las pestañas, cliente autenticado y datos
  locales separados por UUID; limpieza y protección frente a respuestas tardías.
- Tutorial dentro de Academy, cuatro pasos manuales, anterior/siguiente, progreso,
  alternativa nativa legible y vuelta a Academy. El puente WebView valida la
  sesión e instala una cookie antes de abrir el tutorial sin cabecera de token.

Fuente Android consolidada en `1ecf7e7aa8941400d6ad954680cd6deb89107c42`.
Se inspeccionaron104 archivos/4.748.816bytes idénticos a ese commit: únicamente
el móvil y `.easignore`, sin web, SQL, documentos, secretos ni dependencias.
Node22.23.4 portable verificado; no se cambió la instalación global del PC.
EAS informó planFree, Android6/15 antes de iniciar, sin extras ni cargos previstos.

Compilación iniciada una sola vez: `215e184c-2856-408f-9323-ed285f41b3ed`,
versión1.4.0/código19, perfil editorial, conservando las credenciales existentes.
El estado observado después fue `IN_PROGRESS`. No significa APK terminado,
validación nativa aprobada ni release pública. Android pública comprobada:1.3.2.

## Web y acceso

La fuente incorpora entrada, registro, reenvío de confirmación y recuperación.
El Worker avanzado cubre todas las rutas, también páginas generadas, snapshots,
imágenes, CSV, sitemap y RSS. Los recursos de acceso y legales quedan públicos.
Verifica correo y sesión actual contra GoTrue y el perfil protegido, usa cookie
HttpOnly/Secure/SameSite y respuestas privadas sin caché. Los POST verifican
origen, método y cuerpo; callback y recuperación no reflejan datos arbitrarios.

La revisión independiente encontró y se corrigieron cierre sin confirmación,
pantalla antigua tras caída de red, respuestas tardías entre cuentas y claves
personales compartidas. El antiguo trabajador PWA se sustituye por un limpiador
de sus cachés, sin interceptar solicitudes ni conservar páginas autenticadas.
Las cabeceras de seguridad también se aplican en el Worker; se preserva una CSP
de endpoint más restrictiva.

El tutorial sigue siendo Academy en web y Android, sin una pestaña adicional.
Se destaca antes del índice y se presenta mediante Activo→Participaciones→
Titulares→Transmisión. Al terminar permite volver a Academy o seguir la primera
lección. No promete una duración, un derecho de propiedad ni liquidez universales.

La sincronización editorial admite una sesión efímera confirmada en memoria.
Antes de activar el SQL28 puede leer la publicación todavía pública; después,
la denegación del servidor detiene la sincronización si no hay sesión. Nunca
sustituye ese fallo por una copia local en un despliegue. Producción exige
además comprobar que ambas vistas V2 deniegan la lectura anónima.

El acceso obligatorio cambia el objetivo SEO anterior: las fichas, el sitemap
y el RSS dejan de ser públicos/indexables sin sesión. La orden actual de Víctor
prevalece; no se retira ni vacía el catálogo para implantarlo.

## Evidencia local y límites

- La pasada nativa general inicial aprobó223 casos y encontró11 fallos: contratos
  anteriores de interfaz, fixtures sin las nuevas dependencias y dos limitaciones
  de permisos del aislamiento. Se corrigieron y repitieron solo esos casos; los
  dos módulos que no habían arrancado aprobaron22 y18 casos. Uno detectó una
  discrepancia real de imagen al cambiar una categoría, corregida en la web.
- Sintaxis JSX de seis módulos principales aprobada. Dos pruebas nuevas impiden
  que el HTML de intercambio de cookie active por error el fallback del tutorial.
- La web llegó al final con549 comprobaciones correctas y cero fallidas en un
  recolector temporal que conserva los casos reales y acumula errores, sin saltos.
  No se presenta un comando `npm test` interrumpido como una ejecución íntegra exitosa.
- Navegador real local: entrada, registro y recuperación a390px y escritorio1440px,
  sin desbordamiento ni excepciones. Esto no prueba envío o recepción de correo.
- Servidor, navegador aislado, Worker compilado, lector editorial, restricciones
  de producción y SQL tienen pruebas específicas. SQL28 se ensayó también con las
  migraciones reales y el lote26/49: denegación anónima, sesión sin confirmar o
  revocada, conservación, idempotencia y reversión.

Quedan la comprobación remota autorizada, una cuenta y buzón controlados para
alta/confirmación/recuperación reales, y la QA del APK nuevo, incluido el WebView.
La fuente nueva no permite reutilizar como aprobación integral la QA del APK18.

## Investigación manual del 23/10

La tarea programada está PAUSADA. El ciclo de hoy se inició por la petición
expresa de Víctor y no autoriza futuros inicios por horario.

Se reunieron expedientes y fuentes primarias con alcances y conflictos. No se
ha completado una aprobación documental profunda de las49 referencias. El lote
revisado admite cuatro referencias en tres fichas: mínimo documentado de Casa
de Outeiro, costes/salida contractual de Prosegur y cierre observado de IOD.
Conserva49 referencias,26 plataformas, cuatro descartes, las imágenes y todas
las fechas/vigencias económicas anteriores. Cero altas nuevas. No se arrastran
aprobaciones ni se inventan mínimosEUR o acceso individual desde España.

El SQL editorial y el SQL28 de acceso son operaciones distintas, preparadas y
probadas. No se han aplicado en remoto. Una consulta de solo lectura fue rechazada
por revisión automática porque AGENTS.md exige permiso expreso para SQL remoto;
se solicitó autorización concreta para estos cambios y comprobaciones.

Los dos vídeos originales siguen sin URL recuperable; Víctor indicó que no los
tiene a mano. No se afirma haberlos revisado. El vídeo local de nueve perfiles
simulados es otra evidencia y no acredita satisfacción humana del90%.

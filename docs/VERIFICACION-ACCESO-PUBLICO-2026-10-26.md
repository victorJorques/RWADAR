# Acceso público, login y APK reutilizado · 26/10/2026

## Cambio solicitado y autorización

Víctor solicita consulta web sin registro y cuenta para las funciones personales,
además de terminar la validación y publicar el APK1.4.0 existente. La investigación
permanece pausada. RWAdar no tramita inversiones ni recibe dinero.

Autorización expresa posterior: comprobación SQL, reversión deSQL28 y publicación
primero en preview y después en producción si pasa la comprobación. La primera
lectura SQL fue rechazada automáticamente por falta de esa autorización; no se
ejecutó ni se intentó por otro medio antes del permiso.

## Permisos del catálogo restaurados

Migración aplicada: catalogo_lectura_publica_20261026, con el contenido revisado de
rwadar-app/db/28_catalogo_cuenta_obligatoria_REVERTIR.sql. SHA-256 del archivo:
85ae53e6793dcbeb2865b1058aa0b385bed1008ae622a3e1c68bd60335b13c83.
Antes:24objetos respaldados y aplicados,26plataformas,49ofertas,retirado=false,
SELECT anónimo denegado en ambas vistasV2. Después:26/49,retirado=false,
SELECT anónimo permitido y cero filas con aplicado=true en la copiaACL.
Perfiles y vigilancia conservan RLS activado. No cambian filas, fechas, revisiones
editoriales ni tablas/políticas de cuentas.

La restauración permite otra vez la sincronización anónima del lector1.3.2.
Esto es compatibilidad de permisos comprobada; no se volvió a ejecutar ese APK.
La sincronización real del publicador devolvió26plataformas,4descartes y49ofertas
y no cambió archivos de datos. No se hizo investigación nueva.

## Correcciones y pruebas nuevas

- Worker y bridge permiten lectura pública, SEO, RSS, Academy e imágenes.
  Sesión, datos personales, reautenticación y tutorialBearer siguen protegidos.
- Guardar como invitado pide cuenta y no finge guardar.
- Login comparte una sola promesa de cierre pendiente entre carga/formulario/
  callback: evita que un segundo logout borre la sesión recién creada.
  Es un defecto de código reproducido; aún no se atribuye al caso del titular.
- Privacidad y acceso describen lectura web pública y funciones por cuenta;
  incluyen Seguir sin cuenta. El APK19 conserva su acceso por cuenta.
-34pruebas dirigidas de Worker/bridge/compuerta más3casos nuevos del login pasan.
  Se reutiliza la evidencia anterior; no se repiten99/11 ni las baterías completas.
- Generación local correcta:26fichas,4descartes,49emisiones; modo sin despliegue.

## Android

Se reutiliza el APK19 exacto,88961445bytes,SHA-256
f384a20017e09a4bc0650a0be82231b29acf6abd9629e1075442d458bd277624,
fuente1ecf7e7aa8941400d6ad954680cd6deb89107c42. No cambia código de rwadar-movil.
El arnés espera el campo enfocado y limita Atrás a una ventanaIME actual con
foco enRWAdar. Foco desconocido transitorio solo espera; otro paquete real falla.
La vuelta al radar exige cierre del diálogo antes de reutilizar su árbol.
Se eliminan26instantáneas redundantes, no26pulsaciones.
Catorce simulaciones dirigidas y sintaxis Python aprobadas; no son QA del APK.
Nueva continuación preparada:12minutos runner,9minutos script, sin compilar
ni repetir firma/imágenes/formularios/web anteriores.

Estado previo a despliegue y continuación: aún no se aprueba la nueva preview,
producción ni la release1.4.0 en este informe. Se completará con resultados reales.

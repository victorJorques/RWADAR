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

## Preview observada y límites

Preview26/10: https://99d594e3.rwadar.pages.dev, aliasrevision.rwadar.pages.dev.
Dieciséis controles HTTP aprobados: páginas públicas, catálogo anónimo26/49,
sitemap/RSS, JS/CSS de acceso idénticos al artefacto, API personal denegada,
perfiles/vigilancia sin datos anónimos y/android a latest. Se conserva el registro
de14controles previos y se completan solo los2faltantes tras corregir el comprobador:
vigilancia no tiene columnaid; elHTTP400 no era exposición de datos.
El noindex del dominio de preview es intencional; solo producción exige indexación.

La misma cuentaQA confirmada realizó loginBFF real, verificación de cookie, sesión,
logout local y rechazo posterior de esa cookie. Sin alta ni correo. Los tres
casos nuevos del frontend verifican además la carrera de cierres pendientes.
No se atribuye la causa al titular ni se afirma que haya guardado su contraseña.

El controlador del navegador no respondió. Computer Use se detuvo por no poder
identificar de forma fiable laURL actual; no se hizo más interacción de navegador.
No hay nueva captura visual del26/10. Se conserva la revisión visual del acceso
24/10 a390/1440 para el CSS que no cambia, con límite explícito para el texto nuevo.
Se aprueba la entrega web acotada por fuente revisada y comprobación realHTTP/Auth;
esto no aprueba Android19 ni una revisión visual nueva.

Android40299768822 terminófallo: el campo estaba enfocado, proceso vivo y teclado
visible, pero la lectura de foco devolviónull. SuZIPprivado SHA-256
78cec889582bfc59ecf68a99691556a8def0a0c971b889724c93595b0f683e7c
queda conservado sin atribuir aprobación ni publicar evidencia privada.


## Producción pública comprobada el 26/10

Publicación autorizada realizada en https://rwadar.pages.dev, despliegue
https://f0ec3606.rwadar.pages.dev, desde la fuente aprobada en f2915dc.
Dieciséis comprobaciones HTTP de producción aprobadas, sin repetir las de preview:
consulta anónima, Academy, ficha, sitemap/RSS, identidad de JS/CSS de acceso,
catálogo26/49, protecciones de datos personales y redirección Android a latest.
La cuenta temporal QA realizó también login, sesión, cookie protegida y logout
real en producción; la cookie anterior quedó denegada. No se repitió el correo.

Registros conservados en VERIFICACION-ACCESO-PUBLICO-PRODUCCION-2026-10-26.json
y VERIFICACION-LECTURA-PUBLICA-SQL-2026-10-26.json. No hubo nueva investigación
ni nuevas fechas editoriales. La limitación visual anterior sigue vigente.

Segunda continuación Android40301318223 falló en36segundos de recorrido al
capturar el campo nativo de contraseña. Proceso de RWAdar vivo y foco en su
ventana; no acredita fallo del producto ni aprobación nativa. ZIP privado
SHA-256707abe68d61afafe4b5ec2626fc8ba2f10319d5546aa1f615d0cd87c8c0efbe5.
Las dos ejecuciones suman151+161=312segundos de runner. Una continuación final
de hasta6minutos conservará el total máximo en672segundos, dentro de los720
autorizados. No se cambia el APK ni se repiten fases aprobadas.


## Conexión del capturador: fallo conservado y corrección local

Run40351124379, job121671136909, fuente1c2743b:130segundos de runner;
Java del helper compiló y el recorrido se detuvo en1segundo antes de credenciales.
Error: Fresh snapshot nonce mismatch. Sin checks nativos aprobados ni datos
personales capturados. ZIP privadoSHA-256:
19e4219736af2e7be6f211163fde3b3588a2ca1f220d46c2228a7d09439c31e1.

Se corrigió el EOF inicial de adb forward: si el dispositivo aún no ha enlazado
el socket, la respuesta vacía es transitoria. Una respuesta no vacía con nonce
distinto sigue denegada. Prueba de transporte local real: primer socket cierra
sin respuesta, el segundo devuelve la raíz fresca; aprobado en0,14segundos.
No demuestra Android. No hay modificación del APK ni reducción de criterios.

Tiempo consumido26/10:151+161+130=442segundos (7min22s) de runner. Quedan278
de los720autorizados. Otra ejecución de6min eleva el máximo a802segundos
(13min22s) y requiere ampliar el límite antes de lanzarla. No se ejecutará
un recorrido recortado a105segundos que no permite verificar lo pendiente.

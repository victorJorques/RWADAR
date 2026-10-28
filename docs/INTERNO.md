# RWAdar · cómo está el proyecto

*Actualizado el 28 de octubre de 2026.* Si solo vas a leer un documento, que sea
este. El detalle técnico con todas las pruebas del 30 de septiembre está en
[`archive/2026-09/INTERNO-detalle-2026-09-30.md`](archive/2026-09/INTERNO-detalle-2026-09-30.md).

---

## Qué es RWAdar

Un **radar de plataformas de tokenización** de activos reales: inmuebles,
fondos del Tesoro, materias primas, crédito… Dice cuáles existen, cuáles están
supervisadas y cuáles se han descartado, **siempre con la fuente al lado**.

RWAdar informa: no vende, no invierte el dinero de nadie y no cobra a quien
consulta. Entrar en el radar es gratis para las plataformas.

---

## Qué está funcionando hoy

El mapa de activos ya está publicado dentro de Buscar, con Lista/Mapa, 26 fichas ubicadas y permiso opcional de ubicación. Conserva las 49 referencias del catálogo y señala las ubicaciones aproximadas. La preview y producción pasan las comprobaciones HTTPS; dos lecturas independientes corroboran los archivos publicados. La revisión visual no quedó acreditada porque el controlador no pudo verificar la URL de Chrome.

**Web actualizada el 28 de octubre; consulta pública y acceso corregido:** el catálogo, las fichas y Academy se pueden
consultar sin registro. La cuenta confirmada se pide para guardar y usar funciones
personales. Se corrigió una carrera del inicio de sesión que podía cerrar la
sesión recién abierta. Pasaron 37 pruebas locales dirigidas, 16 comprobaciones
HTTP en preview y otras 16 en producción; entrada, sesión y salida reales con
la cuenta de QA también funcionaron en ambos entornos. La nueva inspección visual
no pudo completarse: Computer Use se detuvo al no poder verificar la URL.

Con permiso de Víctor se restauró la lectura pública de Supabase: siguen las
26 plataformas y 49 referencias y las protecciones de perfiles y vigilancia.
Esto restaura el contrato de lectura de Android 1.3.2; no se ha vuelto a probar
en dispositivo. Investigación PAUSADA, sin modificar fechas del catálogo.

**Android 1.4.0 ya está publicado** en la página de descargas. Conserva la sesión de forma segura entre arranques y permite activar el desbloqueo del teléfono desde Perfil. Se comprobaron el PIN del sistema, la cancelación sin mostrar contenido, el tutorial real de cuatro pasos, los cálculos de cartera y el cierre que impide recuperar la cuenta. Huella y cara dependen del hardware compatible; la prueba de dispositivo usó PIN Android. La cartera es un registro manual y no actualiza precios de intermediarios. La cuenta temporal y sus secretos quedaron limpiados.
[Detalle de validación](VERIFICACION-ACCESO-PERSISTENTE-2026-10-28.md).

**Web y cartera renovadas:** la web pública ya muestra tarjetas más claras, avisos completos y Mis inversiones en la cuenta. La cartera privada de Supabase está aplicada con permiso de Víctor; sus movimientos y precios son manuales. Las comprobaciones públicas de producción pasan. Android1.4.1 ya está compilado: corrige la renovación de sesión y prepara las mejoras automáticas compatibles. Se está comprobando el mismo APK, sin recompilar. Se instalará sobre la versión actual, sin desinstalarla. Faltan las pruebas del binario y su publicación; la descarga estable continúa en1.4.0. [Detalle](VERIFICACION-ACTUALIZACION-141-2026-10-28.md).

**Seguridad web comprobada hoy:** cabeceras, cookies y controles de acceso/sesión están aplicados. La comunidad permanece apagada. Turnstile, el control adicional de abuso y algunos ajustes de los paneles aún no están acreditados; no se presentan como terminados. [Detalle breve](SEGURIDAD-WEB-REVISION-2026-10-28.md).

| | Estado |
|---|---|
| **Web** | Publicada en **https://rwadar.pages.dev**, actualizada el **28/10** desde la rama aislada, con mapa de activos en Buscar. Consulta pública; cuenta para funciones personales. Login, sesión y salida comprobados con la cuenta de QA. Se conservan el radar del acceso, registro, recuperación, comparación e idiomas. |
| **Catálogo** | **La revisión del 22 de octubre ya está aplicada en Supabase**, vigente hasta el **29 de octubre**: 26 plataformas, 4 descartadas y 49 referencias (24 principales, 21 reventa, 4 documentales en preparación). IOD figura cerrado; cifras nuevas solo cuando se observaron en su fuente. Los campos de acceso desde España permanecen sin confirmar cuando falta evidencia específica. Ver [`VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md`](VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md). |
| **Imágenes de las ofertas** | Las 49 fichas **ya muestran en la web y Android 1.3.2** su ilustración generada del activo, con el lugar y tres pasos explicativos. Llevan etiqueta «Ilustración editorial» y texto alternativo que identifica la IA y que no es una fotografía real del activo. La correspondencia con las 49 ofertas y los recursos del APK se comprobó por contenido. Ver [`comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`](comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md). |
| **App Android** | **[Versión 1.4.0](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.0)** publicada. Descarga pública, firma y contenido comprobados. Sesión persistente y desbloqueo opcional desde Perfil; catálogo completo, Academy y cartera manual validados. No está en Google Play. |
| **App iPhone** | Compilada para el simulador. Aún no hay cuenta de Apple Developer. |
| **Google y RSS** | Fichas, sitemap y RSS vuelven a estar disponibles sin sesión. Sus respuestas públicas se comprobaron el 26/10; esto no acredita que Google ya haya vuelto a indexarlas. |
| **Analítica** | Cloudflare Web Analytics, sin cookies. |
| **Legal** | Aviso legal, condiciones, privacidad y transparencia comercial publicados. |
| **RWAdar Academy** | **Publicada** en la web (`/academy/`) desde el 5/10. 9 lecciones de Eric en 3 niveles: 1 a 7 publicadas, 8 y 9 «Próximamente». Revisión legal verificada por Víctor el 2/10/2026. En la app, pestaña Academy. Ver [`academy/REVISION-CONTENIDO-2026-10-02.md`](academy/REVISION-CONTENIDO-2026-10-02.md). |
| **Tipografía** | Geist completa para español. La web publicada reutiliza los archivos locales: títulos de tarjeta de 20 px, datos de decisión de 16 px y secundarios de 14 px. El candidato Android también aumenta el tamaño de lectura y navegación; su comprobación se acredita por separado. |

**Cuentas:** consultar la web no requiere cuenta. Las funciones personales sí
requieren una cuenta confirmada. Se comprobaron entrada, sesión y cierre en
preview y producción. El alta y la recepción de recuperación reales ya se
acreditaron el 24/10; no se atribuye al titular un guardado de contraseña que
no se observó. La limpieza de la cuenta temporal se documenta por cada ciclo de QA.

**La fuente web publicada el 26/10 está en la rama aislada y aún no está integrada
en main.** La carpeta principal conserva cambios de otras herramientas y no se
ha sobrescrito su trabajo. Hay que integrar la entrega antes de volver a publicar
desde allí. Las pruebas y las huellas quedan en los informes con fecha. El vídeo
de nueve perfiles simulados está entregado en local y reproducido completo; no
es una prueba con personas ni una evaluación de todos los cambios posteriores.

**Investigación del catálogo:** tarea preparada y **PAUSADA, con inicio manual**.
Víctor debe pulsar **Ejecutar** o pedir **«haz la investigación»** para abrir un
solo ciclo; la programación anterior no inicia trabajo ni autoriza futuras
ejecuciones. Investiga las ofertas publicadas y busca nuevas con documentos
primarios, contraste y revisión independiente. Cada candidata se publica con
tarjeta e ilustración editorial si pasa las compuertas y existe permiso expreso
para SQL y publicación de ese ciclo, o no se admite ese día. No existe cola
pública «en investigación» ni autorización recurrente autónoma. Se conserva el
catálogo completo publicado. Procedimiento:
[`tareas/CICLO-DIARIO-CATALOGO.md`](tareas/CICLO-DIARIO-CATALOGO.md).

**Cambios del 11/10:** panel nativo de cuentas y refuerzos de la web
para evitar mezclar sesiones; registro, acceso, nombre, vigilancia, recuperación
y baja con contraseña recién comprobada. Los favoritos locales no se convierten
en vigilancia remota. La sesión nativa queda solo en memoria. La app no activa
instalaciones históricas ni push. El refuerzo de sesión **ya se aplicó en
Supabase con permiso expreso de Víctor**. La lectura posterior comprobó las
políticas restrictivas de acceso, la sesión confirmada y vigente, la exclusión
de usuarios anónimos y que el esquema privado no queda expuesto por REST.

**Publicación y app:** la web es pública; las funciones personales conservan
las guardas de cuentas. El APK nativo 1.3.2 también las lleva activadas, pasó la prueba de
ejecución en emulador y **ya está publicado en GitHub**, con resultado real
de QA y publicación exitoso. Los servicios antiguos de
instalaciones y push permanecen apagados. Víctor autorizó EAS Android y GitHub **sin cargos**;
la compilación se hizo dentro de la cuota gratuita. La compatibilidad y los
avisos actuales de dependencias se describen a continuación.

**Dependencias pendientes:** la auditoría de paquetes **no está limpia**.
La consulta del 22/10 da 21 avisos móviles (17 altos y 4 moderados) y uno alto
en la herramienta de imágenes de la raíz. Expo Doctor pasa 20 de 21 controles:
recomienda seis parches posteriores del mismo SDK. La instalación coincide
exactamente con el lock aprobado y es compatible con el mapa del SDK fijado.
La revisión de las vías usadas no identificó un bloqueo concreto para esta
entrega, pero no garantiza ausencia de vulnerabilidades ni sustituye la prueba
del APK. Se mantienen visibles los avisos, sin downgrades forzados ni exclusiones
para silenciar Doctor. Informe actual:
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

**Pruebas locales del 22/10:** `npm test` completo terminó correctamente después
de instalar las dependencias móviles desde el lock: web 502 comprobaciones,
móvil 184 y base de datos, QR y herramientas correctos. Las 49 fichas tienen
foto y la Academy está al día. La web en línea se comprobó por separado y la
revisión independiente no encontró bloqueos visuales concretos. Estas pruebas
no demuestran por sí solas el cambio real de contraseña ni un APK instalado.

**Prueba real del APK del 22/10:** se instaló y ejecutó el mismo APK 1.3.2, sin modificarlo,
en un emulador Android 15. Pasaron Inicio, búsqueda de las 26 plataformas y 49
referencias, ficha de Spiko, las siete lecciones publicadas de Academy, apertura
de una lección y favorito conservado tras reiniciar. También se comprobaron los
formularios de cuentas y su validación vacía, además de las imágenes y lugares
de cinco ofertas, sin introducir contraseñas, crear
cuentas ni enviar correos. **No es un flujo completo de Auth nativo ni una
prueba en un teléfono físico.**

**Revisión visual y acabado:** las capturas propias de la 1.3.2 muestran las
fotos, lugares y pasos legibles, con el rótulo editorial y sin solapes observados.
Se conserva el arreglo del Perfil introducido en 1.3.1: la separación medida
entre recuperación y nota de favoritos sigue siendo de 92 píxeles, por encima
del mínimo de 40. Alta, confirmación y Perfil también se revisaron; el favorito
siguió guardado después de reiniciar. La primera prueba de uso pasó pero su
empaquetado de capturas superó el límite inicial; se amplió ese límite y se
repitió correctamente el mismo APK, conservando toda la evidencia. No hubo
una segunda compilación ni cargos añadidos.

Codex es responsable de integrar, configurar y comprobar técnicamente los
cambios, y de publicar dentro de las autorizaciones expresas. Víctor únicamente
introduce sus credenciales, verifica su identidad y autoriza las operaciones
reservadas; no se le asignan cambios de código. Plan vigente:
[`tareas/CUENTAS-WEB-MOVIL-2026-10-11.md`](tareas/CUENTAS-WEB-MOVIL-2026-10-11.md).
La evidencia local y el diagnóstico real están en
[`VERIFICACION-CUENTAS-2026-10-11.md`](VERIFICACION-CUENTAS-2026-10-11.md).
La web nueva y el APK 1.3.2 ya están publicados. La publicación Android está
confirmada por el flujo exitoso, la API pública y la descarga anónima local:
APK y evidencia coinciden con sus sumas y la firma del APK es válida. El detalle
actual está en [`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](VERIFICACION-ANDROID-1.3.2-2026-10-22.md)
y [`VERIFICACION-PUBLICACION-2026-10-22.md`](VERIFICACION-PUBLICACION-2026-10-22.md).

**En pausa:** opiniones, comunidad, avisos de cambios por correo y avisos push. Seguridad anterior:
[`seguridad/REVISION-SEGURIDAD-2026-10-05.md`](seguridad/REVISION-SEGURIDAD-2026-10-05.md).
Manual de bienvenida de Eric recibido, pendiente de corregir su sección 8:
[`manual/LEEME.md`](manual/LEEME.md).

**Nueva barra del móvil (5/10): Inicio · Buscar · Academy · Perfil**, en la
web y en la app. Inicio trae las noticias de RWAdar (se editan en
[`../rwadar-noticias/`](../rwadar-noticias/LEEME.md)) y anuncia la comunidad;
Perfil reúne las empresas y ofertas guardadas (solo en el navegador o en el
móvil) y los avisos como «próximamente». Publicada en la web el 5/10 y en la
app con la versión 1.2.0.

**Desactivado:** publicidad, comisiones y cobros. Hay una cuenta de AdMob con
dos fichas de prueba, pero nada conectado a la app.

---

## Lo que falta, por orden

La prioridad actual es resolver la compatibilidad de la descarga Android pública,
cerrar la validación de la app nueva e integrar la web ya publicada en main.
La lista completa de brechas y el alcance de cada prueba están en la
[revisión integral del 24/10](REVISION-INTEGRAL-2026-10-24.md).
Los puntos de mantenimiento siguientes no equivalen a ese cierre de entrega.

1. **Actualizar Node.js en el PC.** El 21/10 Node corrigió fallos graves
   (código remoto por Brotli, nombres de certificados TLS y los certificados
   comprometidos de eMudhra). GitHub y las compilaciones de EAS ya usan la
   versión corregida (22.23.4). En el PC, `node rwadar-node-seguro.js` dice si la que
    hay vale. Para esta entrega se usa un runtime portable corregido; no se ha
    actualizado la instalación global del PC. La investigación permanece manual.
2. **Renovar el catálogo antes de que venza su revisión el 29 de octubre.** La
    revisión general es del 22/10, con correcciones documentales parciales del 23.
    La próxima investigación solo empieza por orden manual de Víctor; se prepara
   con `npm run catalogo`; aplicarla a Supabase y publicar requieren autorización
   expresa para esas operaciones. Ver [`RUNBOOK.md`](RUNBOOK.md#catálogo).
   Si vence, el catálogo completo sigue visible con aviso y sin cifras vencidas.
3. **Actualizar Postgres.** Las copias de seguridad ya están activas: la
   primera, del 2 de octubre, copió 52 tablas y se comprobó
   que se descifra. Antes de actualizar, descarga una copia y ábrela una vez
   como explica [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
4. **Completar los flujos reales de cuentas.** La web y Android 1.3.2 ya están
   publicados y sus descargas verificadas. Completar el cambio de contraseña de
   recuperación y la entrada posterior, mejorar la entrega del correo que
   llega a spam y comprobar los flujos sobre la versión publicada. El refuerzo
   de sesión ya está aplicado y verificado, y el acabado del Perfil ya pasó
   sus pruebas sobre el APK publicado. Quedan distintos el uso de Auth nativo
   con credenciales reales
   y la comprobación en un teléfono físico; no presentarlos como hechos.
   Codex hace los pasos técnicos; el plan y las autorizaciones concretas
   están en [`tareas/CUENTAS-WEB-MOVIL-2026-10-11.md`](tareas/CUENTAS-WEB-MOVIL-2026-10-11.md).
5. **Tiendas.** Apple y Google tienen cada uno una consulta de soporte
   pendiente sobre el alta como persona física. Hasta que respondan, no se paga
   ni se rellena nada. El paquete para Google Play (AAB 1.1.2, icono, cabecera y
   capturas) ya está preparado.
6. **Dominio propio** (unos 12 € al año). Da seriedad y permite un correo
   propio.
7. **iPhone:** el fallo de memoria de una librería de Expo ya está corregido.
   Falta probar la app en un simulador o un iPhone de verdad antes de enviarla.
8. **Ingresos:** decidir con un abogado cómo se puede cobrar a las
   plataformas. El veredicto editorial no se vende nunca.
9. **Dependencias de compilación:** corregir los avisos con versiones compatibles
   verificadas y revaluarlos antes de otra compilación o de activar actualizaciones
   remotas. No presentar el análisis de alcance como una auditoría limpia.

---

## Fechas que conviene tener a mano

| Cuándo | Qué |
|---|---|
| **29 de octubre de 2026** | Vence la revisión general del 22/10; las correcciones parciales no la rejuvenecen. Se conserva completa con aviso y sin cifras vencidas. |
| Cada noche, 02:43 UTC | Copia de seguridad cifrada, guardada 35 días en GitHub |
| Cada noche, 03:17 UTC | Limpieza de dispositivos inactivos de más de 180 días |
| Agosto de 2027 | Caduca `/.well-known/security.txt`: renovar la fecha |

---

## Quién hace qué

| | |
|---|---|
| **Víctor** (titular) | Decide; cuentas de tiendas, pagos, contratos y todo lo que exija identidad. Solo él autoriza publicar o tocar la base en línea. |
| **Eric Almiñana y Samuel Rodriguez** | Corresponsables junto a Víctor (ver [`../SECURITY.md`](../SECURITY.md)). |
| **Codex (ChatGPT)** | Responsable de la integración técnica, configuración, pruebas y publicación autorizada de web y app; también del trabajo técnico de catálogo y tiendas. |
| **Claude** | Seguridad, copias de seguridad, revisiones y documentación. |

Cada herramienta firma sus commits con su propio nombre (ver
[`../AGENTS.md`](../AGENTS.md)). Lo que hace una queda anotado para la otra en
[`tareas/PARA-CODEX.md`](tareas/PARA-CODEX.md).

---

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `rwadar-site/` | La web: lo que se edita |
| `rwadar-academy/` | Las lecciones de la Academy en Markdown; `node rwadar-academy.js` genera la web y la app |
| `rwadar-publicado/` | La web lista para subir. Se genera sola: no se edita |
| `rwadar-app/` | Base de datos: migraciones, importadores y pruebas |
| `rwadar-movil/` | App de Android e iPhone (Expo) |
| `rwadar-qr/` | Código QR de la tarjeta |
| `rwadar-limpieza/` | Página que desinstala la PWA antigua de Netlify: se conserva |
| `rwadar-panel/` | Panel de control: encender/apagar web y catálogo, salud, visitas, descargas y cuentas. En el ordenador (`npm run panel`) o compartido con los socios en <https://rwadar-panel.victorjorquesgranero.workers.dev> (subido el 22/10 con permiso de Víctor; se entra con enlace personal). Ver su `LEEME.md` |
| `rwadar-version-codex/` | Copia rescatada de la versión de agosto: no se edita |
| `docs/` | Esta documentación |

**Documentos para el día a día:**

- [`RUNBOOK.md`](RUNBOOK.md): cómo trabajar en local y qué comandos son
  peligrosos.
- [`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md): cómo se publica.
- [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md): copias y actualización
  de Postgres.
- [`ANALITICA.md`](ANALITICA.md): cómo leer las visitas.
- [`ENTREGA-TIENDAS-Y-ANUNCIOS.md`](ENTREGA-TIENDAS-Y-ANUNCIOS.md): tiendas y
  anuncios.
- [`seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`](seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md):
  qué aguanta la web y qué se puede mejorar.

Los informes con fecha (`VERIFICACION-…`, `CATALOGO-V2-…`, `SEO-…`,
`PREPARACION-PLAY-…`, `CORRECCION-OFERTAS-…`) son **pruebas técnicas** de lo
que se comprobó cada día. La compuerta de publicación las cita, por eso siguen
ahí. No hace falta leerlas para trabajar. Índice en [`LEEME.md`](LEEME.md).

---

## Reglas que no se negocian

1. **Ninguna plataforma descartada sin una fuente citable.** Es el mayor
   riesgo legal del proyecto.
2. **Los datos se cambian en Supabase**, nunca a mano en el HTML o el JS.
3. **Una cifra que no se puede comprobar no se publica.** Un hueco es
   correcto; una cifra inventada, no.
4. **Lo patrocinado se marca y no cambia el orden.**
5. **Publicar, tocar la base en línea o compilar la app** solo con permiso
   expreso de Víctor.
6. **Secretos fuera de Git:** contraseñas, tokens y claves de servicio nunca
   entran en el repositorio.
7. **El catálogo está siempre disponible para el público**, salvo que Víctor
   diga lo contrario. Si la revisión caduca o no se puede comprobar, se muestra
   la última copia completa con un aviso y sin cifras vencidas. Solo se oculta
   con la orden expresa (ver «Retirar el catálogo» en [`RUNBOOK.md`](RUNBOOK.md)).

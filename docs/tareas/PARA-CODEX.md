# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 29 de octubre de 2026 · Claude · web y Android 1.4.1 publicadas

Web en producción (despliegue `a83ea0bd`, 208/208 controles) y Android
1.4.1/código 23 publicado como Latest en RWAdar-downloads, desde
`rwadar-entrega-integral-20261022/integracion-140`, rama
`codex/claridad-cartera-sesion-141-20261028` (commits `d8c185e`, `138e701`).
`npm test` completo en verde. Víctor confirma que ya entra en la web con su
cuenta. Detalle y pendientes (secretos QA, unir esa rama a `main`) en el
PARA-CODEX de ese checkout. No relanzar QA ni compilar 1.4.1 otra vez.

**30/10:** PR #15 unida: `main` de GitHub (`21265f4`) ya contiene todo lo
publicado. **Esta carpeta sigue en el `main` antiguo** con tu trabajo sin
commitear: guárdalo en una rama propia antes de traerte `main`. Secretos
`RWADAR_QA_*` retirados de GitHub (créalos solo para cada ejecución QA).

**Más tarde, 29/10:** botón «Actualizar» enviado por OTA a la 1.4.1
(`01a189a8…`, commits `b32ef29` y `ae36f05`) y web `1778479b`. Cada versión
Android nueva debe subir `version-android.json` a su release (ver
`rwadar-movil/LEEME.md` de ese checkout).

---

## 28 de octubre de 2026 · Codex · nueva pieza «Ahora sabes dónde mirar»

Víctor rechazó «Hay más» y aportó una referencia de motion design. Nueva
propuesta de 28 s/25 fps en `rwadar-descubre-2026-10-28/output/`, con copia
ligera y reproductor. Rodaje real nuevo con app auténtica integrada en la
pantalla mediante tracking/perspectiva, escenario 3D, búsqueda, oferta limpia
Casa de Outeiro/Alius Capital y web actual. Música distinta: Gimme that Groove!,
Michael Ramir C.; no reutiliza temas/stems anteriores y no contiene locución.
[Informe](../VERIFICACION-ANUNCIO-DESCUBRE-2026-10-28.md).

Exportaciones descodificadas completas, 700 fotogramas/28 s, BT.709 y audio
verificados; setecientos hashes de píxeles main/picture iguales. Reproducción
silenciada del SHA definitivo completa, sin saltos. Correcciones visuales de
paneles, búsqueda y etiqueta editorial. No se presume aceptación creativa.
Capturas nuevas de Expo Web a 860 × 1790; adquisición 9–12 fps reales,
conformada a 25 respetando tiempos, sin interpolación inventada. No es APK.
Servidor temporal cerrado, producto sin cambios. Música para publicidad
online, no emisión de TV/radio. Sin commit, push, publicación, SQL, catálogo
nuevo, cuentas, build/OTA o créditos de generación. WIP compartido conservado.

---

## 28 de octubre de 2026 · Codex · anuncio rehecho con personas reales

Nueva propuesta local de 26 s en
`rwadar-spot-reboot-2026-10-27/output/rwadar-hay-mas-1080p.mp4`, con copia
ligera y reproductor. Sustituye el corte de treinta segundos que Víctor
rechazó. Rodaje humano licenciado de la misma actriz con móvil y portátil,
radar auténtico, selección real de Spiko en Expo Web, modelo educativo WebGL
real y una oferta de Spiko en alta resolución. Se retiró toda locución
generada. La web aparece como contexto de portátil, mención y URL, sin captura
de su interfaz. [Informe](../VERIFICACION-REBOOT-RWADAR-2026-10-28.md).

Dos exportaciones: descodificación completa, 624 fotogramas/24 fps/26 s,
BT.709 completo y AAC final dentro del objetivo. Reproducción del SHA final
completa, silenciada, sin errores ni pérdidas. Revisión visual muestreada
independiente y corrección de recortes, fuentes y párrafos ampliados.
Investigación documental de referentes con fuentes primarias; no se afirma
haber visionado sus spots. Calidad creativa pendiente de valorar por Víctor.

Sin commit ni push, créditos adicionales, publicación, SQL, catálogo nuevo,
cuentas, cambios de producto o build/OTA. Se conserva el WIP compartido.
Las capturas Expo Web no acreditan un APK. La música permite publicidad
online, pero no emisión de televisión/radio.

---

## 27 de octubre de 2026 · Codex · anuncio centrado en app y web, con navegación

Víctor pidió rehacer el anuncio: aspecto de spot televisivo, app/web como
protagonistas, mensaje aspiracional y voz de España. Rechazó Elvira por
robótica e Ines por acento latino; ambas quedan fuera del corte vigente.
La nueva revisión de **30 s** está en
`rwadar-comercial-valencia-v2-2026-10-27/output/rwadar-mas-cerca-app-y-web-1080p.mp4`,
con copia ligera y reproductor. [Informe](../VERIFICACION-ANUNCIO-APP-WEB-2026-10-27.md).

UI durante 20,708 s, incluidos 14 s seleccionados de navegación real del
código React Native en **Expo Web**: buscar Casa, abrir Outeiro, recorrer la
ficha, cerrarla y volver al radar. Catálogo público real, cuatro GET 200;
sin mocks, cuentas, favoritos, mutaciones ni cambios de fuente/dependencias.
No se presenta como captura del APK. El servidor temporal quedó cerrado.
La web se capturó el 27/10; las imágenes nativas de apoyo son del 22/10.
Avisos y rótulos editoriales preservados. Cierre acordado:
«La inversión en activos tokenizados no está exenta de riesgos».

Dos copias descodificadas completas; 720 fotogramas, 24 fps, Full HD. AAC final
idéntico al máster director comprobado: −14,22 LUFS y −1,17 dBTP. Reproducción
completa de 30 s en Chrome aislado en silencio, sin pérdida de fotogramas ni
errores; revisión visual independiente muestreada sin bloqueantes. La nueva
voz se dirigió como narradora de Madrid y el guion se transcribió completo;
estas mediciones no certifican acento ni interpretación por escucha humana.

Esta revisión consumió 53,25 créditos: total acumulado 615,95 de los 650
autorizados, sin compras ni cambios de plan. Sin commit, push, publicación,
SQL, catálogo nuevo, cuentas, build/OTA ni cambios del producto. Se conserva
el WIP compartido. Falta la valoración creativa de Víctor de la revisión
entregada; no se afirma que haya aceptado la voz ni el resultado.

---

## 26 de octubre de 2026 · Codex · anuncio cinematográfico Valencia terminado

Víctor rechazó la primera animación y después sustituyó el concepto por un
spot con mujer, coche de lujo, Valencia nocturna, edificio aspiracional y
cierre en casa con pijama y perro. **La entrega principal ahora es el anuncio
de 34 s** en `rwadar-comercial-valencia-2026-10-26/output/`, con copia para
compartir y portada. [Verificación](../VERIFICACION-ANUNCIO-VALENCIA-2026-10-26.md).

Cinco planos fotorrealistas y voz generados; pantalla auténtica integrada
en perspectiva, música licenciada para web/redes, foley, color y mezcla.
13 controles técnicos aprobados, 816 fotogramas descodificados, AAC final
−14,0 LUFS / −1,2 dBTP. Revisión visual muestreada del archivo completo.
No se afirma escucha humana ni funcionamiento nativo actual: las pantallas
proceden de la QA del 22/10. Edificio/precio ficticios, sin compra inventada
ni rentabilidad garantizada dentro de RWAdar.

Autorización expresa de 650 créditos Higgsfield; consumo real 562,70, sin
compras, cambio de plan ni reintentos. Se mantiene todo local sin publicar
web, app o redes. Sin commit y sin cambios del producto; se conserva el WIP.
Las animaciones anteriores quedan como material secundario, no como el spot
solicitado. No queda trabajo de producción requerido para entregar este MP4.

---

## 26 de octubre de 2026 · Codex · vídeo promocional «Sigue la fuente»

Víctor pidió una pieza de animación como la referencia adjunta, con edición,
postproducción y motivos para usar la app. Entrega local terminada en
`rwadar-promo-2026-10-26/`: MP4 principal de 24 s, vertical 1080 × 1920 a
60 fps, copia ligera, portada, reproductor y fuentes editables. Animación 3D,
música y efectos originales; tres agentes apoyaron sonido, recursos y revisión.
Sin commit de esta sesión y sin publicar.

La [verificación del vídeo](../VERIFICACION-VIDEO-PROMOCIONAL-2026-10-26.md)
registra 14 comprobaciones técnicas aprobadas, 1.440 fotogramas descodificados,
−14,1 LUFS / −1,7 dBTP en el AAC final, revisión visual muestreada y fuentes.
Las pantallas auténticas son de la QA aprobada del APK 1.3.2 del **22/10**;
no son capturas actuales ni una nueva validación nativa. Se conservan sus
rótulos editoriales. El intento de captura nueva se cerró por bloqueo del
navegador y no se presenta como completado.

Pendiente solo la decisión editorial de Víctor de usar/publicar el vídeo;
la entrega local no autoriza difusión. No hay nueva investigación, SQL,
build/OTA, cambios del producto ni pruebas nativas. Se preservó el trabajo
compartido anterior. No se afirma escucha humana ni reproducción del usuario.

---

## 24 de octubre de 2026 · Codex · revisión integral de la entrega actual

La [revisión integral](../../rwadar-entrega-integral-20261022/integracion-140/docs/REVISION-INTEGRAL-2026-10-24.md)
está en el checkout aislado `rwadar-entrega-integral-20261022/integracion-140`,
rama `codex/cierre-android-140-20261023`. Revisión guardada localmente en8f4e9dc,
sin push. Base revisada:9d51f8b. Cambios de esta
sesión: informe, evidencia de cuatro rutas nuevas y corrección del estado vigente;
sin cambios del producto. Se preservan los cambios compartidos de esta carpeta.

Web24/10 publicada; main remoto aún no la integra. GitHub confirma latest1.3.2
y1.4.0draft. El lector anónimo del APK132 no puede sincronizar tras SQL28 y el
panel también necesita adaptar su lectura del catálogo y rutas protegidas.
No hay observación nueva en dispositivo132. El APK19 conserva QA pendiente y
se mantiene detenido tras el último fallo autorizado. Tres ayudantes revisaron
áreas separadas y han terminado; no se repitieron tests aprobados.

InvestigaciónPAUSED, solo manual. Sin SQL, correo, cuentas nuevas, builds,
otra ejecución nativa ni publicación durante la revisión. El traspaso completo
de esta entrega está en el PARA-CODEX del checkout aislado.

---

## 23 de octubre de 2026 · Claude · panel: correos, fechas, velocidad, planes y catálogo

Víctor eligió seis añadidos para el panel (`rwadar-panel/`, rama
`claude/panel-control`). Todo es **de solo lectura**; no se tocó la web, la
app ni la base:

- **Cuentas › Correos** (`lib/correos.js`): remitente y límite por hora (de
  la configuración de Auth, **solo campos no secretos**), altas confirmadas y
  cuánto tardan, cuentas >24 h sin confirmar, y errores de envío de 24 h en
  `auth_logs` con correos e IP tapados.
- **Límites y fechas** (`lib/fechas.js`, `lib/planes.js`): caducidad del
  catálogo, `security.txt` (22/08/2027) y claves del panel; uso de Workers y
  KV de Cloudflare por día, Supabase (plan, salud, último uso), minutos de
  GitHub Actions del mes exactos por trabajo (13 % el 23/10) y compilaciones
  de Expo lanzadas desde GitHub (1 de 15).
- **Tráfico › Velocidad real** (`lib/velocidad.js`): LCP, INP y CLS p75 de 7
  días por móvil/ordenador; sin nota con menos de 10 visitas medidas.
- **Catálogo y Academy** (`lib/contenido.js`): inventario de lo publicado y
  lecciones más leídas. **Ojo:** la web solo carga la analítica en portada,
  Academy y legales (`assets/analitica-*.js`), así que **no se sabe qué
  fichas de oferta/plataforma se abren**. Medirlo (y los clics «Ir a la
  plataforma») es un cambio de la web propuesto aparte; el panel lo cruzará
  solo si aparecen rutas `/ofertas/…` en Web Analytics.
- Hallazgos para revisar: las **26 plataformas** llevan 76–89 días sin
  verificar; **23 de 26** no tienen ninguna oferta y hay ofertas de
  proveedores sin ficha de plataforma (Aktionariat · BOSS, Midas, Alius…).
- Salud pasa de 11 a 14 comprobaciones. Pruebas: `npm run test:panel` 45/45.

---

## 23 de octubre de 2026 · Codex · revisión de pendientes e investigación manual

Víctor pidió contrastar la lista completa, reutilizar el APK 1.4.0 y evitar
repetir pruebas. Tres ayudantes recibieron áreas separadas: web/catálogo,
Android y seguridad/vídeo. Sus revisiones de evidencias no ejecutaron nuevas
baterías ni operaciones remotas. La matriz está en
[`../REVISION-PENDIENTES-2026-10-23.md`](../REVISION-PENDIENTES-2026-10-23.md).
La web integral tiene comprobación de producción del 22/10; eso no se presenta
como una nueva inspección remota del 23/10. GitHub sí se consultó el 23/10:
la última versión pública sigue siendo **1.3.2**. El APK **1.4.0/código 18**
ya está compilado; falta cerrar las fases nativas pendientes antes de publicarlo.

**Corrección efectiva del programador:** la tarea existente se actualizó a
«RWAdar · investigación profunda bajo demanda», con estado **PAUSED**,
comprobado después en su configuración guardada. Solo se inicia al pulsar
**Ejecutar** o con una orden expresa de Víctor; cada inicio corresponde a un
solo ciclo y no reactiva el horario. Investigar no concede por sí solo permiso
para SQL remoto o publicación web. Esta entrada sustituye las referencias a
«ACTIVA a las 09:00» de los traspasos históricos inferiores. No se investigó
ni se publicó catálogo durante esta revisión.

Quedan parciales la investigación documental de las 49 ofertas, el plan 5S y
la revisión exhaustiva de textos. Comunidad sigue apagada: sus refuerzos
adicionales tienen pruebas locales, pero la migración no está aplicada.
Turnstile, allowlist de Auth y pruebas reales de cuentas/dispositivo mantienen
sus pendientes documentados. El vídeo local usa nueve perfiles simulados:
45 tareas observables no acreditan satisfacción humana del 90 %.

---

## 22 de octubre de 2026 · Claude · panel de control (`rwadar-panel/`)

Víctor pidió un panel para controlarlo todo y compartirlo con sus socios por
WhatsApp, entrando solo con un enlace. **Commits en la rama local
`claude/panel-control`** (no subida a GitHub, no unida a `main`); en la carpeta
de trabajo los mismos archivos siguen sin seguimiento sobre `main`, junto a los
cambios sin subir de Codex en `AGENTS.md` y `docs/`, que no se han tocado.
**No se ha publicado nada ni se ha tocado Supabase ni Cloudflare**: todo se
probó contra un simulador local (`rwadar-panel/demo/simulador.js`).

- **23/10 (cierre):** rama `claude/panel-control` subida a GitHub (7 commits, sin unir a `main`; no lanza ningún flujo). Traspaso completo en `docs/tareas/PANEL-DE-CONTROL.md` de esa rama.
- **23/10 (tarde):** `GITHUB_TOKEN` fino de solo lectura (RWADAR y
  RWAdar-downloads; comprobado que no ve Calix) subido al Worker: la nube ya
  ve copia de seguridad, tareas y descargas. El uso de la app tiene 25 s de
  margen y, si Supabase no contesta, sale de lo apuntado cada hora. Recorrido
  final en la nube: todo correcto salvo el aviso real de Actions (Compilar
  app Android, Publicar web, Verificación). Pruebas 36/36.
- **23/10:** Víctor decidió que el panel **no apague la web** (cuando haga
  falta os lo pide a vosotros): quitados el botón, la página de
  mantenimiento y los despliegues de Pages (rama, commit `e174ccb`). Panel
  subido de nuevo con los mismos enlaces (huellas comprobadas). Cloudflare
  solo cuenta exacto los últimos 7 días (más allá muestrea 1/10): el panel
  apunta cada día las visitas exactas en KV. Retirar el catálogo solo se
  ofrece si la base da permiso (hoy no: 42501). Pruebas 35/35 y recorrido
  completo con datos reales, local y nube.
- **Estado al cierre (22/10, noche):** Víctor puso sus claves y dio permiso
  expreso para subirlo. Worker `rwadar-panel` subido a
  <https://rwadar-panel.victorjorquesgranero.workers.dev> con KV
  `rwadar-panel-almacen` y cron horario. Se renovó `wrangler login` (la sesión
  anterior solo tenía Pages; ahora tiene los permisos por defecto). Comprobado
  desde fuera: sin enlace 401, enlace falso 403, enlace real entra; salud,
  visitas, cuentas (9) y uso de la app (95 app / 81 web en 24 h) con datos
  reales. Rama con 4 commits (`f2441b3` y el de GitHub). **Pendiente de
  Víctor:** permiso «Cloudflare Pages · Edit» en el token del panel (sin él
  no hay encender/apagar), un `GITHUB_TOKEN` de solo lectura (desde Cloudflare
  GitHub limita las consultas sin clave) y decidir si se da a `service_role`
  `SELECT, UPDATE` en `catalogo_publicacion` (hoy el botón de retirar el
  catálogo da 42501; también `perfiles` y `vigilancia` están cerradas).
- **Segunda tanda:** datos de la app (aperturas del catálogo desde la app y la
  web por hora, leídas de los registros de Supabase con `SUPABASE_ACCESS_TOKEN`;
  historial por día y descargas por día) y entrada por **enlace personal** sin
  cuentas (llave tras `#`, cookie firmada 90 días, solo huellas en el Worker,
  anulable por persona). Cloudflare Access queda como opción. Cron horario en
  el Worker. Pruebas 31/31.
- **Sin comprobar contra producción (además de lo de abajo):** la consulta
  ClickHouse a `logs` (`source_name`, `log_attributes[...]`) y el formato de
  `event_message`; la doc de Supabase no es del todo coherente.

- **Qué hace:** encender/apagar la web (sube una página de mantenimiento 503 y
  vuelve al despliegue anterior con la API de Pages), retirar/mostrar el
  catálogo (`catalogo_publicacion.retirado`), salud con doce comprobaciones y
  qué hacer, visitas de Web Analytics (GraphQL `rumPageloadEventsAdaptiveGroups`),
  descargas del APK por versión, cuentas (listar, confirmar, bloquear, borrar
  con el correo escrito) y registro de acciones con quién las hizo.
- **Dos modos:** `npm run panel` (local, 127.0.0.1, sesión por arranque) y el
  Worker `rwadar-panel` en Cloudflare detrás de Cloudflare Access + lista
  `PANEL_SOCIOS`, con verificación propia del JWT (falla cerrado).
  Detalle y pasos en `rwadar-panel/LEEME.md`.
- **Toca fuera de la carpeta:** `.gitignore` (readmite `rwadar-panel/`,
  ignora `datos/`, `datos-demo/` y `nube/generado/`) y `package.json`
  (`panel`, `panel:demo`, `panel:nube`, `panel:nube:demo`, `test:panel`, y
  `test:panel` dentro de `npm test`). No toca `rwadar-site/` ni ninguna ruta
  con huella aprobada.
- **Pruebas:** `npm run test:panel` 25/25; `npm run test:tools` correcto;
  `npm run panel:nube -- --ensayo` empaqueta el Worker con wrangler 4.125.0
  (62 KB, sin módulos de Node ni claves); el Worker se ejecutó en `wrangler dev`
  con Access simulado y se recorrió en el navegador (socio, intruso, móvil).
- **Sin comprobar contra producción:** los nombres de campos de la consulta
  GraphQL de visitas, la vuelta atrás de Pages, la API de administrador de
  Supabase y el PATCH del catálogo con la clave secreta. Se verán la primera
  vez que Víctor abra el panel con sus claves.
- **Pendiente de Víctor:** crear el token de Cloudflare y la clave secreta de
  Supabase, rellenar `PANEL_SOCIOS`, ejecutar `npm run panel:nube`, activar
  Access en el Worker y apagar/encender una vez desde el ordenador para dejar
  subida la página de mantenimiento.

---

## 22 de octubre de 2026 · Codex · cierre de reintentos por consumo

Víctor ha reprochado el consumo desproporcionado. Se detuvieron los agentes y
las revisiones delegadas; no lanzar más reintentos por iniciativa automática.
La web integral está publicada en `rwadar.pages.dev` (e764634c) y comprobada.
Android público sigue en 1.3.2. El APK 1.4.0/código18 está compilado, pero sus
ensayos no han cerrado correctamente: **no está aprobado ni publicado**.
Último ensayo: 39812931682, head público40f926f, fallo en el recorrido;
la descarga diagnóstica no equivale a una QA superada.

El soporte de precarga está en `de7f2b1`, aprobado para preview en `b3deb41`;
`1a0643d` separa referencias documentales duplicadas. Preview `b0fa07a6`
publicada, sin comprobación remota final ni producción de ese soporte.
Pruebas locales:551web+90fichas+29precarga; no repetirlas sin un cambio o fallo.
La tarea diaria sigue ACTIVA a09:00localPC, pero las altas nuevas están
bloqueadas hasta publicar/verificar la compatibilidad web y Android>=1.4.0.
No se aplicó SQL nuevo durante este cierre. Revisar workingtree y
`rwadar-entrega-integral-20261022/CONTINUACION.md` antes de retomar; conservar
el catálogo completo y la versión pública. Falta cerrar también la lectura
canónica de Cloudflare mediante su autenticación vigente y el texto del horario.

## 22 de octubre de 2026 · Codex · segunda revisión integral, idiomas y ciclo diario

Trabajo posterior al cierre de la web y Android 1.3.2 descrito debajo. Se integró
la reorganización de Claude y se atendió la ampliación pedida por Víctor. La
publicación nueva se documenta por separado; no reutilizar la prueba de 1.3.2
como si demostrase el APK 1.4.0.

- **Fuente móvil:** `6735317` y `3af2033`, Android 1.4.0, fichas acotadas al área visible,
  radar y sus toques corregidos, datos editoriales citables e idiomas ES/EN.
  Suite final 233/233 y comprobación Expo/Metro correcta. El candidato de código
  17 se canceló por una modificación durante la preparación del archivo; se
  consolidó esa corrección y se inició el código 18 dentro de la cuota gratuita.
  La QA y publicación se cierran con sus propios identificadores cuando terminen.
- **Catálogo aplicado:** lote del 22/10, vigente hasta el 29/10, 26 plataformas,
  49 referencias y 4 descartes. SQL editorial revisado, PGlite y lectura pública
  posterior. IOD cerrado. Los nuevos detalles investigados en el informe de
  condiciones no se aplicaron automáticamente como hechos acreditados.
- **Web publicada y comprobada:** segunda mitad de la reorganización, detalle sin
  recorte, campos mínimo EUR/España/salida/costes, 49 páginas de oferta,
  26 de plataforma, 4 de descarte, metodología, cambios y RSS. Snapshot
  separado del comportamiento, helper común y fuentes WOFF2 reutilizadas.
  Fuente integrada en `ab61990`, correcciones públicas `386f86f`, `da2ae49`,
  `f0a413a` y comparación móvil `2c98d46`. Cuarta preview aprobada y producción
  desde `08b18a4`: 208/208 HTTP, 206/206 recursos idénticos y Chrome real a
  320/390/1440, ES/EN, persistencia, búsqueda, foco y comparación. Suite web
  final 551/0 y 90 comprobaciones de páginas; cobertura transversal completada
  por áreas en logs preservados, sin atribuir un único `npm test` final exitoso.
- **Vídeo local entregado:** evaluación grabada de la interfaz real mediante
  nueve perfiles simulados, 45/45 tareas observables y reproducción completa
  de la edición final. No es investigación con nueve personas reales.
- **Tarea diaria activa:** «RWAdar · investigación y publicación diaria», a las
  09:00 locales del PC por autorización expresa de Víctor; actualmente coincide
  con España peninsular. Investigación documental profunda, decisión diaria
  binaria, sin cola «en investigación», revisión independiente y publicación
  editorial tras las compuertas. PC y aplicación deben estar encendidos.
- **Seguridad:** comunidad OFF y su refuerzo probado localmente, sin aplicar
  esa migración; callback de cuentas corregido. Turnstile, allowlist real de
  Auth y los flujos con credenciales del titular siguen separados y pendientes.

Detalle: [`VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md`](../VERIFICACION-MEJORA-INTEGRAL-2026-10-22.md),
[`CICLO-DIARIO-CATALOGO.md`](CICLO-DIARIO-CATALOGO.md) y los informes de
condiciones y seguridad fechados el 22/10. No borrar informes anteriores.

## 22 de octubre de 2026 · Codex · web desde main y Android 1.3.2 publicados

**Rama:** `main` de `victorJorques/RWADAR`, privado. Víctor autorizó en el turno
la preview, producción, EAS editorial y la distribución Android como 1.3.1.
Se leyó primero la entrada del 21/10 y se hizo `git pull --ff-only origin main`.

- **Web publicada:** <https://rwadar.pages.dev>. El catálogo del 21/10 ya estaba
  aplicado por Víctor; se leyó y sincronizó sin escribir en Supabase. Snapshot
  26 plataformas, 4 descartadas y 49 referencias (24/21/4), vigente hasta el
  28/10. Las 49 fichas tienen su imagen nueva. El primer intento se detuvo por
  snapshot modificado; se revisó y consolidó antes de publicar. Preview y
  producción tienen 35/35 controles HTTP y 113/113 recursos idénticos.
- **Commits fuente enviados:** `0a49969` (snapshot y preparación), `9f5ab61`
  (huella aprobada) y `8821228` (preview y dependencias). Web y APK salen de
  ese corte de main. El cierre documental y las copias inertes de workflows
  están en el commit que contiene esta entrada; no cambian el binario entregado.
- **Android final:** [RWAdar 1.3.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.2),
  código **16**, perfil editorial. Una sola compilación EAS, misma firma que
  1.3.1. Publicada como latest final el 22/10; APK, sumas y ZIP de evidencia
  descargados sin autenticación y cotejados. `/android` lleva a 1.3.2.
- **QA del APK:** ejecución `39701844100` exitosa con el binario exacto:
  instalación, cuatro pestañas, catálogo, Academy, favorito tras reiniciar,
  cinco fotos y formularios sin credenciales. Capturas propias revisadas por
  tres agentes; separación de la nota de favoritos 92 px. La primera ejecución
  pasó el uso pero falló por el límite inicial del ZIP; se amplió solo ese
  límite y se repitió el mismo APK conservando todas las capturas.
- **Publicación Android:** ejecución `39702655647` exitosa; commits públicos
  `3b366a3` (QA definitiva), `77371f1` (publicación tras revisión) y `340a906`
  (controles de publicación devueltos a `NO`, sin repetir Actions). El origen
  privado no cambió de visibilidad. No se publicaron tiendas ni OTA.
- **Pruebas y coste:** `npm ci` raíz y móvil; `npm test` completo correcto,
  web 502/502, móvil 184/184, base/QR/herramientas correctos; compuerta final
  51/51. Navegador real
  móvil y escritorio y formularios observados sin envíos. EAS Free después:
  Android 5/15, total 6/30, cero exceso, complementos y coste estimado.
- **Avisos pendientes:** Expo Doctor 20/21 por seis parches recomendados;
  `npm audit` conserva 21 avisos móviles y uno alto en raíz, cero críticos.
  No se cambiaron locks ni se silenciaron avisos. Quedan Auth con credenciales
  reales, recuperación efectiva, entrega de correo y teléfono físico;
  no se atribuyen a la QA del emulador. Renovar catálogo antes del 28/10.
- **Archivos locales preservados:** los tres archivos sin seguimiento del
  manual están en `rwadar-respaldo-local-20261022/`, con manifiesto y SHA,
  fuera de rutas publicables. La evidencia detallada queda en la carpeta
  ignorada `rwadar-entrega-20261022/`; no restaurar el PDF al sitio público.

Informes: [`VERIFICACION-PUBLICACION-2026-10-22.md`](../VERIFICACION-PUBLICACION-2026-10-22.md),
[`VERIFICACION-ANDROID-1.3.2-2026-10-22.md`](../VERIFICACION-ANDROID-1.3.2-2026-10-22.md)
y [`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md).

## 21 de octubre de 2026 · Claude (10) · catálogo del 21/10, fotos por ficha, revisión de la web y comunidad

**Rama:** `claude/integracion-2026-10-19` (une lo publicado por Codex el 11/10 con todo lo del catálogo). **Nada aplicado en Supabase ni publicado.** Codex no ha subido nada desde el 11/10, así que no hay solapes.

- **Catálogo:** lotes del 20/10 (`504bee7d`) y **21/10 (`c3b71e81`, vigente hasta el 28/10)** con `npm run catalogo`; 69/69 fuentes, PGlite OK dos veces. Vale el del 21/10. Detalle: `docs/CATALOGO-V2-2026-10-21.md`.
- **Imágenes por ficha (contrato editorial v2):** las 49 fichas tienen foto generada del activo (44 con RealVisXL V5.0 Lightning en la sesión, 5 con Canva), retocada y con lugar y tres pasos. Fuente en `rwadar-editorial-source/ofertas/` (`fotos.json`, `fotos/`, `fotografiar.py`, `generar.mjs`). La app las enseña desde su próxima versión: **hace falta 1.3.2 (número y EAS son tuyos)**. Revisión: `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`.
- **Tarjetas al estilo Booking:** web: «Guardar» sobre la foto (solo móvil, 44 px), lugar con chincheta, tarjeta entera abre la ficha (el control sigue siendo «Ver ficha»), aviso no bloqueante a dos líneas. App: lugar con icono `lugar` en `FichaOferta`.
- **Revisión de 20 puntos de la web:** títulos de la Academy ≤ 65 caracteres (`tituloPestana`, el `og:title` conserva el completo), descripción del índice ≤ 160, objetivos táctiles del pie y migas ≥ 24 px, `og.png` rehecho con `rwadar-editorial-source/og.mjs` (decía `rwadar.netlify.app` y «26 pasan el filtro»; 639 → 75 KB).
- **Comunidad (27, preparada y sin aplicar):** se podía saltar «una al día» publicando, borrando y volviendo a publicar, y borrar una oculta por denuncias. Ahora el cupo vive en `cupos_publicacion` (no se libera al borrar) y la oculta no la borra su autor. `probar-comunidad.mjs` 33/33. Se editó `27_comunidad.sql` directamente porque **no está aplicada**: si alguien la aplicó, hace falta una migración aparte.
- **Pendiente de seguridad para Víctor/Codex** (revisión de solo lectura, sin verificar del todo): activar Turnstile (las altas y recuperaciones agotan los 30 correos/hora); dejar en Supabase solo `https://rwadar.pages.dev/` como URL de redirección; valorar en la comunidad comprobar `sesion_confirmada()`, filtrar enlaces también en `autor` y que tres cuentas nuevas no basten para ocultar; en la web, no pintar el `error_description` crudo y avisar con qué correo se entra al adoptar una sesión del enlace.

## 19 de octubre de 2026 · Claude (9) · orden única del catálogo y revisión total

**Rama:** `claude/revision-catalogo-2026-10-19` (PR #12). **Nada aplicado en Supabase ni publicado.**

- **`npm run catalogo`** (`rwadar-app/actualizar-catalogo.mjs`): captura,
  comprueba las 69 fuentes del radar contra `rwadar-app/data/comprobaciones-fuentes.json`
  (reintenta una vez las que fallan), pone al día las 49 fichas con lo leído
  (Brickwise app y API, Aktionariat y portales, Spiko, Prosegur, Alius,
  Hausera, P2P de Reental, Midas), monta, prueba en PGlite y escribe
  `informe-<fecha>.md`. Si falla una fuente del radar no monta nada (sale con 2).
  Probada de punta a punta con captura real simulando el 20/10: 69/69, lote OK.
- `capturar-fuentes.mjs`: hora de Madrid, PDF siempre con curl (dos
  identidades, comprueba `%PDF`), segundo intento por HTTP (navegador y curl)
  si hay bloqueo o 5xx, y paginación del P2P de Reental esperando a sus textos.
- **Lote del 19/10 rehecho:** `aa3aebce` (antes `f9876935`). Fuente de la
  portada de Midas → `midas.app/llms.txt` (la portada ya bloquea la nube);
  aviso general con la redacción de producción («Referencia editorial
  gratuita…»); aviso de quitt (encabezado y tabla no coinciden); número de
  accionistas.
- **Producción ≠ `main`:** Supabase tiene el lote `966c230c` (fichas del 11/10)
  cuya fuente no está en GitHub, y la web/app publicadas salen de
  `codex/cuentas-web-movil`, sin unir. El lote nuevo se probó también en una
  copia de esa rama: `comprobar-revision` OK, `probar-web` 501/501 y la web
  generada con las vistas que saldrán de Supabase se ve bien en Chromium
  (19.10.2026, Spiko 2,41 %, sin cookies ni errores). **Publicar desde esa
  rama**, no desde `main`.
- Revisión total: web en producción 35/35 y base 2/2 en solo lectura; sin
  cookies propias (la `__cf_bm` de Supabase no se guarda); cabeceras de
  seguridad presentes; `/android` → última release; copias diarias correctas
  hasta hoy; `npm audit` raíz y base 0, móvil 23 (los que Codex ya evaluó).

## 19 de octubre de 2026 · Claude (8) · revisión del catálogo del 19/10, preparada sin aplicar

**Rama:** `claude/revision-catalogo-2026-10-19`. **Nada aplicado en Supabase ni publicado.**

- Herramientas nuevas (primera sesión del día, sin internet):
  `rwadar-app/capturar-fuentes.mjs`, `montar-revision.mjs` y
  `comprobar-revision.mjs`, para cualquier fecha. Estado y reglas en
  `docs/tareas/REVISION-CATALOGO-2026-10-19.md`.
- **Revisión del 19/10** (segunda sesión, con internet): lote `aa3aebce`,
  vigente hasta el 26/10. 69 fuentes del radar y las 49 fichas consultadas el
  19/10 desde la nube (salida en EE. UU.). Mismo manifiesto 26/49 (24/21/4).
  Detalle en `docs/CATALOGO-V2-2026-10-19.md`; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json`.
- **Retirado el documento de claude.ai** de las 49 fichas (205 referencias);
  los textos que lo citaban se reescriben con la fuente oficial.
- Midas bloquea la nube: mF-ONE y mTBILL pierden la cifra; las cuatro de Midas
  quedan «no verificable» con aviso. Spiko 2,41 %. IOD Occasio, ya en campaña.
- Pruebas: `comprobar-revision.mjs 2026-10-19` OK (aplicado dos veces sobre la
  cadena de producción en PGlite). `npm test`: db, qr, móvil y herramientas en
  verde; `test:web` falla hoy **también en `main`** porque el catálogo
  incrustado en la web (06/10) caducó; con el reloj al 10/10, 501/501.
- **Pendiente de Víctor:** pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase › SQL Editor › Run y publicar la web como el 06/10
  (sincronizar, dos rondas de commit + aprobación en `estado.json`,
  `--preview`, `--produccion`). Al sincronizar, `test:web` vuelve a verde.
## 11 de octubre de 2026 · Codex · cierre publicado: cuentas web y Android 1.3.1

Fuente en worktree `codex/cuentas-web-movil`; **no modificar la carpeta
principal**, que está atrasada y conserva material de Academy sin seguimiento.
Commit de contenido **`a213373`** (autor Codex): panel de cuentas Android
1.3.0, aislamiento de sesiones y carreras web, transporte acotado y baja
reautenticada, pruebas, privacidad y cuatro parches compatibles Expo SDK 57.
Fuente Android final en **`53d4c33`**: separación propia positiva de la nota
local, «1 guardado», versión 1.3.1 y dos regresiones; dependencias y motor de
cuentas intactos. El cierre técnico/documental conserva este commit compilado
y la huella web aprobada, sin regenerar ni volver a desplegar contenido web.
**Cierre guardado y sincronizado en `1148323`**: informes, manifiesto,
documentación vigente y QA de APK14; auditor local posterior con árbol limpio,
«LISTO PARA CORTE FINAL» y huellas de contenido/alcance idénticas a las aprobadas.

**Verificado:** `npm test` final salida 0, web 501/móvil 182/SQL de sesión 196;
Chrome aislado 61 y 30, revisión independiente 54 nativos/196 SQL/30 Chrome,
sin otro bloqueo del núcleo. Gitleaks 8.30.1 limpio y `git diff --check` limpio.
Los ensayos usan datos ficticios y no demuestran correo ni un APK instalado.

**En línea:** Víctor introdujo personalmente la contraseña de aplicación de
Gmail; confirmó recepción de alta y enlace válido (llegó a spam). Codex vio
el perfil y comprobó salir. Recuperación pedida a las 08:14:18 UTC y recibida
en INBOX, con DKIM/SPF/DMARC correctos, solo metadatos y sin leer el token.
El cambio final real de contraseña todavía **no se ha realizado**.

La migración `20261011074218_cuentas_sesion_confirmada.sql` **ya se aplicó**
con permiso expreso y se verificó en producción. No reaplicar la 26 sin
rehacer después este refuerzo. El catálogo sigue público (26/49 y 4
descartes), lote del 6/10 vigente hasta el 13/10. El asesor da 0 ERROR,
4 WARN y 3 INFO; límites documentados, no «seguridad absoluta».

**Web publicada y comprobada:** revisión `d91d4e14`, producción `4c7d38e5`,
<https://rwadar.pages.dev>. Las cuentas ya están abiertas; formularios de
acceso/alta y Perfil observados en navegador. HTTP **35/35** y huellas
**64/64** idénticas al artefacto aprobado. Aprobación y QA Android en
`aa886d2`, después del manifiesto `3a0d953`. La fuente web es `a213373`.

**Android autorizado solo sin cargos:** EAS terminó 1.3.0/código 13,
commit compilado `3a0d953`, 85.622.388 bytes. Firma y manifiesto comprobados
localmente; instalación y ejecución del APK exacto aprobadas en emulador API35. Expo Doctor
**21/21** y pruebas **180/180** en copia aislada, nunca sobre las junctions
principales. EAS Free: 2/15 usados y cargos cero. Publicación real
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.0>, a las
09:17:18 UTC, QA/release `38127611672` exitoso. La descarga anónima posterior
coincide byte a byte con el APK ensayado y conserva la firma. Evidencia pública
ZIP y sumas verificadas. Flujo publicado en `f01dbc2` y desarmado en `6d4280e`;
README público actualizado en `d045b4c`. No hay publicación en las tiendas.

La revisión visual posterior detectó una nota local que cruzaba el borde del
panel de recuperación. **Corregida, publicada y verificada en 1.3.1/código14**:
<https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.3.1>.
EAS terminó a las 09:36:36 UTC, fuente `53d4c33`, APK **85.622.508 bytes**;
cuota Free posterior Android **3/15**, total **4/30**, cero coste/exceso/addons.
QA y release propias `38129282799`, jobs `114440050549`/`114440579448`,
exitosas; publicación **09:45:05 UTC**, latest pública, no draft/prerelease.
Descarga anónima posterior comprobada: APK y ZIP idénticos a sumas/evidencia,
firma v2 válida y certificado anterior. Resultado propio: separación **92px**,
navegación, catálogo, Academy, favorito persistente y formularios correctos.
Cuatro capturas propias de cuentas revisadas por Codex y otro agente; nota
fuera del borde, singular correcto, sin otro bloqueo visual observado.
No atribuir al APK14 las pruebas históricas del13 ni declarar Auth real desde
Android, SMTP nativo o teléfono físico. Commit público de lanzamiento
`8c49368`; `2f44074` dejó `PUBLICAR_RELEASE=NO` con `[skip ci]`.
El espejo privado queda en NO; plantilla auxiliar no utilizada retirada,
recuperable en Git. Móvil **182/182** y Doctor **21/21** correctos.
[`VERIFICACION-ANDROID-1.3.1-2026-10-11.md`](../VERIFICACION-ANDROID-1.3.1-2026-10-11.md).
La auditoría npm no es limpia: 23 avisos, evaluados sin vía vulnerable
demostrada en el alcance analizado, con inventario estático adicional 1.3.1.
No equivale a descompilar Hermes. No ocultarlos ni forzar downgrades incompatibles.
[`VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md`](../VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-11.md).

Publicidad, cobros, comisiones, opiniones, comunidad, avisos y manual siguen
apagados. El manual se reserva a usuarios registrados: no publicar un PDF
estático como entrega. Codex asume configuración, código, pruebas y despliegue;
Víctor solo introduce credenciales/identidad y autoriza operaciones reservadas.

Continuar según [`CUENTAS-WEB-MOVIL-2026-10-11.md`](CUENTAS-WEB-MOVIL-2026-10-11.md).
Evidencia en [`../VERIFICACION-CUENTAS-2026-10-11.md`](../VERIFICACION-CUENTAS-2026-10-11.md).
Publicación y descarga ya cerradas y comprobadas; queda mejorar entregabilidad
del correo en spam, cambio real de contraseña y entrada posterior, prueba de
Auth nativo con credenciales reales y teléfono físico. Son límites de evidencia,
no tareas de código asignadas a Víctor. No activar monetización, manual ni
tiendas sin cumplir sus requisitos separados. Repetición HTTP final: 35/35.


## 8 de octubre de 2026 · Claude (8) · cuentas fase 1: casi abiertas, falta que Gmail acepte la contraseña

**Rama:** `claude/abrir-cuentas` (sale de `main` tras el PR #10). PR abierto
para que lo revises. **La web pública NO tiene las cuentas encendidas**;
solo la vista previa `https://revision.rwadar.pages.dev`.

### Ya hecho y comprobado

| Qué | Dónde / cómo se comprobó |
|---|---|
| Web: `SERVICIOS_USUARIO_REMOTOS=true` y `CORREO_AUTH_E2E=true`; opiniones, avisos por correo, comunidad, manual y Turnstile siguen apagados | `rwadar-site/assets/rwadar-20260820.js` |
| Privacidad reescrita para cuentas abiertas (7/10/2026): apartado «Tu cuenta (opcional)», correos de confirmación/recuperación por una cuenta de Gmail de RWAdar, sesión solo en memoria, borrado desde Perfil, conservación | `rwadar-site/privacidad.html`, `sitemap.xml` |
| Pruebas: el camino cerrado se sigue probando sobre la misma web con los interruptores apagados (`jsCerrado` en `probar-web.mjs`) | `npm test` en verde |
| Ensayo E2E en Chrome real contra Supabase simulado (PGlite + 26): alta, confirmación, entrar, vigilar, recuperar, móvil, borrar, Turnstile | `node rwadar-app/ensayo-cuentas-web.mjs` → **61/61** (Playwright con `RWADAR_CHROMIUM` = Chrome instalado) |
| Migración 26 + verificador en una transacción | `rwadar-app/db/26_abrir_cuentas_un_paso.sql`; probado en PGlite (dos veces) |
| **Supabase producción:** 26 aplicada (SQL Editor, «Success», verificador sin excepción) | 07/10, 23:3x |
| **Supabase Auth:** SMTP propio activado (remitente y usuario `rwadares@gmail.com`, nombre `RWAdar`, `smtp.gmail.com`, puerto 587); plantillas en español «Confirma tu cuenta de RWAdar» y «Recupera tu acceso a RWAdar» (texto de `REABRIR-CUENTAS.md`); **altas abiertas**; confirmación de correo obligatoria; contraseña mínima 12 (ya estaba); Redirect URLs: añadido `https://revision.rwadar.pages.dev/` | `GET /auth/v1/settings` → `disable_signup:false`, `mailer_autoconfirm:false` |
| Vista previa con cuentas | despliegue `b8745f05`, alias `revision.rwadar.pages.dev`; `comprobar-publicado.mjs` 35/35; aprobación en `estado.json` (commit `e87141c`) |

### Lo que falla ahora (bloqueante)

Al crear una cuenta en la vista previa sale «Error sending confirmation
email». En *Logs › Auth* de Supabase:
1. Primer intento: `535 5.7.8 Username and Password not accepted` (credenciales).
2. Último intento (08/10 00:02): `534 5.7.9 Application-specific password required`.
   Es decir: la verificación en dos pasos de `rwadares@gmail.com` ya está
   activa, pero en *SMTP Settings › Password* sigue la contraseña normal de
   Gmail. Hay que generar una **contraseña de aplicación** en
   https://myaccount.google.com/apppasswords (16 letras, **sin espacios**) y
   pegarla ahí › *Save changes*. Esto solo lo puede hacer Víctor: ni Claude
   ni Codex deben crear credenciales ni escribir contraseñas.

Quedó una cuenta de prueba de Víctor **sin confirmar** en Auth › Users: al
registrarse otra vez con el mismo correo se reenvía la confirmación; si no,
borrarla desde ahí.

### Lo que falta, en orden

1. Víctor: contraseña de aplicación en Supabase (arriba).
2. Prueba real en `https://revision.rwadar.pages.dev`: crear cuenta, recibir
   «Confirma tu cuenta de RWAdar», confirmar, vigilar una plataforma, salir y
   entrar, «He olvidado la contraseña», borrar la cuenta. Si un paso falla,
   el motivo está en Supabase › Logs › Auth (abrir la fila y leer `error`).
3. Publicar en producción desde la rama: `node rwadar-publicar.js --produccion`
   (si sincroniza y ensucia JS/portada/sitemap: commit + nueva aprobación en
   `estado.json` y repetir, como siempre) y comprobar con
   `node .github/comprobar-publicado.mjs https://rwadar.pages.dev`.
4. Supabase › URL Configuration: quitar `https://revision.rwadar.pages.dev/`
   (y valorar quitar `https://rwadar.netlify.app/`, que es solo la página de
   limpieza). Deben quedar solo los de `rwadar.pages.dev`.
5. Unir el PR de `claude/abrir-cuentas` a `main`.
6. Recomendado antes de anunciar cuentas: anti-robots Turnstile (sección
   «Anti-robots» de `REABRIR-CUENTAS.md`: Víctor crea el widget y pega la
   Secret Key en Supabase; la Site Key va al JS, CSP en `_headers` y
   `rwadar-servir.js`, privacidad y pruebas).
7. Gmail no está pensado para envíos masivos (unos cientos al día). A medio
   plazo: dominio propio + Brevo (`REABRIR-CUENTAS.md`, opción B).

### Otros pendientes que no son de cuentas

- **El catálogo vence el 13/10** (lote `a0df3111`). Repetir la revisión antes
  (`docs/CATALOGO-V2-2026-10-06.md`); si no, web y app muestran «Revisión
  pendiente».
- Modo de la sesión de Claude: aun fuera de «Auto», el filtro de Claude bloquea
  pulsar «Run» en el SQL Editor de producción; Víctor tuvo que pulsarlo.

## 7 de octubre de 2026 · Claude (7) · catálogo del 06/10 en producción, web y app 1.2.0 publicadas

- **Supabase:** Víctor pegó `aplicar-y-aprobar.sql` tres veces (SQL Editor).
  Lote vigente **`a0df3111`** (06/10, hasta el 13/10). Sustituye a `36945ee9`
  (cifra principal de mF-ONE y Spiko sin actualizar: el montador buscaba la
  etiqueta en métricas ya cambiadas) y a `c0e20ca3` (texto de Spiko con
  «observado el 30/09»). Cada corrección se probó en PGlite encima de los
  lotes ya aplicados. Comprobado por REST anónimo: 26/49 y contrato de la app.
- **Web:** despliegue de producción `b3fcc32f` desde el ordenador de Víctor;
  `comprobar-publicado.mjs` 35/35 en `rwadar.pages.dev`; mF-ONE 7,58 %,
  Spiko 2,16 % «observado el 06/10/2026», «Última revisión del registro:
  06.10.2026». Sincronizar cambia JS y portada: dos rondas de commit +
  aprobación en `estado.json`, como siempre.
- **Pruebas:** `probar-web.mjs` tenía el reloj de la pestaña simulada fijo
  en el 30/09 y fichas sintéticas de septiembre; ahora se fechan respecto al
  lote incrustado (`fechaLoteEmbebido`, `pestanaCatalogo({ inicio })`).
  Sin esto, cualquier lote nuevo rompía `npm test`.
- **App 1.2.0, versionCode 12:** build EAS `99fd77d8` (la `6c3ed542` murió
  por un fallo del servidor de Expo). APK 85 558 264 bytes, SHA-256
  `87900ef2…b8e3ea`, certificado `f506dea7…` (el de siempre). Probada en
  emulador Android 15 con el flujo nuevo `android-smoke-120.yml` del repo
  `RWAdar-downloads` (run 37446968987: Inicio, Buscar 24/21/4, Spiko 2,16 %,
  Academy 7 lecciones, Perfil; sin errores). Release `v1.2.0` marcada como
  latest; `/android` lleva a ella y la descarga anónima coincide byte a byte.
- `gh` instalado en el ordenador de Víctor (cuenta victorJorques, con
  permiso `workflow`).

## 6 de octubre de 2026 · Claude (6) · revisión nueva del catálogo, app 1.2.0 compilando

**Rama:** `claude/revision-catalogo-2026-10-06` (sale de `claude/publicar-2026-10-05`,
PR #9 aún sin unir). **Nada aplicado en Supabase todavía.**

- **Revisión del 06/10** (lote `36945ee9`, vigente hasta el 13/10): 70 fuentes
  del radar y 49 fichas consultadas de nuevo; mismo manifiesto 26/49 (24/21/4).
  Detalle y criterios en `docs/CATALOGO-V2-2026-10-06.md`. No se alargó la
  vigencia de la anterior (la base limita a 7 días y la app instalada también).
- **Para publicarla:** pegar `rwadar-app/data/importaciones/catalogo-2026-10-06-v2/aplicar-y-aprobar.sql`
  entero en Supabase › SQL Editor › Run, **después de las 02:00 de España**
  (Supabase va en UTC; antes falla a propósito y no cambia nada). Importa y
  aprueba en una transacción y se deshace si el lote no queda publicable.
  Después: `rwadar-publicar.js --preview` (sincroniza; habrá que commitear JS
  y portada y reaprobar en `estado.json` dos veces, como el 5/10), comprobar
  y `--produccion`.
- Comprobado: `node -r <reloj+3h> rwadar-app/comprobar-revision-2026-10-06.mjs`
  aplica ese mismo SQL sobre la cadena de producción en PGlite: 26/49, 9 fichas
  con cifras el 06/10, caduca el 14/10. `npm test` en verde. Sin el reloj
  adelantado se ejecuta tal cual a partir de las 02:00 del 06/10.
- **App 1.2.0, versionCode 11:** build EAS `6c3ed542-aa13-45c6-9e4d-9c4dbd144cf9`
  (perfil `editorial`, misma clave), lanzada desde el ordenador de Víctor;
  estaba en cola. Falta: descargar APK, comprobar firma/huella, probar en un
  móvil real y publicarlo como release `v1.2.0` en `RWAdar-downloads`
  (`/android` apunta a `releases/latest`). `gh` no está instalado: hacerlo
  desde el Chrome de Víctor.
- Pendiente de Víctor: «Merge» en el PR #9 y en el de esta rama.

## 5 de octubre de 2026 · Claude (5) · web publicada en producción desde el ordenador de Víctor

- **Publicado** con `rwadar-publicar.js --produccion` desde una copia limpia
  de `main` (`23f9faf`) en el ordenador de Víctor, con su sesión de
  Wrangler (cuenta `52d07be0…`). Despliegue `cbe0aa77`; antes, preview
  `a060c69e` (alias `revision.rwadar.pages.dev`). Ya no hace falta el
  secreto `CLOUDFLARE_API_TOKEN` para esta publicación, aunque sigue
  pendiente para publicar desde GitHub.
- La sincronización con Supabase cambió dos archivos, igual que el 2/10:
  `eee89fc` (catálogo en el JS: 10 fichas del 30/09 con vigencia de 1 día
  pasan a «Cifras pendientes de nueva revisión») y `e320b21` (portada
  pre-renderizada). Aprobaciones en `589be2c` y `4e06d9e`, por orden expresa
  de Víctor en el chat.
- Comprobado: `npm test` en verde; `.github/comprobar-publicado.mjs` 35/35
  sobre la preview y sobre `https://rwadar.pages.dev`; en Chromium móvil, la
  barra Inicio · Buscar · Academy · Perfil cambia de panel, Academy muestra
  «0 de 7 lecciones leídas», Perfil muestra «Cuentas en pausa»; consola sin
  errores; cabeceras (CSP, HSTS, X-Frame-Options DENY, nosniff) presentes;
  `/.git/config`, `/package.json`, `/.env` y el código fuente dan 404;
  barrido de secretos de `rwadar-publicado/` sin coincidencias.
- **Cuentas: siguen en pausa.** Para abrirlas faltan los pasos 1 a 3 de
  `docs/tareas/REABRIR-CUENTAS.md` (SMTP, ajustes de Auth y SQL 26), que
  solo puede hacer Víctor.
- **Ojo:** el lote del catálogo vence el 5/10 inclusive; a partir del 6/10
  la web lo enseña con «Revisión pendiente» hasta que haya revisión nueva.

## 5 de octubre de 2026 · Claude (4) · #6 y #7 unidos, manual corregido, anti-robots preparado

- **PR #6 unido a `main`** (`ecba31e`): comunidad apagada, app 1.2.0, flujo
  «Compilar app Android» y tu mejora de tarjetas. CI verde (pruebas + gitleaks).
  `main` es idéntico a lo aprobado en `estado.json` (`70b2346`).
- **Publicar sigue bloqueado por la clave**: lancé «Publicar web» (preview)
  desde `main` y se paró en «Comprobar que existe la credencial de
  Cloudflare» (run 37311901615). No se tocó nada en línea. La aprobación
  caduca el 7/10.
- **Manual de Eric corregido** (sin tocar el original):
  `docs/manual/corregir-manual.py` → `RWAdar_Como_Usar_RWAdar_2026_corregido.pdf`.
  Página 9: lista de vigilancia hoy, guías y avisos «próximamente», Academy
  con 7 lecciones. Página 7: el checklist «llegará próximamente». Las demás
  páginas salen idénticas píxel a píxel. Falta el visto bueno de Eric; se
  enciende con las cuentas (`docs/manual/LEEME.md`).
- **Anti-robots (Turnstile), apagado**: `TURNSTILE_SITEKEY=''` en el módulo
  `Cuenta`. Encendido, alta, entrada con contraseña, recuperación y reenvío
  piden un testigo nuevo cada vez y lo mandan como
  `gotrue_meta_security.captcha_token` (formato comprobado en
  `@supabase/auth-js`). El script de Cloudflare solo se carga al pedir algo
  a Auth. Caja `#cuentaRobot` en la ventana de cuenta. Para encenderlo hay
  que tocar CSP, pruebas y privacidad: pasos en
  `docs/tareas/REABRIR-CUENTAS.md`, «Anti-robots». Ensayo, sección 11, con
  Turnstile y Supabase de mentira: alta, reenvío y entrada con testigos
  distintos, bloqueador que impide cargarlo, y Supabase que lo exige sin
  que la web lo lleve.
- **Fallo real arreglado** gracias al ensayo, que fallaba 1 de cada 3
  vueltas. Al abrir la ventana de cuenta, un temporizador de 60 ms movía el
  cursor a «Correo» aunque ya se estuviera escribiendo en «Contraseña», y la
  clave acababa en el campo del correo (`correo=[ana@ejemplo.testuna clave…]`).
  Ahora no mueve el cursor si ya hay un campo de la ventana activo. El ensayo
  también espera ya a que la lista de la comunidad se refresque.
- **Segundo fallo, del propio anti-robots, arreglado antes de salir**: si se
  cerraba la ventana mientras cargaba Turnstile, la entrada cancelada se
  enviaba igual en segundo plano. `antiRobots`/`conAntiRobots` comprueban
  ahora `operacionCuenta` tras cargar y tras el testigo.
- Pruebas: web 501, `rwadar-app` completo, móvil 126, QR, tools; ensayo en
  el navegador 61/61, repetido varias veces seguidas.

## 5 de octubre de 2026 · Claude (3) · comunidad preparada y app lista para compilar

- **Comunidad** (apagada, `PUBLICACIONES_REMOTAS=false`): `rwadar-app/db/27_comunidad.sql`
  + `27_comunidad_cerrar.sql`. Una publicación por cuenta y día de España
  (`unique (usuario_id, dia)`), 10–500 caracteres, sin enlaces (CHECK), autor
  «Miembro de RWAdar» salvo que elija su nombre, lectura pública solo de
  `id, autor, texto, creada_el`, escritura solo por RPC (`publicar`,
  `mis_publicaciones`, `borrar_mi_publicacion`, `denunciar_publicacion`,
  `moderar_publicacion`, `cola_publicaciones`), tres denuncias la ocultan.
  Prueba `probar-comunidad.mjs` 30/30 (en `npm test`). Web: módulo
  `Comunidad` (`comunidad:inicio/fin`) en Inicio, escucha el evento
  `rwadar:sesion` que lanza `Cuenta.pinta()`. Ensayo en el navegador 48/48.
  Moderación por SQL documentada en `docs/tareas/REABRIR-CUENTAS.md`.
- **App 1.2.0** y flujo manual `.github/workflows/compilar-app.yml` (pruebas →
  EAS → artefacto con SHA-256). Necesita el secreto `EXPO_TOKEN`
  (`rwadar-movil/LEEME.md`, «Compilar desde GitHub»).
- Pruebas: web 407, `rwadar-app` completo, móvil 104, tools y QR.
- **Tu mejora de tarjetas (`mejora-tarjetas-local`) está integrada** en esta
  rama: tarjeta nueva + botón «☆ Guardar», pruebas adaptadas (web 499, móvil
  126). `lib/config-ios-uuid-seguro.js` se conserva con sus pruebas pero se
  quitó de `app.json`: choca con `scripts/parchear-expo-uuidv5.cjs` (mismo
  archivo, huella distinta) y rompería la build de iOS. Hay que elegir uno.

## 5 de octubre de 2026 · Claude (2) · nueva barra: Inicio · Buscar · Academy · Perfil

**Rama:** `claude/zealous-shannon-endwcn` (reiniciada desde `main` tras unir
#4). Petición de Víctor: reorganizar la barra del móvil y dejar los avisos
como «próximamente». No toca producción, Supabase ni EAS.

### Web (móvil; el escritorio no cambia)

- Pestañas `inicio` · `buscar` · `academy` · `cuenta` (rótulo «Perfil»). Con
  JavaScript el móvil abre en Inicio salvo que la URL traiga ancla; sin él se
  ve Buscar (`movilPanelRadar` no lleva `hidden`, como el escritorio).
- **Inicio** (`movilPanelInicio`): presentación, atajos, noticias generadas
  (marcas `<!--noticias:ini-->`), Comunidad «próximamente» (una publicación al
  día por cuenta cuando haya cuentas) y Método/Fuera/3D.
- **Academy** (`movilPanelAcademy`): en el móvil se **mueve** el bloque real
  `.academia-lecciones` de la portada (con ancla para devolverlo en
  escritorio) y se cuenta lo leído con la clave `rwadar.academy.v1`.
- **Perfil** (`movilPanelMas`): tarjeta de cuenta (en pausa), empresas y
  ofertas guardadas, Avisos «llegarán próximamente a la app» con la vía para
  retirar un consentimiento anterior, privacidad, sonido, borrar guardados,
  CSV y contacto. Desaparecen Favoritos, Inversiones y la subvista de Avisos
  (su JS queda inerte: sin esos nodos no hace nada).
- **Favoritos locales**: módulo `Favoritos` (`favoritos-locales:inicio/fin`,
  al principio del JS porque las tarjetas se pintan antes), clave
  `rwadar.favoritos.v1` (nombres de empresa y slugs de oferta). Botón
  «Guardar en favoritos» en la ficha (cuando no hay cuentas) y «☆ Guardar» en
  las tarjetas de oferta; solo visibles en el móvil (`.fav-local`).
- Privacidad actualizada (5/10/2026) y `sitemap.xml`.

### Noticias

Fuente única `rwadar-noticias/noticias.json` → `rwadar-noticias.js` escribe
el bloque de Inicio de la web y `rwadar-movil/lib/noticias-contenido.js`.
`--comprobar` en `test:tools`; `rwadar-publicar.js` bloquea si no está al día;
añadido a `RUTAS_CONTENIDO_APROBADO`. **Ojo:** la noticia «RWAdar Academy ya
está abierta» lleva fecha 5/10; si se publica otro día, cambia la fecha.

### App (necesita versión nueva para llegar a los móviles)

- `Navegacion.js`: Inicio · Buscar · Academy · Perfil (iconos nuevos; insignia
  de guardados en Perfil).
- `componentes/Inicio.js` nuevo. Buscar = selector «Empresas | Ofertas» sobre
  las dos listas de siempre. Academy pasa de modal a pestaña (`onCerrar`
  opcional). `PantallaPerfil` sustituye a «Más», «Siguiendo» y «Avisos»: en
  modo editorial enseña «Avisos · próximamente»; con la capacidad remota
  vuelve a usar `PanelAvisos`.
- Ofertas guardadas en el dispositivo (`ofertasGuardadas`,
  `alternarOfertaGuardada`, clave `…ofertas.guardadas.v1`, borrada con el
  resto) y estrella en `DetalleOferta`.

### Pruebas

Web 406, `rwadar-app` completo, móvil 104, tools, QR y ensayo de cuentas 37.
Capturas reales en Chromium (web móvil y app exportada con react-native-web).

## 5 de octubre de 2026 · Claude · cuentas (fase 1) preparadas, manual, seguridad

**Rama:** `claude/zealous-shannon-endwcn`. **No toca producción:** nada
publicado, nada aplicado en Supabase, sin EAS. Todo lo nuevo queda apagado.

### Qué hay

| Pieza | Dónde |
|---|---|
| Migración de reapertura, fase 1: perfil, vigilancia, baja y fecha de descarga del manual. Opiniones, moderación, dispositivos y push siguen cerrados | `rwadar-app/db/26_reabrir_cuentas.sql` + `_verificar.sql`; marcha atrás = reaplicar 25 |
| Prueba sobre la cadena de producción (01-22, 24, 25, catálogo) | `rwadar-app/probar-reabrir-cuentas.mjs` (36/36), dentro de `npm test` |
| Ensayo E2E en Chromium: la web real con cuentas encendidas en memoria contra un Supabase simulado sobre PGlite + 26 | `rwadar-app/ensayo-cuentas-web.mjs` (37/37; necesita Playwright, no está en `npm test`) |
| Web: interruptores separados `OPINIONES_REMOTAS`, `AVISOS_CORREO_REMOTOS`, `MANUAL_BIENVENIDA` (todos apagados, igual que `SERVICIOS_USUARIO_REMOTOS` y `CORREO_AUTH_E2E`) | `rwadar-site/assets/rwadar-20260820.js` |
| Dos fallos corregidos que solo salían con cuentas abiertas: botón de cuenta del móvil siempre desactivado; botón «Entrar» bloqueado tras «Confirma tu correo» | mismo archivo; pruebas fijas en `probar-web.mjs` |
| Textos de cuenta sin promesas de opiniones mientras estén cerradas (etiqueta del nombre, aviso legal del alta, subtítulo) | `rwadar-site/index.html` |
| Manual de bienvenida de Eric (PDF original, revisión y cómo encenderlo). **Sección 8 promete avisos y guías por correo que no existen; la 6 remite a un checklist que no tenemos** | `docs/manual/` |
| Pasos de Víctor para abrir cuentas (SMTP, Auth, SQL, prueba real) | `docs/tareas/REABRIR-CUENTAS.md` |
| Revisión de seguridad | `docs/seguridad/REVISION-SEGURIDAD-2026-10-05.md` |
| Pasos exactos para crear la clave de Cloudflare | `docs/OPERACION-LANZAMIENTO.md`, «Publicar desde GitHub» |

Academy «ENTREGA_WEB_1_2»: las 9 lecciones son idénticas byte a byte a la
entrega del 2/10 (commit `5cecbb8`); no hay nada nuevo que montar.

### Pruebas

`npm test` por partes en verde: web 405, `rwadar-app` completo (incluida la
nueva), móvil 101, tools y QR. Gitleaks sobre 74 commits: 10 avisos, todos
falsos (detalle en la revisión de seguridad).

### Pendiente (de Víctor)

1. Secreto `CLOUDFLARE_API_TOKEN` en GitHub → Claude publica (la aprobación
   caduca el 7/10).
2. Pasos 1 a 3 de `REABRIR-CUENTAS.md` → Claude enciende cuentas en
   `revision`, Víctor prueba, se reescribe la privacidad y se publica.
3. Eric: corregir la sección 8 del manual y enviar el Checklist de
   Elegibilidad.

---

## 2 de octubre de 2026 · Claude · RWAdar Academy en la web y en la app

**Rama:** `claude/zealous-shannon-endwcn`, commit «feat(academy): …». No toca
producción: ni web publicada, ni Supabase, ni EAS.

Víctor pasó la entrega de Eric (`RWAdar_Academy_ENTREGA_WEB`): 9 lecciones en
Markdown y una especificación. Está montada en la web y en la app.

### Qué hay

| Pieza | Dónde |
|---|---|
| Fuente única: las 9 lecciones tal cual, `academy.json` (qué se publica, niveles, destinos de los botones) y el aviso legal común | `rwadar-academy/` (léete su `LEEME.md`) |
| Generador: valida las lecciones y escribe web + app; `--comprobar` no escribe | `rwadar-academy.js` |
| Web: índice `/academy/` y una página por lección publicada (TL;DR, índice lateral, recuadros, test con explicación, siguiente paso, aviso legal, progreso en `localStorage`) | `rwadar-site/academy/`, `assets/academy-20261002.{css,js}` |
| Portada: bloque de lecciones (entre `<!--academy:ini-->` y `<!--academy:fin-->`), enlace «Academy» en cabecera y pie, ancla `#comparador` | `rwadar-site/index.html` |
| App: pantalla nativa (Más › RWAdar Academy y aviso en el radar), test, progreso en el dispositivo | `rwadar-movil/componentes/Academy.js`, `lib/academy-contenido.js` (generado), `lib/academy-progreso.js` |
| Revisión del contenido y decisiones | `docs/academy/REVISION-CONTENIDO-2026-10-02.md` |

**Publicadas:** lecciones 1–6. **Próximamente:** 7 (sus «cuatro criterios» no
coinciden con el Método), 8 y 9 (calendario de Eric). Evaluador de Viabilidad
y checklist del expediente: «Próximamente», nunca enlace roto.

### Cambios en piezas existentes

- `rwadar-publicacion-segura.js`: `PAGINAS_ACADEMY` (lista cerrada) dentro de
  `ARCHIVOS_PUBLICABLES`, más los dos assets; `rwadar-academy` y
  `rwadar-academy.js` añadidos a `RUTAS_CONTENIDO_APROBADO`.
- `rwadar-publicar.js`: `PAGINAS_HTML` común (CSP estricta y assets con
  huella también en la Academy) y bloqueo si la Academy no está al día o no
  coincide con `PAGINAS_ACADEMY`.
- `rwadar-servir.js`: URL limpias `/academy/…` como en Cloudflare.
- `_headers` (`/academy/*` sin caché), analítica (mide `/academy/…` limpias),
  `sitemap.xml` (solo lo publicado).
- **`privacidad.html`**: dice que el progreso de la Academy se guarda en el
  navegador o en el dispositivo y no se envía. Fecha de revisión → 2/10/2026.
  En la app, «Borrar datos del dispositivo» también borra el progreso.
- Pruebas antiguas ajustadas: la «videoteca» ya no existe, y dos pruebas de
  `rwadar-app` contaban apariciones de nombres de página en el publicador.

### Pruebas

- `npm test` completo en verde: web 394 (48 nuevas de la Academy), app 101
  (8 nuevas, una pinta las 6 lecciones con react-native-web) y todas las de
  `rwadar-app`.
- Chromium real, web en escritorio y móvil: sin desbordamiento horizontal,
  test corrige y abre las explicaciones, «Marcar como leída» sobrevive a
  recargar y se ve en el índice, sin errores de consola.
- App exportada a web (copia aislada con datos locales, sin Supabase):
  índice, lección, test, tabla con desplazamiento, aviso reforzado, botón al
  radar y progreso tras recargar.

### Cierre del 2 de octubre (petición de Víctor)

- **Lección 7 publicada** (7 de 9). `PAGINAS_ACADEMY` ya la incluye.
- **Revisión legal:** Víctor la ha verificado; las nueve lecciones dicen
  2 de octubre de 2026.
- **Lectura:** letra mayor, más interlineado y gris más claro en web y app;
  cursiva real de Geist en la app.
- **Tipografía de toda la web arreglada:** la Geist incrustada en
  `rwadar-20260820.css` era solo el recorte «latin-ext» (sin a-z), así que la
  web se veía con la letra del sistema. Ahora es el paquete oficial `geist`
  1.7.2 recortado a latín (22 kB sans, 16 kB mono; la Academy lleva además
  la cursiva). Comprobado en Chromium: el 100 % del texto sale en Geist.
- **Aprobación registrada** en `estado.json` (commit propio) y **unido a
  `main`** con merge commit (PR #1); la auditoría sobre `main` da «LISTO PARA
  CORTE FINAL». Desde la nube de Claude no hay red ni credenciales de
  Cloudflare: la subida la hace Víctor o Codex en local (`git pull`,
  `--preview`, comprobar y `--produccion`).

### Pendiente

1. ~~Decidir con Eric los criterios y las funciones prometidas.~~ **Hecho**
   por petición de Víctor (tercer commit): las lecciones usan los cuatro
   criterios del Método y anuncian como «próximamente» el Evaluador, los
   filtros por categoría y por supervisión y la checklist. Detalle en
   `docs/academy/REVISION-CONTENIDO-2026-10-02.md`. La lección 7 ya se
   podría publicar (solo espera al calendario).
2. **Para publicar la web (con permiso de Víctor):** registrar la aprobación
   en `estado.json` (la auditoría dirá que el contenido cambió), `--preview`,
   comprobar `/academy/`, `--produccion`.
3. **App:** entra en la próxima compilación; subir versión al compilar.
4. ~~Cabecera compacta de la PWA móvil que solapaba «RWAdar» con el título.~~
   **Arreglado** en un segundo commit: los laterales de la rejilla ya no
   pueden medir menos que la marca y los botones, el título es lo único que
   cede (con «…»), la marca se aprieta un poco por debajo de 350 px y el
   título de la subvista pasa a «Academy». Medido en 320, 360, 390 y 430 px
   en Buscar, Academy, Método, Fuera, Favoritos, Inversiones y Mi cuenta:
   ningún solape. En la app nativa, «PRÓXIMAMENTE» ya no se parte en dos
   líneas a 320 px y las tarjetas anterior/siguiente dicen «← LECCIÓN 1».

---

## 1 de octubre de 2026 · Claude (2) · catálogo siempre disponible

Víctor se quedó sin créditos de Codex y pidió a Claude que siguiera. Regla
nueva de Víctor: **el catálogo tiene que estar siempre disponible para el
público, salvo que él diga lo contrario.** He hecho la tarea
[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md) con esa
regla ampliada.

### Qué hace ahora

| Situación | Antes | Ahora |
|---|---|---|
| La revisión vence (7 días) | Web y app vacías | Se ve la última copia completa con el aviso «Revisión pendiente» |
| Cifras de una oferta vencidas | Ocultas | Ocultas (sin cambios) |
| Supabase responde vacío o incompleto | Web y app vacías | Se conserva la última copia completa con el aviso «No hemos podido comprobar…» |
| Revisión incompleta, futura o mezclada | No se publica | No se publica (sin cambios); nunca se vuelve a una anterior |
| Víctor quiere quitar el catálogo | No había forma clara | `public.catalogo_publicacion.retirado = true` (ver `RUNBOOK.md`) |

### Qué he cambiado

- **Base:** `rwadar-app/supabase/migrations/20261001150000_catalogo_siempre_disponible.sql`.
  - Políticas nuevas `*_de_revision_publicada_v2`: se puede leer la revisión
    del puntero `publicacion_v2` aunque haya vencido.
  - `revision_publicable_v2`: igual que antes, salvo que ya no exige
    vigencia.
  - Tabla `public.catalogo_publicacion`: es la orden expresa. Un disparador la
    activa al retirar la revisión publicada y la desactiva al aprobar otra.
  - **Las vistas públicas no cambian de columnas:** la web y el APK de hoy
    rechazan un lote caducado igual que antes.
- **Contrato compartido:** `validarLotePublicoV2(..., { permitirCaducado })`
  en `rwadar-movil/lib/contrato-catalogo.js`. Por defecto se comporta como
  antes; con la opción devuelve `caducado`.
- **Web** (`rwadar-site/assets/rwadar-20260820.js`, `index.html`, `.css`):
  - La caducidad ya no vacía nada. `alDia` consulta además
    `/catalogo_publicacion` y solo `retirado === true` oculta el catálogo.
  - Una vista vacía, incompleta o un lote fuera de contrato conservan la copia
    embebida o la descargada antes, con aviso.
  - Avisos nuevos: `#avisoCatalogoRadar` y `#avisoCatalogoOfertas`. El pie y
    el contador dicen «pendiente de renovar».
- **App** (`lib/catalogo-remoto.js`, `App.js`):
  - Al vencer se recarga en lugar de borrar.
  - Ya caducado, se refresca una vez al día (`programarRevisionDiaria`) para
    ocultar las cifras que vayan venciendo.
  - Solo la orden expresa borra la caché.
- **Publicación:** `sincronizar.js` admite un lote V2 caducado y avisa por
  pantalla. Así se puede publicar aunque la revisión haya vencido.

### Pruebas

- Nueva: `rwadar-app/probar-catalogo-siempre-disponible.mjs` → 29/29 contra
  PGlite. Cubre vigente, caducada, nueva revisión, incompleta, futura,
  retirada, reaprobación, orden manual y permisos.
- Web: 346/346. Las pruebas de caducidad ahora exigen que todo siga visible
  con aviso. Hay pruebas nuevas de la orden expresa y de una base antigua sin
  la tabla. Las 4 consultas anónimas están vigiladas.
- App: 93/93. Las pruebas de «retira la caché» ahora exigen que la conserve,
  y hay pruebas nuevas de la orden expresa, de una base antigua y de la
  revisión diaria.
- `npm test` completo en verde.
- Navegador real (Chromium) con la fecha fijada en el 10/10/2026 y Supabase
  caído: 26 plataformas, 49 referencias y el aviso visible, en escritorio y
  en móvil.

### Para ponerlo en producción (Víctor o Codex, con permiso de Víctor)

1. **Primero la migración** en el editor SQL de Supabase. Después del 5/10 es
   imprescindible: sin ella, Supabase devuelve las vistas vacías y la
   sincronización no puede publicar.
2. Registrar la aprobación (commit y huellas en `estado.json`, paso 2 de
   `docs/OPERACION-LANZAMIENTO.md`). La compuerta lo pide porque cambia
   `rwadar-site`, `sincronizar.js` y `contrato-catalogo.js`.
3. `--preview`, comprobar, y `--produccion`.
4. App: entra en la próxima compilación (no hay OTA).

---

## 1 de octubre de 2026 · Claude

**Rama:** `claude/magical-hamilton-aiddjs`, creada encima de
`codex/relanzamiento-publico` (último commit de Codex: `59ecbe3`). No toca nada
de producción: ni web publicada, ni Supabase, ni EAS.

### Qué he hecho

| Commit | Qué cambia | Qué tienes que saber |
|---|---|---|
| `fix(movil): parchea … uuidv5 en iOS` | `rwadar-movil/scripts/parchear-expo-uuidv5.cjs` + `postinstall` en `rwadar-movil/package.json` + `.easignore` + paso en `ci.yml` | Corrige el fallo de expo-modules-core (copiaba 20 bytes en un UUID de 16; sigue sin corregir en Expo 58.0.10). Se aplica solo en cada `npm install` o `npm ci`, también en EAS. **Si actualizas Expo** y el script se para, lee su mensaje: o el archivo cambió y hay que revisar, o Expo ya lo arregló y se puede borrar el script. Instalar con `--ignore-scripts` no aplica el parche: ejecuta luego `npm --prefix rwadar-movil run postinstall`. |
| `feat(datos): copia de seguridad cifrada diaria` | `.github/workflows/copia-seguridad.yml`, `rwadar-app/copia-seguridad.sh`, `docs/COPIAS-DE-SEGURIDAD.md` | `pg_dump` de `auth`, `public` y `rwadar_catalogo`, cifrado con gpg y comprobado. Necesita los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` y estar en `main`. **Antes de actualizar Postgres, una copia comprobada.** |
| `docs: pruebas de ataque … y tarea del catálogo` | `docs/seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`, `docs/tareas/CODEX-catalogo-no-desaparece.md` | Todos los ataques probados en local están bloqueados. La tarea del catálogo es **tuya** (ver abajo). |
| `docs: documentación en lenguaje llano …` | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/INTERNO.md`, `docs/RUNBOOK.md`, `docs/LEEME.md` nuevo | Ya no dicen que RWAdar está apagado. Las versiones anteriores están en `docs/archive/2026-09/`. Los informes con fecha **no se han movido**: los cita `rwadar-app/data/relanzamiento/estado.json`. En `CATALOGO-V2-2026-09-30.md` cambié «API35, run…» por «API 35, ejecución…» porque gitleaks lo confundía con una clave. |

### Autoría de commits (importante)

Desde ahora **firma como Codex**: lo tienes en `AGENTS.md` → «Autoría de los
commits». Los commits del 28 al 30 de septiembre salieron como «Claude» porque
la carpeta local tenía ese nombre configurado desde agosto. No cambies el
`git config` de la carpeta: usa `git -c user.name=… -c user.email=…` en cada
commit.

### Pruebas que he pasado

- Web: `npm run test:web` → 341/341.
- Base de datos: las 26 baterías de `npm --prefix rwadar-app test`, todas en
  verde.
- App: `npm --prefix rwadar-movil test` → 89/89 (5 nuevas del parche).
- Compuerta: `npm --prefix rwadar-app run auditar:relanzamiento` → «LISTO PARA
  CORTE FINAL» (los cambios de hoy no tocan rutas aprobadas).
- gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` → 0 hallazgos en archivos
  versionados.

### Pendiente para Codex

1. **[`CODEX-catalogo-no-desaparece.md`](CODEX-catalogo-no-desaparece.md)**:
   que el catálogo caducado se siga viendo con aviso y sin cifras vencidas.
   Urgente: el lote vence al terminar el 5 de octubre.
2. Al siguiente build de iOS: comprobar en el simulador que la app abre y
   funciona con el parche de Expo.

### Pendiente para Víctor

1. Renovar el catálogo antes del 5 de octubre (o que Codex termine la tarea 1
   y la publique antes).
2. Crear los dos secretos de la copia en GitHub y lanzar la primera copia
   (`docs/COPIAS-DE-SEGURIDAD.md`, parte 1).
3. ~~Unir esta rama a `main`.~~ Hecho el 1 de octubre: `main` incluye todo.
4. En la carpeta local, una vez: `git config user.name "Victor Jorques"` y tu
   correo de GitHub.
5. Si quieres que Claude revise la web real: permitir en la red del entorno
   `rwadar.pages.dev` y `exgpmjpaaebyoolpwced.supabase.co`.

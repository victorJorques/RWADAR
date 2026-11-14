# RWAdar · cómo está el proyecto

*Actualizado el 7 de noviembre de 2026.* Si solo vas a leer un documento, que
sea este. Lo que hizo cada sesión, con sus pruebas, está en
[`tareas/PARA-CODEX.md`](tareas/PARA-CODEX.md). El detalle técnico antiguo está
en los informes con fecha y en
[`archive/2026-09/INTERNO-detalle-2026-09-30.md`](archive/2026-09/INTERNO-detalle-2026-09-30.md).

> **El catálogo publicado vale hasta el jueves 12 de noviembre de 2026
> incluido** (último día con cifras). Es la revisión del 05/11 (entrega
> `2026-11-05.2`). Desde el viernes 13/11 a las 00:00 UTC (01:00 en España) no
> desaparece: se sigue viendo completo, con un aviso y sin las cifras vencidas.
> Para renovarlo, Víctor pide «haz la investigación» (ver «Lo que falta», punto 1).

---

## Qué es RWAdar

Un **radar de plataformas de tokenización** de activos reales: inmuebles,
fondos del Tesoro, materias primas, crédito… Dice cuáles existen, cuáles están
supervisadas y cuáles se han descartado, **siempre con la fuente al lado**.

RWAdar informa: no vende, no invierte el dinero de nadie y no cobra a quien
consulta. Entrar en el radar es gratis para las plataformas.

---

## Qué está funcionando hoy

| | Estado |
|---|---|
| **Web** | Publicada en **https://rwadar.pages.dev** (Cloudflare Pages, con un servidor web propio que gestiona la sesión). Se publica desde `main` con el flujo de GitHub «Publicar web», primero en revisión y después en producción. Última publicación: **10/11/2026** (catálogo del 10/11 y, en Inicio, «La tokenización en el mundo» y «Noticias del sector»). |
| **Catálogo** | Investigado y publicado el **13/11/2026** (revisión `434217eb`): **22 ofertas** (8 principales, 13 de reventa y 1 en camino) y **25 plataformas** en el radar (5 descartadas). Vale hasta el **20/11/2026** incluido; desde el 21/11 (00:00 UTC) se ve con aviso y sin cifras. Las cifras se ven 7 días desde su comprobación. Ver [`INVESTIGACION-CATALOGO-2026-11-13.md`](INVESTIGACION-CATALOGO-2026-11-13.md). Las fuentes que bloquean se leen por rutas legítimas verificadas: [`.claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md`](../.claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md). |
| **Cuentas** | Abiertas y gratis. En la web, la cuenta confirmada hace falta para las funciones personales (lista de seguimiento, «Mis inversiones») y para leer las lecciones de la Academy; el resto se consulta sin registro. La app pide cuenta para todo desde la 1.4.1. El fallo que devolvía a la pantalla de acceso quedó resuelto el 29/10. El servidor web limita los intentos por IP; el CAPTCHA (Turnstile) está preparado y apagado. **Preparado el 12/11, sin publicar:** la sesión de la web ya no se pierde a la hora: el servidor guarda también el código de renovación en una segunda cookie y pide un pase nuevo solo. Con la casilla «Mantener la sesión iniciada en este dispositivo» (sale sin marcar, al entrar y al confirmar el correo) dura 30 días desde el último uso, aunque se cierre la web; sin ella, hasta cerrar el navegador. Riesgo aceptado: Supabase limita las renovaciones por IP y todas salen de Cloudflare; un abuso podría agotar ese cupo un rato (no saca a nadie de su cuenta). |
| **Correo de las cuentas** | La confirmación y la recuperación de contraseña salen hoy por un **Gmail sin contrato de encargo**: es el riesgo legal más alto que queda. Se pasa a Lettermint en la ronda 2 del [plan](tareas/PLAN-CEO-2026-11-06.md). |
| **App Android** | **[Versión 1.4.2](https://github.com/victorJorques/RWAdar-downloads/releases/tag/v1.4.2)** publicada el **06/11/2026** (código 24). Lleva Firebase para las notificaciones del móvil, sin arranque automático: en el emulador, al abrirla, no hubo ninguna conexión a Firebase. Hasta que se enciendan los avisos funciona igual que la 1.4.1. Las actualizaciones automáticas (OTA) van ya a la 1.4.2; la 1.4.1 sigue funcionando y avisa de la versión nueva. No está en Google Play. Pendiente menor: unos textos de Lettermint de la app (ocultos mientras el correo esté apagado) irán en la próxima OTA. |
| **Inicio** | Rehecho el **10/11/2026** en la web y en la app, a petición de Víctor («mucho lío»): bloques cortos sin repeticiones (cabecera con tres cifras, un carrusel de ofertas, «El mercado hoy», 3 noticias con foto, «Aprende» y una línea legal) y el detalle en secciones propias: **/mercado/** (la tokenización por tipo, con datos de CoinGecko citados y una foto diaria que guarda el flujo «Tokenización diaria» en la rama `datos-tokenizacion`), **/noticias/** (8 noticias verificadas, con fotos editoriales generadas con IA, que se renuevan en cada investigación) y **/aprende/** (los seis capítulos y la Academy). En el móvil, Inicio pasó de unos 10.300 px a unos 3.400. Las apps ya instaladas leen `/datos/noticias.json`; las nuevas, `/datos/noticias-v2.json`. |
| **Mercado y noticias** | Publicado el **11/11/2026** en la web y el **12/11/2026** (00:27 UTC) en la app, a petición de Víctor, al estilo de una app de bolsa: **/mercado/** une el mercado y las noticias (cifra grande, cambio del periodo, pestañas 1 S · 1 M · 3 M · 6 M · 2026 · 1 A —en inglés, YTD—, gráfico de área de un año con cruz, datos clave, tipos y, debajo, las noticias); **/noticias/** y **/noticias/#id** llevan allí. En Inicio, un solo bloque con una tarjeta tipo cotización y 3 noticias, y «Mercado» en la cabecera de escritorio (desde 1280 px; por debajo, la cabecera se partía en dos filas). La serie es la suma diaria de los mayores tokens de CoinGecko con historia completa (hoy 29 de los 40 mayores, un 86 % del total de la categoría); la semilla está en `rwadar-site/datos/tokenizacion-serie.json` y el flujo «Tokenización diaria» la rehará cada día en la rama `datos-tokenizacion` (13 s entre llamadas, unos 9 minutos; el paso tiene su propio límite de 14 minutos para no perder la foto del día; si fallan tokens que pesan más del 1 %, se conserva la serie anterior). Igual en la app. **La cifra grande es el último punto de la serie** (la misma que el final de la línea y que la cruz en el último día; nunca supera el máximo del periodo); el total de la categoría de CoinGecko, con todos sus tokens, va en gris bajo el gráfico con su hora y en los datos clave con su nombre. La historia de cada token se pide con `days=365`: sin clave, CoinGecko responde 401 a `days=366`. El «Cambio en 24 h» sale de la serie (CoinGecko daba +124 % el 11/11 con el mercado plano: un cambio de un ±25 % o más ni se enseña ni se guarda). Bajo el cambio se dice que mide el tamaño del mercado y no lo que habría ganado una inversión; si en el periodo entran tokens nuevos, también («de 16 a 29 tokens: parte de la subida son tokens nuevos»). **Al publicar: primero la web y después la OTA** (la app lee `https://rwadar.pages.dev/datos/tokenizacion-serie.json`). Sin JavaScript, `/noticias/#id` lleva a `/mercado/#noticias` (el refresco pierde el `#id`); con JavaScript abre la noticia. |
| **Calcula tus números** | Publicado el **11/11/2026** en la web y el **12/11/2026** (00:27 UTC) en la app, por encargo («que pongan ellos los números, no que sea sí o sí los 300.000»): un bloque propio en Inicio, entre «Mercado y noticias» y Aprende, en la web y en la app. La persona escribe lo que invierte, la rentabilidad y los años (de partida, un ejemplo editable: 1.000 €, 4 %, 5 años), elige si cobra lo que gana o lo reinvierte y, si quiere, afina comisiones, impuestos (19 % de partida; en España, salvo País Vasco y Navarra, el ahorro paga un 19 % hasta 6.000 € al año y más por encima, hasta el 30 %), el valor del activo y el precio de cada trozo. Arriba ve lo que cobraría o tendría, con la ganancia neta, un gráfico por año y la cuenta paso a paso. Puede usar la rentabilidad publicada de una oferta vigente del catálogo, con su fecha. El explicador «¿Qué es tokenizar?» ya deja cambiar el valor del local y el precio de cada trozo, y lleva a la calculadora. Las cuentas son las mismas en la web y en la app (un solo motor). Revisada el mismo día por tres revisores (cuentas, un inversor sin formación financiera y diseño/accesibilidad) y corregida: la nota de impuestos ya no promete de más, el detalle dice cuánto se paga de impuestos y el lector de pantalla oye el resultado una vez, al dejar de escribir. |
| **Novedades de RWAdar** | **Publicado el 12/11/2026 en la web (n.º 83) y en la app (OTA n.º 26)** (encargo: «que salga al abrir … un texto informativo muy fácil de leer con las novedades y si clickan que salga en detalle»). Al abrir Inicio, en la web y en la app, una ventana con 5 puntos de una línea (avisos en el móvil, el número de avisos sin leer, la sesión de 30 días de la web, el correo nuevo y «Calcula tus números») y dos botones: «Ver en detalle» (en la web, la página /novedades-rwadar/; en la app, una pantalla; las dos con el camino a Perfil › Avisos) y «Entendido». Sale una vez por versión y espera si hay otra cosa abierta; se vuelve a ver desde Perfil (y en la web, desde la cuenta y el pie). Una sola fuente para las dos: `rwadar-site/datos/novedades-producto.json`, con su inglés; la app lo descarga de la web y lleva una copia igual (`node rwadar-novedades-producto.js`) para verlo sin red. Los textos valen para la web y la app (lo que solo es de la web lo dice). El primer aviso a quien tiene los avisos activados (anuncio 1, «Novedades de RWAdar», 12/11 23:23 UTC) enlaza a /novedades-rwadar/; en la app abre la pantalla de detalle. Cómo se cambia: [`tareas/NOVEDADES-RWADAR-2026-11-12.md`](tareas/NOVEDADES-RWADAR-2026-11-12.md). |
| **Noticias automáticas** | **Preparadas el 14/11/2026, SIN ENCENDER** (decisión de la dirección del 13/11: «cada mañana una sesión programada las escribe y las verifica; si el verificador no encuentra problemas, se publican solas; si encuentra alguno, no se publica nada y te aviso»). Cada mañana a las 08:32 una sesión nueva sigue la skill [`noticias-automaticas`](../.claude/skills/noticias-automaticas/SKILL.md): mira si puede trabajar (cerrojo: ciclo manual, PR ajenos, `main` igual a producción archivo a archivo, sello revisado de menos de 7 días), lee las fuentes con un programa, un editor escribe (3 titulares por noticia y la foto de la biblioteca que mejor encaja, sin repetir), un programa comprueba 16 reglas y un verificador independiente vuelve a abrir cada fuente. Solo si todo da bien: un PR con las noticias y su sello (unido con «merge»), la CI, «Publicar web» revisión y producción y comprobación en vivo. Cualquier fallo: no se publica nada y llega un aviso. La CI para el PR de la mañana si lleva algo más que noticias. Gastaría unos 11-13 min de Actions al día (330-390 al mes); con un trabajo «Noticias» propio en la CI, aún sin construir, 7-8. Se enciende con [`ORDEN-TAREA.md`](../.claude/skills/noticias-automaticas/ORDEN-TAREA.md), tras enseñárselo a Víctor. Pausa: `"activo": false` en su `config.json`, o la rama `claude/cerrojo-ciclo-<fecha>` para un día. |
| **App iPhone** | No hay. Solo se compiló para el simulador y no hay cuenta de Apple Developer. En iPhone, RWAdar es la web (también añadida a la pantalla de inicio). |
| **RWAdar Academy** | Las **9 lecciones** de Eric, publicadas desde el 06/11/2026. En la web, cada lección pide una cuenta gratis; el índice y el tutorial 3D siguen abiertos. **Preparado el 08/11, sin publicar:** sin sesión, el índice y el bloque de lecciones de la portada enseñan las lecciones difuminadas y con un candado, que se abre al entrar (ver [`rwadar-academy/LEEME.md`](../rwadar-academy/LEEME.md)). Eric dio su visto bueno y su licencia escrita el 06/11 (la guarda Víctor). La revisión legal de las lecciones vale hasta el **02/04/2027**. |
| **Avisos a registrados** | **Notificaciones encendidas desde el 12/11/2026 (21:33 UTC).** Base 30-34 aplicada; `push_habilitado` = true, reloj `rwadar-novedades` cada 5 min. Llegan a quien da el permiso en Perfil › Avisos y activa «Notificaciones en este móvil»: Android 1.4.2 por Expo y web (iPhone con la web en la pantalla de inicio, Android) por Web Push desde Supabase y Cloudflare. Prueba de punta a punta aceptada por Apple (201). Correo apagado: espera al dominio y a Lettermint. La casilla del alta sigue oculta. Anuncios: «Avisar novedad». |
| **Copias de seguridad** | Cada noche, cifradas, guardadas 35 días en GitHub, y otra antes de cada cambio en la base. Supabase gratuito no hace copias: estas son las únicas. Ver [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md). |
| **Legal** | Aviso legal, condiciones, privacidad (06/11/2026) y transparencia comercial publicados. Registro de actividades, contratos de encargo y qué hacer ante una brecha, en [`legal/`](legal/): ver «Lo que falta», punto 3. |
| **Analítica** | Cloudflare Web Analytics, sin cookies. |
| **Google y RSS** | Fichas, sitemap y RSS se ven sin sesión. Las lecciones de la Academy van con `noindex` y fuera del sitemap. |
| **Panel de control** | El panel de los socios sigue en línea en <https://rwadar-panel.victorjorquesgranero.workers.dev> (se entra con enlace personal; sin él responde 401, comprobado el 07/11). Su código está en la rama `claude/panel-control`, **no en `main`**. |

**Investigación del catálogo: inicio manual.** Solo empieza cuando Víctor
pulsa **Ejecutar** o pide **«haz la investigación»**. Esa orden autoriza el
ciclo completo de ese día (aplicar en Supabase, publicar la web y enviar la
OTA si pasan las pruebas y la revisión independiente), y se puede repetir
varias veces el mismo día. No hay programación automática ni cola pública «en
investigación». Procedimiento:
[`tareas/CICLO-DIARIO-CATALOGO.md`](tareas/CICLO-DIARIO-CATALOGO.md) y la
skill `investigacion-catalogo`.

**En pausa:** opiniones y comunidad. **Desactivado:** publicidad, comisiones y
cobros (hay una cuenta de AdMob con dos fichas de prueba, sin conectar a la
app). **Sin publicar:** el vídeo promocional del 28/10, pendiente de valoración
([detalle](VERIFICACION-ANUNCIO-DESCUBRE-2026-10-28.md)).

---

## Lo que falta, por orden

1. **Renovar el catálogo antes del 17 de noviembre.** Con la orden de Víctor,
   cualquier día. Lo que conviene mirar:
   - Hausera: preventa de Alicante 3 el **18/11** y suscripción desde el
     **25/11**; su inscripción en la CNMV (ERIR de Ursus-3).
   - Pagarés tokenizados de Prosegur Cash (inscritos en la CNMV el 06/11),
     Securitize Stocks y los bonos digitales de Profitus: si publican
     condiciones para particulares en España, estudiarlos como candidatas.
   - Kraken xStocks: si el emisor publica condiciones finales con España, se
     quita el aviso.
   - Spiko Smart Cash Euro: si la CNMV, la AMF o Aldana Capital confirman su
     alta en España, se quita el primer aviso (si lo niegan, se retira).
   - Bono Valorix (Bit2Me STX) y CANDO1 (Token City), cuando publiquen su
     documento de emisión.

   Ver [`RUNBOOK.md`](RUNBOOK.md#catálogo).
2. **Encender los avisos y quitar el Gmail**, en tres rondas
   ([plan](tareas/PLAN-CEO-2026-11-06.md); pasos en el
   [contrato de avisos](tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md),
   «Activación»):
   - **Ronda 1, Víctor:** comprar el dominio (recomendado `rwadar.app` en
     Cloudflare: unos 8 $ el primer año y unos 14 $ los siguientes; el precio
     exacto sale al pagar), crear la cuenta de Lettermint y **pedir su
     verificación** (borrador de respuestas en
     [`tareas/LETTERMINT-VERIFICACION-RESPUESTAS.md`](tareas/LETTERMINT-VERIFICACION-RESPUESTAS.md)),
     dos tokens (uno para la base y otro para el SMTP de Supabase) y GitHub
     Team.
   - **Ronda 2, Víctor, solo con Lettermint ya verificado:** plantillas y SMTP
     de Supabase Auth. Hasta que Lettermint apruebe la cuenta, solo deja
     enviar a los miembros del equipo.
   - **Ronda 3:** el push, cuando haya un Android físico para probarlo (Víctor
     usa iPhone).

   Ojo con el plan gratis de Lettermint: **300 correos al mes en total**, que
   comparten las confirmaciones de cuenta, las recuperaciones, las
   bienvenidas y los anuncios. Su enlace de baja de los anuncios
   probablemente no se puede quitar en el plan gratis, así que sus bajas se
   pasan a RWAdar (a mano o con la sincronización automática, preparada el
   07/11 y apagada).
3. **Legal pendiente** (detalle en el
   [registro de actividades](legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md),
   apartado 7):
   - **GitHub sin contrato de encargo:** decidido pasar a una organización con
     GitHub Team (4 $ al mes) y firmar su «Customer Agreement». Lo hace Víctor
     ([pasos](legal/encargados/README.md#github--hueco)). Desde el 12/11 es
     condición para enviar las notificaciones de la web a todos, salvo que ese
     envío salga de GitHub.
   - **Gmail sin contrato:** se quita en la ronda 2 (punto 2).
   - Decidir si Eric Almiñana y Samuel Rodriguez son corresponsables en el
     sentido del RGPD (hoy la privacidad solo nombra a Víctor).
   - Plazos que faltan (registros de proveedores, analítica, buzones, altas
     sin confirmar, datos en pausa) y nombrar a GitHub en la privacidad como
     depósito de las copias.
   - Ya resuelto el 07/11: Netlify y Proton Mail tienen contrato de encargo
     sin firmar nada; no hace falta delegado de protección de datos; Apple no
     aplica; la protección de contraseñas filtradas de Supabase no está en el
     plan gratuito. Si hay una brecha:
     [`legal/BRECHAS-DE-DATOS.md`](legal/BRECHAS-DE-DATOS.md).
4. **Minutos de GitHub Actions.** El plan gratuito da 2.000 al mes en el
   repositorio privado (https://github.com/pricing, consultado el 07/11). Del
   01 al 07/11 se gastaron unos 790, sobre todo en las pruebas (`ci.yml`), que
   corrían en cada PR y otra vez al unir a `main`, también cuando solo cambiaba
   la documentación (recuento del 07/11; **verificar** en GitHub › Settings ›
   Billing). A ese ritmo se acabarían hacia la mitad del mes. El 07/11 se
   ajusta `ci.yml` para gastar menos (ver el traspaso de ese día en
   [`tareas/PARA-CODEX.md`](tareas/PARA-CODEX.md)). GitHub Team sube el cupo a
   3.000. El 13/11 `ci.yml` reparte la batería en trabajos a la vez (cinco
   partes de batería y la app móvil; de unos 4 min a cerca de 1 min 30 s por
   PR, estimado) y el PR que solo cambia el sello ya no la corre entera (unos
   45 s). GitHub cobra cada trabajo por minutos enteros: un PR con código pasa
   de unos 6 minutos facturados a unos 8 (cada trabajo queda por debajo del
   minuto; el que lo pase en un runner lento cuenta 2, así que hasta unos 14),
   y el del sello, de 6 a 3. Un ciclo (catálogo, sincronización y sello) pasa
   de unos 18 a unos 19 (hasta 31 en el peor caso). Mirar los minutos reales
   la primera semana en Settings › Billing. Las noticias automáticas (sin
   encender) gastarían unos 11-13 al día (330-390 al mes); con un trabajo
   «Noticias» propio en la CI, aún sin construir, 7-8 (210-240). Un día
   frenado antes del PR, 0. Sus pruebas no van en el trabajo «Sello» (usan
   un sello fijo), así que el PR de sello sigue bajo el minuto.
5. **Actualizar Postgres.** Antes, descargar una copia y abrirla una vez, como
   explica [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
6. **Node.js del PC.** GitHub y EAS ya usan la versión corregida (22.23.4). En
   el PC, `node rwadar-node-seguro.js` dice si la que hay vale; el 30/10 Víctor
   lanzó su actualización y falta confirmarla con `node --version`.
7. **Cuentas, lo que queda por probar de verdad:** el cambio de contraseña de
   recuperación y la entrada posterior con credenciales reales, y la app en un
   teléfono físico. No presentarlos como hechos. Plan:
   [`tareas/CUENTAS-WEB-MOVIL-2026-10-11.md`](tareas/CUENTAS-WEB-MOVIL-2026-10-11.md).
8. **Dependencias:** la auditoría de paquetes **no está limpia** (consulta del
   22/10: 21 avisos en la app y uno en la herramienta de imágenes). Corregirlos
   con versiones compatibles antes de otra compilación nativa
   ([informe](VERIFICACION-DEPENDENCIAS-ANDROID-2026-10-22.md)).
9. **Tiendas.** Apple y Google tienen cada uno una consulta de soporte
   pendiente sobre el alta como persona física. Hasta que respondan, no se paga
   ni se rellena nada. El paquete para Google Play ya está preparado
   ([`ENTREGA-TIENDAS-Y-ANUNCIOS.md`](ENTREGA-TIENDAS-Y-ANUNCIOS.md)).
10. **iPhone:** falta probar la app en un simulador o un iPhone de verdad antes
    de enviarla, y la cuenta de Apple Developer.
11. **Ingresos:** decidir con un abogado cómo se puede cobrar a las
    plataformas. El veredicto editorial no se vende nunca.

---

## Fechas que conviene tener a mano

| Cuándo | Qué |
|---|---|
| **11 de noviembre de 2026** | Hausera anuncia la oferta pública de Alicante 2 |
| **12 de noviembre de 2026** | **Último día con cifras de la revisión del catálogo del 05/11.** Desde el 13/11 a las 00:00 UTC (01:00 en España) se conserva completa, con aviso y sin cifras vencidas |
| Cada noche, 02:43 UTC | Copia de seguridad cifrada (GitHub Actions), guardada 35 días |
| Cada noche, 03:17 UTC | Limpieza de dispositivos inactivos de más de 180 días (pg_cron en Supabase, versiones anteriores) |
| Cada noche, 04:41 UTC | Limpieza de los avisos a registrados, `rwadar-novedades-limpieza` (pg_cron en Supabase, desde el 06/11/2026; corre aunque los avisos estén apagados) |
| 2 de abril de 2027 | Hasta aquí vale la revisión legal de las lecciones de la Academy |
| 22 de agosto de 2027 | Caduca `/.well-known/security.txt`: renovar la fecha |
| Antes del 6 de noviembre de 2027 | Revisión anual del registro de actividades de tratamiento |

---

## Quién hace qué

| | |
|---|---|
| **Víctor** (titular) | Decide; cuentas de proveedores y tiendas, pagos, contratos y todo lo que exija identidad. Solo él autoriza publicar o tocar la base en línea. Es el responsable del tratamiento de datos. |
| **Eric Almiñana** | Autor de las lecciones de la Academy. Con Samuel y Víctor, gestiona los reportes de seguridad ([`../SECURITY.md`](../SECURITY.md)). |
| **Samuel Rodriguez** | Gestiona con Eric y Víctor los reportes de seguridad. Si Eric y él son corresponsables en el sentido del RGPD está por decidir (registro de actividades, apartado 1). |
| **Codex (ChatGPT)** | Integración técnica, configuración, pruebas y publicación autorizada de web y app; también trabajo técnico de catálogo y tiendas. |
| **Claude** | Seguridad, copias de seguridad, revisiones, legal y documentación; también ciclos del catálogo y publicación autorizada. |

Cada herramienta firma sus commits con su propio nombre (ver
[`../AGENTS.md`](../AGENTS.md)). Lo que hace una queda anotado para la otra en
[`tareas/PARA-CODEX.md`](tareas/PARA-CODEX.md).

---

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `rwadar-site/` | La web: lo que se edita |
| `rwadar-acceso/` | El servidor web de la sesión y de la Academy con cuenta (`servidor.mjs`); `compilar.cjs` lo convierte en el `_worker.js` que se publica |
| `rwadar-academy/` | Las lecciones de la Academy en Markdown; `node rwadar-academy.js` genera la web y la app |
| `rwadar-noticias/` | Las noticias de Inicio (web y app) |
| `rwadar-publicado/` | La web lista para subir. Se genera sola: no se edita |
| `rwadar-app/` | Base de datos: migraciones, importadores, plantillas de correo y pruebas |
| `rwadar-movil/` | App de Android e iPhone (Expo) |
| `rwadar-qr/` | Código QR de la tarjeta |
| `rwadar-limpieza/` | Página que desinstala la app web antigua de `rwadar.netlify.app`: se conserva |
| `rwadar-version-codex/` | Copia rescatada de la versión de agosto: no se edita |
| `docs/` | Esta documentación; lo legal, en `docs/legal/` |

El panel de control (`rwadar-panel/`) no está en `main`: está en la rama
`claude/panel-control`.

**Documentos para el día a día:**

- [`RUNBOOK.md`](RUNBOOK.md): cómo trabajar en local y qué comandos son
  peligrosos.
- [`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md): cómo se publica.
- [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md): copias y actualización
  de Postgres.
- [`tareas/PLAN-CEO-2026-11-06.md`](tareas/PLAN-CEO-2026-11-06.md): el orden
  para encender los avisos.
- [`legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`](legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md),
  [`legal/encargados/README.md`](legal/encargados/README.md) y
  [`legal/BRECHAS-DE-DATOS.md`](legal/BRECHAS-DE-DATOS.md): datos personales,
  proveedores y qué hacer si hay una brecha.
- [`ANALITICA.md`](ANALITICA.md): cómo leer las visitas.
- [`ENTREGA-TIENDAS-Y-ANUNCIOS.md`](ENTREGA-TIENDAS-Y-ANUNCIOS.md): tiendas y
  anuncios.
- [`seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md`](seguridad/PRUEBAS-DE-ATAQUE-2026-10-01.md):
  qué aguanta la web y qué se puede mejorar.

Los informes con fecha (`VERIFICACION-…`, `CATALOGO-V2-…`, `INVESTIGACION-…`,
`SEO-…`, `PREPARACION-PLAY-…`, `CORRECCION-OFERTAS-…`) son **pruebas técnicas**
de lo que se comprobó cada día. La compuerta de publicación las cita, por eso
siguen ahí. No hace falta leerlas para trabajar. Índice en
[`LEEME.md`](LEEME.md).

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

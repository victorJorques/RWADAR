# RWAdar · estado interno canónico

Corte: 28/09/2026. Rama `codex/relanzamiento-publico`. Este documento prevalece sobre estados históricos.

## Autorización y alcance

El titular pidió expresamente publicar web y app nativa, actualizar el servidor y completar las comprobaciones. Autorizó SQL de lectura y después las acciones necesarias para el lanzamiento, además de coordinar ambos chats. No faltan permisos generales ni datos del aviso legal.

La consulta y la inclusión editorial son gratuitas. RWAdar es el radar; no emite los activos, ejecuta inversiones ni recibe el dinero invertido. Publicidad, comisiones, atribución y cobros continúan desactivados. Las cuentas, opiniones y seguimiento remoto están en pausa; los favoritos nativos nuevos son locales.

## Corte comprobado

- **Web:** integrada y generada desde Supabase. Preview y producción aún pendientes; los dominios conservan la retirada hasta registrar aquí el despliegue real.
- **Supabase:** migraciones 24 y 25 aplicadas a `exgpmjpaaebyoolpwced`, ACTIVE_HEALTHY, eu-west-1. CALIX intacto.
- **Catálogo:** revisión `80159d96-dcb8-b476-ae10-bc9cd2a45c83`, SHA256 `80159d96dcb8b476ae10bc9cd2a45c83f2bbc83626db30891871fbdac46a7099`, aprobada el 28/09 a las 08:32 UTC. 26 plataformas, 28 referencias, 70 fuentes y 4 descartes citables. Se consultaron las 69 fuentes anteriores, se sustituyeron enlaces fallidos por documentos oficiales y se añadió OCC para Paxos. Alcance por fuente en `rwadar-app/data/verificaciones/2026-09-28/revision-fuentes.json`. Borrador invisible bajo anon y lote aprobado 26/28 comprobados en SQL real y REST.
- **Fechas:** radar del 28/09 y ofertas del 27/09. Las ofertas no reciben una fecha nueva por revisar plataformas. Vigencia del lote hasta el 05/10 inclusive; después queda oculto sin nueva revisión. Las cifras individuales caducan según su plazo, sin desaparecer la referencia ni su evidencia.
- **Seguridad de datos:** RLS y vistas invoker. Borrador invisible bajo anon. Esquema editorial no expuesto en Data API (406/PGRST106). Cero permisos de mutación de tabla/columna y cero RPC privilegiadas públicas para anon/authenticated. REST sigue entregando 26/28 y 4 descartes.
- **Auth:** altas nuevas cerradas, confirmado por HTTP: disable_signup=true, mailer_autoconfirm=false, acceso anónimo desactivado. Los clientes no inician ni renuevan sesiones; no se borraron cuentas históricas.
- **Móvil:** modo editorial conectado, servicios remotos de usuario=false, sin OTA ni backup Android. Build6 falló por incompatibilidad del runtime fingerprint; se corrigió a appVersion y se actualizaron parches compatibles. APK 1.1.0/versionCode7 `8572d0b9-d97c-41c2-8d05-1bf7de5d9734` compilándose con firma existente. 58/58 pruebas y Expo Doctor 21/21 aprobados. Resultado, firma e instalación del binario pendientes; no hay publicación acreditada en tiendas.
- **Legal:** persona física identificada con los datos declarados por el titular. Aviso y condiciones completados; revisión interna acotada, sin atribuir un dictamen a un despacho.
- **Imágenes:** 26 portadas y 4 ilustraciones generadas propias, procedencia y etiquetas documentadas. Las 52 fotografías internas de terceros no se publican.
- **Analítica:** panel gratuito Cloudflare creado y cargador preparado. Recepción de visitas públicas aún por verificar. No hay cifras orgánicas acreditadas.
- **Correos:** 13 presentaciones individuales ya enviadas desde la cuenta elegida a Reental, Midas, Brickwise, Spiko, Prosegur, Alius, Aktionariat, Boss Info, wemakeit, quitt, LEND, Twiliner y EHC Kloten. Evidencia privada en `rwadar-contactos-2026-09-27`. No duplicar envíos ni presumir recepción.

## Incidente y conservación

El titular confirmó la revocación del token personal del commit histórico `229450ce4ee1690f26e3f7c52e9f0e57d8794ea6`. No se recuperó ni probó su valor. El historial sigue en Git privado, fuera del artefacto publicado. La retención del proveedor de un día impide reconstruir toda la ventana; no se afirma ausencia de actividad histórica. Informe en `seguridad/REVISION-SEGURIDAD-2026-09-27.md`.

Gitleaks 8.30.1 se ejecuta sobre el árbol enumerado por Git. Inventario y resultado final sin secretos: `rwadar-contactos-2026-09-27/seguridad/resultado-final.json`. La excepción de Web Analytics se limita al identificador público, archivo y regla exactos.

El cron existente de dispositivos inactivos más de 180 días corre a las 03:17 UTC y tuvo ejecuciones correctas el 26 y 27/09. No se ejecutó una purga manual ni se leyeron registros personales. Los derechos sobre datos anteriores se atienden por correo.

## Fuentes y operación

`rwadar-site` es la fuente web. `rwadar-publicado` y `rwadar-generated-source` son generados. `rwadar-version-codex` es forense y no se edita. `rwadar-limpieza` se conserva. El catálogo cambia mediante Supabase/importadores, nunca editando cifras en HTML/JS.

Cloudflare: proyecto rwadar, cuenta `52d07be006e7a27f5f793c59e1796b13`, dominio `https://rwadar.pages.dev`. Retirada comprobada: `237c1ed9-feaf-44ea-b408-bac23f904f27`. Netlify conserva la limpieza del dominio anterior. No se cambia la privacidad de GitHub.

Operación en `OPERACION-LANZAMIENTO.md`; alcance revisado en `comercial/REVISION-EDITORIAL-2026-09-27.md`; panel en `ANALITICA.md`. Un documento no crea vigilancia ni tareas programadas. La revisión futura debe contrastar fuentes.

Antes de publicar: suite raíz, escaneo, commits revisados, preview con QA y producción. Catálogo: 76 pruebas; control de publicación: 51. Registrar los resultados finales y enlaces tras comprobarlos.

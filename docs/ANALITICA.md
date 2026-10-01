# RWAdar · visitas y resultados

## En pocas palabras

- Las visitas de la web se miden con **Cloudflare Web Analytics**: sin cookies
  y sin datos personales.
- Última lectura (30 de septiembre de 2026, últimas 24 horas): **29 visitas y
  40 páginas vistas**. Incluye las pruebas del propio equipo, así que **no son
  29 personas** ni demuestran audiencia todavía.
- La app de Android aún no mide cuánta gente la abre. Descargas no es lo mismo
  que instalaciones.
- No hay ingresos por publicidad.

## Dónde entrar

[Abrir el panel de RWAdar](https://dash.cloudflare.com/52d07be006e7a27f5f793c59e1796b13/web-analytics/overview?siteTag~in=ddbd2a3f31ab43dfaf0c854a02ab34d8&excludeBots=Yes).

Usa la cuenta de Cloudflare vinculada a `victorjorquesgranero@gmail.com`.
El panel requiere iniciar sesión; no es público. Ruta alternativa:
**Analytics → Web analytics → rwadar.pages.dev**. Elige últimos 7 o 30 días
para comparar semanas y mantén el mismo periodo y zona horaria.

| Pregunta | Métrica o filtro | Cómo interpretarlo |
|---|---|---|
| ¿Cuántas entradas recibe la web? | Visits | Llegadas desde una web externa o acceso directo; no son personas únicas identificadas. |
| ¿Cuánto contenido se abre? | Page views | Cargas de páginas. Una visita puede incluir varias; los filtros o fichas que no cambian de página no son nuevas cargas. |
| ¿Desde dónde llegan? | Referrer | Web de procedencia cuando el navegador la comunica. Vacío/directo no demuestra que alguien tecleara la dirección. |
| ¿De qué países? | Country | Ubicación aproximada del tráfico; no domicilio ni nacionalidad. |
| ¿Qué pantallas usan? | Device, Browser, OS | Distribución móvil/ordenador y entornos de uso. |
| ¿Qué páginas interesan? | Path | Portada, privacidad, empresas y transparencia; no mide por sí solo cada modal o ficha del radar. |
| ¿La app web funciona con rapidez? | Page load time, LCP, INP, CLS | Rendimiento y estabilidad visual, no resultados de inversión. |

La PWA instalada sigue siendo la web y usa este mismo panel al estar conectada.
El APK Android todavía no mide aperturas ni personas activas: esa integración
queda como trabajo técnico de RWAdar. Las peticiones de la
cuenta o del CDN incluyen archivos y tráfico automatizado: **requests no es
visitas**. El filtro de bots tampoco garantiza identificar a todas las personas.

## Qué está configurado

- Un cargador propio en las cuatro páginas públicas; carga manual del beacon,
  con `spa: false`, sin activar inyección automática adicional en Pages.
- Solo HTTPS y `rwadar.pages.dev`; se excluyen localhost, previews, Netlify y
  otras rutas. No transmite identificadores de cuenta ni eventos de inversión.
- Se omiten URL y referentes con parámetros o fragmentos, incluidos callbacks
  de autenticación. Por ahora, un enlace UTM queda fuera de la medición.
- Se respetan Do Not Track y Global Privacy Control y no se carga sin conexión.
  El cargador no accede a cookies ni al almacenamiento local del visitante.
- CSP limitada al script y al colector oficiales. El service worker conserva
  únicamente el cargador propio, sin cachear el beacon de terceros.

Bloqueadores, ausencia de JavaScript, estas exclusiones y fallos de red pueden
reducir los recuentos. No interpretar un cero de este panel recién creado como
prueba de que nadie visitó las antiguas direcciones. Los datos empiezan después
de instalar y verificar la medición; no se reconstruyen retrospectivamente.

## Comprobación tras el despliegue

Abrir la portada pública sin parámetros, comprobar que se solicita una sola
vez el beacon y que la petición de métricas llega al colector oficial. Revisar
consola/CSP, comprobar que callbacks y entorno local no lo cargan y confirmar
en el panel la recepción de la visita de prueba. Identificar esa visita como
prueba, no como audiencia orgánica. Registrar fecha, despliegue y resultado en
`INTERNO.md`; no declarar la integración operativa solo porque el script compila.

El recorrido anterior se verificó en este lanzamiento: 1 beacon en el DOM,
ningún error de consola observado y recepción en el panel tras unos minutos.
Captura privada: `rwadar-contactos-2026-09-27/analitica-primera-visita.png`.

## Descargas Android

El repositorio público [RWAdar-downloads](https://github.com/victorJorques/RWAdar-downloads/releases/latest)
distribuye el APK. La [API pública de la última versión](https://api.github.com/repos/victorJorques/RWAdar-downloads/releases/latest)
incluye `assets[].download_count` para `RWAdar.apk`. Cuenta descargas de ese
archivo, incluidas nuestras verificaciones y descargas repetidas; no demuestra
instalaciones, personas únicas ni aperturas. No sumar ese contador a Visits.

Para retirar la medición, quitar las referencias al cargador, ajustar CSP y
desplegar el artefacto revisado. El servicio puede desactivarse también en la
configuración del sitio de Web Analytics, sin eliminar el proyecto Pages.

## Ingresos por anuncios

Web Analytics no muestra dinero. Si se aprueba AdSense para la web/PWA, los
ingresos e impresiones se consultarán en AdSense. Cuando se integre y active
AdMob en la app nativa, se consultarán en AdMob.

La primera lectura del 30/09, entre las 12:02 y 12:05 UTC, mostró una cuenta
AdMob existente con saldo 0 EUR, perfil de pagos incompleto y ninguna app.
Ese es el corte inicial. Después, con autorización específica, se crearon
las dos fichas de RWAdar, Android e iOS; el listado confirma dos fichas en
estado «Debe revisarse». **No crear duplicados.** El perfil de pagos sigue
incompleto: hay cero unidades publicitarias, ningún SDK integrado y la
monetización continúa desactivada. No hay anuncios servidos ni ingresos
acreditados. Las fichas no acreditan aprobación publicitaria o publicación
en las tiendas. El detalle y la evidencia privada se referencian desde
`ENTREGA-TIENDAS-Y-ANUNCIOS.md`; la pantalla de alta del 28/09 es histórica.

Separar ingresos estimados, ingresos finalizados y pagos realmente recibidos.
No usar visitas de Cloudflare para inventar impresiones, eCPM o beneficios.
La inclusión editorial continúa gratuita; las empresas no pagan por invertir
desde una ficha. El recorrido y sus requisitos están en
`comercial/INVESTIGACION-MONETIZACION-2026-09-27.md`.

## Referencias oficiales consultadas

- [Definición de visitas y páginas vistas](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/).
- [Dimensiones y filtros](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/).
- [Datos técnicos, tratamiento de IP y almacenamiento](https://developers.cloudflare.com/speed/observatory/rum-beacon/).
- [Desactivar medición automática SPA](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/).
- [Web Analytics gratuito](https://developers.cloudflare.com/web-analytics/about/).

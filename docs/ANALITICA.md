# RWAdar · visitas y resultados

Estado comprobado el 27 de septiembre de 2026: sitio gratuito creado en
Cloudflare Web Analytics, panel vacío y código incorporado localmente.
**Todavía no se ha desplegado ni verificado la recepción de visitas.**
No existen cifras históricas recuperadas ni ingresos publicitarios acreditados.

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
La app nativa Expo necesitaría una integración distinta. Las peticiones de la
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

Para retirar la medición, quitar las referencias al cargador, ajustar CSP y
desplegar el artefacto revisado. El servicio puede desactivarse también en la
configuración del sitio de Web Analytics, sin eliminar el proyecto Pages.

## Ingresos por anuncios

Web Analytics no muestra dinero. Si se aprueba AdSense para la web/PWA, los
ingresos e impresiones se consultarán en AdSense. Si se publica la app nativa
con AdMob, se consultarán en AdMob. Actualmente no hay una cuenta publicitaria
verificada ni un SDK activo y no se han generado ingresos acreditados.

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

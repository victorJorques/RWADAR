# Investigación del catálogo · 13 de noviembre de 2026

Víctor lo pidió el 13/11 a las 08:25 UTC: «Actualiza las noticias, las ofertas
y el gráfico de la evolución de la tokenización a hoy, optimízalo para hacerlo
lo más rápido posible pero que esté bien hecho».

Carpeta: `rwadar-app/data/verificaciones/2026-11-13-v2/`.

## 1. En pocas palabras

- **Las 22 ofertas siguen** (8 principales, 13 de reventa y 1 en camino) y
  las 25 plataformas del radar. Revisión `434217eb`, vigente hasta el 20/11.
- **Cambian:**
  - **Spiko Letras del Tesoro Euro:** 2,41 % → **2,40 %** (VL del 12/11).
  - **Spiko Letras del Tesoro Dólar:** 4,02 % → **3,98 % en USD** (VL del
    12/11).
  - **Spiko Smart Cash:** sigue en 2,84 %, ahora con la VL del 12/11.
  - **Brickwise:** «Participaciones en venta» al día en Cohotel (59),
    GreenPoint (347), Schwarzer Weg (299) y Pottendorfer (106); mejor compra
    de Randhartingergasse 56 → 64 €. Pottendorfer **sigue en 80 €**: la orden
    de 73 € vista a las 08:30 UTC ya no existía a las 14:36 UTC (lo vio el
    revisor de cumplimiento y se corrigió antes de aplicar).
  - El resto, mismas cifras con la fecha de hoy.
- **Ninguna oferta nueva**: las 6 candidatas siguen sin documento público,
  sin oferta abierta a particulares en España o sin KID público.
- **Radar:** 69/69 (REGAFI por su API pública; Centrifuge recapturado).
- **Noticias:** 5 «importantes», verificadas; ninguna de hoy con fuente
  primaria (barrido de la mañana y de la tarde).
- **Tokenización:** foto del 13/11 tomada a mano a las 08:39 UTC (el flujo
  programado de GitHub llegó tarde); la serie se publica con la web.

## 2. Revisiones

- Investigación: 4 grupos (principales, Brickwise, suiza y vigilancia), cada
  uno con revisor independiente: «aprobado» o «aprobado con cambios».
- Entrega: SQL «aprobado con cambios», contenido «aprobado», cumplimiento
  «aprobado con cambios» (O1 Pottendorfer; O2 nombres en una copia de
  Profitus), corrección y verificación final «conforme».
- SQL aplicado: `aplicar-y-aprobar.sql` SHA-256 `b6f0129c…e7b4`.

## 3. Publicación

- PR #131 (catálogo y noticias), «Aplicar catálogo» n.º 18, lectura como
  visitante: revisión `434217eb`, 25/22, `verificadaEl` 2026-11-13.
- PR #132 (sincronización) y #133 (sello).
- OTA n.º 28 enviada.
- «Publicar web»: Cloudflare tuvo una avería en su API de Workers/Pages
  desde las 15:42 UTC (publicaciones n.º 86, 87 y 88 rechazadas por
  Cloudflare, no por nuestras compuertas). Se publica en cuanto lo resuelvan.

## 4. Incidencias del día

- **Límite de uso de 5 horas** alcanzado a mitad de la mañana con cuatro
  trabajos en paralelo (catálogo, gráfico, optimización y auditoría): todo
  se paró hasta las 13:20 UTC y se retomó donde estaba.
- **Cloudflare** (ver §3).

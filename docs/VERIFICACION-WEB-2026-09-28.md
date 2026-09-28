# Verificación del lanzamiento web

Revisión del 28/09/2026. Contenido aprobado: commit
`6c5e395a432a4ed5e58d96dcfcd7b1eebd3c9ba3`.
Preview: https://6a548507.rwadar.pages.dev .
Versión de caché: `rwadar-v-2c75c5f89ff3f249`.

## Resultado comprobado

- Suite raíz completa aprobada antes del primer preview. Después de las
  correcciones de texto, fuentes y navegación: 329 pruebas web y 13 pruebas
  de presentación editorial aprobadas. Los cambios de permisos nativos se
  verifican en la entrega Android.
- HTTP del preview: 54 recursos coinciden byte a byte con el artefacto local.
  CSP y nosniff presentes. Ruta inexistente 404, index.html redirige con 301
  y /android con 302 al repositorio de descargas. No se han publicado fotos
  ajenas, datos privados ni fuentes históricas de Git.
- Navegador escritorio: búsqueda Spiko (1), búsqueda inexistente (0), limpiar
  (26), región España (1) y restaurar (26). Ficha Pax Gold con fecha real y
  enlaces a Paxos, NYDFS y OCC; comparativa ADDX/Archax con diferencias de
  acceso y permiso. Cuentas y seguimiento no operativos según lo mostrado.
- Pantallas de 390×844 y 320×740: navegación, botón Android, ofertas y acceso
  a privacidad. Ancho de documento menor o igual al viewport; ninguna imagen
  cargada rota. Sin errores ni avisos de consola observados en ese recorrido.
- La revisión detectó y corrigió el título que afirmaba apertura general,
  explicaciones educativas demasiado categóricas, falta de enlaces de fuentes
  en la ficha y exportación CSV de afirmaciones históricas. Se corrigió además
  la superposición del acceso Android con el botón de ayuda móvil.

## Evidencias y límites

Evidencia privada: `rwadar-contactos-2026-09-27/http-6a548507.rwadar.pages.dev.json`,
`pruebas-raiz-28.log`, `pruebas-web-movil28.log`,
`preview-movil-390.png` y `preview-movil-320.png`.

Esto acredita el preview web y sus recorridos probados, no todos los dispositivos
posibles. La recepción de analítica se comprueba en el dominio canónico después
de desplegar. El destino final Android se verifica al publicar el APK firmado;
su prueba nativa se documenta separadamente. La entrega final y sus enlaces se
registran en `INTERNO.md`.

## Producción comprobada

El 28/09/2026 se desplegó `https://ddc0115b.rwadar.pages.dev` a producción.
`https://rwadar.pages.dev` entrega los mismos 54 recursos verificados (09:13:59 UTC),
sin fallos de contenido o cabeceras. `/android` redirige a la release pública
de GitHub; una descarga anónima completa coincide con el APK8 probado.
El navegador público muestra 26 plataformas y 28 referencias, sin imágenes
rotas ni errores de consola observados; aviso legal accesible y regreso al radar.
La medición carga un único beacon. El panel mostró la primera visita/página vista
de prueba a las 09:16 UTC. No se confunden con audiencia orgánica.

Evidencias privadas añadidas: `http-rwadar.pages.dev.json`,
`web-publica-final.png`, `analitica-primera-visita.png`, en
`rwadar-contactos-2026-09-27/`. La prueba pública no acredita cobertura universal
de dispositivos ni usuarios Android medidos por Cloudflare.

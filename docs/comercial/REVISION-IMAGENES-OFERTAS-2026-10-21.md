# Imágenes de las ofertas · revisión del 21/10/2026

Víctor pidió el 20 y el 21/10 que la imagen de cada oferta específica diera
confianza, vendiera y explicara de un vistazo en qué se invierte; que, si la
oferta es un inmueble, saliera un inmueble de esas características, «a poder
ser el real»; y, al ver la primera versión (dibujos isométricos en SVG), que no
fueran «tipo dibujos animados» sino cosas reales, con edición y
postprocesado.

## Qué se hizo

1. **20/10 · texto y mecanismo.** Para cada una de las 49 fichas se leyó su
   fuente oficial (y su foto, cuando la hay, solo para mirarla) y se
   escribieron el lugar y tres pasos cortos: qué haces, qué pasa y cómo
   recibes o sales. En el mercado secundario de Reental, «Compras si hay
   oferta» y «Reparto o reventa»: no se da por hecho que haya vendedores ni
   cobros. Quedó en `rwadar-editorial-source/ofertas/fichas.json`.
2. **21/10 · fotografía.** Cada ficha tiene ahora una foto generada del
   activo, parecida al real según su fuente: tipo de edificio, plantas,
   fachada, entorno (palmeras, mar, montaña, viñedo, valle alpino…). Sin
   marcas, rótulos ni personas.
   - 5 se encargaron en Canva (generación de imágenes) hasta agotar los
     créditos gratuitos del mes (20 usos al mes; vuelven el 1 de noviembre).
   - Las otras 44 se generaron en la sesión, sin servicios de pago, con
     RealVisXL V5.0 Lightning (licencia CreativeML Open RAIL++-M, que permite
     uso comercial con las restricciones de uso habituales).
   - Se descartaron: el servicio gratuito Pollinations (marca de agua y poca
     resolución) y las fotos con licencia libre de Wikimedia y Openverse
     (casi nunca se parecían al activo y obligaban a citar autor en cada
     imagen).
3. **Postproducción** (`generar.mjs` y `plantilla-foto.mjs`): recorte a
   1280 × 880 con el activo a la derecha, un punto menos de saturación, tono
   algo más cálido, nitidez fina, velo de lectura a la izquierda, viñeta y
   grano fino; encima, el lugar y los tres pasos con las fuentes de la web.
   Se reduce a 960 × 660 en WebP (máximo 200 KB).
4. Cada toma se miró antes de montarla. Las que no se parecían o daban mala
   impresión (una casona en ruinas para una casa restaurada, un edificio
   borroso) se repitieron con otra semilla.

## Honestidad

- La etiqueta visible sigue siendo «Ilustración editorial».
- El texto alternativo de cada imagen dice que está generada con IA y que no
  es una foto del activo real.
- `fotos.json` guarda, por ficha, el modelo, la descripción, la semilla y el
  encuadre; el manifiesto (`rwadar-movil/assets/ofertas-editoriales/manifest.json`)
  dice el origen de cada imagen.
- No se usó ninguna foto de emisores ni de terceros.

## Comprobado

- Las 49 en las cuatro vistas donde salen (tarjeta web de escritorio y de
  móvil, tarjeta de la app y ficha web): el texto se lee y no lo tapan las
  etiquetas.
- `npm test` completo (ver la entrada del 21/10 en `docs/tareas/PARA-CODEX.md`).

## Qué falta

- Publicar la web (Víctor, con aprobación nueva en `estado.json`).
- La app las enseña desde su próxima versión.
- Si un emisor da licencia escrita de sus fotos, se puede sustituir la de su
  ficha.

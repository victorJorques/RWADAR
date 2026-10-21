# Ilustraciones por ficha

Cada ficha del catálogo tiene su propia ilustración, `oferta-<slug>.webp`
(960 × 660), que explica la inversión de un vistazo:

- a la derecha, una maqueta isométrica **genérica** del activo, parecida al
  real (tipo de edificio, plantas, materiales, entorno: palmeras, mar,
  montaña, viñedo…), sobre una plataforma con el color de su categoría y con
  cubos de cristal que representan las participaciones;
- a la izquierda, el lugar y **tres pasos** muy cortos: qué haces, qué pasa y
  cómo recibes o sales;
- en las de mercado secundario, dos teléfonos que se pasan una participación.

No son fotos ni renders del activo real: no tenemos derechos sobre las fotos
de los emisores, y la web y la app ponen encima la etiqueta «Ilustración
editorial». Si un emisor da licencia por escrito, se puede sustituir.

## Reglas

- Sin cifras, porcentajes ni símbolos de moneda; sin marcas ni logotipos; sin
  personas; sin promesas («rentabilidad», «garantizado», «beneficio»…). Lo
  comprueban `rwadar-ofertas-editoriales.js`, la app y las pruebas.
- Los pasos describen el mecanismo de **esa** inversión según su fuente y no
  dan por hecho lo que puede no ocurrir: en el secundario, «Compras si hay
  oferta» y «Reparto o reventa», nunca «te venden» o «cobras».
- Cada paso cabe en una línea; si no, `generar.mjs` se para y dice cuál.
- El texto y la escena salen de la fuente oficial de la ficha (y, cuando la
  hay, de su foto oficial, que solo se mira). La revisión del 20/10/2026 está
  en `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-20.md`.

## Archivos

- `fichas.json`: una entrada por ficha: escena y opciones, lugar, pasos y
  `concepto` (completa la frase «Ilustración editorial de …», que es el texto
  alternativo).
- `escenas.mjs`: las escenas (edificio, torre, casa, villa, condominio,
  chalet, local, terreno, solar, hotel, bodega, tesoro, crédito, oro,
  empresa, reventa, reforma, catálogo) y sus opciones.
- `motor.mjs`: el dibujo isométrico en SVG (cajas, ventanas, tejados,
  plataforma, cubos, árboles, monedas, hojas).
- `plantilla.mjs`: la página de 1280 × 880 con las fuentes Geist de la web,
  que se fotografía y se reduce a 960 × 660.
- `generar.mjs`: dibuja todas, borra las que sobran y reescribe el
  manifiesto, el bloque `EDITORIAL_OFERTA_POR_SLUG` de la web y los `require`
  de la app.

## Cómo se regeneran

```
node rwadar-editorial-source/ofertas/generar.mjs --comprobar   # solo valida fichas.json
node rwadar-editorial-source/ofertas/generar.mjs                # dibuja las 49
node rwadar-editorial-source/ofertas/generar.mjs --hoja=hoja.png   # y una hoja de contactos
```

Necesita Playwright con Chromium (`RWADAR_CHROMIUM` indica el ejecutable si
no es el de Playwright). Después, `npm test`.

Si el catálogo trae una ficha nueva, hasta que se añada aquí usa la
ilustración de su categoría: la web, la app y `npm run catalogo` lo avisan.
Cambiar las imágenes cambia la huella del contenido aprobado: hace falta una
aprobación nueva en `rwadar-app/data/relanzamiento/estado.json` para publicar
la web, y una versión nueva de la app para que la app las enseñe.

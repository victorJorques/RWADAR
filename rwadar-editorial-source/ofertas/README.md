# Imágenes por ficha

Cada ficha del catálogo tiene su propia imagen, `oferta-<slug>.webp`
(960 × 660), que explica la inversión de un vistazo:

- de fondo, una **fotografía generada** del activo, parecida al real según su
  fuente oficial (tipo de edificio, plantas, fachada, entorno: palmeras, mar,
  montaña, viñedo…), retocada para que se vea como una foto de inmobiliaria
  y no como un dibujo;
- a la izquierda, sobre un velo oscuro, el lugar y **tres pasos** muy cortos:
  qué haces, qué pasa y cómo recibes o sales.

No son fotos del activo real: no tenemos derechos sobre las fotos de los
emisores. La web y la app ponen encima la etiqueta «Ilustración editorial» y
el texto alternativo dice que la imagen está generada con IA y que no es una
foto del activo real. Si un emisor da licencia por escrito, se puede
sustituir.

Si una ficha no tiene foto, `generar.mjs` usa su escena en SVG (el dibujo
isométrico de antes); si la ficha no está en `fichas.json`, la web y la app
usan la ilustración de su categoría.

## Reglas

- Sin cifras, porcentajes ni símbolos de moneda; sin marcas, rótulos ni
  logotipos; sin personas; sin promesas («rentabilidad», «garantizado»,
  «beneficio»…). Lo comprueban `rwadar-ofertas-editoriales.js`, la app y las
  pruebas, y el modelo trabaja con una lista negativa (texto, logos, personas).
- La foto se parece al activo según su fuente (y, cuando la hay, su foto
  oficial, que solo se mira): un edificio ruinoso, en obra o de lujo cuando no
  lo es engaña. Si una toma sale así, se repite con otra semilla.
- Los pasos describen el mecanismo de **esa** inversión según su fuente y no
  dan por hecho lo que puede no ocurrir: en el secundario, «Compras si hay
  oferta» y «Reparto o reventa», nunca «te venden» o «cobras».
- Cada paso cabe en una línea; si no, `generar.mjs` se para y dice cuál.
- Las revisiones están en `docs/comercial/REVISION-IMAGENES-OFERTAS-2026-10-21.md`.

## Archivos

- `fichas.json`: el texto de cada ficha: lugar, pasos, `concepto` del dibujo
  y la escena SVG de reserva.
- `fotos.json`: el encargo de cada foto: modelo, descripción en inglés
  (`prompt`), semilla, encuadre (posición x% y% del recorte, para dejar el
  activo a la derecha) y `concepto` (completa «Ilustración editorial de …»,
  el texto alternativo). Describe también los dos modelos usados.
- `fotos/<slug>.webp`: la foto maestra tal como salió del modelo.
- `fotografiar.py`: vuelve a generar las fotos maestras con el modelo
  RealVisXL V5.0 Lightning (licencia CreativeML Open RAIL++-M) en el
  ordenador, sin servicios de pago. Cinco se encargaron en Canva el 21/10
  con la misma descripción; esas no se regeneran aquí.
- `plantilla-foto.mjs`: la página de 1280 × 880 de las fotos: velo de
  lectura, viñeta, grano fino y el texto con las fuentes Geist de la web.
- `escenas.mjs`, `motor.mjs` y `plantilla.mjs`: el dibujo isométrico en SVG,
  de reserva.
- `generar.mjs`: retoca cada foto (recorte, color, nitidez), le pone el texto,
  borra las que sobran y reescribe el manifiesto, el bloque
  `EDITORIAL_OFERTA_POR_SLUG` de la web (con el lugar, que la tarjeta enseña
  con su chincheta) y los `require` de la app.

## Cómo se regeneran

```
node rwadar-editorial-source/ofertas/generar.mjs --comprobar   # solo valida
node rwadar-editorial-source/ofertas/generar.mjs                # monta las 49
node rwadar-editorial-source/ofertas/generar.mjs --hoja=hoja.png   # y una hoja de contactos
```

Necesita Playwright con Chromium (`RWADAR_CHROMIUM` indica el ejecutable si
no es el de Playwright). Después, `npm test`.

Para cambiar una foto: edita su `prompt` en `fotos.json` y
`python rwadar-editorial-source/ofertas/fotografiar.py --solo=<slug> --semilla=<n>`
(necesita `torch`, `diffusers`, `transformers`, `accelerate` y `pillow`; unos
7 GB de modelo y dos minutos por foto con cuatro núcleos). Mira el resultado
antes de montar.

Si el catálogo trae una ficha nueva, hasta que se añada aquí usa la
ilustración de su categoría: la web, la app y `npm run catalogo` lo avisan.
Cambiar las imágenes cambia la huella del contenido aprobado: hace falta una
aprobación nueva en `rwadar-app/data/relanzamiento/estado.json` para publicar
la web, y una versión nueva de la app para que la app las enseñe.

# Imágenes por ficha

Cada ficha del catálogo tiene su propia imagen, `oferta-<slug>.webp`
(960 × 660), que explica la inversión de un vistazo:

- de fondo, una **fotografía generada** del activo, parecida al real según su
  fuente oficial (tipo de edificio, plantas, fachada, entorno: palmeras, mar,
  montaña, viñedo…), retocada para que se vea como una foto de inmobiliaria
  y no como un dibujo;
- limpia: sin texto dibujado ni velo (desde el 03/11/2026). El lugar y los
  **tres pasos** (qué haces, qué pasa y cómo recibes o sales) van como texto en
  el manifiesto, en el texto alternativo y en la ficha.

No son fotos del activo real: no tenemos derechos sobre las fotos de los
emisores. La web ya no pone ninguna etiqueta encima de la imagen: el texto
alternativo empieza por «Ilustración editorial», dice que la imagen está
generada con IA y que no es una foto del activo real, y una línea pequeña
bajo la lista, los carruseles y el detalle dice «Imágenes ilustrativas, no
fotos del activo». Si un emisor da licencia por escrito, se puede
sustituir.

## Fotos reales de Wikimedia Commons (desde el 22/11/2026)

Orden de Víctor del 22/11/2026: «La de las ofertas también las cambiaría, las
siento muy igual». Cada ficha puede llevar, **en vez de** su ilustración, una
foto real con licencia libre de Wikimedia Commons (dominio público, CC0,
CC BY 2.0–4.0 o CC BY-SA 2.0–4.0: la lista de las noticias). Las de IA siguen
igual para las fichas que no la tengan, y su encargo se queda en `fotos.json`
por si se quita la real.

```
python3 rwadar-editorial-source/noticias/importar-foto.py --biblioteca ofertas \
    --clave <slug> --archivo "File:Nombre en Commons.jpg" \
    --descripcion "Lo que de verdad se ve, en castellano llano" \
    --que-muestra activo|lugar|tema [--lugar-o-tema "Graz (Austria)"] \
    [--lugar-o-tema-en "Graz, Austria"] [--encuadre "50% 50%"] [--trabajo /fuera/del/repo]
```

- **Qué muestra** (`queMuestra`), siempre con honradez:
  - `activo`: el edificio o la instalación exacta de la oferta. Solo si una
    persona lo ha comprobado con la fuente (dirección, fachada). El pie dice
    «Foto real del activo».
  - `lugar`: la calle, el barrio o la ciudad donde está el activo, no el
    activo. El pie dice «Foto real de <lugarOTema>, no del activo».
  - `tema`: algo real relacionado (el Tesoro, una bolsa, lingotes…). El mismo
    pie: «Foto real de la Bolsa de Nueva York, no del activo».
- `--lugar-o-tema` es lo que va en el pie (no con `activo`), y
  `--lugar-o-tema-en`, si lo hay, lo mismo para el pie en inglés.
- El importador usa la API de Commons con el agente genérico
  «editorial-photo-import/1.0», la miniatura estándar de 1920 px, rechaza las
  licencias que no son de la lista, lo «NonFree», los derechos de imagen de
  personas y el «© European Union, <año en curso>», quita el HTML y los
  caracteres invisibles del autor y no pisa nada: si la ficha ya tiene foto
  real o ese archivo ya está en la biblioteca, se para sin escribir nada.
- Recorta a 16:11 con el encuadre y exporta un solo WebP sin metadatos,
  `rwadar-movil/assets/ofertas-editoriales/foto-<slug>.webp` (960 × 660,
  200 kB como mucho), que publica la web y empaqueta la app. Apunta la entrada
  en `reales` de `fotos.json` (`origen`, `descripcion`, `queMuestra`,
  `lugarOTema`, `fuente`, `licencia`, `autor`, `sinPersonas`, `encuadre`,
  `bytes`, `sha256`) y ejecuta `generar.mjs --indices`, que reescribe el
  manifiesto (con el crédito), el bloque de la web y los `require` de la app
  sin dibujar nada y borra `oferta-<slug>.webp`.
- **Nunca** como `oferta-<slug>.webp`: la app ya instalada pide ese nombre a
  la web para las fichas que no lleva dentro y lo presenta como ilustración
  de IA. La foto real se llama `foto-<slug>.webp` y solo la enseña la app que
  trae su crédito (la OTA con este cambio). La app instalada sin esa OTA sigue
  con sus ilustraciones empaquetadas, que dicen la verdad.
- **Pie** (web: catálogo, carruseles de Inicio, mapa, ficha y
  `/ofertas/<slug>`; app: lista, Inicio y ficha), en castellano e inglés, con
  `rwadar-movil/lib/fotos-ofertas.js` (la web lleva una copia exacta en su
  bloque generado): «Foto real de Graz (Austria), no del activo · Autor ·
  CC BY-SA 4.0 · Wikimedia Commons» o «Foto real del activo · …», con la
  licencia enlazada a su texto y Commons a la página del archivo (en la ficha,
  «· recortada»); sin autor en dominio público o CC0. Si el crédito falta o no
  vale, «Foto real del lugar o del tema, no del activo»: nunca se da una foto
  por foto del activo sin un crédito válido que lo diga. El texto alternativo
  es la descripción. La línea de debajo de la lista y del carrusel dice la
  verdad de lo que se ve (ilustraciones, fotos del lugar o del tema, o del
  activo).
- Las reglas de las ilustraciones (sin rótulos, sin cifras) no se aplican
  igual a una foto real de un edificio con su rótulo; sí: **sin personas
  reconocibles**, licencia de la lista, crédito completo y nada de cifras de
  dinero ni promesas en la descripción ni en el pie. Lo comprueban
  `generar.mjs`, `rwadar-ofertas-editoriales.js`, la app y las pruebas.
- Después de importar: **mírala** a tamaño completo (personas, que se vea lo
  que dice la descripción, y si dice «activo», que lo sea),
  `node rwadar-editorial-source/ofertas/generar.mjs --comprobar` y `npm test`.
  Cambia la huella del contenido: sello nuevo antes de publicar la web y OTA
  para la app. Prueba sin red: `probar-importar-foto.py` (en `npm test`).

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
- `fotos.json` (esquema 3): en `reales`, las fotos reales de Commons (arriba);
  en `fotos`, el encargo de cada foto generada: modelo, descripción en inglés
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
node rwadar-editorial-source/ofertas/generar.mjs --indices      # solo manifiesto, web y app, sin dibujar
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

## Transparencia por oferta

`transparencia.json` guarda, para cada oferta, dos de las cinco
comprobaciones de transparencia (quien la vende está supervisado y registrado
en la CNMV; hay un documento oficial que cubre su venta en España), con su
motivo, su fuente y su fecha; los puntos fuertes con fuente; el mínimo y la
salida en forma corta, y la fecha de alta en el registro. Las otras tres
(se contrata hoy desde España, mínimo y salida documentados, revisión vigente)
las calcula la web con el catálogo.

```
node rwadar-editorial-source/ofertas/transparencia.mjs --comprobar   # valida y mira que la web y la app estén al día
node rwadar-editorial-source/ofertas/transparencia.mjs               # escribe el bloque de la web y lib/transparencia-contenido.js
```

Comprueba que cada oferta esté en el catálogo publicado y con la misma
`verificadaEl`, que los textos cortos (puntos, mínimo, salida) no pasen de 40
caracteres, que ningún texto lleve «%», «rentab», «garantiz», «benefici»,
«gananci», «recomend» ni «mejor», y que las fuentes sean https. En cada ciclo
del catálogo se revisa junto con las fichas: si cambia la `verificadaEl` de una
oferta y no se revisa aquí, `npm test` lo para y la web no enseña nada de esa
oferta (falla cerrado). Es una comprobación de la documentación, no una
recomendación de inversión, y no da notas («x/5»).

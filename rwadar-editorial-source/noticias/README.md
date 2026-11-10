# Fotos de las noticias del sector

Biblioteca reutilizable de fotos editoriales **por tema** para las tarjetas de
noticias de Inicio y de la sección de noticias. Cada noticia elige una clave en
su campo `imagen` (por ejemplo, `"imagen": "alerta-fraude"`); varias noticias
pueden compartir la misma foto.

No son fotos de la noticia: son escenas genéricas generadas con IA, de revista
financiera, nocturnas o de hora azul, con el tema oscuro de RWAdar. El sujeto va
en el tercio derecho para que el titular se lea a la izquierda o abajo, sobre un
degradado oscuro. Debajo de las tarjetas va la línea «Imágenes ilustrativas
generadas con IA, no fotos de la noticia». En la web y en la app la foto es
decorativa (`alt=""`, oculta al lector de pantalla): el titular ya es el nombre
del enlace. El `concepto` describe lo que se ve, para quien revisa la
biblioteca.

## Reglas

- Sin texto, letras, números, logotipos, marcas, banderas, escudos ni personas.
  El modelo trabaja con una lista negativa, pero **cada toma se mira**: si sale
  con letras raras, una marca, una persona o deformidades, se repite con otra
  semilla.
- Genéricas: ningún edificio, sede ni producto reconocible. «De aire
  madrileño» sí; la sede real de una institución, no.
- Sin cifras ni promesas: la foto acompaña al titular, no lo sustituye.
- El `concepto` describe lo que **se ve** en la foto elegida, no lo que se
  pidió: si el modelo no dibujó el sello, el `concepto` no lo nombra.
- **Una foto ya publicada no se cambia bajo la misma clave**: una toma nueva
  va con una clave nueva (`acciones-eeuu-2`) y se cambia el campo `imagen` de
  las noticias. La precarga de imágenes comprueba la web publicada contra
  `fotos.json` y se pararía con una foto distinta bajo una clave ya servida.
- La descripción y el estilo juntos caben en 77 fichas de CLIP (lo que pasa de
  ahí el modelo lo ignora sin avisar); `fotografiar.py` se para si no caben.
- Un `retoque` solo desenfoca zonas concretas de la toma (una pantalla o una
  etiqueta que dejaría leer letras o un logotipo) o la voltea en espejo para
  llevar el sujeto a la derecha. Se declara en `fotos.json` con su motivo; nada
  de pegar, pintar ni añadir elementos.

## Archivos

- `fotos.json`: el modelo (`realvisxl`: RealVisXL V5.0 Lightning, licencia
  CreativeML Open RAIL++-M), el estilo y la lista negativa comunes, el tamaño de
  salida y, por clave, la licencia, la descripción en inglés (`prompt`), la
  semilla, el `encuadre` (posición x% y% del recorte 3:2 sobre la toma de
  1344×768), el `retoque` si lo hay, el `concepto` en castellano (texto
  alternativo), los `bytes` y el `sha256` del WebP.
- `fotos/<clave>.webp`: la foto lista para servir, 1200×800, WebP sin
  metadatos, como mucho 160 kB. La web la publica en
  `/noticias-editoriales/<clave>.webp`, y la app la carga desde
  `https://rwadar.pages.dev/noticias-editoriales/<clave>.webp`.
- `fotografiar.py`: genera las tomas con el modelo en el ordenador, sin
  servicios de pago, las recorta y exporta, y apunta semilla, bytes y sha256.

## Licencia y transparencia

RealVisXL V5.0 Lightning se distribuye con la licencia CreativeML Open RAIL++-M.
Su anexo A prohíbe, entre otros usos, generar contenido para engañar o
desinformar, suplantar a personas, difamar, o dar consejo médico o jurídico
automatizado. Aquí solo se generan escenas genéricas, sin personas ni marcas,
que acompañan a un titular verificado. Los WebP **no llevan marca legible por
máquina** (ni C2PA ni el `trainedAlgorithmicMedia` de IPTC: se exportan sin
metadatos). La transparencia es la línea visible bajo las tarjetas y este
archivo.

Las tomas originales del modelo (PNG de 1344×768,
`<clave>-<semilla>-<huella>.png`; la huella cambia si cambia la descripción) y
el propio modelo (unos 7 GB) **no van en Git**: viven en `RWADAR_MAESTRAS` y `RWADAR_MODELO`.

## Cómo se regeneran

Necesita Python con `torch` (para CPU, de `https://download.pytorch.org/whl/cpu`),
`diffusers`, `transformers`, `accelerate` y `pillow`. Unos dos minutos por toma
con cuatro núcleos.

```
export RWADAR_MODELO=/ruta/al/modelo-realvisxl     # o se descarga de Hugging Face
export RWADAR_MAESTRAS=/ruta/fuera/de/git
python rwadar-editorial-source/noticias/fotografiar.py                         # las que falten
python rwadar-editorial-source/noticias/fotografiar.py --solo=clave --semillas=3,7,9   # candidatas, sin exportar
python rwadar-editorial-source/noticias/fotografiar.py --solo=clave --semilla=7       # elige y exporta
python rwadar-editorial-source/noticias/fotografiar.py --exportar              # recorta de nuevo (tras cambiar un encuadre)
```

Para un tema nuevo: añade su clave en `fotos.json` con `prompt`, `concepto`,
`encuadre` y una semilla, genera candidatas, míralas y exporta la elegida.
Cambiar una foto cambia su `sha256` en `fotos.json`; si ya está publicada, va con otra clave (ver «Reglas»).

## Temas

| Clave | Escena |
| --- | --- |
| `alerta-fraude` | Un móvil sobre una mesa oscura con un gráfico de bolsa genérico en rojo de alerta y luces rojas y verdes desenfocadas detrás (pantalla retocada y en espejo). |
| `acciones-eeuu` | Un escritorio de operaciones de noche con dos monitores con gráficos de bolsa genéricos (barras y tablas desenfocadas) y las luces de una ciudad detrás. Sustituye, antes de publicarse, a la fachada de columnas, que repetía el motivo de las tarjetas de ofertas. |
| `red-europea` | Una red de líneas de luz que une los edificios de una ciudad europea genérica de noche, vista aérea. |
| `pagares-deuda` | Una hoja en blanco, una pluma y dos tinteros en un escritorio oscuro con un leve brillo esmeralda (etiqueta del tintero desenfocada). |
| `instituciones-ue` | Un edificio institucional europeo moderno de cristal a la hora azul, genérico. |
| `bolsa-madrid` | El horizonte de un distrito de negocios con rascacielos al atardecer, de aire madrileño pero genérico. |
| `pago-online` | Un portátil en una mesa de noche con una página de pago genérica desenfocada (pantalla retocada) y luz cálida. |
| `regulador-espana` | La esquina de piedra de un edificio oficial clásico de aire madrileño de noche, con luz cálida y verde azulada. |

# Fotos de las noticias del sector

Biblioteca reutilizable de fotos editoriales **por tema** para las tarjetas de
noticias de Inicio y de la sección de noticias. Cada noticia elige una clave en
su campo `imagen` (por ejemplo, `"imagen": "alerta-fraude"`). Desde el
14/11/2026 la primera noticia es una portada con la foto grande, y **ninguna
foto se repite en la misma edición** (lo comprueba `revisarEdicion()`): por eso
los temas más usados tienen dos o tres escenas. Cómo se elige la foto de cada
noticia: `GUIA-TITULARES.md`, apartado «4 · La foto».

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
- **Nada de lingotes**: el modelo les graba sellos con letras falsas (2 de 2
  tomas de prueba); para el oro, pepitas.
- **Una foto ya publicada no se cambia bajo la misma clave**, tampoco sus
  variantes de 480 y 960: una toma nueva
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
  `https://rwadar.pages.dev/noticias-editoriales/<clave>.webp` (la app ya
  instalada, siempre esta).
- `fotos/480/<clave>.webp` (480×320, como mucho 60 kB) y
  `fotos/960/<clave>.webp` (960×640, como mucho 120 kB): las variantes, del
  mismo recorte que la de 1200 (no de la de 1200: un paso menos de
  compresión). Se publican en `/noticias-editoriales/480/` y `/960/`; la web
  las elige con `srcset` y `sizes` y la app nueva según la pantalla
  (`anchoFoto()` del modelo). Así una foto de 72 px ya no baja 1200 px.
  `fotos.json` apunta sus bytes y su sha256 en `variantes`.
- `fotos.json`, además: `temas` (la lista cerrada de temas de noticia),
  `temas` de cada foto (de 1 a 3) y `genericas` (la foto de cada categoría
  cuando ningún tema encaja; la usan las noticias automáticas de cada
  mañana). `node rwadar-noticias-editoriales.js --comprobar` lo comprueba
  todo: cada tema con al menos una foto, cada variante con su tamaño, bytes y
  sha256, y nada en `fotos/`, `fotos/480/` ni `fotos/960/` que no sea de la
  biblioteca.
- `fotografiar.py`: genera las tomas con el modelo en el ordenador, sin
  servicios de pago, las recorta y exporta (la de 1200 y sus variantes), y
  apunta semilla, bytes y sha256.
- `GUIA-TITULARES.md`: cómo se escribe un titular y cómo se elige la foto.

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

Con otra versión de Pillow, la misma toma puede dar otros bytes: `--exportar`
de una foto ya publicada tiene que dar el mismo sha256 (si no, no se usa). El
14/11/2026 las 8 publicadas salieron idénticas con Pillow 13.0.0 y de ahí
salieron sus variantes.

Para un tema nuevo: añade su clave en `fotos.json` con `prompt`, `concepto`,
`encuadre`, `temas` y una semilla, genera candidatas, míralas a tamaño
completo y exporta la elegida; añádela a la tabla de `GUIA-TITULARES.md` (una
prueba compara la tabla con `fotos.json`).
Cambiar una foto cambia su `sha256` en `fotos.json`; si ya está publicada, va con otra clave (ver «Reglas»).

## Temas y escenas

23 fotos; cada una cubre de 1 a 3 temas de la lista cerrada de `fotos.json` (`temas`). La tabla de la guía (`GUIA-TITULARES.md`, «4 · La foto») dice qué foto va con cada tema.

| Clave | Temas | Escena |
| --- | --- | --- |
| `alerta-fraude` | Avisos y fraude | Un móvil sobre una mesa oscura con un gráfico de bolsa genérico en rojo de alerta y luces rojas y verdes desenfocadas al fondo. |
| `acciones-eeuu` | Acciones tokenizadas, Bolsas y mercados | Un escritorio de operaciones de noche con dos monitores que muestran gráficos de bolsa genéricos y las luces de una ciudad desenfocadas detrás. |
| `red-europea` | Emisiones e infraestructura, Regulación en la UE | Una red de líneas de luz verde azulada que une los barrios de una ciudad europea genérica de noche, vista desde el aire. |
| `pagares-deuda` | Bonos, pagarés y deuda | Una hoja en blanco, una pluma y dos tinteros sobre un escritorio oscuro de noche, con un leve brillo verde esmeralda. |
| `instituciones-ue` | Regulación en la UE | Un edificio institucional europeo moderno de cristal a la hora azul, genérico y no reconocible. |
| `bolsa-madrid` | Bolsas y mercados | El horizonte de un distrito de negocios con rascacielos al atardecer, de aire madrileño pero genérico. |
| `pago-online` | Pagos y monedas estables, Avisos y fraude | Un portátil sobre una mesa de noche con una página de pago genérica desenfocada y una luz cálida. |
| `regulador-espana` | Regulación en España | La esquina de piedra de un edificio oficial clásico de aire madrileño de noche, con balcones de hierro y luz cálida y verde azulada, genérica. |
| `alerta-fraude-2` | Avisos y fraude | Un móvil con la pantalla rota tirado en el asfalto mojado de noche, con reflejos rojos y verde azulados. |
| `alerta-fraude-3` | Avisos y fraude | Dos luces rojas de aviso en un muro de hormigón verde azulado de noche, reflejadas en el suelo mojado. |
| `regulador-espana-2` | Regulación en España | El gran pasillo vacío de un edificio oficial clásico de noche, con columnas, lámparas de araña y el suelo de mármol brillante. |
| `documentos-consulta` | Consultas y reclamaciones, Regulación en España | Una pila de folios en blanco con unas gafas encima, sobre un escritorio oscuro, bajo una lámpara verde. |
| `instituciones-ue-2` | Regulación en la UE | Una sala de reuniones vacía con una mesa redonda de madera y sillas verde azuladas, con los ventanales a una ciudad de noche. |
| `bonos-emision` | Bonos, pagarés y deuda | Dos pergaminos enrollados y atados con una cinta esmeralda sobre un escritorio de madera oscura. |
| `inmuebles-ciudad` | Inmobiliario | Un edificio de viviendas con balcones y plantas en una calle con árboles, a la hora azul y con las luces encendidas. |
| `inmuebles-costa` | Inmobiliario | Un pueblo de casas blancas en una ladera junto al mar al anochecer, con las ventanas encendidas. |
| `oro-pepitas` | Oro y materias primas | Un montón de pepitas de oro y piedras verde azuladas sobre una pizarra oscura. |
| `moneda-digital` | Pagos y monedas estables | Un disco liso de cristal verde azulado que brilla sobre una superficie negra, con su reflejo. |
| `fondos-liquidez` | Fondos monetarios y del Tesoro | Un puerto deportivo de noche con veleros amarrados y las luces de una ciudad reflejadas en el agua quieta. |
| `acciones-movil` | Acciones tokenizadas | Un móvil tumbado en la mesa de madera de una terraza de noche, con la pantalla de un brillo verde azulado sin nada legible y luces desenfocadas detrás. |
| `banco-sala` | Bancos | El vestíbulo vacío de un edificio clásico de noche, con ventanales en arco, apliques encendidos, una lámpara de araña y el suelo de mármol verde. |
| `servidores-seguridad` | Ciberseguridad | El pasillo de un centro de datos a oscuras, con filas de armarios de servidores y luces de estado verdes y verde azuladas. |
| `planeta-noche` | Internacional | La Tierra de noche vista desde la órbita, con las luces de las ciudades a lo largo de unas costas imaginarias y una fina línea de atmósfera. |

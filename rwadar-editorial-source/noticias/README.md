# Fotos de las noticias del sector

Biblioteca reutilizable de fotos editoriales **por tema** para las tarjetas de
noticias de Inicio y de la sección de noticias. Cada noticia elige una clave en
su campo `imagen` (por ejemplo, `"imagen": "alerta-fraude"`). Desde el
14/11/2026 la primera noticia es una portada con la foto grande, y **ninguna
foto se repite en la misma edición** (lo comprueba `revisarEdicion()`): por eso
los temas más usados tienen dos o tres escenas. Cómo se elige la foto de cada
noticia: `GUIA-TITULARES.md`, apartado «4 · La foto».

Ninguna es una foto de la noticia: ilustran su tema. Desde el 22/11/2026
(«cúrrate más las fotos, que sean reales») la biblioteca admite dos clases
(las fotos reales que hay, en la tabla de `GUIA-TITULARES.md`):

- **Fotos reales con licencia libre de Wikimedia Commons** (las que se
  prefieren): la sede de un supervisor, lingotes de oro, el edificio de una
  bolsa… Llevan `"origen": "foto"` y su crédito. Las trae
  `importar-foto.py` (abajo).
- **Escenas genéricas generadas con IA** (las 23 de antes, que no se tocan):
  de revista financiera, nocturnas o de hora azul, sin texto, logotipos ni
  personas. Solo cuando ninguna foto real encaja.

Lo que se ve en la web y en la app:

- Debajo de cada tarjeta y en el detalle, el **crédito corto**: «Foto: autor ·
  licencia · Wikimedia Commons» (sin autor si es dominio público o CC0), con
  dos enlaces: el nombre de la licencia, a su texto (las CC lo piden; el
  dominio público no tiene), y «Wikimedia Commons», a la página del archivo.
  En el detalle, además, «· recortada» (las 4.0 piden decir si la foto se ha
  modificado: aquí se recorta y se reduce). O «Ilustración generada con IA».
- **Interruptor** `fotos.realesEnApp` en
  `.claude/skills/noticias-automaticas/config.json`: mientras sea `false`,
  ninguna noticia publicada usa una foto real (lo paran el publicador,
  `--comprobar` y la regla V-2), porque la app instalada antes de la OTA con
  los créditos las daría por IA y sin su autor. Se pone a `true`, en un PR
  aparte, después de enviar esa OTA. Importar fotos a la biblioteca sí se
  puede antes.
- Una misma foto de Commons no entra dos veces (ni con el título escrito de
  otro modo ni con los mismos bytes con otro nombre): lo comprueban
  `importar-foto.py` y `rwadar-noticias-editoriales.js`.
- El **texto alternativo** de una foto real es su `descripcion` (en /mercado/ y
  en el detalle; en Inicio la foto va dentro del enlace de la noticia y es
  decorativa: el nombre del enlace es el titular). Las de IA son decorativas.
- La **línea de debajo de la sección** dice la verdad de las fotos que se ven:
  «Fotos de archivo con licencia libre: ilustran el tema, no son de la
  noticia.» si todas son reales; si alguna es de IA, lo dice
  (`notaFotos()` del modelo).
- El crédito no va en las noticias (`noticias-v2.json`: la app ya instalada
  valida sus claves con una lista cerrada y rechazaría una nueva) sino en
  `rwadar-site/datos/fotos-noticias.json`, que se genera de `fotos.json` con
  `node rwadar-noticias-editoriales.js --creditos` y que `--comprobar` y el
  publicador exigen al día. Si ese archivo no llega o no vale, la foto se ve
  sin crédito, **nunca con uno falso**; las de IA siguen diciendo que lo son,
  porque sus claves van en el modelo (`FOTOS_IA`).

## Reglas de las fotos reales

- **Solo de Wikimedia Commons** y solo con estas licencias: dominio público,
  CC0, CC BY 2.0/2.5/3.0/4.0 y CC BY-SA 2.0/2.5/3.0/4.0. Nada «NonFree», ni
  con restricciones de derechos de imagen, ni versiones nacionales de una
  licencia (`importar-foto.py` las rechaza).
- **Que se vea de verdad lo que dice la `descripcion`**, en castellano llano
  («La sede de la CNMV en la calle Edison de Madrid»). Si no estás seguro de
  qué edificio es, no se dice: «Un edificio oficial de Madrid».
- **Sin personas reconocibles** (`"sinPersonas": true`): quien importa la
  mira a tamaño completo antes de usarla.
- Sin retoques: solo el recorte 3:2 (`encuadre`) y el cambio de tamaño.
- El crédito es el que pide la licencia, tal cual (`autor`, sin HTML).
- Una foto real nunca se presenta como foto del hecho: ilustra el tema.

## Reglas de las escenas de IA

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

- `fotos.json` (`versionEsquema` 2; el 1 solo admitía escenas de IA y el
  comprobador acepta los dos): por clave, una de estas dos formas.
  - **Foto real**: `origen` (`"foto"`), `descripcion` (lo que de verdad se
    ve; texto alternativo), `fuente` (`sitio`: `"Wikimedia Commons"`,
    `archivo`: `"File:…"`, `pagina`: la página del archivo en
    `https://commons.wikimedia.org/wiki/File:…`, `original`: la URL del
    archivo descargado en `upload.wikimedia.org`, `sha256Original`),
    `licencia` (`nombre`, `url` de la licencia, `null` en dominio público, y
    `atribucionObligatoria`), `autor` (el texto de autoría que pide la
    licencia, tal cual; `null` en dominio público o CC0), `sinPersonas`
    (`true`), `encuadre`, `temas`, `bytes`, `sha256` y `variantes`. Sin
    `modelo`, `prompt`, `semilla`, `concepto` ni `retoque`.
  - **Escena de IA** (sin `origen`): lo de siempre, abajo.
- `importar-foto.py`: trae una foto real de Commons (ver «Cómo se importa
  una foto real»). Su prueba sin red: `probar-importar-foto.py` (va en `npm test`, dentro de `probar-web.mjs`).
- `rwadar-site/datos/fotos-noticias.json`: el crédito de cada clave, generado
  de `fotos.json` (no se edita a mano).
- Escenas de IA en `fotos.json`: el modelo (`realvisxl`: RealVisXL V5.0 Lightning, licencia
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

## Cómo se importa una foto real

Necesita Python 3 y Pillow con WebP. Lo descargado se queda en `--trabajo`,
**fuera del repositorio**.

```
python3 rwadar-editorial-source/noticias/importar-foto.py --clave cnmv-sede \
  --archivo "File:Nombre exacto en Commons.jpg" --temas regulacion-espana \
  --descripcion "La sede de la CNMV en la calle Edison de Madrid" \
  --encuadre "60% 50%" --trabajo /tmp/fotos-commons
```

Pide los datos a la API de Commons (con el agente de usuario genérico
`editorial-photo-import/1.0` y una pausa entre peticiones; si Commons pide
calma, espera lo que diga), comprueba la licencia, descarga el original (o la
miniatura de 2400 px si es enorme o no es JPEG, PNG ni WebP), exige un recorte
3:2 de al menos 1200×800 útiles, exporta los tres WebP sin metadatos bajando la
calidad hasta que quepan, añade la entrada a `fotos.json` (nunca pisa una clave
ni un archivo que ya existan) y regenera `fotos-noticias.json`. Después: **mírala**
a tamaño completo, añade la clave a la tabla de `GUIA-TITULARES.md` y
`node rwadar-noticias-editoriales.js --comprobar`. Las mañanas automáticas
nunca importan ni generan fotos.

## Licencia y transparencia (escenas de IA)

RealVisXL V5.0 Lightning se distribuye con la licencia CreativeML Open RAIL++-M.
Su anexo A prohíbe, entre otros usos, generar contenido para engañar o
desinformar, suplantar a personas, difamar, o dar consejo médico o jurídico
automatizado. Aquí solo se generan escenas genéricas, sin personas ni marcas,
que acompañan a un titular verificado. Los WebP **no llevan marca legible por
máquina** (ni C2PA ni el `trainedAlgorithmicMedia` de IPTC: se exportan sin
metadatos). La transparencia es lo visible: «Ilustración generada con IA» en
cada una, la línea de debajo de las tarjetas y este archivo.

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

Las 23 escenas de IA (las fotos reales se apuntan en la tabla de
`GUIA-TITULARES.md`, «4 · La foto», al importarlas); cada una cubre de 1 a 3 temas de la lista cerrada de `fotos.json` (`temas`). La tabla de la guía (`GUIA-TITULARES.md`, «4 · La foto») dice qué foto va con cada tema.

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

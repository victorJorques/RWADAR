# RWAdar · estado del proyecto

> Documento de traspaso. Léelo entero antes de tocar nada: hay decisiones
> que parecen arbitrarias y no lo son, y dos o tres trampas que ya nos
> costaron tiempo una vez.
>
> **Este documento explica el POR QUÉ. Para el DÓNDE —en qué punto exacto
> del `index.html` está cada cosa— está `RWADAR-MAPA.md`, y conviene leerlo
> antes de abrir el archivo: son 246 kB en una sola pieza.**

## Índice · lee solo el tramo que necesites

Entero cuesta ~6.000 tokens. Casi nunca hace falta. Cada fila da la marca
que se busca con grep y el tramo aproximado, para leerlo con
`Read offset/limit`.

> **Antes que nada: si el trabajo va de cuentas, opiniones, moderación o de
> la base en línea, empieza por `RWADAR-MANANA.md`.** Producción no coincide
> con el repositorio y ese documento tiene el contrato real, medido.

| Necesito | Marca de búsqueda | ~líneas |
|---|---|---|
| Qué es, direcciones y qué archivo es cada cosa | `## Qué es` | 71-123 |
| **Estado y qué bloquea el avance** | `## Estado a 14` | 124-156 |
| Cómo cambiar contenido, publicar, probar | `## Cómo se trabaja` | 157-247 |
| ↳ avisar a los buscadores (IndexNow) | `## Avisar a los buscadores` | ~215 |
| ↳ volver atrás si algo sale mal | `## Volver atrás` | ~230 |
| ↳ si algún día hay dominio propio | `## Si algún día se registra` | ~236 |
| **Decisiones que no conviene deshacer** | `## Decisiones que conviene` | 248-535 |
| ↳ pre-renderizado y SEO | `va pre-renderizado` | ~253 |
| ↳ descartadas: el listón | `listón alto` | ~258 |
| ↳ **un estudio no es una fuente** | `un estudio no es una fuente` | ~267 |
| ↳ el dibujo 3D: por qué un edificio | `un EDIFICIO, no una metáfora` | ~296 |
| ↳ trampas del edificio (NaN, z-fighting…) | `Cuatro trampas del edificio` | ~333 |
| ↳ reflejo, sombra y suelo | `Tres cosas del render` | ~351 |
| ↳ el radar de portada | `no es un adorno` | ~363 |
| ↳ la calculadora | `enseña la cuenta` | ~382 |
| ↳ **sonido**: carácter y motivos | `La altura SUBE, no baja` | ~393 |
| ↳ sonido: nada de DynamicsCompressor | `DynamicsCompressor` | ~435 |
| ↳ **color**: los dos errores previos | `el verde de un eco de radar` | ~450 |
| ↳ color: distancias medidas en Lab | `medidas en Lab` | ~479 |
| ↳ tipografía | `tipografía de Apple` | ~484 |
| ↳ por qué la app no es la web envuelta | `la web envuelta` | ~489 |
| **Trampas que costaron tiempo** | `## Trampas que ya nos costaron` | 536-578 |
| Qué hacer a continuación | `## Lo siguiente` | 579-596 |

Última revisión: 8 de agosto de 2026.

**Rediseño de agosto de 2026, publicado el día 8.** La web pasó de papel
—fondo crema, tinta azul, verde menta— a instrumento: fondo de noche cálido,
el verde de un eco de radar como color de marca y el contenido emitiendo luz
propia. Con el cambio de piel entraron:

- un **dibujo 3D nuevo**: un rascacielos de 885 paneles de fachada con las
  ventanas encendidas, sobre cristal negro, con reflejo, sombra de contacto
  y viñeta — en lugar de la torre de cubos flotando en el vacío. Pasó por un
  panal de fichas hexagonales por el camino;
- el **radar de portada**: el registro entero dibujado como radar, con cada
  plataforma como un punto que se puede pulsar y una lectura al pasar por
  encima;
- la **calculadora** del explicador, con la cuenta a la vista paso a paso y
  la rentabilidad recibida;
- el explicador **reescrito sin tecnicismos**;
- el **sonido rehecho tres veces** hasta dar con el carácter (familia «pop»,
  la altura sube), elegido a oído en un banco de pruebas;
- la **paleta**, que llegó a su sitio por descarte: crema y azul → negro y
  oro (falso premium) → monocromo (soso) → verde de radar con grises
  cálidos;
- la **imagen de vista previa** (`og.png`), regenerada con la identidad
  nueva y con el radar de datos reales dentro.

Nada de eso tocó los datos ni el flujo de publicación.

---

## Qué es

Un registro curado de plataformas de tokenización de activos reales (RWA).
Analiza 38, publica las 26 que superan cuatro criterios de fiabilidad, y
señala los descartes **solo cuando el motivo se puede respaldar con una
fuente citable**.

Existe como **web pública** y como **app móvil**, ambas alimentadas por la
misma base de datos.

---

## Dónde está cada cosa

| Pieza | Dirección |
|---|---|
| Web | https://rwadar.netlify.app |
| Panel de Netlify | https://app.netlify.com/projects/rwadar |
| Base de datos | https://supabase.com/dashboard/project/exgpmjpaaebyoolpwced |
| Search Console | https://search.google.com/search-console (propiedad verificada) |

```
Downloads/
  rwadar-site/                  La web. Se sube tal cual: 10 archivos, ni uno más
  rwadar-app/                   Esquema de la base de datos y utilidades de datos
  rwadar-movil/                 App en React Native / Expo
  rwadar-arrancar.js            Diagnóstico de todo + servidor local. Empieza aquí
  rwadar-publicar.js            Sincroniza + pre-renderiza + publica la web
  rwadar-servir.js              Servidor local en :4173 (lo levanta el anterior)
  rwadar-banco-de-sonidos.html  Banco de pruebas de sonido, servido en /banco
  RWADAR-ESTADO.md              Este archivo: el porqué
  RWADAR-MAPA.md                El dónde: en qué punto del HTML está cada cosa
```

Nada fuera de `rwadar-site/` se publica, y es a propósito: el servidor, el
banco de sonidos y la documentación viven fuera para que no acaben en
internet.

### Identificadores

```
Netlify site   : 0211fd28-d371-43cd-9d93-3944fea57680
Supabase ref   : exgpmjpaaebyoolpwced
Supabase URL   : https://exgpmjpaaebyoolpwced.supabase.co
Clave pública  : sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F
```

La clave pública va dentro de la web y de la app **a propósito**: es pública
por diseño y no concede escritura. Comprobado contra el servidor: un INSERT
con ella devuelve 401.

---

## Estado a 14 de agosto de 2026

| Fase | Estado |
|---|---|
| Web pública | **Terminada y en línea**, auditada de punta a punta |
| Base de datos | **Terminada**: 26 + 4 fichas, 10 fuentes, 12 políticas |
| Cuentas, opiniones y moderación | **En producción**, `20/0` contra la base real |
| Rigor editorial | **Terminado**: cero descartes sin fuente |
| Google | Verificado, sitemap leído, IndexNow avisado, **un enlace entrante** |
| Repositorio público | github.com/victorJorques/RWADAR |
| App móvil | **Terminada**: radar nativo, explicador 3D, logotipo, `10/0` de datos |
| Reparto de avisos push | **Encendido en producción** |
| Auto-actualización de la app | **Montada y probada** (EAS Update) |
| Tiendas | **Bloqueado**: requiere cuentas de desarrollador |
| Correos de aviso | Instalado; espera la clave de Brevo en el vault |

### Lo único que bloquea el avance

Dos cuentas que solo puede abrir una persona con identidad y medio de pago.
La de Expo, que antes estaba en esta lista, ya existe (`trapis-team`), y con
ella el `projectId` `43de8651-0c57-40fc-8cdb-c9a8c72e6835`.

1. **Google Play Console** (25 $, pago único) — el AAB está compilado y
   firmado, esperando.
2. **Apple Developer** (99 $/año) — y ojo: **el archivo de iOS no se puede
   compilar en Windows**. Hace falta la compilación en la nube de EAS, que ya
   está configurada.

```bash
cd rwadar-movil
npx eas build --platform android --profile preview      # APK instalable, sin tienda
npx eas build --platform android --profile production   # AAB para Google Play
npx eas build --platform ios --profile production       # exige la cuenta de Apple
npx eas submit --platform android
```

### Una advertencia sobre este documento

**Producción se desvió del repositorio y este documento no lo sabía.** El 14 de
agosto se descubrió que la base en línea prohíbe escribir opiniones
directamente, tiene una columna que el esquema del repositorio no conoce y
había perdido permisos de tabla — nada de eso se veía leyendo el código, y las
pruebas locales pasaban en verde mientras la web estaba rota para todo el
mundo.

La lección, que vale para cualquiera que siga: **contra producción se mide, no
se supone.** Está en `RWADAR-MANANA.md`, con el contrato real y los comandos.

---

## Cómo se trabaja

### Cambiar contenido

**La fuente de verdad es Supabase, no el HTML.** Se edita la tabla
`plataformas` en el panel. Si editas los arrays de `index.html` a mano, la
siguiente publicación los sobrescribe.

Los visitantes ven el cambio **al momento**: la web consulta la base al
cargar y se actualiza sola si algo cambió desde la última publicación.

### Publicar la web

```bash
node rwadar-publicar.js
```

Hace tres cosas seguidas: trae el contenido de Supabase, escribe las fichas
dentro del HTML para que Google las lea sin ejecutar JavaScript, y sube el
sitio.

**Nunca uses `netlify deploy` a secas.** Sin el pre-renderizado la página
queda vacía para el buscador, que es un problema que ya arreglamos una vez.

### Probar la app

```bash
cd rwadar-movil && npx expo start
```
Escanear el QR con **Expo Go**. Añadir `--web` para verla en el ordenador.

### Tocar el esquema de la base

Requiere un token personal de Supabase (se genera en *Account → Access
Tokens*, y conviene revocarlo al terminar):

```bash
cd rwadar-app
instalar-base-de-datos.cmd sbp_...
```

Aplica `db/01_schema.sql` … `db/04_rls.sql` en orden. Son la instalación
entera y la única fuente de verdad del esquema: no hay ningún fichero
"todo en uno", porque el que había se quedó atrás sin que nadie lo notara.

Antes de tocar producción, las pruebas corren contra un Postgres real
embebido, sin instalar nada:

```bash
cd rwadar-app && npm install && node probar-db.mjs
```

Y para que el fichero de instalación no se separe de la base real:

```bash
node volcar-seed.js
```

### Avisar a los buscadores tras publicar

Google va por Search Console: *Inspección de URLs* → pegar la dirección →
**Solicitar indexación**. Hay cuota diaria; si dice "Cuota superada", al día
siguiente.

Al resto —Bing, Yandex, Seznam, Naver, Yep— se les avisa de una vez con
IndexNow. La llave es el archivo de nombre raro de `rwadar-site/`:

```bash
curl -X POST "https://api.indexnow.org/indexnow" -H "Content-Type: application/json" -d "{\"host\":\"rwadar.netlify.app\",\"key\":\"c9417d2d5003bb9a41fee63c7f5ec00f\",\"keyLocation\":\"https://rwadar.netlify.app/c9417d2d5003bb9a41fee63c7f5ec00f.txt\",\"urlList\":[\"https://rwadar.netlify.app/\"]}"
```

Un `202` es aceptado.

### Volver atrás si algo sale mal

https://app.netlify.com/projects/rwadar → pestaña **Deploys** → abrir una
versión anterior → *Publish deploy*. El sitio vuelve a como estaba sin tocar
nada en el ordenador. No hay forma de romper la página de manera permanente.

### Si algún día se registra un dominio propio

`rwadar.com` no está registrado: se comprobó y no resuelve. Por eso el sitio
se identifica ante Google como `rwadar.netlify.app`.

Al añadirlo en *Domain settings* hay que sustituir `https://rwadar.netlify.app`
por el dominio nuevo en tres sitios —`index.html` (14 apariciones),
`robots.txt` y `sitemap.xml`— y volver a publicar. Si el sitio dice ser una
dirección y vive en otra, Google indexa la equivocada.

---

## Decisiones que conviene no deshacer

**El contenido va pre-renderizado en el HTML.** Todo vive en un array de
JavaScript; sin pre-renderizar, el robot de Google veía 438 palabras en vez
de 1.936. Es la diferencia entre indexar una página con contenido y una
vacía.

**La lista de descartadas tiene un listón alto.** Solo aparece una empresa
señalada si el motivo se respalda con fuente citable. Se retiraron ocho que
eran juicio de valor ("escala pequeña", "poca transparencia", "nicho").
Entre ellas Kinesis, cuya crítica sobre auditorías es de 2021, procede de un
blog enmarcado en una disputa por difamación y quedó desmentida por
auditorías posteriores.

`select * from descartadas_sin_fuente` **debe devolver cero filas siempre.**
Es lo primero que hay que mirar antes de enviar una versión a las tiendas:
Apple y Google retiran de inmediato ante la reclamación de una empresa
nombrada.

**El mismo listón vale para lo que ENTRA, y por eso un estudio no es una
fuente.** El 8 de agosto de 2026 entraron Archax y Republic a partir de un
estudio externo del top 10 de plataformas RWA
(`Documents/Codex/2026-08-08/ha/outputs/`). El estudio sirvió para saber a
quién mirar —de sus diez, ocho ya estaban en el radar, lo que confirma que
la selección aguanta—, pero **ni un dato suyo se publicó tal cual**:

- sus puntuaciones (Securitize 94, etc.) se citan a sí mismas: la fuente
  que declaran es una tabla que el propio documento genera;
- la fuente de casi cada plataforma es la web de esa plataforma, o sea
  información autodeclarada, cosa que el propio estudio admite;
- son 20 enlaces externos para 40 secciones.

Los dos avales se comprobaron contra el regulador que los emite: Archax en
el registro de la FCA (FRN 838656, permiso de MTF, registro de
criptoactivos) y Republic en SEC y FINRA (OpenDeal Portal LLC como portal
de financiación, OpenDeal Broker LLC como bróker-dealer). La nota de
Republic dice lo que el usuario **no** compra —sus Mirror Tokens son
pagarés de la propia Republic, no acciones de la empresa que replican— y
eso es deliberado: un registro que presume de decir qué compras de verdad
no puede callarse justamente ahí.

El SQL de esa alta está en `rwadar-app/db/06_archax_republic.sql`, es
idempotente y se probó contra un Postgres embebido antes de tocar
producción.

**La retícula del explicador es uniforme.** Si las piezas fueran desiguales
no serían participaciones y el dibujo contradiría al texto.

**El dibujo es un EDIFICIO, no una metáfora.** Antes era un panal plano de
fichas hexagonales: se veía bien y explicaba mal. Una moneda partida en
gajos es una metáfora que hay que traducir — mientras el texto habla de un
local, de inquilinos y de un alquiler, el dibujo enseñaba galletas. Ahora
el activo es un **rascacielos de 885 paneles de fachada**, de pie sobre el
cristal negro. Cada panel es una participación.

La primera versión del edificio parecía un montón de piezas de Lego y se
quedó en un 6. Lo que la sacó de ahí fueron cuatro decisiones, y ninguna es
un ajuste fino:

1. **Proporción.** Torre esbelta (25 plantas sobre una base de siete metros)
   y paneles **altos y estrechos**, 0,62 × 1,0, como el despiece de un muro
   cortina de verdad. Con paneles cuadrados sobre una caja rechoncha no hay
   iluminación que salve el resultado: se lee como cubos apilados. El cuarto
   cuerpo es la **corona**: sin remate, la torre termina de golpe.
2. **Ventanas encendidas.** Una de cada cuatro emite luz propia. Es lo que
   convierte un volumen en un edificio habitado, y lo que hace que apetezca.
   Además explica la idea sin una palabra: entero, todas las ventanas son
   del mismo oro; repartido, cada ventana brilla del color de su dueño.
   **Solo se enciende el vidrio, no el marco** — se distingue comparando la
   normal del fragmento con la dirección del panel (`vFwd`). Encendiendo el
   panel entero parece una bombilla, no una ventana.
3. **Oro que parece oro.** Reflejo de entorno fuerte, especular apretado y
   **ambiente bajo**. Un ambiente alto ilumina por igual la cara que da a la
   luz y la que no, el volumen desaparece y la torre queda como una silueta
   plana recortada.
4. **Formato vertical.** El lienzo pasó a ser más alto que ancho. En un
   lienzo apaisado una torre deja medio cuadro negro a cada lado por mucho
   que se acerque la cámara: el formato tiene que seguir al motivo.

En el último paso unos cuantos paneles se intercambian **en cadena** —cada
uno al hueco del siguiente, así no queda ningún hueco vacío— y doce salen a
orbitar la torre: son las participaciones que están en el mercado ahora
mismo. Doce de 353 es un 4 %: se ven, y no desmontan nada. Que la silueta
aguante es el mensaje entero: vender tu parte no tira el edificio.

**Cuatro trampas del edificio, todas encontradas mirando el render:**

1. *El retardo de entrada se calcula desde `celdas[i].p[1]`.* Al pasar de
   panal a edificio, `celdas` dejó de ser pares `[x,z]` para ser objetos
   `{p,r}`, y el cálculo seguía leyendo `celdas[i][0]`. Eso metía **NaN** en
   el atributo de instancia. Un NaN ahí no rompe nada visible: cada panel
   interpola por su cuenta y la fachada aparece desalineada al azar. Costó
   media tarde porque parecía un problema de colocación.
2. *Cada panel va en el PLANO de su fachada* (`r+0,5`), no en el centro de
   su celda. En el centro, las cuatro paredes no casan en las esquinas.
3. *`TAM[0] = 0,97`: ni tocarse ni solaparse.* Solapados se ven todas las
   intersecciones y la fachada queda como un empedrado; tocándose justo,
   las caras laterales contiguas quedan coplanarias y pelean por la
   profundidad. Con 0,97 queda el despiece limpio de un muro cortina.
4. *La cámara no puede bajar de ~10°.* A cuatro grados la fachada se ve tan
   rasante que los paneles se tapan unos a otros y la torre parece un
   derrumbe. El ángulo bajo era heroico y también ilegible.

**Tres cosas del render que costaron encontrar y no conviene deshacer:**

1. *Las fichas se apoyan en el suelo* (`SUELO_Y = −0,72`). Flotando a −4,4 su
   reflejo se leía como un segundo objeto ahí abajo. Un reflejo solo
   convence cuando el objeto lo toca.
2. *El reflejo espeja la posición pero NO la normal.* Volteándola también,
   las caras de abajo miraban a la luz principal y el reflejo salía
   encendido, con la retícula marcada como un tablero de ajedrez.
3. *En el estado macizo `TAM[0]` tiene que ser ≥ 1/(1−bisel).* Con un bisel
   de 0,085 eso son 1,093; por debajo queda un surco entre fichas,
   invisible por arriba y clarísimo en el reflejo.

**El radar de portada no es un adorno.** Sale de la misma lista `P` que las
fichas, se repinta cuando la base de datos cambia y cada punto abre su
ficha. El ángulo es el tipo de activo y el radio, a quién deja entrar: las
abiertas a cualquiera caen cerca del centro. Además:

- pasar por encima o tabular escribe la plataforma en el panel de lectura
  de abajo — sin eso el radar es bonito y mudo, y hay que abrir puntos al
  azar para saber qué son;
- el rótulo de cada sector va **del color de su categoría**, y con eso el
  radar gana la leyenda que le faltaba;
- pulsar ese rótulo filtra la lista de abajo y baja hasta ella: el dibujo
  es también el índice;
- los halos se encienden al paso del barrido con un retardo negativo por
  punto calculado desde su ángulo, medido **desde el eje +X**, igual que la
  rotación del barrido: sumarle 90 por empezar los sectores arriba los
  desfasa un cuarto de vuelta;
- el lienzo va con `viewBox="-30 0 460 400"` para que «Infraestructura»
  quepa entero fuera del círculo sin abreviaturas.

**La calculadora del explicador enseña la cuenta, no solo el resultado.**
Local de 300.000 € partido en 3.000 trozos de 100 €, con dos barras: cuánto
pones y cuánto renta el local. Debajo, las cuatro operaciones a la vista,
una por línea, para que cualquiera pueda rehacerlas con los dedos. El
remate es el que de verdad enseña algo: **la rentabilidad no cambia con lo
que pongas** —un 6 % es un 6 % con 100 € y con 10.000 €—, y lo único que
cambia es cuánto cobras. Eso es exactamente lo que se compra con un trozo:
la misma proporción que el dueño de al lado. Lleva su aviso de que es el
bruto, antes de comisiones e impuestos, y de que no es una oferta ni una
previsión. Ese aviso no se quita.

**La altura SUBE, no baja.** Es la decisión que define el carácter del
sonido y se tomó **a oído**, comparando cinco familias en un banco de
pruebas (`rwadar-banco-de-sonidos.html`, servido en `/banco`). Un tono que
cae suena a algo que se posa; uno que sube en cincuenta milisegundos suena
a algo que se suelta. La segunda sensación es la que engancha, y es la del
«pop» de enviar un mensaje en un Mac. Todo el juego está montado sobre ese
gesto ascendente, con dos excepciones que significan lo contrario: cerrar
baja, y desmarcar baja.

Ese banco de pruebas **no se borra**. Yo puedo medir el sonido —pico,
espectro, duración, chasquidos— pero no oírlo, así que la única forma de
decidir el carácter es que lo escuche una persona. Si algún día hay que
volver a tocarlo, se añade una familia más y se compara.

**Los sonidos son TONOS cortos, no golpes de ruido.**
Esto corrige una decisión anterior de este mismo documento, que decía
«golpes de material, nunca notas». Aquella regla nació de huir del tono
puro sostenido —que efectivamente suena a juguete— pero la conclusión era
demasiado amplia, y la receta que la sustituía (ruido blanco por un paso
banda de Q alto) es un resonador metálico: todo el registro caía entre 2 y
4 kHz, justo donde el oído es más sensible y antes se cansa. Sonaba tosco,
y cuanto más se subía, más chillaba.

La receta actual es la que usa cualquiera que hace esto bien:

- **tono, no ruido**: un seno con una caída de altura mínima;
- **grave de salida**: arrancan entre 260 y 700 Hz y suben hasta su octava
  en unos 30 ms. Medido por cruces por cero, el `toque` pasa de 625 Hz a
  los 25 ms a 856 Hz a los 45 ms, y `cerrar` hace el camino inverso, de
  562 a 428. Nada vive por encima de 3 kHz, que es donde chillaba antes;
- **cortos**: entre 22 y 105 ms las pulsaciones. La versión anterior
  llegaba a 220 ms y por eso sonaba a xilófono en vez de a interfaz;
- **sin chasquido**: el ataque es un coseno elevado vía
  `setValueCurveAtTime`, no una rampa. Una rampa recta deja un quiebre en
  la derivada y el oído lo oye como un «clac»;
- **una sola familia**: todo sale del mismo timbre y de una escala
  pentatónica, así que dos sonidos seguidos nunca disuenan. Hay altura
  distinta solo cuando significa algo: marcar sube, desmarcar baja, y cada
  categoría tiene su nota de la misma escala.
- **±1,2 % de desafinación por pulsación**: inaudible como nota, decisivo
  como sensación. Dos toques idénticos delatan una grabación.

**El sonido NO puede pasar por un `DynamicsCompressor`.** Parece la pieza
obvia para no saturar y es justo la que lo arruinaba: tiene detector de
envolvente y un sonido de interfaz dura milisegundos. Medido en el propio
grafo, un transitorio de 0,30 salía a 0,074. En su lugar va un `WaveShaper`
con una curva que es una recta por debajo de 0,6 y se dobla por encima:
recorta sin detector y sin tocar los transitorios. Detrás va un paso bajo a
7 kHz, que es lo que separa «sonido de interfaz» de «pitido de
electrodoméstico».

**Los picos están medidos, no elegidos a ojo.** Todos entre 0,09 y 0,27, sin
recorte. La comprobación se hace renderizando el mismo grafo en un
`OfflineAudioContext` y midiendo pico, duración, reparto por bandas y saltos
entre muestras (un chasquido es una discontinuidad aislada; muchos saltos
repartidos son solo el aire del sonido).

**El color de RWAdar es `#25E39A`, el verde de un eco de radar.**
Esta decisión pasó por dos errores antes de asentarse, y los dos enseñan
algo:

1. *Negro y oro* (agosto, primera versión oscura). Error de fondo: oro
   sobre negro es el atajo más repetido para **aparentar** lujo —el de las
   landings de cripto y el de los relojes de imitación—, así que se lee como
   «esto quiere parecer caro». En una web cuyo argumento entero es la
   credibilidad, juega en contra de lo que dice el texto.
2. *Monocromo total.* Al quitar el oro se quitó también toda la identidad:
   logotipo en blanco y negro, ni un acento. Quedó correcta y **sosa**. La
   lección: quitar el color que sobra no es lo mismo que quedarse sin color.
   Una marca necesita uno propio; lo que no necesita es uno que grite.

El verde de radar resuelve las dos cosas: es lo que la marca dice ser —un
instrumento que detecta—, tiene 11,8:1 de contraste sobre el fondo, y es
exactamente lo contrario del oro: no intenta parecer caro, intenta parecer
preciso.

**Dónde va y dónde no.** La señal está en el logotipo, los rótulos, la
acción principal, los enlaces y el foco. En ningún otro sitio. **El resto
del color de la página lo ponen los datos**: las seis categorías de activo,
más la propia señal para «verificado» (es la promesa de la marca, no un
color aparte) y el rojo para «descartada».

**Los grises son CÁLIDOS**, no neutros ni azulados. Es el cambio que más se
nota al leer: un secundario gris neutro sobre negro se lee apagado y cansa;
el mismo valor tirando a tierra se lee cómodo.

**Las distancias entre colores están medidas en Lab, no juzgadas a ojo.**
Mirando el radar habría jurado que el problema era azul contra cian —y están
a 54 de distancia, de sobra—. El choque real era el naranja de «materias
primas» contra el coral de «descartada», a 22,9: una categoría confundible
con una advertencia. Pasando el aviso a rojo puro (`#FF3B30`) la distancia
sube a 34,5. Ampliar la búsqueda no compensa: con ocho colores simultáneos
sobre negro el espacio ya está lleno, y el óptimo global solo ganaba 3
puntos a cambio de un amarillo pálido ilegible.

**La torre del explicador es de piedra clara**, no de oro: una torre dorada
pedía una interfaz dorada. En piedra con las ventanas encendidas en cálido
parece un edificio de noche de verdad, y el salto a los colores de dueño es
mucho más fuerte saliendo de un neutro.

**Los puntos del radar están colocados por búsqueda, no a ojo.** Se recorre
el espacio de (apertura del sector, escalón radial) midiendo la distancia
mínima entre puntos, con dos límites duros: la apertura no puede pasar de
56° o algún punto se sale de su sector y parece de otra categoría, y el
escalón no puede pasar de 0,12 o invade el anillo de al lado y se pierde la
lectura de «distancia = a quién deja entrar». El óptimo dentro de eso deja
11,2 unidades entre los dos puntos más juntos, frente a 9,4 antes. El azar
sobra: jitter 0 gana a cualquier jitter, porque desordena sin separar.

**Cada paso del dibujo suena UNA vez, como una gota.** Antes cada paso
disparaba una ráfaga —cinco chispas, cuatro destellos, dos roces— y sonaba a
fuegos artificiales y a algo que se alargaba. Un explicador que avanza solo
no puede sonar sostenido: la atención se va al sonido en vez de al dibujo.
Una gota es un tono que sube muy rápido de altura y se apaga: medido, 76 ms
subiendo de 567 a 1036 Hz. Esa subida rápida es lo que el oído reconoce como
gota — es la resonancia de la cavidad al cerrarse.

**Las tipografías van dentro del archivo, no se piden a Google.** Antes la
página cargaba nueve ficheros estáticos desde `fonts.googleapis.com`: 138 kB,
una petición bloqueante y, sobre todo, la IP de cada visitante viajando a un
tercero — algo difícil de defender en un sitio dirigido a inversores
españoles y contradictorio con el cuidado legal del resto del proyecto. Ahora
van las dos **versiones variables** incrustadas en base64: 30 kB para todo el
rango de peso de ambas familias, cero terceros y sin salto de tipografía al
cargar. De paso murió una falsa negrita: se usaba Geist Mono 700 sin haberla
pedido nunca y el navegador la fabricaba estirando la 600.

Cuesta 41 kB de HTML y los ahorra de red. Geist es de Vercel con licencia SIL
Open Font 1.1, que permite incrustarla; conviene no perder esa nota si el
proyecto cambia de manos.

**La tipografía de Apple no se puede usar.** San Francisco tiene licencia
restringida a interfaces de sus propias plataformas. Se usa Geist, libre y
de la misma familia visual, con `system-ui` de respaldo: en un iPhone cae en
San Francisco de forma legítima.

**La app no puede ser la web envuelta.** Apple rechaza eso por su directriz
4.2. Lo que la justifica como producto propio son los avisos cuando una
plataforma cae del radar, el funcionamiento sin conexión y que seguir no
exija registrarse.

**Pero el explicador 3D SÍ se reutiliza de la web, y es deliberado.** La app
lo abre embebido, apuntando a la sección `#explain` de la página publicada.

El motivo no es la pereza: es que la alternativa ya falló. La app nació en
agosto con su propio explicador —bloques animados en vez de WebGL— y con su
propia paleta. Cuando la web se rediseñó el día 8, la app **se quedó atrás sin
que nadie lo notara durante seis días**: seguía en crema y azul marino, sin
radar y sin edificio. Dos implementaciones del mismo dibujo divergen; es
cuestión de tiempo.

Reutilizando, el edificio de la app es el edificio de la web por construcción,
y con él entran gratis los cuatro pasos, la calculadora y sus avisos legales.
Si mañana cambia el 3D, cambia en los dos sitios a la vez.

Lo que sí se porta a nativo es lo barato y lo que tiene que ir suelto: **el
radar de portada** (SVG, con las mismas cifras medidas) y **el logotipo**. La
lista, el buscador, los filtros, la caché y el seguimiento siempre fueron
nativos.

**El explicador nativo no se borra**: es lo que se enseña sin conexión, y la
app promete funcionar sin conexión.

---

## Trampas que ya nos costaron tiempo

**Netlify rechaza a veces la publicación directa** con un `Forbidden`
mientras sigue aceptando borradores. `rwadar-publicar.js` lo detecta solo:
sube como borrador y lo promueve. Si ves *"La publicacion directa fue
rechazada"* seguido de *"Promovido a produccion"*, todo ha ido bien.

**Las capturas de pantalla mienten con las animaciones.** Ni el modo sin
ventana ni el panel de vista previa ejecutan fotogramas de forma fiable: el
modo virtual da un solo fotograma y el panel no compone nada — ahí
`requestAnimationFrame` **no se dispara ni una vez**. Perseguí un fallo
inexistente en el 3D durante un buen rato por fiarme de ellas.

La forma que sí funciona, y que está preparada en el código:

```js
window.__gl3d.pinta(t)   // dibuja UN fotograma con la marca de tiempo que le des
```

Llamándolo en bucle con tiempos crecientes se avanza la animación a mano.
Después, `gl.readPixels` sobre el lienzo da los píxeles reales, y
`node rwadar-servir.js` acepta un POST en `/guardar?n=algo.png` para
escribirlos en disco y poder mirarlos. Así se comprobaron los cuatro pasos
del explicador.

**El sonido también se comprueba sin altavoces.** El mismo grafo se
reconstruye en un `OfflineAudioContext` (sustituyendo `window.AudioContext`
antes del primer sonido) y `startRendering()` devuelve las muestras exactas.
Con `c.suspend(t)` se dispara un sonido distinto en cada segundo y se miden
todos los picos de una vez. No hace falta gesto del usuario.

**No borres la etiqueta de Google** (`google-site-verification` en el
`<head>`) ni el archivo `google6b2e3e5f58b7e557.html`. Si desaparecen,
Google revoca la verificación.

**Tampoco borres** `c9417d2d5003bb9a41fee63c7f5ec00f.txt`: es la llave de
IndexNow, que avisa a Bing, Yandex y compañía.

**No escribas ficheros con `Set-Content` de PowerShell**: mete BOM y rompe
los JSON.

---

## Lo siguiente, por orden de rendimiento

1. **Abrir las tres cuentas** y publicar la app. Es lo único que separa el
   proyecto de estar terminado.
2. **El envío real de los avisos.** La base ya sabe a quién avisar (vista
   `avisos_pendientes`, probada en producción). Falta el proceso que la lea
   y llame a la API de Expo Push: una función programada de Supabase, media
   hora, y tiene sentido cuando exista el `projectId`.
3. **Conseguir un enlace entrante.** Search Console dice *"Página de
   referencia: no se ha detectado ninguna"*. Sin un solo enlace, el sitio es
   una isla y el sitemap es su único camino. Un enlace desde un sitio que
   Google ya visita a diario vale más que cualquier ajuste.
4. **Automatizar la publicación** conectando el proyecto a un repositorio de
   GitHub, para que Netlify construya solo. Requiere cuenta de GitHub.

**Nunca sembrar enlaces en foros y directorios.** Google lo llama *esquema
de enlaces*, lo detecta y el castigo es que el sitio entero baje o
desaparezca. Es la forma más rápida de conseguir lo contrario de lo que se
busca.

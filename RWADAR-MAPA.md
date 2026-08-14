# RWAdar · mapa de navegación

> **Léeme antes de abrir `index.html`.** Este documento existe para ir
> directo al sitio exacto y no gastar el turno buscando. El *por qué* de
> cada decisión está en `RWADAR-ESTADO.md`; aquí está el *dónde*.

---

## Regla de oro

Toda la web es **un solo archivo de 246 kB**: `rwadar-site/index.html`.
HTML, CSS, JavaScript y las dos tipografías, juntos, sin dependencias ni
compilación. Salvo la consulta a Supabase, la página **no pide nada a
ningún tercero**.

Por eso **los números de línea de este mapa envejecen mal**: cualquier
cambio los mueve todos. Los que aparecen son de referencia (8 de agosto de
2026); lo que no caduca es la **marca de búsqueda**. Usa siempre grep sobre
la marca, no `Read` con offset a ciegas.

```bash
# el patrón que sirve para casi todo
grep -n "SONIDO DE INTERFAZ" rwadar-site/index.html
```

Y **nunca leas el archivo entero**: son ~50 k tokens. Con la marca tienes
el número de línea, y con `Read offset/limit` sacas solo el tramo.

---

## Inventario

### `rwadar-site/` — TODO lo que hay aquí se publica

| Archivo | Qué es | ¿Se toca? |
|---|---|---|
| `index.html` | La web entera | Sí, es el único |
| `privacidad.html` | Política de privacidad. Página aparte, se sirve en `/privacidad` | Al cambiar qué datos se tratan |
| `og.png` | Vista previa al compartir (1200×630) | Regenerar si cambia el diseño |
| `rwadar.csv` | El registro entero descargable | **Nunca a mano**: lo escribe `sincronizar.js` |
| `sitemap.xml` | Para Google | Actualizar `lastmod` al publicar |
| `robots.txt` | Permite todo + apunta al sitemap | Casi nunca |
| `404.html` | Página de error | Casi nunca |
| `_headers` | Cabeceras de Netlify (caché, seguridad) | Casi nunca |
| `google6b2e3e5f58b7e557.html` | **Verificación de Google** | **NUNCA borrar** |
| `c9417d2d5003bb9a41fee63c7f5ec00f.txt` | **Llave de IndexNow** | **NUNCA borrar** |

### Fuera de esa carpeta — herramientas, no se publican

| Archivo | Para qué |
|---|---|
| `rwadar-arrancar.js` | **Empieza por aquí.** Diagnostica local + publicado + base de datos y levanta el servidor |
| `rwadar-publicar.js` | Sincroniza + pre-renderiza + publica. **La única forma correcta de publicar** |
| `rwadar-servir.js` | Servidor local en `:4173`. También `/banco` y el `POST /guardar` de capturas |
| `rwadar-banco-de-sonidos.html` | Banco de pruebas de sonido, servido en `/banco` |
| `RWADAR-ESTADO.md` | El *por qué*: decisiones, trampas, estado del proyecto |
| `RWADAR-MANANA.md` | **Lo que NO coincide entre producción y el repositorio.** Empieza aquí si tocas cuentas, opiniones o moderación |
| `RWADAR-MAPA.md` | Este archivo: el *dónde* |
| `rwadar-app/` | Esquema de Supabase, `sincronizar.js`, utilidades de datos |
| `rwadar-movil/` | App de Expo (proyecto aparte) |

### Las pruebas: qué comprueba cada una

Ninguna necesita token. Las tres primeras levantan un Postgres embebido; las
dos últimas atacan la base **en línea** y se limpian solas.

| Comando | Qué demuestra |
|---|---|
| `node rwadar-arrancar.js` | Que el JS compila, que lo publicado coincide con lo local, que ninguna descartada va sin fuente |
| `rwadar-app/probar-opiniones.mjs` | Opiniones, denuncias y retirada automática |
| `rwadar-app/probar-moderacion.mjs` | Que quien no es administrador **no** puede moderar |
| `rwadar-app/probar-reparacion.mjs` | La migración 16 sobre el estado roto de producción, reproducido |
| `rwadar-app/probar-push.mjs` | El reparto de avisos, incluidos los fallos que devuelven 200 |
| `rwadar-app/probar-produccion.mjs` | **La base en línea**: se registra, opina, vigila y se borra |
| `rwadar-app/probar-app-movil.mjs` | **La base en línea** desde la app: seguir y guardar el token push |

### El código, publicado

github.com/victorJorques/RWADAR · repositorio público. El `.gitignore` de la
raíz es una **lista blanca**: ignora todo y readmite solo lo de RWAdar, porque
esta carpeta es `Downloads` y aquí dentro hay documentos personales. No lo
conviertas en lista negra.

Y nada más. Si aparece cualquier otra cosa —un `.netlify`, un PNG suelto de
una captura, una versión vieja del sitio— es basura de trabajo y se puede
borrar: `rwadar-arrancar.js` avisa de lo que sobra dentro de `rwadar-site/`.

**Enlaza siempre sin `.html`.** Netlify tiene las URL limpias activadas y
reescribe `href="/x.html"` como `href='/x'` al servir; si lo escribes con
extensión, lo publicado deja de coincidir con lo local y el diagnóstico da
un falso fallo.

---

## Anatomía de `index.html`

Cinco tramos, en este orden:

| # | Tramo | Marca de búsqueda | ~línea |
|---|---|---|---|
| 1 | `<head>`: meta, OG, favicon, JSON-LD | `google-site-verification` | 17 |
| 2 | **CSS** (14 secciones numeradas) | `============ 1 · TOKENS` | 66 |
| 3 | **Cuerpo HTML** | `<header class="hdr">` | 728 |
| 4 | **Datos** `P` y `FUERA` | `const P=[` | 1168 |
| 5 | **JavaScript** (11 bloques) | `const CATMETA={` | 1207 |

### Las 14 secciones de CSS

Todas con la forma `/* ============ N · NOMBRE ============ */`:

`1 TOKENS` · `2 MARCA` · `3 CABECERA` · `4 PORTADA` · `5 EXPLICADOR` ·
`6 MÉTODO` · `7 HERRAMIENTA` · `8 FICHAS` · `9 MATRIZ` ·
`10 FUERA DEL RADAR` · `11 COMPARADOR Y PANELES` · `12 PIE` ·
`13 MOVIMIENTO` · `14 RESPONSIVE`

```bash
grep -n "============ 8 · FICHAS" rwadar-site/index.html
```

### Los bloques de JavaScript, en orden

| Bloque | Marca de búsqueda | ~línea |
|---|---|---|
| Categorías y colores de dato | `const CATMETA={` | 1207 |
| Logotipo inline | `const MARK=` | 1221 |
| Shaders del 3D | `const GL_VS=` | 1252 |
| Geometría del edificio | `function gEdificio` | 1551 |
| Motor 3D completo | `(function init3D` | 1606 |
| Paso a paso del explicador | `function irPaso` | 1951 |
| Calculadora | `(function calculadora` | 1977 |
| Radar de portada | `function pintarRadar` | 2069 |
| Interacción del radar | `(function radarInteractivo` | 2179 |
| Herramienta (filtros, fichas, matriz, paneles) | `function render()` | 2254 |
| **Sonido** | `SONIDO DE INTERFAZ` | 2381 |
| Revelado y contadores | `function pulir` | 2755 |
| Actualización viva desde Supabase | `async function alDia` | 2834 |

---

## Quiero cambiar… → busca esto

### Colores e identidad
| Quiero | Marca |
|---|---|
| Cualquier color de la interfaz | `============ 1 · TOKENS` |
| El verde de marca | `--senal:` |
| Los 6 colores de categoría | `const CATMETA={` |
| El logotipo (radar + hexágono) | `const MARK=` |
| El favicon | `rel="icon"` |
| El color de la barra del navegador | `theme-color` |

### El dibujo 3D
| Quiero | Marca | Nota |
|---|---|---|
| Forma y altura del edificio | `const cuerpos=[` | `{nb: bahías por lado, y0, y1}` |
| Proporción del panel | `const BAHIA=` / `const PISO=` | 0,62 × 1,0 |
| Geometría del panel (bisel, grosor) | `function panel()` | |
| Qué ventanas se encienden | `esVentana` | |
| Brillo de las ventanas | `LA VENTANA ENCENDIDA` | |
| Material, luces, oro/piedra | `const GL_FS=` | |
| Color del edificio entero | `gl.uniform3f(u1.cA` | |
| Colores de los dueños | `vec3 duenno(` | |
| Reflejo y sombra de contacto | `uModo>1.5` | 3 pasadas en un solo programa |
| Suelo de radar y barrido | `const SU_FS=` | |
| Halo de atmósfera y viñeta | `const VI_FS=` | `uFase` 0=halo 1=viñeta |
| Encuadre y cámara | `const CAMD=` / `const CAMY=` | |
| Qué se mueve en cada paso | `const mueven=` / `orbitan` | |
| Textos de los 4 pasos | `class="paso` (están en el HTML) | |

### El radar de portada
| Quiero | Marca |
|---|---|
| Colocación de los puntos | `const escalon=` |
| Radio por tipo de acceso | `const RADIO_ACCESO=` |
| Velocidad del barrido | `const VUELTA=` |
| Anillos, marcas, sectores | `function pintarRadar` |
| Panel de lectura al pasar por encima | `(function radarInteractivo` |
| Estilos | `--- EL RADAR ---` |

### El sonido
| Quiero | Marca |
|---|---|
| Cualquier sonido concreto | `toque :` `abrir :` `cerrar:` `marcar:` `tic   :` |
| El sonido de los pasos del 3D | `UNA GOTA POR PASO` |
| El motor (envolvente, aire, cuerpo) | `function pop(o)` |
| La cadena maestra (paso bajo, recortador) | `const dar=()=>` |
| Las notas disponibles | `const NOTAS=` |
| Qué gesto dispara qué sonido | `pointerdown` |
| Probar familias nuevas a oído | `rwadar-banco-de-sonidos.html` |

### La calculadora
| Quiero | Marca |
|---|---|
| Números del ejemplo | `const VALOR=300000` |
| La cuenta paso a paso | `class="cuenta"` (HTML) |
| Lógica | `(function calculadora` |

### La herramienta (las fichas del radar)
| Quiero | Marca |
|---|---|
| Aspecto de una ficha | `============ 8 · FICHAS` |
| Contenido de una ficha | `function renderGrid` |
| El panel de detalle | `function openDrawer` |
| La matriz | `function renderMatrix` |
| El comparador | `function openCompare` |
| Filtros | `function filtered` |
| Descarga en CSV | `function downloadCSV` |

### Textos
Casi todos están **en el HTML**, no en JavaScript. Busca la frase
literal — es lo más rápido:
```bash
grep -n "partir algo caro" rwadar-site/index.html
```

---

## Constantes con nombre: qué controla cada una

Están dentro de `init3D`, en el orden en que aparecen. Son arrays de 4:
un valor por paso del explicador.

| Constante | Controla | Valor a 8-08-2026 |
|---|---|---|
| `SUELO_Y` | Altura del suelo de cristal | `-13.1` |
| `SEPARA` | Cuánto se despega cada panel | `0.80` |
| `ANCHO` | Radio de la sombra en el suelo | `[4.2, 5.4, 5.4, 11.5]` |
| `CAMD` | Distancia de cámara | `[40, 41, 41, 46]` |
| `CAMY` | Elevación de cámara (rad) | `[0.17, 0.19, 0.21, 0.14]` |
| `INDIV` | Cuánto se ve el color de dueño | `[0, 0.08, 1, 1]` |
| `TAM` | Escala del panel | `[0.97, 0.86, 0.86, 0.86]` |

Tres tienen **límites que no se pueden cruzar**, y están razonados en
`RWADAR-ESTADO.md`:

- `TAM[0]` **no puede ser 1,0 ni mayor**. A 1,0 las caras laterales de dos
  paneles contiguos quedan coplanarias y pelean por la profundidad
  (z-fighting, manchas al azar). Por encima, se interpenetran y se ven las
  intersecciones. `0,97` deja una junta limpia.
- `CAMY` **no puede bajar de ~0,10**. Más rasante, los paneles se tapan
  entre sí y la torre parece un derrumbe.
- La apertura del sector del radar **no pasa de 56°** y su escalón radial
  **no pasa de 0,12**: más, y un punto se sale de su sector o invade el
  anillo de al lado.

---

## Invariantes: romper esto rompe la publicación

`rwadar-publicar.js` y `rwadar-app/sincronizar.js` leen el HTML con
expresiones regulares. Si cambias estas formas, la publicación falla o
—peor— sube una página vacía para Google.

1. **Un único `<script>` sin atributos, y el último del archivo.**
   El publicador extrae el JS con `lastIndexOf('<script>')`. El `<script
   type="application/ld+json">` del head no estorba porque lleva atributo.

2. **Los arrays de datos, con su forma exacta:**
   ```
   const P=[
    …
   ];        ← el cierre tiene que ser "\n];"
   ```
   Igual con `const FUERA=[`. `sincronizar.js` los reescribe buscando
   `const P=[` y `\n];`.

3. **Los contenedores pre-renderizables, con la clase ANTES del id:**
   ```html
   <div class="rejilla" id="grid"><!--pre:ini-->…<!--pre:fin--></div>
   <div class="fuera-lista" id="outlist">…</div>
   ```
   El regex es `(<div class="[^"]*" id="grid">)`. Sin clase, no encuentra.

4. **El JS tiene que sobrevivir a un DOM simulado.** El pre-renderizado
   ejecuta el script en un `vm` de Node con un DOM de juguete:
   - `getElementById('gl')` devuelve `null` → el 3D se salta solo.
   - `querySelector` devuelve `null`; `querySelectorAll` devuelve `[]`.
   - `matchMedia().matches` es `true` → no arrancan los temporizadores.
   - **No existen** `fetch`, `AudioContext`, `navigator`, `getComputedStyle`.
     Referenciarlos dentro de una función está bien; en el nivel superior
     rompe la publicación.
   - `nodo.style` es un objeto pelado: **no tiene `setProperty`**. Guarda
     siempre: `if(b.style && b.style.setProperty)`.
   - Sí existen `Map`, `Promise`, `Set` (son intrínsecos de V8).

5. **Comprueba la sintaxis antes de publicar.** Un error de sintaxis deja
   la página en blanco y el pre-renderizado no siempre lo caza:
   ```bash
   node -e "const h=require('fs').readFileSync('rwadar-site/index.html','utf8');new Function(h.slice(h.lastIndexOf('<script>')+8,h.lastIndexOf('</script>')));console.log('sintaxis OK')"
   ```

---

## Recetas de verificación

Esto es lo que más tiempo ahorra: **el panel de vista previa no compone
fotogramas**, así que ni las capturas ni `requestAnimationFrame` funcionan.
Hay que forzarlo a mano.

### Ver el 3D de verdad (PNG)
`window.__gl3d.pinta(t)` pinta un fotograma a mano. El servidor local
acepta `POST /guardar?n=algo.png` y escribe el archivo junto a
`rwadar-servir.js`, para poder leerlo con `Read`.

```js
irPaso(0,true);
let t=performance.now();
for(let i=0;i<170;i++){ t+=16.6; window.__gl3d.pinta(t); }   // 170 ≈ 2,8 s
// readPixels → canvas 2D (¡voltear en Y!) → toBlob → fetch('/guardar?n=x.png')
```
`window.__gl3d` expone `N`, `estado()`, `mix()`, `visible()`, `pinta(t)`.

**Ojo:** no crees contextos WebGL de prueba. Chrome limita cuántos hay
vivos y le quita el suyo a la página; parece un fallo del 3D y no lo es.

### Ver un SVG (logotipo, radar)
Clonar, copiar los estilos calculados a atributos inline (las clases CSS no
viajan en un SVG suelto), serializar a data-URI, dibujar en un canvas y
mandarlo con el mismo `POST /guardar`.

### Medir el sonido sin oírlo
`OfflineAudioContext` + `suspend(t)` para programar cada sonido en su
momento, sustituyendo `window.AudioContext`:

```js
const c=new OfflineAudioContext(2,44100*2,44100);
c.resume=()=>{};                       // que Sonido no arranque el render
window.AudioContext=function(){return c};
Sonido.despertar();                    // sin esto, paso() no suena
c.suspend(0.5).then(()=>{Sonido.toque(); resumeReal();});
```
Mide pico, duración, reparto por bandas y saltos entre muestras. Un
chasquido es **un salto aislado**; muchos saltos repartidos son el aire del
sonido, no un defecto.
**Recarga la página entre medidas**: el módulo cachea su contexto y la
segunda medida sale muda.

### Mirar la web
```bash
node rwadar-servir.js     # http://localhost:4173  y  /banco
```

---

## Los datos nunca se editan a mano

La fuente de verdad es **Supabase** (proyecto `exgpmjpaaebyoolpwced`), no el
HTML. Si editas los arrays `P` o `FUERA` a mano, la siguiente publicación
los sobrescribe.

- Cambiar contenido → tabla `plataformas` en el panel de Supabase.
- La web además **se actualiza sola**: consulta la base al cargar y se
  repinta si algo cambió (`async function alDia`).
- **Antes de publicar**, comprobar que ninguna descartada va sin fuente:
  ```bash
  curl -s -H "apikey: sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F" \
    "https://exgpmjpaaebyoolpwced.supabase.co/rest/v1/plataformas?estado=eq.descartada&select=nombre,fuentes(url)"
  ```
  Cualquiera con `fuentes: []` es motivo para no publicar.

## Publicar

```bash
node rwadar-publicar.js                    # sincroniza + pre-renderiza + publica
node rwadar-publicar.js --local            # solo pre-renderiza, no sube
node rwadar-publicar.js --sin-sincronizar  # sin tocar Supabase
```

Netlify suele rechazar la subida directa con un `Forbidden`; el script lo
detecta, sube como borrador y lo promueve. Ver *«La publicacion directa fue
rechazada»* seguido de *«Promovido a produccion»* **es el camino normal**.

**No compares el tamaño de lo publicado con el de lo local.** Netlify
inyecta al servir su script de analítica (`netlify-rum-container`) justo
después de nuestro `</script>`, así que el HTML en línea siempre pesa unos
500 caracteres más aunque sea idéntico. Para comparar de verdad, mira si lo
publicado **empieza por** el archivo local hasta su último `</script>` —es
lo que hace `rwadar-arrancar.js`.

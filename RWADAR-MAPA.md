# RWAdar · mapa de navegación

> **Léeme antes de abrir `index.html`.** Este documento existe para ir
> directo al sitio exacto y no gastar el turno buscando. El *por qué* de
> cada decisión está en `RWADAR-ESTADO.md`; aquí está el *dónde*.

> **Vigencia:** reconciliado el 22 de agosto de 2026 sobre el producto
> desplegado `c795756d9561084030ee4b88b2f0f22cb5fb714e`. La web remediada está desplegada y verificada en
> `https://rwadar.pages.dev`; deployment actual
> `b247c02d-14fa-4732-b6ee-9d5e461590ee`
> (`https://b247c02d.rwadar.pages.dev`), web 222/222 y
> smoke externo GO. La 22 está aplicada y verificada. Correo y push siguen OFF.
> Search Console tiene Pages verificada y la portada en cola; el sitemap se
> envió y su primera lectura fue el estado transitorio «No se ha podido
> obtener». Netlify es legado indexado y conserva la versión anterior: sus
> despliegues de producción están pausados por créditos y la CLI responde
> `Forbidden`. CALIX es otro proyecto y no se toca.

---

## Lo que se lee no es lo que se sube

`rwadar-site/` es la **fuente**. El HTML, CSS y JavaScript propios están
separados: `index.html` referencia recursos versionados de `assets/`.
`rwadar-publicado/` es el artefacto que **viaja**: una copia generada y
pre-renderizada, nunca la fuente editable.

En el artefacto, todos los assets desplegables reciben una huella de contenido
y el HTML y `sw.js` se reescriben para apuntar a esos nombres. La `VERSION` del
service worker se deriva del artefacto completo y su precaché crítico es
atómico: si falta una pieza, la instalación no presenta una entrega parcial.
La revisión publicada usa `rwadar-v-624322e8a5d58585` y migra automáticamente
instalaciones que todavía tengan el service worker v1.

La misma PWA móvil se usa en iPhone y Android. Su navegación principal es
`Buscar`, `Favoritos`, `Inversiones` y `Mi cuenta`. Dentro de `Buscar`, el orden
real del DOM es ofertas verificadas → radar animado → acceso a `RWAdar Academy`
→ buscador → resultados. Muestra seis plataformas inicialmente y permite abrir
las 26 sin perder filtros ni datos. El backend todavía no guarda inversiones,
así que esa vista declara la ausencia de datos en vez de inventar una cartera.

`RWAdar Academy` es una subvista de `Buscar`, no una quinta pestaña. Reutiliza
el explicador 3D real como primera lección y mantiene la videoteca vacía hasta
recibir vídeos reales, revisados, subtitulados y acompañados de fuentes.

La ficha móvil conserva todos los campos, opiniones y animaciones 3D, pero los
agrupa en bloques con cabecera y acciones persistentes; reinicia el scroll y se
cierra arriba, abajo o con Atrás. Privacidad exige una edad mínima de 18 años.

La genera `rwadar-publicar.js` en cada publicación llamando a
`rwadar-adelgazar.js`. **Nunca la edites**: se borra y se rehace entera.
Y nunca publiques a mano desde `rwadar-site/`, o subirás la fuente.

El adelgazador procesa los recursos generados sin reintroducir código o estilos
inline. Los comentarios **dentro de los shaders del 3D** se conservan porque
viven en cadenas de JavaScript y tocarlos puede romper el dibujo.

---

## Regla de oro

La web es estática y no necesita compilación, pero **ya no es un solo archivo**.
`rwadar-site/index.html` contiene la estructura; `assets/rwadar-20260820.css`
y `assets/rwadar-20260820.js` contienen presentación y comportamiento. También
hay hojas separadas para privacidad y error. Salvo Supabase y las rutas
declaradas, la aplicación no debe pedir recursos a terceros.

Los números de línea envejecen mal: usa siempre búsquedas por marca o símbolo,
no offsets guardados.

```bash
# estructura
rg -n "explain|grid|outlist" rwadar-site/index.html
# comportamiento
rg -n "SONIDO DE INTERFAZ" rwadar-site/assets/rwadar-20260820.js
```

No leas todos los recursos a ciegas: localiza primero el símbolo con `rg` y
abre solo el tramo necesario.

---

## Inventario

### `rwadar-site/` — TODO lo que hay aquí se publica

| Archivo | Qué es | ¿Se toca? |
|---|---|---|
| `index.html` | Estructura, metadatos y contenedores pre-renderizados | Sí |
| `assets/rwadar-20260820.css` | Estilos de la aplicación | Sí |
| `assets/rwadar-20260820.js` | Lógica, datos generados y 3D | Sí |
| `assets/privacidad-20260820.css` | Estilos de privacidad | Al tocar esa página |
| `assets/error-20260820.css` | Estilos de 404 | Al tocar esa página |
| `privacidad.html` | Política de privacidad. Página aparte, se sirve en `/privacidad` | Al cambiar qué datos se tratan |
| `og.png` | Vista previa al compartir (1200×630) | Regenerar si cambia el diseño |
| `rwadar.csv` | El registro entero descargable | **Nunca a mano**: lo escribe `sincronizar.js` |
| `sitemap.xml` | Para Google | Actualizar `lastmod` al publicar |
| `robots.txt` | Permite todo + apunta al sitemap | Casi nunca |
| `404.html` | Página de error | Casi nunca |
| `_headers` | Cabeceras de Cloudflare Pages (caché, seguridad) | Casi nunca |
| `_redirects` | Rutas limpias y redirecciones del sitio | Al cambiar rutas |
| `.well-known/security.txt` | Contacto y política de reporte de seguridad | Al cambiar contacto o vigencia |
| `google6b2e3e5f58b7e557.html` | **Verificación de Google** | **NUNCA borrar** |
| `c9417d2d5003bb9a41fee63c7f5ec00f.txt` | **Llave de IndexNow** | **NUNCA borrar** |
| `manifest.webmanifest` | Lo que hace que la dirección **se instale como app** | Al cambiar nombre, colores o iconos |
| `sw.js` | El trabajador de segundo plano: instalable y legible sin red | Casi nunca — y leyendo antes sus cuatro reglas |
| `icono-192.png` · `icono-512.png` · `icono-maskable-512.png` | El logotipo en la pantalla de inicio | Si cambia la marca |

**El manifiesto, el service worker y los iconos hacen instalable la web.** Sin
el manifiesto no aparece
«Instalar»; sin los iconos, quien la instale se encuentra un cuadrado en
blanco. Se generan desde la marca del proyecto con la receta
de «Ver un SVG» de más abajo, y son **los mismos** que lleva la app nativa
en `rwadar-movil/assets/`: una marca, una dirección, un icono.

### Fuera de esa carpeta — herramientas, no se publican

| Archivo | Para qué |
|---|---|
| `rwadar-arrancar.js` | **Empieza por aquí.** Diagnostica local + publicado + base de datos y levanta el servidor |
| `rwadar-publicar.js` | Sincroniza + pre-renderiza + adelgaza + publica. **La única forma correcta de publicar** |
| `rwadar-adelgazar.js` | Adelgaza el artefacto **solo en lo que se sube** |
| `rwadar-publicado/` | La carpeta que se sube. **Generada y desechable**: se rehace en cada publicación |
| `rwadar-servir.js` | Servidor local en `:4173`. También `/banco` y el `POST /guardar` de capturas |
| `rwadar-banco-de-sonidos.html` | Banco de pruebas de sonido, servido en `/banco` |
| `RWADAR-ESTADO.md` | El *por qué*: decisiones, trampas, estado del proyecto |
| `RWADAR-MANANA.md` | **Lo que NO coincide entre producción y el repositorio.** Empieza aquí si tocas cuentas, opiniones o moderación |
| `RWADAR-MAPA.md` | Este archivo: el *dónde* |
| `SECURITY.md` | Canal, alcance y reglas para reportes de seguridad |
| `rwadar-app/` | Esquema de Supabase, `sincronizar.js`, utilidades de datos |
| `rwadar-movil/` | App de Expo (proyecto aparte) |

### Las pruebas: qué comprueba cada una

Las baterías locales no necesitan un token personal. Una prueba local no
demuestra el estado de producción: las comprobaciones contra la base real se
ejecutan por separado, con datos de prueba y limpieza verificable.

| Comando | Qué demuestra |
|---|---|
| `node rwadar-arrancar.js` | Que el JS compila, informa si lo publicado difiere de local y comprueba descartes con fuente |
| `node probar-web.mjs` | Contrato estático, CSP, publicación explícita y cerrada, privacidad, SEO, shell móvil, Academy, sonido y 26/4/0; **222/222** al 22-08 |
| `node rwadar-qr/comprobar-qr.js` | Geometría, contenido y legibilidad del QR; 6/6 al 20-08 |
| `rwadar-app/probar-opiniones.mjs` | Opiniones, denuncias y retirada automática |
| `rwadar-app/probar-moderacion.mjs` | Que quien no es administrador **no** puede moderar |
| `rwadar-app/probar-reparacion.mjs` | La migración 16 sobre el estado roto de producción, reproducido |
| `rwadar-app/probar-push.mjs` | Lógica local de cola y fallo cerrado; no demuestra entrega externa |
| `rwadar-app/probar-produccion.mjs` | Smoke remoto: solo lectura por defecto; las mutaciones exigen URL/clave, flag y confirmación ligados al proyecto |
| `rwadar-app/probar-app-movil.mjs` | Smoke móvil: solo lectura por defecto; mutación con destino/clave, flag, confirmación y limpieza verificable, sin token Expo ficticio |
| `rwadar-app/probar-cierre-22.mjs` | Migración 22, verificador y rollback en local |
| `rwadar-app/probar-verificacion.mjs` | Que los verificadores fallen si el estado seguro no se cumple |
| `rwadar-app/activar-push.cmd` | Único opt-in de push tras E2E; nunca forma parte de fresh/22 |
| `rwadar-app/db/push_fallo_cerrado.sql` | Cierre de emergencia limitado al push; conserva API y retención |

La suite raíz terminó el 22-08 con código 0; la web pasó **222/222**.
En producción, la 22 (`02F2...0666`) terminó en `COMMIT` con `schedule=19`; su
verificador (`4182...2C3`) devolvió `Success. No rows returned` y `RWAdar 22
OK`. El smoke público confirmó 26/4, las denegaciones ACL/RPC y la ausencia de
la firma antigua. Security Advisor quedó en 0 Critical y 0 Security Definer
View.

Fresh-install, 17, 22, rollback y recuperación dejan el push apagado: flag
`false` y 0 cron `rwadar-push`. La retención de dispositivos es independiente,
diaria a las 03:17 y observable en `retencion_dispositivos_estado`.

Ninguno de los dos smokes remotos contiene referencia o clave predeterminadas.
`probar-produccion.mjs` usa el prefijo `RWADAR_SMOKE_` y
`probar-app-movil.mjs`, `RWADAR_MOVIL_SMOKE_`; ambos son de solo lectura por
defecto. El modo mutante exige flag y frase ligados a `<REF>` y termina en un
`finally` que verifica la limpieza. El primero exige borrado RPC, login revocado
y contenido ausente; el segundo, cero dispositivo y seguimiento, sin guardar un
token Expo ficticio. Las pruebas adversariales locales de este contrato pasan
**21/21**, sin red.

### El código, versionado

Baseline histórico: `42018de`; producto desplegado:
`c795756d9561084030ee4b88b2f0f22cb5fb714e`. En este clon, `origin` apunta a una ruta local de
Downloads, no a un remoto verificable. Comprueba el destino antes de cualquier
push. El `.gitignore` de la raíz es una **lista blanca** porque la carpeta de
origen puede contener documentos personales; no lo conviertas en lista negra.

Y nada más. Si aparece cualquier otra cosa —un `.netlify`, un PNG suelto de
una captura, una versión vieja del sitio— es basura de trabajo y se puede
borrar: `rwadar-arrancar.js` avisa de lo que sobra dentro de `rwadar-site/`.

**Enlaza siempre sin `.html`.** `_redirects` mantiene las URL limpias en
Cloudflare Pages; si escribes enlaces internos con extensión, lo publicado deja
de coincidir con el contrato y el diagnóstico falla.

---

## Anatomía de la web

La estructura y el comportamiento ya no comparten archivo:

| Archivo | Tramo | Marca de búsqueda |
|---|---|---|
| `index.html` | `<head>`: meta, OG, favicon y JSON-LD | `google-site-verification` |
| `index.html` | Cuerpo y contenedores pre-renderizados | `<header class="hdr">` |
| `assets/rwadar-20260820.css` | CSS por secciones | `============ 1 · TOKENS` |
| `assets/rwadar-20260820.js` | Datos `P`, `FUERA` y `EMI` | `const P=[` |
| `assets/rwadar-20260820.js` | Comportamiento y WebGL | `const CATMETA={` |

### Las 19 secciones de CSS

Todas con la forma `/* ============ N · NOMBRE ============ */`:

`1 TOKENS` · `2 MARCA` · `3 CABECERA` · `4 PORTADA` · `5 EXPLICADOR` ·
`6 MÉTODO` · `7 HERRAMIENTA` · `8 FICHAS` · `9 MATRIZ` ·
`10 FUERA DEL RADAR` · `11 COMPARADOR Y PANELES` · `12 PIE` ·
`13 MOVIMIENTO` · `14 RESPONSIVE` · `15 CUENTA` · `16 OPINIONES` ·
`17 MODERACIÓN` · `18 EMISIONES ABIERTAS` · `19 RWADAR ACADEMY`

```bash
rg -n "============ 8 · FICHAS" rwadar-site/assets/rwadar-20260820.css
```

### Los bloques de JavaScript, en orden

| Bloque | Marca de búsqueda | ~línea |
|---|---|---|
| Categorías y colores de dato | `const CATMETA={` | 58 |
| Logotipo | `const MARK=` | 72 |
| Shaders del 3D | `const GL_VS=` | 103 |
| Geometría del edificio | `function gEdificio` | 402 |
| Motor 3D completo | `(function init3D` | 457 |
| Paso a paso del explicador | `function irPaso` | 802 |
| Calculadora | `(function calculadora` | 832 |
| Radar de portada | `function pintarRadar` | 924 |
| Interacción del radar | `(function radarInteractivo` | 1032 |
| Herramienta (filtros, fichas, matriz, paneles) | `function render()` | 1148 |
| **Sonido** | `SONIDO DE INTERFAZ` | 1447 |
| Revelado y contadores | `function pulir` | 1632 |
| Actualización viva desde Supabase | `async function alDia` | 1778 |
| Cuenta y favoritos | `const Cuenta =` | 2066 |
| Shell móvil y Academy | `const Movil =` | 2702 |

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
| El sonido manual de los pasos del 3D | `paso(i)` y `irPaso(i,manual)` |
| El motor (envolvente y dos parciales) | `function pulsoCalido(o)` |
| La cadena maestra (paso bajo, recortador) | `const dar=()=>` |
| El opt-in y la preferencia | `rwadar.sonido` y `get activo()` |
| Qué gesto desbloquea Web Audio | `Sonido.despertar()` |
| Probar variantes históricas a oído | `rwadar-banco-de-sonidos.html` |

### RWAdar Academy y el shell móvil
| Quiero | Marca |
|---|---|
| Contenido y temas de Academy | `<!-- ============ RWADAR ACADEMY ============ -->` |
| Estilos de Academy | `19 · RWADAR ACADEMY` |
| Orden real de Buscar en móvil | `const ordenMovil=` |
| Abrir, cerrar, Atrás y foco de Academy | `function mostrarAcademy` / `function cerrarAcademyVisual` |
| Las cuatro pestañas | `const tabs=` dentro de `const Movil` |
| Límite inicial de seis fichas | `LIMITE_MOVIL_RESULTADOS` |
| Expandir o contraer resultados | `function alternarResultadosMoviles` |

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
Casi todos están **en el HTML**. Busca la frase literal:
```bash
rg -n "partir algo caro" rwadar-site/index.html
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

`rwadar-publicar.js` localiza recursos y contenedores con formas deliberadas.
Si cambias estas formas, la validación detiene la publicación.

1. **Un único script propio externo y versionado.** La aplicación se carga
   desde `/assets/rwadar-AAAAMMDD.js`. El JSON-LD puede seguir inline porque
   es datos estructurados, no JavaScript ejecutable. No añadas bloques
   ejecutables, atributos `on*`, `<style>` ni atributos `style`.

2. **Los arrays de datos, con su forma exacta:**
   ```
   const P=[
    …
   ];        ← el cierre tiene que ser "\n];"
   ```
   Igual con `const FUERA=[` y `const EMI=[`. Están en el JavaScript externo;
   `sincronizar.js` los reescribe buscando el nombre y `\n];`.

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
   node --check rwadar-site/assets/rwadar-20260820.js
   node probar-web.mjs
   ```

---

## Recetas de verificación

Esto es lo que más tiempo ahorra: **el panel de vista previa no compone
fotogramas**, así que ni las capturas ni `requestAnimationFrame` funcionan.
Hay que forzarlo a mano.

### Ver el 3D de verdad (PNG)
`window.__gl3d.pinta(t)` pinta un fotograma a mano. Por defecto el servidor no
acepta escrituras. Inícialo de forma deliberada con
`node rwadar-servir.js --capturas`; entonces `POST /guardar?n=algo.png` acepta
solo PNG válidos, limita el tamaño y escribe una captura con nombre saneado.

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
Sonido.despertar(); Sonido.activo=true; // opt-in explícito para la medición
c.suspend(0.5).then(()=>{Sonido.toque(); resumeReal();});
```
Mide pico, duración, reparto por bandas y discontinuidades entre muestras. Un
chasquido aparece como un salto aislado anormal; no se introducen ruido,
reverberación ni aleatoriedad en el grafo publicado.
**Recarga la página entre medidas**: el módulo cachea su contexto y la
segunda medida sale muda.

### Mirar la web
```bash
node rwadar-servir.js                 # lectura: http://localhost:4173 y /banco
node rwadar-servir.js --capturas      # habilita POST /guardar solo para QA
```

---

## Los datos nunca se editan a mano

La fuente de verdad es **Supabase** (proyecto `exgpmjpaaebyoolpwced`), no el
HTML ni el JavaScript generado. Si editas `P`, `FUERA` o `EMI` a mano, la
siguiente publicación los sobrescribe.

- Cambiar contenido → tabla `plataformas` en el panel de Supabase.
- La web además **se actualiza sola**: consulta la base al cargar y se
  repinta si algo cambió (`async function alDia`).
- **Antes de publicar**, comprobar que ninguna descartada va sin fuente:
  ```bash
  curl -s -H "apikey: sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F" \
    "https://exgpmjpaaebyoolpwced.supabase.co/rest/v1/plataformas?estado=eq.descartada&select=nombre,fuentes(url)"
  ```
  Cualquiera con `fuentes: []` es motivo para no publicar.

### Evidencia regulatoria: dónde está el límite

El [registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182)
lista una emisión de REENTAL TOURIST HOMES, S.A.U. y varias de sociedades
HAUSERA PROPERTY MANAGER SPV. Sirve como fuente para esas inscripciones
concretas. La propia página aclara que la inscripción no implica validación de
las condiciones ni de la información del emisor: no escribas «avalada por la
CNMV» ni uses esta fuente como sustituto de los cuatro criterios.

## Publicar

```bash
node rwadar-publicar.js --local
npx.cmd --yes wrangler@4.125.0 pages deploy rwadar-publicado --project-name rwadar --branch main
```

Primero genera y valida; después despliega solo `rwadar-publicado/` a la cuenta
y proyecto Pages exactos. El publicador remoto heredado aún llama a Netlify y
no es la ruta actual. Wrangler quedó con User Read, Account Read y Pages Write.
CALIX es otro proyecto y no se toca.

La política declara
`data-deploy-legal-status="acuerdo-pendiente-de-documentar"`: la versión
completa puede publicarse sin presentar el acuerdo ni los plazos como cerrados.
Un `data-deploy-blocker`, un estado ausente o uno desconocido bloquean los dos
destinos remotos antes de consultar Auth o sincronizar. El
preflight remoto hace un GET de solo lectura a `/auth/v1/settings` y exige
`mailer_autoconfirm=false` exacto; producción ya devuelve `false` y Confirm email
está activo. Todo error o campo ausente debe fallar cerrado. No hay SMTP propio
probado: las altas y la recuperación públicas están pausadas fail-closed y no
envían solicitudes, aunque el login de cuentas existentes y el radar sin cuenta
siguen disponibles. No confundas superar el preflight con haber probado que
llega un correo. Cloudflare Pages sirve el deployment actual
`b247c02d-14fa-4732-b6ee-9d5e461590ee`
(`https://b247c02d.rwadar.pages.dev`) con caché
`rwadar-v-624322e8a5d58585`. El ZIP final es
`outputs/rwadar-cloudflare-pages-20260822-624322e8.zip`, 882.282 bytes y 21/21
archivos verificados, SHA-256
`03FAD72E5102F271D0D72AF29AD9B3C3F32504A558DF3CE86A2925BB8A47D46B`; no usar
el paquete `PRE-AUTH-NO-USAR-...-9b158323.zip` anterior.

La app móvil local está GO y mantiene push OFF. El preview EAS terminó
`FINISHED`: Android 1.0.0 build 4, ID
`c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
`af69452933f988f2d48d45861802f09d3df06e8b`. APK:
`outputs/rwadar-android-preview-v1.0.0-build4-c7bb915b.apk`, 84.783.140 bytes,
SHA-256 `5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`.
Estructura y firma v2 presentes; no está en tienda. La OTA Android `preview`
grupo `4f9d7e19...` y runtime `af694...` entrega el rediseño y apertura de
avisos al build 4 compatible; no es Play Store ni iOS nativo.

Lo que se compara con internet es `rwadar-publicado/`, no la fuente
comentada de `rwadar-site/`. RUM está desactivado: cualquier
`netlify-rum-container` inyectado se trata como una discrepancia y se corrige,
no se incluye en una lista de excepciones ni se publica.

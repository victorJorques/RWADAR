# Downloads · punto de entrada

Este archivo se carga solo al abrir sesión. Su único trabajo es que llegues
al sitio correcto **sin leer nada más**. No lo alargues: cada línea aquí se
paga en todas las sesiones.

Aquí viven **varios proyectos independientes** de Víctor.

---

## RWAdar · registro de plataformas de tokenización

**FUERA DE INTERNET desde el 25 de agosto de 2026, y a propósito.** No queda
nada público: se borró el proyecto de Cloudflare Pages y el sitio de Netlify
(con sus 14 URL permanentes) y el repositorio pasó a privado. **No lo vuelvas
a publicar sin que Víctor lo pida.** Se trabaja solo en local. Supabase
`exgpmjpaaebyoolpwced` sigue en pie y es la fuente de verdad de los datos.

**Ojo: `rwadar.pages.dev` responde 200 y NO es la web.** Es una página de
limpieza de tres líneas cuyo único trabajo es desregistrar el service worker
y vaciar la caché de los móviles que instalaron RWAdar como aplicación —si no,
seguirían abriéndola de memoria para siempre. Está en `rwadar-limpieza/`. No
la borres ni la confundas con el sitio: mientras siga ahí, sigue desinfectando.
**`rwadar.netlify.app` sirve esa misma página desde el 28 de agosto** y es la
más importante de las dos, porque es a donde apuntan los QR ya repartidos.
Estuvo dos días en 404 porque Netlify bloquea los despliegues cuando se acaban
los créditos del plan gratis: eso, y no un capricho, es lo que empujó a Codex a
Cloudflare.

La clave publicable de Supabase **se rotó el 25 de agosto**: la vieja
(`…LIyeUqws…`) está revocada para que las copias cacheadas no puedan tocar la
base. La nueva vive en 8 ficheros del proyecto; si algo da 401, es esto.

**Hay dos versiones en el disco y NO son la misma. Mira las dos antes de tocar
nada:**

| Carpeta | Qué es | Cómo verla |
|---|---|---|
| `rwadar-version-codex/` | **La más avanzada.** La hizo Codex del 20 al 23 de agosto y vivía *solo* en Cloudflare; se rescató justo antes de apagarlo. Móvil reordenado al estilo Booking, imágenes por plataforma, RWAdar Academy, privacidad corregida a 18 años. HTML+JS+CSS separados y sin minificar. **Nunca pasó por Git.** | `node rwadar-version-codex/servir.js` → localhost:4174 |
| `rwadar-site/` | La anterior, la que estaba en Netlify y la única que sigue Git. Archivo único de 325 kB. | `node rwadar-arrancar.js` → localhost:4173 |
| `rwadar-version-netlify/` | Copia exacta de lo último que sirvió Netlify. Solo respaldo, no se edita. | — |

Las dos **no están fusionadas**: decidir cuál es la buena es el primer trabajo
pendiente. `rwadar-site/index.html` es un solo archivo de 325 kB — **nunca lo
leas entero: son ~50.000 tokens.** 41 kB son las dos tipografías en base64 al
principio del `<style>`: no las leas nunca, no dicen nada.

**La dirección era también la aplicación.** Se instalaba en el móvil desde el
navegador. Eso lo hacían cinco archivos de `rwadar-site/`
—`manifest.webmanifest`, `sw.js` y los tres `icono-*.png`— y las etiquetas del
`<head>`. Al estar apagada la web, el icono del iPhone ya no carga.

| Si vas a… | Lee primero | Coste |
|---|---|---|
| **retomar el proyecto donde se dejó** | **`RWADAR-TRASPASO.md`** — en qué punto está, qué falta y las trampas | ~3 k |
| **tocar cuentas, opiniones, moderación o la base en línea** | **`RWADAR-MANANA.md`** | ~2 k |
| tocar la web | `RWADAR-MAPA.md` → te da la marca de grep exacta | ~2,8 k |
| entender por qué algo está así | `RWADAR-ESTADO.md` (tiene índice; lee solo la sección) | ~6 k entero |
| trabajar la app móvil | `rwadar-movil/` | — |
| tocar datos o esquema | `rwadar-app/` | — |

**Producción NO coincide con el repositorio.** Se le aplicaron migraciones que
no existen como fichero: la base prohíbe escribir opiniones directamente y
publica funciones para ello. Eso no se ve leyendo el código y las pruebas
locales pasan en verde igualmente. Antes de dar nada por bueno:
`cd rwadar-app && node probar-produccion.mjs` (no necesita token, se limpia
sola). El contrato real está en `RWADAR-MANANA.md`.

**Cuatro reglas que no se negocian:**

1. **Ahora mismo no se publica.** El proyecto está fuera de internet a
   petición de Víctor. `rwadar-publicar.js` sigue ahí pero **apunta a un sitio
   de Netlify que ya no existe**: si algún día se republica habrá que crear
   destino nuevo y decidir antes cuál de las dos versiones es la buena. Cuando
   llegue ese día valen las reglas de siempre: nunca `netlify deploy` a secas
   (sin pre-renderizado la página queda vacía para Google, y sin `--dir`/
   `--site` explícitos el CLI publica lo que diga el `.netlify` de la
   carpeta), y **lo que se sube no es `rwadar-site/` sino `rwadar-publicado/`**.
2. **Los datos no se editan en el HTML.** La fuente de verdad es Supabase;
   la siguiente publicación sobrescribe los arrays `P` y `FUERA`.
3. **Ninguna descartada sin fuente.** Comprobarlo antes de publicar (el
   comando está en el mapa). Es riesgo legal, no una preferencia.
4. **No borrar** `google6b2e3e5f58b7e557.html` ni
   `c9417d2d5003bb9a41fee63c7f5ec00f.txt` de `rwadar-site/`.

**Para empezar, un solo comando:**
```bash
node rwadar-arrancar.js
```
Comprueba que el JS compila, que el pre-renderizado está puesto, que la
carpeta publicable no tiene archivos de más, que Supabase responde, que
**ninguna descartada va sin fuente** y si lo publicado coincide con lo
local. Luego levanta el servidor en http://localhost:4173 (y `/banco`).

---

**El código está publicado** en github.com/victorJorques/RWADAR. El
`.gitignore` de esta carpeta es una **lista blanca**: ignora todo y readmite
solo lo de RWAdar, porque aquí dentro hay extractos bancarios y documentos
personales. No lo conviertas en lista negra ni le quites la primera línea.

**La app móvil se actualiza sola por el aire** (EAS Update). Para publicar un
cambio de código sin pasar por la tienda:
`cd rwadar-movil && npx eas update --branch production --environment production -m "qué cambia"`.

---

## Calix · app de calistenia

Carpeta `calisthenics-app/`. Empieza por **`calisthenics-app/docs/07-estado-actual.md`**;
el resto de `docs/` está numerado por temas.

Dos cosas que ahorran un rato: `corepack pnpm verify` falla, así que usa
`pnpm --filter` por paquete; y las migraciones de la fase 3 están escritas
pero **sin aplicar**.

---

## Radar del Mister · economía de la liga de fantasy

Carpeta `mister-radar/`. Reconstruye el saldo y la puja máxima de cada rival en
Mister, se actualiza solo 3 veces al día y lo enseña en http://localhost:4400.
Todo lo que necesitas saber está en **`mister-radar/LEEME.md`** (~1,5 k):
las reglas del cálculo, las cinco validaciones y qué hacer cuando falle.

Dos cosas que no se negocian: **solo lee** —nunca pujar, vender ni blindar
dentro del juego— y **`perfil/` lleva la sesión de Víctor**, no se sube a
ningún sitio.

---

## Cómo trabaja Víctor

- **Rechaza lo que no puede ver funcionando.** Ejecuta de punta a punta y
  enséñale el resultado —captura, PNG, medida—, no la intención.
- Da notas sobre 10 y pide iterar. Cuando dice que algo está soso o falso,
  suele tener razón: escúchalo antes de defender la decisión.
- **No escribas archivos con `Set-Content` de PowerShell**: mete BOM y ha
  roto JSON dos veces. Usa la herramienta Write.
- El panel de vista previa **no compone fotogramas**: `requestAnimationFrame`
  no corre y las capturas salen en negro. Las recetas para verificar
  animación y sonido están en `RWADAR-MAPA.md`.

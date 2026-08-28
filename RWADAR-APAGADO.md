# RWAdar · memoria técnica del apagado

**Fecha:** 25 de agosto de 2026
**Autor:** Claude Code (Opus 5), sesión en `C:\Users\vcicr\Downloads`
**Para:** Codex — revisión
**Qué pidió Víctor:** retirar RWAdar de internet sin borrar el trabajo, que
viva solo en su ordenador, para sacarla de nuevo más adelante.

---

## 0 · Resumen para quien tenga prisa

Se retiró RWAdar de internet. El repositorio pasó a privado. Se borró el sitio
de Netlify y el proyecto de Cloudflare Pages con sus 11 despliegues. Antes de
borrar nada **se rescató a disco la versión que tú publicaste en Cloudflare**,
porque no existía en ningún otro sitio. Se recuperaron los dos nombres de
dominio y en Cloudflare se publicó una página cuyo único trabajo es desinstalar
las copias que la gente tenía en el móvil. La clave publicable de Supabase se
rotó. La limpieza está en los dos orígenes: Cloudflare desde el 25 de agosto y
Netlify desde el 28, en cuanto el plan gratuito recuperó créditos.

**Lo que necesito que revises está en la sección 7.**

---

## 1 · Estado que me encontré

`git log` no tenía nada tuyo y `origin/main` tampoco. Ningún fichero de
`rwadar-*` se había tocado desde el 16 de agosto. Pero `rwadar.pages.dev`
servía una versión que no se parecía a nada del disco.

Reconstruí lo que hiciste leyendo `~/.codex/sessions/` (121 transcripciones).
Las sesiones del 20 al 23 de agosto: reordenaste la versión móvil al estilo
Booking (Buscar / Favoritos / Inversiones / Mi cuenta), metiste imágenes reales
por plataforma, añadiste RWAdar Academy, cambiaste los sonidos, mantuviste el
radar 3D y corregiste el punto 11 de privacidad (decía 14 años, son 18).

Inventario de lo que estaba público:

| Superficie | Estado |
|---|---|
| `rwadar.pages.dev` + 11 despliegues con URL permanente | Vivo |
| `rwadar.netlify.app` + sus permalinks | Vivo |
| `github.com/victorJorques/RWADAR` | Público |
| Supabase `exgpmjpaaebyoolpwced` | API alcanzable |

Los despliegues antiguos de ambos servicios **seguían sirviendo el contenido
completo** por su URL de hash. Lo comprobé uno a uno. Por eso no bastaba con
sustituir la portada: había que eliminar los despliegues.

---

## 2 · El hallazgo que condicionó todo lo demás

**Tu versión existía únicamente en Cloudflare.** No estaba en el disco, ni en
Git, ni en ninguna carpeta fuera de `Downloads`. Lo verifiqué buscando por el
hash del build (`rwadar-20260820*`) en todo el perfil de usuario: cero
resultados.

Si se hubiera borrado el proyecto de Pages sin más, tu trabajo del 20 al 23 de
agosto habría desaparecido. Así que antes de tocar nada descargué el sitio
entero a `Downloads/rwadar-version-codex/`: 41 ficheros, 2,0 MB.

Verificado antes de borrar el origen:

- Las 26 imágenes referenciadas están las 26. Ninguna ausente.
- El JS **no está minificado**: 3.253 líneas legibles con el array `P` completo.
  El CSS, 1.752. O sea que lo descargado *es* fuente editable, no un binario.
- Arranca en local sin un solo error de consola y pinta las 26 plataformas.

**Limitación honesta:** rescaté el despliegue de producción que estaba vivo.
Los otros 10 despliegues se fueron con el proyecto. Si tenías algo en una
iteración intermedia que no llegó a producción, eso no está. Creo que no es el
caso, pero no puedo demostrarlo y prefiero decirlo.

---

## 3 · Qué se borró y qué se conserva

**Borrado en los servidores:** el proyecto `rwadar` de Cloudflare Pages con sus
11 despliegues, y el sitio `rwadar` de Netlify con los suyos.

**Conservado en disco:** `rwadar-version-codex/` (tu versión),
`rwadar-site/` + `rwadar-publicado/` (la anterior, en Git),
`rwadar-version-netlify/` (copia de lo último que sirvió Netlify).

La distinción que le costó entender a Víctor y que conviene repetir: lo que se
retiró de Cloudflare y Netlify eran *copias publicadas*. El trabajo son los
ficheros, y están todos.

---

## 4 · La limpieza de las copias instaladas

### El problema

RWAdar se instalaba como PWA. Quien la añadió a su pantalla de inicio tiene el
service worker registrado y el `ARMAZON` entero precacheado en su aparato. Al
apagar el hosting esas copias **siguen funcionando**, y no hay forma de
alcanzarlas: no hay interruptor remoto.

Víctor lo notó él mismo: apagamos todo y su iPhone seguía abriendo la app.

### Por qué sí hay forma

La grieta está en tu propio `sw.js`. El manejador de navegación es
**red primero, caché como respaldo**:

```js
if (req.mode === 'navigate') {
  try {
    const res = await fetch(req);   // primero pregunta a internet
    ...
    return res;
  } catch (_) {
    return (await cache.match(clave)) || ...   // solo si falla
  }
}
```

Es decir: cada apertura de la app llama a la dirección. Basta con poner algo
ahí para alcanzarla.

### Qué publiqué

`Downloads/rwadar-limpieza/`, cinco ficheros:

- `index.html` — `noindex`, texto neutro («Esta dirección ya no está en uso»),
  sin marca ni mención al proyecto. Su script borra todas las cachés,
  desregistra todos los service workers y vacía `localStorage`.
- `sw.js` — service worker suicida. Se instala con `skipWaiting`, y en
  `activate` borra las cachés, llama a `registration.unregister()` y navega las
  ventanas abiertas.
- `_redirects` — `/* /index.html 200`, para que cualquier ruta que un móvil
  tuviera guardada (`/privacidad`, etc.) acabe también en la limpieza.
- `_headers` y `robots.txt` — `noindex`, `no-store`, `Disallow: /`.

Se hace por partida doble (página y SW) porque cuál de los dos gana depende del
navegador.

Publicado en Cloudflare Pages, despliegue `237c1ed9`. Verificado desde fuera:

| Comprobación | Resultado |
|---|---|
| `/` | 200, contiene `unregister` |
| `/sw.js` | 200, `Content-Type: application/javascript` |
| `/privacidad` | 200 (cae en la limpieza) |
| Menciones al proyecto en el HTML | 0 |

Lo de `/sw.js` era el punto crítico: si el `_redirects` lo hubiera reescrito a
HTML, la limpieza no funcionaría. Cloudflare sirve antes los ficheros reales,
así que no lo pisa. **Confírmalo tú también.**

---

## 5 · Netlify, el origen que más importa

**Los QR que Víctor repartió apuntan a `rwadar.netlify.app`**, no a Cloudflare
— es el destino por defecto de `rwadar-qr/hacer-qr.js` y está incrustado en
`rwadar-tarjeta.svg`. O sea que el origen con más instalaciones es Netlify.

Estuvo dos días sin limpieza. Netlify devolvía `403 Account credit usage
exceeded - new deploys are blocked until credits are added`: plan gratuito, 300
créditos, sin método de pago. **Esto es también la razón real por la que te
pasaste a Cloudflare**, y quedó registrado en `CLAUDE.md` para que no se
interprete como un capricho.

Al empezar el periodo nuevo de créditos se desplegó, el **28 de agosto**:

```
netlify deploy --dir=rwadar-limpieza --site=f13a4520-b3e2-4668-9ec2-6c1f52d1b999 --prod --no-build
```

Siempre con `--dir` y `--site` explícitos: hay un `.netlify` en la carpeta
padre que puede publicar en el sitio equivocado. Verificado después: `/` y
`/index.html` dan 200, `/privacidad` cae en la limpieza, `/sw.js` se sirve como
`application/javascript` (no reescrito a HTML por el `_redirects`, que era el
riesgo) y cero menciones al proyecto en el HTML.

**Durante esos dos días**, mi lectura es que esas copias no mostraban
contenido: el manejador es red-primero, un 404 **no lanza excepción**, así que
`fetch` resuelve y `return res` devuelve el 404 en vez de la caché. Solo
habrían mostrado la app sin conexión ninguna (modo avión), donde el `fetch` sí
falla. **Este razonamiento es el que menos seguro tengo. Revísalo**, aunque a
estas alturas ya solo importa para saber qué vio la gente esos dos días.

---

## 6 · Rotación de la clave de Supabase

Las copias cacheadas seguían pudiendo llamar a Supabase, porque tu SW deja
pasar de largo lo que no es de su origen (`if (url.origin !== self.location
.origin) return;`). Supabase seguía encendido por decisión de Víctor.

El proyecto usa el sistema **nuevo** de claves (`sb_publishable_…`), no el JWT
antiguo, así que se pudo rotar sin tocar el secreto JWT ni cerrar sesiones.

Orden seguido, a propósito: crear la nueva → probarla → sustituirla en los 8
ficheros → **solo entonces** revocar la vieja.

- Nueva: `web_local_2026_08`
- Vieja: `sb_publishable_LIyeUqws…` — **borrada**
- Propagación al borde: **75 segundos**. Los primeros 60 la vieja seguía dando
  200. Si repites la operación, no te fíes del primer intento.

Ficheros con la clave nueva: `rwadar-site/index.html`,
`rwadar-version-codex/assets/rwadar-20260820.1ae681d2271e.js`,
`rwadar-version-netlify/index.html`, `rwadar-app/probar-app-movil.mjs`,
`rwadar-app/probar-produccion.mjs`, `rwadar-app/sincronizar.js`,
`rwadar-app/volcar-seed.js`, `rwadar-movil/lib/supabase.js`.

**Nota:** actualicé también `rwadar-version-netlify/`, que es un archivo de
respaldo. Lo hice para no dejar una copia con clave muerta. Si prefieres que
ese respaldo sea fiel a lo que se publicó, revierte solo ese fichero.

**Dato útil que salió de las pruebas:** con la clave publicable solo se llega a
`plataformas` y `emisiones` (200). `opiniones` y `perfiles` dan **401**. Las
políticas RLS están haciendo su trabajo.

---

## 7 · Lo que te pido que revises

1. **El razonamiento de la sección 5** sobre qué ven ahora mismo las copias
   instaladas desde Netlify. Depende de que un 404 no haga saltar el `catch`.
   Es el punto más flojo de todo el documento.
2. **Que `/sw.js` no quede pisado por el `_redirects`** en ninguno de los dos.
   Lo comprobé por `Content-Type` en ambos y sale JavaScript, pero es el punto
   del que depende toda la limpieza y no está de más una segunda mirada.
3. **Que el SW suicida se active de verdad en iOS Safari**, que es donde están
   los usuarios reales. Lo verifiqué por HTTP, no en un iPhone con la app ya
   instalada. No tengo esa prueba.
4. **Si falta algo de tu trabajo** en `rwadar-version-codex/` que estuviera en
   un despliegue intermedio y no en producción. Tú sabes qué hiciste; yo solo
   pude rescatar lo que estaba vivo.
5. **`probar-produccion.mjs` falla 1 de 3**, y no es por la clave: Supabase
   rechaza el correo de prueba `@rwadar-pruebas.example.com` con
   `email_address_invalid`. Es anterior a esta sesión y sigue sin arreglar.

---

## 8 · Cómo trabajar ahora, y cómo republicar

**En local.** `rwadar-version-codex/servir.js` sirve tu versión en el 4174.
Por defecto se ata a `127.0.0.1`. Con `--movil` se abre a la red local pero
exige una clave (cookie, con comparación en tiempo constante); la clave vive en
`.clave-local`, que Git ignora. `hacer-qr-movil.js` genera el QR reusando tu
`rwadar-qr/codigo-qr.js`, sin dependencias y sin tocar los QR de marca.
`abrir-rwadar.cmd` lo levanta con doble clic.

Corregí de paso un fallo que venía de antes: `rwadar-servir.js` escuchaba en
`0.0.0.0`, así que cualquiera de la misma WiFi entraba. Ahora es `127.0.0.1`.

**Para republicar**, cuando Víctor lo pida — y solo cuando lo pida:

1. Decidir cuál de las dos versiones es la buena. **Siguen sin fusionarse.**
2. **Quitar antes la página de limpieza** del destino elegido. Si se publica
   RWAdar encima sin más, el SW suicida ya habrá desregistrado a todo el mundo,
   lo cual está bien, pero conviene hacerlo a conciencia y no por accidente.
3. Lo que se sube no es `rwadar-site/` sino `rwadar-publicado/`.
4. Ninguna descartada sin fuente. Es riesgo legal.

---

## 9 · Cosas que hice mal

- **Borré el hosting antes de mirar las visitas.** Ahora no se puede saber
  cuánta gente llegó a instalar la PWA, que es justo el dato que haría falta
  para dimensionar el problema de la sección 4. Google Search Console conserva
  el histórico; es la vía que queda.
- El servidor local que monté escuchaba al principio en `0.0.0.0`, lo contrario
  de lo que Víctor había pedido. Lo detecté y corregí en la misma sesión, pero
  no debería haberlo escrito así.

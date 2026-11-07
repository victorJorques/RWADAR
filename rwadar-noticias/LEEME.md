# Noticias de Inicio

Lo que aparece en **Inicio** (web en el móvil y app) sale de un solo archivo:
[`noticias.json`](noticias.json). La más reciente arriba; se muestran hasta 12.

Cada noticia:

```json
{
  "id": "academy-abierta",
  "fecha": "2026-10-05",
  "etiqueta": "Academy",
  "titulo": "RWAdar Academy ya está abierta",
  "texto": "Hasta 320 caracteres, sin < ni >.",
  "destino": "academy",
  "red": { "nombre": "LinkedIn", "url": "https://…" }
}
```

- Límites: `etiqueta` hasta 20 caracteres, `titulo` hasta 90, `texto` hasta
  320. Ninguno puede llevar `<` ni `>`.
- `resumen` (opcional, hasta 140 caracteres): la línea de la franja de Inicio
  en la web, que solo enseña la noticia más reciente. Sin cifras del catálogo,
  que caducan. Si falta, la franja usa el título. Con dos noticias del mismo
  día, la franja enseña la de `id` que va antes por orden alfabético.
- `destino` (opcional): `academy`, `buscar`, `ofertas` o `fuera`. Es el botón
  de la noticia; en la web lleva a la Academy o a la sección de Buscar, y en
  la app a la pestaña correspondiente.
- `red` (opcional): si la noticia se publicó también en una red social, el
  enlace a esa publicación (siempre `https://`).
- La fecha no puede ser futura: una noticia se publica cuando ya es verdad.

Después de editar:

```bash
node rwadar-noticias.js            # escribe la web y la app
node rwadar-noticias.js --comprobar
node rwadar-fichas.js              # escribe /cambios y el RSS (novedades.xml)
node rwadar-fichas.js --comprobar
```

`rwadar-noticias.js` escribe la franja de Inicio (`rwadar-site/index.html`) y
las noticias de la app (`rwadar-movil/lib/noticias-contenido.js`).
`rwadar-fichas.js` escribe la página de novedades (`rwadar-site/cambios.html`)
y el RSS (`rwadar-site/novedades.xml`), con estas noticias y la revisión del
catálogo. La publicación se bloquea si alguno no coincide con este archivo. En
la app, las noticias nuevas llegan con la siguiente versión (o una OTA).

Las **publicaciones de la comunidad** (una al día por cuenta) llegarán con
las cuentas; hoy Inicio las anuncia como «próximamente».

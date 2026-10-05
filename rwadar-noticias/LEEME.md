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
```

La publicación se bloquea si la web no coincide con este archivo. En la app,
las noticias nuevas llegan con la siguiente versión.

Las **publicaciones de la comunidad** (una al día por cuenta) llegarán con
las cuentas; hoy Inicio las anuncia como «próximamente».

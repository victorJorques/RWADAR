# RWAdar Academy · cómo se actualiza

Las lecciones de la Academy se escriben **una sola vez** y salen en dos sitios:
la web (`/academy/`) y la app (Más › RWAdar Academy, y el aviso del radar).

```
rwadar-academy/
├── lecciones/NN-slug.md   ← las lecciones, tal como las entrega el equipo editorial
├── academy.json           ← qué se publica, niveles y adónde lleva cada botón
├── aviso-legal.md         ← el aviso legal común (una sola fuente)
└── LEEME.md               ← este archivo
```

Después de cualquier cambio, desde la carpeta raíz del proyecto:

```bash
node rwadar-academy.js
```

Eso regenera las páginas de `rwadar-site/academy/`, el bloque de lecciones de
la portada, el `sitemap.xml` y `rwadar-movil/lib/academy-contenido.js`. Si una
lección tiene un fallo de formato, **se para y dice cuál**: no genera nada a
medias. Ninguna página de la Academy se edita a mano.

Para comprobar sin escribir nada: `node rwadar-academy.js --comprobar`.

---

## Cambiar el texto de una lección

1. Edita su archivo en `lecciones/`. Respeta la estructura (la valida el
   generador): título `##`, línea de metadatos, `### En 30 segundos (TL;DR)`
   con tres puntos, secciones `###`, `## Glosario`, `## Comprueba lo que has
   aprendido`, `## Da el siguiente paso…` y `## Aviso importante`.
2. Si cambia el cuerpo, **actualiza `ultima_revision_legal`** en el
   frontmatter y en la línea «Contenido revisado el…» del final (el generador
   comprueba que coinciden).
3. `node rwadar-academy.js` y `npm run test:web`.

Si Eric manda una versión nueva de un archivo, basta con sustituirlo y
ejecutar el generador.

## Publicar una lección que estaba «Próximamente»

1. En `academy.json`, cambia su `"estado": "en_revision"` por `"publicado"`
   (y borra su `"motivo"`).
2. Añade su página a `PAGINAS_ACADEMY` en `rwadar-publicacion-segura.js`
   (por ejemplo `'academy/como-leer-el-radar.html'`). Es la lista cerrada de
   lo que puede llegar a producción: así ninguna página se publica sin una
   decisión que quede escrita.
3. `node rwadar-academy.js`, `npm test`, y después el proceso normal de
   publicación (`docs/OPERACION-LANZAMIENTO.md`), **siempre con permiso de
   Víctor**.

En la app, una lección nueva solo llega con la siguiente compilación.

## Los botones de las lecciones

Las lecciones escriben botones así: `**[Abrir el radar →]**`. El texto del
botón se busca en `"acciones"` de `academy.json`, que dice a qué destino
lleva. Cada destino tiene un estado:

| Estado | Qué se ve |
|---|---|
| `disponible` | Un botón que lleva al sitio (`web` en la web, `app` en la app) |
| `parcial` | Un botón al radar y una nota que explica qué falta (por ejemplo, el filtro por supervisión) |
| `proximamente` | Una etiqueta «Próximamente», nunca un enlace roto |

Hoy son «Próximamente» el **Evaluador de Viabilidad** y la **checklist del
expediente**. Cuando existan, cambia su estado a `disponible` y pon su ruta.

Un botón a otra lección se escribe `"leccion:slug"`: enlaza si la lección
está publicada y si no, sale «Próximamente».

## El aviso legal

El texto común está en `aviso-legal.md` y es el **único sitio** donde vive. El
generador lo quita de cada lección y deja solo lo propio de esa lección (el
aviso reforzado de las lecciones 4, 7 y 9, o las notas «Sobre los costes»,
«Sobre la liquidez», etc.). Si una lección trae una versión distinta del
texto común, el generador se para y pide unificarla.

El generador avisa también cuando una lección publicada lleva **más de seis
meses** sin revisión legal.

## El progreso del alumno

Sin cuentas. En la web se guarda en el navegador (`localStorage`, clave
`rwadar.academy.v1`); en la app, en el dispositivo, y se borra con «Borrar
datos del dispositivo». Nunca se envía a RWAdar. La política de privacidad ya
lo dice.

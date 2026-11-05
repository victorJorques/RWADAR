# RWAdar Academy · cómo se actualiza

Las lecciones de la Academy se escriben **una sola vez** y salen en dos sitios:
la web (`/academy/`) y la app (Más › RWAdar Academy, y el aviso del radar).

```
rwadar-academy/
├── lecciones/NN-slug.md   ← las lecciones (entrega de Eric con las correcciones del 2/10/2026)
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

## Quién abre las lecciones en la web: `"acceso"`

Desde el 05/11/2026 (`docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`),
`academy.json` lleva un interruptor:

| `"acceso"` | Qué pasa |
|---|---|
| `"cuenta"` | El índice `/academy/` sigue público e indexable. Cada lección pide una cuenta confirmada: sin sesión, la web manda a `/acceso?volver=/academy/<slug>` (303). Las lecciones llevan `noindex`, salen del `sitemap.xml` y los textos dicen «Gratis con tu cuenta». |
| `"publico"` | Todo como antes: lecciones abiertas, indexables y en el sitemap. |

Lo aplica el servidor de la web (`rwadar-acceso/servidor.mjs`, compilado en
`_worker.js` por `rwadar-acceso/compilar.cjs`), que lleva dentro la lista
cerrada de lecciones publicadas de este archivo: una lección «Próximamente» o
inventada da 404 sin mirar la cookie. Si Supabase no responde, la lección da
503 y nunca manda a entrar. Para cambiarlo: el valor, `node rwadar-academy.js`,
`npm test` y publicar, **con permiso de Víctor**.

No es un candado: el texto va en el paquete de la app. Nunca se pone material
privado en la Academy.

### Volver a `"publico"`: lo que cambia solo y lo que hay que cambiar a mano

Con `"publico"`, `node rwadar-academy.js` y el worker reabren solos las
lecciones (sin 303, indexables y otra vez en el `sitemap.xml`) y el tutorial 3D
de la portada en el móvil, que deja de pedir sesión (lo decide el atributo
`data-academy-acceso` del bloque generado de la portada).

**No se revierten solos** y hay que cambiarlos a mano en el mismo cambio:

- **Privacidad** (`rwadar-site/privacidad.html`): los textos que dicen que las
  lecciones de la Academy son gratis *con cuenta* y que «para abrir una lección
  comprobamos tu sesión» (hoy en las líneas 55, 76, 131-134, 170, 223 y 234;
  busca «Academy» en el archivo).
- **Destino tras confirmar el alta** (`rwadar-site/assets/acceso.js`,
  `regresarTrasConfirmar`): sin lección guardada lleva a
  `/academy/#cuenta-confirmada`, que enseña «Cuenta confirmada: Academy
  desbloqueada» (`assets/academy-20261002.js`). En `acceso.js` está además el
  texto «Las lecciones son gratis con cuenta» de `/acceso?volver=/academy/…`.
- **Correo de confirmación** (`rwadar-app/plantillas-auth/confirmar-alta.html`,
  «desbloquea gratis la Academy»), si ya está puesto en Supabase Auth (cambiarlo
  es tocar Supabase en línea: con permiso de Víctor).

**Pruebas que fijan `"cuenta"`** (comprobado el 05/11/2026 cambiando el valor a
`"publico"` y regenerando): fallan hasta que se adapten al otro modo.

- `rwadar-acceso/academy-cuenta.test.mjs`: «el worker lleva el modo y la lista
  cerrada de lecciones de academy.json» y «el worker compilado aplica la puerta
  con sus cabeceras de seguridad y su página 404».
- `rwadar-acceso/compilar.test.mjs`: «una ficha que no está en la lista da 404
  sin pedir a ASSETS su copia de conservación» y «la copia de conservación de
  cualquier otro archivo retirado da 404, salvo en /assets/» (esperan el 404 de
  la puerta en `/academy/no-existe` y `/academy/leccion-borrada`).
- `rwadar-acceso/comprobar-publicado.test.mjs`: «el comprobador de la web
  publicada pasa contra el worker compilado, sin red» y «el arnés local abre la
  lección con la sesión de prueba y la cierra sin ella».
- `probar-web.mjs`: «academy.json declara quién abre las lecciones y hoy es
  "cuenta"», «el sitemap lleva el índice de la Academy y ninguna lección (van
  con cuenta)», «cada lección publicada lleva una sola etiqueta robots con
  noindex; el índice se indexa», «los datos estructurados del índice no anuncian
  lecciones que no se indexan», «el índice y la portada dicen «Gratis con tu
  cuenta»…» y «el worker publicado lleva la puerta de la Academy con la lista
  cerrada de lecciones». Además, al revertir a mano la privacidad, falla
  «privacidad: la Academy es gratuita con cuenta y no guardamos qué lecciones
  lees» (exige «para abrir una lección comprobamos tu sesión»), y en
  `rwadar-acceso/alta-avisos-navegador.test.mjs` las que esperan el destino
  `/academy/#cuenta-confirmada` y el texto «Las lecciones son gratis con
  cuenta», si también se revierten en `acceso.js`.
- `probar-precarga.cjs`: «con "acceso": "cuenta", las 7 lecciones publicadas se
  comprueban por su 303…», tres de los rechazos de «la verificación de
  producción rechaza…» (lección servida a cualquiera, 303 a otra vuelta y 303
  que se puede guardar) y «con "acceso": "publico", una lección vuelve a exigir
  200…» (su producción simulada sigue la puerta de `academy.json`). Este archivo
  se para en el primer fallo.

`npm run test:tools`, `npm run test:mobile`, `probar-fichas.cjs` y el resto de
`npm run test:acceso` pasan con los dos valores.

Para ver la web con la puerta funcionando en local (y hacer capturas):
`node rwadar-acceso/probar-worker-local.mjs --raiz=rwadar-publicado` (ver el
comentario del principio de ese archivo).

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

Sin sincronizar. En la web se guarda en el navegador, separado por cuenta
(`localStorage`, clave `rwadar.academy.v1:<id de la cuenta>`); en la app, en el
dispositivo, y se borra con «Borrar datos del dispositivo». Nunca se envía a
RWAdar: para abrir una lección se comprueba la sesión, pero no se guarda qué
lecciones se leen. La política de privacidad ya lo dice.

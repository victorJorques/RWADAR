# «Novedades de RWAdar» · 12/11/2026

Encargo de Víctor: «que salga al abrir la app y como las novedades, tipo un
texto informativo muy fácil de leer con las novedades y si clickan que salga
en detalle».

## Qué ve la gente

1. **Al abrir RWAdar** (Inicio de la web; la app hace lo mismo con su propia
   ventana, `rwadar-movil/componentes/NovedadesRwadar.js`): una ventana con el
   título, la fecha y 4 o 5 puntos de una línea,
   cada uno con su icono. Dos botones: **«Ver en detalle»** y **«Entendido»**.
   Sale **una vez por versión**: al cerrarla (Entendido, ×, Escape o tocando
   fuera) o al ver el detalle, no vuelve a salir hasta la siguiente.
2. **«Ver en detalle»**: la página **/novedades-rwadar/**, con cada novedad
   explicada en frases cortas, un «Cómo se hace» cuando hay pasos y el camino a
   **Perfil › Avisos** para activar las notificaciones.
   En la app, el detalle es una pantalla propia con el botón «Ir a Perfil ›
   Avisos». Las dos enlazan la lista de antes (/cambios).
3. **Para volver a verlas**: «Novedades de RWAdar» en Perfil (móvil), en la
   cuenta de escritorio y en el pie de la web; en la app, en Perfil.

## Una sola fuente: `rwadar-site/datos/novedades-producto.json`

La web lo publica en `https://rwadar.pages.dev/datos/novedades-producto.json`
y la app lo lee de ahí. La app lleva una copia de respaldo
(`rwadar-movil/lib/novedades-producto.js` y su ejemplo en `fixtures/`) que
**no se edita a mano**: la escribe `node rwadar-novedades-producto.js` desde
este archivo, y probar-web y las pruebas de la app fallan si no coinciden.

**El mismo texto lo leen la web y la app.** Lo que solo existe en la web
(la campana, la casilla «Mantener la sesión iniciada», el botón «Activar
notificaciones…») tiene que decir «en la web»; las etiquetas entre «» del
resumen tienen que existir en la app. Las pruebas lo comprueban. Forma:

```json
{
  "version": "2026-11-12",
  "titulo": "Novedades de RWAdar",
  "en": { "titulo": "RWAdar news" },
  "resumen": [
    { "id": "avisos-movil", "icono": "notificacion", "titulo": "…", "texto": "…",
      "en": { "titulo": "…", "texto": "…" } }
  ],
  "detalle": [
    { "id": "avisos-movil", "titulo": "…", "parrafos": ["…"], "pasos": ["…"],
      "en": { "titulo": "…", "parrafos": ["…"], "pasos": ["…"] } }
  ]
}
```

- **El inglés va en un campo `en`** junto a cada texto, en el mismo archivo
  (como en `/datos/noticias-v2.json`). Las listas en inglés tienen el mismo
  largo que en castellano.
- `version`: `AAAA-MM-DD` (o `AAAA-MM-DD.2` si hay otra el mismo día). **Al
  cambiar la versión, la ventana vuelve a salir a todo el mundo una vez.**
- `resumen`: de 1 a 6 puntos (hoy 4); `detalle`: de 1 a 10 secciones, cada
  una con 1 a 8 párrafos y 0 a 8 pasos. Los `id` (minúsculas, números y
  guiones) son únicos en cada lista; cada punto del resumen lleva a la
  sección del mismo `id` (`/novedades-rwadar/#<id>`).
- `icono`: `notificacion`, `contador`, `sesion`, `correo`, `calculadora`,
  `grafico` o `noticias` (estos dos, desde el 14/11/2026)
  (dibujos de 24 × 24 en `ICONOS` del modelo). Una clave desconocida se pinta
  con un icono genérico.
- Solo texto llano: sin `<` ni `>`, sin espacios al principio o al final, sin
  caracteres de control. Hasta 32 kB.
- El contrato lo valida `rwadar-site/assets/novedades-producto-modelo-20261112.js`
  (lo usan la web, `rwadar-publicar.js` y `probar-web.mjs`). Si no valida,
  la web no se construye.

## Cómo se publica una novedad nueva

1. Editar `rwadar-site/datos/novedades-producto.json`: textos muy llanos,
   frases cortas, sin tecnicismos ni promesas de rentabilidad, con su inglés,
   y ciertos en la web y en la app. Subir `version` a la fecha del día.
2. `node rwadar-novedades-producto.js` (copia de la app al día).
3. `npm run test:web`, `npm --prefix rwadar-movil test` y
   `node --test rwadar-acceso/novedades-producto-navegador.test.mjs`.
4. Con el permiso de Víctor: «Publicar web» (preview y producción). La app
   coge el archivo nuevo sola **si tiene la misma forma**: no hace falta OTA
   salvo que cambie su código. La copia de respaldo nueva llega a la app con
   la siguiente OTA.

**Con iconos nuevos, primero la OTA y después la web** (revisión del
14/11/2026): si la web va antes, la app instalada enseña la ventana una vez
con el icono genérico y la marca como vista; con la OTA antes, la app usa su
copia nueva (gana la versión más nueva) con los dibujos buenos.

**No se añaden campos ni se suben los límites** (tamaño, número de puntos,
largo de los textos, iconos nuevos con dibujo) sin publicar antes una OTA
con el validador nuevo (`rwadar-movil/lib/novedades-rwadar.js`): la app
valida la forma exacta y, si no la reconoce, ignora el archivo de la web sin
avisar y sigue enseñando su copia. Un icono desconocido sí se admite (sale
genérico).

## Lo que hace la web (detalles)

- La ventana espera a que Inicio cargue y a que no haya otro diálogo abierto
  (la cuenta, una ficha, la comparativa, la campana…). No sale si se llega a
  otra cosa concreta (`?avisos=1` de una notificación, `#explain`,
  `#perfil-avisos`, la vuelta de un correo de la cuenta), dentro de la app
  (ReactNativeWebView), en navegadores automatizados (`navigator.webdriver`:
  así no estorba a las demás pruebas de Chromium ni a las capturas) ni si el
  navegador no deja leer o guardar lo visto (se prueba a guardar antes; no se
  puede prometer «una vez»). Lo deciden `motivoSinVentana` y `estadoVentana`
  del modelo, funciones puras que probar-web prueba sin navegador (en CI no
  hay Chromium).
- Lo visto: `localStorage["rwadar.novedades.vista"]` = la versión, nada más.
  Explicado en la privacidad («Novedades ya vistas», apartado 2, y «Datos
  locales», apartado 9): estrictamente necesario (LSSI, art. 22.2), sin datos
  personales.
- `/#perfil-avisos` lleva a Perfil › Avisos (en el móvil, la pestaña Perfil
  con el foco en «Avisos»; en escritorio, la cuenta) y se quita de la
  dirección.
- Accesible: `<dialog>` modal con nombre y descripción, foco en el título,
  Tab por ×, «Ver en detalle» y «Entendido», Escape cierra y el foco vuelve.
  Legible desde 320 px.

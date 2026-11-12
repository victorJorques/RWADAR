# «Novedades de RWAdar» · 12/11/2026

Encargo de Víctor: «que salga al abrir la app y como las novedades, tipo un
texto informativo muy fácil de leer con las novedades y si clickan que salga
en detalle».

## Qué ve la gente

1. **Al abrir RWAdar** (Inicio de la web; la app hace lo mismo con su propia
   ventana): una ventana con el título, la fecha y 4 o 5 puntos de una línea,
   cada uno con su icono. Dos botones: **«Ver en detalle»** y **«Entendido»**.
   Sale **una vez por versión**: al cerrarla (Entendido, ×, Escape o tocando
   fuera) o al ver el detalle, no vuelve a salir hasta la siguiente.
2. **«Ver en detalle»**: la página **/novedades-rwadar/**, con cada novedad
   explicada en frases cortas, un «Cómo se hace» cuando hay pasos y el camino a
   **Perfil › Avisos** para activar las notificaciones.
3. **Para volver a verlas**: «Novedades de RWAdar» en Perfil (móvil), en la
   cuenta de escritorio y en el pie de la web.

## Una sola fuente: `rwadar-site/datos/novedades-producto.json`

La web lo publica en `https://rwadar.pages.dev/datos/novedades-producto.json`
y la app lo lee de ahí (con una copia propia de respaldo). Forma:

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
- `resumen`: de 1 a 6 puntos (hoy 5); `detalle`: de 1 a 10 secciones, cada
  una con 1 a 8 párrafos y 0 a 8 pasos. Los `id` (minúsculas, números y
  guiones) son únicos en cada lista; cada punto del resumen lleva a la
  sección del mismo `id` (`/novedades-rwadar/#<id>`).
- `icono`: `notificacion`, `contador`, `sesion`, `correo` o `calculadora`
  (dibujos de 24 × 24 en `ICONOS` del modelo). Una clave desconocida se pinta
  con un icono genérico.
- Solo texto llano: sin `<` ni `>`, sin espacios al principio o al final, sin
  caracteres de control. Hasta 32 kB.
- El contrato lo valida `rwadar-site/assets/novedades-producto-modelo-20261112.js`
  (lo usan la web, `rwadar-publicar.js` y `probar-web.mjs`). Si no valida,
  la web no se construye.

## Cómo se publica una novedad nueva

1. Editar `rwadar-site/datos/novedades-producto.json`: textos muy llanos,
   frases cortas, sin tecnicismos ni promesas de rentabilidad, con su inglés.
   Subir `version` a la fecha del día.
2. `npm run test:web` y `node --test rwadar-acceso/novedades-producto-navegador.test.mjs`.
3. Con el permiso de Víctor: «Publicar web» (preview y producción). La app
   coge el archivo nuevo sola; no hace falta OTA salvo que cambie su código.

## Lo que hace la web (detalles)

- La ventana espera a que Inicio cargue y a que no haya otro diálogo abierto
  (la cuenta, una ficha, la comparativa, la campana…). No sale si se llega a
  otra cosa concreta (`?avisos=1` de una notificación, `#explain`,
  `#perfil-avisos`, la vuelta de un correo de la cuenta), dentro de la app
  (ReactNativeWebView), en navegadores automatizados (`navigator.webdriver`:
  así no estorba a las demás pruebas de Chromium ni a las capturas) ni si el
  navegador no deja guardar lo visto (no se puede prometer «una vez»).
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

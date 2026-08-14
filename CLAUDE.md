# Downloads · punto de entrada

Este archivo se carga solo al abrir sesión. Su único trabajo es que llegues
al sitio correcto **sin leer nada más**. No lo alargues: cada línea aquí se
paga en todas las sesiones.

Aquí viven **dos proyectos independientes** de Víctor.

---

## RWAdar · registro de plataformas de tokenización

**En línea y terminado: https://rwadar.netlify.app** · Supabase
`exgpmjpaaebyoolpwced` · Netlify site `0211fd28-d371-43cd-9d93-3944fea57680`

La web entera es **un solo archivo de 246 kB**: `rwadar-site/index.html`
(HTML + CSS + JS, sin compilación ni dependencias externas). **Nunca lo leas
entero: son ~50.000 tokens.** 41 kB son las dos tipografías incrustadas en
base64 al principio del `<style>`: no las leas nunca, no dicen nada.

| Si vas a… | Lee primero | Coste |
|---|---|---|
| tocar la web | `RWADAR-MAPA.md` → te da la marca de grep exacta | ~2,8 k |
| entender por qué algo está así | `RWADAR-ESTADO.md` (tiene índice; lee solo la sección) | ~6 k entero |
| trabajar la app móvil | `rwadar-movil/` | — |
| tocar datos o esquema | `rwadar-app/` | — |

**Cuatro reglas que no se negocian:**

1. **Publicar solo con `node rwadar-publicar.js`.** Nunca `netlify deploy` a
   secas: sin el pre-renderizado la página queda vacía para Google, y sin
   `--dir`/`--site` explícitos el CLI publica lo que diga el `.netlify` que
   él mismo deja en esta carpeta (llegó a apuntar a Downloads entera).
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

## Calix · app de calistenia

Carpeta `calisthenics-app/`. Empieza por **`calisthenics-app/docs/07-estado-actual.md`**;
el resto de `docs/` está numerado por temas.

Dos cosas que ahorran un rato: `corepack pnpm verify` falla, así que usa
`pnpm --filter` por paquete; y las migraciones de la fase 3 están escritas
pero **sin aplicar**.

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

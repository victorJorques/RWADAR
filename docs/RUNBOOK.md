# RWAdar · cómo trabajar sin romper nada

Guía práctica para el día a día. El estado del proyecto está en
[`INTERNO.md`](INTERNO.md) y cómo se publica, en
[`OPERACION-LANZAMIENTO.md`](OPERACION-LANZAMIENTO.md).

La versión anterior de este documento, con la lista completa del
relanzamiento del 21–30 de septiembre, está en
[`archive/2026-09/RUNBOOK-2026-09-30.md`](archive/2026-09/RUNBOOK-2026-09-30.md).

---

## La rutina, en cinco pasos

1. Mira en qué rama estás y si hay cambios sin guardar:

   ```powershell
   git status --short --branch
   ```

2. Busca antes de leer: `rg -n "texto" ruta`. No abras enteros los
   históricos, las imágenes ni los archivos generados.
3. Reconstruye la web sin consultar Supabase:

   ```powershell
   node rwadar-publicar.js --local --sin-sincronizar
   ```

4. Ábrela solo en tu ordenador:

   ```powershell
   node rwadar-servir.js
   ```

   y entra en `http://localhost:4173`. Desde esa dirección la web entra en
   **modo local seguro**: no habla con Supabase y las cuentas quedan apagadas.
   Otros servidores o copias no tienen esa protección.
5. Pasa la prueba de lo que has tocado (tabla de abajo) y vuelve a mirar
   `git status`.

---

## Qué comandos son seguros y cuáles no

### 🟢 Solo en tu ordenador: úsalos sin miedo

```powershell
npm --prefix rwadar-app test
npm --prefix rwadar-movil test
node rwadar-app/probar-escaparate-local.mjs
node rwadar-qr/comprobar-qr.js
node rwadar-publicar.js --local --sin-sincronizar
```

`npm test` también es local, pero regenera la web y puede cambiar el
pre-renderizado. Compara `git status` antes y después.

### 🟡 Leen de internet y cambian archivos locales

Necesitan red y un motivo:

```powershell
node rwadar-publicar.js --local
node rwadar-app/sincronizar.js
node rwadar-app/volcar-seed.js
node rwadar-capturar-portadas.mjs
```

No escriben en el servidor, pero pueden traer cambios grandes de datos o
imágenes. Revisa el diff.

### 🔴 Cambian algo fuera: solo con permiso expreso de Víctor

- `rwadar-publicar.js --preview` o `--produccion`;
- cualquier `wrangler pages deploy` o `netlify deploy`;
- los scripts `.cmd` de `rwadar-app/`;
- los smokes con `RWADAR_SMOKE_MUTANTE=SI` o `RWADAR_MOVIL_SMOKE_MUTANTE=SI`;
- SQL contra el Supabase en línea;
- `eas update`, `eas build` o `eas submit`;
- cambiar la visibilidad del repositorio, borrar hosting o rotar credenciales.

`--sin-sincronizar` solo se admite con `--local`. Preview y producción siempre
sincronizan con Supabase y se paran si esa lectura deja cambios en Git.

---

## Qué prueba pasar según lo que toques

| Si cambias… | Ejecuta |
|---|---|
| Base de datos o esquema | `npm --prefix rwadar-app test` |
| App móvil | `npm --prefix rwadar-movil test` |
| Código QR | `node rwadar-qr/comprobar-qr.js` |
| Web o publicador | `node rwadar-publicar.js --local --sin-sincronizar` y `node probar-web.mjs` |
| Compuerta de publicación | `npm --prefix rwadar-app run test:relanzamiento` y `npm --prefix rwadar-app run auditar:relanzamiento` |
| Varias cosas a la vez | `npm test` |

Que algo pase en local (PGlite, simulaciones o navegador) **no demuestra** que
funcione en producción: permisos reales, Auth, correo, push, hosting o
móviles de verdad se comprueban aparte.

---

## Datos y secretos

- La clave publicable de Supabase va en el código del cliente; no la copies a
  la documentación. Su poder depende de los permisos de la base.
- Tokens administrativos, `service_role`, credenciales de proveedores y
  archivos de firma **nunca** entran en Git.
- Hubo un token personal de Supabase en un commit antiguo; Víctor confirmó que
  está revocado. No lo busques ni lo pruebes. Qué hacer si pasa otra vez:
  [`seguridad/RUNBOOK-REVOCACION-ROTACION.md`](seguridad/RUNBOOK-REVOCACION-ROTACION.md).
- El `.gitignore` es una **lista blanca**, porque la carpeta raíz es
  `Downloads` y tiene documentos personales. No la conviertas en lista negra
  ni uses `git add -f` para saltártela.
- Antes de cada commit: `git diff --check`, `git diff --cached` y un escaneo
  de secretos proporcional al cambio.

---

## Copias y recuperación

- **Copia de la base:** automática cada noche cuando esté activada. Ver
  [`COPIAS-DE-SEGURIDAD.md`](COPIAS-DE-SEGURIDAD.md).
- **Código:** sube ramas normales a GitHub, sin `--force`. Comprueba que el
  repositorio sigue en `PRIVATE`.
- Lo generado se reconstruye. Las fuentes, migraciones, portadas editoriales,
  la página de limpieza y la documentación sí tienen que estar en Git.
- Para recuperar una decisión antigua, usa el historial de Git y
  `docs/archive/`.

---

## Catálogo

El catálogo se carga en Supabase con los importadores, nunca a mano en la web.
Guía: [`comercial/RUNBOOK-CATALOGO-SUPABASE.md`](comercial/RUNBOOK-CATALOGO-SUPABASE.md).
Cada revisión dura como mucho 7 días: renuévala antes de que venza.

**Siempre disponible.** Si la revisión vence o no se puede comprobar, la web y
la app siguen enseñando la última copia completa con un aviso de «revisión
pendiente» y sin cifras caducadas. Una revisión incompleta, futura o retirada
nunca se publica, y nunca se vuelve a una anterior.

### Retirar el catálogo (solo por orden de Víctor)

En el editor SQL de Supabase:

```sql
update public.catalogo_publicacion
   set retirado = true, motivo = 'Explica aquí el motivo', actualizado_el = now()
 where unica;
```

Para volver a mostrarlo:

```sql
update public.catalogo_publicacion
   set retirado = false, motivo = null, actualizado_el = now()
 where unica;
```

Retirar la revisión publicada (estado `retirada`) activa la orden sola, y
aprobar una revisión nueva la desactiva. Las webs ya abiertas lo notan en su
siguiente consulta (como mucho, un minuto después de volver a la pestaña).

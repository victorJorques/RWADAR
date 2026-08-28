# RWAdar · runbook privado

Este runbook separa trabajo local, acceso de red y mutaciones externas. El
estado y las decisiones están en `INTERNO.md`.

## Rutina diaria de menor riesgo

1. Confirma la rama y el árbol:

   ```powershell
   git status --short --branch
   ```

2. Localiza antes de leer: `rg -n "texto" ruta`. Evita escanear históricos,
   imágenes o generados.
3. Para reconstruir sin consultar Supabase:

   ```powershell
   node rwadar-publicar.js --local --sin-sincronizar
   ```

4. Sirve únicamente en este ordenador:

   ```powershell
   node rwadar-servir.js
   ```

   Abre `http://localhost:4173`. El servidor es local, pero la aplicación del
   navegador todavía puede conectar con Supabase de producción. No inicies
   sesión ni pruebes opiniones/seguimiento si la tarea no lo exige.
5. Ejecuta la prueba más cercana al cambio y revisa de nuevo `git status`.

## Comandos por nivel de riesgo

### Locales, sin escritura remota

```powershell
npm --prefix rwadar-app test
npm --prefix rwadar-movil test
node rwadar-qr/comprobar-qr.js
node rwadar-publicar.js --local --sin-sincronizar
```

`npm test` también es local, pero regenera el artefacto y puede actualizar el
pre-render. Úsalo para cambios transversales y compara el árbol antes/después.

### Lectura remota con cambios locales

Estos comandos consultan Supabase o fuentes externas y escriben archivos
locales. Requieren red y una razón concreta:

```powershell
node rwadar-publicar.js --local
node rwadar-app/sincronizar.js
node rwadar-app/volcar-seed.js
node rwadar-capturar-portadas.mjs
```

Revisa el diff: una lectura remota puede producir un cambio grande de datos o
activos aunque no haya escrito en el servidor.

### Mutación externa o publicación

No ejecutar sin autorización explícita del usuario en el turno actual:

- `rwadar-publicar.js --preview` o `--produccion`;
- cualquier `wrangler pages deploy` o `netlify deploy`;
- los scripts `.cmd` de `rwadar-app/`;
- smokes con `RWADAR_SMOKE_MUTANTE=SI` o `RWADAR_MOVIL_SMOKE_MUTANTE=SI`;
- SQL contra un proyecto Supabase enlazado;
- `eas update`, `eas build` o `eas submit`;
- cambios de visibilidad, borrado de hosting o rotación de credenciales.

El publicador incorpora además un bloqueo de modo privado. Retirar ese bloqueo
es un cambio de producto revisable, no un paso rutinario del runbook.

## Pruebas

| Cambio | Verificación mínima |
|---|---|
| Backend/esquema | `npm --prefix rwadar-app test` |
| App móvil | `npm --prefix rwadar-movil test` |
| QR | `node rwadar-qr/comprobar-qr.js` |
| Web o publicador | `node rwadar-publicar.js --local --sin-sincronizar` y `node probar-web.mjs` |
| Transversal | `npm test` |

Los smokes remotos son otra categoría. Ser verde en PGlite, mocks o navegador
local no prueba RLS, Auth, correo, push, hosting ni dispositivos reales.

## Datos y secretos

- No copies la clave publicable a documentación. El código cliente la necesita,
  pero su poder depende de RLS y debe rotarse si queda obsoleta.
- Tokens administrativos, `service_role`, credenciales de proveedor y ficheros
  de firma nunca entran en Git.
- La `.gitignore` es una lista blanca porque la raíz está en `Downloads`.
  No la conviertas en lista negra y no uses `git add -f` para saltártela.
- Antes de confirmar: `git diff --check`, `git diff --cached` y un escaneo de
  secretos proporcional al cambio.

## Copia privada y recuperación

1. Confirma que GitHub informa `PRIVATE`; no basta el campo `private` de npm.
2. Empuja una rama normal, sin `--force`.
3. Conserva `main` como punto histórico del apagado hasta revisar el merge.
4. Los artefactos generados se reconstruyen; las fuentes, migraciones,
   maestros editoriales, limpieza y documentación sí deben estar versionados.
5. Para recuperar una decisión antigua, usa Git y `docs/archive/2026-08/`; no
   vuelvas a escanear transcripciones de sesiones salvo que falte evidencia.

## Si algún día se republica

La autorización debe identificar destino y alcance. Antes de tocar un dominio:

1. decidir fuente, backend y política de cuentas;
2. ejecutar suite completa y auditoría de seguridad;
3. revisar que ninguna descartada carece de fuente;
4. decidir conscientemente cómo retirar la página y el SW de limpieza;
5. crear o seleccionar un destino nuevo, sin reutilizar IDs históricos por
   accidente;
6. desplegar solo `rwadar-publicado/` y verificar `/`, `/sw.js`, privacidad,
   cabeceras, caché y rollback;
7. actualizar `INTERNO.md` con fecha, commit y evidencia.

Hasta completar ese procedimiento, RWAdar sigue siendo interno y apagado.

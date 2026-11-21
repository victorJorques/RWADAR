# Lo que se quitó del árbol en la limpieza del 21/11/2026 y cómo recuperarlo

Orden del responsable del proyecto (21/11/2026): limpiar el código de la app y
la web para que sea más fácil trabajar con él. Lo de esta lista **no lo lee
ningún programa, prueba, flujo ni skill**; se comprobó con `git grep` antes de
quitarlo. No se ha perdido nada: todo sigue en el historial de Git.

**No es el estado vigente.** Para eso, [`../../INTERNO.md`](../../INTERNO.md).

## Cómo recuperar cualquier cosa de esta lista

Sin hashes, desde la carpeta del repositorio:

```bash
# 1. El commit que lo quitó (el último que tocó esa ruta):
git log --oneline -1 -- <ruta>
# 2. Traerlo de vuelta tal como estaba justo antes de ese commit:
git checkout <ese commit>^ -- <ruta>
```

Por ejemplo, con `<ruta>` =
`rwadar-app/data/verificaciones/2026-11-04-v2`. Para solo mirarlo sin
traerlo: `git show <ese commit>^:<ruta>/<archivo>`.

Los documentos históricos que citan estas rutas (`CATALOGO-V2-…`,
`INVESTIGACION-…`, traspasos y revisiones con fecha) **no se han reescrito**:
la cita sigue valiendo con estos dos pasos.

## Ciclos del catálogo (`rwadar-app/data/verificaciones/`)

Trece carpetas de ciclos ya superados. Ninguna tiene expedientes de ofertas:

- `2026-10-06-v2`, `2026-10-19-v2`, `2026-10-20-v2`
- `2026-11-02-v2`
- `2026-11-03-v2`, `2026-11-03.2-v2`, `2026-11-03.4-v2`, `2026-11-03.5-v2`,
  `2026-11-03.6-v2`, `2026-11-03.7-v2`, `2026-11-03.8-v2`
- `2026-11-04-v2`, `2026-11-04.2-v2`

Algunos guiones y encargos de ciclos que se quedan (por ejemplo, los de
`2026-11-05-v2`) y los comentarios de los lotes SQL que se quedan nombran
estas carpetas: son historia de ese día y no los ejecuta nada.

**Se queda a propósito `2026-10-23-v2`**: los expedientes de 11 ofertas en
`2026-11-01-v2` (los últimos que hay de ellas, que el ciclo del catálogo manda
leer) citan su `radar-canonico-26.json` como prueba.

## Lotes de importación (`rwadar-app/data/importaciones/`)

Seis lotes SQL anteriores a la cadena que se ensaya en PGlite, que empieza en
`catalogo-2026-10-22-v2` (esa y todas las posteriores se quedan, igual que
`escaparate-2026-08-27`):

- `catalogo-2026-09-27`, `catalogo-2026-09-28`
- `catalogo-2026-10-06-v2`, `catalogo-2026-10-19-v2`,
  `catalogo-2026-10-20-v2`, `catalogo-2026-10-21-v2`

## Lo que quitaron antes otras partes de la misma limpieza

Mismo método para recuperarlo:

- **Archivos muertos fuera de la app:** la copia de agosto
  `rwadar-version-codex/`; las carpetas de pruebas antiguas de `.github/`
  (`pruebas-android`, `qa-android-authenticated-140`,
  `qa-android-update-141`, `qa-archivo` y `qa-web-browser-141`); los guiones
  de un día de `rwadar-app/` (`comprobar-revision-2026-10-06.mjs`,
  `probar-cuentas-web-carreras.mjs`, `probar-destinos-v1.mjs`,
  `probar-fuentes-destinos.mjs` y `reparar-fuentes-destinos-20260930.cjs`), y
  los lotes `catalogo-2026-09-30`, `catalogo-2026-09-30-v1-destinos` y
  `catalogo-2026-09-30-v2`.
- **App móvil:** `rwadar-movil/lib/config-ios-uuid-seguro.js`,
  `rwadar-movil/tests/ios-uuid-seguro.test.cjs` y
  `rwadar-movil/verificar-catalogo-remoto.cjs`. El modo local que nunca se
  encendía salió de dentro de otros archivos de la app (el mismo commit, con
  `git log --oneline -1 -- rwadar-movil/lib/modo-local.js`). La guía larga
  anterior de la app está en
  [`LEEME-MOVIL-hasta-2026-11-21.md`](LEEME-MOVIL-hasta-2026-11-21.md).

## Documentos que solo cambiaron de sitio

No se quitó nada; están enteros, con los enlaces corregidos:

- Nueve documentos de octubre (planes, estado y revisiones de pendientes), en
  [`../2026-10/`](../2026-10/).
- Las entradas del traspaso entre Codex y Claude hasta el 13/11/2026, en
  [`PARA-CODEX-hasta-2026-11-13.md`](PARA-CODEX-hasta-2026-11-13.md).

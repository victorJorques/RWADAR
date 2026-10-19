# Revisión del catálogo de octubre

Petición de Víctor del 19/10/2026: renovar el catálogo, caducado desde el
13/10 (lote del 06/10). Si continúas esta tarea en otra sesión, empieza aquí.

## Estado

- **19/10, segunda sesión (con internet): hecha y probada, sin aplicar.**
  Lote `aa3aebce` (19/10, vigente hasta el 26/10). Fuentes y fichas
  consultadas el 19/10; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json` y
  resumen en `docs/CATALOGO-V2-2026-10-19.md`. Enlace de claude.ai retirado.
- Falta lo de Víctor: pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase y publicar la web.
- Las siguientes se hacen con `npm run catalogo` (ver «Pasos»), probado de
  punta a punta el 19/10 simulando el 20/10: 69/69 fuentes, 49 fichas al día,
  lote probado en PGlite. Desde la nube, Midas bloquea sus páginas de producto
  (mF-ONE y mTBILL quedan sin cifra); desde España suele dejar leerlas.
- El lote de esta revisión se hizo a mano (el archivo de cambios es la fuente)
  porque la orden única no existía todavía.

## Pasos (desde el 19/10, una sola orden)

1. `npm run catalogo` (es `node rwadar-app/actualizar-catalogo.mjs`). Lee de
   nuevo todo, pone al día las fichas, monta el lote y lo prueba en PGlite.
2. Leer `rwadar-app/data/verificaciones/<fecha>-v2/informe-<fecha>.md`. Si
   dice «NO LISTA», resolver a mano lo que lista (fuente que ya no carga o ya
   no dice lo que respalda: cambiarla por otra oficial equivalente o retirarla,
   y ajustar `rwadar-app/data/comprobaciones-fuentes.json`) y repetir.
3. `npm test`, `docs/CATALOGO-V2-<fecha>.md`, entrada en
   `docs/tareas/PARA-CODEX.md`, commit, push y PR.
4. Víctor pega `aplicar-y-aprobar.sql` en Supabase (desde la fecha del lote,
   después de las 02:00 de España) y se publica la web **desde la rama que
   está en producción** (hoy, `codex/cuentas-web-movil`).

## Reglas de esta revisión

- La fecha del lote es la del día en que se consultan las fuentes. Todas las
  fuentes del radar llevan esa fecha: la que no cargue se cambia por una
  página oficial equivalente del mismo emisor o regulador, o se retira.
- Una cifra solo se renueva si se lee ese día en la fuente oficial
  (`"cifras": "comprobadas"`); si no, la ficha pasa a «no verificable», pierde
  la cifra y lleva aviso. `"noRevisada"` ya no sirve: la app rechaza fichas con
  más de 7 días respecto a la fecha del lote.
- **Enlace de claude.ai:** las 49 fichas citan como «Fuente 1»
  `https://claude.ai/code/artifact/09900c9d-…` (el documento que aportó
  Víctor el 30/09), y 205 de las 401 referencias fechadas remiten a él. Se
  propuso a Víctor quitarlo (`retirarFuentes`) y dejar solo las fuentes
  oficiales; si no dice lo contrario, se quita.

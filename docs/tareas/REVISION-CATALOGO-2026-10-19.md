# Revisión del catálogo de octubre

Petición de Víctor del 19/10/2026: renovar el catálogo, caducado desde el
13/10 (lote del 06/10). Si continúas esta tarea en otra sesión, empieza aquí.

## Estado

- **19/10, segunda sesión (con internet): hecha y probada, sin aplicar.**
  Lote `f9876935` (19/10, vigente hasta el 26/10). Fuentes y fichas
  consultadas el 19/10; evidencia en
  `rwadar-app/data/verificaciones/2026-10-19-v2/contraste-2026-10-19.json` y
  resumen en `docs/CATALOGO-V2-2026-10-19.md`. Enlace de claude.ai retirado.
- Falta lo de Víctor: pegar
  `rwadar-app/data/importaciones/catalogo-2026-10-19-v2/aplicar-y-aprobar.sql`
  en Supabase y publicar la web.
- Para la próxima revisión, desde España o desde un navegador normal: Midas
  bloquea las consultas automáticas desde la nube (mF-ONE y mTBILL quedaron sin
  cifra), y la SEC, republic.com y la documentación legal de Backed también.
  El generador de esta revisión no está en el repositorio: el archivo de
  cambios es la fuente.

## Pasos

1. `node rwadar-app/capturar-fuentes.mjs <fecha anterior> /ruta/capturas.json`
   (todas las fuentes del radar y los destinos de las 49 fichas de esa revisión).
2. Repasar cada fuente frente a lo que dice el lote del 06/10
   (`rwadar-app/data/verificaciones/2026-10-06-v2/contraste-2026-10-06.json`
   tiene la nota de cada una) y cada ficha: cifras de las principales en su
   página oficial, mercado P2P de Reental (`p2p.rnt.finance`, las 3 páginas,
   o la API pública de solo lectura que usa la propia web), emisiones y
   proyectos en preparación. midas.app y docs.midas.app pueden pedir el
   desafío de Cloudflare: entonces hace falta un navegador real.
3. Escribir lo comprobado en
   `rwadar-app/data/verificaciones/<fecha>-v2/cambios-<fecha>.json` (formato
   en la cabecera de `montar-revision.mjs`) y la evidencia en
   `contraste-<fecha>.json`, como el 06/10.
4. `node rwadar-app/montar-revision.mjs <fecha>` y
   `node rwadar-app/comprobar-revision.mjs <fecha>`; `npm test`.
5. `docs/CATALOGO-V2-<fecha>.md`, `docs/INTERNO.md`, entrada en
   `docs/tareas/PARA-CODEX.md`, commit, push y PR. Víctor pega
   `aplicar-y-aprobar.sql` en Supabase (desde la fecha del lote, después de
   las 02:00 de España) y después se publica la web como siempre.

## Reglas de esta revisión

- La fecha del lote es la del día en que se consultan las fuentes. Todas las
  fuentes del radar llevan esa fecha: la que no cargue se cambia por una
  página oficial equivalente del mismo emisor o regulador, o se retira.
- Una cifra solo se renueva si se lee ese día en la fuente oficial
  (`"cifras": "comprobadas"`); si no, `"noRevisada": true` y se queda con su
  fecha (la base la oculta al vencer).
- **Enlace de claude.ai:** las 49 fichas citan como «Fuente 1»
  `https://claude.ai/code/artifact/09900c9d-…` (el documento que aportó
  Víctor el 30/09), y 205 de las 401 referencias fechadas remiten a él. Se
  propuso a Víctor quitarlo (`retirarFuentes`) y dejar solo las fuentes
  oficiales; si no dice lo contrario, se quita.

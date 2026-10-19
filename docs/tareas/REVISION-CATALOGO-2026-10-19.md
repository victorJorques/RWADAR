# Revisión del catálogo de octubre (en curso)

Petición de Víctor del 19/10/2026: renovar el catálogo, caducado desde el
13/10 (lote del 06/10). Si continúas esta tarea en otra sesión, empieza aquí.

## Estado

- Hecho, en esta rama: `rwadar-app/capturar-fuentes.mjs` (lee las fuentes en
  Chromium), `rwadar-app/montar-revision.mjs` (monta el lote y el SQL) y
  `rwadar-app/comprobar-revision.mjs` (lo prueba en PGlite sobre el lote que
  está en producción). Ensayados con un lote de prueba, ya borrado.
- **No se ha consultado ninguna fuente todavía:** la sesión del 19/10 no tenía
  internet (el entorno solo dejaba salir a GitHub y npm).
- Nada aplicado en Supabase ni publicado.

## Pasos

1. `node rwadar-app/capturar-fuentes.mjs 2026-10-06 /ruta/capturas.json`
   (126 URL: 72 fuentes del radar y los destinos de las 49 fichas).
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

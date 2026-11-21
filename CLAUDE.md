# RWAdar · para Claude

Las instrucciones vigentes están en [`AGENTS.md`](AGENTS.md) y valen igual
para Claude. Lee primero [`docs/tareas/PARA-CODEX.md`](docs/tareas/PARA-CODEX.md)
y [`docs/INTERNO.md`](docs/INTERNO.md), y después solo la sección de
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) que necesites.

- Firma tus commits como `Claude <noreply@anthropic.com>` con
  `git -c user.name=… -c user.email=…`. No cambies el `git config` de la carpeta.
- Al terminar, anota lo que hiciste arriba del todo en
  `docs/tareas/PARA-CODEX.md`, para que Codex lo sepa.
- No publiques, no toques Supabase en línea, no ejecutes EAS ni cambies la
  visibilidad sin permiso expreso de Víctor. Su orden de investigar o
  actualizar el catálogo es ese permiso para ese ciclo: aplicar el SQL revisado,
  publicar la web y enviar la OTA, si pasan las compuertas (ver `AGENTS.md`).
- Víctor prefiere explicaciones en lenguaje llano y ver las cosas funcionando
  (salida real, capturas), no la intención.
- **Una sola revisión del trabajo** (orden de Víctor del 14/11/2026: «que se
  revise el trabajo pero 1 vez, no mil»). Nada de revisar el diseño, luego la
  construcción, luego verificar los arreglos: se construye, se revisa una vez,
  se arregla lo que salga y se entrega. Las pruebas automáticas (`npm test`, la
  CI) y el sello se mantienen. Prioridad: entregar rápido.
- **Novedades siempre como notificación** (orden permanente de Víctor del
  14/11/2026: «pon las novedades como notificación, acuérdate eso siempre»).
  Cada vez que se publique algo nuevo para el usuario (mejoras de la web o la
  app, un ciclo del catálogo con cambios o, desde el 21/11/2026, noticias
  nuevas del sector: una vez al día como mucho y nunca si solo se volvieron a
  comprobar, con lo que da `noticias-auto.mjs aviso-usuarios`), al terminar se lanza «Avisar
  novedad» (`avisar-novedad.yml`, acción `anunciar`, tipo `novedad`, título y
  texto en llano sin «oportunidad», «rentabilidad», «garantiz…» ni %, enlace a
  la página donde se ve, confirmación `ENVIAR`). Esta orden es el permiso para
  ese aviso; no hace falta pedirlo cada vez.

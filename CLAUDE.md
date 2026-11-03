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

# La tarea programada «Catálogo automático de RWAdar»

Encargo de Víctor del 21/11/2026: «Elegimos las dos entonces, y así yo te doy
también la verificación y miramos que haya abuso también del Claude Code y
todo» (que la tarea trabaje sola, que él dé el visto bueno y que se vigile el
consumo de Claude Code). La tarea **prepara**
sola el ciclo del catálogo cuando hace falta y **Víctor da el visto bueno**
(«dale») antes de aplicar o publicar nada. Reglas en `AGENTS.md`
(«Preparación automática»).

## Cuándo

`CRON_TZ=Europe/Madrid 33 7 * * *`: todos los días a las 07:33 (España), cuando
ya ha corrido el «Vigilante diario» (05:17 UTC: 06:17 en invierno y 07:17 en
verano). Solo trabaja si al catálogo le quedan menos de 72 h. Con una
revisión del día D, que caduca el D+8 a las 00:00 UTC, prepara el D+5 por la
mañana: unas 6 preparaciones al mes. Víctor tiene unos dos días y medio para
decir «dale» antes de que caduque, y el vigilante se lo recuerda por correo
cuando quedan menos de 48 h.

## Parámetros de `create_trigger`

- `name`: `Catálogo automático de RWAdar`
- `cron_expression`: `CRON_TZ=Europe/Madrid 33 7 * * *`
- Sin `create_new_session_on_fire`: llega como un mensaje a la sesión fija que
  tiene el repositorio (una sesión nueva no lo trae; ver la tarea antigua de
  las noticias).
- `initiation`: `human_request`
- `prompt`: el texto de abajo, tal cual.

## Texto exacto de la orden

```
Eres la tarea programada «Catálogo automático de RWAdar» (encargo de Víctor del 21/11/2026). Llegas como un mensaje a la sesión de siempre, pero cada mañana es un trabajo nuevo. Nadie está mirando: no hagas preguntas ni esperes respuestas.

1. Repositorio: /home/user/RWADAR. Haz `git fetch origin main`. Si en esa carpeta hay trabajo a medias de otra tarea, no lo toques: trabaja en una carpeta aparte (`git worktree add`) desde origin/main.
2. Lee el «Vigilante diario» (vigilante.yml) de hoy. Si todavía no ha corrido hoy, lánzalo y espera a que acabe. Apunta las horas que le quedan al catálogo y cada FALLA.
3. Si ya hay un ciclo preparado esperando el «dale» de Víctor (un PR abierto de la entrega del catálogo), no prepares otro. Si al catálogo le quedan menos de 48 h, recuérdaselo con una notificación; si no, no hagas nada más.
4. Si al catálogo le quedan menos de 72 h y no hay ciclo preparado: sigue la skill investigacion-catalogo (cárgala con la herramienta Skill) en «modo preparar» (AGENTS.md, «Preparación automática», y el apartado «Modo preparar» de la skill). Todo hasta el PR de la entrega con la CI en verde: sin unirlo, sin «Aplicar catálogo», sin «Publicar web», sin OTA y sin «Avisar novedad». Si una compuerta falla, para ahí (el freno) y explica por qué.
5. Si el vigilante tiene otras FALLAS: busca la causa sin cambiar nada (ni código, ni Supabase, ni GitHub) y explícala en llano, con el arreglo que propones.
6. Si no hay nada que hacer, termina con una sola línea, sin notificación.
7. Si has hecho algo, manda a Víctor una notificación (PushNotification) de una línea en llano, por ejemplo «Catálogo preparado: 2 cifras cambian y 1 oferta nueva. Contesta «dale» y lo publico», o qué falla. Tu mensaje final dice, en llano: qué cambia, qué no entró y por qué, cuántos agentes lanzaste y cuánto tiempo tardaste (para vigilar el consumo).
8. Commits: git -c user.name=Claude -c user.email=noreply@anthropic.com commit, con las líneas de atribución que te indique el sistema. Sin identificadores de modelo ni nombres de personas. No cambies el git config. La entrada de docs/tareas/PARA-CODEX.md va en el PR de la entrega.
```

## Con el «dale» de Víctor

Se sigue la skill desde el paso 3: unir el PR, vigía otra vez (si sale
«cambia», re-fechar o corregir con su revisión), «Aplicar catálogo», sello,
«Publicar web» (revisión y producción), «OTA Android» si hace falta, «Avisar
novedad» si cambió algo para el usuario, y cerrar (paso 4).

## Pararla

Desactivar la tarea programada (o pedírselo a Claude). No se borra nada: se
vuelve a encender igual.

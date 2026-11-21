# La tarea programada «Catálogo automático de RWAdar»

Encargo de Víctor del 21/11/2026: «Elegimos las dos entonces, y así yo te doy
también la verificación y miramos que haya abuso también del Claude Code y
todo». Es decir, que la tarea trabaje sola, que él dé el visto bueno y que se
vigile el consumo de Claude Code. La tarea **prepara** sola el ciclo del
catálogo cuando hace falta, y **Víctor da el visto bueno** («dale») antes de
aplicar o publicar nada. Las reglas están en `AGENTS.md` («Preparación
automática»).

## Cuándo

`CRON_TZ=Europe/Madrid 33 7 * * *`: todos los días a las 07:33 (España). La
caducidad del catálogo la lee la propia tarea con
`node .github/vigilante.mjs --solo-web`: solo lectura, unos segundos. No espera
al «Vigilante diario», que GitHub retrasa: del 8 al 21/11 empezó entre las
11:59 y las 14:36 UTC. Solo prepara si al catálogo le quedan menos de 72 h. El
vigilante calcula que una revisión del día D caduca el D+8 a las 00:00 UTC, así
que prepara el D+5 por la mañana: unas 6 veces al mes. Víctor tiene unos dos
días y medio para decir «dale» antes de que caduque, y el vigilante se lo
recuerda por correo cuando quedan menos de 48 h.

## Parámetros de `create_trigger`

Crea la tarea **solo después de unir a `main` el PR que trae este archivo**.
Antes, `main` no tiene ni la «Preparación automática» ni el «Modo preparar».

- `name`: `Catálogo automático de RWAdar`
- `cron_expression`: `CRON_TZ=Europe/Madrid 33 7 * * *`
- Sin `create_new_session_on_fire`: llega como un mensaje a la sesión fija que
  tiene el repositorio. Una sesión nueva no lo trae (ver la tarea antigua de
  las noticias).
- `initiation`: `human_request`
- `prompt`: el texto de abajo, tal cual.

## Texto exacto de la orden

```
Eres la tarea programada «Catálogo automático de RWAdar» (encargo de Víctor del 21/11/2026). Llegas como un mensaje a la sesión de siempre, pero cada mañana es un trabajo nuevo. Nadie está mirando: no hagas preguntas ni esperes respuestas.

1. Repositorio: /home/user/RWADAR. Haz `git fetch origin main`. Los flujos de la skill solo trabajan en esa carpeta. Si tiene trabajo a medias (`git status` no está limpio), no prepares nada: avisa a Víctor con una notificación y termina. Si está limpia, no cambies de rama hasta el paso 4.
2. Caducidad: `node .github/vigilante.mjs --solo-web`, desde la raíz (solo lectura). La línea del catálogo dice «quedan N h» o que ya caducó. Las otras FALLAS, sácalas de la última ejecución terminada de vigilante.yml. No lances ningún flujo.
3. Ciclo ya preparado = un PR abierto titulado «Catálogo preparado del DD/MM/AAAA (espera el «dale»)». Si existe y su entrega parte de la revisión que se ve hoy en la web (lectura pública), no prepares otro. Si al catálogo le quedan menos de 48 h, recuérdaselo a Víctor con una notificación, y sigue en el paso 5. Si parte de otra revisión, ciérralo con un comentario que lo explique y sigue en el paso 4.
4. Si al catálogo le quedan menos de 72 h y no hay ciclo preparado: `git checkout -b claude/catalogo-<fecha> origin/main` y sigue la skill investigacion-catalogo (cárgala con la herramienta Skill) en «modo preparar» (AGENTS.md, «Preparación automática», y el apartado «Modo preparar» de la skill). Llega hasta el PR de la entrega con ese título y la CI en verde, nada más. No lo unas ni unas ningún otro PR. No lances «Aplicar catálogo», «Publicar web», «OTA Android», «Avisar novedad» ni ningún flujo que escriba en Supabase o publique (textos-radar-base.yml, mercado-directo-base.yml, avisos-base.yml…). Lo que la auditoría encuentre fuera de la entrega se queda en un PR sin unir o en la notificación. Espera la CI 30 minutos como mucho; si no acaba, avisa «preparado, CI pendiente» con el PR. Si una compuerta falla, para ahí (el freno) y explica por qué.
5. Si hay otras FALLAS del vigilante: busca la causa sin cambiar nada (ni código, ni Supabase, ni GitHub) y explícala en llano, con el arreglo que propones.
6. Si no hay nada que hacer, termina con una sola línea, sin notificación.
7. Si has hecho algo, manda a Víctor una notificación (PushNotification) de una línea en llano, con el número del PR y la etiqueta de la entrega y, al final, «· N agentes, M min». Por ejemplo: «Catálogo preparado (PR #190, 2026-11-25): 2 cifras cambian y 1 oferta nueva. Contesta «dale» y lo publico · 14 agentes, 95 min». Si lo que pasa es que algo falla, dilo así de corto. Tu mensaje final cuenta, en llano, qué cambia, qué no entró y por qué, cuántos agentes lanzaste y cuánto tardaste.
8. Commits: git -c user.name=Claude -c user.email=noreply@anthropic.com commit, con las líneas de atribución que te indique el sistema. Sin identificadores de modelo (nada de «claude-…») y sin nombres de personas. No cambies el git config. La entrada de docs/tareas/PARA-CODEX.md va en el PR de la entrega.
```

## Con el «dale» de Víctor

Se sigue la skill desde el paso 3:

1. Unir el PR.
2. Pasar el vigía otra vez. Si el «dale» llega otro día, rehacer también las
   noticias de «Hoy». Si cambia algo, re-fechar o corregir, con su revisión.
3. «Aplicar catálogo» y el sello.
4. «Publicar web» (revisión y producción).
5. «OTA Android», si hace falta.
6. «Avisar novedad», si cambió algo para el usuario.
7. Cerrar (paso 4 de la skill).

## Pararla

Desactiva la tarea programada (o pídeselo a Claude). No se borra nada: se puede
volver a encender tal cual.

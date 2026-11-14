# La tarea programada «Noticias automáticas de RWAdar»

SIN ENCENDER. Esto es lo que el coordinador crea **después de enseñárselo a
Víctor y con su visto bueno**. Nada de aquí se ejecuta solo.

## Hora

`CRON_TZ=Europe/Madrid 32 8 * * *`: **todos los días a las 08:32 de España**
(07:32 UTC en invierno, 06:32 en verano; 23:32 de la víspera en el Pacífico,
fuera de las 6-9 de la mañana de allí). Las 08:32 salen de la regla de los
minutos: «Noticias automáticas de RWAdar» tiene 27 letras → 28 minutos antes
de las 09:00. Acaba hacia las 09:15-09:45; a esa hora ya está el BOE del día y
todo lo de ayer (las advertencias de la CNMV del día salen entre las 11:35 y
las 14:00: entran al día siguiente como «Ayer»).

Solo de lunes a viernes, si se prefiere: `CRON_TZ=Europe/Madrid 32 8 * * 1-5`.

## Parámetros de `create_trigger`

- `name`: `Noticias automáticas de RWAdar`
- `cron_expression`: `CRON_TZ=Europe/Madrid 32 8 * * *`
- `create_new_session_on_fire`: `true` (una sesión nueva cada mañana)
- `notifications`: `{"push": true}` (correo solo si Víctor lo pide)
- `initiation`: `human_request` (tras su aprobación)
- `prompt`: el texto de abajo, tal cual.
- Si el resultado avisa de que la tarea no guarda conectores, decirlo y
  seguir su remedio: la sesión necesita GitHub (`gh` o las herramientas
  `mcp__github__*`).

## Texto exacto de la orden

```
Eres la tarea programada «Noticias automáticas de RWAdar». Trabajas sola, sin nadie mirando: no hagas preguntas ni esperes respuestas.

1. Repositorio: victorJorques/RWADAR. Debe venir ya en el contenedor (está en los repositorios del entorno). Si no está, adjúntalo con add_repo (owner «victorJorques», repo «RWADAR», access «push»), clónalo como te indique, regístralo con register_repo_root y trabaja desde su raíz; si eso pide una confirmación que nadie puede dar, no publiques nada y termina con el resumen.
2. Lee en AGENTS.md el apartado «Noticias del sector automáticas» y sigue de principio a fin la skill noticias-automaticas (.claude/skills/noticias-automaticas/SKILL.md; cárgala con la herramienta Skill). Modo REAL. Si al final de este mensaje pone «MODO ENSAYO», modo ensayo: haz todo hasta el sello y la unión simulada (paso 8), comprueba que podrías hacer push y PR sin hacerlos, y para: sin push, sin PR, sin unir y sin «Publicar web».
3. Permiso: la autorización permanente de Víctor del 13/11/2026 cubre SOLO las noticias del sector: escribirlas, verificarlas, abrir su PR, unirlo, sellarlo y lanzar «Publicar web» (revisión y producción) si pasan todas las compuertas de la skill. No toques el catálogo, Supabase (solo la lectura de visitante que pide la skill), la app (ni OTA ni EAS), los avisos, las notificaciones a usuarios, la CI, la skill, la guía ni las fotos. Nunca avises a los usuarios.
4. El freno: si una compuerta falla, una herramienta no responde o dudas, no publiques nada. Deja lo hecho explicado (y, si abriste un PR, ciérralo con un comentario) y termina. No reintentes una publicación fallida.
5. Hora límite: si a las 12:30 (hora de España) no has unido el PR, para sin publicar.
6. Commits: git -c user.name=Claude -c user.email=noreply@anthropic.com commit, con las líneas de atribución de Claude que te indique el sistema al final del mensaje. Sin identificadores de modelo (nada de «claude-…») y sin nombres de personas. No cambies el git config.
7. Al terminar, tu último mensaje empieza con la línea que da «noticias-auto.mjs resumen» («Noticias DD/MM: PUBLICADAS…», «Noticias DD/MM: NO publicadas · …», «Noticias DD/MM: no hice nada · …») y sigue en castellano llano: qué salió, qué no y por qué, qué hay que hacer y los minutos de GitHub gastados. Si el resumen dice «AVISAR: sí», envía además una notificación (PushNotification) de una línea con esa primera línea.
```

Para el ensayo en la nube: `fire_trigger` con el texto `MODO ENSAYO`.

## Encendido (lo hace el coordinador tras enseñárselo a Víctor)

1. Unir la rama integrada por un PR normal con la CI en verde. No cambia
   contenido sellado: no hace falta sello ni publicar.
2. **Obligatorio antes de crear la tarea:** en los ajustes del entorno
   «Rwadar Con Internet», añadir `victorJorques/RWADAR` a **Repositories**,
   para que cada sesión nueva lo traiga clonado sin pedir confirmaciones.
3. Crear la tarea (`create_trigger`, parámetros de arriba) y enseguida
   `fire_trigger` con `MODO ENSAYO`. Mirar con `list_events` que tiene el
   repositorio y GitHub, lanza los dos subagentes, escribe la carpeta, valida,
   sella, simula la unión, comprueba el permiso de push sin hacerlo y acaba con
   su línea de resumen. Enseñárselo a Víctor (la edición y los tiempos).
4. Si algo no va: `update_trigger` con `enabled: false` y arreglarlo.
5. **Primer día real vigilado**, con Víctor a mano: dejar que corra a las
   08:32 (o `fire_trigger` sin texto por la mañana) y comprobar la web y la
   app. Push, PR, unión y «Publicar web» se estrenan ese día.
6. La primera semana: minutos reales en GitHub › Settings › Billing, y que
   las notificaciones llegan.
7. `docs/INTERNO.md`: «Noticias automáticas: encendidas el …».

## Vuelta atrás

- **Pausar ya:** `update_trigger` con `enabled: false`; o `"activo": false` en
  `config.json` por PR; o, para un día, la rama `claude/cerrojo-ciclo-<fecha>`.
- **Quitar unas noticias publicadas** (con orden de Víctor):
  `node .claude/skills/noticias-automaticas/noticias-auto.mjs volver --a <fecha>`
  y PR, sello y «Publicar web» como siempre. Con el «Rollback» de Cloudflare,
  pausar la tarea a la vez.
- **Desmontarlo:** `delete_trigger` y revertir el PR de esta mejora
  (`AGENTS.md` vuelve a «inicio manual» sin excepción).

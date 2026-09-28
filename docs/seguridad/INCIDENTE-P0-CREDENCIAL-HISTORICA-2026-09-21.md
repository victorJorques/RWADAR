# RWAdar · incidente P0 de credencial histórica

Estado actual: **revocación declarada por el titular; investigación histórica limitada**.  
El bloqueo inicial del 21/09 se revisa con la evidencia del 27/09 y el cierre
de permisos del servidor. El estado del lanzamiento está en `docs/INTERNO.md`.
Detectado: 21 de septiembre de 2026.  
Alcance de esta revisión: repositorio local e historial Git y comprobación
visual, de solo lectura, del inventario de tokens y del límite de retención del
registro de auditoría de Supabase. No se leyó, copió, probó ni revocó ninguna
credencial.

## Hallazgo

El commit `229450ce4ee1690f26e3f7c52e9f0e57d8794ea6`, fechado el 14 de agosto
de 2026, contiene un token personal de Supabase con prefijo `sbp_` dentro de
`rwadar-app/instalar-base-de-datos.cmd`.

El valor no se reproduce, no se copia y no debe volver a leerse. El archivo ya
no contiene ese patrón desde el commit
`d6b805b61af0b1ef006f3c0785fcfbaa9d87b03b`, pero eliminarlo del archivo no lo
eliminó de los objetos ni de las ramas históricas de Git. El commit afectado es
alcanzable desde ramas locales y remotas, incluida `origin/main` en la revisión
local.

El titular confirmó el 27/09 que el token personal ya está revocado. Se registra
su declaración, sin atribuir al proveedor una confirmación que no ha aportado.
La rotación de la clave publicable del 25/08 corresponde a otra credencial.

## Impacto y prioridad

Un token personal de Supabase puede autorizar operaciones de administración
según los permisos de la cuenta y del proveedor. Mientras no se confirme la
revocación y se revise la actividad, debe tratarse como comprometido. Un Git
privado no lo hace seguro frente a clones, colaboradores, copias, cachés o una
visibilidad histórica distinta.

Clasificación: `P0` para el relanzamiento porque una credencial administrativa
histórica sin cierre verificable invalida la afirmación de que producción está
preparada. No demuestra por sí sola que haya habido abuso.

## Evidencia segura reproducible

El hallazgo se comprueba sin imprimir el secreto:

```powershell
git grep -l -E 'sbp_[A-Za-z0-9]{12,}' `
  229450ce4ee1690f26e3f7c52e9f0e57d8794ea6 -- .
```

Resultado esperado: solo el nombre del archivo afectado. Una búsqueda por el
mismo prefijo en el árbol de trabajo actual no devuelve coincidencias. La
revisión focalizada tampoco encontró prefijos conocidos de Stripe, secretos de
webhook, claves privadas o archivos sensibles versionados en el árbol actual.
Esto no sustituye un escáner de secretos formal ni la revisión de actividad del
proveedor.

## Comprobación del proveedor · 21 de septiembre de 2026

La cuenta autorizada mostró dos tokens personales heredados: uno activo, con
uso reciente y sin caducidad, y otro ya caducado. Ambos llevan nombres de otro
proyecto; no apareció ningún token identificable de forma inequívoca como
RWAdar. El valor histórico no se recuperó para compararlo y la ausencia de un
nombre coincidente no demuestra por sí sola que el token expuesto esté
revocado: pudo eliminarse antes, renombrarse o corresponder a uno de los
elementos visibles.

El panel rechazó la consulta del periodo comprendido desde el 14 de agosto
porque la cuenta solo conserva un día de auditoría. Por tanto, desde ese panel
no puede completarse retrospectivamente el punto 2 del cierre. La incidencia
sigue abierta y no se revoca el token activo a ciegas, ya que su uso reciente
indica que podría interrumpir otro proyecto. Antes hay que inventariar su
consumidor, preparar un reemplazo de alcance mínimo, migrarlo y verificarlo.

## Acciones realizadas

- Se confirmó el commit completo y el archivo sin revelar el valor.
- Se confirmó que el patrón ya no está en el archivo actual.
- Se confirmó que el objeto afectado sigue alcanzable en el historial.
- No se usó la credencial.
- Se accedió al panel oficial únicamente para leer el inventario y el límite de
  auditoría; no se generó, copió ni revocó ningún token.
- No se reescribió Git.

## Cierre obligatorio

Este P0 solo pasa a `CERRADO` cuando se adjuntan referencias no sensibles que
demuestren:

1. revocación del token en el proveedor o revocación de todos los tokens
   personales cuando no pueda identificarse de forma inequívoca;
2. revisión de actividad desde el 14 de agosto de 2026 hasta la revocación
   confirmada;
3. inventario de proyectos y credenciales a los que pudo dar acceso, con las
   rotaciones o decisiones de no rotar justificadas;
4. revisión de miembros, integraciones, funciones, secretos y cambios de
   configuración durante la ventana;
5. escaneo actual e histórico con una herramienta de secretos aprobada;
6. segunda revisión independiente y actualización del control
   `beta_segura_extremo_a_extremo`.

Reescribir el historial, si se decide, reduce la exposición accidental futura,
pero no sustituye la revocación ni permite considerar seguro el valor antiguo.
El procedimiento está en `docs/seguridad/RUNBOOK-REVOCACION-ROTACION.md`.

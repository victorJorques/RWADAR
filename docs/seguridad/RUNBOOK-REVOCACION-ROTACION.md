# RWAdar · runbook de revocación y rotación de credenciales

Estado: procedimiento de referencia para incidentes. El titular confirmó la
revocación del token histórico; el corte y sus límites constan en
`REVISION-SEGURIDAD-2026-09-27.md` y `../INTERNO.md`.
Ámbito inicial: token personal de Supabase expuesto en el historial Git.  
Regla: no pegar, comparar, probar ni transmitir el valor comprometido.

## 1. Contener

1. Ante un nuevo incidente activo, bloquear despliegues y escrituras afectadas
   durante la contención. El estado vigente lo determina `../INTERNO.md`.
2. No ejecutar el token antiguo para comprobar si funciona; el intento añade
   riesgo y no aporta una evidencia de cierre mejor que el panel del proveedor.
3. Designar responsable principal y segundo revisor. Usar un dispositivo y una
   sesión conocidos para entrar por la URL oficial escrita manualmente.
4. Abrir un registro privado del incidente con hora, persona y acciones, sin
   secretos, cookies, cuerpos de respuesta ni datos bancarios.

## 2. Revocar en Supabase

1. Revisar en la cuenta autorizada la lista de tokens personales y su metadato
   de creación, último uso y nombre, si el proveedor lo muestra.
2. Revocar el token que coincida con la exposición. Si no puede identificarse
   inequívocamente, revocar todos los tokens personales de las cuentas con
   acceso al proyecto.
3. Conservar solo una referencia del proveedor, la fecha, la persona y una
   captura o acta sin valor de token. La prueba de cierre nunca contiene el
   secreto.
4. Crear un token nuevo únicamente si una tarea actual lo necesita. Aplicar la
   duración y permisos mínimos que ofrezca el proveedor, guardarlo en el gestor
   de secretos y no pasarlo por argumentos, chat, correo, logs ni Git.

## 3. Investigar la ventana

Revisar desde el 14 de agosto de 2026 hasta la revocación confirmada:

- inicios de sesión, dispositivos, miembros y cambios de permisos;
- proyectos creados, vinculados, pausados, reactivados o eliminados;
- cambios de API, Auth, base de datos, Storage, Edge Functions, Vault, correo,
  webhooks y secretos;
- generación, lectura o rotación de claves de proyecto y contraseñas;
- operaciones CLI o administrativas no explicadas por el trabajo conocido;
- destinos de correo, URLs, integraciones y tareas programadas.

Exportar solo referencias y resúmenes necesarios. Si aparece actividad no
explicada, conservar evidencia y escalar el incidente antes de modificarla.

## 4. Rotar según alcance

El segundo revisor aprueba una matriz `credencial / exposición posible /
acción / responsable / fecha`. Si la ventana no puede descartarse, tratar como
potencialmente accesibles las credenciales administrativas del proyecto y
planificar su rotación con impacto y rollback.

- rotar tokens personales y sesiones administrativas afectadas;
- evaluar claves de servidor, contraseñas de base de datos, secretos de
  funciones y proveedores conectados;
- rotar claves publicables solo cuando corresponda, recordando que no son el
  mismo secreto que el token personal;
- no rotar a ciegas una clave que pueda interrumpir producción: identificar
  consumidores, desplegar el valor nuevo por el gestor de secretos, verificar
  y retirar el antiguo;
- no copiar valores viejos o nuevos al expediente de cierre.

## 5. Revisar Git y equipos

1. Ejecutar un escáner de secretos aprobado sobre árbol actual, historial,
   ramas y tags. Revisar resultados sin imprimir valores en logs compartidos.
2. Buscar copias en artefactos CI, paquetes, cachés, copias de seguridad,
   terminales y equipos autorizados.
3. Solo después de revocar y rotar, decidir si se reescribe el historial. Una
   reescritura requiere inventariar ramas, tags, forks y clones; coordinación,
   copia de seguridad, force-push deliberado y eliminación o reclonado de
   copias antiguas. No realizarla como un arreglo cosmético aislado.
4. Añadir una comprobación automática de secretos antes de permitir el
   relanzamiento y en cada cambio posterior.

## 6. Recuperación y apertura

Antes de cerrar:

- probar acceso con las credenciales nuevas y recuperación con MFA fuerte;
- revisar sesiones activas, administradores y datos de recuperación;
- confirmar que el árbol actual y el artefacto cliente no contienen secretos;
- adjuntar la evidencia no sensible al control de relanzamiento;
- obtener firma del responsable y segundo revisor;
- mantener la publicación bloqueada si falta un log, una cuenta o una rotación
  relevante.

El cierre documenta `revocado`, `actividad revisada`, `alcance resuelto` y
`rotaciones verificadas` por separado. Ninguna casilla presume las demás.

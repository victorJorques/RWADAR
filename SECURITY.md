# Política de seguridad de RWAdar

## Reportar una vulnerabilidad

Envía el informe de forma privada a `RWAdar@protonmail.com`, con asunto
`[SEGURIDAD RWADAR]`. El mismo contacto figura en
`/.well-known/security.txt` de la versión remediada.

Incluye, si es posible:

- URL o componente afectado;
- pasos mínimos para reproducir;
- impacto observado, sin exagerarlo;
- fecha y entorno de la prueba;
- capturas o petición/respuesta con tokens, correos y datos personales
  eliminados;
- una forma segura de contactarte.

No abras un issue público con detalles explotables antes de coordinar la
corrección.

## Alcance

Se pueden comunicar fallos de:

- `rwadar.netlify.app` y su PWA;
- autenticación, opiniones, moderación y borrado de cuenta;
- API/RPC, RLS, permisos y funciones de Supabase;
- aplicación móvil de RWAdar;
- publicación, cabeceras, CSP, service worker y privacidad técnica.

La producción pública y este repositorio no coinciden todavía. La web
remediada y la migración 22 están validadas localmente, pero pendientes de
despliegue/aplicación. Reporta un problema aunque parezca corregido en una sola
de las dos versiones, indicando cuál probaste.

## Prueba responsable

- No accedas a datos de otras personas ni descargues más información de la
  imprescindible para demostrar el fallo.
- No modifiques o borres datos ajenos.
- No realices denegación de servicio, spam, ingeniería social ni pruebas sobre
  proveedores de terceros.
- Usa una cuenta y datos propios; bórralos al terminar cuando sea seguro.
- Detente y avisa si encuentras credenciales, datos personales o acceso
  administrativo.

Esta política no crea un programa de recompensas ni promete una compensación.
Tampoco fija un plazo de respuesta: los tres responsables aún deben aprobar su
acuerdo interno. Se confirmará la recepción y se coordinará el seguimiento tan
pronto como sea razonablemente posible.

## Credenciales y claves

La clave publicable de Supabase aparece en cliente por diseño y no debe
tratarse como un secreto. Sí son sensibles, entre otros:

- tokens personales de Supabase o Netlify;
- claves `service_role`;
- tokens de sesión de usuarios;
- credenciales de proveedores de correo o push;
- secretos de Vault y claves de firma.

No los pegues en un issue, captura o repositorio. Si uno aparece expuesto,
informa solo de su ubicación y los responsables lo revocarán/rotarán.

## Responsables

RWAdar no tiene sociedad constituida. Gestionan conjuntamente los reportes:

- Eric Almiñana
- Samuel Rodriguez
- Victor Jorques

Contacto único: `RWAdar@protonmail.com`.

El acuerdo de corresponsabilidad y los plazos internos siguen pendientes de
aprobación; esta política no los da por cerrados.

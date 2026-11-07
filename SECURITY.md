# Política de seguridad de RWAdar

## Reportar una vulnerabilidad

Envía el informe de forma privada a `RWAdar@protonmail.com`, con asunto
`[SEGURIDAD RWADAR]`. El mismo contacto figura en
<https://rwadar.pages.dev/.well-known/security.txt> (válido hasta el
22/08/2027) y en la política pública de reporte,
<https://rwadar.pages.dev/privacidad#reporte-seguridad>.

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

- la web `https://rwadar.pages.dev` y su servidor de sesión (Cloudflare);
- cuentas: alta, entrada, sesión, recuperación de contraseña y borrado;
- la Academy con cuenta, los avisos a registrados y la página de baja
  (`/baja`), aunque los avisos sigan apagados;
- API/RPC, RLS, permisos y funciones de Supabase;
- la app Android de RWAdar (descargas en
  <https://github.com/victorJorques/RWAdar-downloads>) y sus actualizaciones;
- publicación, cabeceras, CSP, service worker y privacidad técnica;
- `rwadar.netlify.app`, que hoy solo sirve la página que desinstala la app
  web antigua.

Opiniones, comunidad y moderación están en pausa, con el acceso cerrado desde
la web y la app. Si encuentras un fallo en lo que quede de ellas, también se
puede reportar.

La web se publica desde la rama `main` de este repositorio. La migración 22,
que una versión anterior de este texto daba por pendiente, está aplicada y
verificada; las últimas aplicadas en la base son la 30 y la 31 (06/11/2026,
con los avisos apagados). Si ves una diferencia entre lo publicado y el
repositorio, indica qué versión probaste.

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

- tokens personales o de API de Supabase, Cloudflare, Expo, GitHub o Netlify;
- la conexión de la base (`SUPABASE_DB_URL`) y las claves `service_role`;
- la clave de las copias de seguridad (`COPIA_CLAVE`);
- tokens de sesión de usuarios;
- credenciales de proveedores de correo (Lettermint, la contraseña de
  aplicación del Gmail) o de push (Firebase);
- secretos de Vault y claves de firma.

No los pegues en un issue, captura o repositorio. Si uno aparece expuesto,
informa solo de su ubicación y los responsables lo revocarán/rotarán
([`docs/seguridad/RUNBOOK-REVOCACION-ROTACION.md`](docs/seguridad/RUNBOOK-REVOCACION-ROTACION.md)).
Si puede haber datos personales afectados, se sigue además
[`docs/legal/BRECHAS-DE-DATOS.md`](docs/legal/BRECHAS-DE-DATOS.md): hay 72
horas para avisar a la AEPD.

## Responsables

RWAdar no tiene sociedad constituida. Gestionan conjuntamente los reportes:

- Eric Almiñana
- Samuel Rodriguez
- Victor Jorques

Contacto único: `RWAdar@protonmail.com`.

El responsable del tratamiento de los datos personales es Víctor Manuel
Jorques Granero (privacidad, apartado 1). Si Eric Almiñana y Samuel Rodriguez
son además corresponsables en el sentido del RGPD (art. 26) está por decidir
([registro de actividades](docs/legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md),
apartado 1). Ese acuerdo y los plazos internos siguen pendientes de
aprobación; esta política no los da por cerrados.

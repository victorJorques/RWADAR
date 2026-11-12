# Registro de actividades de tratamiento · RWAdar

**Fecha:** 12/11/2026 (versión 5: notificaciones en la web, Web Push, con la
migración 32, y el permiso de avisos que ya se recoge en Perfil. La versión 4,
del mismo día: el buzón de RWAdar pasa a ser el Gmail rwadares@gmail.com. Ver
el historial al final).
**Quién lo lleva:** Víctor Manuel Jorques Granero, titular de RWAdar y
responsable del tratamiento. Es quien lo mantiene al día y lo entrega a la
Agencia Española de Protección de Datos (AEPD) si lo pide (RGPD, art. 30.4).
**Quién lo ha redactado:** Claude (IA), a petición del titular. No es el
dictamen de un abogado.
**Cada cuánto se revisa:** cada vez que cambie un tratamiento (un dato nuevo,
una finalidad nueva, un proveedor nuevo, encender un canal de avisos, cambiar
un plazo) y, como mínimo, una vez al año. Próxima revisión anual: antes del
06/11/2027.

**Por qué existe.** El RGPD (art. 30.1) y la LOPDGDD (art. 31) obligan a
llevarlo. La excepción para organizaciones de menos de 250 personas no se
aplica porque estos tratamientos no son ocasionales (RGPD, art. 30.5). No
tenerlo es una infracción grave (LOPDGDD, art. 73.n) y tenerlo incompleto, una
leve (art. 74.l). La propia privacidad (§9) remite a este registro para los
plazos de los registros técnicos.

**Fuentes.** Solo lo que dicen estos documentos; lo que no consta en ellos va
marcado:

- [`rwadar-site/privacidad.html`](../../rwadar-site/privacidad.html), versión
  revisada el 06/11/2026 y publicada ese día (en este documento, «privacidad
  §N»).
- [`docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`](../tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md)
  («contrato de avisos»).
- [`rwadar-app/db/30_avisos_registrados.sql`](../../rwadar-app/db/30_avisos_registrados.sql)
  («la 30»): aplicada en Supabase el 06/11/2026, con todo apagado.
- `rwadar-app/db/31_correo_lettermint.sql` («la 31»): cambia el envío del
  correo de Brevo a Lettermint. Aplicada en Supabase el 06/11/2026, con copia
  previa y el correo apagado.
- [`docs/legal/encargados/README.md`](encargados/README.md): los contratos de
  encargo de cada proveedor, con citas y copia en PDF del 06/11/2026.
- [`docs/COPIAS-DE-SEGURIDAD.md`](../COPIAS-DE-SEGURIDAD.md) y
  `rwadar-app/copia-seguridad.sh`.
- [`docs/RUNBOOK.md`](../RUNBOOK.md), apartado «Avisos a registrados».
- La revisión legal del 06/11/2026 (§§ 4.5, 4.11, 4.13 y 5.1) y su contraste
  (puntos 1, 3, 7, 9, 11, 15 y 16). El RUNBOOK la enlaza como
  `docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`.
- Para detalles concretos: [`SECURITY.md`](../../SECURITY.md),
  [`docs/INTERNO.md`](../INTERNO.md), `rwadar-acceso/servidor.mjs` y
  `rwadar-app/db/29_cartera_cuenta.sql`.

**Cómo leer las marcas:**

- **(pendiente):** depende de un paso futuro que aún no se ha dado (dominio
  propio, Lettermint y su verificación, encender el correo o el push…). Hoy no
  ocurre.
- **verificar:** el dato no consta con claridad en las fuentes, o las fuentes
  no coinciden. Hay que comprobarlo y corregir esta línea.

---

## 1. Responsable (común a todas las fichas)

| | |
|---|---|
| **Responsable** | Víctor Manuel Jorques Granero, persona física. NIF 20861074M. |
| **Domicilio** | Plaza Generalitat, s/n, 46600 Alzira, Valencia, España. |
| **Nombre del proyecto** | RWAdar (no hay sociedad constituida). |
| **Contacto de privacidad** | rwadares@gmail.com |
| **Corresponsables** | Ninguno según la privacidad (§1), que nombra solo al titular. **verificar:** `SECURITY.md` dice que Eric Almiñana, Samuel Rodriguez y Víctor Jorques gestionan «conjuntamente» los reportes de seguridad y que el «acuerdo de corresponsabilidad» está pendiente; `docs/INTERNO.md` los llama «corresponsables». Hay que decidir si es solo responsabilidad del proyecto o una corresponsabilidad del RGPD (art. 26), que exigiría un acuerdo escrito y cambiar la privacidad. |
| **Representante en la UE** | No aplica: el responsable está en España. |
| **Delegado de protección de datos** | No designado. **No es obligatorio** (comprobado el 07/11/2026; razonamiento debajo de esta tabla). |

**Por qué no hace falta delegado de protección de datos.** El RGPD (art. 37.1)
lo exige solo en tres casos, y la LOPDGDD (art. 34.1) añade una lista cerrada
de entidades. RWAdar no está en ninguno:

- **No es una autoridad ni un organismo público** (art. 37.1.a).
- **Su actividad principal no es observar a la gente de forma habitual y
  sistemática a gran escala** (art. 37.1.b). Es un radar editorial: no hay
  perfiles, ni seguimiento, ni decisiones automatizadas (privacidad §§2 y 10);
  la analítica es agregada y sin cookies (A12). El 06/11/2026 había 9 cuentas.
- **No trata a gran escala categorías especiales ni datos penales**
  (art. 37.1.c). La cartera puede revelar la situación económica, pero no es
  una categoría especial del art. 9 (A2).
- **No es ninguna de las entidades del art. 34.1 de la LOPDGDD.** Las que más
  se le podrían parecer tampoco encajan:
  - letra **h**, «empresas de servicios de inversión»: RWAdar no presta
    servicios de inversión, no recibe dinero ni intermedia (privacidad §1);
  - letra **d**, prestadores de la sociedad de la información «cuando
    elaboren a gran escala perfiles de los usuarios»: no hace perfiles;
  - letra **k**, publicidad y prospección comercial «cuando lleven a cabo
    tratamientos basados en las preferencias de los afectados o realicen
    actividades que impliquen la elaboración de perfiles»: los avisos (A5),
    cuando se enciendan, serán los mismos para todos los apuntados, sin
    segmentar por gustos ni por perfil.

Se puede nombrar uno voluntariamente (LOPDGDD, art. 34.2); entonces habría que
comunicarlo a la AEPD en diez días (art. 34.3). **Se revisa** si algún día hay
publicidad segmentada, perfiles, servicios de inversión o muchas más cuentas.
Fuentes: RGPD en EUR-Lex
(https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679) y
LOPDGDD en el BOE (https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673),
consultados el 07/11/2026.

---

## 2. Resumen

| # | Actividad | Estado hoy | Base jurídica principal |
|---|---|---|---|
| A1 | Cuentas de usuario | Activa | Servicio que se pide (6.1.b) |
| A2 | Lista de seguimiento y cartera de cada cuenta | Activa | Servicio que se pide (6.1.b) |
| A3 | Acceso a RWAdar Academy con cuenta | Activa en la app y, desde el 06/11/2026, en la web | Servicio que se pide (6.1.b) |
| A4 | Correo de bienvenida (y push de bienvenida) | Preparado, **no se envía** (pendiente) | Servicio que se pide (6.1.b) |
| A5 | Avisos de novedades por correo, push de la app y notificaciones de la web | Con la web y la OTA de la rama del 12/11 publicadas: **el permiso se recoge en Perfil** (web y app) y la web deja registrar la suscripción de su navegador. **No se envía nada** mientras `push_habilitado` y el correo sigan apagados (pendiente) | Consentimiento (6.1.a; LSSI, art. 21) |
| A6 | Prueba del permiso (historial de altas y bajas) | (pendiente) | Obligación legal (6.1.c) |
| A7 | Bajas de los avisos que llegan por correo | (pendiente) | Obligación legal (6.1.c) |
| A8 | Consultas de empresas («Para empresas») | Activa | Interés legítimo (6.1.f) |
| A9 | Solicitudes de derechos y consultas generales por correo | Activa | Obligación legal (6.1.c) |
| A10 | Seguridad y registros técnicos | Activa | Interés legítimo (6.1.f) |
| A11 | Actualizaciones de la app (Expo y GitHub) | Activa | verificar |
| A12 | Analítica web sin cookies | Activa | verificar (propuesta: 6.1.f) |
| A13 | Copias de seguridad | Activa | Interés legítimo (6.1.f) y seguridad (art. 32) |
| A14 | Datos de versiones anteriores en pausa | En pausa, sin datos nuevos | Varias (ver ficha) |

A9 y A14 no estaban en el encargo inicial: las añado porque la privacidad las
describe (§§ 4, 5, 9 y 11) y un registro sin ellas quedaría incompleto.

---

## 3. Proveedores que tratan datos por cuenta de RWAdar

Son encargados del tratamiento (RGPD, art. 28). Los países marcados
«verificar» no constan en las fuentes: los pongo por conocimiento general.

Los contratos de Supabase, Cloudflare, Google (Firebase), Expo, GitHub y
Lettermint se leyeron y archivaron en PDF el 06/11/2026; los de Netlify y
Proton Mail, el 07/11/2026. Citas, versiones y qué falta:
[`encargados/README.md`](encargados/README.md). Desde el 12/11/2026 Proton
Mail ya no es proveedor (ver debajo de la tabla).

| Proveedor | Para qué | Dónde | Garantías si hay transferencia | Contrato de encargo | Fichas |
|---|---|---|---|---|---|
| **Supabase** | Base de datos y autenticación | Proyecto en eu-west-1 (Irlanda, UE). Firma Supabase Pte. Ltd. (Singapur) | No está en el DPF (consulta del 06/11/2026). Su DPA incluye las SCC, módulo 2, para cualquier acceso desde fuera de la UE | DPA v1 del 01/08/2026, incorporado a sus condiciones (§7.b): no hay que firmar nada. Archivado ([encargados](encargados/README.md#supabase)) | A1-A7, A9, A10, A13, A14 |
| **Cloudflare** | Alojamiento (Pages), servidor web que gestiona la sesión, CDN, seguridad y Web Analytics | EE. UU., red mundial | Marco de Privacidad de Datos UE-EE. UU. (DPF), activo el 06/11/2026; si cae, SCC módulo 2 (DPA §6.2 y §6.4) | DPA v6.4 del 03/04/2026, incorporado por referencia en su acuerdo de autoservicio (§6.1): no hay que firmar nada. Archivado ([encargados](encargados/README.md#cloudflare)) | A1-A3, A10, A12 |
| **Netlify** | Página de limpieza de la app web antigua en rwadar.netlify.app (sigue haciendo falta mientras pueda quedar alguna instalada; ver [encargados](encargados/README.md#netlify)) | EE. UU. (Netlify, Inc., San Francisco) | DPF según su DPA (§14.2); si cae, SCC módulo 2 (§14.3). Su entrada en la lista oficial del DPF, **verificar** | DPA del 09/06/2026, incorporado a su acuerdo de autoservicio (§6.5), que cubre también el plan gratuito: no hay que firmar nada. Archivado ([encargados](encargados/README.md#netlify)) | A10 |
| **Google (Gmail)** | La cuenta de Gmail de RWAdar, rwadares@gmail.com. **Desde el 12/11/2026 es el buzón de RWAdar:** consultas, derechos, bajas por correo, empresas, reportes de seguridad y contactos profesionales de presentación. También es la dirección de respuesta de los avisos. Además envía, por SMTP de Supabase Auth, la confirmación y la recuperación de la contraseña | EE. UU. (verificar) | No documentadas para este uso. Google LLC figura «Active» en el DPF (consulta del 06/11/2026, ver Firebase) y sus SCC constan en las condiciones de Firebase, pero nada de eso está documentado para una cuenta de Gmail de consumo. **verificar** | **No hay. Hueco abierto:** es una cuenta de consumo, sin contrato de encargo del art. 28 RGPD (revisión legal 5.8; contraste 9: infracción grave, LOPDGDD art. 73.k). Desde el 12/11/2026 el hueco cubre también el buzón. Solución prevista: el dominio propio. Para Auth, el SMTP de Lettermint en el paso 5 (pendiente); para el buzón, una dirección del dominio propio con un proveedor que tenga contrato de encargo (**verificar** cuál) | A1, A7-A10 |
| **GitHub** | Página de descargas del APK (la app consulta si hay versión nueva). Guarda las copias de seguridad cifradas y ejecuta los flujos, que hacen las copias y los cambios de la base en sus máquinas. **Con la 32 (pendiente de aplicar):** ejecuta el remitente de las notificaciones de la web (flujo «Notificaciones web», `rwadar-app/enviar-webpush.mjs`), que en su máquina tiene en claro, mientras dura el envío, la dirección de entrega y las dos claves de cada navegador, el texto de cada aviso y la clave privada VAPID | EE. UU. (GitHub, Inc.) o Países Bajos (GitHub B.V.) | DPF, activo el 06/11/2026. No sustituye al contrato de encargo | **No hay. Hueco:** su DPA solo forma parte del «GitHub Customer Agreement»; en una cuenta personal gratuita GitHub actúa como responsable. Sus máquinas ven los datos en claro al hacer las copias, los cambios de la base y, con la 32, los envíos de la web. **Decidido el 06/11:** organización con GitHub Team y «GitHub Customer Agreement», que incluye el DPA. Falta que Víctor la contrate y la firme ([pasos](encargados/README.md#github--hueco)). **Recomendado:** firmarlo antes de encender el envío de la web para todos (`activar-push`) | A5, A11, A13 |
| **Expo** (650 Industries) | Actualizaciones de la app sin instalar versión nueva. Push (pendiente) | EE. UU. | SCC módulo 2 (sus términos, §3.2). En la lista oficial del DPF: «Active - Re-certification under Review» (06/11/2026); se citan primero las SCC | No hay DPA aparte (expo.dev/dpa da 404): el contrato es el §3.2 de sus términos del 02/11/2026. No hay que firmar nada. Archivado ([encargados](encargados/README.md#expo-650-industries)) | A4, A5, A11 |
| **Lettermint** (pendiente) | Correo de bienvenida y avisos (por su API) y, cuando haya dominio y la cuenta esté verificada, los correos de Supabase Auth (por SMTP) | Países Bajos, UE. Lettermint B.V., Willemsvaart 16 B, 8019 AB Zwolle. Los correos se alojan y tratan en la UE (DPA §8.1) | Ninguna prevista: sus subencargados con acceso a los correos (UpCloud, OVH Cloud, Postmastery) están en la UE. Fuera del EEE solo con autorización y garantías del capítulo V (DPA §8.4) | DPA del 09/10/2026, que se acepta al crear la cuenta (condiciones §4.7 y §15.3). Crear la cuenta, apuntar la fecha y pedir la verificación antes del paso 5.8 (pendiente). Archivado ([encargados](encargados/README.md#lettermint)) | A1, A4, A5 |
| **Google Firebase Cloud Messaging** (proyecto `rwadar-14e3d`; entrega pendiente de encender los avisos) | Entrega de notificaciones en Android, desde la app 1.4.2 (publicada el 06/11/2026). Hoy no recibe datos: la app no le pide nada hasta que la persona active las notificaciones. **«Latido»:** aun apagado, el componente guarda en el móvil las fechas en que se abrió la app (hasta 30). Al activar las notificaciones, Google las recibe con el «Firebase user agent» (componentes de Firebase y sus versiones; versión de Android, marca, modelo y tipo de dispositivo; tienda de instalación), que según Google usa para sus estadísticas internas, sin unirlo a un identificador ([guía de Google para Play](https://firebase.google.com/docs/android/play-data-disclosure), consultada el 07/11/2026). Ver A5 | EE. UU. y otros países donde Google tenga centros (sus condiciones, §10.1) | DPF de Google LLC, activo el 06/11/2026; si no está disponible, SCC (§10.2) | «Firebase Data Processing and Security Terms» (21/08/2024), **aceptadas en la consola el 06/11/2026** al crear el proyecto. Archivado ([encargados](encargados/README.md#google-firebase-cloud-messaging)) | A4, A5 |
| **Apple Push Notification service (app nativa)** | **No aplica:** no hay app de iPhone publicada ni cuenta de Apple Developer. Lo que sí hay desde la 32 son las notificaciones de la web en iPhone, que entrega el servicio de push de Apple para la web (`web.push.apple.com`): ver «Terceros que no son encargados», debajo ([encargados](encargados/README.md#apple-apns--app-nativa-no-aplica)) | No aplica | No aplica | No aplica. Si algún día hay app de iPhone con notificaciones, se lee su contrato y se añade aquí | Ninguna |

**Ya no es proveedor: Proton Mail (histórico).** Fue el buzón de RWAdar
(RWAdar@protonmail.com) hasta el 12/11/2026. Su contrato se comprobó y
archivó el 07/11/2026: DPA del 10/02/2026 dentro de sus condiciones, y Suiza,
con decisión de adecuación de la UE
([ficha histórica](encargados/README.md#proton-mail--histórico)). Desde el
12/11/2026 no trata datos de usuarios. Solo queda la cuenta personal del
titular con la que entra como moderador (`rwadar-app/db/11_fuga_cola.sql`),
que no es un tratamiento de datos de terceros. **verificar** qué se hace con
los correos de usuarios que llegaron a esa cuenta antes del 12/11/2026: si se
guardan allí, Proton los sigue guardando por cuenta de RWAdar.

**Terceros que no son encargados y reciben algo:**

- **OpenStreetMap:** solo si la persona pulsa «Cargar mapa» en Buscar: su
  navegador pide las imágenes y OpenStreetMap recibe su IP, el origen y la
  zona del mapa (privacidad §1). Trata esos datos como responsable propio.
- **Proveedor de correo de cada interlocutor:** interviene al enviar o recibir
  (privacidad §7).
- **Servicios de push de los navegadores** (desde la 32, solo para quien
  activa las notificaciones en la web): Apple (`web.push.apple.com`, Safari),
  Google (`fcm.googleapis.com`, Chrome y la mayoría de navegadores de Android),
  Mozilla (`updates.push.services.mozilla.com`, Firefox) y Microsoft
  (`*.notify.windows.com`, Edge). No los elige RWAdar sino el navegador de
  cada persona. Reciben la dirección de entrega de ese navegador, los datos
  técnicos de la conexión y cada notificación cifrada de extremo a extremo
  (RFC 8291), que no pueden leer; nunca el correo. **verificar** en el anexo
  legal: si son encargados de RWAdar o responsables propios, y la garantía de
  la transferencia a EE. UU. Google LLC figura «Active» en el DPF (consulta del
  06/11/2026); Apple, Mozilla y Microsoft, **verificar** en
  dataprivacyframework.gov antes de enviar a todos (la privacidad §8 lo
  promete). Ver A5.

**Quién no recibe datos:** las plataformas del radar, anunciantes ni
compradores de datos (privacidad §10). Eric Almiñana, autor de la Academy, no
recibe datos de usuarios (contraste 4).

---

## 4. Medidas de seguridad comunes

Valen para todas las fichas; cada ficha añade las suyas.

- **Conexión cifrada (HTTPS)** en la web, la app y las llamadas a proveedores.
- **Sesión:** cookie necesaria `__Host-rwadar-acceso`, con HttpOnly, Secure y
  SameSite; el JavaScript no puede leerla. En Android, desde la 1.4.0, el
  token de renovación se guarda cifrado en el almacenamiento seguro del
  sistema, sin la contraseña.
- **Sesión confirmada:** las funciones personales exigen una sesión vigente de
  una cuenta con el correo confirmado
  (`rwadar_cuentas_privadas.sesion_confirmada()`); los usuarios anónimos
  quedan fuera.
- **Cada persona solo ve lo suyo:** políticas de seguridad por fila (RLS) en
  Supabase; en la cartera, además, forzadas para el dueño de la tabla.
- **Esquemas privados** (`rwadar_cuentas_privadas`, `rwadar_novedades`) sin
  acceso para los clientes ni exposición por la API REST. Funciones con
  `security definer`, `search_path` vacío y solo el permiso justo.
- **Contraseñas:** las gestiona Supabase Auth como resumen criptográfico no
  reversible; mínimo 12 caracteres.
- **Servidor web:** no registra contraseñas, tokens ni datos de usuario. Límite
  de intentos por IP (o prefijo /64 en IPv6), solo en memoria y durante 10
  minutos: 30 intentos de contraseña, 10 envíos de correo y 20 bajas.
- **Sin seguimiento:** sin cookies de seguimiento, píxeles sociales, Google
  Analytics, Zaraz, perfilado ni decisiones automatizadas (privacidad §§2 y 10).
- **Minimización:** solo los datos de cada ficha; el desbloqueo con huella,
  cara o PIN lo comprueba el sistema operativo y RWAdar no recibe datos
  biométricos ni el código del móvil.
- **Copias cifradas** (A13).
- **Organizativas:**
  - Solo Víctor autoriza publicar, tocar la base en línea o compilar la app.
  - Los cambios de la base de avisos se hacen solo desde GitHub, con copia
    cifrada previa y la palabra de confirmación.
  - Los secretos van fuera de Git (Vault de Supabase y secretos de GitHub).
  - Hay un canal de reporte de vulnerabilidades (privacidad §13;
    `/.well-known/security.txt`, que caduca en agosto de 2027).
  - Hay un procedimiento escrito para las brechas de datos, con su registro
    interno ([`BRECHAS-DE-DATOS.md`](BRECHAS-DE-DATOS.md)).
- **Contraseñas filtradas: no disponible en el plan gratuito.** Supabase Auth
  puede rechazar contraseñas que aparecen en filtraciones (servicio Pwned
  Passwords de HaveIBeenPwned), pero «Leaked password protection is available
  on the Pro Plan and above» (https://supabase.com/docs/guides/auth/password-security,
  consultado el 07/11/2026). RWAdar está en el plan gratuito, así que no la
  tiene. Lo que sí hay: mínimo de 12 caracteres y límite de intentos.
- **verificar:** la doble autenticación en los paneles de Supabase,
  Cloudflare, GitHub, Expo y Netlify, y en la cuenta de Gmail del buzón
  (rwadares@gmail.com). La revisión de seguridad del
  28/10 no pudo certificarla. El CAPTCHA (Turnstile) no está activo
  (`TURNSTILE_SITEKEY` vacío en `rwadar-site/assets/acceso.js`).

---

## 5. Fichas

### A1 · Cuentas de usuario

- **Estado:** activa en la web y en la app Android, que exige una cuenta
  confirmada para entrar.
- **Responsable:** el del apartado 1.
- **Finalidad:**
  - crear y mantener la cuenta gratuita;
  - confirmar el correo;
  - entrar y mantener la sesión;
  - recuperar la contraseña;
  - saludar con el nombre, si se escribe;
  - que la persona borre su cuenta desde Perfil (contraseña actual y
    `BORRAR`).

  El correo no se usa para publicidad ni boletines (privacidad §3).
- **Base jurídica:**
  - correo, contraseña y sesión: ejecución del servicio que se pide
    (RGPD, art. 6.1.b);
  - nombre: consentimiento, al escribirlo (6.1.a);
  - los datos técnicos de acceso van en A10.
- **Interesados:** personas de 18 años o más que crean una cuenta. Incluye
  cuentas de versiones anteriores y altas sin confirmar.
- **Datos:**
  - correo;
  - contraseña, solo como resumen no reversible;
  - nombre opcional (hasta 60 caracteres);
  - fechas de alta, confirmación y último acceso;
  - sesión;
  - cuando se active la casilla de avisos, cuatro metadatos del alta
    (`avisos_novedades`, `avisos_version`, `avisos_canal` y `avisos_idioma`),
    ver A5.

  La casilla «Tengo 18 años o más…» es obligatoria para crear la cuenta.
  **No queda constancia guardada** (comprobado en el código el 07/11/2026): el
  servidor web rechaza el alta sin ella (`aceptaCondiciones`), pero no la
  manda a Supabase; los metadatos del alta solo llevan el nombre y, si se
  encienden, los de los avisos (`rwadar-acceso/servidor.mjs`,
  `/api/acceso/registrar`). **verificar** con un profesional si conviene
  guardarla.
- **Destinatarios:**
  - Supabase (Irlanda);
  - Cloudflare (EE. UU.), cuyo servidor web intermedia la sesión;
  - Google (Gmail), que entrega la confirmación y la recuperación y recibe el
    correo y el contenido del mensaje. En el paso 5 lo sustituye el SMTP de
    Lettermint (pendiente).

  Dentro de RWAdar accede el titular. No se comparte con las plataformas.
- **Transferencias internacionales:**
  - Cloudflare: DPF y SCC;
  - Supabase: datos en la UE, con SCC (módulo 2) para posibles accesos desde
    fuera;
  - Gmail: sin garantías documentadas (verificar);
  - Lettermint, cuando sustituya a Gmail: ninguna, trata los correos en la UE.
- **Plazo de supresión:**
  - mientras exista la cuenta;
  - al borrarla desde Perfil se eliminan en el momento la cuenta, el perfil,
    la lista de seguimiento y la cartera remota (privacidad §§9 y 11); con la
    30, también lo de avisos, salvo el historial del permiso (A6);
  - en las copias, hasta 35 días (A13);
  - una cuenta de menor de 18 años detectada se bloquea y se borra
    (privacidad §12);
  - **verificar:** no consta ningún plazo de borrado de las altas sin
    confirmar; hoy solo se borran si la persona lo pide.
- **Medidas** (además de las comunes):
  - los enlaces de confirmación y recuperación se canjean una sola vez y se
    quitan de la dirección;
  - la sesión web dura una hora;
  - el borrado exige la contraseña recién comprobada;
  - la analítica se omite en las visitas de esos enlaces.
- **Pendiente / verificar:**
  - el SMTP de Gmail no tiene contrato de encargo: pasarlo al SMTP de
    Lettermint en el paso 5 (pendiente; contraste 9; revisión legal 5.8);
  - **verificar el panel de control:** según `docs/INTERNO.md` y el traspaso
    del 22-23/10/2026, el panel `rwadar-panel` (un Worker de Cloudflare con
    almacenamiento KV, compartido con los socios por enlace personal desde el
    22/10/2026) permite listar, confirmar, bloquear y borrar cuentas, y guarda
    quién hizo cada acción. Su código está en la rama `claude/panel-control`,
    no en `main`, y el Worker sigue en línea (el 07/11/2026 responde 401 sin
    enlace personal). No consta en la privacidad. Confirmar qué datos de
    cuenta muestra, quién entra y cuánto guarda el registro de acciones, y
    añadirlo aquí y a la privacidad si procede.

### A2 · Lista de seguimiento y cartera de cada cuenta

- **Estado:** activa en la web y en las versiones de la app con cartera
  sincronizada.
- **Responsable:** el del apartado 1.
- **Finalidad:** guardar en la cuenta la lista de plataformas que la persona
  sigue y su registro manual de inversiones («Mis inversiones»), para verlos y
  cambiarlos desde la web y la app.
- **Base jurídica:** ejecución del servicio que se pide (6.1.b).
- **Interesados:** titulares de cuenta que usan estas funciones.
- **Datos:**
  - **plataformas que sigue:** qué plataforma y desde cuándo;
  - **cartera:** lo que la persona escriba (nombres de inversión y proveedor,
    moneda, cantidades, precios, comisiones, compras, ventas, cobros, gastos y
    valoraciones, con fechas), guardado como un documento con su versión y su
    fecha de actualización.

  No viene de los proveedores ni prueba una inversión real. Puede revelar su
  situación económica, aunque no es una categoría especial (art. 9). La
  privacidad pide no incluir documentos bancarios, contraseñas ni datos de
  otras personas.
- **Destinatarios:** Supabase (Irlanda) y Cloudflare (servidor web). No se
  comparte con las plataformas.
- **Transferencias internacionales:** como A1.
- **Plazo de supresión:**
  - mientras exista la cuenta o hasta que la persona borre la inversión;
  - al borrar la cuenta se elimina;
  - la lista de seguimiento entra en las copias (35 días); **la cartera no**
    (A13);
  - las copias locales del móvil no las controla RWAdar: se quitan con
    «Borrar datos del dispositivo».
- **Medidas:**
  - RLS forzado en `rwadar_cuentas_privadas.carteras`, con política de
    propietaria y sesión confirmada;
  - vista `mi_cartera` con los permisos de quien consulta;
  - validación del documento y número de versión para no pisar cambios;
  - la app no sube sola la copia local: hay que confirmar la importación.

### A3 · Acceso a RWAdar Academy con cuenta

- **Estado:**
  - en la app Android, toda la app ya exige una cuenta confirmada;
  - en la web, **activa desde el 06/11/2026** (publicada esa madrugada, hacia
    las 03:00-03:12 UTC). Comprobado otra vez el 07/11/2026 en
    https://rwadar.pages.dev: sin sesión, la lección 1 pedida como página
    responde 303 a `/acceso?volver=…`, y el índice `/academy/`, 200. El
    índice y el tutorial 3D siguen públicos.
- **Responsable:** el del apartado 1.
- **Finalidad:** abrir las lecciones gratuitas solo a cuentas confirmadas. Al
  abrir cada lección, el servidor comprueba la sesión.
- **Base jurídica:** ejecución del servicio que se pide (6.1.b). No depende de
  aceptar los avisos (RGPD, art. 7.4).
- **Interesados:** titulares de cuenta que abren lecciones, y visitantes sin
  sesión que lo intentan (se les manda a entrar).
- **Datos:**
  - la cookie de sesión, que se comprueba con Supabase;
  - la IP y los datos técnicos de la petición.

  **No se guarda qué lecciones lee cada persona.** El progreso (lecciones
  leídas, aciertos en los tests) y la lección a la que volver tras registrarse
  (24 horas) se quedan en el navegador o el móvil. Las páginas de lecciones
  cargan la analítica agregada de A12, sin relación con la cuenta.
- **Destinatarios:** Cloudflare (servidor web) y Supabase (comprobación de la
  sesión).
- **Transferencias internacionales:** como A1.
- **Plazo de supresión:** RWAdar no crea un registro propio. La sesión deja de
  valer al caducar (una hora) o al cerrarla. Los registros técnicos de los
  proveedores van en A10.
- **Medidas:**
  - la decisión se toma en el servidor, con la ruta normalizada y una lista
    cerrada de lecciones;
  - con sesión, las lecciones salen con `Cache-Control: private, no-store`,
    `noindex` y `Vary: Cookie`;
  - si Supabase falla, la respuesta es 503: nunca se manda a entrar por un
    fallo pasajero;
  - nunca se pone material privado en la Academy.
- **verificar:** la revisión legal (contraste 17) señala que dar un contenido
  digital a cambio de datos personales puede entrar en la normativa de consumo
  (TRLGDCU, art. 59.4). Consultarlo con un profesional.

### A4 · Correo de bienvenida (y push de bienvenida)

- **Estado:** preparado, **no se envía**:
  - la 30 y la 31 están aplicadas (06/11/2026), pero `correo_habilitado` y
    `push_habilitado` siguen apagados;
  - correo (pendiente): dominio propio, cuenta de Lettermint verificada, el
    token en el Vault y la prueba real (contrato de avisos, paso 5);
  - push (pendiente): Firebase y la app 1.4.2 ya están (06/11/2026); faltan
    la privacidad del push, una OTA con el interruptor encendido y la prueba
    en un Android físico.
- **Responsable:** el del apartado 1.
- **Finalidad:**
  - **correo:** a quien confirma su cuenta, decirle que ya tiene la Academy
    gratis, con enlace a `/academy/`; si se apuntó a los avisos, confirmárselo
    y darle su enlace de baja;
  - **push:** una sola vez por cuenta, al registrar el primer móvil,
    confirmar que las notificaciones quedan activadas.
- **Base jurídica:** ejecución del servicio (6.1.b). Es un correo de servicio
  y tiene que seguir sin promoción: sin ofertas, enlaces a plataformas ni
  invitaciones a apuntarse (contrato de avisos §2; contraste 14).
- **Interesados:** cuentas que confirmen su correo después de encender el
  correo. Las cuentas que ya existen no la reciben.
- **Datos:**
  - **correo:** se lee de la cuenta justo antes de enviar y no se copia en la
    cola. No se envía el nombre;
  - **identificador de la cuenta;**
  - **marcas en `preferencias`:** cuándo se encoló cada bienvenida
    (`bienvenida_correo_el`, `bienvenida_push_el`);
  - **fila de la cola:** estado, intentos, clave de idempotencia,
    identificador de la petición y del mensaje del proveedor, error y fechas;
  - **en el push:** el identificador de notificaciones del móvil, que se borra
    de la cola al terminar.
- **Destinatarios:**
  - Supabase;
  - Lettermint (pendiente), que recibe el correo y el contenido y los guarda
    28 días en la UE;
  - Expo y FCM de Google (pendiente), que reciben el identificador del móvil
    y el contenido, nunca el correo. Apple (APNs) no aplica: no hay app de
    iPhone. Las notificaciones de la web (A5) no llevan la bienvenida.
- **Transferencias internacionales:**
  - Lettermint: ninguna, trata los correos en la UE;
  - Expo y Google: las del apartado 3.
- **Plazo de supresión:**
  - fila de la cola: 90 días después de terminar;
  - marca en `preferencias`: mientras exista la cuenta, para no repetir la
    bienvenida;
  - al borrar la cuenta se borra todo (`on delete cascade`).
- **Medidas:**
  - todo nace apagado;
  - el contenido es cerrado y el HTML va escapado;
  - clave de idempotencia y segunda comprobación justo antes de enviar;
  - `List-Unsubscribe` solo si la persona se apuntó;
  - claves del proveedor en el Vault;
  - sin píxel ni seguimiento de clics: Lettermint no los pone si no se pide,
    y cada petición los desactiva (`track_opens` y `track_clicks` a `false`).
    Se comprueba en el original del mensaje en la prueba real del paso 5;
  - el pie lleva la dirección postal del responsable, que pide la política de
    uso de Lettermint.
- **Pendiente:**
  - ✅ los textos de la bienvenida (revisión legal 4.8 y 4.9, aplicados el
    06/11/2026);
  - la privacidad §6 aún dice que solo se envían la confirmación y la
    recuperación: actualizarla antes del paso 5 (revisión legal 4.12).

### A5 · Avisos de novedades (correo y push)

- **Estado** (12/11/2026, versión 5): **todavía no se envían.** Con la
  rama del 12/11 (web y OTA de la app) publicada:
  - **el permiso se recoge en Perfil › Avisos**, en la web y en la app
    (`AVISOS_NOVEDADES_REMOTOS = true`), con el texto versionado
    `novedades-v2-2026-11-06`;
  - **la casilla del alta sigue apagada** (`AVISOS_CASILLA_ALTA = false` en la
    web; en la base, `casilla_activa = false`);
  - **la web deja registrar la suscripción de su navegador** (Web Push, la
    32) aunque el envío esté apagado: registrarse no envía nada. Solo sale la
    notificación de prueba, a las cuentas de administración y a mano;
  - **la app** no registra el móvil en Expo mientras `push_habilitado` esté
    apagado (su botón dice que aún no está disponible);
  - la 30 y la 31 están aplicadas (06/11/2026), con todo apagado; la 32,
    pendiente de aplicar (`aplicar-32` y `crear-vapid`, con orden de Víctor).

  Faltan, cada uno con permiso de Víctor:
  - correo (pendiente): dominio propio, cuenta de Lettermint (con ella se
    acepta su contrato de encargo) y su verificación, el token en el Vault y
    la prueba real;
  - push (pendiente): Firebase y la app 1.4.2 ya están (06/11/2026); faltan
    la valoración legal del «latido» (abajo), la prueba en un Android físico y
    encender `push_habilitado` (`activar-push`), que **enciende a la vez** el
    push de la app y las notificaciones de la web;
  - notificaciones de la web (pendiente): aplicar la 32, crear la clave VAPID
    y probarlas en el iPhone del titular con la acción «prueba» antes de
    `activar-push`.
- **Responsable:** el del apartado 1.
- **Finalidad:** avisar a quien lo pida, por correo y, si lo activa en su
  móvil (app o web), por notificación:
  - **fichas nuevas en el radar:** como mucho un aviso al día, sin nombrar
    productos ni emisores y con aviso de riesgo;
  - **novedades de la web y la app.**

  Incluye la tarjeta «Avisos» de la app, que muestra los avisos publicados y
  no es un envío. Se trata como comunicación comercial por prudencia
  (revisión legal §2).
- **Base jurídica:** consentimiento (RGPD, art. 6.1.a; LSSI, art. 21):
  - casilla aparte y sin marcar al crear la cuenta, o interruptor en Perfil;
  - doble confirmación;
  - se retira cuando se quiera, sin afectar a lo anterior.
- **Interesados:** titulares de cuenta confirmada que activan los avisos.
- **Datos:**
  - **`preferencias`, una fila por cuenta:**
    - si hay permiso;
    - fecha del permiso;
    - versión del texto aceptado (`novedades-v2-2026-11-06`, la que pidió la
      revisión legal; igual en la base, la web y la app);
    - origen (alta o Perfil);
    - canal (web o app);
    - fecha de alta;
    - código aleatorio para el enlace de baja;
    - fecha de baja y de actualización;
  - **metadatos del alta** en Supabase Auth (A1);
  - **`dispositivos`:** identificador de notificaciones de Expo, plataforma y
    fechas; hasta cinco móviles por cuenta y solo si se activan las
    notificaciones;
  - **`suscripciones_web`** (la 32): por cada navegador que activa las
    notificaciones de la web, la dirección de entrega (`endpoint`, solo de
    los servicios de push de Apple, Google, Mozilla y Microsoft), sus dos
    claves públicas de cifrado (`p256dh` y `auth`), la cuenta y las fechas de
    alta y de renovación; hasta cinco por cuenta;
  - **`envios_web`** (la 32): un registro por anuncio y navegador (estado,
    código HTTP de la respuesta, intentos y fechas), sin datos personales
    aparte de la relación con la suscripción;
  - **colas de correo y push:** como en A4, una fila por cuenta y aviso;
  - **en el dispositivo, no en RWAdar:** qué avisos se han leído (en la web,
    `localStorage`, por cuenta) y el número del icono (en la web, IndexedDB
    del service worker);
  - **la tabla `anuncios`:** guarda el texto de cada aviso, sin datos
    personales.
- **Destinatarios:**
  - Supabase;
  - Lettermint (pendiente): correo y contenido. Los anuncios van por su ruta
    de difusión, que guarda además su propia lista de bajas;
  - Expo y FCM (pendiente): identificador del móvil y contenido, nunca el
    correo. El push solo lleva `{tipo, destino}`. Apple (APNs) no aplica: no
    hay app de iPhone.
  - **Servicios de push de los navegadores** (pendiente; la 32): Apple,
    Google, Mozilla o Microsoft, según el navegador. Reciben la dirección de
    entrega y cada notificación cifrada (no pueden leer su texto), nunca el
    correo (apartado 3, «Terceros que no son encargados»).
  - **GitHub** (pendiente; la 32): su máquina ejecuta el remitente y ve en
    claro, mientras dura cada envío, las direcciones de entrega, sus claves y
    el texto de cada aviso. Sin contrato de encargo (apartado 3).
  - **Google, el «latido» de Firebase** (desde la app 1.4.2): el componente
    guarda en el móvil, aunque todo esté apagado, las fechas en que se abrió
    la app (hasta 30). Al activar las notificaciones, Google las recibe junto
    con los componentes de Firebase de la app y sus versiones, la versión de
    Android, la marca, el modelo, el tipo de dispositivo y la tienda de
    instalación. Según Google, para sus estadísticas internas de uso de esos
    componentes, sin unirlo a un identificador; no sirve para entregar los
    avisos. Esas fechas solo se borran desinstalando la app o borrando sus
    datos desde Android (el botón de RWAdar no las borra). **Pendiente antes
    de encender el push:** que la revisión legal valore si guardar esas
    fechas en el móvil sin pedir permiso cabe en la LSSI, art. 22.2 (y la
    Directiva ePrivacy, art. 5.3), porque no es estrictamente necesario para
    lo que pide la persona.
- **Transferencias internacionales:** como A4 y, con la 32: GitHub (DPF,
  apartado 3) y los servicios de push de los navegadores (EE. UU.; Google LLC
  en el DPF; Apple, Mozilla y Microsoft, **verificar** antes de enviar a
  todos).
- **Plazo de supresión:**
  - el permiso y la fila de preferencias, mientras exista la cuenta;
  - las colas y los envíos de la web, 90 días;
  - los móviles que no se renuevan en 180 días se borran, y las suscripciones
    de la web, igual (la web las renueva cada vez que se entra con la cuenta
    en ese navegador, como mucho cada 12 horas);
  - la suscripción de la web se borra también al desactivarla, al cerrar
    sesión, cuando el servicio de push responde 404 o 410 y al pasar de cinco
    por cuenta (la más antigua);
  - un reloj diario de limpieza (`rwadar-novedades-limpieza`, 04:41 UTC) lo
    hace aunque todo siga apagado (con la 32, `limpiar()` llama también a
    `webpush_limpiar()`);
  - al borrar la cuenta se borra todo lo anterior, salvo el historial del
    permiso (A6);
  - copias, 35 días.
- **Medidas** (además de las comunes):
  - **el permiso solo cuenta si:**
    - se confirma el correo;
    - la casilla está encendida en la base;
    - el correo de confirmación salió después de encenderla;
  - **la baja:**
    - no se deshace;
    - corta a la vez el correo y el push;
    - va en cada correo: enlace `/baja` sin entrar en la cuenta, `mailto:` y
      `List-Unsubscribe`;
    - su página exige el mismo origen, un UUID y un límite por IP;
  - **antes de enviar:** se vuelve a comprobar el permiso y la versión;
  - **errores:** los disparadores nunca tumban un alta ni una confirmación y
    no vuelcan el mensaje del error, que podría llevar el correo;
  - **anuncios de fichas nuevas:**
    - plantilla cerrada y filtro de palabras;
    - nacen retenidos;
    - el aviso automático solo lo enciende Víctor;
  - **tokens del móvil:** el token se borra de la cola al terminar, y
    `DeviceNotRegistered` borra el móvil;
  - **notificaciones de la web:** solo a los cuatro servicios de push
    conocidos (regla en la tabla, en la API y en el remitente); cifradas con
    RFC 8291 y firmadas con VAPID (RFC 8292); la clave privada solo en Vault y
    enmascarada en el flujo; cada una lleva a la lista de avisos de la
    campana, que indica cómo darse de baja (`?avisos=1`; LSSI, art. 21.2,
    párr. 2); el verificador 32 lo exige;
  - **sin píxel de apertura ni seguimiento de clics:** Lettermint no los pone
    si no se pide y cada petición los desactiva. Falta comprobarlo en un
    correo real (ver «Pendiente»).
- **Pendiente:**
  - **texto e información:** ✅ casilla v2 (revisión legal 4.1), información
    básica junto a las casillas y en Perfil (4.2) y privacidad de lo que es
    cierto hoy (4.6), aplicados el 06/11/2026. Quedan las frases de la
    privacidad que cambian al encender cada canal (4.12 y 4.14);
  - **proveedor de correo:** Brevo quedó descartado porque solo anonimiza la
    apertura y no quita el píxel (contraste 1). Se elige Lettermint. Antes de
    encender, la prueba real del paso 5: sin píxel en el original del mensaje,
    `List-Unsubscribe` y el nombre de la ruta de difusión;
  - **bajas en Lettermint:** su ruta de difusión añade su propio enlace de
    baja, y en el plan gratis probablemente no se puede quitar («Hosted
    unsubscribe pages (can be disabled on higher plans)»,
    https://docs.lettermint.co/platform/projects-and-routes/routes,
    07/11/2026). Cada baja que guarde se aplica también en RWAdar (A7): a
    mano o con la sincronización automática (flujo «Correo Lettermint»,
    `sincronizar-bajas`, preparada el 07/11/2026 y apagada);
  - ✅ **baja en cada push** (contraste 2): canales de Android `cuenta` y
    `novedades` y enlace a Perfil en el destino del push (06/11/2026). En la
    web (12/11/2026), cada notificación abre la lista de avisos con la frase
    «¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del
    móvil.» y el botón a Perfil › Avisos;
  - **antes de `activar-push`** (enciende a la vez la app y la web), un anexo
    legal con fecha que: decida lo del «latido» de Firebase (arriba); cubra
    las notificaciones de la web (servicios de push como destinatarios nuevos,
    si son encargados o responsables propios, y sus transferencias, con su
    adhesión al DPF comprobada); y revise la «Información básica» de Perfil,
    que hoy nombra a Lettermint y Expo pero no a esos servicios ni a GitHub.
    Recomendado también: el contrato de GitHub (GitHub Team) firmado;
  - ✅ **Firebase:** no arranca solo al abrir la app (contraste 3). La 1.4.2
    lleva el autoarranque apagado; en el emulador, al abrirla no hubo ninguna
    conexión a Firebase (06/11/2026). Falta repetirlo en un Android físico
    antes de encender el push.

### A6 · Prueba del permiso (historial de altas y bajas)

- **Estado:** la tabla existe desde el 06/11/2026 (la 30, aplicada), pero
  está vacía mientras no se recojan permisos (pendiente).
  - **Dónde está el diseño:** la revisión legal (§§ 4.5 y 5.1) y su contraste
    (puntos 7 y 11). El RUNBOOK da por hecho que la baja por correo «deja la
    baja en el historial».
  - ✅ **Contrastada con el SQL el 07/11/2026**
    (`rwadar-app/db/30_avisos_registrados.sql`, tabla
    `rwadar_novedades.historial_permiso`, disparadores `al_borrar_cuenta` e
    `historial_solo_anadir` y función `limpiar()`). Coinciden los datos, el
    bloqueo y los 3 años. Se corrigió una frase: la limpieza diaria **sí** lo
    toca, pero solo para marcar y, a los 3 años, borrar (ver «Plazo de
    supresión»).
- **Responsable:** el del apartado 1.
- **Finalidad:** poder demostrar:
  - que había permiso en la fecha de cada envío y cuándo se retiró (RGPD,
    arts. 5.2 y 7.1);
  - ante una reclamación o un requerimiento de la AEPD.
- **Base jurídica:**
  - **mientras exista la cuenta:** cumplimiento de una obligación legal
    (6.1.c, en relación con los arts. 5.2 y 7.1 RGPD);
  - **tras borrar la cuenta:** bloqueo obligatorio (LOPDGDD, art. 32) y
    defensa de reclamaciones (RGPD, art. 17.3.e).

  **verificar** con un profesional.
- **Interesados:** cuentas que dan o retiran el permiso (también las ya
  borradas) y personas que piden la baja por correo.
- **Datos:** una fila por cada alta o baja del permiso, que solo se añade y
  nunca se modifica:
  - identificador de cuenta;
  - acción (alta o baja);
  - versión del texto;
  - idioma mostrado (es o en; contraste 11);
  - origen (alta, Perfil, enlace o correo);
  - canal (web o app);
  - fecha;
  - fecha de borrado de la cuenta, cuando se borra (`cuenta_borrada_el`).

  Para poder identificar a la persona después de borrar su cuenta, se guarda
  también su correo (revisión legal 5.1).
- **Destinatarios:**
  - **mientras exista la cuenta:** Supabase;
  - **una vez bloqueado:** solo jueces y tribunales, el Ministerio Fiscal y
    las autoridades competentes, en particular la AEPD (LOPDGDD, art. 32.2).
- **Transferencias internacionales:** ninguna prevista (Supabase, Irlanda).
- **Plazo de supresión:**
  - mientras exista la cuenta;
  - al borrarla, el historial **no se borra en cascada** (la tabla no tiene
    clave ajena a las cuentas): un disparador le pone la fecha de borrado,
    queda bloqueado y se borra a los **3 años**, el plazo de prescripción de
    las infracciones muy graves (LOPDGDD, art. 72.1);
  - la limpieza diaria (`limpiar()`, 04:41 UTC) marca las filas de cuentas
    que ya no existen, si el disparador falló, y borra las de cuentas
    borradas hace más de 3 años. Nunca toca las de una cuenta viva.
- **Medidas:**
  - mismo esquema privado y mismos `revoke` que A5, con RLS activada;
  - solo se añaden filas: el disparador `historial_solo_anadir` impide
    cambiar nada salvo poner una vez la fecha de borrado, y borrar antes de
    los 3 años;
  - regla `check (accion = 'baja' or version is not null)`;
  - ningún otro uso: ni envíos, ni perfiles, ni estadísticas.
- ✅ **Privacidad:** ya dice que el historial queda bloqueado 3 años al borrar
  la cuenta (contraste 7; revisión legal 4.6; privacidad del 06/11/2026,
  apartados de avisos, plazos y borrado de la cuenta).

### A7 · Bajas de los avisos que llegan por correo

- **Estado:** (pendiente). El procedimiento está escrito en el RUNBOOK desde
  el 06/11/2026 y se aplica desde que salga el primer aviso.
  La función `rwadar_novedades.baja_por_correo(email)` que cita el RUNBOOK ya
  está en la 30, aplicada el 06/11/2026. ✅ **Contrastada con el SQL el
  07/11/2026:** busca todas las cuentas con ese correo (sin distinguir
  mayúsculas ni espacios), pone `novedades = false` y la fecha de baja, añade
  una fila `baja`/`correo` al historial y devuelve si encontró alguna. Como
  los push de novedades dependen del mismo permiso, también los corta. Solo la
  puede ejecutar el propietario de la base.
- **Responsable:** el del apartado 1.
- **Finalidad:** atender, antes del siguiente envío, la baja de quien la pide
  escribiendo a rwadares@gmail.com, que es también la dirección de
  respuesta de los avisos.
- **Base jurídica:** obligación legal (6.1.c): LSSI, art. 22.1 (basta con
  comunicar la voluntad al remitente), y RGPD, art. 7.3 (retirar el
  consentimiento).
- **Interesados:** personas que piden la baja por correo, tengan o no cuenta.
- **Datos:**
  - **en el buzón:** el correo de quien escribe, su mensaje y los metadatos;
  - **en la base:** el permiso pasa a «no», con la fecha de baja y una fila
    `baja`/`correo` en el historial (A6);
  - **la respuesta:** «Hecho: ya no recibirás avisos de RWAdar» y la fecha
    anotada.
- **Destinatarios:** Google (Gmail, el buzón) y Supabase (Irlanda).
- **Transferencias internacionales:** Gmail: EE. UU. (verificar), sin
  garantías documentadas para este uso (**verificar**, apartado 3).
- **Plazo de supresión:**
  - la baja en la base, como A5 y A6;
  - el correo en el buzón: no consta. **verificar** (propuesta: el mismo que
    el historial del permiso, para poder probar la baja);
  - **verificar** dónde se anota la fecha de la respuesta.
- **Medidas:**
  - mientras salgan avisos, el buzón se revisa antes de cada envío, y a diario
    si el aviso automático de fichas nuevas está encendido. Si nadie puede
    revisarlo a diario, ese aviso se queda apagado;
  - la función la ejecuta solo el propietario de la base, desde el SQL Editor;
  - valen los asuntos «baja» y «Baja de los avisos de RWAdar»;
  - mientras la ruta de difusión de Lettermint lleve su propio enlace de baja
    (pendiente; en el plan gratis probablemente no se puede quitar), antes de
    cada anuncio (y cada día si el aviso automático de fichas nuevas está
    encendido) se revisa su lista de bajas y cada una se aplica igual, con
    `baja_por_correo`, que corta también los push de novedades. Lo hará
    sola la acción `sincronizar-bajas` del flujo «Correo Lettermint»
    (preparada el 07/11/2026, apagada): no toca a quien ya estaba de baja ni
    a quien se volvió a apuntar después, y solo enseña recuentos.

### A8 · Consultas de empresas («Para empresas»)

- **Estado:** activa. Es solo un canal de expresión de interés: sin precios,
  contratación, facturación ni publicación (privacidad §7).
- **Responsable:** el del apartado 1.
- **Finalidad:**
  - leer y responder la consulta, y decidir si tiene sentido una conversación
    exploratoria;
  - los contactos profesionales de presentación que inicia el titular.

  No se crean perfiles, no se atribuyen inversiones, no se generan contactos
  para terceros y no se usa para publicidad.
- **Base jurídica:**
  - **consultas que inicia la persona:** interés legítimo en atenderlas
    (6.1.f); puede oponerse;
  - **contactos que inicia el titular:** no consta. **verificar** (propuesta:
    6.1.f, con la presunción de la LOPDGDD, art. 19, para datos de contacto
    profesionales).
- **Interesados:** profesionales de empresas y plataformas que escriben, y
  aquellos a quienes el titular escribe.
- **Datos:**
  - la dirección desde la que escriben;
  - nombre y función, si los dan;
  - organización y enlace oficial;
  - una explicación breve y los metadatos del correo.

  Lo que sobre se elimina sin usarlo.
- **Destinatarios:**
  - Google (Gmail): el buzón rwadares@gmail.com, que recibe las consultas y
    se usa también para los contactos de presentación y sus respuestas;
  - el proveedor de cada interlocutor.

  Accede el titular y, cuando proceda, quien tramite la consulta bajo su
  responsabilidad (**verificar** quién). No entra en Supabase, Lettermint ni en
  un CRM.
- **Transferencias internacionales:** Gmail: EE. UU. (verificar), sin
  garantías documentadas para este uso (**verificar**, apartado 3).
- **Plazo de supresión:** mientras se responde y, si no se abre una fase
  posterior aprobada, como máximo seis meses desde el último intercambio.
  Después se elimina, salvo lo mínimo que exija una obligación o una
  reclamación.
- **Medidas:** se avisa de no enviar datos de inversores, documentos de
  identidad, datos bancarios, monederos, contraseñas, historiales de
  inversión, categorías especiales ni un dossier confidencial.

### A9 · Solicitudes de derechos y consultas generales por correo

- **Estado:** activa.
- **Responsable:** el del apartado 1.
- **Finalidad:** atender las solicitudes de derechos, también sobre datos de
  versiones anteriores:
  - acceso, rectificación y supresión;
  - limitación, oposición y portabilidad;
  - retirada del consentimiento.

  También atiende las correcciones del radar y las consultas generales.
- **Base jurídica:**
  - derechos: obligación legal (6.1.c; RGPD, arts. 12 a 22);
  - correcciones y consultas: interés legítimo (6.1.f).
- **Interesados:** quien escribe, tenga o no cuenta.
- **Datos:**
  - el correo y el contenido del mensaje;
  - el correo de la cuenta, si existió;
  - lo justo para comprobar la identidad de forma proporcionada;
  - la respuesta.
- **Destinatarios:** Google (Gmail, el buzón), y Supabase para ejecutar lo
  que se pida.
- **Transferencias internacionales:** Gmail: EE. UU. (verificar), sin
  garantías documentadas para este uso (**verificar**, apartado 3).
- **Plazo de supresión:** no consta en las fuentes. **verificar** (propuesta:
  la solicitud y la respuesta, el tiempo necesario para probar que se atendió,
  hasta 3 años). Plazo para responder: un mes, ampliable dos más
  (RGPD, art. 12.3).
- **Medidas:**
  - no hace falta cuenta para pedir;
  - no se piden contraseñas ni tokens;
  - verificación proporcionada.

### A10 · Seguridad y registros técnicos

- **Estado:** activa.
- **Responsable:** el del apartado 1.
- **Finalidad:**
  - entregar y proteger la web y la app;
  - evitar abusos y proteger las cuentas;
  - diagnosticar fallos;
  - recibir y gestionar los reportes de vulnerabilidades.
- **Base jurídica:** interés legítimo en la seguridad del servicio (6.1.f),
  ligado a la obligación de seguridad (RGPD, art. 32).
- **Interesados:** visitantes de la web, usuarios de la app, titulares de
  cuenta y personas que reportan vulnerabilidades.
- **Datos:**
  - **visitas:** IP, navegador, hora, enrutamiento y otros datos técnicos de
    la conexión. Los recibe Cloudflare, Netlify (si se abre la dirección
    antigua) y Supabase (al consultar el catálogo);
  - **en Supabase:** fecha de alta y de último acceso, e IP y navegador al
    darse de alta o entrar (privacidad §3);
  - **contador de intentos** por IP en la memoria del servidor;
  - **reportes de vulnerabilidades:** lo que envíe la persona.
- **Destinatarios:**
  - Cloudflare, Netlify y Supabase;
  - Google (Gmail, el buzón), para los reportes.

  **verificar:** según `SECURITY.md`, los reportes los gestionan Eric
  Almiñana, Samuel Rodriguez y Víctor Jorques (ver apartado 1).
- **Transferencias internacionales:** Cloudflare con DPF y SCC; Supabase con
  SCC; Netlify con DPF según su DPA (§14.2) y, si cae, SCC módulo 2 (§14.3);
  su entrada en la lista oficial del DPF, **verificar**. Gmail (los
  reportes): sin garantías documentadas para este uso (**verificar**,
  apartado 3).
- **Plazo de supresión:**
  - **contador en memoria:** 10 minutos;
  - **registros de cada proveedor:** sus plazos de seguridad y diagnóstico.
    **verificar y anotar aquí el de cada uno**: la privacidad (§9) dice que
    se documentan en este registro. Lettermint (pendiente): registros
    técnicos, normalmente 14 días como máximo; datos de cada mensaje, 28 días
    ([encargados](encargados/README.md#lettermint));
  - **registros de acceso en la propia base de Supabase:** **verificar** si
    caducan. Entran en las copias, 35 días;
  - **reportes de vulnerabilidades:** no consta. **verificar.**
- **Medidas:** las comunes. Además, la política de reporte pide la evidencia
  mínima, sin datos de terceros ni credenciales (privacidad §13).

### A11 · Actualizaciones de la app (Expo y GitHub)

- **Estado:** activa. Las actualizaciones sin instalar versión nueva llegan
  desde Android 1.4.1; la consulta de versión nueva se hace en GitHub.
- **Responsable:** el del apartado 1.
- **Finalidad:**
  - entregar a la app los cambios que no necesitan instalar una versión
    nueva;
  - avisar de que hay un APK nuevo.
- **Base jurídica:** no consta en la privacidad. **verificar** (propuesta:
  ejecución del servicio, 6.1.b, o interés legítimo en mantener la app segura
  y al día, 6.1.f).
- **Interesados:** personas que usan la app Android.
- **Datos:**
  - **Expo**, al abrir la app: IP, plataforma, versión instalada y un
    identificador aleatorio de esa instalación. Nunca la cuenta ni sus datos;
  - **GitHub**, al consultar si hay versión nueva: IP y datos técnicos de la
    conexión. El APK solo se descarga al pulsar «Actualizar».
- **Destinatarios:** Expo (EE. UU.) y GitHub (EE. UU.).
- **Transferencias internacionales:**
  - Expo: SCC módulo 2 (sus términos, §3.2). En la lista oficial del DPF,
    «Active - Re-certification under Review» el 06/11/2026;
  - GitHub: DPF, activo el 06/11/2026. **Sin contrato de encargo** (hueco,
    ver apartado 3 y [encargados](encargados/README.md#github--hueco)). Esta
    consulta solo lleva la IP y datos técnicos, que GitHub trata como
    responsable propio.
- **Plazo de supresión:** el de cada proveedor. **verificar.**
- **Medidas:**
  - sin datos de cuenta;
  - cada envío de una actualización necesita el permiso de Víctor;
  - el envío comprueba que la actualización es compatible con la versión
    instalada.

### A12 · Analítica web sin cookies

- **Estado:** activa solo en rwadar.pages.dev, con Cloudflare Web Analytics.
  Hoy la cargan, al menos, la portada, la Academy (también las lecciones) y la
  privacidad.
- **Responsable:** el del apartado 1.
- **Finalidad:** entender el uso de la web y mejorarla: visitas, páginas
  vistas, procedencia, tipo de dispositivo y rendimiento.
- **Base jurídica:** la privacidad no la indica. **verificar** (propuesta:
  interés legítimo, 6.1.f). Según Cloudflare, no usa cookies, almacenamiento
  local ni huellas del dispositivo, por lo que no necesita el consentimiento
  de la LSSI (art. 22.2). Comprobarlo si Cloudflare cambia el servicio.
- **Interesados:** visitantes de la web.
- **Datos:**
  - página, procedencia, tipo de dispositivo y navegador, y medidas de
    rendimiento;
  - la IP solo para atender la conexión: Cloudflare la descarta en su centro
    de datos más cercano.

  Sin identificadores de cuenta, correos, inversiones ni eventos de compra.
- **Destinatarios:** Cloudflare (EE. UU.). El panel de control apunta cada día
  las cifras totales de visitas, no personas.
- **Transferencias internacionales:** DPF y SCC.
- **Plazo de supresión:** no consta cuánto guarda Cloudflare estos datos.
  **verificar.**
- **Medidas:** no se mide en estos casos:
  - en desarrollo y sin conexión;
  - en direcciones con parámetros o fragmentos;
  - en las visitas de los enlaces de confirmación y recuperación;
  - con Do Not Track o Global Privacy Control.

### A13 · Copias de seguridad

- **Estado:** activa desde el 02/10/2026. La primera copia guardó 52 tablas y
  se comprobó que se descifra.
- **Responsable:** el del apartado 1.
- **Finalidad:** poder recuperar las cuentas, el catálogo y los avisos si la
  base se estropea, porque Supabase gratuito no guarda copias descargables.
  Hay una copia cada noche (02:43 UTC) y otra antes de cada «Aplicar catálogo»
  y de cada cambio con el flujo «Avisos a registrados (base)».
- **Base jurídica:** interés legítimo en la continuidad del servicio (6.1.f) y
  la obligación de poder restaurar los datos tras un incidente (RGPD,
  art. 32.1.c).
- **Interesados:** todos los titulares de cuenta y, cuando exista, quienes
  tengan datos de avisos.
- **Datos:**
  - **se copia:**
    - `auth`: las cuentas;
    - `public`: perfiles, lista de seguimiento y datos de versiones
      anteriores;
    - `rwadar_catalogo`: el catálogo, sin datos de usuarios;
    - `rwadar_novedades`, cuando exista: permisos, bajas, móviles, anuncios y
      colas;
  - **no se copia:** la cartera (`rwadar_cuentas_privadas`) ni los secretos
    del Vault.
- **Destinatarios:** GitHub, que guarda el archivo cifrado como artefacto de
  Actions en el repositorio privado. **verificar:** la privacidad no cita a
  GitHub como depósito de copias; añadirlo.
- **Transferencias internacionales:** GitHub (EE. UU.) guarda el archivo
  cifrado. Está en el DPF (activo el 06/11/2026). **Hueco:** no hay contrato
  de encargo; la copia se hace en una máquina de GitHub, donde está en claro
  unos minutos antes de cifrarse, y la clave (`COPIA_CLAVE`) también es un
  secreto de GitHub, así que GitHub guarda a la vez la copia y su llave
  (corregido el 07/11/2026: antes decía que GitHub no tenía la clave; ver
  apartado 3 y [encargados](encargados/README.md#github--hueco)).
- **Plazo de supresión:** **35 días** (`retention-days: 35`), también para las
  copias previas al catálogo y a los avisos. La privacidad lo dice en §9.
- **Medidas:**
  - **cifrado:** AES-256 (gpg simétrico, SHA-512) con una clave del titular,
    guardada en su gestor de contraseñas y como secreto de GitHub
    (`COPIA_CLAVE`), que los flujos necesitan para cifrar;
  - **comprobación:** suma SHA-256, y el script descifra cada copia para
    comprobarla;
  - **acceso:** solo quien tiene acceso al repositorio privado puede
    descargarla;
  - **restauración:** se ensaya en un proyecto de prueba y, al terminar, se
    reaplica la 30 con todo apagado.
- **verificar (propuestas, no constan en las fuentes):**
  - borrar del ordenador el archivo descifrado después de comprobar una
    copia;
  - tras restaurar, volver a aplicar los borrados de cuentas y las bajas
    posteriores a la fecha de la copia, para no revivir datos que ya debían
    estar borrados.

### A14 · Datos de versiones anteriores en pausa

- **Estado:** en pausa. No se recogen datos nuevos y su acceso desde las
  aplicaciones está cerrado (privacidad §§4, 5 y 9). Su estado real en el
  servidor debe comprobarse (privacidad §4).
- **Responsable:** el del apartado 1.
- **Finalidad:** conservar estos datos solo mientras hagan falta para
  atender derechos, incidencias, reclamaciones u obligaciones, y limpiar las
  instalaciones antiguas.
- **Base jurídica:**
  - **opiniones:** prestación pedida al publicar;
  - **denuncias y moderación:** interés legítimo en prevenir fraude, acoso,
    difamación y contenido ilícito, y en atender reclamaciones (6.1.f);
  - **preferencia de avisos por correo anterior:** consentimiento, que ya no
    activa envíos;
  - **instalaciones y tokens push anteriores:** no consta. **verificar.**
- **Interesados:** cuentas de versiones anteriores, autores de opiniones,
  denunciantes, moderadores e instalaciones antiguas de la app.
- **Datos:**
  - **opiniones:** nota, texto, fechas, el nombre elegido o «Anónimo» y el
    vínculo interno con la cuenta;
  - **denuncias:** qué cuenta denunció qué opinión y por qué;
  - **moderación:** acción, motivo, fecha y quién la tomó;
  - **instalaciones y tokens push** anteriores;
  - **preferencia de correo anterior:** el valor, su fecha y la versión
    `correo-v1-2026-08-22`.
- **Destinatarios:** Supabase (Irlanda).
- **Transferencias internacionales:** como A1.
- **Plazo de supresión:**
  - **instalaciones con más de 180 días sin actividad:** un proceso diario
    (03:17 UTC) las borra; se comprobó el 27/09/2026;
  - **opiniones:** se retiran si se pide;
  - **denuncias:** según su resolución y las responsabilidades posibles;
  - **moderación:** lo necesario, y se desvincula de las cuentas borradas;
  - **sin plazo fijado** para opiniones, denuncias, moderación y la
    preferencia anterior. **verificar** y fijarlo.
- **Medidas:**
  - acceso cerrado desde la web y la app;
  - la web pública usaba un identificador opaco distinto del de la cuenta;
  - no se usa para publicidad.

---

## 6. Lo que no se registra como actividad (y por qué)

Estos datos no salen del dispositivo ni llegan a RWAdar. Se explican en la
privacidad, pero no son un tratamiento que RWAdar reciba o guarde:

- favoritos de empresas y ofertas, en el navegador o en el móvil;
- progreso de la Academy (lecciones leídas, aciertos);
- preferencia de sonido;
- la lección a la que volver tras registrarse (24 horas, en el navegador);
- qué avisos se han leído en la tarjeta «Avisos» de la app y en la campana de
  la web, y el número del icono de la web (IndexedDB del service worker);
- la ubicación opcional de «Usar mi ubicación»: se usa una vez en memoria
  para centrar el mapa y no se envía a RWAdar.

Si alguno pasa a enviarse a un servidor, entra en este registro.

---

## 7. Pendientes que cambian este registro

- [x] **Contratos de encargo archivados** el 06/11/2026 en
  [`encargados/`](encargados/README.md): Supabase, Cloudflare, Google
  (Firebase), Expo, GitHub y Lettermint. Quedan:
  - [x] Firebase: condiciones aceptadas el 06/11/2026 (proyecto `rwadar-14e3d`);
  - [ ] Lettermint: crear la cuenta, apuntar la fecha y pedir la verificación
    de la cuenta (borrador en `docs/tareas/LETTERMINT-VERIFICACION-RESPUESTAS.md`);
  - [ ] **GitHub: no hay contrato de encargo.** Decidido el 06/11/2026:
    organización con GitHub Team y «GitHub Customer Agreement». Falta que
    Víctor la contrate y la firme;
  - [x] Netlify y Proton Mail: comprobados y archivados el 07/11/2026. Los
    dos vinculan sin firmar. Netlify sigue haciendo falta mientras pueda
    quedar alguna app web antigua instalada. Proton Mail dejó de ser el
    buzón el 12/11/2026: su ficha queda como histórico;
  - [x] Apple (APNs de una app nativa): no aplica (no hay app de iPhone);
  - [ ] **Servicios de push de los navegadores** (la 32): decidir en el anexo
    legal si son encargados o responsables propios y comprobar la adhesión al
    DPF de Apple, Mozilla y Microsoft antes de enviar a todos.
- [ ] **Gmail.** Quitar el envío de Auth por una cuenta de consumo sin
  contrato: pasarlo al SMTP de Lettermint (paso 5.8; contraste 9). Antes, las
  plantillas de Auth con la dirección postal y la privacidad (§6 y §8) y la
  «Información básica» publicadas con Lettermint en lugar de Gmail, y **la
  cuenta de Lettermint verificada**. Ese día se quita de este registro el
  envío de Auth de la fila de Google (Gmail) y se pasa a la de Lettermint.
- [ ] **Buzón en Gmail (desde el 12/11/2026).** El buzón rwadares@gmail.com
  es una cuenta de consumo, sin contrato de encargo del art. 28 RGPD: el mismo
  hueco ya señalado para los correos de Auth. Solución prevista: el dominio
  propio, con un proveedor de correo que tenga contrato de encargo
  (**verificar** cuál). Ese día se cambian la fila de Google (Gmail) y A7-A10.
- [x] **Historial del permiso y baja por correo.** Contrastados A6 y A7 con
  la 30 el 07/11/2026 (corregida la frase de la limpieza en A6).
- [x] **Delegado de protección de datos:** no es obligatorio (apartado 1,
  razonado el 07/11/2026).
- [x] **Contraseñas filtradas de Supabase:** no están en el plan gratuito
  (apartado 4).
- [x] **Brechas de datos:** procedimiento escrito en
  [`BRECHAS-DE-DATOS.md`](BRECHAS-DE-DATOS.md), con el registro interno que
  pide el art. 33.5 del RGPD (07/11/2026).
- [ ] **Casilla de los 18 años:** decidir si se guarda constancia (A1).
- [ ] **Corresponsabilidad** de Eric Almiñana y Samuel Rodriguez: decidir y,
  si procede, firmar el acuerdo y cambiar la privacidad (apartado 1).
- [ ] **Panel de control:** documentar qué datos de cuentas trata y quién
  entra (A1).
- [ ] **Plazos que faltan:**
  - registros técnicos de cada proveedor (A10);
  - analítica (A12);
  - buzón de bajas y de derechos (A7 y A9);
  - altas sin confirmar (A1);
  - datos en pausa (A14).
- [ ] **Bases que faltan en la privacidad:** actualizaciones de la app (A11) y
  analítica (A12).
- [ ] **GitHub** como depósito de las copias cifradas, en la privacidad (A13).
- [x] **Expo y el DPF:** consultado en la lista oficial el 06/11/2026,
  «Active - Re-certification under Review»; se citan primero las SCC de sus
  términos (contraste 15).
- [ ] **Al dar cada paso de los avisos** (4: casilla; 5: correo; 6: push;
  7: aviso automático de fichas nuevas), cambiar aquí el estado de A4-A7 y
  quitar las marcas «(pendiente)» que correspondan. Con la 32: al aplicarla,
  al crear la clave VAPID y al encender `push_habilitado`, que desde entonces
  enciende también las notificaciones de la web.
- [ ] **Anexo legal antes de `activar-push`** (A5): el «latido» de Firebase
  (LSSI, art. 22.2; Directiva ePrivacy, art. 5.3) y las notificaciones de la
  web (destinatarios, transferencias e «Información básica»).
- [x] **Web con la Academy con cuenta:** publicada el 06/11/2026; fecha
  anotada en A3.

---

## 8. Historial de este registro

| Fecha | Cambio | Quién |
|---|---|---|
| 06/11/2026 | Versión 1: 14 actividades, proveedores y medidas comunes | Claude, a petición de Víctor Manuel Jorques Granero |
| 06/11/2026 | Versión 2: Lettermint sustituye a Brevo; contratos de encargo leídos y archivados en `encargados/`; filas de Supabase, Cloudflare, Expo, Firebase y GitHub corregidas; hueco de GitHub; Gmail se sustituye por el SMTP de Lettermint; la 30, aplicada | Claude, con el permiso general de Víctor |
| 07/11/2026 | Versión 3: Netlify y Proton Mail comprobados y archivados; Suiza, con decisión de adecuación; Apple no aplica; delegado de protección de datos no obligatorio (razonado); contraseñas filtradas fuera del plan gratuito; A6 y A7 contrastados con el SQL; marcado lo hecho (Firebase, la 30 y la 31, app 1.4.2, web con la Academy con cuenta); la casilla de los 18 años no se guarda; la clave de las copias también está en GitHub; verificación de la cuenta de Lettermint; enlace al procedimiento de brechas | Claude, por encargo de Víctor |
| 12/11/2026 | Versión 4: el titular cambió el correo de contacto a rwadares@gmail.com, que pasa a ser el buzón de RWAdar (consultas, derechos, bajas por correo, empresas, reportes de seguridad y contactos profesionales), como dice la privacidad corregida ese día. Destinatarios y transferencias de A7-A10, a Google (Gmail). Proton Mail deja de tratar datos de usuarios: sale de los proveedores y lo del 07/11 queda como historial; solo sigue la cuenta personal del titular con la que entra como moderador. **Hueco abierto:** una cuenta de Gmail de consumo no tiene contrato de encargo (art. 28 RGPD), el mismo riesgo ya señalado para los correos de Auth; la solución prevista es el dominio propio | Claude, por encargo de Víctor |
| 12/11/2026 | Versión 5: notificaciones en la web (Web Push, migración 32, sin aplicar): datos nuevos (`suscripciones_web`, `envios_web`), destinatarios nuevos (servicios de push de Apple, Google, Mozilla y Microsoft, y GitHub como remitente), plazos (90 y 180 días, cada día con el reloj de limpieza) y la baja en cada notificación. A5: el permiso ya se recoge en Perfil (web y app) y la casilla del alta sigue apagada. Corregida la fila de Apple (la app nativa sigue sin aplicar; la web en iPhone usa el servicio de push de Apple). Anexo legal pendiente antes de `activar-push` | Claude, por encargo de Víctor |

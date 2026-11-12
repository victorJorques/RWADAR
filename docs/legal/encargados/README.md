# Contratos de encargo · RWAdar

**Fecha:** 06/11/2026. **Al día:** 07/11/2026 (Netlify y Proton Mail
comprobados; Apple, sin aplicar hoy).
**Quién lo hace:** Claude (IA), a petición de Víctor Manuel Jorques Granero,
titular de RWAdar. No es el dictamen de un abogado.

**Para qué sirve.** Cada proveedor que trata datos de los usuarios por cuenta
de RWAdar necesita un contrato de encargo (RGPD, art. 28.3). Aquí está, de
cada uno:

- qué hace en RWAdar;
- dónde está su contrato y qué versión rige;
- cómo nos vincula (si hay que firmar algo o no);
- cómo se protegen los datos que salen de la UE;
- dónde publica sus subencargados;
- la copia en PDF del día.

**Las copias en PDF.** Se imprimieron el 06/11/2026 con un navegador
automático (Chromium, con Playwright). Cada página lleva arriba la dirección y
«copia del 06/11/2026». En las de Lettermint se quitaron el pie de su web y
los efectos gráficos, porque sin eso cada PDF pesaba 17 MB; el texto del
contrato está entero. Si un proveedor publica otra versión, se imprime de nuevo
con la fecha nueva y la antigua se queda.

Las del 07/11/2026: las dos de Netlify son sus propios PDF, descargados tal
cual de su web; las dos de Proton se imprimieron con Chrome sin ventana, que
pone arriba la fecha y abajo la dirección de cada página.

El registro de actividades
([`../REGISTRO-ACTIVIDADES-TRATAMIENTO.md`](../REGISTRO-ACTIVIDADES-TRATAMIENTO.md),
apartado 3) resume esto mismo y enlaza aquí.

---

## Resumen

| Proveedor | Qué hace en RWAdar | ¿Hay contrato de encargo? | Datos fuera de la UE |
|---|---|---|---|
| **Supabase** | Base de datos y cuentas | Sí, dentro de sus condiciones. Nada que firmar | Cláusulas tipo (SCC), módulo 2 |
| **Cloudflare** | Web, sesión, analítica | Sí, dentro de su acuerdo de autoservicio. Nada que firmar | Marco UE-EE. UU. (DPF) y SCC |
| **Google Firebase** | Notificaciones en Android (desde la 1.4.2; los avisos siguen apagados) | Sí: condiciones aceptadas en la consola el 06/11/2026 (proyecto `rwadar-14e3d`) | DPF y SCC |
| **Expo** | Actualizaciones de la app y push | Sí, en sus términos (§3.2). No hay contrato aparte | SCC módulo 2, y DPF «en revisión» |
| **GitHub** | Código, flujos, copias y descargas del APK | **No. Es un hueco** | DPF |
| **Lettermint** | Todos los correos de RWAdar (pendiente) | Sí, al crear la cuenta (pendiente) | No salen: todo en la UE |
| **Netlify** | Página de limpieza en `rwadar.netlify.app` | Sí, dentro de su acuerdo de autoservicio. Nada que firmar | DPF y, si cae, SCC módulo 2 |
| **Proton Mail** | Buzón rwadares@gmail.com | Sí, dentro de sus condiciones. Nada que firmar | Suiza, con decisión de adecuación de la UE |
| **Apple (APNs)** | Nada hoy: no hay app de iPhone | No aplica | No aplica |

---

## Supabase

| | |
|---|---|
| **Qué hace** | Base de datos y autenticación: cuentas, lista de seguimiento, cartera y avisos. El proyecto está en Irlanda (`eu-west-1`). |
| **Quién firma** | Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapur 049513 (condiciones, §1.j; solo sería Supabase, Inc. si se comprara por AWS Marketplace). |
| **Contrato** | Data Processing Addendum: https://supabase.com/legal/customer-resources/data-processing-addendum |
| **Versión** | «Version 1 — August 1, 2026» (01/08/2026). |
| **Cómo vincula** | Sus condiciones (https://supabase.com/terms), §7(b): «The Parties agree to comply with the Data Processing Addendum, which is incorporated into this Agreement.» Las condiciones rigen desde que se aceptan o se usa el servicio. El propio panel de Supabase lo dice: «No separate signed DPA is needed.» **No hay que firmar nada.** |
| **Transferencias** | Supabase **no** está en la lista del marco UE-EE. UU. (consulta del 06/11/2026: ningún resultado). Los datos están en Irlanda. Para cualquier acceso desde fuera de la UE (soporte, subencargados) valen las cláusulas tipo de la UE (SCC) que lleva el DPA: módulo 2, de responsable a encargado; el importador es Supabase Pte. Ltd.; tribunales de Irlanda. |
| **Subencargados** | https://supabase.com/legal/customer-resources/subprocessor-list (DPA, §6.2) |
| **PDF** | [`2026-11-06-supabase-dpa.pdf`](2026-11-06-supabase-dpa.pdf) y [`2026-11-06-supabase-terminos.pdf`](2026-11-06-supabase-terminos.pdf) |

## Cloudflare

| | |
|---|---|
| **Qué hace** | Aloja la web (Pages) y el servidor web que gestiona la sesión. También la red de entrega, la seguridad y la analítica sin cookies. |
| **Quién firma** | Cloudflare, Inc. (EE. UU.). |
| **Contrato** | Customer DPA: https://www.cloudflare.com/cloudflare-customer-dpa/ |
| **Versión** | «Version 6.4, effective April 3, 2026» (03/04/2026). |
| **Cómo vincula** | Su acuerdo de autoservicio, el «Self-Serve Subscription Agreement» (https://www.cloudflare.com/terms/, «Last Updated September 12, 2025»), §6.1: Cloudflare tratará los datos personales según su DPA, «which is hereby incorporated by reference into this Agreement». El acuerdo «is effective when you click to accept it, use or access the Services». **No hay que firmar nada.** |
| **Transferencias** | Cloudflare, Inc. está en el marco UE-EE. UU. (DPF) como «Active» (participante 5666, consulta del 06/11/2026). DPA, §6.4: lo que viaja con el DPF no cuenta como transferencia restringida. Si el DPF cayera, se aplican las SCC, módulo 2 (§6.2.a.i). |
| **Subencargados** | https://www.cloudflare.com/gdpr/subprocessors/ |
| **PDF** | [`2026-11-06-cloudflare-dpa.pdf`](2026-11-06-cloudflare-dpa.pdf) y [`2026-11-06-cloudflare-acuerdo-autoservicio.pdf`](2026-11-06-cloudflare-acuerdo-autoservicio.pdf) |

## Google Firebase (Cloud Messaging)

| | |
|---|---|
| **Qué hará** | Entregar las notificaciones en Android, desde el APK 1.4.2. Proyecto `rwadar-14e3d` (plan Spark; Analytics, Gemini y Programa de desarrolladores apagados), app `com.rwadar.app`. **Hoy no recibe datos:** la app solo le pide algo cuando la persona pulsa «Notificaciones en este móvil», y los avisos siguen apagados. Ojo: desde la 1.4.2, Firebase guarda en el móvil las fechas recientes de uso de la app («latido») y las envía en esa primera petición (ver `docs/tareas/APK-1.4.2-NOTIFICACIONES.md`). |
| **Quién firma** | Google LLC, Google Ireland Limited u otra empresa del grupo, «as applicable»: el contrato no fija cuál. |
| **Contrato** | Firebase Data Processing and Security Terms: https://firebase.google.com/terms/data-processing-terms. Sus cláusulas tipo: https://firebase.google.com/terms/firebase-sccs-eu-c2p |
| **Versión** | «Terms last modified: August 21, 2024» (21/08/2024). |
| **Cómo vincula** | «These Firebase Data Processing and Security Terms […] are incorporated into the Agreement.» Rigen desde la «Terms Effective Date», que es «the date on which Customer accepted, or the parties otherwise agreed to, these Terms». O sea: desde que Víctor las acepta en la consola al crear el proyecto. **Aceptadas el 06/11/2026** al crear el proyecto `rwadar-14e3d` (lo hizo la sesión local de Claude con la cuenta de Google de Víctor y su permiso). |
| **Transferencias** | Google LLC está en el DPF como «Active» (participante 5780). §10.2: se usa el DPF y, si no estuviera disponible, las SCC. |
| **Subencargados** | https://firebase.google.com/terms/subprocessors |
| **PDF** | [`2026-11-06-google-firebase-terminos-tratamiento.pdf`](2026-11-06-google-firebase-terminos-tratamiento.pdf) y [`2026-11-06-google-firebase-scc.pdf`](2026-11-06-google-firebase-scc.pdf) |

## Expo (650 Industries)

| | |
|---|---|
| **Qué hace** | Compila la app y entrega las actualizaciones sin instalar una versión nueva. Cuando se encienda, también el push (Expo Push). |
| **Quién firma** | 650 Industries, Inc. (EE. UU.). |
| **Contrato** | **No hay contrato de encargo aparte:** https://expo.dev/dpa da 404 (comprobado el 06/11/2026). El contrato de encargo es el apartado 3.2, «GDPR», de sus términos: https://expo.dev/terms |
| **Versión** | «Last updated November 2, 2026, and effective November 2, 2026» (02/11/2026). |
| **Cómo vincula** | §3.2: Expo actúa como encargado («processor») y «complies with module two of the standard contractual clauses […] (C/2021/3972)». Elige: cláusula 9, opción 2 (permiso general para subencargados) con una semana de aviso; cláusula 17, opción 2; cláusula 18, los tribunales del país de quien exporta (España). Esas cláusulas ya contienen lo que pide el art. 28.3. Rige al aceptar los términos (crear la cuenta o usar el servicio). **No hay que firmar nada.** |
| **Ojo** | [INTERPRETABLE] El §3.2 habla de los datos personales «included in the User Content». Que el token del push y la consulta de actualizaciones entren ahí es razonable, pero no lo dice con esas palabras. |
| **Transferencias** | SCC módulo 2 (§3.2). En el DPF figura como «Active - Re-certification under Review» (participante 5606, consulta del 06/11/2026). Como la renovación está en revisión, lo primero que se cita son las SCC. |
| **Subencargados** | **No hay lista pública** (expo.dev/subprocessors da 404). Su privacidad (https://expo.dev/privacy, «Last updated November 2nd 2026») solo habla de «authorized third-party vendors and service providers». |
| **PDF** | [`2026-11-06-expo-terminos.pdf`](2026-11-06-expo-terminos.pdf) |

## GitHub · hueco

| | |
|---|---|
| **Qué hace** | Guarda el código en un repositorio privado. Ejecuta los flujos: la copia diaria de la base, la copia previa a cada cambio, «Aplicar catálogo», «Avisos a registrados (base)» y publicar. Guarda las copias cifradas 35 días. Publica el APK, y la app le pregunta si hay versión nueva. |
| **Quién** | GitHub, Inc. (EE. UU.) o GitHub B.V. (Países Bajos). |
| **Contrato que existe** | GitHub Data Protection Agreement: https://github.com/customer-terms/github-data-protection-agreement («Version: October 2025»). |
| **Cómo vincula** | **En nuestra cuenta, no vincula.** El DPA dice que «forms part of the GitHub Customer Agreement», y llama «Online Services» a lo que GitHub presta «under a written and executed agreement». La cuenta de RWAdar es personal y gratuita: se rige por los términos generales de GitHub, no por el Customer Agreement. Para esas cuentas, la privacidad de GitHub dice que trata los datos «as the "Data Controller"», es decir, como responsable y no como encargado. |
| **Por qué es un hueco real** | Las copias y los flujos de la base se ejecutan en máquinas de GitHub. Allí la copia está **en claro** unos minutos, antes de cifrarse, y los flujos de la base leen y escriben datos de las cuentas. Eso es tratar datos de usuarios por cuenta de RWAdar sin el contrato del art. 28.3. Las copias guardadas van cifradas, pero la contraseña (`COPIA_CLAVE`) también es un secreto de GitHub: GitHub guarda a la vez la copia y su llave. |
| **Transferencias** | GitHub está en el DPF como «Active» (participante 6174). Pero el DPF solo cubre el viaje de los datos: no sustituye al contrato de encargo. |
| **Subencargados** | Solo con el DPA: https://github.com/github-subprocessors-list |
| **PDF** | [`2026-11-06-github-dpa.pdf`](2026-11-06-github-dpa.pdf) y [`2026-11-06-github-declaracion-privacidad.pdf`](2026-11-06-github-declaracion-privacidad.pdf) |

**Decisión (06/11/2026, Claude, por encargo de Víctor): opción A, GitHub Team.**

Por qué:

- **El DPA solo existe en planes de pago.** La página de condiciones de
  GitHub dice que el DPA «applies to the processing of data for GitHub
  Enterprise Cloud, GitHub Enterprise (Unified), GitHub Teams and GitHub
  Copilot» (https://github.com/customer-terms, consultado el 06/11/2026). Una
  organización gratuita no basta.
- **Supabase gratuito no hace copias.** Su ayuda dice «We automatically back
  up all Pro, Team, and Enterprise Plan projects» y recomienda a los proyectos
  gratuitos exportar sus datos ellos mismos
  (https://supabase.com/docs/guides/platform/backups). Hoy las únicas copias
  de RWAdar son las de GitHub: la diaria y la que se hace antes de cada cambio
  en la base. Sacar de ahí los datos personales (opción B) dejaría las cuentas
  sin copia, o dependería de que el ordenador de Víctor esté encendido cada
  noche.
- **Es lo más barato que cierra el hueco.** GitHub Team cuesta 4 $ por
  persona y mes (una persona). Supabase Pro, que sí hace copias, cuesta 25 $ al
  mes y además no quitaría los flujos de GitHub.
- **Casi no cambia nada.** Al pasar el repositorio a la organización se
  conservan los secretos, los webhooks y el historial, y GitHub redirige las
  direcciones antiguas. Los flujos de uso diario (copias, base, catálogo,
  publicar, compilar y OTA) no llevan escrito el nombre del repositorio. Solo
  lo llevan las pruebas antiguas de la 1.4.0 y la 1.4.1, que ya no se usan.
  Team además sube los minutos de Actions de 2.000 a 3.000 al mes.
- **RWAdar-downloads se queda en la cuenta personal.** Es público, solo
  guarda el APK y no trata datos de usuarios. Las apps instaladas consultan su
  dirección exacta, así que no conviene moverlo.

Pasos (solo puede hacerlos Víctor, con su cuenta y su tarjeta; la sesión local
de Claude con su Chrome puede hacer los clics):

1. github.com › «+» › «New organization» › plan **Team**. Nombre: `rwadar`
   (el 06/11 no existía ninguna cuenta con ese nombre). Tarjeta de Víctor.
2. En la organización: Settings › «Terms of Service» › «Read the GitHub
   Customer Agreement» › «Sign GitHub customer terms». Como nombre, «RWAdar
   (Víctor Manuel Jorques Granero)». Apuntar la fecha abajo y guardar en esta
   carpeta un PDF de la página de condiciones aceptadas.
3. En `victorJorques/RWADAR`: Settings › «Danger Zone» › «Transfer» ›
   `rwadar`.
4. Instalar en la organización las apps que usa el proyecto (Claude y Codex)
   con acceso a `rwadar/RWADAR`. En cada copia local:
   `git remote set-url origin https://github.com/rwadar/RWADAR`.
5. Lanzar «Copia de seguridad» a mano y comprobar que sale en verde.

Mientras tanto, las copias siguen funcionando como hasta ahora. Pararlas sería
peor para los usuarios: con Supabase gratuito no habría ninguna otra copia.

## Lettermint

| | |
|---|---|
| **Qué hará** | Enviar todos los correos de RWAdar. Por su API: la bienvenida y los avisos de novedades. Por su SMTP: la confirmación de cuenta y la recuperación de contraseña de Supabase Auth (hoy salen por Gmail). **Hoy no trata nada.** |
| **Razón social y domicilio** | «Lettermint B.V., a private limited liability company incorporated under the laws of the Netherlands, registered with the Dutch Chamber of Commerce under number 99337711 and having its registered address at Willemsvaart 16 B, 8019 AB Zwolle, the Netherlands» (DPA, primer párrafo). |
| **Contrato** | DPA: https://lettermint.co/dpa |
| **Versión** | «Version of 9 October 2026» (09/10/2026). A quien se da de alta después, esa versión le rige desde el alta (§16.1). |
| **Cómo vincula** | Sus condiciones (https://lettermint.co/terms-of-service, «Last updated: April 8, 2026»): §4.7, el contrato nace «by creating an Account, by using the Service and/or by the User (otherwise) agreeing to these Terms and Conditions»; §15.3, si no hay un contrato de encargo firmado aparte, se aplica su DPA estándar, «deemed to have been accepted by the User upon entering into the Agreement». El DPA: «This DPA applies automatically whenever Lettermint processes Controller Personal Data», y rige desde que rige el contrato (§15.1). **Queda vinculado al crear la cuenta.** Si se quiere una copia firmada, la mandan a petición («A signed DPA on request», página de subencargados). |
| **Dónde están los datos** | §8.1: «The hosting, storage, and processing of Email Data within Lettermint's European email infrastructure and service-Subprocessor chain shall take place within the European Union». §8.2: el resto de datos, en la UE o el Espacio Económico Europeo. |
| **Transferencias** | Ninguna prevista. §8.4: no saca datos del EEE salvo que RWAdar lo autorice, con las garantías del capítulo V del RGPD (decisión de adecuación o art. 46) y, si hace falta, una evaluación de impacto. §8.3: entregar el correo en el buzón de cada destinatario (por ejemplo, un Gmail) es una instrucción de RWAdar, no una transferencia de Lettermint. |
| **Subencargados** | https://lettermint.co/subprocessors (lista del 29/10/2026). «Only UpCloud, OVH Cloud and Postmastery handle the emails you send or receive through Lettermint, all within the EU»: UpCloud (Países Bajos, su nube), OVH Cloud (Alemania, copias cifradas) y Postmastery (Países Bajos, entregabilidad). Aikido (Europa, seguridad) y Mistral (Europa, soporte y abuso) no ven los correos. Avisa con 30 días de un subencargado nuevo, y se puede objetar (§7.2 y §7.3). |
| **Cuánto guarda** | Contenido, destinatarios, metadatos y eventos de cada mensaje: 28 días, o lo que se configure. Eventos para estadísticas: 90 días como máximo (§3.1). Registros técnicos: normalmente 14 días como máximo (página de subencargados). Copias después de borrar: 14 días como máximo (§11.5). |
| **Otras cosas útiles** | Avisa de una brecha en 24 horas como máximo (§10.1). Usa IA solo para soporte y abuso, sin entrenar con nuestros datos (§13). Los datos de la cuenta de Víctor (facturación, administración) los trata como responsable propio (§2.3). Ley neerlandesa (§17.1). |
| **Su política de uso** | https://lettermint.co/acceptable-use exige: consentimiento y prueba de cuándo se dio; «Include your valid physical postal address in every email»; una baja clara en cada correo de marketing, que funcione al menos 30 días; atender las bajas en 10 días hábiles como máximo. Por eso el pie de cada correo lleva la dirección del aviso legal. |
| **PDF** | [`2026-11-06-lettermint-dpa.pdf`](2026-11-06-lettermint-dpa.pdf), [`2026-11-06-lettermint-subencargados.pdf`](2026-11-06-lettermint-subencargados.pdf), [`2026-11-06-lettermint-terminos.pdf`](2026-11-06-lettermint-terminos.pdf) y [`2026-11-06-lettermint-uso-aceptable.pdf`](2026-11-06-lettermint-uso-aceptable.pdf) |

## Netlify

| | |
|---|---|
| **Qué hace** | Aloja en `rwadar.netlify.app` la página «Esta dirección ya no está en uso» y el `sw.js` que borra la app web antigua de los móviles donde se instaló (carpeta `rwadar-limpieza/`). Recibe la IP y los datos técnicos de quien abre esa dirección. Comprobado el 07/11/2026: responde 200 con esa página y la cabecera `server: Netlify`. |
| **¿Sigue haciendo falta?** | **Sí, de momento.** La app web antigua pedía la página a la red antes que a su copia guardada: solo se borra cuando alguien la abre con internet y llega a esta página. Si se quita la dirección, esas instalaciones seguirían funcionando de memoria (comentario de `rwadar-limpieza/index.html`). No hay forma de saber cuántas quedan: la dirección no tiene analítica (RUM apagado). `AGENTS.md` dice que se conserva. Quitarla es decisión de Víctor. **Verificar** también si `https://rwadar.netlify.app/` sigue en Supabase › Authentication › URL Configuration: el traspaso del 08/10/2026 proponía quitarla de ahí, porque ya no sirve la aplicación. |
| **Quién firma** | Netlify, Inc., sociedad de Delaware, 512 2nd Street, Suite 200, San Francisco, CA 94107 (EE. UU.) (acuerdo de autoservicio, primer párrafo; DPA, anexo). |
| **Contrato** | Data Processing Agreement: https://www.netlify.com/pdf/netlify-dpa.pdf |
| **Versión** | «Last Updated: June 9, 2026» (09/06/2026). |
| **Cómo vincula** | Su «Self-Serve Subscription Agreement» (https://www.netlify.com/legal/self-serve-subscription-agreement/, «Last Updated: November 4, 2026») rige desde que se pulsa «Create Account» «or by using or accessing the Services», y cubre también el plan gratuito («Free Usage Tier», §5). Su §6.5: «The DPA applies to personal data that Netlify processes on Customer's behalf, including personal data in Customer Content, and is incorporated into this Agreement». «Customer Content» incluye los «logs of requests that end users make to those sites». Su página https://www.netlify.com/gdpr-ccpa/ lo resume: «Our DPA is incorporated by reference in Netlify's terms and conditions». **No hay que firmar nada.** |
| **Transferencias** | DPA §14.2: Netlify dice estar certificada en el marco UE-EE. UU. (DPF) y las transferencias se basan en él. Si el DPF cayera o Netlify no renovara, §14.3: cláusulas tipo (SCC), módulo 2. **Verificar** su entrada en la lista oficial (https://www.dataprivacyframework.gov/list): el 07/11/2026 la página no se pudo leer sin navegador. |
| **Brechas** | §10.1: avisa «without undue delay, but in any event within forty-eight (48) hours». |
| **Subencargados** | https://www.netlify.com/legal/subprocessors/ (DPA §6.2). Avisa con 30 días de uno nuevo. |
| **Contacto** | privacy@netlify.com (DPA, anexo: persona de contacto). El DPA nombra también security@netlify.com y legal@netlify.com para pedir auditorías (§8.4.2). |
| **PDF** | [`2026-11-07-netlify-dpa.pdf`](2026-11-07-netlify-dpa.pdf) y [`2026-11-07-netlify-acuerdo-autoservicio.pdf`](2026-11-07-netlify-acuerdo-autoservicio.pdf) |

## Proton Mail

| | |
|---|---|
| **Qué hace** | El buzón rwadares@gmail.com: consultas, solicitudes de derechos, bajas por correo, empresas y reportes de seguridad. También es la dirección de respuesta de los avisos. |
| **Quién firma** | Proton AG, Route de la Galaise 32, 1228 Plan-les-Ouates, Ginebra (Suiza), número CHE-354.686.492 (DPA, primer párrafo). |
| **Contrato** | Data Processing Agreement: https://proton.me/legal/dpa |
| **Versión** | «Last modified: February 10, 2026» (10/02/2026). |
| **Cómo vincula** | El DPA «forms part of the Contract for Services under Proton AG's Terms and Conditions». Sus condiciones (https://proton.me/legal/terms, «Last modified: November 05, 2026»), apartado 7: «If, in the provision of the Services, the Company processes, on the user's behalf (where the user acts as a Data Controller), any personal data that is subject to the EU General Data Protection Regulation (GDPR), the company's data processing agreement shall apply». **No hay que firmar nada.** [INTERPRETABLE] El DPA llama «Company» a «any business or organization using the Services, regardless of its legal form»; RWAdar es un proyecto de una persona física. Como las condiciones aplican el DPA siempre que el usuario sea responsable del tratamiento, es razonable apoyarse en él. |
| **Transferencias** | Suiza tiene decisión de adecuación de la UE: Decisión 2000/518/CE de la Comisión, de 26 de julio de 2000 (EUR-Lex, en vigor, consultada el 07/11/2026). Sigue valiendo con el RGPD (art. 45.9: «permanecerán en vigor hasta que sean modificadas, sustituidas o derogadas»). La Comisión la revisó en su informe del 15/01/2024 (COM(2024) 7 final) y concluyó que Suiza sigue dando una protección adecuada. Por eso no hacen falta cláusulas tipo para llevar datos a Suiza. DPA §11: Proton solo los lleva, «to the extent possible», a Suiza, la UE o países con adecuación; fuera de ahí, con cláusulas tipo. |
| **Dónde están los datos** | Su privacidad («Last modified: 12th May 2026») dice que el servicio lo presta Proton AG en Suiza, pero **no dice dónde están guardados los buzones** (**verificar**). Cualquiera de los destinos que permite el DPA §11 está cubierto por la adecuación o por el RGPD. |
| **Brechas** | DPA: «the Processor shall notify the Company without delay», con la información necesaria para que RWAdar cumpla sus obligaciones. No fija horas. |
| **Subencargados** | El DPA da permiso general y remite a la lista de su privacidad (https://proton.me/legal/privacy): por ejemplo, Zendesk para el chat de soporte y Chargebee para los pagos. |
| **Contacto** | security@proton.me (su `/.well-known/security.txt`, 07/11/2026). |
| **PDF** | [`2026-11-07-proton-dpa.pdf`](2026-11-07-proton-dpa.pdf) y [`2026-11-07-proton-terminos.pdf`](2026-11-07-proton-terminos.pdf) |

## Apple (APNs) · no aplica hoy

No hay app de iPhone publicada ni cuenta de Apple Developer (`docs/INTERNO.md`,
07/11/2026). En iPhone, RWAdar es la web, también la que se añade a la
pantalla de inicio, y no usa notificaciones de Apple. Apple no recibe ningún
dato de los usuarios por cuenta de RWAdar. Si algún día se publica la app de
iPhone con notificaciones, se lee entonces el contrato de Apple, se archiva
aquí y se añade al registro de actividades.

## Alternativas descartadas (solo como referencia)

| Proveedor | Contrato | Por qué no |
|---|---|---|
| **Postmark** (AC PM LLC, del grupo ActiveCampaign) | https://postmarkapp.com/dpa, «Effective November 17, 2025» | Empresa de EE. UU.: los correos saldrían de la UE, con DPF (a través de ActiveCampaign, que cubre a AC PM LLC) y SCC módulo 2. Se prefirió Lettermint, que los trata dentro de la UE. |
| **Resend** (Plus Five Five, Inc.) | https://resend.com/legal/dpa | Empresa de EE. UU.: DPF «Active - Re-certification under Review» (participante 8907) y SCC módulo 2. Mismo motivo. |

Brevo quedó descartado antes por el píxel de apertura (revisión legal, §4.10).
No se archivó su contrato.

PDF: [`2026-11-06-postmark-dpa.pdf`](2026-11-06-postmark-dpa.pdf) y
[`2026-11-06-resend-dpa.pdf`](2026-11-06-resend-dpa.pdf).

**Fuera de esta carpeta** solo queda Gmail: hoy envía los correos de Auth sin
contrato de encargo (cuenta de consumo); lo sustituye el SMTP de Lettermint en
el paso 5.8 del contrato de avisos. Netlify, Proton Mail y Apple se
comprobaron el 07/11/2026 (arriba).

---

## Qué tiene que hacer Víctor

1. **Firebase.** ✅ Hecho el 06/11/2026: proyecto `rwadar-14e3d`, condiciones
   aceptadas en la consola.
2. **GitHub.** **Decidido el 06/11: opción A, GitHub Team** (ver «GitHub ·
   hueco», arriba, con los pasos). Las dos opciones eran:
   - **A. Firmar el contrato de GitHub.** Pasar el repositorio a una
     organización con GitHub Team (de pago) y aceptar allí el «GitHub Customer
     Agreement», que incluye el DPA. Según la ayuda de GitHub, se hace en la
     configuración de la organización › «Terms of Service» › «Sign GitHub
     customer terms». Al contratar, comprobar que el DPA queda incluido.
   - **B. Sacar los datos personales de las máquinas de GitHub.** Hacer las
     copias y los cambios de la base desde tu ordenador (o con una máquina
     propia conectada a GitHub), y dejar en GitHub solo el código y archivos ya
     cifrados.

   Mientras no se haga, falta el contrato que pide el art. 28.3. El riesgo
   práctico es bajo (repositorio privado, GitHub en el DPF), pero el hueco
   existe.
3. **Lettermint.** Crear la cuenta y el proyecto (paso 5 del
   [contrato de avisos](../../tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md)).
   Al crearla se acepta el contrato. Apuntar la fecha abajo. Usar como correo de
   la cuenta uno que se revise: ahí llegan los avisos de brechas (24 horas) y
   de subencargados nuevos (30 días). Pedir también la verificación de la
   cuenta (contrato, punto 5.2). Opcional: pedir la copia firmada del DPA
   y guardarla aquí.
4. **Supabase.** Nada que firmar. Opcional: en el panel, «Organization ›
   Legal Documents», descargar la evaluación de las transferencias si la
   ofrece, y guardarla aquí con la fecha.
5. **Cloudflare, Expo, Netlify y Proton.** Nada que firmar. En Netlify,
   decidir algún día si se retira `rwadar.netlify.app` (ver arriba) y mirar si
   sigue en la configuración de direcciones de Supabase.

## Fechas que hay que apuntar

| Proveedor | Fecha de aceptación | Cómo |
|---|---|---|
| Google Firebase | **06/11/2026** | Aceptadas en la consola al crear el proyecto `rwadar-14e3d` |
| Lettermint | **pendiente** | Crear la cuenta |
| Lettermint · verificación | **pendiente** | Fecha en que se pidió y fecha en que la aprobaron |
| Netlify y Proton | **no consta** | Al crear cada cuenta (antes de este registro). Si se puede ver en el panel de cada una, apuntarla aquí |
| GitHub | **pendiente**: organización `rwadar` con GitHub Team | Firmar el «GitHub Customer Agreement» en la organización |

---

## Cómo se comprobó (06/11/2026)

- **Contratos:** leídos e impresos ese día (los PDF de esta carpeta).
- **Marco UE-EE. UU. (DPF):** consulta a la lista oficial
  (https://www.dataprivacyframework.gov) el 06/11/2026:
  - Cloudflare, Inc. (5666): «Active»;
  - Google LLC (5780): «Active»;
  - GitHub (6174): «Active»;
  - Expo (5606): «Active - Re-certification under Review»;
  - Resend (8907): «Active - Re-certification under Review»;
  - Supabase: ningún resultado;
  - Postmark: sin entrada propia; AC PM LLC aparece cubierta por ActiveCampaign
    (4495), «Active».
- **Expo:** https://expo.dev/dpa y https://expo.dev/subprocessors dan 404.
- **GitHub:** su privacidad («Effective date: April 27, 2026») dice que GitHub,
  Inc. o GitHub B.V. tratan los datos «as the "Data Controller"».

## Cómo se comprobó (07/11/2026)

- **Netlify:** su DPA y su acuerdo de autoservicio, descargados en PDF de su
  web (los dos de esta carpeta), y su página https://www.netlify.com/gdpr-ccpa/.
  `rwadar.netlify.app` abierto con `curl`: 200, página de limpieza,
  `server: Netlify`.
- **Proton:** DPA, condiciones y privacidad leídos en su web; los dos primeros,
  impresos aquí. Contacto de seguridad de su `/.well-known/security.txt`.
- **Suiza:** Decisión 2000/518/CE en EUR-Lex
  (https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32000D0518), la
  lista de decisiones de adecuación de la Comisión
  (https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en)
  y su informe del 15/01/2024.
- **No se pudo:** leer la lista oficial del DPF sin navegador (Netlify queda
  como **verificar** allí) ni ver dónde guarda Proton los buzones.

<!-- Informe legal guardado tal como lo entregó la revisión del 06/11/2026; el anexo final
     recoge el contraste y lo aplicado. Los números de línea citados son del commit 80c2f3e. -->
# Revisión legal: avisos por correo y push, bienvenida y Academy con cuenta

**Fecha:** 06/11/2026.
**Quién la hace:** Claude (IA), a petición de Víctor Manuel Jorques Granero, titular de RWAdar. No es el dictamen de un abogado colegiado.
**Qué se ha revisado:** la rama `claude/avisos-y-academy-registro`, en el commit `80c2f3e`, frente al contrato `docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`. Los números de línea corresponden a ese commit.
**Cómo leer las marcas:**
- **[SEGURO]**: lo dice el texto de la norma o una resolución.
- **[INTERPRETABLE]**: depende de cómo se lea; en esos casos explico qué postura tomo y por qué.

**Lo que comprobé yo mismo hoy, en la fuente:**
- LSSI, arts. 20, 21, 22, 38, 39 y 45 (BOE consolidado).
- LOPDGDD, arts. 11, 23.4, 32 y 72.1.c.
- EDPB, Directrices 05/2020, §64 y §108.
- Circular CNMV 1/2024 (BOE-A-2024-27149).
- El registro de cambios de Brevo del 21/07/2026.
- Las frases citadas de las resoluciones de la AEPD E/01415/2017 y E/07233/2015.
- Que `https://rwadar.pages.dev/condiciones` y `https://rwadar.pages.dev/baja` responden hoy con un 404.

El resto sale de la investigación previa, que cita sus fuentes en el apartado 7.

---

## 1. Conclusión en 5 líneas

1. **Sí se puede activar.** La Academy con cuenta y la bienvenida son parte del servicio (RGPD, art. 6.1.b). Los avisos se basan en el consentimiento (LSSI, art. 21.1, y RGPD, art. 6.1.a). El diseño ya cumple lo esencial: casilla aparte y sin marcar, doble confirmación y baja por enlace, por `mailto` y en Perfil.
2. **Antes del paso 4 hay que hacer cinco cosas:**
   - cambiar el texto de la casilla a la versión v2;
   - poner la información básica junto a las casillas;
   - arreglar «Leer condiciones» en la app, que da 404;
   - guardar el historial de altas y bajas del permiso;
   - poner la privacidad al día.

   Hay que hacerlo **antes de que nadie acepte**: si el texto cambia después, todos los permisos v1 dejan de servir para enviar.
3. **Antes del paso 5 hay que hacer siete cosas:**
   - privacidad del correo: Brevo recibirá el correo de **todas** las cuentas que confirmen;
   - Brevo sin píxel ni seguimiento de clics, comprobado en el original del mensaje;
   - el nombre del titular en el pie;
   - un procedimiento para las bajas que lleguen por correo;
   - `/baja` publicada;
   - los contratos de encargo archivados;
   - el registro de actividades de tratamiento.
4. **No se pone «Publi» ni «Publicidad»** ni en el asunto ni en el push. La ley no lo exige desde el 11/05/2014 y aquí haría pensar que alguien paga. El aviso automático de ofertas (paso 7) espera a las cautelas del punto 5.3.
5. **¿El paso 4 es necesario?** Legalmente no: basta con poder activar los avisos en Perfil. Con el código actual sí lo es, porque un mismo interruptor enseña la casilla y la tarjeta de Perfil (ver 4.0).

---

## 2. Qué es cada envío y en qué se basa

| Envío | Qué es | Base legal | Grado |
|---|---|---|---|
| Correo de confirmación de Supabase Auth. Si se marcó la casilla, lleva una línea sobre los avisos. | Correo de servicio. La línea de avisos es la doble confirmación que la propia persona pidió. | RGPD, 6.1.b | [SEGURO] |
| Bienvenida por correo, vía Brevo, a toda cuenta que confirme desde el paso 5 | Correo de servicio, no comercial, **mientras no lleve promoción** | RGPD, 6.1.b (si no, 6.1.f) | Bastante seguro |
| Bienvenida por push, al activar «Notificaciones en este móvil» | Servicio: confirma lo que la persona acaba de activar | RGPD, 6.1.b | [SEGURO] |
| «N fichas nuevas en el radar de RWAdar», por correo y push | **La trato como comunicación comercial de RWAdar** | Consentimiento: LSSI, 21.1, y RGPD, 6.1.a | [INTERPRETABLE]; elijo lo prudente |
| Novedades y actualizaciones de la web y la app (flujo «Avisar novedad») | Comercial si invitan a usar algo. De servicio si son operativas (seguridad, cambio de condiciones). | Consentimiento, porque van por el canal de novedades | [INTERPRETABLE] |
| Tarjeta «Avisos» en Inicio | Contenido del propio servicio, que la persona abre. No es un «envío». | RGPD, 6.1.b | [SEGURO] en lo esencial |
| Pedir el permiso por correo o push a cuentas antiguas | **No se hace** (ver 5.6) | — | — |

**Por qué trato «N fichas nuevas» como comunicación comercial:**
- **Respecto de las plataformas no lo es mientras nadie pague. [SEGURO]** El Anexo f) de la LSSI excluye las comunicaciones sobre bienes o servicios de otro «elaboradas por un tercero y sin contraprestación económica».
- **Respecto de RWAdar mismo, hay argumentos en los dos sentidos. [INTERPRETABLE]**
  - *A favor de que no lo es:* hoy no hay ingresos, y la AEPD dijo que un boletín «limitado a ofrecer noticias» no tenía naturaleza comercial (E/07233/2015).
  - *En contra:* el aviso legal anuncia ingresos previstos: «publicidad dentro de la app» (`rwadar-site/privacidad.html:87-96`). La LSSI incluye los servicios gratuitos «en la medida en que constituyan una actividad económica» (Anexo a). Además, el TJUE calificó de venta directa un boletín enviado a usuarios de una cuenta gratuita (C-654/23 Inteligo Media, 13/11/2025, apdos. 44 y 45).
  - *Mi decisión:* tratarlo como comercial no cuesta nada, porque el diseño ya cumple las reglas más estrictas: consentimiento previo y expreso (art. 21.1), identificación (art. 20.1) y baja en cada correo (art. 22.1).

**El push es un «medio de comunicación electrónica equivalente» al correo (LSSI, art. 21.1). [INTERPRETABLE, pero sólido]**
- La Directiva 2002/58, art. 2.h), define «correo electrónico» como un mensaje que «pueda almacenarse en la red o en el equipo terminal del receptor». FCM guarda los mensajes cuando el móvil está desconectado.
- El TJUE pide una lectura amplia de esa definición (C-102/20 StWL, 25/11/2021).
- La AEPD aplica el art. 21 a los SMS (A/00255/2015) y a WhatsApp (A/00093/2017).
- No he encontrado ninguna resolución ni guía de la AEPD sobre push.
- **El permiso de notificaciones del sistema operativo no es, por sí solo, ese consentimiento**, porque no es específico ni informado. El diseño ya exige además la casilla o el interruptor de Perfil.

**Publicidad financiera. [INTERPRETABLE; riesgo bajo]** Lo más probable es que el aviso **no** sea publicidad de productos de inversión:
- no promueve ningún servicio o instrumento «determinado» (Orden EHA/1717/2010, art. 2);
- no se refiere a la oferta de un criptoactivo concreto (MiCA, arts. 7, 29 y 53);
- no se refiere a una «oferta pública específica» (Reglamento de Folletos, art. 2.k).

El margen de duda está en la Circular CNMV 2/2020, norma 3.1, que habla de «llamar la atención» sobre productos de inversión. El riesgo no está en el aviso, sino en las fichas a las que lleva (ver 5.3).

**Dos datos que corrigen el contrato. [SEGURO]**
- La Circular CNMV 1/2022 sobre publicidad de criptoactivos está **derogada** desde el 28/12/2024 por la Circular 1/2024 (BOE-A-2024-27149). Su advertencia obligatoria ya no se debe copiar.
- Los artículos de publicidad de la Ley 6/2023 son el **246 y el 247**, no el 240.

**Un solo permiso para dos canales y dos tipos de contenido. [INTERPRETABLE]** La LOPDGDD (art. 6.2) lo admite si el texto nombra todas las finalidades, y la casilla las nombra. El EDPB prefiere permisos separados (Directrices 05/2020, §§42-44). Lo acepto como una sola finalidad, «novedades de RWAdar». Si un día entra contenido de terceros o patrocinado, hará falta un permiso nuevo y aparte.

**Academy con cuenta. [SEGURO]**
- Se basa en el contrato (RGPD, 6.1.b).
- Pedir una cuenta para un contenido gratuito no condiciona el permiso de los avisos, que va aparte (RGPD, art. 7.4; LOPDGDD, art. 6.3).
- En protección de datos, Eric **no** es corresponsable (RGPD, art. 26) mientras no decida fines ni acceda a datos de usuarios. Ser coautor del contenido no lo convierte en corresponsable.

---

## 3. Lo que ya se cumple

- **Casilla aparte, sin marcar y no ligada a las condiciones.** La Academy no depende de ella. Está en `rwadar-site/acceso.html:54`, `rwadar-movil/componentes/Cuenta.js:314-321` y `rwadar-movil/lib/avisos-cuenta.js:16-18`. Cumple el RGPD (arts. 4.11, 7.2 y 7.4, considerando 32) y la sentencia Planet49 (TJUE C-673/17). [SEGURO]
- **Edad.** La casilla obligatoria dice «Tengo 18 años o más…» (`acceso.html:52`, `Cuenta.js:9`). Es más estricto que los 14 años de la LOPDGDD (art. 7.1). En un tratamiento de bajo riesgo basta con que la persona declare su edad. [SEGURO]
- **Doble confirmación con barreras.**
  - El permiso solo se guarda al confirmar el correo, con `casilla_activa` encendida y si `confirmation_sent_at` es posterior a `casilla_activada_el` (contrato, «Doble confirmación»).
  - Ayuda a probar el permiso (RGPD, art. 7.1).
- **El permiso queda documentado.**
  - Se guardan `aceptado_el`, `version`, `origen` y `canal`, con la comprobación `permiso_documentado` (`rwadar-app/db/30_avisos_registrados.sql:107-124`).
  - Los textos en español e inglés se guardan con su versión (`30_avisos_registrados.sql:248-262`).
  - Es lo que pide el EDPB (Directrices 05/2020, §108): poder demostrar cómo, cuándo y con qué información se dio el permiso.
- **Las cuentas que ya existen nacen con `novedades = false`** y no reciben la bienvenida. Esta solo se encola en la confirmación. Nadie queda apuntado ni recibe correos solo por existir. No se usa la excepción del art. 21.2 LSSI. [SEGURO]
- **Baja.**
  - Cada correo de avisos lleva el enlace `/baja?t=`, que no exige entrar en la cuenta, más un `mailto:` y la mención de Perfil (`30_avisos_registrados.sql:397-404`). También van en `List-Unsubscribe` (`:919-922`).
  - La baja corta el correo y el push.
  - Cumple el art. 22.1 LSSI, que pide «una dirección de correo electrónico u otra dirección electrónica válida». [SEGURO]
  - Evita el error sancionado en la AEPD A/00015/2019, donde la baja pasaba por entrar en la cuenta.
- **Justo antes de enviar se vuelve a comprobar** que el permiso y la versión siguen vigentes (contrato, «Reparto y envío»).
- **La plantilla del anuncio de ofertas está cerrada.**
  - No nombra productos ni emisores ni da cifras.
  - El enlace solo puede ir a `rwadar.pages.dev` (`30_avisos_registrados.sql:385-388`).
  - Pasa un filtro de palabras (`:151`).
  - Sale como mucho uno al día.
  - `ofertas_automaticas` nace apagado y los anuncios nacen retenidos (`:585-599`).
- **El push no lleva datos personales:** `data` solo contiene `{tipo, destino}` (`:1177-1189`).
- **El titular está identificado** en el aviso legal, con nombre, NIF y domicilio (`privacidad.html:86-100`). Cumple el art. 10.1.a LSSI. [SEGURO]
- **La privacidad ya tiene la sección de avisos,** con su base jurídica (`privacidad.html:379-406`).
- **Los plazos de conservación son proporcionados:** colas 90 días, móviles 180 días, con un reloj diario de limpieza (RGPD, art. 5.1.e).
- **No hay que consultar la lista Robinson**, porque hay consentimiento (LOPDGDD, art. 23.4, párr. 2). [SEGURO]
- **Eric dio su visto bueno** a la Academy con cuenta y a usarla como reclamo del alta (`docs/academy/VISTO-BUENO-ERIC-2026-11-06.md`). El 06/11 Víctor confirmó que ya hay permiso por escrito; el original lo guarda él, fuera de Git (ver 5.14).

---

## 4. Cambios obligatorios antes de activar

### 4.0 Orden de los pasos y «¿hace falta el paso 4?»

**Paso 3 (aplicar la 30).** No depende de esta revisión y se puede hacer ya. Lo más limpio es aplicarla una sola vez, con estos cambios ya dentro:
- 4.1, la versión v2 de la casilla;
- 4.5, el historial del permiso;
- 4.8, los textos de la bienvenida;
- 4.9, el pie de los correos.

Si se aplica antes, se **reaplica la 30 corregida antes del paso 4**. Reaplicarla vuelve todo al estado de instalación y no borra filas (`30_avisos_registrados.sql:246-262`).

**¿El paso 4 es necesario?**
- **Legalmente no.** El permiso se puede pedir solo en Perfil, que ya exige una sesión confirmada. Lo único prohibido es apuntar a alguien por registrarse (LSSI, art. 21.1).
- **En la práctica sí, con el código de hoy.** El mismo interruptor, `AVISOS_NOVEDADES_REMOTOS`, enseña la casilla del alta **y** la tarjeta de Perfil. Sin el paso 4 nadie puede apuntarse. La bienvenida del paso 5 sí sale igual.
- **Hay dos opciones válidas:**
  - **(a)** Hacer el paso 4 como está diseñado, con los cambios de abajo. Es lo que recomiendo, porque ya está construido y probado.
  - **(b)** Separar el interruptor y dejar solo Perfil. Esto evita tocar la plantilla de Auth y la lógica de doble confirmación, pero hay que cambiar código.

### A. Antes del paso 4 (casilla visible)

**4.1 Texto de la casilla: versión `novedades-v2-2026-11-06`.**

*Por qué:*
- «Puedes darte de baja en cada aviso» no es cierto ni para el push ni para la tarjeta de Inicio, que no llevan baja. La información sobre cómo retirar el permiso tiene que ser exacta (RGPD, arts. 7.3, 12.1 y 13.2.c).
- «Ofertas nuevas» pasa a «fichas nuevas», para que coincida con el asunto real. Así no parece que RWAdar envíe ofertas de inversión (Ley de Competencia Desleal, art. 5; Circular 2/2020, norma 3.1).

*Texto nuevo:*
- **ES:**
  > Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.
- **EN:**
  > I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: new listings on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your phone settings. More information in Privacy.

*Dónde se cambia:*
- Base de datos: `rwadar-app/db/30_avisos_registrados.sql:253-255` y su copia `rwadar-app/supabase/migrations/20261105200000_avisos_registrados.sql`, más `rwadar-app/db/30_avisos_registrados_verificar.sql`.
- Web: `rwadar-site/acceso.html:53-54` (comentario y etiqueta), `rwadar-site/index.html`, `rwadar-site/assets/rwadar-20260820.js` y `rwadar-site/assets/idioma-en-20261022.js`.
- App: `rwadar-movil/lib/avisos-cuenta.js:16-18`, `rwadar-movil/lib/idioma-en.js` y `rwadar-movil/App.js`.
- Pruebas: `rwadar-app/probar-avisos-registrados.mjs`, `rwadar-acceso/alta-avisos-navegador.test.mjs`, `rwadar-acceso/perfil-avisos-navegador.test.mjs` y `rwadar-movil/tests/avisos-cuenta.test.cjs`.
- Privacidad: el código de versión en `privacidad.html:390`.
- `rwadar-publicado/` se regenera al sellar.

*Además:*
- En la web, «Privacidad» pasa a ser un enlace: `Más información en <a href="/privacidad#avisos-novedades">Privacidad</a>.` El texto visible no cambia.
- `rwadar-movil/componentes/AvisosNovedades.js:38` (`novedadesOn`) pasa a:
  > Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.

**4.2 Información básica junto a las casillas.**

*Por qué:* para que el permiso sea informado, hay que decir al menos quién es el responsable, para qué se usan los datos, qué datos y que se puede retirar (EDPB, Directrices 05/2020, §64). La LOPDGDD (art. 11.2) fija ese mínimo: responsable, finalidad y derechos, con un acceso «sencillo e inmediato» al resto. Hoy el formulario no dice quién es el responsable ni menciona el identificador del móvil.

*Cómo:* el bloque va **fuera** del texto versionado de la casilla, así que cambiarlo no exige una versión nueva.

*Dónde:*
- web: `rwadar-site/acceso.html`, después de la línea 54, visible solo en la vista de alta;
- app: `Cuenta.js`, después de la línea 321.

*Texto:*
- **ES:**
  > Información básica sobre tus datos. Responsable: Víctor Manuel Jorques Granero (RWAdar). Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos; en el móvil, si activas las notificaciones, se usa además un identificador de entrega. Base: el servicio que pides (cuenta) y tu consentimiento (avisos). Proveedores: Supabase, Cloudflare, Google, Brevo y Expo; algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, y retirar el permiso, en Perfil o en RWAdar@protonmail.com; también puedes reclamar ante la AEPD. Más información en [Privacidad](/privacidad).
- **EN:**
  > Basic information about your data. Controller: Víctor Manuel Jorques Granero (RWAdar). Purpose: your account, which also opens the Academy, and, only if you tick the notices box, sending you those notices; on your phone, if you turn on notifications, a delivery identifier is also used. Legal basis: the service you request (account) and your consent (notices). Providers: Supabase, Cloudflare, Google, Brevo and Expo; some process data outside the EU with safeguards. Rights: access, rectification, erasure, objection, restriction and portability, and withdrawing consent, in Profile or at RWAdar@protonmail.com; you can also complain to the AEPD (Spanish Data Protection Agency). More information in Privacy.

**4.3 «Leer condiciones» en la app da 404. Es un fallo que ya existe hoy.**

*Por qué:* la casilla obligatoria dice «acepto las condiciones».
- Unas condiciones que no se han podido leer no quedan incorporadas al contrato (Ley 7/1998, art. 7.a).
- La LSSI (art. 27.4) obliga a ponerlas a disposición antes de contratar.
- Comprobado hoy: `https://rwadar.pages.dev/condiciones` responde 404.

*Cambios:*
- `rwadar-movil/componentes/Cuenta.js:8`: `const CONDICIONES = 'https://rwadar.pages.dev/privacidad#condiciones';`
- Para los APK antiguos, en `rwadar-site/_redirects` (como ya se hace con `/privacidad.html`): `/condiciones  /privacidad#condiciones  301`. Después, comprobar con `curl` que responde 301.
- Actualizar la prueba correspondiente en `rwadar-movil/tests/cuentas-ui.test.cjs`.

**4.4 Plantilla de confirmación de Supabase Auth.**

*Por qué:* hoy dice «Si no lo pediste, no confirmes…». Eso empuja a renunciar a la cuenta para no recibir avisos. Entre los pasos 4 y 5 tampoco existe aún ese «primer correo» con baja. La información tiene que ser clara y cierta (RGPD, art. 12.1).

*Dónde:* `rwadar-app/plantillas-auth/confirmar-alta.html:7`. Cambia el contenido dentro de `{{ if .Data.avisos_novedades }}`.

*Texto nuevo:*
> Marcaste también la casilla de avisos de novedades: al confirmar tu correo quedarán activados. Si solo querías la cuenta, confírmala igualmente y desactívalos en Perfil.

**4.5 Historial del permiso, solo de añadir.**

*Por qué:* hay que poder demostrar que había permiso **en la fecha de cada envío** (RGPD, arts. 7.1 y 5.2; EDPB, Directrices 05/2020, §108). Hoy `configurar_avisos_novedades` sobrescribe `aceptado_el` y pone `baja_el = null` al reactivar (`30_avisos_registrados.sql:1399-1407`).

*Ejemplo del problema:*
1. Alta el 1 de enero.
2. Envío el 10.
3. Baja el 15.
4. Nueva alta el 1 de febrero.

El registro dirá «aceptado el 1 de febrero», y el envío del día 10 parecerá hecho sin permiso.

*Cambio en la 30:*
```sql
create table if not exists rwadar_novedades.historial_permiso (
  id         bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  accion     text not null check (accion in ('alta', 'baja')),
  version    text,
  origen     text not null check (origen in ('alta', 'perfil', 'enlace', 'correo')),
  canal      text check (canal in ('web', 'app')),
  creado_el  timestamptz not null default now()
);
```

*Reglas:*
- Mismos `revoke` que el resto del esquema.
- Se añade una fila en estos casos:
  - en el disparador de confirmación (`alta`/`alta`);
  - en `configurar_avisos_novedades`, solo si el estado cambia (`perfil`);
  - en `baja_avisos` (`enlace`);
  - en la baja manual por correo (4.11, `correo`).
- `limpiar()` no la toca.
- Prueba: alta, baja y alta dejan 3 filas.

**4.6 Privacidad: textos del paso 4.** Todos en `rwadar-site/privacidad.html`.

- **`:51`:** poner la fecha del día de publicación.
- **`:62-64`:**
  > Solo te enviamos los correos necesarios para confirmar la dirección y recuperar la contraseña. Ya puedes pedir los avisos de novedades, pero todavía no se envían. <b>Las opiniones y los avisos push siguen en pausa.</b>
- **`:77-78`:**
  > Las opiniones y el push están en pausa; los avisos de novedades se pueden pedir, pero aún no se envían.
- **`:236`:** cambiar «No se usa para publicidad ni boletines.» por:
  > Solo se usa para avisos de novedades si los pides (apartado 6).
- **Fila nueva después de `:279`** (la fila antigua `correo-v1-2026-08-22` se queda):
  - **Dato:** «Avisos de novedades (opcional)».
  - **Para qué:** «Si los pides: el permiso, su fecha, la versión del texto aceptado, si lo diste en la web o en la app, el historial de altas y bajas y un código aleatorio para el enlace de baja».
  - **Base jurídica:** «Tu consentimiento (art. 6.1.a RGPD y art. 21 de la Ley 34/2002)».
- **`:380-382`:**
  > <b>Ya puedes pedirlos</b> al crear la cuenta o en Perfil, pero todavía no se envían. Cuando empecemos, actualizaremos esta política y su fecha. Funcionan así:
- **`:384-385`:**
  > <b>Qué son:</b> avisos de RWAdar por correo y, si los activas en tu móvil, como notificaciones: como mucho un aviso de fichas nuevas al día, que dice cuántas han entrado sin nombrar productos ni emisores y con un aviso de riesgo, y novedades de la web y la app.
- **`:390`:** `novedades-v2-2026-11-06`.
- **`:391-393`:**
  > <b>Baja:</b> cada correo de avisos lleva un enlace para darte de baja, que no exige entrar en tu cuenta, y la dirección RWAdar@protonmail.com, donde basta con escribir «baja». También puedes desactivarlos en Perfil y quitar las notificaciones en los ajustes del móvil. La baja corta a la vez los correos y las notificaciones de novedades.

  Esto cumple la obligación de informar sobre los procedimientos de baja (LSSI, art. 22.1, párr. 3).
- **`:401-403`:**
  > <b>Conservación:</b> el permiso y el historial de altas y bajas, mientras exista la cuenta, para poder demostrar cuándo lo diste y cuándo lo retiraste; los registros de cada envío, 90 días después de terminar; los móviles que no se actualicen en 180 días se borran. Al borrar la cuenta se borra todo lo anterior; los proveedores conservan sus registros técnicos durante sus propios plazos (apartado 9).

  Si se adopta la recomendación 5.1, este texto cambia.
- **Viñeta nueva** en la misma lista:
  > <b>Tarjeta Avisos:</b> en la app, la tarjeta «Avisos» de Inicio muestra a cualquier cuenta los avisos publicados y la bienvenida; no es un envío ni necesita la casilla. Qué avisos has leído se guarda solo en tu móvil.
- **`:537-545`**, añadir a «Datos locales»:
  > En la web, al crear la cuenta desde una lección, el navegador guarda durante 24 horas a qué lección volver; se borra al usarlo.

  Es un dato exento de consentimiento (LSSI, art. 22.2, párr. 3), pero la AEPD recomienda informar también de lo exento.
- **`:566-567`:**
  > se eliminan en el momento la cuenta, el perfil, la lista de seguimiento y lo relativo a los avisos (permiso, historial, móviles registrados y colas de envío).
- **`:593`:**
  > Las funciones de comunidad permanecen en pausa; los avisos de novedades se pueden pedir, pero aún no se envían.
- **Frases de la app y la web.** Cambiar también las que lista la tabla del contrato («Al mostrar la casilla»). Antes hay que comprobar sus números de línea: los de `privacidad.html` en esa tabla ya no corresponden.

### B. Antes del paso 5 (correo)

**4.7 `/baja` publicada.** Hoy `https://rwadar.pages.dev/baja` responde 404 porque está en la rama sin publicar. Ningún correo de avisos puede salir sin una dirección de baja que funcione (LSSI, art. 22.1: «quedando prohibido el envío de comunicaciones que no incluyan dicha dirección»). [SEGURO]

**4.8 Textos de la bienvenida** (`30_avisos_registrados.sql:356-365`, en HTML y en texto plano).

*Por qué:*
- «Te escribiremos cuando haya ofertas nuevas» promete algo que no está garantizado, porque los anuncios nacen retenidos.
- Usa «ofertas» cuando la casilla v2 dice «fichas».
- Un correo de servicio debe quedarse sin tono promocional (Inteligo, apdo. 44).
- «Escríbenos o bórrala» no sirve a quien no creó la cuenta.

*Textos nuevos:*
- **Párrafo para quien se apuntó:**
  > Además, te has apuntado a los avisos de novedades: te avisaremos de las fichas nuevas que entren en el radar y de las novedades de la web y la app. Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.
- **Cierre en HTML:**
  `Si no creaste esta cuenta, <a href="mailto:RWAdar@protonmail.com" style="color:#0F7A57">escríbenos</a> y la borramos.`
- **Cierre en texto:**
  > Si no creaste esta cuenta, escríbenos a RWAdar@protonmail.com y la borramos.
- El asunto («Te damos la bienvenida a RWAdar») no cambia.

**4.9 Pie de los correos: nombre del titular** (`30_avisos_registrados.sql:390-396`). [INTERPRETABLE; lo exijo por prudencia, porque cuesta una línea]

*Por qué:* el art. 20.1 LSSI exige que sea «claramente identificable» la persona física en cuyo nombre se envía. «RWAdar» es una marca, no una persona. Con el enlace al aviso legal probablemente basta, pero con el nombre queda cerrado.

*Cambios:*
- **HTML:**
```sql
v_pie := '<p style="margin:0 0 8px">Te escribe RWAdar, un radar independiente de plataformas de '
  || 'tokenización. Responsable: Víctor Manuel Jorques Granero, España '
  || '(<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a>'
  || ' · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>'
  || '<p style="margin:0 0 8px">' || v_motivo || '</p>';
```
- **Texto plano:** la primera línea pasa a «Te escribe RWAdar, un radar independiente de plataformas de tokenización. Responsable: Víctor Manuel Jorques Granero, España.» Las líneas siguientes no cambian.

**4.10 Brevo sin píxel ni seguimiento de clics, comprobado.**

*Por qué:*
- Un píxel de apertura o un enlace reescrito para seguir clics accede al dispositivo del usuario y necesita consentimiento (LSSI, art. 22.2; EDPB, Directrices 2/2023).
- La privacidad promete «sin píxel» (`:394-395`).
- Comprobado hoy en el registro de cambios de Brevo del 21/07/2026: `contactPixelTrackingConsent: false` solo hace que la apertura «is anonymized». **No quita el píxel.**

*Qué hacer:*
- Desactivar en la cuenta de Brevo el seguimiento de aperturas y de clics de los correos transaccionales. Esto ya está previsto en el paso 5.
- En la prueba del paso 5 (punto 3), abrir el original del mensaje y comprobar dos cosas: que no hay ningún `<img>` y que los enlaces apuntan directamente a `rwadar.pages.dev`.
- **Si Brevo no deja quitarlos, no basta con borrar la promesa de la privacidad:** el píxel seguiría necesitando su propio consentimiento. En ese caso no se activa el paso 5 con Brevo. [INTERPRETABLE en el detalle técnico; el riesgo es claro]

**4.11 Bajas que lleguen por correo.**

*Por qué:* la LSSI (art. 22.1) dice que basta «la simple notificación de su voluntad al remitente». Un correo o una respuesta que diga «baja» vale. Seguir enviando después de una baja ya se ha sancionado (AEPD PS/00311/2023, 10.000 €).

*Procedimiento, que se anota en `docs/RUNBOOK.md`:*
- Mientras haya avisos activos, Víctor revisa RWAdar@protonmail.com al menos dos veces por semana.
- Cada baja se aplica antes del siguiente envío, con una función nueva solo para el propietario: `rwadar_novedades.baja_por_correo(p_email text)`. Pone `novedades = false` y `baja_el = now()`, y añade la fila `baja`/`correo` en el historial (4.5).
- Se responde «Hecho: ya no recibirás avisos de RWAdar» y se anota la fecha.

**4.12 Privacidad: textos del paso 5.** Todos en `privacidad.html`.

- **`:62-64`:**
  > Te enviamos los correos de servicio de tu cuenta: para confirmar la dirección, para recuperar la contraseña y una bienvenida al confirmarla. Los avisos de novedades solo te llegan si los pides. <b>Las opiniones y los avisos push siguen en pausa.</b>
- **`:77-78`:**
  > Las opiniones y el push están en pausa.
- **`:234-236`:**
  > Identificar tu cuenta, con la que también abres las lecciones de RWAdar Academy, enviarte el correo para confirmarla, una bienvenida cuando la confirmas y, si lo pides, el enlace para poner una contraseña nueva. Solo se usa para avisos de novedades si los pides (apartado 6).
- **`:365-369`:**
  > Si creas una cuenta te enviamos <b>un correo para confirmar la dirección</b> y, si pides recuperar el acceso, <b>otro con un enlace para poner una contraseña nueva</b>; salen del servicio de autenticación de Supabase a través de una cuenta de Gmail de RWAdar (apartado 8). Al confirmar la cuenta te enviamos además <b>un correo de bienvenida</b>, a través de Brevo. Son correos de servicio, necesarios para tu cuenta (art. 6.1.b RGPD), y no llevan publicidad. Ninguno te pedirá contraseñas, datos bancarios ni claves.
- **`:370-377`:** sustituir los dos párrafos por:
  > La preferencia de correo de versiones anteriores (<code>correo-v1-2026-08-22</code>) no activa ningún envío. Puedes retirarla escribiendo al correo de privacidad.
- **`:380-382`:**
  > <b>Están activos por correo.</b> Las notificaciones en el móvil llegarán con Android 1.4.2. Funcionan así:

  Además, pasar las viñetas a presente: «Brevo envía…», «cada correo lleva…». La viñeta «Sin seguimiento» se mantiene **solo** si se ha comprobado lo del punto 4.10.
- **`:488-489`:**
  > <b>Brevo</b> (Francia) — envía la bienvenida a cada cuenta confirmada y los avisos de novedades a quien los pide. Recibe tu dirección de correo y el contenido del mensaje; no recibe tu nombre. Actúa como encargado del tratamiento con su contrato de encargo. Guarda los datos en la UE; algunas filiales y subencargados fuera de la UE pueden acceder a ellos con cláusulas contractuales tipo o el Marco de Privacidad de Datos UE-EE. UU.

  Hoy esa viñeta dice que Brevo recibiría «el nombre si existe», y el código no lo envía (`30_avisos_registrados.sql:935-936`).
- **`:502-504`:** añadir a Brevo en la frase «Para Cloudflare, Netlify, Supabase y Expo se han identificado los mecanismos…».

**4.13 Registro de actividades de tratamiento y contratos de encargo.**

*Por qué:*
- El registro es obligatorio aunque no haya empleados, porque el tratamiento no es ocasional (RGPD, art. 30.5; LOPDGDD, art. 31). No tenerlo es una infracción (LOPDGDD, art. 73).
- No está en el repositorio, y la propia privacidad lo da por existente (`:533`).
- Los contratos de encargo deben constar por escrito, también en formato electrónico (RGPD, art. 28.9).

*Qué hacer:*
- Crear `docs/legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`, con los campos del art. 30.1 para cada actividad:
  - cuentas;
  - acceso a la Academy;
  - bienvenida;
  - avisos de novedades;
  - consultas de empresas;
  - seguridad y registros;
  - actualizaciones de la app.
- Guardar en PDF, con su fecha, los contratos de encargo aceptados de Supabase, Cloudflare, Brevo, Expo y Google (Firebase), en `docs/legal/encargados/`.

### C. Antes del paso 6 (push)

**4.14 Privacidad: textos del paso 6.** Todos en `privacidad.html`.

- **`:355-358`:**
  > Desde Android 1.4.2, si activas «Notificaciones en este móvil», guardamos en tu cuenta su identificador de notificaciones, la plataforma y las fechas (hasta cinco móviles), para enviarte una bienvenida y, si tienes activados los avisos, las novedades. Se borra al desactivarlas, al cerrar sesión con conexión, al borrar la cuenta o tras 180 días sin usar la app. Puedes quitar el permiso en los ajustes del móvil.
- **`:490-495`:** mantener lo de las actualizaciones de la app y añadir:
  > Desde Android 1.4.2, si activas las notificaciones, Expo (650 Industries, EE. UU.) y Firebase Cloud Messaging de Google reciben el identificador de notificaciones del móvil y el contenido del aviso, nunca tu correo. Expo actúa como encargado con cláusulas contractuales tipo; Expo y Google LLC están adheridas al Marco de Privacidad de Datos UE-EE. UU.
- **`:502-506`:** incluir a Google entre los mecanismos identificados y borrar las dos frases sobre «antes de activar las notificaciones push» y «mientras la entrega automática siga desactivada».
- **`:528-531`:**
  > <b>Instalaciones y tokens push:</b> desde Android 1.4.2 se registran solo si activas las notificaciones; los que no se renuevan en 180 días se borran con un proceso diario. Este proceso no borra cuentas ni sustituye la atención de una solicitud de derechos.

**4.15 Texto del interruptor del móvil** (`AvisosNovedades.js:195`).

*Por qué:* hoy dice «se borra al desactivarlas o al cerrar sesión». Sin conexión no es cierto (contrato, «Cerrar sesión sin conexión»). La información tiene que ser exacta (RGPD, art. 13).

*Texto nuevo:*
> Al activarlas, el sistema te pedirá permiso. Guardamos en tu cuenta un identificador de este móvil para entregarte las notificaciones (lo reciben Expo y Google). Se borra al desactivarlas, al cerrar sesión con conexión, al borrar la cuenta o tras 180 días sin usar la app.

**4.16 Cómo darse de baja desde un push.** [INTERPRETABLE; lo pongo como condición porque es barato]

*Por qué:* el art. 22.1 LSSI solo exige una «dirección» en cada envío para el correo. Para el push basta un procedimiento sencillo y gratuito. Pero si el push se lee como «correo electrónico» en el sentido de la Directiva, cada aviso debería llevar a ese procedimiento.

*Qué hacer:* en el destino al que lleva el push (tarjeta «Avisos» de Inicio), añadir debajo de los avisos el enlace:
> ¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.

El enlace abre directamente el interruptor.

### D. Asuntos y push: qué no cambia y la decisión sobre «Publi»

**Asuntos que no cambian:**
- Bienvenida: «Te damos la bienvenida a RWAdar».
- Anuncio de ofertas: «N fichas nuevas en el radar de RWAdar». En singular: «1 ficha nueva en el radar de RWAdar».
- El título del push es el mismo que el asunto.
- La etiqueta del correo («RWAdar · aviso de novedades») y la línea de motivo («Recibes este aviso porque te apuntaste…») ya identifican la naturaleza del mensaje y quién lo envía (LSSI, art. 20.1).

**Decisión: no se pone «Publi» ni «Publicidad», ni en el asunto ni en el push. Razones:**
1. **La ley ya no lo pide. [SEGURO]** El art. 20.1 LSSI vigente, en vigor desde el 11/05/2014, solo exige que la comunicación sea «claramente identificable como tal» y que se identifique a quien la envía. La Ley 9/2014 (disposición final 2.ª, apartado 3) suprimió la obligación de poner «publicidad» o «publi» al comienzo. Lo he comprobado en el historial de versiones del BOE.
2. **Se identifica de otra forma.** La identificación ya la dan el remitente, la etiqueta y el motivo. En el push, el sistema muestra además el nombre de la app.
3. **Sería engañoso.** Poner «Publicidad» haría pensar que una plataforma paga, justo lo contrario del aviso fijo «Nadie paga por aparecer en este aviso» (Ley de Competencia Desleal, art. 5).
4. **Aumentaría el riesgo financiero.** Reforzaría la lectura de que el aviso «llama la atención» sobre productos de inversión (Circular 2/2020; según su anexo I.4, si quien ofrece el producto paga la difusión, es publicidad «en todo caso»).
5. **Cuándo se revisa.** Si algún día un espacio o una ficha está pagada, ese contenido se marca como «Publicidad» o «Patrocinado» (LSSI, art. 20.1; Ley de Competencia Desleal, art. 26) y se hace una revisión aparte.

---

## 5. Recomendaciones no obligatorias

**5.1 Conservar bloqueado el historial del permiso tras borrar la cuenta.** [INTERPRETABLE]
- La LOPDGDD (art. 32) obliga a **bloquear** los datos al suprimirlos, solo para jueces y la AEPD y durante el plazo de prescripción.
- Una infracción muy grave por permiso inválido prescribe a los 3 años (LOPDGDD, art. 72.1.c). En la LSSI, a los 2 años las graves y a los 6 meses las leves (art. 45).
- Propuesta: quitar el `on delete cascade` de `historial_permiso`, guardar el correo para poder identificar a la persona, no darle ningún otro uso y borrarlo a los 3 años.
- Si se hace, hay que cambiar la frase «Al borrar la cuenta se borra todo» (4.6).

**5.2 Guardar el idioma del texto mostrado** (`es`/`en`) en el historial. Así se acredita qué texto exacto vio la persona (EDPB, Directrices 05/2020, §108).

**5.3 Fichas y enlace del aviso. Lo pongo como condición antes del paso 7 o de publicar a mano un anuncio de ofertas.** [INTERPRETABLE; riesgo bajo]
- *El enlace:* que siga yendo solo a RWAdar. Mejor aún, a una vista con solo las fichas nuevas y el aviso de riesgo arriba. Nunca a una ficha concreta ni a la plataforma, y sin parámetros de seguimiento ni de afiliación.
- *Los botones hacia las plataformas:* en las fichas donde «Se contrata hoy desde España» no sea «Sí» o donde el emisor no esté supervisado (por ejemplo, `rwadar-site/ofertas/mtbill.html`), cambiar «Ver oferta en X ↗» por un enlace a la documentación oficial o al registro del supervisor. Si se mantiene, ponerlo después de los avisos, con el texto «Ir a la web del proveedor (sales de RWAdar)». Motivo: según las directrices de ESMA sobre solicitud inversa en MiCA, llevar al público a la web de una empresa de fuera de la UE es un indicio de actuar por cuenta de ella.
- *Las rentabilidades:* no mostrar rendimientos de 7 días («7D APY») o mostrarlos con periodo, fuente y la frase «Las rentabilidades pasadas no son un indicador fiable» (Circular 2/2020, anexo II).
- *La sección «Puntos fuertes»:* cambiarla por «Datos comprobados a favor».
- *El número N:* que sea exacto y cuente solo fichas aprobadas en el ciclo, después de comprobar la lista de advertencias de la CNMV y, en criptoactivos, el registro MiCA.

**5.4 Poner el aviso de riesgo delante en el texto fijo de ofertas** (`30_avisos_registrados.sql:594-596`). Android corta el cuerpo del push, y hoy el riesgo aparece en la segunda frase. Texto propuesto, que pasa el filtro de palabras:
> Información, no recomendación: aparecer en el radar no es un respaldo y puedes perder lo invertido. RWAdar no intermedia y nadie paga por aparecer en este aviso. Consulta en el radar qué ha entrado y con qué fuentes.

**5.5 Ampliar el filtro de palabras de los anuncios** (`:151`). Añadir: «rendimiento», «APY», «APR», «sin riesgo», «exclusiv», «últimas plazas», «no te lo pierdas», «gana», «regalo», «bono», «descuento» y «autorizad». Así se evitan mensajes que creen urgencia o den impresión de respaldo (Ley de Competencia Desleal, art. 5).

**5.6 No pedir el permiso por correo ni por push a las cuentas antiguas.**
- La AEPD dijo lo contrario de lo que afirma el contrato: un correo que solo pide el consentimiento «no tiene naturaleza comercial» (E/01415/2017).
- Aun así, el regulador británico (ICO) multó a Flybe y a Honda en 2017 por hacerlo, y el criterio español se basa en un único archivo anterior al RGPD.
- Invitar desde Perfil o desde la tarjeta de Inicio.

**5.7 Los avisos de servicio obligatorios no van por el canal de novedades.** Los cambios de condiciones o de privacidad y los incidentes de seguridad (RGPD, art. 34) tienen que llegar a todas las cuentas, sin promoción. Hoy no existe ese canal: se decide cuando haga falta.

**5.8 Pasar el SMTP de Supabase Auth a Brevo** cuando haya dominio propio. Hoy los correos de Auth salen por una cuenta de consumo de Gmail (`rwadares@gmail.com`), que no tiene contrato de encargo. [INTERPRETABLE]

**5.9 `rwadar.alta.volver` en el navegador.** Hoy solo se borra al volver de la confirmación (`rwadar-site/assets/acceso.js:20`, `:161`). Hay que borrarlo también al caducar, en cualquier carga de la página (RGPD, art. 5.1.e).

**5.10 «Baja» se usa para dos cosas: borrar la cuenta y dejar los avisos.**
- `rwadar-movil/componentes/Cuenta.js:258` debería decir:
  > Borrar la cuenta elimina tu perfil, tu lista de seguimiento y tus avisos (permiso y móviles registrados). No borra los favoritos locales ni el progreso de Academy. No se puede deshacer.
- Hay que revisar igual el resto de textos del borrado.

**5.11 Unificar el asunto de la baja por correo.** `baja.html:25` y `assets/baja-20261105.js` usan «baja». El pie y `List-Unsubscribe` usan `subject=Baja%20de%20los%20avisos%20de%20RWAdar`. El buzón debe aceptar cualquiera de los dos.

**5.12 Push de bienvenida** (`30_avisos_registrados.sql:1185`). El texto actual puede hacer creer a quien no pidió novedades que las recibirá. Texto propuesto:
> Notificaciones activadas en este móvil. Las de novedades solo llegan si las tienes activadas en Perfil.

**5.13 Más cosas de la privacidad:**
- Expo se reserva actuar como responsable para datos agregados o anonimizados (sus condiciones, §3.2).
- Firebase y Brevo conservan sus propios registros técnicos.
- En el manual PDF (`docs/manual/`) desaparecen «baja en un clic» y los avisos «cuando una plataforma que vigila cambie» antes de difundirlo. Hoy no está publicado.

**5.14 Licencia de Eric, por escrito.**
- Toda cesión de derechos de autor se formaliza por escrito (TRLPI, art. 45). Si no se fija plazo, se limita a 5 años; si no se fija territorio, al país donde se hace (art. 43.2).
- Basta un correo suyo, que se archiva en `docs/academy/`, con un texto como:
  > Autorizo a Víctor Manuel Jorques Granero a publicar gratis, sin exclusiva y para todo el mundo, las 9 lecciones de RWAdar Academy de las que soy autor, con mi nombre, en rwadar.pages.dev y en la app RWAdar, también solo para cuentas registradas y como reclamo del registro, hasta que lo revoque por escrito con un mes de aviso.

**5.15 Correcciones al contrato** (`docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md`):
- **`:82`:** cambiar «Según la AEPD, pedir el permiso por correo ya es comunicación comercial» por:
  > Por prudencia: la AEPD (E/01415/2017) no lo consideró comercial, pero el ICO británico sí, y mezclarlo con la bienvenida la volvería comercial.
- **`:181-182`:** cambiar por:
  > No se pone «Publi»: el art. 20.1 LSSI no lo exige desde la Ley 9/2014. Si algún día hay contenido pagado, se marca como publicidad (LSSI 20.1, LCD 26).
- **`:610-614` («Abogado»):** remitir a este documento.
- Actualizar el texto de la casilla a v2 y los números de línea de la tabla «Frases que dejan de ser ciertas».

**5.16 Antes de cobrar nada, revisión aparte.**
- Cualquier pago de una plataforma, AdMob o afiliación cambia el análisis.
- Una **comisión por contratación** es captación de clientes, una actividad reservada (Ley 6/2023, art. 129; CNMV, preguntas y respuestas sobre MiFID II, pregunta 22.2).
- Los anuncios de servicios de inversión dentro de la app obligan a las comprobaciones del art. 246.3 de la Ley 6/2023.
- La frase «Nadie paga por aparecer» deja de poder usarse tal cual.

**5.17 Copia de cada anuncio.** La tabla `anuncios` no la limpia `limpiar()`. Basta con no borrarla, para conservar al menos 6 meses el texto, la fecha, N y la revisión de cada anuncio. Así se puede responder a un posible requerimiento de la CNMV (Orden EHA/1717/2010, art. 6).

---

## 6. Lo que conviene confirmar con un profesional

Ninguna de estas dudas bloquea la activación. Todas afectan a escenarios que hoy no se dan o tienen un riesgo bajo.

- **Si RWAdar ejerce una «actividad económica».** Afecta al art. 20 LSSI y a la Ley General de Publicidad, y depende del modelo de ingresos. Hoy el diseño ya lo trata como comercial. Hay que revisarlo antes de cobrar nada.
- **Publicidad financiera.** Si el conjunto «aviso + ficha + botón hacia la plataforma» podría considerarse publicidad (Circular 2/2020, norma 4.1.i, «cualquier entidad») o una solicitud por cuenta de empresas de fuera de la UE (ESMA). Si se quiere certeza, se puede consultar por escrito a la CNMV, que tiene un canal para proyectos fintech.
- **El push como «medio equivalente».** No hay ningún criterio publicado de la AEPD. El diseño ya pide el permiso, así que en la práctica no cambia nada.
- **Detalles de los proveedores:**
  - qué entidad de Brevo firma el contrato;
  - si Firebase exige aceptar sus condiciones de tratamiento en la consola;
  - el estado del recurso contra el marco UE-EE. UU. El Tribunal General desestimó el recurso Latombe (T-553/23) el 03/09/2025. La casación (C-703/25 P) no la he podido confirmar en CURIA.

  Si ese marco cayera, Expo, Google, Brevo y Cloudflare ofrecen también cláusulas tipo.
- **Las condiciones generales de la cuenta.** No las he revisado frente a la Ley 7/1998 ni frente a la normativa de consumidores.
- **Fuentes que no pude leer directamente:**
  - la sentencia Inteligo, que leí en ipcuria.eu porque CURIA bloqueó la descarga;
  - las multas del ICO, que salen de fuentes secundarias porque su web devolvió 403;
  - la guía de la CNMV para finfluencers y las preguntas y respuestas de la CNMV sobre MiCA (15/12/2025), que no he leído completas.
- **Qué podría pasar si algo fallara.** Lo sanciona la AEPD (LSSI, art. 43.1). Enviar sin permiso es una infracción leve, hasta 30.000 € (arts. 38.4.d y 39.1.c). Si el envío es masivo o insistente, es grave: de 30.001 a 150.000 € (art. 38.3.c). Con el diseño actual y los cambios del apartado 4, no veo un escenario realista que llegue ahí.

---

## 7. Fuentes

**Normas españolas (BOE)**
- LSSI-CE, Ley 34/2002, texto consolidado (arts. 10, 19-22, 27, 38, 39, 43, 45 y Anexo): https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Ley 9/2014, disposición final 2.ª, que reescribe el art. 20.1 LSSI: https://www.boe.es/buscar/doc.php?id=BOE-A-2014-4950
- LOPDGDD, Ley Orgánica 3/2018 (arts. 6, 7, 11, 23.4, 31, 32, 72 y 73): https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- Ley 3/1991, de Competencia Desleal (arts. 5 y 26): https://www.boe.es/buscar/act.php?id=BOE-A-1991-628
- Ley 34/1988, General de Publicidad (art. 2): https://www.boe.es/buscar/act.php?id=BOE-A-1988-26156
- Ley 7/1998, de Condiciones Generales de la Contratación (art. 7): https://www.boe.es/buscar/act.php?id=BOE-A-1998-8789
- Texto refundido de la Ley de Propiedad Intelectual (arts. 43 y 45): https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
- Ley 6/2023, de los Mercados de Valores (arts. 129, 246, 247 y 290): https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053
- Orden EHA/1717/2010: https://www.boe.es/buscar/act.php?id=BOE-A-2010-10314
- Circular CNMV 2/2020: https://www.boe.es/buscar/act.php?id=BOE-A-2020-14107
- Circular CNMV 1/2024, que deroga la 1/2022: https://www.boe.es/buscar/doc.php?id=BOE-A-2024-27149

**Normas de la Unión Europea**
- RGPD, Reglamento (UE) 2016/679: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
- Directiva 2002/58/CE (art. 2.h y art. 13): https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058
- MiCA, Reglamento (UE) 2023/1114: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1114 (copia del DOUE: https://www.boe.es/doue/2023/150/L00040-00205.pdf)
- Reglamento de Folletos, (UE) 2017/1129: https://www.boe.es/doue/2017/168/L00012-00082.pdf
- Decisión 2021/914, cláusulas contractuales tipo: https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj
- Decisión 2023/1795, marco UE-EE. UU.: https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj

**Tribunal de Justicia de la UE**
- C-673/17 Planet49: https://curia.europa.eu/juris/liste.jsf?num=C-673/17
- C-61/19 Orange România: https://curia.europa.eu/juris/liste.jsf?num=C-61/19
- C-102/20 StWL: https://curia.europa.eu/juris/liste.jsf?num=C-102/20 (comunicado: https://curia.europa.eu/jcms/upload/docs/application/pdf/2021-11/cp210210es.pdf)
- C-252/21 Meta Platforms: https://curia.europa.eu/juris/liste.jsf?num=C-252/21
- C-654/23 Inteligo Media, ECLI:EU:C:2025:871: https://ipcuria.eu/case?reference=C-654%2F23

**EDPB y Grupo del Artículo 29**
- Directrices 05/2020 sobre el consentimiento (§§42-44, 64 y 104-108): https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf
- Directrices 2/2023 sobre el alcance técnico del art. 5.3 de la Directiva ePrivacy: https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en
- Dictamen 4/2012 del Grupo del Artículo 29 (WP194): https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf

**AEPD**
- E/01415/2017, pedir el consentimiento no es comunicación comercial: https://www.aepd.es/documento/e-01415-2017.pdf
- E/07233/2015, un boletín de noticias no es comunicación comercial: https://www.aepd.es/documento/e-07233-2015.pdf
- E/00007/2014, aviso informativo de servicio: https://www.aepd.es/documento/e-00007-2014.pdf
- A/00015/2019, baja que pasaba por la cuenta: https://www.aepd.es/documento/a-00015-2019.pdf
- PS/00311/2023, envíos después de una baja, 10.000 €: https://www.aepd.es/documento/ps-00311-2023.pdf
- A/00093/2017, WhatsApp: https://www.aepd.es/documento/a-00093-2017.pdf
- A/00255/2015, SMS: https://www.aepd.es/documento/a-00255-2015.pdf
- Informe 0164/2018: https://www.aepd.es/documento/2018-0164.pdf
- Guía sobre el uso de las cookies: https://www.aepd.es/guias/guia-cookies.pdf
- Guía para el cumplimiento del deber de informar: https://www.aepd.es/guias/guia-modelo-clausula-informativa.pdf

**CNMV y ESMA**
- Preguntas y respuestas sobre MiFID II (pregunta 22.2): https://www.cnmv.es/DocPortal/Legislacion/FAQ/FAQ_MiFIDII.pdf
- Guía para finfluencers: https://www.cnmv.es/DocPortal/Publicaciones/Guias/GuiaparaFinfluencers.pdf
- ESMA, directrices sobre solicitud inversa en MiCA: https://www.esma.europa.eu/sites/default/files/2024-12/ESMA35-1872330276-1899_-_Final_report_on_GLs_on_reverse_solicitation_under_MiCA.pdf

**Proveedores**
- Brevo, registro de cambios del 21/07/2026 (`contactPixelTrackingConsent`): https://developers.brevo.com/changelog/2026/7/21.md
- Condiciones de Brevo: https://www.brevo.com/legal/termsofuse/
- Condiciones de Expo: https://expo.dev/terms
- Privacidad de Firebase: https://firebase.google.com/support/privacy
- Vida de un mensaje FCM: https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan
- Contrato de encargo de Supabase: https://supabase.com/legal/dpa
- Contrato de encargo de Cloudflare: https://www.cloudflare.com/cloudflare-customer-dpa/
- Listado del marco UE-EE. UU.: https://www.dataprivacyframework.gov/participant/5606 (Expo), /5780 (Google), /5666 (Cloudflare), /10010 (Brevo)

**Fuente secundaria**
- Multas del ICO a Flybe y Honda (2017): https://rpclegal.com/snapshots/data-protection/ico-issues-fines-for-emails-seeking-consent-to-marketing


---

## Anexo (06/11/2026): contraste y qué se ha aplicado

Este informe pasó un contraste adversarial («abogado del diablo») que
comprobó en la fuente las citas principales. Estas son sus correcciones y cómo
quedan.

**Correcciones de criterio del contraste:**

- **La baja en cada push es obligatoria**, no interpretable. Lo pide el
  art. 21.2, párr. 2, LSSI («en cada una de las comunicaciones comerciales»).
  Aplicado:
  - canales de Android separados: `cuenta` para la bienvenida y `novedades`
    para los anuncios, que el usuario puede silenciar desde el sistema;
  - enlace «¿No quieres estos avisos? Desactívalos en Perfil…» en el destino
    del push.
- **Bloquear el historial del permiso es obligatorio** (LOPDGDD, art. 32), no
  una recomendación. Aplicado: `historial_permiso` sin clave ajena y en modo
  solo añadir. Al borrar la cuenta queda marcado y se borra a los 3 años. La
  privacidad y el texto de borrar la cuenta lo dicen.
- **Brevo probablemente no deja quitar el píxel** en los correos
  transaccionales: solo lo anonimiza. **Bloquea el paso 5 (correo) con Brevo**
  hasta tener su confirmación escrita, o hasta cambiar de proveedor. Queda en
  `docs/RUNBOOK.md` y en el contrato.
- **Firebase puede arrancar solo al abrir la app.** En la 1.4.2 hay que
  desactivar el autoarranque de FCM y la recogida de Analytics, y comprobarlo
  con una captura de red. Está en `docs/tareas/APK-1.4.2-NOTIFICACIONES.md`.
- **Eric no es corresponsable del art. 26 RGPD** porque solo autoriza el uso
  de su obra. Las decisiones sobre cuentas, datos y envíos son solo del
  titular. Cuando haya licencia escrita, debe decirlo y nombrar:
  - reproducción y distribución;
  - puesta a disposición;
  - transformación (adaptación a la app, resúmenes, tests, traducción);
  - uso de su nombre.
  [INTERPRETABLE]
- **El SMTP de Gmail de Supabase Auth no tiene contrato de encargo.** Pasar
  los correos de Auth al proveedor con dominio propio en el mismo paso 5.
- **Información básica:** dice también qué datos se recogen y aparece junto al
  interruptor de Perfil. Aplicado.
- **Condiciones de la cuenta:** hacía falta un apartado mínimo (edad, uso
  personal de la Academy, borrado y cambios). Aplicado en
  `privacidad.html#condiciones-cuenta`, y `/condiciones` ya no da 404.
- **Citas corregidas:**
  - AEPD A/00015/2019 trata de una baja pedida por correo e ignorada; apoya el
    procedimiento de bajas por correo.
  - Orden EHA/1717/2010: el argumento sólido es que no hay fin de promover ni
    remuneración.
  - Inteligo (C-654/23) apoya en parte el carácter no comercial, porque allí
    había contenido de pago.
  - La edad pasa a [INTERPRETABLE]: 18 años es un requisito contractual; la
    edad de consentimiento es 14 (LOPDGDD, art. 7).
- **Riesgo:** enviar después de una baja puede ser un tratamiento sin base
  (RGPD, art. 6; LOPDGDD, art. 72.1.b), no solo una infracción de la LSSI.
  Por eso se exige revisar el buzón antes de cada envío.

**Aplicado en el código el 06/11/2026**, rama `claude/avisos-y-academy-registro`:

- 4.1: permiso `novedades-v2-2026-11-06` con el texto nuevo, igual en la base,
  la web y la app.
- 4.2: información básica.
- 4.3: `/condiciones` y el enlace de la app.
- 4.4: plantilla de Auth.
- 4.5: historial, con el idioma (5.2).
- 4.6: privacidad de lo que es cierto hoy, todavía con los avisos sin enviarse.
- 4.8 y 4.9: bienvenida y pie con el responsable.
- 4.11: `rwadar_novedades.baja_por_correo` y procedimiento en el RUNBOOK.
- 4.13: registro de actividades, en `docs/legal/REGISTRO-ACTIVIDADES-TRATAMIENTO.md`.
- 4.15 y 4.16: textos y enlace de baja en la app.
- 5.4: riesgo delante en el aviso de ofertas.
- 5.5: filtro de palabras ampliado.
- 5.9: la vuelta a la lección se borra al caducar.
- 5.10: texto de borrar la cuenta, que incluye también el registro de
  inversiones.
- 5.11: asunto de baja unificado.
- 5.12: push de bienvenida.
- 5.17: los anuncios no se limpian.
- `<noscript>` con la baja por correo en `/baja`.

**Pendiente, en manos del titular o para pasos futuros:**

- Contratos de encargo aceptados y archivados en PDF en `docs/legal/encargados/`:
  Supabase, Cloudflare, Google/Firebase, Expo y el proveedor de correo.
- Proveedor de correo sin píxel ni seguimiento de clics (paso 5).
- Licencia escrita de Eric: ✅ existe desde el 06/11 (según Víctor). Si no
  recoge las modalidades de 5.14, pedirle que confirme ese texto.
- Recomendaciones del apartado 5.3, antes de publicar un aviso de ofertas o
  encender `ofertas_automaticas`:
  - enlaces hacia las plataformas;
  - «7D APY»;
  - «Puntos fuertes».
- Revisar las «verificar» del registro de actividades.

---

## Actualización 06/11/2026: proveedor Lettermint

El informe de arriba no se reescribe: es un documento fechado. Este anexo
dice qué cambia al elegir proveedor de correo y qué sigue pendiente. Lo decide
Víctor con su permiso general del 06/11/2026. Contratos, citas y PDF:
[`encargados/README.md`](encargados/README.md).

**Qué cambia:**

- **Proveedor de la UE.** Lettermint B.V. (Zwolle, Países Bajos) sustituye a
  Brevo, que queda descartado por el punto 4.10 (solo anonimiza el píxel).
  Según su contrato de encargo (§8.1), los correos se alojan y se tratan en la
  UE, y sus tres subencargados con acceso al correo están en la UE: el correo
  no sale de la UE. Donde este informe dice «Brevo» como proveedor de los
  avisos nuevos (apartados 1, 2, 4.10, 4.12, 4.13, 5.8 y 6), léase Lettermint.
- **Sin píxel ni seguimiento de clics.** Lettermint no los activa si no se
  pide. Además, cada petición de RWAdar los desactiva expresamente
  (`"settings": {"track_opens": false, "track_clicks": false}`, en la
  migración 31). El control del punto 4.10 sigue: se comprueba en el original
  de un correo real antes de encender.
- **Dirección postal en el pie.** La política de uso de Lettermint exige
  «your valid physical postal address in every email». El pie de todos los
  correos lleva la del aviso legal: Plaza Generalitat, s/n, 46600 Alzira
  (Valencia), España. Se suma al nombre del titular del punto 4.9. También
  las plantillas de Supabase Auth (confirmación y recuperación,
  `rwadar-app/plantillas-auth/`), que desde el punto 5.8 salen por su SMTP.
- **Dos rutas.** La bienvenida sale por la ruta de servicio (la de por
  defecto). Los anuncios, por la de difusión, porque Lettermint pide separar
  el correo de servicio del promocional. La ruta de difusión añade su propio
  enlace de baja y su `List-Unsubscribe`, y guarda las bajas en su lista.
  RWAdar ya tiene su baja (puntos 4.7 y 4.11). Se pide a Lettermint que quite
  la suya; mientras tanto, cada baja que guarde Lettermint se aplica también
  en RWAdar antes del siguiente anuncio, y cada día si el aviso automático de
  ofertas está encendido (si nadie puede revisarlo a diario, ese aviso se
  queda apagado). Si no, se enviaría después de una baja (ver el riesgo del
  contraste), y los push de novedades seguirían llegando.
- **SMTP de Supabase Auth (punto 5.8).** También pasa a Lettermint
  (`smtp.lettermint.co`), en el mismo paso 5. Así deja de usarse la cuenta de
  Gmail sin contrato (contraste, punto 9). Antes de cambiarlo: las plantillas
  de Auth con la dirección postal en el panel, y la privacidad (§6 y §8) y la
  «Información básica» al día y publicadas, porque desde ese momento
  Lettermint trata la dirección de cada alta y Gmail deja de hacerlo
  (RGPD, art. 13.1.e).
- **Contratos archivados (punto 4.13).** Supabase, Cloudflare, Google
  (Firebase), Expo, GitHub y Lettermint, en PDF del 06/11/2026, en
  `docs/legal/encargados/`. El de Lettermint se acepta al crear la cuenta
  (sus condiciones, §4.7 y §15.3). Al leerlos apareció un hueco nuevo:
  **GitHub** no tiene contrato de encargo en una cuenta personal gratuita, y
  sus máquinas ven datos en claro al hacer las copias y los cambios de la base.
- **Dudas del apartado 6 resueltas:** firma Lettermint B.V. (Cámara de
  Comercio neerlandesa, n.º 99337711). Firebase sí pide aceptar sus
  condiciones de tratamiento: rigen desde la fecha en que se aceptan.
- **Textos.** En la «Información básica» (punto 4.2), «Brevo» pasa a
  «Lettermint». No cambian la versión del permiso (`novedades-v2-2026-11-06`)
  ni el texto de la casilla (punto 4.1), que no nombran al proveedor. Además,
  la casilla sigue apagada: nadie ha dado todavía el permiso con el texto
  anterior.

**Qué sigue pendiente:**

- Dominio propio (recomendado `rwadar.app`) y cuenta de Lettermint, con la
  fecha de alta apuntada en `encargados/README.md`.
- La prueba real del paso 5, antes de encender el correo:
  - sin píxel ni enlaces reescritos en el original del mensaje;
  - `List-Unsubscribe` en el buzón;
  - el nombre exacto de la ruta de difusión (`broadcast`, sin confirmar);
  - un solo correo al repetir el envío con la misma clave.
- Antes del punto 5.8 (Auth por Lettermint): plantillas de Auth con la
  dirección postal, privacidad e «Información básica» publicadas con
  Lettermint en lugar de Gmail, y la ruta de servicio sin seguimiento.
- Que Lettermint quite su enlace de baja de la ruta de difusión, o revisar su
  lista de bajas antes de cada anuncio (cada día con el aviso automático de
  ofertas encendido; si no se puede, ese aviso se queda apagado).
- Firebase: aceptar sus condiciones en la consola y apuntar la fecha.
- GitHub: firmar su «Customer Agreement» en una organización o sacar los
  datos personales de sus máquinas. Decide Víctor.
- Lo pendiente del anexo anterior que no depende del proveedor.
- El sistema antiguo de avisos de seguimiento (migraciones 13 y 23) sigue
  inactivo y usa Brevo. Si algún día se reactiva, también tiene que salir de
  Brevo.

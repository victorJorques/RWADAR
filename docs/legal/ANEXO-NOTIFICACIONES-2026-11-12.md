# Anexo legal · Notificaciones en el móvil (web y Android) · 12/11/2026

**Fecha:** 12/11/2026. Consultas hechas entre las 16:03 y las 16:25 UTC
(apartado 6, cada una con su hora).
**Quién lo redacta:** Claude (IA), por encargo de Víctor Manuel Jorques
Granero, titular de RWAdar y responsable del tratamiento. No es el dictamen de
un abogado.
**Para qué sirve:** decidir si se puede encender el envío para todos
(`activar-push`, que pone `push_habilitado = true`). La privacidad publicada
(§8) promete comprobar antes la garantía de Apple, Mozilla y Microsoft; el
registro de actividades (A5) y el traspaso (entradas 8 y 9 del 12/11) piden
además valorar el «latido» de Firebase en la app de Android.
**Cómo estaba hoy antes de este anexo:** migración 32 aplicada y clave VAPID
creada; web n.º 71 y OTA n.º 23 publicadas; `push_habilitado = false`. Solo
sale «Notificaciones web › prueba», a mano y a las cuentas de administración.
**Marcas:** [SEGURO] lo dice la norma o el documento citado; [INTERPRETABLE]
hay más de una lectura razonable y se dice cuál se elige; **verificar** no se
ha podido comprobar.

---

## Veredicto

**Sí, con condiciones.** Las notificaciones de la web y el push de Android se
pueden encender cuando se cumplan las seis condiciones del apartado 4: la
privacidad de este anexo publicada, una frase corta junto a cada botón (web y
app), GitHub con contrato de encargo o el envío fuera de GitHub, y las pruebas
reales en el iPhone del titular y en un Android físico. Si el interruptor sigue
siendo uno solo (`activar-push` enciende a la vez la web y Android), hacen
falta todas; si se separa, cada canal solo necesita las suyas.

En una línea por tema:

- **Servicios de push de los navegadores:** no son encargados de RWAdar; son
  el servicio de entrega que eligió el navegador de cada persona, como su
  proveedor de correo. Google y Microsoft están en el DPF; Apple no, pero en
  el EEE responde Apple Distribution International (Irlanda), con cláusulas
  tipo; Mozilla no, y queda como riesgo residual bajo, a la vista y explicado.
- **El «latido» de Firebase:** enviarlo a Google al pulsar el botón es válido
  con información clara junto al botón (consentimiento, LSSI 22.2). Guardarlo
  en el móvil sin pedir nada, como hace la 1.4.2 desde el 06/11, no tiene
  excepción clara: no lo arregla ni lo empeora encender el push, y se corrige
  de raíz en la próxima versión nativa.
- **LSSI 21 y consentimiento:** se cumplen. Cada aviso trae su baja y el texto
  aceptado (`novedades-v2-2026-11-06`) cubre las notificaciones de la web en el
  móvil.

---

## 1. Notificaciones de la web (Web Push)

### 1.1 Qué recibe cada servicio de push

Lo que sale de RWAdar en cada envío lo fija el remitente
(`rwadar-app/enviar-webpush.mjs`) y la migración 32
(`rwadar-app/db/32_notificaciones.sql`), leídos hoy:

| Recibe | Qué es | ¿Dato personal para el servicio? |
|---|---|---|
| **La dirección de la suscripción** (`endpoint`) | Una URL que **el propio servicio** dio al navegador de la persona cuando activó las notificaciones. El servicio ya la tiene: se la dio el navegador, no RWAdar | Sí: identifica un navegador de un dispositivo |
| **La hora del envío** y las cabeceras `TTL: 86400` (un día), `Urgency: high` y `Content-Encoding: aes128gcm` | Cuándo hay un aviso para ese navegador y cuánto tiempo guardarlo si el móvil está apagado | Sí, unida a la dirección |
| **El tamaño** del mensaje cifrado | La carga del aviso (su JSON) más 103 octetos fijos (relleno mínimo): deja adivinar la longitud del aviso, no su contenido | Muy poco: todos los suscritos reciben el mismo aviso |
| **El mensaje cifrado de extremo a extremo** (RFC 8291) | `{v, titulo, texto, url, etiqueta}` cifrado con las claves del navegador. El servicio no tiene esas claves y no lo puede leer. La `url` es siempre `https://rwadar.pages.dev/?avisos=1` (con `#emisiones` si va al radar): sin datos de la persona ni marcas de seguimiento | No lo puede leer |
| **La firma VAPID** (RFC 8292) | Un JWT con `aud` (el servicio), `exp` (12 horas) y `sub = mailto:rwadares@gmail.com`, y la clave pública de RWAdar | No es dato de la persona: identifica a RWAdar |
| **La IP del remitente** | La de la máquina de GitHub Actions que envía, no la de la persona | No es dato de la persona |

**Lo que no recibe nunca:** el correo, el nombre, el identificador de la
cuenta, el texto en claro ni las claves del navegador.

Los cuatro servicios que admite la base (regla de la tabla, de la API y del
remitente):

| Servicio | Dirección | Navegadores | Quién lo presta en el EEE, según su política |
|---|---|---|---|
| **Apple** | `web.push.apple.com` | Safari y cualquier web añadida a la pantalla de inicio del iPhone o el iPad | Apple Distribution International Limited (Irlanda). La política no nombra el servicio de push web: **verificar** que es el mismo |
| **Google** (Firebase Cloud Messaging) | `fcm.googleapis.com` | Chrome y la mayoría de navegadores de Android | Google Ireland Limited, salvo aviso propio del servicio |
| **Mozilla** (autopush) | `updates.push.services.mozilla.com` | Firefox | Mozilla Corporation (EE. UU.): no nombra una empresa en la UE |
| **Microsoft** (WNS) | `*.notify.windows.com` | Edge en Windows (la web solo ofrece el botón en móviles y tabletas, así que se espera poco o nada) | Microsoft Ireland Operations Limited |

Dos detalles técnicos que importan:

- **Si el móvil está apagado,** el servicio guarda el mensaje cifrado hasta
  que caduque (un día, por el `TTL`) y después lo borra (documentación de
  Apple y de autopush, apartado 6).
- **Firefox en Android** puede reenviar el mensaje por Firebase Cloud
  Messaging de Google («bridge» de autopush, apartado 6). Sigue cifrado.

### 1.2 ¿Son encargados de RWAdar? No [INTERPRETABLE; lectura elegida]

Un encargado trata datos «por cuenta del responsable» (RGPD, art. 4.8). Aquí
no ocurre:

1. **No los elige RWAdar, sino el navegador.** La dirección de entrega la
   asigna el servicio del navegador al suscribirse; RWAdar no puede escoger
   otro (la web solo comprueba que sea uno de los cuatro).
2. **No hay contrato ni cuenta de RWAdar con ellos.** RWAdar firma sus envíos
   con su propia clave VAPID, sin darse de alta en ninguno de ellos: la clave
   pública se la pasa el navegador al suscribirse.
3. **Deciden ellos cómo prestan el servicio** (dónde guardan, cuánto,
   reenvíos por FCM o APNs) y lo hacen para el navegador y la persona que lo
   usa, con sus propias condiciones.
4. **Es la práctica que describen los propios servicios.** Microsoft, en su
   declaración de privacidad (sección de Teams): «La empresa que proporciona el
   servicio de notificaciones en el dispositivo usará esta información de
   acuerdo con su propios términos y directiva de privacidad. Microsoft no es
   responsable de los datos recogidos por la empresa que proporciona el
   servicio de notificaciones».
5. **Es lo mismo que el correo.** La privacidad (§7) ya trata así al
   «proveedor de correo de cada interlocutor», que «interviene al enviar o
   recibir».

Consecuencia: **no hace falta contrato de encargo** (art. 28) con ellos. Sí
hay que informar de que reciben datos (art. 13.1.e): la privacidad ya los
nombra (§§ 6 y 8) y este anexo añade sus garantías.

### 1.3 ¿Es una transferencia internacional hecha por RWAdar (art. 44)?

El CEPD exige tres cosas a la vez para que haya transferencia (Directrices
05/2021, versión 2, adoptadas el 14/02/2023, ¶ 9): un exportador sujeto al
RGPD, que **comunica** datos a otro responsable o encargado, y que ese
importador esté en un tercer país. Y añade que no hay exportador «when data
are disclosed directly by the data subject to the recipient» (apartado 2.2 y
ejemplo 1).

Hay dos lecturas razonables:

- **Lectura A: no hay transferencia de RWAdar** [INTERPRETABLE]. La
  suscripción (la dirección y su vínculo con el dispositivo) la entrega el
  navegador de la persona, por su cuenta, a su servicio de push: eso no es una
  transferencia (ejemplo 1 del CEPD). Lo que añade RWAdar es la hora, el
  tamaño y un mensaje que el servicio no puede leer, enviados porque la
  persona lo pidió y al servicio que eligió ella. Es como enviar un correo a
  la dirección que la persona dio: llega a su proveedor.
- **Lectura B, prudente: sí la hay** si quien recibe está fuera del EEE.
  RWAdar comunica algo nuevo (que hay un aviso para ese dispositivo, y
  cuándo), y eso es dato personal para el servicio.

**Se elige la lectura A, comprobando además la B para cada servicio:**

| Servicio | DPF (lista oficial, 12/11/2026) | En el EEE responde, según su política | Sus propias salidas del EEE | Con la lectura B |
|---|---|---|---|---|
| **Google** | Google LLC, n.º 5780, UE-EE. UU. «Active», datos que no son de RR. HH. incluidos; próxima renovación, el 13/09/2027. Su alcance: «supplying services and products to consumers and businesses» | Google Ireland Limited (Gordon House, Dublín) | DPF y cláusulas tipo (su página de marcos, en vigor desde el 23/08/2025) | **Cubierto** [SEGURO en cuanto a la adhesión] |
| **Microsoft** | Microsoft Corporation, n.º 6474, UE-EE. UU. «Active»; próxima renovación, el 31/08/2027. Alcance: los usuarios de sus productos | Microsoft Ireland Operations Limited (Dublín) | DPF y cláusulas tipo | **Cubierto** |
| **Apple** | **No figura** (búsquedas «Apple», «Apple Inc» y «Apple Distribution», cualquier estado: 0 resultados) | Apple Distribution International Limited, Irlanda: «Personal data relating to individuals in the European Economic Area […] is controlled by Apple Distribution International Limited in Ireland» | «Apple’s international transfer of personal data collected in the European Economic Area […] is governed by Standard Contractual Clauses» | **Cubierto si quien recibe es la empresa de Irlanda:** entonces RWAdar comunica dentro del EEE y la salida a EE. UU. es de Apple, con sus cláusulas tipo. **Verificar** que el push web también lo controla ADI (la política no lo nombra) |
| **Mozilla** | **No figura** (búsquedas «Mozilla» y «Mozilla Corporation», cualquier estado: 0 resultados) | No nombra una empresa en la UE. «Mozilla (and our servers) are based in the United States». Su delegado de protección de datos para el EEE: Bird & Bird DPO Services SRL (Bruselas) | Cláusulas tipo «where applicable» para lo que comparte con sus socios | **Sin una garantía que pueda aportar RWAdar:** no hay contrato con Mozilla, así que no puede haber cláusulas tipo entre los dos |

**Mozilla: se acepta como riesgo residual bajo, a la vista.** Por qué:

1. Con la lectura A, que es la elegida, no hay transferencia de RWAdar.
2. Lo que RWAdar añade es mínimo: hora, tamaño y un mensaje cifrado que
   Mozilla no puede leer. El cifrado de extremo a extremo es la medida que el
   CEPD considera eficaz cuando quien recibe no tiene las claves
   (Recomendaciones 01/2020, versión 2.0, caso de uso 1, ¶ 84); aquí las
   claves privadas están solo en el navegador de la persona.
3. No hay datos de la persona en el texto, y el mensaje caduca en un día.
4. Afecta a poca gente (Firefox en Android, y solo quien active las
   notificaciones) y cada persona puede evitarlo: si no las activa, ve los
   mismos avisos en la campana. La privacidad se lo dice.
5. No se basa en el art. 49.1.a (consentimiento explícito a la transferencia):
   exigiría avisar del riesgo de forma específica antes de cada activación en
   Firefox. Si una autoridad o el CEPD dijeran que este envío es una
   transferencia, las salidas son esa (un aviso propio para Firefox) o dejar
   de enviar a `updates.push.services.mozilla.com`.

**Cuándo se revisa este punto:** si Apple o Mozilla entran en el DPF o
publican una empresa en la UE para el push; si cae el DPF; si el CEPD o la
AEPD se pronuncian sobre los servicios de push; y en la revisión anual del
registro.

### 1.4 Medidas que ya hay (comprobadas hoy en el código)

- **Cifrado de extremo a extremo** (RFC 8291, aes128gcm, clave de un solo uso
  por envío) y **firma VAPID** (RFC 8292). La clave privada VAPID está en el
  Vault de Supabase y el flujo la enmascara.
- **Solo cuatro servicios:** la tabla, la API y el remitente rechazan
  cualquier otra dirección.
- **Sin datos personales en el mensaje:** título, texto, enlace fijo a la
  lista de avisos y etiqueta. Ni correo, ni nombre, ni identificador.
- **`TTL` de 24 horas:** si no se entrega en un día, el servicio lo borra.
- **Solo a quien dio el permiso:** cuentas con el correo confirmado, con
  «Avisos de novedades» activado y la versión vigente del texto, y solo
  anuncios publicados en los últimos 7 días y posteriores a la suscripción
  (`webpush_pendientes`).
- **Borrado de suscripciones:** al desactivarlas, al cerrar sesión, al borrar
  la cuenta, cuando el servicio responde 404 o 410, al pasar de cinco por
  cuenta (la más antigua) y a los 180 días sin renovarse (reloj diario de
  limpieza). Los registros de envío, a los 90 días.

### 1.5 GitHub, quien cifra y envía

El remitente se ejecuta en máquinas de GitHub Actions (flujo «Notificaciones
web»). Allí están en claro, mientras dura cada envío, la dirección de entrega y
las dos claves de cada navegador, el texto del aviso y la clave privada VAPID.
GitHub está en el DPF (n.º 6174, «Active» hoy a las 16:18 UTC), así que el
viaje está cubierto. Lo que falta es el **contrato de encargo** (art. 28.3):
con una cuenta personal gratuita, GitHub no aplica su DPA
([encargados](encargados/README.md#github--hueco)).

El hueco ya existe para las copias de seguridad y los flujos de la base. Con
el envío encendido se ampliaría a una actividad nueva y a todas las personas
con notificaciones (hoy solo pasa con la prueba, que va a las cuentas de
administración). Encargar un tratamiento sin ese contrato es infracción grave
(LOPDGDD, art. 73.k). Por eso pasa de «recomendado» a **condición** (C3):
firmar el contrato (GitHub Team, unos 4 $ al mes) o ejecutar el envío en un
proveedor que ya lo tiene (Supabase o Cloudflare).

### 1.6 Conclusión de la web

Se puede encender con C1 a C4 (apartado 4). No hace falta contrato con los
servicios de push. La privacidad dice ahora qué garantía tiene cada uno, sin
afirmar lo que no está comprobado.

---

## 2. El «latido» de Firebase en la app de Android 1.4.2

### 2.1 Los hechos

Fuentes: `docs/tareas/APK-1.4.2-NOTIFICACIONES.md` (revisión independiente
antes de compilar, punto 3), la privacidad (§5, `#firebase-android`), el
registro (A5) y la guía de Google para Play (apartado 6).

- **Hoy, con todo apagado:** la app 1.4.2 crea Firebase al arrancar
  (`FirebaseInitProvider`) aunque el autoarranque de mensajería y de analítica
  esté apagado. Firebase guarda en el móvil las fechas de los días en que se
  abrió la app, hasta 30. **No sale nada:** en el emulador, al abrir la app, no
  hubo ninguna conexión a Firebase (06/11/2026).
- **Con el envío encendido:** al pulsar «Notificaciones en este móvil», la
  primera petición a Firebase envía a Google esas fechas junto con el
  «Firebase user agent»: versión de Android, nombre, modelo, marca y tipo de
  dispositivo, la tienda desde la que se instaló la app y los componentes de
  Firebase con sus versiones. Según Google, lo usa «internally […] to
  determine platform and version adoption» y «It is never linked to a user or
  device identifier».
- **Con el envío apagado**, como hoy, el botón dice que aún no está disponible
  y no llama a Firebase.
- Esas fechas solo se borran desinstalando la app o borrando sus datos desde
  Android; el botón «Borrar datos del dispositivo» de RWAdar no las borra (la
  privacidad ya lo dice).

### 2.2 La norma

- **LSSI, art. 22.2** (BOE, texto consolidado; redacción en vigor desde el
  11/05/2014): se pueden usar «dispositivos de almacenamiento y recuperación
  de datos en equipos terminales» si la persona ha dado «su consentimiento
  después de que se les haya facilitado información clara y completa sobre su
  utilización». No hace falta para el acceso técnico «al solo fin de efectuar
  la transmisión de una comunicación» ni, «en la medida que resulte
  estrictamente necesario, para la prestación de un servicio de la sociedad de
  la información expresamente solicitado por el destinatario». Es la
  trasposición del art. 5.3 de la Directiva 2002/58/CE («ePrivacy»).
- **CEPD, Directrices 2/2023** (versión 2, adoptadas el 07/10/2024):
  - guardar y acceder son operaciones separadas, y cada una basta para que
    se aplique el art. 5.3 (¶ 30);
  - «guardar» incluye ordenar a un programa del dispositivo que genere la
    información (¶ 36);
  - usar información dentro del dispositivo no es «acceder» mientras no
    salga de él; cuando sale, sí lo es (¶ 44 y ¶ 53).
- **Infracción si falla:** leve (LSSI, art. 38.4.g), multa de hasta 30.000 €
  (art. 39.1.c).

### 2.3 Valoración

**a) El envío a Google al pulsar el botón.** Es un «acceso» (la información
sale del móvil) y no es estrictamente necesario para entregar las
notificaciones: Google lo usa para sus estadísticas. Necesita consentimiento.
**Basta con información clara junto al botón (primera capa) y en la
privacidad (segunda capa), y que la persona pulse:** es un acto afirmativo,
específico (ese botón solo activa las notificaciones de ese móvil, y la frase
dice lo que eso conlleva) e informado [INTERPRETABLE, pero sólido]. Es libre porque hay alternativa sin coste: sin pulsar, ve los mismos
avisos en Inicio (RGPD, art. 7.4). Hoy la frase junto al botón de la app dice
que el identificador «lo reciben Expo y Google», pero no habla del latido:
**falta la frase de 2.4** (condición C5).

**b) Guardar las fechas en el móvil sin pedir nada (desde el 06/11/2026).**
Literalmente es «almacenamiento» y no encaja con claridad en la excepción de
«estrictamente necesario»: no lo pide la persona ni hace falta para la app.
La información por sí sola no lo arregla, porque la LSSI pide consentimiento y
no solo información. Lo que lo hace muy leve es que no sale del móvil sin
pulsar el botón, nadie lo ve, la privacidad lo explica y no se puede quitar
por OTA (exige código nativo). **No depende de `activar-push`:** pasa igual
con el envío apagado, y no encenderlo no lo corrige. Por eso **no bloquea**
el encendido, pero tiene arreglo y fecha: en la próxima versión nativa,
Firebase solo se crea al pulsar el botón (recomendación R4).

**c) Después de activarlas.** Mientras siguen activas, Firebase puede volver a
contactar con Google (renovación del token) y llevar el latido otra vez. Al
desactivarlas en Perfil, **verificar** en el Android físico si la app deja de
hablar con Firebase (condición C6). Si no deja de hacerlo, se dice en la
privacidad.

### 2.4 Frases de primera capa (texto exacto)

Las coloca el otro agente, que lleva el código. Van junto al botón, antes de
pulsarlo, y deben estar publicadas antes de encender el canal.

**App de Android** (se añade al final del texto que hay junto a
«Notificaciones en este móvil», hoy `TEXTO_MOVIL` en
`rwadar-movil/componentes/AvisosNovedades.js`):

> **ES:** Con ellas activadas, el componente de notificaciones de Google
> (Firebase) envía también a Google las fechas en que abres la app (hasta 30)
> y datos técnicos del móvil, que usa para sus estadísticas. Si no las
> activas, no le llega nada y seguirás viendo los avisos en Inicio.
>
> **EN:** With them turned on, Google's notification component (Firebase)
> also sends Google the dates you open the app (up to 30) and technical
> details about your phone, which Google uses for its statistics. If you don't
> turn them on, nothing reaches Google and you will still see your notices on
> Home.

**Web** (se añade al final de los textos `disponible` y `disponible-pausa` de
`TEXTOS_PUSH` en `rwadar-site/assets/rwadar-20260820.js`, que ya dicen que
viajan cifradas por el servicio de Apple, Google, Mozilla o Microsoft):

> **ES:** El servicio de tu navegador puede estar fuera de la UE: ve la hora
> de cada aviso, pero no puede leer su texto. Si no las activas, seguirás
> viendo los avisos en la campana.
>
> **EN:** Your browser's service may be outside the EU: it sees when each
> notice is sent, but cannot read its text. If you don't turn them on, you
> will still see your notices under the bell.

Las dos llevan su inglés en los diccionarios de idioma, como el resto.

---

## 3. LSSI, art. 21, y el consentimiento

### 3.1 La baja en cada aviso (art. 21.2, párr. 2, y art. 22.1)

La LSSI pide ofrecer la baja «mediante un procedimiento sencillo y gratuito
[…] en cada una de las comunicaciones comerciales» y procedimientos sencillos
para revocar el consentimiento, con información sobre ellos.

- **Web:** cumple [SEGURO en cuanto a los hechos].
  - Toda notificación lleva a `https://rwadar.pages.dev/?avisos=1`
    (`webpush_carga` de la 32; el verificador 32 lo exige).
  - Esa dirección abre la lista de avisos con «¿No quieres estos avisos?
    Desactívalos en Perfil o en los ajustes del móvil.» y el botón a Perfil ›
    Avisos.
  - Sin sesión en ese navegador, sale la misma frase.
  - Además, el sistema deja quitarlas desde los ajustes del móvil.
- **Android:** cumple.
  - Cada anuncio llega por el canal «Novedades de RWAdar» (`novedades`); la
    bienvenida, por «Avisos de tu cuenta» (`cuenta`).
  - Android deja desactivar el canal desde la propia notificación
    (mantenerla pulsada): es una baja en cada aviso, sencilla y gratuita.
  - Al tocarla, los anuncios corrientes abren Inicio, cuya tarjeta «Avisos»
    acaba con la misma frase y lleva a Perfil › Avisos.
  - Matiz: los anuncios de ofertas abren Buscar y los de la Academy, la
    Academy, y ahí no está la frase. Basta con la baja del propio Android, pero
    conviene igualarlo con la web (recomendación R2).
- **Información sobre la baja** (art. 22.1): la privacidad (§6) y el propio
  texto del permiso lo dicen.

### 3.2 Quién envía (art. 20.1)

Android muestra el nombre y el icono de RWAdar; el navegador, el origen
`rwadar.pages.dev` y el título del aviso. Cumple.

### 3.3 ¿Cubre el permiso vigente las notificaciones de la web?

**Sí.** El texto aceptado (`novedades-v2-2026-11-06`) dice: «Quiero recibir
avisos de RWAdar por correo y, si los activo en mi móvil, como
notificaciones». Habla del móvil, no de la app: una notificación de la web en
el móvil es una notificación «en mi móvil». Además:

- hay que activarlas aparte en cada navegador, con su botón y el permiso del
  sistema: es una segunda voluntad, expresa y por dispositivo;
- la base solo envía a cuentas con el correo confirmado, el permiso activado y
  **la versión vigente del texto** (`p.version = version_consentimiento`);
- la baja corta a la vez correo y notificaciones.

Matiz [INTERPRETABLE; riesgo muy bajo]: la web también ofrece el botón en
tabletas, y una tableta no es, en sentido estricto, un «móvil». La activación
expresa en ese dispositivo deja clara la voluntad. No compensa cambiar el
texto versionado, porque obligaría a pedir de nuevo el permiso a todos; si
algún día se cambia, «en mi móvil o tableta» (R5).

### 3.4 «Información básica» junto al interruptor

El texto común (`INFO_BASICA_ES`) dice «Proveedores: Supabase, Cloudflare y
Google; para los avisos, Lettermint y Expo», sin los servicios de push de los
navegadores ni GitHub. No bloquea: la suscripción no se recoge al activar el
interruptor, sino al pulsar el botón de cada dispositivo, y junto a ese botón
la web ya nombra a Apple, Google, Mozilla y Microsoft. Mejor completarlo en el
próximo cambio de textos (R3).

---

## 4. Conclusión y condiciones

**Sí, con condiciones.** Antes de `activar-push`:

| | Condición | Canal | Quién | Estado (12/11/2026) |
|---|---|---|---|---|
| **C1** | **Privacidad publicada** con lo de este anexo (§5 y §8, en este commit). Mientras la publicada diga que la garantía «se comprobará», no se envía | Los dos | Publicar la web, con orden de Víctor | Hecho en el repositorio; falta publicar |
| **C2** | **Frase de primera capa de la web** (2.4), con su inglés, publicada | Web | Otro agente; publicar la web | Pendiente |
| **C3** | **GitHub con contrato de encargo**: organización con GitHub Team y «GitHub Customer Agreement» firmado (incluye el DPA). **O bien** el envío de la web en un proveedor que ya lo tiene (Supabase o Cloudflare) | Web | Víctor (contrato) o código | Pendiente |
| **C4** | **Prueba real en el iPhone del titular** (entrada 9 del traspaso): llega «Prueba de RWAdar», sale el «1» y al tocarla se abre la lista con la baja | Web | Víctor | Pendiente |
| **C5** | **Frase de primera capa de la app** (2.4), con su inglés, en una OTA publicada **antes** de encender | Android | Otro agente; OTA con orden de Víctor | Pendiente |
| **C6** | **Prueba en un Android físico** (la «ronda 3» del plan): sin pulsar el botón, ninguna conexión a Firebase al abrir la app; al pulsar, permiso, canal y la frase de C5; baja manteniendo pulsada la notificación y en Perfil; y **verificar** qué hace Firebase después de desactivarlas | Android | Víctor, con un Android prestado | Pendiente |

**Recomendado, no bloquea:**

- **R1.** En el diálogo de la campana, la frase de la baja arriba, antes de la
  lista (ya lo pidió el auditor).
- **R2.** En la app, que todo anuncio abra Inicio (con su frase de baja), o
  poner la frase también en Buscar y en la Academy.
- **R3.** Completar la «Información básica» con «el servicio de
  notificaciones de tu navegador» y GitHub.
- **R4.** En la próxima versión nativa de Android: Firebase solo se crea al
  pulsar el botón (quitar `FirebaseInitProvider` del arranque e iniciarlo a
  mano), para que el latido no se guarde sin consentimiento.
- **R5.** Si algún día cambia el texto versionado, «en mi móvil o tableta».
- **R6.** En la app, con el correo apagado, quitar «o con el enlace de cada
  correo» del mensaje de alta (ya anotado).
- **R7.** Revisar el punto 1.3 cuando se dé alguno de sus avisos y en la
  revisión anual del registro (antes del 06/11/2027).

**Lo que no se promete** (la privacidad tampoco lo afirma):

- que cada notificación llegue (la privacidad dice expresamente que no se
  promete);
- que los servicios de push no traten la hora y la dirección (las tratan, y la
  privacidad lo dice);
- que Google use el latido solo como dice (la privacidad lo atribuye: «según
  Google»);
- que Apple controle desde Irlanda el push web en concreto (la privacidad
  cita su regla general: «según su política de privacidad»; **verificar**).

---

## 5. Qué cambia en la privacidad (este commit)

- **§8, transferencias:** Microsoft Corporation se suma a GitHub y Google LLC
  como adheridas al DPF (comprobado el 12/11/2026 en la lista oficial). La
  frase «Antes de empezar a enviar notificaciones a la web se comprobará la
  garantía aplicable a Apple, Mozilla y Microsoft» se sustituye por el
  resultado: un párrafo nuevo (`#garantias-push`) que dice que no trabajan por
  encargo de RWAdar, qué reciben, quién responde en el EEE según cada empresa
  y que Apple y Mozilla no están en el DPF, con lo que dicen sus políticas.
  Termina con la salida para quien no quiera: no activarlas y ver los avisos
  en la campana.
- **§8, lista de proveedores:** el punto de los servicios de push enlaza a ese
  párrafo.
- **§5, Firebase:** el envío del latido solo ocurre si se pulsa el botón y,
  al hacerlo, se consiente también ese envío (LSSI, art. 22.2).
- **Fecha de la versión:** sigue siendo el 12/11/2026, que es hoy.

---

## 6. Fuentes (consultadas el 12/11/2026, hora UTC)

**Lista oficial del DPF** (https://www.dataprivacyframework.gov/list; la
página carga sus datos de su API pública
https://dpfapi.azurewebsites.net/api/participants):

- 16:03-16:04, consulta del coordinador: Google LLC y Microsoft Corporation,
  «Active»; «Apple», «Apple Inc», «Mozilla» y «Mozilla Corporation», ningún
  resultado.
- 16:17-16:18, repetida por Claude, sin filtro de estado: «Apple», «Apple
  Inc», «Apple Distribution», «Mozilla» y «Mozilla Corporation», ningún
  resultado. Activos: Google LLC (5780), Microsoft Corporation (6474), Netlify,
  Inc (6208) y GitHub (6174). Detalle de 5780 y 6474 a las 16:17:41. Las
  respuestas de Google y Microsoft dan el mismo SHA-256 en las dos consultas.
- Comprobación de que la búsqueda es por fragmento: «Micro» devuelve 15
  organizaciones, activas o no.

Copias en [`encargados/`](encargados/) (SHA-256 de cada archivo):

| Archivo | SHA-256 |
|---|---|
| `2026-11-12-dpf-google-llc.json` | `6edc38840f602f81f708dce22b1e92790c885dbc19afcdd7a19daa3399e2acdd` |
| `2026-11-12-dpf-microsoft-corporation.json` | `648582812b76a7664df5ed2fbd59ec213d99294059a86c3f04f3ffcdab4a2a7f` |
| `2026-11-12-dpf-apple-inc.json` | `d8a7c86effbaa31d54438ef8e6af21fd93537170fa0b0060002ef0ad8b57e75d` |
| `2026-11-12-dpf-mozilla-corporation.json` | `d8a7c86effbaa31d54438ef8e6af21fd93537170fa0b0060002ef0ad8b57e75d` |
| `2026-11-12-dpf-consultas.json` | resumen de las consultas de las 16:17-16:18, con la petición, la respuesta y el SHA-256 de cada respuesta cruda. Del detalle de Google y Microsoft se guarda un extracto **sin los contactos** (nombres, correos y teléfonos de empleados) |

Las cuatro primeras son las respuestas del coordinador, copiadas byte a byte.
Las de Apple y Mozilla son idénticas porque las dos dicen lo mismo:
`{"RecordCount":0,"Items":[],"SumCount":3698}`.

**Políticas y documentación de los servicios:**

- Apple, política de privacidad, «Updated July 30, 2025» / «Actualizado el 30
  de julio de 2025», apartado «Transfer of Personal Data Between Countries»:
  https://www.apple.com/legal/privacy/en-ww/ y
  https://www.apple.com/es/legal/privacy/es/ (16:10).
- Apple, «Sending web push notifications in web apps and browsers» (TTL,
  almacenamiento si el dispositivo está apagado, `*.push.apple.com`):
  https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
  (16:11).
- Mozilla, «Firefox Privacy Notice», «Effective May 4, 2026», apartado
  «International transfers of data» y datos de contacto del DPO:
  https://www.mozilla.org/en-US/privacy/firefox/ (16:10).
- Mozilla, documentación de autopush (arquitectura y «Push Service Bridge
  HTTP Interface»): https://mozilla-services.github.io/autopush-rs/ y
  https://mozilla-services.github.io/autopush-rs/http.html (16:11). La ayuda
  de Firefox (support.mozilla.org) no se pudo leer: pide JavaScript.
- Google, política de privacidad para España, «Fecha de entrada en vigor: 16
  de octubre de 2026», apartado «Responsable del tratamiento de datos»:
  https://policies.google.com/privacy?hl=es&gl=es (16:12).
- Google, «Marcos legales para la transferencia de datos», en vigor desde el
  23/08/2025: https://policies.google.com/privacy/frameworks?hl=es (16:10).
- Google, guía de datos de Firebase para Play («Firebase user agent»; «Last
  updated 2026-11-12 UTC»):
  https://firebase.google.com/docs/android/play-data-disclosure (16:14).
- Microsoft, declaración de privacidad, «Última actualización: noviembre de
  2026» (DPF, responsables en el EEE y notificaciones push):
  https://www.microsoft.com/es-es/privacy/privacystatement (16:10).

**Normas y guías:**

- LSSI (Ley 34/2002), texto consolidado del BOE, arts. 20, 21, 22, 38.4.g y
  39.1.c: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758 (16:13).
- LOPDGDD (Ley Orgánica 3/2018), texto consolidado del BOE, art. 73.k:
  https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673 (16:25).
- Directiva 2002/58/CE, art. 5.3:
  https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02002L0058-20091219
  (EUR-Lex respondió con una página de comprobación: no se leyó hoy; se cita
  su trasposición, la LSSI 22.2).
- Decisión de Ejecución (UE) 2023/1795 de la Comisión, de 10 de julio de
  2023 (DPF): https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj (no se pudo
  leer hoy por lo mismo; la cita ya estaba en la privacidad).
- CEPD, Directrices 2/2023 sobre el alcance técnico del art. 5.3 de la
  Directiva ePrivacy, versión 2, 07/10/2024:
  https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf
  (16:13).
- CEPD, Directrices 05/2021 sobre la relación entre el art. 3 y el capítulo V
  del RGPD, versión 2, 14/02/2023:
  https://www.edpb.europa.eu/system/files/2023-02/edpb_guidelines_05-2021_interplay_between_the_application_of_art3-chapter_v_of_the_gdpr_v2_en_0.pdf
  (16:14).
- CEPD, Recomendaciones 01/2020 sobre medidas complementarias, versión 2.0,
  18/06/2021:
  https://www.edpb.europa.eu/system/files/2021-06/edpb_recommendations_202001vo.2.0_supplementarymeasurestransferstools_en.pdf
  (16:14).
- RFC 8030 (Web Push), RFC 8291 (cifrado) y RFC 8292 (VAPID), del IETF; los
  aplica `rwadar-app/enviar-webpush.mjs`.

**Del repositorio (leído hoy):** `rwadar-app/enviar-webpush.mjs`,
`rwadar-app/db/32_notificaciones.sql`, `rwadar-app/db/30_avisos_registrados.sql`
(función `destino`), `rwadar-site/assets/rwadar-20260820.js` (textos del
botón y diálogo de la campana), `rwadar-movil/componentes/AvisosNovedades.js`,
`rwadar-movil/App.js` (destino de cada notificación),
`docs/tareas/APK-1.4.2-NOTIFICACIONES.md`, la privacidad, el registro de
actividades y [`encargados/README.md`](encargados/README.md).

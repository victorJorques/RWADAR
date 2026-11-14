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
**Actualizado el 12/11/2026 por la tarde (migración 33):** el envío de la web
a todos deja de hacerse en GitHub. Lo pide la base de datos (Supabase, con pg_net) y lo
cifra, firma y entrega el servidor de la web (Cloudflare,
`/api/interno/webpush`); los dos ya son encargados con contrato. GitHub solo
envía la prueba a las cuentas de administración (datos del propio titular) y
las copias de cada noche ya no llevan las suscripciones. C3 queda **hecha en
el código** (apartado 4) y se cumple al publicar la web y aplicar la 33.
**Marcas:** [SEGURO] lo dice la norma o el documento citado; [INTERPRETABLE]
hay más de una lectura razonable y se dice cuál se elige; **verificar** no se
ha podido comprobar.

---

## Veredicto

**Sí, con condiciones.** Las notificaciones de la web y el push de Android se
pueden encender cuando se cumplan las siete condiciones del apartado 4: la
privacidad de este anexo publicada, una frase corta junto a cada botón (web y
app; la de la app, en una OTA ya en uso), el envío fuera de GitHub (hecho en
el código con la migración 33: falta publicarlo), la baja a la vista al abrir en la app una notificación
que no lleva a Inicio, y las pruebas reales en el iPhone del titular y en un
Android físico. Si el interruptor sigue
siendo uno solo (`activar-push` enciende a la vez la web y Android), hacen
falta todas; si se separa, cada canal solo necesita las suyas.

En una línea por tema:

- **Servicios de push de los navegadores:** no son encargados de RWAdar; son
  el servicio de entrega que eligió el navegador de cada persona, como su
  proveedor de correo. Google y Microsoft están en el DPF; Apple no, pero en
  el EEE responde Apple Distribution International (Irlanda), con cláusulas
  tipo; Mozilla no, y queda como riesgo residual bajo aceptado a sabiendas
  (si el envío cuenta como transferencia, que es lo más probable, no tiene
  garantía del art. 46), a la vista y explicado.
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
(`rwadar-app/db/32_notificaciones.sql`), leídos hoy. Desde la migración 33
(`rwadar-app/db/33_webpush_supabase.sql`), el envío a todos lo hace el
servidor de la web (`rwadar-acceso/webpush-servidor.mjs`) con el mismo
cifrado, la misma firma y las mismas cabeceras; `enviar-webpush.mjs` queda
para la prueba de administración:

| Recibe | Qué es | ¿Dato personal para el servicio? |
|---|---|---|
| **La dirección de la suscripción** (`endpoint`) | Una URL que **el propio servicio** dio al navegador de la persona cuando activó las notificaciones. El servicio ya la tiene: se la dio el navegador, no RWAdar | Sí: identifica un navegador de un dispositivo |
| **La hora del envío** y las cabeceras `TTL: 86400` (un día), `Urgency: high` y `Content-Encoding: aes128gcm` | Cuándo hay un aviso para ese navegador y cuánto tiempo guardarlo si el móvil está apagado | Sí, unida a la dirección |
| **El tamaño** del mensaje cifrado | La carga del aviso (su JSON) más 103 octetos fijos (relleno mínimo): deja adivinar la longitud del aviso, no su contenido | Muy poco: todos los suscritos reciben el mismo aviso |
| **El mensaje cifrado de extremo a extremo** (RFC 8291) | `{v, titulo, texto, url, etiqueta}` cifrado con las claves del navegador. El servicio no tiene esas claves y no lo puede leer. La `url` es siempre `https://rwadar.pages.dev/?avisos=1` (con `#emisiones` si va al radar): sin datos de la persona ni marcas de seguimiento | No lo puede leer |
| **La firma VAPID** (RFC 8292) | Un JWT con `aud` (el servicio), `exp` (12 horas) y `sub = mailto:rwadares@gmail.com`, y la clave pública de RWAdar | No es dato de la persona: identifica a RWAdar |
| **La IP del remitente** | Desde la 33, la de Cloudflare (el servidor de la web, que entrega); en la prueba de administración, la de la máquina de GitHub Actions. Nunca la de la persona | No es dato de la persona |

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

**La lectura B es la más probable** (corrección del 12/11/2026, tras la
revisión independiente). El ejemplo 1 del CEPD trata de datos que la propia
persona entrega al destinatario; aquí es el remitente de RWAdar (desde la 33,
el servidor de su web en Cloudflare, a petición de su base de datos) quien hace el envío a cada servicio con el aviso y su hora, unidos a
la dirección de entrega: eso es el segundo criterio de las Directrices (el
exportador transmite). La lectura A no es descabellada, pero su apoyo es débil.
**Por eso se comprueba la B para cada servicio:**

| Servicio | DPF (lista oficial, 12/11/2026) | En el EEE responde, según su política | Sus propias salidas del EEE | Con la lectura B |
|---|---|---|---|---|
| **Google** | Google LLC, n.º 5780, UE-EE. UU. «Active», datos que no son de RR. HH. incluidos; próxima renovación, el 13/09/2027. Su alcance: «supplying services and products to consumers and businesses» | Google Ireland Limited (Gordon House, Dublín) | DPF y cláusulas tipo (su página de marcos, en vigor desde el 23/08/2025) | **Cubierto** [SEGURO en cuanto a la adhesión] |
| **Microsoft** | Microsoft Corporation, n.º 6474, UE-EE. UU. «Active»; próxima renovación, el 31/08/2027. Alcance: los usuarios de sus productos | Microsoft Ireland Operations Limited (Dublín) | DPF y cláusulas tipo | **Cubierto** |
| **Apple** | **No figura** (búsquedas «Apple», «Apple Inc» y «Apple Distribution», cualquier estado: 0 resultados) | Apple Distribution International Limited, Irlanda: «Personal data relating to individuals in the European Economic Area […] is controlled by Apple Distribution International Limited in Ireland» | «Apple’s international transfer of personal data collected in the European Economic Area […] is governed by Standard Contractual Clauses» | **Cubierto si quien recibe es la empresa de Irlanda:** entonces RWAdar comunica dentro del EEE y la salida a EE. UU. es de Apple, con sus cláusulas tipo. **Verificar** que el push web también lo controla ADI (la política no lo nombra) |
| **Mozilla** | **No figura** (búsquedas «Mozilla» y «Mozilla Corporation», cualquier estado: 0 resultados) | No nombra una empresa en la UE. «Mozilla (and our servers) are based in the United States». Su delegado de protección de datos para el EEE: Bird & Bird DPO Services SRL (Bruselas) | Cláusulas tipo «where applicable» para lo que comparte con sus socios | **Sin una garantía que pueda aportar RWAdar:** no hay contrato con Mozilla, así que no puede haber cláusulas tipo entre los dos |

**Mozilla: se acepta a sabiendas como riesgo residual bajo, a la vista.** Con
la lectura B, la más probable, para Mozilla no hay una garantía del art. 46
que pueda aportar RWAdar. Se acepta por esto:

1. Con la lectura A, que es defendible, no habría transferencia de RWAdar.
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

**Salida sin coste, si Víctor prefiere quitarse este riesgo** (decisión suya,
no hecha): en la web, si la suscripción sale con el servidor de Mozilla,
anularla, no registrarla y decir «En Firefox, mira los avisos en la campana»;
el remitente se saltaría además esas direcciones. La base no cambia y la
privacidad pasaría de explicar el riesgo a decir que en Firefox no se ofrecen.

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

### 1.5 Quién cifra y envía: Supabase y Cloudflare (antes, GitHub)

**Cómo era (migración 32).** El remitente se ejecutaba en máquinas de GitHub
Actions (flujo «Notificaciones web»). Allí estaban en claro, mientras duraba
cada envío, la dirección de entrega y las dos claves de cada navegador, el
texto del aviso y la clave privada VAPID. GitHub está en el DPF (n.º 6174,
«Active» hoy a las 16:18 UTC), así que el viaje estaba cubierto. Lo que faltaba
es el **contrato de encargo** (art. 28.3): con una cuenta personal gratuita,
GitHub no aplica su DPA ([encargados](encargados/README.md#github--hueco)).
Encargar un tratamiento sin ese contrato es infracción grave (LOPDGDD, art.
73.k). Por eso pasó de «recomendado» a **condición** (C3): firmar el contrato
(GitHub Team, unos 4 $ al mes) o ejecutar el envío en un proveedor que ya lo
tiene (Supabase o Cloudflare).

**Cómo queda (migración 33, 12/11/2026 por la tarde; Víctor: «hazlo en
Supabase mientras y ya haremos el cambio»).**

- **Supabase** (encargado con DPA, en Irlanda) guarda las suscripciones y,
  con el reloj de cada 5 minutos y el push encendido, pide cada envío con
  pg_net al servidor de la web. La clave privada VAPID sale de su Vault solo
  en una cabecera de esa petición.
- **Cloudflare** (encargado con DPA, que ya aloja la web y sus sesiones)
  recibe en `/api/interno/webpush` la dirección de entrega, las dos claves del
  navegador y el texto del aviso; comprueba que quien llama tiene la clave de
  RWAdar, lo cifra (RFC 8291), lo firma (RFC 8292) y lo entrega al servicio
  de push. No lo guarda ni lo escribe en registros, y solo admite los cuatro
  servicios de push de la regla de la base.
- **GitHub** ya no envía a todos: «Avisar novedad» no lo llama y la acción
  «enviar» se retiró. Solo queda la acción «prueba», a mano, que va a las
  cuentas de administración: son datos del propio titular, no de terceros.
  Las copias de cada noche ya no llevan las suscripciones ni sus envíos
  (`copia-seguridad.sh`, sin filas en `suscripciones_web` y `envios_web`).

**C3 queda hecha en el código.** Se cumple cuando estén publicadas la web con
`/api/interno/webpush` y aplicada la 33 (los dos antes de `activar-push`). El
hueco general de GitHub (las copias y los flujos de la base) sigue como estaba
y se cierra con GitHub Team (decisión del 06/11).

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
avisos en Inicio (RGPD, art. 7.4). La frase junto al botón de la OTA n.º 23
dice que el identificador «lo reciben Expo y Google», pero no habla del
latido: hace falta la frase de 2.4 (condición C5), ya en el código desde el
12/11/2026 a la espera de la OTA.

**Resto de riesgo, aun con la OTA publicada.** La app aplica una OTA en el
siguiente arranque en frío, no en el que la descarga (`app.json`:
`checkAutomatically` «ON_LOAD» y `fallbackToCacheTimeout` 0;
`lib/actualizaciones-app.js`). Quien abra la app por primera vez después de
mucho tiempo, ya con el envío encendido, arranca una vez con el código de la
OTA n.º 23, y su botón se habilita igual, porque depende de `push_activo`, que
da el servidor. Esa persona ve una vez el texto antiguo, que ya dice que Google
recibe el identificador, y la privacidad (§5) lo explica entero. Por eso C5
pide la OTA **ya en uso** y no solo publicada. El arreglo completo sería que el
servidor diera `push_activo` solo a las versiones que declaren el texto nuevo:
pide un parámetro nuevo en la RPC y una migración, no compensa hoy y queda
anotado.

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

Van junto al botón, antes de pulsarlo, y deben estar publicadas (la de la app,
ya en uso) antes de encender el canal. Están en el código desde el 12/11/2026,
palabra por palabra; `probar-web.mjs` comprueba que coinciden con este
apartado, en castellano y en inglés.

**App de Android** (párrafo propio bajo «Notificaciones en este móvil»,
`TEXTO_MOVIL_QUIEN` en `rwadar-movil/componentes/AvisosNovedades.js`, después
del texto del identificador cuando sale; también con ellas activadas. Solo en
Android: en un iPhone no hay Firebase, y si se pusiera al final de
`TEXTO_MOVIL` saldría también allí):

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

**Web** (párrafo propio bajo «Activar» o «Desactivar notificaciones en este
móvil», `TEXTO_PUSH_QUIEN` en `rwadar-site/assets/rwadar-20260820.js`; sigue
al texto de estado, que ya dice que viajan cifradas por el servicio de Apple,
Google, Mozilla o Microsoft. Se ve también con ellas activadas, para que lo lea
quien las activó con la web n.º 71, y acaba en «Más en Privacidad.», con
enlace a `/privacidad#garantias-push`):

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
- **Android:** cumple, con C7 publicada.
  - Cada anuncio llega por el canal «Novedades de RWAdar» (`novedades`); la
    bienvenida, por «Avisos de tu cuenta» (`cuenta`).
  - Android deja desactivar el canal desde la propia notificación
    (mantenerla pulsada): es una baja en cada aviso, sencilla y gratuita.
  - Al tocarla, los anuncios corrientes abren Inicio, cuya tarjeta «Avisos»
    acaba con la misma frase y lleva a Perfil › Avisos.
  - Los anuncios de ofertas abren Buscar y los de la Academy, la Academy,
    donde no está esa tarjeta. Para medir con la misma vara que la web (donde
    la baja en cada notificación se trató como bloqueante), al abrirlos sale
    arriba la misma frase con su enlace a Perfil › Avisos (condición C7; en el
    código desde el 12/11/2026, sale con la misma OTA que C5).
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
navegadores (GitHub ya no hace falta: desde la 33 no interviene en el envío).
No bloquea: la suscripción no se recoge al activar el
interruptor, sino al pulsar el botón de cada dispositivo, y junto a ese botón
la web ya nombra a Apple, Google, Mozilla y Microsoft. Mejor completarlo en el
próximo cambio de textos (R3).

---

## 4. Conclusión y condiciones

**Sí, con condiciones.** Antes de `activar-push`:

| | Condición | Canal | Quién | Estado (12/11/2026) |
|---|---|---|---|---|
| **C1** | **Privacidad publicada** con lo de este anexo (§5 y §8, en este commit). Mientras la publicada diga que la garantía «se comprobará», no se envía | Los dos | Publicar la web, con orden de Víctor | Hecho en el repositorio; falta publicar |
| **C2** | **Frase de primera capa de la web** (2.4), con su inglés, publicada | Web | Publicar la web, con orden de Víctor | Hecho en el repositorio (12/11); falta publicar |
| **C3** | **GitHub con contrato de encargo**: organización con GitHub Team y «GitHub Customer Agreement» firmado (incluye el DPA). **O bien** el envío de la web en un proveedor que ya lo tiene (Supabase o Cloudflare) | Web | Víctor (contrato) o código | **Hecha en el código** (12/11, tarde): migración 33 y `/api/interno/webpush`; envían Supabase y Cloudflare (1.5) y GitHub solo hace la prueba de administración. Falta publicar la web y aplicar la 33 |
| **C4** | **Prueba real en el iPhone del titular** (entrada 9 del traspaso): llega «Prueba de RWAdar», sale el «1» y al tocarla se abre la lista con la baja | Web | Víctor | Pendiente |
| **C5** | **Frase de primera capa de la app** (2.4), con su inglés, en una OTA **publicada y ya en uso**: enviarla varios días antes de `activar-push` y comprobar en EAS (arranques por actualización) que la mayoría de los arranques usan la OTA nueva. Resto de riesgo en 2.3.a | Android | OTA con orden de Víctor; comprobación en EAS | Hecho en el repositorio (12/11); falta la OTA y que esté en uso |
| **C7** | **Baja a la vista al abrir en la app una notificación que no lleva a Inicio** (ofertas a Buscar; Academy): arriba, «¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.», con enlace a Perfil › Avisos (3.1). Antes era la recomendación R2 | Android | En la misma OTA que C5 | Hecho en el repositorio (12/11); falta la OTA |
| **C6** | **Prueba en un Android físico** (la «ronda 3» del plan): sin pulsar el botón, ninguna conexión a Firebase al abrir la app; al pulsar, permiso, canal y la frase de C5; baja manteniendo pulsada la notificación y en Perfil; y **verificar** qué hace Firebase después de desactivarlas | Android | Víctor, con un Android prestado | Pendiente |

**Recomendado, no bloquea:**

- **R1.** En el diálogo de la campana, la baja a la vista al abrir. **Hecho**
  (`76ebc8e`): la frase y el botón van en un pie fijo, fuera de la lista que se
  desplaza; comprobado a 390 × 844 con 10 avisos, también con la lista al
  final. Falta publicar la web.
- **R2.** Pasa a ser la condición C7.
- **R3.** Completar la «Información básica» con «el servicio de
  notificaciones de tu navegador» (desde la 33, sin GitHub).
- **R4.** En la próxima versión nativa de Android: Firebase solo se crea al
  pulsar el botón (quitar `FirebaseInitProvider` del arranque e iniciarlo a
  mano), para que el latido no se guarde sin consentimiento.
- **R5.** Si algún día cambia el texto versionado, «en mi móvil o tableta».
- **R6.** En la app, con el correo apagado, quitar «o con el enlace de cada
  correo» del mensaje de alta. **Hecho** (`f3c2986`); llega con la OTA.
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
- **§6 y §8, quién envía (tarde del 12/11, migración 33):** las
  notificaciones de la web las envía la base de datos (Supabase) a través del
  servidor de la web (Cloudflare), que las cifra y entrega sin guardarlas. La
  entrada de Cloudflare dice qué recibe para cada envío; la de Supabase, que
  guarda la suscripción y pide cada envío; la de GitHub, que ya no interviene
  en las notificaciones de la web. En las transferencias, GitHub sigue en el
  DPF (por la página de descargas), sin «que envía las notificaciones».

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

---

## 7. Notificaciones sin cuenta (14/11/2026)

**Encargo de la dirección (14/11/2026):** «que salga tanto en iPhone como en
Android; muy importante que funcionen las notificaciones y los avisos aunque
no tengan cuenta o no hayan iniciado sesión: que puedan activarlas». Contrato
técnico: [`AVISOS-SIN-CUENTA-2026-11-14.md`](../tareas/AVISOS-SIN-CUENTA-2026-11-14.md);
registro: A5, «Sin cuenta» (versión 9). Redactado por Claude (IA); no es el
dictamen de un abogado.

### 7.1 Qué cambia y qué no

- **No cambia** lo de los apartados 1 a 3: los mismos servicios de push (no
  son encargados, 1.2), las mismas transferencias (1.3), el mismo envío desde
  Supabase y Cloudflare (1.5) y el mismo «latido» de Firebase en la app (2).
- **Cambia** quién da el permiso: una persona sin cuenta. No hay correo ni
  nombre: solo la suscripción del navegador (dirección de entrega y sus dos
  claves) o el identificador de Expo, con la versión del texto, el idioma, el
  origen y las fechas, en tablas aparte sin usuario. El historial del permiso
  guarda un número al azar, no la dirección.

### 7.2 Base jurídica y consentimiento [SEGURO]

Consentimiento (RGPD, art. 6.1.a; LSSI, arts. 21 y 22.2). El texto versionado
`sin-cuenta-v1-2026-11-14` va junto al botón, tal cual, en el idioma de la
página, y se guarda la versión y el idioma con el alta (art. 7.1: poder
demostrarlo). El botón es el acto afirmativo; el sistema o el navegador pide
después su propio permiso. Al lado, la información básica sin cuenta (primera
capa, RGPD art. 13): responsable, finalidad, base, datos, proveedores, plazos
y derechos, con «Privacidad» enlazada a §6 «Notificaciones sin cuenta».

### 7.3 Frases de primera capa sin cuenta (texto exacto)

- **Web** (junto al botón; variante de 2.4 sin la campana, que sin cuenta no
  existe): «El servicio de tu navegador puede estar fuera de la UE: ve la hora
  de cada aviso, pero no puede leer su texto. Si no las activas, las novedades
  siguen en la web. Más en Privacidad.» Inglés: «Your browser's service may be
  outside the EU: it sees when each notice is sent, but cannot read its text.
  If you don't turn them on, the news is still on the website. More in
  Privacy.»
- **App** (C5 sin cuenta; sin «Inicio», al que sin cuenta no se llega): «Con
  ellas activadas, el componente de notificaciones de Google (Firebase) envía
  también a Google las fechas en que abres la app (hasta 30) y datos técnicos
  del móvil, que usa para sus estadísticas. Si no las activas, no le llega
  nada.»

### 7.4 Edad [INTERPRETABLE; decisión de la dirección]

No se puede comprobar la edad de quien activa sin cuenta. Decisión de la
dirección (14/11/2026): el texto del permiso dice «Solo para mayores de 18
años», igual que con cuenta, y no se comprueba más. La privacidad (§12) lo
repite. Riesgo residual bajo: el contenido es informativo y no comercial.

### 7.5 Derechos sin identificar a la persona (RGPD, art. 11) [SEGURO]

RWAdar no pide datos para identificar a quien activa sin cuenta. La supresión
y la oposición se ejercen con el botón de desactivar o los ajustes del móvil,
que borran al momento. Para otra solicitud, la persona puede escribir y dar
algo que permita encontrarla (art. 11.2); la privacidad (§6 y §11) lo dice.

### 7.6 La baja en cada aviso (LSSI, art. 21.2) [SEGURO]

- **Web:** cada notificación abre `?avisos=1`; sin sesión, la lista de avisos
  publicados con «¿No quieres estos avisos? Desactívalos aquí o en los ajustes
  del móvil.» y el botón «Desactivar las notificaciones de este móvil», a la
  vista sin desplazar.
- **App:** sin sesión, la notificación abre la pantalla de acceso; si se abre
  desde una notificación, el bloque sin cuenta pone arriba la misma frase y su
  botón (C7 sin cuenta). Con sesión, lo de C7.

### 7.7 Condiciones para `activar-sin-cuenta`

| | Condición | Quién | Estado |
|---|---|---|---|
| **S1** | La privacidad con §2, §5, §6 «Notificaciones sin cuenta», §8, §9, §11 y §12 nuevos, **publicada en el mismo despliegue** que la web | Publicar la web, con orden de Víctor | Hecho en el repositorio; falta publicar |
| **S2** | La 36 aplicada y verificada (`ensayo-36`, `aplicar-36`, `verificar-36`) | Víctor (flujo) | Pendiente |
| **S3** | Prueba real en un iPhone (web en la pantalla de inicio) y en un Android: activar, `prueba-sin-cuenta`, tocarla (se abre la lista con la baja) y «Desactivar» | Víctor | Pendiente |
| **S4** | La OTA con el bloque de la app, después de la web (la app llama a `/api/avisos/movil` en producción); C5 y C6 siguen valiendo | OTA con orden de Víctor | Hecho en el repositorio; falta la OTA |

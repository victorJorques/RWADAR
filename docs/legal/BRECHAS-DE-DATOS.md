# Brechas de datos · qué hacer si pasa algo

**Fecha:** 07/11/2026.
**Quién lo lleva:** Víctor Manuel Jorques Granero, titular de RWAdar y
responsable del tratamiento. Él decide si se avisa a la Agencia Española de
Protección de Datos (AEPD) y a las personas afectadas.
**Quién lo ha redactado:** Claude (IA), a petición del titular. No es el
dictamen de un abogado.
**Cada cuánto se revisa:** después de cada brecha, cuando cambie un proveedor y,
como mínimo, con el registro de actividades (antes del 06/11/2027).

**Fuentes** (consultadas el 07/11/2026):

- RGPD, arts. 4.12, 33 y 34:
  https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679
- LOPDGDD, arts. 73 y 74 (infracciones):
  https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- AEPD, «Notificación de brechas de datos personales a la Autoridad de
  Control»:
  https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/brechas-de-datos-personales-notificacion
- AEPD, «Guía para la notificación de brechas de datos personales» (junio de
  2021): https://www.aepd.es/documento/guia-brechas-seguridad.pdf
- Los contratos de encargo de cada proveedor:
  [`encargados/README.md`](encargados/README.md).

---

## Lo esencial

1. **Quien vea algo raro avisa a Víctor en el momento.** No hace falta estar
   seguro.
2. **Primero se contiene:** se cortan los accesos y se cambian las claves. Las
   pruebas no se borran.
3. **72 horas para avisar a la AEPD**, contadas desde que Víctor sabe que el
   incidente ha tocado datos personales. Cuentan también los fines de semana y
   los festivos. Solo se puede no avisar si es improbable que haya riesgo para
   las personas.
4. **Si el riesgo para las personas es alto, se les avisa a ellas también**,
   sin esperar.
5. **Toda brecha se apunta en el registro de abajo, aunque no se avise a
   nadie.**

---

## Qué es una brecha

El RGPD (art. 4.12) la define así: «toda violación de la seguridad que ocasione
la destrucción, pérdida o alteración accidental o ilícita de datos personales
transmitidos, conservados o tratados de otra forma, o la comunicación o acceso
no autorizados a dichos datos».

Dicho en llano, hay tres tipos:

- **alguien ve lo que no debe** (confidencialidad);
- **los datos cambian sin querer o sin permiso** (integridad);
- **los datos se pierden o no se pueden usar** (disponibilidad).

**Ejemplos que podrían pasar en RWAdar:**

| Qué pasa | Por qué es (o puede ser) una brecha |
|---|---|
| Se filtra la conexión de la base (`SUPABASE_DB_URL`) o un token personal de Supabase | Da acceso a todas las cuentas: correos, resúmenes de contraseñas, IP de alta y acceso, listas de seguimiento, carteras y permisos de avisos |
| Se filtra la clave de las copias (`COPIA_CLAVE`) junto con una copia | Las copias llevan las cuentas (A13 del registro). GitHub guarda las dos cosas |
| Una copia descifrada se queda en un ordenador perdido, robado o compartido | Está en claro |
| Un fallo de permisos o del servidor web enseña a una cuenta datos de otra | Acceso no autorizado |
| Entran en el Gmail que envía hoy las confirmaciones y recuperaciones | Ve los enlaces de recuperación: puede entrar en cuentas ajenas |
| Un correo manual a varias personas con todas las direcciones a la vista | Comunicación no autorizada de los correos |
| La base se borra o se estropea y la copia no sirve | Pérdida de datos (disponibilidad) |
| Un proveedor avisa de una brecha suya que toca datos de RWAdar | Brecha del encargado: también nos obliga (ver «Si la brecha es de un proveedor») |
| Se sube por error un dato personal a la web o al repositorio público de descargas | Comunicación no autorizada |

**No suele ser brecha, pero se apunta igual como incidente:** un ataque
bloqueado sin acceso a datos, o un token filtrado que se revoca sin que nadie
lo haya usado y que no daba acceso a datos personales. Si hay dudas, se trata
como brecha hasta saber más.

---

## Los pasos, en orden

### Paso 0 · Avisar (en el momento)

- Quien lo detecte avisa a Víctor por el canal más rápido: Víctor, Eric
  Almiñana, Samuel Rodriguez, Codex, Claude, o un reporte que llegue a
  rwadares@gmail.com.
- **Codex y Claude paran** lo que estén haciendo y se lo cuentan. No tocan
  producción, no publican y no borran nada sin la orden de Víctor.
- **Se apunta la hora.** El plazo de 72 horas «empieza a calcularse desde el
  instante en que el responsable de tratamiento tenga constancia de que el
  incidente de seguridad ha afectado a datos personales, incluyendo las horas
  trascurridas durante fines de semana y días festivos» (Guía de la AEPD,
  apartado «Plazos para notificar»).

### Paso 1 · Contener (primeras horas)

- **Credenciales:** seguir
  [`../seguridad/RUNBOOK-REVOCACION-ROTACION.md`](../seguridad/RUNBOOK-REVOCACION-ROTACION.md)
  (contener, revocar, investigar la ventana, rotar y revisar Git).
- **Correo de avisos**, si está encendido y algo va mal: acción `apagar` del
  flujo «Avisos a registrados (base)» (`30_avisos_registrados_apagar.sql`).
- **Tokens de proveedores** (Lettermint, Cloudflare, Expo, GitHub): revocar en
  su panel el afectado y crear otro. Lettermint permite revocar un token sin
  tocar los demás; por eso hay uno por uso (contrato de avisos, punto 5.4).
- **Guardar las pruebas:** capturas, registros de Supabase (Logs), de
  Cloudflare y de las ejecuciones de GitHub Actions, y los correos recibidos.
  Sin datos de nadie en Git: las pruebas con datos personales se guardan
  fuera del repositorio.
- Quitar la web o el catálogo solo si Víctor lo ordena (`AGENTS.md`).

### Paso 2 · Entender qué ha pasado (lo antes posible)

Responder a estas preguntas, aunque sea de forma aproximada:

1. ¿Qué datos? (Los que tiene RWAdar están en el
   [registro de actividades](REGISTRO-ACTIVIDADES-TRATAMIENTO.md), fichas
   A1 a A14.)
2. ¿De cuántas personas, más o menos?
3. ¿Desde cuándo y hasta cuándo?
4. ¿Estaban cifrados, y la clave sigue a salvo?
5. ¿Se puede identificar a las personas con lo que ha salido?
6. ¿Qué les puede pasar? Lo más delicado en RWAdar: correo y contraseña
   (mucha gente repite contraseñas, aunque RWAdar solo guarda un resumen no
   reversible), y la cartera, que puede revelar su situación económica.
7. ¿Ya está cortado?

Ayuda: la herramienta **Asesora Brecha** de la AEPD
(https://www.aepd.es/guias-y-herramientas/herramientas/asesora-brecha). Es una
ayuda: la decisión sigue siendo de Víctor.

### Paso 3 · ¿Se avisa a la AEPD? (antes de 72 horas)

- **Sí**, salvo que sea improbable que la brecha suponga un riesgo para los
  derechos y libertades de las personas (RGPD, art. 33.1).
- **Cómo:** por internet, con el formulario de la Sede Electrónica de la AEPD
  (https://sedeaepd.gob.es/sede-electronica-web/vistas/infoSede/nbs/guiadoBrechasInicio.jsf).
  Hace falta un **certificado electrónico reconocido** (por ejemplo, el del
  DNIe o el de la FNMT) o **Cl@ve permanente o PIN24H** (Guía, apartado
  «Cómo se debe notificar»). La guía también ofrece un modelo en PDF para
  quien no está obligado a relacionarse con la Administración por medios
  electrónicos, como una persona física. **Que Víctor tenga el certificado o
  la Cl@ve listos antes de necesitarlos.** El 07/11/2026 la página de la sede
  no se pudo abrir desde aquí (error 500): **verificar** que el enlace sigue
  valiendo.
- **Qué se cuenta, como mínimo** (art. 33.3):
  - qué ha pasado, cuántas personas y cuántos registros, más o menos;
  - un contacto: Víctor, en rwadares@gmail.com;
  - qué consecuencias puede tener;
  - qué se ha hecho y qué se va a hacer.
- **Si aún no se sabe todo:** se manda una notificación «inicial» antes de las
  72 horas y se completa después con una «modificación», en un máximo de 30
  días hábiles (Guía, apartado «Plazos para notificar»; art. 33.4).
- **Si ya pasaron las 72 horas:** se notifica igual, explicando por qué el
  retraso (art. 33.1).

### Paso 4 · ¿Se avisa a las personas? (sin esperar)

- **Sí, si es probable un alto riesgo** para ellas (art. 34.1), en lenguaje
  claro: qué ha pasado, el contacto, las consecuencias posibles y lo que se ha
  hecho (art. 34.2). Mejor aún si se les dice qué pueden hacer ellas (por
  ejemplo, cambiar la contraseña si la usan en otros sitios).
- **No hace falta** (art. 34.3) si:
  - los datos estaban cifrados y la clave sigue a salvo (por ejemplo, una copia
    cifrada filtrada sin `COPIA_CLAVE`);
  - lo que se hizo después ya elimina ese alto riesgo;
  - avisar a cada una supondría un esfuerzo desproporcionado: entonces se
    publica un aviso igual de eficaz (por ejemplo, en la web, con la orden de
    Víctor).
- **Cómo, en RWAdar:** un correo **a cada persona por separado**, nunca con
  todas las direcciones a la vista. Desde rwadares@gmail.com o, si el
  correo de Lettermint ya está encendido, por su ruta de servicio (cuenta para
  el cupo de 300 al mes del plan gratis).
- La AEPD puede exigir que se avise a las personas (art. 34.4).
- Ayuda para redactarlo: **Comunica-Brecha RGPD**
  (https://www.aepd.es/guias-y-herramientas/herramientas/comunica-brecha-rgpd).

### Paso 5 · Apuntarlo en el registro (siempre)

El RGPD obliga a documentar **cualquier** brecha, «incluidos los hechos
relacionados con ella, sus efectos y las medidas correctivas adoptadas»
(art. 33.5), se haya notificado o no. No hacerlo es una infracción leve
(LOPDGDD, art. 74.n). Se apunta en el registro de abajo.

### Paso 6 · Arreglar y aprender

- Arreglar la causa y comprobar que está arreglada.
- Revisar el [registro de actividades](REGISTRO-ACTIVIDADES-TRATAMIENTO.md),
  este documento y, si hace falta, la privacidad.
- Si la causa fue un proveedor, valorar si se sigue con él.

---

## Si la brecha es de un proveedor

Cada encargado tiene que avisarnos «sin dilación indebida» (RGPD, art. 33.2).
Lo que cada contrato añade, y por dónde nos avisaría:

| Proveedor | Qué datos de RWAdar tiene | Cuándo tiene que avisar (su contrato) | Por dónde avisa | Para escribirle |
|---|---|---|---|---|
| **Supabase** | Base de datos y cuentas: todo lo de A1-A7, A9, A10, A13 y A14 | «without undue delay, and where feasible, within forty-eight (48) hours» (DPA) | «to the contact details for Customer associated with its Supabase account» (DPA) | Soporte desde el panel; privacy@supabase.io (DPA, anexo); vulnerabilidades: https://hackerone.com/supabase |
| **Cloudflare** | Web, sesión, IP y analítica | «without undue delay» (DPA) | Correo de la cuenta (**verificar**) | Su delegado de protección de datos: legal@cloudflare.com (DPA, anexo); vulnerabilidades: https://hackerone.com/cloudflare |
| **Google Firebase** | Hoy nada; con el push, el identificador del móvil y el «latido» | «promptly and without undue delay» (§7.2.1) | «Notification Email Address» (§7.2.3): **verificar** cuál está puesta en la consola | Soporte de Firebase (**verificar** el canal) |
| **Expo** | IP, plataforma, versión y un identificador de instalación; con el push, el token | «Sin dilación indebida»: cláusulas tipo, módulo 2, cláusula 8.6.c, que su §3.2 incorpora | Correo de la cuenta de Expo (**verificar**) | vulnerability-disclosures@expo.dev (su `security.txt`); para privacidad, **verificar** |
| **GitHub** | Copias cifradas y su clave; los flujos ven los datos en claro | **Hoy sin contrato de encargo:** no hay obligación contractual (hueco). Con el DPA de GitHub Team: «without undue delay» | Correo de la cuenta | dpo@github.com y https://support.github.com/contact/privacy (DPA) |
| **Lettermint** (cuando se encienda) | Correos y su contenido, 28 días | «without undue delay and in any event within twenty-four (24) hours» (§10.1) | Correo de la cuenta de Lettermint | legal@lettermint.co (DPA); security@lettermint.co (su `security.txt`) |
| **Netlify** | IP y datos técnicos de quien abre `rwadar.netlify.app` | «without undue delay, but in any event within forty-eight (48) hours» (§10.1) | Correo de la cuenta (**verificar**) | privacy@netlify.com (DPA, anexo) |
| **Google (Gmail)**, el buzón (desde el 12/11/2026) | El buzón rwadares@gmail.com: consultas, derechos, bajas, empresas, reportes de seguridad y contactos profesionales | Cuenta de consumo, sin contrato: no hay obligación (hueco hasta el dominio propio) | **verificar** | **verificar** |
| **Gmail** (hasta pasar Auth a Lettermint) | Confirmaciones y recuperaciones de contraseña | Cuenta de consumo, sin contrato: no hay obligación | — | — |

**Qué hacer cuando avisa un proveedor:**

1. Pedirle lo que falte: qué datos, cuántas personas, desde cuándo y qué ha
   hecho.
2. Seguir los pasos 2 a 6. Las 72 horas de RWAdar cuentan desde que Víctor
   sabe que hay datos personales afectados, no desde la brecha.
3. Apuntarlo en el registro.

**Para que el aviso llegue:** cada proveedor escribe al correo de la cuenta
de RWAdar en su panel. Víctor tiene que revisar esos buzones. **Verificar**
qué correo tiene puesto cada cuenta y, en Firebase, la «Notification Email
Address».

---

## Lo que cuesta no hacerlo

- No avisar a la AEPD cuando toca: infracción **grave** (LOPDGDD, art. 73.r).
- Avisar tarde, incompleto o mal: **leve** (art. 74.m).
- No documentar una brecha: **leve** (art. 74.n).
- No avisar a las personas cuando hay alto riesgo: **leve** (art. 74.ñ), o
  **grave** si la AEPD lo había exigido (art. 73.s).

---

## Registro de brechas (RGPD, art. 33.5)

**Dónde:** aquí, **sin datos personales** (solo categorías y cifras
aproximadas). Lo que lleve nombres, correos o pruebas con datos se guarda
fuera de Git, donde Víctor diga, y aquí solo se anota que existe.

**Qué se apunta de cada una:**

| Campo | Qué poner |
|---|---|
| N.º | 2026-01, 2026-02… |
| Detectada | Fecha y hora, y quién la vio |
| Constancia de Víctor | Fecha y hora: desde aquí cuentan las 72 horas |
| Qué pasó | En dos o tres frases |
| Tipo | Confidencialidad, integridad o disponibilidad |
| Datos y personas | Categorías de datos y número aproximado de personas y registros |
| Riesgo | Improbable, riesgo o alto riesgo, y por qué |
| AEPD | Notificada (fecha y número de registro de entrada) o no, y por qué |
| Personas | Avisadas (fecha y cómo) o no, y por qué |
| Medidas | Qué se hizo para cortarla y para que no se repita |
| Cerrada | Fecha |

**Brechas apuntadas:**

| N.º | Detectada | Qué pasó | Tipo | Datos y personas | Riesgo | AEPD | Personas | Medidas | Cerrada |
|---|---|---|---|---|---|---|---|---|---|
| — | — | Ninguna apuntada hasta el 07/11/2026 | — | — | — | — | — | — | — |

**Incidentes anteriores a este registro** (para que Víctor decida si alguno se
apunta como brecha):

- **21/09/2026 · token personal de Supabase en un commit del 14/08/2026**, en el
  repositorio privado. Víctor declaró el 27/09/2026 que ya estaba revocado. El
  informe dice que no demuestra por sí solo que haya habido abuso
  ([`../seguridad/INCIDENTE-P0-CREDENCIAL-HISTORICA-2026-09-21.md`](../seguridad/INCIDENTE-P0-CREDENCIAL-HISTORICA-2026-09-21.md)).
  No consta que se valorara como brecha ni que se notificara. **verificar:**
  Víctor decide si se apunta aquí como brecha no notificada (con el motivo:
  riesgo improbable) o como incidente sin datos personales afectados.

---

## Historial de este documento

| Fecha | Cambio | Quién |
|---|---|---|
| 07/11/2026 | Primera versión: pasos, plazos, contactos de cada proveedor y registro | Claude, por encargo de Víctor |
| 12/11/2026 | El buzón pasa de Proton Mail a Gmail (rwadares@gmail.com): la fila del buzón, a Google (Gmail) | Claude, por encargo de Víctor |

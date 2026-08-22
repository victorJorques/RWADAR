# RWAdar

Registro curado de plataformas de tokenización de activos reales. La versión
pública muestra **26 plataformas en el radar y 4 descartadas con fuente**:
[rwadar.pages.dev](https://rwadar.pages.dev).

## Estado real · 22 de agosto de 2026

RWAdar **no se considera terminado**. Conviven dos estados que no deben
confundirse:

| Pieza | Estado |
|---|---|
| Web pública | **GO en Cloudflare Pages**: `https://rwadar.pages.dev`; versión endurecida, pre-renderizada e instalable como PWA, con 26 fichas y 4 descartadas |
| Sección pública de emisiones | Visible como bloque prioritario de `Buscar`; producción tiene 0 emisiones y muestra un vacío explícito, sin ofertas, cifras ni filtros inventados |
| Artefacto web | Web 219/219; 26/4/0 y suite raíz con código 0. Producción `a0be7029-6281-47dd-963d-9c397a18848b` (`https://a0be7029.rwadar.pages.dev`); canonical `https://rwadar.pages.dev`; bytes y cabeceras verificados |
| Base de producción | La migración 22 (`02F2...0666`) terminó en `COMMIT` en `exgpmjpaaebyoolpwced`; el resultado mostró `schedule=19`. El verificador SQL interno (`4182...2C3`) terminó correctamente y el smoke público posterior quedó verde. Security Advisor: 0 Critical y 0 Security Definer View |
| Cuentas | El radar completo se consulta sin cuenta. El login de cuentas existentes sigue disponible. Aunque Auth conserva Confirm email y devuelve `mailer_autoconfirm=false`, no hay SMTP propio probado: las altas y la recuperación públicas están pausadas y fallan cerradas, sin enviar solicitudes a Supabase |
| Avisos por correo | **OFF en producción.** La 23 está GO solo local; faltan Brevo, secreto y remitente en Vault y prueba E2E |
| Avisos push | **OFF en producción:** 0 tokens y 0 cron `rwadar-push`; requiere dispositivo físico nativo y prueba de entrega E2E |
| Hosting anterior | Netlify conserva la versión anterior: el panel indica que los despliegues de producción están pausados porque solo quedan créditos operativos y la CLI responde `Forbidden`. No se actualizará hasta el reinicio o ampliación de créditos. No es el canonical ni el destino actual; CALIX es distinto y no se tocó |
| Google | Propiedad `rwadar.pages.dev` verificada; portada enviada a indexación. Sitemap enviado, con primera lectura transitoria «No se ha podido obtener». La antigua Netlify sí figura indexada |
| App móvil | Android nativo: build 4 compatible con OTA `preview` grupo `4f9d7e19...`, runtime `af694...`; no está en Play Store y no hay build nativo iOS. PWA común para iPhone y Android: `Buscar`, `Favoritos`, `Inversiones` y `Mi cuenta`, caché `rwadar-v-d4a30d5261f16a4b`; conserva fichas, comparador, descartes, radar y 3D. `Inversiones` declara que todavía no existe cartera en el backend y no inventa operaciones |

La fuente de este cierre es el commit
`0f4ef6d92699a4158b90bd09e79a7c8fc61f9643` y, por indicación de los
responsables, los archivos de traspaso del 17–20 de agosto tienen prioridad
sobre documentación anterior.

La validación web actual termina **219/219**, la suite raíz completa termina con
código 0 y el smoke del artefacto publicado
queda GO. El verificador SQL interno de producción terminó con
`Success. No rows returned` y el aviso `RWAdar 22 OK`.

Los dos smokes remotos —base pública y contrato móvil— no contienen destino ni
clave predeterminados y son de solo lectura por defecto. Mutar exige variables
y confirmación ligadas al proyecto; su `finally` verifica la limpieza. El
contrato se probó localmente, con fallos inyectados y sin red, **21/21**.

## Dependencias pendientes

- Backend: `npm audit` informa 0 vulnerabilidades.
- Móvil: `npm audit --omit=dev` sobre el árbol normal informa **46 paquetes
  afectados** (29 high, 17 moderate, 0 critical). El reporte visible deriva de
  tres avisos fuente de build/toolchain —dos `image-size` high y uno `uuid`
  moderate— propagados por Expo/Metro/xcode. No hay corrección compatible en
  el árbol actual; `--force` propone Expo 46 y no debe aplicarse.
- La app pasa Expo install check, Doctor 21/21 y pruebas 15/15. Eso no elimina el
  riesgo anterior ni autoriza a ocultar la cifra 46. La cuenta EAS Free está
  autenticada. El preview terminó `FINISHED`: Android 1.0.0 build 4, ID
  `c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
  `af69452933f988f2d48d45861802f09d3df06e8b`. El APK está en
  `outputs/rwadar-android-preview-v1.0.0-build4-c7bb915b.apk` (84.783.140 bytes;
  SHA-256 `5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`).
  Tiene estructura y firma v2, pero aún falta instalarlo y probarlo en un
  dispositivo; no está en tienda. Consumió 1 cuota Android del plan Free: el
  contador del ciclo pasó de 4/15 a 5/15. El overage estimado fue 0; no es una
  afirmación de cargo financiero.
- La actualización EAS OTA del canal `preview`, grupo `4f9d7e19...` y runtime
  `af69452933f988f2d48d45861802f09d3df06e8b`, lleva el rediseño móvil y el
  listener para abrir avisos al Android build 4 compatible. No activa el push,
  no publica en Play Store y no crea una app nativa iOS.

## Qué contiene

- Un radar con 26 plataformas y cuatro criterios editoriales uniformes.
- Un explicador 3D de qué significa tokenizar un activo.
- Una calculadora educativa.
- Un registro de descartes que exige una fuente citable.
- Login para cuentas existentes y opiniones moderadas, separadas del criterio
  editorial. El radar no exige cuenta; las altas y la recuperación públicas
  permanecen pausadas mientras no exista SMTP propio probado.
- Descarga del registro en CSV.
- Una PWA común para iPhone y Android que reutiliza la misma dirección pública,
  con cuatro pestañas móviles (`Buscar`, `Favoritos`, `Inversiones` y `Mi cuenta`)
  y migración automática desde el
  service worker v1.
- Una sección pública de emisiones que, mientras siga en 0, muestra un estado
  vacío veraz y no simula ofertas ni rentabilidades.

## Arquitectura actual

| Capa | Implementación |
|---|---|
| Web | HTML estático, CSS y JavaScript propios en archivos externos versionados; sin proceso de compilación |
| 3D | WebGL escrito para el proyecto |
| Datos | Supabase/PostgreSQL con seguridad por fila y operaciones sensibles mediante RPC |
| App móvil | React Native/Expo; comparte la base de datos |
| Publicación | Artefacto `rwadar-publicado/` pre-renderizado; producción actual en Cloudflare Pages mediante Wrangler fijado |

La política CSP publicada no permite JavaScript ejecutable ni estilos inline.
Cloudflare Web Analytics y Zaraz no están activados, Netlify RUM no está
inyectado y las sesiones web no se persisten en `localStorage`: los tokens se
mantienen en memoria.

## Publicar de forma segura

Primero genera y valida el único artefacto publicable:

```bash
node rwadar-publicar.js --local
```

El publicador remoto heredado todavía llama a Netlify. Para la producción
actual, despliega **solo** `rwadar-publicado/` al proyecto Cloudflare Pages
`rwadar`, rama `main`, con Wrangler `4.125.0` y la cuenta comprobada. El OAuth
usado quedó en el mínimo funcional: User Read obligatorio, Account Read y
Pages Write. No subas la fuente, la raíz ni el proyecto separado CALIX.

La política declara `data-deploy-legal-status="acuerdo-pendiente-de-documentar"`:
la versión completa puede publicarse sin ocultar que el acuerdo interno y los
plazos propuestos siguen pendientes. El publicador solo acepta ese estado
transparente o el futuro `acuerdo-documentado`; un `data-deploy-blocker`, un
estado ausente o uno desconocido detienen los dos modos remotos. Además,
cualquier remoto comprueba `/auth/v1/settings` en solo lectura y exige
`mailer_autoconfirm=false` exacto. Producción ya devuelve ese valor; un error o
un campo ausente detienen el proceso. La disponibilidad técnica de signup en
Auth no se presenta como alta pública: sin SMTP propio probado, la interfaz
pausa altas y recuperación y no envía esas solicitudes. El login de cuentas
existentes permanece disponible y el radar completo no exige cuenta. La versión
completa ya está publicada en
Cloudflare Pages, deployment `a0be7029-6281-47dd-963d-9c397a18848b`
(`https://a0be7029.rwadar.pages.dev`), y usa la caché PWA
`rwadar-v-d4a30d5261f16a4b`. Netlify conserva la versión anterior
mientras los despliegues de producción sigan pausados por créditos; la CLI
responde `Forbidden`.

Artefacto final congelado:
`outputs/rwadar-cloudflare-pages-20260822-d4a30d52.zip`, 880.760 bytes, 21/21
archivos verificados, SHA-256
`AF9FDA2A5612BCD80BE16EE4251E8FD36261BC522DBFF8E96F18566AEBDEF096`.
Producción y el preview exacto coinciden byte a byte en raíz, service worker,
manifest, privacidad, CSS y JavaScript; la navegación móvil y el alta pausada
quedaron verificadas.

## Rigor editorial y regulatorio

Una plataforma descartada necesita una fuente citable. Una aparición en un
registro oficial se describe con el alcance exacto de ese registro; no se
convierte en «aval», «aprobación» ni promesa de seguridad.

El registro ERIR de la CNMV consultado el 20 de agosto de 2026 recoge una
emisión de **REENTAL TOURIST HOMES, S.A.U.** y varias emisiones de sociedades
**HAUSERA PROPERTY MANAGER SPV**. La propia CNMV advierte que esa inscripción
no implica que haya validado las condiciones de la emisión ni la información
del emisor. Fuente: [registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182).

Eso prueba el registro de esas emisiones concretas y de la entidad responsable
de su inscripción; **no prueba que la CNMV avale a Reental, Hausera, sus
plataformas o una inversión**.

## Responsabilidad y contacto

RWAdar está gestionado conjuntamente, sin sociedad constituida, por:

- Eric Almiñana
- Samuel Rodriguez
- Victor Jorques

La política de privacidad establece en su punto 11 una edad mínima de 18 años.

Contacto: `RWAdar@protonmail.com`.

Los reportes de vulnerabilidades se coordinan de forma privada por ese correo;
consulta [SECURITY.md](SECURITY.md) para el alcance y las reglas de prueba.

El acuerdo entre los tres y los plazos de conservación propuestos siguen
pendientes de revisión y aprobación. Hasta entonces no deben presentarse como
acordados. La política pública comunica expresamente ese estado; publicar no
equivale a afirmar que el acuerdo ya esté firmado.

## No es asesoramiento financiero

RWAdar es un registro informativo independiente. La inclusión de una
plataforma o de una emisión no es una recomendación de inversión. Estar sujeto
a un registro o supervisión tampoco elimina el riesgo ni garantiza
rentabilidad, liquidez o recuperación del capital.

# RWAdar · traspaso vigente

**Reconciliado el 22 de agosto de 2026.** Este documento parte del traspaso
preparado con Claude Code los días 17–20 de agosto y del commit base
`42018de`. Por indicación de los responsables, esa información tiene prioridad
sobre auditorías o documentos anteriores.

No confundas «construido localmente», «probado localmente» y «aplicado o
desplegado en producción». Este proyecto todavía **no está terminado**.

## 1 · Estado en una frase

La web endurecida está en producción y verificada en
`https://rwadar.pages.dev`: 26 fichas, 4 descartadas, PWA y 0 emisiones
públicas. La migración 22 está aplicada y verificada. Correo y push siguen OFF;
no hay publicación en tiendas móviles.

## 2 · Matriz de verdad

| Pieza | Producción | Repositorio reconciliado |
|---|---|---|
| Web pública | **GO en `https://rwadar.pages.dev`**, deployment actual `395980eb...` (`https://395980eb.rwadar.pages.dev`), smoke externo verde | Web 190/190 y suite raíz con código 0 |
| Cloudflare Pages | Proyecto `rwadar`; canonical y producción actual | Wrangler 4.125.0; OAuth mínimo: User Read, Account Read y Pages Write |
| Netlify | Conserva una versión anterior: producción pausada por créditos; no es canonical ni producción actual | El panel indica que solo quedan créditos operativos y la CLI responde `Forbidden`; no se actualizará hasta reinicio o ampliación de créditos |
| Plataformas | 26 en radar + 4 descartadas | Mismo contrato de datos |
| PWA | En línea; caché `rwadar-v-9b1583232e8bea4b` | Cuatro pestañas móviles visibles (`Radar`, `Siguiendo`, `Avisos`, `Más`), ficha ordenada y migración automática desde service worker v1 |
| Sección «Abierto ahora mismo» | No visible | Implementada localmente |
| Emisiones | 0 | Esquema y UI preparados, sin datos que publicar |
| CSS/JS externos + CSP estricta | **Desplegados**; sin `unsafe-inline`/`unsafe-eval` | Contrato 190/190 |
| Analítica/RUM | Cloudflare Web Analytics, Zaraz y Netlify RUM ausentes | Su inyección se rechaza como discrepancia |
| Tokens de sesión en `localStorage` | No se persisten; sesión en memoria | Mismo contrato |
| Migraciones 14 y 15 | Parte del contrato seguro ya conocido de producción | Reproducibles y verificables |
| Migración 22 | **Aplicada y verificada**; `COMMIT`, `schedule=19`, verificador interno OK y smoke público verde | Validada localmente con verificador y rollback |
| Alta de cuentas | Confirm email activo, signup habilitado y `mailer_autoconfirm=false`; Site URL Pages y redirects Pages + Netlify | Sin SMTP propio; confirmación y recuperación reales aún no probadas E2E |
| Avisos por correo | **OFF**; 23 no aplicada en producción | 23 GO local y fail-closed; faltan Brevo/Vault/remitente y E2E |
| Avisos push | **OFF: 0 tokens y 0 cron `rwadar-push`** | Listener para abrir avisos publicado por OTA; entrega requiere dispositivo físico y E2E |
| Indexación | Propiedad Pages verificada y portada en cola; sitemap enviado con primera lectura «No se ha podido obtener» | La antigua Netlify sí figura indexada; reconsultar Pages |
| App móvil | Android build 4 + OTA `preview` `4f9d7e19...`; no Play Store ni iOS nativo | Runtime `af694...`; rediseño y apertura de avisos; la PWA se actualiza en iOS/Android |
| CALIX | Proyecto separado e intocable | No se modificó ni desplegó |

## 3 · Qué cambió desde `42018de`

### Base de datos y seguridad

- `db/22_cierre_regresiones.sql` cerró las regresiones detectadas al reconciliar
  cuentas, opiniones, moderación, dispositivos y emisiones.
- Tiene `db/22_cierre_regresiones_verificar.sql` y un rollback que prioriza el
  fallo cerrado.
- Los instaladores exigen una referencia de proyecto, confirmación y una
  versión exacta del CLI; no aceptan tokens como argumento ni seleccionan
  producción por defecto.
- La activación de correo 23 queda fuera de producción. Su implementación,
  verificador y cierre limitado están GO en local y fallan cerrados, pero no se
  aplican hasta tener Brevo, secreto y remitente válidos en Vault y una prueba
  E2E aprobada.

En producción, el SQL de la 22 (`02F2...0666`) terminó en `COMMIT` y devolvió
`schedule=19`. El verificador interno (`4182...2C3`) terminó con
`Success. No rows returned` y el aviso `RWAdar 22 OK: permisos, RPC,
correo/push apagados y retención diaria verificados`. El smoke público posterior
confirmó 26 plataformas, 4 descartadas, lectura de `opiniones.usuario_id` 401,
moderación directa 401, firma antigua 404/PGRST202 y firma nueva anónima
401/42501.
Security Advisor quedó en 0 Critical y 0 Security Definer View; la firma
antigua está ausente.

El cierre local de DB y sus gates queda verde. La web actual pasa **190/190**
y la suite raíz completa termina con código 0.
`17_avisos_push.sql`, fresh-install, 22,
rollback y recuperación terminan con `push_configuracion.habilitado=false` y
**cero** jobs `rwadar-push`. Con el interruptor apagado, las funciones y el
trigger no copian tokens a la cola ni llaman a Expo.
La 22 termina también colas heredadas pendientes: elimina la copia del token,
marca intentos terminales y limpia la petición. El artefacto aplicado de la 22
queda identificado por el hash abreviado `02F2...0666`.

La retención es independiente del envío: la 22 prepara el job diario
`rwadar-retencion-dispositivos` a las 03:17, con 10 lotes de hasta 1.000 filas
por defecto y límites configurables de 50 × 1.000, y el monitor
`retencion_dispositivos_estado`. El cierre general conserva esa higiene aunque
el push permanezca apagado.

Los dos smokes remotos carecen de referencia y clave predeterminadas y operan
en solo lectura salvo opt-in explícito:

- `probar-produccion.mjs` usa `RWADAR_SMOKE_URL` y
  `RWADAR_SMOKE_ANON_KEY`. Mutar exige `RWADAR_SMOKE_MUTANTE=SI` y
  `RWADAR_SMOKE_CONFIRMACION=PROBAR-MUTACIONES-<REF>`. Usa la RPC nueva, exige
  rechazo de `INSERT`/`UPDATE`/`DELETE` directos y ausencia de la firma antigua.
  Su `finally` reintenta la limpieza y solo la confirma cuando la RPC de
  borrado, el login revocado y la ausencia de contenido están verificados; una
  duda muestra el correo residual y termina con fallo.
- `probar-app-movil.mjs` usa `RWADAR_MOVIL_SMOKE_URL` y
  `RWADAR_MOVIL_SMOKE_ANON_KEY`. Mutar exige
  `RWADAR_MOVIL_SMOKE_MUTANTE=SI` y
  `RWADAR_MOVIL_SMOKE_CONFIRMACION=PROBAR-MOVIL-MUTACIONES-<REF>`. Su `finally`
  verifica que no quede dispositivo ni seguimiento y nunca guarda un token
  Expo ficticio.

El contrato adversarial de ambos smokes pasa **21/21** con fallos locales
inyectados, sin red. Eso prueba el fallo cerrado de los scripts, no producción.

### Web

- CSS y JavaScript propios viven en `rwadar-site/assets/` con nombre
  versionado. Ya no hay código ejecutable, `<style>` ni atributos `style` o
  `on*` inline.
- La CSP deja de depender de `unsafe-inline` o `unsafe-eval`.
- Las sesiones no guardan tokens en `localStorage`.
- RUM está desactivado; no hay una excepción para ignorar scripts inyectados.
- El artefacto da una huella de contenido a cada asset desplegable, actualiza
  las referencias y deriva de todo el conjunto la `VERSION` del service worker;
  su precaché crítico se instala de forma atómica.
- El publicador exige exactamente un modo: `--local`, `--preview` o
  `--produccion`.
- Un rechazo de Netlify termina en error. No hay fallback a preview ni
  promoción automática.
- La carpeta publicada sigue siendo `rwadar-publicado/`, generada desde
  `rwadar-site/`; nunca se edita a mano.

La versión remediada **ya está desplegada y verificada** en Cloudflare Pages.
El deployment actual es `395980eb...` (`https://395980eb.rwadar.pages.dev`) y
la caché PWA es `rwadar-v-9b1583232e8bea4b`. El ZIP final es
`outputs/rwadar-cloudflare-pages-20260822-9b158323.zip`, 875.030 bytes y 21/21
archivos verificados, SHA-256
`3435EC036030F390855D721EAAFB7FE0FB904187FA3284D20C270C479B6DE945`; no uses
el paquete pre-privacidad anterior. El smoke confirmó rutas, 26/4/0, CSP,
caché, PWA y SEO técnico. Netlify conserva la versión anterior mientras
producción siga pausada por créditos y no debe presentarse como canonical.

### Móvil y avisos

- Las escrituras a Supabase comprueban los errores y no anuncian éxito si el
  servidor no lo confirmó.
- Los identificadores locales se generan con aleatoriedad segura y se guardan
  en almacenamiento seguro.
- La solicitud de permisos para notificaciones es contextual.
- Sin prueba real de entrega, el estado público es «push no operativo/no
  demostrado», aunque existan esquema y código de soporte.

El único opt-in es `rwadar-app/activar-push.cmd <REF>`. No forma parte de
fresh-install ni de la 22 y **no se ejecutó**. Exige `SUPABASE_ACCESS_TOKEN`,
`RWADAR_PUSH_E2E_APROBADO=SI`, CLI SemVer exacto >= 2.79.0, confirmación
`ACTIVAR-PUSH-E2E-<REF>` y verificadores 14/15/22/apagado +
`activar_push_verificar.sql`. Ante un fallo aplica `push_fallo_cerrado.sql`,
que corta solo el push y conserva API y retención. No lo ejecutes antes de una
validación externa E2E aprobada.

La app móvil reconciliada está GO en local; push permanece OFF. El preview
terminó `FINISHED`: Android 1.0.0 build 4, ID
`c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
`af69452933f988f2d48d45861802f09d3df06e8b`. El APK local
`outputs/rwadar-android-preview-v1.0.0-build4-c7bb915b.apk` mide 84.783.140 bytes
y su SHA-256 es
`5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`.
Tiene estructura y firma v2; no está en tienda. La OTA Android del canal
`preview`, grupo `4f9d7e19...`, usa el mismo runtime
`af69452933f988f2d48d45861802f09d3df06e8b` y entrega el rediseño más el
listener que abre un aviso. Eso no activa la entrega push: producción conserva
0 tokens y 0 cron. No hay build nativo iOS; en iOS y Android la PWA sí toma la
web actualizada, presenta `Radar`, `Siguiendo`, `Avisos` y `Más`, y migra
automáticamente instalaciones con service worker v1.

## 4 · Emisiones y evidencia regulatoria

El traspaso del 17 de agosto documentó el hallazgo de que las ofertas abiertas
son intermitentes y que la utilidad diferencial puede estar en avisar cuando
aparece una nueva. Esa es una **hipótesis de producto**, no una afirmación de
rentabilidad ni de disponibilidad permanente.

Las cifras vistas en plataformas el 16–17 de agosto son una fotografía
histórica y deben volver a comprobarse con navegador real, URL de origen y
fecha antes de publicarlas. No mantengas cantidades, rentabilidades, número de
operaciones o estados «abierto/cerrado» sin una fuente actual.

### Hallazgo oficial CNMV · alcance exacto

El [registro ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182),
consultado el 20 de agosto de 2026, contiene:

- una emisión de obligaciones de **REENTAL TOURIST HOMES, S.A.U.**;
- varias emisiones de obligaciones de sociedades **HAUSERA PROPERTY MANAGER
  SPV**.

La página identifica a **URSUS-3 CAPITAL, A.V., S.A.** como entidad responsable
de la inscripción/registro de valores representados mediante tecnología de
registros distribuidos. La propia CNMV advierte expresamente que la inscripción
no implica que haya validado las condiciones de la emisión ni la información
facilitada por el emisor.

Por tanto:

- sí es evidencia oficial de esas emisiones concretas en el registro ERIR;
- no prueba un «aval CNMV» de Reental, Hausera o sus plataformas;
- no es una recomendación, garantía de rentabilidad, liquidez o recuperación
  del capital;
- no basta por sí sola para aprobar una plataforma en todos los criterios de
  RWAdar.

Evita frases como «regulada por la CNMV», «aprobada por la CNMV» o «inversión
segura» salvo que otra fuente oficial pruebe exactamente ese alcance.

## 5 · Responsabilidad y privacidad

RWAdar no tiene sociedad constituida. Las decisiones se toman conjuntamente
por:

- Eric Almiñana
- Samuel Rodriguez
- Victor Jorques

Correo de contacto: `RWAdar@protonmail.com`.

El punto 11 de la política pública establece una edad mínima de 18 años.

Existe un borrador de acuerdo de corresponsabilidad, pero todavía no está
aprobado ni firmado por los tres. Los plazos propuestos de **12 meses y 3
años** también siguen pendientes de acuerdo. No los presentes como política
definitiva ni actives tratamientos que dependan de ellos hasta cerrar esa
decisión y reflejarla en la política pública.

## 6 · Reglas que no se negocian

1. Ninguna descartada sin una fuente citable y revisada.
2. Ninguna emisión sin URL HTTPS de origen y fecha de comprobación.
3. Un registro oficial se describe con su alcance literal; nunca se convierte
   en aval general.
4. Un hueco es mejor que una cifra no verificada.
5. Lo patrocinado debe identificarse y no alterar el orden editorial.
6. No escribir secretos, tokens personales ni credenciales en el repositorio.
7. No persistir tokens de sesión web en `localStorage`.
8. No reactivar RUM, JavaScript inline, manejadores `on*` o estilos inline sin
   una revisión formal de CSP y privacidad.
9. No aplicar SQL ni publicar sin modo, proyecto y destino explícitos.
10. No llamar «operativo» al correo o push hasta completar una prueba real de
    extremo a extremo.

Los reportes de vulnerabilidad se gestionan según `SECURITY.md`; no se publican
detalles explotables antes de coordinar la corrección.

## 7 · Comandos seguros

### Pruebas locales

```bash
node probar-web.mjs
cd rwadar-app && npm.cmd test
cd rwadar-movil && npm.cmd test
```

### Web

```bash
node rwadar-publicar.js --local
npx.cmd --yes wrangler@4.125.0 pages deploy rwadar-publicado --project-name rwadar --branch main
```

El primer comando sincroniza, pre-renderiza y valida. El segundo es la ruta de
producción actual y solo puede ejecutarse después de comprobar el directorio,
la cuenta y el proyecto. El publicador remoto heredado aún apunta a Netlify: no
lo confundas con el despliegue de Pages ni uses `netlify deploy` a secas.
Wrangler se autorizó con 3 permisos mínimos: User Read obligatorio, Account
Read y Pages Write. No subas `rwadar-site/`, la raíz ni CALIX.

La política declara
`data-deploy-legal-status="acuerdo-pendiente-de-documentar"`: permite preparar
la versión completa y deja visible que el acuerdo y los plazos aún no están
cerrados. Un `data-deploy-blocker`, un estado ausente o uno desconocido bloquean
los dos modos remotos antes de Auth, sincronización o Netlify. El preflight
remoto consulta `/auth/v1/settings` en solo lectura y exige
`mailer_autoconfirm=false` exacto. Producción ya devuelve `false`, Confirm email
está activo y signup sigue habilitado; un error o un campo ausente bloquean.
Sin SMTP propio, esto no demuestra entrega: aún hay que probar confirmación y
recuperación reales E2E. `Site URL` está guardada como
`https://rwadar.pages.dev` y las redirecciones autorizadas son Pages y Netlify.

### Migración 22 · ya aplicada en producción

No la reapliques como comprobación. En producción ya pasó el verificador de
solo lectura y el smoke público. La receta siguiente solo sirve para otra
instalación que aún no tenga la 22, desde `rwadar-app/` y con el CLI fijado a un
SemVer exacto ya revisado:

```cmd
set RWADAR_SUPABASE_CLI_VERSION=2.79.0
aplicar-sql.cmd exgpmjpaaebyoolpwced db\22_cierre_regresiones.sql
```

En otra instalación, programa una ventana, conserva una copia previa y guarda
la salida real. El instalador pide confirmación y ejecuta los verificadores 14,
15 y 22, además de
`fresh_install_verificar.sql` para 26/4. Si algo falla, no publiques la web
remediada ni describas la 22 como aplicada.

No ejecutes `16_reparacion.sql`, retratos históricos ni migraciones antiguas
sobre producción. El rollback 22 es solo para una emergencia diagnosticada,
no un paso normal ni un sustituto de la copia.

No ejecutes la 23 de correo en producción hasta que tenga Brevo, secreto y
remitente verificados en Vault y prueba de extremo a extremo. Su GO local no
equivale a activación.

### Dependencias móviles pendientes

`npm audit --omit=dev` sobre el árbol normal informa 46 paquetes afectados: 29
high, 17 moderate y 0 critical. El resultado se propaga desde tres avisos
fuente de toolchain (dos `image-size` high y uno `uuid` moderate). No hay fix
compatible; `--force` propone Expo 46. No maquilles la cifra ejecutando un fix
sobre el árbol omitido y reinstalando después. Expo install check pasa, Doctor
21/21 y tests 15/15.

## 8 · Orden de continuación

1. Revisar y firmar el acuerdo entre los tres; decidir los plazos de 12 meses y
   3 años o sustituirlos.
2. Conservar la evidencia de la migración 22 aplicada y verificada; repetir su
   verificador de solo lectura tras cualquier cambio de esquema.
3. Repetir las pruebas mutantes de cuentas, opiniones, moderación y borrado
   contra la base real solo con ventana y limpieza autorizadas.
4. Mantener visible el estado `acuerdo-pendiente-de-documentar`; conservar
   Confirm email activo con signup habilitado y probar confirmación y
   recuperación reales E2E; no prometer entrega antes de esas pruebas.
5. Conservar el deployment Cloudflare `395980eb...`, el ZIP final
   `rwadar-cloudflare-pages-20260822-9b158323.zip` y su SHA-256 como evidencia;
   repetir el smoke tras cualquier despliegue.
6. Reconsultar Search Console: la propiedad Pages está verificada y la portada
   en cola; confirmar que el sitemap deja atrás el primer «No se ha podido
   obtener» antes de afirmar indexación de la URL nueva.
7. Configurar y probar correo solo cuando existan Brevo/Vault/remitente y una
   ventana E2E; hasta entonces, 23 no se aplica.
8. Instalar el Android build 4 en un dispositivo físico, obtener un token real
   y probar ticket, receipt y recepción antes de plantear el opt-in push.
9. Investigar y cargar emisiones solo con fuente vigente. No publiques una
   sección vacía o promesas de avisos sin una decisión editorial explícita.
10. Mantener claro que la OTA `preview` no es Play Store y que no existe una app
    nativa iOS; la distribución web/PWA es otra vía.

## 9 · Qué no debe hacer el siguiente agente

- No sobrescribir este traspaso con una auditoría anterior al 17 de agosto.
- No asumir que local equivale a producción.
- No usar un token personal recuperado de historiales o archivos.
- No publicar a Netlify como si fuera el origen canónico ni tocar CALIX.
- No publicar rentabilidades o afirmaciones regulatorias a partir de marketing
  de una plataforma.
- No atribuir el proyecto solo a una persona: hay tres corresponsables.

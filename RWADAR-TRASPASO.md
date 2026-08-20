# RWAdar · traspaso vigente

**Reconciliado el 20 de agosto de 2026.** Este documento parte del traspaso
preparado con Claude Code los días 17–20 de agosto y del commit base
`42018de`. Por indicación de los responsables, esa información tiene prioridad
sobre auditorías o documentos anteriores.

No confundas «construido localmente», «probado localmente» y «aplicado o
desplegado en producción». Este proyecto todavía **no está terminado**.

## 1 · Estado en una frase

La web pública sigue en línea con 26 fichas, 4 descartadas y PWA. La
reconciliación añade una web local endurecida y la migración de seguridad 22,
pero ninguna de las dos está todavía en producción. La sección de emisiones no
está publicada y producción tiene 0 emisiones.

## 2 · Matriz de verdad

| Pieza | Producción | Repositorio reconciliado |
|---|---|---|
| Web pública | En línea en `https://rwadar.netlify.app` | No sustituida aún |
| Plataformas | 26 en radar + 4 descartadas | Mismo contrato de datos |
| PWA | En línea | Conservada |
| Sección «Abierto ahora mismo» | No visible | Implementada localmente |
| Emisiones | 0 | Esquema y UI preparados, sin datos que publicar |
| CSS/JS externos + CSP estricta | No: la pública antigua aún usa `unsafe-inline`, privacidad 09-08 y SW v1 | Preparado y probado localmente |
| Netlify RUM | Desactivado | Su inyección se rechaza como discrepancia |
| Tokens de sesión en `localStorage` | No asumir | Eliminados en la web local; sesión en memoria |
| Migraciones 14 y 15 | Parte del contrato seguro ya conocido de producción | Reproducibles y verificables |
| Migración 22 | **Pendiente** | Validada localmente con verificador y rollback |
| Alta de cuentas | `mailer_autoconfirm=true`; no valida la dirección y bloquea el despliegue remoto seguro | El preflight exige `false`; falta cambiarlo y probar la confirmación E2E |
| Avisos por correo | **No operativos** | Migración 13 separada y opt-in; no se aplica por defecto |
| Avisos push | Opt-in no ejecutado; producción no se tocó | Fresh/22 local: flag `false`, 0 cron `rwadar-push`, funciones y trigger gated |

## 3 · Qué cambió desde `42018de`

### Base de datos y seguridad

- `db/22_cierre_regresiones.sql` cierra regresiones detectadas al reconciliar
  cuentas, opiniones, moderación, dispositivos y emisiones.
- Tiene `db/22_cierre_regresiones_verificar.sql` y un rollback que prioriza el
  fallo cerrado.
- Los instaladores exigen una referencia de proyecto, confirmación y una
  versión exacta del CLI; no aceptan tokens como argumento ni seleccionan
  producción por defecto.
- El envío de correo de la migración 13 queda fuera de la instalación general.
  Solo debe activarse con su instalador específico cuando proveedor, secretos,
  privacidad y consentimiento estén realmente preparados.

**Límite actual:** que la 22 pase en local no demuestra que producción esté
actualizada. Hay que aplicarla de forma deliberada y ejecutar su verificador
contra la base real antes de cambiar esta tabla.

El cierre local de DB fue **270 aserciones + 8 gates SQL = 278 controles
verdes**. Producción no se tocó. `17_avisos_push.sql`, fresh-install, 22,
rollback y recuperación terminan con `push_configuracion.habilitado=false` y
**cero** jobs `rwadar-push`. Con el interruptor apagado, las funciones y el
trigger no copian tokens a la cola ni llaman a Expo.
La 22 termina también colas heredadas pendientes: elimina la copia del token,
marca intentos terminales y limpia la petición. SHA-256 final de la 22:
`9B4A91D919A4ED0DE269EA474E4D84A5C6708489AB0893B5FECB2FABF5843EDB`.

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

**Límite actual:** esta versión remediada está local y no desplegada. La
producción visible sigue siendo la versión anterior hasta completar una
publicación autorizada y verificarla en red.

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
node rwadar-publicar.js --preview
node rwadar-publicar.js --produccion
```

Exactamente un modo es obligatorio. `--sin-sincronizar` puede acompañar un
modo, pero no elige destino. Nunca uses `netlify deploy` a secas.

En el estado entregado, `data-deploy-blocker` bloquea los dos modos remotos
antes de Auth, sincronización o Netlify: solo `--local` puede construir. Tras
cerrar el acuerdo y los plazos y retirar el marcador deliberadamente, el
preflight remoto consulta `/auth/v1/settings` en solo lectura y exige
`mailer_autoconfirm=false` exacto. Producción devuelve hoy `true`; un error o un
campo ausente también bloquean. Cambiarlo no demuestra entrega: hay que probar
un alta y su confirmación real de extremo a extremo.

### Migración 22

Desde `rwadar-app/`, con el CLI fijado a un SemVer exacto ya revisado:

```cmd
set RWADAR_SUPABASE_CLI_VERSION=2.79.0
aplicar-sql.cmd exgpmjpaaebyoolpwced db\22_cierre_regresiones.sql
```

Programa una ventana, conserva una copia previa y guarda la salida real. El
instalador pide confirmación y ejecuta los verificadores 14, 15 y 22, además de
`fresh_install_verificar.sql` para 26/4. Si algo falla, no publiques la web
remediada ni describas la 22 como aplicada.

No ejecutes `16_reparacion.sql`, retratos históricos ni migraciones antiguas
sobre producción. El rollback 22 es solo para una emergencia diagnosticada,
no un paso normal ni un sustituto de la copia.

No ejecutes `aplicar-envio-avisos.cmd` hasta que el correo tenga proveedor,
secretos, base jurídica/consentimiento y prueba de extremo a extremo.

### Dependencias móviles pendientes

`npm audit --omit=dev` sobre el árbol normal informa 46 paquetes afectados: 29
high, 17 moderate y 0 critical. El resultado se propaga desde tres avisos
fuente de toolchain (dos `image-size` high y uno `uuid` moderate). No hay fix
compatible; `--force` propone Expo 46. No maquilles la cifra ejecutando un fix
sobre el árbol omitido y reinstalando después. Expo install check pasa, Doctor
21/21 y tests 7/7.

## 8 · Orden de continuación

1. Revisar y firmar el acuerdo entre los tres; decidir los plazos de 12 meses y
   3 años o sustituirlos.
2. Hacer copia y aplicar la migración 22 al proyecto correcto; ejecutar sus
   verificadores contra producción.
3. Repetir las pruebas de cuentas, opiniones, moderación y borrado contra la
   base real.
4. Cerrar el marcador `data-deploy-blocker`, cambiar y verificar Auth hasta que
   el preflight obtenga `mailer_autoconfirm=false`, y probar un alta con
   confirmación real; no prometer su entrega antes de esa prueba.
5. Publicar primero con `--preview`, revisar contenido, privacidad, CSP, PWA y
   consola; después usar `--produccion` de forma deliberada.
6. Verificar desde fuera que producción sirve 26/4, canonical, robots,
   sitemap, CSP sin inline, cero RUM y las rutas de privacidad/404.
7. Comprobar Search Console tras el despliegue. Robots y sitemap responden,
   pero la indexación no quedó verificada en esta reconciliación.
8. Diseñar y probar correo y push por separado. Hasta entonces, mantenerlos
   desactivados o con fallo cerrado y decirlo con claridad.
9. Investigar y cargar emisiones solo con fuente vigente. No publiques una
   sección vacía o promesas de avisos sin una decisión editorial explícita.

## 9 · Qué no debe hacer el siguiente agente

- No sobrescribir este traspaso con una auditoría anterior al 17 de agosto.
- No asumir que local equivale a producción.
- No usar un token personal recuperado de historiales o archivos.
- No sortear un `Forbidden` de Netlify mediante preview/promoción.
- No publicar rentabilidades o afirmaciones regulatorias a partir de marketing
  de una plataforma.
- No atribuir el proyecto solo a una persona: hay tres corresponsables.

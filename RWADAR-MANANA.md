# RWAdar · estado operativo para retomar

> Reconciliado el 22 de agosto de 2026 después de la publicación en Cloudflare
> Pages. Para estado y prioridades, este documento y
> `RWADAR-TRASPASO.md` sustituyen las notas del 13–14 de agosto.

## Lo que puede enseñarse hoy

La producción actual en `https://rwadar.pages.dev`, deployment `395980eb...`
(`https://395980eb.rwadar.pages.dev`), sirve:

- 26 fichas del radar y 4 descartadas;
- contenido pre-renderizado;
- PWA instalable con caché `rwadar-v-9b1583232e8bea4b`, cuatro pestañas móviles
  visibles (`Radar`, `Siguiendo`, `Avisos`, `Más`) y migración automática desde
  service worker v1;
- ficha móvil agrupada por bloques, con toda la información y el 3D conservados,
  acciones fijas y cierre arriba, abajo o con Atrás;
- CSV, privacidad, sitemap, robots y 404;
- canonical de la dirección pública.

La política pública fija una edad mínima de 18 años en su punto 11.

No enseña la sección de emisiones y la base de producción tiene 0 emisiones.
Robots y sitemap responden. Search Console tiene la propiedad Pages verificada,
la portada en cola y el sitemap enviado; su primera lectura fue transitoria y
todavía no demuestra indexación. Una futura publicación exige repetir la
comprobación.

## Lo que no debe prometerse

- **No está terminado.** La web remediada está publicada y verificada, y la
  migración 22 está aplicada y verificada; correo, push y tiendas siguen
  pendientes.
- **Cuentas/opiniones:** el frontend publicado usa el contrato RPC seguro. Las
  pruebas locales y el smoke público están verdes, pero Auth real aún necesita
  la prueba E2E de confirmación y recuperación.
- **Correo:** no operativo. La migración 23 y el consentimiento web están listos,
  pero 23 no está aplicada; faltan Brevo, Vault, remitente verificado y E2E.
- **Push:** deshabilitado. `pushDeliveryEnabled=false`; fresh/17/22, rollback y
  recuperación dejan el flag backend en `false` y 0 cron `rwadar-push`. El
  opt-in separado no se ejecutó.
- **Correo de alta:** Confirm email está activo, signup sigue habilitado y
  producción devuelve `mailer_autoconfirm=false`; el preflight Auth ya pasa.
  No hay SMTP propio y todavía faltan pruebas reales E2E de confirmación y
  recuperación. La configuración no demuestra que el mensaje llegue.
- **Netlify:** conserva una versión anterior. El panel dice que los despliegues
  de producción están pausados porque solo quedan créditos operativos y la CLI
  responde `Forbidden`; no se actualizará hasta el reinicio o ampliación de
  créditos. Cloudflare Pages es el canonical y la producción actual.
- **Emisiones:** 0 en producción y sin sección pública. Cualquier cifra o
  estado observado días atrás necesita una fuente y fecha nuevas.

## Contrato de seguridad

Las tablas sensibles no se escriben directamente desde el navegador. La web
usa las operaciones publicadas de la base para guardar, denunciar o borrar una
opinión. No añadas un fallback a `insert`, `update` o `delete` directo: ocultaría
un fallo del contrato seguro.

Las migraciones 14 y 15 documentan y verifican el endurecimiento histórico:

- una persona no puede convertirse en administradora editando su perfil;
- autoría y destino se resuelven en el servidor;
- la vista pública de opiniones no expone UUID de usuario;
- las vistas sensibles respetan RLS;
- helpers internos no son ejecutables por roles públicos;
- las funciones fijan un `search_path` seguro.

La migración 22 cierra regresiones adicionales y dispone de verificador y
rollback. **Está aplicada y verificada en producción.** El SQL ejecutado
(`02F2...0666`) terminó en `COMMIT` con `schedule=19`; su verificador interno
(`4182...2C3`) devolvió `Success. No rows returned` y el aviso `RWAdar 22 OK`.
Security Advisor quedó en 0 Critical y 0 Security Definer View; la firma
antigua de moderación está ausente.

La suite raíz completa terminó con código 0: DB, web **190/190**, QR **6/6**,
móvil **15/15** y herramientas. En producción, el smoke público posterior
confirmó radar 26, descartadas 4, `opiniones.usuario_id` 401, moderación directa
401, firma antigua 404/PGRST202 y firma nueva anónima 401/42501.

La retención no depende de enviar notificaciones. La 22 prepara un job diario
`rwadar-retencion-dispositivos` a las 03:17, por defecto 10 lotes de hasta
1.000 filas y con máximos configurables de 50 × 1.000, con monitor
`retencion_dispositivos_estado`; el cierre general conserva este cron.
La 22 termina y minimiza además colas push heredadas: token nulo, intentos
terminales y ninguna petición pendiente.

## Contrato de privacidad web

- CSS y JavaScript propios van en `rwadar-site/assets/`.
- No hay JavaScript ejecutable inline, `<style>`, atributos `style` ni
  manejadores `on*`.
- La CSP no usa `unsafe-inline` ni `unsafe-eval`.
- Netlify RUM está desactivado y una inyección de RUM hace fallar la
  comparación.
- Los tokens de sesión permanecen en memoria; no se guardan en
  `localStorage`.
- La política pública debe reflejar quién responde y los plazos que finalmente
  aprueben los tres responsables.

## Responsables y decisión pendiente

RWAdar se gestiona sin sociedad constituida por **Eric Almiñana, Samuel
Rodriguez y Victor Jorques**. Correo: `RWAdar@protonmail.com`.

El acuerdo de corresponsabilidad no está firmado. Los plazos propuestos de 12
meses y 3 años tampoco están aprobados. Hasta cerrarlos, no deben presentarse
como compromisos definitivos ni usarse para justificar un nuevo tratamiento.

## Verificación antes de publicar

```bash
node probar-web.mjs
cd rwadar-app && npm.cmd test
cd rwadar-movil && npm.cmd test
```

Las pruebas locales demuestran coherencia del repositorio, no el estado de la
base real ni de Netlify. Después de aplicar o desplegar, repite las pruebas
contra producción que no requieran secretos y comprueba manualmente los flujos
con una cuenta de prueba que se elimine al terminar.

Ambos smokes remotos fallan si no reciben destino y clave explícitos y son de
solo lectura por defecto:

- `rwadar-app/probar-produccion.mjs` usa `RWADAR_SMOKE_URL` y
  `RWADAR_SMOKE_ANON_KEY`. Mutar requiere `RWADAR_SMOKE_MUTANTE=SI` y
  `RWADAR_SMOKE_CONFIRMACION=PROBAR-MUTACIONES-<REF>`. Su `finally` reintenta y
  solo confirma limpieza tras borrado RPC, login revocado y contenido ausente;
  cualquier duda informa del correo residual y hace fallar el proceso.
- `rwadar-app/probar-app-movil.mjs` usa `RWADAR_MOVIL_SMOKE_URL` y
  `RWADAR_MOVIL_SMOKE_ANON_KEY`. Mutar requiere
  `RWADAR_MOVIL_SMOKE_MUTANTE=SI` y
  `RWADAR_MOVIL_SMOKE_CONFIRMACION=PROBAR-MOVIL-MUTACIONES-<REF>`. Su `finally`
  comprueba cero dispositivo y seguimiento y nunca persiste un token Expo de
  prueba.

El contrato adversarial local de los dos pasa **21/21** con fallos inyectados y
sin red. No actives los modos mutantes como comprobación rutinaria ni sin
ventana y limpieza supervisadas.

La app móvil local está GO y push sigue OFF. El preview EAS terminó `FINISHED`:
Android 1.0.0 build 4, ID `c7bb915b-da3b-46d4-9bd6-811a432b4cb3`, fingerprint
`af69452933f988f2d48d45861802f09d3df06e8b`. APK:
`outputs/rwadar-android-preview-v1.0.0-build4-c7bb915b.apk`, 84.783.140 bytes,
SHA-256 `5E505F18C26FF91A8FC12899DEE39D9757C5D2E7FFC665DF0D7AFF090CFC4DB7`.
La estructura y firma v2 están presentes; falta instalarlo/probarlo en un
dispositivo y no está en tienda.

## Migración 22 aplicada: no reaplicar

La migración se ejecutó sobre `exgpmjpaaebyoolpwced` mediante SQL Editor y
terminó en `COMMIT`. Después pasó el verificador interno y el smoke público
descritos arriba. No vuelvas a ejecutar el SQL para «comprobar» su estado; usa
el verificador de solo lectura.

La receta siguiente queda únicamente para otra instalación que todavía no
tenga la 22, siempre con copia previa, referencia explícita y una versión exacta
ya revisada del CLI:

```cmd
cd rwadar-app
set RWADAR_SUPABASE_CLI_VERSION=2.79.0
aplicar-sql.cmd exgpmjpaaebyoolpwced db\22_cierre_regresiones.sql
```

El instalador ejecuta los verificadores correspondientes. En otro proyecto,
conserva la salida y no continúes si alguno falla: debe pasar 14, 15, 22 y
`fresh_install_verificar.sql` con 26/4. No ejecutes la migración 16, retratos
históricos ni otras migraciones antiguas sobre esta producción. El rollback 22
se reserva para una emergencia diagnosticada y no sustituye una copia.

No pases tokens por argumentos ni los escribas en el repositorio. Usa la
autenticación normal del CLI y revoca cualquier credencial temporal al acabar.

### Push opt-in · NO ejecutar todavía

El único activador es `activar-push.cmd REFERENCIA_DEL_PROYECTO`. Requiere un
PAT en `SUPABASE_ACCESS_TOKEN`, `RWADAR_PUSH_E2E_APROBADO=SI`, CLI SemVer exacto
>= 2.79.0 y escribir `ACTIVAR-PUSH-E2E-<REF>`. Verifica primero 14/15/22 en
estado apagado, activa y comprueba el reloj; si falla, ejecuta un cierre
limitado al push. No se ha ejecutado contra producción y no debe ejecutarse
antes de aprobar una prueba E2E externa.

## Publicar la web

```bash
node rwadar-publicar.js --local
node rwadar-publicar.js --preview
node rwadar-publicar.js --produccion
```

Exactamente un modo es obligatorio. La política declara
`data-deploy-legal-status="acuerdo-pendiente-de-documentar"`, por lo que la
versión completa puede avanzar sin presentar el acuerdo ni los plazos como
cerrados. Un `data-deploy-blocker`, un estado ausente o uno desconocido fallan
cerrados. El preflight remoto ya obtiene `mailer_autoconfirm=false` exacto y
signup sigue habilitado. Aún faltan las pruebas E2E de confirmación y
recuperación. La producción actual se publicó en Cloudflare Pages con Wrangler
4.125.0, desplegando exclusivamente `rwadar-publicado/`. El publicador remoto
heredado llama a Netlify y no es la ruta de Pages. Nunca subas `rwadar-site/`,
la raíz ni CALIX.

El artefacto final congelado es
`outputs/rwadar-cloudflare-pages-20260822-9b158323.zip`, 875.030 bytes y 21/21
archivos verificados, SHA-256
`3435EC036030F390855D721EAAFB7FE0FB904187FA3284D20C270C479B6DE945`. El
paquete pre-privacidad anterior no debe usarse.

## Después del despliegue

Comprueba desde una conexión externa:

1. código HTTP de inicio, privacidad y 404;
2. 26 fichas y 4 descartadas en HTML pre-renderizado;
3. canonical, robots y sitemap;
4. CSP efectiva, cero inline y cero `netlify-rum-container`;
5. registro, recuperación, opinión, denuncia, borrado y cierre de sesión;
6. que ninguna respuesta fallida se presenta como éxito;
7. PWA, las cuatro pestañas móviles y migración automática desde service worker
   v1;
8. Search Console tras la publicación; Pages está verificada y en cola, pero la
   indexación efectiva todavía no está confirmada.

## Hallazgo regulatorio que corrige una pregunta antigua

Ya no es correcto decir que no había evidencia oficial de Reental en el
registro consultado. El [ERIR de la CNMV](https://www.cnmv.es/portal/consultas/esi/erir_esi?lang=es&nif=A86796182)
lista una emisión de REENTAL TOURIST HOMES, S.A.U. y varias emisiones de
sociedades HAUSERA PROPERTY MANAGER SPV.

Eso no equivale a que Reental o Hausera estén «avaladas por la CNMV». La propia
página dice que la inscripción no implica que la CNMV haya validado las
condiciones de la emisión ni la información del emisor. Describe siempre el
registro concreto y enlaza la fuente.

## Trampas ya conocidas

- Una vista de Postgres puede saltarse RLS si no usa el contrato de seguridad
  correcto; los verificadores deben fallar con tablas llenas, no solo vacías.
- Un `403` por falta de `GRANT` no es lo mismo que una denegación de RLS.
- Un resultado vacío no demuestra protección.
- Un rechazo de cualquier proveedor es un error, no una vía de publicación
  alternativa ni permiso para cambiar de proyecto.
- El navegador o panel en segundo plano puede falsear pruebas visuales; usa un
  navegador real y revisa consola/red.
- No escribas JSON con herramientas que añadan BOM.

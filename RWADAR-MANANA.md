# RWAdar · estado operativo para retomar

> Reconciliado el 20 de agosto de 2026 sobre el traspaso del 17–20 de agosto y
> el baseline `42018de`. Para estado y prioridades, este documento y
> `RWADAR-TRASPASO.md` sustituyen las notas del 13–14 de agosto.

## Lo que puede enseñarse hoy

La producción actual en `https://rwadar.netlify.app` sirve:

- 26 fichas del radar y 4 descartadas;
- contenido pre-renderizado;
- PWA instalable;
- CSV, privacidad, sitemap, robots y 404;
- canonical de la dirección pública.

No enseña la sección de emisiones y la base de producción tiene 0 emisiones.
Robots y sitemap responden, pero la indexación no quedó demostrada en esta
reconciliación. Hay que confirmarla en Search Console; una futura publicación
exige repetir la comprobación.

## Lo que no debe prometerse

- **No está terminado.** La web remediada permanece local y la migración 22 no
  está aplicada en producción.
- **Cuentas/opiniones:** no las des por buenas desde el frontend público
  histórico. El backend seguro usa RPC y la web local se adaptó a ese contrato;
  hay que probar la combinación que quede realmente desplegada.
- **Correo:** no operativo. La migración 13 se mantiene separada y no entra en
  la instalación general.
- **Push:** deshabilitado. `pushDeliveryEnabled=false`; fresh/17/22, rollback y
  recuperación dejan el flag backend en `false` y 0 cron `rwadar-push`. El
  opt-in separado no se ejecutó.
- **Correo de alta:** producción devuelve `mailer_autoconfirm=true`; no valida
  la dirección y es un bloqueo del publicador remoto. El preflight exige
  `false` exacto, pero cambiarlo tampoco demuestra que el mensaje llegue: falta
  una prueba real de alta y confirmación de extremo a extremo.
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
rollback. **Está validada en local y pendiente en producción.** No mezcles ese
estado con el de la 14/15.

Resultado final local de DB: **270 aserciones y 8 gates SQL, 278 controles
verdes**. Producción no se tocó.

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

## Aplicar la migración 22

Solo con copia previa, referencia explícita y una versión exacta ya revisada
del CLI:

```cmd
cd rwadar-app
set RWADAR_SUPABASE_CLI_VERSION=2.79.0
aplicar-sql.cmd exgpmjpaaebyoolpwced db\22_cierre_regresiones.sql
```

El instalador ejecuta los verificadores correspondientes. Conserva la salida y
no continúes si alguno falla: debe pasar 14, 15, 22 y
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

Exactamente un modo es obligatorio. Ahora `data-deploy-blocker` permite solo
`--local`: `--preview` y `--produccion` terminan antes de Auth, sincronización o
Netlify. Tras cerrar el acuerdo y los plazos, retirar el marcador y obtener
`mailer_autoconfirm=false` exacto en el preflight remoto, el orden será local →
preview → producción, con revisión entre pasos. El script no cambia de modo si
Netlify rechaza la operación: termina con error. No crea ni promueve un
borrador alternativo.

Nunca uses `netlify deploy` directamente. El artefacto correcto es
`rwadar-publicado/`, generado desde `rwadar-site/` con datos sincronizados y
pre-renderizado.

## Después del despliegue

Comprueba desde una conexión externa:

1. código HTTP de inicio, privacidad y 404;
2. 26 fichas y 4 descartadas en HTML pre-renderizado;
3. canonical, robots y sitemap;
4. CSP efectiva, cero inline y cero `netlify-rum-container`;
5. registro, recuperación, opinión, denuncia, borrado y cierre de sesión;
6. que ninguna respuesta fallida se presenta como éxito;
7. PWA y service worker después de limpiar caché;
8. Search Console tras la publicación.

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
- `Forbidden` de Netlify es un error, no una vía de publicación alternativa.
- El navegador o panel en segundo plano puede falsear pruebas visuales; usa un
  navegador real y revisa consola/red.
- No escribas JSON con herramientas que añadan BOM.

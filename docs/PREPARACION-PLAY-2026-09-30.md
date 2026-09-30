# Google Play: expediente técnico de preparación

Corte: 30/09/2026. Complementa `ENTREGA-TIENDAS-Y-ANUNCIOS.md`; no sustituye
`INTERNO.md`. No es una declaración enviada a Google ni una aprobación legal.
El inventario inicial corresponde al código inspeccionado en
`db89cef584a01cc096ad9d400be3c1095a89251b` y al APK 8. La corrección local del
explicador se incorporó después en `a486c5c`, como se detalla al final. No se
atribuye esa corrección al APK 8. Una nueva compilación requiere revisión.

## Entrega que se ha examinado

- Android `com.rwadar.app`, 1.1.0/versionCode 8, distribución directa APK.
- SHA-256 recalculado hoy del APK descargado de GitHub:
  `593099b7c23d420da0aa361d74d4760b6e73368089849a57887489e7cfb1a255`.
- Evidencia binaria y emulador del 28/09: `VERIFICACION-ANDROID-2026-09-28.md`.
  No se ha repetido esa instalación ni se atribuye a un teléfono físico.
- El perfil `production` en `rwadar-movil/eas.json` prepara AAB, pero no es un
  AAB vigente generado ni enviado. El antiguo AAB 5 no sirve para esta entrega.
- No se han activado anuncios, compras, cuentas, comisiones o pagos.

## Inventario de datos para la declaración

Las rutas de código de esta tabla son relativas a `rwadar-movil/`.

| Función | Evidencia de implementación | Tratamiento y límite comprobable |
| --- | --- | --- |
| Catálogo y descartes | `lib/catalogo-remoto.js`, `lib/datos.js`, `lib/supabase.js` | Lecturas HTTPS del catálogo público. El proveedor recibe metadatos de conexión. Auth no persiste ni renueva sesiones. Esto no demuestra ausencia de registros técnicos del proveedor. |
| Búsqueda y filtros | Estados y filtrado en `App.js` | Procesamiento local; no se ha encontrado envío de términos de búsqueda. Confirmarlo en el ensayo de red del AAB final. |
| Favoritos nuevos | `USUARIO_LOCAL` y `alternarSeguimiento` en `lib/datos.js` | AsyncStorage editorial local. Sin sincronización remota en este corte. No representan posiciones ni inversiones. |
| Borrado | `borrarDatosDispositivo`, diálogo de privacidad | Elimina favoritos editoriales y caché local. No elimina registros del servidor ni datos históricos de versiones anteriores. No declarar un borrado remoto automático. |
| Identidad y push | `SERVICIOS_USUARIO_REMOTOS=false`, guardas en `lib/supabase.js` y `lib/avisos.js` | Las rutas de creación de identidad, registro de dispositivo y token push están desactivadas. Tener dependencias de notificaciones no equivale a un servicio activo. |
| Explicador | `App.js` importa `componentes/Explicador.js` | WebView de una página propia, con JS y almacenamiento DOM habilitados. Debe entrar en la revisión de datos; no es navegación libre por webs ajenas. |
| Fuentes externas | `abrirEnlace` en `App.js` | Apertura HTTPS en navegador mediante acción del usuario, sin parámetros de afiliación añadidos por esta función. La empresa receptora aplica sus propias condiciones. |
| Contacto | Enlace `mailto` explícito | El usuario decide qué envía mediante su cliente de correo. No es un formulario oculto ni lectura del correo desde la app. |

La documentación de [Supabase Logs](https://supabase.com/docs/guides/observability/logs)
describe eventos de pasarela y retención dependiente del plan. Falta cerrar para
el AAB final qué campos técnicos se retienen, cuánto tiempo y con qué finalidad.
No es necesario exportar IP ni datos personales de visitantes para comprobarlo.

## WebView: frontera que no debe olvidarse

La URL inicial real es `https://rwadar.pages.dev/#explain`. El cargador propio de
analítica web retorna si encuentra un fragmento. La nueva prueba
`rwadar-movil/tests/privacidad-play.test.cjs` ejecuta ese cargador con la URL
extraída del componente: la carga inicial no solicita el beacon. El control
positivo demuestra que la portada sin fragmento sí lo solicita.

Esto es evidencia local del cargador, no inspección completa de tráfico del APK.
El filtro de navegación admite otras rutas del mismo origen. No extrapolar a
«la WebView nunca mide nada» ni «la app no transmite datos». El alojamiento y
las consultas del catálogo continúan implicando conexiones. Si cambia la web
embebida, hay que revisar su efecto en Data safety aunque no cambie el APK.

Google incluye las WebViews controladas por el desarrollador en el alcance de
[Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
La clasificación depende del uso de los datos: IP no implica automáticamente
GPS ni puede ignorarse si se registra o se utiliza para inferir ubicación.
No marcar tratamiento efímero sin comprobar la retención efectiva. La posible
excepción de proveedor de servicios requiere comprobar su actuación por cuenta
de RWAdar; no convierte automáticamente todo tratamiento en ausencia de recogida.

## Respuestas preparadas, no enviadas

- **Acceso para revisión:** no hay login ni cuenta de prueba. Abrir radar,
  buscar una plataforma, entrar en ofertas y abrir una ficha. Las cifras pueden
  ocultarse por caducidad sin que eso sea una restricción por suscripción.
- **Anuncios:** no contiene anuncios activos en el corte examinado. Si se añade
  AdMob, hay que cambiar esta respuesta, el inventario de datos y las pruebas.
- **Compras:** sin compras dentro de la app; no recibe dinero de inversiones.
- **Publicidad/identificadores:** no hay SDK publicitario en dependencias ni
  permiso AD_ID en el manifiesto inspeccionado del APK 8. Reinspeccionar el AAB.
- **Cuenta de usuario:** no permite crear cuentas en el corte editorial.
- **Seguridad de datos:** borrador pendiente de cerrar registros de
  infraestructura y recorrido WebView. No enviar «no recoge datos» solo porque
  los favoritos sean locales o no exista login.
- **Seguridad independiente:** no se ha obtenido una certificación MASA ni un
  dictamen externo. Tests locales, firma y emulador no equivalen a ese sello.
- **Contenido y funciones financieras:** describir el radar informativo y los
  enlaces a terceros, sin afirmar licencia propia ni clasificarlo como exchange,
  wallet, intermediario o asesor personalizado que no es.

## Tipo de cuenta y clasificación: resolver antes de pagar el alta

Los [requisitos de Play Console](https://support.google.com/googleplay/android-developer/answer/10788890?hl=en)
exigen cuenta de organización a desarrolladores que prestan los servicios
financieros incluidos en esa política. La condición de persona física del
titular no basta para decidir que RWAdar puede usar cuenta personal. Tampoco
se concluye aquí que un directorio editorial sea necesariamente un proveedor
financiero regulado: son clasificaciones distintas que hay que resolver.

Texto preparado para una consulta a soporte, **no enviado**:

> RWAdar es un directorio editorial gratuito de plataformas y referencias de
> activos tokenizados. Publica fuentes, fechas y riesgos, ofrece búsqueda y
> favoritos locales y abre las webs de terceros. No abre cuentas de inversión,
> recibe fondos, ejecuta órdenes, custodia activos ni da recomendaciones
> personalizadas. Prevemos publicidad identificada, no comisiones de inversión
> en esta versión. ¿Qué tipo de cuenta y categoría de funciones financieras
> corresponden a este alcance, y se exige una cuenta de organización?

Todas las apps deben completar la
[declaración de funciones financieras](https://support.google.com/googleplay/android-developer/answer/13849271?hl=en).
La categoría «Other» existe, pero no se selecciona automáticamente aquí.
La [política financiera](https://support.google.com/googleplay/android-developer/answer/9876821?hl=en-GB)
también alcanza promoción de productos: no recibir fondos no elimina por sí
solo todos los requisitos. No declarar ausencia de funciones sin resolver este
encuadre ni inventar registros o licencias de RWAdar.

Si finalmente corresponde una cuenta personal nueva, Google exige al menos
12 testers continuos durante 14 días en prueba cerrada antes de solicitar
producción. No son 12 emuladores, una descarga directa ni un plazo que ya haya
empezado. [Requisito oficial de pruebas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=es).

## Evidencia que falta antes del envío

1. Resolver tipo de cuenta y encuadre financiero; completar el alta y las
   verificaciones con datos reales y confirmación contractual del titular.
2. Generar un AAB del corte que se decida enviar, revisar firma, permisos,
   dependencias y configuración; no reutilizar un binario histórico.
3. En ese AAB: observar arranque, búsqueda, filtros, ficha, favorito/reinicio,
   caché sin red, catálogo caducado/retirado, borrado y explicador completo.
   Registrar dominios y tipos de solicitud sin conservar tokens o datos personales.
4. Distinguir tráfico de arranque y del explicador: no asumir que procede solo
   de Supabase o solo del código nativo. Probar también la ruta de error sin red.
5. Cerrar Data safety y revisar la política de privacidad contra el comportamiento
   observado, sin añadir capacidades futuras. Completar contenido, audiencia,
   países y recursos gráficos del binario que se envíe.
6. Ejecutar la pista que corresponda a la cuenta, revisar resultados de Google
   y obtener publicación efectiva. Ningún punto de esta lista está aprobado
   solo por estar escrito.

La preparación, ensayos, ficha y seguimiento de revisión son trabajo técnico
de RWAdar. Identidad, contratos y cobro requieren al titular. No se ha contratado,
pagado, generado una nueva build ni publicado mediante este expediente.

## Validación local de este expediente

El 30/09 se ejecutaron las dos pruebas nuevas de `privacidad-play.test.cjs` y
el conjunto acotado con `interfaz-segura.test.cjs`,
`servicios-usuario-ui.test.cjs` y `empaquetado.test.cjs`: 10/10 aprobadas.
Se comprobó también el SHA-256 del APK conservado. No se volvió a descargar ni
instalar para esta revisión. Los tests no modifican la aplicación publicada,
no hacen peticiones externas y quedan excluidos del paquete EAS.

La suite móvil completa se ejecutó mientras estaba en curso la corrección
independiente de tarjetas: 61/62 en ese instante, con un assert de texto antiguo
en `tests/navegacion.test.cjs:88`. Se comunicó al responsable de ese cambio;
ese resultado no aprobaba la entrega nueva. Tras corregirlo, la suite alcanzó
73/73 y se volvió a ejecutar con la prueba adicional de vigencia: **74/74,
0 fallos**, el 30/09. Este último resultado pertenece al árbol de trabajo de
ese momento, con HEAD `a486c5c` y cambios web/documentales en curso; no demuestra
por sí solo el contenido o el funcionamiento de un APK compilado.

## Explicador: aislamiento y prueba local del 30/09

La revisión detectó dos causas de presentación incorrecta: la web puede mover
`#explain` dentro de Academy al pasar a pantalla pequeña, y su CSP estricta
rechaza un elemento `style` con CSS insertado como texto. La corrección en
`componentes/Explicador.js` recorre los contenedores reales de la lección,
desoculta esa ruta y oculta sus hermanos mediante propiedades CSSOM. No clona
el canvas ni modifica la CSP. Al cambiar de tamaño restaura los estilos
anteriores y vuelve a aislar la ruta vigente. Si no existe la lección, comunica
un mensaje específico a la pantalla nativa de error.

- Huella SHA-256 del componente congelado e incluido en `a486c5c`:
  `97cd68f67f309ccb430edd1b4719e7c62759e7401d25f727341300e26345b89a`.
- `tests/explicador-aislamiento.test.cjs`: cinco pruebas de aislamiento,
  reubicación responsive, idempotencia, ausencia de lección y validación del
  mensaje de error. Son pruebas de JS y DOM simulado, no pruebas nativas.
- La URL inicial conserva `#explain`; las dos pruebas de privacidad confirman
  la exclusión del beacon para esa entrada, con control positivo de la portada.
- Ensayo adicional en navegador con las fuentes web reales, servido solo en
  `127.0.0.1:4188`. CSP `script-src 'self'; style-src 'self'`, sin acceso al
  catálogo remoto. El servidor temporal se detuvo tras el ensayo.

| Ensayo de navegador local | Resultado observado |
| --- | --- |
| 390 × 844 | Lección visible; ofertas, cabecera y navegación web ocultas; escena de 430 px; sin desbordamiento horizontal. |
| 320 × 740 | Lección visible, sin ofertas ni navegación web y sin desbordamiento horizontal. |
| Paso directo de móvil a 1280 × 800 | Lección visible; el antiguo contenedor Academy vuelve a quedar oculto; sin desbordamiento horizontal. |
| Segundo paso de la lección | El selector y el título cambian a «2 · PARTIDO EN 3.000». |
| Simulador con 2.600 € | Muestra 26 trozos, 156 €/año, 13 €/mes y 0,87 %, dentro del ejemplo didáctico. |

El harness local tenía una política de red más restrictiva que producción y
no servía el catálogo; los avisos de catálogo local ausente no se presentan
como un fallo ni como una validación de ese servicio. Se restableció el tamaño
del navegador y se cerró la pestaña de prueba. No hay capturas guardadas en
este expediente.

Estas comprobaciones prueban la corrección local y sus interacciones en
navegador. **Quedan pendientes su instalación y recorrido en el nuevo APK**,
incluida la ruta sin red. El proceso EAS
`eebe0939-e987-4184-909a-c68656538ae4` se encontraba `IN_PROGRESS` para
1.1.1/versionCode 9 al cerrar este registro; no se declara publicado ni aprobado
por Google Play. El hilo que integra el lanzamiento conserva la responsabilidad
de comprobar el binario, distribuirlo y actualizar el estado canónico.

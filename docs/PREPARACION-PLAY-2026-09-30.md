# Google Play: expediente técnico de preparación

Corte: 30/09/2026. Complementa `ENTREGA-TIENDAS-Y-ANUNCIOS.md`; no sustituye
`INTERNO.md`. No es una declaración enviada a Google ni una aprobación legal.
El inventario inicial corresponde al código inspeccionado en
`db89cef584a01cc096ad9d400be3c1095a89251b` y al APK 8. La corrección local del
explicador se incorporó después en `a486c5c`, como se detalla al final. No se
atribuye esa corrección al APK 8. Una nueva compilación requiere revisión.

La distribución directa vigente ya es Android 1.1.2/versionCode10. La
publicación, descarga anónima, firma y prueba de ese APK se documentan en
`VERIFICACION-ANDROID-2026-09-30.md`. El inventario inicial siguiente se
conserva como evidencia histórica; no acredita un AAB actual ni declaraciones
enviadas a Play.

## Recursos gráficos: criterios antes de declarar la ficha lista

Requisitos contrastados el 30/09 en la
[documentación oficial de recursos de vista previa](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en):

| Recurso | Requisito obligatorio |
| --- | --- |
| Icono de ficha | 512 × 512px, PNG de 32 bits con alfa, máximo 1024KB; diseño conforme a la especificación de Play |
| Imagen de presentación | 1024 × 500px, JPEG o PNG de 24 bits sin alfa |
| Capturas | Al menos dos; JPEG o PNG de 24 bits sin alfa, dimensiones entre 320 y 3840px; lado mayor como máximo dos veces el menor |

La recomendación para promoción de apps es disponer de cuatro capturas de
al menos 1080 × 1920px en vertical 9:16 o 1920 × 1080px en horizontal 16:9.
Se distingue del mínimo obligatorio. Las capturas deben mostrar el uso real;
no estirar, comprimir ni simular la interfaz. Añadir texto alternativo claro.

El icono fuente de 1024px no es por sí solo el icono listo de Play. Las capturas
anteriores de 1080 × 2400px incumplen la proporción máxima; no se estiraron ni
recortaron. El mismo APK vigente se volvió a capturar en un AVD configurado a
1080 × 1920px, como se detalla debajo. Preparar recursos compatibles no cambia
la app publicada ni acredita aprobación de la ficha por Google.

## Cuatro capturas reales del APK vigente

El [run de capturas 36716353398](https://github.com/victorJorques/RWAdar-downloads/actions/runs/36716353398)
terminó correctamente el 30/09 a las 12:43:48 UTC. Workflow y head
`73b79cf91c256ae6b0929d3091b2ae9fc18163af`; configuración SHA256
`ca1d4a1dd5732595f56992e03eabc7dae44053535d6239ba070680fa399cd6df`.
Descargó el APK público 1.1.2/código 10 y comprobó sus 85.274.516 bytes,
SHA256 `0e06d6c4f8e32048fc761b8630467dd91b5a57940f577263571c7915fdd5b574`,
certificado, firma V2, paquete, SDK y cuatro permisos exactos antes de instalar.
No compiló otra versión de RWAdar ni modificó release, latest, SQL o anuncios.

El emulador API 35 usó el perfil Pixel 2 con tamaño físico 1080×1920, sin
override. Las cuatro imágenes proceden de `adb screencap`: radar con 26
plataformas, catálogo principal con 24 fichas, secundario con 21 y detalle
de Miami 1. El catálogo mostraba 26/49 y grupos 24/21/4, sin fallback V1
o copia local. En el detalle se ven 14,88 %, fecha del dato 28/09,
consulta 30/09 y el aviso de cifras históricas. No se
atribuyen esas cifras a un precio o una oportunidad actual.

Cada original RGBA8 tenía alfa 255 en todos los píxeles. La conversión a PNG
RGB8 conservó los canales RGB y comprobó igualdad al decodificar de nuevo;
no escaló, recortó, compuso ni añadió texto. Un decodificador independiente
confirmó los hashes RGB. El integrador inspeccionó visualmente las cuatro
imágenes antes de entregarlas al responsable del paquete gráfico.

| PNG 1080×1920 RGB8 | Bytes | SHA256 |
| --- | --- | --- |
| `01-radar.png` | 209311 | `c0250a7f5952b291ce3651f9b770c8c93cdd5cd37b711697af00214840ce0d3f` |
| `02-principales.png` | 835006 | `2779bab868cc6ba7226f93571c2bd3ba6e39a64b7e2c5c713a97dac8e03719a5` |
| `03-secundario.png` | 885350 | `519e6104e10f3095fef60cd5b4dee4efff6af8e2330acb6adbfec9ff1a8a4fa4` |
| `04-detalle-fechado.png` | 145492 | `aa00a5695d518cd6c236de3c0a2dde63a087fb28c1fff276d9ef21e7cfce81e4` |

El artefacto contiene únicamente cuatro PNG, cuatro XML y manifiesto: nueve
archivos. ZIP verificado el 30/09 a las 12:45:02 UTC, 2.060.488 bytes, SHA256
`024af0e111d5378dd849385e8ef5614123637faa05269300b95803fbab1a3521`,
retención de 1 día y límite de 10 MiB. Copia privada conservada en
`rwadar-capturas-play-112-20260930/run-36716353398`; comprobaciones en
`verified-run-36716353398.json` de la carpeta padre. No incluye APK, claves,
originales RGBA, fuente privada o logs completos. El workflow genérico y sus
logs estándar son públicos en el repositorio separado de distribución.

Este PASS tiene alcance de capturas, no reemplaza el ensayo completo de
lanzamiento 36703760962. No abrió explicador, enlaces externos, cuentas o
acciones comerciales; no acredita dispositivo físico, AAB ni publicación
en Play. No se activó gasto ni se amplió cuota: runner estándar público y
artefacto pequeño de un día. La cuota compartida libre de la cuenta no fue
comprobada, por lo que no se afirma coste total cero.

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

La revisión focalizada del 30/09 de los requisitos, la política financiera y
la declaración no encontró una mención expresa a directorios editoriales ni
una excepción por gratuidad o ausencia de custodia. Mostrar activos y enlazar
al proveedor puede entrar en el alcance de promoción de productos; es una
inferencia, no una clasificación aprobada por Google. La regla de tipo de
cuenta y la casilla de funciones financieras son decisiones separadas.

Texto preparado para una consulta a soporte, **no enviado**:

> RWAdar, mantenido por una persona física en España, es un directorio editorial
> gratuito de plataformas y referencias de activos tokenizados. Presenta
> fuentes, fechas y riesgos, permite búsqueda y favoritos locales y abre
> enlaces a webs de terceros. No abre cuentas de inversión, recibe fondos,
> ejecuta órdenes, custodia activos ni ofrece recomendaciones personalizadas.
> La versión actual no incluye publicidad; prevemos incorporarla identificada
> en el futuro.
>
> Para este alcance actual, ¿Google Play exige cuenta de organización conforme
> al apartado 1.1 de Play Console Requirements, o permite cuenta personal?
>
> ¿Qué opciones de Financial features debemos declarar: Other, ausencia de
> funciones financieras u otra categoría concreta? Si exige organización,
> ¿qué documentación de identidad corresponde al titular que opera como
> persona física en España?

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
navegador. En aquel corte quedaban pendientes la instalación y el recorrido
del nuevo APK, incluida la ruta sin red. El proceso EAS
`eebe0939-e987-4184-909a-c68656538ae4` se encontraba `IN_PROGRESS` para
1.1.1/versionCode 9; ese estado es histórico. El APK 1.1.2/código 10 vigente
ya se instaló y recorrió, incluido el explicador y su retorno, como registra
`VERIFICACION-ANDROID-2026-09-30.md` con sus límites. No se atribuye a ese
ensayo una prueba sin red o una aprobación de Play. El estado vigente de
distribución está en `INTERNO.md`.

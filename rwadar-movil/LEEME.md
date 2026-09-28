# RWAdar · app móvil

App nativa en React Native con Expo (SDK 57).

## Corte editorial conectado · 27 de septiembre de 2026

Esta copia usa `catalogo-editorial`: consulta las dos vistas verificadas de
Supabase sin iniciar sesión. No sincroniza operaciones pendientes ni solicita
permisos push. Los favoritos se guardan bajo `rwadar.editorial.*`, separados de
cualquier instalación anterior. Un catálogo retirado o vencido no se sustituye
por el fixture interno. El estado de distribución se registra en `docs/INTERNO.md`.

El catálogo y los servicios remotos de usuario tienen compuertas separadas.
`SERVICIOS_USUARIO_REMOTOS = false` mantiene desactivados identidad, sincronización
y push con el catálogo conectado. En este perfil
editorial los favoritos usan `rwadar.editorial.*`: no se leen ni migran claves
`rwadar.*` de instalaciones anteriores y no se generan reintentos. El borrado
afecta solo a ese espacio y a la caché pública del catálogo, nunca a datos
históricos del servidor. Esta guarda del cliente no acredita bloqueo de los
endpoints ni sustituye la revisión de permisos/RLS en Supabase.

El fixture incluido contiene 26 plataformas del radar, 4 descartes con sus
fuentes, 28 ofertas principales y 24 referencias secundarias con imágenes
locales. Los proveedores exclusivos del escaparate no se incorporan al radar
ni pueden seguirse como plataformas canónicas.

El fixture se conserva para pruebas aisladas, no como catálogo de respaldo del
perfil conectado. La sección siguiente es histórica, no una entrega del corte
actual. Las builds anteriores no validan los cambios de septiembre.

## Estado verificado · 21 de agosto de 2026

- APK interno Android `1.0.0` build 4, runtime
  `af69452933f988f2d48d45861802f09d3df06e8b`.
- Rediseño publicado por EAS Update en el canal `preview`, grupo
  `c20b2752-8d53-48a1-a29b-36285e254b3b`.
- AAB de producción `1.0.0` build 5 terminado con el mismo runtime y el mismo
  keystore: build `965fc4b6-3c77-4661-b2a7-b8281c06aac2`.
- Google Play todavía no ha recibido el AAB: la cuenta de Play Console no está
  creada y Google exige activar antes la verificación en dos pasos.
- La entrega push sigue apagada deliberadamente; seguir una plataforma no se
  presenta como garantía de recibir avisos.

## Probarla ahora mismo

```bash
cd rwadar-movil
npm test
npx expo start
```

Expo Go sirve para revisar parte de la interfaz, pero no sustituye una prueba
nativa de entrega. El export `--web` solo se usa como apoyo de QA responsive;
no es la versión web/ordenador de RWAdar. No entregar el APK histórico build 4
como si incorporara el catálogo y la seguridad nuevos.

El perfil EAS `editorial` genera un APK Android firmado, con el mismo paquete
`com.rwadar.app` y firma existente. Antes de iniciarlo se inspecciona el archivo
con `eas build:inspect --platform android --profile editorial --stage archive`.
La `.easignore` de la raíz solo admite el código móvil y sus activos necesarios:
excluye otros proyectos, documentos, fotografías internas y credenciales.
`tests/empaquetado.test.cjs` cubre esa frontera, también para rutas de Windows.

El corte desactiva `updates.enabled`: el APK ejecuta su código incluido y no
recupera JavaScript de los canales históricos. El catálogo se actualiza por
REST; cambiar el código requiere una nueva build revisada. También desactiva
la copia Android a Google Drive y bloquea permisos de notificaciones,
micrófono y almacenamiento externo que este alcance no necesita.
La identidad de runtime usa la política oficial `appVersion` (`1.1.0`), ya que
se distribuye el binario completo sin OTA. El primer intento con `fingerprint`
fue rechazado por una discrepancia entre la huella local y la del constructor;
no se usa ninguna bandera para omitir la comprobación. Reactivar OTA exigiría
una revisión independiente de compatibilidad y firma. `expo-updates` se fija
a la revisión compatible `~57.0.23` indicada por Expo Doctor para SDK 57.

La comprobación operativa `node verificar-catalogo-remoto.cjs --lectura-remota`
realiza solo GET públicos con el lector móvil, verifica las 26/28 fichas,
la caché, cuatro descartes citables y que el esquema interno no está expuesto.
No forma parte de `npm test`, no escribe en Supabase ni imprime claves.

## Qué hace, y por qué eso importa

Apple rechaza las apps que son una web envuelta (directriz 4.2). Estas tres
cosas son las que la convierten en un producto propio:

**Conserva un adaptador de avisos desactivado.** Solo con capacidad remota
explícita puede registrar permiso, token y seguimiento; el proceso que envía
el push tampoco está activado. La interfaz solo mostrará «avisos activos» cuando ese proceso se
haya probado de extremo a extremo y `extra.rwadar.pushDeliveryEnabled` cambie
explícitamente a `true`.

**Consulta sin conexión con caducidad.** El adaptador conectado conserva un lote
atómico de plataformas y ofertas, no dos respuestas que puedan pertenecer a
revisiones distintas. Solo admite una copia completa dentro de su plazo; una
respuesta vacía, retirada, inválida o sin permisos no recupera el catálogo
anterior. La cabecera indica cuándo se usa una copia sin conexión. Las cifras
tienen su propio TTL y los días se computan en UTC, como en las vistas SQL.
La caducidad se revisa también con la app abierta y al volver de suspensión.
Esto no cambia `local-interno` ni activa el adaptador en esta copia.

**Seguir no exige registrarse.** En el perfil editorial la lista permanece en
el dispositivo, sin UUID ni sincronización. El adaptador remoto conservado,
desactivado por defecto, identifica la instalación con un UUID
aleatorio criptográfico, no con una cuenta. En iOS y Android se guarda en
Keychain/Keystore. Consultar el catálogo no crea ese identificador; si Supabase
no confirma un seguimiento, queda marcado como pendiente y no se prometen
avisos basados en él.

La pantalla **Privacidad y datos de esta app** explica únicamente los
tratamientos habilitados y el alcance real del borrado. Solo en el adaptador
remoto habilitado el borrado exige primero confirmar la fila remota y después
elimina la identidad local. En los perfiles local y editorial no contacta al servidor.

## Estructura

```
App.js                     Radar, Siguiendo, Avisos, Más y modales
componentes/Navegacion.js  Barra inferior, iconos propios e insignias
componentes/Radar.js       Radar animado, puntos y filtros accesibles
componentes/Explicador.js  3D en WebView y fallback nativo animado
lib/tema.js                Colores, tipografía, sombras y radios
lib/tacto.js               Respuesta háptica
lib/supabase.js            Cliente + identificador anónimo de instalación
lib/datos.js               Consultas, caché sin conexión y seguimiento
lib/contrato-catalogo.js    Validación pura compartida con el importador web
lib/catalogo-remoto.js     Lectura del lote verificado y caducidad sin conexión
lib/avisos.js              Registro para avisos push
```

El lector conectado usa únicamente `catalogo_plataformas_publicas` y
`catalogo_ofertas_publicas` para el lote 26/28. No usa `radar_publico` como
respaldo ni publica las referencias secundarias del fixture interno. La
migración y la activación requieren el procedimiento de
[`docs/RUNBOOK.md`](../docs/RUNBOOK.md); las pruebas con mocks o PGlite no
acreditan disponibilidad del backend ni una compilación móvil publicada.

## Diseño: lo mismo que la web, adaptado al móvil

**Tipografía.** Geist, la misma que el sitio, desde el paquete oficial de
Expo. Interletraje óptico —cuanto mayor el cuerpo, más se aprieta— y cifras
en Geist Mono para todo lo que sea dato.

**Elevación.** Sombras de dos capas en iOS, una de contacto y otra ambiental;
en Android su propia elevación, que ya viene calibrada. Con una sola capa
todo parece una pegatina.

**Radios graduados.** La curva crece con la superficie: 8 para etiquetas,
18 para fichas, 24 para paneles.

**Tacto en vez de sonido.** En un teléfono la respuesta física convence más
que el audio y no molesta en una reunión. Mismo criterio que en la web: solo
en gestos deliberados, con intensidad proporcional. Seguir es seco y
definido; dejar de seguir, blando. La diferencia se nota en el dedo sin
mirar la pantalla.

**El explicador** conserva la misma narración 3D que la web —entero, dividido,
con dueño, negociable— dentro de una WebView limitada al origen HTTPS exacto
de RWAdar. Si no puede cargar, usa el fallback nativo de cuarenta bloques y
cuatro pasos animados.

## La piel es la de la web, desde el 14 de agosto de 2026

La app nació antes del rediseño y se quedó con la identidad de papel — crema,
azul marino y verde menta. Ya no: usa los **mismos tokens exactos** que
`rwadar-site/index.html`, copiados de su sección `1 · TOKENS`.

- fondo de noche `#0B0A0A`, superficies `#171614` → `#262523`;
- la señal `#25E39A`, el verde de un eco de radar, **como único color de la
  interfaz**: logotipo, rótulos, acción principal y foco. En ningún otro sitio;
- grises **cálidos** (`#F7F5F0` / `#BBB5AB` / `#8A8378`), que sobre negro se
  leen cómodos donde un gris neutro cansa;
- los seis colores de categoría y el coral `#FF3B30` de «descartada», con sus
  distancias medidas en Lab. **No tocar sin volver a medir.**

Sobre fondo oscuro una sombra negra no separa nada: la jerarquía la llevan las
superficies, y la sombra solo añade profundidad en iOS.

## Lo que falta para llegar a las tiendas

El acceso a Expo, el APK interno y el AAB de producción Android ya están
resueltos. Antes de entregar a Google Play falta:

1. activar la verificación en dos pasos de la cuenta de Google;
2. crear y pagar la cuenta de Play Console;
3. crear la ficha `com.rwadar.app`, completar privacidad, seguridad de datos,
   contenido, países y canal de pruebas;
4. instalar el APK build 4 en un Android real y comprobar navegación, 3D,
   seguimiento online/offline, borrado y recepción de la OTA;
5. subir el AAB build 5 primero a una pista de prueba, no directamente a
   producción.

iOS sigue necesitando Apple Developer, credenciales de firma, un build EAS y
pruebas mediante TestFlight.

**El envío de los avisos.** La base ya sabe *a quién* avisar (vista
`avisos_pendientes`). Falta el proceso que lea esa vista y llame a la API de
Expo Push, compruebe recibos y retire tokens inválidos. Solo después de una
prueba real debe activarse la bandera operativa.

## Actualizaciones por EAS

EAS Update está configurado por canales y `runtimeVersion` usa la política
`fingerprint`. La OTA del rediseño ya está en `preview` y solo es compatible
con el APK build 4, cuya huella coincide exactamente. Los APK 1 y 3 usan otro
runtime y necesitan instalar build 4 una vez. El AAB build 5 incluye el mismo
código y runtime en el canal `production`; no se ha enviado a Google Play.

Ni una configuración presente ni un comando escrito prueban que una OTA o un
push se hayan entregado. Antes de cambiar la bandera operativa hay que probar
en un dispositivo real: permiso contextual, registro, envío, recibo, retirada
de tokens inválidos, borrado y recuperación ante fallo.

## Verificación local y avisos de dependencias

Foto de la revisión del **21 de agosto de 2026**:

- `npm test`: 14 de 14 pruebas móviles superadas;
- `npx expo install --check`: dependencias compatibles con SDK 57;
- `npx expo-doctor`: 21 de 21 comprobaciones superadas;
- exportación local Android (901 módulos) y web de QA (566): correcta;
- batería integral del repositorio: exit 0;
- QA visual a 320, 390 y 430 px sin desbordamiento horizontal;
- APK build 4 y AAB build 5: misma huella nativa.

Después de aplicar las actualizaciones compatibles de `npm audit fix` **sin
`--force`** y alinear los parches exigidos por Expo, `npm audit --omit=dev`
informa de **15 paquetes afectados**: 5 altos, 10 moderados y ninguno crítico.
El reporte los propaga desde tres avisos subyacentes del toolchain: dos DoS de
`image-size` y uno de límites de búfer de `uuid`, a través de Expo CLI, Metro y
`xcode`. npm los cuenta en el árbol de producción porque `expo` es una
dependencia directa. La única reparación automática que elimina todo el
conjunto baja a Expo 46, incompatible con SDK 57 y React Native 0.86, por lo
que no se aplicó ni se debe ejecutar `npm audit fix --force`. Esto no equivale
a declarar riesgo cero: hay que repetir la auditoría al actualizar Expo y
adoptar la corrección compatible cuando el SDK la publique.

La implementación se contrastó antes de editar con la documentación oficial
versionada de [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/),
[SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/),
[Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) y
[Updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/).

## El criterio editorial de "Fuera del radar"

Una plataforma solo aparece señalada si el motivo se puede respaldar con una
fuente citable. Hoy son cuatro casos con diez fuentes: una demanda municipal
documentada por la propia ciudad, un cierre aprobado en votación pública, una
prohibición de un registro de carbono y la declaración regulatoria de la propia
plataforma.

Se retiraron ocho que eran juicio de valor sin respaldo ("escala pequeña",
"poca transparencia", "nicho"). Entre ellas Kinesis, cuya crítica sobre
auditorías es de 2021, procede de un blog enmarcado en una disputa por
difamación y quedó desmentida por auditorías independientes posteriores.

La base impide que esto se degrade: `select * from descartadas_sin_fuente`
lista cualquier empresa señalada sin respaldo. **Debe devolver cero filas
siempre.** Es lo primero que hay que mirar antes de enviar una versión a
revisión: Apple y Google retiran de inmediato ante la reclamación de una
empresa nombrada.

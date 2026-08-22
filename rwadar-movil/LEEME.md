# RWAdar · app móvil

App nativa en React Native con Expo (SDK 57). Comparte base de datos con la web:
lo que cambies en Supabase aparece en las dos.

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

Expo Go sirve para revisar parte de la interfaz, pero no reproduce el contrato
nativo completo de avisos, SecureStore y EAS Update. Para una prueba de entrega
usa el APK build 4. El export `--web` solo se usa como apoyo de QA responsive;
no es la versión web/ordenador de RWAdar.

## Qué hace, y por qué eso importa

Apple rechaza las apps que son una web envuelta (directriz 4.2). Estas tres
cosas son las que la convierten en un producto propio:

**Está preparada para avisar cuando una plataforma cae del radar.** La app
registra permiso, token y seguimiento, pero el proceso que envía el push aún no
está activado. La interfaz solo mostrará «avisos activos» cuando ese proceso se
haya probado de extremo a extremo y `extra.rwadar.pushDeliveryEnabled` cambie
explícitamente a `true`.

**Funciona sin conexión.** Un registro de consulta se lee en el metro o en una
reunión. La última respuesta buena queda guardada y se sirve al instante; si
hay red, se refresca por detrás. La cabecera indica "sin conexión" cuando los
datos vienen de la caché.

**Seguir no exige registrarse.** La instalación se identifica con un UUID
aleatorio criptográfico, no con una cuenta. En iOS y Android se guarda en
Keychain/Keystore. Consultar el catálogo no crea ese identificador; si Supabase
no confirma un seguimiento, queda marcado como pendiente y no se prometen
avisos basados en él.

La pantalla **Privacidad y datos de esta app** explica estos tratamientos y
permite borrar la instalación, el token, los seguimientos y las cachés. El
borrado elimina primero la fila remota y solo después la identidad local.

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
lib/avisos.js              Registro para avisos push
```

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

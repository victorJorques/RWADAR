# RWAdar · app móvil

App nativa en React Native con Expo (SDK 57). Comparte base de datos con la web:
lo que cambies en Supabase aparece en las dos.

## Probarla ahora mismo

```bash
cd C:/Users/vcicr/Downloads/rwadar-movil
npx expo start
```

Escanea el código QR con la app **Expo Go** en tu móvil y la tendrás
funcionando en 10 segundos. Para verla en el ordenador, añade `--web`.

## Qué hace, y por qué eso importa

Apple rechaza las apps que son una web envuelta (directriz 4.2). Estas tres
cosas son las que la convierten en un producto propio:

**Avisa cuando una plataforma cae del radar.** Es *la* función. Tu propio
contenido demuestra por qué: RealT y Goldfinch se hundieron con gente dentro.
Quien las siguiera debería haberse enterado el mismo día, no al volver a
entrar en la web. La maquinaria está probada en producción: al cambiar el
estado de una ficha, la base genera sola el aviso con el token del dispositivo
que la seguía.

**Funciona sin conexión.** Un registro de consulta se lee en el metro o en una
reunión. La última respuesta buena queda guardada y se sirve al instante; si
hay red, se refresca por detrás. La cabecera indica "sin conexión" cuando los
datos vienen de la caché.

**Seguir no exige registrarse.** El dispositivo se identifica con un código
anónimo, no con una cuenta. Reduce el abandono en la primera pantalla y evita
almacenar datos personales, que en una app de temática financiera es una
ventaja legal además de una de producto.

## Estructura

```
App.js                     Pantallas: radar, seguidas, detalle
componentes/Explicador.js  "¿Qué es tokenizar?" con animación nativa
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

**El explicador** es la misma narración que el 3D de la web —entero,
dividido, con dueño, negociable— resuelta con animación nativa en vez de
WebGL: va más suelto, gasta menos batería y nunca se queda sin arrancar.
Cuarenta bloques que salen todos de un único valor animado.

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

**1 · Cuenta de Expo (gratis)** para poder compilar en la nube, que es la única
vía de generar el archivo de iOS desde Windows.

```bash
npx eas login
```

`eas.json` ya está escrito, con tres perfiles: `development`, `preview` y
`production`. La primera compilación crea el `projectId` que `lib/avisos.js`
está esperando; hasta entonces el módulo detecta que no existe y se calla en
lugar de fallar, y el resto de la app funciona igual.

**2 · Para enseñarla sin pagar nada**, que es lo que casi siempre hace falta
primero: el perfil `preview` genera un **APK instalable** en cualquier Android,
sin tiendas, sin revisión y sin los 124 $/año.

```bash
npx eas build --platform android --profile preview
```

**3 · Cuenta de Apple Developer** (99 $/año) y **Google Play Console** (25 $ una
vez). Las tiene que abrir y pagar una persona. Solo hacen falta para publicar.

```bash
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
npx eas submit --platform android
npx eas submit --platform ios
```

**4 · El envío de los avisos.** La base ya sabe *a quién* avisar (vista
`avisos_pendientes`). Falta el proceso que lea esa vista y llame a la API de
Expo Push. Es una función programada de Supabase, media hora de trabajo, y
conviene hacerla cuando exista el `projectId`.

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

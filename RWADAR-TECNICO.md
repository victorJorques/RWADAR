# RWAdar · qué tiene de valor por dentro

> Documento para enseñar, no para trabajar. Explica en cristiano qué hace
> que RWAdar sea sólido por dentro, para alguien que no programa: un
> cliente, un socio, un inversor, alguien que valora el trabajo.
>
> Si vienes a **tocar** el proyecto, este no es tu archivo: el *dónde* está
> en `RWADAR-MAPA.md` y el *por qué* de cada decisión en `RWADAR-ESTADO.md`.
>
> Todas las cifras están medidas sobre el repositorio el 15 de agosto de
> 2026. Las de la web publicada no se han vuelto a medir aquí.

---

## En una frase

RWAdar es un registro de plataformas de tokenización de activos reales
—inmuebles, deuda, arte, materias primas— que dice cuáles existen de
verdad, cuáles están reguladas y cuáles se fueron al garete, con la fuente
al lado. Son 26 fichas en el radar y 4 señaladas como descartadas, más una
app móvil que avisa cuando una cae.

Lo interesante no es la lista. Es **cómo está construido**.

---

## 1 · La decisión que lo explica todo: un solo archivo

La web entera —texto, diseño, animaciones, sonido, el gráfico 3D, las dos
tipografías y los datos— es **un único archivo de 291 kB** (297.693 bytes,
3.712 líneas). No hay carpetas de código, ni compilación, ni un solo
paquete descargado de internet.

Para comparar: una web hecha con las herramientas habituales de hoy arrastra
del orden de mil paquetes de terceros, pesa varios megas y necesita un
proceso de compilación que hay que mantener.

**Por qué importa, en la práctica:**

- **Carga de golpe.** No hay veinte peticiones encadenadas. El navegador
  pide un archivo, lo recibe y ya está todo: incluida la tipografía, que
  suele ser la causa clásica de que un texto aparezca y salte medio segundo
  después.
- **No se puede envenenar.** El ataque más común hoy contra una web no es
  contra la web: es contra alguno de los mil paquetes que usa. Aquí no hay
  ninguno. Salvo la consulta a su propia base de datos, la página **no le
  pide nada a nadie** — ni tipografías de Google, ni analítica, ni iconos.
- **No se pudre.** Dentro de tres años se abre igual. No hay versiones que
  se peleen ni un compilador que haya dejado de existir.
- **Y no hay rastreo de terceros**, ni por descuido: no hay terceros.

El precio es real y conviene decirlo: un archivo así se navega con búsquedas,
no leyéndolo, y por eso el proyecto lleva su propio mapa. Es un intercambio
consciente, no un descuido.

---

## 2 · El gráfico 3D: 885 piezas, dibujadas de una vez

La portada explica qué es tokenizar con un rascacielos que se va
despiezando: entero → dividido en paneles → cada panel con su dueño →
los paneles cambian de mano.

Ese edificio son **885 paneles de fachada** repartidos en cuatro cuerpos
escalonados, con las ventanas encendidas, reflejo en el suelo, sombra de
contacto y viñeta atmosférica.

Lo técnicamente valioso:

- **Motor propio de WebGL2, sin librería.** Lo normal es tirar de una
  librería 3D que pesa cientos de kilobytes. Aquí el motor es del proyecto
  y ocupa una fracción de eso.
- **Las 885 piezas salen en una sola orden a la tarjeta gráfica**
  (*dibujado instanciado*). El ordenador manda una vez la forma de un panel
  y una lista de 885 posiciones, en lugar de 885 órdenes. Es la diferencia
  entre que vaya suave en un móvil o que se atragante.
- **La animación la calcula la tarjeta gráfica, no el navegador.** El
  escalonado, el arco al cambiar de mano y la interpolación entre los cuatro
  estados van en el chip. El procesador queda libre para la página.
- **Tres pasadas —objeto, reflejo y sombra— con un solo programa de
  dibujo**, cambiando un interruptor. Menos trabajo y menos que mantener.

Y las constantes que lo gobiernan están documentadas con sus límites: por
qué la escala del panel no puede llegar a 1,0 (dos caras contiguas quedarían
en el mismo plano y aparecerían manchas al azar), por qué la cámara no puede
bajar de cierto ángulo (la torre se lee como un derrumbe). Eso no es un
detalle de estilo: es lo que evita que el siguiente que lo toque rompa algo
sin enterarse.

---

## 3 · El sonido: ni un archivo que descargar

La interfaz suena. Y no hay ni un `.mp3`: **cada sonido se sintetiza en el
momento** con el generador de audio que ya trae el navegador. Cero peso,
cero peticiones.

La versión anterior sonaba tosca y el motivo está escrito en el propio
código: era ruido blanco filtrado, que es literalmente el sonido de una
lámina metálica golpeada, y caía entre 2 y 4 kHz — justo donde el oído es
más sensible y antes se cansa. La receta actual usa tono en vez de ruido,
casi todo entre 250 y 900 Hz, con el ataque en curva de coseno en lugar de
rampa recta para que no chasquee.

Ese nivel de detalle en algo que casi nadie nombraría es, probablemente, la
mejor señal de cómo está hecho el resto.

---

## 4 · Lo que no se ve pero decide si existes

### Pre-renderizado: que Google vea la página llena

Una página que se dibuja sola con JavaScript le llega **vacía** al robot de
Google. Es el error clásico y es mortal: no apareces en las búsquedas.

Al publicar, el proyecto ejecuta su propio JavaScript en un navegador de
mentira y **escribe el resultado dentro del HTML**. Google recibe las fichas
ya escritas, en texto. La página sigue siendo interactiva para las personas
y es legible para las máquinas.

Va acompañado de lo que hay que tener: mapa del sitio, `robots.txt`, datos
estructurados, imagen de vista previa al compartir, verificación de Google y
aviso a los buscadores cuando cambia algo.

### Seguridad: la llave pública no puede escribir

- La clave que lleva la web es **de solo lectura por diseño**, y está
  comprobado contra el servidor: intentar escribir con ella devuelve un
  error. Aunque alguien la copie del código —y se puede, está a la vista—,
  no puede tocar nada.
- La base de datos no confía en la aplicación: las reglas de acceso viven
  **dentro de la base**, no en el navegador.
- Las cabeceras del servidor declaran a qué se puede conectar la página:
  a sí misma y a su base de datos. A nada más. Y quedan desactivadas la
  geolocalización, la cámara, el micrófono y los pagos, que la página no
  usa.

### Se actualiza sola

Los datos viven en la base, no en el HTML. Al abrir la página consulta la
base y **se repinta si algo cambió**. Cambias una ficha en el panel de la
base de datos y aparece en la web sin volver a publicar nada.

### Accesibilidad y respeto por quien se marea

Hay 39 marcas de accesibilidad para lectores de pantalla, y el sistema
comprueba en seis sitios distintos si la persona ha pedido **menos
movimiento** en su dispositivo. Si lo ha pedido, las animaciones no
arrancan. Es una preferencia real de mucha gente con vértigo o migraña, y
casi nadie la respeta.

---

## 5 · El rigor editorial, convertido en regla de la base de datos

Esta es la parte que más valor tiene y la que menos se ve.

Decir en público que una plataforma financiera está descartada es un riesgo
legal. Así que la regla del proyecto es: **ninguna descartada sin una fuente
citable**. No una opinión, no un blog con causa pendiente: una demanda
documentada por la propia ciudad, un cierre aprobado en votación pública,
una prohibición de un registro oficial, la declaración de la propia empresa.

Lo importante es que la regla **no depende de acordarse**. La base de datos
publica una consulta —`descartadas_sin_fuente`— que lista cualquier empresa
señalada sin respaldo, y **tiene que devolver cero filas siempre**. El
comprobador de arranque lo mira antes de dejar publicar.

Se retiraron ocho descartes que eran juicio de valor sin respaldo
(«escala pequeña», «poca transparencia»). Entre ellos, uno cuya crítica
procedía de un blog enmarcado en una disputa por difamación y había quedado
desmentida por auditorías posteriores.

Eso es la diferencia entre un directorio y un registro.

---

## 6 · La app móvil no es la web metida en una caja

Apple rechaza las apps que son una web envuelta. Esta es nativa
—React Native con Expo— y comparte base de datos con la web. Tres cosas la
hacen un producto propio:

- **Avisa cuando una plataforma cae del radar.** Es *la* función, y el
  propio contenido demuestra por qué: hubo plataformas que se hundieron con
  gente dentro. Quien las siguiera debería enterarse el mismo día. Al
  cambiar el estado de una ficha, **la base genera sola el aviso** para los
  dispositivos que la seguían.
- **Funciona sin conexión.** La última respuesta buena queda guardada y se
  sirve al instante; si hay red, se refresca por detrás. La cabecera avisa
  cuando los datos vienen de la caché.
- **Seguir no exige registrarse.** El dispositivo se identifica con un
  código anónimo. Menos abandono en la primera pantalla y ningún dato
  personal almacenado, que en una app de temática financiera es también una
  ventaja legal.

Además **se actualiza por el aire**: se publica un cambio de código sin
pasar por la revisión de la tienda.

Y comparte piel con la web: los mismos colores exactos, las mismas
tipografías, con las distancias entre los colores de categoría medidas para
que se distingan de verdad. En el móvil el sonido se cambia por respuesta
háptica —en una reunión, el tacto convence y no molesta.

---

## 7 · Cómo se sabe que funciona

Esta es la parte que separa un proyecto enseñable de uno terminado.

Un solo comando, `node rwadar-arrancar.js`, comprueba antes de nada que el
código compila, que el pre-renderizado está puesto, que la carpeta que se
publica no lleva archivos de más, que la base responde, que **ninguna
descartada va sin fuente** y si lo publicado coincide con lo local.

Hay ocho baterías de pruebas. Seis levantan una base de datos de usar y
tirar; **dos atacan la base real en producción**: se registran, opinan,
vigilan una ficha, guardan el identificador de avisos y **se borran solas al
terminar**. Ninguna necesita contraseñas.

Existen por un motivo concreto y bien documentado: la base en producción
**no coincide** con lo que dice el repositorio —se le aplicaron cambios que
no existen como archivo—, así que las pruebas locales pueden salir todas en
verde mientras lo de verdad está roto. El proyecto lo sabe, lo tiene
escrito, y tiene la prueba que lo caza.

Que un proyecto personal documente por escrito en qué se miente a sí mismo
es raro, y vale más que cualquier funcionalidad.

---

## 8 · Lo que cuesta

Prácticamente nada, y es una propiedad del diseño, no una casualidad:
alojamiento gratuito para archivos estáticos, base de datos en su plan
gratuito, sin servidor propio que mantener ni actualizar. No hay ninguna
pieza que cobre por visita.

Lo único que hoy frena el proyecto no es técnico: son las dos cuentas de
desarrollador que hacen falta para publicar la app en las tiendas —25 $ una
vez en Google, 99 $ al año en Apple—. El archivo de Android ya está
compilado y firmado, esperando.

---

## Resumen

| | RWAdar | Lo habitual |
|---|---|---|
| Dependencias externas | **0** | del orden de 1.000 paquetes |
| Peso de la web | **291 kB**, todo incluido | varios MB |
| Peticiones a terceros | **0** | tipografías, analítica, iconos… |
| Compilación | **ninguna** | obligatoria |
| Motor 3D | propio, 885 piezas en una orden | librería de cientos de kB |
| Sonido | sintetizado, 0 archivos | archivos que descargar |
| Visible para Google | sí, pre-renderizado | a menudo página vacía |
| Escritura desde la web | **imposible** por diseño | según se haya configurado |
| Datos sin fuente | **imposible**, lo impide la base | criterio de quien edita |
| Pruebas contra producción | sí, y se limpian solas | poco frecuente |
| Coste de funcionamiento | ~0 | según tráfico |

---

## Dónde mirar cada cosa

| Tema | Archivo |
|---|---|
| El *dónde* de cada pieza de la web | `RWADAR-MAPA.md` |
| El *por qué* de cada decisión | `RWADAR-ESTADO.md` |
| Lo que no coincide entre producción y el repositorio | `RWADAR-MANANA.md` |
| La app móvil | `rwadar-movil/LEEME.md` |
| Datos y esquema de la base | `rwadar-app/` |
| El código QR de entrada | `rwadar-qr/LEEME.md` |

El código está publicado en github.com/victorJorques/RWADAR.

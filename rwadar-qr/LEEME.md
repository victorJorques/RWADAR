# RWAdar · código QR de entrada

El código lleva a **https://rwadar.netlify.app**, que es la web pública y
funciona igual en el móvil. *No* lleva a la app de las tiendas: a 15 de
agosto de 2026 la app móvil está terminada pero sin publicar, porque eso
depende de dos cuentas de desarrollador que aún no están abiertas
(`RWADAR-ESTADO.md` → «Lo único que bloquea el avance»). Cuando la app esté
en Google Play o en la App Store, se regenera apuntando allí:

```bash
node rwadar-qr/hacer-qr.js https://play.google.com/store/apps/details?id=com.rwadar.app
```

## Qué archivo usar

| Archivo | Para qué |
|---|---|
| `rwadar-tarjeta.png` | **El de siempre.** Mandarlo por WhatsApp, meterlo en una presentación, subirlo a una red. 2160×2700 |
| `rwadar-tarjeta.svg` | Lo mismo pero vectorial: imprimir en grande —cartel, roll-up— sin que pixele |
| `rwadar-qr.png` | El código a secas, sin marca, por si hay que colocarlo en un diseño ajeno |
| `rwadar-qr.svg` | El código a secas, vectorial |

La tarjeta lleva la tipografía Geist **dentro del archivo**, sacada del
propio `rwadar-site/index.html`. Se abre en cualquier ordenador sin
instalar nada. Un detalle: si el SVG se incrusta con `<img src="...">` en
otra página, el navegador lo dibuja en modo aislado y ahí la tipografía
incrustada no se aplica; abierto directamente sí. Para incrustarlo en otra
web, usa el PNG.

## Rehacerlo

```bash
node rwadar-qr/hacer-qr.js            # los tres archivos, a rwadar.netlify.app
node rwadar-qr/hacer-qr.js https://…  # a otra dirección
node rwadar-qr/comprobar-qr.js        # comprueba que se lee
```

`rwadar-tarjeta.png` no se regenera sola: sale de abrir `rwadar-tarjeta.svg`
en el navegador y capturarlo a 2× (2160×2700).

## Por qué está escrito a mano

Sin dependencias, como el resto del proyecto. `codigo-qr.js` implementa la
norma ISO/IEC 18004 —modo byte, versiones 1 a 10— en 200 líneas que se
pueden leer enteras, y el PNG se escribe con el `zlib` que ya trae Node. No
hay nada que instalar ni nada que se pueda romper solo dentro de tres años.

Un código QR mal hecho **no avisa**: sale un dibujo con toda la pinta de un
código QR y el teléfono simplemente no hace nada. Por eso
`comprobar-qr.js` no mira el dibujo, lo **descodifica**: parte de los
píxeles del PNG y del trazado del SVG y deshace el camino entero hasta
recuperar la dirección. Deduce por su cuenta dónde va cada pieza en vez de
reutilizar el armazón del codificador, así que si el codificador se
equivoca de sitio, el comprobador no comete el mismo error a la vez.

Comprueba cinco cosas: que la geometría fija está donde manda la norma, que
los 15 bits de formato se releen bien en sus dos copias, que **los
síndromes de Reed-Solomon dan cero** en todos los bloques —o sea, que la
corrección de errores es real y no relleno—, que el texto recuperado es el
que se pidió, y que el PNG y los dos SVG contienen esa misma matriz.

Además, al escribirlo se comparó módulo a módulo contra el paquete `qrcode`
de npm y se descodificó con `jsQR`, dos implementaciones independientes: 9
casos de prueba, idénticos y legibles. Esa comprobación no vive aquí porque
exigiría instalar dependencias que el repositorio no tiene.

## El código, por dentro

Va a **nivel H**, el más protegido: aguanta que se estropee hasta el 30 %
del dibujo y se sigue leyendo. Es el nivel que hay que usar en algo que se
va a imprimir, doblar, fotocopiar o fotografiar de lado desde una pantalla.

Para `https://rwadar.netlify.app` salen 33×33 módulos (versión 4) más los
4 módulos de margen claro que exige la norma — sin ese margen el lector no
encuentra dónde empieza el código, y es el fallo más común al recortar un
QR de un diseño.

El código va en **oscuro sobre panel blanco**, incluso dentro de una
tarjeta de fondo negro. Invertido (claro sobre oscuro) queda más bonito y
muchos lectores modernos lo aceptan, pero no todos: no compensa perder un
escaneo de cada veinte a cambio de que pegue mejor con el fondo.

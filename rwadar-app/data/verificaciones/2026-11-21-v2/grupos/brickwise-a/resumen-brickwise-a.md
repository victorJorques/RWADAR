# Resumen del grupo «brickwise-a» · 21/11/2026

Consultas propias del 21/11/2026 entre las 17:41:48 y las 17:56:40 UTC, sin
sesión ni cuenta: curl y Playwright. Copias en `fuentes/`. Los crudos (API con
carteras, HTML con nombres, PDF y JS de la app) están en `fuentes/crudo/`,
fuera de Git. Huellas en `inventario-consultas.json`.

Fichas: Plüddemanngasse 101 (Graz), Sonnleithnergasse 2 (Viena), local de
estanco de Klagenfurt, Stallhofstraße 28 (Gratwein), Schwarzer Weg 18 (Graz) y
Drautalresidenz (Paternion). Las seis son de reventa en Brickwise.

## Lo importante: hoy no las puede comprar un particular de España

**Las seis piden número fiscal austriaco para comprar.** Hasta ayer la ficha
decía «España: sin confirmar». Hoy queda claro que la respuesta es **no**,
salvo que el comprador ya tenga un número fiscal de Austria.

- **Qué tipo de producto son.** Las seis son productos de capital. La API de
  cada una (17:42 UTC) dice `securityType=participationRightEquity` y que el
  emisor tiene domicilio en Austria (`spv.address.countryCode=AUT`). En el
  mercado de la app no llevan la etiqueta «KESt», que es la de los productos
  de deuda.
- **Qué dice la ayuda de Brickwise** («Wie sind die Erträge zu versteuern?»,
  17:42:38 UTC):
  - «Investor:innen, deren Steuersitz nicht in Österreich liegt, und die in ein
    solches Eigenkapital-Produkt österreichischer Emittentinnen investieren
    möchten, können dies durch vorherige Bekanntgabe einer Steuernummer in
    Österreich tun.»
  - En llano: si no tributas en Austria, solo puedes invertir dando antes un
    número fiscal austriaco.
  - Ese número se pide a Hacienda de Austria, en persona o con un asesor
    fiscal. Brickwise ofrece ponerte en contacto con uno.
- **Qué hace la app.** Su código público, servido hoy sin sesión (descargado
  hasta las 17:46 UTC):
  - antes de comprar, comprueba si el producto es de capital, si el emisor es
    austriaco y si tu cuenta tiene número fiscal de Austria;
  - si falta, abre la ventana «Bei diesem Produkt wird eine österreichische
    Steuernummer benötigt» y no deja seguir con la compra;
  - esa ventana solo ofrece dos botones: «Steuernummer hinzufügen» o «In ein
    anderes Produkt investieren»;
  - para vender no lo pide.

  No pulsé «Kaufen» ni inicié sesión: lo vi en el código.
- **Además hay impuestos en Austria.** Las rentas son de alquiler y tributan
  allí: el emisor presenta una declaración conjunta de todos los inversores,
  y para eso necesita el número fiscal de cada uno. Al vender con ganancia se
  paga en Austria el impuesto inmobiliario (ImmoESt), con un pago anticipado.
  - Hay una contradicción: la hoja informativa original de cada emisión (de
    2022) dice que el emisor retiene la «Kapitalertragsteuer».
  - Manda lo que dicen hoy la ayuda y la app.

**Propuesta: `retirar_propuesta` en las seis.** Un cliente normal de España no
puede comprarlas hoy: antes tiene que hacer un trámite con Hacienda de Austria
y después declarar allí.

Si Víctor prefiere mantenerlas, la tarjeta debe decir «España: No», con este
texto: «No: la app no deja comprar esta emisión sin número fiscal austriaco
(se pide a Hacienda de Austria).» Debe llevar también el aviso del número
fiscal, el mismo que ya llevan Randhartingergasse 9 y Hinterstoder 50.

Para el coordinador:
- Randhartingergasse 9 y Hinterstoder 50 (grupo `brickwise-b`) son del mismo
  tipo y tienen el mismo problema.
- La propia app dice que los productos «KESt» (de deuda) se pueden comprar
  sin ese número: Pottendorfer, GreenPoint y Cohotel.

## Cifras de hoy (API pública, 17:42 UTC)

Mi lectura tiene **los mismos bytes que la del vigía**: SHA-256 `edaee0fe…` en
la v1 y `b6d47201…` en la v2.

| Ficha | Venta más barata | Orden de menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Plüddemanngasse | 75 € · 2 en 1 orden (04/11) | 1 × 99 € → 100,49 € | 335 | 20 € (23/04) |
| Sonnleithnergasse | 75 € · 11 en 1 orden (28/04) | 1 × 80 € → 81,20 € | 97 | 65 € · 2 en 2 órdenes |
| Klagenfurt | 95 € · 16 en 3 órdenes | 1 × 95 € → 96,43 € | 299 | 15 € (21/09) |
| Stallhofstraße | 68,80 € · 1 (08/11) | 1 × 68,80 € → 69,83 € | 315 | 30 € (01/07) |
| **Schwarzer Weg** | **71,90 € · 1 (18/09)** | **1 × 71,90 € → 72,98 €** | **297** | 62 € (17/11) |
| Drautalresidenz | 70 € · 1 (17/11) | 1 × 70 € → 71,05 € | 147 | 50 € (29/09) |

- **Schwarzer Weg cambia, como dijo el vigía.**
  - La venta más barata sube de 69,90 € a 71,90 €.
  - Hay 297 participaciones en venta (ayer, 298).
  - La orden de 69,90 € (del 27/10) ya no está. La API no dice si se vendió o
    se retiró.
  - El mercado de la app enseña lo mismo: «Preis pro Anteil ab € 71,90»
    (17:43 UTC).
- **Las otras cinco no cambian.** Solo cambia la fecha.
- **En Plüddemanngasse y Sonnleithnergasse, los 75 € solo se venden en lote**:
  de 2 y de 11 participaciones. La participación suelta más barata cuesta
  99 € y 80 €. Lo anoto en la ficha, sin cambiar el formato del mínimo.

## Lo demás, sin cambios

- **Documentos.**
  - Releí hoy a mano el KID, el contrato y el Informationsblatt de las seis:
    tienen el mismo SHA-256 que lo publicado.
  - Kosteninformationen y Rücktrittsbelehrung, re-fechados con el vigía (mismo
    SHA-256).
  - Corregí en los expedientes dos citas del KID que estaban mal copiadas. La
    ficha publicada ya las cita bien.
- **Ayudas de Brickwise e Impressum.** La cuenta se abre con residencia en el
  EEE, cómo funciona el mercado e Impressum: mismo SHA-256 que el 20/11.
- **Registros.**
  - BaFin: Effecta GmbH con los mismos permisos y Brickwise como agente
    vinculado n.º 80174029 (datos a 20/11/2026).
  - CNMV: Effecta n.º 5003, solo recepción y transmisión de órdenes, sin
    agentes. Todo igual que ayer.
- **Advertencias de la CNMV.** Sin advertencias para Brickwise, Effecta,
  BrickOne, Brick Sagarmatha ni Brick Qogir (re-fechado con el vigía,
  17:37 UTC).
- **Avisos.** Los textos de alquiler de la API son los mismos que ayer y los
  avisos siguen vigentes. El de Sonnleithnergasse habla del 29/11/2026, que
  todavía no ha llegado.

## Bloqueos

- **FMA (Austria).**
  - El buscador da 403 de Cloudflare.
  - La base de datos solo enseña el formulario, y no relleno formularios.
  - Queda la última lectura válida: 11/11, sin coincidencias.
- **Firmenbuch.** Es de pago y no se consulta.
- **Compra parcial de una orden.** Ninguna fuente pública lo confirma.
- **La ventana del número fiscal.** La vi en el código público de la app, no
  en pantalla: para verla hace falta iniciar sesión, y no se hace.

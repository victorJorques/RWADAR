# Investigación del catálogo · 3 de noviembre de 2026

Víctor la pidió el 03/11 hacia las 10:00 UTC («hazme otra investigación… lo más
actualizado posible a día de hoy»). Se repitió el método del 01/11:

- 6 grupos trabajaron en paralelo, cada uno con un expediente por oferta y
  fuentes primarias leídas ese día;
- un agente distinto revisó, abriendo él mismo las fuentes, cada alta
  propuesta, cada cambio importante y el SQL de la entrega.

Carpeta completa: `rwadar-app/data/verificaciones/2026-11-03.3-v2/`.

> **Actualización (tarde del 03/11).** Víctor decidió incluir **Kraken xStocks**
> («si es una gran oportunidad, mira cómo incluirlo»). Kraken UE lo vende online
> a clientes de la UE, y la tarjeta dice en su primer aviso que las condiciones
> finales del emisor solo lo ofrecen en Liechtenstein y Suiza, así que el
> folleto no cubre su venta en España. Revisión independiente:
> `2026-11-03.4-v2/REVISION-ALTA.md` (aprobado con cambios). Publicada en la
> entrega `2026-11-03.4`: 24 ofertas.
>
> Después decidió incluir también **Spiko Smart Cash Euro** («si es tan buena
> oferta y tú lo ves bien… adelante»). Su tarjeta avisa de que ningún registro
> público de la CNMV ni de la AMF confirma que se venda en España y cita
> literalmente la web («Interés a tipo fijo», «Garantizado por contrapartes»)
> frente al KID («No existe rentabilidad mínima garantizada»). Revisión
> independiente con tres enfoques: `2026-11-03.5-v2/REVISION-ALTA.md`
> (aprobado con cambios, 13 cambios obligatorios aplicados). Entrega
> `2026-11-03.5`: 25 ofertas.
>
> Por último pidió **retirar las ofertas que ya no valgan o ya no estén**. Se
> releyeron las 25 esa tarde, y cada propuesta de retirada la intentaron
> rebatir dos escépticos. **Sale mF-ONE:** Midas solo la vende a inversores
> profesionales con la wallet en lista blanca, sin folleto ni KID públicos.
> **Se quedan:**
>
> - **Terreno BILLA:** Brickwise la sigue vendiendo y el contrato permite
>   prorrogar.
> - **Casa de Outeiro:** el emisor publicó una prórroga hasta el 31/03/2027,
>   en su ficha de datos del 30/10.
>
> Esto corrige lo que dicen de ellas las tablas de abajo. Detalle:
> `2026-11-03.6-v2/comprobacion-retiradas.json`. Entrega `2026-11-03.6`:
> 24 ofertas.

## 1. En pocas palabras

- **Las 23 ofertas publicadas siguen**, comprobadas hoy con sus fuentes
  oficiales. No hay que retirar ninguna, pero cambian datos:
  - **Spiko:** baja un poco la rentabilidad (euro del 2,35 % al **2,34 %**;
    dólar del 4,13 % al **3,95 %**).
  - **Brickwise:** se actualizan avisos y precios de reventa.
  - **Aktionariat y sus portales:** ninguno tiene licencia del supervisor
    suizo (FINMA).
  - **Switzerlend:** hay una contradicción nueva sobre la recompra.
- **Hoy no entra ninguna oferta nueva.** Se estudiaron 12 candidatas y ninguna
  cumple todo lo que exigimos para un particular en España. Las dos más
  cercanas las rechazó la revisión independiente:
  - **Kraken xStocks** (acciones tokenizadas desde 1 €). Kraken las vende en
    la UE, pero sus condiciones finales oficiales solo las ofrecen en
    Liechtenstein y Suiza. La venta al público en España no está cubierta por
    el folleto.
  - **Spiko Smart Cash Euro** (2,84 % neto). Ningún supervisor publica que
    ese compartimento se pueda vender en España; solo lo dice Spiko. Además,
    su web promete un «tipo fijo garantizado» que su propio KID niega.
- **Las tarjetas de reventa y de próximas dejan de decir siempre «No
  verificado»** (normas nuevas del 03/11). Ahora enseñan el mínimo, el acceso
  desde España y la salida cuando están documentados. Ejemplo: «Mínimo: desde
  80 € en reventa (03/11) · España: sin confirmar · Salida: sin reembolso;
  vendes en el tablón de la app si hay comprador».

## 2. Qué cambia en las ofertas publicadas

| Oferta | Qué cambia hoy | Fuente |
|---|---|---|
| Spiko Letras del Tesoro Euro | 2,35 % → **2,34 %** neto anualizado, 31 días (dato del 02/11). Spiko Finance figura además en la CNMV como intermediario (n.º 5325). | API pública de Spiko, recalculada con la serie de valores liquidativos |
| Spiko Letras del Tesoro Dólar | 4,13 % → **3,95 %** en dólares (dato del 02/11) | Íd. |
| Robinhood y Prosegur | Sin cambios: los documentos son los mismos (mismo SHA-256) | Documentos del proveedor y relación de la CNMV |
| mTBILL | Sin cambios. Sigue el conflicto de límites de reembolso entre documentos; hoy no se pudo leer la rentabilidad, así que no se publica. | Condiciones Finales, KID y ESMA |
| Aktionariat | Mismo precio del emisor (7,25 CHF) y vendedores a 6,20 ZCHF. Sin licencia FINMA. | Portal del emisor y registro de FINMA |
| Boss Info | Sin licencia FINMA. El emisor veta a EE. UU., China y otros, pero no dice que la oferta se dirija al EEE: el acceso desde España sigue sin confirmar. | FAQ del emisor y FINMA |
| Switzerlend | Contradicción nueva: su web dice que recompra, pero el contrato tiene la recompra desactivada y casi sin fondos. | Contrato de compra y web |
| mF-ONE | Solo funciona la suscripción instantánea, y solo para la lista blanca. Sigue sin servir al particular común. | Contratos de Midas |
| Brickwise (11 de reventa) | Precios de reventa de hoy (Drautal 70 €, Pottendorfer 78 €…). En Stallhofstraße hay dos fechas de fin del alquiler (02/02/2022 y 31/03/2027); en Randhartingergasse, el inquilino se fue el 28/02/2026. | API pública y app de Brickwise |
| Terreno BILLA | Sigue en el 1,64 % del mínimo (82 de 5.000 participaciones); el plazo venció el 16/05 sin prórroga publicada; 14 días para desistir. | API y documentos de la emisión |
| Casa de Outeiro | Sin avance (1.121.000 € de 2.000.000 €). El fin de campaña en Alius (31/10) ya pasó y no se ve ampliación. Si el 10/11 sigue igual, propuesta de retirarla. | Alius Capital y ficha de datos |
| Hausera | Preventa de Alicante 2 el 04/11 y oferta pública el 11/11, sin documento de emisión público. El operador sigue sin registro en la CNMV. | Web de Hausera y registro ERIR de la CNMV |

## 3. Candidatas estudiadas (ninguna entra hoy)

| Candidata | Por qué no entra |
|---|---|
| Kraken xStocks | Las condiciones finales oficiales solo ofrecen el producto en Liechtenstein y Suiza. España figura solo como país al que se notificó el folleto. Ver `revision-independiente/kraken-xstocks-addenda.md`. |
| Spiko Smart Cash Euro | Ningún supervisor publica que el compartimento se comercialice en España, y la web contradice al KID («tipo fijo garantizado»). |
| Franklin grBENJI | El folleto dice que la app quizá no esté abierta a particulares y no hay quien lo venda a particulares en España. |
| Art Leasing Invest | Mínimo de 5.000 CHF y acuerdos que citan contratos que ya no son los que vende. |
| Crypto.com (acciones tokenizadas) | El KID solo se ve dentro de la app y la lista de países excluidos no es pública. |
| Assetera (xStocks) | No publica mínimo, costes, países ni documentos del producto. |
| Bono DN Group | Oferta pública solo en Alemania y Luxemburgo. |
| LCX Gold | El propio white paper dice que no está respaldado por oro. |
| Bono Valorix (Bit2Me STX) | Sale en diciembre, sin documento de emisión. |
| BeToken (Beself) | La venta terminó en septiembre de 2025 y no hay mercado secundario. |
| Fotovoltaica St. Pölten (Brickwise) | El contrato cerró la suscripción en 2024. |
| ETI de Hausera (Portfolio) | Sin folleto ni KID del emisor. |

**Pistas para otro ciclo:**

- Kraken xStocks, si el emisor publica condiciones finales con España.
- Spiko Smart Cash Euro, si la CNMV, la AMF o la comercializadora confirman
  la notificación a España.
- El bono de Valorix en diciembre.
- OKX Europe y Ondo Stocks en Assetera.

## 4. Normas de las tarjetas (desde el 03/11)

Víctor pidió «cambiar las normas del catálogo a cosas con sentido».

- **Principales:** pueden llevar rentabilidad o precio, con fuente, base y
  fecha, durante 7 días.
- **Reventa y próximas:** no llevan rentabilidad ni precio principal, porque
  en reventa la rentabilidad depende del precio que pagues y una próxima aún
  no se puede comprar. La base de datos también lo exige. Sí enseñan mínimo,
  acceso desde España y salida, cuando hay un texto escrito para la tarjeta,
  en castellano, con fuente y fecha.
- **Las citas literales** de documentos (alemán, inglés) se quedan en la ficha
  completa.

Detalle: `docs/tareas/CICLO-DIARIO-CATALOGO.md`.

## 5. Cómo se hizo y qué límites tiene

- Radar: las 69 fuentes de las 26 plataformas se leyeron hoy y siguen diciendo
  lo que respaldan. El PDF del regulador bancario de EE. UU. (OCC) se leyó con
  WebFetch y su SHA-256 quedó anotado.
- No se inició sesión, no se hizo KYC ni se conectaron wallets. Los bloqueos
  por país (backed.fi) y anti-robots (midas.app) no se sortearon. Las
  condiciones finales oficiales de xStocks se obtuvieron de la propia web del
  emisor por enlaces públicos.
- Las respuestas crudas de API y de cadena (direcciones, identificadores) y
  las copias con parámetros de enlace (`token=`, `access=`) se conservan en
  disco, con su SHA-256, pero no en Git: el escáner de secretos las confunde
  con claves.

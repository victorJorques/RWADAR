# Reental · investigación del 01/11/2026

Consultas reales entre las 13:10 y las 15:10 UTC del 01/11/2026. Cada archivo
leído está en `fuentes/` y en `inventario-consultas.json`, con su URL, su hora y su
huella sha256. No se inició sesión ni se rellenó ningún formulario. Se usaron las
API públicas que usan las propias webs sin login:

- `backend.reental.co/graphql`: `getProjects`, `getPublicProperties` y `getCrowdfundingListing`, que dice cuántos tokens quedan a la venta;
- `backend.reentalp2p.com/graphql`: `getOrdersData`, la misma consulta que lanza la portada de p2p.rnt.finance.

## Lo esencial en llano

1. **Ninguna de las 22 fichas publicadas se puede comprar hoy en emisión primaria.**
   Las 21 de reventa tienen **0 tokens disponibles** en su contrato de venta. Solo
   se compran si otro inversor vende en el P2P.
2. **Las 21 URL publicadas dan error 404.** Reental ha renumerado sus fichas:
   cambia el número del principio y se mantiene el código del final. Comprobado
   con Miami 1 y Pirineos 1. El nuevo número también puede cambiar, así que es
   más estable enlazar a `reental.co/properties` o a `p2p.rnt.finance`.
3. **Moneda mal publicada en 7 fichas.** Granada 3, Rentas 1, Rentas 2, Pirineos 1,
   Levante 1, Opportunity 2 y Málaga 6 están en **EUR**, no en USD (API y ficha).
   En el P2P, en cambio, todo se paga en **USDT**.
4. **Órdenes P2P visibles sin login (15:04 UTC):** 50 órdenes en 30 inmuebles.
   Afectan a 15 de nuestras fichas. Las otras 6 no tienen ninguna orden: Proyecto
   100, Miami 5, Rentas 2, Pirineos 1, Levante 1 y Málaga 6.

| Ficha | Órdenes · tokens | Precio pedido (USDT/token) |
|---|---|---|
| Miami 1 | 1 · 2 | 110 |
| Houston 1 | 4 · 19 | 100 |
| Houston 2 | 1 · 1,5 | 96 |
| Houston 3 | 4 · 28,06 | 96–100,10 |
| San Antonio 1 | 1 · 5 | 105 |
| Atlanta 1 | 3 · 14 | 95–100 |
| Miami 2 | 1 · 6,57 | 145 |
| Miami 3 | 1 · 2 | 114 |
| Granada 3 | 2 · 1,25 | 114,98–115 |
| Carolina del Norte 1 | 1 · 2,48 | 105 |
| Abu Dhabi 1 | 2 · 11,98 | 101 |
| Rentas 1 | 1 · 0,75 | 114 |
| Rentas 3 | 5 · 22,56 | 104–107 |
| Dania Beach 1 | 1 · 5,01 | 107 |
| Opportunity 2 | 4 · 5,51 | 112–114 |

5. **Rentabilidades: no se publica ninguna.** La ficha web y la propia API de Reental
   dan cifras distintas para el mismo inmueble. Por ejemplo, en Miami 1 la ficha
   dice «14,88 % de alquiler anual» y la API dice «4,38 % + 20,95 % de plusvalía».
   Además, las cifras cambian según el nivel del inversor (Reentel, Pro o
   SuperReentel) y no llevan fecha. Son objetivos, no rentabilidades obtenidas. Lo
   he registrado como `en_conflicto`.

## Entidad, permisos y acceso

- **Quién está detrás:** Rental Token, S.L., NIF B01988393. Hay un conflicto de
  domicilio: el aviso legal de la web pone Sevilla y los términos de la app ponen
  Madrid (Registro Mercantil de Madrid, hoja M-729800). Los términos no tienen
  versión ni fecha.
- **Emisores:** cada inmueble es una «Series RNT-…, LLC» de Florida, gestionada por
  Reental America, LLC. Es una colocación privada de EE. UU.: Regulación S para
  quien no es estadounidense. El token es una participación en esa LLC y el
  contrato impide vender durante **un año**. La excepción es Málaga 6: es un
  préstamo participativo a la propia Rental Token, S.L., con un token que solo
  sirve para identificar al inversor.
- **CNMV:** «Reental», «Rental Token» y «Reental America» no aparecen en los
  registros oficiales, así que no consta como PSFP/ECSP, ESI ni entidad DLT.
  Tampoco hay **advertencias** con esos nombres, ni en la lista de «otras
  entidades». No pude consultar el registro de ESMA.
- **P2P:** según sus términos, p2p.rnt.finance lo gestiona «RNT DAO», no una
  entidad supervisada. No custodia fondos y limita su responsabilidad a 1.000 USD.
- **Acceso desde España:** la FAQ admite a cualquier mayor de edad tras KYC/AML (a
  los estadounidenses solo si son acreditados). Ningún documento confirma, producto
  por producto, la compra por un particular residente en España.

## Emisión primaria abierta hoy: Miami 7 (`reental-miami-7`) → `no_admitir`

Es la única con tokens a la venta: **8.948 de 20.000** disponibles. Lleva a la venta
desde el 16/10/2026, con un mínimo de **100 USD**. Tiene un PPM del 13/10/2026 bien
detallado:

- objetivo de 12 % / 15 % / 18 % anual simple según el nivel del inversor, en unos
  36 meses, con pago único al final;
- escenario desfavorable: 48 meses y 9,4 %, sin suelo;
- comisiones del 3 % + 1 % anual + 2 % a cargo de Estating, más un 25–50 % del
  beneficio para Reental.

Aun así no la propongo, porque:

- está marcada **«PRIVATE»** y no aparece en el catálogo público;
- el propio PPM dice que **en el EEE no se ofrece al público**: solo a inversores
  cualificados o a menos de 150 personas no cualificadas por país;
- **no hay escrow**: los fondos van a cuentas de Reental America;
- se rige por la ley de Florida, con tribunales de Miami-Dade;
- ni el emisor ni la plataforma constan en la CNMV. El certificado de la EAFN José
  María Manzanares (CNMV, EAFN n.º 21, verificado) es una revisión del documento,
  no una autorización.

**Murcia 1** (`reental-murcia-1`) → `no_admitir`: la API dice «próximamente», pero
quedan 0 tokens desde 2025.

## Decisiones (las retiradas las decide Víctor)

- `reental-emision-primaria` → **retirar_propuesta**. Es una referencia genérica sin
  ninguna emisión pública abierta. No procede sustituirla por Miami 7.
- Las **21 de reventa** → **retirar_propuesta**. Todas restan confianza: no hay
  entidad registrada en la CNMV, son colocaciones privadas, la reventa es en USDT en
  un P2P de la comunidad y no hay ninguna cifra de rentabilidad verificable.
  - 6 sin ninguna forma de compra hoy: Proyecto 100, Miami 5, Rentas 2, Pirineos 1,
    Levante 1 y Málaga 6.
  - Si Víctor quiere conservar algo de Reental, propongo **agrupar las 15 con
    órdenes** en una sola ficha de reventa P2P, con las órdenes de arriba y la URL y
    la moneda corregidas.

## Bloqueos y conflictos

- El acuerdo de Pirineos 1 da HTTP 403 en S3: no se pudo leer.
- No he vuelto a comprobar hoy la sustitución del activo de Dania Beach 1 por
  Austin 1.
- No sé qué significa «PRIVATE» sin iniciar sesión.
- El registro de ESMA no respondió.
- El certificado de Miami 7 lleva el DNI del firmante: solo guardé el texto, con el
  DNI y el correo recortados. También recorté el NIF en la URL de la CNMV.
- Conflictos abiertos:
  - mínimo de 100 € según la FAQ frente a «desde 500 €» en el catálogo;
  - domicilio de Sevilla frente a Madrid;
  - rentabilidad de la ficha frente a la de la API.

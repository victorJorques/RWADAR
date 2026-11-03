# Revisión independiente · propuestas de retirada · 02/11/2026

Revisor: Claude (sin participación en la investigación del 01/11). Solo páginas,
API y documentos públicos; sin login, KYC, formularios ni wallets; sin tocar
Supabase ni git. No he editado ningún expediente.

Todo lo que leí está en `fuentes/retiradas/` y en `inventario-retiradas.json`
(URL, hora UTC real, HTTP, bytes y sha256). Las horas de abajo son las de mi
consulta, no las de los investigadores. Mis lecturas empezaron a las 16:27 UTC
del 02/11/2026 (la sesión estuvo parada por límite de uso entre las 08:52 y las
16:27 UTC).

Qué se ha publicado y con qué se compara: el catálogo publicado es
`rwadar-site/assets/catalogo-publico-20261022.js` (fichas verificadas el 22/10).

---

## Bloque A · Reental (22 fichas)

### Qué he comprobado yo (02/11/2026)

| # | Hecho propuesto | Mi lectura | Resultado |
|---|---|---|---|
| A1 | 0 tokens disponibles en primaria en las 21 de reventa | `backend.reental.co/graphql`, `getCrowdfundingListing` de los 21 projectId + Miami 7 + Murcia 1, en una sola petición (16:27:09Z, sha256 `a2612e34…`). Las 21: `active: true`, `available: 0`. | **Confirmado** |
| A2 | Catálogo sin emisión pública abierta; la única a la venta es Miami 7 «PRIVATE» | Misma petición, `getProjects` (129 proyectos): `TOKENS_ON_SALE` 1 (Miami 7, `typeOfSale: PRIVATE`), `COMING_SOON` 1 (Murcia 1, `PRIVATE`, 0 disponibles). Las 21 son `typeOfSale: PUBLIC`. `isErir: true` en ninguno de los 129. | **Confirmado**. Novedad: Miami 7 baja de 8.948,48 (01/11) a **8.765,08** tokens disponibles: se está vendiendo. |
| A3 | Moneda EUR (no USD) en 7 fichas | `getProjects.tokenPrice.currency` = **EUR** en Granada 3, Rentas 1, Rentas 2, Pirineos 1, Levante 1, Opportunity 2 y Málaga 6; USD en las otras 14. Fichas web nuevas de Málaga 6 y Pirineos 1: «Precio del Token 100 €» (16:28:21–22Z). El catálogo publicado dice «Moneda del documento: USD» en las 21. | **Confirmado** (error real en 7 fichas publicadas) |
| A4 | Las URL publicadas dan 404 | Probadas 6 URL antiguas (Miami 1, Granada 3, Málaga 6, Proyecto 100, Pirineos 1, Houston 3): **HTTP 404** las 6 (16:28:15–20Z). Las URL nuevas de Málaga 6 y Pirineos 1 dan **200**. | **Confirmado con matiz**: el 404 afecta a la **fuente** de cada ficha (`fuentesActuales`/`documentacion.fuentes`). El **botón principal** de las 21 (`url`) apunta a `https://p2p.rnt.finance/`, que no es una de esas URL. |
| A5 | Órdenes P2P: 15 fichas con órdenes, 6 sin ninguna | `backend.reentalp2p.com/graphql`, `getOrdersData` (misma consulta que la portada, 16:27:28Z, sha256 `be65884f…`): **61 órdenes en 34 inmuebles**; vencen entre el 02/11 y el 09/11. **16** de nuestras 21 tienen órdenes; **5** no: Proyecto 100, Miami 5, Levante 1, Málaga 6 y **Rentas 1**. Todo se paga con `0xc2132D…58e8F` (USDT en Polygon). | **Discrepancia**: en 25 horas Pirineos 1 (1 orden · 1,55 tokens · 113 USDT) y Rentas 2 (1 · 40 · 115) han pasado a tener órdenes, y Rentas 1 se ha quedado sin ninguna. El subconjunto «6 sin órdenes» **no es estable** y no sirve para tratar distinto a unas fichas que a otras. |
| A6 | LLC de Florida, Regulación S | Releí el acuerdo de Houston 1 (cloudfront, 16:29:00Z): mismo sha256 que el de los investigadores (`342b9575…`). Dice «Series RNT – HOU 1, LLC, una compañía de responsabilidad limitada de Florida», tribunales de Miami-Dade, «se pone a disposición de los inversores elegibles de forma privada». En las copias de texto de los investigadores, «Regulación S» aparece en 19 de los 21 documentos; no aparece en Levante 1 (lo guardado es solo el Acuerdo Operativo, «Anexo A») ni en Málaga 6 (préstamo participativo a Rental Token, S.L.). | **Confirmado** para 19; **no verificado** para Levante 1 |
| A7 | Bloqueo de un año | Releído Houston 1, §1.4: «tendrán un plazo mínimo de **seis (6) meses**». En las copias de los investigadores, la cláusula de un año («… un (1) año, durante el cual el Inversor no venderá sus Tokens») está en 14 documentos; **Atlanta 1, Houston 1, Houston 2 y Houston 3 dicen seis meses** y Levante 1 no tiene la cláusula. | **Discrepancia**: los expedientes de esas 4 fichas citan entre comillas el texto de un año, pero no es lo que dice su documento. En Levante 1 la afirmación no tiene apoyo en el documento guardado. |
| A8 | Rental Token, S.L. sin registro en la CNMV | Listado oficial de PSFP de la CNMV (16:28:55Z): no aparece «Rental», «Reental» ni el NIF B01988393 (sí aparece Alius/Adventurees, así que el listado se leyó bien). Registro de ESI por NIF B01988393 (16:28:57Z): «No se han encontrado datos disponibles». | **Confirmado** (PSFP y ESI). No he repetido la búsqueda de advertencias. |
| A9 | Miami 7: PPM que excluye la oferta pública en el EEE | Releído el «Memorando de colocación privada» de Miami 7 (16:29:01Z), mismo sha256 que el de los investigadores (`57e7bf2d…`). «Aviso a los residentes del Espacio Económico Europeo»: «la Compañía no ha hecho ni hará una oferta de ReentalTokens … al público en ese Estado miembro», salvo a inversores cualificados, a menos de 100 o 150 personas no cualificadas, o con otras exenciones. | **Confirmado** |

### Fichas revisadas a fondo (7)

Miami 1, Granada 3, Málaga 6, Proyecto 100, Pirineos 1 y Houston 3 (URL antigua,
moneda, disponibilidad y órdenes), más Houston 1 (documento releído). De paso, la
disponibilidad, la moneda y las órdenes se comprobaron para las 21.

### Discrepancias que hay que corregir antes de decidir

1. **Bloqueo**: Atlanta 1, Houston 1, Houston 2 y Houston 3 tienen un plazo
   mínimo de **6 meses**, no de un año. Levante 1: el bloqueo y la Regulación S
   no están en el documento guardado.
2. **404**: afecta a la URL de la fuente, no al botón de la ficha publicada.
   Sigue siendo un problema, porque la fuente citada ya no existe.
3. **Órdenes P2P**: cambian de un día a otro (hoy 16 con órdenes y 5 sin ninguna).
   No conviene usar «tiene / no tiene órdenes» como criterio para retirar fichas
   sueltas.
4. **Moneda**: el error está en las 7 fichas publicadas (dicen USD). Esto no es
   motivo de retirada, pero si alguna se conserva hay que corregirlo.

### Veredicto · Bloque A

- **`reental-emision-primaria` → retirada_justificada.** Los hechos se sostienen:
  no hay ninguna emisión pública abierta. La única a la venta (Miami 7) es
  `PRIVATE` y su memorando excluye la oferta pública en el EEE.
- **Las 21 `reental-secundario-*` → retirada_justificada** como fichas
  individuales. Lo esencial se confirma: 0 tokens en primaria; LLC de Florida
  con colocación privada (Málaga 6 es un préstamo participativo); ninguna
  entidad inscrita en la CNMV como PSFP o ESI; reventa solo en un P2P de «RNT
  DAO» pagando en USDT. Además, el único dato propio de cada ficha (las órdenes)
  cambia a diario y no se puede mantener al día ficha por ficha.
  - **Alternativa menos drástica, viable:** **agrupar_en_una_ficha**. Una sola
    ficha «Reventa P2P de Reental» con fecha y hora de consulta, el número de
    órdenes y tokens del día, pago en USDT, la moneda de cada inmueble (7 en
    EUR), el plazo mínimo correcto (6 meses o 1 año según el inmueble) y el
    aviso de entidad no inscrita en la CNMV. Enlace a `p2p.rnt.finance`.
  - Si se agrupa, **no** se debe usar la lista de «6 sin órdenes» de los
    investigadores: hoy son 5 y no son las mismas.
- **Correcciones a los expedientes** (no los he editado): el claim `salida` de
  Atlanta 1 y Houston 1, 2 y 3 debe decir 6 meses. En Levante 1, los claims de
  bloqueo y de Regulación S deben pasar a `no_verificable`.

---

## Bloque B · Midas (4 fichas: mf-one, mglo, mglobal, mgloeuro)

Qué hay publicado (catálogo del 22/10): mF-ONE, mGLO y mGLOBAL en «principales»,
mGLOeuro en «en camino»; las cuatro con «Cifras pendientes de nueva revisión».

Direcciones completas de los oráculos de mGLO y mGLOBAL, que el claim 10 abrevia.
Están en el claim `estado` del mismo expediente y coinciden con la tabla oficial
de contratos de `docs.midas.app/llms-full.txt`:

- mGLO: `0x59313b6ae481e39B8E7710C8C26dC0ada3C532Ca`
- mGLOBAL: `0x66Aa9fcD63DF74e1f67A9452E6E59Fbc67f75E38`

Las direcciones de los *vaults* de emisión («Issuance vault») de Ethereum que
usaron los investigadores también coinciden con esa tabla oficial.

### Qué he comprobado yo (02/11/2026, lunes)

Lecturas en cadena de solo lectura (`eth_call`). Los selectores los calculé yo
con keccak256 y los contrasté con selectores conocidos (`paused()` = `0x5c975abb`,
`totalSupply()` = `0x18160ddd`).

| # | Hecho propuesto | Mi lectura | Resultado |
|---|---|---|---|
| B1 | Suscripción pausada el 01/11 en el contrato de Ethereum | `ethereum-rpc.publicnode.com`, bloque 26.328.312, 16:32:38Z. `paused()` del *issuance vault*: **mF-ONE = false**; mGLO = true; mGLOBAL = true; mGLOeuro = true. En otras redes: mGLO en Base (`0x2B7e…1Df1`) = true y mGLOBAL en Avalanche (`0x14A1…33dB`) = true (16:35:02Z). | **mF-ONE: ya no es cierto.** El 01/11 a las 15:05Z estaba en pausa y el 02/11 a las 16:32Z no. El 01/11/2026 fue **domingo**: pudo ser una pausa operativa de fin de semana. No lo puedo afirmar. **mGLO, mGLOBAL y mGLOeuro: confirmado**, también en día laborable y en las otras redes que comprobé. |
| B2 | Solo lista blanca | `greenlistEnabled()` = true en los 4 *vaults* de Ethereum y en los de Base y Avalanche. Control: el *vault* de mTBILL (oferta pública con folleto) da `greenlistEnabled()` = 0 en la lectura del 01/11 de los investigadores. `llms-full.txt` (16:34:11Z, idéntico al de los investigadores, sha256 `aca8b6c7…`): «Professional Whitelisting: Certain strategies are legally restricted to professional or institutional investors…». | **Confirmado** |
| B3 | Oferta exenta, sin folleto ni KID | Registro de folletos de ESMA por el LEI de Midas Software GmbH (16:34:32Z): 38 valores; ninguno es mF-ONE ni Fasanara (los subyacentes son estrategias cripto y «M1 - B1 Fund»). mGLO, mGLOBAL y mGLOeuro los emite Aureum Securitisation Fund, así que no aparecerían con ese LEI. Que sea una «Exempt offer» solo consta en el código de midas.app que guardaron los investigadores. No lo he releído (Cloudflare). | **Confirmado con alcance**: para mF-ONE, no hay folleto en ESMA; para los tres de Aureum, la prueba es el código de la web y no la he repetido. |
| B4 | mGLOeuro: 6,83 M de tokens; valor por token de 100.000 EUR → 1 EUR el 26/10 | `totalSupply()` = **6.831.030,09** (sin cambios desde el 01/11). Oráculo `0x8B7B…9609`, `description()` «mGLOeuro/EUR». Rondas: 1 = 100.000,0 (04/08), 2 = 100.000,0 (23/09) y 3 = **1,0 (26/10 19:26:23Z)**, que es también la última. En las últimas ~25 horas no hubo emisiones ni quemas de mGLOeuro (`eth_getLogs`). | **Confirmado.** La tabla oficial lo llama «mGLOeuro/USD Oracle», pero el contrato dice EUR: otra pequeña incoherencia de la documentación. |
| B5 | Primer depósito ≈ 100.000–170.000 | `minMTokenAmountForFirstDeposit()`: mF-ONE 148.000 tokens (≈ 167.700 USD al último valor, 1,1334); mGLO 114.000 (≈ 115.300 USD); mGLOBAL 114.000 (≈ 117.200 USD); mGLOeuro 98.040 (≈ 98.040 EUR). | Coincide con los investigadores. Es una lectura técnica (la unidad sale del código público), así que sigue como `no_verificable` para publicar. |

### Otras cosas que he visto

- **mGLO:** el 02/11 hubo una emisión de 1.726.224,51 mGLO en Ethereum (bloque
  26.326.740, 11:16:47Z). No la hizo el *vault* en pausa, sino otro contrato
  (`0x1732…3059`, función sin identificar). Tres horas después se quemaron
  1.725.977,23 (14:14:23Z). Parece un movimiento técnico (puente entre redes o
  similar), no una suscripción abierta. No saco conclusiones, pero el *vault* en
  pausa no es la única vía por la que se crean tokens.
- **mF-ONE:** el 02/11 a las 15:12:35Z se quemaron 415.767 tokens (`burn` del
  administrador; el suministro pasa de 58,33 M a 57,91 M). Hay reembolsos en
  marcha.
- **Reembolsos:** los cuatro *vaults* de reembolso tienen `paused()` = false.
  Quien ya tiene tokens y está en la lista blanca puede pedir el reembolso.

### Veredicto · Bloque B

| Ficha | Veredicto | Por qué |
|---|---|---|
| `mf-one` | **mantener_con_cambios** (o agruparla, ver abajo). **No** retirar por «pausada». | El hecho clave de la propuesta (suscripción pausada) es **falso hoy**. Lo que sí se sostiene: oferta exenta con memorando solo para la lista blanca, sin folleto en ESMA y con un primer depósito de unos 148.000 tokens. Según el encargo, lo que es solo para profesionales «puede entrar, marcado y con menor prioridad». Por tanto: sacarla de «principales», marcarla «solo profesionales / lista blanca» y quitar el APY no verificable. |
| `mglo` | **retirada_justificada** | Suscripción en pausa en Ethereum y en Base, también en día laborable; ya se veía «MINTING CLOSED» el 22/10. Además es oferta exenta, solo para la lista blanca y sin documentos públicos. |
| `mglobal` | **retirada_justificada** | Suscripción en pausa en Ethereum y en Avalanche; no se puede comprobar en la web desde el 06/10. Oferta exenta y solo para la lista blanca. |
| `mgloeuro` | **retirada_justificada** (está en «en camino») | Suscripción en pausa, oferta exenta y solo para la lista blanca. El cambio del valor por token de 100.000 a 1 EUR está confirmado y ningún documento público lo explica, así que no hay ninguna cifra publicable. |

**Alternativa menos drástica para el bloque:** **agrupar_en_una_ficha**. Una sola
ficha secundaria «Midas · estrategias Fasanara solo para profesionales (lista
blanca)». En ella, mF-ONE figura con la suscripción activa a fecha de consulta
y las otras tres en pausa. Si se agrupa, la fecha y la hora de la lectura en
cadena deben figurar en la ficha, porque el estado de pausa cambia.

**Corrección al expediente `mf-one`** (no lo he editado): el claim `estado` y el
`motivoDecision` deben reflejar que el 02/11 a las 16:32Z `paused()` = false.
`estadoOferta` no debería ser «cerrada»: es una oferta abierta solo para la
lista blanca.

---

## Bloque C · Alius (1 ficha: iod-occasio)

Lo publicado (22/10): colección «en camino», con el aviso «el 22/10/2026 la
campaña no estaba abierta; esta referencia queda en seguimiento por si hay
nuevas emisiones». Enlace: `https://aliuscap.com/projects/iodo1`.

### Qué he comprobado yo (02/11/2026)

| # | Hecho propuesto | Mi lectura | Resultado |
|---|---|---|---|
| C1 | Emisión cerrada y completa: 120.000 € de 120.000 € | API pública de Token City que usa la web de Alius, `…/issuance/slug/iodo1/expand/…` (16:36:21Z, sha256 de la respuesta `746c2afa…`). Datos: `campaign_status: CLOSED`; campaña del 13/10 al **23/10/2026**; `target_amount` 120.000,00; `invested` **120.000**; `invested_tokens` 1.200 de `max_supply` 1.200 (100 € por token); `booked` 146.600 (hubo más reservas que importe). | **Confirmado** |
| C2 | No hay nueva emisión | `count-by-status` (16:36:22Z): CAMPAIGN 1, PRIVATE_CAMPAIGN 0, PRE_CAMPAIGN 0, CLOSED 2. La única en campaña es Casa de Outeiro, según la lectura del 01/11 de los investigadores. Esta vez no he pedido el detalle. | **Confirmado**: ninguna emisión nueva de IOD ni de otro emisor en precampaña. |
| C3 | Sin reventa | La campaña tiene `negotiation_phase: PRIMARY` y no hay ninguna fase secundaria en la API. No he buscado un tablón de reventa en otra parte de Alius. Los investigadores citan la escritura: «No hay entidades que estén comprometidas … para suministrar liquidez». | **Confirmado con alcance** (solo lo que muestra esta API) |

Una nota al margen, que no cambia el veredicto: la API dice
`minimum_offer_money: 100` (mínimo por inversor, 1 token) y
`minimum_revenue_money: 100000` (umbral para que la emisión sea válida). El claim
`minimo` del expediente junta las dos cifras en un mismo literal; conviene
separarlas si algún día se reutiliza.

De la API solo guardo un extracto (campaña, progreso, emisión y nombres de los
documentos), sin datos de personas ni las URL de los documentos.

### Veredicto · Bloque C

- **`iod-occasio` → retirada_justificada.** Está completa (120.000 de 120.000 €,
  1.200 de 1.200 tokens), cerrada desde el 23/10, sin reventa visible y sin
  ninguna emisión nueva en precampaña. Una emisión cerrada no es una oferta «en
  camino».
- Alternativa menos drástica, si se quiere seguir mostrando Alius: una
  referencia genérica «Alius Capital · próximas emisiones» (PSFP de la CNMV n.º
  11, según los investigadores), sin la cifra del 12 % ni datos de IOD.

---

## Resumen para Víctor

| Bloque | Fichas | Veredicto | Qué cambia respecto a la propuesta |
|---|---|---|---|
| A · Reental | `reental-emision-primaria` | **retirada_justificada** | Nada. Los hechos se confirman. |
| A · Reental | 21 `reental-secundario-*` | **retirada_justificada** como fichas sueltas. Alternativa viable: **agrupar_en_una_ficha** «Reventa P2P de Reental». | El plazo mínimo es de **6 meses, no 1 año**, en Atlanta 1 y Houston 1, 2 y 3. Levante 1: el bloqueo y la Regulación S no constan en su documento. El 404 es de la URL de la fuente, no del botón. Las órdenes cambian a diario: hoy hay 16 fichas con órdenes y 5 sin ninguna (antes eran 15 y 6). |
| B · Midas | `mf-one` | **mantener_con_cambios** (o agrupar) | **Hoy no está en pausa** (`paused()` = false el 02/11 a las 16:32Z; el 01/11 fue domingo). Sigue siendo solo para la lista blanca y oferta exenta, así que hay que pasarla a «solo profesionales», no retirarla por «pausada». |
| B · Midas | `mglo`, `mglobal`, `mgloeuro` | **retirada_justificada**. Alternativa: **agrupar_en_una_ficha** «solo profesionales» junto con mF-ONE. | La pausa se confirma en Ethereum el lunes y también en Base (mGLO) y en Avalanche (mGLOBAL). El cambio de valor de mGLOeuro (100.000 → 1 EUR el 26/10) se confirma. |
| C · Alius | `iod-occasio` | **retirada_justificada** | Nada. Confirmado: CLOSED, 120.000/120.000 €, sin campañas nuevas. |

**Lecturas realizadas:** 23 peticiones a fuentes públicas (Reental 14, Midas 7 y
Alius 2), entre las 16:27 y las 16:36 UTC del 02/11/2026. Todas están en
`inventario-retiradas.json`. No he releído el código de midas.app (Cloudflare),
el acuerdo de Pirineos 1 (403 según los investigadores) ni la lista de
advertencias de la CNMV.

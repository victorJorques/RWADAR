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

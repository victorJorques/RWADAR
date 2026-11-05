# Revisión independiente · grupo suiza · 05/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo las fuentes
entre las **08:21 y las 08:33 UTC** del 05/11/2026. No inicié sesión, no hice KYC,
no escribí nada en los formularios de compra (ni siquiera la cantidad) y no
conecté monederos. En las páginas de mercado solo pulsé la pestaña «Sell» para
ver la comisión, como hizo el investigador. No he editado los expedientes ni
ningún otro archivo.

- Copias de lo leído: `fuentes/suiza/` (textos, capturas e imágenes del PDF
  escaneado) y `fuentes/suiza/crudo/` (API, HTML, PDF, lecturas en cadena).
- Hora, código HTTP, tamaño y sha256 de cada consulta:
  `fuentes/suiza/inventario-revisor.tsv`.

**Veredicto global: aprobado con cambios.** Los cambios críticos se sostienen
con la fuente de hoy, y uno de los bloqueos del investigador queda resuelto (la
comisión del 1,9 % también se lee en cadena). Hay **tres correcciones
obligatorias** antes de publicar: el mínimo en cripto de Boss Info es falso tal
como está escrito, la etiqueta «Supervisor: Ninguno» no está respaldada, y en
Switzerlend «sin fondos» exagera lo que se lee en cadena.

## Correcciones obligatorias

1. **Boss Info · mínimo en cripto.** El texto «en cripto, desde 1 acción» es
   falso. La API dice `cryptoPaymentsLimit: {"enabled":true,"min":9}`
   (`https://shares.bossinfo.com/api/brokerbotsettings?ticker=BOSS`, 08:21:17Z).
   El código público del portal convierte ese 9 (un importe, no un número de
   acciones) en acciones con el precio del emisor y su incremento:
   `CRYPTOCURRENCY:t?.enabled&&t.min>0?this.#g(t.min):0`, con
   `#g(e)` = `Math.ceil(...)` sobre la curva de precio
   (`https://shares.bossinfo.com/_app/immutable/chunks/CuPMdMIh.js`,
   08:31:10Z, sha256 `af5fcf46…`). Con 8,50197 de precio e incremento
   0,000005, salen **2 acciones (unos 17,00 ZCHF)**. Una sola acción (8,50)
   no llega a 9.
   - En `resumenTarjeta.minimo` debe decir: «100 CHF por transferencia al
     emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 05/11)» (88
     caracteres).
   - Hay que corregir igual el claim `minimo` (dato) del expediente.
   - También la referencia «Mínimo de inversión» de
     `documentacion-ofertas.json`, que ya publicó «en cripto, desde 1 acción»
     el 03/11.
   - Los 100 CHF por transferencia sí son correctos. En la práctica son 12
     acciones (102,02 CHF).
2. **Aktionariat y Boss Info · métrica «Supervisor».** El expediente cambia lo
   publicado («Sin supervisión prudencial: no figura en el registro de
   FINMA…») por «**Ninguno**: no figura en el registro de autorizados de
   FINMA».
   - El registro de FINMA solo recoge las entidades que autoriza FINMA. No
     incluye a las afiliadas a organismos de autorregulación contra el
     blanqueo.
   - Solo se ha comprobado PolyReg, no VQF ni los demás organismos. No he
     encontrado un listado público de miembros de VQF (las URL probadas dan 404).
   - Por eso «Ninguno» no está respaldado. Hay que volver a la fórmula
     publicada: «Sin supervisión prudencial: no figura en el registro de
     autorizados de FINMA (05/11/2026)» (89 caracteres).
3. **Switzerlend · aviso de la recompra.** «la recompra seguía desactivada y
   **sin fondos**» exagera: en cadena hay **0,0318 ZCHF**. Lo publicado decía
   «casi sin fondos». Hay que escribir «casi sin fondos» (puede añadirse
   «(0,03 ZCHF)»).

## Correcciones recomendadas (no bloquean)

- **Boss Info y Switzerlend · `resumenTarjeta.accesoEspana`.** El límite Suiza
  + EEE de §9.1 vale solo para la **compra al emisor** («The public offer to
  purchase the shares from the Company (Direct Investment)…»). En la compra
  entre accionistas no hay límite de países, salvo sanciones y personas de
  EE. UU. (§6). Como son fichas de reventa, conviene precisarlo: «Sí para
  comprar al emisor, según las condiciones del portal: Suiza y EEE, con tope
  total de 100.000 € en el EEE» (111 caracteres).
- **Switzerlend · aviso nuevo del vendedor a 67,00.** Pone el precio del
  emisor (68,01 CHF) en una ficha de reventa. No es el precio principal, pero
  Boss Info evita esa cifra en el mismo tipo de aviso. Propuesta: «Entre
  accionistas hay vendedores por debajo del precio del emisor (venta más
  barata 67,00 ZCHF el 05/11/2026).»
- **Bloqueo de la comisión (los tres).** Ya no hace falta decir que la
  comisión «sale solo del portal y de su API».
  - Hoy la he leído en cadena: `tradingFeeBips() = 190` en los tres contratos
    del mercado secundario.
  - El de LENDS (`0x2ba0…8772`) tiene código verificado en Sourcify:
    «tradingFeeBips = 190; // default trading fee is 1.9%» y «The tokenIn
    amount is reduced by the trading fee, which is always charged to the
    seller».
  - Los de DAKS y BOSS no están verificados (Sourcify 404), pero responden a
    la misma función con el mismo valor.

## Hechos comprobados

### Comunes a los tres portales

- **Condiciones del portal.** `https://shares.aktionariat.com/investor-page-terms`,
  `https://shares.bossinfo.com/investor-page-terms` y
  `https://shares.lend.ch/investor-page-terms` (08:22:19–08:22:20Z) son el
  **mismo archivo exacto**: 26.055 bytes, sha256 `d3ed3a3c…`, igual al del
  investigador.
  - Versión: «Version 1.0 • October 30, 2026».
  - Es una plantilla genérica. Define «Company» como «The company indicated in
    the imprint of the website».
  - §9.1: «The public offer to purchase the shares from the Company (Direct
    Investment) is exclusively addressed to persons domiciled or resident in
    Switzerland or the EEA. … The offer for persons from the EEA is limited to
    a total of €100,000.»
  - §4.1: «Applicable fees are borne by the seller.»
  - §4.3: «the fees are deemed to be paid by the seller».
- **Pie de cada portal** (HTML, 08:30:29–08:30:31Z). Los tres enlazan
  `<a href="./investor-page-terms">Terms of Service`. El pie de Boss Info dice
  «This page is hosted by Boss Info … ©2026 Boss Info (site content)», y el de
  LEND, lo mismo con «Switzerlend». La «Company» de esas condiciones es, por
  tanto, el emisor de cada portal.
- **Comisión en la página** (renderizado con Chromium, pestaña «Sell»):
  - Aktionariat (08:24:07Z): «Fee (1.9%): 0.12 ZCHF · Total Value: 6.08 ZCHF».
  - Boss Info (08:24:19Z): «Fee (1.9%): 0.16 ZCHF · Total Value: 8.24 ZCHF».
  - Switzerlend (08:24:31Z): «Fee (1.9%): 1.27 ZCHF · Total Value: 65.73 ZCHF».
  - En la pestaña «Buy» de los tres: «Fee (0%)».
- **Comisión en la API** (`/api/secondarymarketsettings`, 08:21:15–08:21:20Z):
  `"buyerFeeRate":0,"sellerFeeRate":0.0190` en DAKS, BOSS y LENDS.
- **Comisión en cadena** (`https://ethereum-rpc.publicnode.com`, bloque
  26347458, 08:32:37Z): `tradingFeeBips()` = 190 y `CURRENCY()` = ZCHF
  (`0xb58e…21cb`) en `0x2b0f…6a9c` (DAKS), `0x1e31…cf4d` (BOSS) y `0x2ba0…8772`
  (LENDS).
- **Venta y recompra del emisor en cadena** (bloque 26347406, 08:22:03Z).

  | Contrato | settings | getPrice | increment | ZCHF | acciones |
  |---|---|---|---|---|---|
  | DAKS `0x2f2c…350b` | 1 | 7,25 | 0 | 928 | 16.737 |
  | BOSS `0x3e73…4e69` | 1 | 8,50197 | 0,000005 | 2.491,46 | 11.171 |
  | LENDS `0x8d90…9b65` | 5 | 68,0105 | 0,0005 | 0,0318 | 57 |

  El código verificado del Brokerbot (Sourcify, 08:22:18Z) dice
  «BUYING_ENABLED = 0x1», «SELLING_ENABLED = 0x2» y «if
  (!hasSetting(SELLING_ENABLED)) … revert Brokerbot_SellingDisabled()». Es
  decir: los tres venden y ninguno recompra.
- **Historial de operaciones** (`/api/secondarymarkets/getTrades`,
  08:21:17–08:21:21Z). Mismo sha256 que el investigador en los tres: ninguna
  operación nueva. Detalle por oferta abajo.
- **Reguladores:**
  - **FINMA, autorizados** (08:28:28–08:28:29Z): «Aktionariat», «Boss Info» y
    «Switzerlend» dan Count 0. El control «Sygnum» da 1 («Sygnum Bank AG»).
  - **FINMA, lista de advertencias** (08:28:30Z): 2.401 entradas. Ninguna
    coincide con aktionariat, boss info, bossinfo, switzerlend, lend.ch,
    lends, frankencoin ni zchf.
  - **CNMV, entidades no autorizadas** (08:28:45–08:28:54Z): «Aktionariat»,
    «Boss Info» y «Switzerlend» dan «No hay datos disponibles». El control
    «Capital» da «Página 1 de 40». «Lend» solo devuelve «CREDERE LENDING», que
    no tiene relación.
  - **PolyReg** (08:28:55–08:28:57Z): Aktionariat AG `false`, Boss Info AG
    `false`, Switzerlend AG `true`. Control con un nombre inexistente: `false`.
  - **Zefix** (08:29:24–08:29:25Z): las tres sociedades «EXISTIEREND», con el
    mismo sha256 que el investigador.

### Aktionariat (principales)

- **Precio del emisor 7,25 CHF.** En /invest (08:25:04Z): «Price per DAKS 7.25
  CHF». En cadena: 7,25 con incremento 0.
- **Mejor compra entre accionistas 6,10 por 10 acciones.** API getOrderBook
  (08:21:16Z), compras: 6,10×10, 6,00×5, 5,00×100, 4,50×9, 4,00×1, 3,33×3,
  3,00×1, 2,00×7 y 1,00×20. Suman 156 acciones y 682,49 ZCHF. En /trade
  (08:24:04Z): «Bid/Ask 6.10 / 6.20», «Spread: 0.10 (1.61%)». El 03/11 era
  6,00×5 con un diferencial del 3,23 %: confirmado.
- **Vendedores.** 6,20×356, 6,25×1.389, 6,80×40, 6,90×10, 7,20×1.000 y
  8,50×1. Por debajo del emisor desde 6,20: confirmado.
- **Mínimo.** `bankTransferLimit min 500` y `cryptoPaymentsLimit min 0`
  (08:21:15Z). Con incremento 0, el código da 69 acciones (500,25 CHF) por
  transferencia y 1 acción (7,25) en cripto. El texto de la tarjeta es
  correcto.
- **Recompra cerrada.** `"onlyBuySide":true` y `disabledSellText`: «the
  sell-side of the Brokerbot will remain disabled for the foreseeable future»
  (08:21:15Z). En cadena, settings = 1.
- **Acceso.** `https://www.aktionariat.com/disclaimer` (08:27:09Z, sha256
  `06937b73…`, igual que el investigador): «exclusively addressed to persons
  domiciled or resident in Switzerland or the EEA … limited to a total of
  €100,000».
- **Actividad.** Última compra al emisor el 31/10/2026 a las 11:56:35Z (1
  acción a 7,25). Última entre accionistas el 30/09/2026 (6,25). En 12 meses:
  25 compras al emisor (6.096 acciones) y 53 entre accionistas. Ninguna
  posterior al 31/10.
- **Documentos sin cambios.** Registration Agreement `9b4ebb70…` y Token Holder
  Agreement `650eec36…` (08:27:38–08:27:39Z), con el mismo sha256.

### Boss Info (secundario)

- **Precio del emisor y libro.** /invest (08:25:22Z): «Price per BOSS 8.5 CHF».
  /trade (08:24:17Z): «Buy BOSS at 8.502 CHF», «Bid/Ask 7.30 / 8.40»,
  «Spread: 1.10 (13.10%)». En la API, compras 7,30×1.000 y 6,51×1.500 y
  venta 8,40×104. Igual que el 03/11.
- **Recompra.** `disabledSellText`: «Aktuell ist der Ankauf von Aktien aufgrund
  eines Wartungsfensters deaktiviert.» En cadena, settings = 1.
- **Actividad.** Última compra al emisor el 29/06/2026 (183 acciones). Última
  operación el 28/09/2026 entre accionistas (474 a 6,70). En 12 meses: 10
  compras al emisor (448 acciones) y 70 entre accionistas. Confirmado.
- **Moneda de la FAQ.**
  `https://www.bossinfo.com/unternehmen/investor-relations/investor-faq/`
  (08:27:03Z): «Der Krypto Schweizer Franken ist 1:1 mit CHF gedeckt …
  Informationen zum xCHF www.bitcoinsuisse.com/de/cryptofranc». El portal
  liquida en ZCHF (`baseCryptoCurrency":"ZCHF"` y `CURRENCY()` en cadena). El
  aviso nuevo es correcto.
- **Lista de países vetados de la FAQ.** «Wer kann keine Aktien kaufen? …
  United States of America, People's Republic of China, Afghanistan …
  Yemen.» España no está.
- **FAQ en inglés.** `https://www.bossinfo.com/en/company/investor-relations/investor-faq/`
  da 404, también al investigador.
- **Reglamento de registro.** sha256 `61327722…` (08:27:41Z), sin cambios.

### Switzerlend (secundario)

- **Precio y libro.** /invest (08:25:38Z): «Price per LENDS 68.01 CHF». /trade
  (08:24:28Z): «Bid/Ask 59.00 / 67.00», «Spread: 8.00 (11.94%)».
  - Vendedores: 67,00×15, 67,50×10, 67,90×25 y 68,00×150.
  - Comprador: solo 59,00×4.
  - El 03/11 era «Bid/Ask 59.00 / 67.50». El vendedor nuevo a 67,00 queda
    confirmado.
- **Recompra.** La web, `https://www.lend.ch/de/investor-relations`
  (08:27:07Z), dice: «Du kannst an den Brokerbot zurückverkaufen, sofern
  dieser über genügend Liquidität verfügt». La versión en inglés (08:27:08Z):
  «You can sell back to the brokerbot when it holds sufficient liquidity». No
  menciona países.
- **Token SHA.** Su §1.4 (PDF, 08:27:36Z, sha256 `89647998…`, sin cambios)
  dice: «The Issuer is under no obligation to offer or repurchase the Share
  Tokens and may stop the Open Trading at any time or limit the Open Trading to
  selling or buying only.» Confirmado. El Token SHA tampoco dice nada de
  países.
- **Contrato en cadena.** settings = 5 (sin el bit 0x2) y 0,0318 ZCHF. El
  conflicto con la web sigue y se refuerza.
- **Registration Agreement escaneado** (08:27:37Z, sha256 `6d0ffcee…`). Lo leí
  como imagen, páginas 1 a 5. Página 1: «Preferred C1 shares (Vorzugsaktien)
  of the Issuer without transfer restrictions» y «Transfer Restrictions: Not
  appliable». Las páginas 2 a 5 (§2 a §11) no tratan de países ni de
  recompra. Confirmado.
- **Mínimo.** `bankTransferLimit min 0` y `cryptoPaymentsLimit min 0`: desde 1
  acción. En cadena, el contrato solo tiene 57 LENDS para entregar.
- **Actividad.** Última compra al emisor el 07/10/2026 (10 + 1 acciones). En 12
  meses: 17 compras al emisor (63 acciones) y 2 entre accionistas. Ninguna
  operación nueva.
- **Supervisión.** PolyReg `true` y FINMA 0. La métrica «Sin licencia FINMA
  (05/11/2026); afiliada a PolyReg solo a efectos de blanqueo» está
  respaldada.

## Textos de la tarjeta (≤ 120 caracteres, castellano llano, normas del 03/11)

Los nueve textos miden entre 62 y 117 caracteres. En las fichas de reventa no
llevan rentabilidad ni precio principal, y los precios entre accionistas van
con fecha.

- **Aktionariat**: los tres textos son correctos.
- **Boss Info**:
  - `minimo`: **incorrecto** (corrección obligatoria 1).
  - `accesoEspana` y `salida`: correctos; para el acceso, ver la precisión
    recomendada.
- **Switzerlend**: los tres textos son correctos. «mejor compra 59,00 el 05/11»
  es una orden de solo 4 acciones; el aviso de «muy poca demanda» lo cubre.

## Lo que no he podido comprobar o queda fuera de las fuentes

- **¿El 1,9 % ya se cobraba antes?** Quiero comprobar si la comisión del
  vendedor era ya del 1,9 % el 01/11 y el 03/11, o sea, si es una
  «corrección» y no una subida.
  - No hay ninguna copia anterior de `sellerFeeRate` en los ciclos previos.
  - El archivo de la web (web.archive.org) cortó la conexión
    («Connection reset by peer»).
  - Indicio fuerte, pero no prueba: el código verificado fija 1,9 % como
    comisión por defecto («default trading fee is 1.9%») y no emite ningún
    evento al cambiarla.
  - Recomiendo redactar el cambio como «la ficha decía 0 % (lado comprador);
    hoy vender cuesta 1,9 %», sin afirmar desde cuándo.
- **Mínimo en cripto de Boss Info.** Sale del código del portal y de la API,
  no de un mensaje en pantalla: no escribí ninguna cantidad en el formulario.
- **Organismos de autorregulación.** No hay un buscador público de miembros de
  VQF ni de los demás organismos. Por eso «Ninguno» no se sostiene.
- **Tope del EEE.** Nadie publica cuánto queda del tope de 100.000 €.
- **Base legal fuera de Suiza.** Ni Boss Info ni Switzerlend dicen en qué
  exención de folleto se apoyan para vender fuera de Suiza.
- **Cómo se verá la ficha en la web.** El expediente dice que, con estos
  datos, las fichas de secundario «pueden volver a mostrar datos». No lo puedo
  comprobar desde las fuentes.
  - Según `rwadar-app/catalogo-publico.js`, toda ficha fuera de «principales»
    debe llevar `estadoRevision = 'no_verificable'` y `disponibleEs = null`.
  - Lo que se vea depende de cómo pinte la web los tres datos de la tarjeta en
    ese estado. Que lo compruebe el coordinador al montar la entrega.
- **Colección.** No he revisado si conviene pasar Switzerlend a «principales»:
  es una decisión editorial de Víctor. Si pasa, siguen valiendo la corrección
  3 y el conflicto de la recompra.

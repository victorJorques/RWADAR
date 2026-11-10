# Revisión independiente · grupo suiza · 10/11/2026

Yo no preparé estos expedientes. He intentado refutarlos abriendo otra vez las
fuentes primarias. Todas mis consultas son del 10/11/2026, entre las **09:33 y
las 09:44 UTC**. Solo he usado páginas, documentos, API y registros públicos, y
lecturas en cadena de solo lectura (`eth_call`, transacciones y recibos). No he
iniciado sesión, no he hecho KYC, no he pulsado nada en los portales y no he
tocado los expedientes.

Las copias están en `fuentes/suiza/`:

- textos de las páginas renderizadas y capturas;
- `extractos-revisor.txt`;
- `inventario-revisor.json` (59 entradas: hora, tamaño y sha256 de cada
  consulta);
- respuestas en crudo en `fuentes/suiza/crudo/`, fuera de Git.

He quitado de mis copias un correo personal, los nombres de las publicaciones
de Zefix y dos páginas con nombres de personas. Lo he hecho después de calcular
el sha256, y está anotado en el inventario.

## Veredicto

**Aprobado con cambios.** Los datos de los seis expedientes se sostienen con
las fuentes de hoy. He resuelto dos bloqueos del investigador (abajo). Antes de
publicar y de copiar nada a Git hay que hacer las **correcciones obligatorias**
del final: dos en Alan Frei Company, una en Boss Info y una en las copias del
grupo (hay una dirección privada).

| Asunto | Propuesta | Mi veredicto |
|---|---|---|
| aktionariat | actualizar (solo fechas) | confirmado |
| boss-info | actualizar: operación nueva del 05/11 | confirmado con cambios |
| switzerlend | actualizar (solo fechas) | confirmado |
| alan-frei-company | admitir en secundario | confirmado con cambios |
| robin-des-fermes | no admitir | confirmado |
| revario | no admitir | confirmado |
| Copias del grupo | sin datos personales | **rechazado** hasta recortar una línea |

## 1. Boss Info: la operación nueva es cierta

- **API** `https://shares.bossinfo.com/api/secondarymarkets/getTrades`
  (company 1664, 09:33:33Z). Hay 319 operaciones. La última es
  `"whenCreated":"2026-11-05T13:35:35Z","tradedShares":1, … "value":84
  (8,4)","marketType":"SECONDARY"`. Antes, la última era del 28/09 (474
  acciones a 6,70). El sha256 es idéntico al del investigador: no ha habido
  nada nuevo desde las 09:02.
- **Portal renderizado** `https://shares.bossinfo.com/` (09:37:34Z): «Current
  Price CHF 8.4 · Last trade • 5 Nov 2026, 13:35» y «5 Nov 2026 / 13:35
  Secondary Trade 8.40 ZCHF 1 BOSS».
- **En cadena: resuelvo el bloqueo del investigador.** El nodo
  `eth.drpc.org` sí devuelve el recibo (09:35:10Z). La transacción
  0x1742…365f va al contrato del mercado 0x1e31…cf4d, en el bloque 26348969
  (2026-11-05T13:35:35Z), con estado 1. Los registros dicen:
  - 1 BOSS pasa de quien vende a quien compra;
  - quien compra paga 8,40 ZCHF;
  - quien vende recibe 8,2404 ZCHF;
  - el contrato del mercado se queda 0,1596 ZCHF (el 1,9 %).

  Así quedan comprobados el importe y la comisión de esa operación.
- **Lo demás sigue igual:**
  - Libro de órdenes (API, 09:33:34Z): compra 7,30 × 1.000 y 6,51 × 1.500;
    venta 8,40 × 103.
  - Ajustes (09:33:35Z): mínimo de 100 por transferencia y de 9 en cripto;
    `disabledSellText` «Ankauf … aufgrund eines Wartungsfensters
    deaktiviert».
  - Comisiones: `sellerFeeRate 0.0190`, `buyerFeeRate 0`.
  - En cadena (bloque 26383645, 09:34:47Z): `settings()=1` (vende, no
    recompra), `getPrice()=8,50197`, 2.491,46 ZCHF y 11.171 BOSS en el
    contrato, `tradingFeeBips()=190`.
- **Aviso «Nadie ha comprado al emisor desde el 29/06/2026».** Lo he
  comprobado en cadena: la última operación con el emisor (29/06/2026,
  183 BOSS) es del contrato del emisor al comprador, es decir, una compra.
  Entre el 10/11/2025 y el 10/11/2026 hubo 10 compras al emisor (448
  acciones) y 71 operaciones entre accionistas.
- **Aviso «venta más barata 8,40 ZCHF el 10/11/2026».** Vigente: el
  renderizado de `/trade` (09:37:44Z) dice «Bid/Ask 7.30 / 8.40» y «Buy BOSS
  at 8.502 CHF».
- **Registros:**
  - FINMA «Boss Info» = 0 (09:36:31Z; control «Sygnum» = 1).
  - CNMV «Boss Info»: «No hay datos disponibles» (09:36:44Z).
  - Lista de advertencias de FINMA: 2.402 entradas, ninguna coincide
    (09:36:32Z).
  - Condiciones del portal: sha256 efd5860f…, igual en los cuatro portales
    (09:44:11Z).
- **Textos de la tarjeta.** Los tres caben (88, 111 y 112 caracteres), están en
  castellano llano y tienen respaldo. El resumen nuevo es correcto. Falta la
  corrección de la documentación de la ficha (obligatoria 3).

## 2. Aktionariat y Switzerlend: sin cambios de fondo (muestreo de fichas «sin cambios»)

**Aktionariat** (09:39:26–09:39:28Z y bloque 26383671, 09:39:51Z):

- Precio: `getPrice()=7,25`, incremento 0. `settings()=1`: el emisor vende y
  no recompra.
- `disabledSellText`: «the sell-side of the Brokerbot will remain disabled for
  the foreseeable future».
- Mínimo por transferencia: 500.
- Última compra al emisor: 31/10/2026 (1 DAKS a 7,25). En 12 meses, 24
  compras al emisor.
- Libro de órdenes: compra 6,10 × 10 (8 niveles, 155 acciones); venta
  6,20 × 356.
- Comisión: `sellerFeeRate 0.019` y `tradingFeeBips()=190`.
- Aviso legal `https://www.aktionariat.com/disclaimer`: «exclusively addressed
  to persons domiciled or resident in Switzerland or the EEA … limited to a
  total of €100,000».
- FINMA «Aktionariat» = 0 (09:42:39Z). CNMV: «No hay datos disponibles»
  (09:42:41Z).

**Confirmado.**

**Switzerlend** (09:39:28–09:39:30Z y bloque 26383671):

- `settings()=5`: el emisor vende; la recompra está apagada.
- 0,0318 ZCHF en el contrato. Precio 68,0105.
- Última compra al emisor: 07/10/2026.
- Libro de órdenes: compra 59,00 × 4; venta 67,00 × 15.
- Mínimo 0: en la práctica, 1 acción.
- Comisión: `tradingFeeBips()=190`.
- La web `https://www.lend.ch/de/investor-relations` sigue diciendo «Du
  kannst an den Brokerbot zurückverkaufen, sofern dieser über genügend
  Liquidität verfügt».
- FINMA «Switzerlend» = 0. PolyReg `result: true` (09:42:40Z). CNMV: «No hay
  datos disponibles».

**Confirmado.** Los tres textos de la tarjeta de las dos fichas caben en 120
caracteres y están respaldados.

## 3. Alan Frei Company (candidata): se sostiene, con cambios

| Punto | Lo que he comprobado hoy |
|---|---|
| Entidad | Zefix `firm/1527753` (09:36:30Z): «Alan Frei Company AG», CHE-482.713.456, EXISTIEREND, Zúrich, `auditFirms: null`. Es un registro mercantil, no una licencia. |
| Regulador | FINMA «Alan Frei» = 0 (09:36:31Z). PolyReg `result: false` (09:42:41Z). Sin supervisión, igual que las tres fichas suizas ya publicadas. |
| Advertencias | CNMV «Alan Frei» y «Alan Frei Company AG»: «No hay datos disponibles» (09:36:40–42Z; control «Capital»: «Página 1 de 40»). Lista de FINMA: 0 de 2.402. |
| Abierta hoy | En cadena (bloque 26383645): `settings()=3`. El código verificado en Sourcify (coincidencia exacta, 09:35:49Z) dice `BUYING_ENABLED = 0x1` y `SELLING_ENABLED = 0x2`: el emisor vende y recompra. Portal (09:38:03Z): «Buy AFS at 1.6027 CHF · bank transfer or crypto». |
| Última venta del emisor | **Resuelvo otro bloqueo.** He leído en cadena las transacciones del 20/10/2026 (09:35:20Z): las acciones van del contrato del emisor al comprador, así que son compras. En 12 meses: 91 compras al emisor (60.141 acciones) y 3 recompras (1.820 acciones). **La última recompra fue el 12/01/2026.** |
| Acceso desde España | `https://alanfrei.com/investor` (09:33:38Z): «only open to persons domiciled or resident in Switzerland or in the EEA … in the EEA to €100,000 per year». Condiciones del portal §9.1 (09:33:37Z): «The offer for persons from the EEA is limited to **a total of** €100,000». **Las dos fuentes no dicen lo mismo** (obligatoria 1). |
| Mínimo | `brokerbotsettings` (09:33:37Z): `bankTransferLimit min 1`, `cryptoPaymentsLimit min 1`, `decimals()=0`. La web dice «No minimum investment». Desde 1 acción, 1,60 CHF. |
| Salida | El contrato tiene **479,80 ZCHF**, y vender 1.000 acciones al emisor costaría 1.602,34 ZCHF: hoy el emisor solo puede recomprar unas 299 acciones. Entre accionistas: compra 1,50 × 50 y venta 1,60 × 100 (API, 09:33:36Z). Comisión del 1,9 % para quien vende (API y `tradingFeeBips()=190`). El Token Shareholder Agreement (V 2.0, sha256 9b8b7720…, 09:42:08Z) dice: «The Issuer is under no obligation to offer or repurchase the Share Tokens». |
| Derecho | El Registration Agreement (sha256 f046305c…, 09:42:09Z) cita el contrato 0x5a90…4c93, «Alan Frei», «AF», y dice que «"Alan Frei SHA" (AFS) is a wrapper token». En cadena: `AFS.wrapped()` = 0x5a90…4c93, y las 750.000 AF están todas dentro de AFS. Cuadra. |
| Riesgos y cuentas | Cuentas de 2025 (Google Drive, sha256 dfa4fc0b…, 09:36:10Z): ingresos 99.230 (152.835 en 2024); **beneficio bruto −33.162**; pérdida −245.285 (−190.178 en 2024); patrimonio neto 325.644; caja 159.080; capital 105.000 CHF con acciones de 0,01 CHF (10,5 millones de acciones). No hay informe de auditoría. Web: «haven’t started making profits yet». |
| Actividad | Portal (09:37:53Z): «Shareholders 683». API: 877 operaciones y 18 entre accionistas en 12 meses (la última, el 08/10/2026). |

**Textos de la tarjeta:**

- Mínimo (53 caracteres): correcto.
- Salida (105): correcta.
- Acceso desde España (99): dice «100.000 € al año», que es la más favorable
  de las dos fuentes. Hay que corregirlo (obligatoria 1).

**Valoración.** No falta nada esencial con fuente primaria, y lo que dice el
expediente es cierto. Pero es una candidata floja para el criterio «pocas y
excelentes»:

- una microempresa en pérdidas;
- con ingresos que bajan un 35 % y beneficio bruto negativo;
- sin auditoría ni supervisión;
- con una recompra de unos 480 ZCHF.

Si el coordinador la admite, que vaya en secundario y con las correcciones
obligatorias 1 y 2.

## 4. Robin des Fermes y Revario: «no admitir» confirmado

**Robin des Fermes** (09:40:06–21Z):

- 176 operaciones, todas con el emisor. La última, el 02/11/2026.
- Mínimo de 225. `settings()=1`: sin recompra.
- La API del mercado responde con error 400: «has no secondary market contract
  address assigned».
- La web admite Suiza + EEE.

No hay salida.

**Revario** (09:40:07–36Z):

- 435 operaciones, todas con el emisor. 173 en 12 meses; la última, el
  26/10/2026.
- `settings()=1` y 0 ZCHF en el contrato.
- Sin mercado entre accionistas (error 400).
- En `/pages/crowdinvesting`, `/pages/details-investissement` e
  `/pages/investir-2026` no aparece ninguna condición de país.

Matiz: no es que el libro de órdenes esté vacío. Es que **no tienen mercado
entre accionistas**. La decisión no cambia.

## 5. Datos personales en las copias del grupo

- **`grupos/suiza/fuentes/switzerlend-TokenAgreement.txt`, línea 71: aparecen
  el nombre de una persona física y su dirección privada**, en la fila
  «Representative». Ese mismo archivo dice en la cabecera «Nombres de personas
  físicas recortados». La misma línea está en la copia del 05/11, que **ya está
  en Git**: `2026-11-05-v2/grupos/suiza/fuentes/switzerlend-TokenAgreement.txt`,
  línea 68.
- Los PDF de `grupos/suiza/fuentes/` llevan los nombres de quienes los firman
  (consejeros). En Git no se guardan PDF, y no deben subirse.
- En `grupos/suiza/fuentes/crudo/`, que está fuera de Git, hay:
  - un correo personal en `boss-info-brokerbotsettings.json`;
  - nombres de consejeros en los JSON de Zefix;
  - correos de desarrolladores en el código de Sourcify;
  - testimonios con nombres de inversores en `revario-crowdinvesting.html`.

  Nada de eso debe copiarse a Git.
- Expedientes y resumen: no he encontrado datos personales. «Alan Frei»
  aparece solo como parte del nombre legal de la sociedad. El concepto de la
  ilustración no menciona a ninguna persona.

## Correcciones obligatorias

1. **alan-frei-company · tope del EEE.** En `resumenTarjeta.accesoEspana`, en
   la métrica «Acceso desde España» y en el primer aviso, quitar «al año» y
   escribir «tope total de 100.000 € para el EEE». Además, anotar en los claims
   la discrepancia entre la web («per year») y las condiciones del portal
   («a total of»), con estado `en_conflicto`. Propuesta para la tarjeta (108
   caracteres): «Sí: su web y su portal abren la oferta a residentes en Suiza y
   el EEE, con tope total de 100.000 € en el EEE».
2. **alan-frei-company · riesgo del precio.** Añadir un aviso solo con cifras
   de las fuentes: «El precio lo fija el emisor (1,60 CHF por acción, 10,5
   millones de acciones); su patrimonio neto era de 325.644 CHF a
   31/12/2025.»
3. **boss-info · documentación de la ficha.** Además del resumen y de la
   descripción, añadir la referencia «Última operación · 10/11/2026: 8,40 ZCHF
   (1 acción, 05/11/2026)». Quitar, o dejar como históricas con su fecha, las
   referencias que hoy siguen llamando «último» al cruce de 6,70 del 28/09:
   «Último cruce publicado», «Última operación publicada · 22/10/2026» y
   «Último cruce secundario · 22/10/2026».
4. **Copias del grupo.** Antes del commit, recortar la línea 71 de
   `grupos/suiza/fuentes/switzerlend-TokenAgreement.txt`. Avisar al
   coordinador de que la copia del 05/11, que ya está en Git, tiene la misma
   línea (68). No subir PDF ni nada de `crudo/`.

## Correcciones recomendadas

- **alan-frei-company:**
  - En el resumen, cambiar «hoy también recompra» por «el 10/11/2026 también
    recompraba».
  - Al aviso de la recompra, añadir «la última recompra fue el 12/01/2026».
  - Al aviso de las cuentas, añadir «ingresos en descenso (152.835 CHF en
    2024)».
  - En el expediente, sustituir el bloqueo «la API no distingue compras de
    recompras» por la comprobación en cadena.
- **boss-info:** en el resumen, poner la moneda: «8,50 CHF» y «8,40 ZCHF».
  Quitar del expediente el bloqueo del recibo, que ya está resuelto con
  `eth.drpc.org`.
- **robin-des-fermes / revario:** cambiar «libro vacío» por «sin mercado entre
  accionistas (la API no tiene contrato asignado)».

## Bloqueos y límites

- No he probado el registro, el KYC, ni una compra o una venta.
- Nadie publica cuánto queda del tope de 100.000 € para el EEE.
- No he comprobado en qué exención de folleto se apoya la venta en España.
  Ningún emisor lo cita.
- No he revisado el cribado sin expediente (EHC Kloten, AyurVeda, Green Monkey
  Club, Green Consensus y demás).
- `ethereum-rpc.publicnode.com` no da recibos; he usado `eth.drpc.org` para
  los recibos y publicnode para las lecturas `eth_call`.

# Revisión independiente · grupo suiza · 12/11/2026

Revisé los expedientes de **Aktionariat**, **Boss Info** y **Switzerlend**.
No los preparé yo. Abrí yo mismo todas las fuentes entre las **00:45:34 y las
00:50:38 UTC** del 12/11/2026, unos minutos después del investigador (00:33 a
00:43 UTC). Solo leí páginas, API públicas y la cadena de bloques: sin
registrarme, sin KYC y sin firmar nada.

## En una frase

**Confirmo lo que dice el investigador: no cambia nada de fondo en ninguna de
las tres.** Las fechas pueden pasar al 12/11. Hay **una corrección
obligatoria**, pequeña, en Boss Info: la fuente de la referencia «Última
operación» no se puede abrir como visitante.

| Ficha | Decisión del investigador | Mi veredicto |
|---|---|---|
| aktionariat | actualizar (solo fechas) | confirmado |
| boss-info | actualizar (solo fechas) | confirmado con cambios (C1) |
| switzerlend | actualizar (solo fechas) | confirmado |

No hay cambios críticos, ni propuestas de admitir o retirar en este grupo.

## 1. Lo que comprobé hoy

### API de los portales (00:45:34–00:45:40Z)

- **Historial de operaciones** (`POST …/api/secondarymarkets/getTrades`): el
  SHA-256 es **igual que el del 11/11** en los tres (`6f9b3656…`, `f02ec19d…`
  y `97a527d4…`). No hay operaciones nuevas.
  - Aktionariat: 1.231 operaciones. La última compra al emisor es del
    31/10/2026, 1 acción a 7,25.
  - Boss Info: 319 operaciones. La última es del 05/11/2026 a las 13:35 UTC, 1
    acción a 8,40 ZCHF. La última compra al emisor es del 29/06/2026.
  - Switzerlend: 94 operaciones. La última compra al emisor es del 07/10/2026.
- **Libro de órdenes** (`getOrderBook`): mismo contenido que la copia del
  investigador y que la del 11/11 (solo cambia `whenUpdated`).
  - Aktionariat: compra 6,10 × 10; venta 6,20 × 356.
  - Boss Info: compra 7,30 × 1.000; venta 8,40 × 103.
  - Switzerlend: compra 59,00 × 4; venta 67,00 × 15.
- **Configuración de compra** (`brokerbotsettings`): mismo SHA-256 que la
  copia del investigador. Frente al 11/11 solo cambian los tipos de cambio.
  - Mínimo por transferencia: 500 (Aktionariat), 100 (Boss Info) y 0
    (Switzerlend). Mínimo en cripto: 0, 9 y 0.
  - Aktionariat: «the sell-side of the Brokerbot will remain disabled for the
    foreseeable future».
  - Boss Info: «Aktuell ist der Ankauf von Aktien aufgrund eines
    Wartungsfensters deaktiviert.»
  - Sigue sin aparecer el campo `identityVerification`.
- **Comisión entre accionistas** (`secondarymarketsettings`, mismo SHA-256 que
  el 11/11): `sellerFeeRate 0.019` y `buyerFeeRate 0` en los tres.

### En cadena (Ethereum, solo lectura, bloque 26.395.364 de las 00:46:23Z)

| | `settings()` | `getPrice()` | ZCHF en el contrato de compra | comisión del mercado |
|---|---|---|---|---|
| Aktionariat | 1 | 7,25 (incremento 0) | 928 | 190 pb, abierto |
| Boss Info | 1 | 8,50197 | 2.491,46 | 190 pb, abierto |
| Switzerlend | 5 | 68,0105 | **0,0318** | 190 pb, abierto |

- El código verificado del contrato de compra de LENDS en Sourcify (00:46:39Z,
  mismo SHA-256 que el 11/11) define `BUYING_ENABLED = 0x1`,
  `SELLING_ENABLED = 0x2` y `KEEP_ETHER = 0x4`.
- Por eso 1 y 5 quieren decir que **el emisor vende pero no recompra** en los
  tres.
- Con ese dato se sostiene el aviso de Switzerlend: «el 12/11/2026 la recompra
  seguía desactivada y casi sin fondos (0,03 ZCHF)».
- La operación de Boss Info del 05/11 (`0x17427561…`) existe en cadena (00:50:38Z):
  - va al contrato del mercado entre accionistas de BOSS;
  - está en el bloque 26.348.969, del 05/11/2026 a las 13:35:35 UTC.
  - El nodo público no devolvió el recibo, así que **hoy no releí el importe**.

### Portales con el navegador (sin sesión, 00:47:59–00:48:41Z)

- Aktionariat:
  - `https://shares.aktionariat.com/invest`: «Price per DAKS 7.25 CHF».
  - `/trade`: «Bid/Ask 6.10 / 6.20» y «Buy DAKS at 7.25 CHF».
  - Pestaña de venta: «Fee (1.9%): 0.12 ZCHF».
- Boss Info:
  - `https://shares.bossinfo.com/invest`: «Price per BOSS 8.5 CHF».
  - `/trade`: «Bid/Ask 7.30 / 8.40», «Buy BOSS at 8.502 CHF» y «5 Nov 2026 /
    13:35 Secondary Trade 8.40 ZCHF 1 BOSS».
  - Pestaña de venta: «Fee (1.9%): 0.16 ZCHF».
- Switzerlend:
  - `https://shares.lend.ch/invest`: «Price per LENDS 68.01 CHF».
  - `/trade`: «Bid/Ask 59.00 / 67.00» y «Buy LENDS at 68.0105 CHF».
  - Pestaña de venta: «Fee (1.9%): 1.27 ZCHF».

### Documentos y webs (00:46:48–00:47:44Z)

- **Los 5 PDF** tienen el mismo SHA-256 que el 11/11:
  - acuerdo de registro de Aktionariat (`9b4ebb70…`);
  - Token Holder Agreement de Aktionariat (`650eec36…`);
  - reglamento de Boss Info (`61327722…`);
  - acuerdo del token LENDS (`89647998…`);
  - acuerdo de registro de LEND (`6d0ffcee…`).
- **Condiciones de los tres portales** (`/investor-page-terms`): el mismo
  archivo en los tres (`0764d616…`).
  - Literal: «Version 1.0 • October 30, 2026».
  - Literal: «9.1 Offer only valid for persons in Switzerland and the EEA».
- **Aviso legal de Aktionariat** (`https://www.aktionariat.com/disclaimer`,
  `06937b73…`): «The offer for persons from the EEA is limited to a total of
  €100,000.» También: «Once certain thresholds are reached, it is the
  responsibility of the issuer to publish a prospectus».
- **Web de LEND** (`https://www.lend.ch/en/investor-relations`):
  - Responde con una **redirección 301 a lend.ch**, como dice el investigador.
  - Literal: «You can sell back to the brokerbot when it holds sufficient
    liquidity». El conflicto con el contrato sigue igual.
- **FAQ de Boss Info** (mismo SHA-256 que la copia del investigador): sigue
  diciendo «Informationen zum xCHF» y no menciona ZCHF ni Frankencoin. El aviso
  sigue vigente.

### Registros (00:46:52–00:47:46Z)

- **FINMA, registro de autorizados**
  (`POST https://www.finma.ch/en/api/search/getresult`):
  - 0 resultados para «Aktionariat», «Boss Info» y «Switzerlend»;
  - la búsqueda de control, «Sygnum», da 1.
- **FINMA, lista de advertencias:** 2.404 entradas. Ninguna de las tres.
- **PolyReg** (`https://api.polyreg.ch/api/membership-check`):
  - Switzerlend AG: `"result": "true"`;
  - Aktionariat AG y Boss Info AG: `"false"`.
- **Zefix:** las tres existen («EXISTIEREND»), con el mismo SHA-256 que el
  11/11.
- **CNMV, buscador de entidades advertidas**
  (`https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`):
  - «No hay datos disponibles» en las seis búsquedas (cada nombre con y sin
    «AG»);
  - la búsqueda de control, «Capital», sí devuelve advertencias.

**Conclusión:** todo lo que dice el investigador sobre los datos se sostiene con
las fuentes de hoy. Las fechas de las métricas y de los avisos pueden pasar al
12/11.

## 2. Revisión ficha por ficha

### Aktionariat · confirmado

- **Lo que cambia (solo fechas):**
  - «Precio del emisor · 12/11/2026: 7,25 CHF por acción (fijo)».
  - «Supervisor … (12/11/2026)».
  - Aviso «6,20 ZCHF frente a 7,25 CHF el 12/11/2026».
- **Respaldo:** `getPrice` 7,25 con incremento 0, «Price per DAKS 7.25 CHF»,
  venta más barata 6,20 × 356 y FINMA con 0 resultados. Coinciden con hoy.
- **Textos de la tarjeta** (se conservan los publicados; ninguno lleva fecha):
  - mínimo, 34 caracteres: «500 CHF por transferencia bancaria»;
  - acceso, 111: «Disponible para residentes en Suiza y el Espacio Económico
    Europeo…»;
  - salida, 53: «Venta solo a otros accionistas; el emisor no recompra».
  - Los tres son castellano llano, caben en 120 caracteres y tienen respaldo
    hoy: mínimo 500, aviso legal y recompra apagada.

### Boss Info · confirmado con cambios

- **Lo que cambia (solo fechas):**
  - mínimo «… unos 17 ZCHF el 12/11» (con 8,50197 + 8,501975, 2 acciones
    cuestan 17,00 ZCHF; el mínimo en cripto es 9);
  - «Supervisor … (12/11/2026)»;
  - aviso «venta más barata 8,40 ZCHF el 12/11/2026»;
  - referencia «Última operación».
- **Lo que se sostiene:** que lo publicado aún dice «Última operación ·
  10/11/2026» (`documentacion-ofertas.json`). Y que nadie compra al emisor desde
  el 29/06/2026.
- **Textos de la tarjeta:**
  - mínimo, 88 caracteres;
  - acceso, 118 (se conserva el publicado);
  - salida, 80 (se conserva el publicado).
  - Los tres caben en 120 caracteres, están en castellano llano y tienen
    respaldo hoy.
- **C1, obligatoria, en la referencia «Última operación»:**
  - El expediente pone como fuente
    `https://shares.bossinfo.com/api/secondarymarkets/getTrades`. Esa
    dirección solo acepta POST: abierta en un navegador responde **405**
    (comprobado a las 00:50Z). Un lector no puede ver el dato ahí.
  - Hay que mantener la fuente publicada, `https://shares.bossinfo.com/`, donde
    se lee «Last trade • 5 Nov 2026, 13:35». También vale
    `https://shares.bossinfo.com/trade`, donde se lee «5 Nov 2026 / 13:35
    Secondary Trade 8.40 ZCHF 1 BOSS».
  - El `alcance` publicado dice «consultado el 10/11/2026» y «comprobada
    también en la cadena de bloques (quien vendió recibió 8,2404 ZCHF…)». Si
    la fecha pasa al 12/11, el `alcance` tiene que decir que **hoy** se
    comprobó:
    - el portal;
    - el historial, igual byte a byte;
    - que la operación existe en cadena (05/11/2026, 13:35:35 UTC, contrato del
      mercado entre accionistas).
  - El importe de 8,2404 ZCHF se comprobó el 10/11 y hoy no se ha releído.
    Así lo reconoce el propio expediente en `bloqueos`.

### Switzerlend · confirmado

- **Lo que cambia (solo fechas):**
  - mínimo «1 acción (68,01 CHF el 12/11)»;
  - «Supervisor … (12/11/2026)»;
  - aviso de la recompra «… el 12/11/2026 … (0,03 ZCHF)»;
  - aviso «venta más barata 67,00 ZCHF el 12/11/2026».
- **Respaldo:**
  - `getPrice` 68,0105 y «Price per LENDS 68.01 CHF»;
  - mínimo por transferencia 0 (token sin decimales: 1 acción);
  - `settings` 5 con 0,0318 ZCHF en el contrato de compra;
  - venta 67,00 × 15;
  - PolyReg «true».
- **Textos de la tarjeta:**
  - mínimo, 29 caracteres;
  - acceso, 118 (se conserva el publicado);
  - salida, 105 (se conserva el publicado).
  - Los tres caben en 120 caracteres y tienen respaldo hoy.
- **Cuidado (no es una corrección):** en `cambiosRespectoPublicado`, el campo
  «ahora» del aviso de la recompra lleva un paréntesis técnico («settings 0x5
  y 0,031765… ZCHF en el bloque…»). A la tarjeta va el texto limpio de
  `propuestaTarjeta.avisos`, que es el correcto.
- **Recomendación (no obligatoria):** el texto de salida publicado dice «El
  emisor no recompra **hoy**…» sin fecha. Es cierto hoy y la ficha caduca en 7
  días, pero en una próxima reescritura sería mejor quitar «hoy» o poner la
  fecha.

## 3. Fichas sin cambios (muestreo)

Las tres fichas del grupo son «sin cambios de fondo»: solo cambian las fechas.
Las confirmé todas con las fuentes de hoy (apartado 1).

## 4. Datos personales en las copias del grupo

- **Expedientes, resumen e inventario del grupo:** no encontré nombres de
  personas físicas ni correos personales.
  - `vasb@obffvasb.pu` es el correo general de la empresa, ofuscado por la
    propia web.
  - `shareholder@lend.ch` es un buzón genérico.
- **Copias de texto fuera de `crudo/`:**
  - El correo personal de la configuración de Boss Info **no aparece**. Solo
    está en `crudo/`, como dice el investigador.
  - Las copias de la CNMV llevan el nombre de un premio de periodismo del menú
    de la CNMV. Es texto institucional y no es un dato personal.
- **PDF y fichas de Zefix**, que llevan nombres de consejeros: hoy están
  **solo en `crudo/`**, dentro de la carpeta del ciclo, que no entra en Git. La
  revisión del 11/11 encontró PDF fuera de `crudo/`; hoy eso está corregido.
- **Mis copias:**
  - el correo de la configuración de Boss Info está recortado en
    `extractos-revisor.txt`;
  - las respuestas completas y las fichas de Zefix están solo en
    `fuentes/suiza/crudo/`.

## 5. Bloqueos y límites

- Ninguna fuente bloqueada. `www.lend.ch` redirige (301) a `lend.ch` y se leyó
  siguiendo la redirección.
- El nodo público no devolvió el recibo de la operación de Boss Info del 05/11.
  Comprobé la operación y su hora, pero no el importe.
- No probé el registro ni el KYC (fuera del encargo). Sigue sin publicarse
  cuánto queda del tope de 100.000 € para el EEE.
- Los mercados entre accionistas de DAKS y BOSS siguen sin código verificado en
  Sourcify. La comisión del 1,9 % se confirma por la API, la pestaña de venta y
  `tradingFeeBips` = 190 en los tres.

## 6. Correcciones obligatorias

1. **C1 (boss-info):** en la referencia «Última operación · 12/11/2026»:
   - la fuente debe ser `https://shares.bossinfo.com/` (o `/trade`), no la API
     POST, que da 405;
   - el `alcance` debe decir que hoy se comprobaron el portal, el historial y
     que la operación existe en cadena;
   - la comprobación del importe pagado al vendedor es del 10/11.

## Archivos

- Copias: `fuentes/suiza/`.
  - Texto y capturas de los portales: `*-render-revisor.*`.
  - Literales clave: `extractos-revisor.txt`.
  - Inventario con hora, HTTP y SHA-256: `inventario-revisor.json` y
    `consultas-revisor.tsv`.
- Respuestas crudas, PDF y lecturas en cadena: `fuentes/suiza/crudo/`.

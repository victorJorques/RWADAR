# Revisión independiente · grupo suiza · 13/11/2026

Revisor independiente (no preparé estos expedientes). Volví a abrir yo mismo
las fuentes primarias entre las **08:40:36 y las 08:47:17 UTC** del 13/11/2026
(reloj del sistema, `date -u`). Fichas: **Aktionariat**, **Boss Info** y
**Switzerlend**, las tres con decisión `actualizar` y sin cambios críticos.

## Veredicto en una frase

**Aprobado con cambios.** El fondo es correcto: hoy no cambia nada en ninguna
de las tres fichas y solo hay que pasar las fechas al 13/11. Pero hay que
corregir dos cosas antes de usar los expedientes: las **horas de consulta**,
que están copiadas de ayer, y la **fuente de la referencia «Última operación»**
de Boss Info.

## Lo que comprobé hoy (fuente, literal corto, hora UTC)

| Qué | Fuente | Lo que vi | Hora |
|---|---|---|---|
| Configuración de compra (3) | `https://shares.aktionariat.com/api/brokerbotsettings?ticker=DAKS`, `https://shares.bossinfo.com/api/brokerbotsettings?ticker=BOSS`, `https://shares.lend.ch/api/brokerbotsettings?ticker=LENDS` | Igual byte a byte que la copia del investigador. DAKS `bankTransferLimit min 500`, `onlyBuySide true`, «the sell-side of the Brokerbot will remain disabled for the foreseeable future». BOSS `min 100`, cripto `min 9`, «Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert». LENDS `min 0` en transferencia y en cripto. | 08:40:36–08:40:42 |
| Historial de operaciones (3) | `…/api/secondarymarkets/getTrades` (POST, `limit 5000`) | **Igual byte a byte que el 12/11** (1.231, 319 y 94). Última compra al emisor: DAKS 31/10/2026 (1 × 7,25), BOSS 29/06/2026, LENDS 07/10/2026 (10 × 68,005). Última de BOSS entre accionistas: 05/11/2026, 1 × 8,40. DAKS en 12 meses: 23 compras al emisor (5.943 acciones) y 53 entre accionistas (3.460). | 08:40:56–08:40:59 |
| Libros de órdenes (3) | `…/api/secondarymarkets/getOrderBook` | Mismo contenido que la copia del investigador (solo cambia `whenUpdated`). DAKS: compra 6,10 × 10, venta 6,20 × 356; demanda total 155 acciones (679,49 ZCHF). BOSS: compra 7,30 × 1.000 y 6,51 × 1.500, venta 8,40 × 103. LENDS: compra 59,00 × 4, venta 67,00 × 15. | 08:40:56–08:40:59 |
| Comisión entre accionistas (3) | `…/api/secondarymarketsettings?ticker=…` | `buyerFeeRate 0`, `sellerFeeRate 0.0190` en los tres (igual byte a byte). | 08:40:56–08:40:59 |
| Cadena de bloques, solo lectura | `https://ethereum-rpc.publicnode.com`, bloque 26.404.916 (08:41:59Z); selectores calculados por mí con keccak256 | Precio del emisor 7,25 / 8,50197 / 68,0105; `settings()` 1 / 1 / 5 (el bit 0x2 de recompra, apagado en los tres); ZCHF en el contrato de LENDS 0,0318; `tradingFeeBips()` 190 e `isOpen()` 1 en los tres mercados. | 08:42:03 |
| Significado de los bits | Sourcify, contrato verificado de venta de LENDS | «BUYING_ENABLED = 0x1», «SELLING_ENABLED = 0x2», «KEEP_ETHER = 0x4». | 08:42:18 |
| Aviso legal y condiciones | `https://www.aktionariat.com/disclaimer`, `https://shares.{aktionariat.com,bossinfo.com,lend.ch}/investor-page-terms`, `https://www.aktionariat.com/terms-of-service` | Mismo SHA-256 que el 12/11. «exclusively addressed to persons domiciled or resident in Switzerland or the EEA» y «limited to a total of €100,000» (§9.1, versión del 30/10/2026; mismo HTML en los tres portales). | 08:42:28–08:42:31 |
| 4 PDF | Registration Agreement y Token Holder Agreement de DAKS, Registration Regulations de BOSS, Token Agreement de LENDS | Mismo SHA-256 que el 12/11 (9b4ebb70…, 650eec36…, 61327722…, 89647998…). | 08:42:31–08:42:35 |
| Registro mercantil | Zefix, fichas 1438805, 450692 y 1231406 | Las tres «EXISTIEREND» (Erlenbach, Farnern, Zúrich). | 08:42:48–08:42:49 |
| PolyReg | `https://api.polyreg.ch/api/membership-check?name=…` | Aktionariat AG `false`, Boss Info AG `false`, Switzerlend AG `true`. | 08:42:46–08:42:47 |
| FINMA, autorizados | `https://www.finma.ch/en/api/search/getresult` | «Aktionariat», «Boss Info» y «Switzerlend»: `Count 0` (igual byte a byte que el investigador). Control «Sygnum»: 1. | 08:44:04–08:44:06 |
| FINMA, advertencias | misma API, lista completa | 2.407 entradas (2.404 el 12/11). Nuevas: famma-ag.com, kairosbridge-ag.com, trade.12-ventures.online. Ninguna de estas sociedades ni de LEND. | 08:44:12 |
| CNMV, advertencias | `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…` | «No hay datos disponibles» para Aktionariat, Aktionariat AG, Boss Info, Boss Info AG, Switzerlend y Switzerlend AG. Además busqué la marca «Lend»: un solo resultado, ajeno (CREDERE LENDING, 09/03/2026). | 08:44:25–08:44:42 |
| Web de LEND | `https://www.lend.ch/de/investor-relations` (301 a `lend.ch`) | Sigue diciendo «Du kannst an den Brokerbot zurückverkaufen, sofern dieser über genügend Liquidität verfügt». Choca con el contrato (recompra apagada y 0,03 ZCHF). | 08:44:58 |
| Operación de BOSS del 05/11 | `eth_getTransactionReceipt` en `https://eth.drpc.org` | Bloque 26.348.969, 05/11/2026 13:35:35 UTC, al mercado entre accionistas; 1 BOSS por 8,40 ZCHF, 8,2404 al vendedor y 0,1596 de comisión (1,9 %). | 08:45:52 |
| Páginas con navegador (8) | portada, compra y mercado de los tres portales | DAKS: «Price per DAKS 7.25 CHF», «Bid/Ask 6.10 / 6.20», «Last trade • 31 Oct 2026, 11:56», «Shareholders 369». BOSS: «Buy BOSS at 8.502 CHF», «Bid/Ask 7.30 / 8.40», «Last trade • 5 Nov 2026, 13:35». LENDS: «Price per LENDS 68.01 CHF», «Bid/Ask 59.00 / 67.00», «Buy LENDS at 68.0105 CHF». Pie: «not subject to prudential supervision». | 08:46:05–08:46:55 |
| FAQ de Boss Info | `https://www.bossinfo.com/unternehmen/investor-relations/investor-faq/` | Mismo texto que la copia del investigador; España no está en la lista de excluidos («Wer kann keine Aktien kaufen?»). | 08:47:17 |

## Ficha por ficha

### Aktionariat · `actualizar` · confirmado con cambios

- Precio del emisor 7,25 CHF fijo (en cadena: incremento 0). Se puede pasar
  «Precio del emisor» al **13/11/2026**.
- «Supervisor» al 13/11/2026: FINMA da 0 resultados hoy.
- Aviso «6,20 ZCHF frente a 7,25 CHF el **13/11/2026**»: el libro lo sostiene.
- Mínimo, acceso y salida publicados: siguen respaldados hoy.
- Los demás avisos (sin folleto, sin recompra, ZCHF, 1,9 %, tope EEE): siguen
  vigentes.

### Boss Info · `actualizar` · confirmado con cambios

- Precio del emisor 8,50197; nadie compra al emisor desde el 29/06/2026.
- Mínimo «100 CHF por transferencia al emisor; en cripto, desde 2 acciones
  (unos 17 ZCHF el **13/11**)»: con 9 de mínimo en cripto y 8,50197 por acción,
  hacen falta 2 acciones (17,00 ZCHF). Correcto.
- «Supervisor» y el aviso «venta más barata 8,40 ZCHF el **13/11/2026**»:
  correctos.
- Recompra cerrada: el texto de la API y el bit 0x2 apagado en cadena lo
  confirman.
- La referencia «Última operación · 13/11/2026: 8,40 ZCHF (1 acción,
  05/11/2026)» es correcta, pero su fuente no (ver corrección 2).

### Switzerlend · `actualizar` · confirmado con cambios

- Precio del emisor 68,0105 → mínimo «1 acción (68,01 CHF el **13/11**)».
  Correcto: la configuración pública no tiene mínimo.
- Recompra apagada (`settings()` 5, sin el bit 0x2) y 0,0318 ZCHF en el
  contrato. El conflicto con la web de LEND sigue igual. Se puede pasar el
  aviso al 13/11/2026.
- «Venta más barata 67,00 ZCHF el **13/11/2026**» y «Supervisor» (con PolyReg
  `true`): correctos.

### Textos de la tarjeta (`resumenTarjeta`)

Los nueve textos están en castellano llano, tienen 120 caracteres o menos
(el más largo, 118) y están respaldados por fuentes de hoy. Los de acceso y
salida son los publicados. En el mínimo solo cambia la fecha (Boss Info y
Switzerlend). Ninguno lleva rentabilidad ni precio principal en reventa. No
dicen nunca «por participación» y no traen citas literales en otro idioma.

### Fichas sin cambios de fondo

Las tres son «sin cambios de fondo» y las he confirmado todas con la fuente de
hoy (tabla de arriba).

## Correcciones obligatorias

1. **Horas de consulta falsas en los tres expedientes.** Casi todos los
   `consultadoUtc` de `claims`, `avisosConFecha`, `registros` y
   `advertenciasReguladores` (26 de 27 en Aktionariat, 26 de 27 en Boss Info
   y 27 de 28 en Switzerlend) tienen **la misma hora exacta que el expediente
   del 12/11**, con la fecha cambiada al 13/11. Por ejemplo, el mínimo de
   Aktionariat dice `2026-11-13T00:34:27Z`, y el 12/11 decía
   `2026-11-12T00:34:27Z`. La consulta real fue a las 08:31–08:34 UTC: así lo
   dicen el `inventario-consultas.json`, las horas de los archivos de
   `fuentes/crudo/` y los propios `localizador`. A las 00:34 UTC del 13/11 el
   ciclo ni siquiera había empezado (Víctor lo pidió a las 08:25 UTC).
   - **Corrección:** cada `consultadoUtc` debe llevar la hora real de su
     consulta, tomada del inventario. Por ejemplo, el mínimo de Aktionariat
     pasa a `2026-11-13T08:31:15Z` (`brokerbotsettings`); FINMA, a
     08:31:39–08:31:41Z; la CNMV, a 08:31:50–08:32:21Z; `/trade`, a
     08:33:08Z.
   - Hasta entonces, nadie debe citar esas horas en la entrega.
   - El contenido no queda en duda: yo lo volví a leer a las 08:40–08:47 UTC
     y coincide con las copias que el investigador guardó hoy.
2. **Boss Info, fuente de la referencia «Última operación».** El expediente
   pone como fuente `https://shares.bossinfo.com/api/secondarymarkets/getTrades`.
   Un visitante que abra ese enlace recibe un **405** (lo comprobé a las
   08:45:21 UTC). Ayer el coordinador ya lo había corregido
   (`../2026-11-12-v2/DECISIONES-COORDINADOR.md`, §2 y §4).
   - **Corrección:** mantener `https://shares.bossinfo.com/` como fuente.
     La portada muestra «Last trade • 5 Nov 2026, 13:35» (08:46:26 UTC).
   - En el alcance no se debe decir que el investigador releyó hoy la
     operación en cadena, porque no lo hizo. Si se quiere decir que se
     comprobó el 13/11, la lectura que vale es la de esta revisión: en
     `https://eth.drpc.org` a las 08:45:52 UTC, 8,2404 ZCHF al vendedor y
     0,1596 de comisión.

## Bloqueos y límites

- No se probó el registro ni el KYC de los portales (prohibido).
- No se publica cuánto queda del tope de 100.000 € para el EEE.
- Los contratos del mercado entre accionistas de DAKS y BOSS siguen sin código
  verificado en Sourcify (lo dice el investigador; yo no lo reabrí). Responden
  a la misma función `tradingFeeBips()` = 190 que el de LENDS, que sí está
  verificado.
- `https://ethereum-rpc.publicnode.com` y `https://cloudflare-eth.com`
  devuelven `null` para el recibo de la operación del 05/11. Lo leí en
  `https://eth.drpc.org`.
- Ninguna fuente bloqueada. `www.lend.ch` responde con una redirección 301 a
  `lend.ch`.

## Datos personales

- En las copias del grupo que van a Git (`grupos/suiza/fuentes/*.txt`,
  `resumen-suiza.md`, `inventario-consultas.json` y los tres expedientes) no
  hay nombres de personas físicas ni correos personales. Las busqué por los
  nombres de las personas que constan en Zefix y por patrones de correo.
- La única marca es «@CNMV» (la cuenta pública de la CNMV).
- El correo personal de `brokerbotsettings` de Boss Info solo está en
  `grupos/suiza/fuentes/crudo/`, que queda fuera de Git por el `.gitignore`
  del ciclo.
- En mis copias he recortado ese correo y he guardado solo un extracto de
  Zefix, sin personas.

## Archivos

- Este informe:
  `rwadar-app/data/verificaciones/2026-11-13-v2/revision-independiente/suiza.md`.
- Copias del revisor:
  `revision-independiente/fuentes/suiza/`:
  - `render-*.txt` y capturas;
  - `inventario-revisor.json`, con 53 consultas, la hora real y el SHA-256;
  - `crudo/`, fuera de Git, con API, cadena, PDF y HTML.

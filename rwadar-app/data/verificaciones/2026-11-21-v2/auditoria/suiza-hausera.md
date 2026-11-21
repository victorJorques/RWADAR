# Auditoría independiente · ámbito «suiza-hausera» · 21/11/2026

Auditor que no investigó ni montó nada de este ciclo. Abrí yo mismo cada
fuente primaria entre las **20:15 y las 20:28 UTC** del 21/11/2026, con
peticiones normales (curl con su agente por defecto, TLS, sin cuentas, sin
pulsar botones). Copias de trabajo solo en `/tmp/auditoria-2026-11-21/`
(fuera del repositorio); los PDF de Hausera con datos personales se
descargaron solo para la huella y el texto citado.

Fichas: **Aktionariat** (principales), **Boss Info** y **Switzerlend**
(reventa) y **Hausera · próximas ofertas** (en camino). Lo auditado es lo
publicado (`2026-11-20.2-v2`) más los cambios de `DECISIONES-COORDINADOR.md`
§2 y §4, con los textos de `expedientes/` y las correcciones de
`revision-independiente/suiza.md` y `vigilancia.md`.

## Resumen en llano

- **Las cifras de hoy cuadran.** Precios del emisor, libros de órdenes,
  operaciones, mínimos, comisiones, acceso Suiza + EEE, registros (FINMA,
  PolyReg, Zefix, CNMV) y los cuatro PDF suizos y los dos de Hausera dan hoy
  lo mismo que el vigía y los revisores (mismo SHA-256).
- **Alicante 3 no ha pasado.** A las 20:20 UTC sigue en preventa
  (`PRESALE`, preventa desde el 18/11/2026, oferta pública el 25/11/2026), con
  0 tokens en Polygon y sin inscribir en la CNMV (solo SPV a SPV 8). Hoy un
  particular solo puede reservar.
- **Ocho cosas obligatorias** antes de publicar (detalle abajo):
  1. El motor de la entrega **rechazará** el mínimo corto nuevo de Hausera
     («Desde 100 € · suscripción desde el 25/11») en el paso «después de
     aplicar», porque exige que acabe en «(21/11)».
  2. y 3. Hausera dice «tiene la preventa abierta» en el resumen, en el aviso
     de la inscripción y en la transparencia: deja de ser cierto el 25/11, y
     la ficha sigue vigente hasta el 28/11.
  4. Hausera conserva una referencia con consulta del **30/09/2026**.
  5. Boss Info conserva dos referencias del **22/10/2026** que nadie manda
     quitar.
  6. y 7. Boss Info y Switzerlend dirán «no una oferta abierta» y
     «disponibilidad sin confirmar», cuando hoy el emisor vende directamente
     y admite el EEE.
  8. Switzerlend: «cobra 53,72 CHF por acción» sin decir que solo si el
     dinero de la venta alcanza.
- Seis mejoras recomendadas, de claridad.

## Lo que abrí y lo que vi (UTC)

| Qué | Fuente y hora | Resultado |
|---|---|---|
| Ajustes del portal (DAKS, BOSS, LENDS) | `/api/brokerbotsettings` · 20:15:06–20:15:13 | Mínimo por transferencia 500 / 100 / 0 CHF; en cripto 0 / 9 / 0; recompra DAKS «remain disabled for the foreseeable future»; BOSS «Ankauf … deaktiviert». Mismo contenido que el vigía salvo el tipo de cambio. |
| Comisión entre accionistas | `/api/secondarymarketsettings` · 20:15:07–20:15:13 | `buyerFeeRate 0`, `sellerFeeRate 0.0190` en las tres (mismo SHA-256 que el revisor). |
| Libros de órdenes | `POST getOrderBook` · 20:15:08–20:15:13 | DAKS compras 5,01×5, 5,00×38, 4,50×10, 2,00×5, 1,00×20 (78); venta más barata 6,20×356. BOSS 7,30×1.000 / 8,40×103. LENDS 59,00×4 / 67,00×15. |
| Operaciones | `POST getTrades` · 20:15:08–20:15:14 | Mismos archivos que el revisor (ebad27e1…, f02ec19d…, 97a527d4…). DAKS: hoy 10 a 6,10, 5 a 6,00 y 62 a 5,00; última compra al emisor 31/10/2026 (1 a 7,25). BOSS: última 05/11/2026 (1 a 8,40); última al emisor 29/06/2026. LENDS: última al emisor 07/10/2026; última entre accionistas 25/08/2026 (1 a 67,00). |
| En cadena (Ethereum, bloque 26.465.805, 20:15:35) | `getPrice`, `settings`, saldos | DAKS 7,25 · ajustes 1 · 16.737 DAKS en el contrato. BOSS 8,50197 · 1 · 11.171 BOSS. LENDS 68,0105 · 5 · 0,0318 ZCHF · **57 LENDS**. Ninguno recompra. |
| Páginas de operaciones | `/trade` · 20:16:24–20:16:26 | «DIRECT FROM ISSUER Buy DAKS at 7.25 CHF · bank transfer or crypto»; «Buy BOSS at 8.502»; «Buy LENDS at 68.0105»; «Bid/Ask 5.01 / 6.20 · Spread 19.19%», «7.30 / 8.40 · 13.10%», «59.00 / 67.00 · 11.94%». |
| Portadas | `/` · 20:16:19–20:16:21 | DAKS «Last trade • 21 Nov 2026, 08:02 · Tokenized Shares 800'000 DAKS · Shareholders 368»; BOSS «155», «10'650'100 BOSS»; LENDS «286», «27'277 LENDS», «Total Shares 31'066». Pie: «not subject to prudential supervision». |
| Acceso desde España | aviso legal y condiciones del portal · 20:16:16–20:16:18 | «exclusively addressed to persons domiciled or resident in Switzerland or the EEA … limited to a total of €100,000» (aviso legal 51971f13…; condiciones §9.1, «Version 1.0 • October 30, 2026», c77ab1ca…, el mismo archivo en los tres portales). |
| PDF suizos | 20:17:16–20:17:20 | Registration Agreement DAKS 9b4ebb70…, Token Holder Agreement DAKS 650eec36… (quórum 75 %), Registration Regulations BOSS 61327722…, Token SHA LENDS 89647998…: los mismos que en el vigía y el revisor. |
| FINMA, PolyReg, Zefix | 20:18:06–20:19:06 | Autorizados: 0 para las tres (control Sygnum: 1). Advertencias: 2.407, ninguna de las tres ni de Hausera/Holdtx. PolyReg: solo Switzerlend. Zefix: las tres «EXISTIEREND», UID y sede como en la ficha; nominal 0,10 CHF (DAKS) y 1,00 CHF (LENDS). |
| CNMV, advertencias | `ResultadoBusqueda` · 20:18:17–20:18:29 | Aktionariat, Boss Info, Switzerlend (con y sin «AG»), Hausera y Holdtx: «No hay datos disponibles», con el mismo SHA-256 que el vigía. Control «Trading» con resultados. |
| Hausera, datos de las fichas | `page-data.json` · 20:20:30–20:20:31 | Idénticos a los del expediente (f95e3a75…, 8e94a545…, f9913b84…; sitemap f21d8559…). Alicante 3 `PRESALE`, preventa 18/11/2026, lanzamiento 25/11/2026, fin 25/07/2028, 51.960 tokens. Alicante 2 `FUNDED` (preventa 04/11, lanzamiento 11/11). Alicante 1 `FUNDED` (preventa 19/10, lanzamiento 26/10). |
| Hausera, páginas | Oportunidades, ficha, términos, FAQ, portada · 20:20:31–20:25:57 | «PREVENTA ABIERTA · Inicio de preventa: 18/11/2026 · Inicio de oferta pública: 25/11/2026 · Reservar tickets»; términos: «no actúa como empresa de servicios de inversión»; FAQ: «minoristas, profesionales e institucionales»; portada: «42 operaciones realizadas · 24 operaciones terminadas · 128M€ total financiado». |
| Hausera, documentos | Drive · 20:20:48–20:20:49 | Documento de emisión 9170562a… (27 págs., 23/10/2026) y acuerdo de reserva + escritura 69cbadaf… (85 págs.): los mismos. «Ticket mínimo: 100,00 euros»; «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027»; «Si a fecha 02/12/2026 no se hubiera alcanzado al menos el 50 %…»; escritura, condición (o): 70 %. |
| Hausera, token | Polygon `0xbc10…C265` · bloque 97.724.722, 20:22:32 | `name()` «Alicante_3», `totalSupply()` 0. |
| Hausera, registros CNMV | ERIR de Ursus-3, págs. 1 a 4; PSFP; ficha ESI · 20:22:37–20:23:31 | Solo SPV a SPV 8 (últimas del 23/10/2026); ni SPV 9, 10 ni 11. PSFP: 0 coincidencias. Ursus-3: n.º 251, 29/08/2013. |
| Enlaces citados | 20:25:32–20:25:40 | Todos 200 (Drive, hausera.io, FINMA, portales, PDF). |

## Obligatorias

1. **Hausera · mínimo corto: el motor lo rechazará.** DECISIONES §2 pone
   «Desde 100 € · suscripción desde el 25/11» en
   `transparencia.minimosCortos`. Pero `entrega/despues.mjs` (línea 153,
   «mínimo corto con la fecha de la ficha») exige que todo mínimo corto de esa
   lista acabe en `(21/11)` o `21/11)`. Lo probé con la misma expresión: ese
   texto da `false`; el de Switzerlend («1 acción (68,01 CHF a 21/11)») da
   `true`. Ese paso corre **después de aplicar en Supabase**: o se para con la
   base ya cambiada y la web sigue enseñando «Desde 100 € en Alicante 3
   (20/11)», o alguien añade «(21/11)» para que pase, que es justo lo que pidió
   quitar el responsable del proyecto (y pasaría de 40 caracteres).
   **Corrección:** antes de aplicar, que esa comprobación no exija la fecha de
   la ficha a `hausera-proximas-ofertas` (por ejemplo, aplicarla solo a los
   mínimos de reventa), con su prueba en `motor.test.mjs`, y publicar
   exactamente «Desde 100 € · suscripción desde el 25/11».

2. **Hausera · aviso de la inscripción y transparencia: «tiene la preventa
   abierta».** El 25/11 empieza la oferta pública y la preventa se acaba: la
   ficha dice «Inicio de oferta pública: 25/11/2026» y el acuerdo de reserva,
   «El Periodo de Suscripción … comenzará el día 25 de noviembre de 2026». En
   Alicante 1 y 2 el estado pasó a «FINANCIADA» con su lanzamiento. La ficha
   vale hasta el 28/11: del 25 al 28/11 esa frase sería falsa.
   **Corrección:** aviso «El documento de emisión no es un folleto y la CNMV
   no lo ha revisado. Alicante 3 abrió la preventa el 18/11/2026 y el
   21/11/2026 aún no estaba inscrita en el registro de la CNMV.» y, con la
   misma forma, `documentoEspana.motivo` «… la CNMV no lo ha revisado. Alicante
   3 abrió la preventa el 18/11/2026 y el 21/11/2026 aún no estaba inscrita.
   Además, …». (O bien, vigencia de 4 días para esta ficha, hasta el 24/11.)

3. **Hausera · resumen.** Se queda el publicado: «… tiene la preventa abierta
   desde el 18/11 y la suscripción anunciada …». Pasa lo mismo desde el 25/11.
   **Corrección:** «Seguimiento de las operaciones inmobiliarias de Hausera.
   Alicante 2 ya está financiada; la siguiente, Alicante 3 (14 viviendas en
   Orihuela Costa), abrió la preventa el 18/11 y anuncia la suscripción del
   25/11/2026 al 30/06/2027.» Lo mismo en la métrica «Próxima operación»:
   «Alicante 3 · preventa desde el 18/11/2026; suscripción del 25/11/2026 al
   30/06/2027».

4. **Hausera · referencia vieja.** «Destino de consulta comprobado ·
   Plataforma inmobiliaria Hausera», con consulta del **30/09/2026**, no está
   en la propuesta del expediente y se quedaría a la vista en «Fuentes y
   fechas». Va contra la orden del responsable del proyecto de §1 («que no quede nada viejo»).
   Hoy `https://hausera.io/` responde 200 (20:25:32).
   **Corrección:** quitarla (la portada ya está como fuente de «Historial que
   publica Hausera (consultado el 21/11/2026)»).

5. **Boss Info · dos referencias del 22/10.** «Número de accionistas publicado
   · 22/10/2026: 155» y «Acciones tokenizadas · 22/10/2026: 10.650.100 BOSS» no
   están en `referenciasQuitar` ni en `referenciasRefechar` del expediente, que
   añade las del 21/11. En Aktionariat sí se quitan las equivalentes. Si se
   quedan, la ficha enseñaría el 22/10 junto al 21/11. Hoy la portada dice
   «Shareholders 155 · Tokenized Shares 10'650'100 BOSS» (20:16:20).
   **Corrección:** quitar las dos del 22/10 y dejar solo «… · 21/11/2026».

6. **Boss Info · «no una oferta abierta».** En reventa, la ficha dice «✗ No ·
   Se contrata hoy desde España · Es una referencia de reventa entre
   inversores, no una oferta abierta» y «Referencia de reventa ·
   disponibilidad sin confirmar». Hoy el emisor vende directamente: «DIRECT
   FROM ISSUER Buy BOSS at 8.502 CHF · bank transfer or crypto» (20:16:25);
   en cadena vende (ajustes 1) y le quedan 11.171 BOSS; las condiciones §9.1
   admiten el EEE. La propia ficha dice «Sí para comprar al emisor». Se
   contradice.
   **Corrección:** pasarla a «principales» como Aktionariat (misma
   plataforma, misma venta directa del emisor), con revisión «actual» y
   España «sí» según §9.1; si el responsable del proyecto quiere dejarla en
   reventa, que lo decida sabiendo que la ficha dirá «no una oferta abierta».

7. **Switzerlend · lo mismo.** «Buy LENDS at 68.0105 CHF · bank transfer or
   crypto» (20:16:26); vende en cadena (ajustes 5) y §9.1 admite el EEE.
   **Corrección:** la misma que en Boss Info.

8. **Switzerlend · «Clase», «Qué se adquiere» y su alcance.** La corrección
   del revisor dice «en una venta o liquidación cobra 53,72 CHF por acción
   antes que las ordinarias…». El Token SHA §2 b (89647998…, 20:17:20) dice
   «an amount equal to CHF 53.72 … If the proceeds do not suffice … pro rata».
   Sin esa condición se lee como un cobro asegurado.
   **Corrección:** «Preferente C1: en una venta o liquidación, si el dinero
   alcanza, cobra 53,72 CHF por acción detrás de las preferentes de rango
   superior y antes que las ordinarias (no es un tope)».

## Recomendadas

- **Aktionariat · «Lo esencial · Salida».** La referencia nueva «Salida ·
  21/11/2026» lleva la fecha del dato del 21/11, y «Salida» la del 01/11. La
  ficha ordena por esa fecha: «Lo esencial» pasaría a decir «Salida: Mejor
  compra entre accionistas 5,01 ZCHF (5 acciones); 78 acciones pedidas en
  total» y dejaría de decir «Venta solo a otros accionistas; el emisor no
  recompra». Lo probé con `resumenOferta` del repositorio. Arreglo: dar a
  «Salida» la fecha del dato del 21/11 (disabledSellText y ajustes leídos hoy)
  o llamar a la otra «Libro entre accionistas · 21/11/2026».
- **Aktionariat · mínimo.** En cripto no hay mínimo (`cryptoPaymentsLimit min
  0`): 1 acción, 7,25 ZCHF. Como en Boss Info: «500 CHF por transferencia; en
  cripto, desde 1 acción (7,25 ZCHF)».
- **Switzerlend · existencias.** Al contrato de venta del emisor le quedan 57
  LENDS (bloque 26.465.805): pagando en cripto se pueden comprar como mucho
  unos 3.877 CHF. Añadir la referencia «Acciones que le quedan al emisor en
  su contrato de venta · 21/11/2026: 57».
- **Hausera · la suscripción puede cerrarse antes.** El acuerdo de reserva
  dice que el periodo termina el 30/06/2027 «sin perjuicio de que el Emisor
  pueda darlo por finalizado con anterioridad en caso de alcanzarse el importe
  máximo». En el mínimo largo: «… suscripción del 25/11/2026 al 30/06/2027
  (puede cerrarse antes si se cubre)».
- **Hausera, Boss Info y Switzerlend · descripción de la página.** Las
  páginas `rwadar-site/ofertas/*.html` de las tres llevan en `description`,
  `og:description` y JSON-LD «Condiciones pendientes de nueva revisión.
  Consulta la fuente oficial antes de tomar decisiones.» (el texto que da la
  vista pública fuera de «principales»). Es lo que sale al compartir el
  enlace. Usar el resumen de la ficha o un texto neutro.
- **Boss Info y Switzerlend · «Proveedor».** Dicen «Aktionariat (portal de
  inversores shares.bossinfo.com)» / «… shares.lend.ch». El portal dice «This
  page is hosted by Boss Info using technology licensed from Aktionariat»
  (y lo mismo con Switzerlend). Mejor: «Boss Info AG (portal
  shares.bossinfo.com, con tecnología de Aktionariat)».

## Lo que está bien (comprobado hoy)

- **Aktionariat:** precio del emisor 7,25 fijo; recompra cerrada; mínimo 500
  CHF por transferencia; Suiza + EEE con tope de 100.000 €; comisión 0 % / 1,9
  %; aviso nuevo de precios (6,20 ZCHF la venta más barata; 62 acciones a
  5,00 ZCHF hoy); última compra al emisor 31/10 (1 a 7,25); 368 accionistas;
  800.000 de 1.800.000 tokenizadas; sin folleto (umbrales); sin supervisión
  prudencial; riesgo de pérdida total.
- **Boss Info:** 8,50 CHF el emisor; nadie le compra desde el 29/06/2026;
  última operación 05/11 (1 a 8,40); mínimo 100 CHF o 2 acciones (unos 17
  ZCHF); venta más barata 8,40; «ventana de mantenimiento»; XCHF en la FAQ y
  ZCHF en el portal; la FAQ no excluye España.
- **Switzerlend:** 1 acción a 68,01 CHF; recompra apagada con 0,03 ZCHF; la
  web dice que recompra si hay liquidez y el Token SHA §1.4 que no está
  obligado; venta más barata 67,00; última compra al emisor 07/10 y la del
  25/09 también fue al emisor; PolyReg solo antiblanqueo.
- **Hausera:** estado, calendario, mínimo de 100 €, salida al vender, sin
  comisiones para el suscriptor, emisor SPV 11, Ursus-3 n.º 251, no inscrita,
  no PSFP, sin advertencias; mínimo corto de 40 caracteres; acceso que
  responde a la pregunta (en «Lo esencial» seguirá saliendo «Sin comprobar si
  se puede contratar desde España», y en la tarjeta «España: Sin confirmar»:
  es correcto, porque hoy solo se puede reservar).
- Ninguna ficha de reventa ni la próxima lleva rentabilidad ni precio
  principal; ningún mínimo dice «por participación».

## Sin poder comprobar

- Si un residente en España pasa el alta y el KYC de los portales suizos y de
  Hausera (pide cuenta: límite firme).
- Cuánto queda del tope de 100.000 € del EEE y cuánto se ha reservado en
  Alicante 3 (no se publica).
- La comisión «Fee (1.9%)» de la pestaña «Sell» y la lista «All Trades»
  (necesitan JavaScript y pulsar): la comprobé en la API de ajustes, que dice
  1,9 %, y en el historial de operaciones.
- La fecha «10/11/2026» en que Alicante 2 ya figuraba como financiada: hoy
  solo se ve `FUNDED` con lanzamiento el 11/11.
- Qué clases preferentes van por delante de C1 en Switzerlend (los estatutos
  no son públicos).
- «Lo esencial» de la web lo simulé con `resumenOferta` del repositorio, no en
  un navegador.

# Grupo suiza · resumen · 10/11/2026

He hecho la consulta el 10/11/2026 entre las 09:01 y las 09:31 UTC. He mirado
solo páginas, documentos y API públicas, y he hecho lecturas en cadena de solo
lectura (`eth_call`). No he iniciado sesión, no he hecho KYC, no he rellenado
formularios ni he conectado monederos. En el mercado entre accionistas pulsé la
pestaña «Sell» solo para leer la comisión, sin enviar ninguna orden.

- Copias de lo leído: `fuentes/` (texto, capturas y PDF de menos de 3 MB).
- Respuestas de API y de cadena: `fuentes/crudo/` (fuera de Git).
- Hora, tamaño y sha256 de cada consulta: `inventario-consultas.json`.
- He recortado los nombres de personas en las copias de texto de los acuerdos
  y de las cuentas.

## Lo más importante de hoy

1. **Boss Info tiene una operación nueva.** El 05/11/2026 a las 13:35 UTC, horas
   después de la revisión de ese día, se vendió 1 acción a 8,40 ZCHF entre
   accionistas. Lo dicen la API del portal, su portada («Last trade • 5 Nov
   2026, 13:35») y la transacción en cadena. La ficha publicada dice que «la
   última operación fue … a 6,70 el 28/09/2026»: **eso ya no es cierto** y hay
   que cambiarlo.
2. **Aktionariat y Switzerlend no cambian nada de fondo.** Mismo precio del
   emisor, mismo libro de órdenes (salvo una orden de 1 acción a 3,00 que ha
   desaparecido en Aktionariat), ninguna operación nueva, mismos documentos
   (sha256 idéntico). Solo hay que pasar las fechas de las fichas al 10/11.
3. **La comisión del 1,9 % al vender ahora también se lee en el contrato.** Los
   tres contratos del mercado entre accionistas responden `tradingFeeBips() =
   190`. El de Switzerlend tiene el código verificado, y dice «default trading
   fee is 1.9%», que la paga siempre quien vende y que nunca pasará del 5 %.
4. **Una candidata nueva que se puede comprar desde España: Alan Frei Company.**
   Se descartó el 01/11 porque faltaba una fuente de acceso y no se habían
   leído los acuerdos. Hoy las dos cosas están resueltas (abajo).

## Ofertas publicadas

| ficha | decisión | qué cambia hoy |
|---|---|---|
| aktionariat | **actualizar** (solo fechas) | Precio del emisor **7,25 CHF** (10/11), mínimo 500 CHF por transferencia, acceso Suiza + EEE con tope de 100.000 €, sin recompra: todo igual. Mejor compra entre accionistas 6,10 por 10 acciones y venta más barata 6,20 (356 acciones), igual que el 05/11. Última compra al emisor, el 31/10. En 12 meses, 24 compras al emisor (el 05/11 eran 25 solo porque la ventana de 12 meses se ha movido). Sigue en principales. |
| boss-info | **actualizar** | **Operación nueva del 05/11 (1 acción a 8,40)**: cambian el resumen y la descripción. En la venta a 8,40 quedan 103 acciones (eran 104). El resto igual: precio del emisor 8,50, mínimo 100 CHF (en cripto, 2 acciones), comprador a 7,30 por 1.000 acciones, sin recompra («ventana de mantenimiento»). Nadie compra al emisor desde el 29/06/2026. Propongo poner cifra y fecha al aviso «el precio del emisor está por encima de la mejor venta» y que siga en secundario. |
| switzerlend | **actualizar** (solo fechas) | Todo igual: precio 68,01, última compra al emisor el 07/10, compra 59,00 × 4, venta más barata 67,00 × 15. La recompra sigue apagada en el contrato y con 0,03 ZCHF, mientras su web dice que se puede revender al emisor. Sigue en secundario. |

### Avisos con fecha (todos comprobados hoy)

- **Aktionariat.** «Vendedores por debajo del precio del emisor (6,20 frente a
  7,25)»: vigente, pasa al 10/11/2026. Los demás avisos, vigentes sin cambios.
- **Boss Info.** «El precio del emisor está por encima de la mejor oferta de
  venta»: vigente (8,50 frente a 8,40). Propongo el mismo texto que en
  Switzerlend: «Entre accionistas hay vendedores por debajo del precio del
  emisor (venta más barata 8,40 ZCHF el 10/11/2026)». Vuelvo a proponer el aviso
  «Nadie ha comprado al emisor desde el 29/06/2026», que el 05/11 no se publicó.
- **Switzerlend.** El aviso de la recompra («desactivada y casi sin fondos») y el
  de vendedores a 67,00 siguen vigentes: pasan al 10/11/2026.
- Métrica «Supervisor» de las tres: sigue sin figurar en el registro de FINMA,
  ahora con fecha 10/11/2026.

## Candidatas

Hoy el acento estaba en buscar ofertas nuevas. He abierto el directorio de
Aktionariat («Companies with Tokenized Shares», 25 empresas). Para cada una he
leído en cadena si el emisor vende y si recompra, y después he mirado más a
fondo las que tenían ventas recientes.

### Alan Frei Company → propongo admitir (en secundario)

- **Qué es.** Acciones tokenizadas de Alan Frei Company AG (Zúrich, fundada en
  2022). Es una empresa de contenidos, comunidad y productos para emprendedores.
- **Acceso desde España.** Su propia web (alanfrei.com/investor) dice: «Public
  offering is only open to persons domiciled in Switzerland and in the EEA … in
  the EEA to €100,000 per year». Las condiciones del portal (§9.1) dicen lo
  mismo. Era justo lo que faltaba el 01/11.
- **Acuerdos.** He leído el Registration Agreement y el Token Shareholder
  Agreement V2.0. He comprobado en cadena que el token que compras (AFS)
  envuelve el token que cita el acuerdo (AF): las 750.000 acciones tokenizadas
  están dentro. No pasa lo de ART Leasing (contratos cambiados sin explicar).
- **Mínimo.** Desde 1 acción (**1,60 CHF**). El portal no pone mínimo y la web
  dice «No minimum investment».
- **Actividad.** Última compra al emisor, el 20/10/2026. En 12 meses, 94
  operaciones con el contrato del emisor y 18 entre accionistas. Tiene 683
  accionistas.
- **Salida.** Es la única de las cuatro en la que **el emisor también recompra
  hoy** (el contrato tiene la recompra encendida). Pero solo tiene **479,80
  ZCHF** para hacerlo y el acuerdo no le obliga. Si no, se vende a otros
  accionistas: hay un comprador a 1,50 por 50 acciones, y quien vende paga un
  1,9 %.
- **Lo que resta confianza** (va en los avisos):
  - Las cuentas 2025, que publica el propio emisor, dan ingresos de
    **99.230 CHF**, una **pérdida de 245.285 CHF** y un patrimonio neto de
    325.644 CHF.
  - No están auditadas (no hay órgano de revisión inscrito).
  - El emisor no está supervisado (FINMA, 0 resultados) y no hay folleto.
  - Su objeto social inscrito mezcla actividades reales con otras en tono de
    broma.
- **Advertencias.** Ninguna. CNMV: «Alan Frei» y «Alan Frei Company AG», sin
  datos. FINMA: sin advertencias.

La propongo en **secundario**, como Boss Info y Switzerlend, para que el precio
del emisor no salga como cifra principal de una empresa que aún pierde dinero.
Si el coordinador quiere solo ofertas «excelentes», el motivo para dejarla
fuera serían las cuentas, no la falta de datos.

### Otras dos que no propongo

- **Robin des Fermes SA → no admitir.** Su web admite Suiza + EEE (tope de
  100.000 €), el mínimo es de 225 CHF y la última compra al emisor fue el
  02/11/2026. Pero **no hay salida**:
  - el emisor no recompra;
  - el libro de órdenes está vacío;
  - nunca ha habido una operación entre accionistas (176 operaciones, todas
    con el emisor).
- **Revario SA → no admitir.** Es la que más vende del directorio: 173 compras
  al emisor en 12 meses, la última el 26/10/2026. Pero:
  - su página no dice qué países pueden comprar (lo he buscado en el HTML y en
    la página renderizada);
  - tampoco hay salida: sin recompra, libro vacío y ninguna operación entre
    accionistas en 435 operaciones.

### Cribado sin expediente (una línea cada una, consulta de hoy)

- **EHC Kloten.** Última operación el 05/09/2025. Su página dice que «no es una
  inversión financiera clásica, sino sobre todo una aportación solidaria», y
  los acuerdos tienen texto de relleno («Lorem ipsum»).
- **AyurVeda.** Una sola compra en 12 meses (11/11/2025).
- **PensionDynamics.** El contrato del emisor no tiene acciones; última compra
  en 2024.
- **Green Monkey Club.** Última operación el 11/02/2025.
- **Green Consensus.** Última operación el 10/09/2024.
- **parknsleep.** Venta del emisor apagada.
- **Con contrato antiguo o sin venta legible en cadena:** photoINTERNATIONAL,
  Clever Forever, Operal, Reederei Vully, Twiliner y Fieldoo.
- **Sin ajustes públicos** (la API da error 400): Brauerei Oerlikon y Funere.
- **Ya estudiadas y siguen igual:** RealUnit (excluye España), Carnault (portal
  privado), ART Leasing, wemakeit y ServiceHunter.

## Registros y advertencias (10/11, 09:07–09:28 UTC)

- **FINMA, entidades autorizadas.** «Aktionariat», «Boss Info», «Switzerlend»,
  «Alan Frei», «Robin des Fermes» y «Revario» dan 0 resultados. El buscador
  funciona: «Maerki Baumann» y «Sygnum» dan 1 cada una.
- **FINMA, lista de advertencias.** Tiene 2.402 entradas (una más que el 05/11).
  Ninguna coincide.
- **CNMV, entidades advertidas.** Todas las búsquedas dan «No hay datos
  disponibles». El control «Capital» da 40 páginas.
- **PolyReg.** Solo Switzerlend AG está afiliada.
- **Zefix.** Las fichas de las tres publicadas son idénticas a las del 05/11.

## Bloqueos y límites

- No he probado el registro, el KYC ni una venta al emisor (lo prohíbe el
  encargo).
- Nadie publica cuánto queda del tope de 100.000 € para el EEE.
- Los contratos del mercado de DAKS y de BOSS siguen sin código verificado. La
  comisión la leo con la función del contrato verificado de LENDS, y dan la
  misma respuesta (190).
- El nodo público de Ethereum no devuelve recibos ni registros antiguos. De la
  operación de Boss Info del 05/11 he comprobado la transacción (destino,
  bloque y hora), no el importe en el evento. El importe sale de la API y del
  portal.
- Los ajustes de compra de los portales cambian de sha256 (2 bytes menos), pero
  los campos citados dicen lo mismo. El crudo del 05/11 no está en disco para
  ver qué campo cambió (seguramente los tipos de cambio).
- La API de operaciones no distingue las compras al emisor de las recompras.
- No he tocado nada fuera de `grupos/suiza/` y de mis expedientes
  (aktionariat, boss-info, switzerlend, alan-frei-company, robin-des-fermes y
  revario).

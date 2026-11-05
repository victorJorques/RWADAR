# Grupo suiza · resumen · 05/11/2026

Consulta hecha el 05/11/2026 entre las 08:01 y las 08:19 UTC. He mirado solo
páginas, documentos y API públicas, y he hecho lecturas en cadena de solo
lectura (`eth_call`). No he iniciado sesión, no he hecho KYC, no he rellenado
formularios ni he conectado monederos. En el mercado entre accionistas pulsé la
pestaña «Sell» solo para ver la comisión, sin enviar ninguna orden.

- Copias de lo leído: `fuentes/` (los .txt van a Git; los PDF, HTML y capturas
  se quedan en disco).
- Respuestas de API y de cadena: `fuentes/crudo/` (fuera de Git).
- Hora, tamaño y sha256 de cada consulta: `inventario-consultas.json`.

El intento anterior de este encargo no dejó archivos en `grupos/suiza/`, así que
todo se ha hecho de nuevo hoy.

## Lo más importante de hoy

1. **Vender entre accionistas cuesta un 1,9 %.** Afecta a las tres ofertas. La
   ficha publicada de Aktionariat dice «comisión 0 %», y la de Boss Info dice
   «comisión mostrada 0 %». Ese 0 % es solo para quien compra. Hoy lo he
   comprobado de tres formas:
   - el resumen de la orden de venta en el portal muestra «Fee (1.9%)»;
   - la API del portal da `sellerFeeRate 0.0190` y `buyerFeeRate 0`;
   - las condiciones del portal (§4.1) dicen «Applicable fees are borne by the
     seller».

   No es que hayan subido la comisión: el 01/11 y el 03/11 solo se miró el lado
   comprador.
2. **Boss Info y Switzerlend sí dicen qué países pueden comprar.** Hasta hoy
   decíamos que no lo publicaban. Cada portal enlaza en su pie unas condiciones
   («Terms of Service»): `shares.bossinfo.com/investor-page-terms` y
   `shares.lend.ch/investor-page-terms`. Son la versión 1.0, del 30/10/2026.
   - En su punto 9.1, la venta directa de la sociedad del portal es solo para
     residentes en Suiza o el EEE, con un tope total de 100.000 € para el EEE.
     España queda dentro.
   - El texto es la plantilla común de Aktionariat: el mismo archivo, con el
     mismo sha256, en los tres portales. Ni Boss Info ni LEND lo repiten en su
     propia web.
   - No se publica cuánto queda del tope.
3. **Ninguna operación nueva desde el 03/11** en ninguna de las tres. Los
   historiales completos son idénticos (mismo sha256): 1.231, 318 y 94
   operaciones. Tampoco cambian:
   - el precio del emisor en cadena (7,25 · 8,50197 · 68,0105);
   - los ajustes de venta y recompra (0x1 · 0x1 · 0x5);
   - los PDF, el registro mercantil, PolyReg y FINMA.

## Ofertas publicadas

| slug | decisión | qué cambia hoy |
|---|---|---|
| aktionariat | **actualizar** | Precio del emisor **7,25 CHF** (dato del 05/11), mínimo de 500 CHF y acceso Suiza + EEE con tope de 100.000 €: todo sin cambios. **Corrección:** quien vende entre accionistas paga un 1,9 % (antes ponía 0 %). La mejor compra entre accionistas sube de 6,00 por 5 acciones a **6,10 por 10 acciones** (el diferencial baja de 3,23 % a 1,61 %). Sigue habiendo vendedores a 6,20, por debajo del emisor. La última compra al emisor sigue siendo la del 31/10. Sigue en principales. |
| boss-info | **actualizar** | **Acceso:** las condiciones del portal dicen Suiza + EEE con tope de 100.000 €, así que el aviso «no confirmado» ya no vale. **Comisión** de venta del 1,9 %. **Aviso nuevo:** su página de preguntas explica el XCHF de Bitcoin Suisse («1:1 con CHF»), pero el portal liquida en ZCHF (Frankencoin), que es otra moneda. Libro, precio (8,50) y mínimo (100 CHF), sin cambios. Nadie compra al emisor desde el 29/06/2026. Propongo que siga en secundario. |
| switzerlend | **actualizar** | **Acceso:** igual que Boss Info, las condiciones del portal dicen Suiza + EEE con tope de 100.000 €. **Comisión** de venta del 1,9 %. **Recompra (contrato frente a la web):** la web sigue diciendo «puedes revender al Brokerbot si tiene liquidez». Pero el contrato en cadena tiene la recompra apagada (0x5) y solo 0,03 ZCHF. Y el acuerdo firmado (Token SHA §1.4) dice que el emisor **no está obligado** a recomprar y puede limitarse a vender. **Nuevo vendedor** a 67,00 ZCHF (15 acciones), por debajo del precio del emisor (68,01). He leído hoy, como imagen, el Registration Agreement escaneado. No habla de países ni de recompra: acciones C1 sin restricciones de transmisión. Sigue en secundario; dejo nota por si Víctor la quiere en principales. |

### Avisos con fecha

- **Aktionariat.** El aviso «vendedores a 6,20 frente a 7,25 el 03/11» sigue
  vigente: pasa al 05/11. El del tope de 100.000 € y el de «el emisor no
  recompra» también siguen vigentes. Aviso nuevo: la comisión de venta del 1,9 %.
- **Boss Info.**
  - Cambia el aviso de acceso. Texto nuevo: «Según las condiciones de su
    portal, la venta del emisor es solo para residentes en Suiza o el EEE, con
    un tope total de 100.000 € para el EEE; no se publica cuánto queda».
  - Siguen vigentes «ventana de mantenimiento» y «precio del emisor por encima
    de la mejor venta» (8,50 frente a 8,40).
- **Switzerlend.**
  - Ya no vale «el portal no publica países admitidos».
  - Cambia el aviso de la recompra: ahora va con la fecha 05/11 y añade que el
    acuerdo firmado no obliga al emisor a recomprar.
  - Avisos nuevos: la comisión del 1,9 % y el vendedor a 67,00.

### Cómo se ven hoy en línea

Boss Info y Switzerlend aparecen en la web como «Condiciones pendientes de
nueva revisión», sin métricas. Es así porque las fichas de secundario van con
`estadoRevision = no_verificable`. Con estos expedientes ya hay datos de hoy
para enseñar.

Un detalle técnico: la base de datos exige `disponibleEs = null` en
«secundario». Por eso el acceso desde España solo puede ir en el aviso y en
`resumenTarjeta`.

## Registros y advertencias (05/11, 08:08–08:10 UTC)

- **FINMA, entidades autorizadas.** Busqué «Aktionariat», «Boss Info» y
  «Switzerlend»: 0 resultados las tres. El buscador funciona: «Maerki Baumann»
  y «Sygnum» dan 1 resultado cada una.
- **FINMA, lista de advertencias.** Tiene 2.401 entradas y ninguna coincide.
- **CNMV, entidades advertidas.** Busqué por el nombre exacto, con y sin «AG».
  Las seis búsquedas dan «No hay datos disponibles». El buscador funciona: el
  control «Capital» devuelve 40 páginas.
- **PolyReg** (blanqueo): solo Switzerlend AG está afiliada.
- **Zefix.** Las tres sociedades siguen inscritas (EXISTIEREND). Fichas
  idénticas a las del 03/11.

## Bloqueos y límites

- No he probado el registro ni el KYC de los portales (lo prohíbe el encargo).
- Nadie publica cuánto queda del tope de 100.000 € para el EEE.
- El acceso de Boss Info y Switzerlend sale de la plantilla común de
  Aktionariat, servida en sus portales. Ninguno de los dos emisores lo dice en
  su propia web.
- La comisión del 1,9 % sale del portal y de su API. El contrato del mercado
  secundario de DAKS no tiene código verificado en Sourcify, así que no he
  podido leerla en el contrato.
- Boss Info y Switzerlend no dicen en qué exención de folleto se apoyan para
  vender fuera de Suiza.
- No he podido comprobar hoy la cobertura de ZCHF. Solo registro que la página
  de preguntas de Boss Info habla de otra moneda.
- No he tocado `docs/tareas/PARA-CODEX.md` ni nada fuera de mi carpeta y mis
  tres expedientes.

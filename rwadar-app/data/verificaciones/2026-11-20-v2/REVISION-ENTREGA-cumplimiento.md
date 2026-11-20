# Revisión de la entrega 2026-11-20 · lente de cumplimiento normativo

Revisor independiente (no investigó ni montó). 20/11/2026, de 20:59 a 21:10 UTC.
SQL revisado: `aplicar-y-aprobar.sql` SHA-256 `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6`
(revisión `c8727d7d-cd09-d2cf-d3dc-da3158fe6812`; el mismo SHA en la copia del ensayo).
Lo que se ve tras aplicar lo he leído en la copia del ensayo
(`lectura-despues-de-aplicar/ofertas-v2.json`, 20:51 UTC) y en las 22 fichas fijas que generó.

**Veredicto: aprobado con cambios.** Nada de lo que entra promete rentabilidad, garantía ni
liquidez. Los avisos nuevos (A9, A13–A15 y el aviso de A21) son correctos. Los botones son los
mismos que en la publicada. Hay seis correcciones obligatorias: cuatro que pidió el coordinador
y no están en este SQL (A22–A25) y dos que he encontrado yo (una cita del KID que no es literal
en dos fichas y la custodia de Prosegur presentada como hecho).

## 1. Botón de salida de las 22 fichas (regla 5.3 de la revisión legal del 06/11)

La regla está en `rwadar-site/assets/rwadar-20260820.js` (`verOferta`): el botón dice «Ver oferta
en X» solo si «Se contrata hoy desde España» es Sí (oferta principal, `disponible_es`, acceso «si»
con fuente) **y** la entidad que la ofrece está supervisada (`transparencia.json`). Si no, dice
«Ir a la web del proveedor (sales de RWAdar)». Esto sale en las fichas fijas del ensayo:

| Ficha | Botón | Por qué |
|---|---|---|
| Spiko Letras Euro, Spiko Letras Dólar, Spiko Smart Cash Euro | Ver oferta en Spiko | Tabla de países de Spiko con España · Spiko Finance (ACPR, CNMV n.º 5325) |
| Kraken xStocks | Ver oferta en Kraken (Payward Europe Digital Solutions) | Vende Kraken UE · CySEC 342/17, CNMV n.º 4474 |
| Robinhood | Ver oferta en Robinhood Europe | Banco de Lituania, CNMV n.º 5299 |
| mTBILL, Prosegur Digital Gold, Aktionariat | Ir a la web del proveedor (sales de RWAdar) | Entidad no supervisada |
| Las 11 de Brickwise, Boss Info, Switzerlend | Ir a la web del proveedor (sales de RWAdar) | Reventa, no oferta abierta |
| Hausera | Ir a la web del proveedor (sales de RWAdar) | Anuncio: aún no se contrata |

Las mismas 22 que en la publicada (lo he comparado con `rwadar-site/ofertas/*.html`). La regla se
cumple al pie de la letra. Dos casos dudosos van en las recomendaciones (R2).

## 2. Advertencias de la CNMV (búsqueda mía de hoy)

- Buscador de entidades advertidas (no autorizadas),
  `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=<nombre>`, 21:03:25 UTC: «No hay
  datos disponibles» para Midas, Reental, Hausera, Spiko, Brickwise, Paxos, Kraken, Backed Assets,
  Robinhood, Prosegur, Aktionariat, Boss Info y Switzerlend.
- Lista de otras entidades, `https://www.cnmv.es/docportal/aldia/Advertencias_CNMV_Otras.pdf`
  (200, 5 páginas, 21:03:47 UTC): no aparece ninguno de esos nombres.
- Spiko SICAV en la CNMV,
  `https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es` (21:05 UTC):
  «SPIKO SICAV | 2380 | 30/01/2026 | SICAV | FRANCIA», con las pestañas «Datos generales» y
  «Entidades comercializadoras», sin lista de compartimentos. El texto nuevo de A5 («la CNMV no
  detalla sus fondos uno a uno») es cierto.

## 3. Correcciones obligatorias

### O1 · A22 · mTBILL: quitar la fuente que da 404 (cambia el SQL)
Hecho: `https://midas.app/assets/main-DOxid0Zj.js` responde **404** (21:06:56 UTC). En el SQL
aparece en `documentacion.fuentes` y como fuente de la referencia «Acceso desde España · consulta
01/11/2026».
Cambio exacto en `decisiones.json` (mtbill):
- `fuentes`: quitar `https://midas.app/assets/main-DOxid0Zj.js`.
- La referencia «Acceso desde España · consulta 01/11/2026» se sustituye por:
  - etiqueta: «Acceso desde España (condiciones finales)»
  - valor: «Condiciones Finales de mTBILL del 17/07/2026: España está entre los países de la oferta pública y no se prohíbe la venta a minoristas del EEE («Prohibition of Sales to EEA Retail Investors: not applicable»)»
  - fechaDato `2026-07-17`, fechaConsulta `2026-11-20`
  - fuente: `https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media`
  - alcance: «PDF de las Condiciones Finales en el CDN de GitBook (SHA-256 b1e58001…), leído el 20/11/2026. No confirma que la web de Midas te deje darte de alta desde España.»
- Comprobado: responde 200 a las 21:06:55 UTC, SHA-256 `b1e58001ec0f688a…`, «dated 17 July 2026»,
  «Offer(s) to the Public … Spain» y «Prohibition of Sales to EEA Retail Investors … not applicable».
- Si el motor no puede quitar la URL de `fuentes`, se cambia la referencia igual y se anota en noAplicado (como dice DECISIONES §8).

### O2 · A23 · Pax Gold (radar): fecha de la lista de la OCC (cambia el SQL)
`plataformas.licencia_registro_detalle` de Pax Gold:
- Antes: «… figura en la lista OCC de trust banks activos a 30/09/2026 (charter 25379). …»
- Después: «Paxos Trust Company, National Association figura en la lista OCC de trust banks activos a 31/10/2026 (charter 25379). La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.»

Fuente: el informe del auditor (`auditoria/radar-plataformas.md` n.º 5, 17:16:15 UTC: «Trust Banks Active As of 10/31/2026»). No lo he vuelto a abrir.

### O3 · A24 · Midas (radar): ya tenemos las condiciones finales (cambia el SQL)
Hoy el radar dice que no las tenemos, y la tarjeta de mTBILL (que sí las cita) dice lo contrario.
Hay que cambiar tres cosas de la plataforma `midas`:
- `licencia_registro_detalle`: quitar la última frase, «No se obtuvieron los términos finales
  vigentes de mTBILL.». El resto queda igual.
- `acceso_detalle` (el estado `no_verificable` se queda como está): «Las condiciones finales de mTBILL (17/07/2026) incluyen España entre los países de la oferta pública y no prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje darte de alta.»
- Alerta `terminos_finales_no_confirmados`: cambiar «Si pueden entrar minoristas del EEE lo deciden
  los términos finales vigentes de mTBILL, que no hemos podido obtener.» por «Las condiciones finales de mTBILL (17/07/2026) no prohíben la venta a minoristas del EEE; eso no confirma que la web te deje darte de alta.»
- En `fuentes`/`plataforma_fuentes`/`alerta_fuentes`, añadir el PDF de O1 como fuente de los campos
  acceso y licencia y de esa alerta.

Lo he comprobado yo: es el mismo PDF que en O1 (21:06:55 UTC).

### O4 · A25 · Reental (radar): la propia empresa dice que no la supervisa la CNMV (cambia el SQL)
`plataformas.licencia_registro_detalle` de Reental:
- Antes: «La fuente primaria localizada acredita una emisión española concreta con ERIR; no acredita una autorización general de Reental como empresa de servicios de inversión.»
- Después: «Reental dice que su actividad en España no está sujeta a autorización ni registro previo de la CNMV.»

Lo he comprobado yo: `https://www.reental.co/` (200, 21:07:12 UTC) dice «La actividad no está
sujeta a autorización ni registro previo de la CNMV debido a: Libertad de emisión (art. 34.1 de
la …». El texto se lo atribuye a Reental y no lo da por hecho: es correcto.

### O5 · Randhartingergasse y Hinterstoder: una «cita literal» que no está en el KID (cambia el SQL)
La web pinta estas referencias como «Cita literal de la fuente, en alemán». En las dos fichas, la
referencia «Qué se adquiere · consulta 01/11/2026» sigue diciendo «Genussscheine ... läuft
endlos/ewig ("Perpetual") …». Sus KID no contienen la palabra «Genussschein». Los descargué de
nuevo a las 21:06:44 UTC:
- `https://cdn.brickwise.at/8c331bfe-ab6a-436c-9d07-bb9c36aabad9.pdf` (Randhartingergasse), SHA-256 `2aa7ac3cea28b080…`
- `https://cdn.brickwise.at/3aa9bf9c-ae7d-4dde-ab03-f6169dc9327a.pdf` (Hinterstoder), SHA-256 `ce890eafd16419c4…`

Los dos traen esta frase tal cual.
Valor exacto de la referencia en las dos fichas: «Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»

Esto cierra el «A20 parcial» de noAplicado. En Pottendorfer, GreenPoint y Cohotel **no hay que
cambiar nada**: sus KID (`03bdd125…`, `f6c7c7ff…` y `da8e1df3…`, copias de hoy) sí dicen «erfolgt
ausschließlich eigenverantwortlich» y «Genussschein». En Pottendorfer, «Das Produkt läuft
grundsätzlich endlos/ewig ("Perpetual")» también está en el KID. Sus citas son correctas.

### O6 · Prosegur Digital Gold: la custodia la dice el contrato, no un hecho comprobado (cambia el SQL)
La métrica nueva de A12, «Custodia: Oro separado de los bienes de Prosegur, en un inventario
conjunto de los clientes (sin lingote asignado)», da como hecho lo que solo dice el contrato del
emisor. Es un producto que, según el mismo contrato, no está supervisado. La propia ficha lo
reconoce en su referencia «Qué se adquiere»: «Obligación contractual de Prosegur; no hay
verificación física independiente en las fuentes leídas». La separación de bienes es lo que
protege al cliente si la empresa quiebra. Por eso no puede leerse como algo comprobado.
Valor exacto: «Según su contrato, oro separado de los bienes de Prosegur, en un inventario conjunto de los clientes (sin lingote asignado)».

La fuente es el contrato, `app.prosegurdigitalgold.com/#/terms-service`, «Actualizado el
08/07/2026»: «Dicho oro permanecerá segregado de los activos propios de Prosegur Crypto»
(`auditoria/acciones-oro-tesoro.md`, 17:20:18 UTC).

## 4. Lo que he comprobado y está bien

- **Rentabilidades.** Spiko Letras Euro (2,45 %), Letras Dólar (4,00 % en USD) y Smart Cash
  (2,84 %) llevan la base (31 días, neta, VL con fecha), la fecha y «Variable y no garantizado» o
  «no es un tipo fijo ni está garantizado». En mTBILL la cifra no se publica porque la ficha está
  en `fuentes_en_conflicto`, y el aviso dice que es pasada, en dólares y que «no garantiza la
  futura».
- **Riesgos en los avisos.** Pérdida de todo el capital: Kraken, Robinhood (A9, nuevo), mTBILL,
  Aktionariat, Boss Info y Switzerlend (A13–A15, nuevos), Hausera y Spiko Smart Cash. Emisor no
  supervisado: mTBILL, Prosegur y las tres suizas. Sin folleto o sin KID: Aktionariat, Prosegur y
  Hausera, y en Kraken el folleto no cubre España. Liquidez: el límite de reembolso de Spiko
  (25 % y 10 %), la reventa de Brickwise, «solo recompra Prosegur» y sin mercado secundario en
  mTBILL. Fuentes en conflicto: mTBILL (reembolso y comisiones, A10), Spiko (la web frente al KID)
  y Kraken (afiliación).
- **Reventa de Brickwise.** A18 quita todas las referencias de rentabilidad y de reparto de las
  11 fichas. Ya no queda ninguna cifra de rentabilidad: solo la comisión del 1,5 %. El aviso
  fiscal de A21 es correcto. Que su tarjeta diga «Sin comprobar…» en vez de «Sin confirmar…» es
  más prudente, no menos.
- **Hausera.** Avisa de la reserva con dinero entregado antes de que la emisión esté inscrita,
  de que la CNMV no ha revisado el documento y de que puedes perderlo todo. Sigue «en camino», sin
  botón de compra.
- **Acceso desde España.** Kraken lo dice tal cual, con fuente primaria (condiciones finales de
  ANTx, solo Liechtenstein y Suiza). En Spiko Smart Cash el aviso dice que ningún registro lo
  confirma. Robinhood cita el registro de la CNMV (n.º 5299).
- **Datos personales.** No he encontrado nombres de personas físicas en el SQL (búsqueda de
  cargos y firmas). Las copias en bruto (`crudo/`) están en `.gitignore`.

## 5. Recomendaciones (no bloquean)

- **R1 · Spiko Smart Cash.** Llevar también al aviso lo de la AMF (hoy solo está en la métrica
  «Supervisor»). Añadir al final del aviso de acceso: «Además, el 20/11/2026 el fondo ya no
  aparecía en la base pública de la AMF (GECO), aunque figura en el certificado de la AMF del
  23/02/2026.»
- **R2 · Botón de Smart Cash y de Kraken.** Hoy dicen «Ver oferta en X» aunque su «documento que
  cubre España» está en No: no consta el alta de ese fondo en España, y las condiciones finales de
  xStocks no incluyen España. Cumplen la regla 5.3 al pie de la letra. Para el próximo ciclo,
  valorar exigir también `documentoEspana` para «Ver oferta» (es un cambio de la web, no del SQL).
- **R3 · A3 (en noAplicado).** La tabla de Spiko dice «Last updated: November 13, 2026», pero la
  referencia de Smart Cash enseña «(06/11/2026)». Si el motor no admite un cambio de solo fecha,
  se puede cambiar el valor con la fecha nueva, por ejemplo: «Disponible para particulares
  residentes en España según la tabla de Spiko del 13/11/2026, tras el alta y la verificación de
  identidad (KYC)».
- **R4 · Reental (migración 38).** Añadir el aviso que propone el auditor: «no hay supervisor que
  la vigile».
- **R5 · Fichas fijas.** En las 22, la tarjeta «Acceso desde España» dice «Sin comprobar si se
  puede contratar desde España», y la lista de comprobaciones de debajo dice «la fuente dice que
  se contrata desde España» en las principales. Ya pasa en la publicada y peca de prudente, no de
  lo contrario. Revisar el generador de fichas.
- **R6 · Midas.** El código de la alerta `terminos_finales_no_confirmados` se queda viejo con O3.
  Cambiarle el nombre en la migración 38.

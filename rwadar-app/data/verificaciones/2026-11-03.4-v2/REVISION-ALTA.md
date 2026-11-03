# Revisión independiente · alta de Kraken xStocks · entrega 2026-11-03.4 · 03/11/2026

Revisor: Claude. No preparé esta entrega. Revisé lo que hay en el commit
`62cbfba` (rama `claude/alta-kraken-xstocks`).

Qué reviso y qué no: Víctor decidió publicar la ficha diciendo con claridad que
las condiciones finales del emisor solo ofrecen el producto en Liechtenstein y
Suiza. **No reabro esa decisión.** Compruebo que la ficha la cumple con
honestidad y exactitud, sin promesas, y que la entrega es segura.

Método: abrí yo mismo las fuentes públicas entre las 12:02 y las 12:11 UTC, con
`curl` sin sesión y sin cambiar de país (anexo con hora, código HTTP, bytes y
SHA-256). No inicié sesión, no hice KYC, no rellené formularios ni conecté
wallets. No toqué ningún bloqueo por país.

---

## Veredicto: **aprobado_con_cambios**

En pocas palabras: la entrega es segura y las otras 23 fichas no cambian. Casi
todo lo que dice la ficha está en las fuentes y no cita `l-p-a.com` ni datos
del KID. Pero hay **seis cambios obligatorios de texto**, y después hay que regenerar la entrega (apartado 5, cambios 1 a 7):

- El aviso principal da por hecha una base legal que nadie ha documentado
  («bajo su licencia europea»), y «ese folleto no ampara tu compra» no queda
  claro.
- La métrica «Condiciones finales… no citan España» es falsa tal cual: sí la
  citan, entre los países a los que se notificó el folleto. Lo que no hacen es
  ofrecer el producto en España.
- «Folleto: notificado a la CNMV», leído solo, sugiere que el folleto cubre la
  venta en España.
- «Acceso desde España» dice cosas que no están en la página de Kraken que cita.
- La comisión omite que, según la versión inglesa de la tabla de Kraken, las
  compras pequeñas pagan hasta 2 USD en lugar del 1 %. Con «Desde 1 €», ese
  dato importa.
- Dos datos no tienen fuente en la lista: «pagando con dinero fiduciario» y el
  «suplemento de agosto».

Con esos cambios hay que regenerar la entrega (sale otra revisión) y repetir el
ensayo. La guarda sigue exigiendo que la publicada sea `fab6d2e4`.

---

## 1. Entrega: SQL, guarda, recuentos y las otras 23 fichas

| Comprobación | Resultado |
|---|---|
| Ensayo `node rwadar-app/data/verificaciones/2026-11-03.4-v2/comprobar-entrega.mjs` (12:00:50–12:00:54 UTC) | Salida real: `"resultado": "correcto"`, `revisionId 5c8b3909-bfb2-5058-86ae-888899c9928b`, `sha256 1dcaa7e8d814dfc34b2d41bbd328cde19bc9dde9937db47661552f3b2dca8d76`. Fila de la tarjeta: `kraken-xstocks \| 1 € \| Disponible desde España \| Salida: Vendes a Kraken en USD, con diferencial, 24/5, o ret…`. |
| ¿El ensayo cambió la entrega? | Reescribe `pruebas-locales.json`. Su contenido es idéntico salvo `ejecutadoEl`; dejé el original (11:56:25 UTC), así que la carpeta queda como estaba. |
| SHA-256 de `aplicar-y-aprobar.sql` | `1dcaa7e8…8d76`, igual que en el ensayo. `catalogo.sql`: `0a590a6b…e888`. |
| Guarda | En una transacción `serializable`: `actual not in ('fab6d2e4-…'::uuid, '5c8b3909-…'::uuid)` → error. Comprueba también que el catálogo no esté retirado (`retirado is distinct from false` → error), que la fecha no sea futura y que la revisión destino no exista con otro hash ni esté retirada. El ensayo cambia la anterior por ceros, comprueba que falla («Publicación distinta») y hace `rollback`. |
| Inventario de sentencias (lo conté con un separador que respeta comillas y `$…$`) | 295 sentencias: `begin isolation level serializable`; 1 bloque `do $guarda$`; 291 `insert into rwadar_catalogo.*`: revisiones 1, fuentes 69, plataformas 26, plataforma_fuentes 109, alertas 26, alerta_fuentes 36 y ofertas 24. Todas llevan el revision_id `5c8b3909…` y `on conflict … do nothing`. Hay 1 bloque `do $aprobar$` y `commit`. No hay `delete`, `truncate`, `drop`, `alter`, `create`, `grant` ni `revoke`. Solo hay un `update`, el de la aprobación de `rwadar_catalogo.revisiones` (`where id = v and estado = 'borrador'`); los otros dos «update» son `for update` en la guarda. `public.plataformas` solo se lee. |
| Recuentos | El bloque de aprobación exige 26/24/7/14/3 y que la revisión sea `revision_publicable_v2`; si no, hace `raise`. Coinciden `manifiesto-catalogo.json`, `revision.json` y `contraste-2026-11-03.4.json`. |
| Mismo molde que la entrega aprobada | Comparé `aplicar-y-aprobar.sql` con el de la 2026-11-03.3, normalizando los identificadores. Solo cambian la cabecera, el hash de la guarda, los recuentos 24/7, el texto de `aprobada_referencia` y la fila nueva de Kraken. |
| Las otras 23 fichas | (a) En JSON: las 23 ofertas, las 26 plataformas y las 23 documentaciones son `deepStrictEqual` a las de 2026-11-03.3, en el mismo orden. `radar-canonico-26.json` es idéntico byte a byte. (b) En SQL, tras normalizar el id, `catalogo.sql` solo añade la fila de Kraken y cambia hash y recuentos en `revisiones`. (c) En PGlite, el ensayo compara fila a fila las vistas públicas antes y después (sin `revision_id`): iguales. |
| Idempotencia y caducidad | El ensayo aplica dos veces con el mismo resultado. La ficha vale hasta el 10/11 y el 11/11 oculta los datos. |

**Nota de despliegue (no bloquea):** si se aplica el SQL antes de sincronizar
la web y la app, la tarjeta de Kraken saldrá un rato con la imagen de su
categoría, porque `oferta-kraken-xstocks.webp` solo existe al ejecutar
`generar.mjs`. El lector acepta 24 ofertas (`permitirAmpliacion`), aunque el
manifiesto de la web siga en 23.

---

## 2. Ficha: hechos que comprobé hoy

Todas las fuentes que cita son oficiales:

- Kraken: eu.kraken.com, kraken.com y support.kraken.com.
- Supervisores: CySEC y CNMV.
- MFSA, como autoridad notificada.
- El emisor: el contenedor de archivos que carga `xstocks.fi`. Lo confirmé a
  las 12:11:13 UTC: `xstocks.fi` → `/us` lo cita 24 veces.

En la ficha, en el SQL y en `fuentesActuales` no aparece `l-p-a.com`, ni «KID»,
ni «datos fundamentales», ni «de 7».

| Dato de la ficha | Fuente (URL) | Hora UTC | Qué vi | ¿Respaldado? |
|---|---|---|---|---|
| Mínimo «Desde 1 €» | https://eu.kraken.com/xstocks | 12:02:27 (en) · 12:03:34 (es) | «Start with as little as €1 EUR» / «Puedes comenzar con tan solo 1 EUR». FAQ: «with as little as a €1 EUR investment». | Sí |
| Quién puede comprar | https://eu.kraken.com/xstocks | 12:02:27 · 12:03:34 | «xStocks are available to EU based clients of PEDSL-CY that have successfully completed the required appropriateness assessment or are professional investors». En español dice «evaluación de idoneidad». **No nombra España ni la CNMV.** | Solo lo que dice Kraken (cambio 4) |
| Exclusiones y EEE | https://support.kraken.com/articles/xstocks-availability | 12:02:29 · 12:03:37 | Actualizado el 18/06/2026. Excluye EE. UU., Australia, Canadá, Reino Unido y regiones prohibidas; Bélgica solo en una lista de la versión española. España no está excluida. «EEA clients can buy, sell, and convert xStocks using fiat only». | Sí, pero **no está en las fuentes de la ficha** (cambio 6) |
| Salida «Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a tu wallet; sin plazo fijo» | https://eu.kraken.com/xstocks · https://eu.kraken.com/legal/risk-disclosure | 12:02:27 · 12:02:28 | «exit your position at any time… tap Sell to convert the tokens back to USD at the current market-linked price. You can also withdraw your xStocks to a compatible wallet» · «xStocks trade 24/5» · «a spread will be included in the asset price» · «PEDSL provides buy and sell services in relation to xStocks acting as principal». | Sí |
| «Compra con euros: 1 % de compra instantánea más un diferencial que Kraken no publica» | https://www.kraken.com/features/fee-schedule | 12:02:29 (en) · 12:03:35–36 (es) | Apartado xStocks: «There are no trading fees when purchasing xStocks with USDG or USD… The standard 1% instant buy/sell trading fee applies when purchasing xStocks using other assets. To lock in a price, a spread may be included». La **versión inglesa** añade: «Small instant trades carry a fee of up to $2 instead of the 1% fee». **La española no lo dice.** Las dos avisan de que puede haber comisiones según el método de pago. | Incompleto (cambio 5) |
| «Qué compras: certificado de deuda de Backed Assets (JE), no la acción» · aviso «sin voto ni dividendos en efectivo» | https://eu.kraken.com/legal/risk-disclosure | 12:02:28 | «Updated : 27 January 2026» · «xStocks are debt securities in tokenised format» · «no voting rights, dividend or distribution entitlements». | Sí |
| Aviso «Producto complejo: puedes perder toda la inversión» | ídem | 12:02:28 | «xStocks are complex products which are difficult to understand» · «BY INVESTING IN xSTOCKS, YOU CAN LOSE YOUR ENTIRE INVESTMENT». Ya no se apoya en el KID. | Sí |
| Aviso «Riesgo de contraparte: si el emisor o Kraken fallan…» | ídem | 12:02:28 | Riesgos de PEDSL «as the dealer and initial custodian» y de Backed («creditworthiness… solvency»). | Sí |
| «El emisor no es rentable y depende de su grupo» · «avala un préstamo de su matriz» | https://www.mfsa.mt/wp-content/uploads/2026/10/Backed-Assets-JE-Limited-Second-Supplement-Document-dated-29-September-2026.pdf (SHA-256 `acb0376b…0a71`, 14 p.) · folleto (abajo) | 12:04:27 | Suplemento, p. 4: «2.3.2.8 Financial dependency on Payward Group companies»; «future viability… remains dependent… on… financial support from Payward»; «history of operating losses». Suplemento, p. 6: el emisor «agreed to guarantee the obligations of the Parent» en un préstamo de PEL. Folleto, p. 30: «The Issuer is currently not profitable and depends on capital and financing from its Parent». | Sí |
| Aviso «Emisor y vendedor son del mismo grupo… aunque la web de Kraken diga que no está afiliado» | Suplemento (p. 2) · folleto (p. 56) · https://eu.kraken.com/xstocks | 12:04:27 · 12:02:27 | «Payward Digital Solutions Ltd and Payward Europe Digital Solutions (CY) Limited, both group companies of the Issuer» · Payward Europe Limited compró el 100 % de Backed Finance AG el 05/01/2026. Pie de Kraken: «The issuer of the xStocks is not affiliated to the Kraken Group». | Sí |
| Aviso «solo es adecuado para quien pueda soportar cualquier pérdida y tenga conocimientos financieros» | https://www.mfsa.mt/wp-content/uploads/2026/05/Backed-Assets-JE-Limited-Base-Prospectus-Document-dated-08-May-2026.pdf (SHA-256 `47be9272…08b3`, 160 p.) | 12:04:27 | P. 4–5, aviso de Jersey: «only suitable for acquisition by a person who: (i) has a significantly substantial asset base such as would enable them to sustain any loss… and (ii) is sufficiently financially sophisticated». | Sí |
| «Folleto aprobado por la FMA de Liechtenstein y notificado a la CNMV (11/05/2026)» | https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500001AB7C6C7F577 · folleto, p. 1–2 | 12:04:05 · 12:04:27 | CNMV: «11/05/2026 · BACKED ASSETS (JE) LIMITED · LIECHTENSTEIN · BPWO-80 · 08/05/2026 · Suplementos: Sí». Folleto: aprobado por la FMA y notificado a 29 Estados, España incluida. | Es cierto, pero leído solo sugiere que cubre la venta en España (cambio 3) |
| «suplementos de agosto y septiembre de 2026» | https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500001AB7C6C7F577*%20AND%20-document_type:FTWS&wt=json&rows=50&sort=approval_filing_date%20desc | 12:07:59 | SUPP del 04/08/2026 y del 29/09/2026, BPWO del 08/05/2026, todos con «SPAIN» en `member_states`. | Es cierto, pero **ESMA no está en las fuentes de la ficha** (cambio 6) |
| Condiciones finales: «Liechtenstein y Suiza» | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms%20Nr%20159%20(LITEx)_20260326.pdf (SHA-256 `85b56d11…de5a`, el mismo de la addenda; 162 p.) | 12:04:28 | P. 33: «Country(ies) of offer(s): The Products will be offered in Liechtenstein and Switzerland (only to Swiss Professional Investors). The right to offer in other jurisdictions is explicitly reserved». Justo debajo: «Country(ies) where the Base Prospectus has been notified: … **Spain** …». P. 3: la oferta pública en un Estado del EEE solo vale «if the Final Terms… specifies» esa oferta. Ojo: están emitidas con el folleto de **2025** (p. 1) y no con el BPWO-80. | El fondo, sí. «No citan España» es inexacto y falta «en Suiza, solo a profesionales» (cambio 2) |
| Registro del vendedor · CNMV n.º 4474 | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=4474 (y `&vista=17`) | 12:04:02 · 12:04:03 | «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED · Empresas de Servicios de Inversión del Espacio Económico Europeo en Libre Prestación · 4474 · 05/01/2018», domicilio en Limasol. Programa: «3. Negociación por cuenta propia · 1) Valores negociables» y custodia. | Sí |
| Licencia del vendedor · CySEC 342/17 | https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/ | 12:03:59 | «Licence Number: 342/17» · «Licence Date: 13/11/2017» · registro 356603 · «Office 601, 237, 28th October Street, Limassol» · dominio `https://eu.kraken.com/` · «Cross Border Services to Member States: … Spain». | Sí. Respalda «Limasol · Chipre» |
| Dividendos «se suman al saldo, netos de una retención del 30 % en EE. UU.» | https://support.kraken.com/articles/xstocks-faq | 12:02:29 · 12:03:36 | «Última actualización: 30 de octubre de 2026» · «Sí, aunque no en efectivo… tu saldo de xStocks aumenta» · «Dividendo neto (tras la retención fiscal del 30% en EE. UU.)». | Sí |
| Resumen «más de 130 acciones y ETF de EE. UU.» · «sociedad de Jersey» | https://eu.kraken.com/xstocks | 12:03:34 | «Kraken ofrece acceso a más de 130 acciones y ETF de EE. UU.» · «emitidos por Backed Assets (JE) Limited (una sociedad limitada privada de Jersey)». | Sí |
| Característica «Emisor… no está regulado por una autoridad de la UE» | Folleto, p. 4 | 12:04:27 | El permiso del registro de Jersey «does not give the issuer a "regulated" status». | Sí, en el fondo, sin el KID |

**Lo que piden las reglas de esta revisión:**

- **El aviso sobre las condiciones finales** es el primero que enseña la tarjeta
  («Revisa · …»): lo comprobé en `rwadar-20260820.js`, que muestra el primer
  aviso `warn` que no es el general. Pero no es del todo exacto ni fácil de
  entender (cambio 1).
- **«Acceso desde España»** añade a lo que dice Kraken un dato de la CNMV y
  «(España incluida)» (cambio 4).
- **Que nada sugiera que el folleto ampara la compra:** lo sugiere la métrica
  «Folleto» leída sola (cambio 3). Lo demás es correcto.

---

## 3. Cambios obligatorios de la revisión anterior (`kraken-xstocks.md`, apartado 6)

| Cambio de entonces | ¿Aplicado? |
|---|---|
| Título «…que siguen el precio de acciones de EE. UU.» | Sí, literal |
| Resumen | Sí, literal |
| `resumenTarjeta.minimo` / `salida` | Sí. El mínimo va como referencia «Desde 1 €» y la tarjeta enseña «1 €». La salida es literal. |
| `resumenTarjeta.accesoEspana` (estaba condicionado a unas condiciones finales con España) | Sustituido por la decisión de Víctor. El texto actual necesita el cambio 4. |
| Métricas: Mínimo, Qué compras, Vendedor y supervisor, Folleto, Compra con euros, Salida | Sí. «Folleto» necesita el cambio 3. |
| Métrica «Condiciones finales» | Adaptada a la decisión. Necesita el cambio 2. |
| Métricas del KID (riesgo, costes del emisor, plazo recomendado) | No van, a propósito. Correcto. |
| Avisos 1 a 7 | Sí. El 3 dice «que no está afiliado» sin comillas y el 4 quita «según su KID» y se apoya en la divulgación de riesgos. Los dos son correctos. |
| Pasos y lugar | Sí: «Abres cuenta y test», «Compras con euros», «Vendes o retiras» y «Limasol · Chipre». |
| Concepto (era una recomendación, no obligatorio) | Cambiado por otro igual de válido |
| `fuentesActuales` sin `l-p-a.com` y con «canal oficial del emisor y registro de ESMA» | Sin `l-p-a.com`: sí. Canal del emisor: sí (contenedor de `xstocks.fi`). **Registro de ESMA: no** (cambio 6). |
| `prioridadEditorial` | No va en la ficha; solo estaba en el expediente. No aplica. |

---

## 4. Imagen

**Foto maestra:** `rwadar-editorial-source/ofertas/fotos/kraken-xstocks.webp`.

- Tamaño 1344×768; SHA-256 `7f7eef824361c09f46b51d0c630ff6047c9b970b5bae236645a5f02ec4da26cc`.
- La abrí entera y en cuatro recortes ampliados, más la torre más alta y el
  paseo.
- Muestra torres de cristal genéricas al anochecer, con palmeras, un paseo vacío
  y su reflejo en el agua. Ningún edificio es reconocible.
- No hay rótulos, logotipos, letras, banderas ni personas.
- Es realista, aunque con el acabado algo «HDR» típico de la IA. A tamaño de
  tarjeta no se notan los defectos del paseo.
- Recuerda más a un puerto del Golfo que a Limasol, pero es genérica y no
  pretende ser un sitio concreto. Aceptable.
- En `fotos.json` el *prompt* pide «no logos, no signage, no text, no flags»
  (RealVisXL, semilla 29). En `fichas.json` están el lugar y los pasos de arriba.

**Tarjeta final:**

- Ejecuté `node rwadar-editorial-source/ofertas/generar.mjs`, que respondió:
  «24 fichas (24 con foto), catálogo 2026-11-03.4-v2 · 24 ilustraciones».
- Resultado: `oferta-kraken-xstocks.webp`, 960×660, 54.200 bytes, SHA-256
  `1508f11e5c2bcc1b256cf7104f38b2dbeccda813d96940bd139a90fbca56861b`.
- Se leen bien «Limasol · Chipre» y los tres pasos numerados, en blanco sobre la
  zona oscura de la izquierda. Nada los tapa.
- Probé los dos recortes que hacen las tarjetas:
  - Web, 16:10 con `object-fit: cover`: quita 30 px arriba y abajo.
  - App, 2:1: quita 90 px arriba y abajo.
- En los dos el texto queda dentro, entre y≈245 y 470.
- Las pastillas quedan fuera del texto: tipo arriba a la izquierda, «guardar»
  arriba a la derecha y la etiqueta editorial abajo a la izquierda.

**Después** deshice lo generado: `git checkout -- rwadar-movil rwadar-site` y
borré `oferta-kraken-xstocks.webp`. `git status` queda limpio, salvo este
informe.

Detalle menor: en el manifiesto generado, `revisadoEl` sale «2026-11-02», que
es el valor común de `fichas.json`, no la fecha de esta foto. No bloquea.

---

## 5. Cambios obligatorios (texto exacto)

Todos van en `preparar-entrega.mjs`. Después hay que volver a ejecutar
`preparar-entrega.mjs` (sale un `revisionId` nuevo) y
`comprobar-entrega.mjs`. La guarda sigue en `fab6d2e4`. La comprobación de
`avisos[1]` del ensayo sigue valiendo con el texto nuevo.

**Cambio 1. Aviso principal (`avisos[1]`).**
Sustituir el texto actual por:

> Kraken UE lo vende a particulares en España, pero las condiciones finales del emisor solo ofrecen el producto en Liechtenstein y Suiza: el folleto no cubre su venta en España.

Y añadir justo detrás, como `avisos[2]`:

> RWAdar no ha encontrado ningún documento oficial que explique en qué se basa la venta en España.

En `documentacion.descripcion`, sustituir la última frase («Las condiciones
finales del emisor solo ofrecen el producto al público en Liechtenstein y
Suiza; la venta a particulares en la UE la hace Kraken bajo su licencia
MiFID.») por:

> Las condiciones finales del emisor solo ofrecen el producto en Liechtenstein y Suiza (en Suiza, solo a profesionales), así que el folleto no cubre su venta en España; RWAdar no ha encontrado ningún documento oficial que explique en qué se basa la venta de Kraken a particulares en la UE.

Por qué:

- «Bajo su licencia europea» presenta como sabida una base legal que no
  documenta nadie. La licencia de la CySEC autoriza los servicios de Kraken,
  pero no dice con qué base se ofrece este producto al público en España.
- «Ese folleto» no tiene antecedente en la frase.
- «No ampara tu compra» puede entenderse como «tu compra no vale». Lo
  documentado es que el folleto no cubre la venta en España.

**Cambio 2. Métrica «Condiciones finales».**

> Solo ofrecen el producto en Liechtenstein y Suiza (en Suiza, solo a profesionales); España no figura como país de oferta

Y en la referencia «Países de oferta (condiciones finales)», el valor:

> Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado

Por qué: las condiciones finales **sí citan España**, entre los países a los
que se notificó el folleto (LITEx, p. 33), así que «no citan España» es falso
tal cual. Además, en Suiza solo se ofrece a profesionales.

**Cambio 3. «Folleto» (métrica y característica).**
Métrica:

> Aprobado por la FMA de Liechtenstein y notificado a la CNMV (11/05/2026); no cubre su venta en España

Característica «Folleto»:

> Folleto base aprobado por la FMA de Liechtenstein el 08/05/2026 y notificado a la CNMV el 11/05/2026, con suplementos de agosto y septiembre de 2026; no cubre su venta en España, porque las condiciones finales no la prevén

Por qué: «notificado a la CNMV», leído solo, hace pensar que el folleto vale
para venderlo en España. Es justo lo que no puede sugerirse.

**Cambio 4. Referencia «Acceso desde España».**
Valor:

> Según Kraken UE, disponible para sus clientes ubicados en la UE que superen su evaluación o sean inversores profesionales

Alcance:

> Página de xStocks de Kraken UE consultada el 03/11/2026. Kraken no nombra España: habla de clientes ubicados en la UE. Las condiciones finales del emisor no citan España como país de oferta.

Por qué: la referencia cita `eu.kraken.com/xstocks`, pero esa página no dice
«inscrita en la CNMV (n.º 4474)». Ese dato ya está en «Registro del vendedor».
Tampoco dice «(España incluida)». Lo probé con el lector de la tarjeta: con este
texto sigue saliendo «Disponible desde España según la fuente» (`estado: si`).

**Cambio 5. Comisión con euros (métrica «Compra con euros» y valor de la referencia «Comisión con euros»).**

> 1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica

Alcance de la referencia:

> Tabla de comisiones de Kraken consultada el 03/11/2026. La versión inglesa añade que las compras instantáneas pequeñas pagan hasta 2 USD en lugar del 1 %; la española no lo dice.

Por qué: con un mínimo de 1 €, decir solo «1 %» hace creer que una compra
pequeña cuesta céntimos. La misma URL, en inglés, dice «Small instant trades
carry a fee of up to $2 instead of the 1% fee». Lo probé con el lector: la
tarjeta enseña «Comisión con euros: 1 % por compra instantánea, o hasta 2 USD…».

**Cambio 6. Fuentes que faltan.**
Añadir a `documentacion.fuentes`:

> https://support.kraken.com/articles/xstocks-availability

Respalda «pagando con dinero fiduciario» de la descripción («EEA clients can
buy, sell, and convert xStocks using fiat only»).

Añadir a `documentacion.fuentes` y a `fuentesActuales`:

> https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500001AB7C6C7F577*%20AND%20-document_type:FTWS&wt=json&rows=50&sort=approval_filing_date%20desc

Respalda los «suplementos de agosto y septiembre de 2026» pasaportados a
España. Además, es el «registro de ESMA» que pedía la revisión anterior.

**Cambio 7. Regenerar y volver a ensayar.**
Con los cambios 1 a 6:

1. `node rwadar-app/data/verificaciones/2026-11-03.4-v2/preparar-entrega.mjs`.
2. `node rwadar-app/data/verificaciones/2026-11-03.4-v2/comprobar-entrega.mjs`.

El resultado tiene que seguir siendo «correcto», con 26/24/7/14/3, las 23
fichas idénticas y la guarda en `fab6d2e4`. Hay que anotar el `revisionId` y
el SHA-256 nuevos.

---

## 6. Recomendaciones (no obligatorias)

1. **Alcance de «Países de oferta»:** decir que las condiciones finales de LITEx
   (26/03/2026) se emitieron con el folleto de 2025. Por ejemplo: «Condiciones
   finales del producto n.º 159 (LITEx, 26/03/2026, emitidas con el folleto de
   2025) alojadas en la web oficial del emisor; las de 2026 que se leyeron dicen
   lo mismo.»
2. **Textos internos:** en `aprobada_referencia`, en `notaOrigen` y en
   `cambiosObligatoriosAplicados` cambiar «no citan España» por «no ofrecen el
   producto en España». `notaOrigen`, además, se contradice: dice «sin altas ni
   retiradas» y después «Alta de Kraken xStocks». No es público, pero confunde.
3. **«Situación del emisor»:** el «no es rentable» literal está en el folleto
   (p. 30). El suplemento habla de «history of operating losses» y de la
   dependencia del grupo. Se puede citar en el alcance.
4. **Fecha de la tarjeta:** muestra «Dato: 30/10/2026», que sale de la
   referencia de dividendos. Es el comportamiento general del lector.

---

## 7. Lo que no comprobé

- **En qué se basa legalmente la venta de Kraken a particulares en España.**
  Ningún documento público lo explica: de ahí el segundo aviso del cambio 1.
- **Si la cláusula de «hasta 2 USD» se aplica en la práctica a los xStocks
  comprados en la UE.** Para verlo hay que iniciar sesión. La versión española
  no la recoge.
- **El diferencial de Kraken:** no se publica.
- **Cómo se ve la tarjeta en un móvil real.** Solo simulé los recortes web y
  app sobre la imagen generada.
- **Las condiciones finales de 2026 (BPWO-80) en un canal oficial.** El
  contenedor del emisor solo tiene, que yo sepa, las de 2025 y la de LITEx de
  marzo de 2026. `assets.backed.fi` sigue bloqueada por país y no intenté
  saltarme el bloqueo.

No toqué Supabase, no publiqué ni ejecuté EAS. No escribí en
`docs/tareas/PARA-CODEX.md` porque el encargo era escribir solo este informe.
Lo anota quien coordina.

---

## Anexo: consultas (03/11/2026, UTC)

| Hora | URL (final) | HTTP | Bytes | SHA-256 |
|---|---|---|---|---|
| 12:02:27 | https://eu.kraken.com/xstocks (en) | 200 | 1418392 | `12e47a8660669ce95e0dc89e624463e6b505c4ecae3cbb1696e0c9a0c880a95f` |
| 12:02:28 | https://eu.kraken.com/legal/risk-disclosure (en) | 200 | 236992 | `f70b1d2d50a57a574d689993af0fb59bc777cd89d177a2ce11e9b98ec7b2a3c8` |
| 12:02:29 | https://www.kraken.com/features/fee-schedule (en) | 200 | 1459280 | `437f6ccb3f86bb05c95581675c390531926e9735e951a0e4dffec6963c5d4e61` |
| 12:02:29 | https://support.kraken.com/articles/xstocks-faq (en) | 200 | 1096114 | `415f13efc60b0e143f2593e27c30dd2fb1edc0f533c95a5f89213cea164a42e3` |
| 12:02:29 | https://support.kraken.com/articles/xstocks-availability (en) | 200 | 4155559 | `a5b4b0083d52de64a6b49b40bbacda7a190089df778b8900af71287b906cd564` |
| 12:03:34 | https://eu.kraken.com/xstocks (es) | 200 | 1423018 | `9b41ae44ddb35a7360a3b48c425ba2cf277ebafda10eafeb744c73682d16f4ae` |
| 12:03:35 | https://eu.kraken.com/help/fees → https://www.kraken.com/features/fee-schedule (es) | 200 | 1472728 | `539ba4e591bc5b3b0c4a322a473e3216d6ef5e4f81989e3955a7fff5951811eb` |
| 12:03:36 | https://www.kraken.com/features/fee-schedule (es) | 200 | 1472919 | `77174d66ef687e8bea0091e2f9e685f2e23331260848387f186f69d66e0d06ac` |
| 12:03:36 | https://support.kraken.com/articles/xstocks-faq (es) | 200 | 1102893 | `b165e89b9b95a798c60f18b426d94d2397d3caaaba5d93b70e7f47cb37702b4b` |
| 12:03:37 | https://support.kraken.com/articles/xstocks-availability (es) | 200 | 4158627 | `497ca443c7a66fc575ada289227bdac17e1cf4068053ad64ff44b9668fa77adb` |
| 12:03:37 | https://eu.kraken.com/legal/risk-disclosure (es) | 200 | 238057 | `02beaf231e5f0f35366f421366d4a947a19a7c015d28bfc8f4d4a19c9ccc6d3b` |
| 12:03:59 | https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/ | 200 | 597969 | `094fb1290d10fd123bc3bf4784eb21599007c298edac97ce9403a3067d672672` |
| 12:04:02 | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474 | 200 | 217445 | `2b4c3570359fe3b98791e29aa88eba1e303c2e15445a5749b74758d87606af0e` |
| 12:04:03 | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474&vista=17 | 200 | 252133 | `5adf8b5b9127ada05d5210cef60bec2c3696f54f7670eae35b96ca9ffb41b47f` |
| 12:04:05 | https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500001AB7C6C7F577 | 200 | 214720 | `d81a4f27eac6b6e0fed8db4089910e01bc3c4c49e73e9a71203ff0d899ddbf3c` |
| 12:04:27 | https://www.mfsa.mt/wp-content/uploads/2026/05/Backed-Assets-JE-Limited-Base-Prospectus-Document-dated-08-May-2026.pdf | 200 | 1428039 | `47be92729ffec7b9bae6c6b6141b1d16b571c787170b570a8f59a03459f008b3` |
| 12:04:27 | https://www.mfsa.mt/wp-content/uploads/2026/10/Backed-Assets-JE-Limited-Second-Supplement-Document-dated-29-September-2026.pdf | 200 | 290018 | `acb0376b2b87f62de152d94130b4613badb17e64a06194c25ae27840f11a0a71` |
| 12:04:28 | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms%20Nr%20159%20(LITEx)_20260326.pdf | 200 | 1365826 | `85b56d11920c9641dcf95f28ca7aa030d53bef0f5729df8f2e252c1c9d0fde5a` |
| 12:07:59 | https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500001AB7C6C7F577*%20AND%20-document_type:FTWS&wt=json&rows=50&sort=approval_filing_date%20desc | 200 | 21243 | `0cf6e2201569db1f81c1745b9e9253a0a94cb50e838340f87283431d51be68bd` |
| 12:11:13 | https://xstocks.fi/ → https://xstocks.fi/us | 200 | 142880 | `db6a78cb089f70f7fd8625a968cdb02b5baf35df359b04f5977799a8b790c040` |

Los hashes del folleto, del segundo suplemento y de las condiciones finales de
LITEx coinciden con los de la revisión anterior y su addenda. Las copias están
en mi carpeta temporal de sesión, no en Git.

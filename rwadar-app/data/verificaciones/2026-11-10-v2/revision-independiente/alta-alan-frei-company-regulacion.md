# Revisión independiente · alta «alan-frei-company» · lente: regulación y acceso legal · 10/11/2026

Yo no preparé este expediente. He intentado refutar la propuesta
(`admitir_propuesta` en «secundario») desde mi lente: quién es la entidad y
en qué registro está, si tiene pasaporte o notificación en la CNMV, si hay
advertencias, si el producto puede venderse a particulares en España y si
RWAdar puede enlazarla sin presentarla como algo que no es.

Todas mis consultas son del 10/11/2026, entre las **09:48:27 y las 09:58:42
UTC**. Solo he leído páginas, documentos, registros y API públicos. No he
iniciado sesión, no he hecho KYC, no he conectado monederos y no he tocado el
expediente.

Copias en `fuentes/alta-alan-frei-company-regulacion/`:

- `extractos-regulacion.txt`: los literales que cito abajo;
- `inventario-consultas.json`: 43 entradas con URL, hora, tamaño y sha256;
- `crudo/`: respuestas completas. **No va a Git**: tiene PDF firmados y el JSON
  de Zefix, que lleva nombres de personas.

## Veredicto: rechazado

Los datos del expediente son ciertos: la entidad existe, no hay advertencias
y el emisor admite a residentes del EEE. Pero **«Acceso desde España: Sí» no
se sostiene desde el punto de vista legal**:

1. La ley española exige que una entidad autorizada intervenga en las ofertas
   como esta.
2. El emisor dice por escrito que vende sin intermediario.
3. Ninguna de las dos sociedades figura en los registros de la CNMV.

Si RWAdar publica la tarjeta con «Sí» y el paso «Compra al emisor», estará
presentando como accesible legalmente a un particular en España algo que, con
las fuentes de hoy, no cumple la condición que pone la ley española. Ante la
duda, rechazo.

## 1. Lo que sí se sostiene

| Punto | Fuente, literal y hora |
|---|---|
| Entidad | Zefix `https://www.zefix.ch/ZefixREST/api/v1/firm/1527753.json` (09:48:29Z): «Alan Frei Company AG», CHE-482.713.456, `EXISTIEREND`, Zúrich, `auditFirms: null`. Es el registro mercantil, no una licencia financiera. |
| FINMA, autorizados | POST `https://www.finma.ch/en/api/search/getresult`: «Alan Frei» → `"Count":0` (09:51:45Z); «Aktionariat» → `"Count":0` (09:51:46Z). El control «Sygnum» devuelve 1, «Sygnum Bank AG» (09:51:47Z). |
| FINMA, advertencias | Lista completa (2.402 entradas, 09:51:48Z): 0 coincidencias con «alan frei», «alanfrei» o «aktionariat». |
| PolyReg | `https://api.polyreg.ch/api/membership-check?name=Alan%20Frei%20Company%20AG` (09:58:25Z): `"result": "false"`. El control «Switzerlend AG» devuelve `"true"`. |
| CNMV, advertencias | `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`. Con «Alan Frei», «Alan Frei Company», «alanfrei», «shares.alanfrei.com» y «Aktionariat» (09:49:30–09:49:43Z): «por tipo No autorizadas … No hay datos disponibles». El control «Capital» (09:49:47Z) sí da resultados; el primero es del 10/11/2026. **Sin advertencias.** |
| KID | No hace falta. Las acciones compradas directamente no son un PRIIP. El Reglamento 1286/2014, art. 4.1 (EUR-Lex, renderizado 09:58:42Z), lo limita a productos con exposición a «activos no adquiridos directamente por tal inversor». Que no haya KID no es un defecto. |
| Documentos | Registration Agreement (sha256 `f046305c…`) y Token Shareholder Agreement V2.0 (sha256 `9b8b7720…`), descargados a las 09:51:15–16Z. Son idénticos a los del investigador. Ninguno de los dos trae restricciones de venta por país. |

## 2. Por qué falla el acceso legal desde España

### 2.1 Sin folleto, sin pasaporte y sin notificación

- **CNMV, pasaportes recibidos.**
  `https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=Alan%20Frei&lei=`
  (09:52:18Z): «No se han encontrado datos disponibles». El control «Backed»
  (09:52:21Z) sí sale: «11/05/2026 BACKED ASSETS (JE) LIMITED LIECHTENSTEIN
  BPWO-80».
- **ESMA, registro de folletos.**
  `registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*Frei*`
  (09:55:31Z): 7 resultados, ninguno de Alan Frei Company.
- **CNMV, búsqueda por entidades** (registros oficiales, formulario
  renderizado): «Aktionariat» (09:54:34Z) y «Alan Frei» (09:54:52Z) dan «No
  se han encontrado resultados». El control «Renta 4» (09:55:06Z) da «Han
  sido encontrados: 89 resultados».
- **CNMV, proveedores europeos de financiación participativa que prestan
  servicios en España** (09:56:43Z): ni «Aktionariat» ni «Alan Frei».

Son sociedades suizas, así que no pueden tener pasaporte europeo. El
emisor se apoya en una exención de folleto por importe. Su web
(`https://alanfrei.com/investor`, 09:48:30Z, sha256 `d9a5427b…`) dice:
«The offering is limited in Switzerland to CHF 8,000,000 per year and in the
EEA to €100,000 per year». No cita qué artículo aplica.

### 2.2 Qué exige la ley española a una oferta así

**Ley 6/2023**, texto consolidado del BOE («Última actualización publicada el
07/10/2026»), `https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053`
(09:48:27Z):

- **Art. 35.2.b.** No hace falta folleto cuando las ofertas «no estén sujetas
  a notificación de conformidad con el artículo 25 … y el importe total … en
  la Unión sea inferior a ocho millones de euros».
- **Art. 36.1.** «Cuando se trate de colocación de emisiones no sujetas a la
  obligación de publicar folleto por … ser su importe total en la Unión
  Europea inferior a ocho millones de euros … que se dirijan al público en
  general empleando cualquier forma de comunicación publicitaria, **deberá
  intervenir una entidad autorizada para prestar servicios de inversión**.
  La actuación de esta entidad deberá incluir, al menos, la validación de la
  información a entregar a los inversores y la supervisión de modo general
  del proceso de comercialización.»
- **Art. 36.2.** Solo exime a las plataformas de financiación participativa
  y a los proveedores autorizados según el Reglamento (UE) 2020/1503.
  Aktionariat no figura entre ellos (punto 2.1).

El marco europeo no cambia la conclusión:

- El **Reglamento (UE) 2024/2809** (Listing Act, EUR-Lex renderizado,
  09:50:31Z) suprime el art. 1.3 del Reglamento de Folletos («se suprime el
  apartado 3»). Ya no hay un tramo de menos de 1 M€ que quede fuera del
  Reglamento.
- La exención pasa a ser por importe: «inferior a 12 000 000 EUR», o
  5.000.000 si el Estado lo decide. Se aplica desde el 5 de junio de 2026
  (art. 4.3).
- La CNMV (`…/ofertas-exentos-folleto`, 09:50:02Z) dice que la Ley española
  «está pendiente de modificación para incorporar varias disposiciones de la
  Listing Act». El art. 36.1 sigue en vigor tal como está.
- Los 100.000 € del EEE que fija el emisor no coinciden con ningún umbral
  vigente (8 M€ en España; 12 M€ o 5 M€ en la UE). En cualquier caso, una
  oferta de 100.000 € está exenta **por su importe**, que es justo el caso
  del art. 36.1.

**Cómo lo aplica la CNMV.** En sus Preguntas y respuestas FinTech
(`https://www.cnmv.es/docportal/Legislacion/FAQ/QAsFinTech.pdf`, última
actualización 14/10/2022, leído a las 09:57:50Z), la pregunta 6.5 trata del
mismo requisito en la ley anterior (art. 35.3 del TRLMV). Admite dos formas
de cumplirlo:

- que una entidad autorizada intervenga en cada compra;
- que una entidad autorizada valide y supervise toda la oferta, asegurándose
  de que la información sea «clara, imparcial y no engañosa».

Para ofertas con tecnología de registro distribuido, añade que la entidad no
debe validar la información sin «advertencias destacadas acerca de la
naturaleza novedosa de la tecnología de registro» y de la custodia.

### 2.3 El emisor vende sin intermediario y lo dice

- **Investor Page Terms v1.0 (30/10/2026), §3**
  (`https://shares.alanfrei.com/investor-page-terms`, 09:48:30Z, sha256
  `efd5860f…`): «All Primary Offers are settled directly between the User and
  the Company, **without intermediary**.»
- **§9.1:** «The public offer to purchase the shares from the Company
  (Direct Investment) is exclusively addressed to persons domiciled or
  resident in Switzerland or the EEA … limited to a total of €100,000». Es
  una **oferta pública**, abierta a quien resida en España.
- **Pie del portal** (`https://shares.alanfrei.com/`, renderizado,
  09:56:24Z): «Such offers constitute a primary offering by the issuer and
  are governed by the Financial Services Act in Switzerland, **or equivalent
  laws for visitors of other countries**.» El propio emisor admite que, para
  un visitante de España, se aplica la ley española.
- **Token Shareholder Agreement V2.0, §1.4:** «the Issuer may decide to offer
  Share Tokens for public sale».
- En ningún documento del emisor, del portal ni de Aktionariat
  (`https://www.aktionariat.com/disclaimer`, 09:58:11Z) aparece una entidad
  autorizada que valide la información o supervise la venta.
- No hay folleto ni documento informativo. El portal solo está en «en de-ch
  fr it», sin español.

**Conclusión.** Con las fuentes de hoy no hay ninguna prueba de que la venta
a particulares en España cumpla el art. 36.1. Hay una prueba escrita en
contra: «without intermediary».

### 2.4 El mercado entre accionistas tampoco tiene amparo en España

- Pie del portal (09:56:24Z): «considered a non-commercial trading facility
  … under the Financial Market Infrastructure Act and is therefore not subject
  to prudential supervision». Es una excepción de la ley suiza.
- Investor Page Terms §4.4: «Neither the Company nor the Trade Contracts are
  subject to any regulatory approval or supervision».
- Pregunta 6.4 de la CNMV: si lo que se negocia son instrumentos
  financieros, la plataforma debe tener las autorizaciones de un centro de
  negociación o de una ESI.

No he encontrado ninguna autorización europea ni española de ese mercado. Es
la vía de salida que la tarjeta ofrece a un particular español.

### 2.5 Qué supone para RWAdar

- La tarjeta que se propone dice «Sí: su web abre la oferta a residentes en
  Suiza y el EEE», con los pasos «Registro en el portal → Compra al emisor».
  Así convierte un criterio de admisión del emisor («domiciled … in the EEA»)
  en una afirmación de acceso legal en España que ninguna fuente respalda.
- Además, la tarjeta es una comunicación en castellano para el público
  español. Es justo lo que el emisor no hace (su portal no está en español) y
  lo que el art. 36.1 somete a una entidad autorizada.
- Según el encargo, para admitir hace falta «entidad y registro del
  regulador». Aquí no hay ningún registro de supervisor financiero: solo el
  registro mercantil. El expediente lo reconoce (`supervisorVerificado:
  null`).

## 3. Contraargumentos que he considerado

- **«La oferta la hace un emisor suizo y no se dirige activamente a
  España.»** Es posible, y la CNMV no se ha pronunciado sobre este emisor.
  Pero la web y las condiciones la llaman «public offering» y la abren al
  EEE, y la tarjeta de RWAdar sí la dirigiría al público español. No puedo
  descartar el incumplimiento, y eso basta para no decir «Sí».
- **«Ya hay tres fichas de Aktionariat publicadas»** (aktionariat en
  principales con `disponibleEs: true`, y boss-info y switzerlend en
  secundario). Es cierto, y les afecta el mismo problema. Que hubiera un
  precedente no hace legal el alta. Lo anoto abajo para el coordinador; la
  retirada solo la decide Víctor.
- **«El investigador no se equivoca en ningún dato.»** Correcto. El fallo no
  está en los datos, sino en lo que concluye de ellos («Acceso desde
  España: Sí», `disponibleEs: confirmado`).

## Correcciones

Obligatorias (mi veredicto):

1. **`decision`**: «no_admitir».
2. **`motivoDecision`** (texto propuesto): «Sin acceso legal confirmado en
   España: el emisor vende sin folleto y "without intermediary" (Investor Page
   Terms §3), y la Ley 6/2023, art. 36.1, exige una entidad autorizada que
   valide la información y supervise la venta cuando una oferta exenta por
   importe se dirige al público con publicidad. Ni Alan Frei Company ni
   Aktionariat figuran en la CNMV (registros, pasaportes ni financiación
   participativa) ni en FINMA. Sin advertencias de la CNMV.»
3. **`disponibleEs`**: «no_confirmado», no «confirmado».
4. **Claim `accesoEspana`**: mantener el literal, pero con estado
   `respaldado_con_alcance` solo para la admisión del emisor. Añadir un claim
   `campo: "accesoLegalEspana"` con estado `no_verificable`, citando la Ley
   6/2023, art. 36.1, y el literal «without intermediary».
5. **Claim `folleto`**: añadir en `alcanceYLimites`: «Exención por importe:
   en España activa el art. 36.1 de la Ley 6/2023 (entidad autorizada
   obligatoria si hay publicidad dirigida al público); el emisor no la tiene».

Si el coordinador la admitiera de todos modos (no lo recomiendo):

6. **`resumenTarjeta.accesoEspana`** (104 caracteres): «No confirmado:
   admite residentes del EEE, pero vende sin la entidad autorizada que exige
   la ley española».
7. **Aviso nuevo**: «En España, una oferta sin folleto dirigida al público
   con publicidad exige una entidad autorizada (Ley 6/2023, art. 36.1); el
   emisor vende sin intermediario.»

Para el coordinador:

8. El punto 2 afecta igual a las fichas publicadas **aktionariat**,
   **boss-info** y **switzerlend**: la misma plantilla de portal, la misma
   oferta pública al EEE y ningún intermediario. Hay que revisarlas con esta
   lente. No he propuesto retirarlas: no es mi encargo, y la retirada la
   decide Víctor.

## Límites

- No soy abogado. Es una lectura literal de la ley y de la CNMV, no una
  opinión jurídica. Ni la CNMV ni el emisor se han pronunciado sobre este
  caso.
- La pregunta 6.5 de la CNMV es de 2022 y cita la ley anterior (art. 35.3 del
  TRLMV). El texto que está hoy en vigor es el art. 36.1 de la Ley 6/2023,
  que he leído en el BOE.
- No he consultado al emisor. No he probado el registro, el KYC ni una
  compra.
- La búsqueda por entidades de la CNMV solo funciona con el formulario. La
  hice con Playwright y comprobé que funciona con el control «Renta 4».
  EUR-Lex devuelve 202 a curl, así que lo leí renderizado.
- Datos personales: en mis extractos no hay nombres de personas físicas.
  «Alan Frei» solo aparece como parte del nombre legal de la sociedad. Los
  PDF y el JSON de Zefix de `crudo/` llevan nombres y no deben subirse a Git.

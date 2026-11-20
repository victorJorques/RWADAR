# Revisión independiente · Simpleros, bonos digitales DLT (2.ª ronda en CrowdedHero) · 20/11/2026

Revisor independiente: no hice el análisis. Todas las consultas son mías, de hoy,
entre las 21:32:16 y las 21:38:17 UTC. Usé peticiones GET normales (curl con su
agente por defecto y TLS verificado), sin cuenta ni sesión. A la CNMV le pedí
`accept-language: es`. La KIIS no la busqué por ninguna vía (ACCESO-FUENTES §1 y §2.5).

- Copia de texto con las citas, las horas y los hashes, sin nombres de personas:
  `grupos/busqueda-nueva/fuentes/revision-simpleros/revision-independiente-simpleros-20.txt`
- Prueba de la tarjeta (script y salida):
  `grupos/busqueda-nueva/fuentes/revision-simpleros/prueba-tarjeta-simpleros.cjs` y `.txt`
- Crudos (HTML, PDF, JSON y CSV filtrados, con `registro-consultas.tsv`). Traen
  nombres de personas y no se publican:
  `grupos/busqueda-nueva/fuentes/crudo/revision-simpleros/` (fuera de Git)

## Veredicto: rechazado. Se confirma el «no admitir» del analista

Su motivo se sostiene con mis consultas: **no hay ningún documento público propio
de esta 2.ª ronda.** La KIIS está detrás del registro. El único documento abierto
son los términos que publica el registrador alemán, y son los de la oferta 44, que
es la 1.ª ronda. La **calidad** también es inaceptable para un particular, y es aún
peor de lo que dice el expediente:

- **La «prenda del 150 %» casi no vale nada.** Los bonos que se dan en prenda son
  toda la deuda de Audacia Capital OÜ. Al cierre de 2024, esa sociedad tenía
  2.034 € en caja y fondos propios negativos (−22.609 €). Su único activo es un
  crédito de 275.000 € contra un deudor que no se dice. Esos bonos los pone en
  prenda la administradora única del propio emisor. Y la sociedad pertenece a las
  dos personas que la CNMV lista como responsables de la plataforma, que además es
  quien tendría que ejecutar la prenda.
- **El emisor presta minicréditos al 2.321 % TAE** («Historial crediticio no
  importa») y dice que no lo supervisa el Banco de España. Desde hoy, 20/11/2026,
  se aplica la nueva directiva europea de crédito al consumo. Esa directiva exige
  registrar y supervisar a estos prestamistas y poner freno a los intereses
  excesivos.
- **La plataforma es muy frágil.** En 2025 vendió 39.322 € (113.930 € en 2024),
  perdió 68.723 €, terminó con 2.121 € en caja y fondos propios de −51.085 €, y
  tenía 2 empleados. Es ella quien apunta en sus libros qué bonos tiene cada
  inversor.

Hay dos matices que corregir en el texto del analista (ver «Correcciones» al
final): cómo describe la sección de documentos y el estado de las rutas de
data.gov.lv. Ninguno cambia la decisión.

---

## 1. Lo esencial, con mis consultas de hoy

**a) Entidad y registro: se sostiene, pero con mala solidez.**
- CNMV,
  `https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001`
  (21:32:29Z, HTTP 200). SHA-256 `fe578b14…e4fb`, el mismo que el 11/11. Dice:
  «CROWDEDHERO LATVIA LTD (SIA CROWDEDHERO LATVIA)» · «Nº Registro oficial 1» ·
  «01/09/2022» · «LETONIA». En «Responsable» figuran dos personas (no copio sus
  nombres).
- ESMA,
  `https://registers.esma.europa.eu/solr/esma_registers_upreg/select?q=ae_lei:984500B08DG03M3EA171&wt=json`
  (21:32:30Z, 200, mismo hash que el 11/11). Dice: «SIA CrowdedHero Latvia» ·
  «Latvijas Banka» · «Active» · «16/08/2022» · «EUROPEAN UNION». Última
  actualización: «22/02/2024».
- Emisor: «SIMPLEROS, S.L. · CIF B01787720 · LEI 98450082BEF114765441» (términos)
  y, en su web (`https://simpleros.es/condiciones-generales`, 21:32:25Z), «inscrita
  en el Registro Mercantil de Barcelona, al Tomo 47434, Folio 134, Hoja 551677».
  En GLEIF (`https://api.gleif.org/api/v1/lei-records/98450082BEF114765441`,
  21:37:42Z) su LEI está «ACTIVE», dado de alta el 19/05/2026.
- Registrador: BaFin, ficha 160639 (21:32:31Z): «Smart Registry GmbH ·
  Kryptowertpapierregisterführer, Sehr kleines Institut ·
  Kryptowertpapierregisterführung … 19.08.2026». Custodio: BaFin, búsqueda
  «Tangany» (21:37:48Z): «Tangany GmbH · … Kryptoverwahrer …». El custodio está
  supervisado. Pero el registro inscribe todos los bonos en **una sola anotación
  conjunta**, y quién tiene cada bono lo apunta la plataforma (términos 2.1;
  contrato DLT 9.1).

**b) Oferta abierta hoy: sí, pero parada y con el plazo alargado.**
- `https://www.crowdedhero.com/project/view?id=50` (21:32:16Z) dice: «Raising now» ·
  «6 Days left» · «€82 500.00 raised» · «82.3% of min. target» · «Min target
  €100 250.00» · «Max target €200 000.00» · «Investors 4».
- La copia del 10/11 (`2026-11-10-v2/grupos/ampliacion/fuentes/crowdedhero/project-50.txt`)
  decía «€82 500.00 … 4 Shareholders … 4 Days remaining». El 11/11
  (ACCESO-FUENTES §2.5c) quedaban 3 días. **En diez días no han entrado ni dinero
  ni inversores, y el contador ha vuelto a subir.**
- 1.ª ronda, `https://www.crowdedhero.com/project/view?id=44` (21:32:17Z): «Funded» ·
  «€50 250.00 raised» · «Min target €50 000.00» · «Investors 9». Es decir,
  100.250 € = 50.250 € + 50.000 €. Ninguna fuente lo explica, así que no doy por
  hecho que sea una cifra acumulada.
- Prueba nueva de que la 2.ª ronda no tiene documento propio: el PDF de términos
  dice «Offer ID: 984500B08DG03M3EA17100000044». Es el LEI de la plataforma seguido
  de **…00000044**, el número de la 1.ª ronda (proyecto 44). Ese texto describe la
  «First Campaign EUR 200,000 (min. EUR 50,000)», y ese umbral ya lo alcanzó la
  1.ª ronda.

**c) Acceso desde España como particular: sí, de la plataforma, no confirmado para esta oferta.**
- FAQ, `https://www.crowdedhero.com/faq?category=investor` (21:32:23Z): «Investors
  residing outside Latvia can invest in offers available on CrowdedHero, with the
  exception of investors based in the United States».
- Condiciones, `https://www.crowdedhero.com/legal?category=terms` (21:32:22Z):
  6.1.6 «be residing and/or registered in a Member State…». El 11.5 añade: «We may
  offer different content and services on the Platform to the Investors depending
  on their residence country». Contrato DLT 5.1[e]: residentes en la UE/EEE.
- La ficha no existe en español:
  `https://www.crowdedhero.com/es/project/view?id=50` da **404** (21:32:18Z). Solo
  hay versión en inglés, alemán y letón.

**d) Mínimo: se sostiene.** Términos 2.3: «The minimum subscription amount is EUR
250 (one Digital Bond)». La ficha dice «Minimum investment €250.00». Hay que sumar
el 1,25 % de entrada (términos 6.4; tarifas «Administration* 1.25%»).

**e) Salida: se sostiene.** Términos 8.1: «No secondary market is provided by the
Issuer or the Platform». Contrato DLT 5.2[b]: «'buy and hold' model». El dinero se
devuelve al vencimiento, el 15/11/2028, o antes si el emisor decide amortizar a
partir del 15/11/2027 (4.1 y 4.2). Un traspaso necesita la aprobación manual del
custodio (8.2) y paga una comisión que solo figura en la KIIS (contrato DLT 7.2).
El tablón `https://www.crowdedhero.com/secondary-market` (21:32:24Z) solo tiene
acciones. Hay 4 días de reflexión (contrato DLT 2.4).

**f) Riesgos: la ficha nombra los genéricos y calla los que importan.** Literal
(21:32:16Z): «Capital loss risk – You may lose all your invested capital» ·
«Subordinated bonds…» · «No secondary market – High liquidity risk» · «No deposit
guarantee or investor compensation scheme» · «Regulatory and credit risk in
consumer lending sector» · «This offer has not been reviewed by Latvijas Banka or
the European Securities and Markets Authority (ESMA).» La ficha no cuenta qué hay
detrás de la prenda, ni a qué TAE presta el emisor, ni la situación de la
plataforma (ver punto 4).

**g) Documentos: NO CUMPLE (pieza esencial).**
- La KIIS no es pública. La ficha la exige («Read the Key Investment Information
  Sheet before investing») y a la vez la oculta: «only registered and Verified
  investors could access the restricted Project campaign documents».
- Idioma: el contrato DLT dice que la KIIS está «available in Latvian, English and
  German». Si la oferta se anuncia en España, el art. 23.3 del Reglamento (UE)
  2020/1503 (EUR-Lex, 21:38:17Z) pide la KIIS en castellano «o en una lengua
  aceptada» por la CNMV. No consta ni lo uno ni lo otro. No es un producto PRIIP
  con KID: aquí el documento clave es la KIIS.
- Términos públicos: el PDF del registrador
  `https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf`
  (21:32:20Z, 5 páginas, en inglés). SHA-256 `c0c445e4…f056`, el mismo que el
  11/11. Es de la oferta 44 (ver b).
- Contradicciones confirmadas:
  - objetivo mínimo: 100.250 € en la cabecera frente a «Minimum threshold €50,000»
    en el texto de la misma ficha;
  - comisión sobre el cupón: «5.5% of each interest payment» (términos 5.3) frente
    a «Bond model · Interest (semi-annual) · 0.55%» (tarifas, 21:32:24Z). En las
    tarifas, el 5,5 % aparece para el modelo de acciones;
  - titularidad: «Einzeleintragung (single entry)… registered as a single aggregate
    entry… recorded by the Platform on its own books» (términos 2.1) frente a
    «registered in the Investor's name» (contrato DLT 3.3);
  - emisor según el contrato DLT: «“NYALA Digital Asset” AG».
- Advertencias de la CNMV (21:32:35–21:32:40Z, `ResultadoBusqueda?tipo=1&nombre=…`):
  ninguna para Simpleros, CrowdedHero, Audacia Capital ni Lemonway («No hay datos
  disponibles», sin tabla de resultados). La búsqueda de control «Trading» devuelve
  la tabla con 10 filas, así que el buscador funciona.

## 2. Enlaces: todas las URL del expediente y de la propuesta de tarjeta

| URL | Hora (UTC) | Código final | Tamaño | Resultado |
|---|---|---|---|---|
| crowdedhero.com/project/view?id=50 | 21:32:16 | 200 | 77.705 B | Carga, en inglés. Los documentos están detrás del registro |
| crowdedhero.com/project/view?id=44 | 21:32:17 | 200 | 75.492 B | Carga |
| crowdedhero.com/project/index | 21:32:18 | 200 | 58.552 B | Carga |
| crowdedhero.com/es/project/view?id=50 | 21:32:18 | **404** | 22.826 B | **Falla**: no hay versión en español |
| crowdedhero.com/de/project/view?id=50 | 21:32:19 | 200 | 80.011 B | Carga |
| de000a4exnm2.register.nyala.de/…SIMPLEROS%2003.07.2026.pdf | 21:32:20 | 200 | 99.476 B | Carga (PDF de 5 páginas) |
| nyala.de/en/products/electronic-securities | 21:32:21 | 200 | 206.104 B | Carga; mismo hash que el analista |
| crowdedhero.com/legal?category=dlt | 21:32:22 | 200 | 91.606 B | Carga |
| crowdedhero.com/legal?category=terms | 21:32:22 | 200 | 146.005 B | Carga |
| crowdedhero.com/faq?category=investor | 21:32:23 | 200 | 92.028 B | Carga |
| crowdedhero.com/pricelist/investor-pricelist | 21:32:24 | 200 | 43.367 B | Carga |
| crowdedhero.com/secondary-market | 21:32:24 | 200 | 77.696 B | Carga |
| simpleros.es/condiciones-generales | 21:32:25 | 200 | 65.596 B | Carga |
| simpleros.es/ | 21:32:26 | 200 | 29.100 B | Carga |
| ariregister.rik.ee/eng/company/16250495 | 21:32:27 | 200 | 297.317 B | Carga, sin sesión |
| cnmv.es/…/Proveedor-Europeo?nreg=1&nif=PSFPUE0001 | 21:32:29 | 200 | 150.697 B | Carga |
| registers.esma.europa.eu/solr/…984500B08DG03M3EA171 | 21:32:30 | 200 | 1.486 B | Carga (JSON) |
| portal.mvp.bafin.de/…institutId=160639 | 21:32:31 | 200 | 25.984 B | Carga |
| data.gov.lv … 25e80bf3… q=50203309441 | 21:32:32 | 200 | 1.462 B | **Sin datos a esta hora** (0 registros; ver nota) |
| data.gov.lv … 50ef4f26… statement_id 2269545 | 21:32:33 | 200 | 1.524 B | **Sin datos a esta hora** (0 registros) |
| data.gov.lv … d5fd17ef… (PyG, citado en el localizador) | 21:32:34 | 200 | 2.229 B | **Sin datos a esta hora** (0 registros) |
| cnmv.es/portal/ResultadoBusqueda … (5 búsquedas) | 21:32:35–40 | 200 | 211–236 KB | Cargan; control con resultados |
| fktk.lv/en/market/crowdfunding-service-providers/ltd-crowdedhero-latvia/ | 21:32:42 | 301 → error | 0 B | **Falla**: redirige a la portada de bank.lv y la conexión se corta («HTTP/2 stream 1 was not closed cleanly») |

No hubo 403, ni páginas antirrobots, ni retos.

- **Fallos para un visitante:** la versión en español (404) y el enlace al
  supervisor que pone la propia ficha (roto). Además, los documentos de la oferta
  solo se ven con cuenta verificada. El botón «Invest now» lleva a una ficha en
  inglés que pide leer una KIIS que no se puede abrir.
- **Nota sobre data.gov.lv:** no es un fallo de la fuente. Los ficheros se
  actualizaron hoy a las 21:25Z (`resource_show`, «last_modified
  2026-11-20T21:25:31»), y el almacén consultable se estaba recargando: el total
  del registro pasó de 282.200 filas (21:34:38Z) a 306.850 (21:35:19Z). Leí el
  mismo dato en los CSV oficiales del mismo recurso (21:36:20–21:36:54Z) y coincide
  con el expediente (ver punto 4). Ninguna de estas rutas está en la tarjeta.

## 3. Presentación de la tarjeta y la ficha

Construí una oferta de prueba con la forma de
`2026-11-13-v2/escaparate-publicacion.json`, usando la `propuestaTarjeta` tal cual.
Las referencias llevan las etiquetas fijas «Mínimo de inversión», «Acceso desde
España» y «Salida», con fuentes de `fuentesActuales`. Después ejecuté
`resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`) y los ayudantes
de la tarjeta de `rwadar-site/assets/rwadar-20260820.js`. Salida literal
(21:36:12Z):

```
lineaTarjeta: "Mínimo Desde 250 € (1 bono), más 1,25 % de… · España Sin confirmar"
Lo esencial:  mínimo «Desde 250 € (1 bono), más 1,25 % de entrada» · España «Sin confirmar»
              · salida «Salida: Sin mercado secundario: se cobra al vencimiento, el 15/11/2028»
              (corta: «Sin mercado secundario: se cobra al…»)
estado:       «Datos con fuente y fecha · consulta las condiciones» · costes «Costes no documentados»
```

Lo que se vería y por qué está mal:
- **Mínimo cortado y con %.** `resumenOferta` no lee el texto como importe en euros,
  porque lleva «(1 bono), más 1,25 % de entrada». Lo deja como texto y la tarjeta lo
  corta a los 40 caracteres.
- **España «Sin confirmar»** aunque `disponibleEs` sea `true`. El texto «Sí, para
  residentes en la UE/EEE…» no contiene ninguna de las palabras que reconoce la
  función (disponible, admite, permite, acceso).
- **Salida cortada**: pierde la fecha.
- **El resumen tiene 146 caracteres** (más de 120) y lleva una frase interna, «hoy no
  se propone tarjeta», que no puede llegar al lector.
- **No lleva avisos.** Si se publicara, haría falta un aviso crítico sobre la prenda
  y sobre los documentos.
- El título (40 caracteres) está bien, igual que las fechas DD/MM/AAAA y la ausencia
  de «por token/participación/acción» y de rentabilidad.

Solo para ver la forma, con «250 €», «Disponible para residentes en España
(plataforma notificada a la CNMV, n.º 1)» y «Sin reventa: se cobra al vencimiento,
el 15/11/2028», la línea sale bien: **«Mínimo 250 € · España Sí»**. No es una
propuesta de publicación: la candidata no se admite, así que la tarjeta no se
arregla.

## 4. Calidad de la oferta para un particular en España

**Costes**, por bono de 250 € y si todo se paga:
- entrada: 3,13 € (1,25 %);
- registro y custodia: 0,88 € al año (0,35 % del nominal);
- comisión sobre el cupón desde el segundo año: 1,44 € al año si es el 5,5 %
  (términos), o 0,14 € si es el 0,55 % (tarifas). No se sabe cuál de las dos vale;
- traspaso: comisión que solo está en la KIIS;
- no hay diferencial porque no hay mercado.

El coste no es el problema. El problema es el riesgo.

**Liquidez real: ninguna.** No hay reembolso ni mercado con compradores: el tablón
solo tiene acciones. El dinero queda bloqueado hasta el 15/11/2028, salvo que el
emisor decida devolverlo a partir del 15/11/2027.

**Emisor.**
- Presta minicréditos al consumo. Su ficha de información
  (`https://simpleros.es/informacion-sobre-prestamo`, 21:32:26Z) dice: «Tipo de
  Interés Nominal (TIN) 365%» · «TAE 2321%» · «Interés de demora: 3% diario» ·
  «Autoridad de supervisión: No está sujeto a supervisión por parte del Banco de
  España». La portada promete «Historial crediticio no importa».
- La ficha de la oferta lo presenta de otra forma: «businesses seek flexible
  financing solutions», «Proven Profitability», «Fixed Yield Dividends», «a solid
  opportunity». Son frases comerciales, y las cifras de 2025 que da (1,96 M€ de
  ventas, 202.505 € de beneficio) no tienen documento.
- Riesgo regulatorio concreto, desde hoy: la Directiva (UE) 2023/2225 (EUR-Lex,
  21:35:08Z) se aplica «a partir del 20 de noviembre de 2026». Su art. 37.1 pide
  «procedimiento de reconocimiento adecuado, … registro y supervisión» para estos
  prestamistas, y su art. 31.1 pide medidas para que no se cobren tasas anuales
  equivalentes «excesivamente elevadas», «tales como límites máximos».
- El bono es subordinado: en un concurso cobran antes todos los demás acreedores.

**La prenda (lo más grave).**
- Los términos (7.1, 7.2 y 7.5) la venden como «coverage ratio of at least 150%».
  Son 3 bonos de Audacia Capital OÜ de 100.000 € cada uno.
- Registro de Estonia (`https://ariregister.rik.ee/eng/company/16250495`,
  21:32:27Z): «Capital is 20 000 € · Established without making contribution»;
  cuentas de 2025 «Not submitted (due date 30.06.2026)»; actividad «management
  consultancy».
- Cuentas de 2024, del mismo registro (`…/fiscal_year_report/1:3674585:14/pdf` y
  `…:35/pdf`, 21:34:08–21:34:11Z):
  - «CASH AND BANK 2 034»;
  - deuda a largo plazo «300 000», igual al nominal de los 3 bonos de la prenda;
  - único activo relevante: un crédito a largo plazo de «275 000», sin decir contra
    quién;
  - «Equity or Net assets -22 609»;
  - ventas de 30.200 € en 2024 y de 0 € en 2021–2023.
- En la práctica, la prenda vale lo que Audacia pueda cobrar de ese crédito
  desconocido.
- La prenda la constituye la administradora única del propio emisor (términos 7.1 y
  firma). Audacia es al 50 % de dos personas, que son también su consejo y sus
  titulares reales. Son las mismas dos que la CNMV lista como responsables de
  CrowdedHero. Hice el cruce en local y no copio nombres.
- CrowdedHero es la fiduciaria que tendría que ejecutar esa prenda (1.10 y 10.1).
  Es una estructura circular y con conflicto de interés, y la ficha no lo cuenta.

**Plataforma (custodia de los derechos de cada inversor).** CSV oficiales de
data.gov.lv (21:36:20–21:36:54Z):

| | 2024 | 2025 |
|---|---|---|
| Ventas | 113.930 € | 39.322 € |
| Resultado | −28.737 € | −68.723 € |
| Caja | 13.474 € | 2.121 € |
| Fondos propios | +17.639 € | −51.085 € |
| Empleados | 2 | 2 |

Es la que apunta qué bonos tiene cada inversor, cobra por Lemonway y es fiduciaria
de la prenda. Su pie de página sigue con «AGENT NAME … REGAFI NUMBER» sin rellenar.
Su listado marca como «Funded» una campaña al «1.4%» de su mínimo («Restoration of
Zentene Manor», 21:32:18Z).

**Tamaño y antigüedad.**
- Emisión de 500.000 € (NYALA, «Simpleros Bonds X»). La 1.ª ronda reunió 50.250 €
  con 9 inversores; la 2.ª lleva 82.500 € con 4 inversores, parada desde el 10/11.
- La plataforma existe desde 2021 y tiene licencia desde 2022.
- El LEI del emisor es de mayo de 2026. El registrador obtuvo la autorización de
  BaFin el 19/08/2026, después de la fecha de emisión (01/07/2026).

**Señales de alarma.**
- Lenguaje comercial («solid opportunity», «Proven Profitability», cupón llamado
  «dividends»).
- Plazo alargado sin dinero nuevo.
- Documentos que se piden leer y no se enseñan.
- Contradicciones en el mínimo, la comisión, la titularidad y el emisor.
- Prenda circular.
- Plataforma en patrimonio negativo.
- No hay advertencias ni sanciones públicas de la CNMV.

**Comparación con lo publicado.** Hoy no hay en el catálogo ninguna oferta de
crédito privado ni de bonos. Las principales que dan rendimiento son los fondos de
Spiko. Por ejemplo, «Spiko Letras del Tesoro Euro»: UCITS, KID en español, riesgo
«1 de 7», «0,25 % anual», reembolso diario. La próxima de Hausera, también de
financiación privada, tiene al menos su documento de emisión público y en español.
Simpleros queda muy por debajo en todo: liquidez, solidez, transparencia y
supervisión del emisor.

**Conclusión de calidad:** aunque la plataforma esté autorizada, es una oferta
mala para el lector. No se admite.

## Correcciones al expediente (no cambian la decisión)

1. **«Documents».** Donde dice «La sección «Documents» de la ficha es texto de
   relleno («Lorem ipsum») con cuatro «Moneyz.csv» que no abren (enlaces vacíos)»
   y la nota «href="#"», debe decir: «La sección «Documents» es un marcador borroso
   (CSS `blur(10px)`), con «Lorem ipsum» y cuatro botones «Moneyz.csv» sin enlace,
   tapado por «To access full project information please log in or verify your
   account»: los documentos reales solo se ven con cuenta verificada». En el HTML
   no hay ningún `href="#"`, y lo mismo pasa en p44.
2. **data.gov.lv.** Las tres rutas `datastore_search` de los claims `riesgoPlataforma`
   y `registros` devolvían hoy, de 21:32 a 21:35Z, 200 con 0 registros por la
   recarga de las 21:25Z. Conviene añadir como fuente de respaldo los CSV oficiales
   del mismo recurso
   (`https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/50ef4f26-f410-4007-b296-22043ca3dc43/download/balance_sheets.csv`
   y `…/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv`),
   que confirman las cifras.
3. **Añadir al claim `garantia`**: el balance de 2024 de Audacia Capital OÜ (caja
   2.034 €, deuda a largo plazo de 300.000 €, crédito a largo plazo de 275.000 €,
   fondos propios de −22.609 €), y que quien constituye la prenda es la
   administradora única del emisor.
4. **Añadir el claim `riesgoEmisor`**: «TIN 365% · TAE 2321% · Interés de demora: 3%
   diario · No está sujeto a supervisión por parte del Banco de España»
   (`https://simpleros.es/informacion-sobre-prestamo`). Y la Directiva (UE)
   2023/2225, aplicable desde el 20/11/2026 (arts. 31 y 37).
5. **Añadir al claim `documentos`**: el «Offer ID …00000044» de los términos es el
   de la 1.ª ronda (proyecto 44).
6. **`propuestaTarjeta.resumen`**: quitar «hoy no se propone tarjeta» y dejarlo en
   120 caracteres o menos. Es irrelevante mientras no se admita, pero ese texto no
   debe poder llegar a una tarjeta.

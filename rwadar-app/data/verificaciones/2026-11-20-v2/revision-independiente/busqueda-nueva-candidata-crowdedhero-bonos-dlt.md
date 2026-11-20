# Revisión independiente · candidata CrowdedHero (bonos digitales DLT) · 20/11/2026

Revisor independiente: no hice el análisis. Todas las consultas son mías, de hoy,
entre las 21:19:31 y las 21:27:55 UTC, con peticiones GET normales (curl con su
agente por defecto, TLS verificado), sin cuenta ni sesión. La KIIS no la busqué
por ninguna vía (ACCESO-FUENTES §1 y §2.5).

- Copia de texto con las citas, las horas y los hashes:
  `grupos/busqueda-nueva/fuentes/revision-crowdedhero/revision-independiente-crowdedhero-20.txt`
- Prueba de la tarjeta (script y salida):
  `grupos/busqueda-nueva/fuentes/revision-crowdedhero/prueba-tarjeta-crowdedhero.cjs` y `.txt`
- Crudos (HTML, PDF y JSON; traen nombres de personas, no se publican):
  `grupos/busqueda-nueva/fuentes/crudo/revision-crowdedhero/` (fuera de Git)

## Veredicto: rechazado (se confirma el «no admitir» del analista)

Su motivo se sostiene: **no hay documentos públicos claros**. Además, la
**calidad de la oferta no es aceptable** para un particular, por razones que el
expediente no recoge:

- **Simpleros es un prestamista de microcréditos rápidos.** Su propia ficha
  europea de crédito al consumo da un TIN del 365 %, una TAE del 2.321 % y una
  demora del 3 % diario, y dice que no la supervisa el Banco de España.
- **La garantía del «150 %» es floja.** Son bonos de una consultora estonia con
  capital de 20.000 € sin desembolsar, 30.200 € de ingresos en 2024 y las
  cuentas de 2025 sin presentar.
- **El token no refleja a cada inversor.** En Polygon ya existen los 2.000 bonos
  (500.000 €), aunque solo se han colocado unos 82.500 €. Quién es dueño de qué
  lo apunta la plataforma en sus libros. Y la plataforma cerró 2025 con
  2.121 € en caja y fondos propios de −51.085 €.

Un punto del analista hay que matizarlo: el «choque» entre 100.250 € y 50.000 €
casi seguro es una cifra acumulada, aunque nadie la explica (ver 1.b).

---

## 1. Lo esencial, con mis consultas de hoy

**a) Entidad y registro: se sostiene.**
- ESMA, `https://registers.esma.europa.eu/solr/esma_registers_upreg/select?q=ae_lei:984500B08DG03M3EA171&wt=json`,
  a las 21:21:08Z, HTTP 200. Dice: «SIA CrowdedHero Latvia» · «Latvijas Banka» ·
  «Active» · «16/08/2022» · «EUROPEAN UNION» · última actualización «22/02/2024».
- CNMV, `https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001`,
  a las 21:21:09Z, HTTP 200. SHA-256 `fe578b14…cc3be4fb`, el mismo que el 11/11.
  Dice: «CROWDEDHERO LATVIA LTD … Nº Registro oficial 1 · 01/09/2022».
- ESMA, registro de sanciones: 0 resultados por LEI y por nombre (21:26:48–21:26:57Z).
  El registro funciona: la consulta de control da 1.315.
- BaFin, ficha 160639, a las 21:21:10Z: «Smart Registry GmbH ·
  Kryptowertpapierregisterführer, Sehr kleines Institut ·
  … Kryptowertpapierregisterführung … 19.08.2026».
- Lo que no se sostiene es la solidez de la plataforma. Cuentas de 2025 en
  data.gov.lv (21:21:59–21:22:00Z): «cash» 2121, «equity» −51085,
  «net_turnover» 39322 y «net_income» −68723, con 2 empleados. Es una sociedad
  muy pequeña, en pérdidas y con patrimonio negativo. Y es a la vez fiduciaria
  de la prenda (términos 1.10 y 10.1) y quien lleva el registro de cada
  inversor (contrato DLT 9.1).

**b) Oferta abierta hoy: sí, dos, pero con señales malas.**
- Simpleros, `https://www.crowdedhero.com/project/view?id=50`, a las 21:19:33Z.
  Dice: «Raising now» · «6 Days left» · «€82 500.00 raised» · «82.3%» ·
  «Min target €100 250.00» · «Investors 4».
  - El 10/11 la copia guardada decía «4 Days remaining», 82.500 € y
    «4 Shareholders». El 11/11 decía 3 días. Hoy dice 6 días: **el contador de
    días se ha alargado, sin dinero ni inversores nuevos**.
  - Matiz al analista: la primera ronda,
    `https://www.crowdedhero.com/project/view?id=44` (21:26:03Z), dice
    «Funded» · «€50 250.00 raised» · «Min target €50 000.00» · «Investors 9».
    Así que 100.250 € = 50.250 € de la 1.ª ronda + 50.000 € de umbral. Es una
    deducción mía: ninguna página ni documento lo dice. El problema real es que
    **la 2.ª ronda no tiene documento público**. Los términos solo describen la
    «First Campaign EUR 200,000 (min. EUR 50,000)», y su umbral ya se alcanzó en
    la 1.ª ronda. Nadie explica qué pasa con el dinero si esta ronda no llega a
    100.250 €.
- Amber Hostelis, `https://www.crowdedhero.com/project/view?id=49`, a las
  21:19:31Z. Dice: «25 Days left» · «€1 000.00 raised» · «2.0%» · «Investors 1».
  Sigue diciendo «Planned for September 2026 Bond issuance» y «[TO BE COMPLETED
  AFTER FINAL BUDGET APPROVAL…]».
- Bolivar Logistic, `https://www.crowdedhero.com/project/view?id=51`, a las
  21:19:33Z: «Coming soon», 0 €. No se puede invertir.

**c) Acceso desde España como particular: se sostiene a nivel de plataforma.**
- Pasaporte en la CNMV, nº 1 (punto a).
- FAQ, `https://www.crowdedhero.com/faq?category=investor` (21:19:55Z):
  «Investors residing outside Latvia can invest … with the exception of
  investors based in the United States».
- Condiciones (21:19:54Z), punto 6.1.6: «be residing and/or registered in a
  Member State…». Punto 11.5: «We may offer different content and services …
  depending on their residence country».
- Los países de cada oferta van en la KIIS, que no es pública.
- La web solo está en inglés, alemán y letón: `/es/project/view?id=50` da 404
  (21:24:56Z).

**d) Mínimo: se sostiene.**
- Simpleros: «The minimum subscription amount is EUR 250 (one Digital Bond)»
  (términos, art. 2.3) y «Minimum investment €250.00» en la ficha.
- Amber: «The minimum investment is two bonds, or €500».
- Bolivar: 100 €, pero aún no está abierta.
- En todas se paga un 1,25 % de entrada: tarifas («Administration* 1.25%») y
  términos, art. 6.4.

**e) Salida: se sostiene, y es mala.**
- El contrato DLT, `https://www.crowdedhero.com/legal?category=dlt` (21:19:53Z),
  dice en 5.2[b]: «there is no secondary market for Digital Bonds; they are
  issued under a 'buy and hold' model».
- Los términos de Simpleros dicen en 8.1: «No secondary market is provided by
  the Issuer or the Platform».
- El dinero vuelve al vencimiento, el 15/11/2028, o antes si el emisor quiere
  amortizar a partir del 15/11/2027 (4.2).
- El tablón, `https://www.crowdedhero.com/secondary-market` (21:19:56Z), tiene
  «Showing 1–7 of 7 listings»: todo acciones, ningún bono.

**f) Riesgos: se sostienen.**
- La ficha 50 dice: «Capital loss risk – You may lose all your invested
  capital · Subordinated bonds … · No secondary market … · Regulatory and credit
  risk in consumer lending sector».
- La ficha 49 dice: «The company’s equity remained negative at the end of
  2025». En data.gov.lv, BALVORA da «equity» −150078 (21:22:01Z).

**g) Documentos: NO CUMPLE (se confirma).**
- Las tres fichas tienen «Documents (h2 - can be used multiple times accross
  one text)», «Moneyz.csv» sin enlace y «Apraksts par dokumenta failu Lorem
  ipsum…»: 3 apariciones en cada ficha.
- Las fichas piden «Read the Key Investment Information Sheet before investing»,
  pero la KIIS solo la ven inversores verificados.
- Según el contrato DLT, la KIIS existe «in Latvian, English and German».
- No es un PRIIP (es una KIIS del reglamento europeo de financiación
  participativa), así que no aplica el KID en español. Aun así, no hay ningún
  documento en español.
- Términos públicos solo hay para Simpleros:
  `https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf`
  (21:19:58Z, 5 páginas, SHA-256 `c0c445e4…f42af056`, el mismo que el
  analista). Amber no está en la lista de NYALA, que tiene 31 ISIN y de
  CrowdedHero solo «Simpleros Bonds X» (21:19:57Z, mismo hash que el analista).

**Contradicciones confirmadas:**
1. **Comisión sobre el cupón.** Los términos (5.3) dicen «A commission of 5.5% of
   each interest payment». Las tarifas (21:19:56Z) dicen «Bond model Interest
   (semi-annual) 0.55%».
2. **Inscripción del bono.** Los términos (2.1) dicen «single aggregate entry …
   individual entitlements … recorded by the Platform on its own books». El
   contrato DLT (3.3) dice «registered in the Investor's name». Lo confirma el
   propio token en Polygon: lectura `eth_call` en el nodo público a las
   21:20:51Z, `totalSupply()` = 2000 y `name()` = «Simpleros Token // ISIN:
   DE000A4EXNM2». Ya están creados los 2.000 bonos, aunque solo se han colocado
   unos 82.500 €: la cadena no refleja a cada inversor.
3. **Quién emite.** El contrato DLT dice que los bonos «are issued by “NYALA
   Digital Asset” AG». Las fichas dicen que los emite cada sociedad.
4. **Nueva: la comisión sobre dividendos.** La FAQ dice «3.5% when an investor
   receives dividends». Las tarifas dicen «5.5%».

**Advertencias de la CNMV: no hay ninguna.**
- Busqué en `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`
  CrowdedHero, Balvora, Simpleros, Bolivar Logistic, Amber Hostelis, Audacia y
  Smart Registry (21:21:24–21:21:38Z). Todas dan «No hay datos disponibles».
- El control con OKX (21:21:40Z) sí da filas, así que el buscador funciona.

## 2. Enlaces

Probé con GET normal las 23 URL del expediente (todas las de documentos,
registros, advertencias, claims y `propuestaTarjeta`), siguiendo las
redirecciones, entre las 21:24:19Z y las 21:24:41Z.

| Resultado | URL |
|---|---|
| 200 (77–109 KB) | fichas 49, 50 y 51 |
| 200, `application/pdf`, 99.476 B | términos de Simpleros en NYALA |
| 200 | `legal?category=dlt`, `=terms` y `=risk`; FAQ; tarifas; tablón |
| 200 | NYALA; CNMV nº 1; ESMA; BaFin; 6 búsquedas de advertencias de la CNMV; 2 consultas de data.gov.lv |
| **404** (22.817 B, «404 Back to civilization») | `https://www.crowdedhero.com/projects` |

- El enlace bueno al listado es `https://www.crowdedhero.com/project/index`
  (200 a las 21:25:05Z).
- Lo que no se ve en el código HTTP:
  - El enlace principal de la tarjeta (ficha 50) carga, pero su sección de
    documentos es texto de relleno.
  - El pie de todas las páginas dice «AGENT NAME is registered in the REGAFI
    under the number REGAFI NUMBER».
  - El enlace del pie al supervisor (`fktk.lv/…/ltd-crowdedhero-latvia/`) lleva
    a la portada de `bank.lv`, no a la ficha de la plataforma (21:24:54Z).
- Polygonscan, el enlace «Open on Blockchain» de NYALA, da 403 con desafío de
  Cloudflare (21:21:11Z). Lo anoto y no insistí: el dato del token lo leí por
  el nodo público. No es un enlace del expediente.

**Conclusión:** todos los enlaces del expediente cargan, salvo `/projects`. Ese
404 solo está en `pruebaPresentacion`; no lo usa ni la tarjeta ni las fuentes.

## 3. Presentación de la tarjeta y de la ficha

Monté una oferta de prueba con la forma de
`2026-11-13-v2/escaparate-publicacion.json`:

- principal, `disponibleEs: true`, `estadoRevision: "actual"`, verificada el
  20/11, 7 días de vigencia;
- `documentacion.fuentes` = `fuentesActuales`, y como referencias los tres
  textos de `resumenTarjeta`, con las etiquetas fijas «Mínimo de inversión»,
  «Acceso desde España» y «Salida».

Después ejecuté `resumenOferta` de `rwadar-site/assets/ficha-editorial-20261022.js`
con los ayudantes de la tarjeta de `rwadar-20260820.js`, a las 21:29:03Z.

**Tal como está la propuesta, se vería así:**

- **Tarjeta de la lista:** «Mínimo Desde 250 € (Simpleros) o 500 € (Amber)… · España Sin confirmar»
- **Lo esencial (ficha):**
  - Mínimo: «Desde 250 € (Simpleros) o 500 € (Amber)…». Por dentro,
    `resumenOferta` lo marca como «No documentado en euros».
  - España: «Sin confirmar».
  - Salida: «Sin mercado secundario: se cobra al…», cortado a 40 caracteres.
- **Estado:** «Datos con fuente y fecha · consulta las condiciones».

**Fallos:**
1. **El mínimo no se lee como euros.** El texto mezcla dos ofertas y la comisión
   de entrada, y la tarjeta lo corta con «…».
2. **España sale «Sin confirmar» aunque `disponibleEs` sea `true`.** El texto
   «Sí, para residentes en la UE/EEE; la plataforma está notificada a la CNMV»
   no lleva ninguna de las palabras que reconoce el código («disponible»,
   «admite», «permite», «acceso»).
3. **La salida depende de la fuente.** Si se cita el contrato DLT (que es de
   donde sale la frase), desaparece y queda «Sin documentar», porque
   `legal?category=dlt` no está en `fuentesActuales`. Con el PDF de NYALA sí se
   ve, pero cortada a media frase.
4. **El resumen tiene 165 caracteres** (el máximo es 120) y una nota interna
   que el lector no debe ver («hoy no se propone tarjeta»).
5. **`avisos` está vacío.** Para un bono subordinado, sin salida y de un emisor
   de alto riesgo, la tarjeta no puede ir sin el aviso de pérdida total y falta
   de liquidez.
6. **Una tarjeta mezcla dos emisores** (Simpleros y Amber) con plazos, cupones y
   riesgos distintos.
7. **Con el estado honesto (`fuentes_en_conflicto`)** se vería «Mínimo No
   verificado · España Sin confirmar» y «Las fuentes no coinciden».

**Lo que sí cumple:** no hay «por participación/token/acción» en el mínimo, no
hay rentabilidad (`rentabilidad: null`), no hay promesas en los textos
propuestos y las fechas van en DD/MM/AAAA.

**Con textos corregidos** («Desde 250 €», «Disponible para residentes en España:
la plataforma está notificada a la CNMV (n.º 1)», salida con el PDF de NYALA) la
tarjeta diría «Mínimo 250 € · España Sí». Lo dejo solo como prueba de que el
fallo es de redacción. **No propongo publicarla**, por los puntos 1 y 4.

## 4. Calidad de la oferta para un particular en España

**Costes, en Simpleros, para 1.000 € hasta el vencimiento:**
- Entrada: 12,50 €.
- Registro: 0,35 % al año (3,50 €/año).
- Comisión sobre el cupón desde el 2.º año: 5,78 € según los términos, o 0,58 €
  según las tarifas.
- En total, unos 20–25 € en dos años sobre un cupón bruto de 105 € al año.
- No hay diferencial de compra-venta porque no hay mercado.
- Los costes no son el problema. Lo que falla es todo lo demás.

**Liquidez real: ninguna.** No hay reembolso ni mercado. Solo se puede traspasar
a otro inversor dentro de la plataforma, con KYC y con una comisión que está en
la KIIS (no pública). El tablón no tiene ni un solo bono.

**Solidez del emisor:**
- **Simpleros** es un prestamista de microcréditos.
  `https://simpleros.es/informacion-sobre-prestamo` (21:22:14Z) dice: «TIN 365%»,
  «TAE 2321%», «Interés de demora: 3% diario…», «Autoridad de supervisión: No
  está sujeto a supervisión por parte del Banco de España». La portada dice
  «Historial crediticio no importa» (21:22:13Z). Es un negocio legal, pero de
  mucho riesgo legal y de impago; la propia ficha lo reconoce como «Regulatory
  and credit risk». Las cifras de 2025 que anuncia («2025 revenue €1.96M with
  net profit of €202,505») no tienen ningún documento público. El bono es
  **subordinado**.
- **La prenda** son 3 bonos de Audacia Capital OÜ, «coverage ratio of at least
  150%» medido sobre el nominal. Su ficha pública en Estonia
  (`https://ariregister.rik.ee/eng/company/16250495`, 21:22:33Z) dice: «Capital
  is 20 000 € Established without making contribution», «Legal person has
  non-submitted annual reports», 2025 «Not submitted (due date 30.06.2026)»,
  actividad de consultoría, ingresos de 2024 «30 200». Que esos bonos valgan
  300.000 € no está demostrado.
- **Amber** (BALVORA) tiene fondos propios de −150.078 €, un solo edificio
  alquilado, 1 inversor, emisión sin términos públicos y uso de fondos «TO BE
  COMPLETED».

**Plataforma y custodia:**
- La plataforma está autorizada, pero es diminuta: 39.322 € de ingresos,
  −68.723 € de resultado, 2.121 € en caja, fondos propios de −51.085 € y 2
  empleados en 2025.
- Concentra tres papeles: distribuye, lleva el registro de quién es dueño de
  qué y guarda la prenda.
- El registrador (autorizado por BaFin desde el 19/08/2026, «Sehr kleines
  Institut») solo ve una anotación global.
- Simpleros es cliente recurrente de la plataforma: acciones por 216.100 €, una
  1.ª ronda de bonos y ahora la 2.ª.

**Transparencia y alarmas:**
- No hay KIIS pública y los documentos son de relleno.
- El pie de página está sin rellenar.
- Hay tarifas contradictorias (5,5 % frente a 0,55 %, y 3,5 % frente a 5,5 %).
- La ficha 41 sale como «Funded» con «€450 of €32,040 min. target 1.4%»
  (21:26:04Z).
- **Hay presión comercial:** el contador de Simpleros se alarga (4 → 3 → 6 días)
  mientras los términos dejan suscribir hasta el 30/06/2027. Y la ficha usa
  reclamos como «Proven Profitability», «Stable. Profitable.» y «Fixed Yield
  Dividends».
- No encontré sanciones (ESMA) ni advertencias (CNMV).

**Frente a lo ya publicado:** en el catálogo no hay ninguna principal de crédito
privado. Las principales de rendimiento (Spiko) tienen KID en español, reembolso
diario y costes del 0,25 %. Las de reventa (Brickwise, Switzerlend) tienen
documentos públicos y un libro de órdenes verificable. CrowdedHero quedaría muy
por debajo en documentación, en liquidez y en solidez del emisor.

**Conclusión: legal (plataforma autorizada y con pasaporte), pero mala para el
lector. No se admite.**

## Cambios concretos al expediente (para el archivo, no para publicar)

1. **En `motivoDecision` y `claims[estado Simpleros]`**, cambiar «el objetivo
   mínimo choca (50.000 € frente a 100.250 €)» por: «la 2.ª ronda no tiene
   documento público; su mínimo de 100.250 € parece acumulado (50.250 € de la
   1.ª ronda, ficha 44, más 50.000 €) y nadie lo explica».
2. **Añadir en calidad:**
   - Simpleros presta microcréditos con una TAE del 2.321 % y no la supervisa el
     Banco de España (`simpleros.es/informacion-sobre-prestamo`, 21:22:14Z).
   - La prenda son bonos de una consultora con capital sin desembolsar y las
     cuentas de 2025 sin presentar (e-Äriregister 16250495, 21:22:33Z).
   - El token tiene los 2.000 bonos creados: `totalSupply` 2000 en Polygon,
     21:20:51Z.
   - La plataforma tuvo 39.322 € de ingresos, −68.723 € de resultado y 2.121 €
     en caja en 2025.
3. **En `pruebaPresentacion.enlaces`**, quitar `https://www.crowdedhero.com/projects`
   (404) o cambiarlo por `https://www.crowdedhero.com/project/index` (200).
4. **En `propuestaTarjeta`**: el resumen debe tener 120 caracteres como mucho y
   sin la nota interna; un mínimo por oferta, en euros y sin la comisión;
   España con la palabra «Disponible…»; y avisos de pérdida total y falta de
   liquidez. No cambia la decisión.
5. **Añadir la contradicción de la FAQ** (3,5 %) frente a las tarifas (5,5 %).

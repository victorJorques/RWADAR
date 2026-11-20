# Revisión independiente · candidata LISE · acciones de ST GROUP · 20/11/2026

Revisé la candidata entre las 21:16 y las 21:25 UTC. El análisis no es mío.
Abrí yo mismo las fuentes primarias con peticiones normales: curl con su agente
por defecto, TLS verificado y, en la CNMV, `accept-language: es`. Mis copias:

- Texto (en Git): `grupos/busqueda-nueva/fuentes/revision-lise/revision-independiente-lise-20.txt`
- Crudos (fuera de Git): `grupos/busqueda-nueva/fuentes/crudo/revision-lise/`
  (`consultas.log` y `enlaces.log` llevan la hora y el SHA-256 de cada consulta)

**Resultado: rechazado. Confirmo el «no admitir» del analista.** Una pieza
esencial falla hoy. Nada en los registros prueba que LISE pueda dar servicio a
un particular residente en España. Las dos pruebas del analista se sostienen
con controles más fuertes que los suyos:

- REGAFI recoge pasaportes hacia España de empresas de inversión francesas
  hasta el 28/09/2026, y LISE no tiene ninguno.
- El listado de la CNMV está al día hasta el 10/11/2026 y LISE no figura.

Además, la calidad como oferta es floja. Es una sola empresa pequeña y con
pérdidas. Entre comprar y vender se pierde casi un 10 %, y casi nadie compra
del otro lado. Los 23 enlaces del expediente funcionan. La tarjeta se vería
bien, salvo la fecha del precio del mínimo. El expediente necesita algunos
retoques, que no cambian la decisión (ver «Correcciones al expediente»).

## 1. Lo esencial (consultas propias de hoy)

### Entidad y registro: se sostiene

- **REGAFI, entidad** (21:16:08 UTC):
  <https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-entites/records?where=id_referentiel%3D749227>.
  Literal: `"cib": "[{\"code\": \"18883\", \"date\": \"2025-10-13\"}]"`,
  `"lei": "894500LNKGRT1I5QBU56"`, `"denomination": "LISE"`,
  `"categorie": ["Entreprise d'Investissement"]`, `"nature_autorisation": "Agrément"`.
  SHA-256 `60270554…`, el mismo que tiene el analista.
- **REGAFI, autorización** (21:16:20 UTC):
  <https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-autorisations/records?where=id_referentiel%3D749227&limit=100>.
  Dice `"situation": "ACTIF"`, `"pays_exercice": "FRANCE"` y
  `"si_keys": ",7:C1,8:C1,"`: solo dos servicios, la colocación sin
  compromiso firme y la gestión del mercado (SMN), los dos sobre valores
  negociables. El analista no lo recoge.
- **ESMA, lista DLT** (21:18:45 UTC; PDF creado el 04/11/2026):
  <https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf>.
  Literal: «LISE SA · LISE DLT TSS · DLT Trading & Settlement System · France ·
  Autorité de Contrôle Prudentiel et de [Résolution] · 13 October 2025».
- **ESMA, registro de mercados** (21:21:58 UTC):
  <https://registers.esma.europa.eu/solr/esma_registers_upreg/select?q=LISE&wt=json&rows=20>.
  Dice `'ae_entityTypeLabel': 'Multilateral trading facility'`,
  `'ae_micLeiEsmaId': 'LISE'`, `'ae_isSme': 'Yes'`,
  `'ae_homeMemberState': 'FRANCE'` y `'ae_hostMemberState': ''`. Este registro
  no recoge pasaportes, así que no dice nada a favor del acceso.
- **AMF** (21:21:35 UTC):
  <https://www.amf-france.org/fr/reglementation/regles-professionnelles-approuvees/decision-dapprobation-des-modifications-de-regles-du-systeme-multilateral-de-negociation-lise>.
  Literal: «Décision d'approbation des modifications de règles du système
  multilatéral de négociation LISE, concernant notamment l'enregistrement de
  LISE en qualité de marché de croissance des PME», del 31/03/2026. Es una
  prueba más de supervisión que el analista no cita.
- **Emisora:** ST GROUP SA, RCS Toulouse 477 869 994, ISIN FR0014017QA4. Es una
  sociedad holding creada el 01/07/2004 y en activo (registro público francés,
  <https://recherche-entreprises.api.gouv.fr/search?q=477869994>, 21:21:36 UTC).
  LISE se creó el 12/12/2024
  (<https://recherche-entreprises.api.gouv.fr/search?q=938642709>).

### Oferta abierta hoy: se sostiene (solo reventa)

- <https://www.lise.com/en/exchange/STGRP> (21:17:27 UTC, HTTP 200): «Market
  open 24/7» y «Capitalization €9,062,361.20». La última operación es del
  `2026-11-16T17:17:30Z`: 1 acción a 16,40 €. La página cuenta
  `"totalCount":551` operaciones desde la salida a bolsa.
- <https://www.lise.com/en/primary-market/st-group> (21:17:28 UTC):
  `"status":"SUCCEEDED"`, del 09/04 al 24/04/2026, «Unit price €18.25». La
  salida a bolsa está cerrada.

### Acceso desde España como particular: no se sostiene (confirmo el motivo)

- **Lo que dice LISE** (<https://www.lise.com/en/support>, 21:17:24 UTC,
  SHA-256 `b36738cf…`, el mismo que tiene el analista): «Lise is open to
  residents of France, Europe, the United Kingdom, and Switzerland.» En
  francés (<https://www.lise.com/fr/support>, 21:17:25 UTC): «Lise est ouverte
  aux résidents français, européens, du Royaume Uni et de Suisse.» No hay
  lista de países.
- **Otra frase que el analista no recoge:** la misma página trae, en los textos
  del alta de empresas, «Lise is available in over 200 countries». No prueba
  nada: es el selector de país de la sede de una empresa, no una regla de
  admisión de particulares. Las reglas (art. 9.3.1.2) y las condiciones de uso
  de marzo de 2026 no ponen condiciones de residencia. Lo he comprobado.
- **REGAFI, pasaportes de LISE** (21:16:09 UTC):
  <https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-passeports-sortants/records?where=id_referentiel%3D749227&limit=100>
  da `total_count 0`.
- **Control positivo, más fuerte que el del analista.** Busqué en el mismo
  conjunto los pasaportes hacia `ESPAGNE` de empresas de inversión francesas.
  Hay 75 (21:16:22 UTC) y 11 son posteriores a junio de 2025 (21:16:21 UTC).
  El más reciente es del `"date_debut": "2026-09-28"`. El registro está al día,
  y LISE, autorizada en octubre de 2025, no aparece.
- **CNMV, ESI del EEE en libre prestación** (21:16:43 UTC):
  <https://www.cnmv.es/portal/Consultas/listadoentidad?id=1&tipoent=4>.
  SHA-256 `35807bda…`, el mismo que tiene el analista. Lo he leído entero:
  - Tiene 812 entidades. La más reciente es «NAPERTE DESIGNATED ACTIVITY
    COMPANY · 5372 - 10/11/2026». Hay 59 francesas; la más reciente es del
    05/10/2026 (n.º 5364).
  - Sí figura «UAB AXIOLOGY DLT · 5350 - 16/06/2026», otro operador del
    régimen piloto DLT.
  - «LISE», «KRIPTOWN» y «LIGHTNING» no aparecen. La única coincidencia de
    «lise» es una dirección: «Rue Montagne de l'Eglise 11».
- **Conclusión:** LISE es una empresa de inversión autorizada. Para dar
  servicio a particulares en España tendría que haber notificado la libre
  prestación, y eso aparecería en REGAFI y en la CNMV. No aparece en ninguno
  de los dos, con los dos registros al día. Un «Europe» genérico no basta.
- **Matiz al motivo del analista:** la exención de folleto del art. 3.2 es
  cierta, pero solo afecta a la salida a bolsa, que ya está cerrada. No prueba
  nada sobre la reventa de hoy. La prueba decisiva son los dos registros.

### Mínimo: se sostiene, pero la fecha del precio está mal

- Reglas, art. 20.4.1.2 (PDF de 84 páginas, SHA-256 `5f692328…`, el mismo que
  tiene el analista): «Toutes les quantités sont négociables». Se puede
  comprar 1 acción.
- **Fallo:** el expediente dice «1 acción, 16,40 € en reventa (20/11)». Los
  16,40 € son el precio de la operación del **16/11**. El 20/11, a las
  21:17 UTC, la acción más barata a la venta en el libro estaba a **16,00 €**
  (132 acciones).
- Ayuda: «There is no minimum or maximum amount required to deposit funds».

### Salida: se sostiene

- Se vende a otro inversor en el libro de LISE. No hay recompra ni reembolso.
  La ayuda dice: «Withdrawals to your bank account may take up to 48 business
  hours.»
- **El analista no menciona el contrato de liquidez.** El documento de
  información (5.3) dice: «La Société a mandaté All Invest, en tant que
  prestataire de service d'investissement, pour animer le marché de ses
  actions dans le cadre d'un contrat de liquidité». Aun así, el libro de hoy
  está casi vacío del lado comprador (ver punto 4).

### Riesgos y documentos: se sostienen

- El apartado 5.3 dice, literalmente:
  - «Risque de perte totale ou partielle du capital investi.»
  - «la revente des titres n'est pas garantie, elle peut être incertaine,
    partielle, voire impossible».
  - «absence de leur valorisation par une "expertise indépendante"».
  - «Seule la première version des smart contracts utilisés par Lise … a été
    auditée. Ces smart contracts ne sont pas assurés.»
- Si LISE quiebra, la ayuda dice que hay protección: FGDR hasta 100.000 € para
  el efectivo y la garantía de valores hasta 70.000 € para los títulos.
- Documento de información Lise-DI-2026-001 (79 páginas, SHA-256 `ba3a3815…`)
  y suplemento S1 (4 páginas, `3259ed8d…`). Coinciden byte a byte con los del
  analista. La portada dice que no lo aprobó la AMF. Está solo en francés.
- No hay KID: son acciones, no un producto PRIIP. Nada está en español.
- **Detalle de transparencia:** el pie de lise.com dice «please consult the
  issuer's prospectus available at www.lise.com», pero no hay folleto.

### Advertencias de la CNMV: ninguna

Hice las búsquedas por tipo «No autorizadas», entre las 21:17:03 y las
21:17:07 UTC:

- «Lise», «ST GROUP», «Kriptown» y «Lightning Stock» dan «No hay datos
  disponibles».
- Control con «Trading» (21:17:09 UTC): da 16 páginas de resultados.
- Los SHA-256 de las cuatro búsquedas son los mismos que tiene el analista.

## 2. Enlaces

Probé las 23 URL del expediente y de la propuesta de tarjeta, con HEAD y con
GET siguiendo las redirecciones, entre las 21:18:16 y las 21:19:06 UTC. **Las
23 dan 200.** Ninguna da 404, 5xx, una página vacía ni un bloqueo antirrobots.

| URL | Código | Tamaño | Nota |
|---|---|---|---|
| lise.com/en/exchange/STGRP | 200 | 542.669 B | Página dinámica (precio y libro) |
| lise.com/en/support | 200 | 809.653 B | |
| lise.com/en/primary-market/st-group | 200 | 419.959 B | |
| lise.com/en/about/lise · /en/market · /llms.txt | 200 | 434.048 · 386.815 · 1.625 B | |
| lise.com/rules/regles-de-fonctionnement.pdf | 200 | 92.006 B | Redirige al visor de Google Drive («Règles de fonctionnement de Lise.pdf»), sin pedir acceso |
| lise.com/rules/politique-tarifaire.pdf | 200 | 91.969 B | Igual («Politique de transparence tarifaire.pdf») |
| lise.com/rules/conditions-generales-d-utilisation | 200 | 91.807 B | Igual |
| Descargas directas de Drive (3) | 200 | 869.556 · 160.442 · 763.669 B | Son PDF de verdad (84, 8 y 20 páginas) |
| Documento de información (S3 de LISE) | 200 | 23.522.543 B | Pesa mucho (23,5 MB) en el móvil, pero carga |
| Suplemento S1 (S3 de LISE) | 200 | 291.878 B | |
| REGAFI (3 consultas) | 200 | 784 · 33 · 58 B | |
| ESMA, lista DLT | 200 | 229.280 B | |
| CNMV, listado y 4 búsquedas | 200 | 1.993.103 · ~211 KB | |

Una nota: los enlaces `lise.com/rules/*.pdf` llevan al visor de Drive, no al
PDF directamente. El visitante ve el documento. No es un fallo.

## 3. Presentación de la tarjeta y de la ficha

Monté una oferta de prueba con la forma de las de `2026-11-13-v2/escaparate-publicacion.json`:

- `coleccion: "secundario"`, `estadoRevision: "no_verificable"` y
  `disponibleEs: null`.
- Las referencias son las de `resumenTarjeta`: «Mínimo de inversión» y
  «Salida». «Acceso desde España» va en null, como propone el analista.

Pasé la oferta por `resumenOferta` de `rwadar-site/assets/ficha-editorial-20261022.js`
(con un script de prueba de la sesión, que no se conserva). Para los textos cortos apliqué
las mismas reglas que la web (`datosCortosOferta`). Esto es lo que se vería, tal
cual:

- **Línea de la tarjeta:** `Mínimo 1 acción, 16,40 € en reventa (20/11) · España Sin confirmar`
- **Estado:** «Referencia de reventa · disponibilidad sin confirmar» (neutro).
- **Lo esencial de la ficha:** Mínimo «1 acción, 16,40 € en reventa (20/11)» ·
  España «Sin confirmar» · Salida «Venta a otro inversor en el mercado de…».
  Sin `salidaCorta`, la web corta el texto a 40 caracteres.
- **Salida completa en la ficha:** «Venta a otro inversor en el mercado de LISE,
  abierto 24/7, si hay comprador; última operación el 16/11 (20/11).»
- **Costes:** «Costes no documentados». En reventa la web no enseña comisiones.

Probé también una variante con la referencia «Acceso desde España: No consta
que LISE pueda dar servicio a particulares en España…». Sigue saliendo «Sin
confirmar»: el código solo marca «No» con «no disponible», «no admit…»,
«no permit…» o «excluid…».

Comprobación de las normas de las tarjetas:

| Norma | Resultado |
|---|---|
| ≤ 120 caracteres | Mínimo, 36; salida, 111. Cumple. |
| Mínimo sin «por participación/token/acción» | «1 acción» no es «por acción». Cumple. |
| Reventa sin rentabilidad ni precio principal | `rentabilidad` null y sin métricas. Cumple. |
| Sin promesas | Cumple. |
| Fechas DD/MM | Cumple. |
| Un precio de reventa del día, con su fecha | **No cumple.** «16,40 € … (20/11)» presenta como del 20/11 un precio del 16/11. |
| Castellano llano | Casi. El `resumen` dice «bolsa DLT», que es jerga. |

La tarjeta no se propone, y está bien que no se proponga. Si algún día se
reabre, hay que cambiar tres cosas:

1. El mínimo, por «1 acción, desde 16 € en reventa (DD/MM)», con el precio de
   venta más barato del día.
2. Añadir una `salidaCorta` de 40 caracteres como mucho, por ejemplo «Reventa
   en LISE, si hay comprador».
3. En el resumen, cambiar «bolsa DLT» por «mercado con registro en cadena de
   bloques».

## 4. Calidad de la oferta para un particular en España: floja

- **Costes:**
  - Comprar no tiene comisión de entrada ni de custodia.
  - Cada compraventa paga entre el 0,10 % y el 0,25 %. La política de precios
    v1.1 dice: «0 à 6 000 : 0,25%».
  - El coste real es la diferencia entre compra y venta. Mejor compra:
    14,50 € (1 acción). Mejor venta: 16,00 €. Es un 9,4 % sobre el precio de
    venta. Comprar y vender enseguida 1 acción cuesta cerca de un 10 % con
    las comisiones.
- **Liquidez real:**
  - Del lado comprador solo hay 786 acciones, por 3.765,74 € en total, y
    500 de ellas están pedidas a 2,05 €.
  - Vender 10 acciones da 14,05 € de media, un 14 % menos que la última
    operación.
  - Vender 100 acciones da 13,02 € de media, un 21 % menos.
  - Hay 551 operaciones en siete meses, casi todas de 1 a 15 acciones. La
    última fue de 1 acción, el 16/11.
  - Existe un contrato de liquidez (All Invest), pero hoy no se nota.
- **Emisora, según el documento de información (cuentas combinadas, K€):**
  - Ventas de 3.007 en 2025.
  - Pérdidas de -365 en 2025 y de -143 en 2024.
  - Pérdidas acumuladas de 2.418.155 € a finales de 2024. El 06/03/2026 redujo
    el capital para absorberlas.
  - Fondos propios de 2.198, gracias a un ajuste de impuesto diferido de
    +1.656.
  - Deuda financiera de 2.945, más 1.061 de créditos bancarios a corto.
  - A 16,40 €, la bolsa la valora en 9,06 M€, unas 3 veces sus ventas,
    teniendo pérdidas. El propio documento avisa de que el precio no lo fijó
    un experto independiente.
- **La salida a bolsa:**
  - Recaudó 2.071.831,25 € de un objetivo de 2.608.837,50 €, un 79 %. Pasó
    justo el mínimo de 1.956.637,25 €.
  - Hoy cotiza un 10 % por debajo del precio de salida (16,40 € frente a
    18,25 €).
  - El fundador no puede vender ninguna acción durante 12 meses, y la mitad
    durante los 12 siguientes. Desde abril de 2027 puede llegar más papel al
    mercado.
- **El mercado:**
  - LISE se creó el 12/12/2024 y tiene autorización desde el 13/10/2025.
  - Solo cotiza una empresa. Si ST GROUP tiene problemas, no hay nada más.
  - El régimen piloto es experimental, y los contratos inteligentes no tienen
    seguro.
- **Lo bueno:**
  - Está supervisada de verdad: ACPR, ESMA y reglas aprobadas por la AMF.
  - Hay garantía del efectivo y de los títulos si LISE quiebra.
  - Las comisiones son bajas y públicas, y los documentos son públicos.
  - No hay advertencias, presión comercial ni promesas de rentabilidad.
- **Comparación con lo publicado del mismo tipo** (acciones en reventa: Boss
  Info y Switzerlend):
  - LISE está mejor supervisada que esas dos, y su comisión es menor (Boss
    Info cobra un 1,9 %).
  - Su liquidez es igual de pobre.
  - La emisora tiene pérdidas y deuda.
- **Conclusión:** aunque se confirmara el acceso, como mucho entraría en
  «Reventa», y con avisos claros: diferencia de casi un 10 %, compradores
  escasos y empresa con pérdidas. Como oferta principal no sería aceptable.
  Hoy no se admite.

## Correcciones al expediente (no cambian la decisión)

1. **Mínimo:** cambiar `resumenTarjeta.minimo` («1 acción, 16,40 € en reventa
   (20/11)») y `prioridadEditorial.minimoEntrada` («1 acción (16,40 € el
   20/11)») por «1 acción, desde 16 € en reventa (20/11)». Los 16,40 € son de
   la operación del 16/11. La venta más barata del 20/11 era de 16,00 €.
2. **Motivo:** presentar la exención del art. 3.2 como contexto de la salida a
   bolsa, que está cerrada, y no como prueba sobre el acceso de hoy. Reforzar
   la prueba con los dos controles nuevos:
   - REGAFI: 75 pasaportes de empresas de inversión hacia España, el último
     del 28/09/2026.
   - CNMV: listado al día hasta el 10/11/2026, con 59 entidades francesas.
3. **Calidad (`porQueNo`):** añadir estos datos:
   - el contrato de liquidez con All Invest, que hoy no se nota;
   - la profundidad del libro (786 acciones y 3.765,74 € del lado comprador;
     vender 100 acciones sale a 13,02 € de media);
   - la salida a bolsa al 79 % del objetivo;
   - las pérdidas de ST GROUP (-365 K€ en 2025) y su deuda;
   - el fin del bloqueo del fundador desde abril de 2027.

   Cambiar «casi sin operaciones» por «551 operaciones desde abril, casi todas
   de 1 a 15 acciones».
4. **Registros:** añadir la autorización de REGAFI (`si_keys ,7:C1,8:C1,`), el
   registro de mercados de ESMA (`ae_hostMemberState` vacío) y la decisión de
   la AMF del 31/03/2026.
5. **Acceso:** anotar la frase de la interfaz «Lise is available in over 200
   countries» y explicar por qué no prueba el acceso. Anotar también que el pie
   remite a un «prospectus» que no existe.
6. **Tarjeta, solo si se reabre:** poner una `salidaCorta` de 40 caracteres como
   mucho y quitar «bolsa DLT» del resumen.

**Se reabre si** aparece en REGAFI un pasaporte de libre prestación hacia
España, o si LISE figura en el listado de la CNMV de ESI del EEE en libre
prestación. Un escrito de la ACPR o de la CNMV también bastaría. Uno de LISE
solo, si trae el número de la notificación.

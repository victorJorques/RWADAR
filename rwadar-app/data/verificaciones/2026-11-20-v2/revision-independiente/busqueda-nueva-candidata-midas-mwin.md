# Revisión independiente · candidata `candidata-midas-mwin` (Midas mWIN) · 20/11/2026

Revisor independiente. No hice el análisis. Repetí yo mismo las consultas a la
fuente primaria entre las 21:16:49Z y las 21:23:07Z del 20/11/2026.

- Crudos (fuera de Git): `grupos/busqueda-nueva/fuentes/crudo/revision-midas-mwin/`
- Extracto en texto: `grupos/busqueda-nueva/fuentes/revision-midas-mwin/midas-mwin-revision-2026-11-20.txt`

## Veredicto

**Confirmado con cambios.** La decisión `no_admitir` se sostiene: he comprobado
una a una las tres razones del motivo con mis propias consultas de hoy y todas
coinciden. Los hechos del expediente son correctos. Además, la oferta es mala
para un particular en España (punto 4).

Los cambios que pido son menores y **no cambian la decisión**:

1. **Título y resumen de `propuestaTarjeta`.** «gestionado por Wellington» y «con
   una cartera de crédito» salen de la nota de lanzamiento, que es una fuente
   secundaria y hoy da 403. El propio expediente dice que ese texto «no se usa
   como dato». Cambiar a:
   - título: «mWIN de Midas (Midas Wellington Income Opportunities)», que es el
     nombre que da el contrato en cadena;
   - resumen: «Token de un compartimento de titulización luxemburgués; sin
     folleto ni pasaporte para España y solo para carteras en lista blanca.»
2. **`resumenTarjeta.accesoEspana`.** Con el texto actual («No: sin folleto…»),
   `resumenOferta` no reconoce el «No». La tarjeta enseñaría «España No» y la
   ficha «Sin confirmar». Cambiar a: «No disponible desde España: sin folleto ni
   pasaporte, y solo para carteras en la lista blanca de Midas» (102 caracteres).
   Con ese texto, la ficha enseña «No, según la fuente».
3. **`bloqueos`.** Añadir que el buscador de entidades de la CSSF
   (edesk.apps.cssf.lu) solo funciona con JavaScript, que su código devolvió una
   respuesta vacía (21:19Z) y que por eso el registro de la CSSF sigue sin
   comprobarse.
4. **Lista blanca (claim de `accesoEspana`).** Añadir que en Avalanche las dos
   bóvedas tienen también la lista blanca activa (`greenlistEnabled = 1`) y que
   allí solo circulan 0,00004 mWIN (21:18:37Z). El claim dice ahora «Solo
   Ethereum».

---

## 1. Lo esencial, con mis consultas de hoy

### Entidad y registro

- **GLEIF** (21:17:14Z, HTTP 200):
  https://api.gleif.org/api/v1/lei-records/391200M2JHLV9OZAZN78
  Literal: «Aureum Securitisation Fund» · legalForm «Fonds de titrisation» ·
  registeredAs «O136» (RA000432) · 5, Avenue Gaston Diderich, Luxembourg ·
  category FUND · ACTIVE · creationDate 2025-11-24 · alta del LEI 2026-01-16.
  El SHA-256 (`efaca145…b504`) es el mismo que guardó el analista. La sociedad
  gestora es Aureum Manco S.à r.l. (LEI 391200LLEN2M7MS50Z79, B301171, creada
  el 2025-11-05; 21:17:15Z).
- **Supervisor:** no he encontrado ninguno.
  - ESMA (21:17:10Z–21:17:13Z, HTTP 200): `party_name:*391200M2JHLV9OZAZN78*`
    → `numFound 0`; `*Aureum*` → 0; `*AUREUM*` → 0. Una búsqueda de texto
    libre `*mWIN*` → 0.
    https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*391200M2JHLV9OZAZN78*&wt=json&rows=100
  - CSSF: no se pudo comprobar. El buscador de entidades solo funciona con
    JavaScript y su código no respondió (21:19:10Z–21:19:17Z). No se insistió.
- **Los cinco ISIN de la pista no son mWIN.** Confirmado: la ESMA (21:17:12Z)
  da para el LEI de Midas Software GmbH 41 documentos, los mismos que el
  analista y el 11/11. Los cinco FTWS de septiembre y octubre (DE000A4AXH53,
  DE000A4AXQV4, DE000A4AXS50, DE000A4AXS43, DE000A4AYDK3) llevan como
  `party_name` «Midas Software GmbH - 984500BB00BN6D2B7C48». Lo apoya también la
  documentación de Midas (copia de hoy, 16:55Z). Su lista «Legal Product
  Documentation» tiene **25** productos (los conté), mWIN no está, y la lista
  empieza con «The documents below pertain to Midas Software GmbH as the legal
  issuer of the applicable mTOKENs».

### Oferta abierta hoy

Leído en Ethereum por el nodo público https://ethereum-rpc.publicnode.com, con
`eth_call` de solo lectura. Bloque 26458942, de las 21:18:11Z; consulta a las
21:18:18Z. Los selectores los calculé con keccak-256, y los conocidos coinciden
(`paused` 0x5c975abb, `latestRoundData` 0xfeaf968c).

- Token `0x4E72…B67A`: name «Midas Wellington Income Opportunities», symbol
  «mWIN», `paused` 0 y `totalSupply` 32,4805 mWIN (el analista leyó lo mismo).
- Bóveda de suscripción `0xF7F1…7db4`: `paused` 0 y `greenlistEnabled` **1**.
- Oráculo `0x1725…9517`, «mWIN/USD»: ronda 93 = 131.827,97219477 USD,
  `updatedAt` 2026-11-20T10:27:59Z.

Conclusión: el producto funciona, pero solo para carteras de la lista blanca.
**No hay oferta abierta al público.**

### Acceso desde España como particular: no

- CNMV, pasaportes (HTTP 200; mismos SHA-256 que el analista):
  - https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=391200M2JHLV9OZAZN78
    (21:18:52Z) → «No se han encontrado datos disponibles».
  - Por el nombre «Aureum» (21:18:53Z) → lo mismo.
  - Control con el LEI de Midas Software GmbH (21:18:54Z) → BPWO-84, BPWO-63 y
    BPWO-45. La búsqueda funciona.
- Lista blanca:
  - Ethereum: las dos bóvedas de mWIN tienen `greenlistEnabled` = 1 (21:18:18Z).
  - Avalanche (https://avalanche-c-chain-rpc.publicnode.com, bloque 100915219,
    21:18:37Z): las dos bóvedas también tienen `greenlistEnabled` = 1.
  - Contraste: la bóveda de suscripción de mTBILL `0x9936…6683` tiene
    `greenlistEnabled` 0. He comprobado que esa dirección es la «Issuance vault»
    de la sección «mTBILL Smart Contracts» de la documentación de Midas.
- Documentación de Midas (copia de las 16:55Z, SHA-256 `3003298138b5…8c76`; he
  comprobado que coincide). Literal: «certain strategies operate on a restricted
  basis. This is typically the case when an underlying strategy is legally
  limited to professional investors. … Only wallets that have been explicitly
  whitelisted by our team are authorised to interact with the smart contracts
  for these restricted tokens.»
- Hoy docs.midas.app me dio 403 de Cloudflare (21:17:37Z, cuerpo «{}»). La
  copia de las 16:55Z es una ruta legítima: se leyó cuando respondía a una
  petición normal.

### Mínimo

No figura en ningún documento. En la bóveda de suscripción,
`minMTokenAmountForFirstDeposit` = 1e18, es decir, 1 mWIN, unos 131.828 USD
con el oráculo de las 10:27:59Z. El analista hace bien en dejarlo fuera de la
tarjeta.

### Salida

No hay ningún documento público. La bóveda de reembolso `0x6057…7924` tiene
`paused` 0, `greenlistEnabled` 1, `instantFee` 50 (0,50 %),
`instantDailyLimit` 4 mWIN (unos 527.312 USD) y `minAmount` 7,6923e-6 mWIN.
Coincide con el expediente. Leo `instantFee` en puntos básicos, como en mTBILL,
donde 7 equivale al 0,07 % de su KID.

### Riesgos y documentos

- No hay folleto, condiciones finales ni KID de mWIN en la ESMA ni en la CNMV, y
  mWIN no está entre los 25 productos de la documentación legal de Midas.
- En la documentación de Midas, mWIN solo aparece en el registro de contratos
  inteligentes (5 menciones).
- Solo hay riesgos genéricos de la plataforma. No hay KID en español.

### Advertencias de la CNMV (tipo No autorizadas, HTTP 200)

- «Midas» (21:18:56Z), «Midas Software», «Aureum» y «mWIN» (hasta 21:19:02Z):
  «No hay datos disponibles».
- «Wellington» (21:19:00Z): «WELLINGTON MANAGEMENT EUROPE (CLON) … NO GUARDA
  RELACIÓN CON WELLINGTON MANAGEMENT EUROPE GMBH, DEBIDAMENTE REGISTRADA EN LA
  CNMV CON EL NÚMERO 4799 …», y las webs WELLINGTON-INVESTMENTS.COM y
  WELLINGTONINV.COM. Son clones ajenos, como dice el analista.

**Intenté tumbar cada pieza y ninguna cae.** El motivo del analista es correcto
en sus tres partes: no hay acceso como particular, no hay documentos, y el
mínimo y la salida no están documentados.

---

## 2. Enlaces

He probado las 17 URL del expediente con GET normal, siguiendo redirecciones,
entre las 21:20:52Z y las 21:21:06Z. El registro está en
`crudo/revision-midas-mwin/enlaces.log`.

| # | URL | Código final · tamaño | Valoración |
|---|---|---|---|
| 1 | https://api.gleif.org/api/v1/lei-records/391200M2JHLV9OZAZN78 | 200 · 2.480 B | Bien (tarjeta) |
| 2 | https://api.gleif.org/api/v1/lei-records?filter%5Bentity.legalName%5D=Aureum&page%5Bsize%5D=50 | 200 · 53.338 B | Bien |
| 3 | https://api.openfigi.com/v3/mapping | 405 · 20 B | Solo admite peticiones POST: no es un enlace para un visitante y no está en la tarjeta. Nota, no fallo |
| 4 | https://docs.midas.app/llms-full.txt | 403 · 2 B (Cloudflare) | Antirrobots. Leído por una ruta legítima (copia de las 16:55Z con el mismo SHA-256). No es fallo |
| 5 | https://ethereum-rpc.publicnode.com | 200 · 959.676 B | Bien. Es el punto de acceso del nodo, no una página |
| 6 | ESMA `party_name:*391200M2JHLV9OZAZN78*` | 200 · 230 B | Bien (tarjeta). Un visitante ve JSON en bruto con `numFound 0` |
| 7 | ESMA `party_name:*984500BB00BN6D2B7C48*` | 200 · 57.761 B | Bien |
| 8 | ESMA `party_name:*Aureum*` | 200 · 258 B | Bien |
| 9 | ESMA `party_name:*Midas*` | 200 · 59.874 B | Bien |
| 10 | https://thedefiant.io/news/press-releases/introducing-mwin-midas-brings-institutional-credit-strategies-onchain-with-wellington-management | 403 · 5.663 B («Attention Required! \| Cloudflare») | Antirrobots. Fuente secundaria que no se usa como dato. No es fallo, pero de ella salen el título y el resumen propuestos (cambio 1) |
| 11 | CNMV pasaportes, LEI de Aureum | 200 · 212.848 B | Bien (tarjeta). También carga sin cabecera de idioma (21:21:17Z) |
| 12 | CNMV pasaportes, LEI de Midas | 200 · 216.411 B | Bien |
| 13 | CNMV pasaportes, nombre «Aureum» | 200 · 212.570 B | Bien |
| 14–17 | CNMV advertencias: Aureum, Midas, Midas Software, Wellington | 200 · 211–218 kB | Bien. También carga sin cabecera (21:21:20Z) |

Las tres fuentes de `propuestaTarjeta.fuentesActuales` (filas 1, 6 y 11) cargan
para un visitante. **No hay enlaces rotos.** Los dos 403 son de antirrobots y
están anotados en el expediente. `propuestaTarjeta.url` es `null`, lo que es
coherente porque no se propone tarjeta.

---

## 3. Presentación de la tarjeta y de la ficha

Construí una oferta de prueba con la forma de las de
`2026-11-13-v2/escaparate-publicacion.json`. Le puse
`coleccion: principales`, `estadoRevision: actual`, `disponibleEs: false`,
`verificadaEl: 2026-11-20` y `vigenciaDias: 7`, más
`documentacion.referencias` con la etiqueta fija «Acceso desde España» y el
texto de `resumenTarjeta`. Mínimo y salida van en `null`, así que no llevan
referencia. Después ejecuté `resumenOferta` de
`rwadar-site/assets/ficha-editorial-20261022.js` con la fecha del
20/11/2026 a las 21:30Z. El script está en `crudo/revision-midas-mwin/prueba-tarjeta.cjs`.

**Tal como viene en el expediente:**

- `minimo`: «No documentado en euros».
- `accesoEspana`: «Sin comprobar si se puede contratar desde España», con
  estado `sin_comprobar`.
- `salida`: «Salida no documentada».
- `estado`: «Datos con fuente y fecha · consulta las condiciones».

Lo que se vería, tal cual:

- **Tarjeta de la lista:** «mWIN de Midas: crédito gestionado por Wellington»
  (48 caracteres) · Midas · «Mínimo No verificado · España No», y en rojo «No
  disponible en España». La tarjeta dice «No» porque `disponibleEs` es `false`.
- **Ficha, «Lo esencial»:** Mínimo «No verificado» · España **«Sin
  confirmar»** · Salida «Sin documentar».

**El problema:** la tarjeta dice «No» y la ficha «Sin confirmar». Pasa porque
el texto «No: sin folleto…» no casa con lo que busca `resumenOferta`
(`no disponible|no admit|no permit|excluid`, o exactamente «no»).

**Con el texto del cambio 2** («No disponible desde España: …»), la ficha dice
«No, según la fuente», con su fuente de la CNMV y la fecha 20/11/2026, y la
tarjeta no cambia.

Comprobación de las normas de las tarjetas:

- Castellano llano: sí.
- `accesoEspana` cabe en 120 caracteres: 85 ahora, 102 con el cambio.
- El mínimo no lleva «por token/participación/acción», porque es `null`.
- Sin rentabilidad ni promesas.
- Sin fechas DD/MM en la tarjeta.

El título tiene un problema aparte: atribuye la gestión a Wellington con una
fuente secundaria (cambio 1).

Como la decisión es `no_admitir`, nada de esto se publicará. Los cambios dejan
el expediente coherente por si se vuelve a mirar.

---

## 4. Calidad de la oferta para un particular en España

**Mala para el lector, aunque fuera legal.** No se debe admitir.

- **Costes:**
  - Entrada: 0 en la bóveda (`instantFee` 0).
  - Reembolso inmediato: 0,50 %. Es 7 veces lo de mTBILL (0,07 %).
  - Gestión y éxito: no publicados. No hay KID que diga el coste total.
  - Además, riesgo de cambio euro/dólar (el producto está en USD).
- **Liquidez real:**
  - El reembolso es solo para la lista blanca, con un límite de 4 mWIN al día
    (unos 527.000 USD) para todos los tenedores juntos.
  - En USDC solo hay 0,10 USDC en el contrato «Redemption Vault swapper internal
    liquidity» `0x14fE…9fca`, y 0 en la bóveda de reembolso (bloque 26458961,
    21:22:09Z). Puede que pague en otro activo, pero no está documentado.
  - No hay mercado secundario documentado. Con 32 tokens en circulación no cabe
    esperar compradores.
- **Solidez y supervisión:**
  - Es un vehículo «huérfano» de Luxemburgo (así lo describe Midas: «orphan
    vehicle, owned through a charitable trust»). Se creó el 24/11/2025 y tiene
    LEI desde el 16/01/2026.
  - No hay folleto en la ESMA ni pasaporte en la CNMV, y no se pudo comprobar
    la CSSF.
  - El custodio no consta en ninguna fuente primaria. Solo lo nombra la nota de
    lanzamiento, que hoy está bloqueada.
- **Tamaño y antigüedad:**
  - En Ethereum hay 32,48 mWIN, unos **4,28 M USD**. El 01/11 eran 66,46 mWIN
    (unos 8,76 M USD): la mitad ha salido en 19 días. En Avalanche solo hay
    0,00004 mWIN.
  - El oráculo vale alrededor de 1 USD de junio a julio de 2026 (rondas 1 a 10,
    que parecen de pruebas) y 130.433,45 USD el 10/08/2026 (ronda 20). Es un
    producto de algo más de 3 meses.
- **Riesgos concentrados:**
  - Una sola estrategia de crédito cuyos términos no se conocen.
  - Un ticket técnico de unos 131.828 USD por token.
  - Su valor también baja: 131.841,42 USD el 03/11 y 131.779,38 USD el 17/11.
  - Entre el 10/08 y el 20/11 subió un 1,07 % en USD (calculado por mí con el
    oráculo; dato pasado, solo como contexto). Es un orden parecido al de
    mTBILL, que es deuda pública a corto plazo, pero con más riesgo y sin
    documentos.
- **Transparencia:** nula para el público. Los términos estaban el 01/11 solo
  en DocSend, tras formulario. No hay KID ni folleto, y mWIN no aparece en la
  documentación legal de Midas.
- **Señales de alarma:**
  - No he podido ver promesas ni presión comercial, porque midas.app da 403.
  - No hay advertencias ni sanciones de la CNMV sobre Midas, Aureum ni mWIN.
  - Las advertencias de «Wellington» son de clones ajenos.
  - La estructura es opaca para un particular.
- **Comparación con lo publicado del mismo tipo:** mTBILL (Midas, publicado)
  tiene folleto aprobado por la FMA y notificado a España, KID en español, ningún
  mínimo y reembolso cualquier día hábil al 0,07 %. Spiko (letras del Tesoro)
  también está documentado para España. mWIN no tiene nada de eso.

**Conclusión:** comparto `no_admitir`. Hay que volver a mirarla solo si aparece
un folleto del vehículo en la ESMA con España entre los países, o un KID de mWIN.

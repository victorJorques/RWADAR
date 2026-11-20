# Revisión independiente · candidata Franklin OnChain Euro Liquidity Fund · 20/11/2026

Revisé la candidata entre las 21:14 y las 21:22 UTC. No hice el análisis. Abrí
yo mismo las fuentes primarias, con peticiones normales (curl sin cambiar el
agente, TLS verificado y, en la CNMV, `accept-language: es`). Mis copias:

- Texto (en Git): `grupos/busqueda-nueva/fuentes/revision-franklin-euro/revision-independiente-franklin-euro-20.txt`
- Crudos (fuera de Git): `grupos/busqueda-nueva/fuentes/crudo/revision-franklin-euro/`

**Resultado: rechazado, es decir, confirmo el «no admitir» del analista.** Lo
esencial falla hoy. Un particular en España no tiene por dónde comprarlo y no
hay KID. Además, aunque se abriera, sería peor que lo que ya publicamos del
mismo tipo: entrada de hasta el 1,5 % y más gastos corrientes. Los 14 enlaces
del expediente funcionan. La tarjeta no se propone, y está bien que no se
proponga. El expediente necesita 4 retoques menores, que no cambian la
decisión (ver «Correcciones al expediente»).

## 1. Lo esencial (consultas propias de hoy)

### Entidad y registro: se sostiene

- **ESMA** (registro de comercialización transfronteriza), 21:14:29 UTC:
  <https://registers.esma.europa.eu/solr/esma_registers_funds_cbdif/select?q=funds_national_name:*ONCHAIN*&wt=json&rows=50>.
  Literal: `FRANKLIN TEMPLETON ONCHAIN FUNDS-FRANKLIN ONCHAIN EURO LIQUIDITY FUND`,
  `funds_lei 254900SUVJD9ISB77M29`, `UCITS`, `Commission de Surveillance du
  Secteur Financier (CSSF)`, `Active`, `funds_created_date 2026-11-09`,
  `funds_host_country_codes ['ES','DE','FR','PT','AT','IT','NL']` y las 7
  notificaciones del 09/11/2026. Coincide con el analista.
- **Hijos del registro** (`q=_root_:2842616`, 21:18:45 UTC): hay un aviso por
  país. El de SPAIN dice `funds_fund_mrkt_status_code_name: "Not Available"`.
  He comprobado que el fondo en dólares, que sí se comercializa, da lo mismo en
  sus 9 países. Ese campo no está relleno y no prueba nada.
- **CNMV**, con <https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0363289J&vista=0>
  a las 21:15:13 UTC: «FRANKLIN TEMPLETON ONCHAIN FUNDS · 2284 · 13/12/2024 ·
  SICAV · LUXEMBURGO», «IIC Sujeto a la directiva 2009/65/CE». Con `&vista=18`
  (21:15:15 UTC), la única comercializadora es «FRANKLIN TEMPLETON INTERNATIONAL
  SERVICES, S.À.R.L., SUCURSAL EN ESPAÑA». Los SHA-256 son los mismos que los
  del analista.
- **Folleto**, p. 20: «qualifies as a short-term LVNAV MMF. The Fund has been
  duly authorised by the CSSF». Depositario: The Bank of New York Mellon SA/NV,
  Luxembourg Branch (p. 75).

### Oferta abierta hoy: no se puede comprobar, y por tanto no cumple

- Folleto, p. 37: «Some Share Classes may not yet be available at the launch
  date of the Fund(s). The list of all Share Classes available for the relevant
  Fund can be found on the website www.franklintempleton.lu.»
- Mapa de productos de franklintempleton.lu (21:16:12 UTC,
  <https://www.franklintempleton.lu/binaries/content/assets/global/sitemaps/google/en-lu_product.xml>):
  de OnChain solo aparecen `LU3258450587` y `LU2900381208`, las dos en dólares.
  En .com.es (21:16:11 UTC), solo `41372/PX1` y `41372/QY2`. La ficha
  «54201 franklin-euro-liquidity-fund» es otro fondo, que no es OnChain.
- Una búsqueda web del nombre exacto «Franklin OnChain Euro Liquidity Fund» no
  da ni ficha, ni ISIN, ni valor liquidativo, ni nota de lanzamiento.
- No consta que el subfondo en euros esté suscribiendo. Estoy de acuerdo.

### Acceso desde España como particular: no cumple (confirmado)

- Folleto, p. 39 (21:14:27 UTC, mismo SHA-256 `ec0458b6…`): «As at the date of
  this Prospectus, the App may not yet be available to retail Investors. When
  the App will be available to retail Investors, the Prospectus will be updated
  accordingly.»
- Folleto, **p. 40** (no p. 39): «Retail accounts must be opened via the App.»
- App Store, API pública, 21:15:53–54 UTC:
  `https://itunes.apple.com/lookup?id=1551677725&country=XX`. En es, lu, de, fr,
  it, nl y pt devuelve `{"resultCount":0}`. En us sale «Benji Investments», del
  vendedor «Franklin Advisers, Inc», versión 3.1.0. La descripción dice:
  «Benji is offered and operated by Franklin Distributors, LLC».
- La página que vería un visitante, <https://apps.apple.com/es/app/id1551677725>,
  da **404** (21:18:23 UTC). Lo mismo /lu y /de. La de /us da 200.
- Google Play (página web sin sesión, gl=ES y gl=US, 21:16:06 UTC) da 200 en los
  dos casos. No dice en qué países se puede instalar, así que no prueba nada.
  Coincide con el bloqueo que anotó el analista.
- La web de Benji (<https://digitalassets.franklintempleton.com/benji/>,
  21:18:34 UTC) solo habla del fondo estadounidense FOBXX.

### Mínimo: correcto en el papel, pero sin uso

- Folleto, p. 39, tabla EUR: «Class AB · Minimum Investment EUR 20 · Subsequent
  Investment EUR 1 · Minimum holding amount EUR 20». La p. 38 aclara que son las
  clases «offered on Stellar». Sin canal abierto no sirve de nada.

### Salida: correcta en el papel, pero sin uso

- Folleto, p. 41: «Shares can be redeemed through the App or Institutional Web
  Portal». Si un día los reembolsos pasan del 10 %, pueden aplazarse «for a
  period not exceeding ten (10) Luxembourg Business Days». El corte del
  subfondo en euros es a las «1:00 P.M. UK Time» (p. 40). El dinero llega por
  transferencia SWIFT (**p. 42**, no p. 41).

### Riesgos y documentos: correctos; falta el KID

- Folleto, p. 21: «Shares in Money Market Funds are not deposits ... and are not
  insured or guaranteed by any other agency or regulatory body. The value of
  Shares held in a Money Market Fund may fluctuate.» La lista de riesgos
  coincide con la del analista.
- **KID del subfondo en euros:** no está en los mapas de producto de .com.es ni
  de .lu, ni en la búsqueda web. Probé otras dos rutas que el analista no miró:
  - <https://www.ftidocuments.com/>, la web de documentos que cita la ficha del
    fondo hermano: es una aplicación de JavaScript y su `sitemap.xml` solo lista
    la portada (21:19:17 UTC).
  - <https://www.eifs.lu/franklintempleton>, el servicio de facilidades para
    inversores de la UE: pide país, idioma y tipo de inversor. A la segunda
    petición (21:19:36 UTC) devolvió una página antirrobots («302 Found ·
    rdwr»). **No la intenté saltar.** Queda sin consultar.
- Comparación: el fondo hermano en dólares sí tiene KID en español
  (<https://www.franklintempleton.com.es/download/es-es/key-information-document/4c549e34-cafe-470f-a8eb-a0dcd04a9f72/PRIIPSEU_LU3258450587_es_ES.pdf>,
  200 a las 21:20:01 UTC, «Fecha de producción del KID: 15/06/2026»). La falta
  del KID del subfondo en euros es real, no un fallo de búsqueda en la web
  española.

### Advertencias de la CNMV: ninguna (confirmado)

Todas en <https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…>:

| Búsqueda | Hora UTC | Resultado |
|---|---|---|
| «Franklin Templeton» | 21:15:30 | «No hay datos disponibles» |
| «Franklin» | 21:15:32 | Una sola fila ajena: «04/05/2009 MORGAN FRANKLIN CONSULTANTS, S.L.» |
| «Benji» | 21:15:34 | «No hay datos disponibles» |
| «OnChain» | 21:15:35 | «No hay datos disponibles» |
| «Western Asset» | 21:15:37 | «No hay datos disponibles» (la añadí yo: es el gestor de inversiones) |

## 2. Enlaces

Probé las 14 URL del expediente y de la propuesta de tarjeta entre las
21:17:56 y las 21:18:15 UTC. Para cada una hice HEAD con `-L` y GET normal.
**Todas terminan en 200. Ninguna falla.**

| URL | Final | Bytes | Nota |
|---|---|---|---|
| itunes lookup `country=es` | 200 | 42 | `resultCount 0` (la prueba de que no está) |
| itunes lookup `country=lu` | 200 | 42 | `resultCount 0` |
| itunes lookup `country=us` | 200 | 7215 | La app en EE. UU. |
| ESMA cbdif `*ONCHAIN*` | 200 | 5493 | JSON |
| <https://www.benjiinvestments.com/> | 200 | 47337 | 2 redirecciones a digitalassets.franklintempleton.com |
| CNMV advertencias «Benji» | 200 | 211326 | |
| CNMV advertencias «Franklin» | 200 | 214415 | |
| CNMV advertencias «Franklin Templeton» | 200 | 211612 | |
| CNMV advertencias «OnChain» | 200 | 211370 | |
| CNMV iicextranjera vista=0 | 200 | 151327 | |
| CNMV iicextranjera vista=18 | 200 | 151630 | |
| Mapa de productos .com.es | 200 | 169391 | XML |
| **Folleto (url de la tarjeta)** | 200 | 1288473 | PDF, mismo SHA-256 |
| Mapa de productos .lu | 200 | 271442 | XML |

Notas:

- Las de itunes, ESMA y los mapas XML cargan, pero son datos en bruto, no
  páginas para el lector. Valen como prueba en el expediente, no como enlace de
  una ficha.
- Para enseñar al lector que la app no está en España, el enlace que se
  entiende es <https://apps.apple.com/es/app/id1551677725>, que da 404.
- La `url` de la tarjeta es un PDF de 83 páginas en inglés. Funciona, pero no
  es un buen destino para «Ver fuente».
- Fuera del expediente, la SEC devolvió 403 a curl a las 21:21:48 UTC: exige
  declarar un agente con datos de contacto. No se falseó nada y la leí con la
  herramienta de lectura web. No es un enlace del expediente.

## 3. Presentación de la tarjeta y la ficha

Monté una oferta de prueba con la forma de las de
`2026-11-13-v2/escaparate-publicacion.json`. Mismas claves, más
`documentacion`, que es lo que lee `resumenOferta`. Le metí la
`propuestaTarjeta` del expediente:

- `coleccion` null, es decir, principal;
- `disponibleEs` null («no_confirmado»);
- una sola referencia: «Mínimo de inversión» = `resumenTarjeta.minimo`, con el
  folleto como fuente, consulta el 20/11/2026 y dato del 01/09/2026.

Ejecuté `resumenOferta` de `rwadar-site/assets/ficha-editorial-20261022.js` con
fecha 20/11/2026. El guion se puede volver a ejecutar:
`node rwadar-app/data/verificaciones/2026-11-20-v2/grupos/busqueda-nueva/fuentes/revision-franklin-euro/tarjeta-prueba-franklin-euro.cjs`.
También
apliqué las funciones de la tarjeta web (`textoBreveDatoTarjetaLocal`,
`textoCortoLocal` y `estadoVigenciaLocal` de `rwadar-20260820.js`; la app usa
las mismas en `rwadar-movil/lib/transparencia.js`).

**Tal cual la deja el expediente** (`estadoRevision` «no_verificable»):

- **Lista (web y app):** «Fondo monetario en euros tokenizado de Franklin
  Templeton», luego **«Mínimo No verificado · España Sin confirmar»** y la
  línea de problema «apertura no confirmada».
- **Ficha, «Lo esencial»:** «Sin mínimo vigente en euros» · «Sin comprobar si se
  puede contratar desde España» · «Salida no documentada» · «Costes no
  documentados». Estado: «No se pudo confirmar la apertura» (aviso).

**Si alguien la publicara como «actual»** (prueba hipotética), la lista diría
**«Mínimo 20 € en la clase AB según el folleto… · España Sin confirmar»**. El
recorte a 40 caracteres se come justo la parte que importa: «pero hoy no hay
canal para usarlo». Engañaría.

Normas de las tarjetas:

- **Castellano llano:** sí. Las citas en inglés se quedan en el expediente.
- **Longitud:** sí. El título tiene 57 caracteres y cabe en dos líneas. El
  `resumen` tiene 153, pero no va en la tarjeta. `resumenTarjeta.minimo` tiene
  71, por debajo de 120.
- **Sin «por participación/token/acción» en el mínimo:** sí.
- **Sin rentabilidad, sin promesas y sin «garantiz…» ni «oportunidad»:** sí
  (`rentabilidad` null).
- **Fechas:** «09/11/2026» va como DD/MM/AAAA. Correcto.

**Qué se vería: nada, y es lo correcto.** El expediente no propone tarjeta. Si
algún día se admite, el mínimo tiene que ir solo, «20 €» (la clase va en el
alcance), y el acceso con una referencia propia «Acceso desde España». Si no,
la tarjeta enseña un mínimo cortado que da a entender que se puede invertir.

## 4. Calidad de la oferta para un particular en España

**No es aceptable hoy. Tampoco lo sería en cuanto se abriera, si sigue con
estas condiciones.**

**Costes** (folleto, máximos; sin KID no hay coste total):

- Entrada de hasta el 1,5 % en la clase AB (p. 38). Se puede rebajar («may be
  waived»), pero no hay nada publicado que diga cuánto.
- Gestión de hasta el 0,20 % (p. 75).
- **Administración de hasta el 0,20 % más «an additional amount (consisting of a
  fixed and variable component) per Investor Holding»** (p. 44 y p. 75). El
  analista no lo recoge.
- Depositario del 0,006 % al 0,0135 % (p. 75).
- Sin comisión de salida.

En total, hasta un 0,40 % al año o algo más, y un 1,5 % al entrar. Con la cifra
que publicamos de Spiko Letras del Tesoro Euro (2,45 % el 20/11), esa entrada se
come unos 7 meses de intereses.

**La prueba del fondo hermano.** El KID en español del fondo en dólares, con la
misma clase AB y las mismas comisiones de entrada y gestión, dice: «su
rentabilidad media anual se proyecta en un 1,6% antes de costes y en un -0,1%
después de costes» si se sale al cabo de 1 año. Sus costes totales son de
«170 USD» por cada 10.000 (consultado a las 21:20:01 UTC).

**Liquidez real.**

- Reembolso diario, pero solo por la app, que en España no existe.
- Se puede aplazar hasta 10 días hábiles si los reembolsos pasan del 10 %.
- No hay mercado secundario conocido para la clase en euros.

**Solidez y supervisión.** Es lo único fuerte:

- Gestora FTIS, supervisada por la CSSF.
- Depositario BNY Mellon SA/NV en Luxemburgo.
- UCITS y fondo monetario LVNAV con las reglas del reglamento europeo de fondos
  monetarios.
- Señal a vigilar, no bloqueante: el subasesor de inversiones que nombra el
  folleto (p. 21), Western Asset Management Company, LLC, aceptó en junio de
  2026 una multa civil de 100 millones de dólares de la SEC
  (<https://www.sec.gov/enforcement-litigation/litigation-releases/lr-26666>,
  «Litigation Release No. 26666 / October 6, 2026», leída hacia las 21:21:55
  UTC). El caso era por cómo se repartían operaciones entre carteras de clientes
  en EE. UU. y no afecta a este fondo.

**Tamaño y antigüedad.**

- El subfondo en euros figura en la ESMA desde el 09/11/2026 (11 días). No
  tiene ni patrimonio ni valor liquidativo publicados.
- El fondo hermano en dólares se lanzó el 12/02/2025. Tenía «$52,81 Millón» el
  31/10/2026 (ficha en español, 21:19:01 UTC). Es una gama pequeña.

**Transparencia.**

- Solo hay un folleto en inglés.
- No hay KID, ni ISIN, ni ficha del subfondo en euros.
- Sin KID no hay indicador de riesgo, ni escenarios, ni coste total.

**Señales de alarma.** No hay promesas, ni presión comercial, ni advertencias
de la CNMV. Sí hay una contradicción: el folleto ofrece la clase AB a
minoristas pero dice que la app puede no estar disponible para ellos.

**Comparación con lo publicado del mismo tipo.** Spiko Letras del Tesoro Euro
(principal, `escaparate-publicacion.json` del 20/11):

- KID en español, gastos corrientes del 0,25 %, entrada y salida del 0 %;
- mínimo de 1 €, riesgo 1 de 7, reembolso diario;
- comercialización en España con Aldana Capital.

Franklin pierde en todo lo que le importa al lector: acceso, documentos,
entrada y gastos. Es una oferta legal sobre el papel, pero hoy no la puede
comprar un particular, y con estas comisiones sería mala para él.

## Correcciones al expediente (menores; no cambian la decisión)

1. **Página de la cita del canal.** `claims[campo=canalCompra].localizador` y
   `motivoDecision` atribuyen «Retail accounts must be opened via the App» a la
   p. 39. Está en la **p. 40**. La frase «the App may not yet be available to
   retail Investors» sí está en la p. 39.
2. **Página de la salida.** `claims[campo=salida]`: el pago por SWIFT está en la
   **p. 42**. El límite del 10 % y los 10 días sí están en la p. 41.
3. **Comisiones incompletas.** En `claims[campo=comisiones]`, añadir la
   comisión de administración: «up to 0.20% of the Net Asset Value of the
   relevant Share Class, an additional amount (consisting of a fixed and
   variable component) per Investor Holding» (p. 44 y p. 75). Añadir también el
   depositario, del 0,006 % al 0,0135 % (p. 75).
4. **Bloqueos.** Añadir dos:
   - eifs.lu/franklintempleton (facilidades para inversores de la UE) devolvió
     una página antirrobots a las 21:19:36 UTC y no se intentó saltar;
   - ftidocuments.com no tiene listado público (su sitemap solo lista la
     portada).

   Si se reconsidera la candidata en otro ciclo, `resumenTarjeta.minimo` debe
   ser «20 €» a secas. Con la frase entera, la tarjeta la corta y oculta que no
   hay canal.

Cuándo volver a mirarla, igual que dice el analista:

- cuando cambie el SHA-256 del folleto;
- cuando aparezca un KID o un ISIN del subfondo en euros en franklintempleton.lu
  o .com.es;
- cuando `https://itunes.apple.com/lookup?id=1551677725&country=es` dé
  `resultCount` 1.

Aun así, con la entrada del 1,5 % y sin rebaja publicada, seguiría sin ser
mejor que lo que ya publicamos.

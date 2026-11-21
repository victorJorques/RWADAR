# Decisiones del coordinador · entrega 2026-11-21

Claude, 21/11/2026. Puesta al día pedida por Víctor a las 17:34 UTC, al ver
en la app la tarjeta de Próximas de Hausera («Desde 100 € en Alicante 3
(20/11)»): «Y esta ya ha pasado por ejemplo es antigua, y no sé si ya se puede
seguir invirtiendo todos esos errores los tienes que corregir que el lunes
tenemos una reunión muy importante».

**Base:** la publicada `94f7fd5d-f6e5-c28e-1c31-a6ea5a5f38d7` (entrega
`2026-11-20.2`), leída como visitante a las 17:36 UTC (`lectura-publica/`).
Sus cifras son del 20/11 y caducan el 28/11 a las 00:00 UTC.

**Fuentes de estas decisiones:** `vigia.json` (17:37 UTC), `expedientes/`,
`grupos/*/resumen-*.md` y `revision-independiente/` (seis grupos: spiko,
acciones-oro-tesoro, suiza, brickwise-a, brickwise-b y vigilancia). En cada
grupo revisó un agente distinto del que investigó. Solo entra lo `confirmado`
o lo `confirmado_con_cambios`, con las correcciones obligatorias del revisor.
Lo `rechazado` no entra. Cerrado a las 18:55 UTC.

## 1. Lo general

- **Etiqueta `2026-11-21`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1). **Ni altas ni retiradas**: entrega con el motor.
  - `verificadaEl = 2026-11-21` y `vigenciaDias = 7`: el último día vigente
    es el **28/11/2026**.
- **Decisión de Víctor sobre Brickwise (21/11, 18:3x UTC, pregunta directa):**
  las fichas de reventa de Brickwise **se quedan**, con un aviso claro del
  número fiscal austriaco. Las propuestas `retirar_propuesta` de los grupos
  brickwise-a y brickwise-b pasan a `actualizar` (ver §2).
- **Lo que pide Víctor en todas las fichas:** que no quede nada viejo. Entra
  la limpieza de referencias con fechas viejas que proponen los grupos
  (cruces, capitalizaciones o libros de octubre y del 01/11, consultas del
  01/11 y del 05/11 que hoy no se pueden releer), con las correcciones de los
  revisores. Lo que se re-fecha al 21/11 lleva su consulta de hoy (o la del
  vigía, con `segunVigia`).
- **Fechas que se leen como fechas de la oferta:** en Próximas, la tarjeta
  pone la fecha del evento, no la de la consulta (Hausera, §2). En reventa se
  mantiene el formato de las Normas, «Desde X € la participación en reventa
  (DD/MM)» → corto «Desde X € la participación (21/11)»: es el precio de ese
  día.
- **Radar:** `verificadoEl = 2026-11-21`, 69 de 69
  (`radar-contraste-2026-11-21.json`, capturas de las 17:42 UTC). La ficha de
  pasaportes de Spiko en REGAFI se leyó por la API pública del mismo registro
  a las 18:5x UTC, con la misma huella que el 13/11 y el 20/11
  (`cambios-radar.json`, `radar-manual/`). No cambia ninguna dirección ni
  ningún texto del radar.
- **Rutas legítimas:** `comprobar-rutas.mjs` a las 17:39 UTC (FSMA de
  Crypto.com con versión nueva, Midas docs abierta; Midas web sigue con 403).
- **Noticias:** ya publicadas hoy (`actualizadoEl` 2026-11-21, segunda edición
  de las 17:00 UTC con xStocks, editor y verificador independientes,
  `rwadar-app/data/noticias-diarias/2026-11-21/`): no se rehacen. Entran en la
  auditoría completa (§6) como el 20/11.
- **Tokenización:** «Tokenización diaria» en `datos-tokenizacion`; nada del
  ciclo.

## 2. Por oferta (antes → ahora)

Regla para todas: entra la propuesta del expediente de hoy
(`expedientes/<slug>.json`: `propuestaTarjeta`, documentación, métricas,
avisos y referencias) **con las correcciones de `revision-independiente/<grupo>.md`**.
Además:

### Spiko (`revision-independiente/spiko.md`)

- **Letras del Tesoro Euro:** la rentabilidad no cambia (2,45 %, VL del 20/11,
  1,063496 €; recalculado hoy 2,452 %). El «cambia» del vigía era una falsa
  alarma. **Corrección del revisor:** «Acceso desde España» pasa a
  «Disponible para residentes en España tras el alta y la verificación de
  identidad; la SICAV está inscrita en la CNMV».
- **Letras del Tesoro Dólar:** 4,00 % en USD (VL del 20/11, 1,103573 $). Pasa
  a `actualizar` solo para aplicar el mismo texto de acceso que Euro.
- **Smart Cash Euro:** 2,84 % (VL del 20/11). La AMF sigue sin publicar la
  ficha del fondo: se mantiene el aviso de acceso, con la consulta de hoy.

### Acciones, oro y letras (`revision-independiente/acciones-oro-tesoro.md`)

- **Kraken xStocks:** se re-fecha al 21/11. **Rechazado por el revisor, no
  entra:** cambiar título y resumen («más de 200 empresas de Reino Unido y la
  UE»), la métrica «Salida», el aviso nuevo de horario y la salida de «Lo
  esencial». Se quedan los publicados, re-fechados con eu.kraken.com (18:05
  UTC). Sí entra el aviso de dividendos sin «en EE. UU.» y el hecho de que
  ninguna de las condiciones finales desde el 15/10 incluye España.
- **mTBILL:** sin cambios de cifras (ronda 498 del 20/11: 1,0789 USD; 3,46 % a
  5 semanas; no hay ronda el sábado). Las Condiciones Finales son el mismo
  archivo (b1e58001…). **Correcciones del revisor:** quitar las referencias
  «Acceso desde España · consulta 01/11/2026» y «Países de oferta según la
  web de Midas · consulta 05/11/2026», y añadir a `avisosConFecha` 0, 1 y 6 la
  huella del vigía.
- **Robinhood:** sin cambios; se re-fecha al 21/11.
- **Prosegur Digital Gold:** sin cambios en la tarjeta. **Corrección del
  revisor:** re-fechar con lo leído hoy (contrato del 08/07/2026; web y app a
  las 18:11 UTC) o quitar las referencias del 23/10, el 01/11 y el 02/11.

### Suiza (`revision-independiente/suiza.md`)

- **Aktionariat:** aviso de precios nuevo, con la **corrección del revisor**:
  «Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el
  21/11/2026 la venta más barata era de 6,20 ZCHF y ese día se vendieron 62
  acciones a 5,00 ZCHF.» Fuera las referencias viejas; entran «Última compra
  al emisor · 21/11/2026: 7,25 ZCHF (1 acción, 31/10/2026)», «Última operación
  entre accionistas · 21/11/2026: 5,00 ZCHF (62 acciones, 21/11/2026)» y
  «Salida · 21/11/2026: mejor compra 5,01 ZCHF (5 acciones); 78 pedidas».
- **BOSS Info y Switzerlend:** fuera las referencias viejas y lo demás como lo
  propone el expediente, con las correcciones del revisor.

### Brickwise (`revision-independiente/brickwise-a.md` y `brickwise-b.md`)

- **Las 8 que piden número fiscal austriaco** (Plüddemanngasse 101,
  Sonnleithnergasse 2, Local de estanco Klagenfurt, Stallhofstraße 28,
  Schwarzer Weg 18, Drautalresidenz, Randhartingergasse 9 y Hinterstoder 50):
  **se quedan** (decisión de Víctor). Llevan un aviso con el literal de la
  ayuda de Brickwise que citan los expedientes: «Para comprar hace falta un
  número fiscal austriaco. Brickwise lo tramita gratis con su asesor.» (o el
  texto equivalente más corto que respalde el literal). Si la ficha ya lleva un
  aviso del número fiscal, se cambia por este. El acceso desde España se queda
  como está publicado. El resto de sus correcciones (precisar que las rentas
  las declara la emisora en una declaración conjunta, cifras del libro de
  órdenes de hoy) entra como lo piden los revisores.
- **Schwarzer Weg 18:** mínimo **69,90 → 71,90 €**, 298 → 297 participaciones
  en venta, venta más barata y orden de menor importe del 21/11.
- **Pottendorfer, GreenPoint y Cohotel** (no piden número fiscal; etiqueta
  «KESt»): `actualizar`. **Corrección del revisor** en el aviso KESt: «El
  emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay
  retención y la ganancia la declaras tú.» Fuera «Distribuciones esperadas
  desde 15/02/2024». Cohotel: la venta más barata es de 110 € en lotes de 31
  y 4, y 1 sola participación cuesta desde 120 €. **Si el motor lo admite**,
  el mínimo de la tarjeta pasa a «1 participación desde 120 € en reventa
  (21/11)»; si no (la regla de reventa exige «Desde X € la participación en
  reventa (DD/MM)»), se queda en ese formato con 110 € y la ficha lleva la
  referencia de los lotes.
- **Cifras del libro de órdenes:** las del 21/11 de cada ficha (las demás no
  cambian según el vigía).

### Hausera (`revision-independiente/vigilancia.md`)

- **Alicante 3 no ha pasado:** preventa abierta desde el 18/11/2026,
  suscripción del 25/11/2026 al 30/06/2027; 0 tokens en Polygon; sin inscribir
  en la CNMV; sin advertencias (el «cambia» del vigía es un falso positivo).
  Hoy un particular en España solo puede reservar, no invertir.
- **Mínimo corto (lo que vio Víctor):** «Desde 100 € en Alicante 3 (20/11)» →
  **«Desde 100 € · suscripción desde el 25/11»** (40 caracteres; corrección
  del revisor: no «suscripción el 25/11», que del 26 al 28/11 se leería como
  pasada). Va en `decisiones.json` (`transparencia.minimosCortos`), de donde
  venía el «(20/11)».
- **Textos largos:** «Mínimo de inversión», «Acceso desde España» y el aviso
  de la inscripción como los propone el expediente, sin «(20/11)» como si
  fuera fecha de la oferta. **Corrección del revisor:** en
  `transparencia.json`, `documentoEspana.motivo` pasa al 21/11 y
  `consultadaEl` 2026-11-21 en `supervisada` y en `documentoEspana`.

## 3. Lo que no entra

- **Las 6 candidatas** (Prosegur Cash pagarés, Securitize Stocks, Profitus/
  Axiology, Valorix/Bit2Me STX, CANDO1/Token City, Crypto.com Tokenized Stocks
  UE): `no_admitir`, confirmado por el revisor. Ninguna tiene hoy oferta
  abierta con documento, mínimo y acceso desde España respaldados.
- **Kraken xStocks:** los cambios rechazados de §2.
- **Retirar las 8 de Brickwise:** no (decisión de Víctor).

## 4. Correcciones de las revisiones de grupo

Las de §2, más las demás obligatorias de cada `revision-independiente/<grupo>.md`.
Copias con nombres de personas físicas (vigilancia: bit2me-blog y
profitus-bonds; spiko: la página de particulares) quedan fuera de Git
(`.gitignore` del ciclo; `grupos/**/crudo/` y `*.html`).

## 5. Pendiente para el próximo ciclo

- Hausera: el 02/12 se mira si Alicante 3 llegó al mínimo del 50 %; el 25/11
  abre la suscripción (la tarea programada prepara el próximo ciclo cuando
  queden menos de 72 h; si Víctor quiere el cambio el mismo 25/11, «haz la
  investigación»).
- Spiko Smart Cash: la ficha de la AMF.
- Kraken xStocks: si alguna condición final incluye España.

## 6. Auditoría completa (obligatoria desde el 20/11/2026)

Auditores independientes (no investigaron ni montaron) abrieron hoy la fuente
de cada dato visible (`auditoria/<ámbito>.md`): spiko (150 datos),
acciones-oro-tesoro, brickwise-a (189), brickwise-b, suiza-hausera (98),
noticias (55), sitio-web (412) y radar-plataformas. Siete de ellos se cortaron
a las 19:05 UTC por el límite de uso de la cuenta y se relanzaron a las 20:11
UTC; sus informes son de las 20:12–20:31 UTC.

**Regla:** entran **todos los hallazgos obligatorios** de cada informe, con su
`correccionExacta` (sobre todo la limpieza de referencias con fechas viejas:
re-fechar al 21/11 con la consulta de hoy o quitarlas, como diga cada
hallazgo), salvo lo que se decide abajo. Las recomendadas entran si solo
aclaran un texto de la entrega y el informe da su fuente de hoy; las que piden
código de la web van en su PR.

**Decisiones del coordinador sobre hallazgos concretos:**

- **Spiko Smart Cash · acceso desde España** (opción (a) del auditor): se
  mantiene la referencia publicada «Disponible para particulares residentes en
  España según Spiko, tras el alta y la verificación de identidad (KYC)»
  (fechaDato 2026-11-13, consulta 21/11) y se re-fecha al 21/11 el aviso sobre
  la CNMV y la AMF. No se toca `resumenOferta` (código) en este ciclo.
- **Spiko Letras Euro y Dólar · «Riesgo KID»:** «1 de 7, sin contar los
  riesgos del registro en blockchain y de la cartera digital (el KID los deja
  fuera)» (Dólar: «…, más riesgo de cambio, sin contar…»). Dólar: añadir la
  fuente de la CNMV (iicextranjera N0401205J) a `fuentesActuales` y a
  `documentacion.fuentes`, como Letras Euro.
- **Brickwise · aviso del número fiscal austriaco (las 8):** el texto del
  auditor, que respalda el literal de la ayuda de Brickwise: «Para comprar hace
  falta un número fiscal austriaco: se pide a Hacienda de Austria y, si lo
  pides con el asesor fiscal que te presenta Brickwise, no cuesta nada. Las
  rentas tributan en Austria (la emisora presenta una declaración conjunta) y,
  si vendes con ganancia, pagas allí la ImmoESt.» Si un aviso no admite ese
  largo, la primera frase entera y la segunda en la referencia de la ficha.
- **Hausera · mínimo corto:** «Desde 100 € · suscripción desde el 25/11». Si la
  comprobación «mínimo corto con la fecha de la ficha» de
  `.claude/skills/investigacion-catalogo/entrega/despues.mjs` lo rechaza, se
  ajusta para aceptar en Próximas la fecha del evento (con su prueba en
  `motor.test.mjs`), sin aflojarla para las demás. Aviso de la inscripción,
  resumen y «Próxima operación» como el auditor; fuera la referencia «Destino
  de consulta comprobado» del 30/09.
- **BOSS Info y Switzerlend · ¿pasar a «principales»?** El auditor lo propone
  (venta directa del emisor abierta hoy, como Aktionariat) o que la dirección
  decida dejarlas en reventa. **Decisión del coordinador: se quedan en reventa
  en este ciclo** (cambiar de colección es un cambio de estructura que no da
  tiempo a revisar bien antes del lunes); se anota en §5 para el próximo. Sus
  otras obligatorias (referencias del 22/10 fuera; «Clase» de Switzerlend con
  «si el dinero alcanza… no es un tope») entran.
- **Noticias:** cero obligatorias; las 4 recomendadas (sujeto de BaFin, emisor
  de Jersey en Robinhood, quién autoriza Bit2Me STX, doble fecha) van a la
  próxima edición de noticias, no a esta entrega.
- **Web (código):** las obligatorias 1–4 de `sitio-web.md` (mínimo de las
  fichas «No documentado en euros», privacidad y novedades) van en el PR #190;
  las 5–7 (referencias viejas de Spiko, mTBILL y Prosegur) entran en esta
  entrega.

## 5 bis. Pendiente añadido por la auditoría

- BOSS Info y Switzerlend: decidir si pasan a «principales».
- Las recomendadas de la web (cuota del mercado, etiqueta «Nueva» con el mismo
  plazo en Inicio y en Ofertas, /cambios y RSS) y de las noticias.

## 7. Radar (auditoria/radar-plataformas.md, 168 datos, 20:13–20:38 UTC)

Cuatro obligatorias:
- **(1) Avisos importantes en las páginas /plataformas/<slug>:** es código
  (`rwadar-fichas.js`): va en el PR #191, con la frase nueva de Reventa
  («Está en Reventa: RWAdar no confirma que se pueda contratar hoy;
  compruébalo en la fuente»), que arregla también lo de BOSS Info y
  Switzerlend de §6.
- **(4) Midas · fuente del acceso y de la licencia:** capa verificada del
  radar → esta entrega, con `cambios-radar.json` → `plataformas` (campo
  acceso: añadir como fuente las «Condiciones Finales de mTBILL (17/07/2026)»
  con su URL; licencia: «CNMV · Pasaportes recibidos (Midas Software GmbH)»,
  con la URL del informe). Si el motor no lo admite tal cual, a `noAplicado`
  con el motivo.
- **(2) Backed Finance · redes** y **(3) Ondo Finance · resumen:** son textos
  base del radar (tabla base, migración como la 38): no entran esta noche.
  Pendiente del próximo ciclo, con su migración y su PR. Lo que publica hoy no
  es falso: la lista de redes de Backed está incompleta y el resumen de Ondo no
  cuenta las acciones tokenizadas de Ondo Stocks.
- Recomendadas del radar: al próximo ciclo.

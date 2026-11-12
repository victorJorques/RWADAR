# Revisión independiente de cumplimiento · entrega 2026-11-12

Revisión de cumplimiento normativo: MiFID II, MiCA, Reglamento (UE) 2017/1129
de folletos, Reglamento (UE) 2020/1503 de financiación participativa, régimen
piloto DLT, Circular 2/2020 de la CNMV y Ley 6/2023 de los Mercados de Valores.
No monté esta entrega. Solo lectura: no toqué Supabase, no publiqué, no lancé
flujos ni hice commit. Fuera de este archivo no edité nada. Mis consultas de hoy
son de páginas públicas, solo con GET. Mis scripts y copias están en la carpeta
temporal de la sesión (`scratchpad/entrega-1211/revisor-cumplimiento`), fuera de
Git. Revisor: Claude, 12/11/2026, de 01:57 a 02:30 UTC.

**Veredicto: `aprobado_con_cambios`.** El SQL se puede aplicar tal cual. Su
SHA-256 sigue siendo
`4815b3cb3c63501f3fb69fa3b0ac0318d9c32210d88539cfb7742254f667e7ff` (lo comprobé
a las 02:06:33 UTC). Hay **una corrección obligatoria, y no cambia el SQL**
(O1): los nombres de cuatro personas físicas en una copia de las noticias que ya
está en Git y en la rama remota.

- Ningún texto nuevo o re-fechado promete rentabilidad, garantía ni liquidez. Lo
  que dice un emisor va atribuido: «la web lo presenta como…», «con el valor que
  publica el emisor», «Su web dice… pero el acuerdo firmado no le obliga».
- La única rentabilidad visible que cambia (Smart Cash, 2,84 %) lleva base,
  fecha y «no es un tipo fijo ni está garantizado». Coincide con la API de Spiko
  a las 02:08 UTC.
- El 3,45 % de mTBILL no se ve en ningún sitio, porque la vista lo tapa mientras
  la ficha esté en «fuentes en conflicto». Si algún día se destapa tal cual, no
  pasaría la Circular 2/2020 (R2).
- El acceso desde España no cambia en ninguna ficha. Los nueve «Sí» se apoyan en
  una fuente primaria, y hoy he vuelto a leerlas.
- El botón al proveedor queda igual que hoy en las 22 fichas: 5 «Ver oferta en
  X» y 17 «Ir a la web del proveedor (sales de RWAdar)».
- Ninguna entidad de las fichas tiene advertencias de la CNMV (29 nombres, en las
  tres listas). Solo salen los dos clones de siempre (Payward y Amundi), que no
  son las entidades de las fichas.
- La recomendación más urgente es la R1: en Hausera, «Hoy no se puede invertir»
  deja de ser cierto el 18/11 y la ficha vale hasta el 19/11. **Si el SQL se
  regenera hoy por cualquier motivo** (por ejemplo, por el punto 4 del §6 del
  informe), conviene meter en esa misma regeneración la R1, la R2 y la R3.
- Coincido con las R1, R2 y R3 de `REVISION-ENTREGA-contenido.md`. Con la
  revisión de SQL coincido en todo lo que toca al SQL. Su barrido de nombres no
  miró `noticias/fuentes/`, que es donde está la O1.

## 1. Qué hice

- **Leí** `DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, los 83 cambios de
  `contraste-2026-11-12.json`, `escaparate-publicacion.json` y
  `documentacion-ofertas.json`. También los expedientes de Hausera y Kraken, los
  cuatro informes de `revision-independiente/` y las revisiones de SQL y de
  contenido de hoy.
- **La regla del botón**, en el código y en su origen:
  - `rwadar-fichas.js`, líneas 209–216 y 298;
  - `rwadar-site/assets/rwadar-20260820.js`, líneas 2547 y 2914–2919;
  - `rwadar-movil/componentes/Ofertas.js`, líneas 407, 455–458 y 500;
  - punto 5.3 de `docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`
    (líneas 436–439).

  No ha cambiado desde la revisión del 11/11: la lógica del botón es la misma en
  los tres sitios.
- **Calculé con el código real** (`resumenOferta` de
  `rwadar-movil/lib/ficha-editorial.js`) el acceso, la supervisión, el documento
  para España y el botón de las 22 fichas:
  - con lo publicado (base del 11/11) y el `transparencia.json` de ahora
    (`81e78ab9…3808`);
  - con la entrega y el `transparencia.json` que deja `despues-de-aplicar.mjs` en
    el ensayo del montador (`c4edf956…3ad4`), el 12/11, el 19/11 y el 20/11.

  Además leí el texto del botón en las 22 fichas fijas que generó el ensayo, y
  comparé el `transparencia.json` de antes y de después. Solo cambian 88 fechas,
  los tres mínimos cortos de Cohotel, GreenPoint y Pottendorfer y la revisión;
  ningún «Sí» o «No». En la copia del ensayo, la entrega y el código de la web, la
  app y las fichas son los mismos bytes que en la carpeta de trabajo. Solo cambia
  la línea de datos de transparencia que reescribe `transparencia.mjs`.
- **Consultas propias de hoy:**
  - la API de Spiko y su tabla de países;
  - los registros de la CNMV de Spiko Finance, Spiko SICAV, Robinhood Europe y
    Payward;
  - las condiciones de los portales suizos;
  - el registro de la ERIR de Ursus-3, para Hausera;
  - las tres listas de advertencias de la CNMV;
  - el texto consolidado de la Circular 2/2020 en el BOE.
- **Barrido de nombres** en los 245 archivos que van a Git: 242 de la carpeta
  del ciclo y 3 de `importaciones/catalogo-2026-11-12-v2/`. Usé tres métodos:
  - tratamientos y cargos junto a un nombre propio;
  - un diccionario de nombres de pila (paquete `gender-guesser`, solo en la
    carpeta temporal);
  - un nombre en una línea sola seguido de un cargo («Director», «Secretary»…).

  Hice lo mismo con el `transparencia.json` y las 22 fichas fijas del ensayo,
  que van a Git después de aplicar.

## 2. Ficha por ficha (lo que cambia o entra)

### Spiko Smart Cash Euro (2,84 %, ahora con la VL del 11/11)

- **Rentabilidad: cumple.** El literal nuevo dice: «Tipo que publica Spiko, ya
  descontadas sus comisiones, con el valor liquidativo del 11/11/2026
  (consultado el 12/11/2026); la web lo presenta como el tipo que paga cada día
  el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un
  tipo fijo ni está garantizado.»
  - Lleva base, fecha y «no garantizado».
  - Lo que dice la web va atribuido a la web y desmentido donde hace falta: la
    web dice «tipo fijo», y el literal, que no lo es.
- **Lo comprobé** en `https://public-api.spiko.io/v0/share-classes/eurSAFO/yield`
  (02:08:04 UTC): `"dailyYield":"0.0284","weeklyYield":"0.0284","monthlyYield":"0.0284"`.
  La VL (`…/net-asset-values/eurSAFO/latest`, 02:08:04 UTC) es
  `"day":"2026-11-11…"`, `"value":"1.017029"`.
- **Avisos:** los cinco de siempre:
  - nadie confirma en un registro que el fondo esté dado de alta en España;
  - no es un depósito, aunque la web hable de «tipo fijo»;
  - riesgo de contraparte;
  - límite de reembolso del 25 %;
  - la web confunde quién es la gestora.
- **Acceso:** no cambia (§4).
- **Botón:** «Ver oferta en Spiko». Cumple la regla del código, pero el documento
  para España está en «No» (R5).
- **Matiz:** la métrica «Rentabilidad publicada · neta y variable · 11/11/2026:
  2,84 %» no dice a qué periodo se refiere (R4).

### Spiko Letras del Tesoro Euro y Dólar (solo la fecha)

- A las 02:08:03 UTC la API da los mismos archivos que ayer:
  - `EUTBL/yield`, SHA-256 `9cc1e1be…`, con `"monthlyYield":"0.0241"`;
  - `USTBL/yield`, SHA-256 `1bbc7629…`, con `"monthlyYield":"0.0402"`.

  El literal publicado («… consultado el 11/11/2026. Variable y no garantizado.»)
  sigue siendo cierto con su fecha.
- **Avisos:** capital no garantizado y límite de reembolso. **Botón:** «Ver
  oferta en Spiko».

### mTBILL

- **Entra una métrica:** «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 ·
  en USD: 3,45 % anual».
- **Entra un aviso:** «La rentabilidad es pasada y la calcula RWAdar con el valor
  que publica el emisor (del 06/10 al 10/11/2026): está en dólares, no descuenta
  el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la
  futura.»
- **Salen** las dos referencias de midas.app («APY observado» y «7D APY»). Bien:
  el punto 5.3 de la revisión legal pide no enseñar rendimientos de 7 días sin
  periodo, fuente y advertencia.
- **Lo que verá el público.** El campo `rentabilidad` sigue en `null` y la ficha
  sigue en «fuentes en conflicto», así que la vista tapa la cifra. Lo comprobé:
  - en la vista que exportó el ensayo (PGlite) salen las métricas «Cifras
    pendientes de nueva revisión» y el resumen «Condiciones pendientes de nueva
    revisión…»;
  - «3,45» sale 0 veces en las fichas fijas, los recursos de la web, `lib/` de la
    app y el `transparencia.json` del ensayo.

  Solo se ve el aviso nuevo.
- **El aviso no promete nada,** pero habla de una rentabilidad que el visitante
  no ve. Dice «no garantiza la futura», no «no es un indicador fiable» (R2).
- **La métrica, si se destapara tal cual, no pasaría la Circular 2/2020.**
  Anualiza 5 semanas y no da ningún periodo de 12 meses (R2). Hoy no bloquea,
  porque nadie la ve. Pero `DECISIONES` la quería visible («null → 3,45 % anual
  en USD»).
- **Avisos de riesgo: cumplen.** Están todos:
  - emisor no supervisado;
  - conflicto de reembolso (25 %/5 % frente a 15 %/50 %);
  - riesgo de cambio;
  - pérdida total (7 de 7);
  - sin mercado secundario.
- **Botón:** «sales de RWAdar». Sigue «garantizado por una cuenta de colateral»
  en «Qué se adquiere» (R9).

### Brickwise (11 de reventa)

- **Mínimos: cumplen la norma de reventa.**
  - Cohotel y GreenPoint, 102 €; Pottendorfer, 80 €; las otras 8, solo la fecha.
  - El alcance dice «Precio por participación de la venta más barata del mercado
    de la app ese día, más un 1,5 % de comisión … Brickwise no publica un mínimo
    en reventa ni si una orden se puede comprar en parte. … No es el precio de
    emisión.».
  - Ninguno se presenta como precio de emisión.
  - Ninguna ficha de reventa lleva `rentabilidad` ni `precio`.
- **Aviso común nuevo: cumple, y mejora la información.** Dice: «Cada venta se
  anuncia con su precio y su número de participaciones; no consta que se pueda
  comprar solo una parte. El comprador paga además un 1,5 % de comisión.»
  - «No consta» es lo justo: el revisor de Brickwise encontró indicios en las dos
    direcciones.
  - La comisión del vendedor también está: en la salida («1,5 % de comisión») y
    en la métrica de comisiones.
- **«Orden de venta de menor importe · 12/11/2026»: cumple.** Da el desembolso
  total con la comisión: 116,73 €, 96,43 € y 100,49 €, bien redondeados.
- **Lo que no cumple del todo: la tarjeta** (R3). En 5 fichas el precio más
  barato solo se vende en lote. La de Pottendorfer es nueva hoy:
  - «Mínimo Desde 80 € la participación (12/11)»;
  - pero a 80 € hay un lote de 11, que cuesta 893,20 € con la comisión;
  - y la entrada más pequeña que consta hoy es de 116,73 €.
- **Acceso:** «Sin confirmar» en las 11, sin cambios.
- **Avisos:** posible pérdida total (riesgo 6 de 7), solo reventa, acceso sin
  confirmar y documentación en alemán.
- **Botón:** «sales de RWAdar».
- Siguen las rentabilidades esperadas en «Datos con su fecha» (R7).

### Aktionariat, Boss Info y Switzerlend

- **Cambian** las fechas, los avisos con dato del día y los mínimos de Boss Info
  y Switzerlend. Son hechos del libro de órdenes y de la cadena; el revisor de
  contenido los volvió a leer de 01:39 a 01:48 UTC.
  - Ninguna frase del emisor sale como hecho. La de Switzerlend dice: «Su web
    dice que el emisor recompra…, pero el acuerdo firmado no le obliga…».
- **Boss Info, «Última operación · 12/11/2026»: cumple.**
  - Fuente `https://shares.bossinfo.com/`.
  - El alcance dice qué se comprobó hoy y que el importe del vendedor es del
    10/11. No promete nada.
- **Acceso: cumple.** Las condiciones de los portales lo dicen, con su lista de
  países:
  - `https://shares.bossinfo.com/investor-page-terms` y
    `https://shares.lend.ch/investor-page-terms` (02:08:30 UTC; el mismo
    SHA-256, `0764d616…`, y «Version 1.0 • October 30, 2026»), §9.1:
    «exclusively addressed to persons domiciled or resident in Switzerland or
    the EEA … The offer for persons from the EEA is limited to a total of
    €100,000.»;
  - `https://www.aktionariat.com/disclaimer` (02:08:31 UTC) dice lo mismo.
- **Avisos:**
  - Aktionariat sí dice «Sin folleto ni KID … el emisor no está supervisado».
  - **Boss Info y Switzerlend no lo dicen en los avisos.**
    - Lo dice la caja de transparencia: «Vende el propio emisor suizo, sin
      licencia de un supervisor del EEE ni registro en la CNMV…» y «No hay
      folleto, KID ni ficha informativa…».
    - La métrica «Supervisor» también lo dice, pero la vista la tapa (R6).
- **Botón:** «sales de RWAdar» en las tres.

### Hausera (en camino)

- **El aviso re-fechado es cierto.** Dice «El 12/11/2026 Alicante 3 aún no estaba
  inscrita en el registro de la CNMV».
  - Lo comprobé en la ERIR de Ursus-3
    (`https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es`,
    02:11:03 UTC).
  - En la página 1 de 3 salen las SPV 2 a 8. La inscripción más reciente es del
    23/10/2026. No sale la SPV 11, la emisora de Alicante 3.
  - El revisor de contenido miró las tres páginas a las 01:30 UTC.
  - La página avisa: «no implica que la CNMV haya validado las condiciones de la
    emisión».
- **El «Historial publicado» va atribuido al promotor:** «Cifras del promotor en
  su portada … ningún registro público las comprueba. No son una rentabilidad ni
  garantizan resultados.».
- **Lo que falla dentro de la vigencia (R1).**
  - El alcance del mínimo dice «Hoy no se puede invertir: la preventa abre el
    18/11/2026…».
  - La ficha vale hasta el 19/11. La preventa abre el 18/11, a las 09:00, según
    la página de Hausera que leyó el expediente (00:37 UTC), con el botón
    «Reservar tickets».
  - Además, la contradicción del 50 % / 70 % sigue sin estar en los avisos el día
    en que se puede reservar.
- **Botón:** «sales de RWAdar».

### Robinhood, Kraken xStocks y Prosegur Digital Gold (solo fechas)

- Volví a leer los registros que sostienen su «España: Sí» (§4).
- **Kraken:**
  - Sigue con «Ver oferta en Kraken (Payward Europe Digital Solutions)».
  - Sus propios avisos dicen que las condiciones finales no cubren su venta en
    España y que el emisor (Backed Assets (JE)) no tiene autorización de un
    supervisor de la UE.
  - El punto 5.3 de la revisión legal pide «sales de RWAdar» cuando el emisor no
    está supervisado (R5).

## 3. Botón al proveedor (regla 5.3 del 06/11/2026)

El código pone «Ver oferta en X» solo si se cumplen todas estas condiciones:

- la oferta es principal;
- `disponibleEs` es verdadero;
- `resumenOferta` da el acceso desde España como «sí», con fuente;
- `transparencia.json` tiene `supervisada` en «Sí», con la misma `verificadaEl`.

Si falta alguna, el botón dice «Ir a la web del proveedor (sales de RWAdar)».

| Ficha | Acceso | Supervisada | Doc. para España | Botón (hoy y tras aplicar) |
|---|---|---|---|---|
| Spiko Euro y Spiko Dólar | sí | Sí | Sí | Ver oferta en Spiko |
| Spiko Smart Cash Euro | sí | Sí | **No** | Ver oferta en Spiko |
| Robinhood Classic Stock Tokens | sí | Sí | Sí | Ver oferta en Robinhood Europe |
| Kraken xStocks | sí | Sí | **No** | Ver oferta en Kraken (Payward Europe Digital Solutions) |
| Prosegur Digital Gold, Aktionariat | sí | No | No | sales de RWAdar |
| mTBILL | sin comprobar | No | Sí | sales de RWAdar |
| Boss Info, Switzerlend | sí (reventa) | No | No | sales de RWAdar |
| Las 11 de Brickwise | sin comprobar | No | No | sales de RWAdar |
| Hausera | sin comprobar | No | No | sales de RWAdar |

- **Antes y después.** Calculé el botón con lo publicado (11/11) y con la entrega
  (12/11). No cambia nada en las 22 fichas: ni el acceso, ni la supervisión, ni
  el documento, ni el botón.
- **El 19/11** sale lo mismo. **El 20/11** no sale ningún «Ver oferta», porque
  las fichas caducan y el acceso pasa a «sin comprobar».
- **Las 22 fichas fijas** que generó el ensayo dicen exactamente esos textos.
- **Entre aplicar el SQL y publicar la web y la OTA,** sale «sales de RWAdar» en
  las 22. Es así porque el `transparencia.json` publicado es del 11/11 y el
  código exige la misma fecha que la ficha. Falla cerrado.
- **Ninguna ficha de reventa** enseña «Abrir mercado»: ninguna tiene
  `urlMercado`. Ninguna oferta es de `tipo` «secundario», así que la web no pone
  «Ficha oficial» en ninguna.
- La página pública `rwadar-site/transparencia-comercial.html` explica el botón
  solo con la primera condición (R9). El código es más estricto que lo que dice.

## 4. Acceso desde España

No cambia en ninguna ficha. Cada «Sí» se apoya en una fuente primaria que de
verdad lo dice, y la he vuelto a leer hoy:

- **Spiko** (las tres fichas):
  - la tabla de Spiko
    (`https://docs.spiko.io/documentation/product_overview/fund_availability`,
    02:08:06 UTC) marca España en las tres primeras columnas y no en la cuarta,
    y dice «Last updated: October 23, 2026»;
  - el pasaporte de Spiko Finance en la CNMV
    (`https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es`,
    02:08:06 UTC): «SPIKO FINANCE SASU … 5325 14/01/2026»;
  - Smart Cash, además, en la ficha de la SICAV en la CNMV
    (`https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es`,
    02:08:10 UTC): «SPIKO SICAV … 2380 30/01/2026 SICAV FRANCIA». La CNMV no
    enseña los compartimentos, y el aviso 2 lo dice.
- **Robinhood:**
  `https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5299`
  (02:08:07 UTC): «ROBINHOOD EUROPE, UAB … 5299 21/04/2025».
- **Kraken:**
  `https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474`
  (02:08:09 UTC): «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED … 4474
  05/01/2018». Es el pasaporte de quien lo vende. Las condiciones finales del
  emisor no nombran España, y la ficha lo dice.
- **Aktionariat, Boss Info y Switzerlend:** las condiciones de sus portales, con
  su lista de países (§2).
- **Prosegur:** sociedad española, contrato en español para residentes del EEE.
  No cambia hoy.

Las demás salen como «Sin comprobar» o «Sin confirmar»: mTBILL (fuentes en
conflicto), las 11 de Brickwise y Hausera.

## 5. Advertencias de la CNMV (búsqueda propia, 12/11/2026)

Buscador: `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=<lista>&nombre=<nombre>`.
Usé tres listas:

- `tipo=1`: «No autorizadas», de 02:06:55 a 02:08:02 UTC;
- `tipo=4`: «Advertencias de reguladores extranjeros», de 02:08:04 a 02:09:08 UTC;
- `tipo=5`: «Otras advertencias», de 02:09:10 a 02:10:10 UTC.

Los dos últimos nombres, de 02:10:41 a 02:10:52 UTC. Todas las respuestas, HTTP
200.

**Controles:**

- «Trading» (`tipo=1`, 02:06:55 UTC): «Página 1 de 16», y la primera advertencia
  es del 10/11/2026;
- «Gemini» (02:06:58 UTC): «GEMINI LTD FX» y «GEMINI OPTION LTD».

El buscador funciona y está al día.

**Sin resultados («No hay datos disponibles») en las tres listas.** Busqué 29
nombres:

- Spiko, Twenty First, Amundi;
- Midas, Midas Software, mTBILL;
- Aktionariat, Boss Info, Bossinfo, Switzerlend, Lend AG, lend.ch;
- Brickwise, Effecta, Brick Qogir, Brick Sagarmatha, BrickOne, Green Point,
  Green-Point, Cohotel;
- Hausera, Holdtx, Ursus, Property Manager;
- Robinhood, Kraken, Payward, Backed, Prosegur.

Hay dos excepciones, y son los clones de siempre:

- `tipo=4`, «Amundi» (02:08:14 UTC): «12/02/2025 AMUNDI BONDING SOLUTIONS
  LUXEMBOURG SA ISSUER PLC (CLONE) … CSSF (LUXEMBURGO)». No es la gestora
  delegada de Smart Cash.
- `tipo=5`, «Payward» (02:10:06 UTC): «19/03/2025 PAYWARD LTD (CLONE) FSMA
  (BELGICA) … ESQUEMA DE RECOVERY ROOM». No es Payward Europe Digital Solutions
  (CY), n.º 4474.

Las dos fichas enlazan solo a los dominios oficiales (`eu.kraken.com` y
`spiko.io`). Hoy no entra ninguna entidad nueva ni cambia el acceso de ninguna.
No aparecer en el buscador no significa estar autorizado.

## 6. Datos personales

- **El SQL y los datos públicos no llevan nombres de personas.** Lo comprobé en
  `aplicar-y-aprobar.sql`, `catalogo.sql`, `revision.json`, el escaparate, la
  documentación y el contraste. La cabecera y `aprobada_referencia` dicen «el
  responsable del proyecto».
- **Lo que va a Git después de aplicar** (el `transparencia.json` y las 22 fichas
  fijas del ensayo) tampoco lleva nombres.
- **En Git no hay ningún PDF, HTML ni `crudo/`** de la carpeta del ciclo: 0
  archivos, gracias al `.gitignore` del día.
- **Direcciones de cadena:** las que hay en lo que está en Git son de contratos
  (tokens, Brokerbot, mercados, oráculo y bóvedas) o la dirección cero. Ninguna
  es de un particular.
- **Lo que dejo fuera** (no es O1):
  - nombres de calles, en el registro de ESMA y en direcciones de empresas;
  - nombres de empresas;
  - direcciones de correo genéricas de empresas e instituciones;
  - un correo de ejemplo con un nombre ficticio, en la web de Brickwise;
  - las marcas de recorte que ya existen;
  - el nombre del premio de periodismo del pie de página de la CNMV, como el 10 y
    el 11/11;
  - el nombre de pila del responsable del proyecto, en dos documentos internos
    del coordinador (`DECISIONES-COORDINADOR.md` y `ENCARGO-INVESTIGADORES.md`).
    Es el titular del repositorio y ya está en `AGENTS.md`; no está en el SQL ni
    en los datos públicos. Es la recomendación 10 de la revisión de SQL.
- La O1 del 11/11 está hecha (commit `338c209`).
- **Hoy hay un caso nuevo, en el mismo sitio que ayer** (O1).
  - El archivo es `noticias/fuentes/rhj-supp.txt`, el texto del suplemento del
    09/11/2026 al folleto de Robinhood Assets (Jersey).
  - Tiene los nombres de cuatro personas físicas: tres consejeros del emisor y un
    suplente. Salen en dos páginas de firmas y en la tabla de consejeros, con su
    cargo y su dirección profesional.
  - Están en las líneas 1232, 1237, 7843, 7854, 7865, 7875, 7876, 14281 y 14286.
  - El archivo entró en el commit `1b632af`, que ya está en
    `origin/claude/sharp-babbage-m3bbbw`.
  - La verificación de las noticias miró el JSON publicado, no las copias de
    `noticias/fuentes/`.

## 7. Corrección obligatoria (no cambia el SQL)

### O1 · Nombres de personas físicas en una copia que ya está en Git

**Problema.** `rwadar-app/data/verificaciones/2026-11-12-v2/noticias/fuentes/rhj-supp.txt`
tiene, en nueve líneas, los nombres de tres consejeros y un consejero suplente
del emisor. Las indicaciones del ciclo dicen «sin nombres de personas físicas»
en lo que va a Git.

**Corrección.** Hay que hacerla antes del próximo commit y del PR. No toca el SQL
ni la entrega, ni cambia ningún texto publicado de las noticias.

1. Guardar este script en la carpeta temporal de la sesión, no en el
   repositorio. Lo probé en una copia del archivo: cambia 9 líneas y deja 0
   apariciones.

```python
# O1 (cumplimiento 12/11) · recorte por número de línea, sin escribir ningún nombre.
# Uso, desde la raíz del repositorio:
#   python3 -I recortar-o1.py rwadar-app/data/verificaciones/2026-11-12-v2
import re, sys, os
R = '[persona física recortada]'
base = sys.argv[1]
ruta = os.path.join(base, 'noticias/fuentes/rhj-supp.txt')
t = open(ruta, encoding='utf-8').read().split('\n')
toda = (r'^(\s*)\S.*?(\s*)$', r'\1' + R + r'\2')        # la línea entera es un nombre
cambios = {n: toda for n in (1232, 1237, 7843, 7854, 7865, 14281, 14286)}
cambios[7875] = (r'^(\s*)\S+ \S+(?= \(alternate)', r'\1' + R)   # nombre del suplente
cambios[7876] = (r'(director for )\S+ \S+?(\))', r'\1' + R + r'\2')  # «… for <nombre>)»
for n, (patron, nuevo) in sorted(cambios.items()):
    antes = t[n - 1]; t[n - 1] = re.sub(patron, nuevo, antes)
    assert t[n - 1] != antes, f'línea {n} no cambió'
open(ruta, 'w', encoding='utf-8').write('\n'.join(t))
print(ruta, len(cambios), 'líneas')
```

2. Ejecutarlo desde la raíz:

```
python3 -I recortar-o1.py rwadar-app/data/verificaciones/2026-11-12-v2
```

   - Tiene que imprimir «… 9 líneas».
   - Después, `grep -c "persona física recortada"` en ese archivo tiene que dar 9.
   - `git diff --stat` debe enseñar solo ese archivo, con 9 líneas cambiadas.
3. Repetir el barrido de nombres incluyendo `noticias/fuentes/` antes del commit
   (R8).
4. Ya está en la historia de la rama remota. Recortarlo limpia lo que se ve en la
   rama, no los commits anteriores. Reescribir la historia o hacer un *force
   push* necesita permiso del responsable del proyecto. Si el PR se une con
   «squash» y después se borra la rama, esos commits no llegan a `main`.

## 8. Recomendaciones (no bloquean)

**R1 · Hausera: «Hoy no se puede invertir» (la más urgente).**

- **El problema.** La ficha dice «Revisadas el 12/11/2026» y vale 7 días, hasta
  el 19/11. La preventa abre el 18/11 a las 09:00, con «Reservar tickets». Desde
  entonces hasta el final del 19/11, el alcance del mínimo («… Hoy no se puede
  invertir: la preventa abre el 18/11/2026 y la suscripción, el 25/11/2026.»)
  deja de ser cierto.
- **Por qué importa.** La Circular 2/2020 pide, en el anexo, apartado I.6, no dar
  «una apariencia distinta a la realidad sobre las características o duración de
  la oferta anunciada».
- **No es nuevo.** La R2 de cumplimiento del 11/11 lo pedía «si hay otra entrega
  antes de esa hora», y esta es esa entrega. `DECISIONES` no lo recogió. Hoy es
  también la R1 del revisor de contenido.
- **Si el SQL se regenera:**
  - cambiar en ese alcance «Hoy no se puede invertir: la preventa abre el
    18/11/2026 y la suscripción, el 25/11/2026.» por «El 12/11/2026 aún no se
    podía invertir: la preventa abre el 18/11/2026 y la suscripción, el
    25/11/2026.»;
  - añadir el aviso «Los documentos de Alicante 3 no coinciden en cuánto hay que
    colocar para que la emisión siga adelante; pregúntalo a Hausera antes de
    reservar.». Va sin porcentajes, como decidió el expediente;
  - cambiar el aviso de la preventa por «Alicante 2 figuraba como financiada el
    10/11/2026, antes de su oferta pública del 11/11: quien reserva en la
    preventa paga antes de que la emisión esté inscrita (ver el aviso
    anterior).».
- **Si no se regenera:** que la siguiente entrega se aplique antes del 18/11 a
  las 08:00 UTC (las 09:00 en Madrid). El coordinador debería dejarlo escrito
  como compuerta en `PARA-CODEX.md`.

**R2 · mTBILL: el 3,45 % no podría enseñarse así.**

- **Lo que dice la norma.** La Circular 2/2020, en el anexo, apartado II.6 (BOE
  consolidado, `https://www.boe.es/buscar/act.php?id=BOE-A-2020-14107`, leído a
  las 02:03:17 UTC):
  - «Será aceptable incluir rentabilidades sobre períodos de tiempo inferiores a
    doce meses siempre que no se proporcionen de forma anualizada y se incluya
    información sobre la rentabilidad de al menos un periodo adicional de 12
    meses.»;
  - «deberá advertirse de forma destacada que las rentabilidades pasadas no
    constituyen un indicador fiable de las rentabilidades futuras».

  La revisión legal del 06/11 (punto 5.3, línea 439) adopta el mismo criterio.
- **Lo que hace la métrica.** Anualiza 35 días y no da ningún periodo de 12
  meses. El aviso dice «no garantiza la futura».
- **Hoy no bloquea:** la cifra está tapada. Pero `DECISIONES` la quería visible.
- **Antes de que ninguna entrega la destape** (por ejemplo, si la ficha sale de
  «fuentes en conflicto»):
  - cambiarla por «Rentabilidad pasada en USD · del 06/10 al 10/11/2026 (5
    semanas, sin anualizar): 0,33 %»;
  - añadir al lado la de 12 meses, con el mismo oráculo, y la frase «Las
    rentabilidades pasadas no son un indicador fiable de las futuras»;
  - si no hay dato de 12 meses, no enseñar ninguna cifra.

  El 0,33 % sale de 1,07768132 / 1,07410723 − 1.
- **Mientras siga tapada,** cambiar el aviso por uno que se entienda solo: «RWAdar
  no enseña la rentabilidad de mTBILL mientras sus documentos no coincidan. La
  que calcula con el valor que publica el emisor (del 06/10 al 10/11/2026) es
  pasada, está en dólares y no descuenta el 0,07 % del reembolso inmediato ni el
  cambio euro/dólar. Las rentabilidades pasadas no son un indicador fiable de
  las futuras.». Es la R2 de contenido con la frase de la Circular.

**R3 · Brickwise: el mínimo de la tarjeta cuando el precio más barato es un
lote.**

- **Dónde pasa:** en cinco fichas. En cada una, el lote a ese precio y la orden
  de menor importe, con el 1,5 %:

  | Ficha | Lote al precio más barato | Orden de menor importe |
  |---|---|---|
  | Pottendorfer (nuevo hoy) | 11 a 80 € (893,20 €) | 1 a 115 € (116,73 €) |
  | Sonnleithnergasse | 11 a 75 € (837,38 €) | 1 a 80 € (81,20 €) |
  | Hinterstoder | 5 a 75 € (380,63 €) | 1 a 90 € (91,35 €) |
  | Drautalresidenz | 3 a 70 € (213,15 €) | 1 a 84 € (85,26 €) |
  | Plüddemanngasse | 2 a 75 € (152,25 €) | 1 a 99 € (100,49 €) |

- **El problema.** La tarjeta solo enseña «Mínimo Desde 80 € la participación
  (12/11)», sin el aviso común. La Circular (anexo, I.5 y I.6) pide que el coste
  sea «claro, exacto, suficiente» y que no cree expectativas falsas. Un mínimo
  más bajo que la entrada real es el caso típico.
- **La propuesta.** El texto corto «Desde 80 € (lote de 11, 12/11)» (30
  caracteres) y el largo «Desde 80 € la participación en reventa, en un lote de
  11 (12/11)». Son ciertos tanto si se puede comprar una parte como si no.
- Es la recomendación del revisor de Brickwise y la R3 de contenido.
  `DECISIONES` fijó el formato y los precios, por eso no la hago obligatoria.

**R4 · La frase de las rentabilidades pasadas y el periodo.**

- **Falta la frase.** «Las rentabilidades pasadas no son un indicador fiable de
  las futuras» sale 0 veces. La busqué en `rwadar-site/*.html`,
  `rwadar-site/assets/rwadar-20260820.js` y `rwadar-movil/componentes/`. Hoy se
  ven tres rentabilidades (Spiko).
- **Falta el periodo en Smart Cash.** La métrica debería decirlo. Spiko la
  publica como «30D YIELD 2.84% Annualised», según el revisor de contenido
  (01:38:51 UTC). Propuesta: «Rentabilidad publicada · neta, variable, a 30 días
  y anualizada · 11/11/2026: 2,84 %».
- Es la R3 de cumplimiento del 11/11.

**R5 · Regla 5.3: alinear el código con la revisión legal.**

- La revisión legal (línea 438) pide «sales de RWAdar» donde «el emisor no esté
  supervisado». El código mira la entidad que lo vende.
- En Kraken cambia el resultado. El emisor, Backed Assets (JE), no tiene
  autorización de ningún supervisor de la UE. Además, la propia ficha dice que
  «RWAdar no ha encontrado ningún documento oficial que explique en qué se basa
  la venta en España», y aun así el botón dice «Ver oferta en Kraken».
- En Smart Cash, el documento para España está en «No».
- Es un cambio de código en la web, las fichas y la app, así que necesita una
  orden aparte y OTA. Es la R1 de cumplimiento del 11/11.

**R6 · Boss Info y Switzerlend: el aviso que falta.**

- Añadir, como ya tiene Aktionariat: «Sin folleto ni KID, y el emisor no está
  supervisado: su portal no dice en qué exención se apoya para vender en el
  EEE.».
- Hoy solo lo dice la caja de transparencia; la métrica «Supervisor» está tapada.
- Sigue en pie la lectura del artículo 36.1 de la Ley 6/2023 para las tres
  suizas: una oferta al público sin folleto que se anuncia necesita una entidad
  autorizada, y el portal no nombra ninguna.
- Son las R4 y R5 del 11/11.

**R7 · Brickwise: rentabilidades esperadas en reventa (cuarta vez).**

- **Lo que se ve.** En la web, «Datos con su fecha» enseña la cifra. Por ejemplo,
  en Pottendorfer:
  - «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026», 4,22 %;
  - «Distribución anual prevista anunciada», 3,80 %.

  Pero el aviso dice que el alquiler terminó el 30/11/2025 y que «la rentabilidad
  no se muestra». Pasa lo mismo en Randhartingergasse y en Sonnleithnergasse.
- **Por qué importa.** Choca con la norma de reventa y con la Circular: anexo,
  I.1 (nada «contradictorio») y I.7 («no podrán contradecir el contenido del
  mensaje principal»).
- **La propuesta.** Quitar esas referencias en la próxima regeneración, o
  rotularlas como históricas sin cifra.
- Son la R7 del 11/11 y la R10 de contenido de hoy.

**R8 · Un barrido de nombres que incluya `noticias/fuentes/`.**

- La O1 de hoy entró por el mismo hueco que la del 11/11, cuya R11 ya lo pedía.
- Antes de cada commit del ciclo, pasar el barrido (tratamientos, cargos y
  diccionario de nombres de pila) a toda la carpeta, también a `noticias/`.

**R9 · Arrastres menores, sin cambio hoy:**

- mTBILL: «garantizado por una cuenta de colateral» → «con garantía real sobre una
  cuenta de colateral».
- Hausera:
  - «que pasen el test de idoneidad del emisor» → «que el emisor considere
    idóneos»; el «test de idoneidad» es el de MiFID II, art. 25.2;
  - avisar de que no tiene las protecciones del Reglamento (UE) 2020/1503.
- Spiko Letras: el texto corto de salida «Reembolso diario» → «Reembolso diario,
  con límites». Es un cambio de `despues-de-aplicar.mjs` y no toca el SQL.
- `rwadar-site/transparencia-comercial.html`: añadir que «Ver oferta» exige
  también que la entidad que la ofrece esté supervisada.

## 9. Límites de esta revisión

- **No abrí los PDF** (KID, condiciones finales, documento de emisión de Hausera).
  Para el 50 % / 70 % y los países de las condiciones finales me apoyo en los
  expedientes y en `revision-independiente/`.
- **No volví a leer** los libros de órdenes de Brickwise, ni los portales suizos
  por dentro, ni el oráculo de mTBILL. Lo hicieron el revisor de cada grupo y el
  de contenido, entre las 00:40 y las 01:52 UTC.
- **No repetí el ensayo ni `npm test`.** Usé, solo leyendo, la copia del ensayo
  del montador. Comprobé que la entrega y el código que usé son los mismos bytes
  que en la carpeta de trabajo.
- **No hice altas ni KYC.**
- **El buscador de la CNMV** busca por nombre y por trozo de nombre. No sustituye
  a una consulta formal.
- **El barrido de nombres no es exhaustivo.** Un nombre que no esté en el
  diccionario, o que esté escrito en mayúsculas, puede escaparse.
- **No revisé el contenido de las noticias**, que no son parte de esta entrega.
  Solo miré los nombres de personas en sus copias.
- **RWAdar no está dentro del ámbito de la Circular 2/2020** (norma 4): es un
  medio sin comisiones ni publicidad. La uso como vara de medir porque la
  revisión legal del 06/11 la adopta (punto 5.3).

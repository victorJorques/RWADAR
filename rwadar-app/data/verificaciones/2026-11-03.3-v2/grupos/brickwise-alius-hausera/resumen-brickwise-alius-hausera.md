# Brickwise, Alius y Hausera · resumen de la revisión del 03/11/2026

Grupo `brickwise-alius-hausera`. Fuentes leídas hoy entre las 10:05 y las 10:31
UTC, todas públicas y sin iniciar sesión. Copias, hora, HTTP y SHA-256 en
`inventario-consultas.json`. Las respuestas crudas de la API (direcciones,
tokenId, nombres de administradores) están en `fuentes/crudo/`, fuera de Git.
En las copias de texto he recortado los nombres de personas físicas y los
parámetros de enlace con aspecto de clave (una URL de Google Maps en la app
de Brickwise y un enlace del canal ético de Hausera).

Incidencia del scratchpad compartido (10:06): otro grupo sobrescribió el
script común de descarga. Mis descargas de esa ventana fallaron sin escribir
nada y las repetí entre las 10:07:21 y las 10:07:32 con un script propio
(`scratchpad/grupo-bah/`). He comprobado los 123 archivos del inventario: todos
están en disco y cuadran con su SHA-256.

## Lo que vale para todo Brickwise (comprobado hoy)

- **Quién vende:** Brickwise Investment GmbH, agente vinculado nº 80174029 de
  **Effecta GmbH** en la BaFin (activo desde el 04/08/2021, sin fecha de baja;
  datos a 02/11/2026). Effecta es Wertpapierinstitut (BaFin-ID 10133261) y
  está en la **CNMV** con el nº 5003, en libre prestación y solo para
  recepción y transmisión de órdenes. No tiene agentes notificados en España.
- **Advertencias:** el buscador de la CNMV, que el 01/11 no respondía, hoy
  funciona. Lo comprobé con «Trading», que sí devuelve entidades advertidas.
  No hay advertencias para Brickwise, Effecta, Brick Qogir, BrickOne, Brick
  Sagarmatha, Green-Point, Cohotel, C&P Bricks, Greeninfra ni Greemer. En la
  FMA austriaca, «brickwise» no figura entre las entidades autorizadas. Su
  web no da resultados para Brickwise, Effecta, Brick Qogir ni BrickOne, y la
  búsqueda de control sí devuelve resultados. Con esto **se resuelve el
  bloqueo del 01/11**.
- **Documentos:** volví a descargar los 39 contratos, KID e Informationsblätter
  de los 13 activos y el documento de costes. **Todos tienen el mismo
  SHA-256 que el 01/11**, así que no ha cambiado nada en ellos.
- **Comisión:** 1,5 % por operación. Lo dicen los Kosteninformationen y
  también la API pública de comisiones de la app (`fees: 0.015`).
- **Acceso desde España:** según la FAQ (leída hoy), puede abrir cuenta
  cualquiera con residencia en el EEE. No hay nada que confirme que cada
  emisión se distribuya en España, y los documentos solo están en alemán →
  `disponibleEs: no_confirmado`.

## Las 11 de reventa (todas siguen con `stage=secondary`) → actualizar

Datos del libro de órdenes de la API a las 10:05 UTC. La «venta más barata»
lleva ahora entre paréntesis las participaciones que hay **a ese precio**, no
el total. La mejor compra lleva cantidad y fecha.

| Slug | Venta más barata | En venta | Mejor compra | Cambia en la API desde el 01/11 | Aviso de alquiler |
|---|---|---|---|---|---|
| vivienda-pluddemanngasse-101-graz | 80,00 € (2) | 333 | 20,00 € (1, 23/04/2026) | — | vigente |
| vivienda-sonnleithnergasse-2-viena | 75,00 € (11) | 96 | 69,00 € (1, 31/10/2026) | — | vigente (vence el 29/11/2026) |
| local-de-estanco-klagenfurt | 95,00 € (15) | 301 | 88,00 € (1, 19/10/2026) | — | — |
| vivienda-stallhofstra-e-28-gratwein | 69,90 € (1) | 313 | 30,00 € (1, 01/07/2026) | en venta 309→313 | **cambia** |
| vivienda-schwarzer-weg-18-graz | 69,90 € (1) | 299 | 60,00 € (1, 25/10/2026) | en venta 274→299 | vigente |
| drautalresidenz-paternion | 70,00 € (3) | 150 | 54,00 € (1, 31/10/2026) | precio de referencia 67,80→70; previsión 4,83→4,68 % | — |
| randhartingergasse-9-viena | 78,00 € (21) | 184 | 40,50 € (10, 22/04/2026) | en venta 183→184 | **cambia** |
| apartamento-vacacional-hinterstoder-50 | 72,00 € (5) | 263 | 65,00 € (1, 30/09/2026) | en venta 253→263 | — |
| vivienda-pottendorfer-stra-e-62-wr-neustadt | 78,00 € (21) | 127 | 63,00 € (1, 15/10/2026) | en venta 106→127; más barata 80→78 € | vigente |
| fotovoltaica-greenpoint | 100,00 € (5) | 351 | 90,00 € (1, 20/10/2026) | — | — |
| fotovoltaica-cohotel | 110,00 € (35) | 65 | 3,00 € (1, 23/11/2024) | — | — |

Qué cambia en las tarjetas:

- **Precio y libro de órdenes con fecha:** la tarjeta publicada no tiene
  precio. Propongo tres filas fechadas: venta más barata, participaciones en
  venta y mejor compra.
- **Tres datos en castellano** (`resumenTarjeta`):
  - **Mínimo:** «Sin mínimo publicado; la venta más barata era de X € por
    participación (03/11/2026)».
  - **Acceso:** «Cuenta para residentes del EEE (España incluida) con KYC;
    documentos solo en alemán».
  - **Salida:** depende del activo:
    - viviendas y local: «Sin reembolso: vendes en el tablón de la app si hay
      comprador, con 1,5 % de comisión»;
    - Pottendorfer: primera cancelación posible a los 15 años;
    - fotovoltaicas: devolución del nominal el 31/12/2038, subordinada.
- **Avisos que cambian:**
  - **Stallhofstraße:** el aviso dice «contrato ya vencido», pero no es
    exacto. La API da dos fechas: el campo dice 01/02/2022 y la descripción
    dice que el alquiler termina el 31/03/2027. Texto nuevo: «La API da dos
    fechas de fin del alquiler (01/02/2022 y 31/03/2027); la rentabilidad no
    se muestra».
  - **Randhartingergasse:** el inquilino se fue el 28/02/2026 y la API dice
    que se busca otro. Texto nuevo: «Según la API, el inquilino se fue el
    28/02/2026 y se busca otro; la rentabilidad no se muestra».
  - Los avisos de Plüddemanngasse (fin del alquiler el 31/07/2024), Schwarzer
    Weg (30/08/2023), Pottendorfer (30/11/2025) y Sonnleithnergasse (vence el
    29/11/2026) siguen vigentes. Solo los he redactado con la fecha concreta.
- **Rentabilidad:** sigue en `null`. La app muestra un «% p.a.» que, según
  he comprobado, es el alquiler neto previsto dividido entre el precio de la
  venta más barata (p. ej., Plüddemanngasse: 3.007,72 / (1.000 × 80) =
  3,76 %). Es una previsión, no un reparto realizado. En 6 de las 11 fichas
  la base del alquiler no está al día. Lo dejo anotado en los claims.
- Se mantienen en «secundario». Agruparlas en una sola tarjeta «Brickwise ·
  reventa» sigue siendo opción de Víctor.

## BILLA (terreno-con-arrendamiento-billa) · en camino → actualizar

- **Hoy se puede suscribir en emisión primaria:** la app la muestra en
  «Neue Objekte» con un indicador del 1 %, un mínimo de 1.000 € y un precio
  de 100 € por participación.
- **Umbral:** siguen suscritas **82 de 6.404 participaciones** (8.200 €), la
  misma cifra que el 01/11. El umbral es de 500.000 € (5.000 participaciones),
  así que va por el **1,64 %**. Si no se alcanza, se devuelve el dinero sin
  intereses.
- **Plazo y prórroga:** el plazo publicado terminó el 16/05/2026. La API de
  hoy sigue con `issueEndDate = issueEndDateOriginal` (no registra
  prórroga), pero la app la sigue ofreciendo. El contrato (§4.3) permite
  prorrogar hasta el triple del plazo original de 3 meses. Según nuestra
  lectura, el límite estaría hacia el 16/02/2027. Brickwise no publica la
  fecha.
- **Fondos propios del emisor:** eran negativos, unos −83.000 €, a
  31/12/2024 (Informationsblatt, mismo SHA-256 que el 01/11).
- **Garantía registral:** pendiente («Grundbücherliche Besicherung noch
  ausstehend»).
- **Nuevo hoy:**
  - leí el aviso de desistimiento: hay **14 días para desistir** de la
    suscripción, hasta que se entreguen los tokens;
  - el contrato de alquiler con BILLA es un escaneo de 2012 sin texto, así
    que la partida «Submietvertrag» (33.277 € al año, la mitad de la renta)
    sigue sin explicar;
  - la app muestra «repartos desde el 14/07/2026», una fecha que ya pasó sin
    que haya habido ningún reparto.
- **Tarjeta:** los avisos se re-fechan al 03/11, se añade la fila «Plazo de
  suscripción» y el paso 4 pasa a «Reparto si se emite».
- **Aviso:** resta confianza. Si a mediados de noviembre sigue igual,
  conviene proponer su retirada (decide Víctor).

## Casa de Outeiro (Alius Capital) · en camino → actualizar

- **La respuesta de la API es idéntica byte a byte a la del 01/11.** La FDF
  v5 y los anexos tienen el mismo SHA-256.
- **Estado de la campaña:** «Campaña», con botón «Invertir» y «Días
  restantes --». Lleva **1.121.000 € de un mínimo de 2.000.000 €**, sin
  avance desde el 01/11 (+5.000 € desde el 22/10).
- **Plazo:** la ficha de datos del 30/10 dice 31/03/2027. La campaña en
  Alius, la pestaña «Proceso» y la web del emisor siguen diciendo
  **31/10/2026, que ya pasó**. Además, las condiciones de Alius fijan un
  máximo de 6 meses de campaña.
- **Mínimo y precio:** 2.000 € (80 acciones de 25 €).
- **Registro de Alius:** PSFP nº 11 de la CNMV (03/11/2023), que sigue
  figurando como «Adventurees Capital PFP». Token City A.V. sigue en la CNMV
  con el nº 334. No hay advertencias para Alius, Adventurees, Token City ni
  Outeiro.
- Alius no tiene campañas nuevas: 1 en campaña y 2 cerradas.
- Re-fecho el aviso de conflicto al 03/11. **Si el 10/11 sigue igual,
  proponemos retirarla.**

## Hausera · próximas ofertas · en camino → actualizar

- **Próxima oportunidad:** Alicante 2. El banner dice «MAÑANA A LAS 9:00
  (ESP), PREVENTA DE ALICANTE 2»:
  - **preventa:** 04/11/2026 a las 09:00;
  - **oferta pública:** 11/11/2026;
  - **importe:** 5.196.000 €.
- **Conflicto:** la tarjeta del buscador sigue diciendo «PREVENTA:
  11/11/2026».
- **Documento de emisión:** la ficha de Alicante 2 pide iniciar sesión, así
  que no hay documento público. Según los términos, la preventa es una
  manifestación de interés no vinculante.
- **Operador:** HOLDTX SPAIN, S.L. declara no ser ESI y no figura como PSFP
  en la CNMV. No hay advertencias.
- **Nuevo y comprobado en la CNMV (pista de nuevas-espana):** hay **8
  emisiones de obligaciones tokenizadas** de SPV de Hausera inscritas en el
  registro ERIR. La entidad registradora es Ursus-3 Capital A.V., nº 251. Son
  de 5,07 a 7,99 M€ y se inscribieron entre febrero y septiembre de 2026.
  Alicante 2 no está. La CNMV avisa de que la inscripción no valida las
  condiciones de la emisión. Dejo una métrica opcional con este dato.
- **Mínimo:** la página de cotizadas de Hausera indica 1.000 € por
  participación. No consta que se aplique a Alicante 2.

## Candidatas

- **Emisión primaria abierta en Brickwise:** solo hay una, BILLA, que ya
  está publicada. La portada anuncia «Neue Immobilie: coming soon», sin datos.
  → no hay ninguna candidata nueva que admitir.
- **fotovoltaica-cargadores-parkhaus-q2-st-poelten → no_admitir** (igual que
  el 01/11). La app la muestra con «Handel aktiv» y «ab 507,62 €» (quedan 219
  de 460). Pero el contrato solo permitía suscribir en 2024, con prórroga
  máxima en 2025, y no hay órdenes de reventa.
- **hausera-eti-portfolio → no_admitir.** En Portfolio Stock Exchange cotizan
  tres ETI de ALTARIUS ETI AG con el nombre de Hausera, de nominal 1.000 €
  (HAUS al 96 %, HIII al 100 %, HMII al 102,9 %). Faltan:
  - el folleto o el KID del emisor;
  - su supervisor;
  - su relación con las obligaciones de Hausera;
  - las condiciones para particulares en España;
  - la comprobación del registro de Portfolio en la CNMV.

## Bloqueos que quedan

- Firmenbuch austriaco (es de pago); los números FN vienen de los documentos.
- La metodología del campo `sharePrice` de Brickwise no está documentada.
- No se sabe si se puede comprar solo una parte de una orden de venta.
- La prórroga de BILLA no tiene fecha publicada.
- El contrato de alquiler de BILLA solo está en imagen.
- No se puede saber, sin sesión, si Casa de Outeiro acepta órdenes después
  del 31/10.
- El documento de emisión de Alicante 2 no es público.
- El registro de Portfolio Stock Exchange en la CNMV no está comprobado y no
  he encontrado el folleto de ALTARIUS ETI AG.
- Para el coordinador: en el `.inventario.jsonl` de nuevas-europa pueden
  quedar líneas de 0 bytes con rutas de mi carpeta, de cuando falló el script
  compartido. No las he tocado porque no son mías.

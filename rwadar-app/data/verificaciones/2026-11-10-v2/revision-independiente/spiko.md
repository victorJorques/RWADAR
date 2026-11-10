# Revisión independiente · grupo spiko · 10/11/2026

Yo no preparé estos expedientes. He intentado refutar cada cambio abriendo
otra vez las fuentes primarias. Todas mis consultas son del 10/11/2026, entre
las **09:22 y las 09:31 UTC**. Solo he usado páginas, documentos, API y
registros públicos: no he iniciado sesión, no he hecho KYC y no he tocado los
expedientes. Las copias están en `fuentes/spiko/`: extractos en texto,
`inventario-revisor.json` con 72 entradas, y las respuestas en crudo en
`fuentes/spiko/crudo/`, fuera de Git.

## Veredicto

**Aprobado con cambios.** Confirmo los cambios de las tres fichas: las cifras,
las fechas, la retirada del aviso 7 de Spiko Euro y la nueva métrica
«Supervisor». Antes de copiar nada del grupo a Git hay que hacer **una
corrección obligatoria**: en una copia del grupo aparece el nombre de una
persona física (ver el apartado de datos personales).

| Ficha | Propuesta | Mi veredicto |
|---|---|---|
| spiko-letras-del-tesoro-euro | 2,39 % → **2,44 %** (VL del 09/11) | confirmado |
| spiko-letras-del-tesoro-dolar | 3,99 % → **4,09 %** en USD (VL del 09/11) | confirmado |
| spiko-smart-cash-euro | 2,84 % con fecha nueva; quitar el aviso 7; nueva métrica «Supervisor» | confirmado |
| Copias del grupo | sin datos personales | **corrección obligatoria** |

## 1. Cifras: las he recalculado yo

He usado la API pública de Spiko (09:22:25–09:22:31Z) y la serie de valores
liquidativos (VL) desde el 25/09. El cálculo está en
`fuentes/spiko/spiko-api-cifras-recalculo.txt`.

- **Letras del Tesoro Euro (EUTBL).** La API
  (`https://public-api.spiko.io/v0/share-classes/EUTBL/yield`, 09:22:25Z) da
  `"monthlyYield":"0.0244"` y `updatedAt 2026-11-09T16:23:58Z`. El último VL
  es 1,062624 € (día 09/11). Mi cálculo: de 1,060378 € (08/10) a 1,062624 €
  (09/11), 32 días con interés compuesto, sale **2,443 %**. Desde el VL
  fechado el 11/10 (29 días) también sale 2,443 %. La web en español
  (09:22:56Z) dice «2,44% | Rendimiento neto actual … de los últimos 31
  días». data.spiko.io/eutbl (09:22:58Z) dice «30d yield | 2.44%». GECO da
  un VL de 1,06262 € al 09/11. **Confirmado.**
- **Letras del Tesoro Dólar (USTBL).** La API (09:22:27Z) da `"monthlyYield":"0.0409"`
  y `updatedAt 2026-11-09T16:23:50Z`. El VL es 1,102439 $ (09/11). Mi cálculo:
  de 1,098694 $ (09/10) a 1,102439 $ (09/11), 31 días, sale **4,088 %**. La
  web dice «4,09% | Rendimiento neto actual». data.spiko.io/ustbl dice «30d
  yield | 4.09%». La cifra está en dólares. **Confirmado.**
- **Spiko Euro (eurSAFO).** La API (09:22:28Z) da `dailyYield`,
  `weeklyYield` y `monthlyYield` iguales a `"0.0284"`. El VL es 1,016874 €
  (09/11, `updatedAt 2026-11-09T17:19:16Z`). Mi cálculo: del 06/11
  (1,016796 €) al 09/11 hay un solo día de interés, porque el VL del viernes
  ya incluye el fin de semana. Eso da **2,839 %**. A 7 días sale 2,835 % y a
  32 días, 2,834 %. La web dice «Interés a tipo fijo | 2,84%» y data.spiko.io
  dice «2.84%». La cifra sigue siendo 2,84 % y solo cambian las fechas
  (VL del 09/11, consulta del 10/11). **Confirmado.**
- **Hora de recálculo.** `nextYieldTimestamp` = 1794333600, es decir, el
  10/11 a las 18:00 UTC (letras), y 1794339000, a las 19:30 UTC (Spiko Euro).
  Si la entrega se monta después de esas horas, la API ya dará el VL del 10/11.
  Las cifras del expediente siguen siendo correctas como «dato del 09/11».

## 2. Spiko Euro: aviso 7 y métrica «Supervisor»

- **La AMF ya publica la ficha del fondo.** API de GECO
  `…/back-office/funds/compartment/c124199` (09:23:15Z):
  `"published":true`, `"numDernAuto":"SCV20260075"`,
  `"dateDernAuto":"2026-02-17"`, `"cmpStatutLib":"Vivant"`,
  `"cmpSouscrDedLib":"Tous souscripteurs"`, gestora `TWENTY FIRST CAPITAL`,
  depositario `CACEIS Bank`, `dtDataHub 2026-11-09T04:50:45`. Página pública
  renderizada (`geco.amf-france.org/produit-d-epargne/c124199`, 09:23:37Z):
  «OPC : SPIKO AMUNDI OVERNIGHT SWAP FUND … N° Agrément/Visa : SCV20260075 ·
  Date d'autorisation : 17/02/2026 · Statut : Vivant», pero en las clases dice
  «Aucune part disponible». Las clases (`/shares`) vuelven vacías (`[]`) y
  `lastVl/FR0014015LD3` vuelve con 0 bytes: no hay VL.
- **El 05/11 la ficha salía vacía.** En la copia de entonces
  (`2026-11-05-v2/revision-independiente/fuentes/spiko/geco/geco-web-c124199.txt`)
  pone «OPC :» sin nombre y «Aucune part disponible». En la del 03/11, la API
  daba `"published":false`. El cambio es real.
- **Adónde lleva el enlace de Spiko.** El botón «Verificar la autorización»
  de `spiko.io/es/spiko-euro` (09:22:57Z) lleva a
  `https://geco.amf-france.org/produit-d-epargne/c124199`, que hoy sí enseña
  la ficha.
- **Conclusión.** El aviso 7 («allí este fondo todavía no tiene ficha
  publicada») ya no es cierto. Quitarlo es correcto. El texto nuevo de la
  métrica «Supervisor» coincide punto por punto con GECO y con la CNMV.
  **Confirmado.**

## 3. Pendiente: ¿se vende Spiko Euro en España?

He intentado refutar la conclusión «nadie lo confirma ni lo niega». No lo he
conseguido.

- **CNMV.** En `iicextranjera?nif=N0401205J` (09:24:25Z) sale «SPIKO SICAV |
  2380 | 30/01/2026 | SICAV | FRANCIA» y solo «Datos generales» y «Entidades
  comercializadoras». No hay lista de fondos. La vista 18 (09:24:26Z) da
  como comercializadora a «ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA DE
  VALORES».
- **GECO.** Ya publica el fondo, pero no dice en qué países se ha notificado.
- **Spiko.** La tabla de países de Spiko (`docs.spiko.io/…/fund_availability`,
  09:25:02Z) marca España en Smart Cash con «✅» («Last updated: October 23,
  2026»). Dice que se distribuye «where the share class has been registered».
  Es la palabra del proveedor, no la de un registro.
- **Búsqueda web** (hacia las 09:29Z, solo para descubrir): no aparece ninguna
  fuente que confirme ni que niegue la venta en España.
- **Conclusión.** El aviso 2 sigue siendo cierto y debe quedarse. No hay base
  para proponer la retirada.

## 4. Documentos y registros (lo que no cambia)

- **Documentos.** Los he bajado entre las 09:24:56 y las 09:25:01Z. Tienen la
  misma huella SHA-256 que el 05/11:
  - KID en español EUTBL `cb1a621d…`, USTBL `c1ce5400…` y eurSAFO `53effea2…`;
  - folleto en inglés `7457e79f…`;
  - folleto francés de GECO (438274) `940559b4…`;
  - certificado de la AMF `709e0585…`;
  - términos de uso `71dd7ba1…`.

  El folleto en español sigue dando **403** (09:24:59Z).
- **Avisos con contenido.** Siguen vigentes, con estas frases de hoy:
  - **Límite del 10 % (letras).** El KID en español dice «mecanismo de
    limitación de los reembolsos … umbral del 10 % del patrimonio neto». El
    folleto en inglés dice «threshold of 10% of net assets».
  - **Límite del 25 % (Spiko Euro).** El folleto de GECO dice «seuil de 25 %
    de l’actif net».
  - **Hora de corte.** Es a las 11:30 en las letras y a las 15:00 en Spiko
    Euro (KID en español).
  - **Lo que dice la web de Spiko Euro.** «Interés a tipo fijo», «Garantizado
    por contrapartes», «rendimiento diario garantizado», «BNP Paribas paga
    diariamente a Spiko Euro € STR + un 0,40%» y «Sociedad gestora | Amundi
    Asset Management».
  - **Página para particulares.** Dice «No existen límites de retirada».
  - **Fondo del dólar.** Su web dice que se atiende cualquier reembolso «sin
    preaviso y sin límite de importe», pero el folleto dice otra cosa. El
    aviso publicado sobre el límite del 10 % ya lo cubre.
- **Registros:**
  - **CNMV, Spiko Finance.** Spiko Finance SASU figura con el n.º 5325
    (14/01/2026). En la vista 17 consta que puede «Recepción y transmisión de
    órdenes … Participaciones y acciones en instituciones de inversión
    colectiva».
  - **REGAFI, autorización.** La API `id_referentiel=751211` (09:26:38Z) da
    `Spiko Finance · CIB 19183 (2025-12-15) · Entreprise d'Investissement`.
  - **REGAFI, pasaporte para España.** Da `ESPAGNE · Libre prestation de
    services · date_debut 2026-01-08` (09:25:56Z).
  - **AMF, los otros dos fondos.** GECO marca c79399 y c79398 como «Vivant» y
    «Tous souscripteurs», con VL del 09/11.
- **Advertencias de la CNMV** (09:24–09:29Z). Para «Spiko», «Twenty First
  Capital», «Amundi» y «Aldana» sale «No hay datos disponibles». El control
  con «Trading» devuelve resultados («Página 1 de 16»), así que la búsqueda
  funciona.
- **Mínimo y moneda.** La API da `minimumInitialSubscription "1"` en EUTBL,
  USTBL y eurSAFO. docs.spiko.io (09:30:55Z) dice «When you deposit euros
  into a USD or GBP product, your funds are automatically converted at
  execution».
- **Candidatas.** La API sigue teniendo 5 fondos y 14 clases, con los mismos
  símbolos que la copia del 01/11. No hay ninguna candidata nueva.

## 5. Los tres datos de la tarjeta (`resumenTarjeta`)

Los textos son los mismos que el 05/11. Los he vuelto a contrastar con las
fuentes de hoy. Todos están en castellano llano, tienen 120 caracteres o
menos y no usan «por participación/token/acción».

- **EUTBL:**
  - mínimo, 23 caracteres: lo respaldan la API y la web («Depósito inicial
    mínimo | €1»);
  - acceso, 94: lo respaldan la tabla de Spiko, la CNMV (n.º 2380) y REGAFI;
  - salida, 115: lo respalda el KID (11:30 y 10 %).
- **USTBL:**
  - mínimo, 73: lo respaldan la API y la conversión automática de euros
    (docs.spiko.io);
  - acceso, 94;
  - salida, 116: lo respaldan el folleto en inglés («public holidays in
    France or the United States») y el KID (11:30 y 10 %).
- **Spiko Euro:**
  - mínimo, 9;
  - acceso, 108: «Según Spiko, sí … ningún registro público confirma este
    fondo aquí». Sigue siendo cierto hoy: GECO publica el fondo, pero no su
    venta en España;
  - salida, 116: lo respaldan el KID (15:00), la página para particulares
    (T+1) y el folleto (25 %).

## 6. Datos personales en las copias del grupo: corrección obligatoria

- Los testimonios de `spiko-web-es-home.json` y
  `spiko-web-es-particulares.json` están bien recortados («[nombre
  recortado]»).
- **No están bien** `grupos/spiko/fuentes/SAFO_Letter_EN.txt`, en la línea 71,
  ni `grupos/spiko/fuentes/pdf/SAFO_Letter_EN.pdf`. Los dos llevan el
  **nombre y el cargo de la persona de la AMF que firma el certificado**. En
  este informe no reproduzco ese nombre.
- No he encontrado otros nombres de personas, correos personales ni
  teléfonos personales en los textos, JSON, KID ni términos del grupo. Los
  correos que aparecen son de organismos o del soporte de Spiko.

## Correcciones

**Obligatoria (antes de copiar el grupo a Git):**

1. En `grupos/spiko/fuentes/SAFO_Letter_EN.txt`, cambiar por «[nombre
   recortado]» el nombre del firmante de la AMF (línea 71). Mover
   `grupos/spiko/fuentes/pdf/SAFO_Letter_EN.pdf` a `grupos/spiko/fuentes/crudo/`.
   Aviso aparte: ese mismo nombre ya está en Git en las copias del 03/11 y del
   05/11, en los cuatro archivos `SAFO_Letter_EN.txt` de `2026-11-03.3-v2` y
   `2026-11-05-v2`. El coordinador decide si los recorta.

**Para montar la entrega (no cambian lo propuesto):**

2. **EUTBL.** La nota para el coordinador dice que en la documentación
   publicada siguen «NAV 1,0597 €, 1,0613 €, 467,94 M€, 444,52 M€». No es
   así: no aparecen ni en `2026-11-05.2-v2/documentacion-ofertas.json` ni en la
   lectura pública de hoy. Lo único antiguo que sigue publicado son las
   referencias del 30/09, del 22/10 y del 01/11. Hay que actualizar la
   referencia «Rentabilidad publicada · 31 días» a 2,44 % (dato del 09/11,
   consulta del 10/11). En USTBL, a 4,09 %. En Spiko Euro, el «Rendimiento
   neto publicado» va con fecha del 09/11, y la «Aprobación del compartimento»
   puede citar GECO c124199 (autorizado el 17/02/2026).
3. **Spiko Euro.** El expediente pone `disponibleEs: "confirmado"` y
   `compraDesdeEspanaComoParticular: "si"`, pero eso solo lo dice Spiko. El
   aviso 2 dice que ningún registro lo confirma. Recomiendo marcarlo como
   `no_confirmado` en el expediente. La tarjeta pública puede quedarse como
   el 05/11, con el aviso 2. No es un cambio nuevo de hoy.
4. **USTBL.** Es opcional y no es obligatorio. Se puede añadir al aviso del
   10 % «aunque la web de Spiko diga que no hay límite de importe», como ya se
   hace en Spiko Euro.

## Bloqueos

- Folleto de Spiko SICAV en español: **403 AccessDenied** (09:24:59Z). Lo he
  cubierto con el folleto en inglés y con el francés de GECO (SHA-256 iguales
  que el 05/11).
- REGAFI por SIREN: el proxy cortó la conexión 4 veces (09:25:46–09:26:22Z).
  Lo leí por `id_referentiel=751211` (09:26:38Z).
- La venta de Spiko Euro en España **no se puede comprobar** en ninguna
  fuente pública: ni la CNMV ni GECO publican los fondos o los países.
- GECO aún no publica las clases ni el VL de Spiko Euro.

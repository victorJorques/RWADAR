# Revisión independiente · grupo «principales» · 11/11/2026

Revisor independiente: no preparé estos expedientes. He intentado refutarlos
abriendo yo mismo las fuentes primarias el 11/11/2026, entre las **09:40 y las
09:54 UTC**. Solo páginas, documentos, API, registros públicos y lectura en
cadena (eth_call). Sin sesiones, sin KYC, sin wallets, sin formularios.

Copias en `fuentes/principales/` (crudos en `fuentes/principales/crudo/`),
con `inventario-consultas.json` (URL, hora UTC, código HTTP, bytes y SHA-256)
y `extractos-documentos.txt` (los literales de los PDF que uso abajo).

## Resultado en una frase

Las cuatro cifras nuevas se sostienen hoy en su fuente: Spiko Euro **2,41 %**,
Spiko Dólar **4,02 %** (en USD), Spiko Euro (Smart Cash) **2,84 %** con la VL
del 10/11 y mTBILL **1,0777 USD**. Robinhood, Kraken y Prosegur siguen igual.
**Hay que corregir una cosa antes de seguir:** cuatro copias de texto del grupo
conservan el nombre completo de un administrador del emisor de xStocks (ver
«Datos personales»).

**Veredicto global: aprobado con cambios.**

| Ficha | Lo que propone el grupo | Veredicto |
|---|---|---|
| Spiko Letras del Tesoro Euro | 2,44 % → 2,41 % (VL fechada el 11/11) | confirmado |
| Spiko Letras del Tesoro Dólar | 4,09 % → 4,02 % en USD (VL del 10/11) | confirmado |
| Spiko Euro (Smart Cash) | 2,84 %, nueva fecha (VL del 10/11) | confirmado (con una condición de hora) |
| mTBILL | 1,0776 → 1,0777 USD (10/11) | confirmado con cambios |
| Robinhood Classic Stock Tokens | sin cambios | confirmado |
| Kraken xStocks | sin cambios | confirmado |
| Prosegur Digital Gold | sin cambios | confirmado |
| Copias del grupo sin nombres de personas | «recortados» | **rechazado** (hay que recortar) |

No hay `admitir_propuesta` ni `retirar_propuesta` en este grupo.

## 1. Spiko Letras del Tesoro Euro: 2,41 % (confirmado)

- API de Spiko, 09:40:47: `https://public-api.spiko.io/v0/share-classes/EUTBL/yield`
  → `"monthlyYield":"0.0241"`, `"updatedAt":"2026-11-10T17:55:23.019Z"`.
- API, 09:40:48: `.../net-asset-values/EUTBL/latest` → `"day":"2026-11-11"`,
  `"value":"1.062738"`.
- AMF (GECO), 09:44:28: `https://geco.amf-france.org/back-office/funds/lastVl/FR001400ODL1`
  → `"valuationDate":"2026-11-11"`, `"netAssetValue":1.06274`, enviada el
  10/11 a las 19:05. La fecha «11/11» de la VL la dan Spiko y la AMF.
- Mi cuenta con la serie de la API (09:40:48): VL 11/10 = 1,060588 € y VL
  11/11 = 1,062738 €, 31 días → (1,062738 / 1,060588)^(365/31) − 1 = **2,4131 %**.
- data.spiko.io/eutbl, 09:41:22: «30d yield 2.41% … Latest NAV 1.0627
  2026-11-11». La web en español con JavaScript (09:41:55): «2,41%
  Rendimiento neto actual … últimos 31 días».
- El HTML sin JavaScript sigue diciendo «2,44%» (caché): mismo SHA-256 que la
  copia del grupo (`d220ef0d…`). No cuenta como cifra de hoy.
- KID ES (`cb1a621d…`), KID EN (`ac3c5d83…`), folleto EN (`7457e79f…`) y
  términos v2.2 (`71dd7ba1…`): mismos SHA-256 que el 10/11. Folleto ES: 403.
- Avisos: el folleto sigue diciendo «redemption cap when a threshold of 10% of
  net assets» (mismo archivo). Siguen vigentes.
- `resumenTarjeta` (sin cambios respecto al 10/11; 23/94/115 caracteres):
  respaldada por la web («Depósito inicial mínimo €1»), la tabla de países de
  docs.spiko.io (España ✅ en las tres columnas, «Last updated: October 23,
  2026», 09:49:36) y el KID («a más tardar a las 11:30 (hora de París)»).

## 2. Spiko Letras del Tesoro Dólar: 4,02 % en USD (confirmado)

- API, 09:40:49: `.../share-classes/USTBL/yield` → `"monthlyYield":"0.0402"`,
  `"updatedAt":"2026-11-10T17:57:30.192Z"`; `.../USTBL/latest` →
  `"day":"2026-11-10"`, `"value":"1.102496"`.
- AMF, 09:44:28: `lastVl/FR001400ODM9` → `"valuationDate":"2026-11-10"`,
  `"netAssetValueInCurrency":1.1025`.
- Mi cuenta: 31 días antes del 10/11 es sábado; la VL anterior más cercana es
  la del viernes 09/10 (1,098694 $), 32 días → **4,0189 %**.
- data.spiko.io/ustbl (09:41:22): «30d yield 4.02%». Web con JavaScript
  (09:42:04): «4,02% Rendimiento neto actual».
- El aviso «aunque la web de Spiko diga que no hay límite de importe» sigue
  siendo cierto: el HTML de la página (09:42:47) dice «sin preaviso y sin
  límite de importe». El folleto sigue con el tope del 10 %.
- KID ES `c1ce5400…`, igual que el 10/11.
- `resumenTarjeta` (73/94/116 caracteres): la web dice «Depósito inicial
  mínimo $1» y «se convertirán automáticamente a dólares sin comisiones de
  cambio». Correcta.

## 3. Spiko Euro (Smart Cash): 2,84 % con la VL del 10/11 (confirmado)

- API, 09:40:50: `.../eurSAFO/yield` → `"dailyYield":"0.0284"`, igual que la
  semanal y la mensual; `.../eurSAFO/latest` → `"day":"2026-11-10"`,
  `"value":"1.016952"`, actualizada el 10/11 a las 19:42:58.
- Mi cuenta: VL 09/11 1,016874 € → VL 10/11 1,016952 €, un día →
  **2,839 %**; a 7 días, 2,835 %. El literal de la tarjeta («lo que creció el
  fondo en su último día de cálculo, pasado a un año») describe bien la cifra.
  Ojo: data.spiko.io la llama «30d yield 2.84%». Como la API da el mismo
  0,0284 para 1, 7 y 30 días, la cifra sirve para las dos lecturas.
- €STR del BCE (09:44:44): 10/11 = 2,442 %.
- Web con JavaScript (09:42:12): «Interés a tipo fijo 2,84% Garantizado por
  contrapartes», «Sociedad gestora Amundi Asset Management». Página
  Particulares (HTML, 09:42:47): «No existen límites de retirada». Los avisos
  3 a 6 siguen siendo ciertos. El folleto de GECO (`940559b4…`, igual que el
  10/11) dice «seuil de 25 % de l’actif net».
- ¿Lo confirman ya la CNMV o la AMF? **No.** CNMV (09:43:12): «SPIKO SICAV ·
  2380 · 30/01/2026 · SICAV · FRANCIA», el mismo texto que el 10/11. AMF:
  `compartment/c124199/shares` → `[]` y `lastVl/FR0014015LD3` vacío (09:44:29);
  la lista de documentos de GECO es idéntica a la del 10/11 (`7e75c86c…`). El
  botón de la CNMV de la web lleva a la ficha n.º 5325 (Spiko Finance), no al
  fondo. El aviso 2 sigue en pie.
- **Condición de hora (obligatoria):** la API de fondos (09:51:03) ya no marca
  el 11/11 como día no operativo para este fondo (los otros cuatro sí) y anuncia
  el próximo cálculo a las **19:30 UTC** de hoy (`nextYieldTimestamp
  1794425400`). Si la entrega se monta después de esa hora, hay que volver a
  leer la API y fechar con la VL del 11/11. Las dos letras del Tesoro no cambian
  hasta el 12/11 a las 18:00 UTC.
- `resumenTarjeta` (9/108/116 caracteres): correcta y prudente.

## 4. mTBILL: 1,0777 USD (confirmado con cambios)

- Lectura en cadena (eth_call en `https://ethereum-rpc.publicnode.com`,
  09:45:57, bloque 26.390.871): el oráculo `0x0563…2E5b` dice de sí mismo
  «mTBILL/USD» (8 decimales). Ronda **492**, `answer 107768132` =
  **1,07768132 USD**, actualizada el **10/11 a las 18:40:23**. La ronda 491
  valía 1,07756597 USD (09/11 14:23:59). Redondeo correcto: 1,0776 → **1,0777**.
- El token `0xdd62…e438` dice «mTBILL». Token, emisión y reembolso sin pausa.
  `instantFee()` = 7, es decir, 0,07 %. Hay 66,14 M de mTBILL.
- Mismo SHA-256 que el 10/11 en las Condiciones Finales (`b1e58001…`), el KID
  en español (`6c22870917…`) y llms-full.txt (`aca8b6c7…`). La página de
  pasaportes de la CNMV es idéntica byte a byte (`de12b98c…`). ESMA (09:47:24):
  3 documentos del ISIN y 41 del emisor. La FTWS-1420 incluye a SPAIN entre los
  Estados miembros.
- Conflicto de reembolso, sin cambios. Condiciones Finales: «Redemption Gates
  25% … Holdback Percentage up to 5%». KID: «no reembolsará más del 15 % … hasta
  el 50 %». El estado sigue en «fuentes_en_conflicto» y el APY en null.
- Acceso desde España. He confirmado lo que dicen las Condiciones Finales:
  «Offer(s) to the Public … Spain» y «retail clients». También el pasaporte de
  la CNMV y ESMA. La parte de la **web** («España entre los 14 países
  permitidos») **no la he podido leer**:
  - midas.app/mtbill da 403 (Cloudflare), 09:46:15;
  - a las 09:46:42, midas.app ya carga **otro** código (`main-BAiQCjKx.js`), no
    el `main-DWqV5Q2W.js` que leyó el grupo a las 09:26;
  - los permisos de la sesión **denegaron** que lo descargara (y también el
    antiguo).

  La copia del grupo de las 09:26 sí contiene la frase «… Romania, Spain, and
  Sweden (the “Permitted Jurisdictions”)».
- `resumenTarjeta` (41/106/107 caracteres): mínimo y salida correctos (FT
  «Minimum Investment Amount not applicable»; KID y FT para los topes).

## 5. Fichas sin cambios (las tres, comprobadas con la fuente de hoy)

- **Robinhood.** Los seis PDF tienen el mismo SHA-256 que el 10/11 (09:47:45–47):
  - KID EU `d744e3ac…`;
  - KID ES `84f4f0a8…`;
  - tarifas `614b0f5b…`;
  - descripción EN `4e3ab0a2…`;
  - descripción ES `75f905ae…`;
  - términos `5993f856…`.

  La página en español dice lo mismo que el 10/11 (texto idéntico, 09:47:48):
  «Una comisión por cambio de divisas del 0,1 % cubre todo … Empieza con tan
  solo 1 euro … 24/5». El Banco de Lituania también da el mismo texto. La
  CNMV (09:43:15) dice «5299 · 21/04/2025 · LITUANIA».
- **Kraken xStocks.** Las condiciones finales de SPYx (`280159d4…`), AAPLx
  (`ad7f3be6…`) y LITEx n.º 159 (`85b56d11…`) son las mismas que el 10/11 y
  dicen «The Products will be offered in Liechtenstein and Switzerland»
  (09:48:13–15). ESMA (09:48:15): 1.730 documentos del emisor; los últimos son
  condiciones finales del 03/11, actualizadas el 04/11, sin suplementos
  nuevos. La página de Kraken UE en español tiene el mismo texto que el 10/11
  (09:48:20). La página de pasaportes de la CNMV es idéntica byte a byte
  (`d99d668e…`). La CNMV (09:43:17) dice «4474 · 05/01/2018 · CHIPRE». Los
  avisos siguen en pie.
- **Prosegur Digital Gold.** El contrato (render, 09:48:49) tiene el mismo
  texto, carácter por carácter, que la copia del 10/11. Dice: «Actualizado el
  08/07/2026», «Precio LBMA diario + 4% / − 6%», «1 a 7 días hábiles
  aproximadamente» y «EL PRODUCTO TOKEN DE ORO NO ES UN PRODUCTO FINANCIERO».
  La relación de la CNMV (`188c6935…`) y el CSV de ESMA (`fd255f54…`) son
  idénticos al 10/11.

## 6. Advertencias de la CNMV (09:43:34–09:44:02)

Busqué estos nombres:

- Spiko, Twenty First Capital y Amundi;
- Robinhood;
- Kraken, Payward, Backed y xStocks;
- Prosegur;
- Midas y Midas Software.

Todos dan «No hay datos disponibles». La búsqueda de control «Trading»
devuelve «Página 1 de 16», con una entrada del 10/11/2026, así que el
buscador funciona.

## 7. Datos personales en las copias del grupo (rechazado: hay que corregir)

- Los expedientes, el resumen y el inventario del grupo no tienen nombres de
  personas.
- **Fallo.** El resumen del grupo dice que recortó los nombres de los
  administradores en las condiciones finales de Backed. No los recortó todos.
  En el resumen en francés, el nombre completo de un administrador está partido
  con guion al final de una línea, y el recorte no lo detectó. Aparece en
  cuatro copias de texto de `grupos/principales/fuentes/` (fuera de `crudo/`):
  - `backed-ft-SPYx.txt`, líneas 2911–2912;
  - `backed-ft-JBBBx.txt`, líneas 2829–2830;
  - `backed-ft-LITEx-159.txt`, líneas 2997–2998;
  - `backed-ft-CH1580494602.txt`, líneas 2776–2777.

  En las cuatro, el nombre empieza al final de una línea y termina al principio
  de la siguiente, justo antes del primer «[nombre recortado]». No copio el
  nombre aquí.
- En `grupos/principales/fuentes/crudo/spiko-web-es-particulares.html` siguen
  los nombres de tres testimonios. La copia legible
  (`spiko-web-es-particulares.json`) sí está recortada. La carpeta `grupos/` del
  ciclo está en `.git/info/exclude`, pero conviene recortarlo también.
- Mis copias: he recortado los nombres en las páginas de Spiko y Prosegur
  guardadas. No he guardado:
  - el HTML de la página Particulares de Spiko, que tiene nombres hasta en los
    archivos de imagen;
  - los PDF ni el texto completo de los documentos que nombran a
    administradores: las condiciones finales de Backed y de mTBILL y los
    folletos de Spiko.

  Su SHA-256 está en el inventario y sus literales, en
  `extractos-documentos.txt`.

## Bloqueos del revisor

- **Código de midas.app.** Los permisos de la sesión denegaron la descarga del
  código de la web (`main-BAiQCjKx.js` y `main-DWqV5Q2W.js`) hacia las 09:47
  UTC. No he intentado otra vía. Lo que se haya restablecido no cubre esta
  descarga. No he podido confirmar hoy, en la fuente, la frase de la web sobre
  España (mTBILL).
- midas.app/mtbill y docs.midas.app/…/mtbill: 403 (Cloudflare). No he intentado
  sortearlo.
- Folleto de Spiko en español: 403 AccessDenied (09:44:58).

## Correcciones obligatorias

1. **Copias del grupo:** recortar el nombre partido con guion en las cuatro
   copias `backed-ft-*.txt` de `grupos/principales/fuentes/` (resumen en
   francés). Recortar también los nombres de los testimonios en
   `crudo/spiko-web-es-particulares.html`, o no subir nunca ese crudo.
2. **Spiko Euro (Smart Cash):** si la entrega se monta después de las 19:30
   UTC del 11/11, volver a leer la API y fechar con la VL del 11/11. Antes de
   esa hora, el dato del grupo vale tal cual.
3. **mTBILL:**
   - En el expediente, el claim que se apoya en la web debe decir que el código
     `main-DWqV5Q2W.js` se leyó a las **09:26 UTC**.
   - A las 09:46, midas.app ya cargaba `main-BAiQCjKx.js`, que nadie ha leído.
   - Si antes de montar la entrega nadie puede comprobar el código nuevo, la
     frase «la web de Midas incluye España entre sus países permitidos» debe
     apoyarse solo en la lectura de las 09:26, con esa hora. Si no, se quita
     del acceso y queda: oferta pública en España para particulares, según las
     Condiciones Finales, ESMA y la CNMV. Esa parte la he confirmado hoy.

Sin otras correcciones. Las cifras, las fechas de las métricas, los literales
de rentabilidad y los tres textos de `resumenTarjeta` de las fichas que cambian
cumplen las normas: castellano llano, 120 caracteres como mucho y fuente
primaria.

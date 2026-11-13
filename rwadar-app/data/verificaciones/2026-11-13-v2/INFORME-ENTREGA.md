# Entrega del catálogo 2026-11-13 · puesta al día del día

Preparada el 13/11/2026 por Claude (montador de datos y SQL), entre las 09:00
y las 09:35 UTC, y **corregida tras la revisión de la entrega entre las 14:36
y las 15:00 UTC (§9)**. **Nada aplicado en Supabase, nada publicado, sin OTA,
ningún flujo lanzado; el montador no hizo commit ni push.** Estado:
**preparada, revisada, corregida y probada en local** (PGlite y un ensayo
completo de «después de aplicar» en una copia aparte). La revisaron tres
expertos (contenido: aprobado; SQL y cumplimiento: aprobado con cambios).
Falta el auditor.

> La coordinación fue guardando copias de trabajo de estos archivos en los
> commits `d1463ee` (09:14 UTC: datos, SQL y guiones), `cb86f77` (los de
> después de aplicar) y `bed9752` (un borrador de este informe, aún sin las
> pruebas). Los datos y el SQL no han cambiado desde `d1463ee` (lo comprueba
> la doble pasada de §5); después cambian solo `pruebas-locales.json` (el de
> la pasada del ensayo), `ensayo-despues.json` (nuevo) y este informe.

**La revisión vigente es la `434217eb-9b7f-1cd9-a851-fbde7bced2bf`**
(SHA-256 de `aplicar-y-aprobar.sql` `b6f0129c…e7b4`). La `66907add` que
revisaron los expertos queda sustituida: la corrección O1 de cumplimiento
(Pottendorfer: la orden de 73 € ya no existe) cambia el SQL (§9). Los §1 a §8
cuentan la versión `66907add`; la corrección, las pruebas de después y los
pasos para aplicar la nueva están en §9.

Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md`, con las
correcciones obligatorias de su §4. Los textos, fuentes y fechas salen de
`expedientes/` y de `revision-independiente/`. Sin altas ni retiradas: las
mismas **22 ofertas** (8 principales, 13 de reventa y 1 en camino) y **25
plataformas**. Hoy **no** se toca `public.plataformas` ni `public.fuentes`.
Las noticias y el gráfico de la tokenización no son parte de esta entrega.

## 1. Partida

- **Lo publicado.** Leído como visitante (REST de Supabase con la clave
  publicable, solo GET) el 13/11/2026 de 08:27:43 a 08:27:47 UTC, en
  `lectura-publica/`: revisión **`a58dd22d-98a3-f94e-ba66-46898162215a`**
  (entrega `2026-11-12`), 25 plataformas, 22 ofertas (8/13/1), verificadas el
  12/11, y 30 filas en `public.plataformas` (25 en el radar y 5 descartadas).
- `preparar-entrega.mjs` lo comprueba antes de cambiar nada:
  - la `2026-11-12` local da exactamente la revisión publicada y su huella
    `a58dd22d98a3f94eba6646898162215af1ea3d4faefbeaf46e14d9ac18b1ee21`, y su
    `revision.json` dice lo mismo (último día vigente, el 19/11);
  - el catálogo sincronizado de la web
    (`rwadar-site/assets/catalogo-publico-20261022.js`) es esa revisión
    (25/22, verificadas el 12/11);
  - lo leído hoy coincide con la base local: documentación, fuentes,
    colección, fecha, estado y avisos de las 22 ofertas; la verificación de
    las 25 plataformas; y las filas de `public.plataformas`;
  - el radar de hoy: 69 de 69 fuentes (`radar-contraste-2026-11-13.json`,
    sin bloqueos); cada comprobación de `comprobaciones-fuentes.json` está en
    los literales capturados; las dos de REGAFI se leyeron por su API pública
    a las 08:52 UTC (`cambios-radar.json`), con las copias de `radar-manual/`
    (las dos con el mismo SHA-256 que el 12/11); la lista de la OCC es ya la
    del 31/10 y sigue con Paxos; Centrifuge, recapturado, está bien.

## 2. Revisión, huella, SHA-256 y vigencia

| Qué | Valor |
|---|---|
| Etiqueta | `2026-11-13` |
| Revisión nueva | **`66907add-8ebf-424b-3e04-b73e47b0c537`** |
| Huella (contenido) | `66907add8ebf424b3e04b73e47b0c5378fe5bbd6bafab0bc51da08de26f06e36` |
| SHA-256 de `aplicar-y-aprobar.sql` | **`7be64e861af7ba2895f07cedbb73a1e85a9dec055412aa27081e20a401d16961`** |
| SHA-256 de `catalogo.sql` | `85ad96a83a7cd5c6bc71a6a59a0a1e9c6e0de16717b740ad44dfaa0f6c33b379` |
| SHA-256 de `revision.json` | `a336306de4b695e180ea7025d5f547f19052c77e8a9513954812c8ba45e787c4` |
| Fichas | `verificadaEl` 13/11/2026 y 7 días: **último día vigente el 20/11/2026**; caduca el 21/11 |
| Radar | `verificadoEl` 13/11/2026, 69 fuentes (69/69) |

Una edición posterior del SQL invalida esta revisión y sus pruebas hasta
repetirlas.

**Condición de hora de Spiko.** Las tres cifras van con la VL del 12/11. La
API anuncia la siguiente VL de las Letras hoy a las 18:00 UTC y la de Smart
Cash a las 19:30 UTC. Montada a las 09:00–09:35 UTC: son las últimas. Si se
aplica después de esas horas, las cifras siguen siendo ciertas con su fecha
(VL del 12/11), pero ya no las últimas.

## 3. Qué cambia (antes → ahora)

81 cambios en 18 fichas, todos en `contraste-2026-11-13.json` («cambios»).
Cada «antes» se exige tal cual en el script: si no estuviera, falla.

### Spiko

| Ficha | Antes | Ahora |
|---|---|---|
| Letras del Tesoro Euro | 2,41 % (VL del 11/11) | **2,40 %** (VL del 12/11, 1,062803 €) |
| Letras del Tesoro Dólar | 4,02 % en USD (VL del 10/11) | **3,98 % en USD** (VL del 12/11, 1,102694 $) |
| Smart Cash Euro | 2,84 % (VL del 11/11) | **2,84 %** (VL del 12/11, 1,017107 €) |

- En las tres cambian la cifra (o la fecha), el literal de la rentabilidad
  (el del expediente), la métrica («Rentabilidad publicada · 31 días ·
  12/11/2026: 2,40 %», «… · 12/11/2026 · en USD: 3,98 %» y «Rentabilidad
  publicada · neta y variable · 12/11/2026: 2,84 %») y la referencia de la
  ficha («Rentabilidad publicada · 31 días» o «Rendimiento neto publicado»,
  con fecha del dato 12/11 y consulta 13/11).
- El script recalcula las cifras con la serie de VL: (1,062803 / 1,060664)
  elevado a 365/31, menos 1 = **2,40 %**; (1,102694 / 1,099159) elevado a
  365/30, menos 1 = **3,98 %** (el 12/10 fue festivo en EE. UU.: la base es
  la VL del 13/10). Lo mismo que leyó el revisor en la API a las 08:45 UTC.
- **Corrección obligatoria (DECISIONES §2 y §4):** la tabla de países de
  Spiko dice hoy «Last updated: November 6, 2026». En las tres, la
  referencia «Acceso desde España» pasa de fecha del dato 2026-10-23 a
  **2026-11-06**; en Smart Cash, su alcance «Tabla de disponibilidad de Spiko
  (23/10/2026)» pasa a **«(06/11/2026)»**. El texto que ve el inversor no
  cambia («Disponible para residentes en España…»). Las referencias
  históricas «· consulta 01/11/2026» se quedan como están (lo dice el
  revisor).

### mTBILL, Robinhood, Kraken xStocks y Prosegur Digital Gold

Sin cambios: solo la fecha de verificación (13/11) y la de sus avisos. En
mTBILL, la ronda 492 del oráculo (10/11, 18:40 UTC) sigue siendo la última;
el script recalcula los 3,45 % (rondas 468 → 492, 35,18 días) con las
lecturas del revisor. Sigue en «fuentes_en_conflicto» (reembolso 25 % / 15 %).

### Aktionariat, Boss Info y Switzerlend

Solo fechas, con los textos publicados de acceso y salida:

- «Precio del emisor · 13/11/2026: 7,25 CHF por acción (fijo)» y
  «Supervisor … FINMA (13/11/2026)» en Aktionariat; el aviso «… 6,20 ZCHF
  frente a 7,25 CHF el 13/11/2026».
- Boss Info: «Supervisor … (13/11/2026)», el aviso «… venta más barata 8,40
  ZCHF el 13/11/2026», el mínimo «100 CHF por transferencia al emisor; en
  cripto, desde 2 acciones (unos 17 ZCHF el 13/11)» y la referencia
  **«Última operación · 13/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)» con la
  fuente del portal `https://shares.bossinfo.com/`** (corrección del revisor:
  la API `getTrades` que proponía el expediente da 405). Su alcance dice lo
  que se comprobó hoy: el portal y el historial, igual byte a byte que el del
  12/11 (investigador), y en la cadena de bloques la operación y lo que
  recibió quien vendió, 8,2404 ZCHF (revisor, 08:45:52 UTC). Ya no dice «se
  comprobó el 10/11 y hoy no se ha vuelto a leer».
- Switzerlend: el mínimo «1 acción (68,01 CHF el 13/11)», «Supervisor …
  (13/11/2026); afiliada a PolyReg…» y sus dos avisos al 13/11/2026.
- **Corrección obligatoria (horas de consulta):** en los tres expedientes,
  79 de 82 horas de consulta están copiadas del 12/11 (26 de 27, 26 de 27 y
  27 de 28, como dice el revisor). El script toma la hora real de cada
  consulta del inventario del grupo (`grupos/suiza/inventario-consultas.json`,
  de 08:31:15 a 08:34:28 UTC) y la deja en `contraste-2026-11-13.json`
  («horasRealesSuiza», 82 entradas). Comprueba, archivo a archivo, que
  **ninguna hora copiada** (las 00:3x UTC) llega a la entrega.

### Brickwise (11 de reventa)

Libro de órdenes de la API a las 08:30:44 UTC y app a las 08:33 UTC; el
revisor lo leyó a las 08:41:37 UTC (mismo archivo) y lo calculó por su cuenta:
el script exige que su cálculo dé lo mismo, ficha a ficha.

| Ficha | Mínimo de la tarjeta | Lo demás que cambia |
|---|---|---|
| Pottendorfer Straße 62 | **80 € → 73 €** (13/11) | Venta más barata 80 € (11, orden del 08/02/2026) → **73 € (1, orden del 12/11/2026)**; orden de menor importe 1 × 115 € (116,73 €) → **1 × 73 € (74,10 € con el 1,5 %)**; «Participaciones en venta» 107 pasa del 11/11 al 13/11 |
| Cohotel | 102 € (solo la fecha) | Participaciones en venta **65 → 59** |
| GreenPoint | 102 € (solo la fecha) | Participaciones en venta **351 → 347** |
| Schwarzer Weg 18 | 69,90 € (solo la fecha) | Participaciones en venta **300 → 299** |
| Randhartingergasse 9 | 78 € (solo la fecha) | Mejor oferta de compra **56 € → 64 €** (1, orden del 12/11/2026) |
| Hinterstoder, Drautalresidenz, Klagenfurt, Plüddemanngasse, Sonnleithnergasse y Stallhofstraße | mismo precio (solo la fecha) | nada: las cuatro referencias del libro, re-fechadas al 13/11 con el mismo texto |

- En las 11, «Venta más barata», «Orden de venta de menor importe»,
  «Participaciones en venta» y «Mejor oferta de compra» pasan a «· 13/11/2026»
  con el texto del libro de hoy. El script comprueba que las cifras que
  cambian son exactamente las seis de DECISIONES §2.
- El aviso común (compra parcial no confirmada y 1,5 % del comprador) sigue
  igual, en su sitio; los demás avisos, métricas, acceso, salida y resumen,
  iguales.

### Hausera (solo re-fechas de lo consultado hoy)

- Aviso: «… El **13/11/2026** Alicante 3 aún no estaba inscrita en el
  registro de la CNMV» (registro ERIR de Ursus-3, 08:30:41 UTC).
- Mínimo: «Desde 100 € en Alicante 3, según su documento de emisión
  (**13/11**); la preventa abre el 18/11.» (documento leído a las 08:36:16
  UTC, mismo SHA-256); su alcance dice «El 13/11/2026 aún no se podía
  invertir…».
- «Historial publicado · 13/11/2026: 42 operaciones, 24 terminadas, 128 M€
  financiados» (portada, 08:33:41 UTC).

### Radar

Solo fechas: `verificadoEl` 13/11, cada fuente consultada el 13/11 y el
alcance «Revisión editorial de fuentes primarias del 13/11/2026…». Ninguna
dirección ni texto cambia; las 25 plataformas, iguales salvo las fechas.

### Después de aplicar (`despues-de-aplicar.mjs`, en `transparencia.json`)

- Revisión, lote y `verificadaEl` de las 22, al 13/11.
- «Supervisada» y «documento para España»: 43 de 44 pasan al 13/11 (solo
  donde el expediente de hoy volvió a consultar esa fuente). Se queda la de
  mTBILL «supervisada» (BaFin, 10/11: hoy no se consultó). En las suizas,
  además, solo si la fuente tiene hora real de hoy: Aktionariat 08:31:39 y
  08:31:24, Boss Info 08:33:29 y 08:33:37, Switzerlend 08:32:34 UTC.
- 11 títulos de puntos fuertes de Brickwise, al 13/11.
- Mínimos cortos: Brickwise «Desde X € la participación (13/11)»
  (Pottendorfer 80 → **73**), Switzerlend «1 acción (68,01 CHF, 13/11)»,
  Hausera «Desde 100 € en Alicante 3 (13/11)»; y el motivo de «Documento
  para España» de Hausera, «… el 13/11/2026 la emisión aún no estaba
  inscrita».
- Si el catálogo sincronizado no es la `66907add`, no toca nada.

## 4. El SQL

`aplicar-y-aprobar.sql` (425.821 bytes) lleva **288 sentencias en una sola
transacción** `begin isolation level serializable; … commit;`:

| Bloque | Qué hace |
|---|---|
| `do $guarda$` (solo lee) | Exige que lo publicado sea la `a58dd22d` (o ya la nueva), con su huella y aprobada; que el catálogo no esté retirado; que no sea antes del 13/11 ni después del **20/11**; y que la revisión nueva no exista con otra huella. |
| 284 `insert … on conflict do nothing` | Solo en `rwadar_catalogo`: 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`, 107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en `ofertas`. Todas de la revisión nueva; las mismas filas por tabla que la `2026-11-12`. |
| `do $aprobar$` | Comprueba 25 plataformas y 22 ofertas (8/13/1) y aprueba la revisión (solo `update rwadar_catalogo.revisiones`). Si no queda publicable o publicada, deshace todo. |

Sin DDL, borrados, permisos, Auth ni funciones. El texto del SQL no escribe en
`public.*`; al aprobar, como en todos los lotes, los disparadores mueven el
puntero `rwadar_catalogo.publicacion_v2` y tocan
`public.catalogo_publicacion.actualizado_el` (`retirado` sigue en `false`).
La cabecera y `aprobada_referencia` dicen «el responsable del proyecto», sin
nombres de personas.

## 5. Pruebas (salida real)

Todas sin red y sin tocar Supabase. Las pesadas (ensayo y `npm test`), en una
copia aparte del repositorio en el scratchpad
(`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/ensayo-2026-11-13`).

### 5.1 `preparar-entrega.mjs`, dos veces (reproducible byte a byte)

```
pasada 1 09:19:09
{"etiqueta":"2026-11-13","revisionId":"66907add-8ebf-424b-3e04-b73e47b0c537","hash":"66907add8ebf…26f06e36","previa":"a58dd22d-98a3-f94e-ba66-46898162215a","sha256":"7be64e86…6961","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":81,"noAplicado":4,"horasRealesSuiza":82}
exit 0
pasada 2 09:19:09
(la misma línea)
exit 0
8 de 8 salidas idénticas (SHA-256)
```

| Salida | SHA-256 |
|---|---|
| `radar-canonico-26.json` | `79683038afbd58b840d57a04e803b438905888336483d44245c39c05dfd2acc9` |
| `escaparate-publicacion.json` | `a1bebcc85726206c17b580f90b7202553564c0cc844a7b53fa3dfae56337f193` |
| `documentacion-ofertas.json` | `a1cbcb23693e480df9b85d4b9cd00e0c458e547383f690abf9388b7c30b34fa9` |
| `manifiesto-catalogo.json` | `c2c51919a4cf00d66a58cea8f7d24d2091ada39bec80141ce94427766c3c4224` |
| `contraste-2026-11-13.json` | `c473ab8cffe7bba7493cb211fb7bfa7e44f6abfadb550e0d347c5188567ae344` |
| `catalogo.sql` | `85ad96a83a7cd5c6bc71a6a59a0a1e9c6e0de16717b740ad44dfaa0f6c33b379` |
| `aplicar-y-aprobar.sql` | `7be64e861af7ba2895f07cedbb73a1e85a9dec055412aa27081e20a401d16961` |
| `revision.json` | `a336306de4b695e180ea7025d5f547f19052c77e8a9513954812c8ba45e787c4` |

Son las mismas que las de la primera pasada de la mañana y las de `d1463ee`.

### 5.2 `comprobar-entrega.mjs` (PGlite, sobre la cadena de producción)

`exit 0`, «resultado: correcto», **19 comprobaciones y 6 casos de fallo**
(`pruebas-locales.json`, pasada del ensayo a las 09:15:57 UTC; la de la
carpeta de trabajo, a las 09:13 UTC, dio lo mismo sin la exportación):

- **Inventario:** 288 sentencias (begin, guarda, 284 inserts, aprobación,
  commit); solo `rwadar_catalogo`; las mismas filas por tabla que la
  `2026-11-12`; idempotentes; sin DDL, borrados, permisos, Auth ni funciones.
- **Cadena:** seed de antes de ARTEX + 17 lotes (22/10 → 2026-11-12): la
  publicada es la `a58dd22d`.
- **Antes de aplicar**, PGlite enseña lo mismo que se leyó como visitante a
  las 08:27:43–08:27:47 UTC (25/22, 8/13/1, 30 filas de `public.plataformas`).
- **Idempotente** (dos veces da lo mismo, tablas y vistas).
- `public.plataformas`, `public.fuentes`, cambios de estado, avisos y
  emisiones, **intactos**; las 17 revisiones anteriores, tal cual; la nueva,
  aprobada con su huella; se añaden justo 25 plataformas, 22 ofertas y 69
  fuentes.
- **Publicada la nueva:** 25 plataformas y 22 fichas (8/13/1), fechadas el
  13/11 con 7 días; plataformas iguales salvo fechas.
- **81 cambios en 18 fichas**, uno a uno, en lo que lee un visitante (y lo
  de antes ya no): Spiko 2,40 %, 3,98 % y 2,84 % con la VL del 12/11;
  «Acceso desde España» de las tres con fecha del dato 06/11;
  Boss Info «Última operación · 13/11/2026» con el portal; Brickwise al 13/11
  (Pottendorfer 73 € y 74,10 €; participaciones 59, 347, 299 y 107;
  Randhartingergasse 64 €); Hausera re-fechada; mTBILL, Robinhood, Kraken y
  Prosegur iguales salvo fechas; ninguna hora de las 00 del 13/11.
- **Vigencia:** el lector de la web lo acepta el 13/11 y el 20/11 y lo da
  por caducado el 21/11; la app lo acepta (25/22, 1 en camino).
- **Tarjetas** (`resumenOferta`): las 22 en castellano, sin «por
  participación» en el mínimo; acceso, salida y estado sin cambios; cambia
  solo el mínimo en 14 (las 11 de Brickwise, Boss Info, Switzerlend y
  Hausera; Pottendorfer «Desde 80 € … (12/11)» → «Desde 73 € la participación
  en reventa (13/11)»).
- **Sincronizador real** con estas vistas: CSV de 30 filas idéntico al de la
  web; las 52 fichas de siempre, ninguna nueva ni retirada; las fichas web de
  Spiko dicen 2,40 %, 3,98 % y 2,84 %; Pottendorfer, 73 € y 74,10 €.
- **Ya importada como borrador:** el aplicador la aprueba sin duplicar filas.
- **Casos de fallo** (falla y no deja nada):

| Caso | Error |
|---|---|
| La publicada es otra (la `24b5f7de`) | «Publicación distinta de la revisión anterior prevista: 24b5f7de-…. No aplicar este lote.» |
| La publicada con otra huella | «La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar este lote.» |
| Catálogo retirado | «Catálogo retirado o control ausente: este lote no autoriza reactivarlo.» |
| La revisión destino ya existe con otra huella | «La revisión destino existe con otra identidad o está retirada» |
| Después del último día vigente (tope movido al día anterior) | «Lote caducado: sus fichas valían hasta el 20/11/2026. No aplicar este lote.» |
| Falta una plataforma en `public.plataformas` | «Catálogo incompleto: se conserva el lote anterior» |

### 5.3 Ensayo «después de aplicar» (`ensayo-despues.json`)

| Paso | Salida real |
|---|---|
| `comprobar-entrega.mjs --exportar=DIR` | exit 0, «resultado: correcto», 19 y 6; 8 archivos exportados |
| `despues-de-aplicar.mjs` antes de sincronizar | **exit 1**, se niega: «el catálogo sincronizado no es la revisión 66907add-…: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js»; `transparencia.json` intacto (`ae3ed55e…9f62`) |
| `sincronizar.js` con el REST simulado | exit 0, «Sincronizado desde Supabase: 25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.», «rwadar.csv regenerado: 30 filas.» (sin diferencias) |
| `despues-de-aplicar.mjs` | exit 0; 43 de 44 comprobaciones al 13/11 (se queda mTBILL «supervisada», 10/11); suizas con hora real; 11 de 11 títulos; mínimos cortos (Pottendorfer «Desde 73 € la participación (13/11)»); `transparencia.json` → `8666d60c…7956` |
| otra vez | exit 0, «Nada que cambiar: ya estaba hecho.», mismo SHA |
| `volcar-seed.js` con el REST simulado | exit 0, «02_seed.sql regenerado: 25 en el radar, 5 descartadas, 13 fuentes.» (sin diferencias) |
| `transparencia.mjs` | exit 0, «Transparencia escrita: 22 ofertas con transparencia» |
| `rwadar-fichas.js` | exit 0, «Archivos actualizados: 55» |
| `npm test` (raíz) | **exit 1 por una sola prueba que no es del catálogo** (ver abajo); 09:16:41–09:21:25 UTC |

`npm test`, por partes:

- base de datos: 32 scripts con «0 fallidas» (1.348 comprobaciones), «30
  comprobaciones SQL correctas, sin red», `node --test` 11/11 y 103/103;
- web: «Pre-renderizado: 25 fichas, 5 descartadas y 22 emisiones escritas en
  el HTML (199 kB).», «710 correctas, 0 fallidas», «70 verificaciones de
  páginas y RSS correctas», «40 pruebas de precarga correctas»;
- QR: «Todo correcto: el código se lee.»;
- móvil: 630 pruebas, 628 correctas, 0 fallos, 2 omitidas;
- herramientas: «fichas.json: 22 fichas (22 con foto), catálogo
  2026-11-13-v2», «Transparencia al día: 22 ofertas con transparencia»,
  «Diferencias: 0»;
- acceso: **312 de 313**. Falla «en Chromium: Inicio con 3 noticias
  compactas en «Mercado y noticias»…» (`rwadar-acceso/noticias-sector.test.mjs:172`):
  «el día de la de hoy, «Hoy» solo en ella». **Falla igual en otra copia
  limpia del repositorio en su HEAD (`bed9752`), sin nada de esta entrega**
  (`# pass 0`, `# fail 1`): viene de las noticias del 13/11 (la primera es
  del 11/11 y hoy ninguna es de «Hoy»), no del catálogo. Hay que ajustar esa
  prueba web como `ce9d5a9` ajustó las de la app, antes de publicar.

«Lo esencial» y la tarjeta de la app (funciones reales de
`rwadar-movil/lib/transparencia.js` con el catálogo sincronizado de la copia):
frente a lo publicado, cambian 13 y solo en el mínimo: Pottendorfer
«Mínimo: Desde 80 € la participación (12/11)» → «**Desde 73 € la
participación (13/11)**»; las otras 10 de Brickwise, Switzerlend («1 acción
(68,01 CHF, 13/11)») y Hausera («Desde 100 € en Alicante 3 (13/11)»), solo la
fecha. Las otras 9 dicen lo mismo.

## 6. Lo que no se aplicó tal cual (y por qué)

Está en `contraste-2026-11-13.json` («noAplicadoTalCual»):

1. **Boss Info, fuente de «Última operación».** El expediente proponía
   `https://shares.bossinfo.com/api/secondarymarkets/getTrades`. Se mantiene
   el portal `https://shares.bossinfo.com/` (corrección 2 del revisor y
   DECISIONES §4: la API da 405 a un visitante). El alcance no atribuye al
   investigador la lectura en cadena: la de hoy es la del revisor.
2. **Suizas, horas en los expedientes.** La corrección dice que cada
   `consultadoUtc` pase a la hora real. El montador no puede editar los
   expedientes (lo prohíbe el encargo): la corrección va en la entrega (horas
   reales en «horasRealesSuiza», ninguna hora copiada en ningún archivo, y
   `despues-de-aplicar.mjs` solo re-fecha una fuente suiza con hora real).
   **Los expedientes siguen con las horas copiadas**: si se quiere que el
   expediente también quede bien, lo tiene que corregir quien lo escribió.
3. **Spiko, el claim `accesoEspana` y la nota interna.** Igual: el literal
   corregido («Last updated: November 6, 2026», fecha 2026-11-06) y la nota
   («en tres de las cuatro columnas: Smart Cash, T-Bills Euro y T-Bills
   Dollar») están en «correccionesRevisores»; lo publicado lleva la fecha
   corregida. Los expedientes no se tocaron.
4. **Lo que proponen los expedientes y DECISIONES no recoge** (lista
   cerrada): textos nuevos de tarjeta (mínimo, acceso o salida con otras
   palabras) de las tres de Spiko, Robinhood, Kraken y Prosegur; datos de
   tarjeta de mTBILL (en conflicto: la web y la app los ocultan); fuentes
   nuevas de las ofertas (API de Spiko, GECO, API de Brickwise, documentos de
   Midas); y los campos «lugar», «concepto» y «pasos». Se conservan los
   publicados.

## 7. Pendiente y avisos para los revisores

- **Pottendorfer (recomendación del revisor de Brickwise):** el mínimo de 73 €
  es **una sola participación**, de una orden creada el 12/11 a las 21:45 UTC
  (seguía abierta a las 08:48 UTC). El 11/11 una orden de 73 € de esta ficha
  desapareció en unos 20 minutos. Volver a mirarla justo antes de aplicar; si
  ya no está, hay que rehacer la entrega con la venta más barata de ese
  momento (cambia el SQL).
- **Hausera:** la tarjeta dice «la preventa abre el 18/11» y la ficha vale
  hasta el 20/11. Del 18/11 a las 09:00 al 20/11 la frase quedaría vieja
  (igual que ayer, con vigencia hasta el 19/11). DECISIONES lo mantiene; lo
  señalo para que la revisión de contenido decida.
- **Spiko:** VL nuevas hoy a las 18:00 y 19:30 UTC (ver §2).
- Los expedientes suizos y de Spiko siguen sin corregir (§6, 2 y 3).
- **`npm test` no pasa entero hoy, pero no por el catálogo:** la prueba web
  de noticias `rwadar-acceso/noticias-sector.test.mjs` («Hoy» en la primera
  noticia) falla también sin esta entrega (§5.3). Arreglarla antes de
  publicar la web.
- Falta la revisión de la entrega (tres expertos) y el auditor.

## 8. Pasos para aplicarla (ciclo autorizado por la orden del responsable del proyecto)

1. Confirmar que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
   `7be64e86…6961` (revisión `66907add-8ebf-424b-3e04-b73e47b0c537`).
2. Volver a mirar la orden de 73 € de Pottendorfer (§7).
3. Antes del **20/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `a58dd22d-98a3-f94e-ba66-46898162215a`. Si no, parar. La
   guarda usa `current_date`, que en Supabase va en UTC: aceptaría el lote
   hasta la 01:00 (hora de Madrid) del 21/11. Mejor aplicar con margen.
4. Aplicar exactamente
   `rwadar-app/data/importaciones/catalogo-2026-11-13-v2/aplicar-y-aprobar.sql`
   con el acceso autorizado («Aplicar catálogo», etiqueta `2026-11-13`; una
   transacción; si falla, no seguir). Nunca `catalogo.sql`: no lleva guarda
   y solo crea un borrador.
5. Leer como visitante las vistas v2 y guardarlo en
   `lectura-despues-de-aplicar/`: revisión `66907add-…`, 25/22 (8/13/1),
   `verificada_el` 13/11 y los cambios de §3.
6. `node rwadar-app/sincronizar.js`, luego
   `node rwadar-app/data/verificaciones/2026-11-13-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
7. Publicar la web y **enviar la OTA**: la app lleva `transparencia.json`
   empaquetado (mínimos cortos de Brickwise, Switzerlend y Hausera).

## 9. Correcciones aplicadas

Hechas el 13/11/2026 entre las 14:36 y las 15:00 UTC, después de las tres
revisiones de la entrega (`REVISION-ENTREGA-sql.md`,
`REVISION-ENTREGA-contenido.md` y `REVISION-ENTREGA-cumplimiento.md`, que no
se tocan). Antes de tocar nada guardé una copia del SQL en
`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/sql-antes-correcciones-2026-11-13/`
(los tres archivos: `aplicar-y-aprobar.sql` `7be64e86…6961`, `catalogo.sql`
`85ad96a8…b379` y `revision.json` `a336306d…87c4`).

**Una corrección cambia el SQL (O1, Pottendorfer), así que la revisión es
otra:**

| Qué | Antes (revisada) | Ahora |
|---|---|---|
| Revisión | `66907add-8ebf-424b-3e04-b73e47b0c537` | **`434217eb-9b7f-1cd9-a851-fbde7bced2bf`** |
| Huella | `66907add…6e36` | `434217eb9b7f1cd9a851fbde7bced2bf001c79ac17610ad1d2a24edb8a9c1b61` |
| `aplicar-y-aprobar.sql` | `7be64e86…6961` | **`b6f0129cc4e8e82033bd9b4171bfaecc790e6de84c42671e291091aef99ee7b4`** |
| `catalogo.sql` | `85ad96a8…b379` | `ed917b57…bc37` |
| `revision.json` | `a336306d…87c4` | `238a2db7…207d` |

Con la revisión y la huella igualadas, el SQL nuevo y el de la copia solo se
diferencian en **una línea**: la fila de la oferta de Pottendorfer (línea 312,
`insert into rwadar_catalogo.ofertas`). Palabra a palabra, solo cambia lo que
pide O1:

- mínimo «Desde 73 €» → «Desde 80 € la participación en reventa (13/11)», y
  en su alcance «había 1 participación» → «había 11 participaciones»;
- «Venta más barata · 13/11/2026»: «73,00 € por participación (1 a ese precio,
  orden del 12/11/2026)» → «80,00 € por participación (11 a ese precio, orden
  del 08/02/2026)»;
- «Orden de venta de menor importe · 13/11/2026»: «1 participación a 73,00 €
  (74,10 € con el 1,5 %)» → «1 participación a 115,00 € (116,73 € con el
  1,5 %)»;
- «Participaciones en venta · 13/11/2026»: 107 → 106;
- en los tres alcances del libro, «(08:30–08:33 UTC)» → «(14:36 UTC)».

Mismas 288 sentencias (284 inserts), las mismas filas por tabla, los mismos
81 cambios en 18 fichas, la misma guarda (la publicada `a58dd22d` exacta con
su huella y aprobada, catálogo no retirado, destino sin otra identidad) y la
misma vigencia (del 13/11 al 20/11). De las 8 salidas de
`preparar-entrega.mjs`, no cambian el radar, el escaparate ni el manifiesto;
cambian la documentación (`a6e04bbb…`), el contraste (`333b487b…`) y los tres
archivos del SQL.

### Obligatorias

- **O1 (cumplimiento) · Pottendorfer: la orden de 73 € ya no existe (cambia
  el SQL).**
  1. **Lectura nueva justo antes de regenerar.** GET a la API pública de
     Brickwise, sin sesión: v1 a las 14:36:41 UTC (HTTP 200, SHA-256
     `3493ef7154650261601b851f4ba035313086253d5134e7c508cb26bc7648d29c`) y v2
     a las 14:36:42 UTC (HTTP 200, SHA-256
     `6b1b2572dea8e79f12e27699336d40b8f712e6254e8b7f623ea43207097fa78d`). Son
     los mismos archivos que leyó el revisor de cumplimiento a las 14:16:58,
     14:18:36 y 14:29:09 UTC, así que valen sus textos tal cual. Las
     respuestas crudas (con direcciones de cartera) están en
     `correcciones-entrega/crudo/`, fuera de Git por el `.gitignore` de esa
     carpeta. El resumen sin direcciones es
     `correcciones-entrega/libro-ordenes-resumen-2026-11-13-1436.json`. Lo
     calcula el mismo guion que usó el investigador por la mañana. La hora y
     los SHA-256 están en `correcciones-entrega/inventario-consultas.json`.
  2. **Lo que dice.** Pottendorfer (AT0000A324B4) no tiene ninguna orden a
     73 €: la venta más barata es 80 € × 11, en una orden del 08/02/2026; la
     de menor importe, 1 × 115 € (116,73 € con el 1,5 %); hay 106 en venta (v2:
     106); la mejor compra sigue en 19 € × 3 (06/11/2025). **Las otras 10
     fichas de Brickwise dan exactamente lo mismo que a las 08:30 UTC** (venta
     más barata, órdenes, menor importe, participaciones y mejores compras),
     así que se quedan con la lectura de la mañana.
  3. **DECISIONES.** La línea de Pottendorfer de §2 pasa a esta lectura y hay
     un §5 nuevo con las correcciones. Lo escribí yo, porque la corrección lo
     pide. Falta que el coordinador lo confirme.
  4. **`preparar-entrega.mjs`.** Adapté las comprobaciones que esperaban 73 €:
     - `BRICKWISE` de Pottendorfer pasa a `['80', '80']`;
     - `MENOR_IMPORTE_DECISIONES` queda vacío (la orden de menor importe vuelve
       a ser la publicada);
     - «Participaciones en venta» de Pottendorfer pasa de 107 a 106;
     - la lista de cifras que cambian y la condición de hora de Brickwise del
       contraste se ajustan a eso.

     Comprobaciones nuevas:
     - el inventario de la tarde tiene esas horas y esos SHA-256;
     - cada texto es, letra a letra, el de la corrección O1 del informe de
       cumplimiento;
     - DECISIONES §2 ya no dice «80 € → 73 €»;
     - a las 14:36 UTC no hay ninguna orden a 73 €;
     - las otras 10 fichas son iguales en las dos lecturas;
     - los tres alcances de Pottendorfer llevan «(14:36 UTC)» y los de las
       otras 10, «(08:30–08:33 UTC)»;
     - en Pottendorfer no queda ningún «73 €», «73,00 €» ni «74,10».

     «Lo no aplicado» suma una entrada, los textos del expediente con 73 €: el
     montador no edita expedientes.
  5. **`despues-de-aplicar.mjs`.** El mínimo de Pottendorfer pasa de `'73'` a
     `'80'`, así que el mínimo corto queda «Desde 80 € la participación
     (13/11)».
  6. **`comprobar-entrega.mjs`.** Pottendorfer con 80 €, 116,73 €, 106 y
     19 €; sin rastro de la orden de 73 €; los tres alcances con «(14:36 UTC)»;
     la ficha web con «Desde 80 €» y 116,73 €; la lista de «no aplicado», con
     la entrada nueva.
  7. **Spiko.** La entrega se regeneró a las 14:42–14:47 UTC, antes de las
     18:00 UTC, así que las tres cifras siguen siendo las de la VL del 12/11,
     ya revisadas. No se mezcla nada.
- **O2 (cumplimiento) y C1 (SQL) · Datos personales en la copia de Profitus
  (no cambia el SQL).** En
  `grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`,
  cambié por número de línea, sin escribir ningún dato:
  - línea 124, el nombre entre «led by its founder, » y «, a former member» →
    «[nombre recortado]»;
  - línea 240 → «[nombre recortado]»;
  - línea 244 → «[correo recortado]»;
  - línea 249 → «[teléfono recortado]».

  La 291 (atención al cliente de la empresa) se queda. `git diff --numstat`:
  `4 4` en ese archivo. La lista «Recortados en las copias» de
  `grupos/vigilancia/resumen-vigilancia.md` nombra ahora esta copia y la de
  Bit2Me.
  - **Barrido.** Un guion toma de la versión de Git los dos nombres, el correo
    y el teléfono, sin escribirlos, y los busca enteros y por partes (también
    solo el apellido y la parte local del correo) en los 228 archivos que
    vería Git de la carpeta del ciclo y del SQL, fuera de `crudo/`: **0
    restos** (repetido al final, a las 14:54 UTC). El original sigue solo en `grupos/vigilancia/crudo/`, ignorado
    por Git (`7d2afc89…`, el SHA-256 del inventario).
  - **gitleaks 8.30.1**, con `rwadar-app/gitleaks.toml` y las opciones de
    `ci.yml`: «no leaks found» en los 17 archivos cambiados o nuevos y en los
    228 que vería Git de la carpeta del ciclo y del SQL (14:54 UTC, con todo
    lo de esta corrección). La primera pasada
    dio 2 falsos positivos (`generic-api-key`) en el contraste: una clave
    «crudo/api-v1-assets.json» con un SHA-256 como valor. Lo arreglé
    guardando esas lecturas como lista, igual que el inventario.
  - **No hecho: el paso 7 (unir a `main` con *squash* y reescribir la rama
    remota).** El encargo prohíbe commit y push. Lo decide el responsable del
    proyecto.

### Recomendadas

Las recomendadas se aplican solo si no amplían DECISIONES ni cambian cifras
sin fuente.

- **Aplicada: R5 de SQL.** DECISIONES §5 deja escritos el alcance de «Última
  operación» de Boss Info, con la lectura en cadena del revisor de Suiza
  (08:45:52 UTC), y la hora del libro de Brickwise: 30 referencias con
  «(08:30–08:33 UTC)» y 3, las de Pottendorfer, con «(14:36 UTC)». No cambia
  el SQL; solo el SHA-256 de DECISIONES que guarda el contraste.
- **Hecha dentro de O1: R1 de SQL y R2 de contenido.** Volví a mirar la
  orden de Pottendorfer antes de regenerar, y ya no estaba.
- **No aplicadas:**
  - **SQL R1 (lo de antes de aplicar), R2, R3 y R4; contenido R3.** Son pasos
    de cuando se aplique o de lotes futuros, o cambian código de la web fuera
    de esta carpeta. Quedan en «Pendiente».
  - **SQL R6.** Los expedientes no se han corregido, así que no hay nada que
    adaptar.
  - **SQL R7** (`.gitattributes` con `-text`). Cambia la configuración de Git
    del repositorio, fuera de la entrega.
  - **SQL R8, contenido R1 y cumplimiento R1 (Hausera).** El texto que propone
    contenido cambia una ficha que DECISIONES deja «sin cambios», y además se
    tendría que revisar aparte. La solución que piden las tres es otra puesta
    al día antes del 18/11 a las 08:00 UTC. Ver «Pendiente».
  - **Contenido R4, R5 y R8.** Ellos mismos los dejan para la próxima entrega.
  - **Contenido R9 (GreenPoint, «5, 2, 1» → «5, 2 y 1»).** La frase es la
    publicada y DECISIONES no la cambia. Si se toca, también hay que adaptar
    la regla de `preparar-entrega.mjs` que la lee.
  - **Contenido R6 y R7; cumplimiento R3 y R4 (rentabilidades esperadas y
    lotes de Brickwise).** Son decisiones del coordinador para el próximo
    ciclo y cambian textos de 11 fichas.
  - **Contenido R10, R11 y R12; cumplimiento R11.** Los expedientes no se
    pueden editar (R10 y R11). R11 de contenido cambia la fuente de mTBILL y
    es para el próximo ciclo. R12 de contenido es solo una nota.
  - **Cumplimiento R2, R5, R6, R7, R9, R10 y R12.** Amplían DECISIONES: textos
    y avisos nuevos, la frase de la Circular, «anualizada» en Smart Cash
    (DECISIONES fija ese literal), código de la web y de la app con su OTA,
    análisis de MiCA o un comentario de código. R6 pide además que el
    coordinador lo acepte.
  - **Cumplimiento R8.** Ella misma dice que no hay que corregir nada.

### Pruebas después de corregir (salida real)

| Prueba | Salida real |
|---|---|
| `preparar-entrega.mjs`, dos veces seguidas (14:42:19 y, tras el arreglo de gitleaks, 14:47:03) | exit 0 las cuatro; cada par, la misma línea y «8 de 8 salidas idénticas». La final: `{"revisionId":"434217eb-9b7f-1cd9-a851-fbde7bced2bf","sha256":"b6f0129c…e7b4","plataformas":25,"fuentesRadar":69,"ofertas":22,"cambios":81,"noAplicado":5,"horasRealesSuiza":82}`. Radar `79683038…`, escaparate `a1bebcc8…`, documentación `a6e04bbb…`, manifiesto `c2c51919…`, contraste `333b487b…`, `catalogo.sql` `ed917b57…`, `aplicar-y-aprobar.sql` `b6f0129c…`, `revision.json` `238a2db7…`. En la copia del ensayo da la misma revisión y el mismo SHA |
| `comprobar-entrega.mjs` (PGlite, carpeta de trabajo, 14:47:08–14:47:38) | exit 0, «resultado: correcto», 18 comprobaciones y 6 casos de fallo (los mismos mensajes que en §5.2); 288 sentencias, 81 cambios en 18 fichas, 14 tarjetas que cambian solo en el mínimo |
| `comprobar-entrega.mjs --exportar` (copia, 14:44:38–14:45:06 y otra vez 14:51:25–14:51:52) | exit 0, «resultado: correcto», 19 y 6. Su informe es `pruebas-locales.json`. Lo exportado la segunda vez solo difiere en el uuid de cada plataforma, que se genera al instalar |
| `despues-de-aplicar.mjs` antes de sincronizar (trabajo y copia) | exit 1, se niega: «el catálogo sincronizado no es la revisión 434217eb-…: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js»; `transparencia.json` igual (`ae3ed55e…`) |
| `sincronizar.js` con el REST simulado | exit 0, «Sincronizado desde Supabase: 25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.», «rwadar.csv regenerado: 30 filas.» (sin diferencias) |
| `despues-de-aplicar.mjs` | exit 0; 43 de 44 al 13/11 (se queda mTBILL «supervisada», 10/11); suizas con hora real; 11 de 11 títulos; Pottendorfer «Desde 80 € la participación (13/11)»; `transparencia.json` → `f5bb46fe…bbcf`, que frente al ensayo de la mañana solo cambia en ese mínimo corto y en la revisión. Otra vez: «Nada que cambiar: ya estaba hecho.», mismo SHA |
| `volcar-seed.js`, `transparencia.mjs`, `rwadar-fichas.js` | exit 0: «02_seed.sql regenerado: 25 en el radar, 5 descartadas, 13 fuentes.» (sin diferencias); «Transparencia escrita: 22 ofertas con transparencia»; «Archivos actualizados: 55» |
| `npm test` en la copia (14:45:30–14:50:52) | **exit 1 por la misma prueba de noticias de la mañana**, que no es del catálogo. Base de datos: 32 scripts con «0 fallidas» (1.348), 30 SQL, `node --test` 11/11 y 103/103. Web: 710/0, 70 y 40. QR: correcto. Móvil: 630, 628 correctas, 0 fallos, 2 omitidas. Herramientas: «Diferencias: 0». Acceso: 312 de 313; falla `rwadar-acceso/noticias-sector.test.mjs:172` («el día de la de hoy, «Hoy» solo en ella») |
| Control de esa prueba en otra copia limpia en HEAD (`80c6238`, sin la entrega) | exit 1, `# pass 0`, `# fail 1`, el mismo error |
| «Lo esencial» y la tarjeta de la app | frente a lo publicado (12/11), cambian 13 y solo la fecha del mínimo; Pottendorfer «Mínimo: Desde 80 € la participación (13/11)», el mismo precio de antes. Frente al ensayo de la mañana solo cambia Pottendorfer (73 → 80 €) |
| Barrido de O2 y gitleaks (14:54 UTC) | 0 restos en 228 archivos; «no leaks found» en 17 y en 228 (ver O2) |

`ensayo-despues.json` cuenta el ensayo nuevo y sustituye al de la mañana.

### Pendiente

- **Revisar el SQL nuevo y pasar el auditor.** Lo pide O1: la revisión de SQL
  sobre `b6f0129c…e7b4`; de contenido y cumplimiento basta la diferencia de
  Pottendorfer (arriba).
- **Antes de aplicar:**
  - volver a leer el libro de Brickwise: si la venta más barata de
    Pottendorfer ya no es 80 €, o cambia cualquiera de las 11, rehacer la
    entrega (cambia el SQL);
  - confirmar el SHA `b6f0129c…e7b4`;
  - volver a leer como visitante que sigue publicada la `a58dd22d`.
- **Spiko** publica VL nuevas hoy a las 18:00 y 19:30 UTC. Las cifras de la
  entrega siguen siendo ciertas con su fecha (VL del 12/11), pero desde esas
  horas ya no son las últimas.
- **Hausera.** La preventa abre el 18/11 a las 09:00 y la ficha vale hasta el
  20/11. Conviene otra puesta al día antes del 18/11 a las 08:00 UTC, o mirar
  Hausera ese día.
- **La prueba web `rwadar-acceso/noticias-sector.test.mjs:172`** falla
  también sin la entrega. Hay que ajustarla antes de publicar la web.
- **El commit `cccebe2`** (en la rama remota de trabajo, no en `main`) aún
  lleva los datos de Profitus. Unir con *squash* o reescribir la rama lo
  decide el responsable del proyecto.
- **Expedientes sin corregir:** los suizos (horas), los de Spiko (claim
  `accesoEspana`) y el de Pottendorfer (73 €). Si se quieren corregidos, lo
  tiene que hacer quien los escribió.
- **Falta hacer commit** de estos archivos. La anotación en
  `docs/tareas/PARA-CODEX.md` queda para la coordinación.

### Pasos para aplicarla (sustituyen a los de §8)

1. Confirmar que el SHA-256 de `aplicar-y-aprobar.sql` es
   `b6f0129cc4e8e82033bd9b4171bfaecc790e6de84c42671e291091aef99ee7b4`
   (revisión `434217eb-9b7f-1cd9-a851-fbde7bced2bf`).
2. Volver a leer el libro de Brickwise (las 11, y sobre todo Pottendorfer).
   Si algo cambia, parar y rehacer.
3. Antes del **20/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `a58dd22d-98a3-f94e-ba66-46898162215a`. Si no, parar.
4. Aplicar exactamente
   `rwadar-app/data/importaciones/catalogo-2026-11-13-v2/aplicar-y-aprobar.sql`
   con «Aplicar catálogo» (etiqueta `2026-11-13`; una transacción). Nunca
   `catalogo.sql`.
5. Leer como visitante las vistas v2 en `lectura-despues-de-aplicar/`:
   revisión `434217eb-…`, 25/22 (8/13/1), `verificada_el` 13/11 y Pottendorfer
   «Desde 80 € la participación en reventa (13/11)».
6. Por este orden: `node rwadar-app/sincronizar.js`,
   `node rwadar-app/data/verificaciones/2026-11-13-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
7. Publicar la web y **enviar la OTA**: cambian los mínimos cortos de
   `transparencia.json`.

## Archivos

- `preparar-entrega.mjs`, `comprobar-entrega.mjs`, `despues-de-aplicar.mjs` y
  `ensayo-rest-simulado.cjs` (copia exacta del de la `2026-11-12`).
- Datos: `escaparate-publicacion.json`, `documentacion-ofertas.json`,
  `radar-canonico-26.json`, `manifiesto-catalogo.json` y
  `contraste-2026-11-13.json`.
- SQL: `rwadar-app/data/importaciones/catalogo-2026-11-13-v2/`
  (`catalogo.sql`, `aplicar-y-aprobar.sql`, `revision.json`).
- Pruebas: `pruebas-locales.json` (PGlite) y `ensayo-despues.json` (ensayo
  completo en la copia aparte), los dos de la revisión `434217eb`.
- Corrección O1: `correcciones-entrega/` (inventario, resumen del libro de las
  14:36 UTC y `.gitignore`; los crudos, fuera de Git).

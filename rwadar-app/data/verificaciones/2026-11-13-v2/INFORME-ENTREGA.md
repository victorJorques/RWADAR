# Entrega del catálogo 2026-11-13 · puesta al día del día

Preparada el 13/11/2026 por Claude (montador de datos y SQL), entre las 09:00
y las 09:35 UTC. **Nada aplicado en Supabase, nada publicado, sin OTA,
ningún flujo lanzado; el montador no hizo commit ni push.** Estado:
**preparada y probada en local** (PGlite y un ensayo completo de «después de
aplicar» en una copia aparte). Falta la revisión de la entrega (SQL,
contenido y cumplimiento) y el auditor.

> La coordinación guardó una copia de trabajo de estos archivos en el commit
> `d1463ee` («entrega en montaje, aún sin revisar») a las 09:14 UTC. Los
> archivos de la entrega (datos y SQL) no han cambiado desde entonces; sí se
> añadieron después `despues-de-aplicar.mjs`, `ensayo-rest-simulado.cjs`,
> `ensayo-despues.json` y este informe, y `pruebas-locales.json` es el de la
> pasada del ensayo.

**La revisión nueva es la `66907add-8ebf-424b-3e04-b73e47b0c537`**
(SHA-256 de `aplicar-y-aprobar.sql` `7be64e86…6961`).

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

PENDIENTE_PRUEBAS

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

## Archivos

- `preparar-entrega.mjs`, `comprobar-entrega.mjs`, `despues-de-aplicar.mjs` y
  `ensayo-rest-simulado.cjs` (copia exacta del de la `2026-11-12`).
- Datos: `escaparate-publicacion.json`, `documentacion-ofertas.json`,
  `radar-canonico-26.json`, `manifiesto-catalogo.json` y
  `contraste-2026-11-13.json`.
- SQL: `rwadar-app/data/importaciones/catalogo-2026-11-13-v2/`
  (`catalogo.sql`, `aplicar-y-aprobar.sql`, `revision.json`).
- Pruebas: `pruebas-locales.json` (PGlite) y `ensayo-despues.json` (ensayo
  completo en la copia aparte).

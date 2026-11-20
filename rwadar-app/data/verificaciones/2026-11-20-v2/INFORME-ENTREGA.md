# Entrega del catálogo 2026-11-20 · re-montaje con la auditoría completa

Montada con el motor (`.claude/skills/investigacion-catalogo/entrega/motor.mjs`)
a partir de `decisiones.json`. Es el **re-montaje de las 20:45 UTC**: se
conserva todo lo del montaje de las 17:19 UTC (§1 a §5 de
`DECISIONES-COORDINADOR.md`) y se añaden solo las correcciones A1–A21 de la
auditoría completa (§6). Nada se ha aplicado en Supabase, nada se ha publicado.

## 1. Partida

- Se parte **exactamente** de la entrega publicada `2026-11-13`: revisión
  `434217eb-9b7f-1cd9-a851-fbde7bced2bf`, huella
  `434217eb9b7f1cd9a851fbde7bced2bf001c79ac17610ad1d2a24edb8a9c1b61`, leída hoy
  como visitante (`lectura-publica/`). El motor comprueba que lo leído es igual a
  la base local antes de tocar nada.
- Las mismas 22 ofertas (8 principales, 13 de reventa, 1 en camino) y las 25
  plataformas del radar (69 fuentes, todas comprobadas hoy). Ni altas ni
  retiradas.
- Las fichas valen 7 días: **último día vigente el 27/11/2026**. El SQL se niega
  a aplicarse después.

## 2. Revisión, huella y SHA-256

| | |
|---|---|
| Revisión nueva | `c8727d7d-cd09-d2cf-d3dc-da3158fe6812` |
| Huella | `c8727d7dcd09d2cfd3dcda3158fe68120294c835434408e2ab7934419052348a` |
| `aplicar-y-aprobar.sql` (SHA-256) | `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6` |
| `catalogo.sql` (SHA-256) | `9d13840fdb259fdee7183a3eed483310a975ea0d4c58544c9d910ac577cda0e5` |
| `revision.json` (SHA-256) | `d2cb514faca8053bc88f093a8707c762ad601cf561ff02a0a788e97bc26315e2` |

El SQL de las 17:19 UTC (`4418ad20…`, revisión `a513851a…`) queda sustituido
por este. Copia para los revisores en
`/tmp/claude-0/-home-user-RWADAR/684c4976-e318-5eb6-ab51-eb259042ad6c/scratchpad/sql-revisado-2026-11-20/`.

## 3. Qué cambia (antes → ahora)

El detalle, cambio por cambio, está en `DIFF-ENTREGA.md` (162 cambios en las 22
fichas; 14 tarjetas cambian). En llano:

### Spiko

- **Letras del Tesoro Euro: 2,40 % → 2,45 %** (A1). Spiko publicó la VL nueva a
  las 17:18 UTC: 1,063496 €, calculada el 20/11 y fechada por Spiko el 22/11
  porque cubre el fin de semana. La API da `monthlyYield` 0.0245; recalculado
  por RWAdar con la serie de VL (leída hoy a las 20:43 UTC): del 22/10
  (1,06131 €) al 22/11 (1,063496 €), 31 días, capitalizando, **2,452 %**. La
  métrica dice «Rentabilidad publicada · 31 días · 20/11/2026: 2,45 %» y la
  referencia lleva fecha del dato 20/11 (no 22/11).
- **Letras del Tesoro Dólar: 3,98 % → 4,00 % en USD** (A2). VL del 20/11,
  1,103573 $; API 0.04; del 20/10 (1,099901 $) al 20/11, 31 días: **4,002 %**.
- Las dos Letras, «Supervisor» (A5): «AMF (fondo) · Spiko SICAV inscrita en la
  CNMV para su comercialización (n.º 2380); la CNMV no detalla sus fondos uno a
  uno».
- **Smart Cash Euro:** sigue en 2,84 % (VL del 20/11). «Supervisor» con el texto
  del revisor; «Aprobación del compartimento» pasa al certificado de la AMF del
  23/02/2026 con el texto exacto del informe de auditoría (A4), y la descripción
  dice «autorizado por la AMF con el n.º SCV20260075, según el certificado de la
  AMF del 23/02/2026». Desaparece la fecha 17/02/2026.

### mTBILL

- Valor por token **1,0777 → 1,0789 USD** (ronda 498, 20/11) y rentabilidad
  pasada **3,45 % → 3,46 %** (16/10 → 20/11).
- El aviso del conflicto añade (A10): «Las comisiones tampoco coinciden: las
  Condiciones Finales permiten hasta 0,2 % al suscribir de forma inmediata y
  hasta 0,05 % al reembolsar; el KID no cobra entrada ni reembolso estándar.»
- Fuentes de la tarjeta (A11): se añaden las Condiciones Finales y el KID en
  español alojados en el CDN de GitBook (responden 200; las páginas de Midas
  dan 403).

### Kraken xStocks, Robinhood y Prosegur Digital Gold

- Kraken: «más de 130» → **«más de 1.000 acciones y ETF de EE. UU.»** en el
  resumen y en la descripción (A6: el motor cambia la descripción con el
  resumen). «Dividendos»: fecha del dato 11/11/2026 (A7). «Países de oferta
  (condiciones finales)»: fuente las condiciones finales de ANTx del 19/11/2026
  (CH1588667217), fecha del dato 19/11 (A8); el valor no cambia.
- Robinhood, aviso nuevo (A9): «Producto complejo según su KID: puedes perder
  todo lo invertido.»
- Prosegur, «Custodia» (A12): «Oro separado de los bienes de Prosegur, en un
  inventario conjunto de los clientes (sin lingote asignado)».

### Aktionariat, Boss Info y Switzerlend

- Las tres, aviso nuevo (A13–A15): «Son acciones de una empresa que no cotiza
  en bolsa: puedes perder todo el dinero invertido.»
- Boss Info, «Última operación · 20/11/2026» (A16): 8,40 ZCHF (1 acción,
  05/11/2026); la fuente sigue siendo la portada del portal, que hoy enseña
  «Last trade • 5 Nov 2026, 13:35».
- Las fechas y las cifras del montaje de las 17:19 (precios, ventas más
  baratas, supervisor) siguen igual.

### Brickwise (11 de reventa)

- Mínimos de la tarjeta: Pottendorfer **80 → 81 €** y Cohotel **102 → 110 €**;
  las otras nueve, el mismo mínimo con fecha 20/11; libro de órdenes del día.
- Fuera de «Datos con su fecha» las rentabilidades y repartos (A18): en las 11
  se quitan, donde estén, «Distribución anual prevista anunciada»,
  «Distribución anual esperada · 22/10/2026», «Rentabilidad por alquiler
  esperada (API de la app) · 22/10/2026», «Rentabilidad · consulta 01/11/2026»
  y «Próxima distribución esperada · 22/10/2026».
- Randhartingergasse: se quita «Participaciones disponibles en emisión (API) ·
  22/10/2026: 374 de 2.670» (A19).
- Citas del KID (A20): «Custodia» pasa al literal «Die Verwaltung und
  Übertragung der Token hat eigenverantwortlich durch den Anleger zu
  erfolgen.» en las seis fichas de `auditoria/brickwise-a.md` y en
  Randhartingergasse y Hinterstoder; «Qué se adquiere» empieza por «Das Produkt
  läuft endlos/ewig ("Perpetual")…» en las seis. La errata «comprobado
  el30/09/2026» se corrige en las 11 y en Hausera.
- Randhartingergasse y Hinterstoder, aviso nuevo (A21): «Para comprar esta
  emisión, quien no tributa en Austria debe dar antes un número fiscal
  austriaco: las rentas tributan en Austria y la ganancia al vender paga allí
  el impuesto inmobiliario (ImmoESt).»

### Hausera (en camino)

- Resumen (A17): «… tiene la preventa abierta desde el 18/11 y la suscripción
  anunciada del 25/11/2026 al 30/06/2027.» (no queda viejo el 25/11).
- Aviso: «El 20/11/2026, con la preventa ya abierta, Alicante 3 aún no estaba
  inscrita en el registro de la CNMV». Sigue «en camino».

### Radar

- 69 de 69 fuentes comprobadas hoy; ningún texto cambia. Las correcciones de
  `auditoria/radar-plataformas.md` no entran (son de la tabla base
  `plataformas`, fuera de este SQL; DECISIONES §6).

## 4. El SQL

`aplicar-y-aprobar.sql`: **288 sentencias en una transacción serializable**
(begin, guarda, 284 inserts, aprobación, commit).

- Guarda: tiene que estar publicada la `434217eb` con su huella, el catálogo no
  retirado, la fecha entre el 20/11 y el 27/11 y la revisión destino sin otra
  identidad.
- Solo inserts en `rwadar_catalogo` (35 en alerta_fuentes, 25 en alertas, 69 en
  fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en
  revisiones): las mismas filas por tabla que la 2026-11-13, idempotentes.
- La aprobación solo cambia `rwadar_catalogo.revisiones`. Sin DDL, borrados,
  permisos, Auth ni funciones; nada en `public.*`.
- 23 de las 288 sentencias cambian algo más que la revisión, la huella y la
  fecha (lista en `DIFF-ENTREGA.md`).

## 5. Pruebas (salida real)

### 5.1 `motor.mjs preparar 2026-11-20 --repetir`

```
"revisionId": "c8727d7d-cd09-d2cf-d3dc-da3158fe6812",
"sha256": "4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6",
"cambios": 162, "noAplicado": 8, "repetido": "mismos SHA-256 las dos veces"
```

### 5.2 `motor.mjs comprobar 2026-11-20 --exportar=…/exportado-2026-11-20` (PGlite)

`"resultado": "correcto"`, 19 comprobaciones y 6 casos de fallo. Entre ellas:

- inventario de 288 sentencias y guarda (arriba); cadena de producción (18
  lotes) con la `434217eb` publicada; antes de aplicar, PGlite enseña lo mismo
  que se leyó como visitante;
- idempotente (aplicarla dos veces da lo mismo);
- «cada cambio de contraste-2026-11-20.json está en lo que lee un visitante
  (162 cambios en 22 fichas …) y lo de antes ya no; lo no aplicado sigue como
  estaba (11 comprobaciones de 8 puntos); no aparece «autorizado el
  17/02/2026», «Autorizado por la AMF el 17/02/2026», «comprobado
  el30/09/2026»»;
- vigencia: la web lo acepta el 20/11 y el 27/11 y lo da por caducado el 28/11;
- tarjetas: 22 en castellano; cambian 14 y cada una enseña el texto nuevo;
- sincronizador real: 25 plataformas, 22 ofertas, 5 descartadas, CSV de 30
  filas; 52 fichas web, ninguna nueva ni retirada; en las fichas web, lo
  esperado de Spiko (2,45 % y 4,00 %; sin «17/02/2026»), Cohotel, Pottendorfer,
  Kraken, Hausera, Robinhood, Randhartingergasse y Plüddemanngasse;
- los 6 casos de fallo (otra publicada, otra huella, catálogo retirado, destino
  con otra huella, después del 27/11, catálogo incompleto) fallan sin dejar
  nada.

### 5.3 Ensayo «después de aplicar» en una copia aparte

Copia con `git clone --local` y la carpeta del ciclo y el SQL copiados encima;
el REST de Supabase simulado con lo que exportó PGlite. Resultado de cada paso
en `ensayo-despues.json` (logs en
`/tmp/claude-0/-home-user-RWADAR/684c4976-e318-5eb6-ab51-eb259042ad6c/scratchpad/ensayo-log2/`):

- `preparar-entrega.mjs --repetir`: exit 0, mismo SHA `4380fcf3…`.
- `comprobar-entrega.mjs --exportar`: exit 0, «correcto», 19 pruebas y 6 casos.
- `despues-de-aplicar.mjs` antes de sincronizar: exit 1, se niega como debe
  («el catálogo sincronizado no es la revisión c8727d7d-…»).
- `sincronizar.js` (REST simulado): «25 plataformas verificadas, 5 descartadas y
  22 ofertas clasificadas», CSV de 30 filas.
- `despues-de-aplicar.mjs`: exit 0; transparencia al 20/11, 43 de 44 (mTBILL
  «supervisada» se queda con su fecha del 10/11); 11 títulos de puntos fuertes al
  20/11; mínimos cortos de Brickwise (Pottendorfer 81 €, Cohotel 110 €). Otra
  vez: «Nada que cambiar: ya estaba hecho.»
- `volcar-seed.js`: «02_seed.sql regenerado: 25 en el radar, 5 descartadas, 13
  fuentes», sin diferencias.
- `transparencia.mjs`: «22 ofertas con transparencia». `rwadar-fichas.js`:
  «Archivos actualizados: 55».
- `npm test` (raíz): exit 0 en 6 min 20 s; 11/11, 22/22, 79/79, 693 de 695 (2
  omitidas), 367/367; 0 fallos.

## 6. Lo que no se aplicó tal cual (y por qué)

1. **A3 (Spiko, «Acceso desde España» con fecha del dato 13/11):** el motor no
   tiene un cambio de solo fecha para un dato de tarjeta: el tipo «tarjeta»
   exige que cambie el valor y el tipo «referencia» rechaza las etiquetas de la
   tarjeta. La referencia sigue con su valor, consultada hoy y con fecha del
   dato 06/11. Hace falta `motor:false` o un cambio nuevo en el motor.
2. **A21, tarjeta «Acceso desde España» de Randhartingergasse y Hinterstoder:**
   la tarjeta de la web y la app enseña «Sin comprobar si se puede contratar
   desde España» para cualquier valor que empiece por «Sin confirmar» (antes y
   después), y la comprobación del motor exige ver el texto nuevo, así que para.
   El aviso nuevo de A21 sí entra y dice lo del número fiscal austriaco.
3. **A20 fuera de las seis fichas de `brickwise-a.md`:** «Qué se adquiere» de
   Randhartingergasse y Hinterstoder y las dos citas de Pottendorfer, GreenPoint
   y Cohotel no tienen hoy un literal del KID comprobado por un auditor: se
   quedan como estaban.
4. **A6 (descripción de Kraken):** no hace falta un cambio aparte; el motor la
   cambia con el resumen. PGlite comprueba «más de 1.000 acciones» y que no
   queda «más de 130 acciones».
5. **Radar (`auditoria/radar-plataformas.md`):** fuera de esta entrega por
   DECISIONES §6 (tabla base `plataformas`).
6. Del montaje de las 17:19, siguen: la URL de la ficha GECO c124199 en la lista
   de fuentes de Smart Cash (el motor no quita fuentes de una ficha; ya no la
   cita nada), el claim del expediente de Smart Cash (no se editan expedientes)
   y los textos de tarjeta que proponen los expedientes y DECISIONES no recoge.
   El punto «VL del 20/11» del montaje anterior desaparece: ya está aplicado.

7. **DECISIONES §8 (A22, mTBILL `main-DOxid0Zj.js` con 404) y §9 (A23–A25,
   radar por `cambios-radar.json`)** se añadieron a DECISIONES a las 20:46 y
   20:53 UTC, con este re-montaje ya en marcha, y el encargo era solo §6: no
   están en este SQL. Hay que relanzar el montaje con ellos.

## 7. Pasos para aplicarla

1. Revisión de la entrega (SQL, contenido y cumplimiento) sobre
   `DIFF-ENTREGA.md` y la copia de `sql-revisado-2026-11-20/`; corregir en
   `decisiones.json` y cerrar con `motor.mjs auditar 2026-11-20
   --antes=<copia del SQL revisado>
   --revisado=4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6
   --secretos=<gitleaks> --exigir-secretos --escribir`.
2. Justo antes de aplicar (y antes del **27/11/2026**): volver a leer como
   visitante; tiene que seguir publicada la `434217eb-…`. Mirar también la API
   de Spiko: la siguiente VL de las Letras llega el lunes 23/11.
3. Aplicar exactamente
   `rwadar-app/data/importaciones/catalogo-2026-11-20-v2/aplicar-y-aprobar.sql`
   («Aplicar catálogo», etiqueta `2026-11-20`, una transacción; si falla, no
   seguir). Nunca `catalogo.sql` (no lleva guarda).
4. Leer como visitante y guardar en `lectura-despues-de-aplicar/`: revisión
   `c8727d7d-…`, 25/22 (8/13/1), `verificada_el` 20/11.
5. `node rwadar-app/sincronizar.js`,
   `node rwadar-app/data/verificaciones/2026-11-20-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js`,
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
6. Publicar la web, enviar la OTA y lanzar «Avisar novedad».

## Archivos

- `decisiones.json`, `DIFF-ENTREGA.md`, `contraste-2026-11-20.json`,
  `escaparate-publicacion.json`, `documentacion-ofertas.json`,
  `radar-canonico-26.json`, `manifiesto-catalogo.json`, `pruebas-locales.json`,
  `ensayo-despues.json` y los guiones finos.
- Serie de VL de Spiko leída hoy: `grupos/spiko/fuentes/api-20-11-tarde/series-EUTBL.json`
  (`e3c772b8…`) y `series-USTBL.json` (`8b5c4450…`), hora en `hora-series.txt`.
- SQL: `rwadar-app/data/importaciones/catalogo-2026-11-20-v2/`.

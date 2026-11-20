# Entrega del catálogo 2026-11-20 · puesta al día del día

Montada con el motor (`.claude/skills/investigacion-catalogo/entrega/`): lo
propio de hoy está en `decisiones.json`; las guardas, en el motor. Es el primer
ciclo real con el motor: la publicada (13/11) se montó con guiones a mano y no
tiene `decisiones.json`, así que este parte del del 12/11 y de lo publicado el
13/11. Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md` (§2 y §4).
No se ha tocado Supabase ni ningún servicio remoto; no se ha publicado nada.

## 1. Partida

- Publicada: entrega **2026-11-13**, revisión `434217eb-9b7f-1cd9-a851-fbde7bced2bf`,
  huella `434217eb9b7f1cd9a851fbde7bced2bf001c79ac17610ad1d2a24edb8a9c1b61`,
  último día vigente 20/11/2026.
- Leída como visitante el 20/11/2026 entre las 16:52:14 y las 16:52:17 UTC
  (`lectura-publica/`): 25 plataformas, 22 ofertas (8/13/1), 5 descartadas,
  todo de la `434217eb`, verificado el 13/11. El motor comprueba que eso es
  exactamente la base local (`2026-11-13-v2/`).
- Cadena aplicada en producción: del 22/10 a la `2026-11-13` (18 lotes).

## 2. Revisión, huella, SHA-256 y vigencia

| | |
|---|---|
| Revisión nueva | `a513851a-c3ce-26b1-5dfa-4be8c359f8f8` |
| Huella | `a513851ac3ce26b15dfa4be8c359f8f8a31b25f129fe8140c57b8cce2f939978` |
| `aplicar-y-aprobar.sql` | SHA-256 `4418ad20bafb5d186dc7f9639121b7f9a70d0822bb991d2f08fa2468fd75ef2f` (425.915 bytes) |
| `catalogo.sql` | SHA-256 `9f6770b0dddc97900a3fcdcf98dd2d20cd32faef30e10c1d7e364b5cc88fb9e6` |
| `revision.json` | SHA-256 `389fd884c882a636d99027a485e2914b55417ff9199fb4490246a6e3254eb176` |
| Vigencia | verificada el 20/11/2026, 7 días: último día vigente **27/11/2026**; la guarda rechaza aplicarla después |

Copia de lo que verán los revisores (los tres archivos, sin tocar):
`/tmp/claude-0/-home-user-RWADAR/684c4976-e318-5eb6-ab51-eb259042ad6c/scratchpad/sql-revisado-2026-11-20/`.

## 3. Qué cambia (antes → ahora)

87 cambios en 20 fichas; 14 tarjetas cambian. El detalle, frase a frase, está
en `DIFF-ENTREGA.md` y `contraste-2026-11-20.json`. Cada cambio lleva su prueba
de hoy (fuente, literal y hora posterior a la lectura pública) en
`decisiones.json`.

### Spiko

- **Letras del Tesoro Euro:** rentabilidad **2,40 % → 2,35 %** (VL del 19/11,
  1,063276 €; API `monthlyYield` 0.0235). Métrica «Rentabilidad publicada · 31
  días · 19/11/2026: 2,35 %». La referencia de la ficha cuenta el recálculo:
  19/10 → 19/11, 1,061180 € → 1,063276 € (el revisor da 2,3505 %).
- **Letras del Tesoro Dólar:** **3,98 % → 3,97 % en USD** (VL del 19/11,
  1,103445 $; 19/10 → 19/11, 1,099805 $ → 1,103445 $; el revisor da
  3,9671 %). Siguen los conflictos ya avisados.
- **VL del 20/11 de los dos fondos de Letras: no se usa.** Spiko la publica a
  las 18:00:00 UTC (`nextYieldTimestamp` 1795197600 en las copias de las
  17:04:52 UTC). Estos cambios se escribieron antes de esa hora, así que van con
  la VL del 19/11, como el expediente (ver §6).
- **Spiko Euro (Smart Cash):** sigue en **2,84 %**, ahora con la VL del 20/11
  (1,017886 €). Métrica «Rentabilidad publicada · neta y variable · 20/11/2026».
  **Corrección obligatoria del revisor aplicada:**
  - «Supervisor»: «AMF (Francia): n.º SCV20260075, autorizado el 17/02/2026
    (ficha en su base GECO…)» → «AMF (Francia): n.º SCV20260075, según el
    certificado de la AMF del 23/02/2026; el 20/11/2026 el fondo ya no aparece
    en la base pública de la AMF (GECO) · Spiko SICAV inscrita en la CNMV
    (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta
    en España» (el texto exacto del revisor).
  - Referencia «Aprobación del compartimento»: sin la fecha 17/02/2026 ni
    «(ficha pública en GECO …)»; la fuente pasa de la ficha GECO c124199 al
    certificado de la AMF (`SAFO_Letter_EN.pdf`).
  - Descripción: «autorizado por la AMF el 17/02/2026 … (ficha pública en GECO
    y certificado…)» → «con el n.º SCV20260075 de la AMF, según el certificado
    de la AMF del 23/02/2026 (el 20/11/2026 el fondo ya no aparece en la base
    pública GECO de la AMF)».
  - El aviso de acceso (nadie confirma ni niega su venta en España) sigue.
  - Una guarda del día (`prohibidos`) impide que vuelva «autorizado el
    17/02/2026» en esta ficha; PGlite comprueba que no aparece en nada de lo
    que lee un visitante.

### mTBILL

- Valor por token **1,0777 → 1,0789 USD** (ronda 498 del oráculo, 20/11
  11:41:35 UTC).
- Rentabilidad pasada de 5 semanas **3,45 % → 3,46 % anual en USD** (rondas
  475 → 498, 16/10 13:47:47 → 20/11 11:41:35 UTC, 34,91 días; el motor rehace
  la cuenta: (1,07890125 / 1,07534190 − 1) × 365 / 34,91 = 3,46 %). Etiqueta y
  aviso dicen «del 16/10 al 20/11/2026».
- Sigue en `fuentes_en_conflicto` (reembolso 25 % / 15 %).

### Kraken xStocks, Robinhood y Prosegur Digital Gold

- **Kraken:** resumen «más de 130 acciones y ETF de EE. UU.» → «más de 1.000
  acciones y ETF de EE. UU.» (Kraken UE, 16:58 UTC; el revisor lo confirma).
  El aviso de las condiciones finales sin España se mantiene.
- **Robinhood y Prosegur Digital Gold:** sin cambios; solo la fecha (PGlite lo
  comprueba).

### Aktionariat, Boss Info y Switzerlend (solo fechas)

- Aktionariat: «Precio del emisor · 20/11/2026», «Supervisor (… 20/11/2026)» y
  el aviso de vendedores por debajo del precio, al 20/11.
- Boss Info: «Supervisor» y el aviso de la venta más barata (8,40 ZCHF) al
  20/11; mínimo «… (unos 17 ZCHF el 20/11)»; referencia «Última operación ·
  20/11/2026» (la misma operación del 05/11; el importe que recibió quien
  vendió se comprobó el 13/11 y lo dice así).
- Switzerlend: los dos avisos al 20/11 (recompra apagada con 0,03 ZCHF; venta
  más barata 67,00 ZCHF), mínimo «1 acción (68,01 CHF el 20/11)» y
  «Supervisor» al 20/11.

### Brickwise (11 de reventa)

Las 11 siguen solo en reventa y con vendedores. Libro de órdenes de la API a
las 16:54:47 UTC (copia `grupos/brickwise/fuentes/libro-ordenes-resumen-2026-11-20.json`,
SHA-256 `129bda94…bf2`, igual que el del revisor y el del vigía).

| Ficha | Mínimo | Menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| **Pottendorfer** | **80 € → 81 €** | 115 € → **81 € (82,22 €)** | 106 → **96** | 19 € → **64 €** |
| **Cohotel** | **102 € → 110 €** (35 en 2 órdenes) | 102 € → **120 € (121,80 €)** | 59 | 3 € |
| Drautalresidenz | 70 € | 84 € → **70 € (71,05 €)** | 150 → 147 | 60 € → **50 €** |
| Randhartingergasse | 78 € (20, una orden) | 78 € → **85 € (86,28 €)** | 189 → 188 | 64 € |
| Hinterstoder 50 | 75 € | 90 € → **82 € (83,23 €)** | 265 → 252 | 20 € |
| GreenPoint | 102 € | 102 € (103,53 €) | 347 | 84 € → **29 €** |
| Schwarzer Weg | 69,90 € | 69,90 € (70,95 €) | 299 → 298 | 60 € → **62 €** |
| Sonnleithnergasse | 75 € | 80 € (81,20 €) | 97 | 65 € (ahora 2 en 2 órdenes) |
| Klagenfurt | 95 € | 95 € (96,43 €) | 302 → 299 | 15 € |
| Stallhofstraße | 68,80 € | 68,80 € (69,83 €) | 317 → 315 | 30 € |
| Plüddemanngasse | 75 € | 99 € (100,49 €) | 335 | 20 € |

En las 11, el mínimo pasa a «Desde X € la participación en reventa (20/11)» y
las cuatro referencias del libro a «… · 20/11/2026». El motor rehace cada
importe con el 1,5 % (redondeo al céntimo, 0,005 hacia arriba).

### Hausera (en camino)

- Resumen: «… abre la preventa el 18/11 y la suscripción el 25/11/2026» →
  «… tiene la preventa abierta desde el 18/11 y la suscripción empieza el
  25/11/2026».
- Métrica «Próxima operación»: «preventa abierta desde el 18/11/2026;
  suscripción del 25/11/2026 al 30/06/2027».
- Aviso: «El 20/11/2026, con la preventa ya abierta, Alicante 3 aún no estaba
  inscrita en el registro de la CNMV».
- Mínimo: «Desde 100 € en Alicante 3, según su documento de emisión (20/11);
  preventa abierta desde el 18/11.»
- «Historial publicado · 20/11/2026» (42 operaciones, 24 terminadas, 128 M€:
  las mismas cifras de la portada, copia de hoy).
- Sigue «en camino».

### Radar

Las 69 fuentes contrastadas hoy (capturas de las 16:57 UTC); solo la de
pasaportes de Spiko en REGAFI se leyó por la API pública (copia con el mismo
SHA-256 que el 13/11). Ningún texto ni dirección cambia; solo las fechas.

### Después de aplicar (`despues-de-aplicar.mjs`, en `transparencia.json`)

Revisión, lote y fechas al 20/11; 13 mínimos cortos (los 11 de Brickwise,
Switzerlend «1 acción (68,01 CHF, 20/11)» y Hausera «Desde 100 € en Alicante 3
(20/11)»); el motivo del documento de Hausera dice «el 20/11/2026 la emisión
aún no estaba inscrita». Se queda con su fecha la comprobación «supervisada»
de mTBILL (10/11): el expediente de hoy no volvió a abrir esa página de la
BaFin.

## 4. El SQL

`aplicar-y-aprobar.sql` lleva **288 sentencias en una sola transacción**
`begin isolation level serializable; … commit;`:

| Bloque | Qué hace |
|---|---|
| `do $guarda$` (solo lee) | Exige que lo publicado sea la `434217eb` (o ya la nueva), con su huella y aprobada; que el catálogo no esté retirado; que no sea antes del 20/11 ni después del **27/11**; y que la revisión nueva no exista con otra huella. |
| 284 `insert … on conflict do nothing` | Solo en `rwadar_catalogo`: 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`, 107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en `ofertas`. Las mismas filas por tabla que la `2026-11-13`. |
| `do $aprobar$` | Comprueba 25 plataformas y 22 ofertas (8/13/1) y aprueba la revisión (solo `update rwadar_catalogo.revisiones`). Si no queda publicable, deshace todo. |

Sin DDL, borrados, permisos, Auth ni funciones; nada en `public.*`. De las 288
sentencias, 19 cambian algo más que la revisión, la huella y la fecha
(`DIFF-ENTREGA.md`, «Sentencias del SQL que cambian»). Cabecera y referencia de
aprobación sin nombres de personas («el responsable del proyecto»).

## 5. Pruebas (salida real)

### 5.1 `motor.mjs preparar 2026-11-20 --repetir`

```
"revisionId": "a513851a-c3ce-26b1-5dfa-4be8c359f8f8",
"sha256": "4418ad20bafb5d186dc7f9639121b7f9a70d0822bb991d2f08fa2468fd75ef2f",
"plataformas": 25, "fuentesRadar": 69, "ofertas": 22,
"colecciones": { "principales": 8, "secundario": 13, "en_camino": 1 },
"cambios": 87, "noAplicado": 4, "pruebas": 87, "difiere": 19,
"repetido": "mismos SHA-256 las dos veces"
```

### 5.2 `motor.mjs comprobar 2026-11-20 --exportar=…/exportado-2026-11-20` (PGlite, 21 s)

`resultado: correcto`, 19 comprobaciones y 6 casos de fallo. Entre ellas:

- inventario: 288 sentencias (begin, guarda, 284 inserts, aprobación, commit),
  las mismas filas por tabla que la 2026-11-13;
- cadena de producción (seed + 18 lotes, del 22/10 a la 2026-11-13): la
  publicada es la `434217eb`; antes de aplicar, PGlite enseña lo mismo que se
  leyó hoy como visitante;
- idempotente (aplicarla dos veces da lo mismo);
- «cada cambio de contraste-2026-11-20.json está en lo que lee un visitante
  (87 cambios en 20 fichas; en las 15 que la vista enmascara, en
  rwadar_catalogo) y lo de antes ya no; lo no aplicado sigue como estaba (6
  comprobaciones de 4 puntos); no aparece «autorizado el 17/02/2026»,
  «Autorizado por la AMF el 17/02/2026»; 2 fichas sin cambios, iguales salvo
  las fechas; todos los avisos con fecha del 20/11»;
- vigencia: la web lo acepta el 20/11 y el 27/11 y lo da por caducado el
  28/11; la app lo acepta;
- tarjetas: las 22 en castellano, sin «por participación»; cambian 14 y cada
  una enseña el texto nuevo;
- sincronizador real con estas vistas: 25/22/5, CSV de 30 filas idéntico; 52
  fichas web, ninguna nueva ni retirada; en las fichas web, lo esperado de
  Spiko Euro (certificado del 23/02/2026, sin «17/02/2026»), Letras Euro
  (2,35 %), Cohotel (110 €), Pottendorfer (81 €, 82,22 €, sin 116,73 €),
  Kraken («más de 1.000 acciones») y Hausera («con la preventa ya abierta»);
- los 6 casos de fallo (otra publicada, otra huella, catálogo retirado,
  destino con otra huella, lote caducado, catálogo incompleto) fallan sin
  dejar nada; y si ya estaba importada como borrador, se aprueba sin duplicar.

Resultado completo: `pruebas-locales.json`.

### 5.3 Ensayo «después de aplicar» en una copia aparte

Copia aparte (`git clone --local` en `ee03e44`, con la carpeta del ciclo y el
SQL copiados encima), 17:19:41–17:25:41 UTC. Detalle en `ensayo-despues.json`.

| Paso | Salida |
|---|---|
| `preparar-entrega.mjs --repetir` | exit 0 · misma revisión y mismo SHA `4418ad20…ef2f`, «mismos SHA-256 las dos veces» |
| `comprobar-entrega.mjs --exportar=DIR` | exit 0 · «resultado: correcto», 19 comprobaciones y 6 casos de fallo |
| `despues-de-aplicar.mjs` antes de sincronizar | exit 1, como debe: «el catálogo sincronizado no es la revisión a513851a…: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js» |
| `sincronizar.js` con el REST simulado | exit 0 · «Sincronizado desde Supabase: 25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas.» · «rwadar.csv regenerado: 30 filas.» |
| `despues-de-aplicar.mjs` | exit 0 · 13 mínimos cortos, 1 texto con fecha; comprobaciones al 20/11: 43 de 44 (mTBILL «supervisada» se queda del 10/11) |
| `despues-de-aplicar.mjs` otra vez | exit 0 · «Nada que cambiar: ya estaba hecho.» |
| `volcar-seed.js` con el REST simulado | exit 0 · «02_seed.sql regenerado: 25 en el radar, 5 descartadas, 13 fuentes.» Sin diferencias |
| `transparencia.mjs` | exit 0 · «Transparencia escrita: 22 ofertas con transparencia» |
| `rwadar-fichas.js` | exit 0 · «Archivos actualizados: 55» |
| `npm test` (raíz) | **exit 0** en 5 min 38 s: test:db, test:web, test:qr, test:mobile, test:tools y test:acceso, todo verde (11, 22, 79, 119, 693 y 367 pruebas de `node --test`, 0 fallos) |

## 6. Lo que no se aplicó tal cual (y por qué)

1. **Spiko Euro: la dirección de la ficha GECO c124199 sigue en la lista de
   fuentes de la ficha** (`documentacion-ofertas.json`, «fuentes»). El motor
   no sabe quitar una fuente de esa lista. Ya no la cita ninguna referencia ni
   la descripción, y no está en las fuentes de la oferta del escaparate. Para
   quitarla del todo: montar sin el motor (`motor:false`) o añadir al motor un
   cambio «quitar fuente de la ficha».
2. **Spiko Euro: el claim del expediente** («según el certificado de la AMF y
   el folleto») no se corrige aquí: el montador no puede editar expedientes.
   Lo publicado ya lleva el texto del revisor.
3. **Textos nuevos de tarjeta que proponen los expedientes** de Spiko (las
   tres), Kraken, Robinhood y Prosegur Digital Gold (misma información, otra
   redacción): DECISIONES no los recoge; se conservan los publicados (PGlite
   comprueba que siguen).
4. **Spiko Letras Euro y Dólar con la VL del 20/11:** al escribirlos aún no
   estaba (sale a las 18:00 UTC). Van con la del 19/11. Si se aplica después
   de las 18:00 UTC y se quiere la del 20/11, hay que rehacer los tres cambios
   de cada fondo (rentabilidad, métrica y referencia) en `decisiones.json` con
   la VL nueva y repetir `preparar`, `comprobar` y la revisión del SQL.

Lo que el expediente propone y no entra está declarado en
`decisiones.json` → `ofertas.<slug>.difiere` (19 casos, con su motivo).

## 7. Pendiente

- Hausera: el 25/11 empieza la suscripción de Alicante 3 y el resumen quedará
  viejo ese día.
- Spiko Smart Cash: por qué la AMF dejó de publicar la ficha GECO.
- mTBILL: la comprobación «supervisada» de `transparencia.json` sigue del
  10/11.
- Copias con nombres de personas (`mtbill-ft.txt`, render de particulares de
  Spiko): están en `crudo/` (fuera de Git); ninguna prueba de
  `decisiones.json` las cita.

## 8. Pasos para aplicarla (ciclo autorizado por la orden del responsable del proyecto)

1. Pasar la revisión de la entrega (SQL, contenido y cumplimiento) y, tras
   corregir, `motor.mjs auditar 2026-11-20 --antes=<copia del SQL revisado>
   --revisado=4418ad20bafb5d186dc7f9639121b7f9a70d0822bb991d2f08fa2468fd75ef2f
   --secretos=<gitleaks> --exigir-secretos --escribir`.
2. Decidir la VL de Spiko Letras (§6.4) antes de aplicar.
3. Antes del **27/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `434217eb-9b7f-1cd9-a851-fbde7bced2bf`. Si no, parar.
4. Aplicar exactamente
   `rwadar-app/data/importaciones/catalogo-2026-11-20-v2/aplicar-y-aprobar.sql`
   con el acceso autorizado («Aplicar catálogo», etiqueta `2026-11-20`; una
   transacción; si falla, no seguir). Nunca `catalogo.sql` (sin guarda).
5. Leer como visitante las vistas v2 y guardarlo en
   `lectura-despues-de-aplicar/`: revisión `a513851a-…`, 25/22 (8/13/1),
   `verificada_el` 20/11 y los cambios de §3.
6. `node rwadar-app/sincronizar.js`,
   `node rwadar-app/data/verificaciones/2026-11-20-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
7. Publicar la web, enviar la OTA (la app lleva `transparencia.json`) y lanzar
   «Avisar novedad».

## Archivos

- `decisiones.json` (lo propio de hoy), `DIFF-ENTREGA.md`, `contraste-2026-11-20.json`,
  `escaparate-publicacion.json`, `documentacion-ofertas.json`,
  `radar-canonico-26.json`, `manifiesto-catalogo.json`, `pruebas-locales.json`,
  `ensayo-despues.json` y los guiones finos (`preparar-entrega.mjs`,
  `comprobar-entrega.mjs`, `despues-de-aplicar.mjs`, `ensayo-rest-simulado.cjs`).
- SQL: `rwadar-app/data/importaciones/catalogo-2026-11-20-v2/`.

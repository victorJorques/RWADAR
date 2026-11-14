# BTC en papel · diseño (contrato entre piezas)

Encargo de Víctor (14/11/2026): «Mira estos dos vídeos y apáñate como sea para
hacerlo con BTC». Los dos reels presentan un paquete de *skills* de Claude para
day trading de acciones (Jake Schincariol, `day-trader-skill`, once skills:
escáner de gráficos, noticias, entrada, salida, máquina del tiempo,
presupuesto, riesgo, bróker en papel, alertas, resultados empresariales y
Pelosi). Esto es lo mismo para **bitcoin**, adaptado a un mercado que no cierra
nunca, con el dinero en euros y **solo en papel**: no hay bróker real, no hay
claves, no se mueve dinero. Las dos skills que solo tienen sentido con acciones
(resultados trimestrales y operaciones de congresistas de EE. UU.) no se
copian; en su lugar entra el contexto propio de BTC (índice de miedo y
codicia y que los exchanges coincidan en el precio).

## Reglas que valen para todo

- Node 22, módulos ES (`.mjs`), **sin dependencias** (fetch nativo,
  `node:test`, `node:assert/strict`). Nada de `npm install`.
- Todo vive en `.claude/skills/btc-trader/`. El estado de cada día (cartera de
  papel, caché de velas, pasos del flujo, informes) va en `estado/`, que no va
  a Git (`.gitignore`). Se puede cambiar con la variable `BTC_TRADER_ESTADO`.
- Nombres, mensajes y salida en **castellano llano**. Importes con formato
  español (`61.027,86 €`), horas en Europe/Madrid con la hora UTC al lado
  cuando importe.
- **Solo papel.** Ninguna pieza habla con un exchange para operar ni guarda
  claves. Si `config.papel` no es `true`, el gestor de riesgo bloquea.
- **Sin mirar al futuro.** Toda señal en la vela `i` usa solo velas `0..i`
  **cerradas**. Los indicadores son causales (el valor en `i` no depende de
  `i+1…`). Los pivotes se confirman con retraso (`der` velas) y solo existen a
  partir de la vela que los confirma.
- Si en una vela se tocan stop y objetivo a la vez, cuenta como **stop**
  (prudente).
- Las pruebas no usan la red: datos sintéticos con semilla
  (`pruebas/sinteticas.mjs`) y respuestas reales guardadas pequeñas
  (`pruebas/fixtures/`). En los `*.test.mjs` no escribas rutas de documentos
  del proyecto ni la palabra que nombra el sello del proyecto (lo vigila
  `.github/flujos.test.mjs`).
- Pie de cada salida (`AVISO` en `lib/comun.mjs`): «Herramienta educativa en
  papel. No es asesoramiento financiero. Simular no garantiza resultados: la
  mayoría de quienes hacen trading intradía pierden dinero.»

## Forma de los datos

```js
// Vela: hora de APERTURA en ms UTC; números (no cadenas)
{ t, o, h, l, c, v }          // ascendentes, sin duplicados
// Una serie
{ fuente: 'coinbase'|'binance'|'kraken'|'bitstamp', par: 'BTC-EUR', intervalo: '1h',
  velas: [Vela], ultimaCerrada: <índice de la última vela cerrada o -1>, leidaEn: ms }
```

Intervalos: `1m 5m 15m 1h 4h 1d` (`INTERVALOS` en ms en `lib/comun.mjs`).
Coinbase no tiene 4h: se agrega desde 1h alineado a 00/04/08/12/16/20 UTC.

## Piezas y firmas

### `lib/comun.mjs`
`INTERVALOS`, `AVISO`, `dirEstado()`, `leerEstado(nombre, defecto)`,
`escribirEstado(nombre, datos)` (JSON en `estado/`), `cargarConfig()`
(fusiona `config.ejemplo.json` con `estado/config.json`, que crea si falta),
`fmtDinero(n, moneda='EUR')`, `fmtBtc(n)` (8 decimales), `fmtPct(n, dec=2)`,
`fmtHora(ms)` (Europe/Madrid), `diaMadrid(ms)` → `'AAAA-MM-DD'`,
`prng(semilla)` (mulberry32, devuelve `() => [0,1)`), `redondearAbajo(x, paso)`.

### `lib/datos.mjs`
- `velas({ par, intervalo, desde, hasta, limite, fuente='auto', cache=true, fetch })`
  → Serie. `auto`: coinbase → binance (`data-api.binance.vision`) → kraken →
  bitstamp. Pagina (coinbase 300 por petición, binance 1000), espera entre
  peticiones, reintenta con espera creciente, tiempo máximo por petición.
  Caché en disco solo de velas cerradas.
- `precio({ par, fetch })` → `{ precio, compra, venta, hora, fuente }`.
- `preciosCruzados({ par, fetch })` → `{ precios: [{fuente, precio}], mediana, divergencia_pct }`.
- `agregar(velas, msIntervalo)`.
- Pares: `BTC-EUR` (coinbase `BTC-EUR`, binance `BTCEUR`, kraken `XBTEUR`,
  bitstamp `btceur`) y `BTC-USD` (`BTC-USD`, `BTCUSDT`, `XBTUSD`, `btcusd`).

### `lib/indicadores.mjs` (puros, arrays alineados con la entrada, `null` sin datos)
`sma(v,n)`, `ema(v,n)`, `rsi(cierres,14)` (Wilder), `atr(velas,14)` (Wilder),
`bollinger(cierres,20,2)` → `{media, sup, inf}`, `donchian(velas,n)` →
`{max, min}` de las `n` velas **anteriores** (sin la actual),
`vwapDiario(velas)` (reinicia a las 00:00 UTC), `volumenRel(velas,n)`
(volumen / media de las `n` anteriores), `pivotes(velas, izq, der)` →
`{altos: [{i, precio, confirmadoEn}], bajos: [...]}`,
`rangoApertura(velas, minutos=60)` → por día UTC `{dia, max, min, cierraEn}`.

### `lib/escaner.mjs` (escáner de gráficos)
- `prepararContexto(velas, intervalo)` → `{ velas, intervalo, ema20, ema50, ema200, rsi, atr, vwap, bb, volRel, donchian24, pivotes, rangos }`.
- `SETUPS`: `[{ id, nombre, intervalos, direccion: 'larga'|'corta', detectar(ctx, i) }]`
  donde `detectar` devuelve `null` o
  `{ nivel_entrada, nivel_invalidacion, fuerza: 0-100, motivo, datos }` usando solo `0..i`.
  Setups: `ruptura-rango-apertura`, `ruptura-rango`, `bandera-alcista`,
  `rebote-sobreventa`, `retroceso-tendencia`; y `ruptura-bajista` (corta,
  solo informativa mientras `cortos` sea `false`).
- `tendencia(ctx, i)` → `'alcista'|'bajista'|'lateral'` con su porqué.
- `escanear({ series: { '15m': Serie, ... }, ahora, config })` →
  `{ hora, par, precio, tendencias, setups: [{ id, nombre, intervalo, direccion, estado: 'activo'|'formandose', nivel_entrada, nivel_invalidacion, fuerza, motivo, datos, vela_t }], niveles_clave, contexto }`
  ordenados por fuerza. Solo velas cerradas.

### `lib/entrada.mjs` (temporizador de entrada)
`vigilarEntrada({ setup, serie, ahora, config })` →
`{ estado: 'esperar'|'disparo'|'invalidado'|'caducado'|'demasiado_lejos', precio, motivo, vela_t }`.
Dispara cuando una vela cerrada de `config.entrada.intervalo` cierra por encima
de `nivel_entrada` con volumen relativo ≥ `volumen_minimo_rel` y sin pasarse
más de `persecucion_max_atr` ATR del nivel.

### `lib/salida.mjs` (plan de salida)
`planSalida({ setup, entrada, atr, ahora, config })` →
`{ entrada, stop, objetivo, rr, riesgo_por_btc, salida_por_tiempo: ms, motivo, avisos: [] }`.
Stop: el de la estructura (`nivel_invalidacion`) o `entrada − stop_atr·ATR`,
el más cercano que quede por debajo de la estructura; si la estructura queda a
más de `stop_max_atr` ATR, se avisa. Objetivo: `entrada + rr_objetivo·(entrada − stop)`.

### `lib/maquina.mjs` (máquina del tiempo)
- `simular({ velas, inicio, entrada, stop, objetivo, horas, simulaciones, semilla, franjas_vecinas, costes })`
  → `{ simulaciones, objetivo_primero_pct, stop_primero_pct, abierta_pct, resultado_pct: { mediana, p5, p25, p75, p95, media }, histograma: [{ desde, hasta, n }], dias_usados, metodo }`.
  Rehace las próximas `horas` 10.000 veces con velas de 5 minutos de los
  últimos `dias` días tomadas de la **misma franja horaria UTC** (± `franjas_vecinas`)
  de días al azar: cada vela se copia en proporción (apertura→máximo, mínimo,
  cierre) y se encadena al cierre anterior. Reproducible con la semilla.
- `historico({ velas, intervalo, preparar, detectar, plan, resolver, costes, dias })`
  → `{ senales, objetivo, stop, abiertas, acierto_pct, esperanza_R, resultado_medio_pct, lista: [...] }`.
  Repite la regla en el pasado real: detecta con datos hasta `i`, entra a la
  apertura de `i+1` con deslizamiento, resuelve vela a vela hacia delante
  (stop y objetivo en la misma vela = stop; sin tocar ninguno en `horas`, se
  cierra al último cierre y cuenta como «abierta»). Una operación a la vez.
  Recibe las funciones por parámetro (no importa el escáner).

### `lib/presupuesto.mjs` (gestor de presupuesto)
`dimensionar({ entrada, stop, config, cuenta })` →
`{ btc, nominal, riesgo, comisiones, perdida_si_stop, limitado_por: 'perdida_max'|'posicion_max'|'efectivo'|'minimo', motivo }`.
La pérdida si salta el stop incluye comisión de entrada y salida y
deslizamiento. Redondea hacia abajo a satoshis (1e-8).

### `lib/riesgo.mjs` (gestor de riesgo)
`comprobar({ orden, cuenta, config, contexto })` →
`{ veredicto: 'PASA'|'BLOQUEADA', comprobaciones: [{ regla, ok, detalle }], motivos: [] }`.
`orden = { lado, btc, entrada, stop, objetivo }`; `cuenta` = resumen de la
cartera de papel (`efectivo`, `capital`, `pnl_hoy`, `operaciones_hoy`,
`posiciones`); `contexto = { ahora, precio_actual, noticias_alto_impacto: [{titulo, fecha}], divergencia_pct }`.
Reglas: solo papel, solo largos (salvo `cortos`), sin apalancamiento, pérdida
máxima por operación, pérdida máxima del día (contando esta), operaciones por
día, R:R mínimo, tamaño máximo de la posición, efectivo disponible, ventana de
entrada UTC, bloqueo por noticia de alto impacto reciente, divergencia entre
exchanges, coherencia `stop < entrada < objetivo` y precio actual cerca de la
entrada. El «día» es el de Madrid.

### `lib/papel.mjs` (bróker en papel)
Cartera en `estado/papel.json`: `{ moneda, saldo_inicial, efectivo, posiciones: [], historial: [], creada }`.
`cargarCartera(config)`, `resumenCartera(cartera, precio, ahora)` (lo que
pide `riesgo`), `ticket(orden, config)` → texto llano de la orden,
`abrir({ cartera, orden, riesgo, confirmacion, precio, ahora, config })` (exige
`confirmacion` = «sí»/«si» y `riesgo.veredicto === 'PASA'`; ejecuta al precio
con deslizamiento y comisión), `revisar({ cartera, velas, precio, ahora })`
(cierra por stop, objetivo o tiempo mirando máximos y mínimos desde la última
revisión), `cerrar({ cartera, id, precio, motivo, ahora, config })`,
`guardarCartera(cartera)`.

### `lib/alertas.mjs`
`estado/alertas.json`. `anadirAlerta({ tipo: 'sobre'|'bajo', nivel, nota })`,
`comprobarAlertas({ alertas, velas, precio, ahora })` → saltadas (una vez).

### `lib/noticias.mjs` (noticias que mueven el precio)
`leerNoticias({ horas, fetch, ahora })` →
`{ noticias: [{ titulo, enlace, fuente, fecha, resumen, etiquetas, impacto: 'alto'|'medio'|'bajo', sentido: 'positivo'|'negativo'|'neutro' }], fuentes: [{ nombre, ok, n, error }] }`.
RSS de Cointelegraph, Decrypt, Bitcoin Magazine y CoinDesk; solo lo que va de
bitcoin o mueve todo el mercado (Fed, ETF, SEC, hackeos, ballenas,
liquidaciones…). Sin duplicados.
`miedoCodicia({ fetch })` → `{ valor, clase, fecha }` (alternative.me).

### `btc.mjs` (la orden de Claude) e `lib/informe.mjs`
`node .claude/skills/btc-trader/btc.mjs <orden>`:
`escanear`, `noticias`, `entrada`, `salida`, `maquina`, `presupuesto`,
`riesgo`, `ticket`, `papel [estado|abrir --confirmar sí|revisar|cerrar <id>]`,
`alertas [lista|sobre <nivel>|bajo <nivel>|comprobar]`, `todo [--hipotetica]`
e `informe [--salida <ruta.html>]`. Cada paso guarda `estado/<paso>.json` y
escribe un resumen en llano; `--json` saca el JSON. `todo` corre escáner →
noticias → entrada → salida → máquina del tiempo → presupuesto → riesgo →
ticket y **se para ahí**: abrir en papel es otra orden con «sí».
`informe` escribe una página HTML autónoma (gráfico SVG de velas con
entrada/stop/objetivo, setups, noticias, máquina del tiempo, riesgo y cartera).

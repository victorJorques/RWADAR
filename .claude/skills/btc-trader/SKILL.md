---
name: btc-trader
description: «BTC en papel». Analiza bitcoin (BTC-EUR) y opera SOLO EN PAPEL, sin dinero real, sin bróker y sin claves. Incluye escáner de gráficos, noticias que mueven el precio, temporizador de entrada, plan de salida, máquina del tiempo (10.000 simulaciones), presupuesto, gestor de riesgo, bróker en papel, alertas e informe HTML. Úsala cuando Víctor diga «analiza BTC», «escanea bitcoin», «¿entro en bitcoin?», «noticias de bitcoin», «máquina del tiempo», «opera BTC en papel», «cómo va mi cartera de papel» o «haz lo del vídeo con BTC», o pida algo parecido sobre bitcoin y trading en papel.
---

# BTC en papel

## Qué es

Víctor pasó dos reels de un paquete viral de *skills* de Claude para hacer
day trading de acciones: escáner de gráficos, noticias, entrada, salida, una
«máquina del tiempo» que simula 10.000 veces antes de arriesgar, presupuesto,
riesgo, bróker en papel y alertas. Esto es lo mismo, pero para **bitcoin**,
con el dinero en euros y **solo en papel**. Hay dos cambios de fondo:

- BTC cotiza a todas horas: no hay apertura ni cierre de bolsa. Por eso el
  «rango de apertura» es la primera hora del día UTC y el «día» de las
  reglas es el de Madrid.
- Lo que en el vídeo solo vale para acciones (resultados trimestrales y las
  operaciones de congresistas de EE. UU.) no está. En su lugar entran el
  índice de miedo y codicia y la comprobación de que los cuatro exchanges
  (Coinbase, Binance, Kraken y Bitstamp) dan el mismo precio.

Todo se hace con una orden:

```bash
node .claude/skills/btc-trader/btc.mjs <orden> [opciones]
```

Cada paso escribe un resumen corto en castellano llano, con las cifras, la
hora y la fuente, y lo guarda en `estado/<paso>.json`. Con `--json` saca el
JSON. Todas las salidas acaban con el aviso de que es una herramienta
educativa y no un consejo de inversión.

## Las funciones del vídeo y sus órdenes

| En el vídeo | Orden | Qué hace |
|---|---|---|
| Escanear gráficos | `escanear` | Tendencia en 15m, 1h, 4h y 1d; seis setups clásicos (ruptura del rango de apertura, ruptura de rango, bandera alcista, rebote desde sobreventa, retroceso en tendencia y ruptura bajista, que solo informa); niveles a vigilar |
| Seguir noticias | `noticias` | Titulares de Cointelegraph, Decrypt, Bitcoin Magazine y CoinDesk que mueven BTC, con impacto y sentido, y el índice de miedo y codicia |
| Marcar entradas según tus reglas y tu límite de riesgo | `entrada`, `salida`, `presupuesto`, `riesgo` | Si una vela de 5 min confirma el setup; dónde van el stop, el objetivo y la hora de salida; cuánto BTC comprar sin pasar de tu pérdida máxima; y 14 reglas que dicen PASA o BLOQUEADA, cada una con su porqué |
| Máquina del tiempo | `maquina` | Rehace las próximas 24 h 10.000 veces con velas reales de 5 min de los últimos 60 días a la misma hora, y repite la regla del setup en los últimos 180 días de 1h |
| Bróker en papel | `papel` | Cartera de mentira de 5.000 €: `papel estado`, `papel abrir --confirmar sí`, `papel revisar`, `papel cerrar <id>` |
| Alertas | `alertas` | `alertas sobre 65000 [nota]`, `alertas bajo 58000`, `alertas lista`, `alertas borrar <id>`, `alertas comprobar` |
| Todo seguido | `todo` | Escáner → noticias → entrada → salida → máquina del tiempo → presupuesto → riesgo → ticket, y **se para ahí** |
| Página para enseñar | `informe` | HTML con gráfico de velas, setups, noticias, máquina del tiempo, riesgo y cartera |

Otras opciones útiles: `todo --setup <id>` analiza un setup concreto;
`maquina --entrada 61000 --stop 60200 [--objetivo 62600] [--setup <id>]`
simula un plan escrito a mano; `presupuesto --entrada 61000 --stop 60200`
dimensiona sin escanear. `ayuda` lista todo.

## El flujo, en orden

1. **`todo`**. Lee las velas y los precios, las noticias y el índice; busca
   un setup largo activo. Si no lo hay, lo dice («Hoy no hay jugada según
   tus reglas»), da los niveles a vigilar y **se para**. Si lo hay, sigue
   hasta dejar un ticket preparado. No abre nada.
2. Si Víctor quiere ver el flujo entero aunque no haya jugada:
   **`todo --hipotetica`**. Monta una compra al precio de ahora con stop a
   1,5 ATR de 1h y objetivo a `rr_objetivo` veces el riesgo. Sale marcada
   como HIPOTÉTICA en el texto, en los JSON, en el ticket y en el informe.
3. **`informe`** (o `informe --fragmento`) para enseñarlo como página. El
   archivo queda en `estado/informe-AAAA-MM-DD-HHmm.html`. El fragmento
   (`…-fragmento.html`) es para publicarlo como artefacto privado de
   claude.ai, y solo si Víctor lo pide.
4. Solo si Víctor dice «sí» a ese ticket concreto: **`papel abrir --confirmar sí`**
   (más `--hipotetica` si el ticket es hipotético). Vuelve a pasar el riesgo
   con el precio, la cartera y las noticias de ese momento y, si algo ha
   cambiado, no abre. Cada ticket se abre una sola vez y caduca.
5. **`papel revisar`** cierra lo que haya tocado el stop, el objetivo o su
   hora de salida. **`papel estado`** enseña cómo va.

## Cómo presentar los resultados a Víctor

- En lenguaje llano y corto. Primero la conclusión en una frase: hay
  jugada, no la hay o es hipotética. Después lo que la sostiene.
- Cada cifra con su hora (de Madrid) y su fuente: «61.027 € en Coinbase a
  las 11:20». Si un dato no llegó, se dice.
- Los titulares llegan en inglés: tradúcelos al castellano al contarlos y
  di de qué medio son.
- Si no hay jugada, di «hoy no hay jugada» sin adornos. Explica qué niveles
  vigilar y por qué, y ya está.
- **Nunca empujes a operar.** No digas «es buen momento» ni «aprovecha».
  Si la máquina del tiempo o el histórico salen negativos, dilo claro aunque
  el gestor de riesgo diga PASA. Pasar las reglas no significa que vaya a
  ganar.
- Enseña lo que ha salido de verdad (la salida de la orden, el informe), no
  lo que debería salir.

## Reglas de seguridad (no se negocian)

- **Solo papel.** `config.papel` tiene que ser `true`; si no, el gestor de
  riesgo bloquea todo.
- **Abrir en papel solo con un «sí» de Víctor a ESE ticket concreto**,
  después de enseñárselo. Un «sí» de antes, a otro ticket o en general no
  vale. Nunca pongas tú `--confirmar sí` por iniciativa propia.
- **Nunca** conectes un exchange real, no pidas ni guardes claves de API y
  no envíes órdenes a ningún sitio. Este paquete solo **lee** datos públicos.
- Si algún día Víctor quiere dinero real, es otra decisión expresa suya y
  otra pieza distinta. Esta no se toca para eso.

## Cambiar sus reglas

Las reglas están en `.claude/skills/btc-trader/estado/config.json`, que se
crea la primera vez copiando `config.ejemplo.json` y no va a Git. Las más
habituales:

- `cuenta.saldo_inicial` (5.000 €).
- `riesgo.perdida_max_operacion` (50 €), `perdida_max_dia` (150 €),
  `operaciones_max_dia` (3), `rr_minimo` (1,5), `posicion_max_pct` (50 %),
  `bloqueo_noticias_min` (30), `divergencia_max_pct` (0,5 %) y
  `distancia_max_entrada_pct` (0,6 %).
- `costes.comision_pct` (0,25 % por lado) y `deslizamiento_pct` (0,05 %).
- `salida.rr_objetivo` (2), `stop_atr` (1,5) y `horas_max` (24).
- `maquina.simulaciones` (10.000) y `dias` (60).

Si el archivo está roto, la orden lo dice y no sigue: los límites de riesgo
no se ignoran en silencio. Para volver a empezar la cartera, se borra
`estado/papel.json` (solo si Víctor lo pide).

## Con /loop

Para que alguien vigile mientras tanto:

```text
/loop 15m node .claude/skills/btc-trader/btc.mjs papel revisar
/loop 15m node .claude/skills/btc-trader/btc.mjs alertas comprobar
```

`papel revisar` mira las velas de 5 min desde la última revisión y cierra lo
que toque. `alertas comprobar` avisa una sola vez de cada alerta que salte.
Ninguna de las dos abre posiciones.

## Limitaciones de verdad

- **La simulación no es una predicción.** Dice qué pasaría si las próximas
  horas se movieran como los últimos 60 días a la misma hora. Cada vela se
  elige por separado, así que pierde las rachas y la inercia del precio.
- **Solo hay 60 días de velas de 5 min** para simular y unos 180 días de 1h
  para el histórico de la regla. Con pocas señales, el histórico dice poco.
- **No ve noticias futuras.** Un anuncio de la Fed o un hackeo cambian todo
  en minutos.
- **En caídas rápidas el stop puede saltar peor** de lo que dice el plan.
  En papel se cuenta un deslizamiento fijo y, si una vela abre ya por debajo
  del stop, se sale a esa apertura.
- **Datos públicos y gratuitos**: los exchanges pueden fallar, cortar
  peticiones o ir con retraso. Si uno falla, se usa otro y se avisa.
- Con un 0,3 % de costes por lado, el R:R real de un setup de 1h queda muy
  por debajo del bruto. El gestor de riesgo compara el bruto con
  `rr_minimo`, así que puede dar PASA a una operación que, con costes, gana
  poco. La salida lo avisa.
- La clasificación de noticias es por palabras clave y se equivoca a veces.

## Si algo falla

- Sin red o con todos los exchanges caídos, la orden lo dice en castellano y
  no inventa datos.
- Detrás de un proxy, si `fetch` de Node no sale, prueba con
  `NODE_USE_ENV_PROXY=1` (y `NODE_EXTRA_CA_CERTS` con el certificado del
  proxy).
- Las velas se guardan en `estado/cache/` (solo las cerradas). Se puede
  borrar sin miedo: se vuelve a descargar.

## Pruebas

Sin red, con datos sintéticos y respuestas guardadas:

```bash
node --test .claude/skills/btc-trader/pruebas/*.test.mjs
```

(Con Node 22, `node --test` necesita los archivos o un patrón, no la carpeta
sola.)

## Archivos

- `btc.mjs`: la orden. Exporta `ejecutar(argv, { fetch, ahora, salida })`
  para probarla sin red.
- `lib/`: `datos` (velas y precios), `indicadores`, `escaner`, `noticias`,
  `entrada`, `salida`, `maquina`, `presupuesto`, `riesgo`, `papel`,
  `alertas`, `informe` y `comun`.
- `DISEÑO.md`: el contrato entre las piezas.
- `config.ejemplo.json`: las reglas de partida.
- `estado/`: lo de cada día (config propia, cartera, caché, pasos e
  informes). No va a Git.

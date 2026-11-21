# «La tokenización en el mundo» en directo · contrato (14/11/2026)

**Estado: construido, revisado (diseño y construcción, con sus arreglos) y
probado en local. LISTO PARA PUBLICAR Y ENCENDER; todavía sin encender ni
publicar.** Nada aplicado en Supabase, ningún flujo lanzado, ninguna OTA.
Encenderlo lo hace el coordinador con el permiso de la dirección (14/11/2026),
paso a paso (apartado 6).

Decisión de la dirección (13/11/2026): «Supabase pregunta a CoinGecko cada 5
minutos (una sola consulta para los 250 tokens) y guarda el punto. La web y la
app lo leen directamente, sin publicar nada. La pestaña 24 h siempre está al
día. Además ahorra unos 15 min diarios de GitHub.»

## 1. En llano

- **Supabase pide a CoinGecko una vez cada 5 minutos** (la lista de 250 tokens
  de la categoría, la misma dirección que el flujo diario) y guarda el dato de
  cada token: los 60 mayores y los de la diaria publicada.
- Con **la misma regla que hoy** (`construirSerieFina`) rehace las dos series:
  un punto cada 5 minutos de las últimas 24 horas y uno cada hora de los
  últimos 30 días. Comprobado: idéntica a la de hoy con la ejecución real del
  13/11 (30 tokens, 289 y 721 puntos) y con 300 casos al azar.
- **Un fallo del propio directo no se le achaca a CoinGecko**: la edad del
  dato de cada token solo se cuenta en los cubos de 5 minutos en que el
  directo leyó bien (o que cubre la siembra). Si Supabase se para 2 horas,
  nadie queda «fuera» ni «sin dato»; la línea repite el último dato en ese
  rato y la nota dice «El directo no pudo leer del … al …».
- **La web y la app lo piden al servidor de la web** (`/api/tokenizacion/directo`),
  que lo lee de Supabase como mucho una vez cada 5 minutos por copia del
  servidor. La cifra grande y el final de todas las pestañas son el último
  dato del directo.
- **Si el directo falla o se queda viejo (más de 20 minutos)**, la web y la
  app usan la copia publicada, como hoy, y lo dicen con una línea. Apagado a
  propósito, sin aviso.
- **Mide lo mismo que la diaria** (medido el 13/11/2026 con los 30 tokens de
  la diaria de las 21:08 UTC): la suma por `/coins/markets` (41.854,3 M$ a
  las 21:43 y 41.863,0 M$ a las 21:52 UTC) y la de los últimos puntos de
  `market_chart` (41.867,4 M$, pedidos de 21:44 a 21:51) se separan un
  **−0,027 %** con la lectura más cercana y un **−0,017 %** en el mismo cubo
  de 5 minutos (con la grabación de las 14:47 UTC, +0,005 %). El 14/11 a las
  00:38 UTC, figure-heloc daba 27.727.293.617 en `markets` y 27.726.634.853
  en `market_chart` (0,0024 %). Por token, la mayor diferencia fue
  kinesis-gold (−0,96 %, momentos distintos). La costura del 5 % de
  `unirDirecto` queda muy por encima.
- **Ahorro**: cuando el directo lleve una semana bien, el flujo diario deja de
  hacer las finas: de 22,8 a unos 9,5 minutos por ejecución (unos 400 minutos
  al mes de los 2.000).

## 2. La base (migración 35)

Archivos: `rwadar-app/db/35_mercado_directo.sql` y su copia idéntica
`rwadar-app/supabase/migrations/20261114090000_mercado_directo.sql`; scripts
`35_mercado_directo_{verificar,encender,apagar,deshacer,estado}.sql`. No toca
nada de las migraciones 01-34: solo crea el esquema `rwadar_mercado` y
`public.tokenizacion_directo()`.

| Tabla | Para qué | Retención |
|---|---|---|
| `configuracion` (1 fila) | interruptor, lista de la diaria (en su orden), estado del reloj, siembra, llamadas del mes | — |
| `tokens` | ids cortos de CoinGecko | — |
| `obs_5m` / `obs_1h` | un dato por token y cubo (el último) | 49 h / 35 días |
| `lecturas` | cubos de 5 minutos con lectura buena del directo | 35 días |
| `directo` (1 fila) | el documento compacto que se sirve | — |
| `registro` | una fila por llamada a CoinGecko | 7 días |

Todas con RLS y sin políticas; ningún permiso para `public`, `anon`,
`authenticated` ni `service_role`. Funciones `security definer` con
`search_path` vacío. Lo único público: `public.tokenizacion_directo()`
(`anon` y `authenticated`) → `{"estado":"apagado"}`, `{"estado":"sin_datos"}`
o `{"estado":"ok","doc":…}`.

**Relojes** (no los crea la 35, los crea `encender`):

| Nombre | Horario | Orden |
|---|---|---|
| `rwadar-mercado-pedir` | minutos 3, 8, 13… 58 | `select rwadar_mercado.pedir()` |
| `rwadar-mercado-leer` | minutos 4, 9, 14… 59 | `select rwadar_mercado.leer()` |

**Reglas de la llamada** (`pedir_coingecko`): nunca dos en la misma ranura de
5 minutos (las que empiezan en el minuto 3, 8…) ni a menos de 240 s; una en
vuelo de menos de 2 minutos espera; más vieja, se da por perdida. Agente fijo
`RWAdar/1.0 (+https://rwadar.pages.dev)`. Clave Demo de CoinGecko solo si
existe en Vault (`RWADAR_COINGECKO_DEMO`; hoy no existe). Como mucho 288
llamadas al día.

**Esperas tras fallos**, contadas desde la petición (menos 30 s de margen):
429 → el primero solo espera a la ranura siguiente (salvo que `Retry-After`
pida más: 900 → 15 minutos justos); desde el segundo seguido, 10, 20, 40 y 60
minutos. Otros fallos (sin respuesta, 5xx, JSON roto, lista corta…) → desde
el tercero seguido, 15, 30 y 60 minutos.

**Qué se guarda** (`guardar_mercados`): de cada elemento válido (id, número
entre 0 y 1e14, hora ISO), con hora `least(last_updated, hora de la
respuesta)`; los 60 mayores y los de la diaria; un dato por cubo, el más
reciente. Freno: menos de 25 válidos, JSON roto o más de 4 MB → no se guarda
nada. Si falta un token de la diaria (figure-heloc en su hueco), se guardan
los demás y el que falta se arrastra con la regla de siempre.

**La lista de la diaria**: la base relee
`https://rwadar.pages.dev/datos/tokenizacion-serie.json` cada 15 minutos. Si
no vale, se queda la anterior y `diaria_leida_el` no avanza (el servidor
avisa si pasa de 45 minutos).

### 2.1 El documento compacto

```json
{ "v": 1, "generado": "2026-11-13T22:27:00Z", "diaria": "2026-11-13T21:05:00Z", "diariaLeida": "2026-11-13T22:15:00Z",
  "tokens": ["figure-heloc", "…"],
  "series": { "5m": { "desde": "2026-11-12T22:25Z", "arrastre": 288, "fuera": [], "valorFuera": 0,
                      "largos": ["figure-heloc"], "valores": [41973827164, "…"], "n": [[289, 30]],
                      "sinLectura": [["2026-11-13T15:10Z", "2026-11-13T22:10Z"]] },
              "1h": { "…": "…" } } }
```

`generado` es la hora de la última respuesta buena de CoinGecko (nunca
`now()`). `valores`: un entero por cubo, seguidos; `n`: cuántos tokens suma
cada punto, en tramos; `sinLectura`: los ratos sin lectura del directo (20
como mucho). Ocupa unos 13 kB (el formato de la fina publicada, 38 kB).

## 3. El servidor de la web

`GET /api/tokenizacion/directo` (`rwadar-acceso/tokenizacion-servidor.mjs`,
`crearTokenizacionDirectoServidor`). Solo GET, sin parámetros. Lee
`/rest/v1/rpc/tokenizacion_directo` con la clave publicable, sin cookies ni
`Authorization` del visitante, 64 kB como mucho.

| Respuesta | Cuándo | Memoria |
|---|---|---|
| 200 `{ version: 1, fina, sinLectura }` | casa con la diaria del despliegue, ≤ 20 min, no más de 5 «del futuro», la base leyó la diaria hace ≤ 45 min | hasta generado + 6,5 min (entre 15 s y 5 min; si ya pasó, 60 s) |
| 404 `directo_apagado` | sin la 35, deshecha o apagada | 5 min |
| 503 `directo_sin_datos` / `directo_no_valido` / `directo_no_casa` / `directo_atrasado` | lo que dice; `directo_no_valido` también si las dos series vienen a `null` (nada que pintar: así lo ven la alarma diaria y `comprobar-publicado`, no un 200 vacío; revisión del 14/11) | 60 s |
| 503 `directo_no_responde` | Supabase no responde (si hay uno guardado de ≤ 20 min, ese con 200) | 60 s |

`fina` va en el formato de `tokenizacion-serie-fina.json` y pasa
`validarSerieFina` sin cambios. Peticiones a la vez: una sola lectura.
`Cache-Control: public, max-age=…`; sin `Set-Cookie` ni `Vary: Cookie`.

**Por qué el servidor y no el navegador ni la app directo a Supabase**: la
salida de Supabase es como mucho una lectura cada 5 minutos por copia del
servidor (no una por visita), la IP del visitante no llega a Supabase, la CSP
no cambia y, sin parámetros, nadie se salta la memoria. La función sigue siendo
pública con la clave publicable (riesgo aceptado, como el catálogo: 13 kB por
llamada; si se abusa, `apagar`).

`comprobar-publicado.mjs` (con `.github/juzgar-directo.mjs`) da por buenos el
200 válido, el 404 `directo_apagado` y los 503 con código conocido (con un
aviso en el registro): no tumban la publicación. Falla con 5xx sin JSON, un
200 que no vale o un código desconocido.

## 4. La web y la app

- **Cadena** (igual en las dos): a la vez la diaria y el directo; si el
  directo vale y casa (`unirDirecto`), «directo»; si no, la fina publicada
  (solo entonces se pide) con `unirSerieFina`, «archivo»; si tampoco, la
  diaria sola. Web: `data-mercado-origen`. App: `cargarSerieConDirecto`.
- **`unirDirecto`** (en `rwadar-movil/lib/tokenizacion.js`, copiado a la web):
  mismos tokens (si no, `no_casa`, sin aviso); el directo no más viejo que la
  diaria; edad ≤ 20 min con la **cabecera Date del servidor** más lo que ha
  pasado desde que llegó (el mayor de `performance.now()` y `Date.now()`);
  freno del 25 % y **costura del 5 %** en el cubo de `generado` de la diaria
  (de la de 5 minutos o de la horaria); **«hoy» es el día UTC del último dato**,
  nunca la hora del aparato; cada día pasado desde la diaria (y su propio
  último punto, si es de un día anterior) sale del cubo de las 23:00 UTC del
  día anterior de la horaria del directo, más su `valorFuera`.
- **Aviso** (`avisoDirecto`): «Ahora no se puede usar el dato en directo: el
  gráfico usa la última copia publicada, con datos hasta el 13/11/2026, 16:05
  (hora de España).» (sin fina publicada: «…, día a día.»). Nunca con
  `apagado` ni con `no_casa`. En Inicio (web y app): «copia de las 16:05».
- **Refresco**: con la página a la vista (web) o la app activa (`AppState`),
  se vuelve a pedir cuando toca el dato siguiente (generado + 6,5 min; si no
  vale, cada 5 min; apagado, cada 15). Sin cambiar de pestaña ni cerrar los
  desplegables; con la cruz a la vista, espera. Al volver a primer plano, si
  han pasado más de 4 minutos, enseguida.
- **Cualquier 404 es «apagado», sin aviso** (`motivoDirecto`, revisión del
  14/11): también el `{"error":"ruta_no_permitida"}` de una web sin la ruta
  (la OTA antes que la web, o una web anterior publicada). Así no sale el
  aviso falso a todos. `comprobar-publicado` y la alarma diaria
  (`juzgar-directo.mjs`) siguen exigiendo `directo_apagado`.
- **Si la pestaña elegida se queda sin datos al refrescar** (en «24 h», el
  directo falla y la copia publicada no trae la de 5 minutos, lo normal en la
  fase 2), la web pasa a la primera pestaña con datos, como al empezar y como
  la app con `elegida` (revisión del 14/11).
- La app: solo JavaScript (OTA). Guardián con
  `--base fa30779f7d1d671f56b5f711cde9cac9eb090310`: `ok:true`, 1.4.2(24). La
  OTA sola es segura: sin la ruta (404, sea cual sea su código), la app sigue
  con la copia publicada y sin aviso.

## 5. El flujo «Mercado en directo (base)»

`.github/workflows/mercado-directo-base.yml`, como «Avisos a registrados
(base)»: solo desde main, la cola de las escrituras, TLS, acciones por SHA,
sin credenciales de git. Escribir **DIRECTO** en «confirmar» para las que
cambian la base o llaman a CoinGecko desde ella.

| Acción | Qué hace | Copia antes |
|---|---|---|
| `ensayo-35` | la 35 y su verificador en una transacción que se deshace | — |
| `aplicar-35` | aplica la 35 y verifica | sí |
| `verificar-35` | solo lee | — |
| `ensayo-37` | la 37 (arreglo de la secuencia de tokens) y su verificador en una transacción que se deshace | — |
| `aplicar-37` | aplica la 37 y pasa los verificadores de la 35 y de la 37 | sí |
| `verificar-37` | solo lee: los verificadores de la 35 y de la 37 | — |
| `ensayo-39` | la 39 (esperas tras fallos sin desbordarse) y su verificador en una transacción que se deshace | — |
| `aplicar-39` | aplica la 39 y pasa los verificadores de la 35 y de la 39 | sí |
| `verificar-39` | solo lee: los verificadores de la 35 y de la 39 | — |
| `probar-coingecko` | con el directo apagado, UNA llamada desde la red de Supabase y qué respondió (estado, bytes, 429, cuántos válidos, el primero, la hora más reciente); y la diaria publicada, como la leerá el reloj (su código y sus bytes; no la guarda). **Sin un 200 de la diaria, falla**: no se enciende (revisión del 14/11) | — |
| `sembrar` | la historia (unas 81 llamadas a CoinGecko desde GitHub, 13 s entre ellas, ~18 min) en una sola transacción. Si un token de la diaria se queda sin alguna de sus dos historias (`days=31` y `days=1`), **para sin escribir nada** (código 3): quedaría «fuera» en toda la ventana sembrada y, con figure-heloc (más de la mitad), no saldría ninguna serie en 24 h ni en 30 días (revisión del 14/11). Se vuelve a lanzar más tarde | — |
| `encender` | siembra y enciende en la misma ejecución (la 35 exige una siembra de menos de 30 min) | — |
| `apagar` | quita los relojes; guarda los datos | — |
| `deshacer` | relojes, función y esquema; comprueba que no queda nada | sí |
| `estado` | solo lee; y qué sirve la web | — |

La copia cifrada va solo antes de `aplicar-35`, `aplicar-37`, `aplicar-39` y `deshacer`: las demás solo
tocan `rwadar_mercado`, que la copia de seguridad no guarda (se rehace con
`sembrar`). Así no se gastan minutos de más.

**Alarma**: el flujo diario de la tokenización (06:23 UTC) tiene un paso nuevo
al final, «Comprobar el gráfico en directo»: si está encendido y no responde
bien dos veces seguidas (90 s entre ellas), el paso falla y GitHub manda su
aviso. Apagado (404) o «no casa», no falla.

### 5.1 Corte del 16/11 y arreglo (migración 37)

**Qué pasó.** Desde el 16/11 a las 03:33 UTC cada llamada a CoinGecko
respondía 200, pero la base no guardaba nada: error `error_2200h` (el
contador de ids de `rwadar_mercado.tokens` llegó a su tope, 32.767). La 35
daba de alta los tokens con `insert … on conflict (cg_id)`, y Postgres gasta
un id por cada fila propuesta **aunque el token ya exista**: unos 60 por
lectura cada 5 minutos, agotado en unos dos días. Solo hay 60 tokens de
verdad: el contador se gastó en nada.

**El arreglo (`37_mercado_directo_secuencia.sql`, copia idéntica en
`supabase/migrations/20261120180000_mercado_directo_secuencia.sql`).** Las
cuatro altas (`guardar_diaria`, `guardar_mercados`, `sembrar` y
`cerrar_siembra`) solo insertan los tokens que no existen y actualizan
`visto_el` aparte; todo lo demás, igual que la 35. Reinicia el contador en
el mayor id + 1. Se puede aplicar dos veces. Pruebas:
`probar-mercado-directo-secuencia.mjs` (con la 35 sola el contador avanza 60
por lectura y, cerca del tope, falla con 2200H; con la 37 no avanza para los
que ya están, avanza uno por cada nuevo y guarda exactamente lo mismo que la
35) y las acciones nuevas en `probar-mercado-directo-flujo.mjs`.

**Pasos (con orden de la dirección, desde main):**

1. `ensayo-37` (sin DIRECTO): debe decir «ENSAYO CORRECTO» y «RWAdar 37 OK».
2. `aplicar-37` (DIRECTO): copia cifrada antes, aplica, «RWAdar 35 OK» y
   «RWAdar 37 OK».
3. `verificar-37` (sin DIRECTO).
4. `sembrar` (DIRECTO): rehace la historia del hueco (más de una hora sin
   datos).
5. `estado` a los 15 y a los 30 minutos: llamadas con 200 y guardadas, sin
   `error_2200h`, y la web sirviendo `/api/tokenizacion/directo` con 200.
   Tras el corte, «espera tras fallos» puede llegar a 60 minutos desde la
   última llamada fallida (fallos seguidos ≥ 3): hasta esa hora no hay
   llamada nueva y no es un fallo; si es así, mirar `estado` otra vez
   pasada esa hora.

Si `ensayo-37` falla con «le quedan N ids» o con «RESTART value … cannot be
greater than MAXVALUE», no se aplica: el mayor id real está cerca del tope
y hace falta renumerar los tokens (otra migración).

### 5.2 Fallo del 18 al 20/11 y arreglo (migración 39)

**Qué pasó.** El log del «Vigilante» del 20/11 (14:07) decía
«rwadar-mercado-pedir: 576 fallos … ERROR: interval out of range», en la
actualización de `rwadar_mercado.configuracion` que apunta el fallo; y
«Tokenización diaria» falló con «503 directo_atrasado», que es la
consecuencia. La 35 calcula la espera tras fallos multiplicando 15 minutos
por 2 elevado a (fallos seguidos − 2) y solo después la limita a 60 minutos:
con 36 fallos seguidos o más, la multiplicación se sale del tipo `interval`
antes de llegar al límite. Como la propia actualización que apunta el fallo
da error, el contador nunca vuelve a 0 y el reloj falla en cada vuelta (cada
5 minutos). La espera de los 429 tenía el mismo defecto desde 35 seguidos.
La 37 arregló la causa del corte y con eso se recuperó, pero el fallo seguía
ahí: el próximo corte largo de CoinGecko lo volvía a disparar.

**El arreglo (`39_mercado_directo_espera.sql`, copia idéntica en
`supabase/migrations/20261121120000_mercado_directo_espera.sql`).**
`pedir_coingecko` y `leer_respuesta` limitan el exponente antes de
multiplicar (como mucho 2 en los fallos, 15 × 4 = 60 minutos; como mucho 4
en los 429, 5 × 16 = 80, que el límite deja en 60). Las esperas son las de
siempre (15, 30 y 60; 10, 20, 40 y 60); solo cambian esos tres exponentes, y
la prueba compara las dos funciones con las de la 35. Se puede aplicar dos
veces. El verificador (`39_mercado_directo_espera_verificar.sql`, solo lee)
mira las fórmulas en la base y calcula 60 minutos con 36, 40 y 576 fallos
seguidos y con 35 y 40 429 seguidos. Pruebas: `probar-mercado-directo-base.mjs`
(con la 35 sola reproduce el «interval out of range»; con la 39, 60 minutos y
la siguiente respuesta buena pone los fallos a 0) y las acciones nuevas en
`probar-mercado-directo-flujo.mjs`. **No está aplicada en Supabase**: con orden
de la dirección, desde main, `ensayo-39` (sin DIRECTO; «ENSAYO CORRECTO» y
«RWAdar 39 OK»), `aplicar-39` (DIRECTO; «RWAdar 35 OK» y «RWAdar 39 OK») y
`verificar-39` (sin DIRECTO).

**Si alguna vez se vuelve a aplicar la 35** (por ejemplo, tras `deshacer`), hay
que aplicar después la 37 y la 39: `aplicar-35` vuelve a poner las funciones
de la 35, cuyas esperas se desbordan, y su verificación solo pasa el
verificador de la 35, así que no lo avisaría.

## 6. Encender (el coordinador, con permiso de la dirección, paso a paso)

Antes:

1. **Comprobar `last_updated` en un hueco de figure-heloc** (obligatorio): un
   día laborable entre las 07:00 y las 12:30 UTC, unas cuantas llamadas
   espaciadas a `/coins/markets` y, al final, `market_chart?days=1` de
   figure-heloc. Lo esperado: su `last_updated` se queda quieto durante el
   hueco (como los fondos de Ondo el 14/11) y el directo lo marca en
   «largos» igual que hoy. Si avanzara con el valor quieto, la suma es la
   misma y solo faltaría esa etiqueta.
2. Ver las capturas y aprobar.

Después, en este orden:

1. PR a `main` (CI verde). El flujo diario no cambia (salvo el paso de la
   alarma, que con el directo apagado no hace nada).
2. Publicar la web (vista previa y producción). Sin la 35, la ruta responde
   404 `directo_apagado` y todo sigue como hoy, sin aviso.
3. «Mercado en directo (base)»: `ensayo-35` → `aplicar-35` (DIRECTO) →
   `verificar-35`.
4. `probar-coingecko` (DIRECTO) 3 o 4 veces, espaciadas (como mucho una cada
   5 minutos): que salga 200 con 250 válidos y `"diaria": 200` (si la diaria
   no da 200, el paso falla: Supabase no puede leer la web y no se enciende
   hasta arreglarlo). Si sale 429 a menudo, hace
   falta la clave Demo (comprobar antes su tope mensual en la cuenta de
   CoinGecko; usarla solo en `pedir()`).
5. `encender` (DIRECTO): siembra (~18 min) y enciende. A los 15 minutos,
   `estado`: 3 llamadas con 200, documento de menos de 10 minutos, «fuera»
   vacío, `/api/tokenizacion/directo` con 200. **Y a los 25-30 minutos, otra
   vez `estado`**: la hora en que la base leyó la diaria tiene que ser
   posterior a la siembra (la siembra la apunta como leída, así que la
   primera lectura de verdad desde Supabase llega hacia el minuto 18). Si
   no, `apagar`: a los 45 minutos la web pasaría a «atrasado» con aviso para
   todos.
6. Mirar /mercado/ en el móvil; enviar la OTA (guardián con
   `--base fa30779…`).
7. Una semana de vigilancia sin gastar Actions: `estado` cuando haga falta y
   `node rwadar-app/tokenizacion/comparar-directo.mjs directo.json fina.json`
   (el directo público frente a la fina del flujo de la misma hora: compara el
   mismo instante). Y Supabase › Usage (salida).
8. Fase 2 (otro PR): quitar `--fina` de `tokenizacion-diaria.yml` (de 22,8 a
   ~9,5 minutos por ejecución) cuando, en 7 días, ≥ 98 % de las llamadas den
   200, el documento se sirva con ≤ 20 minutos el ≥ 99 % de las veces y
   `comparar-directo.mjs` pase (≥ 95 % de los cubos dentro del 0,1 %).
   **Lo que cambia con la fase 2**: sin `--fina`, la copia publicada ya no
   trae las series finas, así que si el directo falla el respaldo es día a
   día y «24 h» se desactiva (la web y la app pasan a la primera pestaña con
   datos). En ese mismo PR hay que adaptar `.github/comprobar-publicado.mjs`,
   que hoy exige `/datos/tokenizacion-serie-fina.json` (la comprobación «es
   el del build y casa con la diaria»), y sus pruebas.

**Apagar**: `apagar` (DIRECTO). En 5 minutos como mucho la web y la app vuelven
a la copia publicada, sin aviso. **Volver a encender**: `encender` (siembra
otra vez). **Tras un corte del directo de más de una hora** (o tras mucho rato
apagado): `sembrar` (DIRECTO) rellena el hueco con la historia de CoinGecko.
**Quitarlo todo**: `deshacer` (DIRECTO).

## 7. Cuánto ocupa y cuánto cuesta

- Base: obs_5m + obs_1h de 60 tokens, unos 8,5 MB en PGlite (lo medido en la
  prueba de retención, con sus índices); las respuestas de pg_net (6 h), unos
  5 MB; el resto, poco. Unos 15 MB de los 500 MB gratis.
- **Pendiente (revisión del 14/11, gravedad baja, no aplicado)**: un token que
  entra en la lista de la diaria sin haber estado entre los 60 mayores no
  tiene historia en el directo, y cuenta como «fuera» (24 h en la de 5
  minutos, 30 días en la horaria); si pesa más del 1 %, esa serie no sale
  (con las dos a `null`, el servidor da 503 y salta la alarma). Guardar los
  250 en vez de 60 lo cubriría solo para quien ya estaba en la lista de
  CoinGecko (unos 25-35 MB en vez de 8,5) y no para un token recién añadido
  a la categoría, que es el caso probable. Lo que lo cubre de verdad: lanzar
  `sembrar` cuando cambie la lista de la diaria (a mano hoy; o que el flujo
  diario siembre solo los tokens nuevos).
- Salida de Supabase: unos 13 kB por lectura del servidor; con las visitas
  de hoy, menos de 1 MB al día.
- CoinGecko: como mucho 288 llamadas al día desde Supabase.
- GitHub: el encendido, unos 30-35 minutos una vez; la fase 2 ahorra unos 13
  minutos por ejecución del flujo diario.
- CI: tres pruebas nuevas de la base de menos de 25 s cada una
  (`probar-mercado-directo-{regla,base,flujo}.mjs`), repartidas en las cinco
  partes sin añadir ninguna.

## 8. Pruebas

- `rwadar-app/probar-mercado-directo-regla.mjs`: SQL = `construirSerieFina` con
  datos reales (6 y 3 tokens del 13/11, con decimales), 45 casos al azar en la
  CI (300 con `MERCADO_DIRECTO_CASOS=300`; la ejecución entera de 30 tokens con
  `MERCADO_DIRECTO_REAL=…`), casos límite y los cortes del propio directo (2 h,
  25 h, 73 h).
- `rwadar-app/probar-mercado-directo-base.mjs`: con la 35, la 37 y la 39
  aplicadas, pedir/leer, ranuras, esperas (también con 36, 40 y 576 fallos
  seguidos y 40 429 seguidos, §5.2), lo que se guarda y lo que no, la lista
  de la diaria, la cadena con 3 sondeos reales, retención, permisos con
  privilegios hostiles, encender/apagar/deshacer y el verificador (falla con
  16 estados rotos).
- `rwadar-app/probar-mercado-directo-flujo.mjs`: la siembra con un CoinGecko de
  pega, los pasos del flujo ejecutados con bash y un psql de pega sobre
  PGlite, la alarma del flujo diario y `comparar-directo.mjs`.
- `rwadar-movil/tests/tokenizacion-directo.test.cjs` y
  `tokenizacion.test.cjs`: el modelo, la app (`cargarDirecto`,
  `cargarSerieConDirecto`, el aviso, la tarjeta, el refresco).
- `rwadar-acceso/tokenizacion-directo.test.mjs` (servidor),
  `mercado-directo-navegador.test.mjs` (Chromium, 390 y 1366, es/en),
  `comprobar-publicado.test.mjs`.

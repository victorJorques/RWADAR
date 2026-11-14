# «La tokenización en el mundo» en directo · contrato (14/11/2026)

**Estado: construido y probado en local. SIN ENCENDER y SIN PUBLICAR.** Nada
aplicado en Supabase, ningún flujo lanzado, ninguna OTA. Encenderlo lo hace el
coordinador después de enseñárselo a la dirección y con su permiso, paso a paso
(apartado 6).

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
| 503 `directo_sin_datos` / `directo_no_valido` / `directo_no_casa` / `directo_atrasado` | lo que dice | 60 s |
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
- La app: solo JavaScript (OTA). Guardián con
  `--base fa30779f7d1d671f56b5f711cde9cac9eb090310`: `ok:true`, 1.4.2(24). La
  OTA sola es segura: sin la ruta, la app sigue con la copia publicada.

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
| `probar-coingecko` | con el directo apagado, UNA llamada desde la red de Supabase y qué respondió (estado, bytes, 429, cuántos válidos, el primero, la hora más reciente) | — |
| `sembrar` | la historia (unas 81 llamadas a CoinGecko desde GitHub, 13 s entre ellas, ~18 min) en una sola transacción | — |
| `encender` | siembra y enciende en la misma ejecución (la 35 exige una siembra de menos de 30 min) | — |
| `apagar` | quita los relojes; guarda los datos | — |
| `deshacer` | relojes, función y esquema; comprueba que no queda nada | sí |
| `estado` | solo lee; y qué sirve la web | — |

La copia cifrada va solo antes de `aplicar-35` y `deshacer`: las demás solo
tocan `rwadar_mercado`, que la copia de seguridad no guarda (se rehace con
`sembrar`). Así no se gastan minutos de más.

**Alarma**: el flujo diario de la tokenización (06:23 UTC) tiene un paso nuevo
al final, «Comprobar el gráfico en directo»: si está encendido y no responde
bien dos veces seguidas (90 s entre ellas), el paso falla y GitHub manda su
aviso. Apagado (404) o «no casa», no falla.

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
   5 minutos): que salga 200 con 250 válidos. Si sale 429 a menudo, hace
   falta la clave Demo (comprobar antes su tope mensual en la cuenta de
   CoinGecko; usarla solo en `pedir()`).
5. `encender` (DIRECTO): siembra (~18 min) y enciende. A los 15 minutos,
   `estado`: 3 llamadas con 200, documento de menos de 10 minutos, «fuera»
   vacío, `/api/tokenizacion/directo` con 200.
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

**Apagar**: `apagar` (DIRECTO). En 5 minutos como mucho la web y la app vuelven
a la copia publicada, sin aviso. **Volver a encender**: `encender` (siembra
otra vez). **Tras un corte del directo de más de una hora** (o tras mucho rato
apagado): `sembrar` (DIRECTO) rellena el hueco con la historia de CoinGecko.
**Quitarlo todo**: `deshacer` (DIRECTO).

## 7. Cuánto ocupa y cuánto cuesta

- Base: obs_5m + obs_1h de 60 tokens, unos 8,5 MB en PGlite (lo medido en la
  prueba de retención, con sus índices); las respuestas de pg_net (6 h), unos
  5 MB; el resto, poco. Unos 15 MB de los 500 MB gratis.
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
- `rwadar-app/probar-mercado-directo-base.mjs`: pedir/leer, ranuras, esperas,
  lo que se guarda y lo que no, la lista de la diaria, la cadena con 3 sondeos
  reales, retención, permisos con privilegios hostiles, encender/apagar/
  deshacer y el verificador (falla con 16 estados rotos).
- `rwadar-app/probar-mercado-directo-flujo.mjs`: la siembra con un CoinGecko de
  pega, los pasos del flujo ejecutados con bash y un psql de pega sobre
  PGlite, la alarma del flujo diario y `comparar-directo.mjs`.
- `rwadar-movil/tests/tokenizacion-directo.test.cjs` y
  `tokenizacion.test.cjs`: el modelo, la app (`cargarDirecto`,
  `cargarSerieConDirecto`, el aviso, la tarjeta, el refresco).
- `rwadar-acceso/tokenizacion-directo.test.mjs` (servidor),
  `mercado-directo-navegador.test.mjs` (Chromium, 390 y 1366, es/en),
  `comprobar-publicado.test.mjs`.

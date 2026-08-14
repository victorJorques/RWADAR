# RWAdar

**Un registro curado de plataformas de tokenización de activos reales.**
Analiza 38, publica las 26 que superan cuatro criterios de fiabilidad, y señala
los descartes **solo cuando el motivo se puede respaldar con una fuente
citable**.

→ **[rwadar.netlify.app](https://rwadar.netlify.app)**

---

## Por qué existe

Buscar dónde invertir en activos tokenizados devuelve listas escritas por las
propias plataformas o por quien cobra por promocionarlas. RWAdar hace lo
contrario: aplica los mismos cuatro criterios a todas, publica cuáles pasan, y
**dice también cuáles no y por qué** — con el enlace al regulador, a la demanda
o al documento que lo demuestra.

RealT y Goldfinch se hundieron con gente dentro. Quien las siguiera debería
haberse enterado el mismo día, no al volver a entrar en la web.

## Qué tiene

- **Un radar** con las 26 plataformas verificadas: el ángulo es el tipo de
  activo, la distancia al centro es a quién deja entrar.
- **Un explicador en 3D** de qué es tokenizar un activo, sin tecnicismos: un
  edificio de 885 paneles de fachada, cada panel una participación.
- **Una calculadora** que enseña la cuenta paso a paso, no solo el resultado —
  incluido lo que casi nadie cuenta: que la rentabilidad no cambia con lo que
  pongas, solo cambia cuánto cobras.
- **Fuera del radar**: los descartes, cada uno con su fuente comprobable.
- **Opiniones de usuarios**, moderadas, separadas de la verificación editorial.
- **Aviso** cuando una plataforma que vigilas cambia de estado.
- **El registro entero descargable** en CSV, sin registrarse.

## El listón editorial

Una plataforma solo aparece señalada si el motivo se respalda con una fuente
citable. Se retiraron ocho descartes que eran juicio de valor sin respaldo
—«escala pequeña», «poca transparencia», «nicho»—, entre ellos uno cuya crítica
procedía de un blog enmarcado en una disputa por difamación y quedó desmentida
por auditorías posteriores.

La base de datos impide que esto se degrade: la vista `descartadas_sin_fuente`
lista cualquier empresa señalada sin respaldo, y **debe devolver cero filas
siempre**.

El mismo listón vale para lo que entra. Ni un dato se publica porque lo diga la
propia plataforma: los avales se comprueban contra el registro del regulador que
los emite.

## Cómo está hecho

| | |
|---|---|
| Web | Un solo archivo HTML de 295 kB. Sin compilación, sin dependencias, sin peticiones a terceros — las tipografías van incrustadas para que la IP de nadie viaje a Google |
| 3D | WebGL escrito a mano, sin librería |
| Datos | Supabase (PostgreSQL) con seguridad por fila |
| App | React Native / Expo, comparte base de datos con la web |
| Publicación | Pre-renderizado en el HTML, para que el contenido se indexe sin ejecutar JavaScript |

## Esto no es asesoramiento financiero

RWAdar es un registro independiente. Que una plataforma esté supervisada no
significa que la inversión sea segura, y que aparezca aquí no es una
recomendación de invertir en ella.

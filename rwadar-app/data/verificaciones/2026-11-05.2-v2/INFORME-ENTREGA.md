# Entrega del catálogo 2026-11-05.2 · salen BILLA y Casa de Outeiro, Spiko y Pax Gold corregidos

Preparada el 05/11/2026 por la tarde (de 17:04 a 17:45 UTC) por Claude, en la
rama `claude/catalogo-2026-11-05-2` (sale de `origin/main`, fd6d97a).
**Nada aplicado en Supabase, nada publicado, sin OTA, ningún flujo lanzado.**
Estado: **preparada y probada en local, con un ensayo completo de «después de
aplicar» en una copia aparte.** Falta la revisión independiente del SQL antes
de aplicarla.

## 1. Lo que pidió Víctor

- «Arregla todo, no dejes nada para mañana».
- Preguntado hacia las 17:10 UTC por BILLA y Casa de Outeiro: **«Retirar las dos hoy»**.

Son tres cambios, y nada más:

1. **Pax Gold:** su web en `public.plataformas` pasa de `https://paxos.com/paxgold`
   a `https://www.paxg.com/`.
2. **Spiko:** su texto de acceso en el radar dice lo que muestra la CNMV.
3. **Salen del catálogo** BILLA (Brickwise) y Casa de Outeiro (Alius).

Las otras 22 ofertas, sus cifras, la vigencia hasta el 12/11 y el resto de
plataformas y fuentes quedan exactamente como en la publicada.

## 2. Lo comprobado hoy

- **Lo publicado, leído como visitante** (REST de Supabase con la clave
  publicable, solo GET), de 17:06:58 a 17:07:19 UTC, en `lectura-publica/`:
  revisión `cede1f27-b5eb-36d3-e223-eb4155df2572` (entrega 2026-11-05),
  25 plataformas, 24 ofertas (8 principales, 13 de reventa y 3 en camino) y
  5 descartadas. La fila de Pax Gold tiene la web `https://paxos.com/paxgold` y
  ninguna fuente propia. Es exactamente la entrega 2026-11-05 local: su huella,
  `cede1f27b5eb…8823`, sale de construir esa carpeta otra vez.
- **https://www.paxg.com/**, abierta a las 17:07:25 UTC (HTTP 200; copia de
  texto en `fuentes/paxg-com.txt`). Dice: «PAXG is issued by Paxos Trust Company,
  N.A., a U.S. national trust bank regulated by the Office of the Comptroller of
  the Currency» y «For EU visitors: PAXG is currently not available to residents
  of the European Union». La dirección vieja, `https://paxos.com/paxgold`, lleva
  a la misma hora a `https://www.paxos.com/assets/paxg`, que es una página
  comercial de Paxos.
- **CNMV, ficha de SPIKO SICAV** (`…/iic/iicextranjera?nif=N0401205J&lang=es`),
  abierta a las 17:07:35 UTC, con su pestaña «Entidades comercializadoras» a las
  17:07:54. Dice «SPIKO SICAV | 2380 | 30/01/2026 | SICAV | FRANCIA», «IIC Sujeto a
  la directiva 2009/65/CE» y, como comercializadora, «ALDANA CAPITAL, SOCIEDAD
  ANONIMA AGENCIA DE VALORES». No tiene ninguna lista de compartimentos.
- **CNMV, ficha de Spiko Finance** (`…/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es`),
  abierta a las 17:07:56 UTC, con su programa de actividades a las 17:07:59.
  Dice: «SPIKO FINANCE SASU | Empresas de Servicios de Inversión del Espacio
  Económico Europeo en Libre Prestación | … | 5325 | 14/01/2026». Su actividad
  es «Recepción y transmisión de órdenes … Participaciones y acciones en
  instituciones de inversión colectiva».
- **BILLA y Casa de Outeiro**, vueltas a leer al retirarlas (17:12 UTC), seguían
  igual que por la mañana:
  - **BILLA**, en la API de Brickwise: fin de suscripción igual al original
    (16/05/2026) y 82 participaciones suscritas.
  - **Casa de Outeiro**, en la API de Alius: el mismo SHA-256 que la copia del
    investigador.

Las copias de texto de las páginas están en `fuentes/`. Cada una lleva su hora y
el SHA-256 del HTML completo.

## 3. Etiqueta, revisión y SHA

- **Etiqueta: `2026-11-05.2`** (la segunda del día).
- **Revisión nueva: `88d5a757-3481-f70e-dc7c-6272704a00b3`**
  (huella `88d5a7573481f70edc7c6272704a00b3963248fcf32943caba65a10b86f789a8`).
- **SHA-256 de `rwadar-app/data/importaciones/catalogo-2026-11-05.2-v2/aplicar-y-aprobar.sql`:
  `24073c9f5afdbf74191fcf95e38d625bbd62c0fb4d9cf09a70115255fe51ba19`.**
  `preparar-entrega.mjs` lo reproduce byte a byte (comprobado dos veces).
- Exige que la publicada sea la `cede1f27…` con su huella; que el catálogo no
  esté retirado; y que se aplique entre el 05/11 y el **12/11** (último día
  vigente: las fichas siguen verificadas el 05/11, con 7 días).

## 4. Qué cambia (antes → después)

| Qué | Antes | Después |
|---|---|---|
| Ofertas | 24 (8/13/3) | **22 (8/13/1)**: en camino solo queda Hausera |
| BILLA (`terreno-con-arrendamiento-billa`) | En camino | **Fuera** |
| Casa de Outeiro (`casa-de-outeiro`) | En camino | **Fuera** |
| Las otras 22 ofertas | — | idénticas (cifras, avisos, documentación, fechas, vigencia); solo cambian la revisión y el recuento del lote (24 → 22, en camino 3 → 1) |
| Pax Gold, web (`public.plataformas`) | `https://paxos.com/paxgold` | **`https://www.paxg.com/`**: botón «Ir a la web de Pax Gold», JSON-LD de `/plataformas/pax-gold` y `rwadar.csv` |
| Spiko, «Quién puede acceder» | «… No hemos comprobado en la CNMV que el fondo se comercialice en España, ni llegamos a darnos de alta.» | «… **La CNMV tiene inscritas a SPIKO SICAV como IIC extranjera (n.º 2380, con Aldana Capital como comercializadora) y a Spiko Finance como empresa de inversión en libre prestación (n.º 5325), pero no muestra qué compartimentos de la SICAV están dados de alta en España.** No llegamos a darnos de alta.» Lo de la AMF y el REGAFI, igual. |
| Fuentes del radar | 67 | **69**: `spiko-cnmv-iic` (ficha de SPIKO SICAV) y `spiko-cnmv-lps` (ficha de Spiko Finance), consultadas el 05/11 |
| Plataformas, descartadas | 25 y 5 | 25 y 5, iguales |

**Por qué salen las dos** (con su fuente en `comprobacion-retiradas.json`):

- **BILLA:** el plazo de suscripción terminó el 16/05/2026 y no hay prórroga
  publicada ni registrada en la API de Brickwise. El 05/11 tenía 82 de las 5.000
  participaciones necesarias: 8.200 €, el 1,64 % del mínimo de 500.000 €.
- **Casa de Outeiro:** Alius dio fin a la campaña el 31/10/2026 y el 05/11 no
  mostraba días restantes ni ampliación. Tenía 1.121.000 € de un mínimo de
  2.000.000 €. La ficha de datos del emisor del 30/10 cita el 31/03/2027, pero
  nada más lo confirma: la pestaña «Proceso», la API y la web del emisor siguen
  en 31/10, y las condiciones de Alius limitan una campaña a 6 meses.

Los expedientes de la mañana proponían esperar al 15/11 (BILLA) y al 10/11
(Casa de Outeiro). Víctor decidió no esperar.

**Lo que hace la base por su cuenta:** al cambiar la web de Pax Gold, el
disparador de siempre pone `actualizada_el = now()`. No cambia ningún estado, así
que no hay cambios de estado ni avisos.

## 5. Cómo se aplica (cuando toque)

1. Revisión independiente del SQL y de los datos. Después, PR a `main`, CI en
   verde y merge.
2. Volver a leer como visitante: debe seguir publicada la `cede1f27`.
3. «Aplicar catálogo» con la etiqueta `2026-11-05.2`, **antes del 12/11 incluido**.
   Leer otra vez como visitante y guardarlo en `lectura-despues-de-aplicar/`.
   Debe salir la `88d5a757`, con 25/22 (8/13/1).
4. En una rama nueva:
   - `node rwadar-app/sincronizar.js`
   - `node rwadar-app/data/verificaciones/2026-11-05.2-v2/despues-de-aplicar.mjs`
   - `node rwadar-app/volcar-seed.js`
   - `node rwadar-editorial-source/ofertas/transparencia.mjs`
   - `node rwadar-fichas.js`
   - `npm test` (vuelve a generar `rwadar-site/index.html`)

   Después, el sello, PR y merge.
5. «Publicar web» (preview y producción). Comprobar:
   - `curl -I https://rwadar.pages.dev/ofertas/casa-de-outeiro` y
     `…/terreno-con-arrendamiento-billa` dan 404, con `x-robots-tag: noindex, nofollow`
     y `cache-control: no-store`;
   - el botón de Pax Gold lleva a paxg.com.
6. **Hace falta OTA de Android:** cambian la transparencia que va dentro de la
   app y sus ilustraciones. `comprobar-ota-compatible.cjs --base c1f7106…` dio
   `ok: true` en el ensayo.

`despues-de-aplicar.mjs` hace, sin red y solo si el catálogo sincronizado ya es
la `88d5a757`:

- quita las dos de la lista cerrada de fichas (`rwadar-fichas-manifiesto.js`);
- borra `rwadar-site/ofertas/<slug>.html`;
- las saca de `transparencia.json`;
- quita su ilustración: el `.webp`, `manifest.json`, el bloque de la web y el
  fixture de la app.

Se puede repetir: la segunda vez dice «Nada que cambiar». Antes de aplicar se
niega y no toca nada; así el repositorio sigue casando con lo publicado.

## 6. Pruebas

- **`comprobar-entrega.mjs` (PGlite, sin red): correcto.** Comprueba 22 cosas y
  10 casos de fallo; en cada fallo, nada queda a medias (`pruebas-locales.json`).
  - La cadena de producción, del 22/10 a la 2026-11-05, deja publicada la
    `cede1f27`.
  - Antes de aplicar, PGlite enseña lo mismo que la lectura como visitante.
  - Es idempotente.
  - `public.plataformas`: solo cambian la web y `actualizada_el` de Pax Gold.
  - Las 22 ofertas son idénticas; las dos, fuera; el texto de Spiko y sus fuentes
    son los nuevos.
  - El lector de la web y el de la app aceptan 1 en camino: vale el 12/11 y
    caduca el 13/11.
  - Las 22 tarjetas se ven igual.
  - El sincronizador real da 25/22/5 y `rwadar.csv` con paxg.com. Sin quitar las
    dos de la lista cerrada, no se generan las fichas.
  - El worker da su 404 a las dos fichas retiradas y a sus ilustraciones
    conservadas.
  - Casos que se aplican bien:
    - la revisión ya importada como borrador;
    - Pax Gold ya con la web nueva (no toca su fila).
  - Casos que fallan y no dejan nada:
    - otra publicada;
    - otra huella;
    - catálogo retirado;
    - destino con otra identidad;
    - aplicado después del 12/11;
    - Pax Gold con otra web;
    - Pax Gold con otro dato;
    - Pax Gold con una fuente propia;
    - Pax Gold descartada;
    - una plataforma que falta.
- **`npm test` antes de aplicar, en la carpeta de trabajo: en verde.**
  - web: 601;
  - fichas: 71;
  - precarga: 32;
  - móvil: 410 y 2 omitidas;
  - acceso: 146;
  - base de datos: sin fallos;
  - herramientas: «fichas.json: 22 fichas, catálogo 2026-11-05.2-v2».
- **Ensayo «después de aplicar»** en una copia aparte (`ensayo-despues.json`):
  - `sincronizar.js` y `volcar-seed.js` contra lo que exporta PGlite;
  - `despues-de-aplicar.mjs`, dos veces;
  - `transparencia.mjs` y `rwadar-fichas.js`;
  - `npm test` en verde: web 601, fichas 69, precarga 32, móvil 410 y 2
    omitidas, acceso 146 y «Transparencia al día: 22 ofertas»;
  - OTA compatible;
  - con el historial de Git de la copia, la lista de `.github/comprobar-publicado.mjs`:
    - las dos fichas dan el 404 del worker;
    - sus ilustraciones dan 404;
    - ARTEX sigue con su 301.
- **Capturas** de la copia, servida en local con Chrome sin interfaz:
  - «Próximas 3» (Casa de Outeiro, BILLA, Hausera) pasa a «Próximas 1» (Hausera);
  - «Ir a la web de Pax Gold» lleva a `https://www.paxg.com/`;
  - Spiko enseña el texto nuevo y los dos enlaces a la CNMV;
  - `/ofertas/terreno-con-arrendamiento-billa` da 404.
- **gitleaks 8.30.1** (SHA-256 del paquete comprobado) sobre el árbol del commit,
  con `rwadar-app/gitleaks.toml`: sin hallazgos. La primera pasada marcó dos
  campos míos, `sha256Api…`, en `comprobacion-retiradas.json`: eran la huella de
  una respuesta pública, pero su nombre parecía el de una clave. Se renombraron a
  `sha256Respuesta…`.

## 7. Decisiones que conviene saber

- **Dos fuentes de la CNMV, no una.** El encargo pedía una: la ficha de SPIKO
  SICAV, `spiko-cnmv-iic`. Pero el texto también dice que la CNMV inscribe a
  Spiko Finance en libre prestación (n.º 5325), y eso no sale en esa ficha. Para
  que ese dato tenga su fuente, va también la ficha de Spiko Finance,
  `spiko-cnmv-lps`. Las dos tienen su comprobación en
  `rwadar-app/data/comprobaciones-fuentes.json` (tres líneas, sin reformatear el
  archivo).
- **La ficha editorial de las dos sale ya en esta entrega**, como con mF-ONE en
  la 2026-11-03.6: `fichas.json`, `fotos.json` y `fotos/<slug>.webp`.
  `generar.mjs --comprobar` compara con la última revisión local y, si siguieran,
  `npm test` fallaría. Es la fuente de las ilustraciones y no se publica. La web
  y la app conservan sus ilustraciones hasta después de aplicar.
- **Una prueba de la app** (`rwadar-movil/tests/ofertas-presentacion.test.cjs`)
  exigía exactamente 24 ofertas publicadas. Ahora exige todas las que declara el
  lote. Sin este cambio, `npm test` habría fallado después de aplicar.
- **El mapa** (`mapa-ubicaciones-20261027.json`) conserva el punto de BILLA. El
  mapa solo enseña puntos de ofertas del catálogo, como ya pasa con 14 puntos de
  ofertas retiradas de Reental.

## 8. Lo que queda fuera (para otro día, si Víctor quiere)

- **Pax Gold, «Por qué es fiable»** (`aval` en `public.plataformas`) dice
  «Emitido por Paxos bajo supervisión del regulador bancario de Nueva York
  (NYDFS)». Su web oficial dice hoy que la emite Paxos Trust Company, N.A.,
  regulada por la OCC. No se toca: no es ninguno de los tres cambios pedidos.
- La ilustración de Hausera (Orihuela Costa), pendiente desde la 2026-11-05.

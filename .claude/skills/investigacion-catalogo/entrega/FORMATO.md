# Motor de la entrega del catálogo

Hasta el 12/11/2026, el montador copiaba del día anterior `preparar-entrega.mjs`,
`comprobar-entrega.mjs` y `despues-de-aplicar.mjs` (unas 1.500 líneas) y los
adaptaba a mano. Ahora lo propio de cada día va en **un archivo de datos**,
`rwadar-app/data/verificaciones/<etiqueta>-v2/decisiones.json`, y las guardas
viven en este motor, iguales para todos los días.

**Demostrado con la entrega del 12/11:** el motor rehízo los 8 archivos de la
entrega a partir de `2026-11-12-v2/decisiones.json` y salieron **idénticos byte
a byte** a los publicados, con el SQL `d4d73024…4e4d`, el mismo que aprobó la
verificación. También `transparencia.json` salió igual que el del commit del
12/11. El ensayo en PGlite dio lo mismo que el real: 19 comprobaciones, 6 casos
de fallo y las 22 tarjetas iguales, y lo que exporta coincide campo a campo con
lo que se leyó en producción después de aplicar ese día
(`lectura-despues-de-aplicar/`). Lo comprueban `motor.test.mjs` y
`flujo.test.mjs` en cada `npm test`. El ensayo en PGlite va aparte
(`pglite.test.mjs`, unos 25 s): `npm --prefix rwadar-app run test:motor-entrega`
pasa las tres. **Si cambias el motor, pásalas antes del PR.**

## Uso (desde la raíz del repositorio)

```bash
M=.claude/skills/investigacion-catalogo/entrega/motor.mjs
node $M guiones   <etiqueta>   # una vez: los 3 guiones finos y ensayo-rest-simulado.cjs en la carpeta del ciclo
node $M preparar  <etiqueta> --repetir   # datos y SQL, dos veces, mismos SHA-256 (o el guion fino preparar-entrega.mjs)
node $M comprobar <etiqueta> --exportar=<dir>   # PGlite, ~35 s (o comprobar-entrega.mjs)
node $M revisar   <etiqueta>   # DIFF-ENTREGA.md para los revisores
node $M auditar   <etiqueta> --antes=<copia del SQL revisado> --revisado=<su SHA-256> \
                  --secretos=<gitleaks> --exigir-secretos --escribir   # tras corregir y antes del PR
node $M despues   <etiqueta>   # después de aplicar y sincronizar (o despues-de-aplicar.mjs)
```

Opciones de todas: `--raiz=DIR`, `--salida=DIR` (escribe en otra carpeta y no
toca el repositorio), `--decisiones=RUTA`.

Para repetir una entrega pasada:

- `preparar --web=<catálogo de la web de ese día>`: el de la carpeta ya es el de
  después.
- `comprobar --hoy=AAAA-MM-DD`: un día de su vigencia.
- `despues --web=… --transparencia=…`: el catálogo sincronizado y el
  `transparencia.json` de partida.

Si algo no cuadra, el motor para con `NO: <motivo>` y la salida 1. Con
`RWADAR_MOTOR_TRAZA=1` enseña la pila.

`auditar` es la comprobación determinista que sustituye al auditor cuando la
corrección no cambia el SQL:

- rehace la entrega dos veces desde `decisiones.json` en una carpeta aparte:
  mismos SHA-256 e igual byte a byte a lo de la carpeta;
- con `--revisado`, exige que la copia sea el SQL que vieron los revisores;
- mismo inventario de sentencias y diff normalizado (solo se igualan la revisión
  y la huella);
- PGlite y, con `--exigir-secretos`, el escáner de secretos obligatorio;
- `--escribir` deja `VERIFICACION-ENTREGA.md`.

Veredictos:

- `conforme_sin_cambios_en_el_sql`: basta con esto;
- `sql_cambiado_falta_auditor`: sigue el auditor, con la lista exacta de
  sentencias y palabras que cambian;
- `no_conforme`: salida 1.

Probado con el 12/11 real: con la copia de antes de corregir (`4815b3cb…`, la
que aprobó el revisor de SQL) da `sql_cambiado_falta_auditor` con una sola
sentencia cambiada, la frase de Hausera que pidió el revisor de cumplimiento.

Cómo se lanza el flujo `entrega-catalogo` por fases: en la skill
(`../SKILL.md`, §2).

## Qué hace el motor y qué no

Sí (lo mismo que hacían los guiones del 12/11):

- parte **exactamente** de la publicada: la «desde» local da la revisión y la
  huella publicadas, el catálogo de la web es esa revisión y la lectura pública
  de hoy es la base local;
- el radar: las fuentes contrastadas hoy, las lecturas a mano y los cambios de
  `cambios-radar.json`;
- **aplica solo lo de `decisiones.json`**. Cada texto «antes» se exige tal cual
  y cada cambio lleva su prueba (fuente, literal y hora de hoy, posterior al
  comienzo del ciclo: una hora de hoy de antes de la lectura pública es una
  hora copiada de otro día y no vale). Las cifras que calcula RWAdar se rehacen;
- lo que proponen los expedientes de hoy y no se toma se declara en
  `difiere`, con su motivo;
- reglas de las tarjetas: castellano, ≤ 120 caracteres en lo nuevo, nunca «por
  participación» en el mínimo y sin fechas de ayer;
- sin fuentes técnicas nuevas sin permiso y nada que la compuerta CSP rechace;
- **nada más cambia** (avisos, métricas, referencias, orden, plataformas);
- el SQL con la guarda (publicada exacta, huella, no retirado, fecha tope,
  serializable) y la aprobación al final;
- el ensayo en PGlite: inventario, idempotencia, cada cambio visible, lo no
  aplicado sigue, tarjetas, sincronizador real, fichas y los 6 casos de fallo;
- `transparencia.json` después de aplicar, repetible.

No:

- **altas ni retiradas**: un día con una candidata admitida o una oferta que sale
  se monta a mano con el último guion completo
  (`2026-11-05.2-v2/preparar-entrega.mjs` es el modelo de retiradas);
- cambios de colección o de estado de revisión;
- textos del radar que no estén en `cambios-radar.json`.

## decisiones.json

Ejemplo completo y real: `rwadar-app/data/verificaciones/2026-11-12-v2/decisiones.json`.
Las claves desconocidas se rechazan.

| Clave | Qué es |
|---|---|
| `formato` | `1` |
| `etiqueta`, `fecha` | `AAAA-MM-DD[.N]` y `AAAA-MM-DD` |
| `desde` | etiqueta de la entrega publicada de la que se parte |
| `previa` | `{ revisionId, hash, ultimoDia }` de la publicada (de su `revision.json`) |
| `vigenciaDias`, `ultimoDia` | 7 y la fecha + 7 |
| `colecciones`, `plataformas` | cantidades (las de la publicada: el motor no monta altas) |
| `cadena` | los lotes aplicados en producción, en orden; el último, `desde` (el de ayer más el de ayer) |
| `pedido` | exactamente «puesta al día pedida por el responsable del proyecto» (sin nombres): va a la cabecera del SQL y a la aprobación |
| `orden` | la frase de la orden, sin comillas (opcional) |
| `lecturaPublica` | `{ hora: "<inicio>Z – <fin>Z", descartadas }`, de `lectura-publica/hora-lectura.txt` |
| `radar` | `{ fuentes, manuales: [ids], alcanceNota?, copias?: [{archivo, sha256, contiene?}], literales?: [{id, contiene?, patron?}] }` |
| `candidatas` | slugs de los expedientes de candidatas (todas `no_admitir`) |
| `sinCambios` | slugs que solo cambian de fecha (el motor y PGlite lo comprueban) |
| `plantillas` | `{ NOMBRE: "texto" }`: `{{NOMBRE}}` en cualquier texto se sustituye (para los textos repetidos de Brickwise) |
| `pruebas` | pruebas con nombre, para no repetirlas |
| `ofertas` | `{ <slug>: { decision?, cambios: [...], difiere?: {...} } }`, en el orden en que se quieren los cambios en el contraste |
| `prohibidos` | `[{ en: <slug> \| "cambios", patron, flags?, motivo }]`: cifras rechazadas, palabras que no van |
| `fuentesNuevas` | direcciones nuevas admitidas (fuentes técnicas o de la ficha); por omisión ninguna |
| `noAplicado` | `[{ slug, que, porque, detalle?, sigue?: [...] }]`: lo que no se aplica tal cual, y qué tiene que seguir como estaba |
| `contraste` | `{ cifras, condicionHora, sinCambios }`: lo que se copia al contraste para el informe |
| `transparencia` | lo de después de aplicar (abajo) |
| `comprobar` | `{ ausentes?: [textos], fichasWeb?: [{ pagina, contiene?, noContiene? }] }`: comprobaciones extra en PGlite y en las fichas |

### Cambios por oferta (`ofertas.<slug>.cambios`)

Cada uno lleva `tipo`, sus campos y `prueba`. Opcionales: `calculos` y
`permiteFechaPrevia: true` (el texto lleva a propósito la fecha corta de ayer).

| `tipo` | Campos |
|---|---|
| `rentabilidad` | `antes: {mostrada, literal} \| null`, `despues: {mostrada, literal}` |
| `metrica` | `etiqueta`, `antes` (valor), `despues: {etiqueta, valor}` |
| `metricaNueva` | `despuesDe` (etiqueta; sin ella, al final), `despues: {etiqueta, valor}` |
| `metricaQuita` | `etiqueta`, `antes` |
| `aviso` | `antes`, `despues` (textos) |
| `avisoNuevo` | `despues`, `antesDe?` (texto del aviso delante del que va; sin él, al final) |
| `avisoQuita` | `antes` (nunca el editorial común) |
| `referencia` | `etiqueta`, `antes` (valor), `despues: {campos que cambian}` (no para los datos de la tarjeta) |
| `referenciaNueva` | `despuesDe` (etiqueta), `despues: {etiqueta, valor, fechaDato, fuente, alcance}` |
| `referenciaQuita` | `etiqueta`, `antes` |
| `tarjeta` | `etiqueta` fija (Mínimo de inversión, Acceso desde España, Salida, Reembolso), `antes`, `despues` (valor), `fechaDato?`, `fuente?`, `nota?` o `notaCambia?: {antes, despues}` |
| `resumen` | `antes`, `despues` (si la descripción empieza por el resumen, cambia igual) |
| `descripcion` | `antes`, `despues` (un trozo que esté una sola vez) |
| `caracteristica` | `etiqueta`, `antes`, `despues` |
| `fuentesOferta` | `antes: [urls]`, `despues: [urls]` (las nuevas, en `fuentesNuevas`) |
| `fuenteQuita` | `url`: quita esa dirección de la lista `fuentes` de la ficha. Solo si está una vez, se leyó hoy como visitante y nada la cita (ninguna referencia ni dato de tarjeta, característica, descripción ni la oferta); si algo la cita, el motor para |
| `disponibilidad` | `antes` (la publicada en `documentacion.disponibilidad`), `despues` (objeto entero: `verificadaEl`, `admitidos`, `excluidos`, `conRequisitos`, `fuentes`, `nota`, `notaEn`; lo valida `rwadar-movil/lib/disponibilidad-pais.js`) |
| `tarjetaFecha` | `etiqueta` fija, `antes: {valor, fechaDato}` (lo publicado y lo leído hoy como visitante), `despues: {fechaDato, alcance?}`: cambia solo la fecha del dato y, si se da, la nota del alcance (sin el prefijo de fecha, que pone el motor). El valor no cambia; la fecha no puede ser posterior a hoy |

Desde la entrega 2026-11-20.2: en el contraste, `fuenteQuita` sale como «fuente de la ficha» con `despues: null` y
`tarjetaFecha` como «tarjeta (fecha del dato)» con «<etiqueta>: <valor> · dato del <fecha>»; PGlite comprueba los dos
en lo que lee un visitante. En una segunda entrega del mismo día (`desde` de hoy), los avisos que la publicada de hoy ya
comprobó (con `verificadaEl` de hoy) siguen comprobados. Y el ensayo en PGlite aplica, después del lote 2026-11-20 de la
cadena, la migración 38 de los textos del radar (`db/38_textos_radar.sql`), como producción.

Los datos de la tarjeta que no se tocan se re-fechan solos («Comprobado de
nuevo en la fuente el …»). Los avisos publicados se re-fechan si el expediente
de hoy los propone tal cual. Si no, el motor para: hay que decidir qué pasa
con ese aviso.

### Pruebas (`prueba`)

Una prueba o una lista (tienen que pasar todas); una cadena es el nombre de una
de `pruebas`.

- `{ "claim": "<campo>", "url"?: "…", "contiene"?: "…" }`: una afirmación del
  expediente de esa oferta, consultada hoy.
- `{ "url", "hora", "literal", "copia"?: { "archivo", "sha256", "json"?: { "ruta.a.campo": valor }, "contiene"?: [...] } }`:
  - con `copia`, el archivo del ciclo tiene que tener ese SHA-256 (al menos 16
    caracteres) y decir eso;
  - sin `copia`, la dirección tiene que estar entre las consultas de hoy del
    expediente.
- `{ "documento": "<archivo del ciclo>", "contiene": "…" }`: lo que dice el
  revisor independiente, DECISIONES-COORDINADOR.md o el informe de un revisor de
  la entrega.

### Cálculos (`calculos`)

El motor rehace la cifra y exige que el resultado esté en el texto nuevo.

- `{ "tipo": "anualSimple", "desde": {valor, ts}, "hasta": {valor, ts}, "resultado": "3,45", "dias"?: "35.18" }`:
  rentabilidad anual simple entre dos valores (marcas en segundos).
- `{ "tipo": "comision", "precio": "95", "porcentaje": "1,5", "resultado": "96,43" }`:
  precio más comisión, redondeado al céntimo con 0,005 hacia arriba.

### Lo que difiere del expediente (`ofertas.<slug>.difiere`)

El motor compara lo que queda con lo que propone el expediente de hoy:

- resumen, métricas, avisos, rentabilidad y literal;
- los tres datos de la tarjeta: `tarjeta` vale para los tres, o uno a uno con
  `tarjeta.minimo`, `tarjeta.accesoEspana` y `tarjeta.salida`.

Lo que no coincide hay que declararlo con su motivo
(`"metricas": "el revisor rechaza 3,53 %…"`). Lo declarado que sí coincide
también para la entrega (sobra). Así ninguna propuesta del investigador se
pierde ni entra sin querer.

### Lo que no se aplicó (`noAplicado[].sigue`)

- `{ slug?, referencia: "<etiqueta>", valores: ["…"] }`: los valores de esa
  referencia después de aplicar (`[]` = no está).
- `{ slug?, campo: "rentabilidad.literal", contiene: "…" }` o
  `{ slug?, campo, es: valor }`.

PGlite lo comprueba en lo que lee un visitante.

### Después de aplicar (`transparencia`)

- `reventaDe: ["brickwise"]`: el mínimo corto de reventa de esas plataformas sale
  del largo del catálogo sincronizado.
- `minimosCortos: { <slug>: { tarjeta, antes, despues } }`: uno a uno. `tarjeta`
  es el mínimo largo que tiene que tener el catálogo; `despues` va en 40
  caracteres como mucho.
- `textos: [{ slug, campo: "documentoEspana.motivo", antes, despues, prueba, avisoCatalogo? }]`:
  un trozo de texto con su prueba de hoy.

Las fechas de consulta y los títulos de los puntos fuertes se re-fechan solos,
solo donde el expediente de hoy volvió a consultar esa misma fuente.

## Cómo escribe el montador decisiones.json (rápido)

1. Copia el `decisiones.json` del último día. Cambia la cabecera (`etiqueta`,
   `fecha`, `desde`, `previa` del `revision.json` de ayer, `ultimoDia`,
   `cadena` con el lote de ayer, `lecturaPublica`, `radar`, `candidatas`) y
   vacía `ofertas`, `noAplicado`, `contraste` y `transparencia`.
2. Por cada punto de DECISIONES-COORDINADOR.md §2, un cambio con su prueba.
   - Re-fechas: `aviso` o `metrica` con el mismo texto y la fecha de hoy, y una
     prueba `claim`.
   - Cifras: la prueba con `copia` y `calculos`.
3. `node $M preparar <etiqueta>`. El motor dice qué falta: un «antes» que no
   está, un aviso que el expediente no recoge, algo que difiere del
   expediente, una fecha de ayer en un texto nuevo… Se arregla en
   `decisiones.json` y se repite hasta que pasa.
4. `--repetir`, `comprobar --exportar`, `revisar` y el ensayo «después de
   aplicar» en una copia (`despues` con `--web` y `--transparencia`, o la copia
   entera como siempre).

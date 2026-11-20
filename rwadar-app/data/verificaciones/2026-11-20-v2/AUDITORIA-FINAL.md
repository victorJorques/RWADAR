# Auditoría final · entrega del catálogo 2026-11-20 (v2)

**Veredicto: conforme.** Hay 4 observaciones abajo; ninguna bloquea la publicación.

- Auditor independiente: Claude. No monté, no corregí y no revisé esta entrega. No hice commits y no toqué Supabase ni los flujos.
- Hora: 20/11/2026, de 21:31 a 21:37 UTC.
- SQL auditado: `rwadar-app/data/importaciones/catalogo-2026-11-20-v2/aplicar-y-aprobar.sql`, SHA-256
  `cb27c32885c8430a6bb0dd7157d771cc6096245bcb9ead906c74bc6bc94d4f30`, revisión `eca89db7-aac5-35fa-f792-5bffbe8795e2`.
- Lo comparé con el SQL que vieron los tres revisores: `…/scratchpad/sql-revisado-2026-11-20/aplicar-y-aprobar.sql`, SHA-256
  `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6`, revisión `c8727d7d-cd09-d2cf-d3dc-da3158fe6812`.

## 1. Qué cambia entre los dos SQL

Antes de comparar normalicé tres cosas: el identificador de revisión (`c8727d7d…` y `eca89db7…`), la huella de contenido de cada uno y las marcas de hora. Así salen solo las diferencias reales.

- Los dos ficheros tienen 337 líneas. El inventario y el orden de las sentencias son iguales: 288 sentencias (begin, guarda, 284 inserts, aprobación y commit). El número de filas por tabla tampoco cambia.
- **Cambian 9 sentencias, y las 9 son correcciones pedidas.** La cabecera, la guarda, la fila de `revisiones`, las 69 fuentes, la aprobación y el commit son idénticos.

| Línea | Qué | Antes → ahora | Pedido en | Fuente comprobada |
|---|---|---|---|---|
| 188 | Radar Midas, licencia | Se quita la última frase: «No se obtuvieron los términos finales vigentes de mTBILL.» | A24 (O3 de los tres) | Solo se quita una frase |
| 188 | Radar Midas, acceso (sigue `no_verificable`) | «No se obtuvieron términos finales…» → «Las condiciones finales de mTBILL (17/07/2026) incluyen España entre los países de la oferta pública y no prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje darte de alta.» | A24 | Sí, en el PDF (ver abajo) |
| 194 | Radar Midas, aviso `terminos_finales_no_confirmados` | «…lo deciden los términos finales vigentes de mTBILL, que no hemos podido obtener.» → «…lo deciden las condiciones finales de mTBILL; las del 17/07/2026 no lo prohíben, pero eso no confirma que la web te deje darte de alta.» Es el texto exacto de la revisión de contenido. | A24 | Sí, en el PDF |
| 213 | Radar Pax Gold, licencia | «a 30/09/2026» → «a 31/10/2026» | A23 | Ver nota de la OCC |
| 222 | Radar Reental, licencia | → «Reental dice que su actividad en España no está sujeta a autorización ni registro previo de la CNMV.» | A25 | Sí, en reental.co |
| 224 | Radar Reental, fuente de la licencia | `reental-emision` → `reental-web` (https://reental.co/). Lo pidió la revisión de contenido (`fuentesAntes`/`fuentes`). | A25 | Es donde está el literal |
| 298 | Ficha mTBILL | Sale la referencia «Acceso desde España · consulta 01/11/2026» que citaba `main-DOxid0Zj.js` (404). La otra con la misma etiqueta (llms-full.txt) se queda. Entra «Países de oferta pública · Condiciones Finales del 17/07/2026», justo después de «Países de oferta según la web de Midas». El motor añade el PDF a `fuentes` porque es la fuente de la referencia nueva (`preparar.mjs`, línea 231): es parte de A22, no un cambio aparte. | A22 | Sí, en el PDF |
| 299 | Prosegur Digital Gold, métrica «Custodia» | «Oro separado…» → «Según su contrato, oro separado de los bienes de Prosegur, en un inventario conjunto de los clientes (sin lingote asignado)». Es el texto exacto de la revisión de cumplimiento. | O6 de cumplimiento | Ver nota de Prosegur |
| 310 | Randhartingergasse 9 (KID `8c331bfe…`), «Qué se adquiere» | «Genussscheine ... läuft endlos/ewig…» → «Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» | A20 | Sí, en el KID |
| 311 | Hinterstoder 50 (KID `3aa9bf9c…`), «Qué se adquiere» | El mismo cambio | A20 | Sí, en el KID |

### Fuentes que abrí yo (21:33 UTC)

- **Condiciones Finales de mTBILL** (PDF del CDN de GitBook): responde 200 y su SHA-256 es `b1e58001ec0f688aedc266ec63a37026e5fcf3f720f930f3aff5403036b3944a`, la misma huella que citan. El PDF dice:
  - «FINAL TERMS DATED 17 July 2026»;
  - «Countr(y)(ies) Where the Offer(s) to the Public Takes Place Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany»;
  - «Prohibition of Sales to EEA Retail Investors not applicable».

  El valor publicado añade dos puntos entre la casilla y su contenido, porque en el PDF es una tabla. Por lo demás es literal.
- **KID de Randhartingergasse** («Wohnung 1100 Randhartingergasse 9-11, TOP 69»): responde 200 y su SHA-256 es `2aa7ac3cea28…`. **KID de Hinterstoder** («… Hinterstoder Haus 50a TOP 08»): responde 200 y su SHA-256 es `ce890eafd164…`. Los dos contienen la frase nueva palabra por palabra. Ninguno contiene «Genussschein» (0 apariciones), así que la cita de antes era falsa, como dijeron los revisores.
- **reental.co** responde 200 y dice: «Reental ofrece participaciones en préstamos digitalizados en España para inversores de forma privada. La actividad no está sujeta a autorización ni registro previo de la CNMV debido a: Libertad de emisión…».
- **Lista de la OCC** (`trust-by-name.pdf`): dos intentos, y a mi cliente le devuelve una página HTML (200, text/html), no el PDF. No pude leerla yo. El contraste del propio ciclo de hoy, `radar-contraste-2026-11-20.json` (id `paxg-occ`, estado `pdf`), guarda el literal «Trust Banks Active As of 10/31/2026 … 25379 Paxos Trust Company, National Association». Los revisores la leyeron además a las 17:16:15 y a las 21:07:55 UTC.
- **Contrato de Prosegur**: es una página de aplicación (`app.prosegurdigitalgold.com/#/terms-service`) y no lo reabrí. El cambio solo añade «Según su contrato,» a un texto ya revisado, y cuadra con la referencia de la propia ficha: «oro físico segregado mantenido dentro de un inventario fungible», con el alcance «Obligación contractual de Prosegur; no hay verificación física independiente» (Términos 08/07/2026, §§2.1 y 2.4).

## 2. La guarda del SQL no ha cambiado

Normalizada, la guarda es idéntica a la de antes:

- `begin isolation level serializable`;
- la versión publicada tiene que ser exactamente la `434217eb-9b7f-1cd9-a851-fbde7bced2bf`, con la huella `434217eb9b7f1cd9a851fbde7bced2bf001c79ac17610ad1d2a24edb8a9c1b61` y en estado `aprobada`. También se admite la nueva, para poder aplicarla dos veces;
- `retirado` tiene que ser `false`;
- `current_date` tiene que estar entre el 20/11 y el 27/11/2026 («Lote caducado: … hasta el 27/11/2026»);
- la revisión destino no puede existir ya con otra huella ni estar retirada.

`comprobar` lo confirmó con sus 6 casos de fallo: en todos «falla y no deja nada» (publicada distinta, otra huella, catálogo retirado, destino con otra huella, lote caducado y catálogo incompleto).

## 3. Lo que cambió el corrector en el motor (`git diff origin/main`)

Toca 2 ficheros: `preparar.mjs` (+19/−6) y `motor.test.mjs` (+18).

- **Cambiar el texto de un aviso** (`plataformas.<slug>.alertas.<código>`). Antes de cambiar nada, el motor exige cinco cosas:
  - que haya al menos un código;
  - que exista exactamente un aviso con ese código;
  - que las claves sean solo `antes`, `detalle` y `motivo`, así que no puede tocar fuentes, código, severidad ni título;
  - que `antes` sea igual a lo publicado;
  - que el `detalle` nuevo sea distinto del de antes y que haya motivo.

  Solo cambia el `detalle`. Las guardas de `estadoOperativo`, `licenciaRegistro` y `acceso` no cambian, salvo el texto del mensaje. La prueba nueva comprueba que el texto se aplica y que el motor falla con un «antes» distinto, con un código que no existe y con una clave de más (`fuentes`).
- **Gancho de prueba `opciones.cambiosRadar`**: desde la línea de órdenes no se puede meter, porque `motor.mjs` solo pasa `raiz`, `ciclo`, `decisiones` y `salida` (línea 87). Es el mismo patrón que ya tenían `opciones.web` y `opciones.comprobaciones`.
- **Guarda del orden de las referencias**: antes, al quitar o añadir una referencia, la comparación apartaba todas las que compartían su etiqueta. Ahora aparta solo la que coincide en etiqueta y valor (`clave(r)`). Es más estricta, no menos, y la comprobación del número de referencias no cambia.
- No afloja ninguna otra guarda: el diff no tiene más bloques que estos. Hay un matiz en la observación 2.

## 4. Lo que ejecuté y su resultado real

- `node --test .claude/skills/investigacion-catalogo/entrega/motor.test.mjs .claude/skills/investigacion-catalogo/entrega/flujo.test.mjs` → **23 pruebas, 23 bien y 0 fallos** (exit 0, 4,96 s).
- `node .claude/skills/investigacion-catalogo/entrega/motor.mjs comprobar 2026-11-20 --exportar=/tmp/claude-0/-home-user-RWADAR/684c4976-e318-5eb6-ab51-eb259042ad6c/scratchpad/exportado-auditor` → **`"resultado": "correcto"`**, revisión `eca89db7…`, sha256 `cb27c328…4f30`, 19 pruebas y 6 casos de fallo, exit 0. Entre sus líneas:
  - «plataformas: iguales salvo … y los cambios del radar de cambios-radar.json (pax-gold, midas, reental)»;
  - «167 cambios en 22 fichas»;
  - «cambian 14» tarjetas.
- Mi diff normalizado: 9 sentencias distintas, todas de la tabla del punto 1. El guion está en `…/scratchpad/auditor-final/normdiff.py` y la salida en `…/scratchpad/auditor-final/normdiff.txt`.
- Descargas de fuentes: en `…/scratchpad/auditor-final/fuentes/`.

## Observaciones (no bloquean)

1. **El radar de Midas cita una fuente que no dice lo nuevo.** El acceso y el aviso nuevos hablan de las Condiciones Finales, pero en el radar el acceso sigue enlazando el folleto base (`midas-mtbill`), y el aviso, ese folleto y el de 2024 (`midas-old-prospectus`). Ninguno de los dos contiene la lista de países ni la frase sobre minoristas.

   El texto es cierto (lo comprobé en el PDF) y el corrector lo dejó anotado en `noAplicado`. Las tres revisiones no pedían lo mismo para este caso:
   - la de contenido: aplicar el texto y dejar la fuente como está, que es lo que se hizo;
   - la de SQL: dejar acceso y aviso fuera si el motor no puede añadir la fuente;
   - la de cumplimiento: añadir el PDF como fuente.

   Me parece mejor un texto cierto con un enlace imperfecto que mantener publicado «no hemos podido obtener», que es falso y contradice la ficha de mTBILL. **Para el próximo ciclo o la migración 38:** dar al radar la fuente de las Condiciones Finales.
2. **La guarda «nada más cambia en el radar» es más amplia de lo necesario con los avisos.** En una plataforma con `alertas`, la guarda restaura todos sus `alertasCriticas`, no solo el `detalle` de los códigos declarados. Hoy no deja pasar nada: en `preparar.mjs` solo el bucle vigilado cambia los avisos (la línea 549 únicamente les da formato para la salida). Además, el diff del SQL muestra que cambia un solo `detalle` y que las 35 filas de `alerta_fuentes` son iguales. Sería más estricto restaurar solo el `detalle` de esos códigos.
3. **La URL que da 404 sigue en `fuentes` de mTBILL.** Me refiero a `https://midas.app/assets/main-DOxid0Zj.js`: sigue en esa lista y, por tanto, en la ficha web. Está declarado en `noAplicado` y ya no la cita ninguna referencia.
4. **No pude leer yo la lista de la OCC**, porque devolvió HTML. El 31/10/2026 se apoya en el literal guardado hoy por el ciclo y en las dos lecturas de los revisores.

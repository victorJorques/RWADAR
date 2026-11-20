# Revisión de la entrega 2026-11-20 · lente SQL e integridad

Revisor independiente (no monté esta entrega), 20/11/2026, hacia las 21:05 UTC.
Revisé el SQL `aplicar-y-aprobar.sql` con SHA-256 `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6`,
la revisión `c8727d7d-cd09-d2cf-d3dc-da3158fe6812` y la huella `c8727d7dcd09d2cf…052348a`.
Parte de la publicada `434217eb-9b7f-1cd9-a851-fbde7bced2bf`.

**Veredicto: aprobado con cambios.** El SQL de hoy está bien hecho: solo escribe la
revisión nueva en `rwadar_catalogo`, va en una transacción serializable con todas sus
guardas y, si algo falla, no deja nada. Pero DECISIONES §8 (A22) y §9 (A23–A25) no
están dentro. Al meterlos cambia el SQL, así que hay que volver a montar la entrega y
pasar otra vez la comprobación determinista. Abajo van los cambios exactos.

## 1. Qué ejecuté y qué salió

| Orden | Resultado |
|---|---|
| `motor.mjs preparar 2026-11-20 --repetir --salida=<scratchpad>/rev-sql-2026-11-20` | Sale bien. Los dos SQL, `revision.json`, `escaparate-publicacion.json`, `documentacion-ofertas.json`, `radar-canonico-26.json` y `manifiesto-catalogo.json` son **iguales byte a byte** a los de la carpeta (`cmp`), con el mismo SHA `4380fcf3…`. 162 cambios, 8 sin aplicar. Solo cambia `contraste-2026-11-20.json`, en un único campo: la huella de `DECISIONES-COORDINADOR.md`, que se tocó a las 20:53 UTC (se añadieron §8 y §9) después del montaje de las 20:50. |
| `motor.mjs comprobar 2026-11-20` (PGlite) | **Correcto.** 18 pruebas y 6 casos de fallo. El montador cuenta 19 porque usó la exportación; es la misma prueba. Mi ejecución reescribió `pruebas-locales.json` y lo dejé como estaba con `git checkout`. |
| Mi inventario propio (analizador de sentencias en Python que respeta comillas, `$tag$` y comentarios) | Ver §2. |
| Comparación campo a campo de `escaparate-publicacion.json` y `documentacion-ofertas.json` frente a `2026-11-13-v2/` | Ver §4. |
| `probar-enlaces.mjs` sobre el escaparate y la documentación del ciclo (21:0x UTC) | 136 direcciones, 123 responden bien. Quedan 13: 6 de la CNMV dan 500 al comprobador (en §8 consta que responden 200 a mano), 6 de Midas dan 403 con desafío de Cloudflare (conocido) y **1 da 404: `https://midas.app/assets/main-DOxid0Zj.js` (A22, sin arreglar en este SQL)**. Todas las direcciones nuevas de hoy responden 200: las Condiciones Finales y el KID de mTBILL en GitBook, las condiciones finales de ANTx en l-p-a.com y `SAFO_Letter_EN.pdf`. |

## 2. Inventario de sentencias (contado por mí)

**`aplicar-y-aprobar.sql`: 288 sentencias, nada después del último `;`.**

| N.º | Sentencia | Tabla | Idempotencia |
|---|---|---|---|
| 1 | `begin isolation level serializable` | — | — |
| 1 | `do $guarda$` (solo lee y bloquea con `for update`) | lee `rwadar_catalogo.publicacion_v2`, `rwadar_catalogo.revisiones` y `public.catalogo_publicacion` | — |
| 1 | `insert` | `rwadar_catalogo.revisiones` | `on conflict (id) do nothing` |
| 69 | `insert` | `rwadar_catalogo.fuentes` | `on conflict (revision_id,id) do nothing` |
| 25 | `insert … select … from public.plataformas where slug=…` | `rwadar_catalogo.plataformas` | `on conflict (revision_id,plataforma_id) do nothing` |
| 107 | `insert … select` | `rwadar_catalogo.plataforma_fuentes` | `on conflict do nothing` |
| 25 | `insert … select` | `rwadar_catalogo.alertas` | `on conflict do nothing` |
| 35 | `insert … select` | `rwadar_catalogo.alerta_fuentes` | `on conflict do nothing` |
| 22 | `insert` | `rwadar_catalogo.ofertas` | `on conflict (revision_id,slug) do nothing` |
| 1 | `do $aprobar$`: cuenta 25/22/8/13/1 y hace un único `update rwadar_catalogo.revisiones set estado='aprobada'… where id=v and estado='borrador'`; después exige `revision_publicable_v2` y que `publicacion_v2` apunte a la nueva | `rwadar_catalogo.revisiones` | — |
| 1 | `commit` | — | — |

En total hay 284 inserts, las mismas filas por tabla que el 13/11 (35/25/69/22/107/25/1),
todos con la revisión nueva. Fuera de los textos entre comillas no aparece ni una vez
`grant`, `revoke`, `alter`, `drop`, `truncate`, `create`, `delete`, `copy`, `execute`,
`perform`, `security definer`, `set role`, `auth.`, `storage.`, `policy`, `nextval`/`setval`
ni `dblink`/`http`. De `public.*` solo se lee: `public.plataformas` en los `select` y
`public.catalogo_publicacion` con `for update` en la guarda. No hay nada de usuarios,
Auth, RLS, permisos, funciones, esquema, servicios ni credenciales.

**`catalogo.sql`: 286 sentencias.** Son las mismas 284 inserts entre `begin` y `commit`,
sin guarda ni aprobación (deja la revisión como borrador). Es igual que en ciclos anteriores.

## 3. La guarda

Leí el código y lo comprobé en PGlite: los 6 casos fallan sin dejar nada.

- La publicada tiene que ser exactamente la `434217eb-…`. También se acepta la
  `c8727d7d-…`, para poder repetir sin efecto si ya estaba aplicada.
- La publicada tiene que tener la huella `434217eb9b7f…8a9c1b61` y estar `aprobada`.
- Catálogo no retirado: `retirado is distinct from false`, así que también falla si
  falta la fila.
- Fechas: si `current_date` es anterior al 20/11, «Revisión futura»; si es posterior al
  27/11/2026, «Lote caducado». `current_date` depende de la zona horaria de la sesión,
  que en Supabase es UTC.
- Si la revisión destino ya existe con otra huella o está retirada, falla.
- Todo va en una sola transacción serializable. Cualquier `raise` aborta la transacción
  y el `commit` del final se convierte en rollback.

## 4. Diferencias frente a la entrega 2026-11-13 (campo a campo)

**`escaparate-publicacion.json`:** 33 cambios de fondo y 349 que solo cambian la fecha.
Todos los de fondo están en DECISIONES:

- Spiko Euro: A1 (2,45 %) y A5.
- Spiko Dólar: A2 (4,00 %) y A5.
- Smart Cash: «Supervisor» de §2.
- Robinhood: A9.
- mTBILL: 1,0789 USD y 3,46 % (§2), A10 y A11.
- Prosegur: A12.
- Aktionariat, Boss Info y Switzerlend: A13, A14 y A15.
- Kraken: el resumen con «más de 1.000» (§2 y A6).
- Randhartingergasse y Hinterstoder: el aviso de A21.
- Hausera: el aviso y la métrica «preventa abierta» (§2) y el resumen (A17).
- `notaOrigen`, que solo cambia la base.

**`documentacion-ofertas.json`:** 173 cambios de fondo y 181 de fecha. Fuera de Brickwise,
todos están en DECISIONES:

- Spiko: A1 y A2, con `fechaDato` 2026-11-20.
- Smart Cash: la descripción y A4, con la fuente `SAFO_Letter_EN.pdf` y `fechaDato` 2026-02-23.
- Kraken: A6, A7 (`fechaDato` 2026-11-11 y el alcance pedido) y A8 (ANTx con `fechaDato` 2026-11-19).
- Boss Info: A16.
- Hausera: A17 y la errata del espacio que faltaba en «comprobado el 30/09/2026».

En Brickwise están A18 (se quitan las referencias de rentabilidad y reparto), A19, A20
parcial, la errata de A20, los mínimos de Pottendorfer (81 €) y Cohotel (110 €) y las
órdenes del 20/11. **No encontré ninguna diferencia que no esté en DECISIONES.**

Fechas: ninguna comprobación que no se repitiera hoy lleva fecha de hoy.

- Las referencias antiguas conservan su fecha: «consulta 01/11/2026» y la fuente
  `main-DOxid0Zj.js`, con `fechaConsulta` 2026-11-01.
- En Boss Info, el alcance dice que lo de la cadena de bloques «se comprobó … el
  13/11/2026 y hoy no se ha repetido».
- `transparencia` de `decisiones.json` solo re-fecha los mínimos y el aviso de Hausera,
  con prueba de hoy: CNMV a las 16:54:21 UTC.
- Lo que no se aplicó (A3, A21 tarjeta) se queda como estaba. `comprobar` lo confirma:
  «lo no aplicado sigue como estaba (11 comprobaciones de 8 puntos)».

## 5. Datos personales y escáner de secretos

Revisé los 243 archivos de la carpeta del ciclo que van a Git (`git ls-files` y los
archivos sin seguimiento que no ignora el `.gitignore`).

- No hay cadenas `0x` + 64 hexadecimales, que el escáner tomaría por claves privadas.
- No hay campos `private_key`, `secret`, `api_key`, `access_token` ni `password`, ni
  patrones de claves de AWS, GitHub, Stripe o JWT.
- Las únicas direcciones de correo son buzones de empresas o reguladores dentro de
  copias de documentos públicos: `dpo@prosegur.com`, `info@fma-li.li`, `team@midas.app`
  e `info@securitize.io`. Ninguna es de una persona física.
- Las copias con nombres de personas (§4 de DECISIONES) no están en lo que va a Git.

## 6. Correcciones obligatorias (cambian el SQL: hay que volver a montar)

**O1 · A22 (mTBILL, enlace con 404).** En `decisiones.json`, dentro de
`ofertas.mtbill.cambios`, añadir:

```json
{ "tipo": "referencia",
  "etiqueta": "Acceso desde España · consulta 01/11/2026",
  "antes": "mTBILL: Midas Software GmbH · «Public offer under the EU Prospectus Regulation» · offer: public",
  "despues": {
    "valor": "mTBILL: emisor Midas Software GmbH; España figura entre los países de la oferta pública en sus Condiciones Finales",
    "fuente": "https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media",
    "alcance": "Condiciones Finales de mTBILL en el CDN de GitBook de Midas (responden 200; las páginas de Midas dan 403 y el archivo de su web que se citaba antes, 404): incluyen España entre los países de la oferta pública. No confirma que la web te deje darte de alta." },
  "prueba": [ { "documento": "DECISIONES-COORDINADOR.md", "contiene": "A22 · mTBILL" },
              { "documento": "auditoria/radar-plataformas.md", "contiene": "b1e58001" } ] }
```

Si el motor toma esta etiqueta por un dato de tarjeta, hay que usar
`referenciaQuita` y después `referenciaNueva` con esos mismos campos. Además, en
`noAplicado`: «mtbill: `https://midas.app/assets/main-DOxid0Zj.js` (404) sigue en la
lista "fuentes" de documentacion-ofertas.json; el motor no quita direcciones de esa
lista (A22)». Lo mismo que ya pasa con GECO.

**O2 · A23 (Pax Gold, licencia).** En `cambios-radar.json`, dentro de `plataformas`:

```json
"pax-gold": { "licenciaRegistro": {
  "antes": "Paxos Trust Company, National Association figura en la lista OCC de trust banks activos a 30/09/2026 (charter 25379). La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.",
  "detalle": "Paxos Trust Company, National Association figura en la lista OCC de trust banks activos a 31/10/2026 (charter 25379). La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.",
  "motivo": "Lista OCC «Trust Banks Active As of 10/31/2026», charter 25379, leída el 20/11/2026 a las 17:16:15 UTC (auditoria/radar-plataformas.md, A23)." } }
```

La fuente `paxg-occ` (`trust-by-name.pdf`) no cambia.

**O3 · A24 (Midas).** En `cambios-radar.json`, dentro de `plataformas`:

```json
"midas": {
  "licenciaRegistro": {
    "antes": "La FMA de Liechtenstein aprobó el 17/07/2026 un nuevo folleto base de Midas Software GmbH, válido hasta el 17/07/2027 y notificado a la CNMV. Incluye mTBILL (ISIN CH1371002986) entre los productos que se siguen ofreciendo. Aprobar el folleto no es una licencia: el propio folleto dice que el emisor no está regulado por la FMA. No se obtuvieron los términos finales vigentes de mTBILL.",
    "detalle": "La FMA de Liechtenstein aprobó el 17/07/2026 un nuevo folleto base de Midas Software GmbH, válido hasta el 17/07/2027 y notificado a la CNMV. Incluye mTBILL (ISIN CH1371002986) entre los productos que se siguen ofreciendo. Aprobar el folleto no es una licencia: el propio folleto dice que el emisor no está regulado por la FMA.",
    "motivo": "A24: ya se obtuvieron las condiciones finales de mTBILL (PDF del CDN de GitBook, SHA-256 b1e58001…, 17:22:41 UTC)." },
  "acceso": {
    "antes": "No se obtuvieron términos finales vigentes que permitan confirmar acceso minorista, mínimo de inversión o elegibilidad desde España.",
    "detalle": "Las condiciones finales de mTBILL (17/07/2026) incluyen España entre los países de la oferta pública y no prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje darte de alta.",
    "motivo": "A24 (auditoria/radar-plataformas.md), condiciones finales del CDN de GitBook, SHA-256 b1e58001…, 17:22:41 UTC." } }
```

Ojo con esto. El motor solo cambia `estadoOperativo`, `licenciaRegistro` y `acceso`,
y solo puede citar las 69 fuentes que ya tiene el radar (`preparar.mjs`, líneas
137–146). No puede añadir las condiciones finales como fuente nueva ni cambiar el aviso
de la plataforma `terminos_finales_no_confirmados` («…que no hemos podido obtener»).
El `acceso` nuevo **no puede citar `midas-mtbill`**: es el folleto base, que no dice
eso, y citarlo sería atribuirle algo que no pone. Hay dos caminos:

- el motor admite una fuente nueva para el radar, y entonces entran el acceso y el aviso;
- o el acceso y el aviso van a `noAplicado` con este motivo, y solo entra la licencia
  (quitar esa frase no necesita fuente nueva).

**O4 · A25 (Reental, licencia).** En `cambios-radar.json`, dentro de `plataformas`:

```json
"reental": { "licenciaRegistro": {
  "antes": "La fuente primaria localizada acredita una emisión española concreta con ERIR; no acredita una autorización general de Reental como empresa de servicios de inversión.",
  "detalle": "Reental dice que su actividad en España no está sujeta a autorización ni registro previo de la CNMV.",
  "motivo": "reental.co, 20/11/2026 17:16:14 UTC: «La actividad no está sujeta a autorización ni registro previo de la CNMV» (auditoria/radar-plataformas.md, A25).",
  "fuentes": ["<id de la fuente del radar cuya página dice ese literal>"] } }
```

Solo vale `reental-faq` (`/en/faqs`) si ese literal está en esa página. Si está en
otra página de reental.co, es el mismo límite que en O3: o se añade la fuente o va a
`noAplicado`.

**O5 · La nota del radar.** En `cambios-radar.json`, la `nota` dice «Hoy no cambia
ninguna dirección ni ningún texto del radar». Con O2–O4 eso deja de ser verdad. Hay
que cambiarla, manteniendo el principio obligatorio «Cambios del radar comprobados a
mano el 20/11/2026.», por ejemplo: «… Hoy cambian textos de licencia o acceso de Pax
Gold, Midas y Reental (DECISIONES §9); ninguna dirección. …».

Después de O1–O5 hay que volver a ejecutar `preparar`, `comprobar` y `revisar`. Sale un
SHA nuevo y la comprobación determinista se repite sobre él. El contraste quedará con
la huella actual de DECISIONES.

## 7. Recomendadas (no bloquean)

- Usar solo `aplicar-y-aprobar.sql` en producción. `catalogo.sql` no tiene guarda,
  igual que en ciclos anteriores.
- El `pruebas-locales.json` que ya está en Git trae una ruta del scratchpad. No es un
  dato personal, pero sobra.
- A20 queda parcial en 5 fichas y A3 sin aplicar: ya constan en `noAplicado`, para el
  próximo ciclo.

# Verificación final de la entrega del catálogo «2026-11-10»

Hecha el 10/11/2026 (17:00–17:20 UTC) por Claude, como verificador final:
auditor independiente que no montó ni corrigió esta entrega. **Nada aplicado en
Supabase ni en ningún servicio remoto, nada publicado, ningún flujo lanzado, sin
commit ni push.**

## Resultado

**Conforme.** El SQL que hay que aplicar es, byte a byte, el mismo que se
revisó: `aplicar-y-aprobar.sql`, SHA-256
`60feef2cf10d648d01e9b7acef1811f2416522eaab419194a1b411d9bd05383a`, revisión
`dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`. Las correcciones obligatorias de los
tres revisores están hechas y no colaron nada más. Las pruebas salen en verde y
el escáner de secretos no encuentra nada. Antes de aplicar, el coordinador tiene
que confirmar dos textos (ver «Lo que queda»).

## Cómo lo comprobé

- Ejecuté todo en una copia aparte mía:
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/verificador-2026-11-10/copia`.
  Es un `git clone` del repositorio en 47ccb66, con la carpeta del ciclo y la
  del SQL copiadas encima y `node_modules` enlazados. Comprobé que las 2.108
  copias tenían el mismo SHA-256 que los originales.
- En la carpeta de trabajo solo he escrito este archivo. Las dos carpetas de la
  entrega tienen al terminar los mismos SHA-256 que al empezar.
- Mientras verificaba entró el commit 265c172 (17:11 UTC) con estos mismos
  archivos. Lo verificado es exactamente lo que hay en ese commit.

## 1. El SQL antes y después de las correcciones

- Comparé `aplicar-y-aprobar.sql`, `catalogo.sql` y `revision.json` de la copia
  de antes (`…/scratchpad/sql-antes-correcciones-2026-11-10/`) con los de
  `rwadar-app/data/importaciones/catalogo-2026-11-10-v2/`. Son **idénticos byte a
  byte** (`cmp`) y también iguales a los de 47ccb66.
- Hice además un diff normalizado, con los uuid, las huellas de 64 caracteres y
  las fechas-hora cambiados por marcadores: **0 líneas de diferencia**.
- El inventario no cambia. Son 288 sentencias en una sola transacción
  serializable: `begin`, la guarda, 284 inserts idempotentes en
  `rwadar_catalogo`, la aprobación y `commit`. Los inserts son 1 en revisiones,
  25 en plataformas, 69 en fuentes, 107 en plataforma_fuentes, 25 en alertas,
  35 en alerta_fuentes y 22 en ofertas. La aprobación solo hace un `update` en
  `rwadar_catalogo.revisiones`. Nada en `public.*` y sin DDL.
- Es lo esperado. Las 11 correcciones obligatorias dicen «no cambia el SQL» y
  no hay ninguna otra diferencia.

## 2. `preparar-entrega.mjs` (dos veces) y `comprobar-entrega.mjs`

En la copia borré primero las 8 salidas, para que el script las escribiera
desde cero. Lo ejecuté dos veces. Las dos salieron con exit 0 y las mismas 8
huellas, que coinciden con las de la carpeta de trabajo y con las que da el
montador:

| Salida | SHA-256 |
| --- | --- |
| `radar-canonico-26.json` | `451941b4…` |
| `escaparate-publicacion.json` | `424be5af…` |
| `documentacion-ofertas.json` | `633ed15f…` |
| `manifiesto-catalogo.json` | `c2c51919…` |
| `contraste-2026-11-10.json` | `a1eb33d1…` |
| `catalogo.sql` | `b4c2bb7e…` |
| `aplicar-y-aprobar.sql` | `60feef2c…383a` |
| `revision.json` | `2ddb1fef…` |

Lo que escribe el script: revisión `dfdc4c85-…`, 25 plataformas, 69 fuentes del
radar, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 95 cambios.

`comprobar-entrega.mjs --exportar=…` usa PGlite con la cadena de producción, 14
lotes hasta la 2026-11-05.2. Terminó con exit 0 en 24 s y «resultado:
correcto»: 19 comprobaciones y 6 casos de fallo, todos «OK», con el SHA
`60feef2c…383a`.

## 3. Las correcciones obligatorias, una a una

| Corrección | Qué encontré | Estado |
| --- | --- | --- |
| **SQL-1** (añadir a DECISIONES §2, tal cual) | Los dos textos del revisor están literales en «Brickwise, 11 de reventa» y en «Hausera · próximas ofertas». Comprobé que el SQL dice eso. En «Participaciones en venta · 10/11/2026», Stallhofstraße pasa de 313 a 317, Schwarzer Weg de 305 a 300, Randhartingergasse de 184 a 189 y Hinterstoder de 258 a 265; las otras 7 no cambian. La característica «Emisor» de Hausera lleva el texto nuevo. «Coste de Hausera» ya no está y «Comisiones» sí. | Hecha. Falta que el coordinador la ratifique (ver «Observaciones») |
| **SQL-2, C2 y O2** (el mismo campo de Hausera con tres textos distintos) | En `despues-de-aplicar.mjs` ya no están la excepción `NO_REFECHAR` ni su `assert`. La reescritura solo actúa si encuentra el texto de partida o el nuevo, y exige en el expediente de hoy la portada del documento, el conflicto entre documentos y que la emisión no estaba inscrita. Queda «no cumple», con consulta del 10/11/2026 y la dirección del documento de emisión de Alicante 3. El motivo, de 256 caracteres, es la frase de SQL-2 seguida de la segunda frase de O2 sin «(50 % o 70 %)». El título de la fuente es el de C2. | Hecha. Uno los tres textos y es el único arreglo posible. Las cifras de O2 no pueden ir porque `transparencia.mjs` prohíbe «%» (`PROHIBIDO = /%\|rentab\|…/`) y porque DECISIONES no publica el mínimo de la emisión |
| **SQL-3 y O3** (nombres de personas físicas) | Respecto a la foto de las 15:58 que usó la revisión SQL, cambian 22 archivos y ninguno más de los 792 de esas carpetas. En cada uno solo se ha cambiado un nombre por «[persona física recortada]»: 265 cambios, ninguno de otro tipo, y los cargos siguen. Las líneas que señalaron los revisores están recortadas. La línea 2044 de `info-AT0000A324B4.pdf.txt` ya lo estaba antes. DECISIONES §4 lista los 22 archivos. Ninguno de los 69 nombres completos que se quitaron, ni sus apellidos, aparece en los 828 archivos que irán a Git | Hecha |
| **C1** (mínimo corto de Switzerlend) | Las tres líneas están tal cual. En el ensayo sale «1 acción (68,01 CHF, 10/11)» | Hecha |
| **C3 y O1** (salida corta de Hausera y OTA) | Las dos líneas están, con la constante `HAUSERA` = `'hausera-proximas-ofertas'`, que da lo mismo. `salidaCorta` es «Al vender las viviendas, sin fecha fija» (39 caracteres). DECISIONES §1 e INFORME §8 (paso 6) dicen que la OTA es obligatoria | Hecha |

Revisé también qué más cambia, para ver si las correcciones colaron algo:

- **`despues-de-aplicar.mjs`**: aparte de las correcciones, importa
  `isDeepStrictEqual` y añade comprobaciones: el texto largo de la salida de
  Hausera en la ficha, las longitudes y el objeto ya validado. También cambia el
  mensaje de las dos fechas que no se actualizan (R3 de contenido, recomendada).
  Nada de esto cambia datos.
- **`DECISIONES-COORDINADOR.md`**: solo añade lo de SQL-1, el resumen de las
  correcciones en §1 y la lista de §4.
- **`INFORME-ENTREGA.md`**: solo documentación (estado, §6 a §9).
- **`contraste-2026-11-10.json`**: solo cambia el SHA-256 de DECISIONES que
  guarda (`147d4307…`).
- **`ensayo-despues.json` y `pruebas-locales.json`**: recogen las pasadas
  nuevas.
- **`expedientes/` y los informes de los revisores**
  (`revision-independiente/*.md`): iguales que en la foto de las 15:58. Los
  `REVISION-ENTREGA-*.md` se escribieron entre las 16:10 y las 16:40, antes de
  que empezaran las correcciones (16:41).

## Ensayo de «después de aplicar» (solo en la copia)

1. `despues-de-aplicar.mjs` antes de sincronizar: se niega con exit 1 («el
   catálogo sincronizado no es la revisión dfdc4c85-…») y no toca
   `transparencia.json` (sigue en `be173302…`).
2. `sincronizar.js` con el REST simulado: exit 0. «25 plataformas verificadas,
   5 descartadas y 22 ofertas clasificadas. rwadar.csv regenerado: 30 filas.»
3. `despues-de-aplicar.mjs`: exit 0 y «Comprobaciones de transparencia al
   10/11: 42 de 44». Las dos que se quedan con la fecha del 05/11 son
   «documentoEspana» de kraken-xstocks y «supervisada» de mtbill.
   `transparencia.json` queda en `7c527aaf…86ee`, el mismo SHA-256 que dio el
   montador. Al repetirlo: «Nada que cambiar: ya estaba hecho.», con el mismo
   SHA-256.
4. Comparé `transparencia.json`, campo a campo, con el de 47ccb66. Solo cambian
   estas cosas:
   - la revisión, el lote y la fecha de revisión;
   - 42 fechas de consulta y las 22 «verificadaEl»;
   - 13 mínimos cortos: los 11 de Brickwise, el de Hausera y el de Switzerlend;
   - 11 títulos de fuentes de Brickwise;
   - en Hausera, «documentoEspana» (motivo, título y dirección) y `salidaCorta`.
5. `transparencia.mjs`: exit 0, «Transparencia escrita: 22 ofertas con
   transparencia». `rwadar-fichas.js`: exit 0, «Archivos actualizados: 55». El
   texto de la app (`rwadar-movil/lib/transparencia-contenido.js`) y el de la
   web (`rwadar-site/assets/rwadar-20260820.js`) ya no traen el motivo viejo
   de Alicante 2. Traen la salida corta de Hausera y el mínimo de Switzerlend
   nuevos.
6. `npm test`, con la lectura «después de aplicar» simulada en la copia:
   **exit 0 en 179 s**.
   - Base de datos: 29 líneas «0 fallidas» y «30 comprobaciones SQL
     correctas». `node --test` dio 11/11 y 94/94.
   - Web: 642 correctas, 70 páginas y RSS, y 39 pruebas de precarga. El QR,
     correcto.
   - Móvil: 491 correctas y 2 omitidas de 493, sin fallos. Acceso: 237/237.
   - Herramientas: «fichas.json: 22 fichas (22 con foto), catálogo
     2026-11-10-v2», «Transparencia al día: 22 ofertas con transparencia» y
     «Diferencias: 0».

## 4. Escáner de secretos

- Escaneé los 828 archivos que irán a Git de las dos carpetas. Hay 792 de
  `expedientes/`, `grupos/` y `revision-independiente/`, que hoy están en
  `.git/info/exclude`. Hay 33 del resto de la carpeta del ciclo y los 3 del SQL.
- Para elegirlos usé las reglas de `.gitignore`, incluidas las del ciclo, sin
  `.git/info/exclude`. Los copié en
  `/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/verificador-2026-11-10/escaneo-gitleaks/`.
- Usé gitleaks 8.30.1: `gitleaks dir <carpeta> --config rwadar-app/gitleaks.toml
  --redact=100 --no-banner`. La configuración tiene el SHA-256 `51ca9646…`.
  Resultado: exit 0, «no leaks found» y el informe JSON vacío (`[]`). No marca
  ninguna ruta.
- Al terminar repetí el escaneo con este archivo dentro (829 archivos) y salió
  igual.

## Observaciones (no bloquean)

1. **Ratificación pendiente.** DECISIONES dice «Ratificado por la corrección
   SQL-1…» e INFORME §6 dice «ya está ratificado». Lo escribió el montador por
   el encargo «aplica todas las obligatorias», y el propio INFORME (§7) pide que
   el coordinador lo confirme. Conviene que lo confirme expresamente, y con
   eso la palabra queda bien. Si no ratifica la característica «Emisor» de
   Hausera (SQL-1, a), hay que deshacerla en `preparar-entrega.mjs` y
   regenerar, lo que cambia el SHA-256. Después hay que repetir las pruebas y
   la revisión.
2. **Motivo unido de Hausera.** No es el texto literal de ninguno de los tres
   revisores, porque no se puede ser fiel a los tres a la vez. Dice lo que
   pedían los tres, y solo faltan las cifras de O2, que la regla de
   transparencia no admite. Lo confirma el coordinador junto con lo anterior.
3. **Kraken y mTBILL** siguen con la fecha del 05/11 en «documentoEspana» y en
   «supervisada» («42 de 44»), como esperan los revisores. La expresión que
   busca las direcciones corta la de Kraken en el «)». Es para la próxima
   entrega.
4. **Ya estaba antes de las correcciones y no lo cambian.** El nombre de pila
   del responsable del proyecto sigue en el comentario del SQL, en su
   aprobación y en `contraste-2026-11-10.json`. Cumplimiento (R10) lo deja para
   lotes futuros, porque cambiarlo hoy cambiaría el SHA-256 revisado.

## Lo que queda (no lo hace el verificador)

- **El coordinador** confirma SQL-1 y el motivo unido de Hausera (observaciones
  1 y 2).
- **Antes de aplicar**, antes del 17/11 y con margen, porque la guarda usa la
  fecha en UTC:
  - confirmar en `main` que el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
    `60feef2c…383a`;
  - volver a leer como visitante: tiene que seguir publicada la `88d5a757`;
  - aplicar solo ese archivo, nunca `catalogo.sql`;
  - guardar la lectura pública en `lectura-despues-de-aplicar/` antes de
    `npm test`.
- **Después de aplicar**, en este orden:
  - `sincronizar.js`;
  - `despues-de-aplicar.mjs` (se espera «42 de 44»);
  - `volcar-seed.js`;
  - `transparencia.mjs`;
  - `rwadar-fichas.js`;
  - `npm test`;
  - publicar la web y **enviar la OTA**, que es obligatoria (O1).
- **Antes del commit que los incluya**, quitar `expedientes/`, `grupos/` y
  `revision-independiente/` de `.git/info/exclude`.

## Dónde están las pruebas

Todo está en
`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/verificador-2026-11-10/`:

- `prep1.sha` y `prep2.sha`: las 8 huellas de las dos pasadas;
- `comprobar.out`;
- `sql-diff-normalizado.txt`, que está vacío;
- `futuro-cambios.txt`: los 22 archivos recortados;
- `tramos-quitados.tsv`: lo que se quitó (nombres, no va a Git);
- `despues-1.out` y `despues-2.out`;
- `npm-test.log`;
- `a-git-verificador.txt` y `gitleaks-informe.json`.

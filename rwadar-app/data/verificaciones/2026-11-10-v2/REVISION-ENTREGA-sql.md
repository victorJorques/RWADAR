# Revisión independiente de SQL e integridad · entrega 2026-11-10

**Veredicto: `aprobado_con_cambios`.** El SQL hace lo que se pidió y nada más:
inserta la revisión nueva en `rwadar_catalogo` y la aprueba al final, en una
sola transacción serializable con guarda. No toca `public.plataformas` ni
`public.fuentes`, ni usuarios, Auth, RLS, permisos, funciones o esquema.

Se puede aplicar **tal cual** (SHA-256 `60feef2c…383a`) en cuanto el
coordinador **ratifique en DECISIONES tres cambios que el montador hizo y que no
están en la lista literal** (corrección 1). Ratificarlos no cambia el SQL. Las
otras dos correcciones obligatorias tampoco tocan el SQL:

- el motivo de transparencia de Hausera, antes de publicar la web (corrección 2);
- nombres de personas en copias que aún no están en Git, antes de subirlas
  (corrección 3).

Datos de la entrega:

- Revisión nueva: `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`
  (huella `dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f`).
- Guarda sobre la publicada: `88d5a757-3481-f70e-dc7c-6272704a00b3`
  (huella `88d5a7573481f70edc7c6272704a00b3963248fcf32943caba65a10b86f789a8`),
  entrega 2026-11-05.2.
- **SHA-256 de `aplicar-y-aprobar.sql`: `60feef2cf10d648d01e9b7acef1811f2416522eaab419194a1b411d9bd05383a`.**
  Es el mismo en la carpeta de trabajo y en `HEAD` (`47ccb66`).
- SHA-256 de `catalogo.sql`: `b4c2bb7e65bcc25dc705e2c64d0938a2d09e8efb7855deb6ad5153f522567379`.
  SHA-256 de `revision.json`: `2ddb1fef55d290684bef4ea6b1d9b2530a12fa71a14c938043e0431dad773a68`.
- Revisor: Claude, revisión independiente de SQL e integridad, 10/11/2026, de
  15:50 a 16:15 UTC. No monté esta entrega. Lo que se ejecuta o escribe lo
  hice en una copia aparte
  (`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/rev/copia`).
  En la carpeta de trabajo solo he escrito este archivo.

## 1. Qué ejecuté y qué salió

| Paso | Resultado |
|---|---|
| Copia aparte del árbol de trabajo (sin `.git` ni `.claude`; `node_modules` de la app enlazado) | `diff -rq` de `2026-11-10-v2/` y de `importaciones/`: idénticas al repositorio. |
| `preparar-entrega.mjs`, **dos veces**, en la copia | exit 0 las dos veces. Las 8 salidas tienen el mismo SHA-256 en las dos ejecuciones y son **iguales a las del repositorio**: `radar-canonico-26.json` 451941b4…, `escaparate-publicacion.json` 424be5af…, `documentacion-ofertas.json` 633ed15f…, `manifiesto-catalogo.json` c2c51919…, `contraste-2026-11-10.json` d642cc95…, `catalogo.sql` b4c2bb7e…, `aplicar-y-aprobar.sql` 60feef2c…, `revision.json` 2ddb1fef…. Salida: `{"revisionId":"dfdc4c85-…","previa":"88d5a757-…","sha256":"60feef2c…","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":95}`. |
| `comprobar-entrega.mjs --exportar=DIR`, en la copia | exit 0 en 25 s, «resultado: correcto», 19 comprobaciones y 6 casos de fallo. Coincide con lo que dice el montador. |
| Inventario propio de los dos SQL | Un analizador que separa las sentencias respetando comentarios, cadenas y bloques `$…$`. No busca palabras sueltas: cuenta y clasifica. Resultado en §2. |
| Prueba propia en PGlite, con la cadena de producción (base histórica, migraciones del catálogo y los 14 lotes hasta la 2026-11-05.2) | Tomé una huella de **todas** las tablas de todos los esquemas (32 tablas en `auth`, `cron`, `net`, `public`, `rwadar_catalogo` y `vault`) antes y después de aplicar. Además: aplicarla dos veces, aplicar solo `catalogo.sql` y forzar un error justo antes del `commit`. Resultado en §2 y §3. |
| Prueba propia con la migración 30 (avisos) instalada, montada como en `probar-avisos-registrados.mjs` | Los tres disparadores de `rwadar_catalogo.revisiones` están activos. El lote se aplica sin error y no crea ningún anuncio (0 → 0), porque no hay altas. |
| «Después de aplicar», en la copia | `despues-de-aplicar.mjs` antes de sincronizar se niega («el catálogo sincronizado no es la revisión dfdc4c85-…») y no cambia `transparencia.json` (be173302…). `sincronizar.js` con el REST simulado: «25 plataformas verificadas, 5 descartadas y 22 ofertas clasificadas. rwadar.csv regenerado: 30 filas.» Después, `despues-de-aplicar.mjs`: exit 0, «Comprobaciones de transparencia al 10/11: 41 de 44», y `transparencia.json` pasa a 4a47d31b… (el mismo SHA-256 que da el montador). Repetido: «Nada que cambiar: ya estaba hecho.», mismo SHA-256. |
| Comparación campo a campo con `2026-11-05.2-v2/` | De `escaparate-publicacion.json` y `documentacion-ofertas.json`. Resultado en §4. |
| gitleaks 8.30.1, con `rwadar-app/gitleaks.toml` y las mismas opciones que `ci.yml` | El paquete tiene el SHA-256 que fija `ci.yml` (551f6fc8…70eb). (a) Contenido de `HEAD` (`git archive`, 109,8 MB): «no leaks found». (b) Los 792 archivos de `expedientes/`, `grupos/` y `revision-independiente/` que irían a Git (hoy fuera por `.git/info/exclude`), filtrados con los `.gitignore`: «no leaks found». |
| Datos personales y prefijos de claves conocidos | §6. |
| Al terminar | `git status` limpio salvo este archivo. El SHA-256 del SQL y el de `transparencia.json` no han cambiado. |

No repetí `npm test`, `volcar-seed.js`, `transparencia.mjs` ni `rwadar-fichas.js`.
Los ejecutó el montador en su copia y no cambian el SQL.

## 2. Inventario de las sentencias

### `aplicar-y-aprobar.sql`: 288 sentencias, una sola transacción

| Orden | Sentencia | Tabla | Cuántas | Qué hace |
|---|---|---|---|---|
| 1 | `begin isolation level serializable` | — | 1 | Abre la transacción. Es el único `begin`. |
| 2 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` (`for update`), `rwadar_catalogo.revisiones` y `public.catalogo_publicacion` (`for update`) | 1 | Solo lee y, si algo falla, lanza un error. Detalle en §3. |
| 3 | `insert … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 1 | La revisión nueva, en borrador. |
| 4 | `insert … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | 69 | Las 69 fuentes del radar, todas con consulta del 10/11. Son las mismas 69 de `radar-contraste-2026-11-10.json` (69 correctas, 0 bloqueos). |
| 5 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | 25 | Lee `public.plataformas` sin escribir en ella. |
| 6 | `insert … select … from public.plataformas … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 107 | Igual. |
| 7 | Igual | `rwadar_catalogo.alertas` | 25 | Igual. |
| 8 | Igual | `rwadar_catalogo.alerta_fuentes` | 35 | Igual. |
| 9 | `insert … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | 22 | 8 principales, 13 de reventa y 1 en camino. Las 22 con `verificada_el` del 10/11 y 7 días de vigencia. |
| 10 | `do $aprobar$` | Cuenta filas en `rwadar_catalogo` y hace **un** `update rwadar_catalogo.revisiones set estado = 'aprobada' … where id = v and estado = 'borrador'` | 1 | Exige 25/22/8/13/1, que la vista `revision_publicable_v2` acepte la revisión y que el puntero quede en la nueva. Si no, error y se deshace todo. |
| 11 | `commit` | — | 1 | |

Los 284 inserts son de la revisión nueva (284 de 284) y todos son
idempotentes. No hay DDL, `delete`, `truncate`, `grant`, `revoke`, políticas,
funciones ni `set role`. No hay nada en `auth`, `storage` ni `vault`. Tampoco
hay caracteres de control ni invisibles. Los saltos de línea son LF y el
archivo termina en `commit;`.

### Lo que cambia de verdad en la base (PGlite, 32 tablas)

| Tabla | Antes → después | Por qué |
|---|---|---|
| `rwadar_catalogo.revisiones` | 14 → 15 filas | Insert y aprobación. |
| `rwadar_catalogo.plataformas` | 361 → 386 | Insert (+25). |
| `rwadar_catalogo.ofertas` | 381 → 403 | Insert (+22). |
| `rwadar_catalogo.fuentes` | 962 → 1.031 | Insert (+69). |
| `rwadar_catalogo.plataforma_fuentes` | 1.516 → 1.623 | Insert (+107). |
| `rwadar_catalogo.alertas` | 361 → 386 | Insert (+25). |
| `rwadar_catalogo.alerta_fuentes` | 501 → 536 | Insert (+35). |
| `rwadar_catalogo.publicacion_v2` | 1 → 1 | El puntero pasa a `dfdc4c85`. Es la publicación: la hace el disparador `fijar_publicacion_v2`. |
| `public.catalogo_publicacion` | 1 → 1 | El disparador `sincronizar_publicacion_catalogo` deja `retirado = false` y `motivo = null`, como estaban. Solo cambia `actualizado_el`. |

No cambia ninguna otra tabla: ni `auth`, `vault`, `cron` o `net`, ni el resto
de `public` (incluidas `plataformas`, `fuentes`, `cambios_estado`, los avisos y
las emisiones). Si se aplica dos veces, la segunda no cambia nada.

«Nada en `public.*`» es exacto para el texto del SQL. Con los disparadores, la
única fila pública que se toca es esa marca de tiempo, igual que en todos los
lotes.

### `catalogo.sql`: 286 sentencias

Tiene un `begin` (sin serializable), los mismos 284 inserts, byte a byte, y un
`commit`. No lleva guarda ni aprobación. En PGlite deja la revisión en
borrador, y lo publicado (`88d5a757`) y la vista pública no cambian. Solo sirve
para importar un borrador. No sirve para publicar.

### Frente al SQL publicado (2026-11-05.2)

La guarda y la aprobación tienen la misma forma. Solo cambian los
identificadores, las fechas y el texto de la aprobación. La 2026-11-05.2 tenía
además tres sentencias para `public.plataformas` (la web de Pax Gold) y dos
condiciones de retirada en la aprobación. Hoy no hacen falta.

## 3. La guarda

| Exigencia | Qué hace el SQL | Probado |
|---|---|---|
| Publicada exacta | Si `actual not in ('88d5a757…', 'dfdc4c85…')`, error. Sin fila, también error. Acepta la nueva solo para poder repetir sin efecto. | Con la publicada `cede1f27`, falla y no deja nada (comprobar). |
| Huella | Exige que `88d5a757` tenga `contenido_sha256 = '88d5a7573481…f789a8'` y `estado = 'aprobada'`. | Con otra huella, falla. |
| Catálogo no retirado | Si `retirado is distinct from false`, error. También si falta la fila. | Con el catálogo retirado, falla. |
| Fechas | `current_date < date '2026-11-10'` da error. `current_date > date '2026-11-17'` da «Lote caducado: sus fichas valían hasta el 17/11/2026». | Con el tope movido, falla (comprobar mueve la fecha en el texto; el literal `2026-11-17` lo he leído yo). |
| Destino | Si `dfdc4c85` ya existe con otra huella o retirada, error. | Falla. |
| Serializable | `begin isolation level serializable` y `for update` sobre el puntero y sobre el control del catálogo. | — |
| No deja nada | Cualquier error deshace la transacción entera. El flujo «Aplicar catálogo» usa `psql -v ON_ERROR_STOP=1 -X -q -f` sin `-1`. Así respeta el `begin` del archivo y, si algo falla, se para y la conexión se cierra sin `commit`. | Los 6 casos de comprobar y un error mío forzado justo antes del `commit`: no cambia ninguna de las 32 tablas. |
| Avisos (migración 30) | Si está instalada, su disparador se ejecuta, pero hay 0 fichas nuevas y no crea ningún anuncio. | 0 → 0 anuncios. |

## 4. Diferencias con la publicada, campo a campo

Comparé cada oferta por su slug y cada campo. Las métricas, por etiqueta. Los
avisos, por texto. La documentación, por fuentes, características y
referencias.

Esto cambia en todas: `verificadaEl` y `revisadaEl` pasan del 05/11 al 10/11.
Hay 125 avisos con la fecha nueva y el mismo texto, y no queda ningún aviso sin
la fecha de hoy. Los tres datos de la tarjeta conservados pasan a «Comprobado
de nuevo en la fuente el 10/11/2026».

Cada aviso publicado está, palabra por palabra, en la propuesta del expediente
de hoy. Las dos excepciones son los dos que reescribe DECISIONES (Spiko Dólar y
Boss Info).

El resto también cuadra:

- Los 22 slugs son los mismos y están en el mismo orden.
- Las plataformas solo cambian de fecha (25 `verificadoEl` y 142 `consultadaEl`,
  todas del 10/11; `fechaCanonicaConservada`, igual).
- `radar-canonico-26.json` solo cambia en las fechas y en el texto de alcance de
  la revisión.
- `cambios-radar.json` no cambia ninguna dirección ni ningún texto.
- `comprobaciones-fuentes.json` solo cambia `spiko-access` («ORIAS» → «redeem
  fund shares»), como dice DECISIONES.

| Ficha | Qué cambia, además de las fechas | ¿En DECISIONES? |
|---|---|---|
| Spiko Letras Euro | Rentabilidad 2,39 % → 2,44 % (literal, métrica y referencia; VL del 09/11). | Sí |
| Spiko Letras Dólar | 3,99 % → 4,09 %. El aviso del 10 % termina con «, aunque la web de Spiko diga que no hay límite de importe». | Sí |
| Spiko Smart Cash | Literal y métrica (VL del 09/11; sigue en 2,84 %). «Supervisor». Sale el aviso de GECO. Cambia la descripción. «Aprobación del compartimento» pasa a la fuente GECO con consulta del 10/11; su `fechaDato` pasa del 23/02 al 17/02, la fecha de la autorización. La documentación gana la fuente GECO. | Sí |
| Robinhood, Kraken, Prosegur | Solo fechas. | Sí |
| mTBILL | «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)». | Sí |
| Aktionariat | Precio del emisor, «Supervisor» y aviso de vendedores, con fecha del 10/11. | Sí |
| Boss Info | Resumen y descripción con la operación del 05/11 (8,40 ZCHF). Referencia nueva «Última operación · 10/11/2026». Salen las tres referencias de 6,70. El aviso lleva «(venta más barata 8,40 ZCHF el 10/11/2026)». «Mínimo de inversión» y «Supervisor», con fecha del 10/11. | Sí |
| Switzerlend | Dos avisos, el mínimo y «Supervisor», con fecha del 10/11. | Sí |
| Brickwise (11) | Mínimos según la tabla (75, 65 y 68,80; el resto, igual). «Mejor oferta de compra»: 54 → 60, 40,50 → 46, 65 → 20 y 89 → 84. Las referencias del libro de órdenes pasan a la etiqueta «· 10/11/2026». | Sí, salvo (b) |
| Hausera | Resumen, descripción, las 4 métricas, mínimo, acceso y salida. Avisos: sale 1 y entran 3 (quedan los 6 del expediente y el general). 3 fuentes nuevas. Salen las 3 rentabilidades de octubre y el historial del 22/10 se sustituye por el del 10/11. No aparece el mínimo de emisión (50 % / 70 %). | Sí, salvo (a) y (c) |

### Fuera de la lista literal

Las tres tienen respaldo en el expediente y en la revisión de su grupo. Si se
ratifican, el SQL no cambia.

- **(a) Hausera, característica «Emisor» de la documentación.** Antes: «SPV del
  Grupo Hausera identificada en cada documento de emisión (para Alicante 2, no
  publicada)». Ahora: «Una sociedad por operación, identificada en su documento
  de emisión; la de Alicante 3 es HAUSERA PROPERTY MANAGER SPV 11, S.A».

  El texto nuevo resume el campo `emisor` del expediente, y el revisor de
  `espana-proximas` dejó el emisor «confirmado». DECISIONES solo nombra la
  métrica «Emisor». Dejar el texto viejo sería publicar algo falso hoy.
- **(b) Brickwise, referencias del libro de órdenes.** «Participaciones en venta ·
  10/11/2026» cambia en cuatro fichas: Stallhofstraße 313 → 317, Schwarzer Weg
  305 → 300, Randhartingergasse 184 → 189 e Hinterstoder 258 → 265. «Venta más
  barata · 10/11/2026» añade el detalle de las órdenes («orden del …», «en N
  órdenes»).

  El revisor de `brickwise` lo confirma en su tabla del libro de órdenes.
  DECISIONES solo enumera el mínimo y la «mejor oferta de compra».
- **(c) Hausera, métrica «Coste de Hausera».** Sale «Sin comisión por invertir
  (FAQ)» y la sustituye «Comisiones». Lo propone el expediente
  (`cambiosRespectoPublicado`) y DECISIONES dice «Todo según el expediente».
  Aun así, no la nombra.

### Lo que el montador no aplicó tal cual

Estoy de acuerdo con cada punto:

- El aviso de Boss Info coincide literalmente con DECISIONES.
- «CNMV n.º 251» se escribe como en DECISIONES.
- En Spiko Dólar, el añadido va antes del punto final.
- Las condiciones y cifras de las fichas que no están «actual» las enmascara la
  vista pública, como hasta ahora.
- El «Desistimiento» de Brickwise conserva su fecha del 05/11, que es lo
  prudente.
- La característica de Hausera es la corrección 1, y su transparencia, la 2.

## 5. `despues-de-aplicar.mjs` y `transparencia.json`

- Solo escribe `transparencia.json`, y antes comprueba que el catálogo
  sincronizado es `dfdc4c85` (25/22, todas verificadas el 10/11). Si no lo es,
  se niega y no toca nada.
- Pone la fecha de hoy a `supervisada` o `documentoEspana` solo si el
  expediente de hoy trae esa misma dirección. **He comprobado las 41 una a
  una.** Cada una tiene en el expediente una entrada de hoy (`consultadoUtc` del
  10/11, o un documento leído hoy con `leido: true`):
  - Brickwise, 22: el registro 5003 de la CNMV a las 09:07:57 UTC y cada PDF con
    sus afirmaciones, de 09:03 a 09:04 UTC.
  - Spiko, 6: la CNMV a las 09:09 y los KID a las 09:05.
  - Robinhood, Prosegur, Aktionariat, Boss Info y Switzerlend, 2 cada una.
  - Kraken, mTBILL y Hausera, 1 cada una.
- Se quedan con la fecha del 05/11:
  - el `documentoEspana` de Kraken (las condiciones finales no se volvieron a
    leer);
  - el `supervisada` de mTBILL (la BaFin no se volvió a leer);
  - el `documentoEspana` de Hausera (su motivo ya no es cierto).
- También cambian la revisión, el lote y `revisadoEl`. Cambian los
  `minimoCorto` de las 11 de Brickwise y de Hausera (DECISIONES §1). Y cambia la
  fecha del título del punto «mercado de reventa en la app» de las 11 de
  Brickwise, cuya fuente (el libro de órdenes) se leyó hoy.
- **Conclusión: no pone la fecha de hoy a ninguna comprobación que no se
  repitió hoy.**
- **Problema (corrección 2).** Después de aplicar, la web enseñaría junto a la
  ficha de Hausera, que ya dice que el documento de Alicante 3 es público, esta
  comprobación: «Alicante 2 no tiene documento de emisión público: su ficha
  pide iniciar sesión…». Su fuente se titula «ficha de Alicante 2 (redirige al
  inicio de sesión)» y lleva fecha del 05/11. El expediente leyó hoy esa ficha
  (09:02:36 UTC) y ya no pide iniciar sesión.
- Nota: el `minimoCorto` de Switzerlend se queda en «1 acción (68,01 CHF,
  05/11)», mientras la ficha dice «(68,01 CHF el 10/11)». Ver la recomendación 4.

## 6. Datos personales y escáner de secretos

### Lo que ya está en Git (`HEAD` `47ccb66`)

- gitleaks, con la configuración del repositorio: sin hallazgos.
- No aparece ningún prefijo de clave conocido (AIza, AKIA, ghp_, github_pat_,
  xox, sk_live, JWT, sbp_, sb_secret_ ni claves privadas).
- El SQL, el escaparate, la documentación, el contraste, el radar, el informe,
  las pruebas y el ensayo no llevan correos, teléfonos, IBAN ni nombres de
  personas físicas.
- Sí llevan identificadores de empresas (UID CHE, LEI, ISIN y el NIF de una
  sociedad), tres direcciones de contrato de token ya publicadas (Aktionariat,
  Boss Info y Switzerlend) y el enlace público de Drive al documento de
  Hausera. Ninguno salta en gitleaks.
- El único nombre de persona en el SQL es el nombre de pila del titular del
  proyecto, en el comentario de cabecera y en el texto de la aprobación, como
  en todos los lotes.

### Lo que irá a Git

Son `expedientes/`, `grupos/` y `revision-independiente/`, que hoy están en
`.git/info/exclude`. Después de aplicar los `.gitignore` quedan 792 archivos;
`crudo/`, los PDF y los HTML se quedan fuera.

gitleaks no encuentra nada. Pero quedan **nombres de personas físicas sin
recortar** en estos archivos (rutas desde `2026-11-10-v2/`):

| Archivo | Línea | Qué es | ¿En DECISIONES §4? |
|---|---|---|---|
| `grupos/ampliacion/fuentes/crowdedhero/home.txt` | 1 | Nombre del consejero delegado de la plataforma (dos veces) | No |
| `grupos/ampliacion/fuentes/crowdedhero/project-44.txt` | 1 | Nombre de quien fundó y dirige la empresa del proyecto (tres veces) | No |
| `grupos/ampliacion/fuentes/crowdedhero/project-50.txt` | 1 | Lo mismo | No |
| `grupos/candidatas-mercados/fuentes/coinbase-nvdac-prospectus.txt` | 2398–2399 | Nombres de los fundadores | No |
| `grupos/ampliacion-1/fuentes/press-stocks.txt` | 65 | Cargo público citado en una nota de prensa | No |
| `grupos/ampliacion/fuentes/radar-sin-oferta/securitize-press-stocks.txt` | 70 | Lo mismo | No |
| `grupos/brickwise/fuentes/brickwise/info-AT0000A324B4.pdf.txt` | 2044 | Proveedor persona física (en las copias antiguas ya se cambió por «[persona física recortada]») | Sí (Brickwise), pendiente |
| `grupos/brickwise/fuentes/reguladores/fma-busqueda-web-investor-warning.txt` | 6 | Persona nombrada en una advertencia de la FMA | Sí (Brickwise), pendiente |
| `revision-independiente/fuentes/brickwise/reguladores/fma-busqueda-investor-warning.txt` | 1 | Lo mismo | Sí (Brickwise), pendiente |

La búsqueda no es exhaustiva: busca tratamientos y cargos junto a un nombre
propio. La pasada completa le toca a la revisión de cumplimiento.

Descarté como falsos positivos:

- nombres de empresas (por ejemplo, una GmbH en el documento de Brickwise);
- el nombre de una calle de Madrid en la dirección de Securitize;
- las copias ya recortadas (SG-Forge, Blockchain.com, Prosegur y Boss Info).

## Correcciones obligatorias

### 1. Ratificar en DECISIONES lo que no está en la lista literal

**No cambia el SQL si se ratifica.**

Hay que añadir a `DECISIONES-COORDINADOR.md` §2 estas líneas, tal cual (o
decidir lo contrario):

- En «Hausera · próximas ofertas»: «Documentación, característica «Emisor»:
  «SPV del Grupo Hausera identificada en cada documento de emisión (para
  Alicante 2, no publicada)» → «Una sociedad por operación, identificada en su
  documento de emisión; la de Alicante 3 es HAUSERA PROPERTY MANAGER SPV 11,
  S.A» (expediente, campo `emisor`; revisión: emisor confirmado). Sale la
  métrica «Coste de Hausera» («Sin comisión por invertir (FAQ)»), sustituida
  por «Comisiones».»
- En «Brickwise, 11 de reventa»: «Referencias del libro de órdenes con la
  lectura del 10/11 confirmada por el revisor: «Venta más barata · 10/11/2026»
  (precio de la tabla, con la fecha o el número de órdenes) y «Participaciones
  en venta · 10/11/2026» (Stallhofstraße 313 → 317, Schwarzer Weg 305 → 300,
  Randhartingergasse 184 → 189, Hinterstoder 258 → 265; las demás, iguales).»

Si el coordinador no ratifica (a), hay que deshacerlo en
`preparar-entrega.mjs`, regenerar la entrega (cambia el SHA-256) y repetir
`comprobar-entrega.mjs` y esta revisión. Hasta que se ratifique, no se aplica.

### 2. Hausera: comprobación `documentoEspana` de `transparencia.json`

**No cambia el SQL.** Hay que hacerlo antes de ejecutar
`despues-de-aplicar.mjs` y de publicar la web.

Primero, DECISIONES fija el motivo nuevo. Después, `despues-de-aplicar.mjs`
cambia en dos sitios:

- Sustituye la entrada de `NO_REFECHAR` por una reescritura que exija el texto
  actual y escriba esto:

  ```json
  "documentoEspana": {
    "cumple": false,
    "motivo": "El documento de emisión de Alicante 3 es público, pero no es un folleto ni un KID: la CNMV no lo ha revisado y el 10/11/2026 la emisión aún no estaba inscrita.",
    "fuente": {
      "titulo": "Hausera · documento de emisión de Alicante 3",
      "url": "https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_"
    },
    "consultadaEl": "2026-11-10"
  }
  ```

  El motivo tiene 159 caracteres; el máximo es 300. La fuente está en el
  expediente de hoy, descargada a las 09:04:35 UTC.
- Quita la aserción `assert.ok(fechas.some(f => f.sinRefechar && …), 'Hausera:
  documentoEspana se queda con su fecha')`.

Resultado esperado: «42 de 44» (siguen con su fecha Kraken y mTBILL), y
`cargarTransparencia` lo valida.

### 3. Recortar nombres de personas antes de subir las carpetas excluidas

**No cambia el SQL.** Antes de quitar `expedientes/`, `grupos/` y
`revision-independiente/` de `.git/info/exclude` y hacer commit:

- En los 9 archivos de la tabla de §6, cambiar cada nombre por «[nombre
  recortado]» (o «[persona física recortada]», como en las copias antiguas) y
  conservar el cargo.
- Añadir a la lista de DECISIONES §4 los 6 archivos que no están en ella.
- Repetir gitleaks y la búsqueda de nombres.

## Recomendaciones (no bloquean)

1. **Antes de aplicar:**
   - confirmar que en `main` el SHA-256 de `aplicar-y-aprobar.sql` sigue siendo
     `60feef2c…383a`;
   - volver a leer como visitante (tiene que seguir la `88d5a757`);
   - aplicar solo ese archivo con «Aplicar catálogo», nunca `catalogo.sql`.
2. **El paso «Leer el lote publicado» del flujo no sirve de prueba.** Ordena por
   id (`order by 1 desc limit 2`) y enseñará `fab6d2e4` y `f2be1f5e`, no
   `dfdc4c85`. La prueba es la lectura pública de las vistas v2
   (`lectura-despues-de-aplicar/`). El flujo se puede arreglar aparte.
3. **`current_date` va en UTC en Supabase.** La guarda aceptaría el lote hasta
   la 01:00 (hora de Madrid) del 18/11. Conviene aplicar con margen. En lotes
   futuros se podría usar la fecha de Madrid.
4. **Switzerlend.** Si el coordinador lo añade a DECISIONES, su `minimoCorto`
   puede pasar a «1 acción (68,01 CHF, 10/11)». El dato se comprobó hoy.
5. **`INFORME-ENTREGA.md`.** Puede decir que la aprobación toca, por medio de
   los disparadores, `public.catalogo_publicacion.actualizado_el` y el puntero
   `publicacion_v2`.
6. **Comparación de direcciones en `despues-de-aplicar.mjs`.** Pasa la ruta a
   minúsculas. Hoy no afecta (las 41 están comprobadas), pero podría confundir
   identificadores que distinguen mayúsculas (Drive, CDN). En lotes futuros,
   mejor comparar la ruta tal cual, salvo el `.aspx` de la CNMV.

## Lo que no hice

- No toqué Supabase ni ningún servicio remoto. No publiqué, no lancé flujos de
  GitHub y no hice commit ni push.
- No edité expedientes, informes de revisores ni ningún otro archivo. En la
  carpeta de trabajo solo escribí este.

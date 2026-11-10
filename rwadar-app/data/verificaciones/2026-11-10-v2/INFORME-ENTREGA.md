# Entrega del catálogo 2026-11-10 · investigación del día

Preparada el 10/11/2026 por Claude (montador de datos y SQL). **Nada aplicado en
Supabase, nada publicado, sin OTA, ningún flujo lanzado, sin commit ni push.**
Estado: **preparada y probada en local** (PGlite y un ensayo completo de
«después de aplicar» en una copia aparte). Falta la revisión independiente de
la entrega (`REVISION-ENTREGA.md`).

Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md`: solo lo que el
revisor de cada grupo dejó confirmado, con sus correcciones obligatorias. Los
textos, fuentes y fechas salen de `expedientes/` y de `revision-independiente/`.
Sin altas ni retiradas: las mismas **22 ofertas** (8 principales, 13 de reventa y
1 en camino) y **25 plataformas**. Hoy **no** se toca `public.plataformas` ni
`public.fuentes`.

## 1. Partida

- **Lo publicado.** Leído como visitante (REST de Supabase con la clave
  publicable, solo GET) el 10/11/2026 de 08:58:11 a 08:58:14 UTC, en
  `lectura-publica/`: revisión **`88d5a757-3481-f70e-dc7c-6272704a00b3`**
  (entrega `2026-11-05.2`), 25 plataformas, 22 ofertas (8/13/1), 30 filas en
  `public.plataformas` (25 en el radar y 5 descartadas). Según el coordinador,
  la lectura repetida a las 15:21 UTC sigue en la misma revisión.
- `preparar-entrega.mjs` lo comprueba antes de cambiar nada:
  - la `2026-11-05.2` local da exactamente la revisión publicada y su huella
    `88d5a7573481f70edc7c6272704a00b3963248fcf32943caba65a10b86f789a8`, y su
    `revision.json` dice lo mismo (vigente hasta el 12/11);
  - el catálogo sincronizado de la web (`rwadar-site/assets/catalogo-publico-20261022.js`)
    es esa revisión (25/22);
  - lo leído hoy coincide con la base local: documentación, fuentes, colección,
    fecha, estado y avisos de las 22 ofertas; la verificación de las 25
    plataformas; y las filas de `public.plataformas`.

## 2. Revisión, huella, SHA-256 y vigencia

| Qué | Valor |
|---|---|
| Etiqueta | `2026-11-10` |
| Revisión nueva | **`dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656`** |
| Huella (contenido) | `dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f` |
| SHA-256 de `aplicar-y-aprobar.sql` | **`60feef2cf10d648d01e9b7acef1811f2416522eaab419194a1b411d9bd05383a`** |
| SHA-256 de `catalogo.sql` | `b4c2bb7e65bcc25dc705e2c64d0938a2d09e8efb7855deb6ad5153f522567379` |
| SHA-256 de `revision.json` | `2ddb1fef55d290684bef4ea6b1d9b2530a12fa71a14c938043e0431dad773a68` |
| Fichas | `verificadaEl` 10/11/2026 y 7 días: **último día vigente el 17/11/2026**; caduca el 18/11 |
| Radar | `verificadoEl` 10/11/2026, 69 fuentes (69/69 en `radar-contraste-2026-11-10.json`) |

Una edición posterior del SQL invalida esta revisión y sus pruebas hasta
repetirlas.

## 3. Qué cambia (antes → ahora)

**En todas:** fecha de verificación 05/11 → 10/11, 7 días; cada aviso publicado
se comprobó hoy y pasa a `verificadaEl` 10/11; los tres datos de la tarjeta
(«Mínimo de inversión», «Acceso desde España», «Salida»/«Reembolso») se
conservan con consulta del 10/11 salvo los que cambian abajo. Los estados de
revisión no cambian.

**Radar.** Ningún texto ni dirección cambia. Las 69 fuentes, consultadas el
10/11 (tres leídas a mano: las dos de REGAFI por su API pública y la lista de la
OCC con curl). La comprobación de `spiko-access` pasa de «ORIAS» a «redeem fund
shares» (ya estaba en `data/comprobaciones-fuentes.json`).

### Spiko
| Ficha | Antes | Ahora |
|---|---|---|
| Letras del Tesoro Euro | 2,39 % (VL del 04/11) | **2,44 %** (VL del 09/11, consulta y recálculo del 10/11: 1,060378 € → 1,062624 €) |
| Letras del Tesoro Dólar | 3,99 % en USD | **4,09 %** en USD (1,098694 $ → 1,102439 $) |
| Spiko Euro | 2,84 % (VL del 04/11) | 2,84 % (VL del 09/11) |

En las tres: rentabilidad, literal, métrica y la referencia de la ficha.

- **Dólar**, aviso: «…superan el 10 % del patrimonio.» → «…superan el 10 % del
  patrimonio, aunque la web de Spiko diga que no hay límite de importe.»
- **Spiko Euro**:
  - sale el aviso «El enlace de la web de Spiko para “Verificar la
    autorización” lleva a la base pública de la AMF (GECO), pero allí este fondo
    todavía no tiene ficha publicada…» (ya no es cierto);
  - métrica «Supervisor»: «…n.º SCV20260075, aún sin ficha pública en su base
    GECO…» → «…n.º SCV20260075, autorizado el 17/02/2026 (ficha en su base
    GECO, aún sin clases de acciones ni valor liquidativo)…»;
  - descripción y referencia «Aprobación del compartimento»: «autorizado por la
    AMF con el n.º SCV20260075 (así figura en un certificado…)» → «autorizado
    por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y
    certificado de la AMF del 23/02/2026)», con fuente
    `https://geco.amf-france.org/produit-d-epargne/c124199` (nueva en la ficha);
  - «Acceso desde España» y el aviso de que ningún registro confirma su venta
    en España, iguales.

### Robinhood · Kraken · Prosegur Digital Gold
Solo las fechas. El primer aviso de Kraken se queda.

### mTBILL
Métrica «Valor por token · 04/11/2026: 1,0773 USD» → «Valor por token ·
09/11/2026: **1,0776 USD** (oráculo del emisor)». Sigue en «fuentes en
conflicto». Ningún texto habla de la lista blanca (el script lo comprueba).

### Aktionariat, Boss Info y Switzerlend
- **Aktionariat**: «Precio del emisor · 10/11/2026: 7,25 CHF por acción
  (fijo)», «Supervisor (… FINMA (10/11/2026))» y el aviso de vendedores con
  «el 10/11/2026».
- **Boss Info**:
  - resumen y descripción: «El emisor vende a 8,50 por acción, pero la última
    operación fue en el mercado entre accionistas a 6,70 el 28/09/2026.» → «El
    emisor vende a 8,50 CHF, pero nadie le compra desde el 29/06/2026; la última
    operación fue entre accionistas, 1 acción a 8,40 ZCHF el 05/11/2026.»;
  - salen las referencias «Último cruce publicado» (6,70), «Última operación
    publicada · 22/10/2026» y «Último cruce secundario · 22/10/2026»; entra
    «Última operación · 10/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)»;
  - aviso: «El precio del emisor está por encima de la mejor oferta de venta
    entre accionistas.» → «… (venta más barata 8,40 ZCHF el 10/11/2026).»;
  - mínimo «… (unos 17 ZCHF el 10/11)» y «Supervisor» con fecha 10/11.
- **Switzerlend**: «el 10/11/2026» en los avisos de la recompra (0,03 ZCHF) y
  de vendedores (67,00 ZCHF), mínimo «1 acción (68,01 CHF el 10/11)» y
  «Supervisor» con fecha 10/11.

### Brickwise (11 de reventa)
Mínimo «Desde X € la participación en reventa (10/11)». Las tres referencias del
libro de órdenes pasan a «· 10/11/2026» con la lectura de hoy (API, idéntica a
las 09:01 y a las 09:17 UTC). Acceso, salida, comisión y avisos, iguales.

| Ficha | Mínimo (€) | En venta | Mejor compra (€) |
|---|---|---|---|
| Plüddemanngasse 101 · Graz | 75 → **75** | 335 → 335 | 20 → 20 |
| Sonnleithnergasse 2 · Viena | 75 → **75** | 97 → 97 | 65 → 65 |
| Local de estanco · Klagenfurt | 95 → **95** | 302 → 302 | 15 → 15 |
| Stallhofstraße 28 · Gratwein | 69,90 → **68,80** | 313 → 317 | 30 → 30 |
| Schwarzer Weg 18 · Graz | 66,67 → **65** | 305 → 300 | 35 → 35 |
| Drautalresidenz · Paternion | 70 → **70** | 150 → 150 | 54 → **60** |
| Randhartingergasse 9 · Viena | 78 → **78** | 184 → 189 | 40,50 → **46** |
| Hinterstoder 50 | 77 → **75** | 258 → 265 | 65 → **20** |
| Pottendorfer Straße 62 | 74 → **74** | 107 → 107 | 19 → 19 |
| Fotovoltaica GreenPoint | 100 → **100** | 351 → 351 | 89 → **84** |
| Fotovoltaica Cohotel | 110 → **110** | 65 → 65 | 3 → 3 |

### Hausera · próximas ofertas
Alicante 2 se cubrió en la preventa; el seguimiento pasa a **Alicante 3**.
- Resumen: «El 10/11/2026 Alicante 2 ya figuraba como financiada; la siguiente,
  Alicante 3 (14 viviendas en Orihuela Costa), abre la preventa el 18/11 y la
  suscripción el 25/11/2026.»
- Métricas: «Próxima operación: Alicante 3 · preventa desde el 18/11/2026,
  suscripción del 25/11/2026 al 30/06/2027», «Emisor: HAUSERA PROPERTY MANAGER
  SPV 11, S.A (documento de emisión de Alicante 3)» (nueva), «Supervisor: Hausera
  no está registrada en la CNMV; emisión sin folleto, pendiente de inscribir por
  Ursus-3 Capital A.V. (CNMV n.º 251)» y «Comisiones: Ninguna para el
  suscriptor; Hausera cobra con la plusvalía que supere el tope del inversor»
  (sustituye a «Coste de Hausera: Sin comisión por invertir (FAQ)»).
- Tarjeta:
  - mínimo: «100 € según la FAQ de Hausera (05/11); las condiciones de
    Alicante 2…» → «Desde 100 € en Alicante 3, según su documento de emisión
    (10/11); la preventa abre el 18/11.»;
  - acceso (nuevo): «Emisión española para particulares que pasen el test de
    idoneidad del emisor; Hausera no está registrada en la CNMV.»;
  - salida (nueva, con la corrección obligatoria del revisor): «Cobras cuando se
    venden las viviendas (previsto en 20 meses, sin fecha cierta); sin mercado
    secundario garantizado.»
- Avisos: los seis del expediente. El de la reserva del 05/11 se sustituye por
  «Si firmas el acuerdo de reserva, transfieres el dinero antes de que la
  emisión esté inscrita…». Entran «El documento de emisión no es un folleto y
  la CNMV no lo ha revisado. El 10/11/2026 Alicante 3 aún no estaba inscrita…»
  y «Las operaciones pueden cubrirse en la preventa: Alicante 2 ya figuraba como
  financiada el 10/11/2026…».
- Referencias: salen las tres de rentabilidad de octubre (eran de Alicante 1);
  «Historial publicado · 10/11/2026: 42 operaciones, 24 terminadas, 128 M€
  financiados» (cifras del promotor).
- Fuentes de la oferta: oportunidades, ficha de Alicante 3, documento de
  emisión, términos y ERIR de la CNMV.
- **No se publica** el mínimo de emisión de Alicante 3 (conflicto 50 % / 70 %);
  el script comprueba que no aparece ninguno de los dos.

**Ojo con lo que ve el visitante.** La vista pública enmascara el resumen y las
métricas de las 15 fichas que no están «actual» (mTBILL, las 13 de reventa y
Hausera): enseña «Condiciones/Cifras pendientes de nueva revisión», igual que
hoy. Sus cambios se ven en la descripción, los avisos y los tres datos de la
tarjeta. Los datos completos quedan en `rwadar_catalogo.ofertas`.

`contraste-2026-11-10.json` lista los 95 cambios uno a uno.

## 4. El SQL

`aplicar-y-aprobar.sql` (416.530 bytes) lleva **288 sentencias en una sola
transacción** `begin isolation level serializable; … commit;`:

| Bloque | Qué hace |
|---|---|
| `do $guarda$` (solo lee) | Exige que lo publicado sea la `88d5a757` (o ya la nueva), con su huella y aprobada; que el catálogo no esté retirado; que no sea antes del 10/11 ni después del **17/11**; y que la revisión nueva no exista con otra huella. |
| 284 `insert … on conflict do nothing` | Solo en `rwadar_catalogo`: 1 en `revisiones`, 25 en `plataformas`, 69 en `fuentes`, 107 en `plataforma_fuentes`, 25 en `alertas`, 35 en `alerta_fuentes` y 22 en `ofertas`. Todas de la revisión nueva. |
| `do $aprobar$` | Comprueba 25 plataformas y 22 ofertas (8/13/1) y aprueba la revisión (solo `update rwadar_catalogo.revisiones`). Si no queda publicable o publicada, deshace todo. |

Sin DDL, borrados, permisos, Auth ni funciones. Nada en `public.*`.

## 5. Pruebas (salida real)

1. **`preparar-entrega.mjs`, dos veces** → las 8 salidas tienen el mismo SHA-256
   las dos veces (`radar-canonico-26.json` `451941b4…`,
   `escaparate-publicacion.json` `424be5af…`, `documentacion-ofertas.json`
   `633ed15f…`, `manifiesto-catalogo.json` `c2c51919…`,
   `contraste-2026-11-10.json` `d642cc95…`, `catalogo.sql` `b4c2bb7e…`,
   `aplicar-y-aprobar.sql` `60feef2c…`, `revision.json` `2ddb1fef…`). Salida:
   `{"revisionId":"dfdc4c85-…","sha256":"60feef2c…","plataformas":25,"fuentesRadar":69,"ofertas":22,"colecciones":{"principales":8,"secundario":13,"en_camino":1},"cambios":95}`.
2. **`comprobar-entrega.mjs --exportar=DIR`** (PGlite, cadena de producción
   hasta la `2026-11-05.2`) → `"resultado": "correcto"`, 19 comprobaciones y 6
   casos de fallo (`pruebas-locales.json`):
   - antes de aplicar, PGlite enseña lo mismo que la lectura pública de hoy;
   - idempotente (tablas y vistas iguales tras aplicarla dos veces);
   - `public.plataformas`, `public.fuentes`, cambios de estado, avisos y
     emisiones intactos; las 14 revisiones anteriores, tal cual;
   - publicada la `dfdc4c85` con 25/22 (8/13/1), fechadas el 10/11;
   - los 95 cambios del contraste están en lo que se lee después, y lo de antes
     ya no; Robinhood, Kraken y Prosegur, iguales salvo las fechas;
   - vigencia: el lector de la web lo acepta el 10/11 y el 17/11 y lo da por
     caducado el 18/11; el de la app acepta 25/22 con 1 en camino;
   - tarjetas (`resumenOferta`): cambian 14 (Brickwise, Boss Info,
     Switzerlend y Hausera); Hausera enseña «Desde 100 € en Alicante 3…» ·
     «Sin comprobar si se puede contratar desde España» · «Salida: Cobras cuando
     se venden las viviendas…»;
   - sincronizador real: 25/22/5, CSV de 30 filas, la lista cerrada de fichas
     de siempre (52 páginas) y la ficha de Hausera habla de Alicante 3;
   - fallan sin dejar nada: otra publicada (`cede1f27`), otra huella, catálogo
     retirado, destino con otra huella, aplicada después del último día
     («Lote caducado: sus fichas valían hasta el 17/11/2026») y una plataforma
     que falta («Catálogo incompleto»).
3. **`despues-de-aplicar.mjs` antes de sincronizar** (carpeta de trabajo) → se
   niega: «el catálogo sincronizado no es la revisión dfdc4c85-…: aplica antes
   el SQL y ejecuta node rwadar-app/sincronizar.js»; `transparencia.json` igual.
4. **Ensayo «después de aplicar»** en una copia aparte (`ensayo-despues.json`):
   - `sincronizar.js` con el REST simulado → «25 plataformas verificadas, 5
     descartadas y 22 ofertas clasificadas. rwadar.csv regenerado: 30 filas.»;
   - `despues-de-aplicar.mjs` → «Comprobaciones de transparencia al 10/11: 41 de
     44»; repetido → «Nada que cambiar: ya estaba hecho.» (mismo SHA-256);
   - `volcar-seed.js` → «25 en el radar, 5 descartadas, 13 fuentes», sin
     diferencias;
   - `transparencia.mjs` → «22 ofertas con transparencia»; `rwadar-fichas.js`
     → «Archivos actualizados: 55»;
   - `npm test`: la primera vez falla 1 prueba de la app
     (`ofertas-presentacion.test.cjs`, «sin lectura en línea de la revisión
     dfdc4c85…»: exige la lectura pública de la revisión nueva). Con esa
     lectura simulada en `lectura-despues-de-aplicar/` (solo en la copia):
     **exit 0 en 3 min 02 s** (base de datos 28 scripts «0 fallidas» y 30 SQL,
     web 642, fichas y RSS 70, precarga 39, móvil 491 + 2 omitidas, acceso 237,
     «fichas.json: 22 fichas (22 con foto), catálogo 2026-11-10-v2»,
     «Transparencia al día: 22 ofertas», «Diferencias: 0»).

## 6. Lo que no se aplicó tal cual (y por qué)

1. **Hausera, transparencia «documentoEspana»: no se re-fecha.** La regla de
   DECISIONES (fecha 10/11 donde el expediente volvió a consultar la fuente)
   pondría fecha de hoy a un motivo que ya no es cierto («Alicante 2 no tiene
   documento de emisión público: su ficha pide iniciar sesión»). Se queda con
   la del 05/11. El criterio (folleto o KID) sigue sin cumplirse.
2. **Boss Info, aviso de vendedores.** DECISIONES dice «… (venta más barata
   8,40 ZCHF el 10/11/2026)». Se leyó «…» como el texto publicado: queda «El
   precio del emisor está por encima de la mejor oferta de venta entre
   accionistas (venta más barata 8,40 ZCHF el 10/11/2026).» No se usa la
   redacción de Switzerlend que proponía el expediente. Tampoco entra su aviso
   «Nadie ha comprado al emisor desde el 29/06/2026»: no está en DECISIONES (el
   dato va en el resumen).
3. **Hausera, «Supervisor»:** el expediente escribe «CNMV nº 251»; se publica
   «CNMV n.º 251», como DECISIONES y el resto del catálogo.
4. **Hausera, característica «Emisor» de la ficha:** decía «(para Alicante 2, no
   publicada)», que contradice la métrica «Emisor» decidida. Pasa a «Una
   sociedad por operación, identificada en su documento de emisión; la de
   Alicante 3 es HAUSERA PROPERTY MANAGER SPV 11, S.A» (texto del expediente).
   Es lo único fuera de la letra de DECISIONES; **confirmarlo en la revisión**.
5. **Spiko Dólar, aviso:** «se añade al final» se hizo antes del punto final.
6. **Notas de los revisores que no están en DECISIONES:** no entran. Son el KID
   en español de Robinhood en las fuentes, el mínimo en cripto de Aktionariat, la
   mejor compra en la salida de Boss Info y Aktionariat, y el «Desistimiento» de
   Brickwise (se queda con su fecha del 05/11).

## 7. Pendiente

- Revisión independiente de esta entrega (`REVISION-ENTREGA.md`).
- **Switzerlend, mínimo corto de la tarjeta** (`transparencia.json`): sigue
  «1 acción (68,01 CHF, 05/11)». El precio es el mismo hoy, pero DECISIONES solo
  pide los mínimos cortos de Brickwise y Hausera. Decidir si pasa a «(…, 10/11)».
- **Hausera, motivo de «documentoEspana»** (apartado 6.1): decidir un texto
  nuevo (por ejemplo, que el documento de emisión de Alicante 3 es público pero
  no es un folleto ni lo revisa la CNMV).
- Datos personales en copias de los grupos: correcciones obligatorias de los
  revisores de spiko, acciones-oro-tesoro, suiza y brickwise (las copias del
  05/11 ya en Git incluidas). Lo hace el coordinador antes del commit.
- Vigilar Hausera el 18/11 (preventa) y el 25/11 (suscripción), y el registro
  ERIR de Ursus-3.
- Tras aplicar, guardar la lectura pública en `lectura-despues-de-aplicar/`
  **antes** de `npm test`: sin ella falla `ofertas-presentacion.test.cjs`.

## 8. Pasos para aplicarla (ciclo autorizado por la orden de Víctor)

1. Pasar la revisión independiente y confirmar que el SHA-256 de
   `aplicar-y-aprobar.sql` sigue siendo `60feef2c…383a`.
2. Antes del **17/11/2026**, volver a leer como visitante: tiene que seguir
   publicada la `88d5a757-3481-f70e-dc7c-6272704a00b3`. Si no, parar.
3. Aplicar exactamente `rwadar-app/data/importaciones/catalogo-2026-11-10-v2/aplicar-y-aprobar.sql`
   con el acceso autorizado (una transacción; si falla, no seguir).
4. Leer como visitante las vistas v2 y guardarlo en
   `lectura-despues-de-aplicar/`: revisión `dfdc4c85-…`, 25/22 (8/13/1),
   `verificada_el` 10/11 y los cambios de §3.
5. `node rwadar-app/sincronizar.js`, luego
   `node rwadar-app/data/verificaciones/2026-11-10-v2/despues-de-aplicar.mjs`,
   `node rwadar-app/volcar-seed.js` (sin diferencias),
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
6. Publicar la web y, si cambia lo que lleva la app, la OTA.

## Archivos

- `preparar-entrega.mjs`, `comprobar-entrega.mjs`, `despues-de-aplicar.mjs`,
  `ensayo-rest-simulado.cjs` (copia del de la 2026-11-05).
- Datos: `radar-canonico-26.json`, `escaparate-publicacion.json`,
  `documentacion-ofertas.json`, `manifiesto-catalogo.json`,
  `contraste-2026-11-10.json`.
- SQL: `rwadar-app/data/importaciones/catalogo-2026-11-10-v2/{catalogo.sql,aplicar-y-aprobar.sql,revision.json}`.
- Pruebas: `pruebas-locales.json` (PGlite) y `ensayo-despues.json` (copia aparte).

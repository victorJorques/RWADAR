# Entrega del catálogo 2026-11-05 · investigación del día

Preparada el 05/11/2026 por Claude. **Nada aplicado en Supabase, nada publicado,
sin OTA, ningún flujo lanzado, sin push.** Estado: **preparada, revisada de forma
independiente (`REVISION-ENTREGA.md`, «aprobado con cambios») y con sus
correcciones aplicadas**: las dos obligatorias (C1 y C2) y las recomendadas R1 a
R7; R8 no, porque amplía el alcance (§7). Probada otra vez en local (PGlite) y
con un ensayo de «después de aplicar» en una copia aparte.

- **Rama `claude/catalogo-2026-11-05-limpia`** (C2): creada desde `origin/main`
  con `git merge --squash claude/catalogo-2026-11-05` y **un solo commit**. El
  historial de `claude/catalogo-2026-11-05` (de `301c690` a `91191f5`, ya en
  `origin`) lleva copias sin recortar con nombres de personas físicas y no debe
  llegar a `main`: el PR se abre desde la rama nueva.
- **El SQL cambió** con R1, R2, R3, R5, R6 y R7: revisión, huella y SHA-256
  nuevos (§2). El revisor aprobó el `294db508…3778`. El nuevo solo difiere en lo
  que lista «Correcciones aplicadas» de `REVISION-ENTREGA.md` (la guarda y 18 de
  las 24 fichas), pero **hay que confirmarlo antes de aplicar**.

Lo que entra es la lista cerrada de `DECISIONES-COORDINADOR.md` (solo lo que el
revisor de cada grupo dejó confirmado, con sus correcciones). Los textos, fuentes
y fechas salen de `expedientes/` y de `revision-independiente/`.

## 1. Partida

- **Lectura como visitante** (REST de Supabase con la clave publicable, solo GET)
  el 05/11/2026 de 07:55:58 a 07:56:01 UTC, en `lectura-publica/`: publicada la
  **`723968ce-00f7-7f42-b3e3-6c7f401b8f89`** (entrega 2026-11-04.2), 25
  plataformas, 24 ofertas (8/13/3) y 30 filas en `public.plataformas` (25 en el
  radar y 5 descartadas).
- `preparar-entrega.mjs` comprueba que la 2026-11-04.2 local da exactamente esa
  revisión y su huella (`723968ce00f7…5337585`), que el catálogo sincronizado de la
  web es esa misma revisión y que la lectura de hoy coincide con la base local
  (documentación, fuentes y colección de las 24 ofertas, verificación de las 25
  plataformas y las 30 filas de `public.plataformas`).

## 2. Revisión, SHA y vigencia

- **Etiqueta `2026-11-05`.** Revisión nueva **`cede1f27-b5eb-36d3-e223-eb4155df2572`**
  (huella `cede1f27b5eb36d3e223eb4155df257228fc98e517776cefa0693a0657088823`).
  Sustituye a la `8fe33ec4…`, que es la que vio el revisor, antes de sus
  correcciones.
- **SHA-256 de `rwadar-app/data/importaciones/catalogo-2026-11-05-v2/aplicar-y-aprobar.sql`:
  `65c71cf0388c91dafcc9f7bcbfd646d98bb83051b74c27fa608d1bb6dd60cd80`.**
  `catalogo.sql`: `620ef1fe…a4fc`; `revision.json`: `5f05192b…aeed`.
  `preparar-entrega.mjs` lo reproduce byte a byte (ejecutado dos veces: los ocho
  archivos que escribe y su salida, idénticos). Antes de las correcciones:
  `294db508…3778`.
- Las 24 fichas, `verificadaEl` 05/11 y 7 días: valen hasta el **12/11** y el 13/11
  caducan (la web y la app ocultan las cifras, sin vaciar el catálogo). **La guarda
  del SQL no deja aplicarlo después del 12/11** (R7).
- Mismas 24 ofertas, en las mismas colecciones (8/13/3) y con los mismos estados de
  revisión; mismas 25 plataformas. Sin altas ni retiradas. **Hoy no se toca
  `public.plataformas` ni `public.fuentes`.**

## 3. Qué cambia (antes → ahora)

**Radar** (67/67 fuentes comprobadas hoy, `radar-contraste-2026-11-05.json`; las dos
del REGAFI leídas por su API porque la página daba 502):

| Qué | Antes | Ahora |
|---|---|---|
| Fecha del radar y consulta de las 67 fuentes | 03/11 | 05/11 |
| Fuente `paxg-web` de Pax Gold | `https://paxos.com/paxgold` («Pax Gold») | `https://www.paxg.com/` («Pax Gold (web oficial de PAXG)») |
| Pax Gold, acceso | «La ficha oficial de Paxos indica que PAXG no está disponible actualmente en la UE…» | «La web oficial de PAXG indica que ahora no está disponible para residentes en la Unión Europea…» |
| Pax Gold, estado | «Paxos sigue publicando la ficha de PAXG, su custodia y las opciones de canje.» | «Paxos sigue publicando la web de PAXG, su custodia y que cada token se puede canjear por oro físico.» |

**Todas las fichas:** `verificadaEl` 03/11 → 05/11 y 7 días; cada aviso, con fecha
05/11; los datos de tarjeta que no cambian, con consulta del 05/11 («Comprobado de
nuevo en la fuente el 05/11/2026»).

| Ficha | Antes | Ahora |
|---|---|---|
| Spiko Letras del Tesoro Euro | 2,34 % (VL del 02/11) | **2,39 %** (VL del 04/11, consulta del 05/11); fuera cinco cifras viejas de la ficha (NAV 1,0597 € del 28/09 dos veces, 1,0613 € y 467,94 M€ del 22/10, 444,52 M€ del 30/10) |
| Spiko Letras del Tesoro Dólar | 3,95 % en USD | **3,99 %** en USD (VL del 04/11); la ficha decía que la cifra en euros de GECO era «la clase EUR no cubierta»: es la clase en dólares pasada a euros (corregido) |
| Spiko Euro (Smart Cash) | 2,84 % (VL del 02/11); reembolso de 172 caracteres | 2,84 % (VL del 04/11); reembolso «Diario, con orden antes de las 15:00 (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo)» (ver §6; R6) |
| Robinhood | métrica «Salida»: «Cierre con la contraparte en días de mercado de EE. UU.; puede suspenderse»; tarjeta: acceso «…está inscrita en la CNMV para operar en España (libre prestación, n.º 5299).» (131) y salida «Cierras la posición con Robinhood Europe (24/5 según su web; el horario ampliado no siempre está disponible); el cierre puede suspenderse» (137) | métrica «Vendes a Robinhood en la app, 24/5; puede suspender el cierre»; tarjeta acortada (R5): «Disponible para residentes en España: Robinhood Europe está inscrita en la CNMV en libre prestación (n.º 5299).» (111) y «Cierras con Robinhood Europe (24/5 según su web; horario ampliado no siempre disponible); el cierre puede suspenderse» (117) |
| Kraken xStocks | acceso «…para sus clientes ubicados en la UE…» (121) | «Según Kraken UE, disponible para sus clientes en la UE que superen su evaluación o sean inversores profesionales» (112; R5) |
| mTBILL | «Valor por token · 02/11/2026: 1,0769 USD» | «Valor por token · 04/11/2026: 1,0773 USD (oráculo del emisor)»; referencia nueva «Países de oferta según la web de Midas · consulta 05/11/2026» (España entre las 14 del aviso v1.0.2), con fuente **`https://midas.app/`** y el archivo de código que se leyó (`main-C67ipI_t.js`) como localizador en el alcance (R2). Sigue en «fuentes en conflicto» |
| Aktionariat | comisión entre accionistas «Fee (0%)»; supervisor «…registro de FINMA (03/11/2026)»; vendedores «…el 03/11/2026»; referencia «Salida · consulta 01/11/2026: Bid/Ask 6.00 / 6.20 · Spread 3.23% · Fee (0%)» | 0 % quien compra y **1,9 % quien vende** (aviso nuevo: «Si vendes a otro accionista pagas una comisión del 1,9 %.»); «Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (05/11/2026)»; vendedores «6,20 ZCHF frente a 7,25 CHF el 05/11/2026»; precio del emisor fechado el 05/11; la referencia del 01/11 queda «Bid/Ask 6.00 / 6.20 · Spread 3.23%» y su alcance aclara que aquel 0 % era la comisión de la compra (R3) |
| Boss Info | España: aviso «Acceso desde España no confirmado…»; mínimo «100 CHF por transferencia bancaria» (con «en cripto, desde 1 acción» en la ficha); alcance de «Salida · consulta 01/11/2026»: «Comisión mostrada 0 %» | dato de tarjeta nuevo «Sí para comprar al emisor, según las condiciones del portal: admite Suiza y EEE, con tope total de 100.000 € en el EEE» y aviso con la fuente (§9.1, versión del 30/10/2026); mínimo «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 05/11)»; avisos nuevos de la comisión del 1,9 % y del XCHF/ZCHF; supervisor como Aktionariat; aquel alcance dice ahora «La comisión del 0 % que se veía ese día era la de la compra; al vender, el 05/11/2026 se cobraba un 1,9 %» (R3) |
| Switzerlend | España: «el portal no publica países admitidos»; recompra «…el 03/11/2026… casi sin fondos»; mínimo «1 acción (68,01 CHF el 03/11)» | España como Boss Info; recompra «…el acuerdo firmado no le obliga y el 05/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF)»; avisos nuevos de la comisión y de «venta más barata 67,00 ZCHF el 05/11/2026»; mínimo «1 acción (68,01 CHF el 05/11)»; supervisor con fecha 05/11 |
| Brickwise, 11 de reventa | mínimo «1 participación desde X € en reventa (03/11)»; España «Sin confirmar: Brickwise abre cuenta… pero no confirma…» (134 caracteres) | mínimo **«Desde X € la participación en reventa (05/11)»**: Plüddemanngasse 80 → 75, Schwarzer Weg 69,90 → 66,67, Hinterstoder 72 → 77, Pottendorfer 78 → 74; las otras siete, el mismo precio. España «Sin confirmar: cuenta para residentes del EEE (España incluida); no consta que esta emisión se distribuya en España.» Cuatro referencias nuevas en cada ficha: venta más barata, participaciones en venta («Participaciones de esta emisión a la venta entre inversores ese día (suma de las órdenes abiertas en la app). Cambia a diario.», R1), mejor oferta de compra (Schwarzer Weg 35,00 € y Pottendorfer 19,00 €, como corrigió el revisor) y «no hay desistimiento en reventa». En la tarjeta de la web y de la app (texto corto, tras aplicar): **«Desde X € la participación (05/11)»** (C1) |
| Brickwise, avisos de alquiler | «La base de alquiler de la API cita un contrato ya vencido» (y Sonnleithnergasse «vence el 2026-11-29») | Plüddemanngasse «terminó el 31/07/2024», Schwarzer Weg «el 30/08/2023», Pottendorfer «el 30/11/2025», Sonnleithnergasse «la API fija el fin el 29/11/2026, pero su texto dice que terminó el 30/09/2023 por rescisión…» |
| Pottendorfer, salida | «Primera cancelación posible a los 15 años…» | «Primera cancelación a los 15 años de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)» |
| BILLA (próxima) | umbral «(API 03/11/2026)»; aviso «…el 03/11/2026… 82 participaciones (1,64 %)» | «(API 05/11/2026)»; «…el 05/11/2026… 82 participaciones suscritas (8.200 €, el 1,64 % del mínimo)»; España como las de Brickwise |
| Casa de Outeiro (próxima) | «Recaudado · 03/11/2026»; aviso «…el 03/11/2026 no mostraba días restantes…»; salida «Si no se llega a 2 M€…» (121) | «Recaudado · 05/11/2026: 1.121.000 € de un mínimo de 2.000.000 €»; «…el 05/11/2026 seguía sin días restantes ni ampliación…»; salida «Si no llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030» (118; R5) |
| Hausera · próximas | «El 02/11/2026 anunciaba Alicante 2 con preventa desde el 04/11…»; aviso «La preventa es una reserva sin compromiso…»; sin mínimo en la tarjeta | «El 05/11/2026 Alicante 2 estaba en preventa desde el 04/11 y anunciaba la oferta pública para el 11/11/2026…»; aviso «Apuntarte a la preventa no te obliga, pero si firmas el acuerdo de reserva debes transferir el dinero en el plazo fijado…»; mínimo «100 € según la FAQ de Hausera (05/11); las condiciones de Alicante 2 están en su documento de emisión, aún no público.» |

Prosegur Digital Gold: sin cambios (solo fechas). Ninguna candidata se admite. El
detalle de cada cambio (145 anotaciones, con el texto exacto de antes y de ahora)
está en `contraste-2026-11-05.json`. Ningún dato de tarjeta pasa ya de 120
caracteres (el más largo, 119).

**Qué verá el inversor** (resumenOferta, la misma función de la web y la app, con
el texto largo de la ficha; detalle de las 24 en `pruebas-locales.json`,
«tarjetas»): cambian 17. Brickwise «Desde 75 € la participación en reventa
(05/11)» y España «Sin comprobar»; Boss Info y Switzerlend pasan de «Sin
comprobar» a «Disponible desde España según la fuente»; Hausera pasa de «No
documentado en euros» a su mínimo de 100 €; Spiko Euro, el reembolso nuevo;
Robinhood y Casa de Outeiro, la salida acortada. Ninguna con citas en otro idioma
ni con «por participación» en el mínimo. **En la tarjeta del catálogo** (texto
corto de `transparencia.json`, que se pone al día tras aplicar) las 11 de reventa
de Brickwise dicen «Desde X € la participación (05/11)» (C1; §5).

## 4. El SQL

Una transacción serializable:

1. **Guarda:** la publicada es exactamente la `723968ce` (o ya la nueva), con su
   huella y aprobada; catálogo no retirado; fecha del servidor no anterior al 05/11
   **ni posterior al 12/11** («Lote caducado», R7); la revisión nueva no existe con
   otra huella ni retirada.
2. El lote nuevo en `rwadar_catalogo` (1 revisión, 67 fuentes, 25 plataformas, 105
   fuentes de campo, 25 alertas y 35 fuentes de alerta, 24 ofertas), todo con
   `on conflict do nothing`.
3. **Aprobación** solo si el lote está completo (25 / 24 / 8-13-3), es
   `revision_publicable_v2` y queda publicado.

Sin DDL, borrados, permisos, Auth ni funciones; nada en `public.*`.

## 5. Pruebas

Repetidas el 05/11 entre las 09:33 y las 09:48 UTC, después de aplicar las
correcciones de la revisión independiente.

- **`preparar-entrega.mjs`, dos veces: mismo resultado byte a byte** (los ocho
  archivos y la salida; revisión `cede1f27…`, SHA `65c71cf0…cd80`, 145 cambios
  anotados). Falla si un texto «antes» no está tal cual, si un dato de tarjeta
  nuevo pasa de 120 caracteres (o cualquiera de 160), **si queda alguno de más de
  120** (R5), si parece una cita en otro idioma, si un mínimo lleva «por
  participación», si aparece una fuente técnica sin anotar (API, JSON y, desde
  hoy, **código `.js`**, R2) o si cambia algo que no está en la lista de cambios.
  Con los ids normalizados, el SQL nuevo solo difiere del `294db508…` en las tres
  líneas de la fecha tope y en las filas de 18 ofertas (las 11 de Brickwise, Spiko
  Euro, Robinhood, mTBILL, Aktionariat, Kraken, Boss Info y Casa de Outeiro).
- **`comprobar-entrega.mjs` (PGlite, sin red): correcto, 18 comprobaciones y 6
  casos de fallo que no dejan nada** (19 con `--exportar`). Cadena de producción:
  la instalación con el seed de antes de ARTEX y los 12 lotes del 22/10 a la
  2026-11-04.2. Antes de aplicar, PGlite enseña lo mismo que la lectura de hoy
  (con las tolerancias del 04/11: el uuid de cada plataforma, «publicadaEl» de las
  fuentes del radar y el orden de las fuentes). Después: publicada la `cede1f27`,
  mismas 24 fichas y 25 plataformas, 05/11 y 7 días; idempotente;
  `public.plataformas`, `public.fuentes`, cambios de estado, avisos y emisiones,
  intactos; el lector de la web lo acepta el 05/11 y el 12/11 y lo da por caducado
  el 13/11; Spiko 2,39 % / 3,99 % / 2,84 %; si ya estaba importada como borrador, la
  aprueba sin duplicar. Fallan sin dejar nada: otra publicada (la `cf79e4a4`), otra
  huella de la publicada, catálogo retirado, revisión destino con otra huella,
  **aplicada después del 12/11** («Lote caducado»: la misma guarda con el último
  día cambiado al 04/11, porque PGlite usa la fecha del sistema) y una plataforma
  que falta (catálogo incompleto).
- **Ensayo «después de aplicar»** en una copia aparte (`ensayo-despues.json`):
  `sincronizar.js` con lo que leería un visitante tras aplicar («25 plataformas
  verificadas, 5 descartadas y 24 ofertas»; `rwadar.csv` sin diferencias),
  `despues-de-aplicar.mjs` (y otra vez: «Nada que cambiar»; ahora comprueba el
  mínimo corto de las 11 de reventa contra el texto largo, R4, y con el texto
  antiguo falla sin escribir nada), `volcar-seed.js`
  (`02_seed.sql` sin diferencias), `rwadar-fichas.js` (57 archivos: las 54 fichas
  llevan la revisión y las fechas; ninguna nueva ni retirada), `transparencia.mjs`
  y **`npm test`: salida 0 en 2 min 12 s** (base de datos 27 scripts con 886 comprobaciones, 30
  SQL y mapa 11/11; web 593; pre-render «25 fichas, 5 descartadas y 24
  emisiones»; fichas 71; precarga 32; móvil 409 + 2 omitidas de 411; acceso 146;
  herramientas sin diferencias). En el navegador (servidor local y Chrome sin
  interfaz, a 1366×900 y a 390×844, con el mismo resultado), las 24 tarjetas
  enseñan lo esperado: por ejemplo **«Mínimo: Desde 66,67 € la participación
  (05/11) · España: Sin confirmar»** en Schwarzer Weg (C1), «Mínimo: 1 acción
  (68,01 CHF, 05/11) · España: Sí, según la fuente» en Switzerlend y «Mínimo: 100 €
  según la FAQ de Hausera» en Hausera; la ficha de Schwarzer Weg enseña el aviso
  nuevo del alquiler y las cuatro referencias nuevas, con la nota corregida de las
  participaciones en venta (R1); la de mTBILL enlaza su fuente nueva a
  `https://midas.app/` (R2).

## 6. Lo que no se aplicó como estaba escrito (y por qué)

- **Boss Info y Switzerlend, «Acceso desde España»:** se añade «admite» al texto de
  DECISIONES («…según las condiciones del portal: admite Suiza y EEE…»). Sin una de
  las palabras que reconoce el lector de la tarjeta (disponible, admite, permite,
  acceso), la tarjeta habría dicho «Sin comprobar si se puede contratar desde
  España», lo contrario de lo decidido. Mismo motivo que «la participación» en
  Brickwise.
- **Spiko Euro (Smart Cash), «Reembolso» de la tarjeta:** el publicado tenía 172
  caracteres, por encima del máximo duro de 160. Se usa lo que el revisor confirmó
  hoy, sin repetir «Reembolso» y con la redacción de la revisión de la entrega
  (R6, para no leer «Reembolso: Diario: …»): «Diario, con orden antes de las 15:00
  (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo)».
- **Correcciones de la revisión independiente** (`REVISION-ENTREGA.md`, sección
  «Correcciones aplicadas»): C1, C2 y R1 a R7, aplicadas. Decisiones propias: en
  R3, Aktionariat pierde «· Fee (0%)» del valor y lo aclara en el alcance, y Boss
  Info lo aclara en el alcance (su valor no lo llevaba); en R5, los cuatro textos
  se acortan sin cambiar el dato, la fuente ni su fecha, y pasan a «Redacción en
  castellano del dato comprobado en la fuente el 05/11/2026». R8 no se aplica:
  todo lo que lista amplía el alcance de hoy (§7).
- **Fechas que se ponen al día sin cambiar el dato** (no estaban escritas en
  DECISIONES, pero el dato se comprobó hoy): «Precio del emisor · 05/11/2026» de
  Aktionariat y el supervisor de Switzerlend («…registro de autorizados de FINMA
  (05/11/2026)…»), como los de Aktionariat y Boss Info.
- **Referencias nuevas de las 11 fichas de reventa de Brickwise:** además de la
  mejor oferta de compra que cita DECISIONES, las otras tres que proponen los
  expedientes (venta más barata, participaciones en venta, sin desistimiento en
  reventa). Las dos primeras citan las direcciones de la API de Brickwise que la
  entrega 2026-11-04 dejó anotadas como únicas fuentes de esos datos.
- `transparencia.json` (en `despues-de-aplicar.mjs`): además de lo pedido, el
  mínimo corto de Hausera («100 € según la FAQ de Hausera») y la salida corta de
  Pottendorfer («Primera cancelación a 15 años; reventa»), para que digan lo mismo
  que la tarjeta.

## 7. Pendiente

- **Confirmar el SQL nuevo antes de aplicarlo.** La revisión independiente aprobó
  el `294db508…3778`; las correcciones R1, R2, R3, R5, R6 y R7 lo cambian
  (`65c71cf0…cd80`). Basta con que alguien distinto de quien lo preparó compare el
  diff que describe «Correcciones aplicadas» en `REVISION-ENTREGA.md`.
- **C2, lo que falta:** subir la rama `claude/catalogo-2026-11-05-limpia` y abrir el
  PR desde ella (no desde `claude/catalogo-2026-11-05`); después, **con permiso de
  Víctor**, borrar la rama remota `claude/catalogo-2026-11-05`. Mientras exista,
  su historial (commits `301c690` a `91191f5`) conserva las copias con nombres.
- **R8, sin aplicar porque amplía el alcance de hoy:** la `web` de Pax Gold en
  `public.plataformas`, el texto de acceso de la plataforma Spiko en el radar, la
  ilustración de Hausera, las copias con nombres de `2026-11-01-v2` y
  `2026-11-03.3-v2`, y que el coordinador ratifique las tres referencias nuevas de
  Brickwise que DECISIONES no nombraba (venta más barata, participaciones en venta
  y desistimiento). Detalle de cada una abajo.
- **mTBILL, otra fuente `.js`:** la referencia antigua «Acceso desde España ·
  consulta 01/11/2026» y la lista de fuentes de la ficha siguen con
  `https://midas.app/assets/main-DOxid0Zj.js` (de una versión anterior de la web
  de Midas). La guarda nueva no la para porque ya estaba publicada. Conviene
  pasarla también a `https://midas.app/` en la próxima entrega.
- **PAX Gold en `public.plataformas`:** la columna `web` sigue en
  `https://paxos.com/paxgold` (está en `02_seed.sql`, línea 32; no está en
  `public.fuentes`). La lee lo que se publica: la vista
  `catalogo_plataformas_publicas_v2` («web»), y con ella `rwadar.csv`, el JSON-LD de
  `/plataformas/pax-gold` y su botón «Ir a la web de Pax Gold». Esa dirección
  redirige hoy a `paxos.com/assets/paxg`, que ya no dice si PAXG se vende en la UE.
  No se cambia hoy (DECISIONES): se puede pasar a `https://www.paxg.com/` en otra
  entrega que toque `public.plataformas`.
- **Spiko, texto de acceso de la plataforma** (radar): sigue diciendo «No hemos
  comprobado en la CNMV que el fondo se comercialice en España». El revisor pidió
  corregirlo (SICAV n.º 2380 con Aldana Capital, Spiko Finance n.º 5325, la CNMV no
  dice qué compartimentos están de alta). DECISIONES no cambia el radar hoy.
- **Hausera:** la ilustración sigue en «Alicante»; el lugar es Orihuela Costa (La
  Zenia). Hay que rehacer la imagen.
- **Datos personales:** recortados hoy, con «[nombre recortado]», los nombres de
  personas físicas de las copias de `grupos/espana-proximas/fuentes/` (ficha de
  datos y anexos de Casa de Outeiro, sus dos páginas y la portada de Hausera) y de
  la portada de Hausera del revisor; SHA-256 y bytes puestos al día en los dos
  inventarios. Quedan: las copias de `2026-11-01-v2` y `2026-11-03.3-v2` que ya están
  en `main`, y las respuestas crudas de hoy fuera de Git (`crudo/`, solo en disco).
- **`transparencia.json`:** 44 de las 48 comprobaciones pasan al 05/11. Cuatro
  conservan la fecha del 03/11 porque el expediente de hoy no volvió a leer esa
  fuente: el documento de Kraken (condiciones finales n.º 159), el KID en español
  de Robinhood, la búsqueda de Midas en BaFin y la portada del portal de Boss Info.
- mTBILL sigue sin datos de tarjeta con etiqueta fija (en «fuentes en conflicto» la
  tarjeta dice «Las fuentes no coinciden»). Casa de Outeiro y Hausera no tienen
  «Acceso desde España» en la tarjeta, y Hausera tampoco salida: los expedientes lo
  proponían, pero DECISIONES no lo incluye.
- La entrada de `docs/tareas/PARA-CODEX.md` y `docs/INTERNO.md` quedan para el cierre
  del ciclo.

## 8. Pasos para aplicarla (con la orden de Víctor)

1. Revisión independiente de esta entrega y del SQL: hecha («aprobado con
   cambios»), con sus correcciones aplicadas; falta confirmar el SQL nuevo
   (`65c71cf0…cd80`, §7).
2. Subir `claude/catalogo-2026-11-05-limpia` y unirla a `main` con un PR desde
   ella (CI). **No** abrir el PR desde `claude/catalogo-2026-11-05` ni unirla con
   un merge normal (C2).
3. Releer como visitante, con hora, que la publicada sigue siendo la `723968ce`.
4. «Aplicar catálogo» con `2026-11-05`, **como muy tarde el 12/11** (después, la
   guarda lo rechaza: «Lote caducado»).
5. Comprobar en línea: revisión `cede1f27…`, 25 plataformas, 24 ofertas (8/13/3),
   fechadas el 05/11, y las cifras de Spiko.
6. Sin esperar, desde la raíz:
   ```
   node rwadar-app/sincronizar.js
   node rwadar-app/data/verificaciones/2026-11-05-v2/despues-de-aplicar.mjs
   node rwadar-app/volcar-seed.js          # hoy no debería cambiar nada
   node rwadar-fichas.js
   node rwadar-editorial-source/ofertas/transparencia.mjs
   npm test
   ```
   `git status` debe enseñar lo de `ensayo-despues.json` (`archivosQueCambian`), y
   las 11 tarjetas de reventa de Brickwise, «Desde X € la participación (05/11)».
   Commit, sello y «Publicar web» (preview y producción). No hace falta OTA para los
   datos: la app lee el catálogo de Supabase.

## Archivos

- `preparar-entrega.mjs`: monta el lote y el SQL desde la 2026-11-04.2.
- `comprobar-entrega.mjs` y `pruebas-locales.json`: ensayo en PGlite y tarjetas.
- `despues-de-aplicar.mjs`: `transparencia.json` tras aplicar y sincronizar.
- `ensayo-despues.json` y `ensayo-rest-simulado.cjs`: el ensayo «después de
  aplicar» (solo en una copia aparte del repositorio).
- `contraste-2026-11-05.json` (cada cambio, antes y ahora), `manifiesto-catalogo.json`,
  `radar-canonico-26.json` (25 plataformas: el nombre lo fija el cargador),
  `escaparate-publicacion.json`, `documentacion-ofertas.json`.
- `rwadar-app/data/importaciones/catalogo-2026-11-05-v2/`: `catalogo.sql`,
  `aplicar-y-aprobar.sql` y `revision.json`.

# Entrega del catálogo 2026-11-21 · informe del montador

Montada el 21/11/2026 con el motor de la entrega y corregida el mismo día con
las tres revisiones independientes (§8)
(`.claude/skills/investigacion-catalogo/entrega/`). Lo propio de hoy está en
`decisiones.json`; el motor aplica solo eso y comprueba cada cambio. No se ha
tocado Supabase ni ningún servicio en línea, no se ha publicado nada y no hay
commits.

## 1. De dónde parte

- **Publicada:** entrega `2026-11-20.2`, revisión
  `94f7fd5d-f6e5-c28e-1c31-a6ea5a5f38d7`, huella
  `94f7fd5df6e5c28e1c31a6ea5a5f38d792b57febb4f1b695d925c2f7636905ba`.
- **Leída hoy como visitante** (`lectura-publica/`): 17:36:51–17:36:55 UTC,
  25 plataformas, 22 ofertas (8 / 13 / 1), todas verificadas el 20/11.
- El motor comprobó que la `2026-11-20.2` local da exactamente esa revisión y
  esa huella y que lo leído hoy es la base local.

## 2. Lo que sale

| | |
|---|---|
| Revisión nueva | `753b4cc9-3c01-e879-ba96-05dc3cf95b05` (§9) |
| Huella | `753b4cc93c01e879ba9605dc3cf95b05d6dd506a5679d58f41677766f3d145e3` |
| `aplicar-y-aprobar.sql` antes de §9 | `0486c6fd7104e93e1265f654d4870308b9b3abbf5e6dba0192bd26f8e8984d40` (revisión `508d0366…`, auditada conforme) |
| `aplicar-y-aprobar.sql` (SHA-256) | `1f892b7608789ce6410979b4158815c1c62ff4f112711430b47b68c73075e9bd` |
| `catalogo.sql` (SHA-256) | `554bae00ca319c05a9cd26296b932a203abf12480988205aece2fdc3ba56b39d` |
| `revision.json` (SHA-256) | `6f98903144ce84d6aca8f4661dfe45c99539a40d539ec631b43d3a725bfb87d1` |
| Vigencia | verificadas el 21/11/2026, 7 días: **último día el 28/11/2026**; la guarda del SQL no deja aplicarla después |
| Ofertas y plataformas | las mismas 22 (8 principales, 13 de reventa, 1 en camino) y 25; sin altas ni retiradas |
| Cambios | 425 en las 22 fichas, 413 con su prueba; 14 tarjetas cambian (solo el mínimo) |

Lo que vieron los revisores era la revisión `53747b1d-8b08-adda-5d0b-1f4875749a2d`
(`aplicar-y-aprobar.sql` `c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f`;
copia intacta en `<scratchpad>/sql-revisado-2026-11-21/`). Las correcciones
de §8 la cambian a la de arriba.

## 3. Qué cambia, ficha a ficha (antes → ahora)

El detalle completo, línea a línea, está en `DIFF-ENTREGA.md`. En corto:

**Lo que se repite en casi todas: «que no quede nada viejo».** Las referencias
de la ficha con consultas del 30/09, 22/10, 01/11, 02/11, 03/11 o 05/11 se
re-fechan al 21/11 (si hoy se volvió a leer la misma fuente) o se quitan (si
repiten otra o ya no se pueden comprobar). Después de la entrega solo quedan
**4 referencias viejas**, que el motor no puede tocar (ver §5).

### Spiko
- **Letras del Tesoro Euro:** rentabilidad igual, 2,45 % (la misma VL del
  viernes 20/11); el texto ya no dice «fechada el 22/11» y dice «consultado el
  21/11/2026». Riesgo KID: «1 de 7» → «1 de 7, sin contar los riesgos del
  registro en blockchain y de la cartera digital (el KID los deja fuera)».
  Fuera 5 referencias repetidas o viejas; 9 re-fechadas, entre ellas
  «Comisión de gestión», para que la fila «Costes» cite un dato de hoy.
  «Estado de la oferta» dice que la VL del 20/11 es la que publica Spiko en su
  API (no GECO).
- **Letras del Tesoro Dólar:** 4,00 % en USD, igual; consulta del 21/11.
  Riesgo KID con la misma aclaración. Se añade la CNMV (SICAV n.º 2380) a las
  fuentes de la oferta y de la ficha, con la referencia «Registro de la SICAV
  en España». Fuera «Mínimo de inversión · 01/11» y el patrimonio desfasado.
- **Spiko Euro (Smart Cash):** 2,84 %, igual; consulta del 21/11.
  «Supervisor»: «desde el 20/11/2026 el fondo no aparece en la base de la
  AMF». El acceso desde España se queda como está (decisión §6, opción a). Las
  7 referencias viejas, re-fechadas.

### Acciones, oro y letras
- **Kraken xStocks:** se queda todo lo publicado (el revisor rechazó lo de
  Reino Unido y la UE). Aviso de dividendos sin «en EE. UU.», y la referencia
  «Dividendos» igual. «Países de oferta» cuenta que ninguna de las 58
  condiciones finales desde el 15/10 incluye España. Fuera «consultada el
  03/11/2026» de las notas del mínimo, del acceso y de la salida; 4
  referencias re-fechadas.
- **mTBILL:** cifras iguales (ronda 498). Fuera las 8 referencias que
  dependían de la web de Midas (da 403) y 5 direcciones de Midas que ya nada
  cita. «Países de oferta pública · Condiciones Finales del 17/07/2026»
  conserva su nombre (el documento es del 17/07) con la consulta del 21/11. La
  transparencia de BaFin pasa a «consultada el 21/11».
- **Robinhood:** sin cambios de fondo. Fuera las 3 referencias que repetían la
  tarjeta; 7 re-fechadas. El mínimo pasa a «sin fecha publicada» (la web no
  tiene fecha). La nota de comisiones aclara que la errata del KID en español
  es la entrada.
- **Prosegur Digital Gold:** tarjeta igual. Fuera 12 referencias repetidas o
  que contradecían la tarjeta («Liquidación en menos de 24 horas», «Auditorías
  mensuales» sin informes); 9 re-fechadas, entre ellas «Estado de la oferta»
  con la app de hoy (107,88 € · Emitida · Comprar). Aviso de la CNMV más
  preciso (custodiar, tramitar órdenes y transferir criptoactivos), y la
  casilla de transparencia dice lo mismo al aplicar.

### Suiza
- **Aktionariat:** «Precio del emisor · 21/11/2026: 7,25 CHF» y FINMA del
  21/11. Aviso nuevo de precios: «…el 21/11/2026 la venta más barata era de
  6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF». Fuera 10
  referencias viejas; entran «Última compra al emisor», «Última operación
  entre accionistas» y «Libro entre accionistas» del 21/11.
- **Boss Info:** mínimo «…(unos 17 ZCHF, precio a 21/11)»; aviso de la venta
  más barata y FINMA al 21/11. Fuera 6 referencias viejas (las del 22/10
  también); «Salida · 21/11/2026» con el libro de hoy.
- **Switzerlend:** mínimo «1 acción (68,01 CHF el 21/11, precio del emisor)»
  y corto «1 acción (68,01 CHF a 21/11)». «Clase»: «…si el dinero alcanza,
  cobra 53,72 CHF por acción detrás de las preferentes de rango superior y
  antes que las ordinarias (no es un tope)». Avisos al 21/11. Fuera 12
  referencias viejas; 3 nuevas del 21/11.

### Brickwise (11 fichas, se quedan todas)
- **Mínimo:** «Desde X € la participación en reventa (21/11)» con la venta más
  barata de hoy. Solo cambia la cifra en **Schwarzer Weg 18: 69,90 € → 71,90 €**
  (y 298 → 297 en venta). Las demás, misma cifra con fecha del 21/11. Donde el
  precio más bajo solo se vende en lote, la nota dice cuánto cuesta una sola
  participación (Cohotel 120 €, Randhartingergasse 85 €, Hinterstoder 82 €,
  Plüddemanngasse 99 €, Sonnleithnergasse 80 €).
- **Libro de órdenes del 21/11** en las cuatro referencias de cada ficha (venta
  más barata, orden de menor importe con su 1,5 %, participaciones en venta y
  mejor compra), con la copia y su SHA-256.
- **Las 8 que piden número fiscal austriaco:** aviso nuevo (o el que había,
  cambiado) con el texto del auditor: «Para comprar hace falta un número fiscal
  austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el
  asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria
  (la emisora presenta una declaración conjunta) y, si vendes con ganancia,
  pagas allí la ImmoESt.» Referencia nueva «Número fiscal austriaco ·
  21/11/2026». En las seis de brickwise-a, el aviso de la cuenta dice que sin
  ese número la app no deja comprar y que no consta que se comercialice en
  España. El acceso desde España se queda como está publicado.
- **Pottendorfer, GreenPoint y Cohotel (KESt):** aviso nuevo «El emisor retiene
  en Austria el impuesto KESt de cada reparto; al vender no hay retención y la
  ganancia la declaras tú.»; aviso de la cuenta con «no pide número fiscal
  austriaco»; en GreenPoint y Cohotel, la subordinación explicada; fuera
  «Distribuciones esperadas desde 15/02/2024».
- **Randhartingergasse:** aviso del piso vacío más claro («…no consta si ya lo
  hay. Si sigue vacía, puede no haber repartos»).
- Las 13 referencias viejas de cada ficha, re-fechadas al 21/11; en «Moneda» y
  «Plazo», sin la coletilla «Cifra indicativa y variable…».

### Hausera (lo que vio el responsable del proyecto)
- **Mínimo corto:** «Desde 100 € en Alicante 3 (20/11)» → **«Desde 100 € ·
  suscripción desde el 25/11»** (en `transparencia.json`, al aplicar).
- **Mínimo largo:** «…según su documento de emisión (20/11); preventa abierta
  desde el 18/11.» → «Desde 100 € en Alicante 3 (documento de emisión); reserva
  desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.» Su nota dice «La
  preventa (reserva) abrió el 18/11/2026», cierto también desde el 25/11.
- **Resumen, «Próxima operación» y aviso de la inscripción:** ya no dicen
  «tiene la preventa abierta» (deja de ser cierto el 25/11); dicen «abrió la
  preventa el 18/11» y el 21/11 sin inscribir en la CNMV.
- En `transparencia.json`, el motivo del documento pasa al 21/11 con la misma
  forma. Fuera la referencia del 30/09.

### Radar
Las 69 fuentes contrastadas hoy; ningún texto ni dirección cambia.

## 4. El SQL (inventario)

288 sentencias en una transacción serializable: `begin`, la guarda, 284
inserts y la aprobación, y `commit`. La guarda exige la publicada 94f7fd5d con
su huella, el catálogo no retirado, aplicarla del 21/11 al 28/11 y que la
revisión destino no exista con otra identidad. Solo inserts en
`rwadar_catalogo` (35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en
ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones; las
mismas filas por tabla que la 2026-11-20.2), todos idempotentes. Sin DDL,
borrados, permisos, Auth ni funciones. No escribe en `public.*`: solo lee
`public.plataformas` y bloquea la fila de `public.catalogo_publicacion`, que la
aprobación pone al día (`retirado = false`) con su disparador, como en cada
entrega. 23 de las 288
sentencias cambian algo más que la revisión, la huella y la fecha (detalle en
`DIFF-ENTREGA.md`).

## 5. Lo que no se aplicó tal cual, y por qué

Todo está en `decisiones.json` → `noAplicado` (15 puntos). Lo que importa:

1. **«Acceso desde España» de Spiko Letras Euro y Dólar, Hausera y las tres
   KESt:** se queda el texto publicado. El ensayo del motor exige que un dato de
   tarjeta cambiado se vea tal cual, y en estas fichas la tarjeta solo enseña un
   texto genérico («Disponible desde España según la fuente» o «Sin comprobar si
   se puede contratar desde España»). Los textos publicados son ciertos; en
   Spiko el publicado no dice «el fondo está inscrito en la CNMV», que era lo
   que corregía el revisor.
2. **Mínimo en lote de Cohotel, Randhartingergasse e Hinterstoder:** se queda
   «Desde X € la participación en reventa (21/11)» (la regla de reventa del
   motor), con la nota de lo que cuesta una sola (DECISIONES §8).
3. **Cuatro referencias viejas que el motor no puede tocar:** dos «Gestión
   publicada: 0,25 %» (Spiko Euro, 30/09) y dos «Último cruce publicado: 6,25
   CHF» (Aktionariat, 30/09). Cada par tiene la misma etiqueta y el mismo
   valor y el motor exige que cada referencia sea única. Para que la fila «Costes» de
   Spiko Euro no cite la del 30/09, «Comisión de gestión» se re-fecha al 21/11
   en vez de quitarla (§8, C3 de contenido).
4. **Cambios de nombre de etiquetas** (Spiko «Salida» y «Acceso (particulares)»,
   «Precio de emisión original» en Brickwise, «Historial que publica Hausera»,
   «Patrimonio y titulares» de Letras Dólar): el motor solo cambia la fecha de
   la etiqueta; se re-fechan con su nombre (el de Letras Dólar se quita).
   Aktionariat: la referencia de hoy del libro se llama «Libro entre
   accionistas · 21/11/2026» y no «Salida», para que «Lo esencial» no cambie.
5. **Radar, §7 (4), fuentes de Midas:** el motor no añade fuentes nuevas al
   radar. Queda para el próximo ciclo.
6. **mTBILL, huella del vigía en el expediente:** el montador no edita los
   expedientes; no cambia nada publicado.
7. **Fuentes de la oferta de Brickwise** que proponen los expedientes: no lo
   pide DECISIONES; la ayuda de impuestos entra en las fuentes de la ficha.

Recomendadas que no entran (no cambian datos o piden código): la «Moneda» de
Letras Dólar con el conflicto de 1.000 €, quitar uno de los dos avisos de coste
de Prosegur, la sugerencia «Sí: …» del acceso de Aktionariat, el mínimo en
cripto de Aktionariat, el «Proveedor» de Boss Info y Switzerlend y pasar Boss
Info y Switzerlend a «principales» (decisión del coordinador: al próximo ciclo).

Una nota para el revisor: la decisión del expediente de Letras Dólar sigue en
«mantener» (DECISIONES dice «actualizar»); `decisiones.json` no fija la
decisión de esa ficha, así que el motor no la compara.

## 6. Las pruebas, con su salida real

Todas rehechas después de las correcciones de §8 (revisión `508d0366…`).

- **preparar --repetir:** «mismos SHA-256 las dos veces»; 425 cambios, 413
  pruebas, 53 diferencias con el expediente declaradas, 15 puntos no aplicados.
- **comprobar (PGlite), en la carpeta del ciclo, sin `--exportar`** (así
  `pruebas-locales.json` no guarda ninguna ruta del scratchpad): «resultado:
  correcto», 18 comprobaciones y 6 casos de fallo (publicada distinta, otra
  huella, catálogo retirado, destino con otra huella, lote caducado, catálogo
  incompleto): todos fallan sin dejar nada. Entre ellas: idempotente; cada uno
  de los 425 cambios se ve en lo que lee un visitante; lo no aplicado sigue
  como estaba (10 comprobaciones de 15 puntos); no aparece «tiene la preventa
  abierta», «Brickwise lo tramita», «se cruzaron 62», «Condiciones Finales del
  21/11/2026», «si lo pides con el asesor fiscal que te presenta Brickwise, no
  cuesta nada», «participaciónes», «coincidencias.Registro» ni «Mientras esté
  vacía no hay repartos»; la web la acepta el 21/11 y el 28/11 y la da por
  caducada el 29/11; la app la acepta; cambian las mismas 14 tarjetas y cada
  una enseña su texto nuevo; el sincronizador real da 25 / 22 / 5 descartadas.
- **revisar:** «DIFF-ENTREGA.md: 425 cambios en 22 fichas; 14 tarjetas; 23
  sentencias del SQL con algo más que fechas e identificadores».
- **auditar** contra la copia que vieron los revisores (`c7f99442…fe5f`):
  rehecha dos veces, igual byte a byte; el mismo inventario (288 sentencias);
  18 sentencias de ofertas cambian, cada una por una corrección de §8; PGlite
  correcto; veredicto `sql_cambiado_falta_auditor` (`VERIFICACION-ENTREGA.md`).
  Sin escáner de secretos (no hay gitleaks en esta máquina).
- **Ensayo «después de aplicar»** en una copia aparte (22:01–22:06 UTC, más
  10c–10e; detalle en `ensayo-despues.json`). Nada sale a la red:
  - preparar --repetir 0; comprobar --exportar 0 (correcto, 19 y 6: en la
    copia hay una comprobación más, la de exportar); despues-de-aplicar antes
    de sincronizar 1, a propósito («el catálogo sincronizado no es la revisión
    508d0366…»);
  - sincronizar.js con el REST simulado 0: «25 plataformas verificadas, 5
    descartadas y 22 ofertas clasificadas»;
  - despues-de-aplicar 0, y otra vez 0 (repetible): 11 mínimos cortos de
    Brickwise «Desde X € la participación (21/11)», Switzerlend «1 acción
    (68,01 CHF a 21/11)», Hausera «Desde 100 € · suscripción desde el 25/11»,
    el motivo de Hausera al 21/11, BaFin de mTBILL al 21/11 y Prosegur «solo
    para custodiar, tramitar órdenes y transferir criptoactivos»;
  - volcar-seed 0 («25 en el radar, 5 descartadas, 13 fuentes»);
    transparencia.mjs 0 («22 ofertas con transparencia»); rwadar-fichas.js 0
    (55 archivos);
  - **npm test 1, solo por lo esperado antes de aplicar.** test:db, test:web
    (con `probar-web.mjs` de main, #192: la prueba de Inicio ya usa fechas
    relativas al catálogo) y test:qr pasan. test:mobile: 690 pruebas, 689
    bien; la única que falla es «sin lectura en línea de la revisión
    508d0366…», que solo existe tras aplicar de verdad.
  - 10b, esa prueba con la lectura «después de aplicar» simulada: 25 de 25.
  - 10d, test:tools: 0. 10e, test:acceso: 369 de 369.

## 7. Pasos para aplicarla (cuando lo autorice el ciclo)

0. Hecho en main (#192, ya unido a esta rama): la prueba de Inicio de
   `probar-web.mjs` usa fechas relativas al catálogo y pasa con esta entrega.
1. Hecho: revisión única (SQL, contenido y tarjetas, cumplimiento) y
   correcciones en `decisiones.json` (§8).
2. Hecho sin escáner de secretos: `auditar … --antes=<scratchpad>/sql-revisado-2026-11-21 --revisado=c7f99442…fe5f --escribir`
   da `sql_cambiado_falta_auditor` (`VERIFICACION-ENTREGA.md`). Falta el
   auditor (agente) que compruebe que cada diferencia es una corrección pedida,
   y pasarlo con `--secretos=<gitleaks> --exigir-secretos` antes del PR.
3. Volver a leer como visitante justo antes de aplicar: la publicada tiene que
   seguir siendo la 94f7fd5d. Si la API de Spiko da VL nueva (lunes 23/11), hay
   que rehacer las cifras.
4. Aplicar `rwadar-app/data/importaciones/catalogo-2026-11-21-v2/aplicar-y-aprobar.sql`
   en Supabase **antes del 29/11** (la guarda lo impide después).
5. `node rwadar-app/sincronizar.js`, luego
   `node rwadar-app/data/verificaciones/2026-11-21-v2/despues-de-aplicar.mjs`
   (transparencia: Hausera «Desde 100 € · suscripción desde el 25/11»,
   Switzerlend «1 acción (68,01 CHF a 21/11)»), `node rwadar-app/volcar-seed.js`,
   `node rwadar-editorial-source/ofertas/transparencia.mjs`,
   `node rwadar-fichas.js` y `npm test`.
6. Publicar la web, la OTA si hace falta, y el aviso de novedad.

## 8. Correcciones aplicadas

Las tres revisiones de la entrega (`REVISION-ENTREGA-sql.md`,
`REVISION-ENTREGA-contenido.md` y `REVISION-ENTREGA-cumplimiento.md`) dieron
«aprobado con cambios». Todo se cambió solo en `decisiones.json` y se rehízo
con el motor (§6). La revisión pasa de `53747b1d…` (SQL `c7f99442…fe5f`) a
`508d0366-3c8e-8f9c-611d-bf49025a08d1` (SQL `0486c6fd…4d40`).

### Obligatorias (todas)

- **SQL S1 y contenido C5 · «participaciónes».** La nota del mínimo de
  Plüddemanngasse, Sonnleithnergasse, Klagenfurt, Randhartingergasse,
  Hinterstoder, GreenPoint y Cohotel dice «N participaciones»; «1
  participación» sigue igual. `comprobar.ausentes` lleva «participaciónes».
- **SQL S2 · espacio en Aktionariat.** «Supervisión · consulta 21/11/2026»:
  «…sin coincidencias. Registro de autorizados de FINMA: 0 resultados el
  21/11/2026.» `comprobar.ausentes` lleva «coincidencias.Registro».
- **Contenido C1 y cumplimiento C1 · mTBILL.** La referencia conserva la
  etiqueta «Países de oferta pública · Condiciones Finales del 17/07/2026»
  (el documento es del 17/07); solo cambian la nota y la consulta (21/11).
  `comprobar.ausentes` lleva «Condiciones Finales del 21/11/2026».
- **Contenido C2 · Kraken, «Salida».** Nuevo `tarjetaFecha`: la nota queda
  «Página de xStocks de Kraken UE.», sin «consultada el 03/11/2026», como el
  mínimo y el acceso. El valor y la fecha del dato (sin fecha) no cambian.
- **Contenido C3 · Spiko Letras Euro, «Costes».** «Comisión de gestión ·
  22/10/2026» ya no se quita: se re-fecha a «Comisión de gestión ·
  21/11/2026» (0,25 %, data.spiko.io leído hoy), para que la fila «Costes»
  no cite la «Gestión publicada» del 30/09. El punto de `noAplicado` sobre
  «Gestión publicada» lo explica.
- **Contenido C4 · Hausera, nota del mínimo.** «La preventa (reserva) abrió el
  18/11/2026 según la ficha.», cierta también del 25 al 28/11.
- **Contenido C6 · Robinhood, comisiones.** La nota dice exactamente: «KID en
  inglés: entrada 0,10 %, salida 0,10 %, costes corrientes 0,00 %; el KID en
  español pone 0,00 % de entrada (errata). Posibles diferenciales en horario
  ampliado. Localizador: Fee Schedule, apartado Robinhood Classic Stock
  Tokens.»
- **Contenido C7 · Prosegur, casilla de transparencia.** Nuevo punto en
  `transparencia.textos` (`supervisada.motivo`): «solo para custodiar, tramitar
  órdenes y transferir criptoactivos», como el aviso. No cambia el SQL; el
  ensayo lo aplica al `transparencia.json` (§6).
- **Cumplimiento C2 · Brickwise, «no cuesta nada».** `plantillas.AVISO_NF`
  dice exactamente «…se pide a Hacienda de Austria y, según Brickwise,
  pedirlo con el asesor fiscal que te presenta no cuesta nada…». Los 8 cambios
  que usan la plantilla llevan la prueba de la revisión de cumplimiento, y
  `comprobar.ausentes` lleva el texto de antes.

### Recomendadas que entran (aclaran un texto de la entrega, sin cifras nuevas ni más alcance)

- **SQL R1:** §4 dice ahora qué toca de `public.*` (solo lee
  `public.plataformas` y bloquea la fila de `public.catalogo_publicacion`, que
  la aprobación pone al día). El mensaje de PGlite es del motor y no se toca.
- **SQL R3:** `comprobar` se ha pasado en la carpeta del ciclo sin
  `--exportar`, y `pruebas-locales.json` ya no guarda la ruta del scratchpad;
  la exportación se hizo en la copia del ensayo. Que el motor deje de escribir
  rutas absolutas queda para el próximo ciclo.
- **SQL R5:** la rama ya tiene main con #190, #191 y #192. El ensayo y
  `auditar` corrieron sobre ella; `npm test` ya no falla en `probar-web.mjs`.
- **Contenido R5:** en «Estado de la oferta» de Letras Euro y Dólar, la VL del
  20/11 se atribuye a la API de Spiko, no a GECO.
- **Contenido R7:** en «Moneda» y «Plazo» de Brickwise, la nota queda «Visto
  en la fuente oficial el 21/11/2026.», sin «Cifra indicativa y variable…».
- **Cumplimiento 3:** el aviso de la cuenta de las 6 de brickwise-a dice
  también «no consta que se comercialice en España» (como las otras cinco).
  Para eso, el aviso se quita y se pone en el mismo sitio (`avisoQuita` +
  `avisoNuevo`), porque el motor solo acepta `aviso` cuando el texto nuevo es
  el del expediente.
- **Cumplimiento 6 (y 7):** Randhartingergasse: «Si sigue vacía, puede no
  haber repartos.» en lugar de «Mientras esté vacía no hay repartos». La 7
  (nota de Kraken) es la C2 de contenido.

### Recomendadas que no entran, y por qué

- **SQL R2 (copia de la consulta de BaFin):** la consulta del auditor no está
  guardada en ningún archivo del ciclo, y volver a hacerla es salir a la red,
  que este turno no puede. Queda la frase del informe de auditoría.
- **SQL R4, contenido R1 (formato «1 participación desde X €») y R2
  (duplicados), cumplimiento 4:** piden cambiar el motor. Próximo ciclo.
- **Contenido R3 (valor de «Precio» y «Mínimo» de la suscripción original):**
  cambia el valor de 22 referencias de 11 fichas, que DECISIONES no pide así;
  sigue en `noAplicado` (cambio de nombre).
- **Contenido R4 (explicar ImmoESt y KESt):** el texto del aviso es el exacto
  de cumplimiento C2; cambiarlo lo contradiría.
- **Contenido R6 (Hausera, «financiada el 10/11/2026»):** es un aviso
  publicado que el expediente propone tal cual; decir quién lo vio pide una
  fuente de ese día.
- **Contenido R8 (fechas cortas de Boss Info y Switzerlend):** son las
  propuestas del expediente y el revisor las da por buenas; solo es estilo.
- **Contenido R9 (fuente de la casilla de mTBILL) y R10 (mínimo largo de
  Hausera):** cambian una fuente o añaden un dato («puede cerrarse antes») que
  DECISIONES no pide.
- **Contenido R11 y cumplimiento 1, 2 y 5:** decisiones del coordinador para
  el próximo ciclo (tono del aviso, acceso de Smart Cash, impuestos en España,
  avisos de Boss Info y Switzerlend).

## 9. Corrección antes de aplicar (22:38–22:45 UTC)

El vigía contra la entrega ya auditada (paso 2 de «Publicar») dio una cifra
nueva en Brickwise · Schwarzer Weg 18: a las 21:36 UTC entró una orden de 1
participación a 71,00 €. Leído en la API pública a las 22:38:58 UTC
(`grupos/brickwise-a/fuentes/libro-ordenes-resumen-2026-11-21-2238.json`,
SHA-256 `298af8e9…d4f5`; DECISIONES §9). Las otras 10 fichas de Brickwise y
las demás cifras, iguales.

- Mínimo de la tarjeta: «Desde 71,90 €…» → **«Desde 71,00 € la participación
  en reventa (21/11)»**.
- Venta más barata: 71,00 € (1 a ese precio, orden del 21/11/2026).
- Orden de menor importe: 1 participación a 71,00 € (72,07 € con el 1,5 %).
- Participaciones en venta: 297 → 298.

`preparar --repetir`: mismos SHA-256 las dos veces. `comprobar`: correcto (18
y 6). `auditar --antes=<scratchpad>/sql-auditado-2026-11-21
--revisado=0486c6fd…4d40`: mismo inventario (288), una sola sentencia
cambia (la oferta de Schwarzer Weg 18, con esas cifras y nada más), PGlite
correcto y secretos sin hallazgos; «sql_cambiado_falta_auditor». Revisión
`753b4cc9-3c01-e879-ba96-05dc3cf95b05`, SQL `1f892b76…75e9bd`. El auditor
independiente de este cambio está en `VERIFICACION-ENTREGA.md` §9.

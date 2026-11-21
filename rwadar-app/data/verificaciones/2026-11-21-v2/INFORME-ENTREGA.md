# Entrega del catálogo 2026-11-21 · informe del montador

Montada el 21/11/2026 con el motor de la entrega
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
| Revisión nueva | `53747b1d-8b08-adda-5d0b-1f4875749a2d` |
| Huella | `53747b1d8b08adda5d0b1f4875749a2d2208ccf7240dc29750bf604e860ad4e4` |
| `aplicar-y-aprobar.sql` (SHA-256) | `c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f` |
| `catalogo.sql` (SHA-256) | `cedac9e09f032b5e2f9b4e86511de5c932f04ccf2b44fe4690fc590d764978eb` |
| `revision.json` (SHA-256) | `31392af52c2ac8bd30ad1845a96b5b4fb2ac2fbfd0a910151b4139486b57f76a` |
| Vigencia | verificadas el 21/11/2026, 7 días: **último día el 28/11/2026**; la guarda del SQL no deja aplicarla después |
| Ofertas y plataformas | las mismas 22 (8 principales, 13 de reventa, 1 en camino) y 25; sin altas ni retiradas |
| Cambios | 418 en las 22 fichas, 406 con su prueba; 14 tarjetas cambian (solo el mínimo) |

Copia de los tres archivos que verán los revisores:
`<scratchpad>/sql-revisado-2026-11-21/` (mismos SHA-256).

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
  Fuera 6 referencias repetidas o viejas; 8 re-fechadas.
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
  03/11/2026» de las notas del mínimo y del acceso; 4 referencias re-fechadas.
- **mTBILL:** cifras iguales (ronda 498). Fuera las 8 referencias que
  dependían de la web de Midas (da 403) y 5 direcciones de Midas que ya nada
  cita. La transparencia de BaFin pasa a «consultada el 21/11».
- **Robinhood:** sin cambios de fondo. Fuera las 3 referencias que repetían la
  tarjeta; 7 re-fechadas. El mínimo pasa a «sin fecha publicada» (la web no
  tiene fecha).
- **Prosegur Digital Gold:** tarjeta igual. Fuera 12 referencias repetidas o
  que contradecían la tarjeta («Liquidación en menos de 24 horas», «Auditorías
  mensuales» sin informes); 9 re-fechadas, entre ellas «Estado de la oferta»
  con la app de hoy (107,88 € · Emitida · Comprar). Aviso de la CNMV más
  preciso (custodiar, tramitar órdenes y transferir criptoactivos).

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
  austriaco: se pide a Hacienda de Austria y, si lo pides con el asesor fiscal
  que te presenta Brickwise, no cuesta nada. Las rentas tributan en Austria (la
  emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas
  allí la ImmoESt.» Referencia nueva «Número fiscal austriaco · 21/11/2026». En
  las seis de brickwise-a, el aviso de la cuenta dice que sin ese número la app
  no deja comprar. El acceso desde España se queda como está publicado.
- **Pottendorfer, GreenPoint y Cohotel (KESt):** aviso nuevo «El emisor retiene
  en Austria el impuesto KESt de cada reparto; al vender no hay retención y la
  ganancia la declaras tú.»; aviso de la cuenta con «no pide número fiscal
  austriaco»; en GreenPoint y Cohotel, la subordinación explicada; fuera
  «Distribuciones esperadas desde 15/02/2024».
- **Randhartingergasse:** aviso del piso vacío más claro («…no consta si ya lo
  hay. Mientras esté vacía no hay repartos»).
- Las 13 referencias viejas de cada ficha, re-fechadas al 21/11.

### Hausera (lo que vio el responsable del proyecto)
- **Mínimo corto:** «Desde 100 € en Alicante 3 (20/11)» → **«Desde 100 € ·
  suscripción desde el 25/11»** (en `transparencia.json`, al aplicar).
- **Mínimo largo:** «…según su documento de emisión (20/11); preventa abierta
  desde el 18/11.» → «Desde 100 € en Alicante 3 (documento de emisión); reserva
  desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.»
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
borrados, permisos, Auth ni funciones; nada en `public.*`. 23 de las 288
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
   valor y el motor exige que cada referencia sea única.
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

- **preparar --repetir:** «mismos SHA-256 las dos veces»; 418 cambios, 406
  pruebas, 53 diferencias con el expediente declaradas, 15 puntos no aplicados.
- **comprobar (PGlite):** «resultado: correcto», 19 comprobaciones y 6 casos de
  fallo (publicada distinta, otra huella, catálogo retirado, destino con otra
  huella, lote caducado, catálogo incompleto): todos fallan sin dejar nada.
  Entre ellas: idempotente; cada uno de los 418 cambios se ve en lo que lee un
  visitante; lo no aplicado sigue como estaba (10 comprobaciones de 15 puntos);
  no aparece «tiene la preventa abierta», «Brickwise lo tramita» ni «se
  cruzaron 62»; la web la acepta el 21/11 y el 28/11 y la da por caducada el
  29/11; la app la acepta; cambian 14 tarjetas y cada una enseña su texto
  nuevo; el sincronizador real da 25 / 22 / 5 descartadas.
- **«Lo esencial» antes y después** (resumenOferta del repositorio, las 22
  fichas): solo cambia el mínimo de las 14 tarjetas que cambian; el acceso y la
  salida, iguales en las 22.
- **Ensayo «después de aplicar»** en una copia aparte (21:04–21:08 UTC, más
  los pasos 10c–10e; detalle en `ensayo-despues.json`). Nada sale a la red:
  - preparar --repetir 0; comprobar 0 (correcto, 19 y 6); despues-de-aplicar
    antes de sincronizar 1, a propósito («el catálogo sincronizado no es la
    revisión 53747b1d…»);
  - sincronizar.js con el REST simulado 0: «25 plataformas verificadas, 5
    descartadas y 22 ofertas clasificadas»;
  - despues-de-aplicar 0, y otra vez 0 (repetible): 11 mínimos cortos de
    Brickwise «Desde X € la participación (21/11)», Switzerlend «1 acción
    (68,01 CHF a 21/11)», Hausera «Desde 100 € · suscripción desde el 25/11»,
    el motivo de Hausera al 21/11 y BaFin de mTBILL al 21/11;
  - volcar-seed 0 («25 en el radar, 5 descartadas, 13 fuentes»);
    transparencia.mjs 0 («22 ofertas con transparencia»); rwadar-fichas.js 0
    (55 archivos);
  - **npm test 1.** Falla `probar-web.mjs`, en la prueba «Inicio: cada tarjeta
    pone su fecha más reciente…», añadida hoy en el PR #183. Esa prueba fija la
    fecha de la documentación en «2026-11-20» sobre una ficha real que, con el
    catálogo de hoy, tiene referencias del 21/11, y la web descarta esa
    combinación. **No es un fallo de los datos**: la prueba está atada al
    catálogo del 20/11 y fallará igual en la CI en cuanto se sincronice esta
    entrega. Hay que arreglarla (fechas relativas al catálogo) antes de
    publicar.
  - 10b, la prueba de presentación de la app con la lectura «después de
    aplicar» simulada: 25 de 25.
  - 10c: con esas tres fechas de la prueba un día después (solo en la copia,
    restaurada después), test:web pasa entero. El único fallo es el esperado
    antes de aplicar, «sin lectura en línea de la revisión 53747b1d…»: 690
    pruebas de la app, 689 bien.
  - 10d, test:tools: 0. 10e, test:acceso: 369 de 369.

## 7. Pasos para aplicarla (cuando lo autorice el ciclo)

0. Arreglar la prueba «Inicio: cada tarjeta pone su fecha más reciente…» de
   `probar-web.mjs` (PR aparte), o la CI fallará con este catálogo (§6).
1. Revisión única de la entrega (SQL, contenido y tarjetas, cumplimiento),
   partiendo de `DIFF-ENTREGA.md`; correcciones solo en `decisiones.json`.
2. `node .claude/skills/investigacion-catalogo/entrega/motor.mjs auditar 2026-11-21 --antes=<scratchpad>/sql-revisado-2026-11-21 --revisado=c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f --secretos=<gitleaks> --exigir-secretos --escribir`.
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

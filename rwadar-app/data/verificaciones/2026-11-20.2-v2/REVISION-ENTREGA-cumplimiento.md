# Revisión de cumplimiento · entrega 2026-11-20.2

Revisor independiente de cumplimiento (MiFID II, MiCA, Folletos, ECSP, régimen
piloto DLT y Circular 2/2020 de la CNMV). No monté esta entrega. Revisión única
y directa, como pidió el responsable del proyecto: parto de `DIFF-ENTREGA.md` y
no repito lo que ya prueba el motor. Hora: 21/11/2026, 02:15–02:25 UTC.

**Veredicto: aprobada con un cambio. Es una frase de Spiko Smart Cash y sí
cambia el SQL (una sola cadena).**

## Qué he comprobado

1. **Solo cambia la documentación de las fichas.** He comparado oferta por
   oferta el SQL publicado (`catalogo-2026-11-20-v2/aplicar-y-aprobar.sql`) con
   el de hoy (SHA-256 `7b13a3d2…9c8391`, coincide con lo que dice el montador).
   No cambia nada de lo que tiene peso legal en la tarjeta: ni resumen, ni
   métricas, ni avisos, ni rentabilidad, ni precio, ni `disponible_es`, ni
   `eu`, ni `estado_revision`, ni `fuentes_actuales`. Solo cambia
   `documentacion`: se quitan 68 referencias y 2 fuentes, cambian 3 fechas
   (Spiko), cambia el alcance de Smart Cash y cambia el comienzo del alcance de
   «Mínimo de inversión» en 14 fichas (ya lo señala la revisión de contenido).
2. **No se pierde ningún aviso de riesgo.** Los avisos quedan iguales. Las
   notas de las referencias quitadas («no garantiza disponibilidad», «no es
   cotización ejecutable ni prueba de liquidez») iban con datos viejos. Los
   avisos que siguen ya dicen lo mismo:
   - Brickwise: «Solo reventa entre inversores…», «posible pérdida total», «la
     distribución de esta emisión en España no está confirmada».
   - Boss Info: «El emisor no recompra», «puedes perder todo el dinero
     invertido».
   - Switzerlend: «La salida depende de compradores en un secundario en cripto
     con muy poca demanda».
   - Aktionariat: «Sin folleto ni KID… el emisor no está supervisado».
   - mTBILL: «El emisor no está supervisado: la FMA aprobó el folleto, no la
     entidad».
3. **Rentabilidades.** Siguen con su base, su fecha y «Variable y no
   garantizado» en las tres de Spiko. Quitar la VL del 01/11 no les afecta.
4. **Acceso desde España (las tres de Spiko).** La nueva fecha se apoya en la
   tabla de países del proveedor (condiciones con lista de países). En las
   métricas sigue «Spiko SICAV inscrita en la CNMV para su comercialización
   (n.º 2380)». En Smart Cash el valor sigue atribuido («según Spiko») y el
   aviso sigue diciendo que no se ha podido confirmar en la CNMV ni en la AMF.
5. **Botón.** La regla está en `rwadar-site/assets/rwadar-20260820.js`
   (revisión legal 06/11/2026, 5.3): «Ver oferta en X» solo si se contrata hoy
   desde España **y** está supervisada. Los datos que la deciden no cambian,
   así que tampoco cambia el botón:
   - Las 3 de Spiko: «Ver oferta en Spiko».
   - Las otras 15 fichas tocadas (11 de Brickwise, mTBILL, Aktionariat, Boss
     Info y Switzerlend): «Ir a la web del proveedor (sales de RWAdar)».
   - Hausera: solo cambia el comienzo de un alcance, y su botón sigue diciendo
     que sales de RWAdar.

   Es lo que ya enseñan las páginas `rwadar-site/ofertas/*.html`.
6. **Datos personales.** Lo que cambia en el SQL son quitas, fechas y una frase
   sin nombres. En la carpeta del ciclo solo aparece el buzón público de
   contacto del propio proyecto (`auditoria/sitio-web.md`, ya publicado el
   20/11). No es una persona física.

## Fuentes abiertas hoy

| Qué | URL | Hora UTC | Literal | Resultado |
|---|---|---|---|---|
| Tabla de países de Spiko | https://docs.spiko.io/documentation/product_overview/fund_availability/ | 02:21:19 | «Country Smart Cash T-Bills Euro T-Bills Dollar T-Bills Pound» · «🇪🇸 Spain ✅ ✅ ✅ ❌» · «Last updated: November 13, 2026» | Bien: fecha del 13/11, mismo valor |
| Advertencias CNMV · Spiko | https://www.cnmv.es/portal/resultadobusqueda?tipo=1&nombre=Spiko&lang=es | 02:21:19–02:21:31 | «por tipo No autorizadas, de nombre Spiko. No hay datos disponibles.» | Sin advertencias |
| Advertencias CNMV · Brickwise, Aktionariat, Boss Info, Switzerlend, Midas | misma búsqueda, `nombre=` cada una | 02:21:19–02:21:31 | «No hay datos disponibles.» en las cinco | Sin advertencias |
| Control de que el buscador funciona | misma búsqueda, `nombre=Lend` | 02:21:55 | «09/03/2026 CREDERE LENDING» | El buscador devuelve resultados. Esta entidad no tiene relación con Switzerlend |

No hay entidades nuevas ni cambios de acceso (solo la fecha de Spiko), así que
no hacía falta buscar más.

## Corrección obligatoria (cambia el SQL)

**C1 · Spiko Smart Cash: la nota de «Acceso desde España» dice que el fondo
«no consta en ningún supervisor», y no es verdad.** Hoy se edita esta frase y
se le añade «y la AMF ya no muestra la ficha del fondo». Leída así, dice que el
fondo no figura en ningún supervisor. La misma ficha dice lo contrario en la
métrica «Supervisor»: «AMF (Francia): n.º SCV20260075, según el certificado de
la AMF del 23/02/2026 … Spiko SICAV inscrita en la CNMV (n.º 2380)». También
lo contradice la referencia «Aprobación del compartimento». Además, la ficha
lleva el botón «Ver oferta en Spiko», que exige que esté supervisada. Lo que no
consta en ningún registro público es que **este fondo esté dado de alta para
venderse en España**. Es justo lo que ya dice su aviso.

Cambio exacto en `decisiones.json` (spiko-smart-cash-euro, «Acceso desde
España», `despues.alcance`):

- Donde dice: `… La CNMV no publica los compartimentos de los fondos extranjeros y la AMF ya no muestra la ficha del fondo: no consta en ningún supervisor.`
- Poner: `… La CNMV no publica los compartimentos de los fondos extranjeros y la AMF ya no muestra la ficha del fondo: ningún registro público confirma que este fondo esté dado de alta para venderse en España.`

Alcance completo resultante, tras el prefijo que pone el motor:
«Comprobado de nuevo en la fuente el 20/11/2026. Tabla de disponibilidad de
Spiko (13/11/2026): España marcada en la columna Smart Cash, que cubre Spiko
Euro. La CNMV no publica los compartimentos de los fondos extranjeros y la AMF
ya no muestra la ficha del fondo: ningún registro público confirma que este
fondo esté dado de alta para venderse en España.»

Prueba para la decisión: documento `REVISION-ENTREGA-cumplimiento.md`, con la
frase «ningún registro público confirma que este fondo esté dado de alta para
venderse en España».

El cambio no toca valor, fechas, tarjeta ni botón. Basta volver a pasar
`preparar` y `comprobar` y la comprobación determinista del SQL.

## Recomendaciones (próximo ciclo, sin tocar esta entrega)

- **Smart Cash.** La AMF ha dejado de publicar la ficha del fondo (GECO
  `c124199`, `"published":false`). Conviene averiguar por qué: puede ser una
  fusión, un cambio de código o una liquidación. Si sigue sin aparecer, hay que
  revisar el botón «Ver oferta en Spiko» de esta ficha.
- **Spiko euro.** Al quitar la tabla del 23/10 también se va que el alta pide
  un test de conveniencia. Conviene ponerlo en llano en el alcance de «Acceso
  desde España».
- **Switzerlend.** Coincido con la revisión de contenido: hay que quitar
  «Mínimo de inversión · consulta 01/11/2026: Total: 408.07 CHF», que ya supera
  «1 acción (68,01 CHF el 20/11)».

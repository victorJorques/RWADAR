# Documentación recuperada de las 28 referencias

Preparado el 30/09/2026. `documentacion-ofertas.json` es un mapa directo por
`slug`, con las mismas 28 identidades del corte público del 28/09. Contiene
52 observaciones fechadas y 23 URLs de fuentes únicas. No aplica SQL, no aprueba
un lote ni cambia el estado comercial, la elegibilidad o la fecha de las ofertas.

Cada ficha separa `descripcion` y `caracteristicas` de `referencias` económicas
o temporales. Las referencias deben mostrarse como observaciones documentales,
nunca como una oferta abierta, cotización ejecutable, rentabilidad actual o
disponibilidad comprobada. No se han copiado fotografías del proveedor.

## Procedencia y fechas

- `../2026-09-28/escaparate-publicacion.json`: identidad y correspondencia exacta
  de los 28 slugs. No se modifica este archivo.
- `../2026-09-27/revalidacion-ofertas.json`: resultados y URLs de la revisión
  documental del 27/09. Se recuperan también los campos `precioHistorico` de
  BOSS y quitt, que el adaptador anterior no había transportado.
- `../2026-09-27/brickwise-aplicacion-publica.md`: observaciones individuales de
  doce tarjetas de la aplicación pública. Sustituye como evidencia de esas
  observaciones al listado comercial que repetía cifras; no resuelve apertura,
  acceso desde España ni la discrepancia de participaciones de GreenPoint.
- `../2026-09-21/actualizaciones-escaparate-local.json`: APY y comisiones de Midas
  observados el 21/09. Se conservan con esa fecha, sin revalidarlos al 27 o 30/09.
- `../2026-09-21/reental-prosegur-alius.json`: documentación corporativa de Caribe
  1 y 2. Las estimaciones proceden de artículos fechados el 05/08, consultados
  el 21/09. No se recupera el mínimo antiguo de 100 USD, considerado no fiable.
- Consulta pública realizada el 30/09 mediante lectura web, sin login:
  [Spiko Data](https://data.spiko.io/eutbl/),
  [ficha de Spiko](https://www.spiko.io/es/spiko-letras-del-tesoro-euro) y
  [página del emisor DAKS](https://shares.aktionariat.com/).

`revisadaEl` señala la consulta documental más reciente que sostiene la ficha:
27/09 en 26 fichas; 30/09 solo en Spiko y DAKS. No sustituye las fechas individuales
de cada observación, que pueden proceder de una consulta anterior. La carpeta
30/09 indica cuándo se preparó esta recuperación, no una revalidación universal.

`fechaDato` se informa únicamente cuando la evidencia fecha el dato o el
documento. Cuando no existe fecha independiente, vale `null`; no se rellena con
la fecha de consulta. El significado de cada fecha consta en `alcance`.

## Correspondencia y decisiones

| Grupo / slugs | Información recuperada | Límites conservados |
| --- | --- | --- |
| `caribe-1`, `caribe-2` | Identidad inmobiliaria y ubicación; plazo, estimaciones anuales por nivel y reparto del artículo corporativo | Artículos del 05/08 consultados el 21/09; no figuran en el catálogo revisado el 27/09; apertura y elegibilidad desconocidas |
| `mf-one`, `mglobal`, `mwin`, `mtbill` | Referencia de producto Midas y cifras históricas observadas el 21/09 | Sin reutilizar APY como vigente, sin deducir admisión desde España. El 6,65 % de mGLOBAL corresponde al periodo de julio citado por la fuente; no se inventa una fecha completa |
| Doce slugs Brickwise de la tabla siguiente | Identidad y ubicación del activo; precio desde o inversión mínima; distribución anual prevista | Consulta de tarjetas el 27/09; fecha de cálculo desconocida; no se comprobó el libro de órdenes individual ni disponibilidad |
| `spiko-letras-del-tesoro-euro` | ISIN, divisa, clasificación, uso de ingresos y gestora; rendimiento, NAV, mínimo y gestión observados el 30/09 | NAV expresamente fechado el 28/09. El rendimiento 2,17 % es anualizado a 30 días y no tiene fecha de cálculo independiente publicada; no se le atribuye la del NAV |
| `prosegur-digital-gold` | Unidad de 1 g, Polygon y ERC-3643 de la documentación del 27/09 | Sin precio, rendimiento, auditoría propia del respaldo ni elegibilidad afirmada |
| `casa-de-outeiro` | Emisión de capital y entrada total desde 2.000 EUR del emisor | Página con actualización 17/09 consultada el 27/09. No confirma 25 EUR por acción, número de acciones ni apertura actual |
| `aktionariat` | Identidad DAKS y último cruce 6,25 CHF | Leído el 30/09; cruce del 22/09 a las 20:21, sin liquidez o ejecución garantizada |
| `boss-info`, `servicehunter-quitt` | Precios históricos omitidos por el adaptador: 8,44 CHF y 8,00 CHF | Fechas de cruce 29/08 y 23/07; consulta 27/09 |
| `wemakeit` | Acciones de la empresa y valor 8,38 CHF definido por el emisor | Observado el 27/09; no se etiqueta como último cruce ni se inventa fecha de cálculo |
| `switzerlend` | Acciones LENDS, distintas de los préstamos LEND; cruce 68,01 CHF | Operación del 25/09, consultada el 27/09; no garantiza ejecución actual |
| `twiliner` | Referencia de capital y calendario de ronda anunciado | Segundo semestre de 2026 es una previsión corporativa, no prueba de apertura |
| `ehc-kloten` | Certificados de participación tokenizados | No describirlos como acciones ordinarias con voto; datos de plantilla impiden afirmar precio, volumen o liquidez |

### Correspondencia Brickwise

Todas las observaciones tienen `fechaConsulta: 2026-09-27` y `fechaDato: null`.
La fuente de las cifras es la tarjeta individual en
`https://app.brickwise.at/desktopWeb/marketplace`; no se atribuyen estas cifras a
una lectura individual de las doce fichas. Solo GreenPoint tuvo un recorrido
documentado a su ficha y mostró recuentos incompatibles, que no se importan.

| Slug | Identidad de tarjeta / fuente | Precio desde o mínimo anunciado | Distribución anual prevista |
| --- | --- | ---: | ---: |
| `fotovoltaica-greenpoint` | GreenPoint | 100 EUR | 6,11 % |
| `fotovoltaica-cohotel` | Cohotel | 110 EUR | 5,57 % |
| `drautalresidenz-paternion` | Drautalresidenz, Paternion | 55 EUR | 5,96 % |
| `terreno-con-arrendamiento-billa` | Terreno arrendado a BILLA | mínimo total 1.000 EUR | 5,07 % |
| `apartamento-vacacional-hinterstoder-50` | Hinterstoder 50 | 75 EUR | 4,65 % |
| `vivienda-stallhofstra-e-28-gratwein` | Stallhofstraße 28 | 65 EUR | 4,42 % |
| `vivienda-schwarzer-weg-18-graz` | Schwarzer Weg 18 | 70 EUR | 3,46 % |
| `vivienda-pottendorfer-stra-e-62-wr-neustadt` | Pottendorfer Straße 62, TOP 2.06 | 80 EUR | 3,80 % |
| `vivienda-pluddemanngasse-101-graz` | Plüddemanngasse 101 | 84 EUR | 3,58 % |
| `local-de-estanco-klagenfurt` | Kohldorfer Straße 102 | 95 EUR | 3,46 % |
| `vivienda-sonnleithnergasse-2-viena` | Sonnleithnergasse 2 | 75 EUR | 3,42 % |
| `randhartingergasse-9-viena` | Randhartingergasse 9 | 60 EUR | 3,09 % |

## Integración y comprobación

La recuperación debe incorporarse al flujo de catálogo de Supabase mediante un
nuevo corte revisable. El archivo no modifica el antiguo `verificadaEl`, su TTL,
`estadoRevision`, precio, rentabilidad ni disponibilidad. La interfaz puede
conservar esta documentación cuando caduquen las cifras comerciales, siempre
mostrando las fechas y el alcance de cada referencia.

Comprobaciones locales: 28 slugs exactos; estructura requerida; fechas ISO reales;
fecha del dato no posterior a la consulta y consulta no posterior a revisión;
URLs HTTPS sin credenciales; fuente de cada referencia incluida en la ficha;
26 revisiones del 27/09 y 2 consultas efectivas del 30/09. El cotejo de las doce
tarjetas Brickwise se realiza contra el registro Markdown del 27/09, no contra
una nueva consulta supuesta.

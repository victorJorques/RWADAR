# Investigación del catálogo · 5 de noviembre de 2026

Víctor la pidió el 05/11 hacia las 07:50 UTC: «Hazme la investigación de hoy de
las ofertas, y actualiza la web y la app». Ese mismo día quedó aplicada en
Supabase, publicada en la web y enviada a la app.

Carpeta completa: `rwadar-app/data/verificaciones/2026-11-05-v2/`
(`DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, `REVISION-ENTREGA.md`,
`expedientes/`, `revision-independiente/`).

## 1. En pocas palabras

- **Las 24 ofertas publicadas siguen**, revisadas hoy con sus fuentes
  oficiales. Cambian datos:
  - **Spiko:** Euro sube del 2,34 % al **2,39 %**, Dólar del 3,95 % al
    **3,99 %** (en dólares) y Smart Cash se queda en el **2,84 %** (datos del
    04/11).
  - **Brickwise (reventa):** precio más barato del día por participación.
    Plüddemanngasse baja de 80 a 75 €, Schwarzer Weg de 69,90 a 66,67 € y
    Pottendorfer de 78 a 74 €; Hinterstoder sube de 72 a 77 €. Las demás siguen
    igual. Los avisos de alquiler llevan ahora su fecha.
  - **Aktionariat, Boss Info y Switzerlend:** vender a otro accionista cuesta un
    **1,9 %** (antes figuraba un 0 %, que era solo el de la compra). En Boss Info
    y Switzerlend, las condiciones de su portal admiten a residentes de Suiza y
    del EEE, con un tope de 100.000 € para el EEE.
  - **BILLA, Casa de Outeiro y Hausera:** el dato de hoy. BILLA sigue en 82 de
    5.000 participaciones. Casa de Outeiro sigue en 1.121.000 € de 2.000.000 € y
    Alius no amplía el plazo. Hausera abrió la preventa de Alicante 2 el 04/11,
    anuncia la oferta pública para el 11/11 y aún no publica el documento de
    emisión ni el emisor.
  - **mTBILL:** nuevo valor por token (1,0773 USD). La web de Midas pone a España
    entre sus 14 países. Sigue el conflicto de límites de reembolso.
  - **Kraken xStocks:** sigue sin condiciones finales que incluyan España; el
    aviso se queda.
- **Hoy no entra ninguna oferta nueva.** De las 9 candidatas estudiadas, ninguna
  cumple todo lo que exigimos para un particular en España (§3).
- **Radar:** 67 de 67 fuentes dicen lo que respaldan. La fuente de PAX Gold pasa
  a paxg.com, que sigue diciendo que no está disponible en la UE. REGAFI se leyó
  por su API porque la página daba error 502.
- **Tarjetas más sencillas** (petición de Víctor del mismo día): en la lista de
  Ofertas cada tarjeta enseña solo el título, la empresa y el lugar, el mínimo,
  si se puede desde España y una flecha. Lo demás está en la ficha. Igual en la
  web y en la app.

## 2. Cómo se hizo

- 7 grupos investigaron en paralelo, cada uno con un expediente por oferta y las
  fuentes primarias leídas ese día. Después, un revisor distinto por grupo volvió
  a abrir las fuentes de cada cambio importante.
- El coordinador fijó lo que entraba (`DECISIONES-COORDINADOR.md`): solo lo
  confirmado por los revisores, con sus correcciones.
- Montaje de la entrega y ensayo en PGlite. Revisión independiente del SQL
  («aprobado con cambios») y sus correcciones aplicadas. El coordinador volvió a
  comprobar el SQL corregido: mismo inventario de sentencias, solo cambian la
  fecha tope y las 18 filas corregidas.
- Se recortaron los nombres de personas físicas que aparecían en copias de
  fuentes de Alius y Hausera. La entrega se unió desde una rama limpia de un
  solo commit.

## 3. Candidatas (ninguna entra hoy)

| Candidata | Por qué no entra |
|---|---|
| Bono Valorix (Bit2Me STX) | Sigue anunciado para diciembre, sin documento de emisión. |
| CANDO1 (Token City) | «En estudio»: sin documento de emisión ni inscripción. Es la pista española más seria. |
| Hausera ETI (Portfolio) | Es una nota estructurada sin token, compleja y de riesgo 6/7. |
| BeToken (Beself) | Su web de venta no responde y no hay mercado secundario ni entidad supervisada. |
| OKX Europe xStocks | La CNMV mantiene una advertencia sobre okx.com y el mínimo para el EEE no se publica. |
| Crypto.com Tokenized Stocks | El KID no es público y no se confirma que esté activo en España. |
| Assetera / Ondo Stocks | No publica mínimo ni costes, y el emisor limita la emisión en el EEE a profesionales. |
| Bybit EU | Sin licencia MiFID para acciones tokenizadas. |
| Franklin grBENJI | El folleto dice que la app para particulares aún no está disponible. |

## 4. Qué está publicado y comprobado

- **Supabase:** «Aplicar catálogo», entrega `2026-11-05`. Antes de aplicar, a
  las 14:57 UTC, la publicada era la `723968ce`. Después, a las 14:59 UTC, la
  `cede1f27`: 25 plataformas y 24 ofertas (8/13/3), verificadas el 05/11, que
  valen hasta el 12/11.
- **Web:** «Publicar web», en preview y después en producción
  (https://rwadar.pages.dev).
- **App Android:** el catálogo le llega solo desde Supabase. La OTA lleva las
  tarjetas nuevas y los textos de transparencia del 05/11 (runtime 1.4.1(23)).

## 5. Pendiente

- **PAX Gold:** la dirección vieja sigue en `public.plataformas.web` (botón «Ir a
  la web de Pax Gold» y JSON-LD). Hay que cambiarla con un SQL aparte.
- **Spiko:** el texto de acceso de la plataforma en el radar dice todavía «No
  hemos comprobado en la CNMV…».
- **Hausera:** la ilustración dice Alicante y el activo está en Orihuela Costa
  (La Zenia).
- **Datos personales:** hay copias con nombres de personas en
  `2026-11-01-v2` y `2026-11-03.3-v2`, ya en `main`.
- **Transparencia:** 4 de las 48 comprobaciones conservan la fecha del 03/11
  porque hoy no se volvió a leer su fuente.
- **Seguimiento:** Casa de Outeiro, retirarla si el 10/11 sigue sin avance;
  Hausera, revisarla a partir del 11/11; BILLA, plazo vencido sin prórroga
  (propuesta de retirada si el 15/11 sigue igual; decide Víctor).

# Investigación del catálogo · 10 de noviembre de 2026

Víctor la pidió el 10/11 hacia las 08:55 UTC: «Hazme la investigación en
profundidad de RWAdar buscando nuevas ofertas y publica la actualización de
hoy». Después pidió «una investigación de calidad», subir el nivel con expertos
y, para Inicio, un gráfico de la tokenización en el mundo y una sección de
noticias del sector. Todo quedó aplicado en Supabase, publicado en la web y
enviado a la app ese mismo día.

Carpeta completa: `rwadar-app/data/verificaciones/2026-11-10-v2/`
(`DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, `REVISION-ENTREGA-sql.md`,
`-contenido.md`, `-cumplimiento.md`, `VERIFICACION-ENTREGA.md`, `expedientes/`,
`revision-independiente/` y `noticias/`).

## 1. En pocas palabras

- **Las 22 ofertas publicadas siguen**, revisadas hoy con sus fuentes
  oficiales. Cambian:
  - **Spiko:** Euro sube del 2,39 % al **2,44 %** y Dólar del 3,99 % al
    **4,09 %** (en dólares); Smart Cash Euro se queda en el **2,84 %** (datos
    del 09/11). La AMF ya publica la ficha de Smart Cash Euro y se quita el
    aviso que decía que no la tenía.
  - **Brickwise (reventa):** Hinterstoder baja de 77 a **75 €**, Schwarzer Weg
    de 66,67 a **65 €** y Stallhofstraße de 69,90 a **68,80 €**; las demás,
    igual con fecha 10/11.
  - **Hausera:** Alicante 2 se cubrió en la preventa. La siguiente es
    **Alicante 3** (14 viviendas en Orihuela Costa): preventa el 18/11 y
    suscripción desde el 25/11; su documento de emisión ya es público.
  - **Boss Info:** hubo una operación entre accionistas el 05/11 (1 acción a
    8,40 ZCHF).
  - **mTBILL:** valor por token 1,0776 USD (09/11).
  - **Aktionariat, Switzerlend, Robinhood, Kraken y Prosegur:** sin cambios,
    comprobados hoy.
- **Hoy no entra ninguna oferta nueva.** Se estudiaron unas 30 candidatas en
  España, Europa y plataformas de acciones, fondos y deuda tokenizados (§3).
- **Radar:** 69 de 69 fuentes dicen lo que respaldan.
- **Inicio estrena dos secciones** (web y app): «La tokenización en el mundo» y
  «Noticias del sector» (§5).

## 2. Cómo se hizo

- 8 grupos investigaron en paralelo y una segunda oleada barrió registros
  oficiales, novedades y las plataformas del radar sin oferta. Cada grupo pasó
  por un revisor independiente que volvió a abrir las fuentes.
- La entrega la montó un agente y la revisaron tres expertos independientes
  (SQL e integridad; contenido y tarjetas; cumplimiento normativo). Un auditor
  comprobó que las correcciones no cambiaron el SQL.
- Se recortaron nombres de personas en copias de fuentes de hoy y en copias
  antiguas que ya estaban en `main`.
- A media mañana el límite de uso de la cuenta cortó tres agentes (el montaje,
  el panel de Alan Frei y la investigación de Securitize). El montaje se repitió
  entero por la tarde.

## 3. Candidatas (ninguna entra hoy)

| Candidata | Por qué no entra |
|---|---|
| Alan Frei Company (Aktionariat) | Empresa pequeña en pérdidas, cuentas sin auditar, sin supervisión ni folleto, recompra con 480 ZCHF. Decisión del coordinador. |
| Securitize Stocks (Securitize Europe, CNMV n.º 327) | Ninguna fuente dice que un particular en España pueda comprar hoy; exige monedero propio de Solana en lista blanca y USDC; sin KID. **Vigilar.** |
| Pagarés tokenizados de Prosegur Cash | Inscritos en la CNMV (ERIR de Minos, 06/11), sin documento ni condiciones públicas. **Vigilar.** |
| Profitus / Axiology (bonos digitales) | Plataforma supervisada y en la CNMV, pero hoy sin bonos abiertos. **Vigilar.** |
| Hausera Alicante 2 | Cubierta en la preventa. |
| Bono Valorix (Bit2Me STX) · CANDO1 (Token City) | Siguen sin documento de emisión. |
| Reental Rentas 4 | Colocación privada para inversores cualificados, sin entidad en la CNMV. |
| Toketuk (Tokenix) | No es un valor, sin supervisión, no se puede vender. Evitar. |
| OilXCoin, Oceanpoint, Bergfürst, Reinvest24 | Sin acceso desde España / sin licencia / en liquidación / advertencia de la CNMV. |
| Coinbase, Amundi, Blockchain.com/Ondo, eToro, Gate | Solo ADGM / sin ISIN ni KID / sin ESI en la CNMV / «próximamente» / solo derivados. |
| Robin des Fermes · Revario | Sin salida. |

## 4. Qué está publicado y comprobado

- **Supabase:** «Aplicar catálogo» con la entrega `2026-11-10`. Antes, a las
  17:25 UTC, la publicada era la `88d5a757`; después, a las 17:27 UTC, la
  `dfdc4c85`: 25 plataformas y 22 ofertas (8/13/1), verificadas el 10/11, que
  valen hasta el 17/11.
- **Web:** «Publicar web» en preview y en producción (https://rwadar.pages.dev).
- **App Android:** OTA con la transparencia del 10/11 y las dos secciones
  nuevas de Inicio.

## 5. Inicio: tokenización y noticias

- **La tokenización en el mundo.** Valor total de los activos tokenizados y
  reparto por tipo, con el cambio en 24 h. Los datos son de CoinGecko, gratis y
  citados, leídos por el servidor de RWAdar: el visitante no habla con
  terceros. No hay datos gratis fiables por país ni por blockchain. La semana,
  el mes, el año y el histórico se rellenan solos con la foto diaria que guarda
  el flujo «Tokenización diaria» desde el 10/11. Nunca se enseña una cifra sin
  una foto real.
- **Noticias del sector.** 8 noticias: 3 «Hoy» y 5 «Lo más importante». Las
  eligieron dos analistas y un redactor jefe, y las comprobó un verificador
  independiente. Titulares propios con gancho, tarjetas de ilustración propia
  y detalle con la fuente. Se renuevan en cada investigación.

## 6. Pendiente

- Hausera: preventa de Alicante 3 el 18/11, suscripción el 25/11 y su
  inscripción en el ERIR de Ursus-3.
- Prosegur Cash (pagarés), Securitize Stocks y Profitus: vigilar si publican
  condiciones para particulares.
- Kraken (documentoEspana) y mTBILL (supervisada) siguen con la comprobación
  del 05/11 en transparencia: la próxima entrega debe volver a leer esas
  fuentes exactas.
- Desde la próxima entrega, la referencia interna del SQL dirá «el responsable
  del proyecto».

# Decisiones del coordinador · entrega 2026-11-10

Claude, 10/11/2026. Ciclo pedido por Víctor («Hazme la investigación en
profundidad de RWAdar buscando nuevas ofertas y publica la actualización de
hoy»; después: «investigación de calidad», «sube el nivel», «expertos»). Base:
la publicada `88d5a757-3481-f70e-dc7c-6272704a00b3` (entrega `2026-11-05.2`,
huella `88d5a7573481…f789a8`), leída como visitante a las 08:58 UTC
(`lectura-publica/`).

Fuentes de estas decisiones: `expedientes/`, `grupos/*/resumen-*.md` y los
informes de `revision-independiente/` (un revisor distinto por grupo).
**Solo entra lo que el revisor dejó `confirmado` o `confirmado_con_cambios`,
con sus correcciones obligatorias aplicadas. Lo `rechazado` no entra.** Las
correcciones de los revisores a expedientes de candidatas `no_admitir` valen
como están en su informe (no se publican).

**Una sola entrega hoy.** Esta, `2026-11-10`, pone al día las 22 ofertas
publicadas y no da ninguna alta. Estaba previsto que las altas que superaran
el panel de tres revisores (regulación, producto y cifras/riesgos) fueran en
una entrega aparte, `2026-11-10.2`, pero ninguna candidata llega (§3).

## 1. Lo general

- **Etiqueta `2026-11-10`.** Las 22 ofertas, revisadas hoy con fuentes
  primarias: `verificadaEl = 2026-11-10`, `vigenciaDias = 7` (último día
  vigente el **17/11/2026**; la guarda del SQL no deja aplicarlo después). Las
  mismas 22, en las mismas colecciones (8 / 13 / 1). Sin altas ni retiradas.
- **Radar:** `verificadoEl = 2026-11-10` con `radar-contraste-2026-11-10.json`
  (69/69). Tres fuentes leídas a mano y registradas en `cambios-radar.json`,
  `verificacionesManuales`: las dos de REGAFI (la página carga sin datos; se
  leyó su API pública) y la de la OCC (el navegador no recibió el PDF; curl sí).
  La comprobación de `spiko-access` cambia («ORIAS» → «redeem fund shares»;
  `comprobacionesCambiadas`), sin cambiar ningún texto del radar. Hoy no cambia
  ninguna dirección ni ningún texto de plataforma: **no se toca
  `public.plataformas` ni `public.fuentes`**.
- **Estados de revisión:** no cambian (principales `actual`; mTBILL
  `fuentes_en_conflicto`; reventa y próximas `no_verificable`, como exige la
  base de datos para las documentales).
- **Avisos:** cada aviso publicado se comprobó hoy (los informes lo dicen uno
  a uno) y pasa a `verificadaEl = 2026-11-10`. Los que llevan fecha o dato del
  día se reescriben con el dato de hoy (abajo). No se re-fecha ningún aviso que
  no se haya vuelto a comprobar.
- **Tres datos de la tarjeta** (referencias con etiqueta fija «Mínimo de
  inversión», «Acceso desde España», «Salida»/«Reembolso»): los publicados se
  conservan con `fechaConsulta = 2026-11-10` salvo los que cambian abajo.
- **Brickwise, formato del mínimo en reventa:** «Desde X € la participación en
  reventa (10/11)» (nunca «por participación»: el lector de la tarjeta lo
  descarta).
- **`transparencia.json`** se pone al día **después de aplicar** el SQL
  (`despues-de-aplicar.mjs`): fecha 10/11 solo donde el expediente de hoy volvió
  a consultar esa misma fuente; mínimos cortos nuevos de Brickwise y Hausera.
  Además, por las correcciones obligatorias de la revisión de la entrega
  (`REVISION-ENTREGA-*.md`; las escribe aquí el montador por encargo del
  coordinador, «aplica todas las obligatorias», y no cambian el SQL):
  - **Hausera, «documentoEspana»** (SQL-2, C2 y O2): sigue «no cumple», con
    motivo «El documento de emisión de Alicante 3 es público, pero no es un
    folleto ni un KID: la CNMV no lo ha revisado y el 10/11/2026 la emisión aún
    no estaba inscrita. Además, sus documentos no coinciden en cuánto hay que
    colocar para que la emisión siga adelante.», fuente «Hausera ·
    documento de emisión de Alicante 3 (portada: «no es considerado un folleto
    informativo»)» (`https://drive.google.com/file/d/1cpWVN3J_Y1xdRDAxUzGnjmWXB-eTODH_`)
    y consulta del 10/11/2026. Sustituye al motivo del 05/11 sobre Alicante 2,
    que ya no es cierto. Sin las cifras «50 % o 70 %» que proponía O2: las reglas
    de `transparencia.mjs` no admiten «%» en estos textos y así no se publica
    ninguno de los dos mínimos; basta con decir que los documentos no coinciden.
  - **Switzerlend, mínimo corto** (C1): «1 acción (68,01 CHF, 10/11)», como la
    ficha («…el 10/11»).
  - **Hausera, salida corta** (C3 y O1): «Al vender las viviendas, sin fecha
    fija». Sin ella, «Lo esencial» recortaba la salida a «Cobras cuando se venden
    las viviendas…».
  - La app lleva `transparencia.json` empaquetado: después de aplicar, **la OTA
    hace falta** (O1), además de publicar la web.

## 2. Por oferta (antes → ahora)

### Spiko Letras del Tesoro Euro
- Rentabilidad 2,39 % → **2,44 %** (rendimiento neto anualizado de 31 días que
  publica Spiko, VL del 09/11/2026, consultado y recalculado el 10/11/2026:
  1,060378 € el 08/10 → 1,062624 € el 09/11). Métrica, literal y referencia
  «Rentabilidad publicada · 31 días» (fechaDato 09/11, consulta 10/11).
- Nada más cambia en la ficha (documentos con el mismo SHA-256; registros
  iguales).

### Spiko Letras del Tesoro Dólar
- Rentabilidad 3,99 % → **4,09 %** en USD (VL del 09/11/2026: 1,098694 $ el
  09/10 → 1,102439 $ el 09/11). Métrica, literal y referencia.
- Aviso del límite de reembolso del 10 %: se añade al final «, aunque la web de
  Spiko diga que no hay límite de importe» (opción que da el revisor; la web en
  español dice «sin preaviso y sin límite de importe» y el folleto permite
  limitar a partir del 10 %).

### Spiko Smart Cash Euro
- Rentabilidad **2,84 %** con fecha nueva (VL del 09/11, consulta del 10/11).
  Métrica, literal y referencia «Rendimiento neto publicado».
- **Se quita el aviso** «El enlace de la web de Spiko para “Verificar la
  autorización” lleva a la base pública de la AMF (GECO), pero allí este fondo
  todavía no tiene ficha publicada…»: ya no es cierto (GECO publica la ficha
  c124199).
- Métrica «Supervisor» → «AMF (Francia): n.º SCV20260075, autorizado el
  17/02/2026 (ficha en su base GECO, aún sin clases de acciones ni valor
  liquidativo) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra
  qué fondos de la SICAV están dados de alta en España».
- Documentación: descripción y referencia «Aprobación del compartimento» →
  «autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en
  GECO y certificado de la AMF del 23/02/2026)», fuente
  `https://geco.amf-france.org/produit-d-epargne/c124199`, consulta 10/11/2026.
- «Acceso desde España» y el aviso 2 se conservan tal cual: nadie confirma ni
  niega hoy la comercialización del compartimento en España.

### Robinhood Classic Stock Tokens · Kraken xStocks · Prosegur Digital Gold
- Sin cambios críticos (mismos documentos, registros y avisos; revisor:
  confirmado). Solo las fechas de verificación. El primer aviso de Kraken se
  queda: ninguna condición final del emisor incluye España.

### mTBILL
- Métrica «Valor por token · 04/11/2026: 1,0773 USD (oráculo del emisor)» →
  «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)».
- Sin más cambios. **Ningún texto** usa la lista blanca desactivada como prueba
  de acceso (corrección obligatoria del revisor). Estado `fuentes_en_conflicto`
  y aviso de los límites de reembolso, igual.

### Aktionariat
- Fechas al 10/11/2026: métrica «Precio del emisor · 10/11/2026: 7,25 CHF por
  acción (fijo)», «Supervisor» («…FINMA (10/11/2026)») y el aviso de vendedores
  «(6,20 ZCHF frente a 7,25 CHF el 10/11/2026)».

### Boss Info (reventa)
- **Nueva operación entre accionistas** el 05/11/2026 (1 acción a 8,40 ZCHF):
  el resumen y la descripción que dicen «la última operación fue … a 6,70 el
  28/09/2026» se reescriben con la operación del 05/11, con la moneda («8,50
  CHF» del emisor, «8,40 ZCHF» entre accionistas; recomendación del revisor).
- Referencia nueva de la ficha: «Última operación · 10/11/2026: 8,40 ZCHF (1
  acción, 05/11/2026)». Se quitan «Último cruce publicado» (6,70, 28/09),
  «Última operación publicada · 22/10/2026» y «Último cruce secundario ·
  22/10/2026» (corrección obligatoria).
- Aviso «El precio del emisor está por encima de la mejor oferta de venta entre
  accionistas» → con cifra y fecha, como en Switzerlend: «… (venta más barata
  8,40 ZCHF el 10/11/2026)».
- «Mínimo de inversión» y «Supervisor» con fecha 10/11 (mismo contenido).

### Switzerlend (reventa)
- Fechas al 10/11/2026 en el aviso de la recompra («…el 10/11/2026 la recompra
  seguía desactivada y casi sin fondos (0,03 ZCHF)»), en el aviso de vendedores
  («venta más barata 67,00 ZCHF el 10/11/2026»), en el mínimo («1 acción (68,01
  CHF el 10/11)») y en «Supervisor».

### Brickwise, 11 de reventa
Mínimo («Desde X € la participación en reventa (10/11)»; venta más barata del
día en la API pública, idéntica a las 09:01 y a las 09:17 UTC):

| Ficha | 05/11 | 10/11 |
|---|---|---|
| Hinterstoder 50 | 77 | **75** |
| Schwarzer Weg 18 (Graz) | 66,67 | **65** |
| Stallhofstraße 28 (Gratwein) | 69,90 | **68,80** |
| Drautalresidenz (Paternion) | 70 | 70 |
| Fotovoltaica Cohotel | 110 | 110 |
| Fotovoltaica Greenpoint | 100 | 100 |
| Randhartingergasse 9 (Viena) | 78 | 78 |
| Local de estanco (Klagenfurt) | 95 | 95 |
| Plüddemanngasse 101 (Graz) | 75 | 75 |
| Pottendorfer Straße 62 | 74 | 74 |
| Sonnleithnergasse 2 (Viena) | 75 | 75 |

- Referencias «mejor oferta de compra» de la ficha, confirmadas por el revisor:
  Drautal 54 → 60 €, Randhartingergasse 40,50 → 46 €, Hinterstoder 65 → 20 €,
  Greenpoint 89 → 84 €; las demás, con fecha nueva si se volvieron a leer.
- Acceso, salida, comisión (1,5 %) y avisos de alquiler: sin cambios
  (comprobados hoy).
- Ratificado por la corrección SQL-1 de la revisión de la entrega (texto del
  revisor, tal cual; no cambia el SQL): Referencias del libro de órdenes con la
  lectura del 10/11 confirmada por el revisor: «Venta más barata · 10/11/2026»
  (precio de la tabla, con la fecha o el número de órdenes) y «Participaciones
  en venta · 10/11/2026» (Stallhofstraße 313 → 317, Schwarzer Weg 305 → 300,
  Randhartingergasse 184 → 189, Hinterstoder 258 → 265; las demás, iguales).

### Hausera · próximas ofertas (en camino)
Alicante 2 se cubrió en la preventa y el seguimiento pasa a **Alicante 3** (14
viviendas en La Zenia, Orihuela Costa; el lugar de la ilustración sigue valiendo).
Todo según el expediente y su revisión (`espana-proximas`, aprobado con
cambios):
- Resumen y métricas: «Próxima operación: Alicante 3 · preventa desde el
  18/11/2026, suscripción del 25/11/2026 al 30/06/2027», «Emisor: HAUSERA
  PROPERTY MANAGER SPV 11, S.A (documento de emisión de Alicante 3)»,
  «Supervisor» (sin registro en la CNMV; emisión sin folleto, pendiente de
  inscribir por Ursus-3 Capital A.V., CNMV n.º 251) y «Comisiones: Ninguna para
  el suscriptor; Hausera cobra con la plusvalía que supere el tope del
  inversor» (texto recomendado por el revisor, sin cifras).
- Tarjeta: mínimo «Desde 100 € en Alicante 3, según su documento de emisión
  (10/11); la preventa abre el 18/11.»; acceso «Emisión española para
  particulares que pasen el test de idoneidad del emisor; Hausera no está
  registrada en la CNMV.»; **salida (corrección obligatoria):** «Cobras cuando
  se venden las viviendas (previsto en 20 meses, sin fecha cierta); sin mercado
  secundario garantizado.»
- Avisos: los seis del expediente (el de la reserva sustituye al del 05/11;
  entran «sin folleto ni revisión de la CNMV, no inscrita el 10/11» y «Alicante
  2 se cubrió en la preventa»).
- Referencias: se quitan las tres de rentabilidad de octubre (eran de Alicante
  1); el historial pasa a «42 operaciones, 24 terminadas, 128 M€ financiados»
  como cifras del promotor (10/11). Fuentes: las del expediente (oportunidades,
  ficha de Alicante 3, documento de emisión, términos, ERIR de la CNMV).
- **No se publica** el mínimo de emisión de Alicante 3 (conflicto 50 % / 70 %).
  (El motivo nuevo de «documentoEspana», §1, dice que sus documentos no
  coinciden, sin cifras; el SQL sigue sin ninguna de las dos.)
- Ratificado por la corrección SQL-1 de la revisión de la entrega (texto del
  revisor, tal cual; no cambia el SQL): Documentación, característica «Emisor»:
  «SPV del Grupo Hausera identificada en cada documento de emisión (para
  Alicante 2, no publicada)» → «Una sociedad por operación, identificada en su
  documento de emisión; la de Alicante 3 es HAUSERA PROPERTY MANAGER SPV 11,
  S.A» (expediente, campo emisor; revisión: emisor confirmado). Sale la métrica
  «Coste de Hausera» («Sin comisión por invertir (FAQ)»), sustituida por
  «Comisiones».

## 3. Candidatas (ninguna entra en esta entrega)

| Candidata | Por qué no entra hoy |
|---|---|
| Hausera Alicante 2 | Se cubrió en la preventa: no se puede comprar. |
| BILLA (Brickwise) | Igual que cuando se retiró el 05/11 (82 de 5.000; plazo vencido). |
| Bono Valorix (Bit2Me STX) · CANDO1 (Token City) | Siguen sin documento de emisión. |
| Pagarés tokenizados de Prosegur Cash | Inscritos en la ERIR de Minos (06/11), sin documento ni condiciones públicas. **Vigilar.** |
| Reental Rentas 4 | Colocación privada (inversores cualificados o < 150 por país), sin entidad en la CNMV. |
| Toketuk (Tokenix) | No es un valor, sin supervisión, no transmisible, no devuelve lo aportado. Evitar. |
| Profitus / Axiology | Plataforma ECSP en la CNMV y bonos en un sistema DLT autorizado, pero hoy sin bonos abiertos. **Vigilar.** |
| OilXCoin (Dexentra) | En Assetera como mercado privado, sin acceso desde España confirmado; sin rendimiento ni salida. |
| Oceanpoint (Blocksquare) | Operador sin licencia ECSP, MiFID ni CASP. |
| Bergfürst · Reinvest24 | En liquidación · advertencia de la CNMV (09/06/2025). |
| Coinbase, Amundi, Blockchain.com/Ondo, eToro, Gate | Ver expedientes de `candidatas-mercados` (solo ADGM, sin ISIN/KID, sin ESI en la CNMV, «próximamente», licencia solo de derivados). |
| Robin des Fermes · Revario (Aktionariat) | Sin salida (sin recompra ni mercado entre accionistas). |
| Alan Frei Company (Aktionariat) | Decisión editorial del coordinador (el panel de tres revisores no llegó a terminar: lo cortó el límite de uso de la cuenta). El revisor del grupo la dejó «confirmada con cambios», pero no cumple el enfoque de Víctor para los clientes: empresa pequeña en pérdidas (−245.285 CHF en 2025 con 99.230 CHF de ingresos), cuentas sin auditar, emisor sin supervisión y sin folleto, precio fijado por el propio emisor, recompra con solo 479,80 ZCHF y sin obligación, y un objeto social inscrito que mezcla actividades reales con otras en tono de broma. «Mejor pocas ofertas excelentes que muchas dudosas.» |
| Securitize Stocks (Securitize Europe, S.V., CNMV n.º 327) | Pista de la segunda oleada; su investigación a fondo no terminó (límite de uso). Lo leído hoy no basta: ninguna fuente dice en claro que un particular en España pueda comprar hoy («to eligible investors in permitted jurisdictions, subject to onboarding»; la página abre con «tokenized stocks are here for U.S. investors»), solo se opera con un monedero propio de Solana en lista blanca y USDC (más que un KYC normal), no hay KID y el token no se reembolsa en efectivo. **Vigilar.** |

Por eso hoy no hay entrega `2026-11-10.2`.

## 4. Datos personales

Recortados antes de cualquier commit: nombres y direcciones en copias de
Brickwise, Spiko (firmante de la carta de la AMF), Switzerlend, Profitus,
Rabobank/NN, Reental, eToro y el menú del Banco de Lituania, también en las
copias antiguas ya en `main`. Los PDF y HTML con nombres van a `crudo/` (fuera
de Git) con su SHA-256 en el inventario.

Añadidos por las correcciones SQL-3 y O3 de la revisión de la entrega (rutas
desde esta carpeta; cada nombre pasa a «[persona física recortada]» y se
conserva el cargo):
- `grupos/ampliacion/fuentes/crowdedhero/home.txt`, `project-44.txt`,
  `project-45.txt`, `project-49.txt` y `project-50.txt`;
- `grupos/candidatas-mercados/fuentes/coinbase-nvdac-prospectus.txt`;
- `grupos/ampliacion-1/fuentes/press-stocks.txt` y `stocks-aapl.txt`;
- `grupos/ampliacion/fuentes/radar-sin-oferta/securitize-press-stocks.txt`,
  `securitize-stocks-aapl.txt`, `securitize-home.txt`, `ondo-home.txt` y
  `lofty-home.txt`;
- `grupos/ampliacion/fuentes/novedades/rhj_ft_aal.txt` (también las formas en
  búlgaro y letón), `rhj_base_prospectus.txt` y
  `rhj_base_prospectus_supplement_09_november_2026.txt`;
- `grupos/ampliacion/fuentes/navegador/conda-cooee-alpin-nachrangige-anleihe-der-you-will-like-it-hotels-gmbh.txt`;
- `grupos/acciones-oro-tesoro/fuentes/xstocks-fi-us.txt`;
- Brickwise: `grupos/brickwise/fuentes/brickwise/web-home-2026-11-10.txt`,
  `revision-independiente/fuentes/brickwise/web-home-revisor-2026-11-10.txt`,
  `grupos/brickwise/fuentes/reguladores/fma-busqueda-web-investor-warning.txt`
  y `revision-independiente/fuentes/brickwise/reguladores/fma-busqueda-investor-warning.txt`.
  `grupos/brickwise/fuentes/brickwise/info-AT0000A324B4.pdf.txt` (línea 2044)
  ya estaba recortado.

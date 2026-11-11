# Revisión independiente de cumplimiento · entrega 2026-11-11

Revisión de cumplimiento normativo: MiFID II, MiCA, Reglamento de Folletos
(UE) 2017/1129, Reglamento (UE) 2020/1503 de financiación participativa,
régimen piloto DLT, Circular 2/2020 de la CNMV y Ley 6/2023 de los Mercados de
Valores. No monté esta entrega. Solo lectura: no toqué Supabase, no publiqué,
no lancé flujos ni hice commit. Fuera de este archivo no edité nada. Las
consultas de hoy son de páginas públicas, solo con GET. Revisor: Claude,
11/11/2026, de 14:46 a 15:20 UTC.

**Veredicto: `aprobado_con_cambios`.** El SQL se puede aplicar tal cual. Su
SHA-256 sigue siendo
`dfeba19516b2b688ddf4f8ad4ba1feb5049dbaae164b2d1abcee951ccb26a3cb` (lo
comprobé a las 15:14:28 UTC). `transparencia.json` sigue en `67e89ba3…2ea8`.

- Ningún texto nuevo o re-fechado promete rentabilidad, garantía ni liquidez.
- Las tres rentabilidades de Spiko llevan base, fecha y «no garantizado», y
  coinciden con lo que publica Spiko a las 15:02 UTC.
- Cada «España: Sí» se apoya en una fuente primaria que lo dice. Las demás
  salen como «Sin comprobar» o «Sin confirmar».
- El botón al proveedor queda igual que hoy en las 22 fichas: 5 «Ver oferta en
  X» y 17 «Ir a la web del proveedor (sales de RWAdar)».
- Ninguna entidad de las fichas tiene advertencias de la CNMV. Solo hay dos
  avisos sobre clones que usan el nombre de Payward y de Amundi, y no afectan.

Hay **una corrección obligatoria, y no cambia el SQL** (O1): nombres de
personas físicas en cinco archivos que ya están en Git. El resto son
recomendaciones. La que corre más prisa es la R2: la ficha de Hausera seguirá
vigente el 18/11, el día en que abre la preventa.

- Coincido con la C1 de `REVISION-ENTREGA-contenido.md` (Switzerlend). Desde
  cumplimiento no la exijo: las dos fechas son ciertas.
- Coincido con la recomendación 9 de `REVISION-ENTREGA-sql.md` (el nombre del
  responsable del proyecto en documentos internos).

## 1. Qué hice

- **Leí** `DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, los 63 cambios de
  `contraste-2026-11-11.json`, `escaparate-publicacion.json` y
  `documentacion-ofertas.json`. También los expedientes de las fichas con
  cambios, los tres informes de `revision-independiente/` y
  `despues-de-aplicar.mjs`.
- **La regla del botón, en tres sitios:**
  - `rwadar-fichas.js` (líneas 199–216 y 297–298);
  - `rwadar-site/assets/rwadar-20260820.js` (2471 y 2839–2843);
  - `rwadar-movil/componentes/Ofertas.js` (407, 455–458 y 500).

  Y su origen: punto 5.3 de `docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`
  (líneas 438–439).
- **Calculé con el código real** (`resumenOferta` de
  `rwadar-movil/lib/ficha-editorial.js`) el acceso, la supervisión, el
  documento para España y el botón de las 22 fichas. Usé el
  `transparencia.json` que deja `despues-de-aplicar.mjs` en el ensayo
  (`1959f8be…c66b`, el mismo SHA-256 que dan el montador y el revisor de SQL).
  Lo hice con lo publicado (10/11) y con la entrega (11/11, 18/11 y 19/11).
  Además leí el texto visible de las fichas fijas que generó el ensayo. Los
  scripts están en la carpeta temporal de la sesión, no en el repositorio.
- **Consultas propias de hoy:**
  - las tres listas de advertencias de la CNMV;
  - los registros de la CNMV: Spiko Finance, Robinhood, Payward, Effecta,
    Spiko SICAV y la ERIR de Ursus-3;
  - la API y la tabla de países de Spiko;
  - las condiciones de los portales suizos;
  - el texto consolidado de la Ley 6/2023 en el BOE.
- **Barrido de nombres** en los 349 archivos que están en Git: 346 de la
  carpeta del ciclo y los 3 de `importaciones/catalogo-2026-11-11-v2/`. Usé
  tres métodos:
  - tratamientos y cargos junto a un nombre propio;
  - un diccionario de 61.306 nombres de pila (paquete `gender-guesser`,
    instalado solo en la carpeta temporal);
  - las marcas de recorte que ya existen.

## 2. Ficha por ficha

### Spiko Letras del Tesoro Euro (2,44 % → 2,41 %)

- **Rentabilidad: cumple.** El literal dice: «Rendimiento neto anualizado de
  los últimos 31 días publicado por Spiko el 10/11/2026 (VL fechada el
  11/11/2026); consultado el 11/11/2026. Variable y no garantizado.» Lleva base,
  fuente, fecha y no garantía.
- **Lo comprobé** en `https://public-api.spiko.io/v0/share-classes/EUTBL/yield`
  (15:02:38 UTC): `"monthlyYield":"0.0241","updatedAt":"2026-11-10T17:55:23.019Z"`.
  Y en `…/net-asset-values/EUTBL/latest`: `"day":"2026-11-11…","value":"1.062738"`.
- **Avisos:** capital no garantizado y reembolso que puede limitarse (10 %).
- **Acceso: cumple.** Se apoya en dos fuentes:
  - la tabla de Spiko
    (`https://docs.spiko.io/documentation/product_overview/fund_availability`,
    15:02:38 UTC): «🇪🇸 Spain ✅ ✅ ✅ ❌ … Last updated: October 23, 2026»;
  - el pasaporte de Spiko Finance
    (`https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es`,
    14:56:03 UTC): «SPIKO FINANCE SASU … 5325 14/01/2026».
- **Botón:** «Ver oferta en Spiko». Falta la frase sobre rentabilidades
  pasadas (R3).

### Spiko Letras del Tesoro Dólar (4,09 % → 4,02 % en USD)

- **Rentabilidad: cumple.** Base, fecha, «No incluye la variación del euro
  frente al dólar. Variable y no garantizado.».
- **Lo comprobé** en `…/share-classes/USTBL/yield` (15:02:39 UTC):
  `"monthlyYield":"0.0402"`. La VL es del `2026-11-10` y vale `1.102496` USD.
- **Avisos:** riesgo de cambio y capital no garantizado. Sigue el límite de
  reembolso «aunque la web de Spiko diga que no hay límite de importe».
- **Acceso:** como en la de euros. **Botón:** «Ver oferta en Spiko».

### Spiko Smart Cash Euro (2,84 %, ahora con la VL del 10/11)

- **Rentabilidad: cumple.** Dice: «lo que creció el fondo en su último día de
  cálculo, pasado a un año (valor liquidativo del 10/11/2026; consultado el
  11/11/2026). Variable: sigue al €STR; no es un tipo fijo ni está
  garantizado.»
- **Lo comprobé** en `…/share-classes/eurSAFO/yield` (15:02:40 UTC):
  `"dailyYield":"0.0284","weeklyYield":"0.0284","monthlyYield":"0.0284"`. La VL
  es del `2026-11-10` y vale `1.016952`; se calculó a las 19:42:58 UTC del
  10/11. Spiko publica la misma cifra a 30 días (R6).
- **Avisos: los más completos del catálogo.**
  - Nadie confirma que el fondo esté dado de alta en España.
  - No es un depósito, y la web de Spiko dice «tipo fijo».
  - Riesgo de contraparte.
  - Límite de reembolso del 25 %.
  - La web confunde quién es la gestora.
- **Acceso: cumple la letra del criterio, con la duda a la vista.**
  - En la página de Spiko (15:02:38 UTC): «They can be distributed in France
    and, through the UCITS marketing passport, in every other country of the
    European Economic Area (EEA) where the share class has been registered»,
    y España aparece marcada en la columna Smart Cash.
  - La CNMV
    (`https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es`,
    14:56:01 UTC) solo enseña «SPIKO SICAV · 2380 · 30/01/2026 · SICAV ·
    FRANCIA», con dos pestañas («Datos generales» y «Entidades
    comercializadoras»). No muestra compartimentos.
  - El aviso 2 de la ficha lo dice.
- **Botón:** «Ver oferta en Spiko». Cumple la regla: se contrata desde España y
  Spiko Finance está supervisada. Pero `documentoEspana` está en «✗ No» (R1).

### mTBILL

- **Solo cambia** «Valor por token · 10/11/2026: 1,0777 USD (oráculo del
  emisor)». Está atribuido al emisor y la vista pública lo tapa: la ficha está
  en `fuentes_en_conflicto`.
- **Ningún texto usa la web de Midas como prueba de acceso.** «lista blanca»,
  «whitelist» y «allowlist»: 0 apariciones en `aplicar-y-aprobar.sql`. La
  referencia «Países de oferta según la web de Midas · consulta 05/11/2026»
  conserva su fecha.
- **No añadir el acceso «Sí: oferta pública en España…» también cumple.** Si se
  añadiera, se apoyaría en las condiciones finales, con España como país de
  oferta pública. Pero la tarjeta lo taparía igual.
- **Avisos: cumplen.** Emisor no supervisado, conflicto de fuentes, riesgo de
  cambio, pérdida total (7 de 7) y sin mercado secundario.
- **Botón:** «sales de RWAdar».
- Las referencias antiguas «APY observado» y «7D APY» no enseñan la cifra en la
  ficha fija: miré el texto visible de `rwadar-site/ofertas/mtbill.html` y solo
  salen la etiqueta y el alcance.
- Ver R8 sobre «garantizado por una cuenta de colateral».

### Aktionariat (principal), Boss Info y Switzerlend (reventa)

- **Cambian** las fechas, los mínimos de Boss Info y Switzerlend y los avisos
  con dato del día. Son hechos del libro de órdenes y de la cadena que el
  revisor de contenido volvió a leer (14:27 UTC). No hay ninguna frase del
  emisor presentada como hecho: la de Switzerlend dice «Su web dice que el
  emisor recompra…, pero el acuerdo firmado no le obliga…».
- **Acceso: cumple.** Las condiciones de los portales lo dicen, con lista de
  países:
  - `https://shares.bossinfo.com/investor-page-terms` y
    `https://shares.lend.ch/investor-page-terms` (15:03:07–15:03:08 UTC; la
    misma plantilla, «Version 1.0 • October 30, 2026»), §9.1: «The public
    offer to purchase the shares from the Company (Direct Investment) is
    exclusively addressed to persons domiciled or resident in Switzerland or
    the EEA … The offer for persons from the EEA is limited to a total of
    €100,000.»;
  - `https://www.aktionariat.com/disclaimer` (15:03:08 UTC) dice lo mismo.
- **Avisos:**
  - Aktionariat sí dice «Sin folleto ni KID … el emisor no está supervisado».
  - **Boss Info y Switzerlend no lo dicen en los avisos.** Solo está en la
    caja de transparencia («✗ No», con su motivo y su fuente) y en la métrica
    «Supervisor», que la vista pública tapa (R4).
- **Ley 6/2023:** ver R5.
- **Botón:** «sales de RWAdar» en las tres, porque ninguna está supervisada.

### Brickwise (11 de reventa)

- **Mínimos: cumplen.** Dicen «Desde X € la participación en reventa (11/11)»,
  con el alcance «El precio lo fija cada vendedor y cambia a diario. No es el
  precio de emisión.». Nunca se presentan como precio de emisión.
- **Avisos:** posible pérdida total (riesgo 6 de 7), solo reventa, acceso sin
  confirmar y documentación en alemán. **Acceso:** «Sin confirmar».
- **Lo comprobé** en la ficha de Effecta en la CNMV, pestaña Agentes
  (`https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5003&vista=8`,
  14:56:10 UTC): «Agentes No se han encontrado datos disponibles».
- **Pottendorfer:** a las 14:25 UTC apareció una venta a 69 €, según el
  revisor de contenido. No es un problema de cumplimiento: el dato va fechado,
  hay un aviso de que el libro cambia a diario y la diferencia favorece al
  comprador.
- **Botón:** «sales de RWAdar».
- Siguen las referencias de distribuciones esperadas (R7).

### Hausera (en camino)

- **No cambia ningún texto**, pero ahora la ficha vale hasta el 18/11, el día
  en que abre la preventa de Alicante 3 (09:00). La R2 de la revisión de
  cumplimiento del 10/11 pedía el aviso del 50 % / 70 % «antes de que abra la
  preventa el 18/11».
- **Lo comprobé** en la ERIR de Ursus-3
  (`https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es`,
  15:13:04 UTC). En la página 1 de 3 la inscripción más reciente es del
  23/10/2026 («HAUSERA PROPERTY MANAGER SPV 7, SA»); salen las SPV 2 a 8. La
  página avisa: «no implica que la CNMV haya validado las condiciones de la
  emisión».
- **Lo que está bien:**
  - los avisos cubren pérdida, iliquidez, que no hay folleto ni revisión de la
    CNMV y que el emisor usa el dinero de la reserva antes de la inscripción;
  - la contradicción del 50 % / 70 % se ve en el motivo de `documentoEspana`,
    en la web y en la app («sus documentos no coinciden en cuánto hay que
    colocar…»);
  - la regla de la Ley 6/2023 (art. 36.1, abajo) la cubre, según sus
    documentos, una empresa de asesoramiento autorizada que valida el
    documento y supervisa la comercialización;
  - el botón dice «sales de RWAdar».
- **Lo que falla el 18/11 (R2):**
  - la contradicción no está entre los avisos;
  - el alcance visible del mínimo dice «Hoy no se puede invertir: la preventa
    abre el 18/11/2026», que ese día ya no es cierto desde las 09:00;
  - el aviso «Las operaciones pueden cubrirse en la preventa…» puede leerse
    como un empujón a reservar justo ese día.

### Robinhood, Kraken xStocks y Prosegur Digital Gold (solo fechas)

- **Robinhood: cumple.** Se apoya en su pasaporte en la CNMV
  (`https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5299`,
  14:56:05 UTC): «ROBINHOOD EUROPE, UAB … 5299 21/04/2025». Botón: «Ver oferta
  en Robinhood Europe».
- **Kraken: cumple la regla del código, pero no la letra de la revisión
  legal (R1).**
  - El vendedor tiene pasaporte en la CNMV
    (`https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474`,
    14:56:08 UTC): «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED … 4474
    05/01/2018».
  - Los propios avisos de la ficha dicen que el folleto no cubre la venta en
    España y que el emisor (Backed Assets (JE), de Jersey) es del mismo grupo.
  - El punto 5.3 habla de «emisor no supervisado». El código, en cambio, mira
    la entidad que lo vende. El emisor no tiene autorización de un supervisor
    de la UE: la FMA aprobó su folleto, no la entidad.
- **Prosegur:** no está supervisada, así que el botón dice «sales de RWAdar».

## 3. Botón al proveedor (regla 5.3 del 06/11/2026)

Las tres implementaciones hacen lo mismo. Ponen «Ver oferta en X» solo si se
cumplen todas estas condiciones:

- la oferta es principal;
- `disponibleEs` es verdadero;
- `resumenOferta` da el acceso desde España como «sí», con fuente;
- `transparencia.json` tiene `supervisada` en «Sí», con la misma
  `verificadaEl`.

Si falta alguna, dicen «Ir a la web del proveedor (sales de RWAdar)».

| Ficha | Acceso | Supervisada | Doc. para España | Botón (hoy y tras aplicar) |
|---|---|---|---|---|
| Spiko Euro y Spiko Dólar | sí | Sí | Sí | Ver oferta en Spiko |
| Spiko Smart Cash Euro | sí | Sí | **No** | Ver oferta en Spiko |
| Robinhood Classic Stock Tokens | sí | Sí | Sí | Ver oferta en Robinhood Europe |
| Kraken xStocks | sí | Sí | **No** | Ver oferta en Kraken (Payward Europe Digital Solutions) |
| Prosegur Digital Gold, Aktionariat | sí | No | No | sales de RWAdar |
| mTBILL | sin comprobar | No | Sí | sales de RWAdar |
| Boss Info, Switzerlend | sí (reventa) | No | No | sales de RWAdar |
| Las 11 de Brickwise | sin comprobar | No | No | sales de RWAdar |
| Hausera | sin comprobar | No | No | sales de RWAdar |

- **Antes y después:** lo calculé con lo publicado (10/11) y con la entrega
  (11/11). No hay ninguna diferencia en acceso, supervisión, documento ni
  botón en las 22 fichas.
- **El 18/11** sale lo mismo. **El 19/11** no sale ningún «Ver oferta»: la
  ficha caduca y el acceso pasa a «sin comprobar».
- **Las fichas fijas** que generó el ensayo dicen exactamente esos 22 textos.
- **Entre aplicar el SQL y publicar la web y la OTA,** la web y la app no
  encuentran la transparencia de la misma fecha y ponen «sales de RWAdar» en
  todas (`transparenciaOferta` exige la misma `verificadaEl`). Fallan cerrado.
- **Ninguna ficha de reventa** enseña «Abrir mercado»: ninguna tiene
  `urlMercado`.

## 4. Advertencias de la CNMV (búsqueda propia, 11/11/2026)

Buscador: `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=N&nombre=<nombre>`.
Usé tres listas:

- `tipo=1`: «No autorizadas»;
- `tipo=4`: «Advertencias de reguladores extranjeros»;
- `tipo=5`: «Otras advertencias».

**Controles:**

- «Trading» (`tipo=1`, 14:51:47 UTC): «Página 1 de 16»; la primera advertencia
  es del 10/11/2026.
- «Gemini» (14:51:50 UTC): dos entidades.

El buscador funciona y está al día.

**Sin resultados («No hay datos disponibles»):**

- **En `tipo=1`, de 14:51:52 a 14:53:02 UTC:** Spiko, Twenty First, Aldana,
  Amundi, Midas, Aktionariat, Boss Info, Bossinfo, Switzerlend, lend.ch,
  Brickwise, Effecta, Brick Qogir, Brick Sagarmatha, BrickOne, Green-Point,
  Cohotel, Hausera, HOLDTX, Property Manager, Ursus, Robinhood, Kraken, Payward,
  Backed y Prosegur.
- **En `tipo=4` y `tipo=5`, de 14:53:40 a 14:55:45 UTC:** los mismos nombres
  principales (16), más Aldana, Lend AG, Brick Qogir y Green-Point. Hay dos
  excepciones, que son clones.

**Dos avisos sobre clones.** No se refieren a las entidades de las fichas:

- `tipo=5`, «Payward» (14:54:55 UTC):
  - «19/03/2025 · PAYWARD LTD (CLONE) · FSMA (BELGICA) · … ENTIDADES (ALGUNAS
    DE ELLAS UTILIZANDO DE MANERA INDEBIDA EL NOMBRE DE ENTIDADES LEGÍTIMAS …)
    … ESQUEMA DE RECOVERY ROOM»;
  - no es Payward Europe Digital Solutions (CY), n.º 4474.
- `tipo=4`, «Amundi» (14:55:21 UTC):
  - «12/02/2025 · AMUNDI BONDING SOLUTIONS LUXEMBOURG SA ISSUER PLC (CLONE) ·
    WWW.AMUNDIBOND.COM (CLONE) · CSSF (LUXEMBURGO)»;
  - no es la gestora delegada de Smart Cash.

Las dos fichas enlazan solo a los dominios oficiales (`eu.kraken.com` y
`spiko.io`).

**Plataformas del radar** (22 nombres, `tipo=1`, de 15:04:42 a 15:05:37 UTC):
ninguna advertencia sobre ellas. «INX», «Ondo» y «Republic» solo coinciden
como parte de otros nombres, por ejemplo «NEXCOINX», «LONDONBANK» o «TRADE
REPUBLIC BANK (CLON)».

No aparecer en el buscador no significa estar autorizado.

## 5. Datos personales

- **El SQL y los datos públicos no llevan nombres de personas.** Lo
  comprobé en `aplicar-y-aprobar.sql`, `catalogo.sql`, `revision.json`, el
  escaparate, la documentación, el contraste y el `transparencia.json` del
  ensayo. La cabecera y `aprobada_referencia` dicen «el responsable del
  proyecto».
- **En Git no hay ningún PDF, HTML ni `crudo/`** de la carpeta del ciclo (0
  archivos). Lo que ignora el `.gitignore` no está en Git.
- **El recorte de los grupos está hecho:** testimonios de Brickwise, nombres
  partidos de las condiciones finales de Backed, blog de Bit2Me, directivos de
  arttrade y la nota de prensa de Prosegur Cash.
- **Quedan nombres de personas físicas en cinco archivos que ya están en Git.**
  La carpeta del ciclo está commiteada y subida en
  `origin/claude/sharp-babbage-m3bbbw`. No escribo aquí ningún nombre (O1):

| Archivo (desde `2026-11-11-v2/`) | Líneas | Qué hay |
|---|---|---|
| `grupos/principales/fuentes/lb-robinhood-europe-uab.txt` | 103, 104, 106, 107 y 108 | Los cinco miembros del consejo del banco central lituano, en el menú de la página. El 10/11 ya se recortaron en las copias antiguas («Banco de Lituania», `PARA-CODEX.md`). |
| `noticias/fuentes/rhj-supp.txt` | 1351, 1362, 7963, 7967, 7971, 7975, 7976, 14050 y 14061 | Cuatro administradores del emisor, con cargo y dirección profesional. Son los mismos que ya recorta `recortar.py` en `grupos/`, pero ese script no entra en `noticias/`. |
| `noticias/fuentes/st15099.txt` | 72 | Tres eurodiputados ponentes. Hoy se ha recortado incluso a una directora general de un ministerio en la copia de prensa de Prosegur Cash. |
| `grupos/profunda/estratega.md` | 33 | Un nombre de persona que el directorio de Aktionariat usa como nombre de emisor. |
| `grupos/profunda-1/fuentes/arttrade-anleihebedingungen.txt` | 42, 44, 50, 52, 54, 56, 58, 60, 64, 66, 68, 70, 72, 74 y 76 | Nombres de artistas, autores de las obras. En la línea 40 del mismo archivo, y en el expediente, ya pone «[artista omitido]». |

**Lo que dejo fuera** (no es O1):

- nombres de calles (registro de ESMA, Securitize, Token City) y de empresas;
- el nombre del premio de periodismo del pie de página de la CNMV, en unas 72
  copias: es el nombre de un premio institucional y lo decide el coordinador,
  como el 10/11;
- el nombre de pila del responsable del proyecto, en cuatro documentos
  internos: es el titular del repositorio y su nombre ya está en `AGENTS.md`
  (recomendación 9 de la revisión de SQL).

## 6. Corrección obligatoria (no cambia el SQL)

### O1 · Nombres de personas físicas en lo que ya está en Git

**Problema.** Los cinco archivos de la tabla de §5 tienen nombres de personas
físicas. Las indicaciones del ciclo dicen «sin nombres de personas físicas» en
lo que va a Git. Están en la rama local y en la remota desde el commit
`bdd8a05`.

**Corrección.** Hay que hacerla antes del próximo commit y del PR. No toca el
SQL ni la entrega.

1. Guardar este script en la carpeta temporal de la sesión, no en el
   repositorio:

```python
# O1 · recorte por número de línea (sin escribir ningún nombre).
# Uso: python3 -I recortar-o1.py rwadar-app/data/verificaciones/2026-11-11-v2
import re, sys, os
R = '[persona física recortada]'; A = '[artista omitido]'
base = sys.argv[1]
def por_lineas(ruta, cambios):
    p = os.path.join(base, ruta); t = open(p, encoding='utf-8').read().split('\n')
    for n, (patron, nuevo) in cambios.items():
        antes = t[n - 1]; t[n - 1] = re.sub(patron, nuevo, antes)
        assert t[n - 1] != antes, f'{ruta}:{n} no cambió'
    open(p, 'w', encoding='utf-8').write('\n'.join(t))
    print(ruta, len(cambios), 'líneas')
toda = (r'^(\s*)\S.*?(\s*)$', r'\1' + R + r'\2')           # la línea entera es un nombre
inicio = (r'^(\s*)\S+ \S+?(?=\s{2,}| \()', r'\1' + R)      # el nombre abre la fila de la tabla
por_lineas('grupos/principales/fuentes/lb-robinhood-europe-uab.txt', {n: toda for n in (103, 104, 106, 107, 108)})
por_lineas('noticias/fuentes/rhj-supp.txt', {**{n: toda for n in (1351, 1362, 14050, 14061)},
    **{n: inicio for n in (7963, 7967, 7971, 7975)}, 7976: (r'(director for )\S+ \S+?(\))', r'\1' + R + r'\2')})
por_lineas('noticias/fuentes/st15099.txt', {72: (r'\bMr \S+ [^\s,]+', R)})
por_lineas('grupos/profunda/estratega.md', {33: (r'(Directorio de Aktionariat: )[^,]+', r'\1' + R)})
por_lineas('grupos/profunda-1/fuentes/arttrade-anleihebedingungen.txt',
    {n: (r'^[^,]+,', A + ',') for n in (42, 44, 50, 52, 54, 56, 58, 60, 64, 66, 68, 70, 72, 74, 76)})
```

2. Ejecutarlo desde la raíz:

```
python3 -I recortar-o1.py rwadar-app/data/verificaciones/2026-11-11-v2
```

   Tiene que imprimir 5, 9, 1, 1 y 15 líneas. Lo probé en una copia de los
   cinco archivos. `git diff --stat` debe enseñar solo esos cinco archivos y
   31 líneas cambiadas, ninguna fuera de las de la tabla.
3. Las dos copias de `noticias/fuentes/` no son parte de la entrega SQL, pero
   están en la misma carpeta y ya en Git. El recorte no cambia ningún texto
   publicado de las noticias.
4. Repetir el barrido de nombres incluyendo `noticias/`, y gitleaks, antes del
   commit (R11).
5. Ya están en la historia de la rama remota. Recortarlos limpia lo que se ve
   en la rama, no los commits anteriores. Reescribir la historia o hacer un
   *force push* necesita permiso del responsable del proyecto. Si el PR se une
   con «squash» y después se borra la rama, esos commits no llegan a `main`.

## 7. Recomendaciones (no bloquean)

**R1 · Regla 5.3: alinear el código con la revisión legal.**

- La revisión legal (línea 438) quita «Ver oferta» donde «el emisor no esté
  supervisado». El código mira la entidad que lo vende.
- Kraken es la única ficha en la que cambia el resultado. El emisor, Backed
  Assets (JE), es una sociedad de Jersey sin autorización de ningún supervisor
  de la UE: la FMA de Liechtenstein aprobó su folleto, no la entidad, y el
  expediente no recoge ningún registro del emisor. Sus avisos, además, dicen
  que el folleto no cubre su venta en España.
- Spiko Smart Cash también tiene `documentoEspana` en «No».
- Propuesta: exigir, además, emisor supervisado y `documentoEspana` en «Sí». Es
  un cambio de código en la web, las fichas y la app, así que necesita una
  orden aparte y OTA.
- Hacerlo antes de encender los avisos de ofertas (paso 7), porque el 5.3 es
  condición para ellos.

**R2 · Hausera, antes de las 09:00 del 18/11.** Si el SQL se regenera por otro
motivo, o si hay otra entrega antes de esa hora:

- añadir el aviso «Los documentos de Alicante 3 no coinciden en cuánto hay que
  colocar para que la emisión siga adelante (50 % o 70 %); pregunta a Hausera
  antes de reservar.» (154 caracteres);
- en el alcance del mínimo, cambiar «Hoy no se puede invertir:» por «El
  11/11/2026 aún no se podía invertir:»;
- cambiar el aviso de la preventa por «Alicante 2 figuraba como financiada el
  10/11/2026, antes de su oferta pública del 11/11: quien reserva en la
  preventa paga antes de que la emisión esté inscrita (ver el aviso
  anterior).».

Si no hay otra entrega, la contradicción sigue a la vista en la caja de
transparencia, en la web y en la app. Por eso no la hago obligatoria.

**R3 · Rentabilidades pasadas.** Añadir «Las rentabilidades pasadas no son un
indicador fiable de las futuras» junto a toda rentabilidad. Puede ir como línea
fija de la interfaz o en los tres literales de Spiko. Lo piden la Circular
2/2020 (anexo II) y el punto 5.3 de la revisión legal (línea 439), que lo pone
como condición antes de anunciar ofertas. Hoy no sale en ninguna parte: busqué
«indicador fiable» y «rentabilidades pasadas» en la web, las fichas y la app, y
hay 0 resultados.

**R4 · Boss Info y Switzerlend: un aviso visible.** Añadir, como ya tiene
Aktionariat: «Sin folleto ni KID, y el emisor no está supervisado: su portal no
dice en qué exención se apoya para vender en el EEE.». Hoy solo lo dicen la
caja de transparencia y una métrica que la vista tapa. Es la R7 del 10/11.

**R5 · Portales suizos y el artículo 36.1 de la Ley 6/2023.**

- El artículo dice, en el BOE consolidado (`https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053`,
  15:03:40 UTC): «Cuando se trate de colocación de emisiones no sujetas a la
  obligación de publicar folleto por … ser su importe total en la Unión Europea
  inferior a ocho millones de euros … que se dirijan al público en general
  empleando cualquier forma de comunicación publicitaria, deberá intervenir una
  entidad autorizada para prestar servicios de inversión.»
- Las ofertas de Aktionariat, Boss Info y Switzerlend al EEE, con un tope de
  100.000 €, no nombran ninguna.
- Propuesta de aviso para las tres: «En España, una oferta al público sin
  folleto que se anuncia necesita que intervenga una empresa de servicios de
  inversión autorizada (art. 36.1 de la Ley 6/2023); el portal no nombra
  ninguna.»
- Además, que el coordinador valore si su «España: Sí» debe pasar a «Sin
  confirmar». Es una lectura jurídica: si se quiere certeza, se puede
  consultar a la CNMV.

**R6 · Spiko Smart Cash a 30 días.** La API publica `"monthlyYield":"0.0284"`,
la misma cifra que la diaria. Se puede describir como rendimiento de 30 días,
que es más estable, sin cambiar la cifra. Lo prefiere el punto 5.3 frente a los
periodos cortos.

**R7 · Brickwise: rentabilidades esperadas en reventa.** Quitar las
referencias «Distribución anual esperada/prevista», «Rentabilidad por alquiler
esperada», «Rentabilidad · consulta 01/11/2026» y «Próxima distribución
esperada · …: 15/11/2026», o rotularlas como históricas.

- Chocan con la norma de reventa.
- En seis fichas chocan también con el aviso «la rentabilidad no se muestra».
- Del 16 al 18/11 la fecha del 15/11 ya habrá pasado.
- Es la R8 del 10/11 y la R4 de la revisión de contenido.

**R8 · mTBILL, «garantizado por una cuenta de colateral».** En «Qué se
adquiere», escribir «con garantía real sobre una cuenta de colateral». Un
particular puede leer «garantizado» como que se le garantiza el dinero. Ya
estaba publicado.

**R9 · Spiko Euro y Dólar: la salida corta.** «Reembolso diario» debería ser
«Reembolso diario, con límites», como en Smart Cash. Es un dato de
`transparencia.json` y no toca el SQL; los avisos ya dicen el límite.

**R10 · Hausera:**

- cambiar «que pasen el test de idoneidad del emisor» por «que el emisor
  considere idóneos» (el «test de idoneidad» es el de MiFID II, art. 25.2);
- avisar de que no tiene las protecciones del Reglamento (UE) 2020/1503.

Son la R3 y la R4 del 10/11.

**R11 · El barrido de nombres:**

- que `recortar.py` y `barrido.py` entren también en `noticias/fuentes/`;
- además de tratamientos y cargos, que busquen con un diccionario de nombres de
  pila. Las listas de nombres sin cargo, como el menú del banco central
  lituano, se escapan del método actual.

## 8. Límites de esta revisión

- **No abrí los PDF** (documentos de Hausera, condiciones finales de Backed y
  de mTBILL, KID). Para el 50 % / 70 %, la entidad que valida el documento de
  Hausera y los países de las condiciones finales me apoyo en los expedientes
  y en `revision-independiente/`.
- **No volví a leer** los libros de órdenes ni la cadena de Brickwise y las
  suizas: lo hizo el revisor de contenido de 14:22 a 14:47 UTC. Tampoco
  `midas.app`, que da 403.
- **No hice altas ni KYC.**
- **El buscador de la CNMV** busca por nombre y por trozo de nombre. No
  sustituye a una consulta formal.
- **El barrido de nombres no es exhaustivo.** Usa un diccionario de nombres de
  pila y cargos. Un nombre que no esté en el diccionario, o escrito en
  mayúsculas, puede escaparse.
- **No revisé el contenido de las noticias**, que no son parte de esta entrega.
  Solo miré los nombres de personas en sus copias.
- **La lectura del artículo 36.1 (R5)** es mía. Para las ofertas
  transfronterizas de emisores de fuera de la UE no hay un criterio publicado
  de la CNMV que haya podido citar hoy.

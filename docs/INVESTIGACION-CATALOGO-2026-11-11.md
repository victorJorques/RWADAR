# Investigación del catálogo · 11 de noviembre de 2026

Víctor la pidió el 11/11 por la mañana: «Actualiza las ofertas y el gráfico y
las noticias». Quería el gráfico al estilo de una app de bolsa y las noticias
junto al gráfico. Durante el día añadió:

- «Apreta y hazlo de verdad un nivel ultra elevado».
- «La investigación tiene que ser en profundidad y de un nivel altísimo».
- La calculadora en una sección propia de Inicio, con los números de cada
  persona («no que sea sí o sí los 300.000»).
- «Apáñate para entrar en las páginas y apps que no deja».
- «Los datos del gráfico que sean reales».

Carpeta completa: `rwadar-app/data/verificaciones/2026-11-11-v2/`
(`DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, `REVISION-ENTREGA-*.md`,
`VERIFICACION-ENTREGA.md`, `expedientes/`, `grupos/`, `revision-independiente/`
y `noticias/`).

## 1. En pocas palabras

- **Las 22 ofertas publicadas siguen**, revisadas hoy con sus fuentes
  oficiales. Cambian:
  - **Spiko:**
    - Euro baja del 2,44 % al **2,41 %**.
    - Dólar baja del 4,09 % al **4,02 %** (en dólares).
    - Smart Cash Euro sigue en el **2,84 %**, con datos del 10/11.
  - **Brickwise (reventa):**
    - Schwarzer Weg sube de 65 a **69,90 €** (la venta de 65 € ya no está).
    - Pottendorfer Straße baja de 74 a **73 €**.
    - Las otras 9 se quedan igual, con fecha 11/11.
  - **mTBILL:**
    - Valor por token: **1,0777 USD** (10/11).
    - El acceso de la tarjeta queda en «Sí: oferta pública en España para
      particulares». Se apoya en las Condiciones Finales, ESMA y la CNMV.
    - Sale la frase sobre la web de Midas: desde las 10:01 UTC esa web no
      deja leerse de forma automática.
  - **Hausera:** el contrato de Alicante 2 acuñó hoy sus 51.960 tokens
    (5.196.000 €). La tarjeta no cambia.
  - **Aktionariat, Boss Info y Switzerlend:** sin cambios de fondo. Mínimos y
    referencias con fecha 11/11.
  - **Robinhood, Kraken y Prosegur:** sin cambios, comprobados hoy.
- **Hoy no entra ninguna oferta nueva** (§3).
- **Radar:** 69 de 69. Las dos fuentes de REGAFI se leyeron por su API pública.
- **«Mercado y noticias» al estilo de una app de bolsa**, en web y app (§5).
- **Calculadora propia en Inicio:** «Calcula tus números» (§6).
- **Rutas legítimas a las fuentes que bloquean** (§7).

## 2. Cómo se hizo

- **Ofertas:** tres grupos (principales, reventa y vigilancia), cada uno con
  un revisor independiente que volvió a abrir las fuentes. Los tres dieron
  «aprobado con cambios» y todas sus correcciones están aplicadas
  (DECISIONES §5).
- **Búsqueda profunda:**
  - Un estratega buscó huecos que aún no se habían mirado: los agentes
    vinculados de empresas alemanas con pasaporte, los certificados con
    folleto pasaportado, el arte y las materias primas.
  - Después se abrieron expedientes completos de las mejores pistas.
- **Entrega:**
  - La montó un agente.
  - La revisaron tres expertos independientes: SQL e integridad; contenido y
    tarjetas; cumplimiento.
  - Un auditor comprobó que las correcciones no cambiaron nada más.
- **Datos personales:** se recortaron los nombres de personas en las copias de
  hoy (Backed, Bit2Me, Brickwise, arttrade y el nombre de un artista en los
  archivos). gitleaks: 0.
- **Límite de uso:** a las 10:45 UTC cortó a todos los equipos. Se retomaron a
  las 14:16 UTC, tras el restablecimiento, sin perder trabajo: lo hecho se
  guardó en commits.

## 3. Candidatas (ninguna entra hoy)

| Candidata | Por qué no entra |
|---|---|
| arttrade (bonos de arte, agente de Effecta) | Sus condiciones exigen vivir en Alemania. La oferta vigente solo se ve tras registrarse. KID para inversores con conocimientos ampliados. |
| winvesta (bonos inmobiliarios, agente de Effecta) | El aviso legal de la ficha excluye la compra desde España. |
| Pagarés tokenizados de Prosegur Cash | Sin documento ni condiciones públicas. **Vigilar.** |
| Securitize Stocks | Ninguna fuente dice que un particular en España pueda comprar hoy. **Vigilar.** |
| Profitus / Axiology | KIIS solo con cuenta; hoy no hay emisión abierta. |
| Valorix (Bit2Me STX) | valorix.es no responde; documento de la segunda emisión, solo con cuenta. |
| CANDO1 (Token City) | Web y API en mantenimiento. |
| Hausera Alicante 3 | Preventa el 18/11; aún sin inscripción en la ERIR. **En camino.** |

## 4. Noticias

8 → 6 noticias del 11/11 (`noticias/noticias-2026-11-11.json`), con su
verificación. Se publican en `/datos/noticias-v2.json` (con foto) y en
`/datos/noticias.json` (sin la clave «imagen», para las apps ya instaladas).

## 5. «Mercado y noticias» al estilo de una app de bolsa

Web (`/mercado/`, que también acoge las noticias; `/noticias/` lleva allí) y
app.

- **Arriba:**
  - la cifra grande, que es el último punto real del gráfico (42.947 M$ el
    11/11);
  - el cambio del periodo en color, con su signo;
  - las pestañas 1 S · 1 M · 3 M · 6 M · 2026 · 1 A.
- **El gráfico:**
  - área con eje a la derecha;
  - cruz al tocar o con el teclado;
  - tabla equivalente para lectores de pantalla.
- **Datos clave:** valor hoy, cambio en 24 h (sale de la serie, nunca del
  +124 % erróneo de CoinGecko), máximo y mínimo del periodo, tokens y tipo
  mayor. El total de la categoría (49.698 M$) va aparte, explicado.
- **Debajo del cambio:** «Mide cuánto vale en total el mercado: sube también
  cuando se emiten tokens nuevos. No es lo que habría ganado una inversión.»
  Y, cuando toca, «De 16 a 29 tokens: parte de la subida son tokens nuevos».
- **Inicio:** una tarjeta tipo cotización con minigráfico y las 3 noticias
  principales.
- **El flujo diario «Tokenización diaria»** rehace la serie cada día:
  - 13 s entre llamadas;
  - el paso tiene su propio límite de tiempo;
  - si CoinGecko falla, se conserva la serie anterior.
- **Revisiones:** la revisora del equipo; luego la segunda ronda de calidad,
  con tres expertos independientes (auditor de datos, inversor novato y
  diseñador sénior); y la ronda final, con dos verificadores que dieron
  «listo».

- **Serie real de un año:** la suma diaria de los 29 de los 40 mayores tokens
  de la categoría «tokenized-products» de CoinGecko que tienen historia
  completa (86 % del total).
- **Comprobación independiente, tres veces:**
  - Claude, con código propio: los 364 días, 0,000 % de diferencia.
  - El auditor de datos, con sus propias descargas: diferencia máxima del
    0,029 %.
  - En vivo, a las 10:13 UTC: 42.958 M$ frente a 42.947 M$ del gráfico.

## 6. Calculadora «Calcula tus números»

Bloque propio en Inicio (web y app), entre «Mercado y noticias» y Aprende.

- **Tus números:** cada persona escribe lo que pone, la rentabilidad y los
  años. Hay importes rápidos y un ejemplo editable.
- **Cómo se cuenta lo que ganas:** «Lo cobro» (interés simple) o «Lo
  reinvierto» (compuesto).
- **«Afinar»:** comisión anual y de entrada, impuestos (19 % por defecto, con
  la nota de los tramos del ahorro de la AEAT) y, si quieres, el valor del
  activo y el precio de cada participación. Ya no es «sí o sí 300.000 €».
- **Chips «Usa la rentabilidad de una oferta»:** salen de los datos del
  catálogo, con su fecha, y avisan si la oferta es en dólares.
- **Resultado y cuenta:** el resultado arriba; debajo, un gráfico de barras
  por año y la cuenta paso a paso.
- **El explicador** también deja cambiar el valor del activo y el precio del
  trozo.
- **Revisiones:**
  - tres expertos independientes: un auditor de cuentas que rehízo más de 20
    casos a mano, un inversor novato y una diseñadora de accesibilidad y
    código, con 8 correcciones obligatorias aplicadas;
  - auditor final: «listo».

## 7. Rutas legítimas a las fuentes que bloquean

- **Inventario:** 49 fuentes que nos bloquean o que se leían a medias. Las 7
  plataformas más importantes se trabajaron a fondo.
- **Método:** un experto por plataforma buscó y probó rutas. Después, un
  verificador escéptico rehízo cada ruta y rechazó las que no daban el dato
  de hoy o cruzaban un límite.
- **Resultado:**
  - guía `.claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md`;
  - comprobador `comprobar-rutas.mjs`: 76 rutas; 75 vivas a las 15:47 UTC, la
    otra era CoinGecko con 429 pasajero.
  - Cada ciclo empieza con él.

- **Límite firme:** no se elude ningún control anti-bots. El sistema de
  seguridad bloqueó un intento con Midas y no se repitió. Tampoco se usan VPN,
  cuentas ni API internas.
- **mTBILL:**
  - La rentabilidad sale del oráculo del emisor en cadena: ≈ 3,5 % en 30 días
    (rwa.xyz da 3,44 % y DefiLlama, una media del 3,31 %).
  - La capacidad de reembolso inmediato, de sus contratos (≈ 9 M USD hoy).
- **Pistas de Midas:** mAPOLLO y mHYPER están pasaportados a España con el
  mismo folleto. Riesgo mayor; pendientes de expediente.
- **Brickwise:** no consta si una orden de venta de varias participaciones se
  puede comprar en parte. La app sugiere que sí, pero no hay documento.
  Propuesta para el 12/11: un aviso y la comisión del 1,5 %.
- **Crypto.com (acciones tokenizadas UE):**
  - autorizada para España (CNMV n.º 4485, CySEC 344/17);
  - se vende en la App Store española;
  - el KID solo está dentro de la app, así que sigue sin admitirse, ahora con
    ese motivo exacto.
- **CrowdedHero:** se descarta. La plataforma tuvo fondos propios negativos
  en 2025.

**Para el ciclo del 12/11** (con su revisión completa):

- la rentabilidad de mTBILL, ≈ 3,5 % en 30 días, del oráculo;
- el aviso de Brickwise;
- el motivo de Crypto.com;
- el radar de Midas.

## 8. Publicación

- **PR #100 (catálogo):**
  - CI en verde;
  - unida con squash, para que los nombres recortados hoy no queden en la
    historia de `main`.
- **«Aplicar catálogo» n.º 16:** correcto.
- **Lectura como visitante a las 16:56 UTC:**
  - revisión `24b5f7de`, 25/22 (8/13/1), `verificadaEl` 2026-11-11;
  - Spiko 2,41 % y 4,02 %;
  - Schwarzer Weg 69,90 € y Pottendorfer 73 €;
  - Switzerlend «68,01 CHF el 11/11».
  - En mTBILL, la vista pública tapa las cifras con «Cifras pendientes de
    nueva revisión»: está en `fuentes_en_conflicto`, como en ciclos
    anteriores.
- **Sincronización:**
  - `sincronizar.js`: 25/5/22;
  - `despues-de-aplicar.mjs`: 43 de 44 al 11/11; mTBILL supervisada se
    queda en el 10/11;
  - `volcar-seed.js`, `transparencia.mjs` y `rwadar-fichas.js` (55
    archivos).
- **Después:** PR2 (mercado, calculadora, noticias del 11/11, guía de acceso
  y sincronización), web en preview y producción, y OTA Android, por este
  orden. La app nueva lee la serie del gráfico de la web.

# Auditoría independiente · sitio web · 21/11/2026

Ámbito: lo que enseña la web publicada (https://rwadar.pages.dev) y que se
verá en la reunión del lunes 23/11: Inicio (cabecera, «Revisado el», tarjetas
de ofertas, mercado, noticias, calculadora, radar y pie), /mercado/,
/plataformas/ (swarm, spiko y midas abiertas a fondo), /academy/, /aprende/,
/privacidad, /cambios y el RSS, /novedades-rwadar/, la campana de avisos, el
CSV y las 22 fichas /ofertas/<slug> (una de cada colección leída entera:
Spiko Letras del Tesoro Euro, Vivienda Schwarzer Weg 18 y Hausera; de las
demás, los campos con cifra o fecha).

Cómo: peticiones normales con `curl` y páginas pintadas en Chrome sin cuenta
(Playwright con el Chrome del sistema, sin trucos), entre las 20:12 y las
20:28 UTC. Copias solo en `/tmp/auditoria-2026-11-21/sitio-web/` (fuera del
repositorio). Lo publicado hoy es la entrega del 20/11; donde un hallazgo
afecta a lo que se va a publicar, se dice por qué sigue igual después
(el motor de la entrega «aplica solo lo de `decisiones.json`; nada más
cambia», `entrega/FORMATO.md`).

## En dos líneas

- **El mercado está bien y en directo**: `/api/tokenizacion/directo` da 200
  con datos de hoy (último punto 20:20 UTC, serie de 5 minutos completa, 289
  puntos sin huecos) y la cifra grande, 42.518 M$, es exactamente la suma de
  los 30 tokens en CoinGecko a las 20:17 UTC. `/api/mercado` no existe
  (404 «ruta_no_permitida») y la web no la usa: no es un fallo.
- **Lo que hay que arreglar antes del lunes**: tres textos que el propio
  sitio desmiente (novedades sobre la campana, fecha de la política de
  privacidad, página «Para empresas»), un fallo de las fichas de reventa y de
  Hausera que pone «No documentado en euros» al lado de «Desde 69,90 €», y
  referencias de septiembre, octubre y del 01–03/11 que siguen en las fichas
  de Spiko, mTBILL y Prosegur porque ni los grupos ni §2 las tocan.

## Hallazgos obligatorios

### 1. /novedades-rwadar/: «Para verlo tienes que haber entrado en tu cuenta» (falso desde hoy)

- **Publica** (20:17:43 UTC), apartado «Un número te dice cuántos avisos no
  has leído»: «En la web, sale en la campana de arriba y en Perfil. … Para
  verlo tienes que haber entrado en tu cuenta.» En inglés: «To see it, you
  need to be signed in to your account.» Sale de
  `rwadar-site/datos/novedades-producto.json` (versión `2026-11-14.4`, igual
  byte a byte que el publicado).
- **La web hoy**: Inicio pintado sin sesión a las 20:14:38 UTC
  (`/api/acceso/sesion` responde 401 y la cabecera dice «Entrar») enseña la
  campana con un **9**. El aviso n.º 7 de la propia campana (21/11): «Ahora
  los avisos están en una campana arriba a la derecha … Al abrirla y verlos,
  dejan de salir como pendientes.» Cambio del 21/11 (#179): «sin cuenta, los
  avisos publicados».
- **Corrección**: sustituir esa frase por «Desde el 21/11/2026 también lo ves
  sin cuenta: la campana cuenta los avisos publicados que aún no has visto en
  este navegador.» / «Since 21/11/2026 you also see it without an account: the
  bell counts the published alerts you haven't seen yet in this browser.»
  (Subir la versión vuelve a abrir la ventana de novedades a todos; si no se
  quiere, cambiar solo el texto del detalle.)

### 2. Privacidad: «Versión revisada el 14 de noviembre de 2026», pero cambió el 21/11

- **Publica** (20:17:28 UTC): «Versión revisada el 14 de noviembre de 2026»
  (`<time datetime="2026-11-14">`); `sitemap.xml` da `lastmod 2026-11-14`.
- **Hoy**: la misma página ya describe un tratamiento nuevo del 21/11, «Sin
  cuenta, recuerda igual qué avisos publicados has visto en la campana (solo
  sus números…); se borra con «Borrar lo guardado aquí» de Perfil», añadido
  en el cambio #179 del 21/11/2026 (14:28 hora de España).
- **Corrección**: «Versión revisada el 21 de noviembre de 2026»
  (`datetime="2026-11-21"`) y `lastmod` 2026-11-21. De paso (recomendada), en
  el apartado de avisos: «por ahora los avisos se ven en tu cuenta (la campana
  de la web y Inicio en la app)» → «por ahora los avisos se ven en la campana
  de la web, con cuenta o sin ella, y en la app».

### 3. Privacidad §7: «La página «Para empresas»…» no existe

- **Publica**: «La página «Para empresas» mantiene únicamente un canal para
  enviar una expresión de interés exploratoria.»
- **Hoy**: `https://rwadar.pages.dev/para-empresas` responde **302 → /**
  (20:18:22 UTC). La misma política ya lo dice bien en el resumen: «el
  apartado «¿Quieres colaborar con nosotros?» de Inicio recoge solo
  expresiones de interés».
- **Corrección**: «El apartado «¿Quieres colaborar con nosotros?» de Inicio
  solo recoge, por correo a rwadares@gmail.com, expresiones de interés
  exploratorias.»

### 4. Fichas /ofertas/: «Mínimo en euros: No documentado en euros» junto a «Desde 69,90 €»

- **Publica** (las 22 fichas pintadas entre 20:20:34 y 20:21:34 UTC):
  en **las 11 de Brickwise y en Hausera**, «Acceso y condiciones › Mínimo en
  euros: **No documentado en euros**», y en la misma página, más abajo,
  «Transparencia › ✓ Sí El mínimo y la forma de salir están documentados ·
  Mínimo: **Desde 69,90 € la participación en reventa (20/11)**» (Schwarzer
  Weg 18); igual en Hinterstoder (75 €), Drautalresidenz (70 €), Cohotel
  (110 €), GreenPoint (102 €), Randhartingergasse (78 €), Klagenfurt (95 €),
  Plüddemanngasse (75 €), Pottendorfer (81 €), Sonnleithnergasse (75 €),
  Stallhofstraße (68,80 €) y Hausera («Desde 100 € en Alicante 3…»). La
  tarjeta de la lista dice el importe en euros. También salen «No documentado
  en euros» en Aktionariat (500 CHF), Boss Info (100 CHF), Switzerlend
  (1 acción), Spiko Dólar (1 USD) y Prosegur (1 gramo), cuyo mínimo sí está
  documentado en su unidad.
- **Por qué**: `rwadar-site/assets/ficha-pagina-20261022.js` pinta
  `campo.texto` («No documentado en euros») y no `campo.unidadDocumentada`,
  que es lo que hacen la web (`rwadar-20260820.js`, línea 2594) y la
  transparencia de la propia ficha (`rwadar-fichas.js`, línea 238). Es código:
  publicar la entrega del 21/11 no lo arregla.
- **Corrección**: en `ficha-pagina-20261022.js`, para `minimo`, si
  `campo.texto==='No documentado en euros' && campo.unidadDocumentada`,
  escribir `campo.unidadDocumentada` (p. ej. «Desde 71,90 € la participación
  en reventa (21/11)», «500 CHF por transferencia bancaria», «1 USD»); y en
  `rwadar-fichas.js` (línea 291) la etiqueta «Mínimo en euros» → «Mínimo».

### 5. Spiko (las tres fichas): referencias del 30/09, 22/10, 01/11 y 03/11 que nadie retira

- **Publica** (20:18:29 y 20:26:30 UTC), Spiko Letras del Tesoro Euro, fila
  «Costes»: «… · Comisiones · consultada el **01/11/2026** ↗ · Comisión de
  gestión · **22/10/2026** · consultada el **22/10/2026** ↗». En «Ver los 19
  datos consultados»: «Suscripción inicial mínima publicada · Consulta:
  30/09/2026», «Gestión publicada · Consulta: 30/09/2026» (dos veces cada
  una), «Suscripción inicial publicada · 22/10/2026», «Moneda · 22/10/2026»,
  «Comisión de gestión · 22/10/2026» y cinco más con «Consulta: 01/11/2026».
  Spiko Dólar: «Comisiones · consultada el 01/11/2026» y 7 de 11 referencias
  del 01/11 (entre ellas «Conflicto en la clase EUR (FR001400SBD3): el folleto
  dice 1 EUR y la API de Spiko dice 1.000 EUR»). Smart Cash: «Comisión de
  gestión · consultada el 03/11/2026» y 6 de 10 referencias del 03/11.
- **Fuente hoy**: `data.spiko.io/eutbl/` (20:19:47 UTC): «Management fees
  0.25% … Minimum initial subscription 1 EUR»; `data.spiko.io/ustbl/`
  (20:26:49): «Management fees 0.25% … Minimum initial subscription 1 USD»;
  API pública `share-classes` (20:26:49): `eurUSTBL` «minimumInitialSubscription
  "1000"». KID EUTBL ES `cb1a621d…3325`, KID USTBL ES `c1ce5400…92f6` y
  folleto de la SICAV en GECO (438274) `940559b4…74fe`: los tres con la misma
  huella que lo publicado, descargados a las 20:25 UTC; dicen «0,25 % del
  valor de su inversión al año» y, para la clase EUR del fondo «Spiko Amundi
  Overnight Swap», «0,25% TTC» y «0,10% TTC maximum».
- **Por qué sigue**: §1 de DECISIONES limpia «las referencias con fechas
  viejas que proponen los grupos», y ni el expediente de Spiko ni
  `revision-independiente/spiko.md` lo proponen; §2 de Spiko solo cambia
  rentabilidad y acceso. El motor no cambia nada más.
- **Corrección** (en `decisiones.json`): re-fechar al 21/11 con lo leído hoy
  (las mismas cifras) o quitar los duplicados: en Euro, fuera «Gestión
  publicada» y «Suscripción inicial mínima» del 30/09 (dos de cada),
  «Suscripción inicial publicada · 22/10/2026», «Moneda · 22/10/2026» y
  «Comisión de gestión · 22/10/2026»; «Comisiones · consulta 01/11/2026» →
  «Comisiones · 21/11/2026: 0,25 % al año (KID en español, misma huella)». En
  Dólar, igual con el KID USTBL. En Smart Cash, «Comisión de gestión ·
  21/11/2026: 0,25 % anual; gastos de funcionamiento de hasta el 0,10 %».

### 6. mTBILL: siguen referencias del 21/09, 30/09 y 20–22/10

- **Publica** (20:27:18 UTC), «Ver los datos consultados»: «Comisión
  publicada · Gestión · Consulta: 21/09/2026» y «· Performance · 21/09/2026»
  («No revalidada el 27/09/2026»), «TVL publicado en Midas · Consulta:
  30/09/2026» y «Descripción en el índice oficial de productos» del 20/10,
  21/10 y 22/10.
- **Por qué sigue**: §2 solo quita «Acceso desde España · consulta
  01/11/2026» y «Países de oferta según la web de Midas · consulta
  05/11/2026».
- **Corrección**: quitar esas seis (la web de Midas da 403 hoy: no se pueden
  re-fechar; las comisiones del 5 % ya constan en el KID en español, con la
  huella del vigía).

### 7. Prosegur Digital Gold: diez referencias del 30/09 y del 22/10 fuera de la limpieza

- **Publica** (20:27:13 UTC): «Unidad descrita», «Compra mínima publicada»,
  «Custodia publicada», «Liquidación publicada», «Auditorías publicadas» con
  «Consulta: 30/09/2026», y las mismas cinco (más «Moneda») «· 22/10/2026».
- **Por qué sigue**: §2 pide re-fechar o quitar «las referencias del 23/10,
  el 01/11 y el 02/11», no las del 30/09 ni las del 22/10.
- **Corrección**: incluirlas en la misma limpieza (re-fechar con lo leído hoy
  o quitarlas).

## Recomendadas

8. **Quinta comprobación de las fichas de reventa, Hausera y mTBILL.** Dicen
   «✗ No Revisada esta semana y sin fuentes en conflicto · No: la revisión
   semanal ha caducado o no se pudo confirmar», justo encima de «Revisamos esta
   ficha el 20/11/2026» (15 fichas, 20:20–20:21 UTC). No ha caducado: son
   `no_verificable` por ser reventa o anuncio, y mTBILL tiene fuentes en
   conflicto. Corrección en `ficha-pagina-20261022.js`: con la revisión
   vigente, «No: revisada el DD/MM/AAAA, pero es reventa entre inversores y no
   se puede confirmar que siga disponible» (secundario), «No: revisada el
   DD/MM/AAAA; es un anuncio y aún no se puede contratar» (próximas) y «No:
   las fuentes no coinciden» (fuentes en conflicto).
9. **Hausera, punto doble.** «Mínimo: Desde 100 € en Alicante 3, según su
   documento de emisión (20/11); preventa abierta desde el 18/11..» (20:19
   UTC). El texto nuevo del expediente también acaba en punto («…al
   30/06/2027.»), así que seguirá. Corrección: en `rwadar-fichas.js` (línea
   239) quitar el punto final del mínimo como ya se hace con la salida
   (`.replace(/\.$/,'')`).
10. **Inicio, «Los 30 mayores · CoinGecko».** Hoy 8 de esos 30 no están entre
    los 30 mayores de la categoría (CoinGecko, 20:17:02 UTC: los 30 mayores
    suman 45.324 M$; los de la serie, 42.518 M$). /mercado/ lo dice bien:
    «Suma de los 30 mayores tokens con historia completa». Corrección: «30
    mayores con historia completa · CoinGecko».
11. **/mercado/, «86 % del total».** Con las dos cifras que enseña la página
    (42.518 y 48.734 M$) sale un 87 %; el 86,2 % es de la serie diaria del
    20/11 (21:56 UTC). Corrección: calcular la cuota con la cifra grande y el
    total que se muestran, o poner su fecha.
12. **Aviso de la campana del 21/11 «Cada oferta, con su fecha más
    reciente».** Dice «o, si es nueva, «Añadida el»», pero las tarjetas
    «Nueva» de Inicio dicen «Verificada el 20/11/2026» (20:14 UTC; la fecha
    más reciente gana). Texto exacto: «En Inicio, cada oferta lleva su fecha
    más reciente: cuándo se añadió («Añadida el»), cuándo se verificó
    («Verificada el») o cuándo se actualizó su documentación («Actualizada
    el»).»
13. **«Nueva» en Inicio y no en Ofertas.** xStocks y Spiko Smart Cash
    (añadidas el 03/11) y Robinhood y Spiko Dólar (02/11) llevan «Nueva» en
    Inicio (30 días) y no en la lista de Ofertas (14 días). El lunes seguirá
    igual. Corrección: el mismo plazo en los dos sitios, o «Añadida el
    03/11/2026» en vez de «Nueva» pasados 14 días.
14. **Novedades sin lo del 20 y el 21/11.** /novedades-rwadar/ sigue en
    «Novedades del 14 de noviembre de 2026», y el aviso n.º 1 de la campana
    dice «Toca para ver todas las novedades». /cambios y el RSS acaban en la
    entrada del 20/11 y no recogen la campana para todos, las ofertas más
    recientes en Inicio ni la fecha de cada oferta (avisos del 21/11).
    Corrección: añadir a /cambios y al RSS «21/11/2026 · Campana de avisos
    para todos y ofertas más recientes en Inicio» y, con la publicación de
    hoy, «21/11/2026 · Catálogo revisado: 22 ofertas y 25 plataformas».

## Lo que se comprobó y está bien

- **Mercado**: `/api/tokenizacion/directo` 200 a las 20:12 y a las 20:24 UTC,
  generado 20:23 UTC, último punto 20:20 UTC; 5 minutos (289 puntos) y horas
  (721) sin huecos. Cifra grande 42.518 M$ = suma de los 30 tokens en
  CoinGecko (42.518.059.339 $, 20:17:02 UTC). «+1,4 %» en 24 h = 1,388 %
  recalculado; «+0,5 %» en el mes = 0,459 %. Total de la categoría 48.734 M$
  (foto del 21/11, 18:44 UTC) frente a 48.750 M$ de CoinGecko (20:11:40 UTC,
  −0,03 %). Crédito privado 27.890 / 27.900, materias primas 5.156 / 5.159,
  oro 4.937 / 4.941 y acciones 2.525 / 2.528 M$. «Tokenización diaria» salió
  bien hoy (14:46 UTC): el fallo de los días 16–20/11 está resuelto.
- **Calculadora**: 4,00 % (Dólar), 2,45 % (Euro) y 2,84 % (Smart Cash)
  coinciden con la API pública de Spiko (20:24:46–20:24:50 UTC). Tramos del
  ahorro (19 % hasta 6.000 €, hasta el 30 %) correctos.
- **Cabecera e Inicio**: 22 ofertas (8/13/1), 25 plataformas, 5 descartadas;
  «Revisado el» y «Última revisión del catálogo» pasarán solos a 21/11 al
  publicar. Nada interno a la vista («Interno · solo local» y la copia de
  Reental siguen ocultos; la cabecera dice «Entrar», no «Cuentas en pausa»).
- **Campana**: los 9 avisos abren y su enlace responde; ninguno trae
  «oportunidad», «rentabilidad», «garantiz…» ni %. Los del 14/11 sobre el
  directo vuelven a ser ciertos.
- **Plataformas y CSV**: los textos que la auditoría del 20/11 dio por
  falsos (Swarm, INX, Lofty, Superstate, Backed, Pax Gold, Franklin,
  Securitize) están corregidos en las páginas y en `rwadar.csv` (30 filas).
- **Aprende**: Visa «$25 billion in annualized volume, up 10x» (transcripción
  del 28/10) y Kinexys «>$7 Billion in average daily transaction volume»
  (20:24 UTC); «5 de las 22 ofertas» con mínimo de 1 € o 1 $ cuadra con el
  catálogo.
- **Enlaces**: las 61 direcciones del mapa del sitio dan 200; de 332 enlaces
  externos, 312 dan 200 y 20 son bloqueos de robots (403, 406, 429); internos
  bien (las lecciones de Academy piden cuenta, 401, como dicen).

## Sin poder comprobar

- La descarga de la app Android (`/android` → GitHub releases): el acceso
  devuelve 403 desde aquí.
- Enlaces con bloqueo de robots (no son enlaces rotos): centrifuge.io (2),
  courtyard.io, detroitmi.gov, docs.midas.app (4), midas.app (4),
  republic.com, time.com (406), thedefiant.io, coindesk.com (429), sec.gov,
  spglobal.com y theblock.co (2).
- La app de Android (campana y tarjetas): no se ha abierto.
- Qué dejará exactamente la entrega del 21/11 (aún sin montar): los puntos 5,
  6 y 7 se basan en que §2 no los nombra y en que el motor no cambia nada más.
- Las versiones en inglés solo se miraron en el punto 1; las correcciones
  valen también para su texto `en`.

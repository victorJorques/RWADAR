# Auditoría independiente · sitio web · 20/11/2026

Ámbito: lo que la web publicada (https://rwadar.pages.dev) enseña y que **no** se
rehace al publicar el catálogo nuevo: Inicio, /mercado/, /noticias/, /aprende/,
/novedades-rwadar/ (y /cambios, a la que enlaza), las páginas de plataformas del
radar, transparencia comercial y privacidad y aviso legal. Fuente en
`rwadar-site/` (sobre todo `datos/novedades-producto.json` y los datos del
mercado de la rama `datos-tokenizacion`).

Hecho entre las 17:14 y las 17:30 UTC con peticiones normales (curl con su
agente, cabecera `accept-language: es` para la CNMV). Copias de las fuentes en
`/tmp/auditoria-2026-11-20/sitio-web/` (fuera del repositorio). No se ha
renderizado ninguna página en un navegador (aquí no hay Playwright): los textos
que pinta JavaScript se han sacado del código publicado y de los datos que lee.

## En dos líneas

- **El gráfico «en directo» lleva parado desde el 16/11** y la web lo sigue
  anunciando como novedad («Se actualiza cada 5 minutos»). Es falso hoy y
  publicar el catálogo no lo arregla.
- **Ocho páginas de plataformas del radar** dicen, bajo «Cómo funciona y qué se
  ha comprobado», cosas que sus propias fuentes desmienten hoy (licencia de
  BaFin de Swarm, matriz de INX en Nasdaq, «oferta registrada» de Lofty, fondos
  «registrados» de Superstate, «emisor suizo» de Backed, NYDFS en Pax Gold,
  Securitize como emisor de BUIDL y una recomendación en Franklin Templeton).
  Esos textos vienen de los campos antiguos `aval` y `nota` del radar, salen
  también en `rwadar.csv` y, al publicar, estrenarán la fecha 20/11/2026.

Las cifras del mercado de la rama `datos-tokenizacion` (20/11, 15:30 y 15:58
UTC) **cuadran con CoinGecko de hoy**; las noticias nuevas y Aprende están bien
respaldadas; todos los enlaces del mapa del sitio responden.

## Hallazgos obligatorios

### 1. Novedad «El mercado, en directo» (falsa hoy)

- **Dónde:** `rwadar-site/datos/novedades-producto.json` (publicado igual,
  versión `2026-11-14.4`), resumen `mercado-directo`: «El mercado, en directo» ·
  «Se actualiza cada 5 minutos. Míralo en «Mercado y noticias».»; detalle:
  «Desde el 14 de noviembre, el gráfico se actualiza cada 5 minutos. En la
  pestaña «24 h» ves cómo se ha movido en las últimas 24 horas…». También la
  descripción de /novedades-rwadar/: «…explicado fácil: el mercado en directo…».
- **Lo que dice la fuente hoy:** https://rwadar.pages.dev/api/tokenizacion/directo
  responde `503 {"error":"directo_atrasado"}` a las 17:15:52, 17:17:13 y
  17:28:26 UTC. El flujo «Foto diaria de la tokenización» falla cada día por su
  alarma: «El gráfico en directo está encendido y no responde bien (503
  directo_atrasado)» el 16/11 (16:24 UTC), 17/11, 18/11, 19/11 y 20/11 (16:00
  UTC). El 15/11 pasó. Nadie ha lanzado «Mercado en directo (base)» desde el
  14/11.
- **Además:** `/api/tokenizacion` tampoco lee CoinGecko en vivo: a las 17:15 y
  17:21 UTC da `"fuente":"foto-guardada","fecha":"2026-11-14"` (49.382 M$),
  cuando CoinGecko da 48.301 M$ (17:09:50 UTC). Así que, tras publicar, las
  cifras y el gráfico **se quedan quietos en la hora de la publicación** hasta
  la siguiente.
- **Corrección:** antes de publicar, mirar «Mercado en directo (base)», acción
  `estado`, y arreglarlo hasta que `/api/tokenizacion/directo` dé 200. Si no se
  arregla hoy, cambiar el texto (y su versión en inglés):
  - resumen: título «El mercado, con su gráfico»; texto «Míralo en «Mercado y
    noticias». Ahora se actualiza cuando publicamos la web.»
  - detalle: título «El mercado de activos tokenizados, con su gráfico»; segundo
    párrafo «Las cifras y el gráfico se actualizan cuando publicamos la web y
    llevan su fecha y su hora. El directo cada 5 minutos no funciona desde el
    16/11.»
  - descripción de /novedades-rwadar/: «…explicado fácil: el gráfico del
    mercado, las noticias con foto, los avisos en el móvil y «Calcula tus
    números».»
  - Ojo: subir la versión vuelve a abrir la ventana de novedades a todos.
- Nota práctica: relanzar «Tokenización diaria» justo antes de publicar (como
  dice DECISIONES §1) saldrá en rojo por esta alarma, pero los datos se
  guardan igual en la rama (hoy, commit de las 15:58 UTC).

### 2. Plataformas del radar: «Cómo funciona y qué se ha comprobado» desmentido por sus fuentes

Todas leídas en https://rwadar.pages.dev/plataformas/<slug> a las 17:22 UTC. El
párrafo sale del campo `aval` (y el subtítulo, del campo `nota`) del radar; los
dos van también al CSV público `https://rwadar.pages.dev/rwadar.csv`
(columnas «Por que» y «Descripcion»). Coincide con lo que ha encontrado la
auditoría del radar.

| Página | Publica | Fuente hoy (UTC) | Corrección exacta |
|---|---|---|---|
| swarm | «Opera bajo licencia de intermediación financiera de BaFin, el regulador alemán, con respaldo 1:1 verificable.» y, de resumen, «…dentro del marco regulatorio alemán.» | Términos de docs.swarm.com (17:27): Swarm Capital GmbH actúa «as a technical service provider within the meaning of Section 2 (1) no. 9 of the German Payment Services Supervision Act (ZAG)». La misma página de RWAdar: «ninguna fuente primaria consultada indica licencia ni regulador». | `aval`: «Sus términos presentan a Swarm Capital GmbH como contraparte y como proveedor técnico. No hemos encontrado licencia ni regulador en sus fuentes.» `nota`: «Acciones y bonos tokenizados. No hemos confirmado licencia ni regulador.» |
| inx | «Bróker-dealer registrado ante la SEC y miembro de FINRA; su matriz cotiza en Nasdaq.» | FINRA BrokerCheck, informe de INX Securities (17:27): dueño directo «INX LIMITED», «Is this a public reporting company? No»; dueño indirecto «OPENDEAL, INC.» a través de «REPUBLIC STRATEGIC ACQUISITION CO», también «No». | `aval`: «Bróker-dealer registrado ante la SEC y miembro de FINRA, que opera un ATS. Pertenece a INX Limited, del grupo Republic (OpenDeal).» `nota`: quitar «regulada» y «abierta a minoristas» (el acceso está «No verificable»). |
| lofty | «Estructura de LLC por inmueble con oferta registrada; una de las pocas vías reales de entrada minorista al inmobiliario tokenizado.» | lofty.ai/terms (17:27): «9.4 Not Registered with the SEC or Any Other Agency». La misma página: «Su mercado no es una oferta registrada». | «Lofty no está registrada ante la SEC en ninguna capacidad, según sus términos, y su mercado no es una oferta registrada.» |
| superstate | «Fondos estadounidenses registrados con administrador y auditor independientes…» | superstate.com/assets/ustb (17:27): «The Fund is not registered as an investment company under the Investment Company Act». | «Fondos estadounidenses que no están registrados como sociedad de inversión: no tienen las protecciones de los fondos registrados.» |
| backed-finance | «Emisor suizo con el activo real depositado 1:1…» | docs.xstocks.fi (17:27): «xStocks are issued by Backed Assets (JE) Limited, a Jersey-based special purpose vehicle». | «Los xStocks los emite Backed Assets (JE) Limited, sociedad de Jersey del grupo Backed; según su documentación, cada uno está respaldado 1:1 por la acción, guardada por custodios regulados.» |
| pax-gold | «Emitido por Paxos bajo supervisión del regulador bancario de Nueva York (NYDFS)…» | paxg.com (17:27:36): «PAXG is issued by Paxos Trust Company, N.A., a U.S. national trust bank regulated by the Office of the Comptroller of the Currency.» | «Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC.» |
| franklin-templeton | «…La vía más conservadora para empezar.» | Es una recomendación; la misma página dice «Que algo aparezca aquí no es una recomendación ni una garantía». | Borrar «La vía más conservadora para empezar.» |
| securitize | «Agente de transferencia registrado ante la SEC. Es quien emite y administra el fondo tokenizado BUIDL de BlackRock.» | rwa.xyz, ficha de BUIDL (17:21): emisor «BlackRock USD Institutional Digital Liquidity Fund». | «Agente de transferencia registrado ante la SEC. Lleva el registro del fondo tokenizado BUIDL, que emite BlackRock USD Institutional Digital Liquidity Fund.» |

### 3. El resto de `aval` y `nota`: afirmaciones sin respaldo bajo «qué se ha comprobado»

Mismas páginas, 17:22 UTC. Ninguna fuente de la página las respalda y varias
chocan con el texto revisado de la misma página: Courtyard («Líder por volumen
semanal en 2026», «canjeable por él en cualquier momento: respaldo
comprobable»), Reental («con cientos de reseñas públicas verificadas de
inversores»), Ondo («La mayor plataforma de valores tokenizados por volumen»),
Centrifuge («dos tercios del crédito privado tokenizado»), Fireblocks («usada
por bancos y gestoras de primer nivel»; la página dice «No todos los servicios
de Fireblocks son custodia regulada»), Blocksquare («Vincula cada token a una
anotación en el registro de la propiedad»; la página dice «No identifican
entidad ni registro»), Midas («Levantó 50 M$ con Franklin Templeton y Coinbase
Ventures»), Securitize («El nombre más institucional del sector») y tZERO («El
mercado secundario de referencia en EE. UU.»).

**Corrección:** que la página de plataforma deje de pintar `aval` bajo «Cómo
funciona y qué se ha comprobado» (`rwadar-fichas.js`, línea 312) y que
`rwadar.csv` deje de sacar «Por que» (`rwadar-app/sincronizar.js`, filas del
CSV) mientras cada texto no tenga fuente; o sustituirlos por los textos del
punto 2 y borrar las frases citadas aquí. Si se publica sin tocar nada, estas
frases saldrán con «Revisión editorial: 20/11/2026».

## Recomendadas

4. **/mercado/ e Inicio: «hoy» con datos de otro día.** En el bloque de datos
   de /mercado/, «Total de la categoría hoy» (código, `mercado-20261111.js`,
   línea 490) enseña el total aunque sea una foto guardada; ahora mismo, el del
   14/11 (49.382 M$, `/api/tokenizacion` a las 17:15 y 17:21 UTC) frente a los
   48.301 M$ de CoinGecko (17:09:50 UTC). En la tarjeta de Inicio, con el
   directo caído, sale «copia de las 15:00» sin fecha (línea 704). Al publicar
   hoy quedará bien unas horas; desde el 21/11 volverá a pasar. Corrección:
   con `fuente: foto-guardada`, «Total de la categoría (foto del DD/MM/AAAA,
   HH:MM)»; «Valor hoy» → «Valor el DD/MM/AAAA» si no es de hoy; en Inicio,
   «copia del DD/MM, HH:MM».
5. **Qué categoría de CoinGecko.** La web dice «Total de la categoría» y enlaza
   a coingecko.com sin decir cuál. La que usa es «Tokenized Assets»
   (`tokenized-products`, 48.301 M$ a las 17:09:50 UTC); la que CoinGecko
   llama «Real World Assets (RWA)» da 67.349 M$ (incluye tokens de los
   protocolos). Corrección: «Total de la categoría «Tokenized Assets» de
   CoinGecko» en la línea de la fuente y en «Cómo se calcula».
6. **Spiko en el radar.** /plataformas/spiko dice «Fondos monetarios
   autorizados y supervisados por la AMF… Marco europeo completo.» El catálogo
   nuevo dice de Smart Cash que «el 20/11/2026 el fondo ya no aparece en la base
   pública de la AMF (GECO)». La ficha GECO c79399 (EU T-Bills) sigue «Vivant»
   (17:20:29 UTC). Corrección: «Fondos monetarios de la SICAV francesa Spiko
   SICAV, gestionados por Twenty First Capital. No todos aparecen hoy en la base
   pública de la AMF: compruébalo fondo a fondo.»
7. **Backed sin ofertas.** /plataformas/backed-finance dice «Todavía no tenemos
   fichas de ofertas concretas de esta plataforma», pero la ficha de Kraken
   xStocks nombra como emisor a Backed Assets (JE) Limited, «filial 100 % de
   Backed Finance». Corrección: enlazar «xStocks: certificados tokenizados que
   siguen el precio de acciones de EE. UU.» en «Ofertas de esta plataforma».
8. **/cambios y el RSS se quedaron en el 06/11.** La entrada «App Android 1.4.2,
   preparada para las notificaciones del móvil» dice «todavía no están
   activas», y privacidad (revisada el 14/11) dice que llegan desde el 12/11.
   Faltan las revisiones del catálogo del 13/11 y del 20/11 y las novedades del
   14/11. Corrección: añadir al final de esa entrada «(Desde el 12/11/2026 ya
   funcionan.)» y una entrada «20/11/2026 · Catálogo revisado: 22 ofertas y 25
   plataformas».
9. **Privacidad nombra una «página para empresas» que ya no existe.**
   «…la página para empresas recoge solo expresiones de interés…» y «correo
   visible en la página para empresas»; /para-empresas redirige a Inicio (302,
   17:15 UTC). Corrección: «el apartado «¿Quieres colaborar con nosotros?» de
   Inicio».

## Lo que se comprobó y está bien

- **Mercado (rama `datos-tokenizacion`, lo que se publicará):** total 48.354,8
  M$ (15:30 UTC) frente a 48.300,6 M$ de CoinGecko (17:09:50 UTC, −0,11 %);
  crédito privado, letras, materias primas, fondos monetarios, otros créditos y
  oro dentro del ±0,2 %; acciones y ETF −1,8 % y −1,7 % (movimiento del día).
  Último punto de la serie (30 tokens) 42.032,8 M$ frente a 41.999,4 M$
  sumando hoy esos 30 en `/coins/markets` (−0,08 %, 17:23 UTC). Serie de 364
  días, del 21/11/2025 al 20/11/2026. La cifra rara del 11/11 (+124 % en 24 h)
  la filtra el código.
- **Noticias nuevas (`noticias-v2.json`):** las 5 fuentes abren (CNMV 16/11 y
  18/11, CNMV 28/10, suplemento de Robinhood del 09/11, Consejo de la UE) y
  dicen lo publicado (tres avisos de BaFin; 9 entidades con dos clones; Bit2Me
  STX; reducción de tokens por costes; tope de 6.000 a 300.000 millones). Las 5
  llevan imagen, como dice la novedad. /noticias/ redirige a
  /mercado/#noticias.
- **Aprende:** 39 de 43 enlaces responden 200 y los otros 4 son bloqueos de
  robots. Comprobados hoy: 458 advertencias de la CNMV en 2025; DTCC, 28/10 y
  20 participantes con J.P. Morgan; Pontes con Santander, Cecabank y ABANCA
  entre 13; Qivalis con licencia y aún sin moneda (su web sigue en futuro);
  T+1 el 11/10/2027.
- **Novedades:** avisos sin cuenta activos (`/api/avisos/texto`, `activo:
  true`); «¿Quieres colaborar con nosotros?» y rwadares@gmail.com en Inicio;
  «Mantener la sesión iniciada en este dispositivo» en /acceso.
- **Enlaces:** las 61 direcciones del mapa del sitio dan 200; de 98 enlaces
  externos de las páginas, 88 dan 200 y 10 son bloqueos de robots (403);
  enlaces internos bien (las lecciones de Academy piden cuenta, 401, como
  dicen).
- **Transparencia y privacidad:** coherentes entre sí y con lo que hay (sin
  comisiones ni patrocinios activos; notificaciones activas desde el 12/11 y
  sin cuenta desde el 14/11).

## Sin poder comprobar

- Ver las páginas pintadas en un navegador: los textos de /mercado/,
  /novedades-rwadar/ y la tarjeta de Inicio se han deducido del código y de
  los datos publicados.
- Enlaces con bloqueo de robots (no son enlaces rotos): time.com (406),
  coindesk.com (429), sec.gov (403), theblock.co (403, dos), centrifuge.io
  (403, dos), courtyard.io, detroitmi.gov, midas.app (dos), republic.com,
  thedefiant.io y spglobal.com (403).
- La descarga de la app Android (/android → GitHub releases): esta sesión no
  puede leer ese repositorio.
- Por qué está parado el directo (Supabase): no se ha tocado.
- Las cifras de `nota` de Maple (4.600 M$, +81 %) y de Ondo (ETF de Franklin
  desde 2026): sin fuente en la página; no se buscaron.
- No se repitieron las 69 comprobaciones del radar; solo las de arriba.
- Las versiones en inglés no se auditaron aparte (las correcciones de arriba
  valen también para su texto `en`).

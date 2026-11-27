# Investigación del catálogo · 27/11/2026

Orden de Víctor (27/11): «Nueva actualización de la app y web… Compruébala y haz la actualización pertinente. Añade lo
nuevo y retira lo caducado. Actualiza gráfico y noticias también». Material de partida: el informe de investigación
global del 27/11/2026 que pasó la dirección (cierre más cuatro rondas). Ese informe es investigación, no lista de
altas: cada cosa se comprobó hoy en su fuente original antes de usarla.

## Qué se comprobó y qué salió

**Ofertas (32 publicadas): ninguna caducada, ninguna nueva.**

- Vigía (09:28 UTC, contra la entrega del 26/11): 73 cifras sin cambios, 50 PDF con la misma huella y 29 búsquedas de
  la CNMV iguales. Solo cambian dos datos de reventa de Brickwise que no tocan ninguna tarjeta: en Stallhofstraße la
  orden de venta de menor importe pasa de 70,00 € a 71,90 € (la venta más barata sigue a 70 €) y en Drautalresidenz la
  mejor oferta de compra pasa de 50 € a 60 €. Las fichas siguen diciendo la cifra con su fecha (26/11) y valen hasta el
  03/12: se actualizarán en el próximo ciclo de ofertas.
- Las 11 ofertas internacionales del 26/11 (que el vigía no cubre), releídas hoy con navegador: TOHKN (IBER1, MMLTI1,
  RNCRrev), FINEXITY, Groma, Securitize HINC, Franklin y BlackRock dicen lo mismo que ayer. La oferta pública de
  FINEXITY sigue abierta hasta el 05/11/2027 y la pre-solicitud del bono de Mitsui sigue abierta. Liqi (control
  anti-bots de Cloudflare), ALTERNA (403) y Amundi (conexión cortada desde este entorno) no se pudieron releer hoy:
  se quedan con su comprobación del 26/11, que vale hasta el 03/12.
- Candidatas del informe (nueve clases de fondos monetarios que identifica la SEC, Colb, Sygnum/Hamilton Lane,
  Libeara/ULTRA, Obligate oTFY, Hastra, Midas, OnRe…): ninguna publica hoy condiciones, mínimo y estado de
  contratación comprobables para un inversor como los que pide una ficha. El propio informe lo dice («no hay evidencia
  suficiente para aprobar una nueva captación con cupo verificado»). No entra ninguna oferta; sí entran sus
  plataformas al radar (abajo).

**Radar: 8 plataformas nuevas y el radar entero comprobado hoy (65 plataformas).**

- Entran (cada una leída hoy en su propia web; `2026-11-27-v2/plataformas.py` y `fuentes/`): Libeara (Singapur,
  tecnología de fondos tokenizados), HashKey RWA (Hong Kong, solo profesionales), Obligate (Suiza, deuda tokenizada desde
  100.000 USD), Colb (Suiza, certificados de empresas pre-salida a bolsa), M3Sixty (EE. UU., fondo monetario con registro
  en cadena), Hastra (EE. UU., protocolo de crédito sobre YLDS de Figure), Backpack Securities (acciones de EE. UU.
  tokenizadas en Solana) y OnRe (reaseguro tokenizado; con el aviso de que su interfaz pública no da derechos frente al
  emisor).
- No entran: Sygnum y Matrixdock (403 hoy), Estate Protocol (sin actividad comprobable), Kapital DX y Pitch Platforms
  (solo un comunicado de 2022 del supervisor de Malasia), Goldfinch (ya descartada, sin razón nueva), Clearstream,
  KASE y los fondos de BNY, Fidelity, JPMorgan y WisdomTree (sin plataforma propia para el inversor leída hoy).
- Para dar de alta con fecha de hoy, el contrato del catálogo exige que todo el radar lleve la misma fecha: las 109
  fuentes de antes se capturaron y contrastaron hoy (`radar-contraste-2026-11-27.json`): 106 en la captura y 3 a mano
  (REGAFI por su API pública, la lista de la OCC con navegador, la misma huella que ayer, y la nota de Amundi con
  WebFetch; `cambios-radar.json`). Ningún texto del radar cambia.
- Consecuencia: el lote vale hasta el 04/12, pero cada oferta conserva su fecha (26/11) y su tarjeta caduca el 03/12.
  El vigilante usa la fecha del lote, así que la preparación automática del siguiente ciclo salta el 02/12, antes de
  que caduquen las ofertas.

**Noticias del 27/11** (`rwadar-app/data/noticias-diarias/2026-11-27/`): ver su `EDICION.md` y `VERIFICACION.md`.

**Gráfico:** «Tokenización diaria» lanzado a mano por la mañana para tener la foto real del 27/11 de CoinGecko antes de
publicar (si ya hay foto del día, el flujo no hace nada, así que el de la tarde no duplica). No se inventa ningún
punto: si CoinGecko falla, el gráfico se queda en la última foto real.

## Entrega

- Etiqueta `2026-11-27`, sobre la `2026-11-26.4` (revisión `7f745c7d`). Revisión nueva `529a54f7`. 65 plataformas y 32
  ofertas (17/13/2). En `public.*` solo se insertan las 8 plataformas nuevas.
- Guiones adaptados de la `2026-11-26.4` (misma clase de entrega: solo plataformas): `preparar-entrega.mjs`,
  `comprobar-entrega.mjs` (PGlite: 19 pruebas y 8 casos de fallo que no dejan nada) y `despues-de-aplicar.mjs`.
- Portadas de las 8 plataformas con RealVisXL (`portadas.json`), revisadas una a una.

## Revisión (una sola, independiente)

- **Catálogo:** un revisor independiente leyó el SQL (guardas, solo 8 inserts en `public.*`, reproducible), el re-fechado
  del radar (109/109, solo cambian fechas) y cada texto de las 8 plataformas contra su copia. Pidió afinar 6 textos que
  decían más que su fuente, y se aplicaron tal cual: Backpack (sí nombra al emisor; no dice dónde está registrado),
  OnRe (por la vía abierta se compra sin verificación ni mínimo, pero sin derechos frente al emisor; la vía institucional
  dice estar regulada por la Autoridad Monetaria de Bermudas, sin comprobar), M3Sixty y Hastra («dice estar
  registrado», no comprobado; Hastra pasa a «Emisor» y «Global»), Colb (sin el inciso del voto; mínimo en «$USC», como
  la fuente) y Libeara (acceso «Empresas», como las demás de tecnología). El SQL cambió solo en esas 6 plataformas (diff
  normalizado: 31 líneas, mismas sentencias y guardas) y el ensayo en PGlite se repitió entero en verde. Revisión
  nueva `529a54f7`, SHA-256 del SQL `decf800b…`.
- **Noticias:** el primer verificador pidió quitar Poloniex porque su descarga simple solo trae el armazón de la web
  (el anuncio se carga con JavaScript). Por orden de la dirección («intenta leer la noticia, no la descartes»), la
  edición pasó entera a un verificador nuevo, con la nota de método de abrir con navegador esas webs: conforme.

---

# Entrega 2026-11-27.2 · todo en una (orden de Víctor: «Mételo todo en 1 entrega y acuérdate del gancho de las notis»)

Material: el suplemento de ofertas del 27/11, el consolidado de cierre y el informe de noticias ampliado, todo de ese
día. Cada dato se leyó hoy en su fuente original como visitante (copias en `2026-11-27.2-v2/fuentes/`, sin nombres de
personas; índice con hora y SHA-256 en `fuentes/lecturas-2026-11-27.json`).

## Qué cambia

- **Ofertas publicadas, comprobadas hoy (orden de Víctor: «que esté verificado hasta el día de hoy»).** 29 de las 32
  pasan a «comprobada el 27/11»: su página principal se leyó hoy (relectura de las 292 fuentes citadas, 11:08–11:24
  UTC, y vigía de las 10:19 UTC). Solo cambia la fecha de consulta; las fechas de los datos (p. ej. el valor
  liquidativo de Spiko) no. Brickwise toma las cifras del libro de órdenes del vigía. Conservan el 26/11: Liqi y
  ALTERNA (no se dejaron leer) y mTBILL (403), y, dentro de las fichas re-fechadas, las observaciones hechas en la app
  a una hora concreta, el libro de Switzerlend de las 18:17 UTC y la búsqueda en el registro de FINMA (hoy solo se leyó
  su portada). Detalle: `refechado.json`.
- **8 ofertas nuevas:** bono 2026/2031 de HWK 1365 (grupo siderúrgico alemán con pérdidas, aviso de riesgo de
  insolvencia), lingote de plata récord y Great Hampton Street Works (Birmingham) en Tokinvest, clase SD tokenizada del
  monetario en HKD de HSBC, MUFG Realty Token Kioicho (en camino; solicitudes del 01/12 al 08/12), USTNT de EX.IO (solo
  profesionales), el monetario en dólares de Taikang en OSL (desde 1 USD) y el bono de devolo en CONDA (no se ofrece en
  España).
- **6 plataformas nuevas:** HWK 1365, HSBC, Daiwa Securities, EX.IO, OSL y CONDA. Radar: 71; ofertas: 40 (24
  principales, 13 de reventa y 3 en camino).
- **Fuera, con motivo** (cabecera de `altas.py`): Mesh CCS Income Notes (su FAQ dice que la oferta pública cerraba el
  03/10/2026 y nada leído hoy prueba que siga abierta), INANAM (Form D con 403 y solo acreditados), Tidefront (el
  emisor dice que su información no puede distribuirse en público), y las del suplemento sin términos comprobados hoy.
  EX.IO bloquea sus páginas de producto desde EE. UU.: no se eludió, se usó su anuncio público.
- **Noticias, edición b:** entran los supervisores de Canadá (fase 2 del proyecto de tokenización) y el Banco Nacional
  Suizo (registro común de valores y dinero digital); salen SBI Solana Global y BCE y estándares DLT. Dos verificadores
  independientes; el segundo, conforme. El gráfico no cambia (el informe lo da igual).

## Revisión (una sola, independiente)

5 bloqueantes y 10 menores, todos corregidos salvo uno documentado: Mesh fuera; las dos insolvencias de devolo, dichas
en el aviso y la descripción; las licencias de CONDA y OSL, «según su web/según OSL» y no como hecho; 7 nombres de
personas (y una fecha de nacimiento) retirados de las copias; la hora imposible de Switzerlend; EX.IO sin la frase del
bloqueo; Daiwa da su registro; MUFG, plantas 10 a 16 y aviso válido toda la semana; OSL con la fecha del dato; HSBC sin
reembolso inventado; la plata sin «si no sube, pierdes». Amundi se re-fecha con la lectura de WebFetch de las 09:52
UTC (anotada en `2026-11-27-v2/cambios-radar.json`). Imágenes rehechas: la plata (letras inventadas en los lingotes) y
la portada de CONDA (dos personas al fondo).

# Catálogo · 26 de noviembre de 2026

Orden de la dirección (26/11): «No gastes agentes extra gasta solo tu capacidad, coteja la información de códex
que es de hoy con lo que hiciste y lanza la actualización de toda la app y la web». Sobre las fotos de las ofertas:
«Haz lo que mejor quede y mejor sea, para Rwadar».

## Resultado

- **Entrega 2026-11-26** (revisión `47b53d7d`): las 22 fichas re-verificadas hoy, vigentes hasta el **03/12/2026**.
  300 cambios, cada uno con su prueba de hoy; la mayoría solo de fecha («consulta 26/11/2026»).
- **Entrega 2026-11-26.2** (revisión `4601a164`): sale **«Hausera · próximas ofertas»**. Alicante 3 figura como
  financiada (5.196.000 €) y las 15 operaciones de su lista están financiadas: no hay nada «en camino».
- Quedan **21 ofertas** (8 principales, 13 de reventa, 0 en camino) y 25 plataformas (5 descartadas).

## Cifras que cambian

- Spiko Letras del Tesoro Euro **2,45 → 2,44 %** (VL del 26/11, 1,063785 €); Dólar **4,00 → 3,90 %** en USD (VL del
  25/11); Smart Cash **2,84 %** (igual, VL del 26/11).
- mTBILL **1,0791 USD** y **3,42 %** anual en USD (ronda 500 del 24/11 frente a la 477 del 20/10).
- Brickwise (libro de órdenes de las 18:17 UTC): Gratwein **68,80 → 70 €**, Hinterstoder **75 → 77 €**; los demás
  mínimos, iguales. Cambian algunas órdenes (Sonnleithnergasse: la orden más pequeña pasa a 100 €).
- Switzerlend: ya **no hay órdenes de compra** entre accionistas (el 21/11 había una a 59 ZCHF).
- Aktionariat, Boss Info, Robinhood, Kraken y Prosegur: sin cambios en sus fuentes.

## Cotejo con Codex (25–26/11)

- #204 (noticias del 25/11) y #206 (gráfico) entran tal cual; la prueba de la serie de 400 días se ajusta a la regla
  de #206.
- Su lote `catalogo-2026-11-25-v2` (retirar Hausera y cifras de Spiko del 21/11, sin ampliar la vigencia) no se
  aplicó: lo sustituyen estas dos entregas, con las cifras de hoy y la vigencia ampliada (`LEEME.md` en su carpeta).

## Cómo se hizo (una sola sesión, sin agentes)

1. Lectura pública (18:16 UTC) y vigía (18:17 UTC): 20 cifras cambian, 57 no; 50 PDF con la misma huella.
2. Radar 69 de 69. A mano: REGAFI (API pública), Centrifuge (navegador) y la OCC (PDF). Blocksquare puso su
   documentación para socios tras inicio de sesión: se cita su web y se corrigen los dos textos que se apoyaban en ella.
3. Cada fuente de las 22 fichas, releída como visitante (173 lecturas, 18:18–18:43 UTC; lista en
   `fuentes/releidas-2026-11-26.txt`). Un dato solo se re-fecha si su fuente se leyó hoy.
4. `montar.py` escribe expedientes y `decisiones.json`; el motor prepara, ensaya en PGlite (19 pruebas, 6 casos de
   fallo) y audita (`conforme_sin_cambios_en_el_sql`, gitleaks sin hallazgos). La 26.2, con su guion y su ensayo
   (16 pruebas, 6 casos de fallo, también contra la lectura pública tras aplicar la 26).
5. Una sola revisión del diff (`DIFF-ENTREGA.md`); un arreglo (no enseñar una dirección técnica como fuente).
6. Vigía antes de aplicar (19:07 UTC): las 77 cifras, iguales.

## Lo que queda

- Candidatas nuevas: llegaron con el informe global de Codex del 26/11 (abajo, entrega 2026-11-26.3).
- Hausera: si anuncia otra operación, se valora como alta nueva.
- Spiko Smart Cash: la AMF sigue sin la ficha del fondo en GECO.
- La referencia «Historial publicado» de Hausera no se re-fechó: salió con la tarjeta.

Detalle: `rwadar-app/data/verificaciones/2026-11-26-v2/` y `2026-11-26.2-v2/`.

## Entrega 2026-11-26.3 · altas del informe global de Codex

Por orden de la dirección del 26/11 («añádelo a la actualización», «RWAdar es internacional», «no descartes las
internacionales», «pon las nuevas en primera portada»), sin subagentes. Cada dato se leyó hoy en su fuente, como
visitante (copias y SHA-256 en `2026-11-26.3-v2/fuentes/`; avisos de entrada y cookies aceptados con permiso).

| Oferta | Dónde | Colección | Lo que dice su fuente |
|---|---|---|---|
| TOHKN IBER1 | El Salvador | Principales | Bono corporativo tokenizado, 7,00 %, 100 USD, abierto |
| TOHKN MMLTI1 | El Salvador | Principales | Bono corporativo tokenizado, 6,20 %, 100 USD, abierto |
| TOHKN RNCRrev | El Salvador | Principales | Ingresos de un condominio, TIR objetivo 15–20 % (sin cifra en la tarjeta) |
| Liqi, créditos a empresas | Brasil | Principales | 7 tramos en captación; el mayor, 20,98 % anual en reales |
| FINEXITY bono 2026-2030 serie B | Alemania | Principales | Euríbor 6m + 6 %, mínimo 7 %; oferta pública solo en Alemania |
| Groma Real Estate Trust | EE. UU. | Principales | REIT (Reg D / Reg CF), 1,07 USD, 3,97 % |
| Neuberger Securitize HINC | EE. UU. | Principales | Fondo de renta tokenizado, 100.000 USD, solo acreditados |
| BlackRock HKD Digital Liquidity | Hong Kong | Principales | Participaciones tokenizadas de un monetario en HKD |
| Amundi Core STOXX Europe 600 tokenizada | Luxemburgo | Principales | Clase tokenizada (05/11); acceso no publicado |
| Franklin OnChain Euro Liquidity | Luxemburgo | En camino | Anunciado el 23/11; minoristas de siete países, España incluida |
| Bono digital de Mitsui (ALTERNA) | Japón | En camino | Pre-solicitud; tipo orientativo 1,80–2,40 %, se fija en enero |

- Plataformas nuevas (7): ALTERNA, Amundi, BlackRock, FINEXITY, Groma, Liqi y TOHKN, con 10 fuentes nuevas
  comprobadas (`comprobaciones-fuentes.json`) y la región «Latinoamérica».
- Lo que no se tomó del informe: retirar las 11 de Brickwise (sus órdenes se comprobaron hoy en su API); el detalle de
  HSBC RedCoin (solo prensa); las ~30 plataformas solo de radar de su sección 09 (otro ciclo).
- Catálogo: 32 plataformas y 32 ofertas (17 principales, 13 de reventa, 2 en camino); revisión e74636ea, sobre la
  4601a164. Ensayo PGlite: 20 pruebas y 9 casos de fallo que no dejan nada.
- Orden: en Ofertas (web y app), «Más nuevas primero» por defecto; Inicio ya enseña las 6 más nuevas.
- Imágenes: 11 fotos nuevas generadas con el mismo modelo que las demás (RealVisXL), una por oferta y sin repetir
  ciudad ni escena. Las fotos reales de Wikimedia siguen sin poder descargarse desde aquí (responde 429).
- Noticias del 26/11: Singapur (fondos no tradicionales), SBI Solana Global y las primeras operaciones con oro
  digital mayorista; salen OKXICE, HSBC RedCoin y el aviso de BaFin. Gráfico: las 16 fotos de Codex cuadran con las
  de `datos-tokenizacion`, más la del 26/11.

- Lo que seguía con fecha del 21/11: la comprobación de mTBILL en BaFin se volvió a leer hoy y pasa al 26/11; la de
  su documentación legal (docs.midas.app) responde 403 a la lectura automática y conserva el 21/11, su última lectura.

Detalle: `rwadar-app/data/verificaciones/2026-11-26.3-v2/` y `rwadar-app/data/noticias-diarias/2026-11-26/`.

## Entrega 2026-11-26.4 · plataformas del radar del informe de Codex (sección 09)

Por orden de la dirección del 26/11 («añade las 30 plataformas del radar de Codex», «las que verifiques que son
reales; si pide aceptar cookies, acéptalas»), sin subagentes. Cada plataforma se leyó ese día en su propia web, como
visitante y aceptando el aviso de cookies o de entrada cuando lo pedía (copias, hora, HTTP y SHA-256 en
`2026-11-26.4-v2/fuentes/`). Cada frase en la que se apoya una ficha está en esas copias (`plataformas.py` lo
comprueba al generar `altas.json`). En la copia de Caliber se taparon los datos de contacto de personas.

| Región | Plataformas nuevas |
|---|---|
| Latinoamérica | Raíz, Tokeniza, Etherfuse, HATOR, Real Tokn, Bloktok |
| España y Unión Europea | Bit2Me STX, Assetera, Estating, Seturion, DigiShares |
| Reino Unido | Ctrl Alt |
| Asia-Pacífico | DigiFT, SDAX, Terazo, Luxivana, TangibleX |
| Oriente Medio (región nueva) | Tokinvest (licencia comprobada en el registro de VARA), PRYPCO Mint |
| África (región nueva) | Mesh, Oaksvale, Cradle, Shard |
| EE. UU. | Caliber, OKXICE |

- Licencias: solo la de Tokinvest se comprobó en el registro del supervisor; en el resto la ficha dice lo que declara
  la web y que no lo hemos comprobado, o que no declara ninguna (Raíz, Bloktok, Oaksvale y Shard).
- Fuera, con su motivo en `plataformas.py`: AndX (promete un retorno mínimo sin regulador), Expedit (cita CNMV, SEC y
  FINRA sin números de registro), Tokenia (piloto en red de pruebas), PropertyHandle (sin ofertas, esperando al
  regulador), Mercado Bitcoin y WisdomTree (403 como visitante), DAMREV (429) y RedSwan, Binaryx y NewEarthX (el
  propio informe las descarta).
- Catálogo: 57 plataformas y las mismas 32 ofertas (17/13/2); revisión 7f745c7d, sobre la 25b54edc. SQL con guardas:
  en `public.*` solo inserta las regiones «África» y «Oriente Medio» y las 25 plataformas. Ensayo PGlite: 20 pruebas y
  9 casos de fallo que no dejan nada; antes de aplicar, PGlite = lo publicado leído como visitante.
- Portadas: 25 nuevas con RealVisXL, realistas, sin texto ni personas y sin repetir escena. Por indicación de la
  dirección («el camino raro verde parece IA») se rehicieron con luz normal y colores apagados las que parecían
  artificiales (HATOR, SDAX, Seturion, Shard, Cradle) y las que repetían encuadre (Bit2Me STX, Terazo, PRYPCO Mint).
- App: el diccionario inglés suma «África», «Oriente Medio» y «Varias»; la prueba del radar de Inicio compara el
  lienzo con las cifras reales del catálogo (ya hay categorías con más de 9).

Detalle: `rwadar-app/data/verificaciones/2026-11-26.4-v2/`.

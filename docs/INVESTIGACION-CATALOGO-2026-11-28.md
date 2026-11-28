# Investigación del catálogo · 28/11/2026

Orden de Víctor (28/11): «Está es la investigación de códex, revísala y haz la actualización pertinente de la app
quitando lo caducado poniendo lo nuevo y enviando las notificaciones a todo el mundo». Después: «Solo quita las
caducadas y añade las nuevas ofertas plataformas noticias y gráfico y las notificaciones» y «No uses agentes eh solo
tú». Material de partida: el consolidado de Codex del 28/11 (oportunidades, noticias y gráfico, con nueve adendas).
El propio informe dice que no confirma ninguna captación abierta: es investigación, no lista de altas. Cada cosa se
comprobó hoy en su fuente original antes de usarla.

## Ofertas

**Caducadas: ninguna.** Las 40 publicadas se releyeron hoy con navegador (13:1x UTC) o con el vigía (13:05 UTC):
TOHKN (IBER1, MMLTI1 y RNCRrev) dicen «Open»; el bono de devolo en CONDA sigue en suscripción (12 días, 363.500 € de
500.000 €); el de HWK 1365, el lingote de plata y Great Hampton Street de Tokinvest, Finexity, Groma, Securitize HINC,
BlackRock, HSBC, OSL, Robinhood, Kraken, Prosegur, Spiko, las suizas y las 13 de Brickwise siguen igual; MUFG Kioicho
abre el 01/12 (sigue «en camino»). Liqi, mTBILL (Cloudflare), Amundi (conexión cortada) y EX.IO (bloqueo por país desde
este entorno) no se dejaron releer: conservan su fecha. Por la orden de la dirección («solo quita las caducadas y
añade las nuevas»), las 40 no se tocan: el vigía vio que Spiko (VL y rentabilidad de EUTBL 2,44 → 2,45 %) y mTBILL
(3,42 → 3,29 %) han movido sus cifras, que siguen publicadas con su fecha del 26-27/11 y se actualizarán en el próximo
ciclo de ofertas.

**Nuevas: 4** (principales; las primeras de la lista):

| Oferta | Plataforma | Lo esencial | Disponibilidad |
|---|---|---|---|
| Invesco IROXX | Superstate | Monetario de EE. UU. (Rule 2a-7) pensado para reservas de monedas estables; 3,61 % SEC a 7 días a 26/11; desde 1.000.000 USD | Sin confirmar (no publica la lista de países) |
| Bono de LynxCap | Tokinvest | Bono senior garantizado sobre préstamos impagados e inmuebles recuperados en Europa; cupón trimestral (tipo sin publicar); 4 años; desde 10.000 € | Solo inversores elegibles de Emiratos |
| VPH Riga, fase VI | Bondea (nueva) | Parque comercial con Rimi en Riga; 9 % anual a 16 meses; desde 1.000 €; 415.000 € de 750.000 € y 7 días el 28/11 | Lituania; resto sin confirmar |
| SilverBits SLVR | SchindlersX (nueva) | Un token = una onza de plata en Union Vault; desde 1 token (1.021,36 ZAR el 28/11); canje por lingotes de 1 kg en Sudáfrica | Sudáfrica; resto sin confirmar |

No entran (motivo en `2026-11-28-v2/altas.py`): NORVAULT/CanTra Bacon Series 001 y Metals.io xCu (sus webs y la nota de
prensa bloquean el acceso con Cloudflare/Akamai: no se elude), Ondo BIG5on y SPYSHIELDon (Ondo bloquea por país desde
aquí), Banco Atlántida ALDT001-T40 (el aviso no dice cuántos tokens quedan: entra solo la plataforma), winvesta Verde
Beach (rentabilidad solo prevista: entra solo la plataforma), RealUnit (la FAQ no carga a quién admite ni el precio),
Orbitum (Cloudflare) y el resto, que el propio informe deja en revisión o vigilancia.

## Plataformas: 6 nuevas y el radar entero comprobado hoy (79)

- Entran (cada una leída hoy en su web): Banco Atlántida El Salvador, Bondea, Axiology, Marketnode (licencia
  confirmada en el directorio de la MAS), winvesta y SchindlersX. Portadas generadas en local (RealVisXL).
- Radar comprobado entero hoy: 130 fuentes en la captura, 3 a mano (REGAFI por su API, el PDF de la OCC con navegador y
  Colb esperando a que cargue) y 2 cambios: EX.IO bloquea su web por país desde aquí, así que su ficha del radar pasa a
  apoyarse en la lista oficial de la SFC (EXIO Limited, licencia formal desde el 18/12/2024; antes decía «no lo hemos
  comprobado»); y Centrifuge bloquea con Cloudflare sus términos (403 tres veces), así que esa fuente sale del radar y
  lo que respaldaba (licencia y acceso) pasa a «no verificable» con la web de Centrifuge, que sí se leyó.
- Pendiente: el texto público `aval` de EX.IO (en `public.plataformas`) aún dice «dice estar aprobada… en el régimen
  de licencia provisional; no lo hemos comprobado». La SFC la da como licencia formal: conviene corregirlo con el flujo
  de textos del radar.

## Noticias

Edición del 28/11 (8): entran Emiratos (primeros bonos soberanos digitales en dírhams, AED 180 M), la AMF y Euroclear
France (liquidación DLT D-FMI+) y Austria (DELPHI: liquidación en dinero de banco central con Pontes); salen Banco de
Japón, coinIX/21X y Suiza. Fuera por bloqueo: B3/Open BRL, Binance, MAS, el comité de la SEC. Fuera por criterio: DTCC
(opinión), CertiK (no primaria), Nigeria, Ondo/Tangem y el banco central checo. Editor con el procedimiento de las
noticias automáticas; la verificación la hizo la sesión principal (por la orden «no uses agentes»), abriendo cada
fuente: conforme.

## Gráfico

«Foto diaria de la tokenización» lanzado hoy a las 13:04 UTC. CoinGecko da hoy un cambio anómalo (+128,8 %) que la
regla de integridad deja en blanco; si la foto no es coherente, se conserva la del 27/11.

## Cómo

`2026-11-28-v2/altas.py` → `altas.json`; `comprobar-radar.mjs` (con `cambios-radar.json`), `preparar-entrega.mjs`,
`comprobar-entrega.mjs` (PGlite: 18 pruebas y 8 casos de fallo que no dejan nada) y `despues-de-aplicar.mjs`,
adaptados de la 2026-11-27.2. Escáner de secretos limpio. Una sola revisión (la sesión principal): corrigió «hoy» en
textos que se quedarían viejos, la disponibilidad de IROXX en España (sin confirmar, no «no») y la foto de la plata
(letras inventadas en los lingotes; rehecha).

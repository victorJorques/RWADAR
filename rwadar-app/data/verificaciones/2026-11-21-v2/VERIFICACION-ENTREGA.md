# Verificación de la entrega 2026-11-21 (comprobación determinista)

Generado por `motor.mjs auditar 2026-11-21`. Compara el SQL que vieron los revisores con el de después de corregir.

**Veredicto:** EL SQL CAMBIÓ. Hace falta el auditor (agente) para ver que cada diferencia de abajo es una corrección pedida.

- SQL revisado (antes de corregir): `c7f994423f918cfd5c1a24e6e9822cc758cec2ab5491a19894c994a9d722fe5f` (es el que dio el montador).
- SQL final: `0486c6fd7104e93e1265f654d4870308b9b3abbf5e6dba0192bd26f8e8984d40`.
- Rehecho dos veces desde decisiones.json en una carpeta aparte: mismos SHA-256 las dos veces: sí; igual byte a byte a lo de la carpeta: sí.
- Mismo inventario de sentencias antes y después: sí (288 sentencias: 35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias que cambian (sin contar la revisión y la huella): 18.
  - rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro':
    - «» → «Comisión de gestión · 21/11/2026","valor":"0,25 %","fechaDato":null,"fechaConsulta":"2026-11-21","fuente":"https://data.spiko.io/eutbl/","alcance":"Visto en la fuente oficial el 21/11/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"»
    - «; VL » → «. El último valor liquidativo, »
    - «» → «, es el que publica Spiko en su API»
  - rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar':
    - «; VL » → «. El último valor liquidativo, »
    - «» → «, es el que publica Spiko en su API»
  - rwadar_catalogo.ofertas 'robinhood-classic-stock-tokens' 'https://robinhood.com/eu/es/invest':
    - «» → « en inglés»
    - «posibles » → «el KID en español pone 0,00 % de entrada (errata). Posibles »
    - «» → «.»
    - «; el KID en español dice 0,00 % (errata)» → «»
  - rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill':
    - «21» → «17»
    - «11» → «07»
  - rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest':
    - «» → « »
  - rwadar_catalogo.ofertas 'kraken-xstocks' 'https://eu.kraken.com/xstocks':
    - « consultada el 03/11/2026» → «»
  - rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «» → «no consta que se comercialice en España y »
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «Mientras esté» → «Si sigue»
    - « » → «, puede »
    - «hay» → «haber»
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace':
    - «si lo pides» → «según Brickwise, pedirlo»
    - «Brickwise, » → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
  - rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace':
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
    - «participaciónes» → «participaciones»
  - rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/':
    - «está abierta desde » → «abrió »
- Ensayo en PGlite: correcto, 18 comprobaciones y 6 casos de fallo.
- Escáner de secretos sobre lo que irá a Git: sin hallazgos.

## Hallazgos

Ninguno.

# Grupo principales · puesta al día del 13/11/2026

He revisado las siete fichas principales del grupo entre las 08:30 y las 08:45
UTC del 13/11/2026. He vuelto a descargar cada fuente primaria (190 consultas)
y la he comparado con la de ayer por su huella SHA-256 o, en las páginas que
cambian solas, por su texto visible. Solo he usado páginas, documentos, API,
registros públicos y lecturas en cadena. No he iniciado sesión, no he hecho
KYC y no he tocado wallets ni formularios.

## En una frase

Cambian las cifras de las dos letras del Tesoro de Spiko (hay valor
liquidativo nuevo del 12/11) y la fecha de Spiko Euro. mTBILL, Robinhood,
Kraken y Prosegur siguen igual.

| Ficha | Publicado (12/11) | Hoy (13/11) | Propuesta |
|---|---|---|---|
| Spiko Letras del Tesoro Euro | 2,41 % (VL del 11/11) | **2,40 % (VL del 12/11)** | actualizar |
| Spiko Letras del Tesoro Dólar | 4,02 % en USD (VL del 10/11) | **3,98 % en USD (VL del 12/11)** | actualizar |
| Spiko Euro (Smart Cash) | 2,84 % (VL del 11/11) | 2,84 % (**VL del 12/11**) | actualizar (fecha) |
| mTBILL | 3,45 % pasada (06/10–10/11); 1,0777 USD (10/11) | igual: el oráculo no tiene ronda nueva | mantener |
| Robinhood Classic Stock Tokens | — | sin cambios | mantener |
| Kraken xStocks | — | sin cambios en la tarjeta | mantener |
| Prosegur Digital Gold | — | sin cambios | mantener |

## Spiko: las VL nuevas del 12/11

Spiko calculó ayer las VL nuevas: las letras del Tesoro a las 17:44 UTC y
Spiko Euro a las 20:39 UTC. Hoy, a las 08:30 UTC, todavía no hay VL del 13/11.
La próxima llega hoy hacia las 18:00 UTC (letras) y hacia las 19:30 UTC
(Spiko Euro). Si la entrega se monta después, habrá cifras nuevas.

He recalculado las tres cifras con la serie de VL de la API pública
(`/net-asset-values/<clase>?startDay=2026-09-20`, 08:30 UTC):

- **Letras del Tesoro Euro: 2,40 %.**
  - La API dice 0.024 (ayer, 0.0241).
  - VL del 12/11/2026: 1,062803 €.
  - Mi cálculo a 31 días (del 12/10 al 12/11): 2,400 %.
  - La web en español, data.spiko.io y la AMF (GECO, «1.0628 € au
    12/11/2026») dicen lo mismo.
- **Letras del Tesoro Dólar: 3,98 % en dólares.**
  - La API dice 0.0398 (ayer, 0.0402).
  - VL del 12/11/2026: 1,102694 $.
  - El 12/10 fue festivo en EE. UU. y no hay VL. Por eso tomo la del 13/10
    (30 días): 3,984 %.
  - La web y data.spiko.io dicen 3,98 %.
- **Spiko Euro: 2,84 %, igual que ayer.**
  - Cambia solo la fecha de la VL: la del 12/11, de 1,017107 €.
  - Mi cálculo, capitalizando: 2,84 % a 1 día y 2,83 % a 7 y a 31 días. A
    ritmo simple sale 2,80 %.
  - El €STR del BCE fue del 2,443 % el 12/11.
  - El literal sigue diciendo que es el tipo neto que publica Spiko, no lo
    que creció el fondo en un día.

**Qué hay que cambiar en la ficha:** la cifra, el literal y la métrica de
rentabilidad de las letras (Euro y Dólar). En Spiko Euro, la fecha del literal
y de la métrica. En `documentacion-ofertas.json`, la referencia «Rentabilidad
publicada» de las tres fichas.

**Lo que no cambia:**

- Los KID en español, inglés y francés, los folletos en inglés y francés, la
  copia de la AMF y los términos tienen la misma huella que ayer.
- El folleto en español sigue dando 403.
- La CNMV (SICAV n.º 2380, Aldana, Spiko Finance n.º 5325) dice lo mismo.
- Siguen los avisos de Spiko Euro: que no se pueda confirmar en un registro
  público que se venda en España, el «tipo fijo» y el «garantizado» de la web,
  y Amundi presentada como «Sociedad gestora».
- Sigue el choque del mínimo de la clase EUR del fondo en dólares (mismo
  archivo de la API).
- La tabla de países de docs.spiko.io se actualizó el 06/11. Solo cambia
  Noruega; España sigue marcada.

## mTBILL: el pendiente de ayer

- **Oráculo del emisor:** he leído en cadena las 492 rondas (08:33 UTC). La
  última sigue siendo la del **10/11/2026 a las 18:40 UTC** (1,07768132 USD).
  - No hay ronda del 11/11, que fue festivo en EE. UU.
  - Tampoco hay ronda del 12/11, que fue jueves hábil. Esto es nuevo: hasta
    ahora había una ronda cada día hábil.
  - Por eso la rentabilidad pasada no cambia: **3,45 % al año en dólares**,
    de la ronda 468 (06/10) a la 492 (10/11), 5 semanas justas, con la misma
    regla de ayer (ningún festivo en los extremos de la ventana).
  - El valor por token sigue en 1,0777 USD (10/11).
  - Matiz de método: la cifra usa el tiempo exacto entre rondas (35,18 días).
    Con 35 días naturales saldría 3,47 %.
- **Si aparece una ronda nueva antes de montar la entrega,** hay que recalcular
  con la misma regla. Por ejemplo, si es del viernes 13/11, la base es la ronda
  471, del viernes 09/10. Habría que cambiar a la vez el valor, la métrica y
  las fechas del aviso.
- **Límites de reembolso:** el conflicto sigue igual. Las Condiciones Finales
  dicen 25 % al día y el KID en español, 15 %. Son los mismos archivos (misma
  huella), así que el estado debe seguir en «fuentes_en_conflicto».
- **En cadena (08:35 UTC):**
  - La emisión, el reembolso y el token no están pausados.
  - La comisión del reembolso inmediato es del 0,07 % y el mínimo, de
    1 mTBILL.
  - En Ethereum hay 66,12 millones de mTBILL.
  - En el contrato de Superstate hay 6,22 millones de USDC (ayer, 8,29).
- **Registros:** ESMA tiene los mismos 41 documentos del emisor y los mismos 3
  del ISIN. La CNMV (pasaporte) tiene la misma huella. La FMA de Liechtenstein
  da la misma respuesta.
- **Contraste, no para la tarjeta:**
  - rwa.xyz da 3,32 % a 30 días y 1,51 % a 7 días. Bajan porque el valor no se
    mueve desde el 10/11.
  - DefiLlama sigue en 2,41 %, que es un salto de su serie.

## Robinhood, Kraken y Prosegur

- **Robinhood.** No cambia nada.
  - Los seis PDF (KID en inglés y en español, descripción de servicios en
    inglés y en español, tarifas y términos) tienen la misma huella que ayer.
  - La página en español dice lo mismo.
  - La CNMV (n.º 5299) y el Banco de Lituania dicen lo mismo. La web del Banco
    de Lituania solo añade un enlace en el menú.
- **Kraken.** La tarjeta no cambia.
  - Las páginas de Kraken UE, el aviso de riesgos, los términos, la ayuda y la
    FAQ tienen el mismo texto.
  - La tabla de comisiones solo añade un recuadro sobre Kraken Pro.
  - Los KID en español del emisor se regeneraron con fecha del 12/11: solo
    cambian los escenarios y la clase de riesgo es la misma.
  - **Novedad no crítica:** ESMA tiene un documento más del emisor (1.731). Son
    las condiciones finales del 09/11 de «Xetra-Gold xStock 4GLDx», un
    subyacente de una bolsa alemana. Las he leído y también dicen «offered in
    Liechtenstein and Switzerland»: siguen sin incluir España, así que el aviso
    publicado sigue siendo cierto.
  - Es la primera prueba en el emisor de xStocks de bolsas europeas, que la
    ayuda de Kraken anunciaba desde el 11/11. Kraken UE todavía no lo menciona.
- **Prosegur.**
  - El contrato, la página de transparencia y las preguntas frecuentes dicen
    lo mismo.
  - La web sigue diciendo «Compra mínima 1 gramo».
  - La relación de la CNMV y el CSV de ESMA son los mismos archivos.
  - El gramo cuesta hoy 117,96 € (ayer, 119,97 €); no va en la tarjeta.

## Advertencias de la CNMV (13/11, 08:30–08:31 UTC)

He buscado Spiko, Twenty First Capital, Amundi, Aldana, Robinhood, Kraken,
Payward, Backed, xStocks, Prosegur, Prosegur Custodia, Midas y Midas Software.
Ninguna tiene advertencias: el texto de cada búsqueda es igual al de ayer.
Las dos búsquedas de control («Trading» y «Gemini») devuelven resultados.

## Bloqueos e incidencias

- **Midas.** midas.app (página de mTBILL, llms.txt, llms-full.txt y JS) y
  docs.midas.app dan 403 entre las 08:30 y las 08:36 UTC. No he insistido.
  - No he podido leer el APY oficial.
  - Los datos de acceso que salían de la web siguen con fecha del 11/11.
  - Los PDF del emisor se descargan del CDN de GitBook y tienen la misma
    huella.
- **Spiko.** El folleto en español sigue en 403.
- **Backed.** assets.backed.fi sigue bloqueada por país. No lo he intentado
  sortear.
- **Datos personales.** He recortado los nombres de personas físicas de las
  copias renderizadas (testimonio de Spiko y nota de prensa de Prosegur). Las
  condiciones finales nuevas traen los nombres de los administradores, así que
  el texto completo queda en `crudo/` y en Git solo va un extracto sin
  nombres.
- **Aviso para el coordinador.** La carpeta del ciclo no tiene todavía
  `.gitignore`. La del 12/11 excluye los `*.pdf`, los `*.html` y `crudo/`.

## Archivos

- Expedientes en `../../expedientes/`:
  - `spiko-letras-del-tesoro-euro.json`
  - `spiko-letras-del-tesoro-dolar.json`
  - `spiko-smart-cash-euro.json`
  - `mtbill.json`
  - `robinhood-classic-stock-tokens.json`
  - `kraken-xstocks.json`
  - `prosegur-digital-gold.json`
- `inventario-consultas.json`, con 190 entradas. Cada una lleva URL, archivo,
  código HTTP, hora, bytes, SHA-256 y si la huella o el texto coinciden con
  los del 12/11.
- Copias en `fuentes/`: los PDF de menos de 3 MB, los textos extraídos y las
  páginas renderizadas. En `fuentes/crudo/` están el HTML completo, las
  respuestas de API, las lecturas en cadena (con sus peticiones) y los PDF
  grandes.

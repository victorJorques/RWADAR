# Nuevas fuera del radar · resumen (ciclo 01/11/2026, cerrado el 02/11)

Grupo: **nuevas-fuera-radar**. Buscaba ofertas tokenizadas de proveedores que
todavía no están en RWAdar y que un particular residente en España pueda
comprar hoy. La sesión se cortó dos veces por el límite de uso. Por eso hay
pocos expedientes, aunque cada uno está documentado a fondo. Las horas de cada
lectura están en `fuentes/inventario-consultas.json`.

## Qué revisé

- **Registro de la CNMV de empresas de inversión del EEE en libre prestación**
  (listado completo y ficha de cada entidad), consultado el 01/11 a las 15:00 UTC.
  En ese registro constan Robinhood Europe (nº 5299), Gemini EU (nº 5304),
  Payward Europe/Kraken (nº 4474) y Bitpanda Financial Services (nº 5045).
- **Buscador de advertencias de la CNMV**, por el nombre de cada entidad:
  Robinhood, Kraken, Payward, Backed, Bitpanda y Securitize no tienen
  advertencias. «Gemini» devuelve dos chiringuitos sin relación con Gemini EU
  (GEMINI LTD FX y GEMINI OPTION LTD).
- Registros de origen: Banco de Lituania (Robinhood) y CySEC (Kraken).
- Documentos de producto: KID, documento de riesgos y tarifas de Robinhood;
  página UE, divulgación de riesgos y artículo de soporte de Kraken; KID de
  Gemini/Dinari; página de acciones de Bitpanda.

## Propongo admitir (las decide Víctor)

| Slug | Qué es | Por qué |
|---|---|---|
| `robinhood-classic-stock-tokens` | Derivados sobre más de 2.000 acciones y ETP de EE. UU., cada uno representado por un token no transferible | Robinhood Europe, UAB tiene licencia del Banco de Lituania y consta en la CNMV (nº 5299). Su KID es del 1/7/2026 y da riesgo 7/7. Entrada desde 1 €, con una sola comisión de cambio del 0,10 % por operación. Se sale cuando Robinhood te recompra la posición (24/5). Tiene web en español. **No eres dueño de la acción**: tu contraparte es Robinhood y no hay fondo de garantía. |
| `kraken-xstocks` | xStocks de Backed (certificados de deuda tokenizados) vendidos por Kraken UE | Payward Europe Digital Solutions (CY) tiene licencia CySEC 342/17, España está en su pasaporte y consta en la CNMV (nº 4474). Entrada desde 1 €. Para particulares hay que pasar un cuestionario y, en el EEE, solo se compra con dinero fiat. Sales vendiendo en Kraken o llevando el token a tu wallet. **Condición**: el folleto base de Backed no se pudo leer (bloqueo geográfico) y hay que cotejarlo con el expediente de Backed del grupo del radar antes de publicar. |

Ninguna de las dos lleva rentabilidad: son productos de valor que siguen el
precio de la acción. Las dos tienen la propuesta de tarjeta y el bloque
`prioridadEditorial` completos.

## No admitir

- `gemini-tokenized-stocks`: **desaparecida**. Gemini cerró su actividad en
  el EEE con efecto el 6/4/2026. Lo dicen las fuentes secundarias (MoonPay,
  prensa). El aviso oficial de soporte de Gemini da 403 por Cloudflare y no
  intenté saltarme el bloqueo. Hay dos incoherencias: la página comercial
  sigue diciendo «from anywhere in the EU», y la CNMV todavía tiene inscrita
  a Gemini EU, seguramente por retraso del registro. El KID es de julio de
  2025 y el fabricante, Dinari, no está regulado en la UE.
- `bitpanda-stocks`: **no es tokenización**. Son acciones y ETF tradicionales
  en custodia ómnibus, a 1 € por operación. Vision Chain (marzo de 2026) es
  infraestructura para entidades, no una oferta para particulares.

## Conflictos y bloqueos

- Kraken: la FAQ dice que los dividendos se reinvierten en más tokens, pero
  la divulgación de riesgos dice que no hay derecho a dividendos. Queda
  marcado como `en_conflicto`.
- Kraken: el soporte global atribuye la oferta a Payward Digital Solutions
  (Bermudas). Para la UE, la entidad correcta es PEDSL-CY, según eu.kraken.com.
- Robinhood: no hay una lista oficial de países (la página da 404). La
  disponibilidad se apoya en la ficha de la CNMV y en la web en español. La
  consulta del Banco de Lituania de julio de 2025 sobre los tokens de
  OpenAI y SpaceX solo la vi en resultados del buscador; no la leí en fuente
  primaria.
- Sin examinar por el corte: régimen piloto DLT en España (Securitize Europe
  ya está en el radar), PSFP españolas con tokens, criptovalores eWpG en
  Alemania (la lista de BaFin no se pudo extraer), oro tokenizado con MiCA
  (VNX) y Estating. Quedan pendientes para otro ciclo.

## ¿Añadir al radar?

- **Robinhood (UE)**: sí. Datos: Robinhood Europe, UAB, LEI
  254900GTP4UXQO1UMI36, licencias del Banco de Lituania LB002288, LB002294 y
  LB002341, CNMV nº 5299. Acceso minorista con test de conveniencia. Fuentes:
  KID, documento de riesgos, tarifas y ficha del Banco de Lituania.
- **Kraken (UE)**: sí, como canal de distribución de xStocks, enlazado a la
  plataforma Backed Finance que ya está en el radar. Datos: PEDSL-CY, CySEC
  342/17, CNMV nº 4474. Fuentes: eu.kraken.com/xstocks y su divulgación de
  riesgos.
- **Gemini**: no, porque salió del EEE.
- **Bitpanda**: no por ahora. Vigilar Vision Chain.

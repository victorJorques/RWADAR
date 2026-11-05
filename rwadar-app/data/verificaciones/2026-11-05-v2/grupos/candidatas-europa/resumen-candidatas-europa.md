# Candidatas de Europa · resumen (ciclo 05/11/2026)

Grupo: **candidatas-europa**. Busqué ofertas nuevas de activos reales
tokenizados de proveedores de otros países del EEE que un particular residente
en España pueda comprar hoy. También repasé las candidatas que quedaron
pendientes el 03/11. Leí todo hoy entre las 08:01 y las 08:22 UTC. Las horas
exactas están en `inventario-consultas.json`. Solo usé páginas y documentos
públicos: no inicié sesión, no hice KYC y no conecté wallets.

El intento anterior de este encargo no dejó archivos en esta carpeta. Todo lo de
aquí es de hoy.

## Resultado en una línea

**Hoy no propongo admitir ninguna.** La que más avanza es **OKX Europe con
xStocks**: su documentación es completa, pero la CNMV mantiene publicada una
advertencia sobre `www.okx.com` desde el 04/04/2022.

## Expedientes

| Slug | Decisión | Por qué, en pocas palabras |
|---|---|---|
| `okx-europe-xstocks` (nueva) | no_admitir | Vende los mismos xStocks de Backed que Kraken. La entidad está en la CNMV (nº 5024). Pero la CNMV sigue advirtiendo sobre `www.okx.com` (04/04/2022). Además, el mínimo para el EEE no se publica, se paga en USDC y la disponibilidad para España se remite a la app. |
| `crypto-com-tokenized-stocks-eea` | no_admitir (sigue casi lista) | Igual que el 03/11. Los términos y el documento de riesgos no han cambiado (mismo SHA-256). El enlace del KID sigue redirigiendo a la web de EE. UU. desde nuestra conexión. La lista de países tampoco aparece. |
| `assetera-ondo-stocks` (nueva) | no_admitir | Assetera ya enseña en público más de 100 Ondo Stocks y cientos de xStocks. Pero no publica mínimo ni costes. En España solo tiene permiso para recibir y transmitir órdenes. Y Ondo solo emite en el EEE a profesionales. |
| `bybit-eu-tokenized-stocks` (nueva) | no_admitir | Bybit EU solo tiene licencia de criptoactivos (MiCA) y de dinero electrónico. No tiene licencia MiFID ni figura en la CNMV como empresa de inversión. |
| `franklin-templeton-grbenji` | no_admitir | Igual que el 03/11. El folleto y el KID tienen el mismo SHA-256. El folleto sigue diciendo que la app para particulares aún no está disponible, y la app no sale en la App Store española. |

## OKX Europe · xStocks: lo que hay y lo que falta

**Qué compra el cliente.** OKX Europe Markets Limited (Malta) apunta en tu
cuenta un saldo («Unified Tokenized Stocks»). Ese saldo está respaldado por el
xStock que OKX custodia. El xStock lo emite Backed Assets (JE) Limited, del
grupo Kraken. Es un certificado que sigue el precio de la acción, y las
acciones están en Alpaca. Fuente: anexo 2.A de los términos de OKX, que hoy
están fechados el 04/11/2026.

**Lo que está bien:**

- La entidad está inscrita en la CNMV (nº 5024, desde el 14/01/2021). Puede
  ejecutar órdenes y negociar valores negociables por cuenta propia, y también
  custodiarlos.
- Los términos admiten a clientes minoristas, con un test de conveniencia.
- España no está en la lista de lugares restringidos de OKX en el EEE.
- El folleto de xStocks está pasaportado a España. La CNMV lo recibió el
  11/05/2026, y ESMA marca ES en el folleto y en sus dos suplementos. No hay
  suplementos nuevos desde el 29/09.
- Hay KID en español. El de NVDAx está fechado el 04/11/2026, con riesgo 6 de 7.
- La salida está clara: vendes 24/7 en el libro de órdenes o al momento con
  diferencial, o retiras el token a tu propia wallet.
- Comisión spot del EEE: 0,08 % si tu orden espera en el libro y 0,10 % si se
  ejecuta al momento.
- OKX documenta los riesgos mejor que Kraken. A 31/12/2025, el emisor tenía
  fondos propios negativos de unos -3,2 millones de USD. Puede cerrar un xStock
  avisando con 30 días hábiles. Y todo se concentra en el grupo Payward y en
  Alpaca.

**Lo que falla:**

1. **Advertencia de la CNMV.** Buscando «OKX», la lista de entidades no
   autorizadas muestra `HTTPS://WWW.OKX.COM/ OKX`, con fecha 04/04/2022. Lo más
   probable es que se refiera a la plataforma global de 2022, pero la CNMV no
   lo aclara. Hay que resolverlo antes de publicar nada con esta marca.
2. **Mínimo.** El anexo dice que el tamaño mínimo de orden «lo fija OKX». La
   API pública da 0,01 acciones para XAAPL-USDC. Pero devuelve el mismo
   catálogo que la API global, así que no lo uso.
3. **Disponibilidad para España.** El anuncio del 04/11 dice: «comprueba la
   disponibilidad para tu región en la app».
4. **Se compra en USDC**, que es un criptoactivo.
5. **El mismo conflicto que en Kraken.** Las condiciones finales solo ponen
   como países de oferta Liechtenstein y Suiza, «con reserva».

**Aviso para el grupo de Kraken** (no es mío, solo lo señalo). El anexo de OKX
publica datos de riesgo del emisor que no están en la tarjeta de Kraken: los
fondos propios negativos y la concentración en Payward y Alpaca. También se ve
que el KID de NVDAx en español tiene versión del 04/11/2026; el 03/11 se leyó
la del 02/11.

## Assetera · Ondo Stocks

- Desde el 07/10/2026 lista más de 100 Ondo Stocks. Hoy su marketplace público
  muestra 589 activos, con precios en USDC y la etiqueta «Market: Primary».
- El folleto base de Ondo (BPWO-68, de la FMA de Liechtenstein) se aprobó el
  11/11/2025 y la CNMV lo recibió el 12/11/2025. Por regla general vale 12
  meses, así que caduca hacia el 11/11/2026. Hoy no he visto en ESMA un folleto
  que lo sustituya.
- La página de elegibilidad de Ondo dice que en el EEE solo emite a clientes
  profesionales o a inversores cualificados. Para reembolsar hay que pasar el
  KYC del emisor. Un particular dependería de poder revender a otro.
- Hay un conflicto con la licencia. La FMA y la CNMV dan a Assetera solo
  recepción y transmisión de órdenes, gestión de carteras y asesoramiento: ni
  ejecución, ni negociación, ni custodia. No encaja con un marketplace donde se
  compra y se vende.
- Tampoco coinciden las direcciones: la FMA dice Ungargasse 37/1 y la CNMV,
  Rotenturmstraße 13.
- Dinari (dShares) también llega a Europa a través de Assetera, en un modelo
  entre empresas. Gemini, que antes lo vendía, dejó el EEE el 06/04/2026 según
  la prensa. Gemini Intergalactic EU Artemis sigue en el listado de la CNMV
  (nº 5304).

## Lo que no dio candidata

- **Bitpanda.** Sus acciones siguen siendo fracciones en custodia ómnibus, no
  tokens. Lo dice el pie legal de bitpanda.com/en/stocks, leído hoy.
- **Oro con autorización MiCA.** El registro provisional de ESMA de fichas
  referenciadas a activos (`ARTZZ.csv`) sigue vacío: solo trae la cabecera. Los
  tokens de oro que aparecen están en `OTHER.csv`, como white papers
  notificados y no autorizados: DGLD (Gold Token SA, Malta, 24/07/2026),
  NatGold (Irlanda, 07/05/2026) y LCX Gold.
- **Bonos tokenizados con folleto pasaportado a España.** Los bonos
  tokenizados de LCX (Liechtenstein) aparecen en la prensa, pero su web dice
  hoy: «LCX Earn is closed to new investments». En ESMA, entre los folletos de
  Liechtenstein pasaportados a España desde noviembre de 2025 están Backed,
  Ondo, Robinhood, Fineqia, DDA, iMAPS y Floin AG. Floin AG es una oferta de
  acciones preferentes de una empresa cripto. No la investigué a fondo.
- **Inmuebles o energía con licencia ECSP o MiFID y pasaporte a España.** No
  encontré ninguna emisión tokenizada concreta y abierta de otro país del EEE,
  aparte de Brickwise, que ya está publicada y la revisa otro grupo.

## Registros y advertencias consultados hoy

- **CNMV, listado de empresas de inversión del EEE en libre prestación:**
  Assetera (5216), Bitpanda Financial Services (5045), Foris Capital CY (4485),
  Gemini Intergalactic EU Artemis (5304), OKX Europe Markets (5024) y Payward
  Europe (4474). Ninguna entidad Bybit.
- **Programas de actividades en la CNMV:** el de OKX (5024) y el de Assetera
  (5216).
- **Pasaportes de folletos en la CNMV y en ESMA:** Backed (BPWO-80) y Ondo
  (BPWO-68).
- **FMA de Austria:** Assetera y Bybit. **CySEC:** Foris (344/17).
- **Advertencias de la CNMV:**
  - **OKX:** sí hay advertencia, sobre `www.okx.com` (2022), y otra sobre el
    dominio ajeno aayokx.com.
  - **Crypto.com:** 6 dominios ajenos.
  - **Foris:** 2 webs clon.
  - **Bybit:** 1 dominio ajeno.
  - **Ondo, Franklin y Gemini:** coincidencias ajenas por parecido de nombre.
  - **Assetera, Blockchain.com, Bitget, Bitpanda y xStocks:** sin
    coincidencias.

## Bloqueos

- `crypto.com/eea/financialservices/disclosures` (el KID de Crypto.com)
  redirige a la web de EE. UU. desde nuestra conexión. No intenté saltarme el
  bloqueo.
- No consulté el registro de la MFSA (Malta): su buscador necesita JavaScript.
- En la App Store, la búsqueda por nombre devolvió 403. La consulta por id sí
  funcionó.
- La API de OKX en el EEE devuelve el mismo catálogo que la global, así que no
  sirve para saber qué se ofrece en el EEE.

## Archivos

- **Expedientes:** `../../expedientes/okx-europe-xstocks.json`,
  `crypto-com-tokenized-stocks-eea.json`, `assetera-ondo-stocks.json`,
  `bybit-eu-tokenized-stocks.json` y `franklin-templeton-grbenji.json`.
- **Copias de lo leído:** `fuentes/`. Las respuestas crudas de ESMA y de la API
  de OKX, y las condiciones finales con direcciones de contrato, están en
  `fuentes/crudo/`, fuera de Git.

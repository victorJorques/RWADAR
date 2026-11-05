# Grupo acciones-oro-tesoro · 5 de noviembre de 2026

Investigador: Claude. Consultas hechas entre las 08:01 y las 08:18 UTC del
05/11/2026, sin iniciar sesión, sin KYC, sin wallets ni formularios. Todo lo
leído está en `fuentes/` (y lo que lleva direcciones, tokens o JSON largos en
`fuentes/crudo/`), con hora, código HTTP, bytes y SHA-256 en
`inventario-consultas.json`.

## En una frase por ficha

| Ficha | Decisión | Qué cambia hoy |
|---|---|---|
| Robinhood · Classic Stock Tokens | mantener | Nada. Mismos PDF (SHA-256 idénticos), misma página, mismos registros. |
| Kraken · xStocks | mantener | El pendiente no se resuelve: ni las condiciones finales vigentes ni las 44 nuevas del 03/11 ofrecen el producto en España. |
| Prosegur Digital Gold | mantener | Nada en el contrato ni en el registro. Solo cambia el precio del gramo (no va en la tarjeta). |
| mTBILL (Midas) | actualizar | Nuevo valor por token (1,0773 USD el 04/11) y la web de Midas incluye España entre sus países permitidos. El conflicto de reembolso sigue. |

No había candidatas en este grupo.

## Robinhood · Classic Stock Tokens (derivados sobre acciones de EE. UU.)

- **Documentos:** el KID (1 de julio de 2026), la descripción de servicios y la
  tabla de tarifas tienen hoy exactamente el mismo SHA-256 que el 01/11 y el
  03/11. No hay versión nueva.
- **Página en español** (robinhood.com/eu/es/invest, 08:01 UTC): el texto
  visible es el mismo: «Empieza con tan solo 1 euro», más de 2.000
  subyacentes, horario de lunes 2:00 a sábado 2:00, derivado sin derechos
  sobre la acción, sin fondo de garantía.
- **Registros:** Banco de Lituania igual (licencia de intermediación cat. A,
  CASP y entidad de pago). CNMV n.º 5299 igual, con derivados en su programa.
  Relación de proveedores de criptoactivos de la CNMV con el mismo SHA-256.
- **Advertencias:** la CNMV no tiene ninguna para «Robinhood» (la búsqueda de
  control con «Gemini» sí devuelve resultados, así que el buscador funciona).
- **Propuesta menor (no crítica, ya hecha el 03/11 y no aplicada):** cambiar la
  métrica «Salida» publicada («Cierre con la contraparte en días de mercado de
  EE. UU.; puede suspenderse») por «Vendes a Robinhood en la app, 24/5; puede
  suspender el cierre», que es lo que dice hoy la web.

## Kraken · xStocks (certificados de Backed Assets (JE))

**La pregunta del día:** ¿ha publicado el emisor condiciones finales que
incluyan España como país de oferta pública? **No.**

- Las condiciones finales vigentes de **SPYx, AAPLx y NVDAx** (08/05/2026,
  registradas en ESMA como FTWS-874, FTWS-966 y FTWS-864) dicen, en la parte
  B, «Country(ies) of offer(s)»: *«The Products will be offered in
  Liechtenstein and Switzerland (only to Swiss Professional Investors). The
  right to offer in other jurisdictions is explicitly reserved.»* (SPYx p. 35;
  AAPLx y NVDAx p. 33). Las de SPYx y NVDAx tienen el mismo SHA-256 que el
  03/11. Las de AAPLx se leyeron por primera vez hoy.
- **Novedad:** el emisor registró en ESMA **44 condiciones finales nuevas el
  03/11/2026** (con pasaporte del 04/11) y 12 el 15/10. Son productos nuevos.
  Leí dos de las del 03/11 (JBBBx, producto n.º 1.542, y CBOEx, n.º 424) y
  dicen exactamente lo mismo: solo Liechtenstein y Suiza.
- **Cuidado con ESMA:** en los registros de condiciones finales de ESMA aparece
  «SPAIN» en la lista de Estados. Eso es el pasaporte del folleto base, no el
  país de oferta. El país de oferta lo fijan las condiciones finales, y el
  propio folleto (p. 7) dice que la oferta pública en un Estado del EEE solo
  vale si las condiciones finales la especifican.
- **Folleto base** (08/05/2026, mismo SHA-256): en «Principal Markets» (p. 57)
  sigue nombrando España entre sus mercados, y la plantilla de condiciones
  finales (p. 141) solo prevé «Liechtenstein [and Switzerland…]». Sin
  suplementos nuevos desde el 29/09/2026.
- **Lista de países de oferta anotada:** condiciones finales = Liechtenstein y
  Suiza (solo profesionales). Folleto notificado a 29 Estados del EEE, España
  incluida (CNMV, pasaporte del 11/05/2026, sin entradas nuevas hoy).
- **Por tanto, el primer aviso de la tarjeta no se puede quitar**, y el segundo
  («RWAdar no ha encontrado ningún documento oficial…») sigue vigente.
- **Resto sin cambios:** página de Kraken UE (desde 1 €, más de 130 xStocks,
  24/5, «no afiliado» en el pie, que sigue contradiciendo al folleto),
  comisiones (1 %, y la frase de «hasta 2 USD» solo en inglés), CySEC 342/17,
  CNMV 4474, FAQ de soporte (30/10) y divulgación de riesgos (27/01/2026). Sin
  advertencias de la CNMV para Kraken, Payward, Backed ni xStocks.
- Los KID en español se re-fecharon al 04/11/2026: mismo riesgo y mismos
  costes. La tarjeta no los usa (decisión de la revisión del 03/11).
- `assets.backed.fi` sigue bloqueada por país (redirige a «geoblock»). No se
  intentó sortear.

## Prosegur Digital Gold

- **Contrato** (términos actualizados el 08/07/2026): el texto que muestra la
  app es idéntico, carácter a carácter, al del 02/11 y el 03/11. Siguen:
  compra a LBMA +4 %, venta a LBMA −6 %, recompra en 1–7 días hábiles con
  posible suspensión y topes, canje físico desde 1.000 tokens.
- **Precio del gramo (público, sin iniciar sesión):** la portada de la app
  mostraba **«Precio de compra 122.64 €»** el 05/11/2026 a las 08:10 UTC (el
  03/11 a las 10:27 UTC eran 116,81 €; +5 % en dos días). Es el precio al que
  compra el cliente, con el margen incluido. No se propone para la tarjeta
  porque cambia durante el día.
- **Entidad y registro:** PROSEGUR CUSTODIA DE ACTIVOS DIGITALES, S.L.U. Sigue
  en la relación de proveedores de criptoactivos de la CNMV (desde 30/06/2026;
  custodia, transmisión de órdenes y transferencia) y en el CSV de ESMA, los
  dos con el mismo SHA-256. Esa autorización no cubre el token de oro, que
  según el contrato no está supervisado. Sin advertencias de la CNMV.
- La web y las FAQs siguen diciendo cosas que el contrato no respalda
  («Menos de 24 horas», «Liquidez sin restricciones», auditorías «Mensuales y
  certificadas» que no se enlazan). Los avisos publicados siguen vigentes.

## mTBILL (Midas)

- **¿Puede comprarlo un particular en España? Fuente nueva de hoy:** el código
  que sirve hoy midas.app (`main-C67ipI_t.js`, guardado en `crudo/`) contiene
  el aviso de entrada «Eligibility & Jurisdiction» (versión 1.0.2): *«The
  information on this website is directed only at persons who are resident or
  located in the following jurisdictions: Austria, Belgium, France, Germany,
  Ireland, Italy, Luxembourg, Malta, the Netherlands, Poland, Portugal,
  Romania, Spain, and Sweden (the “Permitted Jurisdictions”).»* Son los mismos
  14 países de oferta pública de las condiciones finales, que además declaran
  el producto apto para minoristas. El mismo código clasifica mTBILL como
  «Public offer under the EU Prospectus Regulation». La documentación
  (llms-full.txt) no publica ninguna lista de países restringidos y avisa de
  que puede pedir KYC según el riesgo.
- **Valor por token:** el oráculo del emisor da **1,0773 USD** (ronda 488,
  04/11/2026 17:45 UTC), leído el 05/11 a las 08:14 UTC. La tarjeta publicada
  dice 1,0769 USD (02/11). Hay que cambiar la métrica a «Valor por token ·
  04/11/2026: 1,0773 USD (oráculo del emisor)».
- **Conflicto de reembolso: sigue igual.** Las condiciones finales (p. 4)
  dicen 25 % diario y retención de hasta el 5 %; el KID en español (p. 3),
  15 % diario y retención de hasta el 50 %. Los dos PDF tienen el mismo
  SHA-256 desde el 01/11, llms-full.txt es idéntico y ESMA no tiene ningún
  documento nuevo para mTBILL (41 documentos del emisor, los mismos). El aviso
  se mantiene y el estado debe seguir en «fuentes_en_conflicto».
- **En cadena:** contratos sin pausa y sin lista blanca, comisión de reembolso
  inmediato 0,07 %, 66,74 millones de mTBILL en Ethereum (68,06 millones el
  03/11).
- **Bloqueos:** midas.app/mtbill y docs.midas.app dan 403 a curl, también en
  las versiones `.md`. Con navegador sale el desafío de Cloudflare
  («Verificación de seguridad en curso») y se agota el tiempo. El APY sigue
  sin poder leerse: rentabilidad en `null`.
- **Aviso para el coordinador:** la lectura pública de hoy (07:56 UTC) muestra
  la tarjeta de mTBILL vacía («Condiciones pendientes de nueva revisión»,
  «Cifras pendientes de nueva revisión», disponible_es nulo) por estar en
  «fuentes_en_conflicto». Si se quiere que el lector vea las cifras con el
  aviso del conflicto, es una decisión editorial.

## Conflictos y bloqueos abiertos

1. Kraken: la venta a particulares en España no tiene respaldo en ninguna
   condición final del emisor (tampoco en las 44 del 03/11).
2. Kraken: la web dice «no afiliado» y el folleto dice que emisor y vendedor
   son del mismo grupo.
3. mTBILL: límites de reembolso distintos entre condiciones finales y KID.
4. mTBILL: midas.app y docs.midas.app bloqueadas por Cloudflare. APY no
   verificable.
5. Prosegur: sin informes de auditoría ni póliza publicados; red del token en
   conflicto (Polygon/ERC-3643 en la web y Ethereum/ERC-1155 en el contrato).
6. Robinhood: no hay lista oficial de países ni red blockchain nombrada.

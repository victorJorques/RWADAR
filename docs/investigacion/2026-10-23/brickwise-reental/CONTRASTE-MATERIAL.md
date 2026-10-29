# Contraste material para revisión independiente · 23/10/2026

Alcance: las 34 referencias existentes asignadas. No se proponen altas ni se
marca una renovación profunda de las 34; no se ha modificado producción. Las
matrices por slug distinguen observación de fuente, incertidumbre y aprobación.
Los originales PDF/HTML y sus renders permanecen locales; los metadatos con
URL, fecha y hash permiten verificarlos sin publicar los documentos completos.

## Reental: cambio de activo comunicado, no una contradicción sin explicación

La [página de Dania Beach 1](https://www.reental.co/properties/1787857589693-447dad95-1362-49ac-b603-effd274a5eed-dania-beach-1)
explica que el activo original fue sustituido por **Austin 1 / AUS-1 el
15/04/2026** y que cada inversor debe ratificar expresamente su participación
porque cambia el activo del whitepaper. Describe un hotel de **152 habitaciones**
en **300 East 11th Street, Austin**, con un horizonte esperado de salida en abril
de 2029. El título y el identificador DNB-1 se conservan en la página.

Esto corrige la primera alarma de diagnóstico: **no debe describirse como un
simple error de copia de una página**. Tampoco se puede asumir que todos los
inversores aceptaron la sustitución. Faltan cotejar el acuerdo de suscripción
anterior, whitepaper de Austin, certificado y mecanismo de ratificación. Los
seis enlaces oficiales están en la matriz de esa ficha. No trasladar sin más
la foto ni las cifras de Florida a Texas, ni presentar el antecedente como si
fuera una nueva oferta ya abierta.

## Reental: costes, moneda y estado requieren separar las fuentes

La [descripción de Rentas 2](https://www.reental.co/properties/1787855172059-168248bf-3f35-4ba9-8021-f9a95c23583a-rentas-2)
identifica un vehículo `Series RNT RET-2, LLC` y declara 1.000.000 EUR de oferta,
920.000 EUR de aportación neta y **8 % de suscripción y estructuración** al
invertir, incluido en su estimación de rentabilidad. Es una declaración de esa
página, pendiente de cotejo con sus documentos; no una comisión universal de
Reental ni la comisión que necesariamente pague un comprador P2P.

El [listado general](https://www.reental.co/properties) anuncia inversión
desde **500 EUR**, mientras la [FAQ](https://www.reental.co/faqs) habla de un
token de **100 euros/dólares**. La página del proyecto ofrece un precio nominal,
no necesariamente la inversión mínima actual del mercado secundario. No
resolver el conflicto convirtiendo 100 USD en euros ni eligiendo el importe
menor.

El HTML descargado incluye varias etiquetas y monedas ocultas mediante
`w-condition-invisible`. La lectura que ignore ese estado introduce errores:
en Miami 1, Houston 3 y Granada 3 las etiquetas visibles son «Financiado», con
precio de referencia de 100 USD, 100 USD y 100 EUR respectivamente. El listado
general y algunas fichas usan códigos distintos; una etiqueta de financiación
no acredita una orden secundaria. Pirineos 1 muestra «En reforma» y una fecha
de inicio de renta de 2027; no representa alquileres ya percibidos hoy.

## Brickwise: mínimos históricos, derechos y salida

Los contratos y los KID se han descargado por ISIN y se ha comprobado que el
identificador coincide dentro de ambos textos. Se han leído los apartados
específicos de plazo/salida y la interpretación de costes de los doce KID.
Falta cerrar el contraste jurídico completo y la revisión independiente.

| ISIN / referencia | Documento y hecho confirmado | Límite que debe acompañarlo |
|---|---|---|
| AT0000A2RAH5 / Plüddemanngasse | Contrato: BrickOne GmbH & Co KG; mínimo de suscripción original 103,37 EUR; emisión 2021. | El propio documento contiene discrepancias entre algunas cantidades en números y letras. No es el mínimo actual de reventa. |
| AT0000A2T4D7 / Sonnleithnergasse | Contrato: Brick Sagarmatha GmbH & Co KG; mínimo original 101,37 EUR; emisión 2021. | No equivale al precio secundario actual ni a una nueva suscripción abierta. |
| AT0000A2U5V3 / Klagenfurt | Contrato: Brick Qogir GmbH & Co KG; mínimo original 100,02 EUR. | Plazo original 2021/2022; no rejuvenecerlo al consultar. |
| AT0000A2WCD0 / Stallhofstraße | Contrato: Brick Qogir GmbH & Co KG; mínimo original 100,10 EUR. | Suscripción de 2022, no mínimo vigente de reventa. |
| AT0000A2WCE8 / Schwarzer Weg | Contrato: Brick Qogir GmbH & Co KG; mínimo original 100,14 EUR. | Suscripción de 2022, no mínimo vigente de reventa. |
| AT0000A2YPQ0 / Drautalresidenz | Contrato: Brick Sagarmatha GmbH & Co KG; mínimo original 100,05 EUR. | Suscripción original julio-septiembre de 2022. |
| AT0000A2ZT84 / Randhartingergasse | Contrato: Brick Sagarmatha GmbH & Co KG; mínimo original 100,24 EUR. | API `stage=secondary` y `availableBricks=374`: no inferir reapertura primaria sin aclarar los campos. |
| AT0000A31KP7 / Hinterstoder | Contrato: Brick Qogir GmbH & Co KG; mínimo original 100,20 EUR. | Suscripción octubre-diciembre de 2022. |
| AT0000A324B4 / Pottendorfer | Contrato y KID: emisión indefinida, con primera ventana de cancelación ordinaria a los 15 años y siguientes ventanas cada 15 años. | Una recomendación de tenencia de cinco años en el KID no equivale a derecho de reembolso a los cinco años. La venta necesita comprador. |
| AT0000A38J32 / Solar GreenPoint | Contrato y KID: 15 años sin cancelación ordinaria anticipada, sin propiedad directa del equipo y reembolso cualificadamente subordinado. | No confundirlo con un depósito, propiedad inmobiliaria directa o capital garantizado. §5.1 dice participación en el 95 % del excedente; §9.1 remite al 50 %: divergencia pendiente de aclaración. |
| AT0000A38J40 / Solar Cohotel | Emisor COHOTEL Hotelbetriebsgesellschaft m.b.H.; 15 años y restricciones de salida equivalentes en su KID. | La tabla de costes requiere aclaración; no copiar porcentajes como tarifa cobrada. |
| AT0000A3SE89 / BILLA | Contrato y KID con versión 16/02/2026: mínimo contractual de suscripción 1.000 EUR; primera cancelación ordinaria tras cinco años y después cada año, con 30 días de preaviso. | El precio por participación es otro dato. La API dice `primary`, pero su plazo de suscripción se cuenta desde la publicación y no se ha acreditado fecha/posibles prórrogas. El enlace de contrato que entrega la API usa `staging.cdn.brickwise.at`; comprobar el documento de producción antes de acreditar versión final. |

Para las ocho referencias inmobiliarias antiguas distintas de Pottendorfer, el
KID describe duración indefinida, recomendación de tenencia de cinco años y
límites a la cancelación ordinaria mientras siga existiendo negociación en un
mercado público. Que no aparezca un comprador no equivale a desaparición del
mercado ni otorga automáticamente un reembolso. Las condiciones contractuales
particulares siguen siendo necesarias.

## Brickwise: tabla RIY comprobada visualmente

Se han renderizado y leído las páginas 3 de los KID solares originales. La
tabla dice expresar impacto anual sobre el rendimiento. GreenPoint muestra
0,77 % / 0,10 % en entrada/salida; Cohotel muestra 11,56 % / 1,50 %, mientras
ambos presentan RIY total de 13,06 %, 2,61 % y 0,87 % para uno, cinco y quince
años. **Esas diferencias también están en los PDF renderizados; no son una
confusión del orden de extracción.** Falta aclaración del emisor sobre la
presentación/bases. No anunciar 11,56 % como comisión de efectivo ni sumar las
cifras RIY a la comisión de intermediación de 1,5 %. No interpretar 0,00 % de
una categoría RIY como ausencia de gastos operativos: el contrato solar regula
deducciones, provisiones y reservas por separado.

## Registro y España: lo que sigue sin poder certificarse

El [aviso legal de Brickwise](https://www.brickwise.at/imprint) declara agente
vinculado de Effecta GmbH y registro 80174029. La
[explicación oficial de BaFin](https://www.bafin.de/DE/die-bafin/publikationen-daten/datenbanken-uebersichten/vermittler/vermittler_node.html)
aclara que el agente opera bajo responsabilidad de una entidad, con excepción
de permiso propio; no es un aval a los productos ni a su rentabilidad. El
buscador individual del portal no devolvió una ficha utilizable en esta
consulta. **No se ha vuelto a acreditar de forma independiente la entrada
individual vigente ni distribución de las doce emisiones en España.** La FAQ
de cuentas EEE se conserva como información de cuenta, sin ampliar su alcance.

## Entrega y límites

34 expedientes internos con afirmación, fuente, localizador, fecha real del
dato cuando existe, consulta y límites. 12 contratos y 12 KID originales
conservados; 22 HTML Reental con sus enlaces documentales. Los contratos y
whitepapers completos de los 21 proyectos Reental aún no están revisados:
el acuerdo Miami 1 tiene 34 páginas y el PPM Rentas 3 tiene 85, por ejemplo.
No se asigna aprobación a esos documentos porque exista un enlace o se haya
leído una cláusula.

Los hallazgos materiales requieren revisión por otro agente antes de cualquier
cambio público. Mientras tanto se conserva el catálogo completo, con fechas
reales, sin nuevas altas y sin proclamar una actualización profunda de las 34.

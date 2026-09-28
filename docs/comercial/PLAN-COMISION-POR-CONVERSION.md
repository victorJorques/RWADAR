# RWAdar · plan de comisión por conversión

Estado: fase futura, fuera del ingreso inicial por anuncios; ninguna comisión activa.  
Fecha: 27 de septiembre de 2026.  
Ámbito de análisis: España y usuarios de España; confirmar establecimiento y fiscalidad del titular antes de aplicar conclusiones.

## Decisión comercial

Para una fase futura, se estudia un escaparate donde la empresa paga cuando
obtiene una conversión válida y no asume por defecto un coste fijo de presencia.
La relación se formaliza oferta por oferta; un enlace público sin contrato no
genera derecho a cobro.

La aclaración posterior del usuario mantiene gratis las fichas y las inversiones
procedentes de las empresas contactadas. El ingreso inicial es publicidad en app,
no este programa. Este plan no es un requisito para lanzar una beta gratuita.

El usuario propone empezar con un **3 % por conversión**, sin cuota fija de
presencia. **La base está pendiente de confirmación:** importe invertido,
ingreso propio del proveedor u otra magnitud pactada no son equivalentes.
La versión anterior eligió ingreso neto del proveedor sin confirmación del
usuario; esa elección queda corregida. No se publica una tarifa ni se factura
hasta definir base, conceptos incluidos/excluidos, evento y ajustes.

Cambiar la base al ingreso del proveedor no elimina por sí solo una actividad
reservada. La CNMV, pregunta 22.2 de sus FAQ MiFID II (versión 18/06/2026,
consultada el 27/09/2026), trata el pago por clientes o volumen como indicio de
captación. Deben revisarse remuneración y actividad real, no solo el porcentaje.

El 3 % no aumenta por calendario ni se promete una subida automática. Solo se
renegocia para periodos futuros cuando RWAdar pueda demostrar valor y el
proveedor acepte por escrito; una posible referencia del 5 % queda reservada a
esa fase posterior. El porcentaje final depende de margen, trabajo operativo,
devoluciones, territorio y duración. No se ofrece hasta que la oferta supere la
clasificación legal y fiscal.

## Dónde puede y dónde no puede funcionar

| Tipo de oferta | Estado para comisión | Decisión |
|---|---|---|
| Financiación participativa ECSP/PSFP | Bloqueada en este diseño | El artículo 3.3 prohíbe al proveedor remunerar el enrutamiento de órdenes a ofertas concretas. No equivale a prohibir todo servicio publicitario; el flujo propuesto requiere análisis específico. |
| Acción, bono, participación de fondo u otro instrumento financiero | Roja salvo estructura autorizada | Solo con entidad autorizada, dictamen y, cuando proceda, relación y registro formal de agente. |
| Criptoactivo MiCA que no sea instrumento financiero | Amarilla | Caso por caso: clasificación, CASP habilitado, incentivos, publicidad, contrato y territorio. |
| Mercancía, coleccionable, derecho de uso u otro producto no financiero | Amarilla | Solo tras confirmar que el derecho adquirido y la actividad de RWAdar no entran en un régimen reservado. |
| Software o infraestructura B2B | Verde condicionada | Puede estudiarse comisión comercial por cliente empresarial si contrato, privacidad y fiscalidad están cerrados. |

`Verde` no significa aprobación automática; significa que no se ha detectado la
prohibición financiera específica que sí bloquea las dos primeras filas.

## Primeros expedientes a clasificar

1. **Reental, programa profesional.** La investigación del 27/09 encontró un
   programa oficial que admite comparadores y entidades. Es el primer
   candidato para obtener documentación económica y jurídica, no para activar
   enlaces: cada oferta, territorio y actividad de RWAdar requieren revisión.
   No confundirlo con el programa de premios en RNT para usuarios.
2. **Infraestructura B2B del radar.** Fireblocks, Tokeny, Taurus y Blocksquare
   pueden estudiarse para una comisión sobre una contratación empresarial, no
   sobre la inversión de un minorista. Es una línea separada del escaparate de
   ofertas y necesita su propio mensaje y contrato.
3. **MiFID, UCITS y acciones tokenizadas.** Permanecen sin enlace remunerado
   hasta disponer de estructura autorizada.
4. **Alius/PSFP y cualquier ECSP.** No se propone comisión por dirigir una
   inversión concreta.
5. **Prosegur Digital Gold.** No se encontró un programa profesional público.
   Puede estudiarse acuerdo individual de publicidad/colaboración, sin asumir
   clasificación del token, habilitación territorial ni comisión permitida.

Esta priorización es una hipótesis de desarrollo de negocio, no una conclusión
jurídica sobre ninguna empresa.

## Cómo entran las ofertas

RWAdar mantiene dos carriles separados:

### Catálogo editorial

- vigilancia de páginas, documentos y registros oficiales;
- ficha factual con fuente, fecha, disponibilidad y advertencias;
- ilustración propia salvo licencia escrita del material;
- enlace ordinario no remunerado y sin atribución personal;
- corrección o retirada aunque la empresa no colabore.

### Oferta comercial por conversión

1. RWAdar o la empresa abre un expediente con la plantilla
   `CUESTIONARIO-CLASIFICACION-LEGAL-OFERTA.md`.
2. Se identifica emisor, operador, pagador, producto, territorio y registro.
3. El revisor jurídico marca la oferta como `APTA PARA COMISIÓN` con límites
   concretos; cualquier incertidumbre la deja bloqueada.
4. La empresa autoriza por escrito enlace, textos, marca/materiales, evento de
   conversión, porcentaje, base y disclosure.
5. Se firma `ACUERDO-AFILIACION-POR-CONVERSION-BORRADOR.md` después de su
   revisión profesional y se completa el alta fiscal y bancaria.
6. Solo entonces se activa el enlace comercial y su etiqueta visible.

## Evento y atribución

El clic nunca es una venta. El contrato debe definir como conversión un evento
confirmado por el proveedor tras KYC, desistimiento, fraude, impago y devolución
cuando procedan. La solución técnica preferente es:

`clic -> referencia aleatoria pseudónima -> entorno del proveedor -> estado agregado -> conciliación -> factura RWAdar`

Una referencia aleatoria puede ser dato personal si permite vincular una
persona o una operación: no se declara anónima por no contener un nombre.

- la referencia no contiene correo, documento, wallet, importe ni identidad;
- el proveedor conserva KYC, orden y pago en su propio entorno;
- RWAdar recibe identificador, estado, fecha, base comisionable, moneda y
  ajuste, solo cuando el dictamen de privacidad lo permita;
- no hay píxel, fingerprinting ni cookie de terceros por defecto;
- duplicados, autoconsumo, fraude, cancelaciones y reembolsos no generan o
  revierten comisión;
- una firma o canal autenticado, idempotencia y eventos fuera de orden evitan
  que un reporte falso infle la factura.

## Base económica y cobro

Ejemplos aritméticos, no ofertas ni aprobación legal: si la base pactada fueran
100 EUR de ingreso del proveedor, un 3 % serían 3 EUR; si fueran 10.000 EUR de
capital invertido, serían 300 EUR. La elección sigue pendiente y ambas requieren
revisión. Captar capital no equivale a beneficio del proveedor ni a ganancia del
inversor. «Sin conversión válida, no cobramos» es más preciso que prometer que
solo cobramos cuando todos ganan.

- ningún importe de inversión pasa por RWAdar, cualquiera que sea la base;
- al cierre de cada mes se concilian conversiones confirmadas y ajustes;
- RWAdar emite factura B2B y la empresa paga por SEPA o proveedor de cobro
  alojado a una cuenta del mismo titular fiscal de RWAdar.

Nunca se deduce dinero en el checkout del inversor para enviarlo a RWAdar.
Nunca se cobra en cripto, wallet personal, cuenta de tercero o IBAN distinto
del verificado en el expediente.

## Lo que verá la persona usuaria

Junto a cualquier enlace remunerado aparecerá, antes de salir:

> **Enlace comercial.** Si cumples los requisitos y contratas esta oferta,
> RWAdar puede recibir una remuneración del proveedor. Esta relación no compra
> una posición en el ranking. Revisa todos los costes y riesgos en la documentación oficial.

No se afirma «sin coste adicional» sin verificar y documentar el tratamiento
real de costes en esa oferta.

La etiqueta comercial no sustituye riesgos, costes, fecha ni fuente. Una
empresa nunca puede pagar para borrar una alerta o alterar el orden editorial.

## Compuerta de activación

Actualmente no existe un motor de comisiones activado. La publicación remota
permanece bloqueada para el modelo por conversión; no basta cambiar una bandera.
La futura activación por oferta deberá comprobar todos estos elementos:

- clasificación y dictamen por oferta;
- proveedor y territorio autorizados;
- contrato y permiso de materiales;
- identidad fiscal de RWAdar, factura e impuestos;
- cuenta bancaria empresarial receptora;
- disclosure visible y revisión de privacidad;
- prueba de atribución, conciliación, fraude, revocación y retirada;
- responsables nominales y segundo revisor.

Estas son condiciones de diseño, no evidencia de una integración ya terminada.
La compuerta global vigente todavía no habilita este perfil comercial aunque
se completen manualmente los campos de aprobación.

Un pago, reporte o webhook nunca publica ni renueva por sí mismo una ficha.

## Siguiente hito comercial

Preparar la revisión del programa profesional de Reental y de un posible
piloto publicitario contextual separado. No se envía nada hasta completar titular,
país fiscal, revisión profesional y cuenta receptora. El objetivo es obtener
un acuerdo escrito para un piloto permitido, no acumular enlaces de
afiliado sin permiso.

El primer acuerdo propondrá un 3 % durante un periodo definido. La renovación
conserva ese porcentaje salvo nueva negociación; una futura subida solo se
aplica hacia delante y debe basarse en métricas agregadas, coste de operación y
valor demostrado, nunca en dependencia o sorpresa contractual.

## Fuentes regulatorias de partida

- CNMV, [Preguntas y respuestas sobre MiFID II](https://www.cnmv.es/docportal/Legislacion/FAQ/FAQ_MiFIDII.pdf).
- CNMV, [Comunicación sobre afiliados y captación](https://www.cnmv.es/portal/verDoc.axd?t=%7B216194b3-c81a-41ca-bb32-6dff704b54e9%7D).
- BOE, [Ley 6/2023 de los Mercados de Valores](https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053).
- EUR-Lex, [Reglamento (UE) 2020/1503](https://eur-lex.europa.eu/eli/reg/2020/1503/oj), artículo 3.3.
- EUR-Lex, [Reglamento (UE) 2023/1114, MiCA](https://eur-lex.europa.eu/eli/reg/2023/1114/oj).

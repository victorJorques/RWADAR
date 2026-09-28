# RWAdar · arquitectura de cobro y protección del dinero

Estado: diseño interno, sin cuenta ni cobro real configurados.
Fecha: 27 de septiembre de 2026.
Alcance: controles de dinero para eventuales acuerdos directos y comisiones futuras.
El ingreso inicial solicitado es publicidad en app; las empresas del catálogo no
pagan ahora por las inversiones. Véase el apartado 1 bis de la investigación de monetización.

## 1. Frontera del dinero

En una fase futura RWAdar podría cobrar a empresas por conversiones válidas identificadas en un
contrato. La propuesta inicial es un 3 %, con base todavía pendiente de
confirmación y revisión, no una tarifa activa. Solo puede activarse para una
oferta que haya superado la revisión jurídica, contractual, fiscal y de privacidad. El
inversor paga **0 EUR a RWAdar** y cualquier inversión se formaliza y paga
directamente en la web del proveedor elegido. RWAdar no recibe, agrupa,
custodia, convierte ni reenvía capital de inversión.

El recorrido permitido es:

`empresa contratante -> proveedor de cobro o transferencia SEPA -> cuenta bancaria del titular de RWAdar`

El recorrido prohibido es:

`inversor -> RWAdar -> emisor, plataforma, wallet o activo`

No existe una comisión global. Para una oferta excepcionalmente aprobada, la
empresa calcula la remuneración conforme al contrato, recibe una factura de
RWAdar y paga desde su tesorería. No retiene ni desvía capital del inversor para
entregarlo a RWAdar. La clasificación y los límites están en
`docs/comercial/DECISION-CEO-MODELO-AFILIACION.md`.

## 2. Destino único del cobro

La cuenta receptora debe cumplir todos estos requisitos antes de activarse:

- cuenta profesional o empresarial en EUR;
- titular exactamente igual al titular jurídico y fiscal que figure en el
  aviso legal, contrato, factura y cuenta del proveedor de cobro;
- uso dedicado o contablemente separable para RWAdar;
- autenticación fuerte y alertas de acceso, transferencias y cambios;
- dos responsables identificados para alta, recuperación y revisión, aunque
  solo uno tenga facultad final de firma;
- ningún IBAN, credencial, código de recuperación o dato bancario completo se
  guarda en Git, en la app o en documentación pública.

En el repositorio solo se registra el alias de la cuenta, la moneda, los cuatro
últimos caracteres, la fecha de verificación y el responsable que la revisó.
El valor completo se conserva únicamente en el banco, el proveedor de cobro y
el archivo privado de contabilidad.

Si interviene un proveedor de cobro, también se registra sin secretos el alias
de la cuenta comercial, el país o región, el modo `live`, un identificador
parcial que permita distinguirla de otra cuenta, el descriptor que verá el
pagador y la cuenta de abono verificada. Un nombre de proveedor como «Stripe»
no identifica por sí solo el destino del dinero.

## 3. Canal recomendado por fases

### Piloto comercial

Usar contrato u orden de inserción, factura y transferencia SEPA a la cuenta
empresarial verificada. Es el flujo con menor superficie técnica para el primer
patrocinador o para una primera comisión ya conciliada. Cualquier cambio de
cuenta se confirma por un segundo canal y nunca se acepta únicamente desde un
correo con nuevas instrucciones de pago.

### Cobro repetible

Cuando el titular y la fiscalidad estén aprobados, usar una factura o una página
de pago alojada por un proveedor regulado. Si se elige Stripe, se prioriza
Stripe Invoicing, Payment Links o Checkout alojado: RWAdar no aloja campos de
tarjeta ni guarda PAN, CVC o datos bancarios.

Stripe es una propuesta técnica, no una selección ni una cuenta ya creada. El
alta real, la verificación de identidad, la cuenta de abono y las tarifas deben
aprobarse para el titular efectivo.

## 4. Flujo contable y técnico

1. Se firma una orden o contrato con empresa, oferta, periodo, precio o regla
   de comisión, impuestos, atribución cuando exista, materiales autorizados,
   retirada, devolución y `clawback`.
2. Se asigna un identificador interno inmutable, por ejemplo
   `RWADAR-SP-AAAA-NNNN`; nunca se confía en precio o concepto enviados por el
   navegador.
3. El sistema contable emite una factura correlativa. El importe, moneda,
   destinatario e impuestos proceden del contrato aprobado.
4. La empresa contratante paga por SEPA o por una página alojada por el
   proveedor de cobro.
5. Un cobro con proveedor solo se marca pagado tras verificar en servidor la
   firma del webhook, el evento, el modo y cuenta receptora esperados, el
   importe, la moneda, el cliente y el ID de orden. La página de éxito del
   navegador no prueba un pago.
6. Los eventos son idempotentes y su aplicación es atómica: el mismo webhook
   no puede contabilizar dos veces una factura, abono o devolución.
7. El saldo se abona únicamente en la cuenta empresarial verificada. No hay
   cuentas conectadas, reparto automático ni transferencias a emisores.
8. Un pago confirmado **nunca publica, activa ni renueva una oferta o
   campaña**. Solo actualiza el estado contable. La publicación necesita una
   aprobación separada que compruebe contrato, datos, derechos, legal,
   contenido y corte técnico.
9. Si existe comisión, el proveedor entrega un estado agregado de conversiones
   con identificadores pseudónimos, base, moneda y ajustes. RWAdar no recibe
   identidad, KYC, wallet, orden ni importe individual del inversor.
10. Antes de activar el piloto se prueba conciliación y abonos con datos sintéticos,
    sin exigir un cobro previo a una conversión que todavía no ha ocurrido. Después,
    contabilidad concilia al menos semanalmente contrato, factura, estado de
    atribución cuando exista, cobro, coste del proveedor de pagos, abono
    bancario, devolución y saldo pendiente.

Los estados contables y editoriales no se mezclan. Como mínimo se distinguen
`factura_emitida`, `pago_pendiente`, `pago_confirmado`, `reembolso_pendiente` y
`reembolsado` de `contenido_pendiente`, `aprobada_para_publicar`, `publicada`,
`suspendida` y `retirada`. Ninguna transición contable concede la transición
editorial.

## 5. Controles contra robo y fraude

### Cuenta y personas

- exigir dos métodos de autenticación fuertes; preferir passkey o llave física
  y aplicación autenticadora, no SMS como único factor;
- cuentas individuales, sin contraseñas compartidas, y permisos mínimos por
  función;
- dos personas o una persona más un asesor independiente revisan cambios de
  cuenta de abono, altas de administradores y devoluciones excepcionales;
- código de recuperación guardado fuera del ordenador de trabajo y probado sin
  desactivar la autenticación;
- revisión mensual de usuarios, sesiones, métodos MFA y datos bancarios.

### Segregación mínima de funciones

Antes del primer cobro se asignan personas nominales y suplentes. Una sola
persona no debe solicitar, aprobar, ejecutar y conciliar la misma operación:

| Función | Puede | No puede aprobar en solitario |
|---|---|---|
| Comercial | Solicitar alta de patrocinador y preparar el alcance. | Cuenta de abono, pago recibido, reembolso o publicación. |
| Facturación | Emitir factura desde contrato aprobado y conciliar cobros. | Cambiar su propia cuenta de abono ni aprobar su propia devolución excepcional. |
| Administración técnica | Configurar proveedor, secreto y webhook en el entorno correcto. | Ver saldo bancario si no lo necesita, ordenar transferencias o publicar contenido por un evento. |
| Aprobación financiera/seguridad | Verificar cambios de administrador, cuenta de abono y devoluciones. | Ejecutar y conciliar por sí sola la misma operación. |
| Editorial/legal | Aprobar datos, derechos, etiqueta y versión publicable. | Marcar una factura pagada o modificar el destino de fondos. |
| Recuperación de emergencia | Recuperar acceso con procedimiento registrado. | Usar la cuenta de emergencia para operación diaria. |

Si el equipo no permite separar dos personas internas, la segunda revisión la
realiza el asesor externo designado y queda documentada antes de ejecutar. El
proveedor de cobro y el banco usan cuentas individuales; no se comparten
usuarios, contraseñas ni factores MFA.

### Claves e integración

- separar por completo prueba y producción;
- usar claves restringidas cuando el proveedor las admita; nunca exponer una
  clave secreta o `whsec_` en JavaScript, Expo, Git, logs o capturas;
- guardar secretos en el gestor de secretos del hosting y rotarlos tras una
  sospecha, salida de personal o cambio material;
- validar la firma sobre el cuerpo bruto del webhook, limitar los eventos
  aceptados, registrar su ID y rechazar importes o monedas inesperados;
- no conceder un patrocinio por parámetros de retorno, correo, captura de
  pantalla ni `payment_status` enviado por el cliente;
- limitar intentos, aplicar idempotencia y conservar un registro de auditoría
  inmutable para altas, cobros, devoluciones y cambios de destino.

### Protocolo obligatorio de webhook

No se crea un endpoint de producción hasta documentar la lista exacta de
eventos y estados aceptados para el proveedor elegido. La implementación debe:

1. aceptar solo `POST` por HTTPS, limitar tamaño y tipo de cuerpo y conservar
   el cuerpo bruto hasta validar la firma con la librería oficial;
2. usar un secreto distinto por entorno, comprobar la tolerancia temporal para
   reducir replays y rechazar modo, cuenta comercial o versión inesperados;
3. insertar primero el ID único del evento y aplicar el cambio contable en la
   misma transacción; un evento repetido devuelve éxito sin repetir efectos;
4. resolver el identificador interno esperado desde servidor y comparar
   cliente, importe, moneda, estado y referencia. Ningún precio, correo,
   `metadata` libre o identificador enviado por el navegador es autoridad;
5. consultar la API del proveedor desde servidor cuando el evento sea
   incompleto o exista discrepancia; mientras tanto el pago queda pendiente y
   no se publica nada;
6. tolerar eventos fuera de orden y reintentos sin retroceder estados ni crear
   dobles reembolsos;
7. registrar solo ID de evento, tipo, referencia interna, resultado y marcas
   de tiempo. Nunca se registran cuerpo completo, firma, secreto, PAN, CVC ni
   datos personales innecesarios;
8. devolver una respuesta genérica y no revelar reglas internas. Los fallos se
   alertan y se revisan; un `2xx` del navegador o del endpoint no aprueba una
   campaña;
9. probar en sandbox firma inválida, replay, evento repetido, cuenta o modo
   erróneos, importe y moneda alterados, eventos fuera de orden y caída entre
   recepción y confirmación.

### Banco y tesorería

- alertas inmediatas por nuevo dispositivo, cambio de beneficiario, cambio de
  cuenta de abono, pago, devolución y transferencia;
- cuenta de operación con saldo limitado y transferencia periódica a tesorería
  mediante un procedimiento aprobado;
- lista de beneficiarios y doble revisión para pagos salientes;
- ninguna solicitud de cambio de IBAN se acepta solo por email;
- reserva para devoluciones, disputas, comisiones e impuestos; los ingresos
  brutos no se tratan como caja disponible.

### Devoluciones y disputas

- cada devolución se vincula al contrato, factura y cobro originales;
- solo se devuelve al método de pago original mediante el proveedor o banco
  que recibió el cobro. Nunca se devuelve a otro IBAN, tarjeta, wallet,
  criptoactivo, efectivo o beneficiario indicado por correo;
- el total devuelto no supera el importe efectivamente conciliado y una
  devolución excepcional exige doble revisión antes de ejecutarse;
- un cambio de contacto, urgencia o captura no sustituye la verificación por un
  segundo canal conocido;
- las disputas se atienden dentro del proveedor, conservando contrato, factura,
  evidencia de prestación, comunicaciones y registro de retirada;
- el reembolso no borra ni reescribe los registros contables o de auditoría.

## 6. Datos mínimos

Para facturar se conserva únicamente lo necesario: razón social, NIF/VAT ID,
domicilio fiscal, país, contacto de facturación, contrato, factura, estado del
pago y referencias del proveedor. Para una comisión aprobada se añade el
estado agregado y sus ajustes. No se recogen datos de tarjeta, credenciales
bancarias de la empresa ni datos de los inversores.

La conservación y el acceso se fijan con el asesor fiscal y legal. En tarifa
fija no hay analítica, atribución, lead ni píxel. En comisión, solo se habilita
la medición mínima aprobada en contrato y privacidad; se prefiere un ID
aleatorio y reporte agregado, sin cookies de terceros.

## 7. Respuesta a incidentes

Ante un acceso desconocido, cambio bancario no autorizado, clave expuesta o
cobro manipulado:

1. pausar nuevos cobros y la activación automática de campañas;
2. bloquear sesiones, revocar o rotar claves y exigir nuevo acceso fuerte;
3. avisar inmediatamente al proveedor de cobro y al banco por sus canales
   oficiales;
4. preservar logs, IDs de eventos, facturas y evidencias sin copiar secretos;
5. revisar abonos, devoluciones, disputas y cambios de cuenta;
6. valorar con el responsable legal las notificaciones contractuales,
   regulatorias y de protección de datos;
7. reabrir solo con causa corregida, credenciales nuevas y doble revisión.

## 8. Criterio de apertura

El control `facturacion_y_cobro` no puede aprobarse hasta que existan:

- titular legal/fiscal y tratamiento de IVA confirmados;
- alta censal y actividad confirmadas, incluida la revisión de modelo 036;
- cuenta receptora verificada a nombre del mismo titular;
- contrato, numeración y sistema de factura definidos;
- responsable principal y suplente;
- matriz nominal de funciones, accesos e incompatibilidades aprobada;
- MFA fuerte y recuperación probada;
- conciliación, devoluciones, disputas y reserva documentadas;
- política que limita devoluciones al método original y prueba su doble
  revisión;
- pruebas en sandbox de cobro correcto, importe alterado, webhook repetido,
  firma inválida, replay, evento fuera de orden, modo o cuenta erróneos y
  devolución;
- prueba de que un pago confirmado no publica, activa ni renueva contenido;
- revisión final que confirme que ninguna app cliente contiene secretos o
  datos bancarios completos.

Para una comisión se exige además clasificación por oferta, permiso de pago,
contrato específico, disclosure, regla de atribución, tratamiento de
devoluciones y confirmación de que no infringe el artículo 3.3 del Reglamento
(UE) 2020/1503 ni una reserva de actividad financiera.

## 9. Fuentes de diseño

- Stripe, [Checkout alojado](https://docs.stripe.com/payments/checkout/quickstarts).
- Stripe, [payouts y cuenta de abono](https://docs.stripe.com/api/payouts).
- Stripe, [seguridad de la cuenta](https://support.stripe.com/questions/what-can-i-do-to-make-my-account-more-secure).
- Stripe, [eventos de pago y firma de webhooks](https://docs.stripe.com/webhooks/handling-payment-events).
- OWASP, [integración segura de pasarelas de pago](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.html).
- OWASP, [gestión de secretos](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- EUR-Lex, [Reglamento (UE) 2020/1503](https://eur-lex.europa.eu/eli/reg/2020/1503/oj),
  artículo 3.3.
- BOE, [Ley 6/2023 de los Mercados de Valores y de los Servicios de
  Inversión](https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053).
- AEAT, [IVA en prestaciones de servicios
  B2B](https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-comercio-exterior/prestaciones-servicios.html).
- BOE, [Real Decreto 238/2026 sobre facturación electrónica B2B](https://www.boe.es/eli/es/rd/2026/03/25/238).

Estas fuentes no sustituyen la confirmación fiscal, contractual y operativa
para el titular real de RWAdar.

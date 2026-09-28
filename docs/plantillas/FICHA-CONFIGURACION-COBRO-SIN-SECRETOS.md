# RWAdar · ficha de configuración de cobro sin secretos

No anotar IBAN completo, claves, contraseñas, códigos MFA, códigos de
recuperación, documentos de identidad ni enlaces privados.

Este archivo es una **plantilla versionada**. No se rellena dentro del
repositorio. Crea una copia en el archivo privado de administración con control
de acceso y completa allí incluso los datos no secretos de personas, cuenta y
proveedor. En Git solo puede quedar esta plantilla vacía y, cuando proceda, una
evidencia no sensible con fecha, responsable y referencia opaca.

## Titular

- Razón social o titular:
- País fiscal:
- NIF/VAT ID verificado: sí / no
- Responsable principal:
- Responsable suplente:
- Dictamen fiscal de referencia y fecha:

## Cuenta receptora

- Alias interno:
- Banco:
- Moneda:
- Últimos cuatro caracteres del IBAN:
- Titular coincide con contrato, factura y proveedor: sí / no
- Fecha y revisor de la comprobación:
- Alertas bancarias activas: sí / no
- Doble revisión para cambios: sí / no

## Canal

- Piloto: transferencia SEPA / factura alojada / otro aprobado
- Proveedor de cobro, si aplica:
- Entorno de prueba separado: sí / no
- Cuenta de abono verificada: sí / no
- Alias de cuenta comercial del proveedor:
- País o región y modo `live` comprobados: sí / no
- Identificador parcial de cuenta comercial:
- Descriptor visible para el pagador comprobado:
- Destino de abonos coincide con la cuenta receptora: sí / no
- MFA fuerte del equipo: sí / no
- Recuperación probada: sí / no
- Claves restringidas y secret manager: sí / no / no aplica
- Lista cerrada de eventos webhook aprobada: sí / no / no aplica
- Firma sobre cuerpo bruto y anti-replay probados: sí / no / no aplica
- Cuenta, modo, importe, moneda y orden validados en servidor: sí / no / no aplica
- Idempotencia atómica y eventos fuera de orden probados: sí / no / no aplica
- Logs sin cuerpo, firma, secretos ni datos de pago: sí / no / no aplica

## Operación

- Serie y sistema de facturación:
- Responsable de conciliación:
- Periodicidad de conciliación:
- Política de devolución aprobada:
- Reserva para impuestos, comisiones y disputas definida: sí / no
- Contactos de emergencia del banco y proveedor guardados fuera de Git: sí / no

## Funciones y accesos

- Solicita alta/campaña:
- Emite factura:
- Confirma y concilia el cobro:
- Administra proveedor y webhook:
- Aprueba cambios de cuenta de abono o administradores:
- Aprueba y ejecuta devoluciones:
- Aprueba contenido y publicación:
- Custodia la recuperación de emergencia:
- Segunda persona o asesor independiente:
- Revisión de accesos y fecha:
- Incompatibilidades de funciones verificadas: sí / no

## Devoluciones y disputas

- Solo al método de pago original: sí / no
- Límite máximo igual al cobro conciliado: sí / no
- Doble revisión para excepciones: sí / no
- Responsable y plazo de respuesta a disputas:
- Evidencia contractual y de prestación disponible: sí / no
- Solicitudes de IBAN, tarjeta o wallet alternativos se rechazan: sí / no

## Corte

- Dos pagos de prueba conciliados: sí / no / no aplica
- Importe manipulado rechazado: sí / no / no aplica
- Webhook duplicado no duplica activación: sí / no / no aplica
- Firma inválida rechazada: sí / no / no aplica
- Replay o evento fuera de tolerancia rechazado: sí / no / no aplica
- Cuenta o modo incorrectos rechazados: sí / no / no aplica
- Eventos fuera de orden no retroceden el estado: sí / no / no aplica
- Devolución de prueba conciliada: sí / no / no aplica
- Devolución a destino alternativo rechazada: sí / no / no aplica
- Pago confirmado no publica ni activa contenido: sí / no
- Revisión de secretos en web, móvil, logs y Git superada: sí / no
- Incidentes de credenciales históricas cerrados con evidencia: sí / no
- Aprobado por:
- Fecha:
- Resultado: pendiente / aprobado / rechazado

# Comprobación de las partidas diseñadas para el Proyecto 4 (conciliación bancaria, octubre 2026)
from decimal import Decimal as D
banco_30_09 = D('84215.37')
# pendientes de septiembre (en libros a 30/09, no en banco)
cheque_1187 = D('-2350.00')      # pago contabilizado 28/09, cargado por el banco 06/10
transf_cli_0930 = D('3120.00')   # cobro contabilizado 30/09, abonado por el banco 01/10
libros_30_09 = banco_30_09 + cheque_1187 + transf_cli_0930
print("Libros 30/09:", libros_30_09)
banco_31_10 = D('61482.19')
# A) en libros (octubre) y no en banco a 31/10
cheque_1203 = D('-4812.50'); transf_prov_3010 = D('-7260.00'); cobro_cli_3110 = D('5445.00')
# B) en banco y no en libros
comision_mant = D('-45.00')
comisiones_transf = [D('-12.40'),D('-12.40'),D('-15.10'),D('-9.80'),D('-14.20')]
cuota_prestamo = D('-1957.49')  # préstamo 85.000 € al 5 % TIN, 48 cuotas, cuota nº 19 (25/10/2026): interés 229,56 + capital 1.727,93
devol_recibo = D('-2420.00'); gastos_devol = D('-6.05')
transf_sin_ident = D('1089.00')
# C) errores en libros
duplicado = D('3630.00')         # cobro contabilizado dos veces (sobra en libros)
transpos = D('36.00')            # pago contabilizado 1.548,00 en vez de 1.584,00 (libros tienen 36 € de más)
ajust_banco = banco_31_10 + cobro_cli_3110 + cheque_1203 + transf_prov_3010
partidasB = comision_mant + sum(comisiones_transf) + cuota_prestamo + devol_recibo + gastos_devol + transf_sin_ident
print("Comisiones transferencia:", sum(comisiones_transf))
print("Partidas banco no contabilizadas (neto):", partidasB)
libros_31_10 = ajust_banco - partidasB + duplicado + transpos
print("Saldo banco ajustado:", ajust_banco)
print("Saldo libros 31/10 que debe dar el generador:", libros_31_10)
ajust_libros = libros_31_10 + partidasB - duplicado - transpos
print("Saldo libros ajustado:", ajust_libros, "diferencia", ajust_banco-ajust_libros)
print("Movimiento neto octubre banco:", banco_31_10-banco_30_09, " libros:", libros_31_10-libros_30_09)
# asiento propuesto (lo que contabilidad debe registrar)
print("Asiento: gastos bancarios 626:", -(comision_mant+sum(comisiones_transf)+gastos_devol),
      " cuota préstamo (capital+intereses):", -cuota_prestamo, " cliente devolución 430:", -devol_recibo,
      " partida pendiente aplicación 554/cliente:", transf_sin_ident)

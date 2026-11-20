#!/usr/bin/env python3
"""Genera libros/n4-simulador.xlsx (para la alumna) y libros/n4-simulador-solucion.xlsx.
Módulo n4m3 «Simular: ¿y si…?». Dos partes:
  1) Préstamo de 35.000 € al 5,4 % a 4 años (carretilla del almacén): cuota con PAGO, cuadro de amortización, comprobación.
  2) Modelo de margen del panel LED 60x60 40 W: supuestos separados, Buscar objetivo (precio de equilibrio) y 3 escenarios.
Los totales de control se calculan con pandas a partir de los supuestos y se imprimen en JSON."""
import json, os
import pandas as pd
import xlsxwriter

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMPORTE, TASA, ANOS = 35000, 0.054, 4
N = ANOS * 12
PRECIO, UDS, COSTE, FIJOS = 32, 4000, 21.5, 30000
ESC = [("Pesimista", 30, 3200, "Entra un competidor con precio más bajo; ventas como en 2025"),
       ("Base", 32, 4000, "Precio de tarifa actual; previsión del equipo comercial"),
       ("Optimista", 33, 4600, "Se cierra el acuerdo con dos instaladores grandes de Huesca")]

# ---------- controles con pandas ----------
r = TASA / 12
cuota = IMPORTE * r / (1 - (1 + r) ** -N)
filas, saldo = [], IMPORTE
for m in range(1, N + 1):
    i = saldo * r; k = cuota - i
    filas.append({"mes": m, "saldo_ini": saldo, "cuota": cuota, "interes": i, "capital": k, "saldo_fin": saldo - k})
    saldo -= k
df = pd.DataFrame(filas)
esc = pd.DataFrame(ESC, columns=["escenario", "precio", "uds", "comentario"])
esc["beneficio"] = (esc.precio - COSTE) * esc.uds - FIJOS
controles = {
    "cuota": round(cuota, 2),
    "total_intereses": round(df.interes.sum(), 2),
    "intereses_ano1": round(df[df.mes <= 12].interes.sum(), 2),
    "saldo_final": round(df.saldo_fin.iloc[-1], 6),
    "suma_capital": round(df.capital.sum(), 2),
    "precio_equilibrio": round(COSTE + FIJOS / UDS, 2),
    "beneficio_base": float(esc.set_index("escenario").beneficio["Base"]),
    "beneficio_pesimista": float(esc.set_index("escenario").beneficio["Pesimista"]),
    "beneficio_optimista": float(esc.set_index("escenario").beneficio["Optimista"]),
}

INSTR = [
    ("Simulador: préstamo y margen", "titulo"),
    ("Electro Cierzo Suministros, S.L. · Módulo «Simular: ¿y si…?» · Intenta hacerlo en menos de 40 minutos.", None),
    ("", None),
    ("PARTE 1 · Préstamo para la carretilla elevadora (hoja «Préstamo»)", "sub"),
    ("Marta Ruiz va a pedir 35.000 € al 5,4 % anual a 4 años, con cuota mensual, para comprar una carretilla elevadora para el almacén de Zaragoza.", None),
    ("1. En C7 calcula la cuota mensual con PAGO, en positivo. No escribas ningún número dentro de la fórmula: usa C4, C5 y C6.", None),
    ("2. Completa el cuadro de amortización (filas 12 a 59, meses 1 a 48): saldo inicial, cuota, interés, capital y saldo final. Escribe la fila del mes 1 y cópiala hacia abajo.", None),
    ("3. En C61 enlaza el saldo final del mes 48 y en C62 suma la columna Capital. Comprueba: C61 debe ser 0 y C62, 35.000 €.", None),
    ("4. En C8 calcula el total de intereses y en C9 los intereses del primer año (meses 1 a 12).", None),
    ("", None),
    ("PARTE 2 · Margen del panel LED 60x60 40 W (hoja «Margen»)", "sub"),
    ("5. Completa los cálculos de C11 a C15 solo con fórmulas que apunten a los supuestos de C5:C8: ingresos (precio × unidades), costes variables (unidades × coste por unidad), margen de contribución (ingresos − costes variables), costes fijos y beneficio (margen de contribución − costes fijos).", None),
    ("6. Con Datos › Previsión › Análisis de hipótesis › Buscar objetivo, busca el precio de venta que deja el beneficio (C15) en 0. Apunta ese precio en C17 y pulsa Cancelar para que C5 vuelva a 32 €.", None),
    ("7. Con el Administrador de escenarios crea los escenarios Base, Pesimista y Optimista de la tabla B21:E23 (celdas cambiantes C5:C6, con su comentario). Después pulsa Resumen con C15 como celda de resultado.", None),
    ("", None),
    ("CÓMO COMPROBAR (totales de control)", "sub"),
    ("Cuota mensual · total de intereses · intereses del primer año · precio de equilibrio · beneficio en los escenarios pesimista y optimista. Escríbelos en la guía: te dirá si cuadran.", None),
    ("Qué entregar: el libro con las dos hojas completas y la hoja del resumen de escenarios.", None),
]


def libro(ruta, solucion):
    wb = xlsxwriter.Workbook(ruta)
    f_tit = wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F4E79"})
    f_sub = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F4E79"})
    f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
    f_cab = wb.add_format({"bold": True, "bg_color": "#1F4E79", "font_color": "#FFFFFF", "border": 1})
    f_eur = wb.add_format({"num_format": '#,##0.00 "€"', "border": 1})
    f_eur_in = wb.add_format({"num_format": '#,##0.00 "€"', "border": 1, "bg_color": "#DDEBF7"})
    f_pct_in = wb.add_format({"num_format": "0.0%", "border": 1, "bg_color": "#DDEBF7"})
    f_num_in = wb.add_format({"num_format": "#,##0", "border": 1, "bg_color": "#DDEBF7"})
    f_res = wb.add_format({"num_format": '#,##0.00 "€"', "border": 1, "bg_color": "#FFF2CC"})
    f_int = wb.add_format({"num_format": "0", "border": 1, "align": "center"})
    f_num = wb.add_format({"num_format": "#,##0", "border": 1})
    f_b = wb.add_format({"bold": True})
    f_nota = wb.add_format({"italic": True, "font_color": "#595959", "text_wrap": True})

    # Instrucciones
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 2); ws.set_column("B:B", 120)
    for i, (t, est) in enumerate(INSTR):
        ws.write(i + 1, 1, t, f_tit if est == "titulo" else f_sub if est == "sub" else f_txt)
    if solucion:
        ws.write(len(INSTR) + 2, 1, "SOLUCIÓN: las celdas amarillas tienen las fórmulas resueltas. Buscar objetivo y el Administrador de escenarios no se guardan como fórmulas: sus resultados se comprueban en C17 y en la columna F de la hoja «Margen».", f_nota)

    # Préstamo
    ws = wb.add_worksheet("Préstamo")
    ws.set_column("A:A", 2); ws.set_column("B:B", 40); ws.set_column("C:G", 15)
    ws.write("B2", "Préstamo para la carretilla elevadora (almacén de Zaragoza)", f_sub)
    ws.write("B4", "Importe del préstamo"); ws.write("C4", IMPORTE, f_eur_in)
    ws.write("B5", "Interés anual"); ws.write("C5", TASA, f_pct_in)
    ws.write("B6", "Años"); ws.write("C6", ANOS, f_num_in)
    ws.write("B7", "Cuota mensual", f_b)
    ws.write("B8", "Total de intereses", f_b)
    ws.write("B9", "Intereses del primer año (meses 1-12)", f_b)
    for c in ("C7", "C8", "C9"):
        ws.write_blank(c, None, f_res)
    for j, h in enumerate(["Mes", "Saldo inicial", "Cuota", "Interés", "Capital", "Saldo final"]):
        ws.write(10, 1 + j, h, f_cab)
    for m in range(1, N + 1):
        fila = 11 + m  # número de fila de Excel (12 = mes 1)
        ws.write(fila - 1, 1, m, f_int)
        if solucion:
            ws.write_formula(fila - 1, 2, "=C4" if m == 1 else f"=G{fila-1}", f_eur)
            ws.write_formula(fila - 1, 3, "=$C$7", f_eur)
            ws.write_formula(fila - 1, 4, f"=C{fila}*$C$5/12", f_eur)
            ws.write_formula(fila - 1, 5, f"=D{fila}-E{fila}", f_eur)
            ws.write_formula(fila - 1, 6, f"=C{fila}-F{fila}", f_eur)
        else:
            for col in range(2, 7):
                ws.write_blank(fila - 1, col, None, f_eur)
    ws.write("B61", "Comprobación: saldo final del mes 48 (debe ser 0)", f_b)
    ws.write("B62", "Comprobación: suma de la columna Capital (debe ser el importe)", f_b)
    ws.write_blank("C61", None, f_res); ws.write_blank("C62", None, f_res)
    if solucion:
        ws.write_formula("C7", "=-PMT(C5/12,C6*12,C4)", f_res)
        ws.write_formula("C8", "=SUM(E12:E59)", f_res)
        ws.write_formula("C9", "=SUM(E12:E23)", f_res)
        ws.write_formula("C61", "=ROUND(G59,2)", f_res)
        ws.write_formula("C62", "=SUM(F12:F59)", f_res)
        ws.write("D8", "También: =C7*C6*12-C4", f_nota)
    ws.freeze_panes(11, 0)

    # Margen
    ws = wb.add_worksheet("Margen")
    ws.set_column("A:A", 2); ws.set_column("B:B", 40); ws.set_column("C:D", 15); ws.set_column("E:E", 62); ws.set_column("F:F", 15)
    ws.write("B2", "Panel LED 60x60 40 W · modelo de margen anual", f_sub)
    ws.write("B4", "SUPUESTOS (solo se cambian aquí)", f_b)
    ws.write("B5", "Precio de venta"); ws.write("C5", PRECIO, f_eur_in)
    ws.write("B6", "Unidades al año"); ws.write("C6", UDS, f_num_in)
    ws.write("B7", "Coste por unidad"); ws.write("C7", COSTE, f_eur_in)
    ws.write("B8", "Costes fijos de la línea (almacén, transporte, catálogo)"); ws.write("C8", FIJOS, f_eur_in)
    ws.write("B10", "CÁLCULOS (solo fórmulas)", f_b)
    calc = [("Ingresos", "=C5*C6"), ("Costes variables", "=C6*C7"), ("Margen de contribución", "=C11-C12"),
            ("Costes fijos", "=C8"), ("Beneficio", "=C13-C14")]
    for k, (et, fo) in enumerate(calc):
        ws.write(10 + k, 1, et, f_b if et == "Beneficio" else None)
        if solucion:
            ws.write_formula(10 + k, 2, fo, f_res)
        else:
            ws.write_blank(10 + k, 2, None, f_res)
    ws.write("B17", "Precio de equilibrio (resultado de Buscar objetivo)", f_b)
    if solucion:
        ws.write_formula("C17", "=C7+C8/C6", f_res)
        ws.write("D17", "Comprobación con fórmula: coste + fijos / unidades. Buscar objetivo da lo mismo.", f_nota)
    else:
        ws.write_blank("C17", None, f_res)
    ws.write("B19", "ESCENARIOS (créalos con el Administrador de escenarios)", f_b)
    cab = ["Escenario", "Precio", "Unidades", "Comentario"] + (["Beneficio"] if solucion else [])
    for j, h in enumerate(cab):
        ws.write(19, 1 + j, h, f_cab)
    for k, (n, p, u, com) in enumerate(ESC):
        fila = 21 + k
        ws.write(fila - 1, 1, n); ws.write(fila - 1, 2, p, f_eur); ws.write(fila - 1, 3, u, f_num); ws.write(fila - 1, 4, com)
        if solucion:
            ws.write_formula(fila - 1, 5, f"=(C{fila}-$C$7)*D{fila}-$C$8", f_res)
    if solucion:
        ws.write("B25", "La columna F repite el cálculo del modelo para cada escenario: es lo mismo que debe salir en el Resumen del Administrador de escenarios.", f_nota)
    wb.close()


libro(os.path.join(B, "n4-simulador.xlsx"), False)
libro(os.path.join(B, "n4-simulador-solucion.xlsx"), True)
json.dump({"titulo": "N4 · Simulador: préstamo y margen", "descripcion": "Cuadro de amortización de un préstamo con PAGO y modelo de margen de un panel LED con supuestos separados, Buscar objetivo y escenarios.", "nivel": "n4"},
          open(os.path.join(B, "n4-simulador.meta.json"), "w"), ensure_ascii=False, indent=2)
json.dump({"titulo": "N4 · Simulador: préstamo y margen (solución)", "descripcion": "Solución del simulador: cuadro de amortización con fórmulas, modelo de margen, precio de equilibrio y beneficio de cada escenario.", "nivel": "n4"},
          open(os.path.join(B, "n4-simulador-solucion.meta.json"), "w"), ensure_ascii=False, indent=2)
print(json.dumps(controles, ensure_ascii=False))

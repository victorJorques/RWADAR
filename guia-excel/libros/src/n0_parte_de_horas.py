#!/usr/bin/env python3
"""Libro de práctica del módulo n0m3 «Tu primera fórmula».
Genera libros/n0-parte-de-horas.xlsx (para la alumna) y libros/n0-parte-de-horas-solucion.xlsx,
sus .meta.json, y calcula con pandas los totales de control (los imprime en JSON).
Fórmulas en el archivo: en inglés y con comas (así se guardan; Excel en español las muestra traducidas)."""
import json, os
import pandas as pd
import xlsxwriter

B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # EXCEL/libros

# ---------- Datos ----------
# Parte de horas: el jueves y el viernes los escribe la alumna (datos en Instrucciones).
PARTE = [  # (día, fecha, horas o None si la rellena ella)
    ("Lunes", "2026-11-16", 8),
    ("Martes", "2026-11-17", 8),
    ("Miércoles", "2026-11-18", 7.5),
    ("Jueves", "2026-11-19", None),
    ("Viernes", "2026-11-20", None),
]
RELLENO_PARTE = {"Jueves": 8, "Viernes": 6.5}
PRECIO_HORA = 17.40

# Pedido de material: dos líneas sin unidades (las escribe la alumna).
PEDIDO = [  # (producto, unidades o None, precio unidad)
    ("Cable H07V-K 1,5 mm² (rollo 100 m)", 20, 38.90),
    ("Cable H07V-K 2,5 mm² (rollo 100 m)", None, 59.80),
    ("Tubo corrugado 20 mm (rollo 100 m)", 12, 24.50),
    ("Bridas 200 mm (bolsa 100 uds)", None, 3.15),
    ("Canaleta 40x60 mm (tramo 2 m)", 30, 6.85),
    ("Magnetotérmico 2P 16 A", 25, 11.60),
]
RELLENO_PEDIDO = {"Cable H07V-K 2,5 mm² (rollo 100 m)": 15, "Bridas 200 mm (bolsa 100 uds)": 40}

# ---------- Totales de control (pandas, desde los datos) ----------
dp = pd.DataFrame(PARTE, columns=["dia", "fecha", "horas"])
dp["horas"] = dp.apply(lambda r: RELLENO_PARTE.get(r["dia"], r["horas"]), axis=1).astype(float)
total_horas = float(dp["horas"].sum())
importe_parte = round(total_horas * PRECIO_HORA, 2)

dd = pd.DataFrame(PEDIDO, columns=["producto", "uds", "precio"])
dd["uds"] = dd.apply(lambda r: RELLENO_PEDIDO.get(r["producto"], r["uds"]), axis=1).astype(float)
dd["importe"] = (dd["uds"] * dd["precio"]).round(2)
total_pedido = round(float(dd["importe"].sum()), 2)
importe_cable25 = float(dd.loc[dd["producto"].str.contains("2,5 mm"), "importe"].iloc[0])
importe_bridas = float(dd.loc[dd["producto"].str.startswith("Bridas"), "importe"].iloc[0])
CONTROLES = {
    "total_horas": total_horas,
    "importe_parte": importe_parte,
    "importe_cable25": importe_cable25,
    "importe_bridas": importe_bridas,
    "total_pedido": total_pedido,
}

INSTRUCCIONES = [
    ("Práctica: parte de horas y pedido de material", "titulo"),
    ("Electro Cierzo Suministros, S.L. · Semana del 16/11/2026", "sub"),
    ("", None),
    ("Qué vas a hacer", "h"),
    ("Rellenar dos plantillas de la empresa, escribir tus primeras fórmulas y comprobar que todo cuadra.", None),
    ("Las celdas amarillas son para escribir. Las grises tienen (o tendrán) fórmulas: no escribas números en ellas.", None),
    ("", None),
    ("Pasos", "h"),
    ("1. Ve a la hoja «Parte de horas». Escribe las horas que faltan: jueves 8 (celda C5) y viernes 6,5 (celda C6).", None),
    ("2. En C8 escribe la fórmula del total de horas con SUMA: suma de C2 a C6.", None),
    ("3. En C10 escribe la fórmula del importe a pagar: total de horas (C8) por precio por hora (C9).", None),
    ("4. Cambia el nombre de la hoja «Hoja2» por «Pedido» (doble clic en la pestaña, escribe y pulsa Intro).", None),
    ("5. En la hoja «Pedido», escribe las unidades que faltan: 15 rollos de cable de 2,5 mm² (B3) y 40 bolsas de bridas (B5).", None),
    ("   La columna Importe ya tiene fórmulas (precio por unidades): mira cómo se calcula sola.", None),
    ("6. En D8 escribe la fórmula del total del pedido con SUMA: suma de D2 a D7.", None),
    ("7. Guarda el libro (Ctrl+G). Si quieres, expórtalo a PDF: Archivo › Exportar › Crear documento PDF/XPS.", None),
    ("", None),
    ("Cómo comprobar tu trabajo", "h"),
    ("Selecciona los datos de cada columna y mira la Suma de la barra de estado: debe coincidir con tus totales.", None),
    ("Después, escribe en la guía los totales de control que te pide: total de horas, importe del parte,", None),
    ("importe de la línea del cable de 2,5 mm², importe de la línea de las bridas y total del pedido.", None),
]


def crear(nombre, solucion):
    ruta = os.path.join(B, nombre)
    wb = xlsxwriter.Workbook(ruta)
    f_tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E79"})
    f_sub = wb.add_format({"italic": True, "font_color": "#555555"})
    f_h = wb.add_format({"bold": True, "font_size": 12})
    f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
    f_txt = wb.add_format({"border": 1})
    f_fecha = wb.add_format({"num_format": "dd/mm/yyyy", "border": 1})
    f_horas = wb.add_format({"num_format": "0.0", "border": 1})
    f_in_h = wb.add_format({"num_format": "0.0", "border": 1, "bg_color": "#FFF2CC"})
    f_in_n = wb.add_format({"num_format": "0", "border": 1, "bg_color": "#FFF2CC"})
    f_num = wb.add_format({"num_format": "0", "border": 1})
    f_eur = wb.add_format({"num_format": "#,##0.00 €", "border": 1})
    f_fx_h = wb.add_format({"num_format": "0.0", "border": 1, "bg_color": "#EDEDED", "bold": True})
    f_fx_e = wb.add_format({"num_format": "#,##0.00 €", "border": 1, "bg_color": "#EDEDED"})
    f_fx_eb = wb.add_format({"num_format": "#,##0.00 €", "border": 1, "bg_color": "#EDEDED", "bold": True})
    f_neg = wb.add_format({"bold": True, "border": 1})

    # Instrucciones
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 120)
    for i, (t, est) in enumerate(INSTRUCCIONES):
        ws.write(i, 0, t, {"titulo": f_tit, "sub": f_sub, "h": f_h}.get(est))
    if solucion:
        r = len(INSTRUCCIONES) + 1
        ws.write(r, 0, "SOLUCIÓN · Totales de control", f_h)
        es = lambda x: f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        ws.write(r + 1, 0, f"Total horas: {es(total_horas)} · Importe del parte: {es(importe_parte)} € · Total del pedido: {es(total_pedido)} €")

    # Parte de horas
    wp = wb.add_worksheet("Parte de horas")
    wp.set_column("A:A", 18); wp.set_column("B:B", 12); wp.set_column("C:C", 10); wp.set_column("E:E", 12); wp.set_column("F:F", 26)
    for c, t in enumerate(["Día", "Fecha", "Horas"]):
        wp.write(0, c, t, f_cab)
    wp.write(0, 4, "Trabajador:", f_neg); wp.write(0, 5, "Diego Lafuente Gil")
    wp.write(1, 4, "Puesto:", f_neg); wp.write(1, 5, "Mozo de almacén (refuerzo)")
    wp.write(2, 4, "Responsable:", f_neg); wp.write(2, 5, "Andrés Molina")
    import datetime as dt
    for i, (dia, fecha, horas) in enumerate(PARTE, start=1):
        wp.write(i, 0, dia, f_txt)
        wp.write_datetime(i, 1, dt.datetime.strptime(fecha, "%Y-%m-%d"), f_fecha)
        if horas is None:
            if solucion:
                wp.write_number(i, 2, RELLENO_PARTE[dia], f_in_h)
            else:
                wp.write_blank(i, 2, None, f_in_h)
        else:
            wp.write_number(i, 2, horas, f_horas)
    wp.write(7, 0, "Total horas", f_neg)
    wp.write(8, 0, "Precio por hora", f_neg)
    wp.write(9, 0, "Importe a pagar", f_neg)
    wp.write_number(8, 2, PRECIO_HORA, f_eur)
    if solucion:
        wp.write_formula(7, 2, "=SUM(C2:C6)", f_fx_h, total_horas)
        wp.write_formula(9, 2, "=C8*C9", f_fx_eb, importe_parte)
    else:
        wp.write_blank(7, 2, None, f_fx_h)
        wp.write_blank(9, 2, None, f_fx_eb)

    # Pedido (en el libro de la alumna se llama Hoja2: ella le cambia el nombre)
    wd = wb.add_worksheet("Pedido" if solucion else "Hoja2")
    wd.set_column("A:A", 38); wd.set_column("B:B", 11); wd.set_column("C:C", 14); wd.set_column("D:D", 14); wd.set_column("F:F", 30)
    for c, t in enumerate(["Producto", "Unidades", "Precio unidad", "Importe"]):
        wd.write(0, c, t, f_cab)
    wd.write(0, 5, "Pedido a Cables y Tubos del Moncayo, S.L.", f_neg)
    wd.write(1, 5, "Fecha: 16/11/2026 · Pide: Andrés Molina")
    for i, (prod, uds, precio) in enumerate(PEDIDO, start=1):
        fila = i + 1
        wd.write(i, 0, prod, f_txt)
        if uds is None:
            if solucion:
                wd.write_number(i, 1, RELLENO_PEDIDO[prod], f_in_n)
            else:
                wd.write_blank(i, 1, None, f_in_n)
        else:
            wd.write_number(i, 1, uds, f_num)
        wd.write_number(i, 2, precio, f_eur)
        imp = float(dd.loc[dd["producto"] == prod, "importe"].iloc[0]) if solucion else (round(uds * precio, 2) if uds else 0)
        wd.write_formula(i, 3, f"=B{fila}*C{fila}", f_fx_e, imp)
    wd.write(7, 0, "Total del pedido (sin IVA)", f_neg)
    if solucion:
        wd.write_formula(7, 3, "=SUM(D2:D7)", f_fx_eb, total_pedido)
    else:
        wd.write_blank(7, 3, None, f_fx_eb)

    wb.close()
    return ruta


crear("n0-parte-de-horas.xlsx", False)
crear("n0-parte-de-horas-solucion.xlsx", True)
for nombre, titulo, desc in [
    ("n0-parte-de-horas", "Parte de horas y pedido de material",
     "Plantilla de parte de horas semanal y hoja de pedido para escribir tus primeras fórmulas (SUMA y multiplicaciones) y comprobarlas."),
    ("n0-parte-de-horas-solucion", "Parte de horas y pedido de material (solución)",
     "La práctica resuelta, con las fórmulas y los totales de control."),
]:
    json.dump({"titulo": titulo, "descripcion": desc, "nivel": "n0"},
              open(os.path.join(B, nombre + ".meta.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(CONTROLES, ensure_ascii=False))

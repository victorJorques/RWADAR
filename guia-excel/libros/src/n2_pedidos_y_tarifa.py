#!/usr/bin/env python3
"""Genera libros/n2-pedidos-y-tarifa.xlsx (datos de partida) y n2-pedidos-y-tarifa-solucion.xlsx.

Práctica del módulo n2m5 (BUSCARX / BUSCARV, #N/D, nombres definidos) con repaso de SUMAR.SI y MES.
Hoja Pedidos: 120 líneas de pedido de Electro Cierzo Suministros, S.L. (septiembre-noviembre 2026).
Hoja Tarifa: 40 productos.

Suciedad sembrada a propósito (documentada aquí, no en el libro de la alumna):
- Pedidos: 10 líneas con el código exportado con un espacio al final («CAB-15 »). Se arregla con
  ESPACIOS dentro de la búsqueda: BUSCARX(ESPACIOS(E2);…).
- Tarifa: 3 códigos escritos con un espacio al final. Se arregla en la propia tarifa con
  Inicio › Buscar y seleccionar › Reemplazar (Ctrl+L): buscar un espacio, reemplazar por nada,
  solo en la columna A (los códigos no llevan espacios dentro).
- 3 productos pedidos que NO están en la tarifa (LED-36, CAJ-EST, DIF-40): deben quedar «Sin tarifa»
  e importe 0, y contarse.

Reglas del encargo:
- Descripción y Precio con BUSCARX (o BUSCARV … FALSO), con «Sin tarifa» si no está.
- Importe = Uds × Precio; si el precio es «Sin tarifa», 0.
- Mes = MES(Fecha). Resumen por comercial y por mes con SUMAR.SI.
- Celda del IVA (21 %) con el nombre TipoIVA; Total con IVA = Total × (1 + TipoIVA).
Los totales de control se calculan con pandas a partir de los datos limpios y se imprimen en JSON.
"""
import json
import os
import random
from datetime import date, timedelta

import pandas as pd
import xlsxwriter

random.seed(20261117)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TARIFA = [
    ("CAB-15", "Cable 1,5 mm² (rollo 100 m)", 32.50), ("CAB-25", "Cable 2,5 mm² (rollo 100 m)", 49.90),
    ("CAB-40", "Cable 4 mm² (rollo 100 m)", 78.40), ("CAB-60", "Cable 6 mm² (rollo 100 m)", 112.00),
    ("MAN-3G15", "Manguera 3G1,5 (rollo 100 m)", 96.50), ("MAN-3G25", "Manguera 3G2,5 (rollo 100 m)", 139.00),
    ("CAN-25", "Canaleta 25×16 (2 m)", 2.90), ("CAN-40", "Canaleta 40×25 (2 m)", 4.80),
    ("CAN-60", "Canaleta 60×40 (2 m)", 7.95), ("TUB-16", "Tubo corrugado 16 mm (100 m)", 15.40),
    ("TUB-20", "Tubo corrugado 20 mm (100 m)", 18.90), ("TUB-25", "Tubo corrugado 25 mm (50 m)", 13.60),
    ("TUB-32", "Tubo corrugado 32 mm (25 m)", 11.20), ("BRI-100", "Bridas 100 mm (bolsa 100)", 1.60),
    ("BRI-200", "Bridas 200 mm (bolsa 100)", 3.20), ("BRI-300", "Bridas 300 mm (bolsa 100)", 5.10),
    ("MEC-INT", "Interruptor de empotrar", 4.15), ("MEC-CON", "Conmutador de empotrar", 4.60),
    ("MEC-ENC", "Base de enchufe 16 A", 3.95), ("MEC-USB", "Base de enchufe con USB", 19.80),
    ("MEC-MAR", "Marco simple", 1.35), ("CAJ-REG", "Caja de registro 100×100", 2.25),
    ("CAJ-UNI", "Caja universal de empotrar", 0.48), ("LED-09", "Bombilla LED 9 W E27", 2.10),
    ("LED-18", "Panel LED 18 W", 14.60), ("LED-24", "Downlight LED 24 W", 21.30),
    ("LED-40", "Panel LED 60×60 40 W", 34.90), ("LED-TIR", "Tira LED 5 m", 17.50),
    ("PRO-50", "Proyector LED 50 W", 28.75), ("EMR-01", "Luz de emergencia 100 lm", 24.40),
    ("MAG-10", "Magnetotérmico 10 A", 7.60), ("MAG-16", "Magnetotérmico 16 A", 7.85),
    ("MAG-20", "Magnetotérmico 20 A", 8.10), ("MAG-25", "Magnetotérmico 25 A", 9.30),
    ("MAG-32", "Magnetotérmico 32 A", 11.90), ("DIF-25", "Diferencial 25 A 30 mA", 38.50),
    ("DIF-63", "Diferencial 63 A 30 mA", 64.00), ("CUA-12", "Cuadro de 12 módulos", 18.40),
    ("CUA-24", "Cuadro de 24 módulos", 31.60), ("TER-01", "Regleta de bornas (10 uds)", 3.70),
]
assert len(TARIFA) == 40
SIN_TARIFA = ["LED-36", "CAJ-EST", "DIF-40"]  # pedidos que no están en la tarifa
COMERCIALES = ["Irene Lasheras", "Pablo Gimeno", "Sergio Arnal", "Maite Iribarren", "Jordi Puig"]
CLIENTES = {
    "Irene Lasheras": ["Instalaciones Ebro, S.L.", "Montajes Delicias, S.L.", "Reformas Actur, S.L."],
    "Pablo Gimeno": ["Electricidad Hnos. Lacasa", "Climatización Moncayo, S.L.", "Construcciones Valdespartera"],
    "Sergio Arnal": ["Mantenimientos Cinca, S.L.", "Iluminaciones Ribera, S.A."],
    "Maite Iribarren": ["Electro Txantrea, S.L.", "Electricidad Arga, S.L."],
    "Jordi Puig": ["Instal·lacions Segrià, S.L.", "Montajes Noguera, S.L."],
}
precio = {c: p for c, _, p in TARIFA}
descr = {c: d for c, d, _ in TARIFA}

lineas = []
inicio = date(2026, 9, 1)
for i in range(120):
    f = inicio + timedelta(days=random.randint(0, 73))  # hasta el 13/11/2026
    while f.weekday() >= 5:
        f -= timedelta(days=1)
    com = random.choices(COMERCIALES, weights=[5, 5, 4, 3, 3])[0]
    lineas.append({"fecha": f, "comercial": com, "cliente": random.choice(CLIENTES[com]),
                   "codigo": random.choice(TARIFA)[0]})
lineas.sort(key=lambda x: (x["fecha"], x["comercial"]))
# 6 líneas de productos sin tarifa (2 de cada uno)
for k, i in enumerate(random.sample(range(120), 6)):
    lineas[i]["codigo"] = SIN_TARIFA[k % 3]
for i, l in enumerate(lineas):
    l["pedido"] = f"PV-26-{1401 + i:04d}"
    cod = l["codigo"]
    if cod.startswith(("CAB", "MAN")):
        l["uds"] = random.randint(1, 8)
    elif cod.startswith(("BRI", "CAJ", "MEC", "LED-09", "TER")):
        l["uds"] = random.choice([10, 20, 25, 40, 50, 100])
    else:
        l["uds"] = random.randint(2, 30)
# 10 líneas con espacio al final en el código del pedido (solo entre las que sí tienen tarifa)
con_tarifa = [i for i, l in enumerate(lineas) if l["codigo"] in precio]
IDX_ESP_PED = sorted(random.sample(con_tarifa, 10))
# 3 códigos de la tarifa con espacio al final (elegidos entre los que se piden)
pedidos_cods = sorted({l["codigo"] for l in lineas if l["codigo"] in precio})
COD_ESP_TAR = sorted(random.sample(pedidos_cods, 3))

for l in lineas:
    p = precio.get(l["codigo"])
    l["descripcion"] = descr.get(l["codigo"], "Sin tarifa")
    l["precio"] = p if p is not None else "Sin tarifa"
    l["importe"] = round(l["uds"] * p, 2) if p is not None else 0.0
    l["mes"] = l["fecha"].month

df = pd.DataFrame(lineas)
total = round(float(df["importe"].sum()), 2)
controles = {
    "lineas_sin_tarifa": int((df["precio"] == "Sin tarifa").sum()),
    "importe_total": total,
    "importe_pablo": round(float(df.loc[df["comercial"] == "Pablo Gimeno", "importe"].sum()), 2),
    "importe_octubre": round(float(df.loc[df["mes"] == 10, "importe"].sum()), 2),
    "total_con_iva": round(total * 1.21, 2),
    "por_comercial": {k: round(float(v), 2) for k, v in df.groupby("comercial")["importe"].sum().items()},
    "por_mes": {int(k): round(float(v), 2) for k, v in df.groupby("mes")["importe"].sum().items()},
    "lineas_afectadas_espacio_tarifa": int(df["codigo"].isin(COD_ESP_TAR).sum()),
    "codigos_espacio_tarifa": COD_ESP_TAR,
    "lineas_espacio_pedido": len(IDX_ESP_PED),
}

INSTRUCCIONES = [
    ("Pedidos y tarifa · Electro Cierzo Suministros, S.L.", "titulo"),
    ("", None),
    ("Encargo de Andrés Molina (jefe de compras y almacén) y Javier Ortega (director comercial):", "neg"),
    ("«Aquí tienes las 120 líneas de pedido de septiembre a hoy y la tarifa. Ponle a cada línea su descripción, su precio y su importe, "
     "sin copiar nada a ojo. Luego quiero lo vendido por comercial y por mes. Y avísame de los productos que no tienen tarifa, que no se pierdan.»", None),
    ("", None),
    ("Pasos (intenta hacerlo en menos de 30 minutos):", "neg"),
    ("1. Hoja Tarifa: tres códigos tienen un espacio invisible al final. Selecciona la columna A, pulsa Ctrl+L (Reemplazar), "
     "escribe un espacio en «Buscar» y deja «Reemplazar con» vacío. Pulsa Reemplazar todos. (Los códigos no llevan espacios dentro, así que no rompes nada.)", None),
    ("2. Hoja Pedidos: algunos códigos de la columna E también llegan con un espacio al final. Esos no los toques: los limpiarás dentro de la fórmula con ESPACIOS.", None),
    ("3. En G2 (Descripción) trae la descripción de la tarifa. Que salga «Sin tarifa» si el código no está:", None),
    ("      =BUSCARX(ESPACIOS(E2);Tarifa!$A$2:$A$41;Tarifa!$B$2:$B$41;\"Sin tarifa\")", "codigo"),
    ("   Cópiala hasta la fila 121. (Con Excel 2019 o anterior: =SI.ND(BUSCARV(ESPACIOS(E2);Tarifa!$A$2:$C$41;2;FALSO);\"Sin tarifa\").)", None),
    ("4. En H2 (Precio) haz lo mismo, pero trayendo la columna C de la tarifa. Cópiala hasta la fila 121.", None),
    ("5. En I2 (Importe): unidades por precio, y 0 si no hay tarifa: =SI(H2=\"Sin tarifa\";0;F2*H2). Cópiala hasta la fila 121.", None),
    ("6. En J2 (Mes): =MES(B2). Cópiala hasta la fila 121.", None),
    ("7. Hoja Resumen: en B2:B6 suma el importe de cada comercial con SUMAR.SI (los nombres están en A2:A6). En E2:E4, el importe de cada mes (9, 10 y 11) con SUMAR.SI sobre la columna Mes. En B8, el total de todo.", None),
    ("8. En la hoja Resumen, selecciona B10 (el 21 % de IVA), escribe TipoIVA en el cuadro de nombres y pulsa Intro. En B11 calcula el total con IVA: =B8*(1+TipoIVA).", None),
    ("9. En B13, cuenta las líneas «Sin tarifa» de la hoja Pedidos con CONTAR.SI. Ese número es el aviso para Andrés.", None),
    ("", None),
    ("Comprueba tu trabajo:", "neg"),
    ("- La suma de B2:B6 (por comercial) debe ser igual a la suma de E2:E4 (por mes) y al total de B8. Si no cuadra, algo se ha quedado fuera.", None),
    ("- Si te salen más de 6 líneas «Sin tarifa», hay códigos con espacios sin limpiar (pasos 1 y 2).", None),
    ("- Responde en la guía a las preguntas de control.", None),
    ("", None),
    ("Qué entregar: este libro con las columnas G:J completas, la hoja Resumen y el nombre TipoIVA.", None),
]


def escribir(nombre, solucion):
    wb = xlsxwriter.Workbook(os.path.join(BASE, nombre))
    f_tit = wb.add_format({"bold": True, "font_size": 14})
    f_neg = wb.add_format({"bold": True})
    f_cod = wb.add_format({"font_name": "Consolas"})
    f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
    f_cab = wb.add_format({"bold": True, "bottom": 1, "bg_color": "#DDEBF7"})
    f_fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
    f_eur = wb.add_format({"num_format": "#,##0.00 €"})
    f_pct = wb.add_format({"num_format": "0%", "bg_color": "#FFF2CC"})
    f_eur_neg = wb.add_format({"num_format": "#,##0.00 €", "bold": True})

    ins = wb.add_worksheet("Instrucciones")
    ins.set_column("A:A", 125)
    for r, (t, est) in enumerate(INSTRUCCIONES):
        ins.write(r, 0, t, {"titulo": f_tit, "neg": f_neg, "codigo": f_cod}.get(est, f_txt))
    if solucion:
        ins.write(len(INSTRUCCIONES) + 1, 0, "SOLUCIÓN: la tarifa ya está limpia; las columnas G:J de Pedidos tienen las fórmulas, "
                  "y la hoja Resumen, los totales, el nombre TipoIVA y la comprobación.", f_neg)

    # ---------- Pedidos ----------
    ws = wb.add_worksheet("Pedidos")
    cab = ["Pedido", "Fecha", "Comercial", "Cliente", "Código", "Uds", "Descripción", "Precio", "Importe", "Mes"]
    for c, w in enumerate([13, 12, 16, 30, 10, 7, 30, 11, 12, 6]):
        ws.set_column(c, c, w)
    for c, t in enumerate(cab):
        ws.write(0, c, t, f_cab)
    for r, l in enumerate(lineas, start=1):
        cod = l["codigo"] + (" " if (r - 1) in IDX_ESP_PED else "")
        ws.write(r, 0, l["pedido"])
        ws.write_datetime(r, 1, pd.Timestamp(l["fecha"]).to_pydatetime(), f_fecha)
        ws.write(r, 2, l["comercial"]); ws.write(r, 3, l["cliente"]); ws.write_string(r, 4, cod)
        ws.write_number(r, 5, l["uds"])
        if solucion:
            n = r + 1
            ws.write_formula(r, 6, f'=_xlfn.XLOOKUP(TRIM(E{n}),Tarifa!$A$2:$A$41,Tarifa!$B$2:$B$41,"Sin tarifa")', None, l["descripcion"])
            ws.write_formula(r, 7, f'=_xlfn.XLOOKUP(TRIM(E{n}),Tarifa!$A$2:$A$41,Tarifa!$C$2:$C$41,"Sin tarifa")', f_eur, l["precio"])
            ws.write_formula(r, 8, f'=IF(H{n}="Sin tarifa",0,F{n}*H{n})', f_eur, l["importe"])
            ws.write_formula(r, 9, f'=MONTH(B{n})', None, l["mes"])
    ws.freeze_panes(1, 0)
    ws.autofilter(0, 0, len(lineas), len(cab) - 1)

    # ---------- Tarifa ----------
    ta = wb.add_worksheet("Tarifa")
    ta.set_column(0, 0, 11); ta.set_column(1, 1, 32); ta.set_column(2, 2, 11)
    for c, t in enumerate(["Código", "Descripción", "Precio"]):
        ta.write(0, c, t, f_cab)
    for r, (c, d, p) in enumerate(TARIFA, start=1):
        ta.write_string(r, 0, c + (" " if (c in COD_ESP_TAR and not solucion) else ""))
        ta.write(r, 1, d); ta.write_number(r, 2, p, f_eur)
    ta.freeze_panes(1, 0)

    # ---------- Resumen ----------
    re_ = wb.add_worksheet("Resumen")
    re_.set_column(0, 0, 30); re_.set_column(1, 1, 15); re_.set_column(3, 3, 8); re_.set_column(4, 4, 15)
    re_.write(0, 0, "Comercial", f_cab); re_.write(0, 1, "Importe", f_cab)
    re_.write(0, 3, "Mes", f_cab); re_.write(0, 4, "Importe", f_cab)
    for r, c in enumerate(COMERCIALES, start=1):
        re_.write(r, 0, c)
        if solucion:
            re_.write_formula(r, 1, f"=SUMIF(Pedidos!$C$2:$C$121,A{r + 1},Pedidos!$I$2:$I$121)", f_eur, controles["por_comercial"][c])
    for r, m in enumerate([9, 10, 11], start=1):
        re_.write_number(r, 3, m)
        if solucion:
            re_.write_formula(r, 4, f"=SUMIF(Pedidos!$J$2:$J$121,D{r + 1},Pedidos!$I$2:$I$121)", f_eur, controles["por_mes"][m])
    re_.write(7, 0, "Total vendido (sin IVA)", f_neg)
    re_.write(9, 0, "Tipo de IVA")
    re_.write_number(9, 1, 0.21, f_pct)
    re_.write(10, 0, "Total con IVA", f_neg)
    re_.write(12, 0, "Líneas sin tarifa (avisar a Andrés)", f_neg)
    if solucion:
        wb.define_name("TipoIVA", "=Resumen!$B$10")
        re_.write_formula(7, 1, "=SUM(Pedidos!$I$2:$I$121)", f_eur_neg, total)
        re_.write_formula(10, 1, "=B8*(1+TipoIVA)", f_eur_neg, controles["total_con_iva"])
        re_.write_formula(12, 1, '=COUNTIF(Pedidos!$H$2:$H$121,"Sin tarifa")', None, controles["lineas_sin_tarifa"])
        re_.write(14, 0, "Comprobación: comerciales = meses = total")
        re_.write_formula(14, 1, '=IF(AND(ROUND(SUM(B2:B6)-B8,2)=0,ROUND(SUM(E2:E4)-B8,2)=0),"Cuadra","NO CUADRA")', None, "Cuadra")
    wb.close()


escribir("n2-pedidos-y-tarifa.xlsx", False)
escribir("n2-pedidos-y-tarifa-solucion.xlsx", True)
json.dump({"titulo": "N2 · Pedidos y tarifa (datos de partida)",
           "descripcion": "Ciento veinte líneas de pedido y una tarifa de 40 productos, con códigos con espacios y productos sin tarifa, para cruzar con BUSCARX y resumir por comercial y por mes.",
           "nivel": "n2"}, open(os.path.join(BASE, "n2-pedidos-y-tarifa.meta.json"), "w"), ensure_ascii=False, indent=2)
json.dump({"titulo": "N2 · Pedidos y tarifa (solución)",
           "descripcion": "Las líneas de pedido con descripción, precio e importe traídos de la tarifa, el resumen por comercial y por mes, el nombre TipoIVA y la comprobación.",
           "nivel": "n2"}, open(os.path.join(BASE, "n2-pedidos-y-tarifa-solucion.meta.json"), "w"), ensure_ascii=False, indent=2)
print(json.dumps(controles, ensure_ascii=False, indent=1))

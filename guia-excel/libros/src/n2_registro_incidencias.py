#!/usr/bin/env python3
"""Genera libros/n2-registro-incidencias.xlsx (datos de partida) y n2-registro-incidencias-solucion.xlsx.

Práctica del módulo n2m1 (Tablas, validación de datos, formato condicional).
Registro de 60 incidencias de clientes de Electro Cierzo Suministros, S.L.

Suciedad sembrada a propósito (documentada aquí, no en el libro de la alumna):
- Categoría: 16 filas con variantes mal escritas (espacio al final, faltas, abreviaturas).
- Estado: 3 filas con variantes («Cerrado», «Cerrada » con espacio, «En proceso» = En curso).
No hay variantes que solo cambien mayúsculas (la validación de datos no las distinguiría con seguridad).

Reglas del encargo:
- Días abiertos = Fecha cierre − Fecha apertura si la incidencia está Cerrada;
  si no, Fecha de corte (16/11/2026, celda L1) − Fecha apertura.
- Se resaltan las incidencias con Días abiertos > 10.
Los totales de control se calculan con pandas a partir de los datos limpios y se imprimen en JSON.
"""
import json
import os
import random
from datetime import date, timedelta

import pandas as pd
import xlsxwriter

random.seed(20261116)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORTE = date(2026, 11, 16)

CATEGORIAS = ["Retraso en entrega", "Material defectuoso", "Error en factura", "Pedido incompleto"]
ESTADOS = ["Abierta", "En curso", "Cerrada"]
VARIANTES_CAT = {
    "Retraso en entrega": ["Retraso entrega", "Retraso en entrega ", "Retraso en entrga", "Retraso"],
    "Material defectuoso": ["Material defectuso", "Mat. defectuoso", "Material defectuoso ", "Defectuoso"],
    "Error en factura": ["Error factura", "Error en la factura", "Error en factura "],
    "Pedido incompleto": ["Pedido incompleto.", "Ped. incompleto", "Pedido incompleto ", "Incompleto"],
}
CLIENTES = [
    "Instalaciones Ebro, S.L.", "Electricidad Hnos. Lacasa", "Montajes Delicias, S.L.", "Climatización Moncayo, S.L.",
    "Reformas Actur, S.L.", "Electro Txantrea, S.L.", "Instal·lacions Segrià, S.L.", "Iluminaciones Ribera, S.A.",
    "Mantenimientos Cinca, S.L.", "Construcciones Valdespartera", "Electricidad Arga, S.L.", "Montajes Noguera, S.L.",
]
DELEG = ["Zaragoza"] * 5 + ["Pamplona"] * 3 + ["Lleida"] * 2

filas = []
inicio = date(2026, 9, 21)
for i in range(60):
    apertura = inicio + timedelta(days=random.randint(0, 53))  # hasta el 13/11/2026
    filas.append({"apertura": apertura})
filas.sort(key=lambda f: f["apertura"])
for i, f in enumerate(filas):
    f["num"] = f"INC-26-{301 + i:04d}"
    f["delegacion"] = random.choice(DELEG)
    f["cliente"] = random.choice(CLIENTES)
    f["categoria"] = random.choices(CATEGORIAS, weights=[4, 3, 2, 3])[0]
    antig = (CORTE - f["apertura"]).days
    p_cerrada = 0.85 if antig > 25 else (0.5 if antig > 10 else 0.2)
    if random.random() < p_cerrada:
        f["estado"] = "Cerrada"
        dur = random.randint(1, 16)
        cierre = f["apertura"] + timedelta(days=dur)
        if cierre > CORTE:
            cierre = CORTE
        f["cierre"] = cierre
    else:
        f["estado"] = random.choice(["Abierta", "En curso"])
        f["cierre"] = None
    f["importe"] = round(random.uniform(40, 2500), 2)

# Suciedad: 16 categorías y 3 estados mal escritos (posiciones fijas por la semilla)
idx_cat = random.sample(range(60), 16)
for i in idx_cat:
    f = filas[i]
    f["categoria_sucia"] = random.choice(VARIANTES_CAT[f["categoria"]])
cerradas = [i for i, f in enumerate(filas) if f["estado"] == "Cerrada"]
en_curso = [i for i, f in enumerate(filas) if f["estado"] == "En curso"]
idx_est = {cerradas[3]: "Cerrado", cerradas[17]: "Cerrada ", en_curso[1]: "En proceso"}
for i, v in idx_est.items():
    filas[i]["estado_sucio"] = v

for f in filas:
    fin = f["cierre"] if f["estado"] == "Cerrada" else CORTE
    f["dias"] = (fin - f["apertura"]).days

# ---------- Totales de control (datos limpios) ----------
df = pd.DataFrame(filas)
controles = {
    "material_defectuoso": int((df["categoria"] == "Material defectuoso").sum()),
    "no_cerradas": int((df["estado"] != "Cerrada").sum()),
    "importe_total": round(float(df["importe"].sum()), 2),
    "suma_dias": int(df["dias"].sum()),
    "mas_de_10_dias": int((df["dias"] > 10).sum()),
    "importe_error_factura": round(float(df.loc[df["categoria"] == "Error en factura", "importe"].sum()), 2),
    "no_cerradas_mas_10": int(((df["dias"] > 10) & (df["estado"] != "Cerrada")).sum()),
    "por_categoria": df["categoria"].value_counts().to_dict(),
    "por_estado": df["estado"].value_counts().to_dict(),
    "celdas_sucias": len(idx_cat) + len(idx_est),
}

INSTRUCCIONES = [
    ("Registro de incidencias de clientes · Electro Cierzo Suministros, S.L.", "titulo"),
    ("", None),
    ("Encargo de Andrés Molina (jefe de compras y almacén):", "neg"),
    ("«Este registro lo rellenamos entre todos y es un caos: cada uno escribe la categoría a su manera. "
     "Déjamelo ordenado, que nadie pueda escribir lo que no debe y que salten a la vista las incidencias que llevan demasiado tiempo.»", None),
    ("", None),
    ("Pasos (intenta hacerlo en menos de 25 minutos):", "neg"),
    ("1. En la hoja Incidencias, haz clic en A1 y convierte la lista en Tabla (Ctrl+T). Ponle de nombre Incidencias (Diseño de tabla › Nombre de la tabla).", None),
    ("2. Crea dos listas desplegables con Datos › Validación de datos › Permitir: Lista: en la columna Categoría, con origen =Listas!$A$2:$A$5, y en la columna Estado, con origen =Listas!$C$2:$C$4. Estilo del mensaje de error: Detener, con un mensaje que ayude.", None),
    ("3. Busca los datos mal escritos: flecha de Datos › Validación de datos › Rodear con un círculo datos no válidos. Corrige cada celda marcada eligiendo el valor correcto del desplegable. («En proceso» significa En curso.)", None),
    ("4. Añade la columna calculada Días abiertos: escribe el título en I1 y en I2 esta fórmula (la Tabla la copiará sola):", None),
    ("      =SI([@Estado]=\"Cerrada\";[@[Fecha cierre]]-[@[Fecha apertura]];$L$1-[@[Fecha apertura]])", "codigo"),
    ("   Restar dos fechas da los días que hay entre ellas (lo verás a fondo en el módulo de fechas). L1 es la fecha de corte, 16/11/2026. Si el resultado sale con aspecto de fecha, ponle formato Número sin decimales.", None),
    ("5. Activa la Fila de totales: Suma en Importe afectado y Suma en Días abiertos.", None),
    ("6. Selecciona los datos de Días abiertos y aplica Inicio › Formato condicional › Reglas para resaltar celdas › Mayor que 10, con relleno rojo claro.", None),
    ("", None),
    ("Comprueba tu trabajo con estos totales de control:", "neg"),
    ("- Antes de corregir, Rodear con un círculo datos no válidos debe marcar 19 celdas.", None),
    ("- Sin filtros, la fila de totales debe sumar el importe de todas las incidencias. Después filtra la Categoría «Error en factura»: el total cambia, porque la fila de totales solo suma lo que se ve.", None),
    ("- Responde en la guía a las preguntas de control (número de incidencias por categoría, no cerradas, importes y días).", None),
    ("", None),
    ("Qué entregar: este libro guardado con la Tabla, los desplegables, la columna Días abiertos, la fila de totales y el formato condicional.", None),
]


def escribir(nombre, solucion):
    wb = xlsxwriter.Workbook(os.path.join(BASE, nombre))
    f_tit = wb.add_format({"bold": True, "font_size": 14})
    f_neg = wb.add_format({"bold": True})
    f_cod = wb.add_format({"font_name": "Consolas"})
    f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
    f_cab = wb.add_format({"bold": True, "bottom": 1})
    f_fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
    f_eur = wb.add_format({"num_format": "#,##0.00 €"})
    f_num = wb.add_format({"num_format": "0"})
    f_rojo = wb.add_format({"bg_color": "#FFC7CE", "font_color": "#9C0006"})

    ins = wb.add_worksheet("Instrucciones")
    ins.set_column("A:A", 120)
    for r, (t, est) in enumerate(INSTRUCCIONES):
        fmt = {"titulo": f_tit, "neg": f_neg, "codigo": f_cod}.get(est, f_txt)
        ins.write(r, 0, t, fmt)
    if solucion:
        ins.write(len(INSTRUCCIONES) + 1, 0, "SOLUCIÓN: la hoja Incidencias ya está limpia, en Tabla, con desplegables, columna calculada, fila de totales y formato condicional. La hoja Control resume los totales.", f_neg)

    ws = wb.add_worksheet("Incidencias")
    cab = ["Nº", "Fecha apertura", "Delegación", "Cliente", "Categoría", "Estado", "Fecha cierre", "Importe afectado"]
    anchos = [12, 15, 12, 30, 22, 11, 13, 17]
    for c, w in enumerate(anchos):
        ws.set_column(c, c, w)
    ws.set_column(8, 8, 14)
    ws.set_column(10, 10, 15)
    ws.set_column(11, 11, 12)
    ws.write(0, 10, "Fecha de corte", f_neg)
    ws.write_datetime(0, 11, pd.Timestamp(CORTE).to_pydatetime(), f_fecha)

    datos = []
    for f in filas:
        cat = f["categoria"] if solucion else f.get("categoria_sucia", f["categoria"])
        est = f["estado"] if solucion else f.get("estado_sucio", f["estado"])
        datos.append([f["num"], f["apertura"], f["delegacion"], f["cliente"], cat, est, f["cierre"], f["importe"]])

    if not solucion:
        for c, t in enumerate(cab):
            ws.write(0, c, t, f_cab)
        for r, fila in enumerate(datos, start=1):
            ws.write(r, 0, fila[0])
            ws.write_datetime(r, 1, pd.Timestamp(fila[1]).to_pydatetime(), f_fecha)
            ws.write(r, 2, fila[2]); ws.write(r, 3, fila[3]); ws.write(r, 4, fila[4]); ws.write(r, 5, fila[5])
            if fila[6] is not None:
                ws.write_datetime(r, 6, pd.Timestamp(fila[6]).to_pydatetime(), f_fecha)
            ws.write_number(r, 7, fila[7], f_eur)
    else:
        n = len(datos)
        columnas = [{"header": cab[0], "total_string": "Total"}]
        for t in cab[1:7]:
            columnas.append({"header": t})
        columnas[1]["format"] = f_fecha
        columnas[6]["format"] = f_fecha
        columnas.append({"header": cab[7], "format": f_eur, "total_function": "sum"})
        columnas.append({"header": "Días abiertos", "format": f_num, "total_function": "sum",
                         "formula": '=IF([@Estado]="Cerrada",[@[Fecha cierre]]-[@[Fecha apertura]],$L$1-[@[Fecha apertura]])'})
        tabla_datos = []
        for fila in datos:
            tabla_datos.append([fila[0], pd.Timestamp(fila[1]).to_pydatetime(), fila[2], fila[3], fila[4], fila[5],
                                pd.Timestamp(fila[6]).to_pydatetime() if fila[6] is not None else None, fila[7]])
        ws.add_table(0, 0, n + 1, 8, {"name": "Incidencias", "columns": columnas, "data": tabla_datos,
                                      "total_row": True, "style": "Table Style Medium 2"})
        msg = {"error_type": "stop", "error_title": "Valor no válido", "input_title": "Elige de la lista"}
        ws.data_validation(1, 4, n, 4, {"validate": "list", "source": "=Listas!$A$2:$A$5",
                                        "input_message": "Elige la categoría en la flecha.",
                                        "error_message": "Elige una categoría de la lista: Retraso en entrega, Material defectuoso, Error en factura o Pedido incompleto.", **msg})
        ws.data_validation(1, 5, n, 5, {"validate": "list", "source": "=Listas!$C$2:$C$4",
                                        "input_message": "Elige el estado en la flecha.",
                                        "error_message": "Elige Abierta, En curso o Cerrada.", **msg})
        ws.conditional_format(1, 8, n, 8, {"type": "cell", "criteria": ">", "value": 10, "format": f_rojo})
    ws.freeze_panes(1, 0)

    li = wb.add_worksheet("Listas")
    li.set_column(0, 0, 22); li.set_column(2, 2, 12)
    li.write(0, 0, "Categoría", f_cab); li.write(0, 2, "Estado", f_cab)
    for r, c in enumerate(CATEGORIAS, start=1):
        li.write(r, 0, c)
    for r, e in enumerate(ESTADOS, start=1):
        li.write(r, 2, e)

    if solucion:
        co = wb.add_worksheet("Control")
        co.set_column(0, 0, 58); co.set_column(1, 1, 16)
        filas_c = [
            ("Incidencias de Material defectuoso", "=COUNTIFS(Incidencias[Categoría],\"Material defectuoso\")", None),
            ("Incidencias no cerradas", "=COUNTIFS(Incidencias[Estado],\"<>Cerrada\")", None),
            ("Importe afectado total (€)", "=SUM(Incidencias[Importe afectado])", f_eur),
            ("Suma de Días abiertos", "=SUM(Incidencias[Días abiertos])", None),
            ("Incidencias con más de 10 días abiertos", "=COUNTIFS(Incidencias[Días abiertos],\">10\")", None),
            ("Importe de Error en factura (€)", "=SUMIFS(Incidencias[Importe afectado],Incidencias[Categoría],\"Error en factura\")", f_eur),
            ("No cerradas con más de 10 días", "=COUNTIFS(Incidencias[Días abiertos],\">10\",Incidencias[Estado],\"<>Cerrada\")", None),
        ]
        co.write(0, 0, "Comprobación", f_cab); co.write(0, 1, "Valor", f_cab)
        for r, (t, fo, fm) in enumerate(filas_c, start=1):
            co.write(r, 0, t)
            co.write_formula(r, 1, fo, fm)
    wb.close()


escribir("n2-registro-incidencias.xlsx", False)
escribir("n2-registro-incidencias-solucion.xlsx", True)
json.dump({"titulo": "N2 · Registro de incidencias de clientes (datos de partida)",
           "descripcion": "Sesenta incidencias de clientes con categorías y estados mal escritos, para convertir en Tabla, poner desplegables y resaltar las que llevan más de 10 días.",
           "nivel": "n2"}, open(os.path.join(BASE, "n2-registro-incidencias.meta.json"), "w"), ensure_ascii=False, indent=2)
json.dump({"titulo": "N2 · Registro de incidencias de clientes (solución)",
           "descripcion": "El registro limpio, en la Tabla Incidencias, con desplegables, columna Días abiertos, fila de totales, formato condicional y hoja de control.",
           "nivel": "n2"}, open(os.path.join(BASE, "n2-registro-incidencias-solucion.meta.json"), "w"), ensure_ascii=False, indent=2)
print(json.dumps(controles, ensure_ascii=False, indent=1))

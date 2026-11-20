#!/usr/bin/env python3
"""Genera la práctica del módulo n4m1 (Power Query):

- libros/n4-ventas-mensuales.zip  -> carpeta n4-ventas-mensuales/ con
      ERP/ventas_2026_05.csv ... ventas_2026_10.csv  (exportaciones mensuales del ERP)
      n4-maestro-productos.xlsx                      (Instrucciones + Tabla «Productos»)
- libros/n4-maestro-productos.xlsx (el mismo libro, suelto)
- libros/n4-ventas-mensuales-solucion.xlsx (tabla final, resúmenes con fórmulas y controles)

Formato de los CSV (como el ERP de Electro Cierzo): separador «;», coma decimal, UTF-8 con BOM,
fechas dd/mm/aaaa y una línea final «TOTAL» (Albaran = TOTAL, Fecha vacía) con las sumas.

Suciedad sembrada a propósito (documentada aquí, no en el libro de la alumna):
- ventas_2026_08.csv se exportó desde un portátil con Windows en inglés:
    * fechas en formato de EE. UU. (mm/dd/aaaa): con la configuración de España salen meses
      equivocados (día <= 12) o Error (día > 12);
    * una columna de más al final, «Observaciones».
  Solución: sacar ese archivo de la consulta de carpeta (filtro por nombre), importarlo aparte con
  De texto/CSV, tipo Fecha con configuración regional Inglés (Estados Unidos), quitar Observaciones
  y Anexar consultas.
- Todas las exportaciones acaban con una fila TOTAL: hay que filtrarla (Albaran <> "TOTAL").
- Maestro de productos: MAG-216 está dos veces (fila duplicada): si no se quitan duplicados,
  las ventas de MAG-216 se duplican al combinar.
- LED-PAN60 (panel LED 60x60, se vende desde septiembre) no está en el maestro: con Externa
  izquierda queda sin familia; con Anti izquierda aparece en la lista de lo que falta.
Los totales de control se calculan con pandas desde los datos limpios y se imprimen en JSON.
"""
import csv
import io
import json
import os
import random
import zipfile
from datetime import date

import pandas as pd
import xlsxwriter

random.seed(20261119)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # libros/

PRODUCTOS = [  # código, descripción, familia, precio tarifa, (uds mín, uds máx)
    ("CAB-15", "Cable 1,5 mm² (rollo 100 m)", "Cableado", 32.50, (2, 12)),
    ("CAB-25", "Cable 2,5 mm² (rollo 100 m)", "Cableado", 49.90, (2, 12)),
    ("CAB-40", "Cable 4 mm² (rollo 100 m)", "Cableado", 78.40, (1, 6)),
    ("MAN-3G25", "Manguera 3G2,5 (rollo 100 m)", "Cableado", 139.00, (1, 4)),
    ("CAN-25", "Canaleta 25×16 (2 m)", "Canalización", 2.90, (10, 80)),
    ("CAN-40", "Canaleta 40×25 (2 m)", "Canalización", 4.80, (10, 60)),
    ("TUB-16", "Tubo corrugado 16 mm (100 m)", "Canalización", 15.40, (2, 15)),
    ("TUB-20", "Tubo corrugado 20 mm (100 m)", "Canalización", 19.80, (2, 15)),
    ("BRI-200", "Bridas 200 mm (bolsa de 100)", "Canalización", 3.10, (5, 40)),
    ("INT-SIM", "Interruptor simple", "Mecanismos", 4.60, (10, 60)),
    ("ENC-SCH", "Base de enchufe schuko", "Mecanismos", 5.20, (10, 80)),
    ("CON-CRU", "Conmutador de cruce", "Mecanismos", 9.75, (4, 30)),
    ("LED-DL18", "Downlight LED 18 W", "Iluminación", 14.90, (6, 40)),
    ("LED-PRO36", "Proyector LED 36 W", "Iluminación", 27.50, (2, 16)),
    ("LED-TUB18", "Tubo LED T8 18 W", "Iluminación", 4.95, (10, 60)),
    ("MAG-216", "Magnetotérmico 2P 16 A", "Protección", 9.80, (4, 24)),
    ("MAG-225", "Magnetotérmico 2P 25 A", "Protección", 10.90, (4, 20)),
    ("DIF-240", "Diferencial 2P 40 A 30 mA", "Protección", 38.50, (1, 8)),
]
NUEVO = ("LED-PAN60", "Panel LED 60×60 40 W", "Iluminación", 32.00, (4, 20))  # no está en el maestro

CLIENTES = [
    ("Instalaciones Ebro Norte, S.L.", "Zaragoza"), ("Electricidad Moncayo, S.L.", "Zaragoza"),
    ("Reformas Delicias, S.L.", "Zaragoza"), ("Climatización Romareda, S.L.", "Zaragoza"),
    ("Tecnoluz Huesca, S.L.", "Zaragoza"), ("Montajes Arga, S.L.", "Pamplona"),
    ("Electro Bardenas, S.L.", "Pamplona"), ("Electricidad Txantrea, S.L.", "Pamplona"),
    ("Instalaciones Pirineo Sur, S.L.", "Pamplona"), ("Instalaciones Segre 2010, S.L.", "Lleida"),
    ("Montajes Eléctricos Cinca, S.L.", "Lleida"), ("Instal·lacions Noguera, S.L.", "Lleida"),
]
MESES = [5, 6, 7, 8, 9, 10]
OBS = ["Entrega en obra", "Recoge el cliente", "Urgente", "Portes pagados"]


def dias_laborables(mes):
    d = []
    for dia in range(1, 32):
        try:
            f = date(2026, mes, dia)
        except ValueError:
            break
        if f.weekday() < 5:
            d.append(f)
    return d


def num_es(x):
    return f"{x:.2f}".replace(".", ",")


filas = []  # datos limpios
albaran = 26000
csvs = {}
for mes in MESES:
    n = random.randint(42, 58)
    dias = dias_laborables(mes)
    lineas = []
    for _ in range(n):
        f = random.choice(dias)
        cli, dele = random.choice(CLIENTES)
        catalogo = PRODUCTOS + ([NUEVO] * 2 if mes >= 9 else [])
        cod, desc, fam, precio, (a, b) = random.choice(catalogo)
        uds = random.randint(a, b)
        dto = random.choice([0, 0, 0.05, 0.08, 0.10])
        imp = round(uds * precio * (1 - dto) + 1e-9, 2)
        lineas.append([f, cli, dele, cod, uds, imp])
    lineas.sort(key=lambda r: r[0])
    out = io.StringIO()
    w = csv.writer(out, delimiter=";", lineterminator="\r\n")
    cab = ["Fecha", "Albaran", "Cliente", "Delegacion", "CodProducto", "Unidades", "ImporteNeto"]
    if mes == 8:
        cab.append("Observaciones")
    w.writerow(cab)
    for f, cli, dele, cod, uds, imp in lineas:
        albaran += 1
        alb = f"A26-{albaran:05d}"
        if mes == 8:
            fila = [f.strftime("%m/%d/%Y"), alb, cli, dele, cod, uds, num_es(imp),
                    random.choice(OBS) if random.random() < 0.25 else ""]
        else:
            fila = [f.strftime("%d/%m/%Y"), alb, cli, dele, cod, uds, num_es(imp)]
        w.writerow(fila)
        filas.append({"Fecha": pd.Timestamp(f), "Albaran": alb, "Cliente": cli, "Delegacion": dele,
                      "CodProducto": cod, "Unidades": uds, "ImporteNeto": imp,
                      "Archivo": f"ventas_2026_{mes:02d}.csv"})
    tot_u = sum(r[4] for r in lineas)
    tot_i = round(sum(r[5] for r in lineas), 2)
    total = ["", "TOTAL", "", "", "", tot_u, num_es(tot_i)] + ([""] if mes == 8 else [])
    w.writerow(total)
    csvs[f"ventas_2026_{mes:02d}.csv"] = "﻿" + out.getvalue()

df = pd.DataFrame(filas)
assert df[df.Archivo == "ventas_2026_08.csv"].Fecha.dt.day.gt(12).sum() >= 10

# Maestro (con MAG-216 duplicado; sin LED-PAN60)
maestro = [(c, d, f, p) for c, d, f, p, _ in PRODUCTOS]
i = [m[0] for m in maestro].index("MAG-216")
maestro_sucio = maestro[:]
maestro_sucio.insert(len(maestro_sucio) - 1, maestro[i])
mdf = pd.DataFrame(maestro, columns=["CodProducto", "Descripcion", "Familia", "PrecioTarifa"])

final = df.merge(mdf, on="CodProducto", how="left")
final["Mes"] = final.Fecha.dt.month
assert len(final) == len(df)

controles = {
    "lineas": int(len(final)),
    "importe_total": round(float(final.ImporteNeto.sum()), 2),
    "importe_agosto": round(float(final[final.Mes == 8].ImporteNeto.sum()), 2),
    "importe_iluminacion": round(float(final[final.Familia == "Iluminación"].ImporteNeto.sum()), 2),
    "importe_sin_familia": round(float(final[final.Familia.isna()].ImporteNeto.sum()), 2),
    "lineas_sin_familia": int(final.Familia.isna().sum()),
    "pamplona_octubre": round(float(final[(final.Delegacion == "Pamplona") & (final.Mes == 10)].ImporteNeto.sum()), 2),
    "lineas_por_archivo": df.groupby("Archivo").size().to_dict(),
    "lineas_mag216": int((final.CodProducto == "MAG-216").sum()),
}
# Lo que saldría con errores típicos (para las pistas)
dup = df.merge(pd.DataFrame(maestro_sucio, columns=mdf.columns), on="CodProducto", how="left")
controles["lineas_si_no_quita_duplicados"] = int(len(dup))
controles["importe_si_no_quita_duplicados"] = round(float(dup.ImporteNeto.sum()), 2)

# ---------- Libro de la alumna: maestro + instrucciones ----------
def libro_maestro(ruta):
    wb = xlsxwriter.Workbook(ruta)
    tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E79"})
    neg = wb.add_format({"bold": True})
    txt = wb.add_format({"text_wrap": True, "valign": "top"})
    eur = wb.add_format({"num_format": "#,##0.00 €"})
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 110)
    lineas = [
        ("Práctica N4 · El informe de ventas que se hace solo (Power Query)", tit),
        ("Encargo de Javier Ortega (director comercial): «Quiero las ventas de mayo a octubre en una sola tabla, con la familia de cada producto, y una tabla dinámica por delegación y mes. El mes que viene solo quiero dejar el CSV nuevo en la carpeta y pulsar un botón.»", txt),
        ("Qué tienes", neg),
        ("- Carpeta ERP: seis CSV, uno por mes (ventas_2026_05.csv a ventas_2026_10.csv). Separador punto y coma, coma decimal y una última fila TOTAL que pone el ERP.", txt),
        ("- Este libro: la hoja Productos con la Tabla «Productos» (el maestro: código, descripción, familia y precio).", txt),
        ("Pasos", neg),
        ("1. Guarda este libro con otro nombre (por ejemplo, Informe_ventas_2026.xlsx) en la carpeta n4-ventas-mensuales. Trabaja siempre en él.", txt),
        ("2. Datos › Obtener datos › Del archivo › De la carpeta › elige la carpeta ERP › Combinar › Combinar y transformar datos.", txt),
        ("3. Revisa cada archivo antes de fiarte: abre los CSV con el Bloc de notas. ¿Tienen todos las mismas columnas y el mismo formato de fecha? El que sea distinto, sácalo de la consulta de carpeta (filtra por el nombre del archivo) e impórtalo aparte con Datos › De texto/CSV, con el tipo que le corresponda (Usar configuración regional). Después únelo con Inicio › Anexar consultas.", txt),
        ("4. Limpia: quita las filas TOTAL, comprueba el tipo de cada columna (Fecha = Fecha; Unidades = número entero; ImporteNeto = número decimal; códigos = Texto) y quita las columnas que no sirvan.", txt),
        ("5. Maestro: haz clic dentro de la Tabla Productos › Datos › De una tabla o rango. Antes de usarlo, comprueba que cada código aparece una sola vez (Inicio › Quitar filas › Quitar duplicados sobre CodProducto). Cárgalo con Cerrar y cargar en… › Solo crear conexión.", txt),
        ("6. En la consulta de ventas: Inicio › Combinar consultas con Productos por CodProducto, tipo Externa izquierda. Expande y marca Descripcion y Familia. Haz también una consulta aparte con Anti izquierda para ver qué códigos vendidos no están en el maestro.", txt),
        ("7. Cierra y carga las ventas en una Tabla. Con ella, crea una tabla dinámica: Delegacion en filas, Fecha (agrupada por meses) en columnas e ImporteNeto en valores.", txt),
        ("Cómo comprobar (totales de control)", neg),
        ("La guía te pedirá: número de líneas de la tabla final, importe neto total, importe de agosto, importe de la familia Iluminación, importe de las líneas sin familia e importe de Pamplona en octubre. Si alguno no cuadra, vuelve al paso que lo produce: agosto (fechas), duplicados del maestro (líneas de más) o filas TOTAL (importe doble).", txt),
        ("Para el mes que viene: deja el CSV de noviembre en la carpeta ERP y pulsa Datos › Actualizar todo (Ctrl+Alt+F5). Intenta hacer toda la práctica en menos de 45 minutos.", txt),
    ]
    for r, (t, f) in enumerate(lineas):
        ws.write(r, 0, t, f)
    wp = wb.add_worksheet("Productos")
    datos = [list(m) for m in maestro_sucio]
    wp.add_table(0, 0, len(datos), 3, {"name": "Productos", "style": "Table Style Medium 2",
                 "columns": [{"header": "CodProducto"}, {"header": "Descripcion"},
                             {"header": "Familia"}, {"header": "PrecioTarifa", "format": eur}],
                 "data": datos})
    wp.set_column("A:A", 13); wp.set_column("B:B", 32); wp.set_column("C:C", 14); wp.set_column("D:D", 13)
    wb.close()


ruta_maestro = os.path.join(BASE, "n4-maestro-productos.xlsx")
libro_maestro(ruta_maestro)

zpath = os.path.join(BASE, "n4-ventas-mensuales.zip")
with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
    for nombre, contenido in csvs.items():
        z.writestr(f"n4-ventas-mensuales/ERP/{nombre}", contenido.encode("utf-8"))
    z.write(ruta_maestro, "n4-ventas-mensuales/n4-maestro-productos.xlsx")

# ---------- Solución ----------
sol = os.path.join(BASE, "n4-ventas-mensuales-solucion.xlsx")
wb = xlsxwriter.Workbook(sol)
tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E79"})
neg = wb.add_format({"bold": True})
txt = wb.add_format({"text_wrap": True, "valign": "top"})
eur = wb.add_format({"num_format": "#,##0.00 €"})
fec = wb.add_format({"num_format": "dd/mm/yyyy"})
ok = wb.add_format({"bold": True, "font_color": "#006100", "bg_color": "#C6EFCE"})

ws = wb.add_worksheet("Solución")
ws.set_column("A:A", 115)
pasos = [
    ("Solución de la práctica N4 · Power Query", tit),
    ("Consultas (lo que se ve en el panel Consultas y conexiones):", neg),
    ("1. Ventas_carpeta: Datos › Obtener datos › Del archivo › De la carpeta › ERP › Combinar y transformar datos (archivo de ejemplo: el primero, mayo). Primer paso añadido: filtro en Name para excluir ventas_2026_08.csv. Filtro Albaran distinto de TOTAL. Tipos: Fecha = Fecha, Unidades = Número entero, ImporteNeto = Número decimal, el resto Texto.", txt),
    ("2. Ventas_agosto: Datos › De texto/CSV › ventas_2026_08.csv › Transformar datos. Quitar la columna Observaciones. Filtro Albaran distinto de TOTAL. Fecha: icono de tipo › Usar configuración regional › Fecha + Inglés (Estados Unidos), reemplazando el paso de tipo automático. Cerrar y cargar en… › Solo crear conexión.", txt),
    ("3. Ventas_carpeta › Inicio › Anexar consultas › Ventas_agosto. Se emparejan por nombre de columna; como Observaciones se quitó, no aparecen columnas a medias.", txt),
    ("4. Productos: De una tabla o rango › seleccionar CodProducto › Inicio › Quitar filas › Quitar duplicados (MAG-216 estaba dos veces) › Cerrar y cargar en… › Solo crear conexión.", txt),
    ("5. Ventas_carpeta › Inicio › Combinar consultas › Productos, CodProducto con CodProducto, Externa izquierda › expandir Descripcion y Familia. Cerrar y cargar en una Tabla (hoja Ventas de este libro).", txt),
    ("6. Sin_maestro: Combinar consultas como nuevas › Ventas × Productos con Anti izquierda: sale solo LED-PAN60 (panel LED 60×60, se vende desde septiembre). Avisar a Andrés para darlo de alta con su familia (Iluminación).", txt),
    ("7. Tabla dinámica: Delegacion en filas, Fecha agrupada por meses en columnas, Suma de ImporteNeto. La hoja Resumen reproduce esos números con SUMAR.SI.CONJUNTO para poder comprobarlos.", txt),
    ("Errores típicos y su síntoma: sin quitar las filas TOTAL, el importe sale el doble; sin quitar duplicados del maestro, salen líneas de más (las de MAG-216 dos veces); con agosto dentro de la carpeta, salen errores en Fecha o ventas de agosto contadas en otros meses.", txt),
]
for r, (t, f) in enumerate(pasos):
    ws.write(r, 0, t, f)

wv = wb.add_worksheet("Ventas")
cols = ["Fecha", "Albaran", "Cliente", "Delegacion", "CodProducto", "Unidades", "ImporteNeto",
        "Descripcion", "Familia", "Archivo", "Mes"]
data = []
for _, r in final.iterrows():
    data.append([r.Fecha.to_pydatetime(), r.Albaran, r.Cliente, r.Delegacion, r.CodProducto,
                 int(r.Unidades), float(r.ImporteNeto),
                 r.Descripcion if isinstance(r.Descripcion, str) else None,
                 r.Familia if isinstance(r.Familia, str) else None, r.Archivo, int(r.Mes)])
N = len(data)
wv.add_table(0, 0, N, len(cols) - 1, {"name": "Ventas", "style": "Table Style Medium 2",
             "columns": [{"header": c, **({"format": fec} if c == "Fecha" else {"format": eur} if c == "ImporteNeto" else {})} for c in cols],
             "data": data})
for c, wdt in zip("ABCDEFGHIJK", [11, 12, 32, 11, 12, 9, 12, 30, 13, 20, 5]):
    wv.set_column(f"{c}:{c}", wdt)

wr = wb.add_worksheet("Resumen")
wr.write(0, 0, "Importe neto por delegación y mes (lo mismo que la tabla dinámica)", neg)
meses_n = ["Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre"]
wr.write(2, 0, "Delegacion", neg)
for j, m in enumerate(MESES):
    wr.write(1, j + 1, m)
    wr.write(2, j + 1, meses_n[j], neg)
wr.write(2, 7, "Total", neg)
for i, dele in enumerate(["Zaragoza", "Pamplona", "Lleida"]):
    rr = 3 + i
    wr.write(rr, 0, dele)
    for j in range(len(MESES)):
        col = xlsxwriter.utility.xl_col_to_name(j + 1)
        wr.write_formula(rr, j + 1, f"=SUMIFS(Ventas!$G$2:$G${N+1},Ventas!$D$2:$D${N+1},$A{rr+1},Ventas!$K$2:$K${N+1},{col}$2)", eur)
    wr.write_formula(rr, 7, f"=SUM(B{rr+1}:G{rr+1})", eur)
wr.write(6, 0, "Total", neg)
for j in range(1, 8):
    col = xlsxwriter.utility.xl_col_to_name(j)
    wr.write_formula(6, j, f"=SUM({col}4:{col}6)", eur)
wr.write(8, 0, "Importe por familia", neg)
fams = ["Cableado", "Canalización", "Mecanismos", "Iluminación", "Protección"]
for i, fm in enumerate(fams):
    wr.write(9 + i, 0, fm)
    wr.write_formula(9 + i, 1, f"=SUMIFS(Ventas!$G$2:$G${N+1},Ventas!$I$2:$I${N+1},A{10+i})", eur)
wr.write(14, 0, "(sin familia)")
wr.write_formula(14, 1, f"=SUM(Ventas!$G$2:$G${N+1})-SUM(B10:B14)", eur)
wr.set_column("A:A", 16); wr.set_column("B:H", 13)

wsm = wb.add_worksheet("Sin_maestro")
wsm.write_row(0, 0, ["CodProducto", "Lineas", "ImporteNeto"], neg)
sm = final[final.Familia.isna()].groupby("CodProducto").agg(Lineas=("ImporteNeto", "size"), Importe=("ImporteNeto", "sum")).reset_index()
for i, r in sm.iterrows():
    wsm.write_row(1 + i, 0, [r.CodProducto, int(r.Lineas)])
    wsm.write_number(1 + i, 2, round(float(r.Importe), 2), eur)
wsm.set_column("A:C", 14)

wc = wb.add_worksheet("Controles")
wc.write_row(0, 0, ["Control", "Calculado en la tabla", "Esperado", "¿Cuadra?"], neg)
ctrl = [
    ("Líneas de la tabla final", f"=ROWS(Ventas!A2:A{N+1})", controles["lineas"]),
    ("Importe neto total (€)", f"=SUM(Ventas!G2:G{N+1})", controles["importe_total"]),
    ("Importe de agosto (€)", f"=SUMIFS(Ventas!G2:G{N+1},Ventas!K2:K{N+1},8)", controles["importe_agosto"]),
    ("Importe de la familia Iluminación (€)", f"=SUMIFS(Ventas!G2:G{N+1},Ventas!I2:I{N+1},\"Iluminación\")", controles["importe_iluminacion"]),
    ("Importe de las líneas sin familia (€)", f"=SUMIFS(Ventas!G2:G{N+1},Ventas!I2:I{N+1},\"\")", controles["importe_sin_familia"]),
    ("Importe de Pamplona en octubre (€)", f"=SUMIFS(Ventas!G2:G{N+1},Ventas!D2:D{N+1},\"Pamplona\",Ventas!K2:K{N+1},10)", controles["pamplona_octubre"]),
]
for i, (t, f, e) in enumerate(ctrl):
    wc.write(1 + i, 0, t)
    wc.write_formula(1 + i, 1, f, eur if i else None)
    wc.write_number(1 + i, 2, e, eur if i else None)
    wc.write_formula(1 + i, 3, f'=IF(ABS(B{2+i}-C{2+i})<0.01,"OK","REVISAR")', ok)
wc.set_column("A:A", 38); wc.set_column("B:D", 20)
wb.close()

for nombre, meta in {
    "n4-ventas-mensuales": {"titulo": "N4 · Exportaciones mensuales del ERP (carpeta para Power Query)",
                             "descripcion": "Carpeta comprimida con seis CSV de ventas (mayo-octubre 2026) y el maestro de productos de Electro Cierzo, para combinarlos con Power Query.", "nivel": "n4"},
    "n4-maestro-productos": {"titulo": "N4 · Maestro de productos e instrucciones",
                              "descripcion": "Libro de trabajo de la práctica de Power Query: instrucciones y Tabla Productos.", "nivel": "n4"},
    "n4-ventas-mensuales-solucion": {"titulo": "N4 · Solución: ventas combinadas con Power Query",
                                      "descripcion": "Tabla final combinada, resumen por delegación y mes, códigos sin maestro y totales de control.", "nivel": "n4"},
}.items():
    with open(os.path.join(BASE, f"{nombre}.meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)

print(json.dumps(controles, ensure_ascii=False, indent=1))

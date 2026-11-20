#!/usr/bin/env python3
"""Genera la práctica del módulo n3m4 (tablas dinámicas):

- libros/n3-ventas-2026.xlsx            -> Instrucciones + Tabla «Ventas» (1.200 líneas, enero-octubre de 2026)
                                            + hoja «Ventas nuevas» (12 albaranes del 30/10/2026 registrados tarde)
- libros/n3-ventas-2026-solucion.xlsx   -> los mismos datos con las 12 ventas ya añadidas a la Tabla, los
                                            resúmenes que dan las tablas dinámicas rehechos con fórmulas
                                            (SUMAR.SI.CONJUNTO, K.ESIMO.MAYOR, INDICE+COINCIDIR) y los controles.
  xlsxwriter no sabe crear tablas dinámicas: la solución las describe paso a paso en la hoja «Cómo se hace»
  y deja las mismas cifras calculadas con fórmula para comparar.

Los datos están limpios a propósito (la limpieza se practicó en n3m3). Lo que se practica aquí:
- crear dinámicas desde una Tabla, agrupar fechas por meses, top 5, % del total, campo calculado, segmentación
  y gráfico dinámico;
- ACTUALIZAR: la hoja «Ventas nuevas» trae 12 líneas que hay que pegar debajo de la Tabla. Si no actualiza,
  el total general se queda en el control 1 en lugar del control 2.
Los totales de control se calculan con pandas desde los datos (los finales llevan las 12 ventas nuevas) y se
imprimen en JSON al final.
"""
import json
import os
import random
from datetime import date, datetime, timedelta

import pandas as pd
import xlsxwriter

random.seed(20261116)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # libros/

PRODUCTOS = [  # descripción, familia, precio de tarifa, (uds mín, uds máx)
    ("Cable 1,5 mm² (rollo 100 m)", "Cableado", 32.50, (2, 12)),
    ("Cable 2,5 mm² (rollo 100 m)", "Cableado", 49.90, (2, 12)),
    ("Cable 4 mm² (rollo 100 m)", "Cableado", 78.40, (1, 6)),
    ("Manguera 3G2,5 (rollo 100 m)", "Cableado", 139.00, (1, 4)),
    ("Canaleta 25×16 (2 m)", "Canalización", 2.90, (10, 80)),
    ("Canaleta 40×25 (2 m)", "Canalización", 4.80, (10, 60)),
    ("Tubo corrugado 20 mm (100 m)", "Canalización", 19.80, (2, 15)),
    ("Bridas 200 mm (bolsa de 100)", "Canalización", 3.10, (5, 40)),
    ("Interruptor simple", "Mecanismos", 4.60, (10, 60)),
    ("Base de enchufe schuko", "Mecanismos", 5.20, (10, 80)),
    ("Conmutador de cruce", "Mecanismos", 9.75, (4, 30)),
    ("Downlight LED 18 W", "Iluminación", 14.90, (6, 40)),
    ("Proyector LED 36 W", "Iluminación", 27.50, (2, 16)),
    ("Panel LED 60×60 40 W", "Iluminación", 32.00, (4, 20)),
    ("Magnetotérmico 2P 16 A", "Protección", 9.80, (4, 24)),
    ("Magnetotérmico 2P 25 A", "Protección", 10.90, (4, 20)),
    ("Diferencial 2P 40 A 30 mA", "Protección", 38.50, (1, 8)),
]
COSTE = {"Cableado": 0.78, "Canalización": 0.70, "Mecanismos": 0.66, "Iluminación": 0.64, "Protección": 0.74}
ZONAS = [("Zaragoza", ["Raúl Gimeno", "Pilar Lasheras", "Sergio Bueno"], 0.5),
         ("Pamplona", ["Elena Sanz", "Iñaki Goñi"], 0.25),
         ("Lleida", ["Jordi Vidal", "Montse Pujol"], 0.25)]
FESTIVOS = {date(2026, 1, 1), date(2026, 1, 6), date(2026, 4, 2), date(2026, 4, 3), date(2026, 5, 1),
            date(2026, 10, 12)}
COLS = ["Fecha", "Comercial", "Zona", "Familia", "Producto", "Unidades", "Importe", "Coste"]


def laborables(d1, d2):
    d, out = d1, []
    while d <= d2:
        if d.weekday() < 5 and d not in FESTIVOS:
            out.append(d)
        d += timedelta(days=1)
    return out


def linea(fecha):
    zona, comerciales, _ = random.choices(ZONAS, weights=[z[2] for z in ZONAS])[0]
    desc, fam, precio, (umin, umax) = random.choice(PRODUCTOS)
    uds = random.randint(umin, umax)
    dto = random.choice([0, 0, 0, 0.05, 0.08, 0.10, 0.12])
    importe = round(uds * precio * (1 - dto), 2)
    coste = round(uds * precio * COSTE[fam] * random.uniform(0.97, 1.03), 2)
    return [fecha, random.choice(comerciales), zona, fam, desc, uds, importe, coste]


DIAS = laborables(date(2026, 1, 2), date(2026, 10, 30))
pesos = [0.6 if d.month == 8 else 1.0 for d in DIAS]
fechas = sorted(random.choices(DIAS, weights=pesos, k=1200))
VENTAS = [linea(f) for f in fechas]
NUEVAS = [linea(date(2026, 10, 30)) for _ in range(12)]

# ---------- controles con pandas ----------
df1 = pd.DataFrame(VENTAS, columns=COLS)
df = pd.DataFrame(VENTAS + NUEVAS, columns=COLS)
df["Fecha"] = pd.to_datetime(df["Fecha"])
total_antes = round(df1["Importe"].sum(), 2)
total = round(df["Importe"].sum(), 2)
zgz_marzo = round(df[(df.Zona == "Zaragoza") & (df.Fecha.dt.month == 3)]["Importe"].sum(), 2)
top = df.groupby("Producto")["Importe"].sum().round(2).sort_values(ascending=False)
quinto = round(top.iloc[4], 2)
fam = df.groupby("Familia")["Importe"].sum()
pct_ilum = round(100 * fam["Iluminación"] / fam.sum(), 2)
marg = df.groupby("Familia")[["Importe", "Coste"]].sum()
margen_prot = round(marg.loc["Protección", "Importe"] - marg.loc["Protección", "Coste"], 2)
controles = {
    "total_antes": total_antes, "total_despues": total, "zaragoza_marzo": zgz_marzo,
    "quinto_producto": quinto, "quinto_nombre": top.index[4],
    "hueco_4_5": round(top.iloc[3] - top.iloc[4], 2), "hueco_5_6": round(top.iloc[4] - top.iloc[5], 2),
    "pct_iluminacion": pct_ilum, "margen_proteccion": margen_prot,
    "top5": {k: round(v, 2) for k, v in top.head(5).items()},
    "nuevas": round(sum(r[6] for r in NUEVAS), 2),
}

# ---------- formatos comunes ----------


def formatos(wb):
    return {
        "tit": wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F4E79"}),
        "sub": wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F4E79"}),
        "txt": wb.add_format({"text_wrap": True, "valign": "top"}),
        "neg": wb.add_format({"bold": True}),
        "fecha": wb.add_format({"num_format": "dd/mm/yyyy"}),
        "mes": wb.add_format({"num_format": "mmm yyyy", "bold": True, "bg_color": "#DDEBF7"}),
        "eur": wb.add_format({"num_format": "#,##0.00 €"}),
        "eurn": wb.add_format({"num_format": "#,##0.00 €", "bold": True}),
        "pct": wb.add_format({"num_format": "0.00%"}),
        "cab": wb.add_format({"bold": True, "bg_color": "#DDEBF7", "border": 1}),
        "ok": wb.add_format({"bold": True, "font_color": "#006100", "bg_color": "#C6EFCE"}),
    }


def hoja_ventas(wb, f, filas, nombre_hoja="Ventas", tabla="Ventas"):
    ws = wb.add_worksheet(nombre_hoja)
    n = len(filas)
    for i, r in enumerate(filas, start=1):
        ws.write_datetime(i, 0, datetime.combine(r[0], datetime.min.time()), f["fecha"])
        for j in range(1, 5):
            ws.write_string(i, j, r[j])
        ws.write_number(i, 5, r[5])
        ws.write_number(i, 6, r[6], f["eur"])
        ws.write_number(i, 7, r[7], f["eur"])
    ws.add_table(0, 0, n, 7, {"name": tabla, "style": "Table Style Medium 2",
                              "columns": [{"header": c} for c in COLS]})
    for col, w in zip("ABCDEFGH", [11, 16, 11, 13, 30, 10, 12, 12]):
        ws.set_column(f"{col}:{col}", w)
    ws.freeze_panes(1, 0)
    return ws


INSTRUCCIONES = [
    ("Objetivo", "Javier Ortega (director comercial) y Carmen Soler (directora general) quieren el informe de ventas de enero a octubre de 2026. No escribas fórmulas: todo se hace con tablas dinámicas a partir de la Tabla «Ventas» (1.200 líneas: fecha, comercial, zona, familia, producto, unidades, importe y coste)."),
    ("Paso 1 · Antes de nada", "Haz clic dentro de la Tabla «Ventas» y anota el total de la columna Importe (selecciona la columna y míralo en la barra de estado). Es tu total de control: todas tus dinámicas deben sumar eso."),
    ("Paso 2 · Ventas por zona y mes", "Insertar › Tabla dinámica (desde la Tabla «Ventas», en una hoja nueva). Zona en Filas, Fecha en Columnas agrupada por Meses, Importe en Valores. Formato de número del campo: euros con dos decimales. Llama a la hoja «Zona y mes»."),
    ("Paso 3 · Los 5 productos que más venden", "Otra dinámica: Producto en Filas, Importe en Valores. Ordena de mayor a menor (clic derecho en una cifra › Ordenar) y quédate con los cinco primeros (Filtros de valor › Diez mejores, cambiando 10 por 5, o simplemente lee los cinco primeros)."),
    ("Paso 4 · Peso de cada familia", "Otra dinámica: Familia en Filas e Importe en Valores, mostrado como «% del total general» (Configuración de campo de valor › Mostrar valores como)."),
    ("Paso 5 · Margen con campo calculado", "En la dinámica de familias, crea el campo calculado Margen = Importe - Coste (Analizar tabla dinámica › Campos, elementos y conjuntos › Campo calculado). Pon Importe (como suma, no como porcentaje), Coste y Margen en Valores."),
    ("Paso 6 · Segmentación y gráfico", "Añade una segmentación de Comercial conectada a todas las dinámicas (Segmentación › Conexiones de informe) y un gráfico dinámico de columnas de la dinámica «Zona y mes». Prueba un comercial y deja la segmentación sin filtro al terminar."),
    ("Paso 7 · Han llegado ventas nuevas", "En la hoja «Ventas nuevas» hay 12 albaranes del 30/10/2026 que se registraron tarde. Cópialos (sin la fila de títulos) y pégalos en la primera fila vacía debajo de la Tabla «Ventas»: la Tabla se amplía sola. Después pulsa Datos › Actualizar todo (Ctrl+Alt+F5) y comprueba que el total general ha cambiado."),
    ("Cómo comprobar", "En la guía te preguntarán estos totales de control: 1) total general ANTES de añadir las ventas nuevas; 2) total general DESPUÉS de añadirlas y actualizar; 3) ventas de Zaragoza en marzo; 4) importe del producto que queda en 5.º lugar; 5) % de Iluminación sobre el total; 6) margen de Protección. Los puntos 3 a 6, con las ventas nuevas ya dentro."),
    ("Tiempo", "Intenta hacer cada dinámica en menos de 5 minutos: en las pruebas de selección de «Excel avanzado» hay tiempo límite."),
]


def libro_alumna():
    ruta = os.path.join(BASE, "n3-ventas-2026.xlsx")
    wb = xlsxwriter.Workbook(ruta)
    f = formatos(wb)
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 30)
    ws.set_column("B:B", 100)
    ws.write("A1", "Informe de ventas 2026 con tablas dinámicas", f["tit"])
    ws.write("A2", "Electro Cierzo Suministros, S.L. · práctica del módulo «Tablas dinámicas»", f["txt"])
    for i, (a, b) in enumerate(INSTRUCCIONES, start=3):
        ws.write(i, 0, a, f["sub"])
        ws.write(i, 1, b, f["txt"])
        ws.set_row(i, 48)
    hoja_ventas(wb, f, VENTAS)
    wn = wb.add_worksheet("Ventas nuevas")
    for j, c in enumerate(COLS):
        wn.write(0, j, c, f["cab"])
    for i, r in enumerate(NUEVAS, start=1):
        wn.write_datetime(i, 0, datetime.combine(r[0], datetime.min.time()), f["fecha"])
        for j in range(1, 5):
            wn.write_string(i, j, r[j])
        wn.write_number(i, 5, r[5])
        wn.write_number(i, 6, r[6], f["eur"])
        wn.write_number(i, 7, r[7], f["eur"])
    for col, w in zip("ABCDEFGH", [11, 16, 11, 13, 30, 10, 12, 12]):
        wn.set_column(f"{col}:{col}", w)
    wn.write("J1", "Copia A2:H13 y pégalo en la primera fila vacía debajo de la Tabla «Ventas». Después, Actualizar todo.", f["neg"])
    wb.close()
    return ruta


def libro_solucion():
    ruta = os.path.join(BASE, "n3-ventas-2026-solucion.xlsx")
    wb = xlsxwriter.Workbook(ruta)
    f = formatos(wb)
    filas = VENTAS + NUEVAS
    u = len(filas) + 1  # última fila de datos (1213)
    R = lambda col: f"Ventas!${col}$2:${col}${u}"
    # Cómo se hace
    ws = wb.add_worksheet("Cómo se hace")
    ws.set_column("A:A", 28)
    ws.set_column("B:B", 105)
    ws.write("A1", "Solución: informe de ventas 2026", f["tit"])
    pasos = [
        ("Ventas nuevas", f"Las 12 ventas del 30/10/2026 ya están pegadas al final de la Tabla «Ventas» (filas {u-11} a {u}). Tras pegarlas hay que pulsar Datos › Actualizar todo (Ctrl+Alt+F5)."),
        ("Zona y mes", "Insertar › Tabla dinámica › Desde una tabla o rango › Tabla «Ventas» › Nueva hoja de cálculo. Zona a Filas, Fecha a Columnas (si Excel añade Años y Trimestres, quítalos y deja Meses: todo es 2026), Importe a Valores. Clic derecho en una cifra › Configuración de campo de valor › Formato de número › Moneda. La hoja «Zona y mes» de este libro tiene las mismas cifras hechas con SUMAR.SI.CONJUNTO."),
        ("Top 5 productos", "Producto a Filas, Importe a Valores; clic derecho en una cifra › Ordenar › Ordenar de mayor a menor; Filtros de valor › Diez mejores › 5. Hoja «Top productos»."),
        ("% por familia", "Familia a Filas, Importe a Valores; Configuración de campo de valor › Mostrar valores como › % del total general. Hoja «Familias»."),
        ("Margen", "Analizar tabla dinámica › Cálculos › Campos, elementos y conjuntos › Campo calculado. Nombre: Margen. Fórmula: =Importe-Coste. Agregar y Aceptar. El campo calculado trabaja sobre las SUMAS de cada familia, así que Margen/Importe da el margen real. Hoja «Margen»."),
        ("Segmentación y gráfico", "Con una dinámica seleccionada: Analizar tabla dinámica › Insertar segmentación de datos › Comercial. En la pestaña Segmentación › Conexiones de informe, marca todas las dinámicas. Gráfico: Analizar tabla dinámica › Gráfico dinámico › Columna agrupada. Deja la segmentación sin filtro (botón Borrar filtro) antes de entregar."),
        ("Controles", "La hoja «Controles» calcula cada total de control con fórmula y lo compara con el valor esperado."),
    ]
    for i, (a, b) in enumerate(pasos, start=2):
        ws.write(i, 0, a, f["sub"])
        ws.write(i, 1, b, f["txt"])
        ws.set_row(i, 62)
    hoja_ventas(wb, f, filas)
    # Zona y mes
    wz = wb.add_worksheet("Zona y mes")
    wz.write("A1", "Suma de Importe por zona y mes (lo mismo que la tabla dinámica)", f["sub"])
    wz.write("A3", "Zona", f["cab"])
    for m in range(1, 11):
        wz.write_datetime(2, m, datetime(2026, m, 1), f["mes"])
    wz.write(2, 11, "Total general", f["cab"])
    for i, z in enumerate(["Lleida", "Pamplona", "Zaragoza"], start=3):
        wz.write(i, 0, z, f["neg"])
        for m in range(1, 11):
            c = xlsxwriter.utility.xl_col_to_name(m)
            wz.write_formula(i, m, f'=SUMIFS({R("G")},{R("C")},$A{i+1},{R("A")},">="&{c}$3,{R("A")},"<="&EOMONTH({c}$3,0))', f["eur"])
        wz.write_formula(i, 11, f"=SUM(B{i+1}:K{i+1})", f["eurn"])
    wz.write(6, 0, "Total general", f["cab"])
    for m in range(1, 12):
        c = xlsxwriter.utility.xl_col_to_name(m)
        wz.write_formula(6, m, f"=SUM({c}4:{c}6)", f["eurn"])
    wz.set_column("A:A", 14)
    wz.set_column("B:L", 13)
    # Top productos
    wt = wb.add_worksheet("Top productos")
    wt.write_row(0, 0, ["Producto", "Importe"], f["cab"])
    prods = [p[0] for p in PRODUCTOS]
    for i, p in enumerate(prods, start=1):
        wt.write(i, 0, p)
        wt.write_formula(i, 1, f'=SUMIFS({R("G")},{R("E")},A{i+1})', f["eur"])
    n = len(prods) + 1
    wt.write_row(0, 3, ["Puesto", "Producto", "Importe"], f["cab"])
    for k in range(1, 6):
        wt.write(k, 3, k)
        wt.write_formula(k, 5, f"=LARGE($B$2:$B${n},D{k+1})", f["eur"])
        wt.write_formula(k, 4, f"=INDEX($A$2:$A${n},MATCH(F{k+1},$B$2:$B${n},0))")
    wt.set_column("A:A", 30)
    wt.set_column("B:B", 13)
    wt.set_column("E:E", 30)
    wt.set_column("F:F", 13)
    # Familias y margen
    fams = ["Cableado", "Canalización", "Iluminación", "Mecanismos", "Protección"]
    wf = wb.add_worksheet("Familias")
    wf.write_row(0, 0, ["Familia", "Importe", "% del total general"], f["cab"])
    for i, fa in enumerate(fams, start=1):
        wf.write(i, 0, fa)
        wf.write_formula(i, 1, f'=SUMIFS({R("G")},{R("D")},A{i+1})', f["eur"])
        wf.write_formula(i, 2, f"=B{i+1}/$B$7", f["pct"])
    wf.write(6, 0, "Total general", f["neg"])
    wf.write_formula(6, 1, "=SUM(B2:B6)", f["eurn"])
    wf.write_formula(6, 2, "=SUM(C2:C6)", f["pct"])
    wf.set_column("A:A", 16)
    wf.set_column("B:C", 18)
    wm = wb.add_worksheet("Margen")
    wm.write_row(0, 0, ["Familia", "Importe", "Coste", "Margen", "Margen %"], f["cab"])
    for i, fa in enumerate(fams, start=1):
        wm.write(i, 0, fa)
        wm.write_formula(i, 1, f'=SUMIFS({R("G")},{R("D")},A{i+1})', f["eur"])
        wm.write_formula(i, 2, f'=SUMIFS({R("H")},{R("D")},A{i+1})', f["eur"])
        wm.write_formula(i, 3, f"=B{i+1}-C{i+1}", f["eur"])
        wm.write_formula(i, 4, f"=D{i+1}/B{i+1}", f["pct"])
    wm.write(6, 0, "Total general", f["neg"])
    for c in "BCD":
        wm.write_formula(6, " BCD".index(c), f"=SUM({c}2:{c}6)", f["eurn"])
    wm.write_formula(6, 4, "=D7/B7", f["pct"])
    wm.set_column("A:A", 16)
    wm.set_column("B:E", 14)
    # Controles
    wc = wb.add_worksheet("Controles")
    wc.write_row(0, 0, ["Control", "Con fórmula", "Esperado", "¿Cuadra?"], f["cab"])
    filas_c = [
        ("1. Total general antes de añadir las ventas nuevas", f"=SUM(Ventas!$G$2:$G${u-12})", total_antes),
        ("2. Total general después de añadirlas y actualizar", f"=SUM({R('G')})", total),
        ("3. Ventas de Zaragoza en marzo", "='Zona y mes'!D6", zgz_marzo),
        ("4. Importe del producto en 5.º lugar", "='Top productos'!F6", quinto),
        ("5. % de Iluminación sobre el total (en número)", "=ROUND(100*Familias!C4,2)", pct_ilum),
        ("6. Margen de Protección", "=Margen!D6", margen_prot),
    ]
    for i, (t, fo, esp) in enumerate(filas_c, start=1):
        wc.write(i, 0, t)
        wc.write_formula(i, 1, fo, f["eur"] if i != 5 else None)
        wc.write_number(i, 2, esp, f["eur"] if i != 5 else None)
        wc.write_formula(i, 3, f'=IF(ABS(B{i+1}-C{i+1})<0.01,"Sí","REVISAR")', f["ok"])
    wc.set_column("A:A", 52)
    wc.set_column("B:D", 16)
    wb.close()
    return ruta


def meta(nombre, titulo, descripcion):
    with open(os.path.join(BASE, nombre + ".meta.json"), "w", encoding="utf-8") as fh:
        json.dump({"titulo": titulo, "descripcion": descripcion, "nivel": "n3"}, fh, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    libro_alumna()
    libro_solucion()
    meta("n3-ventas-2026", "N3 · Informe de ventas 2026 con tablas dinámicas",
         "Una Tabla de 1.200 ventas de enero a octubre de 2026 para hacer el informe con tablas dinámicas: zona y mes, top 5, % por familia, margen con campo calculado, segmentación, gráfico y 12 ventas nuevas que obligan a actualizar.")
    meta("n3-ventas-2026-solucion", "N3 · Informe de ventas 2026 con tablas dinámicas (solución)",
         "La práctica resuelta: pasos de cada tabla dinámica y las mismas cifras rehechas con fórmulas, con la hoja de controles.")
    print(json.dumps(controles, ensure_ascii=False, indent=1))

#!/usr/bin/env python3
"""Genera la práctica del módulo n5m3 (el cuadro de mando):

- libros/n5-cuadro-de-mando.xlsx           -> Instrucciones + Ventas (líneas de factura, 02/01/2026-30/10/2026,
                                              sin IVA y con IVA) + Objetivos (mes × zona). Datos limpios: el
                                              trabajo es el cuadro de mando, no la limpieza.
- libros/n5-cuadro-de-mando-solucion.xlsx  -> los mismos datos con Léeme, Parámetros (mes del informe), Cálculos
                                              (indicadores del mes con fórmulas, tabla mes a mes, ventas por
                                              producto y zona, comprobaciones), Cuadro (título-conclusión,
                                              tarjetas, gráfico combinado con texto alternativo, una página
                                              horizontal) y «Cómo se hace» (las dinámicas y la segmentación,
                                              que xlsxwriter no sabe crear, descritas paso a paso).

Trampas a propósito (las que enseña el módulo):
- La Tabla trae «Importe» (sin IVA) e «Importe con IVA»: el indicador de ventas va SIN IVA.
- Cada factura tiene de 1 a 3 líneas: el ticket medio se divide entre facturas DISTINTAS, no entre líneas.
- La fecha 31/10 no tiene ventas (sábado), pero el 30/10 sí: el rango del mes tiene que llegar a fin de mes.

Notas de formato del archivo: las fórmulas van en inglés y con comas. No se usa TEXT con fechas (su código de
formato depende del idioma de Excel): el nombre del mes sale con CHOOSE. Las funciones modernas se escriben con
prefijo y como fórmula de matriz dinámica. Los valores se guardan también calculados (pandas) para que el libro
se vea bien antes de recalcular. Los totales de control se calculan con pandas y se imprimen en JSON al final.
"""
import json
import os
import random
from datetime import date, timedelta

import pandas as pd
import xlsxwriter

random.seed(20261120)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # libros/

PRODUCTOS = [  # descripción, familia, precio, (uds mín, uds máx)
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
FACTOR_COSTE = {"Cableado": 0.78, "Canalización": 0.70, "Mecanismos": 0.66, "Iluminación": 0.64, "Protección": 0.74}
ZONAS = [("Zaragoza", 0.50, ["Elena Sanz", "Raúl Aznar"]), ("Pamplona", 0.28, ["Iñaki Goñi"]),
         ("Lleida", 0.22, ["Montse Puig"])]
PREFIJOS = ["Instalaciones", "Electricidad", "Montajes Eléctricos", "Electro", "Reformas", "Mantenimientos",
            "Climatización y Electricidad"]
NOMBRES = ["Moncayo", "Ebro", "Aneto", "Gállego", "Jalón", "Bardenas", "Segre", "Arga", "Cinca", "Huerva",
           "Ribagorza", "Sobrarbe", "Monegros", "Noguera", "Pallars", "Baztán", "Estella", "Tudela", "Calatayud",
           "Barbastro", "Jaca", "Tarazona", "Ejea", "Cervera", "Tàrrega", "Olite", "Sangüesa", "Borja", "Caspe"]
SUFIJOS = ["S.L.", "S.L.", "S.L.", "S.L.U.", "S.A."]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
         "noviembre", "diciembre"]
FESTIVOS = {date(2026, 1, 1), date(2026, 1, 6), date(2026, 4, 3), date(2026, 5, 1), date(2026, 10, 12)}
ESTACION = {1: 0.85, 2: 0.95, 3: 1.05, 4: 1.0, 5: 1.1, 6: 1.05, 7: 0.9, 8: 0.55, 9: 1.05, 10: 1.1}

# --- Clientes ---
clientes, usados = [], set()
for i in range(70):
    while True:
        nombre = f"{random.choice(PREFIJOS)} {random.choice(NOMBRES)} {random.choice(SUFIJOS)}"
        if nombre not in usados:
            usados.add(nombre)
            break
    zona, _, comerciales = random.choices(ZONAS, weights=[z[1] for z in ZONAS])[0]
    clientes.append({"Cliente": nombre, "Zona": zona, "Comercial": random.choice(comerciales),
                     "peso": random.choice([1, 1, 2, 3, 5])})

# --- Ventas: líneas de factura ---
filas, nfac = [], 0
d = date(2026, 1, 2)
while d <= date(2026, 10, 31):
    if d.weekday() < 5 and d not in FESTIVOS:
        n_hoy = sum(1 for _ in range(4) if random.random() < 0.55 * ESTACION[d.month])
        for _ in range(n_hoy):
            nfac += 1
            cli = random.choices(clientes, weights=[c["peso"] for c in clientes])[0]
            for desc, fam, precio, (umin, umax) in random.sample(PRODUCTOS, random.choice([1, 1, 2, 2, 3])):
                uds = random.randint(umin, umax)
                dto = random.choice([0, 0, 0.05, 0.10])
                imp = round(uds * precio * (1 - dto), 2)
                filas.append({"Fecha": d, "Factura": f"F26-{nfac:04d}", "Cliente": cli["Cliente"],
                              "Zona": cli["Zona"], "Comercial": cli["Comercial"], "Familia": fam,
                              "Producto": desc, "Unidades": uds, "Importe": imp,
                              "Importe con IVA": round(imp * 1.21 + 1e-9, 2),
                              "Coste": round(uds * precio * FACTOR_COSTE[fam], 2)})
    d += timedelta(days=1)
ventas = pd.DataFrame(filas)
ventas["Mes"] = pd.to_datetime(ventas["Fecha"]).dt.month

# --- Objetivos por mes y zona (redondeados a 500 €), lejos del 100 % para que «alcanzado» no sea dudoso ---
reales = ventas.groupby(["Mes", "Zona"])["Importe"].sum()
while True:
    obj = []
    for m in range(1, 11):
        for zona, _, _ in ZONAS:
            base = reales.get((m, zona), 0)
            obj.append({"Mes": date(2026, m, 1), "Zona": zona,
                        "Objetivo": max(500, round(base * random.uniform(0.9, 1.12) / 500) * 500)})
    objetivos = pd.DataFrame(obj)
    objetivos["M"] = [x.month for x in objetivos["Mes"]]
    cumpl = ventas.groupby("Mes")["Importe"].sum() / objetivos.groupby("M")["Objetivo"].sum()
    if all(abs(c - 1) > 0.008 for c in cumpl):
        break

# --- Totales de control (pandas) ---
oct_ = ventas[ventas["Mes"] == 10]
ventas_oct = round(oct_["Importe"].sum(), 2)
obj_oct = objetivos[objetivos["M"] == 10]["Objetivo"].sum()
fact_oct = oct_["Factura"].nunique()
pamplona = ventas[ventas["Zona"] == "Pamplona"].groupby("Producto")["Importe"].sum().sort_values(ascending=False)
mensual = pd.DataFrame({"Ventas": ventas.groupby("Mes")["Importe"].sum(),
                        "Objetivo": objetivos.groupby("M")["Objetivo"].sum()})
CONTROLES = {
    "total_importe": round(ventas["Importe"].sum(), 2),
    "lineas": len(ventas),
    "ventas_oct": ventas_oct,
    "objetivo_oct": int(obj_oct),
    "cumplimiento_oct_pct": round(ventas_oct / obj_oct * 100, 2),
    "facturas_oct": int(fact_oct),
    "lineas_oct": len(oct_),
    "ticket_medio_oct": round(ventas_oct / fact_oct, 2),
    "ticket_por_linea_oct (error típico)": round(ventas_oct / len(oct_), 2),
    "ventas_oct_con_iva (error típico)": round(oct_["Importe con IVA"].sum(), 2),
    "clientes_oct": int(oct_["Cliente"].nunique()),
    "meses_alcanzados": int((mensual["Ventas"] >= mensual["Objetivo"]).sum()),
    "top1_pamplona": round(pamplona.iloc[0], 2), "top1_pamplona_producto": pamplona.index[0],
    "top2_pamplona": round(pamplona.iloc[1], 2),
    "cumplimiento_mensual": {int(k): round(v, 4) for k, v in (mensual["Ventas"] / mensual["Objetivo"]).items()},
}

NV = len(ventas)
UV = NV + 1  # última fila de Ventas
R = lambda col: f"Ventas!${col}$2:${col}${UV}"
INSTRUCCIONES = [
    ("Práctica del módulo «El cuadro de mando» · Electro Cierzo Suministros, S.L.", "t"),
    ("", None),
    ("El encargo (Carmen Soler, directora general)", "h"),
    ("«Quiero una sola página para el comité de cada mes: cuatro cifras clave, ventas frente a objetivo mes a mes, "
     "los cinco productos que más venden y poder ver cada zona. Y que el mes que viene no haya que rehacerla.»", None),
    ("", None),
    ("Qué hay en el libro", "h"),
    (f"- Hoja Ventas: Tabla «Ventas» con {NV} líneas de factura del 02/01/2026 al 30/10/2026. Una factura puede tener "
     "varias líneas (varios productos). «Importe» va sin IVA; «Importe con IVA», con IVA.", None),
    ("- Hoja Objetivos: Tabla «Objetivos» con el objetivo de ventas (sin IVA) de cada mes y zona.", None),
    ("", None),
    ("Definiciones (cópialas en tu Léeme)", "h"),
    ("- Ventas del mes = suma de Importe (SIN IVA) de las líneas con fecha dentro del mes.", None),
    ("- Cumplimiento = Ventas del mes ÷ suma del Objetivo de ese mes (las tres zonas).", None),
    ("- Ticket medio = Ventas del mes ÷ número de facturas DISTINTAS del mes (no de líneas).", None),
    ("- Clientes activos = número de clientes distintos con alguna factura en el mes.", None),
    ("", None),
    ("Pasos", "h"),
    (f"1. Total de control: la suma de la columna Importe de la Tabla Ventas es {CONTROLES['total_importe']:,.2f} €"
     .replace(",", "X").replace(".", ",").replace("X", ".") + f" y hay {NV} líneas. Compruébalo antes de empezar.", None),
    ("2. Crea cuatro hojas: Léeme, Cuadro, Parámetros y Cálculos.", None),
    ("3. Parámetros: en B2 escribe la fecha 01/10/2026 (mes del informe) y dale un relleno de color de entrada.", None),
    ("4. Cálculos: los cuatro indicadores del mes con fórmulas que lean Parámetros!B2 (SUMAR.SI.CONJUNTO con FIN.MES; "
     "para lo «distinto», CONTARA(UNICOS(FILTRAR(…)))). Ni un número escrito a mano.", None),
    ("5. Cálculos: tabla de enero a octubre con Mes, Ventas, Objetivo, Cumplimiento y «¿Alcanzado?» (Sí/No).", None),
    ("6. Dos tablas dinámicas de la Tabla Ventas: «Top productos» (Producto en Filas, Importe en Valores, ordenada de "
     "mayor a menor: las cinco primeras filas son el top 5) y «Ventas por familia». Una segmentación de Zona "
     "conectada a las dos (Segmentación › Conexiones de informe).", None),
    ("7. Cuadro: título que dice la conclusión (con fórmula), cuatro tarjetas de cifras grandes que leen de Cálculos, "
     "un gráfico combinado (ventas en columnas, objetivo en línea) por mes, la dinámica del top 5 y la segmentación.", None),
    ("8. Accesibilidad e impresión: texto alternativo en el gráfico (clic derecho › Ver texto alternativo), "
     "Revisar › Comprobar accesibilidad, y Disposición de página: orientación horizontal, Ancho 1 página, Alto 1 página.", None),
    ("9. Comprobación: en Cálculos, una celda que diga «OK» si la suma de la tabla mes a mes coincide con el total "
     "de control y «Revisar» si no.", None),
    ("10. Léeme: qué es el libro, de dónde salen los datos, las definiciones y cómo se actualiza el mes que viene.", None),
    ("", None),
    ("Qué entregar", "h"),
    ("El libro con el Cuadro en una página y las respuestas a los controles de la app. Deja la segmentación sin "
     "filtro al terminar. Intenta hacerlo en menos de 45 minutos.", None),
]


def escribir_instrucciones(wb, ws, f):
    ws.set_column("A:A", 120)
    for i, (txt, estilo) in enumerate(INSTRUCCIONES):
        ws.write(i, 0, txt, {"t": f["titulo"], "h": f["neg"]}.get(estilo, f["ajuste"]))


def formatos(wb):
    return {
        "titulo": wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F3864"}),
        "neg": wb.add_format({"bold": True}),
        "ajuste": wb.add_format({"text_wrap": True, "valign": "top"}),
        "fecha": wb.add_format({"num_format": "dd/mm/yyyy"}),
        "mes": wb.add_format({"num_format": "mmmm yyyy"}),
        "eur": wb.add_format({"num_format": '#,##0.00 "€"'}),
        "eur0": wb.add_format({"num_format": '#,##0 "€"'}),
        "pct": wb.add_format({"num_format": "0.0%"}),
        "ent": wb.add_format({"num_format": "dd/mm/yyyy", "bg_color": "#FFF2CC", "border": 1}),
    }


def escribir_datos(wb, f):
    ws = wb.add_worksheet("Ventas")
    cols = ["Fecha", "Factura", "Cliente", "Zona", "Comercial", "Familia", "Producto", "Unidades", "Importe",
            "Importe con IVA", "Coste"]
    for i, r in enumerate(filas):
        for j, c in enumerate(cols):
            v = r[c]
            if c == "Fecha":
                ws.write_datetime(i + 1, j, pd.Timestamp(v).to_pydatetime(), f["fecha"])
            elif c in ("Importe", "Importe con IVA", "Coste"):
                ws.write_number(i + 1, j, v, f["eur"])
            else:
                ws.write(i + 1, j, v)
    ws.add_table(0, 0, NV, len(cols) - 1, {"name": "Ventas", "style": "Table Style Medium 2",
                                           "columns": [{"header": c} for c in cols]})
    for col, w in zip("ABCDEFGHIJK", [11, 10, 36, 10, 12, 13, 30, 9, 12, 14, 11]):
        ws.set_column(f"{col}:{col}", w)
    ws.freeze_panes(1, 0)
    wo = wb.add_worksheet("Objetivos")
    for i, r in objetivos.iterrows():
        wo.write_datetime(i + 1, 0, pd.Timestamp(r["Mes"]).to_pydatetime(), f["fecha"])
        wo.write(i + 1, 1, r["Zona"])
        wo.write_number(i + 1, 2, r["Objetivo"], f["eur0"])
    wo.add_table(0, 0, len(objetivos), 2, {"name": "Objetivos", "style": "Table Style Medium 2",
                                            "columns": [{"header": "Mes"}, {"header": "Zona"}, {"header": "Objetivo"}]})
    wo.set_column("A:C", 13)


# ---------------- Libro de la alumna ----------------
wb = xlsxwriter.Workbook(os.path.join(BASE, "n5-cuadro-de-mando.xlsx"))
f = formatos(wb)
escribir_instrucciones(wb, wb.add_worksheet("Instrucciones"), f)
escribir_datos(wb, f)
wb.close()

# ---------------- Solución ----------------
wb = xlsxwriter.Workbook(os.path.join(BASE, "n5-cuadro-de-mando-solucion.xlsx"))
f = formatos(wb)
f["grande"] = wb.add_format({"bold": True, "font_size": 22, "num_format": '#,##0 "€"', "font_color": "#1F3864"})
f["grande_pct"] = wb.add_format({"bold": True, "font_size": 22, "num_format": "0.0%", "font_color": "#1F3864"})
f["grande_eur2"] = wb.add_format({"bold": True, "font_size": 22, "num_format": '#,##0.00 "€"', "font_color": "#1F3864"})
f["grande_n"] = wb.add_format({"bold": True, "font_size": 22, "num_format": "0", "font_color": "#1F3864"})
f["etq"] = wb.add_format({"font_size": 11, "font_color": "#404040"})
f["tit"] = wb.add_format({"bold": True, "font_size": 18, "font_color": "#1F3864"})

escribir_instrucciones(wb, wb.add_worksheet("Instrucciones"), f)

wl = wb.add_worksheet("Léeme")
wl.set_column("A:A", 110)
LEEME = [
    ("Cuadro de mando mensual de ventas · Electro Cierzo Suministros, S.L.", f["titulo"]),
    ("Qué es: la página del comité de dirección con las cifras clave del mes y su comparación con el objetivo.", None),
    ("De dónde salen los datos: Tabla Ventas (exportación del programa de gestión, líneas de factura) y Tabla "
     "Objetivos (presupuesto comercial por mes y zona).", None),
    ("Definiciones: Ventas = Importe SIN IVA del mes · Cumplimiento = Ventas ÷ Objetivo del mes · Ticket medio = "
     "Ventas ÷ facturas distintas · Clientes activos = clientes distintos con factura en el mes.", None),
    ("Cómo se actualiza: 1) pega las líneas nuevas debajo de la Tabla Ventas (o Datos › Actualizar todo si llegan por "
     "Power Query); 2) cambia el mes en Parámetros!B2; 3) Datos › Actualizar todo para las dinámicas; 4) mira que "
     "Cálculos!B27 diga OK; 5) deja la segmentación sin filtro y exporta el Cuadro a PDF.", None),
    ("Capas: Ventas y Objetivos = datos (no se tocan) · Parámetros = entradas (celdas amarillas) · Cálculos = "
     "fórmulas · Cuadro = presentación (solo lee de Cálculos).", None),
]
for i, (t, fm) in enumerate(LEEME):
    wl.write(i, 0, t, fm or f["ajuste"])

wc = wb.add_worksheet("Cuadro")
wp = wb.add_worksheet("Parámetros")
wp.set_column("A:A", 24); wp.set_column("B:B", 14); wp.set_column("C:C", 60)
wp.write("A1", "Parámetro", f["neg"]); wp.write("B1", "Valor", f["neg"])
wp.write("A2", "Mes del informe")
wp.write_datetime("B2", pd.Timestamp("2026-10-01").to_pydatetime(), f["ent"])
wp.write("C2", "Escribe el día 1 del mes. Es la única celda que se cambia cada mes.")

k = wb.add_worksheet("Cálculos")
k.set_column("A:A", 30); k.set_column("B:F", 15); k.set_column("H:H", 30); k.set_column("I:L", 13)
k.write("A1", "Indicadores del mes", f["neg"])
k.write("A2", "Mes"); k.write_formula("B2", "='Parámetros'!B2", f["fecha"], 46296)
k.write("A3", "Fin de mes"); k.write_formula("B3", "=EOMONTH(B2,0)", f["fecha"], 46326)
k.write("A4", "Ventas del mes (sin IVA)")
k.write_formula("B4", f'=SUMIFS({R("I")},{R("A")},">="&B2,{R("A")},"<="&B3)', f["eur"], ventas_oct)
k.write("A5", "Objetivo del mes")
k.write_formula("B5", "=SUMIFS(Objetivos!$C$2:$C$31,Objetivos!$A$2:$A$31,B2)", f["eur0"], int(obj_oct))
k.write("A6", "Cumplimiento"); k.write_formula("B6", '=IF(B5=0,"",B4/B5)', f["pct"], ventas_oct / obj_oct)
filtro = f'({R("A")}>=B2)*({R("A")}<=B3)'
k.write("A7", "Facturas distintas")
k.write_dynamic_array_formula("B7:B7", f"=COUNTA(_xlfn.UNIQUE(_xlfn._xlws.FILTER({R('B')},{filtro})))", None, fact_oct)
k.write("A8", "Ticket medio"); k.write_formula("B8", '=IF(B7=0,"",B4/B7)', f["eur"], ventas_oct / fact_oct)
k.write("A9", "Clientes activos")
k.write_dynamic_array_formula("B9:B9", f"=COUNTA(_xlfn.UNIQUE(_xlfn._xlws.FILTER({R('C')},{filtro})))", None,
                              CONTROLES["clientes_oct"])

k.write_row("A11", ["Mes", "Ventas", "Objetivo", "Cumplimiento", "¿Alcanzado?"], f["neg"])
for i, m in enumerate(range(1, 11)):
    r = 12 + i  # fila Excel
    v, o = mensual.loc[m, "Ventas"], mensual.loc[m, "Objetivo"]
    k.write_datetime(f"A{r}", pd.Timestamp(2026, m, 1).to_pydatetime(), f["mes"])
    k.write_formula(f"B{r}", f'=SUMIFS({R("I")},{R("A")},">="&A{r},{R("A")},"<="&EOMONTH(A{r},0))', f["eur0"], v)
    k.write_formula(f"C{r}", f"=SUMIFS(Objetivos!$C$2:$C$31,Objetivos!$A$2:$A$31,A{r})", f["eur0"], o)
    k.write_formula(f"D{r}", f'=IF(C{r}=0,"",B{r}/C{r})', f["pct"], v / o)
    k.write_formula(f"E{r}", f'=IF(B{r}>=C{r},"Sí","No")', None, "Sí" if v >= o else "No")
k.write("A23", "Meses en que se alcanza el objetivo")
k.write_formula("B23", '=COUNTIF(E12:E21,"Sí")', None, CONTROLES["meses_alcanzados"])
k.write("A25", "Comprobaciones", f["neg"])
k.write("A26", "Total de control (Tabla Ventas)")
k.write_formula("B26", f"=SUM({R('I')})", f["eur"], CONTROLES["total_importe"])
k.write("A27", "¿Cuadra la tabla mes a mes?")
k.write_formula("B27", '=IF(ABS(SUM(B12:B21)-B26)<0.01,"OK","Revisar")', None, "OK")

k.write_row("H1", ["Ventas por producto (ene-oct)", "Total", "Zaragoza", "Pamplona", "Lleida"], f["neg"])
tot_prod = ventas.groupby("Producto")["Importe"].sum().sort_values(ascending=False)
pz = ventas.groupby(["Producto", "Zona"])["Importe"].sum()
for i, p in enumerate(tot_prod.index):
    r = 2 + i
    k.write(f"H{r}", p)
    k.write_formula(f"I{r}", f"=SUMIFS({R('I')},{R('G')},H{r})", f["eur0"], tot_prod[p])
    for col, z in zip("JKL", ["Zaragoza", "Pamplona", "Lleida"]):
        k.write_formula(f"{col}{r}", f'=SUMIFS({R("I")},{R("G")},$H{r},{R("D")},"{z}")', f["eur0"], pz.get((p, z), 0))
k.write(f"H{3 + len(tot_prod)}", "Sirve para comprobar la dinámica «Top productos» con y sin la segmentación de Zona.")

# Cuadro (presentación): solo lee de Cálculos
wc.set_column("A:A", 2); wc.set_column("B:I", 16)
meses_choose = ",".join(f'"{m}"' for m in MESES)
conclusion = "se alcanza" if ventas_oct >= obj_oct else "no se alcanza"
wc.write_formula("B1", f"=\"Ventas de \"&CHOOSE(MONTH('Cálculos'!B2),{meses_choose})&\": \"&"
                       f"IF('Cálculos'!B6>=1,\"se alcanza\",\"no se alcanza\")&\" el objetivo\"", f["tit"],
                 f"Ventas de octubre: {conclusion} el objetivo")
tarjetas = [("B", "Ventas (sin IVA)", "='Cálculos'!B4", f["grande"], ventas_oct),
            ("D", "Cumplimiento del objetivo", "='Cálculos'!B6", f["grande_pct"], ventas_oct / obj_oct),
            ("F", "Ticket medio por factura", "='Cálculos'!B8", f["grande_eur2"], ventas_oct / fact_oct),
            ("H", "Clientes activos", "='Cálculos'!B9", f["grande_n"], CONTROLES["clientes_oct"])]
for col, etq, form, fm, val in tarjetas:
    wc.write(f"{col}3", etq, f["etq"])
    wc.write_formula(f"{col}4", form, fm, val)
wc.write("B5", "Objetivo del mes:", f["etq"]); wc.write_formula("C5", "='Cálculos'!B5", f["eur0"], int(obj_oct))
wc.set_row(3, 34)
ch = wb.add_chart({"type": "column"})
ch.add_series({"name": "Ventas", "categories": "='Cálculos'!$A$12:$A$21", "values": "='Cálculos'!$B$12:$B$21",
               "fill": {"color": "#2F5597"}})
ln = wb.add_chart({"type": "line"})
ln.add_series({"name": "Objetivo", "categories": "='Cálculos'!$A$12:$A$21", "values": "='Cálculos'!$C$12:$C$21",
               "line": {"color": "#C55A11", "width": 2.25}})
ch.combine(ln)
ch.set_title({"name": "Ventas frente a objetivo por mes (sin IVA)"})
ch.set_legend({"position": "bottom"})
ch.set_x_axis({"num_format": "mmm"})
ch.set_y_axis({"num_format": '#,##0 "€"', "min": 0})
ch.set_size({"width": 760, "height": 300})
alt = ("Gráfico de columnas y línea: ventas sin IVA de enero a octubre de 2026 frente al objetivo de cada mes. "
       f"Se alcanza el objetivo en {CONTROLES['meses_alcanzados']} de los 10 meses.")
wc.insert_chart("B7", ch, {"description": alt})
wc.write("B23", "Top 5 productos y ventas por familia: dos tablas dinámicas con una segmentación de Zona conectada "
                "a las dos (ver hoja «Cómo se hace»).", f["etq"])
wc.write("B25", "Fuente: programa de gestión (líneas de factura) y presupuesto comercial. Importes sin IVA.", f["etq"])
wc.set_landscape(); wc.fit_to_pages(1, 1); wc.print_area("A1:I26"); wc.set_paper(9)

wh = wb.add_worksheet("Cómo se hace")
wh.set_column("A:A", 120)
PASOS = [
    ("Cómo se hace (lo que xlsxwriter no puede crear: dinámicas, segmentación)", f["titulo"]),
    ("1. Top productos: clic en la Tabla Ventas › Insertar › Tabla dinámica › Hoja de cálculo existente (Cálculos, "
     "por ejemplo N1). Producto a Filas, Importe a Valores (Suma, formato euros). Clic derecho en una cifra › "
     "Ordenar › Ordenar de mayor a menor. Las cinco primeras filas son el top 5.", None),
    ("2. Ventas por familia: otra dinámica de la misma Tabla Ventas: Familia a Filas, Importe a Valores.", None),
    ("3. Segmentación: clic en la dinámica Top productos › Analizar tabla dinámica › Insertar segmentación de datos › "
     "Zona › Aceptar. Con la segmentación seleccionada: pestaña Segmentación › Conexiones de informe › marca las "
     "dos dinámicas. Para revisarlo desde una dinámica: Analizar tabla dinámica › Filtrar › Conexiones de filtro. "
     "Funciona porque las dos dinámicas salen del mismo origen (la Tabla Ventas). Corta y pega la segmentación en "
     "el Cuadro.", None),
    (f"   Comprobación: con Pamplona marcada, el primer producto es «{CONTROLES['top1_pamplona_producto']}» con "
     f"{CONTROLES['top1_pamplona']:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
     + " (columna Pamplona de Cálculos!H:L).", None),
    ("4. Gráfico: ya está en el Cuadro (columnas = ventas, línea = objetivo) sobre la tabla mes a mes de Cálculos. "
     "Texto alternativo: clic derecho en el borde del gráfico › Ver texto alternativo.", None),
    ("5. Impresión: Disposición de página › Orientación › Horizontal; Ajustar área de impresión › Ancho 1 página y "
     "Alto 1 página. Revisar › Comprobar accesibilidad antes de enviar.", None),
    ("6. El mes que viene: cambia Parámetros!B2 a 01/11/2026, actualiza las dinámicas y mira que Cálculos!B27 diga OK.",
     None),
    ("Errores típicos: sumar «Importe con IVA»; dividir entre líneas en vez de facturas distintas (da "
     + f"{CONTROLES['ticket_por_linea_oct (error típico)']:,.2f} € en lugar de {CONTROLES['ticket_medio_oct']:,.2f} €)"
     .replace(",", "X").replace(".", ",").replace("X", ".")
     + "; teclear las cifras en el Cuadro; dejar la segmentación filtrada al entregar.", None),
]
for i, (t, fm) in enumerate(PASOS):
    wh.write(i, 0, t, fm or f["ajuste"])

escribir_datos(wb, f)
wb.close()

for nombre, meta in [
    ("n5-cuadro-de-mando", {"titulo": "N5 · Cuadro de mando de ventas: datos para montar la página del comité",
                            "descripcion": f"Ventas de enero a octubre de 2026 ({NV} líneas de factura) y objetivos por "
                                           "mes y zona para construir un cuadro de mando de una página con 4 "
                                           "indicadores, ventas frente a objetivo, top 5 y segmentación por zona.",
                            "nivel": "n5"}),
    ("n5-cuadro-de-mando-solucion", {"titulo": "N5 · Cuadro de mando de ventas (solución)",
                                     "descripcion": "Solución con Léeme, Parámetros, Cálculos con comprobaciones, "
                                                    "Cuadro de una página con gráfico combinado y texto alternativo, "
                                                    "y los pasos de las dinámicas y la segmentación.",
                                     "nivel": "n5"})]:
    json.dump(meta, open(os.path.join(BASE, nombre + ".meta.json"), "w"), ensure_ascii=False, indent=2)

print(json.dumps(CONTROLES, ensure_ascii=False, indent=1, default=str))

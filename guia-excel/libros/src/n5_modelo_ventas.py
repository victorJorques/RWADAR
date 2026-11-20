#!/usr/bin/env python3
"""Genera la práctica del módulo n5m2 (modelo de datos):

- libros/n5-modelo-ventas.xlsx           -> Instrucciones + cuatro Tablas con nombre en hojas propias:
                                            Ventas (2.000 líneas, 02/01/2025-30/10/2026, tabla de hechos),
                                            Clientes (120), Productos (17) y Calendario (01/01/2025-31/12/2026).
- libros/n5-modelo-ventas-solucion.xlsx  -> los mismos datos, la hoja «Cómo se hace» (relaciones, tabla
                                            dinámica desde el modelo, recuento distinto y medidas DAX) y las
                                            cifras rehechas con fórmulas clásicas (INDICE+COINCIDIR, SUMAR.SI.CONJUNTO,
                                            CONTAR.SI.CONJUNTO) en la hoja «Controles».
  xlsxwriter no sabe crear el modelo de datos ni tablas dinámicas: la solución los describe paso a paso.

Los datos están limpios a propósito: las claves de Clientes, Productos y Calendario son únicas y todas las
claves de Ventas existen en su dimensión. Hay 120 clientes en la dimensión, pero no todos han comprado:
así «Recuento distinto» de CodCliente en Ventas no coincide con las filas de Clientes ni con las líneas de Ventas.
Los totales de control se calculan con pandas desde los datos y se imprimen en JSON al final.
"""
import json
import os
import random
from datetime import date, timedelta

import pandas as pd
import xlsxwriter

random.seed(20261117)
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # libros/

PRODUCTOS = [  # código, descripción, familia, precio de tarifa, (uds mín, uds máx)
    ("CAB-015", "Cable 1,5 mm² (rollo 100 m)", "Cableado", 32.50, (2, 12)),
    ("CAB-025", "Cable 2,5 mm² (rollo 100 m)", "Cableado", 49.90, (2, 12)),
    ("CAB-040", "Cable 4 mm² (rollo 100 m)", "Cableado", 78.40, (1, 6)),
    ("CAB-325", "Manguera 3G2,5 (rollo 100 m)", "Cableado", 139.00, (1, 4)),
    ("CAN-251", "Canaleta 25×16 (2 m)", "Canalización", 2.90, (10, 80)),
    ("CAN-402", "Canaleta 40×25 (2 m)", "Canalización", 4.80, (10, 60)),
    ("TUB-020", "Tubo corrugado 20 mm (100 m)", "Canalización", 19.80, (2, 15)),
    ("BRI-200", "Bridas 200 mm (bolsa de 100)", "Canalización", 3.10, (5, 40)),
    ("MEC-101", "Interruptor simple", "Mecanismos", 4.60, (10, 60)),
    ("MEC-102", "Base de enchufe schuko", "Mecanismos", 5.20, (10, 80)),
    ("MEC-103", "Conmutador de cruce", "Mecanismos", 9.75, (4, 30)),
    ("LED-018", "Downlight LED 18 W", "Iluminación", 14.90, (6, 40)),
    ("LED-036", "Proyector LED 36 W", "Iluminación", 27.50, (2, 16)),
    ("LED-060", "Panel LED 60×60 40 W", "Iluminación", 32.00, (4, 20)),
    ("PRO-216", "Magnetotérmico 2P 16 A", "Protección", 9.80, (4, 24)),
    ("PRO-225", "Magnetotérmico 2P 25 A", "Protección", 10.90, (4, 20)),
    ("PRO-440", "Diferencial 2P 40 A 30 mA", "Protección", 38.50, (1, 8)),
]
FACTOR_COSTE = {"Cableado": 0.78, "Canalización": 0.70, "Mecanismos": 0.66, "Iluminación": 0.64, "Protección": 0.74}
PROVINCIAS = [("Zaragoza", "Zaragoza", 0.36), ("Huesca", "Zaragoza", 0.12), ("Teruel", "Zaragoza", 0.08),
              ("Navarra", "Pamplona", 0.18), ("La Rioja", "Pamplona", 0.07), ("Lleida", "Lleida", 0.19)]
PREFIJOS = ["Instalaciones", "Electricidad", "Montajes Eléctricos", "Electro", "Reformas", "Mantenimientos",
            "Climatización y Electricidad", "Iluminación"]
NOMBRES = ["Moncayo", "Ebro", "Aneto", "Gállego", "Jalón", "Bardenas", "Segre", "Arga", "Cinca", "Huerva",
           "Ribagorza", "Sobrarbe", "Albarracín", "Matarraña", "Monegros", "Aragón", "Noguera", "Pallars",
           "Baztán", "Estella", "Tudela", "Calatayud", "Barbastro", "Jaca", "Alcañiz", "Tarazona", "Ejea",
           "Cervera", "Tàrrega", "Haro", "Nájera", "Olite", "Sangüesa", "Daroca", "Borja", "Caspe"]
SUFIJOS = ["S.L.", "S.L.", "S.L.", "S.L.U.", "S.A.", "y Asociados S.L."]
TIPOS = [("Instalador", 0.6), ("Empresa", 0.3), ("Constructora", 0.1)]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
         "noviembre", "diciembre"]
FESTIVOS = {date(2025, 1, 1), date(2025, 1, 6), date(2025, 4, 18), date(2025, 5, 1), date(2025, 8, 15),
            date(2025, 12, 8), date(2025, 12, 25), date(2026, 1, 1), date(2026, 1, 6), date(2026, 4, 3),
            date(2026, 5, 1), date(2026, 10, 12)}

# --- Productos (dimensión) ---
productos = [{"CodProducto": c, "Producto": d, "Familia": f, "PrecioTarifa": p,
              "CosteUnitario": round(p * FACTOR_COSTE[f], 2)} for c, d, f, p, _ in PRODUCTOS]
RANGO_UDS = {c: r for c, _, _, _, r in PRODUCTOS}

# --- Clientes (dimensión) ---
clientes, usados = [], set()
for i in range(120):
    while True:
        nombre = f"{random.choice(PREFIJOS)} {random.choice(NOMBRES)} {random.choice(SUFIJOS)}"
        if nombre not in usados:
            usados.add(nombre)
            break
    prov, deleg, _ = random.choices(PROVINCIAS, weights=[p[2] for p in PROVINCIAS])[0]
    tipo = random.choices([t[0] for t in TIPOS], weights=[t[1] for t in TIPOS])[0]
    clientes.append({"CodCliente": f"C-{1001 + i}", "Cliente": nombre, "Tipo": tipo, "Provincia": prov,
                     "Delegación": deleg})
# 11 clientes de la ficha no han comprado nunca en el periodo (altas recientes o inactivos)
sin_compras = set(random.sample([c["CodCliente"] for c in clientes], 11))
compradores = [c["CodCliente"] for c in clientes if c["CodCliente"] not in sin_compras]
peso_cliente = {c: random.choice([1, 1, 1, 2, 2, 3, 5, 8]) for c in compradores}

# --- Calendario (dimensión) ---
calendario, d = [], date(2025, 1, 1)
while d <= date(2026, 12, 31):
    calendario.append({"Fecha": d, "Año": d.year, "NumMes": d.month, "Mes": MESES[d.month - 1],
                       "Trimestre": f"T{(d.month - 1) // 3 + 1}"})
    d += timedelta(days=1)

# --- Ventas (hechos) ---
dias, d = [], date(2025, 1, 2)
while d <= date(2026, 10, 30):
    if d.weekday() < 5 and d not in FESTIVOS:
        dias.append(d)
    d += timedelta(days=1)
pesos_dia = [(0.6 if x.month == 8 else 1.0) * (1.1 if x.year == 2026 else 1.0) for x in dias]
fechas = sorted(random.choices(dias, weights=pesos_dia, k=2000))
prod_idx = {p["CodProducto"]: p for p in productos}
ventas = []
for n, f in enumerate(fechas, start=1):
    cli = random.choices(compradores, weights=[peso_cliente[c] for c in compradores])[0]
    cod = random.choice(list(prod_idx))
    p = prod_idx[cod]
    umin, umax = RANGO_UDS[cod]
    uds = random.randint(umin, umax)
    dto = random.choice([0, 0, 0, 0.05, 0.08, 0.10, 0.12])
    ventas.append({"IdLinea": f"V-{n:05d}", "Fecha": f, "CodCliente": cli, "CodProducto": cod, "Unidades": uds,
                   "Importe": round(uds * p["PrecioTarifa"] * (1 - dto), 2),
                   "Coste": round(uds * p["CosteUnitario"], 2)})

# --- Totales de control (pandas, desde los datos) ---
V, C, P = pd.DataFrame(ventas), pd.DataFrame(clientes), pd.DataFrame(productos)
assert C.CodCliente.is_unique and P.CodProducto.is_unique
M = V.merge(C, on="CodCliente", how="left", validate="many_to_one").merge(P, on="CodProducto", how="left",
                                                                         validate="many_to_one")
assert M.Provincia.notna().all() and M.Familia.notna().all()
M["Año"] = pd.to_datetime(M.Fecha).dt.year
ilu = M[M.Familia == "Iluminación"]
controles = {
    "ventas_totales": round(M.Importe.sum(), 2),
    "cableado_navarra": round(M[(M.Familia == "Cableado") & (M.Provincia == "Navarra")].Importe.sum(), 2),
    "clientes_distintos": int(M.CodCliente.nunique()),
    "clientes_zaragoza_2026": int(M[(M.Provincia == "Zaragoza") & (M.Año == 2026)].CodCliente.nunique()),
    "margen_pct_iluminacion": round((ilu.Importe.sum() - ilu.Coste.sum()) / ilu.Importe.sum() * 100, 2),
    "lineas": len(M), "clientes_ficha": len(C),
    "cuenta_lineas_zaragoza_2026": int(len(M[(M.Provincia == "Zaragoza") & (M.Año == 2026)])),
    "media_pct_fila_iluminacion": round(((ilu.Importe - ilu.Coste) / ilu.Importe).mean() * 100, 2),
}


# --- Escritura ---
def libro(nombre, solucion):
    wb = xlsxwriter.Workbook(os.path.join(BASE, nombre))
    tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E79"})
    neg = wb.add_format({"bold": True})
    txt = wb.add_format({"text_wrap": True, "valign": "top"})
    fec = wb.add_format({"num_format": "dd/mm/yyyy"})
    eur = wb.add_format({"num_format": "#,##0.00 €"})
    pct = wb.add_format({"num_format": "0.00%"})
    ent = wb.add_format({"num_format": "#,##0"})

    ins = wb.add_worksheet("Instrucciones")
    ins.set_column("A:A", 110)
    lineas = [
        ("Práctica N5 · El modelo de datos de ventas de Electro Cierzo", tit),
        ("Encargo de Carmen Soler (Dirección general): «Para el comité quiero las ventas por provincia y familia, "
         "cuántos clientes distintos nos compran y el margen. Sin pegar columnas con BUSCARX: que se actualice solo.»", txt),
        ("Qué hay en el libro: cuatro Tablas con nombre, cada una en su hoja.", neg),
        ("• Ventas (tabla de hechos): una fila por línea de albarán, 2.000 líneas del 02/01/2025 al 30/10/2026. "
         "Columnas: IdLinea, Fecha, CodCliente, CodProducto, Unidades, Importe (sin IVA) y Coste.", txt),
        ("• Clientes (dimensión): 120 clientes con CodCliente único, Tipo, Provincia y Delegación.", txt),
        ("• Productos (dimensión): 17 artículos con CodProducto único, Familia, PrecioTarifa y CosteUnitario.", txt),
        ("• Calendario (dimensión): una fila por día del 01/01/2025 al 31/12/2026, con Año, NumMes, Mes y Trimestre.", txt),
        ("Necesitas Excel para Windows (Microsoft 365, 2024, 2021, 2019 o 2016). En Mac y en Excel para la web no hay "
         "modelo de datos ni Power Pivot.", txt),
        ("Pasos (intenta hacerlo en menos de 25 minutos):", neg),
        ("1. Datos › Relaciones › Nuevo. Crea tres relaciones (Tabla y Columna (externa) = lado de varios; Tabla "
         "relacionada y Columna relacionada (principal) = la dimensión):\n"
         "   Ventas[CodCliente] → Clientes[CodCliente] · Ventas[CodProducto] → Productos[CodProducto] · "
         "Ventas[Fecha] → Calendario[Fecha].", txt),
        ("2. Haz clic dentro de la Tabla Ventas › Insertar › Tabla dinámica › Nueva hoja de cálculo y marca la casilla "
         "«Agregar estos datos al modelo de datos». En el panel Campos de tabla dinámica verás las cuatro tablas del modelo.", txt),
        ("3. Ventas por provincia y familia: Provincia (Clientes) en Filas, Familia (Productos) en Columnas e Importe "
         "(Ventas) en Valores, como Suma.", txt),
        ("4. Clientes distintos: segunda tabla dinámica del modelo con Provincia en Filas y CodCliente (de Ventas) en "
         "Valores › Configuración de campo de valor › Resumir valores por › Recuento distinto. Pon Año (Calendario) "
         "como filtro para ver solo 2026.", txt),
        ("5. Medidas (pestaña Power Pivot › Medidas › Nueva medida; si no la ves: Archivo › Opciones › Complementos › "
         "Administrar: Complementos COM › Ir › marca la casilla de Power Pivot). En la tabla Ventas crea:\n"
         "   Total ventas := SUM(Ventas[Importe])\n   Total coste := SUM(Ventas[Coste])\n"
         "   Margen := [Total ventas] - [Total coste]\n   Margen % := DIVIDE([Margen]; [Total ventas])  (formato porcentaje)\n"
         "   Las funciones DAX van en inglés. Si Excel marca error de sintaxis en DIVIDE, cambia el ; por una coma "
         "(depende de la configuración de Windows).", txt),
        ("6. Pon Familia en Filas y la medida Margen % en Valores.", txt),
        ("Cómo comprobar: responde en la app con estas cifras (todo el periodo salvo que se diga otra cosa):", neg),
        ("a) Ventas totales (€) · b) Ventas de Cableado en Navarra (€) · c) Clientes distintos que han comprado · "
         "d) Clientes distintos de la provincia de Zaragoza con compras en 2026 · e) Margen % de Iluminación.", txt),
        ("Si en c) te sale 2.000 o un número de líneas, estás contando filas de Ventas, no clientes: usa Recuento "
         "distinto. Si en e) te sale otro %, comprueba que es la medida (margen total ÷ ventas totales) y no una "
         "media de porcentajes.", txt),
    ]
    for i, (t, f) in enumerate(lineas):
        ins.write(i, 0, t, f)
        if f is txt:
            ins.set_row(i, 15 * max(1, t.count("\n") + 1 + len(t) // 120))

    def tabla(nombre_hoja, filas, columnas, formatos, anchos, extra=None):
        ws = wb.add_worksheet(nombre_hoja)
        cab = [c for c in columnas] + ([e[0] for e in extra] if extra else [])
        for r, fila in enumerate(filas, start=1):
            for c, col in enumerate(columnas):
                v = fila[col]
                if isinstance(v, date):
                    ws.write_datetime(r, c, pd.Timestamp(v).to_pydatetime(), fec)
                else:
                    ws.write(r, c, v, formatos.get(col))
            if extra:
                for k, (_, fun, fmt) in enumerate(extra):
                    ws.write_formula(r, len(columnas) + k, fun(r + 1), fmt)
        ws.add_table(0, 0, len(filas), len(cab) - 1, {"name": nombre_hoja, "style": "Table Style Medium 2",
                                                     "columns": [{"header": h} for h in cab]})
        for col, w in anchos.items():
            ws.set_column(f"{col}:{col}", w)
        ws.freeze_panes(1, 0)
        return ws

    n = len(ventas) + 1
    nc = len(clientes) + 1
    np_ = len(productos) + 1
    extra_v = extra_c = None
    if solucion:
        extra_v = [("Provincia (aux)", lambda r: f"=INDEX(Clientes!$D$2:$D${nc},MATCH(C{r},Clientes!$A$2:$A${nc},0))", None),
                   ("Familia (aux)", lambda r: f"=INDEX(Productos!$C$2:$C${np_},MATCH(D{r},Productos!$A$2:$A${np_},0))", None),
                   ("Año (aux)", lambda r: f"=YEAR(B{r})", None)]
        extra_c = [("Líneas (aux)", lambda r: f"=COUNTIF(Ventas!$C$2:$C${n},A{r})", ent),
                   ("Líneas 2026 (aux)", lambda r: f"=COUNTIFS(Ventas!$C$2:$C${n},A{r},Ventas!$J$2:$J${n},2026)", ent)]
    tabla("Ventas", ventas, ["IdLinea", "Fecha", "CodCliente", "CodProducto", "Unidades", "Importe", "Coste"],
          {"Importe": eur, "Coste": eur}, {"A": 10, "B": 12, "C": 12, "D": 13, "E": 10, "F": 12, "G": 12,
                                           "H": 15, "I": 14, "J": 10}, extra_v)
    tabla("Clientes", clientes, ["CodCliente", "Cliente", "Tipo", "Provincia", "Delegación"], {},
          {"A": 12, "B": 44, "C": 13, "D": 12, "E": 12, "F": 13, "G": 16}, extra_c)
    tabla("Productos", productos, ["CodProducto", "Producto", "Familia", "PrecioTarifa", "CosteUnitario"],
          {"PrecioTarifa": eur, "CosteUnitario": eur}, {"A": 13, "B": 32, "C": 14, "D": 13, "E": 14})
    tabla("Calendario", calendario, ["Fecha", "Año", "NumMes", "Mes", "Trimestre"], {},
          {"A": 12, "B": 8, "C": 9, "D": 12, "E": 10})

    if solucion:
        cs = wb.add_worksheet("Cómo se hace")
        cs.set_column("A:A", 110)
        pasos = [
            ("Solución comentada", tit),
            ("1. Relaciones (Datos › Relaciones › Nuevo), tres, todas de uno a varios con la dimensión como principal:", neg),
            ("   Tabla: Ventas · Columna (externa): CodCliente · Tabla relacionada: Clientes · Columna relacionada (principal): CodCliente", txt),
            ("   Tabla: Ventas · Columna (externa): CodProducto · Tabla relacionada: Productos · Columna relacionada (principal): CodProducto", txt),
            ("   Tabla: Ventas · Columna (externa): Fecha · Tabla relacionada: Calendario · Columna relacionada (principal): Fecha", txt),
            ("   Resultado: un esquema en estrella. Ventas en el centro; Clientes, Productos y Calendario alrededor.", txt),
            ("2. Insertar › Tabla dinámica desde Ventas con «Agregar estos datos al modelo de datos». En Campos de tabla dinámica: "
             "Clientes[Provincia] a Filas, Productos[Familia] a Columnas, Ventas[Importe] a Valores (Suma).", txt),
            ("3. Recuento distinto: Ventas[CodCliente] a Valores › Configuración de campo de valor › Recuento distinto. "
             "Filtro: Calendario[Año] = 2026 para el control d). Cuenta (sin «distinto») daría líneas, no clientes.", txt),
            ("4. Medidas en la tabla Ventas: Total ventas := SUM(Ventas[Importe]) · Total coste := SUM(Ventas[Coste]) · "
             "Margen := [Total ventas] - [Total coste] · Margen % := DIVIDE([Margen]; [Total ventas]).", txt),
            ("   La medida se recalcula en cada celda de la tabla dinámica con el filtro de esa celda (por ejemplo, solo "
             "Iluminación): por eso el margen % sale bien en cada fila y en el total. La media de los % de cada línea "
             "daría otra cifra (ver hoja Controles).", txt),
            ("5. Las hojas de datos de este archivo llevan columnas «(aux)» con fórmulas clásicas solo para comprobar las "
             "cifras sin modelo de datos. En el modelo NO hacen falta: las relaciones las sustituyen.", txt),
        ]
        for i, (t, f) in enumerate(pasos):
            cs.write(i, 0, t, f)

        ct = wb.add_worksheet("Controles")
        ct.set_column("A:A", 62)
        ct.set_column("B:C", 16)
        ct.write_row(0, 0, ["Control", "Fórmula", "Valor esperado"], neg)
        filas = [
            ("a) Ventas totales (€)", f"=SUM(Ventas!F2:F{n})", controles["ventas_totales"], eur),
            ("b) Ventas de Cableado en Navarra (€)",
             f'=SUMIFS(Ventas!F2:F{n},Ventas!I2:I{n},"Cableado",Ventas!H2:H{n},"Navarra")', controles["cableado_navarra"], eur),
            ("c) Clientes distintos con compras", f'=COUNTIF(Clientes!F2:F{nc},">0")', controles["clientes_distintos"], ent),
            ("d) Clientes distintos de Zaragoza con compras en 2026",
             f'=COUNTIFS(Clientes!D2:D{nc},"Zaragoza",Clientes!G2:G{nc},">0")', controles["clientes_zaragoza_2026"], ent),
            ("e) Margen % de Iluminación (margen total ÷ ventas totales)",
             f'=(SUMIFS(Ventas!F2:F{n},Ventas!I2:I{n},"Iluminación")-SUMIFS(Ventas!G2:G{n},Ventas!I2:I{n},"Iluminación"))'
             f'/SUMIFS(Ventas!F2:F{n},Ventas!I2:I{n},"Iluminación")', controles["margen_pct_iluminacion"] / 100, pct),
            ("Trampa: líneas de Zaragoza en 2026 (lo que da «Cuenta», no clientes)",
             f'=COUNTIFS(Ventas!H2:H{n},"Zaragoza",Ventas!J2:J{n},2026)', controles["cuenta_lineas_zaragoza_2026"], ent),
        ]
        for i, (t, fml, val, fmt) in enumerate(filas, start=1):
            ct.write(i, 0, t)
            ct.write_formula(i, 1, fml, fmt, val)
            ct.write(i, 2, val, fmt)
        ct.write(len(filas) + 2, 0, "La columna Fórmula debe coincidir con Valor esperado.")
    wb.close()


libro("n5-modelo-ventas.xlsx", False)
libro("n5-modelo-ventas-solucion.xlsx", True)
meta = {
    "n5-modelo-ventas": {"titulo": "N5 · Modelo de datos de ventas: relaciones, recuento distinto y medidas",
                         "descripcion": "Cuatro Tablas (Ventas con 2.000 líneas, Clientes, Productos y Calendario) para "
                                        "relacionarlas en un modelo de datos y sacar ventas por provincia y familia, "
                                        "clientes distintos y margen % con medidas.",
                         "nivel": "n5"},
    "n5-modelo-ventas-solucion": {"titulo": "N5 · Modelo de datos de ventas (solución)",
                                  "descripcion": "Las relaciones, la tabla dinámica del modelo y las medidas paso a "
                                                 "paso, con las cifras de control rehechas con fórmulas clásicas.",
                                  "nivel": "n5"},
}
for k, v in meta.items():
    with open(os.path.join(BASE, k + ".meta.json"), "w", encoding="utf-8") as fh:
        json.dump(v, fh, ensure_ascii=False, indent=2)
print(json.dumps(controles, ensure_ascii=False, indent=1))

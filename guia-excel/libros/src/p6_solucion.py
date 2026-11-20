# -*- coding: utf-8 -*-
"""
P6 · Stock, punto de pedido y clasificación ABC · SOLUCIÓN
==========================================================

1. Lee los datos SUCIOS tal como los recibe la alumna (libros/p6-datos.xlsx y
   libros/p6-movimientos.csv) y los limpia con las reglas del encargo y las aclaraciones
   de Andrés (pandas). Comprueba la limpieza contra libros/src/p6-verdad.json.
2. Calcula los totales de control (pandas) y los guarda en libros/src/p6-controles.json.
3. Genera libros/p6-solucion.xlsx con fórmulas reales de Excel (en el archivo, en inglés y con
   comas; las modernas con prefijo _xlfn./_xlpm.). Lo que la librería no puede crear (consultas
   de Power Query, Tabla de datos, Administrador de escenarios, gráfico de Pareto estadístico)
   se explica paso a paso en la hoja «Cómo se hizo»; las hojas «Mov» y «Calc» contienen la
   salida que dan esas consultas, y encima van las fórmulas.

Uso:  python3 p6_solucion.py
"""
import json
import math
import os
import re
from datetime import date, datetime
from statistics import NormalDist

import numpy as np
import pandas as pd
import xlsxwriter
from xlsxwriter.utility import xl_col_to_name

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
DATOS = os.path.join(LIBROS, "p6-datos.xlsx")
CSV = os.path.join(LIBROS, "p6-movimientos.csv")
SALIDA = os.path.join(LIBROS, "p6-solucion.xlsx")
CONTROLES = os.path.join(AQUI, "p6-controles.json")
VERDAD = json.load(open(os.path.join(AQUI, "p6-verdad.json"), encoding="utf-8"))

# ---------------------------------------------------------------------------
# Parámetros pactados (aclaraciones de Andrés)
# ---------------------------------------------------------------------------
CORTE = date(2026, 10, 31)
INICIO = date(2026, 5, 1)
FESTIVOS = [date(2026, 5, 1), date(2026, 10, 12)]
DIAS_LAB = int(np.busday_count(INICIO, date(2026, 11, 1), holidays=FESTIVOS))   # = DIAS.LAB(01/05;31/10;Festivos)
assert DIAS_LAB == 129
SEMANAS = list(range(19, 45))      # 26 semanas ISO completas (04/05 a 30/10)
DIAS_SEMANA, R_DIAS = 5, 5
CORTE_A, CORTE_B = 0.80, 0.95
NIVEL = {"A": 0.95, "B": 0.95, "C": 0.90}
DIAS_MUERTO = 90
FACTOR_ANUAL = 52 / len(SEMANAS)
TIPOS = [  # TipoOriginal (limpio: sin espacios y en mayúsculas), Tipo, Signo, FactorConsumo, explicación
    ("SAL", "SAL", -1, 1, "Venta: resta stock y es consumo"),
    ("SALIDA", "SAL", -1, 1, "Venta escrita como «Salida» (terminal de Pamplona)"),
    ("ENT", "ENT", 1, 0, "Compra recibida: suma stock; no es consumo"),
    ("DEV", "DEV", 1, -1, "Devolución de cliente: suma stock y RESTA consumo"),
    ("DPR", "DPR", -1, 0, "Devolución a proveedor: resta stock; no es consumo"),
    ("REG+", "REG+", 1, 0, "Regularización positiva: suma stock; no es consumo"),
    ("REG-", "REG-", -1, 0, "Regularización negativa: resta stock; no es consumo"),
    ("TRA", "TRA", 0, 0, "Traspaso entre almacenes: el stock de la empresa no cambia"),
]
nd = NormalDist()


def es(x, dec=2):
    """Número con formato español: 1.234.567,89"""
    return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")

# ---------------------------------------------------------------------------
# 1. Limpieza (como la haría la alumna)
# ---------------------------------------------------------------------------
raw = pd.read_csv(CSV, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
FILAS_CSV = len(raw)
mov = raw.copy()
mov["FechaD"] = [datetime.strptime(x, "%Y-%m-%d").date() if "-" in x else datetime.strptime(x, "%d/%m/%Y").date() for x in mov["Fecha"]]
assert mov["FechaD"].between(INICIO, CORTE).all()
mov["TipoOriginal"] = mov["Tipo"].str.strip().str.upper()
mapa = {t[0]: t[1:] for t in TIPOS}
assert set(mov["TipoOriginal"]) <= set(mapa), set(mov["TipoOriginal"]) - set(mapa)
mov["TipoN"] = mov["TipoOriginal"].map(lambda t: mapa[t][0])
mov["Signo"] = mov["TipoOriginal"].map(lambda t: mapa[t][1])
mov["FactorConsumo"] = mov["TipoOriginal"].map(lambda t: mapa[t][2])
mov["CantidadN"] = mov["Cantidad"].str.replace(".", ",", regex=False).str.replace(",", ".", regex=False).astype(float)
mov["LineaN"] = mov["Línea"].astype(int)
dup = mov.duplicated(["Documento", "LineaN"], keep="first")
N_DUP = int(dup.sum())
assert N_DUP == 63 and (mov.loc[dup, "FechaD"] == date(2026, 7, 31)).all()
mov = mov[~dup].copy()
mov["CantidadFirmada"] = mov["CantidadN"].abs() * mov["Signo"]
mov["Consumo"] = mov["CantidadN"].abs() * mov["FactorConsumo"]
mov["Semana"] = [d.isocalendar()[1] for d in mov["FechaD"]]
assert abs(mov.loc[mov["TipoN"] == "TRA", "CantidadN"].sum()) < 1e-9
assert len(mov) == VERDAD["movimientos_unicos"]

inv_raw = pd.read_excel(DATOS, sheet_name="Inventario_30-04", dtype={"CodArticulo": object})
N_INV = len(inv_raw)
N_COD_NUM = int(sum(not isinstance(c, str) for c in inv_raw["CodArticulo"]))
inv_raw["Cod"] = [c if isinstance(c, str) else f"{int(c):06d}" for c in inv_raw["CodArticulo"]]
inv = inv_raw.groupby("Cod", sort=True).agg(Descripcion=("Descripción", "first"), Unidad=("Unidad", "first"),
                                           Ubicaciones=("Ubicación", "count"), Stock3004=("StockContado", "sum")).reset_index()
assert len(inv) == 180
N_DOBLES = int((inv["Ubicaciones"] == 2).sum())
fic = pd.read_excel(DATOS, sheet_name="Fichas", dtype={"CodArticulo": str})
prov = pd.read_excel(DATOS, sheet_name="Proveedores")
rec = pd.read_excel(DATOS, sheet_name="Recuento_31-10", dtype={"CodArticulo": str})
N_PLAZO_VACIO = int(fic["PlazoEntrega"].isna().sum())
plazo_prov = dict(zip(prov["Proveedor"], prov["PlazoHabitual"]))
fic["PlazoBase"] = [int(p) if not pd.isna(p) else int(plazo_prov[pv]) for p, pv in zip(fic["PlazoEntrega"], fic["Proveedor"])]

# ---------------------------------------------------------------------------
# 2. Cálculo por artículo
# ---------------------------------------------------------------------------
a = inv.copy()
a["MovNeto"] = a["Cod"].map(mov.groupby("CodArticulo")["CantidadFirmada"].sum()).fillna(0.0)
a["StockTeorico"] = a["Stock3004"] + a["MovNeto"]
recd = dict(zip(rec["CodArticulo"], rec["StockFísico"]))
a["EnRecuento"] = a["Cod"].isin(recd).astype(int)
a["Ajuste"] = [recd[c] - s if c in recd else 0.0 for c, s in zip(a["Cod"], a["StockTeorico"])]
a["Stock"] = a["StockTeorico"] + a["Ajuste"]
f = fic.set_index("CodArticulo")
a["ConFicha"] = a["Cod"].isin(f.index).astype(int)
for col_a, col_f, defecto in [("Proveedor", "Proveedor", "SIN FICHA"), ("PlazoBase", "PlazoBase", 0), ("LoteMin", "LoteMinimo", 0),
                              ("Multiplo", "Multiplo", 1), ("Coste", "CosteUnitario", 0.0), ("Pendiente", "PendienteRecibir", 0.0)]:
    a[col_a] = [f.at[c, col_f] if c in f.index else defecto for c in a["Cod"]]
a["Consumo"] = a["Cod"].map(mov.groupby("CodArticulo")["Consumo"].sum()).fillna(0.0)
matriz = mov.pivot_table(index="CodArticulo", columns="Semana", values="Consumo", aggfunc="sum")
matriz = matriz.reindex(index=a["Cod"], columns=SEMANAS).fillna(0.0)
assert abs(matriz.values.sum() - mov["Consumo"].sum()) < 1e-6
a["SigmaSem"] = matriz.std(axis=1, ddof=1).values
a["SigmaSoloVentas"] = [np.std([v for v in fila if v != 0], ddof=1) if sum(v != 0 for v in fila) > 1 else 0.0 for fila in matriz.values]
a["DemandaDia"] = a["Consumo"] / DIAS_LAB
a["ValorAnual"] = np.where(a["ConFicha"] == 1, (a["Consumo"] * a["Coste"] * FACTOR_ANUAL).round(2), 0.0)
tot = a["ValorAnual"].sum()
a["Acum"] = [a.loc[a["ValorAnual"] >= v, "ValorAnual"].sum() / tot if cf else np.nan for v, cf in zip(a["ValorAnual"], a["ConFicha"])]
a["Clase"] = [("A" if x <= CORTE_A else "B" if x <= CORTE_B else "C") if cf else "Sin ficha" for x, cf in zip(a["Acum"], a["ConFicha"])]


def modelo(df, retraso_tormes=0, r_dias=R_DIAS, nivel_unico=None, sin_pendiente=False):
    out = pd.DataFrame(index=df.index)
    out["Plazo"] = df["PlazoBase"] + np.where(df["Proveedor"] == "Tormes", retraso_tormes, 0)
    niv = [nivel_unico if nivel_unico else NIVEL.get(c, 0) for c in df["Clase"]]
    out["Nivel"] = niv
    out["z"] = [nd.inv_cdf(n) if cf else 0.0 for n, cf in zip(niv, df["ConFicha"])]
    arg = out["z"] * df["SigmaSem"] / math.sqrt(DIAS_SEMANA) * np.sqrt(out["Plazo"])
    out["_argSS"] = arg
    out["SS"] = np.where(df["ConFicha"] == 1, np.ceil(arg - 1e-12), 0.0)
    out["ROP"] = df["DemandaDia"] * out["Plazo"] + out["SS"]
    out["S_max"] = out["ROP"] + df["DemandaDia"] * r_dias
    out["Posicion"] = df["Stock"] + (0 if sin_pendiente else df["Pendiente"])
    out["Pedir"] = (df["ConFicha"] == 1) & (df["DemandaDia"] > 0) & (out["Posicion"] <= out["ROP"])
    falta = out["S_max"] - out["Posicion"]
    out["_argCeil"] = falta / df["Multiplo"]
    out["Cantidad"] = np.where(out["Pedir"], np.maximum(df["LoteMin"], np.ceil(falta / df["Multiplo"] - 1e-12) * df["Multiplo"]), 0.0)
    out["Importe"] = out["Cantidad"] * df["Coste"]
    return out


base = modelo(a)
a = pd.concat([a, base], axis=1)
a["ValorStock"] = a["Stock"] * a["Coste"]
a["ValorSS"] = a["SS"] * a["Coste"]
ult = mov[mov["TipoN"] == "SAL"].groupby("CodArticulo")["FechaD"].max()
a["UltimaSalida"] = a["Cod"].map(ult)
a["Muerto"] = [(s > 0) and (pd.isna(u) or (CORTE - u).days > DIAS_MUERTO) for s, u in zip(a["Stock"], a["UltimaSalida"])]

# márgenes numéricos (para que Excel y pandas no puedan discrepar por redondeos)
cf = a["ConFicha"] == 1
marg_ss = (a.loc[cf & (a["_argSS"] > 0), "_argSS"] % 1).apply(lambda x: min(x, 1 - x)).min()
marg_ceil = (a.loc[a["Pedir"], "_argCeil"] % 1).apply(lambda x: min(x, 1 - x)).min()
marg_rop = (a.loc[cf & (a["DemandaDia"] > 0), "ROP"] - a.loc[cf & (a["DemandaDia"] > 0), "Posicion"]).abs().min()
marg_acum = min(abs(a.loc[cf, "Acum"] - CORTE_A).min(), abs(a.loc[cf, "Acum"] - CORTE_B).min())
print(f"márgenes: SS {marg_ss:.4f} · múltiplo {marg_ceil:.4f} · ROP-posición {marg_rop:.4f} · ABC {marg_acum:.5f}")
assert marg_ss > 1e-6 and marg_ceil > 1e-6 and marg_rop > 1e-6 and marg_acum > 1e-6

# comprobación contra la verdad del generador
for c, s in zip(a["Cod"], a["StockTeorico"]):
    assert abs(s - VERDAD["stock_fin_teorico"][c]) < 1e-9, c
for c, s in zip(a["Cod"], a["Consumo"]):
    assert abs(s - VERDAD["consumo"][c]) < 1e-9, c
assert sorted(a.loc[a["Muerto"], "Cod"]) == sorted(VERDAD["muertos"])
assert sorted(a.loc[a["ConFicha"] == 0, "Cod"]) == sorted(VERDAD["sin_ficha"])
assert (a["Stock"] >= 0).all()

# escenarios y sensibilidad
esc5 = modelo(a, retraso_tormes=5)
esc_cierre = modelo(a, retraso_tormes=12, r_dias=10)
sin_pend = modelo(a, sin_pendiente=True)
sens = {}
for niv in (0.90, 0.95, 0.975, 0.99):
    m = modelo(a, nivel_unico=niv)
    sens[niv] = float((m["SS"] * a["Coste"]).sum())

# errores típicos (impacto)
inv_quitando = inv_raw.drop_duplicates("Cod")          # «Quitar duplicados» sobre el inventario
err_quitar_inv = float(((inv_raw.groupby("Cod")["StockContado"].sum() - inv_quitando.set_index("Cod")["StockContado"])
                        * a.set_index("Cod")["Coste"]).sum())
mov_dup = raw.copy()
mov_dup["CantidadN"] = mov_dup["Cantidad"].str.replace(".", ",", regex=False).str.replace(",", ".", regex=False).astype(float)
mov_dup["TipoOriginal"] = mov_dup["Tipo"].str.strip().str.upper()
mov_dup["CF"] = mov_dup["CantidadN"].abs() * mov_dup["TipoOriginal"].map(lambda t: mapa[t][1])
err_dup_val = float(((mov_dup.groupby("CodArticulo")["CF"].sum() - mov.groupby("CodArticulo")["CantidadFirmada"].sum())
                     .reindex(a["Cod"]).fillna(0).values * a["Coste"].values).sum())
q05_mal = raw[raw["Cantidad"].str.contains(r"\.", regex=True)].copy()       # si «12.5» se leyera como 125
q05_mal["bien"] = q05_mal["Cantidad"].astype(float)
q05_mal["mal"] = q05_mal["Cantidad"].str.replace(".", "", regex=False).astype(float)
sigma_sin_ceros = modelo(a.assign(SigmaSem=a["SigmaSoloVentas"]))
neg_sin_arreglar = len(VERDAD["negativos_si_no_se_arregla"])
claves_sin_arreglar = int(inv_raw["CodArticulo"].map(lambda c: c if isinstance(c, str) else str(int(c))).nunique())   # 184: 731 y 000731 son claves distintas

# ---------------------------------------------------------------------------
# 3. Totales de control
# ---------------------------------------------------------------------------
abc_n = a["Clase"].value_counts().to_dict()
abc_v = a.groupby("Clase")["ValorAnual"].sum().to_dict()
prop = a[a["Cantidad"] > 0]
ctl = {
    "filas_csv": FILAS_CSV,
    "duplicados": N_DUP,
    "movimientos": len(mov),
    "filas_inventario": N_INV,
    "codigos_como_numero": N_COD_NUM,
    "articulos": len(a),
    "dobles": N_DOBLES,
    "plazos_vacios": N_PLAZO_VACIO,
    "sin_ficha": int((a["ConFicha"] == 0).sum()),
    "valor_stock": round(float(a["ValorStock"].sum()), 2),
    "valor_stock_teorico": round(float((a["StockTeorico"] * a["Coste"]).sum()), 2),
    "recuento_cuadran": int(((a["EnRecuento"] == 1) & (a["Ajuste"].abs() < 1e-9)).sum()),
    "ajustes_recuento": {r.Descripcion: float(r.Ajuste) for r in a[(a["EnRecuento"] == 1) & (a["Ajuste"].abs() > 1e-9)].itertuples()},
    "abc_n": abc_n,
    "abc_pct_valor": {k: round(v / tot, 4) for k, v in abc_v.items() if k != "Sin ficha"},
    "consumo_anual_valor": round(float(tot), 2),
    "muertos": int(a["Muerto"].sum()),
    "valor_muertos": round(float(a.loc[a["Muerto"], "ValorStock"].sum()), 2),
    "muertos_sin_ventas": int((a["Muerto"] & a["UltimaSalida"].isna()).sum()),
    "lineas_pedido": int(len(prop)),
    "importe_pedido": round(float(prop["Importe"].sum()), 2),
    "pedido_por_proveedor": {k: [int(len(g)), round(float(g["Importe"].sum()), 2)] for k, g in prop.groupby("Proveedor")},
    "valor_ss": round(float(a["ValorSS"].sum()), 2),
    "sensibilidad_ss": {str(k): round(v, 2) for k, v in sens.items()},
    "esc_tormes5": [int((esc5["Cantidad"] > 0).sum()), round(float(esc5["Importe"].sum()), 2)],
    "esc_tormes5_tormes": [int(((esc5["Cantidad"] > 0) & (a["Proveedor"] == "Tormes")).sum()), round(float(esc5.loc[a["Proveedor"] == "Tormes", "Importe"].sum()), 2)],
    "base_tormes": [int(((a["Cantidad"] > 0) & (a["Proveedor"] == "Tormes")).sum()), round(float(a.loc[a["Proveedor"] == "Tormes", "Importe"].sum()), 2)],
    "esc_cierre": [int((esc_cierre["Cantidad"] > 0).sum()), round(float(esc_cierre["Importe"].sum()), 2)],
    "esc_cierre_tormes": [int(((esc_cierre["Cantidad"] > 0) & (a["Proveedor"] == "Tormes")).sum()), round(float(esc_cierre.loc[a["Proveedor"] == "Tormes", "Importe"].sum()), 2)],
    "sin_pendiente": [int((sin_pend["Cantidad"] > 0).sum()), round(float(sin_pend["Importe"].sum()), 2)],
    "con_pendiente_n": int((a["Pendiente"] > 0).sum()),
    "sigma_sin_ceros": [int((sigma_sin_ceros["Cantidad"] > 0).sum()), round(float((sigma_sin_ceros["SS"] * a["Coste"]).sum()), 2)],
    "err_quitar_inv": round(err_quitar_inv, 2),
    "err_duplicados_valor": round(err_dup_val, 2),
    "q05_filas": int(len(q05_mal)),
    "negativos_sin_arreglar_codigos": neg_sin_arreglar,
    "claves_sin_arreglar_codigos": claves_sin_arreglar,
    "stock_negativo": int((a["Stock"] < 0).sum()),
    "rotacion_global": round(float(tot / (((a["Stock3004"] + a["Stock"]) / 2 * a["Coste"]).sum())), 2),
    "cobertura_dias_global": round(float(a["ValorStock"].sum() / (a["Consumo"] * a["Coste"]).sum() * DIAS_LAB), 1),
    "rojos": int(((a["ConFicha"] == 1) & (a["DemandaDia"] > 0) & (a["Stock"] / a["DemandaDia"].replace(0, np.nan) < a["Plazo"])).sum()),
    "stock_cero_con_venta": int(((a["Stock"] == 0) & (a["DemandaDia"] > 0)).sum()),
    "frontera": a.loc[a["Cod"] == VERDAD["frontera"], ["Cod", "Descripcion"]].values.tolist()[0],
    "dias_lab": DIAS_LAB,
}
ctl["pedido_lineas_A"] = int(((a["Cantidad"] > 0) & (a["Clase"] == "A")).sum())
ctl["tipos_variantes"] = raw["Tipo"].value_counts().to_dict()
ctl["q14"] = int(((raw["Tipo"].str.strip().str.upper().isin(["SAL", "SALIDA"])) & raw["Cantidad"].str.startswith("-")).sum())
ctl["q07"] = int(raw["Fecha"].str.contains("-").sum())
ctl["q08"] = int((raw["Tipo"] != raw["Tipo"].str.strip().str.upper().map(lambda t: mapa[t][0])).sum())
ctl["muertos_lista"] = a.loc[a["Muerto"]].sort_values("ValorStock", ascending=False)[["Cod", "Descripcion", "Stock", "ValorStock", "UltimaSalida"]].astype(str).values.tolist()
ctl["recuento_lista"] = a.loc[a["EnRecuento"] == 1, ["Cod", "Descripcion", "StockTeorico", "Ajuste"]].astype(str).values.tolist()
ctl["top_pedido"] = prop.sort_values("Importe", ascending=False).head(5)[["Cod", "Descripcion", "Proveedor", "Cantidad", "Importe"]].astype(str).values.tolist()
with open(CONTROLES, "w", encoding="utf-8") as fh:
    json.dump(ctl, fh, ensure_ascii=False, indent=1, default=str)
print(json.dumps({k: v for k, v in ctl.items() if k not in ("muertos_lista", "recuento_lista", "top_pedido", "tipos_variantes")}, ensure_ascii=False, default=str))

# ---------------------------------------------------------------------------
# 4. Libro de la solución
# ---------------------------------------------------------------------------
MODERNAS = ["LET", "FILTER", "SORTBY", "SORT", "HSTACK", "UNIQUE", "XLOOKUP", "NORM.S.INV", "ISOWEEKNUM", "MAXIFS", "IFS", "STDEV.S", "CHOOSECOLS"]
PREF = {"FILTER": "_xlfn._xlws.FILTER", "SORT": "_xlfn._xlws.SORT"}


def moderna(formula, nombres=()):
    """Expande a mano las funciones modernas (_xlfn.) y los nombres de LET (_xlpm.)."""
    f = formula
    for fn in sorted(MODERNAS, key=len, reverse=True):
        f = re.sub(r"(?<![\w.])" + re.escape(fn) + r"\(", PREF.get(fn, "_xlfn." + fn) + "(", f)
    for n in nombres:
        f = re.sub(r"(?<![\w.\[])" + re.escape(n) + r"(?![\w\[(])", "_xlpm." + n, f)
    return f


wb = xlsxwriter.Workbook(SALIDA, {"use_future_functions": True})
wb.set_properties({"title": "P6 · Stock, punto de pedido y ABC · solución", "author": "Hoja a hoja",
                   "company": "Electro Cierzo Suministros, S.L. (ficticia)"})
AZUL = "#1F3864"
F = {
    "tit": wb.add_format({"bold": True, "font_size": 15, "font_color": AZUL}),
    "sub": wb.add_format({"bold": True, "font_size": 11, "font_color": AZUL}),
    "txt": wb.add_format({"text_wrap": True, "valign": "top"}),
    "mono": wb.add_format({"font_name": "Consolas", "font_size": 9, "valign": "top"}),
    "cab": wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"}),
    "ent": wb.add_format({"num_format": "#,##0"}),
    "num1": wb.add_format({"num_format": "#,##0.0"}),
    "num2": wb.add_format({"num_format": "#,##0.00"}),
    "num4": wb.add_format({"num_format": "0.0000"}),
    "eur": wb.add_format({"num_format": "#,##0.00 €"}),
    "eur0": wb.add_format({"num_format": "#,##0 €"}),
    "pct": wb.add_format({"num_format": "0.0%"}),
    "pct2": wb.add_format({"num_format": "0.00%"}),
    "fec": wb.add_format({"num_format": "dd/mm/yyyy"}),
    "fec0": wb.add_format({"num_format": 'dd/mm/yyyy;;"sin salidas"'}),
    "inp_pct": wb.add_format({"num_format": "0.0%", "bg_color": "#FFF2CC", "border": 1}),
    "inp_num": wb.add_format({"num_format": "0", "bg_color": "#FFF2CC", "border": 1}),
    "inp_fec": wb.add_format({"num_format": "dd/mm/yyyy", "bg_color": "#FFF2CC", "border": 1}),
    "calc_num": wb.add_format({"num_format": "0", "bg_color": "#F2F2F2", "border": 1}),
    "kpi": wb.add_format({"bold": True, "font_size": 13, "num_format": "#,##0.00 €"}),
    "kpin": wb.add_format({"bold": True, "font_size": 13, "num_format": "#,##0"}),
    "ok": wb.add_format({"bg_color": "#C6EFCE", "font_color": "#006100", "bold": True}),
    "mal": wb.add_format({"bg_color": "#FFC7CE", "font_color": "#9C0006", "bold": True}),
    "amb": wb.add_format({"bg_color": "#FFEB9C", "font_color": "#7F6000"}),
    "bool": wb.add_format({"align": "center"}),
}

# ---------- Léame ----------
le = wb.add_worksheet("Léame")
le.set_column("A:A", 24, F["sub"])
le.set_column("B:B", 105, F["txt"])
le.hide_gridlines(2)
filas_le = [
    ("Proyecto", "P6 · Stock, punto de pedido y clasificación ABC. Archivo: P6_Stock_ABC_2026-10_v03.xlsx (nombre recomendado)."),
    ("Lo pidió", "Andrés Molina, jefe de compras y almacén, el 16/11/2026: «una hoja que cada lunes me diga qué tengo que pedir y cuánto, y qué artículos están muertos»."),
    ("Fecha de corte", "31/10/2026 (parámetro FechaCorte). Movimientos del 01/05 al 31/10/2026; inventario físico del 30/04/2026; recuento de 10 artículos el 31/10/2026."),
    ("Fuentes", "p6-movimientos.csv (ERP, UTF-8, «;»), hoja Inventario_origen (inventario del 30/04), Fichas, Proveedores y Recuento (p6-datos.xlsx)."),
    ("Cómo se lee", "De izquierda a derecha: Parámetros → datos de origen (Inventario_origen, Fichas, Proveedores, Recuento) → datos limpios (Mov, salida de Power Query) → cálculos (Semanas, Calc) → informes (Lunes, Muertos, ABC, Qué pasaría si, Resumen) → Calidad y Controles. Las celdas amarillas son entradas; todo lo demás son fórmulas."),
    ("Glosario pactado", "Stock: unidades en el almacén a la fecha de corte (inventario + movimientos ± ajuste del recuento). Posición: stock + pendiente de recibir. Consumo: salidas por venta (SAL) menos devoluciones de clientes (DEV); ni los traspasos, ni las regularizaciones, ni las devoluciones a proveedor son consumo. Demanda diaria (d): consumo / días laborables del periodo (129). Stock de seguridad (SS): colchón para la variación de la demanda durante el plazo: REDONDEAR.MAS(z × σ diaria × RAIZ(plazo); 0), con σ diaria = DESVEST.M de las 26 semanas (con las semanas a cero) / RAIZ(5) y z = INV.NORM.ESTAND(nivel de servicio). Punto de pedido (ROP): d × plazo + SS; si la posición está en el ROP o por debajo, se pide. Nivel máximo (S): ROP + d × R, con R = 5 días laborables (revisión cada lunes). Cantidad: MAX(lote mínimo; MULTIPLO.SUPERIOR(S − posición; múltiplo)). Cobertura: stock / d, en días laborables. Rotación: consumo anual valorado / stock medio valorado. ABC: clase por valor del consumo (A hasta el 80 % acumulado, B hasta el 95 %, C el resto). Muerto: sin salidas en los 90 días naturales anteriores a la fecha de corte y con stock."),
    ("Supuestos", "1) Se usa el stock de toda la empresa (los traspasos entre almacenes no cambian el total). 2) El recuento del 31/10 manda: sus dos diferencias se aplican como ajuste. 3) Los 3 artículos sin ficha no se piden ni se valoran: van a la lista de pendientes de Compras. 4) Plazos en días laborables; si la ficha no lo tiene, el habitual del proveedor. 5) Método pactado: SS con el plazo L; con revisión semanal, un cálculo más prudente usaría L + R (ver «Qué pasaría si»)."),
    ("Cómo actualizar (cada lunes)", "1) Guarda el CSV nuevo con el mismo nombre en la misma carpeta. 2) Si hay recuento, pega sus filas en la tabla Recuento. 3) Cambia FechaCorte en Parámetros (y la tabla Festivos si hace falta). 4) Datos > Actualizar todo. 5) Mira la hoja Controles: el control maestro tiene que estar en VERDADERO. 6) Imprime o exporta a PDF la hoja Lunes y envía cada bloque a su proveedor."),
    ("Colores", "Amarillo: entrada que puedes cambiar. Gris: valor calculado que no se toca. Verde/rojo en Controles: el control cuadra / no cuadra. El semáforo de cobertura lleva siempre la palabra (Rojo, Ámbar, Verde), no solo el color."),
    ("Registro de cambios", "16/11/2026 · v01 · Primera versión con datos a 31/10/2026 · Tú. — 17/11/2026 · v02 · ABC, muertos y hoja Lunes · Tú. — 18/11/2026 · v03 · Tabla de datos, escenarios y controles · Tú."),
    ("Contacto", "Administración y análisis (tú). Dudas de datos del ERP: Andrés Molina."),
]
le.write(0, 0, "Léame · P6 Stock, punto de pedido y ABC", F["tit"])
for i, (k, t) in enumerate(filas_le, start=2):
    le.write(i, 0, k, F["sub"])
    le.write(i, 1, t, F["txt"])

# ---------- Parámetros ----------
pa = wb.add_worksheet("Parámetros")
pa.set_column("A:A", 30)
pa.set_column("B:B", 14)
pa.set_column("C:C", 70, F["txt"])
pa.write(0, 0, "Parámetros (celdas amarillas: entradas con nombre)", F["tit"])
pa.write_row(2, 0, ["Parámetro (nombre)", "Valor", "Qué es"], F["cab"])
PARAMS = [
    ("FechaCorte", datetime(2026, 10, 31), "inp_fec", "Fecha de corte del stock (sábado 31/10/2026)."),
    ("FechaInicio", datetime(2026, 5, 1), "inp_fec", "Primer día de los movimientos."),
    ("DiasLab", "=NETWORKDAYS(FechaInicio,FechaCorte,Festivos[Fecha])", "calc_num", "Días laborables del periodo (fórmula DIAS.LAB con la tabla Festivos): 129."),
    ("SemanasPeriodo", 26, "inp_num", "Semanas ISO completas del periodo (19 a 44)."),
    ("FactorAnual", "=52/SemanasPeriodo", "calc_num", "Para pasar el consumo de 26 semanas a un año."),
    ("DiasSemana", 5, "inp_num", "Días laborables de una semana (para pasar σ semanal a σ diaria)."),
    ("R_dias", 5, "inp_num", "Periodo de revisión: cada lunes = 5 días laborables (desde enero, quincenal: 10)."),
    ("NivelA", 0.95, "inp_pct", "Nivel de servicio de la clase A."),
    ("NivelB", 0.95, "inp_pct", "Nivel de servicio de la clase B."),
    ("NivelC", 0.90, "inp_pct", "Nivel de servicio de la clase C."),
    ("NivelUnico", None, "inp_pct", "Vacío = niveles por clase. Celda de entrada de la Tabla de datos (un mismo nivel para todos)."),
    ("CorteA", 0.80, "inp_pct", "Límite del % acumulado para la clase A."),
    ("CorteB", 0.95, "inp_pct", "Límite del % acumulado para la clase B."),
    ("DiasMuerto", 90, "inp_num", "Días naturales sin salidas para considerar un artículo muerto."),
    ("RetrasoTormes", 0, "inp_num", "Días laborables que se suman al plazo de Tormes (celda que cambia el Administrador de escenarios)."),
]
for i, (n, v, fm, t) in enumerate(PARAMS, start=3):
    pa.write(i, 0, n)
    if isinstance(v, str):
        pa.write_formula(i, 1, v, F[fm])
    elif v is None:
        pa.write_blank(i, 1, None, F[fm])
    elif isinstance(v, datetime):
        pa.write_datetime(i, 1, v, F[fm])
    else:
        pa.write_number(i, 1, v, F[fm])
    pa.write(i, 2, t, F["txt"])
    wb.define_name(n, f"='Parámetros'!$B${i + 1}")
fila_f = 3 + len(PARAMS) + 2
pa.write(fila_f - 1, 0, "Festivos del periodo (tabla Festivos)", F["sub"])
pa.add_table(fila_f, 0, fila_f + len(FESTIVOS), 1, {"name": "Festivos", "style": "Table Style Light 9",
             "columns": [{"header": "Fecha", "format": F["inp_fec"]}, {"header": "Festivo"}],
             "data": [[datetime(d.year, d.month, d.day), n] for d, n in zip(FESTIVOS, ["Fiesta del Trabajo", "Fiesta Nacional de España"])]})
pa.data_validation("B11:B14", {"validate": "decimal", "criteria": "between", "minimum": 0.5, "maximum": 0.999,
                               "error_message": "El nivel de servicio va entre 50 % y 99,9 %."})
pa.data_validation("B10", {"validate": "integer", "criteria": "between", "minimum": 1, "maximum": 20})
pa.data_validation("B18", {"validate": "integer", "criteria": "between", "minimum": 0, "maximum": 30})
assert [p_[0] for p_ in PARAMS].index("NivelUnico") == 10 and [p_[0] for p_ in PARAMS].index("RetrasoTormes") == 14

# tabla de tipos de movimiento
pa.write(fila_f + len(FESTIVOS) + 3, 0, "Tipos de movimiento (tabla TiposMovimiento, la usa Power Query)", F["sub"])
ft = fila_f + len(FESTIVOS) + 4
pa.add_table(ft, 0, ft + len(TIPOS), 4, {"name": "TiposMovimiento", "style": "Table Style Light 9",
             "columns": [{"header": "TipoOriginal"}, {"header": "Tipo"}, {"header": "Signo"}, {"header": "FactorConsumo"}, {"header": "Explicación"}],
             "data": [list(t) for t in TIPOS]})
pa.set_column("D:D", 14)
pa.set_column("E:E", 55)


def tabla_valores(ws, nombre, df, formatos, anchos):
    cols = list(df.columns)
    for j, c in enumerate(cols):
        ws.set_column(j, j, anchos[j], formatos[j])
    for i, fila in enumerate(df.itertuples(index=False), start=1):
        for j, v in enumerate(fila):
            if v is None or (isinstance(v, float) and math.isnan(v)) or (v is pd.NaT):
                continue
            if isinstance(v, (date, datetime, pd.Timestamp)):
                ws.write_datetime(i, j, pd.Timestamp(v).to_pydatetime(), formatos[j] or F["fec"])
            elif isinstance(v, str):
                ws.write_string(i, j, v)
            elif isinstance(v, (bool, np.bool_)):
                ws.write_boolean(i, j, bool(v))
            else:
                ws.write_number(i, j, float(v))
    ws.add_table(0, 0, len(df), len(cols) - 1, {"name": nombre, "style": "Table Style Light 9",
                                                "columns": [{"header": c} for c in cols]})
    ws.freeze_panes(1, 0)


# ---------- datos de origen ----------
io = wb.add_worksheet("Inventario_origen")
inv_o = inv_raw[["CodArticulo", "Descripción", "Ubicación", "Unidad", "StockContado"]].copy()
tabla_valores(io, "Inventario", inv_o, [None, None, None, None, F["num1"]], [13, 52, 11, 8, 13])
fo = wb.add_worksheet("Fichas")
fic_o = fic[["CodArticulo", "Proveedor", "PlazoEntrega", "LoteMinimo", "Multiplo", "CosteUnitario", "PendienteRecibir", "FechaPrevista"]].copy()
fic_o["PlazoEntrega"] = fic_o["PlazoEntrega"].astype(object).where(fic_o["PlazoEntrega"].notna(), None)
fic_o["FechaPrevista"] = fic_o["FechaPrevista"].astype(object).where(fic_o["FechaPrevista"].notna(), None)
tabla_valores(fo, "Fichas", fic_o, [None, None, F["ent"], F["ent"], F["ent"], F["eur"], F["num1"], F["fec"]], [13, 12, 13, 12, 10, 14, 17, 14])
po = wb.add_worksheet("Proveedores")
tabla_valores(po, "Proveedores", prov, [None, F["ent"], None], [12, 14, 28])
ro = wb.add_worksheet("Recuento")
tabla_valores(ro, "Recuento", rec, [None, None, F["num1"]], [13, 52, 13])

# ---------- Mov (salida de Power Query + columna Semana con fórmula) ----------
mv = wb.add_worksheet("Mov")
mov_out = mov[["FechaD", "TipoOriginal", "TipoN", "CodArticulo", "CantidadN", "Signo", "CantidadFirmada", "FactorConsumo", "Consumo", "Documento", "LineaN", "Almacén"]].copy()
mov_out.columns = ["Fecha", "TipoOriginal", "Tipo", "CodArticulo", "Cantidad", "Signo", "CantidadFirmada", "FactorConsumo", "Consumo", "Documento", "Línea", "Almacén"]
mov_out = mov_out.sort_values(["Fecha", "Documento", "Línea"]).reset_index(drop=True)
NM = len(mov_out)
fm_mov = [F["fec"], None, None, None, F["num1"], F["ent"], F["num1"], F["ent"], F["num1"], None, F["ent"], None]
for j, an in enumerate([11, 12, 7, 12, 10, 6, 15, 13, 10, 15, 6, 8]):
    mv.set_column(j, j, an, fm_mov[j])
mv.set_column(12, 12, 8, F["ent"])
for i, r in enumerate(mov_out.itertuples(index=False), start=1):
    mv.write_datetime(i, 0, datetime(r.Fecha.year, r.Fecha.month, r.Fecha.day), F["fec"])
    mv.write_string(i, 1, r.TipoOriginal)
    mv.write_string(i, 2, r.Tipo)
    mv.write_string(i, 3, r.CodArticulo)
    mv.write_number(i, 4, r.Cantidad)
    mv.write_number(i, 5, r.Signo)
    mv.write_number(i, 6, r.CantidadFirmada)
    mv.write_number(i, 7, r.FactorConsumo)
    mv.write_number(i, 8, r.Consumo)
    mv.write_string(i, 9, r.Documento)
    mv.write_number(i, 10, r.Línea)
    mv.write_string(i, 11, r.Almacén)
    mv.write_formula(i, 12, f"=ISOWEEKNUM(A{i + 1})", F["ent"], int(date(r.Fecha.year, r.Fecha.month, r.Fecha.day).isocalendar()[1]))
mv.add_table(0, 0, NM, 12, {"name": "Mov", "style": "Table Style Light 9",
                            "columns": [{"header": c} for c in list(mov_out.columns) + ["Semana"]]})
mv.freeze_panes(1, 0)

# ---------- Calc (salida de «Agrupar por» + columnas con fórmulas) ----------
COLS = [  # clave, cabecera, fórmula (None = valor de Power Query), formato, ancho
    ("cod", "Cod", None, None, 9),
    ("des", "Descripción", None, None, 40),
    ("uni", "Unidad", None, None, 7),
    ("ubi", "Ubicaciones", None, "ent", 7),
    ("s0", "Stock_30_04", None, "num1", 10),
    ("mn", "MovNeto", "=SUMIFS(Mov[CantidadFirmada],Mov[CodArticulo],{cod})", "num1", 10),
    ("st", "StockTeorico", "={s0}+{mn}", "num1", 10),
    ("er", "EnRecuento", "=IF(ISNUMBER(MATCH({cod},Recuento[CodArticulo],0)),1,0)", "ent", 6),
    ("rc", "Recuento", '=IF({er}=1,INDEX(Recuento[StockFísico],MATCH({cod},Recuento[CodArticulo],0)),"")', "num1", 9),
    ("aj", "Ajuste", "=IF({er}=1,{rc}-{st},0)", "num1", 8),
    ("sk", "Stock", "={st}+{aj}", "num1", 10),
    ("cf", "ConFicha", "=IF(ISNUMBER(MATCH({cod},Fichas[CodArticulo],0)),1,0)", "ent", 6),
    ("ff", "FilaFicha", "=IF({cf}=1,MATCH({cod},Fichas[CodArticulo],0),0)", "ent", 6),
    ("pv", "Proveedor", '=IF({cf}=1,INDEX(Fichas[Proveedor],{ff}),"SIN FICHA")', None, 10),
    ("pb", "PlazoBase", '=IF({cf}=1,IF(INDEX(Fichas[PlazoEntrega],{ff})="",INDEX(Proveedores[PlazoHabitual],MATCH({pv},Proveedores[Proveedor],0)),INDEX(Fichas[PlazoEntrega],{ff})),0)', "ent", 7),
    ("pl", "Plazo", '={pb}+IF({pv}="Tormes",RetrasoTormes,0)', "ent", 6),
    ("lm", "LoteMin", "=IF({cf}=1,INDEX(Fichas[LoteMinimo],{ff}),0)", "ent", 7),
    ("mu", "Multiplo", "=IF({cf}=1,INDEX(Fichas[Multiplo],{ff}),1)", "ent", 7),
    ("co", "Coste", "=IF({cf}=1,INDEX(Fichas[CosteUnitario],{ff}),0)", "eur", 9),
    ("pe", "Pendiente", "=IF({cf}=1,INDEX(Fichas[PendienteRecibir],{ff}),0)", "num1", 9),
    ("cn", "Consumo", "=SUMIFS(Mov[Consumo],Mov[CodArticulo],{cod})", "num1", 10),
    ("dd", "DemandaDia", "={cn}/DiasLab", "num2", 9),
    ("sg", "SigmaSem", "=INDEX(Semanas!$AC:$AC,MATCH({cod},Semanas!$A:$A,0))", "num2", 9),
    ("va", "ValorAnual", "=IF({cf}=1,ROUND({cn}*{co}*FactorAnual,2),0)", "eur", 12),
    ("ac", "Acum", '=IF({cf}=1,SUMIFS(Calc[ValorAnual],Calc[ValorAnual],">="&{va})/SUM(Calc[ValorAnual]),"")', "pct2", 8),
    ("cl", "Clase", '=IF({cf}=1,IFS({ac}<=CorteA,"A",{ac}<=CorteB,"B",TRUE,"C"),"Sin ficha")', None, 7),
    ("ni", "Nivel", '=IF({cf}=1,IF(ISNUMBER(NivelUnico),NivelUnico,IFS({cl}="A",NivelA,{cl}="B",NivelB,TRUE,NivelC)),0)', "pct", 7),
    ("zz", "z", "=IF({cf}=1,NORM.S.INV({ni}),0)", "num4", 7),
    ("ss", "SS", "=IF({cf}=1,ROUNDUP({zz}*{sg}/SQRT(DiasSemana)*SQRT({pl}),0),0)", "ent", 7),
    ("rp", "ROP", "={dd}*{pl}+{ss}", "num1", 8),
    ("sm", "S_max", "={rp}+{dd}*R_dias", "num1", 8),
    ("po", "Posicion", "={sk}+{pe}", "num1", 9),
    ("pd", "Pedir", "=AND({cf}=1,{dd}>0,{po}<={rp})", "bool", 7),
    ("ca", "Cantidad", "=IF({pd},MAX({lm},CEILING({sm}-{po},{mu})),0)", "num1", 9),
    ("im", "Importe", "={ca}*{co}", "eur", 11),
    ("cl2", "Cantidad_LET", None, "num1", 9),
    ("vs", "ValorStock", "={sk}*{co}", "eur", 12),
    ("vss", "ValorSS", "={ss}*{co}", "eur", 10),
    ("us", "UltimaSalida", '=MAXIFS(Mov[Fecha],Mov[CodArticulo],{cod},Mov[Tipo],"SAL")', "fec0", 11),
    ("mt", "Muerto", '=IF(AND({sk}>0,FechaCorte-{us}>DiasMuerto),"Sí","No")', None, 7),
    ("cb", "Cobertura", '=IF({dd}>0,{sk}/{dd},"")', "num1", 9),
    ("sf", "Semaforo", '=IF({cf}=0,"Sin ficha",IF({dd}=0,"Sin consumo",IF({cb}<{pl},"Rojo",IF({cb}<{pl}+R_dias,"Ámbar","Verde"))))', None, 11),
    ("ro", "Rotacion", '=IF(AND({cf}=1,({s0}+{sk})>0),{va}/((({s0}+{sk})/2)*{co}),"")', "num2", 8),
    ("or", "Orden", '=IF({cf}=1,COUNTIFS(Calc[ValorAnual],">"&{va},Calc[ConFicha],1)+COUNTIFS($X$2:{va},{va},$L$2:{cf},1),"")', "ent", 6),
    ("ce", "Cant_esc", None, "num1", 9),
    ("ie", "Imp_esc", "={ce}*{co}", "eur", 11),
]
LET_F = ("=LET(demanda,{dd},sigma_d,{sg}/SQRT(DiasSemana),plazo,{pl},z,NORM.S.INV({ni}),"
         "ss,ROUNDUP(z*sigma_d*SQRT(plazo),0),rop,demanda*plazo+ss,s_max,rop+demanda*R_dias,posicion,{sk}+{pe},"
         "IF(AND({cf}=1,demanda>0,posicion<=rop),MAX({lm},CEILING(s_max-posicion,{mu})),0))")
LET_NOMBRES = ["demanda", "sigma_d", "plazo", "z", "ss", "rop", "s_max", "posicion"]
ESC_F = ("=IF(AND({cf}=1,{dd}>0,{po}<={dd}*({pb}+IF({pv}=\"Tormes\",Esc_RetrasoTormes,0))"
         "+ROUNDUP({zz}*{sg}/SQRT(DiasSemana)*SQRT({pb}+IF({pv}=\"Tormes\",Esc_RetrasoTormes,0)),0)),"
         "MAX({lm},CEILING({dd}*({pb}+IF({pv}=\"Tormes\",Esc_RetrasoTormes,0))"
         "+ROUNDUP({zz}*{sg}/SQRT(DiasSemana)*SQRT({pb}+IF({pv}=\"Tormes\",Esc_RetrasoTormes,0)),0)+{dd}*Esc_R-{po},{mu})),0)")
LETRA = {k: xl_col_to_name(j) for j, (k, *_r) in enumerate(COLS)}
assert LETRA["va"] == "X" and LETRA["cf"] == "L" and LETRA["ss"] == "AC" or True
CALC_HEAD = [c[1] for c in COLS]
ca_ws = wb.add_worksheet("Calc")
NA = len(a)
a = a.sort_values("Cod").reset_index(drop=True)


def celdas(r):
    return {k: f"{LETRA[k]}{r}" for k in LETRA}


for j, (k, h, fo_, fmt, an) in enumerate(COLS):
    ca_ws.set_column(j, j, an, F[fmt] if fmt else None)
for i, r in enumerate(a.itertuples(index=False), start=1):
    fila = i + 1
    m = celdas(fila)
    for j, (k, h, fo_, fmt, an) in enumerate(COLS):
        fmt_ = F[fmt] if fmt else None
        if k == "cod":
            ca_ws.write_string(i, j, r.Cod)
        elif k == "des":
            ca_ws.write_string(i, j, r.Descripcion)
        elif k == "uni":
            ca_ws.write_string(i, j, r.Unidad)
        elif k == "ubi":
            ca_ws.write_number(i, j, r.Ubicaciones, fmt_)
        elif k == "s0":
            ca_ws.write_number(i, j, r.Stock3004, fmt_)
        elif k == "cl2":
            ca_ws.write_formula(i, j, moderna(LET_F.format(**m), LET_NOMBRES), fmt_)
        elif k == "ce":
            ca_ws.write_formula(i, j, ESC_F.format(**m), fmt_)
        elif k == "or":
            ca_ws.write_formula(i, j, fo_.replace("$X$2:{va}", f"${LETRA['va']}$2:{LETRA['va']}{fila}").replace("$L$2:{cf}", f"${LETRA['cf']}$2:{LETRA['cf']}{fila}").format(**m), fmt_)
        else:
            ca_ws.write_formula(i, j, fo_.format(**m), fmt_)
assert LETRA["va"] == "X" and LETRA["cf"] == "L"
ca_ws.add_table(0, 0, NA, len(COLS) - 1, {"name": "Calc", "style": "Table Style Light 9",
                                          "columns": [{"header": h} for h in CALC_HEAD]})
ca_ws.freeze_panes(1, 2)
L_ = LETRA
ca_ws.conditional_format(f"{L_['sf']}2:{L_['sf']}{NA + 1}", {"type": "cell", "criteria": "==", "value": '"Rojo"', "format": F["mal"]})
ca_ws.conditional_format(f"{L_['sf']}2:{L_['sf']}{NA + 1}", {"type": "cell", "criteria": "==", "value": '"Ámbar"', "format": F["amb"]})
ca_ws.conditional_format(f"{L_['sf']}2:{L_['sf']}{NA + 1}", {"type": "cell", "criteria": "==", "value": '"Verde"', "format": F["ok"]})
ca_ws.conditional_format(f"{L_['ca']}2:{L_['ca']}{NA + 1}", {"type": "cell", "criteria": ">", "value": 0, "format": F["amb"]})

# ---------- Semanas ----------
se = wb.add_worksheet("Semanas")
se.write(0, 0, "Cod", F["cab"])
for j, s in enumerate(SEMANAS, start=1):
    se.write_number(0, j, s, F["cab"])
se.write(0, 27, "Total", F["cab"])
se.write(0, 28, "SigmaSem", F["cab"])
se.write(0, 29, "SemanasConVenta", F["cab"])
for i in range(1, NA + 1):
    fila = i + 1
    se.write_formula(i, 0, f"=Calc!A{fila}", None, a.at[i - 1, "Cod"])
    for j in range(1, 27):
        col = xl_col_to_name(j)
        se.write_formula(i, j, f"=SUMIFS(Mov[Consumo],Mov[CodArticulo],$A{fila},Mov[Semana],{col}$1)", F["num1"])
    se.write_formula(i, 27, f"=SUM(B{fila}:AA{fila})", F["num1"])
    se.write_formula(i, 28, f"=STDEV.S(B{fila}:AA{fila})", F["num2"])
    se.write_formula(i, 29, f'=COUNTIF(B{fila}:AA{fila},">0")', F["ent"])
fr = NA + 2
se.write(fr, 0, "Filas de Mov por semana", F["sub"])
for j in range(1, 27):
    col = xl_col_to_name(j)
    se.write_formula(fr, j, f"=COUNTIF(Mov[Semana],{col}$1)", F["ent"])
se.write_formula(fr, 27, f"=SUM(B{fr + 1}:AA{fr + 1})", F["ent"])
se.write(fr + 1, 0, "Consumo total por semana", F["sub"])
for j in range(1, 28):
    col = xl_col_to_name(j)
    se.write_formula(fr + 1, j, f"=SUM({col}2:{col}{NA + 1})", F["num1"])
se.set_column(0, 0, 22)
se.set_column(1, 26, 7)
se.set_column(27, 29, 11)
se.freeze_panes(1, 1)
FILA_SEM_FILAS = fr + 1

# ---------- ABC (ordenado con fórmulas clásicas) + Pareto ----------
ab = wb.add_worksheet("ABC")
ab.write(0, 0, "Clasificación ABC por valor del consumo anual (artículos con ficha)", F["tit"])
ab.write_row(2, 0, ["Clase", "Artículos", "% artículos", "Valor consumo anual", "% valor"], F["cab"])
for k, cl in enumerate(["A", "B", "C"]):
    rr = 3 + k
    ab.write(rr, 0, cl)
    ab.write_formula(rr, 1, f'=COUNTIF(Calc[Clase],"{cl}")', F["ent"])
    ab.write_formula(rr, 2, f'=B{rr + 1}/COUNTIF(Calc[ConFicha],1)', F["pct"])
    ab.write_formula(rr, 3, f'=SUMIFS(Calc[ValorAnual],Calc[Clase],"{cl}")', F["eur0"])
    ab.write_formula(rr, 4, f'=D{rr + 1}/SUM(Calc[ValorAnual])', F["pct"])
ab.write(6, 0, "Total", F["sub"])
ab.write_formula(6, 1, "=SUM(B4:B6)", F["ent"])
ab.write_formula(6, 3, "=SUM(D4:D6)", F["eur0"])
ab.write(7, 0, "Sin ficha (no se clasifican)")
ab.write_formula(7, 1, "=COUNTIF(Calc[ConFicha],0)", F["ent"])
ab.write_row(9, 0, ["Puesto", "Cod", "Descripción", "Valor consumo anual", "% acumulado", "Clase"], F["cab"])
NF = int(a["ConFicha"].sum())
for k in range(1, NF + 1):
    rr = 9 + k
    ab.write_number(rr, 0, k)
    ab.write_formula(rr, 1, f"=INDEX(Calc[Cod],MATCH(A{rr + 1},Calc[Orden],0))")
    ab.write_formula(rr, 2, f"=INDEX(Calc[Descripción],MATCH(A{rr + 1},Calc[Orden],0))")
    ab.write_formula(rr, 3, f"=INDEX(Calc[ValorAnual],MATCH(A{rr + 1},Calc[Orden],0))", F["eur0"])
    ab.write_formula(rr, 4, f"=SUM($D$11:D{rr + 1})/SUM(Calc[ValorAnual])", F["pct"])
    ab.write_formula(rr, 5, f"=INDEX(Calc[Clase],MATCH(A{rr + 1},Calc[Orden],0))")
ab.set_column("A:A", 8)
ab.set_column("B:B", 10)
ab.set_column("C:C", 44)
ab.set_column("D:D", 18)
ab.set_column("E:F", 12)
ab.conditional_format(f"F11:F{10 + NF}", {"type": "cell", "criteria": "==", "value": '"A"', "format": F["ok"]})
ab.conditional_format(f"F11:F{10 + NF}", {"type": "cell", "criteria": "==", "value": '"B"', "format": F["amb"]})
ch = wb.add_chart({"type": "column"})
ch.add_series({"name": "Valor del consumo anual (€)", "categories": f"=ABC!$A$11:$A${10 + NF}",
               "values": f"=ABC!$D$11:$D${10 + NF}", "fill": {"color": "#4472C4"}, "gap": 20})
ln = wb.add_chart({"type": "line"})
ln.add_series({"name": "% acumulado", "categories": f"=ABC!$A$11:$A${10 + NF}", "values": f"=ABC!$E$11:$E${10 + NF}",
               "y2_axis": True, "line": {"color": "#C00000", "width": 2}})
ch.combine(ln)
ch.set_title({"name": "Pareto del consumo valorado: el 20 % de los artículos hace el 80 % del valor"})
ch.set_x_axis({"name": "Artículos ordenados de mayor a menor valor (puesto)", "num_font": {"size": 7}, "interval_unit": 10})
ch.set_y_axis({"name": "€ al año", "num_format": "#,##0"})
ln.set_y2_axis({"name": "% acumulado", "num_format": "0%", "max": 1, "min": 0})
ch.set_legend({"position": "bottom"})
ch.set_size({"width": 900, "height": 420})
ab.insert_chart("H3", ch, {"description": f"Gráfico de Pareto: columnas con el valor del consumo anual de cada artículo, de mayor a menor, y línea con el porcentaje acumulado, que llega al 80 % hacia el puesto {abc_n.get('A', 0)}."})
ab.freeze_panes(10, 0)

# ---------- Muertos ----------
mu = wb.add_worksheet("Muertos")
mu.write(0, 0, "Artículos muertos: sin salidas en 90 días naturales (antes del 02/08/2026) y con stock", F["tit"])
mu.write(2, 0, "Artículos muertos")
mu.write_formula(2, 2, '=COUNTIF(Calc[Muerto],"Sí")', F["kpin"])
mu.write(3, 0, "Valor inmovilizado")
mu.write_formula(3, 2, '=SUMIFS(Calc[ValorStock],Calc[Muerto],"Sí")', F["kpi"])
mu.write(4, 0, "% del valor del stock")
mu.write_formula(4, 2, "=C4/SUM(Calc[ValorStock])", F["pct"])
mu.write_row(6, 0, ["Cod", "Descripción", "Stock", "Coste", "Valor", "Última salida"], F["cab"])
f_mu = moderna('=LET(f,Calc[Muerto]="Sí",SORTBY(FILTER(HSTACK(Calc[Cod],Calc[Descripción],Calc[Stock],Calc[Coste],Calc[ValorStock],Calc[UltimaSalida]),f),FILTER(Calc[ValorStock],f),-1))', ["f"])
mu.write_dynamic_array_formula("A8", f_mu)
mu.set_column("A:A", 10)
mu.set_column("B:B", 44)
mu.set_column("C:C", 10, F["num1"])
mu.set_column("D:D", 10, F["eur"])
mu.set_column("E:E", 12, F["eur"])
mu.set_column("F:F", 13, F["fec0"])
mu.write(21, 0, "Propuesta: negociar con cada proveedor la devolución o el abono de lo que no sale; si no aceptan, liquidar con descuento a instaladores. Revisar esta lista cada mes.", F["txt"])

# ---------- Lunes ----------
lu = wb.add_worksheet("Lunes")
lu.write(0, 0, "Propuesta de pedido del lunes · datos a 31/10/2026", F["tit"])
lu.write_formula(1, 0, '="Controles: "&IF(Controles!$F$2,"OK","REVISAR")&" · Corte: "&TEXT(FechaCorte,"dd/mm/aaaa")')
lu.write_row(3, 0, ["Proveedor", "Líneas", "Importe (€, sin IVA)"], F["cab"])
provs = sorted(prov["Proveedor"])
for k, pv in enumerate(provs):
    rr = 4 + k
    lu.write(rr, 0, pv)
    lu.write_formula(rr, 1, f'=COUNTIFS(Calc[Proveedor],A{rr + 1},Calc[Cantidad],">0")', F["ent"])
    lu.write_formula(rr, 2, f'=SUMIFS(Calc[Importe],Calc[Proveedor],A{rr + 1})', F["eur"])
rt = 4 + len(provs)
lu.write(rt, 0, "Total", F["sub"])
lu.write_formula(rt, 1, f"=SUM(B5:B{rt})", F["ent"])
lu.write_formula(rt, 2, f"=SUM(C5:C{rt})", F["eur"])
lu.write_row(rt + 2, 0, ["Proveedor", "Cod", "Descripción", "Unidad", "Cantidad", "Coste", "Importe", "Posición", "Punto de pedido"], F["cab"])
f_lu = moderna('=LET(f,Calc[Cantidad]>0,SORTBY(FILTER(HSTACK(Calc[Proveedor],Calc[Cod],Calc[Descripción],Calc[Unidad],Calc[Cantidad],Calc[Coste],Calc[Importe],Calc[Posicion],Calc[ROP]),f),FILTER(Calc[Proveedor],f),1,FILTER(Calc[Importe],f),-1))', ["f"])
lu.write_dynamic_array_formula(f"A{rt + 4}", f_lu)
lu.set_column("A:A", 12)
lu.set_column("B:B", 9)
lu.set_column("C:C", 44)
lu.set_column("D:D", 7)
lu.set_column("E:E", 10, F["num1"])
lu.set_column("F:F", 10, F["eur"])
lu.set_column("G:G", 12, F["eur"])
lu.set_column("H:I", 11, F["num1"])
lu.set_landscape()
lu.set_paper(9)
lu.fit_to_pages(1, 0)
lu.repeat_rows(rt + 2)
lu.set_footer("&LElectro Cierzo Suministros · Propuesta de pedido&RPágina &P de &N")
FILA_LUNES_TOTAL = rt + 1

# ---------- Qué pasaría si ----------
qs = wb.add_worksheet("Que_pasaria_si")
qs.write(0, 0, "Qué pasaría si…", F["tit"])
qs.write(2, 0, "1. Nivel de servicio único para todos (equivalente a la Tabla de datos de una variable)", F["sub"])
qs.write_row(3, 0, ["Nivel de servicio", "Valor del stock de seguridad (€)", "Diferencia con los niveles pactados (€)"], F["cab"])
for k, niv in enumerate([0.90, 0.95, 0.975, 0.99]):
    rr = 4 + k
    qs.write_number(rr, 0, niv, F["pct"])
    qs.write_formula(rr, 1, f"=SUMPRODUCT(ROUNDUP(NORM.S.INV(A{rr + 1})*Calc[SigmaSem]/SQRT(DiasSemana)*SQRT(Calc[Plazo]),0)*Calc[Coste]*Calc[ConFicha])", F["eur"])
    qs.write_formula(rr, 2, f"=B{rr + 1}-SUM(Calc[ValorSS])", F["eur"])
qs.write(8, 0, "Niveles pactados (95/95/90)")
qs.write_formula(8, 1, "=SUM(Calc[ValorSS])", F["eur"])
qs.write(10, 0, "2. Escenario del plazo de Tormes y del periodo de revisión", F["sub"])
qs.write(11, 0, "Días que se suman al plazo de Tormes")
qs.write_number(11, 1, 5, F["inp_num"])
wb.define_name("Esc_RetrasoTormes", "=Que_pasaria_si!$B$12")
qs.write(12, 0, "Periodo de revisión R (días laborables)")
qs.write_number(12, 1, 5, F["inp_num"])
wb.define_name("Esc_R", "=Que_pasaria_si!$B$13")
qs.write_row(14, 0, ["", "Propuesta actual", "Escenario", "Diferencia"], F["cab"])
qs.write(15, 0, "Líneas de pedido")
qs.write_formula(15, 1, '=COUNTIF(Calc[Cantidad],">0")', F["ent"])
qs.write_formula(15, 2, '=COUNTIF(Calc[Cant_esc],">0")', F["ent"])
qs.write_formula(15, 3, "=C16-B16", F["ent"])
qs.write(16, 0, "Importe (€)")
qs.write_formula(16, 1, "=SUM(Calc[Importe])", F["eur"])
qs.write_formula(16, 2, "=SUM(Calc[Imp_esc])", F["eur"])
qs.write_formula(16, 3, "=C17-B17", F["eur"])
qs.write(17, 0, "Líneas de Tormes")
qs.write_formula(17, 1, '=COUNTIFS(Calc[Proveedor],"Tormes",Calc[Cantidad],">0")', F["ent"])
qs.write_formula(17, 2, '=COUNTIFS(Calc[Proveedor],"Tormes",Calc[Cant_esc],">0")', F["ent"])
qs.write_formula(17, 3, "=C18-B18", F["ent"])
qs.write(18, 0, "Importe de Tormes (€)")
qs.write_formula(18, 1, '=SUMIFS(Calc[Importe],Calc[Proveedor],"Tormes")', F["eur"])
qs.write_formula(18, 2, '=SUMIFS(Calc[Imp_esc],Calc[Proveedor],"Tormes")', F["eur"])
qs.write_formula(18, 3, "=C19-B19", F["eur"])
qs.write(20, 0, "Para el cambio inesperado (cierre de Tormes del 21/12 al 08/01 y revisión quincenal), pon 12 y 10 en las celdas amarillas. Con el Administrador de escenarios se hace lo mismo cambiando RetrasoTormes y R_dias en Parámetros (ver «Cómo se hizo»).", F["txt"])
qs.set_column("A:A", 44)
qs.set_column("B:D", 22)

# ---------- Resumen ----------
rs = wb.add_worksheet("Resumen")
rs.write(0, 0, "Resumen para Andrés · stock a 31/10/2026", F["tit"])
rs.write_formula(1, 0, '="Controles: "&IF(Controles!$F$2,"OK","REVISAR")')
kpis = [
    ("Valor del stock (177 artículos con ficha)", "=SUM(Calc[ValorStock])", "kpi"),
    ("Artículos que hay que pedir el lunes", '=COUNTIF(Calc[Cantidad],">0")', "kpin"),
    ("Importe de la propuesta (sin IVA)", "=SUM(Calc[Importe])", "kpi"),
    ("Artículos muertos", '=COUNTIF(Calc[Muerto],"Sí")', "kpin"),
    ("Valor inmovilizado en muertos", '=SUMIFS(Calc[ValorStock],Calc[Muerto],"Sí")', "kpi"),
    ("Artículos sin stock que se venden", '=COUNTIFS(Calc[Stock],0,Calc[DemandaDia],">0")', "kpin"),
    ("Artículos en rojo (cobertura menor que el plazo)", '=COUNTIF(Calc[Semaforo],"Rojo")', "kpin"),
    ("Valor del stock de seguridad (niveles pactados)", "=SUM(Calc[ValorSS])", "kpi"),
    ("Artículos A / B / C", '=COUNTIF(Calc[Clase],"A")&" / "&COUNTIF(Calc[Clase],"B")&" / "&COUNTIF(Calc[Clase],"C")', None),
    ("Artículos sin ficha (pendientes de Compras)", "=COUNTIF(Calc[ConFicha],0)", "kpin"),
    ("Cobertura media (días laborables)", "=SUM(Calc[ValorStock])/SUMPRODUCT(Calc[DemandaDia],Calc[Coste])", "num1"),
    ("Rotación anual (consumo / stock medio)", "=SUM(Calc[ValorAnual])/SUMPRODUCT((Calc[Stock_30_04]+Calc[Stock])/2,Calc[Coste])", "num2"),
]
for k, (t, fo_, fm) in enumerate(kpis):
    rs.write(3 + k, 0, t)
    rs.write_formula(3 + k, 1, fo_, F[fm] if fm else None)
rs.set_column("A:A", 50)
rs.set_column("B:B", 20)

# ---------- Calidad de datos ----------
cq = wb.add_worksheet("Calidad")
cq.write(0, 0, "Calidad de datos: problema, filas afectadas y decisión", F["tit"])
cq.write_row(2, 0, ["Código", "Problema", "Dónde", "Filas", "Cómo se detecta", "Decisión", "Impacto si no se arregla"], F["cab"])
calidad = [
    ("Q03", "Falsos duplicados: el mismo artículo en dos ubicaciones", "Inventario", N_DOBLES * 2,
     "CONTAR.SI por código > 1, con ubicaciones distintas", "Se SUMAN (Agrupar por): 196 filas → 180 artículos",
     f"«Quitar duplicados» borra {es(ctl['err_quitar_inv'])} € del stock teórico"),
    ("Q13", "Código guardado como número (731 en vez de 000731)", "Inventario", N_COD_NUM,
     "ESNUMERO en la columna de código; alineado a la derecha", "Código de texto de 6 cifras: TEXTO(A2;\"000000\") o Text.PadStart",
     f"{claves_sin_arreglar} claves en vez de 180 y, si el inventario se busca por el código de 6 cifras, {neg_sin_arreglar} artículos con stock negativo"),
    ("Q22", "Solape de extracciones: el 31/07 sale dos veces", "CSV", N_DUP,
     "Documento + Línea repetidos; recuento por fecha", "Quitar duplicados por Documento + Línea (todos del 31/07)",
     "Ventas, compras y consumo del 31/07 contados dos veces"),
    ("Q07", "Fechas AAAA-MM-DD en la extracción de agosto", "CSV", ctl["q07"],
     "Fechas que no son fecha o que se alinean distinto", "Cambiar tipo con configuración regional Español (España): lee los dos formatos", "Fechas como texto: semanas y última salida mal"),
    ("Q08", "Tipo escrito de tres formas: SAL, Salida, «salida »", "CSV", ctl["q08"],
     "UNICOS o filtro de la columna Tipo", "Recortar + Mayúsculas y tabla TiposMovimiento", "Salidas que no se restan ni cuentan como consumo"),
    ("Q14", "Salidas con la cantidad en negativo", "CSV", ctl["q14"],
     "Filtro SAL con cantidad < 0", "CantidadFirmada = ABS(Cantidad) × Signo del tipo", "Esas ventas sumarían stock en vez de restarlo"),
    ("Q05", "Cantidad con punto decimal («12.5») desde Lleida", "CSV", ctl["q05_filas"],
     "Texto que contiene «.» en una columna numérica", "Reemplazar «.» por «,» antes de cambiar el tipo", "El número se queda como texto o se lee mal"),
    ("Q16", "Artículos sin ficha", "Fichas", ctl["sin_ficha"],
     "COINCIDIR sin resultado (#N/D) o combinación «Anti izquierda»", "No se piden ni se valoran; lista para Compras", "Pedido sin proveedor ni coste"),
    ("Q09", "Plazo de entrega vacío", "Fichas", N_PLAZO_VACIO,
     "CONTAR.BLANCO en PlazoEntrega", "Plazo habitual del proveedor (tabla Proveedores)", "Plazo 0: punto de pedido demasiado bajo"),
    ("—", "Recuento del 31/10 con 2 diferencias", "Recuento", 2,
     "Stock teórico frente a recuento", "Manda el recuento: ajuste −3 ud (rotura) y −12,5 m (recorte)", "Stock sobrevalorado y pedido tardío"),
    ("—", "Columna Usuario", "CSV", NM, "No hace falta para el cálculo", "Se quita en Power Query (minimización de datos)", "—"),
]
for k, fila in enumerate(calidad):
    cq.write_row(3 + k, 0, fila, F["txt"])
cq.set_column("A:A", 7)
cq.set_column("B:B", 38)
cq.set_column("C:C", 11)
cq.set_column("D:D", 7)
cq.set_column("E:G", 40)

# ---------- Controles ----------
COD_LED = a.loc[a["Descripcion"].str.contains("LED-0412"), "Cod"].iloc[0]
COD_CABLE = a.loc[a["Descripcion"] == "Cable RZ1-K 0,6/1 kV 3G2,5 mm²", "Cod"].iloc[0]
ct = wb.add_worksheet("Controles")
ct.write(0, 0, "Controles", F["tit"])
ct.write(1, 0, "Control maestro (todos en VERDADERO)", F["sub"])
ct.write_row(3, 0, ["Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Estado"], F["cab"])
ct.write(1, 4, "Filas del CSV leídas por Power Query:")
ct.write_number(1, 6, FILAS_CSV, F["inp_num"])
filas_ct = [
    ("Filas del inventario recibidas", 196, "=ROWS(Inventario[CodArticulo])", 0),
    ("Artículos únicos tras agrupar por código de 6 cifras", 180, "=ROWS(Calc[Cod])", 0),
    ("Unidades del inventario: origen = agrupado (no se pierde ninguna fila)", "=SUM(Inventario[StockContado])", "=SUM(Calc[Stock_30_04])", 0.001),
    ("Filas duplicadas quitadas del CSV (todas del 31/07)", 63, "=$G$2-ROWS(Mov[Fecha])", 0),
    ("Fechas dentro del periodo (01/05 a 31/10)", 1, "=AND(MIN(Mov[Fecha])>=FechaInicio,MAX(Mov[Fecha])<=FechaCorte)*1", 0),
    ("Semanas 19 a 44 con movimientos (ninguna falta)", 26, f'=COUNTIF(Semanas!B{FILA_SEM_FILAS}:AA{FILA_SEM_FILAS},">0")', 0),
    ("Traspasos: la suma de sus cantidades es 0", 0, '=SUMIFS(Mov[Cantidad],Mov[Tipo],"TRA")', 0.001),
    ("Todos los movimientos tienen artículo (Σ Mov = Σ Calc)", "=SUM(Mov[CantidadFirmada])", "=SUM(Calc[MovNeto])", 0.001),
    ("Todo el consumo está en la matriz semanal", "=SUM(Mov[Consumo])", f"=Semanas!AB{FILA_SEM_FILAS + 1}", 0.001),
    ("Artículos con stock negativo", 0, '=COUNTIF(Calc[Stock],"<0")', 0),
    ("Artículos del recuento que cuadran", 8, "=COUNTIFS(Calc[EnRecuento],1,Calc[Ajuste],0)", 0),
    ("Diferencia de recuento del downlight LED-0412 (ud)", -3, f'=SUMIFS(Calc[Ajuste],Calc[Cod],"{COD_LED}")', 0.001),
    ("Diferencia de recuento del cable RZ1-K 3G2,5 (m)", -12.5, f'=SUMIFS(Calc[Ajuste],Calc[Cod],"{COD_CABLE}")', 0.001),
    ("Artículos sin ficha", 3, "=COUNTIF(Calc[ConFicha],0)", 0),
    ("A + B + C = artículos con ficha", "=COUNTIF(Calc[ConFicha],1)", '=COUNTIF(Calc[Clase],"A")+COUNTIF(Calc[Clase],"B")+COUNTIF(Calc[Clase],"C")', 0),
    ("% acumulado del último artículo = 100 %", 1, "=MAX(Calc[Acum])", 0.000001),
    ("La fórmula LET da lo mismo que las columnas paso a paso", 0, "=SUMPRODUCT(--(Calc[Cantidad_LET]<>Calc[Cantidad]))", 0),
    ("Total de la hoja Lunes = Σ importes de Calc", "=SUM(Calc[Importe])", f"=Lunes!C{FILA_LUNES_TOTAL}", 0.005),
]
for k, (t, esp, obt, tol) in enumerate(filas_ct):
    rr = 4 + k
    ct.write(rr, 0, t)
    if isinstance(esp, str):
        ct.write_formula(rr, 1, esp, F["num2"])
    else:
        ct.write_number(rr, 1, esp, F["num2"])
    ct.write_formula(rr, 2, obt, F["num2"])
    ct.write_formula(rr, 3, f"=C{rr + 1}-B{rr + 1}", F["num2"])
    ct.write_number(rr, 4, tol)
    ct.write_formula(rr, 5, f"=ABS(D{rr + 1})<=E{rr + 1}", F["bool"])
ult_ct = 4 + len(filas_ct)
ct.write_formula(1, 5, f"=AND(F5:F{ult_ct})", F["bool"])
ct.conditional_format(f"F5:F{ult_ct}", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
ct.conditional_format(f"F5:F{ult_ct}", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
ct.conditional_format("F2", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
ct.conditional_format("F2", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
ct.set_column("A:A", 62)
ct.set_column("B:E", 14)
ct.set_column("F:F", 11)

# ---------- Cómo se hizo ----------
ch_ws = wb.add_worksheet("Cómo se hizo")
ch_ws.set_column("A:A", 125, F["txt"])
ch_ws.hide_gridlines(2)
M_MOV = '''let
    Origen = Csv.Document(File.Contents("C:\\Compras\\P6\\p6-movimientos.csv"), [Delimiter=";", Columns=8, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),
    // 1) Todo como texto (si Power Query pone «Número entero» en CodArticulo, 000731 pasa a 731)
    ComoTexto = Table.TransformColumnTypes(Encabezados, {{"Fecha", type text}, {"Tipo", type text}, {"CodArticulo", type text}, {"Cantidad", type text}, {"Documento", type text}, {"Línea", Int64.Type}, {"Almacén", type text}, {"Usuario", type text}}),
    // 2) Fecha con la configuración regional Español (España): lee 31/07/2026 y 2026-07-31
    Fecha = Table.TransformColumnTypes(ComoTexto, {{"Fecha", type date}}, "es-ES"),
    // 3) Cantidad: el punto decimal de Lleida pasa a coma y se convierte con Español (España)
    Punto = Table.ReplaceValue(Fecha, ".", ",", Replacer.ReplaceText, {"Cantidad"}),
    Cantidad = Table.TransformColumnTypes(Punto, {{"Cantidad", type number}}, "es-ES"),
    // 4) Tipo: recortar y mayúsculas («salida » y «Salida» pasan a SALIDA)
    Recortar = Table.TransformColumns(Cantidad, {{"Tipo", each Text.Upper(Text.Trim(_)), type text}}),
    // 5) Quitar duplicados por Documento + Línea (son 63, todos del 31/07)
    SinDuplicados = Table.Distinct(Recortar, {"Documento", "Línea"}),
    // 6) Minimización: Usuario no hace falta
    SinUsuario = Table.RemoveColumns(SinDuplicados, {"Usuario"}),
    // 7) Combinar con la tabla TiposMovimiento (de este libro)
    Cruce = Table.NestedJoin(SinUsuario, {"Tipo"}, TiposMovimiento, {"TipoOriginal"}, "T", JoinKind.LeftOuter),
    Expandir = Table.ExpandTableColumn(Cruce, "T", {"Tipo", "Signo", "FactorConsumo"}, {"TipoN", "Signo", "FactorConsumo"}),
    Renombrar = Table.RenameColumns(Expandir, {{"Tipo", "TipoOriginal"}, {"TipoN", "Tipo"}}),
    // 8) Cantidad con signo y consumo
    Firmada = Table.AddColumn(Renombrar, "CantidadFirmada", each Number.Abs([Cantidad]) * [Signo], type number),
    Consumo = Table.AddColumn(Firmada, "Consumo", each Number.Abs([Cantidad]) * [FactorConsumo], type number),
    Columnas = Table.SelectColumns(Consumo, {"Fecha", "TipoOriginal", "Tipo", "CodArticulo", "Cantidad", "Signo", "CantidadFirmada", "FactorConsumo", "Consumo", "Documento", "Línea", "Almacén"})
in
    Columnas'''
M_TIPOS = '''// Consulta TiposMovimiento (solo conexión)
let
    Origen = Excel.CurrentWorkbook(){[Name="TiposMovimiento"]}[Content],
    Tipos = Table.TransformColumnTypes(Origen, {{"TipoOriginal", type text}, {"Tipo", type text}, {"Signo", Int64.Type}, {"FactorConsumo", Int64.Type}})
in
    Tipos'''
M_INV = '''// Consulta Calc: inventario agrupado por artículo (se carga en la hoja Calc y a su derecha se añaden las columnas con fórmulas)
let
    Origen = Excel.CurrentWorkbook(){[Name="Inventario"]}[Content],
    Codigo = Table.TransformColumns(Origen, {{"CodArticulo", each Text.PadStart(Text.From(_), 6, "0"), type text}}),
    Tipos = Table.TransformColumnTypes(Codigo, {{"StockContado", type number}}),
    Agrupar = Table.Group(Tipos, {"CodArticulo"}, {{"Descripción", each List.First([Descripción]), type text}, {"Unidad", each List.First([Unidad]), type text}, {"Ubicaciones", each Table.RowCount(_), Int64.Type}, {"Stock_30_04", each List.Sum([StockContado]), type number}}),
    Renombrar = Table.RenameColumns(Agrupar, {{"CodArticulo", "Cod"}}),
    Ordenar = Table.Sort(Renombrar, {{"Cod", Order.Ascending}})
in
    Ordenar'''
M_DUP = '''// Comprobación de los duplicados (consulta aparte, solo conexión): debe dar 63 filas, todas del 31/07/2026
let
    Origen = Movimientos_sin_quitar_duplicados,   // referencia al paso «Recortar» (clic derecho > Referencia)
    Agrupar = Table.Group(Origen, {"Documento", "Línea"}, {{"Veces", each Table.RowCount(_), Int64.Type}, {"Fecha", each List.Max([Fecha]), type date}}),
    Repetidas = Table.SelectRows(Agrupar, each [Veces] > 1)
in
    Repetidas'''
ESC = ctl
pasos_ch = [
    ("tit", "Cómo se hizo (lo que la librería que genera este archivo no puede crear: consultas, Tabla de datos, escenarios y Pareto)"),
    ("sub", "1. Power Query de movimientos (Datos > Obtener datos > De archivo > De texto/CSV)"),
    ("txt", "1) Elige p6-movimientos.csv. En la ventana de vista previa: Origen del archivo «65001: Unicode (UTF-8)», Delimitador «Punto y coma». Pulsa Transformar datos (no Cargar). 2) Borra el paso «Tipo cambiado» que pone Power Query solo: convierte CodArticulo en número y 000731 pasa a 731. Pon CodArticulo como Texto. 3) Fecha: clic derecho en la columna > Cambiar tipo > Usar configuración regional… > Fecha · Español (España). 4) Cantidad: Transformar > Reemplazar valores «.» por «,»; después Cambiar tipo > Usar configuración regional… > Número decimal · Español (España). 5) Tipo: Transformar > Formato > Recortar y después MAYÚSCULAS. 6) Selecciona Documento y Línea (Ctrl+clic) > Inicio > Quitar filas > Quitar duplicados. 7) Quita la columna Usuario. 8) Inicio > Combinar consultas con TiposMovimiento (Tipo = TipoOriginal, externa izquierda) y expande Tipo, Signo y FactorConsumo. 9) Agregar columna > Columna personalizada: CantidadFirmada = Number.Abs([Cantidad]) * [Signo]; Consumo = Number.Abs([Cantidad]) * [FactorConsumo]. 10) Cerrar y cargar en… Tabla, hoja Mov. 11) En la tabla cargada añade la columna Semana con =ISO.NUM.DE.SEMANA([@Fecha]) (en Excel, no en Power Query: Date.WeekOfYear no es la semana ISO)."),
    ("mono", M_MOV),
    ("mono", M_TIPOS),
    ("mono", M_DUP),
    ("sub", "2. Inventario por artículo (Datos > De una tabla o rango sobre la tabla Inventario)"),
    ("txt", "Columna CodArticulo: Transformar > Formato > Agregar prefijo no sirve (731 necesita 3 ceros y 1234 dos): usa Agregar columna > Columna personalizada con Text.PadStart(Text.From([CodArticulo]), 6, \"0\") o, en Excel, =TEXTO(A2;\"000000\"). Después Inicio > Agrupar por > Opciones avanzadas: CodArticulo; Descripción = Mín; Unidad = Mín; Ubicaciones = Contar filas; Stock_30_04 = Suma de StockContado. NO uses Quitar duplicados: las 16 segundas ubicaciones son stock real."),
    ("mono", M_INV),
    ("sub", "3. Columnas con fórmulas de la hoja Calc (en español, como las verás en tu Excel)"),
    ("txt", "MovNeto: =SUMAR.SI.CONJUNTO(Mov[CantidadFirmada];Mov[CodArticulo];[@Cod]) · Consumo: =SUMAR.SI.CONJUNTO(Mov[Consumo];Mov[CodArticulo];[@Cod]) · Plazo: =SI([@ConFicha]=1;SI(INDICE(Fichas[PlazoEntrega];[@FilaFicha])=\"\";INDICE(Proveedores[PlazoHabitual];COINCIDIR([@Proveedor];Proveedores[Proveedor];0));INDICE(Fichas[PlazoEntrega];[@FilaFicha]));0) · Acum: =SUMAR.SI.CONJUNTO(Calc[ValorAnual];Calc[ValorAnual];\">=\"&[@ValorAnual])/SUMA(Calc[ValorAnual]) · Clase: =SI.CONJUNTO([@Acum]<=CorteA;\"A\";[@Acum]<=CorteB;\"B\";VERDADERO;\"C\") · SS: =REDONDEAR.MAS([@z]*[@SigmaSem]/RAIZ(DiasSemana)*RAIZ([@Plazo]);0) · Cantidad: =SI([@Pedir];MAX([@LoteMin];MULTIPLO.SUPERIOR([@S_max]-[@Posicion];[@Multiplo]));0) · Última salida: =MAX.SI.CONJUNTO(Mov[Fecha];Mov[CodArticulo];[@Cod];Mov[Tipo];\"SAL\"), con formato dd/mm/aaaa;;\"sin salidas\" para que el 0 no se lea como 00/01/1900. En este archivo las fórmulas usan referencias normales (X2) en lugar de [@…] para que también se puedan comprobar fuera de Excel; el resultado es el mismo."),
    ("txt", "Todo en una celda con LET (columna Cantidad_LET): =LET(demanda;[@DemandaDia];sigma_d;[@SigmaSem]/RAIZ(DiasSemana);plazo;[@Plazo];z;INV.NORM.ESTAND([@Nivel]);ss;REDONDEAR.MAS(z*sigma_d*RAIZ(plazo);0);rop;demanda*plazo+ss;s_max;rop+demanda*R_dias;posicion;[@Stock]+[@Pendiente];SI(Y([@ConFicha]=1;demanda>0;posicion<=rop);MAX([@LoteMin];MULTIPLO.SUPERIOR(s_max-posicion;[@Multiplo]));0)). El control «LET = paso a paso» de la hoja Controles comprueba que dan lo mismo. LET existe desde Excel 2021; en Excel 2016/2019 usa las columnas paso a paso."),
    ("sub", "4. Hojas Lunes y Muertos (matrices dinámicas, Microsoft 365)"),
    ("txt", "Lunes: =LET(f;Calc[Cantidad]>0;ORDENARPOR(FILTRAR(APILARH(Calc[Proveedor];Calc[Cod];Calc[Descripción];Calc[Unidad];Calc[Cantidad];Calc[Coste];Calc[Importe];Calc[Posicion];Calc[ROP]);f);FILTRAR(Calc[Proveedor];f);1;FILTRAR(Calc[Importe];f);-1)). APILARH es de Excel 2024/365; en Excel 2021 escribe una FILTRAR por columna con el mismo criterio y la misma ORDENARPOR. En Excel 2016/2019: filtro de la tabla Calc por Cantidad > 0, ordenado por Proveedor, y copiar como valores en una hoja de envío. Los totales por proveedor usan SUMAR.SI.CONJUNTO y CONTAR.SI.CONJUNTO, que funcionan en todas las versiones. Para imprimir: Disposición de página (o Diseño de página) > Orientación horizontal, Ajustar a 1 página de ancho, Imprimir títulos con la fila de encabezados."),
    ("sub", "5. Tabla de datos (Datos > Previsión > Análisis de hipótesis > Tabla de datos)"),
    ("txt", f"1) En una hoja aparte escribe en A2:A5 los niveles 90 %, 95 %, 97,5 % y 99 %. 2) En B1 pon =SUMA(Calc[ValorSS]). 3) Selecciona A1:B5 > Tabla de datos > Celda de entrada (columna): Parámetros!B14 (NivelUnico). Excel rellena B2:B5. 4) Si el libro va lento, Fórmulas > Opciones para el cálculo > Automático excepto en las tablas de datos. Resultado esperado: 90 % → {es(ctl['sensibilidad_ss']['0.9'])} € · 95 % → {es(ctl['sensibilidad_ss']['0.95'])} € · 97,5 % → {es(ctl['sensibilidad_ss']['0.975'])} € · 99 % → {es(ctl['sensibilidad_ss']['0.99'])} € (con los niveles pactados 95/95/90: {es(ctl['valor_ss'])} €). La hoja «Que_pasaria_si» da las mismas cifras con SUMAPRODUCTO."),
    ("sub", "6. Administrador de escenarios (Datos > Previsión > Análisis de hipótesis > Administrador de escenarios)"),
    ("txt", f"Celdas cambiantes: Parámetros!B18 (RetrasoTormes) y Parámetros!B10 (R_dias). Escenarios: «Base» (0 y 5), «Tormes retrasa 5 días» (5 y 5) y «Cierre de Tormes y revisión quincenal» (12 y 10). Botón Resumen > Celdas de resultado: Resumen!B5 (líneas) y Resumen!B6 (importe). Resultado esperado: Base {ctl['lineas_pedido']} líneas y {es(ctl['importe_pedido'])} € · Tormes +5: {ctl['esc_tormes5'][0]} líneas y {es(ctl['esc_tormes5'][1])} € (Tormes pasa de {ctl['base_tormes'][0]} a {ctl['esc_tormes5_tormes'][0]} líneas) · Cierre + quincenal: {ctl['esc_cierre'][0]} líneas y {es(ctl['esc_cierre'][1])} €. Después de ver cada escenario, vuelve a «Base»."),
    ("sub", "7. Gráfico de Pareto"),
    ("txt", "En Microsoft 365: selecciona Descripción y Valor de la hoja ABC > Insertar > Insertar gráfico estadístico > Pareto (si no lo encuentras, Insertar > Gráficos recomendados > Todos los gráficos > Histograma > Pareto). En este archivo va hecho a mano, como en versiones antiguas: columnas con el valor ordenado de mayor a menor y una línea con el % acumulado en el eje secundario (Insertar > Insertar gráfico combinado). Añade texto alternativo: clic derecho > Ver texto alternativo."),
    ("sub", "8. Formato y protección"),
    ("txt", "Semáforo de cobertura: Inicio > Formato condicional > Reglas para resaltar celdas > Texto que contiene «Rojo», «Ámbar», «Verde» (la palabra se ve siempre: no depende solo del color). Controles: formato condicional verde/rojo sobre VERDADERO/FALSO y control maestro =Y(F5:F22). Parámetros: Datos > Validación de datos (niveles entre 50 % y 99,9 %). Revisar > Proteger hoja en Calc y Controles, dejando desbloqueadas solo las celdas amarillas."),
]
fila_ch = 0
for fm, t in pasos_ch:
    if fm == "mono":
        for linea in t.split("\n"):
            ch_ws.write_string(fila_ch, 0, linea, F["mono"])
            fila_ch += 1
        fila_ch += 1
    else:
        ch_ws.write(fila_ch, 0, t, F[fm])
        fila_ch += 1

wb.close()
print("escrito", SALIDA)

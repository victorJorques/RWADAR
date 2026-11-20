# -*- coding: utf-8 -*-
"""
P5 · Informe mensual de ventas automatizado · SOLUCIÓN
======================================================

1. Lee la carpeta que genera p5_datos.py (libros/p5-carpeta/Ventas) EXACTAMENTE como la
   dejaría la limpieza pactada con Javier (lo mismo que hace la consulta de Power Query):
     - solo los CSV de exportación (fuera «ventas_2026_09 - copia.csv»);
     - marzo con «,» y configuración Inglés (Estados Unidos); mayo sin la línea de título;
     - CodProducto a 6 dígitos (agosto); Delegación recortada, en mayúsculas y con mapa;
     - Familia del maestro, «Sin clasificar» para los 7 huérfanos;
     - Coste = (CosteUnitario si lo hay; si no, CosteEstandar) × Cantidad; Margen = ImporteNeto − Coste.
2. Comprueba cada mes contra Control_ERP y todos los totales contra p5_verdad.json
   (calculados con los datos verdaderos ANTES de ensuciarlos).
3. Escribe libros/p5-solucion.xlsx con fórmulas reales de Excel (en inglés y con comas en el
   archivo; Excel en español las muestra traducidas), hoja «Controles», hoja «Cómo se hizo»
   (Power Query, tablas dinámicas, segmentaciones, escala de tiempo, macro) y los valores
   calculados guardados en cada fórmula.
4. Escribe libros/src/p5_controles.json con los totales de control para proyectos/p5.json.
"""
import glob
import json
import re
import os
import datetime as dt

import numpy as np
import pandas as pd
import xlsxwriter
from xlsxwriter.utility import xl_rowcol_to_cell as rc, xl_col_to_name as coln

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
ERP = os.path.join(LIBROS, "p5-carpeta", "Ventas", "ERP")
NOV = os.path.join(LIBROS, "p5-carpeta", "Ventas", "Llega_en_diciembre", "ventas_2026_11.csv")
DATOS = os.path.join(LIBROS, "p5-datos.xlsx")
SALIDA = os.path.join(LIBROS, "p5-solucion.xlsx")

FAMILIAS6 = ["Cable", "Iluminación", "Mecanismos", "Protección", "Canalización", "Herramienta"]
FAMILIAS_INF = FAMILIAS6 + ["Portes y servicios", "Ajustes", "Sin clasificar"]
DELEGS = ["Zaragoza", "Pamplona", "Lleida"]
MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MESES_NOM = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
             "noviembre", "diciembre"]
MAPA = {"ZARAGOZA": "Zaragoza", "ZGZ": "Zaragoza", "PAMPLONA/IRUÑA": "Pamplona", "PAMPLONA": "Pamplona",
        "IRUÑA": "Pamplona", "LLEIDA": "Lleida", "LÉRIDA": "Lleida", "LERIDA": "Lleida"}
FECHA_CORTE = dt.datetime(2026, 10, 31)


# ---------------------------------------------------------------------------
# 1. Leer y limpiar (equivale a la consulta «Ventas» de Power Query)
# ---------------------------------------------------------------------------
def leer_csv(ruta):
    nombre = os.path.basename(ruta)
    with open(ruta, encoding="utf-8-sig") as fh:
        primera = fh.readline()
    salto = 0 if primera.startswith("Fecha") else 1           # Q11: mayo trae un título
    with open(ruta, encoding="utf-8-sig") as fh:
        lineas = fh.read().splitlines()
    cab = lineas[salto]
    sep = ";" if ";" in cab else ","                           # Q19: marzo viene con «,»
    df = pd.read_csv(ruta, sep=sep, skiprows=salto, dtype=str, encoding="utf-8-sig", keep_default_na=False)
    df = df.rename(columns={"Importe Neto": "ImporteNeto"})   # cambio de noviembre (renombrado tolerante)
    if "CosteUnitario" not in df.columns:                      # Q18: antes de julio no existe
        df["CosteUnitario"] = ""
    en_us = sep == ","
    for c in ["Cantidad", "PrecioUnitario", "DtoLinea", "ImporteNeto", "CosteUnitario"]:
        s = df[c].str.strip()
        if not en_us:
            s = s.str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
        df[c] = pd.to_numeric(s.replace("", np.nan))
    df["Fecha"] = pd.to_datetime(df["Fecha"], format="%m/%d/%Y" if en_us else "%d/%m/%Y")
    df["CodProducto"] = df["CodProducto"].str.strip().str.zfill(6)    # Q13: agosto sin ceros
    df["DelegacionERP"] = df["Delegacion"]
    df["Delegacion"] = df["Delegacion"].str.strip().str.upper().map({**MAPA, "LOGROÑO": "Logroño"})
    df["NumAlbaran"] = df["NumAlbaran"].replace("", np.nan)
    df.insert(0, "Archivo", nombre)
    return df, {"archivo": nombre, "separador": sep, "salto": salto, "columnas": len(df.columns) - 2}


def limpiar(df, productos, comerciales):
    df = df.merge(productos[["CodProducto", "Familia", "Subfamilia", "CosteEstandar"]], on="CodProducto", how="left")
    df["Familia"] = df["Familia"].fillna("Sin clasificar")
    df["Mes"] = df["Fecha"].values.astype("datetime64[M]")
    df["CosteUsado"] = np.where(df["CosteUnitario"].notna(), df["CosteUnitario"], df["CosteEstandar"])
    df["Coste"] = df["CosteUsado"] * df["Cantidad"]
    df["Margen"] = df["ImporteNeto"] - df["Coste"]
    df["CuentaComercial"] = np.where(df["Familia"] == "Ajustes", "No", "Sí")
    return df


def main():
    productos = pd.read_excel(DATOS, sheet_name="Productos", dtype={"CodProducto": str})
    comerciales = pd.read_excel(DATOS, sheet_name="Comerciales", dtype={"CodComercial": str})
    clientes = pd.read_excel(DATOS, sheet_name="Clientes", dtype={"CodCliente": str, "NIF": str})
    objetivos_ancho = pd.read_excel(DATOS, sheet_name="Objetivos_2026", dtype={"CodComercial": str})
    v25_ancho = pd.read_excel(DATOS, sheet_name="Ventas_2025_resumen")
    ctrl = pd.read_excel(DATOS, sheet_name="Control_ERP").dropna(subset=["NumLineas"])
    verdad = json.load(open(os.path.join(AQUI, "p5_verdad.json"), encoding="utf-8"))

    archivos = sorted(glob.glob(os.path.join(ERP, "*.csv")))
    validos = [a for a in archivos if os.path.basename(a).startswith("ventas_") and " " not in os.path.basename(a)]
    descartados = [os.path.basename(a) for a in archivos if a not in validos]
    assert descartados == ["ventas_2026_09 - copia.csv"], descartados
    partes, perfil = [], []
    for a in validos:
        d, p = leer_csv(a)
        partes.append(d)
        perfil.append(p)
    crudo = pd.concat(partes, ignore_index=True)
    assert crudo["Delegacion"].notna().all(), crudo.loc[crudo["Delegacion"].isna(), "DelegacionERP"].unique()
    v = limpiar(crudo, productos, comerciales)

    # ---- cuadre con el ERP ----
    por_archivo = v.groupby("Archivo").agg(n=("ImporteNeto", "size"), s=("ImporteNeto", "sum"))
    for _, r in ctrl.iterrows():
        n, s = por_archivo.loc[r["Archivo"]]
        assert int(n) == int(r["NumLineas"]) and abs(s - r["ImporteNeto"]) < 0.005, (r["Archivo"], n, s)
    assert v["Coste"].notna().all()

    total = round(v["ImporteNeto"].sum(), 2)
    comp = v[v["CuentaComercial"] == "Sí"]
    com_g = comp.groupby("CodComercial")[["ImporteNeto", "Margen"]].sum()
    com_g["pct"] = com_g["Margen"] / com_g["ImporteNeto"]

    # objetivos y 2025 en formato largo
    obj = objetivos_ancho.melt(id_vars=["CodComercial", "Comercial"], var_name="MesAbr", value_name="Objetivo").dropna(subset=["Objetivo"])
    obj["NumMes"] = obj["MesAbr"].map({a: i + 1 for i, a in enumerate(MESES_ABR)})
    obj["Mes"] = pd.to_datetime(dict(year=2026, month=obj["NumMes"], day=1))
    obj = obj.merge(comerciales[["CodComercial", "Delegacion"]], on="CodComercial", how="left")
    obj = obj.sort_values(["CodComercial", "NumMes"]).reset_index(drop=True)
    v25 = v25_ancho.melt(id_vars=["Delegacion", "Familia"], var_name="MesAbr", value_name="Importe")
    v25["Delegacion"] = v25["Delegacion"].str.strip().str.upper().map(MAPA)
    assert v25["Delegacion"].notna().all()
    v25["NumMes"] = v25["MesAbr"].map({a: i + 1 for i, a in enumerate(MESES_ABR)})
    v25["Mes"] = pd.to_datetime(dict(year=2025, month=v25["NumMes"], day=1))

    ob10 = obj[obj["NumMes"] <= 10]
    s25_10 = v25[v25["NumMes"] <= 10]["Importe"].sum()
    s26_6 = v[v["Familia"].isin(FAMILIAS6)]["ImporteNeto"].sum()
    pamplona = comp.loc[comp["Delegacion"] == "Pamplona", "ImporteNeto"].sum() / ob10.loc[ob10["Delegacion"] == "Pamplona", "Objetivo"].sum()

    calculado = {
        "lineas": int(len(v)), "ventas_total": float(total),
        "ventas_lleida": round(float(v.loc[v["Delegacion"] == "Lleida", "ImporteNeto"].sum()), 2),
        "sin_clasificar": round(float(v.loc[v["Familia"] == "Sin clasificar", "ImporteNeto"].sum()), 2),
        "huerfanos": int(v.loc[v["Familia"] == "Sin clasificar", "CodProducto"].nunique()),
        "margen_total": round(float(v["Margen"].sum()), 2),
        "comerciales_margen_bajo": int((com_g["pct"] < 0.22).sum()),
        "var_6fam_pct": round(float((s26_6 / s25_10 - 1) * 100), 1),
        "cumpl_pamplona_pct": round(float(pamplona * 100), 1),
    }
    for k, x in calculado.items():
        assert abs(x - verdad[k]) < 0.005, (k, x, verdad[k])
    print("Limpieza correcta: todos los totales coinciden con la verdad.")

    # ---- noviembre (cambio inesperado) ----
    dn, pn = leer_csv(NOV)
    nov = limpiar(dn, productos, comerciales)
    assert abs(nov["ImporteNeto"].sum() - verdad["noviembre"]["ventas"]) < 0.005
    nov_info = {
        "lineas": int(len(nov)), "ventas": round(float(nov["ImporteNeto"].sum()), 2),
        "logrono": round(float(nov.loc[nov["Delegacion"] == "Logroño", "ImporteNeto"].sum()), 2),
        "comerciales_nuevos": sorted(set(nov["CodComercial"]) - set(comerciales["CodComercial"])),
        "sin_clasificar_nov": round(float(nov.loc[nov["Familia"] == "Sin clasificar", "ImporteNeto"].sum()), 2),
    }

    escribir(v, productos, comerciales, clientes, obj, v25, ctrl, perfil, descartados, com_g, nov_info)

    # ---- totales de control para p5.json ----
    controles = {**calculado, "noviembre": nov_info}
    extra = analisis(v, v25, obj, com_g, comerciales, clientes)
    controles["analisis"] = extra
    with open(os.path.join(AQUI, "p5_controles.json"), "w", encoding="utf-8") as fh:
        json.dump(controles, fh, ensure_ascii=False, indent=2, default=float)
    print(json.dumps(controles, ensure_ascii=False, indent=1, default=float)[:3000])


def analisis(v, v25, obj, com_g, comerciales, clientes):
    """Cifras para la solución comentada y el correo de entrega."""
    out = {}
    tot = v["ImporteNeto"].sum()
    d26 = v[v["Familia"].isin(FAMILIAS6)].groupby("Delegacion")["ImporteNeto"].sum()
    d25 = v25[v25["NumMes"] <= 10].groupby("Delegacion")["Importe"].sum()
    out["deleg"] = {d: {"ventas": round(float(v.loc[v["Delegacion"] == d, "ImporteNeto"].sum()), 2),
                        "ventas6": round(float(d26[d]), 2), "v2025": round(float(d25[d]), 2),
                        "var": round(float(d26[d] / d25[d] - 1) * 100, 1),
                        "margen_pct": round(float(v.loc[v["Delegacion"] == d, "Margen"].sum() / v.loc[v["Delegacion"] == d, "ImporteNeto"].sum() * 100), 1)}
                    for d in DELEGS}
    f26 = v.groupby("Familia")[["ImporteNeto", "Margen"]].sum()
    f25 = v25[v25["NumMes"] <= 10].groupby("Familia")["Importe"].sum()
    out["familia"] = {f: {"ventas": round(float(f26.loc[f, "ImporteNeto"]), 2),
                          "margen_pct": round(float(f26.loc[f, "Margen"] / f26.loc[f, "ImporteNeto"] * 100), 1) if f26.loc[f, "ImporteNeto"] else None,
                          "var": round(float(f26.loc[f, "ImporteNeto"] / f25[f] - 1) * 100, 1) if f in f25 else None}
                      for f in FAMILIAS_INF}
    ob10 = obj[obj["NumMes"] <= 10].groupby("CodComercial")["Objetivo"].sum()
    nombres = comerciales.set_index("CodComercial")["Nombre"]
    out["comercial"] = {c: {"nombre": nombres[c], "ventas": round(float(com_g.loc[c, "ImporteNeto"]), 2),
                            "objetivo": float(ob10.get(c, 0)),
                            "cumpl": round(float(com_g.loc[c, "ImporteNeto"] / ob10[c] * 100), 1),
                            "margen_pct": round(float(com_g.loc[c, "pct"] * 100), 1)} for c in com_g.index}
    comp = v[v["CuentaComercial"] == "Sí"]
    ob_del = obj[obj["NumMes"] <= 10].groupby("Delegacion")["Objetivo"].sum()
    out["cumpl_deleg"] = {d: round(float(comp.loc[comp["Delegacion"] == d, "ImporteNeto"].sum() / ob_del[d] * 100), 1) for d in DELEGS}
    out["cumpl_total"] = round(float(comp["ImporteNeto"].sum() / ob_del.sum() * 100), 1)
    s26_6 = v[v["Familia"].isin(FAMILIAS6)]["ImporteNeto"].sum()
    s25 = v25[v25["NumMes"] <= 10]["Importe"].sum()
    out["ventas6_2026"] = round(float(s26_6), 2)
    out["ventas6_2025"] = round(float(s25), 2)
    out["margen_pct"] = round(float(v["Margen"].sum() / tot * 100), 1)
    out["ajustes"] = round(float(v.loc[v["Familia"] == "Ajustes", "ImporteNeto"].sum()), 2)
    out["portes"] = round(float(v.loc[v["Familia"] == "Portes y servicios", "ImporteNeto"].sum()), 2)
    out["devoluciones"] = round(float(v.loc[v["Cantidad"] < 0, "ImporteNeto"].sum()), 2)
    out["n_devoluciones"] = int((v["Cantidad"] < 0).sum())
    jul = v[v["Mes"] >= "2026-07-01"]
    out["efecto_coste_julio"] = round(float(((jul["CosteUnitario"] - jul["CosteEstandar"]) * jul["Cantidad"]).sum()), 2)
    m1 = v[v["Mes"] < "2026-07-01"]
    out["margen_pct_ene_jun"] = round(float(m1["Margen"].sum() / m1["ImporteNeto"].sum() * 100), 1)
    out["margen_pct_jul_oct"] = round(float(jul["Margen"].sum() / jul["ImporteNeto"].sum() * 100), 1)
    out["margen_pct_jul_oct_estandar"] = round(float((jul["ImporteNeto"].sum() - (jul["CosteEstandar"] * jul["Cantidad"]).sum()) / jul["ImporteNeto"].sum() * 100), 1)
    # media de porcentajes por comercial (error típico) frente a Σ/Σ
    out["media_pct_comerciales"] = round(float(com_g["pct"].mean() * 100), 1)
    cli = v.groupby("CodCliente")["ImporteNeto"].sum().sort_values(ascending=False)
    out["top20_pct"] = round(float(cli.head(20).sum() / tot * 100), 1)
    out["clientes_activos"] = int((cli != 0).sum())
    out["n_clientes_80"] = int((cli.cumsum() / tot <= 0.8).sum() + 1)
    mes = v.groupby(v["Mes"].dt.month)["ImporteNeto"].sum()
    out["agosto_vs_media"] = round(float(mes[8] / mes.drop(8).mean() - 1) * 100, 1)
    out["mes_ventas"] = {int(m): round(float(x), 2) for m, x in mes.items()}
    # errores típicos: cuánto saldría mal
    mar = v[v["Archivo"] == "ventas_2026_03.csv"]["ImporteNeto"].sum()
    out["marzo"] = round(float(mar), 2)
    out["mayo"] = round(float(v[v["Archivo"] == "ventas_2026_05.csv"]["ImporteNeto"].sum()), 2)
    out["septiembre"] = round(float(v[v["Archivo"] == "ventas_2026_09.csv"]["ImporteNeto"].sum()), 2)
    ago = v[(v["Archivo"] == "ventas_2026_08.csv") & (~v["Familia"].isin(["Sin clasificar"]))]["ImporteNeto"].sum()
    out["agosto_sin_ceros"] = round(float(ago), 2)
    out["total_con_ajustes_en_comerciales"] = round(float(v["ImporteNeto"].sum()), 2)
    out["lineas_delegacion_mal_escrita"] = int((v["DelegacionERP"] != v["Delegacion"]).sum())
    # margen si se usara solo el coste estándar en todo el año
    out["margen_solo_estandar"] = round(float((v["ImporteNeto"] - v["CosteEstandar"].fillna(v["CosteUnitario"]) * v["Cantidad"]).sum()), 2)
    return out


# ---------------------------------------------------------------------------
# 2. Libro de la solución
# ---------------------------------------------------------------------------
class Hoja:
    """Escribe fórmulas con su valor ya calculado (para visores que no recalculan)."""

    def __init__(self, ws):
        self.ws = ws

    def f(self, fila, col, formula, valor, fmt=None):
        if isinstance(valor, (np.floating, np.integer)):
            valor = valor.item()
        if valor is None or (isinstance(valor, float) and np.isnan(valor)):
            valor = ""
        self.ws.write_formula(fila, col, formula, fmt, valor)


def escribir(v, productos, comerciales, clientes, obj, v25, ctrl, perfil, descartados, com_g, nov_info):
    wb = xlsxwriter.Workbook(SALIDA, {"use_future_functions": True})
    wb.set_properties({"title": "P5 · Informe mensual de ventas · solución", "author": "Hoja a hoja (solución de referencia)",
                       "comments": "Datos inventados. Versión de la entrega de octubre (v01)."})
    F = {}
    F["t"] = wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F3864"})
    F["st"] = wb.add_format({"italic": True, "font_color": "#595959"})
    F["h"] = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "bottom": 1})
    F["cab"] = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"})
    F["eur"] = wb.add_format({"num_format": '#,##0.00 "€"'})
    F["eur0"] = wb.add_format({"num_format": '#,##0 "€"'})
    F["eur0b"] = wb.add_format({"num_format": '#,##0 "€"', "bold": True, "top": 1})
    F["pct"] = wb.add_format({"num_format": "0.0%"})
    F["pctb"] = wb.add_format({"num_format": "0.0%", "bold": True, "top": 1})
    F["int"] = wb.add_format({"num_format": "#,##0"})
    F["fecha"] = wb.add_format({"num_format": "dd/mm/yyyy"})
    F["mes"] = wb.add_format({"num_format": "mmm yyyy"})
    F["c4"] = wb.add_format({"num_format": "#,##0.0000"})
    F["txt"] = wb.add_format({"num_format": "@"})
    F["wrap"] = wb.add_format({"text_wrap": True, "valign": "top"})
    F["mono"] = wb.add_format({"font_name": "Consolas", "font_size": 10, "font_color": "#203864", "bg_color": "#F2F2F2"})
    F["entrada"] = wb.add_format({"bg_color": "#FFF2CC", "border": 1})
    F["entrada_f"] = wb.add_format({"bg_color": "#FFF2CC", "border": 1, "num_format": "dd/mm/yyyy"})
    F["entrada_p"] = wb.add_format({"bg_color": "#FFF2CC", "border": 1, "num_format": "0%"})
    F["entrada_e"] = wb.add_format({"bg_color": "#FFF2CC", "border": 1, "num_format": "0.00"})
    F["kpi_t"] = wb.add_format({"font_color": "#595959", "font_size": 9, "text_wrap": True, "valign": "top"})
    F["kpi_e"] = wb.add_format({"bold": True, "font_size": 14, "num_format": '#,##0 "€"'})
    F["kpi_p"] = wb.add_format({"bold": True, "font_size": 14, "num_format": "0.0%"})
    F["kpi_n"] = wb.add_format({"bold": True, "font_size": 14, "num_format": "#,##0"})
    F["ok"] = wb.add_format({"bold": True, "font_color": "#006100", "bg_color": "#C6EFCE"})
    F["mal"] = wb.add_format({"bold": True, "font_color": "#9C0006", "bg_color": "#FFC7CE"})
    F["estado"] = wb.add_format({"bold": True, "align": "center"})
    F["maestro"] = wb.add_format({"bold": True, "font_size": 14, "align": "center", "border": 2})
    F["b"] = wb.add_format({"bold": True})
    F["bt"] = wb.add_format({"bold": True, "top": 1})

    nombres_hojas = ["Léame", "Cómo se hizo", "Informe_Direccion", "Informe_Reunion", "Controles", "Calidad_datos",
                     "Huerfanos", "Parametros", "MapaDelegaciones", "Meses", "Ventas", "Comparacion", "Objetivos",
                     "Ventas2025", "Control_ERP", "Comerciales", "Clientes"]
    ws = {n: wb.add_worksheet(n) for n in nombres_hojas}

    # ------------------------------------------------------------------ Parámetros
    p = ws["Parametros"]
    p.set_column("A:A", 34)
    p.set_column("B:B", 30)
    p.set_column("C:C", 70)
    p.write("A1", "Parámetros (celdas amarillas: se pueden cambiar)", F["t"])
    p.write_row("A3", ["Parámetro", "Valor", "Para qué sirve"], F["cab"])
    params = [("FechaCorte", dt.datetime(2026, 10, 31), F["entrada_f"], "Último día del periodo del informe. Los acumulados y la comparación con 2025 llegan hasta su mes."),
              ("InicioCosteLinea", dt.datetime(2026, 7, 1), F["entrada_f"], "Desde esta fecha el ERP trae CosteUnitario en cada línea; antes se usa CosteEstandar del maestro."),
              ("UmbralMargen", 0.22, F["entrada_p"], "Margen bruto % por debajo del cual se marca a un comercial («Margen bajo»)."),
              ("Tolerancia", 0.01, F["entrada_e"], "Diferencia máxima admitida en euros en los controles (redondeos)."),
              ("AnioBase", 2025, F["entrada"], "Año con el que se compara (solo hay detalle por delegación y familia)."),
              ("RutaERP", r"C:\Ventas\ERP\\", F["entrada"], "Carpeta de las exportaciones; la consulta de Power Query la lee de aquí. Cámbiala si mueves la carpeta.")]
    for i, (n, val, fm, txt) in enumerate(params):
        fila = 3 + i
        p.write_string(fila, 0, n, F["b"])
        if isinstance(val, dt.datetime):
            p.write_datetime(fila, 1, val, fm)
        elif isinstance(val, str):
            p.write_string(fila, 1, val, fm)
        else:
            p.write_number(fila, 1, val, fm)
        p.write_string(fila, 2, txt, F["wrap"])
        wb.define_name(n, f"=Parametros!$B${fila + 1}")
    p.write("A11", "Cada parámetro tiene un nombre definido (Fórmulas > Administrador de nombres) y las fórmulas lo usan por su nombre.", F["st"])

    # ------------------------------------------------------------------ Tablas auxiliares
    def tabla(hoja, nombre, df, formatos, anchos, fila0=0, col_formulas=None):
        w = ws[hoja]
        cols = list(df.columns)
        n = len(df)
        opciones = {"name": nombre, "style": "Table Style Medium 2",
                    "columns": [{"header": c} for c in cols]}
        if col_formulas:
            for c, (formula, _) in col_formulas.items():
                opciones["columns"].append({"header": c, "formula": formula})
        ncols = len(opciones["columns"])
        w.add_table(fila0, 0, fila0 + max(n, 1), ncols - 1, opciones)
        for j, c in enumerate(cols):
            w.set_column(j, j, anchos.get(c, 12), formatos.get(c))
            col = df[c].tolist()
            fm = formatos.get(c)
            for i, val in enumerate(col):
                r = fila0 + 1 + i
                if val is None or (not isinstance(val, str) and pd.isna(val)):
                    continue
                if isinstance(val, (pd.Timestamp, dt.datetime)):
                    w.write_datetime(r, j, pd.Timestamp(val).to_pydatetime(), fm)
                elif isinstance(val, str):
                    w.write_string(r, j, val, fm)
                else:
                    w.write_number(r, j, float(val), fm)
        if col_formulas:
            for k, (c, (formula, valores)) in enumerate(col_formulas.items()):
                j = len(cols) + k
                w.set_column(j, j, anchos.get(c, 14), formatos.get(c))
                for i, val in enumerate(valores):
                    Hoja(w).f(fila0 + 1 + i, j, re.sub(r"\[@([^\]]+)\]", nombre + r"[[#This Row],[\1]]", formula), val, formatos.get(c))
        w.freeze_panes(fila0 + 1, 0)
        return w

    # MapaDelegaciones y Meses
    mapa = pd.DataFrame({"Original": list(MAPA.keys()), "Delegacion": list(MAPA.values())})
    tabla("MapaDelegaciones", "MapaDelegaciones", mapa, {}, {"Original": 22, "Delegacion": 14})
    meses = pd.DataFrame({"MesAbr": MESES_ABR, "NumMes": list(range(1, 13)), "NombreMes": MESES_NOM})
    tabla("Meses", "Meses", meses, {}, {"MesAbr": 10, "NumMes": 9, "NombreMes": 14})

    # Ventas (lo que carga Power Query)
    cols_v = ["Archivo", "Fecha", "Mes", "NumAlbaran", "NumFactura", "CodCliente", "CodProducto", "Descripcion", "Cantidad",
              "PrecioUnitario", "DtoLinea", "ImporteNeto", "DelegacionERP", "Delegacion", "CodComercial", "CosteUnitario",
              "Familia", "Subfamilia", "CosteEstandar", "Coste", "Margen", "CuentaComercial"]
    vv = v[cols_v].copy()
    vv["Coste"] = vv["Coste"].round(4)
    vv["Margen"] = vv["Margen"].round(4)
    tabla("Ventas", "Ventas", vv,
          {"Fecha": F["fecha"], "Mes": F["mes"], "PrecioUnitario": F["c4"], "CosteUnitario": F["c4"], "CosteEstandar": F["c4"],
           "ImporteNeto": F["eur"], "Coste": F["eur"], "Margen": F["eur"], "CodProducto": F["txt"]},
          {"Archivo": 19, "Fecha": 11, "Mes": 10, "NumAlbaran": 12, "NumFactura": 12, "CodCliente": 10, "CodProducto": 11,
           "Descripcion": 50, "DelegacionERP": 15, "Delegacion": 11, "CodComercial": 8, "Familia": 16, "Subfamilia": 20,
           "ImporteNeto": 13, "Coste": 13, "Margen": 13, "CuentaComercial": 9})

    # Comparacion (hecho anexado)
    real = (v.assign(NumMes=v["Mes"].dt.month)
            .groupby(["Delegacion", "Familia", "CodComercial", "Mes", "NumMes"], as_index=False)["ImporteNeto"].sum()
            .rename(columns={"ImporteNeto": "Importe"}))
    real["Tipo"], real["Año"] = "Real", 2026
    r25 = v25[["Delegacion", "Familia", "Mes", "NumMes", "Importe"]].copy()
    r25["Tipo"], r25["Año"], r25["CodComercial"] = "Real", 2025, None
    ro = obj[["CodComercial", "Delegacion", "Mes", "NumMes", "Objetivo"]].rename(columns={"Objetivo": "Importe"})
    ro["Tipo"], ro["Año"], ro["Familia"] = "Objetivo", 2026, None
    comp_df = pd.concat([real, r25, ro], ignore_index=True)
    comp_df["Comparable"] = np.where(comp_df["Familia"].isin(FAMILIAS6), "Sí", "No")
    comp_df = comp_df[["Tipo", "Año", "NumMes", "Mes", "Delegacion", "Familia", "Comparable", "CodComercial", "Importe"]]
    comp_df["Importe"] = comp_df["Importe"].round(2)
    tabla("Comparacion", "Comparacion", comp_df, {"Mes": F["mes"], "Importe": F["eur"]},
          {"Tipo": 10, "Año": 7, "NumMes": 8, "Mes": 10, "Delegacion": 11, "Familia": 18, "Comparable": 11, "CodComercial": 13, "Importe": 14})

    # Objetivos y 2025 (largos)
    tabla("Objetivos", "Objetivos", obj[["CodComercial", "Comercial", "Delegacion", "Mes", "NumMes", "Objetivo"]],
          {"Mes": F["mes"], "Objetivo": F["eur0"]}, {"CodComercial": 13, "Comercial": 26, "Delegacion": 11, "Mes": 10, "Objetivo": 13})
    tabla("Ventas2025", "Ventas2025", v25[["Delegacion", "Familia", "Mes", "NumMes", "Importe"]],
          {"Mes": F["mes"], "Importe": F["eur"]}, {"Delegacion": 11, "Familia": 16, "Mes": 10, "Importe": 14})
    c_e = ctrl[["Archivo", "Mes", "NumLineas", "ImporteNeto"]].copy()
    tabla("Control_ERP", "ControlERP", c_e, {"Mes": F["mes"], "NumLineas": F["int"], "ImporteNeto": F["eur"]},
          {"Archivo": 20, "Mes": 11, "NumLineas": 11, "ImporteNeto": 15})
    com_t = comerciales[["CodComercial", "Nombre", "Delegacion", "FechaAlta", "FechaBaja"]]
    tabla("Comerciales", "Comerciales", com_t, {"FechaAlta": F["fecha"], "FechaBaja": F["fecha"]},
          {"CodComercial": 13, "Nombre": 26, "Delegacion": 11, "FechaAlta": 11, "FechaBaja": 11})
    ventas_cli = v.groupby("CodCliente")["ImporteNeto"].sum()
    cl = clientes[["CodCliente", "Nombre", "Poblacion", "Provincia", "Delegacion"]].sort_values("CodCliente").reset_index(drop=True)
    vals_cli = [round(float(ventas_cli.get(c, 0.0)), 2) for c in cl["CodCliente"]]
    tabla("Clientes", "Clientes", cl, {"Ventas2026": F["eur"]},
          {"CodCliente": 10, "Nombre": 44, "Poblacion": 22, "Provincia": 11, "Delegacion": 11, "Ventas2026": 15},
          col_formulas={"Ventas2026": ("=SUMIFS(Ventas[ImporteNeto],Ventas[CodCliente],[@CodCliente])", vals_cli)})
    ws["Clientes"].write(len(cl) + 2, 0, "Sin NIF: el informe no lo necesita (minimización de datos).", F["st"])

    # ------------------------------------------------------------------ Huérfanos
    h = v[v["Familia"] == "Sin clasificar"].groupby("CodProducto").agg(
        Descripcion=("Descripcion", "first"), Lineas=("ImporteNeto", "size"), Ventas=("ImporteNeto", "sum"),
        Primera=("Fecha", "min")).reset_index()
    hu = ws["Huerfanos"]
    hu.write("A1", "Códigos sin pareja en Productos (para que Compras los dé de alta)", F["t"])
    hu.write("A2", "Salen de Combinar consultas Ventas × Productos con «Anti izquierda». Mientras no tengan alta, su familia es «Sin clasificar».", F["st"])
    hu_df = h[["CodProducto"]].copy()
    tabla("Huerfanos", "Huerfanos", hu_df, {"CodProducto": F["txt"], "Lineas": F["int"], "Ventas": F["eur"], "PrimeraVenta": F["fecha"]},
          {"CodProducto": 12, "Descripcion": 58, "Lineas": 9, "Ventas": 14, "PrimeraVenta": 13, "FamiliaPropuesta": 18}, fila0=3,
          col_formulas={
              "Descripcion": ("=INDEX(Ventas[Descripcion],MATCH([@CodProducto],Ventas[CodProducto],0))", h["Descripcion"].tolist()),
              "Lineas": ("=COUNTIFS(Ventas[CodProducto],[@CodProducto])", h["Lineas"].tolist()),
              "Ventas": ("=SUMIFS(Ventas[ImporteNeto],Ventas[CodProducto],[@CodProducto])", h["Ventas"].round(2).tolist()),
              "PrimeraVenta": ("=MINIFS(Ventas[Fecha],Ventas[CodProducto],[@CodProducto])",
                               [(d - pd.Timestamp("1899-12-30")).days for d in h["Primera"]]),
          })
    hu.write(3 + len(h) + 2, 0, "Total", F["b"])
    Hoja(hu).f(3 + len(h) + 2, 3, "=SUM(Huerfanos[Ventas])", round(float(h["Ventas"].sum()), 2), F["eur"])
    Hoja(hu).f(3 + len(h) + 3, 3, "=SUM(Huerfanos[Ventas])/SUM(Ventas[ImporteNeto])", float(h["Ventas"].sum() / v["ImporteNeto"].sum()), F["pct"])
    hu.write(3 + len(h) + 3, 0, "Peso sobre la venta total", F["b"])

    # ------------------------------------------------------------------ Informes
    tot = float(v["ImporteNeto"].sum())
    marg = float(v["Margen"].sum())
    comp = v[v["CuentaComercial"] == "Sí"]
    s26_6 = float(v[v["Familia"].isin(FAMILIAS6)]["ImporteNeto"].sum())
    s25_10 = float(v25[v25["NumMes"] <= 10]["Importe"].sum())
    ob10 = obj[obj["NumMes"] <= 10]
    cumpl_tot = float(comp["ImporteNeto"].sum() / ob10["Objetivo"].sum())
    activos = int(sum(1 for x in vals_cli if x != 0))
    mes_max = v["Fecha"].max()
    titulo_val = f"Ventas acumuladas a {MESES_NOM[mes_max.month - 1]} de {mes_max.year}"

    filas_info = {}

    def informe(nombre, direccion):
        w = ws[nombre]
        H = Hoja(w)
        w.hide_gridlines(2)
        w.set_column("A:A", 26)
        w.set_column("B:B", 38)
        w.set_column("C:K", 14)
        w.set_column("L:L", 3)
        w.set_column("M:V", 11)
        H.f(0, 0, '="' + ("Dirección · " if direccion else "Reunión de comerciales · ") + 'Ventas acumuladas a "&TEXT(MAX(Ventas[Fecha]),"mmmm")&" de "&YEAR(MAX(Ventas[Fecha]))',
            ("Dirección · " if direccion else "Reunión de comerciales · ") + titulo_val, F["t"])
        H.f(1, 0, '="Controles: "&IF(Controles!$C$3,"OK","REVISAR")', "Controles: OK", F["b"])
        w.write(2, 0, "Electro Cierzo Suministros · venta neta sin IVA (devoluciones restadas) · fuentes: ERP ene-oct 2026, objetivos 2026 y resumen 2025" +
                ("" if direccion else " · versión sin márgenes"), F["st"])
        # KPI
        kpis = [("Ventas netas", "=SUM(Ventas[ImporteNeto])", tot, F["kpi_e"])]
        if direccion:
            kpis += [("Margen bruto", "=SUM(Ventas[Margen])", marg, F["kpi_e"]),
                     ("Margen bruto %", None, marg / tot, F["kpi_p"])]
        kpis += [("Var. frente a 2025 (6 familias)", None, s26_6 / s25_10 - 1, F["kpi_p"]),
                 ("Cumplimiento del objetivo", None, cumpl_tot, F["kpi_p"]),
                 ("Clientes con venta", "=COUNTIF(Clientes[Ventas2026],\"<>0\")", activos, F["kpi_n"])]
        for j, (t, fo, val, fm) in enumerate(kpis):
            w.write(4, j, t, F["kpi_t"])
            if t == "Margen bruto %":
                fo = f"=IFERROR({rc(5, 1)}/{rc(5, 0)},0)"
            if t.startswith("Var."):
                fo = ('=IFERROR(SUMIFS(Comparacion[Importe],Comparacion[Tipo],"Real",Comparacion[Año],YEAR(FechaCorte),Comparacion[Comparable],"Sí",Comparacion[NumMes],"<="&MONTH(FechaCorte))'
                      '/SUMIFS(Comparacion[Importe],Comparacion[Año],AnioBase,Comparacion[NumMes],"<="&MONTH(FechaCorte))-1,"")')
            if t.startswith("Cumplimiento"):
                fo = ('=IFERROR(SUMIFS(Ventas[ImporteNeto],Ventas[CuentaComercial],"Sí",Ventas[Fecha],"<="&FechaCorte)'
                      '/SUMIFS(Objetivos[Objetivo],Objetivos[Mes],"<="&FechaCorte),"")')
            H.f(5, j, fo, val, fm)
        w.set_row(4, 30)

        # --- Por delegación
        r0 = 8
        w.write(r0 - 1, 0, "Por delegación (enero-octubre)", F["h"])
        cab = ["Delegación", "Ventas netas", "% del total"] + (["Margen", "Margen %"] if direccion else []) + \
              ["6 familias 2026", "6 familias 2025", "Var. %"]
        w.write_row(r0, 0, cab, F["cab"])
        for i, d in enumerate(DELEGS):
            r = r0 + 1 + i
            a = rc(r, 0)
            vd = v[v["Delegacion"] == d]
            w.write_string(r, 0, d)
            H.f(r, 1, f"=SUMIFS(Ventas[ImporteNeto],Ventas[Delegacion],{a})", vd["ImporteNeto"].sum(), F["eur0"])
            H.f(r, 2, f"=IFERROR({rc(r, 1)}/SUM(Ventas[ImporteNeto]),0)", vd["ImporteNeto"].sum() / tot, F["pct"])
            j = 3
            if direccion:
                H.f(r, 3, f"=SUMIFS(Ventas[Margen],Ventas[Delegacion],{a})", vd["Margen"].sum(), F["eur0"])
                H.f(r, 4, f"=IFERROR({rc(r, 3)}/{rc(r, 1)},0)", vd["Margen"].sum() / vd["ImporteNeto"].sum(), F["pct"])
                j = 5
            v6 = vd[vd["Familia"].isin(FAMILIAS6)]["ImporteNeto"].sum()
            v5 = v25[(v25["Delegacion"] == d) & (v25["NumMes"] <= 10)]["Importe"].sum()
            H.f(r, j, f'=SUMIFS(Comparacion[Importe],Comparacion[Tipo],"Real",Comparacion[Año],YEAR(FechaCorte),Comparacion[Comparable],"Sí",Comparacion[Delegacion],{a},Comparacion[NumMes],"<="&MONTH(FechaCorte))', v6, F["eur0"])
            H.f(r, j + 1, f'=SUMIFS(Comparacion[Importe],Comparacion[Año],AnioBase,Comparacion[Delegacion],{a},Comparacion[NumMes],"<="&MONTH(FechaCorte))', v5, F["eur0"])
            H.f(r, j + 2, f'=IFERROR({rc(r, j)}/{rc(r, j + 1)}-1,"")', v6 / v5 - 1, F["pct"])
        rt = r0 + 4
        w.write_string(rt, 0, "Total", F["bt"])
        ncol = len(cab)
        for jj in range(1, ncol):
            nom = cab[jj]
            if nom in ("% del total",):
                H.f(rt, jj, f"=SUM({rc(r0 + 1, jj)}:{rc(r0 + 3, jj)})", 1.0, F["pctb"])
            elif nom == "Margen %":
                H.f(rt, jj, f"=IFERROR({rc(rt, 3)}/{rc(rt, 1)},0)", marg / tot, F["pctb"])
            elif nom == "Var. %":
                H.f(rt, jj, f'=IFERROR({rc(rt, jj - 2)}/{rc(rt, jj - 1)}-1,"")', s26_6 / s25_10 - 1, F["pctb"])
            else:
                vals = {"Ventas netas": tot, "Margen": marg, "6 familias 2026": s26_6, "6 familias 2025": s25_10}
                H.f(rt, jj, f"=SUM({rc(r0 + 1, jj)}:{rc(r0 + 3, jj)})", vals[nom], F["eur0b"])
        filas_info.setdefault(nombre, {})["deleg_total"] = (rt, 1)
        w.write(rt + 1, 0, "2025 solo tiene detalle por delegación y familia, y solo de las 6 familias de producto (sin portes, ajustes ni «Sin clasificar»).", F["st"])

        # --- Evolución mensual
        r1 = rt + 4
        w.write(r1 - 1, 0, "Evolución mensual · 6 familias de producto", F["h"])
        w.write_row(r1, 0, ["Mes", "2026", "2025", "Var. %"], F["cab"])
        m26 = v[v["Familia"].isin(FAMILIAS6)].groupby(v["Mes"].dt.month)["ImporteNeto"].sum()
        m25 = v25.groupby("NumMes")["Importe"].sum()
        for i in range(10):
            r = r1 + 1 + i
            w.write_string(r, 0, MESES_NOM[i])
            H.f(r, 1, f'=SUMIFS(Comparacion[Importe],Comparacion[Tipo],"Real",Comparacion[Año],YEAR(FechaCorte),Comparacion[Comparable],"Sí",Comparacion[NumMes],{i + 1})', m26[i + 1], F["eur0"])
            H.f(r, 2, f"=SUMIFS(Comparacion[Importe],Comparacion[Año],AnioBase,Comparacion[NumMes],{i + 1})", m25[i + 1], F["eur0"])
            H.f(r, 3, f'=IFERROR({rc(r, 1)}/{rc(r, 2)}-1,"")', m26[i + 1] / m25[i + 1] - 1, F["pct"])
        ch = wb.add_chart({"type": "column"})
        for k, (col, color) in enumerate([(1, "#1F4E79"), (2, "#A6A6A6")]):
            ch.add_series({"name": [nombre, r1, col], "categories": [nombre, r1 + 1, 0, r1 + 10, 0],
                           "values": [nombre, r1 + 1, col, r1 + 10, col], "fill": {"color": color}, "gap": 80})
        ln = wb.add_chart({"type": "line"})
        ln.add_series({"name": [nombre, r1, 3], "categories": [nombre, r1 + 1, 0, r1 + 10, 0],
                       "values": [nombre, r1 + 1, 3, r1 + 10, 3], "y2_axis": True,
                       "line": {"color": "#C55A11", "width": 2.25}, "marker": {"type": "circle", "size": 5},
                       "data_labels": {"value": True, "num_format": "0%", "position": "above", "font": {"size": 8}}})
        ch.combine(ln)
        ch.set_title({"name": "Ventas de producto 2026 frente a 2025 y variación %", "name_font": {"size": 11}})
        ch.set_y_axis({"num_format": '#,##0 "€"', "major_gridlines": {"visible": True, "line": {"color": "#E7E6E6"}}})
        ln.set_y2_axis({"num_format": "0%", "min": -0.2, "max": 0.3})
        ch.set_legend({"position": "bottom"})
        ch.set_size({"width": 620, "height": 300})
        w.insert_chart(r1, 5, ch, {"description": "Columnas: venta mensual de 2026 y de 2025 en las 6 familias de producto. Línea (eje derecho): variación porcentual."})

        # --- Por familia
        r2 = r1 + 18
        w.write(r2 - 1, 0, "Por familia", F["h"])
        cabf = ["Familia", "Ventas netas", "% del total"] + (["Margen", "Margen %"] if direccion else []) + ["2025 (ene-oct)", "Var. %"]
        w.write_row(r2, 0, cabf, F["cab"])
        for i, fam in enumerate(FAMILIAS_INF):
            r = r2 + 1 + i
            a = rc(r, 0)
            vf = v[v["Familia"] == fam]
            w.write_string(r, 0, fam)
            H.f(r, 1, f"=SUMIFS(Ventas[ImporteNeto],Ventas[Familia],{a})", vf["ImporteNeto"].sum(), F["eur0"])
            H.f(r, 2, f"=IFERROR({rc(r, 1)}/SUM(Ventas[ImporteNeto]),0)", vf["ImporteNeto"].sum() / tot, F["pct"])
            j = 3
            if direccion:
                H.f(r, 3, f"=SUMIFS(Ventas[Margen],Ventas[Familia],{a})", vf["Margen"].sum(), F["eur0"])
                mp = vf["Margen"].sum() / vf["ImporteNeto"].sum() if vf["ImporteNeto"].sum() else 0
                H.f(r, 4, f'=IF({a}="Ajustes","—",IFERROR({rc(r, 3)}/{rc(r, 1)},""))', "—" if fam == "Ajustes" else mp, F["pct"])
                j = 5
            if fam in FAMILIAS6:
                f25 = v25[(v25["Familia"] == fam) & (v25["NumMes"] <= 10)]["Importe"].sum()
                H.f(r, j, f'=SUMIFS(Comparacion[Importe],Comparacion[Año],AnioBase,Comparacion[Familia],{a},Comparacion[NumMes],"<="&MONTH(FechaCorte))', f25, F["eur0"])
                H.f(r, j + 1, f'=IFERROR({rc(r, 1)}/{rc(r, j)}-1,"")', vf["ImporteNeto"].sum() / f25 - 1, F["pct"])
            else:
                w.write_string(r, j, "sin dato")
                w.write_string(r, j + 1, "—")
        rtf = r2 + 1 + len(FAMILIAS_INF)
        w.write_string(rtf, 0, "Total", F["bt"])
        H.f(rtf, 1, f"=SUM({rc(r2 + 1, 1)}:{rc(rtf - 1, 1)})", tot, F["eur0b"])
        H.f(rtf, 2, f"=SUM({rc(r2 + 1, 2)}:{rc(rtf - 1, 2)})", 1.0, F["pctb"])
        if direccion:
            H.f(rtf, 3, f"=SUM({rc(r2 + 1, 3)}:{rc(rtf - 1, 3)})", marg, F["eur0b"])
            H.f(rtf, 4, f"=IFERROR({rc(rtf, 3)}/{rc(rtf, 1)},0)", marg / tot, F["pctb"])
        filas_info[nombre]["fam_total"] = (rtf, 1)
        w.write(rtf + 1, 0, "Margen % = Σ margen / Σ ventas de cada fila (no la media de los porcentajes). «Ajustes» es el descuento por pronto pago: resta en la empresa, no en los comerciales.", F["st"])

        # --- Por comercial
        r3 = rtf + 4
        w.write(r3 - 1, 0, "Por comercial (sin «Ajustes»)", F["h"])
        cabc = ["Comercial", "Nombre", "Delegación", "Ventas", "Objetivo", "Cumplimiento"] + (["Margen", "Margen %", "Aviso"] if direccion else []) + ["Tendencia"]
        w.write_row(r3, 0, cabc, F["cab"])
        w.write_row(r3, 12, [m.capitalize()[:3] for m in MESES_NOM[:10]], F["cab"])
        w.write(r3 - 1, 12, "Ventas por mes (datos de los minigráficos)", F["st"])
        cods = list(comerciales["CodComercial"])
        mens = comp.groupby(["CodComercial", comp["Mes"].dt.month])["ImporteNeto"].sum()
        for i, cod in enumerate(cods):
            r = r3 + 1 + i
            a = rc(r, 0)
            w.write_string(r, 0, cod)
            nombre_c = comerciales.set_index("CodComercial").loc[cod, "Nombre"]
            deleg_c = comerciales.set_index("CodComercial").loc[cod, "Delegacion"]
            H.f(r, 1, f'=IFERROR(INDEX(Comerciales[Nombre],MATCH({a},Comerciales[CodComercial],0)),"¿?")', nombre_c)
            H.f(r, 2, f'=IFERROR(INDEX(Comerciales[Delegacion],MATCH({a},Comerciales[CodComercial],0)),"¿?")', deleg_c)
            vc = comp[comp["CodComercial"] == cod]
            oc = ob10[ob10["CodComercial"] == cod]["Objetivo"].sum()
            H.f(r, 3, f'=SUMIFS(Ventas[ImporteNeto],Ventas[CodComercial],{a},Ventas[CuentaComercial],"Sí")', vc["ImporteNeto"].sum(), F["eur0"])
            H.f(r, 4, f'=SUMIFS(Objetivos[Objetivo],Objetivos[CodComercial],{a},Objetivos[Mes],"<="&FechaCorte)', oc, F["eur0"])
            H.f(r, 5, f'=IFERROR({rc(r, 3)}/{rc(r, 4)},"")', vc["ImporteNeto"].sum() / oc, F["pct"])
            j = 6
            if direccion:
                H.f(r, 6, f'=SUMIFS(Ventas[Margen],Ventas[CodComercial],{a},Ventas[CuentaComercial],"Sí")', vc["Margen"].sum(), F["eur0"])
                mp = vc["Margen"].sum() / vc["ImporteNeto"].sum()
                H.f(r, 7, f"=IFERROR({rc(r, 6)}/{rc(r, 3)},0)", mp, F["pct"])
                H.f(r, 8, f'=IF({rc(r, 7)}<UmbralMargen,"Margen bajo","")', "Margen bajo" if mp < 0.22 else "")
                j = 9
            for k in range(10):
                H.f(r, 12 + k, f'=SUMIFS(Ventas[ImporteNeto],Ventas[CodComercial],{a},Ventas[CuentaComercial],"Sí",Ventas[Mes],DATE(YEAR(FechaCorte),{k + 1},1))',
                    float(mens.get((cod, k + 1), 0.0)), F["eur0"])
            w.add_sparkline(r, j, {"range": f"'{nombre}'!{rc(r, 12)}:{rc(r, 21)}", "type": "line", "markers": True,
                                   "high_point": True, "low_point": True})
        rtc = r3 + 1 + len(cods)
        w.write_string(rtc, 0, "Total", F["bt"])
        H.f(rtc, 3, f"=SUM({rc(r3 + 1, 3)}:{rc(rtc - 1, 3)})", comp["ImporteNeto"].sum(), F["eur0b"])
        H.f(rtc, 4, f"=SUM({rc(r3 + 1, 4)}:{rc(rtc - 1, 4)})", ob10["Objetivo"].sum(), F["eur0b"])
        H.f(rtc, 5, f'=IFERROR({rc(rtc, 3)}/{rc(rtc, 4)},"")', cumpl_tot, F["pctb"])
        if direccion:
            H.f(rtc, 6, f"=SUM({rc(r3 + 1, 6)}:{rc(rtc - 1, 6)})", comp["Margen"].sum(), F["eur0b"])
            H.f(rtc, 7, f"=IFERROR({rc(rtc, 6)}/{rc(rtc, 3)},0)", comp["Margen"].sum() / comp["ImporteNeto"].sum(), F["pctb"])
            w.conditional_format(r3 + 1, 7, rtc - 1, 7, {"type": "cell", "criteria": "<", "value": "UmbralMargen", "format": F["mal"]})
        filas_info[nombre]["com_total"] = (rtc, 3)
        w.conditional_format(r3 + 1, 5, rtc - 1, 5, {"type": "data_bar", "bar_color": "#5B9BD5", "bar_solid": True})
        w.write(rtc + 1, 0, "V05 causó baja el 15/05/2026: desde el 16/05 sus clientes los lleva V06 (objetivos revisados desde junio). No hay datos de 2025 por comercial.", F["st"])
        # gráfico de cumplimiento con línea del 100 %
        w.write(r3, 22, "Meta", F["cab"])
        for i in range(len(cods)):
            w.write_number(r3 + 1 + i, 22, 1, F["pct"])
        cc = wb.add_chart({"type": "column"})
        cc.add_series({"name": "Cumplimiento", "categories": [nombre, r3 + 1, 0, rtc - 1, 0],
                       "values": [nombre, r3 + 1, 5, rtc - 1, 5], "fill": {"color": "#5B9BD5"},
                       "data_labels": {"value": True, "num_format": "0%", "font": {"size": 8}}})
        l100 = wb.add_chart({"type": "line"})
        l100.add_series({"name": "Objetivo (100 %)", "categories": [nombre, r3 + 1, 0, rtc - 1, 0],
                         "values": [nombre, r3 + 1, 22, rtc - 1, 22], "line": {"color": "#C00000", "dash_type": "dash", "width": 1.5}})
        cc.combine(l100)
        cc.set_title({"name": "Cumplimiento del objetivo por comercial (ene-oct)", "name_font": {"size": 11}})
        cc.set_y_axis({"num_format": "0%", "min": 0})
        cc.set_legend({"position": "bottom"})
        cc.set_size({"width": 620, "height": 280})
        w.insert_chart(rtc + 3, 0, cc, {"description": "Columnas: cumplimiento del objetivo de cada comercial. Línea discontinua: 100 % del objetivo."})

        # --- Top 20 clientes
        r4 = rtc + 20
        w.write(r4 - 1, 0, "Top 20 clientes y Pareto (% acumulado)", F["h"])
        w.write_row(r4, 0, ["Puesto", "Nombre", "Cliente", "Ventas", "% del total", "% acumulado"], F["cab"])
        top = v.groupby("CodCliente")["ImporteNeto"].sum().sort_values(ascending=False).head(20)
        assert top.round(2).is_unique
        nombres_cli = clientes.set_index("CodCliente")["Nombre"]
        acum = 0.0
        for i, (cod, val) in enumerate(top.items()):
            r = r4 + 1 + i
            acum += val
            w.write_number(r, 0, i + 1)
            H.f(r, 3, f"=LARGE(Clientes[Ventas2026],{rc(r, 0)})", round(val, 2), F["eur0"])
            H.f(r, 2, f"=INDEX(Clientes[CodCliente],MATCH({rc(r, 3)},Clientes[Ventas2026],0))", cod)
            H.f(r, 1, f"=INDEX(Clientes[Nombre],MATCH({rc(r, 2)},Clientes[CodCliente],0))", nombres_cli[cod])
            H.f(r, 4, f"={rc(r, 3)}/SUM(Ventas[ImporteNeto])", val / tot, F["pct"])
            H.f(r, 5, f"=SUM({rc(r4 + 1, 3)}:{rc(r, 3)})/SUM(Ventas[ImporteNeto])", acum / tot, F["pct"])
        w.write(r4 + 22, 0, "En el libro real esto es la tabla dinámica (d): filtro «Diez mejores» = 20 y «Mostrar valores como > % del total general» y «% del total acumulado en Cliente».", F["st"])
        w.set_landscape()
        w.set_paper(9)
        w.fit_to_pages(1, 0)
        w.repeat_rows(0, 2)
        w.print_area(0, 0, r4 + 22, 10)
        w.set_footer("&L&8Electro Cierzo · informe de ventas&R&8Página &P de &N")
        return w

    informe("Informe_Direccion", True)
    informe("Informe_Reunion", False)
    ws["Informe_Direccion"].activate()

    # ------------------------------------------------------------------ Controles
    c = ws["Controles"]
    H = Hoja(c)
    c.hide_gridlines(2)
    c.set_column("A:A", 5)
    c.set_column("B:B", 62)
    c.set_column("C:G", 15)
    c.set_column("H:I", 15)
    c.write("A1", "Controles", F["t"])
    c.write("B3", "CONTROL MAESTRO (todos los controles en VERDADERO)", F["b"])
    c.write_row("A5", ["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Estado"], F["cab"])
    n_lin = len(v)
    cont = [
        ("Nº de líneas cargadas = Σ NumLineas de Control_ERP", "=SUM(ControlERP[NumLineas])", n_lin, "=ROWS(Ventas[ImporteNeto])", n_lin, 0, F["int"]),
        ("Σ ImporteNeto cargado = Σ ImporteNeto de Control_ERP", "=SUM(ControlERP[ImporteNeto])", tot, "=SUM(Ventas[ImporteNeto])", tot, "Tolerancia", F["eur"]),
        ("Meses que cuadran con el ERP (líneas e importe), ver tabla de abajo", "=ROWS(ControlERP[Archivo])", 10, None, 10, 0, F["int"]),
        ("Σ por delegación (Informe_Direccion) = total", "=SUM(Ventas[ImporteNeto])", tot, "=Informe_Direccion!" + rc(*filas_info["Informe_Direccion"]["deleg_total"]), tot, "Tolerancia", F["eur"]),
        ("Σ por familia, con Sin clasificar, Portes y Ajustes = total", "=SUM(Ventas[ImporteNeto])", tot, "=Informe_Direccion!" + rc(*filas_info["Informe_Direccion"]["fam_total"]), tot, "Tolerancia", F["eur"]),
        ("Σ por comercial (sin Ajustes) + Ajustes = total", "=SUM(Ventas[ImporteNeto])", tot,
         "=Informe_Direccion!" + rc(*filas_info["Informe_Direccion"]["com_total"]) + '+SUMIFS(Ventas[ImporteNeto],Ventas[Familia],"Ajustes")', tot, "Tolerancia", F["eur"]),
        ("Σ de la tabla Comparacion (Real 2026) = total", "=SUM(Ventas[ImporteNeto])", tot, '=SUMIFS(Comparacion[Importe],Comparacion[Tipo],"Real",Comparacion[Año],2026)', tot, "Tolerancia", F["eur"]),
        ("Líneas con delegación sin mapa (vacía)", "0", 0, "=COUNTBLANK(Ventas[Delegacion])", 0, 0, F["int"]),
        ("Líneas con comercial que no está en Comerciales", "0", 0, "=SUMPRODUCT(--(COUNTIF(Comerciales[CodComercial],Ventas[CodComercial])=0))", 0, 0, F["int"]),
        ("Líneas «Sin clasificar» = líneas de la lista de huérfanos", '=COUNTIF(Ventas[Familia],"Sin clasificar")', int((v["Familia"] == "Sin clasificar").sum()),
         "=SUM(Huerfanos[Lineas])", int((v["Familia"] == "Sin clasificar").sum()), 0, F["int"]),
        ("Líneas sin coste", "0", 0, "=COUNTBLANK(Ventas[Coste])", 0, 0, F["int"]),
        ("Margen = Σ ImporteNeto − Σ Coste", "=SUM(Ventas[ImporteNeto])-SUM(Ventas[Coste])", float(v["ImporteNeto"].sum() - v["Coste"].round(4).sum()),
         "=SUM(Ventas[Margen])", float(v["Margen"].round(4).sum()), "Tolerancia", F["eur"]),
        ("Fechas fuera del periodo (antes del 1 de enero o después de FechaCorte)", "0", 0,
         '=COUNTIFS(Ventas[Fecha],">"&FechaCorte)+COUNTIFS(Ventas[Fecha],"<"&DATE(YEAR(FechaCorte),1,1))', 0, 0, F["int"]),
    ]
    fila_mensual0 = 5 + len(cont) + 4
    for i, (desc, fe, ve, fo, vo, tol, fm) in enumerate(cont):
        r = 5 + i
        c.write_number(r, 0, i + 1)
        c.write_string(r, 1, desc, F["wrap"])
        H.f(r, 2, "=" + fe.lstrip("=") if fe != "0" else "=0", ve, fm)
        if fo is None:
            fo = f"=COUNTIF({rc(fila_mensual0 + 1, 8)}:{rc(fila_mensual0 + 10, 8)},TRUE)"
        H.f(r, 3, fo, vo, fm)
        H.f(r, 4, f"={rc(r, 3)}-{rc(r, 2)}", float(vo) - float(ve), fm)
        if tol == "Tolerancia":
            H.f(r, 5, "=Tolerancia", 0.01, F["eur"])
        else:
            c.write_number(r, 5, tol, F["int"])
        tol_v = 0.01 if tol == "Tolerancia" else tol
        H.f(r, 6, f"=ABS({rc(r, 4)})<={rc(r, 5)}", bool(abs(float(vo) - float(ve)) <= tol_v + 1e-9), F["estado"])
    ult = 5 + len(cont) - 1
    # tabla mensual
    c.write(fila_mensual0 - 1, 0, "Cuadre de cada mes con el ERP (Control_ERP)", F["h"])
    c.write_row(fila_mensual0, 0, ["Mes", "Archivo", "Líneas ERP", "Líneas cargadas", "Dif. líneas", "Importe ERP", "Importe cargado", "Dif. importe", "¿Cuadra?"], F["cab"])
    por_arch = v.groupby("Archivo").agg(n=("ImporteNeto", "size"), s=("ImporteNeto", "sum"))
    for i, rr in enumerate(ctrl.itertuples(index=False)):
        r = fila_mensual0 + 1 + i
        c.write_number(r, 0, i + 1)
        c.write_string(r, 1, rr.Archivo)
        b = rc(r, 1)
        n_c, s_c = por_arch.loc[rr.Archivo]
        H.f(r, 2, f"=SUMIFS(ControlERP[NumLineas],ControlERP[Archivo],{b})", int(rr.NumLineas), F["int"])
        H.f(r, 3, f"=COUNTIFS(Ventas[Archivo],{b})", int(n_c), F["int"])
        H.f(r, 4, f"={rc(r, 3)}-{rc(r, 2)}", int(n_c) - int(rr.NumLineas), F["int"])
        H.f(r, 5, f"=SUMIFS(ControlERP[ImporteNeto],ControlERP[Archivo],{b})", float(rr.ImporteNeto), F["eur"])
        H.f(r, 6, f"=SUMIFS(Ventas[ImporteNeto],Ventas[Archivo],{b})", round(float(s_c), 2), F["eur"])
        H.f(r, 7, f"={rc(r, 6)}-{rc(r, 5)}", round(float(s_c) - float(rr.ImporteNeto), 2), F["eur"])
        H.f(r, 8, f"=AND({rc(r, 4)}=0,ABS({rc(r, 7)})<=Tolerancia)", True, F["estado"])
    rf = fila_mensual0 + 11
    c.write_string(rf, 1, "Líneas de archivos que no están en Control_ERP (copias, meses de más)", F["wrap"])
    H.f(rf, 3, f"=ROWS(Ventas[Archivo])-SUM({rc(fila_mensual0 + 1, 3)}:{rc(fila_mensual0 + 10, 3)})", 0, F["int"])
    H.f(rf, 8, f"={rc(rf, 3)}=0", True, F["estado"])
    H.f(2, 2, f"=AND({rc(5, 6)}:{rc(ult, 6)},{rc(fila_mensual0 + 1, 8)}:{rc(fila_mensual0 + 10, 8)},{rc(rf, 8)})", True, F["maestro"])
    for rng_ in [f"{rc(5, 6)}:{rc(ult, 6)}", f"{rc(fila_mensual0 + 1, 8)}:{rc(rf, 8)}", "C3"]:
        c.conditional_format(rng_, {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
        c.conditional_format(rng_, {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
    c.write(rf + 2, 1, "Prueba de mantenimiento: al añadir noviembre, las cifras de enero a octubre NO deben cambiar (compara esta tabla antes y después).", F["st"])
    c.write(rf + 3, 1, "Información: % de la venta sin clasificar (debe bajar a 0 cuando Compras dé de alta los códigos)", F["wrap"])
    H.f(rf + 3, 3, '=SUMIFS(Ventas[ImporteNeto],Ventas[Familia],"Sin clasificar")/SUM(Ventas[ImporteNeto])',
        float(v.loc[v["Familia"] == "Sin clasificar", "ImporteNeto"].sum() / tot), F["pct"])

    # ------------------------------------------------------------------ Calidad de datos
    q = ws["Calidad_datos"]
    q.set_column("A:A", 8)
    q.set_column("B:B", 40)
    q.set_column("C:C", 26)
    q.set_column("D:D", 11)
    q.set_column("E:E", 44)
    q.set_column("F:F", 52)
    q.set_column("G:G", 16)
    q.write("A1", "Calidad de datos: problema, filas afectadas, decisión e impacto", F["t"])
    q.write_row("A3", ["Código", "Problema", "Dónde", "Filas", "Cómo se detectó", "Decisión", "Impacto (€)"], F["cab"])
    A = analisis(v, v25, obj, com_g, comerciales, clientes)
    jul = v[v["Mes"] >= "2026-07-01"]
    filas_q = [
        ("Q01/Q22", "Copia exacta de septiembre en la carpeta ERP", "ventas_2026_09 - copia.csv", int((v["Archivo"] == "ventas_2026_09.csv").sum()),
         "Control por archivo: un archivo que no está en Control_ERP; septiembre saldría con el doble de líneas", "Sacar la copia de la carpeta y filtrar en la consulta los nombres «ventas_AAAA_MM.csv»", A["septiembre"]),
        ("Q19", "Marzo exportado con «,» y punto decimal (fechas M/D/AAAA)", "ventas_2026_03.csv", int((v["Archivo"] == "ventas_2026_03.csv").sum()),
         "El archivo sale en una sola columna; el cuadre de marzo da 0 €", "Consulta aparte con delimitador «,» y Cambiar tipo > Usar configuración regional > Inglés (Estados Unidos); Anexar. Pedir al ERP que lo reexporte", A["marzo"]),
        ("Q11", "Mayo con una línea de título antes de los encabezados", "ventas_2026_05.csv", int((v["Archivo"] == "ventas_2026_05.csv").sum()),
         "Encabezados raros («Column1»…) y mayo vacío en el cuadre", "Consulta aparte: Quitar filas superiores (1) y Usar la primera fila como encabezado; Anexar", A["mayo"]),
        ("Q18", "Columna nueva CosteUnitario desde julio", "ventas_2026_07 a _10", int(len(jul)),
         "Perfilado: 13 columnas desde julio; con el archivo de ejemplo de enero la columna se pierde", "Archivo de ejemplo = octubre (o quitar «Columns=12»); la columna queda vacía (null) antes de julio", A["efecto_coste_julio"]),
        ("Q13", "Agosto con CodProducto sin ceros a la izquierda", "ventas_2026_08.csv", int((v["Archivo"] == "ventas_2026_08.csv").sum()),
         "Todo agosto saldría «Sin clasificar»; códigos de 5 cifras", "CodProducto como texto y Text.PadStart(Text.From([CodProducto]), 6, \"0\")", A["agosto_sin_ceros"]),
        ("Q08/Q04", "Delegación escrita de 6 maneras y con espacios al final", "todos los meses", A["lineas_delegacion_mal_escrita"],
         "UNICOS / Quitar duplicados de la columna: Zaragoza, ZARAGOZA, Zgz, Pamplona/Iruña, Lleida, Lérida", "Recortar, Mayúsculas y Combinar con MapaDelegaciones", None),
        ("Q14", "Devoluciones con Cantidad negativa", "todos los meses", A["n_devoluciones"], "Filtro Cantidad < 0; facturas R26-", "Se dejan: restan en ventas y en margen", A["devoluciones"]),
        ("Q16", "7 códigos de producto que no están en el maestro", "julio a octubre", int((v["Familia"] == "Sin clasificar").sum()),
         "Combinar consultas con Anti izquierda", "Familia «Sin clasificar» y lista (hoja Huerfanos) para que Compras los dé de alta", float(v.loc[v["Familia"] == "Sin clasificar", "ImporteNeto"].sum())),
        ("—", "Descuento por pronto pago como línea de venta", "todos los meses", int((v["Familia"] == "Ajustes").sum()),
         "CodProducto 099001, importe negativo y sin NumAlbaran", "Familia «Ajustes»: cuenta en la empresa, no en los comerciales", A["ajustes"]),
        ("Q12", "Objetivos y 2025 con los meses en columnas; «Lérida» en 2025", "Objetivos_2026, Ventas_2025_resumen", 12 + 18,
         "Formato ancho", "Anular dinamización de columnas + mapa de delegaciones + tabla Meses", None),
        ("—", "Comercial V05 de baja el 15/05/2026", "Comerciales, Objetivos_2026", 1, "FechaBaja; objetivos vacíos de junio a diciembre",
         "Se mantiene en el informe hasta mayo; sus clientes pasan a V06 desde el 16/05", None),
    ]
    for i, fila in enumerate(filas_q):
        r = 3 + i
        for j, val in enumerate(fila):
            if val is None:
                continue
            if j == 6:
                q.write_number(r, j, round(float(val), 2), F["eur"])
            elif j == 3:
                q.write_number(r, j, val, F["int"])
            else:
                q.write_string(r, j, val, F["wrap"])
    q.write(4 + len(filas_q), 0, "Impacto: venta del archivo afectado (o, en Q18, cuánto sube el coste de julio a octubre al usar el coste real de la línea en vez del estándar).", F["st"])
    q.write(5 + len(filas_q), 0, "Perfil de los archivos leídos: " + "; ".join(f"{p_['archivo']} ({p_['separador']}{', 1 línea de título' if p_['salto'] else ''})" for p_ in perfil), F["st"])

    # ------------------------------------------------------------------ Léame
    l = ws["Léame"]
    l.hide_gridlines(2)
    l.set_column("A:A", 150)
    lineas = leame(A, nov_info, tot)
    for i, (tipo, texto) in enumerate(lineas):
        fm = {"t": F["t"], "h": F["h"], "s": F["st"], "m": F["mono"]}.get(tipo)
        if fm:
            l.write_string(i, 0, texto, fm)
        else:
            l.write_string(i, 0, texto)
    # ------------------------------------------------------------------ Cómo se hizo
    k = ws["Cómo se hizo"]
    k.hide_gridlines(2)
    k.set_column("A:A", 150)
    for i, (tipo, texto) in enumerate(como_se_hizo()):
        fm = {"t": F["t"], "h": F["h"], "s": F["st"], "m": F["mono"]}.get(tipo)
        if fm:
            k.write_string(i, 0, texto, fm)
        else:
            k.write_string(i, 0, texto)
    wb.close()


def eur(x, dec=2):
    s = f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s + " €"


def leame(A, nov, tot):
    return [
        ("t", "Léame · Informe mensual de ventas (P5)"),
        ("s", "Pedido por Javier Ortega (director comercial) el 16/11/2026 · Hecho por: administración y análisis · Versión v01 (entrega de octubre)"),
        ("", ""),
        ("h", "Objetivo"),
        ("", "Informe de ventas de enero a octubre de 2026 por delegación, comercial, familia y cliente, frente a 2025 y al objetivo, con margen bruto."),
        ("", "Dos salidas: Informe_Reunion (para el equipo comercial, sin márgenes) e Informe_Direccion (completa). Se actualiza con Datos > Actualizar todo."),
        ("", ""),
        ("h", "Fuentes"),
        ("", "Carpeta Ventas\\ERP: un CSV por mes que exporta el ERP (UTF-8, «;», coma decimal). Ruta en Parametros!RutaERP."),
        ("", "Ventas\\Maestros\\p5-datos.xlsx: Productos, Comerciales, Clientes, Objetivos_2026, Ventas_2025_resumen y Control_ERP (totales del ERP al cerrar cada mes)."),
        ("", ""),
        ("h", "Definiciones y supuestos (pactados con Javier)"),
        ("", "Venta neta = ImporteNeto sin IVA; las devoluciones (Cantidad negativa) restan. Fecha del informe = fecha del albarán."),
        ("", "Portes → familia «Portes y servicios». DTO. PRONTO PAGO → familia «Ajustes»: cuenta en el total de la empresa, NO en las ventas de los comerciales."),
        ("", "Coste: desde julio, CosteUnitario de la línea; antes, CosteEstandar del maestro. Margen = ImporteNeto − Coste. Margen % = Σ margen / Σ ventas."),
        ("", "Comparación con 2025: solo por delegación y familia, y solo las 6 familias de producto (es lo único que hay). Por comercial se compara con el objetivo."),
        ("", "Códigos que no están en Productos → familia «Sin clasificar» y lista en la hoja Huerfanos para Compras."),
        ("", "Colores: amarillo claro = celda de entrada que se puede cambiar (Parametros). Verde/rojo en Controles = el control cuadra / no cuadra."),
        ("", ""),
        ("h", "Cómo hacer el informe de noviembre (5 minutos)"),
        ("", "1. Copia ventas_2026_11.csv en la carpeta ERP. No dejes en esa carpeta copias ni otros archivos."),
        ("", "2. Abre este libro y cambia Parametros!FechaCorte a 30/11/2026."),
        ("", "3. Datos > Actualizar todo (Ctrl+Alt+F5). Espera a que terminen todas las consultas."),
        ("", "4. Mira la hoja Controles: el control maestro debe estar en VERDADERO (verde). Si algo sale en rojo, no envíes nada: revisa el archivo nuevo."),
        ("", "5. Añade la fila de noviembre en Control_ERP (la da el ERP al cerrar el mes) antes de actualizar, o el control mensual no podrá cuadrar."),
        ("", "6. Revisa Huerfanos (códigos nuevos) y exporta Informe_Reunion a PDF (Archivo > Exportar > Crear PDF/XPS) para la reunión."),
        ("", ""),
        ("h", "Registro de cambios"),
        ("", "16/11/2026 · v01 · Primera versión: consultas, tablas dinámicas, dos salidas y controles. · Administración"),
        ("", "Diciembre 2026 · v02 (cambio inesperado) · ver «Cómo se hizo», apartado 9: «Importe Neto» renombrado, Logroño en el mapa, comerciales V13 y V14."),
        ("", ""),
        ("h", "Comprobado con IA (Copilot autorizado por la empresa)"),
        ("", "Se pidió a Copilot que explicara en llano la consulta M de Ventas. Se comprobó paso a paso con el Editor de Power Query que lo que decía coincidía"),
        ("", "(origen, filtro de archivos, tipos con configuración regional, combinaciones). No se pegaron datos de clientes en ninguna herramienta no autorizada."),
        ("", ""),
        ("h", "Cifras de esta versión (para comprobar que nada ha cambiado al actualizar)"),
        ("", f"Ventas netas ene-oct: {eur(tot)} · margen bruto {A['margen_pct']} % · {len(A['comercial'])} comerciales · {A['clientes_activos']} clientes con venta."),
        ("", f"Noviembre (cambio de diciembre): {nov['lineas']} líneas, {eur(nov['ventas'])}, de ellos Logroño {eur(nov['logrono'])}."),
        ("", ""),
        ("s", "Contacto: administración (extensión 214). Datos ficticios para «Hoja a hoja»."),
    ]


def como_se_hizo():
    M = "m"
    return [
        ("t", "Cómo se hizo (lo que la librería no puede crear: Power Query, tablas dinámicas, segmentaciones, macro)"),
        ("s", "Las hojas Ventas, Comparacion, Objetivos, Ventas2025, Control_ERP, Comerciales y Clientes son lo que cargan las consultas. Los informes de este archivo usan"),
        ("s", "SUMAR.SI.CONJUNTO sobre esas Tablas para que veas los resultados; en el libro real, los bloques (a)-(d) son tablas dinámicas con segmentaciones."),
        ("", ""),
        ("h", "1. Carpetas y versión"),
        ("", "Ventas\\ERP (solo los CSV del ERP: Power Query lee TODO lo que haya en la carpeta y en sus subcarpetas), Ventas\\Maestros y Ventas\\Informe (este libro)."),
        ("", "Microsoft 365 en Windows. Antes de conectar: se sacó «ventas_2026_09 - copia.csv» de la carpeta (duplicaba septiembre)."),
        ("", ""),
        ("h", "2. Conectar la carpeta"),
        ("", "Datos > Obtener datos > Del archivo > De la carpeta > elegir Ventas\\ERP > Transformar datos. En la columna Content: Combinar archivos."),
        ("", "En «Archivo de ejemplo» se eligió ventas_2026_10.csv (el último): si el ejemplo es enero, Power Query fija 12 columnas y CosteUnitario se pierde."),
        ("", "Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma. Se revisó la consulta de función (Transformar archivo) que crea Power Query:"),
        (M, "    Origen = Csv.Document(Parámetro1, [Delimiter=\";\", Encoding=65001, QuoteStyle=QuoteStyle.Csv])"),
        (M, "    #\"Encabezados promovidos\" = Table.PromoteHeaders(Origen, [PromoteAllScalars=true])"),
        ("", "Power Query casa las columnas por su NOMBRE: en enero-junio, CosteUnitario queda vacía (null)."),
        ("", "Primer filtro de la consulta (solo exportaciones): columna Name > Filtros de texto > Comienza por «ventas_»; columna Extension = «.csv»."),
        ("", ""),
        ("h", "3. Los dos archivos rebeldes (detectados con el cuadre por archivo, no a ojo)"),
        ("", "Marzo sale en una sola columna (separador «,») y mayo con encabezados «Column1…» (línea de título). Se filtraron fuera de la consulta principal y se hizo:"),
        ("", "Marzo: Datos > De texto/CSV > ventas_2026_03.csv > Delimitador: Coma > Transformar datos. Mayo: igual con «;», y Inicio > Quitar filas > Quitar filas superiores (1)"),
        ("", "> Usar la primera fila como encabezado. Las dos se añaden a la principal con Inicio > Anexar consultas (casa por nombre de columna)."),
        ("", "Lo profesional es pedir al ERP que las vuelva a exportar bien; mientras, queda anotado en Calidad_datos."),
        ("", ""),
        ("h", "4. Tipos con configuración regional"),
        ("", "Clic derecho en la columna > Cambiar tipo > Usar configuración regional: Fecha (Fecha), Cantidad/PrecioUnitario/DtoLinea/ImporteNeto/CosteUnitario (Número decimal)."),
        ("", "Español (España) en la consulta principal y en mayo; Inglés (Estados Unidos) en marzo (punto decimal y fechas M/D/AAAA). En la barra de fórmulas se ve así:"),
        (M, "    = Table.TransformColumnTypes(#\"Encabezados promovidos\", {{\"Fecha\", type date}, {\"ImporteNeto\", type number}, …}, \"es-ES\")"),
        ("", "CodProducto se deja como Texto (nunca Número entero: perdería los ceros)."),
        ("", ""),
        ("h", "5. Limpieza"),
        ("", "Delegacion: Transformar > Formato > Recortar y > MAYÚSCULAS; Combinar consultas con MapaDelegaciones (Original) y expandir Delegacion."),
        ("", "Se conserva la columna original como DelegacionERP para poder auditar. Control: ninguna fila con Delegacion vacía."),
        ("", "CodProducto a 6 dígitos (la única línea de M que se escribe): Agregar columna > Columna personalizada:"),
        (M, "    = Text.PadStart(Text.From([CodProducto]), 6, \"0\")"),
        ("", ""),
        ("h", "6. Maestros: Combinar consultas"),
        ("", "Ventas × Productos por CodProducto (Externa izquierda) → expandir Familia, Subfamilia y CosteEstandar. Ventas × Comerciales por CodComercial (Externa izquierda)."),
        ("", "Huérfanos: Combinar consultas Ventas × Productos con «Anti izquierda» y Quitar duplicados de CodProducto → consulta Huerfanos (7 códigos)."),
        ("", "Familia vacía → Transformar > Reemplazar valores: null por «Sin clasificar». Columna CuentaComercial = «No» si Familia = «Ajustes»; si no, «Sí»."),
        ("", ""),
        ("h", "7. Coste y margen"),
        ("", "Agregar columna > Columna condicional CosteUsado: si CosteUnitario es igual a null → CosteEstandar; si no → CosteUnitario. En M:"),
        (M, "    = if [CosteUnitario] = null then [CosteEstandar] else [CosteUnitario]"),
        ("", "Coste = CosteUsado × Cantidad (Agregar columna > Estándar > Multiplicar). Margen = ImporteNeto − Coste. Mes = Fecha > Mes > Inicio del mes."),
        ("", ""),
        ("h", "8. Objetivos, 2025 y la tabla Comparacion"),
        ("", "Objetivos_2026 y Ventas_2025_resumen: seleccionar las columnas que no son meses > Transformar > Anular dinamización de otras columnas."),
        ("", "Atributo (Ene…Dic) se combina con la tabla Meses para tener NumMes; Mes = #date(Año, NumMes, 1). «Lérida» pasa por MapaDelegaciones."),
        ("", "Comparacion = Anexar consultas: Ventas agrupadas (Inicio > Agrupar por Delegacion, Familia, CodComercial, Mes; suma de ImporteNeto) con Tipo = Real y Año = 2026"),
        ("", "+ Ventas2025 (Tipo = Real, Año = 2025) + Objetivos (Tipo = Objetivo). Columna Comparable = Sí en las 6 familias de producto. Cargar como Tabla."),
        ("", ""),
        ("h", "Tablas dinámicas (Insertar > Tabla dinámica > De una tabla o rango)"),
        ("", "(a) Comparacion filtrada Tipo = Real y Comparable = Sí: Filas Delegacion y Mes; Columnas Año; Valores Suma de Importe. Segunda copia del valor con"),
        ("", "    Configuración de campo de valor > Mostrar valores como > % de diferencia de > Campo base: Año, Elemento base: 2025."),
        ("", "(b) Comparacion: Filas CodComercial; Columnas Tipo (Real, Objetivo); Valores Suma de Importe; Filtro Año = 2026. Cumplimiento = columna al lado con"),
        ("", "    =SI.ERROR(Real/Objetivo;\"\") o un campo calculado. (En Real, filtrar Familia distinta de «Ajustes».)"),
        ("", "(c) Ventas: Filas Familia; Valores Suma de ImporteNeto y Suma de Margen; Analizar tabla dinámica > Campos, elementos y conjuntos > Campo calculado"),
        ("", "    «Margen %» = Margen / ImporteNeto (es correcto: el campo calculado opera sobre las SUMAS, no hace la media de porcentajes). Formato 0,0 %."),
        ("", "(d) Ventas: Filas CodCliente; Valores Suma de ImporteNeto tres veces: tal cual, % del total general y % del total acumulado en CodCliente;"),
        ("", "    ordenar de mayor a menor y Filtro de valor > Diez mejores > 20 elementos (Pareto)."),
        ("", "Segmentaciones: Analizar tabla dinámica > Insertar segmentación de datos > Delegacion y Familia; clic derecho > Conexiones de informe: marcar todas las tablas"),
        ("", "    dinámicas del mismo origen. Escala de tiempo: Insertar escala de tiempo > Mes (en las de Ventas)."),
        ("", ""),
        ("h", "Gráficos y salidas"),
        ("", "Gráfico combinado: columnas 2026 y 2025 por mes y la línea de Var. % en el EJE SECUNDARIO (Cambiar tipo de gráfico > Cuadro combinado). Cumplimiento: columnas"),
        ("", "    con una serie de línea fija en 100 %. Minigráficos: Insertar > Minigráficos > Línea, rango de 10 meses por comercial."),
        ("", "Informe_Reunion: sin margen en ninguna parte. Informe_Direccion: completo. Título dinámico con =\"Ventas acumuladas a \"&TEXTO(MAX(Ventas[Fecha]);\"mmmm\")&\" de \"&AÑO(MAX(Ventas[Fecha]))."),
        ("", "Opcional: macro grabada «ExportarReunion» (Programador > Grabar macro: Datos > Actualizar todo y Archivo > Exportar > PDF de Informe_Reunion), libro .xlsm y botón."),
        ("", ""),
        ("h", "9. Cambio inesperado de diciembre (ventas_2026_11.csv)"),
        ("", "Al actualizar falla: la columna se llama «Importe Neto» (con espacio). Solución tolerante en la consulta de función, justo después de promover encabezados:"),
        (M, "    = Table.RenameColumns(#\"Encabezados promovidos\", {{\"Importe Neto\", \"ImporteNeto\"}}, MissingField.Ignore)"),
        ("", "Delegación «LOGROÑO» sin mapa (el control de delegación vacía salta): fila nueva en MapaDelegaciones. V13 y V14 sin maestro: altas en Comerciales"),
        ("", "    (Llega_en_diciembre\\altas_diciembre.xlsx) y sin objetivo hasta que Javier lo fije. Las 7 altas de productos de Compras llevan «Sin clasificar» a 0,00 €."),
        ("", "Aviso a Javier: Logroño no tiene comparación con 2025. Comprobado que enero-octubre no cambian. Anotado en el registro de cambios (v02)."),
    ]


if __name__ == "__main__":
    main()

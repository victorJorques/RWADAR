# -*- coding: utf-8 -*-
"""
P2 · Vacaciones, ausencias y plantilla (RRHH) · SOLUCIÓN
========================================================

1. Lee los datos SUCIOS (libros/p2-datos.xlsx y libros/p2-ausencias.xlsx) con pandas/openpyxl,
   los limpia con las reglas del encargo y las aclaraciones de Lucía, recalcula los totales de
   control y comprueba que coinciden con los del generador (libros/src/p2_verdad.json).
2. Escribe los dos libros resueltos, con fórmulas reales de Excel (en el archivo, en inglés y con
   comas; Excel en español las muestra traducidas):
     libros/p2-solucion.xlsx       «Vacaciones_2026-2027»: el archivo que se comparte con los
                                   responsables (sin NIF, sin jornada, sin ausencias).
     libros/p2-solucion-rrhh.xlsx  «Absentismo_2026_RRHH»: maestro limpio desde la exportación,
                                   ausencias SIN observaciones, absentismo y plantilla. Solo RRHH.
   Las fórmulas usan referencias normales (A1) y rangos con nombre, y las Tablas van
   dimensionadas con filas vacías: así funcionan también en Excel 2016-2019 y con la hoja
   protegida. La tabla dinámica y el PDF se explican en la hoja «Cómo se hizo».
3. Con --verificar, recalcula los dos libros con LibreOffice y compara las celdas clave con
   los totales de control.
"""
import datetime as dt
import json
import math
import os
import re
import shutil
import subprocess
import sys
from fractions import Fraction

import openpyxl
import pandas as pd
import xlsxwriter

D = dt.date
AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
V = json.load(open(os.path.join(AQUI, "p2_verdad.json"), encoding="utf-8"))
CTRL = V["controles"]
ANIO, INI, FIN, CORTE = 2026, D(2026, 1, 1), D(2026, 12, 31), D(2026, 10, 31)


def fd(s):
    return D.fromisoformat(s) if s else None


# ======================================================================================
# 1. LIMPIEZA CON PANDAS (desde los archivos sucios)
# ======================================================================================
# 1.1 Festivos: lista de la gestoría + correcciones comprobadas en el BOE y los boletines
fest_raw = pd.read_excel(os.path.join(LIBROS, "p2-datos.xlsx"), sheet_name="Festivos_gestoria")
fest_raw = fest_raw[pd.to_datetime(fest_raw["Fecha"], errors="coerce").notna()].copy()
fest_raw["Fecha"] = pd.to_datetime(fest_raw["Fecha"]).dt.date
fest = []
for _, r in fest_raw.iterrows():
    f, nota = r["Fecha"], ""
    if r["Ámbito"] == "Local Lleida" and f == D(2026, 10, 29):
        f, nota = D(2026, 9, 29), "Corregido: la gestoría puso 29/10/2026. Sant Miquel es el 29/09 (calendario de Lleida)."
    fest.append([f, r["Descripción"], r["Ámbito"], nota])
fest.append([D(2026, 12, 7), "Lunes siguiente al Día de la Constitución Española", "Aragón",
             "Añadido: faltaba en la lista de la gestoría (BOE-A-2025-21667, anexo)."])
DELEG_DE = {"Nacional": "Todas", "Aragón": "Zaragoza", "Local Zaragoza": "Zaragoza", "Navarra": "Pamplona",
            "Local Pamplona": "Pamplona", "Cataluña": "Lleida", "Local Lleida": "Lleida"}
fest.sort(key=lambda t: (t[0], t[2]))
FEST = {dl: {f for f, _, a, _ in fest if DELEG_DE[a] in ("Todas", dl)} for dl in ("Zaragoza", "Pamplona", "Lleida")}
assert {dl: sorted(s) for dl, s in FEST.items()} == {
    dl: sorted(fd(f) for f, _, a in V["festivos"] if DELEG_DE[a] in ("Todas", dl)) for dl in FEST}


def lab(d, dl):
    return d.weekday() < 5 and d not in FEST[dl]


def dias_lab(a, b, dl):
    if a is None or b is None or a > b:
        return 0
    return sum(lab(a + dt.timedelta(i), dl) for i in range((b - a).days + 1))


# 1.2 Maestro de empleados desde la exportación de nóminas (todo texto)
nom = pd.read_excel(os.path.join(LIBROS, "p2-datos.xlsx"), sheet_name="Nomina_export", dtype=str).fillna("")
calidad_nom = {"filas_brutas": len(nom)}
es_total = nom["CodEmpleado"].str.startswith("Total")
calidad_nom["totales"] = int(es_total.sum())
nom = nom[~es_total]
dup = nom.duplicated(keep="first")
calidad_nom["duplicados"] = int(dup.sum())
nom = nom[~dup].copy()
calidad_nom["sin_prefijo"] = int((~nom["CodEmpleado"].str.startswith("E")).sum())
calidad_nom["espacios"] = int((nom["ApellidosNombre"] != nom["ApellidosNombre"].str.split().str.join(" ")).sum())
nom["Cod"] = "E" + nom["CodEmpleado"].str.replace("E", "", regex=False).astype(int).map("{:04d}".format)
ap = nom["ApellidosNombre"].str.split(",", n=1)
nom["Apellidos"] = ap.str[0].str.split().str.join(" ").str.title()
nom["Nombre"] = ap.str[1].str.split().str.join(" ").str.title()
EQ_DEP = {"Almacén": "Almacén", "almacen": "Almacén", "ALMACÉN": "Almacén", "Almacén y Logística": "Almacén",
          "Admón.": "Administración", "Administración": "Administración", "Comercial": "Comercial",
          "Dirección": "Dirección"}
EQ_DEL = {"Zaragoza": "Zaragoza", "Zgz": "Zaragoza", "Pamplona": "Pamplona", "Lleida": "Lleida"}
nom["Departamento"] = nom["Departamento"].str.strip().map(EQ_DEP)
nom["Deleg"] = nom["Delegación"].str.strip().map(EQ_DEL)
assert nom["Departamento"].notna().all() and nom["Deleg"].notna().all()


def fecha_txt(s):
    s = s.strip()
    if not s:
        return None
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return D(int(s[:4]), int(s[5:7]), int(s[8:]))
    if re.fullmatch(r"\d{2}-\d{2}-\d{2}", s):
        return D(2000 + int(s[6:]), int(s[3:5]), int(s[:2]))
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}", s):
        return D(int(s[6:]), int(s[3:5]), int(s[:2]))
    raise ValueError(s)


def jornada_txt(s):
    s = s.strip()
    x = float(s.rstrip("%").replace(",", "."))
    return x / 100 if (s.endswith("%") or x > 1) else x


calidad_nom["fechas_iso"] = int(nom["FechaAlta"].str.match(r"\d{4}-").sum())
calidad_nom["fechas_aa"] = int(nom["FechaAlta"].str.match(r"\d{2}-\d{2}-\d{2}$").sum())
nom["Alta"] = nom["FechaAlta"].map(fecha_txt)
nom["Baja"] = nom["FechaBaja"].map(fecha_txt)
nom["Jornada_n"] = nom["Jornada"].map(jornada_txt)
assert nom["Jornada_n"].between(0.01, 1).all()
calidad_nom["contratos"] = len(nom)
calidad_nom["personas"] = nom["NIF"].nunique()
# comparación con la verdad
tc = sorted((c["cod"], c["alta"], c["baja"] or "", c["jornada"]) for c in V["contratos"])
lc = sorted((r.Cod, r.Alta.isoformat(), r.Baja.isoformat() if r.Baja else "", r.Jornada_n) for r in nom.itertuples())
assert tc == lc, "La limpieza del maestro no reproduce los contratos verdaderos"
for p in V["personas"]:
    fila = nom[nom["Cod"] == p["cod"]].iloc[0]
    assert (fila["Nombre"], fila["Apellidos"], fila["Departamento"], fila["Deleg"]) == \
           (p["nombre"], f"{p['ap1']} {p['ap2']}", p["dept"], p["deleg"]), p["cod"]

# Una fila por persona con el contrato vigente en 2026 (el último)
emp = nom.sort_values(["Cod", "Alta"]).drop_duplicates("Cod", keep="last").reset_index(drop=True)
emp["Abrev"] = emp["Nombre"] + " " + emp["Apellidos"].str[0] + "."
assert emp["Abrev"].is_unique
emp["Activo"] = emp.apply(lambda r: r.Alta <= CORTE and (r.Baja is None or r.Baja > CORTE), axis=1)
assert emp["Activo"].sum() == CTRL["activos"] and len(emp) == CTRL["personas"]
E = {r.Cod: r for r in emp.itertuples()}
ABREV = {r.Abrev: r.Cod for r in emp.itertuples()}
DL = {r.Cod: r.Deleg for r in emp.itertuples()}

# 1.3 Periodos desde las 4 hojas de los responsables
periodos = []  # dict(cod, tipo, desde, hasta, origen)
TIPO = {"Vac.": "Vacaciones", "vacaciones": "Vacaciones", "V": "Vacaciones", "AP": "Asuntos propios"}
calidad_vac = {}

# Administración: cuadrícula -> periodos (las «V» seguidas, saltando fines de semana y festivos)
wbx = openpyxl.load_workbook(os.path.join(LIBROS, "p2-datos.xlsx"))
wsA = wbx["Vac_Administracion"]
fechas = [c.value.date() for c in wsA[3][1:]]
ETQ = {f"{r.Nombre} {r.Apellidos.split()[0]}": r.Cod for r in emp.itertuples() if r.Departamento == "Administración"}
ETQ["Paco Gil"] = "E0006"  # «Paco» = Francisco Gil Bielsa
total_v = 0
for row in wsA.iter_rows(min_row=4, values_only=True):
    if not row[0]:
        continue
    cod = ETQ[row[0]]
    vs = [f for f, v in zip(fechas, row[1:]) if v == "V"]
    total_v += len(vs)
    grupo = []
    for f in vs:
        if grupo and dias_lab(grupo[-1] + dt.timedelta(1), f - dt.timedelta(1), "Zaragoza") > 0:
            periodos.append(dict(cod=cod, tipo="Vacaciones", desde=grupo[0], hasta=grupo[-1],
                                 origen=f"Vac_Administracion, fila {row and wsA.max_row and ''}"))
            grupo = []
        grupo.append(f)
    if grupo:
        periodos.append(dict(cod=cod, tipo="Vacaciones", desde=grupo[0], hasta=grupo[-1], origen=""))
for x in periodos:
    x["origen"] = "Vac_Administracion (cuadrícula)"
calidad_vac["admin_v"] = total_v
assert total_v == CTRL["admin_v"]

# Comercial
com = pd.read_excel(os.path.join(LIBROS, "p2-datos.xlsx"), sheet_name="Vac_Comercial")
calidad_vac["com_mal"] = 0
calidad_vac["com_cruzadas"] = 0
for i, r in com.iterrows():
    cod = ABREV[r["Nombre"]]
    a, b = r["Desde"].date(), r["Hasta"].date()
    nota = []
    if b < a:
        a, b = b, a
        calidad_vac["com_cruzadas"] += 1
        nota.append("Fechas cruzadas: se intercambian Desde y Hasta")
    bien = dias_lab(a, b, DL[cod])
    if bien != r["Días"]:
        calidad_vac["com_mal"] += 1
        nota.append(f"Días a mano: {int(r['Días'])} (bien: {bien})")
    periodos.append(dict(cod=cod, tipo=TIPO[r["Tipo"]], desde=a, hasta=b,
                         origen=f"Vac_Comercial, fila {i + 2}" + ("; " + "; ".join(nota) if nota else "")))
assert calidad_vac["com_mal"] == 6 and calidad_vac["com_cruzadas"] == 1

# Almacén: deshacer las celdas combinadas (rellenar hacia abajo) y quitar los subtotales
wsL = wbx["Vac_Almacen"]
nombre_actual = None
calidad_vac["alm_totales"] = 0
calidad_vac["alm_2062"] = 0
for k, row in enumerate(wsL.iter_rows(min_row=4, values_only=True), start=4):
    n, a, b, dias, tipo = row[:5]
    if n and str(n).startswith("Total"):
        calidad_vac["alm_totales"] += 1
        continue
    if n:
        nombre_actual = n
    if a is None:
        continue
    cod = ABREV[nombre_actual]
    a, b = a.date(), b.date()
    nota = ""
    if b.year == 2062:
        b = b.replace(year=2026)
        calidad_vac["alm_2062"] += 1
        nota = "; año 2062 corregido a 2026"
    periodos.append(dict(cod=cod, tipo=TIPO[tipo], desde=a, hasta=b, origen=f"Vac_Almacen, fila {k}{nota}"))
assert calidad_vac["alm_totales"] == 7 and calidad_vac["alm_2062"] == 1

# Dirección: transcripción del texto libre (lo que haría la alumna a mano)
TRANSCRIPCION_DIR = [
    ("E0001", D(2026, 8, 3), D(2026, 8, 21)), ("E0001", D(2026, 12, 28), D(2026, 12, 31)),
    ("E0002", D(2026, 4, 6), D(2026, 4, 10)), ("E0002", D(2026, 8, 10), D(2026, 8, 21)),
    ("E0002", D(2026, 12, 7), D(2026, 12, 11)),
    ("E0003", D(2026, 7, 13), D(2026, 7, 24)), ("E0003", D(2026, 12, 21), D(2027, 1, 8)),
    ("E0004", D(2026, 8, 17), D(2026, 8, 28)), ("E0004", D(2026, 10, 26), D(2026, 10, 30)),
    ("E0004", D(2026, 12, 23), D(2026, 12, 24)),
]
for k, (cod, a, b) in enumerate(TRANSCRIPCION_DIR):
    fila = ["E0001", "E0002", "E0003", "E0004"].index(cod) + 2
    periodos.append(dict(cod=cod, tipo="Vacaciones", desde=a, hasta=b, origen=f"Vac_Direccion, fila {fila} (texto libre)"))

# Comparar con la verdad: mismo conjunto de días laborables por persona y tipo


def huella(cod, tipo, a, b):
    dl = DL[cod]
    return (cod, tipo, tuple(sorted(a + dt.timedelta(i) for i in range((b - a).days + 1) if lab(a + dt.timedelta(i), dl))))


hv = sorted(huella(x["cod"], x["tipo"], fd(x["desde"]), fd(x["hasta"])) for x in V["periodos"])
hl = sorted(huella(x["cod"], x["tipo"], x["desde"], x["hasta"]) for x in periodos)
assert hv == hl, "Los periodos limpios no coinciden con los verdaderos"
# Sin solapes ni fechas fuera de 2026-2027
for cod in E:
    xs = sorted([x for x in periodos if x["cod"] == cod], key=lambda x: x["desde"])
    for u, w in zip(xs, xs[1:]):
        assert u["hasta"] < w["desde"]
assert all(INI <= x["desde"] <= x["hasta"] <= D(2027, 12, 31) for x in periodos)

ORDEN_DEP = ["Dirección", "Administración", "Comercial", "Almacén"]
periodos.sort(key=lambda x: (ORDEN_DEP.index(E[x["cod"]].Departamento), x["origen"].split(",")[0], x["cod"], x["desde"]))

# 1.4 Totales de control recalculados
for x in periodos:
    dl = DL[x["cod"]]
    x["d2026"] = dias_lab(max(x["desde"], INI), min(x["hasta"], FIN), dl)
    x["disfr"] = dias_lab(max(x["desde"], INI), min(x["hasta"], CORTE), dl)
vac = [x for x in periodos if x["tipo"] == "Vacaciones"]
c_vac = sum(x["d2026"] for x in vac)


def derecho(dias_alta):
    return math.ceil(Fraction(22 * dias_alta, 365) * 2) / 2


ARR = {"E0031": 6}
sal = {}
for r in emp.itertuples():
    dalta = (min(r.Baja or FIN, FIN) - max(r.Alta, INI)).days + 1
    usados = sum(x["d2026"] for x in vac if x["cod"] == r.Cod)
    sal[r.Cod] = dict(derecho=derecho(dalta), saldo=derecho(dalta) + ARR.get(r.Cod, 0) - usados, activo=r.Activo)
c_der = sum(s["derecho"] for s in sal.values() if s["activo"])
c_sal = sum(s["saldo"] for s in sal.values() if s["activo"])

aus = pd.read_excel(os.path.join(LIBROS, "p2-ausencias.xlsx"), sheet_name="Ausencias_2026")
n_obs_salud = 11  # revisadas una a una: diagnósticos o síntomas (lista en «Calidad de datos»)
SALUD_PAL = ["lumbalgia", "ansiedad", "gastroenteritis", "fractura", "gripe", "rodilla", "migraña", "depresión",
             "hernia", "esguince", "bronquitis"]
assert aus["Observaciones"].fillna("").str.lower().map(lambda t: any(p in t for p in SALUD_PAL)).sum() == n_obs_salud
aus = aus.drop(columns=["Observaciones"])
aus["Desde"] = pd.to_datetime(aus["Desde"]).dt.date
aus["Hasta"] = pd.to_datetime(aus["Hasta"]).dt.date.where(aus["Hasta"].notna(), None)
aus["HastaEf"] = aus["Hasta"].map(lambda h: h if h else CORTE)
aus["Dept"] = aus["CodEmpleado"].map(lambda c: E[c].Departamento)
aus["Deleg"] = aus["CodEmpleado"].map(DL)
assert aus["Dept"].notna().all()


def fin_mes(m):
    return (D(ANIO, m, 28) + dt.timedelta(4)).replace(day=1) - dt.timedelta(1)


c_it = 0
for r in aus.itertuples():
    if r.Tipo in ("IT_EC", "IT_AT"):
        for m in range(1, 11):
            c_it += dias_lab(max(r.Desde, D(ANIO, m, 1)), min(r.HastaEf, fin_mes(m)), r.Deleg)
c_teo = 0
for r in nom.itertuples():
    for m in range(1, 11):
        mitad = D(ANIO, m, 15)
        if r.Alta <= mitad and (r.Baja is None or r.Baja >= mitad):
            c_teo += dias_lab(D(ANIO, m, 1), fin_mes(m), r.Deleg)
recalc = dict(personas=calidad_nom["personas"], activos=int(emp["Activo"].sum()), vac2026=c_vac,
              derecho_activos=c_der, saldo_activos=c_sal, it_dias=c_it, teorico=c_teo,
              tasa_pct=round(100 * c_it / c_teo, 2), obs_salud=n_obs_salud)
for k, v in recalc.items():
    assert v == CTRL[k], (k, v, CTRL[k])
print("Limpieza con pandas: los totales de control coinciden con el generador:", recalc)

# ======================================================================================
# 2. FORMATOS COMUNES
# ======================================================================================
COL_ENTRADA = "#FFF2CC"


def formatos(wb):
    F = {}
    F["tit"] = wb.add_format({"bold": True, "font_size": 15, "font_color": "#1F3864"})
    F["sub"] = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "top": 1, "top_color": "#BFBFBF"})
    F["txt"] = wb.add_format({"text_wrap": True, "valign": "top"})
    F["neg"] = wb.add_format({"bold": True})
    F["cab"] = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "vcenter"})
    F["cel"] = wb.add_format({"border": 1, "border_color": "#BFBFBF"})
    F["celw"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "text_wrap": True, "valign": "top"})
    F["ent"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "bg_color": COL_ENTRADA, "locked": False})
    F["ent_f"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "bg_color": COL_ENTRADA, "locked": False,
                                "num_format": "dd/mm/yyyy"})
    F["ent_m"] = wb.add_format({"border": 2, "border_color": "#1F3864", "bg_color": COL_ENTRADA, "locked": False,
                                "num_format": "mmmm yyyy", "bold": True, "font_size": 12})
    F["ent_n"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "bg_color": COL_ENTRADA, "locked": False,
                                "num_format": "0.0"})
    F["fec"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "dd/mm/yyyy"})
    F["fec0"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "dd/mm/yyyy;;;"})
    F["mes"] = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "num_format": "mmm", "align": "center"})
    F["num"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0"})
    F["num1"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0.0"})
    F["num2"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0.00"})
    F["pct"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0.00%"})
    F["pctb"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0.00%", "bold": True})
    F["numb"] = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "0", "bold": True})
    F["rojo"] = wb.add_format({"bg_color": "#FFC7CE", "font_color": "#9C0006", "bold": True})
    F["ambar"] = wb.add_format({"bg_color": "#FFEB9C", "font_color": "#7F6000"})
    F["verde"] = wb.add_format({"bg_color": "#C6EFCE", "font_color": "#006100", "bold": True})
    F["gris"] = wb.add_format({"bg_color": "#D9D9D9"})
    F["fest"] = wb.add_format({"bg_color": "#DDEBF7", "font_color": "#1F3864"})
    F["aviso"] = wb.add_format({"bold": True, "font_color": "#9C0006", "text_wrap": True, "valign": "top"})
    return F


def hoja_texto(wb, F, nombre, titulo, bloques, ancho=110):
    ws = wb.add_worksheet(nombre)
    ws.set_column("A:A", ancho)
    ws.write(0, 0, titulo, F["tit"])
    r = 2
    for tipo, t in bloques:
        if tipo == "sub":
            r += 1
            ws.write(r, 0, t, F["sub"])
        else:
            ws.write(r, 0, t, F["aviso"] if tipo == "aviso" else F["txt"])
        r += 1
    return ws


def tabla_controles(wb, F, ws, filas, fila0=3):
    """filas: (descripción, esperado (num o fórmula), obtenido (fórmula), tolerancia)."""
    cab = ["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Estado"]
    for j, h in enumerate(cab):
        ws.write(fila0 - 1, j, h, F["cab"])
    for i, (desc, esp, obt, tol) in enumerate(filas):
        r = fila0 + i
        ws.write_number(r, 0, i + 1, F["cel"])
        ws.write_string(r, 1, desc, F["celw"])
        if isinstance(esp, str):
            ws.write_formula(r, 2, esp, F["num2"])
        else:
            ws.write_number(r, 2, esp, F["num2"])
        ws.write_formula(r, 3, obt, F["num2"])
        ws.write_formula(r, 4, f"=D{r + 1}-C{r + 1}", F["num2"])
        ws.write_number(r, 5, tol, F["num2"])
        ws.write_formula(r, 6, f"=ABS(E{r + 1})<=F{r + 1}", F["cel"])
    ult = fila0 + len(filas)
    ws.write(0, 3, "Control maestro:", F["neg"])
    ws.write_formula(0, 4, f"=AND(G{fila0 + 1}:G{ult})", F["cel"])
    ws.conditional_format(f"G{fila0 + 1}:G{ult}", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["verde"]})
    ws.conditional_format(f"G{fila0 + 1}:G{ult}", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["rojo"]})
    ws.conditional_format("E1", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["verde"]})
    ws.conditional_format("E1", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["rojo"]})
    ws.set_column("A:A", 4); ws.set_column("B:B", 70); ws.set_column("C:F", 12); ws.set_column("G:G", 10)
    return ult


def hoja_parametros(wb, F, con_cuadrante=True):
    ws = wb.add_worksheet("Parámetros")
    ws.write(0, 0, "Parámetros (las celdas amarillas son las únicas que se cambian)", F["tit"])
    filas = [("Año de las vacaciones", "Anio", 2026, None),
             ("Fecha de corte (meses cerrados)", "FechaCorte", D(2026, 10, 31), "f"),
             ("Días de vacaciones por convenio (año completo, laborables)", "DiasConvenio", 22, None),
             ("Redondeo del derecho (al medio día superior)", "Redondeo", 0.5, "n")]
    for i, (txt, nombre, val, t) in enumerate(filas, start=2):
        ws.write(i, 0, txt, F["cel"])
        if t == "f":
            ws.write_datetime(i, 1, dt.datetime(val.year, val.month, val.day), F["ent_f"])
        elif t == "n":
            ws.write_number(i, 1, val, F["ent_n"])
        else:
            ws.write_number(i, 1, val, F["ent"])
        ws.write(i, 2, nombre, F["cel"])
        wb.define_name(nombre, f"='Parámetros'!$B${i + 1}")
    calc = [("Primer día del año", "InicioAnio", "=DATE(Anio,1,1)", F["fec"]),
            ("Último día del año", "FinAnio", "=DATE(Anio,12,31)", F["fec"]),
            ("Días naturales del año", "DiasAnio", "=FinAnio-InicioAnio+1", F["num"])]
    for i, (txt, nombre, fml, fmt) in enumerate(calc, start=6):
        ws.write(i, 0, txt, F["cel"])
        ws.write_formula(i, 1, fml, fmt)
        ws.write(i, 2, nombre, F["cel"])
        wb.define_name(nombre, f"='Parámetros'!$B${i + 1}")
    ws.set_column("A:A", 58); ws.set_column("B:B", 14); ws.set_column("C:C", 14)
    return ws


def hoja_festivos(wb, F):
    ws = wb.add_worksheet("Festivos")
    cab = ["Fecha", "Descripción", "Ámbito", "Delegación", "Nota", "ZGZ", "PAM", "LLE"]
    n_filas = 60  # Tabla dimensionada: hay sitio para el calendario de 2027 sin tocar las fórmulas
    ws.add_table(0, 0, n_filas, len(cab) - 1, {"name": "Festivos", "style": "Table Style Light 9",
                                                "columns": [{"header": h} for h in cab]})
    for i in range(n_filas):
        r = i + 1
        if i < len(fest):
            f, desc, amb, nota = fest[i]
            ws.write_datetime(r, 0, dt.datetime(f.year, f.month, f.day), F["ent_f"])
            ws.write_string(r, 1, desc, F["ent"])
            ws.write_string(r, 2, amb, F["ent"])
            ws.write_string(r, 3, DELEG_DE[amb], F["ent"])
            if nota:
                ws.write_string(r, 4, nota, F["ent"])
            else:
                ws.write_blank(r, 4, None, F["ent"])
        else:
            for j in range(5):
                ws.write_blank(r, j, None, F["ent_f"] if j == 0 else F["ent"])
        for j, dl in enumerate(["Zaragoza", "Pamplona", "Lleida"]):
            ws.write_formula(r, 5 + j, f'=IF($A{r + 1}="",0,IF(OR($D{r + 1}="Todas",$D{r + 1}="{dl}"),$A{r + 1},0))', F["fec0"])
    ws.data_validation(1, 3, n_filas, 3, {"validate": "list", "source": ["Todas", "Zaragoza", "Pamplona", "Lleida"]})
    for nombre, col in (("FestZGZ", "F"), ("FestPAM", "G"), ("FestLLE", "H")):
        wb.define_name(nombre, f"=Festivos!${col}$2:${col}${n_filas + 1}")
    ws.set_column("A:A", 12); ws.set_column("B:B", 44); ws.set_column("C:D", 15); ws.set_column("E:E", 60)
    ws.set_column("F:H", 11)
    ws.freeze_panes(1, 0)
    ws.write(n_filas + 2, 0, "Delegación «Todas» = festivo nacional. Las columnas ZGZ, PAM y LLE dan la fecha si el festivo "
                             "vale para esa delegación (y 0, que no se ve, si no). Cada delegación tiene 14 festivos en 2026 "
                             "(en Navarra, 13 forales + 1 local).", F["txt"])
    return ws


MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
            "noviembre", "diciembre"]
DELEG_N = '{"Zaragoza","Pamplona","Lleida"}'

# ======================================================================================
# 3. LIBRO COMPARTIDO: p2-solucion.xlsx («Vacaciones_2026-2027»)
# ======================================================================================
wb = xlsxwriter.Workbook(os.path.join(LIBROS, "p2-solucion.xlsx"))
wb.set_properties({"title": "Vacaciones_2026-2027 (solución P2)", "author": "Hoja a hoja",
                   "comments": "Archivo para los responsables: solo vacaciones y asuntos propios."})
F = formatos(wb)

hoja_texto(wb, F, "Léame", "Vacaciones_2026-2027 · Léame", [
    ("sub", "Para qué sirve"),
    ("txt", "Archivo único de vacaciones y asuntos propios de Electro Cierzo Suministros para lo que queda de 2026 y "
            "para 2027. Dice los días que le quedan a cada persona (hoja Saldos), avisa si en un departamento se van "
            "demasiados a la vez (hoja Cuadrante) y deja a los responsables apuntar periodos sin estropear nada."),
    ("txt", "Lo pidió Lucía Fernández (RRHH) el 16/11/2026. Fecha de corte de los datos: 31/10/2026 (lo anterior está "
            "disfrutado; lo posterior, planificado). Contacto: RRHH."),
    ("sub", "Para los responsables (5 líneas)"),
    ("txt", "1. Apunta cada periodo en la hoja Periodos, en la primera fila libre: Código, Tipo, Desde y Hasta (celdas amarillas)."),
    ("txt", "2. Tipo: «Vacaciones» o «Asuntos propios» (desplegable). Los asuntos propios no descuentan vacaciones."),
    ("txt", "3. Si la fila dice algo distinto de «OK» en Comprobación, corrígela: fechas al revés, fuera de 2026-2027 o solape."),
    ("txt", "4. No toques las columnas blancas: se calculan solas. Las hojas están protegidas sin contraseña solo para evitar borrados."),
    ("txt", "5. Dudas: Lucía Fernández (RRHH). RRHH revisa y valida los periodos cada viernes."),
    ("sub", "Qué hay en cada hoja (de izquierda a derecha)"),
    ("txt", "Parámetros: año, fecha de corte, días de convenio, límites por departamento y arrastres. Amarillo = se puede cambiar."),
    ("txt", "Festivos: los 14 festivos de 2026 de cada delegación (nacionales, autonómicos y locales), comprobados en el "
            "BOE (BOE-A-2025-21667) y en los boletines autonómicos. Dos correcciones a la lista de la gestoría (ver Nota)."),
    ("txt", "Empleados: código, nombre, departamento, delegación y fechas del contrato vigente (sin NIF ni jornada: aquí no hacen falta). "
            "Viene del maestro limpio de RRHH (Absentismo_2026_RRHH.xlsx)."),
    ("txt", "Periodos: una fila por periodo. Días laborables calculados con DIAS.LAB.INTL y los festivos de la delegación de cada persona."),
    ("txt", "Saldos: derecho proporcional (22 × días de alta / días del año, redondeado al medio día superior), arrastre, "
            "disfrutado, planificado y saldo. Rojo si es negativo; ámbar si quedan más de 5 días."),
    ("txt", "Cuadrante: elige el mes en la celda amarilla B2. «V» = vacaciones, «F» = festivo de su delegación, gris = fin de "
            "semana. Abajo, las alertas: el número se pone en rojo si un departamento supera su límite."),
    ("txt", "Controles: comprobaciones automáticas. El control maestro (arriba) tiene que estar en VERDADERO."),
    ("txt", "Colores: amarillo = entrada; azul = cabeceras; verde/rojo = controles; ámbar = aviso."),
    ("sub", "Cómo actualizarlo para 2027"),
    ("txt", "1. Cuando llegue el calendario de 2027, añade sus festivos en Festivos (hay filas libres): Fecha, Descripción, Ámbito y Delegación."),
    ("txt", "2. En Parámetros, cambia el Año a 2027 y la fecha de corte; revisa los arrastres (días de 2026 que se pueden disfrutar en 2027)."),
    ("txt", "3. Si entra alguien, añade su fila en Empleados (y en el Cuadrante, su código en la primera fila libre de su departamento)."),
    ("txt", "4. Mira la hoja Controles: todo en VERDADERO."),
    ("sub", "Registro de cambios"),
    ("txt", "16/11/2026 · v01 · Primera versión con los datos a 31/10/2026 · (tu nombre)."),
    ("aviso", "Este archivo NO lleva bajas, permisos ni datos de salud: eso está en Absentismo_2026_RRHH.xlsx, que solo ve RRHH (RGPD, art. 5.1.c y 9.1)."),
])

wp = hoja_parametros(wb, F)
# lista de meses del cuadrante
wp.write(1, 4, "Meses del cuadrante", F["cab"])
meses_lista = [D(2026, 11, 1), D(2026, 12, 1)] + [D(2027, m, 1) for m in range(1, 13)]
for i, m in enumerate(meses_lista, start=2):
    wp.write_datetime(i, 4, dt.datetime(m.year, m.month, 1), wb.add_format({"num_format": "mmmm yyyy", "border": 1}))
wb.define_name("ListaMeses", f"='Parámetros'!$E$3:$E${2 + len(meses_lista)}")
wp.set_column("E:E", 18)
# límites
wp.write(11, 0, "Límites: personas de vacaciones a la vez", F["sub"])
wp.write(12, 0, "Grupo", F["cab"]); wp.write(12, 1, "Límite", F["cab"]); wp.write(12, 2, "Departamento", F["cab"])
wp.write(12, 3, "Delegación", F["cab"]); wp.write(12, 4, "Regla", F["cab"])
wp.write(18, 0, "Porcentaje máximo de Almacén a la vez", F["cel"])
wp.write_number(18, 1, 0.25, wb.add_format({"border": 1, "bg_color": COL_ENTRADA, "locked": False, "num_format": "0%"}))
wb.define_name("PctAlmacen", "='Parámetros'!$B$19")
LIMITES = [("Administración", "Administración", "Todas", 2, "Fijo: 2 personas"),
           ("Comercial Zaragoza", "Comercial", "Zaragoza", 2, "Fijo: 2 personas"),
           ("Almacén Zaragoza", "Almacén", "Zaragoza", None, "25 % de su plantilla activa, hacia abajo (mínimo 1)"),
           ("Almacén Pamplona", "Almacén", "Pamplona", None, "25 % de su plantilla activa, hacia abajo (mínimo 1)"),
           ("Almacén Lleida", "Almacén", "Lleida", None, "25 % de su plantilla activa, hacia abajo (mínimo 1)")]
for i, (g, dep, dl, lim, regla) in enumerate(LIMITES, start=13):
    wp.write(i, 0, g, F["cel"])
    if lim is None:
        wp.write_formula(i, 1, f'=MAX(1,ROUNDDOWN(PctAlmacen*COUNTIFS(Emp_Dept,"{dep}",Emp_Deleg,"{dl}",Emp_Activo,"Sí"),0))', F["num"])
    else:
        wp.write_number(i, 1, lim, F["ent"])
    wp.write(i, 2, dep, F["cel"]); wp.write(i, 3, dl, F["cel"]); wp.write(i, 4, regla, F["cel"])
wp.write(20, 0, "Dirección y Comercial de Pamplona y Lleida: sin límite (aclaración de Lucía).", F["txt"])
# arrastres
wp.write(22, 0, "Arrastres de 2025 (días que se pueden disfrutar en 2026)", F["sub"])
wp.write(23, 0, "Código", F["cab"]); wp.write(23, 1, "Días", F["cab"]); wp.write(23, 2, "Motivo", F["cab"])
wp.write(24, 0, "E0031", F["ent"]); wp.write_number(24, 1, 6, F["ent"])
wp.write(24, 2, "Baja (IT) del 10/11/2025 al 16/01/2026: no pudo disfrutarlos (ET art. 38.3, hasta 18 meses)", F["cel"])
for r in range(25, 30):
    wp.write_blank(r, 0, None, F["ent"]); wp.write_blank(r, 1, None, F["ent"]); wp.write_blank(r, 2, None, F["cel"])
wb.define_name("Arr_Cod", "='Parámetros'!$A$25:$A$30")
wb.define_name("Arr_Dias", "='Parámetros'!$B$25:$B$30")
wp.protect("", {"select_locked_cells": True, "select_unlocked_cells": True})

hoja_festivos(wb, F)

# Empleados (valores del maestro limpio de RRHH, contrato vigente en 2026)
we = wb.add_worksheet("Empleados")
cab = ["Código", "Nombre", "Apellidos", "Nombre completo", "Abreviado", "Departamento", "Delegación", "Alta",
       "Baja", "DelegN", "En plantilla a corte"]
N_EMP = 80
we.add_table(0, 0, N_EMP, len(cab) - 1, {"name": "Empleados", "style": "Table Style Light 9",
                                          "columns": [{"header": h} for h in cab]})
emp_ord = emp.copy()
emp_ord["o"] = emp_ord["Departamento"].map(ORDEN_DEP.index)
emp_ord = emp_ord.sort_values(["Cod"])
for i in range(N_EMP):
    r = i + 1
    x = r + 1
    if i < len(emp_ord):
        e = emp_ord.iloc[i]
        we.write_string(r, 0, e["Cod"], F["ent"])
        we.write_string(r, 1, e["Nombre"], F["ent"])
        we.write_string(r, 2, e["Apellidos"], F["ent"])
        we.write_string(r, 5, e["Departamento"], F["ent"])
        we.write_string(r, 6, e["Deleg"], F["ent"])
        we.write_datetime(r, 7, dt.datetime(e["Alta"].year, e["Alta"].month, e["Alta"].day), F["ent_f"])
        if e["Baja"]:
            we.write_datetime(r, 8, dt.datetime(e["Baja"].year, e["Baja"].month, e["Baja"].day), F["ent_f"])
        else:
            we.write_blank(r, 8, None, F["ent_f"])
    else:
        for j in (0, 1, 2, 5, 6):
            we.write_blank(r, j, None, F["ent"])
        we.write_blank(r, 7, None, F["ent_f"]); we.write_blank(r, 8, None, F["ent_f"])
    we.write_formula(r, 3, f'=IF($A{x}="","",B{x}&" "&C{x})', F["cel"])
    we.write_formula(r, 4, f'=IF($A{x}="","",B{x}&" "&LEFT(C{x},1)&".")', F["cel"])
    we.write_formula(r, 9, f'=IF($A{x}="","",MATCH(G{x},{DELEG_N},0))', F["cel"])
    we.write_formula(r, 10, f'=IF($A{x}="","",IF(AND(H{x}<=FechaCorte,OR(I{x}="",I{x}>FechaCorte)),"Sí","No"))', F["cel"])
for nombre, col in (("Emp_Cod", "A"), ("Emp_Nombre", "D"), ("Emp_Abrev", "E"), ("Emp_Dept", "F"), ("Emp_Deleg", "G"),
                    ("Emp_Alta", "H"), ("Emp_Baja", "I"), ("Emp_DelegN", "J"), ("Emp_Activo", "K")):
    wb.define_name(nombre, f"=Empleados!${col}$2:${col}${N_EMP + 1}")
we.data_validation(1, 5, N_EMP, 5, {"validate": "list", "source": ORDEN_DEP})
we.data_validation(1, 6, N_EMP, 6, {"validate": "list", "source": ["Zaragoza", "Pamplona", "Lleida"]})
we.set_column("A:A", 9); we.set_column("B:B", 12); we.set_column("C:C", 22); we.set_column("D:D", 30)
we.set_column("E:E", 14); we.set_column("F:G", 15); we.set_column("H:I", 11); we.set_column("J:J", 7, None, {"hidden": True})
we.set_column("K:K", 12)
we.freeze_panes(1, 1)
we.write(N_EMP + 2, 0, "Alta = alta del contrato vigente en 2026. E0047 volvió el 04/05/2026: su primer contrato "
                       "(01/02/2024-28/02/2026) se liquidó en su finiquito y no cuenta aquí.", F["txt"])

# Periodos
wv = wb.add_worksheet("Periodos")
cab = ["Código", "Tipo", "Desde", "Hasta", "Origen y notas", "Nombre", "Departamento", "Delegación", "DelegN",
       "Días laborables", "Días del año", "Días del año siguiente", "Disfrutados (hasta el corte)", "Comprobación",
       "Días en el mes del cuadrante", "En plantilla"]
N_PER = 300
wv.add_table(0, 0, N_PER, len(cab) - 1, {"name": "Periodos", "style": "Table Style Light 9",
                                          "columns": [{"header": h} for h in cab]})
HOL = "CHOOSE($I{x},FestZGZ,FestPAM,FestLLE)"
for i in range(N_PER):
    r, x = i + 1, i + 2
    if i < len(periodos):
        p = periodos[i]
        wv.write_string(r, 0, p["cod"], F["ent"])
        wv.write_string(r, 1, p["tipo"], F["ent"])
        wv.write_datetime(r, 2, dt.datetime(p["desde"].year, p["desde"].month, p["desde"].day), F["ent_f"])
        wv.write_datetime(r, 3, dt.datetime(p["hasta"].year, p["hasta"].month, p["hasta"].day), F["ent_f"])
        wv.write_string(r, 4, p["origen"], F["ent"])
    else:
        wv.write_blank(r, 0, None, F["ent"]); wv.write_blank(r, 1, None, F["ent"])
        wv.write_blank(r, 2, None, F["ent_f"]); wv.write_blank(r, 3, None, F["ent_f"]); wv.write_blank(r, 4, None, F["ent"])
    h = HOL.format(x=x)
    wv.write_formula(r, 5, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Nombre,MATCH($A{x},Emp_Cod,0)),"SIN PAREJA"))', F["cel"])
    wv.write_formula(r, 6, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Dept,MATCH($A{x},Emp_Cod,0)),""))', F["cel"])
    wv.write_formula(r, 7, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Deleg,MATCH($A{x},Emp_Cod,0)),""))', F["cel"])
    wv.write_formula(r, 8, f'=IF($A{x}="","",IFERROR(INDEX(Emp_DelegN,MATCH($A{x},Emp_Cod,0)),1))', F["cel"])
    wv.write_formula(r, 9, f'=IF($A{x}="","",NETWORKDAYS.INTL(C{x},D{x},1,{h}))', F["num"])
    wv.write_formula(r, 10, f'=IF($A{x}="","",MAX(0,NETWORKDAYS.INTL(MAX(C{x},InicioAnio),MIN(D{x},FinAnio),1,{h})))', F["num"])
    wv.write_formula(r, 11, f'=IF($A{x}="","",J{x}-K{x})', F["num"])
    wv.write_formula(r, 12, f'=IF($A{x}="","",MAX(0,NETWORKDAYS.INTL(MAX(C{x},InicioAnio),MIN(D{x},FechaCorte),1,{h})))', F["num"])
    wv.write_formula(r, 13, f'=IF($A{x}="","",IF(F{x}="SIN PAREJA","Código sin pareja",IF(D{x}<C{x},"Hasta < Desde",'
                            f'IF(OR(C{x}<InicioAnio,D{x}>DATE(Anio+1,12,31)),"Fuera de "&Anio&"-"&(Anio+1),'
                            f'IF(COUNTIFS($A$2:$A${N_PER + 1},$A{x},$C$2:$C${N_PER + 1},"<="&$D{x},$D$2:$D${N_PER + 1},">="&$C{x})>1,'
                            f'"Solapa con otro periodo","OK")))))', F["cel"])
    wv.write_formula(r, 14, f'=IF($A{x}="","",IF(B{x}<>"Vacaciones",0,MAX(0,NETWORKDAYS.INTL(MAX(C{x},MesCuadrante),'
                            f'MIN(D{x},EOMONTH(MesCuadrante,0)),1,{h}))))', F["num"])
    wv.write_formula(r, 15, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Activo,MATCH($A{x},Emp_Cod,0)),""))', F["cel"])
for nombre, col in (("P_Cod", "A"), ("P_Tipo", "B"), ("P_Desde", "C"), ("P_Hasta", "D"), ("P_Dept", "G"),
                    ("P_Dias", "J"), ("P_DiasAnio", "K"), ("P_DiasSig", "L"), ("P_Disfr", "M"), ("P_Comp", "N"),
                    ("P_DiasMes", "O"), ("P_Activo", "P")):
    wb.define_name(nombre, f"=Periodos!${col}$2:${col}${N_PER + 1}")
# Validación de datos (rangos normales: la validación no admite referencias estructuradas)
wv.data_validation(1, 1, N_PER, 1, {"validate": "list", "source": ["Vacaciones", "Asuntos propios"],
                                     "error_title": "Tipo", "error_message": "Elige Vacaciones o Asuntos propios."})
wv.data_validation(1, 0, N_PER, 0, {"validate": "list", "source": "=Emp_Cod",
                                     "error_title": "Código", "error_message": "Ese código no está en Empleados."})
wv.data_validation(1, 2, N_PER, 2, {"validate": "custom", "value": "=AND(C2>=DATE(Anio,1,1),C2<=DATE(Anio+1,12,31))",
                                     "error_title": "Desde", "error_message": "La fecha tiene que estar dentro del año y el siguiente."})
wv.data_validation(1, 3, N_PER, 3, {"validate": "custom",
                                     "value": f"=AND(D2>=C2,D2<=DATE(Anio+1,12,31),COUNTIFS($A$2:$A${N_PER + 1},$A2,"
                                              f"$C$2:$C${N_PER + 1},\"<=\"&$D2,$D$2:$D${N_PER + 1},\">=\"&$C2)=1)",
                                     "error_title": "Hasta",
                                     "error_message": "Hasta tiene que ser igual o posterior a Desde, dentro de los dos años, y sin solaparse con otro periodo de la misma persona."})
wv.conditional_format(1, 13, N_PER, 13, {"type": "formula", "criteria": '=AND($A2<>"",$N2<>"OK")', "format": F["rojo"]})
wv.set_column("A:A", 9); wv.set_column("B:B", 15); wv.set_column("C:D", 11); wv.set_column("E:E", 44)
wv.set_column("F:F", 26); wv.set_column("G:H", 14); wv.set_column("I:I", 6, None, {"hidden": True})
wv.set_column("J:M", 11); wv.set_column("N:N", 20); wv.set_column("O:P", 11)
wv.freeze_panes(1, 1)
wv.protect("", {"autofilter": True, "sort": True, "select_locked_cells": True, "select_unlocked_cells": True})

# Saldos (una fila por fila de Empleados: si entra alguien, aparece solo)
ws_ = wb.add_worksheet("Saldos")
cab = ["Código", "Nombre", "Departamento", "Delegación", "Alta", "Baja", "En plantilla", "Días de alta en el año",
       "Derecho", "Arrastre", "Disfrutados", "Planificados", "Saldo", "Aviso"]
ws_.add_table(0, 0, N_EMP, len(cab) - 1, {"name": "Saldos", "style": "Table Style Light 9",
                                           "columns": [{"header": h} for h in cab]})
for i in range(N_EMP):
    r, x = i + 1, i + 2
    ws_.write_formula(r, 0, f'=IF(Empleados!A{x}="","",Empleados!A{x})', F["cel"])
    ws_.write_formula(r, 1, f'=IF($A{x}="","",Empleados!D{x})', F["cel"])
    ws_.write_formula(r, 2, f'=IF($A{x}="","",Empleados!F{x})', F["cel"])
    ws_.write_formula(r, 3, f'=IF($A{x}="","",Empleados!G{x})', F["cel"])
    ws_.write_formula(r, 4, f'=IF($A{x}="","",Empleados!H{x})', F["fec"])
    ws_.write_formula(r, 5, f'=IF(OR($A{x}="",Empleados!I{x}=""),"",Empleados!I{x})', F["fec"])
    ws_.write_formula(r, 6, f'=IF($A{x}="","",Empleados!K{x})', F["cel"])
    ws_.write_formula(r, 7, f'=IF($A{x}="","",MAX(0,MIN(IF(F{x}="",FinAnio,F{x}),FinAnio)-MAX(E{x},InicioAnio)+1))', F["num"])
    ws_.write_formula(r, 8, f'=IF($A{x}="","",CEILING(DiasConvenio*H{x}/DiasAnio,Redondeo))', F["num1"])
    ws_.write_formula(r, 9, f'=IF($A{x}="","",SUMIFS(Arr_Dias,Arr_Cod,$A{x}))', F["num1"])
    ws_.write_formula(r, 10, f'=IF($A{x}="","",SUMIFS(P_Disfr,P_Cod,$A{x},P_Tipo,"Vacaciones"))', F["num1"])
    ws_.write_formula(r, 11, f'=IF($A{x}="","",SUMIFS(P_DiasAnio,P_Cod,$A{x},P_Tipo,"Vacaciones")-K{x})', F["num1"])
    ws_.write_formula(r, 12, f'=IF($A{x}="","",I{x}+J{x}-K{x}-L{x})', F["num1"])
    ws_.write_formula(r, 13, f'=IF($A{x}="","",IF(G{x}="No","Baja: se liquidó en el finiquito",IF(M{x}<0,"Saldo negativo: revisar",'
                             f'IF(M{x}>5,"Le quedan más de 5 días",""))))', F["cel"])
ws_.conditional_format(1, 12, N_EMP, 12, {"type": "formula", "criteria": '=AND($A2<>"",$M2<0)', "format": F["rojo"]})
ws_.conditional_format(1, 12, N_EMP, 12, {"type": "formula", "criteria": '=AND($A2<>"",$G2="Sí",$M2>5)', "format": F["ambar"]})
for nombre, col in (("S_Derecho", "I"), ("S_Saldo", "M"), ("S_Activo", "G"), ("S_Disfr", "K"), ("S_Plan", "L")):
    wb.define_name(nombre, f"=Saldos!${col}$2:${col}${N_EMP + 1}")
ws_.set_column("A:A", 9); ws_.set_column("B:B", 30); ws_.set_column("C:D", 14); ws_.set_column("E:F", 11)
ws_.set_column("G:M", 11); ws_.set_column("N:N", 30)
ws_.freeze_panes(1, 2)
ws_.protect("", {"autofilter": True, "sort": True, "select_locked_cells": True, "select_unlocked_cells": True})

# Cuadrante
wq = wb.add_worksheet("Cuadrante")
wq.write(0, 0, "Cuadrante de vacaciones", F["tit"])
wq.write(1, 0, "Mes:", F["neg"])
wq.write_datetime(1, 1, dt.datetime(2026, 11, 1), F["ent_m"])
wb.define_name("MesCuadrante", "=Cuadrante!$B$2")
wq.data_validation(1, 1, 1, 1, {"validate": "list", "source": "=ListaMeses"})
wq.write(1, 3, "V = vacaciones · F = festivo de su delegación · gris = fin de semana", F["txt"])
for j, h in enumerate(["Código", "Nombre", "Departamento", "Delegación", "n"]):
    wq.write(3, j, h, F["cab"]); wq.write_blank(4, j, None, F["cab"])
C0, NDIAS = 5, 31
cols = [xlsxwriter.utility.xl_col_to_name(C0 + k) for k in range(NDIAS)]
f_dia = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "num_format": "dd", "align": "center"})
f_sem = wb.add_format({"bg_color": "#D9E1F2", "border": 1, "align": "center", "font_size": 9})
f_v = wb.add_format({"border": 1, "border_color": "#BFBFBF", "align": "center"})
for k, c in enumerate(cols):
    if k == 0:
        wq.write_formula(3, C0, "=MesCuadrante", f_dia)
    else:
        p = cols[k - 1]
        wq.write_formula(3, C0 + k, f'=IF({p}4="","",IF({p}4+1>EOMONTH(MesCuadrante,0),"",{p}4+1))', f_dia)
    wq.write_formula(4, C0 + k, f'=IF({c}4="","",MID("LMXJVSD",WEEKDAY({c}4,2),1))', f_sem)
act = emp[emp["Activo"]].copy()
act["o"] = act["Departamento"].map(ORDEN_DEP.index)
act["od"] = act["Deleg"].map(["Zaragoza", "Pamplona", "Lleida"].index)
act = act.sort_values(["o", "od", "Apellidos", "Nombre"])
F0 = 5  # primera fila de personas (índice 0)
N_Q = 60  # sitio para 60 personas
for i in range(N_Q):
    r, x = F0 + i, F0 + i + 1
    if i < len(act):
        wq.write_string(r, 0, act.iloc[i]["Cod"], F["ent"])
    else:
        wq.write_blank(r, 0, None, F["ent"])
    wq.write_formula(r, 1, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Nombre,MATCH($A{x},Emp_Cod,0)),"?"))', F["cel"])
    wq.write_formula(r, 2, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Dept,MATCH($A{x},Emp_Cod,0)),""))', F["cel"])
    wq.write_formula(r, 3, f'=IF($A{x}="","",IFERROR(INDEX(Emp_Deleg,MATCH($A{x},Emp_Cod,0)),""))', F["cel"])
    wq.write_formula(r, 4, f'=IF($A{x}="","",IFERROR(INDEX(Emp_DelegN,MATCH($A{x},Emp_Cod,0)),1))', F["cel"])
    for c in cols:
        wq.write_formula(r, C0 + cols.index(c),
                         f'=IF(OR($A{x}="",{c}$4=""),"",IF(WEEKDAY({c}$4,2)>5,"",'
                         f'IF(COUNTIF(CHOOSE($E{x},FestZGZ,FestPAM,FestLLE),{c}$4)>0,"F",'
                         f'IF(COUNTIFS(P_Cod,$A{x},P_Tipo,"Vacaciones",P_Desde,"<="&{c}$4,P_Hasta,">="&{c}$4)>0,"V",""))))', f_v)
UF = F0 + N_Q  # última fila de personas (1-indexada) = 65
rng = f"{cols[0]}{F0 + 1}:{cols[-1]}{UF}"
wq.conditional_format(rng, {"type": "formula", "criteria": f'=AND({cols[0]}$4<>"",WEEKDAY({cols[0]}$4,2)>5)', "format": F["gris"]})
wq.conditional_format(rng, {"type": "cell", "criteria": "==", "value": '"V"', "format": F["verde"]})
wq.conditional_format(rng, {"type": "cell", "criteria": "==", "value": '"F"', "format": F["fest"]})
# Alertas
ra = UF + 1  # índice 0 de la fila del título de alertas
wq.write(ra, 0, "Alertas: personas de vacaciones a la vez (en rojo si superan el límite)", F["sub"])
wq.write(ra + 1, 0, "Grupo", F["cab"]); wq.write(ra + 1, 1, "Departamento", F["cab"]); wq.write(ra + 1, 2, "Delegación", F["cab"])
wq.write(ra + 1, 3, "Límite", F["cab"]); wq.write(ra + 1, 4, "Días", F["cab"])
for k, (g, dep, dl, _, _) in enumerate(LIMITES):
    r, x = ra + 2 + k, ra + 3 + k
    wq.write(r, 0, g, F["cel"]); wq.write(r, 1, dep, F["cel"]); wq.write(r, 2, dl, F["cel"])
    wq.write_formula(r, 3, f"='Parámetros'!B{14 + k}", F["num"])
    wq.write_formula(r, 4, f'=COUNTIF({cols[0]}{x}:{cols[-1]}{x},">"&D{x})', F["num"])
    for c in cols:
        crit_dl = '"*"' if dl == "Todas" else f'"{dl}"'
        wq.write_formula(r, C0 + cols.index(c), f'=IF({c}$4="","",COUNTIFS($C${F0 + 1}:$C${UF},"{dep}",$D${F0 + 1}:$D${UF},{crit_dl},'
                                                 f'{c}${F0 + 1}:{c}${UF},"V"))', f_v)
    wq.conditional_format(f"{cols[0]}{x}:{cols[-1]}{x}", {"type": "formula", "criteria": f'=AND({cols[0]}{x}<>"",{cols[0]}{x}>$D{x})',
                                                         "format": F["rojo"]})
    wq.conditional_format(f"E{x}", {"type": "cell", "criteria": ">", "value": 0, "format": F["rojo"]})
rc = ra + 2 + len(LIMITES) + 1
wq.write(rc, 0, "Comprobación del mes", F["sub"])
wq.write(rc + 1, 0, "«V» en el cuadrante", F["cel"]); wq.write_formula(rc + 1, 1, f'=COUNTIF({rng},"V")', F["num"])
wq.write(rc + 2, 0, "Días de Periodos en este mes", F["cel"]); wq.write_formula(rc + 2, 1, '=SUMIFS(P_DiasMes,P_Activo,"Sí")', F["num"])
wq.write(rc + 3, 0, "¿Cuadran?", F["neg"]); wq.write_formula(rc + 3, 1, f"=B{rc + 2}=B{rc + 3}", F["cel"])
wq.conditional_format(f"B{rc + 4}", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["verde"]})
wq.conditional_format(f"B{rc + 4}", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["rojo"]})
wq.set_column("A:A", 8); wq.set_column("B:B", 28); wq.set_column("C:D", 13); wq.set_column("E:E", 4, None, {"hidden": True})
wq.set_column(C0, C0 + NDIAS - 1, 3.6)
wq.freeze_panes(F0, C0)
wq.set_landscape(); wq.set_paper(9); wq.fit_to_pages(1, 0); wq.repeat_rows(3, 4); wq.repeat_columns(0, 1)
wq.print_area(0, 0, rc + 3, C0 + NDIAS - 1)
wq.protect("", {"select_locked_cells": True, "select_unlocked_cells": True})
CUAD_RNG = rng

# Controles
wc = wb.add_worksheet("Controles")
wc.write(0, 0, "Controles", F["tit"])
ctrl_filas = [
    ("Personas en Empleados (58 según el maestro limpio de RRHH)", 58, "=COUNTA(Emp_Cod)", 0),
    ("Personas en plantilla a la fecha de corte (55)", 55, '=COUNTIF(Emp_Activo,"Sí")', 0),
    ("Suma de la plantilla por departamento = total en plantilla", '=COUNTIF(Emp_Activo,"Sí")',
     '=COUNTIFS(Emp_Dept,"Dirección",Emp_Activo,"Sí")+COUNTIFS(Emp_Dept,"Administración",Emp_Activo,"Sí")'
     '+COUNTIFS(Emp_Dept,"Comercial",Emp_Activo,"Sí")+COUNTIFS(Emp_Dept,"Almacén",Emp_Activo,"Sí")', 0),
    ("Personas del cuadrante = plantilla activa", '=COUNTIF(Emp_Activo,"Sí")', f"=COUNTA(Cuadrante!A{F0 + 1}:A{UF})", 0),
    ("Periodos con errores (Hasta < Desde, fuera de rango, solape o código sin pareja)", 0,
     '=COUNTIFS(P_Cod,"<>",P_Comp,"<>OK")', 0),
    (f"Cuadrícula de Administración: «V» contadas en el origen ({CTRL['admin_v']}) = días de Administración en Periodos",
     CTRL["admin_v"], '=SUMIFS(P_DiasAnio,P_Dept,"Administración",P_Tipo,"Vacaciones")', 0),
    ("Días de vacaciones del año en Periodos = disfrutados + planificados en Saldos",
     '=SUMIFS(P_DiasAnio,P_Tipo,"Vacaciones")', "=SUM(S_Disfr)+SUM(S_Plan)", 0),
    ("Saldos negativos", 0, '=COUNTIFS(S_Saldo,"<0")', 0),
    ("Cuadrante del mes: «V» = días de Periodos de ese mes", f"=Cuadrante!B{rc + 3}", f"=Cuadrante!B{rc + 2}", 0),
    ("Festivos del año en Zaragoza (14)", 14, '=COUNTIFS(FestZGZ,">="&InicioAnio,FestZGZ,"<="&FinAnio)', 0),
    ("Festivos del año en Pamplona (14: 13 forales + 1 local)", 14, '=COUNTIFS(FestPAM,">="&InicioAnio,FestPAM,"<="&FinAnio)', 0),
    ("Festivos del año en Lleida (14)", 14, '=COUNTIFS(FestLLE,">="&InicioAnio,FestLLE,"<="&FinAnio)', 0),
]
ult = tabla_controles(wb, F, wc, ctrl_filas)
wc.write(ult + 2, 1, "Cifras para el correo (plantilla en activo a la fecha de corte)", F["sub"])
resumen = [("Días de vacaciones de 2026 (toda la empresa, disfrutados y planificados)", '=SUMIFS(P_DiasAnio,P_Tipo,"Vacaciones")'),
           ("Derecho de 2026 de la plantilla activa", '=SUMIFS(S_Derecho,S_Activo,"Sí")'),
           ("Saldo pendiente a 31/12 de la plantilla activa", '=SUMIFS(S_Saldo,S_Activo,"Sí")'),
           ("Personas con más de 5 días pendientes", '=COUNTIFS(S_Activo,"Sí",S_Saldo,">5")'),
           ("Días con algún grupo por encima de su límite en el mes elegido en el cuadrante (suma de los grupos)",
            f"=SUM(Cuadrante!E{ra + 3}:E{ra + 2 + len(LIMITES)})")]
for k, (t, fml) in enumerate(resumen):
    wc.write(ult + 3 + k, 1, t, F["celw"]); wc.write_formula(ult + 3 + k, 3, fml, F["num1"])
RES_FILA = ult + 3  # índice 0 de la primera cifra
wc.protect("", {"select_locked_cells": True, "select_unlocked_cells": True})

# Calidad de datos (hojas de vacaciones y festivos)
wk = wb.add_worksheet("Calidad de datos")
wk.write(0, 0, "Calidad de datos · hojas de vacaciones y festivos", F["tit"])
for j, h in enumerate(["Hoja de origen", "Problema", "Filas afectadas", "Decisión"]):
    wk.write(2, j, h, F["cab"])
cal = [
    ("Vac_Administracion", "Formato ancho: una columna por día con «V»", 10, f"Transcrito a Periodos (un periodo por cada racha de «V»). Comprobado: {CTRL['admin_v']} «V» = {CTRL['admin_v']} días en Periodos."),
    ("Vac_Administracion", "«Paco Gil» no está así en nóminas", 1, "Es Francisco Gil Bielsa (E0006), jubilado el 15/06/2026."),
    ("Vac_Comercial", "Nombres abreviados sin código («Ana G.»)", len(com), "Código buscado con el nombre abreviado del maestro (es único)."),
    ("Vac_Comercial", "Días calculados a mano que no cuadran", 6, "Se ignora la columna Días: se recalcula con DIAS.LAB.INTL. Anotado en «Origen y notas»."),
    ("Vac_Comercial", "Hasta anterior a Desde", 1, "Fechas cruzadas al teclear (confirmado con Lucía): se intercambian."),
    ("Vac_Comercial / Vac_Almacen", "Tipo en 4 grafías (Vac., vacaciones, V, AP)", len(com) + sum(1 for x in periodos if x["origen"].startswith("Vac_Almacen")), "Vac., vacaciones y V = Vacaciones; AP = Asuntos propios (no descuentan)."),
    ("Vac_Almacen", "Filas de subtotal «Total …: n» entre los datos", 7, "Quitadas antes de sumar (si no, se cuentan dos veces)."),
    ("Vac_Almacen", "Título y nombres en celdas combinadas", sum(1 for x in periodos if x["origen"].startswith("Vac_Almacen")), "Separar celdas y rellenar el nombre hacia abajo."),
    ("Vac_Almacen", "Año 2062 en un Hasta", 1, "Error al teclear: 2026 (confirmado con Lucía)."),
    ("Vac_Direccion", "Periodos en texto libre", 4, "Transcritos a mano a 10 periodos; el de Javier cruza a 2027 (8 días en 2026 y 4 en 2027)."),
    ("Festivos_gestoria", "Sant Miquel (Lleida) con fecha 29/10/2026", 1, "Corregido a 29/09/2026."),
    ("Festivos_gestoria", "Falta el 07/12/2026 en Aragón", 1, "Añadido (BOE-A-2025-21667). Afecta al puente de diciembre en Zaragoza."),
]
for i, fila in enumerate(cal, start=3):
    for j, v in enumerate(fila):
        if isinstance(v, int):
            wk.write_number(i, j, v, F["cel"])
        else:
            wk.write_string(i, j, v, F["celw"])
wk.set_column("A:A", 24); wk.set_column("B:B", 46); wk.set_column("C:C", 10); wk.set_column("D:D", 80)

hoja_texto(wb, F, "Cómo se hizo", "Cómo se hizo (lo que no se ve en las fórmulas)", [
    ("sub", "Pasar los cuatro Excel de los responsables a Periodos"),
    ("txt", "Administración: cada racha de «V» seguidas (saltando fines de semana y festivos) es un periodo: Desde = primera «V», "
            "Hasta = última. Comprobación: CONTAR.SI(fila;\"V\") de cada persona = suma de sus días laborables en Periodos."),
    ("txt", "Comercial: Nombre abreviado → código con BUSCARX sobre la columna Abreviado de Empleados. Fechas cruzadas: intercambiar. "
            "La columna Días no se copia: los días los calcula DIAS.LAB.INTL."),
    ("txt", "Almacén: Inicio > Combinar y centrar > Separar celdas; seleccionar la columna, Inicio > Buscar y seleccionar > "
            "Ir a Especial > Celdas en blanco, escribir = y la flecha arriba, y Ctrl+Intro; quitar las filas «Total …»."),
    ("txt", "Dirección: leer el texto y escribir una fila por periodo."),
    ("sub", "Días laborables con los festivos de cada delegación"),
    ("txt", "Festivos tiene una columna por delegación (ZGZ, PAM, LLE) con la fecha si el festivo vale allí y 0 si no. "
            "DIAS.LAB.INTL(Desde;Hasta;1;ELEGIR(n;FestZGZ;FestPAM;FestLLE)) usa la de cada persona. En Microsoft 365 también vale "
            "FILTRAR(Festivos[Fecha];(Festivos[Delegación]=delegación)+(Festivos[Delegación]=\"Todas\"))."),
    ("sub", "Validación y protección"),
    ("txt", "Periodos: Datos > Herramientas de datos > Validación de datos, con fórmulas sobre rangos normales ($A$2:$A$301), "
            "porque la validación no acepta referencias estructuradas. Desde dentro de 2026-2027; Hasta ≥ Desde y sin solape."),
    ("txt", "Columnas de entrada desbloqueadas (Formato de celdas > Proteger > quitar Bloqueada) y Revisar > Proteger hoja, sin "
            "contraseña, permitiendo ordenar y usar Autofiltro. Como la Tabla no crece en una hoja protegida, va dimensionada "
            "con 300 filas."),
    ("sub", "Cuadrante"),
    ("txt", "Fila de fechas: la primera es el mes elegido y cada una suma 1 hasta fin de mes (vale en cualquier versión). En "
            "Microsoft 365: =SECUENCIA(1;DIA(FIN.MES(B2;0));B2)."),
    ("txt", "Formato condicional: fines de semana en gris (DIASEM(fecha;2)>5), «V» en verde con la letra visible y «F» en azul. "
            "Alertas: CONTAR.SI.CONJUNTO por departamento y delegación; en rojo si superan el límite de Parámetros."),
    ("txt", "Imprimir: Disposición de página (o Diseño de página) > Imprimir títulos: filas 4-5 y columnas A-B; horizontal, 1 página de ancho."),
])
wb.close()

# ======================================================================================
# 4. LIBRO SOLO RRHH: p2-solucion-rrhh.xlsx («Absentismo_2026_RRHH»)
# ======================================================================================
wb = xlsxwriter.Workbook(os.path.join(LIBROS, "p2-solucion-rrhh.xlsx"))
wb.set_properties({"title": "Absentismo_2026_RRHH (solución P2)", "author": "Hoja a hoja",
                   "comments": "Solo RRHH: contiene bajas (datos de salud) y NIF."})
F = formatos(wb)
hoja_texto(wb, F, "Léame", "Absentismo_2026_RRHH · Léame · SOLO RRHH", [
    ("aviso", "Archivo solo para RRHH, en su carpeta con permisos. Contiene bajas por enfermedad y accidente (datos de salud, "
              "RGPD art. 9.1) y NIF. Las observaciones con diagnósticos de la exportación NO se han copiado (minimización, art. 5.1.c)."),
    ("sub", "Qué hace"),
    ("txt", "1. Limpia la exportación de nóminas (hoja Nomina_origen, intacta) en la hoja Empleados: códigos, nombres, "
            "departamentos (tabla Equivalencias), delegaciones, fechas en tres formatos, jornada; marca el total y los duplicados."),
    ("txt", "2. Ausencias: el listado de 2026 sin la columna Observaciones; Hasta vacía = baja abierta, se cuenta hasta el corte."),
    ("txt", "3. IT_mes y Teorico: días laborables de IT de cada ausencia en cada mes, y días laborables teóricos de cada contrato "
            "en alta el día 15 de cada mes, con los festivos de su delegación."),
    ("txt", "4. Absentismo: días de IT entre días teóricos, por departamento y mes (enero-octubre de 2026). La tasa de la empresa "
            "se calcula con los totales, no como media de las tasas. Es la hoja que se pasa a PDF para Carmen (sin nombres)."),
    ("txt", "5. Plantilla: personas y FTE a 31/10/2026, altas y bajas de 2026 (por contrato), plantilla media, rotación y antigüedad."),
    ("txt", "6. Permisos: la columna Revisar marca los permisos más largos que el ET art. 37.3 (no se corrigen: se consultan)."),
    ("txt", "Definición de absentismo (pactada con Lucía): solo IT por enfermedad común (IT_EC) y accidente de trabajo (IT_AT). "
            "Los permisos retribuidos y no retribuidos no son absentismo en este informe."),
    ("sub", "Cómo actualizar"),
    ("txt", "Pega la nueva exportación en Nomina_origen y las ausencias en Ausencias (columnas amarillas), y mira Controles."),
    ("sub", "Registro de cambios"),
    ("txt", "16/11/2026 · v01 · Primera versión con datos a 31/10/2026 · (tu nombre)."),
])
wp = hoja_parametros(wb, F)
wb.define_name("MesesIni", "=Teorico!$F$1:$O$1")
hoja_festivos(wb, F)

# Nomina_origen (intacta)
wn = wb.add_worksheet("Nomina_origen")
raw = pd.read_excel(os.path.join(LIBROS, "p2-datos.xlsx"), sheet_name="Nomina_export", dtype=str).fillna("")
for j, h in enumerate(raw.columns):
    wn.write_string(0, j, h, F["cab"])
for i, fila in enumerate(raw.itertuples(index=False), start=1):
    for j, v in enumerate(fila):
        if v != "":
            wn.write_string(i, j, v, F["cel"])
wn.set_column("A:A", 18); wn.set_column("B:B", 11); wn.set_column("C:C", 34); wn.set_column("D:D", 20)
wn.set_column("E:H", 11); wn.set_column("I:I", 28)
NR = len(raw)  # 62

# Equivalencias
wq_ = wb.add_worksheet("Equivalencias")
wq_.write(0, 0, "Departamento (como viene)", F["cab"]); wq_.write(0, 1, "Departamento", F["cab"])
for i, (k, v) in enumerate(EQ_DEP.items(), start=1):
    wq_.write_string(i, 0, k, F["ent"]); wq_.write_string(i, 1, v, F["ent"])
for i in range(len(EQ_DEP) + 1, 21):
    wq_.write_blank(i, 0, None, F["ent"]); wq_.write_blank(i, 1, None, F["ent"])
wq_.write(0, 3, "Delegación (como viene)", F["cab"]); wq_.write(0, 4, "Delegación", F["cab"])
for i, (k, v) in enumerate(EQ_DEL.items(), start=1):
    wq_.write_string(i, 3, k, F["ent"]); wq_.write_string(i, 4, v, F["ent"])
for i in range(len(EQ_DEL) + 1, 11):
    wq_.write_blank(i, 3, None, F["ent"]); wq_.write_blank(i, 4, None, F["ent"])
wb.define_name("EqDep_Origen", "=Equivalencias!$A$2:$A$21"); wb.define_name("EqDep", "=Equivalencias!$B$2:$B$21")
wb.define_name("EqDel_Origen", "=Equivalencias!$D$2:$D$11"); wb.define_name("EqDel", "=Equivalencias!$E$2:$E$11")
wq_.write(22, 0, "Se compara con ESPACIOS(…) y sin distinguir mayúsculas: «ALMACÉN » encuentra «Almacén». "
                 "«almacen» (sin tilde) necesita su propia fila.", F["txt"])
wq_.set_column("A:B", 24); wq_.set_column("D:E", 22)

# Empleados (limpieza fila a fila de Nomina_origen)
we = wb.add_worksheet("Empleados")
cab = ["Código", "NIF", "Apellidos", "Nombre", "Departamento", "Delegación", "Alta", "Baja", "Jornada", "Puesto",
       "Clave de la fila", "Duplicado exacto", "Incluir", "Persona nueva (NIF)", "Fechas", "DelegN", "En plantilla a corte",
       "Antigüedad (años)"]
N_EM = 100
we.add_table(0, 0, N_EM, len(cab) - 1, {"name": "EmpleadosRRHH", "style": "Table Style Light 9",
                                         "columns": [{"header": h} for h in cab]})


def f_fecha(ref):
    return (f'IF(MID({ref},5,1)="-",DATE(VALUE(LEFT({ref},4)),VALUE(MID({ref},6,2)),VALUE(RIGHT({ref},2))),'
            f'IF(LEN({ref})=8,DATE(2000+VALUE(RIGHT({ref},2)),VALUE(MID({ref},4,2)),VALUE(LEFT({ref},2))),'
            f'DATE(VALUE(RIGHT({ref},4)),VALUE(MID({ref},4,2)),VALUE(LEFT({ref},2)))))')


for i in range(N_EM):
    r, x = i + 1, i + 2
    o = f"Nomina_origen!$A{x}"
    oc = lambda col: f"Nomina_origen!${col}{x}"
    we.write_formula(r, 0, f'=IF(OR({o}="",LEFT({o},5)="Total"),"",IFERROR("E"&TEXT(VALUE(SUBSTITUTE({o},"E","")),"0000"),"REVISAR"))', F["cel"])
    we.write_formula(r, 1, f'=IF($A{x}="","",TRIM({oc("B")}))', F["cel"])
    we.write_formula(r, 2, f'=IF($A{x}="","",PROPER(TRIM(LEFT({oc("C")},FIND(",",{oc("C")})-1))))', F["cel"])
    we.write_formula(r, 3, f'=IF($A{x}="","",PROPER(TRIM(MID({oc("C")},FIND(",",{oc("C")})+1,100))))', F["cel"])
    we.write_formula(r, 4, f'=IF($A{x}="","",IFERROR(INDEX(EqDep,MATCH(TRIM({oc("D")}),EqDep_Origen,0)),"SIN EQUIVALENCIA"))', F["cel"])
    we.write_formula(r, 5, f'=IF($A{x}="","",IFERROR(INDEX(EqDel,MATCH(TRIM({oc("E")}),EqDel_Origen,0)),"SIN EQUIVALENCIA"))', F["cel"])
    we.write_formula(r, 6, f'=IF($A{x}="","",{f_fecha(oc("F"))})', F["fec"])
    we.write_formula(r, 7, f'=IF(OR($A{x}="",{oc("G")}=""),"",{f_fecha(oc("G"))})', F["fec"])
    we.write_formula(r, 8, f'=IF($A{x}="","",IF(RIGHT({oc("H")},1)="%",_xlfn.NUMBERVALUE(LEFT({oc("H")},LEN({oc("H")})-1),",")/100,'
                           f'IF(_xlfn.NUMBERVALUE({oc("H")},",")>1,_xlfn.NUMBERVALUE({oc("H")},",")/100,_xlfn.NUMBERVALUE({oc("H")},","))))', F["num2"])
    we.write_formula(r, 9, f'=IF($A{x}="","",TRIM({oc("I")}))', F["cel"])
    we.write_formula(r, 10, f'=IF({o}="","",{oc("A")}&"|"&{oc("B")}&"|"&{oc("C")}&"|"&{oc("D")}&"|"&{oc("E")}&"|"&{oc("F")}&"|"&{oc("G")}&"|"&{oc("H")}&"|"&{oc("I")})', F["cel"])
    we.write_formula(r, 11, f'=IF($A{x}="",0,IF(COUNTIF(K$2:K{x},K{x})>1,1,0))', F["num"])
    we.write_formula(r, 12, f'=IF(OR($A{x}="",L{x}=1),0,1)', F["num"])
    we.write_formula(r, 13, f'=IF(M{x}=0,0,IF(COUNTIFS(B$2:B{x},B{x},M$2:M{x},1)=1,1,0))', F["num"])
    we.write_formula(r, 14, f'=IF(M{x}=0,"",IF(AND(ISNUMBER(G{x}),OR(H{x}="",ISNUMBER(H{x}))),"OK","Revisar fecha"))', F["cel"])
    we.write_formula(r, 15, f'=IF($A{x}="","",MATCH(F{x},{DELEG_N},0))', F["num"])
    we.write_formula(r, 16, f'=IF(M{x}=0,"",IF(AND(G{x}<=FechaCorte,OR(H{x}="",H{x}>FechaCorte)),"Sí","No"))', F["cel"])
    we.write_formula(r, 17, f'=IF(Q{x}="Sí",DATEDIF(G{x},FechaCorte,"Y"),"")', F["num"])
for nombre, col in (("R_Cod", "A"), ("R_NIF", "B"), ("R_Dept", "E"), ("R_Deleg", "F"), ("R_Alta", "G"), ("R_Baja", "H"),
                    ("R_Jornada", "I"), ("R_Dup", "L"), ("R_Incl", "M"), ("R_Nueva", "N"), ("R_Fechas", "O"),
                    ("R_DelegN", "P"), ("R_Activo", "Q"), ("R_Antig", "R")):
    wb.define_name(nombre, f"=Empleados!${col}$2:${col}${N_EM + 1}")
we.set_column("A:B", 10); we.set_column("C:C", 20); we.set_column("D:D", 12); we.set_column("E:F", 14)
we.set_column("G:H", 11); we.set_column("I:I", 8); we.set_column("J:J", 24); we.set_column("K:K", 30, None, {"hidden": True})
we.set_column("L:R", 10)
we.freeze_panes(1, 1)
we.write(N_EM + 2, 0, "Una fila por fila de Nomina_origen (misma fila). Incluir = 0 para la fila de total y los duplicados exactos. "
                      "E0047 tiene dos contratos (dos filas con Incluir = 1): no es un duplicado.", F["txt"])

# Teórico por contrato y mes
wt = wb.add_worksheet("Teorico")
wt.write(1, 0, "Código", F["cab"]); wt.write(1, 1, "Departamento", F["cab"]); wt.write(1, 2, "Delegación", F["cab"])
wt.write(1, 3, "DelegN", F["cab"]); wt.write(1, 4, "Incluir", F["cab"])
MCOL = [xlsxwriter.utility.xl_col_to_name(5 + k) for k in range(10)]
wt.write(0, 0, "Días laborables teóricos: contratos en alta el día 15 de cada mes × laborables del mes en su delegación", F["neg"])
for k, c in enumerate(MCOL):
    wt.write_formula(0, 5 + k, f"=DATE(Anio,{k + 1},1)", F["mes"])
    wt.write(1, 5 + k, MESES_ES[k][:3].capitalize(), F["cab"])
for i in range(N_EM):
    r, x, e = i + 2, i + 3, i + 2
    wt.write_formula(r, 0, f'=Empleados!A{e}&""', F["cel"])
    wt.write_formula(r, 1, f'=IF(Empleados!M{e}=1,Empleados!E{e},"")', F["cel"])
    wt.write_formula(r, 2, f'=IF(Empleados!M{e}=1,Empleados!F{e},"")', F["cel"])
    wt.write_formula(r, 3, f'=IF(Empleados!M{e}=1,Empleados!P{e},1)', F["cel"])
    wt.write_formula(r, 4, f'=Empleados!M{e}', F["cel"])
    for c in MCOL:
        wt.write_formula(r, MCOL.index(c) + 5,
                         f'=IF($E{x}<>1,0,IF(AND(Empleados!$G{e}<={c}$1+14,OR(Empleados!$H{e}="",Empleados!$H{e}>={c}$1+14)),'
                         f'NETWORKDAYS.INTL({c}$1,EOMONTH({c}$1,0),1,CHOOSE($D{x},FestZGZ,FestPAM,FestLLE)),0))', F["num"])
wt.set_column("A:E", 12); wt.set_column("F:O", 7)
wt.freeze_panes(2, 1)

# Ausencias (sin Observaciones)
wa = wb.add_worksheet("Ausencias")
cab = ["Código", "Tipo", "Desde", "Hasta", "Hasta efectiva", "Días naturales", "Departamento", "Delegación", "DelegN",
       "Es IT", "Máximo ET 37.3 (días)", "Revisar", "Abierta"]
N_AU = 200
wa.add_table(0, 0, N_AU, len(cab) - 1, {"name": "Ausencias", "style": "Table Style Light 9",
                                         "columns": [{"header": h} for h in cab]})
for i in range(N_AU):
    r, x = i + 1, i + 2
    if i < len(aus):
        a = aus.iloc[i]
        wa.write_string(r, 0, a["CodEmpleado"], F["ent"]); wa.write_string(r, 1, a["Tipo"], F["ent"])
        wa.write_datetime(r, 2, dt.datetime(a["Desde"].year, a["Desde"].month, a["Desde"].day), F["ent_f"])
        if a["Hasta"]:
            wa.write_datetime(r, 3, dt.datetime(a["Hasta"].year, a["Hasta"].month, a["Hasta"].day), F["ent_f"])
        else:
            wa.write_blank(r, 3, None, F["ent_f"])
    else:
        wa.write_blank(r, 0, None, F["ent"]); wa.write_blank(r, 1, None, F["ent"])
        wa.write_blank(r, 2, None, F["ent_f"]); wa.write_blank(r, 3, None, F["ent_f"])
    wa.write_formula(r, 4, f'=IF($A{x}="","",IF(D{x}="",FechaCorte,D{x}))', F["fec"])
    wa.write_formula(r, 5, f'=IF($A{x}="","",E{x}-C{x}+1)', F["num"])
    wa.write_formula(r, 6, f'=IF($A{x}="","",IFERROR(INDEX(R_Dept,MATCH($A{x},R_Cod,0)),"HUÉRFANO"))', F["cel"])
    wa.write_formula(r, 7, f'=IF($A{x}="","",IFERROR(INDEX(R_Deleg,MATCH($A{x},R_Cod,0)),""))', F["cel"])
    wa.write_formula(r, 8, f'=IF($A{x}="","",IFERROR(INDEX(R_DelegN,MATCH($A{x},R_Cod,0)),1))', F["cel"])
    wa.write_formula(r, 9, f'=IF($A{x}="","",IF(OR(B{x}="IT_EC",B{x}="IT_AT"),1,0))', F["num"])
    wa.write_formula(r, 10, f'=IF($A{x}="","",IF(B{x}="PR_MAT",15,IF(B{x}="PR_ENF",5,IF(B{x}="PR_FALL",4,IF(B{x}="PR_TRAS",1,"")))))', F["num"])
    wa.write_formula(r, 11, f'=IF(OR($A{x}="",K{x}=""),"",IF(F{x}>K{x},"Revisar: más días que el ET 37.3",""))', F["cel"])
    wa.write_formula(r, 12, f'=IF($A{x}="","",IF(D{x}="","Sí","No"))', F["cel"])
for nombre, col in (("A_Cod", "A"), ("A_Tipo", "B"), ("A_Dept", "G"), ("A_EsIT", "J"), ("A_Revisar", "L"), ("A_Abierta", "M")):
    wb.define_name(nombre, f"=Ausencias!${col}$2:${col}${N_AU + 1}")
wa.conditional_format(1, 11, N_AU, 11, {"type": "formula", "criteria": '=$L2<>""', "format": F["ambar"]})
wa.set_column("A:B", 10); wa.set_column("C:F", 12); wa.set_column("G:H", 14); wa.set_column("I:I", 6, None, {"hidden": True})
wa.set_column("J:K", 11); wa.set_column("L:L", 32); wa.set_column("M:M", 8)
wa.freeze_panes(1, 1)
wa.write(N_AU + 2, 0, "PR_FALL: 2 días, o 4 si hay desplazamiento (ET 37.3.b bis). PR_ENF: 5 días (37.3.b). PR_TRAS: 1 día (37.3.c). "
                      "PR_MAT: 15 días naturales (37.3.a). Lo marcado se consulta con la persona y con la gestoría.", F["txt"])

# IT por ausencia y mes
wi = wb.add_worksheet("IT_mes")
wi.write(0, 0, "Días laborables de IT de cada ausencia en cada mes (festivos de su delegación)", F["neg"])
wi.write(1, 0, "Departamento", F["cab"])
for k, c in enumerate(MCOL):
    col = xlsxwriter.utility.xl_col_to_name(1 + k)
    wi.write_formula(0, 1 + k, f"=DATE(Anio,{k + 1},1)", F["mes"])
    wi.write(1, 1 + k, MESES_ES[k][:3].capitalize(), F["cab"])
ICOL = [xlsxwriter.utility.xl_col_to_name(1 + k) for k in range(10)]
for i in range(N_AU):
    r, x, a = i + 2, i + 3, i + 2
    wi.write_formula(r, 0, f'=IF(Ausencias!A{a}="","",Ausencias!G{a})', F["cel"])
    for c in ICOL:
        wi.write_formula(r, ICOL.index(c) + 1,
                         f'=IF(Ausencias!$J{a}<>1,0,MAX(0,NETWORKDAYS.INTL(MAX(Ausencias!$C{a},{c}$1),'
                         f'MIN(Ausencias!$E{a},EOMONTH({c}$1,0)),1,CHOOSE(Ausencias!$I{a},FestZGZ,FestPAM,FestLLE))))', F["num"])
wi.set_column("A:A", 15); wi.set_column("B:K", 7)
wi.freeze_panes(2, 1)

# Absentismo (informe)
wr = wb.add_worksheet("Absentismo")
wr.write(0, 0, "Absentismo por IT · enero-octubre de 2026 · por departamento (sin nombres)", F["tit"])
wr.write(1, 0, "Días laborables de IT (enfermedad común y accidente de trabajo) / días laborables teóricos de la plantilla. "
               "Los permisos no se incluyen.", F["txt"])
DEPS = ORDEN_DEP
TOT_COL = "L"


def bloque(fila0, titulo, fml_celda, fmt, fmt_tot, total_formula):
    wr.write(fila0, 0, titulo, F["sub"])
    wr.write(fila0 + 1, 0, "Departamento", F["cab"])
    for k in range(10):
        wr.write(fila0 + 1, 1 + k, MESES_ES[k][:3].capitalize(), F["cab"])
    wr.write(fila0 + 1, 11, "Ene-oct", F["cab"])
    for d_i, dep in enumerate(DEPS + ["Total"]):
        r = fila0 + 2 + d_i
        wr.write(r, 0, dep, F["neg"] if dep == "Total" else F["cel"])
        for k in range(11):
            col = xlsxwriter.utility.xl_col_to_name(1 + k)
            wr.write_formula(r, 1 + k, fml_celda(dep, k, col, r + 1, fila0), fmt_tot if dep == "Total" or k == 10 else fmt)
    return fila0 + 2, fila0 + 2 + len(DEPS)  # primera fila de datos (0-idx) y fila del total (0-idx)


def it_celda(dep, k, col, x, f0):
    if k == 10:
        return f"=SUM(B{x}:K{x})"
    if dep == "Total":
        return f"=SUM({col}{f0 + 3}:{col}{f0 + 2 + len(DEPS)})"
    return f'=SUMIFS(IT_mes!{ICOL[k]}$3:{ICOL[k]}${N_AU + 2},IT_mes!$A$3:$A${N_AU + 2},$A{x})'


def teo_celda(dep, k, col, x, f0):
    if k == 10:
        return f"=SUM(B{x}:K{x})"
    if dep == "Total":
        return f"=SUM({col}{f0 + 3}:{col}{f0 + 2 + len(DEPS)})"
    return f'=SUMIFS(Teorico!{MCOL[k]}$3:{MCOL[k]}${N_EM + 2},Teorico!$B$3:$B${N_EM + 2},$A{x})'


it0, itT = bloque(3, "Días laborables de IT", it_celda, F["num"], F["numb"], None)
te0, teT = bloque(11, "Días laborables teóricos", teo_celda, F["num"], F["numb"], None)


def tasa_celda(dep, k, col, x, f0):
    fi = it0 + 1 + DEPS_IDX[dep]
    ft = te0 + 1 + DEPS_IDX[dep]
    return f'=IF({col}{ft}=0,"",{col}{fi}/{col}{ft})'


DEPS_IDX = {d: i for i, d in enumerate(DEPS + ["Total"])}
ta0, taT = bloque(19, "Tasa de absentismo (la del total sale de los totales, no es la media)", tasa_celda, F["pct"], F["pctb"], None)
TASA_TOTAL_CELDA = f"L{taT + 1}"
IT_TOTAL_CELDA = f"L{itT + 1}"
TEO_TOTAL_CELDA = f"L{teT + 1}"
ch = wb.add_chart({"type": "line"})
for d_i, dep in enumerate(DEPS + ["Total"]):
    r = ta0 + d_i
    ch.add_series({"name": ["Absentismo", r, 0], "categories": ["Absentismo", ta0 - 1, 1, ta0 - 1, 10],
                   "values": ["Absentismo", r, 1, r, 10], "marker": {"type": "circle", "size": 4},
                   "line": {"width": 2.75 if dep == "Total" else 1.5, "dash_type": "solid" if dep == "Total" else "dash"}})
ch.set_title({"name": "Tasa de absentismo por IT, 2026"})
ch.set_y_axis({"num_format": "0%", "min": 0})
ch.set_legend({"position": "bottom"})
ch.set_size({"width": 760, "height": 320})
wr.insert_chart(f"A{taT + 3}", ch, {"description": "Gráfico de líneas con la tasa mensual de absentismo por IT de cada departamento y del total, de enero a octubre de 2026."})
wr.set_column("A:A", 16); wr.set_column("B:K", 8); wr.set_column("L:L", 10)
wr.set_landscape(); wr.set_paper(9); wr.fit_to_pages(1, 1)
wr.print_area(0, 0, taT + 20, 11)

# Plantilla
wpl = wb.add_worksheet("Plantilla")
wpl.write(0, 0, "Plantilla a 31/10/2026 y movimientos de 2026", F["tit"])
cab = ["Departamento", "Personas en plantilla", "FTE", "Altas 2026 (contratos)", "Bajas 2026 (contratos)",
       "Plantilla media ene-oct", "Rotación", "Antigüedad media (años)"]
for j, h in enumerate(cab):
    wpl.write(2, j, h, F["cab"])
act2 = 'R_Incl,1,R_Dept,$A{x},R_Alta,"<="&FechaCorte'
for d_i, dep in enumerate(DEPS):
    r, x = 3 + d_i, 4 + d_i
    a2 = act2.format(x=x)
    wpl.write(r, 0, dep, F["cel"])
    wpl.write_formula(r, 1, f'=COUNTIFS({a2},R_Baja,"")+COUNTIFS({a2},R_Baja,">"&FechaCorte)', F["num"])
    wpl.write_formula(r, 2, f'=SUMIFS(R_Jornada,{a2},R_Baja,"")+SUMIFS(R_Jornada,{a2},R_Baja,">"&FechaCorte)', F["num2"])
    wpl.write_formula(r, 3, f'=COUNTIFS(R_Incl,1,R_Dept,$A{x},R_Alta,">="&InicioAnio,R_Alta,"<="&FechaCorte)', F["num"])
    wpl.write_formula(r, 4, f'=COUNTIFS(R_Incl,1,R_Dept,$A{x},R_Baja,">="&InicioAnio,R_Baja,"<="&FechaCorte)', F["num"])
    wpl.write_formula(r, 5, f"=AVERAGE(C{x + 9}:L{x + 9})", F["num1"])
    wpl.write_formula(r, 6, f'=IF(F{x}=0,"",E{x}/F{x})', F["pct"])
    wpl.write_formula(r, 7, f'=IFERROR(AVERAGEIFS(R_Antig,R_Dept,$A{x},R_Activo,"Sí"),"")', F["num1"])
rt = 3 + len(DEPS)
wpl.write(rt, 0, "Total", F["neg"])
for j in (1, 2, 3, 4, 5):
    col = xlsxwriter.utility.xl_col_to_name(j)
    wpl.write_formula(rt, j, f"=SUM({col}4:{col}{rt})", F["numb"] if j != 2 else F["num2"])
wpl.write_formula(rt, 6, f'=IF(F{rt + 1}=0,"",E{rt + 1}/F{rt + 1})', F["pctb"])
wpl.write_formula(rt, 7, '=IFERROR(AVERAGEIFS(R_Antig,R_Activo,"Sí"),"")', F["num1"])
PL_TOTAL = rt + 1
# plantilla a fin de mes (para la media)
wpl.write(10, 0, "Personas en plantilla el último día de cada mes", F["sub"])
wpl.write(11, 0, "Departamento", F["cab"]); wpl.write(11, 1, "", F["cab"])
for k in range(10):
    col = xlsxwriter.utility.xl_col_to_name(2 + k)
    wpl.write_formula(11, 2 + k, f"=EOMONTH(DATE(Anio,{k + 1},1),0)", wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "num_format": "dd/mm"}))
for d_i, dep in enumerate(DEPS):
    r, x = 12 + d_i, 13 + d_i
    wpl.write(r, 0, dep, F["cel"])
    for k in range(10):
        col = xlsxwriter.utility.xl_col_to_name(2 + k)
        base = f'R_Incl,1,R_Dept,$A{x},R_Alta,"<="&{col}$12'
        wpl.write_formula(r, 2 + k, f'=COUNTIFS({base},R_Baja,"")+COUNTIFS({base},R_Baja,">"&{col}$12)', F["num"])
wpl.write(18, 0, "Altas y bajas por contrato, como salen en nóminas: la recontratación de E0047 cuenta una baja (28/02) y un alta (04/05). "
                 "Rotación = bajas de 2026 / plantilla media de enero a octubre.", F["txt"])
wpl.set_column("A:A", 16); wpl.set_column("B:H", 13); wpl.set_column("I:L", 7)

# Controles RRHH
wc = wb.add_worksheet("Controles")
wc.write(0, 0, "Controles", F["tit"])
filas = [
    ("Filas de Nomina_origen (62)", 62, "=COUNTA(Nomina_origen!A2:A500)", 0),
    ("Filas de total quitadas (1)", 1, '=COUNTIF(Nomina_origen!A2:A500,"Total*")', 0),
    ("Duplicados exactos quitados (2)", 2, "=SUM(R_Dup)", 0),
    ("Contratos válidos (59: 58 personas + la recontratación)", 59, "=SUM(R_Incl)", 0),
    ("Personas distintas por NIF (58)", 58, "=SUM(R_Nueva)", 0),
    ("Fechas que no se han podido convertir", 0, '=COUNTIF(R_Fechas,"Revisar*")', 0),
    ("Departamentos o delegaciones sin equivalencia", 0, '=COUNTIF(R_Dept,"SIN*")+COUNTIF(R_Deleg,"SIN*")', 0),
    ("Jornadas fuera de (0; 1]", 0, '=COUNTIFS(R_Incl,1,R_Jornada,">1")+COUNTIFS(R_Incl,1,R_Jornada,"<=0")', 0),
    ("Personas en plantilla a 31/10/2026 (55)", 55, '=COUNTIF(R_Activo,"Sí")', 0),
    ("Suma de la plantilla por departamento = total", '=COUNTIF(R_Activo,"Sí")', f"=Plantilla!B{PL_TOTAL}", 0),
    ("Ausencias con código sin pareja en Empleados", 0, '=COUNTIF(A_Dept,"HUÉRFANO")', 0),
    ("Bajas abiertas (3)", 3, '=COUNTIF(A_Abierta,"Sí")', 0),
    ("Permisos para revisar frente al ET 37.3 (2)", 2, '=COUNTIF(A_Revisar,"Revisar*")', 0),
    ("Días de IT: suma por departamento = suma de todas las ausencias", f"=SUM(IT_mes!B3:K{N_AU + 2})",
     f"=Absentismo!{IT_TOTAL_CELDA}", 0),
    ("Días teóricos: suma por departamento = suma de todos los contratos", f"=SUM(Teorico!F3:O{N_EM + 2})",
     f"=Absentismo!{TEO_TOTAL_CELDA}", 0),
    ("Tasa de la empresa = total de IT / total teórico (no la media de las tasas)",
     f"=Absentismo!{IT_TOTAL_CELDA}/Absentismo!{TEO_TOTAL_CELDA}", f"=Absentismo!{TASA_TOTAL_CELDA}", 0.000001),
    ("Columnas «Observaciones» en este libro (0)", 0, '=COUNTIF(Ausencias!A1:M1,"Observaciones")', 0),
    ("Festivos del año en Zaragoza, Pamplona y Lleida (14 + 14 + 14)", 42,
     '=COUNTIFS(FestZGZ,">="&InicioAnio,FestZGZ,"<="&FinAnio)+COUNTIFS(FestPAM,">="&InicioAnio,FestPAM,"<="&FinAnio)'
     '+COUNTIFS(FestLLE,">="&InicioAnio,FestLLE,"<="&FinAnio)', 0),
]
tabla_controles(wb, F, wc, filas)

wk = wb.add_worksheet("Calidad de datos")
wk.write(0, 0, "Calidad de datos · exportación de nóminas y ausencias", F["tit"])
for j, h in enumerate(["Origen", "Problema", "Filas afectadas", "Decisión"]):
    wk.write(2, j, h, F["cab"])
cal = [
    ("Nomina_export", "Fila «Total empleados: 61» al final", 1, "Se excluye (Incluir = 0)."),
    ("Nomina_export", "Filas duplicadas exactas (la exportación se solapa)", 2, "Se excluyen. Antes de quitarlas se comprueba que la fila entera es igual."),
    ("Nomina_export", "E0047 aparece dos veces con fechas distintas", 2, "No es un duplicado: son 2 contratos (recontratación). Se mantienen."),
    ("Nomina_export", "Códigos sin prefijo («12»)", calidad_nom["sin_prefijo"], "=\"E\"&TEXTO(VALOR(SUSTITUIR(código;\"E\";\"\"));\"0000\")."),
    ("Nomina_export", "Dobles espacios o espacio final en el nombre", calidad_nom["espacios"], "ESPACIOS y NOMPROPIO."),
    ("Nomina_export", "Departamento en 6 grafías (Almacén y Administración)", 18, "Tabla Equivalencias."),
    ("Nomina_export", "Delegación «Zgz»", 3, "Tabla Equivalencias."),
    ("Nomina_export", "Fechas en aaaa-mm-dd", calidad_nom["fechas_iso"], "FECHA con IZQUIERDA, EXTRAE y DERECHA según el formato."),
    ("Nomina_export", "Fechas en dd-mm-aa", calidad_nom["fechas_aa"], "Año = 2000 + los dos dígitos (todas las altas son de 2000 o después)."),
    ("Nomina_export", "Jornada en formatos mezclados (1, 100, 100%, 0,5, 50%, 75…)", 59, "Número entre 0 y 1: si lleva % o es mayor que 1, se divide entre 100."),
    ("Ausencias_2026", "Observaciones con diagnósticos o síntomas (datos de salud)", 11, "Columna eliminada: no hace falta para el absentismo (RGPD 5.1.c y 9.1)."),
    ("Ausencias_2026", "Bajas abiertas (Hasta vacía)", 3, "Se cuentan hasta la fecha de corte (31/10/2026)."),
    ("Ausencias_2026", "Permisos más largos que el ET 37.3 (matrimonio de 20 días, traslado de 3)", 2, "Marcados para revisar; no se corrigen."),
    ("Ausencias_2026", "IT de E0031 empezada en 2025", 1, "Solo cuentan sus días de 2026."),
]
for i, fila in enumerate(cal, start=3):
    for j, v in enumerate(fila):
        if isinstance(v, int):
            wk.write_number(i, j, v, F["cel"])
        else:
            wk.write_string(i, j, v, F["celw"])
wk.set_column("A:A", 18); wk.set_column("B:B", 52); wk.set_column("C:C", 10); wk.set_column("D:D", 70)

hoja_texto(wb, F, "Cómo se hizo", "Cómo se hizo (tabla dinámica, PDF y cierre)", [
    ("sub", "Tabla dinámica de absentismo (alternativa a la hoja Absentismo)"),
    ("txt", "1. Clic dentro de la hoja IT_mes > Insertar > Tabla dinámica > Hoja de cálculo nueva."),
    ("txt", "2. Departamento en Filas; Ene, Feb… Oct en Valores (Suma). Haz lo mismo con Teorico. La tasa: IT / teórico con una "
            "fórmula al lado (un campo calculado sumaría mal la fila del total si mezclas tablas)."),
    ("txt", "3. Analizar tabla dinámica > Gráfico dinámico > Línea. Clic derecho en la tabla > Actualizar cuando cambien los datos."),
    ("sub", "PDF para Carmen (sin nombres)"),
    ("txt", "Hoja Absentismo > Archivo > Exportar > Crear documento PDF/XPS > Opciones: «Hojas activas». Ya tiene área de "
            "impresión, horizontal y ajustada a 1 página."),
    ("sub", "Cierre y cumplimiento"),
    ("txt", "Archivo > Información > Comprobar si hay problemas > Inspeccionar documento (comentarios, datos personales, filas ocultas)."),
    ("txt", "Revisar > Accesibilidad > Comprobar accesibilidad (texto alternativo del gráfico, nombres de hoja)."),
    ("txt", "Guardar en la carpeta de RRHH con permisos solo para RRHH. El archivo compartido con los responsables es otro "
            "(Vacaciones_2026-2027.xlsx) y no lleva ni NIF, ni jornada, ni ausencias."),
    ("sub", "Power Query (ampliación)"),
    ("txt", "Datos > Obtener datos > De texto/CSV (Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma) para leer la "
            "exportación; Combinar consultas con Equivalencias; Quitar duplicados por la fila entera; y Actualizar todo cada mes."),
])
wb.close()

for nombre, titulo, desc in [
    ("p2-solucion", "P2 · Solución: Vacaciones_2026-2027",
     "El archivo compartido con los responsables: festivos por delegación, periodos, saldos, cuadrante con alertas, validación y controles."),
    ("p2-solucion-rrhh", "P2 · Solución: Absentismo_2026_RRHH",
     "Solo RRHH: maestro limpio con fórmulas, ausencias sin observaciones, absentismo por departamento y mes, plantilla y controles."),
]:
    with open(os.path.join(LIBROS, nombre + ".meta.json"), "w", encoding="utf-8") as fh:
        json.dump({"titulo": titulo, "descripcion": desc, "nivel": "n6"}, fh, ensure_ascii=False, indent=1)

# guardar dónde están las celdas clave, para verificar
CLAVES = dict(cuad_rng=CUAD_RNG, res_fila=RES_FILA, it_total=IT_TOTAL_CELDA, teo_total=TEO_TOTAL_CELDA,
              tasa_total=TASA_TOTAL_CELDA, pl_total=PL_TOTAL, ra=ra)
print("Libros escritos:", CLAVES)

# ======================================================================================
# 5. VERIFICACIÓN CON LIBREOFFICE (opcional: --verificar)
# ======================================================================================
if "--verificar" in sys.argv:
    perfil = os.environ.get("P2_LO_PERFIL")
    out = os.path.join(os.environ.get("P2_LO_OUT", "/tmp"), "p2_recalc")
    shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    for f in ("p2-solucion.xlsx", "p2-solucion-rrhh.xlsx"):
        cmd = ["soffice"] + ([f"-env:UserInstallation=file://{perfil}"] if perfil else []) + \
              ["--headless", "--convert-to", "xlsx", "--outdir", out, os.path.join(LIBROS, f)]
        subprocess.run(cmd, check=True, capture_output=True)
    s = openpyxl.load_workbook(os.path.join(out, "p2-solucion.xlsx"), data_only=True)
    h = openpyxl.load_workbook(os.path.join(out, "p2-solucion-rrhh.xlsx"), data_only=True)
    c = s["Controles"]
    estados = [(c.cell(r, 2).value, c.cell(r, 3).value, c.cell(r, 4).value, c.cell(r, 7).value) for r in range(4, 4 + len(ctrl_filas))]
    for e in estados:
        print("  compartido:", e)
    assert all(e[3] is True for e in estados), "algún control del libro compartido falla"
    vals = [c.cell(RES_FILA + 1 + k, 4).value for k in range(len(resumen))]
    print("  cifras:", vals)
    assert vals[0] == CTRL["vac2026"] and vals[1] == CTRL["derecho_activos"] and vals[2] == CTRL["saldo_activos"]
    # saldos persona a persona
    sh = s["Saldos"]
    for row in sh.iter_rows(min_row=2, max_row=59, values_only=True):
        cod = row[0]
        verdad = next(x for x in V["saldos"] if x["cod"] == cod)
        assert abs(row[8] - verdad["derecho"]) < 1e-9 and abs(row[12] - verdad["saldo"]) < 1e-9, (cod, row, verdad)
    c = h["Controles"]
    estados = [(c.cell(r, 2).value, c.cell(r, 3).value, c.cell(r, 4).value, c.cell(r, 7).value) for r in range(4, 4 + len(filas))]
    for e in estados:
        print("  rrhh:", e)
    assert all(e[3] is True for e in estados), "algún control del libro de RRHH falla"
    a = h["Absentismo"]
    it_t, teo_t, tasa_t = a[IT_TOTAL_CELDA].value, a[TEO_TOTAL_CELDA].value, a[TASA_TOTAL_CELDA].value
    print("  absentismo:", it_t, teo_t, tasa_t)
    assert it_t == CTRL["it_dias"] and teo_t == CTRL["teorico"] and abs(100 * tasa_t - CTRL["tasa_exacta"]) < 1e-9
    for dep in DEPS:
        r = it0 + 1 + DEPS_IDX[dep]
        for k in range(10):
            assert a.cell(r, 2 + k).value == V["it_mes"].get(f"{dep}|{k + 1}", 0), (dep, k)
    print("Verificación con LibreOffice: OK")

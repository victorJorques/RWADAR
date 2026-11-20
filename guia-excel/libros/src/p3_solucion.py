# -*- coding: utf-8 -*-
"""
P3 · Facturas, cobros y antigüedad de saldos · SOLUCIÓN
=======================================================

Lee los archivos SUCIOS que genera p3_datos.py (los mismos que recibe la alumna):
  libros/p3-facturas-emitidas.csv, libros/p3-cobros-2026.csv y libros/p3-datos.xlsx
los limpia con pandas siguiendo las reglas del encargo y las aclaraciones de Marta, calcula los
totales de control y comprueba que coinciden con p3_verdad.json (calculado por p3_datos.py sobre
los datos VERDADEROS, antes de ensuciarlos). Si algo no coincide, se para.

Después genera:
  libros/p3-solucion.xlsx        el libro resuelto, con fórmulas reales de Excel (inglés y comas en
                                 el archivo; Excel en español las muestra traducidas), Tablas,
                                 nombres definidos, hoja Controles con control maestro, hoja
                                 Para_auditor (Subtotal) y hoja «Cómo se hizo» (Power Query, tabla
                                 dinámica, segmentaciones, filtro Diez mejores, gráfico).
  libros/p3-solucion.meta.json
  libros/src/p3_controles.json   las cifras que van a proyectos/p3.json

Reglas aplicadas (aclaraciones de Marta):
  - Foto a 31/10/2026: los cobros posteriores no cuentan.
  - Importes con IVA. Los abonos (R26, en negativo) restan a su cliente.
  - Antigüedad desde el VENCIMIENTO: No vencido · 1-30 · 31-60 · 61-90 · 91-180 · Más de 180.
  - Vencimiento vacío = FechaFactura + días de la forma de pago (tabla FormasPago).
  - Cobros con NumFactura: se aplican a esa factura (las devoluciones, en negativo, la reabren).
  - Cobros sin NumFactura que citan documentos en el Concepto: si el importe cubre todo lo citado,
    cada documento queda cobrado entero; si no llega, se aplica a la factura más antigua primero.
  - Cobros sin NumFactura ni referencia: entregas a cuenta. No se aplican a ninguna factura; van en
    la línea «Cobros a cuenta pendientes de aplicar». Saldo 430 = Σ pendiente − Σ a cuenta.
  - «Me preocupan»: top 10 por pendiente vencido a más de 60 días y todos los que superan su límite
    de riesgo (saldo de la 430 del cliente = pendiente − entregas a cuenta).
  - PMC aproximado = saldo de clientes (430) / facturación con IVA, neta de abonos, del 01/08 al
    31/10/2026 × 92 días.
"""
import datetime as dt
import json
import os
import re

import numpy as np
import pandas as pd
import xlsxwriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
CSV_FAC = os.path.join(LIBROS, "p3-facturas-emitidas.csv")
CSV_COB = os.path.join(LIBROS, "p3-cobros-2026.csv")
XLSX_DATOS = os.path.join(LIBROS, "p3-datos.xlsx")
SALIDA = os.path.join(LIBROS, "p3-solucion.xlsx")

CORTE = dt.date(2026, 10, 31)
UMBRAL = 60          # «vencido a más de 60 días»
DIAS_LEY = 60        # Ley 3/2004, art. 4.3
MESES_PMC = 3
FORMAS = [("Contado", 0), ("Transferencia 30 días", 30), ("Recibo domiciliado 30 días", 30),
          ("Transferencia 45 días", 45), ("Transferencia 60 días", 60), ("Recibo domiciliado 60 días", 60),
          ("Confirming 60 días", 60), ("Transferencia 75 días", 75), ("Transferencia 90 días", 90),
          ("Confirming 90 días", 90)]
TRAMOS = [(0, "0 · No vencido"), (1, "1 · 1-30"), (31, "2 · 31-60"), (61, "3 · 61-90"),
          (91, "4 · 91-180"), (181, "5 · Más de 180")]
DELEGACIONES = ["Zaragoza", "Pamplona", "Lleida"]
EPOCA = dt.date(1899, 12, 30)


def serial(d):
    return (d - EPOCA).days


def r2(x):
    return float(round(float(x) + 0.0, 2))


def tramo(dias):
    if dias <= 0:
        return TRAMOS[0][1]
    t = TRAMOS[0][1]
    for desde, nombre in TRAMOS:
        if dias >= desde:
            t = nombre
    return t


def a_fecha(t):
    if t == "":
        return None
    if "-" in t:
        return dt.date(int(t[:4]), int(t[5:7]), int(t[8:10]))
    return dt.date(int(t[6:10]), int(t[3:5]), int(t[:2]))


# ===========================================================================
# 1. LEER Y LIMPIAR (lo mismo que hace Power Query en el libro)
# ===========================================================================
fac_raw = pd.read_csv(CSV_FAC, sep=";", dtype=str, keep_default_na=False, encoding="utf-8")
FILAS_CSV = len(fac_raw)
es_total = fac_raw["NumFactura"].eq("TOTAL GENERAL")
fila_total = fac_raw[es_total].iloc[0]
F = fac_raw[~es_total].copy()
dup = F.duplicated(keep="first")
N_DUP = int(dup.sum())
assert int(F["NumFactura"].duplicated().sum()) == N_DUP, "hay NumFactura repetidos que no son duplicados exactos"
dup_rows = F[dup]
DUP_EUR = r2(dup_rows["TotalFactura"].astype(float).sum())
DUP_FECHAS = sorted(set(dup_rows["FechaFactura"]))
F = F[~dup].copy()
N_ESP = int((F["CodCliente"] != F["CodCliente"].str.strip()).sum())
F["CodCliente"] = F["CodCliente"].str.strip()
O45 = F["CodCliente"].eq("C0O45")
N_O45, O45_EUR = int(O45.sum()), r2(F.loc[O45, "TotalFactura"].astype(float).sum())
F.loc[O45, "CodCliente"] = "C0045"
N_ISO = int(F["FechaFactura"].str.contains("-").sum())
N_VENC_VACIO = int((F["FechaVencimiento"] == "").sum())
F["FechaF"] = F["FechaFactura"].map(a_fecha)
F["VencERP"] = F["FechaVencimiento"].map(a_fecha)
F["Base"] = F["BaseImponible"].str.replace(",", ".").astype(float)
F["Cuota"] = F["CuotaIVA"].str.replace(",", ".").astype(float)
F["Total"] = F["TotalFactura"].astype(float)          # exportada con punto decimal
F["Tipo"] = F["TipoIVA"].astype(int)
DIAS = dict(FORMAS)
assert set(F["FormaPago"]) <= set(DIAS), set(F["FormaPago"]) - set(DIAS)
F["DiasForma"] = F["FormaPago"].map(DIAS)
F["Venc"] = [v if v is not None else f + dt.timedelta(days=int(d)) for v, f, d in zip(F["VencERP"], F["FechaF"], F["DiasForma"])]
ok_venc = [v is None or v == f + dt.timedelta(days=int(d)) for v, f, d in zip(F["VencERP"], F["FechaF"], F["DiasForma"])]
assert all(ok_venc), "algún vencimiento del ERP no casa con su forma de pago"
F["Dif"] = (F["Total"] - (F["Base"] + F["Cuota"])).round(2)
ANOM = F.loc[F["Dif"].abs() > 0.005, ["NumFactura", "CodCliente", "Dif"]]
F = F.reset_index(drop=True)

# Clientes: maestro (30/09) + altas de octubre
xl = pd.read_excel(XLSX_DATOS, sheet_name=None, dtype={"CodCliente": str, "NIF": str, "CodComercial": str})
CL = xl["Clientes"].copy()
CL["Origen"] = "Maestro 30/09/2026"
AL = xl["Altas_ERP"]
AL = AL[AL["CodCliente"].astype(str).str.match(r"^C\d{4}$")].copy()
AL["Origen"] = "Alta de octubre (Altas_ERP)"
HUERF_ANTES = sorted(set(F["CodCliente"]) - set(CL["CodCliente"]))
CL = pd.concat([CL, AL], ignore_index=True)
CL["Observaciones"] = CL["Observaciones"].fillna("")
for c in ("DiasPago", "LimiteRiesgo"):
    CL[c] = CL[c].astype(float)
assert set(F["CodCliente"]) <= set(CL["CodCliente"])
cli = CL.set_index("CodCliente")
N_ALTAS_DOCS = int(F["CodCliente"].isin(AL["CodCliente"]).sum())

# Cobros
C = pd.read_csv(CSV_COB, sep=";", dtype=str, keep_default_na=False, encoding="utf-8")
C["Fecha"] = C["FechaCobro"].map(a_fecha)
C["Imp"] = C["Importe"].str.replace(",", ".").astype(float)
PATRON = re.compile(r"\b[FR]2[56]-\d{6}\b")
C["Refs"] = [[] if n else PATRON.findall(t) for n, t in zip(C["NumFactura"], C["Concepto"])]
C["NRefs"] = C["Refs"].map(len)
C["TipoCobro"] = np.select(
    [(C["NumFactura"] != "") & (C["Imp"] < 0), C["NumFactura"] != "", C["NRefs"] == 1, C["NRefs"] > 1],
    ["Devolución", "Directo", "Factura en el concepto", "Agrupado"], "A cuenta")
C["AntesCorte"] = C["Fecha"] <= CORTE
C = C.reset_index(drop=True)

# Aplicaciones (lo que hace la consulta «Aplicaciones»: una fila por documento citado)
tot = F.set_index("NumFactura")["Total"]
ffac = F.set_index("NumFactura")["FechaF"]
filas_ap = []
for r in C[C["NRefs"] > 0].itertuples():
    for n in r.Refs:
        filas_ap.append(dict(IdCobro=r.IdCobro, NumFactura=n, FechaCobro=r.Fecha, ImporteCobro=r.Imp, NRefs=r.NRefs))
A = pd.DataFrame(filas_ap)
A["Existe"] = A["NumFactura"].isin(tot.index)
assert A["Existe"].all()
A["TotalDoc"] = A["NumFactura"].map(tot)
A["FechaDoc"] = A["NumFactura"].map(ffac)
A["SumaCitada"] = A.groupby("IdCobro")["TotalDoc"].transform("sum")
A["Previo"] = [A.loc[(A["IdCobro"] == i) & ((A["FechaDoc"] < f) | ((A["FechaDoc"] == f) & (A["NumFactura"] < n))), "TotalDoc"].sum()
               for i, f, n in zip(A["IdCobro"], A["FechaDoc"], A["NumFactura"])]  # más antiguos; misma fecha: número menor


def aplicado(r):
    if r.NRefs == 1:
        return r2(r.ImporteCobro)
    if r.ImporteCobro >= round(r.SumaCitada, 2):
        return r2(r.TotalDoc)
    return r2(min(r.TotalDoc, max(0.0, r.ImporteCobro - r.Previo)))


A["Aplicado"] = [aplicado(r) for r in A.itertuples()]
# en los cobros parciales agrupados, misma fecha de documento: no se da (si se diera, haría falta desempatar por número)
for i, g in A[A["NRefs"] > 1].groupby("IdCobro"):
    if g["ImporteCobro"].iloc[0] < round(g["SumaCitada"].iloc[0], 2):
        assert g["FechaDoc"].is_unique, i

# Cobrado, pendiente, días y tramos
Cc = C[C["AntesCorte"] & (C["NumFactura"] != "")]
directo = Cc.groupby("NumFactura")["Imp"].sum()
Ac = A[A["FechaCobro"] <= CORTE]
por_ap = Ac.groupby("NumFactura")["Aplicado"].sum()
assert set(directo.index) <= set(F["NumFactura"]) and set(por_ap.index) <= set(F["NumFactura"])
F["Cobrado"] = [r2(directo.get(n, 0.0) + por_ap.get(n, 0.0)) for n in F["NumFactura"]]
assert abs(Ac["Aplicado"].sum() - C.loc[C["AntesCorte"] & (C["NRefs"] > 0), "Imp"].sum()) < 0.005
F["Pendiente"] = (F["Total"] - F["Cobrado"]).round(2)
F["Estado"] = np.select([F["Pendiente"].abs() < 0.005, F["Pendiente"] < 0, (F["Pendiente"] - F["Total"]).abs() < 0.005],
                        ["Cobrada", "Saldo a favor", "Pendiente"], "Parcial")
F["DiasVencidos"] = [(CORTE - v).days for v in F["Venc"]]
F["DiasDesdeFactura"] = [(CORTE - f).days for f in F["FechaF"]]
F["Plazo"] = [(v - f).days for v, f in zip(F["Venc"], F["FechaF"])]
F["Tramo"] = F["DiasVencidos"].map(tramo)
F["Serie"] = F["NumFactura"].str[:3]
F["NombreMaestro"] = F["CodCliente"].map(cli["Nombre"])
F["Delegacion"] = F["CodCliente"].map(cli["Delegacion"])
F["Comercial"] = F["CodCliente"].map(cli["CodComercial"])
F["EstadoCliente"] = F["CodCliente"].map(cli["Estado"])

# Por cliente
acta = C[(C["TipoCobro"] == "A cuenta") & C["AntesCorte"]]
ACTA_TOTAL, ACTA_N = r2(acta["Imp"].sum()), int(len(acta))
acta_cli = acta.groupby("CodCliente")["Imp"].sum()
CL["SaldoDocumentos"] = CL["CodCliente"].map(F.groupby("CodCliente")["Pendiente"].sum()).fillna(0).round(2)
CL["ACuenta"] = CL["CodCliente"].map(acta_cli).fillna(0).round(2)
CL["Saldo"] = (CL["SaldoDocumentos"] - CL["ACuenta"]).round(2)
COLS_TRAMO = ["NoVencido", "D1_30", "D31_60", "D61_90", "D91_180", "Mas180"]
for col, (_, t) in zip(COLS_TRAMO, TRAMOS):
    CL[col] = CL["CodCliente"].map(F[F["Tramo"] == t].groupby("CodCliente")["Pendiente"].sum()).fillna(0).round(2)
CL["VencidoMas60"] = CL["CodCliente"].map(F[F["DiasVencidos"] > UMBRAL].groupby("CodCliente")["Pendiente"].sum()).fillna(0).round(2)
CL["Exceso"] = (CL["Saldo"] - CL["LimiteRiesgo"]).round(2)
CL["SuperaLimite"] = CL["Saldo"] > CL["LimiteRiesgo"]
CL["PlazoMas60"] = CL["DiasPago"] > DIAS_LEY

# ===========================================================================
# 2. TOTALES DE CONTROL Y COMPARACIÓN CON LA VERDAD
# ===========================================================================
PEND = r2(F["Pendiente"].sum())
SALDO430 = r2(PEND - ACTA_TOTAL)
POR_TRAMO = {t: r2(F.loc[F["Tramo"] == t, "Pendiente"].sum()) for _, t in TRAMOS}
VENCIDO = r2(F.loc[F["DiasVencidos"] > 0, "Pendiente"].sum())
VENC60 = r2(F.loc[F["DiasVencidos"] > UMBRAL, "Pendiente"].sum())
TOP10 = CL.sort_values("VencidoMas60", ascending=False).head(10)
SUPERA = CL[CL["SuperaLimite"]].sort_values("Exceso", ascending=False)
LEY = CL[CL["PlazoMas60"]].sort_values("CodCliente")
FAVOR = CL[CL["Saldo"] < 0].sort_values("Saldo")
INI_PMC = dt.date(2026, 8, 1)
FACT_PMC = r2(F.loc[(F["FechaF"] >= INI_PMC) & (F["FechaF"] <= CORTE), "Total"].sum())
DIAS_PMC = (CORTE - INI_PMC).days + 1
PMC = SALDO430 / FACT_PMC * DIAS_PMC
DOCS_PLAZO = int((F["Plazo"] > DIAS_LEY).sum())
PEND_PLAZO = r2(F.loc[F["Plazo"] > DIAS_LEY, "Pendiente"].sum())
BLOQ = CL[CL["Estado"] == "Bloqueado"].iloc[0]
m = re.search(r"(\d{2})/(\d{2})/(\d{4})", BLOQ["Observaciones"])
F_BLOQ = dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
tras_bloq = F[(F["CodCliente"] == BLOQ["CodCliente"]) & (F["FechaF"] > F_BLOQ)]
COB_NOV = C[~C["AntesCorte"]]
DIF_TBC = r2(F["Total"].sum() - F["Base"].sum() - F["Cuota"].sum())

V = json.load(open(os.path.join(AQUI, "p3_verdad.json"), encoding="utf-8"))


def igual(a, b, tol=0.005):
    assert abs(float(a) - float(b)) <= tol, (a, b)


assert len(F) == V["n_documentos"] == FILAS_CSV - N_DUP - 1
igual(DIF_TBC, V["dif_total_base_cuota"])
igual(PEND, V["pendiente_total"])
igual(ACTA_TOTAL, V["a_cuenta_total"])
igual(SALDO430, V["saldo_430"])
igual(SALDO430, xl["Contabilidad"].iloc[1, 1])
igual(r2(F["Cobrado"].sum()), V["cobrado_total"])
for t in POR_TRAMO:
    igual(POR_TRAMO[t], V["por_tramo"][t])
igual(VENCIDO, V["vencido_total"])
igual(VENC60, V["vencido_mas60"])
assert list(TOP10["CodCliente"]) == [x[0] for x in V["top10_mas60"]]
for (c, _, v), r in zip(V["top10_mas60"], TOP10.itertuples()):
    igual(r.VencidoMas60, v)
assert sorted(SUPERA["CodCliente"]) == [x[0] for x in V["supera_limite"]]
assert sorted(LEY["CodCliente"]) == V["clientes_mas60_dias"]
assert DOCS_PLAZO == V["facturas_plazo_mas60"]
igual(PEND_PLAZO, V["pendiente_plazo_mas60"])
assert sorted(FAVOR["CodCliente"]) == sorted(x[0] for x in V["saldo_favor"])
igual(FACT_PMC, V["facturacion_ago_oct"])
igual(round(PMC, 1), V["pmc"], 0.05)
assert F["Estado"].value_counts().to_dict() == V["estados"]
assert len(COB_NOV) == V["n_cobros_nov"]
assert BLOQ["CodCliente"] == V["bloqueado"][0] and len(tras_bloq) == V["bloqueado"][2]
igual(r2(tras_bloq["Pendiente"].sum()), V["bloqueado"][4])
assert ANOM["NumFactura"].tolist().count(V["cien"]) == 1 and len(ANOM) == 5
assert sorted(acta["CodCliente"]) == sorted(V["a_cuenta_clientes"])
print("OK: los datos sucios, limpiados con las reglas del encargo, dan exactamente los totales verdaderos.")

# ===========================================================================
# 3. LIBRO RESUELTO
# ===========================================================================
wb = xlsxwriter.Workbook(SALIDA, {"use_future_functions": True})
wb.set_properties({"title": "P3 · Antigüedad de saldos a 31/10/2026 (solución)", "author": "Hoja a hoja",
                   "comments": "Datos inventados de Electro Cierzo Suministros, S.L. (empresa ficticia)."})
AZUL = "#1F3864"
fmt = lambda **k: wb.add_format(k)  # noqa: E731
f_t = fmt(bold=True, font_size=16, font_color=AZUL)
f_t_c = fmt(bold=True, font_size=16, font_color=AZUL, center_across=True)
f_s = fmt(italic=True, font_color="#595959")
f_h = fmt(bold=True, font_size=12, font_color=AZUL, bottom=1)
f_b = fmt(bold=True)
f_wrap = fmt(text_wrap=True, valign="top")
f_mono = fmt(font_name="Consolas", font_size=9)
f_cab = fmt(bold=True, bg_color="#D9E1F2", border=1, text_wrap=True, valign="top")
f_in = fmt(bg_color="#FFF2CC", border=1)
f_in_eur = fmt(bg_color="#FFF2CC", border=1, num_format='#,##0.00 "€"')
f_in_fecha = fmt(bg_color="#FFF2CC", border=1, num_format="dd/mm/yyyy")
f_in_int = fmt(bg_color="#FFF2CC", border=1, num_format="0")
f_calc_fecha = fmt(border=1, num_format="dd/mm/yyyy", bg_color="#F2F2F2")
f_eur = fmt(num_format='#,##0.00 "€"')
f_eur_b = fmt(num_format='#,##0.00 "€"', bold=True)
f_eur_tot = fmt(num_format='#,##0.00 "€"', bold=True, top=1)
f_num2 = fmt(num_format="#,##0.00")
f_fecha = fmt(num_format="dd/mm/yyyy")
f_int = fmt(num_format="0")
f_dias = fmt(num_format="0.0")
f_pct = fmt(num_format="0.0%")
f_pct_tot = fmt(num_format="0.0%", bold=True, top=1)
f_txt = fmt(num_format="@")
f_ok = fmt(bold=True, font_color="#006100", bg_color="#C6EFCE")
f_ko = fmt(bold=True, font_color="#9C0006", bg_color="#FFC7CE")
f_aviso = fmt(bg_color="#FCE4D6", text_wrap=True, valign="top")
f_estado = fmt(bold=True, font_size=12, border=1, align="center")


def tf(tabla, formula):
    """[@Col] → Tabla[[#This Row],[Col]] (lo que guarda Excel para la fila actual)."""
    return re.sub(r"\[@(\w+)\]", lambda m: f"{tabla}[[#This Row],[{m.group(1)}]]", formula)


def tabla(ws, nombre, fila0, col0, columnas, n, valores, anchos=None):
    """columnas: [(cabecera, formula_o_None, formato)]; valores: dict cabecera -> lista de n valores."""
    cols = []
    for cab, form, fm in columnas:
        d = {"header": cab}
        if form:
            d["formula"] = tf(nombre, form)
        if fm is not None:
            d["format"] = fm
        cols.append(d)
    ws.add_table(fila0, col0, fila0 + n, col0 + len(columnas) - 1,
                 {"name": nombre, "columns": cols, "style": "Table Style Light 9"})
    for j, (cab, form, fm) in enumerate(columnas):
        vals = valores[cab]
        ftxt = "=" + tf(nombre, form) if form else None
        for i in range(n):
            v = vals[i]
            r, c = fila0 + 1 + i, col0 + j
            if form:
                if isinstance(v, (bool, np.bool_)):
                    v = bool(v)
                elif isinstance(v, (np.floating, np.integer)):
                    v = float(v)
                ws.write_formula(r, c, ftxt, fm, v)
            elif v is None or (isinstance(v, float) and np.isnan(v)) or v == "":
                if fm is not None:
                    ws.write_blank(r, c, None, fm)
            elif isinstance(v, str):
                ws.write_string(r, c, v, fm)
            else:
                ws.write_number(r, c, float(v), fm)
    if anchos:
        for j, a in enumerate(anchos):
            ws.set_column(col0 + j, col0 + j, a)


def lineas(ws, filas, ancho=120, fila0=0):
    ws.set_column(0, 0, ancho)
    for i, (tipo, texto) in enumerate(filas):
        f = {"t": f_t, "s": f_s, "h": f_h, "m": f_mono, "b": f_b}.get(tipo, f_wrap)
        ws.write_string(fila0 + i, 0, texto, f)


# ---------------------------------------------------------------- Léame
ws = wb.add_worksheet("Léame")
ws.hide_gridlines(2)
LEAME = [
    ("t", "P3 · Lo que nos deben los clientes a 31/10/2026"),
    ("s", "Electro Cierzo Suministros, S.L. · Administración y finanzas · Encargo de Marta Ruiz (13/11/2026) · Hecho por: la administrativa de Administración"),
    ("", ""),
    ("h", "Para qué sirve"),
    ("", "Saldo de clientes a la fecha de corte, con su antigüedad desde el vencimiento, los clientes que preocupan (top 10 vencido a más de 60 días y excesos sobre el límite de riesgo), los plazos de más de 60 días que no permite la Ley 3/2004 (art. 4.3) y el periodo medio de cobro (PMC). La hoja Informe es la página del comité; el resto es el detalle para Administración."),
    ("", ""),
    ("h", "Fuentes"),
    ("", "p3-facturas-emitidas.csv (ERP, UTF-8, «;») · p3-cobros-2026.csv (contabilidad, exportado el 13/11/2026) · p3-datos.xlsx: Clientes (maestro a 30/09/2026), Altas_ERP (C0322 y C0323) y Contabilidad (saldo 430)."),
    ("", ""),
    ("h", "Supuestos pactados con Marta (13/11/2026)"),
    ("", "1. Foto a 31/10/2026: los cobros de noviembre no cuentan (están en el CSV, pero las fórmulas filtran por FechaCorte)."),
    ("", "2. Importes con IVA. Los abonos (serie R26, en negativo) restan a su cliente y van en el tramo de su vencimiento."),
    ("", "3. Antigüedad desde el vencimiento (tabla Tramos). Para el auditor también se dan los días desde la factura."),
    ("", "4. Cobros agrupados (varias facturas citadas en el concepto): si el importe cubre todo, cada documento queda cobrado; si no llega, se aplica a la factura más antigua primero."),
    ("", "5. Cobros sin factura ni referencia = entregas a cuenta: no se aplican a ninguna factura; restan en la línea «Cobros a cuenta pendientes de aplicar». Contabilidad ya los tiene en la 430, por eso Σ pendiente − Σ a cuenta = saldo 430."),
    ("", "6. Riesgo: saldo del cliente (pendiente − sus entregas a cuenta) frente a LimiteRiesgo del maestro."),
    ("", "7. PMC aproximado = saldo de clientes (430) / facturación con IVA, neta de abonos, de los 3 últimos meses × días de esos meses (92). Hay otras definiciones (con la facturación anual × 365, o con el saldo medio); esta es la pactada."),
    ("", ""),
    ("h", "Cómo está organizado (de izquierda a derecha)"),
    ("", "Parámetros (celdas amarillas = entradas que puedes cambiar; tienen nombre definido) → Calidad_datos (problemas y decisiones) → Facturas, Cobros y Aplicaciones (lo que carga Power Query + columnas calculadas) → Clientes (maestro + saldos) → Informe (una página) → Para_auditor (Subtotal) → Controles (control maestro) → Cómo se hizo."),
    ("", "Colores: amarillo = entrada; gris = calculado a partir de una entrada; verde/rojo en Controles = cuadra/no cuadra (además del texto VERDADERO/FALSO, para no depender solo del color)."),
    ("", ""),
    ("h", "Cómo actualizar en noviembre (una hora)"),
    ("", "1. Crea la carpeta Clientes\\2026-11\\ y guarda allí los CSV nuevos con el mismo nombre (sin abrirlos con doble clic)."),
    ("", "2. En Parámetros cambia FechaCorte (30/11/2026), Saldo430 (el que dé contabilidad), CarpetaDatos y las filas del CSV, duplicados y fila de total que veas al perfilar."),
    ("", "3. Datos > Actualizar todo (Ctrl+Alt+F5). Las Tablas, la tabla dinámica y el Informe se recalculan solos."),
    ("", "4. Mira Controles: si el control maestro no está en VERDADERO, busca el control en FALSO y su columna «Qué hacer»."),
    ("", "5. Revisa la consulta Aplicaciones: cobros agrupados nuevos con formatos de concepto distintos, formas de pago nuevas (fila en FormasPago) y clientes nuevos (Altas_ERP al maestro)."),
    ("", "6. Rehaz Para_auditor (copiar el detalle como valores, Subtotal) y exporta el Informe a PDF."),
    ("", ""),
    ("h", "Registro de cambios"),
    ("", "13/11/2026 · v01 · Primera versión con el cierre de octubre (corte 31/10/2026)."),
    ("", ""),
    ("h", "Contacto"),
    ("", "Administración (dudas sobre el libro) · Marta Ruiz, Dirección financiera (criterios)."),
]
lineas(ws, LEAME, 150)
ws.activate()

# ---------------------------------------------------------------- Parámetros
ws = wb.add_worksheet("Parámetros")
ws.set_column("A:A", 50)
ws.set_column("B:B", 22)
ws.set_column("C:C", 20)
ws.set_column("D:D", 70)
ws.set_column("E:E", 3)
ws.set_column("F:F", 28)
ws.set_column("G:G", 10)
ws.set_column("H:H", 3)
ws.set_column("I:I", 9)
ws.set_column("J:J", 18)
ws.write_string(0, 0, "Parámetros (las celdas amarillas son entradas)", f_t)
for j, h in enumerate(["Parámetro", "Valor", "Nombre definido", "Explicación"]):
    ws.write_string(2, j, h, f_cab)
P = [
    ("Fecha de corte", "FechaCorte", "fecha", serial(CORTE), "Foto del saldo. Cambiarla cada mes."),
    ("Saldo de la cuenta 430 según contabilidad (€)", "Saldo430", "eur", SALDO430, "Hoja Contabilidad de p3-datos.xlsx. Es la cifra con la que hay que cuadrar."),
    ("Vencido que preocupa: más de … días", "UmbralVencido", "int", UMBRAL, "Para el top 10 de Marta."),
    ("Plazo máximo legal entre empresas (días)", "DiasMaxLey", "int", DIAS_LEY, "Ley 3/2004, art. 4.3: no se puede pactar un plazo de más de 60 días naturales."),
    ("Meses de facturación para el PMC", "MesesPMC", "int", MESES_PMC, "PMC = saldo 430 / facturación con IVA de esos meses × sus días."),
    ("Inicio del periodo del PMC (calculado)", "InicioPMC", "calc", None, "=FECHA.MES(FechaCorte;-MesesPMC)+1 → 01/08/2026."),
    ("Tolerancia de cuadre (€)", "Tolerancia", "eur", 0.01, "Diferencia máxima admitida en los controles de importes."),
    ("Carpeta de los CSV del mes", "CarpetaDatos", "txt", "C:\\Clientes\\2026-10\\", "La leen las consultas de Power Query (acaba en \\)."),
    ("Filas de datos del CSV de facturas (sin cabecera)", "FilasCSV", "int", FILAS_CSV, "Perfilado: lo que cuenta Power Query antes de limpiar."),
    ("Duplicados exactos quitados", "DuplicadosQuitados", "int", N_DUP, "Calidad_datos, Q01."),
    ("Filas de total quitadas", "FilasTotal", "int", 1, "Calidad_datos, Q10."),
    ("Diferencia Total − (Base + Cuota) ya documentada (€)", "DifDocumentada", "eur", 100.0, "Calidad_datos, Q17: la factura de 100,00 € (los 4 céntimos de redondeo caben en la tolerancia)."),
]
fila_nombre = {}
for i, (et, nombre, tipo, valor, expl) in enumerate(P):
    r = 3 + i
    ws.write_string(r, 0, et)
    if tipo == "fecha":
        ws.write_number(r, 1, valor, f_in_fecha)
    elif tipo == "eur":
        ws.write_number(r, 1, valor, f_in_eur)
    elif tipo == "int":
        ws.write_number(r, 1, valor, f_in_int)
    elif tipo == "txt":
        ws.write_string(r, 1, valor, f_in)
    else:
        ws.write_formula(r, 1, "=EDATE(FechaCorte,-MesesPMC)+1", f_calc_fecha, serial(INI_PMC))
    ws.write_string(r, 2, nombre)
    ws.write_string(r, 3, expl, f_wrap)
    wb.define_name(nombre, f"='Parámetros'!$B${r + 1}")
    fila_nombre[nombre] = r
ws.write_string(16, 5, "Formas de pago (texto del ERP → días)", f_h)
tabla(ws, "FormasPago", 17, 5, [("FormaPago", None, None), ("Dias", None, f_in_int)], len(FORMAS),
      {"FormaPago": [a for a, _ in FORMAS], "Dias": [b for _, b in FORMAS]})
ws.write_string(16, 8, "Tramos de antigüedad (ordenados)", f_h)
tabla(ws, "Tramos", 17, 8, [("Desde", None, f_in_int), ("Tramo", None, f_in)], len(TRAMOS),
      {"Desde": [a for a, _ in TRAMOS], "Tramo": [b for _, b in TRAMOS]})
ws.write_string(25, 8, "«Desde» = primer día de retraso del tramo. La fila 0 recoge lo no vencido (días ≤ 0).", f_s)
ws.write_string(26, 8, "Para añadir un tramo (p. ej. «Más de 365»), añade una fila y cambia la etiqueta de la anterior.", f_s)
ws.write_string(16, 0, "Celdas amarillas: entradas. Nombres definidos: Fórmulas > Administrador de nombres.", f_s)

# ---------------------------------------------------------------- Calidad_datos
dev = C[C["TipoCobro"] == "Devolución"]
CAL = [
    ("Q19", "facturas", "UTF-8 con tildes y «ñ» (Peñaflor, Logroño…): con doble clic pueden salir caracteres rotos", FILAS_CSV, None,
     "Importar con Datos > De texto/CSV, Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma."),
    ("Q10", "facturas", "Última fila «TOTAL GENERAL» (incluye los duplicados)", 1, r2(float(fila_total["TotalFactura"])),
     "Quitada. Si se suma, todo sale el doble."),
    ("Q01", "facturas", f"Duplicados exactos: exportación solapada del {DUP_FECHAS[0]} y del {DUP_FECHAS[-1]}", N_DUP, DUP_EUR,
     "Comprobado que son idénticos en todas las columnas; quitados por NumFactura (nunca por cliente)."),
    ("Q05", "facturas", "TotalFactura con punto decimal («1234.56»); Base y Cuota con coma", len(F), None,
     "Cambiar tipo con configuración regional Inglés (Estados Unidos) solo en TotalFactura (o VALOR.NUMERO(F2;\".\";\",\"))."),
    ("Q04", "facturas", "CodCliente con espacios al final", N_ESP, None, "Recortar (ESPACIOS). Sin esto no casan con el maestro."),
    ("Q16", "facturas", "CodCliente «C0O45» (letra O en lugar de cero)", N_O45, O45_EUR, "Corregido a C0045 con el visto bueno de Marta."),
    ("Q16", "facturas", "Clientes C0322 y C0323 no están en el maestro (altas de octubre)", N_ALTAS_DOCS,
     r2(F.loc[F["CodCliente"].isin(["C0322", "C0323"]), "Total"].sum()), "Añadidos al maestro desde Altas_ERP."),
    ("Q17", "facturas", "Total ≠ Base + Cuota: 4 por ±0,01 (redondeo) y " + V["cien"] + " por +100,00 €", int(len(ANOM)), DIF_TBC,
     "Redondeos tolerados. La de 100 €: el cliente pagó Base + Cuota y quedan 100,00 € «pendientes»: se comunica a Marta (¿rectificativa?)."),
    ("Q09", "facturas", "FechaVencimiento vacía", N_VENC_VACIO, None, "Vencimiento = FechaFactura + días de la tabla FormasPago."),
    ("Q07", "facturas", "Tanda de facturas de marzo con las fechas en formato ISO (AAAA-MM-DD)", N_ISO, None,
     "Convertidas a fecha (Power Query o Texto en columnas con formato AMD)."),
    ("Q03", "facturas", "6 facturas a C0321 (Portugal) con IVA 0 %", 6, r2(F.loc[F["CodCliente"] == "C0321", "Total"].sum()),
     "No es un error: entrega intracomunitaria exenta. Se dejan como están."),
    ("—", "cobros", "NumFactura vacío", int((C["NumFactura"] == "").sum()), None,
     f"{int((C['TipoCobro'] == 'Agrupado').sum())} agrupados, {int((C['TipoCobro'] == 'Factura en el concepto').sum())} con una factura citada en el concepto y {int((C['TipoCobro'] == 'A cuenta').sum())} entregas a cuenta. Referencias extraídas del concepto (consulta Aplicaciones)."),
    ("Q21", "cobros", "Cobros agrupados (2 a 4 documentos en el concepto); algunos citan abonos R26", int((C["TipoCobro"] == "Agrupado").sum()),
     r2(C.loc[C["TipoCobro"] == "Agrupado", "Imp"].sum()),
     f"{int(sum(1 for i, g in A[A['NRefs'] > 1].groupby('IdCobro') if g['ImporteCobro'].iloc[0] < round(g['SumaCitada'].iloc[0], 2)))} no cubren todo: se aplican a la factura más antigua primero."),
    ("Q14", "cobros", "Devoluciones de recibo en negativo", int(len(dev)), r2(dev["Imp"].sum()),
     f"Restan al cobrado: reabren la factura. {int(dev['AntesCorte'].sum())} son anteriores al corte."),
    ("—", "cobros", "Entregas a cuenta sin factura", ACTA_N, ACTA_TOTAL, "Línea aparte «Cobros a cuenta pendientes de aplicar»; restan del saldo del cliente."),
    ("Q09", "cobros", "CodCliente vacío", int((C["CodCliente"] == "").sum()), None,
     "No afecta: los cobros se aplican por número de factura; las entregas a cuenta sí traen cliente."),
    ("—", "cobros", "Cobros posteriores al corte (01/11-13/11/2026)", int(len(COB_NOV)), r2(COB_NOV["Imp"].sum()), "No cuentan (foto a 31/10)."),
    ("—", "clientes", f"Cliente bloqueado ({BLOQ['CodCliente']}, desde el {F_BLOQ.strftime('%d/%m/%Y')}) con facturas posteriores", int(len(tras_bloq)),
     r2(tras_bloq["Pendiente"].sum()), "Se comunica: se le sigue sirviendo y no paga nada de lo facturado tras el bloqueo."),
    ("—", "clientes", "Clientes con días de pago pactados de más de 60 (75 o 90)", int(len(LEY)), r2(LEY["Saldo"].sum()),
     "Ley 3/2004, art. 4.3: no se puede pactar más de 60 días naturales. Se informa y se propone renegociar."),
    ("—", "clientes", "Clientes con saldo a favor (abono sin compensar)", int(len(FAVOR)), r2(FAVOR["Saldo"].sum()),
     "Lista aparte: no es deuda; hay que compensarlo o devolverlo."),
]
ws = wb.add_worksheet("Calidad_datos")
ws.write_string(0, 0, "Calidad de los datos: problema, filas afectadas, decisión", f_t)
ws.write_string(1, 0, "Perfilado del 13/11/2026 sobre los archivos de octubre. Importes con IVA.", f_s)
tabla(ws, "Calidad", 3, 0,
      [("Codigo", None, None), ("Archivo", None, None), ("Problema", None, f_wrap), ("Filas", None, f_int),
       ("Importe", None, f_eur), ("Decision", None, f_wrap)], len(CAL),
      {"Codigo": [x[0] for x in CAL], "Archivo": [x[1] for x in CAL], "Problema": [x[2] for x in CAL],
       "Filas": [x[3] for x in CAL], "Importe": [x[4] for x in CAL], "Decision": [x[5] for x in CAL]},
      [8, 10, 60, 8, 16, 80])

# ---------------------------------------------------------------- Facturas
ws = wb.add_worksheet("Facturas")
ws.freeze_panes(1, 1)
n = len(F)
FCOLS = [
    ("NumFactura", None, None), ("FechaFactura", None, f_fecha), ("CodCliente", None, None), ("NombreCliente", None, None),
    ("BaseImponible", None, f_num2), ("TipoIVA", None, f_int), ("CuotaIVA", None, f_num2), ("TotalFactura", None, f_num2),
    ("FormaPago", None, None), ("VencimientoERP", None, f_fecha),
    ("Serie", "LEFT([@NumFactura],3)", None),
    ("DifTotal", "ROUND([@TotalFactura]-([@BaseImponible]+[@CuotaIVA]),2)", f_num2),
    ("NombreMaestro", 'XLOOKUP([@CodCliente],Clientes[CodCliente],Clientes[Nombre],"HUÉRFANO")', None),
    ("Delegacion", 'XLOOKUP([@CodCliente],Clientes[CodCliente],Clientes[Delegacion],"")', None),
    ("Comercial", 'XLOOKUP([@CodCliente],Clientes[CodCliente],Clientes[CodComercial],"")', None),
    ("EstadoCliente", 'XLOOKUP([@CodCliente],Clientes[CodCliente],Clientes[Estado],"")', None),
    ("DiasForma", "VLOOKUP([@FormaPago],FormasPago,2,FALSE)", f_int),
    ("Vencimiento", 'IF([@VencimientoERP]="",[@FechaFactura]+[@DiasForma],[@VencimientoERP])', f_fecha),
    ("PlazoDias", "[@Vencimiento]-[@FechaFactura]", f_int),
    ("Cobrado", 'ROUND(SUMIFS(Cobros[Importe],Cobros[NumFactura],[@NumFactura],Cobros[FechaCobro],"<="&FechaCorte)'
                '+SUMIFS(Aplicaciones[Aplicado],Aplicaciones[NumFactura],[@NumFactura],Aplicaciones[FechaCobro],"<="&FechaCorte),2)', f_num2),
    ("Pendiente", "ROUND([@TotalFactura]-[@Cobrado],2)", f_num2),
    ("Estado", 'IF(ABS([@Pendiente])<0.005,"Cobrada",IF([@Pendiente]<0,"Saldo a favor",'
               'IF(ABS([@Pendiente]-[@TotalFactura])<0.005,"Pendiente","Parcial")))', None),
    ("DiasVencidos", "FechaCorte-[@Vencimiento]", f_int),
    ("DiasDesdeFactura", "FechaCorte-[@FechaFactura]", f_int),
    ("Tramo", "IF([@DiasVencidos]<=0,INDEX(Tramos[Tramo],1),VLOOKUP([@DiasVencidos],Tramos,2,TRUE))", None),
]
FV = {
    "NumFactura": F["NumFactura"].tolist(), "FechaFactura": [serial(d) for d in F["FechaF"]],
    "CodCliente": F["CodCliente"].tolist(), "NombreCliente": F["NombreCliente"].tolist(),
    "BaseImponible": F["Base"].tolist(), "TipoIVA": F["Tipo"].tolist(), "CuotaIVA": F["Cuota"].tolist(),
    "TotalFactura": F["Total"].tolist(), "FormaPago": F["FormaPago"].tolist(),
    "VencimientoERP": [serial(d) if d is not None else None for d in F["VencERP"]],
    "Serie": F["Serie"].tolist(), "DifTotal": F["Dif"].tolist(), "NombreMaestro": F["NombreMaestro"].tolist(),
    "Delegacion": F["Delegacion"].tolist(), "Comercial": F["Comercial"].tolist(), "EstadoCliente": F["EstadoCliente"].tolist(),
    "DiasForma": F["DiasForma"].tolist(), "Vencimiento": [serial(d) for d in F["Venc"]], "PlazoDias": F["Plazo"].tolist(),
    "Cobrado": F["Cobrado"].tolist(), "Pendiente": F["Pendiente"].tolist(), "Estado": F["Estado"].tolist(),
    "DiasVencidos": F["DiasVencidos"].tolist(), "DiasDesdeFactura": F["DiasDesdeFactura"].tolist(), "Tramo": F["Tramo"].tolist(),
}
tabla(ws, "Facturas", 0, 0, FCOLS, n, FV,
      [12, 11, 10, 36, 12, 7, 11, 12, 24, 11, 6, 8, 36, 10, 9, 10, 8, 11, 8, 12, 12, 12, 9, 9, 15])

# ---------------------------------------------------------------- Cobros
ws = wb.add_worksheet("Cobros")
ws.freeze_panes(1, 1)
CCOLS = [
    ("IdCobro", None, None), ("FechaCobro", None, f_fecha), ("CodCliente", None, None), ("Importe", None, f_num2),
    ("NumFactura", None, None), ("Concepto", None, None), ("Medio", None, None), ("Remesa", None, None),
    ("NRefs", "COUNTIF(Aplicaciones[IdCobro],[@IdCobro])", f_int),
    ("Tipo", 'IF([@NumFactura]<>"",IF([@Importe]<0,"Devolución","Directo"),'
             'IF([@NRefs]=0,"A cuenta",IF([@NRefs]=1,"Factura en el concepto","Agrupado")))', None),
    ("AntesCorte", "[@FechaCobro]<=FechaCorte", None),
]
CV = {"IdCobro": C["IdCobro"].tolist(), "FechaCobro": [serial(d) for d in C["Fecha"]], "CodCliente": C["CodCliente"].tolist(),
      "Importe": C["Imp"].tolist(), "NumFactura": C["NumFactura"].tolist(), "Concepto": C["Concepto"].tolist(),
      "Medio": C["Medio"].tolist(), "Remesa": C["Remesa"].tolist(), "NRefs": C["NRefs"].tolist(),
      "Tipo": C["TipoCobro"].tolist(), "AntesCorte": C["AntesCorte"].tolist()}
tabla(ws, "Cobros", 0, 0, CCOLS, len(C), CV, [10, 11, 10, 12, 12, 70, 13, 15, 7, 21, 11])

# ---------------------------------------------------------------- Aplicaciones
ws = wb.add_worksheet("Aplicaciones")
ws.freeze_panes(1, 2)
ACOLS = [
    ("IdCobro", None, None), ("NumFactura", None, None),
    ("FechaCobro", "INDEX(Cobros[FechaCobro],MATCH([@IdCobro],Cobros[IdCobro],0))", f_fecha),
    ("ImporteCobro", "INDEX(Cobros[Importe],MATCH([@IdCobro],Cobros[IdCobro],0))", f_num2),
    ("NRefs", "COUNTIF(Aplicaciones[IdCobro],[@IdCobro])", f_int),
    ("Existe", "COUNTIF(Facturas[NumFactura],[@NumFactura])>0", None),
    ("TotalDoc", "SUMIFS(Facturas[TotalFactura],Facturas[NumFactura],[@NumFactura])", f_num2),
    ("FechaDoc", "INDEX(Facturas[FechaFactura],MATCH([@NumFactura],Facturas[NumFactura],0))", f_fecha),
    ("SumaCitada", "ROUND(SUMIFS(Aplicaciones[TotalDoc],Aplicaciones[IdCobro],[@IdCobro]),2)", f_num2),
    ("Previo", 'SUMIFS(Aplicaciones[TotalDoc],Aplicaciones[IdCobro],[@IdCobro],Aplicaciones[FechaDoc],"<"&[@FechaDoc])'
               '+SUMIFS(Aplicaciones[TotalDoc],Aplicaciones[IdCobro],[@IdCobro],Aplicaciones[FechaDoc],[@FechaDoc],Aplicaciones[NumFactura],"<"&[@NumFactura])', f_num2),
    ("Aplicado", "ROUND(IF([@NRefs]=1,[@ImporteCobro],IF([@ImporteCobro]>=[@SumaCitada],[@TotalDoc],"
                 "MIN([@TotalDoc],MAX(0,[@ImporteCobro]-[@Previo])))),2)", f_num2),
]
AV = {"IdCobro": A["IdCobro"].tolist(), "NumFactura": A["NumFactura"].tolist(), "FechaCobro": [serial(d) for d in A["FechaCobro"]],
      "ImporteCobro": A["ImporteCobro"].tolist(), "NRefs": A["NRefs"].tolist(), "Existe": A["Existe"].tolist(),
      "TotalDoc": A["TotalDoc"].tolist(), "FechaDoc": [serial(d) for d in A["FechaDoc"]],
      "SumaCitada": A["SumaCitada"].round(2).tolist(), "Previo": A["Previo"].round(2).tolist(), "Aplicado": A["Aplicado"].tolist()}
tabla(ws, "Aplicaciones", 0, 0, ACOLS, len(A), AV, [10, 12, 11, 12, 7, 8, 12, 11, 12, 12, 12])
ws.write_string(0, 12, "Una fila por documento citado en el concepto de un cobro sin NumFactura (consulta Aplicaciones).", f_s)
ws.write_string(1, 12, "Regla de Marta: si el cobro cubre todo lo citado, cada documento entero; si no, primero el más antiguo.", f_s)
ws.set_column(12, 12, 90)

# ---------------------------------------------------------------- Clientes
ws = wb.add_worksheet("Clientes")
ws.freeze_panes(1, 2)
KCOLS = [("CodCliente", None, None), ("Nombre", None, None), ("NIF", None, None), ("Poblacion", None, None),
         ("Provincia", None, None), ("Delegacion", None, None), ("CodComercial", None, None), ("DiasPago", None, f_int),
         ("LimiteRiesgo", None, f_num2), ("Estado", None, None), ("Observaciones", None, None), ("Origen", None, None),
         ("SaldoDocumentos", "SUMIFS(Facturas[Pendiente],Facturas[CodCliente],[@CodCliente])", f_num2),
         ("ACuenta", 'SUMIFS(Cobros[Importe],Cobros[CodCliente],[@CodCliente],Cobros[Tipo],"A cuenta",Cobros[FechaCobro],"<="&FechaCorte)', f_num2),
         ("Saldo", "[@SaldoDocumentos]-[@ACuenta]", f_num2)]
for k, col in enumerate(COLS_TRAMO):
    KCOLS.append((col, f"SUMIFS(Facturas[Pendiente],Facturas[CodCliente],[@CodCliente],Facturas[Tramo],INDEX(Tramos[Tramo],{k + 1}))", f_num2))
KCOLS += [("VencidoMas60", 'SUMIFS(Facturas[Pendiente],Facturas[CodCliente],[@CodCliente],Facturas[DiasVencidos],">"&UmbralVencido)', f_num2),
          ("Exceso", "[@Saldo]-[@LimiteRiesgo]", f_num2),
          ("SuperaLimite", "[@Saldo]>[@LimiteRiesgo]", None),
          ("PlazoMas60", "[@DiasPago]>DiasMaxLey", None)]
KV = {c: CL[c].tolist() for c, _, _ in KCOLS}
tabla(ws, "Clientes", 0, 0, KCOLS, len(CL), KV,
      [10, 40, 12, 22, 16, 10, 10, 8, 12, 10, 30, 22, 14, 11, 13] + [12] * 6 + [13, 12, 11, 11])
nk = len(CL)
ws.conditional_format(1, KCOLS.index(("SuperaLimite", "[@Saldo]>[@LimiteRiesgo]", None)), nk,
                      KCOLS.index(("SuperaLimite", "[@Saldo]>[@LimiteRiesgo]", None)),
                      {"type": "cell", "criteria": "==", "value": "TRUE", "format": f_ko})

# ---------------------------------------------------------------- Informe
ws = wb.add_worksheet("Informe")
ws.hide_gridlines(2)
ws.set_landscape()
ws.set_paper(9)
ws.fit_to_pages(1, 1)
ws.set_margins(0.4, 0.4, 0.5, 0.5)
ws.print_area(0, 0, 47, 14)
ws.set_column("A:A", 40)
ws.set_column("B:B", 15)
ws.set_column("C:H", 11)
ws.set_column("I:I", 2)
ws.set_column("J:J", 8)
ws.set_column("K:K", 38)
ws.set_column("L:N", 13)
ws.set_column("O:O", 2)
titulo = "Lo que nos deben los clientes a " + CORTE.strftime("%d/%m/%Y")
ws.write_formula(0, 0, '="Lo que nos deben los clientes a "&TEXT(DAY(FechaCorte),"00")&"/"&TEXT(MONTH(FechaCorte),"00")&"/"&YEAR(FechaCorte)',
                 f_t, titulo)
ws.write_string(1, 0, "Electro Cierzo Suministros, S.L. · Comité de dirección · Importes con IVA · Antigüedad desde el vencimiento", f_s)
ws.write_formula(2, 0, '=IF(ControlMaestro,"Controles: OK (todo cuadra con la 430)","Controles: REVISAR (ver hoja Controles)")',
                 f_estado, "Controles: OK (todo cuadra con la 430)")
ws.conditional_format(2, 0, 2, 0, {"type": "formula", "criteria": "=ControlMaestro", "format": f_ok})
ws.conditional_format(2, 0, 2, 0, {"type": "formula", "criteria": "=NOT(ControlMaestro)", "format": f_ko})
# Cifras clave
ws.write_string(4, 0, "Cifras clave", f_h)
ws.write_string(4, 1, "€", f_h)
ws.write_string(4, 2, "% s/ pendiente", f_h)
KPI = [
    ("Pendiente de cobro de facturas y abonos", "=SUM(Facturas[Pendiente])", PEND, f_eur),
    ("Menos: cobros a cuenta pendientes de aplicar", '=SUMIFS(Cobros[Importe],Cobros[Tipo],"A cuenta",Cobros[FechaCobro],"<="&FechaCorte)', ACTA_TOTAL, f_eur),
    ("Saldo de clientes (cuenta 430)", "=B6-B7", SALDO430, f_eur_b),
    ("Saldo 430 según contabilidad", "=Saldo430", SALDO430, f_eur),
    ("Diferencia", "=ROUND(B8-B9,2)", 0.0, f_eur),
    ("Vencido (todos los tramos)", '=SUMIFS(Facturas[Pendiente],Facturas[DiasVencidos],">0")', VENCIDO, f_eur),
    ("Vencido a más de 60 días", '=SUMIFS(Facturas[Pendiente],Facturas[DiasVencidos],">"&UmbralVencido)', VENC60, f_eur_b),
    ("Facturación con IVA del 01/08 al 31/10 (base del PMC)",
     '=SUMIFS(Facturas[TotalFactura],Facturas[FechaFactura],">="&InicioPMC,Facturas[FechaFactura],"<="&FechaCorte)', FACT_PMC, f_eur),
    ("Periodo medio de cobro aproximado (días)", "=B8/B13*(FechaCorte-InicioPMC+1)", PMC, f_dias),
]
for i, (et, form, val, fm) in enumerate(KPI):
    ws.write_string(5 + i, 0, et, f_b if fm in (f_eur_b,) else None)
    ws.write_formula(5 + i, 1, form, fm, val)
ws.write_formula(10, 2, "=B11/B6", f_pct, VENCIDO / PEND)
ws.write_formula(11, 2, "=B12/B6", f_pct, VENC60 / PEND)
ws.write_formula(12, 0, '="Facturación con IVA del "&TEXT(DAY(InicioPMC),"00")&"/"&TEXT(MONTH(InicioPMC),"00")&" al "&TEXT(DAY(FechaCorte),"00")&"/"&TEXT(MONTH(FechaCorte),"00")&" (base del PMC)"',
                 None, "Facturación con IVA del 01/08 al 31/10 (base del PMC)")
# Tramos
ws.write_string(15, 0, "Antigüedad desde el vencimiento", f_h)
ws.write_string(15, 1, "Pendiente €", f_h)
ws.write_string(15, 2, "% del total", f_h)
for k, (_, t) in enumerate(TRAMOS):
    r = 16 + k
    ws.write_formula(r, 0, f"=INDEX(Tramos[Tramo],{k + 1})", None, t)
    ws.write_formula(r, 1, f"=SUMIFS(Facturas[Pendiente],Facturas[Tramo],A{r + 1})", f_eur, POR_TRAMO[t])
    ws.write_formula(r, 2, f"=B{r + 1}/$B$23", f_pct, POR_TRAMO[t] / PEND)
ws.write_string(22, 0, "Total", f_b)
ws.write_formula(22, 1, "=SUM(B17:B22)", f_eur_tot, PEND)
ws.write_formula(22, 2, "=SUM(C17:C22)", f_pct_tot, 1.0)
# Delegación × tramo (para el gráfico)
ws.write_string(24, 0, "Pendiente por delegación y tramo (€)", f_h)
f_cab_s = fmt(bold=True, text_wrap=True, bg_color="#D9E1F2", font_size=9, align="center")
ws.write_string(25, 0, "Delegación", f_cab_s)
for k, (_, t) in enumerate(TRAMOS):
    ws.write_formula(25, 1 + k, f"=INDEX(Tramos[Tramo],{k + 1})", f_cab_s, t)
ws.write_string(25, 7, "Total", f_cab_s)
DT = {}
for i, d in enumerate(DELEGACIONES):
    r = 26 + i
    ws.write_string(r, 0, d)
    for k, (_, t) in enumerate(TRAMOS):
        v = r2(F.loc[(F["Delegacion"] == d) & (F["Tramo"] == t), "Pendiente"].sum())
        DT[(d, t)] = v
        col = xlsxwriter.utility.xl_col_to_name(1 + k)
        ws.write_formula(r, 1 + k, f"=SUMIFS(Facturas[Pendiente],Facturas[Delegacion],$A{r + 1},Facturas[Tramo],{col}$26)", f_num2, v)
    ws.write_formula(r, 7, f"=SUM(B{r + 1}:G{r + 1})", f_num2, r2(sum(DT[(d, t)] for _, t in TRAMOS)))
ws.write_string(29, 0, "Total", f_b)
for k in range(7):
    col = xlsxwriter.utility.xl_col_to_name(1 + k)
    v = r2(sum(DT[(d, t)] for d in DELEGACIONES for _, t in TRAMOS)) if k == 6 else r2(sum(DT[(d, TRAMOS[k][1])] for d in DELEGACIONES))
    ws.write_formula(29, 1 + k, f"=SUM({col}27:{col}29)", f_num2, v)
ch = wb.add_chart({"type": "column", "subtype": "stacked"})
COLORES = ["#A9D18E", "#FFE699", "#F4B183", "#ED7D31", "#C55A11", "#843C0C"]
for k in range(len(TRAMOS)):
    col = 1 + k
    ch.add_series({"name": ["Informe", 25, col], "categories": ["Informe", 26, 0, 28, 0],
                   "values": ["Informe", 26, col, 28, col], "fill": {"color": COLORES[k]}, "border": {"color": "#FFFFFF"}})
ch.set_title({"name": "Pendiente por delegación y tramo de antigüedad", "name_font": {"size": 11}})
ch.set_y_axis({"num_format": '#,##0 "€"', "major_gridlines": {"visible": True, "line": {"color": "#D9D9D9"}}})
ch.set_legend({"position": "bottom", "font": {"size": 8}})
ws.insert_chart(31, 0, ch, {"x_scale": 1.55, "y_scale": 1.05,
                            "description": "Columnas apiladas: pendiente de Zaragoza, Pamplona y Lleida repartido en los seis tramos de antigüedad; "
                                           "en las tres delegaciones la mayor parte no está vencida."})
# Lado derecho: listas dinámicas (Microsoft 365)


def bloque(fila, titulo, cabs, formula, filas_res, valores_ancla, formatos, sin_espacio=None):
    ws.write_string(fila, 9, titulo, f_h)
    for j in range(1, len(cabs)):
        ws.write_blank(fila, 9 + j, None, f_h)
    for j, c in enumerate(cabs):
        ws.write_string(fila + 1, 9 + j, c, f_cab)
    for i in range(filas_res):
        for j, fm in enumerate(formatos):
            if fm is not None:
                ws.write_blank(fila + 2 + i, 9 + j, None, fm)
    ws.write_dynamic_array_formula(fila + 2, 9, fila + 2, 9, formula, None, valores_ancla)


bloque(4, "Top 10: vencido a más de 60 días", ["Código", "Cliente", "Vencido >60 d (€)"],
       "=TAKE(SORTBY(HSTACK(Clientes[[CodCliente]:[Nombre]],Clientes[VencidoMas60]),Clientes[VencidoMas60],-1),10)",
       10, TOP10.iloc[0]["CodCliente"], [None, None, f_eur])
bloque(17, "Clientes por encima de su límite de riesgo", ["Código", "Cliente", "Saldo (€)", "Límite (€)", "Exceso (€)"],
       '=IFERROR(SORT(FILTER(HSTACK(Clientes[[CodCliente]:[Nombre]],Clientes[Saldo],Clientes[LimiteRiesgo],Clientes[Exceso]),'
       'Clientes[SuperaLimite]),5,-1),"Ninguno")',
       6, SUPERA.iloc[0]["CodCliente"], [None, None, f_eur, f_eur, f_eur])
ws.write_string(26, 9, "Ley 3/2004: plazos pactados de más de 60 días", f_h)
for j in range(1, 5):
    ws.write_blank(26, 9 + j, None, f_h)
ws.write_string(27, 9, "Clientes con más de 60 días pactados")
ws.write_formula(27, 12, '=COUNTIF(Clientes[DiasPago],">"&DiasMaxLey)', f_int, len(LEY))
ws.write_string(28, 9, "Documentos con vencimiento a más de 60 días de la fecha de factura")
ws.write_formula(28, 12, '=COUNTIF(Facturas[PlazoDias],">"&DiasMaxLey)', f_int, DOCS_PLAZO)
ws.write_string(29, 9, "Pendiente de esos documentos (€)")
ws.write_formula(29, 12, '=SUMIFS(Facturas[Pendiente],Facturas[PlazoDias],">"&DiasMaxLey)', f_eur, PEND_PLAZO)
for j, c in enumerate(["Código", "Cliente", "Días pactados", "Saldo (€)"]):
    ws.write_string(30, 9 + j, c, f_cab)
for i in range(8):
    ws.write_blank(31 + i, 11, None, f_int)
    ws.write_blank(31 + i, 12, None, f_eur)
ws.write_dynamic_array_formula(31, 9, 31, 9,
                               '=FILTER(HSTACK(Clientes[[CodCliente]:[Nombre]],Clientes[DiasPago],Clientes[Saldo]),Clientes[PlazoMas60],"Ninguno")',
                               None, LEY.iloc[0]["CodCliente"])
bloque(39, "Saldos a favor del cliente (no es deuda: compensar o devolver)", ["Código", "Cliente", "Saldo (€)"],
       '=FILTER(HSTACK(Clientes[[CodCliente]:[Nombre]],Clientes[Saldo]),Clientes[Saldo]<0,"Ninguno")',
       3, FAVOR.iloc[0]["CodCliente"], [None, None, f_eur])
AVISOS = [
    f"Cliente bloqueado {BLOQ['CodCliente']} ({BLOQ['Nombre']}): desde el bloqueo ({F_BLOQ.strftime('%d/%m/%Y')}) se le han emitido "
    f"{len(tras_bloq)} facturas por {tras_bloq['Total'].sum():,.2f} €, todas pendientes. Además supera su límite.".replace(",", "X").replace(".", ",").replace("X", "."),
    f"Factura {V['cien']}: el total del ERP es 100,00 € mayor que Base + Cuota; el cliente pagó Base + Cuota y quedan 100,00 € pendientes. ¿Rectificativa?",
]
ws.write_string(45, 9, "Avisos de este cierre", f_h)
for i, a in enumerate(AVISOS):
    ws.merge_range(46 + i, 9, 46 + i, 13, a, f_aviso)
    ws.set_row(46 + i, 30)

# ---------------------------------------------------------------- Para_auditor
ws = wb.add_worksheet("Para_auditor")
ws.outline_settings(True, False, True, False)
ws.write_string(0, 0, "Documentos pendientes a 31/10/2026, por cliente (Datos > Esquema > Subtotal: suma de Pendiente por CodCliente; esquema en el nivel 2)", f_b)
cab = ["CodCliente", "Nombre", "NumFactura", "FechaFactura", "Vencimiento", "DiasDesdeFactura", "DiasVencidos", "Tramo", "Pendiente"]
for j, c in enumerate(cab):
    ws.write_string(2, j, c, f_cab)
for j, a in enumerate([11, 40, 12, 12, 12, 10, 10, 15, 14]):
    ws.set_column(j, j, a)
PA = F[F["Pendiente"].abs() >= 0.005].sort_values(["CodCliente", "FechaF", "NumFactura"])
r = 3
for c, g in PA.groupby("CodCliente", sort=True):
    ini = r
    for x in g.itertuples():
        ws.write_string(r, 0, x.CodCliente)
        ws.write_string(r, 1, x.NombreMaestro)
        ws.write_string(r, 2, x.NumFactura)
        ws.write_number(r, 3, serial(x.FechaF), f_fecha)
        ws.write_number(r, 4, serial(x.Venc), f_fecha)
        ws.write_number(r, 5, x.DiasDesdeFactura, f_int)
        ws.write_number(r, 6, x.DiasVencidos, f_int)
        ws.write_string(r, 7, x.Tramo)
        ws.write_number(r, 8, x.Pendiente, f_num2)
        ws.set_row(r, None, None, {"level": 2, "hidden": True})
        r += 1
    ws.write_string(r, 0, f"Total {c}", f_b)
    ws.write_formula(r, 8, f"=SUBTOTAL(9,I{ini + 1}:I{r})", f_eur_b, r2(g["Pendiente"].sum()))
    ws.set_row(r, None, None, {"level": 1, "collapsed": True})
    r += 1
ws.write_string(r, 0, "Total general", f_b)
ws.write_formula(r, 8, f"=SUBTOTAL(9,I4:I{r})", f_eur_tot, PEND)
ws.write_string(1, 0, "Copia en valores del detalle (Subtotal no funciona dentro de una Tabla). Se rehace cada mes.", f_s)
FILA_TOTAL_AUD = r

# ---------------------------------------------------------------- Controles
ws = wb.add_worksheet("Controles")
ws.write_string(0, 0, "Controles (cada mes, antes de enviar nada)", f_t)
ws.set_column("A:A", 4)
ws.set_column("B:B", 62)
ws.set_column("C:F", 15)
ws.set_column("G:G", 12)
ws.set_column("H:H", 70)
ws.write_string(2, 1, "CONTROL MAESTRO (todos en VERDADERO)", f_b)
for j, h in enumerate(["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Estado", "Qué hacer si falla"]):
    ws.write_string(4, j, h, f_cab)
CTRL = [
    ("Documentos tras limpiar = filas del CSV − duplicados − fila de total", "=FilasCSV-DuplicadosQuitados-FilasTotal",
     "=ROWS(Facturas[NumFactura])", len(F), len(F), 0, "Revisa que hayas quitado la fila TOTAL GENERAL y los duplicados de julio, y nada más."),
    ("NumFactura repetidos en Facturas", "=0", "=SUMPRODUCT(--(COUNTIF(Facturas[NumFactura],Facturas[NumFactura])>1))", 0, 0, 0,
     "Quedan duplicados: Quitar duplicados por NumFactura tras comprobar que son idénticos."),
    ("Σ Total − (Σ Base + Σ Cuota): solo la diferencia documentada", "=DifDocumentada",
     "=SUM(Facturas[TotalFactura])-SUM(Facturas[BaseImponible])-SUM(Facturas[CuotaIVA])", 100.0, DIF_TBC, 0.04,
     "Si sale de miles o millones, TotalFactura se ha leído con la coma española: cámbialo con configuración regional Inglés (EE. UU.)."),
    ("Σ por tramos (Informe) = Σ Pendiente del detalle", "=SUM(Facturas[Pendiente])", "=Informe!B23", PEND, PEND, "=Tolerancia",
     "Algún documento sin tramo: mira la tabla Tramos (ordenada de menor a mayor)."),
    ("Σ Cobrado de facturas = cobros con factura + aplicaciones (hasta el corte)",
     '=SUMIFS(Cobros[Importe],Cobros[NumFactura],"<>",Cobros[FechaCobro],"<="&FechaCorte)+SUMIFS(Aplicaciones[Aplicado],Aplicaciones[FechaCobro],"<="&FechaCorte)',
     "=SUM(Facturas[Cobrado])", r2(F["Cobrado"].sum()), r2(F["Cobrado"].sum()), "=Tolerancia",
     "Hay cobros que citan facturas que no están (o con espacios): mira el control 9."),
    ("Cobros agrupados y de concepto repartidos enteros (Σ aplicado = Σ importe)",
     '=SUMIFS(Cobros[Importe],Cobros[NRefs],">0",Cobros[FechaCobro],"<="&FechaCorte)',
     '=SUMIFS(Aplicaciones[Aplicado],Aplicaciones[FechaCobro],"<="&FechaCorte)', r2(Ac["Aplicado"].sum()), r2(Ac["Aplicado"].sum()), "=Tolerancia",
     "Revisa la regla del cobro agrupado (columna Aplicado) y que el concepto no cite documentos de más."),
    ("Saldo de clientes (pendiente − a cuenta) = saldo 430 de contabilidad", "=Saldo430", "=Informe!B8", SALDO430, SALDO430, "=Tolerancia",
     "Mira por este orden: fecha de corte, cobros de noviembre, entregas a cuenta, devoluciones, duplicados."),
    ("Σ saldo por clientes = Σ Pendiente del detalle (ningún cliente fuera del maestro)", "=SUM(Facturas[Pendiente])",
     "=SUM(Clientes[SaldoDocumentos])", PEND, PEND, "=Tolerancia", "Falta algún cliente en el maestro (altas del mes) o hay códigos con espacios."),
    ("Clientes sin pareja (HUÉRFANO) en Facturas", "=0", '=COUNTIF(Facturas[NombreMaestro],"HUÉRFANO")', 0, 0, 0,
     "Da de alta el cliente (Altas_ERP) o corrige el código."),
    ("Cobros que citan una factura que no existe", "=0",
     '=SUMPRODUCT((Cobros[NumFactura]<>"")*(COUNTIF(Facturas[NumFactura],Cobros[NumFactura])=0))+COUNTIF(Aplicaciones[Existe],FALSE)', 0, 0, 0,
     "Busca el número en el CSV de facturas; si es de otro año, pide el pendiente de ese año."),
    ("Formas de pago sin días en la tabla FormasPago", "=0", "=SUMPRODUCT(--ISNA(Facturas[DiasForma]))", 0, 0, 0,
     "Forma de pago nueva: añade una fila a FormasPago (y avisa si son más de 60 días)."),
]
for i, (desc, esp_f, obt_f, esp_v, obt_v, tol, que) in enumerate(CTRL):
    r = 5 + i
    ws.write_number(r, 0, i + 1)
    ws.write_string(r, 1, desc, f_wrap)
    num = f_num2
    ws.write_formula(r, 2, esp_f, num, esp_v)
    ws.write_formula(r, 3, obt_f, num, obt_v)
    ws.write_formula(r, 4, f"=ROUND(D{r + 1}-C{r + 1},2)", num, r2(obt_v - esp_v))
    if isinstance(tol, str):
        ws.write_formula(r, 5, tol, num, 0.01)
    else:
        ws.write_number(r, 5, tol, num)
    ws.write_formula(r, 6, f"=ABS(E{r + 1})<=F{r + 1}+0.000001", None, True)
    ws.write_string(r, 7, que, f_wrap)
ult = 5 + len(CTRL)
ws.write_formula(2, 6, f"=AND(G6:G{ult})", f_estado, True)
wb.define_name("ControlMaestro", "=Controles!$G$3")
ws.conditional_format(5, 6, ult - 1, 6, {"type": "cell", "criteria": "==", "value": "TRUE", "format": f_ok})
ws.conditional_format(5, 6, ult - 1, 6, {"type": "cell", "criteria": "==", "value": "FALSE", "format": f_ko})
ws.conditional_format(2, 6, 2, 6, {"type": "cell", "criteria": "==", "value": "TRUE", "format": f_ok})
ws.conditional_format(2, 6, 2, 6, {"type": "cell", "criteria": "==", "value": "FALSE", "format": f_ko})
ws.write_string(ult + 1, 1, "Informativos (no entran en el control maestro):", f_b)
INFO = [("Cobros posteriores al corte que no cuentan", '=COUNTIF(Cobros[AntesCorte],FALSE)', len(COB_NOV), f_int),
        ("Entregas a cuenta hasta el corte (nº)", '=COUNTIFS(Cobros[Tipo],"A cuenta",Cobros[AntesCorte],TRUE)', ACTA_N, f_int),
        ("Cobros agrupados (nº)", '=COUNTIF(Cobros[Tipo],"Agrupado")', int((C["TipoCobro"] == "Agrupado").sum()), f_int),
        ("Total general de Para_auditor (debe ser igual al pendiente)", f"=Para_auditor!I{FILA_TOTAL_AUD + 1}", PEND, f_num2)]
for i, (d, fo, v, fm) in enumerate(INFO):
    ws.write_string(ult + 2 + i, 1, d)
    ws.write_formula(ult + 2 + i, 3, fo, fm, v)

# ---------------------------------------------------------------- Cómo se hizo
ws = wb.add_worksheet("Cómo se hizo")
ws.hide_gridlines(2)
COMO = [
    ("t", "Cómo se hizo (lo que la librería no puede guardar: consultas, tabla dinámica, segmentaciones)"),
    ("s", "Fórmulas en español con «;». En este libro, Facturas, Cobros y Aplicaciones son lo que cargan las consultas; las columnas de la derecha son columnas calculadas."),
    ("", ""),
    ("h", "1. Importar con Power Query (Datos > Obtener y transformar datos > De texto/CSV)"),
    ("", "Facturas: Origen del archivo 65001: Unicode (UTF-8); Delimitador: Punto y coma; Transformar datos. En el editor:"),
    ("", "  · Filtrar NumFactura ≠ «TOTAL GENERAL» (Q10)."),
    ("", "  · Antes de quitar duplicados, comprobar que las 14 filas repetidas son idénticas: Inicio > Mantener filas > Mantener duplicados. Después, Inicio > Quitar filas > Quitar duplicados (todas las columnas seleccionadas)."),
    ("", "  · CodCliente: Transformar > Formato > Recortar; Reemplazar valores «C0O45» por «C0045» (anotado en Calidad_datos)."),
    ("", "  · TotalFactura: clic derecho en el encabezado > Cambiar tipo > Usar configuración regional… > Decimal, Inglés (Estados Unidos). BaseImponible y CuotaIVA: Decimal con Español (España)."),
    ("", "  · Fechas: la tanda ISO de marzo se convierte con la función AFecha del código de abajo (o, sin Power Query, Texto en columnas con formato AMD solo en esas filas)."),
    ("", "  · Cerrar y cargar en > Tabla, en la hoja Facturas. Las columnas calculadas (Vencimiento, Cobrado, Tramo…) se escriben después en la Tabla, a la derecha."),
    ("", "Cobros: igual (FechaCobro con Español (España); Importe Decimal con Español (España))."),
    ("", "Aplicaciones: clic derecho en la consulta Cobros > Referencia; filtrar NumFactura vacío; columna personalizada con las referencias del concepto; Expandir a nuevas filas; quitar nulos; dejar IdCobro y NumFactura."),
    ("", "Código de las consultas (Inicio > Editor avanzado). CarpetaDatos es el nombre definido de Parámetros:"),
    ("m", 'Facturas = let'),
    ("m", '  Carpeta = Excel.CurrentWorkbook(){[Name="CarpetaDatos"]}[Content]{0}[Column1],'),
    ("m", '  Origen = Csv.Document(File.Contents(Carpeta & "p3-facturas-emitidas.csv"), [Delimiter=";", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),'),
    ("m", '  Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),'),
    ("m", '  SinTotal = Table.SelectRows(Encabezados, each [NumFactura] <> "TOTAL GENERAL"),'),
    ("m", '  SinDuplicados = Table.Distinct(SinTotal),'),
    ("m", '  Recortado = Table.TransformColumns(SinDuplicados, {{"CodCliente", Text.Trim, type text}}),'),
    ("m", '  Errata = Table.ReplaceValue(Recortado, "C0O45", "C0045", Replacer.ReplaceValue, {"CodCliente"}),'),
    ("m", '  AFecha = (t as text) as nullable date => if t = "" then null else if Text.Contains(t, "-")'),
    ("m", '      then #date(Number.From(Text.Start(t, 4)), Number.From(Text.Middle(t, 5, 2)), Number.From(Text.End(t, 2)))'),
    ("m", '      else #date(Number.From(Text.End(t, 4)), Number.From(Text.Middle(t, 3, 2)), Number.From(Text.Start(t, 2))),'),
    ("m", '  Fechas = Table.TransformColumns(Errata, {{"FechaFactura", AFecha, type date}, {"FechaVencimiento", AFecha, type nullable date}}),'),
    ("m", '  NumerosES = Table.TransformColumnTypes(Fechas, {{"BaseImponible", type number}, {"CuotaIVA", type number}, {"TipoIVA", Int64.Type}}, "es-ES"),'),
    ("m", '  TotalUS = Table.TransformColumnTypes(NumerosES, {{"TotalFactura", type number}}, "en-US"),'),
    ("m", '  Renombrado = Table.RenameColumns(TotalUS, {{"FechaVencimiento", "VencimientoERP"}})'),
    ("m", 'in Renombrado'),
    ("m", ''),
    ("m", 'Cobros = let'),
    ("m", '  Carpeta = Excel.CurrentWorkbook(){[Name="CarpetaDatos"]}[Content]{0}[Column1],'),
    ("m", '  Origen = Csv.Document(File.Contents(Carpeta & "p3-cobros-2026.csv"), [Delimiter=";", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),'),
    ("m", '  Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars=true]),'),
    ("m", '  Tipos = Table.TransformColumnTypes(Encabezados, {{"FechaCobro", type date}, {"Importe", type number}}, "es-ES")'),
    ("m", 'in Tipos'),
    ("m", ''),
    ("m", 'Aplicaciones = let'),
    ("m", '  SinFactura = Table.SelectRows(Cobros, each [NumFactura] = ""),'),
    ("m", '  Refs = Table.AddColumn(SinFactura, "Ref", each List.Select(Text.Split(Text.Replace(Text.Replace([Concepto], ",", " "), "/", " "), " "),'),
    ("m", '      (p) => Text.Length(p) = 10 and List.Contains({"F25-", "F26-", "R26-"}, Text.Start(p, 4)))),'),
    ("m", '  Filas = Table.ExpandListColumn(Refs, "Ref"),'),
    ("m", '  ConRef = Table.SelectRows(Filas, each [Ref] <> null),'),
    ("m", '  Columnas = Table.SelectColumns(ConRef, {"IdCobro", "Ref"}),'),
    ("m", '  Renombrado = Table.RenameColumns(Columnas, {{"Ref", "NumFactura"}})'),
    ("m", 'in Renombrado'),
    ("", "Ojo: las referencias pueden ser F25, F26 y también abonos R26. Un patrón solo con «F2…» se deja los abonos y el cobro no cuadra."),
    ("", "En Microsoft 365 hay alternativa con fórmula: =REGEXEXTRACCION([@Concepto];\"[FR]2[56]-\\d{6}\";1) devuelve todas las referencias (escribe =REGEX y elige la función de la lista)."),
    ("", ""),
    ("h", "2. Columnas calculadas clave (en español)"),
    ("", "Vencimiento: =SI([@VencimientoERP]=\"\";[@FechaFactura]+[@DiasForma];[@VencimientoERP]) con DiasForma =BUSCARV([@FormaPago];FormasPago;2;FALSO)"),
    ("", "Cobrado: =REDONDEAR(SUMAR.SI.CONJUNTO(Cobros[Importe];Cobros[NumFactura];[@NumFactura];Cobros[FechaCobro];\"<=\"&FechaCorte)+SUMAR.SI.CONJUNTO(Aplicaciones[Aplicado];Aplicaciones[NumFactura];[@NumFactura];Aplicaciones[FechaCobro];\"<=\"&FechaCorte);2)"),
    ("", "Previo (Aplicaciones, lo de los documentos más antiguos del mismo cobro): =SUMAR.SI.CONJUNTO(Aplicaciones[TotalDoc];Aplicaciones[IdCobro];[@IdCobro];Aplicaciones[FechaDoc];\"<\"&[@FechaDoc])+SUMAR.SI.CONJUNTO(Aplicaciones[TotalDoc];Aplicaciones[IdCobro];[@IdCobro];Aplicaciones[FechaDoc];[@FechaDoc];Aplicaciones[NumFactura];\"<\"&[@NumFactura])"),
    ("", "Aplicado (Aplicaciones): =REDONDEAR(SI([@NRefs]=1;[@ImporteCobro];SI([@ImporteCobro]>=[@SumaCitada];[@TotalDoc];MIN([@TotalDoc];MAX(0;[@ImporteCobro]-[@Previo]))));2)"),
    ("", "Tramo: =SI([@DiasVencidos]<=0;INDICE(Tramos[Tramo];1);BUSCARV([@DiasVencidos];Tramos;2;VERDADERO)). Con BUSCARX: =BUSCARX([@DiasVencidos];Tramos[Desde];Tramos[Tramo];;-1). La tabla Tramos tiene que estar ordenada de menor a mayor."),
    ("", "Nombre del maestro: =BUSCARX([@CodCliente];Clientes[CodCliente];Clientes[Nombre];\"HUÉRFANO\")"),
    ("", ""),
    ("h", "3. Tabla dinámica de antigüedad con segmentaciones"),
    ("", "1. Clic en la Tabla Facturas > Insertar > Tabla dinámica > Nueva hoja de cálculo."),
    ("", "2. Filas: NombreMaestro · Columnas: Tramo · Valores: Pendiente (Suma). Los prefijos «0 ·», «1 ·»… hacen que los tramos salgan en orden."),
    ("", "3. Segunda copia de Pendiente en Valores > Configuración de campo de valor > Mostrar valores como > % del total general."),
    ("", "4. Analizar tabla dinámica > Insertar segmentación de datos > Delegacion y Comercial."),
    ("", "5. Top 10 a más de 60 días: otra tabla dinámica con NombreMaestro en Filas, Pendiente en Valores y Tramo como filtro (solo 3 · 61-90, 4 · 91-180 y 5 · Más de 180); en la flecha de Filas, Filtros de valor > Diez mejores (10, Superior, Elementos, por Suma de Pendiente)."),
    ("", "6. Gráfico: Insertar > Insertar gráfico de columnas o de barras > Columna apilada, con Delegación en el eje y Tramo en la leyenda (o el gráfico de la hoja Informe)."),
    ("", "7. Después de Actualizar todo (Ctrl+Alt+F5) la tabla dinámica se refresca sola."),
    ("", "Alternativa con fórmula (solo Microsoft 365): =PIVOTARPOR(Facturas[NombreMaestro];Facturas[Tramo];Facturas[Pendiente];SUMA)."),
    ("", ""),
    ("h", "4. Listas del Informe (Microsoft 365; hay alternativa para versiones antiguas)"),
    ("", "Top 10: =TOMAR(ORDENARPOR(APILARH(Clientes[[CodCliente]:[Nombre]];Clientes[VencidoMas60]);Clientes[VencidoMas60];-1);10)"),
    ("", "Excesos de riesgo: =SI.ERROR(ORDENAR(FILTRAR(APILARH(Clientes[[CodCliente]:[Nombre]];Clientes[Saldo];Clientes[LimiteRiesgo];Clientes[Exceso]);Clientes[SuperaLimite]);5;-1);\"Ninguno\")"),
    ("", "Ley 3/2004: =FILTRAR(APILARH(Clientes[[CodCliente]:[Nombre]];Clientes[DiasPago];Clientes[Saldo]);Clientes[PlazoMas60];\"Ninguno\")"),
    ("", "Sin Microsoft 365 (Excel 2019 o anterior): filtro en la Tabla Clientes (SuperaLimite = VERDADERO, PlazoMas60 = VERDADERO) y orden descendente; o la tabla dinámica con Diez mejores."),
    ("", ""),
    ("h", "5. Listado para el auditor (hoja Para_auditor)"),
    ("", "1. Filtra Facturas por Pendiente distinto de 0, copia las columnas y pégalas como valores en una hoja nueva (Subtotal no funciona dentro de una Tabla)."),
    ("", "2. Ordena por CodCliente y FechaFactura. 3. Datos > Esquema > Subtotal: Para cada cambio en CodCliente, Usar función Suma, Agregar subtotal a Pendiente."),
    ("", "4. Pulsa el botón 2 del esquema (a la izquierda) para dejar solo los totales por cliente. El total general debe ser igual al pendiente (control informativo)."),
    ("", ""),
    ("h", "6. Formato y entrega"),
    ("", "Formato condicional en Controles (VERDADERO verde, FALSO rojo) y texto «Controles: OK» en el Informe, para no depender solo del color."),
    ("", "Informe: Disposición de página (o Diseño de página) > Orientación horizontal y Ajustar a 1 página; Archivo > Exportar > Crear PDF/XPS."),
]
lineas(ws, COMO, 170)

wb.close()

# ===========================================================================
# 4. META Y CIFRAS PARA p3.json
# ===========================================================================
with open(os.path.join(LIBROS, "p3-solucion.meta.json"), "w", encoding="utf-8") as fh:
    json.dump({"titulo": "P3 · Facturas, cobros y antigüedad de saldos (solución)",
               "descripcion": "Libro resuelto: Tablas con Cobrado, Pendiente y Tramo con fórmulas, aplicación de cobros agrupados, informe de una página, listado para el auditor, controles con control maestro y «Cómo se hizo».",
               "nivel": "n6"}, fh, ensure_ascii=False, indent=2)
OUT = dict(
    filas_csv=FILAS_CSV, duplicados=N_DUP, duplicados_eur=DUP_EUR, duplicados_fechas=DUP_FECHAS, n_docs=len(F),
    espacios=N_ESP, o45=N_O45, iso=N_ISO, venc_vacio=N_VENC_VACIO, altas_docs=N_ALTAS_DOCS, huerfanos_antes=HUERF_ANTES,
    anomalias=ANOM.to_dict("records"), dif_total=DIF_TBC, total_csv=float(fila_total["TotalFactura"]),
    pendiente=PEND, a_cuenta=ACTA_TOTAL, a_cuenta_n=ACTA_N, saldo430=SALDO430, cobrado=r2(F["Cobrado"].sum()),
    por_tramo=POR_TRAMO, pct_tramo={k: round(v / PEND * 100, 1) for k, v in POR_TRAMO.items()},
    vencido=VENCIDO, pct_vencido=round(VENCIDO / PEND * 100, 1), venc60=VENC60, pct_venc60=round(VENC60 / PEND * 100, 1),
    top10=[[r.CodCliente, r.Nombre, r.VencidoMas60] for r in TOP10.itertuples()],
    supera=[[r.CodCliente, r.Nombre, r.Saldo, r.LimiteRiesgo, r.Exceso, r.Estado] for r in SUPERA.itertuples()],
    ley=[[r.CodCliente, r.Nombre, r.DiasPago, r.Saldo] for r in LEY.itertuples()], docs_plazo=DOCS_PLAZO, pend_plazo=PEND_PLAZO,
    favor=[[r.CodCliente, r.Nombre, r.Saldo] for r in FAVOR.itertuples()], fact_pmc=FACT_PMC, pmc=round(PMC, 1),
    pmc_con_pendiente=round(PEND / FACT_PMC * DIAS_PMC, 1),
    pmc_sin_iva=round(SALDO430 / r2(F.loc[(F["FechaF"] >= INI_PMC) & (F["FechaF"] <= CORTE), "Base"].sum()) * DIAS_PMC, 1),
    bloqueado=[BLOQ["CodCliente"], BLOQ["Nombre"], len(tras_bloq), r2(tras_bloq["Total"].sum()), r2(tras_bloq["Pendiente"].sum())],
    estados=F["Estado"].value_counts().to_dict(), n_cobros=len(C), cobros_nov=len(COB_NOV), cobros_nov_eur=r2(COB_NOV["Imp"].sum()),
    tipos_cobro=C["TipoCobro"].value_counts().to_dict(), devol_antes=int(dev["AntesCorte"].sum()),
    agrupados_parciales=int(sum(1 for i, g in A[A["NRefs"] > 1].groupby("IdCobro") if g["ImporteCobro"].iloc[0] < round(g["SumaCitada"].iloc[0], 2))),
    agrupados_con_abono=int(A[A["NRefs"] > 1].groupby("IdCobro")["NumFactura"].apply(lambda s: s.str.startswith("R26").any()).sum()),
    filas_aplicaciones=len(A), cod_vacio=int((C["CodCliente"] == "").sum()),
    por_delegacion={d: r2(sum(DT[(d, t)] for _, t in TRAMOS)) for d in DELEGACIONES},
    pend_sumado_duplicados=r2(PEND + F[F["FechaF"].isin([dt.date(2026, 7, 1), dt.date(2026, 7, 2)])]["Pendiente"].sum()),
    venc60_desde_factura=r2(F.loc[F["DiasDesdeFactura"] > UMBRAL, "Pendiente"].sum()),
    favor_detalle=F[F["CodCliente"].isin(FAVOR["CodCliente"]) & (F["Pendiente"].abs() > 0.005)][["NumFactura", "CodCliente", "Pendiente"]].to_dict("records"),
    cien_cliente=F.loc[F["NumFactura"] == V["cien"], ["CodCliente", "NombreMaestro"]].iloc[0].tolist(),
    filas_auditor=int(len(PA)), clientes_con_saldo=int((CL["Saldo"].abs() > 0.005).sum()),
)
with open(os.path.join(AQUI, "p3_controles.json"), "w", encoding="utf-8") as fh:
    json.dump(OUT, fh, ensure_ascii=False, indent=1, default=str)
print(json.dumps(OUT, ensure_ascii=False, indent=1, default=str))

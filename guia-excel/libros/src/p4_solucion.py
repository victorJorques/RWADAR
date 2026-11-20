#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P4 · Conciliación bancaria · solución.

1. Lee los datos de partida TAL CUAL (libros/p4-datos.xlsx y p4-noviembre.xlsx), los limpia y concilia con
   pandas aplicando las reglas del encargo y las aclaraciones de Marta:
   - solo la cuenta 572000001 (hoja «Movimientos»; «Movimientos (2)» es otra cuenta y no entra);
   - las pendientes de septiembre van arriba de los libros y casan sin límite de fechas;
   - pareja = mismo importe con signo y mismo nº de ocurrencia, y |días| ≤ 5 (fecha de operación del banco);
   - remesas: el abono «REMESA R-xxxx» casa con la suma de los cobros de libros con esa remesa;
   - lo que queda sin pareja se clasifica (A: libros, B: banco, E: error en libros).
2. Calcula los totales de control (libros/src/p4-controles.json) y comprueba las cifras de diseño.
3. Escribe libros/p4-solucion.xlsx con fórmulas reales (en inglés con comas, como se guardan) y los valores
   ya calculados, Tablas, nombres definidos, formato condicional, validación, protección y la hoja «Cómo se hizo».
"""
import datetime as dt
import json
import os
import re

import pandas as pd
import xlsxwriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
DATOS = os.path.join(LIBROS, "p4-datos.xlsx")
NOV = os.path.join(LIBROS, "p4-noviembre.xlsx")
SALIDA = os.environ.get("P4_SALIDA") or os.path.join(LIBROS, "p4-solucion.xlsx")
if os.environ.get("P4_SIN_CACHE"):   # solo para comprobar con LibreOffice que las fórmulas calculan solas
    _wf = xlsxwriter.worksheet.Worksheet._write_formula
    xlsxwriter.worksheet.Worksheet._write_formula = lambda self, r, c, f, fm=None, v=0: _wf(self, r, c, f, fm, 0)
MARGEN = 5
TIPOS_BANCO = ["Cargo banco sin contabilizar", "Abono banco sin contabilizar", "Error en libros: importe",
               "Error en libros: duplicado"]
TIPOS_LIBROS = ["Pago pendiente de cargo", "Ingreso en tránsito", "Error en libros: importe",
                "Error en libros: duplicado"]


# ------------------------------------------------------------------ lectura y limpieza
def num_es(texto):
    return float(texto.split(":")[1].strip().replace(".", "").replace(",", "."))


def fecha(v):
    if isinstance(v, str):
        return dt.datetime.strptime(v.strip(), "%d/%m/%Y").date()
    return pd.Timestamp(v).date()


def leer_banco(ruta, hoja="Movimientos"):
    raw = pd.read_excel(ruta, sheet_name=hoja, header=None, dtype=object)
    saldo_ini = num_es(str(raw.iloc[4, 0]))
    t = raw.iloc[7:, :6].copy()
    t.columns = ["FechaOperacion", "FechaValor", "Concepto", "Importe", "Saldo", "Referencia"]
    t = t.dropna(subset=["Concepto"]).reset_index(drop=True)
    t["Importe"] = t["Importe"].astype(float).round(2)
    t["Saldo"] = t["Saldo"].astype(float).round(2)
    t["FechaValor"] = t["FechaValor"].apply(fecha)
    t["Fecha"] = t["FechaOperacion"].apply(fecha)
    return raw, t, saldo_ini


def leer_mayor(ruta):
    raw = pd.read_excel(ruta, sheet_name="Mayor_572000001", header=None, dtype=object)
    t = raw.iloc[3:, :6].copy()
    t.columns = ["Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]
    ini = float(t.loc[t["Concepto"] == "Saldo anterior", "Saldo"].iloc[0])
    fin = float(t.loc[t["Concepto"] == "Sumas del periodo", "Saldo"].iloc[0])
    t = t[t["Asiento"].notna()].reset_index(drop=True)          # fuera «Saldo anterior» y «Sumas del periodo»
    t["Fecha"] = t["Fecha"].apply(fecha)
    for c in ["Debe", "Haber", "Saldo"]:
        t[c] = pd.to_numeric(t[c], errors="coerce")
    t["Origen"] = "Libros"
    return raw, t, round(ini, 2), round(fin, 2)


def remesa(c):
    m = re.search(r"remesa R-", c, flags=re.I)
    return c[m.start() + 7:m.start() + 13] if m else ""


def txt_num(x):  # cómo convierte Excel (es-ES) un número en texto al concatenar
    return f"{x:.2f}".rstrip("0").rstrip(".").replace(".", ",")


def conciliar(b, l, saldo_ini_b, saldo_ini_l):
    """b: banco limpio; l: libros (pendientes arriba + mayor). Devuelve los dos con todas las columnas."""
    b, l = b.copy(), l.copy()
    l["Importe"] = (l["Debe"].fillna(0) - l["Haber"].fillna(0)).round(2)
    prev = [saldo_ini_b] + list(b["Saldo"][:-1])
    b["DifSaldo"] = [round(p + i - s, 2) + 0.0 for p, i, s in zip(prev, b["Importe"], b["Saldo"])]
    dif, ant = [], None
    for o, i, s in zip(l["Origen"], l["Importe"], l["Saldo"]):
        if o != "Libros":
            dif.append("")
        else:
            dif.append(round((ant if ant is not None else saldo_ini_l) + i - s, 2) + 0.0)
        ant = s if pd.notna(s) else None
    l["DifSaldo"] = dif
    for t, col in ((b, "Importe"), (l, "Importe")):
        t["Remesa"] = t["Concepto"].apply(remesa)
        cnt, cl = {}, []
        for imp, rem in zip(t[col], t["Remesa"]):
            if rem:
                cl.append("")
                continue
            cnt[imp] = cnt.get(imp, 0) + 1
            cl.append(f"{txt_num(imp)}|{cnt[imp]}")
        t["Clave"] = cl
    lk_l = {k: (f, o) for k, f, o in zip(l["Clave"], l["Fecha"], l["Origen"]) if k}
    lk_b = {k: f for k, f in zip(b["Clave"], b["Fecha"]) if k}
    rem_l = l[l["Remesa"] != ""].groupby("Remesa")["Importe"].sum().round(2).to_dict()
    rem_b = b[b["Remesa"] != ""].groupby("Remesa")["Importe"].sum().round(2).to_dict()
    b["FechaLibros"] = [lk_l.get(k, ("", ""))[0] if k else "" for k in b["Clave"]]
    b["OrigenPareja"] = [lk_l.get(k, ("", ""))[1] if k else "" for k in b["Clave"]]
    b["Dias"] = [(f - g).days if g != "" else "" for f, g in zip(b["Fecha"], b["FechaLibros"])]
    l["FechaBanco"] = [lk_b.get(k, "") if k else "" for k in l["Clave"]]
    l["Dias"] = [(g - f).days if g != "" else "" for f, g in zip(l["Fecha"], l["FechaBanco"])]

    def estado(rem, imp_rem_otro, imp_rem_propio, fpar, origen, dias):
        if rem:
            return "Casada (remesa)" if abs(imp_rem_otro - imp_rem_propio) < 0.005 else "Remesa descuadrada"
        if fpar == "":
            return "Sin pareja"
        return "Casada" if (origen != "Libros" or abs(dias) <= MARGEN) else "Fuera de margen"

    b["Estado"] = [estado(r, rem_l.get(r, 0), i, f, o, d) for r, i, f, o, d in
                   zip(b["Remesa"], b["Importe"], b["FechaLibros"], b["OrigenPareja"], b["Dias"])]
    l["Estado"] = [estado(r, rem_b.get(r, 0), rem_l.get(r, 0), f, o, d) for r, f, o, d in
                   zip(l["Remesa"], l["FechaBanco"], l["Origen"], l["Dias"])]
    b["TipoPropuesto"] = ["" if e.startswith("Casada") else (TIPOS_BANCO[0] if i < 0 else TIPOS_BANCO[1])
                          for e, i in zip(b["Estado"], b["Importe"])]
    l["TipoPropuesto"] = ["" if e.startswith("Casada") else (TIPOS_LIBROS[0] if i < 0 else TIPOS_LIBROS[1])
                          for e, i in zip(l["Estado"], l["Importe"])]

    # --- revisión (el criterio de la analista, sacado de los propios datos)
    b["Revision"], l["Revision"], b["Cuenta"], b["Nota"], l["Nota"] = "", "", "", "", ""
    sin_b = b["TipoPropuesto"] != ""
    sin_l = l["TipoPropuesto"] != ""
    casadas = l[~sin_l]
    for i in l[sin_l].index:  # mismo concepto e importe que un apunte ya casado → duplicado
        if ((casadas["Concepto"] == l.at[i, "Concepto"]) & (casadas["Importe"] == l.at[i, "Importe"])).any():
            l.at[i, "Revision"] = "Error en libros: duplicado"
            l.at[i, "Nota"] = "Mismo cobro que el asiento anterior: anular este asiento"
    doc = re.compile(r"[A-Z]{2}-\d{2}-\d{4,5}")
    for i in b[sin_b].index:  # mismo nº de factura sin pareja en los dos lados → error de importe
        m = doc.search(b.at[i, "Concepto"])
        if not m:
            continue
        j = [x for x in l[sin_l].index if m.group() in l.at[x, "Concepto"]]
        if j:
            b.at[i, "Revision"] = l.at[j[0], "Revision"] = "Error en libros: importe"
            dif = round(b.at[i, "Importe"] - l.at[j[0], "Importe"], 2)
            b.at[i, "Nota"] = (f"El banco cargó {txt_num(-b.at[i, 'Importe'])} y en libros consta "
                               f"{txt_num(-l.at[j[0], 'Importe'])}: corregir {txt_num(abs(dif))} (400 Proveedores)")
            l.at[j[0], "Nota"] = "Contabilizado con las cifras cambiadas (transposición)"
    for i in b[sin_b & (b["Revision"] == "")].index:
        c = b.at[i, "Concepto"]
        if "PRESTAMO" in c:
            b.at[i, "Cuenta"], b.at[i, "Nota"] = "662/520", "Cuota del préstamo (valor 25/10): intereses a 662 y capital a 520"
        elif "DEVOLUCION" in c and "COMISION" not in c:
            b.at[i, "Cuenta"], b.at[i, "Nota"] = "430", "Recibo devuelto por el cliente: vuelve a 430 y hay que reclamarlo"
        elif "COMISION" in c:
            b.at[i, "Cuenta"], b.at[i, "Nota"] = "626", "Comisión del banco: 626 Servicios bancarios"
        elif b.at[i, "Importe"] > 0:
            b.at[i, "Cuenta"], b.at[i, "Nota"] = "555", "Cobro sin identificar: a 555 hasta saber de quién es"
    for i in l[sin_l & (l["Revision"] == "")].index:
        c = l.at[i, "Concepto"].lower()
        l.at[i, "Nota"] = ("Cheque entregado que el proveedor aún no ha cobrado" if "cheque" in c else
                           "Transferencia ordenada que el banco ejecuta el mes siguiente" if "pago" in c else
                           "Cobro contabilizado que el banco abona el mes siguiente")
    b["Tipo"] = [r or t for r, t in zip(b["Revision"], b["TipoPropuesto"])]
    l["Tipo"] = [r or t for r, t in zip(l["Revision"], l["TipoPropuesto"])]
    return b, l


def estado_conciliacion(b, l, saldo_ini_b, saldo_ini_l):
    s = lambda t, tipo: round(t.loc[t["Tipo"] == tipo, "Importe"].sum(), 2)
    e = {}
    e["saldo_banco"] = round(saldo_ini_b + b["Importe"].sum(), 2)
    e["transito"] = s(l, "Ingreso en tránsito")
    e["pendientes_cargo"] = s(l, "Pago pendiente de cargo")
    e["ajustado_banco"] = round(e["saldo_banco"] + e["transito"] + e["pendientes_cargo"], 2)
    e["saldo_libros"] = round(saldo_ini_l + l.loc[l["Origen"] == "Libros", "Importe"].sum(), 2)
    e["cargos"] = s(b, "Cargo banco sin contabilizar")
    e["abonos"] = s(b, "Abono banco sin contabilizar")
    e["duplicado"] = round(s(b, "Error en libros: duplicado") - s(l, "Error en libros: duplicado"), 2)
    e["importe"] = round(s(b, "Error en libros: importe") - s(l, "Error en libros: importe"), 2)
    e["ajustado_libros"] = round(e["saldo_libros"] + e["cargos"] + e["abonos"] + e["duplicado"] + e["importe"], 2)
    e["diferencia"] = round(e["ajustado_banco"] - e["ajustado_libros"], 2)
    return e


def prestamo(capital=85000.0, tin=0.05, n=48):
    r = tin / 12
    cuota = capital * r / (1 - (1 + r) ** -n)
    filas, pend = [], capital
    for k in range(1, n + 1):
        i = pend * r
        p = cuota - i
        pend -= p
        filas.append((k, cuota, i, p, pend))
    return filas


# ------------------------------------------------------------------ cálculo
raw_b, banco, SALDO_INI_B = leer_banco(DATOS)
raw_m, mayor, SALDO_INI_L, SALDO_FIN_L_DOC = leer_mayor(DATOS)
SALDO_FIN_B_DOC = float(banco["Saldo"].iloc[-1])
pend = pd.read_excel(DATOS, sheet_name="Pendientes_septiembre", nrows=2)
pend["Fecha"] = pend["Fecha"].apply(fecha)
pend["Origen"] = "Pendiente ant."
pend["Saldo"] = float("nan")
libros = pd.concat([pend[["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]],
                    mayor[["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]]], ignore_index=True)
B, L = conciliar(banco, libros, SALDO_INI_B, SALDO_INI_L)
E = estado_conciliacion(B, L, SALDO_INI_B, SALDO_INI_L)
PR = prestamo()
CUOTA_MES = 19   # SIFECHA(25/04/2025; 31/10/2026; "M") + 1
INT = round(PR[CUOTA_MES - 1][2], 2)
CAP = round(PR[CUOTA_MES - 1][3], 2)
CUOTA = round(PR[0][1], 2)
c626 = round(-B.loc[B["Cuenta"] == "626", "Importe"].sum(), 2)
c430 = round(-B.loc[B["Cuenta"] == "430", "Importe"].sum(), 2)
c555 = round(B.loc[B["Cuenta"] == "555", "Importe"].sum(), 2)
cargo_prest = round(-B.loc[B["Cuenta"] == "662/520", "Importe"].sum(), 2)
dup_l = round(L.loc[L["Tipo"] == "Error en libros: duplicado", "Importe"].sum(), 2)
dif_imp = round(L.loc[L["Tipo"] == "Error en libros: importe", "Importe"].sum()
                - B.loc[B["Tipo"] == "Error en libros: importe", "Importe"].sum(), 2)
PENDIENTES_OCT = L[L["Tipo"].isin(TIPOS_LIBROS[:2])]

# --- comprobaciones de diseño (research/proyectos.md, ficha P4)
sin_b, sin_l = (B["Estado"] == "Sin pareja").sum(), ((L["Estado"] == "Sin pareja")).sum()
assert (SALDO_INI_B, SALDO_FIN_B_DOC, SALDO_INI_L, SALDO_FIN_L_DOC) == (84215.37, 61482.19, 84985.37, 61924.13)
assert E["saldo_banco"] == 61482.19 and E["saldo_libros"] == 61924.13
assert (sin_b, sin_l) == (11, 5), (sin_b, sin_l)
assert E["ajustado_banco"] == E["ajustado_libros"] == 54854.69 and E["diferencia"] == 0, E
assert (E["transito"], E["pendientes_cargo"], E["cargos"], E["abonos"], E["duplicado"], E["importe"]) == \
    (5445.0, -12072.5, -4492.44, 1089.0, -3630.0, -36.0), E
assert (INT, CAP, CUOTA, cargo_prest) == (229.56, 1727.93, 1957.49, 1957.49)
assert (c626, c430, c555, dup_l, dif_imp) == (114.95, 2420.0, 1089.0, 3630.0, 36.0)
assert round(INT + CAP + c626 + c430, 2) == 4492.44
assert round(sum(p[3] for p in PR), 2) == 85000.0
assert (B["Estado"] == "Casada").sum() == (L["Estado"] == "Casada").sum() == 173   # 171 del mes + S1 y S2
assert (B["DifSaldo"] == 0).all() and all(x == 0 for x in L["DifSaldo"] if x != "")
assert round(PENDIENTES_OCT["Importe"].sum(), 2) == -6627.5 and len(PENDIENTES_OCT) == 3

# --- noviembre (cambio inesperado): plantilla con las pendientes de octubre arriba
_, bn, ini_bn = leer_banco(NOV)
_, mn, ini_ln, fin_ln = leer_mayor(NOV)
pn = PENDIENTES_OCT[["Fecha", "Asiento", "Concepto", "Debe", "Haber"]].copy()
pn["Origen"], pn["Saldo"] = "Pendiente ant.", float("nan")
ln = pd.concat([pn[["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]],
                mn[["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]]], ignore_index=True)
BN, LN = conciliar(bn, ln, ini_bn, ini_ln)
EN = estado_conciliacion(BN, LN, ini_bn, ini_ln)
assert ini_bn == 61482.19 and ini_ln == 54854.69 and EN["diferencia"] == 0
assert list(LN.loc[LN["Origen"] == "Pendiente ant.", "Estado"]) == ["Casada"] * 3
assert EN["cargos"] == -180.0 and EN["pendientes_cargo"] == -3146.0
NOVIEMBRE = dict(saldo_banco=EN["saldo_banco"], saldo_libros=EN["saldo_libros"], ajustado=EN["ajustado_banco"],
                 movimientos_banco=len(BN), apuntes_libros=len(mn))

CONTROLES = {
    "saldo_banco_31_10": E["saldo_banco"], "saldo_libros_31_10": E["saldo_libros"],
    "banco_sin_pareja": int(sin_b), "libros_sin_pareja": int(sin_l),
    "cargos_banco_sin_contabilizar": -E["cargos"], "saldo_ajustado": E["ajustado_banco"],
    "intereses_cuota_19": INT, "capital_cuota_19": CAP,
    "pendientes_a_noviembre": round(PENDIENTES_OCT["Importe"].sum(), 2),
    "parejas_uno_a_uno": int((B["Estado"] == "Casada").sum()), "noviembre": NOVIEMBRE,
    "estado": E, "asiento": dict(c626=c626, c662=INT, c520=CAP, c430=c430, c555=c555, duplicado=dup_l, transposicion=dif_imp),
    "fechas_texto": int(banco["FechaOperacion"].apply(lambda v: isinstance(v, str)).sum()),
    "fechas_texto_con_espacio": int(banco["FechaOperacion"].apply(lambda v: isinstance(v, str) and v != v.strip()).sum()),
}
with open(os.path.join(AQUI, "p4-controles.json"), "w", encoding="utf-8") as fh:
    json.dump(CONTROLES, fh, ensure_ascii=False, indent=1, default=str)

# ------------------------------------------------------------------ libro de solución
EPOCA = dt.date(1899, 12, 30)
ser = lambda d: ((d.date() if isinstance(d, dt.datetime) else d) - EPOCA).days if isinstance(d, dt.date) else d
wb = xlsxwriter.Workbook(SALIDA, {"use_future_functions": True})
wb.set_properties({"title": "P4 · Conciliación bancaria de octubre (solución)", "author": "Hoja a hoja"})
F = lambda **k: wb.add_format(k)
f_tit = F(bold=True, font_size=14, font_color="#1F4E78")
f_sub = F(bold=True, font_color="#1F4E78")
f_txt = F(text_wrap=True, valign="top")
f_cab = F(bold=True, bg_color="#D9E1F2", border=1, text_wrap=True)
f_fec, f_eur, f_pct = F(num_format="dd/mm/yyyy"), F(num_format="#,##0.00"), F(num_format="0.00%")
f_in = F(bg_color="#FFF2CC")
f_in_fec = F(bg_color="#FFF2CC", num_format="dd/mm/yyyy")
f_in_eur = F(bg_color="#FFF2CC", num_format="#,##0.00")
f_in_pct = F(bg_color="#FFF2CC", num_format="0.00%")
f_tot = F(bold=True, num_format="#,##0.00", top=1, bottom=6)
f_lab_tot = F(bold=True, top=1, bottom=6)
f_ok = F(bg_color="#C6EFCE", font_color="#006100", bold=True)
f_mal = F(bg_color="#FFC7CE", font_color="#9C0006", bold=True)
f_aviso = F(bg_color="#FCE4D6")
f_int = F(num_format="0")

hojas = {}
for n in ["Léame", "Parámetros", "Banco_origen", "Libros_origen", "Banco", "Libros", "Conciliación", "Asiento",
          "Pendientes_octubre", "Préstamo", "Calidad_datos", "Controles", "Cómo se hizo"]:
    hojas[n] = wb.add_worksheet(n)
    hojas[n].hide_gridlines(2) if n in ("Léame", "Conciliación", "Asiento", "Cómo se hizo") else None


def texto(ws, filas, ancho=120):
    ws.set_column("A:A", ancho, f_txt)
    for i, (t, s) in enumerate(filas):
        ws.write(i, 0, s, {"t": f_tit, "s": f_sub}.get(t, f_txt))


# ---- Parámetros (celdas de entrada en amarillo, con nombre)
ws = hojas["Parámetros"]
ws.write(0, 0, "Parámetros de la conciliación", f_tit)
ws.write(1, 0, "Celdas amarillas = datos que se cambian cada mes. Todo lo demás son fórmulas.")
for j, h in enumerate(["Parámetro", "Valor", "Nombre", "De dónde sale"]):
    ws.write(3, j, h, f_cab)
PAR = [
    ("Fecha de corte", dt.date(2026, 10, 31), "FechaCorte", "Último día del mes que se concilia", f_in_fec),
    ("Saldo inicial del banco", SALDO_INI_B, "SaldoIniBanco", "Línea «Saldo inicial» de la descarga (fila 5)", f_in_eur),
    ("Saldo final del banco", SALDO_FIN_B_DOC, "SaldoFinBanco", "Columna Saldo del último movimiento de la descarga", f_in_eur),
    ("Saldo inicial de libros", SALDO_INI_L, "SaldoIniLibros", "Fila «Saldo anterior» del mayor", f_in_eur),
    ("Saldo final de libros", SALDO_FIN_L_DOC, "SaldoFinLibros", "Fila «Sumas del periodo» del mayor", f_in_eur),
    ("Margen de fechas (días naturales)", MARGEN, "MargenDias", "Aclaración de Marta: ±5 días, el 5 incluido", f_in),
    ("Préstamo: capital", 85000, "PrestCapital", "Hoja Prestamo de los datos", f_in_eur),
    ("Préstamo: TIN anual", 0.05, "PrestTIN", "Hoja Prestamo de los datos", f_in_pct),
    ("Préstamo: nº de cuotas", 48, "PrestCuotas", "Hoja Prestamo de los datos", f_in),
    ("Préstamo: fecha de la 1.ª cuota", dt.date(2025, 4, 25), "PrestPrimeraCuota", "Hoja Prestamo de los datos", f_in_fec),
]
for i, (k, v, nom, nota, fm) in enumerate(PAR, start=4):
    ws.write(i, 0, k)
    if isinstance(v, dt.date):
        ws.write_datetime(i, 1, dt.datetime.combine(v, dt.time()), fm)
    else:
        ws.write_number(i, 1, v, fm)
    ws.write(i, 2, nom)
    ws.write(i, 3, nota)
    wb.define_name(nom, f"='Parámetros'!$B${i + 1}")
r = 4 + len(PAR)
ws.write(r, 0, "Préstamo: cuota del mes (nº)")
ws.write_formula(r, 1, '=DATEDIF(PrestPrimeraCuota,FechaCorte,"M")+1', f_int, CUOTA_MES)
ws.write(r, 2, "CuotaMes")
ws.write(r, 3, "Fórmula: meses completos desde la 1.ª cuota + 1")
wb.define_name("CuotaMes", f"='Parámetros'!$B${r + 1}")
r += 2
ws.write(r, 0, "Tipos de partida (listas desplegables)", f_sub)
ws.write(r + 1, 0, "Banco", f_cab)
ws.write(r + 1, 1, "Libros", f_cab)
for i, (x, y) in enumerate(zip(TIPOS_BANCO, TIPOS_LIBROS), start=r + 2):
    ws.write(i, 0, x)
    ws.write(i, 1, y)
wb.define_name("TiposBanco", f"='Parámetros'!$A${r + 3}:$A${r + 6}")
wb.define_name("TiposLibros", f"='Parámetros'!$B${r + 3}:$B${r + 6}")
ws.set_column("A:A", 36)
ws.set_column("B:B", 30)
ws.set_column("C:C", 18)
ws.set_column("D:D", 52)

# ---- Banco_origen y Libros_origen: lo recibido, intacto
for nombre, raw in (("Banco_origen", raw_b), ("Libros_origen", raw_m)):
    ws = hojas[nombre]
    for i, fila in enumerate(raw.itertuples(index=False)):
        for j, v in enumerate(fila):
            if v is None or (isinstance(v, float) and pd.isna(v)) or v is pd.NaT:
                continue
            if isinstance(v, (pd.Timestamp, dt.datetime)):
                ws.write_datetime(i, j, pd.Timestamp(v).to_pydatetime(), f_fec)
            elif isinstance(v, (int, float)):
                ws.write_number(i, j, float(v), f_eur)
            else:
                ws.write_string(i, j, str(v))
    ws.set_column("A:B", 12)
    ws.set_column("C:C", 60)
    ws.set_column("D:F", 13)


# ---- Tablas Banco y Libros
def esc(v):
    return '""' if v == "" else v


def este(t, c):
    return f"{t}[[#This Row],[{c}]]"


def tabla(ws, nombre, df, entradas, calculadas, formatos):
    """entradas: columnas que se pegan; calculadas: [(col, f(r) -> fórmula, valores)]."""
    cols = entradas + [c for c, _ in calculadas] + [c for c in df.columns if c in ("Revision", "Cuenta", "Nota")]
    orden = {"Banco": ["FechaOperacion", "FechaValor", "Concepto", "Importe", "Saldo", "Referencia", "Fecha",
                       "DifSaldo", "Remesa", "Clave", "FechaLibros", "OrigenPareja", "Dias", "Estado",
                       "TipoPropuesto", "Revision", "Tipo", "Cuenta", "Nota"],
             "Libros": ["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo", "Importe", "DifSaldo",
                        "Remesa", "Clave", "FechaBanco", "Dias", "Estado", "TipoPropuesto", "Revision", "Tipo",
                        "Nota"]}[nombre]
    calc = dict(calculadas)
    n = len(df)
    columnas = []
    for c in orden:
        d = {"header": c}
        if c in calc:
            d["formula"] = calc[c](2)
        columnas.append(d)
    ws.add_table(0, 0, n, len(orden) - 1, {"name": nombre, "columns": columnas, "style": "Table Style Light 9"})
    for j, c in enumerate(orden):
        for i in range(n):
            r = i + 2
            v = df[c].iloc[i]
            v = "" if (v is None or (isinstance(v, float) and pd.isna(v))) else v
            if isinstance(v, dt.date):
                v = ser(v)
            fm = formatos.get(c)
            if c in calc:
                ws.write_formula(r - 1, j, calc[c](r), fm, v)
            elif c in entradas or c in ("Revision", "Cuenta", "Nota"):
                fm_in = {f_fec: f_in_fec, f_eur: f_in_eur}.get(fm, f_in)
                if c == "FechaOperacion" and isinstance(df["FechaOperacion"].iloc[i], str):
                    ws.write_string(r - 1, j, df["FechaOperacion"].iloc[i], f_in)
                elif v == "":
                    ws.write_blank(r - 1, j, None, fm_in)
                elif isinstance(v, (int, float)) and c != "Referencia":
                    ws.write_number(r - 1, j, v, fm_in)
                else:
                    ws.write_string(r - 1, j, str(v), fm_in)
    return orden


T = "Banco"
bcalc = [
    ("Fecha", lambda r: f"=IF(ISNUMBER({este("Banco",'FechaOperacion')}),{este("Banco",'FechaOperacion')},DATEVALUE(TRIM({este("Banco",'FechaOperacion')})))"),
    ("DifSaldo", lambda r: f"=ROUND(IF(ISNUMBER(E{r-1}),E{r-1},SaldoIniBanco)+{este("Banco",'Importe')}-{este("Banco",'Saldo')},2)"),
    ("Remesa", lambda r: f'=IFERROR(MID({este("Banco","Concepto")},SEARCH("remesa R-",{este("Banco","Concepto")})+7,6),"")'),
    ("Clave", lambda r: f'=IF({este("Banco","Remesa")}<>"","",{este("Banco","Importe")}&"|"&COUNTIFS($D$2:D{r},{este("Banco","Importe")},$I$2:I{r},""))'),
    ("FechaLibros", lambda r: f'=IF({este("Banco","Clave")}="","",XLOOKUP({este("Banco","Clave")},Libros[Clave],Libros[Fecha],""))'),
    ("OrigenPareja", lambda r: f'=IF({este("Banco","Clave")}="","",XLOOKUP({este("Banco","Clave")},Libros[Clave],Libros[Origen],""))'),
    ("Dias", lambda r: f'=IF({este("Banco","FechaLibros")}="","",{este("Banco","Fecha")}-{este("Banco","FechaLibros")})'),
    ("Estado", lambda r: (f'=IF({este("Banco","Remesa")}<>"",IF(ABS(SUMIFS(Libros[Importe],Libros[Remesa],{este("Banco","Remesa")})-{este("Banco","Importe")})<0.005,'
                          f'"Casada (remesa)","Remesa descuadrada"),IF({este("Banco","FechaLibros")}="","Sin pareja",'
                          f'IF(OR({este("Banco","OrigenPareja")}<>"Libros",ABS({este("Banco","Dias")})<=MargenDias),"Casada","Fuera de margen")))')),
    ("TipoPropuesto", lambda r: f'=IF(LEFT({este("Banco","Estado")},6)="Casada","",IF({este("Banco","Importe")}<0,"Cargo banco sin contabilizar","Abono banco sin contabilizar"))'),
    ("Tipo", lambda r: f'=IF({este("Banco","Revision")}<>"",{este("Banco","Revision")},{este("Banco","TipoPropuesto")})'),
]
T = "Libros"
lcalc = [
    ("Importe", lambda r: f"=ROUND(N({este('Libros','Debe')})-N({este('Libros','Haber')}),2)"),
    ("DifSaldo", lambda r: f'=IF({este("Libros","Origen")}<>"Libros","",ROUND(IF(ISNUMBER(G{r-1}),G{r-1},SaldoIniLibros)+{este("Libros","Importe")}-{este("Libros","Saldo")},2))'),
    ("Remesa", lambda r: f'=IFERROR(MID({este("Libros","Concepto")},SEARCH("remesa R-",{este("Libros","Concepto")})+7,6),"")'),
    ("Clave", lambda r: f'=IF({este("Libros","Remesa")}<>"","",{este("Libros","Importe")}&"|"&COUNTIFS($H$2:H{r},{este("Libros","Importe")},$J$2:J{r},""))'),
    ("FechaBanco", lambda r: f'=IF({este("Libros","Clave")}="","",XLOOKUP({este("Libros","Clave")},Banco[Clave],Banco[Fecha],""))'),
    ("Dias", lambda r: f'=IF({este("Libros","FechaBanco")}="","",{este("Libros","FechaBanco")}-{este("Libros","Fecha")})'),
    ("Estado", lambda r: (f'=IF({este("Libros","Remesa")}<>"",IF(ABS(SUMIFS(Banco[Importe],Banco[Remesa],{este("Libros","Remesa")})'
                          f'-SUMIFS(Libros[Importe],Libros[Remesa],{este("Libros","Remesa")}))<0.005,"Casada (remesa)","Remesa descuadrada"),'
                          f'IF({este("Libros","FechaBanco")}="","Sin pareja",IF(OR({este("Libros","Origen")}<>"Libros",'
                          f'ABS({este("Libros","Dias")})<=MargenDias),"Casada","Fuera de margen")))')),
    ("TipoPropuesto", lambda r: f'=IF(LEFT({este("Libros","Estado")},6)="Casada","",IF({este("Libros","Importe")}<0,"Pago pendiente de cargo","Ingreso en tránsito"))'),
    ("Tipo", lambda r: f'=IF({este("Libros","Revision")}<>"",{este("Libros","Revision")},{este("Libros","TipoPropuesto")})'),
]
fmt_comunes = {"Fecha": f_fec, "FechaValor": f_fec, "FechaOperacion": f_fec, "FechaLibros": f_fec, "FechaBanco": f_fec,
               "Importe": f_eur, "Saldo": f_eur, "Debe": f_eur, "Haber": f_eur, "DifSaldo": f_eur}
Bx = B.copy()
Bx["Clave"] = B["Clave"]
ob = tabla(hojas["Banco"], "Banco", Bx, ["FechaOperacion", "FechaValor", "Concepto", "Importe", "Saldo", "Referencia"],
           bcalc, fmt_comunes)
ol = tabla(hojas["Libros"], "Libros", L, ["Origen", "Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"],
           lcalc, fmt_comunes)
for nombre, orden, df, lista in (("Banco", ob, B, "=TiposBanco"), ("Libros", ol, L, "=TiposLibros")):
    ws = hojas[nombre]
    n = len(df) + 1
    ultima = xlsxwriter.utility.xl_col_to_name(len(orden) - 1)
    col_estado = xlsxwriter.utility.xl_col_to_name(orden.index("Estado"))
    col_rev = xlsxwriter.utility.xl_col_to_name(orden.index("Revision"))
    ws.conditional_format(f"A2:{ultima}{n}", {"type": "formula", "criteria": f'=LEFT(${col_estado}2,6)<>"Casada"',
                                              "format": f_aviso})
    ws.data_validation(f"{col_rev}2:{col_rev}{n}", {"validate": "list", "source": lista})
    ws.freeze_panes(1, 0)
    anchos = {"Concepto": 52, "Nota": 58, "Estado": 17, "TipoPropuesto": 27, "Revision": 26, "Tipo": 27,
              "Clave": 13, "Referencia": 14, "Asiento": 11, "OrigenPareja": 13, "Origen": 14}
    for j, c in enumerate(orden):
        ws.set_column(j, j, anchos.get(c, 12))

# ---- Conciliación (modelo del auditor)
ws = hojas["Conciliación"]
ws.set_column("A:A", 11, f_fec)
ws.set_column("B:B", 70)
ws.set_column("C:C", 15, f_eur)
ws.set_column("D:D", 29)
ws.set_column("E:E", 62)
ws.write(0, 0, "Conciliación bancaria · Banco Norte · cuenta 572000001", f_tit)
ws.write(1, 1, "Fecha de corte (preparada por Administración):")
ws.write_formula(1, 2, "=FechaCorte", f_fec, ser(dt.date(2026, 10, 31)))
ws.write_formula(2, 0, '="Controles: "&IF(ControlMaestro,"OK","REVISAR")', None, "Controles: OK")
ws.conditional_format("A3", {"type": "formula", "criteria": "=ControlMaestro", "format": f_ok})
ws.conditional_format("A3", {"type": "formula", "criteria": "=NOT(ControlMaestro)", "format": f_mal})
filas_est = [
    (4, None, "LADO BANCO", None, None),
    (5, "", "Saldo según el extracto del banco", "=SaldoIniBanco+SUM(Banco[Importe])", E["saldo_banco"]),
    (6, "+", "Ingresos en tránsito (cobros contabilizados que el banco aún no ha abonado)",
     '=SUMIFS(Libros[Importe],Libros[Tipo],"Ingreso en tránsito")', E["transito"]),
    (7, "−", "Pagos pendientes de cargo (cheques y transferencias que el banco aún no ha cargado)",
     '=SUMIFS(Libros[Importe],Libros[Tipo],"Pago pendiente de cargo")', E["pendientes_cargo"]),
    (8, "=", "Saldo bancario ajustado", "=SUM(C6:C8)", E["ajustado_banco"]),
    (10, None, "LADO LIBROS (cuenta 572000001)", None, None),
    (11, "", "Saldo según libros", '=SaldoIniLibros+SUMIFS(Libros[Importe],Libros[Origen],"Libros")', E["saldo_libros"]),
    (12, "−", "Cargos del banco sin contabilizar (comisiones, cuota del préstamo, recibo devuelto)",
     '=SUMIFS(Banco[Importe],Banco[Tipo],"Cargo banco sin contabilizar")', E["cargos"]),
    (13, "+", "Abonos del banco sin contabilizar (transferencia sin identificar)",
     '=SUMIFS(Banco[Importe],Banco[Tipo],"Abono banco sin contabilizar")', E["abonos"]),
    (14, "−", "Cobro contabilizado dos veces",
     '=SUMIFS(Banco[Importe],Banco[Tipo],"Error en libros: duplicado")-SUMIFS(Libros[Importe],Libros[Tipo],"Error en libros: duplicado")',
     E["duplicado"]),
    (15, "−", "Pago contabilizado con un importe distinto del cargado por el banco",
     '=SUMIFS(Banco[Importe],Banco[Tipo],"Error en libros: importe")-SUMIFS(Libros[Importe],Libros[Tipo],"Error en libros: importe")',
     E["importe"]),
    (16, "=", "Saldo contable ajustado", "=SUM(C12:C16)", E["ajustado_libros"]),
    (18, None, "Diferencia (tiene que ser 0,00)", "=ROUND(C9-C17,2)", E["diferencia"]),
]
for r, signo, lab, fml, val in filas_est:
    if fml is None:
        ws.write(r, 1, lab, f_sub)
        continue
    tot = signo == "=" or r == 18
    ws.write(r, 0, signo or "", f_lab_tot if tot else None)
    ws.write(r, 1, lab, f_lab_tot if tot else None)
    ws.write_formula(r, 2, fml, f_tot if tot else f_eur, val)
ws.conditional_format("C19", {"type": "cell", "criteria": "==", "value": 0, "format": f_ok})
ws.conditional_format("C19", {"type": "cell", "criteria": "!=", "value": 0, "format": f_mal})
ws.write(20, 0, "Partidas de conciliación (una línea cada una; salen solas de las Tablas Banco y Libros)", f_sub)
for j, h in enumerate(["Fecha", "Concepto", "Importe", "Tipo", "Tratamiento"]):
    ws.write(21, j, h, f_cab)
det = pd.concat([B[B["Tipo"] != ""], L[L["Tipo"] != ""]])
ws.write_dynamic_array_formula(
    "A23",
    '=IFNA(VSTACK(FILTER(HSTACK(Banco[Fecha],Banco[Concepto],Banco[Importe],Banco[Tipo],Banco[Nota]),Banco[Tipo]<>"","—"),'
    'FILTER(HSTACK(Libros[Fecha],Libros[Concepto],Libros[Importe],Libros[Tipo],Libros[Nota]),Libros[Tipo]<>"","—")),"")',
    f_fec, ser(det["Fecha"].iloc[0]))
ws.fit_to_pages(1, 1)
ws.set_landscape()
ws.set_paper(9)

# ---- Asiento propuesto
ws = hojas["Asiento"]
ws.write(0, 0, "Propuesta de asientos a 31/10/2026 (los registra Contabilidad)", f_tit)
ws.write(1, 0, "Cuentas del Plan General de Contabilidad. Importes calculados desde las Tablas: no hay que teclear ninguno.")
for j, h in enumerate(["Asiento", "Cuenta", "Descripción", "Debe", "Haber"]):
    ws.write(3, j, h, f_cab)
AS = [
    ("1", "626", "Servicios bancarios y similares (comisiones y gastos de devolución)", '=-SUMIFS(Banco[Importe],Banco[Cuenta],"626")', c626, None, None),
    ("1", "662", "Intereses de deudas (cuota del préstamo del mes)", "=ROUND(IPMT(PrestTIN/12,CuotaMes,PrestCuotas,-PrestCapital),2)", INT, None, None),
    ("1", "520", "Deudas a corto plazo con entidades de crédito (capital de la cuota)", "=ROUND(PPMT(PrestTIN/12,CuotaMes,PrestCuotas,-PrestCapital),2)", CAP, None, None),
    ("1", "430", "Clientes: recibo devuelto (vuelve a deber)", '=-SUMIFS(Banco[Importe],Banco[Cuenta],"430")', c430, None, None),
    ("1", "572000001", "Banco Norte c/c", None, None, "=SUM(D5:D8)", round(c626 + INT + CAP + c430, 2)),
    ("2", "572000001", "Banco Norte c/c: transferencia recibida sin identificar", '=SUMIFS(Banco[Importe],Banco[Cuenta],"555")', c555, None, None),
    ("2", "555", "Partidas pendientes de aplicación", None, None, "=D10", c555),
    ("3", "430", "Clientes: anulación del cobro contabilizado dos veces", '=SUMIFS(Libros[Importe],Libros[Tipo],"Error en libros: duplicado")', dup_l, None, None),
    ("3", "572000001", "Banco Norte c/c", None, None, "=D12", dup_l),
    ("4", "400", "Proveedores: diferencia del pago contabilizado con otro importe",
     '=SUMIFS(Libros[Importe],Libros[Tipo],"Error en libros: importe")-SUMIFS(Banco[Importe],Banco[Tipo],"Error en libros: importe")', dif_imp, None, None),
    ("4", "572000001", "Banco Norte c/c", None, None, "=D14", dif_imp),
]
for i, (a, cta, desc, fd, vd, fh, vh) in enumerate(AS, start=4):
    ws.write(i, 0, a)
    ws.write_string(i, 1, cta)
    ws.write(i, 2, desc)
    if fd:
        ws.write_formula(i, 3, fd, f_eur, vd)
    if fh:
        ws.write_formula(i, 4, fh, f_eur, vh)
tot_d = round(c626 + INT + CAP + c430 + c555 + dup_l + dif_imp, 2)
ws.write(16, 2, "Sumas", f_lab_tot)
ws.write_formula(16, 3, "=SUM(D5:D15)", f_tot, tot_d)
ws.write_formula(16, 4, "=SUM(E5:E15)", f_tot, tot_d)
efecto = round(c555 - (c626 + INT + CAP + c430) - dup_l - dif_imp, 2)
ws.write(18, 2, "Efecto en la 572000001 (Debe − Haber)")
ws.write_formula(18, 3, '=SUMIFS(D5:D15,B5:B15,"572000001")-SUMIFS(E5:E15,B5:B15,"572000001")', f_eur, efecto)
ws.write(19, 2, "Saldo de libros después de registrar los asientos")
ws.write_formula(19, 3, "=SaldoFinLibros+D19", f_tot, round(SALDO_FIN_L_DOC + efecto, 2))
ws.write(20, 2, "¿Coincide con el saldo bancario ajustado?")
ws.write_formula(20, 3, "=ROUND(D20-'Conciliación'!C9,2)=0", None, True)
ws.write(22, 0, "Nota: el capital va a la 520 si la parte que vence en los próximos 12 meses ya está reclasificada a corto plazo; si no, a la 170 (Deudas a largo plazo con entidades de crédito).", f_txt)
ws.write(23, 0, "Cuando sepamos de quién es la transferencia de 555, se reclasifica a la 430 del cliente (Debe 555 / Haber 430).", f_txt)
ws.set_column("A:A", 9)
ws.set_column("B:B", 12)
ws.set_column("C:C", 66)
ws.set_column("D:E", 14)
ws.protect()

# ---- Pendientes de octubre (pasan a noviembre)
ws = hojas["Pendientes_octubre"]
ws.write(0, 0, "Partidas pendientes a 31/10/2026: se copian (Pegado especial > Valores) arriba de la Tabla Libros de noviembre, con Origen «Pendiente ant.»", f_sub)
for j, h in enumerate(["Fecha", "Asiento", "Concepto", "Debe", "Haber", "Tipo"]):
    ws.write(2, j, h, f_cab)
ws.write_dynamic_array_formula(
    "A4", '=FILTER(HSTACK(Libros[Fecha],Libros[Asiento],Libros[Concepto],Libros[Debe],Libros[Haber],Libros[Tipo]),'
          '(Libros[Tipo]="Pago pendiente de cargo")+(Libros[Tipo]="Ingreso en tránsito"),"Sin pendientes")',
    f_fec, ser(PENDIENTES_OCT["Fecha"].iloc[0]))
ws.set_column("A:A", 12, f_fec)
ws.set_column("B:B", 11)
ws.set_column("C:C", 62)
ws.set_column("D:E", 13, F(num_format="#,##0.00;-#,##0.00;"))
ws.set_column("F:F", 26)

# ---- Préstamo: cuadro de amortización
ws = hojas["Préstamo"]
ws.write(0, 0, "Préstamo Banco Norte 7701234-55 · cuadro de amortización (sistema francés)", f_tit)
ws.write(1, 0, "Capital")
ws.write_formula(1, 1, "=PrestCapital", f_eur, 85000)
ws.write(2, 0, "TIN anual")
ws.write_formula(2, 1, "=PrestTIN", f_pct, 0.05)
ws.write(3, 0, "Cuota mensual")
ws.write_formula(3, 1, "=ROUND(PMT(PrestTIN/12,PrestCuotas,-PrestCapital),2)", f_eur, CUOTA)
ws.write(4, 0, "Control: Σ capital = capital")
ws.write_formula(4, 1, "=ROUND(SUM(E8:E55)-PrestCapital,2)=0", None, True)
for j, h in enumerate(["Cuota nº", "Fecha", "Cuota", "Intereses", "Capital", "Capital pendiente"]):
    ws.write(6, j, h, f_cab)
for k, cuota, i_, p_, pend_ in PR:
    r = 6 + k
    ws.write_number(r, 0, k)
    fch = dt.date(2025 + (3 + k - 1) // 12, (3 + k - 1) % 12 + 1, 25)
    ws.write_formula(r, 1, f"=DATE(YEAR(PrestPrimeraCuota),MONTH(PrestPrimeraCuota)+A{r+1}-1,DAY(PrestPrimeraCuota))", f_fec, ser(fch))
    ws.write_formula(r, 2, "=PMT(PrestTIN/12,PrestCuotas,-PrestCapital)", f_eur, cuota)
    ws.write_formula(r, 3, f"=IPMT(PrestTIN/12,A{r+1},PrestCuotas,-PrestCapital)", f_eur, i_)
    ws.write_formula(r, 4, f"=PPMT(PrestTIN/12,A{r+1},PrestCuotas,-PrestCapital)", f_eur, p_)
    ws.write_formula(r, 5, f"=PrestCapital-SUM($E$8:E{r+1})", f_eur, max(pend_, 0))
ws.conditional_format("A8:F55", {"type": "formula", "criteria": "=$A8=CuotaMes", "format": F(bold=True, bg_color="#FFF2CC")})
ws.set_column("A:A", 30)
ws.set_column("B:F", 14)
ws.protect()

# ---- Calidad de los datos
ws = hojas["Calidad_datos"]
ws.write(0, 0, "Calidad de los datos recibidos", f_tit)
for j, h in enumerate(["Código", "Problema", "Dónde", "Filas", "Decisión"]):
    ws.write(2, j, h, f_cab)
rep = banco["Importe"].value_counts()
rep_n = int(rep[rep > 1].sum())
rep = ", ".join(f"{txt_num(k)} ×{v}" for k, v in rep[rep > 1].items())
CAL = [
    ("Q11", "6 filas de título antes de la tabla", "Movimientos", 6, "Se pega solo la tabla (desde la fila 8). Saldo inicial → Parámetros."),
    ("—", "Otra cuenta en la misma descarga", "Movimientos (2)", 16, "No entra: es la póliza del Banco Sur (aclaración de Marta)."),
    ("Q07", "Fechas de operación guardadas como texto", "Movimientos, col. A", CONTROLES["fechas_texto"],
     f"Columna Fecha: SI(ESNUMERO(…);…;FECHANUMERO(ESPACIOS(…))). {CONTROLES['fechas_texto_con_espacio']} llevan un espacio al final."),
    ("Q03", "Importes repetidos legítimos", "Movimientos y mayor", rep_n,
     f"No son duplicados ({rep}). Clave = importe + nº de ocurrencia; el −2.350 de septiembre se casa con su pendiente."),
    ("Q21", "Nº de factura, cheque y remesa dentro del concepto", "Los dos lados", "—",
     "Se usa para revisar: remesa R-2610 y factura EV-26-08841 (error de importe)."),
    ("Q14", "Debe y Haber en dos columnas", "Mayor", len(mayor), "Importe = Debe − Haber (en la 572, el Debe es entrada de dinero)."),
    ("Q10", "Filas que no son apuntes", "Mayor", 2, "«Saldo anterior» y «Sumas del periodo» no se pegan; sus saldos van a Parámetros."),
    ("—", "Remesa: 1 abono en el banco = 23 cobros en libros", "Los dos lados", 24, "Se casa el total por la referencia de la remesa."),
]
for i, fila in enumerate(CAL, start=3):
    for j, v in enumerate(fila):
        ws.write(i, j, v, f_txt)
ws.set_column("A:A", 8)
ws.set_column("B:B", 44)
ws.set_column("C:C", 22)
ws.set_column("D:D", 7)
ws.set_column("E:E", 80)

# ---- Controles
ws = hojas["Controles"]
ws.write(0, 0, "Controles", f_tit)
ws.write(2, 1, "CONTROL MAESTRO (todos en verdadero)", f_sub)
for j, h in enumerate(["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "OK"]):
    ws.write(4, j, h, f_cab)
nb, nl = len(B), len(L)
casadas = int((B["Estado"] == "Casada").sum())
CTL = [
    ("Banco: saldo inicial + movimientos = saldo final de la descarga", "=SaldoFinBanco", SALDO_FIN_B_DOC, "=SaldoIniBanco+SUM(Banco[Importe])", E["saldo_banco"], 0.005),
    ("Banco: saldo de la última fila = saldo final", "=SaldoFinBanco", SALDO_FIN_B_DOC, "=INDEX(Banco[Saldo],ROWS(Banco[Saldo]))", SALDO_FIN_B_DOC, 0.005),
    ("Banco: filas cuyo saldo no encadena con la anterior (filas perdidas)", "0", 0, '=COUNTIF(Banco[DifSaldo],"<>0")', 0, 0),
    ("Banco: movimientos con fecha (número) dentro del mes", "=ROWS(Banco[Fecha])", nb,
     '=COUNTIFS(Banco[Fecha],">="&(EOMONTH(FechaCorte,-1)+1),Banco[Fecha],"<="&FechaCorte)', nb, 0),
    ("Libros: saldo inicial + apuntes = saldo final del mayor", "=SaldoFinLibros", SALDO_FIN_L_DOC,
     '=SaldoIniLibros+SUMIFS(Libros[Importe],Libros[Origen],"Libros")', E["saldo_libros"], 0.005),
    ("Libros: apuntes cuyo saldo no encadena", "0", 0, '=COUNTIFS(Libros[Origen],"Libros",Libros[DifSaldo],"<>0")', 0, 0),
    ("Banco: casadas + clasificadas = total de movimientos", "=ROWS(Banco[Importe])", nb,
     '=COUNTIF(Banco[Estado],"Casada*")+COUNTIF(Banco[Tipo],"?*")', nb, 0),
    ("Libros: casadas + clasificadas = total de filas", "=ROWS(Libros[Importe])", nl,
     '=COUNTIF(Libros[Estado],"Casada*")+COUNTIF(Libros[Tipo],"?*")', nl, 0),
    ("Parejas uno a uno: las mismas en los dos lados", '=COUNTIF(Libros[Estado],"Casada")', casadas,
     '=COUNTIF(Banco[Estado],"Casada")', casadas, 0),
    ("Remesas: abono del banco = suma de sus cobros en libros", '=SUMIFS(Libros[Importe],Libros[Estado],"Casada (remesa)")', 18430.2,
     '=SUMIFS(Banco[Importe],Banco[Estado],"Casada (remesa)")', 18430.2, 0.005),
    ("Nada «Fuera de margen» ni «Remesa descuadrada» sin revisar", "0", 0,
     '=COUNTIF(Banco[Estado],"Fuera de margen")+COUNTIF(Banco[Estado],"Remesa descuadrada")+COUNTIF(Libros[Estado],"Fuera de margen")+COUNTIF(Libros[Estado],"Remesa descuadrada")', 0, 0),
    ("Estado de conciliación: diferencia", "0", 0, "='Conciliación'!C19", 0, 0.005),
    ("Préstamo: cuota calculada = cargo del banco", '=-SUMIFS(Banco[Importe],Banco[Cuenta],"662/520")', cargo_prest,
     "=ROUND(PMT(PrestTIN/12,PrestCuotas,-PrestCapital),2)", CUOTA, 0.005),
    ("Préstamo: intereses + capital = cargo del banco", '=-SUMIFS(Banco[Importe],Banco[Cuenta],"662/520")', cargo_prest,
     "=Asiento!D6+Asiento!D7", round(INT + CAP, 2), 0.005),
    ("Asiento: Debe = Haber", "=Asiento!D17", tot_d, "=Asiento!E17", tot_d, 0.005),
    ("Asiento aplicado: saldo de libros = saldo bancario ajustado", "='Conciliación'!C9", E["ajustado_banco"], "=Asiento!D20",
     round(SALDO_FIN_L_DOC + efecto, 2), 0.005),
]
for i, (desc, fe, ve, fo, vo, tol) in enumerate(CTL, start=5):
    r = i + 1
    ws.write(i, 0, i - 4)
    ws.write(i, 1, desc, f_txt)
    if fe.startswith("="):
        ws.write_formula(i, 2, fe, f_eur, ve)
    else:
        ws.write_number(i, 2, float(fe), f_eur)
    ws.write_formula(i, 3, fo, f_eur, vo)
    ws.write_formula(i, 4, f"=D{r}-C{r}", f_eur, round(vo - ve, 2))
    ws.write_number(i, 5, tol, f_eur)
    ws.write_formula(i, 6, f"=ABS(E{r})<=F{r}", None, True)
ultima = 5 + len(CTL)
ws.write_formula(2, 6, f"=AND(G6:G{ultima})", None, True)
wb.define_name("ControlMaestro", "=Controles!$G$3")
for rango in ("G3", f"G6:G{ultima}"):
    ws.conditional_format(rango, {"type": "cell", "criteria": "==", "value": True, "format": f_ok})
    ws.conditional_format(rango, {"type": "cell", "criteria": "==", "value": False, "format": f_mal})
ws.set_column("A:A", 5)
ws.set_column("B:B", 62)
ws.set_column("C:F", 14)
ws.set_column("G:G", 10)
ws.protect()

# ---- Léame
texto(hojas["Léame"], [
    ("t", "P4 · Conciliación bancaria · Banco Norte, cuenta 572000001"),
    ("p", "Qué es: la conciliación de octubre de 2026 y la plantilla para conciliar cada mes. Pedida por Marta Ruiz (Dirección financiera) el 16/11/2026."),
    ("p", "Fecha de corte: 31/10/2026. Fuentes: descarga del Banco Norte (hoja Movimientos), mayor de la 572000001 y pendientes de septiembre."),
    ("s", "Supuestos (aclarados con Marta)"),
    ("p", "• Solo la cuenta 572000001. La hoja «Movimientos (2)» es la póliza del Banco Sur y no entra."),
    ("p", "• Pareja = mismo importe con signo, mismo nº de ocurrencia y como mucho 5 días naturales entre la fecha de operación del banco y la del apunte. Las pendientes del mes anterior casan sin límite de días."),
    ("p", "• Las remesas casan por su total. La diferencia final tiene que ser 0,00 €. Contabilidad registra el asiento propuesto con fecha de fin de mes."),
    ("s", "Hojas (de izquierda a derecha)"),
    ("p", "Parámetros → Banco_origen y Libros_origen (lo recibido, intacto) → Banco y Libros (Tablas: lo pegado + columnas calculadas) → Conciliación (estado del auditor) → Asiento → Pendientes_octubre → Préstamo → Calidad_datos → Controles → Cómo se hizo."),
    ("p", "Colores: amarillo claro = celdas que se rellenan o se pegan; naranja claro = fila sin pareja (a revisar); verde/rojo = controles."),
    ("s", "Cómo actualizar cada mes (8 pasos)"),
    ("p", "1. Abre la plantilla (Archivo > Nuevo > Personal) y guarda el libro como P4_Conciliacion_BancoNorte_AAAA-MM_v01.xlsx."),
    ("p", "2. En Parámetros, cambia la fecha de corte y los cuatro saldos (de la descarga y del mayor). La cuota del préstamo se calcula sola."),
    ("p", "3. Pega la descarga del banco tal cual en Banco_origen y el mayor en Libros_origen."),
    ("p", "4. En la Tabla Banco borra las filas del mes anterior y pega (Pegado especial > Valores) la tabla del banco sin las 6 filas de título. Las columnas calculadas se rellenan solas."),
    ("p", "5. En la Tabla Libros pon arriba las filas de Pendientes del mes anterior (Origen «Pendiente ant.») y debajo los apuntes del mayor (sin «Saldo anterior» ni «Sumas»), con Origen «Libros»."),
    ("p", "6. Revisa las filas en naranja: si la propuesta no es correcta, elige el tipo en Revision y escribe la nota; en el banco, pon la cuenta (626, 662/520, 430, 555)."),
    ("p", "7. Mira Controles: el control maestro tiene que estar en verde y la diferencia de Conciliación en 0,00."),
    ("p", "8. Copia Pendientes_octubre (como valores) para el mes siguiente, exporta Conciliación y Asiento a PDF y escribe a Marta."),
    ("s", "Registro de cambios"),
    ("p", "16/11/2026 · v01 · Conciliación de octubre y plantilla · Administración."),
    ("s", "Protección"),
    ("p", "Asiento, Préstamo y Controles están protegidas sin contraseña (Revisar > Desproteger hoja). Banco y Libros no se protegen: una Tabla no crece en una hoja protegida."),
], 130)

# ---- Cómo se hizo
texto(hojas["Cómo se hizo"], [
    ("t", "Cómo se hizo (y lo que la librería no puede crear)"),
    ("s", "Fórmulas clave (en Excel en español)"),
    ("p", "Fecha limpia: =SI(ESNUMERO([@FechaOperacion]);[@FechaOperacion];FECHANUMERO(ESPACIOS([@FechaOperacion])))"),
    ("p", "Saldo que encadena: =REDONDEAR(SI(ESNUMERO(E1);E1;SaldoIniBanco)+[@Importe]-[@Saldo];2) → 0 en todas las filas."),
    ("p", "Remesa: =SI.ERROR(EXTRAE([@Concepto];HALLAR(\"remesa R-\";[@Concepto])+7;6);\"\")"),
    ("p", "Clave con nº de ocurrencia: =SI([@Remesa]<>\"\";\"\";[@Importe]&\"|\"&CONTAR.SI.CONJUNTO($D$2:D2;[@Importe];$I$2:I2;\"\")) (el rango crece al bajar)."),
    ("p", "Pareja: =SI([@Clave]=\"\";\"\";BUSCARX([@Clave];Libros[Clave];Libros[Fecha];\"\")) y Estado con el margen: SI(O([@OrigenPareja]<>\"Libros\";ABS([@Dias])<=MargenDias);\"Casada\";\"Fuera de margen\")."),
    ("p", "Remesa casada: ABS(SUMAR.SI.CONJUNTO(Libros[Importe];Libros[Remesa];[@Remesa])-[@Importe])<0,005."),
    ("p", "Estado de conciliación: SUMAR.SI.CONJUNTO por Tipo en cada Tabla. Intereses: =REDONDEAR(PAGOINT(PrestTIN/12;CuotaMes;PrestCuotas;-PrestCapital);2) = 229,56; capital: PAGOPRIN(…) = 1.727,93; cuota: PAGO(…) = 1.957,49."),
    ("p", "Lista de partidas: =SI.ND(APILARV(FILTRAR(APILARH(Banco[Fecha];Banco[Concepto];Banco[Importe];Banco[Tipo];Banco[Nota]);Banco[Tipo]<>\"\";\"—\");FILTRAR(…Libros…));\"\"). En Excel 2019 o anterior: filtra cada Tabla por Tipo y copia."),
    ("s", "Formato condicional y validación"),
    ("p", "Inicio > Formato condicional > Nueva regla > Utilice una fórmula…: =IZQUIERDA($N2;6)<>\"Casada\" (en Libros, la misma con su columna Estado), relleno naranja claro. En Controles, verde si VERDADERO y rojo si FALSO."),
    ("p", "Datos > Validación de datos > Lista, origen =TiposBanco (o =TiposLibros) en la columna Revision."),
    ("s", "Plantilla"),
    ("p", "Archivo > Guardar como > tipo «Plantilla de Excel (*.xltx)». Antes: borra las filas de datos de las Tablas (deja una), deja los Parámetros en blanco y protege Asiento, Préstamo y Controles (Revisar > Proteger hoja)."),
    ("s", "Alternativa con Power Query (N4)"),
    ("p", "1. Datos > Obtener datos > De un archivo > De un libro: elige la hoja Movimientos. En el editor: Inicio > Quitar filas > Quitar filas superiores (6) y Transformar > Usar la primera fila como encabezado."),
    ("p", "2. F. Operación: Cambiar tipo > Usar configuración regional… > Fecha, Español (España). Así entran también las 10 fechas en texto."),
    ("p", "3. Mayor: quita las 2 filas de título, filtra las filas con Asiento vacío (Saldo anterior y Sumas) y agrega la columna personalizada Importe = [Debe] - [Haber] (antes, reemplaza los valores null por 0)."),
    ("p", "4. Anexar consultas: Pendientes del mes anterior + Mayor (columna Origen)."),
    ("p", "5. Nº de ocurrencia: Transformar > Agrupar por Importe con la operación «Todas las filas»; columna personalizada =Table.AddIndexColumn([Filas],\"Ocurrencia\",1,1) y expandir. Ordena antes por fecha."),
    ("p", "6. Inicio > Combinar consultas por Importe y Ocurrencia: tipo «Externa completa» para ver las dos caras y «Anti izquierda» para lo que queda sin pareja en cada lado."),
    ("p", "7. Remesas: Agrupar por Remesa (suma de Importe) y combinar con el abono del banco."),
    ("p", "8. Cerrar y cargar en Tablas; el estado de conciliación con SUMAR.SI.CONJUNTO no cambia. Cada mes: sustituir el archivo y Datos > Actualizar todo (Ctrl+Alt+F5)."),
], 140)

wb.close()
print(json.dumps({k: v for k, v in CONTROLES.items() if k not in ("estado",)}, ensure_ascii=False, default=str))
print("estado:", E)

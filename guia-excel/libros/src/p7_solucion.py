# -*- coding: utf-8 -*-
"""
P7 · Presupuesto frente a real y previsión de cierre · SOLUCIÓN
================================================================

Lee los archivos SUCIOS que recibe la alumna (p7-datos.xlsx, p7-diario-2026-ene-oct.csv y, para el
cambio inesperado, p7-diario-2026-ene-oct-18nov.csv), los limpia con las reglas del encargo y las
aclaraciones de Marta, comprueba la limpieza contra src/p7-verdad.json y genera:

  libros/p7-solucion.xlsx     la solución con fórmulas reales de Excel (Tablas, BUSCARX con SI.ND,
                              SUMAR.SI.CONJUNTO, FILTRAR + ORDENARPOR, PAGOINT…), hoja de Controles con
                              control maestro, cascada (simulada con columnas apiladas) y «Cómo se hizo»
                              con lo que la librería no puede crear (Power Query, Administrador de
                              escenarios, Buscar objetivo, gráfico de cascada nativo, LAMBDA).
  libros/src/p7-controles.json   los totales de control calculados con pandas DESDE LOS DATOS.

Reglas de limpieza (aclaraciones de Marta):
- Presupuesto: por pestaña, desde la fila «Cuenta»; solo filas con Cuenta numérica (fuera subtotales y
  TOTAL); fuera la columna Total; mes normalizado (fecha, texto o número → 1-12); textos «16.500,00» →
  número; Dirección: total anual / 12. Departamento por pestaña (Ingresos y Comercial → COM).
- Real: Cuenta3 = VALOR(IZQUIERDA(Cuenta;3)); gasto = Debe − Haber; ingreso = Haber − Debe; centro vacío
  → Reparto_por_cuenta o «Sin asignar»; excepción 62900099 → «Apertura Logroño».
- Importa: |desv.| ≥ 5 % y ≥ 3.000 € (sin presupuesto: solo ≥ 3.000 €).
- Previsión: real ene-oct + presupuesto nov-dic; ventas y coste nov-dic × (1 + escenario); temporales =
  importe del año; financieros nov-dic = PAGOINT cuotas 20 y 21 + 3.100 €/mes de póliza; Logroño +6.500 €/mes.

Uso:  python3 p7_solucion.py   (después de p7_datos.py)
"""
import json
import os

import numpy as np
import openpyxl
import pandas as pd
import xlsxwriter
from xlsxwriter.utility import xl_rowcol_to_cell as rc

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
SOL = os.path.join(LIBROS, "p7-solucion.xlsx")
VERDAD = json.load(open(os.path.join(AQUI, "p7-verdad.json"), encoding="utf-8"))
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]
MES_CORTE = 10
UMBRAL_PCT, UMBRAL_EUR = 0.05, 3000
LOGRONO_MES, POLIZA_MES = 6500, 3100
DEP_PESTANA = {"Ingresos": "COM", "Comercial": "COM", "Almacén y logística": "ALM", "Administración": "ADM",
               "Dirección": "DIR"}
BLOQUES = ["Ventas", "Coste de ventas", "Personal", "Otros gastos de explotación", "Amortización", "Financiero"]
DEPS = ["COM", "ALM", "ADM", "DIR", "Sin asignar"]
EXCEPCIONES = [("62900099", "Gastos apertura Logroño", "Apertura Logroño", "Gasto", "Otros gastos de explotación",
                "Fuera de presupuesto (aclaración de Marta). Si se mapea por 3 dígitos se esconde en Otros servicios")]
TEMPORALES = [("Seguros", "ADM", 14400, "Prima anual cargada entera en enero (presupuesto en doceavas)"),
              ("Amortización", "ADM", 96000, "Dotación trimestral: marzo, junio, septiembre y diciembre")]
REGLAS = [("Ventas netas", "Escenario de ventas"), ("Compras de mercaderías", "Escenario de ventas"),
          ("Intereses de deudas", "Préstamo y póliza"), ("Apertura Logroño", "Logroño")]


def ipmt(tasa, per, nper, va):
    cuota = va * tasa / (1 - (1 + tasa) ** -nper)
    saldo = va * (1 + tasa) ** (per - 1) - cuota * ((1 + tasa) ** (per - 1) - 1) / tasa
    return saldo * tasa


# =====================================================================================
# 1. LEER Y LIMPIAR (pandas, desde los archivos sucios)
# =====================================================================================
wbd = openpyxl.load_workbook(os.path.join(LIBROS, "p7-datos.xlsx"))
mapeo = pd.DataFrame(list(wbd["Mapeo_cuentas"].iter_rows(min_row=2, values_only=True)),
                     columns=["Cuenta3", "Descripcion", "Partida", "Tipo", "Bloque"])
reparto = pd.DataFrame([r for r in wbd["Reparto_por_cuenta"].iter_rows(min_row=2, values_only=True)
                        if isinstance(r[0], (int, float))], columns=["Cuenta3", "CentroCoste", "Motivo"])
MAP = mapeo.drop_duplicates("Cuenta3").set_index("Cuenta3")
MES_TXT = {m.capitalize(): i + 1 for i, m in enumerate(MESES)}

ppto, calidad = [], []
for pest, dep in DEP_PESTANA.items():
    ws = wbd[pest]
    filas = list(ws.iter_rows(values_only=True))
    h = next(i for i, r in enumerate(filas) if r[0] == "Cuenta")
    cab = filas[h]
    meses_col = {}
    for j, x in enumerate(cab[2:], 2):
        if x is None:
            continue
        if hasattr(x, "month"):
            meses_col[j] = x.month
        elif isinstance(x, str) and x in MES_TXT:
            meses_col[j] = MES_TXT[x]
        elif isinstance(x, (int, float)) and 1 <= x <= 12:
            meses_col[j] = int(x)
        elif isinstance(x, str) and x.startswith("Total anual"):
            meses_col[j] = "anual"
    no_num = 0
    for r in filas[h + 1:]:
        if not isinstance(r[0], (int, float)):
            no_num += r[0] is not None
            continue
        for j, mes in meses_col.items():
            v = r[j]
            if isinstance(v, str):
                v = float(v.replace(".", "").replace(",", "."))
            if mes == "anual":
                for m in range(1, 13):
                    ppto.append(dict(Pestana=pest, Departamento=dep, Cuenta3=int(r[0]), Descripcion=r[1], Mes=m,
                                     Importe=v / 12))
            else:
                ppto.append(dict(Pestana=pest, Departamento=dep, Cuenta3=int(r[0]), Descripcion=r[1], Mes=mes,
                                 Importe=float(v)))
    calidad.append((f"Presupuesto · {pest}", "Q11/Q10", f"{h} filas de título; {no_num} filas de subtotal o TOTAL",
                    "Empezar en la fila «Cuenta» y quedarse solo con las filas de Cuenta numérica"))
PL = pd.DataFrame(ppto)
PL["Partida"] = PL.Cuenta3.map(MAP.Partida)
PL["Tipo"] = PL.Cuenta3.map(MAP.Tipo)
PL["Bloque"] = PL.Cuenta3.map(MAP.Bloque)
PL["Importe"] = PL.Importe.astype(float)
assert len(PL) == 312 and PL.Partida.notna().all()
pb = PL.groupby("Bloque").Importe.sum()
assert round(pb["Ventas"], 2) == 9480000 and round(PL[PL.Tipo == "Gasto"].Importe.sum(), 2) == 9173000
for k, v in VERDAD["ppto_bloques"].items():
    assert abs(pb[k] - v) < 0.01, k


def leer_diario(ruta):
    d = pd.read_csv(ruta, sep=";", decimal=",", encoding="utf-8-sig", dtype={"Cuenta": str, "Asiento": str},
                    keep_default_na=False)
    d["Fecha"] = pd.to_datetime(d.Fecha, format="%d/%m/%Y")
    d["Debe"] = d.Debe.astype(float)
    d["Haber"] = d.Haber.astype(float)
    d["Cuenta3"] = d.Cuenta.str[:3].astype(int)
    d["Mes"] = d.Fecha.dt.month
    rep = reparto.set_index("Cuenta3").CentroCoste
    d["Dpto"] = np.where(d.CentroCoste != "", d.CentroCoste, d.Cuenta3.map(rep).fillna("Sin asignar"))
    exc = {e[0]: e for e in EXCEPCIONES}
    d["Partida"] = [exc[c][2] if c in exc else MAP.Partida.get(c3, "SIN PARTIDA") for c, c3 in zip(d.Cuenta, d.Cuenta3)]
    d["Tipo"] = d.Cuenta3.map(MAP.Tipo)
    d["Bloque"] = [exc[c][4] if c in exc else MAP.Bloque.get(c3, "SIN PARTIDA") for c, c3 in zip(d.Cuenta, d.Cuenta3)]
    d["Importe"] = np.where(d.Tipo == "Gasto", d.Debe - d.Haber, d.Haber - d.Debe)
    return d


DI = leer_diario(os.path.join(LIBROS, "p7-diario-2026-ene-oct.csv"))
D18 = leer_diario(os.path.join(LIBROS, "p7-diario-2026-ene-oct-18nov.csv"))
assert len(DI) == VERDAD["lineas_diario"] and (DI.Partida == "SIN PARTIDA").sum() == 0
for k, v in VERDAD["real_partida_cc"].items():
    p, c = k.split("|")
    assert abs(DI[(DI.Partida == p) & (DI.Dpto == c)].Importe.sum() - v) < 0.01, k
calidad += [
    ("Diario", "Q09", f"{int((DI.CentroCoste == '').sum())} apuntes sin centro de coste "
     f"({', '.join(f'{c}: {n}' for c, n in DI[DI.CentroCoste == ''].Cuenta3.value_counts().sort_index().items())})",
     "Reparto_por_cuenta; la 629 no está → «Sin asignar»"),
    ("Diario", "Q14", f"{int(((DI.Tipo == 'Gasto') & (DI.Haber > 0)).sum())} gastos en el Haber y "
     f"{int(((DI.Tipo == 'Ingreso') & (DI.Debe > 0)).sum())} ingresos en el Debe",
     "Importe con signo según el tipo: gasto = Debe − Haber; ingreso = Haber − Debe"),
    ("Diario", "Q16", f"Cuenta 62900099 ({DI[DI.Cuenta == '62900099'].Importe.sum():,.2f} €) sin mapeo propio",
     "Tabla Excepciones (8 dígitos) antes que el mapeo por 3 dígitos"),
    ("Mapeo_cuentas", "Q16", "Cuenta3 guardada como número; IZQUIERDA devuelve texto", "VALOR(IZQUIERDA(Cuenta;3))"),
    ("Presupuesto · Administración", "Q05", "Importes guardados como texto (su TOTAL da 0)",
     "Cambiar tipo con configuración regional Español (España)"),
    ("Presupuesto · Dirección", "—", "Solo total anual", "Doceavas partes (aclaración de Marta)"),
    ("Diario", "Temporal", "Seguro anual 14.400 en enero; amortización 24.000 por trimestre",
     "No se toca la contabilidad: se marca «Temporal» y en la previsión va el importe del año"),
    ("Diario", "Reclasificación", "Asiento 2026/4120: −18.000 en la 629 y +18.000 en la 621 (ALM)",
     "Se respeta: con Debe − Haber queda bien; sumando solo el Debe, Otros servicios sale 18.000 de más"),
]

# =====================================================================================
# 2. CÁLCULOS (pandas) = lo que darán las fórmulas
# =====================================================================================
ORD_PART = list(dict.fromkeys(list(mapeo.Partida) + ["Apertura Logroño"]))
claves = pd.concat([PL[["Bloque", "Partida", "Departamento"]],
                    DI[["Bloque", "Partida", "Dpto"]].rename(columns={"Dpto": "Departamento"})]).drop_duplicates()
claves["o"] = claves.Bloque.map(BLOQUES.index) * 10000 + claves.Partida.map(ORD_PART.index) * 10 \
    + claves.Departamento.map(DEPS.index)
DET = claves.sort_values("o").drop(columns="o").reset_index(drop=True)
TIPO_P = {**dict(zip(mapeo.Partida, mapeo.Tipo)), "Apertura Logroño": "Gasto"}
REG = dict(REGLAS)
TEMP = {(p, d): v for p, d, v, _ in TEMPORALES}
FIN_NOVDIC = ipmt(0.05 / 12, 20, 48, 85000) + ipmt(0.05 / 12, 21, 48, 85000) + POLIZA_MES * (12 - MES_CORTE)


def detalle(diario, var=0.0, logr=1):
    out = []
    for r in DET.itertuples():
        real = diario[(diario.Partida == r.Partida) & (diario.Dpto == r.Departamento) & (diario.Mes <= MES_CORTE)].Importe.sum()
        pp = PL[(PL.Partida == r.Partida) & (PL.Departamento == r.Departamento)]
        ppa, pan = pp[pp.Mes <= MES_CORTE].Importe.sum(), pp.Importe.sum()
        desv = real - ppa
        pct = desv / abs(ppa) if ppa else None
        tipo = TIPO_P[r.Partida]
        fd = "=" if round(desv, 2) == 0 else ("D" if (desv > 0) == (tipo == "Gasto") else "F")
        nat = "Temporal" if (r.Partida, r.Departamento) in TEMP else ("Fuera de presupuesto" if pan == 0 else "Real")
        imp = abs(desv) >= UMBRAL_EUR if ppa == 0 else (abs(pct) >= UMBRAL_PCT and abs(desv) >= UMBRAL_EUR)
        regla = REG.get(r.Partida, "Real + ppto nov-dic")
        nd = pan - ppa
        if nat == "Temporal":
            prev = TEMP[(r.Partida, r.Departamento)]
        elif regla == "Escenario de ventas":
            prev = real + nd * (1 + var)
        elif regla == "Préstamo y póliza":
            prev = real + FIN_NOVDIC
        elif regla == "Logroño":
            prev = real + LOGRONO_MES * (12 - MES_CORTE) * logr
        else:
            prev = real + nd
        out.append(dict(Bloque=r.Bloque, Partida=r.Partida, Departamento=r.Departamento, Real=real, Ppto=ppa,
                        Desv=desv, DesvPct=pct, FD=fd, Naturaleza=nat, Importa=bool(imp), Tipo=tipo, Regla=regla,
                        PptoAnual=pan, PptoNovDic=nd, Prevision=prev, DesvCierre=prev - pan))
    return pd.DataFrame(out)


def resumen(det):
    s = {c: det.groupby("Bloque")[c].sum() for c in ["Real", "Ppto", "PptoAnual", "Prevision"]}
    R = {}
    for c, v in s.items():
        v = v.reindex(BLOQUES).fillna(0)
        mb = v["Ventas"] - v["Coste de ventas"]
        ebitda = mb - v["Personal"] - v["Otros gastos de explotación"]
        R[c] = dict(ventas=v["Ventas"], coste=v["Coste de ventas"], margen=mb, margen_pct=mb / v["Ventas"],
                    personal=v["Personal"], otros=v["Otros gastos de explotación"], ebitda=ebitda,
                    amort=v["Amortización"], fin=v["Financiero"],
                    resultado=ebitda - v["Amortización"] - v["Financiero"])
    return R


DT = detalle(DI)
RS = resumen(DT)
assert abs(RS["PptoAnual"]["resultado"] - 307000) < 0.01 and abs(RS["PptoAnual"]["ebitda"] - 444000) < 0.01
assert abs(RS["Real"]["resultado"] - (DI.Haber.sum() - DI.Debe.sum())) < 0.01
importan = DT[DT.Importa]
margen_novdic = DT[DT.Bloque == "Ventas"].PptoNovDic.sum() - DT[DT.Bloque == "Coste de ventas"].PptoNovDic.sum()
ventas_novdic = DT[DT.Bloque == "Ventas"].PptoNovDic.sum()
esc = {}
for v in (-0.08, 0.0, 0.04):
    for L in (1, 0):
        r = resumen(detalle(DI, v, L))["Prevision"]
        esc[(v, L)] = (r["ebitda"], r["resultado"])
ebitda_base = esc[(0.0, 1)][0]
var_obj = (444000 - ebitda_base) / margen_novdic
ventas_obj = ventas_novdic * (1 + var_obj)
# Cascada (EBITDA presupuestado acumulado → EBITDA real acumulado)
P, Rr = RS["Ppto"], RS["Real"]
log_desv = DT[DT.Partida == "Apertura Logroño"].Desv.sum()
temp_desv = DT[(DT.Naturaleza == "Temporal") & (DT.Bloque == "Otros gastos de explotación")].Desv.sum()
CASC = [("EBITDA presupuestado", P["ebitda"]),
        ("Ventas (volumen)", (Rr["ventas"] - P["ventas"]) * P["margen_pct"]),
        ("Margen %", Rr["ventas"] * (Rr["margen_pct"] - P["margen_pct"])),
        ("Personal", -(Rr["personal"] - P["personal"])),
        ("Otros gastos", -((Rr["otros"] - P["otros"]) - log_desv - temp_desv)),
        ("Apertura Logroño", -log_desv),
        ("Temporales (seguro)", -temp_desv),
        ("EBITDA real", Rr["ebitda"])]
assert abs(sum(x for _, x in CASC[1:-1]) - (Rr["ebitda"] - P["ebitda"])) < 0.01
# Cambio inesperado (18/11)
DT18 = detalle(D18)
RS18 = resumen(DT18)
t18 = DT18[(DT18.Partida == "Transportes") & (DT18.Departamento == "ALM")].iloc[0]
t16 = DT[(DT.Partida == "Transportes") & (DT.Departamento == "ALM")].iloc[0]
assert round(t18.Real, 2) == 111300 and t18.Importa and not t16.Importa
paco = VERDAD["paco"]

CONTROLES = [
    ("Presupuesto anual total de gastos 2026, todas las pestañas (€)", round(PL[PL.Tipo == "Gasto"].Importe.sum(), 2), 0.01),
    ("Ventas netas reales de enero a octubre de 2026 (€)", round(Rr["ventas"], 2), 0.01),
    ("Resultado real de enero a octubre: Σ Haber − Σ Debe del diario (€)", round(Rr["resultado"], 2), 0.01),
    ("Real de enero a octubre de la partida «Otros servicios», todos los departamentos (€)",
     round(DT[DT.Partida == "Otros servicios"].Real.sum(), 2), 0.01),
    ("Real de enero a octubre sin centro de coste asignable («Sin asignar») (€)",
     round(DT[DT.Departamento == "Sin asignar"].Real.sum(), 2), 0.01),
    ("EBITDA real acumulado de enero a octubre (€)", round(Rr["ebitda"], 2), 0.01),
    ("Número de partidas × departamento cuya desviación «importa»", int(len(importan)), 0),
    ("Previsión de cierre del EBITDA 2026, escenario base: ventas 0 % y Logroño abierto (€)", round(ebitda_base, 2), 0.01),
]
extra = {
    "ebitda_ppto_acum": round(P["ebitda"], 2), "margen_pct_real": Rr["margen_pct"], "margen_pct_ppto": P["margen_pct"],
    "ventas_ppto_acum": round(P["ventas"], 2), "resultado_ppto_acum": round(P["resultado"], 2),
    "resultado_prev_base": round(esc[(0.0, 1)][1], 2),
    "escenarios": {f"{v:+.0%}|{'Logroño' if L else 'sin Logroño'}": [round(a, 2), round(b, 2)] for (v, L), (a, b) in esc.items()},
    "buscar_objetivo": {"var": var_obj, "ventas_novdic": round(ventas_obj, 2), "ventas_novdic_ppto": round(ventas_novdic, 2),
                        "margen_novdic": round(margen_novdic, 2)},
    "fin_novdic": round(FIN_NOVDIC, 2), "ipmt20": round(ipmt(0.05 / 12, 20, 48, 85000), 2),
    "ipmt21": round(ipmt(0.05 / 12, 21, 48, 85000), 2),
    "cumipmt_10_21": round(sum(ipmt(0.05 / 12, k, 48, 85000) for k in range(10, 22)), 2),
    "importan": importan[["Partida", "Departamento", "Real", "Ppto", "Desv", "DesvPct", "FD", "Naturaleza"]].round(4).to_dict("records"),
    "cascada": [(a, round(b, 2)) for a, b in CASC],
    "prev_temporales": {f"{p}|{d}": v for (p, d), v in TEMP.items()},
    "cambio_18nov": {"real_624": round(t18.Real, 2), "ppto_624": round(t18.Ppto, 2), "desv": round(t18.Desv, 2),
                     "pct": round(t18.DesvPct, 4), "importan": int(DT18.Importa.sum()),
                     "ebitda_real": round(RS18["Real"]["ebitda"], 2), "ebitda_prev": round(RS18["Prevision"]["ebitda"], 2),
                     "resultado_real": round(RS18["Real"]["resultado"], 2), "lineas": int(len(D18))},
    "paco": paco,
    "lineas": int(len(DI)), "prev_ebitda_anual_ppto": round(RS["PptoAnual"]["ebitda"], 2),
}
json.dump({"controles": [dict(pregunta=a, respuesta=b, tolerancia=c) for a, b, c in CONTROLES], "extra": extra},
          open(os.path.join(AQUI, "p7-controles.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=float)

# =====================================================================================
# 3. LIBRO DE SOLUCIÓN (fórmulas reales)
# =====================================================================================
wb = xlsxwriter.Workbook(SOL, {"use_future_functions": True})
AZ, AMA = "#1F4E79", "#FFF2CC"
f = {
    "tit": wb.add_format({"bold": True, "font_size": 15, "font_color": AZ}),
    "h2": wb.add_format({"bold": True, "font_size": 12, "font_color": AZ, "bottom": 1}),
    "txt": wb.add_format({"text_wrap": True, "valign": "top"}),
    "nota": wb.add_format({"italic": True, "font_color": "#595959", "text_wrap": True, "valign": "top"}),
    "cab": wb.add_format({"bold": True, "bg_color": "#DDEBF7", "border": 1, "text_wrap": True, "valign": "top"}),
    "in": wb.add_format({"bg_color": AMA, "border": 1}),
    "in_eur": wb.add_format({"bg_color": AMA, "border": 1, "num_format": '#,##0.00 "€"'}),
    "in_pct": wb.add_format({"bg_color": AMA, "border": 1, "num_format": "0.0%"}),
    "eur": wb.add_format({"num_format": '#,##0 "€"'}),
    "eur2": wb.add_format({"num_format": '#,##0.00 "€"'}),
    "eurb": wb.add_format({"num_format": '#,##0 "€"', "bold": True, "top": 1}),
    "sig": wb.add_format({"num_format": '"+"#,##0 "€";"-"#,##0 "€";0 "€"'}),
    "sigb": wb.add_format({"num_format": '"+"#,##0 "€";"-"#,##0 "€";0 "€"', "bold": True, "top": 1}),
    "pct": wb.add_format({"num_format": "0.0%"}),
    "pctb": wb.add_format({"num_format": "0.0%", "bold": True}),
    "spct": wb.add_format({"num_format": '"+"0.0%;"-"0.0%;0.0%'}),
    "fecha": wb.add_format({"num_format": "dd/mm/yyyy"}),
    "int": wb.add_format({"num_format": "0"}),
    "ok": wb.add_format({"bold": True, "font_color": "#006100", "bg_color": "#C6EFCE"}),
    "mal": wb.add_format({"bold": True, "font_color": "#9C0006", "bg_color": "#FFC7CE"}),
    "dfmt": wb.add_format({"font_color": "#9C0006", "bold": True}),
    "ffmt": wb.add_format({"font_color": "#006100", "bold": True}),
    "kpi": wb.add_format({"bold": True, "font_size": 12, "num_format": '#,##0 "€"'}),
    "bold": wb.add_format({"bold": True}),
}
hojas = ["Léame", "Parámetros", "Consejo", "Resumen", "Detalle", "Detalle_cuenta", "Escenarios", "Cascada",
         "Auditoría_Paco", "Calidad_datos", "Controles", "Cambio_18nov", "Cómo_se_hizo", "PptoLargo", "Diario",
         "Mapeo", "Tablas_aux"]
W = {h: wb.add_worksheet(h) for h in hojas}


def tabla(ws, r0, c0, nombre, cols, nfilas, estilo="Table Style Light 9"):
    ws.add_table(r0, c0, r0 + max(nfilas, 1), c0 + len(cols) - 1,
                 {"name": nombre, "style": estilo, "columns": [{"header": c} for c in cols]})


def tr(t, c):
    return f"{t}[[#This Row],[{c}]]"


# ---------- Parámetros ----------
ws = W["Parámetros"]
ws.set_column("A:A", 4)
ws.set_column("B:B", 46)
ws.set_column("C:C", 16)
ws.set_column("D:D", 70)
ws.write(0, 1, "Parámetros (celdas amarillas = entradas; todas tienen nombre)", f["tit"])
PAR = [("Mes_corte", "Último mes cerrado", MES_CORTE, "in", "10 = octubre. Al cerrar noviembre, cambia a 11."),
       ("Umbral_pct", "Umbral de desviación (%)", UMBRAL_PCT, "in_pct", "Importa si |desv. %| ≥ este valor…"),
       ("Umbral_eur", "Umbral de desviación (€)", UMBRAL_EUR, "in_eur", "…y |desv. €| ≥ este valor (las dos cosas)."),
       ("Var_ventas", "Escenario: variación de ventas nov-dic", 0, "in_pct", "−8 %, 0 % o +4 % (margen constante)."),
       ("Logrono_activo", "Escenario: Logroño abre (1 = sí, 0 = no)", 1, "in", "Abre en noviembre."),
       ("Logrono_mensual", "Gastos de Logroño por mes", LOGRONO_MES, "in_eur", "Aclaración de Marta."),
       ("Poliza_mensual", "Intereses de la póliza de Banco Sur por mes", POLIZA_MES, "in_eur", "Aclaración de Marta."),
       ("Prestamo_importe", "Préstamo Banco Norte: importe", 85000, "in_eur", "El de la conciliación (P4)."),
       ("Prestamo_tipo", "Préstamo: tipo de interés anual", 0.05, "in_pct", "TIN."),
       ("Prestamo_cuotas", "Préstamo: número de cuotas", 48, "in", "Mensuales."),
       ("Cuota_nov", "Préstamo: n.º de la cuota de noviembre de 2026", 20, "in", "Enero de 2026 es la cuota 10."),
       ("Aprobado_ventas", "Presupuesto aprobado: ventas netas", 9480000, "in_eur", "Acta del consejo (15/12/2025)."),
       ("Aprobado_gastos", "Presupuesto aprobado: total de gastos", 9173000, "in_eur", "Acta del consejo."),
       ("Aprobado_resultado", "Presupuesto aprobado: resultado", 307000, "in_eur", "Acta del consejo."),
       ("Filas_csv", "Filas de datos del CSV del diario", len(DI), "in", "Contadas al importar (sin el encabezado).")]
ws.write_row(2, 1, ["Parámetro", "Valor", "Nota"], f["cab"])
for i, (nom, txt, val, fm, nota) in enumerate(PAR):
    r = 3 + i
    ws.write(r, 1, txt)
    ws.write(r, 2, val, f[fm])
    ws.write(r, 3, nota, f["nota"])
    wb.define_name(nom, f"=Parámetros!$C${r + 1}")

# ---------- Mapeo, Excepciones, Reparto, Temporales, Reglas, Meses ----------
ws = W["Mapeo"]
ws.set_column("A:A", 10)
ws.set_column("B:B", 44)
ws.set_column("C:E", 28)
ws.set_column("F:F", 70)
ws.write(0, 0, "Mapeo de cuentas (Cuenta3 es NÚMERO) y excepciones de 8 dígitos (Cuenta es TEXTO)", f["h2"])
tabla(ws, 2, 0, "Mapeo", ["Cuenta3", "Descripción", "Partida", "Tipo", "Bloque"], len(mapeo))
for i, r in enumerate(mapeo.itertuples(index=False)):
    ws.write_number(3 + i, 0, r.Cuenta3)
    ws.write_row(3 + i, 1, [r.Descripcion, r.Partida, r.Tipo, r.Bloque])
r0 = 3 + len(mapeo) + 2
tabla(ws, r0, 0, "Excepciones", ["Cuenta", "Descripción", "Partida", "Tipo", "Bloque", "Motivo"], len(EXCEPCIONES))
for i, e in enumerate(EXCEPCIONES):
    ws.write_string(r0 + 1 + i, 0, e[0])
    ws.write_row(r0 + 1 + i, 1, list(e[1:]))

ws = W["Tablas_aux"]
ws.set_column("A:A", 24)
ws.set_column("B:B", 16)
ws.set_column("C:C", 14)
ws.set_column("D:D", 62)
ws.write(0, 0, "Tablas auxiliares (entradas: se cambian aquí, nunca dentro de las fórmulas)", f["h2"])
tabla(ws, 2, 0, "Reparto", ["Cuenta3", "CentroCoste", "Motivo"], len(reparto))
for i, r in enumerate(reparto.itertuples(index=False)):
    ws.write_number(3 + i, 0, r.Cuenta3)
    ws.write_row(3 + i, 1, [r.CentroCoste, r.Motivo])
r0 = 3 + len(reparto) + 2
tabla(ws, r0, 0, "Temporales", ["Partida", "Departamento", "ImporteAnual", "Motivo"], len(TEMPORALES))
for i, t in enumerate(TEMPORALES):
    ws.write_row(r0 + 1 + i, 0, [t[0], t[1]])
    ws.write_number(r0 + 1 + i, 2, t[2], f["in_eur"])
    ws.write(r0 + 1 + i, 3, t[3])
r0 += len(TEMPORALES) + 3
tabla(ws, r0, 0, "ReglasPrev", ["Partida", "Regla"], len(REGLAS))
for i, t in enumerate(REGLAS):
    ws.write_row(r0 + 1 + i, 0, list(t))
r0 += len(REGLAS) + 3
tabla(ws, r0, 0, "Meses", ["Mes", "Nombre", "Texto", "Clave_fecha"], 12)
for i in range(12):
    ws.write_row(r0 + 1 + i, 0, [i + 1, MESES[i], MESES[i].capitalize(), f"{i + 1:02d}/2026"])
ws.write(r0 + 14, 0, "Meses: lo que usa Power Query para pasar «ene-26», «Enero» o «1» al número de mes.", f["nota"])

# ---------- PptoLargo ----------
ws = W["PptoLargo"]
cols = ["Pestaña", "Departamento", "Cuenta3", "Descripción", "Mes", "Importe", "Partida", "Tipo", "Bloque"]
tabla(ws, 0, 0, "PptoLargo", cols, len(PL))
ws.set_column("A:A", 20)
ws.set_column("B:C", 12)
ws.set_column("D:D", 40)
ws.set_column("E:E", 6)
ws.set_column("F:F", 14, f["eur2"])
ws.set_column("G:I", 26)
for i, r in enumerate(PL.itertuples(index=False)):
    R = 1 + i
    ws.write_row(R, 0, [r.Pestana, r.Departamento])
    ws.write_number(R, 2, r.Cuenta3)
    ws.write(R, 3, r.Descripcion)
    ws.write_number(R, 4, r.Mes)
    ws.write_number(R, 5, r.Importe, f["eur2"])
    ws.write_formula(R, 6, f'=_xlfn.XLOOKUP({tr("PptoLargo", "Cuenta3")},Mapeo[Cuenta3],Mapeo[Partida],"SIN PARTIDA")', None, r.Partida)
    ws.write_formula(R, 7, f'=_xlfn.XLOOKUP({tr("PptoLargo", "Cuenta3")},Mapeo[Cuenta3],Mapeo[Tipo],"SIN PARTIDA")', None, r.Tipo)
    ws.write_formula(R, 8, f'=_xlfn.XLOOKUP({tr("PptoLargo", "Cuenta3")},Mapeo[Cuenta3],Mapeo[Bloque],"SIN PARTIDA")', None, r.Bloque)
ws.freeze_panes(1, 0)

# ---------- Diario ----------
ws = W["Diario"]
cols = ["Fecha", "Asiento", "Cuenta", "Concepto", "CentroCoste", "Debe", "Haber", "Cuenta3", "Mes", "Dpto",
        "Partida", "Tipo", "Bloque", "Importe"]
tabla(ws, 0, 0, "Diario", cols, len(DI))
ws.set_column("A:A", 11, f["fecha"])
ws.set_column("B:C", 11)
ws.set_column("D:D", 52)
ws.set_column("E:E", 11)
ws.set_column("F:G", 12, f["eur2"])
ws.set_column("H:J", 9)
ws.set_column("K:M", 24)
ws.set_column("N:N", 13, f["eur2"])
T = "Diario"
FD_ = {
    7: f'=VALUE(LEFT({tr(T, "Cuenta")},3))',
    8: f'=MONTH({tr(T, "Fecha")})',
    9: f'=IF({tr(T, "CentroCoste")}<>"",{tr(T, "CentroCoste")},_xlfn.XLOOKUP({tr(T, "Cuenta3")},Reparto[Cuenta3],Reparto[CentroCoste],"Sin asignar"))',
    10: f'=_xlfn.IFNA(_xlfn.XLOOKUP({tr(T, "Cuenta")},Excepciones[Cuenta],Excepciones[Partida]),_xlfn.XLOOKUP({tr(T, "Cuenta3")},Mapeo[Cuenta3],Mapeo[Partida],"SIN PARTIDA"))',
    11: f'=_xlfn.XLOOKUP({tr(T, "Cuenta3")},Mapeo[Cuenta3],Mapeo[Tipo],"SIN PARTIDA")',
    12: f'=_xlfn.IFNA(_xlfn.XLOOKUP({tr(T, "Cuenta")},Excepciones[Cuenta],Excepciones[Bloque]),_xlfn.XLOOKUP({tr(T, "Cuenta3")},Mapeo[Cuenta3],Mapeo[Bloque],"SIN PARTIDA"))',
    13: f'=IF({tr(T, "Tipo")}="Gasto",{tr(T, "Debe")}-{tr(T, "Haber")},{tr(T, "Haber")}-{tr(T, "Debe")})',
}
for i, r in enumerate(DI.itertuples(index=False)):
    R = 1 + i
    ws.write_datetime(R, 0, r.Fecha.to_pydatetime(), f["fecha"])
    ws.write_string(R, 1, r.Asiento)
    ws.write_string(R, 2, r.Cuenta)
    ws.write_string(R, 3, r.Concepto)
    if r.CentroCoste:
        ws.write_string(R, 4, r.CentroCoste)
    ws.write_number(R, 5, r.Debe, f["eur2"])
    ws.write_number(R, 6, r.Haber, f["eur2"])
    vals = {7: r.Cuenta3, 8: r.Mes, 9: r.Dpto, 10: r.Partida, 11: r.Tipo, 12: r.Bloque, 13: round(r.Importe, 2)}
    for c, fo in FD_.items():
        ws.write_formula(R, c, fo, f["eur2"] if c == 13 else None, vals[c])
ws.freeze_panes(1, 0)

# ---------- Detalle (partida × departamento) ----------
ws = W["Detalle"]
DCOLS = ["Bloque", "Partida", "Departamento", "Real", "Ppto", "Desv", "DesvPct", "FD", "Naturaleza", "Importa",
         "Tipo", "Regla", "PptoAnual", "PptoNovDic", "Prevision", "DesvCierre"]
ws.write(0, 0, "Detalle por partida y departamento · acumulado de enero al mes de corte · desviación = real − presupuesto", f["h2"])
ws.write(1, 0, "F/D: en gastos, desviación positiva = D (desfavorable); en ingresos, negativa = D. «Importa»: |%| ≥ Umbral_pct y |€| ≥ Umbral_eur (sin presupuesto: solo €).", f["nota"])
tabla(ws, 3, 0, "Detalle", DCOLS, len(DT))
ws.set_column("A:A", 26)
ws.set_column("B:B", 27)
ws.set_column("C:C", 12)
ws.set_column("D:F", 13)
ws.set_column("G:G", 9)
ws.set_column("H:H", 5)
ws.set_column("I:I", 19)
ws.set_column("J:K", 8)
ws.set_column("L:L", 20)
ws.set_column("M:P", 13)
T = "Detalle"
DF = {
    "Real": f'=SUMIFS(Diario[Importe],Diario[Partida],{tr(T, "Partida")},Diario[Dpto],{tr(T, "Departamento")},Diario[Mes],"<="&Mes_corte)',
    "Ppto": f'=SUMIFS(PptoLargo[Importe],PptoLargo[Partida],{tr(T, "Partida")},PptoLargo[Departamento],{tr(T, "Departamento")},PptoLargo[Mes],"<="&Mes_corte)',
    "Desv": f'={tr(T, "Real")}-{tr(T, "Ppto")}',
    "DesvPct": f'=IF({tr(T, "Ppto")}=0,"",{tr(T, "Desv")}/ABS({tr(T, "Ppto")}))',
    "FD": f'=IF(ROUND({tr(T, "Desv")},2)=0,"=",IF({tr(T, "Tipo")}="Gasto",IF({tr(T, "Desv")}>0,"D","F"),IF({tr(T, "Desv")}<0,"D","F")))',
    "Naturaleza": f'=IF(COUNTIFS(Temporales[Partida],{tr(T, "Partida")},Temporales[Departamento],{tr(T, "Departamento")})>0,"Temporal",IF({tr(T, "PptoAnual")}=0,"Fuera de presupuesto","Real"))',
    "Importa": f'=IF({tr(T, "Ppto")}=0,ABS({tr(T, "Desv")})>=Umbral_eur,AND(ABS({tr(T, "DesvPct")})>=Umbral_pct,ABS({tr(T, "Desv")})>=Umbral_eur))',
    "Tipo": f'=_xlfn.XLOOKUP({tr(T, "Partida")},Mapeo[Partida],Mapeo[Tipo],_xlfn.XLOOKUP({tr(T, "Partida")},Excepciones[Partida],Excepciones[Tipo],"?"))',
    "Regla": f'=_xlfn.XLOOKUP({tr(T, "Partida")},ReglasPrev[Partida],ReglasPrev[Regla],"Real + ppto nov-dic")',
    "PptoAnual": f'=SUMIFS(PptoLargo[Importe],PptoLargo[Partida],{tr(T, "Partida")},PptoLargo[Departamento],{tr(T, "Departamento")})',
    "PptoNovDic": f'={tr(T, "PptoAnual")}-{tr(T, "Ppto")}',
    "Prevision": (f'=IF({tr(T, "Naturaleza")}="Temporal",SUMIFS(Temporales[ImporteAnual],Temporales[Partida],{tr(T, "Partida")},'
                  f'Temporales[Departamento],{tr(T, "Departamento")}),{tr(T, "Real")}+IF({tr(T, "Regla")}="Escenario de ventas",'
                  f'{tr(T, "PptoNovDic")}*(1+Var_ventas),IF({tr(T, "Regla")}="Préstamo y póliza",Fin_NovDic,'
                  f'IF({tr(T, "Regla")}="Logroño",Logrono_mensual*(12-Mes_corte)*Logrono_activo,{tr(T, "PptoNovDic")}))))'),
    "DesvCierre": f'={tr(T, "Prevision")}-{tr(T, "PptoAnual")}',
}
FMT_D = {"Real": f["eur"], "Ppto": f["eur"], "Desv": f["sig"], "DesvPct": f["spct"], "PptoAnual": f["eur"],
         "PptoNovDic": f["eur"], "Prevision": f["eur"], "DesvCierre": f["sig"]}
for i, r in enumerate(DT.itertuples(index=False)):
    R = 4 + i
    ws.write_row(R, 0, [r.Bloque, r.Partida, r.Departamento])
    for j, c in enumerate(DCOLS[3:], 3):
        v = getattr(r, c)
        if c == "DesvPct" and v is None or (isinstance(v, float) and np.isnan(v)):
            v = ""
        ws.write_formula(R, j, DF[c], FMT_D.get(c), v)
nD = len(DT)
ws.conditional_format(4, 7, 3 + nD, 7, {"type": "cell", "criteria": "==", "value": '"D"', "format": f["dfmt"]})
ws.conditional_format(4, 7, 3 + nD, 7, {"type": "cell", "criteria": "==", "value": '"F"', "format": f["ffmt"]})
ws.conditional_format(4, 9, 3 + nD, 9, {"type": "cell", "criteria": "==", "value": "TRUE", "format": f["mal"]})
ws.freeze_panes(4, 3)

# ---------- Detalle por cuenta ----------
ws = W["Detalle_cuenta"]
DC = DI.groupby(["Cuenta", "Dpto"]).agg(Real=("Importe", "sum"), Lineas=("Importe", "size")).reset_index()
ws.write(0, 0, "Detalle por cuenta (8 dígitos) y departamento · enero al mes de corte", f["h2"])
tabla(ws, 2, 0, "DetCuenta", ["Cuenta", "Dpto", "Partida", "Lineas", "Real"], len(DC))
ws.set_column("A:B", 12)
ws.set_column("C:C", 28)
ws.set_column("D:D", 8)
ws.set_column("E:E", 14)
for i, r in enumerate(DC.itertuples(index=False)):
    R = 3 + i
    ws.write_string(R, 0, r.Cuenta)
    ws.write(R, 1, r.Dpto)
    part = DI[DI.Cuenta == r.Cuenta].Partida.iloc[0]
    ws.write_formula(R, 2, f'=_xlfn.XLOOKUP({tr("DetCuenta", "Cuenta")},Diario[Cuenta],Diario[Partida],"")', None, part)
    ws.write_formula(R, 3, f'=COUNTIFS(Diario[Cuenta],{tr("DetCuenta", "Cuenta")},Diario[Dpto],{tr("DetCuenta", "Dpto")})', None, int(r.Lineas))
    ws.write_formula(R, 4, f'=SUMIFS(Diario[Importe],Diario[Cuenta],{tr("DetCuenta", "Cuenta")},Diario[Dpto],{tr("DetCuenta", "Dpto")},Diario[Mes],"<="&Mes_corte)',
                     f["eur2"], round(r.Real, 2))

# ---------- Resumen (cuenta de resultados por bloques) ----------
ws = W["Resumen"]
ws.set_column("A:A", 30)
ws.set_column("B:B", 4)
ws.set_column("C:I", 15)
ws.write(0, 0, "Cuenta de resultados por bloques · acumulado y previsión de cierre", f["h2"])
ws.write_row(3, 0, ["Concepto", "", "Real acum.", "Ppto acum.", "Desviación", "Desv. %", "Ppto anual", "Previsión cierre",
                    "Desv. cierre"], f["cab"])
FIL = [("Ventas netas", "Ventas"), ("Coste de ventas", "Coste de ventas"), ("Margen bruto", None),
       ("Margen bruto %", None), ("Gastos de personal", "Personal"),
       ("Otros gastos de explotación", "Otros gastos de explotación"), ("EBITDA", None), ("Amortización", "Amortización"),
       ("Gastos financieros", "Financiero"), ("Resultado antes de impuestos", None)]
CK = {"C": "Real", "D": "Ppto", "G": "PptoAnual", "H": "Prevision"}
RK = {"C": "Real", "D": "Ppto", "G": "PptoAnual", "H": "Prevision"}
key = {"Ventas netas": "ventas", "Coste de ventas": "coste", "Margen bruto": "margen", "Margen bruto %": "margen_pct",
       "Gastos de personal": "personal", "Otros gastos de explotación": "otros", "EBITDA": "ebitda",
       "Amortización": "amort", "Gastos financieros": "fin", "Resultado antes de impuestos": "resultado"}
for i, (lab, bl) in enumerate(FIL):
    R = 4 + i
    ws.write(R, 0, lab, f["bold"] if bl is None else None)
    if bl:
        ws.write(R, 1, bl, wb.add_format({"font_color": "#FFFFFF"}))     # clave del bloque (texto blanco)
    for col, campo in CK.items():
        c = "CDEFGHI".index(col) + 2
        v = RS[RK[col]][key[lab]]
        if bl:
            fo = f"=SUMIFS(Detalle[{campo}],Detalle[Bloque],$B{R + 1})"
        elif lab == "Margen bruto":
            fo = f"={col}5-{col}6"
        elif lab == "Margen bruto %":
            fo = f"=IF({col}5=0,0,{col}7/{col}5)"
        elif lab == "EBITDA":
            fo = f"={col}7-{col}9-{col}10"
        else:
            fo = f"={col}11-{col}12-{col}13"
        ws.write_formula(R, c, fo, f["pctb"] if lab == "Margen bruto %" else (f["eurb"] if bl is None else f["eur"]), v)
    if lab == "Margen bruto %":
        ws.write_formula(R, 4, "=C8-D8", f["spct"], RS["Real"]["margen_pct"] - RS["Ppto"]["margen_pct"])
        ws.write_formula(R, 8, "=H8-G8", f["spct"], RS["Prevision"]["margen_pct"] - RS["PptoAnual"]["margen_pct"])
    else:
        ws.write_formula(R, 4, f"=C{R + 1}-D{R + 1}", f["sig"], RS["Real"][key[lab]] - RS["Ppto"][key[lab]])
        ws.write_formula(R, 5, f"=IF(D{R + 1}=0,\"\",E{R + 1}/ABS(D{R + 1}))", f["spct"],
                         (RS["Real"][key[lab]] - RS["Ppto"][key[lab]]) / abs(RS["Ppto"][key[lab]]))
        ws.write_formula(R, 8, f"=H{R + 1}-G{R + 1}", f["sig"], RS["Prevision"][key[lab]] - RS["PptoAnual"][key[lab]])
ws.write(15, 0, "Ventas y gastos en positivo. EBITDA = margen bruto − personal − otros gastos de explotación (Apertura Logroño incluida).", f["nota"])
wb.define_name("EBITDA_prev", "=Resumen!$H$11")
wb.define_name("EBITDA_ppto_anual", "=Resumen!$G$11")

# ---------- Escenarios, Buscar objetivo y financieros ----------
ws = W["Escenarios"]
ws.set_column("A:A", 52)
ws.set_column("B:G", 16)
ws.write(0, 0, "Previsión de cierre: escenarios y Buscar objetivo", f["h2"])
ws.write(2, 0, "Gastos financieros de noviembre y diciembre", f["bold"])
ws.write(3, 0, "Intereses préstamo, cuota de noviembre (PAGOINT)")
ws.write_formula(3, 1, "=IPMT(Prestamo_tipo/12,Cuota_nov,Prestamo_cuotas,-Prestamo_importe)", f["eur2"], extra["ipmt20"])
ws.write(4, 0, "Intereses préstamo, cuota de diciembre (PAGOINT)")
ws.write_formula(4, 1, "=IPMT(Prestamo_tipo/12,Cuota_nov+1,Prestamo_cuotas,-Prestamo_importe)", f["eur2"], extra["ipmt21"])
ws.write(5, 0, "Intereses de la póliza (nov-dic)")
ws.write_formula(5, 1, "=Poliza_mensual*(12-Mes_corte)", f["eur2"], POLIZA_MES * 2)
ws.write(6, 0, "Financieros nov-dic (Fin_NovDic)", f["bold"])
ws.write_formula(6, 1, "=SUM(B4:B6)", f["eur2"], extra["fin_novdic"])
wb.define_name("Fin_NovDic", "=Escenarios!$B$7")
ws.write(7, 0, "Comprobación: intereses del préstamo en todo 2026, cuotas 10 a 21 (PAGO.INT.ENTRE)")
ws.write_formula(7, 1, "=-CUMIPMT(Prestamo_tipo/12,Prestamo_cuotas,Prestamo_importe,Cuota_nov-10,Cuota_nov+1,0)", f["eur2"],
                 extra["cumipmt_10_21"])
ws.write(9, 0, "Datos para los escenarios", f["bold"])
ws.write(10, 0, "Ventas netas nov-dic presupuestadas")
ws.write_formula(10, 1, '=SUMIFS(Detalle[PptoNovDic],Detalle[Bloque],"Ventas")', f["eur"], ventas_novdic)
ws.write(11, 0, "Margen bruto nov-dic presupuestado (margen constante)")
ws.write_formula(11, 1, '=B11-SUMIFS(Detalle[PptoNovDic],Detalle[Bloque],"Coste de ventas")', f["eur"], margen_novdic)
ws.write(12, 0, "Gastos de Logroño nov-dic si abre")
ws.write_formula(12, 1, "=Logrono_mensual*(12-Mes_corte)", f["eur"], LOGRONO_MES * 2)
ws.write(13, 0, "EBITDA previsto con ventas 0 % y Logroño abierto (base)", f["bold"])
ws.write_formula(13, 1, "=EBITDA_prev-Var_ventas*B12-(1-Logrono_activo)*B13", f["eurb"], ebitda_base)
ws.write(14, 0, "Amortización + financieros previstos (no dependen del escenario)")
ws.write_formula(14, 1, "=Resumen!H12+Resumen!H13", f["eur"], RS["Prevision"]["amort"] + RS["Prevision"]["fin"])
ws.write_row(16, 0, ["Escenario", "Ventas nov-dic", "Logroño", "EBITDA 2026", "Frente a ppto", "Resultado 2026"], f["cab"])
ESC = [("Pesimista con Logroño", -0.08, 1), ("Base con Logroño", 0.0, 1), ("Optimista con Logroño", 0.04, 1),
       ("Pesimista sin Logroño", -0.08, 0), ("Base sin Logroño", 0.0, 0), ("Optimista sin Logroño", 0.04, 0)]
for i, (n, v, L) in enumerate(ESC):
    R = 17 + i
    ws.write(R, 0, n)
    ws.write_number(R, 1, v, f["in_pct"])
    ws.write_number(R, 2, L, f["in"])
    ws.write_formula(R, 3, f"=$B$14+B{R + 1}*$B$12-C{R + 1}*$B$13+$B$13", f["eur"], esc[(v, L)][0])
    ws.write_formula(R, 4, f"=D{R + 1}-EBITDA_ppto_anual", f["sig"], esc[(v, L)][0] - 444000)
    ws.write_formula(R, 5, f"=D{R + 1}-$B$15", f["eur"], esc[(v, L)][1])
ws.write(23, 0, "La tabla repite con fórmulas lo que da el Administrador de escenarios (Datos > Previsión > Análisis de hipótesis > "
                "Administrador de escenarios), con celdas cambiantes Var_ventas y Logrono_activo y celdas de resultado "
                "EBITDA_prev y Resumen!H14. Pasos en «Cómo_se_hizo».", f["nota"])
ws.write(25, 0, "Buscar objetivo: ventas de nov-dic para llegar al EBITDA presupuestado", f["bold"])
ws.write(26, 0, "EBITDA presupuestado 2026")
ws.write_formula(26, 1, "=EBITDA_ppto_anual", f["eur"], 444000)
ws.write(27, 0, "Variación de ventas nov-dic necesaria (con Logroño)")
ws.write_formula(27, 1, "=(B27-B14)/B12", f["spct"], var_obj)
ws.write(28, 0, "Ventas netas nov-dic necesarias")
ws.write_formula(28, 1, "=B11*(1+B28)", f["eurb"], ventas_obj)
ws.write(29, 0, "Es lo mismo que da Buscar objetivo (Definir la celda: EBITDA_prev; Con el valor: 444000; "
                "Cambiando la celda: Var_ventas) con Logrono_activo = 1.", f["nota"])

# ---------- Cascada (columnas apiladas que simulan la cascada) ----------
ws = W["Cascada"]
ws.set_column("A:A", 26)
ws.set_column("B:H", 13)
ws.write(0, 0, "Cascada del EBITDA: presupuestado acumulado → real acumulado (enero al mes de corte)", f["h2"])
ws.write_row(2, 0, ["Paso", "Importe", "Inicio", "Fin", "Base", "Sube", "Baja", "Total"], f["cab"])
fo_casc = ["=Resumen!D11", "=(Resumen!C5-Resumen!D5)*Resumen!D8", "=Resumen!C5*(Resumen!C8-Resumen!D8)",
           "=-Resumen!E9",
           '=-(Resumen!E10-SUMIFS(Detalle[Desv],Detalle[Partida],"Apertura Logroño")-SUMIFS(Detalle[Desv],Detalle[Naturaleza],"Temporal",Detalle[Bloque],"Otros gastos de explotación"))',
           '=-SUMIFS(Detalle[Desv],Detalle[Partida],"Apertura Logroño")',
           '=-SUMIFS(Detalle[Desv],Detalle[Naturaleza],"Temporal",Detalle[Bloque],"Otros gastos de explotación")',
           "=Resumen!C11"]
acum = 0
for i, ((paso, val), fo) in enumerate(zip(CASC, fo_casc)):
    R = 3 + i
    E = R + 1
    tot = i in (0, len(CASC) - 1)
    ws.write(R, 0, paso, f["bold"] if tot else None)
    ws.write_formula(R, 1, fo, f["eurb"] if tot else f["sig"], val)
    ini = 0 if tot else acum
    fin = val if tot else acum + val
    ws.write_formula(R, 2, "=0" if tot else f"=D{E - 1}", f["eur"], ini)
    ws.write_formula(R, 3, f"=B{E}" if tot else f"=C{E}+B{E}", f["eur"], fin)
    ws.write_formula(R, 4, "=0" if tot else f"=MIN(C{E},D{E})", f["eur"], 0 if tot else min(ini, fin))
    ws.write_formula(R, 5, "=0" if tot else f"=MAX(B{E},0)", f["eur"], 0 if tot else max(val, 0))
    ws.write_formula(R, 6, "=0" if tot else f"=MAX(-B{E},0)", f["eur"], 0 if tot else max(-val, 0))
    ws.write_formula(R, 7, f"=B{E}" if tot else "=0", f["eur"], val if tot else 0)
    acum = fin
ws.write(12, 0, "Comprobación: inicio + pasos = EBITDA real")
ws.write_formula(12, 1, "=ROUND(B4+SUM(B5:B10)-B11,2)=0", None, True)
ws.write(13, 0, "Volumen = (ventas reales − ppto) × margen % ppto. Margen % = ventas reales × (margen % real − ppto). "
                "Signo: lo que sube el EBITDA es positivo.", f["nota"])
ch = wb.add_chart({"type": "column", "subtype": "stacked"})
for nombre, col, color in [("Base", "E", None), ("Sube", "F", "#2E7D32"), ("Baja", "G", "#C62828"), ("Total", "H", "#1F4E79")]:
    s = {"name": nombre, "categories": "=Cascada!$A$4:$A$11", "values": f"=Cascada!${col}$4:${col}$11", "gap": 60}
    s.update({"fill": {"none": True}, "border": {"none": True}} if color is None else {"fill": {"color": color}})
    ch.add_series(s)
ch.set_title({"name": "EBITDA: del presupuesto al real (ene-oct)", "name_font": {"size": 11}})
ch.set_legend({"none": True})
ch.set_y_axis({"num_format": '#,##0 "€"', "major_gridlines": {"visible": True, "line": {"color": "#D9D9D9"}}})
ch.set_size({"width": 620, "height": 320})
ws.insert_chart("J3", ch)

# ---------- Controles ----------
ws = W["Controles"]
ws.set_column("A:A", 70)
ws.set_column("B:E", 15)
ws.set_column("F:F", 8)
ws.write(0, 0, "Controles · el control maestro tiene que estar en VERDADERO antes de entregar", f["h2"])
CTRL = [
    ("Presupuesto largo: ventas netas = aprobado", "=Aprobado_ventas", '=SUMIFS(PptoLargo[Importe],PptoLargo[Bloque],"Ventas")', 9480000, 0.01),
    ("Presupuesto largo: total de gastos = aprobado", "=Aprobado_gastos", '=SUMIFS(PptoLargo[Importe],PptoLargo[Tipo],"Gasto")', 9173000, 0.01),
    ("Presupuesto largo: resultado = aprobado", "=Aprobado_resultado", "=Resumen!G14", 307000, 0.01),
    ("Presupuesto largo: 312 filas (26 cuentas-pestaña × 12 meses)", "=312", "=ROWS(PptoLargo[Importe])", 312, 0),
    ("Filas del diario = filas del CSV", "=Filas_csv", "=ROWS(Diario[Importe])", len(DI), 0),
    ("Cuentas sin partida = 0", "=0", '=COUNTIF(Diario[Partida],"SIN PARTIDA")', 0, 0),
    ("Cuenta3 del diario es número (textos = 0)", "=0", "=SUMPRODUCT(--ISTEXT(Diario[Cuenta3]))", 0, 0),
    ("Real por partidas (Detalle, ingresos − gastos) = Σ Haber − Σ Debe del diario",
     '=SUMIFS(Diario[Haber],Diario[Mes],"<="&Mes_corte)-SUMIFS(Diario[Debe],Diario[Mes],"<="&Mes_corte)', "=Resumen!C14",
     Rr["resultado"], 0.01),
    ("Σ real de gastos por departamento (con «Sin asignar») = total de gastos del diario",
     '=SUMIFS(Diario[Importe],Diario[Tipo],"Gasto",Diario[Mes],"<="&Mes_corte)',
     '=SUMPRODUCT(SUMIFS(Detalle[Real],Detalle[Departamento],{"COM","ALM","ADM","DIR","Sin asignar"},Detalle[Tipo],"Gasto"))',
     DT[DT.Tipo == "Gasto"].Real.sum(), 0.01),
    ("Previsión de amortización = importe del año", "=96000", '=SUMIFS(Detalle[Prevision],Detalle[Partida],"Amortización")', 96000, 0.01),
    ("Previsión de seguros = importe del año", "=14400", '=SUMIFS(Detalle[Prevision],Detalle[Partida],"Seguros")', 14400, 0.01),
    ("Cascada: presupuesto + pasos = EBITDA real", "=Resumen!C11", "=Cascada!B4+SUM(Cascada!B5:B10)", Rr["ebitda"], 0.01),
]
ws.write_row(2, 0, ["Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "OK"], f["cab"])
for i, (txt, esp, obt, val, tol) in enumerate(CTRL):
    R = 3 + i
    E = R + 1
    ws.write(R, 0, txt)
    ws.write_formula(R, 1, esp, f["eur2"], val)
    ws.write_formula(R, 2, obt, f["eur2"], val)
    ws.write_formula(R, 3, f"=C{E}-B{E}", f["eur2"], 0)
    ws.write_number(R, 4, tol)
    ws.write_formula(R, 5, f"=ABS(D{E})<=E{E}", None, True)
last = 3 + len(CTRL)
ws.write(last + 1, 0, "CONTROL MAESTRO (todos los controles en VERDADERO)", f["bold"])
ws.write_formula(last + 1, 5, f"=AND(F4:F{last})", None, True)
wb.define_name("Control_maestro", f"=Controles!$F${last + 2}")
ws.conditional_format(3, 5, last + 1, 5, {"type": "cell", "criteria": "==", "value": "TRUE", "format": f["ok"]})
ws.conditional_format(3, 5, last + 1, 5, {"type": "cell", "criteria": "==", "value": "FALSE", "format": f["mal"]})

# ---------- Consejo (una página A4 horizontal) ----------
ws = W["Consejo"]
ws.set_column("A:A", 27)
ws.set_column("B:B", 13)
ws.set_column("C:F", 13)
ws.set_column("G:G", 5)
ws.set_column("H:H", 19)
ws.write_formula(0, 0, '="Control presupuestario · enero-"&INDEX(Meses[Nombre],Mes_corte)&" 2026 · Consejo del 20/11/2026"', f["tit"],
                 "Control presupuestario · enero-octubre 2026 · Consejo del 20/11/2026")
ws.write_formula(1, 0, '="Controles: "&IF(Control_maestro,"TODO OK","REVISAR")', None, "Controles: TODO OK")
ws.conditional_format(1, 0, 1, 0, {"type": "text", "criteria": "containing", "value": "TODO OK", "format": f["ok"]})
ws.conditional_format(1, 0, 1, 0, {"type": "text", "criteria": "containing", "value": "REVISAR", "format": f["mal"]})
ws.write(1, 2, "Desviación = real − presupuesto · D = desfavorable · F = favorable", f["nota"])
ws.write_row(3, 0, ["Indicador", "Real ene-oct", "Presupuesto", "Desviación", "Previsión 2026", "Ppto 2026"], f["cab"])
KP = [("Ventas netas", 5, f["eur"], f["spct"], "=Resumen!F5", RS["Real"]["ventas"], RS["Ppto"]["ventas"],
       (RS["Real"]["ventas"] - RS["Ppto"]["ventas"]) / RS["Ppto"]["ventas"]),
      ("Margen bruto %", 8, f["pct"], f["spct"], "=Resumen!E8", RS["Real"]["margen_pct"], RS["Ppto"]["margen_pct"],
       RS["Real"]["margen_pct"] - RS["Ppto"]["margen_pct"]),
      ("EBITDA", 11, f["eur"], f["sig"], "=Resumen!E11", RS["Real"]["ebitda"], RS["Ppto"]["ebitda"],
       RS["Real"]["ebitda"] - RS["Ppto"]["ebitda"])]
for i, (lab, rr, fm, fd, fdesv, vr, vp, vd) in enumerate(KP):
    R = 4 + i
    ws.write(R, 0, lab, f["bold"])
    ws.write_formula(R, 1, f"=Resumen!C{rr}", fm, vr)
    ws.write_formula(R, 2, f"=Resumen!D{rr}", fm, vp)
    ws.write_formula(R, 3, fdesv, fd, vd)
    ws.write_formula(R, 4, f"=Resumen!H{rr}", fm, RS["Prevision"][key[FIL[rr - 5][0]]])
    ws.write_formula(R, 5, f"=Resumen!G{rr}", fm, RS["PptoAnual"][key[FIL[rr - 5][0]]])
ws.write(8, 0, "Lo que importa: |desviación| ≥ 5 % y ≥ 3.000 € (acumulado ene-oct, ordenado por importe)", f["h2"])
ws.write_row(9, 0, ["Partida", "Departamento", "Real", "Presupuesto", "Desv. €", "Desv. %", "F/D", "Naturaleza"], f["cab"])
for R in range(10, 20):
    for c, fm in [(2, f["eur"]), (3, f["eur"]), (4, f["sig"]), (5, f["spct"])]:
        ws.write_blank(R, c, None, fm)
ws.write_dynamic_array_formula(10, 0, 10, 0,
                               '=_xlfn.SORTBY(_xlfn._xlws.FILTER(Detalle[[Partida]:[Naturaleza]],Detalle[Importa],"Nada que importe"),'
                               'ABS(_xlfn._xlws.FILTER(Detalle[Desv],Detalle[Importa],0)),-1)')
ws.conditional_format(10, 6, 19, 6, {"type": "cell", "criteria": "==", "value": '"D"', "format": f["dfmt"]})
ws.conditional_format(10, 6, 19, 6, {"type": "cell", "criteria": "==", "value": '"F"', "format": f["ffmt"]})
ws.write(20, 0, "Comentarios", f["h2"])
COM = [
    '="1. Ventas "&FIXED(Resumen!F5*100,1)&" % y margen del "&FIXED(Resumen!C8*100,1)&" % (ppto "&FIXED(Resumen!D8*100,1)&" %): el margen resta "&FIXED(-Cascada!B6,0)&" € al EBITDA; el volumen, "&FIXED(-Cascada!B5,0)&" €."',
    '="2. Desviaciones reales: personal de almacén "&FIXED(SUMIFS(Detalle[Desv],Detalle[Partida],"Sueldos y salarios",Detalle[Departamento],"ALM"),0)&" € (horas extra de la campaña), feria de octubre "&FIXED(SUMIFS(Detalle[Desv],Detalle[Partida],"Publicidad y ferias",Detalle[Departamento],"COM"),0)&" €, carretilla y luz."',
    '="3. Logroño: "&FIXED(SUMIFS(Detalle[Real],Detalle[Partida],"Apertura Logroño"),0)&" € fuera de presupuesto. Amortización y seguro son diferencias temporales: se igualan a fin de año."',
    '="4. Cierre previsto: EBITDA de "&FIXED(EBITDA_prev,0)&" € frente a "&FIXED(EBITDA_ppto_anual,0)&" €; con ventas −8 % en nov-dic, "&FIXED(Escenarios!D18,0)&" €. Llegar al presupuesto exige vender "&FIXED(Escenarios!B29,0)&" € en nov-dic."',
]
def miles(x):
    return f"{x:,.0f}".replace(",", ".")


def dec1(x):
    return f"{x:.1f}".replace(".", ",")


s_alm = DT[(DT.Partida == "Sueldos y salarios") & (DT.Departamento == "ALM")].Desv.iloc[0]
s_pub = DT[(DT.Partida == "Publicidad y ferias") & (DT.Departamento == "COM")].Desv.iloc[0]
COM_V = [f"1. Ventas {dec1((Rr['ventas'] - P['ventas']) / P['ventas'] * 100)} % y margen del {dec1(Rr['margen_pct'] * 100)} % "
         f"(ppto {dec1(P['margen_pct'] * 100)} %): el margen resta {miles(-CASC[2][1])} € al EBITDA; el volumen, {miles(-CASC[1][1])} €.",
         f"2. Desviaciones reales: personal de almacén {miles(s_alm)} € (horas extra de la campaña), feria de octubre "
         f"{miles(s_pub)} €, carretilla y luz.",
         f"3. Logroño: {miles(-CASC[5][1])} € fuera de presupuesto. Amortización y seguro son diferencias temporales: se igualan a fin de año.",
         f"4. Cierre previsto: EBITDA de {miles(ebitda_base)} € frente a 444.000 €; con ventas −8 % en nov-dic, "
         f"{miles(esc[(-0.08, 1)][0])} €. Llegar al presupuesto exige vender {miles(ventas_obj)} € en nov-dic."]
for i, (fo, v) in enumerate(zip(COM, COM_V)):
    ws.write_formula(21 + i, 0, fo, None, v)
ws.write(26, 0, "Índice", f["h2"])
for i, (dest, txt) in enumerate([("Resumen", "Cuenta de resultados por bloques"), ("Detalle", "Detalle por partida y departamento"),
                                 ("Detalle_cuenta", "Detalle por cuenta"), ("Escenarios", "Escenarios y Buscar objetivo"),
                                 ("Controles", "Controles")]):
    ws.write_formula(27 + i, 0, f'=HYPERLINK("#{dest}!A1","{txt}")', None, txt)
ch2 = wb.add_chart({"type": "column", "subtype": "stacked"})
for nombre, col, color in [("Base", "E", None), ("Sube", "F", "#2E7D32"), ("Baja", "G", "#C62828"), ("Total", "H", "#1F4E79")]:
    s = {"name": nombre, "categories": "=Cascada!$A$4:$A$11", "values": f"=Cascada!${col}$4:${col}$11", "gap": 50}
    s.update({"fill": {"none": True}, "border": {"none": True}} if color is None else {"fill": {"color": color}})
    ch2.add_series(s)
ch2.set_title({"name": "EBITDA ene-oct: del presupuesto al real", "name_font": {"size": 10}})
ch2.set_legend({"none": True})
ch2.set_x_axis({"num_font": {"size": 8}})
ch2.set_y_axis({"num_format": '#,##0 "€"', "num_font": {"size": 8}})
ch2.set_size({"width": 470, "height": 300})
ALT2 = ("Cascada del EBITDA de enero a octubre: parte del presupuestado y suma o resta el efecto de ventas, "
                    "margen, personal, otros gastos, Logroño y temporales hasta el real.")
ws.insert_chart("J1", ch2, {"description": ALT2})
ws.set_landscape()
ws.set_paper(9)
ws.set_margins(0.4, 0.4, 0.5, 0.5)
ws.print_area("A1:Q32")
ws.fit_to_pages(1, 1)

# ---------- Auditoría del libro de Paco ----------
ws = W["Auditoría_Paco"]
ws.set_column("A:A", 5)
ws.set_column("B:B", 18)
ws.set_column("C:C", 46)
ws.set_column("D:D", 52)
ws.set_column("E:E", 16)
ws.set_column("F:F", 40)
ws.write(0, 0, "Auditoría de p7-control-2025-paco.xlsx · decisión: reconstruir (no reutilizar)", f["h2"])
ws.write_row(2, 0, ["N.º", "Dónde", "Qué pasa", "Cómo se encuentra", "Efecto en el resultado 2025 (€)", "Arreglo"], f["cab"])
ef = paco["efectos"]
pres, okk = paco["presentado"], paco["correcto"]
AUD = [
    ("E1", "Real_2025!H17", "El total anual de Transportes es =SUMA(H5:H15): deja fuera diciembre.",
     "Comprobación de errores (triángulo verde: la fórmula omite celdas adyacentes); Rastrear precedentes.", ef["E1"],
     "=SUMA(H5:H16)"),
    ("E2", "Real_2025!D7", "Personal de marzo es un valor fijo (142.000) escrito encima de la fórmula.",
     "Inicio > Buscar y seleccionar > Ir a Especial > Constantes; Fórmulas > Mostrar fórmulas.", ef["E2"],
     "Volver a poner la fórmula de la fila"),
    ("E3", "Informe!E6:E21", "El % de desviación es =D6/C$5: todas las filas dividen por el presupuesto de ventas.",
     "Mostrar fórmulas: la fila del divisor no avanza; Evaluar fórmula.", 0, "=D6/C6 (sin $) y copiar"),
    ("E4", "Informe!B20:C20", "El total de gastos suma también el subtotal «Total servicios exteriores» (doble cómputo).",
     "Rastrear precedentes; Ventana Inspección sobre los totales.", 0,
     f"=SUMA(B6:B7;B17:B19). El total de gastos presentado iba {miles(pres['Total servicios exteriores'])} € de más"),
    ("E5", "Informe!D5", "La desviación de ventas es Ppto − Real (=C5-B5), al revés que el resto.",
     "Fórmula distinta en la misma columna (Comprobación de errores: fórmula incoherente).", 0, "=B5-C5"),
    ("E6", "Informe!B18", "Amortización =SI.ERROR(Real_2025!#¡REF!;0): se borró la columna y sale 0.",
     "Evaluar fórmula; buscar SI.ERROR con Ctrl+B en las fórmulas.", ef["E6"],
     "Sumar la 681 desde Datos_2025 con SUMAR.SI.CONJUNTO"),
    ("E7", "Informe!C5:C19", "El presupuesto 2025 está vinculado a presupuesto_2025.xlsx, que ya no existe.",
     "Datos > Consultas y conexiones > Vínculos de libro (estado: no se encuentra el origen).", 0,
     "Copiar el presupuesto al libro (hoja de entradas) y romper el vínculo"),
    ("E8", "Todo el libro", "Cálculo manual: la regularización de existencias de diciembre (+21.600 en la 600) no entró en las cifras.",
     "Fórmulas > Cálculo > Opciones para el cálculo (estaba en Manual); al pulsar F9 cambian las cifras.", ef["E8"],
     "Opciones para el cálculo: Automático"),
]
for i, a in enumerate(AUD):
    R = 3 + i
    ws.write_row(R, 0, list(a[:4]), f["txt"])
    ws.write_number(R, 4, a[4], f["eur2"])
    ws.write(R, 5, a[5], f["txt"])
ws.write(12, 2, "Resultado 2025 que se presentó al consejo", f["bold"])
ws.write_number(12, 4, pres["Resultado"], f["eur2"])
ws.write(13, 2, "Errores que inflaban el resultado (E1 + E2 + E6 + E8)")
ws.write_formula(13, 4, "=SUM(E4:E11)", f["eur2"], sum(ef.values()))
ws.write(14, 2, "Resultado 2025 correcto", f["bold"])
ws.write_formula(14, 4, "=E13-E14", f["eurb"], okk["Resultado"])
ws.write(15, 2, "Comprobación: resultado correcto recalculado desde Datos_2025")
ws.write_number(15, 4, okk["Resultado"], f["eur2"])
ws.write_formula(15, 5, "=ROUND(E15-E16,2)=0", None, True)
ws.write(17, 0, f"Conclusión: el resultado de 2025 que se presentó ({miles(pres['Resultado'])} €) NO era correcto: el bueno es "
                f"{miles(okk['Resultado'])} € ({miles(pres['Resultado'] - okk['Resultado'])} € menos). E3 y E5 cambian % y signos; "
                "E4 inflaba el total de gastos; E7 impide actualizar el presupuesto. Se reconstruye con hechos largos y controles.",
         f["txt"])
ws.set_row(17, 48)

# ---------- Calidad de datos ----------
ws = W["Calidad_datos"]
ws.set_column("A:A", 30)
ws.set_column("B:B", 12)
ws.set_column("C:C", 70)
ws.set_column("D:D", 70)
ws.write(0, 0, "Calidad de datos: problema, filas afectadas y decisión", f["h2"])
ws.write_row(2, 0, ["Archivo", "Código", "Problema (con recuento)", "Decisión"], f["cab"])
for i, row in enumerate(calidad):
    ws.write_row(3 + i, 0, list(row), f["txt"])

# ---------- Cambio inesperado (18/11) ----------
ws = W["Cambio_18nov"]
ws.set_column("A:A", 62)
ws.set_column("B:C", 16)
c18 = extra["cambio_18nov"]
ws.write(0, 0, "Cambio inesperado del 18/11: factura de transporte de octubre de 9.800 € que faltaba", f["h2"])
ws.write_row(2, 0, ["Cifra", "Antes (16/11)", "Después (18/11)"], f["cab"])
for i, (lab, a, b2, fm) in enumerate([
        ("Filas del diario", len(DI), c18["lineas"], f["int"]),
        ("Transportes ALM: real acumulado", t16.Real, t18.Real, f["eur"]),
        ("Transportes ALM: presupuesto acumulado", t16.Ppto, t18.Ppto, f["eur"]),
        ("Transportes ALM: desviación", t16.Desv, t18.Desv, f["sig"]),
        ("Transportes ALM: desviación %", t16.DesvPct, t18.DesvPct, f["spct"]),
        ("Partidas × departamento que importan", int(DT.Importa.sum()), c18["importan"], f["int"]),
        ("EBITDA real acumulado", Rr["ebitda"], c18["ebitda_real"], f["eur"]),
        ("EBITDA previsto 2026 (base)", ebitda_base, c18["ebitda_prev"], f["eur"])]):
    ws.write(3 + i, 0, lab)
    ws.write_number(3 + i, 1, a, fm)
    ws.write_number(3 + i, 2, b2, fm)
ws.write(12, 0, "Cómo se actualiza: se guarda el CSV nuevo con el mismo nombre en la misma carpeta (o se cambia la ruta en "
                "Parámetros de Power Query), Datos > Actualizar todo, se cambia Filas_csv a 7.604 y se revisa que el control "
                "maestro siga en verde. Transportes ALM entra en «lo que importa» (D) y hay que cambiar el comentario 2 del "
                "consejo y avisar a Marta de que la cifra de transportes del informe que vio el 16/11 ha cambiado.", f["txt"])
ws.set_row(12, 75)
ws.write(14, 0, "Comentario 2 nuevo: «Desviaciones reales: personal de almacén +21.200 € (horas extra de la campaña), "
                "transportes +6.300 € (+6,0 %, factura de octubre registrada el 17/11), feria de octubre +7.300 €, carretilla y luz.»",
         f["txt"])
ws.set_row(14, 45)

# ---------- Léame y Cómo se hizo ----------
ws = W["Léame"]
ws.set_column("A:A", 120, f["txt"])
LEAME = [
    ("tit", "P7 · Presupuesto frente a real y previsión de cierre 2026 (solución)"),
    ("txt", "Pedido por: Marta Ruiz, directora financiera (09/11/2026), para el consejo del 20/11/2026. Hecho por: administración. "
            "Fecha de corte: 31/10/2026 (Parámetros: Mes_corte = 10)."),
    ("h2", "Fuentes"),
    ("txt", "p7-datos.xlsx (presupuesto 2026 en 5 pestañas, Mapeo_cuentas y Reparto_por_cuenta) y p7-diario-2026-ene-oct.csv "
            "(diario de los grupos 6 y 7). En el libro real, las tablas PptoLargo y Diario las cargan dos consultas de Power "
            "Query (pasos en «Cómo_se_hizo»); aquí están cargadas como Tablas con las mismas columnas."),
    ("h2", "Hojas (de izquierda a derecha)"),
    ("txt", "Parámetros (entradas en amarillo, con nombre) · Consejo (la página para el consejo) · Resumen (bloques) · Detalle "
            "(partida × departamento) · Detalle_cuenta · Escenarios (previsión, escenarios y Buscar objetivo) · Cascada · "
            "Auditoría_Paco · Calidad_datos · Controles · Cambio_18nov · Cómo_se_hizo · PptoLargo y Diario (hechos largos) · "
            "Mapeo (con Excepciones) · Tablas_aux (Reparto, Temporales, ReglasPrev, Meses)."),
    ("h2", "Supuestos pactados con Marta"),
    ("txt", "Desviación = real − presupuesto, acumulada. Importa si |%| ≥ 5 y |€| ≥ 3.000 (las dos cosas; sin presupuesto, "
            "solo €). Seguro anual y amortización trimestral: «Temporal»; en la previsión, el importe del año (14.400 y 96.000). "
            "62900099 → partida «Apertura Logroño», fuera de presupuesto. Dirección en doceavas. Centro de coste vacío: "
            "Reparto_por_cuenta; si la cuenta no está, «Sin asignar». Previsión = real ene-oct + presupuesto nov-dic; ventas y "
            "coste nov-dic con el escenario (margen constante); financieros nov-dic = PAGOINT de las cuotas 20 y 21 + póliza; "
            "Logroño 6.500 €/mes si abre."),
    ("h2", "Cómo actualizar (cada mes)"),
    ("txt", "1. Guarda el CSV nuevo del diario con el mismo nombre en la misma carpeta. 2. Cambia Mes_corte y Filas_csv en "
            "Parámetros. 3. Datos > Actualizar todo. 4. Mira Controles: si una cuenta nueva sale «SIN PARTIDA», añádela a Mapeo o "
            "a Excepciones. 5. Revisa los comentarios del consejo (son fórmulas, pero el porqué lo escribes tú). 6. Guarda como _v0X."),
    ("h2", "Colores"),
    ("txt", "Amarillo = celda de entrada. Verde/rojo en F/D = favorable/desfavorable (además de la letra F o D, para que no "
            "dependa solo del color). Rojo en «Importa» = desviación que va al consejo."),
    ("h2", "Registro de cambios"),
    ("txt", "16/11/2026 · v01 · primera versión con datos de enero a octubre. · 18/11/2026 · v02 · CSV reexportado con la factura de "
            "transporte de octubre (9.800 €): Transportes ALM pasa a «importa» y cambia el comentario 2 (ver Cambio_18nov)."),
    ("txt", "Contacto: administración (extensión 214)."),
]
for i, (est, t) in enumerate(LEAME):
    ws.write(i, 0, t, f[est])

ws = W["Cómo_se_hizo"]
ws.set_column("A:A", 125, f["txt"])
COMO = [
    ("tit", "Cómo se hizo (lo que la librería no puede crear: Power Query, escenarios, Buscar objetivo, cascada nativa, LAMBDA)"),
    ("h2", "1. Presupuesto en formato largo (Power Query)"),
    ("txt", "Datos > Obtener datos > De archivo > De libro > p7-datos.xlsx. Para cada pestaña (mejor con una función fxPestaña(nombre, "
            "departamento) y después Anexar consultas): 1) Quitar filas superiores hasta la fila «Cuenta» (no un número fijo: cada "
            "pestaña tiene 2, 3 o 4 filas de título). 2) Usar la primera fila como encabezado. 3) Filtrar las filas cuya Cuenta no "
            "es número (subtotales «Total servicios exteriores», «TOTAL …» y vacías). 4) Quitar la columna Total (si no, el "
            "presupuesto sale el doble). 5) Seleccionar Cuenta y Descripción > Anular dinamización de otras columnas (Atributo, "
            "Valor). 6) Mes: fecha, texto «Enero» o número 1-12 → número con la tabla Meses. 7) Importe: en Administración es "
            "texto «16.500,00»: Cambiar tipo > Usar configuración regional > Decimal, Español (España). 8) Dirección: una "
            "columna con la lista {1..12}, expandirla e Importe = total / 12. 9) Columna Departamento y Anexar todo en PptoLargo."),
    ("txt", "M de una pestaña: let Origen = Excel.Workbook(File.Contents(Ruta), null, true), Hoja = Origen{[Item=\"Comercial\",Kind=\"Sheet\"]}[Data], "
            "Desde = Table.Skip(Hoja, each [Column1] <> \"Cuenta\"), Enc = Table.PromoteHeaders(Desde, [PromoteAllScalars=true]), "
            "Cuentas = Table.SelectRows(Enc, each [Cuenta] is number), SinTotal = Table.RemoveColumns(Cuentas, {\"Total\"}), "
            "Largo = Table.UnpivotOtherColumns(SinTotal, {\"Cuenta\", \"Descripción\"}, \"Atributo\", \"Valor\") in Largo."),
    ("txt", "Alternativa sin Power Query: Datos > Herramientas de datos > Consolidar. Aquí no basta: las pestañas no tienen la misma "
            "forma (meses como fecha, texto o número; Dirección solo con el total; filas de título distintas) y Consolidar no "
            "deja un formato largo que se pueda filtrar por departamento y mes."),
    ("h2", "2. Diario (Power Query y columnas calculadas)"),
    ("txt", "Datos > Obtener datos > De archivo > De texto/CSV: Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma; "
            "Transformar datos; Cuenta y Asiento como Texto; Fecha, Debe y Haber con configuración regional Español (España). Cargar "
            "en la Tabla Diario. Columnas: Cuenta3 =VALOR(IZQUIERDA([@Cuenta];3)) (VALOR porque Mapeo[Cuenta3] es número: sin él, "
            "#N/D); Mes =MES([@Fecha]); Dpto =SI([@CentroCoste]<>\"\";[@CentroCoste];BUSCARX([@Cuenta3];Reparto[Cuenta3];"
            "Reparto[CentroCoste];\"Sin asignar\")); Partida =SI.ND(BUSCARX([@Cuenta];Excepciones[Cuenta];Excepciones[Partida]);"
            "BUSCARX([@Cuenta3];Mapeo[Cuenta3];Mapeo[Partida];\"SIN PARTIDA\")); Importe =SI([@Tipo]=\"Gasto\";[@Debe]-[@Haber];"
            "[@Haber]-[@Debe])."),
    ("h2", "3. Informe (Detalle)"),
    ("txt", "Real =SUMAR.SI.CONJUNTO(Diario[Importe];Diario[Partida];[@Partida];Diario[Dpto];[@Departamento];Diario[Mes];\"<=\"&Mes_corte). "
            "F/D =SI([@Tipo]=\"Gasto\";SI([@Desv]>0;\"D\";\"F\");SI([@Desv]<0;\"D\";\"F\")) (con «=» si la desviación es 0). Importa "
            "=Y(ABS([@DesvPct])>=Umbral_pct;ABS([@Desv])>=Umbral_eur). Formato personalizado +#.##0 €;-#.##0 €;0 € y color por F/D con "
            "formato condicional (no por el signo). En el Consejo: =ORDENARPOR(FILTRAR(Detalle[[Partida]:[Naturaleza]];Detalle[Importa]);"
            "ABS(FILTRAR(Detalle[Desv];Detalle[Importa]));-1)."),
    ("txt", "N5 (opcional, Excel 2024 o 365): Fórmulas > Administrador de nombres > Nuevo: DESV.FAV =LAMBDA(real;ppto;tipo;"
            "SI(tipo=\"Gasto\";ppto-real;real-ppto)). Así =DESV.FAV([@Real];[@Ppto];[@Tipo]) da la desviación en positivo cuando es "
            "favorable, sea ingreso o gasto."),
    ("h2", "4. Administrador de escenarios"),
    ("txt", "Datos > Previsión > Análisis de hipótesis > Administrador de escenarios > Agregar: «Pesimista» (celdas cambiantes "
            "Parámetros!C7 y C8, es decir Var_ventas y Logrono_activo; valores −0,08 y 1), «Base» (0 y 1), «Optimista» (0,04 y 1) y los "
            "tres sin Logroño (… y 0). Resumen > Resumen de escenario con celdas de resultado Resumen!H11 (EBITDA) y Resumen!H14 "
            "(resultado). La tabla de la hoja Escenarios da las mismas cifras con fórmulas."),
    ("h2", "5. Buscar objetivo"),
    ("txt", "Con Logrono_activo = 1: Datos > Previsión > Análisis de hipótesis > Buscar objetivo. Definir la celda: Resumen!H11; Con "
            "el valor: 444000; Cambiando la celda: Parámetros!C7 (Var_ventas). Después, ventas nov-dic necesarias = ventas nov-dic "
            "presupuestadas × (1 + Var_ventas). Vuelve a poner Var_ventas a 0 al terminar."),
    ("h2", "6. Gráfico de cascada nativo"),
    ("txt", "Selecciona Cascada!A3:B11 > Insertar > Gráficos > Insertar gráfico de cascada, embudo, cotizaciones, superficie o radial "
            "> Cascada. Haz clic dos veces (despacio) en la primera columna > botón derecho > Establecer como total; lo mismo en la "
            "última. Sin eso, el EBITDA real aparece como una barra que sube encima de todo. Texto alternativo: botón derecho > Ver "
            "texto alternativo. (En este archivo la cascada está simulada con columnas apiladas: Base sin relleno, Sube, Baja y Total.)"),
    ("h2", "7. Auditoría del libro de Paco"),
    ("txt", "Fórmulas > Auditoría de fórmulas: Rastrear precedentes y dependientes, Mostrar fórmulas, Comprobación de errores, Evaluar "
            "fórmula y Ventana Inspección (sobre Informe!B20 y B21). Inicio > Buscar y seleccionar > Ir a Especial > Constantes (o F5 > "
            "Especial) para ver números escritos a mano dentro de zonas de fórmulas. Fórmulas > Cálculo > Opciones para el cálculo. "
            "Datos > Consultas y conexiones > Vínculos de libro."),
    ("h2", "8. Página para el consejo"),
    ("txt", "Disposición de página (o Diseño de página) > Orientación: Horizontal; Tamaño: A4; Ajustar área de impresión: 1 página de "
            "ancho por 1 de alto. Archivo > Exportar > Crear PDF/XPS."),
]
for i, (est, t) in enumerate(COMO):
    ws.write(i, 0, t, f[est])
    if est == "txt":
        ws.set_row(i, 15 * (len(t) // 140 + 1))

W["Léame"].activate()
wb.close()

# =====================================================================================
# 4. RESUMEN EN PANTALLA
# =====================================================================================
for a, b, c in CONTROLES:
    print(f"{b:>16,.2f}  ±{c}  {a}")
print("Importan:")
print(importan[["Partida", "Departamento", "Real", "Ppto", "Desv", "DesvPct", "FD", "Naturaleza"]].round(3).to_string())
print("Resumen real/ppto/prev:", {k: round(RS[k]["ebitda"], 2) for k in RS})
print("Margen % real/ppto:", round(Rr["margen_pct"] * 100, 2), round(P["margen_pct"] * 100, 2))
print("Escenarios:", extra["escenarios"])
print("Buscar objetivo:", extra["buscar_objetivo"])
print("Cascada:", extra["cascada"])
print("Cambio 18/11:", extra["cambio_18nov"])
print("Paco:", paco["presentado"]["Resultado"], paco["correcto"]["Resultado"], paco["efectos"])

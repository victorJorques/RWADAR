# -*- coding: utf-8 -*-
"""
P8 · Cuadro de mando de dirección · SOLUCIÓN (plan B, sin Power Pivot)
======================================================================

Genera libros/p8-solucion.xlsx: el libro de la alumna tal como queda DESPUÉS de cargar noviembre
(los archivos de Llega_en_diciembre), con el selector en noviembre de 2026 y «Todas».

- Las hojas de datos son el resultado de las consultas de Power Query (la librería no puede crear
  consultas ni el modelo de datos): Hechos (tabla única), Coste_diario, Calendario y Alias.
  La hoja «Cómo se hizo» explica las consultas, el modelo en estrella y las medidas DAX (plan A).
- Cuadro, Calc, Controles y Casos_prueba llevan FÓRMULAS reales de Excel (SUMAR.SI.CONJUNTO,
  CONTAR.SI.CONJUNTO, FIN.MES, SI.CONJUNTO, INDICE + COINCIDIR + K.ESIMO.MAYOR), gráficos nativos,
  minigráficos, formato condicional, validación de datos y protección de la hoja del cuadro.
- Comprobación: el libro se recalcula con LibreOffice y se comparan las tarjetas y los casos de
  prueba con pandas (p8_datos.kpis). Después se vuelve a escribir con esos resultados en caché.
"""
import datetime as dt
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
import openpyxl
import pandas as pd
import xlsxwriter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p8_datos as P  # noqa: E402

SALIDA = os.path.join(P.LIBROS, "p8-solucion.xlsx")
MES_SEL = dt.datetime(2026, 11, 30)
MESES = P.MESES
MESES_ABR = P.MESES_ABR
DELEGS = ["Zaragoza", "Pamplona", "Lleida", "Logroño"]


def preparar():
    D = P.cargar_limpio(P.DICIEMBRE)
    v, pp, s, st, pl, g = D["ventas"], D["ppto"], D["saldos"], D["stock"], D["plantilla"], D["pyg"]
    filas = []
    for (fm, d, f), x in v.groupby(["FinMes", "Delegacion", "Familia"]).ImporteNeto.sum().items():
        filas.append((fm, "Ventas", "Ventas", d, f, "", 0, round(x, 2)))
    for (fm, d, f), x in v.groupby(["FinMes", "Delegacion", "Familia"]).Coste.sum().items():
        filas.append((fm, "Ventas", "Coste", d, f, "", 0, round(x, 2)))
    for r in pp.itertuples():
        filas.append((r.FinMes, "Presupuesto", "Ppto", r.Delegacion, r.Familia, "", 0, float(r.Importe)))
    for (fm, d), grp in s.groupby(["FinMes", "Delegacion"]):
        filas.append((fm, "Saldos", "Pendiente", d, "", "", 0, round(grp.Pendiente.sum(), 2)))
        filas.append((fm, "Saldos", "Vencido60", d, "", "", 0, round(grp.VencidoMas60.sum(), 2)))
    for (fm, c), x in st.groupby(["FinMes", "ClaseABC"]).Valor.sum().items():
        filas.append((fm, "Stock", "Stock", "Central", c, "", 0, round(x, 2)))
    for r in pl.itertuples():
        for ind in ["Activos", "FTE", "DiasIT", "DiasTeoricos"]:
            filas.append((r.FinMes, "Plantilla", ind, r.Delegacion, r.Departamento, "", 0, float(getattr(r, ind))))
    for r in g.itertuples():
        if not np.isnan(r.Real):
            filas.append((r.FinMes, "PyG", "PyG real", "Empresa", r.Partida, r.Grupo, int(r.EnEBITDA), round(r.Real * r.Signo, 2)))
        filas.append((r.FinMes, "PyG", "PyG ppto", "Empresa", r.Partida, r.Grupo, int(r.EnEBITDA), round(r.Ppto * r.Signo, 2)))
    H = pd.DataFrame(filas, columns=["FinMes", "Fuente", "Indicador", "Delegacion", "Detalle", "Grupo", "EnEBITDA", "Valor"])
    H = H.sort_values(["Fuente", "Indicador", "FinMes", "Delegacion", "Detalle"]).reset_index(drop=True)
    CD = v.groupby("Fecha").Coste.sum().round(2).reset_index()
    return D, H, CD


class Libro:
    """Envoltorio de xlsxwriter: guarda cada fórmula y le pone el valor en caché si lo tenemos."""

    def __init__(self, ruta, cache=None, estructurada=True, n_h=0, n_cd=0):
        self.wb = xlsxwriter.Workbook(ruta, {"use_future_functions": True})
        self.cache = cache or {}
        self.est = estructurada
        self.n_h, self.n_cd = n_h, n_cd
        self.formulas = []

    def col(self, tabla, columna):
        if self.est:
            return f"{tabla}[{columna}]"
        letras = {"Hechos": dict(zip(["FinMes", "Fuente", "Indicador", "Delegacion", "Detalle", "Grupo", "EnEBITDA", "Valor"], "ABCDEFGH")),
                  "Coste_diario": {"Fecha": "A", "Coste": "B"}}
        n = self.n_h if tabla == "Hechos" else self.n_cd
        L = letras[tabla][columna]
        return f"{tabla}!${L}$2:${L}${n + 1}"

    def f(self, ws, celda, formula, fmt=None):
        self.formulas.append((ws.name, celda))
        val = self.cache.get((ws.name, celda))
        if val is None:
            ws.write_formula(celda, formula, fmt)
        else:
            ws.write_formula(celda, formula, fmt, val)


def construir(ruta, D, H, CD, cache=None, estructurada=True):
    L = Libro(ruta, cache, estructurada, len(H), len(CD))
    wb = L.wb
    h = lambda c: L.col("Hechos", c)
    cdf = lambda c: L.col("Coste_diario", c)

    def S(ind, fm="Mes", deleg=True, extra=""):
        x = f'SUMIFS({h("Valor")},{h("Indicador")},"{ind}",{h("FinMes")},{fm}'
        return x + (f',{h("Delegacion")},DelegCrit' if deleg else "") + extra + ")"

    def SR(ind, desde, hasta, deleg=True, extra="", op_desde=">="):
        x = f'SUMIFS({h("Valor")},{h("Indicador")},"{ind}",{h("FinMes")},"{op_desde}"&{desde},{h("FinMes")},"<="&{hasta}'
        return x + (f',{h("Delegacion")},DelegCrit' if deleg else "") + extra + ")"

    def CNT(ind, fm="Mes"):
        return f'COUNTIFS({h("Indicador")},"{ind}",{h("FinMes")},{fm})'

    # ------------------------------------------------------------------ formatos
    def fm(**k):
        base = {"font_name": "Calibri", "font_size": 10, "valign": "vcenter"}
        base.update(k)
        return wb.add_format(base)

    AZUL, GRIS = "#1F3864", "#F2F2F2"
    F = {
        "tit": fm(bold=True, font_size=18, font_color=AZUL),
        "sub": fm(italic=True, font_color="#404040"),
        "h": fm(bold=True, font_color="#FFFFFF", bg_color=AZUL, text_wrap=True, border=1),
        "cab": fm(bold=True, bg_color="#D9E1F2", border=1, text_wrap=True),
        "txt": fm(text_wrap=True, valign="top"),
        "cel": fm(border=1, text_wrap=True),
        "kpi": fm(bold=True, border=1, text_wrap=True, bg_color=GRIS),
        "eur": fm(num_format='#,##0.00 "€"', border=1, align="right"),
        "eur0": fm(num_format='#,##0 "€"', border=1, align="right"),
        "eur0b": fm(num_format='#,##0 "€"', border=1, align="right", bold=True, font_size=12),
        "pct": fm(num_format="0.0%", border=1, align="right"),
        "pctb": fm(num_format="0.0%", border=1, align="right", bold=True, font_size=12),
        "pctv": fm(num_format='"▲ "+0.0%;"▼ "-0.0%;"= "0.0%', border=1, align="right"),
        "pp": fm(num_format='"▲ "+0.0" p. p.";"▼ "-0.0" p. p.";"= "0.0" p. p."', border=1, align="right"),
        "dd": fm(num_format='"▲ "+0.0" días";"▼ "-0.0" días";"= "0.0" días"', border=1, align="right"),
        "dias": fm(num_format='0.0 "días"', border=1, align="right"),
        "diasb": fm(num_format='0.0 "días"', border=1, align="right", bold=True, font_size=12),
        "dec": fm(num_format="#,##0.00", border=1, align="right"),
        "num": fm(num_format="#,##0.00", align="right"),
        "ent": fm(num_format="#,##0", border=1, align="right"),
        "fecha": fm(num_format="dd/mm/yyyy", border=1),
        "fechasel": fm(num_format="mmmm yyyy", bold=True, bg_color="#FFF2CC", border=2, locked=False, font_size=12),
        "sel": fm(bold=True, bg_color="#FFF2CC", border=2, locked=False, font_size=12),
        "entrada": fm(bg_color="#FFF2CC", border=1, locked=False),
        "entpct": fm(bg_color="#FFF2CC", border=1, num_format="0.0%", locked=False),
        "calc": fm(bg_color="#EDEDED", border=1),
        "calcf": fm(bg_color="#EDEDED", border=1, num_format="dd/mm/yyyy"),
        "estado": fm(bold=True, border=1, align="center"),
        "nota": fm(italic=True, font_color="#595959", text_wrap=True, font_size=9),
        "caja": fm(text_wrap=True, valign="top", border=1, bg_color="#FFFFFF"),
        "cajah": fm(bold=True, font_color="#FFFFFF", bg_color="#C55A11", border=1),
        "ok": fm(bold=True, font_color="#006100", bg_color="#C6EFCE"),
        "mal": fm(bold=True, font_color="#9C0006", bg_color="#FFC7CE"),
        "ambar": fm(bold=True, font_color="#7F6000", bg_color="#FFEB9C"),
        "grisc": fm(bold=True, font_color="#404040", bg_color="#E7E6E6"),
        "codigo": fm(font_name="Consolas", font_size=9, text_wrap=True, valign="top", bg_color="#F7F7F7"),
    }

    def textos(ws, filas, ancho=110, col0=0):
        ws.set_column(col0, col0, ancho)
        r = 0
        for tipo, txt in filas:
            fmt = {"t": F["tit"], "s": F["sub"], "h": F["h"], "c": F["codigo"]}.get(tipo, F["txt"])
            ws.write(r, col0, txt, fmt)
            r += 1
        return r

    # ------------------------------------------------------------------ hojas (orden de pestañas)
    names = ["Léame", "Cuadro", "Diccionario", "Parámetros", "Controles", "Casos_prueba", "Calidad_datos",
             "Calc", "Hechos", "Coste_diario", "Calendario", "Alias", "Cifras_cuadre", "Cómo se hizo", "Manual"]
    W = {n: wb.add_worksheet(n) for n in names}

    # ------------------------------------------------------------------ Parámetros
    ws = W["Parámetros"]
    ws.set_column("A:A", 2); ws.set_column("B:B", 46); ws.set_column("C:C", 16); ws.set_column("D:D", 4)
    ws.set_column("E:G", 14); ws.set_column("H:H", 60)
    ws.write("B1", "Parámetros del cuadro", F["tit"])
    ws.write("B2", "Amarillo = dato de entrada que se puede cambiar. Gris = calculado (no tocar).", F["sub"])
    ws.write_row("B3", ["Parámetro", "Valor"], F["cab"]); ws.write("H3", "Quién lo fija / nota", F["cab"])
    params = [("IVA", "Tipo de IVA general (para el PMC)", 0.21, "entpct", "Marta · todo el catálogo va al 21 %"),
              ("MetaMargen", "Meta de margen bruto %", 0.28, "entpct", "Javier"),
              ("MetaVencida", "Meta de cartera vencida > 60 días (máximo)", 0.10, "entpct", "Marta"),
              ("MetaPMC", "Meta de PMC (días, máximo)", 70, "entrada", "Marta"),
              ("MetaCobertura", "Meta de cobertura de stock (días, máximo)", 60, "entrada", "Andrés"),
              ("MetaAbsentismo", "Meta de absentismo (máximo)", 0.04, "entpct", "Lucía"),
              ("UmbralAmbar", "Umbral ámbar del semáforo (cumplimiento)", 0.95, "entpct", "Carmen · verde ≥ 100 %, ámbar 95-100 %, rojo < 95 %"),
              ("DiasCobertura", "Días de coste de ventas para la cobertura", 90, "entrada", "Andrés · últimos 90 días")]
    r = 3
    for nombre, txt, val, fmt, nota in params:
        ws.write(r, 1, txt, F["cel"]); ws.write(r, 2, val, F[fmt]); ws.write(r, 7, nota, F["nota"])
        wb.define_name(nombre, f"='Parámetros'!$C${r + 1}")
        r += 1
    r += 1
    ws.write(r, 1, "Calculados a partir del selector del Cuadro", F["cab"]); ws.write(r, 2, "", F["cab"]); r += 1
    derivados = [("IniAnio", "Primer día del año del mes elegido", "DATE(YEAR(Mes),1,1)", F["calcf"]),
                 ("MesAA", "Mismo mes del año anterior (fin de mes)", "EOMONTH(Mes,-12)", F["calcf"]),
                 ("Ini3", "Fin del mes de hace 3 meses (para PMC)", "EOMONTH(Mes,-3)", F["calcf"]),
                 ("DelegCrit", "Criterio de delegación («*» = todas)", 'IF(Deleg="Todas","*",Deleg)', F["calc"])]
    for nombre, txt, fo, fmt in derivados:
        ws.write(r, 1, txt, F["cel"]); L.f(ws, f"C{r + 1}", fo, fmt)
        wb.define_name(nombre, f"='Parámetros'!$C${r + 1}")
        r += 1
    ws.write("E3", "NombresMes", F["cab"]); ws.write("F3", "MesesAbr", F["cab"]); ws.write("G3", "ListaDeleg", F["cab"])
    for i in range(12):
        ws.write(3 + i, 4, MESES[i], F["cel"]); ws.write(3 + i, 5, MESES_ABR[i], F["cel"])
    for i, d in enumerate(["Todas"] + DELEGS):
        ws.write(3 + i, 6, d, F["cel"])
    wb.define_name("NombresMes", "='Parámetros'!$E$4:$E$15")
    wb.define_name("MesesAbr", "='Parámetros'!$F$4:$F$15")
    wb.define_name("ListaDeleg", "='Parámetros'!$G$4:$G$8")

    # ------------------------------------------------------------------ datos (resultado de Power Query)
    ws = W["Hechos"]
    cols = [{"header": c} for c in H.columns]
    cols[0]["format"] = F["fecha"]; cols[7]["format"] = F["num"]
    datos = [[r.FinMes.to_pydatetime(), r.Fuente, r.Indicador, r.Delegacion, r.Detalle, r.Grupo, int(r.EnEBITDA), float(r.Valor)]
             for r in H.itertuples()]
    ws.add_table(0, 0, len(H), 7, {"name": "Hechos", "columns": cols, "data": datos, "style": "Table Style Light 9"})
    ws.set_column("A:A", 12); ws.set_column("B:F", 16); ws.set_column("G:G", 10); ws.set_column("H:H", 15)
    ws.freeze_panes(1, 0)
    ws = W["Coste_diario"]
    ws.add_table(0, 0, len(CD), 1, {"name": "Coste_diario", "style": "Table Style Light 9",
                                    "columns": [{"header": "Fecha", "format": F["fecha"]}, {"header": "Coste", "format": F["num"]}],
                                    "data": [[r.Fecha.to_pydatetime(), float(r.Coste)] for r in CD.itertuples()]})
    ws.set_column("A:B", 14)
    ws = W["Calendario"]
    cal = []
    for a in (2025, 2026):
        for m in range(1, 13):
            fmx = P.fin_mes(a, m).to_pydatetime()
            cal.append([fmx, a, m, MESES[m - 1], f"{a}-{m:02d}", f"T{(m - 1) // 3 + 1}", "Sí" if fmx <= MES_SEL else "No"])
    ws.add_table(0, 0, len(cal), 6, {"name": "Calendario", "style": "Table Style Light 9", "data": cal,
                                     "columns": [{"header": "FinMes", "format": F["fecha"]}, {"header": "Año"}, {"header": "Mes"},
                                                 {"header": "NombreMes"}, {"header": "AñoMes"}, {"header": "Trimestre"},
                                                 {"header": "EsMesCerrado"}]})
    ws.set_column("A:G", 13)
    ws.write("I1", "Plan B: calendario de meses (uno por fin de mes). En el plan A, la tabla Calendario es diaria (ver «Cómo se hizo»).", F["nota"])
    n_cerr = sum(1 for c in cal if c[6] == "Sí")
    ws = W["Alias"]
    alias = [[k, v] for k, v in P.ALIAS.items()]
    ws.add_table(0, 0, len(alias), 1, {"name": "Alias_delegacion", "style": "Table Style Light 9", "data": alias,
                                       "columns": [{"header": "NombreQueLlega"}, {"header": "Delegacion"}]})
    ws.set_column("A:B", 20)
    ws.write("D1", "Tabla de equivalencias: Power Query combina cada fuente con esta tabla (Combinar consultas) y se queda con «Delegacion».", F["nota"])

    # ------------------------------------------------------------------ Cifras_cuadre (lo que dan los directores)
    ws = W["Cifras_cuadre"]
    ws.set_column("A:A", 62); ws.set_column("B:B", 18); ws.set_column("C:C", 40)
    ws.write("A1", "Cifras de cuadre que dan los directores (copiadas de p8-datos.xlsx y de LEEME_noviembre.txt)", F["tit"])
    ws.write_row("A3", ["Cifra", "Valor", "Fuente"], F["cab"])
    va = D["ventas"]
    vt = P.json.load(open(P.VERDAD, encoding="utf-8"))
    oct26, nov26 = P.fin_mes(2026, 10), P.fin_mes(2026, 11)
    cifras = [
        ("Ventas netas de octubre de 2026 (control del ERP)", round(va[va.FinMes == oct26].ImporteNeto.sum(), 2), "Javier · Cifras_cuadre", "eur"),
        ("Ventas netas de enero a octubre de 2026 (Σ control del ERP)", round(va[(va.FinMes >= "2026-01-01") & (va.FinMes <= oct26)].ImporteNeto.sum(), 2), "Javier · Cifras_cuadre", "eur"),
        ("Pendiente de cobro a 31/10/2026", vt["cuadre"]["pendiente"], "Marta · P3", "eur"),
        ("Stock valorado a 31/10/2026", vt["cuadre"]["stock"], "Andrés · P6", "eur"),
        ("FTE a 31/10/2026", vt["cuadre"]["fte"], "Lucía · P2", "dec"),
        ("Presupuesto de ventas netas 2026 (aprobado)", 9480000, "Marta · P7", "eur"),
        ("Ventas de octubre anotadas ANTES de cargar noviembre (registro de cambios)", vt["control"]["ventas_oct"], "Registro de cambios, 23/11/2026", "eur"),
        ("Ventas netas de noviembre de 2026 (control del ERP)", round(vt["nov"]["ventas_mes"], 2), "LEEME_noviembre.txt", "eur"),
    ]
    for i, (t, x, fu, f) in enumerate(cifras):
        ws.write(3 + i, 0, t, F["cel"]); ws.write_number(3 + i, 1, x, F[f]); ws.write(3 + i, 2, fu, F["cel"])
    ref_c = {k: f"Cifras_cuadre!$B${4 + i}" for i, k in enumerate(["v_oct", "v_eneoct", "pend", "stock", "fte", "ppto", "v_oct_reg", "v_nov"])}

    # ------------------------------------------------------------------ Calc (series para gráficos y minigráficos)
    ws = W["Calc"]
    ws.set_column("A:A", 34); ws.set_column("B:M", 11)
    L.f(ws, "A1", '"Ventas netas: últimos 12 meses frente al año anterior · "&IF(Deleg="Todas","toda la empresa",Deleg)')
    ws.write("A2", "Fin de mes", F["cab"]); ws.write("A3", "Etiqueta", F["cab"])
    series = ["Ventas", "Año anterior", "Margen %", "Vencida > 60 %", "PMC (días)", "Cobertura (días)", "Absentismo %", "EBITDA del mes"]
    for i, t in enumerate(series):
        ws.write(3 + i, 0, t, F["cab"])
    for j in range(12):
        c = xlsxwriter.utility.xl_col_to_name(1 + j)
        L.f(ws, f"{c}2", f"EOMONTH(Mes,{j - 11})", F["calcf"])
        x = f"{c}$2"
        L.f(ws, f"{c}3", f'INDEX(MesesAbr,MONTH({x}))&"-"&RIGHT(YEAR({x}),2)', F["calc"])
        L.f(ws, f"{c}4", S("Ventas", x), F["calc"])
        L.f(ws, f"{c}5", f'IF({CNT("Ventas", f"EOMONTH({x},-12)")}=0,NA(),{S("Ventas", f"EOMONTH({x},-12)")})', F["calc"])
        L.f(ws, f"{c}6", f'IFERROR(({S("Ventas", x)}-{S("Coste", x)})/{S("Ventas", x)},NA())', F["calc"])
        L.f(ws, f"{c}7", f'IF({CNT("Pendiente", x)}=0,NA(),IFERROR({S("Vencido60", x)}/{S("Pendiente", x)},NA()))', F["calc"])
        v3 = f'SUMIFS({h("Valor")},{h("Indicador")},"Ventas",{h("FinMes")},">"&EOMONTH({x},-3),{h("FinMes")},"<="&{x},{h("Delegacion")},DelegCrit)'
        L.f(ws, f"{c}8", f'IF({CNT("Pendiente", x)}=0,NA(),IFERROR({S("Pendiente", x)}/({v3}*(1+IVA))*({x}-EOMONTH({x},-3)),NA()))', F["calc"])
        c90 = f'SUMIFS({cdf("Coste")},{cdf("Fecha")},">"&({x}-DiasCobertura),{cdf("Fecha")},"<="&{x})'
        L.f(ws, f"{c}9", f'IF({CNT("Stock", x)}=0,NA(),IFERROR({S("Stock", x, deleg=False)}/({c90}/DiasCobertura),NA()))', F["calc"])
        L.f(ws, f"{c}10", f'IF({CNT("DiasTeoricos", x)}=0,NA(),IFERROR({S("DiasIT", x)}/{S("DiasTeoricos", x)},NA()))', F["calc"])
        L.f(ws, f"{c}11", f'IF({CNT("PyG real", x)}=0,NA(),{S("PyG real", x, deleg=False, extra=",Hechos[EnEBITDA],1".replace("Hechos[EnEBITDA]", h("EnEBITDA")))})', F["calc"])
    # cumplimiento por delegación (acumulado del año)
    ws.write_row("A14", ["Delegación", "Ventas acum.", "Ppto acum.", "Cumplimiento"], F["cab"])
    L.f(ws, "A13", '"Cumplimiento del presupuesto de ventas acumulado a "&INDEX(NombresMes,MONTH(Mes))&" de "&YEAR(Mes)&", por delegación"')
    for i, d in enumerate(["Zaragoza", "Pamplona", "Lleida"]):
        r = 15 + i
        ws.write(f"A{r}", d, F["calc"])
        crit = f',{h("Delegacion")},A{r}'
        L.f(ws, f"B{r}", SR("Ventas", "IniAnio", "Mes", deleg=False, extra=crit), F["calc"])
        L.f(ws, f"C{r}", SR("Ppto", "IniAnio", "Mes", deleg=False, extra=crit), F["calc"])
        L.f(ws, f"D{r}", f"IFERROR(B{r}/C{r},NA())", F["calc"])
    # saldos por mes del año (antigüedad)
    L.f(ws, "A19", '"Saldo de clientes a fin de cada mes de "&YEAR(Mes)&" (€) · "&IF(Deleg="Todas","toda la empresa",Deleg)&" · agosto no se cerró"')
    ws.write("A20", "Fin de mes", F["cab"]); ws.write("A21", "Etiqueta", F["cab"])
    ws.write("A22", "No vencido o hasta 60 días", F["cab"]); ws.write("A23", "Vencido a más de 60 días", F["cab"])
    for j in range(12):
        c = xlsxwriter.utility.xl_col_to_name(1 + j)
        x = f"{c}$20"
        L.f(ws, f"{c}20", f"EOMONTH(DATE(YEAR(Mes),{j + 1},1),0)", F["calcf"])
        L.f(ws, f"{c}21", f'INDEX(MesesAbr,{j + 1})&IF(AND({x}<=Mes,{CNT("Pendiente", x)}=0)," (sin dato)","")', F["calc"])
        L.f(ws, f"{c}22", f'IF(OR({x}>Mes,{CNT("Pendiente", x)}=0),NA(),{S("Pendiente", x)}-{S("Vencido60", x)})', F["calc"])
        L.f(ws, f"{c}23", f'IF(OR({x}>Mes,{CNT("Pendiente", x)}=0),NA(),{S("Vencido60", x)})', F["calc"])
    # stock por clase ABC
    L.f(ws, "A25", '"Stock valorado por clase ABC a "&INDEX(NombresMes,MONTH(Mes))&" de "&YEAR(Mes)&" (€) · almacén central"')
    ws.write_row("A26", ["Clase", "Valor"], F["cab"])
    for i, c in enumerate(["A", "B", "C", "Sin ficha"]):
        r = 27 + i
        ws.write(f"A{r}", c, F["calc"])
        L.f(ws, f"B{r}", f'IF({CNT("Stock")}=0,NA(),{S("Stock", deleg=False, extra=f",{h(chr(68) + "etalle")},A{r}")})', F["calc"])
    # P&L acumulado por partida y las 5 desviaciones mayores
    ws.write_row("A33", ["Partida (acumulado del año)", "Real", "Presupuesto", "Desviación", "Clave orden"], F["cab"])
    partidas = list(dict.fromkeys(D["pyg"].Partida))
    for i, ptd in enumerate(partidas):
        r = 34 + i
        ws.write(f"A{r}", ptd, F["calc"])
        crit = f',{h("Detalle")},A{r}'
        L.f(ws, f"B{r}", SR("PyG real", "IniAnio", "Mes", deleg=False, extra=crit), F["calc"])
        L.f(ws, f"C{r}", SR("PyG ppto", "IniAnio", "Mes", deleg=False, extra=crit), F["calc"])
        L.f(ws, f"D{r}", f"B{r}-C{r}", F["calc"])
        L.f(ws, f"E{r}", f"ABS(D{r})+ROW()/1000000", F["calc"])
    r1, r2 = 34, 34 + len(partidas) - 1
    ws.write_row("A51", ["Puesto", "Partida", "Real", "Presupuesto", "Desviación"], F["cab"])
    for k in range(1, 6):
        r = 51 + k
        ws.write(f"A{r}", k, F["calc"])
        pos = f"MATCH(LARGE($E${r1}:$E${r2},A{r}),$E${r1}:$E${r2},0)"
        for colL, src in zip("BCDE", "ABCD"):
            L.f(ws, f"{colL}{r}", f"INDEX(${src}${r1}:${src}${r2},{pos})", F["calc"])
    ws.write("G1", "Hoja técnica: series de los gráficos y minigráficos del Cuadro. #N/D = mes sin dato (el gráfico deja el hueco). No tocar.", F["nota"])

    # ------------------------------------------------------------------ Cuadro
    ws = W["Cuadro"]
    ws.hide_gridlines(2)
    anchos = {"A": 1.5, "B": 30, "C": 14, "D": 14, "E": 13, "F": 14, "G": 11, "H": 16, "I": 15, "J": 22, "K": 14, "L": 34}
    for c, a in anchos.items():
        ws.set_column(f"{c}:{c}", a)
    L.f(ws, "B1", '"Cuadro de mando · "&INDEX(NombresMes,MONTH(Mes))&" de "&YEAR(Mes)&" · "&IF(Deleg="Todas","toda la empresa","delegación de "&Deleg)', F["tit"])
    L.f(ws, "B2", '"Controles: "&IF(MaestroOK,"OK ✓","REVISAR ✗")', F["estado"])
    ws.write("C2", "Electro Cierzo Suministros, S.L. · Comité de dirección · datos agregados, sin personas", F["sub"])
    ws.write("B3", "Mes (elige el fin de mes):", F["kpi"])
    ws.write_datetime("C3", MES_SEL, F["fechasel"])
    ws.write("E3", "Delegación:", F["kpi"])
    ws.write("F3", "Todas", F["sel"])
    ws.write("H3", "Cambia solo las celdas amarillas. Semáforo: ✓ verde en meta · ! ámbar 95-100 % · ✗ rojo < 95 %.", F["nota"])
    wb.define_name("Mes", "=Cuadro!$C$3")
    wb.define_name("Deleg", "=Cuadro!$F$3")
    ws.data_validation("C3", {"validate": "list", "source": f"=Calendario!$A$2:$A${n_cerr + 1}",
                              "input_title": "Mes", "input_message": "Elige un fin de mes cerrado.",
                              "error_title": "Mes no válido", "error_message": "Elige un fin de mes de la lista."})
    ws.data_validation("F3", {"validate": "list", "source": "=ListaDeleg"})
    cab = ["Indicador", "Mes", "Año anterior", "Var. interanual", "Meta / ppto", "Cumplimiento", "Estado",
           "Dato de apoyo", "Qué es el dato de apoyo", "Últimos 12 meses", "Nota"]
    ws.write_row("B5", cab, F["h"])
    ws.set_row(4, 28)
    estado = lambda r: f'IF(ISNUMBER(G{r}),IFS(G{r}>=1,"✓ En meta",G{r}>=UmbralAmbar,"! Vigilar",TRUE,"✗ Fuera de meta"),"– Sin dato")'
    v3 = f'SUMIFS({h("Valor")},{h("Indicador")},"Ventas",{h("FinMes")},">"&Ini3,{h("FinMes")},"<="&Mes,{h("Delegacion")},DelegCrit)'
    c90 = f'SUMIFS({cdf("Coste")},{cdf("Fecha")},">"&(Mes-DiasCobertura),{cdf("Fecha")},"<="&Mes)'
    v3aa = f'SUMIFS({h("Valor")},{h("Indicador")},"Ventas",{h("FinMes")},">"&EOMONTH(MesAA,-3),{h("FinMes")},"<="&MesAA,{h("Delegacion")},DelegCrit)'
    c90aa = f'SUMIFS({cdf("Coste")},{cdf("Fecha")},">"&(MesAA-DiasCobertura),{cdf("Fecha")},"<="&MesAA)'
    ebi = lambda ind, fmx="Mes", acum=False: (
        SR(ind, "IniAnio", "Mes", deleg=False, extra=f',{h("EnEBITDA")},1') if acum
        else S(ind, fmx, deleg=False, extra=f',{h("EnEBITDA")},1'))
    nota_emp = lambda txt: f'IF(Deleg<>"Todas","{txt}","")'
    K = [  # fila, nombre, C, D, E, F, G, I, J, formatos (C, D, E, F, I), fila de Calc para el minigráfico, nota
        (6, "Ventas netas (€)", S("Ventas"),
         f'IF({CNT("Ventas", "MesAA")}=0,"sin dato",{S("Ventas", "MesAA")})',
         'IF(AND(ISNUMBER(C6),ISNUMBER(D6)),IF(D6=0,"sin dato",C6/D6-1),"sin dato")',
         f'IF({S("Ppto")}=0,"sin dato",{S("Ppto")})', 'IF(ISNUMBER(F6),C6/F6,"sin dato")',
         SR("Ventas", "IniAnio", "Mes"), "Acumulado del año (€)", ("eur0b", "eur0", "pctv", "eur0", "eur0"), 4,
         'IF(Deleg="Logroño","Logroño abrió el 02/11/2026: sin presupuesto ni año anterior","")'),
        (7, "Margen bruto %", f'IFERROR(({S("Ventas")}-{S("Coste")})/{S("Ventas")},"sin dato")',
         f'IF({CNT("Ventas", "MesAA")}=0,"sin dato",IFERROR(({S("Ventas", "MesAA")}-{S("Coste", "MesAA")})/{S("Ventas", "MesAA")},"sin dato"))',
         'IF(AND(ISNUMBER(C7),ISNUMBER(D7)),(C7-D7)*100,"sin dato")', "MetaMargen", 'IF(ISNUMBER(C7),C7/F7,"sin dato")',
         f'IFERROR(({SR("Ventas", "IniAnio", "Mes")}-{SR("Coste", "IniAnio", "Mes")})/{SR("Ventas", "IniAnio", "Mes")},"sin dato")',
         "Margen acumulado del año", ("pctb", "pct", "pp", "pct", "pct"), 6, '""'),
        (8, "Cartera vencida > 60 días (% del pendiente)",
         f'IF({CNT("Pendiente")}=0,"sin dato",IFERROR({S("Vencido60")}/{S("Pendiente")},"sin dato"))',
         f'IF({CNT("Pendiente", "MesAA")}=0,"sin dato",IFERROR({S("Vencido60", "MesAA")}/{S("Pendiente", "MesAA")},"sin dato"))',
         'IF(AND(ISNUMBER(C8),ISNUMBER(D8)),(C8-D8)*100,"sin dato")', "MetaVencida",
         'IF(ISNUMBER(C8),IF(C8<=0,1,F8/C8),"sin dato")', f'IF({CNT("Pendiente")}=0,"sin dato",{S("Pendiente")})',
         "Pendiente de cobro (€, foto)", ("pctb", "pct", "pp", "pct", "eur0"), 7,
         f'IF({CNT("Pendiente")}=0,"Agosto no se cerró: sin dato (no es 0)","")'),
        (9, "PMC · periodo medio de cobro (días)",
         f'IF({CNT("Pendiente")}=0,"sin dato",IFERROR({S("Pendiente")}/({v3}*(1+IVA))*(Mes-Ini3),"sin dato"))',
         f'IF({CNT("Pendiente", "MesAA")}=0,"sin dato",IFERROR({S("Pendiente", "MesAA")}/({v3aa}*(1+IVA))*(MesAA-EOMONTH(MesAA,-3)),"sin dato"))',
         'IF(AND(ISNUMBER(C9),ISNUMBER(D9)),C9-D9,"sin dato")', "MetaPMC",
         'IF(ISNUMBER(C9),F9/C9,"sin dato")', f"{v3}*(1+IVA)", "Ventas con IVA, últimos 3 meses (€)",
         ("diasb", "dias", "dd", "dias", "eur0"), 8, '""'),
        (10, "Stock: cobertura (días)",
         f'IF({CNT("Stock")}=0,"sin dato",IFERROR({S("Stock", deleg=False)}/({c90}/DiasCobertura),"sin dato"))',
         f'IF({CNT("Stock", "MesAA")}=0,"sin dato",IFERROR({S("Stock", "MesAA", deleg=False)}/({c90aa}/DiasCobertura),"sin dato"))',
         'IF(AND(ISNUMBER(C10),ISNUMBER(D10)),C10-D10,"sin dato")',
         "MetaCobertura", 'IF(ISNUMBER(C10),F10/C10,"sin dato")', f'IF({CNT("Stock")}=0,"sin dato",{S("Stock", deleg=False)})',
         "Stock valorado (€) · almacén central", ("diasb", "dias", "dd", "dias", "eur0"), 9,
         nota_emp("Dato de empresa: el stock es central y no se reparte por delegación")),
        (11, "Absentismo (días de IT / teóricos)",
         f'IF({CNT("DiasTeoricos")}=0,"sin dato",IFERROR({S("DiasIT")}/{S("DiasTeoricos")},"sin dato"))',
         f'IF({CNT("DiasTeoricos", "MesAA")}=0,"sin dato",IFERROR({S("DiasIT", "MesAA")}/{S("DiasTeoricos", "MesAA")},"sin dato"))', 'IF(AND(ISNUMBER(C11),ISNUMBER(D11)),(C11-D11)*100,"sin dato")',
         "MetaAbsentismo", 'IF(ISNUMBER(C11),IF(C11<=0,1,F11/C11),"sin dato")', f'IF({CNT("FTE")}=0,"sin dato",{S("FTE")})',
         "FTE al cierre del mes", ("pctb", "pct", "pp", "pct", "dec"), 10, '""'),
        (12, "EBITDA acumulado del año (€)",
         f'IF({CNT("PyG real")}=0,"sin dato",{ebi("PyG real", acum=True)})',
         f'IF({CNT("PyG real", "MesAA")}=0,"sin dato",{SR("PyG real", "DATE(YEAR(MesAA),1,1)", "MesAA", deleg=False, extra=chr(44) + h("EnEBITDA") + ",1")})',
         'IF(AND(ISNUMBER(C12),ISNUMBER(D12)),C12/D12-1,"sin dato")', ebi("PyG ppto", acum=True),
         'IF(AND(ISNUMBER(C12),F12>0),C12/F12,"sin dato")', f'IF({CNT("PyG real")}=0,"sin dato",{ebi("PyG real")})',
         "EBITDA del mes (€)", ("eur0b", "eur0", "pctv", "eur0", "eur0"), 11,
         nota_emp("Dato de empresa: el EBITDA no se reparte por delegación")),
    ]
    for (fila, nombre, fc, fd, fe, ff, fg, fi, tj, fmts, calc_row, nota) in K:
        ws.write(f"B{fila}", nombre, F["kpi"])
        L.f(ws, f"C{fila}", fc, F[fmts[0]]); L.f(ws, f"D{fila}", fd, F[fmts[1]]); L.f(ws, f"E{fila}", fe, F[fmts[2]])
        L.f(ws, f"F{fila}", ff, F[fmts[3]]); L.f(ws, f"G{fila}", fg, F["pct"]); L.f(ws, f"H{fila}", estado(fila), F["estado"])
        L.f(ws, f"I{fila}", fi, F[fmts[4]]); ws.write(f"J{fila}", tj, F["nota"])
        ws.add_sparkline(f"K{fila}", {"range": f"Calc!B{calc_row}:M{calc_row}", "markers": True, "last_point": True,
                                      "series_color": AZUL})
        L.f(ws, f"L{fila}", nota, F["nota"])
        ws.set_row(fila - 1, 30)
    for txt, fmt in [("En meta", "ok"), ("Vigilar", "ambar"), ("Fuera de meta", "mal"), ("Sin dato", "grisc")]:
        ws.conditional_format("H6:H12", {"type": "text", "criteria": "containing", "value": txt, "format": F[fmt]})
    ws.conditional_format("B2", {"type": "text", "criteria": "containing", "value": "OK", "format": F["ok"]})
    ws.conditional_format("B2", {"type": "text", "criteria": "containing", "value": "REVISAR", "format": F["mal"]})
    # Qué hay que mirar + 5 desviaciones
    ws.merge_range("B14:F14", "Qué hay que mirar este mes (lo escribe la analista, no la IA)", F["cajah"])
    for i, frase in enumerate(QUE_MIRAR):
        ws.merge_range(f"B{15 + i}:F{15 + i}", f"{i + 1}. {frase}", F["caja"])
        ws.set_row(14 + i, 48)
    L.f(ws, "H14", '"Las 5 desviaciones del P&L que más pesan (acumulado a "&INDEX(NombresMes,MONTH(Mes))&")"', F["cajah"])
    for c in "IJKL":
        ws.write_blank(f"{c}14", None, F["cajah"])
    ws.write_row("H15", ["Partida", "Real", "Presupuesto", "Desviación (€)", "Efecto"], F["cab"])
    for k in range(5):
        r, rc = 16 + k, 52 + k
        L.f(ws, f"H{r}", f"Calc!B{rc}", F["cel"])
        L.f(ws, f"I{r}", f"ABS(Calc!C{rc})", F["eur0"])
        L.f(ws, f"J{r}", f"ABS(Calc!D{rc})", F["eur0"])
        L.f(ws, f"K{r}", f"Calc!E{rc}", wb.add_format({"num_format": '+#,##0 "€";-#,##0 "€"', "border": 1, "font_size": 10}))
        L.f(ws, f"L{r}", f'IF(Calc!E{rc}>=0,"Favorable (mejora el resultado)","Desfavorable (empeora el resultado)")', F["cel"])
    ws.conditional_format("L16:L20", {"type": "text", "criteria": "begins with", "value": "Desfavorable", "format": F["mal"]})
    ws.conditional_format("L16:L20", {"type": "text", "criteria": "begins with", "value": "Favorable", "format": F["ok"]})
    # gráficos
    def graf(tipo, sub=None):
        c = wb.add_chart({"type": tipo, "subtype": sub} if sub else {"type": tipo})
        c.set_legend({"position": "bottom"})
        c.set_chartarea({"border": {"none": True}})
        return c
    g1 = graf("line")
    g1.add_series({"name": "=Calc!$A$4", "categories": "=Calc!$B$3:$M$3", "values": "=Calc!$B$4:$M$4",
                   "line": {"color": AZUL, "width": 2.25}, "marker": {"type": "circle", "size": 4}})
    g1.add_series({"name": "=Calc!$A$5", "categories": "=Calc!$B$3:$M$3", "values": "=Calc!$B$5:$M$5",
                   "line": {"color": "#A6A6A6", "width": 1.5, "dash_type": "dash"}})
    g1.set_title({"name": "=Calc!$A$1", "name_font": {"size": 11}})
    g1.set_y_axis({"num_format": '#,##0 "€"', "major_gridlines": {"visible": True, "line": {"color": "#E7E6E6"}}})
    g2 = graf("bar")
    g2.add_series({"name": "Cumplimiento", "categories": "=Calc!$A$15:$A$17", "values": "=Calc!$D$15:$D$17",
                   "fill": {"color": AZUL}, "data_labels": {"value": True, "num_format": "0.0%"}})
    g2.set_title({"name": "=Calc!$A$13", "name_font": {"size": 11}})
    g2.set_x_axis({"num_format": "0%", "min": 0, "major_gridlines": {"visible": False}})
    g2.set_legend({"none": True})
    g3 = graf("column", "stacked")
    g3.add_series({"name": "=Calc!$A$22", "categories": "=Calc!$B$21:$M$21", "values": "=Calc!$B$22:$M$22", "fill": {"color": "#8EA9DB"}})
    g3.add_series({"name": "=Calc!$A$23", "categories": "=Calc!$B$21:$M$21", "values": "=Calc!$B$23:$M$23", "fill": {"color": "#C00000"}})
    g3.set_title({"name": "=Calc!$A$19", "name_font": {"size": 11}})
    g3.set_y_axis({"num_format": '#,##0 "€"'})
    g4 = graf("bar")
    g4.add_series({"name": "Stock valorado", "categories": "=Calc!$A$27:$A$30", "values": "=Calc!$B$27:$B$30",
                   "fill": {"color": "#548235"}, "data_labels": {"value": True, "num_format": '#,##0 "€"'}})
    g4.set_title({"name": "=Calc!$A$25", "name_font": {"size": 11}})
    g4.set_legend({"none": True})
    g4.set_y_axis({"reverse": True})
    alt = [("B22", g1, "Gráfico de líneas: ventas netas de los últimos 12 meses (línea azul) frente a las del año anterior (línea gris discontinua)."),
           ("H22", g2, "Gráfico de barras: porcentaje de cumplimiento del presupuesto de ventas acumulado de Zaragoza, Pamplona y Lleida."),
           ("B38", g3, "Columnas apiladas: saldo de clientes a fin de cada mes, separado en no vencido o hasta 60 días y vencido a más de 60 días. Agosto no tiene dato."),
           ("H38", g4, "Gráfico de barras: valor del stock del almacén central por clase ABC (A, B, C y sin ficha).")]
    for celda, g, desc in alt:
        g.set_size({"width": 620, "height": 300})
        ws.insert_chart(celda, g, {"description": desc, "object_position": 2})
    ws.set_landscape(); ws.set_paper(9); ws.fit_to_pages(1, 1); ws.print_area("A1:L54")
    ws.set_margins(left=0.4, right=0.4, top=0.5, bottom=0.5)
    ws.set_footer("&L&8Electro Cierzo · Cuadro de mando&R&8Página &P de &N")
    ws.protect("", {"objects": False, "select_locked_cells": True, "select_unlocked_cells": True})

    # ------------------------------------------------------------------ Controles
    ws = W["Controles"]
    ws.set_column("A:A", 4); ws.set_column("B:B", 62); ws.set_column("C:E", 16); ws.set_column("F:F", 10); ws.set_column("G:G", 12)
    ws.write("B1", "Controles del cuadro", F["tit"])
    ws.write_row("A3", ["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "¿Cuadra?"], F["cab"])
    oct_s, ago_s, nov_s = "DATE(2026,10,31)", "DATE(2026,8,31)", "DATE(2026,11,30)"
    ctr = [
        ("Ventas netas de octubre de 2026 = control del ERP", ref_c["v_oct"], S("Ventas", oct_s, deleg=False), 0.01, "eur"),
        ("Ventas netas de enero a octubre de 2026 = Σ control del ERP", ref_c["v_eneoct"], SR("Ventas", "DATE(2026,1,1)", oct_s, deleg=False), 0.01, "eur"),
        ("Octubre: Σ de las delegaciones = total (con «Todas»)", S("Ventas", oct_s, deleg=False),
         "+".join(S("Ventas", oct_s, deleg=False, extra=f',{h("Delegacion")},"{d}"') for d in DELEGS), 0.01, "eur"),
        ("Pendiente de cobro a 31/10/2026 = Administración (P3)", ref_c["pend"], S("Pendiente", oct_s, deleg=False), 0.01, "eur"),
        ("Stock valorado a 31/10/2026 = Almacén (P6)", ref_c["stock"], S("Stock", oct_s, deleg=False), 0.01, "eur"),
        ("FTE a 31/10/2026 = RR. HH. (P2)", ref_c["fte"], S("FTE", oct_s, deleg=False), 0.001, "dec"),
        ("Ventas del P&L (real, enero-octubre) = ventas del ERP", SR("Ventas", "DATE(2026,1,1)", oct_s, deleg=False),
         SR("PyG real", "DATE(2026,1,1)", oct_s, deleg=False, extra=f',{h("Detalle")},"Ventas netas"'), 0.01, "eur"),
        ("Presupuesto de ventas 2026 (Hechos) = aprobado", ref_c["ppto"], SR("Ppto", "DATE(2026,1,1)", "DATE(2026,12,31)", deleg=False), 0.5, "eur"),
        ("Presupuesto de ventas del P&L 2026 = presupuesto por delegación y familia", SR("Ppto", "DATE(2026,1,1)", "DATE(2026,12,31)", deleg=False),
         SR("PyG ppto", "DATE(2026,1,1)", "DATE(2026,12,31)", deleg=False, extra=f',{h("Detalle")},"Ventas netas"'), 0.5, "eur"),
        ("Agosto de 2026 en saldos: 0 filas (se muestra «sin dato», no 0)", "0", CNT("Pendiente", ago_s), 0, "ent"),
        ("Octubre no cambia al cargar noviembre (ventas de octubre del registro)", ref_c["v_oct_reg"], S("Ventas", oct_s, deleg=False), 0.01, "eur"),
        ("Ventas netas de noviembre de 2026 = control del ERP (LEEME_noviembre)", ref_c["v_nov"], S("Ventas", nov_s, deleg=False), 0.01, "eur"),
        ("Casos de prueba de las medidas: todos coinciden (hoja Casos_prueba)", "0", 'COUNTIF(Casos_prueba!$G$4:$G$20,FALSE)', 0, "ent"),
        ("Errores visibles en el Cuadro (#N/D, #¡DIV/0!…), sin contar la fila 2, que muestra este control", "0", "SUMPRODUCT(--ISERROR(Cuadro!$B$3:$L$54))+ISERROR(Cuadro!$B$1)", 0, "ent"),
    ]
    for i, (txt, esp, obt, tol, f) in enumerate(ctr):
        r = 4 + i
        ws.write(f"A{r}", i + 1, F["cel"]); ws.write(f"B{r}", txt, F["cel"])
        L.f(ws, f"C{r}", esp, F[f]); L.f(ws, f"D{r}", obt, F[f]); L.f(ws, f"E{r}", f"D{r}-C{r}", F[f])
        ws.write_number(f"F{r}", tol, F["dec"]); L.f(ws, f"G{r}", f"ROUND(ABS(E{r}),6)<=F{r}", F["estado"])
    ult = 3 + len(ctr)
    ws.conditional_format(f"G4:G{ult}", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
    ws.conditional_format(f"G4:G{ult}", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
    ws.write(f"B{ult + 2}", "CONTROL MAESTRO (todos cuadran)", F["kpi"])
    L.f(ws, f"G{ult + 2}", f"AND(G4:G{ult})", F["estado"])
    wb.define_name("MaestroOK", f"=Controles!$G${ult + 2}")
    ws.conditional_format(f"G{ult + 2}", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
    ws.conditional_format(f"G{ult + 2}", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})

    # ------------------------------------------------------------------ Casos de prueba (IA con verificación)
    ws = W["Casos_prueba"]
    ws.set_column("A:A", 4); ws.set_column("B:B", 30); ws.set_column("C:C", 14); ws.set_column("D:D", 46)
    ws.set_column("E:F", 16); ws.set_column("G:G", 11)
    ws.write("B1", "Casos de prueba de cada medida (también de las que propuso la IA)", F["tit"])
    ws.write("B2", "«A mano» = calculado con un filtro sobre el CSV de origen y la barra de estado; «Fórmula» = lo que da el libro.", F["sub"])
    ws.write_row("A3", ["Nº", "Medida", "Propuesta por", "Caso de prueba", "A mano", "Fórmula", "¿Coincide?"], F["cab"])
    ini26, ini25, oct25 = "DATE(2026,1,1)", "DATE(2025,1,1)", "DATE(2025,10,31)"
    lle = f',{h("Delegacion")},"Lleida"'
    pam = f',{h("Delegacion")},"Pamplona"'
    c90o = f'SUMIFS({cdf("Coste")},{cdf("Fecha")},">"&({oct_s}-90),{cdf("Fecha")},"<="&{oct_s})'
    v3o = f'SUMIFS({h("Valor")},{h("Indicador")},"Ventas",{h("FinMes")},">"&EOMONTH({oct_s},-3),{h("FinMes")},"<="&{oct_s})'
    ebiR = lambda ind: SR(ind, ini26, oct_s, deleg=False, extra=f',{h("EnEBITDA")},1')
    k10 = vt["oct"]
    vv = D["ventas"]
    pam_oct = round(vv[(vv.FinMes == oct26) & (vv.Delegacion == "Pamplona")].ImporteNeto.sum(), 2)
    s30 = D["saldos"][D["saldos"].FinMes == P.fin_mes(2026, 9)].Pendiente.sum()
    plc = D["plantilla"][(D["plantilla"].Departamento == "Comercial") & (D["plantilla"].FinMes <= oct26)]
    casos = [
        ("Ventas", "Copilot", "Octubre de 2026 · Pamplona", pam_oct, S("Ventas", oct_s, deleg=False, extra=pam), 0.01, "eur"),
        ("Ventas · control 1", "Analista", "Octubre de 2026 · empresa", vt["control"]["ventas_oct"], S("Ventas", oct_s, deleg=False), 0.01, "eur"),
        ("Var. interanual · control 2", "Copilot", "Lleida, enero-octubre 2026 frente a enero-octubre 2025 (%)", vt["control"]["var_lleida_eneoct_pct"],
         f'({SR("Ventas", ini26, oct_s, deleg=False, extra=lle)}/{SR("Ventas", ini25, oct25, deleg=False, extra=lle)}-1)*100', 0.01, "dec"),
        ("Margen % · control 3", "Analista", "Empresa, enero-octubre 2026 (%)", vt["control"]["margen_eneoct_pct"],
         f'({SR("Ventas", ini26, oct_s, deleg=False)}-{SR("Coste", ini26, oct_s, deleg=False)})/{SR("Ventas", ini26, oct_s, deleg=False)}*100', 0.01, "dec"),
        ("Vencida > 60 % · control 4", "Analista", "Empresa a 31/10/2026 (%)", vt["control"]["vencida60_oct_pct"],
         f'{S("Vencido60", oct_s, deleg=False)}/{S("Pendiente", oct_s, deleg=False)}*100', 0.01, "dec"),
        ("PMC · control 5", "Copilot", "Empresa a 31/10/2026 (días; 92 = días de agosto a octubre)", vt["control"]["pmc_oct"],
         f'{S("Pendiente", oct_s, deleg=False)}/({v3o}*(1+IVA))*({oct_s}-EOMONTH({oct_s},-3))', 0.01, "dec"),
        ("Cobertura · control 6", "Analista", "A 31/10/2026 (días; coste del 03/08 al 31/10)", vt["control"]["cobertura_oct"],
         f'{S("Stock", oct_s, deleg=False)}/({c90o}/90)', 0.01, "dec"),
        ("Absentismo · control 7", "Analista", "Empresa, enero-octubre 2026 (%)", vt["control"]["absentismo_eneoct_pct"],
         f'{SR("DiasIT", ini26, oct_s, deleg=False)}/{SR("DiasTeoricos", ini26, oct_s, deleg=False)}*100', 0.01, "dec"),
        ("EBITDA · control 8", "Copilot", "Cumplimiento acumulado enero-octubre 2026 (%)", vt["control"]["ebitda_cumpl_eneoct_pct"],
         f'{ebiR("PyG real")}/{ebiR("PyG ppto")}*100', 0.01, "dec"),
        ("Saldo de clientes (foto)", "Copilot", "3.er trimestre de 2026 = foto del 30/09, NO la suma de jul-ago-sep", round(s30, 2),
         S("Pendiente", "DATE(2026,9,30)", deleg=False), 0.01, "eur"),
        ("Absentismo por departamento", "Analista", "Comercial, enero-octubre 2026 (%)", round(plc.DiasIT.sum() / plc.DiasTeoricos.sum() * 100, 2),
         f'{SR("DiasIT", ini26, oct_s, deleg=False, extra=chr(44) + h("Detalle") + chr(44) + chr(34) + "Comercial" + chr(34))}/'
         f'{SR("DiasTeoricos", ini26, oct_s, deleg=False, extra=chr(44) + h("Detalle") + chr(44) + chr(34) + "Comercial" + chr(34))}*100', 0.01, "dec"),
    ]
    for i, (med, quien, caso, mano, fo, tol, f) in enumerate(casos):
        r = 4 + i
        ws.write(f"A{r}", i + 1, F["cel"]); ws.write(f"B{r}", med, F["cel"]); ws.write(f"C{r}", quien, F["cel"])
        ws.write(f"D{r}", caso, F["cel"]); ws.write_number(f"E{r}", mano, F[f]); L.f(ws, f"F{r}", fo, F[f])
        L.f(ws, f"G{r}", f"ABS(F{r}-E{r})<={tol}", F["estado"])
    ws.conditional_format("G4:G20", {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
    ws.conditional_format("G4:G20", {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
    ws.write(f"B{6 + len(casos)}", "La IA propuso para el saldo «SUM(Saldos[Pendiente])» sin LASTDATE: con el trimestre suma tres fotos "
             "(caso 10). Se corrigió con CALCULATE(…; LASTDATE(Calendario[Fecha])).", F["nota"])

    # ------------------------------------------------------------------ hojas de texto
    textos(W["Léame"], LEAME)
    textos(W["Cómo se hizo"], COMO)
    textos(W["Manual"], MANUAL)
    ws = W["Diccionario"]
    cabd = ["Indicador", "Definición", "Fórmula", "Fuente", "Responsable", "Meta", "Sentido", "¿Por delegación?", "Cierre"]
    ws.write_row(0, 0, cabd, F["h"])
    for i, fila in enumerate(DICCIONARIO, 1):
        ws.write_row(i, 0, fila, F["cel"])
        ws.set_row(i, 58)
    ws.set_column("A:A", 24); ws.set_column("B:C", 40); ws.set_column("D:I", 16)
    ws.write(len(DICCIONARIO) + 2, 0, "Aprobado por Carmen Soler el 30/11/2026. Semáforo: verde ≥ 100 % de la meta; ámbar 95-100 %; "
             "rojo < 95 %. En los de «menos es mejor», cumplimiento = meta / valor.", F["nota"])
    ws = W["Calidad_datos"]
    ws.write_row(0, 0, ["Fuente", "Columna", "Código", "Problema", "Filas afectadas", "Decisión"], F["h"])
    for i, fila in enumerate(CALIDAD, 1):
        ws.write_row(i, 0, fila, F["cel"])
    ws.set_column("A:A", 30); ws.set_column("B:C", 14); ws.set_column("D:D", 60); ws.set_column("E:E", 16); ws.set_column("F:F", 50)
    for n in ["Léame", "Cómo se hizo", "Manual"]:
        W[n].hide_gridlines(2)
    W["Cuadro"].activate()
    wb.close()
    return L.formulas


def leer_valores(ruta, formulas):
    tmp = tempfile.mkdtemp()
    perfil = os.path.join(tmp, "perfil")
    os.makedirs(os.path.join(perfil, "user"))
    with open(os.path.join(perfil, "user", "registrymodifications.xcu"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<oor:items xmlns:oor="http://openoffice.org/2001/registry" '
                'xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
                '<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse">'
                '<value>0</value></prop></item>\n</oor:items>\n')
    subprocess.run(["soffice", f"-env:UserInstallation=file://{perfil}", "--headless", "--calc", "--convert-to", "xlsx",
                    "--outdir", tmp, ruta], check=True, capture_output=True, timeout=300)
    wb = openpyxl.load_workbook(os.path.join(tmp, os.path.basename(ruta)), data_only=True)
    vals = {}
    for hoja, celda in formulas:
        v = wb[hoja][celda].value
        if isinstance(v, dt.datetime):
            v = (v - dt.datetime(1899, 12, 30)).days
        vals[(hoja, celda)] = v
    shutil.rmtree(tmp)
    return vals


def comprobar(vals, k):
    """Compara lo que calcula el libro (LibreOffice) con pandas (sin redondear)."""
    esperado = {("Cuadro", "C6"): k["ventas_mes"], ("Cuadro", "C7"): k["margen_mes_pct"] / 100,
                ("Cuadro", "C8"): k["vencida_pct"] / 100, ("Cuadro", "C9"): k["pmc"], ("Cuadro", "C10"): k["cobertura"],
                ("Cuadro", "C11"): k["absentismo_mes_pct"] / 100, ("Cuadro", "C12"): k["ebitda_ytd_real"],
                ("Cuadro", "I6"): k["ventas_ytd"], ("Cuadro", "F6"): k["ppto_mes"], ("Cuadro", "I8"): k["pendiente"],
                ("Cuadro", "I10"): k["stock"], ("Cuadro", "I11"): k["fte"], ("Cuadro", "F12"): k["ebitda_ytd_ppto"]}
    fallos = []
    for key, e in esperado.items():
        v = vals.get(key)
        if not isinstance(v, (int, float)) or abs(v - e) > (0.005 if abs(e) >= 1000 else 1e-6):
            fallos.append((key, v, e))
    for r in range(4, 18):
        v = vals.get(("Controles", f"G{r}"))
        if v is not None and v is not True:
            fallos.append((("Controles", f"G{r}"), v, True))
    for r in range(4, 15):
        v = vals.get(("Casos_prueba", f"G{r}"))
        if v is not None and v is not True:
            fallos.append((("Casos_prueba", f"G{r}"), v, vals.get(("Casos_prueba", f"F{r}"))))
    errores = [(c, v) for c, v in vals.items() if c[0] == "Cuadro" and isinstance(v, str) and v.startswith(("#", "Err"))]
    return fallos, errores


# ======================================================================================== textos
QUE_MIRAR = []
LEAME = []
COMO = []
MANUAL = []
DICCIONARIO = [
    ["Ventas netas", "Venta sin IVA, neta de devoluciones y del pronto pago (Ajustes); incluye portes.", "Σ ImporteNeto del mes; acumulado del año; var. % interanual; cumplimiento = ventas / presupuesto", "Ventas ERP (P5) + presupuesto 2026", "Javier Ortega", "Presupuesto", "Más es mejor", "Sí", "5.º día laborable"],
    ["Margen bruto %", "Lo que queda de cada euro vendido después del coste de la mercancía.", "Σ (ImporteNeto − Cantidad × CosteUnitario) / Σ ImporteNeto (nunca la media de porcentajes)", "Ventas ERP (P5)", "Javier Ortega", "28,0 %", "Más es mejor", "Sí", "5.º día laborable"],
    ["Cartera vencida > 60 días", "Parte del saldo de clientes vencida hace más de 60 días.", "Σ VencidoMas60 / Σ Pendiente, a fin de mes (foto: no se suma entre meses)", "Saldos de fin de mes (P3)", "Marta Ruiz", "≤ 10 %", "Menos es mejor", "Sí", "5.º día laborable; agosto 2026 sin dato"],
    ["PMC", "Días que tardan de media los clientes en pagar.", "Saldo de clientes / ventas con IVA de los 3 últimos meses × días de esos 3 meses (92 de agosto a octubre)", "Saldos (P3) + ventas (P5)", "Marta Ruiz", "≤ 70 días", "Menos es mejor", "Sí", "5.º día laborable"],
    ["Stock valorado y cobertura", "Dinero inmovilizado en el almacén y días de venta que cubre.", "Σ Unidades × CosteUnitario; cobertura = stock / (coste de ventas de los últimos 90 días / 90)", "Stock de fin de mes (P6)", "Andrés Molina", "≤ 60 días", "Menos es mejor", "No (almacén central)", "Desde mayo de 2026"],
    ["Plantilla y absentismo", "Personas equivalentes a jornada completa y peso de la incapacidad temporal.", "FTE al cierre; absentismo = Σ días de IT / Σ días teóricos", "Plantilla agregada (P2)", "Lucía Fernández", "≤ 4 %", "Menos es mejor", "Sí", "5.º día laborable; solo agregados"],
    ["EBITDA acumulado", "Resultado de explotación antes de amortizaciones, intereses e impuestos.", "Ventas − coste de ventas − personal − otros gastos de explotación, acumulado del año, frente al presupuesto acumulado de los mismos meses", "P&L mensual (P7)", "Marta Ruiz", "100 % del ppto", "Más es mejor", "No", "5.º día laborable"],
]
CALIDAD = []


def preparar_textos(vt, D):
    k11, k10 = vt["nov"], vt["oct"]
    es = lambda x, d=2: f"{x:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    ven_c0257 = D["saldos"][(D["saldos"].FinMes == P.fin_mes(2026, 11)) & (D["saldos"].CodCliente == "C0257")].VencidoMas60.sum()
    QUE_MIRAR[:] = [
        f"El margen se queda en el {es(k11['margen_mes_pct'], 1)} % en noviembre (meta: 28 %). Baja desde julio, cuando las ventas empezaron a llevar "
        f"su coste real, y es lo que más hunde el EBITDA: {es(k11['ebitda_cumpl_pct'], 1)} % del presupuesto acumulado.",
        f"La cartera vencida a más de 60 días sube al {es(k11['vencida_pct'], 1)} % del pendiente ({es(k10['vencida_pct'], 1)} % en octubre). "
        f"Un solo cliente (C0257) debe {es(ven_c0257, 0)} € de esa cifra: hay que decidir con Marta si se le corta el crédito.",
        f"Logroño vende {es(vt['ventas_nov_logrono'])} € en su primer mes. No tiene presupuesto ni año anterior (sale «sin dato») y parte de "
        "esas ventas eran antes de Zaragoza: el presupuesto de 2027 tiene que repartirse ya con Logroño.",
    ]
    LEAME[:] = [
        ("t", "Cuadro de mando de dirección · Electro Cierzo Suministros, S.L."),
        ("s", "Libro: P8_Cuadro_mando_2026-11_v03.xlsx · pedido por Carmen Soler (Dirección general) · preparado por Administración"),
        ("h", "Para qué sirve"),
        ("", "Una página con los 7 indicadores del mes para el comité de dirección, por delegación, con semáforo. Se actualiza cada mes sin rehacer nada."),
        ("h", "Fecha de corte y datos"),
        ("", "Meses cerrados hasta el 30/11/2026 (el dato de un mes se cierra el 5.º día laborable del mes siguiente)."),
        ("", "Fuentes (carpeta ..\\Fuentes): ventas_lineas_2025_2026.csv (ERP), presupuesto_ventas_2026.xlsx, saldos_clientes_fin_mes.csv,"),
        ("", "stock_fin_mes.csv, plantilla_fin_mes.csv (Windows-1252) y pyg_mensual.csv. Maestros: p8-datos.xlsx."),
        ("h", "Hojas"),
        ("", "Cuadro (la página) · Diccionario (los 7 indicadores pactados) · Parámetros (metas y umbrales, en amarillo) · Controles (control maestro)"),
        ("", "Casos_prueba (cada medida probada a mano) · Calidad_datos · Calc (series de los gráficos, no tocar) · Hechos, Coste_diario, Calendario y Alias"),
        ("", "(resultado de las consultas de Power Query) · Cifras_cuadre · Cómo se hizo · Manual (actualización en una página)."),
        ("h", "Colores"),
        ("", "Amarillo = se puede cambiar (selector de mes y delegación, metas). Gris = calculado. Verde/rojo en Controles = cuadra / no cuadra."),
        ("h", "Supuestos pactados"),
        ("", "1. Ventas = ImporteNeto sin IVA, con devoluciones, portes y pronto pago. 2. Margen con el CosteUnitario de cada línea (desde julio, el real)."),
        ("", "3. Saldos, stock y plantilla son fotos de fin de mes: se toma el último mes, nunca se suman. 4. Mes sin archivo = «sin dato», no 0."),
        ("", "5. Stock y EBITDA no se reparten por delegación. 6. Logroño (abre el 02/11/2026) no tiene presupuesto 2026 ni año anterior."),
        ("", "7. PMC con IVA al 21 % (todo el catálogo). 8. Semáforo: verde ≥ 100 % de la meta, ámbar 95-100 %, rojo < 95 %; invertido en PMC, cobertura,"),
        ("", "   cartera vencida y absentismo. 9. Sin datos de personas: la plantilla llega agregada y el NIF de clientes no entra en el modelo."),
        ("h", "Cómo actualizar (resumen; detalle en la hoja Manual)"),
        ("", "Copiar los CSV nuevos en ..\\Fuentes con el mismo nombre → Datos > Actualizar todo (Ctrl+Alt+F5) → Controles en verde → elegir el mes → PDF."),
        ("h", "Registro de cambios"),
        ("", "23/11/2026 · v01 · Diccionario y boceto aprobados por Carmen; consultas de las 6 fuentes · Analista"),
        ("", f"30/11/2026 · v02 · Cuadro con octubre; ventas de octubre anotadas para el control: {es(vt['control']['ventas_oct'])} € · Analista"),
        ("", "09/12/2026 · v03 · Cargado noviembre (Logroño en ventas, saldos y plantilla); octubre no cambia · Analista"),
        ("h", "Contacto"),
        ("", "Responsable: Analista de Administración. Suplente: Administración (Nuria Campos). Dudas de cada dato: su responsable en el Diccionario."),
    ]
    COMO[:] = [
        ("t", "Cómo se hizo (plan A con Power Pivot y plan B con fórmulas)"),
        ("s", "Este libro es el plan B (sin modelo de datos): se abre en Mac, iPad y navegador. El plan A se describe aquí paso a paso."),
        ("h", "1. Power Query: las 6 fuentes (Datos > De texto/CSV, y Datos > Obtener datos para el Excel)"),
        ("", "· Parámetro RutaFuentes (Inicio > Administrar parámetros) con la carpeta Fuentes: todas las consultas leen de ahí."),
        ("", "· Ventas: Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma; Cambiar tipo > Usar configuración regional > Español (España)"),
        ("", "  para Fecha, Cantidad, ImporteNeto y CosteUnitario. Combinar consultas con Alias (externa izquierda) y quedarse con Delegacion."),
        ("", "  Columna personalizada Coste = [Cantidad] * [CosteUnitario]. Cargar solo como conexión + modelo de datos (plan A) o agrupar (plan B)."),
        ("", "· Presupuesto: Quitar filas superiores (2), Usar la primera fila como encabezado, filtrar Delegación <> TOTAL, quitar «Total 2026»,"),
        ("", "  seleccionar Delegación y Familia > Anular dinamización de otras columnas, Mes = número del mes abreviado, FinMes = Date.EndOfMonth(#date(2026, Mes, 1))."),
        ("", "· Saldos y stock: UTF-8; CodArticulo como Texto ANTES de cambiar el resto de tipos (si no, 000144 → 144). CosteUnitario vacío → 0 (Sin ficha)."),
        ("", "· Plantilla: Origen del archivo 1252: Europeo occidental (Windows). Si sale «Almac�n», el origen está mal elegido."),
        ("", "· P&L: Real vacío = mes no cerrado (se deja null, no 0). Signo = 1 si Grupo = «Ventas», si no −1. EnEBITDA = 1 para Ventas, Coste de ventas,"),
        ("", "  Personal y Otros gastos de explotación."),
        ("", "· Plan B: Anexar consultas → una sola tabla Hechos (FinMes, Fuente, Indicador, Delegacion, Detalle, Grupo, EnEBITDA, Valor) agrupada por mes."),
        ("h", "2. Calendario (plan A: diario, sin huecos)"),
        ("c", "= let Inicio = #date(2025,1,1), Fin = #date(2026,12,31),\n  Fechas = List.Dates(Inicio, Duration.Days(Fin - Inicio) + 1, #duration(1,0,0,0)),\n  T = Table.FromList(Fechas, Splitter.SplitByNothing(), {\"Fecha\"}),\n  T1 = Table.TransformColumnTypes(T, {{\"Fecha\", type date}}),\n  T2 = Table.AddColumn(T1, \"FinDeMes\", each Date.EndOfMonth([Fecha]), type date),\n  T3 = Table.AddColumn(T2, \"AñoMes\", each Date.ToText([Fecha], \"yyyy-MM\"), type text)\nin T3"),
        ("", "Columnas: Fecha, Año, Mes, NombreMes, AñoMes, Trimestre, FinDeMes, EsMesCerrado. En Power Pivot, márcala como tabla de fechas."),
        ("h", "3. Modelo en estrella (Datos > Herramientas de datos > Relaciones / Administrar modelo de datos)"),
        ("", "Ventas[Fecha] → Calendario[Fecha]; Ventas → Clientes, Delegaciones y Familias. Ppto[FinMes] → Calendario[Fecha] (día del mes) y → Delegaciones y Familias."),
        ("", "Saldos, Stock y Plantilla[FinMes] → Calendario[Fecha]. El presupuesto NUNCA se relaciona con Ventas (otro grano). Sin relaciones de varios a varios."),
        ("h", "4. Medidas DAX (Power Pivot > Medidas > Nueva medida). Las funciones DAX van en inglés. Separador: prueba «;» y, si da error, «,»"),
        ("c", "Ventas := SUM(Ventas[ImporteNeto])\nMargen := SUMX(Ventas; Ventas[ImporteNeto] - Ventas[Cantidad] * Ventas[CosteUnitario])\nMargen % := DIVIDE([Margen]; [Ventas])\n"
              "Ventas AA := CALCULATE([Ventas]; SAMEPERIODLASTYEAR(Calendario[Fecha]))\nVar AA % := DIVIDE([Ventas] - [Ventas AA]; [Ventas AA])\n"
              "Ventas acum. := TOTALYTD([Ventas]; Calendario[Fecha])\nCumplimiento % := DIVIDE([Ventas]; SUM(Ppto[Importe]))\n"
              "Saldo clientes := CALCULATE(SUM(Saldos[Pendiente]); LASTDATE(Calendario[Fecha]))\n"
              "Vencido 60 := CALCULATE(SUM(Saldos[VencidoMas60]); LASTDATE(Calendario[Fecha]))\nVencida % := DIVIDE([Vencido 60]; [Saldo clientes])\n"
              "Stock valorado := CALCULATE(SUMX(Stock; Stock[Unidades] * Stock[CosteUnitario]); LASTDATE(Calendario[Fecha]))\n"
              "FTE := CALCULATE(SUM(Plantilla[FTE]); LASTDATE(Calendario[Fecha]))\nAbsentismo % := DIVIDE(SUM(Plantilla[DiasIT]); SUM(Plantilla[DiasTeoricos]))"),
        ("", "DIVIDE devuelve vacío si no hay denominador: así Logroño sale «sin dato» y no #¡DIV/0!. Las medidas «foto» usan LASTDATE: no suman meses."),
        ("h", "5. Cuadro"),
        ("", "Plan A: segmentaciones de Calendario[AñoMes] y Delegaciones[Delegacion] (Insertar > Filtros > Segmentación de datos) conectadas a todas las tablas"),
        ("", "dinámicas (Segmentación > Conexiones de informe). Tarjetas con VALORCUBO(\"ThisWorkbookDataModel\";\"[Measures].[Ventas]\";segmentaciones)."),
        ("", "La tarjeta de stock y la de EBITDA NO se conectan a la segmentación de delegación (no aplica)."),
        ("", "Plan B (este libro): selector de mes y delegación con validación de datos; cada tarjeta es un SUMAR.SI.CONJUNTO sobre Hechos con el criterio"),
        ("", "de delegación «*» cuando se elige «Todas». Las fotos (saldos, stock, plantilla) se piden con FinMes = Mes, nunca con un rango de meses."),
        ("", "Semáforo: SI.CONJUNTO sobre el cumplimiento con símbolo y texto (✓ En meta / ! Vigilar / ✗ Fuera de meta), además del color."),
        ("", "Minigráficos: Insertar > Minigráficos > Línea sobre las series de Calc. Títulos dinámicos: el título del gráfico apunta a una celda de Calc."),
        ("h", "6. Accesibilidad, protección y entrega"),
        ("", "Revisar > Accesibilidad > Comprobar accesibilidad: texto alternativo en los 4 gráficos, contraste, el semáforo no depende solo del color."),
        ("", "Revisar > Proteger hoja en Cuadro (sin contraseña; solo el mes y la delegación quedan desbloqueados). Inspeccionar documento antes de enviar."),
        ("", "PDF: Archivo > Exportar, en A4 apaisado y una página (Disposición de página > Ajustar área de impresión)."),
    ]
    MANUAL[:] = [
        ("t", "Manual de actualización (una página)"),
        ("s", "Para quien actualiza el cuadro cada mes (titular: Analista de Administración · suplente: Administración)."),
        ("h", "Cuándo"),
        ("", "El 5.º día laborable de cada mes, cuando Marta confirma que el mes está cerrado."),
        ("h", "Pasos"),
        ("", "1. Guarda una copia del libro con la versión siguiente (_v04, _v05…)."),
        ("", "2. Pide los archivos y déjalos en la carpeta Fuentes con EL MISMO NOMBRE (sustituye a los anteriores):"),
        ("", "   ventas_lineas_2025_2026.csv (Informática), saldos_clientes_fin_mes.csv (Marta), stock_fin_mes.csv (Andrés),"),
        ("", "   plantilla_fin_mes.csv (Lucía), pyg_mensual.csv (Marta). El presupuesto solo cambia una vez al año."),
        ("", "3. Datos > Actualizar todo (Ctrl+Alt+F5). Espera a que terminen todas las consultas."),
        ("", "4. Hoja Controles: el control maestro tiene que estar en verde. Si alguno sale en rojo, NO lo envíes: mira la tabla «Si algo falla»."),
        ("", "5. Cuadro: elige el mes nuevo en la celda amarilla y comprueba que las tarjetas cuadran con las cifras que te mandan los directores."),
        ("", "6. Escribe las 3 frases de «Qué hay que mirar este mes» (tú, no la IA) y anota la actualización en el registro de cambios del Léame."),
        ("", "7. Exporta el PDF (Archivo > Exportar) y súbelo con el libro a la carpeta de Dirección en SharePoint. Avisa a Carmen."),
        ("h", "Si algo falla"),
        ("", "· «Almac�n» o letras raras: el CSV de plantilla se ha importado como UTF-8 y es Windows-1252 (Origen del archivo 1252)."),
        ("", "· Una delegación nueva o un nombre distinto: añádelo a la tabla Alias y vuelve a actualizar."),
        ("", "· Un mes sin archivo: el cuadro dice «sin dato»; no pongas un 0 a mano. Avisa al responsable del dato."),
        ("", "· El control «Octubre no cambia» falla: alguien ha re-exportado meses cerrados con cambios. Pregunta a Informática antes de enviar."),
        ("", "· Ventas no cuadran con el ERP: comprueba que en Fuentes no hay copias de archivos (por ejemplo, «… - copia.csv»)."),
        ("", "· Cualquier otra cosa: contacta con la responsable del libro antes de enviar nada al comité."),
    ]
    A = P.cargar_limpio(P.FUENTES)
    va = A["ventas"]
    CALIDAD[:] = [
        ["ventas_lineas_2025_2026.csv", "Delegacion", "Q08", "«Lérida» hasta el 30/09/2025 y «Lleida» desde el 01/10/2025", vt["lineas_lerida"], "Tabla Alias: las dos son Lleida"],
        ["ventas_lineas_2025_2026.csv", "Delegacion", "Q08", "«Pamplona/Iruña» en ventas; «Pamplona» en las demás fuentes", vt["lineas_pamplona_iruna"], "Tabla Alias: Pamplona"],
        ["ventas (archivo de diciembre)", "Delegacion", "Q16", "«Logroño» desde el 02/11/2026: sin presupuesto ni año anterior", int((D["ventas"].Delegacion == "Logroño").sum()), "Alias + «sin dato» en interanual y cumplimiento"],
        ["presupuesto_ventas_2026.xlsx", "filas 1-2", "Q11", "Título y fila vacía antes del encabezado", 2, "Quitar filas superiores"],
        ["presupuesto_ventas_2026.xlsx", "Ene..Dic", "Q12", "Meses en columnas", 21, "Anular dinamización (21 filas × 12 meses = 252)"],
        ["presupuesto_ventas_2026.xlsx", "última fila", "Q10", "Fila TOTAL (contaría el presupuesto dos veces)", 1, "Filtrar Delegación <> TOTAL"],
        ["presupuesto_ventas_2026.xlsx", "grano", "Q18", "Delegación × familia × mes: otro grano que las ventas", 252, "Relación con dimensiones, nunca con Ventas"],
        ["saldos_clientes_fin_mes.csv", "FinMes", "Q22", "Falta el 31/08/2026 (agosto no se cerró)", 0, "«sin dato»; no se rellena con 0"],
        ["stock_fin_mes.csv", "FinMes", "Q22", "Empieza el 31/05/2026", 0, "«sin dato» antes de mayo; sin interanual"],
        ["stock_fin_mes.csv", "CodArticulo", "Q13", "Códigos con ceros a la izquierda (000144)", int(len(A["stock"])), "Tipo Texto antes de nada"],
        ["stock_fin_mes.csv", "CosteUnitario", "Q09", "Artículos «Sin ficha» con coste vacío", vt["sin_ficha"], "Valen 0 (como en P6); avisar a Andrés"],
        ["plantilla_fin_mes.csv", "todo", "Q19", "Codificación Windows-1252 (ANSI)", int(len(A["plantilla"])), "Origen del archivo 1252"],
        ["pyg_mensual.csv", "Real", "Q09", "Real vacío en noviembre y diciembre (meses no cerrados)", 30, "null, no 0"],
        ["pyg_mensual.csv", "Real/Ppto", "Q14", "Gastos en positivo; el signo lo da Grupo", 180, "Signo por Grupo"],
        ["p8-datos.xlsx / Clientes", "NIF", "Q20", "NIF de autónomos (DNI): dato personal que el cuadro no necesita", vt["nif_dni"], "Columna fuera del modelo"],
    ]
    assert len(va) == vt["lineas_base"]


def main():
    vt = P.json.load(open(P.VERDAD, encoding="utf-8"))
    D, H, CD = preparar()
    preparar_textos(vt, D)
    knov = P.kpis(D, P.fin_mes(2026, 11))
    tmp = tempfile.mkdtemp()
    modo = "estructurada"
    ruta1 = os.path.join(tmp, "p8-solucion.xlsx")
    formulas = construir(ruta1, D, H, CD, estructurada=True)
    vals = leer_valores(ruta1, formulas)
    fallos, errores = comprobar(vals, knov)
    if fallos or errores:
        print("LibreOffice con referencias estructuradas:", fallos[:5], errores[:5])
        modo = "rangos (solo para recalcular en LibreOffice)"
        formulas = construir(ruta1, D, H, CD, estructurada=False)
        vals = leer_valores(ruta1, formulas)
        fallos, errores = comprobar(vals, knov)
    print("Recalculado con LibreOffice usando", modo, "·", len(formulas), "fórmulas · fallos:", fallos, "· errores en Cuadro:", errores)
    assert not fallos and not errores
    construir(SALIDA, D, H, CD, cache=vals, estructurada=True)
    shutil.rmtree(tmp)
    wb = openpyxl.load_workbook(SALIDA)
    print("openpyxl abre p8-solucion.xlsx:", wb.sheetnames)
    print("Cuadro:", [(c, vals[("Cuadro", c)]) for c in ["B1", "B2", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "H6", "H7", "H8", "H9", "H10", "H11", "H12"]])
    print("Top5:", [vals[("Cuadro", f"H{r}")] for r in range(16, 21)], [vals[("Cuadro", f"K{r}")] for r in range(16, 21)])


if __name__ == "__main__":
    main()

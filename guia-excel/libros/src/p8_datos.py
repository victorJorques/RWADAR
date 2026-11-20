# -*- coding: utf-8 -*-
"""
P8 · Cuadro de mando de dirección (Dirección general) · DATOS DE PARTIDA
=========================================================================

Genera (semilla fija SEED, siempre igual):
  libros/p8-datos.xlsx        Instrucciones (1.ª hoja) + maestros (Delegaciones, Familias, Clientes),
                              Guion_entrevista, Diccionario_plantilla y Cifras_cuadre
                              (las cifras que da cada director para cuadrar).
  libros/p8-fuentes.zip       la carpeta compartida de Dirección:
      Cuadro_mando/Fuentes/ventas_lineas_2025_2026.csv   (Informática · ERP, ene-2025 a oct-2026)
      Cuadro_mando/Fuentes/presupuesto_ventas_2026.xlsx  (Dirección financiera)
      Cuadro_mando/Fuentes/saldos_clientes_fin_mes.csv   (Administración, ene-oct 2026)
      Cuadro_mando/Fuentes/stock_fin_mes.csv             (Almacén, may-oct 2026)
      Cuadro_mando/Fuentes/plantilla_fin_mes.csv         (RR. HH., ene-oct 2026, ya agregada)
      Cuadro_mando/Fuentes/pyg_mensual.csv               (Contabilidad, 2026: real ene-oct y ppto)
      Cuadro_mando/Llega_en_diciembre/…                  los 5 CSV exportados otra vez con noviembre
                                                         + LEEME_noviembre.txt (cifras de cuadre)
      Cuadro_mando/Maestros/p8-datos.xlsx                (este mismo libro)
      Cuadro_mando/Cuadro/LEEME.txt                      (vacía: aquí va el libro de la alumna)
  libros/p8-carpeta/          la misma carpeta descomprimida (para probar)
  libros/src/p8-log-suciedad.csv   cada problema sembrado (NO se entrega)
  libros/src/p8_verdad.json        totales de control calculados con pandas DESDE LOS ARCHIVOS
                                   entregados, aplicando la limpieza y las aclaraciones.

COHERENCIA CON LOS OTROS PROYECTOS (research/proyectos.md §2: «P8 integra de verdad lo anterior»)
- Ventas 2026 (ene-nov): son LAS MISMAS líneas de P5, leídas de libros/p5-carpeta y limpiadas con
  las reglas de P5 (se comprueba línea a línea contra p5_verdad.json: recuento e importe por mes).
  Coste de cada línea con la regla de P5: CosteUnitario de la línea desde julio; antes, CosteEstandar.
- Ventas 2025: generadas aquí a partir de plantillas de líneas de 2026, cuadrando AL CÉNTIMO con
  la hoja Ventas_2025_resumen de P5 (delegación × familia × mes); se añaden portes y pronto pago.
- Saldos a 31/10/2026: Σ Pendiente = pendiente de P3 (1.896.731,01 €) y Σ Vencido > 60 días =
  el de P3 (241.197,34 €), con los 10 clientes de más vencido, los 4 que superan el límite y los 2
  con saldo a favor de P3 con sus mismas cifras.
- Stock a 31/10/2026: los 180 artículos de P6 con su stock final (teórico corregido con el recuento)
  y su coste de ficha: Σ = 1.051.445,525 € (1.051.445,53 €), el valor de P6. A 30/04 se parte del inventario de P6.
- Plantilla: personas, contratos, calendarios y bajas de P2 agregados por departamento × delegación;
  días de IT y teóricos cuadran con P2 por departamento y mes (absentismo ene-oct = 6,35 %).
- P&L (pyg_mensual.csv): enero-octubre = el diario de P7 tal como quedó tras la reexportación del
  18/11 (p7-diario-2026-ene-oct-18nov.csv, con la factura de transporte de 9.800 € de octubre),
  agrupado por cuenta de 3 dígitos (700+708 → 70; la 62900099 de Logroño, dentro de la 629).
  Presupuesto = el de P7 por cuenta y mes (p7-datos.xlsx; Dirección en doceavas). Así el EBITDA
  real ene-oct es EL MISMO de P7 (Cifras_cuadre lo da como cifra de Marta). Noviembre (solo en
  Llega_en_diciembre): ventas y coste de las líneas; el resto, presupuesto de noviembre con ruido,
  gastos de Logroño de 6.500 €/mes (supuesto de P7), 2 comerciales de Logroño e intereses del
  préstamo de 85.000 € de P4 (cuota 20) más la póliza.

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5)
-----------------------------------------------------------------------
Q08  ventas: la delegación de Lleida se llama «Lérida» hasta el 30/09/2025 y «Lleida» desde el
     01/10/2025 (el ERP la renombró). Pamplona sale como «Pamplona/Iruña» en ventas y como
     «Pamplona» en presupuesto, saldos y plantilla → hace falta una tabla de alias.
Q16  ventas (archivo de diciembre): delegación nueva «Logroño» desde el 02/11/2026, sin
     presupuesto ni año anterior (cumplimiento e interanual «sin dato», no 0 ni error).
Q18  presupuesto: otro grano (delegación × familia × mes) → se relaciona con dimensiones, nunca
Q12  directamente con las ventas; además en formato ancho (meses en columnas),
Q11  con dos filas de título antes del encabezado
Q10  y una fila «TOTAL» al final que no hay que sumar.
Q22  saldos: falta agosto de 2026 (no se cerró). Debe verse «sin dato», nunca 0.
Q22  stock: empieza en mayo de 2026 (antes, «sin dato»; no hay interanual).
Q19  plantilla_fin_mes.csv exportado por el programa de RR. HH. en Windows-1252 (ANSI): abierto
     como UTF-8 salen «Almac�n», «Direcci�n», «Logro�o».
Q13  stock: CodArticulo con ceros a la izquierda («000144»): si se deja como número, se pierden.
Q09  stock: 3 artículos «Sin ficha» con CosteUnitario vacío (valen 0 hasta que tengan ficha, como
     en P6). pyg: Real vacío en noviembre y diciembre = mes no cerrado (no es 0).
Q14  pyg: los gastos vienen en positivo; el signo lo da la columna Grupo.
Q20  Clientes: la columna NIF lleva DNI de autónomos (dato personal que el cuadro no necesita).
—    Fotos de fin de mes (saldos, stock, plantilla): no se suman entre meses.

CAMBIO DE MES (Llega_en_diciembre): los 5 CSV re-exportados con noviembre. Octubre y anteriores
salen idénticos (control «al cargar noviembre, octubre no cambia»). Logroño aparece en ventas,
saldos y plantilla.
"""
import datetime as dt
import json
import os
import shutil
import zipfile

import numpy as np
import pandas as pd
import xlsxwriter

SEED = 20261123
AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
P5C = os.path.join(LIBROS, "p5-carpeta", "Ventas")
CARPETA = os.path.join(LIBROS, "p8-carpeta")
RAIZ = os.path.join(CARPETA, "Cuadro_mando")
FUENTES = os.path.join(RAIZ, "Fuentes")
DICIEMBRE = os.path.join(RAIZ, "Llega_en_diciembre")
XLSX = os.path.join(LIBROS, "p8-datos.xlsx")
ZIP = os.path.join(LIBROS, "p8-fuentes.zip")
LOG = os.path.join(AQUI, "p8-log-suciedad.csv")
VERDAD = os.path.join(AQUI, "p8_verdad.json")

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]
MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
FAM6 = ["Cable", "Iluminación", "Mecanismos", "Protección", "Canalización", "Herramienta"]
ALIAS_P5 = {"Zaragoza": "Zaragoza", "ZARAGOZA": "Zaragoza", "Zgz": "Zaragoza", "Pamplona/Iruña": "Pamplona",
            "Pamplona": "Pamplona", "Lleida": "Lleida", "Lérida": "Lleida", "Logroño": "Logroño"}
# Tabla de alias que tiene que construir la alumna (nombre que llega → delegación)
ALIAS = {"Zaragoza": "Zaragoza", "Pamplona/Iruña": "Pamplona", "Pamplona": "Pamplona", "Lérida": "Lleida",
         "Lleida": "Lleida", "Logroño": "Logroño"}
IVA = 0.21
FEST25 = {dt.date(2025, 1, 1), dt.date(2025, 1, 6), dt.date(2025, 4, 17), dt.date(2025, 4, 18),
          dt.date(2025, 5, 1), dt.date(2025, 8, 15), dt.date(2025, 12, 8), dt.date(2025, 12, 25)}
FEST26 = {dt.date(2026, 1, 1), dt.date(2026, 1, 6), dt.date(2026, 4, 2), dt.date(2026, 4, 3),
          dt.date(2026, 5, 1), dt.date(2026, 10, 12), dt.date(2026, 12, 8), dt.date(2026, 12, 25)}
# Presupuesto de P7 (mismas cifras y reparto)
W_VENTAS = [0.075, 0.078, 0.088, 0.086, 0.090, 0.092, 0.084, 0.058, 0.088, 0.092, 0.088, 0.081]
W_PUB = [0.065] * 12
W_PUB[2], W_PUB[9] = 0.15, 0.20
W_SUM = [0.105, 0.095, 0.085, 0.075, 0.07, 0.075, 0.085, 0.08, 0.07, 0.075, 0.09, 0.095]


def fin_mes(a, m):
    return (pd.Timestamp(a, m, 1) + pd.offsets.MonthEnd(0)).normalize()


def laborables(a, m, fest):
    d, out = dt.date(a, m, 1), []
    while d.month == m:
        if d.weekday() < 5 and d not in fest:
            out.append(d)
        d += dt.timedelta(1)
    return out


def reparto_entero(total, pesos):
    pesos = np.asarray(pesos, float) / np.sum(pesos)
    v = [int(round(total * p)) for p in pesos]
    v[-1] += int(round(total - sum(v)))
    return v


def doce(total):
    return reparto_entero(total, [1] * 12)


def a_centimos(valores, total):
    """Redondea a céntimos y deja la suma exacta (el residuo, en el valor más grande)."""
    c = np.round(np.asarray(valores, float) * 100).astype(np.int64)
    c[int(np.argmax(np.abs(c)))] += int(round(total * 100)) - int(c.sum())
    return c / 100


def num(x, d=2):
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return ""
    return f"{x:.{d}f}".replace(".", ",")


def numg(x):
    s = f"{x:.3f}".rstrip("0").rstrip(".")
    return s.replace(".", ",")


def csv(df, ruta, encoding="utf-8-sig"):
    df.to_csv(ruta, sep=";", index=False, encoding=encoding, lineterminator="\r\n")


# =====================================================================================
# 1. VENTAS 2026: las líneas de P5, limpiadas con las reglas de P5
# =====================================================================================
def leer_p5():
    p5v = json.load(open(os.path.join(AQUI, "p5_verdad.json"), encoding="utf-8"))
    prods = pd.read_excel(os.path.join(LIBROS, "p5-datos.xlsx"), sheet_name="Productos", dtype={"CodProducto": str})
    altas = pd.read_excel(os.path.join(P5C, "Llega_en_diciembre", "altas_diciembre.xlsx"),
                          sheet_name="Productos_nuevos", dtype={"CodProducto": str})
    prods = pd.concat([prods, altas], ignore_index=True)
    fam = dict(zip(prods.CodProducto, prods.Familia))
    cst = dict(zip(prods.CodProducto, prods.CosteEstandar))
    partes = []
    for m in range(1, 12):
        ruta = (os.path.join(P5C, "ERP", f"ventas_2026_{m:02d}.csv") if m <= 10
                else os.path.join(P5C, "Llega_en_diciembre", "ventas_2026_11.csv"))
        if m == 3:   # Q19 de P5: configuración de EE. UU.
            df = pd.read_csv(ruta, sep=",", dtype=str, encoding="utf-8-sig", keep_default_na=False)
            dec, fmt = ".", "%m/%d/%Y"
        else:
            df = pd.read_csv(ruta, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False,
                             skiprows=1 if m == 5 else 0)
            dec, fmt = ",", "%d/%m/%Y"
        df = df.rename(columns={"Importe Neto": "ImporteNeto"})
        if "CosteUnitario" not in df:
            df["CosteUnitario"] = ""
        for c in ["Cantidad", "ImporteNeto", "CosteUnitario"]:
            s = df[c].str.strip()
            if dec == ",":
                s = s.str.replace(",", ".", regex=False)
            df[c] = pd.to_numeric(s.replace("", np.nan))
        df["Fecha"] = pd.to_datetime(df["Fecha"].str.strip(), format=fmt)
        df["CodProducto"] = df["CodProducto"].str.strip().str.zfill(6)
        df["Delegacion"] = df["Delegacion"].str.strip().map(ALIAS_P5)
        assert df.Delegacion.notna().all(), m
        ref = p5v["por_mes"].get(str(m)) if m <= 10 else [p5v["noviembre"]["lineas"], p5v["noviembre"]["ventas"]]
        assert len(df) == ref[0] and abs(df.ImporteNeto.sum() - ref[1]) < 0.005, (m, len(df), df.ImporteNeto.sum(), ref)
        partes.append(df[["Fecha", "NumFactura", "CodCliente", "CodProducto", "Cantidad", "ImporteNeto",
                          "CosteUnitario", "Delegacion", "CodComercial"]])
    v = pd.concat(partes, ignore_index=True)
    v["CosteUnitario"] = v.CosteUnitario.fillna(v.CodProducto.map(cst)).fillna(0.0)
    v["Familia"] = v.CodProducto.map(fam)
    assert v.Familia.notna().all()
    assert abs(v[(v.Fecha.dt.month == 11) & (v.Delegacion == "Logroño")].ImporteNeto.sum() - p5v["noviembre"]["logrono"]) < 0.005
    e_o = v[v.Fecha.dt.month <= 10]
    margen = (e_o.ImporteNeto - e_o.Cantidad * e_o.CosteUnitario).sum()
    assert abs(margen - p5v["margen_total"]) < 1, margen
    return v, set(altas.CodProducto)


# =====================================================================================
# 2. VENTAS 2025: plantillas de 2026 que cuadran al céntimo con Ventas_2025_resumen de P5
# =====================================================================================
def generar_2025(v26, nuevos, rng):
    res = pd.read_excel(os.path.join(LIBROS, "p5-datos.xlsx"), sheet_name="Ventas_2025_resumen")
    res["Delegacion"] = res.Delegacion.replace({"Lérida": "Lleida"})
    base = v26[v26.Fecha < "2026-11-01"]
    pl = base[base.Familia.isin(FAM6) & ~base.CodProducto.isin(nuevos)].copy()
    pl["ratio"] = pl.CosteUnitario * pl.Cantidad / pl.ImporteNeto
    pl = pl[np.isfinite(pl.ratio) & (pl.ratio > 0) & (pl.ratio < 1.2)]
    com = base[base.Fecha < "2026-05-01"].groupby("CodCliente").CodComercial.agg(lambda s: s.value_counts().index[0])
    com_all = base.groupby("CodCliente").CodComercial.agg(lambda s: s.value_counts().index[0])
    filas = []
    for _, r in res.iterrows():
        for m in range(1, 13):
            T = float(r[MESES_ABR[m - 1]])
            pool = pl[(pl.Delegacion == r.Delegacion) & (pl.Familia == r.Familia)]
            n = max(3, int(round(T / pool.ImporteNeto.mean())))
            t = pool.iloc[rng.integers(0, len(pool), n)]
            b = t.ImporteNeto.values * 0.97 * rng.lognormal(0, 0.08, n)
            imp = a_centimos(b * T / b.sum(), T)
            coste = np.round(imp / t.Cantidad.values * t.ratio.values * 0.99 * rng.lognormal(0, 0.02, n), 4)
            dias = laborables(2025, m, FEST25)
            for i in range(n):
                filas.append((dias[rng.integers(0, len(dias))], t.CodCliente.values[i], t.CodProducto.values[i],
                              r.Familia, t.Cantidad.values[i], imp[i], coste[i], r.Delegacion))
    # portes y pronto pago de 2025 (no están en el resumen de P5, que es de 6 familias)
    tot25 = res.groupby("Delegacion")[MESES_ABR].sum()
    for fam_esp, factor in [("Portes y servicios", 0.95), ("Ajustes", 0.97)]:
        for d in ["Zaragoza", "Pamplona", "Lleida"]:
            pool = base[(base.Familia == fam_esp) & (base.Delegacion == d)]
            n_mes = len(pool) / 10
            for m in range(1, 13):
                k = tot25.loc[d, MESES_ABR[m - 1]] / tot25.loc[d].mean()
                n = max(1, int(round(n_mes * factor * k)))
                t = pool.iloc[rng.integers(0, len(pool), n)]
                imp = t.ImporteNeto.values if fam_esp == "Portes y servicios" else np.round(
                    t.ImporteNeto.values * factor * rng.lognormal(0, 0.1, n), 2)
                dias = laborables(2025, m, FEST25)
                for i in range(n):
                    filas.append((dias[rng.integers(0, len(dias))], t.CodCliente.values[i], t.CodProducto.values[i],
                                  fam_esp, t.Cantidad.values[i], float(imp[i]), float(t.CosteUnitario.values[i]), d))
    v25 = pd.DataFrame(filas, columns=["Fecha", "CodCliente", "CodProducto", "Familia", "Cantidad", "ImporteNeto",
                                       "CosteUnitario", "Delegacion"])
    v25["Fecha"] = pd.to_datetime(v25.Fecha)
    v25["CodComercial"] = v25.CodCliente.map(com).fillna(v25.CodCliente.map(com_all))
    v25 = v25.sort_values(["Fecha", "CodCliente", "CodProducto"]).reset_index(drop=True)
    v25["NumFactura"] = ["F25-%06d" % (i + 1) for i in v25.groupby(["Fecha", "CodCliente"], sort=False).ngroup()]
    chk = v25[v25.Familia.isin(FAM6)].groupby(["Delegacion", "Familia", v25.Fecha.dt.month]).ImporteNeto.sum()
    for _, r in res.iterrows():
        for m in range(1, 13):
            assert abs(chk[(r.Delegacion, r.Familia, m)] - r[MESES_ABR[m - 1]]) < 0.005
    return v25


def texto_delegacion_erp(df):
    t = df.Delegacion.map({"Zaragoza": "Zaragoza", "Pamplona": "Pamplona/Iruña", "Lleida": "Lleida", "Logroño": "Logroño"})
    t[(df.Delegacion == "Lleida") & (df.Fecha < "2025-10-01")] = "Lérida"
    return t


def csv_ventas(v, ruta):
    out = pd.DataFrame({
        "Fecha": v.Fecha.dt.strftime("%d/%m/%Y"), "NumFactura": v.NumFactura, "CodCliente": v.CodCliente,
        "CodProducto": v.CodProducto, "Familia": v.Familia, "Cantidad": v.Cantidad.map(numg),
        "ImporteNeto": v.ImporteNeto.map(num), "CosteUnitario": v.CosteUnitario.map(lambda x: num(x, 4)),
        "Delegacion": texto_delegacion_erp(v), "CodComercial": v.CodComercial})
    csv(out, ruta)


# =====================================================================================
# 3. SALDOS DE CLIENTES (fotos de fin de mes) · cuadran con P3 a 31/10/2026
# =====================================================================================
def generar_saldos(v, clientes, rng):
    p3 = json.load(open(os.path.join(AQUI, "p3_verdad.json"), encoding="utf-8"))
    deleg_cli = dict(zip(clientes.CodCliente, clientes.Delegacion))
    v = v.copy()
    v["FinMes"] = v.Fecha + pd.offsets.MonthEnd(0)
    S = v.groupby(["CodCliente", "FinMes"]).ImporteNeto.sum().unstack(fill_value=0.0)
    cods = list(S.index)
    u = dict(zip(cods, rng.lognormal(0, 0.25, len(cods))))
    meses = [fin_mes(2026, m) for m in range(1, 12)]

    def raw(c, fm):
        s0 = S.loc[c].get(fm, 0.0)
        s1 = S.loc[c].get(fin_mes((fm - pd.offsets.MonthEnd(1)).year, (fm - pd.offsets.MonthEnd(1)).month), 0.0)
        f2 = fm - pd.offsets.MonthEnd(2)
        s2 = S.loc[c].get(fin_mes(f2.year, f2.month), 0.0)
        return max(0.0, (1 + IVA) * (0.97 * s0 + 0.62 * s1 + 0.08 * s2) * u[c])

    R = {(c, fm): raw(c, fm) for c in cods for fm in meses}
    octb = fin_mes(2026, 10)
    V10 = {c: a for c, _, a in p3["top10_mas60"]}
    resto = round(p3["vencido_mas60"] - sum(V10.values()), 2)
    fijosP = {c: p for c, _, p, _, _ in p3["supera_limite"]}
    favor = {c: s for c, _, s in p3["saldo_favor"]}
    candidatos = [c for c in cods if c not in V10 and c not in favor and R[(c, octb)] > 3000]
    otros = list(rng.choice(candidatos, 26, replace=False))
    w = rng.lognormal(0, 0.8, len(otros))
    Voct = dict(V10)
    Voct.update(dict(zip(otros, a_centimos(w / w.sum() * resto, resto))))
    inicio = {c: int(rng.integers(3, 9)) for c in Voct}
    inicio["C0257"] = 5
    Vm = {}
    for c, vo in Voct.items():
        for fm in meses:
            m = fm.month
            if m == 10:
                Vm[(c, fm)] = vo
            elif m == 11:
                Vm[(c, fm)] = round(vo * (1.08 if c == "C0257" else rng.uniform(0.85, 1.15)), 2)
            else:
                f = np.clip((m - inicio[c] + 1) / (10 - inicio[c] + 1), 0, 1)
                Vm[(c, fm)] = round(vo * f * rng.uniform(0.95, 1.05), 2) if f > 0 else 0.0
    # Pendiente = k × raw + vencido; k se fija para que el 31/10 cuadre con P3
    libres = [c for c in cods if c not in fijosP and c not in favor]
    objetivo = p3["pendiente_total"] - sum(fijosP.values()) - sum(favor.values())
    k = (objetivo - sum(Vm.get((c, octb), 0.0) for c in libres)) / sum(R[(c, octb)] for c in libres)
    filas = []
    for fm in meses:
        vals = {}
        for c in cods:
            if fm == octb and c in fijosP:
                vals[c] = fijosP[c]
            elif fm == octb and c in favor:
                vals[c] = favor[c]
            else:
                vals[c] = round(k * R[(c, fm)] + Vm.get((c, fm), 0.0), 2)
        if fm == octb:
            libre_max = max(libres, key=lambda c: vals[c])
            vals[libre_max] = round(vals[libre_max] + p3["pendiente_total"] - sum(vals.values()), 2)
        for c in cods:
            p = vals[c]
            if abs(p) < 0.005:
                continue
            ven = 0.0 if (fm == octb and c in favor) else min(Vm.get((c, fm), 0.0), max(p, 0.0))
            filas.append((fm, c, p, ven))
    sal = pd.DataFrame(filas, columns=["FinMes", "CodCliente", "Pendiente", "VencidoMas60"])
    logrono = set(v[(v.Delegacion == "Logroño")].CodCliente)
    sal["Delegacion"] = sal.CodCliente.map(deleg_cli)
    sal.loc[(sal.FinMes == fin_mes(2026, 11)) & sal.CodCliente.isin(logrono), "Delegacion"] = "Logroño"
    o = sal[sal.FinMes == octb]
    assert abs(o.Pendiente.sum() - p3["pendiente_total"]) < 0.005, o.Pendiente.sum()
    assert abs(o.VencidoMas60.sum() - p3["vencido_mas60"]) < 0.005, o.VencidoMas60.sum()
    return sal[["FinMes", "CodCliente", "Delegacion", "Pendiente", "VencidoMas60"]]


# =====================================================================================
# 4. STOCK (fotos de fin de mes, may-nov) · 31/10 = P6
# =====================================================================================
def generar_stock(rng):
    v6 = json.load(open(os.path.join(AQUI, "p6-verdad.json"), encoding="utf-8"))
    c6 = json.load(open(os.path.join(AQUI, "p6-controles.json"), encoding="utf-8"))
    fichas = pd.read_excel(os.path.join(LIBROS, "p6-datos.xlsx"), sheet_name="Fichas", dtype={"CodArticulo": str})
    inv = pd.read_excel(os.path.join(LIBROS, "p6-datos.xlsx"), sheet_name="Inventario_30-04", dtype={"CodArticulo": str})
    inv = inv.drop_duplicates("CodArticulo").set_index("CodArticulo")
    coste = dict(zip(fichas.CodArticulo, fichas.CosteUnitario))
    fin = dict(v6["stock_fin_teorico"])
    fin.update(v6["recuento"])
    valor = sum(q * coste.get(c, 0.0) for c, q in fin.items())
    assert abs(valor - c6["valor_stock"]) < 0.005, valor
    cons = v6["consumo"]
    val = sorted(((cons[c] * coste[c], c) for c in fin if c in coste), reverse=True)
    tot, acum, clase = sum(x for x, _ in val), 0.0, {}
    for x, c in val:
        acum += x
        clase[c] = "A" if acum / tot <= 0.80 else ("B" if acum / tot <= 0.95 else "C")
    for c in fin:
        clase.setdefault(c, "Sin ficha")
    inv0 = v6["inv0"]
    filas = []
    for m in range(5, 12):
        fm = fin_mes(2026, m)
        for c in sorted(fin):
            uni = str(inv["Unidad"].get(c, "ud")) if c in inv.index else "ud"
            if m == 10:
                q = fin[c]
            else:
                base = fin[c] if m == 11 else inv0.get(c, fin[c]) + (fin[c] - inv0.get(c, fin[c])) * (m - 4) / 6
                q = max(0.0, base + rng.normal(0, 0.15) * cons.get(c, 0) / 12)
                q = round(q * 2) / 2 if uni == "m" else float(round(q))
            desc = inv["Descripción"].get(c) if c in inv.index else None
            filas.append((fm, c, desc if isinstance(desc, str) else f"Artículo {c}", clase[c], uni, q, coste.get(c)))
    st = pd.DataFrame(filas, columns=["FinMes", "CodArticulo", "Descripcion", "ClaseABC", "Unidad", "Unidades", "CosteUnitario"])
    return st, {k: sum(1 for x in clase.values() if x == k) for k in ["A", "B", "C", "Sin ficha"]}


# =====================================================================================
# 5. PLANTILLA (agregada, sin personas) · cuadra con P2
# =====================================================================================
AJUSTES = []


def generar_plantilla(rng):
    p2 = json.load(open(os.path.join(AQUI, "p2_verdad.json"), encoding="utf-8"))
    per = {p["cod"]: p for p in p2["personas"]}
    region = {"Zaragoza": "Aragón", "Pamplona": "Navarra", "Lleida": "Cataluña"}
    fest = {d: {dt.date.fromisoformat(f[0]) for f in p2["festivos"] if f[2] in ("Nacional", region[d], "Local " + d)}
            for d in region}
    contratos = {}
    for c in p2["contratos"]:
        contratos.setdefault(c["cod"], []).append(c)

    def activo(cod, dia):
        for c in contratos.get(cod, []):
            if dt.date.fromisoformat(c["alta"]) <= dia and (c["baja"] is None or dt.date.fromisoformat(c["baja"]) >= dia):
                return c["jornada"]
        return None

    it = [a for a in p2["ausencias"] if a["tipo"].startswith("IT")]
    filas = []
    for m in range(1, 12):
        fm = fin_mes(2026, m).date()
        agg = {}
        for cod, p in per.items():
            key = (p["dept"], p["deleg"])
            a = agg.setdefault(key, [0, 0.0, 0, 0])
            dias = [d for d in laborables(2026, m, fest[p["deleg"]]) if activo(cod, d) is not None]
            a[3] += len(dias)
            dset = set(dias)
            for x in it:
                if x["cod"] == cod:
                    d0 = dt.date.fromisoformat(x["desde"])
                    d1 = dt.date.fromisoformat(x["hasta"]) if x["hasta"] else dt.date(2026, 12, 31)   # IT abierta
                    a[2] += sum(1 for d in dset if d0 <= d <= d1)
            j = activo(cod, fm)
            if j is not None:
                a[0] += 1
                a[1] += j
        if m <= 10:   # cuadre exacto con P2 por departamento y mes (reparto por delegación)
            for dep in sorted({k[0] for k in agg}):
                for idx, clave in [(2, "it_mes"), (3, "teo_mes")]:
                    objetivo = p2[clave][f"{dep}|{m}"]
                    ks = [k for k in agg if k[0] == dep]
                    dif = objetivo - sum(agg[k][idx] for k in ks)
                    if dif:
                        AJUSTES.append((dep, m, clave, dif))
                        kmax = max(ks, key=lambda k: agg[k][3])
                        agg[kmax][idx] += dif
                        assert agg[kmax][idx] >= 0
        else:         # noviembre: IT simulada y apertura de Logroño (2 comerciales desde el 02/11)
            for k in agg:
                agg[k][2] = int(round(agg[k][3] * rng.uniform(0.02, 0.07)))
            nov = [d for d in laborables(2026, 11, FEST26) if d >= dt.date(2026, 11, 2)]
            agg[("Comercial", "Logroño")] = [2, 2.0, 0, 2 * len(nov)]
        for (dep, de), a in sorted(agg.items()):
            filas.append((fin_mes(2026, m), dep, de, a[0], round(a[1], 2), a[2], a[3]))
    pl = pd.DataFrame(filas, columns=["FinMes", "Departamento", "Delegacion", "Activos", "FTE", "DiasIT", "DiasTeoricos"])
    e_o = pl[pl.FinMes.dt.month <= 10]
    assert e_o.DiasIT.sum() == p2["controles"]["it_dias"] and e_o.DiasTeoricos.sum() == p2["controles"]["teorico"]
    return pl


# =====================================================================================
# 6. PRESUPUESTO DE VENTAS 2026 (P7) y P&L MENSUAL
# =====================================================================================
def presupuesto(v25, v26):
    v700 = reparto_entero(9669600, W_VENTAS)
    v708 = reparto_entero(-189600, W_VENTAS)
    neto = [a + b for a, b in zip(v700, v708)]
    crec = {"Zaragoza": 1.05, "Pamplona": 1.09, "Lleida": 1.12}
    fams = FAM6 + ["Portes y servicios"]
    s25 = v25.groupby(["Delegacion", "Familia", v25.Fecha.dt.month]).ImporteNeto.sum()
    filas = []
    for m in range(1, 13):
        pesos = {(d, f): max(s25.get((d, f, m), 0.0), 0.0) * crec[d] for d in crec for f in fams}
        tot = sum(pesos.values())
        vals = {k: round(neto[m - 1] * w / tot, -2) for k, w in pesos.items()}
        kmax = max(vals, key=vals.get)
        vals[kmax] += neto[m - 1] - sum(vals.values())
        for (d, f), x in vals.items():
            filas.append((d, f, m, int(x)))
    pp = pd.DataFrame(filas, columns=["Delegacion", "Familia", "Mes", "Importe"])
    assert pp.Importe.sum() == 9480000
    return pp, neto


def datos_p7():
    """Real (diario de P7 reexportado el 18/11) y presupuesto de P7, por cuenta de 3 dígitos y mes."""
    import openpyxl
    d = pd.read_csv(os.path.join(LIBROS, "p7-diario-2026-ene-oct-18nov.csv"), sep=";", decimal=",",
                    dtype={"Cuenta": str}, encoding="utf-8-sig")
    d["c3"] = d.Cuenta.str[:3]
    d["m"] = pd.to_datetime(d.Fecha, format="%d/%m/%Y").dt.month
    d["imp"] = np.where(d.c3.str.startswith("7"), d.Haber - d.Debe, d.Debe - d.Haber)
    real = d.groupby(["c3", "m"]).imp.sum()
    val = lambda v: float(v.replace(".", "").replace(",", ".")) if isinstance(v, str) else float(v)
    wb = openpyxl.load_workbook(os.path.join(LIBROS, "p7-datos.xlsx"), data_only=True)
    ppto = {}
    for hoja in ["Ingresos", "Comercial", "Almacén y logística", "Administración", "Dirección"]:
        filas = list(wb[hoja].iter_rows(values_only=True))
        i0 = next(i for i, r in enumerate(filas) if r[0] == "Cuenta")
        for r in filas[i0 + 1:]:
            if not isinstance(r[0], (int, float)):
                continue
            meses = [val(r[2]) / 12] * 12 if hoja == "Dirección" else [val(x) for x in r[2:14]]
            acc = ppto.setdefault(str(int(r[0])), [0.0] * 12)
            for k in range(12):
                acc[k] += meses[k]
    return real, ppto


def pyg(v26, neto, rng):
    """P&L mensual: enero-octubre, el real y el presupuesto de P7 (mismas cifras); noviembre, simulado."""
    real_p7, ppto_p7 = datos_p7()
    filas_pyg = [
        ("70", "Ventas netas", "Ventas", ["700", "708"]),
        ("60", "Coste de ventas", "Coste de ventas", ["600"]),
        ("640", "Sueldos y salarios", "Personal", ["640"]),
        ("642", "Seguridad Social a cargo de la empresa", "Personal", ["642"]),
        ("621", "Arrendamientos y cánones", "Otros gastos de explotación", ["621"]),
        ("622", "Reparaciones y conservación", "Otros gastos de explotación", ["622"]),
        ("623", "Servicios de profesionales independientes", "Otros gastos de explotación", ["623"]),
        ("624", "Transportes", "Otros gastos de explotación", ["624"]),
        ("625", "Primas de seguros", "Otros gastos de explotación", ["625"]),
        ("626", "Servicios bancarios", "Otros gastos de explotación", ["626"]),
        ("627", "Publicidad y ferias", "Otros gastos de explotación", ["627"]),
        ("628", "Suministros", "Otros gastos de explotación", ["628"]),
        ("629", "Otros servicios", "Otros gastos de explotación", ["629"]),
        ("681", "Amortización del inmovilizado", "Amortización", ["681"]),
        ("662", "Intereses de deudas", "Gastos financieros", ["662"]),
    ]
    ppto = {}
    for cta, _, _, c3s in filas_pyg:
        mens = np.sum([ppto_p7.get(c, [0.0] * 12) for c in c3s], axis=0)
        anual = round(float(mens.sum()), 2)
        mr = [round(float(x), 2) for x in mens]
        mr[-1] = round(mr[-1] + anual - sum(mr), 2)
        ppto[cta] = mr
    assert abs(sum(ppto["70"]) - 9480000) < 0.01 and abs(sum(sum(ppto[c]) for c in ppto if c != "70") - 9173000) < 0.05
    v = v26.copy()
    v["m"] = v.Fecha.dt.month
    ventas = v.groupby("m").ImporteNeto.sum()
    coste = (v.Cantidad * v.CosteUnitario).groupby(v.m).sum()
    # préstamo de P4: 85.000 € al 5 %, 48 cuotas; la cuota 10 es la de enero de 2026 (noviembre = cuota 20)
    r = 0.05 / 12
    cuota = 85000 * r / (1 - (1 + r) ** -48)
    saldo, interes = 85000.0, {}
    for k in range(1, 49):
        i = saldo * r
        saldo -= cuota - i
        if 10 <= k <= 20:
            interes[k - 9] = i
    real = {}
    for m in range(1, 11):
        real[m] = {cta: float(sum(real_p7.get((c, m), 0.0) for c in c3s)) for cta, _, _, c3s in filas_pyg}
        assert abs(real[m]["70"] - ventas[m]) < 0.01, ("ventas P7 ≠ P5", m)
    assert abs(sum(real[m]["60"] for m in real) - coste[coste.index <= 10].sum()) < 0.01
    # noviembre (solo en Llega_en_diciembre): presupuesto de noviembre con ruido + Logroño
    pers = 1 + rng.normal(0.012, 0.006)
    real[11] = {cta: ppto[cta][10] * (1 + rng.normal(0, 0.03)) for cta, _, _, _ in filas_pyg}
    real[11].update({
        "70": ventas[11], "60": coste[11],
        "640": ppto["640"][10] * pers + 5200, "642": ppto["642"][10] * pers + 5200 * 0.315,
        "625": 0.0, "681": 0.0,
        "629": ppto["629"][10] * (1 + rng.normal(0, 0.08)) + 6500,
        "662": interes[11] + 3100 * (1 + rng.normal(0, 0.06)),
    })
    filas = []
    for cta, partida, grupo, _ in filas_pyg:
        for m in range(1, 13):
            filas.append((2026, m, cta, partida, grupo, round(real[m][cta], 2) if m in real else np.nan, float(ppto[cta][m - 1])))
    return pd.DataFrame(filas, columns=["Ejercicio", "Mes", "Cuenta", "Partida", "Grupo", "Real", "Ppto"])


# =====================================================================================
# 7. CARGA LIMPIA (lo que haría Power Query) · la usan los controles y p8_solucion.py
# =====================================================================================
def leer_num(s):
    return pd.to_numeric(s.astype(str).str.strip().str.replace(",", ".", regex=False).replace({"": np.nan, "nan": np.nan}))


def cargar_limpio(carpeta):
    """Lee los archivos de una carpeta (Fuentes o Llega_en_diciembre) y aplica la limpieza pactada."""
    ppto_ruta = os.path.join(FUENTES, "presupuesto_ventas_2026.xlsx")
    v = pd.read_csv(os.path.join(carpeta, "ventas_lineas_2025_2026.csv"), sep=";", dtype=str, encoding="utf-8")
    v.columns = [c.lstrip("\ufeff") for c in v.columns]
    v["Fecha"] = pd.to_datetime(v.Fecha, format="%d/%m/%Y")
    for c in ["Cantidad", "ImporteNeto", "CosteUnitario"]:
        v[c] = leer_num(v[c])
    v["Delegacion"] = v.Delegacion.map(ALIAS)
    assert v.Delegacion.notna().all()
    v["Coste"] = v.Cantidad * v.CosteUnitario
    v["FinMes"] = v.Fecha + pd.offsets.MonthEnd(0)
    p = pd.read_excel(ppto_ruta, sheet_name="Ppto ventas 2026", skiprows=2)
    p = p[p["Delegación"].ne("TOTAL")].melt(id_vars=["Delegación", "Familia"], value_vars=MESES_ABR,
                                             var_name="MesAbr", value_name="Importe")
    p["FinMes"] = [fin_mes(2026, MESES_ABR.index(x) + 1) for x in p.MesAbr]
    p["Delegacion"] = p["Delegación"].map(ALIAS)
    s = pd.read_csv(os.path.join(carpeta, "saldos_clientes_fin_mes.csv"), sep=";", dtype=str, encoding="utf-8-sig")
    s["FinMes"] = pd.to_datetime(s.FinMes, format="%d/%m/%Y")
    for c in ["Pendiente", "VencidoMas60"]:
        s[c] = leer_num(s[c])
    st = pd.read_csv(os.path.join(carpeta, "stock_fin_mes.csv"), sep=";", dtype=str, encoding="utf-8-sig")
    st["FinMes"] = pd.to_datetime(st.FinMes, format="%d/%m/%Y")
    st["Unidades"] = leer_num(st.Unidades)
    st["CosteUnitario"] = leer_num(st.CosteUnitario).fillna(0.0)   # «Sin ficha» = 0, como en P6
    st["Valor"] = st.Unidades * st.CosteUnitario
    pl = pd.read_csv(os.path.join(carpeta, "plantilla_fin_mes.csv"), sep=";", dtype=str, encoding="cp1252")
    pl["FinMes"] = pd.to_datetime(pl.FinMes, format="%d/%m/%Y")
    for c in ["Activos", "FTE", "DiasIT", "DiasTeoricos"]:
        pl[c] = leer_num(pl[c])
    g = pd.read_csv(os.path.join(carpeta, "pyg_mensual.csv"), sep=";", dtype=str, encoding="utf-8-sig")
    for c in ["Real", "Ppto"]:
        g[c] = leer_num(g[c])
    g["FinMes"] = [fin_mes(int(a), int(m)) for a, m in zip(g.Ejercicio, g.Mes)]
    g["Signo"] = np.where(g.Grupo.eq("Ventas"), 1, -1)
    g["EnEBITDA"] = g.Grupo.isin(["Ventas", "Coste de ventas", "Personal", "Otros gastos de explotación"]).astype(int)
    return {"ventas": v, "ppto": p, "saldos": s, "stock": st, "plantilla": pl, "pyg": g}


def kpis(D, fm):
    """Los 7 indicadores (empresa) de un fin de mes, con las definiciones del diccionario."""
    v, s, st, pl, g, p = D["ventas"], D["saldos"], D["stock"], D["plantilla"], D["pyg"], D["ppto"]
    ini = pd.Timestamp(fm.year, 1, 1)
    vm = v[v.FinMes == fm]
    ytd = v[(v.Fecha >= ini) & (v.Fecha <= fm)]
    out = {"ventas_mes": vm.ImporteNeto.sum(), "ventas_ytd": ytd.ImporteNeto.sum(),
           "margen_mes_pct": (vm.ImporteNeto.sum() - vm.Coste.sum()) / vm.ImporteNeto.sum() * 100,
           "margen_ytd_pct": (ytd.ImporteNeto.sum() - ytd.Coste.sum()) / ytd.ImporteNeto.sum() * 100,
           "ppto_mes": p[p.FinMes == fm].Importe.sum(),
           "ppto_ytd": p[(p.FinMes >= ini) & (p.FinMes <= fm)].Importe.sum()}
    sm = s[s.FinMes == fm]
    if len(sm):
        out["pendiente"] = sm.Pendiente.sum()
        out["vencido60"] = sm.VencidoMas60.sum()
        out["vencida_pct"] = out["vencido60"] / out["pendiente"] * 100
        i3 = fm - pd.offsets.MonthEnd(3)
        v3 = v[(v.Fecha > i3) & (v.Fecha <= fm)].ImporteNeto.sum()
        out["pmc"] = out["pendiente"] / (v3 * (1 + IVA)) * (fm - i3).days
    stm = st[st.FinMes == fm]
    if len(stm):
        out["stock"] = stm.Valor.sum()
        c90 = v[(v.Fecha > fm - pd.Timedelta(days=90)) & (v.Fecha <= fm)].Coste.sum()
        out["cobertura"] = out["stock"] / (c90 / 90)
    plm = pl[pl.FinMes == fm]
    if len(plm):
        out["fte"] = plm.FTE.sum()
        out["activos"] = int(plm.Activos.sum())
        out["absentismo_mes_pct"] = plm.DiasIT.sum() / plm.DiasTeoricos.sum() * 100
        ply = pl[(pl.FinMes >= ini) & (pl.FinMes <= fm)]
        out["absentismo_ytd_pct"] = ply.DiasIT.sum() / ply.DiasTeoricos.sum() * 100
    gy = g[(g.FinMes >= ini) & (g.FinMes <= fm) & (g.EnEBITDA == 1)]
    if g[(g.FinMes == fm)].Real.notna().any():
        out["ebitda_ytd_real"] = (gy.Real * gy.Signo).sum()
        out["ebitda_ytd_ppto"] = (gy.Ppto * gy.Signo).sum()
        out["ebitda_cumpl_pct"] = out["ebitda_ytd_real"] / out["ebitda_ytd_ppto"] * 100
    return out


# =====================================================================================
# 8. LIBRO p8-datos.xlsx
# =====================================================================================
INSTRUCCIONES = [
    ("t", "P8 · Cuadro de mando de dirección"),
    ("s", "Electro Cierzo Suministros, S.L. (empresa ficticia) · Dirección general · Encargo de Carmen Soler (23/11/2026)"),
    ("", ""),
    ("h", "Objetivo"),
    ("", "Una sola página con lo importante del mes para el comité de dirección: 7 indicadores (ventas, margen, cartera vencida, PMC,"),
    ("", "stock y cobertura, plantilla y absentismo, EBITDA), por delegación, que cualquiera de Administración pueda actualizar cada mes"),
    ("", "dejando los archivos nuevos en su carpeta y pulsando Datos > Actualizar todo."),
    ("", ""),
    ("h", "Qué tienes"),
    ("", "1. p8-fuentes.zip: descomprímelo en tu equipo (por ejemplo en C:\\Cuadro_mando). Dentro:"),
    ("", "   · Fuentes: las 6 fuentes con los meses cerrados hasta el 31/10/2026 (ver la tabla de formatos)."),
    ("", "   · Llega_en_diciembre: los 5 CSV exportados otra vez con noviembre y las cifras de cuadre de noviembre. NO los uses hasta el paso 9."),
    ("", "   · Maestros: este libro.   · Cuadro: carpeta vacía donde guardas tu libro (P8_Cuadro_mando_2026-10_v01.xlsx)."),
    ("", "2. Este libro: Delegaciones, Familias, Clientes, Guion_entrevista, Diccionario_plantilla y Cifras_cuadre."),
    ("", ""),
    ("h", "Formato de cada fuente (míralo antes de importar)"),
    ("tabla", ["Archivo", "Lo exporta", "Codificación", "Separador", "Decimales", "Fechas", "Grano"]),
    ("fila", ["ventas_lineas_2025_2026.csv", "Informática (ERP)", "UTF-8", ";", "coma", "DD/MM/AAAA", "línea de venta"]),
    ("fila", ["presupuesto_ventas_2026.xlsx", "Dirección financiera", "—", "—", "—", "meses en columnas", "delegación × familia × mes"]),
    ("fila", ["saldos_clientes_fin_mes.csv", "Administración", "UTF-8", ";", "coma", "DD/MM/AAAA (fin de mes)", "cliente × fin de mes"]),
    ("fila", ["stock_fin_mes.csv", "Almacén", "UTF-8", ";", "coma", "DD/MM/AAAA (fin de mes)", "artículo × fin de mes"]),
    ("fila", ["plantilla_fin_mes.csv", "RR. HH.", "Windows-1252 (ANSI)", ";", "coma", "DD/MM/AAAA (fin de mes)", "departamento × delegación × fin de mes"]),
    ("fila", ["pyg_mensual.csv", "Contabilidad", "UTF-8", ";", "coma", "Ejercicio y Mes", "partida × mes (real y presupuesto)"]),
    ("", ""),
    ("h", "Hitos (el cómo lo decides tú)"),
    ("", "1. Entrevistas de 15 minutos con Marta, Javier, Andrés y Lucía (Guion_entrevista) → diccionario de indicadores y boceto de una página."),
    ("", "   Carmen tiene que aprobarlos ANTES de que construyas nada."),
    ("", "2. Power Query: las 6 fuentes limpias + dimensiones Delegación (con alias), Familia, Cliente y Calendario."),
    ("", "3. Modelo de datos en estrella con medidas (Power Pivot, Windows) o, si no lo tienes, el plan B: tabla única + SUMAR.SI.CONJUNTO."),
    ("", "4. Hoja «Cuadro» en A4 apaisado: selector de mes y de delegación, 7 tarjetas con semáforo y texto, 4-5 gráficos, minigráficos."),
    ("", "5. Controles: cada tarjeta cuadra con su fuente (Cifras_cuadre) y un control maestro en verde."),
    ("", "6. Accesibilidad (Revisar > Comprobar accesibilidad), protección de la hoja del cuadro e Inspeccionar documento."),
    ("", "7. Manual de actualización de una página y registro de cambios."),
    ("", "8. Si usas Copilot u otra IA autorizada: anota un caso de prueba calculado a mano por cada medida que te proponga."),
    ("", "9. Cuando se cierre noviembre: copia los archivos de Llega_en_diciembre en Fuentes, Actualizar todo y comprueba que octubre no cambia."),
    ("", "10. Defensa oral de 15 minutos ante Carmen."),
    ("", ""),
    ("h", "Cómo sabrás que cuadra"),
    ("", "La hoja Cifras_cuadre trae las cifras que da cada director a 31/10/2026. Tus tarjetas tienen que dar lo mismo."),
    ("", "Recuerda: los saldos, el stock y la plantilla son fotos de fin de mes: no se suman entre meses."),
    ("", ""),
    ("h", "Datos personales"),
    ("", "El cuadro solo lleva datos agregados. La plantilla ya viene agregada. Lo que no haga falta para el cuadro, fuera del modelo."),
]


def escribir_libro(clientes, cuadre):
    wb = xlsxwriter.Workbook(XLSX)
    F = {
        "t": wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F3864"}),
        "s": wb.add_format({"italic": True, "font_color": "#595959"}),
        "h": wb.add_format({"bold": True, "font_size": 12, "font_color": "#FFFFFF", "bg_color": "#1F3864"}),
        "cab": wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"}),
        "cel": wb.add_format({"border": 1, "text_wrap": True, "valign": "top"}),
        "eur": wb.add_format({"num_format": '#,##0.00 "€"', "border": 1}),
        "ent": wb.add_format({"num_format": "#,##0", "border": 1}),
        "dec": wb.add_format({"num_format": "#,##0.00", "border": 1}),
        "fecha": wb.add_format({"num_format": "dd/mm/yyyy", "border": 1}),
        "nota": wb.add_format({"italic": True, "font_color": "#595959", "text_wrap": True}),
    }
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 30)
    ws.set_column("B:G", 22)
    r = 0
    for tipo, txt in INSTRUCCIONES:
        if tipo in ("tabla", "fila"):
            for j, x in enumerate(txt):
                ws.write(r, j, x, F["cab"] if tipo == "tabla" else F["cel"])
        elif tipo in ("t", "s", "h"):
            ws.write(r, 0, txt, F[tipo])
            if tipo == "h":
                for j in range(1, 7):
                    ws.write_blank(r, j, None, F["h"])
        else:
            ws.write(r, 0, txt)
        r += 1
    ws.hide_gridlines(2)

    ws = wb.add_worksheet("Delegaciones")
    cab = ["Delegacion", "Provincia", "Apertura", "Almacén", "Nota"]
    datos = [("Zaragoza", "Zaragoza", dt.date(1998, 3, 2), "Central", "Sede, almacén central y Dirección"),
             ("Pamplona", "Navarra", dt.date(2008, 9, 1), "Punto de venta", "En el ERP se llama «Pamplona/Iruña»"),
             ("Lleida", "Lleida", dt.date(2014, 4, 7), "Punto de venta", ""),
             ("Logroño", "La Rioja", dt.date(2026, 11, 2), "Punto de venta", "Abre el 02/11/2026: sin presupuesto 2026 ni año anterior")]
    ws.write_row(0, 0, cab, F["cab"])
    for i, fila in enumerate(datos, 1):
        ws.write(i, 0, fila[0], F["cel"]); ws.write(i, 1, fila[1], F["cel"])
        ws.write_datetime(i, 2, dt.datetime.combine(fila[2], dt.time()), F["fecha"])
        ws.write(i, 3, fila[3], F["cel"]); ws.write(i, 4, fila[4], F["cel"])
    ws.set_column("A:D", 16); ws.set_column("E:E", 55)

    ws = wb.add_worksheet("Familias")
    ws.write_row(0, 0, ["Familia", "Tipo", "Orden", "Presupuesto"], F["cab"])
    for i, (f, t) in enumerate([(x, "Producto") for x in FAM6] + [("Portes y servicios", "Servicio"), ("Ajustes", "Ajuste (pronto pago)")], 1):
        ws.write_row(i, 0, [f, t, i, "Sí" if f != "Ajustes" else "No"], F["cel"])
    ws.set_column("A:B", 22)

    ws = wb.add_worksheet("Clientes")
    cols = ["CodCliente", "Nombre", "NIF", "Poblacion", "Provincia", "Delegacion"]
    ws.write_row(0, 0, cols, F["cab"])
    for i, fila in enumerate(clientes[cols].itertuples(index=False), 1):
        ws.write_row(i, 0, list(fila))
    ws.set_column("A:A", 11); ws.set_column("B:B", 45); ws.set_column("C:F", 14)
    ws.autofilter(0, 0, len(clientes), len(cols) - 1)
    ws.freeze_panes(1, 0)

    ws = wb.add_worksheet("Guion_entrevista")
    ws.set_column("A:A", 4); ws.set_column("B:B", 60); ws.set_column("C:F", 26)
    ws.write(0, 0, "Guion de entrevista (15 minutos con cada director). Apunta las respuestas en su columna.", F["t"])
    ws.write_row(2, 0, ["Nº", "Pregunta", "Marta Ruiz (Finanzas)", "Javier Ortega (Comercial)", "Andrés Molina (Compras y almacén)", "Lucía Fernández (RR. HH.)"], F["cab"])
    preguntas = ["¿Qué decisión tomas cada mes con este dato?", "¿Cada cuánto lo necesitas y para cuándo está cerrado?",
                 "¿Cómo se define exactamente? ¿Qué entra y qué no?", "¿De qué archivo o sistema sale? ¿Quién lo exporta?",
                 "¿Quién responde del dato si no cuadra?", "¿Qué meta o umbral tiene? ¿Quién lo fija?",
                 "¿Qué valor te alarmaría y qué harías entonces?", "¿Qué NO quieres ver en el cuadro?"]
    for i, q in enumerate(preguntas, 3):
        ws.write(i, 0, i - 2, F["cel"]); ws.write(i, 1, q, F["cel"])
        for j in range(2, 6):
            ws.write_blank(i, j, None, F["cel"])
        ws.set_row(i, 45)

    ws = wb.add_worksheet("Diccionario_plantilla")
    cab = ["Indicador", "Pregunta que responde", "Definición", "Fórmula", "Fuente", "Responsable", "Meta",
           "Sentido (más o menos es mejor)", "¿Por delegación?", "Periodicidad y cierre", "Limitaciones"]
    ws.write_row(0, 0, cab, F["cab"])
    for i in range(1, 9):
        for j in range(len(cab)):
            ws.write_blank(i, j, None, F["cel"])
        ws.set_row(i, 40)
    ws.set_column("A:K", 20)
    ws.write(10, 0, "Rellénalo con lo que te digan en las entrevistas y pide a Carmen que lo apruebe antes de construir.", F["nota"])

    ws = wb.add_worksheet("Cifras_cuadre")
    ws.set_column("A:A", 46); ws.set_column("B:D", 18)
    ws.write(0, 0, "Cifras que da cada director (cierre de octubre de 2026). Tu cuadro tiene que dar lo mismo.", F["t"])
    ws.write(2, 0, "Javier Ortega · control del ERP (ventas netas sin IVA)", F["h"])
    ws.write_row(3, 0, ["Mes", "Líneas", "Ventas netas"], F["cab"])
    r = 4
    for fm, n, imp in cuadre["erp"]:
        ws.write_datetime(r, 0, fm.to_pydatetime(), wb.add_format({"num_format": "mmmm yyyy", "border": 1}))
        ws.write_number(r, 1, n, F["ent"]); ws.write_number(r, 2, imp, F["eur"])
        r += 1
    r += 1
    for titulo, filas in [
        ("Marta Ruiz · Administración (P3)", [("Pendiente de cobro de clientes a 31/10/2026", cuadre["pendiente"], "eur")]),
        ("Marta Ruiz · Control presupuestario (P7)", [("EBITDA real de enero a octubre de 2026 (diario con la factura del 18/11)", cuadre["ebitda"], "eur")]),
        ("Andrés Molina · Almacén (P6)", [("Stock valorado a 31/10/2026 (unidades × coste de ficha)", cuadre["stock"], "eur"),
                                           ("Artículos en stock", cuadre["articulos"], "ent")]),
        ("Lucía Fernández · RR. HH. (P2)", [("Personas en plantilla a 31/10/2026", cuadre["activos"], "ent"),
                                             ("FTE (jornadas completas equivalentes) a 31/10/2026", cuadre["fte"], "dec")]),
    ]:
        ws.write(r, 0, titulo, F["h"]); ws.write_blank(r, 1, None, F["h"]); ws.write_blank(r, 2, None, F["h"])
        r += 1
        for txt, val, f in filas:
            ws.write(r, 0, txt, F["cel"]); ws.write_number(r, 1, val, F[f])
            r += 1
        r += 1
    ws.write(r, 0, "Las cifras de noviembre llegan con los archivos de Llega_en_diciembre (LEEME_noviembre.txt).", F["nota"])
    wb.close()


def escribir_presupuesto(pp, ruta):
    wb = xlsxwriter.Workbook(ruta)
    ws = wb.add_worksheet("Ppto ventas 2026")
    tit = wb.add_format({"bold": True, "font_size": 13})
    cab = wb.add_format({"bold": True, "bg_color": "#DDEBF7", "border": 1})
    ent = wb.add_format({"num_format": "#,##0", "border": 1})
    entb = wb.add_format({"num_format": "#,##0", "border": 1, "bold": True})
    ws.write(0, 0, "PRESUPUESTO DE VENTAS 2026 · aprobado por el consejo el 15/12/2025 · euros sin IVA, netos de devoluciones", tit)
    ws.write_row(2, 0, ["Delegación", "Familia"] + MESES_ABR + ["Total 2026"], cab)
    w = pp.pivot_table(index=["Delegacion", "Familia"], columns="Mes", values="Importe", aggfunc="sum")
    orden_f = FAM6 + ["Portes y servicios"]
    r = 3
    for d in ["Zaragoza", "Pamplona", "Lleida"]:
        for f in orden_f:
            vals = [int(w.loc[(d, f), m]) for m in range(1, 13)]
            ws.write(r, 0, d); ws.write(r, 1, f)
            for j, x in enumerate(vals):
                ws.write_number(r, 2 + j, x, ent)
            ws.write_number(r, 14, sum(vals), ent)
            r += 1
    tot = [int(pp[pp.Mes == m].Importe.sum()) for m in range(1, 13)]
    ws.write(r, 0, "TOTAL", cab); ws.write(r, 1, "", cab)
    for j, x in enumerate(tot):
        ws.write_number(r, 2 + j, x, entb)
    ws.write_number(r, 14, sum(tot), entb)
    ws.set_column("A:B", 18); ws.set_column("C:O", 11)
    ws.freeze_panes(3, 2)
    wb.close()


# =====================================================================================
# 9. PRINCIPAL
# =====================================================================================
def main():
    rng = np.random.default_rng(SEED)
    v26, nuevos = leer_p5()
    v25 = generar_2025(v26, nuevos, rng)
    clientes = pd.read_excel(os.path.join(LIBROS, "p5-datos.xlsx"), sheet_name="Clientes", dtype=str)
    todas = pd.concat([v25, v26], ignore_index=True)[["Fecha", "NumFactura", "CodCliente", "CodProducto", "Familia",
                                                    "Cantidad", "ImporteNeto", "CosteUnitario", "Delegacion", "CodComercial"]]
    todas = todas.sort_values(["Fecha", "NumFactura", "CodProducto"], kind="stable").reset_index(drop=True)
    saldos = generar_saldos(todas, clientes, rng)
    stock, abc_n = generar_stock(rng)
    plantilla = generar_plantilla(rng)
    pp, neto = presupuesto(v25, v26)
    g = pyg(v26, neto, rng)

    if os.path.exists(CARPETA):
        shutil.rmtree(CARPETA)
    for d in [FUENTES, DICIEMBRE, os.path.join(RAIZ, "Maestros"), os.path.join(RAIZ, "Cuadro")]:
        os.makedirs(d)
    nov = pd.Timestamp(2026, 11, 1)
    fmt_fecha = lambda s: s.dt.strftime("%d/%m/%Y")
    for carpeta, hasta in [(FUENTES, nov), (DICIEMBRE, pd.Timestamp(2026, 12, 1))]:
        csv_ventas(todas[todas.Fecha < hasta], os.path.join(carpeta, "ventas_lineas_2025_2026.csv"))
        s = saldos[(saldos.FinMes < hasta) & (saldos.FinMes.dt.month != 8)]
        csv(pd.DataFrame({"FinMes": fmt_fecha(s.FinMes), "CodCliente": s.CodCliente, "Delegacion": s.Delegacion,
                          "Pendiente": s.Pendiente.map(num), "VencidoMas60": s.VencidoMas60.map(num)}),
            os.path.join(carpeta, "saldos_clientes_fin_mes.csv"))
        t = stock[stock.FinMes < hasta]
        csv(pd.DataFrame({"FinMes": fmt_fecha(t.FinMes), "CodArticulo": t.CodArticulo, "Descripcion": t.Descripcion,
                          "ClaseABC": t.ClaseABC, "Unidad": t.Unidad, "Unidades": t.Unidades.map(numg),
                          "CosteUnitario": t.CosteUnitario.map(lambda x: num(x, 4))}),
            os.path.join(carpeta, "stock_fin_mes.csv"))
        p = plantilla[plantilla.FinMes < hasta]
        csv(pd.DataFrame({"FinMes": fmt_fecha(p.FinMes), "Departamento": p.Departamento, "Delegacion": p.Delegacion,
                          "Activos": p.Activos, "FTE": p.FTE.map(num), "DiasIT": p.DiasIT, "DiasTeoricos": p.DiasTeoricos}),
            os.path.join(carpeta, "plantilla_fin_mes.csv"), encoding="cp1252")
        gg = g.copy()
        gg.loc[gg.Mes >= (11 if carpeta == FUENTES else 12), "Real"] = np.nan
        csv(pd.DataFrame({"Ejercicio": gg.Ejercicio, "Mes": gg.Mes, "Cuenta": gg.Cuenta, "Partida": gg.Partida,
                          "Grupo": gg.Grupo, "Real": gg.Real.map(num), "Ppto": gg.Ppto.map(lambda x: num(x, 2))}),
            os.path.join(carpeta, "pyg_mensual.csv"))
    escribir_presupuesto(pp, os.path.join(FUENTES, "presupuesto_ventas_2026.xlsx"))

    # ---------- controles DESDE LOS ARCHIVOS (limpieza pactada) ----------
    A = cargar_limpio(FUENTES)
    B = cargar_limpio(DICIEMBRE)
    oct26, sep26, nov26 = fin_mes(2026, 10), fin_mes(2026, 9), fin_mes(2026, 11)
    k10, k11 = kpis(A, oct26), kpis(B, nov26)
    va = A["ventas"]
    erp = [(fm, int((va.FinMes == fm).sum()), round(va[va.FinMes == fm].ImporteNeto.sum(), 2))
           for fm in sorted(va.FinMes.unique()) if fm.year == 2026]
    erp = [(pd.Timestamp(a), b, c) for a, b, c in erp]
    ll = lambda a, d: va[(va.Delegacion == d) & (va.Fecha.dt.year == a) & (va.Fecha.dt.month <= 10)].ImporteNeto.sum()
    var_lleida = (ll(2026, "Lleida") / ll(2025, "Lleida") - 1) * 100
    pl_oct = A["plantilla"][A["plantilla"].FinMes == oct26]
    cuadre = {"erp": erp, "pendiente": round(k10["pendiente"], 2), "stock": round(k10["stock"] + 1e-6, 2),
              "articulos": int((A["stock"].FinMes == oct26).sum()), "activos": int(pl_oct.Activos.sum()),
              "fte": round(pl_oct.FTE.sum(), 2), "ebitda": round(k10["ebitda_ytd_real"], 2)}
    # octubre no cambia al cargar noviembre
    for clave in ["ventas_mes", "pendiente", "stock", "fte", "ebitda_ytd_real"]:
        assert abs(kpis(B, oct26)[clave] - k10[clave]) < 0.005, clave
    vb = B["ventas"]
    k_sep = kpis(A, sep26)
    por_deleg_oct = {d: round(va[(va.FinMes == oct26) & (va.Delegacion == d)].ImporteNeto.sum(), 2) for d in ["Zaragoza", "Pamplona", "Lleida"]}
    verdad = {
        "semilla": SEED,
        "lineas_base": int(len(va)), "lineas_diciembre": int(len(vb)),
        "lineas_2025": int((va.Fecha.dt.year == 2025).sum()), "lineas_lerida": int((texto_delegacion_erp(todas[todas.Fecha < nov]) == "Lérida").sum()),
        "lineas_pamplona_iruna": int((todas[todas.Fecha < nov].Delegacion == "Pamplona").sum()),
        "ventas_2025": round(va[va.Fecha.dt.year == 2025].ImporteNeto.sum(), 2),
        "ventas_eneoct_2025": round(va[(va.Fecha.dt.year == 2025) & (va.Fecha.dt.month <= 10)].ImporteNeto.sum(), 2),
        "control": {
            "ventas_oct": round(k10["ventas_mes"], 2),
            "var_lleida_eneoct_pct": round(var_lleida, 2),
            "margen_eneoct_pct": round(k10["margen_ytd_pct"], 2),
            "vencida60_oct_pct": round(k10["vencida_pct"], 2),
            "pmc_oct": round(k10["pmc"], 2),
            "cobertura_oct": round(k10["cobertura"], 2),
            "absentismo_eneoct_pct": round(k10["absentismo_ytd_pct"], 2),
            "ebitda_cumpl_eneoct_pct": round(k10["ebitda_cumpl_pct"], 2),
        },
        "oct": {k: (round(x, 4) if isinstance(x, float) else x) for k, x in k10.items()},
        "sep": {k: (round(x, 4) if isinstance(x, float) else x) for k, x in k_sep.items()},
        "nov": {k: (round(x, 4) if isinstance(x, float) else x) for k, x in k11.items()},
        "ventas_nov_logrono": round(vb[(vb.FinMes == nov26) & (vb.Delegacion == "Logroño")].ImporteNeto.sum(), 2),
        "ventas_oct_por_deleg": por_deleg_oct,
        "cumpl_ventas_eneoct_pct": round(k10["ventas_ytd"] / k10["ppto_ytd"] * 100, 2),
        "var_total_eneoct_pct": round((k10["ventas_ytd"] / va[(va.Fecha.dt.year == 2025) & (va.Fecha.dt.month <= 10)].ImporteNeto.sum() - 1) * 100, 2),
        "abc_n": abc_n, "cuadre": {k: v for k, v in cuadre.items() if k != "erp"},
        "agosto_saldos_filas": int((A["saldos"].FinMes == fin_mes(2026, 8)).sum()),
        "stock_meses": sorted(set(A["stock"].FinMes.dt.month)),
        "nif_dni": int(clientes.NIF.str.match(r"^\d{8}[A-Z]$").sum()),
        "sin_ficha": int(((A["stock"].ClaseABC == "Sin ficha") & (A["stock"].FinMes == oct26)).sum()),
        "ppto_total": int(pp.Importe.sum()),
        "pyg_ventas_eneoct_real": round(A["pyg"][(A["pyg"].Cuenta == "70") & (A["pyg"].Mes.astype(int) <= 10)].Real.sum(), 2),
    }
    assert abs(verdad["pyg_ventas_eneoct_real"] - k10["ventas_ytd"]) < 0.01
    escribir_libro(clientes, cuadre)
    shutil.copy(XLSX, os.path.join(RAIZ, "Maestros", "p8-datos.xlsx"))
    with open(os.path.join(RAIZ, "Cuadro", "LEEME.txt"), "w", encoding="utf-8") as f:
        f.write("Guarda aquí tu libro: P8_Cuadro_mando_2026-10_v01.xlsx (y las versiones siguientes _v02, _v03…).\r\n"
                "Las consultas de Power Query deben leer de ..\\Fuentes con un parámetro de ruta.\r\n")
    eur = lambda x: f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    with open(os.path.join(DICIEMBRE, "LEEME_noviembre.txt"), "w", encoding="utf-8") as f:
        f.write("Cierre de noviembre de 2026 (5.º día laborable de diciembre). Archivos reexportados con noviembre.\r\n"
                "Copia los 5 CSV en ..\\Fuentes (sustituyendo los anteriores) y pulsa Datos > Actualizar todo.\r\n\r\n"
                "Cifras de cuadre de noviembre:\r\n"
                f"- Ventas netas de noviembre (ERP): {eur(k11['ventas_mes'])} € en {f'{int((vb.FinMes == nov26).sum()):,}'.replace(',', '.')} líneas; de ellas, Logroño {eur(verdad['ventas_nov_logrono'])} €.\r\n"
                f"- Pendiente de cobro a 30/11/2026: {eur(k11['pendiente'])} €.\r\n"
                f"- Stock valorado a 30/11/2026: {eur(k11['stock'])} €.\r\n"
                f"- FTE a 30/11/2026: {eur(k11['fte'])} (incluye los 2 comerciales de Logroño).\r\n"
                "Octubre y los meses anteriores no cambian.\r\n")
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(RAIZ):
            for fn in sorted(files):
                full = os.path.join(base, fn)
                z.write(full, os.path.relpath(full, CARPETA))
            if not files:
                z.write(base, os.path.relpath(base, CARPETA) + "/")

    log = [
        ("ventas_lineas_2025_2026.csv", "Delegacion", "Q08", f"«Lérida» hasta el 30/09/2025 ({verdad['lineas_lerida']} líneas) y «Lleida» desde el 01/10/2025", "Lleida"),
        ("ventas_lineas_2025_2026.csv", "Delegacion", "Q08", f"«Pamplona/Iruña» en ventas ({verdad['lineas_pamplona_iruna']} líneas) y «Pamplona» en el resto de fuentes", "Pamplona"),
        ("Llega_en_diciembre/ventas_lineas_2025_2026.csv", "Delegacion", "Q16", "«Logroño» desde el 02/11/2026: sin presupuesto ni año anterior", "sin dato"),
        ("presupuesto_ventas_2026.xlsx", "filas 1-2", "Q11", "Título y fila vacía antes del encabezado", "quitar 2 filas"),
        ("presupuesto_ventas_2026.xlsx", "Ene..Dic", "Q12", "Meses en columnas", "Anular dinamización"),
        ("presupuesto_ventas_2026.xlsx", "última fila", "Q10", "Fila TOTAL (9.480.000)", "quitar"),
        ("presupuesto_ventas_2026.xlsx", "grano", "Q18", "Delegación × familia × mes: no se relaciona con Ventas", "dimensiones"),
        ("saldos_clientes_fin_mes.csv", "FinMes", "Q22", "Falta el 31/08/2026 (agosto no se cerró)", "sin dato"),
        ("stock_fin_mes.csv", "FinMes", "Q22", "Empieza el 31/05/2026", "sin dato antes de mayo"),
        ("stock_fin_mes.csv", "CodArticulo", "Q13", "Códigos con ceros a la izquierda", "texto"),
        ("stock_fin_mes.csv", "CosteUnitario", "Q09", f"{verdad['sin_ficha']} artículos «Sin ficha» con coste vacío", "0 (como en P6)"),
        ("plantilla_fin_mes.csv", "archivo", "Q19", "Codificación Windows-1252 (ANSI)", "Origen del archivo 1252"),
        ("pyg_mensual.csv", "Real", "Q09", "Vacío en meses no cerrados", "sin dato"),
        ("pyg_mensual.csv", "Real/Ppto", "Q14", "Gastos en positivo; el signo lo da Grupo", "signo por Grupo"),
        ("p8-datos.xlsx/Clientes", "NIF", "Q20", f"{verdad['nif_dni']} NIF son DNI de autónomos", "fuera del modelo"),
    ]
    pd.DataFrame(log, columns=["archivo", "ubicacion", "codigo", "problema", "decision"]).to_csv(
        LOG, sep=";", index=False, encoding="utf-8-sig")
    with open(VERDAD, "w", encoding="utf-8") as f:
        json.dump(verdad, f, ensure_ascii=False, indent=1, default=str)
    print(json.dumps({k: verdad[k] for k in ["lineas_base", "lineas_diciembre", "lineas_2025", "ventas_2025", "control",
                                            "cumpl_ventas_eneoct_pct", "var_total_eneoct_pct", "abc_n", "cuadre",
                                            "ventas_nov_logrono"]}, ensure_ascii=False, indent=1, default=str))
    print("ajustes plantilla vs P2 (dep, mes, campo, dif):", AJUSTES)
    print("oct", verdad["oct"]); print("nov", verdad["nov"])


if __name__ == "__main__":
    main()

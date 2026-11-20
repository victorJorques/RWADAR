# -*- coding: utf-8 -*-
"""
P3 · Facturas, cobros y antigüedad de saldos (Administración) · DATOS DE PARTIDA
================================================================================

Genera (todo con la semilla fija SEED, siempre igual):
  libros/p3-facturas-emitidas.csv   listado de facturas que saca el ERP (UTF-8 SIN BOM, «;»)
  libros/p3-cobros-2026.csv         cobros de 2026 que pasa contabilidad (UTF-8 SIN BOM, «;»)
  libros/p3-datos.xlsx              Instrucciones · Clientes (maestro) · Altas_ERP · Contabilidad
  libros/p3-datos.meta.json
y en libros/src/ (NO se entregan):
  p3-log-suciedad.csv               cada problema sembrado: archivo, fila, columna, problema,
                                    valor verdadero y valor sembrado
  p3_verdad.json                    totales de control calculados con pandas sobre los datos
                                    VERDADEROS (antes de ensuciar); p3_solucion.py comprueba que,
                                    limpiando los archivos sucios, salen idénticos.

Empresa ficticia: Electro Cierzo Suministros, S.L. (Zaragoza, Pamplona y Lleida). Encargo de
Marta Ruiz (directora financiera), viernes 13/11/2026. Foto a 31/10/2026 (fecha de corte).
Los clientes C0001-C0320 son los MISMOS de P5 (se generan con p5_datos.generar_clientes y su
semilla); V05 causó baja el 15/05/2026 y sus clientes los lleva V06. Todo es inventado.

LO QUE HAY (datos verdaderos)
-----------------------------
- 2.636 documentos: 2.536 facturas F26 + 24 rectificativas R26 (abonos, en negativo) de
  enero a octubre de 2026 y 76 facturas F25 de nov-dic de 2025 que seguían pendientes al
  empezar 2026 (la mayoría se cobraron en enero-abril; 14 siguen pendientes).
- Total = Base + Cuota (IVA 21 %; 0 % en las entregas intracomunitarias a Portugal).
- Vencimiento = FechaFactura + días de la forma de pago (días naturales).
- Cobros (FechaCobro hasta el 13/11/2026, día en que se exporta): directos, agrupados,
  parciales, recibos devueltos y entregas a cuenta. La foto es a 31/10/2026: los cobros de
  noviembre NO cuentan.
- Regla de los cobros agrupados (Marta): si el importe cubre todo lo citado, cada documento se
  da por cobrado entero (también los abonos citados, que restan); si no llega, se aplica a la
  factura más antigua primero (misma fecha: la de número menor) y el resto queda pendiente.
- Las entregas a cuenta (sin factura) NO se aplican a ninguna factura: van en una línea aparte
  «Cobros a cuenta pendientes de aplicar». Contabilidad ya las tiene abonadas en la 430 de
  cada cliente, por eso: SALDO 430 = Σ pendiente de los documentos − Σ entregas a cuenta.

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5), cantidades exactas
-----------------------------------------------------------------------------------------
p3-facturas-emitidas.csv (2.651 filas de datos):
  Q19      UTF-8 sin BOM con tildes y «ñ» (Peñaflor, Logroño, Iluminación…): con doble clic,
           Excel puede leerlo con la página de códigos de Windows y romper los caracteres.
  Q01 ×14  el ERP se exportó en dos tandas (hasta el 02/07 y desde el 01/07): las 14 facturas
           del 01/07 y del 02/07 salen dos veces, idénticas en todas las columnas.
  Q10 ×1   última fila «TOTAL GENERAL» con las sumas (incluye los duplicados).
  Q05      TotalFactura con PUNTO decimal («1234.56») en todas las filas; BaseImponible y
           CuotaIVA, con coma.
  Q04 ×37  CodCliente con espacios al final.
  Q16 ×3   «C0O45» (letra O en vez de cero) en 3 facturas de C0045.
  Q16 ×5   2 clientes nuevos (C0322 y C0323, alta en octubre) que no están en «Clientes»:
           sus fichas vienen en «Altas_ERP».
  Q17 ×5   Total ≠ Base + Cuota: 4 por ±0,01 (redondeo, se toleran) y 1 por +100,00 €
           (el cliente pagó Base + Cuota: quedan 100,00 € «pendientes» que hay que comunicar).
  Q09 ×120 FechaVencimiento vacía: se calcula con la FormaPago.
  Q07 ×90  una tanda de 90 filas seguidas (marzo) con las dos fechas en formato ISO
           («2026-03-09»).
  Q03 ×6   6 facturas al cliente de Portugal (C0321) con TipoIVA 0: entrega intracomunitaria,
           NO es un error.
  —        1 cliente bloqueado (Estado «Bloqueado» desde el 15/06/2026) con facturas nuevas.
  —        7 clientes con DiasPago de 75 o 90 (la Ley 3/2004, art. 4.3, no permite pactar más
           de 60 días).
p3-cobros-2026.csv:
  Q21 ×60  cobros agrupados: 2-4 documentos citados solo en el Concepto (NumFactura vacío);
           55 cubren exactamente lo citado (16 de ellos compensan un abono R26) y 5 son parciales.
  Q21 ×71  cobros de una sola factura con el número solo en el Concepto.
  Q14 ×18  devoluciones de recibo en negativo (16 antes del corte: 4 se volvieron a cobrar por
           transferencia antes del 31/10; 2 devoluciones son de noviembre y no cuentan).
  —   ×25  facturas con un cobro directo parcial (8 completan el pago en noviembre).
  —   ×9   entregas a cuenta sin factura (cliente conocido).
  —        NumFactura vacío ×140 (= 60 + 71 + 9) y CodCliente vacío ×35.
  —        cobros del 01/11 al 13/11/2026 (después del corte: no cuentan).
p3-datos.xlsx: «Clientes» (321 filas, exportado el 30/09/2026) no trae C0322 ni C0323.

Calibración [DISEÑO de la ficha]: pendiente total con IVA entre 1,85 y 1,95 M€; tramos
aproximados 60/17/9/6/5/3 %; 4 clientes por encima de su límite; 1 cliente con saldo a favor.
Resultado real (lo que usa proyectos/p3.json): pendiente 1.896.731,01 €; tramos 72,9/10,2/4,2/
2,2/6,3/4,2 % (más «no vencido» que en el diseño: es lo normal con plazos de 30-60 días); 4 clientes
por encima del límite; 2 clientes con saldo a favor: C0013 (el sembrado) y C0298, cuyo abono
R26-000001 de febrero nunca se compensó (solo le queda pendiente F25-002412). Se deja así: es
realista y el proyecto pide la lista de saldos a favor, no una cantidad fija.
Cadena: p3_datos.py → p3_solucion.py (limpia, comprueba contra p3_verdad.json y hace el libro
resuelto) → p3_proyecto.py (escribe proyectos/p3.json con esas cifras).
"""
import csv
import datetime as dt
import json
import os
import sys

import numpy as np
import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import p5_datos as p5  # noqa: E402  (maestro de clientes común con P5)

SEED = 20261113
CORTE = dt.date(2026, 10, 31)
FIN_COBROS = dt.date(2026, 11, 13)       # el archivo de cobros llega hasta aquí
BLOQUEO = dt.date(2026, 6, 15)
OBJ_PENDIENTE = 1_896_731.0     # objetivo de calibración (entre 1,85 y 1,95 M€)

CSV_FAC = os.path.join(LIBROS, "p3-facturas-emitidas.csv")
CSV_COB = os.path.join(LIBROS, "p3-cobros-2026.csv")
XLSX = os.path.join(LIBROS, "p3-datos.xlsx")
LOG = os.path.join(AQUI, "p3-log-suciedad.csv")
VERDAD = os.path.join(AQUI, "p3_verdad.json")

FESTIVOS = set(p5.FESTIVOS) | {dt.date(2025, 12, 8), dt.date(2025, 12, 25), dt.date(2026, 8, 15)}
PESO_MES = {1: 0.95, 2: 0.97, 3: 1.06, 4: 1.03, 5: 1.08, 6: 1.07, 7: 1.00, 8: 0.66, 9: 1.06, 10: 1.12}

FORMAS = {  # texto del ERP → días
    "Contado": 0, "Transferencia 30 días": 30, "Recibo domiciliado 30 días": 30, "Transferencia 45 días": 45,
    "Transferencia 60 días": 60, "Recibo domiciliado 60 días": 60, "Confirming 60 días": 60,
    "Transferencia 75 días": 75, "Transferencia 90 días": 90, "Confirming 90 días": 90,
}
TRAMOS = [(-10**6, "0 · No vencido"), (1, "1 · 1-30"), (31, "2 · 31-60"), (61, "3 · 61-90"),
          (91, "4 · 91-180"), (181, "5 · Más de 180")]


def laborable(d):
    return d.weekday() < 5 and d not in FESTIVOS


def siguiente_laborable(d):
    while not laborable(d):
        d += dt.timedelta(days=1)
    return d


def dias_laborables(desde, hasta):
    d, out = desde, []
    while d <= hasta:
        if laborable(d):
            out.append(d)
        d += dt.timedelta(days=1)
    return out


def tramo(dias):
    t = TRAMOS[0][1]
    for desde, nombre in TRAMOS:
        if dias >= desde:
            t = nombre
    return t


def banco(nombre):
    """Nombre como lo escribe el banco: mayúsculas, sin tildes ni signos."""
    t = nombre.upper()
    for a, b in zip("ÁÉÍÓÚÀÈÒÜÏÑÇ", "AEIOUAEOUINC"):
        t = t.replace(a, b)
    return " ".join(t.replace(",", " ").replace(".", "").replace("'", " ").split())


def r2(x):
    return float(round(x + 0.0, 2))


# ===========================================================================
# 1. MAESTRO DE CLIENTES (C0001-C0320 de P5 + Portugal + 2 altas de octubre)
# ===========================================================================
def maestro(rng):
    p5.rng = np.random.default_rng(p5.SEED)       # mismo maestro que P5
    cl = p5.generar_clientes()
    cl["CodComercial"] = cl["Comercial"].replace({"V05": "V06"})   # V05, baja el 15/05/2026
    cl = cl[["CodCliente", "Nombre", "NIF", "Poblacion", "Provincia", "Delegacion", "CodComercial", "Peso"]].copy()
    extra = [
        dict(CodCliente="C0321", Nombre="Electricidade Vale do Cávado, Lda.", NIF="PT507318642",
             Poblacion="Braga", Provincia="Braga (Portugal)", Delegacion="Zaragoza", CodComercial="V04", Peso=1.6),
        dict(CodCliente="C0322", Nombre="Instalaciones Eléctricas Peñaflor, S.L.", NIF=p5.cif_falso("Zaragoza"),
             Poblacion="Peñaflor (Zaragoza)", Provincia="Zaragoza", Delegacion="Zaragoza", CodComercial="V02", Peso=0),
        dict(CodCliente="C0323", Nombre="Montajes Eléctricos Logroño Sur, S.L.", NIF=p5.cif_falso("La Rioja"),
             Poblacion="Logroño", Provincia="La Rioja", Delegacion="Pamplona", CodComercial="V08", Peso=0),
    ]
    cl = pd.concat([cl, pd.DataFrame(extra)], ignore_index=True)
    n = len(cl)
    # días de pago pactados y forma de pago
    dias = rng.choice([0, 30, 45, 60], size=n, p=[0.06, 0.34, 0.10, 0.50])
    cl["DiasPago"] = dias
    cand = [i for i in range(320) if cl.loc[i, "Peso"] > 1.0 and dias[i] in (30, 60)]
    largos = rng.choice(cand, size=7, replace=False)
    for k, i in enumerate(largos):
        cl.loc[i, "DiasPago"] = 90 if k < 4 else 75
    cl.loc[cl["CodCliente"] == "C0321", "DiasPago"] = 60
    cl.loc[cl["CodCliente"] == "C0322", "DiasPago"] = 30
    cl.loc[cl["CodCliente"] == "C0323", "DiasPago"] = 60

    def forma(d):
        if d == 0:
            return "Contado"
        if d == 30:
            return str(rng.choice(["Transferencia 30 días", "Recibo domiciliado 30 días"], p=[0.6, 0.4]))
        if d == 45:
            return "Transferencia 45 días"
        if d == 60:
            return str(rng.choice(["Transferencia 60 días", "Recibo domiciliado 60 días", "Confirming 60 días"],
                                  p=[0.55, 0.30, 0.15]))
        if d == 75:
            return "Transferencia 75 días"
        return str(rng.choice(["Transferencia 90 días", "Confirming 90 días"], p=[0.5, 0.5]))
    cl["FormaPago"] = [forma(d) for d in cl["DiasPago"]]
    cl.loc[cl["CodCliente"] == "C0321", "FormaPago"] = "Transferencia 60 días"
    cl.loc[cl["CodCliente"] == "C0322", "FormaPago"] = "Transferencia 30 días"
    cl.loc[cl["CodCliente"] == "C0323", "FormaPago"] = "Transferencia 60 días"
    # comportamiento de pago
    cl["Perfil"] = rng.choice(["puntual", "lento", "moroso"], size=n, p=[0.68, 0.24, 0.08])
    for c in ("C0321", "C0322", "C0323"):
        cl.loc[cl["CodCliente"] == c, "Perfil"] = "puntual"
    cl["Estado"] = "Activo"
    cl["Observaciones"] = ""
    return cl


# ===========================================================================
# 2. DOCUMENTOS (facturas y abonos) Y COBROS VERDADEROS
# ===========================================================================
def construir(K):
    rng = np.random.default_rng(SEED)
    cl = maestro(rng)
    cli = cl.set_index("CodCliente")
    activos = cl[cl["CodCliente"] <= "C0321"].copy()
    # elegidos especiales
    morosos = activos[(activos["Perfil"] == "moroso") & (activos["DiasPago"].isin([30, 45, 60])) &
                      (activos["FormaPago"].str.startswith("Transferencia")) & (activos["Peso"] > 0.8)]
    BLOQ = morosos.sort_values("Peso", ascending=False).iloc[0]["CodCliente"]
    cl.loc[cl["CodCliente"] == BLOQ, ["Estado", "Observaciones"]] = [
        "Bloqueado", "Bloqueado el 15/06/2026 por impagados. No servir sin autorización de Dirección financiera."]
    contado = activos[(activos["DiasPago"] == 0) & (activos["Perfil"] == "puntual") & (activos["Peso"].between(0.4, 1.5))]
    FAVOR = contado.iloc[0]["CodCliente"]
    cli = cl.set_index("CodCliente")

    pesos = activos["Peso"].to_numpy().copy()
    pesos[activos["CodCliente"].to_numpy() == "C0321"] = 0       # Portugal: 6 facturas fijas
    pesos = pesos / pesos.sum()
    cods = activos["CodCliente"].to_numpy()

    docs = []

    def base_aleatoria(escala=1.0):
        return r2(float(rng.lognormal(np.log(1650), 0.85)) * K * escala)

    # --- 2026: F26 por mes y día ---
    n_f26 = 2536
    pm = np.array([PESO_MES[m] for m in range(1, 11)])
    por_mes = np.floor(pm / pm.sum() * n_f26).astype(int)
    por_mes[np.argsort(-(pm / pm.sum() * n_f26 - por_mes))[: n_f26 - por_mes.sum()]] += 1
    fechas = []
    for m in range(1, 11):
        dias = [d for d in dias_laborables(dt.date(2026, m, 1), (dt.date(2026, m + 1, 1) - dt.timedelta(days=1)))]
        if m == 7:
            fijos = [dt.date(2026, 7, 1)] * 7 + [dt.date(2026, 7, 2)] * 7
            resto = [d for d in dias if d.day > 2]
            elegidos = list(rng.choice(len(resto), size=por_mes[m - 1] - 14))
            fechas += fijos + [resto[i] for i in elegidos]
        else:
            fechas += [dias[i] for i in rng.choice(len(dias), size=por_mes[m - 1])]
    fechas.sort()
    for f in fechas:
        docs.append(dict(Serie="F26", FechaFactura=f, CodCliente=str(rng.choice(cods, p=pesos)), Base=base_aleatoria()))
    # Portugal: 6 facturas, IVA 0
    for f in [dt.date(2026, 3, 11), dt.date(2026, 4, 22), dt.date(2026, 6, 9), dt.date(2026, 7, 21),
              dt.date(2026, 9, 15), dt.date(2026, 10, 20)]:
        i = int(rng.integers(len(docs)))
        while docs[i]["FechaFactura"] in (dt.date(2026, 7, 1), dt.date(2026, 7, 2)):
            i = int(rng.integers(len(docs)))
        docs[i].update(FechaFactura=f, CodCliente="C0321", Base=base_aleatoria(2.2))
    # cliente bloqueado: al menos 5 facturas después del bloqueo
    tras = [d for d in docs if d["FechaFactura"] > BLOQUEO + dt.timedelta(days=20) and d["CodCliente"] != "C0321"
            and d["FechaFactura"] not in (dt.date(2026, 7, 1), dt.date(2026, 7, 2))]
    for i in rng.choice(len(tras), size=5, replace=False):
        tras[i]["CodCliente"] = BLOQ
    # altas de octubre: C0322 (3 facturas) y C0323 (2)
    octubre = [d for d in docs if d["FechaFactura"] >= dt.date(2026, 10, 19) and d["CodCliente"] not in ("C0321", BLOQ)]
    for i, c in zip(rng.choice(len(octubre), size=5, replace=False), ["C0322"] * 3 + ["C0323"] * 2):
        octubre[i]["CodCliente"] = c
    # el cliente con saldo a favor no factura en octubre (así su saldo es solo el abono)
    for d in docs:
        if d["CodCliente"] == FAVOR and d["FechaFactura"] >= dt.date(2026, 10, 1):
            d["CodCliente"] = str(rng.choice(cods[(cods != FAVOR) & (cods != "C0321") & (cods != BLOQ)]))
    docs.sort(key=lambda d: (d["FechaFactura"], float(rng.random())))
    for i, d in enumerate(docs, start=1):
        d["NumFactura"] = f"F26-{i:06d}"
    # --- rectificativas R26 (24) ---
    abonos = []
    n_docs = pd.Series([d["CodCliente"] for d in docs]).value_counts()
    # los abonos (devoluciones de material, rappels) son de clientes con actividad: 12 facturas o más
    clientes_f = sorted(c for c, v in n_docs.items() if v >= 12 and c not in ("C0321", "C0322", "C0323", BLOQ, FAVOR))
    for k in range(24):
        f = siguiente_laborable(dt.date(2026, 2, 2) + dt.timedelta(days=int(rng.integers(0, 260))))
        abonos.append(dict(Serie="R26", FechaFactura=f, CodCliente=str(rng.choice(clientes_f)),
                           Base=-r2(float(rng.lognormal(np.log(420), 0.7)) * K)))
    abonos[0].update(FechaFactura=dt.date(2026, 10, 22), CodCliente=FAVOR, Base=-r2(1870.0 * K))  # saldo a favor
    abonos.sort(key=lambda d: d["FechaFactura"])
    for i, d in enumerate(abonos, start=1):
        d["NumFactura"] = f"R26-{i:06d}"
    # --- 2025: 76 facturas de nov-dic pendientes al empezar el año ---
    f25 = []
    dias25 = dias_laborables(dt.date(2025, 11, 3), dt.date(2025, 12, 30))
    morosos25 = cl[(cl["Perfil"] == "moroso") & (cl["CodCliente"] <= "C0320")]["CodCliente"].to_numpy()
    for k in range(76):
        c = str(rng.choice(morosos25)) if k < 14 else str(rng.choice(cods, p=pesos))
        f25.append(dict(Serie="F25", FechaFactura=dias25[int(rng.integers(len(dias25)))], CodCliente=c,
                        Base=base_aleatoria()))
    f25.sort(key=lambda d: d["FechaFactura"])
    for i, d in enumerate(f25, start=2411):
        d["NumFactura"] = f"F25-{i:06d}"
    D = pd.DataFrame(f25 + docs + abonos)
    D["TipoIVA"] = np.where(D["CodCliente"] == "C0321", 0, 21)
    D["Cuota"] = [r2(b * t / 100) for b, t in zip(D["Base"], D["TipoIVA"])]
    D["Total"] = [r2(b + c) for b, c in zip(D["Base"], D["Cuota"])]
    D["FormaPago"] = [cli.loc[c, "FormaPago"] for c in D["CodCliente"]]
    D["Dias"] = D["FormaPago"].map(FORMAS)
    D["Vencimiento"] = [f + dt.timedelta(days=int(d)) for f, d in zip(D["FechaFactura"], D["Dias"])]
    D["Perfil"] = [cli.loc[c, "Perfil"] for c in D["CodCliente"]]
    D.loc[D["CodCliente"] == BLOQ, "Perfil"] = "moroso"
    D["Especial"] = ""
    D.loc[D["Serie"] == "R26", "Especial"] = "abono"
    D.loc[D["CodCliente"] == "C0321", "Especial"] = "portugal"
    D.loc[D["CodCliente"].isin(["C0322", "C0323"]), "Especial"] = "alta"
    D.loc[D["Serie"] == "F25", "Especial"] = "f25"
    D.loc[(D["CodCliente"] == BLOQ) & (D["FechaFactura"] > BLOQUEO), "Especial"] = "bloqueado"
    D.loc[D["FechaFactura"].isin([dt.date(2026, 7, 1), dt.date(2026, 7, 2)]), "Especial"] = "dup"
    # anomalías de Total (4 de redondeo y 1 de 100 €)
    libres = D[(D["Serie"] == "F26") & (D["Especial"] == "") & (D["FechaFactura"] < dt.date(2026, 9, 1))].index
    red = rng.choice(libres, size=4, replace=False)
    for i, s in zip(red, [0.01, -0.01, 0.01, 0.01]):
        D.loc[i, "Total"] = r2(D.loc[i, "Total"] + s)
        D.loc[i, "Especial"] = "redondeo"
    cien = D[(D["Serie"] == "F26") & (D["Especial"] == "") & D["FechaFactura"].between(dt.date(2026, 9, 1), dt.date(2026, 9, 10))
             & (D["Perfil"] == "puntual") & D["FormaPago"].str.startswith("Transferencia 30")].index[0]
    D.loc[cien, "Total"] = r2(D.loc[cien, "Total"] + 100)
    D.loc[cien, "Especial"] = "cien"

    # --- cobros ---
    cobros = []

    def medio_de(forma):
        if forma.startswith("Recibo"):
            return "Recibo"
        if forma.startswith("Confirming"):
            return "Confirming"
        if forma == "Contado":
            return "Cheque" if rng.random() < 0.5 else "Transferencia"
        return "Cheque" if rng.random() < 0.05 else "Transferencia"

    def retraso(perfil, forma):
        if forma.startswith("Recibo") or forma.startswith("Confirming"):
            return 0
        if perfil == "puntual":
            d = int(round(rng.normal(1, 4)))
            d = min(max(d, -7), 12)
            if rng.random() < 0.04:
                d += int(rng.integers(15, 46))
            return d
        if perfil == "lento":
            return int(min(10 + rng.exponential(22), 150))
        if rng.random() < 0.22:
            return None
        return int(rng.integers(30, 241))

    pago = {}      # NumFactura → (fecha, medio) del pago completo «normal»
    for r in D.itertuples():
        if r.Serie == "R26":
            continue
        if r.Especial == "bloqueado":
            pago[r.NumFactura] = None
            continue
        d = retraso(r.Perfil, r.FormaPago)
        if r.Especial in ("portugal", "alta"):
            d = int(rng.integers(-3, 4))
        if r.CodCliente == FAVOR:
            d = 0
        if d is None:
            pago[r.NumFactura] = None
            continue
        f = siguiente_laborable(max(r.Vencimiento + dt.timedelta(days=d), r.FechaFactura))
        if r.Serie == "F25":
            f = max(f, siguiente_laborable(dt.date(2026, 1, 2) + dt.timedelta(days=int(rng.integers(0, 90)))))
        pago[r.NumFactura] = (f, medio_de(r.FormaPago))
    # F25: 14 siguen pendientes (las de los morosos), 4 de ellas con un pago parcial
    f25_idx = D[D["Serie"] == "F25"].index[:14]
    for k, i in enumerate(f25_idx):
        n = D.loc[i, "NumFactura"]
        pago[n] = None
        if k < 4:
            D.loc[i, "Especial"] = "f25parcial"
        else:
            D.loc[i, "Especial"] = "f25pend"
    for n in D.loc[(D["Serie"] == "F25") & (D["Especial"] == "f25"), "NumFactura"]:
        if pago[n] is None or pago[n][0] > dt.date(2026, 4, 30):
            pago[n] = (siguiente_laborable(dt.date(2026, 1, 12) + dt.timedelta(days=int(rng.integers(0, 100)))), "Transferencia")
    # el cliente con saldo a favor lo tiene todo cobrado
    for n in D.loc[D["CodCliente"] == FAVOR, "NumFactura"]:
        if not n.startswith("R26"):
            f = D.loc[D["NumFactura"] == n, "FechaFactura"].iloc[0]
            pago[n] = (siguiente_laborable(f + dt.timedelta(days=int(rng.integers(0, 4)))), "Cheque")

    tot = D.set_index("NumFactura")["Total"].to_dict()
    base_cuota = {n: r2(b + c) for n, b, c in zip(D["NumFactura"], D["Base"], D["Cuota"])}
    nombre = {c: cli.loc[c, "Nombre"] for c in cl["CodCliente"]}
    doc_cli = D.set_index("NumFactura")["CodCliente"].to_dict()
    doc_fecha = D.set_index("NumFactura")["FechaFactura"].to_dict()
    doc_venc = D.set_index("NumFactura")["Vencimiento"].to_dict()
    usados = set()

    def cobro(fecha, cod, importe, numfac, concepto, medio, tipo, remesa="", refs=None):
        cobros.append(dict(FechaCobro=fecha, CodCliente=cod, Importe=r2(importe), NumFactura=numfac,
                           Concepto=concepto, Medio=medio, Remesa=remesa, Tipo=tipo, Refs=refs or ([numfac] if numfac else [])))

    def pagable(n, hasta=CORTE):
        p = pago.get(n)
        return p is not None and p[0] <= hasta

    # (a) 18 devoluciones de recibo
    rec = D[(D["FormaPago"].str.startswith("Recibo")) & (D["Serie"] == "F26") & (D["Especial"] == "")]
    lentos = rec[rec["Perfil"] != "puntual"]
    cand16 = lentos[lentos["Vencimiento"].between(dt.date(2026, 3, 1), dt.date(2026, 10, 20))]
    dev16 = list(rng.choice(cand16["NumFactura"].to_numpy(), size=16, replace=False))
    cand2 = rec[rec["Vencimiento"].between(dt.date(2026, 10, 26), dt.date(2026, 10, 30))]
    dev2 = list(rng.choice(cand2["NumFactura"].to_numpy(), size=2, replace=False))
    for k, n in enumerate(dev16 + dev2):
        usados.add(n)
        D.loc[D["NumFactura"] == n, "Especial"] = "devolucion"
        f1 = siguiente_laborable(doc_venc[n])
        if k < 16:
            f2 = siguiente_laborable(f1 + dt.timedelta(days=int(rng.integers(3, 9))))
            f2 = min(f2, dt.date(2026, 10, 30))
        else:
            f1 = dt.date(2026, 10, 30)
            f2 = siguiente_laborable(dt.date(2026, 11, 3) + dt.timedelta(days=k - 16))
        rem = f"REM-2026-{f1.strftime('%m%d')}"
        cobro(f1, doc_cli[n], tot[n], n, f"COBRO RECIBO {n} {rem}", "Recibo", "recibo", rem)
        motivo = ["SALDO INSUFICIENTE", "ORDEN DEL TITULAR", "CUENTA CANCELADA"][int(rng.integers(3))]
        cobro(f2, doc_cli[n], -tot[n], n, f"DEVOLUCION RECIBO {n} {motivo}", "Recibo", "devolucion", rem)
        if k < 4:                       # se vuelven a cobrar antes del corte
            f3 = siguiente_laborable(f2 + dt.timedelta(days=int(rng.integers(5, 20))))
            if f3 > CORTE:
                f3 = dt.date(2026, 10, 30)
            cobro(f3, doc_cli[n], tot[n], n, f"TRANSF. {banco(nombre[doc_cli[n]])} PAGO RECIBO DEVUELTO {n}",
                  "Transferencia", "repago")
        elif k < 6:                     # se vuelven a cobrar en noviembre (no cuentan)
            f3 = siguiente_laborable(dt.date(2026, 11, 4) + dt.timedelta(days=int(rng.integers(0, 7))))
            cobro(f3, doc_cli[n], tot[n], n, f"TRANSF. {banco(nombre[doc_cli[n]])} PAGO RECIBO DEVUELTO {n}",
                  "Transferencia", "repago")
    # (b) 25 cobros directos parciales
    trans = D[(D["FormaPago"].str.startswith("Transferencia")) & (D["Serie"] == "F26") & (D["Especial"] == "")]
    cand = [n for n in trans["NumFactura"] if pagable(n) and n not in usados and doc_fecha[n] >= dt.date(2026, 4, 1)]
    parc = list(rng.choice(cand, size=25, replace=False))
    for k, n in enumerate(parc):
        usados.add(n)
        D.loc[D["NumFactura"] == n, "Especial"] = "parcial"
        imp = r2(tot[n] * float(rng.uniform(0.25, 0.8)))
        if rng.random() < 0.4:
            imp = float(max(100, int(tot[n] * 0.5 / 100) * 100))
        f = pago[n][0]
        cobro(f, doc_cli[n], imp, n, f"TRANSF. {banco(nombre[doc_cli[n]])} PAGO PARCIAL FRA {n}", "Transferencia", "parcial")
        if k < 8:
            f2 = siguiente_laborable(dt.date(2026, 11, 2) + dt.timedelta(days=int(rng.integers(0, 10))))
            cobro(f2, doc_cli[n], tot[n] - imp, n, f"TRANSF. {banco(nombre[doc_cli[n]])} RESTO FRA {n}",
                  "Transferencia", "resto_nov")
    # 4 F25 con pago parcial en 2026
    for n in D.loc[D["Especial"] == "f25parcial", "NumFactura"]:
        usados.add(n)
        f = siguiente_laborable(dt.date(2026, 2, 2) + dt.timedelta(days=int(rng.integers(0, 120))))
        cobro(f, doc_cli[n], float(int(tot[n] * 0.4 / 100) * 100), n,
              f"TRANSF. {banco(nombre[doc_cli[n]])} A CUENTA FRA {n}", "Transferencia", "parcial")
    # la factura de los 100 €: el cliente paga Base + Cuota
    n = D.loc[D["Especial"] == "cien", "NumFactura"].iloc[0]
    usados.add(n)
    pago[n] = (siguiente_laborable(doc_venc[n]), "Transferencia")
    cobro(pago[n][0], doc_cli[n], base_cuota[n], n, f"TRANSF. {banco(nombre[doc_cli[n]])} FRA {n}", "Transferencia", "cien")
    # (c) 60 cobros agrupados (16 con abono), 5 de ellos parciales
    grupos = []
    agr = D[(D["Serie"] == "F26") & (D["Especial"] == "") & ~D["FormaPago"].str.startswith("Recibo")]
    agr = agr[[pagable(n) and n not in usados for n in agr["NumFactura"]]]
    por_cli = {c: g.sort_values("FechaFactura")["NumFactura"].tolist() for c, g in agr.groupby("CodCliente")}
    ab_comp = D[(D["Serie"] == "R26") & (D["CodCliente"] != FAVOR)].sort_values("FechaFactura")
    ab_comp = ab_comp[ab_comp["CodCliente"].isin([c for c, v in por_cli.items() if len(v) >= 2])]
    ab_lista = list(ab_comp["NumFactura"])
    for a in ab_lista:
        if len(grupos) == 16:
            break
        c = doc_cli[a]
        posibles = [n for n in por_cli[c] if n not in usados and doc_fecha[n] >= doc_fecha[a] - dt.timedelta(days=75)
                    and pago[n][0] >= doc_fecha[a]]
        if not posibles:
            continue
        k = int(rng.integers(1, min(3, len(posibles)) + 1))
        sel = posibles[:k]
        tot_sel = sum(tot[n] for n in sel)
        if tot_sel + tot[a] <= 0:
            continue
        for n in sel:
            usados.add(n)
        usados.add(a)
        f = max(pago[n][0] for n in sel)
        grupos.append(dict(cli=c, docs=sel + [a], fecha=f, parcial=False))
    ab_lista = [g["docs"][-1] for g in grupos]
    assert len(grupos) == 16, len(grupos)
    clientes_multi = [c for c, v in por_cli.items() if len([n for n in v if n not in usados]) >= 2]
    rng.shuffle(clientes_multi)
    i_c = 0
    while len(grupos) < 60:
        c = clientes_multi[i_c % len(clientes_multi)]
        i_c += 1
        libres_c = [n for n in por_cli[c] if n not in usados]
        if len(libres_c) < 2:
            continue
        j = int(rng.integers(0, len(libres_c) - 1))
        k = int(rng.integers(2, 5))
        sel = libres_c[j:j + k]
        if len(sel) < 2 or (pago[sel[-1]][0] - pago[sel[0]][0]).days > 45:
            continue
        if len({doc_fecha[n] for n in sel}) < len(sel):
            continue
        for n in sel:
            usados.add(n)
        grupos.append(dict(cli=c, docs=sel, fecha=max(pago[n][0] for n in sel), parcial=False))
    parciales = [g for g in grupos[16:] if g["fecha"] <= dt.date(2026, 10, 15)][:5]
    for g in parciales:
        g["parcial"] = True
    plantillas = ["TRANSF. {n} FRAS {r}", "{n} PAGO FACTURAS {r}", "TRF {n} {r}", "TRANSFERENCIA {n} FRAS. {r}"]
    for g in grupos:
        refs = g["docs"]
        total_g = sum(tot[n] for n in refs)
        if g["parcial"]:
            ult = refs[-1]
            total_g = r2(total_g - tot[ult] * float(rng.uniform(0.2, 0.8)))
            for n in refs:
                D.loc[D["NumFactura"] == n, "Especial"] = "agrupada_parcial"
        else:
            for n in refs:
                D.loc[D["NumFactura"] == n, "Especial"] = "agrupada"
        estilo = int(rng.integers(4))
        if estilo == 0:
            rtxt = " ".join(refs)
        elif estilo == 1:
            rtxt = ", ".join(refs[:-1]) + " Y " + refs[-1]
        elif estilo == 2:
            rtxt = "/".join(refs)
        else:
            rtxt = ", ".join(refs)
        medio = "Confirming" if cli.loc[g["cli"], "FormaPago"].startswith("Confirming") else "Transferencia"
        cobro(g["fecha"], g["cli"], total_g, "", plantillas[estilo].format(n=banco(nombre[g["cli"]]), r=rtxt),
              medio, "agrupado_parcial" if g["parcial"] else "agrupado", refs=refs)
    # (d) cobros normales (directos) de lo que queda
    plant1 = ["TRANSF. {n} FRA {f}", "TRANSFERENCIA {n} FACTURA {f}", "TRF {n} PAGO {f}"]
    normales = []
    for r in D.itertuples():
        if r.Serie == "R26" or r.NumFactura in usados:
            continue
        p = pago[r.NumFactura]
        if p is None or p[0] > FIN_COBROS:
            continue
        f, medio = p
        n = r.NumFactura
        if medio == "Recibo":
            rem = f"REM-2026-{f.strftime('%m%d')}" if f.year == 2026 else ""
            txt = f"COBRO RECIBO {n} {rem}".strip()
        elif medio == "Confirming":
            txt = f"CONFIRMING {banco(nombre[r.CodCliente])} VTO {r.Vencimiento.strftime('%d/%m/%y')} FRA {n}"
            rem = ""
        elif medio == "Cheque":
            txt = f"INGRESO CHEQUE {banco(nombre[r.CodCliente])} FRA {n}"
            rem = ""
        else:
            txt = plant1[int(rng.integers(3))].format(n=banco(nombre[r.CodCliente]), f=n)
            rem = ""
        cobro(f, r.CodCliente, r.Total, n, txt, medio, "directo", rem)
        normales.append(len(cobros) - 1)
    # (e) 71 cobros de una factura con el número solo en el concepto
    cand = [i for i in normales if cobros[i]["Medio"] == "Transferencia"]
    for i in rng.choice(cand, size=71, replace=False):
        cobros[i]["NumFactura"] = ""
        cobros[i]["Tipo"] = "concepto"
    # (f) 9 entregas a cuenta
    C = pd.DataFrame(cobros)
    pend_cli = pendiente_por_cliente(D, C)
    cand = [c for c, v in pend_cli.items() if v > 9000 and c not in (BLOQ, FAVOR, "C0321", "C0322", "C0323")]
    acta = list(rng.choice(sorted(cand), size=9, replace=False))
    txts = ["ENTREGA A CUENTA {n}", "TRANSF. {n} A CUENTA", "PAGO A CUENTA SALDO {n}"]
    for k, c in enumerate(acta):
        imp = float(rng.choice([1000, 1500, 2000, 2500, 3000, 4000, 5000]))
        imp = min(imp, float(int(pend_cli[c] * 0.5 / 500) * 500))
        f = siguiente_laborable(dt.date(2026, 9, 1) + dt.timedelta(days=int(rng.integers(0, 58))))
        cobro(f, c, imp, "", txts[k % 3].format(n=banco(nombre[c])), "Transferencia", "a_cuenta", refs=[])
    C = pd.DataFrame(cobros).sort_values(["FechaCobro", "Tipo"], kind="mergesort").reset_index(drop=True)
    C["IdCobro"] = [f"CB-{i:05d}" for i in range(1, len(C) + 1)]
    return cl, D, C, dict(BLOQ=BLOQ, FAVOR=FAVOR, acta=acta, red=list(D.loc[red, "NumFactura"]),
                           cien=D.loc[cien, "NumFactura"])


def aplicar(D, C, corte=CORTE):
    """Cobrado de cada documento a la fecha de corte, con la regla de Marta."""
    tot = D.set_index("NumFactura")["Total"]
    fecha = D.set_index("NumFactura")["FechaFactura"]
    cobrado = pd.Series(0.0, index=tot.index)
    Cc = C[C["FechaCobro"] <= corte]
    for r in Cc.itertuples():
        if r.Tipo == "a_cuenta":
            continue
        refs = r.Refs
        if len(refs) == 1 and r.Tipo != "agrupado_parcial":
            cobrado[refs[0]] += r.Importe
            continue
        suma = sum(tot[n] for n in refs)
        if suma <= r.Importe + 0.005:
            for n in refs:
                cobrado[n] += tot[n]
        else:
            resto = r.Importe
            for n in sorted(refs, key=lambda x: (fecha[x], x)):
                a = max(0.0, min(tot[n], resto))
                cobrado[n] += a
                resto -= a
    return cobrado.round(2)


def pendiente_por_cliente(D, C):
    cob = aplicar(D, C)
    p = (D.set_index("NumFactura")["Total"] - cob).round(2)
    return p.groupby(D.set_index("NumFactura")["CodCliente"]).sum().round(2).to_dict()


def resumen(cl, D, C):
    cob = aplicar(D, C)
    X = D.set_index("NumFactura").copy()
    X["Cobrado"] = cob
    X["Pendiente"] = (X["Total"] - X["Cobrado"]).round(2)
    X["DiasVencidos"] = [(CORTE - v).days for v in X["Vencimiento"]]
    X["Tramo"] = [tramo(d) for d in X["DiasVencidos"]]
    return X


# ===========================================================================
# 3. CALIBRACIÓN (dos pasadas con la misma semilla) Y LÍMITES DE RIESGO
# ===========================================================================
K = 1.0
for _ in range(3):
    cl, D, C, esp = construir(K)
    X = resumen(cl, D, C)
    pend = X["Pendiente"].sum()
    K = K * OBJ_PENDIENTE / pend
cl, D, C, esp = construir(K)
X = resumen(cl, D, C)
BLOQ, FAVOR = esp["BLOQ"], esp["FAVOR"]
acta_cli = C[(C["Tipo"] == "a_cuenta") & (C["FechaCobro"] <= CORTE)].groupby("CodCliente")["Importe"].sum()
saldo_bruto = X.groupby("CodCliente")["Pendiente"].sum().round(2)
saldo_neto = (saldo_bruto - acta_cli.reindex(saldo_bruto.index).fillna(0)).round(2)
facturado = D.groupby("CodCliente")["Total"].sum()

rngL = np.random.default_rng(SEED + 1)
limites = {}
for c in cl["CodCliente"]:
    s = max(saldo_bruto.get(c, 0.0), 0.0)
    mensual = facturado.get(c, 0.0) / 10
    lim = max(s * float(rngL.uniform(1.3, 2.4)), mensual * 2.5, 3000)
    limites[c] = float(int(np.ceil(lim / 1000.0)) * 1000)
grandes = saldo_neto[(saldo_neto > 20000) & (~saldo_neto.index.isin([BLOQ, FAVOR, "C0322", "C0323", "C0321"]))]
excesos = [BLOQ] + list(rngL.choice(sorted(grandes.index), size=3, replace=False))
for c in excesos:
    s = saldo_neto[c]
    limites[c] = float(int(s * float(rngL.uniform(0.62, 0.88)) / 1000) * 1000)
for c in cl["CodCliente"]:
    if c not in excesos:
        assert max(saldo_bruto.get(c, 0), saldo_neto.get(c, 0)) <= 0.95 * limites[c], c
cl["LimiteRiesgo"] = cl["CodCliente"].map(limites)
for c, minimo in (("C0322", 6000.0), ("C0323", 9000.0)):     # altas nuevas: límite inicial prudente
    lim = max(minimo, float(np.ceil(max(saldo_bruto.get(c, 0.0), 0.0) * 1.5 / 1000.0) * 1000))
    cl.loc[cl["CodCliente"] == c, "LimiteRiesgo"] = lim
    limites[c] = lim
for c in ("C0322", "C0323"):
    assert saldo_bruto.get(c, 0) <= 0.95 * cl.loc[cl["CodCliente"] == c, "LimiteRiesgo"].iloc[0]
supera = sorted(c for c in cl["CodCliente"] if saldo_neto.get(c, 0) > limites[c])
supera_bruto = sorted(c for c in cl["CodCliente"] if saldo_bruto.get(c, 0) > limites[c])
assert supera == sorted(excesos) == supera_bruto, (supera, excesos)

# ===========================================================================
# 4. TOTALES DE CONTROL (datos verdaderos)
# ===========================================================================
acta_total = r2(C.loc[(C["Tipo"] == "a_cuenta") & (C["FechaCobro"] <= CORTE), "Importe"].sum())
pend_total = r2(X["Pendiente"].sum())
saldo_430 = r2(pend_total - acta_total)
por_tramo = X.groupby("Tramo")["Pendiente"].sum().round(2).reindex([t for _, t in TRAMOS]).fillna(0)
venc60_cli = X[X["DiasVencidos"] > 60].groupby("CodCliente")["Pendiente"].sum().round(2).sort_values(ascending=False)
nombre = cl.set_index("CodCliente")["Nombre"]
ini_pmc = dt.date(2026, 8, 1)
fact_pmc = r2(D.loc[D["FechaFactura"].between(ini_pmc, CORTE), "Total"].sum())
dias_pmc = (CORTE - ini_pmc).days + 1
pmc = saldo_430 / fact_pmc * dias_pmc
X["Plazo"] = [(v - f).days for v, f in zip(X["Vencimiento"], X["FechaFactura"])]
estado = np.select([X["Pendiente"].abs() < 0.005, X["Pendiente"] < 0, (X["Pendiente"] - X["Total"]).abs() < 0.005],
                   ["Cobrada", "Saldo a favor", "Pendiente"], "Parcial")
X["Estado"] = estado
bloq_tras = X[(X["CodCliente"] == BLOQ) & (X["FechaFactura"] > BLOQUEO)]
verdad = dict(
    corte=str(CORTE), K=K,
    n_documentos=int(len(D)), n_f26=int((D["Serie"] == "F26").sum()), n_r26=int((D["Serie"] == "R26").sum()),
    n_f25=int((D["Serie"] == "F25").sum()),
    suma_base=r2(D["Base"].sum()), suma_cuota=r2(D["Cuota"].sum()), suma_total=r2(D["Total"].sum()),
    dif_total_base_cuota=r2(D["Total"].sum() - D["Base"].sum() - D["Cuota"].sum()),
    pendiente_total=pend_total, a_cuenta_total=acta_total, saldo_430=saldo_430,
    a_cuenta_n=int(((C["Tipo"] == "a_cuenta") & (C["FechaCobro"] <= CORTE)).sum()),
    cobrado_total=r2(X["Cobrado"].sum()),
    por_tramo={k: float(v) for k, v in por_tramo.items()},
    pct_tramo={k: round(float(v) / pend_total, 4) for k, v in por_tramo.items()},
    vencido_total=r2(X.loc[X["DiasVencidos"] > 0, "Pendiente"].sum()),
    vencido_mas60=r2(X.loc[X["DiasVencidos"] > 60, "Pendiente"].sum()),
    top10_mas60=[[c, nombre[c], float(v)] for c, v in venc60_cli.head(10).items()],
    supera_limite=[[c, nombre[c], float(saldo_neto[c]), limites[c], r2(saldo_neto[c] - limites[c])] for c in supera],
    clientes_mas60_dias=sorted(cl.loc[cl["DiasPago"] > 60, "CodCliente"].tolist()),
    facturas_plazo_mas60=int((X["Plazo"] > 60).sum()),
    pendiente_plazo_mas60=r2(X.loc[X["Plazo"] > 60, "Pendiente"].sum()),
    saldo_favor=[[c, nombre[c], float(v)] for c, v in saldo_neto.items() if v < 0],
    facturacion_ago_oct=fact_pmc, dias_pmc=dias_pmc, pmc=round(pmc, 1),
    bloqueado=[BLOQ, nombre[BLOQ], int(len(bloq_tras)), r2(bloq_tras["Total"].sum()), r2(bloq_tras["Pendiente"].sum())],
    estados={k: int(v) for k, v in X["Estado"].value_counts().items()},
    cien=esp["cien"], redondeo=esp["red"], favor=FAVOR, a_cuenta_clientes=esp["acta"],
    n_cobros=int(len(C)), n_cobros_nov=int((C["FechaCobro"] > CORTE).sum()),
    cobros_nov_importe=r2(C.loc[C["FechaCobro"] > CORTE, "Importe"].sum()),
)

# ===========================================================================
# 5. ENSUCIAR Y ESCRIBIR LOS ARCHIVOS
# ===========================================================================
rngS = np.random.default_rng(SEED + 2)
log = []


def num_coma(x):
    return f"{x:.2f}".replace(".", ",")


def fecha_es(d):
    return d.strftime("%d/%m/%Y")


F = D.sort_values(["FechaFactura", "NumFactura"]).reset_index(drop=True)
filas = []
for r in F.itertuples():
    filas.append(dict(NumFactura=r.NumFactura, FechaFactura=fecha_es(r.FechaFactura), CodCliente=r.CodCliente,
                      NombreCliente=nombre[r.CodCliente], BaseImponible=num_coma(r.Base), TipoIVA=str(r.TipoIVA),
                      CuotaIVA=num_coma(r.Cuota), TotalFactura=f"{r.Total:.2f}", FormaPago=r.FormaPago,
                      FechaVencimiento=fecha_es(r.Vencimiento), _esp=r.Especial, _fecha=r.FechaFactura))
for i, f in enumerate(filas):
    if f["NumFactura"] in esp["red"]:
        log.append(("facturas", f["NumFactura"], "TotalFactura", "Q17 redondeo ±0,01", "", f["TotalFactura"]))
    if f["NumFactura"] == esp["cien"]:
        log.append(("facturas", f["NumFactura"], "TotalFactura", "Q17 +100,00 €", "", f["TotalFactura"]))
libres = [i for i, f in enumerate(filas) if f["_esp"] not in ("dup",) and not f["NumFactura"].startswith("R")]
# Q07: tanda de 90 filas seguidas con fechas ISO (desde la primera factura del 09/03/2026)
ini = next(i for i, f in enumerate(filas) if f["_fecha"] >= dt.date(2026, 3, 9))
iso = set(range(ini, ini + 90))
for i in iso:
    f = filas[i]
    for col in ("FechaFactura", "FechaVencimiento"):
        v = f[col]
        f[col] = dt.datetime.strptime(v, "%d/%m/%Y").strftime("%Y-%m-%d")
        log.append(("facturas", f["NumFactura"], col, "Q07 fecha ISO", v, f[col]))
# Q09: 120 vencimientos vacíos
pool = [i for i in libres if i not in iso]
vac = set(rngS.choice(pool, size=120, replace=False).tolist())
for i in vac:
    log.append(("facturas", filas[i]["NumFactura"], "FechaVencimiento", "Q09 vacío", filas[i]["FechaVencimiento"], ""))
    filas[i]["FechaVencimiento"] = ""
# Q16: C0O45
c45 = [i for i, f in enumerate(filas) if f["CodCliente"] == "C0045" and f["_esp"] != "dup"]
assert len(c45) >= 3, len(c45)
for i in rngS.choice(c45, size=3, replace=False):
    filas[i]["CodCliente"] = "C0O45"
    log.append(("facturas", filas[i]["NumFactura"], "CodCliente", "Q16 errata O por 0", "C0045", "C0O45"))
# Q04: 37 códigos con espacios al final
pool = [i for i, f in enumerate(filas) if f["_esp"] != "dup" and f["CodCliente"] != "C0O45"]
for i in rngS.choice(pool, size=37, replace=False):
    v = filas[i]["CodCliente"]
    filas[i]["CodCliente"] = v + (" " if rngS.random() < 0.7 else "  ")
    log.append(("facturas", filas[i]["NumFactura"], "CodCliente", "Q04 espacios al final", v, filas[i]["CodCliente"]))
# Q01: dos tandas de exportación que se solapan el 01/07 y el 02/07
fin_a = max(i for i, f in enumerate(filas) if f["_fecha"] <= dt.date(2026, 7, 2))
ini_b = min(i for i, f in enumerate(filas) if f["_fecha"] >= dt.date(2026, 7, 1))
assert fin_a - ini_b + 1 == 14
salida = filas[:fin_a + 1] + filas[ini_b:]
for f in filas[ini_b:fin_a + 1]:
    log.append(("facturas", f["NumFactura"], "(fila entera)", "Q01 duplicado exacto (exportación solapada)", "", ""))
cols_f = ["NumFactura", "FechaFactura", "CodCliente", "NombreCliente", "BaseImponible", "TipoIVA", "CuotaIVA",
          "TotalFactura", "FormaPago", "FechaVencimiento"]
sb = sum(float(f["BaseImponible"].replace(",", ".")) for f in salida)
sc = sum(float(f["CuotaIVA"].replace(",", ".")) for f in salida)
st = sum(float(f["TotalFactura"]) for f in salida)
total_row = dict(NumFactura="TOTAL GENERAL", FechaFactura="", CodCliente="", NombreCliente="", BaseImponible=num_coma(sb),
                 TipoIVA="", CuotaIVA=num_coma(sc), TotalFactura=f"{st:.2f}", FormaPago="", FechaVencimiento="")
log.append(("facturas", "TOTAL GENERAL", "(fila entera)", "Q10 fila de total", "", f"{st:.2f}"))
with open(CSV_FAC, "w", encoding="utf-8", newline="") as fh:     # UTF-8 SIN BOM (Q19)
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(cols_f)
    for f in salida + [total_row]:
        w.writerow([f[c] for c in cols_f])
n_filas_fac = len(salida) + 1
assert n_filas_fac == 2651, n_filas_fac

# cobros
C = C.reset_index(drop=True)
vacios_cli = rngS.choice(C.index[(C["Tipo"] != "a_cuenta")], size=35, replace=False)
cols_c = ["IdCobro", "FechaCobro", "CodCliente", "Importe", "NumFactura", "Concepto", "Medio", "Remesa"]
with open(CSV_COB, "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(cols_c)
    for i, r in C.iterrows():
        cod = "" if i in set(vacios_cli) else r["CodCliente"]
        if cod == "":
            log.append(("cobros", r["IdCobro"], "CodCliente", "CodCliente vacío", r["CodCliente"], ""))
        if r["NumFactura"] == "":
            log.append(("cobros", r["IdCobro"], "NumFactura", f"vacío ({r['Tipo']})", " ".join(r["Refs"]), ""))
        if r["Tipo"] == "devolucion":
            log.append(("cobros", r["IdCobro"], "Importe", "Q14 devolución de recibo", "", num_coma(r["Importe"])))
        w.writerow([r["IdCobro"], fecha_es(r["FechaCobro"]), cod, num_coma(r["Importe"]), r["NumFactura"],
                    r["Concepto"], r["Medio"], r["Remesa"]])
assert (C["NumFactura"] == "").sum() == 140, (C["NumFactura"] == "").sum()
assert (C["Tipo"] == "agrupado").sum() + (C["Tipo"] == "agrupado_parcial").sum() == 60
assert (C["Tipo"] == "agrupado_parcial").sum() == 5 and (C["Tipo"] == "devolucion").sum() == 18
assert (C["Tipo"] == "concepto").sum() == 71 and (C["Tipo"] == "a_cuenta").sum() == 9

with open(LOG, "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["archivo", "fila_clave", "columna", "problema", "valor_verdadero", "valor_sembrado"])
    w.writerows(log)

# ===========================================================================
# 6. LIBRO p3-datos.xlsx
# ===========================================================================
import xlsxwriter  # noqa: E402

INSTRUCCIONES = [
    ("t", "P3 · Facturas, cobros y antigüedad de saldos"),
    ("s", "Electro Cierzo Suministros, S.L. · Administración y finanzas · Encargo de Marta Ruiz (13/11/2026)"),
    ("", ""),
    ("h", "Qué hay que conseguir"),
    ("", "Cuánto nos deben los clientes a 31/10/2026, desde cuándo (tramos de antigüedad desde el vencimiento) y quiénes"),
    ("", "preocupan (top 10 vencido a más de 60 días y clientes por encima de su límite de riesgo), con los plazos de más de"),
    ("", "60 días que no permite la Ley 3/2004 y el periodo medio de cobro. Una página en PDF para el comité y el Excel con el detalle."),
    ("", "Y que el mes que viene se actualice en una hora: sustituir los CSV, Actualizar todo y cambiar la fecha de corte."),
    ("", ""),
    ("h", "Qué te llega"),
    ("", "1. p3-facturas-emitidas.csv: el listado de facturas que saca el ERP (UTF-8, separador punto y coma)."),
    ("", "2. p3-cobros-2026.csv: los cobros de 2026 que pasa contabilidad, exportados el 13/11/2026 (UTF-8, punto y coma)."),
    ("", "3. Este libro (p3-datos.xlsx), con estas hojas:"),
    ("", "      Clientes: el maestro de clientes exportado el 30/09/2026 (días de pago pactados, límite de riesgo y estado)."),
    ("", "      Altas_ERP: las fichas de los clientes dados de alta en el ERP en octubre."),
    ("", "      Contabilidad: el saldo de la cuenta 430 (Clientes) a 31/10/2026 según el mayor. Es la cifra con la que hay que cuadrar."),
    ("", ""),
    ("h", "Cómo trabajar (resumen; el plan completo está en la guía)"),
    ("", "1. Lee el correo de Marta y escribe tus preguntas antes de empezar. Mira las respuestas en la guía."),
    ("", "2. Guarda los originales sin tocar en una carpeta Clientes/2026-10/ y trabaja en tu propio libro."),
    ("", "3. Importa los dos CSV con Datos > Obtener datos > De texto/CSV (Origen del archivo: 65001: Unicode (UTF-8); delimitador: punto y coma)."),
    ("", "   No los abras con doble clic: las tildes y los importes pueden salir mal."),
    ("", "4. Perfila y limpia. Anota cada problema en una hoja «Calidad de datos» (problema, filas afectadas, decisión)."),
    ("", "5. Calcula el vencimiento que falta, aplica los cobros hasta la fecha de corte, el pendiente, los días vencidos y el tramo."),
    ("", "6. Monta el informe (tabla dinámica con segmentaciones, top 10, riesgo, Ley 3/2004, PMC), los controles y el Léame."),
    ("", ""),
    ("h", "Cómo comprobar tu trabajo"),
    ("", "Σ pendiente de tus facturas − Σ cobros a cuenta sin aplicar = saldo 430 de la hoja Contabilidad (diferencia 0,00 €)."),
    ("", "Además: el total por tramos = el total del detalle, y Σ Total − Σ cobrado = Σ pendiente. En la guía tienes más totales de control."),
    ("", ""),
    ("h", "Avisos"),
    ("", "No modifiques este libro ni los CSV: son los datos de origen. Importes en euros CON IVA. Fecha de corte: 31/10/2026."),
    ("", "Todos los nombres, NIF y cifras son inventados. Power Query está en Excel para Microsoft 365 y en Excel 2016 o posterior (Windows)."),
]

wb = xlsxwriter.Workbook(XLSX)
wb.set_properties({"title": "P3 · Datos de partida", "author": "Electro Cierzo Suministros (ficticia)",
                   "comments": "Datos inventados para «Hoja a hoja»."})
f_t = wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F3864"})
f_s = wb.add_format({"italic": True, "font_color": "#595959"})
f_h = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "bottom": 1})
f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"})
f_txt = wb.add_format({"num_format": "@"})
f_eur = wb.add_format({"num_format": "#,##0.00"})
f_eur_b = wb.add_format({"num_format": "#,##0.00", "bold": True, "bg_color": "#FFF2CC", "border": 1})
f_fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
f_int = wb.add_format({"num_format": "0"})
ws = wb.add_worksheet("Instrucciones")
ws.hide_gridlines(2)
ws.set_column("A:A", 130)
for i, (tipo, texto) in enumerate(INSTRUCCIONES):
    fmt = {"t": f_t, "s": f_s, "h": f_h}.get(tipo)
    ws.write_string(i, 0, texto, fmt) if fmt else ws.write_string(i, 0, texto)
ws.activate()

COLS_CLI = ["CodCliente", "Nombre", "NIF", "Poblacion", "Provincia", "Delegacion", "CodComercial", "DiasPago",
            "LimiteRiesgo", "Estado", "Observaciones"]
ANCHOS = {"CodCliente": 11, "Nombre": 44, "NIF": 13, "Poblacion": 24, "Provincia": 17, "Delegacion": 11,
          "CodComercial": 13, "DiasPago": 9, "LimiteRiesgo": 13, "Estado": 10, "Observaciones": 60}


def hoja_clientes(nombre_hoja, df):
    w = wb.add_worksheet(nombre_hoja)
    w.freeze_panes(1, 0)
    for j, col in enumerate(COLS_CLI):
        w.write_string(0, j, col, f_cab)
        w.set_column(j, j, ANCHOS[col], {"LimiteRiesgo": f_eur, "DiasPago": f_int}.get(col))
    for i, r in enumerate(df[COLS_CLI].itertuples(index=False), start=1):
        for j, v in enumerate(r):
            col = COLS_CLI[j]
            if col in ("DiasPago", "LimiteRiesgo"):
                w.write_number(i, j, float(v))
            elif v != "":
                w.write_string(i, j, str(v), f_txt if col in ("CodCliente", "NIF", "CodComercial") else None)
    w.autofilter(0, 0, len(df), len(COLS_CLI) - 1)
    return w


hoja_clientes("Clientes", cl[cl["CodCliente"] <= "C0321"])
w = hoja_clientes("Altas_ERP", cl[cl["CodCliente"].isin(["C0322", "C0323"])])
w.write_string(4, 0, "Fichas creadas en el ERP en octubre de 2026 (C0322 el 05/10 y C0323 el 14/10). No estaban cuando se exportó «Clientes».", f_s)
w = wb.add_worksheet("Contabilidad")
w.set_column("A:A", 62)
w.set_column("B:B", 18)
w.write_string(0, 0, "Mayor de la cuenta 430 · Clientes (contabilidad)", f_h)
w.write_string(2, 0, "Saldo deudor de la cuenta 430 a 31/10/2026 (€, con IVA)")
w.write_number(2, 1, saldo_430, f_eur_b)
w.write_string(4, 0, "Incluye todas las facturas y abonos contabilizados hasta el 31/10/2026 y los cobros recibidos hasta esa fecha,", f_s)
w.write_string(5, 0, "también las entregas a cuenta, que contabilidad abona en la 430 de cada cliente aunque no citen ninguna factura.", f_s)
w.write_string(6, 0, "Dato facilitado por contabilidad el 13/11/2026.", f_s)
wb.close()

with open(os.path.join(LIBROS, "p3-datos.meta.json"), "w", encoding="utf-8") as fh:
    json.dump({"titulo": "P3 · Facturas, cobros y antigüedad de saldos (datos de partida)",
               "descripcion": "Maestro de clientes, altas de octubre y saldo de la cuenta 430 a 31/10/2026; las facturas y los cobros vienen en dos CSV aparte.",
               "nivel": "n6"}, fh, ensure_ascii=False, indent=2)
with open(VERDAD, "w", encoding="utf-8") as fh:
    json.dump(verdad, fh, ensure_ascii=False, indent=1, default=str)

print(json.dumps({k: verdad[k] for k in ["n_documentos", "dif_total_base_cuota", "pendiente_total", "a_cuenta_total",
                                         "saldo_430", "pct_tramo", "por_tramo", "vencido_mas60", "pmc", "supera_limite",
                                         "saldo_favor", "bloqueado", "estados", "n_cobros", "n_cobros_nov",
                                         "facturas_plazo_mas60", "K"]}, ensure_ascii=False, indent=1))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P4 · Conciliación bancaria mensual (Finanzas) · generador de los datos de partida.

Salida (semilla fija, se puede regenerar igual cuantas veces se quiera):
  libros/p4-datos.xlsx       Instrucciones, Movimientos, Movimientos (2), Mayor_572000001,
                             Pendientes_septiembre, Prestamo
  libros/p4-noviembre.xlsx   para el «cambio inesperado» (movimientos del 01/11 al 06/11/2026)
  libros/src/p4-log-suciedad.csv   cada problema sembrado (archivo, hoja, fila, columna, problema, valor)

Las partidas de conciliación están DISEÑADAS (research/proyectos.md, ficha P4):
  S1  cheque nº 1187 (−2.350,00) contabilizado el 28/09, cargado el 06/10      → pendiente de septiembre
  S2  transferencia de cliente (+3.120,00) contabilizada el 30/09, abonada el 01/10 → pendiente de septiembre
  A1  cheque nº 1203 (−4.812,50) del 29/10, sin cobrar                          → solo libros
  A2  transferencia a proveedor del 30/10 que el banco ejecuta el 02/11 (−7.260,00) → solo libros
  A3  cobro contabilizado el 31/10 que llega el 03/11 (+5.445,00)               → solo libros
  B1  comisión de mantenimiento del 31/10 (−45,00)                              → solo banco
  B2  5 comisiones de transferencia (12,40 · 12,40 · 15,10 · 9,80 · 14,20 = −63,90) → solo banco
  B3  cuota 19/48 del préstamo de 85.000 € al 5 % (−1.957,49): operación lunes 26/10, valor domingo 25/10
  B4  devolución del recibo de C0087 (−2.420,00), que iba en la remesa R-2610     → solo banco
  B5  gastos de la devolución (−6,05)                                           → solo banco
  B6  transferencia recibida el 31/10 sin identificar (+1.089,00)                → solo banco
  E1  cobro de 3.630,00 contabilizado dos veces (asientos 2026/3871 y 2026/3872)
  E2  pago cargado por 1.584,00 y contabilizado por 1.548,00 (transposición)
  R1  remesa R-2610: un abono de 18.430,20 en el banco = 23 cobros en libros
  Todo lo demás (171 movimientos) casa uno a uno. Su suma neta sale de los saldos de diseño:
  banco 84.215,37 → 61.482,19 (−22.733,18) y libros 84.985,37 → 61.924,13 (−23.061,24)
  ⇒ Σ(uno a uno) = −36.945,94 por los dos lados.

Problemas de calidad sembrados (códigos de research/proyectos.md §3.5):
  Q11  «Movimientos»: 6 filas de título antes de la tabla (el mayor trae 2).
  Q07  10 fechas de operación guardadas como texto «dd/mm/aaaa» (2 con un espacio al final).
  Q03  importes repetidos legítimos: +121,00 ×4, −605,00 ×3, −48,40 ×5 (el mismo día), −12,40 ×2;
       y −2.350,00 está en septiembre (cheque 1187) y otra vez en octubre (otro pago, el 27/10).
  Q21  nº de factura, de cheque y de remesa dentro del concepto (el banco, en mayúsculas y sin tildes).
  Q14  el mayor trae Debe y Haber en dos columnas (en la 572 el Debe es entrada de dinero).
  Q10  el mayor mezcla las filas «Saldo anterior» y «Sumas del periodo» con los apuntes.
  Trampa: «Movimientos (2)» es otra cuenta (Banco Sur, póliza de crédito) con el mismo formato.
  Una pareja está justo a 5 días (margen pactado ±5 días naturales, el 5 incluido).
  La devolución del recibo lleva «REM. R-2610» en el concepto: si se busca solo «R-2610» en el
  banco, se mezcla con la remesa.
"""
import csv
import datetime as dt
import math
import os
import random
import unicodedata

import pandas as pd
import xlsxwriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
SEMILLA = 2610
D = dt.date

# ---------- cifras de diseño (en céntimos para no arrastrar errores de coma flotante) ----------
SALDO_BANCO_INI, SALDO_BANCO_FIN = 8421537, 6148219
SALDO_LIBROS_INI, SALDO_LIBROS_FIN = 8498537, 6192413
NETO_UNO_A_UNO = -3694594
N_UNO_A_UNO = 171
S1, S2 = -235000, 312000
A1, A2, A3 = -481250, -726000, 544500
B1, B2, B3, B4, B5, B6 = -4500, [-1240, -1240, -1510, -980, -1420], -195749, -242000, -605, 108900
E1, E2_BANCO, E2_LIBROS = 363000, -158400, -154800
R1_TOTAL = 1843020
RESERVADOS = {S1, S2, A1, A2, A3, B1, -1240, -1510, -980, -1420, B3, B4, -B4, B5, B6, E1, E2_BANCO,
              E2_LIBROS, R1_TOTAL, 12100, -60500, -4840, -18000, -314600}

OCT = [D(2026, 10, d) for d in range(1, 32)]
LAB = [d for d in OCT if d.weekday() < 5 and d != D(2026, 10, 12)]   # 12/10: Fiesta Nacional y el Pilar
assert len(LAB) == 21

PROVEEDORES = [  # nombre, formato del nº de factura
    ("Cables Arnedo, S.A.", "CA-26-{:05d}"), ("Elecvía Distribución, S.L.", "EV-26-{:05d}"),
    ("Material Eléctrico Tormes, S.L.", "MT/26/{:04d}"), ("Iluminación Yesa, S.L.", "IY26-{:04d}"),
    ("Mecanismos Ribagorza, S.A.", "MR-26-{:04d}"), ("Tubos y Canales Huerva, S.L.", "TH-{:04d}"),
    ("Protecciones Gállego, S.L.", "PG26/{:04d}"), ("Luminarias Moncayo, S.L.", "LM-{:05d}"),
    ("Embalajes Cinca, S.L.", "EC-{:04d}"), ("Limpiezas Aljafería, S.L.", "LA-26-{:03d}"),
    ("Asesoría Laboral Delicias, S.L.", "AD/{:04d}"), ("Herramientas Turia, S.L.", "HT-{:05d}"),
    ("Cuadros Eléctricos Bardenas, S.L.", "CB26-{:04d}"), ("Grupo Electrógeno Isuela, S.L.", "GI-{:04d}"),
]
MATRICULAS = ["4512 LKV", "4513 LKV", "7208 MBC", "1196 MFD", "3389 MHT"]


def txt_banco(s, n=30):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = " ".join(s.upper().replace(",", "").replace(".", "").split())
    return s[:n].rstrip()


def eur(c):
    return round(c / 100, 2)


def eur_es(c):
    s = f"{abs(c) / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("-" if c < 0 else "") + s


def clientes():
    try:
        df = pd.read_excel(os.path.join(LIBROS, "p5-datos.xlsx"), sheet_name="Clientes", dtype=str)
        return list(df[["CodCliente", "Nombre", "NIF"]].itertuples(index=False, name=None))
    except Exception:  # sin el maestro común, unos cuantos de reserva
        return [(f"C{i:04d}", n, "B00000000") for i, n in enumerate(
            ["Reformas Aznar, S.L.", "Instalaciones Arga, S.L.", "Electro Olite, S.L.",
             "Instalaciones Eléctricas Matarraña, S.L.", "Telecomunicaciones Irati, S.L."], start=1)]


def generar(semilla):
    rng = random.Random(semilla)
    cli = clientes()
    por_cod = {c[0]: c for c in cli}
    especiales = {"C0010", "C0013", "C0011", "C0087", "C0112"}
    personas = [c for c in cli if not c[2].startswith("B") and c[0] not in especiales]
    empresas = [c for c in cli if c[2].startswith("B") and c[0] not in especiales]
    usados = set()
    facturas = iter(rng.sample(range(1700, 2160), 200))

    def unico(v):
        paso = 37 if v > 0 else -37
        while v in usados or v in RESERVADOS or v == 0:
            v += paso
        usados.add(v)
        return v

    def logn(mediana, sigma, lo, hi):
        return int(round(min(max(rng.lognormvariate(math.log(mediana), sigma), lo), hi) * 100))

    def fra():
        return f"F26-{next(facturas):06d}"

    pares = []  # movimientos que casan uno a uno

    def par(cat, imp, fb, cb, fl, cl, fv=None, prio_b=5, prio_l=5):
        pares.append(dict(cat=cat, imp=imp, fb=fb, fv=fv or fb, cb=cb, fl=fl, cl=cl,
                          pb=prio_b, pl=prio_l, rb=rng.random(), rl=rng.random()))

    def retraso_cobro(fb):
        d = rng.choices([0, 1, 2, 3], [55, 25, 12, 8])[0]
        fl = fb + dt.timedelta(days=d)
        return fl if fl.month == 10 else fb

    def adelanto_pago(fb):
        d = rng.choices([0, 1], [70, 30])[0]
        fl = fb - dt.timedelta(days=d)
        return fl if fl.month == 10 else fb

    formatos_cobro = ["TRANSFERENCIA DE {n} CONCEPTO {f}", "TRANSF. DE {n} FRA {f}",
                      "TRANSFERENCIA DE {n} PAGO FACTURA {f}", "TRANSF SEPA DE {n} REF {f}"]

    # --- cobros de clientes por transferencia (72 = 4 + 68): 4 de 121,00 (Q03) y uno justo a 5 días
    elegidos = rng.sample(empresas, 68) if len(empresas) >= 68 else rng.choices(empresas, k=68)
    for fb, c in zip(sorted(rng.sample(LAB, 4)), rng.sample(personas, 4) if len(personas) >= 4 else personas * 4):
        f = fra()
        par("cobro", 12100, fb, rng.choice(formatos_cobro).format(n=txt_banco(c[1]), f=f), fb, f"Cobro {f} {c[1]}")
    for i, c in enumerate(elegidos):
        f = fra()
        imp = unico(logn(5000, 0.9, 150, 30000))
        if i == 0:   # pareja justo a 5 días
            fb, fl = D(2026, 10, 2), D(2026, 10, 7)
        else:
            fb = rng.choice(LAB)
            fl = retraso_cobro(fb)
        par("cobro", imp, fb, rng.choice(formatos_cobro).format(n=txt_banco(c[1]), f=f), fl, f"Cobro {f} {c[1]}")
    # E1 original (el duplicado va aparte)
    aznar = por_cod.get("C0010", ("C0010", "Reformas Aznar, S.L.", ""))
    par("E1", E1, D(2026, 10, 15), f"TRANSFERENCIA DE {txt_banco(aznar[1])} CONCEPTO F26-002087",
        D(2026, 10, 15), f"Cobro F26-002087 {aznar[1]}")
    usados.add(E1)

    # --- liquidaciones del TPV de la tienda de Zaragoza (20)
    for fb in sorted(rng.sample(LAB, 20)):
        imp = unico(logn(1100, 0.45, 250, 3500))
        par("tpv", imp, fb, "ABONO LIQUIDACION TPV COMERCIO 304571", fb,
            f"Liquidación TPV tienda Zaragoza {fb:%d/%m}")

    # --- recibos domiciliados (19, cinco de ellos de 48,40 el mismo día: Q03)
    recibos = [
        (D(2026, 10, 1), "RECIBO ALQUILER NAVE PAMPLONA OCT", "Alquiler nave Pamplona octubre (Inmobiliaria Rochapea)", -204000),
        (D(2026, 10, 1), "RECIBO ALQUILER LOCAL LLEIDA OCT", "Alquiler local Lleida octubre", -183600),
        (D(2026, 10, 2), "RECIBO RENTING CARRETILLA CTO 58812", "Renting carretilla elevadora 1 octubre", -logn(468, 0.05, 400, 520) // 1),
        (D(2026, 10, 2), "RECIBO RENTING CARRETILLA CTO 58813", "Renting carretilla elevadora 2 octubre", -logn(512, 0.05, 450, 560) // 1),
        (D(2026, 10, 6), "RECIBO TELEFONIA Y DATOS SEP", "Telefonía y datos septiembre", -logn(1240, 0.1, 1000, 1500)),
        (D(2026, 10, 7), "RECIBO ELECTRICIDAD NAVE ZARAGOZA", "Electricidad nave Zaragoza septiembre", -logn(2350, 0.1, 1900, 2900)),
        (D(2026, 10, 8), "RECIBO ELECTRICIDAD DELEG PAMPLONA", "Electricidad delegación Pamplona septiembre", -logn(640, 0.1, 500, 800)),
        (D(2026, 10, 8), "RECIBO ELECTRICIDAD DELEG LLEIDA", "Electricidad delegación Lleida septiembre", -logn(560, 0.1, 450, 700)),
        (D(2026, 10, 9), "RECIBO AGUA NAVE ZARAGOZA 3T", "Agua nave Zaragoza 3T", -logn(215, 0.1, 160, 280)),
        (D(2026, 10, 13), "RECIBO SEGURO FLOTA POL 7730-22", "Seguro flota vehículos (fracción octubre)", -logn(1830, 0.05, 1600, 2000)),
        (D(2026, 10, 13), "RECIBO SEGURO MULTIRRIESGO NAVE", "Seguro multirriesgo nave Zaragoza (fracción octubre)", -logn(925, 0.05, 800, 1050)),
        (D(2026, 10, 15), "RECIBO LICENCIA ERP MANTENIMIENTO", "Mantenimiento licencia ERP octubre", -logn(726, 0.02, 700, 760)),
        (D(2026, 10, 15), "RECIBO LICENCIAS OFIMATICA", "Licencias de ofimática octubre", -logn(338, 0.05, 300, 380)),
        (D(2026, 10, 30), "RECIBO TGSS SEGUROS SOCIALES SEP", "Seguros sociales septiembre", -4987122),
    ]
    for fb, cb, cl, imp in recibos:
        par("recibo", unico(imp), fb, cb, fb, cl, prio_b=9 if "TGSS" in cb else 5)
    for m in MATRICULAS:
        par("gps", -4840, D(2026, 10, 5), "RECIBO LOCALIZADOR GPS FURGONETA", D(2026, 10, 5),
            f"Recibo localizador GPS furgoneta {m}")
    # --- impuestos (20/10) y nóminas (30/10)
    for cb, cl, imp in [("IMPUESTOS AEAT MOD 303 3T 2026", "Liquidación IVA 3T 2026 (modelo 303)", -5821463),
                        ("IMPUESTOS AEAT MOD 111 3T 2026", "Retenciones IRPF 3T 2026 (modelo 111)", -5231840),
                        ("IMPUESTOS AEAT MOD 115 3T 2026", "Retenciones alquileres 3T 2026 (modelo 115)", -228120)]:
        par("impuesto", unico(imp), D(2026, 10, 20), cb, D(2026, 10, 20), cl)
    par("nomina", unico(-10741236), D(2026, 10, 30), "ORDEN DE NOMINAS OCT 2026 58 BENEF", D(2026, 10, 30),
        "Pago nóminas octubre 2026", prio_b=8)
    par("cheque", unico(-306518), D(2026, 10, 16), "CHEQUE COMPENSADO N 0001195", D(2026, 10, 13),
        "Pago cheque nº 1195 a Embalajes Cinca, S.L. fra. EC-0937")

    # --- pagos a proveedores: −2.350,00 del 27/10 (Q03 con S1), 3 de 605,00 (Q03) y 50 más
    par("pago", S1, D(2026, 10, 27), "TRANSFERENCIA A PROTECCIONES GALLEGO SL FRA PG26/0412",
        D(2026, 10, 27), "Pago fra. PG26/0412 Protecciones Gállego, S.L.")
    for fb, n in zip([D(2026, 10, 7), D(2026, 10, 14), D(2026, 10, 21)], [1180, 1214, 1247]):
        par("pago", -60500, fb, f"TRANSFERENCIA A TRANSPORTES JALON SL FRA TJ-26-{n}", fb,
            f"Pago fra. TJ-26-{n} Transportes Jalón, S.L. (portes semana)")
    proveedores = []
    for _ in range(50):
        nom, fmt = rng.choice([p for p in PROVEEDORES if p[0] != "Elecvía Distribución, S.L."] + [PROVEEDORES[0]] * 3)
        num = fmt.format(rng.randint(100, 9999))
        fb = rng.choice(LAB)
        v = -logn(4500, 0.85, 200, 40000)
        proveedores.append(dict(nom=nom, num=num, fb=fb, fl=adelanto_pago(fb), v=v))
    resto = sum(p["imp"] for p in pares)
    necesario = NETO_UNO_A_UNO - resto
    bruto = sum(p["v"] for p in proveedores)
    f = necesario / bruto
    if not 0.6 <= f <= 1.6:
        return None
    for p in proveedores:
        p["v"] = int(round(p["v"] * f))
    mayor = min(proveedores, key=lambda p: p["v"])
    mayor["v"] += necesario - sum(p["v"] for p in proveedores)
    for p in proveedores:
        if p["v"] in usados or p["v"] in RESERVADOS or p["v"] >= -10000:
            return None
        usados.add(p["v"])
        par("pago", p["v"], p["fb"], f"TRANSFERENCIA A {txt_banco(p['nom'], 26)} FRA {p['num']}", p["fl"],
            f"Pago fra. {p['num']} {p['nom']}")
    assert len(pares) == N_UNO_A_UNO, len(pares)
    assert sum(p["imp"] for p in pares) == NETO_UNO_A_UNO

    # --- remesa R-2610: 23 recibos, uno de ellos el de C0087 (2.420,00) que luego se devuelve
    otros = [logn(600, 0.6, 120, 2400) for _ in range(22)]
    objetivo = R1_TOTAL - (-B4)
    otros = [int(round(v * objetivo / sum(otros))) for v in otros]
    otros[otros.index(max(otros))] += objetivo - sum(otros)
    if len(set(otros)) < 22 or any(v in usados or v in RESERVADOS or v <= 0 for v in otros):
        return None
    clis_rem = rng.sample(empresas, 22)
    remesa = []
    for v, c in zip(otros, clis_rem):
        remesa.append((v, c[0], fra()))
    matar = por_cod.get("C0087", ("C0087", "Instalaciones Eléctricas Matarraña, S.L.", ""))
    fra_c0087 = fra()
    remesa.insert(rng.randint(0, 22), (-B4, "C0087", fra_c0087))
    assert sum(r[0] for r in remesa) == R1_TOTAL and len(remesa) == 23

    # ---------------- BANCO ----------------
    banco = []
    for p in pares:
        banco.append(dict(fb=p["fb"], fv=p["fv"], c=p["cb"], imp=p["imp"], prio=p["pb"], r=p["rb"], cod=p["cat"]))
    olite = por_cod.get("C0011", ("C0011", "Electro Olite, S.L.", ""))
    arga = por_cod.get("C0013", ("C0013", "Instalaciones Arga, S.L.", ""))
    irati = por_cod.get("C0112", ("C0112", "Telecomunicaciones Irati, S.L.", ""))
    esp = [
        ("S2", D(2026, 10, 1), D(2026, 10, 1), f"TRANSFERENCIA DE {txt_banco(arga[1])} CONCEPTO F26-001902", S2, 0),
        ("S1", D(2026, 10, 6), D(2026, 10, 6), "CHEQUE COMPENSADO N 0001187", S1, 5),
        ("R1", D(2026, 10, 9), D(2026, 10, 9), "ABONO REMESA R-2610 23 RECIBOS", R1_TOTAL, 5),
        ("B4", D(2026, 10, 21), D(2026, 10, 21),
         f"DEVOLUCION RECIBO {fra_c0087} {txt_banco(matar[1], 24)} (REM. R-2610) MOTIVO AM04", B4, 6),
        ("B5", D(2026, 10, 21), D(2026, 10, 21), f"COMISION DEVOLUCION RECIBO {fra_c0087}", B5, 7),
        ("E2", D(2026, 10, 22), D(2026, 10, 22), "TRANSFERENCIA A ELECVIA DISTRIBUCION SL FRA EV-26-08841", E2_BANCO, 5),
        ("B3", D(2026, 10, 26), D(2026, 10, 25), "LIQUIDACION PRESTAMO 7701234-55 CUOTA", B3, 5),
        ("B1", D(2026, 10, 31), D(2026, 10, 31), "COMISION MANTENIMIENTO CUENTA OCT 2026", B1, 5),
        ("B6", D(2026, 10, 31), D(2026, 10, 31), "TRANSFERENCIA INMEDIATA DE TI SL CONCEPTO PAGO", B6, 5),
    ]
    for cod, fb, fv, cpt, imp, prio in esp:
        banco.append(dict(fb=fb, fv=fv, c=cpt, imp=imp, prio=prio, r=rng.random(), cod=cod))
    # B2: comisiones de transferencia, el día de 5 transferencias a proveedores (días distintos)
    dias_pago = sorted({p["fb"] for p in pares if p["cat"] == "pago" and p["fb"].day < 30})
    for v, d in zip(B2, sorted(rng.sample(dias_pago, 5))):
        banco.append(dict(fb=d, fv=d, c="COMISION TRANSFERENCIA EMITIDA", imp=v, prio=6, r=rng.random(), cod="B2"))
    banco.sort(key=lambda x: (x["fb"], x["prio"], x["r"]))
    saldo, minimo = SALDO_BANCO_INI, 10 ** 12
    for b in banco:
        saldo += b["imp"]
        b["saldo"] = saldo
        minimo = min(minimo, saldo)
        b["ref"] = f"{b['fb']:%y%m%d}{rng.randint(100000, 999999)}"
    assert saldo == SALDO_BANCO_FIN and len(banco) == 185, (saldo, len(banco))
    if minimo < 100000:
        return None

    # ---------------- LIBROS (mayor de la 572000001) ----------------
    libros = []
    for i, p in enumerate(pares):
        libros.append(dict(fl=p["fl"], c=p["cl"], imp=p["imp"], k=(p["pl"], p["rl"], 0), g=f"P{i}", cod=p["cat"]))
    rk = rng.random()
    libros.append(dict(fl=D(2026, 10, 15), c=f"Cobro F26-002087 {aznar[1]}", imp=E1, k=(5, next(
        x["k"][1] for x in libros if x["cod"] == "E1"), 1), g="E1dup", cod="E1dup"))
    libros.append(dict(fl=D(2026, 10, 22), c="Pago fra. EV-26-08841 Elecvía Distribución, S.L.", imp=E2_LIBROS,
                       k=(5, rng.random(), 0), g="E2", cod="E2"))
    libros.append(dict(fl=D(2026, 10, 29), c="Pago cheque nº 1203 a Tubos y Canales Huerva, S.L. fra. TH-2611",
                       imp=A1, k=(5, rng.random(), 0), g="A1", cod="A1"))
    libros.append(dict(fl=D(2026, 10, 30), c="Pago transferencia fra. A-26/3305 Cables Arnedo, S.A.", imp=A2,
                       k=(5, rng.random(), 0), g="A2", cod="A2"))
    libros.append(dict(fl=D(2026, 10, 31), c=f"Cobro F26-002168 {olite[1]}", imp=A3, k=(5, rng.random(), 0),
                       g="A3", cod="A3"))
    for j, (v, cod, f) in enumerate(remesa):
        libros.append(dict(fl=D(2026, 10, 9), c=f"Cobro recibo {f} {cod} remesa R-2610", imp=v,
                           k=(5, rk, j), g="REM", cod="R1"))
    libros.sort(key=lambda x: (x["fl"],) + x["k"])
    grupos = []
    for x in libros:
        if not grupos or grupos[-1] != x["g"] or x["g"] != "REM":
            grupos.append(x["g"])
        x["n"] = len(grupos)
    n_e1 = next(x["n"] for x in libros if x["cod"] == "E1")
    base = 3871 - n_e1
    if base <= 3700:
        return None
    saldo, minimo = SALDO_LIBROS_INI, 10 ** 12
    for x in libros:
        x["asiento"] = f"2026/{base + x['n']}"
        saldo += x["imp"]
        x["saldo"] = saldo
        minimo = min(minimo, saldo)
    assert saldo == SALDO_LIBROS_FIN and len(libros) == 199, (saldo, len(libros))
    assert next(x["asiento"] for x in libros if x["cod"] == "E1dup") == "2026/3872"
    if minimo < 0:
        return None

    # parejas con el mismo importe: el orden en los dos lados tiene que ser el mismo (lo garantiza el diseño)
    return dict(banco=banco, libros=libros, olite=olite, irati=irati, rng=rng)


def escribir():
    for intento in range(200):
        res = generar(SEMILLA + intento)
        if res:
            break
    else:
        raise SystemExit("ninguna semilla cumple las condiciones")
    banco, libros, rng = res["banco"], res["libros"], res["rng"]
    log = []

    # Q07: 10 fechas de operación como texto (2 con espacio final)
    texto_idx = sorted(rng.sample(range(len(banco)), 10))
    for j, i in enumerate(texto_idx):
        banco[i]["fb_txt"] = banco[i]["fb"].strftime("%d/%m/%Y") + (" " if j in (3, 7) else "")

    ruta = os.path.join(LIBROS, "p4-datos.xlsx")
    wb = xlsxwriter.Workbook(ruta)
    wb.set_properties({"title": "P4 · Conciliación bancaria de octubre (datos)", "author": "Hoja a hoja",
                       "company": "Electro Cierzo Suministros, S.L. (ficticia)"})
    f_tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E78"})
    f_sub = wb.add_format({"bold": True, "font_color": "#1F4E78"})
    f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
    f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True})
    f_fec = wb.add_format({"num_format": "dd/mm/yyyy"})
    f_eur = wb.add_format({"num_format": "#,##0.00"})
    f_pct = wb.add_format({"num_format": "0.00%"})
    f_txt_dato = wb.add_format({"num_format": "@"})

    # ---- Instrucciones
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 110, f_txt)
    lineas = [
        ("t", "P4 · Conciliación bancaria de octubre de 2026 (Banco Norte)"),
        ("p", "Encargo de Marta Ruiz, directora financiera de Electro Cierzo Suministros, S.L. (empresa ficticia). "
              "Hoy es lunes 16/11/2026. El auditor viene en enero."),
        ("s", "Qué hay en este libro"),
        ("p", "• Movimientos y Movimientos (2): lo que Marta descargó de la banca online (servicio multibanco), tal cual."),
        ("p", "• Mayor_572000001: el mayor de la cuenta 572000001 Banco Norte c/c que saca el programa de contabilidad."),
        ("p", "• Pendientes_septiembre: lo que quedó pendiente en la conciliación de septiembre."),
        ("p", "• Prestamo: las condiciones del préstamo que se carga en esta cuenta."),
        ("s", "Objetivo"),
        ("p", "Explicar por qué el saldo del banco a 31/10/2026 no coincide con el de contabilidad, dejar la diferencia "
              "en 0,00 € con todas las partidas identificadas, proponer el asiento de ajuste y dejarlo como plantilla para cada mes."),
        ("s", "Pasos"),
        ("p", "1. Lee el correo de Marta y aclara lo que no esté claro antes de empezar. Trabaja siempre sobre una copia de este libro."),
        ("p", "2. Prepara el banco: tabla limpia, fechas que sean fechas y comprobación de que los saldos encadenan."),
        ("p", "3. Prepara los libros: un importe con signo (entradas en positivo) a partir del Debe y el Haber, solo con apuntes."),
        ("p", "4. Empareja banco y libros (sin olvidar lo que venía de septiembre) y clasifica lo que quede sin pareja."),
        ("p", "5. Monta el estado de conciliación (el modelo del auditor), la propuesta de asiento y la hoja de pendientes para noviembre."),
        ("p", "6. Convierte el libro en una plantilla mensual y escribe a Marta."),
        ("s", "Cómo comprobar"),
        ("p", "• Saldo inicial del banco + movimientos = saldo final del banco. Lo mismo con el mayor."),
        ("p", "• Cada movimiento queda emparejado o clasificado, en los dos lados."),
        ("p", "• Al final, saldo bancario ajustado = saldo contable ajustado (diferencia 0,00 €). "
              "Ojo: cuadrar no basta, cada partida tiene que estar en su sitio."),
        ("p", "Hay un segundo archivo, p4-noviembre.xlsx: no lo abras hasta el último paso del proyecto."),
    ]
    for i, (t, s) in enumerate(lineas):
        ws.write(i, 0, s, {"t": f_tit, "s": f_sub}.get(t, f_txt))

    # ---- Movimientos (Banco Norte), con 6 filas de título (Q11)
    def hoja_banco(nombre, entidad, cuenta, desde, hasta, saldo_ini, filas):
        w = wb.add_worksheet(nombre)
        w.write(0, 0, "Consulta de movimientos · Servicio multibanco")
        w.write(1, 0, "Titular: ELECTRO CIERZO SUMINISTROS, S.L.")
        w.write(2, 0, f"Entidad: {entidad} · Cuenta: {cuenta}")
        w.write(3, 0, f"Movimientos del {desde:%d/%m/%Y} al {hasta:%d/%m/%Y}")
        w.write(4, 0, f"Saldo inicial: {eur_es(saldo_ini)}")
        w.write(5, 0, "Descargado el 16/11/2026 a las 9:12")
        for j, h in enumerate(["F. Operación", "F. Valor", "Concepto", "Importe", "Saldo", "Referencia"]):
            w.write(6, j, h, f_cab)
        for i, b in enumerate(filas, start=7):
            if "fb_txt" in b:
                w.write_string(i, 0, b["fb_txt"])
            else:
                w.write_datetime(i, 0, dt.datetime.combine(b["fb"], dt.time()), f_fec)
            w.write_datetime(i, 1, dt.datetime.combine(b["fv"], dt.time()), f_fec)
            w.write_string(i, 2, b["c"])
            w.write_number(i, 3, eur(b["imp"]), f_eur)
            w.write_number(i, 4, eur(b["saldo"]), f_eur)
            w.write_string(i, 5, b["ref"], f_txt_dato)
        w.set_column("A:B", 12)
        w.set_column("C:C", 58)
        w.set_column("D:E", 13)
        w.set_column("F:F", 16)
        return w

    hoja_banco("Movimientos", "Banco Norte", "ES00 9001 0101 2600 0572 0001", D(2026, 10, 1), D(2026, 10, 31),
               SALDO_BANCO_INI, banco)
    for i in texto_idx:
        log.append(("p4-datos.xlsx", "Movimientos", i + 8, "A", "Q07 fecha como texto", banco[i]["fb_txt"]))
    log.append(("p4-datos.xlsx", "Movimientos", "1-7", "-", "Q11 6 filas de título antes de la tabla", ""))

    # ---- Movimientos (2): Banco Sur, póliza de crédito (trampa)
    rs = random.Random(SEMILLA + 99)
    sur, saldo = [], -3824015
    movs = [(D(2026, 10, 1), "LIQUIDACION INTERESES POLIZA 3T", -61240),
            (D(2026, 10, 1), "COMISION NO DISPONIBILIDAD 3T", -9530)]
    for _ in range(7):
        c = rs.choice(clientes())
        movs.append((rs.choice(LAB), f"ABONO CONFIRMING {txt_banco(c[1], 24)}", int(rs.uniform(1500, 14000) * 100)))
    for _ in range(7):
        nom, fmt = rs.choice(PROVEEDORES)
        movs.append((rs.choice(LAB), f"TRANSFERENCIA A {txt_banco(nom, 26)} FRA {fmt.format(rs.randint(100, 999))}",
                     -int(rs.uniform(1800, 16000) * 100)))
    movs.sort(key=lambda m: m[0])
    for fb, cpt, imp in movs:
        saldo += imp
        sur.append(dict(fb=fb, fv=fb, c=cpt, imp=imp, saldo=saldo, ref=f"{fb:%y%m%d}{rs.randint(100000, 999999)}"))
    hoja_banco("Movimientos (2)", "Banco Sur", "ES00 9002 0310 4600 0520 0002 (póliza de crédito)", D(2026, 10, 1),
               D(2026, 10, 31), -3824015, sur)
    log.append(("p4-datos.xlsx", "Movimientos (2)", "todas", "-", "Trampa: otra cuenta (Banco Sur, póliza)", len(sur)))

    # ---- Mayor_572000001 (Q14 Debe/Haber, Q10 filas que no son apuntes, 2 filas de título)
    w = wb.add_worksheet("Mayor_572000001")
    w.write(0, 0, "Mayor de la cuenta 572000001 · Banco Norte c/c · del 01/10/2026 al 31/10/2026")
    for j, h in enumerate(["Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]):
        w.write(2, j, h, f_cab)
    w.write(3, 2, "Saldo anterior")
    w.write_number(3, 5, eur(SALDO_LIBROS_INI), f_eur)
    fila = 4
    for x in libros:
        w.write_datetime(fila, 0, dt.datetime.combine(x["fl"], dt.time()), f_fec)
        w.write_string(fila, 1, x["asiento"])
        w.write_string(fila, 2, x["c"])
        w.write_number(fila, 3 if x["imp"] > 0 else 4, eur(abs(x["imp"])), f_eur)
        w.write_number(fila, 5, eur(x["saldo"]), f_eur)
        fila += 1
    debe = sum(x["imp"] for x in libros if x["imp"] > 0)
    haber = -sum(x["imp"] for x in libros if x["imp"] < 0)
    w.write(fila, 2, "Sumas del periodo")
    w.write_number(fila, 3, eur(debe), f_eur)
    w.write_number(fila, 4, eur(haber), f_eur)
    w.write_number(fila, 5, eur(SALDO_LIBROS_FIN), f_eur)
    w.set_column("A:B", 12)
    w.set_column("C:C", 62)
    w.set_column("D:F", 13)
    log += [("p4-datos.xlsx", "Mayor_572000001", 4, "C", "Q10 fila «Saldo anterior» entre los apuntes", eur(SALDO_LIBROS_INI)),
            ("p4-datos.xlsx", "Mayor_572000001", fila + 1, "C", "Q10 fila «Sumas del periodo» al final", f"{eur(debe)} / {eur(haber)}"),
            ("p4-datos.xlsx", "Mayor_572000001", "5-203", "D:E", "Q14 Debe y Haber en dos columnas", "")]

    # ---- Pendientes_septiembre
    w = wb.add_worksheet("Pendientes_septiembre")
    for j, h in enumerate(["Fecha", "Asiento", "Concepto", "Debe", "Haber", "Tipo"]):
        w.write(0, j, h, f_cab)
    arga = clientes_por_cod("C0013", "Instalaciones Arga, S.L.")
    pend = [(D(2026, 9, 28), "2026/3652", "Pago cheque nº 1187 a Iluminación Yesa, S.L. fra. IY26-0388", None, 2350.00,
             "Pago pendiente de cargo"),
            (D(2026, 9, 30), "2026/3689", f"Cobro F26-001902 {arga}", 3120.00, None, "Ingreso en tránsito")]
    for i, p in enumerate(pend, start=1):
        w.write_datetime(i, 0, dt.datetime.combine(p[0], dt.time()), f_fec)
        w.write(i, 1, p[1])
        w.write(i, 2, p[2])
        if p[3]:
            w.write_number(i, 3, p[3], f_eur)
        if p[4]:
            w.write_number(i, 4, p[4], f_eur)
        w.write(i, 5, p[5])
    w.write(4, 0, "Conciliación de septiembre: banco 84.215,37 + 3.120,00 − 2.350,00 = libros 84.985,37. Diferencia 0,00.")
    w.set_column("A:B", 12)
    w.set_column("C:C", 58)
    w.set_column("D:E", 12)
    w.set_column("F:F", 24)

    # ---- Prestamo
    w = wb.add_worksheet("Prestamo")
    w.write(0, 0, "Condiciones del préstamo (resumen del contrato)", f_tit)
    filas = [("Entidad", "Banco Norte"), ("Nº de préstamo", "7701234-55"), ("Importe concedido (€)", 85000),
             ("Tipo de interés nominal anual (TIN), fijo", 0.05), ("Plazo (cuotas mensuales)", 48),
             ("Sistema de amortización", "Francés: cuota constante (capital + intereses)"),
             ("Fecha de la primera cuota", D(2025, 4, 25)),
             ("Día de cargo", "El 25 de cada mes; si no es día hábil, el siguiente, con fecha valor del 25"),
             ("Cuenta de cargo", "572000001 Banco Norte c/c")]
    for i, (k, v) in enumerate(filas, start=2):
        w.write(i, 0, k, f_sub)
        if isinstance(v, D):
            w.write_datetime(i, 1, dt.datetime.combine(v, dt.time()), f_fec)
        elif isinstance(v, float):
            w.write_number(i, 1, v, f_pct)
        elif isinstance(v, int):
            w.write_number(i, 1, v, f_eur if v > 100 else None)
        else:
            w.write(i, 1, v)
    w.set_column("A:A", 40)
    w.set_column("B:B", 70)
    wb.close()

    # ---- p4-noviembre.xlsx (cambio inesperado: 01/11-06/11)
    escribir_noviembre(res, log)

    with open(os.path.join(AQUI, "p4-log-suciedad.csv"), "w", newline="", encoding="utf-8") as fh:
        cw = csv.writer(fh, delimiter=";")
        cw.writerow(["archivo", "hoja", "fila_excel", "columna", "problema", "valor"])
        cw.writerows(log)
    print("p4-datos.xlsx:", len(banco), "movimientos de banco,", len(libros), "apuntes; semilla", SEMILLA + intento)


def clientes_por_cod(cod, defecto):
    for c in clientes():
        if c[0] == cod:
            return c[1]
    return defecto


def escribir_noviembre(res, log):
    rn = random.Random(SEMILLA + 11)
    olite = res["olite"]
    lab = [D(2026, 11, d) for d in range(2, 7)]
    usados = {A1, A2, A3, -18000, -314600}
    banco, libros = [], []
    banco += [dict(fb=D(2026, 11, 2), c="TRANSFERENCIA A CABLES ARNEDO SA FRA A-26/3305", imp=A2),
              dict(fb=D(2026, 11, 2), c="COMISION ADMINISTRACION TRIMESTRAL", imp=-18000),
              dict(fb=D(2026, 11, 3), c=f"TRANSFERENCIA DE {txt_banco(olite[1])} CONCEPTO F26-002168", imp=A3),
              dict(fb=D(2026, 11, 4), c="CHEQUE COMPENSADO N 0001203", imp=A1)]
    cli = [c for c in clientes() if c[2].startswith("B")]
    for i in range(8):
        fb = rn.choice(lab)
        while True:
            v = int(rn.uniform(900, 9000) * 100) * (1 if i < 4 else -1)
            if v not in usados:
                usados.add(v)
                break
        if i < 4:
            c = rn.choice(cli)
            f = f"F26-00{rn.randint(2100, 2260)}"
            banco.append(dict(fb=fb, c=f"TRANSFERENCIA DE {txt_banco(c[1])} CONCEPTO {f}", imp=v))
            libros.append(dict(fl=fb, c=f"Cobro {f} {c[1]}", imp=v))
        else:
            nom, fmt = rn.choice(PROVEEDORES)
            num = fmt.format(rn.randint(100, 9999))
            banco.append(dict(fb=fb, c=f"TRANSFERENCIA A {txt_banco(nom, 26)} FRA {num}", imp=v))
            libros.append(dict(fl=fb, c=f"Pago fra. {num} {nom}", imp=v))
    libros.append(dict(fl=D(2026, 11, 6), c="Pago transferencia fra. MR-26-1290 Mecanismos Ribagorza, S.A.", imp=-314600))
    for b in banco:
        b["fv"], b["r"] = b["fb"], rn.random()
    banco.sort(key=lambda b: (b["fb"], b["r"]))
    saldo = SALDO_BANCO_FIN
    for b in banco:
        saldo += b["imp"]
        b["saldo"] = saldo
        b["ref"] = f"{b['fb']:%y%m%d}{rn.randint(100000, 999999)}"
    libros.sort(key=lambda x: (x["fl"], rn.random()))
    saldo_l = SALDO_LIBROS_FIN + (-449244 + 108900 - 363000 - 3600)   # tras el asiento propuesto (31/10)
    assert saldo_l == 5485469
    ini_l = saldo_l
    for n, x in enumerate(libros):
        saldo_l += x["imp"]
        x["saldo"] = saldo_l
        x["asiento"] = f"2026/{3960 + n}"

    wb = xlsxwriter.Workbook(os.path.join(LIBROS, "p4-noviembre.xlsx"))
    f_tit = wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E78"})
    f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
    f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
    f_fec = wb.add_format({"num_format": "dd/mm/yyyy"})
    f_eur = wb.add_format({"num_format": "#,##0.00"})
    ws = wb.add_worksheet("Instrucciones")
    ws.set_column("A:A", 110, f_txt)
    for i, s in enumerate([
        "P4 · Cambio inesperado: primera semana de noviembre",
        "Ábrelo solo en el último paso del proyecto, con la conciliación de octubre ya entregada.",
        "Movimientos: descarga del Banco Norte del 01/11 al 06/11/2026 (mismo formato que la de octubre).",
        "Mayor_572000001: mayor del 01/11 al 06/11/2026. Contabilidad ya ha registrado con fecha 31/10 el asiento "
        "que propusiste, así que el saldo anterior es el saldo contable ajustado de octubre.",
        "Tarea: pega estos datos en tu plantilla, con las pendientes de octubre arriba de los libros, y comprueba que "
        "las partidas de octubre casan y que la diferencia vuelve a ser 0,00 €."]):
        ws.write(i, 0, s, f_tit if i == 0 else f_txt)
    w = wb.add_worksheet("Movimientos")
    w.write(0, 0, "Consulta de movimientos · Servicio multibanco")
    w.write(1, 0, "Titular: ELECTRO CIERZO SUMINISTROS, S.L.")
    w.write(2, 0, "Entidad: Banco Norte · Cuenta: ES00 9001 0101 2600 0572 0001")
    w.write(3, 0, "Movimientos del 01/11/2026 al 06/11/2026")
    w.write(4, 0, f"Saldo inicial: {eur_es(SALDO_BANCO_FIN)}")
    w.write(5, 0, "Descargado el 09/11/2026 a las 8:47")
    for j, h in enumerate(["F. Operación", "F. Valor", "Concepto", "Importe", "Saldo", "Referencia"]):
        w.write(6, j, h, f_cab)
    for i, b in enumerate(banco, start=7):
        w.write_datetime(i, 0, dt.datetime.combine(b["fb"], dt.time()), f_fec)
        w.write_datetime(i, 1, dt.datetime.combine(b["fv"], dt.time()), f_fec)
        w.write_string(i, 2, b["c"])
        w.write_number(i, 3, eur(b["imp"]), f_eur)
        w.write_number(i, 4, eur(b["saldo"]), f_eur)
        w.write_string(i, 5, b["ref"])
    w.set_column("A:B", 12)
    w.set_column("C:C", 58)
    w.set_column("D:F", 14)
    w = wb.add_worksheet("Mayor_572000001")
    w.write(0, 0, "Mayor de la cuenta 572000001 · Banco Norte c/c · del 01/11/2026 al 06/11/2026")
    for j, h in enumerate(["Fecha", "Asiento", "Concepto", "Debe", "Haber", "Saldo"]):
        w.write(2, j, h, f_cab)
    w.write(3, 2, "Saldo anterior")
    w.write_number(3, 5, eur(ini_l), f_eur)
    for i, x in enumerate(libros, start=4):
        w.write_datetime(i, 0, dt.datetime.combine(x["fl"], dt.time()), f_fec)
        w.write_string(i, 1, x["asiento"])
        w.write_string(i, 2, x["c"])
        w.write_number(i, 3 if x["imp"] > 0 else 4, eur(abs(x["imp"])), f_eur)
        w.write_number(i, 5, eur(x["saldo"]), f_eur)
    i = 4 + len(libros)
    w.write(i, 2, "Sumas del periodo")
    w.write_number(i, 3, eur(sum(x["imp"] for x in libros if x["imp"] > 0)), f_eur)
    w.write_number(i, 4, eur(-sum(x["imp"] for x in libros if x["imp"] < 0)), f_eur)
    w.write_number(i, 5, eur(saldo_l), f_eur)
    w.set_column("A:B", 12)
    w.set_column("C:C", 62)
    w.set_column("D:F", 13)
    wb.close()
    log.append(("p4-noviembre.xlsx", "Movimientos", "-", "-", "Cambio inesperado: comisión trimestral −180,00 y A1-A3 cobrados",
                len(banco)))


if __name__ == "__main__":
    escribir()

# -*- coding: utf-8 -*-
"""
Examen final de «Hoja a hoja» · «Prueba técnica de empresa» (120 minutos)
==========================================================================

Escenario NUEVO (research/proyectos.md §7): Tostadero Albada, S.L. [DISEÑO], Valladolid,
distribuidora de café, infusiones, leche, azúcar y complementos, maquinaria y menaje para
hostelería. La alumna se presenta al puesto de «Administrativa de gestión y análisis (Excel avanzado)».

Este script, con semilla fija, hace todo de una vez:
  1. Genera los datos LIMPIOS («verdad»): Tarifa (64), Clientes (148), Pedidos de las semanas 36-44
     (1.227 líneas reales), Cobros (410 facturas) y la semana 45 (138 líneas, 1 producto nuevo).
  2. Calcula con pandas los totales de control de la Parte B desde los datos limpios y las reglas
     pactadas que se leen en la hoja Instrucciones.
  3. Ensucia los pedidos con las cantidades exactas de §7.2 y registra cada problema en
     examen-final-log-suciedad.csv:
       · 12 duplicados exactos (Q01): la exportación repite el final de un día;
       · 1 fila «Total» al final (Q10);
       · 60 fechas ISO como texto «2026-09-14» (Q07);
       · 40 precios con punto como texto «16.90» (Q05);
       · 25 CodCliente con espacio final (Q04);
       · 8 líneas con 3 productos descatalogados que no están en la tarifa (Q16; son ventas reales);
     y en Clientes, 6 zonas mal escritas (Q08); en Cobros, 3 facturas cobradas de más (Q17).
  4. Simula la limpieza que debe hacer la alumna (desde el libro sucio) y comprueba que da la verdad.
  5. Escribe libros/examen-final.xlsx (Instrucciones + datos), libros/examen-final-semana45.csv,
     libros/examen-final-solucion.xlsx (fórmulas reales en inglés y con comas, controles, control
     maestro, simulación, gráfico) y sus .meta.json.
  6. Recalcula la solución con LibreOffice y comprueba que sus fórmulas dan los mismos totales
     que pandas.
  7. Escribe contenido/examen.json (formato de GUIA-AUTORES.md §8).

Decisiones de diseño para que la corrección automática sea justa (no dependa de interpretaciones):
  · IVA exacto: los precios van en múltiplos de 0,10 € (tipos del 10 %), de 0,25 € (leche, 4 %) y de
    1 € (21 %). Así el IVA de cada línea es exacto en céntimos y redondear por línea o sobre la suma
    da lo mismo.
  · Ninguna línea sin tarifa es de Burgos ni de Palencia: la base de Burgos y el % de Café en Palencia
    no dependen de si se incluyen o no esas líneas.
  · Las 3 facturas cobradas de más no están vencidas a más de 60 días y sus clientes quedan lejos del
    límite: el control «> 60» y el nº de clientes sobre el límite no cambian se resten o no.
  · Ningún cliente está a menos de 50 € de su límite; los 6 primeros márgenes por cliente son distintos.

Uso:  python3 examen_final.py
"""
import csv
import json
import math
import os
import random
import shutil
import subprocess
import tempfile
from collections import Counter
from datetime import date, datetime, timedelta

import numpy as np
import openpyxl
import pandas as pd
import xlsxwriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
EXCEL = os.path.dirname(LIBROS)
F_DATOS = os.path.join(LIBROS, "examen-final.xlsx")
F_SOL = os.path.join(LIBROS, "examen-final-solucion.xlsx")
F_CSV = os.path.join(LIBROS, "examen-final-semana45.csv")
F_LOG = os.path.join(AQUI, "examen-final-log-suciedad.csv")
F_CTRL = os.path.join(AQUI, "examen-final-controles.json")
F_JSON = os.path.join(EXCEL, "contenido", "examen.json")

SEMILLA = 20261116
R = random.Random(SEMILLA)
NPR = np.random.default_rng(SEMILLA)

CORTE = date(2026, 10, 31)
OBJETIVO = 0.35
PROD_SIM = "MAQ-ESP-2G"
ZONA_SIM = "Burgos"
N_LEGIT, N_DUP, N_ISO, N_PRECIO, N_ESP, N_SIN = 1227, 12, 60, 40, 25, 8
N_COBROS, N_S45, N_NUEVO = 410, 138, 3
N_SOBRE_LIMITE = 7

# ---------------------------------------------------------------------------
# 1. Maestros
# ---------------------------------------------------------------------------
FAMILIAS = ["Café", "Infusiones", "Leche", "Azúcar y complementos", "Maquinaria", "Menaje"]
IVA = {"Café": 10, "Infusiones": 10, "Leche": 4, "Azúcar y complementos": 10, "Maquinaria": 21, "Menaje": 21}
GRAN = {"Café": 10, "Infusiones": 10, "Leche": 25, "Azúcar y complementos": 10, "Maquinaria": 100, "Menaje": 100}
MARGEN = {"Café": (0.36, 0.46), "Infusiones": (0.40, 0.50), "Leche": (0.11, 0.17),
          "Azúcar y complementos": (0.30, 0.40), "Maquinaria": (0.24, 0.30), "Menaje": (0.36, 0.46)}
TARIFA = [
    ("CAF-NAT-1K", "Café en grano natural 1 kg", "Café", 15.9),
    ("CAF-MEZ-1K", "Café en grano mezcla 70/30 1 kg", "Café", 13.8),
    ("CAF-ARA-1K", "Café en grano 100 % arábica 1 kg", "Café", 18.4),
    ("CAF-DES-1K", "Café en grano descafeinado 1 kg", "Café", 17.6),
    ("CAF-ESP-1K", "Café en grano espresso bar 1 kg", "Café", 16.5),
    ("CAF-ECO-1K", "Café en grano ecológico 1 kg", "Café", 21.9),
    ("CAF-MOL-250", "Café molido natural 250 g", "Café", 4.2),
    ("CAF-MOM-250", "Café molido mezcla 250 g", "Café", 3.6),
    ("CAF-MDE-250", "Café molido descafeinado 250 g", "Café", 4.6),
    ("CAF-CAP-100", "Cápsulas compatibles intenso (caja 100)", "Café", 24.5),
    ("CAF-CAD-100", "Cápsulas compatibles descafeinado (caja 100)", "Café", 25.9),
    ("CAF-MON-150", "Monodosis de papel (caja 150)", "Café", 29.8),
    ("CAF-SOL-500", "Café soluble 500 g", "Café", 11.4),
    ("CAF-SDE-500", "Café soluble descafeinado 500 g", "Café", 12.6),
    ("CAF-HOS-3K", "Café en grano hostelería 3 kg", "Café", 41.7),
    ("CAF-VEN-1K", "Café para vending 1 kg", "Café", 12.9),
    ("INF-MAN-100", "Manzanilla (caja 100 sobres)", "Infusiones", 6.8),
    ("INF-POL-100", "Poleo menta (caja 100 sobres)", "Infusiones", 6.9),
    ("INF-TVE-100", "Té verde (caja 100 sobres)", "Infusiones", 8.4),
    ("INF-TNE-100", "Té negro desayuno (caja 100 sobres)", "Infusiones", 8.9),
    ("INF-TRO-100", "Té rojo (caja 100 sobres)", "Infusiones", 9.6),
    ("INF-TIL-100", "Tila (caja 100 sobres)", "Infusiones", 7.2),
    ("INF-ROO-50", "Rooibos (caja 50 sobres)", "Infusiones", 6.5),
    ("INF-FRU-50", "Infusión de frutos rojos (caja 50 sobres)", "Infusiones", 6.2),
    ("INF-PIR-25", "Pirámides surtidas (caja 25)", "Infusiones", 7.9),
    ("INF-GRA-500", "Té negro a granel 500 g", "Infusiones", 14.3),
    ("LEC-ENT-6", "Leche entera UHT (caja 6 × 1 L)", "Leche", 6.75),
    ("LEC-SEM-6", "Leche semidesnatada UHT (caja 6 × 1 L)", "Leche", 6.50),
    ("LEC-DES-6", "Leche desnatada UHT (caja 6 × 1 L)", "Leche", 6.25),
    ("LEC-SLA-6", "Leche sin lactosa (caja 6 × 1 L)", "Leche", 8.25),
    ("LEC-BAR-6", "Leche entera barista (caja 6 × 1 L)", "Leche", 9.50),
    ("LEC-POL-1K", "Leche en polvo para vending 1 kg", "Leche", 7.75),
    ("AZU-SOB-1K", "Azúcar en sobres (caja 1.000)", "Azúcar y complementos", 14.6),
    ("AZU-MOR-1K", "Azúcar moreno en sobres (caja 1.000)", "Azúcar y complementos", 17.9),
    ("AZU-STI-500", "Azúcar en stick (caja 500)", "Azúcar y complementos", 9.4),
    ("AZU-CAC-1K", "Cacao soluble 1 kg", "Azúcar y complementos", 8.6),
    ("AZU-CHO-1K", "Chocolate a la taza 1 kg", "Azúcar y complementos", 9.8),
    ("AZU-GAL-300", "Galletas individuales (caja 300)", "Azúcar y complementos", 19.5),
    ("AZU-CAN-250", "Canela molida 250 g", "Azúcar y complementos", 5.3),
    ("AZU-SIR-1L", "Sirope de caramelo 1 L", "Azúcar y complementos", 7.4),
    ("MAQ-ESP-1G", "Cafetera espresso 1 grupo", "Maquinaria", 1290),
    ("MAQ-ESP-2G", "Cafetera espresso 2 grupos", "Maquinaria", 2150),
    ("MAQ-ESP-3G", "Cafetera espresso 3 grupos", "Maquinaria", 2890),
    ("MAQ-MOL-PRO", "Molinillo profesional 64 mm", "Maquinaria", 645),
    ("MAQ-MOL-DEM", "Molinillo a demanda", "Maquinaria", 890),
    ("MAQ-SUP-AUT", "Cafetera superautomática", "Maquinaria", 3450),
    ("MAQ-HIE-25", "Fabricador de hielo 25 kg", "Maquinaria", 980),
    ("MAQ-LAV-40", "Lavavasos 40 × 40", "Maquinaria", 1190),
    ("MAQ-ZUM-AUT", "Exprimidor automático", "Maquinaria", 1350),
    ("MAQ-BAT-PRO", "Batidora de vaso profesional", "Maquinaria", 389),
    ("MAQ-DES-8L", "Descalcificador 8 L", "Maquinaria", 215),
    ("MAQ-FIL-KIT", "Kit de filtros y juntas", "Maquinaria", 64),
    ("MEN-TES-12", "Tazas de espresso (caja 12)", "Menaje", 23),
    ("MEN-TCA-12", "Tazas de capuchino (caja 12)", "Menaje", 31),
    ("MEN-VAS-24", "Vasos de caña (caja 24)", "Menaje", 19),
    ("MEN-JAR-6", "Jarras de leche inox 0,6 L (6)", "Menaje", 42),
    ("MEN-CUC-50", "Cucharillas de café (50)", "Menaje", 17),
    ("MEN-PLA-12", "Platos de taza (12)", "Menaje", 14),
    ("MEN-TET-6", "Teteras de vidrio (6)", "Menaje", 38),
    ("MEN-SER-2K", "Servilletas de papel (caja 2.000)", "Menaje", 26),
    ("MEN-AZU-12", "Azucareros dosificadores (12)", "Menaje", 29),
    ("MEN-TAM-58", "Prensador de acero 58 mm", "Menaje", 32),
    ("MEN-CAJ-1", "Cajón de posos", "Menaje", 18),
    ("MEN-TER-6", "Termómetros de leche (6)", "Menaje", 27),
]
assert len(TARIFA) == 64 and len({t[0] for t in TARIFA}) == 64
DESCATALOGADOS = {"CAF-ETI-1K": ("Café", 2280), "INF-JEN-100": ("Infusiones", 760), "MEN-COP-12": ("Menaje", 3600)}
NUEVO = ("CAF-COL-1K", 1980)   # aparece en la semana 45; no está en la tarifa

TAR = {}
for cod, desc, fam, p in TARIFA:
    pc = int(round(p * 100))
    assert pc % GRAN[fam] == 0, cod
    m = R.uniform(*MARGEN[fam])
    TAR[cod] = {"desc": desc, "fam": fam, "precio": pc, "coste": int(round(pc * (1 - m))), "iva": IVA[fam]}
POR_FAM = {f: [c for c in TAR if TAR[c]["fam"] == f] for f in FAMILIAS}
POP = {c: float(NPR.lognormal(0, 0.9)) for c in TAR}
for c in ["CAF-ESP-1K", "CAF-MEZ-1K", "LEC-SEM-6", "LEC-ENT-6", "AZU-SOB-1K", "INF-MAN-100"]:
    POP[c] *= 3

# Clientes ------------------------------------------------------------------
LUGARES = ["El Rincón", "La Plaza", "Los Arcos", "El Puente", "La Esquina", "El Mirador", "La Estación", "El Mercado",
           "La Ribera", "El Parque", "Los Soportales", "La Fuente", "El Molino", "La Bodeguilla", "El Cruce", "La Torre",
           "El Campanario", "La Alameda", "El Portalón", "La Muralla", "El Lagar", "La Era", "El Pinar", "La Cigüeña",
           "El Castillo", "La Dársena", "El Canal", "La Huerta", "El Olmo", "La Encina", "Las Tenerías", "La Rúa",
           "El Prado", "La Vega", "Los Pinos", "El Corrillo", "El Paso", "La Chopera", "El Fogón", "La Brasa",
           "La Cepa", "El Sarmiento", "La Viña", "El Horno", "La Hoguera", "El Trigal", "La Noria", "El Pozo"]
COMARCAS = ["Pisuerga", "Esgueva", "Arlanzón", "Carrión", "Cerrato", "Las Moreras", "Montes Torozos", "Valdavia",
            "La Demanda", "Las Loras", "Tierra de Pinares", "Los Templarios", "El Convento", "La Villa", "Río Ucieza",
            "Valle del Cuco", "Los Almendros", "La Atalaya"]
APELLIDOS = ["Herrero", "Calvo", "Pastor", "Arranz", "Villa", "Gallego", "Merino", "Cuesta", "Sanz", "Lobato",
             "Tejedor", "Rebollo", "Velasco", "Bermejo", "del Olmo", "Garrido", "Escudero", "Maroto", "Peña", "Alonso"]
PREF = {"Bar": ["Bar", "Cafetería", "Café-bar"], "Restaurante": ["Restaurante", "Asador", "Mesón", "Casa de comidas"],
        "Hotel": ["Hotel", "Hostal", "Hotel rural", "Posada"],
        "Tienda": ["Ultramarinos", "Delicatessen", "Autoservicio", "Tienda gourmet"]}
N_TIPO = {"Bar": 52, "Restaurante": 42, "Hotel": 20, "Tienda": 34}
N_ZONA = {"Valladolid capital": 52, "Valladolid provincia": 38, "Palencia": 29, "Burgos": 29}
ZONAS = list(N_ZONA)
TIPOS = list(N_TIPO)
COMERCIAL = {"Valladolid capital": ["VA01", "VA02"], "Valladolid provincia": ["VA03"], "Palencia": ["PA01"], "Burgos": ["BU01"]}
MULT = {"Bar": 1.0, "Restaurante": 1.3, "Hotel": 1.8, "Tienda": 0.8}
DIAS_PAGO = {"Bar": [30, 30, 45, 60], "Restaurante": [30, 45, 60], "Hotel": [45, 60, 60], "Tienda": [30, 30, 45]}
LIM_BASE = {"Bar": 3000, "Restaurante": 5000, "Hotel": 9000, "Tienda": 2500}
FAMW = {"Bar": [42, 12, 22, 13, 1.2, 9.5], "Restaurante": [39, 14, 19, 13, 1.5, 13],
        "Hotel": [36, 18, 20, 12, 2, 12], "Tienda": [46, 20, 15, 17, 0.3, 2]}

tipos = [t for t, n in N_TIPO.items() for _ in range(n)]
zonas = [z for z, n in N_ZONA.items() for _ in range(n)]
R.shuffle(tipos)
R.shuffle(zonas)
nombres_usados = set()
CLI = []
for i in range(148):
    t = tipos[i]
    while True:
        base = R.choice(APELLIDOS) if t == "Tienda" else (R.choice(COMARCAS) if t == "Hotel" else R.choice(LUGARES))
        nom = f"{R.choice(PREF[t])} {base}"
        if R.random() < 0.25:
            nom += ", S.L."
        if nom.split(",")[0] not in {n.split(",")[0] for n in nombres_usados}:
            break
    nombres_usados.add(nom)
    z = zonas[i]
    CLI.append({"cod": f"C{1001 + i}", "nombre": nom, "tipo": t, "zona": z, "zona_txt": z,
                "dias": R.choice(DIAS_PAGO[t]), "limite": None, "com": R.choice(COMERCIAL[z]),
                "w": float(NPR.lognormal(0, 1.0)) * MULT[t],
                "dto": R.choices([0, 3, 5], [70, 20, 10])[0]})
for c in R.sample(CLI, 12):
    c["w"] = 0.0          # clientes sin pedidos en el periodo
CLID = {c["cod"]: c for c in CLI}


def precio_linea(cli, cod):
    t = TAR[cod]
    if t["fam"] == "Café" and cli["dto"]:
        return int(round(t["precio"] * (100 - cli["dto"]) / 100 / 10)) * 10
    return t["precio"]


def cantidad(cod):
    if cod.startswith("CAF-") and cod.endswith(("-1K",)):
        return int(min(30, max(1, round(NPR.lognormal(1.9, 0.6)))))
    if cod == "CAF-HOS-3K":
        return R.randint(1, 8)
    if cod.endswith("-250"):
        return R.choice([6, 12, 12, 18, 24, 36, 48])
    if cod.startswith("CAF-"):
        return R.randint(1, 6)
    if cod.startswith("LEC-") and cod.endswith("-6"):
        return R.choices([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30], [8, 10, 12, 10, 12, 10, 10, 8, 7, 6, 4, 3])[0]
    if cod.startswith(("INF-", "LEC-", "AZU-", "MEN-")):
        return R.randint(1, 8 if cod.startswith("INF-") else 6)
    if cod == "MAQ-FIL-KIT":
        return R.randint(1, 4)
    if cod == "MAQ-DES-8L":
        return R.randint(1, 2)
    return 1


def dias_laborables(d0, d1, excluir=()):
    out, d = [], d0
    while d <= d1:
        if d.weekday() < 5 and d not in excluir:
            out.append(d)
        d += timedelta(days=1)
    return out


def generar_pedidos(dias, n_lineas, num0):
    pesos = [(0.8 if d.month == 8 else 1.0 if d.month == 9 else 1.1) * (1.15 if d.weekday() == 0 else 0.9 if d.weekday() == 4 else 1)
             for d in dias]
    n_ped = round(n_lineas / 2.75)
    ks = [R.choices([1, 2, 3, 4, 5], [22, 30, 24, 15, 9])[0] for _ in range(n_ped)]
    while sum(ks) > n_lineas:
        i = R.randrange(n_ped)
        if ks[i] > 1:
            ks[i] -= 1
    while sum(ks) < n_lineas:
        i = R.randrange(n_ped)
        if ks[i] < 6:
            ks[i] += 1
    fechas = sorted(R.choices(dias, weights=pesos, k=n_ped))
    activos = [c for c in CLI if c["w"] > 0]
    wact = [c["w"] for c in activos]
    lineas = []
    for j, (f, k) in enumerate(zip(fechas, ks)):
        cli = R.choices(activos, weights=wact)[0]
        num = f"PV26-{num0 + j:05d}"
        usados = set()
        while len(usados) < k:
            fam = R.choices(FAMILIAS, weights=FAMW[cli["tipo"]])[0]
            cod = R.choices(POR_FAM[fam], weights=[POP[x] for x in POR_FAM[fam]])[0]
            if cod in usados:
                continue
            usados.add(cod)
            lineas.append({"fecha": f, "pedido": num, "cli": cli["cod"], "cod": cod, "cant": cantidad(cod),
                           "precio": precio_linea(cli, cod), "com": cli["com"]})
    return lineas, num0 + n_ped


DIAS = dias_laborables(date(2026, 8, 31), date(2026, 10, 30), excluir={date(2026, 10, 12)})
LEG, siguiente = generar_pedidos(DIAS, N_LEGIT, 4101)

# Al menos 3 cafeteras de 2 grupos vendidas en Burgos (para la tarea B5)
def zona_de(cod_cli):
    return CLID[cod_cli]["zona"]


ya = [l for l in LEG if l["cod"] == PROD_SIM and zona_de(l["cli"]) == ZONA_SIM]
cands = [l for l in LEG if zona_de(l["cli"]) == ZONA_SIM and TAR[l["cod"]]["fam"] in ("Menaje", "Azúcar y complementos")]
R.shuffle(cands)
for l in cands:
    if len(ya) >= 3:
        break
    if any(x["pedido"] == l["pedido"] and x["cod"] == PROD_SIM for x in LEG):
        continue
    l["cod"], l["cant"], l["precio"] = PROD_SIM, 1, TAR[PROD_SIM]["precio"]
    ya.append(l)


def margen_por_cliente(lineas):
    m = Counter()
    for l in lineas:
        if l["cod"] in TAR:
            m[l["cli"]] += l["cant"] * (l["precio"] - TAR[l["cod"]]["coste"])
    return m


top10 = {c for c, _ in margen_por_cliente(LEG).most_common(10)}
# 8 líneas con productos descatalogados: solo clientes de Valladolid (capital o provincia) fuera del top 10
reparto = ["CAF-ETI-1K"] * 4 + ["INF-JEN-100"] * 2 + ["MEN-COP-12"] * 2
for cod_d in reparto:
    fam_d, precio_d = DESCATALOGADOS[cod_d]
    while True:
        l = R.choice(LEG)
        if (zona_de(l["cli"]).startswith("Valladolid") and l["cli"] not in top10 and l["cod"] in TAR
                and TAR[l["cod"]]["fam"] == fam_d and not any(x["pedido"] == l["pedido"] and x["cod"] == cod_d for x in LEG)):
            break
    l["cod"], l["precio"] = cod_d, precio_d
    l["cant"] = R.randint(2, 10) if fam_d == "Café" else R.randint(1, 4)

LEG.sort(key=lambda l: (l["fecha"], l["pedido"]))
assert len(LEG) == N_LEGIT and len({(l["pedido"], l["cod"]) for l in LEG}) == N_LEGIT

# Semana 45 (02/11 a 06/11/2026): limpia, con un producto nuevo en 3 líneas
S45, _ = generar_pedidos(dias_laborables(date(2026, 11, 2), date(2026, 11, 6)), N_S45, siguiente)
cand45 = [l for l in S45 if l["cod"] in TAR and TAR[l["cod"]]["fam"] == "Café" and l["cod"].endswith("-1K")]
R.shuffle(cand45)
ped_nuevo = set()
for l in cand45:
    if len(ped_nuevo) == N_NUEVO:
        break
    if l["pedido"] not in ped_nuevo:
        ped_nuevo.add(l["pedido"])
        l["cod"], l["precio"] = NUEVO
assert sum(1 for l in S45 if l["cod"] == NUEVO[0]) == N_NUEVO
S45.sort(key=lambda l: (l["fecha"], l["pedido"]))

# ---------------------------------------------------------------------------
# 2. Cobros (410 facturas) y límites de crédito
# ---------------------------------------------------------------------------
dias_fac = dias_laborables(date(2026, 3, 2), date(2026, 10, 30))
w_fac = [1 + 3 * i / len(dias_fac) for i in range(len(dias_fac))]
COB = []
for _ in range(N_COBROS):
    cli = R.choices(CLI, weights=[c["w"] + 0.3 for c in CLI])[0]
    ff = R.choices(dias_fac, weights=w_fac)[0]
    imp = int(round(min(9000, max(40, NPR.lognormal(math.log(560), 0.8) * MULT[cli["tipo"]])) * 100))
    COB.append({"cli": cli["cod"], "fecha": ff, "venc": ff + timedelta(days=cli["dias"]), "imp": imp, "cob": None})


def dias_vencidos(f):
    return (CORTE - f["venc"]).days


for f in COB:
    d, u = dias_vencidos(f), R.random()
    if d <= 0:
        f["cob"] = f["imp"] if u < 0.15 else 0
    elif d <= 30:
        f["cob"] = f["imp"] if u < 0.50 else (int(f["imp"] * R.uniform(0.3, 0.7)) if u < 0.65 else 0)
    elif d <= 60:
        f["cob"] = f["imp"] if u < 0.75 else (int(f["imp"] * R.uniform(0.3, 0.7)) if u < 0.85 else 0)
    else:
        f["cob"] = f["imp"] if u < 0.90 else (int(f["imp"] * R.uniform(0.3, 0.7)) if u < 0.93 else 0)
# Casos frontera de los tramos: 0, 30, 31, 60 y 61 días vencidos, sin cobrar
frontera = R.sample(range(N_COBROS), 5)
for idx, d in zip(frontera, [0, 30, 31, 60, 61]):
    f = COB[idx]
    f["venc"] = CORTE - timedelta(days=d)
    f["fecha"] = f["venc"] - timedelta(days=CLID[f["cli"]]["dias"])
    f["cob"] = 0
# 3 facturas cobradas de más (saldo a favor), ninguna vencida a más de 60 días
cand = [i for i, f in enumerate(COB) if i not in frontera and -40 <= dias_vencidos(f) <= 20]
a_favor = R.sample(cand, 3)
for idx, extra in zip(a_favor, ["doble", 10000, 3750]):
    f = COB[idx]
    f["cob"] = 2 * f["imp"] if extra == "doble" else f["imp"] + extra
COB.sort(key=lambda f: (f["fecha"], f["cli"]))
for i, f in enumerate(COB):
    f["num"] = f"FV26-{812 + i:05d}"

pend = Counter()
for f in COB:
    if f["imp"] - f["cob"] > 0:
        pend[f["cli"]] += f["imp"] - f["cob"]
cli_favor = {COB_i["cli"] for COB_i in COB if COB_i["imp"] - COB_i["cob"] < 0}
umbral = 200000
while len([c for c in CLI if pend[c["cod"]] >= umbral and c["cod"] not in cli_favor]) < N_SOBRE_LIMITE + 3:
    umbral -= 20000
cand_sobre = [c for c in CLI if pend[c["cod"]] >= umbral and c["cod"] not in cli_favor]
sobre = {c["cod"] for c in R.sample(cand_sobre, N_SOBRE_LIMITE)}
for c in CLI:
    p = pend[c["cod"]]
    if c["cod"] in sobre:
        c["limite"] = max(500, ((p - 15000) // 50000) * 500)
    else:
        lim = max(1000, int(round(LIM_BASE[c["tipo"]] * R.uniform(0.7, 1.5) / 500)) * 500)
        if lim * 100 < p + 10000:
            lim = int(math.ceil((p + 10000) / 50000)) * 500
        c["limite"] = lim
    assert abs(p - c["limite"] * 100) >= 5000, c["cod"]

# ---------------------------------------------------------------------------
# 3. Suciedad
# ---------------------------------------------------------------------------
idx_sin = [i for i, l in enumerate(LEG) if l["cod"] not in TAR]
assert len(idx_sin) == N_SIN
# Duplicados: la exportación repite las 12 últimas líneas de un día (solape)
por_dia = Counter(l["fecha"] for l in LEG)
dias_ok = [d for d in DIAS if por_dia[d] >= 20 and d.month == 10]
dia_dup = R.choice(dias_ok)
idx_dia = [i for i, l in enumerate(LEG) if l["fecha"] == dia_dup]
idx_dup = idx_dia[-N_DUP:]
assert not set(idx_dup) & set(idx_sin)
libres = [i for i in range(N_LEGIT) if i not in idx_dup and i not in idx_sin]
R.shuffle(libres)
idx_iso = set(libres[:N_ISO])
idx_pre = set(libres[N_ISO:N_ISO + N_PRECIO])
resto = libres[N_ISO + N_PRECIO:]
esp_bu = [i for i in resto if zona_de(LEG[i]["cli"]) == "Burgos"][:3]
esp_pa = [i for i in resto if zona_de(LEG[i]["cli"]) == "Palencia"][:2]
esp_otros = [i for i in resto if i not in esp_bu and i not in esp_pa][:N_ESP - 5]
idx_esp = set(esp_bu + esp_pa + esp_otros)
assert len(idx_esp) == N_ESP

# Zonas mal escritas en Clientes: clientes con ventas
ventas_cli = Counter()
for l in LEG:
    ventas_cli[l["cli"]] += l["cant"] * l["precio"]
mal = [("Burgos", "burgos"), ("Burgos", "BURGOS "), ("Burgos", " Burgos"),
       ("Palencia", "palencia"), ("Palencia", "Palencia "), ("Valladolid capital", "valladolid  capital")]
elegidos = set()
LOG = []
for zona, txt in mal:
    c = R.choice([c for c in CLI if c["zona"] == zona and ventas_cli[c["cod"]] > 0 and c["cod"] not in elegidos])
    elegidos.add(c["cod"])
    c["zona_txt"] = txt

RAW = []   # filas de la hoja Pedidos tal como llegan
for i, l in enumerate(LEG):
    fila = {"Fecha": l["fecha"], "NumPedido": l["pedido"], "CodCliente": l["cli"], "CodProducto": l["cod"],
            "Cantidad": l["cant"], "PrecioUnitario": l["precio"] / 100, "CodComercial": l["com"]}
    if i in idx_iso:
        fila["Fecha"] = l["fecha"].isoformat()
    if i in idx_pre:
        fila["PrecioUnitario"] = f"{l['precio'] / 100:.2f}"
    if i in idx_esp:
        fila["CodCliente"] = l["cli"] + " "
    RAW.append(fila)
    if i == idx_dup[-1]:
        for j in idx_dup:
            RAW.append({"Fecha": LEG[j]["fecha"], "NumPedido": LEG[j]["pedido"], "CodCliente": LEG[j]["cli"],
                        "CodProducto": LEG[j]["cod"], "Cantidad": LEG[j]["cant"], "PrecioUnitario": LEG[j]["precio"] / 100,
                        "CodComercial": LEG[j]["com"], "_dup": True})
RAW.append({"Fecha": "Total", "NumPedido": "", "CodCliente": "", "CodProducto": "",
            "Cantidad": sum(r["Cantidad"] for r in RAW), "PrecioUnitario": "", "CodComercial": "", "_total": True})
assert len(RAW) == 1240

for n, r in enumerate(RAW, start=2):
    if r.get("_dup"):
        LOG.append((n, "toda la fila", "Q01 Duplicado exacto (la exportación repite el final del día)", f"{r['NumPedido']} {r['CodProducto']}"))
    elif r.get("_total"):
        LOG.append((n, "toda la fila", "Q10 Fila de totales mezclada con los datos", f"Cantidad {r['Cantidad']}"))
    else:
        if isinstance(r["Fecha"], str):
            LOG.append((n, "Fecha", "Q07 Fecha ISO guardada como texto", r["Fecha"]))
        if isinstance(r["PrecioUnitario"], str):
            LOG.append((n, "PrecioUnitario", "Q05 Precio con punto decimal guardado como texto", r["PrecioUnitario"]))
        if r["CodCliente"].endswith(" "):
            LOG.append((n, "CodCliente", "Q04 Espacio al final del código", repr(r["CodCliente"])))
        if r["CodProducto"] not in TAR:
            LOG.append((n, "CodProducto", "Q16 Producto descatalogado que no está en la tarifa", r["CodProducto"]))
for c in CLI:
    if c["zona_txt"] != c["zona"]:
        LOG.append((f"Clientes {c['cod']}", "Zona", "Q08 Zona mal escrita", repr(c["zona_txt"])))
for f in COB:
    if f["cob"] > f["imp"]:
        LOG.append((f"Cobros {f['num']}", "Cobrado", "Q17 Cobrada de más (saldo a favor)", f"{(f['cob'] - f['imp']) / 100:.2f}"))
with open(F_LOG, "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["fila", "columna", "problema", "valor"])
    w.writerows(LOG)

# ---------------------------------------------------------------------------
# 4. Verdad (pandas) y simulación de la limpieza desde los datos sucios
# ---------------------------------------------------------------------------
def a_df(lineas):
    df = pd.DataFrame(lineas)
    df["base_c"] = df["cant"] * df["precio"]
    df["fam"] = df["cod"].map(lambda c: TAR[c]["fam"] if c in TAR else "SIN TARIFA")
    df["iva_pct"] = df["cod"].map(lambda c: TAR[c]["iva"] if c in TAR else np.nan)
    df["coste_c"] = df["cod"].map(lambda c: TAR[c]["coste"] if c in TAR else np.nan)
    df["iva_c"] = df["base_c"] * df["iva_pct"] / 100
    df["margen_c"] = df["base_c"] - df["cant"] * df["coste_c"]
    df["zona"] = df["cli"].map(zona_de)
    df["tipo"] = df["cli"].map(lambda c: CLID[c]["tipo"])
    return df


D = a_df(LEG)
D45 = a_df(S45)
DT = pd.concat([D, D45], ignore_index=True)
assert (D["iva_c"].dropna() % 1 == 0).all() and (D45["iva_c"].dropna() % 1 == 0).all(), "IVA no exacto en céntimos"

# Limpieza simulada (lo que debe hacer la alumna)
s = pd.DataFrame([{k: v for k, v in r.items() if not k.startswith("_")} for r in RAW])
s = s[s["Fecha"] != "Total"].copy()
s["Fecha"] = s["Fecha"].map(lambda x: date.fromisoformat(x) if isinstance(x, str) else x)
s["PrecioUnitario"] = s["PrecioUnitario"].map(lambda x: float(x) if isinstance(x, str) else x)
s["CodCliente"] = s["CodCliente"].str.strip()
s = s.drop_duplicates()
v = pd.DataFrame({"Fecha": D["fecha"], "NumPedido": D["pedido"], "CodCliente": D["cli"], "CodProducto": D["cod"],
                  "Cantidad": D["cant"], "PrecioUnitario": D["precio"] / 100, "CodComercial": D["com"]})
ordenar = ["NumPedido", "CodProducto"]
assert len(s) == N_LEGIT
pd.testing.assert_frame_equal(s.sort_values(ordenar).reset_index(drop=True), v.sort_values(ordenar).reset_index(drop=True), check_dtype=False)

eur = lambda c: round(float(c) / 100, 2)
con = D[D["fam"] != "SIN TARIFA"]
CT = {}
# B1
CT["b1_lineas"] = N_LEGIT
CT["b1_cantidad"] = int(D["cant"].sum())
CT["b1_octubre"] = int((pd.to_datetime(D["fecha"]).dt.month == 10).sum())
CT["b1_clientes"] = int(D["cli"].nunique())
# B2
CT["b2_base"] = eur(D["base_c"].sum())
for t in (4, 10, 21):
    CT[f"b2_iva{t}"] = eur(con.loc[con["iva_pct"] == t, "iva_c"].sum())
CT["b2_margen"] = eur(con["margen_c"].sum())
CT["b2_sin_tarifa"] = int((D["fam"] == "SIN TARIFA").sum())
# B3
base_zona = D.groupby("zona")["base_c"].sum()
CT["b3_base_burgos"] = eur(base_zona["Burgos"])
assert not ((D["fam"] == "SIN TARIFA") & D["zona"].isin(["Burgos", "Palencia"])).any()
pal = D[D["zona"] == "Palencia"]
CT["b3_pct_cafe_palencia"] = round(100 * pal.loc[pal["fam"] == "Café", "base_c"].sum() / pal["base_c"].sum(), 2)
mcli = con.groupby("cli")["margen_c"].sum().sort_values(ascending=False)
assert mcli.iloc[:6].is_unique and mcli.iloc[5] < mcli.iloc[4]
TOP5 = [(c, CLID[c]["nombre"], CLID[c]["zona"], eur(m), eur(D.loc[D["cli"] == c, "base_c"].sum())) for c, m in mcli.iloc[:5].items()]
assert not (D[(D["cli"] == TOP5[0][0])]["fam"] == "SIN TARIFA").any()
CT["b3_margen_top"] = TOP5[0][3]
# B4
cb = pd.DataFrame(COB)
cb["saldo"] = cb["imp"] - cb["cob"]
cb["dias"] = cb["venc"].map(lambda d: (CORTE - d).days)


def tramo(r):
    if r["saldo"] < 0:
        return "Saldo a favor"
    if r["saldo"] == 0:
        return "Cobrada"
    d = r["dias"]
    return "Sin vencer" if d <= 0 else "De 1 a 30 días" if d <= 30 else "De 31 a 60 días" if d <= 60 else "Más de 60 días"


cb["tramo"] = cb.apply(tramo, axis=1)
TRAMOS = ["Sin vencer", "De 1 a 30 días", "De 31 a 60 días", "Más de 60 días"]
CT["b4_pendiente"] = eur(cb.loc[cb["saldo"] > 0, "saldo"].sum())
CT["b4_mas60"] = eur(cb.loc[cb["tramo"] == "Más de 60 días", "saldo"].sum())
deuda = cb[cb["saldo"] > 0].groupby("cli")["saldo"].sum()
neto = cb.groupby("cli")["saldo"].sum()
lim = pd.Series({c["cod"]: c["limite"] * 100 for c in CLI})
CT["b4_sobre_limite"] = int((deuda > lim.reindex(deuda.index)).sum())
assert CT["b4_sobre_limite"] == N_SOBRE_LIMITE
assert int((neto > lim.reindex(neto.index)).sum()) == N_SOBRE_LIMITE   # da igual restar los saldos a favor
assert cb.loc[cb["saldo"] < 0, "dias"].max() <= 60
# B5
mb = con[(con["fam"] == "Maquinaria") & (con["zona"] == ZONA_SIM)]
base_maq, coste_maq = mb["base_c"].sum(), (mb["cant"] * mb["coste_c"]).sum()
q = int(mb.loc[mb["cod"] == PROD_SIM, "cant"].sum())
base_prod = mb.loc[mb["cod"] == PROD_SIM, "base_c"].sum()
base_resto = base_maq - base_prod
precio_nec = (coste_maq / (1 - OBJETIVO) - base_resto) / q / 100
CT["b5_margen_actual"] = round(100 * (base_maq - coste_maq) / base_maq, 2)
CT["b5_precio"] = round(precio_nec, 2)
PRECIO_ACTUAL_MEDIO = base_prod / q / 100
assert q >= 3 and CT["b5_margen_actual"] < 35
# B6
CT["b6_lineas"] = N_LEGIT + N_S45
CT["b6_sin_tarifa"] = int((DT["fam"] == "SIN TARIFA").sum())
CT["b6_base"] = eur(DT["base_c"].sum())
assert CT["b6_sin_tarifa"] == N_SIN + N_NUEVO

# Cifras auxiliares para el correo modelo y la solución
AUX = {
    "margen_pct": round(100 * con["margen_c"].sum() / D["base_c"].sum(), 1),
    "pct_zona": {z: round(100 * base_zona[z] / D["base_c"].sum(), 1) for z in ZONAS},
    "base_zona": {z: eur(base_zona[z]) for z in ZONAS},
    "base_sin": eur(D.loc[D["fam"] == "SIN TARIFA", "base_c"].sum()),
    "favor": eur(-cb.loc[cb["saldo"] < 0, "saldo"].sum()),
    "pct_fam": {f: round(100 * D.loc[D["fam"] == f, "base_c"].sum() / D["base_c"].sum(), 1) for f in FAMILIAS},
    "fam_top_zona": {z: D[(D["zona"] == z) & (D["fam"] != "SIN TARIFA")].groupby("fam")["base_c"].sum().idxmax() for z in ZONAS},
    "precio_actual": round(PRECIO_ACTUAL_MEDIO, 2), "q": q,
    "dup_cant": int(sum(LEG[j]["cant"] for j in idx_dup)), "dup_base": eur(sum(LEG[j]["cant"] * LEG[j]["precio"] for j in idx_dup)),
    "dia_dup": dia_dup.strftime("%d/%m/%Y"),
    "venc_total": eur(cb.loc[(cb["saldo"] > 0) & (cb["dias"] > 0), "saldo"].sum()),
    "tramos": {t: eur(cb.loc[cb["tramo"] == t, "saldo"].sum()) for t in TRAMOS},
    "sobre": sorted([(c, CLID[c]["nombre"], eur(deuda[c]), CLID[c]["limite"]) for c in deuda.index if deuda[c] > CLID[c]["limite"] * 100], key=lambda x: -x[2]),
    "base_iso_oct": int(sum(1 for i in idx_iso if LEG[i]["fecha"].month == 10)),
}
json.dump({"controles": CT, "aux": AUX, "top5": TOP5}, open(F_CTRL, "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)

# ---------------------------------------------------------------------------
# 5. Libros
# ---------------------------------------------------------------------------
def es(x, dec=2):
    s_ = f"{x:,.{dec}f}"
    return s_.replace(",", "X").replace(".", ",").replace("X", ".")


def esn(n):
    return f"{n:,}".replace(",", ".")


def formatos(wb):
    F = {}
    F["tit"] = wb.add_format({"bold": True, "font_size": 14, "font_color": "#5B3A1E"})
    F["sub"] = wb.add_format({"bold": True, "font_size": 11, "font_color": "#5B3A1E"})
    F["cab"] = wb.add_format({"bold": True, "bg_color": "#EDE3D6", "border": 1, "text_wrap": True, "valign": "top"})
    F["txt"] = wb.add_format({"text_wrap": True, "valign": "top"})
    F["fecha"] = wb.add_format({"num_format": "dd/mm/yyyy"})
    F["eur"] = wb.add_format({"num_format": "#,##0.00 €"})
    F["eur2"] = wb.add_format({"num_format": "#,##0.00"})
    F["eurb"] = wb.add_format({"num_format": "#,##0.00 €", "bold": True})
    F["pct"] = wb.add_format({"num_format": "0%"})
    F["pct1"] = wb.add_format({"num_format": "0.0%"})
    F["pct2"] = wb.add_format({"num_format": "0.00%"})
    F["ent"] = wb.add_format({"num_format": "#,##0"})
    F["in_fecha"] = wb.add_format({"num_format": "dd/mm/yyyy", "bg_color": "#FFF2B3", "border": 1})
    F["in_pct"] = wb.add_format({"num_format": "0%", "bg_color": "#FFF2B3", "border": 1})
    F["in_txt"] = wb.add_format({"bg_color": "#FFF2B3", "border": 1})
    F["in_eur"] = wb.add_format({"num_format": "#,##0.00 €", "bg_color": "#FFF2B3", "border": 1})
    F["in_ent"] = wb.add_format({"num_format": "0", "bg_color": "#FFF2B3", "border": 1})
    F["ok"] = wb.add_format({"bg_color": "#C6EFCE", "font_color": "#006100", "bold": True})
    F["mal"] = wb.add_format({"bg_color": "#FFC7CE", "font_color": "#9C0006", "bold": True})
    F["neg"] = wb.add_format({"bold": True})
    return F


def hoja_texto(ws, F, lineas, ancho=120):
    ws.set_column(0, 0, ancho)
    ws.hide_gridlines(2)
    for r, (estilo, t) in enumerate(lineas):
        ws.write_string(r, 0, t, F[estilo] if estilo else F["txt"])


def escribir_maestros(wb, F, ws_cli, ws_tar, ws_cob, extra_cli=False):
    ws_cli.write_row(0, 0, ["CodCliente", "Nombre", "Tipo", "Zona", "DíasPago", "Límite"], F["cab"])
    for r, c in enumerate(CLI, start=1):
        ws_cli.write_string(r, 0, c["cod"])
        ws_cli.write_string(r, 1, c["nombre"])
        ws_cli.write_string(r, 2, c["tipo"])
        ws_cli.write_string(r, 3, c["zona_txt"])
        ws_cli.write_number(r, 4, c["dias"])
        ws_cli.write_number(r, 5, c["limite"], F["eur"])
    ws_cli.set_column(0, 0, 11); ws_cli.set_column(1, 1, 36); ws_cli.set_column(2, 2, 12); ws_cli.set_column(3, 3, 22)
    ws_cli.set_column(4, 5, 11); ws_cli.freeze_panes(1, 0)
    ws_tar.write_row(0, 0, ["CodProducto", "Descripción", "Familia", "TipoIVA", "Coste", "PrecioTarifa"], F["cab"])
    for r, (cod, desc, fam, _) in enumerate(TARIFA, start=1):
        t = TAR[cod]
        ws_tar.write_string(r, 0, cod); ws_tar.write_string(r, 1, desc); ws_tar.write_string(r, 2, fam)
        ws_tar.write_number(r, 3, t["iva"] / 100, F["pct"])
        ws_tar.write_number(r, 4, t["coste"] / 100, F["eur"]); ws_tar.write_number(r, 5, t["precio"] / 100, F["eur"])
    ws_tar.set_column(0, 0, 13); ws_tar.set_column(1, 1, 44); ws_tar.set_column(2, 2, 22); ws_tar.set_column(3, 5, 12)
    ws_tar.freeze_panes(1, 0)
    ws_cob.write_row(0, 0, ["NumFactura", "CodCliente", "FechaFactura", "Vencimiento", "Importe", "Cobrado"], F["cab"])
    for r, f in enumerate(COB, start=1):
        ws_cob.write_string(r, 0, f["num"]); ws_cob.write_string(r, 1, f["cli"])
        ws_cob.write_datetime(r, 2, datetime.combine(f["fecha"], datetime.min.time()), F["fecha"])
        ws_cob.write_datetime(r, 3, datetime.combine(f["venc"], datetime.min.time()), F["fecha"])
        ws_cob.write_number(r, 4, f["imp"] / 100, F["eur"]); ws_cob.write_number(r, 5, f["cob"] / 100, F["eur"])
    ws_cob.set_column(0, 1, 12); ws_cob.set_column(2, 5, 13); ws_cob.freeze_panes(1, 0)


def escribir_pedidos_sucios(ws, F):
    ws.write_row(0, 0, ["Fecha", "NumPedido", "CodCliente", "CodProducto", "Cantidad", "PrecioUnitario", "CodComercial"], F["cab"])
    for r, x in enumerate(RAW, start=1):
        if isinstance(x["Fecha"], date):
            ws.write_datetime(r, 0, datetime.combine(x["Fecha"], datetime.min.time()), F["fecha"])
        else:
            ws.write_string(r, 0, x["Fecha"])
        ws.write_string(r, 1, x["NumPedido"]); ws.write_string(r, 2, x["CodCliente"]); ws.write_string(r, 3, x["CodProducto"])
        ws.write_number(r, 4, x["Cantidad"])
        if isinstance(x["PrecioUnitario"], str):
            if x["PrecioUnitario"]:
                ws.write_string(r, 5, x["PrecioUnitario"])
        else:
            ws.write_number(r, 5, x["PrecioUnitario"], F["eur2"])
        if x["CodComercial"]:
            ws.write_string(r, 6, x["CodComercial"])
    ws.set_column(0, 0, 12); ws.set_column(1, 3, 13); ws.set_column(4, 6, 13); ws.freeze_panes(1, 0)


T_B = {
    "B1": ("Limpieza", 15, 10, "Deja Pedidos lista para analizar: una fila por línea real, fechas e importes que Excel reconozca y códigos sin espacios. La hoja original no se toca."),
    "B2": ("Cálculos y cruces", 20, 15, "Añade a cada línea la familia, el tipo de IVA, la zona y el tipo de cliente, y calcula base, IVA, total y margen. Si un producto no está en la tarifa, que se vea y que no rompa los totales."),
    "B3": ("Análisis", 15, 12, "Resumen de ventas (base) por zona y familia, con el peso de cada familia dentro de su zona, filtrable por tipo de cliente, y un gráfico que muestre qué familia pesa más en cada zona. ¿Cuáles son los 5 clientes con más margen?"),
    "B4": ("Cartera", 10, 10, "A 31/10/2026: cuánto debe cada cliente y desde cuándo (sin vencer, 1-30, 31-60, más de 60), y marca a los que superan su límite."),
    "B5": ("Qué pasaría si", 10, 6, "El director quiere que el margen de Maquinaria en Burgos sea del 35 %. ¿A qué precio medio habría que vender MAQ-ESP-2G, sin tocar los demás productos?"),
    "B6": ("Robustez", 5, 7, "Haz que el libro avise si algo no cuadra y que mañana se puedan añadir los pedidos de la semana 45 sin rehacer nada. Añádelos y comprueba."),
}
CRITERIOS = [
    "1. Una línea real es una combinación única de número de pedido y producto. Las filas repetidas idénticas son un error de la exportación, y la fila de totales no es una línea.",
    "2. Base = Cantidad × PrecioUnitario (sin IVA). IVA = Base × tipo de IVA del producto según la Tarifa, redondeado a 2 decimales en cada línea. Total = Base + IVA. Margen = Base − Cantidad × Coste de la Tarifa.",
    "3. Las líneas cuyo producto no está en la Tarifa son ventas reales: cuentan en la Base, pero su IVA, su coste y su margen no se conocen. Déjalos vacíos (no pongas 0 ni los inventes) y marca esas líneas para revisarlas.",
    "4. Las zonas válidas son las de la hoja Parámetros. Una zona mal escrita se corrige a la válida.",
    "5. Cartera a la fecha de corte (Parámetros). Saldo = Importe − Cobrado. Días vencidos = fecha de corte − Vencimiento. Tramos: «Sin vencer» (0 días o menos), «De 1 a 30 días», «De 31 a 60 días» y «Más de 60 días». Saldo 0 = factura cobrada. Saldo negativo = cobrada de más: es un saldo a favor del cliente, no entra en los tramos ni en la deuda y se lista aparte.",
    "6. Un cliente supera su límite cuando su deuda pendiente (la suma de sus saldos positivos, vencidos o no) es mayor que su Límite.",
    "7. El margen % de un grupo es Σ Margen / Σ Base del grupo (nunca el promedio de los porcentajes de cada línea).",
    "8. Las tareas B1 a B5 se hacen con las semanas 36 a 44. La semana 45 solo entra en B6.",
]


def instrucciones(ws, F):
    L = [
        ("tit", "Tostadero Albada, S.L. · Prueba técnica · Administrativa de gestión y análisis (Excel avanzado)"),
        ("", "Empresa inventada para este examen. Distribuye café, infusiones, leche, azúcar y complementos, maquinaria y menaje a bares, restaurantes, hoteles y tiendas de Valladolid, Palencia y Burgos. Las ventas salen del programa de gestión. Rodrigo Pardo, jefe de administración, te pasa este libro."),
        ("sub", "Cómo es la prueba (120 minutos)"),
        ("", "· Parte A · Criterio (15 min, 15 puntos): 12 preguntas en la web."),
        ("", "· Parte B · Libro (75 min, 60 puntos): seis tareas en este libro. Al terminar cada una, escribe en la web sus totales de control."),
        ("", "· Parte C · Correo de entrega (20 min, 25 puntos): el correo a Rodrigo con el que entregas el análisis (máximo 200 palabras)."),
        ("", "· Pon un cronómetro a la vista. Puedes usar la ayuda de Excel (F1). No puedes usar internet ni asistentes de IA."),
        ("", "· Variante «modo 2026» (opcional): Copilot permitido, pero anota en tu hoja Controles cómo has comprobado cada fórmula que te proponga."),
        ("sub", "Hojas de este libro"),
        ("", "· Pedidos: líneas de pedido de las semanas 36 a 44 (del 31/08 al 01/11/2026), tal como salen del programa. Columnas: Fecha, NumPedido, CodCliente, CodProducto, Cantidad, PrecioUnitario (sin IVA), CodComercial."),
        ("", "· Clientes: CodCliente, Nombre, Tipo (Bar, Restaurante, Hotel, Tienda), Zona, DíasPago y Límite de crédito."),
        ("", "· Tarifa: la vigente. CodProducto, Descripción, Familia, TipoIVA, Coste y PrecioTarifa (sin IVA)."),
        ("", "· Cobros: facturas emitidas con su vencimiento, su importe (con IVA) y lo cobrado de cada una."),
        ("", "· Parámetros: fecha de corte, objetivo de margen, tramos de antigüedad y listas de valores válidos."),
        ("", "· Aparte: examen-final-semana45.csv, con los pedidos de la semana 45 (del 02/11 al 06/11/2026), solo para la tarea B6."),
        ("sub", "Reglas de trabajo"),
        ("", "· No modifiques la hoja Pedidos original: trabaja en una copia o en hojas nuevas. Borrarla es un bloqueante."),
        ("", "· Guarda como «Examen_TuNombre_v01.xlsx» y ve guardando versiones (_v02, _v03…)."),
        ("", "· Separa datos, cálculos y resultados. Las cifras que pueden cambiar van en Parámetros, no dentro de las fórmulas."),
        ("sub", "Criterios de la empresa (ya pactados con Rodrigo)"),
    ] + [("", c) for c in CRITERIOS] + [("sub", "Parte B · Tareas")]
    for k, (nom, mins, pts, enun) in T_B.items():
        L.append(("neg", f"{k} · {nom} ({mins} min, {pts} puntos)"))
        L.append(("", f"«{enun}»"))
    L += [
        ("sub", "Qué entregas"),
        ("", "· Este libro con tu trabajo, con una hoja Controles: cada comprobación con su valor esperado, el obtenido, la diferencia y si cuadra; y un control maestro que diga OK solo si todo cuadra."),
        ("", "· En la web, los totales de control de cada tarea (los pide la propia web)."),
        ("", "· El correo de la Parte C."),
        ("sub", "Cómo comprobar antes de dar una cifra"),
        ("", "· Cuenta filas antes y después de cada paso, y explica la diferencia."),
        ("", "· Comprueba que la suma de un resumen coincide con la suma de los datos de los que sale."),
        ("", "· Prueba tus fórmulas con un caso que puedas calcular a mano."),
    ]
    hoja_texto(ws, F, L, ancho=125)


def parametros(ws, F, solucion=False):
    ws.set_column(0, 0, 44); ws.set_column(1, 1, 22); ws.set_column(2, 2, 22); ws.set_column(3, 3, 50)
    ws.write_row(0, 0, ["Parámetro", "Valor", "", "Nota"], F["cab"])
    ws.write_string(1, 0, "Fecha de corte de la cartera")
    ws.write_datetime(1, 1, datetime(2026, 10, 31), F["in_fecha"])
    ws.write_string(2, 0, "Margen objetivo de Maquinaria en Burgos (B5)")
    ws.write_number(2, 1, OBJETIVO, F["in_pct"])
    ws.write_string(3, 0, "Producto cuyo precio se puede cambiar (B5)")
    ws.write_string(3, 1, PROD_SIM, F["in_txt"])
    ws.write_string(4, 0, "Zona del objetivo (B5)")
    ws.write_string(4, 1, ZONA_SIM, F["in_txt"])
    if solucion:
        ws.write_string(5, 0, "Última semana incluida en el análisis")
        ws.write_number(5, 1, 44, F["in_ent"])
        ws.write_string(5, 3, "44 = periodo del examen. Pon 45 para incluir la semana 45.")
    ws.write_string(7, 0, "Tramos de antigüedad", F["sub"])
    ws.write_row(8, 0, ["Desde (días vencidos)", "Hasta (días vencidos)", "Tramo"], F["cab"])
    filas = [(-99999, 0, "Sin vencer"), (1, 30, "De 1 a 30 días"), (31, 60, "De 31 a 60 días"), (61, None, "Más de 60 días")]
    for i, (a, b, t) in enumerate(filas):
        ws.write_number(9 + i, 0, a, F["in_ent"])
        if b is None:
            ws.write_blank(9 + i, 1, None, F["in_ent"])
        else:
            ws.write_number(9 + i, 1, b, F["in_ent"])
        ws.write_string(9 + i, 2, t, F["in_txt"])
    ws.write_string(9, 3, "−99999 representa «cualquier valor de 0 o menos»")
    ws.write_string(14, 0, "Zonas válidas", F["sub"])
    for i, z in enumerate(ZONAS):
        ws.write_string(15 + i, 0, z, F["in_txt"])
    ws.write_string(14, 1, "Tipos de cliente", F["sub"])
    for i, t in enumerate(TIPOS):
        ws.write_string(15 + i, 1, t, F["in_txt"])
    ws.write_string(14, 2, "Familias", F["sub"])
    for i, f in enumerate(FAMILIAS):
        ws.write_string(15 + i, 2, f, F["in_txt"])
    if solucion:
        ws.write_string(14, 3, "Descatalogados conocidos (sin tarifa)", F["sub"])
        for i, c in enumerate(DESCATALOGADOS):
            ws.write_string(15 + i, 3, c, F["in_txt"])
    ws.write_string(22, 0, "Las celdas amarillas son entradas: se pueden cambiar.")


# --- 5a. Libro de la alumna -------------------------------------------------
wb = xlsxwriter.Workbook(F_DATOS)
F = formatos(wb)
instrucciones(wb.add_worksheet("Instrucciones"), F)
escribir_pedidos_sucios(wb.add_worksheet("Pedidos"), F)
escribir_maestros(wb, F, wb.add_worksheet("Clientes"), wb.add_worksheet("Tarifa"), wb.add_worksheet("Cobros"))
parametros(wb.add_worksheet("Parámetros"), F)
wb.set_properties({"title": "Prueba técnica · Tostadero Albada (examen final de Hoja a hoja)", "author": "Hoja a hoja"})
wb.close()

# --- 5b. CSV de la semana 45 -------------------------------------------------
with open(F_CSV, "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Fecha", "NumPedido", "CodCliente", "CodProducto", "Cantidad", "PrecioUnitario", "CodComercial"])
    for l in S45:
        w.writerow([l["fecha"].strftime("%d/%m/%Y"), l["pedido"], l["cli"], l["cod"], l["cant"],
                    f"{l['precio'] / 100:.2f}".replace(".", ","), l["com"]])

# --- 5c. Libro resuelto --------------------------------------------------------
wb = xlsxwriter.Workbook(F_SOL)
F = formatos(wb)
ws_lea = wb.add_worksheet("Léame")
ws_par = wb.add_worksheet("Parámetros")
ws_ped = wb.add_worksheet("Pedidos")
ws_s45 = wb.add_worksheet("Semana45")
ws_cli = wb.add_worksheet("Clientes")
ws_tar = wb.add_worksheet("Tarifa")
ws_cob = wb.add_worksheet("Cobros")
ws_dat = wb.add_worksheet("Datos")
ws_res = wb.add_worksheet("Resumen")
ws_car = wb.add_worksheet("Cartera")
ws_sim = wb.add_worksheet("Simulacion")
ws_ctl = wb.add_worksheet("Controles")
ws_cal = wb.add_worksheet("Calidad")
ws_com = wb.add_worksheet("Cómo se hizo")

parametros(ws_par, F, solucion=True)
for nombre, ref in [("FechaCorte", "$B$2"), ("MargenObjetivo", "$B$3"), ("ProductoSimulado", "$B$4"), ("ZonaObjetivo", "$B$5"),
                    ("SemanaHasta", "$B$6"), ("TablaTramos", "$A$10:$C$13"), ("ListaZonas", "$A$16:$A$19"),
                    ("Descatalogados", "$D$16:$D$18")]:
    wb.define_name(nombre, f"='Parámetros'!{ref}")
escribir_pedidos_sucios(ws_ped, F)
ws_ped.write_string(0, 8, "Hoja original: NO se toca (los datos limpios están en Datos).", F["mal"])
ws_s45.write_row(0, 0, ["Fecha", "NumPedido", "CodCliente", "CodProducto", "Cantidad", "PrecioUnitario", "CodComercial"], F["cab"])
for r, l in enumerate(S45, start=1):
    ws_s45.write_datetime(r, 0, datetime.combine(l["fecha"], datetime.min.time()), F["fecha"])
    ws_s45.write_string(r, 1, l["pedido"]); ws_s45.write_string(r, 2, l["cli"]); ws_s45.write_string(r, 3, l["cod"])
    ws_s45.write_number(r, 4, l["cant"]); ws_s45.write_number(r, 5, l["precio"] / 100, F["eur2"]); ws_s45.write_string(r, 6, l["com"])
ws_s45.set_column(0, 6, 13)
ws_s45.write_string(0, 8, "Importado de examen-final-semana45.csv (UTF-8, punto y coma, coma decimal).", F["neg"])
escribir_maestros(wb, F, ws_cli, ws_tar, ws_cob)

# Clientes: zona limpia y cálculos por cliente
ws_cli.write_row(0, 6, ["ZonaLimpia", "BaseVentas", "Margen"], F["cab"])
for r in range(1, len(CLI) + 1):
    i = r + 1
    ws_cli.write_formula(r, 6, f'=IFERROR(INDEX(ListaZonas,MATCH(TRIM(D{i}),ListaZonas,0)),"REVISAR")')
    ws_cli.write_formula(r, 7, f"=SUMIFS(Datos!$N:$N,Datos!$C:$C,A{i},Datos!$T:$T,1)", F["eur"])
    ws_cli.write_formula(r, 8, f"=SUMIFS(Datos!$R:$R,Datos!$C:$C,A{i},Datos!$T:$T,1)", F["eur"])
ws_cli.set_column(6, 6, 20); ws_cli.set_column(7, 8, 13)

# Cobros: saldo, días vencidos y tramo
ws_cob.write_row(0, 6, ["Saldo", "DíasVencidos", "Tramo"], F["cab"])
for r in range(1, len(COB) + 1):
    i = r + 1
    ws_cob.write_formula(r, 6, f"=ROUND(E{i}-F{i},2)", F["eur"])
    ws_cob.write_formula(r, 7, f"=FechaCorte-D{i}", F["ent"])
    ws_cob.write_formula(r, 8, f'=IF(G{i}<0,"Saldo a favor",IF(G{i}=0,"Cobrada",VLOOKUP(H{i},TablaTramos,3,TRUE)))')
ws_cob.set_column(6, 7, 13); ws_cob.set_column(8, 8, 16)

# Datos: Tabla con las líneas limpias (semanas 36-44 + semana 45) y una fórmula por columna
CAB_D = ["Fecha", "NumPedido", "CodCliente", "CodProducto", "Cantidad", "PrecioUnitario", "CodComercial", "Origen",
         "Semana", "Familia", "TipoIVA", "Zona", "TipoCliente", "Base", "IVA", "Total", "CosteUnit", "Margen", "SinTarifa",
         "Incluida", "RepClave"]
filas_d = [(l, "Pedidos S36-S44") for l in LEG] + [(l, "semana45.csv") for l in S45]
nD = len(filas_d)
ws_dat.add_table(0, 0, nD, len(CAB_D) - 1, {"name": "tblDatos", "style": "Table Style Light 15",
                                            "columns": [{"header": h} for h in CAB_D]})
for r, (l, origen) in enumerate(filas_d, start=1):
    i = r + 1
    ws_dat.write_datetime(r, 0, datetime.combine(l["fecha"], datetime.min.time()), F["fecha"])
    ws_dat.write_string(r, 1, l["pedido"]); ws_dat.write_string(r, 2, l["cli"]); ws_dat.write_string(r, 3, l["cod"])
    ws_dat.write_number(r, 4, l["cant"]); ws_dat.write_number(r, 5, l["precio"] / 100, F["eur2"])
    ws_dat.write_string(r, 6, l["com"]); ws_dat.write_string(r, 7, origen)
    ws_dat.write_formula(r, 8, f"=WEEKNUM(A{i},21)")
    ws_dat.write_formula(r, 9, f'=IFERROR(INDEX(Tarifa!$C:$C,MATCH(D{i},Tarifa!$A:$A,0)),"SIN TARIFA")')
    ws_dat.write_formula(r, 10, f'=IF(J{i}="SIN TARIFA","",INDEX(Tarifa!$D:$D,MATCH(D{i},Tarifa!$A:$A,0)))', F["pct"])
    ws_dat.write_formula(r, 11, f'=IFERROR(INDEX(Clientes!$G:$G,MATCH(C{i},Clientes!$A:$A,0)),"SIN CLIENTE")')
    ws_dat.write_formula(r, 12, f'=IFERROR(INDEX(Clientes!$C:$C,MATCH(C{i},Clientes!$A:$A,0)),"SIN CLIENTE")')
    ws_dat.write_formula(r, 13, f"=ROUND(E{i}*F{i},2)", F["eur"])
    ws_dat.write_formula(r, 14, f'=IF(K{i}="","",ROUND(N{i}*K{i},2))', F["eur"])
    ws_dat.write_formula(r, 15, f'=IF(O{i}="","",N{i}+O{i})', F["eur"])
    ws_dat.write_formula(r, 16, f'=IF(J{i}="SIN TARIFA","",INDEX(Tarifa!$E:$E,MATCH(D{i},Tarifa!$A:$A,0)))', F["eur"])
    ws_dat.write_formula(r, 17, f'=IF(Q{i}="","",N{i}-ROUND(E{i}*Q{i},2))', F["eur"])
    ws_dat.write_formula(r, 18, f'=IF(J{i}="SIN TARIFA",1,0)')
    ws_dat.write_formula(r, 19, f"=IF(I{i}<=SemanaHasta,1,0)")
    ws_dat.write_formula(r, 20, f"=COUNTIFS($B$2:$B$5000,B{i},$D$2:$D$5000,D{i})")
ws_dat.set_column(0, 0, 11); ws_dat.set_column(1, 3, 13); ws_dat.set_column(4, 8, 10); ws_dat.set_column(9, 9, 21)
ws_dat.set_column(10, 10, 8); ws_dat.set_column(11, 11, 20); ws_dat.set_column(12, 12, 12); ws_dat.set_column(13, 17, 12)
ws_dat.set_column(18, 20, 9); ws_dat.freeze_panes(1, 0)
ws_dat.conditional_format(1, 18, nD, 18, {"type": "cell", "criteria": "==", "value": 1, "format": F["mal"]})

# Resumen: base por zona y familia, pesos, top 5 y gráfico
ws_res.write_string(0, 0, "Ventas (base sin IVA) por zona y familia · semanas 36 a 44", F["tit"])
ws_res.write_formula(0, 6, '=IF(ControlMaestro,"Controles: OK","Controles: REVISAR")', F["neg"])
ws_res.conditional_format(0, 6, 0, 6, {"type": "text", "criteria": "containing", "value": "OK", "format": F["ok"]})
ws_res.conditional_format(0, 6, 0, 6, {"type": "text", "criteria": "containing", "value": "REVISAR", "format": F["mal"]})
COLS_R = FAMILIAS + ["SIN TARIFA"]
ws_res.write_row(2, 0, ["Zona"] + COLS_R + ["Total"], F["cab"])
for k, z in enumerate(ZONAS):
    r = 3 + k
    ws_res.write_string(r, 0, z)
    for c in range(1, len(COLS_R) + 1):
        col = xlsxwriter.utility.xl_col_to_name(c)
        ws_res.write_formula(r, c, f"=SUMIFS(Datos!$N:$N,Datos!$L:$L,$A{r + 1},Datos!$J:$J,{col}$3,Datos!$T:$T,1)", F["eur"])
    ws_res.write_formula(r, 8, f"=SUM(B{r + 1}:H{r + 1})", F["eurb"])
ws_res.write_string(7, 0, "Total", F["neg"])
for c in range(1, 9):
    col = xlsxwriter.utility.xl_col_to_name(c)
    ws_res.write_formula(7, c, f"=SUM({col}4:{col}7)", F["eurb"])
ws_res.write_string(9, 0, "Peso de cada familia dentro de su zona", F["sub"])
ws_res.write_row(10, 0, ["Zona"] + COLS_R + ["Total"], F["cab"])
for k in range(5):
    r = 11 + k
    ws_res.write_formula(r, 0, f"=A{4 + k}", F["neg"] if k == 4 else None)
    for c in range(1, 9):
        col = xlsxwriter.utility.xl_col_to_name(c)
        ws_res.write_formula(r, c, f"=IF($I{4 + k}=0,0,{col}{4 + k}/$I{4 + k})", F["pct1"])
ws_res.write_string(17, 0, "Los 5 clientes con más margen", F["sub"])
ws_res.write_row(18, 0, ["Puesto", "Cliente", "Nombre", "Zona", "Margen", "Base", "Margen %"], F["cab"])
for k in range(5):
    r = 19 + k
    i = r + 1
    ws_res.write_number(r, 0, k + 1)
    ws_res.write_formula(r, 4, f"=LARGE(Clientes!$I:$I,A{i})", F["eur"])
    ws_res.write_formula(r, 1, f"=INDEX(Clientes!$A:$A,MATCH(E{i},Clientes!$I:$I,0))")
    ws_res.write_formula(r, 2, f"=INDEX(Clientes!$B:$B,MATCH(B{i},Clientes!$A:$A,0))")
    ws_res.write_formula(r, 3, f"=INDEX(Clientes!$G:$G,MATCH(B{i},Clientes!$A:$A,0))")
    ws_res.write_formula(r, 5, f"=INDEX(Clientes!$H:$H,MATCH(B{i},Clientes!$A:$A,0))", F["eur"])
    ws_res.write_formula(r, 6, f"=E{i}/F{i}", F["pct1"])
ws_res.set_column(0, 0, 22); ws_res.set_column(1, 8, 14); ws_res.set_column(2, 2, 30)
graf = wb.add_chart({"type": "column", "subtype": "percent_stacked"})
COLORES = ["#5B3A1E", "#9C6B3C", "#4F81BD", "#C9A227", "#7F7F7F", "#70AD47", "#C00000"]
for c in range(1, 8):
    graf.add_series({"name": ["Resumen", 2, c], "categories": ["Resumen", 3, 0, 6, 0], "values": ["Resumen", 3, c, 6, c],
                     "fill": {"color": COLORES[c - 1]}, "gap": 60})
graf.set_title({"name": "Peso de cada familia en las ventas de cada zona"})
graf.set_y_axis({"num_format": "0%", "major_gridlines": {"visible": True, "line": {"color": "#D9D9D9"}}})
graf.set_legend({"position": "right"})
graf.set_size({"width": 760, "height": 380})
ws_res.insert_chart("A26", graf)
ws_res.write_string(45, 0, "Texto alternativo del gráfico: columnas 100 % apiladas por zona. Familia que más pesa: " +
                    "; ".join(f"{z}, {AUX['fam_top_zona'][z]}" for z in ZONAS) + ".")

# Cartera por cliente
ws_car.write_string(0, 0, "Cartera a la fecha de corte (saldos positivos por tramo; saldos a favor aparte)", F["tit"])
CAB_C = ["CodCliente", "Nombre", "Zona", "Límite", "Deuda pendiente"] + TRAMOS + ["Saldo a favor", "Supera límite", "Exceso"]
ws_car.write_string(1, 0, "Total", F["neg"])
for c in range(4, 12):
    if c == 10:
        continue
    col = xlsxwriter.utility.xl_col_to_name(c)
    ws_car.write_formula(1, c, f"=SUM({col}4:{col}1000)", F["eurb"])
ws_car.write_formula(1, 10, '=COUNTIF(K4:K1000,"SÍ")', F["neg"])
ws_car.write_row(2, 0, CAB_C, F["cab"])
for k in range(len(CLI)):
    r, i, ic = 3 + k, 4 + k, 2 + k
    ws_car.write_formula(r, 0, f"=Clientes!A{ic}")
    ws_car.write_formula(r, 1, f"=Clientes!B{ic}")
    ws_car.write_formula(r, 2, f"=Clientes!G{ic}")
    ws_car.write_formula(r, 3, f"=Clientes!F{ic}", F["eur"])
    ws_car.write_formula(r, 4, f'=SUMIFS(Cobros!$G:$G,Cobros!$B:$B,$A{i},Cobros!$G:$G,">0")', F["eur"])
    for c in range(5, 9):
        col = xlsxwriter.utility.xl_col_to_name(c)
        ws_car.write_formula(r, c, f"=SUMIFS(Cobros!$G:$G,Cobros!$B:$B,$A{i},Cobros!$I:$I,{col}$3)", F["eur"])
    ws_car.write_formula(r, 9, f'=-SUMIFS(Cobros!$G:$G,Cobros!$B:$B,$A{i},Cobros!$G:$G,"<0")', F["eur"])
    ws_car.write_formula(r, 10, f'=IF(E{i}>D{i},"SÍ","NO")')
    ws_car.write_formula(r, 11, f"=MAX(0,E{i}-D{i})", F["eur"])
ws_car.conditional_format(3, 10, 2 + len(CLI), 10, {"type": "cell", "criteria": "==", "value": '"SÍ"', "format": F["mal"]})
ws_car.set_column(0, 0, 11); ws_car.set_column(1, 1, 34); ws_car.set_column(2, 2, 20); ws_car.set_column(3, 11, 14)
ws_car.freeze_panes(3, 2)

# Simulación (B5)
ws_sim.write_string(0, 0, "¿A qué precio medio hay que vender el producto para llegar al margen objetivo en la zona?", F["tit"])
SIM = [
    ("Producto", "=ProductoSimulado", None), ("Zona", "=ZonaObjetivo", None),
    ("Familia del producto", "=INDEX(Tarifa!$C:$C,MATCH(B3,Tarifa!$A:$A,0))", None), ("", None, None),
    ("Base de la familia en la zona", "=SUMIFS(Datos!$N:$N,Datos!$J:$J,$B$5,Datos!$L:$L,$B$4,Datos!$T:$T,1)", "eur"),
    ("Margen de la familia en la zona", "=SUMIFS(Datos!$R:$R,Datos!$J:$J,$B$5,Datos!$L:$L,$B$4,Datos!$T:$T,1)", "eur"),
    ("Coste de la familia en la zona", "=B7-B8", "eur"),
    ("Margen % actual", "=B8/B7", "pct2"),
    ("Unidades del producto en la zona", "=SUMIFS(Datos!$E:$E,Datos!$D:$D,$B$3,Datos!$L:$L,$B$4,Datos!$T:$T,1)", "ent"),
    ("Base del producto en la zona", "=SUMIFS(Datos!$N:$N,Datos!$D:$D,$B$3,Datos!$L:$L,$B$4,Datos!$T:$T,1)", "eur"),
    ("Precio medio actual del producto", "=B12/B11", "eur"),
    ("Base del resto de la familia (no cambia)", "=B7-B12", "eur"),
    ("", None, None),
    ("Precio medio necesario (despejado)", "=(B9/(1-MargenObjetivo)-B14)/B11", "eurb"),
    ("Precio de prueba (Buscar objetivo cambia esta celda)", None, "in"),
    ("Margen % con el precio de prueba", "=(B14+B11*B17-B9)/(B14+B11*B17)", "pct2"),
    ("Subida sobre el precio medio actual", "=B17/B13-1", "pct1"),
]
for k, (et, fo, fm) in enumerate(SIM):
    r = 2 + k
    ws_sim.write_string(r, 0, et)
    if fm == "in":
        ws_sim.write_number(r, 1, CT["b5_precio"], F["in_eur"])
    elif fo:
        ws_sim.write_formula(r, 1, fo, F[fm] if fm else None)
ws_sim.write_string(21, 0, "Buscar objetivo: Datos > Previsión > Análisis de hipótesis > Buscar objetivo. Definir la celda: B18; Con el valor: 0,35; Cambiando la celda: B17.")
ws_sim.set_column(0, 0, 52); ws_sim.set_column(1, 1, 18)

# Controles
ws_ctl.write_string(0, 0, "Controles del libro", F["tit"])
ws_ctl.write_string(1, 0, "Control maestro", F["neg"])
ws_ctl.write_formula(1, 1, "=AND(G5:G14)", F["neg"])
wb.define_name("ControlMaestro", "=Controles!$B$2")
ws_ctl.conditional_format(1, 1, 1, 1, {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
ws_ctl.conditional_format(1, 1, 1, 1, {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
ws_ctl.write_row(3, 0, ["Nº", "Comprobación", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Cuadra"], F["cab"])
CHK = [
    ("Líneas incluidas = filas del origen − 1 fila Total − 12 duplicados (+ semana 45 si se incluye)",
     "=COUNTA(Pedidos!A:A)-1-1-12+IF(SemanaHasta>=45,COUNTA(Semana45!A:A)-1,0)", "=SUM(Datos!T:T)", 0),
    ("Ninguna clave pedido + producto repetida (máximo de repeticiones = 1)", "=1", "=MAX(Datos!U:U)", 0),
    ("Fechas que no son fecha en Datos", "=0", "=COUNTA(Datos!A:A)-1-COUNT(Datos!A:A)", 0),
    ("Líneas con un cliente que no está en Clientes", "=0", '=COUNTIF(Datos!L:L,"SIN CLIENTE")', 0),
    ("Zonas que no se han podido corregir en Clientes", "=0", '=COUNTIF(Clientes!G:G,"REVISAR")', 0),
    ("Σ Base del Resumen = Σ Base de Datos incluidas", "=SUMIFS(Datos!N:N,Datos!T:T,1)", "=Resumen!I8", 0.01),
    ("Σ IVA de los tres tipos = Σ IVA de Datos incluidas", "=SUMIFS(Datos!O:O,Datos!T:T,1)", "=SUM(D23:D25)", 0.01),
    ("Cartera: Σ tramos = Σ deuda pendiente", "=Cartera!E2", "=SUM(Cartera!F2:I2)", 0.01),
    ("Cartera: Σ Importe − Σ Cobrado = deuda − saldos a favor", "=SUM(Cobros!E:E)-SUM(Cobros!F:F)", "=Cartera!E2-Cartera!J2", 0.01),
    ("Simulación: margen con el precio de prueba = objetivo", "=MargenObjetivo", "=Simulacion!B18", 0.0001),
]
for k, (desc, esp, obt, tol) in enumerate(CHK):
    r, i = 4 + k, 5 + k
    ws_ctl.write_number(r, 0, k + 1); ws_ctl.write_string(r, 1, desc)
    ws_ctl.write_formula(r, 2, esp, F["eur2"]); ws_ctl.write_formula(r, 3, obt, F["eur2"])
    ws_ctl.write_formula(r, 4, f"=D{i}-C{i}", F["eur2"]); ws_ctl.write_number(r, 5, tol)
    ws_ctl.write_formula(r, 6, f"=ABS(E{i})<=F{i}")
ws_ctl.conditional_format(4, 6, 13, 6, {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
ws_ctl.conditional_format(4, 6, 13, 6, {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
ws_ctl.write_string(15, 0, "Totales de control del examen (con «Última semana incluida» = 44; B6 usa todas las líneas)", F["sub"])
ws_ctl.write_row(16, 0, ["Tarea", "Total de control", "Respuesta del examen", "Valor en este libro", "Diferencia", "Tolerancia", "Cuadra"], F["cab"])
EXT = [
    ("B1", "Líneas reales", "b1_lineas", "=SUM(Datos!T:T)", 0),
    ("B1", "Σ Cantidad", "b1_cantidad", "=SUMIFS(Datos!E:E,Datos!T:T,1)", 0),
    ("B1", "Líneas con fecha de octubre de 2026", "b1_octubre", '=COUNTIFS(Datos!A:A,">="&DATE(2026,10,1),Datos!A:A,"<"&DATE(2026,11,1),Datos!T:T,1)', 0),
    ("B1", "Clientes distintos con pedidos", "b1_clientes", '=COUNTIF(Clientes!H:H,">0")', 0),
    ("B2", "Σ Base (todas las líneas)", "b2_base", "=SUMIFS(Datos!N:N,Datos!T:T,1)", 0.01),
    ("B2", "Σ IVA al 4 %", "b2_iva4", "=SUMIFS(Datos!O:O,Datos!K:K,0.04,Datos!T:T,1)", 0.01),
    ("B2", "Σ IVA al 10 %", "b2_iva10", "=SUMIFS(Datos!O:O,Datos!K:K,0.1,Datos!T:T,1)", 0.01),
    ("B2", "Σ IVA al 21 %", "b2_iva21", "=SUMIFS(Datos!O:O,Datos!K:K,0.21,Datos!T:T,1)", 0.01),
    ("B2", "Σ Margen", "b2_margen", "=SUMIFS(Datos!R:R,Datos!T:T,1)", 0.01),
    ("B2", "Líneas sin tarifa", "b2_sin_tarifa", "=SUMIFS(Datos!S:S,Datos!T:T,1)", 0),
    ("B3", "Base de Burgos", "b3_base_burgos", '=INDEX(Resumen!I4:I7,MATCH("Burgos",Resumen!A4:A7,0))', 0.01),
    ("B3", "% de Café en Palencia (×100)", "b3_pct_cafe_palencia", '=ROUND(100*INDEX(Resumen!B12:B15,MATCH("Palencia",Resumen!A12:A15,0)),2)', 0.01),
    ("B3", "Margen del cliente con más margen", "b3_margen_top", "=Resumen!E20", 0.01),
    ("B4", "Deuda pendiente total", "b4_pendiente", "=Cartera!E2", 0.01),
    ("B4", "Vencido a más de 60 días", "b4_mas60", "=Cartera!I2", 0.01),
    ("B4", "Clientes por encima del límite", "b4_sobre_limite", "=Cartera!K2", 0),
    ("B5", "Margen % actual de Maquinaria en Burgos (×100)", "b5_margen_actual", "=ROUND(100*Simulacion!B10,2)", 0.01),
    ("B5", "Precio medio necesario de MAQ-ESP-2G", "b5_precio", "=ROUND(Simulacion!B16,2)", 0.01),
    ("B6", "Líneas tras añadir la semana 45", "b6_lineas", "=COUNTA(Datos!B:B)-1", 0),
    ("B6", "Líneas sin tarifa tras añadir la semana 45", "b6_sin_tarifa", "=SUM(Datos!S:S)", 0),
    ("B6", "Σ Base tras añadir la semana 45", "b6_base", "=SUM(Datos!N:N)", 0.01),
]
# Las filas 21-23 (IVA) las usa el control 7: se colocan en ese orden
for k, (tarea, desc, clave, fo, tol) in enumerate(EXT):
    r, i = 17 + k, 18 + k
    ws_ctl.write_string(r, 0, tarea); ws_ctl.write_string(r, 1, desc)
    ws_ctl.write_number(r, 2, CT[clave], F["eur2"]); ws_ctl.write_formula(r, 3, fo, F["eur2"])
    ws_ctl.write_formula(r, 4, f"=D{i}-C{i}", F["eur2"]); ws_ctl.write_number(r, 5, tol)
    ws_ctl.write_formula(r, 6, f"=ABS(E{i})<=F{i}+0.000001")
assert [e[2] for e in EXT][5:8] == ["b2_iva4", "b2_iva10", "b2_iva21"]  # filas 23-25: las suma el control 7
ws_ctl.conditional_format(17, 6, 17 + len(EXT), 6, {"type": "cell", "criteria": "==", "value": "TRUE", "format": F["ok"]})
ws_ctl.conditional_format(17, 6, 17 + len(EXT), 6, {"type": "cell", "criteria": "==", "value": "FALSE", "format": F["mal"]})
fa = 19 + len(EXT)
ws_ctl.write_string(fa, 0, "Avisos (informan; no entran en el control maestro)", F["sub"])
AVI = [
    ("Líneas sin tarifa incluidas en el análisis (8 conocidas: 3 productos descatalogados)", "=SUMIFS(Datos!S:S,Datos!T:T,1)"),
    ("Líneas con un producto sin tarifa que NO es un descatalogado conocido (producto nuevo)",
     "=SUMPRODUCT((Datos!$S$2:$S$5000=1)*ISNA(MATCH(Datos!$D$2:$D$5000,Descatalogados,0)))"),
    ("Clientes por encima de su límite", "=Cartera!K2"),
    ("Facturas cobradas de más (saldo a favor)", '=COUNTIF(Cobros!I:I,"Saldo a favor")'),
    ("Importe total de los saldos a favor", "=Cartera!J2"),
]
for k, (desc, fo) in enumerate(AVI):
    r = fa + 1 + k
    ws_ctl.write_string(r, 1, desc); ws_ctl.write_formula(r, 3, fo, F["eur2"])
ws_ctl.write_formula(fa + 2, 4, f'=IF(D{fa + 3}>0,"ATENCIÓN: hay productos nuevos sin tarifa. Pide su alta a Compras.","OK")', F["neg"])
ws_ctl.set_column(0, 0, 7); ws_ctl.set_column(1, 1, 70); ws_ctl.set_column(2, 5, 15); ws_ctl.set_column(6, 6, 9)

# Calidad de datos
ws_cal.write_string(0, 0, "Calidad de datos: problemas encontrados y decisión tomada", F["tit"])
ws_cal.write_row(2, 0, ["Origen", "Problema", "Código", "Filas", "Decisión", "Impacto si no se trata"], F["cab"])
CAL = [
    ("Pedidos", f"Filas repetidas idénticas: la exportación repite el final del {AUX['dia_dup']}", "Q01", N_DUP, "Se quitan (Quitar duplicados con todas las columnas)", f"+{esn(AUX['dup_cant'])} unidades y +{es(AUX['dup_base'])} € de base"),
    ("Pedidos", "Fila «Total» al final de los datos", "Q10", 1, "Se quita", "La cantidad se contaría dos veces"),
    ("Pedidos", "Fechas en formato 2026-09-14 guardadas como texto", "Q07", N_ISO, "Se convierten en fecha", f"No entran en filtros ni resúmenes por fecha ({AUX['base_iso_oct']} son de octubre)"),
    ("Pedidos", "Precios con punto decimal guardados como texto", "Q05", N_PRECIO, "Se convierten con separador decimal «.»", "Base 0 o error en esas líneas"),
    ("Pedidos", "Código de cliente con un espacio al final", "Q04", N_ESP, "Se quitan los espacios", "La búsqueda no encuentra el cliente: líneas sin zona"),
    ("Pedidos", "Productos descatalogados que no están en la tarifa (CAF-ETI-1K, INF-JEN-100, MEN-COP-12)", "Q16", N_SIN, "Se marcan; cuentan en la base, no en IVA ni margen", f"{es(AUX['base_sin'])} € de base sin coste conocido"),
    ("Clientes", "Zona mal escrita (burgos, BURGOS , palencia…)", "Q08", 6, "Se corrige a la lista de zonas válidas", "Zonas partidas en el resumen"),
    ("Cobros", "Facturas cobradas de más", "Q17", 3, "Saldo a favor, aparte; no reduce la deuda", f"{es(AUX['favor'])} € a devolver o compensar"),
    ("semana45.csv", f"Producto nuevo que no está en la tarifa ({NUEVO[0]})", "Q16", N_NUEVO, "Aviso en Controles; pedir el alta", "Líneas sin IVA ni margen"),
]
for k, fila in enumerate(CAL):
    ws_cal.write_row(3 + k, 0, fila, F["txt"])
ws_cal.set_column(0, 0, 12); ws_cal.set_column(1, 1, 60); ws_cal.set_column(2, 3, 8); ws_cal.set_column(4, 4, 45); ws_cal.set_column(5, 5, 45)

hoja_texto(ws_lea, F, [
    ("tit", "Léame · Análisis de ventas S36-S44 y cartera a 31/10/2026 (Tostadero Albada)"),
    ("", "Objetivo: limpiar los pedidos, calcular base, IVA y margen, resumir por zona y familia, analizar la cartera a la fecha de corte y simular el precio de MAQ-ESP-2G para llegar al margen objetivo en Burgos."),
    ("", "Pedido por: Rodrigo Pardo (jefe de administración). Fecha de corte: 31/10/2026 (Parámetros)."),
    ("", "Fuentes: hoja Pedidos (exportación del programa, intacta), Clientes, Tarifa, Cobros y examen-final-semana45.csv."),
    ("sub", "Estructura"),
    ("", "Parámetros (entradas amarillas, con nombre) → Pedidos y Semana45 (origen, sin tocar) → Datos (Tabla limpia, una fórmula por columna) → Resumen, Cartera y Simulacion (salidas) → Controles (comprobaciones y control maestro) → Calidad (problemas y decisiones)."),
    ("sub", "Supuestos"),
    ("", "Ventas sin IVA y sin portes. Margen sobre el coste de la tarifa vigente (no el coste real de compra). Las líneas sin tarifa cuentan en ventas, no en IVA ni margen. Los saldos a favor no reducen la deuda hasta que Administración decida si se devuelven o se compensan."),
    ("sub", "Cómo actualizar con una semana nueva"),
    ("", "1. Guarda el CSV nuevo en la carpeta de pedidos (en este libro, la semana 45 ya está en la hoja Semana45 y en Datos)."),
    ("", "2. Datos > Obtener datos > De texto/CSV (o actualiza la consulta que anexa los CSV), con Origen del archivo 65001: Unicode (UTF-8) y delimitador punto y coma."),
    ("", "3. Añade las líneas a la Tabla tblDatos (o Actualizar todo, Ctrl+Alt+F5, si vienen de Power Query). Las fórmulas de la Tabla se extienden solas."),
    ("", "4. En Parámetros, cambia «Última semana incluida» (por ejemplo, a 45)."),
    ("", "5. Revisa Controles: el control maestro debe decir VERDADERO y lee los avisos (productos nuevos sin tarifa, clientes sobre el límite)."),
    ("sub", "Colores"),
    ("", "Amarillo = entrada que se puede cambiar. Verde = control que cuadra. Rojo = revisar."),
    ("sub", "Registro de cambios"),
    ("", "16/11/2026 · v01 · Primera versión: limpieza, cálculos, resumen, cartera, simulación y controles."),
    ("", "16/11/2026 · v02 · Añadida la semana 45 (138 líneas). Aviso: producto nuevo CAF-COL-1K sin tarifa en 3 líneas."),
])

COMO = [
    ("tit", "Cómo se hizo (fórmulas en Excel en español)"),
    ("sub", "B1 · Limpieza"),
    ("", "1. Clic derecho en la pestaña Pedidos > Mover o copiar > Crear una copia. La original no se toca (Power Query también vale: lee la hoja sin modificarla)."),
    ("", f"2. En la copia: filtra la fila «Total» y elimínala. Datos > Herramientas de datos > Quitar duplicados con todas las columnas: quita {N_DUP} filas (el final del {AUX['dia_dup']} sale dos veces)."),
    ("", "3. Fecha: =SI(ESNUMERO(A2);A2;FECHANUMERO(A2)). Precio: =SI(ESNUMERO(F2);F2;VALOR.NUMERO(F2;\".\";\",\")). Cliente: =ESPACIOS(C2). Pegado especial > Valores sobre las columnas originales."),
    ("", f"4. Comprueba: {esn(N_LEGIT)} líneas; CONTAR de la columna Fecha = CONTARA (todas son fechas); ninguna clave pedido + producto repetida."),
    ("sub", "B2 · Cálculos y cruces"),
    ("", "Convierte los datos en Tabla (Ctrl+T). Familia: =BUSCARX([@CodProducto];Tarifa!A:A;Tarifa!C:C;\"SIN TARIFA\"). Zona limpia en Clientes: =BUSCARX(ESPACIOS(D2);ListaZonas;ListaZonas;\"REVISAR\") (BUSCARX no distingue mayúsculas y devuelve la grafía válida)."),
    ("", "Base: =REDONDEAR([@Cantidad]*[@PrecioUnitario];2). IVA: =SI([@TipoIVA]=\"\";\"\";REDONDEAR([@Base]*[@TipoIVA];2)). Margen: =SI([@CosteUnit]=\"\";\"\";[@Base]-[@Cantidad]*[@CosteUnit]). SinTarifa: =SI([@Familia]=\"SIN TARIFA\";1;0)."),
    ("", "En versiones sin BUSCARX: =SI.ERROR(INDICE(Tarifa!C:C;COINCIDIR(D2;Tarifa!A:A;0));\"SIN TARIFA\") (es lo que usa este libro, para que funcione en cualquier versión)."),
    ("sub", "B3 · Análisis"),
    ("", "Tabla dinámica desde tblDatos: Zona en filas, Familia en columnas, Suma de Base en valores; un segundo campo Base con Mostrar valores como porcentaje del total de la fila; segmentación de datos por TipoCliente; gráfico dinámico de columnas 100 % apiladas. Aquí se ha hecho con SUMAR.SI.CONJUNTO para que se pueda comprobar."),
    ("", "Top 5: margen por cliente con SUMAR.SI.CONJUNTO y K.ESIMO.MAYOR, o una tabla dinámica por cliente ordenada de mayor a menor margen."),
    ("sub", "B4 · Cartera"),
    ("", "Saldo: =E2-F2. Días: =FechaCorte-D2. Tramo: =SI(G2<0;\"Saldo a favor\";SI(G2=0;\"Cobrada\";BUSCARV(H2;TablaTramos;3;VERDADERO))) o BUSCARX(H2;Parámetros!A10:A13;Parámetros!C10:C13;;-1)."),
    ("", "Por cliente: SUMAR.SI.CONJUNTO del saldo por cliente y tramo, solo saldos positivos. Supera el límite: deuda pendiente > Límite."),
    ("sub", "B5 · Qué pasaría si"),
    ("", "Hoja Simulacion. Datos > Previsión > Análisis de hipótesis > Buscar objetivo: Definir la celda B18 (margen %), Con el valor 0,35, Cambiando la celda B17 (precio de prueba). Comprobación algebraica en B16: precio = (Coste / (1 − 35 %) − Base del resto) / Unidades."),
    ("sub", "B6 · Robustez"),
    ("", "Datos en Tabla y resúmenes que leen columnas enteras o la Tabla: al añadir filas, todo se recalcula. Controles con esperado, obtenido, diferencia y tolerancia; control maestro =Y(G5:G14) repetido en el Resumen. Aviso de productos sin tarifa que no son descatalogados conocidos."),
]
hoja_texto(ws_com, F, COMO, ancho=150)
wb.set_properties({"title": "Prueba técnica · Tostadero Albada · solución", "author": "Hoja a hoja"})
wb.close()

# --- 5d. Metadatos -----------------------------------------------------------
META = {
    "examen-final": {"titulo": "Examen final · Prueba técnica de Tostadero Albada: libro de trabajo",
                     "descripcion": "Instrucciones, pedidos de las semanas 36 a 44 tal como salen del programa (1.240 filas), clientes, tarifa, cobros y parámetros para la prueba técnica de 120 minutos.",
                     "nivel": "n6"},
    "examen-final-semana45": {"titulo": "Examen final · Pedidos de la semana 45 (CSV)",
                              "descripcion": "138 líneas de pedido del 02/11 al 06/11/2026 en CSV (UTF-8, punto y coma, coma decimal) para la tarea B6.",
                              "nivel": "n6"},
    "examen-final-solucion": {"titulo": "Examen final · Prueba técnica de Tostadero Albada: solución",
                              "descripcion": "Libro resuelto con datos limpios, fórmulas, resumen por zona y familia, cartera por tramos, simulación de precio, controles con control maestro y hoja de calidad de datos.",
                              "nivel": "n6"},
}
for k, m in META.items():
    json.dump(m, open(os.path.join(LIBROS, k + ".meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# ---------------------------------------------------------------------------
# 6. Comprobación con LibreOffice: las fórmulas del libro resuelto dan los totales de pandas
# ---------------------------------------------------------------------------
def recalcular(ruta):
    tmp = tempfile.mkdtemp()
    perfil = os.path.join(tmp, "perfil")
    os.makedirs(os.path.join(perfil, "user"))
    with open(os.path.join(perfil, "user", "registrymodifications.xcu"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<oor:items xmlns:oor="http://openoffice.org/2001/registry" '
                 'xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
                 '<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse">'
                 '<value>0</value></prop></item>\n</oor:items>\n')
    out = os.path.join(tmp, "out")
    subprocess.run(["soffice", f"-env:UserInstallation=file://{perfil}", "--headless", "--calc", "--convert-to", "xlsx",
                    "--outdir", out, ruta], check=True, capture_output=True, timeout=600)
    wbv = openpyxl.load_workbook(os.path.join(out, os.path.basename(ruta)), data_only=True)
    shutil.rmtree(tmp, ignore_errors=True)
    return wbv


openpyxl.load_workbook(F_DATOS)   # carga sin errores
wbv = recalcular(F_SOL)
wc = wbv["Controles"]
fallos = []
for k, (tarea, desc, clave, fo, tol) in enumerate(EXT):
    val = wc.cell(row=18 + k, column=4).value
    if not isinstance(val, (int, float)) or abs(val - CT[clave]) > tol + 1e-6:
        fallos.append((tarea, desc, CT[clave], val))
for k in range(len(CHK)):
    if wc.cell(row=5 + k, column=7).value is not True:
        fallos.append(("control", CHK[k][0], wc.cell(row=5 + k, column=3).value, wc.cell(row=5 + k, column=4).value))
if wc["B2"].value is not True:
    fallos.append(("maestro", "Control maestro", True, wc["B2"].value))
aviso_nuevo = wc.cell(row=fa + 3, column=4).value
if aviso_nuevo != N_NUEVO:
    fallos.append(("aviso", "producto nuevo", N_NUEVO, aviso_nuevo))
top_lo = [wbv["Resumen"].cell(row=20 + k, column=2).value for k in range(5)]
if top_lo != [t[0] for t in TOP5]:
    fallos.append(("top5", "orden", [t[0] for t in TOP5], top_lo))
print("LibreOffice:", "TODO CUADRA" if not fallos else fallos)
assert not fallos

# ---------------------------------------------------------------------------
# 7. contenido/examen.json
# ---------------------------------------------------------------------------
def op(texto, porque, ok=False):
    return {"texto": texto, "correcta": ok, "porque": porque}


PARTE_A = [
    ("n2m5l2", "Rodrigo te pide el precio de CAF-ESP-1K. Lo ves en la Tarifa con tus propios ojos, pero tu búsqueda devuelve «no encontrado». ¿Qué compruebas primero?", [
        op("Si uno de los dos códigos tiene espacios de más, o si uno es número y el otro está guardado como texto.", "Es la causa más frecuente. Para Excel, «CAF-ESP-1K » (con espacio) y «CAF-ESP-1K» son textos distintos, igual que 1001 y «1001». Compáralos con `=A2=B2` o mira su LARGO, y limpia el que esté mal.", True),
        op("Cambiar la búsqueda a coincidencia aproximada para que encuentre algo.", "Encontraría «algo», pero no lo que buscas: la coincidencia aproximada devuelve el valor más cercano y te daría un precio falso sin avisar. Es peor que el error."),
        op("Ordenar la tarifa por código de producto.", "Con búsqueda exacta el orden no importa. Ordenar no arregla un código que no es igual al que buscas."),
        op("Cerrar Excel y volver a abrirlo, o repararlo.", "No es un fallo del programa: Excel compara carácter a carácter y te está diciendo que los dos códigos no son iguales."),
    ], "«No encontrado» casi nunca es un fallo de la fórmula: es una diferencia en los datos. Primero, espacios y tipo (texto o número); después, erratas como una O en lugar de un 0."),
    ("n3m4l3", "Tienes una tabla dinámica de ventas. Pegas debajo de los datos los pedidos de ayer y la tabla dinámica no cambia. ¿Qué ha pasado y cuál es la buena práctica?", [
        op("Su origen es un rango fijo que no incluye las filas nuevas, o falta actualizarla. Lo bueno es que el origen sea una Tabla ([[Ctrl]]+[[T]]) y actualizar al añadir datos.", "Una tabla dinámica no se recalcula sola como una fórmula: hay que actualizarla (Datos > Actualizar todo). Y si su origen es un rango como A1:G1240, la fila 1241 no existe para ella. Con una Tabla, el origen crece solo.", True),
        op("Las tablas dinámicas tienen un máximo de filas y se ha llenado.", "El límite es el de la hoja, más de un millón de filas. No tiene nada que ver con unos cientos de pedidos."),
        op("El cálculo está en manual: hay que ponerlo en automático en la pestaña Fórmulas.", "El modo de cálculo afecta a las fórmulas, no a las tablas dinámicas: aunque esté en automático, la tabla dinámica no se entera hasta que la actualizas."),
        op("Hay que borrar la tabla dinámica y crearla otra vez cada vez que lleguen datos.", "Funciona, pero es rehacer el trabajo cada día y perder formatos y filtros. Con una Tabla como origen basta con actualizar."),
    ], "Tabla como origen + Actualizar: así un informe aguanta los datos de mañana sin rehacerlo."),
    ("n3m2l1", "Vas a asignar a cada cliente su tramo de descuento con la búsqueda vertical clásica en modo de coincidencia aproximada (último argumento VERDADERO). ¿Cómo tiene que estar la tabla de tramos?", [
        op("Ordenada de menor a mayor por el límite inferior de cada tramo (0, 1.000, 5.000…).", "La coincidencia aproximada busca el último límite que no supera el valor, y para eso da por hecho que los límites van de menor a mayor. Si no lo están, devuelve un tramo equivocado sin avisar.", True),
        op("Ordenada de mayor a menor, para que encuentre antes los tramos altos.", "Al revés no funciona: con el orden descendente, la búsqueda aproximada devuelve tramos equivocados o #N/D."),
        op("Con el límite superior de cada tramo en la primera columna.", "La búsqueda aproximada devuelve la fila del mayor límite que no supera el valor: necesita el límite inferior. Con el superior, cada cliente cae en el tramo de abajo."),
        op("Da igual el orden, porque los límites son números.", "Es el error que más cuesta: sale un resultado, pero no es el bueno. (La búsqueda moderna con «coincidencia exacta o siguiente menor» no necesita orden, pero ordenar sigue siendo buena práctica.)"),
    ], "Tabla de tramos: límite inferior en la primera columna y de menor a mayor. Compruébalo con un caso en el límite (por ejemplo, justo 1.000)."),
    ("n3m1l3", "Rodrigo pregunta por el margen % de la familia Café. Tienes 480 líneas de café, cada una con su base y su margen. ¿Cómo lo calculas?", [
        op("Suma de los márgenes de Café dividida entre la suma de las bases de Café.", "Así cada línea pesa lo que vende: una de 200 € cuenta diez veces más que una de 20 €. Es la cifra que cuadra con la cuenta de resultados.", True),
        op("Promedio de los márgenes % de cada línea.", "Da el mismo peso a una línea de 2 kg que a una de 200 kg. Si las líneas pequeñas tienen más margen, el promedio sale inflado."),
        op("Suma de los márgenes de Café dividida entre la suma de los costes de Café.", "Eso es el recargo sobre el coste, no el margen sobre ventas. Con un 40 % de margen, el recargo es del 66,7 %."),
        op("Suma de los márgenes de Café dividida entre las ventas totales de la empresa.", "Eso dice cuánto aporta el café al total (su contribución), no qué margen tiene el café."),
    ], "Un porcentaje de grupo se calcula con sumas: Σ margen / Σ base. Nunca promedies porcentajes de líneas de distinto tamaño."),
    ("n3m3l4", "Un proveedor de Estados Unidos manda un CSV con fechas como «03/04/2026». ¿Qué haces?", [
        op("Es ambiguo: lo importo indicando la configuración regional de origen (Estados Unidos) y lo compruebo con una fecha cuyo día sea mayor que 12.", "En Estados Unidos se escribe mes/día: «03/04/2026» es el 4 de marzo. Un día mayor que 12 (por ejemplo «03/25/2026») delata el orden: si Excel lo deja como texto o lo lee mal, la importación está mal.", True),
        op("Es el 3 de abril: Excel en español lo lee bien.", "Excel lo lee con tu configuración (día/mes) y lo convierte en el 3 de abril, pero el proveedor quería decir el 4 de marzo. Y las fechas con día mayor que 12 se quedan como texto."),
        op("Lo abro con doble clic y después cambio el formato de las celdas a dd/mm/aaaa.", "El formato solo cambia cómo se ve la fecha, no qué fecha es. Si ya se ha leído como 3 de abril, sigue siendo el 3 de abril."),
        op("Pido al proveedor que lo mande en PDF.", "Un PDF no se analiza en Excel sin volver a teclearlo o convertirlo. El problema se resuelve al importar."),
    ], "Fechas de otro país: se importan con la configuración regional del origen y se comprueban con un día mayor que 12."),
    ("n4m1l3", "Cada mes te llegan 3 CSV (uno por zona) con las mismas columnas y tienes que unirlos para el informe. ¿Qué montas?", [
        op("Una consulta de Power Query que lee la carpeta donde se guardan; cada mes copio allí los archivos nuevos y pulso Actualizar.", "Se monta una vez: la consulta combina todos los archivos de la carpeta y les aplica los mismos pasos de limpieza. El mes siguiente es dejar los archivos y actualizar.", True),
        op("Abrir los tres y copiarlos uno debajo de otro cada mes.", "Funciona el primer mes, pero cada copia a mano es una ocasión de pegar dos veces el mismo archivo o dejarte uno. No es mantenible."),
        op("Grabar una macro que copie y pegue.", "Puede servir, pero una macro grabada se rompe si cambia el nombre de un archivo o el número de filas, y no todas las empresas permiten macros. Power Query hace lo mismo sin código."),
        op("Vincular celdas de mi libro a cada CSV con fórmulas.", "Los vínculos a otros archivos se rompen al moverlos o renombrarlos y no traen filas nuevas: si un mes hay más líneas, no las ves."),
    ], "Tarea que se repite con archivos de la misma estructura = Power Query desde carpeta + Actualizar."),
    ("n5m4l1", "En la variante «modo 2026», Copilot te propone una fórmula para el margen por zona. ¿Qué haces antes de usarla?", [
        op("La pruebo con un caso que conozco, reviso que sus rangos cubren todas las filas y no pego datos personales de clientes en asistentes que la empresa no haya autorizado.", "La IA acierta a menudo, pero no siempre, y no sabe qué es «correcto» en tu empresa (con o sin IVA, qué líneas cuentan). Un caso conocido y la revisión de rangos atrapan la mayoría de errores. Y los datos personales solo van a herramientas aprobadas.", True),
        op("La uso tal cual: Copilot ha leído el libro, así que la fórmula es correcta.", "Haber leído el libro no garantiza que haya entendido tu criterio. El resultado lo firmas tú."),
        op("Le pido que me explique la fórmula y, si la explicación suena bien, la doy por buena.", "Una explicación convincente no es una comprobación: puede describir muy bien una fórmula con un rango que se queda corto."),
        op("No la uso nunca: en una empresa seria no se usa IA.", "Muchas empresas la usan. Lo profesional es usarla con método: comprobar y respetar las normas de la empresa sobre datos."),
    ], "Con IA o sin ella, una fórmula no está terminada hasta que la compruebas con un caso conocido."),
    ("n3m1l2", "En el resumen quieres sumar solo las ventas con fecha desde el 1 de octubre de 2026, incluido. ¿Qué escribes como criterio para la columna de fechas?", [
        op('`">="&FECHA(2026;10;1)`', "El operador va entre comillas y la fecha se calcula fuera y se une con &. Mejor aún si la fecha está en una celda de parámetros: `\">=\"&H1`.", True),
        op('`">=FECHA(2026;10;1)"`', "Todo va entre comillas, así que Excel no calcula FECHA: compara con el texto «FECHA(2026;10;1)» y no suma nada."),
        op("`>=FECHA(2026;10;1)`", "Sin comillas, el operador suelto no es un argumento válido: Excel no acepta la fórmula."),
        op('`"="&FECHA(2026;10;1)`', "Solo suma las ventas de ese día exacto, no las de después."),
    ], "Criterio con operador y fecha: el operador entre comillas, & y la fecha (mejor en una celda)."),
    ("n1m2l3", "El total de una factura de 40 líneas sale 0,01 € distinto de la suma de los totales de cada línea. ¿Qué pasa y qué haces?", [
        op("El IVA se ha redondeado en sitios distintos (línea a línea en un cálculo y sobre la suma en el otro). Se redondea en el mismo nivel en que se factura y se documenta la regla.", "Redondear cada línea y sumar no da lo mismo que sumar y redondear. Ninguno es «el malo»: hay que elegir uno, el mismo que usa la factura, y escribirlo en el Léame para que todo cuadre.", True),
        op("Es un error de decimales de Excel; se puede ignorar.", "Los errores internos de Excel con decimales son de millonésimas, no de un céntimo. Un céntimo es una diferencia de criterio, y en una factura importa."),
        op("Se quitan los decimales con el botón Disminuir decimales.", "Eso solo cambia lo que se ve; el valor guardado es el mismo y la diferencia sigue en las sumas."),
        op("Se cambia a mano el IVA de la última línea para que cuadre.", "Un valor tecleado para cuadrar esconde el problema y se rompe en cuanto cambian los datos. Arregla la regla, no el resultado."),
    ], "Los céntimos que bailan vienen de redondear en sitios distintos: una regla, en un solo nivel, y documentada."),
    ("n2m5l4", "Heredas una hoja con `=B2*1,21` copiada en 300 filas para calcular el total con IVA. ¿Qué problema tiene?", [
        op("Tiene el tipo de IVA escrito dentro de la fórmula: si cambia, hay que tocar 300 fórmulas. El tipo va en una celda de parámetros, con nombre, y la fórmula la usa.", "Separar los datos que cambian de las fórmulas es la base de un libro mantenible: cambias una celda y se actualiza todo. Además, con un nombre (por ejemplo `TipoIVA`) la fórmula se lee sola.", True),
        op("Ninguno: si da bien, está bien.", "Da bien hoy. El día que cambie el tipo o haya productos al 10 %, alguien tendrá que encontrar y cambiar las 300 fórmulas sin dejarse ninguna."),
        op("Debería ser `=B2+21%`.", "Eso suma 0,21 a la base, no el 21 %. El total con IVA es base × (1 + tipo)."),
        op("Le faltan los dólares: `=$B$2*1,21`.", "Con $B$2 todas las filas usarían la base de la fila 2. La referencia a la base debe ser relativa; lo que debería ser fijo es el tipo, en su celda."),
    ], "Ningún valor que pueda cambiar dentro de una fórmula: va en Parámetros, con nombre."),
    ("n4m2l3", "Vas a proteger la plantilla de pedidos para que los comerciales solo rellenen las celdas amarillas. ¿Qué haces antes de proteger la hoja?", [
        op("Desbloquear las celdas de entrada (Formato de celdas > Proteger, quitar «Bloqueada»).", "Todas las celdas nacen bloqueadas, pero el bloqueo solo actúa al proteger la hoja. Si no desbloqueas antes las de entrada, nadie podrá escribir en ellas.", True),
        op("Bloquear todas las celdas una a una.", "Ya lo están por defecto. Si proteges así, tampoco se podrá escribir en las amarillas."),
        op("Poner una contraseña de apertura al libro.", "Eso decide quién abre el archivo, no qué celdas se pueden cambiar. Son protecciones distintas."),
        op("Ocultar las columnas con fórmulas.", "Ocultar no protege: cualquiera las vuelve a mostrar en dos clics y puede borrarlas."),
    ], "Primero desbloquear lo que se rellena; después, Revisar > Proteger hoja."),
    ("n6m3l2", "Un cliente pide su extracto. Lo tienes en un libro con una hoja oculta que contiene los saldos de todos los clientes. ¿Lo mandas así?", [
        op("No. Le mando un PDF o una copia que solo tenga sus datos, y antes paso Inspeccionar documento.", "Una hoja oculta se muestra con dos clics. Mandar datos de otros clientes es una fuga de información y va contra el principio de minimización del RGPD. Inspeccionar documento avisa de hojas ocultas, comentarios y propiedades.", True),
        op("Sí, si protejo el libro con contraseña para que no se pueda mostrar la hoja.", "La protección de Excel sirve para evitar cambios por error, no como medida de seguridad: los datos siguen dentro del archivo. Lo que el cliente no debe ver no debe ir en el archivo."),
        op("Sí, porque es un cliente de confianza.", "La confianza no cambia la norma: los datos de los demás clientes no son suyos."),
        op("Sí, pero ocultando también las columnas de importes.", "Ocultar no es borrar: siguen en el archivo y cualquiera puede mostrarlas."),
    ], "A un tercero solo le llega lo suyo: PDF o copia limpia, y siempre Inspeccionar documento antes."),
]

c = CT
ctl = lambda pregunta, clave, tol, pista: {"pregunta": pregunta, "respuesta": c[clave], "tolerancia": tol, "pista": pista}
PARTE_B = [
    ("b1", "B1", "n3m3l2", [
        ctl("Número de líneas reales de pedido", "b1_lineas", 0, "Si te salen más, quedan filas repetidas o la fila de totales. Cuenta filas antes y después de cada paso."),
        ctl("Suma de la columna Cantidad", "b1_cantidad", 0, "Si sale casi el doble, has sumado también la fila «Total». Si sale algo más alto, quedan duplicados."),
        ctl("Número de líneas con fecha de octubre de 2026", "b1_octubre", 0, "Si te salen menos, hay fechas que siguen siendo texto (las que vienen como 2026-10-…): un filtro de fechas no las ve."),
        ctl("Número de clientes distintos con pedidos en el periodo", "b1_clientes", 0, "Si te salen más, hay códigos con un espacio al final que cuentan como clientes distintos."),
    ], "Ya tienes una base limpia y comprobada: el resto del examen depende de esto."),
    ("b2", "B2", "n2m5l2", [
        ctl("Σ Base de todas las líneas, incluidas las que no tienen tarifa (€)", "b2_base", 0.01, "Revisa que los precios con punto se han convertido bien (no ×100) y que las líneas sin tarifa cuentan en la base."),
        ctl("Σ IVA al 4 % (€)", "b2_iva4", 0.01, "El 4 % es solo la leche. Mira que el tipo sale de la Tarifa de cada producto."),
        ctl("Σ IVA al 10 % (€)", "b2_iva10", 0.01, "Café, infusiones, azúcar y complementos. Las líneas sin tarifa no tienen IVA conocido: no las sumes aquí."),
        ctl("Σ IVA al 21 % (€)", "b2_iva21", 0.01, "Maquinaria y menaje."),
        ctl("Σ Margen (€)", "b2_margen", 0.01, "Margen = Base − Cantidad × Coste. Las líneas sin tarifa no tienen coste: no cuentan."),
        ctl("Número de líneas cuyo producto no está en la tarifa", "b2_sin_tarifa", 0, "Busca los productos que no encuentra la búsqueda en la Tarifa, después de quitar espacios."),
    ], "Cada línea ya sabe su familia, su IVA, su zona y su margen, y las líneas raras están a la vista sin romper los totales."),
    ("b3", "B3", "n3m4l2", [
        ctl("Ventas (base) de la zona Burgos, con las zonas ya corregidas (€)", "b3_base_burgos", 0.01, "Si te sale menos, hay clientes con la zona mal escrita («burgos», «BURGOS ») o códigos de cliente con espacios que no encuentran su zona."),
        ctl("Peso de Café en las ventas de Palencia, en % con dos decimales (por ejemplo, 41,37)", "b3_pct_cafe_palencia", 0.01, "Es la base de Café de Palencia entre la base total de Palencia, por 100."),
        ctl("Margen del cliente con más margen (€)", "b3_margen_top", 0.01, "Suma el margen por cliente (no el de una línea) y ordena de mayor a menor."),
    ], "Tienes un resumen que se filtra, un gráfico que se entiende de un vistazo y el ranking de clientes que más aportan."),
    ("b4", "B4", "n2m4l3", [
        ctl("Deuda pendiente total a 31/10/2026, sin contar los saldos a favor (€)", "b4_pendiente", 0.01, "Suma solo los saldos positivos (Importe − Cobrado > 0)."),
        ctl("Importe vencido a más de 60 días (€)", "b4_mas60", 0.01, "Días vencidos = 31/10/2026 − Vencimiento. 60 días exactos van en «De 31 a 60»; 61 ya es «Más de 60»."),
        ctl("Número de clientes cuya deuda pendiente supera su límite", "b4_sobre_limite", 0, "Compara la deuda pendiente total de cada cliente (vencida y sin vencer) con su Límite."),
    ], "Sabes quién debe, cuánto y desde cuándo, y a quién hay que frenar los pedidos."),
    ("b5", "B5", "n4m3l1", [
        ctl("Margen % actual de Maquinaria en Burgos, con dos decimales (por ejemplo, 27,45)", "b5_margen_actual", 0.01, "Σ Margen / Σ Base de las líneas de Maquinaria de clientes de Burgos, por 100."),
        ctl("Precio medio al que habría que vender MAQ-ESP-2G en Burgos (€, dos decimales)", "b5_precio", 0.01, "Solo cambia el precio de MAQ-ESP-2G en Burgos; el resto de la maquinaria de Burgos queda igual. Deja que Excel despeje el precio por ti."),
    ], "Has respondido a un «¿y si…?» del director con una cifra exacta y comprobable."),
    ("b6", "B6", "n6m2l2", [
        ctl("Número de líneas después de añadir la semana 45", "b6_lineas", 0, "Son las líneas reales de B1 más las del CSV. Si te salen menos, el CSV se ha importado mal o no se ha ampliado el rango."),
        ctl("Número de líneas sin tarifa después de añadir la semana 45", "b6_sin_tarifa", 0, "La semana 45 trae un producto que no está en la tarifa. Tu libro debería avisarte."),
        ctl("Σ Base después de añadir la semana 45 (€)", "b6_base", 0.01, "Comprueba que el CSV se ha leído con coma decimal: un precio de 19,80 no puede convertirse en 1.980."),
    ], "Tu libro aguanta los datos de mañana y avisa solo cuando algo no cuadra: eso es trabajar sola con garantías."),
]
ENUN_B = {
    "B1": "En tu libro, la limpieza que se pide abajo. Trabaja en una copia de la hoja Pedidos o en una hoja nueva (la original no se toca) y sigue los criterios de la hoja Instrucciones.",
    "B2": "Sobre tus datos limpios. Recuerda los criterios 2 y 3 de Instrucciones: IVA redondeado a 2 decimales en cada línea y, en las líneas sin tarifa, base sí, pero IVA, coste y margen vacíos.",
    "B3": "Con tus datos limpios y calculados (semanas 36 a 44). Las zonas, ya corregidas.",
    "B4": "Con la hoja Cobros y la fecha de corte de Parámetros. Criterios 5 y 6 de Instrucciones (los saldos a favor van aparte).",
    "B5": "Con tus datos de B2. «Margen de Maquinaria en Burgos» = Σ Margen / Σ Base de las líneas de Maquinaria de clientes de Burgos (semanas 36 a 44).",
    "B6": "Usa examen-final-semana45.csv (UTF-8, separado por punto y coma, con coma decimal).",
}
PARTE_B_EJ = []
for ide, k, lec, ctrls, expl in PARTE_B:
    nom, mins, pts, enun = T_B[k]
    PARTE_B_EJ.append({
        "id": f"ef-{ide}", "modo": "excel", "leccion": lec, "puntos": pts, "minutos": mins,
        "enunciado": f"**{k} · {nom}** ({mins} min, {pts} puntos)\n\n> «{enun}»\n\n{ENUN_B[k]} Cuando termines, escribe tus totales de control.",
        "archivo": "examen-final-semana45.csv" if k == "B6" else "examen-final.xlsx",
        "controles": ctrls, "explicacion": expl,
    })

ZONA1 = max(AUX["pct_zona"], key=AUX["pct_zona"].get)
FAM1 = max(AUX["pct_fam"], key=AUX["pct_fam"].get)
assert ZONA1 != "Burgos"
MODELO = (
    "**Asunto:** Análisis de ventas S36-S44 y cartera a 31/10\n\n"
    "Rodrigo:\n\n"
    "Te envío el análisis de ventas y la cartera. Todos los controles del libro cuadran.\n\n"
    f"**Cifras clave.** Ventas: {es(c['b2_base'])} € sin IVA ({esn(c['b1_lineas'])} líneas); margen: {es(c['b2_margen'])} € ({es(AUX['margen_pct'], 1)} %). "
    f"Deuda pendiente: {es(c['b4_pendiente'])} €, de la que {es(c['b4_mas60'])} € está vencida a más de 60 días.\n\n"
    "**Conclusiones.**\n"
    f"1. {ZONA1} es la primera zona ({es(AUX['pct_zona'][ZONA1], 1)} % de las ventas); Burgos pesa el {es(AUX['pct_zona']['Burgos'], 1)} %.\n"
    f"2. {FAM1} es la familia que más vende ({es(AUX['pct_fam'][FAM1], 1)} %); en Palencia, el café supone el {es(c['b3_pct_cafe_palencia'])} %.\n"
    f"3. {c['b4_sobre_limite']} clientes superan su límite de crédito: propongo revisar sus pedidos.\n\n"
    f"Para llegar al 35 % de margen en Maquinaria en Burgos, MAQ-ESP-2G tendría que venderse a {es(c['b5_precio'])} € de media (hoy, {es(AUX['precio_actual'])} €).\n\n"
    f"**Riesgos.** {N_SIN} líneas ({es(AUX['base_sin'])} €) son de productos descatalogados sin tarifa: cuentan en ventas, no en margen. "
    f"Hay 3 facturas cobradas de más ({es(AUX['favor'])} €) por devolver o compensar. La semana 45 trae un producto nuevo, {NUEVO[0]}, sin tarifa.\n\n"
    "**Supuestos.** Antes de empezar te habría preguntado si las ventas llevan portes y si el margen es sobre el coste de tarifa o el real. He tomado ventas sin portes y coste de tarifa. ¿Me lo confirmas?\n\n"
    "Un saludo,\n[Tu nombre]"
)
n_pal = len([w_ for w_ in MODELO.replace("**", "").split() if any(ch.isalnum() for ch in w_)])
assert n_pal <= 195, n_pal

PARTE_C = {
    "id": "ef-c1", "modo": "abierta", "leccion": "n6m3l1", "puntos": 25,
    "pregunta": "Escribe a **Rodrigo Pardo** (jefe de administración) el correo con el que entregas el análisis. **Máximo 200 palabras.** Usa las cifras de tu libro.",
    "modelo": MODELO,
    "criterios": [
        "Cifras clave correctas e iguales a las del libro (ventas, margen, deuda y vencido a más de 60 días).",
        "Tres conclusiones con su cifra (por ejemplo: «Burgos pesa el X % de las ventas»).",
        "Dos riesgos o límites de los datos: las líneas sin tarifa, las zonas mal escritas, los saldos a favor o el producto nuevo.",
        "La pregunta que habría hecho antes de empezar (¿ventas con o sin portes? ¿margen sobre el coste de tarifa o el real?) y los supuestos que ha tomado.",
        "Tono profesional y claro: asunto concreto, lo importante primero y sin pasar de 200 palabras.",
    ],
}

RUBRICA = f"""### Puntuación (100 puntos)

| Parte | Qué se evalúa | Tiempo | Puntos |
|---|---|---|---|
| A · Criterio | 12 preguntas (1,25 cada una) | 15 min | 15 |
| B · Libro | 6 tareas con totales de control | 75 min | 60 |
| C · Correo | Correo de entrega a Rodrigo | 20 min | 25 |

**Parte B.** Cada tarea vale sus puntos (B1 10, B2 15, B3 12, B4 10, B5 6, B6 7), repartidos a partes iguales entre sus totales de control: un total cuadra si está dentro de la tolerancia (0,01 € en importes y porcentajes; 0 en recuentos).

**Parte C.** Cinco criterios de 5 puntos: (1) cifras clave correctas e iguales a las del libro; (2) tres conclusiones con cifra; (3) dos riesgos o límites de los datos; (4) la pregunta que habrías hecho antes de empezar y los supuestos tomados; (5) tono profesional y claro. Cada criterio: 5 = lo cumple del todo; 3 = a medias; 0 = no aparece. La tutora lo comenta con este baremo; si no está disponible, compáralo tú con el correo modelo.

### Para ser apta
- **70 puntos o más**, con **36 de 60 o más en la Parte B**, y **ningún bloqueante**.
- En esta web, el examen queda superado cuando aciertas el 80 % de las preguntas que se corrigen solas **y** cuadran todos los totales de control: sin un libro bien hecho no hay aprobado, igual que en una prueba real.

### Bloqueantes (no apta aunque la suma salga)
1. La Σ Base de B2 está mal y el libro no lo avisa en ningún sitio.
2. Las cifras del correo no coinciden con las del libro.
3. Has borrado o modificado la hoja Pedidos original.

### Lo que mira una empresa además de las cifras
| Criterio | Bien | Excelente |
|---|---|---|
| Exactitud | Todos los totales cuadran | Además, documentas los problemas de los datos con su impacto en € |
| Estructura | Parámetros, datos, cálculos, informe y controles separados; Tablas | Además, un Léame con el que otra persona entiende el libro en 5 minutos |
| Mantenimiento | La semana 45 entra sin rehacer nada | Además, los controles avisan solos (filas, totales, productos sin tarifa) |
| Presentación | Formatos de €, % y fecha; gráfico adecuado | Además, lo importante primero y un gráfico que no depende solo del color |
| Comunicación | Correo breve con cifras, conclusiones y supuestos | Además, propone decisiones y avisa de los límites de los datos |

Si no la superas, repítela con calma al cabo de unos días: revisa antes las lecciones que te indica cada tarea."""

tr = AUX["tramos"]
filas_top = "\n".join(f"| {k + 1} | {t[0]} | {t[1]} | {t[2]} | {es(t[3])} € |" for k, t in enumerate(TOP5))
filas_sobre = "\n".join(f"| {s_[0]} | {s_[1]} | {es(s_[2])} € | {esn(s_[3])} € |" for s_ in AUX["sobre"])
SOLUCION = f"""Abre **examen-final-solucion.xlsx**: tiene cada paso hecho con fórmulas, la hoja Controles (con tus totales del examen al lado de los del libro) y la hoja Calidad con los problemas sembrados.

### Parte A · Criterio
1. Espacios o texto frente a número. 2. Rango fijo o falta Actualizar: Tabla como origen. 3. De menor a mayor por el límite inferior. 4. Σ margen / Σ base. 5. Importar con la configuración regional de origen y probar con un día > 12. 6. Power Query desde carpeta. 7. Caso conocido, rangos y nada de datos personales en asistentes no autorizados. 8. `">="&FECHA(2026;10;1)`. 9. Redondear en el mismo nivel en que se factura y documentarlo. 10. Valor fijo en la fórmula: el tipo, en Parámetros con nombre. 11. Desbloquear antes las celdas de entrada. 12. No: PDF o copia solo con sus datos e Inspeccionar documento.

### B1 · Limpieza ({esn(N_LEGIT)} líneas)
1. Clic derecho en la pestaña **Pedidos** > **Mover o copiar** > **Crear una copia**. La original no se toca.
2. En la copia, quita la fila «Total» (la última) y después **Datos > Herramientas de datos > Quitar duplicados** con todas las columnas: quita **{N_DUP}** filas (el final del {AUX['dia_dup']} sale dos veces).
3. Columnas auxiliares y después **Pegado especial > Valores** sobre las originales:
   - Fecha: `=SI(ESNUMERO(A2);A2;FECHANUMERO(A2))` con formato de fecha ({N_ISO} fechas venían como texto «2026-09-14»). Si tu Excel no reconociera ese texto, `=FECHA(IZQUIERDA(A2;4);EXTRAE(A2;6;2);DERECHA(A2;2))`.
   - Precio: `=SI(ESNUMERO(F2);F2;VALOR.NUMERO(F2;".";","))` ({N_PRECIO} precios con punto como texto; VALOR a secas los leería mal con la configuración española).
   - Cliente: `=ESPACIOS(C2)` ({N_ESP} códigos con un espacio al final).
4. Comprueba: `=CONTARA(A:A)-1` da {esn(N_LEGIT)} y `=CONTAR(A:A)` da lo mismo (todas las fechas son números).

Totales: {esn(c['b1_lineas'])} líneas · Σ Cantidad {esn(c['b1_cantidad'])} · {c['b1_octubre']} líneas de octubre · {c['b1_clientes']} clientes distintos.

### B2 · Cálculos y cruces
Convierte los datos en Tabla ([[Ctrl]]+[[T]]). Da nombre a las zonas válidas (ListaZonas = Parámetros!A16:A19) y en Clientes añade la zona corregida: `=BUSCARX(ESPACIOS(D2);ListaZonas;ListaZonas;"REVISAR")` (BUSCARX no distingue mayúsculas y devuelve la grafía de la lista). Columnas de la Tabla:
- Familia: `=BUSCARX([@CodProducto];Tarifa!A:A;Tarifa!C:C;"SIN TARIFA")`; TipoIVA y CosteUnit igual, con `""` si no está.
- Zona: `=BUSCARX([@CodCliente];Clientes!A:A;Clientes!G:G;"SIN CLIENTE")`; TipoCliente, igual con la columna C.
- Base: `=REDONDEAR([@Cantidad]*[@PrecioUnitario];2)`. IVA: `=SI([@TipoIVA]="";"";REDONDEAR([@Base]*[@TipoIVA];2))`. Total: `=SI([@IVA]="";"";[@Base]+[@IVA])`.
- Margen: `=SI([@CosteUnit]="";"";[@Base]-[@Cantidad]*[@CosteUnit])`. SinTarifa: `=SI([@Familia]="SIN TARIFA";1;0)`.
- Sin BUSCARX (Excel 2019 o anterior): `=SI.ERROR(INDICE(Tarifa!C:C;COINCIDIR(D2;Tarifa!A:A;0));"SIN TARIFA")`.

Totales: Σ Base {es(c['b2_base'])} € · IVA 4 % {es(c['b2_iva4'])} € · IVA 10 % {es(c['b2_iva10'])} € · IVA 21 % {es(c['b2_iva21'])} € · Σ Margen {es(c['b2_margen'])} € ({es(AUX['margen_pct'], 1)} %) · {c['b2_sin_tarifa']} líneas sin tarifa (CAF-ETI-1K, INF-JEN-100 y MEN-COP-12; {es(AUX['base_sin'])} € de base).

### B3 · Análisis
Tabla dinámica desde la Tabla: Zona en filas, Familia en columnas y Suma de Base en valores. Añade Base otra vez y, en **Configuración de campo de valor > Mostrar valores como**, el porcentaje del total de la fila. **Insertar segmentación de datos** por TipoCliente y un **gráfico dinámico** de columnas 100 % apiladas. Para el top 5, una tabla dinámica por cliente con Suma de Margen ordenada de mayor a menor (o SUMAR.SI.CONJUNTO por cliente y K.ESIMO.MAYOR).

Ventas por zona: {"; ".join(f"{z} {es(AUX['base_zona'][z])} € ({es(AUX['pct_zona'][z], 1)} %)" for z in ZONAS)}. Familia que más pesa en cada zona: {"; ".join(f"{z}, {AUX['fam_top_zona'][z]}" for z in ZONAS)}.

| Puesto | Cliente | Nombre | Zona | Margen |
|---|---|---|---|---|
{filas_top}

Totales: Base de Burgos {es(c['b3_base_burgos'])} € · Café en Palencia {es(c['b3_pct_cafe_palencia'])} % · margen del primer cliente {es(c['b3_margen_top'])} €.

### B4 · Cartera a 31/10/2026
Nombres definidos: FechaCorte = Parámetros!B2 y TablaTramos = Parámetros!A10:C13. En Cobros: Saldo `=E2-F2`; Días `=FechaCorte-D2`; Tramo `=SI(G2<0;"Saldo a favor";SI(G2=0;"Cobrada";BUSCARV(H2;TablaTramos;3;VERDADERO)))` (o BUSCARX con modo de coincidencia -1). Después, por cliente, SUMAR.SI.CONJUNTO del saldo por tramo (o una tabla dinámica Cliente × Tramo), y «supera el límite» = deuda pendiente > Límite.

Tramos: sin vencer {es(tr['Sin vencer'])} € · de 1 a 30 días {es(tr['De 1 a 30 días'])} € · de 31 a 60 días {es(tr['De 31 a 60 días'])} € · más de 60 días {es(tr['Más de 60 días'])} €. Ojo con las fronteras: hay facturas con 0, 30, 31, 60 y 61 días vencidos. Saldos a favor: 3 facturas, {es(AUX['favor'])} €, aparte.

| Cliente | Nombre | Deuda pendiente | Límite |
|---|---|---|---|
{filas_sobre}

Totales: deuda pendiente {es(c['b4_pendiente'])} € · vencido a más de 60 días {es(c['b4_mas60'])} € · {c['b4_sobre_limite']} clientes por encima del límite.

### B5 · Qué pasaría si
En una hoja aparte: base y margen de Maquinaria en Burgos (SUMAR.SI.CONJUNTO), unidades de MAQ-ESP-2G en Burgos ({AUX['q']}), una celda con el precio de prueba y el margen % recalculado con ese precio. Después, **Datos > Previsión > Análisis de hipótesis > Buscar objetivo**: Definir la celda = margen %, Con el valor = 0,35, Cambiando la celda = precio de prueba. Comprobación a mano: precio = (Coste de la maquinaria de Burgos / (1 − 0,35) − Base del resto de maquinaria de Burgos) / unidades.

Totales: margen actual {es(c['b5_margen_actual'])} % · precio necesario **{es(c['b5_precio'])} €** (hoy se vende a {es(AUX['precio_actual'])} € de media).

### B6 · Robustez
- **Datos > De texto/CSV**, con Origen del archivo 65001: Unicode (UTF-8) y delimitador punto y coma; las líneas se añaden a la Tabla (o a la consulta, y Actualizar todo con [[Ctrl]]+[[Alt]]+[[F5]]). Las columnas calculadas se extienden solas.
- Hoja Controles: cada comprobación con esperado, obtenido, diferencia, tolerancia y VERDADERO/FALSO (filas = origen − Total − duplicados; Σ resumen = Σ datos; Σ tramos = deuda; fechas que no son fecha = 0; clientes sin ficha = 0). Control maestro `=Y(G5:G14)` repetido en el Resumen.
- Aviso aparte: líneas con productos sin tarifa que no son los descatalogados conocidos. Con la semana 45 salta: **{NUEVO[0]}** en {N_NUEVO} líneas. Hay que pedir su alta en la Tarifa.

Totales: {esn(c['b6_lineas'])} líneas · {c['b6_sin_tarifa']} sin tarifa · Σ Base {es(c['b6_base'])} €.

### Parte C · Correo modelo ({n_pal} palabras)
{MODELO}"""

EXAMEN = {
    "titulo": "Prueba técnica de empresa · Tostadero Albada",
    "resumen": "Una prueba de selección real de 120 minutos: criterio profesional, un libro con datos sucios que limpiar, cruzar, analizar y dejar preparado para mañana, y el correo de entrega.",
    "duracion": 120,
    "intro": (
        "Te presentas al puesto de **Administrativa de gestión y análisis (Excel avanzado)** en **Tostadero Albada, S.L.**, una distribuidora de café, infusiones, leche y maquinaria para hostelería de Valladolid (inventada para este examen, para que no se pueda resolver de memoria). "
        "Así son las pruebas técnicas de las empresas: un libro con instrucciones, tareas que describen el resultado sin decirte qué función usar y tiempo limitado.\n\n"
        "- **Parte A · Criterio** (15 min, 15 puntos): 12 preguntas.\n"
        "- **Parte B · Libro** (75 min, 60 puntos): seis tareas en `examen-final.xlsx`. Lee primero su hoja **Instrucciones**, con los criterios ya pactados con la empresa. Al acabar cada tarea, escribe aquí sus totales de control.\n"
        "- **Parte C · Correo** (20 min, 25 puntos): el correo de entrega a Rodrigo Pardo, jefe de administración.\n\n"
        "Pon un cronómetro a la vista. Puedes usar la ayuda de Excel ([[F1]]), pero no internet ni IA. **Variante «modo 2026»** (opcional): Copilot permitido, con la obligación de anotar cómo has comprobado cada fórmula que te proponga.\n\n"
        "No abras la solución hasta entregar: en una prueba de verdad no la hay."
    ),
    "archivos": [
        {"archivo": "examen-final.xlsx", "titulo": "Libro del examen", "descripcion": "Instrucciones, Pedidos (tal como salen del programa), Clientes, Tarifa, Cobros y Parámetros."},
        {"archivo": "examen-final-semana45.csv", "titulo": "Pedidos de la semana 45", "descripcion": "CSV para la tarea B6 (UTF-8, punto y coma, coma decimal)."},
    ],
    "partes": [
        {"titulo": "Parte A · Criterio (15 min, 15 puntos)",
         "md": "Doce situaciones que te encontrarás en cualquier oficina. Elige la respuesta que darías en tu primera semana de trabajo.",
         "ejercicios": [{"id": f"ef-a{k + 1}", "modo": "test", "leccion": lec, "pregunta": preg, "opciones": ops, "explicacion": expl}
                        for k, (lec, preg, ops, expl) in enumerate(PARTE_A)]},
        {"titulo": "Parte B · Libro (75 min, 60 puntos)",
         "md": "Descarga `examen-final.xlsx` y lee su hoja **Instrucciones**. Las tareas B1 a B5 se hacen con las semanas 36 a 44; la semana 45 solo entra en B6. Cada tarea depende de la anterior: si un total no cuadra, revisa primero la limpieza.",
         "ejercicios": PARTE_B_EJ},
        {"titulo": "Parte C · Correo de entrega (20 min, 25 puntos)",
         "md": "Rodrigo lo leerá en el móvil entre dos reuniones: lo importante primero, cifras iguales a las del libro y nada de anexos innecesarios.",
         "ejercicios": [PARTE_C]},
    ],
    "rubrica": RUBRICA,
    "solucion_md": SOLUCION,
    "archivo_solucion": "examen-final-solucion.xlsx",
}
json.dump(EXAMEN, open(F_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open(F_JSON, "a", encoding="utf-8").write("\n")

print(json.dumps(CT, ensure_ascii=False))
print("Correo modelo:", n_pal, "palabras · top zona:", AUX["fam_top_zona"], "· precio actual", AUX["precio_actual"], "q", q)
print("Escrito:", F_DATOS, F_CSV, F_SOL, F_JSON, sep="\n  ")

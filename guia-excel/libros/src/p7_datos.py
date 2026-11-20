# -*- coding: utf-8 -*-
"""
P7 · Presupuesto frente a real y previsión de cierre (Control de gestión) · DATOS DE PARTIDA
==========================================================================================

Genera (lo que recibe la alumna):
  libros/p7-datos.xlsx                      Instrucciones + el presupuesto 2026 tal como lo hizo
                                            cada departamento (5 pestañas: Ingresos, Comercial,
                                            Almacén y logística, Administración, Dirección) +
                                            Mapeo_cuentas + Reparto_por_cuenta
  libros/p7-diario-2026-ene-oct.csv         extracto de contabilidad (grupos 6 y 7) de enero a
                                            octubre de 2026: UTF-8 con BOM, separador «;», coma
                                            decimal, fechas DD/MM/AAAA
  libros/p7-control-2025-paco.xlsx          el libro heredado de Paco Gil (control de 2025) con
                                            8 errores sembrados
  libros/p7-diario-2026-ene-oct-18nov.csv   el mismo extracto exportado otra vez el 18/11 (cambio
                                            inesperado: una factura de transporte de octubre)
y para la solución (NO se entrega):
  libros/src/p7-log-suciedad.csv            cada problema sembrado (archivo, ubicación, columna,
                                            problema, valor original, valor limpio)
  libros/src/p7-verdad.json                 cifras LIMPIAS de diseño, para que p7_solucion.py
                                            compruebe su limpieza

Empresa ficticia: Electro Cierzo Suministros, S.L. Encargo de Marta Ruiz (directora financiera),
lunes 09/11/2026. Todo es inventado. Las ventas netas y el margen de cada mes son los de P5
(p5_verdad.json: 7.841.402,19 € de ventas netas y 2.156.385,12 € de margen de enero a octubre).

CIFRAS DE DISEÑO FIJAS (research/proyectos.md, P7)
- Presupuesto aprobado 2026: ventas netas 9.480.000; coste de ventas 6.825.600 (72 %);
  personal 1.698.000; otros gastos de explotación 512.400; amortización 96.000; financieros
  41.000; resultado 307.000. Total de gastos 9.173.000.
- Transportes (624): real ene-oct 101.500 frente a 105.000 de presupuesto acumulado; el 18/11
  llega una factura de octubre de 9.800 (pasa a 111.300).
- Seguro anual de 14.400 contabilizado en enero (625); presupuesto en doceavas (1.200/mes).
- Amortización trimestral de 24.000 en marzo, junio y septiembre (681); presupuesto 8.000/mes.
- Cuenta 62900099 «Gastos apertura Logroño»: 21.300 en septiembre y octubre, fuera de presupuesto.
- Reclasificación de octubre, asiento 2026/4120: Haber 18.000 en la 629 y Debe 18.000 en la 621
  (el alquiler del almacén de Pamplona de enero a septiembre se había cargado en la 629).
- Préstamo de P4 (85.000 € al 5 %, 48 cuotas; la cuota 10 es la de enero de 2026): intereses
  de las cuotas 10 a 19 en la 66200001. La póliza de Banco Sur liquida intereses cada mes
  (66230001).

DESVIACIONES DE DISEÑO (acumulado ene-oct, partida × departamento; umbral |%| ≥ 5 y |€| ≥ 3.000)
- Importan: Publicidad y ferias COM (+7.300, D) · Sueldos y salarios ALM (+21.200, D, horas extra
  de la campaña) · Reparaciones ALM (+4.200, D, avería de la carretilla) · Suministros ALM
  (+3.720, D, luz) · Amortización ADM (−8.000, F, TEMPORAL) · Apertura Logroño DIR (+21.300,
  fuera de presupuesto).
- Casos frontera para el umbral doble: Seguros ADM (+20 %, pero +2.400 €), Seguridad Social ALM
  (+4.800 €, pero +3,9 %), Profesionales DIR (+6 %, pero +900 €), Ventas netas (−36.478 €, −0,46 %).

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5)
Presupuesto (p7-datos.xlsx):
- Q11 Cabeceras desplazadas: cada pestaña tiene un número distinto de filas de título (4, 3, 4,
      2 y 3); la última es una fila con celdas combinadas encima de los meses.
- Q12 Formato ancho: los meses van en columnas (y hay una columna «Total» que NO es un mes).
- Meses en tres formatos: fecha «ene-26» (Ingresos y Administración), texto «Enero»
      (Comercial) y número 1-12 (Almacén y logística). Dirección: solo el total anual.
- Q10 Subtotales mezclados: «Total servicios exteriores» en Comercial y en Almacén y logística,
      y una fila «TOTAL …» al final de cada pestaña (con una fila vacía delante en dos de ellas).
- Q05 Números como texto: en Administración todos los importes son texto («16.500,00»), por eso
      su fila TOTAL no suma nada.
- Q16 / trampa de tipos: en Mapeo_cuentas y en Reparto_por_cuenta la Cuenta3 es NÚMERO (640) e
      IZQUIERDA devuelve TEXTO («640») → #N/D. Además falta la excepción de 8 dígitos para la
      62900099 (si se mapea por 3 dígitos, Logroño se esconde en «Otros servicios»).
Diario (CSV):
- Q14 Signo: Debe y Haber en dos columnas. Hay gastos en el Haber (abonos de proveedores en la
      600 y la reclasificación de la 629) e ingresos en el Debe (devoluciones de la 708).
- Q09 CentroCoste vacío en 210 líneas: 160 de ventas (700 → COM), 30 de compras (600 → ALM),
      8 de transportes (624 → ALM) y 12 tickets de taxi y aparcamiento (629, que no está en la
      tabla Reparto_por_cuenta → «Sin asignar»).
- Diferencias temporales (seguro en enero, amortización trimestral), la 62900099 y la
      reclasificación 2026/4120 (ver arriba).
Libro de Paco (p7-control-2025-paco.xlsx), 8 errores:
- E1 Real_2025!H17 (Transportes) =SUM(H5:H15): deja fuera diciembre.
- E2 Real_2025!D7 (Personal de marzo): valor fijo 142.000 escrito encima de la fórmula.
- E3 Informe!E6:E21 % de desviación =D6/C$5: todas las filas dividen por el presupuesto de ventas.
- E4 Informe!B20:C20 Total gastos =SUM(B6:B19): incluye el subtotal «Total servicios exteriores».
- E5 Informe!D5 Desviación de ventas =C5-B5 (Ppto − Real), al revés que el resto de filas.
- E6 Informe!B18 Amortización =IFERROR(Real_2025!#REF!,0): la columna se borró y sale 0.
- E7 Informe!C5:C16, C18 y C19 (presupuesto 2025) enlazados a presupuesto_2025.xlsx, que ya no
      existe (vínculo roto; el libro guarda los últimos valores).
- E8 Libro en cálculo MANUAL: el 19/01 se metió en Datos_2025 la regularización de existencias
      de diciembre (+21.600 en la 600) y las fórmulas no se recalcularon antes de presentar.

Uso:  python3 p7_datos.py
"""
import csv
import json
import os
import random
import re
import shutil
import tempfile
import zipfile
from datetime import date, timedelta

import numpy as np
import pandas as pd
import xlsxwriter

SEMILLA = 7207
rng = np.random.default_rng(SEMILLA)
random.seed(SEMILLA)

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
DATOS_XLSX = os.path.join(LIBROS, "p7-datos.xlsx")
CSV_DIARIO = os.path.join(LIBROS, "p7-diario-2026-ene-oct.csv")
CSV_18NOV = os.path.join(LIBROS, "p7-diario-2026-ene-oct-18nov.csv")
PACO = os.path.join(LIBROS, "p7-control-2025-paco.xlsx")
LOG = os.path.join(AQUI, "p7-log-suciedad.csv")
VERDAD = os.path.join(AQUI, "p7-verdad.json")

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]
FESTIVOS = {date(2026, 1, 1), date(2026, 1, 6), date(2026, 4, 2), date(2026, 4, 3), date(2026, 4, 23),
            date(2026, 5, 1), date(2026, 10, 12)}


def laborables(mes, anio=2026):
    d, out = date(anio, mes, 1), []
    while d.month == mes:
        if d.weekday() < 5 and d not in FESTIVOS:
            out.append(d)
        d += timedelta(1)
    return out


LAB = {m: laborables(m) for m in range(1, 13)}


def habil_desde(d):
    while d.weekday() >= 5 or d in FESTIVOS:
        d += timedelta(1)
    return d


def repartir(total, pesos):
    """Reparte un importe en céntimos exactos según unos pesos (suma exacta)."""
    signo = -1 if total < 0 else 1
    pesos = np.asarray(pesos, float)
    pesos = pesos / pesos.sum()
    cent = int(round(abs(total) * 100))
    base = np.floor(pesos * cent).astype(np.int64)
    resto = int(cent - base.sum())
    frac = pesos * cent - base
    base[np.argsort(-frac)[:resto]] += 1
    return [signo * int(x) / 100 for x in base]


def reparto_entero(total, pesos):
    pesos = np.asarray(pesos, float) / np.sum(pesos)
    v = [int(round(total * p)) for p in pesos]
    v[-1] += int(round(total - sum(v)))
    return v


def doce(total):
    return reparto_entero(total, [1] * 12)


def es_num(x):
    return f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def ipmt(tasa, per, nper, va):
    """PAGOINT de Excel en positivo para un préstamo francés (va > 0)."""
    cuota = va * tasa / (1 - (1 + tasa) ** -nper)
    saldo = va * (1 + tasa) ** (per - 1) - cuota * ((1 + tasa) ** (per - 1) - 1) / tasa
    return saldo * tasa


LOGS = []


def log(archivo, ubicacion, columna, problema, original, limpio):
    LOGS.append([archivo, ubicacion, columna, problema, original, limpio])


# =====================================================================================
# 1. PRESUPUESTO 2026 (cifras aprobadas por el consejo, fijas)
# =====================================================================================
W_VENTAS = [0.075, 0.078, 0.088, 0.086, 0.090, 0.092, 0.084, 0.058, 0.088, 0.092, 0.088, 0.081]
W_PUB = [0.065] * 12
W_PUB[2], W_PUB[9] = 0.15, 0.20            # campaña de primavera y feria de octubre
W_SUM = [0.105, 0.095, 0.085, 0.075, 0.07, 0.075, 0.085, 0.08, 0.07, 0.075, 0.09, 0.095]

v700 = reparto_entero(9669600, W_VENTAS)
v708 = reparto_entero(-189600, W_VENTAS)
neto = [a + b for a, b in zip(v700, v708)]
v600 = [int(round(0.72 * n)) for n in neto]
v600[-1] += 6825600 - sum(v600)

# (pestaña, departamento, filas de título, formato del mes, filas [(cuenta3, descripción, importes)],
#  cuentas del subtotal «Total servicios exteriores», texto de la fila TOTAL, fila vacía antes del TOTAL)
PESTANAS = [
    ("Ingresos", "COM", 4, "fecha", [
        (700, "Ventas de mercaderías", v700),
        (708, "Devoluciones de ventas", v708)], None, "TOTAL INGRESOS", False),
    ("Comercial", "COM", 3, "texto", [
        (640, "Sueldos y salarios", doce(498000)),
        (642, "Seguridad Social empresa", doce(159000)),
        (621, "Renting de vehículos", doce(18000)),
        (627, "Publicidad y ferias", reparto_entero(30000, W_PUB)),
        (629, "Viajes y dietas", doce(42000))], [621, 627, 629], "TOTAL COMERCIAL", True),
    ("Almacén y logística", "ALM", 4, "numero", [
        (600, "Compras de mercaderías", v600),
        (640, "Sueldos y salarios", doce(456000)),
        (642, "Seguridad Social empresa", doce(147000)),
        (621, "Alquiler de naves y almacenes", doce(120000)),
        (622, "Reparaciones y mantenimiento", doce(18000)),
        (624, "Transportes", doce(126000)),
        (628, "Suministros (luz y agua)", reparto_entero(42000, W_SUM))], [621, 622, 624, 628],
        "TOTAL ALMACÉN Y LOGÍSTICA", False),
    ("Administración", "ADM", 2, "fecha", [
        (640, "Sueldos y salarios", doce(186000)),
        (642, "Seguridad Social empresa", doce(59000)),
        (623, "Asesoría y auditoría", doce(36000)),
        (625, "Primas de seguros", doce(14400)),
        (626, "Servicios bancarios", doce(9600)),
        (629, "Material de oficina, mensajería y teléfono", doce(24000)),
        (681, "Amortización del inmovilizado", doce(96000)),
        (662, "Intereses de préstamos y póliza", doce(41000))], None, "TOTAL ADMINISTRACIÓN", True),
    ("Dirección", "DIR", 3, "anual", [
        (640, "Sueldos y salarios", 148000),
        (642, "Seguridad Social empresa", 45000),
        (623, "Consultoría", 18000),
        (629, "Viajes y representación", 14400)], None, "TOTAL DIRECCIÓN", False),
]

MAPEO = [  # Cuenta3, descripción PGC, Partida, Tipo, Bloque
    (600, "Compras de mercaderías", "Compras de mercaderías", "Gasto", "Coste de ventas"),
    (621, "Arrendamientos y cánones", "Arrendamientos", "Gasto", "Otros gastos de explotación"),
    (622, "Reparaciones y conservación", "Reparaciones", "Gasto", "Otros gastos de explotación"),
    (623, "Servicios de profesionales independientes", "Profesionales independientes", "Gasto",
     "Otros gastos de explotación"),
    (624, "Transportes", "Transportes", "Gasto", "Otros gastos de explotación"),
    (625, "Primas de seguros", "Seguros", "Gasto", "Otros gastos de explotación"),
    (626, "Servicios bancarios y similares", "Servicios bancarios", "Gasto", "Otros gastos de explotación"),
    (627, "Publicidad, propaganda y relaciones públicas", "Publicidad y ferias", "Gasto",
     "Otros gastos de explotación"),
    (628, "Suministros", "Suministros", "Gasto", "Otros gastos de explotación"),
    (629, "Otros servicios", "Otros servicios", "Gasto", "Otros gastos de explotación"),
    (640, "Sueldos y salarios", "Sueldos y salarios", "Gasto", "Personal"),
    (642, "Seguridad Social a cargo de la empresa", "Seguridad Social", "Gasto", "Personal"),
    (662, "Intereses de deudas", "Intereses de deudas", "Gasto", "Financiero"),
    (681, "Amortización del inmovilizado material", "Amortización", "Gasto", "Amortización"),
    (700, "Ventas de mercaderías", "Ventas netas", "Ingreso", "Ventas"),
    (708, "Devoluciones de ventas y operaciones similares", "Ventas netas", "Ingreso", "Ventas"),
]
REPARTO = [  # Cuenta3, CentroCoste, motivo
    (700, "COM", "Las ventas son del departamento comercial"),
    (708, "COM", "Las devoluciones de ventas, también"),
    (600, "ALM", "Las compras de mercaderías las gestiona el almacén"),
    (624, "ALM", "Los portes los contrata el almacén"),
    (625, "ADM", "Seguros generales de la empresa"),
    (626, "ADM", "Bancos"),
    (662, "ADM", "Financiación"),
    (681, "ADM", "Amortización (se lleva en Administración)"),
]
MAPA = {m[0]: m for m in MAPEO}

# Presupuesto «verdadero» en formato largo (Departamento, Cuenta3, Mes, Importe positivo)
ppto_rows = []
for nombre, dep, _, fmt, filas, _, _, _ in PESTANAS:
    for c3, _, imp in filas:
        meses = [imp / 12] * 12 if fmt == "anual" else imp
        for m, x in enumerate(meses, 1):
            ppto_rows.append(dict(Pestana=nombre, Departamento=dep, Cuenta3=c3, Mes=m, Importe=abs(x)))
PPTO = pd.DataFrame(ppto_rows)
PPTO["Tipo"] = PPTO.Cuenta3.map(lambda c: MAPA[c][3])
PPTO["Bloque"] = PPTO.Cuenta3.map(lambda c: MAPA[c][4])
PPTO["Partida"] = PPTO.Cuenta3.map(lambda c: MAPA[c][2])
PPTO["ImporteSigno"] = np.where(PPTO.Cuenta3 == 708, -PPTO.Importe, PPTO.Importe)   # 708 resta
b = PPTO.groupby("Bloque").ImporteSigno.sum().round(2)
assert b["Ventas"] == 9480000 and b["Coste de ventas"] == 6825600 and b["Personal"] == 1698000
assert b["Otros gastos de explotación"] == 512400 and b["Amortización"] == 96000 and b["Financiero"] == 41000

# =====================================================================================
# 2. DIARIO REAL 2026 (enero-octubre), primero LIMPIO
# =====================================================================================
P5 = json.load(open(os.path.join(AQUI, "p5_verdad.json"), encoding="utf-8"))
P5_MES = {int(k): v for k, v in P5["por_mes"].items()}
VENTAS_NETAS = round(sum(v[1] for v in P5_MES.values()), 2)
COSTE_TOTAL = round(VENTAS_NETAS - P5["margen_total"], 2)
assert VENTAS_NETAS == 7841402.19

LINEAS = []


def add(fecha, cuenta, concepto, cc, debe=0.0, haber=0.0, grupo=None):
    LINEAS.append(dict(fecha=fecha, cuenta=str(cuenta), concepto=concepto, cc=cc,
                       debe=round(debe, 2), haber=round(haber, 2), grupo=grupo))


def dias_al_azar(m, n):
    return sorted(rng.choice(LAB[m], n))


RAICES = ["Arnal", "Lasheras", "Bueno", "Lafuente", "Gimeno", "Ibarra", "Echeverría", "Casals", "Aznar",
          "Lacasa", "Pueyo", "Sarasa", "Urdániz", "Monclús", "Solans", "Arregui", "Bielsa", "Torrent",
          "Lorente", "Gracia", "Escartín", "Larraz", "Oliván", "Zubiri", "Vallés", "Pallarés"]
PREF = ["Instalaciones Eléctricas", "Electricidad", "Montajes Eléctricos", "Electro", "Instalaciones"]
SUF = ["S.L.", "S.L.", "S.L.", "S.L.U.", "S.A."]
CLIENTES = sorted({f"{random.choice(PREF)} {r}, {random.choice(SUF)}" for r in RAICES for _ in range(3)})
PROVEEDORES = [("CEB", "Cables del Ebro, S.A."), ("IMO", "Iluminación Moncayo, S.L."),
               ("MAN", "Mecanismos Aneto, S.L."), ("PCI", "Protección Cinca, S.A."),
               ("CTU", "Canalizaciones Tudela, S.L."), ("HTR", "Herramientas Turia, S.L."),
               ("LUZ", "Luzaide Distribución, S.L."), ("ELV", "Elecvía Suministros, S.A."),
               ("TOR", "Tormes Material Eléctrico, S.L."), ("YES", "Yesa Componentes, S.L.")]
TRANSPORTISTAS = ["Transportes Moncayo Express, S.L.", "Logística Valle Medio, S.L.", "Paquetería Somontano, S.L."]

# --- Ventas (700) y devoluciones (708): las de P5 mes a mes ---
facturas = []
for m in range(1, 11):
    n_p5, net = P5_MES[m]
    dev = round(net * rng.uniform(0.018, 0.024), 2)
    bruto = round(net + dev, 2)
    n7, n8 = int(round(n_p5 * 0.35)), int(rng.integers(26, 36))
    for d, x in zip(dias_al_azar(m, n7), repartir(bruto, rng.lognormal(0, 0.9, n7))):
        facturas.append((d, "V", x))
    for d, x in zip(dias_al_azar(m, n8), repartir(dev, rng.lognormal(0, 0.7, n8))):
        facturas.append((d, "R", x))
facturas.sort(key=lambda t: (t[0], t[1]))
nv = nr = 0
for d, tipo, x in facturas:
    cli = random.choice(CLIENTES)
    if tipo == "V":
        nv += 1
        add(d, "70000001", f"Fra. V26-{nv:06d} {cli}", "COM", haber=x, grupo=f"VTA-{d.isoformat()}")
    else:
        nr += 1
        add(d, "70800001", f"Abono R26-{nr:05d} {cli} (devolución)", "COM", debe=x, grupo=f"VTA-{d.isoformat()}")

# --- Compras de mercaderías (600) con abonos de proveedores en el Haber ---
mg = rng.normal(0.275, 0.004, 10)
coste_mes = repartir(COSTE_TOTAL, [P5_MES[m][1] * (1 - mg[m - 1]) for m in range(1, 11)])
num_prov = {p[0]: 0 for p in PROVEEDORES}
media_net = VENTAS_NETAS / 10
for m in range(1, 11):
    abono = round(coste_mes[m - 1] * rng.uniform(0.008, 0.014), 2)
    debe = round(coste_mes[m - 1] + abono, 2)
    n6 = int(round(220 * P5_MES[m][1] / media_net))
    for d, x in zip(dias_al_azar(m, n6), repartir(debe, rng.lognormal(0, 1.0, n6))):
        cod, prov = PROVEEDORES[int(rng.integers(0, len(PROVEEDORES)))]
        num_prov[cod] += 1
        add(d, "60000001", f"Fra. {cod}-26/{num_prov[cod]:04d} {prov}", "ALM", debe=x)
    na = int(rng.integers(4, 9))
    for d, x in zip(dias_al_azar(m, na), repartir(abono, rng.lognormal(0, 0.6, na))):
        cod, prov = PROVEEDORES[int(rng.integers(0, len(PROVEEDORES)))]
        add(d, "60000001", f"Abono {prov} (rappel y devoluciones)", "ALM", haber=x)

# --- Personal: una nómina al mes con 8 líneas ---
PERS = {("COM", 640): 418300, ("COM", 642): 133950, ("ALM", 640): 401200, ("ALM", 642): 127300,
        ("ADM", 640): 154200, ("ADM", 642): 49380, ("DIR", 640): 124100, ("DIR", 642): 37720}
forma = {dep: rng.normal(1, 0.012, 10) for dep in ["COM", "ALM", "ADM", "DIR"]}
forma["ALM"][6] *= 1.04
forma["ALM"][8] *= 1.12
forma["ALM"][9] *= 1.13            # horas extra de la campaña de septiembre-octubre
for (dep, cta), total in PERS.items():
    for m, x in enumerate(repartir(total, forma[dep]), 1):
        txt = "Nómina" if cta == 640 else "Seguridad Social empresa"
        add(LAB[m][-1], f"{cta}00001", f"{txt} {MESES[m - 1]} 2026 · {dep}", dep, debe=x, grupo=f"NOM-{m}")


def serie(cuenta, cc, total, pesos, lineas, conceptos, sigma=0.6):
    for m, imp in enumerate(repartir(total, pesos), 1):
        n = lineas if isinstance(lineas, int) else lineas[m - 1]
        for d, x in zip(dias_al_azar(m, n), repartir(imp, rng.lognormal(0, sigma, n))):
            add(d, cuenta, random.choice(conceptos).format(mes=MESES[m - 1]), cc, debe=x)


PESO_VTAS = [P5_MES[m][1] for m in range(1, 11)]
# Arrendamientos (621) y el alquiler de Pamplona mal cargado en la 629
for m in range(1, 11):
    add(LAB[m][0], "62100001", f"Alquiler nave central Zaragoza · {MESES[m - 1]}", "ALM", debe=7000)
    add(LAB[m][0], "62100003", f"Alquiler almacén Lleida · {MESES[m - 1]}", "ALM", debe=1000)
    add(LAB[m][0], "62100010", f"Renting vehículos comerciales · {MESES[m - 1]}", "COM", debe=1494)
    if m <= 9:
        add(LAB[m][0], "62900001", f"Alquiler almacén Pamplona · {MESES[m - 1]}", "ALM", debe=2000)
    else:
        add(LAB[m][0], "62100002", "Alquiler almacén Pamplona · octubre", "ALM", debe=2000)
add(date(2026, 10, 30), "62100002", "Reclasificación alquiler almacén Pamplona ene-sep (estaba en la 629)", "ALM",
    debe=18000, grupo="RECLAS")
add(date(2026, 10, 30), "62900001", "Reclasificación alquiler almacén Pamplona ene-sep (pasa a la 621)", "ALM",
    haber=18000, grupo="RECLAS")
# Reparaciones (622): 14.600 repartidos + la carretilla de julio
serie("62200001", "ALM", 14600, [1] * 10, [3, 3, 4, 3, 4, 3, 3, 2, 4, 4],
      ["Mantenimiento estanterías almacén", "Reparación puerta muelle de carga", "Revisión carretillas",
       "Pequeñas reparaciones nave", "Mantenimiento climatización oficinas"])
add(date(2026, 7, 14), "62200001", "Reparación avería carretilla elevadora (motor)", "ALM", debe=4600)
# Profesionales (623)
for m in range(1, 11):
    add(LAB[m][2], "62300001", f"Asesoría laboral y fiscal · {MESES[m - 1]}", "ADM", debe=1650)
add(date(2026, 3, 18), "62300002", "Auditoría cuentas anuales 2025 (1.er pago)", "ADM", debe=7350)
add(date(2026, 10, 21), "62300002", "Auditoría cuentas anuales 2025 (2.º pago)", "ADM", debe=4900)
add(date(2026, 2, 19), "62300003", "Consultoría plan estratégico 2026-2028 (fase 1)", "DIR", debe=4200)
add(date(2026, 5, 20), "62300003", "Consultoría plan estratégico 2026-2028 (fase 2)", "DIR", debe=5300)
add(date(2026, 9, 17), "62300003", "Consultoría plan estratégico 2026-2028 (fase 3)", "DIR", debe=6400)
# Transportes (624): 101.500 de enero a octubre
alb = iter(range(2210, 9000, 7))
for m, imp in enumerate(repartir(101500, PESO_VTAS), 1):
    n = 28
    for d, x in zip(dias_al_azar(m, n), repartir(imp, rng.lognormal(0, 0.5, n))):
        add(d, "62400001", f"Portes {random.choice(TRANSPORTISTAS)} albarán {next(alb)}", "ALM", debe=x)
# Seguros (625): el año entero en enero
add(date(2026, 1, 15), "62500001", "Primas de seguros 2026 (multirriesgo y RC, anual)", "ADM", debe=14400)
# Servicios bancarios (626)
serie("62600001", "ADM", 8430, [1] * 10, 9,
      ["Comisión transferencias Banco Norte", "Comisión remesa de recibos", "Mantenimiento TPV",
       "Comisión póliza Banco Sur", "Comisión devolución de recibo"])
# Publicidad y ferias (627)
serie("62700001", "COM", 14500, [1] * 10, [2, 3, 3, 2, 3, 2, 2, 1, 3, 3],
      ["Campaña redes sociales · {mes}", "Catálogo 2026 (imprenta)", "Anuncio revista de instaladores",
       "Folletos promoción LED"])
add(date(2026, 3, 11), "62700002", "Feria regional de instaladores (stand)", "COM", debe=4100)
add(date(2026, 10, 7), "62700002", "Stand feria del sector · octubre (espacio y montaje)", "COM", debe=11200)
add(date(2026, 10, 9), "62700002", "Feria del sector · octubre (azafatas y catering)", "COM", debe=3600)
# Suministros (628)
for m, x in enumerate(repartir(33400, W_SUM[:10]), 1):
    add(LAB[m][4], "62800001", f"Electricidad nave y oficinas · {MESES[m - 1]}", "ALM", debe=x)
for m, x in zip([2, 4, 6, 8, 10], repartir(4550, [1, 1, 1.2, 1.3, 1])):
    add(LAB[m][6], "62800002", f"Agua · bimestre hasta {MESES[m - 1]}", "ALM", debe=x)
# Otros servicios (629)
serie("62900002", "COM", 33900, [1] * 10, 12,
      ["Dietas y kilometraje comerciales · {mes}", "Hotel visita clientes Huesca", "Hotel visita clientes Teruel",
       "Comida con cliente", "Peajes autopista comerciales"])
serie("62900001", "ADM", 19400, [1] * 10, 8,
      ["Material de oficina", "Mensajería urgente", "Telefonía e internet · {mes}", "Limpieza oficinas · {mes}"])
serie("62900002", "DIR", 11650, [1] * 10, 3,
      ["Viaje dirección a Pamplona", "Viaje dirección a Lleida", "Comida de trabajo con proveedor",
       "Viaje dirección a Madrid (asociación sectorial)"])
TAXIS = repartir(386.40, rng.lognormal(0, 0.4, 12))
for d, x in zip(sorted(rng.choice([d for m in range(1, 11) for d in LAB[m]], 12)), TAXIS):
    add(d, "62900003", random.choice(["Taxi aeropuerto", "Aparcamiento centro", "Taxi estación Delicias",
                                      "Aparcamiento visita cliente"]), "", debe=x)
for d, x, txt in [(date(2026, 9, 8), 4800, "Proyecto de reforma local Logroño"),
                  (date(2026, 9, 15), 1900, "Licencia de apertura Logroño (tasas)"),
                  (date(2026, 9, 24), 1700, "Selección de personal tienda Logroño"),
                  (date(2026, 10, 6), 3900, "Rotulación tienda Logroño"),
                  (date(2026, 10, 14), 4200, "Campaña de lanzamiento Logroño"),
                  (date(2026, 10, 20), 2300, "Mobiliario auxiliar y montaje Logroño"),
                  (date(2026, 10, 27), 1500, "Alquiler local Logroño octubre (carencia parcial)"),
                  (date(2026, 10, 29), 1000, "Limpieza fin de obra Logroño")]:
    add(d, "62900099", txt, "DIR", debe=x)
# Intereses (662): préstamo de P4 (cuotas 10-19) y póliza de Banco Sur
assert abs(round(ipmt(0.05 / 12, 19, 48, 85000), 2) - 229.56) < 0.005      # cuota 19 de P4
assert abs(round(ipmt(0.05 / 12, 20, 48, 85000), 2) - 222.36) < 0.005
assert abs(round(ipmt(0.05 / 12, 21, 48, 85000), 2) - 215.13) < 0.005
for k in range(10, 20):
    m = k - 9
    add(habil_desde(date(2026, m, 25)), "66200001", f"Intereses préstamo Banco Norte · cuota n.º {k}", "ADM",
        debe=round(ipmt(0.05 / 12, k, 48, 85000), 2))
for m in range(1, 11):
    add(LAB[m][-1], "66230001", f"Liquidación intereses póliza Banco Sur · {MESES[m - 1]}", "ADM",
        debe=round(float(rng.normal(3080, 90)), 2))
# Amortización (681): trimestral
for d, t in [(date(2026, 3, 31), "1.er"), (date(2026, 6, 30), "2.º"), (date(2026, 9, 30), "3.er")]:
    add(d, "68100001", f"Dotación amortización inmovilizado material · {t} trimestre", "ADM", debe=24000)

# --- Asientos: uno por día de facturación, uno por nómina, uno por línea en lo demás ---
D = pd.DataFrame(LINEAS)
D["grupo"] = [g if isinstance(g, str) else f"L{i:05d}" for i, g in enumerate(D.grupo)]
G = D.groupby("grupo").fecha.min().reset_index()
G["orden"] = rng.random(len(G))
G = G.sort_values(["fecha", "orden"]).reset_index(drop=True)
k = int(G.index[G.grupo == "RECLAS"][0])
huecos = rng.multinomial(4120 - (k + 1), [1 / (k + 1)] * (k + 1))          # asientos de bancos, etc.
lam = (4120 - (k + 1)) / (k + 1)
huecos = np.concatenate([huecos, rng.poisson(lam, len(G) - k - 1)])
G["num"] = np.cumsum(1 + huecos)
assert G.loc[k, "num"] == 4120
D = D.merge(G[["grupo", "num"]], on="grupo")
D["Asiento"] = D.num.map(lambda n: f"2026/{n:04d}")
D = D.sort_values(["fecha", "num", "cuenta"], kind="stable").reset_index(drop=True)
D["Cuenta3"] = D.cuenta.str[:3].astype(int)

# =====================================================================================
# 3. VERDAD LIMPIA (antes de ensuciar)
# =====================================================================================
LIMPIO = D.copy()
LIMPIO["Partida"] = np.where(LIMPIO.cuenta == "62900099", "Apertura Logroño",
                             LIMPIO.Cuenta3.map(lambda c: MAPA[c][2]))
LIMPIO["Tipo"] = LIMPIO.Cuenta3.map(lambda c: MAPA[c][3])
LIMPIO["Bloque"] = np.where(LIMPIO.cuenta == "62900099", "Otros gastos de explotación",
                            LIMPIO.Cuenta3.map(lambda c: MAPA[c][4]))
LIMPIO["Importe"] = np.where(LIMPIO.Tipo == "Gasto", LIMPIO.debe - LIMPIO.haber, LIMPIO.haber - LIMPIO.debe)
LIMPIO["CC"] = LIMPIO.cc.replace("", "Sin asignar")
real = LIMPIO.groupby(["Partida", "CC"]).Importe.sum().round(2)
assert round(LIMPIO[LIMPIO.Tipo == "Ingreso"].Importe.sum(), 2) == VENTAS_NETAS
assert real[("Transportes", "ALM")] == 101500 and real[("Seguros", "ADM")] == 14400
assert real[("Amortización", "ADM")] == 72000 and real[("Apertura Logroño", "DIR")] == 21300
assert real[("Otros servicios", "Sin asignar")] == 386.40
assert real[("Otros servicios", "ALM")] == 0 and real[("Arrendamientos", "ALM")] == 100000

# =====================================================================================
# 4. SUCIEDAD DEL DIARIO (Q09: CentroCoste vacío ×210)
# =====================================================================================
CSV_NOMBRE = os.path.basename(CSV_DIARIO)
vacios = []
for cta, n, cond in [("70000001", 160, D.haber > 0), ("60000001", 30, D.debe > 0), ("62400001", 8, D.debe > 0)]:
    idx = D.index[(D.cuenta == cta) & cond]
    vacios += list(rng.choice(idx, n, replace=False))
for i in vacios:
    log(CSV_NOMBRE, f"Asiento {D.at[i, 'Asiento']} · {D.at[i, 'concepto'][:30]}", "CentroCoste",
        "Q09 CentroCoste vacío (se asigna con Reparto_por_cuenta)", D.at[i, "cc"], D.at[i, "cc"])
    D.at[i, "cc"] = ""
for i in D.index[D.cuenta == "62900003"]:
    log(CSV_NOMBRE, f"Asiento {D.at[i, 'Asiento']} · {D.at[i, 'concepto']}", "CentroCoste",
        "Q09 CentroCoste vacío y la 629 no está en Reparto_por_cuenta", "", "Sin asignar")
assert (D.cc == "").sum() == 210
for i in D.index[(D.haber > 0) & D.Cuenta3.between(600, 699)]:
    if D.at[i, "cuenta"] != "60000001":
        log(CSV_NOMBRE, f"Asiento {D.at[i, 'Asiento']}", "Haber", "Q14 gasto en el Haber (reclasificación)",
            D.at[i, "haber"], -D.at[i, "haber"])
log(CSV_NOMBRE, "Cuenta 60000001", "Haber", "Q14 abonos de proveedores en el Haber (restan)",
    f"{int(((D.cuenta == '60000001') & (D.haber > 0)).sum())} líneas", "gasto = Debe − Haber")
log(CSV_NOMBRE, "Cuenta 70800001", "Debe", "Q14 devoluciones de ventas en el Debe (restan)",
    f"{int((D.cuenta == '70800001').sum())} líneas", "ingreso = Haber − Debe")
log(CSV_NOMBRE, "Cuenta 62900099", "Cuenta", "Q16 cuenta sin excepción en el mapeo (Logroño)", "629 → Otros servicios",
    "Apertura Logroño")
log(CSV_NOMBRE, "Cuenta 62500001", "Fecha", "Diferencia temporal: seguro anual en enero", 14400, "previsión 14.400")
log(CSV_NOMBRE, "Cuenta 68100001", "Fecha", "Diferencia temporal: amortización trimestral", 72000, "previsión 96.000")


def escribir_csv(df, ruta):
    with open(ruta, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";", lineterminator="\r\n")
        w.writerow(["Fecha", "Asiento", "Cuenta", "Concepto", "CentroCoste", "Debe", "Haber"])
        for r in df.itertuples():
            w.writerow([r.fecha.strftime("%d/%m/%Y"), r.Asiento, r.cuenta, r.concepto, r.cc,
                        f"{r.debe:.2f}".replace(".", ","), f"{r.haber:.2f}".replace(".", ",")])


escribir_csv(D, CSV_DIARIO)
# Cambio inesperado (18/11): la misma exportación con la factura de transporte de octubre que faltaba
nueva = dict(fecha=date(2026, 10, 31), cuenta="62400001",
             concepto="Fra. TME-2026/1187 Transportes Moncayo Express, S.L. · portes de octubre (registrada el 17/11)",
             cc="ALM", debe=9800.0, haber=0.0, grupo="CAMBIO", num=int(G.num.max()) + 63)
nueva["Asiento"] = f"2026/{nueva['num']:04d}"
nueva["Cuenta3"] = 624
D18 = pd.concat([D, pd.DataFrame([nueva])], ignore_index=True).sort_values(["fecha", "num"], kind="stable")
escribir_csv(D18, CSV_18NOV)

# =====================================================================================
# 5. LIBRO DE DATOS (presupuesto por pestañas, mapeo y reparto)
# =====================================================================================
wb = xlsxwriter.Workbook(DATOS_XLSX)
F = {
    "tit": wb.add_format({"bold": True, "font_size": 14, "font_color": "#1F4E79"}),
    "sub": wb.add_format({"bold": True, "font_size": 11, "font_color": "#1F4E79", "top": 1}),
    "txt": wb.add_format({"text_wrap": True, "valign": "top"}),
    "nota": wb.add_format({"italic": True, "font_color": "#595959"}),
    "comb": wb.add_format({"bold": True, "align": "center", "bg_color": "#DDEBF7", "border": 1}),
    "cab": wb.add_format({"bold": True, "bg_color": "#DDEBF7", "border": 1, "align": "center"}),
    "cabf": wb.add_format({"bold": True, "bg_color": "#DDEBF7", "border": 1, "align": "center",
                           "num_format": "mmm-yy"}),
    "num": wb.add_format({"num_format": "#,##0"}),
    "tot": wb.add_format({"num_format": "#,##0", "bold": True, "top": 1}),
    "tottxt": wb.add_format({"bold": True, "top": 1}),
    "subt": wb.add_format({"num_format": "#,##0", "italic": True, "bg_color": "#F2F2F2"}),
    "subtxt": wb.add_format({"italic": True, "bg_color": "#F2F2F2"}),
    "txtder": wb.add_format({"align": "right"}),
}
ins = wb.add_worksheet("Instrucciones")
ins.set_column("A:A", 112, F["txt"])
ins_lineas = [
    ("tit", "P7 · Presupuesto frente a real y previsión de cierre"),
    ("txt", "Electro Cierzo Suministros, S.L. (empresa ficticia) · Control de gestión · Encargo de Marta Ruiz, "
            "directora financiera · Datos de enero a octubre de 2026 · Consejo del 20/11/2026"),
    ("sub", "Qué tienes que conseguir"),
    ("txt", "El presupuesto contra real de enero a octubre por partida y departamento, con las desviaciones que "
            "importan explicadas, una previsión de cierre de 2026 con escenarios y una página para el consejo. "
            "Antes, una auditoría del libro que usaba Paco Gil en 2025 (p7-control-2025-paco.xlsx)."),
    ("sub", "Qué hay en este libro"),
    ("txt", "• Ingresos, Comercial, Almacén y logística, Administración y Dirección: el presupuesto 2026 que aprobó "
            "el consejo, tal como lo hizo cada departamento. Importes en euros, sin IVA, en positivo (las "
            "devoluciones de ventas van en negativo). Cada pestaña es de un departamento: Ingresos y Comercial → "
            "COM; Almacén y logística → ALM; Administración → ADM; Dirección → DIR."),
    ("txt", "• Mapeo_cuentas: de cada cuenta de 3 dígitos del Plan General de Contabilidad, la partida del "
            "informe, si es ingreso o gasto y el bloque de la cuenta de resultados."),
    ("txt", "• Reparto_por_cuenta: a qué centro de coste va una cuenta cuando el apunte llega sin centro."),
    ("sub", "Los otros archivos"),
    ("txt", "• p7-diario-2026-ene-oct.csv: el extracto de contabilidad de los grupos 6 y 7 (gastos e ingresos) "
            "de enero a octubre. UTF-8, separador «;», coma decimal, fechas DD/MM/AAAA. Columnas: Fecha, "
            "Asiento, Cuenta (8 dígitos), Concepto, CentroCoste (COM, ALM, ADM, DIR), Debe, Haber. Impórtalo "
            "con Datos > Obtener datos > De archivo > De texto/CSV (Origen del archivo: 65001: Unicode (UTF-8))."),
    ("txt", "• p7-control-2025-paco.xlsx: el libro de control de 2025 que hizo Paco Gil. Ábrelo con cuidado "
            "(si Excel pregunta por vínculos, elige no actualizar) y no lo uses como base sin auditarlo."),
    ("txt", "• p7-diario-2026-ene-oct-18nov.csv: NO lo abras hasta el último hito (cambio inesperado)."),
    ("sub", "Lo que ha pactado Marta (aclaraciones)"),
    ("txt", "• Desviación = Real − Presupuesto, acumulada de enero a octubre. En gastos, positiva = desfavorable "
            "(D); en ingresos, negativa = desfavorable. Importa si |desv.| ≥ 5 % y ≥ 3.000 €, las dos cosas. "
            "• Detalle: partida × departamento; el detalle por cuenta, en otra hoja. • Previsión: real de enero "
            "a octubre + presupuesto de noviembre y diciembre; escenarios de ventas de noviembre y diciembre −8 %, "
            "0 % y +4 % con el margen constante, y Logroño con +6.500 €/mes de gastos. • Seguro anual (enero) y "
            "amortización trimestral: diferencia temporal; en la previsión, el importe del año. • Cuentas sin "
            "mapeo (Logroño): partida nueva «Apertura Logroño», fuera de presupuesto. • Dirección: el total anual "
            "en doceavas partes. • Financieros de noviembre y diciembre: intereses del préstamo de Banco Norte "
            "(85.000 € al 5 %, 48 cuotas; noviembre es la cuota 20) más 3.100 €/mes de la póliza de Banco Sur."),
    ("sub", "Hitos"),
    ("txt", "1. Auditar el libro de Paco (8 errores). 2. Presupuesto en formato largo con Power Query. 3. Real "
            "desde el CSV (cuenta de 3 dígitos, signo, mes, centro de coste). 4. Mapeo con excepciones (0 cuentas "
            "sin partida). 5. Informe de desviaciones (F/D, ¿importa?, naturaleza). 6. Diferencias temporales. "
            "7. Previsión, escenarios y Buscar objetivo. 8. Gráfico de cascada del EBITDA. 9. Página para el "
            "consejo (A4 horizontal). 10. Controles, Léame y correo. 11. Cambio inesperado (18/11)."),
    ("sub", "Cómo comprobar tu trabajo"),
    ("txt", "El presupuesto largo debe sumar 9.480.000 € de ventas netas y 9.173.000 € de gastos (resultado "
            "307.000 €). El real por partidas debe cuadrar con el diario (Σ Haber − Σ Debe). Ninguna cuenta puede "
            "quedarse sin partida. La suma por departamentos (incluido «Sin asignar») debe dar el total. En la "
            "página del proyecto tienes los totales de control."),
    ("nota", "Todos los datos son inventados. Fecha de la ficción: lunes 16/11/2026."),
]
for i, (est, t) in enumerate(ins_lineas):
    ins.write(i, 0, t, F[est])

MES_TXT = [m.capitalize() for m in MESES]
for nombre, dep, ntit, fmt, filas, subt, total_txt, vacia in PESTANAS:
    ws = wb.add_worksheet(nombre)
    ws.set_column("A:A", 26)
    ws.set_column("B:B", 40)
    ws.set_column("C:O", 11)
    ncol = 1 if fmt == "anual" else 13
    ultima = 2 + ncol - 1
    titulos = ["ELECTRO CIERZO SUMINISTROS, S.L.", f"Presupuesto 2026 · {nombre}",
               "Aprobado por el consejo el 15/12/2025 · euros sin IVA"]
    for t in range(ntit - 1):
        ws.write(t, 0, titulos[t], F["tit"] if t == 0 else F["nota"])
    if fmt == "anual":
        ws.merge_range(ntit - 1, 0, ntit - 1, ultima, "Dirección general · solo total anual", F["comb"])
    else:
        ws.merge_range(ntit - 1, 2, ntit - 1, 13, "Importes mensuales (€)", F["comb"])
    log("p7-datos.xlsx", f"{nombre}!fila {ntit}", "-", "Q11 títulos y fila combinada antes del encabezado",
        f"{ntit} filas", "Quitar filas superiores")
    h = ntit
    ws.write(h, 0, "Cuenta", F["cab"])
    ws.write(h, 1, "Descripción", F["cab"])
    if fmt == "anual":
        ws.write(h, 2, "Total anual 2026", F["cab"])
    else:
        for j in range(12):
            if fmt == "fecha":
                ws.write_datetime(h, 2 + j, pd.Timestamp(2026, j + 1, 1).to_pydatetime(), F["cabf"])
            elif fmt == "texto":
                ws.write(h, 2 + j, MES_TXT[j], F["cab"])
            else:
                ws.write_number(h, 2 + j, j + 1, F["cab"])
        ws.write(h, 14, "Total", F["cab"])
        log("p7-datos.xlsx", f"{nombre}!fila {h + 1}", "meses", "Mes con formato propio de la pestaña", fmt,
            "número de mes 1-12 (tabla Meses)")
    r = h + 1
    primera = r
    filas_datos = {}
    for c3, desc, imp in filas:
        ws.write_number(r, 0, c3)
        ws.write(r, 1, desc)
        vals = [imp] if fmt == "anual" else imp
        for j, x in enumerate(vals):
            if nombre == "Administración":
                ws.write_string(r, 2 + j, es_num(x), F["txtder"])
            else:
                ws.write_number(r, 2 + j, x, F["num"])
        if fmt != "anual":
            if nombre == "Administración":
                ws.write_string(r, 14, es_num(sum(imp)), F["txtder"])
            else:
                ws.write_formula(r, 14, f"=SUM(C{r + 1}:N{r + 1})", F["num"], sum(imp))
        filas_datos[c3] = (r, vals)
        r += 1
        if subt and c3 == subt[-1]:
            ws.write(r, 0, "Total servicios exteriores", F["subtxt"])
            ws.write(r, 1, "", F["subtxt"])
            r0, r1 = filas_datos[subt[0]][0] + 1, filas_datos[subt[-1]][0] + 1
            for j in range(ncol + (0 if fmt == "anual" else 1)):
                col = xlsxwriter.utility.xl_col_to_name(2 + j)
                val = sum((filas_datos[c][1][j] if j < 12 else sum(filas_datos[c][1])) for c in subt)
                ws.write_formula(r, 2 + j, f"=SUM({col}{r0}:{col}{r1})", F["subt"], val)
            log("p7-datos.xlsx", f"{nombre}!fila {r + 1}", "Cuenta", "Q10 subtotal entre los datos",
                "Total servicios exteriores", "filtrar (la Cuenta no es numérica)")
            r += 1
    ult = r
    if vacia:
        r += 1
    ws.write(r, 0, total_txt, F["tottxt"])
    ws.write(r, 1, "", F["tottxt"])
    filas_sin_sub = [filas_datos[c][0] + 1 for c, _, _ in filas]
    for j in range(ncol + (0 if fmt == "anual" else 1)):
        col = xlsxwriter.utility.xl_col_to_name(2 + j)
        refs = ",".join(f"{col}{x}" for x in filas_sin_sub)
        if nombre == "Administración":
            val = 0                                     # SUMA de textos = 0
        else:
            val = sum(((filas_datos[c][1][j] if j < 12 else sum(filas_datos[c][1])) for c, _, _ in filas))
        ws.write_formula(r, 2 + j, f"=SUM({refs})", F["tot"], val)
    log("p7-datos.xlsx", f"{nombre}!fila {r + 1}", "Cuenta", "Q10 fila TOTAL al final", total_txt,
        "filtrar (la Cuenta no es numérica)")
    if nombre == "Administración":
        log("p7-datos.xlsx", "Administración!C4:O11", "importes", "Q05 números guardados como texto",
            "«16.500,00» (texto)", "número con configuración regional es-ES")
    if fmt == "anual":
        log("p7-datos.xlsx", "Dirección!C4:C7", "Total anual 2026", "Solo total anual", "importe del año",
            "repartir en doceavas partes")
    ws.freeze_panes(h + 1, 2)

ws = wb.add_worksheet("Mapeo_cuentas")
ws.set_column("A:A", 10)
ws.set_column("B:B", 46)
ws.set_column("C:C", 30)
ws.set_column("D:D", 9)
ws.set_column("E:E", 30)
for j, t in enumerate(["Cuenta3", "Descripción PGC", "Partida", "Tipo", "Bloque"]):
    ws.write(0, j, t, F["cab"])
for i, (c3, desc, part, tipo, bloque) in enumerate(MAPEO, 1):
    ws.write_number(i, 0, c3)
    ws.write_row(i, 1, [desc, part, tipo, bloque])
log("p7-datos.xlsx", "Mapeo_cuentas!A2:A17", "Cuenta3", "Q16 trampa de tipos: Cuenta3 es número",
    "640 (número)", "IZQUIERDA devuelve «640» (texto): convertir con VALOR")
log("p7-datos.xlsx", "Mapeo_cuentas", "-", "Q16 falta la excepción de 8 dígitos 62900099", "",
    "tabla Excepciones: 62900099 → Apertura Logroño")
ws = wb.add_worksheet("Reparto_por_cuenta")
ws.set_column("A:B", 13)
ws.set_column("C:C", 52)
for j, t in enumerate(["Cuenta3", "CentroCoste", "Motivo"]):
    ws.write(0, j, t, F["cab"])
for i, (c3, cc, mot) in enumerate(REPARTO, 1):
    ws.write_number(i, 0, c3)
    ws.write_row(i, 1, [cc, mot])
ws.write(len(REPARTO) + 2, 0, "Si la cuenta no está en esta tabla y el apunte no trae centro, va a «Sin asignar».",
         F["nota"])
wb.close()

# =====================================================================================
# 6. EL LIBRO HEREDADO DE PACO (control de 2025) CON 8 ERRORES
# =====================================================================================
PARTIDAS25 = ["Ventas netas", "Coste de ventas", "Personal", "Arrendamientos", "Reparaciones", "Profesionales",
              "Transportes", "Seguros", "Servicios bancarios", "Publicidad", "Suministros", "Otros servicios",
              "Gastos financieros"]                                         # columnas B..N de Real_2025
CTA25 = [(700, "Ventas netas"), (708, "Ventas netas"), (600, "Coste de ventas"), (640, "Personal"),
         (642, "Personal"), (621, "Arrendamientos"), (622, "Reparaciones"), (623, "Profesionales"),
         (624, "Transportes"), (625, "Seguros"), (626, "Servicios bancarios"), (627, "Publicidad"),
         (628, "Suministros"), (629, "Otros servicios"), (681, "Amortización"), (662, "Gastos financieros")]
v25_ene_oct = 7267737.91                       # ventas netas ene-oct 2025 de P5 (Ventas_2025_resumen)
w = np.array(W_VENTAS)
neto25 = repartir(v25_ene_oct / w[:10].sum(), w)
dev25 = [round(x * 0.021, 2) for x in neto25]
d25 = []
for m in range(1, 13):
    vn = neto25[m - 1]
    pers = 133200 * float(rng.normal(1, 0.01)) + (13820 if m == 3 else 0)     # marzo: atrasos del convenio
    filas25 = {700: vn + dev25[m - 1], 708: -dev25[m - 1], 600: vn * (1 - float(rng.normal(0.279, 0.003))),
               640: pers * 0.76, 642: pers * 0.24, 621: 10850, 622: 1275 * float(rng.uniform(0.6, 1.4)),
               623: 3925 * float(rng.uniform(0.8, 1.2)), 624: 116900 / 12 * float(rng.uniform(0.85, 1.15)),
               625: 13800 if m == 1 else 0, 626: 762.5 * float(rng.uniform(0.85, 1.15)),
               627: 2283 * float(rng.uniform(0.5, 1.5)), 628: 3358 * float(rng.uniform(0.85, 1.2)),
               629: 7808 * float(rng.uniform(0.85, 1.15)), 681: 23000 if m % 3 == 0 else 0,
               662: (ipmt(0.05 / 12, m - 3, 48, 85000) if m >= 4 else 0) + float(rng.normal(2900, 80))}
    for c3, part in CTA25:
        d25.append([m, c3, part, round(filas25[c3], 2), ""])
REG = [12, 600, "Coste de ventas", 21600.0, "Regularización de existencias de diciembre (anotada el 19/01/2026)"]
D25 = pd.DataFrame(d25, columns=["Mes", "Cuenta3", "Partida", "Importe", "Nota"])
D25_todo = pd.concat([D25, pd.DataFrame([REG], columns=D25.columns)], ignore_index=True)
N25 = len(D25_todo) + 1                         # última fila con datos (con la regularización)
piv_ok = D25_todo.pivot_table(index="Mes", columns="Partida", values="Importe", aggfunc="sum").fillna(0)
piv_old = D25.pivot_table(index="Mes", columns="Partida", values="Importe", aggfunc="sum").fillna(0)

PPTO25 = {"Ventas netas": 8900000, "Coste de ventas": 6408000, "Personal": 1580000, "Arrendamientos": 132000,
          "Reparaciones": 16000, "Profesionales": 48000, "Transportes": 118000, "Seguros": 13800,
          "Servicios bancarios": 9000, "Publicidad": 28000, "Suministros": 39000, "Otros servicios": 96000,
          "Amortización": 92000, "Gastos financieros": 36000}
FILAS_INF = ["Ventas netas", "Coste de ventas", "Personal", "Arrendamientos", "Reparaciones", "Profesionales",
             "Transportes", "Seguros", "Servicios bancarios", "Publicidad", "Suministros", "Otros servicios",
             "Total servicios exteriores", "Amortización", "Gastos financieros", "Total gastos", "Resultado"]
SERV = FILAS_INF[3:12]

# Valores que se presentaron (caché): E1, E2, E6 y E8 (sin la regularización)
col25 = {p: xlsxwriter.utility.xl_col_to_name(1 + i) for i, p in enumerate(PARTIDAS25)}
present_mes = piv_old[PARTIDAS25].copy()
present_mes.loc[3, "Personal"] = 142000.0                               # E2
tot_present = present_mes.sum()
tot_present["Transportes"] = present_mes.loc[1:11, "Transportes"].sum()   # E1
pres = {p: round(float(tot_present[p]), 2) for p in PARTIDAS25}
pres["Total servicios exteriores"] = round(sum(pres[p] for p in SERV), 2)
pres["Amortización"] = 0.0                                                 # E6
pres["Total gastos"] = round(sum(pres[p] for p in FILAS_INF[1:15]), 2)     # E4 (incluye el subtotal)
pres["Resultado"] = round(pres["Ventas netas"] - pres["Coste de ventas"] - pres["Personal"]
                          - pres["Total servicios exteriores"] - pres["Amortización"]
                          - pres["Gastos financieros"], 2)
# Valores correctos
tot_ok = piv_ok.sum()
ok = {p: round(float(tot_ok[p]), 2) for p in PARTIDAS25 + ["Amortización"]}
ok["Total servicios exteriores"] = round(sum(ok[p] for p in SERV), 2)
ok["Total gastos"] = round(ok["Coste de ventas"] + ok["Personal"] + ok["Total servicios exteriores"]
                           + ok["Amortización"] + ok["Gastos financieros"], 2)
ok["Resultado"] = round(ok["Ventas netas"] - ok["Total gastos"], 2)
pp = dict(PPTO25)
pp["Total servicios exteriores"] = sum(PPTO25[p] for p in SERV)
pp["Total gastos"] = sum(pp[p] for p in FILAS_INF[1:15])                   # E4 también en el presupuesto
pp["Resultado"] = pp["Ventas netas"] - pp["Coste de ventas"] - pp["Personal"] - pp["Total servicios exteriores"] \
    - pp["Amortización"] - pp["Gastos financieros"]
efectos = {
    "E1": round(float(piv_old.loc[12, "Transportes"]), 2),
    "E2": round(float(piv_old.loc[3, "Personal"]) - 142000, 2),
    "E6": ok["Amortización"],
    "E8": 21600.0,
}
assert abs(pres["Resultado"] - ok["Resultado"] - sum(efectos.values())) < 0.02

wb = xlsxwriter.Workbook(PACO)
wb.set_calc_mode("manual")                                                  # E8
FP = {"tit": wb.add_format({"bold": True, "font_size": 13}),
      "cab": wb.add_format({"bold": True, "bg_color": "#FCE4D6", "border": 1}),
      "num": wb.add_format({"num_format": "#,##0"}),
      "pct": wb.add_format({"num_format": "0.0%"}),
      "tot": wb.add_format({"num_format": "#,##0", "bold": True, "top": 1}),
      "nota": wb.add_format({"italic": True, "font_color": "#7F7F7F"})}
inf = wb.add_worksheet("Informe")
rea = wb.add_worksheet("Real_2025")
dat = wb.add_worksheet("Datos_2025")
notas = wb.add_worksheet("Notas")
# Datos_2025
dat.write_row(0, 0, ["Mes", "Cuenta3", "Partida", "Importe", "Nota"], FP["cab"])
for i, r in enumerate(D25_todo.itertuples(index=False), 1):
    dat.write_number(i, 0, r.Mes)
    dat.write_number(i, 1, r.Cuenta3)
    dat.write(i, 2, r.Partida)
    dat.write_number(i, 3, r.Importe, FP["num"])
    if r.Nota:
        dat.write(i, 4, r.Nota)
dat.set_column("C:C", 20)
dat.set_column("E:E", 62)
# Real_2025
rea.write(0, 0, "Real 2025 por meses (sale de Datos_2025)", FP["tit"])
rea.write(3, 0, "Mes", FP["cab"])
for i, p in enumerate(PARTIDAS25):
    rea.write(3, 1 + i, p, FP["cab"])
for m in range(1, 13):
    r = 3 + m
    rea.write_number(r, 0, m)
    for i, p in enumerate(PARTIDAS25):
        c = col25[p]
        if p == "Personal" and m == 3:
            rea.write_number(r, 1 + i, 142000, FP["num"])                    # E2
        else:
            rea.write_formula(r, 1 + i, f"=SUMIFS(Datos_2025!$D$2:$D${N25},Datos_2025!$A$2:$A${N25},$A{r + 1},"
                                        f"Datos_2025!$C$2:$C${N25},{c}$4)", FP["num"], float(piv_old.loc[m, p]))
rea.write(16, 0, "Total", FP["tot"])
for i, p in enumerate(PARTIDAS25):
    c = col25[p]
    fin = 15 if p == "Transportes" else 16                                    # E1
    rea.write_formula(16, 1 + i, f"=SUM({c}5:{c}{fin})", FP["tot"], pres[p])
rea.set_column("A:A", 7)
rea.set_column("B:N", 13)
# Informe
inf.write(0, 0, "Control presupuestario 2025 · Electro Cierzo Suministros", FP["tit"])
inf.write(1, 0, "Preparado por P. Gil · presentado al consejo el 22/01/2026", FP["nota"])
inf.write_row(3, 0, ["Partida", "Real 2025", "Presupuesto 2025", "Desviación", "Desv. %"], FP["cab"])
ext_rows = {}
for i, p in enumerate(FILAS_INF):
    r = 4 + i                                                                  # fila Excel = r + 1
    R = r + 1
    es_tot = p in ("Total servicios exteriores", "Total gastos", "Resultado")
    fm = FP["tot"] if es_tot else FP["num"]
    inf.write(r, 0, p, FP["tot"] if es_tot else None)
    if p in PARTIDAS25:
        inf.write_formula(r, 1, f"=Real_2025!{col25[p]}17", fm, pres[p])
    elif p == "Total servicios exteriores":
        inf.write_formula(r, 1, "=SUM(B8:B16)", fm, pres[p])
    elif p == "Amortización":
        inf.write_formula(r, 1, "=IFERROR(Real_2025!#REF!,0)", fm, 0)       # E6
    elif p == "Total gastos":
        inf.write_formula(r, 1, "=SUM(B6:B19)", fm, pres[p])                  # E4
    else:
        inf.write_formula(r, 1, "=B5-B6-B7-B17-B18-B19", fm, pres[p])
    # Presupuesto 2025: vínculo externo (E7)
    if p in PPTO25:
        inf.write_formula(r, 2, f"=[1]Ppto!$N${R}", fm, PPTO25[p])
        ext_rows[R] = PPTO25[p]
    elif p == "Total servicios exteriores":
        inf.write_formula(r, 2, "=SUM(C8:C16)", fm, pp[p])
    elif p == "Total gastos":
        inf.write_formula(r, 2, "=SUM(C6:C19)", fm, pp[p])                    # E4
    else:
        inf.write_formula(r, 2, "=C5-C6-C7-C17-C18-C19", fm, pp[p])
    real_b = pres[p] if p != "Amortización" else 0
    if p == "Ventas netas":
        inf.write_formula(r, 3, "=C5-B5", fm, pp[p] - real_b)                 # E5
        inf.write_formula(r, 4, "=D5/C5", FP["pct"], (pp[p] - real_b) / pp[p])
    else:
        inf.write_formula(r, 3, f"=B{R}-C{R}", fm, real_b - pp[p])
        inf.write_formula(r, 4, f"=D{R}/C$5", FP["pct"], (real_b - pp[p]) / pp["Ventas netas"])   # E3
inf.set_column("A:A", 28)
inf.set_column("B:D", 15)
inf.set_column("E:E", 10)
notas.set_column("A:A", 100)
for i, t in enumerate(["Notas de Paco (para quien venga detrás)",
                       "Cada mes: pegar el mayor resumido en Datos_2025 y pulsar F9 para que se actualice.",
                       "El presupuesto lo saca de presupuesto_2025.xlsx (carpeta de Marta).",
                       "14/01/2026: he quitado columnas que no se usaban en Real_2025 para que quepa en una hoja.",
                       "19/01/2026: metida la regularización de existencias de diciembre en Datos_2025.",
                       "Personal de marzo: puesto a mano lo que me pasó la gestoría."]):
    notas.write(i, 0, t, FP["tit"] if i == 0 else None)
wb.close()


def poner_vinculo_externo(ruta, celdas):
    """Añade al .xlsx el vínculo externo [1] → presupuesto_2025.xlsx (hoja Ppto) con los últimos valores."""
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(ruta) as z:
        z.extractall(tmp)
        nombres = z.namelist()
    filas = "".join(f'<row r="{r}"><cell r="N{r}"><v>{v}</v></cell></row>' for r, v in sorted(celdas.items()))
    os.makedirs(os.path.join(tmp, "xl", "externalLinks", "_rels"), exist_ok=True)
    with open(os.path.join(tmp, "xl", "externalLinks", "externalLink1.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                '<externalLink xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<externalBook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'r:id="rId1"><sheetNames><sheetName val="Ppto"/></sheetNames><sheetDataSet>'
                f'<sheetData sheetId="0">{filas}</sheetData></sheetDataSet></externalBook></externalLink>')
    with open(os.path.join(tmp, "xl", "externalLinks", "_rels", "externalLink1.xml.rels"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'
                'externalLinkPath" Target="presupuesto_2025.xlsx" TargetMode="External"/></Relationships>')
    p = os.path.join(tmp, "xl", "_rels", "workbook.xml.rels")
    s = open(p, encoding="utf-8").read()
    s = s.replace("</Relationships>", '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/'
                  'officeDocument/2006/relationships/externalLink" Target="externalLinks/externalLink1.xml"/>'
                  "</Relationships>")
    open(p, "w", encoding="utf-8").write(s)
    p = os.path.join(tmp, "xl", "workbook.xml")
    s = open(p, encoding="utf-8").read()
    s = s.replace("</sheets>", '</sheets><externalReferences><externalReference r:id="rId99"/></externalReferences>', 1)
    open(p, "w", encoding="utf-8").write(s)
    p = os.path.join(tmp, "[Content_Types].xml")
    s = open(p, encoding="utf-8").read()
    s = s.replace("</Types>", '<Override PartName="/xl/externalLinks/externalLink1.xml" ContentType="application/'
                  'vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml"/></Types>')
    open(p, "w", encoding="utf-8").write(s)
    os.remove(ruta)
    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for n in nombres + ["xl/externalLinks/externalLink1.xml", "xl/externalLinks/_rels/externalLink1.xml.rels"]:
            z.write(os.path.join(tmp, n), n)
    shutil.rmtree(tmp)


poner_vinculo_externo(PACO, ext_rows)

# =====================================================================================
# 7. LOG Y VERDAD
# =====================================================================================
for e, (ub, txt) in {"E1": ("Real_2025!H17", "SUMA sin diciembre"), "E2": ("Real_2025!D7", "valor fijo 142.000"),
                     "E3": ("Informe!E6:E21", "=D6/C$5"), "E4": ("Informe!B20:C20", "SUMA con el subtotal"),
                     "E5": ("Informe!D5", "=C5-B5"), "E6": ("Informe!B18", "SI.ERROR con #¡REF!"),
                     "E7": ("Informe!C5:C19", "vínculo a presupuesto_2025.xlsx"),
                     "E8": ("Libro", "cálculo manual")}.items():
    log("p7-control-2025-paco.xlsx", ub, e, "Error sembrado en el libro heredado", txt, efectos.get(e, 0))
with open(LOG, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["archivo", "ubicacion", "columna", "problema", "valor_original", "valor_limpio"])
    w.writerows(LOGS)

verdad = {
    "lineas_diario": int(len(D)), "lineas_18nov": int(len(D18)), "cc_vacios": 210,
    "ventas_netas": VENTAS_NETAS, "coste_ventas": COSTE_TOTAL,
    "resultado_real": round(float(D.haber.sum() - D.debe.sum()), 2),
    "real_partida_cc": {f"{p}|{c}": float(v) for (p, c), v in real.items()},
    "ppto_bloques": {k: float(v) for k, v in b.items()},
    "paco": {"presentado": pres, "correcto": ok, "ppto": pp, "efectos": efectos},
    "asiento_reclasificacion": "2026/4120",
}
json.dump(verdad, open(VERDAD, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("Líneas del diario:", len(D), "· asientos:", D.Asiento.nunique(), "· vacíos CC:", (D.cc == "").sum())
print("Resultado real ene-oct (Haber − Debe):", verdad["resultado_real"])
print("Paco: presentado", pres["Resultado"], "· correcto", ok["Resultado"], "· efectos", efectos)

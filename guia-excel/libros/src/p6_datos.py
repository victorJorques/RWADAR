# -*- coding: utf-8 -*-
"""
P6 · Stock, punto de pedido y clasificación ABC (Compras y almacén) · DATOS DE PARTIDA
====================================================================================

Genera (lo que recibe la alumna):
  libros/p6-datos.xlsx         Instrucciones, inventario del 30/04, fichas de artículos,
                               proveedores, recuento del 31/10 y una copia en texto del CSV
  libros/p6-movimientos.csv    movimientos de mayo a octubre de 2026 tal como salen del ERP
                               (UTF-8 con BOM, separador «;», coma decimal)
y para la solución (NO se entrega):
  libros/src/p6-log-suciedad.csv   cada problema sembrado (archivo, fila, columna, problema,
                                   valor original, valor limpio)
  libros/src/p6-verdad.json        los datos LIMPIOS «verdaderos» (stock final, movimientos
                                   únicos, etc.) para que p6_solucion.py compruebe su limpieza

Empresa ficticia: Electro Cierzo Suministros, S.L. (Zaragoza; delegaciones en Pamplona y
Lleida). Encargo de Andrés Molina, jefe de compras y almacén. Todo es inventado.

CÓMO SE GENERAN (research/proyectos.md §3.6: primero lo limpio, después la suciedad)
1. Catálogo de 180 artículos de stock en 6 familias (los mismos proveedores que P1: Arnedo,
   Elecvía, Tormes y Yesa, más Luzaide y Cinca). Código de 6 cifras con ceros a la izquierda.
2. Consumo en valor con una lognormal (ley de Pareto: ~20 % de los artículos hacen ~80 % del
   valor) y estacionalidad (agosto a la baja).
3. Simulación diaria del 04/05/2026 al 30/10/2026 (lunes a viernes; festivos nacionales
   01/05 y 12/10) con la política «a ojo» que se usaba hasta ahora: pedir cuando queda poco,
   siempre la misma cantidad. Así sale lo que cuenta Andrés: lo que más se vende se agota y
   lo que no sale llena el almacén. Las ventas no pueden dejar el stock en negativo.
4. Devoluciones de clientes (DEV), devoluciones a proveedor (DPR), regularizaciones (REG+ y
   REG-) y traspasos entre almacenes (TRA, dos líneas con neto 0).
5. 12 artículos «muertos» (sin salidas desde antes del 02/08/2026 y con stock): 4 sin ninguna
   salida en todo el periodo y 8 con la última salida entre mayo y el 31/07. Un artículo
   frontera vende por última vez el 03/08 (89 días: NO está muerto).

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5)
- Q03 Falsos duplicados: 16 artículos están en dos ubicaciones del inventario (196 filas =
      180 artículos). Son legítimos: hay que SUMARLOS, no quitarlos.
- Q13 Códigos sin ceros: 22 filas del inventario tienen el código como número (731 en vez de
      «000731»). Cuatro de ellas son la ubicación de reserva de un artículo doble. Si no se
      arreglan, esos artículos pierden su inventario inicial y varios salen con stock negativo
      (el número exacto queda en p6-verdad.json).
- Q22 Solape de extracciones: el CSV es la suma de las extracciones mensuales y la de agosto
      empieza el 31/07, que ya estaba en la de julio: 63 filas repetidas (misma clave
      Documento + Línea), todas del 31/07.
- Q07 Fechas en otro formato: la extracción de agosto (incluidas sus 63 filas del 31/07)
      trae las fechas como AAAA-MM-DD; el resto, DD/MM/AAAA.
- Q08 Tipo mal escrito: «SAL», «Salida» (terminal de Pamplona) y «salida » (con espacio).
- Q14 Signo incoherente: el ERP graba las cantidades en positivo y el signo lo da el tipo,
      pero 40 líneas SAL llevan la cantidad en negativo.
- Q05 Número con punto decimal: las líneas de cable con decimales grabadas en Lleida traen
      «12.5» en vez de «12,5».
- Q16 Maestro incompleto: 3 artículos del inventario y de los movimientos no tienen ficha.
- Q09 Vacíos: 5 fichas sin PlazoEntrega (se usa el plazo habitual del proveedor).
- Recuento del 31/10: 10 artículos; 8 cuadran con el stock teórico y 2 no: el downlight
      LED-0412, -3 ud (rotura conocida), y un cable RZ1-K, -12,5 m (recorte).
"""
import csv
import json
import math
import os
from datetime import date, timedelta

import numpy as np
import pandas as pd
import xlsxwriter

SEMILLA = 20261116
rng = np.random.default_rng(SEMILLA)

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
XLSX = os.path.join(LIBROS, "p6-datos.xlsx")
CSV = os.path.join(LIBROS, "p6-movimientos.csv")
LOG = os.path.join(AQUI, "p6-log-suciedad.csv")
VERDAD = os.path.join(AQUI, "p6-verdad.json")

# ---------------------------------------------------------------------------
# 1. Calendario
# ---------------------------------------------------------------------------
INICIO, FIN = date(2026, 5, 4), date(2026, 10, 30)          # semanas ISO 19 a 44
FESTIVOS = [date(2026, 5, 1), date(2026, 10, 12)]           # fiestas nacionales fijas
DIAS = []
x = INICIO
while x <= FIN:
    if x.weekday() < 5 and x not in FESTIVOS:
        DIAS.append(x)
    x += timedelta(days=1)
assert len(DIAS) == 129
ESTACION = {5: 1.10, 6: 1.10, 7: 1.00, 8: 0.60, 9: 1.10, 10: 1.10}
PESO_DIA = np.array([ESTACION[d.month] for d in DIAS])
PESO_DIA = PESO_DIA / PESO_DIA.sum()
CORTE = date(2026, 10, 31)
LIMITE_MUERTO = CORTE - timedelta(days=90)                   # 02/08/2026

# ---------------------------------------------------------------------------
# 2. Proveedores y catálogo (descripción, unidad, coste €, proveedor, lote mín., múltiplo)
# ---------------------------------------------------------------------------
PROVEEDORES = [  # proveedor, plazo habitual (días laborables), correo de pedidos (ficticio)
    ("Arnedo", 3, "pedidos@arnedo.example"),
    ("Cinca", 4, "pedidos@cinca.example"),
    ("Elecvía", 5, "pedidos@elecvia.example"),
    ("Luzaide", 6, "pedidos@luzaide.example"),
    ("Tormes", 2, "pedidos@tormes.example"),
    ("Yesa", 7, "pedidos@yesa.example"),
]
PLAZO_PROV = {p: l for p, l, _ in PROVEEDORES}

CAT = []  # (familia, descripción, unidad, coste, proveedor, lote, múltiplo)


def a(fam, desc, ud, coste, prov, lote, mult):
    CAT.append((fam, desc, ud, coste, prov, lote, mult))


# Cable (30)
for sec, c in [("1,5", 0.21), ("2,5", 0.31)]:
    for col in ["azul", "marrón", "negro", "gris", "amarillo-verde"]:
        a("Cable", f"Cable H07Z1-K {sec} mm² {col}", "m", c, "Tormes", 500, 100)
for sec, c in [("4", 0.52), ("6", 0.69)]:
    for col in ["azul", "marrón", "negro"]:
        a("Cable", f"Cable H07Z1-K {sec} mm² {col}", "m", c, "Tormes", 200, 100)
for t, c in [("3G1,5", 0.78), ("3G2,5", 1.12), ("3G4", 1.65), ("3G6", 2.35), ("5G2,5", 1.85), ("5G6", 3.90), ("5G10", 6.10)]:
    a("Cable", f"Cable RZ1-K 0,6/1 kV {t} mm²", "m", c, "Tormes", 200, 100)
a("Cable", "Manguera RV-K 0,6/1 kV 3G2,5 mm²", "m", 1.05, "Tormes", 200, 100)
a("Cable", "Manguera RV-K 0,6/1 kV 4G6 mm²", "m", 3.10, "Tormes", 200, 100)
a("Cable", "Cable coaxial 75 Ω (rollo 100 m)", "rollo", 38.50, "Elecvía", 5, 5)
a("Cable", "Cable UTP Cat 6 LSZH (caja 305 m)", "caja", 89.00, "Elecvía", 2, 1)
for sec, c in [("10", 1.15), ("16", 1.80), ("25", 2.75)]:
    a("Cable", f"Cable ES07Z1-K {sec} mm² amarillo-verde", "m", c, "Elecvía" if sec != "10" else "Tormes", 100, 100)

# Iluminación (40)
for w, c in [(12, 6.90), (18, 8.90), (24, 12.50)]:
    for k in (3000, 4000):
        ref = " (ref. LED-0412)" if (w, k) == (18, 4000) else ""
        a("Iluminación", f"Downlight LED {w} W {k} K{ref}", "ud", c, "Luzaide", 20, 10)
for k in (3000, 4000, 6000):
    a("Iluminación", f"Panel LED 60x60 40 W {k} K", "ud", 18.90, "Luzaide", 8, 4)
a("Iluminación", "Panel LED 120x30 40 W 4000 K", "ud", 24.00, "Luzaide", 8, 4)
for w, k, c in [(20, 4000, 9.80), (20, 6000, 9.80), (50, 4000, 18.50), (50, 6000, 18.50), (100, 4000, 34.90), (150, 6000, 52.00)]:
    a("Iluminación", f"Proyector LED {w} W IP65 {k} K", "ud", c, "Elecvía", 4, 2)
for w, c in [(100, 62.00), (150, 85.00), (200, 108.00)]:
    a("Iluminación", f"Campana industrial LED {w} W", "ud", c, "Luzaide", 2, 1)
for w, c in [(9, 1.45), (12, 1.95), (15, 2.90)]:
    for k in (2700, 4000):
        a("Iluminación", f"Lámpara LED E27 {w} W {k} K", "ud", c, "Luzaide", 50, 10)
for w, k, c in [(5, 3000, 1.10), (7, 3000, 1.60), (7, 4000, 1.60)]:
    a("Iluminación", f"Lámpara LED GU10 {w} W {k} K", "ud", c, "Luzaide", 50, 10)
for k in (3000, 4000, 6000):
    a("Iluminación", f"Tira LED 24 V 14,4 W/m {k} K (rollo 5 m)", "rollo", 14.50, "Elecvía", 10, 5)
for w, c in [(60, 18.00), (100, 26.50), (150, 39.00)]:
    a("Iluminación", f"Fuente de alimentación LED 24 V {w} W", "ud", c, "Elecvía", 5, 1)
a("Iluminación", "Pantalla estanca LED 1x36 W IP65", "ud", 16.80, "Luzaide", 10, 5)
a("Iluminación", "Pantalla estanca LED 2x36 W IP65", "ud", 21.50, "Luzaide", 10, 5)
a("Iluminación", "Aplique LED exterior 10 W", "ud", 12.40, "Luzaide", 6, 2)
a("Iluminación", "Baliza LED 7 W", "ud", 15.80, "Luzaide", 6, 2)
a("Iluminación", "Emergencia LED 300 lm", "ud", 21.90, "Elecvía", 6, 1)
a("Iluminación", "Emergencia LED 100 lm", "ud", 14.30, "Elecvía", 6, 1)

# Mecanismos (35), serie Alba
for col in ["blanco", "antracita", "plata"]:
    a("Mecanismos", f"Interruptor simple serie Alba {col}", "ud", {"blanco": 2.40, "antracita": 2.90, "plata": 3.10}[col], "Cinca", 20, 10)
    a("Mecanismos", f"Conmutador serie Alba {col}", "ud", {"blanco": 2.70, "antracita": 3.20, "plata": 3.40}[col], "Cinca", 20, 10)
    a("Mecanismos", f"Base de enchufe schuko serie Alba {col}", "ud", {"blanco": 3.20, "antracita": 3.70, "plata": 3.90}[col], "Cinca", 20, 10)
    a("Mecanismos", f"Marco 1 elemento serie Alba {col}", "ud", {"blanco": 1.10, "antracita": 1.40, "plata": 1.60}[col], "Cinca", 20, 10)
    a("Mecanismos", f"Marco 2 elementos serie Alba {col}", "ud", {"blanco": 1.80, "antracita": 2.20, "plata": 2.50}[col], "Cinca", 20, 10)
a("Mecanismos", "Cruzamiento serie Alba blanco", "ud", 4.60, "Cinca", 10, 10)
for col, c in [("blanco", 3.40), ("antracita", 3.90)]:
    a("Mecanismos", f"Pulsador timbre serie Alba {col}", "ud", c, "Cinca", 10, 10)
    a("Mecanismos", f"Toma TV-R/SAT serie Alba {col}", "ud", c + 2.20, "Cinca", 10, 10)
    a("Mecanismos", f"Toma RJ45 Cat 6 serie Alba {col}", "ud", c + 4.50, "Cinca", 10, 10)
    a("Mecanismos", f"Marco 3 elementos serie Alba {col}", "ud", c - 0.60, "Cinca", 20, 10)
    a("Mecanismos", f"Regulador LED serie Alba {col}", "ud", 24.90, "Elecvía", 4, 1)
    a("Mecanismos", f"Detector de presencia serie Alba {col}", "ud", 19.50, "Elecvía", 4, 1)
a("Mecanismos", "Caja de empotrar universal (caja de 50)", "caja", 9.50, "Elecvía", 5, 1)
a("Mecanismos", "Caja de empotrar doble (caja de 25)", "caja", 11.20, "Elecvía", 5, 1)
a("Mecanismos", "Clema 3 vías (caja de 100)", "caja", 18.00, "Elecvía", 5, 1)
a("Mecanismos", "Borne de conexión rápida 3 polos (caja de 100)", "caja", 29.00, "Elecvía", 2, 1)
a("Mecanismos", "Base de superficie estanca IP55", "ud", 6.80, "Cinca", 10, 5)
a("Mecanismos", "Interruptor estanco IP55", "ud", 7.40, "Cinca", 10, 5)
a("Mecanismos", "Termostato digital", "ud", 34.00, "Elecvía", 2, 1)

# Protección (35)
for amp, c in [(10, 6.80), (16, 6.80), (20, 7.20), (25, 8.40), (32, 9.50)]:
    a("Protección", f"Magnetotérmico 1P+N {amp} A 6 kA", "ud", c, "Cinca", 12, 12)
for amp, c in [(16, 13.00), (25, 14.60), (32, 17.20), (40, 21.00)]:
    a("Protección", f"Magnetotérmico 2P {amp} A 6 kA", "ud", c, "Cinca", 6, 6)
for amp, c in [(16, 48.00), (25, 54.00), (40, 71.00), (63, 95.00)]:
    a("Protección", f"Magnetotérmico 4P {amp} A 10 kA", "ud", c, "Arnedo", 3, 1)
a("Protección", "Diferencial 2P 25 A 30 mA clase AC", "ud", 21.80, "Cinca", 4, 2)
a("Protección", "Diferencial 2P 40 A 30 mA clase AC", "ud", 22.50, "Cinca", 4, 2)
a("Protección", "Diferencial 2P 40 A 30 mA clase A", "ud", 38.90, "Cinca", 4, 2)
a("Protección", "Diferencial superinmunizado 2P 40 A 30 mA", "ud", 58.00, "Arnedo", 2, 1)
a("Protección", "Diferencial 4P 40 A 30 mA clase A", "ud", 89.00, "Arnedo", 2, 1)
a("Protección", "Diferencial 4P 63 A 300 mA clase A", "ud", 125.00, "Arnedo", 2, 1)
a("Protección", "Protector sobretensiones transitorias 2P", "ud", 42.00, "Arnedo", 2, 1)
a("Protección", "Protector sobretensiones permanentes y transitorias 2P", "ud", 96.00, "Arnedo", 2, 1)
a("Protección", "Limitador de sobretensiones tipo 1+2", "ud", 145.00, "Arnedo", 2, 1)
for n, c in [(4, 8.50), (8, 12.90), (12, 17.40), (24, 34.00), (36, 62.00)]:
    a("Protección", f"Cuadro de superficie {n} módulos", "ud", c, "Cinca", 4, 2)
for n, c in [(12, 18.00), (24, 31.00), (36, 48.00)]:
    a("Protección", f"Cuadro de empotrar {n} módulos", "ud", c, "Cinca", 4, 2)
a("Protección", "Contactor modular 25 A 2NA", "ud", 24.00, "Arnedo", 2, 1)
a("Protección", "Interruptor horario digital", "ud", 39.00, "Arnedo", 2, 1)
for amp in (10, 16):
    a("Protección", f"Fusible cilíndrico 10x38 {amp} A (caja de 10)", "caja", 4.20 if amp == 10 else 4.40, "Arnedo", 5, 1)
a("Protección", "Base portafusibles 10x38 1P", "ud", 3.10, "Arnedo", 12, 12)

# Canalización (25)
for dmm, c in [(16, 9.80), (20, 13.90), (25, 18.50), (32, 27.00)]:
    a("Canalización", f"Tubo corrugado reforzado M{dmm} (rollo 100 m)", "rollo", c, "Yesa", 10, 5)
for dmm, c in [(20, 2.10), (25, 2.90), (32, 4.10)]:
    a("Canalización", f"Tubo rígido PVC M{dmm} (barra 3 m)", "ud", c, "Yesa", 50, 25)
for s, c in [("16x16", 0.95), ("25x40", 1.95), ("40x60", 3.90), ("60x100", 7.40)]:
    a("Canalización", f"Canaleta PVC {s} (tramo 2 m)", "ud", c, "Yesa", 20, 10)
for s, c in [("60x100", 14.50), ("60x200", 19.80), ("60x300", 26.40)]:
    a("Canalización", f"Bandeja perforada {s} (tramo 3 m)", "ud", c, "Arnedo", 5, 1)
for w, c in [(100, 7.90), (200, 11.50)]:
    a("Canalización", f"Tapa bandeja {w} (tramo 3 m)", "ud", c, "Arnedo", 5, 1)
for s, c in [("100x100", 0.86), ("150x110", 2.10), ("220x170", 4.95)]:
    a("Canalización", f"Caja de registro estanca {s} IP55", "ud", c, "Yesa", 25, 25)
for l, c in [(140, 1.10), (200, 2.30), (300, 4.20)]:
    a("Canalización", f"Bridas de nailon {l} mm (caja de 100)", "caja", c, "Arnedo", 10, 10)
a("Canalización", "Abrazadera para tubo M20 (caja de 100)", "caja", 6.50, "Yesa", 5, 1)
a("Canalización", "Tubo flexible metálico M20", "m", 1.85, "Yesa", 50, 25)
a("Canalización", "Manguito de unión M20 (caja de 50)", "caja", 4.30, "Yesa", 5, 1)

# Herramienta (15)
for desc, c in [("Crimpadora de terminales", 24.50), ("Pelacables automático", 18.90), ("Comprobador de tensión bipolar", 32.00),
                ("Multímetro digital", 39.00), ("Pinza amperimétrica", 54.00), ("Juego de destornilladores aislados 1000 V (7 piezas)", 46.00),
                ("Alicate universal aislado", 14.20), ("Alicate de corte aislado", 15.80), ("Tijera de electricista", 12.50),
                ("Guía pasacables 15 m", 16.40), ("Taladro percutor 18 V", 129.00), ("Detector de cables", 28.50),
                ("Nivel láser de líneas", 89.00), ("Linterna frontal LED", 17.90)]:
    a("Herramienta", desc, "ud", c, "Arnedo", 2, 1)
a("Herramienta", "Cinta aislante PVC 19 mm (caja de 10)", "caja", 6.80, "Arnedo", 10, 5)

assert len(CAT) == 180, len(CAT)
art = pd.DataFrame(CAT, columns=["Familia", "Descripcion", "Unidad", "Coste", "Proveedor", "LoteMin", "Multiplo"])
assert art["Descripcion"].is_unique
assert all(r.LoteMin % r.Multiplo == 0 for r in art.itertuples())

# Códigos: 6 cifras con ceros a la izquierda (000100-019999), ordenados por familia
cods = np.sort(rng.choice(np.arange(100, 20000), 180, replace=False))
orden_fam = {"Cable": 0, "Iluminación": 1, "Mecanismos": 2, "Protección": 3, "Canalización": 4, "Herramienta": 5}
art["_o"] = art["Familia"].map(orden_fam)
art = art.sort_values(["_o"], kind="stable").reset_index(drop=True)
art["Cod"] = [f"{c:06d}" for c in cods]
art = art.drop(columns="_o")

# Plazo real por artículo: casi siempre el habitual del proveedor; el 20 %, más largo
plazo = []
for r in art.itertuples():
    base = PLAZO_PROV[r.Proveedor]
    plazo.append(base + (int(rng.integers(1, 4)) if rng.random() < 0.20 else 0))
art["Plazo"] = plazo

# ---------------------------------------------------------------------------
# 3. Consumo previsto (Pareto) y artículos especiales
# ---------------------------------------------------------------------------
MUERTOS_SIN_VENTA = ["Campana industrial LED 200 W", "Limitador de sobretensiones tipo 1+2",
                     "Nivel láser de líneas", "Panel LED 120x30 40 W 4000 K"]
MUERTOS_HASTA_JULIO = ["Proyector LED 150 W IP65 6000 K", "Diferencial 4P 63 A 300 mA clase A",
                       "Magnetotérmico 4P 63 A 10 kA", "Cuadro de empotrar 36 módulos", "Taladro percutor 18 V",
                       "Termostato digital", "Bandeja perforada 60x300 (tramo 3 m)", "Cable RZ1-K 0,6/1 kV 5G10 mm²"]
MUERTO_31_07 = "Cuadro de empotrar 36 módulos"        # su última salida es el 31/07 (fila duplicada)
FRONTERA = "Fuente de alimentación LED 24 V 150 W"     # última salida el 03/08: 89 días, NO muerto
MUERTOS = MUERTOS_SIN_VENTA + MUERTOS_HASTA_JULIO
for n in MUERTOS + [FRONTERA]:
    assert n in set(art["Descripcion"]), n

peso_fam = {"Cable": 2.2, "Iluminación": 1.3, "Mecanismos": 0.8, "Protección": 1.4, "Canalización": 0.9, "Herramienta": 0.5}
# los artículos baratos de uso diario (cable fino, mecanismos blancos, magnetotérmicos 1P+N…) venden
# más que los caros y especiales (4P, campanas, herramienta): penalización por coste dentro de la familia
med_fam = art.groupby("Familia")["Coste"].transform("median").values
puntos = (np.log(art["Familia"].map(peso_fam).values) - 0.45 * np.log(art["Coste"].values / med_fam)
          + rng.gumbel(0, 0.7, 180))
VALOR_26S = 3_000_000.0                                   # consumo a coste en las 26 semanas (€)
v = np.sort(rng.lognormal(0, 1.85, 180))[::-1]
v = v / v.sum() * VALOR_26S
orden = np.argsort(-puntos)
valor = np.empty(180)
valor[orden] = v
art["ValorPlan"] = valor
esp = art["Descripcion"].isin(MUERTOS + [FRONTERA])
# los especiales venden poco: se les da el valor de los más pequeños y lo que sobra se reparte
pequenos = np.sort(valor)[:len(MUERTOS) + 1]
art.loc[esp, "ValorPlan"] = rng.permutation(pequenos)
art.loc[~esp, "ValorPlan"] *= (VALOR_26S - art.loc[esp, "ValorPlan"].sum()) / art.loc[~esp, "ValorPlan"].sum()
art["UdsPlan"] = art["ValorPlan"] / art["Coste"]
rango = art["ValorPlan"].rank(ascending=False)
art["Tramo"] = np.where(rango <= 36, "alto", np.where(rango <= 90, "medio", "bajo"))


def granulo(ud):
    return 0.5 if ud == "m" else 1.0


def redondea(q, ud, minimo=True):
    g = granulo(ud)
    if ud == "m":
        # en cable se vende por metros enteros y, una de cada cinco líneas, con medio metro
        q = math.floor(q) + (0.5 if rng.random() < 0.2 else 0.0)
    else:
        q = float(round(q))
    return max(g, q) if minimo else max(0.0, q)


# ---------------------------------------------------------------------------
# 4. Simulación diaria con la política antigua («a ojo»)
# ---------------------------------------------------------------------------
movs = []        # dict(Fecha, Tipo, Cod, Cantidad (con signo real), Almacen)
inv0 = {}
pend = {}        # Cod -> (cantidad, fecha prevista)
IDX = {d: i for i, d in enumerate(DIAS)}
ALM_PESOS = (["ZGZ", "PAM", "LLE"], [0.60, 0.25, 0.15])
DIAS_EXTRA = [date(2026, 11, 2) + timedelta(days=i) for i in range(30)]
DIAS_EXTRA = [d for d in DIAS_EXTRA if d.weekday() < 5]


def dia_mas(d, n):
    lista = DIAS + DIAS_EXTRA
    return lista[lista.index(d) + n]


LINEAS_SAL = 8500
SIN_PEDIDOS = date(2026, 10, 19)
def _lineas(kk):
    return sum(max(3, round(kk * (vv / 1000.0) ** 0.62)) for vv in art["ValorPlan"])
lo_, hi_ = 0.1, 50.0
for _ in range(60):
    mid = (lo_ + hi_) / 2
    lo_, hi_ = (mid, hi_) if _lineas(mid) < LINEAS_SAL else (lo_, mid)
LIN_K = (lo_ + hi_) / 2

for r in art.itertuples():
    ud = r.Unidad
    d_plan = r.UdsPlan / 129.0
    nombre = r.Descripcion
    # número de líneas de venta: crece con el valor, pero menos que proporcional
    n_lin = int(max(3, round(LIN_K * (r.ValorPlan / 1000.0) ** 0.62)))
    if nombre in MUERTOS_SIN_VENTA:
        n_lin = 0
    q_base = r.UdsPlan / max(n_lin, 1)
    if ud != "m" and q_base < 1:
        n_lin = max(1, int(round(r.UdsPlan)))
        q_base = r.UdsPlan / max(n_lin, 1)
    if nombre in MUERTOS_SIN_VENTA:
        n_lin = 0
    pesos = PESO_DIA.copy()
    if nombre in MUERTOS_HASTA_JULIO:
        corte = date(2026, 7, 31) if nombre == MUERTO_31_07 else DIAS[int(rng.integers(5, 55))]
        pesos = np.array([p if d <= corte else 0.0 for p, d in zip(PESO_DIA, DIAS)])
        pesos /= pesos.sum()
    dias_v = sorted(rng.choice(len(DIAS), n_lin, p=pesos)) if n_lin else []
    if nombre == MUERTO_31_07 and n_lin:
        dias_v[-1] = IDX[date(2026, 7, 31)]
    if nombre == FRONTERA:
        dias_v = [i for i in dias_v if DIAS[i] < date(2026, 8, 3)] + [IDX[date(2026, 8, 3)]]
    if nombre not in MUERTOS and nombre != FRONTERA and n_lin and DIAS[max(dias_v)] < date(2026, 8, 10):
        dias_v[-1] = int(rng.integers(IDX[date(2026, 9, 1)], 129))
        dias_v = sorted(dias_v)
    ventas = {}
    for i in dias_v:
        q = redondea(q_base * rng.lognormal(-0.18, 0.6), ud)
        ventas.setdefault(i, []).append(q)

    # política antigua
    if r.Tramo == "alto":
        f_s, cob_q, cob0 = rng.uniform(0.8, 1.5), rng.uniform(20, 45), rng.uniform(15, 40)
    elif r.Tramo == "medio":
        f_s, cob_q, cob0 = rng.uniform(0.8, 1.5), rng.uniform(35, 80), rng.uniform(50, 130)
    else:
        f_s, cob_q, cob0 = rng.uniform(1.0, 2.0), rng.uniform(250, 600), rng.uniform(650, 1300)
    if nombre in MUERTOS:
        cob0 = 0
    urgente = rng.random() < 0.45
    s_hist = f_s * d_plan * r.Plazo
    q_hist = max(r.LoteMin, math.ceil(cob_q * d_plan / r.Multiplo) * r.Multiplo)
    stock = redondea(cob0 * d_plan, ud, minimo=False)
    if nombre in MUERTOS:
        stock = float(round(rng.uniform(5800, 7400) / r.Coste))   # unos 6.600 € inmovilizados
    if ud == "m":
        stock = round(stock * 2) / 2
    inv0[r.Cod] = stock
    llegadas = {}   # índice de día -> cantidad
    diferidos = {}  # índice de día -> movimientos DEV/DPR que se aplican ese día
    pedido_abierto = None
    for i, dia in enumerate(DIAS):
        if i in llegadas:
            q, resto = llegadas.pop(i)
            stock += q
            movs.append(dict(Fecha=dia, Tipo="ENT", Cod=r.Cod, Cant=q, Alm="ZGZ"))
            if resto:   # entregas parciales del mismo pedido
                q2 = resto[0]
                llegadas[min(128, i + int(rng.integers(1, 3)))] = (q2, resto[1:])
                if i + 1 >= 129:
                    pass
            else:
                pedido_abierto = None
            # devolución a proveedor de parte de lo recibido (defectos), 3,5 % de las recepciones
            if rng.random() < 0.035 and i + 3 < 129:
                qd = max(granulo(ud), float(round(q * rng.uniform(0.02, 0.08))))
                j = i + int(rng.integers(1, 4))
                diferidos.setdefault(j, []).append(dict(Fecha=DIAS[j], Tipo="DPR", Cod=r.Cod, Cant=-qd, Alm="ZGZ"))
        for m in diferidos.pop(i, []):
            if m["Tipo"] == "DPR":
                m["Cant"] = -min(-m["Cant"], stock)
                if m["Cant"] == 0:
                    continue
            stock += m["Cant"]
            movs.append(m)
        for q in ventas.get(i, []):
            if stock <= 0:
                continue                      # rotura: la venta se pierde
            q = min(q, stock)
            stock -= q
            alm = rng.choice(ALM_PESOS[0], p=ALM_PESOS[1])
            movs.append(dict(Fecha=dia, Tipo="SAL", Cod=r.Cod, Cant=-q, Alm=alm))
            # devolución de cliente de parte de la venta en la misma semana ISO
            if rng.random() < 0.035:
                j = i + int(rng.integers(1, 4))
                if j < 129 and DIAS[j].isocalendar()[1] == dia.isocalendar()[1]:
                    qd = max(granulo(ud), float(math.floor(q * rng.uniform(0.1, 0.5) / granulo(ud)) * granulo(ud)))
                    qd = min(qd, q)
                    diferidos.setdefault(j, []).append(dict(Fecha=DIAS[j], Tipo="DEV", Cod=r.Cod, Cant=qd, Alm=alm))
        # pedir «a ojo» cuando queda poco (posición = stock + lo pendiente)
        posicion = stock + (pedido_abierto or 0)
        # hasta ahora se pedía los lunes y los jueves, «cuando quedaba poco»; desde el 19/10
        # solo se han lanzado los pedidos urgentes que pedían las delegaciones (por eso falta
        # lo que más se vende)
        if nombre not in MUERTOS and pedido_abierto is None and posicion <= s_hist and dia.weekday() in (0, 3) and (dia < SIN_PEDIDOS or urgente):
            lleg = i + r.Plazo + int(rng.integers(0, 2))
            pedido_abierto = q_hist
            partes = [q_hist]
            if q_hist >= 4 * r.Multiplo and rng.random() < 0.6:     # el proveedor sirve en 2 o 3 entregas
                n_p = int(rng.integers(2, 4))
                base_p = math.floor(q_hist / n_p / r.Multiplo) * r.Multiplo
                partes = [base_p] * (n_p - 1) + [q_hist - base_p * (n_p - 1)]
            if lleg + 4 < 129:
                llegadas[lleg] = (partes[0], partes[1:])
            else:
                pend[r.Cod] = (q_hist, dia_mas(DIAS[i], r.Plazo + 1))

mov = pd.DataFrame(movs)
mov = mov[mov["Cant"] != 0].copy()

# Regularizaciones (REG+ / REG-) y traspasos (TRA) sobre la serie ya simulada
tray_dia = {}
for cod in art["Cod"]:
    g = mov[mov["Cod"] == cod]
    neto_dia = g.groupby("Fecha")["Cant"].sum()
    tray_dia[cod] = inv0[cod] + np.cumsum([neto_dia.get(d, 0.0) for d in DIAS])
extra = []
cods_reg = rng.choice(art["Cod"].values, 70, replace=True)
ud_por_cod = dict(zip(art["Cod"], art["Unidad"]))
for k, cod in enumerate(cods_reg):
    ud = ud_por_cod[cod]
    i = int(rng.integers(0, 129))
    q = float(rng.integers(1, 4)) if ud != "m" else float(rng.integers(1, 11)) / 2
    if k % 2 == 0:
        extra.append(dict(Fecha=DIAS[i], Tipo="REG+", Cod=cod, Cant=q, Alm="ZGZ"))
        tray_dia[cod][i:] += q
    elif tray_dia[cod][i:].min() >= q:       # una REG- nunca deja el stock en negativo
        extra.append(dict(Fecha=DIAS[i], Tipo="REG-", Cod=cod, Cant=-q, Alm="ZGZ"))
        tray_dia[cod][i:] -= q
mov = pd.concat([mov, pd.DataFrame(extra)], ignore_index=True)
tras = []
for k in range(100):
    cod = rng.choice(art["Cod"].values)
    ud = ud_por_cod[cod]
    dia = DIAS[int(rng.integers(0, 129))]
    q = float(rng.integers(2, 25)) if ud != "m" else float(rng.integers(2, 20) * 10)
    destino = rng.choice(["PAM", "LLE"])
    ida = rng.random() < 0.85
    o, de = ("ZGZ", destino) if ida else (destino, "ZGZ")
    tras.append(dict(Fecha=dia, Tipo="TRA", Cod=cod, Cant=-q, Alm=o, _tra=k))
    tras.append(dict(Fecha=dia, Tipo="TRA", Cod=cod, Cant=q, Alm=de, _tra=k))
mov = pd.concat([mov, pd.DataFrame(tras)], ignore_index=True)

# 63 filas el 31/07 (para el solape exacto): se ajusta con ventas del 30/07 (se retrasan un día)
# o del 31/07 (se retrasan al 03/08), nunca de los artículos especiales.
D3007, D3107, D0308 = date(2026, 7, 30), date(2026, 7, 31), date(2026, 8, 3)
protegidos = set(art.loc[art["Descripcion"].isin(MUERTOS + [FRONTERA]), "Cod"])
n31 = int((mov["Fecha"] == D3107).sum())
if n31 < 63:
    cand = mov[(mov["Fecha"] == D3007) & (mov["Tipo"] == "SAL") & ~mov["Cod"].isin(protegidos)].index
    mov.loc[rng.choice(cand, 63 - n31, replace=False), "Fecha"] = D3107
elif n31 > 63:
    cand = mov[(mov["Fecha"] == D3107) & (mov["Tipo"] == "SAL") & ~mov["Cod"].isin(protegidos)].index
    mov.loc[rng.choice(cand, n31 - 63, replace=False), "Fecha"] = D0308
assert (mov["Fecha"] == D3107).sum() == 63

# comprobaciones de la verdad: nunca stock negativo
mov["_ord"] = mov["Tipo"].map({"ENT": 0, "DEV": 1, "REG+": 1, "TRA": 2, "SAL": 3, "DPR": 4, "REG-": 4})
mov = mov.sort_values(["Fecha", "_ord", "Cod"], kind="stable").reset_index(drop=True)
for cod, g in mov.groupby("Cod"):
    tray = inv0[cod] + g.loc[g["Tipo"] != "TRA", "Cant"].cumsum()
    assert tray.empty or tray.min() >= -1e-9, (cod, tray.min())
fin = {c: inv0[c] + mov.loc[(mov["Cod"] == c) & (mov["Tipo"] != "TRA"), "Cant"].sum() for c in art["Cod"]}
ult = mov[mov["Tipo"] == "SAL"].groupby("Cod")["Fecha"].max()
muertos_reales = sorted(c for c in art["Cod"] if fin[c] > 0 and (c not in ult.index or ult[c] < LIMITE_MUERTO))
esperados = sorted(art.loc[art["Descripcion"].isin(MUERTOS), "Cod"])
assert muertos_reales == esperados, ([art.set_index("Cod").at[c, "Descripcion"] for c in set(muertos_reales) ^ set(esperados)])
cod_frontera = art.loc[art["Descripcion"] == FRONTERA, "Cod"].iloc[0]
assert ult[cod_frontera] == date(2026, 8, 3) and fin[cod_frontera] > 0

# ---------------------------------------------------------------------------
# 5. Documentos y líneas (clave Documento + Línea)
# ---------------------------------------------------------------------------
PREF = {"SAL": "ALB", "ENT": "REC", "DEV": "DEV", "DPR": "DPR", "REG+": "REG", "REG-": "REG", "TRA": "TRA"}
contador = {p: int(rng.integers(1000, 3000)) for p in sorted(set(PREF.values()))}
doc, lin = [None] * len(mov), [None] * len(mov)
for (f, t, al), g in mov.groupby(["Fecha", "Tipo", "Alm"], sort=True):
    if t == "TRA":
        continue
    idx = list(g.index)
    rng.shuffle(idx)
    while idx:
        tam = int(rng.integers(1, 6)) if t == "SAL" else int(rng.integers(1, 4))
        trozo, idx = idx[:tam], idx[tam:]
        p = PREF[t]
        contador[p] += 1
        for n, k in enumerate(sorted(trozo), start=1):
            doc[k], lin[k] = f"{p}-26-{contador[p]:06d}", n
for k_tra, g in mov[mov["Tipo"] == "TRA"].groupby("_tra"):
    contador["TRA"] += 1
    for n, k in enumerate(sorted(g.index, key=lambda z: mov.at[z, "Cant"]), start=1):
        doc[k], lin[k] = f"TRA-26-{contador['TRA']:06d}", n
mov["Documento"], mov["Linea"] = doc, lin
assert mov["Documento"].notna().all()
assert not mov.duplicated(["Documento", "Linea"]).any()
USUARIOS = {"ZGZ": ["ZGZ-ALM1", "ZGZ-ALM2", "ZGZ-MOST1"], "PAM": ["PAM-MOST1"], "LLE": ["LLE-MOST1"]}
mov["Usuario"] = [USUARIOS[a_][int(rng.integers(0, len(USUARIOS[a_])))] for a_ in mov["Alm"]]
mov = mov.sort_values(["Fecha", "Documento", "Linea"]).reset_index(drop=True)

# ---------------------------------------------------------------------------
# 6. Elegir los artículos de las trampas y del recuento
# ---------------------------------------------------------------------------
cod_de = dict(zip(art["Descripcion"], art["Cod"]))
desc_de = dict(zip(art["Cod"], art["Descripcion"]))
ud_de = dict(zip(art["Cod"], art["Unidad"]))
sin_ficha = ["Cable coaxial 75 Ω (rollo 100 m)", "Linterna frontal LED", "Abrazadera para tubo M20 (caja de 100)"]
COD_SIN_FICHA = [cod_de[n] for n in sin_ficha]

LED = cod_de["Downlight LED 18 W 4000 K (ref. LED-0412)"]
CABLE_REC = cod_de["Cable RZ1-K 0,6/1 kV 3G2,5 mm²"]
# Ubicaciones dobles (Q03): 16 artículos que no sean especiales
cand_doble = [c for c in art["Cod"] if c not in protegidos and c not in COD_SIN_FICHA and c not in (LED, CABLE_REC)]
DOBLES = list(rng.choice(cand_doble, 16, replace=False))

# Códigos como número (Q13): 22 filas. Si no se arreglan, esos artículos pierden su inventario inicial
# al buscarlo por el código de 6 cifras y varios quedan en negativo (la lista va a p6-verdad.json).
neto = {c: fin[c] - inv0[c] for c in art["Cod"]}
# reparto del stock del 30/04 entre las dos ubicaciones (la segunda es la de reserva)
reparto = {}
for c in DOBLES:
    f = rng.uniform(0.25, 0.45)
    s2 = round(inv0[c] * f * 2) / 2 if ud_de[c] == "m" else float(round(inv0[c] * f))
    reparto[c] = (inv0[c] - s2, s2)
libres = [c for c in art["Cod"] if c not in DOBLES and c not in protegidos and c not in COD_SIN_FICHA
          and c not in (LED, CABLE_REC)]
NUM_DOBLE = list(rng.choice([c for c in DOBLES], 4, replace=False))       # su fila de reserva va como número
NUM_SIMPLE = list(rng.choice(libres, 18, replace=False))
COD_NUM_ART = NUM_SIMPLE + NUM_DOBLE        # 22 artículos con una fila como número
# si no se arreglan, el stock de estos artículos pierde las filas del inventario que van como número
NEG_SI_NO = sorted(c for c in COD_NUM_ART
                   if (fin[c] - (reparto[c][1] if c in reparto else inv0[c])) < -1e-9)

# Recuento: 8 que cuadran (cada uno tocado por alguna trampa) + LED y cable que no
cable_lle = mov[(mov["Tipo"] == "SAL") & (mov["Alm"] == "LLE") & (mov["Cant"] % 1 != 0)]["Cod"].value_counts()
REC = []
REC.append([c for c in cable_lle.index if c not in (CABLE_REC,) and c not in DOBLES and c not in COD_NUM_ART][0])   # Q05
REC.append(NUM_SIMPLE[0])                                                  # Q13
REC.append([c for c in DOBLES if c not in NUM_DOBLE and c not in REC][0])  # Q03
dia31 = mov[(mov["Fecha"] == D3107) & (mov["Tipo"] == "SAL")]["Cod"].value_counts()
REC.append([c for c in dia31.index if c not in REC and c not in protegidos and c not in (LED, CABLE_REC)][0])   # Q22
tra_cods = mov[mov["Tipo"] == "TRA"]["Cod"].value_counts()
REC.append([c for c in tra_cods.index if c not in REC and c not in protegidos and c not in COD_SIN_FICHA and c not in (LED, CABLE_REC)][0])
dev_cods = mov[mov["Tipo"] == "DEV"]["Cod"].value_counts()
REC.append([c for c in dev_cods.index if c not in REC and c not in protegidos and c not in COD_SIN_FICHA and c not in (LED, CABLE_REC)][0])
reg_cods = mov[mov["Tipo"].isin(["REG-", "DPR"])]["Cod"].value_counts()
REC.append([c for c in reg_cods.index if c not in REC and c not in protegidos and c not in COD_SIN_FICHA and c not in (LED, CABLE_REC)][0])
sal_cods = mov[mov["Tipo"] == "SAL"]["Cod"].value_counts()
REC.append([c for c in sal_cods.index if c not in REC and c not in protegidos and c not in COD_SIN_FICHA and c not in (LED, CABLE_REC)][0])   # Q14
REC += [LED, CABLE_REC]
assert len(set(REC)) == 10
for c in (LED, CABLE_REC):
    assert fin[c] >= (6 if c == LED else 40), (desc_de[c], fin[c])
recuento = [(c, fin[c] - (3.0 if c == LED else 12.5 if c == CABLE_REC else 0.0)) for c in REC]

# ---------------------------------------------------------------------------
# 7. Suciedad del CSV
# ---------------------------------------------------------------------------
log = []
sucio = mov.copy()
sucio["TipoTxt"] = sucio["Tipo"]
sucio["CantAbs"] = sucio["Cant"].abs()
sucio["CantFirmadaERP"] = np.where(sucio["Tipo"] == "TRA", sucio["Cant"], sucio["Cant"].abs())   # el ERP: positivo salvo TRA
# Q08 en el tipo
es_sal = sucio["Tipo"] == "SAL"
u = rng.random(len(sucio))
sucio.loc[es_sal & (sucio["Alm"] == "PAM") & (u < 0.55), "TipoTxt"] = "Salida"
sucio.loc[es_sal & (sucio["TipoTxt"] == "SAL") & (u > 0.97), "TipoTxt"] = "salida "
# Q14: 40 SAL con la cantidad en negativo (incluye 2 del artículo de recuento REC[7])
q14 = list(sucio[es_sal & (sucio["Cod"] == REC[7])].index[:2])
resto = sucio[es_sal & ~sucio.index.isin(q14)].index
q14 += list(rng.choice(resto, 38, replace=False))
sucio["CantTxt"] = ""
def fmt_es(q):
    return (f"{q:.1f}".replace(".", ",") if q % 1 else f"{int(q)}")
sucio["CantTxt"] = [fmt_es(q) for q in sucio["CantFirmadaERP"]]
for k in q14:
    sucio.at[k, "CantTxt"] = "-" + sucio.at[k, "CantTxt"]
# Q05: cable con decimales grabado en Lleida con punto decimal
q05 = sucio[(sucio["Alm"] == "LLE") & (sucio["CantAbs"] % 1 != 0)].index
for k in q05:
    sucio.at[k, "CantTxt"] = sucio.at[k, "CantTxt"].replace(",", ".")

# Extracciones mensuales concatenadas (Q22 + Q07)
def fecha_txt(d, iso):
    return d.strftime("%Y-%m-%d") if iso else d.strftime("%d/%m/%Y")
bloques = []
for mes in range(5, 11):
    if mes == 8:
        sel = sucio[(sucio["Fecha"] == D3107) | (pd.to_datetime(sucio["Fecha"]).dt.month == 8)]
    else:
        sel = sucio[pd.to_datetime(sucio["Fecha"]).dt.month == mes]
    b = sel.copy()
    b["FechaTxt"] = [fecha_txt(d, mes == 8) for d in b["Fecha"]]
    b["Extraccion"] = mes
    bloques.append(b)
csvdf = pd.concat(bloques, ignore_index=False)
csvdf["Origen"] = csvdf.index
csvdf = csvdf.reset_index(drop=True)
dup_mask = csvdf.duplicated(["Documento", "Linea"], keep="first")
assert dup_mask.sum() == 63 and (csvdf.loc[dup_mask, "Fecha"] == D3107).all()

COLS = ["Fecha", "Tipo", "CodArticulo", "Cantidad", "Documento", "Línea", "Almacén", "Usuario"]
filas_csv = []
for k, r in csvdf.iterrows():
    filas_csv.append([r.FechaTxt, r.TipoTxt, r.Cod, r.CantTxt, r.Documento, str(int(r.Linea)), r.Alm, r.Usuario])
with open(CSV, "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(COLS)
    w.writerows(filas_csv)

for k, r in csvdf.iterrows():
    fila = k + 2   # fila del CSV contando la cabecera como fila 1
    if dup_mask[k]:
        log.append(("p6-movimientos.csv", fila, "Documento+Línea", "Q22 solape 31/07 (fila repetida)", f"{r.Documento} línea {int(r.Linea)}", "quitar"))
    if r.Extraccion == 8:
        log.append(("p6-movimientos.csv", fila, "Fecha", "Q07 fecha AAAA-MM-DD", r.FechaTxt, r.Fecha.strftime("%d/%m/%Y")))
    if r.TipoTxt != r.Tipo:
        log.append(("p6-movimientos.csv", fila, "Tipo", "Q08 tipo mal escrito", r.TipoTxt, r.Tipo))
    if r.CantTxt.startswith("-") and r.Tipo == "SAL":
        log.append(("p6-movimientos.csv", fila, "Cantidad", "Q14 SAL en negativo", r.CantTxt, fmt_es(r.CantAbs)))
    if "." in r.CantTxt:
        log.append(("p6-movimientos.csv", fila, "Cantidad", "Q05 punto decimal", r.CantTxt, fmt_es(r.CantAbs)))

# ---------------------------------------------------------------------------
# 8. Inventario, fichas, proveedores y recuento
# ---------------------------------------------------------------------------
PASILLO = {"Cable": "A", "Iluminación": "B", "Mecanismos": "C", "Protección": "D", "Canalización": "E", "Herramienta": "F"}
inv_filas = []
for r in art.itertuples():
    ubic = f"{PASILLO[r.Familia]}-{int(rng.integers(1, 13)):02d}-{int(rng.integers(1, 6)):02d}"
    if r.Cod in reparto:
        s1, s2 = reparto[r.Cod]
        inv_filas.append([r.Cod, r.Descripcion, ubic, r.Unidad, s1, "principal"])
        inv_filas.append([r.Cod, r.Descripcion, f"R-{int(rng.integers(1, 9)):02d}-{int(rng.integers(1, 5)):02d}", r.Unidad, s2, "reserva"])
    else:
        inv_filas.append([r.Cod, r.Descripcion, ubic, r.Unidad, inv0[r.Cod], "principal"])
inv = pd.DataFrame(inv_filas, columns=["CodArticulo", "Descripción", "Ubicación", "Unidad", "StockContado", "_tipo"])
inv = inv.sort_values("Ubicación").reset_index(drop=True)          # el inventario se cuenta por pasillos
assert len(inv) == 196
num_rows = set()
for c in NUM_SIMPLE:
    num_rows.add(inv.index[inv["CodArticulo"] == c][0])
for c in NUM_DOBLE:
    num_rows.add(inv.index[(inv["CodArticulo"] == c) & (inv["_tipo"] == "reserva")][0])
assert len(num_rows) == 22
for k in sorted(num_rows):
    log.append(("p6-datos.xlsx · Inventario_30-04", k + 2, "CodArticulo", "Q13 código como número", inv.at[k, "CodArticulo"], int(inv.at[k, "CodArticulo"])))
for c in DOBLES:
    filas = [int(i) + 2 for i in inv.index[inv["CodArticulo"] == c]]
    log.append(("p6-datos.xlsx · Inventario_30-04", filas[0], "CodArticulo", "Q03 artículo en dos ubicaciones (legítimo: sumar)", c, f"filas {filas[0]} y {filas[1]}"))

# fichas (177): sin los 3 artículos de Q16; 5 plazos vacíos (Q09)
fichas = art[~art["Cod"].isin(COD_SIN_FICHA)].copy()
fichas["PlazoEntrega"] = fichas["Plazo"].astype(object)
vacios = list(rng.choice(fichas[fichas["Plazo"] == fichas["Proveedor"].map(PLAZO_PROV)].index, 5, replace=False))
fichas.loc[vacios, "PlazoEntrega"] = None
fichas["PendienteRecibir"] = [pend.get(c, (0, None))[0] for c in fichas["Cod"]]
fichas["FechaPrevista"] = [pend.get(c, (0, None))[1] for c in fichas["Cod"]]
for k in vacios:
    log.append(("p6-datos.xlsx · Fichas", int(fichas.index.get_loc(k)) + 2, "PlazoEntrega", "Q09 plazo vacío (usar el del proveedor)", "", int(fichas.at[k, "Plazo"])))
for c in COD_SIN_FICHA:
    log.append(("p6-datos.xlsx · Fichas", "", "CodArticulo", "Q16 artículo sin ficha", c, desc_de[c]))
for c, s in recuento:
    if abs(s - fin[c]) > 1e-9:
        log.append(("p6-datos.xlsx · Recuento_31-10", REC.index(c) + 2, "StockFísico", "Diferencia de recuento", fmt_es(fin[c]), fmt_es(s)))
# los artículos sin ficha no tienen pedidos pendientes registrados en su ficha
for c in COD_SIN_FICHA:
    pend.pop(c, None)

with open(LOG, "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["archivo", "fila", "columna", "problema", "valor_original", "valor_limpio"])
    w.writerows(log)

# ---------------------------------------------------------------------------
# 9. Libro p6-datos.xlsx
# ---------------------------------------------------------------------------
wb = xlsxwriter.Workbook(XLSX)
wb.set_properties({"title": "P6 · Stock, punto de pedido y ABC · datos de partida", "author": "Hoja a hoja",
                   "company": "Electro Cierzo Suministros, S.L. (ficticia)"})
F = {
    "tit": wb.add_format({"bold": True, "font_size": 15, "font_color": "#1F3864"}),
    "sub": wb.add_format({"bold": True, "font_size": 11, "font_color": "#1F3864"}),
    "txt": wb.add_format({"text_wrap": True, "valign": "top"}),
    "cab": wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"}),
    "num": wb.add_format({"num_format": "#,##0.0"}),
    "ent": wb.add_format({"num_format": "0"}),
    "eur": wb.add_format({"num_format": "#,##0.00 €"}),
    "fec": wb.add_format({"num_format": "dd/mm/yyyy"}),
    "txtc": wb.add_format({"num_format": "@"}),
}

ins = wb.add_worksheet("Instrucciones")
ins.set_column("A:A", 110, F["txt"])
lineas = [
    ("tit", "P6 · Stock, punto de pedido y clasificación ABC"),
    ("txt", "Electro Cierzo Suministros, S.L. (empresa ficticia) · Compras y almacén · Encargo de Andrés Molina · Datos a 31/10/2026"),
    ("sub", "Qué tienes que conseguir"),
    ("txt", "Una hoja que cada lunes diga qué hay que pedir y cuánto, a qué proveedor, y qué artículos están muertos (sin salidas en 90 días y con stock), con su valor. Además: clasificación ABC por valor, gráfico de Pareto, efecto de cambiar el nivel de servicio (Tabla de datos) y el escenario «Tormes retrasa 5 días» (Administrador de escenarios)."),
    ("sub", "Qué hay en este libro y en el CSV"),
    ("txt", "• Inventario_30-04: el inventario físico del 30/04/2026, contado por ubicaciones (una fila por ubicación). Columnas: CodArticulo, Descripción, Ubicación, Unidad, StockContado. Los metros llevan decimales."),
    ("txt", "• p6-movimientos.csv: los movimientos de mayo a octubre de 2026 tal como salen del ERP. Codificación UTF-8, separador «;», coma decimal. Columnas: Fecha, Tipo, CodArticulo, Cantidad, Documento, Línea, Almacén, Usuario. El ERP graba la cantidad en positivo y el signo lo da el tipo (salvo los traspasos)."),
    ("txt", "• Movimientos_csv: copia en texto de ese mismo CSV, por si no puedes usar el archivo. Para practicar como en la empresa, importa el CSV con Datos > Obtener datos > De archivo > De texto/CSV."),
    ("txt", "• Fichas: una ficha por artículo: proveedor, plazo de entrega (días laborables), lote mínimo, múltiplo, coste unitario (€, sin IVA), cantidad pendiente de recibir y fecha prevista."),
    ("txt", "• Proveedores: plazo habitual de cada proveedor (días laborables)."),
    ("txt", "• Recuento_31-10: el recuento físico de 10 artículos hecho el sábado 31/10/2026."),
    ("sub", "Tipos de movimiento del ERP"),
    ("txt", "ENT = entrada por compra · SAL = salida por venta · DEV = devolución de un cliente · DPR = devolución a un proveedor · REG+ y REG- = regularización (ajuste de inventario) · TRA = traspaso entre almacenes de la empresa (dos líneas: una en negativo en el almacén de origen y otra en positivo en el de destino)."),
    ("sub", "Lo que ha pactado Andrés (léelo después de mandarle tus preguntas)"),
    ("txt", "• ABC por valor del consumo (unidades consumidas × coste): A hasta el 80 % acumulado, B hasta el 95 %, C el resto. • Consumo = salidas por venta menos devoluciones de clientes. • Nivel de servicio: 95 % para A y B, 90 % para C. • Plazos en días laborables (los de la ficha; si están vacíos, el habitual del proveedor). • Posición = stock + pendiente de recibir. • Muerto = sin salidas en los 90 días naturales anteriores al 31/10 (antes del 02/08/2026) y con stock. • Revisión semanal, cada lunes: R = 5 días laborables. • Lotes mínimos y múltiplos, los de la ficha. • Si el recuento del 31/10 no cuadra, manda el recuento."),
    ("sub", "Hitos (orden recomendado)"),
    ("txt", "1. Léame con el glosario pactado y la hoja «Calidad de datos». 2. Power Query de movimientos (tipos, tabla de tipos con signo y «es consumo», duplicados, cantidad con signo). 3. Inventario por artículo (código de 6 cifras, Agrupar por). 4. Stock a 31/10 y recuento. 5. Demanda semanal de las 26 semanas (19 a 44), con ceros. 6. Stock de seguridad, punto de pedido y cantidad a pedir (con LET). 7. ABC y Pareto. 8. Artículos muertos. 9. Hoja «Lunes» por proveedor. 10. Tabla de datos y escenario. 11. Controles, resumen y correo."),
    ("sub", "Fórmulas de referencia"),
    ("txt", "d = consumo / días laborables del periodo · σ diaria = DESVEST.M(26 semanas) / RAIZ(5) · SS = REDONDEAR.MAS(z × σ diaria × RAIZ(L); 0), con z = INV.NORM.ESTAND(nivel) · ROP = d × L + SS · S = ROP + d × R · se pide si posición ≤ ROP: MAX(lote mínimo; MULTIPLO.SUPERIOR(S − posición; múltiplo))."),
    ("sub", "Qué entregar"),
    ("txt", "El libro (P6_Stock_ABC_2026-10_v01.xlsx o la versión que toque) con Léame, Parámetros, datos limpios, cálculos, la hoja «Lunes», muertos, ABC con Pareto, qué pasaría si y Controles con el control maestro; la propuesta del lunes en PDF por proveedor; y un correo breve a Andrés."),
    ("sub", "Cómo comprobar tu trabajo"),
    ("txt", "En la página del proyecto hay totales de control: duplicados quitados, valor del stock, artículos del recuento que cuadran, artículos A, valor de los muertos, líneas e importe de la propuesta y valor del stock de seguridad. Si alguno no cuadra, revisa la limpieza: casi siempre está ahí."),
    ("txt", "Todos los datos son inventados. Fecha de la ficción: lunes 16/11/2026."),
]
for i, (fmt, t) in enumerate(lineas):
    ins.write(i, 0, t, F[fmt])
ins.hide_gridlines(2)

def hoja_tabla(nombre, cab, filas, anchos, formatos, tabla):
    ws = wb.add_worksheet(nombre)
    for j, (h, an) in enumerate(zip(cab, anchos)):
        ws.set_column(j, j, an, formatos[j])
    for i, fila in enumerate(filas, start=1):
        for j, v in enumerate(fila):
            if v is None or (isinstance(v, float) and math.isnan(v)):
                continue
            if isinstance(v, date):
                ws.write_datetime(i, j, pd.Timestamp(v).to_pydatetime(), F["fec"])
            elif isinstance(v, str):
                ws.write_string(i, j, v)
            else:
                ws.write_number(i, j, v)
    ws.add_table(0, 0, len(filas), len(cab) - 1, {"name": tabla, "style": "Table Style Light 9",
                                                   "columns": [{"header": h} for h in cab]})
    ws.freeze_panes(1, 0)
    return ws

inv_out = []
for k, r in inv.iterrows():
    cod = int(r.CodArticulo) if k in num_rows else r.CodArticulo
    inv_out.append([cod, r["Descripción"], r["Ubicación"], r.Unidad, float(r.StockContado)])
hoja_tabla("Inventario_30-04", ["CodArticulo", "Descripción", "Ubicación", "Unidad", "StockContado"], inv_out,
           [13, 52, 11, 8, 13], [None, None, None, None, F["num"]], "Inventario")

fic_out = []
for r in fichas.itertuples():
    fic_out.append([r.Cod, r.Proveedor, None if r.PlazoEntrega is None else int(r.PlazoEntrega), int(r.LoteMin), int(r.Multiplo),
                    float(r.Coste), float(r.PendienteRecibir), r.FechaPrevista])
hoja_tabla("Fichas", ["CodArticulo", "Proveedor", "PlazoEntrega", "LoteMinimo", "Multiplo", "CosteUnitario", "PendienteRecibir", "FechaPrevista"],
           fic_out, [13, 12, 13, 12, 10, 14, 17, 14], [None, None, F["ent"], F["ent"], F["ent"], F["eur"], F["num"], F["fec"]], "Fichas")

hoja_tabla("Proveedores", ["Proveedor", "PlazoHabitual", "CorreoPedidos"], [list(p) for p in PROVEEDORES],
           [12, 14, 28], [None, F["ent"], None], "Proveedores")

rec_out = [[c, desc_de[c], float(s)] for c, s in recuento]
hoja_tabla("Recuento_31-10", ["CodArticulo", "Descripción", "StockFísico"], rec_out, [13, 52, 13], [None, None, F["num"]], "Recuento")

wm = wb.add_worksheet("Movimientos_csv")
wm.write_row(0, 0, COLS, F["cab"])
for i, fila in enumerate(filas_csv, start=1):
    wm.write_row(i, 0, fila)          # todo como texto, exactamente como en el CSV
wm.set_column(0, 0, 12)
wm.set_column(1, 1, 9)
wm.set_column(2, 3, 12)
wm.set_column(4, 4, 15)
wm.set_column(5, 7, 10)
wm.freeze_panes(1, 0)
wb.close()

# ---------------------------------------------------------------------------
# 10. Verdad limpia para la solución
# ---------------------------------------------------------------------------
verdad = {
    "semilla": SEMILLA,
    "filas_csv": len(filas_csv),
    "duplicados": int(dup_mask.sum()),
    "movimientos_unicos": len(mov),
    "inv0": inv0,
    "stock_fin_teorico": fin,
    "recuento": {c: s for c, s in recuento},
    "sin_ficha": COD_SIN_FICHA,
    "dobles": DOBLES,
    "negativos_si_no_se_arregla": NEG_SI_NO,
    "codigos_como_numero": COD_NUM_ART,
    "muertos": [cod_de[n] for n in MUERTOS],
    "frontera": cod_de[FRONTERA],
    "q14": len(q14),
    "q05": int(len(q05)),
    "q08": int((sucio["TipoTxt"] != sucio["Tipo"]).sum()),
    "q07_filas": int((csvdf["Extraccion"] == 8).sum()),
    "plazos_vacios": [fichas.at[k, "Cod"] for k in vacios],
    "consumo": {c: float(-mov.loc[(mov["Cod"] == c) & (mov["Tipo"] == "SAL"), "Cant"].sum()
                         - mov.loc[(mov["Cod"] == c) & (mov["Tipo"] == "DEV"), "Cant"].sum()) for c in art["Cod"]},
}
with open(VERDAD, "w", encoding="utf-8") as fh:
    json.dump(verdad, fh, ensure_ascii=False, indent=1, default=str)

# resumen para calibrar
val_stock = sum(fin[c] * co for c, co in zip(art["Cod"], art["Coste"]) if c not in COD_SIN_FICHA)
val_muertos = sum(fin[cod_de[n]] * art.set_index("Cod").at[cod_de[n], "Coste"] for n in MUERTOS)
print(f"filas CSV {len(filas_csv)} · únicas {len(mov)} · por tipo {mov['Tipo'].value_counts().to_dict()}")
print(f"valor stock 31/10 (con ficha) {val_stock:,.2f} € · muertos {val_muertos:,.2f} € ({val_muertos / val_stock:.1%})")
print(f"pendientes {len(pend)} · Q05 {len(q05)} · Q08 {verdad['q08']} · Q14 {len(q14)} · Q07 {verdad['q07_filas']}")

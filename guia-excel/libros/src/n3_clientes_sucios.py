#!/usr/bin/env python3
"""Genera la práctica del módulo n3m3 «Limpiar datos que llegan sucios».

Salida (en EXCEL/libros/):
  - n3-clientes-sucios.xlsx      Instrucciones + exportación de clientes sucia (300 filas)
  - n3-ventas-export.csv         Ventas de octubre de 2026 tal como las saca el programa de gestión
                                 (separador ;, coma decimal, UTF-8 SIN BOM, fin de línea CRLF)
  - n3-clientes-sucios.zip       Los dos archivos anteriores juntos (lo que descarga la alumna)
  - n3-clientes-sucios-solucion.xlsx  La solución con fórmulas reales y la hoja de comprobaciones
  - un .meta.json por archivo descargable

Suciedad sembrada a propósito (documentada aquí y en la solución):
  1. Título combinado en la fila 1 y fila 2 vacía: los encabezados están en la fila 3.
  2. Nombre del cliente y población con espacios de más (delante, detrás o dobles) y en MAYÚSCULAS a veces.
  3. NIF con un espacio (o dos) al final en algunas filas y en las copias repetidas.
  4. 24 filas repetidas del mismo cliente (mismo NIF): 10 copias exactas, 14 con espacios o
     mayúsculas distintas (Quitar duplicados no las ve iguales si antes no se limpia).
  5. Dos pares de clientes DISTINTOS con el mismo nombre (autónomos homónimos, distinto NIF y ciudad):
     quitar duplicados solo por el nombre borraría dos clientes buenos.
  6. Códigos postales guardados como número: los de Barcelona, Álava y Burgos han perdido el 0.
  7. Límite de crédito guardado como texto en parte de las filas («6.000,00 €», «6000», «6.000 €»).
  8. El CSV de ventas va en UTF-8 sin BOM: abierto con doble clic, los acentos pueden salir rotos.
     Trae 3 NIF de clientes nuevos que todavía no están en la exportación de clientes.

Los totales de control se calculan con pandas desde los datos limpios (reglas: un cliente = un NIF
sin espacios y en mayúsculas; las ventas se cruzan por NIF).
"""
import csv
import io
import json
import os
import random
import zipfile
from datetime import date, timedelta

import pandas as pd
import xlsxwriter

random.seed(3303)
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------- clientes únicos (verdad)
LUGARES = [  # (población, provincia, [códigos postales posibles], peso)
    ("Zaragoza", "Zaragoza", list(range(50001, 50021)), 30),
    ("Utebo", "Zaragoza", [50180], 3), ("Calatayud", "Zaragoza", [50300], 3),
    ("Ejea de los Caballeros", "Zaragoza", [50600], 2), ("Cuarte de Huerva", "Zaragoza", [50410], 2),
    ("Huesca", "Huesca", list(range(22001, 22007)), 6), ("Monzón", "Huesca", [22400], 2),
    ("Barbastro", "Huesca", [22300], 2), ("Jaca", "Huesca", [22700], 1),
    ("Teruel", "Teruel", [44001, 44002, 44003], 3), ("Alcañiz", "Teruel", [44600], 2),
    ("Pamplona", "Navarra", list(range(31001, 31016)), 10), ("Tudela", "Navarra", [31500], 3),
    ("Estella-Lizarra", "Navarra", [31200], 1), ("Burlada", "Navarra", [31600], 2),
    ("Lleida", "Lleida", list(range(25001, 25009)), 8), ("Balaguer", "Lleida", [25600], 2),
    ("Mollerussa", "Lleida", [25230], 1),
    ("Logroño", "La Rioja", list(range(26001, 26010)), 6), ("Calahorra", "La Rioja", [26500], 2),
    ("Barcelona", "Barcelona", list(range(8001, 8041)), 6), ("Sabadell", "Barcelona", [8201, 8202, 8203], 2),
    ("Terrassa", "Barcelona", [8221, 8222, 8223], 2),
    ("Vitoria-Gasteiz", "Álava", list(range(1001, 1016)), 4),
    ("Burgos", "Burgos", list(range(9001, 9008)), 3), ("Miranda de Ebro", "Burgos", [9200], 1),
    ("Soria", "Soria", list(range(42001, 42006)), 2),
    ("Tarragona", "Tarragona", list(range(43001, 43008)), 2), ("Reus", "Tarragona", [43201, 43202, 43203], 2),
]
PREFIJOS = ["Instalaciones Eléctricas", "Electricidad", "Montajes Eléctricos", "Reformas", "Climatización",
            "Iluminación", "Electromecánica", "Automatismos", "Instalaciones", "Mantenimientos",
            "Servicios Eléctricos", "Proyectos Eléctricos", "Electro", "Telecomunicaciones"]
NUCLEOS = ["Ebro", "Moncayo", "Gállego", "Huerva", "Aragón", "Martínez", "Lasheras", "Gracia", "Lahoz",
           "Bielsa", "Sancho", "Navarro", "Ibarra", "Goñi", "Etxeberria", "Arrieta", "Puig", "Segre",
           "Pirineo", "Somontano", "Bardenas", "Ribera", "Jalón", "Cinca", "Matarraña", "Ordesa", "Garrigues",
           "Arga", "Moreno", "Lorente", "Royo", "Alastuey", "Urdániz", "Vidal", "Ferrer", "Oliván", "Castán",
           "Sarasa", "Iriarte", "Mairal", "Pallarés", "Azcona", "Larrañaga", "Rioja", "Delta", "Ega"]
FORMAS = [(", S.L.", "B", 70), (", S.L.U.", "B", 15), (", S.A.", "A", 10), (", S.Coop.", "F", 5)]
COMERCIALES = ["Pilar Lasheras", "Sergio Bueno", "Elena Sanz", "Jordi Vidal", "Raúl Gimeno"]
LIMITES = [1500, 3000, 4500, 6000, 9000, 12000, 18000, 24000]

N_UNICOS = 276
nombres, nifs = set(), set()
clientes = []


def nuevo_nif(letra):
    while True:
        n = f"{letra}{random.randint(10000000, 99999999)}"
        if n not in nifs:
            nifs.add(n)
            return n


def nuevo_lugar():
    pob, prov, cps, _ = random.choices(LUGARES, weights=[x[3] for x in LUGARES])[0]
    return pob, prov, random.choice(cps)


while len(clientes) < N_UNICOS - 4:
    suf, letra, _ = random.choices(FORMAS, weights=[f[2] for f in FORMAS])[0]
    nombre = f"{random.choice(PREFIJOS)} {random.choice(NUCLEOS)}{suf}"
    if nombre in nombres:
        continue
    nombres.add(nombre)
    pob, prov, cp = nuevo_lugar()
    clientes.append(dict(nif=nuevo_nif(letra), razon=nombre, pob=pob, prov=prov, cp=cp,
                         comercial=random.choice(COMERCIALES), limite=random.choice(LIMITES),
                         alta=date(2015, 1, 1) + timedelta(days=random.randint(0, 4300))))
def nif_persona():  # autónomo: 8 cifras y letra de control (formato plausible, número inventado)
    while True:
        n = random.randint(10000000, 79999999)
        x = f"{n}{'TRWAGMYFPDXBNJZSQVHLCKE'[n % 23]}"
        if x not in nifs:
            nifs.add(x)
            return x


# homónimos: dos pares de autónomos distintos con el mismo nombre comercial (distinto NIF y ciudad)
for nombre, lugares in [("Electricidad Martínez", [("Huesca", "Huesca", 22004), ("Logroño", "La Rioja", 26003)]),
                        ("Instalaciones Pérez", [("Pamplona", "Navarra", 31008), ("Lleida", "Lleida", 25005)])]:
    for pob, prov, cp in lugares:
        clientes.append(dict(nif=nif_persona(), razon=nombre, pob=pob, prov=prov, cp=cp,
                             comercial=random.choice(COMERCIALES), limite=random.choice(LIMITES),
                             alta=date(2015, 1, 1) + timedelta(days=random.randint(0, 4300))))
random.shuffle(clientes)
assert len(clientes) == N_UNICOS and len({c["nif"] for c in clientes}) == N_UNICOS

# ---------------------------------------------------------------- versión sucia (300 filas)


def ensuciar_texto(t, p_may=0.22, p_esp=0.15):
    if random.random() < p_may:
        t = t.upper()
    if random.random() < p_esp:
        t = random.choice([" " + t, t + " ", t + "  ", t.replace(" ", "  ", 1)])
    return t


def limite_sucio(v, p_txt=0.18):
    if random.random() < p_txt:
        miles = f"{v:,}".replace(",", ".")
        return random.choice([f"{miles},00 €", str(v), f"{miles} €"])
    return v


filas = []
for c in clientes:
    filas.append(dict(nif=c["nif"] + (" " if random.random() < 0.06 else ""),
                      razon=ensuciar_texto(c["razon"]), pob=ensuciar_texto(c["pob"], 0.12, 0.08),
                      prov=c["prov"], cp=c["cp"], comercial=c["comercial"], limite=limite_sucio(c["limite"]),
                      alta=c["alta"], _nif=c["nif"]))
originales = list(filas)
repetidos = random.sample(originales, 24)
for i, f in enumerate(repetidos):
    g = dict(f)
    if i >= 10:  # 14 copias que no son idénticas
        g["nif"] = f["_nif"] + random.choice([" ", "  "])
        g["razon"] = random.choice([f["razon"].upper(), " " + f["razon"], f["razon"] + "  "])
        g["limite"] = limite_sucio(next(c["limite"] for c in clientes if c["nif"] == f["_nif"]), 0.5)
    pos = originales.index(f) + random.randint(1, 60)
    filas.insert(min(pos, len(filas)), g)
assert len(filas) == 300

# ---------------------------------------------------------------- ventas de octubre (CSV)
FAMILIAS = [("Cable", 40, 1600), ("Canalización", 25, 900), ("Mecanismos", 20, 700),
            ("Iluminación LED", 60, 2400), ("Protección (magnetotérmicos)", 45, 1500)]
dias = [date(2026, 10, d) for d in range(1, 32) if date(2026, 10, d).weekday() < 5 and d != 12]
activos = random.sample(clientes, 230)
# asegurar que varios clientes con NIF sucio (con espacio) tienen ventas: es la trampa del cruce
sucios = [f["_nif"] for f in originales if f["nif"].endswith(" ")]
for c in clientes:
    if c["nif"] in sucios and c not in activos:
        activos[random.randrange(len(activos))] = c
nuevos = [("B" + str(random.randint(10000000, 99999999)), n) for n in
          ["Instalaciones Txantrea, S.L.", "Electricidad Valdejalón, S.L.U.", "Montajes Noguera, S.L."]]
ventas, nfac = [], 4811
for c in activos:
    for _ in range(random.choice([1, 1, 2, 2, 2, 3, 3])):
        fam, lo, hi = random.choice(FAMILIAS)
        ventas.append([random.choice(dias), c["nif"], c["razon"], fam, round(random.uniform(lo, hi), 2)])
for nif, nombre in nuevos:
    for _ in range(3):
        fam, lo, hi = random.choice(FAMILIAS)
        ventas.append([random.choice(dias), nif, nombre, fam, round(random.uniform(lo, hi), 2)])
ventas.sort(key=lambda v: v[0])
for v in ventas:
    nfac += 1
    v.insert(1, f"FV26-{nfac:06d}")
# filas: fecha, factura, nif, cliente, familia, importe

csv_txt = io.StringIO()
w = csv.writer(csv_txt, delimiter=";", lineterminator="\r\n")
w.writerow(["Fecha", "Factura", "NIF", "Cliente", "Familia", "Importe neto"])
for f, fac, nif, cli, fam, imp in ventas:
    w.writerow([f.strftime("%d/%m/%Y"), fac, nif, cli, fam, f"{imp:.2f}".replace(".", ",")])
csv_bytes = csv_txt.getvalue().encode("utf-8")  # sin BOM, a propósito
with open(os.path.join(BASE, "n3-ventas-export.csv"), "wb") as fh:
    fh.write(csv_bytes)

# ---------------------------------------------------------------- controles con pandas
dfc = pd.DataFrame(filas)
dfc["NIF_limpio"] = dfc["nif"].str.strip().str.upper()
unicos = dfc.drop_duplicates("NIF_limpio", keep="first").copy()


def a_numero(v):
    if isinstance(v, (int, float)):
        return float(v)
    return float(v.replace("€", "").replace(" ", "").replace(".", "").replace(",", "."))


unicos["limite_num"] = unicos["limite"].map(a_numero)
unicos["CP_txt"] = unicos["cp"].map(lambda x: f"{x:05d}")
dfv = pd.read_csv(io.BytesIO(csv_bytes), sep=";", decimal=",", dtype={"NIF": str}, encoding="utf-8")
ventas_por_nif = dfv.groupby("NIF")["Importe neto"].sum()
unicos["ventas"] = unicos["NIF_limpio"].map(ventas_por_nif).fillna(0)
nif_clientes = set(unicos["NIF_limpio"])

n_unicos = int(len(unicos))
total_limite = round(float(unicos["limite_num"].sum()), 2)
n_cp0 = int(unicos["CP_txt"].str.startswith("0").sum())
total_ventas = round(float(dfv["Importe neto"].sum()), 2)
sin_ventas = int((unicos["ventas"] == 0).sum())
imp_desconocidos = round(float(dfv.loc[~dfv["NIF"].isin(nif_clientes), "Importe neto"].sum()), 2)
n_lineas = int(len(dfv))
# resultados de los errores típicos (para las pistas)
sin_limpiar = int(dfc.drop_duplicates(["nif"]).shape[0])
por_nombre = int(dfc.assign(r=dfc["razon"].str.strip().str.split().str.join(" ").str.upper())
                 .drop_duplicates("r").shape[0])
nif_sucio_primero = dfc.drop_duplicates("NIF_limpio", keep="first")["nif"]
sin_ventas_sin_limpiar = int(sum(1 for n in nif_sucio_primero if n not in set(dfv["NIF"])))
assert abs(unicos["limite_num"].sum() - sum(c["limite"] for c in clientes)) < 0.001
assert n_unicos == N_UNICOS

controles = [
    {"pregunta": "Número de clientes únicos (un cliente = un NIF) después de limpiar y quitar los duplicados reales",
     "respuesta": n_unicos, "tolerancia": 0,
     "pista": f"La exportación trae 300 filas. Si te quedan {sin_limpiar}, has quitado duplicados sin limpiar antes el NIF: «B50…» y «B50… » (con espacio) no son iguales para Excel. Si te quedan {por_nombre}, lo has hecho por el nombre del cliente y te has llevado por delante clientes distintos que se llaman igual (dos autónomos «Electricidad Martínez», en Huesca y en Logroño, por ejemplo). Hazlo con el NIF limpio (ESPACIOS y MAYUSC)."},
    {"pregunta": "Suma del límite de crédito de los clientes únicos (€)",
     "respuesta": total_limite, "tolerancia": 0.01,
     "pista": "Si te sale bastante menos, la suma se está saltando los límites guardados como texto («6.000,00 €», «6000»). Conviértelos con VALOR.NUMERO(SUSTITUIR(G2;\"€\";\"\");\",\";\".\") o con Texto en columnas. Si te sale más, aún quedan clientes repetidos."},
    {"pregunta": "¿Cuántos clientes únicos tienen un código postal que empieza por 0 (Barcelona, Álava y Burgos)?",
     "respuesta": n_cp0, "tolerancia": 0,
     "pista": "Si te sale 0, el código postal sigue siendo un número y ha perdido el cero. Recupéralo con =TEXTO(E2;\"00000\") y cuenta con CONTAR.SI(rango;\"0*\")."},
    {"pregunta": "Importe neto total de las ventas de octubre del CSV (€)",
     "respuesta": total_ventas, "tolerancia": 0.01,
     "pista": f"El CSV tiene {n_lineas} líneas de ventas. Impórtalo con Datos › Obtener y transformar datos › De texto/CSV, Origen del archivo 65001: Unicode (UTF-8) y Delimitador Punto y coma. Si te sale una cifra enorme o redonda, los importes no se han leído con la coma decimal."},
    {"pregunta": "¿Cuántos clientes únicos no tienen ninguna venta en octubre?",
     "respuesta": sin_ventas, "tolerancia": 0,
     "pista": f"Cruza por NIF con CONTAR.SI(NIF de las ventas; NIF del cliente) y cuenta los 0. Si te salen {sin_ventas_sin_limpiar}, todavía hay NIF con un espacio al final en tu lista de clientes: límpialos antes de cruzar."},
    {"pregunta": "Importe de las ventas cuyo NIF no está en tu lista de clientes (€)",
     "respuesta": imp_desconocidos, "tolerancia": 0.01,
     "pista": "Es el cruce al revés: para cada venta, CONTAR.SI(NIF de los clientes limpios; NIF de la venta). Las de resultado 0 son de 3 clientes nuevos que aún no están en la exportación (9 líneas). Si te sale más, tus NIF de clientes aún tienen espacios."},
]

# ---------------------------------------------------------------- libro sucio
CAB = ["NIF", "Cliente", "Población", "Provincia", "CP", "Comercial", "Límite de crédito", "Fecha de alta"]
INSTR = [
    ("Práctica · Limpiar la exportación de clientes y cruzarla con las ventas", "t"),
    ("Encargo de Javier Ortega (director comercial): «Quiero saber cuántos clientes tenemos de verdad, cuánto crédito les damos y quién no nos ha comprado nada en octubre. El listado sale del programa hecho un desastre.»", ""),
    ("", ""),
    ("Archivos", "h"),
    ("· Este libro: hoja «Clientes», tal como sale del programa de gestión (300 filas).", ""),
    ("· n3-ventas-export.csv: las ventas de octubre de 2026 (separador ; y coma decimal, codificación UTF-8).", ""),
    ("", ""),
    ("Pasos", "h"),
    ("1. Guarda este libro con otro nombre y haz una copia de la hoja «Clientes» (clic derecho en la pestaña › Mover o copiar › Crear una copia). La original no se toca.", ""),
    ("2. Antes de limpiar, apunta el recuento de filas (CONTARA de la columna NIF) para comprobar después.", ""),
    ("3. En la copia: quita el título de las filas 1 y 2 para que los encabezados queden en la fila 1.", ""),
    ("4. Columnas auxiliares: NIF con =MAYUSC(ESPACIOS(A2)), nombre con =NOMPROPIO(ESPACIOS(B2)), CP con =TEXTO(E2;\"00000\") y límite con VALOR.NUMERO donde sea texto. Después, Pegado especial › Valores.", ""),
    ("5. Datos › Quitar duplicados marcando SOLO la columna del NIF limpio. Cuidado: hay clientes distintos que se llaman igual.", ""),
    ("6. Importa el CSV con Datos › Obtener y transformar datos › De texto/CSV (no con doble clic). Revisa Origen del archivo y Delimitador.", ""),
    ("7. Cruza las dos listas por NIF con CONTAR.SI: clientes sin ventas y ventas de NIF que no están en tu lista.", ""),
    ("", ""),
    ("Comprobación", "h"),
    ("Contesta los controles de la guía: clientes únicos, límite de crédito total, clientes con CP que empieza por 0, total de ventas, clientes sin ventas e importe de ventas de NIF desconocidos.", ""),
    ("Intenta hacerlo en menos de 40 minutos.", ""),
]


def hoja_instrucciones(wb, ws, filas_txt):
    tit = wb.add_format({"bold": True, "font_size": 14})
    sub = wb.add_format({"bold": True, "font_size": 11, "font_color": "#1F4E79"})
    txt = wb.add_format({"text_wrap": True, "valign": "top"})
    ws.set_column("A:A", 120)
    for i, (t, k) in enumerate(filas_txt):
        ws.write(i, 0, t, tit if k == "t" else sub if k == "h" else txt)


def escribir_clientes(wb, ws, filas_, fila0):
    fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
    cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
    for j, h in enumerate(CAB):
        ws.write(fila0, j, h, cab)
    for i, f in enumerate(filas_, start=fila0 + 1):
        ws.write_string(i, 0, f["nif"])
        ws.write_string(i, 1, f["razon"])
        ws.write_string(i, 2, f["pob"])
        ws.write_string(i, 3, f["prov"])
        ws.write_number(i, 4, f["cp"])
        ws.write_string(i, 5, f["comercial"])
        if isinstance(f["limite"], str):
            ws.write_string(i, 6, f["limite"])
        else:
            ws.write_number(i, 6, f["limite"])
        ws.write_datetime(i, 7, pd.Timestamp(f["alta"]).to_pydatetime(), fecha)
    ws.set_column("A:A", 12)
    ws.set_column("B:B", 38)
    ws.set_column("C:C", 22)
    ws.set_column("D:D", 12)
    ws.set_column("E:E", 8)
    ws.set_column("F:F", 14)
    ws.set_column("G:G", 16)
    ws.set_column("H:H", 13)


ruta_libro = os.path.join(BASE, "n3-clientes-sucios.xlsx")
wb = xlsxwriter.Workbook(ruta_libro)
hoja_instrucciones(wb, wb.add_worksheet("Instrucciones"), INSTR)
ws = wb.add_worksheet("Clientes")
ws.merge_range("A1:H1", "EXPORTACIÓN DE CLIENTES · Electro Cierzo Suministros, S.L. · 16/11/2026",
               wb.add_format({"bold": True, "align": "center", "font_size": 12}))
escribir_clientes(wb, ws, filas, 2)
wb.close()

# ---------------------------------------------------------------- solución
ruta_sol = os.path.join(BASE, "n3-clientes-sucios-solucion.xlsx")
wb = xlsxwriter.Workbook(ruta_sol)
eur = wb.add_format({"num_format": "#,##0.00 €"})
fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
neg = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
SOL_INSTR = [
    ("Solución · Limpiar la exportación de clientes y cruzarla con las ventas", "t"),
    ("Hojas: «Original» (sin tocar), «Limpieza» (fórmulas auxiliares fila a fila), «Clientes» (únicos, ya en valores), «Ventas» (el CSV importado bien) y «Comprobaciones» (los totales de control).", ""),
    ("", ""),
    ("Qué había en los datos", "h"),
    ("· Título combinado en la fila 1 y encabezados en la fila 3.", ""),
    ("· NIF con espacios al final en algunas filas y copias: para Excel son NIF distintos hasta que se limpian con MAYUSC(ESPACIOS()).", ""),
    ("· 24 filas repetidas del mismo cliente; 14 de ellas con espacios o mayúsculas distintas.", ""),
    ("· Dos pares de clientes distintos con el mismo nombre: los autónomos «Electricidad Martínez» de Huesca y de Logroño, e «Instalaciones Pérez» de Pamplona y de Lleida. Quitar duplicados por el nombre los borraría.", ""),
    ("· CP de Barcelona, Álava y Burgos sin el 0 inicial: TEXTO(E4;\"00000\").", ""),
    ("· Límites de crédito como texto: VALOR.NUMERO(SUSTITUIR(G4;\"€\";\"\");\",\";\".\").", ""),
    ("· El CSV va en UTF-8 sin BOM: con doble clic los acentos pueden salir rotos («IluminaciÃ³n»). Con De texto/CSV y Origen 65001: Unicode (UTF-8) se leen bien.", ""),
    ("", ""),
    ("Cómo se hizo", "h"),
    ("1. Copia de la hoja (Original). 2. En «Limpieza», columnas auxiliares con fórmulas; la columna «Repetido» marca VERDADERO desde la segunda aparición de cada NIF limpio. 3. Pegado especial › Valores y Quitar duplicados por el NIF limpio (quedan las filas con Repetido = FALSO): hoja «Clientes». 4. CSV importado con De texto/CSV: hoja «Ventas». 5. Cruces con CONTAR.SI en las dos direcciones y totales en «Comprobaciones».", ""),
]
hoja_instrucciones(wb, wb.add_worksheet("Instrucciones"), SOL_INSTR)
ws = wb.add_worksheet("Original")
ws.merge_range("A1:H1", "EXPORTACIÓN DE CLIENTES · Electro Cierzo Suministros, S.L. · 16/11/2026",
               wb.add_format({"bold": True, "align": "center", "font_size": 12}))
escribir_clientes(wb, ws, filas, 2)

ws = wb.add_worksheet("Limpieza")
CABL = ["NIF limpio", "Cliente", "Población", "Provincia", "CP", "Comercial", "Límite de crédito", "Fecha de alta", "Repetido"]
for j, h in enumerate(CABL):
    ws.write(0, j, h, neg)
for i in range(300):
    r = i + 4  # fila en «Original»
    e = i + 2  # fila en «Limpieza»
    f = filas[i]
    lim = a_numero(f["limite"])
    ws.write_formula(f"A{e}", f"=UPPER(TRIM(Original!A{r}))", None, f["nif"].strip().upper())
    ws.write_formula(f"B{e}", f"=PROPER(TRIM(Original!B{r}))", None, " ".join(f["razon"].split()).title())
    ws.write_formula(f"C{e}", f"=TRIM(Original!C{r})", None, " ".join(f["pob"].split()))
    ws.write_formula(f"D{e}", f"=Original!D{r}", None, f["prov"])
    ws.write_formula(f"E{e}", f'=TEXT(Original!E{r},"00000")', None, f"{f['cp']:05d}")
    ws.write_formula(f"F{e}", f"=Original!F{r}", None, f["comercial"])
    ws.write_formula(f"G{e}", f'=IF(ISNUMBER(Original!G{r}),Original!G{r},_xlfn.NUMBERVALUE(SUBSTITUTE(Original!G{r},"€",""),",","."))', eur, lim)
    ws.write_formula(f"H{e}", f"=Original!H{r}", fecha, None)
    ws.write_formula(f"I{e}", f"=COUNTIF($A$2:A{e},A{e})>1", None, None)
ws.set_column("A:A", 12)
ws.set_column("B:B", 38)
ws.set_column("C:C", 22)
ws.set_column("G:G", 16)
ws.set_column("H:I", 13)

ws = wb.add_worksheet("Clientes")
CABC = ["NIF", "Cliente", "Población", "Provincia", "CP", "Comercial", "Límite de crédito", "Ventas octubre", "Nº de ventas"]
for j, h in enumerate(CABC):
    ws.write(0, j, h, neg)
nv = len(ventas)
for i, (_, u) in enumerate(unicos.iterrows(), start=2):
    ws.write_string(f"A{i}", u["NIF_limpio"])
    ws.write_string(f"B{i}", " ".join(u["razon"].split()).title())
    ws.write_string(f"C{i}", " ".join(u["pob"].split()))
    ws.write_string(f"D{i}", u["prov"])
    ws.write_string(f"E{i}", u["CP_txt"])
    ws.write_string(f"F{i}", u["comercial"])
    ws.write_number(f"G{i}", u["limite_num"], eur)
    ws.write_formula(f"H{i}", f"=SUMIFS(Ventas!$F$2:$F${nv + 1},Ventas!$C$2:$C${nv + 1},A{i})", eur, round(u["ventas"], 2))
    ws.write_formula(f"I{i}", f"=COUNTIF(Ventas!$C$2:$C${nv + 1},A{i})", None, int((dfv["NIF"] == u["NIF_limpio"]).sum()))
ultimo_cli = n_unicos + 1
ws.set_column("A:A", 12)
ws.set_column("B:B", 38)
ws.set_column("C:C", 22)
ws.set_column("G:H", 16)

ws = wb.add_worksheet("Ventas")
CABV = ["Fecha", "Factura", "NIF", "Cliente", "Familia", "Importe neto", "¿Está en Clientes?"]
for j, h in enumerate(CABV):
    ws.write(0, j, h, neg)
for i, (f, fac, nif, cli, fam, imp) in enumerate(ventas, start=2):
    ws.write_datetime(f"A{i}", pd.Timestamp(f).to_pydatetime(), fecha)
    ws.write_string(f"B{i}", fac)
    ws.write_string(f"C{i}", nif)
    ws.write_string(f"D{i}", cli)
    ws.write_string(f"E{i}", fam)
    ws.write_number(f"F{i}", imp, eur)
    ws.write_formula(f"G{i}", f"=COUNTIF(Clientes!$A$2:$A${ultimo_cli},C{i})>0", None, nif in nif_clientes)
ws.set_column("A:C", 13)
ws.set_column("D:D", 38)
ws.set_column("E:E", 28)
ws.set_column("F:G", 16)

ws = wb.add_worksheet("Comprobaciones")
ws.write_row(0, 0, ["Control", "Fórmula", "Resultado"], neg)
comp = [
    ("Filas de la exportación original", f"=COUNTA(Original!A4:A303)", 300),
    ("Clientes únicos", f"=COUNTA(Clientes!A2:A{ultimo_cli})", n_unicos),
    ("Límite de crédito total (€)", f"=SUM(Clientes!G2:G{ultimo_cli})", total_limite),
    ("Clientes con CP que empieza por 0", f'=COUNTIF(Clientes!E2:E{ultimo_cli},"0*")', n_cp0),
    ("Total de ventas de octubre (€)", f"=SUM(Ventas!F2:F{nv + 1})", total_ventas),
    ("Clientes sin ventas en octubre", f"=COUNTIF(Clientes!I2:I{ultimo_cli},0)", sin_ventas),
    ("Ventas de NIF que no están en Clientes (€)", f"=SUMIFS(Ventas!F2:F{nv + 1},Ventas!G2:G{nv + 1},FALSE)", imp_desconocidos),
    ("Cuadre: ventas de clientes + ventas desconocidas = total", f"=ROUND(SUM(Clientes!H2:H{ultimo_cli})+C8-C6,2)=0", True),
]
def a_es(f):  # la columna «Fórmula» se lee como en el Excel en español: nombres en español y «;»
    for a, b in [("COUNTA(", "CONTARA("), ("COUNTIF(", "CONTAR.SI("), ("SUMIFS(", "SUMAR.SI.CONJUNTO("),
                 ("ROUND(", "REDONDEAR("), ("SUM(", "SUMA("), ("FALSE", "FALSO")]:
        f = f.replace(a, b)
    return f.replace(",", ";")
for i, (t, fml, val) in enumerate(comp, start=1):
    ws.write_string(i, 0, t)
    ws.write_string(i, 1, a_es(fml))
    ws.write_formula(i, 2, fml, eur if "€" in t else None, val)
ws.set_column("A:A", 52)
ws.set_column("B:B", 60)
ws.set_column("C:C", 16)
wb.close()

# ---------------------------------------------------------------- zip y metadatos
ruta_zip = os.path.join(BASE, "n3-clientes-sucios.zip")
with zipfile.ZipFile(ruta_zip, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(ruta_libro, "n3-clientes-sucios.xlsx")
    z.writestr("n3-ventas-export.csv", csv_bytes)
metas = {
    "n3-clientes-sucios.zip": {"titulo": "N3 · Exportación de clientes sucia y CSV de ventas",
                               "descripcion": "Libro con 300 filas de clientes tal como salen del programa de gestión y el CSV de ventas de octubre de 2026, para limpiar, quitar duplicados, importar y cruzar.",
                               "nivel": "n3"},
    "n3-clientes-sucios.xlsx": {"titulo": "N3 · Exportación de clientes sucia",
                                "descripcion": "Listado de clientes de Electro Cierzo con espacios, mayúsculas, duplicados, códigos postales sin cero e importes como texto.",
                                "nivel": "n3"},
    "n3-clientes-sucios-solucion.xlsx": {"titulo": "N3 · Clientes limpios y cruce con ventas (solución)",
                                         "descripcion": "Solución con las fórmulas de limpieza, los clientes únicos, las ventas importadas y la hoja de comprobaciones.",
                                         "nivel": "n3"},
}
for nombre, meta in metas.items():
    with open(os.path.join(BASE, nombre.rsplit(".", 1)[0] + ".meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)
with open(os.path.join(os.path.dirname(__file__), "n3_clientes_sucios_controles.json"), "w", encoding="utf-8") as fh:
    json.dump(controles, fh, ensure_ascii=False, indent=1)
print(json.dumps(controles, ensure_ascii=False, indent=1))
print("líneas de venta:", n_lineas, "· sin limpiar:", sin_limpiar, "· por nombre:", por_nombre,
      "· sin ventas sin limpiar:", sin_ventas_sin_limpiar)

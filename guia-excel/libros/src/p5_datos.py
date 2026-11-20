# -*- coding: utf-8 -*-
"""
P5 · Informe mensual de ventas automatizado (Comercial) · DATOS DE PARTIDA
==========================================================================

Genera (todo con la semilla fija SEED, siempre igual):
  libros/p5-datos.xlsx               maestros, objetivos, 2025 y control del ERP
                                     (primera hoja «Instrucciones»)
  libros/p5-carpeta-ventas.zip       la carpeta compartida que deja Javier:
      Ventas/ERP/ventas_2026_01.csv … ventas_2026_10.csv   (exportaciones del ERP)
      Ventas/ERP/ventas_2026_09 - copia.csv                (copia que dejó Javier)
      Ventas/Maestros/p5-datos.xlsx                        (el mismo libro de arriba)
      Ventas/Informe/                                      (vacía: aquí va su libro)
      Ventas/Llega_en_diciembre/ventas_2026_11.csv         (cambio inesperado)
      Ventas/Llega_en_diciembre/altas_diciembre.xlsx       (altas de Compras y RR. HH.)
  libros/p5-carpeta/                 la misma carpeta descomprimida (para pruebas)
  libros/src/p5-log-suciedad.csv     registro de cada problema sembrado (NO se entrega)
  libros/src/p5_verdad.json          totales de control calculados con los datos
                                     VERDADEROS (antes de ensuciar); p5_solucion.py
                                     comprueba que, tras limpiar, salen idénticos.

Empresa ficticia: Electro Cierzo Suministros, S.L. (Zaragoza, Pamplona y Lleida).
Encargo de Javier Ortega, director comercial, el lunes 16/11/2026. Todo es inventado:
clientes, NIF (CIF con dígito de control cambiado a propósito; DNI con letra válida
pero números al azar), comerciales, productos y proveedores.

Formato de las exportaciones del ERP (lo «normal»): UTF-8 con BOM, separador «;»,
coma decimal sin separador de miles, fechas DD/MM/AAAA, fin de línea CRLF.
Columnas: Fecha;NumAlbaran;NumFactura;CodCliente;CodProducto;Descripcion;Cantidad;
PrecioUnitario;DtoLinea;ImporteNeto;Delegacion;CodComercial  (+ CosteUnitario desde julio)
ImporteNeto = REDONDEAR(Cantidad × PrecioUnitario × (1 − DtoLinea/100); 2), sin IVA.

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5)
----------------------------------------------------------------------
Q18  Columna nueva: desde julio (07 a 10) los CSV traen una 13.ª columna CosteUnitario.
     Si el «archivo de ejemplo» de Combinar archivos es enero, Power Query fija
     Columns=12 y la columna nueva se pierde.
Q19  Marzo (ventas_2026_03.csv) exportado desde otro PC con configuración de EE. UU.:
     separador «,», punto decimal y fechas M/D/AAAA. Los textos con coma
     («1,5 mm²») van entre comillas. Con la configuración de enero sale en 1 columna;
     con Español (España) los importes salen ×100 o ×10.000 y las fechas, mal.
Q11  Mayo (ventas_2026_05.csv) trae una línea de título antes de los encabezados.
Q13  Agosto (ventas_2026_08.csv) se abrió y se guardó en Excel (CSV UTF-8): CodProducto
     pierde los ceros a la izquierda («014821» → «14821») y los números pierden los
     ceros decimales del final («0,4570» → «0,457»).
Q08  Delegación escrita de 6 maneras: «Zaragoza», «ZARAGOZA», «Zgz», «Pamplona/Iruña»,
Q04  «Lleida», «Lérida», y algunas con un espacio al final («Zaragoza », «Lleida »).
Q14  Devoluciones: Cantidad negativa (e ImporteNeto negativo), factura rectificativa R26-.
Q16  7 códigos de producto que no están en el maestro (alta en el ERP desde julio;
     «Productos» es una exportación anterior). Unos 1,2 % de la venta.
—    Líneas especiales: «PORTES» y «PORTES URGENTES 24 H» (familia Portes y servicios)
     y «DTO. PRONTO PAGO» (familia Ajustes, importe negativo, sin NumAlbaran).
Q01  En la carpeta ERP hay «ventas_2026_09 - copia.csv» (copia exacta de septiembre):
Q22  si entra en la consulta, septiembre se cuenta dos veces.
Q12  Objetivos_2026 y Ventas_2025_resumen en formato ancho (meses en columnas).
Q08  En Ventas_2025_resumen, Lleida aparece como «Lérida».
—    Un comercial de baja (V05, 15/05/2026): desde el 16/05 sus clientes los lleva V06;
     sus objetivos de junio a diciembre están vacíos.

CAMBIO INESPERADO (Llega_en_diciembre/ventas_2026_11.csv):
Q18  la columna «Importe Neto» (con espacio) en lugar de «ImporteNeto»;
Q16  delegación nueva «Logroño» (no está en el mapa) y 2 comerciales nuevos (V13 y V14)
     que no están en Comerciales ni tienen objetivo.

Calibración [DISEÑO de la ficha]: unas 12.000 líneas; ventas ene-oct ≈ 7,9 M€; margen
≈ 27,5 % (2 comerciales por debajo del 22 %); agosto ≈ −35 %; 2025 ≈ +6,5 % menos;
Lleida crece más; Pamplona por debajo del objetivo.
"""
import csv
import io
import json
import os
import shutil
import zipfile
import datetime as dt

import numpy as np
import pandas as pd

SEED = 20261116
rng = np.random.default_rng(SEED)

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
CARPETA = os.path.join(LIBROS, "p5-carpeta")
XLSX = os.path.join(LIBROS, "p5-datos.xlsx")
ZIP = os.path.join(LIBROS, "p5-carpeta-ventas.zip")

MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MESES_NOM = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"]
FAMILIAS = ["Cable", "Iluminación", "Mecanismos", "Protección", "Canalización", "Herramienta"]

# ---------------------------------------------------------------------------
# 1. Comerciales
# ---------------------------------------------------------------------------
COMERCIALES = [
    # cod, nombre, delegación, alta, baja, descuento extra (puntos)
    ("V01", "Raúl Lasheras Gimeno", "Zaragoza", "2015-03-02", None, 0),
    ("V02", "Pilar Sanz Orós", "Zaragoza", "2018-09-03", None, 0),
    ("V03", "Alberto Gracia Marín", "Zaragoza", "2021-01-11", None, 5),   # vende barato
    ("V04", "Nuria Bielsa Lacasa", "Zaragoza", "2012-05-07", None, 0),
    ("V05", "Óscar Lafuente Royo", "Zaragoza", "2016-02-01", "2026-05-15", 0),  # baja
    ("V06", "Elena Sancho Ferrer", "Zaragoza", "2023-10-02", None, 0),
    ("V07", "Iñaki Goñi Etxeberria", "Pamplona", "2014-04-01", None, 0),
    ("V08", "Maite Arbizu Lusarreta", "Pamplona", "2019-06-03", None, 0),
    ("V09", "David Ezcurra Moreno", "Pamplona", "2022-03-14", None, 8),   # vende barato
    ("V10", "Jordi Solé Vilalta", "Lleida", "2017-01-09", None, 0),
    ("V11", "Montse Puig Farré", "Lleida", "2020-09-07", None, 0),
    ("V12", "Sergio Badia Capdevila", "Lleida", "2024-02-05", None, 0),
]
NUEVOS_COMERCIALES = [
    ("V13", "Marina Sáenz Ochoa", "Logroño", "2026-11-02", None, 0),
    ("V14", "Rubén Ibáñez Garrido", "Logroño", "2026-11-02", None, 0),
]
EXTRA_DTO = {c[0]: c[5] for c in COMERCIALES + NUEVOS_COMERCIALES}
BAJA_V05 = dt.date(2026, 5, 15)

# ---------------------------------------------------------------------------
# 2. Clientes (320)
# ---------------------------------------------------------------------------
POBLACIONES = {
    "Zaragoza": [("Zaragoza", "Zaragoza", 40), ("Utebo", "Zaragoza", 4), ("Cuarte de Huerva", "Zaragoza", 3),
                 ("La Muela", "Zaragoza", 2), ("Calatayud", "Zaragoza", 3), ("Ejea de los Caballeros", "Zaragoza", 3),
                 ("Tarazona", "Zaragoza", 2), ("Caspe", "Zaragoza", 2), ("Alagón", "Zaragoza", 2), ("Zuera", "Zaragoza", 2),
                 ("La Almunia de Doña Godina", "Zaragoza", 2), ("Borja", "Zaragoza", 1), ("Huesca", "Huesca", 5),
                 ("Barbastro", "Huesca", 2), ("Jaca", "Huesca", 2), ("Sabiñánigo", "Huesca", 1), ("Teruel", "Teruel", 3),
                 ("Alcañiz", "Teruel", 2), ("Andorra", "Teruel", 1)],
    "Pamplona": [("Pamplona", "Navarra", 25), ("Burlada", "Navarra", 3), ("Barañáin", "Navarra", 3),
                 ("Villava", "Navarra", 2), ("Tudela", "Navarra", 5), ("Estella-Lizarra", "Navarra", 3),
                 ("Tafalla", "Navarra", 2), ("Zizur Mayor", "Navarra", 2), ("Egüés", "Navarra", 2),
                 ("Alsasua/Altsasu", "Navarra", 1)],
    "Lleida": [("Lleida", "Lleida", 25), ("Balaguer", "Lleida", 4), ("Mollerussa", "Lleida", 3), ("Tàrrega", "Lleida", 3),
               ("Cervera", "Lleida", 2), ("La Seu d'Urgell", "Lleida", 2), ("Alcarràs", "Lleida", 2),
               ("Fraga", "Huesca", 3), ("Binéfar", "Huesca", 2), ("Monzón", "Huesca", 2)],
}
RIOJA = [("Logroño", "La Rioja", 10), ("Calahorra", "La Rioja", 3), ("Haro", "La Rioja", 2), ("Arnedo", "La Rioja", 2),
         ("Lardero", "La Rioja", 1)]
COD_PROV = {"Zaragoza": "50", "Huesca": "22", "Teruel": "44", "Navarra": "31", "Lleida": "25", "La Rioja": "26"}

PREFIJOS = ["Instalaciones Eléctricas", "Electricidad", "Montajes Eléctricos", "Electro", "Instalaciones",
            "Electricidad y Fontanería", "Mantenimientos Industriales", "Reformas", "Climatización y Electricidad",
            "Telecomunicaciones", "Iluminación", "Automatismos", "Construcciones", "Servicios Técnicos"]
RAICES = ["Arnal", "Lasheras", "Bueno", "Lafuente", "Gimeno", "Ibarra", "Echeverría", "Casals", "Aznar", "Lacasa",
          "Pardo", "Uriarte", "Larraz", "Berdún", "Ebro", "Moncayo", "Cinca", "Segre", "Bardenas", "Arga", "Ega",
          "Huerva", "Jalón", "Monegros", "Somontano", "Matarraña", "Noguera", "Urgell", "Garrigues", "Baztán",
          "Roncal", "Salazar", "Najerilla", "Cidacos", "Iregua", "Gállego", "Aragón", "Queiles", "Alcanadre",
          "Turia", "Mijares", "Martín", "Guadalope", "Esera", "Isábena", "Ribagorza", "Sobrarbe", "Tena", "Ansó",
          "Hecho", "Urbasa", "Andía", "Aralar", "Irati", "Leire", "Ujué", "Olite", "Montsec", "Pallars", "Aran",
          "Solsonès", "Segarra", "Pla", "Delta", "Cierzo", "Bochorno", "Albada", "Jota", "Pilar", "Torrero",
          "Delicias", "Actur", "Casetas", "Valdespartera", "Plaza", "Romareda", "Ensanche", "Rochapea", "Txantrea",
          "Iturrama", "Mendebaldea", "Pardinyes", "Cappont", "Seca", "Balàfia", "Magraners", "Bordeta", "Universitat"]
SUFIJOS = ["S.L.", "S.L.", "S.L.", "S.L.U.", "S.A.", "S. Coop."]
NOMBRES_P = ["José Luis", "María Pilar", "Javier", "Ana Belén", "Jesús", "Carmen", "Fernando", "Begoña", "Mikel",
             "Ainhoa", "Jordi", "Núria", "Joan", "Montserrat", "Antonio", "Rosa", "Francisco", "Isabel", "Iker",
             "Laura", "Sergio", "Marta", "Pablo", "Elena", "Ramón", "Lucía", "Xavier", "Mercè", "Unai", "Irene"]
APELLIDOS = ["García", "Pérez", "López", "Martínez", "Sánchez", "Gil", "Navarro", "Serrano", "Lahoz", "Bernal",
             "Murillo", "Zapater", "Goñi", "Elizondo", "Etxarri", "Iriarte", "Arrieta", "Vidal", "Ferrer", "Pujol",
             "Bosch", "Serra", "Coll", "Riba", "Sola", "Moreno", "Royo", "Casanova", "Alonso", "Ruiz"]


def cif_falso(prov):
    """CIF «B» con formato real y dígito de control CAMBIADO (no puede ser de nadie)."""
    cuerpo = COD_PROV[prov] + "".join(str(d) for d in rng.integers(0, 10, 5))
    pares = sum(int(cuerpo[i]) for i in (1, 3, 5))
    impares = 0
    for i in (0, 2, 4, 6):
        d = int(cuerpo[i]) * 2
        impares += d // 10 + d % 10
    control = (10 - (pares + impares) % 10) % 10
    otro = (control + int(rng.integers(1, 10))) % 10
    return "B" + cuerpo + str(otro)


def dni_valido():
    n = int(rng.integers(10_000_000, 80_000_000))
    return f"{n:08d}" + "TRWAGMYFPDXBNJZSQVHLCKE"[n % 23]


def elegir_poblacion(lista):
    pesos = np.array([p[2] for p in lista], float)
    i = rng.choice(len(lista), p=pesos / pesos.sum())
    return lista[i][0], lista[i][1]


def generar_clientes():
    filas = []
    usados = set()
    reparto = [("Zaragoza", 165), ("Pamplona", 67), ("Pamplona-Rioja", 18), ("Lleida", 70)]
    com_por_del = {"Zaragoza": (["V01", "V02", "V03", "V04", "V05", "V06"], [0.20, 0.18, 0.17, 0.19, 0.12, 0.14]),
                   "Pamplona": (["V07", "V08", "V09"], [0.38, 0.27, 0.35]),
                   "Lleida": (["V10", "V11", "V12"], [0.42, 0.35, 0.23])}
    for deleg, n in reparto:
        for _ in range(n):
            if deleg == "Pamplona-Rioja":
                pob, prov = elegir_poblacion(RIOJA)
                d = "Pamplona"
                com = "V08"
            else:
                pob, prov = elegir_poblacion(POBLACIONES[deleg])
                d = deleg
                cods, pw = com_por_del[d]
                com = cods[rng.choice(len(cods), p=pw)]
            if rng.random() < 0.15:  # autónomo
                while True:
                    nom = f"{NOMBRES_P[rng.integers(len(NOMBRES_P))]} {APELLIDOS[rng.integers(len(APELLIDOS))]} {APELLIDOS[rng.integers(len(APELLIDOS))]}"
                    if nom not in usados:
                        break
                nif = dni_valido()
            else:
                while True:
                    nom = f"{PREFIJOS[rng.integers(len(PREFIJOS))]} {RAICES[rng.integers(len(RAICES))]}, {SUFIJOS[rng.integers(len(SUFIJOS))]}"
                    base = nom.split(",")[0]
                    if base not in usados:
                        usados.add(base)
                        break
                nif = cif_falso(prov)
            usados.add(nom)
            filas.append(dict(Nombre=nom, NIF=nif, Poblacion=pob, Provincia=prov, Delegacion=d, Comercial=com,
                              Rioja=(prov == "La Rioja")))
    # orden por nombre «de alta» al azar y códigos C0001…
    orden = rng.permutation(len(filas))
    filas = [filas[i] for i in orden]
    for i, f in enumerate(filas):
        f["CodCliente"] = f"C{i + 1:04d}"
        f["Peso"] = float(rng.lognormal(0, 1.15))          # Pareto de clientes
        f["DtoBase"] = int(rng.choice([15, 20, 25, 30, 35, 40], p=[.08, .17, .27, .26, .15, .07]))
        f["ProntoPago"] = bool(rng.random() < 0.18)
    return pd.DataFrame(filas)


# ---------------------------------------------------------------------------
# 3. Productos (1.800 + 3 especiales) y 7 huérfanos
# ---------------------------------------------------------------------------
PROVEEDORES = {
    "Cable": ["Conductores del Moncayo, S.A.", "Cables Somontano, S.L."],
    "Iluminación": ["Luminotecnia Cierzo Iberia, S.L.", "Ledinor Alumbrado, S.A."],
    "Mecanismos": ["Mecanismos Pirineo Central, S.A.", "Aparellaje Bardenas, S.L."],
    "Protección": ["Aparamenta Eléctrica del Segre, S.A.", "Cuadros y Protecciones Huerva, S.L."],
    "Canalización": ["Plásticos Técnicos Jalón, S.L.", "Canalizaciones Arga, S.A."],
    "Herramienta": ["Herramientas Aneto Profesional, S.L.", "Suministros Industriales Gállego, S.A."],
}
RATIO = {"Cable": 0.56, "Iluminación": 0.44, "Mecanismos": 0.42, "Protección": 0.48, "Canalización": 0.50,
         "Herramienta": 0.55}  # coste / precio de tarifa
OBJETIVO_N = {"Cable": 260, "Iluminación": 420, "Mecanismos": 480, "Protección": 300, "Canalización": 220,
              "Herramienta": 120}
PREFIJO_FAM = {"Cable": "01", "Iluminación": "02", "Mecanismos": "03", "Protección": "04", "Canalización": "05",
               "Herramienta": "06"}


def dec(x):
    """1.5 -> '1,5' (para las descripciones)."""
    s = f"{x:g}"
    return s.replace(".", ",")


def catalogo_base():
    """Lista de (familia, subfamilia, descripcion, coste, por_metro, clase_cantidad)."""
    c = []
    secc = [1.5, 2.5, 4, 6, 10, 16, 25]
    coste_rollo = {1.5: 13.5, 2.5: 21, 4: 33, 6: 49, 10: 82, 16: 128, 25: 198}
    for s in secc:
        for col in ["azul", "marrón", "negro", "gris", "amarillo-verde"]:
            c.append(("Cable", "Cable unipolar", f"Cable H07V-K {dec(s)} mm² {col} rollo 100 m", coste_rollo[s], False, "rollo"))
            c.append(("Cable", "Cable libre de halógenos", f"Cable H07Z1-K (AS) {dec(s)} mm² {col} rollo 100 m", coste_rollo[s] * 1.18, False, "rollo"))
    for n in [2, 3, 4, 5]:
        for s in [1.5, 2.5, 4, 6, 10, 16]:
            c.append(("Cable", "Manguera", f"Manguera RV-K 0,6/1 kV {n}G{dec(s)} mm² (por metro)", 0.12 * n * s ** 0.95 + 0.15, True, "metro"))
            c.append(("Cable", "Cable libre de halógenos", f"Manguera RZ1-K (AS) 0,6/1 kV {n}G{dec(s)} mm² (por metro)", (0.12 * n * s ** 0.95 + 0.15) * 1.15, True, "metro"))
    for s in [16, 25, 35, 50, 70, 95, 120, 150, 185, 240]:
        c.append(("Cable", "Cable libre de halógenos", f"Cable RZ1-K (AS) 0,6/1 kV 1x{s} mm² (por metro)", 0.115 * s, True, "metro"))
    for s in [16, 25, 50, 95, 150, 240]:
        c.append(("Cable", "Cable de aluminio", f"Cable de aluminio XZ1 (S) 0,6/1 kV 1x{s} mm² (por metro)", 0.032 * s + 0.2, True, "metro"))
    for col in ["gris", "azul", "verde"]:
        c.append(("Cable", "Cable de datos", f"Cable UTP Cat6 LSZH {col} bobina 305 m", 96, False, "bobina"))
    c.append(("Cable", "Cable de datos", "Cable FTP Cat6A LSZH bobina 500 m", 265, False, "bobina"))
    for col in ["blanco", "negro"]:
        c.append(("Cable", "Cable de datos", f"Cable coaxial TV 75 ohm {col} rollo 100 m", 38, False, "bobina"))
    for n in [4, 6, 8]:
        c.append(("Cable", "Cable de datos", f"Cable de alarma {n}x0,22 mm² apantallado rollo 100 m", 9 + 2.2 * n, False, "bobina"))
    for s in [0.75, 1, 1.5]:
        for col in ["blanco", "negro", "transparente"]:
            c.append(("Cable", "Cable unipolar", f"Cable paralelo 2x{dec(s)} mm² {col} rollo 100 m", 18 * s + 6, False, "rollo"))
    for s in [4, 6, 10]:
        for col in ["rojo", "negro"]:
            c.append(("Cable", "Cable solar", f"Cable solar H1Z2Z2-K 1x{s} mm² {col} (por metro)", 0.11 * s + 0.25, True, "metro"))
    # Iluminación
    for forma in ["redondo", "cuadrado"]:
        for w in [6, 9, 12, 18, 24]:
            for k in [3000, 4000, 6000]:
                c.append(("Iluminación", "Downlight", f"Downlight LED empotrable {forma} {w} W {k} K", 3.5 + 0.55 * w, False, "ud"))
    for w in [7, 10, 15, 20, 30]:
        for k in [3000, 4000]:
            for col in ["blanco", "negro"]:
                c.append(("Iluminación", "Downlight", f"Downlight LED orientable {w} W {k} K {col}", 6 + 0.7 * w, False, "ud"))
    for w in [36, 40, 48]:
        for k in [4000, 6000]:
            for marco in ["blanco", "gris"]:
                c.append(("Iluminación", "Panel LED", f"Panel LED 60x60 {w} W {k} K marco {marco}", 14 + 0.35 * w, False, "ud"))
    for w in [36, 40]:
        for k in [4000, 6000]:
            c.append(("Iluminación", "Panel LED", f"Panel LED 120x30 {w} W {k} K", 17 + 0.35 * w, False, "ud"))
    for lon, w in [(60, 18), (120, 36), (150, 54)]:
        for k in [4000, 6000]:
            c.append(("Iluminación", "Estanca", f"Pantalla estanca LED IP65 {lon} cm {w} W {k} K", 9 + 0.4 * w, False, "ud"))
    for w in [10, 20, 30, 50, 100, 150, 200]:
        for k in [4000, 6000]:
            for col in ["negro", "gris"]:
                c.append(("Iluminación", "Proyector", f"Proyector LED IP65 {w} W {k} K {col}", 5 + 0.38 * w, False, "ud"))
    for w in [100, 150, 200, 240]:
        for k in [4000, 5000]:
            c.append(("Iluminación", "Industrial", f"Campana LED industrial UFO {w} W {k} K", 28 + 0.4 * w, False, "ud"))
    for wm in [4.8, 9.6, 14.4, 19.2]:
        for k in [2700, 3000, 4000, 6000]:
            for ip in ["IP20", "IP65"]:
                c.append(("Iluminación", "Tira LED", f"Tira LED 24 V {dec(wm)} W/m {k} K {ip} rollo 5 m", 7 + 1.1 * wm + (3 if ip == "IP65" else 0), False, "ud"))
    for base, ws in [("E27", [6, 8, 10, 12, 15]), ("GU10", [5, 7]), ("E14 vela", [4, 6])]:
        for w in ws:
            for k in [2700, 4000, 6000]:
                c.append(("Iluminación", "Lámpara LED", f"Bombilla LED {base} {w} W {k} K", 0.9 + 0.12 * w, False, "ud_peq"))
    for w in [8, 12, 15]:
        for col in ["negro", "blanco", "gris"]:
            for forma in ["redondo", "cuadrado"]:
                c.append(("Iluminación", "Exterior", f"Aplique LED de exterior {forma} {w} W {col}", 9 + 0.6 * w, False, "ud"))
    for lm in [100, 200, 300, 500]:
        for aut in ["1 h", "3 h"]:
            c.append(("Iluminación", "Emergencia", f"Luminaria de emergencia LED {lm} lm autonomía {aut}", 11 + 0.03 * lm, False, "ud"))
    for w in [30, 60, 100, 150, 200]:
        for ip in ["IP20", "IP67"]:
            c.append(("Iluminación", "Driver", f"Fuente de alimentación LED 24 V {w} W {ip}", 7 + 0.12 * w, False, "ud"))
    for tipo in ["de superficie", "para empotrar", "de esquina"]:
        for lon in [1, 2]:
            for dif in ["opal", "transparente"]:
                c.append(("Iluminación", "Tira LED", f"Perfil de aluminio {tipo} para tira LED {lon} m difusor {dif}", 2.5 * lon + 1.5, False, "ud"))
    for w in [10, 20, 30, 40]:
        for k in [3000, 4000]:
            for col in ["blanco", "negro"]:
                c.append(("Iluminación", "Carril", f"Foco LED de carril trifásico {w} W {k} K {col}", 11 + 0.5 * w, False, "ud"))
    for w in [30, 60, 100, 150]:
        c.append(("Iluminación", "Exterior", f"Luminaria LED vial {w} W 4000 K", 45 + 0.5 * w, False, "ud"))
    # Mecanismos (20 elementos × 6 series × 4 acabados)
    elementos = [("Interruptor", 4.1), ("Conmutador", 4.6), ("Cruzamiento", 7.9), ("Pulsador", 4.9),
                 ("Pulsador de timbre", 5.6), ("Base de enchufe schuko", 3.9), ("Base de enchufe schuko con tapa", 6.2),
                 ("Base doble schuko", 9.8), ("Toma TV-R-SAT", 8.7), ("Toma RJ45 Cat6", 9.4),
                 ("Regulador de luz LED", 24.0), ("Marco 1 elemento", 1.6), ("Marco 2 elementos", 3.1),
                 ("Marco 3 elementos", 4.6), ("Marco 4 elementos", 6.2), ("Detector de movimiento empotrable", 28.0),
                 ("Cargador USB doble A+C", 21.0), ("Interruptor bipolar", 8.4), ("Termostato digital", 39.0),
                 ("Pulsador doble de persianas", 11.2)]
    series = [("Moncayo", 1.0), ("Ebro", 1.25), ("Turia", 0.85), ("Aneto", 1.6), ("Gállego", 1.1), ("Segre", 1.4)]
    acabados = [("blanco", 1.0), ("aluminio", 1.25), ("antracita", 1.3), ("crema", 1.05)]
    for e, ce in elementos:
        sub = "Marcos" if e.startswith("Marco") else ("Tomas" if e.startswith(("Base", "Toma", "Cargador")) else "Mandos")
        for s, cs in series:
            for a, ca in acabados:
                c.append(("Mecanismos", sub, f"{e} serie {s} {a}", ce * cs * ca, False, "mec"))
    # Protección
    for p in ["1P+N", "2P", "3P", "4P"]:
        for a in [6, 10, 16, 20, 25, 32, 40, 50, 63]:
            curvas = ["C", "B"] if p in ("1P+N", "2P") else ["C", "D"]
            for cu in curvas:
                for ka in [6, 10]:
                    base = {"1P+N": 5.5, "2P": 9, "3P": 16, "4P": 22}[p]
                    c.append(("Protección", "Magnetotérmicos", f"Interruptor magnetotérmico {p} {a} A curva {cu} {ka} kA",
                              base * (1 + a / 80) * (1.35 if ka == 10 else 1) * (1.2 if cu == "D" else 1), False, "prot"))
    for p in ["2P", "4P"]:
        for a in [25, 40, 63]:
            for s in [30, 300]:
                for cl in ["AC", "A", "A superinmunizado"]:
                    base = {"2P": 24, "4P": 52}[p]
                    c.append(("Protección", "Diferenciales", f"Interruptor diferencial {p} {a} A {s} mA clase {cl}",
                              base * (1 + a / 120) * {"AC": 1, "A": 1.45, "A superinmunizado": 2.3}[cl], False, "prot"))
    for t in ["transitorias tipo 2 2P", "transitorias tipo 2 4P", "permanentes y transitorias 2P",
              "permanentes y transitorias 4P", "transitorias tipo 1+2 2P", "transitorias tipo 1+2 4P"]:
        c.append(("Protección", "Sobretensiones", f"Protector de sobretensiones {t}", 38 if "2P" in t else 85, False, "prot"))
    for m in [4, 8, 12, 18, 24, 36, 48, 72]:
        for mont in ["empotrar", "superficie"]:
            for ip in ["IP40", "IP65"]:
                c.append(("Protección", "Cajas y cuadros", f"Caja de distribución {m} módulos de {mont} {ip}",
                          6 + 0.9 * m * (1.6 if ip == "IP65" else 1), False, "caja"))
    for a in [20, 25, 40, 63]:
        for ct in ["2NA", "4NA", "2NA+2NC"]:
            c.append(("Protección", "Mando y control", f"Contactor modular {a} A {ct}", 14 + 0.4 * a, False, "prot"))
    for t in ["1 canal", "2 canales", "astronómico 1 canal", "astronómico 2 canales"]:
        c.append(("Protección", "Mando y control", f"Interruptor horario digital {t}", 32 if "astro" not in t else 58, False, "prot"))
    for t, amps in [("10x38", [2, 4, 6, 10, 16, 20, 25, 32]), ("14x51", [16, 20, 25, 32, 40, 50]),
                    ("22x58", [32, 40, 50, 63, 80, 100, 125])]:
        for a in amps:
            c.append(("Protección", "Fusibles", f"Fusible cilíndrico gG {t} {a} A", {"10x38": 0.9, "14x51": 1.6, "22x58": 2.8}[t], False, "fus"))
        for p in ["1P", "1P+N", "3P"]:
            c.append(("Protección", "Fusibles", f"Base portafusibles {t} {p}", {"10x38": 3.2, "14x51": 6, "22x58": 11}[t] * {"1P": 1, "1P+N": 1.8, "3P": 2.7}[p], False, "prot"))
    # Canalización
    long_rollo = {16: 100, 20: 100, 25: 50, 32: 50, 40: 25, 50: 25, 63: 25}
    for d in [16, 20, 25, 32, 40, 50, 63]:
        for col in ["gris", "negro", "verde (libre de halógenos)"]:
            c.append(("Canalización", "Tubos", f"Tubo corrugado forrado M{d} {col} rollo {long_rollo[d]} m",
                      (0.09 * d) * long_rollo[d] / 10 * (1.4 if "verde" in col else 1), False, "rollo"))
        for col in ["gris", "negro"]:
            c.append(("Canalización", "Tubos", f"Tubo rígido de PVC M{d} {col} tramo 3 m", 0.06 * d + 0.4, False, "tramo"))
        c.append(("Canalización", "Accesorios", f"Abrazadera para tubo M{d} bolsa 50 uds", 0.08 * d + 2, False, "caja"))
        c.append(("Canalización", "Accesorios", f"Racor para tubo M{d} IP65 bolsa 10 uds", 0.12 * d + 2.5, False, "caja"))
    for a, b in [(10, 20), (16, 30), (25, 40), (40, 60), (60, 110), (90, 160)]:
        for col in ["blanco", "gris"]:
            c.append(("Canalización", "Canaletas", f"Canaleta de PVC {a}x{b} mm {col} tramo 2 m", 0.0011 * a * b + 0.9, False, "tramo"))
    for a, b in [(60, 110), (90, 160)]:
        for col in ["blanco", "gris"]:
            c.append(("Canalización", "Canaletas", f"Canal portamecanismos {a}x{b} mm {col} tramo 2 m", 0.0016 * a * b + 3, False, "tramo"))
    for a in [60, 100]:
        for b in [100, 200, 300, 400, 500, 600]:
            c.append(("Canalización", "Bandejas", f"Bandeja perforada galvanizada {a}x{b} mm tramo 3 m", 0.0009 * a * b + 6, False, "tramo"))
    for a, b in [(35, 100), (35, 200), (60, 200), (60, 300), (60, 400)]:
        for mat in ["electrocincada", "de acero inoxidable"]:
            c.append(("Canalización", "Bandejas", f"Bandeja de rejilla {mat} {a}x{b} mm tramo 3 m", (0.0012 * a * b + 5) * (2.6 if "inox" in mat else 1), False, "tramo"))
    for a, b in [(80, 80), (100, 100), (150, 110), (220, 170), (300, 220)]:
        for ip in ["IP55", "IP65"]:
            c.append(("Canalización", "Cajas", f"Caja de registro estanca {a}x{b} mm {ip}", 0.00012 * a * b + 0.8, False, "caja"))
    for a, b in [(100, 100), (160, 100), (200, 130)]:
        c.append(("Canalización", "Cajas", f"Caja de derivación de empotrar {a}x{b} mm", 0.00008 * a * b + 0.5, False, "caja"))
    c.append(("Canalización", "Cajas", "Caja universal de empotrar enlazable", 0.18, False, "mec"))
    c.append(("Canalización", "Cajas", "Caja de mecanismos para tabique de pladur", 0.32, False, "mec"))
    for lon, an in [(100, 2.5), (200, 4.8), (300, 4.8), (370, 7.6)]:
        for col in ["blanco", "negro"]:
            c.append(("Canalización", "Accesorios", f"Brida de nailon {lon}x{dec(an)} mm {col} bolsa 100 uds", 0.006 * lon + 0.4, False, "caja"))
    # Herramienta
    herr = [("Pelacables automático 0,2-6 mm²", 18), ("Tenaza crimpadora para terminales aislados", 24),
            ("Tenaza crimpadora RJ45", 21), ("Alicate universal aislado 1000 V 180 mm", 14),
            ("Alicate de corte diagonal aislado 160 mm", 13), ("Alicate de puntas planas aislado 200 mm", 13.5),
            ("Juego de destornilladores aislados 1000 V 7 piezas", 29), ("Detector de tensión sin contacto", 16),
            ("Comprobador de tensión bipolar", 38), ("Multímetro digital CAT III 600 V", 42),
            ("Pinza amperimétrica CAT III", 68), ("Medidor de aislamiento digital", 310),
            ("Comprobador de instalaciones multifunción", 980), ("Medidor de distancias láser 40 m", 55),
            ("Nivel láser de líneas cruzadas", 95), ("Taladro percutor 18 V con 2 baterías", 165),
            ("Atornillador de impacto 18 V", 135), ("Rozadora de pared 1700 W", 310), ("Sierra de calar 650 W", 85),
            ("Amoladora angular 125 mm 900 W", 62), ("Juego de brocas para hormigón 8 piezas", 14),
            ("Corona para cajas de mecanismos 68 mm", 19), ("Cuchillo de electricista aislado", 11),
            ("Tijera de electricista", 9.5), ("Martillo de carpintero 500 g", 9), ("Linterna frontal LED recargable", 19),
            ("Caja de herramientas con ruedas", 45), ("Bolsa portaherramientas", 28),
            ("Guantes aislantes clase 0", 39), ("Gafas de protección", 4.5), ("Pistola de silicona", 7),
            ("Grapadora de cable", 32), ("Soldador eléctrico 60 W", 18), ("Termómetro de infrarrojos", 34),
            ("Cortatubos para PVC hasta 42 mm", 16), ("Llave ajustable 250 mm", 12), ("Juego de llaves Allen 9 piezas", 8)]
    for n, co in herr:
        c.append(("Herramienta", "Herramienta manual" if co < 40 else "Medida y máquinas", n, co, False, "herr"))
    for mm in ["2,5", "4", "5,5", "6,5"]:
        c.append(("Herramienta", "Herramienta manual", f"Destornillador aislado plano {mm} mm", 4.8, False, "herr"))
    for n in [1, 2, 3]:
        c.append(("Herramienta", "Herramienta manual", f"Destornillador aislado Pozidriv PZ{n}", 5.2, False, "herr"))
    for lon in [10, 15, 20, 30]:
        c.append(("Herramienta", "Herramienta manual", f"Guía pasacables de nailon {lon} m", 6 + 0.25 * lon, False, "herr"))
    for col in ["negro", "azul", "marrón", "amarillo-verde", "gris"]:
        c.append(("Herramienta", "Consumibles", f"Cinta aislante de PVC 19 mm x 20 m {col}", 0.85, False, "cinta"))
    for n in [4, 5, 6, 7]:
        c.append(("Herramienta", "Medida y máquinas", f"Escalera de fibra de vidrio {n} peldaños", 70 + 9 * n, False, "herr"))
    return c


def generar_productos():
    base = catalogo_base()
    filas = []
    usados = set()
    for fam in FAMILIAS:
        items = [x for x in base if x[0] == fam]
        candidatos = [(x, prov) for x in items for prov in PROVEEDORES[fam]]
        n = min(OBJETIVO_N[fam], len(candidatos))
        elegidos = rng.choice(len(candidatos), size=n, replace=False)
        for i in sorted(elegidos):
            (f, sub, desc, coste, por_metro, clase), prov = candidatos[i]
            while True:
                cod = PREFIJO_FAM[fam] + f"{int(rng.integers(0, 10000)):04d}"
                if cod not in usados:
                    usados.add(cod)
                    break
            coste_real = coste * float(rng.lognormal(0, 0.06)) * (1.07 if prov == PROVEEDORES[fam][1] else 1)
            filas.append(dict(CodProducto=cod, Descripcion=desc, Familia=fam, Subfamilia=sub, Coste0=coste_real,
                              Proveedor=prov, PorMetro=por_metro, Clase=clase,
                              Tarifa0=coste_real / RATIO[fam] * float(rng.lognormal(0, 0.05)),
                              Peso=float(rng.lognormal(0, 1.35)), Huerfano=False, Desde=1))
    prods = pd.DataFrame(filas)
    # 7 códigos nuevos (alta en el ERP en julio; el maestro es una exportación anterior)
    huerf = [("021487", "Iluminación", "Downlight", "Downlight LED empotrable redondo 15 W CCT seleccionable", 9.8, "ud"),
             ("033902", "Mecanismos", "Tomas", "Base de enchufe schuko con USB A+C serie Moncayo blanco", 14.2, "mec"),
             ("045511", "Protección", "Diferenciales", "Interruptor diferencial 4P 40 A 30 mA clase F", 118.0, "prot"),
             ("010777", "Cable", "Cable libre de halógenos", "Manguera RZ1-K (AS) 0,6/1 kV 3G2,5 mm² gris (por metro)", 1.28, "metro"),
             ("052230", "Canalización", "Bandejas", "Bandeja perforada galvanizada 60x300 mm con tapa tramo 3 m", 48.0, "tramo"),
             ("061904", "Herramienta", "Medida y máquinas", "Comprobador de instalaciones fotovoltaicas", 640.0, "herr"),
             ("024418", "Iluminación", "Tira LED", "Tira LED COB 24 V 10 W/m 4000 K IP20 rollo 5 m", 17.5, "ud")]
    filas_h = []
    for cod, fam, sub, desc, coste, clase in huerf:
        assert cod not in usados
        filas_h.append(dict(CodProducto=cod, Descripcion=desc, Familia=fam, Subfamilia=sub, Coste0=coste,
                            Proveedor=PROVEEDORES[fam][0], PorMetro=(clase == "metro"), Clase=clase,
                            Tarifa0=coste / RATIO[fam], Peso=0.0, Huerfano=True, Desde=7))
    prods = pd.concat([prods, pd.DataFrame(filas_h)], ignore_index=True)
    return prods


ESPECIALES = [
    dict(CodProducto="090001", Descripcion="PORTES", Familia="Portes y servicios", Subfamilia="Portes",
         Coste0=7.9, Proveedor="Transportes Cierzo Exprés, S.L.", Tarifa=9.50),
    dict(CodProducto="090002", Descripcion="PORTES URGENTES 24 H", Familia="Portes y servicios", Subfamilia="Portes",
         Coste0=15.3, Proveedor="Transportes Cierzo Exprés, S.L.", Tarifa=18.00),
    dict(CodProducto="099001", Descripcion="DTO. PRONTO PAGO", Familia="Ajustes", Subfamilia="Descuentos financieros",
         Coste0=0.0, Proveedor="", Tarifa=0.0),
]

# cantidad por línea según la clase de artículo: (mu, sigma, mínimo, máximo, múltiplo)
CANTIDAD = {"rollo": (1.2, 0.8, 1, 40, 1), "metro": (4.6, 0.7, 25, 1500, 25), "bobina": (0.5, 0.6, 1, 8, 1),
            "ud": (1.9, 0.9, 1, 120, 1), "ud_peq": (2.6, 0.8, 1, 200, 1), "mec": (2.4, 0.8, 1, 300, 1),
            "prot": (1.7, 0.8, 1, 60, 1), "caja": (1.1, 0.7, 1, 30, 1), "fus": (2.2, 0.6, 1, 100, 1),
            "tramo": (2.5, 0.8, 1, 150, 1), "herr": (0.6, 0.5, 1, 8, 1), "cinta": (3.0, 0.6, 5, 200, 5)}
MULT_CANTIDAD = 2.05   # calibración del importe total (≈ 7,9 M€)

# ---------------------------------------------------------------------------
# 4. Calendario
# ---------------------------------------------------------------------------
FESTIVOS = {dt.date(2026, 1, 1), dt.date(2026, 1, 6), dt.date(2026, 4, 2), dt.date(2026, 4, 3),
            dt.date(2026, 5, 1), dt.date(2026, 10, 12), dt.date(2026, 11, 2)}
# Solo se evitan fines de semana y fiestas comunes; ningún ejercicio depende del calendario.


def laborables(mes):
    d = dt.date(2026, mes, 1)
    dias = []
    while d.month == mes:
        if d.weekday() < 5 and d not in FESTIVOS:
            dias.append(d)
        d += dt.timedelta(days=1)
    return dias


LINEAS_MES = {1: 1150, 2: 1180, 3: 1290, 4: 1250, 5: 1310, 6: 1290, 7: 1200, 8: 800, 9: 1260, 10: 1280, 11: 1270}
# venta objetivo de cada mes (líneas de producto y portes): estacionalidad con agosto ≈ −35 %
VALOR_MES = {m: 790_000 * f for m, f in {1: 0.95, 2: 0.97, 3: 1.06, 4: 1.03, 5: 1.08, 6: 1.07, 7: 1.00, 8: 0.66,
                                          9: 1.06, 10: 1.12, 11: 1.05}.items()}


def cantidad(clase):
    mu, sg, lo, hi, mult = CANTIDAD[clase]
    q = float(np.exp(rng.normal(mu, sg))) * MULT_CANTIDAD
    q = int(round(q / mult)) * mult
    return int(min(max(q, lo), hi))


def comercial_en(cli, fecha):
    if fecha.month == 11 and cli["Rioja"]:
        return "V13" if int(cli["CodCliente"][1:]) % 2 else "V14"
    com = cli["Comercial"]
    if com == "V05" and fecha > BAJA_V05:
        return "V06"
    return com


def delegacion_en(cli, fecha):
    if fecha.month == 11 and cli["Rioja"]:
        return "Logroño"
    return cli["Delegacion"]


def generar_mes(mes, clientes, prods, pesos_prod_mes, historial):
    """Devuelve una lista de líneas (dict) VERDADERAS del mes."""
    dias = laborables(mes)
    objetivo = LINEAS_MES[mes]
    n_dev = int(round(objetivo * 0.022))
    n_pp = int(round(objetivo * 0.03))
    lineas = []
    cli_p = clientes["Peso"].to_numpy()
    cli_p = cli_p / cli_p.sum()
    p_prod = pesos_prod_mes / pesos_prod_mes.sum()
    albaranes = []
    valor = 0.0
    while valor < VALOR_MES[mes]:
        ic = int(rng.choice(len(clientes), p=cli_p))
        cli = clientes.iloc[ic]
        fecha = dias[int(rng.integers(len(dias)))]
        com = comercial_en(cli, fecha)
        deleg = delegacion_en(cli, fecha)
        n = int(min(1 + rng.geometric(0.42) - 1, 9)) + 0
        n = max(1, n)
        alb = dict(cliente=cli["CodCliente"], fecha=fecha, idx=len(albaranes))
        albaranes.append(alb)
        importe_alb = 0.0
        for _ in range(n):
            ip = int(rng.choice(len(prods), p=p_prod))
            pr = prods.iloc[ip]
            q = cantidad(pr["Clase"])
            dto = cli["DtoBase"] + EXTRA_DTO[com] + int(rng.choice([-5, 0, 0, 0, 5]))
            if pr["Familia"] == "Herramienta":
                dto = min(dto, 20)
            dto = int(min(max(dto, 0), 55))
            precio = round(pr["Tarifa"], 4 if pr["PorMetro"] else 2)
            imp = round(q * precio * (1 - dto / 100) + 1e-9, 2)
            importe_alb += imp
            valor += imp
            lineas.append(dict(Fecha=fecha, alb=alb["idx"], CodCliente=cli["CodCliente"], CodProducto=pr["CodProducto"],
                               Descripcion=pr["Descripcion"], Cantidad=q, PrecioUnitario=precio, DtoLinea=dto,
                               ImporteNeto=imp, Delegacion=deleg, CodComercial=com, tipo="venta"))
        if importe_alb < 180 and rng.random() < 0.55 or rng.random() < 0.04:
            urg = rng.random() < 0.25
            sp = ESPECIALES[1] if urg else ESPECIALES[0]
            lineas.append(dict(Fecha=fecha, alb=alb["idx"], CodCliente=cli["CodCliente"], CodProducto=sp["CodProducto"],
                               Descripcion=sp["Descripcion"], Cantidad=1, PrecioUnitario=sp["Tarifa"], DtoLinea=0,
                               ImporteNeto=sp["Tarifa"], Delegacion=deleg, CodComercial=com, tipo="portes"))
    # devoluciones: de líneas de venta anteriores del mismo cliente
    candidatas = [l for l in historial + lineas if l["tipo"] == "venta"]
    for _ in range(n_dev):
        o = candidatas[int(rng.integers(len(candidatas)))]
        cli = clientes.loc[clientes["CodCliente"] == o["CodCliente"]].iloc[0]
        posteriores = [d for d in dias if d >= o["Fecha"]] or dias
        fecha = posteriores[int(rng.integers(len(posteriores)))]
        q = -max(1, int(round(o["Cantidad"] * float(rng.uniform(0.1, 0.6)))))
        imp = round(q * o["PrecioUnitario"] * (1 - o["DtoLinea"] / 100) - 1e-9, 2)
        lineas.append(dict(Fecha=fecha, alb=None, CodCliente=o["CodCliente"], CodProducto=o["CodProducto"],
                           Descripcion=o["Descripcion"], Cantidad=q, PrecioUnitario=o["PrecioUnitario"],
                           DtoLinea=o["DtoLinea"], ImporteNeto=imp, Delegacion=delegacion_en(cli, fecha),
                           CodComercial=comercial_en(cli, fecha), tipo="devolucion"))
    return lineas, albaranes


def numerar(lineas, mes, contadores):
    """NumAlbaran (A26-), NumFactura (F26- por cliente y quincena; R26- en devoluciones)."""
    df = pd.DataFrame(lineas)
    df["quincena"] = np.where(pd.to_datetime(df["Fecha"]).dt.day <= 15, 1, 2)
    # albaranes de venta numerados por fecha
    alb = df.loc[df["alb"].notna(), ["alb", "Fecha"]].drop_duplicates("alb").sort_values(["Fecha", "alb"])
    mapa_alb = {}
    for a in alb["alb"]:
        contadores["alb"] += 1
        mapa_alb[a] = f"A26-{contadores['alb']:06d}"
    df["NumAlbaran"] = df["alb"].map(mapa_alb)
    # facturas: cliente + quincena (solo ventas y portes)
    ventas = df["tipo"].isin(["venta", "portes"])
    claves = df.loc[ventas].groupby(["CodCliente", "quincena"])["Fecha"].max().reset_index().sort_values(["Fecha", "CodCliente"])
    mapa_f = {}
    for _, r in claves.iterrows():
        contadores["fac"] += 1
        mapa_f[(r["CodCliente"], r["quincena"])] = f"F26-{contadores['fac']:06d}"
    df.loc[ventas, "NumFactura"] = [mapa_f[(c, q)] for c, q in zip(df.loc[ventas, "CodCliente"], df.loc[ventas, "quincena"])]
    # devoluciones: albarán de devolución y factura rectificativa propios
    dev = df.index[df["tipo"] == "devolucion"]
    for i in sorted(dev, key=lambda i: df.at[i, "Fecha"]):
        contadores["alb"] += 1
        contadores["rec"] += 1
        df.at[i, "NumAlbaran"] = f"A26-{contadores['alb']:06d}"
        df.at[i, "NumFactura"] = f"R26-{contadores['rec']:06d}"
    return df, mapa_f


def pronto_pago(df, clientes, mes):
    """Líneas DTO. PRONTO PAGO: −2 % de la factura, sin albarán, el último día facturado."""
    pp_cli = set(clientes.loc[clientes["ProntoPago"], "CodCliente"])
    n_pp = int(round(LINEAS_MES[mes] * 0.03))
    fact = (df[df["tipo"].isin(["venta", "portes"]) & df["CodCliente"].isin(pp_cli)]
            .groupby("NumFactura").agg(CodCliente=("CodCliente", "first"), Fecha=("Fecha", "max"),
                                       Importe=("ImporteNeto", "sum"), Delegacion=("Delegacion", "first"),
                                       CodComercial=("CodComercial", "last")).reset_index())
    fact = fact[fact["Importe"] > 300]
    elegidas = fact.iloc[rng.choice(len(fact), size=min(n_pp, len(fact)), replace=False)]
    filas = []
    for _, f in elegidas.iterrows():
        imp = -round(f["Importe"] * 0.02, 2)
        filas.append(dict(Fecha=f["Fecha"], alb=None, CodCliente=f["CodCliente"], CodProducto="099001",
                          Descripcion="DTO. PRONTO PAGO", Cantidad=1, PrecioUnitario=imp, DtoLinea=0, ImporteNeto=imp,
                          Delegacion=f["Delegacion"], CodComercial=f["CodComercial"], tipo="prontopago",
                          NumAlbaran=None, NumFactura=f["NumFactura"]))
    return pd.DataFrame(filas)


def main(factor_h=1.0):
    global rng
    rng = np.random.default_rng(SEED)   # cada intento empieza igual: el resultado es reproducible
    clientes = generar_clientes()
    prods = generar_productos()
    prods["Tarifa"] = prods["Tarifa0"]
    # pesos de venta por familia (reparto realista de líneas)
    peso_fam = {"Cable": 0.25, "Iluminación": 0.22, "Mecanismos": 0.17, "Protección": 0.28, "Canalización": 0.15,
                "Herramienta": 0.06}
    for fam in FAMILIAS:
        m = prods["Familia"] == fam
        prods.loc[m, "Peso"] = prods.loc[m, "Peso"] / prods.loc[m & ~prods["Huerfano"], "Peso"].sum() * peso_fam[fam]
    # los 7 huérfanos: peso alto desde julio (≈ 1,2 % de la venta)
    prods.loc[prods["Huerfano"], "Peso"] = [x * factor_h for x in [0.0057, 0.0073, 0.0023, 0.0057, 0.0039, 0.0020, 0.0057]]

    todas = []
    historial = []
    contadores = {"alb": 0, "fac": 0, "rec": 0}
    for mes in range(1, 12):
        pesos = prods["Peso"].to_numpy().copy()
        pesos[(prods["Desde"] > mes).to_numpy()] = 0.0
        lineas, _ = generar_mes(mes, clientes, prods, pesos, historial)
        df, _ = numerar(lineas, mes, contadores)
        pp = pronto_pago(df, clientes, mes)
        df = pd.concat([df, pp], ignore_index=True)
        df["Mes"] = mes
        # orden de exportación del ERP: por fecha y albarán; el pronto pago al final de su día
        df["orden_tipo"] = df["tipo"].map({"venta": 0, "portes": 0, "devolucion": 1, "prontopago": 2})
        df = df.sort_values(["Fecha", "orden_tipo", "NumAlbaran"], na_position="last", kind="mergesort").reset_index(drop=True)
        todas.append(df)
        historial += lineas
    ventas = pd.concat(todas, ignore_index=True)

    # ---- costes: estándar (maestro) y real de la línea (desde julio) ----
    especiales = pd.DataFrame(ESPECIALES)
    coste0 = pd.concat([prods.set_index("CodProducto")["Coste0"], especiales.set_index("CodProducto")["Coste0"]])
    fam_de = pd.concat([prods.set_index("CodProducto")["Familia"], especiales.set_index("CodProducto")["Familia"]])
    ventas["Familia_v"] = ventas["CodProducto"].map(fam_de)
    deriva = {cod: float(rng.normal(1.065 if fam_de[cod] == "Cable" else 1.02, 0.025)) for cod in coste0.index}
    ventas["CosteEstd0"] = ventas["CodProducto"].map(coste0)
    f_linea = np.array([deriva[c] * (1 + 0.006 * (m - 7)) * float(rng.normal(1, 0.01))
                        for c, m in zip(ventas["CodProducto"], ventas["Mes"])])
    ventas["CosteUnit0"] = np.where(ventas["Mes"] >= 7, ventas["CosteEstd0"] * f_linea, np.nan)
    # calibración: margen total ene-oct ≈ 27,5 %
    eo = ventas["Mes"] <= 10
    coste_regla = np.where(ventas["Mes"] >= 7, ventas["CosteUnit0"], ventas["CosteEstd0"]) * ventas["Cantidad"]
    k = (1 - 0.275) * ventas.loc[eo, "ImporteNeto"].sum() / coste_regla[eo.to_numpy()].sum()
    prods["CosteEstandar"] = (prods["Coste0"] * k).round(4)
    especiales["CosteEstandar"] = (especiales["Coste0"] * k).round(4)
    ce = pd.concat([prods.set_index("CodProducto")["CosteEstandar"], especiales.set_index("CodProducto")["CosteEstandar"]])
    ventas["CosteEstandar"] = ventas["CodProducto"].map(ce)
    ventas["CosteUnitario"] = np.where(ventas["Mes"] >= 7, (ventas["CosteEstd0"] * k * f_linea).round(4), np.nan)
    ventas.loc[ventas["CodProducto"] == "099001", "CosteUnitario"] = np.where(ventas.loc[ventas["CodProducto"] == "099001", "Mes"] >= 7, 0.0, np.nan)

    # ---- verdad limpia ----
    ventas["Archivo"] = ["ventas_2026_%02d.csv" % m for m in ventas["Mes"]]
    ventas["Familia"] = ventas["Familia_v"]
    huerf = set(prods.loc[prods["Huerfano"], "CodProducto"])
    ventas["FamiliaInforme"] = np.where(ventas["CodProducto"].isin(huerf), "Sin clasificar", ventas["Familia"])
    ventas["Coste"] = np.where(ventas["CosteUnitario"].notna(), ventas["CosteUnitario"], ventas["CosteEstandar"]) * ventas["Cantidad"]
    ventas["Margen"] = ventas["ImporteNeto"] - ventas["Coste"]

    # ---- comprobaciones de calibración ----
    v = ventas[ventas["Mes"] <= 10]
    tot = v["ImporteNeto"].sum()
    marg = v["Margen"].sum() / tot
    por_mes = v.groupby("Mes")["ImporteNeto"].sum()
    com = v[v["Familia"] != "Ajustes"].groupby("CodComercial")[["ImporteNeto", "Margen"]].sum()
    com["pct"] = com["Margen"] / com["ImporteNeto"]
    print(f"Líneas ene-oct: {len(v)}  ventas: {tot:,.2f}  margen: {marg:.4f}")
    print("Por mes:", (por_mes / 1000).round(0).to_dict())
    print("Agosto frente a la media del resto:", round(por_mes[8] / por_mes.drop(8).mean() - 1, 3))
    print("Margen por comercial:", com["pct"].round(3).to_dict())
    print("Peso huérfanos:", round(v.loc[v["FamiliaInforme"] == "Sin clasificar", "ImporteNeto"].sum() / tot, 4))
    print("Por delegación:", v.groupby("Delegacion")["ImporteNeto"].sum().round(0).to_dict())
    print("Por familia:", v.groupby("Familia")["ImporteNeto"].sum().round(0).to_dict())
    assert 11500 <= len(v) <= 12500
    assert 7.6e6 <= tot <= 8.2e6, tot
    assert abs(marg - 0.275) < 0.004, marg
    bajos = sorted(com.index[com["pct"] < 0.22])
    assert bajos == ["V03", "V09"], com["pct"]
    assert com.drop(["V03", "V09"])["pct"].min() > 0.24, com["pct"]
    peso_h = v.loc[v["FamiliaInforme"] == "Sin clasificar", "ImporteNeto"].sum() / tot
    assert 0.010 <= peso_h <= 0.015, peso_h
    assert v.loc[v["FamiliaInforme"] == "Sin clasificar", "CodProducto"].value_counts().min() >= 3
    assert -0.40 <= por_mes[8] / por_mes.drop(8).mean() - 1 <= -0.30

    # ---- 2025 (resumen por delegación y familia, solo las 6 familias de producto) ----
    crec = {"Zaragoza": 1.060, "Pamplona": 1.040, "Lleida": 1.160}
    prod6 = v[v["Familia"].isin(FAMILIAS)].groupby(["Delegacion", "Familia", "Mes"])["ImporteNeto"].sum()
    filas25 = []
    # 2025 con su propia estacionalidad (agosto también a la baja) y ruido propio por celda
    seas25 = {1: 0.97, 2: 0.95, 3: 1.04, 4: 1.06, 5: 1.05, 6: 1.10, 7: 0.98, 8: 0.64, 9: 1.08, 10: 1.10, 11: 1.03, 12: 0.80}
    seas26 = {m: VALOR_MES[m] / 790_000 for m in range(1, 11)}
    for d in ["Zaragoza", "Pamplona", "Lleida"]:
        for fam in FAMILIAS:
            fila = {"Delegacion": "Lérida" if d == "Lleida" else d, "Familia": fam}
            anual26 = sum(prod6.get((d, fam, m), 0.0) for m in range(1, 11))
            ritmo = anual26 / sum(seas26.values()) / crec[d]
            for m in range(1, 13):
                fila[MESES_ABR[m - 1]] = round(ritmo * seas25[m] * float(rng.normal(1, 0.06)), 2)
            filas25.append(fila)
    v2025 = pd.DataFrame(filas25)

    # ---- objetivos 2026 por comercial y mes (ritmo anual × estacionalidad; revisados tras la baja de V05) ----
    fac_del = {"Zaragoza": 1.00, "Pamplona": 1.08, "Lleida": 0.95}
    computable = ventas[(ventas["Familia"] != "Ajustes")]
    real_cm = computable.groupby(["CodComercial", "Mes"])["ImporteNeto"].sum()
    seas_obj = {**seas26, 11: 1.05, 12: 0.80}
    filas_obj = []
    for cod, nom, deleg, alta, baja, _ in COMERCIALES:
        f_com = fac_del[deleg] * float(rng.normal(1, 0.035))
        fila = {"CodComercial": cod, "Comercial": nom}
        tramos = [(1, 5), (6, 10)] if cod in ("V05", "V06") else [(1, 10)]
        ritmo = {}
        for ini, fin in tramos:
            r_ = sum(real_cm.get((cod, m), 0.0) for m in range(ini, fin + 1))
            s_ = sum(seas_obj[m] for m in range(ini, fin + 1))
            ritmo[(ini, fin)] = r_ / s_ if s_ else 0.0
        for m in range(1, 13):
            r_m = ritmo[(1, 10)] if (1, 10) in ritmo else (ritmo[(1, 5)] if m <= 5 else ritmo[(6, 10)])
            if cod == "V05" and m > 5:
                fila[MESES_ABR[m - 1]] = None
            else:
                medio = 0.5 if (cod == "V05" and m == 5) else 1.0   # baja el 15/05: medio mes
                fila[MESES_ABR[m - 1]] = float(round(r_m * seas_obj[m] * f_com * medio / 500) * 500)
        filas_obj.append(fila)
    objetivos = pd.DataFrame(filas_obj)

    # ---- control del ERP (la verdad para cuadrar) ----
    ctrl = v.groupby("Mes").agg(NumLineas=("ImporteNeto", "size"), ImporteNeto=("ImporteNeto", "sum")).reset_index()
    ctrl["ImporteNeto"] = ctrl["ImporteNeto"].round(2)
    ctrl["Archivo"] = ["ventas_2026_%02d.csv" % m for m in ctrl["Mes"]]

    # =====================================================================
    # 5. Escribir los CSV con la suciedad
    # =====================================================================
    log = []
    if os.path.exists(CARPETA):
        shutil.rmtree(CARPETA)
    d_erp = os.path.join(CARPETA, "Ventas", "ERP")
    d_mae = os.path.join(CARPETA, "Ventas", "Maestros")
    d_inf = os.path.join(CARPETA, "Ventas", "Informe")
    d_dic = os.path.join(CARPETA, "Ventas", "Llega_en_diciembre")
    for d in (d_erp, d_mae, d_inf, d_dic):
        os.makedirs(d)

    variantes = {"Zaragoza": (["Zaragoza", "ZARAGOZA", "Zgz", "Zaragoza "], [0.58, 0.25, 0.12, 0.05]),
                 "Pamplona": (["Pamplona/Iruña", "Pamplona/Iruña "], [0.93, 0.07]),
                 "Lleida": (["Lleida", "Lérida", "Lleida "], [0.66, 0.30, 0.04]),
                 "Logroño": (["Logroño"], [1.0])}

    def num_erp(x, dec_, sep_dec=","):
        if x is None or (isinstance(x, float) and np.isnan(x)):
            return ""
        s = f"{x:.{dec_}f}"
        return s.replace(".", sep_dec)

    def num_excel(x):
        """Como lo guarda Excel con formato General (sin ceros decimales al final)."""
        if x is None or (isinstance(x, float) and np.isnan(x)):
            return ""
        s = repr(round(float(x), 10))
        if s.endswith(".0"):
            s = s[:-2]
        return s.replace(".", ",")

    por_metro = prods.set_index("CodProducto")["PorMetro"].to_dict()
    for mes in range(1, 12):
        dm = ventas[ventas["Mes"] == mes].reset_index(drop=True)
        archivo = "ventas_2026_%02d.csv" % mes
        sep, dsep = ",", "."
        if mes != 3:
            sep, dsep = ";", ","
        cab = ["Fecha", "NumAlbaran", "NumFactura", "CodCliente", "CodProducto", "Descripcion", "Cantidad",
               "PrecioUnitario", "DtoLinea", "ImporteNeto", "Delegacion", "CodComercial"]
        if mes >= 7:
            cab.append("CosteUnitario")
        cab_esc = list(cab)
        if mes == 11:
            cab_esc[cab_esc.index("ImporteNeto")] = "Importe Neto"
        buf = io.StringIO()
        w = csv.writer(buf, delimiter=sep, quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
        if mes == 5:
            buf.write("Listado de ventas por línea · Mayo 2026 · Generado el 01/06/2026 7:15\r\n")
            log.append(dict(archivo=archivo, fila=1, columna="(toda)", problema="Q11",
                            valor_original="(sin línea de título)", valor_en_archivo="línea de título antes de los encabezados"))
        w.writerow(cab_esc)
        primera = 3 if mes == 5 else 2
        for i, r in dm.iterrows():
            fila_archivo = primera + i
            f = r["Fecha"]
            fecha = f"{f.month}/{f.day}/{f.year}" if mes == 3 else f.strftime("%d/%m/%Y")
            cod = r["CodProducto"]
            if mes == 8:
                cod_esc = str(int(cod))
                log.append(dict(archivo=archivo, fila=fila_archivo, columna="CodProducto", problema="Q13",
                                valor_original=cod, valor_en_archivo=cod_esc))
            else:
                cod_esc = cod
            dele = r["Delegacion"]
            ops, pw = variantes[dele]
            dele_esc = ops[int(rng.choice(len(ops), p=pw))]
            if dele_esc != dele:
                log.append(dict(archivo=archivo, fila=fila_archivo, columna="Delegacion",
                                problema="Q04" if dele_esc.strip() == dele else "Q08",
                                valor_original=dele, valor_en_archivo=dele_esc))
            if r["Cantidad"] < 0:
                log.append(dict(archivo=archivo, fila=fila_archivo, columna="Cantidad", problema="Q14",
                                valor_original=r["Cantidad"], valor_en_archivo=r["Cantidad"]))
            if cod in huerf:
                log.append(dict(archivo=archivo, fila=fila_archivo, columna="CodProducto", problema="Q16",
                                valor_original=cod, valor_en_archivo=cod_esc))
            pm = bool(por_metro.get(cod, False))
            if mes == 8:
                numeros = [str(int(r["Cantidad"])), num_excel(r["PrecioUnitario"]), num_excel(r["DtoLinea"]),
                           num_excel(r["ImporteNeto"])]
            else:
                numeros = [str(int(r["Cantidad"])), num_erp(r["PrecioUnitario"], 4 if pm else 2, dsep),
                           num_erp(float(r["DtoLinea"]), 2, dsep), num_erp(r["ImporteNeto"], 2, dsep)]
            fila = [fecha, "" if pd.isna(r["NumAlbaran"]) else r["NumAlbaran"], r["NumFactura"], r["CodCliente"], cod_esc, r["Descripcion"]] + numeros + \
                   [dele_esc, r["CodComercial"]]
            if mes >= 7:
                fila.append(num_excel(r["CosteUnitario"]) if mes == 8 else num_erp(r["CosteUnitario"], 4, dsep))
            w.writerow(fila)
        destino = d_dic if mes == 11 else d_erp
        with open(os.path.join(destino, archivo), "w", encoding="utf-8-sig", newline="") as fh:
            fh.write(buf.getvalue())
        if mes == 3:
            log.append(dict(archivo=archivo, fila=0, columna="(archivo)", problema="Q19",
                            valor_original="; · coma decimal · DD/MM/AAAA",
                            valor_en_archivo=", · punto decimal · M/D/AAAA (configuración de EE. UU.)"))
        if mes >= 7 and mes <= 10:
            log.append(dict(archivo=archivo, fila=1, columna="CosteUnitario", problema="Q18",
                            valor_original="(12 columnas)", valor_en_archivo="13.ª columna nueva desde julio"))
        if mes == 11:
            log.append(dict(archivo=archivo, fila=1, columna="ImporteNeto", problema="Q18",
                            valor_original="ImporteNeto", valor_en_archivo="Importe Neto"))
    shutil.copyfile(os.path.join(d_erp, "ventas_2026_09.csv"), os.path.join(d_erp, "ventas_2026_09 - copia.csv"))
    log.append(dict(archivo="ventas_2026_09 - copia.csv", fila=0, columna="(archivo)", problema="Q01/Q22",
                    valor_original="(no debe estar)", valor_en_archivo="copia exacta de septiembre en la carpeta ERP"))
    pd.DataFrame(log).to_csv(os.path.join(AQUI, "p5-log-suciedad.csv"), index=False, encoding="utf-8-sig", sep=";")

    # =====================================================================
    # 6. Libro p5-datos.xlsx
    # =====================================================================
    maestro = pd.concat([prods.loc[~prods["Huerfano"], ["CodProducto", "Descripcion", "Familia", "Subfamilia",
                                                          "CosteEstandar", "Proveedor"]],
                         especiales[["CodProducto", "Descripcion", "Familia", "Subfamilia", "CosteEstandar", "Proveedor"]]])
    maestro = maestro.sort_values("CodProducto").reset_index(drop=True)
    escribir_libro_datos(maestro, clientes, objetivos, v2025, ctrl)
    shutil.copyfile(XLSX, os.path.join(d_mae, "p5-datos.xlsx"))
    escribir_altas(prods[prods["Huerfano"]], d_dic)
    with open(os.path.join(d_inf, "LEEME.txt"), "w", encoding="utf-8-sig", newline="") as fh:
        fh.write("Guarda aquí tu libro del informe (por ejemplo P5_Informe_ventas_2026-10_v01.xlsx).\r\n"
                 "No pongas nada en la carpeta ERP que no sea una exportación del ERP.\r\n")

    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for raiz, dirs, files in os.walk(CARPETA):
            dirs.sort()
            rel = os.path.relpath(raiz, CARPETA)
            if rel != ".":
                z.writestr(zipfile.ZipInfo(rel.replace(os.sep, "/") + "/", date_time=(2026, 11, 16, 8, 0, 0)), "")
            for f in sorted(files):
                ruta = os.path.join(raiz, f)
                zi = zipfile.ZipInfo(os.path.relpath(ruta, CARPETA).replace(os.sep, "/"), date_time=(2026, 11, 16, 8, 0, 0))
                zi.compress_type = zipfile.ZIP_DEFLATED
                with open(ruta, "rb") as fh:
                    z.writestr(zi, fh.read())

    # =====================================================================
    # 7. Totales verdaderos (para comprobar la solución)
    # =====================================================================
    comp = v[v["Familia"] != "Ajustes"]
    obj_largo = objetivos.melt(id_vars=["CodComercial", "Comercial"], var_name="MesAbr", value_name="Objetivo").dropna()
    obj_largo["Mes"] = obj_largo["MesAbr"].map({a: i + 1 for i, a in enumerate(MESES_ABR)})
    deleg_com = {c[0]: c[2] for c in COMERCIALES}
    obj_largo["Delegacion"] = obj_largo["CodComercial"].map(deleg_com)
    ob10 = obj_largo[obj_largo["Mes"] <= 10]
    s25 = v2025.melt(id_vars=["Delegacion", "Familia"], var_name="MesAbr", value_name="Importe")
    s25["Mes"] = s25["MesAbr"].map({a: i + 1 for i, a in enumerate(MESES_ABR)})
    s25_10 = s25[s25["Mes"] <= 10]["Importe"].sum()
    s26_6 = v[v["FamiliaInforme"].isin(FAMILIAS)]["ImporteNeto"].sum()
    verdad = {
        "lineas": int(len(v)),
        "ventas_total": round(float(tot), 2),
        "ventas_lleida": round(float(v.loc[v["Delegacion"] == "Lleida", "ImporteNeto"].sum()), 2),
        "sin_clasificar": round(float(v.loc[v["FamiliaInforme"] == "Sin clasificar", "ImporteNeto"].sum()), 2),
        "huerfanos": int(v.loc[v["FamiliaInforme"] == "Sin clasificar", "CodProducto"].nunique()),
        "margen_total": round(float(v["Margen"].sum()), 2),
        "comerciales_margen_bajo": len(bajos),
        "var_6fam_pct": round(float((s26_6 / s25_10 - 1) * 100), 1),
        "cumpl_pamplona_pct": round(float(comp.loc[comp["Delegacion"] == "Pamplona", "ImporteNeto"].sum()
                                          / ob10.loc[ob10["Delegacion"] == "Pamplona", "Objetivo"].sum() * 100), 1),
        "por_mes": {int(m): [int(n), round(float(s), 2)] for m, n, s in zip(ctrl["Mes"], ctrl["NumLineas"], ctrl["ImporteNeto"])},
        "noviembre": {"lineas": int((ventas["Mes"] == 11).sum()),
                      "ventas": round(float(ventas.loc[ventas["Mes"] == 11, "ImporteNeto"].sum()), 2),
                      "logrono": round(float(ventas.loc[(ventas["Mes"] == 11) & (ventas["Delegacion"] == "Logroño"), "ImporteNeto"].sum()), 2)},
    }
    with open(os.path.join(AQUI, "p5_verdad.json"), "w", encoding="utf-8") as fh:
        json.dump(verdad, fh, ensure_ascii=False, indent=2)
    print(json.dumps({k: v_ for k, v_ in verdad.items() if k != "por_mes"}, ensure_ascii=False))

    meta = {"titulo": "P5 · Informe mensual de ventas: datos de partida",
            "descripcion": "Maestros, objetivos, resumen de 2025 y control del ERP de Electro Cierzo; las exportaciones mensuales van en p5-carpeta-ventas.zip.",
            "nivel": "n6"}
    with open(os.path.join(LIBROS, "p5-datos.meta.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Libro de datos
# ---------------------------------------------------------------------------
INSTRUCCIONES = [
    ("t", "P5 · Informe mensual de ventas automatizado"),
    ("s", "Electro Cierzo Suministros, S.L. · Dirección comercial · Encargo de Javier Ortega (16/11/2026)"),
    ("", ""),
    ("h", "Qué hay que conseguir"),
    ("", "Un libro de informe que se actualiza con un botón (Datos > Actualizar todo) y que enseña cómo van las ventas de enero a"),
    ("", "octubre de 2026 por delegación, comercial, familia y cliente, frente a 2025 y frente al objetivo, con el margen."),
    ("", "Dos salidas: «Reunión» (para los comerciales, sin márgenes) y «Dirección» (completa). La reunión es el 25/11/2026."),
    ("", ""),
    ("h", "Qué te llega"),
    ("", "1. p5-carpeta-ventas.zip: descomprímelo en tu equipo. Dentro está la carpeta Ventas con:"),
    ("", "      ERP: las exportaciones del ERP, un CSV por mes (ventas_2026_01.csv … ventas_2026_10.csv)."),
    ("", "      Maestros: una copia de este libro."),
    ("", "      Informe: vacía; aquí guardas tu libro."),
    ("", "      Llega_en_diciembre: NO la abras hasta el último paso (el cambio inesperado)."),
    ("", "2. Este libro (p5-datos.xlsx), con estas hojas:"),
    ("", "      Control_ERP: nº de líneas y suma de ImporteNeto de cada mes, tal como los da el ERP al cerrar. Es la verdad para cuadrar."),
    ("", "      Productos: maestro de artículos (CodProducto es texto de 6 dígitos)."),
    ("", "      Comerciales: los 12 comerciales, con su delegación, fecha de alta y de baja."),
    ("", "      Clientes: maestro de clientes (código, nombre, NIF, población, provincia y delegación)."),
    ("", "      Objetivos_2026: objetivo de venta de cada comercial y mes, en euros sin IVA."),
    ("", "      Ventas_2025_resumen: venta neta de 2025 por delegación, familia y mes (solo las 6 familias de producto)."),
    ("", ""),
    ("h", "Cómo trabajar (resumen; el plan completo está en la guía)"),
    ("", "1. Lee el correo de Javier y escribe tus preguntas antes de empezar. Mira las respuestas en la guía."),
    ("", "2. Perfila los datos: cuántos archivos, cuántas columnas, qué cambia de un mes a otro. Anota cada problema en una hoja «Calidad de datos»."),
    ("", "3. Conecta la carpeta ERP con Power Query (Datos > Obtener datos > Del archivo > De la carpeta) y combina los archivos."),
    ("", "4. Comprueba cada mes contra Control_ERP ANTES de seguir: nº de líneas y suma de ImporteNeto, diferencia 0."),
    ("", "5. Limpia (tipos con configuración regional, delegación, código de producto), cruza con los maestros, calcula coste y margen."),
    ("", "6. Pasa a formato largo los objetivos y 2025, y monta las tablas dinámicas, segmentaciones, gráficos y las dos salidas."),
    ("", "7. Hoja Controles con un control maestro, hoja Léame con «Cómo hacer el informe de noviembre», y el correo de entrega."),
    ("", ""),
    ("h", "Cómo comprobar tu trabajo"),
    ("", "Cada mes, tu nº de líneas y tu suma de ImporteNeto deben coincidir EXACTAMENTE con Control_ERP (diferencia 0 y 0,00 €)."),
    ("", "Además, la suma por delegación y la suma por familia deben dar el mismo total. En la guía tienes más totales de control."),
    ("", ""),
    ("h", "Avisos"),
    ("", "No modifiques este libro ni los CSV: son los datos de origen. Trabaja en tu propio libro, en la carpeta Informe."),
    ("", "Importes en euros sin IVA. Las devoluciones vienen con Cantidad negativa. Todos los nombres y NIF son inventados."),
    ("", "Necesitas Excel para Microsoft 365 (o 2016 o posterior) en Windows para Power Query desde carpeta."),
]


def escribir_libro_datos(maestro, clientes, objetivos, v2025, ctrl):
    import xlsxwriter
    wb = xlsxwriter.Workbook(XLSX)
    wb.set_properties({"title": "P5 · Datos de partida", "author": "Electro Cierzo Suministros (ficticia)",
                       "comments": "Datos inventados para «Hoja a hoja»."})
    f_t = wb.add_format({"bold": True, "font_size": 16, "font_color": "#1F3864"})
    f_s = wb.add_format({"italic": True, "font_color": "#595959"})
    f_h = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "bottom": 1})
    f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "top"})
    f_txt = wb.add_format({"num_format": "@"})
    f_eur = wb.add_format({"num_format": "#,##0.00"})
    f_c4 = wb.add_format({"num_format": "#,##0.0000"})
    f_fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
    f_mes = wb.add_format({"num_format": "mmmm yyyy"})
    f_int = wb.add_format({"num_format": "#,##0"})

    ws = wb.add_worksheet("Instrucciones")
    ws.hide_gridlines(2)
    ws.set_column("A:A", 130)
    for i, (tipo, texto) in enumerate(INSTRUCCIONES):
        fmt = {"t": f_t, "s": f_s, "h": f_h}.get(tipo)
        ws.write_string(i, 0, texto, fmt) if fmt else ws.write_string(i, 0, texto)
    ws.activate()

    def hoja(nombre, df, formatos, anchos):
        w = wb.add_worksheet(nombre)
        w.freeze_panes(1, 0)
        for j, col in enumerate(df.columns):
            w.write_string(0, j, col, f_cab)
            w.set_column(j, j, anchos.get(col, 12), formatos.get(col))
        for i, fila in enumerate(df.itertuples(index=False), start=1):
            for j, val in enumerate(fila):
                col = df.columns[j]
                if val is None or (not isinstance(val, str) and pd.isna(val)):
                    continue
                if col in ("CodProducto", "CodCliente", "CodComercial", "NIF"):
                    w.write_string(i, j, str(val), f_txt)
                elif isinstance(val, (dt.date, pd.Timestamp)):
                    w.write_datetime(i, j, pd.Timestamp(val).to_pydatetime(), formatos.get(col, f_fecha))
                elif isinstance(val, (int, float, np.integer, np.floating)):
                    w.write_number(i, j, float(val), formatos.get(col))
                else:
                    w.write_string(i, j, str(val))
        w.autofilter(0, 0, len(df), len(df.columns) - 1)
        return w

    c = ctrl.copy()
    c["Mes"] = [dt.datetime(2026, m, 1) for m in c["Mes"]]
    c = c[["Archivo", "Mes", "NumLineas", "ImporteNeto"]]
    w = hoja("Control_ERP", c, {"Mes": f_mes, "NumLineas": f_int, "ImporteNeto": f_eur},
             {"Archivo": 22, "Mes": 16, "NumLineas": 12, "ImporteNeto": 16})
    w.write_string(len(c) + 2, 0, "Totales que da el ERP al cerrar cada mes (ImporteNeto en euros sin IVA, devoluciones restadas).", f_s)
    hoja("Productos", maestro, {"CosteEstandar": f_c4, "CodProducto": f_txt},
         {"CodProducto": 12, "Descripcion": 62, "Familia": 18, "Subfamilia": 24, "CosteEstandar": 14, "Proveedor": 40})
    com = pd.DataFrame([dict(CodComercial=c_[0], Nombre=c_[1], Delegacion=c_[2],
                             FechaAlta=dt.datetime.fromisoformat(c_[3]),
                             FechaBaja=dt.datetime.fromisoformat(c_[4]) if c_[4] else None) for c_ in COMERCIALES])
    hoja("Comerciales", com, {"FechaAlta": f_fecha, "FechaBaja": f_fecha},
         {"CodComercial": 13, "Nombre": 28, "Delegacion": 12, "FechaAlta": 12, "FechaBaja": 12})
    cl = clientes[["CodCliente", "Nombre", "NIF", "Poblacion", "Provincia", "Delegacion"]].sort_values("CodCliente")
    hoja("Clientes", cl, {}, {"CodCliente": 11, "Nombre": 50, "NIF": 12, "Poblacion": 26, "Provincia": 12, "Delegacion": 12})
    hoja("Objetivos_2026", objetivos, {m: f_int for m in MESES_ABR}, {"CodComercial": 13, "Comercial": 28})
    hoja("Ventas_2025_resumen", v2025, {m: f_eur for m in MESES_ABR}, {"Delegacion": 12, "Familia": 16, **{m: 13 for m in MESES_ABR}})
    wb.close()


def escribir_altas(huerf, carpeta):
    import xlsxwriter
    wb = xlsxwriter.Workbook(os.path.join(carpeta, "altas_diciembre.xlsx"))
    f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
    f_txt = wb.add_format({"num_format": "@"})
    f_fecha = wb.add_format({"num_format": "dd/mm/yyyy"})
    w = wb.add_worksheet("Productos_nuevos")
    cab = ["CodProducto", "Descripcion", "Familia", "Subfamilia", "CosteEstandar", "Proveedor"]
    for j, ccc in enumerate(cab):
        w.write_string(0, j, ccc, f_cab)
    for i, r in enumerate(huerf.itertuples(index=False), start=1):
        w.write_string(i, 0, r.CodProducto, f_txt)
        w.write_string(i, 1, r.Descripcion)
        w.write_string(i, 2, r.Familia)
        w.write_string(i, 3, r.Subfamilia)
        w.write_number(i, 4, float(r.CosteEstandar), wb.add_format({"num_format": "#,##0.0000"}))
        w.write_string(i, 5, r.Proveedor)
    w.set_column(0, 0, 12)
    w.set_column(1, 1, 60)
    w.set_column(2, 5, 18)
    w2 = wb.add_worksheet("Comerciales_nuevos")
    for j, ccc in enumerate(["CodComercial", "Nombre", "Delegacion", "FechaAlta", "FechaBaja"]):
        w2.write_string(0, j, ccc, f_cab)
    for i, c_ in enumerate(NUEVOS_COMERCIALES, start=1):
        w2.write_string(i, 0, c_[0], f_txt)
        w2.write_string(i, 1, c_[1])
        w2.write_string(i, 2, c_[2])
        w2.write_datetime(i, 3, dt.datetime.fromisoformat(c_[3]), f_fecha)
    w2.set_column(0, 4, 16)
    wb.close()


if __name__ == "__main__":
    # Se prueba la calibración con unos pocos factores para el peso de los 7 huérfanos y se
    # queda el primero que cumple todas las condiciones de diseño (siempre el mismo).
    for f in [1.0, 0.9, 0.8, 0.7, 1.1, 0.6, 1.2, 0.5]:
        try:
            main(f)
            print("factor de los huérfanos:", f)
            break
        except AssertionError as e:
            print("calibración no válida con el factor", f, "→", e)
    else:
        raise SystemExit("Ningún factor cumple la calibración")

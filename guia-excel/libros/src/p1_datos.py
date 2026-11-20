# -*- coding: utf-8 -*-
"""
P1 · Comparativa de ofertas de proveedores (Compras) · DATOS DE PARTIDA
=======================================================================

Genera  libros/p1-datos.xlsx   (lo que recibe la alumna)
y       libros/src/p1-log-suciedad.csv   (registro de cada problema sembrado,
                                          para la solución comentada; NO se entrega)

Empresa ficticia: Electro Cierzo Suministros, S.L. (Zaragoza). Encargo de Andrés
Molina, jefe de compras, el lunes 16/11/2026. Todos los datos son inventados.

Los datos de P1 están DISEÑADOS A MANO y son fijos (research/proyectos.md, ficha P1):
cada cifra se ha elegido para que salgan empates, casi empates y trampas concretas.
La semilla fija solo decide el orden en que cada proveedor lista sus artículos
(cada uno manda la oferta «a su manera»), para que el resultado sea siempre el mismo.

Primero se escriben los datos «verdaderos» (precio por unidad base, sin IVA, para
2027) y después la forma en que llegan, con la suciedad. El script comprueba que la
suciedad se puede deshacer y devuelve exactamente los precios verdaderos.

PROBLEMAS DE CALIDAD SEMBRADOS (códigos de research/proyectos.md §3.5)
----------------------------------------------------------------------
Q15  Unidades distintas para el mismo artículo:
       - Arnedo: precio por unidad base (m, tramo, rollo, ud, bolsa).
       - Elecvía: cable por ROLLO DE 100 m; canaleta por METRO (la unidad base es el
         tramo de 2 m: 1 m = 0,5 tramos); cajas por CAJA DE 25 unidades.
       - Tormes: cable por BOBINA DE 500 m.
       - Yesa: cable en €/km.
Q15  Base distinta: Elecvía da «PVP IVA incl.» (los demás, sin IVA).
Q05  Números guardados como texto con punto decimal: Tormes, 8 celdas («490.00»).
Q06  Símbolo dentro del número: Elecvía, 10 celdas («128,26 €»).
Q09  Precio que falta: Tormes pone «consultar» en el tubo M20 y deja vacías las
     bridas (2 artículos sin oferta: la oferta de Tormes está incompleta).
Q08  El mismo artículo escrito de 4 maneras distintas y sin código: hay que poner el
     código de «Consumo 2027» leyendo la descripción.
Q10  Filas que no son datos debajo de la tabla: 4 líneas de condiciones en texto
     libre (descuento, portes y validez), separadas por una fila vacía.
—    Validez caducada: Yesa da precios «válidos hasta el 31/12/2026»; en las
     aclaraciones, Andrés dice que en 2027 suben un 3 %.
—    Empate exacto en CAJ-100: Elecvía (25,41 € con IVA la caja de 25 = 0,84 €/ud
     sin IVA) y Tormes (0,84 €/ud).
—    Casi empate en CAN-40X60: Tormes 3,90 €/tramo; Elecvía 2,36 € el metro con IVA
     = 3,900826 €/tramo sin IVA, que con 2 decimales también se ve «3,90».
"""
import csv
import os
import random

import xlsxwriter

random.seed(20261116)  # semilla fija: solo decide el orden de las líneas de cada proveedor

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
SALIDA = os.path.join(LIBROS, "p1-datos.xlsx")
LOG = os.path.join(AQUI, "p1-log-suciedad.csv")

# ---------------------------------------------------------------------------
# 1. Maestro de artículos y consumo previsto para 2027 (hoja limpia)
# ---------------------------------------------------------------------------
CONSUMO = [
    # código, descripción, unidad base, cantidad 2027
    ("CAB-RZ1K-3G25", "Cable RZ1-K 0,6/1 kV 3G2,5 mm²", "m", 18000),
    ("CAB-RZ1K-3G15", "Cable RZ1-K 0,6/1 kV 3G1,5 mm²", "m", 12000),
    ("CAB-H07Z1-6", "Cable H07Z1-K 6 mm²", "m", 9000),
    ("CAB-H07Z1-25", "Cable H07Z1-K 2,5 mm²", "m", 30000),
    ("CAB-H07Z1-15", "Cable H07Z1-K 1,5 mm²", "m", 24000),
    ("CAN-40X60", "Canaleta PVC 40×60 (tramo de 2 m)", "tramo", 1500),
    ("CAN-60X100", "Canaleta PVC 60×100 (tramo de 2 m)", "tramo", 800),
    ("TUB-M20", "Tubo corrugado M20 (rollo de 100 m)", "rollo", 600),
    ("CAJ-100", "Caja de registro 100×100", "ud", 4000),
    ("BRI-200", "Bridas 200 mm (bolsa de 100)", "bolsa", 2500),
]

# ---------------------------------------------------------------------------
# 2. Datos VERDADEROS: precio 2027 por unidad base, sin IVA (lo que debe salir)
#    None = el proveedor no oferta ese artículo.
# ---------------------------------------------------------------------------
IVA = 0.21
SUBIDA_YESA = 0.03
VERDAD = {
    "Arnedo": {"CAB-RZ1K-3G25": 1.12, "CAB-RZ1K-3G15": 0.78, "CAB-H07Z1-6": 0.69, "CAB-H07Z1-25": 0.31,
               "CAB-H07Z1-15": 0.21, "CAN-40X60": 3.95, "CAN-60X100": 7.60, "TUB-M20": 14.20,
               "CAJ-100": 0.88, "BRI-200": 2.35},
    "Elecvía": {"CAB-RZ1K-3G25": 128.26 / 1.21 / 100, "CAB-RZ1K-3G15": 89.54 / 1.21 / 100,
                "CAB-H07Z1-6": 79.86 / 1.21 / 100, "CAB-H07Z1-25": 35.09 / 1.21 / 100,
                "CAB-H07Z1-15": 23.60 / 1.21 / 100, "CAN-40X60": 2.36 / 0.5 / 1.21,
                "CAN-60X100": 4.48 / 0.5 / 1.21, "TUB-M20": 16.70 / 1.21, "CAJ-100": 25.41 / 25 / 1.21,
                "BRI-200": 2.66 / 1.21},
    "Tormes": {"CAB-RZ1K-3G25": 490 / 500, "CAB-RZ1K-3G15": 345 / 500, "CAB-H07Z1-6": 310 / 500,
               "CAB-H07Z1-25": 135 / 500, "CAB-H07Z1-15": 92.5 / 500, "CAN-40X60": 3.90,
               "CAN-60X100": 7.55, "TUB-M20": None, "CAJ-100": 0.84, "BRI-200": None},
    "Yesa": {k: v * (1 + SUBIDA_YESA) for k, v in {
        "CAB-RZ1K-3G25": 1.090, "CAB-RZ1K-3G15": 0.760, "CAB-H07Z1-6": 0.700, "CAB-H07Z1-25": 0.305,
        "CAB-H07Z1-15": 0.205, "CAN-40X60": 3.85, "CAN-60X100": 7.40, "TUB-M20": 13.90,
        "CAJ-100": 0.86, "BRI-200": 2.30}.items()},
}

# ---------------------------------------------------------------------------
# 3. Cómo LLEGA cada oferta (la suciedad). Por línea:
#    código (NO se escribe en el archivo), texto del proveedor, precio tal cual,
#    unidad de la oferta, observaciones, problemas sembrados
# ---------------------------------------------------------------------------
OFERTAS = {
    "Arnedo": [
        ("CAB-RZ1K-3G25", "Cable RZ1-K 0,6/1 kV 3G2,5", 1.12, "m", "Tarifa 2027, portes pagados", "Q08"),
        ("CAB-RZ1K-3G15", "Cable RZ1-K 0,6/1 kV 3G1,5", 0.78, "m", None, "Q08"),
        ("CAB-H07Z1-6", "Cable H07Z1-K 6 mm2", 0.69, "m", None, "Q08"),
        ("CAB-H07Z1-25", "Cable H07Z1-K 2,5 mm2", 0.31, "m", None, "Q08"),
        ("CAB-H07Z1-15", "Cable H07Z1-K 1,5 mm2", 0.21, "m", None, "Q08"),
        ("CAN-40X60", "Canaleta PVC 40x60 (tramo 2 m)", 3.95, "tramo", None, "Q08"),
        ("CAN-60X100", "Canaleta PVC 60x100 (tramo 2 m)", 7.60, "tramo", None, "Q08"),
        ("TUB-M20", "Tubo corrugado M20 (rollo 100 m)", 14.20, "rollo", None, "Q08"),
        ("CAJ-100", "Caja registro 100x100", 0.88, "ud", None, "Q08"),
        ("BRI-200", "Bridas 200 mm (bolsa 100)", 2.35, "bolsa", None, "Q08"),
    ],
    "Elecvía": [
        ("CAB-RZ1K-3G25", "Manguera RZ1-K 3x2,5 libre de halógenos", "128,26 €", "rollo 100 m", "PVP IVA incl.", "Q08 Q06 Q15-rollo Q15-IVA"),
        ("CAB-RZ1K-3G15", "Manguera RZ1-K 3x1,5 libre de halógenos", "89,54 €", "rollo 100 m", "PVP IVA incl.", "Q08 Q06 Q15-rollo Q15-IVA"),
        ("CAB-H07Z1-6", "Unipolar H07Z1-K 1x6", "79,86 €", "rollo 100 m", "PVP IVA incl.", "Q08 Q06 Q15-rollo Q15-IVA"),
        ("CAB-H07Z1-25", "Unipolar H07Z1-K 1x2,5", "35,09 €", "rollo 100 m", "PVP IVA incl.", "Q08 Q06 Q15-rollo Q15-IVA"),
        ("CAB-H07Z1-15", "Unipolar H07Z1-K 1x1,5", "23,60 €", "rollo 100 m", "PVP IVA incl.", "Q08 Q06 Q15-rollo Q15-IVA"),
        ("CAN-40X60", "Canal PVC blanco 40x60", "2,36 €", "metro", "PVP IVA incl. Precio por metro lineal", "Q08 Q06 Q15-metro Q15-IVA casi-empate"),
        ("CAN-60X100", "Canal PVC blanco 60x100", "4,48 €", "metro", "PVP IVA incl. Precio por metro lineal", "Q08 Q06 Q15-metro Q15-IVA"),
        ("TUB-M20", "Tubo corrugado reforzado diámetro 20 (rollo 100 m)", "16,70 €", "rollo", "PVP IVA incl.", "Q08 Q06 Q15-IVA"),
        ("CAJ-100", "Caja de registro estanca 100x100", "25,41 €", "caja 25 ud", "PVP IVA incl. Caja de 25 unidades", "Q08 Q06 Q15-caja Q15-IVA empate"),
        ("BRI-200", "Brida de nailon 200x4,8 (bolsa 100 uds)", "2,66 €", "bolsa", "PVP IVA incl.", "Q08 Q06 Q15-IVA"),
    ],
    "Tormes": [
        ("CAB-RZ1K-3G25", "RZ1K 3G2.5", "490.00", "bobina 500 m", "Me lo dictó por teléfono el comercial", "Q08 Q05 Q15-bobina"),
        ("CAB-RZ1K-3G15", "RZ1K 3G1.5", "345.00", "bobina 500 m", None, "Q08 Q05 Q15-bobina"),
        ("CAB-H07Z1-6", "H07Z1 6mm", "310.00", "bobina 500 m", None, "Q08 Q05 Q15-bobina"),
        ("CAB-H07Z1-25", "H07Z1 2.5mm", "135.00", "bobina 500 m", None, "Q08 Q05 Q15-bobina"),
        ("CAB-H07Z1-15", "H07Z1 1.5mm", "92.50", "bobina 500 m", None, "Q08 Q05 Q15-bobina"),
        ("CAN-40X60", "Canaleta 40x60", "3.90", "tramo", None, "Q08 Q05 casi-empate"),
        ("CAN-60X100", "Canaleta 60x100", "7.55", "tramo", None, "Q08 Q05"),
        ("TUB-M20", "Corrugado M20", "consultar", "rollo", None, "Q08 Q09-consultar"),
        ("CAJ-100", "Caja 100x100", "0.84", "ud", None, "Q08 Q05 empate"),
        ("BRI-200", "Bridas 200", None, "bolsa", None, "Q08 Q09-vacío"),
    ],
    "Yesa": [
        ("CAB-RZ1K-3G25", "CABLE RZ1-K 0,6/1KV 3X2,5", 1090, "km", "Tarifa 2026", "Q08 Q15-km validez"),
        ("CAB-RZ1K-3G15", "CABLE RZ1-K 0,6/1KV 3X1,5", 760, "km", None, "Q08 Q15-km validez"),
        ("CAB-H07Z1-6", "CABLE H07Z1-K 1X6", 700, "km", None, "Q08 Q15-km validez"),
        ("CAB-H07Z1-25", "CABLE H07Z1-K 1X2,5", 305, "km", None, "Q08 Q15-km validez"),
        ("CAB-H07Z1-15", "CABLE H07Z1-K 1X1,5", 205, "km", None, "Q08 Q15-km validez"),
        ("CAN-40X60", "CANAL PVC 40X60 TRAMO 2M", 3.85, "tramo", None, "Q08 validez"),
        ("CAN-60X100", "CANAL PVC 60X100 TRAMO 2M", 7.40, "tramo", None, "Q08 validez"),
        ("TUB-M20", "TUBO CORRUGADO M-20 R/100M", 13.90, "rollo", None, "Q08 validez"),
        ("CAJ-100", "CAJA REGISTRO 100X100", 0.86, "ud", None, "Q08 validez"),
        ("BRI-200", "BRIDA 200MM B/100", 2.30, "bolsa", None, "Q08 validez"),
    ],
}

CONDICIONES = [
    "Arnedo: portes pagados.",
    "Elecvía: dto. 5 % si el pedido anual supera 15.000 € (base imponible) · portes 2 % del importe.",
    "Tormes: portes 90 € por envío.",
    "Yesa: portes pagados · precios válidos hasta el 31/12/2026.",
]

INCIDENCIAS = [
    # proveedor, pedidos 2026 (ene-oct), pedidos con incidencia, nota de calidad (1-5), plazo (días laborables)
    ("Arnedo", 46, 5, 4, 3),
    ("Elecvía", 58, 11, 3, 5),
    ("Tormes", 12, 0, 5, 2),
    ("Yesa", 31, 4, 4, 7),
]

# Unidades base por unidad de oferta (solo para comprobar que la suciedad se deshace)
FACTOR = {"m": 1, "rollo 100 m": 100, "bobina 500 m": 500, "km": 1000, "metro": 0.5,
          "tramo": 1, "rollo": 1, "caja 25 ud": 25, "ud": 1, "bolsa": 1}


def deshacer(proveedor, precio, unidad):
    """Limpieza de referencia: devuelve el precio 2027 por unidad base sin IVA."""
    if precio is None or (isinstance(precio, str) and not any(c.isdigit() for c in precio)):
        return None
    if isinstance(precio, str):
        s = precio.replace("€", "").strip()
        s = s.replace(".", "").replace(",", ".") if "," in s else s
        precio = float(s)
    p = precio / FACTOR[unidad]
    if proveedor == "Elecvía":
        p /= 1 + IVA
    if proveedor == "Yesa":
        p *= 1 + SUBIDA_YESA
    return p


# Comprobación: la suciedad se deshace y da exactamente los precios verdaderos
for prov, lineas in OFERTAS.items():
    assert len(lineas) == 10 and {l[0] for l in lineas} == {c[0] for c in CONSUMO}
    for cod, _t, precio, unidad, _o, _q in lineas:
        v, d = VERDAD[prov][cod], deshacer(prov, precio, unidad)
        assert (v is None and d is None) or abs(v - d) < 1e-9, (prov, cod, v, d)
assert VERDAD["Elecvía"]["CAJ-100"] == VERDAD["Tormes"]["CAJ-100"]            # empate exacto
assert 0 < VERDAD["Elecvía"]["CAN-40X60"] - VERDAD["Tormes"]["CAN-40X60"] < 0.001  # casi empate

# Orden de las líneas: cada proveedor lista sus artículos a su manera (semilla fija)
orden = {}
for prov in OFERTAS:
    lineas = list(OFERTAS[prov])
    if prov != "Arnedo":  # Arnedo usa el mismo orden que nuestro maestro
        random.shuffle(lineas)
    orden[prov] = lineas

# ---------------------------------------------------------------------------
# 4. Escribir el libro
# ---------------------------------------------------------------------------
wb = xlsxwriter.Workbook(SALIDA)
wb.set_properties({"title": "P1 · Ofertas de proveedores 2027 (datos de partida)",
                   "author": "Hoja a hoja", "company": "Electro Cierzo Suministros, S.L. (ficticia)",
                   "comments": "Datos inventados para practicar. Ninguna persona ni empresa es real."})
f_tit = wb.add_format({"bold": True, "font_size": 15, "font_color": "#1F3864"})
f_sub = wb.add_format({"bold": True, "font_size": 12, "font_color": "#1F3864", "top": 1, "top_color": "#BFBFBF"})
f_txt = wb.add_format({"text_wrap": True, "valign": "top"})
f_cab = wb.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True, "valign": "vcenter"})
f_cel = wb.add_format({"border": 1, "border_color": "#BFBFBF"})
f_num = wb.add_format({"border": 1, "border_color": "#BFBFBF", "num_format": "#,##0"})
f_cond = wb.add_format({"italic": True})

# --- Instrucciones ---------------------------------------------------------
ws = wb.add_worksheet("Instrucciones")
ws.set_column("A:A", 112)
ws.hide_gridlines(2)
lineas = [
    ("t", "P1 · Comparativa de ofertas de proveedores 2027"),
    ("p", "Electro Cierzo Suministros, S.L. · Compras y almacén · Encargo de Andrés Molina (jefe de compras), lunes 16/11/2026. "
          "Datos inventados para practicar."),
    ("s", "Objetivo"),
    ("p", "Saber qué proveedor nos sale más barato para el pedido anual de 2027 de cable, canaleta y pequeño material, "
          "si compensa repartir el pedido entre dos y qué pasa si además del precio se tienen en cuenta el plazo y la calidad. "
          "Andrés lo lleva el jueves a la reunión con Carmen Soler (directora general): necesita una página clara."),
    ("s", "Qué hay en este libro"),
    ("p", "• Ofertas: las 40 líneas de oferta (4 proveedores × 10 artículos) copiadas tal como llegaron (PDF, correo y "
          "teléfono), sin código de artículo. Debajo, en la fila 43 y siguientes, las condiciones de cada proveedor en texto libre."),
    ("p", "• Consumo 2027: los 10 artículos con su código, su unidad base y la cantidad que prevé comprar el almacén en 2027."),
    ("p", "• Incidencias 2026: pedidos de enero a octubre de 2026, pedidos con incidencia, nota de calidad (1 a 5) y plazo "
          "medio de entrega en días laborables de cada proveedor."),
    ("s", "Antes de empezar"),
    ("p", "1. Lee el correo de Andrés en la guía y escribe qué le preguntarías. Después lee lo que contesta: sin esas respuestas "
          "no se puede calcular bien."),
    ("p", "2. Guarda una copia de este libro con el nombre P1_Ofertas_2027_v01.xlsx y trabaja siempre en la copia."),
    ("p", "3. No modifiques la hoja «Ofertas»: es el original. Trabaja en una copia de la hoja llamada «Normalizado»."),
    ("s", "Pasos (el detalle y la ayuda de cada paso están en la guía)"),
    ("p", "1. Copia la hoja «Ofertas» y llama a la copia «Normalizado» (clic derecho en la pestaña > Mover o copiar > Crear una copia)."),
    ("p", "2. En «Normalizado», inserta una columna C «Código» y pon a cada línea el código de «Consumo 2027» leyendo la descripción."),
    ("p", "3. Convierte la columna de precios en números (cuidado: hay textos con «€» y con punto decimal) y deja fuera de la tabla las condiciones."),
    ("p", "4. Crea la hoja «Parámetros» con cada cifra que pueda cambiar (IVA, descuentos, portes, subidas, pesos…) y ponle nombre a cada celda."),
    ("p", "5. Calcula el precio de 2027 por unidad base y sin IVA de cada línea (factor de unidades, IVA y subida de precios)."),
    ("p", "6. Monta la hoja «Comparativa»: matriz artículos × proveedores con el precio base y con el coste anual (cantidad × precio)."),
    ("p", "7. Totales por proveedor: coste base, descuento, portes y total. Marca las ofertas incompletas."),
    ("p", "8. Proveedor más barato por artículo, con el mínimo de cada fila resaltado con formato condicional."),
    ("p", "9. Escenario de reparto entre dos proveedores, comprobando las condiciones que pone Andrés."),
    ("p", "10. Puntuación ponderada con precio, plazo y calidad."),
    ("p", "11. Hoja «Informe» de una página (tabla, gráfico de barras, recomendación y supuestos) y PDF."),
    ("p", "12. Hoja «Controles» y correo de entrega a Andrés."),
    ("s", "Qué entregar"),
    ("p", "• P1_Ofertas_2027_v01.xlsx con las hojas Léame, Parámetros, Normalizado, Comparativa, Informe y Controles "
          "(y las hojas originales sin tocar)."),
    ("p", "• P1_Ofertas_2027.pdf: la hoja «Informe» en una sola página."),
    ("p", "• El correo de entrega a Andrés (en la guía)."),
    ("s", "Cómo comprobar tu trabajo"),
    ("p", "• Autocomprobaciones rápidas: cada código debe aparecer 4 veces en «Normalizado» (CONTAR.SI) y, una vez limpia, "
          "la columna de precios debe tener 38 números (CONTAR). Si te sale 40 o menos de 38, algo no está bien."),
    ("p", "• En la guía, en «Totales de control», escribe tus cifras: te dice cuáles cuadran. Si alguna no cuadra, revisa "
          "primero la limpieza y las unidades: casi siempre está ahí."),
    ("p", "• Antes de entregar, revisa que todo sale de fórmulas: cambia el descuento de Elecvía en «Parámetros» y mira si "
          "cambian los totales y el informe. Después déjalo como estaba."),
]
fila = 0
for tipo, texto in lineas:
    if tipo == "t":
        ws.write(fila, 0, texto, f_tit); ws.set_row(fila, 24)
    elif tipo == "s":
        fila += 1; ws.write(fila, 0, texto, f_sub)
    else:
        ws.write(fila, 0, texto, f_txt)
        ws.set_row(fila, 15 * (1 + len(texto) // 120))
    fila += 1

# --- Ofertas -----------------------------------------------------------------
wo = wb.add_worksheet("Ofertas")
cab = ["Proveedor", "Artículo (texto del proveedor)", "Precio ofertado", "Unidad de la oferta", "Observaciones"]
wo.write_row(0, 0, cab, f_cab)
wo.set_column("A:A", 12); wo.set_column("B:B", 46); wo.set_column("C:C", 15)
wo.set_column("D:D", 19); wo.set_column("E:E", 38)
wo.freeze_panes(1, 0)
log = []
r = 1
for prov in ["Arnedo", "Elecvía", "Tormes", "Yesa"]:
    for cod, texto, precio, unidad, obs, problemas in orden[prov]:
        wo.write_string(r, 0, prov, f_cel)
        wo.write_string(r, 1, texto, f_cel)
        if precio is None:
            wo.write_blank(r, 2, None, f_cel)
        elif isinstance(precio, str):
            wo.write_string(r, 2, precio, f_cel)  # texto a propósito (Q05, Q06, Q09)
        else:
            wo.write_number(r, 2, precio, f_cel)
        wo.write_string(r, 3, unidad, f_cel)
        if obs:
            wo.write_string(r, 4, obs, f_cel)
        else:
            wo.write_blank(r, 4, None, f_cel)
        v = VERDAD[prov][cod]
        log.append({"fila_excel": r + 1, "proveedor": prov, "codigo_correcto": cod, "texto": texto,
                    "precio_tal_cual": "" if precio is None else precio, "unidad": unidad,
                    "problemas": problemas,
                    "precio_base_2027_sin_iva": "" if v is None else round(v, 6)})
        r += 1
assert r == 41
wo.write_string(42, 0, "CONDICIONES DE CADA OFERTA (copiadas tal cual)", wb.add_format({"bold": True}))
for i, c in enumerate(CONDICIONES):
    wo.write_string(43 + i, 0, c, f_cond)
for i, c in enumerate(CONDICIONES):
    log.append({"fila_excel": 44 + i, "proveedor": c.split(":")[0], "codigo_correcto": "", "texto": c,
                "precio_tal_cual": "", "unidad": "", "problemas": "Q10 condiciones en texto libre bajo la tabla",
                "precio_base_2027_sin_iva": ""})

# --- Consumo 2027 ------------------------------------------------------------
wc = wb.add_worksheet("Consumo 2027")
wc.write_row(0, 0, ["Código", "Descripción", "Unidad base", "Cantidad 2027"], f_cab)
for i, (cod, desc, ub, cant) in enumerate(CONSUMO, start=1):
    wc.write_string(i, 0, cod, f_cel); wc.write_string(i, 1, desc, f_cel)
    wc.write_string(i, 2, ub, f_cel); wc.write_number(i, 3, cant, f_num)
wc.set_column("A:A", 16); wc.set_column("B:B", 38); wc.set_column("C:C", 12); wc.set_column("D:D", 14)
wc.write_string(12, 0, "Previsión del almacén para 2027 (unidades base).", f_cond)

# --- Incidencias 2026 --------------------------------------------------------
wi = wb.add_worksheet("Incidencias 2026")
wi.write_row(0, 0, ["Proveedor", "Pedidos 2026 (ene-oct)", "Pedidos con incidencia", "Nota de calidad (1-5)",
                    "Plazo medio de entrega (días laborables)"], f_cab)
wi.set_row(0, 32)
for i, fila_i in enumerate(INCIDENCIAS, start=1):
    wi.write_string(i, 0, fila_i[0], f_cel)
    for j, v in enumerate(fila_i[1:], start=1):
        wi.write_number(i, j, v, f_num)
wi.set_column("A:A", 12); wi.set_column("B:E", 17)
wi.write_string(6, 0, "Nota de calidad: 5 = sin incidencias relevantes; 1 = muchas incidencias. La pone el almacén.", f_cond)

wb.close()

with open(LOG, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(log[0].keys()), delimiter=";")
    w.writeheader(); w.writerows(log)

print("Escrito", SALIDA, "y", LOG, f"({len(log)} filas en el registro)")

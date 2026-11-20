# -*- coding: utf-8 -*-
"""
P1 · Comparativa de ofertas de proveedores · SOLUCIÓN
=====================================================

1. Lee libros/p1-datos.xlsx TAL COMO LLEGA y lo limpia con pandas siguiendo las
   reglas del encargo y las aclaraciones de Andrés (no usa los datos «verdaderos»
   del generador): código por la descripción, «€» y punto decimal fuera, factor de
   unidades, IVA fuera en Elecvía, +3 % en Yesa, descuento y portes.
2. Calcula todos los totales de control, la búsqueda exhaustiva del reparto óptimo,
   las cifras que delatan cada error típico, el «cambio inesperado» y las ampliaciones,
   y los guarda en libros/src/p1-controles.json.
3. Escribe libros/p1-solucion.xlsx con fórmulas reales de Excel (en el archivo van en
   inglés y con comas; Excel en español las muestra traducidas y con «;»).
4. Recalcula el libro con LibreOffice (perfil temporal con configuración es-ES) para
   comprobar que las fórmulas dan lo mismo que pandas y para guardar en el archivo los
   valores ya calculados (así se ven bien aunque Excel lo abra en Vista protegida).
"""
import itertools
import json
import math
import os
import re
import shutil
import subprocess
import tempfile

import openpyxl
import pandas as pd
import xlsxwriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
DATOS = os.path.join(LIBROS, "p1-datos.xlsx")
SALIDA = os.path.join(LIBROS, "p1-solucion.xlsx")
CONTROLES = os.path.join(AQUI, "p1-controles.json")

PROVS = ["Arnedo", "Elecvía", "Tormes", "Yesa"]

# ===========================================================================
# 1. PARÁMETROS (de las condiciones de las ofertas y de las aclaraciones)
# ===========================================================================
PAR = {
    "TipoIVA": 0.21,          # Elecvía da «PVP IVA incl.»; se compara sin IVA (se recupera)
    "DtoElecvia": 0.05,       # «dto. 5 % si el pedido anual supera 15.000 € (base imponible)»
    "UmbralElecvia": 15000,
    "PortesElecvia": 0.02,    # «portes 2 % del importe» (importe con descuento)
    "PortesTormes": 90,       # «portes 90 € por envío»
    "EnviosTormes": 12,       # aclaración: uno al mes
    "SubidaYesa": 0.03,       # aclaración: Yesa sube un 3 % en 2027
    "PesoPrecio": 0.60, "PesoPlazo": 0.25, "PesoCalidad": 0.15,   # aclaración
    "MinimoProveedor": 3000,  # aclaración: al menos 3.000 € al año a cada uno
    "MaxProveedores": 2,      # aclaración: como máximo dos proveedores
    "NotaMaxima": 5,          # escala de la nota de calidad
}
# Unidades base por unidad de oferta. «metro» solo aparece en la canaleta de Elecvía
# (la unidad base es el tramo de 2 m: 1 m = 0,5 tramos).
UNIDADES = [
    ("m", 1, "Metro de cable: ya es la unidad base"),
    ("rollo 100 m", 100, "Rollo de 100 m de cable"),
    ("bobina 500 m", 500, "Bobina de 500 m de cable"),
    ("km", 1000, "Kilómetro de cable (1.000 m)"),
    ("metro", 0.5, "Metro de canaleta: medio tramo de 2 m"),
    ("tramo", 1, "Tramo de canaleta de 2 m: ya es la unidad base"),
    ("rollo", 1, "Rollo de tubo de 100 m: ya es la unidad base"),
    ("caja 25 ud", 25, "Caja con 25 cajas de registro"),
    ("ud", 1, "Unidad: ya es la unidad base"),
    ("bolsa", 1, "Bolsa de 100 bridas: ya es la unidad base"),
]
FACTOR = {u: f for u, f, _ in UNIDADES}
SUBIDA = {"Yesa": PAR["SubidaYesa"]}


# ===========================================================================
# 2. LECTURA Y LIMPIEZA CON PANDAS
# ===========================================================================
def codigo(texto):
    """Pone el código de «Consumo 2027» leyendo la descripción del proveedor (Q08)."""
    t = str(texto).upper().replace(" ", "").replace(".", ",")
    if "RZ1" in t:
        return "CAB-RZ1K-3G25" if "2,5" in t else "CAB-RZ1K-3G15" if "1,5" in t else None
    if "H07Z1" in t:
        r = t.replace("H07Z1", "")
        return "CAB-H07Z1-25" if "2,5" in r else "CAB-H07Z1-15" if "1,5" in r else "CAB-H07Z1-6" if "6" in r else None
    if "40X60" in t:
        return "CAN-40X60"
    if "60X100" in t:
        return "CAN-60X100"
    if "CORRUGADO" in t:
        return "TUB-M20"
    if "CAJA" in t:
        return "CAJ-100"
    if "BRIDA" in t:
        return "BRI-200"
    return None


def a_numero(v):
    """Lo mismo que hace la alumna con Ctrl+L en la columna de precios (Q05, Q06, Q09)."""
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).replace("€", "").strip()
    if not re.search(r"\d", s):       # «consultar»
        return None
    if "," in s:                      # «128,26»: coma decimal (y punto de miles si lo hubiera)
        s = s.replace(".", "").replace(",", ".")
    return float(s)                   # «490.00»: punto decimal


of = pd.read_excel(DATOS, sheet_name="Ofertas", nrows=40, dtype=object)
of.columns = ["Proveedor", "Artículo", "PrecioTal", "Unidad", "Observaciones"]
cond = pd.read_excel(DATOS, sheet_name="Ofertas", header=None, skiprows=43, nrows=4)[0].tolist()
con = pd.read_excel(DATOS, sheet_name="Consumo 2027", nrows=10)
inc = pd.read_excel(DATOS, sheet_name="Incidencias 2026", nrows=4)
con.columns = ["Código", "Descripción", "UnidadBase", "Cantidad"]
inc.columns = ["Proveedor", "Pedidos", "ConIncidencia", "Nota", "Plazo"]

assert len(of) == 40 and of["Proveedor"].notna().all()
# Las condiciones en texto dicen lo que hemos puesto en los parámetros
assert "5 %" in cond[1] and "15.000 €" in cond[1] and "2 %" in cond[1] and "90 €" in cond[2]
assert "31/12/2026" in cond[3]

of["Código"] = of["Artículo"].map(codigo)
assert of["Código"].notna().all()
assert (of.groupby("Código").size() == 4).all() and set(of["Código"]) == set(con["Código"])
assert (of.groupby(["Código", "Proveedor"]).size() == 1).all()

n_texto = int(of["PrecioTal"].map(lambda v: isinstance(v, str)).sum())
of["Precio"] = of["PrecioTal"].map(a_numero)
of["Factor"] = of["Unidad"].map(FACTOR)
assert of["Factor"].notna().all()
con_iva = of.groupby("Proveedor")["Observaciones"].apply(lambda s: s.fillna("").str.contains("IVA incl").any())
assert con_iva[con_iva].index.tolist() == ["Elecvía"]
of["IVA"] = of["Proveedor"].map(con_iva)
of["Subida"] = of["Proveedor"].map(SUBIDA).fillna(0.0)


def precio_base(df, quitar_iva=True, subir_yesa=True, factor_metro=None):
    f = df["Factor"].copy()
    if factor_metro is not None:
        f = f.where(df["Unidad"] != "metro", factor_metro)
    p = df["Precio"] / f
    if quitar_iva:
        p = p.where(~df["IVA"], p / (1 + PAR["TipoIVA"]))
    if subir_yesa:
        p = p * (1 + df["Subida"])
    return p


of["Base"] = precio_base(of)
cant = con.set_index("Código")["Cantidad"]
orden_cod = con["Código"].tolist()


def matriz(base):
    return of.assign(B=base).pivot(index="Código", columns="Proveedor", values="B").reindex(orden_cod)[PROVS]


mat = matriz(of["Base"])
coste = mat.mul(cant, axis=0)


def condiciones(prov, base, par=PAR):
    """Descuento, portes y total anual de un proveedor para una base imponible dada."""
    dto = portes = 0.0
    if prov == "Elecvía":
        dto = -base * par["DtoElecvia"] if base > par["UmbralElecvia"] else 0.0
        portes = (base + dto) * par["PortesElecvia"]
    if prov == "Tormes" and base > 0:
        portes = par["PortesTormes"] * par["EnviosTormes"]
    return dto, portes, base + dto + portes


base_prov = coste.sum(min_count=1)
incompletos = [p for p in PROVS if mat[p].isna().any()]
completos = [p for p in PROVS if p not in incompletos]
tot = {p: condiciones(p, base_prov[p]) for p in PROVS}
total = {p: tot[p][2] for p in PROVS}


def mejor_reparto(par=PAR):
    """Búsqueda exhaustiva: 1 o 2 proveedores, cada artículo a uno que lo oferte,
    cada proveedor usado con al menos el mínimo anual."""
    mejor = None
    for k in range(1, par["MaxProveedores"] + 1):
        for grupo in itertools.combinations(PROVS, k):
            opciones = [[p for p in grupo if not pd.isna(mat.loc[c, p])] for c in orden_cod]
            if any(not o for o in opciones):
                continue
            for asig in itertools.product(*opciones):
                if len(set(asig)) != k:
                    continue
                bases = {p: sum(coste.loc[c, p] for c, a in zip(orden_cod, asig) if a == p) for p in grupo}
                tots = {p: condiciones(p, bases[p], par)[2] for p in grupo}
                if any(t < par["MinimoProveedor"] for t in tots.values()):
                    continue
                t = sum(tots.values())
                if mejor is None or t < mejor[0] - 1e-9:
                    mejor = (t, dict(zip(orden_cod, asig)), bases, tots)
    return mejor


opt = mejor_reparto()
cables = [c for c in orden_cod if c.startswith("CAB")]
asig_esperada = {c: ("Tormes" if c in cables else "Elecvía") for c in orden_cod}
assert opt[1] == asig_esperada, opt[1]
rep_bases = opt[2]
rep_T = condiciones("Tormes", rep_bases["Tormes"])
rep_E = condiciones("Elecvía", rep_bases["Elecvía"])
reparto_total = opt[0]
unico_min = min(total[p] for p in completos)
mejor_unico = min(completos, key=lambda p: total[p])
ahorro = unico_min - reparto_total

# Puntuación ponderada (solo ofertas completas)
plazo = inc.set_index("Proveedor")["Plazo"]
nota = inc.set_index("Proveedor")["Nota"]
min_plazo = min(plazo[p] for p in completos)
punt = {}
for p in completos:
    pp = unico_min / total[p] * 100
    pz = min_plazo / plazo[p] * 100
    pc = nota[p] / PAR["NotaMaxima"] * 100
    punt[p] = PAR["PesoPrecio"] * pp + PAR["PesoPlazo"] * pz + PAR["PesoCalidad"] * pc
mejor_punt = max(punt, key=punt.get)

# Cifras que delatan cada error típico
e_base_iva = (mat["Elecvía"] * (1 + PAR["TipoIVA"]) * cant).sum()
err = {
    "elecvia_con_iva_base": e_base_iva,
    "elecvia_con_iva_total": condiciones("Elecvía", e_base_iva)[2],
    "elecvia_redondeo2_base": (mat["Elecvía"].round(2) * cant).sum(),
}
err["elecvia_redondeo2_total"] = condiciones("Elecvía", err["elecvia_redondeo2_base"])[2]
err["yesa_sin_subida"] = (mat["Yesa"] / (1 + PAR["SubidaYesa"]) * cant).sum()
err["elecvia_sin_descuento"] = base_prov["Elecvía"] * (1 + PAR["PortesElecvia"])
can = ["CAN-40X60", "CAN-60X100"]
err["canaleta_elecvia_bien"] = coste.loc[can, "Elecvía"].sum()
err["canaleta_elecvia_metro_como_tramo"] = (matriz(precio_base(of, factor_metro=1))["Elecvía"] * cant)[can].sum()
err["tormes_total_8_articulos"] = total["Tormes"]
# Puntuación si se mete a Tormes (incompleta) en los mínimos de coste y plazo
pp = total["Tormes"] / total["Arnedo"] * 100
err["arnedo_puntuacion_con_tormes"] = (PAR["PesoPrecio"] * pp + PAR["PesoPlazo"] * plazo["Tormes"] / plazo["Arnedo"] * 100
                                       + PAR["PesoCalidad"] * nota["Arnedo"] / PAR["NotaMaxima"] * 100)
# Por qué el reparto óptimo es ese: cada euro de Elecvía cuesta (1 − dto) × (1 + portes)
coef_e = (1 - PAR["DtoElecvia"]) * (1 + PAR["PortesElecvia"])
porque = {
    "coef_elecvia": coef_e,
    "cables_elecvia_efectivo": coste.loc[cables, "Elecvía"].sum() * coef_e,
    "cables_tormes_con_portes": coste.loc[cables, "Tormes"].sum() + PAR["PortesTormes"] * PAR["EnviosTormes"],
}

# Cambio inesperado: Elecvía 7 % si supera 20.000 €
PAR2 = dict(PAR, DtoElecvia=0.07, UmbralElecvia=20000)
cambio = {
    "elecvia_unico": condiciones("Elecvía", base_prov["Elecvía"], PAR2)[2],
    "reparto_mismo": rep_T[2] + condiciones("Elecvía", rep_bases["Elecvía"], PAR2)[2],
}
opt2 = mejor_reparto(PAR2)
cambio["optimo"] = opt2[0]
cambio["optimo_es_elecvia_sola"] = set(opt2[1].values()) == {"Elecvía"}
assert cambio["optimo_es_elecvia_sola"]

# Ampliaciones
ampl = {
    "dto_arnedo_para_igualar": 1 - total["Elecvía"] / base_prov["Arnedo"],
    "envios_equilibrio": (total["Elecvía"] - rep_bases["Tormes"] - rep_E[2]) / PAR["PortesTormes"],
}

R = {
    "precios_texto_en_origen": n_texto,
    "precios_numericos": int(of["Precio"].notna().sum()),
    "base_elecvia_cab_rz1k_3g25": mat.loc["CAB-RZ1K-3G25", "Elecvía"],
    "base_tormes_cab_rz1k_3g25": mat.loc["CAB-RZ1K-3G25", "Tormes"],
    "base_yesa_cab_rz1k_3g25": mat.loc["CAB-RZ1K-3G25", "Yesa"],
    "base_elecvia_can40": mat.loc["CAN-40X60", "Elecvía"],
    "coste_base": {p: base_prov[p] for p in PROVS},
    "elecvia_descuento": tot["Elecvía"][0], "elecvia_portes": tot["Elecvía"][1],
    "tormes_portes": tot["Tormes"][1],
    "total": total, "incompletos": incompletos, "mejor_unico": mejor_unico,
    "reparto": {"tormes_base": rep_bases["Tormes"], "tormes_portes": rep_T[1], "tormes_total": rep_T[2],
                "elecvia_base": rep_bases["Elecvía"], "elecvia_dto": rep_E[0], "elecvia_portes": rep_E[1],
                "elecvia_total": rep_E[2], "total": reparto_total},
    "ahorro_reparto": ahorro, "ahorro_pct": ahorro / unico_min * 100,
    "puntuacion": punt, "mejor_puntuacion": mejor_punt,
    "mas_barato_por_articulo": {c: [p for p in PROVS if not pd.isna(mat.loc[c, p]) and mat.loc[c, p] == mat.loc[c].min()]
                                for c in orden_cod},
    "errores": err, "porque_reparto": porque, "cambio_inesperado": cambio, "ampliaciones": ampl,
}
with open(CONTROLES, "w", encoding="utf-8") as fh:
    json.dump(R, fh, ensure_ascii=False, indent=2, default=float)

# ===========================================================================
# 3. LIBRO DE SOLUCIÓN (xlsxwriter, fórmulas en inglés con comas)
# ===========================================================================
src = openpyxl.load_workbook(DATOS)  # para copiar intactas las hojas de origen


def construir(destino, cache):
    wb = xlsxwriter.Workbook(destino, {"use_future_functions": True})
    wb.set_properties({"title": "P1 · Ofertas 2027 · Solución", "author": "Hoja a hoja",
                       "company": "Electro Cierzo Suministros, S.L. (ficticia)",
                       "comments": "Solución de referencia del proyecto P1. Datos inventados."})
    F = {}

    def fmt(nombre, **k):
        F[nombre] = wb.add_format(k)
        return F[nombre]

    borde = {"border": 1, "border_color": "#BFBFBF"}
    fmt("tit", bold=True, font_size=15, font_color="#1F3864")
    fmt("sub", bold=True, font_size=12, font_color="#1F3864")
    fmt("txt", text_wrap=True, valign="top")
    fmt("nota", italic=True, font_color="#595959")
    fmt("cab", bold=True, bg_color="#D9E1F2", text_wrap=True, valign="vcenter", **borde)
    fmt("cel", **borde)
    fmt("celw", text_wrap=True, valign="top", **borde)
    fmt("ent", bg_color="#FFF2CC", **borde)
    fmt("ent_pct", bg_color="#FFF2CC", num_format="0%", **borde)
    fmt("ent_eur", bg_color="#FFF2CC", num_format='#,##0.00 "€"', **borde)
    fmt("ent_num", bg_color="#FFF2CC", num_format="#,##0.##", **borde)
    fmt("eur", num_format='#,##0.00 "€"', **borde)
    fmt("eur_b", num_format='#,##0.00 "€"', bold=True, top=2, **{"border_color": "#7F7F7F"})
    fmt("p4", num_format='#,##0.0000 "€"', **borde)
    fmt("p6", num_format='#,##0.000000 "€"', **borde)
    fmt("num", num_format="#,##0", **borde)
    fmt("cen", align="center", **borde)
    fmt("num2", num_format="#,##0.00", **borde)
    fmt("dec", num_format="#,##0.###", **borde)
    fmt("pct", num_format="0%", **borde)
    fmt("lbl", bold=True)
    fmt("txt_w", text_wrap=True, valign="top")
    fmt("lbl_w", bold=True, text_wrap=True, valign="top")
    fmt("nota_w", italic=True, font_color="#595959", text_wrap=True, valign="top")
    fmt("ok", bold=True, font_size=12)

    def W(ws, celda, formula, f=None, hasta=None):
        v = cache.get((ws.get_name(), celda))
        if v is None:
            v = ""
        if hasta:  # solo en el Informe: texto largo en celdas combinadas (no en los datos)
            ws.merge_range(f"{celda}:{hasta}", "", f)
        ws.write_formula(celda, formula, f, v)

    # ---------------- Léame ----------------
    le = wb.add_worksheet("Léame")
    le.set_column("A:A", 30); le.set_column("B:B", 95); le.hide_gridlines(2); le.set_tab_color("#7F7F7F")
    le.write("A1", "P1 · Comparativa de ofertas de proveedores 2027", F["tit"])
    filas = [
        ("Objetivo", "Elegir proveedor (o reparto entre dos) para el pedido anual de 2027 de cable, canaleta y pequeño material, "
                     "por coste total anual sin IVA, con descuentos y portes; y ver qué cambia si se pondera plazo y calidad."),
        ("Lo pide", "Andrés Molina, jefe de compras y almacén (correo del lunes 16/11/2026). Lo presenta a Carmen Soler, directora general."),
        ("Entrega", "Miércoles 18/11/2026 antes de las 14:00: este libro y el PDF de la hoja «Informe» (una página)."),
        ("Fuentes", "Hoja «Ofertas»: las 4 ofertas copiadas por Andrés tal como llegaron (original, sin tocar). «Consumo 2027»: "
                    "cantidades del almacén. «Incidencias 2026»: nota de calidad y plazo de enero a octubre de 2026."),
        ("Supuestos", "Coste sin IVA (se recupera). El pronto pago no cuenta (se paga a 60 días). Elecvía: descuento si la base "
                      "anual supera el umbral; portes sobre el importe con descuento. Tormes: 12 envíos al año. Yesa: tarifa 2026 "
                      "+ 3 % (confirmado por Yesa). Tormes no oferta el tubo M20 («consultar») ni las bridas (vacío): oferta incompleta, "
                      "no puede ser proveedor único y no puntúa."),
        ("Hojas", "Parámetros (entradas) → Ofertas, Consumo 2027, Incidencias 2026 (origen, intactas) → Normalizado (ofertas "
                  "limpias, una fórmula por columna) → Comparativa (matriz, totales, reparto, puntuación) → Informe (una página) "
                  "→ Controles (cuadres; el control maestro sale también en el Informe) → Cómo se hizo (pasos manuales)."),
        ("Colores", "Amarillo claro = celda de entrada que se puede cambiar (Parámetros y «Asignado a» del reparto). Blanco = fórmula: no "
                    "se escribe encima. En la Comparativa, el mínimo de cada fila va en verde, en negrita y con «✓»."),
        ("Cómo actualizar", "1) Si cambia una condición (descuento, umbral, portes, subida, pesos), cámbiala en «Parámetros»: todo se "
                            "recalcula. 2) Si llega una oferta corregida, pégala en «Ofertas» (versión nueva del libro) y copia "
                            "precio y unidad en su línea de «Normalizado»; si trae una unidad nueva, añádela a la tabla Unidades. "
                            "3) Comprueba que el control maestro sigue en VERDADERO y revisa las conclusiones del Informe. "
                            "4) Guarda como _v02 y anótalo abajo."),
        ("Registro de cambios", "16/11/2026 · v01 · Primera versión con las 4 ofertas · (tu nombre)."),
        ("", "Si Elecvía cambia sus condiciones (p. ej. 7 % si supera 20.000 €): Parámetros > DtoElecvia y UmbralElecvia. Avisar a "
             "Andrés si cambia la recomendación."),
        ("Contacto", "Administración y análisis · Compras (Electro Cierzo Suministros). Datos ficticios para practicar."),
    ]
    for i, (a, b) in enumerate(filas, start=2):
        le.write(i, 0, a, F["lbl"]); le.write(i, 1, b, F["txt"])
        le.set_row(i, 15 * (1 + len(b) // 105))

    # ---------------- Parámetros ----------------
    pa = wb.add_worksheet("Parámetros")
    pa.set_tab_color("#FFC000")
    pa.set_column("A:A", 50); pa.set_column("B:B", 13); pa.set_column("C:C", 34); pa.set_column("D:D", 60)
    pa.write("A1", "Parámetros", F["tit"])
    pa.write("A2", "Celdas amarillas = entradas. Si cambia una condición, se cambia aquí y todo el libro se recalcula. "
                   "Cada celda tiene nombre (Fórmulas > Administrador de nombres, Ctrl+F3).", F["nota"])
    pa.write_row("A4", ["Parámetro", "Valor", "Nombre definido", "De dónde sale"], F["cab"])
    filas_par = [
        ("Tipo de IVA (Elecvía da los precios con IVA)", "TipoIVA", "ent_pct", "IVA general; se recupera, así que todo se compara sin IVA"),
        ("Descuento de Elecvía", "DtoElecvia", "ent_pct", "Condiciones de Elecvía"),
        ("Umbral del descuento de Elecvía (base anual, €)", "UmbralElecvia", "ent_eur", "«si el pedido anual supera 15.000 € (base imponible)»"),
        ("Portes de Elecvía (sobre el importe con descuento)", "PortesElecvia", "ent_pct", "«portes 2 % del importe»"),
        ("Portes de Tormes por envío (€)", "PortesTormes", "ent_eur", "«portes 90 € por envío»"),
        ("Envíos al año de Tormes", "EnviosTormes", "ent_num", "Andrés: uno al mes"),
        ("Subida de Yesa para 2027", "SubidaYesa", "ent_pct", "Andrés: Yesa lo ha confirmado (su tarifa vence el 31/12/2026)"),
        ("Peso del precio", "PesoPrecio", "ent_pct", "Andrés"),
        ("Peso del plazo de entrega", "PesoPlazo", "ent_pct", "Andrés"),
        ("Peso de la calidad", "PesoCalidad", "ent_pct", "Andrés (nota de «Incidencias 2026»)"),
        ("Mínimo anual por proveedor en un reparto (€)", "MinimoProveedor", "ent_eur", "Andrés"),
        ("Máximo de proveedores en un reparto", "MaxProveedores", "ent_num", "Andrés"),
        ("Nota máxima de calidad", "NotaMaxima", "ent_num", "Escala de 1 a 5 de «Incidencias 2026»"),
    ]
    for i, (txt, nombre, f, fuente) in enumerate(filas_par, start=4):
        pa.write(i, 0, txt, F["cel"]); pa.write_number(i, 1, PAR[nombre], F[f])
        pa.write(i, 2, nombre, F["cel"]); pa.write(i, 3, fuente, F["cel"])
        wb.define_name(nombre, f"='Parámetros'!$B${i + 1}")
    wb.define_name("Pesos", "='Parámetros'!$B$12:$B$14")
    W(pa, "A18", '="Los pesos suman "&FIXED(SUM(Pesos)*100,0)&" %"', F["nota"])

    pa.write("A20", "Proveedores", F["sub"])
    pa.write_row("A21", ["Proveedor", "Precios con IVA", "Subida 2027"], F["cab"])
    for i, p in enumerate(PROVS, start=21):
        pa.write(i, 0, p, F["cel"]); pa.write(i, 1, "Sí" if p == "Elecvía" else "No", F["ent"])
        if p == "Yesa":
            W(pa, f"C{i + 1}", "=SubidaYesa", F["pct"])
        else:
            pa.write_number(i, 2, 0, F["ent_pct"])
    wb.define_name("Proveedores", "='Parámetros'!$A$22:$C$25")

    pa.write("A27", "Unidades (unidades base que hay en cada unidad de oferta)", F["sub"])
    pa.write_row("A28", ["Unidad de la oferta", "Factor", "Qué significa"], F["cab"])
    for i, (u, f, q) in enumerate(UNIDADES, start=28):
        pa.write(i, 0, u, F["cel"]); pa.write_number(i, 1, f, F["ent_num"]); pa.write(i, 2, q, F["cel"])
    wb.define_name("Unidades", "='Parámetros'!$A$29:$B$38")

    # ---------------- Hojas de origen (copias intactas) ----------------
    for nombre in ["Ofertas", "Consumo 2027", "Incidencias 2026"]:
        ws = wb.add_worksheet(nombre)
        ws.set_tab_color("#A6A6A6")
        so = src[nombre]
        for fila_o in so.iter_rows():
            for c in fila_o:
                if c.value is None:
                    continue
                f = F["cab"] if c.row == 1 else None
                if isinstance(c.value, str):
                    ws.write_string(c.row - 1, c.column - 1, c.value, f)
                else:
                    ws.write_number(c.row - 1, c.column - 1, c.value, f)
        for letra, dim in so.column_dimensions.items():
            if dim.width:
                ws.set_column(f"{letra}:{letra}", dim.width)
        ws.freeze_panes(1, 0)

    # ---------------- Normalizado ----------------
    no = wb.add_worksheet("Normalizado")
    no.set_tab_color("#5B9BD5")
    cab_no = ["Proveedor", "Artículo (texto del proveedor)", "Código", "Precio ofertado", "Unidad de la oferta",
              "Observaciones", "Factor", "IVA incluido", "Subida 2027", "Precio base 2027 (€/ud. base, sin IVA)"]
    no.write_row("A1", cab_no, F["cab"]); no.set_row(0, 32)
    for j, w_ in enumerate([11, 44, 15, 12, 15, 34, 8, 9, 9, 17]):
        no.set_column(j, j, w_)
    no.freeze_panes(1, 3)
    for i, row in of.iterrows():
        r = i + 2
        no.write(r - 1, 0, row["Proveedor"], F["cel"]); no.write(r - 1, 1, row["Artículo"], F["cel"])
        no.write(r - 1, 2, row["Código"], F["cel"])
        if row["Precio"] is not None and not pd.isna(row["Precio"]):
            no.write_number(r - 1, 3, float(row["Precio"]), F["dec"])
        elif isinstance(row["PrecioTal"], str):
            no.write_string(r - 1, 3, row["PrecioTal"], F["cel"])   # «consultar»: se deja como texto
        else:
            no.write_blank(r - 1, 3, None, F["cel"])
        no.write(r - 1, 4, row["Unidad"], F["cel"])
        obs = row["Observaciones"]
        no.write(r - 1, 5, "" if pd.isna(obs) else obs, F["cel"])
        W(no, f"G{r}", f"=VLOOKUP(E{r},Unidades,2,FALSE)", F["dec"])
        W(no, f"H{r}", f"=VLOOKUP(A{r},Proveedores,2,FALSE)", F["cel"])
        W(no, f"I{r}", f"=VLOOKUP(A{r},Proveedores,3,FALSE)", F["pct"])
        W(no, f"J{r}", f'=IF(ISNUMBER(D{r}),D{r}/G{r}/IF(H{r}="Sí",1+TipoIVA,1)*(1+I{r}),"")', F["p6"])
    no.autofilter("A1:J41")
    no.write("A43", "Las condiciones de texto libre (filas 43-47 de «Ofertas») no son datos: están convertidas en cifras en «Parámetros».", F["nota"])

    # ---------------- Comparativa ----------------
    co = wb.add_worksheet("Comparativa")
    co.set_tab_color("#5B9BD5")
    for col, w_ in {"A": 15, "B": 33, "C": 9, "D": 11, "E": 13, "F:I": 14.5, "J": 12, "K": 12, "L": 9, "M": 6, "N:Q": 13}.items():
        co.set_column(f"{col}:{col}" if ":" not in col else col, w_)
    co.write("A1", "Comparativa de ofertas 2027 · todo sin IVA y por unidad base", F["tit"])
    co.write("A2", "Precio base: de «Normalizado». Celda vacía = el proveedor no oferta ese artículo. "
                   "El mínimo de cada fila va en verde, negrita y con «✓».", F["nota"])
    co.write("F3", "Precio base 2027 (€ por unidad base)", F["sub"])
    co.write("N3", "Coste anual 2027 (cantidad × precio base)", F["sub"])
    co.write_row("A4", ["Código", "Descripción", "Unidad base", "Cantidad 2027", "Nº de ofertas"] + PROVS +
                 ["Precio mínimo", "Más barato", "Empate"], F["cab"])
    co.write_row("N4", PROVS, F["cab"])
    co.set_row(3, 30)
    co.freeze_panes(4, 2)
    for k in range(10):
        r = 5 + k
        W(co, f"A{r}", f"='Consumo 2027'!A{k + 2}", F["cel"])
        W(co, f"B{r}", f"='Consumo 2027'!B{k + 2}", F["cel"])
        W(co, f"C{r}", f"='Consumo 2027'!C{k + 2}", F["cel"])
        W(co, f"D{r}", f"='Consumo 2027'!D{k + 2}", F["num"])
        W(co, f"E{r}", f"=COUNT(F{r}:I{r})", F["num"])
        for j, col in enumerate("FGHI"):
            W(co, f"{col}{r}",
              f'=IF(COUNTIFS(Normalizado!$C$2:$C$41,$A{r},Normalizado!$A$2:$A$41,{col}$4,Normalizado!$J$2:$J$41,">0")=0,"",'
              f'SUMIFS(Normalizado!$J$2:$J$41,Normalizado!$C$2:$C$41,$A{r},Normalizado!$A$2:$A$41,{col}$4))', F["p4"])
        W(co, f"J{r}", f"=MIN(F{r}:I{r})", F["p4"])
        W(co, f"K{r}", f"=INDEX($F$4:$I$4,MATCH(J{r},F{r}:I{r},0))", F["cel"])
        W(co, f"L{r}", f'=IF(COUNTIF(F{r}:I{r},J{r})>1,"Empate","")', F["cel"])
        for col_c, col_p in zip("NOPQ", "FGHI"):
            W(co, f"{col_c}{r}", f'=IF({col_p}{r}="","",$D{r}*{col_p}{r})', F["eur"])
    co.write("M15", "Total", F["lbl"])
    for col in "NOPQ":
        W(co, f"{col}15", f"=SUM({col}5:{col}14)", F["eur_b"])
    verde = wb.add_format({"bold": True, "bg_color": "#C6EFCE", "font_color": "#006100", "num_format": '"✓ "#,##0.0000 "€"'})
    verde_e = wb.add_format({"bold": True, "bg_color": "#C6EFCE", "font_color": "#006100", "num_format": '"✓ "#,##0.00 "€"'})
    co.conditional_format("F5:I14", {"type": "formula", "criteria": "=F5=MIN($F5:$I5)", "format": verde})
    co.conditional_format("N5:Q14", {"type": "formula", "criteria": "=N5=MIN($N5:$Q5)", "format": verde_e})
    rojo = wb.add_format({"bold": True, "font_color": "#C00000"})

    # Totales por proveedor
    co.write("A17", "Totales por proveedor (si se compra todo a uno solo)", F["sub"])
    for col in "FGHI":
        W(co, f"{col}17", f"={col}$4", F["cab"])
    etiquetas = {18: "Artículos ofertados", 19: "Artículos sin oferta", 20: "Estado de la oferta", 21: "Coste base anual",
                 22: "Descuento", 23: "Portes", 24: "Total anual (sin IVA)", 25: "Total comparable (solo ofertas completas)",
                 26: "Diferencia con la más barata"}
    for r, t in etiquetas.items():
        co.write(f"A{r}", t, F["lbl"] if r in (24, 25) else None)
    for col, col_c in zip("FGHI", "NOPQ"):
        W(co, f"{col}18", f"=COUNT({col}5:{col}14)", F["num"])
        W(co, f"{col}19", f"=COUNTBLANK({col}5:{col}14)", F["num"])
        W(co, f"{col}20", f'=IF({col}19>0,"Oferta incompleta","Completa")', F["cel"])
        W(co, f"{col}21", f"={col_c}15", F["eur"])
        W(co, f"{col}24", f"=SUM({col}21:{col}23)", F["eur_b"])
        W(co, f"{col}25", f'=IF({col}20="Completa",{col}24,"")', F["eur"])
        W(co, f"{col}26", f'=IF({col}25="","",{col}25-MIN($F$25:$I$25))', F["eur"])
    co.write_number("F22", 0, F["eur"]); co.write_number("H22", 0, F["eur"]); co.write_number("I22", 0, F["eur"])
    W(co, "G22", "=IF(G21>UmbralElecvia,-G21*DtoElecvia,0)", F["eur"])
    co.write_number("F23", 0, F["eur"]); co.write_number("I23", 0, F["eur"])
    W(co, "G23", "=(G21+G22)*PortesElecvia", F["eur"])
    W(co, "H23", "=IF(H21>0,PortesTormes*EnviosTormes,0)", F["eur"])
    co.write("J22", "Solo Elecvía da descuento (si supera el umbral).", F["nota"])
    co.write("J23", "Arnedo y Yesa: portes pagados.", F["nota"])
    co.conditional_format("F20:I20", {"type": "cell", "criteria": "==", "value": '"Oferta incompleta"', "format": rojo})

    # Escenario de reparto
    W(co, "A29", '="Escenario de reparto: máximo "&MaxProveedores&" proveedores y al menos "&FIXED(MinimoProveedor,0)&" € al año a cada uno"', F["sub"])
    co.write_row("A30", ["Código", "Descripción", "Cantidad", "Asignado a", "Coste base (€)"], F["cab"])
    for k in range(10):
        r, rm = 31 + k, 5 + k
        W(co, f"A{r}", f"=A{rm}", F["cel"]); W(co, f"B{r}", f"=B{rm}", F["cel"]); W(co, f"C{r}", f"=D{rm}", F["num"])
        co.write(f"D{r}", asig_esperada[orden_cod[k]], F["ent"])
        W(co, f"E{r}", f'=IFERROR(INDEX($N{rm}:$Q{rm},MATCH(D{r},$N$4:$Q$4,0)),"")', F["eur"])
    co.data_validation("D31:D40", {"validate": "list", "source": "=$F$4:$I$4",
                                   "error_title": "Proveedor", "error_message": "Elige uno de los cuatro proveedores."})
    co.write("A42", "Resumen del reparto", F["lbl"])
    for col in "FGHI":
        W(co, f"{col}42", f"={col}$4", F["cab"])
    for r, t in {43: "Coste base", 44: "Descuento", 45: "Portes", 46: "Total", 47: "¿Llega al mínimo por proveedor?"}.items():
        co.write(f"A{r}", t, F["lbl"] if r == 46 else None)
    for col in "FGHI":
        W(co, f"{col}43", f"=SUMIF($D$31:$D$40,{col}$42,$E$31:$E$40)", F["eur"])
        W(co, f"{col}46", f"=SUM({col}43:{col}45)", F["eur_b"])
        W(co, f"{col}47", f'=IF({col}43=0,"No se usa",IF({col}46>=MinimoProveedor,"Sí","NO"))', F["cel"])
    for col in "FHI":
        co.write_number(f"{col}44", 0, F["eur"])
    W(co, "G44", "=IF(G43>UmbralElecvia,-G43*DtoElecvia,0)", F["eur"])
    co.write_number("F45", 0, F["eur"]); co.write_number("I45", 0, F["eur"])
    W(co, "G45", "=(G43+G44)*PortesElecvia", F["eur"])
    W(co, "H45", "=IF(H43>0,PortesTormes*EnviosTormes,0)", F["eur"])
    co.conditional_format("F47:I47", {"type": "cell", "criteria": "==", "value": '"NO"', "format": rojo})
    res = {49: ("Proveedores usados", "=COUNTIF(F43:I43,\">0\")", "num"),
           50: ("Artículos sin asignar o sin precio", "=COUNTBLANK(E31:E40)", "num"),
           51: ("Total del reparto (sin IVA)", "=SUM(F46:I46)", "eur_b"),
           52: ("¿Mantiene Elecvía el descuento?", '=IF(G43>UmbralElecvia,"Sí","No")', "cel"),
           53: ("Ahorro frente al proveedor único más barato", "=MIN(F25:I25)-E51", "eur"),
           54: ("¿Es un reparto válido?", '=IF(AND(E49<=MaxProveedores,E50=0,COUNTIF(F47:I47,"NO")=0),"Sí","NO")', "cel")}
    for r, (t, fo, f) in res.items():
        co.write(f"A{r}", t, F["lbl"] if r in (51, 54) else None)
        W(co, f"E{r}", fo, F[f])
    co.conditional_format("E54", {"type": "cell", "criteria": "==", "value": '"NO"', "format": rojo})

    # Puntuación ponderada
    co.write("A57", "Puntuación ponderada (solo ofertas completas)", F["sub"])
    for col in "FGHI":
        W(co, f"{col}58", f"={col}$4", F["cab"])
    co.write("A59", "Coste total comparable"); co.write("A60", "Plazo de entrega (días laborables)")
    co.write("A61", "Nota de calidad (1-5)")
    W(co, "A62", '="Puntos de precio (peso "&FIXED(PesoPrecio*100,0)&" %)"')
    W(co, "A63", '="Puntos de plazo (peso "&FIXED(PesoPlazo*100,0)&" %)"')
    W(co, "A64", '="Puntos de calidad (peso "&FIXED(PesoCalidad*100,0)&" %)"')
    co.write("A65", "Puntuación (sobre 100)", F["lbl"]); co.write("A66", "Puesto")
    for col in "FGHI":
        W(co, f"{col}59", f"={col}25", F["eur"])
        W(co, f"{col}60", f'=IF({col}59="","",INDEX(\'Incidencias 2026\'!$E$2:$E$5,MATCH({col}$58,\'Incidencias 2026\'!$A$2:$A$5,0)))', F["num"])
        W(co, f"{col}61", f'=IF({col}59="","",INDEX(\'Incidencias 2026\'!$D$2:$D$5,MATCH({col}$58,\'Incidencias 2026\'!$A$2:$A$5,0)))', F["num"])
        W(co, f"{col}62", f'=IF({col}59="","",MIN($F$59:$I$59)/{col}59*100)', F["num2"])
        W(co, f"{col}63", f'=IF({col}60="","",MIN($F$60:$I$60)/{col}60*100)', F["num2"])
        W(co, f"{col}64", f'=IF({col}61="","",{col}61/NotaMaxima*100)', F["num2"])
        W(co, f"{col}65", f'=IF({col}59="","",SUMPRODUCT(Pesos,{col}62:{col}64))', wb.add_format({"num_format": "#,##0.00", "bold": True, **borde}))
        W(co, f"{col}66", f'=IF({col}65="","",RANK.EQ({col}65,$F$65:$I$65))', F["num"])
    co.write("J59", "Las ofertas incompletas no puntúan.", F["nota"])
    co.write("J62", "Mínimo entre las completas / el suyo × 100.", F["nota"])
    co.write("J64", "Nota / nota máxima × 100.", F["nota"])

    # Opciones para el informe
    co.write("A69", "Opciones para el informe", F["sub"])
    co.write_row("A70", ["Opción", "Coste anual (€)", "Plazo (días)", "Calidad (1-5)", "Puntuación"], F["cab"])
    co.write("A71", "Reparto: Tormes (cables) + Elecvía (resto)", F["cel"])
    W(co, "B71", '=IF(E54="Sí",E51,"")', F["eur"])
    for col in "CDE":
        co.write(f"{col}71", "—", F["cel"])
    for r, col in zip([72, 73, 74], "FGI"):
        W(co, f"A{r}", f"={col}4", F["cel"]); W(co, f"B{r}", f"={col}25", F["eur"])
        W(co, f"C{r}", f"={col}60", F["num"]); W(co, f"D{r}", f"={col}61", F["num"])
        W(co, f"E{r}", f"={col}65", F["num2"])
    co.write("A75", "Tormes no está: su oferta es incompleta. Si cambias el reparto, cambia también el nombre de la fila 71.", F["nota"])

    # ---------------- Informe ----------------
    inf = wb.add_worksheet("Informe")
    inf.set_tab_color("#70AD47")
    inf.hide_gridlines(2)
    for col, w_ in {"A": 8, "B": 40, "C": 16, "D": 18, "E": 12, "F": 11, "G": 13, "H": 4}.items():
        inf.set_column(f"{col}:{col}", w_)
    inf.write("A1", "Compras · Ofertas 2027 de cable, canaleta y pequeño material", F["tit"])
    inf.write("A2", "Electro Cierzo Suministros · Para Andrés Molina (reunión con Carmen Soler) · Coste anual 2027 sin IVA, "
                    "con descuentos y portes", F["nota"])
    W(inf, "G1", '=IF(ControlMaestro,"Controles: OK","Controles: REVISAR")', F["ok"])
    inf.conditional_format("G1", {"type": "cell", "criteria": "==", "value": '"Controles: OK"',
                                  "format": wb.add_format({"font_color": "#006100", "bg_color": "#C6EFCE"})})
    inf.conditional_format("G1", {"type": "cell", "criteria": "==", "value": '"Controles: REVISAR"',
                                  "format": wb.add_format({"font_color": "#9C0006", "bg_color": "#FFC7CE"})})
    inf.write("A4", "Coste anual 2027 por opción (de la más barata a la más cara)", F["sub"])
    inf.write_row("A5", ["Puesto", "Opción", "Coste anual (€)", "Diferencia con la más barata (€)", "Plazo (días lab.)",
                         "Calidad (1-5)", "Puntuación (sobre 100)"], F["cab"])
    inf.set_row(4, 30)
    for k in range(4):
        r = 6 + k
        inf.write_number(f"A{r}", k + 1, F["cen"])
        W(inf, f"C{r}", f'=IFERROR(SMALL(Comparativa!$B$71:$B$74,A{r}),"")', F["eur"])
        W(inf, f"B{r}", f'=IF(C{r}="","",INDEX(Comparativa!$A$71:$A$74,MATCH(C{r},Comparativa!$B$71:$B$74,0)))', F["cel"])
        W(inf, f"D{r}", f'=IF(C{r}="","",C{r}-$C$6)', F["eur"])
        for col, colc in zip("EFG", "CDE"):
            W(inf, f"{col}{r}", f'=IF(C{r}="","",INDEX(Comparativa!${colc}$71:${colc}$74,MATCH(C{r},Comparativa!$B$71:$B$74,0)))',
              F["num2"] if col == "G" else F["num"])
    inf.conditional_format("A6:G6", {"type": "no_blanks", "format": wb.add_format({"bold": True})})
    W(inf, "A10", '=IF(Comparativa!H20="Oferta incompleta","Tormes no entra como proveedor único: no oferta "&Comparativa!H19&" de los 10 artículos (tubo M20 y bridas).","")', F["nota"])

    ch = wb.add_chart({"type": "bar"})
    ch.add_series({"name": "Coste anual 2027 (€, sin IVA)", "categories": "='Informe'!$B$6:$B$9", "values": "='Informe'!$C$6:$C$9",
                   "fill": {"color": "#A6A6A6"}, "points": [{"fill": {"color": "#2E75B6"}}],
                   "data_labels": {"value": True, "num_format": '#,##0.00 "€"', "position": "outside_end",
                                   "font": {"bold": True, "color": "#262626"}},
                   "gap": 60})
    ch.set_title({"name": "Coste anual 2027 por opción (€, sin IVA)", "name_font": {"size": 12}})
    ch.set_y_axis({"reverse": True, "crossing": "max", "major_tick_mark": "none"})
    ch.set_x_axis({"min": 0, "num_format": '#,##0 "€"', "major_gridlines": {"visible": True, "line": {"color": "#D9D9D9"}}})
    ch.set_legend({"none": True})
    ch.set_size({"width": 860, "height": 250})
    inf.insert_chart("A12", ch, {"description": "Gráfico de barras horizontales: coste anual 2027 de cada opción, ordenado de "
                                                "la más barata (arriba) a la más cara. Las cifras están en la tabla de arriba."})

    inf.write("A26", "Conclusiones", F["sub"])
    MINU = "MIN(Comparativa!$F$25:$I$25)"
    NOMU = f"INDEX(Comparativa!$F$4:$I$4,MATCH({MINU},Comparativa!$F$25:$I$25,0))"
    MAXP = "MAX(Comparativa!$F$65:$I$65)"
    NOMP = f"INDEX(Comparativa!$F$4:$I$4,MATCH({MAXP},Comparativa!$F$65:$I$65,0))"
    W(inf, "A27", f'="1. Proveedor único más barato: "&{NOMU}&", con "&FIXED({MINU},2)&" € al año."', F["txt_w"], "G27")
    W(inf, "A28", '="2. Repartir (cables a Tormes, el resto a Elecvía) cuesta "&FIXED(Comparativa!E51,2)&" €: "&'
                  'IF(Comparativa!E53>0,"ahorra "&FIXED(Comparativa!E53,2)&" € al año ("&FIXED(Comparativa!E53/' + MINU +
                  '*100,1)&" %)","no ahorra nada: cuesta "&FIXED(-Comparativa!E53,2)&" € más")&". Tormes tiene el mejor plazo ("&'
                  '\'Incidencias 2026\'!E4&" días) y la mejor nota de calidad ("&\'Incidencias 2026\'!D4&")."', F["txt_w"], "G28")
    W(inf, "A29", f'="3. Si se pondera precio, plazo y calidad ("&FIXED(PesoPrecio*100,0)&"/"&FIXED(PesoPlazo*100,0)&"/"&FIXED(PesoCalidad*100,0)&"), gana "&{NOMP}&" con "&FIXED({MAXP},2)&" puntos sobre 100."', F["txt_w"], "G29")
    W(inf, "A30", f'="Propuesta: "&IF(Comparativa!E53>0,"repartir con Tormes si el ahorro compensa llevar dos proveedores; si se prefiere sencillez, "&{NOMU}&" sola. Decide Andrés.",{NOMU}&" sola: es más barata que repartir y más sencilla.")', F["lbl_w"], "G30")
    inf.write("A32", "Supuestos", F["sub"])
    W(inf, "A33", '="Precios de 2027 sin IVA (se recupera). Cantidades del almacén («Consumo 2027»). El pronto pago no cuenta: se paga a 60 días."', F["nota_w"], "G33")
    W(inf, "A34", '="Elecvía: se le ha quitado el IVA ("&FIXED(TipoIVA*100,0)&" %); descuento del "&FIXED(DtoElecvia*100,0)&" % si supera "&FIXED(UmbralElecvia,0)&" € y portes del "&FIXED(PortesElecvia*100,0)&" % sobre el importe con descuento."', F["nota_w"], "G34")
    W(inf, "A35", '="Tormes: "&EnviosTormes&" envíos al año a "&FIXED(PortesTormes,0)&" € cada uno. Yesa: tarifa 2026 + "&FIXED(SubidaYesa*100,0)&" % para 2027. Arnedo y Yesa: portes pagados."', F["nota_w"], "G35")
    W(inf, "A36", '="Reparto: como máximo "&MaxProveedores&" proveedores y al menos "&FIXED(MinimoProveedor,0)&" € al año a cada uno. Plazo y calidad: «Incidencias 2026» (enero-octubre). Solo puntúan las ofertas completas."', F["nota_w"], "G36")
    for r_ in range(26, 30):
        inf.set_row(r_, 30)
    for r_ in range(32, 36):
        inf.set_row(r_, 26)
    inf.set_landscape(); inf.set_paper(9); inf.fit_to_pages(1, 1); inf.center_horizontally()
    inf.set_margins(left=0.5, right=0.5, top=0.7, bottom=0.6)
    inf.set_header("&L&\"-,Negrita\"Compras · Ofertas 2027&RElectro Cierzo Suministros")
    inf.set_footer("&LP1_Ofertas_2027 · Datos a 16/11/2026&RImpreso el &D")
    inf.print_area("A1:H37")

    # ---------------- Controles ----------------
    ct = wb.add_worksheet("Controles")
    ct.set_tab_color("#C00000")
    for col, w_ in {"A": 5, "B": 70, "C": 13, "D": 13, "E": 12, "F": 11, "G": 12}.items():
        ct.set_column(f"{col}:{col}", w_)
    ct.write("A1", "Controles", F["tit"])
    ct.write("B2", "Control maestro (VERDADERO si todos los controles cuadran)", F["lbl"])
    W(ct, "D2", "=AND(G5:G18)", F["ok"])
    wb.define_name("ControlMaestro", "='Controles'!$D$2")
    ct.write_row("A4", ["Nº", "Control", "Esperado", "Obtenido", "Diferencia", "Tolerancia", "Estado"], F["cab"])
    CTL = [
        ("Líneas de oferta en Normalizado (las mismas que en Ofertas)", "=COUNTA(Ofertas!A2:A41)", "=COUNTA(Normalizado!A2:A41)", 0),
        ("Precios numéricos en Normalizado (líneas menos «consultar» y vacíos)",
         '=COUNTA(Normalizado!A2:A41)-COUNTIF(Normalizado!D2:D41,"consultar")-COUNTBLANK(Normalizado!D2:D41)',
         "=COUNT(Normalizado!D2:D41)", 0),
        ("Códigos que aparecen exactamente 4 veces (uno por proveedor)", "=COUNTA('Consumo 2027'!A2:A11)",
         "=SUMPRODUCT(--(COUNTIF(Normalizado!C2:C41,'Consumo 2027'!A2:A11)=4))", 0),
        ("Líneas con un código que no existe en «Consumo 2027»", "0",
         "=SUMPRODUCT(--(COUNTIF('Consumo 2027'!A2:A11,Normalizado!C2:C41)=0))", 0),
        ("Líneas con factor de unidad encontrado (sin #N/D)", "=COUNTA(Normalizado!A2:A41)",
         "=SUMPRODUCT(--ISNUMBER(Normalizado!G2:G41))", 0),
        ("Precios en la matriz = precios numéricos de Normalizado", "=COUNT(Normalizado!J2:J41)", "=COUNT(Comparativa!F5:I14)", 0),
        ("Cantidades de la matriz = «Consumo 2027»", "=SUM('Consumo 2027'!D2:D11)", "=SUM(Comparativa!D5:D14)", 0),
        ("Coste base de los 4 proveedores por dos caminos (SUMAPRODUCTO frente a la matriz)",
         "=SUMPRODUCT(Comparativa!D5:D14,Comparativa!F5:F14)+SUMPRODUCT(Comparativa!D5:D14,Comparativa!G5:G14)"
         "+SUMPRODUCT(Comparativa!D5:D14,Comparativa!H5:H14)+SUMPRODUCT(Comparativa!D5:D14,Comparativa!I5:I14)",
         "=SUM(Comparativa!N5:Q14)", 0.01),
        ("Total de Elecvía rehecho: base × (1 − descuento, si toca) × (1 + portes)",
         "=IF(Comparativa!G21>UmbralElecvia,Comparativa!G21*(1-DtoElecvia),Comparativa!G21)*(1+PortesElecvia)",
         "=Comparativa!G24", 0.01),
        ("Reparto: artículos asignados a un proveedor que los oferta", "=COUNTA(Comparativa!A31:A40)", "=COUNT(Comparativa!E31:E40)", 0),
        ("Reparto: proveedores usados (como máximo el parámetro)", "=MaxProveedores", "=Comparativa!E49", None),
        ("Reparto: proveedores usados que no llegan al mínimo anual", "0", '=COUNTIF(Comparativa!F47:I47,"NO")', 0),
        ("Reparto: total = coste de los artículos + descuentos + portes",
         "=SUM(Comparativa!E31:E40)+SUM(Comparativa!F44:I45)", "=Comparativa!E51", 0.01),
        ("Los pesos de la puntuación suman 100 %", "1", "=SUM(Pesos)", 0.0001),
    ]
    for i, (t, esp, obt, tol) in enumerate(CTL):
        r = 5 + i
        ct.write_number(f"A{r}", i + 1, F["num"]); ct.write(f"B{r}", t, F["celw"])
        fnum = F["num2"] if tol and tol >= 0.01 else F["dec"]
        if esp.startswith("="):
            W(ct, f"C{r}", esp, fnum)
        else:
            ct.write_number(f"C{r}", float(esp), fnum)
        W(ct, f"D{r}", obt, fnum)
        W(ct, f"E{r}", f"=D{r}-C{r}", fnum)
        if tol is None:
            ct.write(f"F{r}", "≤ esperado", F["cel"])
            W(ct, f"G{r}", f"=D{r}<=C{r}", F["cel"])
        else:
            ct.write_number(f"F{r}", tol, F["dec"])
            W(ct, f"G{r}", f"=ABS(E{r})<=F{r}", F["cel"])
    assert 5 + len(CTL) - 1 == 18
    bien = wb.add_format({"bold": True, "font_color": "#006100", "bg_color": "#C6EFCE"})
    mal = wb.add_format({"bold": True, "font_color": "#9C0006", "bg_color": "#FFC7CE"})
    for rango in ("G5:G18", "D2"):
        ct.conditional_format(rango, {"type": "cell", "criteria": "==", "value": "TRUE", "format": bien})
        ct.conditional_format(rango, {"type": "cell", "criteria": "==", "value": "FALSE", "format": mal})
    ct.write("B20", "Si un estado sale FALSO, el control maestro también, y el Informe muestra «Controles: REVISAR».", F["nota"])

    # ---------------- Cómo se hizo ----------------
    cs = wb.add_worksheet("Cómo se hizo")
    cs.set_column("A:A", 4); cs.set_column("B:B", 120); cs.hide_gridlines(2); cs.set_tab_color("#7F7F7F")
    cs.write("B1", "Cómo se hizo (pasos manuales que no se ven en las fórmulas)", F["tit"])
    pasos = [
        "Hoja «Ofertas»: clic derecho en la pestaña > Mover o copiar > marcar «Crear una copia» > Aceptar. Cambiar el nombre de la copia a «Normalizado». El original no se toca.",
        "En «Normalizado»: clic derecho en el encabezado de la columna C > Insertar. Título «Código». Poner el código de «Consumo 2027» a cada una de las 40 líneas leyendo la descripción. Comprobación: CONTAR.SI de cada código = 4 (control 3).",
        "Quitar de «Normalizado» las filas de condiciones (texto libre) de debajo de la tabla: sus cifras pasan a «Parámetros».",
        "Seleccionar SOLO la columna D (precios) > Ctrl+L (Reemplazar): buscar « €» (espacio y euro) y reemplazar por nada > Reemplazar todos. Otra vez: buscar «.» y reemplazar por «,» > Reemplazar todos. Los textos pasan a números (se alinean a la derecha). «consultar» y la celda vacía de Tormes se dejan como están: no son precios. CONTAR(D2:D41) = 38.",
        "Hoja «Parámetros»: escribir cada valor y darle nombre (seleccionar la celda > escribir el nombre en el cuadro de nombres y pulsar Intro, o Fórmulas > Asignar nombre). Tablas «Proveedores» y «Unidades» con nombre de rango.",
        "Columnas G a J de «Normalizado»: una fórmula por columna en la fila 2, copiada hasta la 41 (doble clic en el controlador de relleno).",
        "«Comparativa»: matriz de precios con SUMAR.SI.CONJUNTO y CONTAR.SI.CONJUNTO (vacía si no hay oferta); matriz de costes con =SI(F5=\"\";\"\";$D5*F5), escrita en N5 y copiada a N5:Q14.",
        "Formato condicional del mínimo de cada fila: seleccionar F5:I14 > Inicio > Formato condicional > Nueva regla > «Utilice una fórmula que determine las celdas para aplicar formato» > =F5=MIN($F5:$I5) > Formato: relleno verde, negrita y formato de número personalizado con «✓». Lo mismo en N5:Q14.",
        "Reparto: celdas D31:D40 con Datos > Validación de datos > Lista, origen =$F$4:$I$4. Cables a Tormes, el resto a Elecvía.",
        "Por qué ese reparto es el mejor (búsqueda exhaustiva hecha aparte): con descuento y portes, cada euro de Elecvía cuesta 0,95 × 1,02 = 0,969 €. Los cables de Elecvía saldrían por 45.815,28 €; en Tormes, 44.040,00 € + 1.080,00 € de portes = 45.120,00 €. En el resto de artículos gana Elecvía. Ninguna otra pareja baja de 73.135,79 €.",
        "Gráfico: seleccionar Informe!B6:C9 > Insertar > Gráficos > Insertar gráfico de columnas o de barras > Barra agrupada. Eje vertical: Dar formato al eje > «Categorías en orden inverso» (la más barata arriba). Etiquetas de datos con formato €. Eje horizontal desde 0, para no exagerar diferencias. Texto alternativo: clic derecho > Ver texto alternativo.",
        "Informe en una página: Disposición de página (en la ayuda, «Diseño de página») > Orientación > Horizontal; grupo Ajustar área de impresión > Ancho: 1 página y Alto: 1 página; Imprimir títulos > Encabezado y pie de página. Exportar: Archivo > Exportar > Crear documento PDF/XPS, con la hoja «Informe» activa.",
        "Controles: cada fila compara un valor esperado con el obtenido; Estado = ABS(diferencia) <= tolerancia. Control maestro =Y(G5:G18) con nombre ControlMaestro, que se repite arriba del Informe.",
        "Cambio inesperado (Elecvía: 7 % si supera 20.000 €): cambiar DtoElecvia a 7 % y UmbralElecvia a 20.000 en «Parámetros». Elecvía sola pasa a 72.276,73 € y el reparto a 72.545,99 €: la recomendación cambia a Elecvía sola, y hay que avisar a Andrés.",
    ]
    for i, t in enumerate(pasos, start=2):
        cs.write_number(i, 0, i - 1); cs.write(i, 1, t, F["txt"])
        cs.set_row(i, 15 * (1 + len(t) // 115))

    le.activate()
    wb.close()


# ---------------------------------------------------------------------------
# 4. Recalcular con LibreOffice (perfil temporal es-ES) y leer los valores
# ---------------------------------------------------------------------------
def recalcular(xlsx):
    tmp = tempfile.mkdtemp(prefix="p1lo_")
    prof = os.path.join(tmp, "perfil", "user")
    os.makedirs(prof)
    with open(os.path.join(prof, "registrymodifications.xcu"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<oor:items xmlns:oor="http://openoffice.org/2001/registry" '
                 'xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
                 '<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse"><value>0</value></prop></item>\n'
                 '<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooSetupSystemLocale" oor:op="fuse"><value>es-ES</value></prop></item>\n'
                 '<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooLocale" oor:op="fuse"><value>es-ES</value></prop></item>\n'
                 '</oor:items>\n')
    out = os.path.join(tmp, "out")
    subprocess.run(["soffice", f"-env:UserInstallation=file://{os.path.join(tmp, 'perfil')}", "--headless",
                    "--convert-to", "xlsx", "--outdir", out, xlsx], check=True, capture_output=True, timeout=180)
    wbv = openpyxl.load_workbook(os.path.join(out, os.path.basename(xlsx)), data_only=True)
    valores = {}
    for ws in wbv.worksheets:
        for fila_v in ws.iter_rows():
            for c in fila_v:
                if c.value is not None:
                    valores[(ws.title, c.coordinate)] = c.value
    shutil.rmtree(tmp, ignore_errors=True)
    return valores


borrador = os.path.join(tempfile.gettempdir(), "p1-solucion-borrador.xlsx")
construir(borrador, {})
vals = recalcular(borrador)
os.remove(borrador)
construir(SALIDA, vals)


def etiquetas_solo_valor(xlsx):
    """xlsxwriter solo escribe <c:showVal val="1"/>; LibreOffice entiende que lo que falta
    (nombre de serie y categoría) también se muestra. Se escriben todos explícitamente."""
    import zipfile
    tmp = xlsx + ".tmp"
    with zipfile.ZipFile(xlsx) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for it in zin.infolist():
            data = zin.read(it.filename)
            if it.filename.startswith("xl/charts/chart"):
                data = data.decode("utf-8").replace(
                    '<c:showVal val="1"/>',
                    '<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/>'
                    '<c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/>').encode("utf-8")
            zout.writestr(it, data)
    os.replace(tmp, xlsx)


etiquetas_solo_valor(SALIDA)


# ---------------------------------------------------------------------------
# 5. Las fórmulas del libro dan lo mismo que pandas
# ---------------------------------------------------------------------------
def v(hoja, celda):
    return vals.get((hoja, celda))


def igual(a, b, tol=0.005):
    assert a is not None and abs(float(a) - float(b)) <= tol, (a, b)


igual(v("Normalizado", "J2"), of.loc[0, "Base"], 1e-9)
igual(v("Comparativa", "G5"), R["base_elecvia_cab_rz1k_3g25"], 1e-9)
igual(v("Comparativa", "G10"), R["base_elecvia_can40"], 1e-9)
for col, p in zip("FGHI", PROVS):
    igual(v("Comparativa", f"{col}21"), base_prov[p])
    igual(v("Comparativa", f"{col}24"), total[p])
igual(v("Comparativa", "G22"), tot["Elecvía"][0]); igual(v("Comparativa", "G23"), tot["Elecvía"][1])
igual(v("Comparativa", "E51"), reparto_total); igual(v("Comparativa", "E53"), ahorro)
igual(v("Comparativa", "H46"), rep_T[2]); igual(v("Comparativa", "G46"), rep_E[2])
for col, p in zip("FGI", ["Arnedo", "Elecvía", "Yesa"]):
    igual(v("Comparativa", f"{col}65"), punt[p], 1e-6)
assert v("Comparativa", "H20") == "Oferta incompleta" and v("Comparativa", "E54") == "Sí"
assert v("Comparativa", "L13") == "Empate" and v("Comparativa", "K10") == "Tormes"
assert v("Controles", "D2") is True and all(v("Controles", f"G{r}") is True for r in range(5, 19))
assert v("Informe", "G1") == "Controles: OK" and v("Informe", "B6", ).startswith("Reparto")
assert v("Normalizado", "J23") is None  # bridas de Tormes: sin precio
print("Fórmulas del libro = pandas: OK")
print("Informe:", [v("Informe", f"A{r}") for r in range(27, 31)])

# Resumen en pantalla
print(json.dumps({k: R[k] for k in ["precios_numericos", "coste_base", "total", "reparto", "ahorro_reparto",
                                     "ahorro_pct", "puntuacion", "errores", "cambio_inesperado", "ampliaciones",
                                     "porque_reparto"]}, ensure_ascii=False, indent=1, default=float))

# -*- coding: utf-8 -*-
"""Construye proyectos/p6.json y los .meta.json de P6 a partir de los totales de control
(libros/src/p6-controles.json, calculados con pandas) y de los datos. Las cifras de los
errores típicos se recalculan aquí desde los datos sucios (nunca a ojo)."""
import json
import os

import pandas as pd

EXCEL = "/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel"
LIB = os.path.join(EXCEL, "libros")
C = json.load(open(os.path.join(LIB, "src", "p6-controles.json"), encoding="utf-8"))


def es(x, dec=2):
    return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def eur(x, dec=2):
    return es(x, dec) + " €"


# ---------------------------------------------------------------------------
# Impacto de cada error típico sobre el valor del stock (después del recuento)
# ---------------------------------------------------------------------------
raw = pd.read_csv(os.path.join(LIB, "p6-movimientos.csv"), sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
inv = pd.read_excel(os.path.join(LIB, "p6-datos.xlsx"), sheet_name="Inventario_30-04", dtype={"CodArticulo": object})
fic = pd.read_excel(os.path.join(LIB, "p6-datos.xlsx"), sheet_name="Fichas", dtype={"CodArticulo": str})
rec = pd.read_excel(os.path.join(LIB, "p6-datos.xlsx"), sheet_name="Recuento_31-10", dtype={"CodArticulo": str})
coste = dict(zip(fic["CodArticulo"], fic["CosteUnitario"]))
recd = dict(zip(rec["CodArticulo"], rec["StockFísico"]))
SIGNO = {"SAL": -1, "SALIDA": -1, "ENT": 1, "DEV": 1, "DPR": -1, "REG+": 1, "REG-": -1, "TRA": 0}


def valor(inv_df, mov_df, cod_inv="Cod"):
    s0 = inv_df.groupby(cod_inv)["StockContado"].sum()
    mn = mov_df.groupby("CodArticulo")["CF"].sum()
    total = 0.0
    for c in coste:
        st = recd[c] if c in recd else s0.get(c, 0.0) + mn.get(c, 0.0)
        total += st * coste[c]
    return total


inv["Cod"] = [c if isinstance(c, str) else f"{int(c):06d}" for c in inv["CodArticulo"]]
m = raw.copy()
m["T"] = m["Tipo"].str.strip().str.upper()
m["Q"] = m["Cantidad"].str.replace(".", ",", regex=False).str.replace(",", ".", regex=False).astype(float)
m["CF"] = m["Q"].abs() * m["T"].map(SIGNO)
limpio = m[~m.duplicated(["Documento", "Línea"])].copy()
v_ok = valor(inv, limpio)
assert abs(v_ok - C["valor_stock"]) < 0.01, (v_ok, C["valor_stock"])
# a) Quitar duplicados en el inventario (borra las segundas ubicaciones)
v_quitar = valor(inv.drop_duplicates("Cod"), limpio)
# b) No quitar el solape del 31/07
v_solape = valor(inv, m)
# c) Cantidad × signo sin valor absoluto (las 40 salidas en negativo suman)
c_sin_abs = limpio.assign(CF=limpio["Q"] * limpio["T"].map(SIGNO))
v_sin_abs = valor(inv, c_sin_abs)
# d) «12.5» leído con Español (España) como 125 (el punto es separador de miles)
c_125 = limpio.copy()
pto = c_125["Cantidad"].str.contains(r"\.", regex=True)
c_125.loc[pto, "CF"] = c_125.loc[pto, "Cantidad"].str.replace(".", "", regex=False).astype(float).abs() * c_125.loc[pto, "T"].map(SIGNO)
v_125 = valor(inv, c_125)
n_pto = int(pto.sum())
# e) Códigos sin arreglar: el inventario de esas filas no se encuentra por el código de 6 cifras
inv_mal = inv.copy()
inv_mal["Cod"] = [c if isinstance(c, str) else str(int(c)) for c in inv_mal["CodArticulo"]]
v_codigos = valor(inv_mal, limpio)
# f) Quitar duplicados con todas las columnas ANTES de convertir la fecha (no ve el solape)
dup_todas = int(raw.duplicated().sum())
imp = {"quitar": v_ok - v_quitar, "solape": v_ok - v_solape, "sin_abs": v_sin_abs - v_ok, "p125": v_125 - v_ok, "codigos": v_ok - v_codigos}
print({k: round(v, 2) for k, v in imp.items()}, "duplicados con todas las columnas:", dup_todas, "filas con punto:", n_pto)

# ---------------------------------------------------------------------------
# Cifras de la solución
# ---------------------------------------------------------------------------
V_STOCK = round(v_ok + 1e-6, 2)                       # 1.051.445,525 → Excel muestra 1.051.445,53
N_A, N_B, N_C = C["abc_n"]["A"], C["abc_n"]["B"], C["abc_n"]["C"]
SENS = C["sensibilidad_ss"]
PP = C["pedido_por_proveedor"]
pct_muertos = C["valor_muertos"] / C["valor_stock"]
subir99 = SENS["0.99"] - C["valor_ss"]
muertos = C["muertos_lista"]
top = C["top_pedido"]
rec_l = C["recuento_lista"]
cod_led = [r for r in rec_l if "LED-0412" in r[1]][0]
cod_cab = [r for r in rec_l if r[1].startswith("Cable RZ1-K 0,6/1 kV 3G2,5")][0]
frontera = C["frontera"]
tipos = C["tipos_variantes"]


def fecha_es(s):
    if s in (None, "nan", "NaT") or (isinstance(s, float)):
        return "sin salidas"
    a, mth, d = s.split("-")
    return f"{d}/{mth}/{a}"


tabla_prov = "\n".join(f"| {p} | {PP[p][0]} | {eur(PP[p][1])} |" for p in sorted(PP)) + "\n| Yesa | 0 | 0,00 € |"
tabla_muertos = "\n".join(f"| {r[1]} | {es(float(r[2]), 0) if float(r[2]) % 1 == 0 else es(float(r[2]), 1)} | {eur(float(r[3]))} | {fecha_es(r[4])} |" for r in muertos)
tabla_top = "\n".join(f"| {r[2]} | {r[1]} | {es(float(r[3]), 0)} | {eur(float(r[4]))} |" for r in top)

# ---------------------------------------------------------------------------
# Proyecto
# ---------------------------------------------------------------------------
p6 = {
    "id": "p6",
    "titulo": "Stock, punto de pedido y clasificación ABC",
    "departamento": "Compras y almacén",
    "nivel_requerido": "n4",
    "horas": 9,
    "resumen": "Convierte el inventario de abril, seis meses de movimientos del ERP y las fichas de proveedores en una hoja que cada lunes dice qué pedir, cuánto y a quién, qué artículos están muertos y cuánto dinero tienen parado.",
    "habilidades": [
        "Power Query: tipos con configuración regional y combinar consultas",
        "Movimientos con signo según el tipo",
        "Falsos duplicados y Agrupar por",
        "Solape de extracciones (clave Documento + Línea)",
        "Demanda semanal con las semanas a cero",
        "DESVEST.M, INV.NORM.ESTAND y RAIZ",
        "Stock de seguridad y punto de pedido",
        "REDONDEAR.MAS y MULTIPLO.SUPERIOR",
        "LET",
        "ABC con % acumulado y SI.CONJUNTO",
        "Gráfico de Pareto",
        "MAX.SI.CONJUNTO (última salida)",
        "FILTRAR y ORDENARPOR",
        "Tabla de datos y Administrador de escenarios",
    ],
    "correo": {
        "de": "Andrés Molina (Jefe de compras y almacén)",
        "para": "ti",
        "asunto": "El almacén",
        "cuerpo": "Hola:\n\nNos estamos quedando sin lo que más se vende y tenemos el almacén lleno de cosas que no salen. Quiero una hoja que cada lunes me diga qué tengo que pedir y cuánto, y qué artículos están muertos.\n\nTe paso el inventario que hicimos el 30 de abril, los movimientos de mayo a octubre y las fichas de proveedores.\n\nAndrés",
    },
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel: ¿qué le preguntarías a Andrés? Escribe el correo con tus preguntas (de 5 a 8, concretas).",
        "modelo": "Hola, Andrés:\n\nAntes de empezar, para que la hoja te sirva de verdad:\n1. «Lo que más se vende»: ¿en unidades o en euros? Si clasifico por importancia (ABC), ¿dónde pongo los cortes?\n2. ¿Cuántas roturas de stock estamos dispuestos a aceptar? ¿Igual para todos los artículos?\n3. Los plazos de entrega de las fichas, ¿son días laborables o naturales? ¿Son fiables?\n4. Lo que ya está pedido y no ha llegado, ¿lo descuento de lo que hay que pedir?\n5. ¿Qué es para ti un artículo «muerto»? ¿Cuánto tiempo sin salidas y desde qué fecha?\n6. ¿Hay lotes mínimos o múltiplos de compra (rollos de 100 m, cajas)?\n7. ¿Cada cuánto se pide a los proveedores? ¿Solo los lunes?\n8. ¿Nos podemos fiar del inventario de abril o se ha contado algo después?\n\nGracias.",
        "criterios": [
            "Pregunta si «lo que más se vende» se mide en unidades o en euros y dónde van los cortes A, B y C.",
            "Pide el nivel de servicio (cuántas roturas se aceptan) y si cambia según el artículo.",
            "Aclara los plazos (laborables o naturales, fiables o no), los lotes y múltiplos y si cuenta lo pendiente de recibir.",
            "Pide una definición de «muerto» con número de días y fecha de referencia.",
            "Pregunta cada cuánto se pide y si el inventario de partida es fiable.",
        ],
    },
    "aclaraciones": [
        {"pregunta": "¿«Lo que más se vende» en unidades o en euros?", "respuesta": "En euros: unidades consumidas × coste. A = hasta el 80 % acumulado, B = hasta el 95 %, C = el resto."},
        {"pregunta": "¿Qué cuenta como consumo?", "respuesta": "Las salidas por venta menos las devoluciones de clientes. Los traspasos entre almacenes, las regularizaciones y las devoluciones a proveedor no son consumo. El stock es el de toda la empresa."},
        {"pregunta": "¿Cuántas roturas de stock aceptamos?", "respuesta": "Nivel de servicio del 95 % para A y B y del 90 % para C."},
        {"pregunta": "¿Plazos en días naturales o laborables? ¿Son fiables?", "respuesta": "Laborables, los de la ficha. Son reales. Si una ficha no tiene plazo, usa el habitual del proveedor (hoja Proveedores)."},
        {"pregunta": "¿Cuenta lo pedido y aún no recibido?", "respuesta": "Sí: posición = stock + pendiente de recibir. No quiero pedir dos veces lo mismo."},
        {"pregunta": "¿Qué es un artículo «muerto»?", "respuesta": "Sin salidas en los últimos 90 días naturales (antes del 02/08/2026) y con stock. Quiero el valor inmovilizado y la lista para negociar devoluciones."},
        {"pregunta": "¿Lotes mínimos y múltiplos?", "respuesta": "Están en la ficha de cada artículo."},
        {"pregunta": "¿Cada cuánto se pide?", "respuesta": "Cada lunes: revisión semanal, R = 5 días laborables."},
        {"pregunta": "¿Nos podemos fiar del inventario de abril?", "respuesta": "El sábado 31/10 recontamos 10 artículos (hoja Recuento_31-10). Si no cuadra con lo que te sale, manda el recuento, y dime las diferencias."},
    ],
    "datos_md": (
        "Dos archivos, tal como salen del almacén y del ERP:\n\n"
        "| Archivo u hoja | Qué es |\n|---|---|\n"
        "| `p6-movimientos.csv` | Movimientos del 01/05 al 31/10/2026: Fecha, Tipo, CodArticulo, Cantidad, Documento, Línea, Almacén y Usuario. UTF-8, separador «;», coma decimal. Unas 9.000 filas |\n"
        "| `p6-datos.xlsx` · Inventario_30-04 | El inventario físico del 30/04/2026, **una fila por ubicación** del almacén |\n"
        "| `p6-datos.xlsx` · Fichas | Proveedor, plazo (días laborables), lote mínimo, múltiplo, coste unitario, pendiente de recibir y fecha prevista |\n"
        "| `p6-datos.xlsx` · Proveedores | Plazo habitual de cada uno de los 6 proveedores |\n"
        "| `p6-datos.xlsx` · Recuento_31-10 | Recuento físico de 10 artículos el sábado 31/10/2026 |\n"
        "| `p6-datos.xlsx` · Movimientos_csv | Copia en texto del CSV, solo por si no puedes importarlo |\n\n"
        "Tipos del ERP: ENT (compra), SAL (venta), DEV (devolución de cliente), DPR (devolución a proveedor), REG+ y REG− (regularización) y TRA (traspaso entre almacenes: dos líneas, una negativa y otra positiva). El ERP graba la cantidad en positivo y el signo lo da el tipo, salvo en los traspasos.\n\n"
        "Lo que tienes que esperar (no todo está dicho):\n"
        "- El CSV es la unión de las extracciones de cada mes, y no todas se sacaron igual ni desde el mismo terminal.\n"
        "- En el inventario hay códigos que se repiten. Antes de borrar nada, mira **por qué** se repiten.\n"
        "- Alguien abrió el inventario con Excel antes de mandártelo.\n"
        "- Las fichas son de Compras y no están todas al día.\n"
        "- Cuenta filas y claves de cada archivo **antes** de construir: casi todos los descuadres salen de ahí."
    ),
    "archivos": [
        {"archivo": "p6-datos.xlsx", "titulo": "Inventario, fichas y recuento", "descripcion": "Instrucciones, inventario del 30/04 por ubicaciones, fichas de artículos, proveedores, recuento del 31/10 y una copia en texto del CSV."},
        {"archivo": "p6-movimientos.csv", "titulo": "Movimientos de mayo a octubre (CSV del ERP)", "descripcion": f"{es(C['filas_csv'], 0)} filas, UTF-8, separador «;». Impórtalo con Datos > Obtener datos > De archivo > De texto/CSV, no con doble clic."},
    ],
    "pasos": [
        {"titulo": "1. Pactar el encargo y montar el libro",
         "md": "Manda tus preguntas a Andrés y apunta sus respuestas en **Léame**, con un **glosario** (stock, posición, consumo, stock de seguridad, punto de pedido, cobertura, rotación, ABC, muerto). Crea **Parámetros** con nombre: fecha de corte, niveles de servicio por clase, cortes A y B, días para «muerto» y R.",
         "pista": "Cada cifra que Andrés pueda cambiar mañana (el 95 %, los 90 días, R = 5) va en una celda amarilla con nombre (**Fórmulas > Asignar nombre**). Ninguna fórmula debe llevar un 0,95 escrito dentro."},
        {"titulo": "2. Perfilar antes de construir",
         "md": "Hoja **Calidad**: filas, claves únicas, vacíos y valores raros de cada fuente, con el nº de filas afectadas y la decisión que tomas. Abre el CSV con el Bloc de notas antes de tocarlo con Excel.",
         "pista": "Preguntas útiles: ¿cuántas filas tiene el inventario y cuántos códigos distintos? ¿Cuántas variantes de Tipo hay? ¿Se repite alguna pareja Documento + Línea? ¿Todas las fechas tienen el mismo aspecto? ¿Todos los artículos tienen ficha?"},
        {"titulo": "3. Movimientos con Power Query",
         "md": "Importa el CSV con **CodArticulo como texto**, fechas y cantidades con la configuración regional correcta, el tipo normalizado con una tabla **TiposMovimiento** (signo y si es consumo), sin el solape de extracciones y con una columna **CantidadFirmada**.",
         "pista": "**Datos > Obtener datos > De archivo > De texto/CSV** > Transformar datos. Borra el paso automático «Tipo cambiado». Quita duplicados seleccionando **solo** Documento y Línea. CantidadFirmada = `Number.Abs([Cantidad]) * [Signo]`: el valor absoluto arregla las salidas grabadas en negativo."},
        {"titulo": "4. Inventario por artículo",
         "md": "Del inventario del 30/04 saca una fila por artículo, con el código de 6 cifras y la suma de todas sus ubicaciones. Control: 180 artículos y las mismas unidades que el origen.",
         "pista": "Algunos códigos han perdido los ceros: `=TEXTO(A2;\"000000\")` o `Text.PadStart(Text.From([CodArticulo]), 6, \"0\")`. Después **Agrupar por** código con la suma de StockContado. Aquí no se quitan duplicados: el mismo artículo en dos ubicaciones es stock real."},
        {"titulo": "5. Stock a 31/10 y recuento",
         "md": "Stock = inventario + Σ CantidadFirmada; aplica el recuento del 31/10 como ajuste (manda el recuento). Comprueba que los traspasos suman 0 y que no queda ningún stock negativo.",
         "pista": "SUMAR.SI.CONJUNTO de CantidadFirmada por código. Si te sale algún stock negativo, casi seguro es un código que en el inventario va como número. De los 10 recontados, 8 tienen que cuadrar."},
        {"titulo": "6. Demanda semanal con ceros",
         "md": "Matriz artículo × semana ISO, de la 19 a la 44 (26 semanas completas), con el consumo (SAL − DEV) y **un 0 en cada semana sin ventas**. De ahí sale la desviación típica semanal de cada artículo.",
         "pista": "`=ISO.NUM.DE.SEMANA([@Fecha])` en la tabla de movimientos y `=SUMAR.SI.CONJUNTO(Mov[Consumo];Mov[CodArticulo];$A2;Mov[Semana];B$1)` en la matriz. Una tabla dinámica solo vale con «Mostrar elementos sin datos»: si no, DESVEST.M no ve las semanas vacías y el colchón sale más pequeño."},
        {"titulo": "7. Stock de seguridad, punto de pedido y cantidad",
         "md": "Por artículo: demanda diaria, plazo (laborables; si falta, el del proveedor), nivel de servicio de su clase, stock de seguridad (SS), punto de pedido (ROP), nivel máximo S = ROP + d × R, posición = stock + pendiente y cantidad a pedir con lote mínimo y múltiplo. Primero en columnas; al final, en una sola fórmula con LET.",
         "pista": "SS = `REDONDEAR.MAS(INV.NORM.ESTAND(nivel)*σ semanal/RAIZ(5)*RAIZ(plazo);0)`. Se pide si posición ≤ ROP: `MAX(lote;MULTIPLO.SUPERIOR(S-posición;múltiplo))`. Pruébalo con el ejemplo resuelto: d = 42 m/día, σ semanal = 61 m, plazo 4 días, 95 % → SS = 90 m y ROP = 258 m."},
        {"titulo": "8. Clasificación ABC y Pareto",
         "md": "Consumo valorado anual (consumo × coste × 52/26) de los artículos con ficha, de mayor a menor, % acumulado y clase: A hasta el 80 %, B hasta el 95 %, C el resto. Gráfico de Pareto.",
         "pista": "% acumulado sin reordenar la tabla: `=SUMAR.SI.CONJUNTO([ValorAnual];[ValorAnual];\">=\"&[@ValorAnual])/SUMA([ValorAnual])`. Clase: `=SI.CONJUNTO([@Acum]<=CorteA;\"A\";[@Acum]<=CorteB;\"B\";VERDADERO;\"C\")`. Pareto: **Insertar > Insertar gráfico estadístico > Histograma > Pareto**."},
        {"titulo": "9. Artículos muertos",
         "md": "Última salida de cada artículo; muertos = sin salidas en los 90 días naturales anteriores al 31/10 y con stock; su valor; y la lista ordenada por valor para negociar devoluciones.",
         "pista": "`=MAX.SI.CONJUNTO(Mov[Fecha];Mov[CodArticulo];[@Cod];Mov[Tipo];\"SAL\")`. Si da 0, no ha vendido nada en todo el periodo: dale el formato `dd/mm/aaaa;;\"sin salidas\"` para que no se lea como 00/01/1900. Muerto si `FechaCorte-[@UltimaSalida]>DiasMuerto` y el stock es mayor que 0."},
        {"titulo": "10. Hoja «Lunes»",
         "md": "La propuesta lista para enviar: solo lo que hay que pedir, por proveedor, con cantidad, coste e importe, y un total por proveedor. Que se imprima bien: horizontal, una página de ancho y encabezados repetidos.",
         "pista": "ORDENARPOR(FILTRAR(…;Calc[Cantidad]>0);…) con el proveedor como primer criterio, y totales con SUMAR.SI.CONJUNTO. En Excel 2016/2019: filtra la tabla por Cantidad > 0 y copia a una hoja de envío."},
        {"titulo": "11. Qué pasaría si",
         "md": "Una **Tabla de datos** con el valor del stock de seguridad si todos los artículos tuvieran un nivel de servicio del 90, 95, 97,5 o 99 %, y un **escenario** «Tormes retrasa 5 días» (su plazo + 5) con las líneas y el importe de la propuesta.",
         "pista": "**Datos > Previsión > Análisis de hipótesis > Tabla de datos**, con la celda de entrada en un «nivel único» de Parámetros que, vacío, deja los niveles por clase. Para el escenario: un parámetro RetrasoTormes que se suma al plazo solo si el proveedor es Tormes, y **Administrador de escenarios** > Resumen."},
        {"titulo": "12. Controles, resumen y correo",
         "md": "Hoja **Controles** con esperado, obtenido, diferencia, tolerancia y estado, y el control maestro `=Y(…)` repetido en el encabezado de «Lunes» y del resumen. Correo breve a Andrés.",
         "pista": "Controles mínimos: 196 filas → 180 artículos con las mismas unidades, 63 repetidas quitadas, traspasos = 0, ningún stock negativo, 8 de 10 recuentos cuadran, 3 sin ficha, A + B + C = artículos con ficha, % acumulado final = 100 % y la fórmula con LET = las columnas paso a paso."},
        {"titulo": "13. Cambio inesperado (después de entregar)",
         "md": "Nuevo correo de Andrés: «Tormes cierra del 21/12/2026 al 08/01/2027 y, desde enero, revisamos cada dos semanas». Ajusta el libro sin rehacerlo y dile qué habría que pedir a Tormes antes del cierre.",
         "pista": "Si todo cuelga de Parámetros, son dos entradas: R = 10 y un escenario de cierre con el plazo de Tormes + 12 laborables (del 21/12 al 08/01 hay 12 días laborables). Apunta el cambio en el registro del Léame y di en el correo cómo cambia la propuesta."},
    ],
    "controles": [
        {"pregunta": "Filas repetidas que quitas del CSV de movimientos (clave Documento + Línea)", "respuesta": C["duplicados"], "tolerancia": 0,
         "pista": f"Agrupa por Documento y Línea y cuenta: las que salen dos veces son todas del 31/07. Si te salen {dup_todas}, has usado Quitar duplicados con todas las columnas antes de convertir la fecha: la copia repetida trae la fecha escrita de otra forma."},
        {"pregunta": "Valor del stock a 31/10/2026 de los 177 artículos con ficha, después del recuento (€)", "respuesta": V_STOCK, "tolerancia": 0.01,
         "pista": f"Si te faltan {eur(imp['quitar'])}, has quitado las segundas ubicaciones del inventario (se suman). Si te faltan {eur(imp['solape'])}, el 31/07 está dos veces. Si te sobran {eur(imp['sin_abs'])}, hay salidas en negativo que suman en vez de restar."},
        {"pregunta": "Artículos de clase A", "respuesta": N_A, "tolerancia": 0,
         "pista": "ABC por valor del consumo (unidades × coste), no por unidades, y solo con los artículos que tienen ficha. A es todo lo que queda hasta el 80 % acumulado, incluido el artículo que lo alcanza si no lo pasa."},
        {"pregunta": "Valor inmovilizado en artículos muertos (€)", "respuesta": C["valor_muertos"], "tolerancia": 0.01,
         "pista": f"Deben salirte {C['muertos']} artículos, {C['muertos_sin_ventas']} de ellos sin ninguna salida desde mayo (MAX.SI.CONJUNTO da 0). Una salida el 03/08 son 89 días: ese artículo todavía no está muerto."},
        {"pregunta": "Líneas (artículos) de la propuesta de pedido", "respuesta": C["lineas_pedido"], "tolerancia": 0,
         "pista": f"Si te salen {C['sin_pendiente'][0]}, no has sumado lo pendiente de recibir a la posición. Si te salen {C['sigma_sin_ceros'][0]}, la desviación típica está hecha solo con las semanas con venta. Los artículos sin ficha no se piden."},
        {"pregunta": "Importe total de la propuesta de pedido (€, sin IVA)", "respuesta": C["importe_pedido"], "tolerancia": 0.01,
         "pista": "Cantidad = MAX(lote mínimo; MULTIPLO.SUPERIOR(S − posición; múltiplo)), con S = ROP + d × 5. Revisa que el plazo esté en días laborables y que los plazos vacíos tomen el del proveedor."},
        {"pregunta": "Valor del stock de seguridad con los niveles pactados (95 % A y B, 90 % C) (€)", "respuesta": C["valor_ss"], "tolerancia": 0.01,
         "pista": "Σ SS × coste. El SS se redondea siempre hacia arriba (REDONDEAR.MAS) y la σ diaria es la σ de las 26 semanas, con ceros, dividida entre RAIZ(5)."},
        {"pregunta": "Importe total de la propuesta en el escenario «Tormes retrasa 5 días» (€)", "respuesta": C["esc_tormes5"][1], "tolerancia": 0.01,
         "pista": f"Solo cambia el plazo de los artículos de Tormes (+5 laborables). El número de líneas no cambia ({C['esc_tormes5'][0]}), pero el pedido de Tormes pasa de {eur(C['base_tormes'][1])} a {eur(C['esc_tormes5_tormes'][1])}."},
    ],
    "entregables": [
        "Libro P6_Stock_ABC_2026-10_v01.xlsx con Léame (glosario, supuestos, cómo actualizar y registro de cambios), Parámetros, consultas de Power Query, Calidad, cálculos, ABC con Pareto, Muertos, Lunes, Qué pasaría si y Controles con el control maestro en verde.",
        "PDF de la hoja «Lunes» con la propuesta agrupada por proveedor, lista para enviar.",
        "Lista de los artículos sin ficha para Compras (no se piden a ciegas) y de las 2 diferencias del recuento.",
        "Correo de entrega a Andrés con las cifras clave, 3 conclusiones, supuestos, riesgos y cómo se actualiza cada lunes.",
        "Tras el cambio inesperado: el libro con el escenario de cierre de Tormes y la revisión quincenal, el registro de cambios al día y un correo con lo que hay que pedir a Tormes antes del 18/12.",
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: quita las ubicaciones dobles del inventario o deja el 31/07 dos veces; el stock no cuadra con los controles.",
            "Aceptable: el stock cuadra, pero la desviación típica no lleva las semanas a cero o el plazo está en días naturales.",
            "Bien: stock, SS, ROP y cantidades correctos dentro de la tolerancia; el recuento cuadra o sus 2 diferencias están explicadas.",
            "Excelente: además, detecta los 3 artículos sin ficha y explica con cifras qué pasa si no se arreglan los códigos sin ceros.",
        ]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: fórmulas largas con los niveles y los días escritos dentro; datos y cálculos mezclados.",
            "Aceptable: hay Parámetros, pero algún nivel de servicio o umbral sigue escrito dentro de las fórmulas.",
            "Bien: tabla de tipos de movimiento, parámetros con nombre por clase, Tablas y una fórmula LET legible.",
            "Excelente: además, glosario en el Léame y la hoja «Lunes» separada del cálculo, de izquierda a derecha.",
        ]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: cada lunes hay que rehacer la hoja.",
            "Aceptable: se pegan los movimientos nuevos y se ajustan rangos a mano siguiendo instrucciones.",
            "Bien: se guarda el CSV nuevo, se pulsa Actualizar todo y sale la propuesta; el cambio de Tormes se resuelve en minutos.",
            "Excelente: además, los controles avisan solos de días repetidos o semanas sin movimientos, con registro de cambios y celdas protegidas.",
        ]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: una lista de 180 artículos sin prioridad ni formato.",
            "Aceptable: la propuesta se entiende, pero no está agrupada por proveedor o no se imprime bien.",
            "Bien: «Lunes» por proveedor y lista para enviar; Pareto claro; euros, fechas y porcentajes con formato.",
            "Excelente: además, muertos con su valor y semáforo de cobertura que lleva la palabra (no solo el color), con texto alternativo en el gráfico.",
        ]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: no pregunta nada y entrega «pide esto».",
            "Aceptable: pregunta parte de lo ambiguo; el correo da la lista sin explicar el criterio.",
            "Bien: pregunta lo esencial; el correo explica el método en llano, da las cifras clave y el coste de subir el nivel de servicio.",
            "Excelente: además, propone qué hacer con los muertos, avisa de los límites (datos a 31/10, artículos sin ficha) y propone un calendario de revisión.",
        ]},
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas la hoja a Andrés (máximo 15 líneas).",
        "modelo": (
            "Asunto: Hoja de pedidos del lunes y artículos muertos (datos a 31/10)\n\n"
            "Hola, Andrés:\n\n"
            f"Te dejo en Compras el libro P6_Stock_ABC_2026-10_v01.xlsx y el PDF de la propuesta por proveedor. Los controles cuadran: stock a 31/10 de {eur(V_STOCK)}; del recuento, 8 de 10 iguales (LED-0412, −3 ud, y cable RZ1-K 3G2,5, −12,5 m, ya ajustados).\n\n"
            f"1. Con los datos a 31/10 hay que pedir {C['lineas_pedido']} artículos por {eur(C['importe_pedido'])} sin IVA; {C['pedido_lineas_A']} son de clase A. Hay {C['stock_cero_con_venta']} artículos que se venden y están a cero.\n"
            f"2. Hay {C['muertos']} artículos muertos con {eur(C['valor_muertos'])} parados ({es(pct_muertos * 100, 1)} % del stock); {C['muertos_sin_ventas']} no han vendido nada desde mayo. Propongo pedir devolución o abono a cada proveedor y, si no aceptan, liquidarlos con descuento.\n"
            f"3. {N_A} artículos (clase A) hacen el 80 % del consumo: son los que hay que mirar cada lunes.\n\n"
            f"Supuestos: servicio del 95 % en A y B y del 90 % en C, plazos laborables de la ficha y lo pendiente descontado. Subirlo todo al 99 % costaría {eur(subir99, 0)} más de stock de seguridad. Si Tormes se retrasa 5 días, su pedido pasa de {eur(C['base_tormes'][1])} a {eur(C['esc_tormes5_tormes'][1])}.\n"
            "Ojo: 3 artículos no tienen ficha y no se piden hasta que Compras la complete, y los datos son de hace dos semanas. Cada lunes: guardar el CSV nuevo, Datos > Actualizar todo y mirar que Controles esté en verde.\n\n"
            "Un saludo."
        ),
        "criterios": [
            "Las cifras clave (líneas e importe del pedido, número y valor de los muertos) coinciden con el libro.",
            "Da 3 conclusiones con cifra y una propuesta concreta para los artículos muertos.",
            "Explica en llano los supuestos (nivel de servicio, plazos laborables, pendiente) y cuánto cuesta subir el nivel de servicio.",
            "Avisa de los límites: datos a 31/10, artículos sin ficha y diferencias del recuento.",
            "Dice cómo se actualiza cada lunes.",
        ],
    },
    "solucion_md": "",
    "archivo_solucion": "p6-solucion.xlsx",
    "errores_tipicos": [
        f"Usar Quitar duplicados en el inventario: borra las 16 segundas ubicaciones y el valor del stock a 31/10 baja {eur(imp['quitar'])}.",
        f"Quitar duplicados con todas las columnas antes de convertir la fecha: no encuentra ninguna repetida ({dup_todas}), porque la copia del 31/07 trae la fecha como 2026-07-31; si no se quitan, faltan {eur(imp['solape'])} de stock.",
        f"Multiplicar la cantidad por el signo sin el valor absoluto: las {C['q14']} salidas grabadas en negativo suman y el valor del stock sube {eur(imp['sin_abs'])}.",
        f"Convertir «12.5» con Español (España) sin reemplazar antes el punto: se lee como 125 (el punto es el separador de miles) en {C['q05_filas']} filas y el valor del stock baja {eur(-imp['p125'])}.",
        f"No arreglar los códigos sin ceros: salen {C['claves_sin_arreglar_codigos']} códigos en vez de 180 y, buscando por el código de 6 cifras, {C['negativos_sin_arreglar_codigos']} artículos quedan en negativo en el stock teórico, antes del recuento (y el valor del stock a 31/10 baja {eur(imp['codigos'])}).",
        f"Calcular la desviación típica solo con las semanas con venta: el stock de seguridad baja a {eur(C['sigma_sin_ceros'][1])} y la propuesta se queda en {C['sigma_sin_ceros'][0]} líneas.",
        f"Olvidar lo pendiente de recibir: la propuesta sube a {C['sin_pendiente'][0]} líneas y {eur(C['sin_pendiente'][1])}, y se pide dos veces lo que ya viene.",
        "Usar el plazo en días naturales, o dejar a 0 el plazo de las fichas vacías en lugar de tomar el del proveedor.",
        "Clasificar el ABC por unidades: los metros de cable fino pesan más que los magnetotérmicos de 4 polos.",
        "Redondear el stock de seguridad hacia abajo (REDONDEAR o REDONDEAR.MENOS) en lugar de REDONDEAR.MAS.",
        "Contar las devoluciones a proveedor como consumo o los traspasos como salidas.",
        "Leer el 0 de MAX.SI.CONJUNTO como una fecha (00/01/1900) o dar por muerto un artículo con la última salida el 03/08 (89 días).",
        "Usar Date.WeekOfYear de Power Query o NUM.DE.SEMANA sin el tipo 21: no es la semana ISO, que empieza en lunes y es la que usan los proveedores.",
    ],
    "ampliaciones": [
        "Hoja de previsión (Datos > Previsión > Hoja de previsión) para un artículo A, avisando de que con seis meses no hay dos ciclos de estacionalidad.",
        "Histograma de los plazos reales de entrega si Compras añade la fecha de cada pedido.",
        "Clasificación XYZ por coeficiente de variación (σ / media semanal) cruzada con el ABC: AX se pide con poco colchón; CZ, bajo pedido.",
        "Cantidad económica de pedido (fórmula de Wilson): Q* = RAIZ(2·D·S/H), con D = demanda anual, S = coste de lanzar un pedido y H = coste de mantener una unidad un año en el almacén.",
        "Un control que avise si en el CSV de la semana falta un día laborable o se repite (recuento de filas por fecha frente a DIAS.LAB).",
    ],
}

# ---------------------------------------------------------------------------
# Solución comentada
# ---------------------------------------------------------------------------
sens_tabla = "\n".join(f"| {es(float(k) * 100, 1).replace(',0', '')} % | {eur(v)} |" for k, v in SENS.items())
p6["solucion_md"] = f"""### La idea
Power Query limpia los movimientos y el inventario; una tabla de cálculo (**Calc**) tiene una fila por artículo con stock, demanda, ABC, stock de seguridad, punto de pedido y cantidad; las hojas **Lunes**, **Muertos**, **ABC** y **Que_pasaria_si** salen de esa tabla, y **Controles** dice si todo cuadra. Cada lunes: guardar el CSV nuevo, **Datos > Actualizar todo** ([[Ctrl]]+[[Alt]]+[[F5]]) y mirar el control maestro. El libro resuelto (`p6-solucion.xlsx`) trae las fórmulas reales y la hoja **Cómo se hizo** con las consultas de Power Query, la Tabla de datos, los escenarios y el Pareto.

### 1. Lo que había en los datos (hoja Calidad)
| Problema | Dónde | Filas | Qué se hizo |
|---|---|---|---|
| El mismo artículo en dos ubicaciones (falso duplicado) | Inventario | 16 artículos, 32 filas | Se **suman** con Agrupar por: 196 filas → 180 artículos |
| Código guardado como número (731 en vez de 000731) | Inventario | {C['codigos_como_numero']} | Texto de 6 cifras: `=TEXTO(A2;"000000")` o Text.PadStart |
| El 31/07 sale en dos extracciones | CSV | {C['duplicados']} | Quitar duplicados por Documento + Línea (todas del 31/07) |
| Fechas AAAA-MM-DD en la extracción de agosto | CSV | {es(C['q07'], 0)} | Cambiar tipo con configuración regional Español (España) |
| Tipo escrito como SAL, «Salida» y «salida » | CSV | {es(C['q08'], 0)} | Recortar, MAYÚSCULAS y tabla TiposMovimiento |
| Salidas con la cantidad en negativo | CSV | {C['q14']} | CantidadFirmada = ABS(Cantidad) × Signo |
| Cantidad con punto decimal («12.5») desde Lleida | CSV | {C['q05_filas']} | Reemplazar «.» por «,» antes de cambiar el tipo |
| Artículos sin ficha | Fichas | {C['sin_ficha']} | No se piden ni se valoran; lista para Compras |
| Plazo de entrega vacío | Fichas | {C['plazos_vacios']} | Plazo habitual del proveedor |
| Recuento con 2 diferencias | Recuento | 2 | Manda el recuento: −3 ud (LED-0412, rotura) y −12,5 m (cable RZ1-K 3G2,5, recorte) |
| Columna Usuario | CSV | todas | Se quita: no hace falta para el cálculo |

### 2. Movimientos (Power Query)
1. **Datos > Obtener datos > De archivo > De texto/CSV**, Origen del archivo 65001: Unicode (UTF-8), delimitador punto y coma, **Transformar datos**.
2. Borrar el paso «Tipo cambiado». CodArticulo como **Texto**; Fecha con **Cambiar tipo > Usar configuración regional** (Fecha, Español (España)): lee 31/07/2026 y 2026-07-31.
3. Cantidad: **Reemplazar valores** «.» por «,» y después Número decimal con Español (España).
4. Tipo: **Formato > Recortar** y **MAYÚSCULAS**.
5. Seleccionar Documento y Línea > **Quitar filas > Quitar duplicados**: {es(C['filas_csv'], 0)} → {es(C['movimientos'], 0)} filas ({C['duplicados']} quitadas, todas del 31/07).
6. **Combinar consultas** con la tabla TiposMovimiento (Parámetros): SAL y SALIDA → signo −1 y consumo 1; DEV → +1 y consumo −1; ENT y REG+ → +1; DPR y REG− → −1; TRA → 0 (el stock de la empresa no cambia).
7. Columnas personalizadas: `CantidadFirmada = Number.Abs([Cantidad]) * [Signo]` y `Consumo = Number.Abs([Cantidad]) * [FactorConsumo]`. Cargar en la hoja **Mov** y añadir `=ISO.NUM.DE.SEMANA([@Fecha])`.

### 3. Inventario, stock y recuento
- Inventario: código con 6 cifras y **Agrupar por** código (suma de StockContado): 180 artículos, 16 con dos ubicaciones.
- `Stock = Stock_30_04 + SUMAR.SI.CONJUNTO(Mov[CantidadFirmada];Mov[CodArticulo];[@Cod])`; si el artículo está en el recuento, `Ajuste = recuento − stock teórico`.
- Resultado: ningún stock negativo, traspasos = 0, 8 de 10 recuentos iguales. **Valor del stock: {eur(V_STOCK)}** (177 artículos con ficha).

### 4. Demanda semanal y stock de seguridad
- Matriz artículo × semana 19-44 con `=SUMAR.SI.CONJUNTO(Mov[Consumo];Mov[CodArticulo];$A2;Mov[Semana];B$1)`: las semanas sin ventas dan 0 y cuentan.
- σ semanal = `DESVEST.M(B2:AA2)`; demanda diaria d = consumo / `DIAS.LAB(FechaInicio;FechaCorte;Festivos)` = consumo / 129.
- Plazo: `=SI(INDICE(Fichas[PlazoEntrega];[@FilaFicha])="";INDICE(Proveedores[PlazoHabitual];COINCIDIR([@Proveedor];Proveedores[Proveedor];0));INDICE(Fichas[PlazoEntrega];[@FilaFicha]))`.
- Todo en una celda:

`=LET(demanda;[@DemandaDia];sigma_d;[@SigmaSem]/RAIZ(DiasSemana);plazo;[@Plazo];z;INV.NORM.ESTAND([@Nivel]);ss;REDONDEAR.MAS(z*sigma_d*RAIZ(plazo);0);rop;demanda*plazo+ss;s_max;rop+demanda*R_dias;posicion;[@Stock]+[@Pendiente];SI(Y([@ConFicha]=1;demanda>0;posicion<=rop);MAX([@LoteMin];MULTIPLO.SUPERIOR(s_max-posicion;[@Multiplo]));0))`

Ejemplo resuelto: d = 42 m/día, σ semanal = 61 m, plazo 4 y 95 % → σ diaria = 61/RAIZ(5) = 27,28; SS = REDONDEAR.MAS(1,6449 × 27,28 × 2; 0) = 90 m; ROP = 42 × 4 + 90 = 258 m; S = 258 + 42 × 5 = 468 m. Con 230 m y nada pendiente se pide: 468 − 230 = 238 → múltiplo de 100 → **300 m**.

Con los niveles pactados, el **stock de seguridad vale {eur(C['valor_ss'])}**.

### 5. ABC y Pareto
- `ValorAnual = REDONDEAR(Consumo × Coste × 52/26; 2)`; % acumulado con SUMAR.SI.CONJUNTO (">="&valor) / total; clase con SI.CONJUNTO y los nombres CorteA y CorteB.
- **{N_A} A, {N_B} B y {N_C} C** (más 3 sin ficha). La clase A, el {es(N_A / 177 * 100, 1)} % de los artículos, hace el {es(C['abc_pct_valor']['A'] * 100, 1)} % del consumo valorado ({eur(C['consumo_anual_valor'])} al año).
- Pareto: **Insertar > Insertar gráfico estadístico > Histograma > Pareto** (en versiones antiguas, gráfico combinado de columnas y línea con el % acumulado en el eje secundario).

### 6. Muertos
`UltimaSalida = MAX.SI.CONJUNTO(Mov[Fecha];Mov[CodArticulo];[@Cod];Mov[Tipo];"SAL")`, con formato `dd/mm/aaaa;;"sin salidas"`. Muerto: `Y([@Stock]>0;FechaCorte-[@UltimaSalida]>DiasMuerto)`. **{C['muertos']} artículos y {eur(C['valor_muertos'])}** ({es(pct_muertos * 100, 1)} % del stock). La fuente de alimentación LED 24 V 150 W vendió el 03/08: 89 días, no está muerta.

| Artículo | Stock | Valor | Última salida |
|---|---|---|---|
{tabla_muertos}

### 7. Hoja «Lunes»
`=LET(f;Calc[Cantidad]>0;ORDENARPOR(FILTRAR(APILARH(Calc[Proveedor];Calc[Cod];Calc[Descripción];Calc[Unidad];Calc[Cantidad];Calc[Coste];Calc[Importe]);f);FILTRAR(Calc[Proveedor];f);1;FILTRAR(Calc[Importe];f);-1))`. APILARH es de Excel 2024 y Microsoft 365; en 2021, una FILTRAR por columna; en 2016/2019, filtro de la tabla y copiar a una hoja de envío.

**{C['lineas_pedido']} líneas y {eur(C['importe_pedido'])}** sin IVA ({C['pedido_lineas_A']} de clase A):

| Proveedor | Líneas | Importe |
|---|---|---|
{tabla_prov}

Las 5 líneas de más importe:

| Proveedor | Artículo | Cantidad | Importe |
|---|---|---|---|
{tabla_top}

### 8. Qué pasaría si
Tabla de datos (**Datos > Previsión > Análisis de hipótesis > Tabla de datos**, celda de entrada: NivelUnico) con el valor del stock de seguridad si todos los artículos tuvieran el mismo nivel:

| Nivel único | Stock de seguridad |
|---|---|
{sens_tabla}

Con los niveles pactados son {eur(C['valor_ss'])}: pasar todo al 99 % costaría {eur(subir99)} más.

**Administrador de escenarios** (celdas cambiantes RetrasoTormes y R_dias): «Tormes retrasa 5 días» deja {C['esc_tormes5'][0]} líneas y {eur(C['esc_tormes5'][1])}; ningún artículo nuevo entra en pedido, pero el de Tormes pasa de {eur(C['base_tormes'][1])} a {eur(C['esc_tormes5_tormes'][1])}.

### 9. Controles
196 filas → 180 artículos con las mismas unidades · {C['duplicados']} repetidas quitadas · fechas dentro del periodo · 26 semanas con movimientos · traspasos = 0 · Σ Mov = Σ Calc · todo el consumo en la matriz semanal · 0 stocks negativos · 8 de 10 recuentos cuadran · −3 ud y −12,5 m · 3 sin ficha · A + B + C = 177 · % acumulado final = 100 % · LET = columnas paso a paso · total de «Lunes» = Σ importes. Control maestro: `=Y(F5:F22)`, repetido en «Lunes» y en el resumen.

### 10. El cambio inesperado
Tormes cierra del 21/12/2026 al 08/01/2027 (12 días laborables) y desde enero la revisión es quincenal. Escenario «Cierre de Tormes y revisión quincenal»: RetrasoTormes = 12 y R_dias = 10. Con los datos a 31/10, la propuesta pasa a **{C['esc_cierre'][0]} líneas y {eur(C['esc_cierre'][1])}**; de Tormes, **{C['esc_cierre_tormes'][0]} líneas y {eur(C['esc_cierre_tormes'][1])}**. Es lo que hay que pedirle como tarde en la revisión del lunes 14/12, con los datos de ese día, para que llegue antes del cierre del 18/12. Se apunta en el registro de cambios y se avisa a Andrés de que el pedido de diciembre será más grande de lo normal.
"""

with open(os.path.join(EXCEL, "proyectos", "p6.json"), "w", encoding="utf-8") as fh:
    json.dump(p6, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
for nombre, meta in {
    "p6-datos.meta.json": {"titulo": "P6 · Stock, punto de pedido y ABC: datos de partida",
                           "descripcion": "Inventario del 30/04 por ubicaciones, fichas de artículos, proveedores y recuento del 31/10 de Electro Cierzo; los movimientos de mayo a octubre van en p6-movimientos.csv.",
                           "nivel": "n6"},
    "p6-solucion.meta.json": {"titulo": "P6 · Stock, punto de pedido y ABC: solución",
                              "descripcion": "Libro resuelto con stock, demanda semanal, stock de seguridad, punto de pedido, ABC con Pareto, muertos, hoja Lunes, qué pasaría si, controles y los pasos de Power Query.",
                              "nivel": "n6"},
}.items():
    with open(os.path.join(LIB, nombre), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
print("p6.json escrito ·", len(p6["controles"]), "controles ·", len(p6["pasos"]), "pasos")

import json, os
D = os.path.dirname(os.path.abspath(__file__))

ventas = [("FV26-1180", "Zaragoza", 2340.00), ("FV26-1181", "Pamplona", 1820.40), ("FV26-1182", "Lleida", 960.75),
          ("FV26-1183", "Pamplona", 2105.10), ("FV26-1184", "Zaragoza", 3410.25), ("FV26-1185", "Lleida", 1530.00)]
assert round(sum(v for _, d, v in ventas if d == "Pamplona"), 2) == 3925.50
cel = {"A1": "Factura", "B1": "Delegación", "C1": "Base (€)", "E1": "Delegación elegida", "F1": "Pamplona", "E2": "Ventas"}
for i, (n, d, v) in enumerate(ventas, start=2):
    cel[f"A{i}"] = n; cel[f"B{i}"] = d; cel[f"C{i}"] = v

C = {
 "id": "n6m1",
 "nivel": "n6",
 "titulo": "Del encargo al plan",
 "intro": "En una empresa casi nadie te pedirá «haz una SUMA»: te pedirán «prepárame algo de ventas para el comité», y lo difícil es entender qué quieren de verdad. En este módulo aprendes a convertir ese encargo en un plan: preguntar lo justo, revisar los datos antes de construir y diseñar un libro que sirva también el mes que viene.",
 "repaso_inicial": [
  {"id": "n6m1-r1", "modo": "formula",
   "enunciado": "Javier escribe en **F1** la delegación que quiere ver. En **F2** calcula sus ventas (columna C), de forma que si cambia F1 la cifra cambie sola.",
   "hoja": {"celdas": cel, "formatos": {"C2:C7": "eur", "F2": "eur"}, "anchos": {"A": 11, "B": 11, "C": 11, "D": 3, "E": 18, "F": 12}},
   "objetivo": "F2",
   "solucion": "=SUMAR.SI(B2:B7;F1;C2:C7)",
   "alternativas": ["=SUMAR.SI.CONJUNTO(C2:C7;B2:B7;F1)"],
   "errores_tipicos": ['=SUMAR.SI(B2:B7;"Pamplona";C2:C7)', "=SUMA(C2:C7)", "=SUMAR.SI(B2:B7;F1)"],
   "variantes": [{"F1": "Lleida"}],
   "formato_resultado": "eur",
   "pistas": ["Quieres sumar solo las filas cuya delegación coincide con la de F1.",
              "SUMAR.SI(rango_del_criterio; criterio; rango_a_sumar): el criterio es la celda F1, no el texto escrito.",
              "=SUMAR.SI(B2:B7;F1;C2:C7)"],
   "explicacion": "3.925,50 € para Pamplona, y si Javier escribe «Lleida» en F1, la cifra cambia sola. Criterio en una celda: la base de todo lo que diseñarás en este módulo."},
  {"id": "n6m1-r2", "modo": "predice",
   "enunciado": "¿Cuántos clientes distintos te dirá esta fórmula?",
   "hoja": {"celdas": {"A1": "Cliente", "A2": "Instalaciones Segre, S.L.", "A3": "Montajes Noguera, S.L.",
                       "A4": "Instalaciones Segre, S.L.", "A5": "Climatización Ilerda, S.L.",
                       "A6": "Montajes Noguera, S.L.", "A7": "Instalaciones Segre, S.L."}, "anchos": {"A": 27}},
   "celda": "C2", "formula": "=CONTARA(UNICOS(A2:A7))",
   "explicacion": "UNICOS deja Segre, Noguera e Ilerda, y CONTARA cuenta 3. Seis filas, tres clientes: lo usarás para detectar repetidos."},
  {"id": "n6m1-r3", "modo": "test",
   "pregunta": "Te llega un listado con una fila en blanco entre mes y mes, subtotales intercalados y la cabecera repartida en dos filas. ¿Qué pasa si haces una tabla dinámica con él?",
   "opciones": [
    {"texto": "Saldrá mal: los subtotales se sumarán dos veces, la segunda fila de cabecera se leerá como un dato y las filas en blanco darán problemas.", "correcta": True,
     "porque": "Una tabla de datos necesita una fila por registro, una cabecera en una sola fila y nada más. Lo bonito se hace después, en otra hoja."},
    {"texto": "Saldrá bien: la tabla dinámica ignora los subtotales.", "correcta": False,
     "porque": "No los distingue: para ella un subtotal es una fila más, y lo suma con el resto."},
    {"texto": "Saldrá bien si antes le doy formato de moneda.", "correcta": False,
     "porque": "El formato solo cambia cómo se ve. El problema es la estructura."}],
   "explicacion": "Datos planos primero; informe después."},
  {"id": "n6m1-r4", "modo": "cinta",
   "enunciado": "¿Dónde está el botón **Quitar duplicados**?",
   "ruta": ["Datos", "Herramientas de datos", "Quitar duplicados"],
   "explicacion": "Datos › Herramientas de datos › Quitar duplicados. Ojo: borra filas sin preguntar. En este módulo verás por qué primero se cuentan los repetidos, se pregunta y se trabaja sobre una copia."}
 ],
 "practica_excel": None
}
json.dump(C, open(os.path.join(D, "n6m1-cabecera.json"), "w"), ensure_ascii=False, indent=1)
print("cabecera ok")

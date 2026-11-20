import json, os, copy, datetime
D = os.path.dirname(os.path.abspath(__file__))

# Exportación de facturas de Lleida, octubre de 2026 (13 filas).
# Problemas sembrados: L26-0418 repetida (filas 8 y 9), L26-0415 sin cliente, abono R26-0031 en negativo.
filas = [
 ("L26-0412", "2026-10-02", "Instalaciones Segre, S.L.", 1245.80),
 ("L26-0413", "2026-10-05", "Electricidad Pujol e Hijos, S.L.", 2310.00),
 ("L26-0414", "2026-10-06", "Montajes Noguera, S.L.", 845.25),
 ("L26-0415", "2026-10-09", None, 1980.40),
 ("L26-0416", "2026-10-13", "Instalaciones Segre, S.L.", 3125.60),
 ("L26-0417", "2026-10-15", "Climatización Ilerda, S.L.", 1460.00),
 ("L26-0418", "2026-10-19", "Reformas Balaguer, S.L.", 2075.90),
 ("L26-0418", "2026-10-19", "Reformas Balaguer, S.L.", 2075.90),
 ("R26-0031", "2026-10-21", "Electricidad Pujol e Hijos, S.L.", -320.00),
 ("L26-0419", "2026-10-23", "Montajes Noguera, S.L.", 1738.45),
 ("L26-0420", "2026-10-27", "Talleres Mollerussa, S.L.", 2540.15),
 ("L26-0421", "2026-10-29", "Instalaciones Segre, S.L.", 985.30),
 ("L26-0422", "2026-10-30", "Climatización Ilerda, S.L.", 1103.40),
]
total = round(sum(f[3] for f in filas), 2)
fuente = round(total - 2075.90, 2)
assert (total, fuente) == (21166.15, 19090.25), (total, fuente)
assert len(filas) == 13 and len({f[0] for f in filas}) == 12
serie = (datetime.date(2026, 10, 2) - datetime.date(1899, 12, 30)).days
assert serie == 46297, serie
assert datetime.date(2026, 10, 31).weekday() == 5  # sábado

base = {"A1": "Factura", "B1": "Fecha", "C1": "Cliente", "D1": "Base (€)"}
for i, (n, f, c, b) in enumerate(filas, start=2):
    base[f"A{i}"] = n; base[f"B{i}"] = {"fecha": f}; base[f"D{i}"] = b
    if c: base[f"C{i}"] = c
FMT = {"B2:B14": "fecha", "D2:D14": "eur"}
ANCH = {"A": 10, "B": 11, "C": 29, "D": 11, "E": 3, "F": 22, "G": 13}

# Ficha de perfilado (columnas F y G): se va rellenando ejercicio a ejercicio
ficha = [("Filas", "=CONTARA(A2:A14)", None), ("Clientes vacíos", "=CONTAR.BLANCO(C2:C14)", None),
         ("Facturas distintas", "=CONTARA(UNICOS(A2:A14))", None), ("Primera fecha", "=MIN(B2:B14)", "fecha"),
         ("Importe más bajo", "=MIN(D2:D14)", "eur"), ("Total del programa", 19090.25, "eur"),
         ("Diferencia", "=SUMA(D2:D14)-G7", "eur")]

def hoja(hasta, objetivo=None):
    """Hoja con la ficha rellena hasta la fila `hasta` (exclusive) y la etiqueta de la fila objetivo."""
    c = dict(base); c["F1"] = "Comprobación"; c["G1"] = "Resultado"
    fm = dict(FMT)
    for k, (et, fo, fmt) in enumerate(ficha, start=2):
        if k > hasta and k != 7:
            continue
        c[f"F{k}"] = et
        if k < hasta or k == 7:
            c[f"G{k}"] = fo
        if fmt: fm[f"G{k}"] = fmt
    if objetivo: c.pop(objetivo, None)
    return {"celdas": c, "formatos": fm, "anchos": ANCH}

h_e1 = hoja(2, "G2"); h_e1["celdas"]["F2"] = "Filas"
h_e2 = hoja(3, "G3")
h_e3 = hoja(4, "G4")
h_e4 = hoja(5, "G5")
h_e5 = hoja(6, "G6")
h_e6 = hoja(8, "G8")
for h in (h_e1, h_e2, h_e3, h_e4, h_e5):  # G7 (total del programa) solo aparece al final
    h["celdas"].pop("F7", None); h["celdas"].pop("G7", None)
h_q2 = {"celdas": {**base, "F1": "Comprobación", "G1": "Resultado", "F2": "Importes negativos"}, "formatos": FMT, "anchos": ANCH}

L = {
 "id": "n6m1l2",
 "titulo": "Conoce los datos antes de tocarlos",
 "minutos": 16,
 "objetivo": "Perfilar una exportación antes de usarla: contar filas, vacíos y repetidos, revisar fechas e importes extremos, cuadrar el total con la fuente y avisar de los problemas antes de corregir nada.",
 "mision": {"de": "Marta Ruiz", "puesto": "Directora financiera",
            "texto": "Te paso la exportación de facturas de Lleida de octubre; si está bien, te saco el resto del año igual. El listado del programa de gestión dice 12 documentos y 19.090,25 € sin IVA. Antes de montar nada, dime si cuadra y qué problemas ves.",
            "logro": "Ya sabes perfilar unos datos en cinco minutos, cuadrarlos con la fuente y avisar de los problemas antes de que te exploten el día de la entrega."},
 "funciones": ["CONTARA", "CONTAR.BLANCO", "UNICOS", "MIN", "MAX", "SUMA", "CONTAR.SI"],
 "bloques": [
  {"tipo": "texto", "md": "Cuando llega un pedido al almacén, Andrés cuenta las cajas y mira que no venga nada roto **antes** de firmar el albarán. Con los datos se hace lo mismo y se llama **perfilar**: una revisión de cinco minutos antes de usarlos.\n\nCinco preguntas: ¿cuántas filas hay?, ¿hay huecos?, ¿hay repetidos?, ¿las fechas y los importes son razonables?, ¿el total cuadra con la fuente? Lo que encuentres hoy no te explotará el día de la entrega."},
  {"tipo": "texto", "md": "Antes de tocar nada, **guarda el original**. Deja la exportación de Marta tal cual, en su archivo o en una hoja llamada, por ejemplo, «Datos_originales», y trabaja siempre en una copia.\n\nSi te equivocas al limpiar, o Marta te pregunta «¿esto venía así?», podrás comprobarlo. Recuerda que [[Ctrl]]+[[Z]] deja de servir en cuanto cierras el libro."},
  {"tipo": "aviso", "estilo": "empresa", "titulo": "La foto de lo que recibiste",
   "md": "Los datos de verdad están en el programa de gestión, pero cambian: mañana alguien puede corregir una factura. El archivo que te pasaron, intacto, es la prueba de con qué datos trabajaste y de qué día eran."},
  {"tipo": "ejercicio", "id": "n6m1l2-e1", "modo": "formula",
   "enunciado": "Esta es la exportación de Lleida. Empieza por lo fácil: en **G2** cuenta cuántas filas de datos hay. Usa la columna A (el número de factura), que nunca debería estar vacía.",
   "hoja": h_e1, "objetivo": "G2",
   "solucion": "=CONTARA(A2:A14)",
   "alternativas": ["=CONTARA(B2:B14)", "=CONTARA(D2:D14)", "=CONTAR(D2:D14)"],
   "errores_tipicos": ["=CONTARA(A1:A14)", "=CONTARA(C2:C14)", "=CONTAR(A2:A14)"],
   "variantes": [{"A14": None, "B14": None, "C14": None, "D14": None}],
   "pistas": ["Quieres saber cuántas celdas de A2 a A14 tienen algo escrito, sin contar la cabecera.",
              "CONTARA cuenta las celdas que no están vacías, tengan texto o números. CONTAR solo cuenta números, y los números de factura son texto.",
              "=CONTARA(A2:A14)"],
   "explicacion": "13 filas. Primer dato de tu ficha, y ya te dice algo: el programa de gestión habla de **12** documentos. Sobra una fila. ¿Cuál? Sigue investigando."},
  {"tipo": "texto", "md": "Segunda pregunta: **¿hay huecos?** Un cliente vacío parece poca cosa, pero esa factura desaparecerá de cualquier resumen por cliente, y nadie lo notará.\n\nPara contarlos está `CONTAR.BLANCO(rango)`: devuelve cuántas celdas del rango están vacías. Úsalo en las columnas por las que vas a agrupar o filtrar: cliente, delegación, comercial, fecha."},
  {"tipo": "aviso", "estilo": "cuidado", "titulo": "Vacía no es lo mismo que «parece vacía»",
   "md": "Una celda con un espacio se ve en blanco, pero para Excel tiene texto y `CONTAR.BLANCO` no la cuenta. Si te salen menos vacíos de los que ves, sospecha de los espacios."},
  {"tipo": "ejercicio", "id": "n6m1l2-e2", "modo": "formula",
   "enunciado": "En **G3** cuenta cuántas facturas no tienen cliente (celdas vacías en la columna C).",
   "hoja": h_e2, "objetivo": "G3",
   "solucion": "=CONTAR.BLANCO(C2:C14)",
   "alternativas": ["=CONTARA(A2:A14)-CONTARA(C2:C14)"],
   "errores_tipicos": ["=CONTAR.BLANCO(A2:A14)", "=CONTARA(C2:C14)"],
   "variantes": [{"C5": "Instalaciones Segre, S.L."}, {"C10": None}],
   "pistas": ["Mira la columna C, de C2 a C14.",
              "CONTAR.BLANCO(rango) devuelve cuántas celdas del rango están vacías.",
              "=CONTAR.BLANCO(C2:C14)"],
   "explicacion": "Una factura sin cliente: la L26-0415, de 1.980,40 €. En un resumen por cliente, esos casi 2.000 € se habrían esfumado. No la rellenes con «el que parece»: se anota y se pregunta."},
  {"tipo": "texto", "md": "Tercera pregunta: **¿hay repetidos?** Para saberlo necesitas una **clave**: la columna que identifica cada fila sin confusión, como el DNI a una persona. Aquí, el número de factura.\n\nSi hay menos claves distintas que filas, algo se repite. Ojo: en una exportación **por líneas** (un producto por fila), la misma factura sale varias veces y es normal. Antes de contar, averigua qué es una fila."},
  {"tipo": "aviso", "estilo": "truco", "titulo": "En Excel 2019 o anterior",
   "md": "`UNICOS` existe desde Excel 2021. En versiones anteriores, escribe en una columna auxiliar `=CONTAR.SI($A$2:$A$14;A2)` y cópiala hacia abajo: las filas con un número mayor que 1 están repetidas."},
  {"tipo": "ejercicio", "id": "n6m1l2-e3", "modo": "formula",
   "enunciado": "En **G4** queremos cuántos números de factura **distintos** hay. Ya tienes `=CONTARA(A2:A14)`, que los cuenta todos. Complétala para que cuente solo los distintos.",
   "hoja": h_e3, "objetivo": "G4", "inicial": "=CONTARA(A2:A14)",
   "solucion": "=CONTARA(UNICOS(A2:A14))",
   "errores_tipicos": ["=CONTARA(A2:A14)", "=CONTARA(UNICOS(C2:C14))"],
   "variantes": [{"A9": "L26-0423"}],
   "debe_usar": ["UNICOS"],
   "pistas": ["UNICOS(rango) devuelve la lista sin repetidos. Mete esa lista dentro de CONTARA.",
              "Donde pone A2:A14, pon UNICOS(A2:A14).",
              "=CONTARA(UNICOS(A2:A14))"],
   "explicacion": "12 números distintos en 13 filas: hay una fila repetida, la L26-0418 de Reformas Balaguer (filas 8 y 9). Y 12 es justo lo que dice el programa de gestión: buena señal."},
  {"tipo": "texto", "md": "Cuarta pregunta: **¿las fechas y los importes son razonables?** No hace falta mirar fila por fila: mira los extremos.\n\n- `MIN` y `MAX` de la fecha dicen dónde empieza y dónde acaba el periodo. Si pediste octubre y asoma septiembre, o el último día es el 15, falta o sobra algo.\n- `MIN` y `MAX` del importe sacan a la luz lo raro: un negativo, un cero, una cifra con un cero de más."},
  {"tipo": "ejercicio", "id": "n6m1l2-e4", "modo": "formula",
   "enunciado": "En **G5** saca la **primera fecha** de la exportación (columna B).",
   "hoja": h_e4, "objetivo": "G5",
   "solucion": "=MIN(B2:B14)",
   "errores_tipicos": ["=MAX(B2:B14)", "=B2", "=MIN(D2:D14)"],
   "variantes": [{"B6": {"fecha": "2026-09-28"}}],
   "formato_resultado": "fecha",
   "pistas": ["La primera fecha es la más pequeña: para Excel, las fechas son números que crecen día a día.",
              "MIN(rango) devuelve el valor más pequeño. Úsalo sobre la columna B.",
              "=MIN(B2:B14)"],
   "explicacion": "02/10/2026. Y con `=MAX(B2:B14)` sale el 30/10/2026 (el 31 era sábado): octubre está completo y no se ha colado otro mes. No todas las comprobaciones encuentran algo, y eso también es información. Si en tu Excel te sale 46297, es la fecha sin formato: dale formato de fecha."},
  {"tipo": "ejercicio", "id": "n6m1l2-e5", "modo": "predice",
   "enunciado": "Ahora los importes. Antes de que Excel lo calcule: ¿qué devolverá `=MIN(D2:D14)`?",
   "hoja": h_e5, "celda": "G6", "formula": "=MIN(D2:D14)",
   "explicacion": "−320: un importe negativo. Es el R26-0031, de otra serie: un **abono**, una factura que resta (por ejemplo, por una devolución). Puede ser correcto, pero hay que confirmarlo: ¿entra en los 12 documentos de Marta? Carmen pidió restar los abonos, así que este se queda… si Marta lo confirma."},
  {"tipo": "texto", "md": "Última pregunta, la más importante: **¿cuadra con la fuente?** Marta te ha dado el **total de control**, lo que dice el listado del programa de gestión: 12 documentos y 19.090,25 € sin IVA. Tu exportación tiene que sumar lo mismo.\n\nSi coincide, puedes construir tranquila. Si no, la **diferencia** es una pista: un importe concreto suele delatar qué fila sobra o falta."},
  {"tipo": "ejercicio", "id": "n6m1l2-e6", "modo": "formula",
   "enunciado": "En **G8** calcula la diferencia: el total de la columna D **menos** el total del programa (G7). Intenta hacerlo en menos de un minuto.",
   "hoja": h_e6, "objetivo": "G8",
   "solucion": "=SUMA(D2:D14)-G7",
   "errores_tipicos": ["=SUMA(D2:D13)-G7", "=SUMA(D2:D14)", "=SUMA(D2:D14)-19090,25"],
   "variantes": [{"G7": 19500}],
   "debe_usar": ["SUMA"],
   "formato_resultado": "eur",
   "pistas": ["Primero el total de la columna D; después réstale lo que dice el programa.",
              "SUMA(D2:D14) es el total de la exportación. Réstale la celda G7.",
              "=SUMA(D2:D14)-G7"],
   "explicacion": "Sobran 2.075,90 €: exactamente el importe de la factura repetida L26-0418. Misterio resuelto: sin la fila duplicada, la exportación cuadra al céntimo con el programa. Esto es un **total de control**, y te permite decir «los datos están bien» con pruebas."},
  {"tipo": "texto", "md": "Has encontrado tres cosas: una fila repetida, una factura sin cliente y un abono. La tentación es arreglarlo «a ojo» y seguir. No lo hagas: **anota cada problema y pregunta** a quien responde por los datos.\n\n¿La fila repetida viene del programa o la duplicó alguien al copiar? ¿El cliente vacío es una venta de mostrador? Lo sabe Marta, no tú. Corregir sin avisar es cambiar en silencio los datos de otra persona."},
  {"tipo": "tabla", "titulo": "Tu ficha de perfilado",
   "cabecera": ["Comprobación", "Resultado", "¿Problema?"],
   "filas": [["Filas", "13", "Sí: el programa dice 12 documentos"],
             ["Clientes vacíos", "1", "Sí: L26-0415 sin cliente"],
             ["Facturas distintas", "12", "Sí: L26-0418 repetida"],
             ["Fechas", "02/10/2026 a 30/10/2026", "No: octubre completo"],
             ["Importe más bajo", "−320,00 €", "Confirmar: abono R26-0031"],
             ["Diferencia con el programa", "2.075,90 €", "Se explica por la fila repetida"]],
   "pie": "Cinco minutos de fórmulas sencillas y ya sabes más de estos datos que nadie en la oficina."},
  {"tipo": "ejercicio", "id": "n6m1l2-e7", "modo": "abierta",
   "pregunta": "**Misión:** escribe a Marta un mensaje breve (máximo 6 líneas) con el resultado del perfilado: si cuadra, qué problemas has visto y qué le preguntas antes de corregir nada.",
   "modelo": "Hola, Marta. He revisado la exportación de Lleida de octubre:\n- Tiene 13 filas y el programa dice 12: la L26-0418 está repetida. Sin ella, el total cuadra al céntimo (19.090,25 €).\n- La L26-0415 (1.980,40 €) no tiene cliente. ¿Sabes de quién es?\n- Hay un abono, el R26-0031, de −320 €. Entiendo que es uno de los 12 documentos y que se resta, ¿correcto?\nNo he tocado nada: trabajo en una copia y espero tu respuesta para corregir.",
   "criterios": ["Dice si cuadra con el total del programa y por qué",
                 "Enumera los problemas con datos concretos (número de factura, importe)",
                 "Pregunta antes de corregir, sin haber cambiado nada por su cuenta",
                 "Menciona que conserva el original o que trabaja en una copia",
                 "Es breve y fácil de contestar"]}
 ],
 "recuerda": [
  {"id": "n6m1l2-q1", "modo": "test",
   "pregunta": "Perfilando la lista de plantilla de Lucía, ves dos filas con el mismo nombre y la misma fecha de alta. ¿Qué haces?",
   "opciones": [
    {"texto": "Miro si tienen el mismo número de empleado, lo anoto y le pregunto a Lucía.", "correcta": True,
     "porque": "El número de empleado es la clave. Dos personas pueden llamarse igual; quien responde por los datos te dirá si es un repetido."},
    {"texto": "Borro una: está claro que es un repetido.", "correcta": False,
     "porque": "Si eran dos personas, acabas de quitar a alguien de la plantilla en tu informe. Nunca se corrige a ojo sin avisar."},
    {"texto": "Lo dejo así y no digo nada.", "correcta": False,
     "porque": "Si el informe sale con un empleado de más, la cifra lleva tu nombre. Avisar es parte del trabajo."},
    {"texto": "Uso Quitar duplicados sobre el archivo original.", "correcta": False,
     "porque": "Doble error: decides sin preguntar y, además, sobre el único original."}],
   "explicacion": "Clave, nota y pregunta. Y siempre sobre una copia."},
  {"id": "n6m1l2-q2", "modo": "formula",
   "enunciado": "Sin mirar la lección: en **G2** cuenta cuántos importes de la columna D son negativos.",
   "hoja": h_q2, "objetivo": "G2",
   "solucion": '=CONTAR.SI(D2:D14;"<0")',
   "alternativas": ['=CONTAR.SI.CONJUNTO(D2:D14;"<0")'],
   "errores_tipicos": ["=CONTAR(D2:D14)", "=MIN(D2:D14)"],
   "variantes": [{"D3": -50}],
   "pistas": ["Quieres contar solo las celdas que cumplen una condición: ser menores que 0.",
              'CONTAR.SI(rango; criterio). El criterio va entre comillas: "<0".',
              '=CONTAR.SI(D2:D14;"<0")'],
   "explicacion": "Uno: el abono. Con `CONTAR.SI` cuentas cualquier valor raro: importes en cero (`0`), cifras enormes (`\">10000\"`) o una delegación mal escrita."},
  {"id": "n6m1l2-q3", "modo": "respuesta_corta",
   "pregunta": "¿Qué función cuenta las celdas vacías de un rango? (Solo el nombre)",
   "aceptadas": ["CONTAR.BLANCO", "=CONTAR.BLANCO", "CONTAR.BLANCO()", "contar.blanco"],
   "explicacion": "`CONTAR.BLANCO(rango)`. Recuerda: una celda con un espacio no cuenta como vacía."}
 ],
 "tarjetas": [
  {"tipo": "funcion", "frente": "Contar las celdas vacías de C2:C14", "dorso": "=CONTAR.BLANCO(C2:C14). Una celda con un espacio no cuenta como vacía."},
  {"tipo": "funcion", "frente": "Contar los valores distintos de A2:A14 (Excel 2021 o posterior)", "dorso": "=CONTARA(UNICOS(A2:A14))"},
  {"tipo": "concepto", "frente": "¿Qué es un total de control?", "dorso": "La cifra de la fuente (n.º de filas, importe total) con la que tus datos tienen que cuadrar antes de usarlos."},
  {"tipo": "error", "frente": "Encuentras un problema en los datos de otra persona. ¿Qué no debes hacer?", "dorso": "Corregirlo a ojo sin avisar. Guarda el original, anota el problema y pregunta a quien responde por los datos."}
 ]
}
json.dump(L, open(os.path.join(D, "n6m1l2.json"), "w"), ensure_ascii=False, indent=1)
print("n6m1l2 ok")

#!/usr/bin/env python3
"""Genera libros/n1-factura-y-gastos.xlsx (ejercicio) y libros/n1-factura-y-gastos-solucion.xlsx (solución)
para la práctica en Excel del módulo n1m4 de «Hoja a hoja», y calcula los totales de control con pandas.

Datos inventados de Electro Cierzo Suministros, S.L. Semilla fija.
- Factura: 8 líneas a Instalaciones Ebro, S.L., IVA 21 % en una celda fija (E4).
- Gastos: 40 notas de gasto de octubre de 2026. Problemas sembrados a propósito:
  * 6 gastos sin justificante (celda vacía en la columna F).
  * un gasto de 300,00 € justo en el límite (NO debe salir «Revisar»: la regla es «más de 300 €»).
  * los gastos llegan desordenados (por fecha y mezclados de categoría).
"""
import json, os, random
from datetime import date, timedelta
import pandas as pd
import xlsxwriter

random.seed(41126)
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(B, 'n1-factura-y-gastos.xlsx')
SOL = os.path.join(B, 'n1-factura-y-gastos-solucion.xlsx')

IVA = 0.21
FACTURA = [  # código, descripción, cantidad, precio unitario
    ('CAB-H07-25', 'Cable H07V-K 2,5 mm² (rollo 100 m)', 12, 48.90),
    ('CAB-H07-15', 'Cable H07V-K 1,5 mm² (rollo 100 m)', 8, 31.75),
    ('TUB-COR-20', 'Tubo corrugado 20 mm (rollo 50 m)', 15, 14.60),
    ('CAN-40X60', 'Canaleta PVC 40×60 mm (tramo 2 m)', 25, 9.85),
    ('MEC-INT-01', 'Interruptor sencillo blanco', 60, 3.42),
    ('MEC-BAS-16', 'Base de enchufe 16 A blanca', 80, 3.95),
    ('LUM-PAN-60', 'Panel LED 60×60 40 W', 18, 27.30),
    ('MAG-2P-16', 'Magnetotérmico 2P 16 A', 20, 11.80),
]

EMPLEADOS = ['Pablo Lasheras', 'Elena Abadía', 'Jordi Vilalta', 'Iñaki Goñi', 'Rosa Bielsa', 'Sergio Lahoz']
CATS = {
    'Desplazamientos': [('Kilometraje visita a cliente', 18, 140), ('Tren Zaragoza-Lleida', 22, 65), ('Autobús Zaragoza-Pamplona', 15, 40), ('Avión Zaragoza-Madrid (feria)', 180, 320)],
    'Comidas': [('Comida con cliente', 35, 120), ('Menú del día en ruta', 11, 18), ('Cena en viaje', 20, 45)],
    'Alojamiento': [('Hotel en Pamplona (1 noche)', 70, 110), ('Hotel en Lleida (1 noche)', 65, 95), ('Hotel en Madrid (2 noches, feria)', 260, 420)],
    'Material de oficina': [('Tóner de impresora', 45, 95), ('Papel y archivadores', 12, 40), ('Auriculares para videollamadas', 25, 60)],
    'Aparcamiento': [('Aparcamiento en obra', 3, 12), ('Parking del aeropuerto', 18, 38)],
}

filas = []
dias = [date(2026, 10, 1) + timedelta(days=i) for i in range(31)]
dias = [d for d in dias if d.weekday() < 5]
cat_list = list(CATS)
for i in range(40):
    cat = cat_list[i % len(cat_list)] if i < 35 else random.choice(cat_list)
    concepto, lo, hi = random.choice(CATS[cat])
    importe = round(random.uniform(lo, hi), 2)
    filas.append([random.choice(dias), random.choice(EMPLEADOS), cat, concepto, importe, 'Sí'])
# Gasto exactamente en el límite (300,00 €): no se revisa
filas[17][2:5] = ['Alojamiento', 'Hotel en Madrid (2 noches, feria)', 300.00]
# Aseguramos algunos gastos grandes (más de 300 €)
filas[3][2:5] = ['Alojamiento', 'Hotel en Madrid (2 noches, feria)', 386.40]
filas[11][2:5] = ['Desplazamientos', 'Avión Zaragoza-Madrid (feria)', 312.55]
filas[26][2:5] = ['Material de oficina', 'Silla ergonómica para almacén', 349.00]
# Sin justificante: 6 gastos
for k in (2, 9, 15, 22, 30, 37):
    filas[k][5] = None
random.shuffle(filas)
filas.sort(key=lambda r: r[0])  # llegan por fecha, mezcladas de categoría

df = pd.DataFrame(filas, columns=['Fecha', 'Empleado', 'Categoría', 'Concepto', 'Importe', 'Justificante'])
fac = pd.DataFrame(FACTURA, columns=['Código', 'Descripción', 'Cantidad', 'Precio'])
fac['Importe'] = fac['Cantidad'] * fac['Precio']
base = fac['Importe'].sum()
controles = {
    'base_factura': round(base, 2),
    'iva_factura': round(sum(round(v * IVA + 1e-9, 2) for v in fac['Importe']), 2),
    'total_factura': round(base + sum(round(v * IVA + 1e-9, 2) for v in fac['Importe']), 2),
    'total_gastos': round(df['Importe'].sum(), 2),
    'media_gastos': round(df['Importe'].mean(), 2),
    'max_gasto': round(df['Importe'].max(), 2),
    'sin_justificante': int(df['Justificante'].isna().sum()),
    'revisar': int((df['Importe'] > 300).sum()),
    'por_categoria': {k: round(v, 2) for k, v in df.groupby('Categoría')['Importe'].sum().items()},
}

INSTR = [
    ('Práctica del nivel 1 · Factura y gastos', 'titulo'),
    ('Electro Cierzo Suministros, S.L. · Semana del 16/11/2026', None),
    ('', None),
    ('Marta Ruiz (Directora financiera): «Necesito dos cosas para hoy: la factura de Instalaciones Ebro con sus cálculos, y el repaso de las notas de gasto de octubre, que quiero ver qué hay que revisar».', None),
    ('', None),
    ('PARTE 1 · Hoja «Factura»', 'sub'),
    ('1. En E8 calcula el importe de la línea: cantidad × precio unitario. Cópialo hasta E15.', None),
    ('2. En F8 calcula el IVA de la línea con el tipo de IVA de la celda E4, fijado con $, y redondeado a céntimos con REDONDEAR (como hace el programa de facturación). Cópialo hasta F15.', None),
    ('3. En G8 calcula el total de la línea (importe + IVA). Cópialo hasta G15.', None),
    ('4. En E17 suma la base imponible; en E18, el IVA; en E19, el total de la factura.', None),
    ('5. Formato: euros con dos decimales en D8:G15 y E17:E19; la fecha de B4 como dd/mm/aaaa; bordes en la tabla.', None),
    ('', None),
    ('PARTE 2 · Hoja «Gastos»', 'sub'),
    ('6. En L2:L6 calcula total, media, máximo, número de gastos y cuántos no tienen justificante (columna F vacía).', None),
    ('7. En G2 escribe una fórmula con SI que ponga «Revisar» si el importe es de MÁS de 300 € y deje la celda vacía ("") si no. Cópiala hasta G41.', None),
    ('8. Ordena la lista por Categoría (de A a Z) y, dentro de cada categoría, por Importe de mayor a menor (Datos › Ordenar › Agregar nivel). Con una celda de la lista seleccionada, no una columna.', None),
    ('9. En J2:J6 suma los gastos de cada categoría (después de ordenar, cada categoría está junta: suma su bloque con SUMA). No vuelvas a ordenar después, o las sumas apuntarán a otras filas.', None),
    ('10. Crea un gráfico de columnas con I1:J6, con título y etiquetas de datos.', None),
    ('11. Prepara la hoja Gastos para imprimir: horizontal, todas las columnas en una página, fila 1 repetida y número de página en el pie.', None),
    ('', None),
    ('CÓMO COMPROBAR', 'sub'),
    ('Contesta las preguntas de control en la app. Si un total no coincide, revisa rangos, el $ del IVA y que al ordenar no se haya descolocado ninguna fila.', None),
    ('Ojo: hay un gasto de 300,00 € justo. «Más de 300» significa que ese NO se marca.', None),
]


def escribir(path, solucion):
    wb = xlsxwriter.Workbook(path)
    f_tit = wb.add_format({'bold': True, 'font_size': 14, 'font_color': '#1F4E79'})
    f_sub = wb.add_format({'bold': True, 'font_size': 12})
    f_wrap = wb.add_format({'text_wrap': True, 'valign': 'top'})
    f_head = wb.add_format({'bold': True, 'bg_color': '#DDEBF7', 'border': 1})
    f_b = wb.add_format({'bold': True})
    f_eur = wb.add_format({'num_format': '#,##0.00 €', 'border': 1 if solucion else 0})
    f_eur_b = wb.add_format({'num_format': '#,##0.00 €', 'bold': True, 'border': 1 if solucion else 0})
    f_pct = wb.add_format({'num_format': '0%'})
    f_fecha = wb.add_format({'num_format': 'dd/mm/yyyy'})
    f_cell = wb.add_format({'border': 1 if solucion else 0})

    # Instrucciones
    ws = wb.add_worksheet('Instrucciones')
    ws.set_column('A:A', 110)
    for r, (t, est) in enumerate(INSTR):
        ws.write(r, 0, t, f_tit if est == 'titulo' else f_sub if est == 'sub' else f_wrap)
    if solucion:
        ws.write(len(INSTR) + 1, 0, 'SOLUCIÓN: las fórmulas están en las hojas Factura y Gastos. Totales de control:', f_sub)
        r = len(INSTR) + 2
        for k, v in controles.items():
            ws.write(r, 0, f'{k}: {v}')
            r += 1

    # Factura
    wf = wb.add_worksheet('Factura')
    wf.set_column('A:A', 13); wf.set_column('B:B', 38); wf.set_column('C:C', 10); wf.set_column('D:G', 15)
    wf.write('A1', 'Electro Cierzo Suministros, S.L.', f_tit)
    wf.write('A2', 'Pol. Ind. inventado, nave 12 · 50000 Zaragoza · CIF B00000000 (ficticio)')
    wf.write('A4', 'Fecha', f_b)
    wf.write_number('B4', 46342, f_fecha if solucion else None)  # 16/11/2026 como número de serie
    wf.write('A5', 'Factura', f_b); wf.write('B5', 'F-2026-1302')
    wf.write('C5', 'Cliente', f_b); wf.write('D5', 'Instalaciones Ebro, S.L.')
    wf.write('D4', 'Tipo de IVA', f_b); wf.write_number('E4', IVA, f_pct)
    for c, h in enumerate(['Código', 'Descripción', 'Cantidad', 'Precio unitario', 'Importe', 'IVA', 'Total línea']):
        wf.write(6, c, h, f_head)
    for i, (cod, desc, cant, pre) in enumerate(FACTURA):
        r = 7 + i; n = r + 1
        wf.write(r, 0, cod, f_cell); wf.write(r, 1, desc, f_cell); wf.write_number(r, 2, cant, f_cell)
        wf.write_number(r, 3, pre, f_eur if solucion else None)
        if solucion:
            imp = cant * pre
            wf.write_formula(r, 4, f'=C{n}*D{n}', f_eur, imp)
            wf.write_formula(r, 5, f'=ROUND(E{n}*$E$4,2)', f_eur, round(imp * IVA + 1e-9, 2))
            wf.write_formula(r, 6, f'=E{n}+F{n}', f_eur, imp + round(imp * IVA + 1e-9, 2))
    wf.write('D17', 'Base imponible', f_b); wf.write('D18', 'IVA', f_b); wf.write('D19', 'TOTAL FACTURA', f_b)
    if solucion:
        wf.write_formula('E17', '=SUM(E8:E15)', f_eur_b, controles['base_factura'])
        wf.write_formula('E18', '=SUM(F8:F15)', f_eur_b, controles['iva_factura'])
        wf.write_formula('E19', '=E17+E18', f_eur_b, controles['total_factura'])
        wf.write('A21', 'Comprobación: E19 debe ser igual a la suma de la columna G (G8:G15). Diferencia →')
        wf.write_formula('E21', '=ROUND(E19-SUM(G8:G15),2)', None, 0)

    # Gastos
    wg = wb.add_worksheet('Gastos')
    wg.set_column('A:A', 11); wg.set_column('B:B', 17); wg.set_column('C:C', 19); wg.set_column('D:D', 36)
    wg.set_column('E:E', 12); wg.set_column('F:F', 12); wg.set_column('G:G', 10); wg.set_column('I:I', 19)
    wg.set_column('J:J', 13); wg.set_column('K:K', 26); wg.set_column('L:L', 13)
    for c, h in enumerate(['Fecha', 'Empleado', 'Categoría', 'Concepto', 'Importe', 'Justificante', 'Revisar']):
        wg.write(0, c, h, f_head)
    datos = df.copy()
    if solucion:
        datos = datos.sort_values(['Categoría', 'Importe'], ascending=[True, False]).reset_index(drop=True)
    for i, row in datos.iterrows():
        r = i + 1; n = r + 1
        wg.write_datetime(r, 0, pd.Timestamp(row['Fecha']).to_pydatetime(), f_fecha)
        wg.write(r, 1, row['Empleado']); wg.write(r, 2, row['Categoría']); wg.write(r, 3, row['Concepto'])
        wg.write_number(r, 4, row['Importe'], f_eur if solucion else None)
        if isinstance(row['Justificante'], str):
            wg.write(r, 5, row['Justificante'])
        if solucion:
            wg.write_formula(r, 6, f'=IF(E{n}>300,"Revisar","")', None, 'Revisar' if row['Importe'] > 300 else '')
    # Resumen
    wg.write('I1', 'Categoría', f_head); wg.write('J1', 'Total', f_head)
    cats = sorted(controles['por_categoria'])
    for k, cat in enumerate(cats):
        wg.write(1 + k, 8, cat)
        if solucion:
            idx = datos.index[datos['Categoría'] == cat]
            a, b = idx.min() + 2, idx.max() + 2
            wg.write_formula(1 + k, 9, f'=SUM(E{a}:E{b})', f_eur, controles['por_categoria'][cat])
    labels = ['Total de gastos', 'Media por gasto', 'Gasto más alto', 'Número de gastos', 'Sin justificante']
    forms = ['=SUM(E2:E41)', '=AVERAGE(E2:E41)', '=MAX(E2:E41)', '=COUNT(E2:E41)', '=COUNTBLANK(F2:F41)']
    vals = [controles['total_gastos'], controles['media_gastos'], controles['max_gasto'], 40, controles['sin_justificante']]
    wg.write('K1', 'Resumen', f_head); wg.write('L1', '', f_head)
    for k in range(5):
        wg.write(1 + k, 10, labels[k])
        if solucion:
            wg.write_formula(1 + k, 11, forms[k], f_eur if k < 3 else None, vals[k])
    if solucion:
        wg.write('K8', 'Gastos a revisar (más de 300 €)')
        wg.write_number('L8', controles['revisar'])
        wg.write('K9', '(contados a mano tras ordenar; en el nivel 2 lo hará CONTAR.SI)')
        ch = wb.add_chart({'type': 'column'})
        ch.add_series({'name': 'Gastos de octubre por categoría', 'categories': ['Gastos', 1, 8, 5, 8],
                       'values': ['Gastos', 1, 9, 5, 9], 'data_labels': {'value': True, 'num_format': '#,##0 €'}})
        ch.set_title({'name': 'Gastos de octubre de 2026 por categoría'})
        ch.set_legend({'none': True})
        wg.insert_chart('I12', ch)
    wg.freeze_panes(1, 0)
    wg.set_landscape(); wg.fit_to_pages(1, 0); wg.repeat_rows(0); wg.set_footer('&CPágina &P de &N')
    wb.close()


escribir(OUT, False)
escribir(SOL, True)
for nombre, titulo, desc in [
    ('n1-factura-y-gastos', 'N1 · Factura y notas de gasto', 'Una factura de 8 líneas para calcular con IVA fijo y 40 notas de gasto de octubre para resumir, marcar, ordenar y representar en un gráfico.'),
    ('n1-factura-y-gastos-solucion', 'N1 · Factura y notas de gasto (solución)', 'La práctica resuelta: fórmulas de la factura, resumen de gastos, columna Revisar, lista ordenada y gráfico por categoría.'),
]:
    json.dump({'titulo': titulo, 'descripcion': desc, 'nivel': 'n1'}, open(os.path.join(B, nombre + '.meta.json'), 'w'), ensure_ascii=False, indent=2)
print(json.dumps(controles, ensure_ascii=False, indent=1))

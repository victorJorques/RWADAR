"""Rellena los valores en caché de las fórmulas de p6-solucion.xlsx.

xlsxwriter guarda 0 como resultado de cada fórmula; Excel recalcula al abrir, pero en
Vista protegida (archivo descargado) y en visores (Vista previa de Mac, móvil) se ve todo a 0.
Uso: recalcular antes con LibreOffice en es-ES (recálculo al cargar = siempre):
  soffice --headless --convert-to xlsx --outdir /tmp/recalc_es p6-solucion.xlsx
  python3 p6_valores_cache.py p6-solucion.xlsx /tmp/recalc_es/p6-solucion.xlsx
Solo cambia los <v> de las celdas con fórmula. LibreOffice 24.2 no calcula LET/FILTRAR/APILARH:
la columna Cantidad_LET toma el valor de Cantidad (el control 21 comprueba que son iguales en Excel),
los encabezados «Controles: …» se rellenan con el texto que da Excel y las listas desbordadas
(Lunes!A14, Muertos!A8) se dejan para que Excel las calcule al habilitar la edición.
"""
import sys, re, zipfile, datetime as dt, openpyxl, shutil, os
from xml.sax.saxutils import escape
orig, lo = sys.argv[1], sys.argv[2]
wl = openpyxl.load_workbook(lo, data_only=True)
wf = openpyxl.load_workbook(orig)
z = zipfile.ZipFile(orig)
wbxml = z.read('xl/workbook.xml').decode(); rels = z.read('xl/_rels/workbook.xml.rels').decode()
rid2t = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels)) | {a: b for b, a in re.findall(r'Target="([^"]+)"[^>]*Id="(rId\d+)"', rels)}
sheets = {n: 'xl/' + rid2t[r].lstrip('/').replace('xl/', '') for n, r in re.findall(r'<sheet name="([^"]+)" sheetId="\d+" r:id="(rId\d+)"', wbxml)}
sheets = {n.replace('&amp;', '&'): p for n, p in sheets.items()}
calc = wf['Calc']; hdr = {c.value: c.column_letter for c in calc[1]}
ctl = wl['Controles']
estados = [ctl[f'F{r}'].value for r in range(5, 23) if r != 21]
todo_ok = all(v is True for v in estados)
especiales = {('Controles', 'C21'): 0, ('Controles', 'D21'): 0, ('Controles', 'F21'): True, ('Controles', 'F2'): todo_ok,
              ('Lunes', 'A2'): 'Controles: ' + ('OK' if todo_ok else 'REVISAR') + ' · Corte: 31/10/2026',
              ('Resumen', 'A2'): 'Controles: ' + ('OK' if todo_ok else 'REVISAR')}
EPOCH = dt.datetime(1899, 12, 30)
def valor(sh, ref):
    if (sh, ref) in especiales: return especiales[(sh, ref)]
    v = wl[sh][ref].value
    if sh == 'Calc' and isinstance(v, str) and v.startswith('#') and re.match(hdr['Cantidad_LET'] + r'\d+$', ref):
        v = wl['Calc'][hdr['Cantidad'] + ref[len(hdr['Cantidad_LET']):]].value
    return v
cambios = 0; saltadas = []
def cel(m, sh):
    global cambios
    ref, attrs, fpart = m.group(1), m.group(2), m.group(3)
    v = valor(sh, ref)
    attrs = re.sub(r'\s+t="[^"]*"', '', attrs)
    if isinstance(v, str) and (v.startswith('#') or v.startswith('Err:')):
        saltadas.append((sh, ref)); return m.group(0)
    if isinstance(v, bool): t, s = 'b', '1' if v else '0'
    elif isinstance(v, (int, float)): t, s = None, repr(float(v)) if isinstance(v, float) else str(v)
    elif isinstance(v, dt.datetime): t, s = None, repr((v - EPOCH).total_seconds() / 86400)
    elif isinstance(v, dt.time): t, s = None, repr((v.hour * 3600 + v.minute * 60 + v.second) / 86400)
    else: t, s = 'str', escape('' if v is None else str(v))
    cambios += 1
    return f'<c r="{ref}"{attrs}{"" if t is None else f" t=\"{t}\""}>{fpart}<v>{s}</v></c>'
tmp = orig + '.tmp'
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
    for it in z.infolist():
        data = z.read(it.filename)
        sh = next((n for n, p in sheets.items() if p == it.filename), None)
        if sh is not None:
            x = data.decode()
            x = re.sub(r'<c r="([A-Z]+\d+)"([^>]*)>(<f[^>]*>.*?</f>|<f[^>]*/>)<v>[^<]*</v></c>', lambda m: cel(m, sh), x)
            data = x.encode()
        out.writestr(it, data)
shutil.move(tmp, orig)
print('celdas con valor en caché:', cambios, '· sin valor (las calcula Excel):', saltadas)

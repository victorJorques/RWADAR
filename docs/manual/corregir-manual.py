"""RWAdar · corrige el manual de Eric sin tocar el original.

Sustituye solo dos pasajes que prometen lo que todavía no existe:
  - página 7 (sección 6): el Checklist de Elegibilidad «se descarga
    libremente desde la web» → llegará próximamente.
  - página 9 (sección 8): avisos por correo, guías «una cada diez días»,
    baja en el pie de cada correo → lista de vigilancia hoy; guías y avisos
    de novedades «próximamente», solo si la persona los pide, con baja desde
    cada correo o en Perfil (sin «un clic»: revisión legal del 06/11/2026,
    punto 5.13); la cuenta gratuita abre la RWAdar Academy, con sus nueve
    lecciones publicadas (desde el 06/11/2026; antes decía «siete … y dos más
    en preparación»).

Usa la misma tipografía del PDF (Carlito, de @fontsource/carlito) con el
mismo tamaño, color e interlineado. Lo demás (fondo, tabla, pie, resto de
páginas) queda exactamente igual.

    pip install pymupdf fonttools brotli
    npm pack @fontsource/carlito && tar xzf fontsource-carlito-*.tgz
    python3 docs/manual/corregir-manual.py <carpeta-con-package/>

Salida: docs/manual/RWAdar_Como_Usar_RWAdar_2026_corregido.pdf
"""
import pathlib
import re
import sys

import pymupdf
from fontTools.ttLib import TTFont

AQUI = pathlib.Path(__file__).resolve().parent
ORIGINAL = AQUI / 'RWAdar_Como_Usar_RWAdar_2026.pdf'
SALIDA = AQUI / 'RWAdar_Como_Usar_RWAdar_2026_corregido.pdf'

fuentes = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
ttf = {}
for peso in ('400', '700'):
    destino = fuentes / f'carlito-{peso}.ttf'
    if not destino.exists():
        f = TTFont(fuentes / 'package' / 'files' / f'carlito-latin-{peso}-normal.woff')
        f.flavor = None
        f.save(destino)
    ttf[peso] = str(destino)

REGULAR = pymupdf.Font(fontfile=ttf['400'])
NEGRITA = pymupdf.Font(fontfile=ttf['700'])

CLARO = (0xe9 / 255, 0xf5 / 255, 0xef / 255)  # texto normal
BLANCO = (1, 1, 1)                             # negritas del cuerpo
VERDE = (0x21 / 255, 0xdf / 255, 0x99 / 255)   # subtítulos

IZQ, DER = 45.0, 550.0
CUERPO, INTERLINEA = 10.2, 15.75


def palabras(trozos):
    """[(texto, negrita)] → [(palabra, negrita, espacio_delante)]"""
    salida, pendiente = [], False
    for texto, negrita in trozos:
        for m in re.finditer(r'(\s*)(\S+)', texto):
            salida.append((m.group(2), negrita, bool(m.group(1)) or pendiente))
            pendiente = False
        pendiente = texto[-1:].isspace()
    return salida


class Bloque:
    """Agrupa el texto por color (PyMuPDF pinta un color por TextWriter) y
    escribe párrafos con negritas, ajustados a la izquierda como el original."""

    def __init__(self, pagina):
        self.pagina = pagina
        self.tw = {}

    def _tw(self, color):
        if color not in self.tw:
            self.tw[color] = pymupdf.TextWriter(self.pagina.rect)
        return self.tw[color]

    def linea(self, x, y, texto, fuente, tam, color):
        self._tw(color).append((x, y), texto, font=fuente, fontsize=tam)
        return x + fuente.text_length(texto, tam)

    def parrafo(self, y, trozos, tam=CUERPO, x=IZQ, ancho=DER - IZQ):
        lineas, actual, largo = [], [], 0.0
        esp = REGULAR.text_length(' ', tam)
        for w, neg, espacio in palabras(trozos):
            f = NEGRITA if neg else REGULAR
            lw = f.text_length(w, tam)
            extra = esp if actual and espacio else 0
            if actual and espacio and largo + extra + lw > ancho:
                lineas.append(actual)
                actual, largo, extra = [], 0.0, 0
            actual.append((w, neg, espacio))
            largo += extra + lw
        lineas.append(actual)
        for n, linea in enumerate(lineas):
            cx = x
            for i, (w, neg, espacio) in enumerate(linea):
                f = NEGRITA if neg else REGULAR
                if i and espacio:
                    cx += esp
                cx = self.linea(cx, y + n * INTERLINEA, w, f, tam, BLANCO if neg else CLARO)
        return y + (len(lineas) - 1) * INTERLINEA, len(lineas)

    def escribir(self):
        for color, tw in self.tw.items():
            tw.write_text(self.pagina, color=color)


def borrar(pagina, rects):
    """Quita el texto de esas zonas y deja intactos el fondo y la tabla."""
    for r in rects:
        pagina.add_redact_annot(pymupdf.Rect(*r), fill=False)
    pagina.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                            graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                            text=pymupdf.PDF_REDACT_TEXT_REMOVE)


doc = pymupdf.open(ORIGINAL)
informe = []

# --- Página 7 · sección 6: el checklist todavía no está en la web ---------
p7 = doc[6]
borrar(p7, [(44, 192, 551, 256)])
b = Bloque(p7)
fin, n = b.parrafo(204.0, [
    ('Y antes de todo esto, compruebe su activo.', True),
    (' Titularidad acreditable, cargas identificadas, valoración independiente '
     'vigente, un vehículo limpio y un tamaño que soporte los costes fijos. Un '
     'proveedor serio se lo va a preguntar de todos modos; la diferencia está en '
     'si se lo ha preguntado usted antes. El ', False),
    ('Checklist de Elegibilidad RWA', True),
    (', que recorre esos veinte criterios, llegará próximamente a la web, de '
     'descarga libre y sin registro.', False),
])
b.escribir()
assert fin < 280, f'página 7: el párrafo invade el subtítulo ({fin})'
informe.append(f'página 7: párrafo del checklist en {n} líneas, termina en y={fin:.1f} (subtítulo en 284.4)')

# --- Página 9 · sección 8: lo que hay hoy y lo que llegará ---------------
p9 = doc[8]
borrar(p9, [
    (75, 45, 551, 72),      # título
    (44, 102, 551, 234),    # tres párrafos de arriba
    (44, 260, 551, 320),    # «Qué recibirá a partir de ahora» y su párrafo
    (44, 499, 551, 573),    # Academy y baja de los envíos
])
b = Bloque(p9)
b.linea(76.2, 65.2, 'Su cuenta: su lista de vigilancia', NEGRITA, 19.0, CLARO)

# Misma estructura que el original: 2 + 2 + 3 líneas.
y, n1 = b.parrafo(114.0, [
    ('Con su cuenta tiene algo que ninguna ficha estática le da: ', False),
    ('su propia lista de vigilancia', True),
    ('. Marque las plataformas que le interesan y las encontrará juntas cada vez '
     'que entre, desde cualquier navegador.', False),
])
y, n2 = b.parrafo(y + 26.25, [
    ('Vuelva a ella de vez en cuando y mire la fecha de revisión de cada ficha: es '
     'la diferencia entre consultar una foto suelta y seguir de cerca lo que le importa.', False),
])
# Este párrafo es el original de Eric, sin cambios.
y, n3 = b.parrafo(y + 26.25, [
    ('Por qué importa.', True),
    (' Una verificación vale para la fecha en que se hizo. Una entidad que hoy está '
     'correctamente documentada puede dejar de estarlo: perder una habilitación, '
     'anunciar un cierre, entrar en liquidación. Si usted ya tiene una posición ahí, '
     'enterarse pronto no es una comodidad: es la diferencia entre reaccionar y '
     'enterarse tarde.', False),
])
assert y < 236, f'página 9: los primeros párrafos invaden el subtítulo ({y}; {n1}+{n2}+{n3} líneas)'
informe.append(f'página 9: primeros párrafos terminan en y={y:.1f} (subtítulo en 262.6)')

b.linea(IZQ, 274.5, 'Próximamente: las guías de la serie', NEGRITA, 12.49, VERDE)
y, n = b.parrafo(300.0, [
    ('Las estamos preparando. Le llegarán por correo solo si usted lo pide, de una '
     'en una, para que cada una se pueda leer de verdad.', False),
])
assert y < 325 and n <= 2, f'página 9: el párrafo de las guías invade la tabla ({y})'

# Desde el 06/11/2026 las nueve lecciones están publicadas y cada una se abre
# con la cuenta gratuita (el índice de la Academy sigue siendo público).
y, n = b.parrafo(510.8, [
    ('Mientras tanto, su cuenta gratuita ya le abre la ', False),
    ('RWAdar Academy', True),
    (': nueve lecciones publicadas, de los fundamentos a lo que ocurre después '
     'de emitir, pasando por cómo leer el radar.', False),
])
assert n <= 2, f'página 9: el párrafo de la Academy ocupa {n} líneas (caben 2)'
informe.append(f'página 9: párrafo de la Academy en {n} líneas, termina en y={y:.1f}')
# Revisión legal del 06/11/2026 (docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md,
# 5.13): sin «baja en un clic» ni avisos «cuando una plataforma que vigila cambie».
# Los avisos reales son de novedades, opcionales, con baja en cada correo o en Perfil.
y, n = b.parrafo(y + 26.25, [
    ('También llegarán próximamente, solo si usted los pide, los avisos de novedades: '
     'fichas nuevas en el radar y novedades de la web y la app. Podrá darse de baja '
     'cuando quiera, desde el enlace de cada correo o en su Perfil, sin perder la '
     'cuenta.', False),
])
assert n <= 2, f'página 9: el párrafo de avisos ocupa {n} líneas (caben 2)'
assert y < 585, f'página 9: el último párrafo invade «Si encuentra un error» ({y})'
informe.append(f'página 9: párrafo de avisos en {n} líneas, termina en y={y:.1f} (subtítulo en 601.6)')
b.escribir()

doc.set_metadata({'title': 'Cómo usar RWAdar · Manual de uso · Edición 2026',
                  'author': 'RWAdar', 'subject': 'Manual de bienvenida (revisado el 6/11/2026)'})
doc.subset_fonts()
doc.save(SALIDA, garbage=4, deflate=True)
print('\n'.join(informe))
print(f'Guardado: {SALIDA.relative_to(AQUI.parent.parent)}')

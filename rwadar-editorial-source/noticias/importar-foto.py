"""Importa una foto real con licencia libre de Wikimedia Commons a la biblioteca
de fotos de las noticias (fotos.json y fotos/), desde el 22/11/2026, o, con
--biblioteca ofertas, a la de las ofertas (también desde el 22/11/2026).

Uso (noticias, como siempre):
  python3 rwadar-editorial-source/noticias/importar-foto.py --clave <clave-nueva> \\
      --archivo "File:Nombre en Commons.jpg" --temas regulacion-espana,bancos \\
      --descripcion "La sede de la CNMV en la calle Edison de Madrid" \\
      [--encuadre "50% 50%"] [--trabajo /ruta/fuera/del/repo] [--raiz /copia/del/repo]

Uso (ofertas):
  python3 rwadar-editorial-source/noticias/importar-foto.py --biblioteca ofertas \\
      --clave <slug de la oferta> --archivo "File:Graz Hauptplatz.jpg" \\
      --descripcion "La plaza mayor de Graz con el ayuntamiento al fondo" \\
      --que-muestra lugar --lugar-o-tema "Graz (Austria)" \\
      [--lugar-o-tema-en "Graz (Austria)"] [--encuadre "50% 50%"] [--trabajo …] [--raiz …]
  --que-muestra: «activo» (el edificio o la instalación exacta de la oferta: solo
  si una persona lo ha comprobado), «lugar» (la calle, el barrio o la ciudad
  donde está el activo, no el activo) o «tema» (algo real relacionado: el
  Tesoro, una bolsa, lingotes…). --lugar-o-tema es lo que dice el pie («Foto
  real de <lugar-o-tema>, no del activo»); no va con «activo». La clave es el
  slug de una ficha de rwadar-editorial-source/ofertas/fichas.json que aún no
  tenga foto real. Recorta a 16:11 y exporta un solo WebP sin metadatos,
  rwadar-movil/assets/ofertas-editoriales/foto-<slug>.webp (960×660, ≤ 200 kB:
  el que publica la web y empaqueta la app), apunta la entrada en «reales» de
  rwadar-editorial-source/ofertas/fotos.json y reescribe el manifiesto, el
  bloque de la web y los require de la app con
  node rwadar-editorial-source/ofertas/generar.mjs --indices (la ilustración de
  IA de esa oferta deja de publicarse; su encargo se queda en «fotos»).

Qué hace, en orden (y se para sin escribir nada en cuanto algo no cuadra):
  1. Pide a la API de Commons (action=query, prop=imageinfo,
     iiprop=url|size|sha1|mime|extmetadata, iiurlwidth=1920) los datos del
     archivo, con el agente de usuario genérico «editorial-photo-import/1.0» y
     una pausa entre peticiones.
  2. Acepta solo estas licencias: dominio público, CC0, CC BY 2.0/2.5/3.0/4.0 y
     CC BY-SA 2.0/2.5/3.0/4.0 (la misma lista que LICENCIAS_FOTO de
     rwadar-movil/lib/noticias-sector.js; una prueba las compara). Rechaza todo
     lo demás, lo marcado «NonFree» y lo que tenga restricciones de derechos de
     imagen de personas («personality»).
  3. Descarga la miniatura de 1920 px de ancho que da Commons (o, con
     --original, el original: JPEG, PNG o WebP de hasta 6000 px y 40 MB) a --trabajo (fuera del
     repositorio; por defecto, una carpeta temporal), comprueba su sha1 si es
     el original, y que el recorte 3:2 tenga al menos 1200×800 píxeles útiles.
  4. Recorta a 3:2 con el encuadre («x% y%», como object-position) y exporta
     WebP sin metadatos a fotos/<clave>.webp (1200×800, ≤ 160 kB),
     fotos/960/<clave>.webp (960×640, ≤ 120 kB) y fotos/480/<clave>.webp
     (480×320, ≤ 60 kB), bajando la calidad hasta que quepa.
  5. Añade la entrada a fotos.json (nunca pisa una clave ni un archivo que ya
     existan) y regenera rwadar-site/datos/fotos-noticias.json con
     node rwadar-noticias-editoriales.js --creditos.

El autor es el que pide la licencia: el campo «Attribution» de Commons si lo
trae (el texto de atribución que el autor pide) y, si no, «Artist», siempre sin
HTML. «sinPersonas» queda en true: quien importa MIRA la foto antes de usarla
(sin personas reconocibles, sin logotipos que confundan) y añade la clave a la
tabla de GUIA-TITULARES.md, apartado «4 · La foto».

Necesita Python 3 y Pillow con WebP. Prueba sin red: probar-importar-foto.py.
"""
import argparse
import hashlib
import html
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ_REPO = os.path.abspath(os.path.join(AQUI, '..', '..'))
API = 'https://commons.wikimedia.org/w/api.php'
AGENTE = 'editorial-photo-import/1.0'
PAUSA_S = 1.5
SITIO = 'Wikimedia Commons'
# 1920: uno de los anchos de miniatura estándar de Wikimedia (https://w.wiki/GHai); los
# demás se limitan con 429. Da 1920 × 1280 en 3:2, de sobra para 1200 × 800.
ANCHO_MINIATURA = 1920
MAX_LADO_ORIGINAL = 6000
MAX_BYTES_ORIGINAL = 40 * 1024 * 1024
MIN_ANCHO, MIN_ALTO = 1200, 800
SALIDAS = (  # (carpeta relativa a fotos/, ancho, alto, bytes como mucho)
    ('', 1200, 800, 160000),
    ('960', 960, 640, 120000),
    ('480', 480, 320, 60000),
)
CALIDADES = (84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40)
CLAVE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
ENCUADRE = re.compile(r'^(100|[1-9]?\d)% (100|[1-9]?\d)%$')
PAGINA_COMMONS = re.compile(r'^https://commons\.wikimedia\.org/wiki/File:[^\s"\'<>\\]+$')
ORIGINAL_COMMONS = re.compile(r'^https://(upload|thumb)\.wikimedia\.org/wikipedia/commons/[^\s"\'<>\\]+$')

# Ofertas (--biblioteca ofertas): el tamaño de las imágenes de las fichas (FICHA_ANCHO ×
# FICHA_ALTO de rwadar-ofertas-editoriales.js; 16:11) y su tope.
OFERTA_ANCHO, OFERTA_ALTO, OFERTA_BYTES = 960, 660, 200 * 1024
QUE_MUESTRA = ('activo', 'lugar', 'tema')
# Lo que no se escribe en lo que pone RWAdar (descripción y pie): ni cifras de dinero ni
# promesas (la misma lista que PROHIBIDO de rwadar-movil/lib/fotos-ofertas.js; una prueba las compara).
PROHIBIDO_OFERTA = re.compile(r'[%€$£]|rentab|garantiz|benefici|gananci|retorno|asegurad|sin riesgo|oportunidad', re.I)

# Las licencias admitidas: nombre → (url de la licencia, si obliga a nombrar al autor).
LICENCIAS = {'Dominio público': (None, False), 'CC0': ('https://creativecommons.org/publicdomain/zero/1.0/', False)}
for _tipo in ('by', 'by-sa'):
    for _v in ('2.0', '2.5', '3.0', '4.0'):
        LICENCIAS[f'CC {_tipo.upper()} {_v}'] = (f'https://creativecommons.org/licenses/{_tipo}/{_v}/', True)


class Rechazo(Exception):
    """La foto no entra en la biblioteca (y no se ha escrito nada)."""


def sha256(datos):
    return hashlib.sha256(datos).hexdigest()


# ---- Red (se sustituyen en la prueba sin red) ----
_ultima = [0.0]


def _esperar_turno():
    falta = PAUSA_S - (time.monotonic() - _ultima[0])
    if falta > 0:
        time.sleep(falta)
    _ultima[0] = time.monotonic()


REINTENTOS = 3
MAX_ESPERA_S = 300


def _abrir(req, timeout):
    """urlopen con pausa entre peticiones y, si Commons pide calma (429 o 503),
    espera lo que diga «Retry-After» (como mucho 300 s) y lo vuelve a intentar 3 veces."""
    for intento in range(REINTENTOS + 1):
        _esperar_turno()
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or intento == REINTENTOS:
                raise
            try:
                espera = float(e.headers.get('Retry-After') or 0)
            except ValueError:
                espera = 0
            espera = min(MAX_ESPERA_S, max(PAUSA_S, espera or 10 * (intento + 1)))
            print(f'Commons pide esperar (HTTP {e.code}): {espera:.0f} s y otra vez.', file=sys.stderr)
            time.sleep(espera)


def pedir_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': AGENTE, 'Accept': 'application/json'})
    with _abrir(req, 30) as r:
        return json.loads(r.read().decode('utf-8'))


def descargar(url, maximo=MAX_BYTES_ORIGINAL):
    req = urllib.request.Request(url, headers={'User-Agent': AGENTE})
    with _abrir(req, 120) as r:
        datos = r.read(maximo + 1)
    if len(datos) > maximo:
        raise Rechazo(f'el archivo pasa de {maximo} bytes')
    return datos


# ---- Commons ----
def url_api(archivo):
    return API + '?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'formatversion': '2', 'titles': archivo, 'prop': 'imageinfo',
        'iiprop': 'url|size|sha1|mime|extmetadata', 'iiurlwidth': str(ANCHO_MINIATURA), 'iiextmetadatalanguage': 'es',
    })


def texto_sin_html(valor):
    """El texto de un campo de extmetadata, sin etiquetas, entidades ni espacios de más."""
    t = re.sub(r'<[^>]*>', ' ', str(valor or ''))
    t = html.unescape(t)
    t = re.sub(r'[\u0000-\u001f\u007f<>]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def meta(ext, nombre):
    v = (ext or {}).get(nombre)
    return texto_sin_html(v.get('value')) if isinstance(v, dict) else ''


def licencia_de(ext):
    """La licencia de la lista que corresponde a extmetadata, o Rechazo."""
    if meta(ext, 'NonFree').lower() in ('true', '1', 'yes'):
        raise Rechazo('Commons lo marca como «NonFree»')
    restricciones = meta(ext, 'Restrictions').lower()
    if 'personality' in restricciones:
        raise Rechazo('tiene restricciones de derechos de imagen de personas («personality»)')
    codigo = meta(ext, 'License').lower()
    corta = meta(ext, 'LicenseShortName')
    nombre = None
    if codigo in ('pd', 'public domain') or corta.lower() in ('public domain', 'dominio público', 'pd'):
        nombre = 'Dominio público'
    elif codigo == 'cc0' or corta.lower() in ('cc0', 'cc0 1.0', 'cc-zero'):
        nombre = 'CC0'
    else:
        m = re.fullmatch(r'cc-(by|by-sa)-(2\.0|2\.5|3\.0|4\.0)', codigo)
        if not m:
            m = re.fullmatch(r'cc (by|by-sa) (2\.0|2\.5|3\.0|4\.0)', corta.lower())
        if m:
            nombre = f'CC {m.group(1).upper()} {m.group(2)}'
    if nombre not in LICENCIAS:
        raise Rechazo(f'licencia no admitida: «{corta or codigo or "sin licencia"}» (solo {", ".join(LICENCIAS)})')
    url, atribucion = LICENCIAS[nombre]
    # Las versiones «jurisdiccionales» (cc-by-sa-3.0-es…) no pasan por la expresión de arriba: se rechazan.
    return {'nombre': nombre, 'url': url, 'atribucionObligatoria': atribucion}


def autor_de(ext, licencia):
    if not licencia['atribucionObligatoria']:
        return None
    autor = meta(ext, 'Attribution') or meta(ext, 'Artist')
    # Sin caracteres invisibles (Commons trae a veces un espacio de anchura cero delante).
    autor = re.sub(r'[\u200b-\u200f\u2060\ufeff]', '', autor or '').strip()
    # Las plantillas de la Comisión Europea ponen «© European Union, <año en curso>»: el año
    # bueno es el de la foto, y eso lo decide una persona (README de la biblioteca).
    if re.search(r'©\s*European Union', autor):
        raise Rechazo('la autoría «© European Union, …» la pone la plantilla con el año en curso: '
                      'escríbela a mano con el año de la foto (README de la biblioteca)')
    if not autor:
        raise Rechazo('la licencia obliga a nombrar al autor y Commons no lo da')
    if len(autor) > 200:
        raise Rechazo('el texto de autoría pasa de 200 caracteres: revísalo a mano')
    return autor


def pagina_de(archivo):
    return 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(archivo.replace(' ', '_'), safe=':/_-.(),')


# ---- Imagen ----
def recorte_3_2(ancho, alto, encuadre):
    return recorte_proporcion(ancho, alto, encuadre, 3, 2)


def recorte_proporcion(ancho, alto, encuadre, pw, ph):
    """El recorte pw:ph más grande, colocado con el encuadre («x% y%», como object-position)."""
    x, y = (int(v.rstrip('%')) / 100 for v in encuadre.split())
    if ancho * ph > alto * pw:
        cw, ch = alto * pw // ph, alto
    else:
        cw, ch = ancho, ancho * ph // pw
    izq = round((ancho - cw) * x)
    arr = round((alto - ch) * y)
    return izq, arr, izq + cw, arr + ch


def webp_sin_metadatos(img, ancho, alto, maximo):
    from PIL import Image
    pequena = img.resize((ancho, alto), Image.LANCZOS)
    pequena.info = {}
    for calidad in CALIDADES:
        b = io.BytesIO()
        pequena.save(b, 'WEBP', quality=calidad, method=6)
        datos = b.getvalue()
        if len(datos) <= maximo:
            comprobar_webp(datos, ancho, alto)
            return datos, calidad
    raise Rechazo(f'no cabe en {maximo} bytes a {ancho}×{alto} ni con calidad {CALIDADES[-1]}')


def comprobar_webp(datos, ancho, alto):
    """WebP del tamaño pedido y sin trozos de metadatos (EXIF, XMP ni ICC)."""
    if datos[:4] != b'RIFF' or datos[8:12] != b'WEBP':
        raise Rechazo('el WebP no es válido')
    i, trozos = 12, []
    while i + 8 <= len(datos):
        tipo, largo = datos[i:i + 4], int.from_bytes(datos[i + 4:i + 8], 'little')
        trozos.append(tipo)
        i += 8 + largo + (largo & 1)
    if set(trozos) & {b'EXIF', b'XMP ', b'ICCP'}:
        raise Rechazo('el WebP lleva metadatos')
    from PIL import Image
    with Image.open(io.BytesIO(datos)) as im:
        if im.size != (ancho, alto):
            raise Rechazo(f'el WebP salió de {im.size}, no de {ancho}×{alto}')


# ---- Biblioteca ----
def leer_biblioteca(raiz):
    ruta = os.path.join(raiz, 'rwadar-editorial-source', 'noticias', 'fotos.json')
    with open(ruta, encoding='utf-8') as f:
        return ruta, json.load(f)


def escribir_json(ruta, datos):
    tmp = ruta + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(json.dumps(datos, indent=1, ensure_ascii=False) + '\n')
    os.replace(tmp, ruta)


def titulo_normal(titulo):
    """El título como lo guarda Commons: «_» es un espacio, sin espacios repetidos y la primera letra en mayúscula."""
    resto = re.sub(r'[\s_]+', ' ', str(titulo or '')[5:] if str(titulo or '').startswith('File:') else str(titulo or '')).strip()
    return 'File:' + resto[:1].upper() + resto[1:]


def traer_de_commons(archivo, encuadre, trabajo, raiz, clave, repetida, proporcion, minimo, original=False):
    """Pide los datos a Commons, comprueba la licencia y el autor, descarga (a
    --trabajo, fuera del repositorio) y recorta a la proporción con el
    encuadre. Lo común de las dos bibliotecas; lanza Rechazo sin escribir nada
    en el repositorio."""
    from PIL import Image, ImageOps
    datos_api = pedir_json(url_api(archivo))
    paginas = (datos_api.get('query') or {}).get('pages') or []
    if len(paginas) != 1 or paginas[0].get('missing') or not paginas[0].get('imageinfo'):
        raise Rechazo(f'Commons no tiene «{archivo}»')
    titulo = paginas[0].get('title') or archivo
    repetida(titulo_api=titulo)
    info = paginas[0]['imageinfo'][0]
    ext = info.get('extmetadata') or {}
    licencia = licencia_de(ext)
    autor = autor_de(ext, licencia)
    pagina = pagina_de(titulo)
    if not PAGINA_COMMONS.match(pagina):
        raise Rechazo(f'la página del archivo no es de Commons: {pagina}')

    # Por defecto, la miniatura estándar de 1920 px (de sobra para 1200 × 800): es lo que
    # pide Wikimedia para no cargar sus servidores, y los originales se limitan (429).
    usar_original = original and (info.get('mime') in ('image/jpeg', 'image/png', 'image/webp') and
                     max(info.get('width', 0), info.get('height', 0)) <= MAX_LADO_ORIGINAL and info.get('size', 0) <= MAX_BYTES_ORIGINAL)
    url = info.get('url') if usar_original else info.get('thumburl')
    # Commons añade a veces «?utm_source=…»: fuera (el archivo es el mismo sin ese rastreo).
    url = str(url or '').split('?', 1)[0].split('#', 1)[0] or None
    if not url or not ORIGINAL_COMMONS.match(url):
        raise Rechazo(f'Commons no da una URL de descarga de upload.wikimedia.org ni de thumb.wikimedia.org ({url})')
    crudo = descargar(url)
    if usar_original and info.get('sha1') and hashlib.sha1(crudo).hexdigest() != info['sha1'].lower():
        raise Rechazo('el archivo descargado no tiene el sha1 que da Commons')
    repetida(titulo_api=titulo, sha_original=sha256(crudo))
    trabajo = trabajo or tempfile.mkdtemp(prefix='importar-foto-')
    os.makedirs(trabajo, exist_ok=True)
    if os.path.commonpath([os.path.abspath(trabajo), os.path.abspath(raiz)]) == os.path.abspath(raiz):
        raise Rechazo('--trabajo va fuera del repositorio (lo descargado no se guarda en Git)')
    with open(os.path.join(trabajo, f'{clave}-original{os.path.splitext(urllib.parse.urlparse(url).path)[1] or ".img"}'), 'wb') as f:
        f.write(crudo)

    with Image.open(io.BytesIO(crudo)) as abierta:
        img = ImageOps.exif_transpose(abierta)
        if img.mode not in ('RGB',):
            fondo = Image.new('RGB', img.size, (11, 10, 10))
            convertida = img.convert('RGBA')
            fondo.paste(convertida, mask=convertida.split()[-1])
            img = fondo
        caja = recorte_proporcion(img.width, img.height, encuadre, *proporcion)
        recorte = img.crop(caja)
    if recorte.width < minimo[0] or recorte.height < minimo[1]:
        raise Rechazo(f'el recorte {proporcion[0]}:{proporcion[1]} sale de {recorte.width}×{recorte.height}: '
                      f'hacen falta al menos {minimo[0]}×{minimo[1]} útiles')
    return titulo, licencia, autor, pagina, url, crudo, recorte



def importar(clave, archivo, temas, descripcion, encuadre='50% 50%', trabajo=None, raiz=RAIZ_REPO, creditos=True, original=False):
    """Importa la foto; devuelve la entrada añadida. Lanza Rechazo sin escribir nada si algo no cuadra."""
    from PIL import Image, ImageOps
    if not CLAVE.match(clave or '') or len(clave) > 60:
        raise Rechazo('la clave es en minúsculas, números y guiones (como mucho 60)')
    if not str(archivo).startswith('File:') or len(archivo) > 240:
        raise Rechazo('el archivo es el título de Commons, empezando por «File:»')
    if not ENCUADRE.match(encuadre or ''):
        raise Rechazo('el encuadre es «x% y%», de 0% a 100%')
    descripcion = re.sub(r'\s+', ' ', str(descripcion or '')).strip()
    if not 10 <= len(descripcion) <= 200 or re.search(r'[<>]', descripcion):
        raise Rechazo('la descripción dice lo que se ve, en llano (de 10 a 200 caracteres, sin < ni >)')
    ruta_spec, spec = leer_biblioteca(raiz)
    if spec.get('versionEsquema') != 2:
        raise Rechazo('fotos.json tiene que ser del esquema 2 para llevar fotos reales')
    if clave in spec['fotos']:
        raise Rechazo(f'la clave «{clave}» ya está en fotos.json (una clave publicada no cambia nunca)')
    temas = [t.strip() for t in temas if t.strip()]
    if not 1 <= len(temas) <= 3 or len(set(temas)) != len(temas) or any(t not in spec['temas'] for t in temas):
        raise Rechazo(f'de 1 a 3 temas distintos de la lista: {", ".join(spec["temas"])}')
    dir_fotos = os.path.join(os.path.dirname(ruta_spec), 'fotos')
    destinos = [os.path.join(dir_fotos, c, f'{clave}.webp') for c, *_ in SALIDAS]
    if any(os.path.lexists(d) for d in destinos):
        raise Rechazo(f'ya hay un archivo con la clave «{clave}» en fotos/')
    def repetida(titulo_api=None, sha_original=None):
        # El mismo archivo de Commons no entra dos veces: ni con otro modo de
        # escribir el título («_» por espacio, la primera letra), ni con el
        # título que devuelve la API, ni con los mismos bytes con otro nombre.
        for otra, f in spec['fotos'].items():
            if f.get('origen') != 'foto':
                continue
            ya = titulo_normal(f['fuente']['archivo'])
            if ya in (titulo_normal(archivo), titulo_normal(titulo_api or archivo)) or (sha_original and f['fuente'].get('sha256Original') == sha_original):
                raise Rechazo(f'ese archivo ya está en la biblioteca como «{otra}»')
    repetida()

    titulo, licencia, autor, pagina, url, crudo, recorte = traer_de_commons(
        archivo, encuadre, trabajo, raiz, clave, repetida, (3, 2), (MIN_ANCHO, MIN_ALTO), original)
    exportadas = []
    for carpeta, w, h, maximo in SALIDAS:
        datos, calidad = webp_sin_metadatos(recorte, w, h, maximo)
        exportadas.append((carpeta, w, h, datos, calidad))
    for (carpeta, *_resto), destino in zip(exportadas, destinos):
        os.makedirs(os.path.dirname(destino), exist_ok=True)
    escritos = []
    try:
        for (carpeta, w, h, datos, calidad), destino in zip(exportadas, destinos):
            with open(destino, 'xb') as f:
                f.write(datos)
            escritos.append(destino)
        principal = exportadas[0][3]
        entrada = {
            'origen': 'foto',
            'descripcion': descripcion,
            'fuente': {'sitio': SITIO, 'archivo': titulo, 'pagina': pagina, 'original': url, 'sha256Original': sha256(crudo)},
            'licencia': licencia,
            'autor': autor,
            'sinPersonas': True,
            'encuadre': encuadre,
            'bytes': len(principal),
            'sha256': sha256(principal),
            'temas': temas,
            'variantes': {c: {'bytes': len(d), 'sha256': sha256(d)} for c, _w, _h, d, _q in sorted(exportadas[1:], key=lambda x: int(x[0]))},
        }
        spec['fotos'][clave] = entrada
        escribir_json(ruta_spec, spec)
    except BaseException:
        for d in escritos:
            os.remove(d)
        raise
    if creditos:
        regenerar_creditos(raiz)
    return entrada, exportadas


def leer_ofertas(raiz):
    base = os.path.join(raiz, 'rwadar-editorial-source', 'ofertas')
    with open(os.path.join(base, 'fotos.json'), encoding='utf-8') as f:
        spec = json.load(f)
    with open(os.path.join(base, 'fichas.json'), encoding='utf-8') as f:
        fichas = json.load(f)
    return os.path.join(base, 'fotos.json'), spec, {x['slug'] for x in fichas.get('fichas', [])}


def texto_oferta(valor, nombre, minimo, maximo):
    t = re.sub(r'\s+', ' ', str(valor or '')).strip()
    if not minimo <= len(t) <= maximo or re.search(r'[<>\u0000-\u001f\u007f\u200b-\u200f\u2060\ufeff]', t):
        raise Rechazo(f'{nombre}: en llano, de {minimo} a {maximo} caracteres, sin < ni >')
    if PROHIBIDO_OFERTA.search(t):
        raise Rechazo(f'{nombre}: sin cifras de dinero ni promesas («%», «€», «rentabilidad», «garantiza», «oportunidad»…)')
    return t


def importar_oferta(clave, archivo, descripcion, que_muestra, lugar_o_tema=None, encuadre='50% 50%', trabajo=None,
                    raiz=RAIZ_REPO, indices=True, original=False, lugar_o_tema_en=None):
    """Importa la foto real de una oferta (--biblioteca ofertas); devuelve la entrada añadida a «reales».
    Lanza Rechazo sin escribir nada si algo no cuadra."""
    if not CLAVE.match(clave or '') or len(clave) > 160:
        raise Rechazo('la clave es el slug de la oferta: minúsculas, números y guiones')
    if not str(archivo).startswith('File:') or len(archivo) > 240:
        raise Rechazo('el archivo es el título de Commons, empezando por «File:»')
    if not ENCUADRE.match(encuadre or ''):
        raise Rechazo('el encuadre es «x% y%», de 0% a 100%')
    descripcion = texto_oferta(descripcion, 'la descripción dice lo que de verdad se ve', 10, 200)
    if que_muestra not in QUE_MUESTRA:
        raise Rechazo(f'--que-muestra es {", ".join(QUE_MUESTRA)}')
    if que_muestra == 'activo':
        if lugar_o_tema or lugar_o_tema_en:
            raise Rechazo('la foto del activo no lleva --lugar-o-tema (el pie dice «Foto real del activo»)')
    else:
        lugar_o_tema = texto_oferta(lugar_o_tema, '--lugar-o-tema (lo que dice el pie: «Foto real de …, no del activo»)', 2, 80)
        if lugar_o_tema_en:
            lugar_o_tema_en = texto_oferta(lugar_o_tema_en, '--lugar-o-tema-en', 2, 80)
    ruta_spec, spec, slugs = leer_ofertas(raiz)
    if spec.get('versionEsquema') != 3 or not isinstance(spec.get('reales'), dict):
        raise Rechazo('rwadar-editorial-source/ofertas/fotos.json tiene que ser del esquema 3 (con «reales») para llevar fotos reales')
    if clave not in slugs:
        raise Rechazo(f'«{clave}» no es una ficha de rwadar-editorial-source/ofertas/fichas.json')
    if clave in spec['reales']:
        raise Rechazo(f'«{clave}» ya tiene foto real en fotos.json (no se pisa: quítala a mano con su revisión y vuelve a importar)')
    destino = os.path.join(raiz, 'rwadar-movil', 'assets', 'ofertas-editoriales', f'foto-{clave}.webp')
    if os.path.lexists(destino):
        raise Rechazo(f'ya hay un archivo foto-{clave}.webp en rwadar-movil/assets/ofertas-editoriales/')

    def repetida(titulo_api=None, sha_original=None):
        for otra, f in spec['reales'].items():
            ya = titulo_normal(f['fuente']['archivo'])
            if ya in (titulo_normal(archivo), titulo_normal(titulo_api or archivo)) or (sha_original and f['fuente'].get('sha256Original') == sha_original):
                raise Rechazo(f'ese archivo ya está en la biblioteca de ofertas como «{otra}»')
    repetida()

    titulo, licencia, autor, pagina, url, crudo, recorte = traer_de_commons(
        archivo, encuadre, trabajo, raiz, clave, repetida, (16, 11), (OFERTA_ANCHO, OFERTA_ALTO), original)
    datos, calidad = webp_sin_metadatos(recorte, OFERTA_ANCHO, OFERTA_ALTO, OFERTA_BYTES)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    entrada = {
        'origen': 'foto',
        'descripcion': descripcion,
        'queMuestra': que_muestra,
        **({'lugarOTema': lugar_o_tema} if que_muestra != 'activo' else {}),
        **({'lugarOTemaEn': lugar_o_tema_en} if que_muestra != 'activo' and lugar_o_tema_en else {}),
        'fuente': {'sitio': SITIO, 'archivo': titulo, 'pagina': pagina, 'original': url, 'sha256Original': sha256(crudo)},
        'licencia': licencia,
        'autor': autor,
        'sinPersonas': True,
        'encuadre': encuadre,
        'bytes': len(datos),
        'sha256': sha256(datos),
    }
    with open(ruta_spec, 'rb') as f:
        antes = f.read()
    escrito = False
    try:
        with open(destino, 'xb') as f:
            f.write(datos)
        escrito = True
        spec['reales'][clave] = entrada
        escribir_json(ruta_spec, spec)
        if indices:
            regenerar_indices_ofertas(raiz)
    except BaseException:
        # Si el manifiesto no sale, no queda nada a medias: ni la foto ni la entrada.
        if escrito:
            os.remove(destino)
        with open(ruta_spec, 'wb') as f:
            f.write(antes)
        raise
    return entrada, [('', OFERTA_ANCHO, OFERTA_ALTO, datos, calidad)]


def regenerar_indices_ofertas(raiz):
    """El manifiesto, el bloque de la web y los require de la app, sin dibujar nada."""
    script = os.path.join(RAIZ_REPO, 'rwadar-editorial-source', 'ofertas', 'generar.mjs')
    r = subprocess.run(['node', script, '--indices', f'--raiz={os.path.abspath(raiz)}'], cwd=raiz, capture_output=True, text=True)
    if r.returncode != 0:
        raise Rechazo('generar.mjs --indices no pudo reescribir el manifiesto: ' + (r.stderr or r.stdout).strip()[-600:])
    print(r.stdout.strip())


def regenerar_creditos(raiz):
    script = os.path.join(raiz, 'rwadar-noticias-editoriales.js')
    if not os.path.exists(script):
        print('Aviso: no está rwadar-noticias-editoriales.js; regenera los créditos a mano (--creditos).')
        return
    subprocess.run(['node', script, '--creditos'], cwd=raiz, check=True)


def main(argv=None):
    p = argparse.ArgumentParser(description='Importa una foto de Wikimedia Commons a la biblioteca de las noticias o de las ofertas.')
    p.add_argument('--biblioteca', choices=('noticias', 'ofertas'), default='noticias', help='a qué biblioteca (por defecto, la de las noticias)')
    p.add_argument('--clave', help='la clave nueva (noticias) o el slug de la oferta (ofertas)')
    p.add_argument('--archivo', help='título en Commons, «File:…»')
    p.add_argument('--temas', help='noticias: de 1 a 3, separados por comas')
    p.add_argument('--que-muestra', choices=QUE_MUESTRA, help='ofertas: activo, lugar o tema')
    p.add_argument('--lugar-o-tema', help='ofertas: lo que dice el pie («Graz (Austria)», «la Bolsa de Nueva York»); no con activo')
    p.add_argument('--lugar-o-tema-en', help='ofertas, opcional: lo mismo en inglés para el pie en inglés')
    p.add_argument('--descripcion', help='lo que de verdad se ve, en castellano llano (texto alternativo)')
    p.add_argument('--encuadre', default='50% 50%', help='posición del recorte 3:2, «x%% y%%» (por defecto, el centro)')
    p.add_argument('--trabajo', help='carpeta fuera del repositorio para lo descargado')
    p.add_argument('--raiz', default=RAIZ_REPO, help='raíz del repositorio (por defecto, este; otra, para probar en una copia)')
    p.add_argument('--original', action='store_true', help='descargar el original en vez de la miniatura de 1920 px (por defecto, la miniatura)')
    p.add_argument('--licencias-json', action='store_true', help='solo escribe la lista de licencias admitidas (para las pruebas)')
    a = p.parse_args(argv)
    if a.licencias_json:
        print(json.dumps({k: {'url': v[0], 'atribucion': v[1]} for k, v in LICENCIAS.items()}, ensure_ascii=False))
        return 0
    if a.biblioteca == 'ofertas':
        return main_ofertas(p, a)
    if not (a.clave and a.archivo and a.temas and a.descripcion):
        p.error('faltan --clave, --archivo, --temas o --descripcion')
    try:
        entrada, exportadas = importar(a.clave, a.archivo, a.temas.split(','), a.descripcion, a.encuadre, a.trabajo, raiz=os.path.abspath(a.raiz), original=a.original)
    except Rechazo as e:
        print(f'NO SE IMPORTA: {e}', file=sys.stderr)
        return 2
    print(f'Importada «{a.clave}»: {entrada["fuente"]["archivo"]} ({entrada["licencia"]["nombre"]}'
          f'{", " + entrada["autor"] if entrada["autor"] else ""}).')
    for carpeta, w, h, datos, calidad in exportadas:
        print(f'  fotos/{carpeta + "/" if carpeta else ""}{a.clave}.webp: {w}×{h}, {len(datos)} bytes, calidad {calidad}')
    print('Ahora: MÍRALA a tamaño completo (sin personas reconocibles, que se vea lo que dice la descripción), '
          'añade la clave a la tabla de GUIA-TITULARES.md («4 · La foto») y node rwadar-noticias-editoriales.js --comprobar.')
    return 0


def main_ofertas(p, a):
    if not (a.clave and a.archivo and a.descripcion and a.que_muestra):
        p.error('con --biblioteca ofertas: faltan --clave, --archivo, --descripcion o --que-muestra')
    if a.temas:
        p.error('--temas es de las noticias')
    try:
        entrada, exportadas = importar_oferta(a.clave, a.archivo, a.descripcion, a.que_muestra, a.lugar_o_tema, a.encuadre, a.trabajo,
                                              raiz=os.path.abspath(a.raiz), original=a.original, lugar_o_tema_en=a.lugar_o_tema_en)
    except Rechazo as e:
        print(f'NO SE IMPORTA: {e}', file=sys.stderr)
        return 2
    print(f'Importada la foto real de «{a.clave}» ({entrada["queMuestra"]}): {entrada["fuente"]["archivo"]} ({entrada["licencia"]["nombre"]}'
          f'{", " + entrada["autor"] if entrada["autor"] else ""}).')
    for _c, w, h, datos, calidad in exportadas:
        print(f'  rwadar-movil/assets/ofertas-editoriales/foto-{a.clave}.webp: {w}×{h}, {len(datos)} bytes, calidad {calidad}')
    print('Ahora: MÍRALA a tamaño completo (sin personas reconocibles; que se vea lo que dice la descripción; y, si dice «activo», '
          'que sea de verdad el edificio o la instalación de la oferta), node rwadar-editorial-source/ofertas/generar.mjs --comprobar y npm test.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

"""Prueba sin red de importar-foto.py (22/11/2026).

Con una respuesta de la API de Commons simulada y una imagen generada aquí,
sobre una copia de la biblioteca en una carpeta temporal (el repositorio no se
toca): una foto CC BY-SA con su autor sin HTML, una de dominio público, la
miniatura cuando el original no vale, y los rechazos (licencia no libre o no
admitida, «NonFree», derechos de imagen, poco tamaño, clave repetida, temas,
sha1 distinto, --trabajo dentro del repositorio). Con --biblioteca ofertas:
la foto del lugar y la del activo con su pie, las reglas de «queMuestra» y
«lugarOTema», y que el manifiesto, la web y la app salen bien (generar.mjs
--indices de verdad, sobre la copia). Comprueba además que los WebP
no llevan metadatos, que el comprobador de Node acepta la entrada nueva, que
el archivo de créditos sale con el crédito corto y que la lista de licencias es
la del modelo de la web y la app.

  python3 rwadar-editorial-source/noticias/probar-importar-foto.py
"""
import hashlib
import importlib.util
import io
import json
import os
import random
import shutil
import subprocess
import sys
import tempfile
import unittest
import urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
try:
    from PIL import Image, features
    CON_PILLOW = bool(features.check('webp'))
except ImportError:  # pragma: no cover
    CON_PILLOW = False
CON_NODE = shutil.which('node') is not None

spec = importlib.util.spec_from_file_location('importar_foto', os.path.join(AQUI, 'importar-foto.py'))
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)


def imagen(ancho, alto, formato='JPEG', semilla=7):
    """Una imagen con textura (no un color liso: así el WebP pesa de verdad)."""
    rnd = random.Random(semilla)
    w, h = max(2, ancho // 24), max(2, alto // 24)
    ruido = Image.frombytes('RGB', (w, h), rnd.randbytes(w * h * 3))
    degradado = Image.linear_gradient('L').resize((w, h)).convert('RGB')
    img = Image.blend(ruido, degradado, 0.4).resize((ancho, alto), Image.BICUBIC)
    b = io.BytesIO()
    img.save(b, formato, quality=90) if formato == 'JPEG' else img.save(b, formato)
    return b.getvalue()


def leer(ruta):
    with open(ruta, 'rb') as f:
        return f.read()


def respuesta(archivo, datos, ancho, alto, licencia='cc-by-sa-4.0', corta='CC BY-SA 4.0', artista='<a href="//commons.wikimedia.org/wiki/User:Ejemplo">Ana&nbsp;Ejemplo</a>',
              mime='image/jpeg', extra=None, sha1=None, falta=False):
    nombre = archivo[5:].replace(' ', '_')
    ext = {'License': {'value': licencia}, 'LicenseShortName': {'value': corta}, 'Artist': {'value': artista},
           'AttributionRequired': {'value': 'true'}, 'Restrictions': {'value': ''}}
    ext.update(extra or {})
    pagina = {'title': archivo, 'imageinfo': [{
        'url': f'https://upload.wikimedia.org/wikipedia/commons/a/ab/{urllib.parse.quote(nombre)}?utm_source=commons.wikimedia.org&utm_campaign=imageinfo',
        'thumburl': f'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/{urllib.parse.quote(nombre)}/2400px-{urllib.parse.quote(nombre)}.jpg',
        'width': ancho, 'height': alto, 'size': len(datos), 'mime': mime, 'sha1': sha1 or hashlib.sha1(datos).hexdigest(), 'extmetadata': ext}]}
    if falta:
        pagina = {'title': archivo, 'missing': True}
    return {'batchcomplete': True, 'query': {'pages': [pagina]}}


class Biblioteca(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix='probar-importar-foto-')
        self.raiz = os.path.join(self.tmp, 'repo')
        self.trabajo = os.path.join(self.tmp, 'trabajo')
        origen = os.path.join(RAIZ, 'rwadar-editorial-source', 'noticias')
        destino = os.path.join(self.raiz, 'rwadar-editorial-source', 'noticias')
        os.makedirs(destino)
        shutil.copy(os.path.join(origen, 'fotos.json'), destino)
        shutil.copytree(os.path.join(origen, 'fotos'), os.path.join(destino, 'fotos'))
        self.spec = os.path.join(destino, 'fotos.json')
        self.fotos = os.path.join(destino, 'fotos')
        with open(self.spec, 'rb') as f:
            self.antes = f.read()
        self.pedidas, self.bajadas = [], []
        self._pedir, self._bajar, self._pausa = imp.pedir_json, imp.descargar, imp.PAUSA_S
        imp.PAUSA_S = 0

    def tearDown(self):
        imp.pedir_json, imp.descargar, imp.PAUSA_S = self._pedir, self._bajar, self._pausa
        shutil.rmtree(self.tmp, ignore_errors=True)

    def simular(self, resp, archivos):
        def pedir(url):
            self.pedidas.append(url)
            return resp
        def bajar(url, maximo=imp.MAX_BYTES_ORIGINAL):
            self.bajadas.append(url)
            m = {k.split('?')[0]: v for k, v in archivos.items() if k}
            # Con un solo archivo simulado, la miniatura y el original son la misma imagen.
            return m[url] if url in m or len(m) != 1 else next(iter(m.values()))
        imp.pedir_json, imp.descargar = pedir, bajar

    def importar(self, clave='sede-ejemplo', archivo='File:Sede de ejemplo, Madrid.jpg', temas=('regulacion-espana',),
                 descripcion='La fachada de piedra de una sede oficial en una calle de Madrid', **kw):
        return imp.importar(clave, archivo, list(temas), descripcion, kw.pop('encuadre', '50% 50%'), kw.pop('trabajo', self.trabajo),
                            raiz=self.raiz, creditos=False, **kw)

    def sin_cambios(self):
        with open(self.spec, 'rb') as f:
            self.assertEqual(f.read(), self.antes, 'fotos.json no cambia')
        for carpeta in ('', '480', '960'):
            self.assertFalse(os.path.exists(os.path.join(self.fotos, carpeta, 'sede-ejemplo.webp')), 'ni se escribe ninguna foto')


class Importar(Biblioteca):
    def test_cc_by_sa_con_autor_sin_html_y_webp_sin_metadatos(self):
        datos = imagen(3000, 2000)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        url = resp['query']['pages'][0]['imageinfo'][0]['url']
        self.simular(resp, {url: datos})
        entrada, exportadas = self.importar()
        # La petición: la API de Commons con lo que hace falta.
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.pedidas[0]).query)
        self.assertTrue(self.pedidas[0].startswith('https://commons.wikimedia.org/w/api.php?'))
        self.assertEqual((q['action'], q['prop'], q['iiprop'], q['titles']),
                         (['query'], ['imageinfo'], ['url|size|sha1|mime|extmetadata'], ['File:Sede de ejemplo, Madrid.jpg']))
        url = url.split('?')[0]
        self.assertEqual(self.bajadas, [resp['query']['pages'][0]['imageinfo'][0]['thumburl']], 'por defecto, la miniatura de 1920 px, sin el «?utm_…» de Commons')
        self.assertEqual(entrada['origen'], 'foto')
        self.assertEqual(entrada['autor'], 'Ana Ejemplo', 'sin HTML ni entidades')
        self.assertEqual(entrada['licencia'], {'nombre': 'CC BY-SA 4.0', 'url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'atribucionObligatoria': True})
        self.assertEqual(entrada['fuente'], {'sitio': 'Wikimedia Commons', 'archivo': 'File:Sede de ejemplo, Madrid.jpg',
                                             'pagina': 'https://commons.wikimedia.org/wiki/File:Sede_de_ejemplo,_Madrid.jpg',
                                             'original': resp['query']['pages'][0]['imageinfo'][0]['thumburl'], 'sha256Original': hashlib.sha256(datos).hexdigest()})
        self.assertTrue(entrada['sinPersonas'])
        for campo in ('modelo', 'prompt', 'semilla', 'concepto', 'retoque'):
            self.assertNotIn(campo, entrada)
        # Los tres WebP: tamaño, peso, sha256 y sin trozos de metadatos.
        for carpeta, w, h, maximo in imp.SALIDAS:
            ruta = os.path.join(self.fotos, carpeta, 'sede-ejemplo.webp')
            with open(ruta, 'rb') as f:
                b = f.read()
            self.assertLessEqual(len(b), maximo)
            with Image.open(io.BytesIO(b)) as im:
                self.assertEqual(im.size, (w, h))
                self.assertFalse(im.info.get('exif') or im.info.get('icc_profile') or im.info.get('xmp'))
            self.assertNotIn(b'EXIF', b[12:64])
            dato = entrada if not carpeta else entrada['variantes'][carpeta]
            self.assertEqual((dato['bytes'], dato['sha256']), (len(b), hashlib.sha256(b).hexdigest()))
        # Lo descargado se queda en --trabajo, fuera del repositorio.
        self.assertEqual(len(os.listdir(self.trabajo)), 1)
        # fotos.json: la entrada nueva al final y las demás, byte a byte como estaban.
        with open(self.spec, encoding='utf-8') as f:
            nuevo = json.load(f)
        viejo = json.loads(self.antes.decode('utf-8'))
        self.assertEqual(list(nuevo['fotos'])[-1], 'sede-ejemplo')
        del nuevo['fotos']['sede-ejemplo']
        self.assertEqual(nuevo, viejo)
        self.comprobar_con_node()

    def comprobar_con_node(self):
        guion = ("const m=require(process.argv[1]);const r=m.cargarFotosNoticias(process.argv[2],{claves:['sede-ejemplo']});"
                 "const c=JSON.parse(m.creditosDesdeManifiesto(r.manifiesto));"
                 "const n=require(process.argv[3]);const v=n.validarCreditosFotos(c);"
                 "console.log(JSON.stringify({fotos:r.fotos.length,credito:n.creditoFoto({imagen:'sede-ejemplo'},v,'es'),"
                 "en:n.creditoFoto({imagen:'sede-ejemplo'},v,'en').texto,nota:n.notaFotos([{imagen:'sede-ejemplo'}],v)}))")
        salida = subprocess.run(['node', '-e', guion, os.path.join(RAIZ, 'rwadar-noticias-editoriales.js'), self.raiz,
                                 os.path.join(RAIZ, 'rwadar-movil', 'lib', 'noticias-sector.js')],
                                capture_output=True, text=True, check=True).stdout
        r = json.loads(salida)
        pagina, licencia = 'https://commons.wikimedia.org/wiki/File:Sede_de_ejemplo,_Madrid.jpg', 'https://creativecommons.org/licenses/by-sa/4.0/'
        self.assertEqual(r['credito'], {'origen': 'foto', 'texto': 'Foto: Ana Ejemplo · CC BY-SA 4.0 · Wikimedia Commons',
                                        'enlace': pagina, 'licenciaUrl': licencia,
                                        'alt': 'La fachada de piedra de una sede oficial en una calle de Madrid',
                                        'partes': [{'texto': 'Foto: Ana Ejemplo · ', 'enlace': None}, {'texto': 'CC BY-SA 4.0', 'enlace': licencia},
                                                   {'texto': ' · ', 'enlace': None}, {'texto': 'Wikimedia Commons', 'enlace': pagina}],
                                        'recorte': 'recortada'})
        self.assertEqual(r['en'], 'Photo: Ana Ejemplo · CC BY-SA 4.0 · Wikimedia Commons')
        self.assertEqual(r['nota'], 'Fotos de archivo con licencia libre: ilustran el tema, no son de la noticia.')

    def test_dominio_publico_sin_autor(self):
        datos = imagen(2400, 1600, 'PNG')
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 2400, 1600, licencia='pd', corta='Public domain', mime='image/png')
        self.simular(resp, {resp['query']['pages'][0]['imageinfo'][0]['url']: datos})
        entrada, _ = self.importar(encuadre='0% 100%')
        self.assertIsNone(entrada['autor'])
        self.assertEqual(entrada['licencia'], {'nombre': 'Dominio público', 'url': None, 'atribucionObligatoria': False})
        self.assertEqual(entrada['encuadre'], '0% 100%')

    def test_por_defecto_la_miniatura_y_el_original_solo_si_se_pide(self):
        datos = imagen(3000, 2000)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        info = resp['query']['pages'][0]['imageinfo'][0]
        self.simular(resp, {info['url']: datos, info['thumburl']: datos})
        entrada, _ = self.importar()
        self.assertEqual(self.bajadas, [info['thumburl']])
        self.assertEqual(entrada['fuente']['original'], info['thumburl'])

    def test_el_original_si_se_pide(self):
        datos = imagen(3000, 2000)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        info = resp['query']['pages'][0]['imageinfo'][0]
        self.simular(resp, {info['url']: datos, info['thumburl']: imagen(2400, 1600)})
        entrada, _ = self.importar(original=True)
        self.assertEqual(self.bajadas, [info['url'].split('?')[0]], 'el original (cabe y es JPEG), sin el «?utm_…» de Commons')
        self.assertEqual(entrada['fuente']['original'], info['url'].split('?')[0])

    def test_miniatura_si_el_original_no_vale(self):
        grande = imagen(2400, 1600)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', b'x' * 10, 9000, 6000, mime='image/tiff')
        thumb = resp['query']['pages'][0]['imageinfo'][0]['thumburl']
        self.simular(resp, {thumb: grande})
        entrada, _ = self.importar()
        self.assertEqual(self.bajadas, [thumb])
        self.assertEqual(entrada['fuente']['original'], thumb)

    def rechaza(self, patron, resp=None, datos=None, **kw):
        datos = datos or imagen(3000, 2000)
        resp = resp or respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        info = resp['query']['pages'][0].get('imageinfo', [{}])[0]
        self.simular(resp, {info.get('url'): datos, info.get('thumburl'): datos})
        with self.assertRaisesRegex(imp.Rechazo, patron):
            self.importar(**kw)
        self.sin_cambios()

    def test_rechazos(self):
        d = imagen(3000, 2000)
        r = lambda **kw: respuesta('File:Sede de ejemplo, Madrid.jpg', d, 3000, 2000, **kw)
        self.rechaza('licencia no admitida', r(licencia='cc-by-nc-4.0', corta='CC BY-NC 4.0'), d)
        self.rechaza('licencia no admitida', r(licencia='gfdl', corta='GFDL'), d)
        self.rechaza('licencia no admitida', r(licencia='cc-by-sa-3.0-de', corta='CC BY-SA 3.0 de'), d)
        self.rechaza('NonFree', r(extra={'NonFree': {'value': 'true'}}), d)
        self.rechaza('personality', r(extra={'Restrictions': {'value': 'personality'}}), d)
        self.rechaza('nombrar al autor', r(artista=''), d)
        self.rechaza('sha1', r(sha1='0' * 40), d, original=True)
        self.rechaza('no tiene', r(falta=True), d)
        pequena = imagen(1300, 700)
        self.rechaza('al menos 1200×800', respuesta('File:Sede de ejemplo, Madrid.jpg', pequena, 1300, 700), pequena)
        self.rechaza('ya está en fotos.json', clave='alerta-fraude')
        self.rechaza('temas', temas=('no-existe',))
        self.rechaza('temas', temas=('bancos', 'bancos'))
        self.rechaza('clave', clave='Sede Ejemplo')
        self.rechaza('descripción', descripcion='corta')
        self.rechaza('encuadre', encuadre='centro')
        self.rechaza('fuera del repositorio', trabajo=os.path.join(self.raiz, 'descargas'))

    def test_el_mismo_archivo_dos_veces_no(self):
        datos = imagen(3000, 2000)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        self.simular(resp, {resp['query']['pages'][0]['imageinfo'][0]['url']: datos})
        self.importar()
        with self.assertRaisesRegex(imp.Rechazo, 'ya está en la biblioteca'):
            self.importar(clave='sede-ejemplo-2')

    def test_el_mismo_archivo_escrito_con_guiones_bajos_no(self):
        # Commons normaliza el título («_» es un espacio): el importador compara el título que devuelve la API.
        datos = imagen(3000, 2000)
        resp = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        self.simular(resp, {resp['query']['pages'][0]['imageinfo'][0]['url']: datos})
        self.importar()
        with open(self.spec, 'rb') as f:
            antes = f.read()
        with self.assertRaisesRegex(imp.Rechazo, 'ya está en la biblioteca'):
            self.importar(clave='sede-ejemplo-2', archivo='File:Sede_de_ejemplo,_Madrid.jpg')
        with open(self.spec, 'rb') as f:
            self.assertEqual(f.read(), antes, 'fotos.json no cambia')
        self.assertFalse(os.path.exists(os.path.join(self.fotos, 'sede-ejemplo-2.webp')))

    def test_la_misma_imagen_con_otro_nombre_no(self):
        # Otro título, los mismos bytes (una copia subida dos veces): sha256Original repetido.
        datos = imagen(3000, 2000)
        uno = respuesta('File:Sede de ejemplo, Madrid.jpg', datos, 3000, 2000)
        dos = respuesta('File:Otra copia de la sede.jpg', datos, 3000, 2000)
        descargas = {r['query']['pages'][0]['imageinfo'][0][k]: datos for r in (uno, dos) for k in ('url', 'thumburl')}
        self.simular(uno, descargas)
        self.importar()
        self.simular(dos, descargas)
        with self.assertRaisesRegex(imp.Rechazo, 'ya está en la biblioteca'):
            self.importar(clave='sede-ejemplo-2', archivo='File:Otra copia de la sede.jpg')
        self.assertFalse(os.path.exists(os.path.join(self.fotos, 'sede-ejemplo-2.webp')))


class ImportarOferta(unittest.TestCase):
    """--biblioteca ofertas (22/11/2026), sobre una copia de lo que toca: la
    biblioteca de las ofertas, las imágenes empaquetadas, el JS de la web y los
    require de la app. Se ejecuta de verdad generar.mjs --indices."""
    SLUG = 'vivienda-schwarzer-weg-18-graz'

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix='probar-importar-oferta-')
        self.raiz = os.path.join(self.tmp, 'repo')
        self.trabajo = os.path.join(self.tmp, 'trabajo')
        for rel in ('rwadar-editorial-source/ofertas/fichas.json', 'rwadar-editorial-source/ofertas/fotos.json',
                    'rwadar-site/assets/rwadar-20260820.js', 'rwadar-movil/fixtures/imagenes-editoriales.js'):
            os.makedirs(os.path.dirname(os.path.join(self.raiz, rel)), exist_ok=True)
            shutil.copy(os.path.join(RAIZ, rel), os.path.join(self.raiz, rel))
        for rel in ('rwadar-editorial-source/ofertas/fotos', 'rwadar-movil/assets/ofertas-editoriales'):
            shutil.copytree(os.path.join(RAIZ, rel), os.path.join(self.raiz, rel))
        self.spec = os.path.join(self.raiz, 'rwadar-editorial-source', 'ofertas', 'fotos.json')
        self.activos = os.path.join(self.raiz, 'rwadar-movil', 'assets', 'ofertas-editoriales')
        self.antes = {rel: leer(os.path.join(self.raiz, rel)) for rel in (
            'rwadar-editorial-source/ofertas/fotos.json', 'rwadar-movil/assets/ofertas-editoriales/manifest.json',
            'rwadar-site/assets/rwadar-20260820.js', 'rwadar-movil/fixtures/imagenes-editoriales.js')}
        self.bajadas = []
        self._pedir, self._bajar, self._pausa = imp.pedir_json, imp.descargar, imp.PAUSA_S
        imp.PAUSA_S = 0

    def tearDown(self):
        imp.pedir_json, imp.descargar, imp.PAUSA_S = self._pedir, self._bajar, self._pausa
        shutil.rmtree(self.tmp, ignore_errors=True)

    def simular(self, resp, datos):
        imp.pedir_json = lambda url: resp
        def bajar(url, maximo=imp.MAX_BYTES_ORIGINAL):
            self.bajadas.append(url)
            return datos
        imp.descargar = bajar

    def importar(self, slug=SLUG, archivo='File:Graz Herrengasse.jpg', descripcion='La Herrengasse de Graz con sus fachadas antiguas y el tranvía',
                 que_muestra='lugar', lugar='Graz (Austria)', datos=None, resp=None, **kw):
        datos = datos or imagen(3000, 2000)
        self.simular(resp or respuesta(archivo, datos, 3000, 2000), datos)
        return imp.importar_oferta(slug, archivo, descripcion, que_muestra, lugar, kw.pop('encuadre', '50% 50%'), kw.pop('trabajo', self.trabajo),
                                   raiz=self.raiz, **kw)

    def node(self, guion, *args):
        return json.loads(subprocess.run(['node', '-e', guion, *args], capture_output=True, text=True, check=True).stdout)

    def sin_cambios(self):
        for rel, b in self.antes.items():
            with open(os.path.join(self.raiz, rel), 'rb') as f:
                self.assertEqual(f.read(), b, f'{rel} no cambia')
        self.assertFalse([n for n in os.listdir(self.activos) if n.startswith('foto-')], 'ni se escribe ninguna foto')

    def test_foto_del_lugar_con_su_pie_en_web_y_app(self):
        entrada, exportadas = self.importar(lugar_o_tema_en='Graz, Austria')
        self.assertEqual(self.bajadas[0].split('/')[-1][:7], '2400px-', 'la miniatura, como en las noticias')
        self.assertEqual((entrada['origen'], entrada['queMuestra'], entrada['lugarOTema'], entrada['lugarOTemaEn'], entrada['autor']),
                         ('foto', 'lugar', 'Graz (Austria)', 'Graz, Austria', 'Ana Ejemplo'))
        for campo in ('modelo', 'prompt', 'semilla', 'concepto', 'temas', 'variantes'):
            self.assertNotIn(campo, entrada)
        # Un solo WebP, el que publica la web y empaqueta la app: 960×660, sin metadatos.
        ruta = os.path.join(self.activos, f'foto-{self.SLUG}.webp')
        with open(ruta, 'rb') as f:
            b = f.read()
        self.assertLessEqual(len(b), imp.OFERTA_BYTES)
        with Image.open(io.BytesIO(b)) as im:
            self.assertEqual(im.size, (960, 660))
            self.assertFalse(im.info.get('exif') or im.info.get('icc_profile') or im.info.get('xmp'))
        self.assertEqual((entrada['bytes'], entrada['sha256']), (len(b), hashlib.sha256(b).hexdigest()))
        self.assertEqual([x[1:3] for x in exportadas], [(960, 660)])
        # La ilustración de IA de esa oferta deja de publicarse; su encargo sigue en «fotos».
        self.assertFalse(os.path.exists(os.path.join(self.activos, f'oferta-{self.SLUG}.webp')))
        with open(self.spec, encoding='utf-8') as f:
            nuevo = json.load(f)
        viejo = json.loads(self.antes['rwadar-editorial-source/ofertas/fotos.json'].decode('utf-8'))
        self.assertEqual(list(nuevo['reales']), [self.SLUG])
        self.assertIn(self.SLUG, nuevo['fotos'])
        del nuevo['reales'][self.SLUG]
        self.assertEqual(nuevo, viejo)
        # El manifiesto, la web y la app, reescritos y aceptados por los comprobadores de Node.
        r = self.node("const m=require(process.argv[1]),f=require(process.argv[2]),fs=require('fs');const a=m.cargarActivosEditoriales(process.argv[3]);"
                      "const e=a.manifiesto.fichas.find(x=>x.slug===process.argv[4]),k=a.fichas.find(x=>x.slug===process.argv[4]);"
                      "const js=fs.readFileSync(process.argv[3]+'/rwadar-site/assets/rwadar-20260820.js','utf8');"
                      "const app=fs.readFileSync(process.argv[3]+'/rwadar-movil/fixtures/imagenes-editoriales.js','utf8');"
                      "console.log(JSON.stringify({n:a.fichas.length,archivo:e.archivo,alt:e.alt,clase:k.clase,credito:e.credito,"
                      "es:f.pieFotoOferta(e,'es'),en:f.pieFotoOferta(e,'en').texto,nota:f.notaImagenesOfertas([e,a.fichas[0]]),"
                      "web:js.includes('\"src\":\"/ofertas-editoriales/foto-'+process.argv[4]+'.webp\"')&&js.includes('\"queMuestra\":\"lugar\"'),"
                      "app:app.includes(\"require('../assets/ofertas-editoriales/foto-\"+process.argv[4]+\".webp')\")&&!app.includes('oferta-'+process.argv[4]+'.webp')}))",
                      os.path.join(RAIZ, 'rwadar-ofertas-editoriales.js'), os.path.join(RAIZ, 'rwadar-movil', 'lib', 'fotos-ofertas.js'), self.raiz, self.SLUG)
        pagina, licencia = 'https://commons.wikimedia.org/wiki/File:Graz_Herrengasse.jpg', 'https://creativecommons.org/licenses/by-sa/4.0/'
        self.assertEqual((r['n'], r['archivo'], r['clase']), (22, f'foto-{self.SLUG}.webp', 'foto'))
        self.assertEqual(r['alt'], 'La Herrengasse de Graz con sus fachadas antiguas y el tranvía', 'el texto alternativo es la descripción')
        self.assertEqual(r['credito'], {'autor': 'Ana Ejemplo', 'licencia': 'CC BY-SA 4.0', 'licenciaUrl': licencia, 'sitio': 'Wikimedia Commons', 'pagina': pagina})
        self.assertEqual(r['es']['texto'], 'Foto real de Graz (Austria), no del activo · Ana Ejemplo · CC BY-SA 4.0 · Wikimedia Commons')
        self.assertEqual([p['enlace'] for p in r['es']['partes'] if p['enlace']], [licencia, pagina])
        self.assertEqual(r['en'], 'Real photo of Graz, Austria, not of the asset · Ana Ejemplo · CC BY-SA 4.0 · Wikimedia Commons')
        self.assertEqual(r['nota'], 'Fotos reales del lugar o del tema e imágenes ilustrativas: ninguna es foto del activo')
        self.assertTrue(r['web'] and r['app'])
        # Y la comprobación entera de generar.mjs (fotos.json, el archivo y su sha256) pasa sobre la copia.
        subprocess.run(['node', os.path.join(RAIZ, 'rwadar-editorial-source', 'ofertas', 'generar.mjs'), '--indices', f'--raiz={self.raiz}'],
                       capture_output=True, text=True, check=True)

    def test_foto_del_activo_en_dominio_publico_sin_autor(self):
        d = imagen(2400, 1650)
        resp = respuesta('File:Graz Herrengasse.jpg', d, 2400, 1650, licencia='pd', corta='Public domain')
        entrada, _ = self.importar(que_muestra='activo', lugar=None, datos=d, resp=resp)
        self.assertNotIn('lugarOTema', entrada)
        self.assertIsNone(entrada['autor'])
        r = self.node("const m=require(process.argv[1]),f=require(process.argv[2]);const e=m.cargarActivosEditoriales(process.argv[3]).manifiesto.fichas"
                      ".find(x=>x.slug===process.argv[4]);console.log(JSON.stringify([f.pieFotoOferta(e,'es').texto,f.pieFotoOferta(e,'en').texto]))",
                      os.path.join(RAIZ, 'rwadar-ofertas-editoriales.js'), os.path.join(RAIZ, 'rwadar-movil', 'lib', 'fotos-ofertas.js'), self.raiz, self.SLUG)
        self.assertEqual(r, ['Foto real del activo · Dominio público · Wikimedia Commons', 'Real photo of the asset · Public domain · Wikimedia Commons'])

    def rechaza(self, patron, **kw):
        with self.assertRaisesRegex(imp.Rechazo, patron):
            self.importar(**kw)
        self.sin_cambios()

    def test_rechazos(self):
        self.rechaza('no es una ficha', slug='no-existe')
        self.rechaza('no lleva --lugar-o-tema', que_muestra='activo')
        self.rechaza('lugar-o-tema', lugar=None)
        self.rechaza('--que-muestra', que_muestra='edificio')
        self.rechaza('promesas', descripcion='Un edificio con una rentabilidad del cinco por ciento')
        self.rechaza('promesas', lugar='Graz, desde 100 €')
        self.rechaza('promesas', descripcion='Una oportunidad en el centro de Graz')
        self.rechaza('al menos 960×660', datos=imagen(1000, 600), resp=respuesta('File:Graz Herrengasse.jpg', b'x', 1000, 600))
        self.rechaza('licencia no admitida', resp=respuesta('File:Graz Herrengasse.jpg', b'x', 3000, 2000, licencia='cc-by-nc-4.0', corta='CC BY-NC 4.0'))
        self.rechaza('fuera del repositorio', trabajo=os.path.join(self.raiz, 'descargas'))

    def test_sin_pisar_una_foto_real_ni_repetir_archivo(self):
        self.importar()
        with self.assertRaisesRegex(imp.Rechazo, 'ya tiene foto real'):
            self.importar()
        with self.assertRaisesRegex(imp.Rechazo, 'ya está en la biblioteca de ofertas'):
            self.importar(slug='vivienda-pluddemanngasse-101-graz', archivo='File:Graz_Herrengasse.jpg')
        self.assertFalse(os.path.exists(os.path.join(self.activos, 'foto-vivienda-pluddemanngasse-101-graz.webp')))

    def test_lo_prohibido_es_lo_del_modelo(self):
        modelo = subprocess.run(['node', '-e', 'console.log(require(process.argv[1]).PROHIBIDO.source)',
                                 os.path.join(RAIZ, 'rwadar-movil', 'lib', 'fotos-ofertas.js')], capture_output=True, text=True, check=True).stdout.strip()
        self.assertEqual(imp.PROHIBIDO_OFERTA.pattern, modelo)
        self.assertEqual((imp.OFERTA_ANCHO, imp.OFERTA_ALTO), (960, 660))


class Generales(unittest.TestCase):
    def test_agente_de_usuario_generico(self):
        visto = {}

        class Respuesta(io.BytesIO):
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def abrir(req, timeout=None):
            visto['agente'] = req.get_header('User-agent')
            return Respuesta(b'{"query": {"pages": []}}')
        original, pausa = imp.urllib.request.urlopen, imp.PAUSA_S
        imp.urllib.request.urlopen, imp.PAUSA_S = abrir, 0
        try:
            imp.pedir_json('https://commons.wikimedia.org/w/api.php?action=query')
        finally:
            imp.urllib.request.urlopen, imp.PAUSA_S = original, pausa
        self.assertEqual(visto['agente'], 'editorial-photo-import/1.0')
        self.assertGreaterEqual(imp.PAUSA_S, 1, 'una pausa entre peticiones')

    def test_si_commons_pide_calma_espera_y_reintenta(self):
        llamadas, esperas = [], []

        class Respuesta(io.BytesIO):
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def abrir(req, timeout=None):
            llamadas.append(req.full_url)
            if len(llamadas) == 1:
                raise imp.urllib.error.HTTPError(req.full_url, 429, 'Too Many Requests', {'Retry-After': '17'}, None)
            return Respuesta(b'{"ok": 1}')
        original, dormir, pausa = imp.urllib.request.urlopen, imp.time.sleep, imp.PAUSA_S
        imp.urllib.request.urlopen, imp.time.sleep, imp.PAUSA_S = abrir, esperas.append, 0
        try:
            self.assertEqual(imp.pedir_json('https://commons.wikimedia.org/w/api.php?action=query'), {'ok': 1})
        finally:
            imp.urllib.request.urlopen, imp.time.sleep, imp.PAUSA_S = original, dormir, pausa
        self.assertEqual((len(llamadas), esperas), (2, [17.0]))

    def test_recorte_3_2_con_el_encuadre(self):
        self.assertEqual(imp.recorte_3_2(3000, 1000, '0% 50%'), (0, 0, 1500, 1000))
        self.assertEqual(imp.recorte_3_2(3000, 1000, '100% 50%'), (1500, 0, 3000, 1000))
        self.assertEqual(imp.recorte_3_2(1200, 1200, '50% 0%'), (0, 0, 1200, 800))
        self.assertEqual(imp.recorte_3_2(1200, 1200, '50% 100%'), (0, 400, 1200, 1200))

    def test_texto_sin_html(self):
        self.assertEqual(imp.texto_sin_html('<span class="x">Foto de <b>Luis</b> &amp; Ana</span>\n'), 'Foto de Luis & Ana')

    def test_la_lista_de_licencias_es_la_del_modelo(self):
        modelo = json.loads(subprocess.run(['node', '-e', "const m=require(process.argv[1]);console.log(JSON.stringify(Object.fromEntries("
                                            "Object.entries(m.LICENCIAS_FOTO).map(([k,v])=>[k,{url:v.url,atribucion:v.atribucion}]))))",
                                            os.path.join(RAIZ, 'rwadar-movil', 'lib', 'noticias-sector.js')],
                                           capture_output=True, text=True, check=True).stdout)
        self.assertEqual({k: {'url': v[0], 'atribucion': v[1]} for k, v in imp.LICENCIAS.items()}, modelo)


if __name__ == '__main__':
    # Sin Pillow con WebP o sin node, la prueba falla (no se salta): en la CI
    # se instala Pillow (ci.yml) y probar-web.mjs comprueba que corrieron todas.
    if not CON_PILLOW or not CON_NODE:
        print('probar-importar-foto: falta ' + ('Pillow con WebP' if not CON_PILLOW else 'node') +
              ' (pip install Pillow): sin eso no se prueba el importador.', file=sys.stderr)
        sys.exit(1)
    programa = unittest.main(exit=False, verbosity=1)
    sys.exit(0 if programa.result.wasSuccessful() else 1)

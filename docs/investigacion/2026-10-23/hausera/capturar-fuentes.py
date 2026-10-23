"""Captura anónima y acotada de páginas públicas primarias, sin formularios."""
import concurrent.futures
import datetime
import hashlib
import gzip
import html.parser
import json
from pathlib import Path
import urllib.request

RAIZ = Path(__file__).resolve().parent
PAGINAS = {
    'portada': 'https://hausera.io/',
    'terminos': 'https://hausera.io/terms/',
    'cotizadas': 'https://hausera.io/mercado-secundario/',
    'faq': 'https://hausera.io/faq/',
    'como-invertir': 'https://hausera.io/como-invertir/',
    'ofertas': 'https://hausera.io/oportunidades/',
}

class Texto(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.omitir = 0; self.partes = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.omitir += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self.omitir: self.omitir -= 1
    def handle_data(self, data):
        dato = ' '.join(data.split())
        if not self.omitir and dato: self.partes.append(dato)

def capturar(par):
    nombre, url = par
    ahora = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'RWAdar-editorial/1.0 (public-source-review)'})
        with urllib.request.urlopen(req, timeout=25) as respuesta:
            datos = respuesta.read(8_000_001)
            if len(datos) > 8_000_000: raise ValueError('La página supera el límite de captura.')
            final = respuesta.url
            if not final.startswith('https://hausera.io/'): raise ValueError('Redirección fuera del origen esperado.')
            meta = {'url': url, 'urlFinal': final, 'http': respuesta.status,
                    'consultadaUtc': ahora, 'fechaDato': None,
                    'httpDate': respuesta.headers.get('Date'), 'httpLastModified': respuesta.headers.get('Last-Modified'),
                    'bytes': len(datos), 'sha256': hashlib.sha256(datos).hexdigest()}
        comprimida = gzip.compress(datos, mtime=0)
        (RAIZ / (nombre + '.html.gz')).write_bytes(comprimida)
        meta['copia'] = nombre + '.html.gz'
        meta['gzipBytes'] = len(comprimida)
        meta['gzipSha256'] = hashlib.sha256(comprimida).hexdigest()
        parser = Texto(); parser.feed(datos.decode('utf-8', errors='replace'))
        texto = '\n'.join(parser.partes) + '\n'
        (RAIZ / (nombre + '.txt')).write_text(texto, encoding='utf-8')
        meta['textoSha256'] = hashlib.sha256(texto.encode('utf-8')).hexdigest()
        return nombre, meta
    except Exception as error:
        return nombre, {'url': url, 'consultadaUtc': ahora, 'fechaDato': None, 'error': type(error).__name__ + ': ' + str(error)}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as grupo:
        fuentes = dict(grupo.map(capturar, PAGINAS.items()))
    (RAIZ / 'fuentes-manifiesto.json').write_text(json.dumps(fuentes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({n: {'http': m.get('http'), 'bytes': m.get('bytes'), 'error': m.get('error')} for n, m in fuentes.items()}))

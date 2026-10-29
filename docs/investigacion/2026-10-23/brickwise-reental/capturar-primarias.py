"""Read-only capture of the 34 assigned references; no publication or approval.

HTTP availability and extracted text never mean that legal review is complete.
"""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
import urllib.error
from pypdf import PdfReader

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[3]
OUT = BASE / 'fuentes'
CATALOG = ROOT / 'rwadar-app/data/verificaciones/2026-10-22-v2/escaparate-publicacion.json'
offers = json.loads(CATALOG.read_text(encoding='utf-8'))['ofertas']
inventory = [offer for offer in offers if offer.get('plataformaSlug') in ('brickwise','reental')]
assert len(inventory) == 34
(BASE / 'inventario-34.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
assets = json.loads((OUT / 'brickwise-assets-api-directa.json').read_text(encoding='utf-8'))
tasks = []
for asset in assets:
    if asset['id'] in ('AT0000A35A42','AT0000A3E842'):
        continue
    isin = asset['id']
    tasks.append(('contrato-' + isin + '.pdf',asset['investmentConditionsUrl']))
    # URL is derived from the official API's document template, not guessed
    # from an issuer name. A failed template fetch remains a recorded failure.
    basic = next(doc['template']['address'] for doc in asset['documents'] if doc['name'] == 'Basic Information')
    tasks.append(('kid-' + isin + '.pdf',basic.replace('$assetId',isin)))
for offer in inventory:
    if offer['plataformaSlug'] == 'reental':
        urls = [url for url in offer['fuentesActuales'] if 'www.reental.co/properties' in url]
        assert len(urls) == 1
        tasks.append((offer['slug'] + '.html',urls[0]))


def capture(task):
    name,url = task
    meta = {'url':url,'file':name,'reviewedInDepth':False,
            'consultedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        request = urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (RWAdar editorial public source verification)'})
        with urllib.request.urlopen(request,timeout=35) as response:
            raw = response.read(6 * 1024 * 1024 + 1)
            assert len(raw) <= 6 * 1024 * 1024
            meta.update(http=response.status,finalUrl=response.url,dateHeader=response.headers.get('Date'),
                        lastModified=response.headers.get('Last-Modified'),bytes=len(raw),
                        sha256=hashlib.sha256(raw).hexdigest())
        (OUT / name).write_bytes(raw)
        if name.endswith('.pdf'):
            assert raw.startswith(b'%PDF')
            reader = PdfReader(OUT / name)
            pages = ['\n\n=== PAGE ' + str(index+1) + ' ===\n\n' + (page.extract_text() or '')
                     for index,page in enumerate(reader.pages)]
            text = ''.join(pages)
            (OUT / (name + '.txt')).write_text(text,encoding='utf-8',newline='\n')
            meta.update(pages=len(pages),extractedCharacters=len(text),
                        extractedTextSha256=hashlib.sha256(text.encode()).hexdigest())
    except Exception as error:
        meta.update(error=type(error).__name__ + ': ' + str(error),
                    http=getattr(error,'code',meta.get('http')))
    (OUT / (name + '.meta.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
    return meta


with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(capture,tasks))
(BASE / 'inventario-consultas.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'captured':sum('error' not in item for item in results),'attempted':len(results),
                  'errors':[{'file':item['file'],'error':item['error']} for item in results if 'error' in item],
                  'automaticCaptureDoesNotEstablishDeepReview':True}))

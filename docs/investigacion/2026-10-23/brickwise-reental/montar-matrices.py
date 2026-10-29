"""Build an internal evidence inventory; never approve or renew an offer."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re

BASE = Path(__file__).resolve().parent
SOURCES = BASE / 'fuentes'
OUT = BASE / 'expedientes'
OUT.mkdir(exist_ok=True)
offers = json.loads((BASE / 'inventario-34.json').read_text(encoding='utf-8'))
assets = json.loads((SOURCES / 'brickwise-assets-api-directa.json').read_text(encoding='utf-8'))
ISINS = {'fotovoltaica-greenpoint':'AT0000A38J32','drautalresidenz-paternion':'AT0000A2YPQ0',
         'terreno-con-arrendamiento-billa':'AT0000A3SE89','vivienda-stallhofstra-e-28-gratwein':'AT0000A2WCD0',
         'fotovoltaica-cohotel':'AT0000A38J40','apartamento-vacacional-hinterstoder-50':'AT0000A31KP7',
         'vivienda-pluddemanngasse-101-graz':'AT0000A2RAH5','local-de-estanco-klagenfurt':'AT0000A2U5V3',
         'vivienda-schwarzer-weg-18-graz':'AT0000A2WCE8','vivienda-sonnleithnergasse-2-viena':'AT0000A2T4D7',
         'vivienda-pottendorfer-stra-e-62-wr-neustadt':'AT0000A324B4','randhartingergasse-9-viena':'AT0000A2ZT84'}


class OfficialHtml(HTMLParser):
    VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

    def __init__(self):
        super().__init__()
        self.root = {'tag':'ROOT','attrs':{},'children':[]}
        self.stack = [self.root]
        self.pdfs = []
        self.statuses = []

    def handle_starttag(self, tag, attrs):
        node = {'tag':tag,'attrs':dict(attrs),'children':[]}
        self.stack[-1]['children'].append(node)
        if tag == 'a' and '.pdf' in node['attrs'].get('href',''):
            self.pdfs.append(node['attrs']['href'])
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack)-1,0,-1):
            if self.stack[index]['tag'] == tag:
                self.stack = self.stack[:index]
                break

    @staticmethod
    def hidden(node):
        attrs = node['attrs']
        return ('w-condition-invisible' in attrs.get('class','') or
                'display:none' in attrs.get('style','').replace(' ','') or 'hidden' in attrs)

    def handle_data(self, value):
        self.stack[-1]['children'].append(value)
        if value.strip() in ('En explotación','En reforma','Financiado'):
            self.statuses.append({'label':value.strip(),'cmsHidden':any(self.hidden(n) for n in self.stack),
                                  'ancestorClasses':[n['attrs'].get('class','') for n in self.stack[-3:]]})

    def visible(self, node):
        if isinstance(node,str):
            return node + ' '
        if node['tag'] in ('script','style','noscript') or self.hidden(node):
            return ''
        return ''.join(self.visible(child) for child in node['children'])


reental_readings = []
for offer in offers:
    slug = offer['slug']
    data = {'slug':slug,'title':offer['titulo'],'provider':offer['plataformaSlug'],
            'existingCollection':offer['coleccion'],'previousVerificationDate':offer['verificadaEl'],
            'investigacionCompleta':False,'revisionIndependiente':False,'aprobacionPublicacion':False,
            'decision':'Conservar la referencia documental existente; no renovar toda su fecha ni sus cifras con esta captura',
            'newCandidate':False,'claims':[],'unresolved':[]}

    def claim(field, assertion, source, locator, data_date=None, scope='', status='evidencia_observada_sin_aprobacion'):
        data['claims'].append({'field':field,'assertion':assertion,'source':source,'locator':locator,
                               'dataDate':data_date or 'No consta','consultedOn':'2026-10-23',
                               'scopeAndConflicts':scope,'status':status})

    if offer['plataformaSlug'] == 'brickwise':
        isin = ISINS[slug]
        asset = next(a for a in assets if a['id'] == isin)
        data.update(isin=isin,apiObservation={key:asset.get(key) for key in ('title','stage','updatedAt',
                    'availableBricks','availableBricksSecondary','lowestOfferPrice','issuingSharePrice','rentalReturn')})
        assert (isin == 'AT0000A324B4' and 'Pottendorfer' in asset['title']) or (
                isin != 'AT0000A324B4'), 'Asset mapping differs'
        meta = json.loads((SOURCES / ('contrato-' + isin + '.pdf.meta.json')).read_text(encoding='utf-8'))
        kid_meta = json.loads((SOURCES / ('kid-' + isin + '.pdf.meta.json')).read_text(encoding='utf-8'))
        data['documents'] = [meta,kid_meta]
        assert isin in (SOURCES / ('contrato-' + isin + '.pdf.txt')).read_text(encoding='utf-8')
        assert isin in (SOURCES / ('kid-' + isin + '.pdf.txt')).read_text(encoding='utf-8')
        claim('identidad',asset['title'] + '; ISIN ' + isin,
              'https://api.app.brickwise.at/api/v2/assets','Objeto con id=' + isin,
              scope='Identificador cotejado con contrato y KID guardados; la API no prueba titularidad registral actual.')
        claim('estado_api',asset['stage'],'https://api.app.brickwise.at/api/v2/assets','stage; availableBricks',
              scope='stage y existencias son datos distintos; no prueba orden ejecutable. updatedAt=' + str(asset.get('updatedAt')))
        if asset.get('lowestOfferPrice') is not None:
            claim('precio_reventa_api',str(asset['lowestOfferPrice']) + ' EUR',
                  'https://api.app.brickwise.at/api/v2/assets','lowestOfferPrice',
                  scope='Precio mínimo publicado por la API; no es mínimo de inversión ni precio de una ejecución garantizada. Fecha del cálculo no indicada.')
        claim('minimo_euros','No renovado como mínimo actual de compra en reventa',asset['investmentConditionsUrl'],
              '§2.1 Mindestzeichnungsbetrag y fechas originales de suscripción',
              scope='Los importes contractuales históricos no equivalen automáticamente al mínimo actual de reventa.')
        claim('cuenta_espana','La FAQ admite cuentas de residentes en el EEE; oferta concreta desde España sin confirmar',
              'https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen',
              'Respuesta principal; condiciones particulares §4 y §13',
              scope='Abrir cuenta no prueba autorización para distribuir todos los productos ni supera KYC/idoneidad.')
        claim('coste_plataforma','1,5 % por transacción a comprador y vendedor',
              'https://cdn.brickwise.at/legal/Kosteninformationen_Brickwise.pdf','Página 1 Vermittlungsgebühr',
              scope='Documento servido con Last-Modified 01/04/2023. No sumar mecánicamente costes medios del producto ni sustituir el KID individual.')
        data['unresolved'] = ['Registro BaFin individual y alcance actual no acreditados con la mera declaración del intermediario.',
             'Revisar íntegramente las reglas particulares del KID/contrato, su versión y los conflictos entre ambos.',
             'No acreditados: vigencia efectiva de garantías registrales, comprador, precio de ejecución y admisión específica desde España.']
    else:
        name = slug + '.html'
        raw = (SOURCES / name).read_text(encoding='utf-8')
        meta = json.loads((SOURCES / (name + '.meta.json')).read_text(encoding='utf-8'))
        parser = OfficialHtml(); parser.feed(raw)
        text = re.sub(r'\s+',' ',parser.visible(parser.root)).strip()
        begin = text.find('Home Propiedades ')
        if begin >= 0:
            text = text[begin:]
        end = text.find('Real Estate Investing 3.0')
        if end >= 0:
            text = text[:end]
        price = re.search(r'Precio del Token\s+(\S+)\s+([€$])',text)
        reading = {'slug':slug,'source':meta['url'],'consultedAt':meta['consultedAt'],
                   'htmlSha256':meta['sha256'],'conditionalStatuses':parser.statuses,
                   'visibleProjectText':text,'pdfLinksDiscovered':list(dict.fromkeys(parser.pdfs)),
                   'priceReference':{'value':price[1],'currencySymbol':price[2]} if price else None,
                   'pdfContractsReadInFull':False}
        reental_readings.append(reading)
        data['primaryPage'] = meta
        data['pdfLinksDiscovered'] = reading['pdfLinksDiscovered']
        statuses = [item['label'] for item in parser.statuses if not item['cmsHidden']]
        if slug == 'reental-emision-primaria':
            data['notASpecificIssuance'] = True
            claim('alcance_pagina','Catálogo general; no identifica una emisión concreta abierta',meta['url'],
                  'Listado de oportunidades y filtros de varios proyectos',
                  scope='No sumar estados de diferentes tarjetas ni presentar sus filtros como estado de esta referencia genérica.')
        else:
            claim('estado_etiqueta_web',statuses,meta['url'],'Etiqueta CMS sin clase w-condition-invisible',
                  scope='La etiqueta del proyecto no acredita apertura de una emisión ni existencia de una orden P2P.')
        if price:
            claim('precio_token_referencia',price[1] + ' ' + price[2],meta['url'],
                  'Precio del Token; símbolos ocultos del CMS excluidos',
                  scope='Precio nominal o de referencia del proyecto. No es precio ejecutable ni mínimo de compra del mercado secundario.')
        claim('minimo_euros','No acreditado para una compra actual de esta referencia',meta['url'],
              'Precio del token; contrato específico pendiente',scope='La FAQ general habla de 100 euros/dólares. No convertir USD en EUR.')
        claim('espana','No confirmado por contrato específico ni por admisión de un comprador',
              'https://www.reental.co/faqs','Quién puede invertir; registro/KYC; documento específico',
              scope='La regla general de KYC/AML no es un pasaporte para todos los tokens.')
        claim('salida','La FAQ contempla venta directa a un tercero admitido por la plataforma',
              'https://www.reental.co/faqs','¿Puedo vender mi token?',
              scope='No garantiza comprador, plazo, liquidez ni precio. Deben leerse las restricciones del acuerdo específico.')
        data['unresolved'] = ['Leer los acuerdos, whitepaper y anexos de esta referencia y acreditar emisor/vehículo/registro y alcance.',
             'No renovadas rentabilidades: la página muestra proyecciones sin fecha suficiente del cálculo actual.',
             'Faltan costes, plazo de salida, restricciones de cesión y acceso español específicos; no completar con otra emisión.']
        if slug == 'reental-secundario-dania-beach-1':
            data['criticalAssetChangeRequiringConsent'] = True
            claim('sustitucion_activo','La descripción comunica sustitución del activo original DNB-1 por Austin 1 / AUS-1 el 15/04/2026, con ratificación expresa de cada inversor',
                  meta['url'],'Descripción, párrafos iniciales y Nota de Cumplimiento','2026-04-15',
                  scope='No es una sustitución que pueda asumirse aceptada por todos. Faltan adenda/contrato vigente y alcance del consentimiento; conservar antecedente histórico e indicar el cambio comunicado.')
        if slug == 'reental-secundario-rentas-2':
            claim('costes_declarados_pagina','La descripción indica 8 % de suscripción y estructuración; 1.000.000 EUR de oferta y 920.000 EUR netos a inversiones',
                  meta['url'],'Descripción: gastos de suscripción y estructuración',
                  scope='Declaración de la página, no tarifa universal de Reental. Falta cotejar PPM/acuerdo y base de cobro en una compra secundaria.')
        if slug == 'reental-emision-primaria':
            claim('conflicto_minimo_general','El listado anuncia inversión desde 500 EUR, mientras la FAQ general indica un token de 100 euros/dólares',
                  meta['url'],'Texto posterior al listado: oportunidades inmobiliarias desde 500 EUR',
                  scope='No resolver aplicando una cifra universal a todas las ofertas; comprobar contrato y canal de cada producto.')
    (OUT / (slug + '.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE / 'lectura-reental-22.json').write_text(json.dumps(reental_readings,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'internalCases':len(offers),'reentalPageCaptures':len(reental_readings),
                  'deepResearchComplete':0,'approvedForPublication':0,'remoteChanges':False}))

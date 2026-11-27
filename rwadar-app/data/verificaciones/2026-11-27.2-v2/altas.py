# Entrega 2026-11-27.2 · altas del suplemento de ofertas del 27/11/2026 (informe de investigación global), verificadas a
# mano el 27/11/2026: 6 ofertas y 3 plataformas nuevas, cada dato con la fuente primaria leída ese día como visitante
# (fuentes/lecturas-2026-11-27.json y sus copias, con los nombres de personas retirados).
#
# No entran (y por qué): renga n.º 4 (sorteo hasta el 01/12, antes de que caduque la ficha); KLDX/Synergy (sin prueba de
# tokenización por tramo; cierra el 30/11); WisdomTree (403); Caliber, TYTL, LynxCap, Nexis y GreatX (términos
# incompletos o sin identificar el activo); Global X 3416, Nomura Landport, Kenedix y ALTERNA residencias (para otro
# ciclo); Mesh SLVR y TGLD, STOKR, ODX y Bitfinex (productos sin términos comprobados hoy o solo de vigilancia).
#   python3 rwadar-app/data/verificaciones/2026-11-27.2-v2/altas.py
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
FECHA, FES = '2026-11-27', '27/11/2026'
EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.'
L = json.load(open(os.path.join(AQUI, 'fuentes/lecturas-2026-11-27.json')))
U = {k: v['url'] for k, v in L.items()}
FUERA_UE = 'No tiene folleto ni KID europeos y la CNMV no la supervisa: lo que ofrece se rige por la ley de su país.'

def fuente(fid, tipo, titulo):
    return {'id': fid, 'tipo': tipo, 'titulo': titulo, 'url': U[fid], 'primaria': True, 'consultadaEl': FECHA}
def campo(estado, detalle, *fids): return {'estado': estado, 'detalle': detalle, 'fuentes': list(fids)}
def alerta(codigo, detalle, *fids): return {'codigo': codigo, 'detalle': detalle, 'fuentes': list(fids)}

# ------------------------------------------------------------------ plataformas nuevas
PLATAFORMAS = [
  {'slug': 'hwk-1365', 'nombre': 'HWK 1365',
   'publica': {'categoria_slug': 'credito-privado', 'region_slug': 'union-europea', 'actor': 'Emisor', 'acceso': 'Minorista', 'ticket': 'Medio',
               'cadenas': 'Polygon', 'web': U['hwk-anleihe'],
               'aval': 'HWK 1365 SE, de Königsbronn (Alemania), es la sociedad de cartera de la fundición Hüttenwerke Königsbronn. Emite ella misma su bono tokenizado; no es una entidad financiera.',
               'nota': 'Empresa industrial alemana que se financia con un bono tokenizado en Polygon, suscrito solo en su propia plataforma.'},
   'fuentes': [fuente('hwk-anleihe', 'empresa', 'HWK 1365 · Die HWK 1365 Zukunftsanleihe'),
               fuente('hwk-wib', 'documento', 'HWK 1365 SE · Wertpapier-Informationsblatt (20/10/2026)')],
   'comprobaciones': {'hwk-anleihe': ['Holding der Hüttenwerke Königsbronn', 'DE000A5GS3Q2', 'Qualifiziert nachrangig, nicht besichert'],
                      'hwk-wib': ['Polygon Blockchain', 'Fortführung der Unternehmenstätigkeit ist']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web ofrece desde el 01/11/2026 un bono tokenizado de hasta 1.365.000 € y enlaza a su plataforma de suscripción.', 'hwk-anleihe'),
     'licenciaRegistro': campo('no_aplica_plataforma', 'Es una empresa industrial que emite su propio bono, no una entidad financiera. La BaFin no revisa el contenido de su hoja informativa y no hay folleto aprobado.', 'hwk-anleihe'),
     'acceso': campo('no_verificable', 'Se suscribe solo en línea en su plataforma; excluye a residentes fiscales en EE. UU. y Canadá y a países de la lista del GAFI. No dice si admite inversores de España.', 'hwk-anleihe', 'hwk-wib'),
     'alertasCriticas': [alerta('empresa_en_dificultades', 'El propio emisor dice que tiene pérdidas, falta de liquidez y que su continuidad no está asegurada: puede acabar en insolvencia.', 'hwk-wib')]}},
  {'slug': 'hsbc', 'nombre': 'HSBC',
   'publica': {'categoria_slug': 'tesoro-y-fondos', 'region_slug': 'asia-pacifico', 'actor': 'Emisor', 'acceso': 'Minorista', 'ticket': 'Bajo',
               'cadenas': 'No la publica', 'web': U['hsbc-classsd'],
               'aval': 'Banco internacional; en Hong Kong tokeniza y custodia con sus propios servicios una clase de un fondo de HSBC Asset Management.',
               'nota': 'En Hong Kong, su moneda estable HSBC RedCoin da acceso desde la app del banco a una clase tokenizada de su fondo monetario en dólares de Hong Kong.'},
   'fuentes': [fuente('hsbc-classsd', 'empresa', 'HSBC Hong Kong · «HSBC RedCoin expands into wealth with tokenised fund access» (19/11/2026)')],
   'comprobaciones': {'hsbc-classsd': ['tokenised unit class \\(Class SD\\)', 'Minimum subscription of HKD 100', 'Eligible customers']},
   'radar': {
     'estadoOperativo': campo('observada', 'HSBC anunció el 19/11/2026 que sus clientes elegibles ya pueden usar RedCoin en la app para comprar la clase SD tokenizada de su fondo monetario en HKD.', 'hsbc-classsd'),
     'licenciaRegistro': campo('no_verificable', 'El anuncio no da el registro del banco ni del fondo; no lo hemos comprobado en el supervisor de Hong Kong.', 'hsbc-classsd'),
     'acceso': campo('confirmado_condicionado', 'Solo clientes elegibles de HSBC en Hong Kong, desde la app del banco y con la cartera de RedCoin activada.', 'hsbc-classsd'),
     'alertasCriticas': [alerta('fuera_ue', 'Producto de Hong Kong para clientes de HSBC allí. ' + FUERA_UE, 'hsbc-classsd')]}},
  {'slug': 'daiwa-securities', 'nombre': 'Daiwa Securities',
   'publica': {'categoria_slug': 'inmobiliario', 'region_slug': 'asia-pacifico', 'actor': 'Marketplace', 'acceso': 'Minorista', 'ticket': 'Medio',
               'cadenas': 'No la publica', 'web': U['daiwa-mufg'],
               'aval': 'Casa de valores japonesa; es la entidad que coloca el MUFG Realty Token, con Mitsubishi UFJ Trust and Banking como fiduciario.',
               'nota': 'Vende en Japón valores inmobiliarios tokenizados (security tokens) desde 100.000 yenes, con solicitud en línea para sus clientes.'},
   'fuentes': [fuente('daiwa-mufg', 'empresa', 'Daiwa Securities · MUFG Realty Token (東京ガーデンテラス紀尾井町)')],
   'comprobaciones': {'daiwa-mufg': ['大和証券株式会社', '三菱ＵＦＪ信託銀行株式会社', '2026年12月1日（火）から2026年12月8日（火）まで']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web anuncia el MUFG Realty Token sobre oficinas del Tokyo Garden Terrace Kioicho, con solicitudes del 01/12 al 08/12/2026.', 'daiwa-mufg'),
     'licenciaRegistro': campo('no_verificable', 'Es una casa de valores japonesa; la página del producto no da su número de registro y no lo hemos comprobado.', 'daiwa-mufg'),
     'acceso': campo('confirmado_condicionado', 'Para clientes con cuenta en Daiwa Securities; la información y el folleto están en japonés.', 'daiwa-mufg'),
     'alertasCriticas': [alerta('fuera_ue', 'Producto japonés. ' + FUERA_UE, 'daiwa-mufg')]}},
]

# ------------------------------------------------------------------ ofertas
def aviso(t, tono='warn'): return {'texto': t, 'tono': tono, 'esAntiguedad': False, 'verificadaEl': FECHA}
def ref(etiqueta, valor, fid, fechaDato, alcance): return {'etiqueta': etiqueta, 'valor': valor, 'fechaDato': fechaDato, 'fechaConsulta': FECHA, 'fuente': U[fid], 'alcance': alcance}
def tr(fid, titulo): return {'titulo': titulo, 'url': U[fid]}
def crit(cumple, motivo, fid, titulo): return {'cumple': cumple, 'motivo': motivo, 'fuente': tr(fid, titulo), 'consultadaEl': FECHA}

TIPO_VALOR = {'tokinvest-lingote-plata-record'}
EU = {'DE'}

def oferta(slug, plataforma, nombre_plat, titulo, categoria, pais, moneda, coleccion, disponible, resumen, url_fid, rent, metricas, avisos, fuentes_fids,
           descripcion, caracteristicas, referencias, transparencia, editorial):
    return {'oferta': {'slug': slug, 'tipo': 'valor' if slug in TIPO_VALOR else 'rendimiento', 'titulo': titulo, 'plataformaSlug': plataforma, 'plataformaNombre': nombre_plat,
                       'categoria': categoria, 'pais': pais, 'resumen': resumen, 'url': U[url_fid], 'cta': 'Ver fuente', 'imagenAlt': titulo,
                       'verificadaEl': FECHA, 'vigenciaDias': 7, 'permanente': False, 'disponibleEs': disponible, 'eu': pais in EU,
                       'fueraLadrillo': categoria != 'Inmobiliario', 'puntuacion': None, 'rentabilidad': rent, 'precio': None,
                       'estadoRevision': 'actual' if coleccion == 'principales' else 'no_verificable',
                       'coleccion': coleccion, 'moneda': moneda, 'patrocinada': False, 'metricas': metricas,
                       'avisos': [aviso(EDITORIAL)] + [a if isinstance(a, dict) else aviso(a) for a in avisos], 'fuentesActuales': [U[f] for f in fuentes_fids]},
            'documentacion': {'revisadaEl': FECHA, 'descripcion': descripcion, 'fuentes': list(dict.fromkeys(U[f] for f in fuentes_fids)),
                              'caracteristicas': caracteristicas, 'referencias': referencias},
            'transparencia': {'verificadaEl': FECHA, 'anadidaEl': FECHA, **transparencia},
            'editorial': editorial}

TOKINVEST_SUP = lambda f: crit(False, 'La emite Tokinvest FZCO con su licencia de VARA (Dubái), no un supervisor de la UE; no está inscrita en la CNMV.', f, 'Tokinvest · ficha del producto')
TOKINVEST_DOC = lambda f: crit(False, 'No hay folleto ni KID europeos; los términos están en inglés en la web de Tokinvest.', f, 'Tokinvest · ficha del producto')

OFERTAS = [
  oferta('hwk-1365-zukunftsanleihe', 'hwk-1365', 'HWK 1365', 'HWK 1365: bono tokenizado 2026/2031 al 8 % fijo de un grupo siderúrgico alemán con pérdidas',
    'Crédito privado', 'DE', 'EUR', 'principales', None,
    'Bono subordinado y sin garantía de la sociedad que controla la fundición alemana Hüttenwerke Königsbronn: 8 % fijo anual, pago una vez al año y devolución al 100 % el 31/10/2031. Desde 1.000 €. El propio emisor avisa de que su continuidad no está asegurada.',
    'hwk-anleihe', {'mostrada': '8,00 %', 'literal': f'Interés fijo anual pagado una vez al año, según la ficha del emisor (consultada el {FES}). Es deuda subordinada de una empresa con pérdidas: si no puede pagar, puedes perderlo todo.'},
    [{'etiqueta': 'Mínimo', 'valor': '1.000 EUR, sin recargo'}, {'etiqueta': 'Emisor', 'valor': 'HWK 1365 SE (Königsbronn, Alemania)'},
     {'etiqueta': 'ISIN', 'valor': 'DE000A5GS3Q2 (token en Polygon; no es un criptovalor de la ley eWpG)'},
     {'etiqueta': 'Plazo', 'valor': '01/11/2026 a 31/10/2031; devolución al 100 %'},
     {'etiqueta': 'Importe', 'valor': 'Hasta 1.365.000 EUR; oferta hasta el 30/04/2027 como mucho'},
     {'etiqueta': 'Rango', 'valor': 'Subordinado y sin garantía'}],
    [aviso('El propio emisor dice que tiene pérdidas y falta de liquidez y que su continuidad no está asegurada: puede entrar en insolvencia y perderías todo.', 'stop'),
     'Es deuda subordinada y sin garantía: si quiebra, cobran antes todos los demás acreedores.',
     'No hay folleto aprobado y la BaFin no revisa el contenido de la hoja informativa.',
     'No cotiza y no se puede devolver antes: el dinero queda inmovilizado cinco años.',
     'Si en tres meses no se suscriben 100.000 €, la emisión no sigue y te devuelven el dinero sin intereses.',
     'Si pierdes el acceso a tu wallet, te costará ejercer tus derechos.'],
    ['hwk-anleihe', 'hwk-wib'],
    'Bono tokenizado 2026/2031 de HWK 1365 SE, sociedad de cartera de la fundición Hüttenwerke Königsbronn (Alemania). Paga un 8,00 % fijo anual, una vez al año, y devuelve el 100 % el 31/10/2031; desde 1.000 € y hasta 1.365.000 € en total, en oferta del 01/11/2026 al 30/04/2027 como mucho. Es subordinado y sin garantía, no cotiza y se suscribe solo en la plataforma del emisor. El dinero se destina a devolver un préstamo del grupo, a liquidez y a modernizar maquinaria. El emisor reconoce pérdidas en 2025 y 2026, falta de liquidez y que su continuidad no está asegurada.',
    [{'etiqueta': 'Proveedor', 'valor': 'HWK 1365 SE (emisión directa)'}, {'etiqueta': 'Emisor', 'valor': 'HWK 1365 SE, Königsbronn'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Un bono subordinado representado por un token en Polygon; no da propiedad de la empresa ni de sus máquinas'},
     {'etiqueta': 'Moneda', 'valor': 'EUR'}],
    [ref('Mínimo de inversión', 'Desde 1.000 €, sin recargo', 'hwk-anleihe', None, 'Ficha del bono en la web del emisor (Eckdaten).'),
     ref('Acceso desde España', 'Sin confirmar: no dice si admite España; excluye EE. UU., Canadá y países del GAFI', 'hwk-wib', None, 'Hoja informativa (WIB), condiciones de transmisión.'),
     ref('Salida', 'Al vencimiento (31/10/2031); no cotiza ni se puede devolver antes', 'hwk-anleihe', None, 'Ficha del bono: sin amortización ordinaria ni negociación en bolsa.'),
     ref('Rentabilidad publicada', '8,00 % fijo anual', 'hwk-anleihe', None, 'Interés fijo, pagado una vez al año.'),
     ref('Situación del emisor', 'Pérdidas en 2025 y previstas en 2026; continuidad no asegurada', 'hwk-wib', None, 'Hoja informativa (WIB), riesgos del emisor.')],
    {'supervisada': crit(False, 'La emite directamente una empresa industrial, no una entidad financiera; la BaFin no revisa el contenido de su hoja informativa.', 'hwk-anleihe', 'HWK 1365 · Die HWK 1365 Zukunftsanleihe'),
     'documentoEspana': crit(False, 'Solo hay una hoja informativa en alemán, sin folleto aprobado ni KID en castellano.', 'hwk-wib', 'HWK 1365 SE · Wertpapier-Informationsblatt'),
     'minimoCorto': '1.000 €', 'salidaCorta': 'Al vencimiento (2031)', 'puntos': []},
    {'escena': 'empresa', 'op': {'forma': 'nave'}, 'lugar': 'Königsbronn · Alemania', 'pasos': ['Suscribes el bono', 'Cobras el interés cada año', 'Recuperas el nominal en 2031'], 'concepto': 'una fundición alemana',
     'foto': {'semilla': 901, 'encuadre': '70% 55%', 'concepto': 'una nave de fundición antigua en un pueblo del sur de Alemania, no la de la empresa', 'prompt': 'old brick iron foundry hall with tall chimney in a small town in southern Germany, wooded hills behind, overcast morning'}}),

  oferta('tokinvest-lingote-plata-record', 'tokinvest', 'Tokinvest', 'El mayor lingote de plata del mundo, en tokens de un gramo (Tokinvest, Dubái)',
    'Materias primas', 'AE', 'AED', 'principales', None,
    'Un lingote de plata de 1.971 kg, récord Guinness, guardado por Brink’s en Dubái y dividido en 1.971.000 tokens de un gramo. Desde 1.000 tokens (1 kg); el precio sigue a la plata con una prima del 15 %. A los 10 años se vende el lingote.',
    'tokinvest-silver', None,
    [{'etiqueta': 'Mínimo', 'valor': '1.000 tokens (1 kg de plata)'}, {'etiqueta': 'Activo', 'valor': 'Un lingote de 1.971 kg (n.º A1126), custodiado por Brink’s en Dubái'},
     {'etiqueta': 'Precio', 'valor': 'Plata (Chainlink XAG/USD) más una prima del 15 %, en AED'},
     {'etiqueta': 'Plazo', 'valor': '10 años; después se vende el lingote'},
     {'etiqueta': 'Registro', 'valor': 'ARVA de Tokinvest FZCO, licencia de VARA VL/2024/12/004 (Dubái)'}],
    ['Pagas un 15 % más que el valor de la plata por ser una pieza única: si la plata no sube, pierdes.',
     'No hay reembolso: se recupera al venderse el lingote a los 10 años o vendiendo a otros inversores cuando abra el mercado de Tokinvest, que aún no está abierto.',
     'El token es un derecho económico sobre el lingote a través de un certificado de depósito, no plata que puedas recoger.',
     'Regulado en Dubái (VARA), no en la UE. ' + FUERA_UE,
     'No es para personas de EE. UU. y depende de tu país: compruébalo en Tokinvest.'],
    ['tokinvest-silver'],
    'Tokinvest ha tokenizado el mayor lingote de plata del mundo (1.971 kg, récord Guinness, n.º A1126, fabricado por SAM Precious Metals en Emiratos) en 1.971.000 tokens de un gramo. La titularidad se lleva con un certificado de depósito de DMCC Tradeflow mantenido en fideicomiso y el lingote lo guarda Brink’s en Dubái. El precio de emisión sigue a la plata más una prima del 15 %. La oferta está abierta desde el 07/09/2026; a los 10 años se vende el lingote. El token es un ARVA emitido por Tokinvest FZCO con licencia de VARA.',
    [{'etiqueta': 'Proveedor', 'valor': 'Tokinvest (Tokinvest FZCO)'}, {'etiqueta': 'Emisor', 'valor': 'Tokinvest FZCO (ARVA, licencia de VARA)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Un derecho económico sobre el lingote, por gramos; no la entrega de plata'},
     {'etiqueta': 'Moneda', 'valor': 'AED'}],
    [ref('Mínimo de inversión', 'Desde 1.000 tokens (1 kg de plata); el precio en AED sigue a la plata', 'tokinvest-silver', None, 'Ficha del lingote en la web de Tokinvest.'),
     ref('Acceso desde España', 'Sin confirmar: depende de tu país; no es para personas de EE. UU.', 'tokinvest-silver', None, 'Aviso de riesgos de la ficha.'),
     ref('Salida', 'Venta del lingote a los 10 años; antes, mercado entre inversores (aún sin abrir)', 'tokinvest-silver', None, 'Ficha: el mercado secundario abrirá después de la emisión inicial.')],
    {'supervisada': TOKINVEST_SUP('tokinvest-silver'), 'documentoEspana': TOKINVEST_DOC('tokinvest-silver'),
     'minimoCorto': '1 kg de plata', 'salidaCorta': 'Venta del lingote (10 años)', 'puntos': [{'texto': 'Lingote custodiado por Brink’s en Dubái', 'fuente': tr('tokinvest-silver', 'Tokinvest · lingote de plata récord')}]},
    {'escena': 'empresa', 'op': {'forma': 'nave'}, 'lugar': 'Dubái · Emiratos', 'pasos': ['Compras gramos del lingote', 'Brink’s lo guarda', 'Se vende a los 10 años'], 'concepto': 'un lingote de plata',
     'foto': {'semilla': 911, 'encuadre': '70% 55%', 'concepto': 'lingotes de plata lisos sobre una bandeja, no el lingote del producto', 'prompt': 'several plain shiny silver bullion bars without any engraving or markings resting on a dark grey tray, soft daylight, close-up'}}),

  oferta('tokinvest-great-hampton-street', 'tokinvest', 'Tokinvest', 'Great Hampton Street Works: 29 pisos alquilados en Birmingham, en tokens desde 100.000 AED',
    'Inmobiliario', 'GB', 'AED', 'principales', None,
    'Una antigua fábrica de botones protegida en el Jewellery Quarter de Birmingham, convertida en 29 pisos alquilados. Los tokens dan derecho a la renta neta y a la venta del edificio, prevista a los 10 años. Desde 100.000 AED; captación de 6,84 M£ con un mínimo de 5,2 M£ (todo o nada).',
    'tokinvest-hampton', None,
    [{'etiqueta': 'Mínimo', 'valor': '100.000 AED (1.000 tokens)'}, {'etiqueta': 'Inmueble', 'valor': '29 pisos alquilados, 80-82 Great Hampton Street, Birmingham'},
     {'etiqueta': 'Valoración', 'valor': '8,55 M£ con muebles (RICS, marzo de 2026)'},
     {'etiqueta': 'Captación', 'valor': '6,84 M£; mínimo 5,2 M£ o se devuelve el dinero; el dueño conserva el 20 %'},
     {'etiqueta': 'Cobro', 'valor': 'Renta mensual en AED, desde que se complete la captación'},
     {'etiqueta': 'Venta prevista', 'valor': '10 años después de completarse'}],
    ['Los tokens dan derecho a la renta neta y a lo que se obtenga al vender, no a la propiedad del edificio.',
     'Si no se llega a 5,2 M£, no se emiten tokens y te devuelven el dinero.',
     'No hay reembolso: hasta la venta solo puedes vender a otros inversores en Tokinvest, si hay comprador.',
     'Cobras en dirhams una renta de pisos en libras: hay riesgo de cambio.',
     'Regulado en Dubái (VARA), no en la UE. ' + FUERA_UE,
     'No es para personas de EE. UU. y depende de tu país: compruébalo en Tokinvest.'],
    ['tokinvest-hampton'],
    'Great Hampton Street Works es una antigua fábrica de botones de 1872, protegida, en el Jewellery Quarter de Birmingham, convertida en 29 pisos, todos alquilados. Su dueño conserva el 20 % y ofrece el resto en tokens desde 100.000 AED: capta 6,84 M£ con un mínimo de 5,2 M£ (si no se alcanza, se devuelve el dinero). Por un acuerdo de derechos económicos, los inversores cobran la renta neta cada mes en AED y su parte de la venta, prevista a los 10 años; no son dueños del edificio. Oferta abierta desde agosto de 2026; el token es un ARVA de Tokinvest FZCO con licencia de VARA.',
    [{'etiqueta': 'Proveedor', 'valor': 'Tokinvest (Tokinvest FZCO); distribuye también API Global'}, {'etiqueta': 'Emisor', 'valor': 'Tokinvest FZCO (ARVA, licencia de VARA)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Derechos económicos sobre la renta neta y la venta; no la propiedad del edificio'},
     {'etiqueta': 'Moneda', 'valor': 'AED'}],
    [ref('Mínimo de inversión', 'Desde 100.000 AED (1.000 tokens)', 'tokinvest-hampton', None, 'Ficha del edificio en la web de Tokinvest.'),
     ref('Acceso desde España', 'Sin confirmar: depende de tu país; no es para personas de EE. UU.', 'tokinvest-hampton', None, 'Aviso de riesgos de la ficha.'),
     ref('Salida', 'Venta del edificio a los 10 años; antes, venta a otros inversores en Tokinvest', 'tokinvest-hampton', None, 'Ficha: sin derecho de reembolso.')],
    {'supervisada': TOKINVEST_SUP('tokinvest-hampton'), 'documentoEspana': TOKINVEST_DOC('tokinvest-hampton'),
     'minimoCorto': '100.000 AED', 'salidaCorta': 'Venta del edificio (10 años)', 'puntos': [{'texto': 'Edificio terminado y alquilado entero', 'fuente': tr('tokinvest-hampton', 'Tokinvest · Great Hampton Street Works')}]},
    {'escena': 'edificio', 'op': {'pisos': 4, 'mat': 'ladrillo', 'semilla': 913}, 'lugar': 'Birmingham · Reino Unido', 'pasos': ['Compras tokens del edificio', 'Cobras la renta cada mes', 'Se vende a los 10 años'], 'concepto': 'una antigua fábrica convertida en pisos',
     'foto': {'semilla': 913, 'encuadre': '70% 55%', 'concepto': 'una antigua fábrica victoriana de ladrillo convertida en pisos en Birmingham, no la del producto', 'prompt': 'Victorian red-brick former factory converted into apartments on a quiet street in Birmingham, arched windows, overcast morning'}}),

  oferta('mesh-ccs-income-notes', 'mesh', 'Mesh', 'CCS: notas de crédito a pymes sudafricanas a tipo prime + 3 %, cupón mensual (Mesh)',
    'Crédito privado', 'ZA', 'ZAR', 'principales', None,
    'Notas a 5 años de Commercial Credit Solutions (CCS), que financia equipos de pymes sudafricanas: interés variable del tipo prime más 3 puntos, pagado cada mes, y capital al final. Oferta pública con folleto registrado, desde 5.000 rand, solo en Mesh.',
    'mesh-ccs', {'mostrada': 'Prime + 3 %', 'literal': f'Interés variable: el tipo prime de Sudáfrica más 3 puntos al año, pagado cada mes, según Mesh (consultado el {FES}). No es fijo ni está garantizado.'},
    [{'etiqueta': 'Mínimo', 'valor': '5.000 ZAR'}, {'etiqueta': 'Plazo', 'valor': '5 años y 1 día; capital al vencimiento'},
     {'etiqueta': 'Intereses', 'valor': 'Cada mes; tipo prime de Sudáfrica + 3 puntos'},
     {'etiqueta': 'Respaldo', 'valor': 'Contratos de financiación de equipos de pymes de CCS'},
     {'etiqueta': 'Registro', 'valor': 'Oferta pública con folleto registrado en la CIPC (Sudáfrica)'}],
    ['Es crédito a pequeñas empresas: si no pagan, puedes perder parte o todo.',
     'El interés cambia con el tipo prime sudafricano.',
     'Se invierte en rand: hay riesgo de cambio frente al euro.',
     'Vender antes depende de que haya comprador en el mercado de Mesh; la liquidez no está asegurada.',
     'Oferta sudafricana. ' + FUERA_UE,
     'Mesh pide verificar la identidad (FICA) y no publica qué países admite.'],
    ['mesh-ccs', 'mesh-ccs-faq'],
    'Notas a 5 años y 1 día de la plataforma de inversión de Commercial Credit Solutions (CCS), que financia equipos productivos de pymes sudafricanas: las empresas pagan una cuota mensual por el equipo y con ella se paga el interés, variable (tipo prime de Sudáfrica + 3 puntos al año) y mensual. El capital se devuelve al vencimiento. Es una oferta pública con folleto registrado en la CIPC, desde 5.000 rand, disponible solo en Mesh; después se pueden vender en su mercado secundario si hay comprador.',
    [{'etiqueta': 'Proveedor', 'valor': 'Mesh'}, {'etiqueta': 'Emisor', 'valor': 'CCS Investment Platform (Commercial Credit Solutions)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Notas de deuda respaldadas por contratos de financiación de equipos'},
     {'etiqueta': 'Moneda', 'valor': 'ZAR'}],
    [ref('Mínimo de inversión', 'Desde 5.000 ZAR', 'mesh-ccs', None, 'Términos clave en la ficha de Mesh.'),
     ref('Acceso desde España', 'Sin confirmar: Mesh no publica qué países admite', 'mesh-ccs-faq', None, 'Preguntas frecuentes: hace falta verificar la identidad (FICA).'),
     ref('Salida', 'Al vencimiento (5 años); antes, en el mercado de Mesh si hay comprador', 'mesh-ccs-faq', None, 'Preguntas frecuentes: el mercado secundario no tiene apoyo.'),
     ref('Rentabilidad publicada', 'Prime + 3 % anual, variable', 'mesh-ccs', None, 'Términos clave en la ficha de Mesh.')],
    {'supervisada': crit(False, 'Oferta pública sudafricana con folleto registrado en la CIPC; no la supervisa ningún organismo de la UE ni está inscrita en la CNMV.', 'mesh-ccs-faq', 'Mesh · CCS Income Notes FAQ'),
     'documentoEspana': crit(False, 'Folleto sudafricano en inglés; no hay folleto ni KID europeos.', 'mesh-ccs-faq', 'Mesh · CCS Income Notes FAQ'),
     'minimoCorto': '5.000 ZAR', 'salidaCorta': 'Al vencimiento (5 años)', 'puntos': [{'texto': 'Cupón mensual y folleto registrado', 'fuente': tr('mesh-ccs', 'Mesh · CCS')}]},
    {'escena': 'cartera_credito', 'lugar': 'Sudáfrica', 'pasos': ['Compras las notas', 'Las pymes pagan sus equipos', 'Cobras interés cada mes'], 'concepto': 'equipos de pequeñas empresas',
     'foto': {'semilla': 917, 'encuadre': '70% 55%', 'concepto': 'un taller con maquinaria de una pequeña empresa sudafricana, no las de CCS', 'prompt': 'small engineering workshop with lathes and workbenches in Johannesburg, empty, morning daylight through large windows'}}),

  oferta('hsbc-hkd-money-fund-class-sd', 'hsbc', 'HSBC', 'HSBC: clase tokenizada de su fondo monetario en dólares de Hong Kong, desde 100 HKD',
    'Tesoro y fondos', 'HK', 'HKD', 'principales', False,
    'Clase SD, tokenizada, del fondo monetario HSBC Global Money Funds – Hong Kong Dollar. Desde el 19/11/2026, los clientes elegibles de HSBC en Hong Kong la compran desde 100 HKD en la app del banco con su moneda estable HSBC RedCoin.',
    'hsbc-classsd', None,
    [{'etiqueta': 'Mínimo', 'valor': '100 HKD (se paga con 100 RCHKD)'}, {'etiqueta': 'Fondo', 'valor': 'HSBC Global Money Funds – Hong Kong Dollar (desde 1991), de HSBC Asset Management'},
     {'etiqueta': 'Clase', 'valor': 'SD, tokenizada, en dólares de Hong Kong'},
     {'etiqueta': 'Cómo se compra', 'valor': 'App de HSBC en Hong Kong, con la moneda estable HSBC RedCoin'},
     {'etiqueta': 'Lanzamiento', 'valor': '19/11/2026'}],
    ['Solo para clientes elegibles de HSBC en Hong Kong con la cartera de RedCoin activada en la app.',
     'Un fondo monetario no es un depósito: su valor y sus dividendos pueden variar y no están garantizados.',
     'La tokenización añade riesgos técnicos y de custodia; en el peor caso, según HSBC, se puede perder todo.',
     'Fondo de Hong Kong. ' + FUERA_UE],
    ['hsbc-classsd'],
    'HSBC ha lanzado en Hong Kong una clase tokenizada (SD) de su fondo monetario HSBC Global Money Funds – Hong Kong Dollar, que gestiona HSBC Asset Management desde 1991. Los clientes elegibles la compran desde 100 HKD en la app del banco, pagando con su moneda estable HSBC RedCoin (RCHKD), que no da intereses. HSBC tokeniza la clase y la custodia con sus propios servicios. El fondo reparte dividendos, que pueden variar.',
    [{'etiqueta': 'Proveedor', 'valor': 'HSBC (Hong Kong)'}, {'etiqueta': 'Emisor', 'valor': 'HSBC Global Money Funds – Hong Kong Dollar (HSBC Asset Management)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Participaciones tokenizadas de la clase SD del fondo'},
     {'etiqueta': 'Moneda', 'valor': 'HKD'}],
    [ref('Mínimo de inversión', 'Desde 100 HKD (se paga con 100 RCHKD)', 'hsbc-classsd', None, 'Anuncio de HSBC del 19/11/2026.'),
     ref('Acceso desde España', 'No disponible: solo clientes de HSBC en Hong Kong', 'hsbc-classsd', None, 'Anuncio: clientes elegibles, desde la app de HSBC en Hong Kong.'),
     ref('Reembolso', 'Según el folleto del fondo, en la app de HSBC; el anuncio no da plazos', 'hsbc-classsd', None, 'Anuncio: los documentos del fondo están en la app y en la web de HSBC.')],
    {'supervisada': crit(False, 'Fondo y banco de Hong Kong; no está autorizado por un supervisor de la UE ni inscrito en la CNMV.', 'hsbc-classsd', 'HSBC · anuncio del 19/11/2026'),
     'documentoEspana': crit(False, 'No hay KID europeo; los documentos del fondo son de Hong Kong.', 'hsbc-classsd', 'HSBC · anuncio del 19/11/2026'),
     'minimoCorto': '100 HKD', 'salidaCorta': 'Según el folleto del fondo', 'puntos': [{'texto': 'Fondo monetario de 1991, ahora con clase tokenizada', 'fuente': tr('hsbc-classsd', 'HSBC · anuncio del 19/11/2026')}]},
    {'escena': 'tesoro', 'lugar': 'Hong Kong', 'pasos': ['Pagas con RedCoin en la app', 'El fondo invierte a corto plazo', 'Reembolsas en la app'], 'concepto': 'el distrito financiero de Hong Kong',
     'foto': {'semilla': 919, 'encuadre': '70% 50%', 'concepto': 'rascacielos del distrito Central de Hong Kong vistos desde arriba, no la sede del banco', 'prompt': 'aerial view over the skyscrapers of Central district in Hong Kong in morning haze, green hills behind'}}),

  oferta('mufg-realty-token-kioicho', 'daiwa-securities', 'Daiwa Securities', 'MUFG Realty Token: oficinas del Tokyo Garden Terrace Kioicho, solicitudes del 1 al 8 de diciembre',
    'Inmobiliario', 'JP', 'JPY', 'en_camino', None,
    'Valores tokenizados sobre las plantas de oficinas de un rascacielos de 2016 en Kioicho (Tokio). Se solicitan del 01/12 al 08/12/2026 en Daiwa Securities, desde 100.000 yenes, para unos 5 años y 2 meses.',
    'daiwa-mufg', None,
    [{'etiqueta': 'Solicitudes', 'valor': 'Del 01/12 al 08/12/2026 (en línea, del 01/12 a las 6:00 al 03/12 a las 12:00, hora de Japón)'},
     {'etiqueta': 'Mínimo', 'valor': '100.000 JPY (1 unidad)'}, {'etiqueta': 'Unidades', 'valor': '341.000'},
     {'etiqueta': 'Plazo', 'valor': 'Unos 5 años y 2 meses; puede venderse antes o alargarse'},
     {'etiqueta': 'Reparto previsto', 'valor': '1,5 % y 3,4 % anual antes de impuestos en los dos primeros periodos, con devolución de capital incluida; no garantizado'},
     {'etiqueta': 'Fiduciario', 'valor': 'Mitsubishi UFJ Trust and Banking'}],
    ['Aún no se puede solicitar: las solicitudes abren el 01/12/2026.',
     'Para clientes de Daiwa Securities; la información y el folleto están en japonés.',
     'El reparto previsto no está garantizado y los dos primeros incluyen devolución de capital.',
     'Puede venderse antes de tiempo o alargarse el plazo; venderlo tú antes no es fácil.',
     'Producto japonés. ' + FUERA_UE],
    ['daiwa-mufg'],
    'MUFG Realty Token sobre las plantas de oficinas del Tokyo Garden Terrace Kioicho, un complejo de 2016 junto a la estación de Nagatacho (Tokio); la parte en la que se invierte estaba tasada en 105.000 millones de yenes el 30/09/2026. Son derechos de beneficiario de un fideicomiso (fiduciario: Mitsubishi UFJ Trust and Banking) registrados en blockchain. Los vende Daiwa Securities: 341.000 unidades de 100.000 yenes, con solicitudes del 01/12 al 08/12/2026, pago el 09/12 y entrega el 10/12. Plazo de unos 5 años y 2 meses; el reparto previsto de los dos primeros periodos incluye devolución de capital.',
    [{'etiqueta': 'Proveedor', 'valor': 'Daiwa Securities (colocador)'}, {'etiqueta': 'Emisor', 'valor': 'Fideicomiso con Mitsubishi UFJ Trust and Banking como fiduciario'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Derechos de beneficiario de un fideicomiso inmobiliario, en forma de security token'},
     {'etiqueta': 'Moneda', 'valor': 'JPY'}],
    [ref('Mínimo de inversión', 'Desde 100.000 JPY (1 unidad)', 'daiwa-mufg', None, 'Condiciones de la oferta en la web de Daiwa.'),
     ref('Acceso desde España', 'Sin confirmar: se contrata con una cuenta de Daiwa Securities, en japonés', 'daiwa-mufg', None, 'Web del producto: apertura de cuenta y solicitud en línea.'),
     ref('Salida', 'Al venderse el inmueble (unos 5 años y 2 meses); antes, venta limitada', 'daiwa-mufg', None, 'Web del producto: riesgos de liquidez y de venta anticipada o prórroga.')],
    {'supervisada': crit(False, 'Lo coloca una casa de valores japonesa; no está autorizado por un supervisor de la UE ni inscrito en la CNMV.', 'daiwa-mufg', 'Daiwa Securities · MUFG Realty Token'),
     'documentoEspana': crit(False, 'Folleto japonés; no hay folleto ni KID europeos.', 'daiwa-mufg', 'Daiwa Securities · MUFG Realty Token'),
     'minimoCorto': '100.000 JPY', 'salidaCorta': 'Venta del inmueble (~5 años)', 'puntos': []},
    {'escena': 'empresa', 'op': {'forma': 'torre'}, 'lugar': 'Tokio · Japón', 'pasos': ['Pides del 1 al 8 de diciembre', 'Cobras el reparto cada semestre', 'Se vende el inmueble al final'], 'concepto': 'oficinas en Tokio',
     'foto': {'semilla': 923, 'encuadre': '70% 55%', 'concepto': 'torres de oficinas junto a un foso arbolado de Tokio, no el edificio del producto', 'prompt': 'modern office towers beside a tree-lined moat in central Tokyo, autumn leaves, calm water, clear morning'}}),
]

if __name__ == '__main__':
    plano = lambda t: re.sub(r'\s+', ' ', t)
    fallos = []
    for p in PLATAFORMAS:
        for fid, pats in p['comprobaciones'].items():
            texto = plano(open(os.path.join(AQUI, L[fid]['archivo']), encoding='utf-8').read())
            for pat in pats:
                if not re.search(pat, texto, re.I): fallos.append(f"{p['slug']}/{fid}: /{pat}/")
    if fallos: raise SystemExit('No aparecen en la copia de hoy:\n' + '\n'.join(fallos))
    for o in OFERTAS:
        for r in o['documentacion']['referencias']:
            assert r['fuente'] in o['documentacion']['fuentes'], (o['oferta']['slug'], r['etiqueta'])
            if r['etiqueta'] in ('Mínimo de inversión', 'Acceso desde España', 'Salida', 'Reembolso'):
                assert len(r['valor']) <= 120, (o['oferta']['slug'], r['etiqueta'], len(r['valor']))
        assert len(o['transparencia']['minimoCorto']) <= 40, o['oferta']['slug']
        assert all(len(x) <= 32 for x in o['editorial']['pasos']), (o['oferta']['slug'], [len(x) for x in o['editorial']['pasos']])
    json.dump({'fecha': FECHA, 'regiones': [], 'plataformas': PLATAFORMAS, 'ofertas': OFERTAS}, open(os.path.join(AQUI, 'altas.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(PLATAFORMAS), 'plataformas ·', len(OFERTAS), 'ofertas')

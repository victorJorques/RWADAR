# Ciclo del catálogo 2026-11-26 (sin agentes: lo monta y lo revisa una sola sesión, por orden de la dirección).
# Escribe, a partir de la entrega publicada 2026-11-21 y de lo leído hoy como visitante:
#   - expedientes/<slug>.json (uno por oferta publicada, con las consultas de hoy y la propuesta de tarjeta),
#   - decisiones.json (lo que cambia, cada cambio con su prueba) y DECISIONES-COORDINADOR.md (la lista cerrada).
# Lo leído hoy: vigia.json (vigía, 18:17 UTC), fuentes/releidas-2026-11-26.txt (cada fuente de las fichas, releída con
# petición normal entre las 18:18 y las 18:40 UTC; copias en bruto fuera de Git) y las copias de fuentes/.
# Regla: un dato con fecha solo se re-fecha si su fuente se leyó hoy (vigía o lista de releídas, HTTP 200). Lo que no
# se pudo leer hoy se queda como estaba y se anota en DECISIONES-COORDINADOR.md §4.
#   python3 rwadar-app/data/verificaciones/2026-11-26-v2/montar.py
import copy, hashlib, json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
R = os.path.abspath(os.path.join(AQUI, '../../../..'))
P = os.path.join(R, 'rwadar-app/data/verificaciones/2026-11-21-v2')
FECHA, FES, CORTA = '2026-11-26', '26/11/2026', '26/11'
PFECHA, PFES, PCORTA = '2026-11-21', '21/11/2026', '21/11'
EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.'
CANONICA = re.compile(r'^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$')

leer = lambda p: json.load(open(p, encoding='utf-8'))
def escribir(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, indent=2) + '\n')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

ESC = leer(os.path.join(P, 'escaparate-publicacion.json'))
DOC = leer(os.path.join(P, 'documentacion-ofertas.json'))
D21 = leer(os.path.join(P, 'decisiones.json'))
V = leer(os.path.join(AQUI, 'vigia.json'))
IDX_ARCH = 'fuentes/releidas-2026-11-26.txt'
IDX = {}
for l in open(os.path.join(AQUI, IDX_ARCH), encoding='utf-8').read().splitlines()[1:]:
    hora, _, http, _, sh, tam, url = l.split(' ', 6)
    IDX[url] = {'hora': hora, 'http': int(http) if http.isdigit() else None, 'sha': sh, 'tam': int(tam) if tam.isdigit() else 0, 'linea': l}
VIG = {f['url']: f for f in V['fuentes'] if f.get('http') == 200}
SHA_VIGIA, SHA_IDX = sha(os.path.join(AQUI, 'vigia.json')), sha(os.path.join(AQUI, IDX_ARCH))
INICIO, FIN = '2026-11-26T18:16:23Z', '2026-11-26T18:44:00Z'

def leida(url):
    """(hora, via) si la fuente se leyó hoy como visitante con respuesta útil; None si no."""
    if not url: return None
    if url in VIG: return (VIG[url]['horaUtc'], 'vigia')
    x = IDX.get(url)
    if x and x['http'] == 200 and x['tam'] > 40: return (x['hora'], 'releida')
    return None

def prueba_fuente(url, literal):
    l = leida(url)
    assert l, f'sin lectura de hoy: {url}'
    if l[1] == 'vigia':
        return {'url': url, 'hora': l[0], 'literal': literal[:400], 'copia': {'archivo': 'vigia.json', 'sha256': SHA_VIGIA, 'contiene': [url]}}
    return {'url': url, 'hora': l[0], 'literal': literal[:400], 'copia': {'archivo': IDX_ARCH, 'sha256': SHA_IDX, 'contiene': [IDX[url]['linea']]}}

def prueba_vigia(slug, campo):
    c = next(x for x in V['fichas'][slug]['cifras'] if x['campo'] == campo)
    return c, {'url': c['fuente'], 'hora': c['horaUtc'], 'literal': f"{campo}: {c['hoy']}"[:400],
               'copia': {'archivo': 'vigia.json', 'sha256': SHA_VIGIA, 'contiene': [f'"hoy": "{c["hoy"]}"']}}

def prueba_copia(archivo, url, hora, literal, contiene):
    return {'url': url, 'hora': hora, 'literal': literal[:400], 'copia': {'archivo': archivo, 'sha256': sha(os.path.join(AQUI, archivo)), 'contiene': contiene}}

def rd(t):
    """Re-fecha la fecha de consulta del 21/11 (no las fechas de hechos, que se tratan aparte)."""
    if not isinstance(t, str): return t
    return (t.replace(PFES, FES).replace(f'({PCORTA})', f'({CORTA})').replace(PFECHA, FECHA)
             .replace('(17:41–17:42 UTC)', '(18:17 UTC)'))

# ------------------------------------------------------------------ cambios
CAMBIOS = {}      # slug -> [cambio]
LISTA = []        # líneas de DECISIONES-COORDINADOR.md §2
NO_RELEIDAS = []  # (slug, etiqueta, fuente)
def anota(slug, c, base, permite=False):
    lst = CAMBIOS.setdefault(slug, [])
    clave = f'[{slug} · {len(lst) + 1}]'
    if c['tipo'] in ('referencia', 'metrica', 'tarjeta', 'aviso', 'resumen', 'rentabilidad'):
        antes = c.get('antes'); despues = c.get('despues')
        txt = f"{clave} {c['tipo']} «{c.get('etiqueta', '')}»: «{antes if not isinstance(antes, dict) else antes.get('mostrada')}» → «{despues if not isinstance(despues, dict) else (despues.get('valor') or despues.get('mostrada') or despues.get('etiqueta') or 'fecha de consulta de hoy')}». {base}"
    else:
        txt = f"{clave} {c['tipo']}: {base}"
    LISTA.append((slug, txt.replace('\n', ' ')))
    pr = c.get('prueba', [])
    c['prueba'] = (pr if isinstance(pr, list) else [pr]) + [{'documento': 'DECISIONES-COORDINADOR.md', 'contiene': clave}]
    if permite: c['permiteFechaPrevia'] = True
    lst.append(c)

def ofer(slug): return next(o for o in ESC['ofertas'] if o['slug'] == slug)
def ref(slug, etiqueta, valor=None):
    rs = [r for r in DOC[slug]['referencias'] if r['etiqueta'] == etiqueta and (valor is None or r['valor'] == valor)]
    assert len(rs) == 1, (slug, etiqueta, len(rs)); return rs[0]

TOCADAS = set()   # (slug, etiqueta, valor) de referencias tratadas a mano
def cambia_ref(slug, etiqueta, despues, prueba, base, antes=None, permite=False):
    r = ref(slug, etiqueta, antes)
    TOCADAS.add((slug, etiqueta, r['valor']))
    c = {'tipo': 'referencia', 'etiqueta': etiqueta, 'antes': r['valor'], 'despues': despues, 'prueba': prueba}
    anota(slug, c, base, permite)

def metrica(slug, etiqueta, despues, prueba, base, calculos=None):
    m = [x for x in ofer(slug)['metricas'] if x['etiqueta'] == etiqueta]; assert len(m) == 1, (slug, etiqueta)
    c = {'tipo': 'metrica', 'etiqueta': etiqueta, 'antes': m[0]['valor'], 'despues': despues, 'prueba': prueba}
    if calculos: c['calculos'] = calculos
    anota(slug, c, base)

def aviso(slug, antes, despues, prueba, base, permite=False):
    assert any(a['texto'] == antes for a in ofer(slug)['avisos']), (slug, antes)
    anota(slug, {'tipo': 'aviso', 'antes': antes, 'despues': despues, 'prueba': prueba}, base, permite)

def tarjeta(slug, etiqueta, despues, prueba, base, **extra):
    r = ref(slug, etiqueta)
    TOCADAS.add((slug, etiqueta, r['valor']))
    c = {'tipo': 'tarjeta', 'etiqueta': etiqueta, 'antes': r['valor'], 'despues': despues, 'prueba': prueba, **extra}
    anota(slug, c, base)

# ------------------------------------------------------------------ 1 · Brickwise (11 fichas de reventa)
BW = [o['slug'] for o in ESC['ofertas'] if o['plataformaSlug'] == 'brickwise']
PL = D21['plantillas']
PLANTILLAS = {k: rd(v) for k, v in PL.items()}
LIBRO_HOY = PLANTILLAS['LIBRO']
assert '(18:17 UTC)' in LIBRO_HOY and FES in LIBRO_HOY
def euros(x):  # «70,00 €» -> «70 €»; «68,80 €» igual
    return re.sub(r',00 €$', ' €', x)
for s in BW:
    cif = {c['campo']: c for c in V['fichas'][s]['cifras']}
    def hoy(campo):
        c = cif[campo]
        return c['hoy'] if c['estado'] == 'cambia' else None
    # Libro de órdenes: las cuatro referencias con la cifra de hoy (o la misma) y la fecha de hoy.
    for etq, campo, extra in [('Venta más barata', 'Venta más barata', ''), ('Orden de venta de menor importe', 'Orden de venta de menor importe', ' {{BW_MENOR}}'),
                              ('Participaciones en venta', 'Participaciones en venta', None), ('Mejor oferta de compra', 'Mejor oferta de compra', ' {{BW_COMPRA}}')]:
        e = f'{etq} · {PFES}'
        if not any(r['etiqueta'] == e for r in DOC[s]['referencias']): continue
        r = ref(s, e)
        nuevo = hoy(campo) or r['valor']
        c, pv = prueba_vigia(s, campo)
        alc = '{{BW_PARTICIPACIONES}}' if extra is None else '{{LIBRO}}' + extra
        desp = {'etiqueta': f'{etq} · {FES}', 'valor': nuevo, 'fechaDato': FECHA, 'fechaConsulta': FECHA, 'fuente': r['fuente'], 'alcance': alc}
        calc = None
        if campo == 'Orden de venta de menor importe':
            m = re.match(r'(\d+) participaci(?:ón|ones) a ([\d.,]+) € \(([\d.,]+) € con el 1,5 %\)', nuevo); assert m, nuevo
            calc = [{'tipo': 'comision', 'precio': m.group(2).replace(',00', ''), 'porcentaje': '1,5', 'resultado': m.group(3)}]
        TOCADAS.add((s, e, r['valor']))
        cc = {'tipo': 'referencia', 'etiqueta': e, 'antes': r['valor'], 'despues': desp, 'prueba': [pv]}
        if calc: cc['calculos'] = calc
        anota(s, cc, f"Libro de órdenes leído por el vigía a las {c['horaUtc'][11:19]} UTC: {c['hoy']} ({'cambia' if c['estado'] == 'cambia' else 'igual que el 21/11'}).",
              permite=PCORTA in nuevo or PFES in nuevo)
    # Tarjeta: mínimo de reventa con la venta más barata de hoy.
    m = ref(s, 'Mínimo de inversión')
    c, pv = prueba_vigia(s, 'Mínimo de la tarjeta (venta más barata)')
    precio = euros(c['hoy'])
    vmb = cif['Venta más barata']['hoy']
    cuantas = int(re.search(r'\((\d+) a ese precio', vmb).group(1))
    menor = cif['Orden de venta de menor importe']['hoy']
    nota_ant = m['alcance'].split('comprobado en la fuente el ' + PFES + '. ', 1)[1]
    nota = f"{{{{BW_MINIMO}}}} {cuantas} participaci{'ón' if cuantas == 1 else 'ones'} {{{{BW_MINIMO_FIN}}}}"
    mu = re.search(r' Una sola participación cuesta desde ([\d.,]+ €) \(([\d.,]+) € con el 1,5 %\)\.$', nota_ant)
    if mu:
        mm = re.match(r'1 participación a ([\d.,]+) € \(([\d.,]+) € con el 1,5 %\)', menor); assert mm, (s, menor)
        nota += f" Una sola participación cuesta desde {euros(mm.group(1) + ' €')} ({mm.group(2)} € con el 1,5 %)."
    tarjeta(s, 'Mínimo de inversión', f'Desde {precio} la participación en reventa ({CORTA})', [pv],
            f"Venta más barata de hoy según el vigía ({c['horaUtc'][11:19]} UTC): {c['hoy']}, {cuantas} a ese precio; orden de menor importe: {menor}.",
            fechaDato=FECHA, nota=nota)

# ------------------------------------------------------------------ 2 · Spiko
def spk(slug, rent_hoy, vl_dia, vl_valor, moneda, campo_rent, campo_vl):
    c_r, p_r = prueba_vigia(slug, campo_rent)
    c_v, p_v = prueba_vigia(slug, campo_vl)
    return c_r, p_r, c_v, p_v
# Letras Euro
s = 'spiko-letras-del-tesoro-euro'
c_r, p_r = prueba_vigia(s, 'Rentabilidad de la tarjeta (monthlyYield de EUTBL)')
c_v, p_v = prueba_vigia(s, 'Fecha del valor liquidativo (EUTBL)')
o = ofer(s)
anota(s, {'tipo': 'rentabilidad', 'antes': o['rentabilidad'], 'despues': {'mostrada': '2,44 %',
      'literal': f'Rendimiento neto anualizado de los últimos 31 días que publica Spiko con el valor liquidativo del {FES} (1,063785 €); consultado el {FES}. Variable y no garantizado.'},
      'prueba': [p_r, p_v]}, f"API pública de Spiko (vigía, {c_r['horaUtc'][11:19]} UTC): monthlyYield 0.0244; VL del 26/11/2026, 1,063785 €.")
metrica(s, 'Rentabilidad publicada · 31 días · 20/11/2026', {'etiqueta': f'Rentabilidad publicada · 31 días · {FES}', 'valor': '2,44 %'}, [p_r, p_v], 'La misma cifra que la rentabilidad, con la fecha del VL de hoy.')
r = ref(s, 'Rentabilidad publicada · 31 días'); TOCADAS.add((s, r['etiqueta'], r['valor']))
anota(s, {'tipo': 'referencia', 'etiqueta': r['etiqueta'], 'antes': r['valor'], 'despues': {'valor': '2,44 %', 'fechaDato': FECHA, 'fechaConsulta': FECHA,
      'alcance': f'Rendimiento neto anualizado de 31 días que publica Spiko con el valor liquidativo del {FES} (1,063785 €), consultado el {FES}. Variable y no garantizado.'},
      'prueba': [p_r, p_v]}, 'Referencia de la rentabilidad con la cifra y el VL de hoy.')
cambia_ref(s, f'Estado de la oferta · consulta {PFES}', {'etiqueta': f'Estado de la oferta · consulta {FES}', 'fechaDato': FECHA, 'fechaConsulta': FECHA,
           'alcance': f'GECO {FES}: vivo, todo tipo de suscriptores. El último valor liquidativo, del {FES} (1,063785 €), es el que publica Spiko en su API. No se ha hecho el alta. Localizador: ficha GECO del compartimento.'},
           [prueba_fuente('https://geco.amf-france.org/produit-d-epargne/c79399', 'Statut : Vivant · Type de souscripteurs : Tous souscripteurs'), p_v],
           'Ficha GECO del compartimento releída hoy (vivo, todo tipo de suscriptores) y VL de hoy de la API de Spiko.')
# Letras Dólar
s = 'spiko-letras-del-tesoro-dolar'
c_r, p_r = prueba_vigia(s, 'Rentabilidad de la tarjeta (monthlyYield de USTBL)')
c_v, p_v = prueba_vigia(s, 'Fecha del valor liquidativo (USTBL)')
o = ofer(s)
anota(s, {'tipo': 'rentabilidad', 'antes': o['rentabilidad'], 'despues': {'mostrada': '3,90 %',
      'literal': f'Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 25/11/2026 (VL del 25/11/2026); consultado el {FES}. No incluye la variación del euro frente al dólar. Variable y no garantizado.'},
      'prueba': [p_r, p_v]}, f"API pública de Spiko (vigía, {c_r['horaUtc'][11:19]} UTC): monthlyYield 0.039, publicado el 25/11/2026 16:47 UTC; VL del 25/11/2026, 1,10413 $.")
metrica(s, 'Rentabilidad publicada · 31 días · 20/11/2026 · en USD', {'etiqueta': 'Rentabilidad publicada · 31 días · 25/11/2026 · en USD', 'valor': '3,90 %'}, [p_r, p_v], 'La misma cifra que la rentabilidad, con la fecha del VL (25/11).')
r = ref(s, 'Rentabilidad publicada · 31 días'); TOCADAS.add((s, r['etiqueta'], r['valor']))
anota(s, {'tipo': 'referencia', 'etiqueta': r['etiqueta'], 'antes': r['valor'], 'despues': {'valor': '3,90 %', 'fechaDato': '2026-11-25', 'fechaConsulta': FECHA,
      'alcance': f'Rendimiento neto anualizado en dólares de 31 días que publica Spiko (valor liquidativo del 25/11/2026, 1,10413 $, consultado el {FES}). No incluye la variación del euro frente al dólar. Variable y no garantizado.'},
      'prueba': [p_r, p_v]}, 'Referencia de la rentabilidad con la cifra y el VL del 25/11.')
cambia_ref(s, f'Estado de la oferta · consulta {PFES}', {'etiqueta': f'Estado de la oferta · consulta {FES}', 'fechaDato': FECHA, 'fechaConsulta': FECHA,
           'alcance': f'GECO {FES}: vivo, todo tipo de suscriptores. El último valor liquidativo, del 25/11/2026 (1,10413 $), es el que publica Spiko en su API. Sin alta por nuestra parte. Localizador: ficha GECO del compartimento.'},
           [prueba_fuente('https://geco.amf-france.org/produit-d-epargne/c79398', 'Statut : Vivant · Type de souscripteurs : Tous souscripteurs'), p_v],
           'Ficha GECO del compartimento releída hoy y VL del 25/11 de la API de Spiko.')
# Smart Cash (Spiko Euro): misma cifra, VL de hoy.
s = 'spiko-smart-cash-euro'
c_r, p_r = prueba_vigia(s, 'Rentabilidad de la tarjeta (dailyYield de eurSAFO)')
c_v, p_v = prueba_vigia(s, 'Fecha del valor liquidativo (eurSAFO)')
o = ofer(s)
anota(s, {'tipo': 'rentabilidad', 'antes': o['rentabilidad'], 'despues': {'mostrada': '2,84 %',
      'literal': o['rentabilidad']['literal'].replace('20/11/2026 (consultado el 21/11/2026)', f'{FES} (consultado el {FES})')},
      'prueba': [p_r, p_v]}, f"API pública de Spiko (vigía, {c_r['horaUtc'][11:19]} UTC): dailyYield 0.0284, igual; VL del 26/11/2026, 1,018198 €.")
metrica(s, 'Rentabilidad publicada · neta y variable · 20/11/2026', {'etiqueta': f'Rentabilidad publicada · neta y variable · {FES}', 'valor': '2,84 %'}, [p_r, p_v], 'Misma cifra con la fecha del VL de hoy.')
r = ref(s, 'Rendimiento neto publicado'); TOCADAS.add((s, r['etiqueta'], r['valor']))
anota(s, {'tipo': 'referencia', 'etiqueta': r['etiqueta'], 'antes': r['valor'], 'despues': {'fechaDato': FECHA, 'fechaConsulta': FECHA,
      'alcance': r['alcance'].replace('20/11/2026 (consultado el 21/11/2026)', f'{FES} (consultado el {FES})')},
      'prueba': [p_r, p_v]}, 'Referencia del rendimiento con el VL de hoy (misma cifra).')

# ------------------------------------------------------------------ 3 · mTBILL (ronda 500 del 24/11)
s = 'mtbill'
c_v, p_v = prueba_vigia(s, 'Valor por token (oráculo del emisor)')
c_r, p_r = prueba_vigia(s, 'Rentabilidad pasada de 5 semanas (en USD)')
metrica(s, 'Valor por token · 20/11/2026', {'etiqueta': 'Valor por token · 24/11/2026', 'valor': '1,0791 USD (oráculo del emisor)'}, [p_v],
        f"Oráculo mTBILL/USD en Ethereum (vigía, {c_v['horaUtc'][11:19]} UTC): ronda 500, 107909649 (8 decimales), del 24/11/2026 14:27:23 UTC.")
metrica(s, 'Rentabilidad pasada · 5 semanas hasta el 20/11/2026 · en USD', {'etiqueta': 'Rentabilidad pasada · 5 semanas hasta el 24/11/2026 · en USD', 'valor': '3,42 % anual'}, [p_r, p_v],
        'Ronda 477 (20/10/2026 12:21:35 UTC, 1,07555721) → ronda 500 (24/11/2026 14:27:23 UTC, 1,07909649): 5 semanas, sin festivo en los extremos.',
        calculos=[{'tipo': 'anualSimple', 'desde': {'valor': '1.07555721', 'ts': 1792498895}, 'hasta': {'valor': '1.07909649', 'ts': 1795530443}, 'resultado': '3,42'}])
a = next(x['texto'] for x in ofer(s)['avisos'] if 'del 16/10 al 20/11/2026' in x['texto'])
aviso(s, a, a.replace('del 16/10 al 20/11/2026', 'del 20/10 al 24/11/2026'), [p_r], 'Ventana de la rentabilidad pasada de hoy (rondas 477 y 500).')

# ------------------------------------------------------------------ 4 · Suizas (Aktionariat, Boss Info, Switzerlend)
FINMA = 'https://www.finma.ch/en/finma-public/authorised-institutions-individuals-and-products/'
for s in ['aktionariat', 'boss-info', 'switzerlend']:
    m = next(x for x in ofer(s)['metricas'] if x['etiqueta'] == 'Supervisor')
    metrica(s, 'Supervisor', {'etiqueta': 'Supervisor', 'valor': m['valor'].replace(f'({PFES})', f'({FES})')},
            [prueba_fuente(next(c['fuentePrimaria'] for c in leer(os.path.join(P, 'expedientes', s + '.json'))['claims'] if c['campo'] == 'supervision'), 'not subject to prudential supervision')],
            'Sin cambios en la fuente de la supervisión, releída hoy.')
s = 'aktionariat'
c, pv = prueba_vigia(s, 'Precio del emisor (Brokerbot en cadena)')
metrica(s, f'Precio del emisor · {PFES}', {'etiqueta': f'Precio del emisor · {FES}', 'valor': '7,25 CHF por acción (fijo)'}, [pv], f"Brokerbot en cadena (vigía, {c['horaUtc'][11:19]} UTC): 7,25 CHF, igual.")
c, pv = prueba_vigia(s, 'Venta más barata entre accionistas')
TR_AKT = prueba_copia('fuentes/akt-getTrades-2026-11-26.json', 'https://shares.aktionariat.com/api/secondarymarkets/getTrades', '2026-11-26T18:35:26Z',
                      'última operación entre accionistas: 62 acciones a 5 ZCHF, 21/11/2026 08:02:23 UTC', ['"whenCreated":"2026-11-21T08:02:23Z","tradedShares":62'])
a = 'Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el 21/11/2026 la venta más barata era de 6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF.'
aviso(s, a, f'Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el {FES} la venta más barata era de 6,20 ZCHF; la última venta, del 21/11/2026, fue de 62 acciones a 5,00 ZCHF.',
      [pv, TR_AKT], f"Libro entre accionistas (vigía {c['horaUtc'][11:19]} UTC): 6,20 ZCHF × 356; sin operaciones nuevas desde el 21/11 (getTrades, 18:35:26 UTC).", permite=True)
cambia_ref(s, f'Última operación entre accionistas · {PFES}', {'etiqueta': f'Última operación entre accionistas · {FES}', 'fechaConsulta': FECHA}, [TR_AKT],
           'La última operación sigue siendo la del 21/11 (62 acciones a 5,00 ZCHF).', permite=True)
s = 'boss-info'
c, pv = prueba_vigia(s, 'Venta más barata entre accionistas')
a = next(x['texto'] for x in ofer(s)['avisos'] if PFES in x['texto'])
aviso(s, a, a.replace(PFES, FES), [pv], f"Libro entre accionistas (vigía {c['horaUtc'][11:19]} UTC): 8,40 ZCHF × 1103, igual.")
c, pv = prueba_vigia(s, 'Mínimo en cripto (2 acciones al precio del emisor)')
tarjeta(s, 'Mínimo de inversión', ref(s, 'Mínimo de inversión')['valor'].replace(f'precio a {PCORTA}', f'precio a {CORTA}'), [pv], f"Brokerbot (vigía {c['horaUtc'][11:19]} UTC): {c['hoy']}; transferencia desde 100 CHF, igual.", fechaDato=FECHA)
s = 'switzerlend'
c, pv = prueba_vigia(s, 'Fondos del emisor para recomprar')
a = next(x['texto'] for x in ofer(s)['avisos'] if 'recompra seguía desactivada' in x['texto'])
c2, pv2 = prueba_vigia(s, 'Recompra del emisor (Brokerbot en cadena)')
aviso(s, a, a.replace(PFES, FES), [pv, pv2], f"Brokerbot en cadena (vigía {c['horaUtc'][11:19]} UTC): recompra desactivada y 0,03 ZCHF, igual.")
c, pv = prueba_vigia(s, 'Venta más barata entre accionistas')
a = next(x['texto'] for x in ofer(s)['avisos'] if 'venta más barata 67,00 ZCHF' in x['texto'])
aviso(s, a, a.replace(PFES, FES), [pv], f"Libro entre accionistas (vigía {c['horaUtc'][11:19]} UTC): 67,00 ZCHF × 15, igual.")
c, pv = prueba_vigia(s, 'Precio del emisor (Brokerbot en cadena)')
tarjeta(s, 'Mínimo de inversión', f'1 acción (68,01 CHF el {CORTA}, precio del emisor)', [pv], f"Brokerbot en cadena (vigía {c['horaUtc'][11:19]} UTC): 68,01 CHF, igual.", fechaDato=FECHA)
LIBRO_LEND = prueba_copia('vigia.json', 'https://shares.lend.ch/api/secondarymarkets/getOrderBook', c['horaUtc'], 'libro entre accionistas de LENDS: sin órdenes de compra; ventas desde 67,00 ZCHF', ['https://shares.lend.ch/api/secondarymarkets/getOrderBook'])
cambia_ref(s, f'Salida · {PFES}', {'etiqueta': f'Salida · {FES}', 'valor': 'Sin órdenes de compra entre accionistas; la venta más barata pide 67,00 ZCHF', 'fechaDato': FECHA, 'fechaConsulta': FECHA,
           'fuente': 'https://shares.lend.ch/trade', 'alcance': f'Libro entre accionistas del portal leído el {FES} (18:17 UTC, datos que usa el portal): ninguna orden de compra; la orden de venta más barata, 15 acciones a 67,00 ZCHF. Cambia a diario.'},
           [LIBRO_LEND], 'El 21/11 había una compra a 59,00 ZCHF; hoy el libro no tiene ninguna orden de compra (bids vacíos, vigía 18:17 UTC).')

# ------------------------------------------------------------------ 5 · Hausera: Alicante 3 ya está financiada (sale en la entrega 2026-11-26.2)
s = 'hausera-proximas-ofertas'
o = ofer(s)
OP = prueba_fuente('https://hausera.io/oportunidades/', 'CRV · FINANCIADA · Alicante 3 · 5.196.000€')
anota(s, {'tipo': 'resumen', 'antes': o['resumen'], 'despues': f'Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 3, la última, ya figura como financiada ({FES}) y Hausera no anuncia otra operación.',
          'prueba': [OP]}, 'Hausera muestra hoy Alicante 3 como FINANCIADA (5.196.000 €) y las 15 operaciones de su lista como financiadas; ninguna en preventa ni abierta.')
metrica(s, 'Próxima operación', {'etiqueta': 'Próxima operación', 'valor': f'Ninguna anunciada: Alicante 3 figura como financiada el {FES}'}, [OP], 'Ninguna operación en preventa ni abierta en la lista de Hausera.')
a = next(x['texto'] for x in o['avisos'] if 'aún no estaba inscrita' in x['texto'])
aviso(s, a, 'El documento de emisión no es un folleto y la CNMV no lo ha revisado. Alicante 3 ya está financiada: no queda importe por suscribir.', [OP],
      'El aviso deja de hablar de la inscripción pendiente (la operación está cerrada).')
tarjeta(s, 'Mínimo de inversión', f'Sin operación abierta: Alicante 3 ya está financiada ({CORTA})', [OP], 'Mínimo de la tarjeta: no hay operación en la que invertir hoy.',
        fechaDato=FECHA, nota='Lista de operaciones de Hausera: Alicante 3 figura como financiada; no hay ninguna en preventa ni abierta.')

# ------------------------------------------------------------------ 6 · re-fechar el resto de referencias (fuente leída hoy)
for o in ESC['ofertas']:
    s = o['slug']
    for r in DOC[s]['referencias']:
        if CANONICA.match(r['etiqueta']) or (s, r['etiqueta'], r['valor']) in TOCADAS: continue
        if r['fechaConsulta'] != PFECHA: continue
        if s == 'hausera-proximas-ofertas':
            NO_RELEIDAS.append((s, r['etiqueta'], r['fuente'], 'sale en la entrega 2026-11-26.2')); continue
        l = leida(r['fuente'])
        if not l:
            NO_RELEIDAS.append((s, r['etiqueta'], r['fuente'], 'la fuente no se pudo leer hoy')); continue
        desp = {'fechaConsulta': FECHA}
        if rd(r['etiqueta']) != r['etiqueta']: desp['etiqueta'] = rd(r['etiqueta'])
        if rd(r['alcance']) != r['alcance']: desp['alcance'] = rd(r['alcance'])
        if r['fechaDato'] == PFECHA: desp['fechaDato'] = FECHA
        if PFES in r['valor'] or f'({PCORTA})' in r['valor']:
            NO_RELEIDAS.append((s, r['etiqueta'], r['fuente'], 'el valor lleva la fecha del 21/11: revisar a mano')); continue
        n = sum(1 for x in DOC[s]['referencias'] if x['etiqueta'] == r['etiqueta'] and x['valor'] == r['valor'])
        if n > 1:
            NO_RELEIDAS.append((s, r['etiqueta'], r['fuente'], 'referencia duplicada: el motor no la puede localizar')); continue
        TOCADAS.add((s, r['etiqueta'], r['valor']))
        anota(s, {'tipo': 'referencia', 'etiqueta': r['etiqueta'], 'antes': r['valor'], 'despues': desp, 'prueba': [prueba_fuente(r['fuente'], r['valor'][:200])]},
              f"Fuente releída hoy ({l[1]}, {l[0][11:19]} UTC); el dato no cambia, solo la fecha de consulta.")

# ------------------------------------------------------------------ estado final (para la propuesta de cada expediente)
def aplicar(o, d, cambios):
    o = copy.deepcopy(o); d = copy.deepcopy(d)
    for c in cambios:
        t = c['tipo']
        if t == 'rentabilidad': o['rentabilidad'] = c['despues']
        elif t == 'metrica':
            i = next(i for i, m in enumerate(o['metricas']) if m['etiqueta'] == c['etiqueta']); o['metricas'][i] = c['despues']
        elif t == 'aviso':
            i = next(i for i, a in enumerate(o['avisos']) if a['texto'] == c['antes']); o['avisos'][i] = {**o['avisos'][i], 'texto': c['despues']}
        elif t == 'resumen': o['resumen'] = c['despues']
        elif t == 'tarjeta':
            i = next(i for i, r in enumerate(d['referencias']) if r['etiqueta'] == c['etiqueta']); d['referencias'][i] = {**d['referencias'][i], 'valor': c['despues']}
    return o, d

# ------------------------------------------------------------------ expedientes de hoy
NOTA_HOY = {'vigia': 'según el vigía ({h} UTC), sin cambios', 'releida': 'releída a las {h} UTC'}
def nota(url):
    l = leida(url)
    return (l, f" · {FES}: " + NOTA_HOY[l[1]].format(h=l[0][11:19]) + '.') if l else (None, '')
for o in ESC['ofertas']:
    s = o['slug']
    e = leer(os.path.join(P, 'expedientes', s + '.json'))
    for campo_lista, campo_url, campo_texto in [('registros', 'url', 'alcance'), ('documentos', 'url', 'versionOFecha'), ('advertenciasReguladores', 'url', 'resultado'),
                                                ('claims', 'fuentePrimaria', 'alcanceYLimites'), ('avisosConFecha', 'fuente', 'literal')]:
        for x in e.get(campo_lista) or []:
            l, n = nota(x.get(campo_url))
            if not l: continue
            x['consultadoUtc'] = l[0]
            if l[1] == 'vigia': x['segunVigia'] = True
            if isinstance(x.get(campo_texto), str): x[campo_texto] = x[campo_texto] + n
    e['consulta'] = {'inicioUtc': INICIO, 'finUtc': FIN}
    of, df = aplicar(o, DOC[s], CAMBIOS.get(s, []))
    tj = {r['etiqueta'].split(' (')[0]: r['valor'] for r in df['referencias'] if CANONICA.match(r['etiqueta'])}
    pt = e['propuestaTarjeta']
    pt['resumen'] = of['resumen']; pt['metricas'] = of['metricas']; pt['avisos'] = [a['texto'] for a in of['avisos']]
    pt['rentabilidad'] = of['rentabilidad']
    rt = {k: v for k, v in (pt.get('resumenTarjeta') or {}).items() if k not in ('minimo', 'accesoEspana', 'salida')}
    for k, v in [('minimo', tj.get('Mínimo de inversión')), ('accesoEspana', tj.get('Acceso desde España')), ('salida', tj.get('Salida', tj.get('Reembolso')))]:
        if v is not None: rt[k] = v
    pt['resumenTarjeta'] = rt
    cs = [c for c in CAMBIOS.get(s, []) if c['tipo'] != 'referencia' or c['despues'].get('valor') or c['despues'].get('etiqueta', '').endswith(FES) is False]
    e['cambiosRespectoPublicado'] = [{'campo': 'revisión del 26/11/2026', 'antes': f'Publicada el {PFES}',
        'ahora': f"Fuentes releídas hoy como visitante (vigía y lista de releídas); {len(CAMBIOS.get(s, []))} cambios en decisiones.json, la mayoría solo de fecha.",
        'fuente': o['url'], 'critico': False}] if leida(o['url']) else []
    e['decision'] = 'actualizar'
    e['motivoDecision'] = f'Revisión del {FES}: mismas fuentes releídas hoy; cifras de hoy donde cambian y fechas de consulta de hoy.'
    e['notaParaCoordinador'] = 'Ciclo del 26/11/2026 montado por una sola sesión, sin agentes (orden de la dirección).'
    escribir(os.path.join(AQUI, 'expedientes', s + '.json'), e)

# ------------------------------------------------------------------ decisiones.json
D = {
  'formato': 1, 'etiqueta': '2026-11-26', 'fecha': FECHA, 'desde': '2026-11-21',
  'previa': {'revisionId': 'fe0cfaa8-9682-b729-69e2-9bb4f8587ce9', 'hash': 'fe0cfaa89682b72969e29bb4f8587ce9c27f249e7e7f5b181292d91887b43966', 'ultimoDia': '2026-11-28'},
  'vigenciaDias': 7, 'ultimoDia': '2026-12-03', 'colecciones': {'principales': 8, 'secundario': 13, 'en_camino': 1}, 'plataformas': 25,
  'cadena': D21['cadena'] + ['2026-11-21'], 'pedido': 'puesta al día pedida por el responsable del proyecto',
  'orden': 'coteja la información de códex que es de hoy con lo que hiciste y lanza la actualización de toda la app y la web',
  'lecturaPublica': {'hora': '2026-11-26T18:16:23Z – 2026-11-26T18:16:27Z', 'descartadas': 5},
  'radar': {'fuentes': 69, 'manuales': ['spiko-regafi-pasaporte-es', 'centrifuge-terms', 'paxg-occ'],
            'alcanceNota': 'tres por lectura a mano: la de pasaportes del registro REGAFI por su API pública, las condiciones de Centrifuge con navegador y la lista de la OCC descargada aparte; la documentación de Blocksquare para socios pide ahora iniciar sesión y se cita su web',
            'copias': [{'archivo': 'radar-manual/regafi-spiko-pasaporte-espagne.json', 'sha256': sha(os.path.join(AQUI, 'radar-manual/regafi-spiko-pasaporte-espagne.json')), 'contiene': ['"type_passeport": "Libre prestation de services"', '"pays": "ESPAGNE"', '"date_debut": "2026-01-08"']},
                       {'archivo': 'radar-manual/occ-trust-by-name.txt', 'sha256': sha(os.path.join(AQUI, 'radar-manual/occ-trust-by-name.txt')), 'contiene': ['Trust Banks Active As of 10/31/2026', '25379 Paxos Trust Company, National Association']},
                       {'archivo': 'radar-manual/centrifuge-terms.txt', 'sha256': sha(os.path.join(AQUI, 'radar-manual/centrifuge-terms.txt')), 'contiene': ['Neither Centrifuge nor any affiliated entity is licensed']}]},
  'candidatas': [], 'sinCambios': [], 'plantillas': PLANTILLAS, 'pruebas': {},
  'ofertas': {s: {'cambios': CAMBIOS[s]} for s in [o['slug'] for o in ESC['ofertas']] if s in CAMBIOS},
  'prohibidos': [{'en': 'cambios', 'patron': 'oportunidad|rentabilidad garantizada', 'flags': 'i', 'motivo': 'palabras que no van en las fichas'},
                 {'en': 'hausera-proximas-ofertas', 'patron': 'preventa abierta|suscripción del 25/11', 'flags': 'i', 'motivo': 'Hausera: Alicante 3 ya está financiada'}],
  'fuentesNuevas': [],
  'noAplicado': [], 'contraste': {}, 'transparencia': {}, 'comprobar': {},
  'textos': {
    'notaOrigen': ('Revisión del 26/11/2026 (puesta al día pedida por el responsable del proyecto): las 22 fichas revisadas con sus fuentes primarias '
                   'releídas hoy como visitante, un expediente por oferta; montaje y revisión por una sola sesión, sin agentes; ninguna candidata nueva; '
                   'sin altas ni retiradas. Parte de la publicada fe0cfaa8 (entrega 2026-11-21). Las cifras se publican solo donde se leyeron en la fuente oficial; '
                   'en reventa y próximas, la tarjeta enseña mínimo, acceso desde España y salida en castellano, con fuente y fecha.'),
    'aprobadaReferencia': ('Entrega 2026-11-26: radar (69 fuentes) y 22 fichas comprobados el 26/11/2026 con fuentes primarias releídas hoy, expediente por oferta; '
                           'mismas 22 ofertas (8/13/1) y 25 plataformas. Puesta al día pedida por el responsable del proyecto el 26/11/2026; ciclo autorizado por su orden.'),
  }
}
escribir(os.path.join(AQUI, 'decisiones.json'), D)

# ------------------------------------------------------------------ DECISIONES-COORDINADOR.md
lin = ['# Decisiones del ciclo del 26/11/2026', '',
       'Orden de la dirección (26/11): «No gastes agentes extra gasta solo tu capacidad, coteja la información de códex que es de hoy con lo que hiciste y lanza la actualización de toda la app y la web».',
       'Este ciclo lo monta y lo revisa una sola sesión, sin agentes. Lo leído hoy: lectura pública (18:16 UTC), vigía (18:17 UTC), radar (69 de 69, tres a mano) y cada fuente de las 22 fichas (fuentes/releidas-2026-11-26.txt).', '',
       '## 1 · Qué entra', '',
       '- Las 22 fichas se re-fechan al 26/11 solo donde su fuente se leyó hoy; cifras de hoy donde cambian (Spiko, mTBILL, libros de Brickwise y de Switzerlend).',
       '- Hausera: Alicante 3 ya figura como financiada; esta entrega lo dice y la entrega 2026-11-26.2 retira la tarjeta (no hay ninguna operación abierta ni anunciada).',
       '- Codex (25/11) propuso la misma retirada y cifras de Spiko del 21/11 sin ampliar la vigencia; se sustituye por esta entrega, con las cifras de hoy y vigencia hasta el 03/12.',
       '- Candidatas nuevas: no se buscan en este ciclo (sin agentes); las de vigilancia siguen como el 21/11.', '',
       '## 2 · Lista cerrada de cambios', '']
for s, t in LISTA: lin.append('- ' + t)
lin += ['', '## 3 · Radar', '', '- 69 de 69 fuentes dicen lo que respaldan. A mano: REGAFI (API pública), Centrifuge (navegador) y la OCC (PDF descargado aparte).',
        '- Blocksquare: su documentación para socios pide ahora iniciar sesión; se cita su web pública y se cambian los dos textos que se apoyaban en ella (cambios-radar.json).', '',
        '## 4 · Lo que no se re-fecha (su fuente no se pudo leer hoy)', '']
for s, e_, f, por in NO_RELEIDAS: lin.append(f'- {s} · «{e_}» ({f}): {por}.')
escribir(os.path.join(AQUI, 'DECISIONES-COORDINADOR.md'), '\n'.join(lin) + '\n')
print('cambios', sum(len(v) for v in CAMBIOS.values()), 'no re-fechadas', len(NO_RELEIDAS))
for x in NO_RELEIDAS: print('  ·', x)

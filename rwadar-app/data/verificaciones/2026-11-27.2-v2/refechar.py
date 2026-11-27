# Entrega 2026-11-27.2 · re-fechado de las 32 ofertas publicadas (entrega 2026-11-27) con lo leído hoy como visitante.
# Mismo criterio que la puesta al día del 26/11 (2026-11-26-v2/montar.py, apartado 6): una referencia se re-fecha solo si
# su fuente se leyó hoy con respuesta útil; una oferta pasa a «comprobada el 27/11» solo si su página principal se leyó
# hoy. Lo que no se pudo leer conserva su fecha del 26/11 y queda en REFECHADO.md.
# Lo leído hoy: fuentes/releidas-2026-11-27.txt (relectura de cada fuente citada, 11:08–11:24 UTC, y reintento de las
# que fallaron), vigia.json (vigía de las 10:19 UTC) y la nota de Amundi leída con WebFetch a las 09:52 UTC (radar,
# 2026-11-27-v2/cambios-radar.json). Brickwise: cifras del libro de órdenes del vigía.
#   python3 rwadar-app/data/verificaciones/2026-11-27.2-v2/refechar.py
import copy, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(AQUI, '..', '2026-11-27-v2')
FECHA, FES, CORTA = '2026-11-27', '27/11/2026', '27/11'
PFECHA, PFES, PCORTA = '2026-11-26', '26/11/2026', '26/11'
leer = lambda p: json.load(open(p, encoding='utf-8'))
ESC = leer(os.path.join(BASE, 'escaparate-publicacion.json'))
DOC = leer(os.path.join(BASE, 'documentacion-ofertas.json'))
V = leer(os.path.join(AQUI, 'vigia.json'))

LEIDAS = {}
for l in open(os.path.join(AQUI, 'fuentes/releidas-2026-11-27.txt'), encoding='utf-8').read().splitlines()[1:]:
    hora, _, http, _, sh, tam, url = l.split(' ', 6)
    if http == '200' and int(tam) > 40: LEIDAS.setdefault(url, (hora, 'relectura'))
for f in V['fuentes']:
    if f.get('http') == 200: LEIDAS.setdefault(f['url'], (f['horaUtc'], 'vigia'))
LEIDAS.setdefault('https://about.amundi.com/article/amundi-extends-tokenisation-index-investing', ('2026-11-27T09:52:00Z', 'webfetch'))
leida = lambda u: LEIDAS.get(u)

# Frases de fecha de consulta (no de fecha del dato): solo estas cambian.
CONSULTA = [
    (r'(Visto en la fuente oficial el )' + PFES, r'\g<1>' + FES),
    (r'([Cc]omprobado de nuevo en la fuente el )' + PFES, r'\g<1>' + FES),
    (r'(comprobado en la fuente el )' + PFES, r'\g<1>' + FES),
    (r'(consultad[oa]s? (?:hoy, )?el )' + PFES, r'\g<1>' + FES),
    (r'(le[ií]d[oa]s? (?:como visitante )?el )' + PFES, r'\g<1>' + FES),
    (r'(releíd[oa]s? (?:hoy )?el )' + PFES, r'\g<1>' + FES),
    (r'(\bGECO )' + PFES, r'\g<1>' + FES),
    (r'(proveedor comprobado el )' + PFES, r'\g<1>' + FES),
    (r'(resultados el )' + PFES, r'\g<1>' + FES),
    (r'(mismo SHA-256 el )' + PFES, r'\g<1>' + FES),
]
# Observaciones hechas a mano en la app a una hora concreta: hoy no se han repetido, se quedan con su fecha.
OBSERVACION_APP = re.compile(r'observada en la app|\b\d{2}:\d{2}:\d{2}Z')
def consulta(t):
    if not isinstance(t, str): return t
    for a, b in CONSULTA: t = re.sub(a, b, t)
    return t
def etiqueta(e):
    return re.sub(r'( · (?:consulta )?)' + re.escape(PFES) + '$', r'\g<1>' + FES, e)

# Brickwise: libro de órdenes del vigía (10:19 UTC).
BW = {o['slug'] for o in ESC['ofertas'] if o['plataformaSlug'] == 'brickwise'}
HORA_VIGIA = V['generadoUtc'][11:16]
def vig(slug, campo):
    return next(c for c in V['fichas'][slug]['cifras'] if c['campo'] == campo)
LIBRO = {'Venta más barata': 'Venta más barata', 'Orden de venta de menor importe': 'Orden de venta de menor importe',
         'Participaciones en venta': 'Participaciones en venta', 'Mejor oferta de compra': 'Mejor oferta de compra'}
SPIKO_VL = {'spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar', 'spiko-smart-cash-euro'}
SUIZAS = {'aktionariat', 'boss-info', 'switzerlend'}

informe = {'refechadas': [], 'no': [], 'referenciasSinLeer': [], 'cambiosBrickwise': [], 'quedan': []}
esc, doc = copy.deepcopy(ESC), copy.deepcopy(DOC)
for o in esc['ofertas']:
    s = o['slug']; d = doc[s]
    if o['verificadaEl'] != PFECHA or not leida(o['url']):
        informe['no'].append((s, o['url'], 'su página principal no se pudo leer hoy' if not leida(o['url']) else f"comprobada el {o['verificadaEl']}"))
        continue
    informe['refechadas'].append(s)
    o['verificadaEl'] = FECHA; d['revisadaEl'] = FECHA
    for a in o['avisos']:
        if a.get('verificadaEl') == PFECHA: a['verificadaEl'] = FECHA
        if s in SUIZAS: a['texto'] = a['texto'].replace(f' el {PFES}', f' el {FES}')  # cifras del vigía, iguales hoy
    if o.get('rentabilidad'): o['rentabilidad']['literal'] = consulta(o['rentabilidad']['literal'])
    for m in o['metricas']:
        if s in SUIZAS or 'FINMA' in m['valor']: m['valor'] = m['valor'].replace(f'({PFES})', f'({FES})')
    for r in d['referencias']:
        if r['fechaConsulta'] != PFECHA: continue
        l = leida(r['fuente'])
        if l and OBSERVACION_APP.search(r['alcance']) and not (s in BW):
            informe['referenciasSinLeer'].append((s, r['etiqueta'], 'observación en la app del 26/11, no repetida hoy')); continue
        if not l:
            informe['referenciasSinLeer'].append((s, r['etiqueta'], r['fuente'])); continue
        base_e = re.sub(r' · (?:consulta )?' + re.escape(PFES) + '$', '', r['etiqueta'])
        r['fechaConsulta'] = FECHA
        dato_del_dia = r['etiqueta'].endswith(' · ' + PFES) or r['etiqueta'].endswith(' · consulta ' + PFES)
        r['etiqueta'] = etiqueta(r['etiqueta'])
        r['alcance'] = consulta(r['alcance'])
        if s in BW and base_e in LIBRO:
            c = vig(s, LIBRO[base_e])
            if r['valor'] != c['hoy']: informe['cambiosBrickwise'].append((s, base_e, r['valor'], c['hoy']))
            r['valor'] = c['hoy']
            r['alcance'] = r['alcance'].replace(f'leído el {FES} (18:17 UTC)', f'leído el {FES} ({HORA_VIGIA} UTC)')
        if s in BW and base_e == 'Mínimo de inversión' and '(' + PCORTA + ')' in r['valor']:
            precio = vig(s, 'Mínimo de la tarjeta (venta más barata)')['hoy'].replace(',00 €', ' €')
            r['valor'] = f'Desde {precio} la participación en reventa ({CORTA})'
        if s in SUIZAS: r['valor'] = r['valor'].replace(f'precio a {PCORTA})', f'precio a {CORTA})').replace(f'CHF el {PCORTA},', f'CHF el {CORTA},')
        if r.get('fechaDato') == PFECHA and (dato_del_dia or base_e == 'Mínimo de inversión') and not (s in SPIKO_VL and base_e.startswith('Rentabilidad publicada')):
            r['fechaDato'] = FECHA
    # Lo que aún dice 26/11 en una ficha re-fechada: se revisa a mano (fechas de datos, como el VL de Spiko).
    for donde, obj in (('oferta', o), ('ficha', d)):
        def walk(x, ruta=''):
            if isinstance(x, dict):
                for k, v in x.items(): walk(v, f'{ruta}/{k}')
            elif isinstance(x, list):
                for i, v in enumerate(x): walk(v, f'{ruta}/{i}')
            elif isinstance(x, str) and (PCORTA in x or PFECHA in x):
                informe['quedan'].append((s, donde + ruta, x[:160]))
        walk(obj)

json.dump(esc, open(os.path.join(AQUI, 'base-refechada-escaparate.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.dump(doc, open(os.path.join(AQUI, 'base-refechada-documentacion.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.dump(informe, open(os.path.join(AQUI, 'refechado.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"re-fechadas {len(informe['refechadas'])}, sin re-fechar {len(informe['no'])}, referencias sin leer {len(informe['referenciasSinLeer'])}, "
      f"cambios de Brickwise {len(informe['cambiosBrickwise'])}, textos con 26/11 que quedan {len(informe['quedan'])}")

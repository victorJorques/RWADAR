"""Monta la propuesta de tarjetas del ciclo 01/11/2026 a partir de los
expedientes y de los cambios obligatorios de la revisión independiente.

Solo lee y escribe archivos locales de esta carpeta. No consulta la red, no
toca Supabase ni publica. Las cifras de mercado y de rentabilidad se marcan
para releer el día de publicación, como piden los revisores.

    python3 -I rwadar-app/data/verificaciones/2026-11-01-v2/preparar-propuesta.py
"""
import copy
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
EXP = BASE / 'expedientes'
PUBLICADO = json.loads((BASE.parent / '2026-10-23-v2' / 'escaparate-publicacion.json').read_text(encoding='utf-8'))
ORDEN_PUBLICADO = [o['slug'] for o in PUBLICADO['ofertas']]
AVISO_GENERAL = ('Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; '
                 'RWAdar no recibe dinero de inversiones.')

BRICKWISE_REVENTA = [
    'vivienda-pluddemanngasse-101-graz', 'vivienda-sonnleithnergasse-2-viena', 'local-de-estanco-klagenfurt',
    'vivienda-stallhofstra-e-28-gratwein', 'vivienda-schwarzer-weg-18-graz', 'drautalresidenz-paternion',
    'randhartingergasse-9-viena', 'apartamento-vacacional-hinterstoder-50',
    'vivienda-pottendorfer-stra-e-62-wr-neustadt', 'fotovoltaica-greenpoint', 'fotovoltaica-cohotel']

# Decisión final por slug: (escenario B «catálogo de confianza», escenario A «compatible hoy»,
# veredicto de la revisión independiente, archivo de revisión).
R_ALTAS, R_CRIT, R_BW, R_RET, R_AKT = ('REVISION-ALTAS.md', 'REVISION-CAMBIOS-CRITICOS.md', 'REVISION-BRICKWISE.md',
                                       'REVISION-RETIRADAS.md', 'REVISION-AKTIONARIAT.md')
FINAL = {
    'spiko-letras-del-tesoro-euro': ('principales', 'principales', 'aprobada_con_cambios', R_CRIT),
    'spiko-letras-del-tesoro-dolar': ('principales', 'principales', 'aprobada_con_cambios', R_ALTAS),
    'robinhood-classic-stock-tokens': ('principales', 'principales', 'aprobada_con_cambios', R_ALTAS),
    'mtbill': ('principales', 'principales', 'aprobada_con_cambios', R_CRIT),
    'prosegur-digital-gold': ('principales', 'principales', 'aprobada_con_cambios', R_CRIT),
    'aktionariat': ('principales', 'principales', 'aprobada_con_cambios', R_AKT),
    'boss-info': ('secundario', 'principales', 'aprobada_con_cambios', R_AKT),
    'switzerlend': ('secundario', 'principales', 'aprobada_con_cambios', R_AKT),
    'mf-one': ('secundario', 'principales', 'mantener_con_cambios', R_RET),
    'casa-de-outeiro': ('en_camino', 'en_camino', 'aprobada_con_cambios', R_CRIT),
    'terreno-con-arrendamiento-billa': ('en_camino', 'en_camino', 'aprobada_con_cambios', R_BW),
    'hausera-proximas-ofertas': ('en_camino', 'en_camino', 'aprobada_con_cambios', R_CRIT),
    **{s: ('secundario', 'principales', 'aprobada_con_cambios', R_BW) for s in BRICKWISE_REVENTA},
}
# Retiradas justificadas por la revisión: en el escenario A siguen visibles con aviso.
RETIRADAS = {s: R_RET for s in ORDEN_PUBLICADO if s.startswith('reental-')}
RETIRADAS.update({'mglo': R_RET, 'mglobal': R_RET, 'mgloeuro': R_RET, 'iod-occasio': R_RET,
                  'wemakeit': R_AKT, 'servicehunter-quitt': R_AKT})
NO_ADMITIDA_TRAS_REVISION = {'kraken-xstocks': R_ALTAS}


def metrica(t, etiqueta, valor=None, nueva=None):
    """Cambia el valor (o el rótulo) de una métrica existente; la añade si falta."""
    for m in t['metricas']:
        if m['etiqueta'] == etiqueta:
            if nueva:
                m['etiqueta'] = nueva
            if valor is not None:
                m['valor'] = valor
            return
    t['metricas'].append({'etiqueta': nueva or etiqueta, 'valor': valor})


def quitar_metrica(t, etiqueta):
    t['metricas'] = [m for m in t['metricas'] if m['etiqueta'] != etiqueta]


def aviso(t, texto):
    if texto not in t['avisos']:
        t['avisos'].append(texto)


def aplicar_revision(slug, t, pendientes):
    if slug == 'spiko-letras-del-tesoro-euro':
        metrica(t, 'Comisión de gestión', '0,25 % anual', 'Gastos corrientes (KID)')
        metrica(t, 'Supervisor', 'AMF (fondo) · inscrito en la CNMV para su comercialización, n.º 2380')
        pendientes.append('Releer la rentabilidad de 31 días en la API de Spiko y sustituir cifra y fecha.')
    elif slug == 'spiko-letras-del-tesoro-dolar':
        metrica(t, 'Comisión de gestión', '0,25 % anual', 'Gastos corrientes (KID)')
        metrica(t, 'Supervisor', 'AMF (fondo) · inscrito en la CNMV para su comercialización, n.º 2380')
        metrica(t, 'Reembolso', 'Diario en días hábiles (Francia y EE. UU.), corte 11:30 París')
        pendientes.append('Releer la rentabilidad de 31 días en la API de Spiko y sustituir cifra y fecha.')
        pendientes.append('Ilustración editorial nueva (alta): generar, revisar y precargar.')
    elif slug == 'robinhood-classic-stock-tokens':
        t['titulo'] = 'Classic Stock Tokens: derivados sobre acciones de EE. UU.'
        metrica(t, 'Reembolso', 'Cierre con la contraparte en días de mercado de EE. UU.; puede suspenderse',
                'Salida')
        metrica(t, 'Plazo recomendado (KID)', '1 año')
        t['pasos'] = [p if p != 'Robinhood recompra' else 'Cierras con la contraparte' for p in t['pasos']]
        aviso(t, 'La contraparte puede suspender el cierre de posiciones (KID).')
        pendientes.append('Ilustración editorial nueva (alta): generar, revisar y precargar.')
    elif slug == 'prosegur-digital-gold':
        metrica(t, 'Reembolso', 'Solo recompra por Prosegur · 1–7 días hábiles aprox. en condiciones normales')
        metrica(t, 'Custodia', 'Oro en inventario común custodiado por Prosegur (sin lingote asignado)')
        metrica(t, 'Supervisión', 'Producto no supervisado (según su contrato)')
        aviso(t, 'Prosegur Crypto está autorizada por la CNMV (MiCA, 30/06/2026) para custodiar y transferir '
                 'criptoactivos; esa autorización no cubre este token de oro.')
        aviso(t, 'Si el oro no se mueve, comprar y revender te cuesta cerca de un 10 % (compras a LBMA +4 %, '
                 'vendes a LBMA −6 %). Las comisiones pueden cambiar.')
    elif slug == 'mtbill':
        quitar_metrica(t, 'Valor por token · 30/10/2026')
        metrica(t, 'Valor por token · 02/11/2026', '1,0769 USD (oráculo del emisor)')
        metrica(t, 'Comisión de gestión', 'Gestión 0 % · éxito 5 % del rendimiento positivo · reembolso '
                                         'inmediato 0,07 % (KID)', 'Comisiones (KID)')
        aviso(t, 'El emisor cerró 2025 con patrimonio negativo (5,78 M€ de déficit) y se financia con préstamos '
                 'de su matriz. Si no puede pagar, puedes perder toda la inversión (riesgo 7 de 7 en el KID).')
        aviso(t, 'No hay mercado secundario: solo puedes salir reembolsando al emisor o transmitiendo a otra '
                 'wallet autorizada.')
        pendientes.append('Releer el oráculo el día de publicación y poner valor y fecha de ese día.')
    elif slug == 'casa-de-outeiro':
        metrica(t, 'Salida', 'Bloqueo inicial; de 2027 a 2030 solo puedes transmitir un 2,5 % de tus acciones '
                             'al año (ficha de datos)')
        t['avisos'] = [a.replace('la ficha del 30/10/2026', 'la ficha fechada el 30/10/2026') for a in t['avisos']]
        aviso(t, 'La CNMV no ha verificado ni aprobado esta oferta; el registro de la CNMV es de la plataforma, '
                 'no del proyecto.')
        pendientes.append('Releer campaña y recaudado; si la campaña sigue con fin 31/10/2026, mantener el '
                          'conflicto de plazo como primer aviso.')
    elif slug == 'hausera-proximas-ofertas':
        metrica(t, 'Supervisor', 'No registrada en la CNMV (sus términos dicen que no es empresa de servicios '
                                 'de inversión)')
        aviso(t, 'Puedes perder todo o parte del dinero; no hay mercado secundario garantizado.')
        pendientes.append('Revisar de nuevo tras el 04/11 y el 11/11/2026; sin documento de emisión no se '
                          'publica mínimo, plazo ni rentabilidad.')
    elif slug == 'terreno-con-arrendamiento-billa':
        aviso(t, 'El 5,07 % es una previsión del emisor sobre el nominal; todavía no se ha pagado ningún reparto.')
        pendientes.append('Releer suscritas y estado en la API de Brickwise.')
    elif slug in BRICKWISE_REVENTA:
        for m in t['metricas']:
            if m['etiqueta'].startswith('Venta más barata'):
                m['valor'] = re.sub(r'\s*\(\d+[^)]*participaciones\)', '', m['valor'])
        if slug == 'fotovoltaica-cohotel':
            t['metricas'] = [m for m in t['metricas'] if not m['etiqueta'].startswith('Mejor compra')]
        if slug.startswith('fotovoltaica-'):
            t['categoria'] = 'Infraestructura'
        pendientes.append('Releer en la API de Brickwise precio de referencia, libro de órdenes y previsión, '
                          'y fecharlos el día de publicación.')
    elif slug in ('aktionariat', 'boss-info', 'switzerlend'):
        for etiqueta in ('Supervisor',):
            metrica(t, etiqueta, 'Sin supervisión prudencial declarada (registro FINMA no consultado)')
        if slug == 'aktionariat':
            aviso(t, 'Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a '
                     '7,25 CHF el 02/11/2026).')
            aviso(t, 'No se publica cuánto queda del tope de 100.000 € para el EEE.')
        else:
            aviso(t, 'El portal no indica qué países pueden comprar: no consta acceso desde España.')
        pendientes.append('Releer precio del emisor y libro de órdenes el día de publicación.')
    elif slug == 'mf-one':
        aviso(t, 'Solo para inversores profesionales en lista blanca: oferta exenta de folleto y sin KID.')
    if AVISO_GENERAL in t['avisos']:
        t['avisos'].remove(AVISO_GENERAL)
        t['avisos'].insert(0, AVISO_GENERAL)


def main():
    salida = {'version': 1, 'ciclo': '2026-11-01', 'preparadoEl': '2026-11-02',
              'nota': ('Propuesta preparada en local. No aplicada en Supabase ni publicada. Las cifras de '
                       'mercado y rentabilidad se releen el día de publicación.'),
              'escenarios': {}, 'ofertas': [], 'retiradasPropuestas': [], 'noAdmitidasTrasRevision': []}
    for slug, (col_b, col_a, veredicto, revision) in FINAL.items():
        exp = json.loads((EXP / f'{slug}.json').read_text(encoding='utf-8'))
        tarjeta = copy.deepcopy(exp['propuestaTarjeta'])
        tarjeta.setdefault('metricas', [])
        tarjeta.setdefault('avisos', [])
        pendientes = []
        aplicar_revision(slug, tarjeta, pendientes)
        tarjeta['coleccion'] = col_b
        salida['ofertas'].append({
            'slug': slug, 'alta': exp['tipoExpediente'] == 'candidata', 'proveedor': exp.get('proveedor'),
            'coleccionEscenarioB': col_b, 'coleccionEscenarioA': col_a,
            'disponibleEs': exp.get('disponibleEs'), 'revision': {'veredicto': veredicto, 'archivo': revision},
            'pendientesAlPublicar': pendientes, 'tarjeta': tarjeta})
    for slug, revision in RETIRADAS.items():
        exp = json.loads((EXP / f'{slug}.json').read_text(encoding='utf-8'))
        salida['retiradasPropuestas'].append({'slug': slug, 'proveedor': exp.get('proveedor'),
                                              'motivo': exp.get('motivoDecision'), 'revision': revision,
                                              'coleccionPublicada': next(o['coleccion'] for o in PUBLICADO['ofertas']
                                                                         if o['slug'] == slug)})
    for slug, revision in NO_ADMITIDA_TRAS_REVISION.items():
        salida['noAdmitidasTrasRevision'].append({'slug': slug, 'revision': revision,
                                                  'motivo': 'Rechazada en este ciclo por la revisión independiente: '
                                                            'KID y condiciones finales sin leer.'})
    cuenta = lambda clave: {c: sum(1 for o in salida['ofertas'] if o[clave] == c)
                            for c in ('principales', 'secundario', 'en_camino')}
    b = cuenta('coleccionEscenarioB')
    a = cuenta('coleccionEscenarioA')
    for r in salida['retiradasPropuestas']:
        a[r['coleccionPublicada']] += 1
    salida['escenarios'] = {
        'B_catalogoDeConfianza': {'ofertas': sum(b.values()), 'colecciones': b,
                                  'requiere': 'Vía de reducción deliberada en web y app (cambio de código, '
                                              'publicación y OTA con permiso de Víctor).'},
        'A_compatibleHoy': {'ofertas': sum(a.values()), 'colecciones': a,
                            'requiere': 'Nada nuevo en código: cumple el mínimo 49 · 24/21/4. Las retiradas '
                                        'siguen visibles con aviso.'},
        'manifiestoPublicado': {'ofertas': 49, 'colecciones': {'principales': 24, 'secundario': 21,
                                                                'en_camino': 4}},
    }
    (BASE / 'propuesta-tarjetas.json').write_text(json.dumps(salida, ensure_ascii=False, indent=2) + '\n',
                                                  encoding='utf-8')
    print(json.dumps(salida['escenarios'], ensure_ascii=False, indent=1))
    print('ofertas', len(salida['ofertas']), 'retiradas', len(salida['retiradasPropuestas']))


if __name__ == '__main__':
    main()

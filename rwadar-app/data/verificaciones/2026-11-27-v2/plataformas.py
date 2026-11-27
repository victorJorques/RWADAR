# Entrega 2026-11-27 · plataformas del radar del informe de investigación global del 27/11/2026 (apartados 3 y 4 del
# cierre y familias V4), verificadas a mano el 27/11/2026 sin agentes. Solo entran las que se comprobaron reales y
# activas en su propia web, leída ese día como visitante con un navegador normal (aceptando el aviso de cookies o de
# entrada si lo había). Cada dato lleva su fuente (fuentes/lecturas-2026-11-27.json y sus copias, con los nombres de
# personas retirados) y las frases que lo respaldan (comprobaciones), que este guion busca en la copia de hoy.
#
# No entran (y por qué): Sygnum y Matrixdock (su web responde 403 a la lectura de hoy); Estate Protocol (su web no
# enseña actividad comprobable: «0 months» de pagos y ninguna propiedad legible); Kapital DX y Pitch Platforms (solo un
# comunicado del supervisor de Malasia de 2022, sin su propia web leída hoy); Goldfinch (ya está entre las descartadas y
# el informe no trae una razón nueva); Clearstream, KASE y los fondos monetarios de BNY, Fidelity, JPMorgan y
# WisdomTree (infraestructura de mercado o productos de gestoras que el informe solo identifica en un registro de la
# SEC, sin plataforma propia para el inversor leída hoy); NEXOR, Mawa y DPA (el propio informe no acredita ofertas).
#   python3 rwadar-app/data/verificaciones/2026-11-27-v2/plataformas.py
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
FECHA = '2026-11-27'
L = json.load(open(os.path.join(AQUI, 'fuentes/lecturas-2026-11-27.json')))
U = {k: v['url'] for k, v in L.items()}

def fuente(fid, tipo, titulo):
    return {'id': fid, 'tipo': tipo, 'titulo': titulo, 'url': U[fid], 'primaria': True, 'consultadaEl': FECHA}

def campo(estado, detalle, *fids):
    return {'estado': estado, 'detalle': detalle, 'fuentes': list(fids)}

def alerta(codigo, detalle, *fids):
    return {'codigo': codigo, 'detalle': detalle, 'fuentes': list(fids)}

REGIONES = []

def P(slug, nombre, cat, region, actor, acceso, ticket, cadenas, web, aval, nota, fuentes, comprobaciones, eo, lic, acc, alertas):
    return {'slug': slug, 'nombre': nombre,
            'publica': {'categoria_slug': cat, 'region_slug': region, 'actor': actor, 'acceso': acceso, 'ticket': ticket,
                        'cadenas': cadenas, 'web': U[web], 'aval': aval, 'nota': nota},
            'fuentes': fuentes, 'comprobaciones': comprobaciones,
            'radar': {'estadoOperativo': eo, 'licenciaRegistro': lic, 'acceso': acc, 'alertasCriticas': alertas}}

FUERA_UE = 'No tiene folleto ni KID europeos y la CNMV no la supervisa: lo que ofrece se rige por la ley de su país.'

PLATAFORMAS = [
  # ---------------------------------------------------------------- Asia-Pacífico
  P('libeara', 'Libeara', 'tesoro-y-fondos', 'asia-pacifico', 'Infraestructura', 'Empresas', 'No aplica', 'Ethereum, Arbitrum, Avalanche y Solana', 'libeara-web',
    'Plataforma de tokenización de Singapur nacida en SC Ventures, la incubadora de Standard Chartered. Da la tecnología; la gestión y el cumplimiento de cada fondo son de su gestora.',
    'Tecnología para emitir y distribuir fondos y bonos tokenizados; entre otros, el fondo de letras de EE. UU. «ULTRA» de FundBridge Capital, subgestionado por Wellington.',
    [fuente('libeara-web', 'empresa', 'Libeara · Redesigning Capital Markets, On-Chain'),
     fuente('libeara-ultra', 'empresa', 'Libeara · «FundBridge and Libeara Launch Regulated Tokenised Treasury Fund on Avalanche»')],
    {'libeara-web': ['Incubated by SC Ventures', 'Tokenised Funds', 'Singapore'],
     'libeara-ultra': ['accredited and institutional investors', 'Delta Master Trust', 'FundBridge Capital remains responsible']},
    campo('observada', 'Su web presenta su tecnología para fondos y bonos tokenizados en cuatro redes y anuncia más de 1.000 millones de dólares tokenizados.', 'libeara-web'),
    campo('no_aplica_plataforma', 'Libeara da la tecnología; según su nota sobre ULTRA, la gestora FundBridge Capital responde del fondo, de su mandato y de su cumplimiento normativo.', 'libeara-ultra'),
    campo('confirmado_condicionado', 'El fondo ULTRA se dirige a inversores acreditados e institucionales; la nota está pensada para inversores acreditados e institucionales de Singapur.', 'libeara-ultra'),
    [alerta('solo_institucional', 'No es para particulares: los fondos que apoya se dirigen a inversores acreditados e institucionales. ' + FUERA_UE, 'libeara-ultra')]),
  P('hashkey-rwa', 'HashKey RWA', 'tesoro-y-fondos', 'asia-pacifico', 'Emisor', 'Institucional', 'No aplica', 'No la publica', 'hashkey-htoken',
    'Filial de tokenización de HashKey Holdings, grupo de activos digitales de Hong Kong que cotiza en la bolsa de Hong Kong (código 3887).',
    'Valores tokenizados de la serie «hToken»: el primero, ligado a participaciones de un fondo de HashKey, solo para inversores profesionales.',
    [fuente('hashkey-htoken', 'empresa', 'HashKey · «HashKey RWA Launches First Product Under the HashKey hToken Series» (26/10/2026)')],
    {'hashkey-htoken': ['3887\\.HK', 'hToken', 'exclusively available to qualified professional investors']},
    campo('observada', 'HashKey anunció el 26/10/2026 su primer producto tokenizado «hToken», que se suscribe en USDT en el canal Earn de HashKey Exchange.', 'hashkey-htoken'),
    campo('no_verificable', 'La nota habla de las licencias de negociación de activos digitales del grupo sin dar el registro; no lo hemos comprobado en el supervisor de Hong Kong.', 'hashkey-htoken'),
    campo('confirmado_condicionado', 'Solo para inversores profesionales que cumplan los requisitos; no se puede distribuir donde la oferta esté prohibida.', 'hashkey-htoken'),
    [alerta('solo_profesionales', 'Producto complejo solo para inversores profesionales: se puede perder todo lo invertido. ' + FUERA_UE, 'hashkey-htoken')]),
  # ---------------------------------------------------------------- Suiza
  P('obligate', 'Obligate', 'credito-privado', 'suiza', 'Marketplace', 'Institucional', 'Alto', 'Ethereum y Solana', 'obligate-web',
    'Obligate AG, de Zúrich, dice ser intermediario financiero según la ley suiza contra el blanqueo y miembro de VQF, un organismo de autorregulación supervisado por la FINMA.',
    'Emisión e inversión en deuda privada tokenizada bajo la ley suiza de valores DLT; su producto principal, oTFY, es deuda de financiación del comercio desde 100.000 dólares.',
    [fuente('obligate-web', 'empresa', 'Obligate · Enabling Digital Securities'),
     fuente('obligate-otfy', 'empresa', 'Obligate · oTFY (Trade Finance Yield)')],
    {'obligate-web': ['Institutional and qualified investors', 'Swiss DLT Act'],
     'obligate-otfy': ['USD 100,000 minimum investment', 'Luxembourg securitization vehicle', 'VQF']},
    campo('observada', 'Su web enseña sus ofertas de deuda tokenizada (financiación del comercio, deuda inmobiliaria y de mercados emergentes) y su token oTFY en mercados descentralizados.', 'obligate-web', 'obligate-otfy'),
    campo('no_verificable', 'Dice ser intermediario financiero miembro de VQF, autorregulador supervisado por la FINMA; no lo hemos comprobado en el registro de VQF.', 'obligate-otfy'),
    campo('confirmado_condicionado', 'Solo inversores institucionales y cualificados; en oTFY, mínimo de 100.000 dólares y contrato aparte con el emisor.', 'obligate-web', 'obligate-otfy'),
    [alerta('rentabilidad_sin_fecha', 'Las rentabilidades que enseña su web son las que anuncia el emisor, sin fecha ni garantía, y oTFY cobra un 1 % de gestión y un 10 % sobre beneficios.', 'obligate-otfy'),
     alerta('solo_cualificados', 'No es para particulares. ' + FUERA_UE, 'obligate-web')]),
  P('colb', 'Colb', 'acciones-y-capital-privado', 'suiza', 'Emisor', 'Acreditado', 'Alto', 'BNB Chain', 'colb-web',
    'Colb Asset SA, de Ginebra, dice ser intermediario financiero registrado según la ley suiza, distribuir valores conforme a la FinSA y ser miembro de ARIF, autorregulador aprobado por la FINMA.',
    'Certificados tokenizados que siguen el valor de acciones de empresas que aún no cotizan (pre-salida a bolsa), y estrategias con monedas estables.',
    [fuente('colb-web', 'empresa', 'Colb · Página inicial'),
     fuente('colb-canp', 'empresa', 'Colb · Colb Anthropic Token (CANP)')],
    {'colb-web': ['registered financial intermediary under Swiss law', 'member of ARIF', 'Pre-IPO opportunities'],
     'colb-canp': ['tokenized structured certificate', 'qualified investors', '25.000 \\$USC']},
    campo('observada', 'Su web enseña sus tokens de empresas pre-salida a bolsa y de estrategias con monedas estables.', 'colb-web'),
    campo('no_verificable', 'Dice ser intermediario financiero registrado en Suiza y miembro de ARIF; no lo hemos comprobado en el registro de ARIF.', 'colb-web'),
    campo('confirmado_condicionado', 'Sus certificados se dirigen a inversores cualificados; en CANP, desde 25.000 $USC.', 'colb-canp'),
    [alerta('no_son_acciones', 'Son certificados que siguen el valor de las acciones, no acciones de la empresa, y el precio se estima porque la empresa no cotiza.', 'colb-canp'),
     alerta('riesgo_alto', 'El propio emisor califica el riesgo de alto. ' + FUERA_UE, 'colb-canp')]),
  # ---------------------------------------------------------------- EE. UU.
  P('m3sixty', 'M3Sixty', 'tesoro-y-fondos', 'ee-uu', 'Emisor', 'Minorista', 'No aplica', 'No la publica', 'm3sixty-mmf',
    'Fondo monetario estadounidense (MCGXX) que publica su folleto; lo asesora M3Sixty Capital, que dice estar registrado en la SEC (no lo hemos comprobado).',
    'Fondo monetario de deuda pública de EE. UU. con registro de participaciones en cadena, que busca mantener 1 dólar por participación.',
    [fuente('m3sixty-mmf', 'empresa', 'M3Sixty · M3Sixty OnChain US Government Money Market Fund')],
    {'m3sixty-mmf': ['MCGXX', 'stable \\$1\\.00 net asset value', 'investment advisor registered with the Securities and Exchange Commission']},
    campo('observada', 'La ficha del fondo publica su valor liquidativo y su rendimiento a siete días con fecha del 27/11/2026.', 'm3sixty-mmf'),
    campo('no_verificable', 'Dice que su asesor está registrado en la SEC; no lo hemos comprobado en el registro de la SEC.', 'm3sixty-mmf'),
    campo('confirmado_condicionado', 'Las participaciones no cotizan: se compran y se reembolsan a través de intermediarios o plataformas aprobadas por M3Sixty.', 'm3sixty-mmf'),
    [alerta('fondo_pequeno', 'Es un fondo muy pequeño y sus gastos brutos superan con mucho a los netos: hoy los cubre la gestora y podría dejar de hacerlo.', 'm3sixty-mmf'),
     alerta('fuera_ue', 'Fondo de EE. UU. ' + FUERA_UE, 'm3sixty-mmf')]),
  P('hastra', 'Hastra', 'credito-privado', 'global', 'Emisor', 'Minorista', 'Bajo', 'Solana y Ethereum', 'hastra-wylds',
    'Protocolo descentralizado: su token wYLDS se respalda con YLDS, que su web describe como un valor de renta fija registrado de Figure Certificate Company. Hastra no declara una licencia propia.',
    'Tokens con rendimiento de préstamos: sobre el valor YLDS de Figure y, si se bloquean, de líneas de crédito con garantía de vivienda, de préstamos de coche o a pequeñas empresas.',
    [fuente('hastra-wylds', 'empresa', 'Hastra · What is wYLDS?'),
     fuente('hastra-prime', 'empresa', 'Hastra · What is PRIME (Staked wYLDS)?')],
    {'hastra-wylds': ['registered fixed-income security issued by Figure Certificate Company', 'Hastra takes a 50 bps fee', 'You can lose some or all of your capital'],
     'hastra-prime': ['HELOC']},
    campo('observada', 'Su documentación explica cómo cambiar USDC por wYLDS y bloquearlo para recibir PRIME, AUTO o SMB.', 'hastra-wylds', 'hastra-prime'),
    campo('sin_registro_declarado', 'Según su web, el valor de debajo (YLDS) está registrado (no lo hemos comprobado); Hastra funciona con contratos inteligentes sin permiso y no dice tener licencia propia.', 'hastra-wylds'),
    campo('no_verificable', 'No publica qué países admite ni qué requisitos pide para cambiar USDC por wYLDS.', 'hastra-wylds'),
    [alerta('sin_licencia_declarada', 'El rendimiento no está garantizado y se puede perder todo; hay riesgo de los contratos inteligentes y de los préstamos de debajo. ' + FUERA_UE, 'hastra-wylds', 'hastra-prime')]),
  # ---------------------------------------------------------------- Global
  P('backpack-securities', 'Backpack Securities', 'acciones-y-capital-privado', 'global', 'Emisor', 'Minorista', 'Bajo', 'Solana', 'backpack-socios',
    'Emite acciones y ETF de EE. UU. tokenizados en Solana: cada token es un derecho frente a una sociedad vehículo que guarda la acción y se puede canjear 1 a 1 en Backpack Exchange.',
    'Acciones y ETF de EE. UU. tokenizados que se negocian las 24 horas en Solana y se canjean por la acción en Backpack Exchange.',
    [fuente('backpack-socios', 'empresa', 'Backpack · The infrastructure for tokenized equities'),
     fuente('backpack-acciones', 'empresa', 'Backpack · Stocks onchain')],
    {'backpack-socios': ['Backpack Securities issues tokenized U\\.S\\. stocks and ETFs', 'special purpose vehicle \\(SPV\\)', 'Who is the issuer\\? Backpack Securities'],
     'backpack-acciones': ['Tokenized stocks and ETFs on Solana', 'subject to eligibility and jurisdictional restrictions']},
    campo('observada', 'Su web enseña los valores tokenizados en circulación y sus cifras de negociación desde junio de 2026.', 'backpack-acciones'),
    campo('no_verificable', 'La web dice que el emisor es Backpack Securities, pero no qué licencia tiene ni en qué país está registrada.', 'backpack-socios', 'backpack-acciones'),
    campo('no_verificable', 'Dice que los valores tokenizados tienen restricciones de elegibilidad y de país, sin publicar cuáles.', 'backpack-acciones'),
    [alerta('derecho_sobre_vehiculo', 'El token no es la acción: es un derecho frente a la sociedad vehículo que la guarda, que se canjea por la acción en Backpack Exchange.', 'backpack-socios'),
     alerta('licencia_no_declarada', 'No dice dónde está registrada Backpack Securities ni quién la supervisa. ' + FUERA_UE, 'backpack-socios')]),
  P('onre', 'OnRe', 'credito-privado', 'global', 'Emisor', 'Minorista', 'Bajo', 'Solana', 'onre-docs',
    'Su token ONyc representa una parte de una cuenta segregada de Bermudas que respalda contratos de reaseguro. La interfaz pública avisa de que el token comprado por ella no da derechos frente a On Re SAC Ltd.',
    'Reaseguro tokenizado: el valor de ONyc sigue a las primas cobradas menos los siniestros de una cuenta segregada en Bermudas.',
    [fuente('onre-docs', 'empresa', 'OnRe · OnRe Tokenized Reinsurance (ONyc)'),
     fuente('onre-app', 'empresa', 'OnRe · Interfaz pública')],
    {'onre-docs': ['ring-fenced structure in Bermuda', 'reinsurance contracts'],
     'onre-app': ['do not confer any ownership, redemption, governance, or other legal or contractual rights against On Re SAC Ltd', 'Prohibited Jurisdiction', 'including the United States', 'No onboarding or minimums required', 'Regulated by the Bermuda Monetary Authority']},
    campo('observada', 'Su interfaz enseña el patrimonio y el valor de ONyc, y su documentación explica cómo se emite y se reembolsa.', 'onre-app', 'onre-docs'),
    campo('no_verificable', 'Habla de una cuenta segregada regulada en Bermudas, y su interfaz dice que la vía institucional la regula la Autoridad Monetaria de Bermudas; no lo hemos comprobado.', 'onre-docs', 'onre-app'),
    campo('confirmado_condicionado', 'Por la vía abierta se compra sin verificación ni mínimo, pero sin derechos frente al emisor; reembolsar al valor liquidativo exige la verificación institucional. La interfaz no se puede usar desde EE. UU. ni desde otros países que excluye.', 'onre-docs', 'onre-app'),
    [alerta('sin_derechos_por_interfaz', 'Los ONyc comprados por la interfaz pública no dan derechos de propiedad, reembolso ni voto frente a On Re SAC Ltd.', 'onre-app'),
     alerta('riesgo_siniestros', 'Si hay siniestros grandes, el valor baja: no es una moneda estable ni un depósito. ' + FUERA_UE, 'onre-docs')]),
]

if __name__ == '__main__':
    def plano(t): return re.sub(r'\s+', ' ', t)
    slugs = [p['slug'] for p in PLATAFORMAS]
    assert len(slugs) == len(set(slugs))
    fallos = []
    for p in PLATAFORMAS:
        usadas = {f['id'] for f in p['fuentes']}
        for fid, pats in p['comprobaciones'].items():
            assert fid in usadas, (p['slug'], fid)
            texto = plano(open(os.path.join(AQUI, L[fid]['archivo']), encoding='utf-8').read())
            for pat in pats:
                if not re.search(pat, texto, re.I): fallos.append(f'{p["slug"]}/{fid}: /{pat}/')
        for c in ['estadoOperativo', 'licenciaRegistro', 'acceso']:
            assert set(p['radar'][c]['fuentes']) <= usadas, (p['slug'], c)
            assert 24 <= len(p['radar'][c]['detalle']) <= 3000, (p['slug'], c)
        for a in p['radar']['alertasCriticas']:
            assert set(a['fuentes']) <= usadas and re.match(r'^[a-z0-9]+(?:_[a-z0-9]+)*$', a['codigo']), (p['slug'], a['codigo'])
        assert p['publica']['web'].startswith('https://')
    if fallos: raise SystemExit('No aparecen en la copia de hoy:\n' + '\n'.join(fallos))
    json.dump({'fecha': FECHA, 'regiones': REGIONES, 'plataformas': PLATAFORMAS, 'ofertas': []},
              open(os.path.join(AQUI, 'altas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(PLATAFORMAS)} plataformas; todas las frases aparecen en su copia de hoy')

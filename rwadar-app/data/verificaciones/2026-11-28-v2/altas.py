# Entrega 2026-11-28 · altas del informe de investigación de Codex del 28/11/2026, verificadas a mano ese día: 4 ofertas
# y 6 plataformas nuevas, cada dato con la fuente primaria leída como visitante (fuentes/lecturas-2026-11-28.json y sus
# copias, con los nombres de personas retirados).
#
# No entran (y por qué): NORVAULT / CanTra Bacon Series 001 y Metals.io xCu (sus webs y la nota de prensa bloquean el
# acceso desde aquí con Cloudflare/Akamai: no se elude); Ondo BIG5on y SPYSHIELDon (Ondo bloquea su web por país desde
# aquí); Banco Atlántida ALDT001-T40 (el aviso no dice cuántos tokens quedan ni hasta cuándo: entra solo la plataforma);
# winvesta Verde Beach (rentabilidad solo prevista y reserva: entra solo la plataforma); RealUnit (la FAQ no carga a quién
# admite ni el precio; para otro ciclo); Orbitum (Cloudflare); Fidelity FYOXX, JPMorgan JLTXX, Superstate VBDC, CUSHY,
# Aviva, €GOVY, pEAK, PST, Caliber, Herculis, Black Ant, Reity, Expedit, ALTOKEN, Blockprop, Elviria, Piece, DomusX,
# Tortuga, ATME (en administración), STOKR, AndX, TokenKey, GORO/IDDB/GIDR, ANTB y los 10 prospectos de ADGM, ChinaAMC,
# JPE de Bybit, JQQQ, Seven Stars, Opus, Yield8, HYBOND, Goldbits y la lista de avisos TSV de la SEC: el propio informe
# los deja en revisión o vigilancia, sin condiciones de suscripción comprobables hoy.
#   python3 rwadar-app/data/verificaciones/2026-11-28-v2/altas.py
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
FECHA, FES = '2026-11-28', '28/11/2026'
EDITORIAL = 'Referencia editorial gratuita. El proveedor comprueba admisión, condiciones y riesgos; RWAdar no recibe dinero de inversiones.'
L = json.load(open(os.path.join(AQUI, 'fuentes/lecturas-2026-11-28.json')))
U = {k: v['url'] for k, v in L.items()}
FUERA_UE = 'No tiene folleto ni KID europeos y la CNMV no la supervisa: lo que ofrece se rige por la ley de su país.'

def fuente(fid, tipo, titulo):
    return {'id': fid, 'tipo': tipo, 'titulo': titulo, 'url': U[fid], 'primaria': True, 'consultadaEl': FECHA}
def campo(estado, detalle, *fids): return {'estado': estado, 'detalle': detalle, 'fuentes': list(fids)}
def alerta(codigo, detalle, *fids): return {'codigo': codigo, 'detalle': detalle, 'fuentes': list(fids)}

# ------------------------------------------------------------------ plataformas nuevas
PLATAFORMAS = [
  {'slug': 'banco-atlantida', 'nombre': 'Banco Atlántida El Salvador',
   'publica': {'categoria_slug': 'credito-privado', 'region_slug': 'latinoamerica', 'actor': 'Marketplace', 'acceso': 'Minorista', 'ticket': 'Bajo',
               'cadenas': 'No la publica', 'web': U['atlantida-emisiones'],
               'aval': 'Banco salvadoreño. En sus avisos de oferta figura como proveedor de servicios de activos digitales registrado en la CNAD (PSAD-0035); no lo hemos comprobado en el registro de la CNAD.',
               'nota': 'Publica las ofertas públicas de activos digitales que coloca en El Salvador: tramos del token de deuda ALDT001 de Leasing Atlántida y tokens ligados a proyectos inmobiliarios.'},
   'fuentes': [fuente('atlantida-emisiones', 'empresa', 'Banco Atlántida El Salvador · Emisiones de activos digitales'),
               fuente('atlantida-t40', 'documento', 'Leasing Atlántida · Aviso de oferta pública de activos digitales ALDT001-T40 (13/11/2026)')],
   'comprobaciones': {'atlantida-emisiones': ['ofertas públicas y privadas de activos digitales', 'Oferta Pública ALDT001 \\(TRAMO 40\\)'],
                      'atlantida-t40': ['PSAD-0035', 'ALDT001-T40', 'asiento registral AD-00016']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web lista ofertas públicas de activos digitales. El último aviso, del tramo ALDT001-T40 de Leasing Atlántida (1.000.000 de tokens de 1 USD al 5,55 % anual a 181 días), dice que está disponible desde el 16/11/2026.', 'atlantida-emisiones', 'atlantida-t40'),
     'licenciaRegistro': campo('no_verificable', 'Los avisos dicen que el banco es proveedor registrado en la CNAD (PSAD-0035) y que la oferta está aprobada (asiento AD-00016); no lo hemos comprobado en el registro de la CNAD.', 'atlantida-t40'),
     'acceso': campo('no_verificable', 'Ni la web ni los avisos dicen quién puede comprar, desde qué países ni cuántos tokens quedan de cada tramo.', 'atlantida-emisiones', 'atlantida-t40'),
     'alertasCriticas': [alerta('fuera_ue', 'Ofertas de El Salvador. ' + FUERA_UE, 'atlantida-t40'),
                         alerta('acceso_sin_publicar', 'No publica cuántos tokens quedan ni cómo se compran desde fuera de El Salvador.', 'atlantida-emisiones')]}},
  {'slug': 'bondea', 'nombre': 'Bondea',
   'publica': {'categoria_slug': 'credito-privado', 'region_slug': 'union-europea', 'actor': 'Marketplace', 'acceso': 'Minorista', 'ticket': 'Medio',
               'cadenas': 'No la publica', 'web': U['bondea-proyectos'],
               'aval': 'Plataforma lituana de financiación participativa. Dice tener licencia y supervisión del Banco de Lituania y que los bonos se anotan en una cuenta de valores de Axiology DLT; no lo hemos comprobado en el registro del banco.',
               'nota': 'Bonos de empresas, sobre todo de proyectos inmobiliarios del Báltico y Polonia, desde 500 o 1.000 € según el proyecto; Bondea no cobra comisiones al inversor.'},
   'fuentes': [fuente('bondea-proyectos', 'empresa', 'Bondea · Proyectos de inversión'),
               fuente('bondea-duk', 'empresa', 'Bondea · Preguntas frecuentes')],
   'comprobaciones': {'bondea-proyectos': ['Mūsų investiciniai projektai', 'VPH vystomas prekybos parkas su Rimi parduotuve Rygoje \\(VI etapas\\)'],
                      'bondea-duk': ['Lietuvos banko licencijuota ir prižiūrima', 'Axiology DLT', 'Minimali investavimo suma „Bondea“ platformoje yra 500 arba 1000 EUR']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web tiene en captación el bono de la fase VI del parque comercial de VPH en Riga y muestra las fases anteriores ya financiadas.', 'bondea-proyectos'),
     'licenciaRegistro': campo('no_verificable', 'Dice ser una plataforma de financiación participativa con licencia y supervisión del Banco de Lituania; la página del registro del banco no se dejó leer el 28/11/2026 (control anti-bots), así que no lo hemos comprobado.', 'bondea-duk'),
     'acceso': campo('confirmado_condicionado', 'Pueden invertir personas físicas y jurídicas mayores de 18 años, residentes en Lituania o en otros países, tras registrarse y verificar su identidad; no dice qué países admite.', 'bondea-duk'),
     'alertasCriticas': [alerta('riesgo_alto', 'Son bonos de empresas que no cotizan: si el emisor no paga, puedes perder lo invertido.', 'bondea-proyectos'),
                         alerta('licencia_no_identificada', 'La licencia que declara no la hemos podido comprobar el 28/11/2026 en el registro del Banco de Lituania.', 'bondea-duk')]}},
  {'slug': 'axiology', 'nombre': 'Axiology',
   'publica': {'categoria_slug': 'infraestructura', 'region_slug': 'union-europea', 'actor': 'Infraestructura', 'acceso': 'Empresas', 'ticket': 'No aplica',
               'cadenas': 'XRP Ledger', 'web': U['axiology-web'],
               'aval': 'Empresa lituana que dice estar autorizada como sistema DLT de negociación y liquidación (régimen piloto de la UE, Reglamento 2022/858) y como empresa de servicios de inversión por el Banco de Lituania; no lo hemos comprobado en el registro.',
               'nota': 'Emite, custodia, negocia y liquida bonos tokenizados en el XRP Ledger para brókeres y plataformas de financiación participativa; su registro público lista 10 bonos de empresas lituanas.'},
   'fuentes': [fuente('axiology-web', 'empresa', 'Axiology · Capital Markets Made Easy'),
               fuente('axiology-bonos', 'empresa', 'Axiology TSS · Bond List')],
   'comprobaciones': {'axiology-web': ['Authorised under Regulation \\(EU\\) 2022/858', 'MIFID Investment firm authorised by the Bank of Lithuania', 'Permissioned infrastructure built on the XRP Ledger'],
                      'axiology-bonos': ['all digital securities registered within Axiology', 'LT0000139503', 'LT0000135352']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su registro público lista 10 bonos tokenizados emitidos entre el 31/08/2025 y el 25/11/2026; ninguno figura aún como admitido a negociación en Axiology.', 'axiology-bonos'),
     'licenciaRegistro': campo('no_verificable', 'Dice estar autorizada como sistema DLT de negociación y liquidación (Reglamento 2022/858) y como empresa de inversión por el Banco de Lituania; el registro del banco no se dejó leer el 28/11/2026.', 'axiology-web'),
     'acceso': campo('no_aplica_plataforma', 'Da servicio a bancos, brókeres y plataformas de financiación participativa; el particular invierte a través de ellos.', 'axiology-web'),
     'alertasCriticas': [alerta('infraestructura_b2b', 'No vende a particulares: es la infraestructura que usan otras plataformas.', 'axiology-web')]}},
  {'slug': 'marketnode', 'nombre': 'Marketnode',
   'publica': {'categoria_slug': 'infraestructura', 'region_slug': 'asia-pacifico', 'actor': 'Infraestructura', 'acceso': 'Institucional', 'ticket': 'No aplica',
               'cadenas': 'No la publica', 'web': U['marketnode-web'],
               'aval': 'Sociedad de Singapur con licencia de servicios de mercados de capitales de la MAS para negociar valores y participaciones de fondos y para custodia, según el directorio de la MAS (actualizado el 28/10/2026).',
               'nota': 'Infraestructura de mercado digital de Asia-Pacífico para que bancos y gestoras emitan, distribuyan y gestionen fondos y activos tokenizados para clientes institucionales. Cita como accionistas a Euroclear, HSBC, SGX Group, Stellar y Temasek.'},
   'fuentes': [fuente('marketnode-web', 'empresa', 'Marketnode · Digital market infrastructure'),
               fuente('mas-marketnode', 'regulador', 'MAS · Financial Institutions Directory · Marketnode Pte. Ltd.')],
   'comprobaciones': {'marketnode-web': ['digital market infrastructure \\(DMI\\) operator', 'Euroclear · HSBC · SGX Group · Stellar · Temasek', 'Tokenised RWAs, Built'],
                      'mas-marketnode': ['MARKETNODE PTE\\. LTD\\.', 'Capital Markets Services Licensee', 'Providing Custodial Services']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web presenta su pasarela de activos reales tokenizados para acceso institucional y su red de transacciones de fondos.', 'marketnode-web'),
     'licenciaRegistro': campo('confirmada_regulador', 'El directorio de la MAS la da como titular de una licencia de servicios de mercados de capitales (negociación de valores y de participaciones de fondos, y custodia).', 'mas-marketnode'),
     'acceso': campo('no_aplica_plataforma', 'Trabaja con entidades financieras; no ofrece inversión a particulares.', 'marketnode-web'),
     'alertasCriticas': [alerta('infraestructura_b2b', 'No vende a particulares: da servicio a bancos, gestoras y distribuidores.', 'marketnode-web')]}},
  {'slug': 'winvesta', 'nombre': 'winvesta',
   'publica': {'categoria_slug': 'inmobiliario', 'region_slug': 'union-europea', 'actor': 'Marketplace', 'acceso': 'Minorista', 'ticket': 'Medio',
               'cadenas': 'No la publica', 'web': U['winvesta-web'],
               'aval': 'Plataforma de Hamburgo; según su web, actúa como agente vinculado de Effecta GmbH (§ 3.2 de la ley alemana WpIG). No lo hemos comprobado en el registro de la BaFin.',
               'nota': 'Bonos tokenizados de proyectos inmobiliarios y otros activos reales desde 500 €; ahora capta para un terreno de playa en Cabo Verde, con rentabilidades solo previstas.'},
   'fuentes': [fuente('winvesta-web', 'empresa', 'winvesta · Alternative Assets. Für alle.'),
               fuente('winvesta-faq', 'empresa', 'winvesta · Häufig gestellte Fragen')],
   'comprobaciones': {'winvesta-web': ['tokenisierte Anlageklassen', 'ab 500 € Investment', 'gebundener Vermittler gemäß § 3 \\(2\\) WpIG der Effecta GmbH'],
                      'winvesta-faq': ['tokenisierte Schuldverschreibung']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su web muestra en «Aktuelle Projekte» tres clases del bono Verde Beach São Francisco (Cabo Verde), desde 5.000, 25.000 y 100.000 €, con rentabilidad solo prevista.', 'winvesta-web'),
     'licenciaRegistro': campo('no_verificable', 'Dice actuar como agente vinculado de Effecta GmbH, no con licencia propia; no lo hemos comprobado en el registro de la BaFin.', 'winvesta-web'),
     'acceso': campo('no_verificable', 'Su web no dice desde qué países se puede invertir.', 'winvesta-web'),
     'alertasCriticas': [alerta('licencia_de_tercero', 'Opera como agente vinculado de Effecta GmbH, no con una licencia propia.', 'winvesta-web')]}},
  {'slug': 'schindlersx', 'nombre': 'SchindlersX',
   'publica': {'categoria_slug': 'materias-primas', 'region_slug': 'africa', 'actor': 'Marketplace', 'acceso': 'Minorista', 'ticket': 'Bajo',
               'cadenas': 'No la publica', 'web': U['schindlersx-marketplace'],
               'aval': 'La opera Schindlers Digital Assets (Pty) Ltd, que dice ser proveedor de servicios financieros registrado en Sudáfrica (FSP 53789, autorizado por la FSCA); no lo hemos comprobado en el registro de la FSCA.',
               'nota': 'Mercado sudafricano de activos tokenizados: plata (SilverBits), inmuebles y capital privado. Muchas de sus fichas están «próximamente», agotadas o cerradas.'},
   'fuentes': [fuente('schindlersx-marketplace', 'empresa', 'SchindlersX · Marketplace'),
               fuente('schindlersx-about', 'empresa', 'SchindlersX · About'),
               fuente('schindlersx-silverbits', 'empresa', 'SchindlersX · SilverBits SLVR')],
   'comprobaciones': {'schindlersx-marketplace': ['SilverBits SLVR', 'Fully raised', 'Offer closed'],
                      'schindlersx-about': ['Schindlers Digital Assets \\(Pty\\) Ltd, a registered Financial Services Provider, FSP 53789'],
                      'schindlersx-silverbits': ['Open to South African and international investors', 'Restrictions apply']},
   'radar': {
     'estadoOperativo': campo('observada', 'Su mercado muestra en directo el token de plata SilverBits; muchas de las demás fichas están «próximamente», agotadas o cerradas.', 'schindlersx-marketplace'),
     'licenciaRegistro': campo('no_verificable', 'Dice operar con Schindlers Digital Assets (Pty) Ltd, proveedor de servicios financieros FSP 53789 autorizado por la FSCA; no lo hemos comprobado en el registro de la FSCA.', 'schindlersx-about'),
     'acceso': campo('confirmado_condicionado', 'SilverBits se abre a inversores de Sudáfrica y de otros países, con restricciones que la ficha no detalla.', 'schindlersx-silverbits'),
     'alertasCriticas': [alerta('fuera_ue', 'Plataforma sudafricana. ' + FUERA_UE, 'schindlersx-about')]}},
]

# ------------------------------------------------------------------ ofertas
def aviso(t, tono='warn'): return {'texto': t, 'tono': tono, 'esAntiguedad': False, 'verificadaEl': FECHA}
def ref(etiqueta, valor, fid, fechaDato, alcance): return {'etiqueta': etiqueta, 'valor': valor, 'fechaDato': fechaDato, 'fechaConsulta': FECHA, 'fuente': U[fid], 'alcance': alcance}
def tr(fid, titulo): return {'titulo': titulo, 'url': U[fid]}
def crit(cumple, motivo, fid, titulo): return {'cumple': cumple, 'motivo': motivo, 'fuente': tr(fid, titulo), 'consultadaEl': FECHA}
def lit(fid, titulo, literal):
    assert literal in open(os.path.join(AQUI, L[fid]['archivo']), encoding='utf-8').read(), (fid, literal)
    return {'url': U[fid], 'titulo': titulo, 'literal': literal, 'consultadaEl': FECHA}
def disp(admitidos, excluidos, con, fuentes, nota, nota_en):
    return {'admitidos': admitidos, 'excluidos': excluidos, 'conRequisitos': con, 'fuentes': fuentes, 'nota': nota, 'notaEn': nota_en, 'verificadaEl': FECHA}

TIPO_VALOR = {'schindlersx-silverbits-slvr'}
EU = {'LV'}

def oferta(slug, plataforma, nombre_plat, titulo, categoria, pais, moneda, coleccion, disponible, resumen, url_fid, rent, metricas, avisos, fuentes_fids,
           descripcion, caracteristicas, referencias, disponibilidad, transparencia, editorial):
    return {'oferta': {'slug': slug, 'tipo': 'valor' if slug in TIPO_VALOR else 'rendimiento', 'titulo': titulo, 'plataformaSlug': plataforma, 'plataformaNombre': nombre_plat,
                       'categoria': categoria, 'pais': pais, 'resumen': resumen, 'url': U[url_fid], 'cta': 'Ver fuente', 'imagenAlt': titulo,
                       'verificadaEl': FECHA, 'vigenciaDias': 7, 'permanente': False, 'disponibleEs': disponible, 'eu': pais in EU,
                       'fueraLadrillo': categoria != 'Inmobiliario', 'puntuacion': None, 'rentabilidad': rent, 'precio': None,
                       'estadoRevision': 'actual' if coleccion == 'principales' else 'no_verificable',
                       'coleccion': coleccion, 'moneda': moneda, 'patrocinada': False, 'metricas': metricas,
                       'avisos': [aviso(EDITORIAL)] + [a if isinstance(a, dict) else aviso(a) for a in avisos], 'fuentesActuales': [U[f] for f in fuentes_fids]},
            'documentacion': {'revisadaEl': FECHA, 'descripcion': descripcion, 'fuentes': list(dict.fromkeys(U[f] for f in fuentes_fids)),
                              'caracteristicas': caracteristicas, 'referencias': referencias, 'disponibilidad': disponibilidad},
            'transparencia': {'verificadaEl': FECHA, 'anadidaEl': FECHA, **transparencia},
            'editorial': editorial}

TOKINVEST_SUP = lambda f: crit(False, 'La distribuye Tokinvest con su licencia de VARA (Dubái), no un supervisor de la UE; no está inscrita en la CNMV.', f, 'Tokinvest · LynxCap')
TOKINVEST_DOC = lambda f: crit(False, 'No hay folleto ni KID europeos para este token; la ficha y el whitepaper están en inglés.', f, 'Tokinvest · LynxCap')

OFERTAS = [
  oferta('superstate-invesco-iroxx', 'superstate', 'Superstate', 'Invesco IROXX: el monetario tokenizado para las reservas de las monedas estables',
    'Tesoro y fondos', 'US', 'USD', 'principales', None,
    'Fondo monetario estadounidense de Invesco (Rule 2a-7) en Ethereum, pensado para guardar las reservas de emisores de monedas estables: invierte en deuda pública de EE. UU. a corto plazo y busca mantener 1 USD por participación. Desde 1.000.000 USD, en Superstate.',
    'superstate-iroxx', {'mostrada': '3,61 %', 'literal': f'Rentabilidad SEC a 7 días a 26/11/2026 (3,41 % sin la renuncia de comisiones), según Superstate (consultada el {FES}). Es pasada y cambia cada día; no está garantizada.'},
    [{'etiqueta': 'Mínimo', 'valor': '1.000.000 USD'}, {'etiqueta': 'Gestora', 'valor': 'Invesco Advisers, Inc.'},
     {'etiqueta': 'Fondo', 'valor': 'Monetario de EE. UU. (SEC Rule 2a-7); custodio y administrador, The Bank of New York'},
     {'etiqueta': 'Suscripción y reembolso', 'valor': 'El mismo día, hasta las 17:00 (hora de Nueva York), en USD o USDC'},
     {'etiqueta': 'Gastos', 'valor': '0,36 % bruto y 0,20 % neto al año (renuncia de la gestora hasta el 31/12/2027)'},
     {'etiqueta': 'Patrimonio', 'valor': '10.087.998 USD (26/11/2026)'}],
    ['Solo para inversores de los países que admite Superstate y desde 1.000.000 USD: no es para particulares.',
     'Un fondo monetario no es un depósito: busca mantener 1 USD por participación, pero no lo garantiza y puedes perder dinero.',
     'Está pensado para emisores de monedas estables: si varios reembolsan a la vez, el fondo puede sufrir en liquidez, rentabilidad y gastos.',
     'El fondo no invierte en monedas estables ni en sus emisores.',
     'Es nuevo y la tecnología blockchain añade riesgos de red, de wallet y de ciberataques.',
     'Fondo de EE. UU. ' + FUERA_UE],
    ['superstate-iroxx'],
    'El Invesco Stablecoin Reserves Onchain Fund (IROXX) es un fondo monetario de EE. UU. (Rule 2a-7) que gestiona Invesco Advisers y que invierte en deuda pública estadounidense a corto plazo, con el objetivo de mantener 1 USD por participación. La propiedad de las participaciones se lleva como un token en Ethereum. Se suscribe y reembolsa el mismo día en USD o USDC, desde 1.000.000 USD, a través de Superstate (agente de transferencias delegado); el custodio y administrador es The Bank of New York. Superstate da a 26/11/2026 un patrimonio de 10.087.998 USD y una rentabilidad SEC a 7 días del 3,61 % (3,41 % sin la renuncia de comisiones).',
    [{'etiqueta': 'Proveedor', 'valor': 'Superstate (agente de transferencias delegado: Superstate Services LLC)'}, {'etiqueta': 'Emisor', 'valor': 'Invesco Stablecoin Reserves Onchain Fund (gestora: Invesco Advisers, Inc.)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Participaciones del fondo monetario, registradas como token IROXX en Ethereum'},
     {'etiqueta': 'Moneda', 'valor': 'USD'}],
    [ref('Mínimo de inversión', 'Desde 1.000.000 USD', 'superstate-iroxx', None, 'Ficha de IROXX en Superstate (Minimum investment).'),
     ref('Acceso desde España', 'Sin confirmar: solo inversores de los países que admite Superstate, sin lista en la ficha', 'superstate-iroxx', None, 'Ficha de IROXX (Eligible investors: «Investors in supported jurisdictions»).'),
     ref('Reembolso', 'El mismo día, hasta las 17:00 de Nueva York, en USD o USDC', 'superstate-iroxx', None, 'Ficha de IROXX (Redemption timing).'),
     ref('Rentabilidad publicada', '3,61 % SEC a 7 días (3,41 % sin subvención) a 26/11/2026', 'superstate-iroxx', '2026-11-26', 'Ficha de IROXX en Superstate, datos a 26/11/2026; rentabilidad pasada.'),
     ref('Gastos', '0,36 % bruto y 0,20 % neto al año', 'superstate-iroxx', '2026-11-26', 'Ficha de IROXX: la gestora renuncia a parte de las comisiones al menos hasta el 31/12/2027.')],
    disp([], [], [], [lit('superstate-iroxx', 'Superstate · ficha de IROXX', 'Investors in supported jurisdictions')],
         'Superstate solo lo abre a inversores de los países que admite, pero la ficha no publica la lista. Pide además 1.000.000 USD como mínimo.',
         'Superstate only opens it to investors in the jurisdictions it supports, but the page does not list them. It also requires a USD 1,000,000 minimum.'),
    {'supervisada': crit(False, 'Fondo monetario registrado en EE. UU. y supervisado por la SEC, no por un supervisor de la UE; no está inscrito en la CNMV.', 'superstate-iroxx', 'Superstate · IROXX'),
     'documentoEspana': crit(False, 'Hay folleto en inglés para EE. UU.; no hay KID europeo ni documento en castellano.', 'superstate-iroxx', 'Superstate · IROXX'),
     'minimoCorto': '1.000.000 USD', 'salidaCorta': 'Reembolso el mismo día', 'puntos': [{'texto': 'Custodio: The Bank of New York', 'fuente': tr('superstate-iroxx', 'Superstate · IROXX')}]},
    {'escena': 'tesoro', 'lugar': 'Nueva York · EE. UU.', 'pasos': ['Abres cuenta en Superstate', 'El fondo invierte a corto plazo', 'Reembolsas el mismo día'], 'concepto': 'deuda pública de EE. UU. a corto plazo',
     'foto': {'semilla': 1101, 'encuadre': '70% 55%', 'concepto': 'fachadas de piedra de bancos del sur de Manhattan, imagen genérica; no la sede de la gestora', 'prompt': 'classic stone bank facades on a narrow street in lower Manhattan, early morning light, empty sidewalk, no signs or logos'}}),

  oferta('tokinvest-lynxcap-bono', 'tokinvest', 'Tokinvest', 'LynxCap: bono tokenizado sobre préstamos impagados e inmuebles recuperados en Europa',
    'Crédito privado', 'AE', 'EUR', 'principales', False,
    'Token de un bono senior garantizado de LynxCap (Suiza) respaldado por préstamos impagados o con retrasos e inmuebles recuperados por bancos en Europa. Cupón fijo cada trimestre, a 4 años con salidas anticipadas en 2028 y 2029. Desde 10.000 €, solo para inversores elegibles de Emiratos, en Tokinvest.',
    'tokinvest-lynxcap', None,
    [{'etiqueta': 'Mínimo', 'valor': '10.000 EUR o su equivalente en USD'}, {'etiqueta': 'Gestora', 'valor': 'LynxCap Investments AG (Zug, Suiza)'},
     {'etiqueta': 'Emisor del token', 'valor': 'LCL Opportunities 3 S.à r.l. (Luxemburgo)'},
     {'etiqueta': 'Bono de referencia', 'valor': 'Senior garantizado, ISIN XS3356029788, de LCL Opportunities SCS'},
     {'etiqueta': 'Plazo', 'valor': '4 años; salidas anticipadas en 2028 y 2029'},
     {'etiqueta': 'Cupón', 'valor': 'Fijo, cada trimestre (la ficha no publica el tipo)'},
     {'etiqueta': 'Custodia', 'valor': 'Hex Trust MENA, en wallets segregadas'}],
    ['Solo para inversores elegibles de Emiratos que pasen la verificación de Tokinvest.',
     'La ficha no publica el tipo de interés: pídelo antes de invertir.',
     'Los préstamos impagados y los inmuebles recuperados son activos de riesgo: si no se cobran o se venden por menos, puedes perder parte o todo.',
     'Tienes la exposición a través de Tokinvest, que figura como titular en el registro del emisor del token; no frente al emisor del bono.',
     'Regulado en Dubái (VARA), no en la UE. ' + FUERA_UE],
    ['tokinvest-lynxcap'],
    'Tokinvest distribuye en Emiratos, con su licencia de VARA, un token de bono de LynxCap Investments AG (Zug, Suiza), especialista en préstamos con garantía inmobiliaria en Europa. El token lo emite LCL Opportunities 3 S.à r.l. (Luxemburgo) y remite a un bono senior garantizado (ISIN XS3356029788) de LCL Opportunities SCS, emitido en un programa de la Bolsa de Luxemburgo y respaldado por carteras de préstamos impagados o con retrasos e inmuebles recuperados. Paga un cupón fijo cada trimestre, dura cuatro años y tiene salidas anticipadas en 2028 y 2029. Desde 10.000 €; los tokens los custodia Hex Trust MENA. El token está en Tokinvest desde julio de 2026 y abierto a inversores elegibles.',
    [{'etiqueta': 'Proveedor', 'valor': 'Tokinvest (distribuidor con licencia de VARA)'}, {'etiqueta': 'Emisor', 'valor': 'LCL Opportunities 3 S.à r.l. (token); LCL Opportunities SCS (bono)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Un token que remite a un bono senior garantizado, a través de Tokinvest; no los préstamos ni los inmuebles'},
     {'etiqueta': 'Moneda', 'valor': 'EUR (o su equivalente en USD)'}],
    [ref('Mínimo de inversión', 'Desde 10.000 € o su equivalente en USD', 'tokinvest-lynxcap', None, 'Ficha de LynxCap en Tokinvest (Minimum investment).'),
     ref('Acceso desde España', 'No disponible: solo para inversores elegibles de Emiratos', 'tokinvest-lynxcap', None, 'Ficha de LynxCap: «eligible investors in the UAE».'),
     ref('Salida', 'Al vencimiento (4 años) o en las salidas anticipadas de 2028 y 2029', 'tokinvest-lynxcap', None, 'Ficha de LynxCap (Term): «issuer call and investor put in 2028 and a further put in 2029».'),
     ref('Estado de la oferta · 28/11/2026', 'En Tokinvest desde julio de 2026 y abierta a inversores elegibles', 'tokinvest-lynxcap', '2026-11-28', 'Ficha de LynxCap: «open to eligible investors now».')],
    disp([], ['*'], [{'paises': ['AE'], 'requisito': 'Ser inversor elegible en Emiratos y superar la verificación de Tokinvest', 'requisitoEn': 'Be an eligible investor in the UAE and pass Tokinvest’s onboarding checks'}],
         [lit('tokinvest-lynxcap', 'Tokinvest · ficha de LynxCap', 'It gives eligible investors in the UAE access, from EUR 10,000, to a type of credit usually held by funds and institutions.'),
          lit('tokinvest-lynxcap', 'Tokinvest · ficha de LynxCap', 'Every investor goes through our onboarding and eligibility checks before they can subscribe, and transfers are restricted to verified, eligible wallets.')],
         'Tokinvest lo distribuye solo a inversores elegibles de Emiratos, que antes pasan su verificación. Fuera de Emiratos, no disponible.',
         'Tokinvest only distributes it to eligible investors in the UAE, after its checks. Outside the UAE, not available.'),
    {'supervisada': TOKINVEST_SUP('tokinvest-lynxcap'), 'documentoEspana': TOKINVEST_DOC('tokinvest-lynxcap'),
     'minimoCorto': '10.000 €', 'salidaCorta': 'Al vencimiento (4 años)', 'puntos': [{'texto': 'Tokens custodiados por Hex Trust MENA', 'fuente': tr('tokinvest-lynxcap', 'Tokinvest · LynxCap')}]},
    {'escena': 'empresa', 'op': {'forma': 'oficina'}, 'lugar': 'Zug · Suiza', 'pasos': ['Compras el token del bono', 'Cobras el cupón cada trimestre', 'Recuperas el nominal al final'], 'concepto': 'préstamos con garantía inmobiliaria en Europa',
     'foto': {'semilla': 1117, 'encuadre': '70% 55%', 'concepto': 'un bloque de pisos antiguo y vacío en una ciudad del sur de Europa, imagen genérica de inmuebles recuperados; no un activo del bono', 'prompt': 'empty older apartment building with closed shutters on a quiet street in a southern European town, overcast daylight, no people, no signs'}}),

  oferta('bondea-vph-riga-vi', 'bondea', 'Bondea', 'Parque comercial con Rimi en Riga: bono a 16 meses al 9 % en Bondea, desde 1.000 €',
    'Inmobiliario', 'LV', 'EUR', 'principales', None,
    'Bono de financiación participativa para la fase VI de un parque comercial con supermercado Rimi que promueve VPH en Riga (Letonia): 9 % anual, intereses cada seis meses y devolución a los 16 meses. Desde 1.000 €. El 28/11 llevaba 415.000 € de 750.000 € y le quedaban 7 días.',
    'bondea-vph6', {'mostrada': '9,00 %', 'literal': f'Interés anual del 9 %, pagado cada seis meses, según la ficha de Bondea (consultada el {FES}). La ficha anuncia hasta un 10,5 % que no se explica sin entrar en la cuenta: aquí solo se muestra el 9 %.'},
    [{'etiqueta': 'Mínimo', 'valor': '1.000 EUR (una obligación)'}, {'etiqueta': 'Proyecto', 'valor': 'Parque comercial con supermercado Rimi, Valmieras iela 2, Riga (fase VI)'},
     {'etiqueta': 'Plazo', 'valor': '16 meses; intereses cada seis meses'},
     {'etiqueta': 'Préstamo sobre garantía', 'valor': 'LTV del 80 %'},
     {'etiqueta': 'Captado', 'valor': '415.000 € de 750.000 € (28/11/2026)'},
     {'etiqueta': 'Plazo de suscripción', 'valor': 'Quedaban 7 días el 28/11/2026'},
     {'etiqueta': 'Registro', 'valor': 'Los bonos de Bondea se anotan en una cuenta de valores de Axiology DLT'}],
    ['Es financiación participativa a un promotor: si el proyecto no va bien, puedes perder lo invertido.',
     'Un LTV del 80 % significa que el préstamo es el 80 % de la garantía: un margen estrecho si el inmueble vale menos.',
     'La información completa del proyecto solo se ve con una cuenta de Bondea.',
     'Quedan pocos días de suscripción y la ficha no dice qué pasa si no se llega a los 750.000 €.',
     'A los no residentes, Bondea les retiene un 15 % de impuesto lituano sobre los intereses.',
     'Esta fase aún no aparece en el registro público de Axiology; sí aparecen bonos anteriores de Bondea.'],
    ['bondea-vph6', 'bondea-duk', 'axiology-bonos'],
    'Bondea, plataforma lituana de financiación participativa, capta 750.000 € para la fase VI del parque comercial con supermercado Rimi que desarrolla VPH en Valmieras iela 2 (Riga, Letonia). Son obligaciones a 16 meses de 1.000 € cada una, con un 9 % de interés anual pagado cada seis meses (la ficha anuncia una horquilla del 9 % al 10,5 %) y un LTV del 80 %. El 28/11/2026 llevaba 415.000 € y le quedaban 7 días. Según Bondea, los bonos que se compran en su plataforma se anotan en una cuenta de valores de Axiology DLT, sistema DLT lituano; esta fase todavía no figura en el registro público de Axiology.',
    [{'etiqueta': 'Proveedor', 'valor': 'Bondea (UAB Bondea, Lituania)'}, {'etiqueta': 'Emisor', 'valor': 'La sociedad del proyecto de VPH (la ficha pública no da su nombre)'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Obligaciones (bonos) del proyecto; no la propiedad del parque comercial'},
     {'etiqueta': 'Moneda', 'valor': 'EUR'}],
    [ref('Mínimo de inversión', 'Desde 1.000 € (una obligación)', 'bondea-vph6', None, 'Ficha del proyecto en Bondea (Obligacijos kaina).'),
     ref('Acceso desde España', 'Sin confirmar: admite residentes de Lituania y de otros países, sin lista', 'bondea-duk', None, 'Preguntas frecuentes de Bondea: quién puede invertir.'),
     ref('Salida', 'Al vencimiento (16 meses); la ficha no menciona venta antes', 'bondea-vph6', None, 'Ficha del proyecto (Obligacijų terminas: 16 mėn.).'),
     ref('Rentabilidad publicada', '9 % anual, cada seis meses (horquilla anunciada del 9 % al 10,5 %)', 'bondea-vph6', None, 'Ficha del proyecto (Metinė palūkanų norma 9 %; Metinis pajamingumas 9 %-10.50 %).'),
     ref('Estado de la oferta · 28/11/2026', '415.000 € de 750.000 €; quedaban 7 días', 'bondea-vph6', '2026-11-28', 'Ficha del proyecto (Surinkta, Tikslas, Liko 7 dienos).'),
     ref('Registro en DLT', 'Bonos anotados en Axiology DLT; esta fase aún no figura en su registro', 'axiology-bonos', None, 'Preguntas frecuentes de Bondea y registro público de bonos de Axiology.')],
    disp(['LT'], [], [], [lit('bondea-duk', 'Bondea · preguntas frecuentes', 'Investuoti ir registruotis gali ne jaunesni nei 18 metų asmenys – tiek Lietuvos, tiek užsienio valstybių gyventojai.')],
         'Bondea admite a residentes de Lituania y de otros países, mayores de 18 años y con la identidad verificada, pero no publica qué países: fuera de Lituania, sin confirmar.',
         'Bondea accepts residents of Lithuania and other countries, aged 18+ with verified identity, but does not say which countries: outside Lithuania, unconfirmed.'),
    {'supervisada': crit(False, 'Bondea dice tener licencia de financiación participativa del Banco de Lituania; no lo hemos podido comprobar el 28/11/2026 en el registro, y no está inscrita en la CNMV.', 'bondea-duk', 'Bondea · preguntas frecuentes'),
     'documentoEspana': crit(False, 'No hay documento en castellano a la vista: la ficha está en lituano y la información completa pide cuenta.', 'bondea-vph6', 'Bondea · ficha del proyecto'),
     'minimoCorto': '1.000 €', 'salidaCorta': 'Al vencimiento (16 meses)', 'puntos': []},
    {'escena': 'empresa', 'op': {'forma': 'tienda'}, 'lugar': 'Riga · Letonia', 'pasos': ['Suscribes el bono', 'Cobras el interés cada semestre', 'Recuperas el nominal al final'], 'concepto': 'un parque comercial en Riga',
     'foto': {'semilla': 1129, 'encuadre': '70% 55%', 'concepto': 'un parque comercial de una planta con aparcamiento en las afueras de una ciudad báltica, imagen genérica; no el del proyecto', 'prompt': 'single-storey retail park with large glass entrance and car park on the outskirts of a Baltic city, birch trees, overcast autumn day, no logos or signs'}}),

  oferta('schindlersx-silverbits-slvr', 'schindlersx', 'SchindlersX', 'SilverBits: plata en tokens de una onza, canjeables por lingotes de 1 kg en Sudáfrica',
    'Materias primas', 'ZA', 'ZAR', 'principales', None,
    'Cada token SLVR equivale a una onza troy de plata fina al 99,9 %, guardada en Union Vault y asegurada por Lloyd’s de Londres. Se compra desde 1 token en SchindlersX (unos 1.021 rand, 58,84 USD, el 28/11) y se puede canjear por lingotes de 1 kg que se recogen en Sudáfrica.',
    'schindlersx-silverbits', None,
    [{'etiqueta': 'Mínimo', 'valor': '1 token (1 onza de plata): 1.021,36 ZAR, 58,84 USD (28/11/2026)'},
     {'etiqueta': 'Respaldo', 'valor': '1 token = 1 onza troy (31,1035 g) de plata fina al 99,9 %'},
     {'etiqueta': 'Custodia', 'valor': 'Union Vault, con seguro de Lloyd’s de Londres'},
     {'etiqueta': 'Canje', 'valor': 'Desde 32,1507 tokens, un lingote de 1 kg; se recoge en Sudáfrica o queda en Union Vault a tu nombre'},
     {'etiqueta': 'Reservas', 'valor': 'Atestación mensual con informes de auditoría independiente'},
     {'etiqueta': 'Emisor', 'valor': 'SA SilverBits (Pty) Ltd'}],
    ['El precio sigue a la plata y va en rand: si la plata o el rand caen frente al euro, pierdes.',
     'Canjear por un lingote tiene su propia comisión, que cubre la fundición y se presupuesta en cada caso.',
     'SilverBits no envía ni exporta la plata: el lingote se recoge en persona en Sudáfrica o se queda en Union Vault.',
     'Abierto a inversores de Sudáfrica y de otros países, con restricciones que la ficha no detalla.',
     'Producto sudafricano. ' + FUERA_UE],
    ['schindlersx-silverbits'],
    'SilverBits es un token (SLVR) de SA SilverBits (Pty) Ltd que se compra y vende en SchindlersX, el mercado de Schindlers Digital Assets (Pty) Ltd (FSP 53789 en Sudáfrica). Cada token representa una onza troy (31,1035 g) de plata fina al 99,9 %, guardada en Union Vault y asegurada por Lloyd’s de Londres, con atestaciones mensuales de las reservas. Se compra desde 1 token (1.021,36 rand o 58,84 USD el 28/11/2026) y se negocia en SchindlersX a cualquier hora. Desde 32,1507 tokens se puede canjear por un lingote de 1 kg, pagando su fundición, que se recoge en Sudáfrica o se deja en Union Vault a nombre del titular.',
    [{'etiqueta': 'Proveedor', 'valor': 'SchindlersX (Schindlers Digital Assets (Pty) Ltd, FSP 53789)'}, {'etiqueta': 'Emisor', 'valor': 'SA SilverBits (Pty) Ltd'},
     {'etiqueta': 'Qué se adquiere', 'valor': 'Un token respaldado por una onza de plata guardada en Union Vault, canjeable por lingotes de 1 kg'},
     {'etiqueta': 'Moneda', 'valor': 'ZAR (también se muestra en USD)'}],
    [ref('Mínimo de inversión', 'Desde 1 token (1 onza de plata): 1.021,36 ZAR (28/11)', 'schindlersx-silverbits', '2026-11-28', 'Ficha de SilverBits en SchindlersX (Price per token; Start from 1 SLVR).'),
     ref('Acceso desde España', 'Sin confirmar: abierto a inversores internacionales con restricciones sin detallar', 'schindlersx-silverbits', None, 'Ficha de SilverBits: «Open to South African and international investors… Restrictions apply».'),
     ref('Salida', 'Venta en SchindlersX a cualquier hora, o canje por lingotes de 1 kg en Sudáfrica', 'schindlersx-silverbits', None, 'Ficha de SilverBits (Flexible exit; Redemption).')],
    disp(['ZA'], [], [], [lit('schindlersx-silverbits', 'SchindlersX · ficha de SilverBits', 'Open to South African and international investors. Physical redemption is fulfilled in South Africa. * Restrictions apply.')],
         'Abierto a inversores de Sudáfrica y de otros países, pero con restricciones que la ficha no detalla: fuera de Sudáfrica, sin confirmar.',
         'Open to South African and international investors, but with restrictions the page does not detail: outside South Africa, unconfirmed.'),
    {'supervisada': crit(False, 'La plataforma dice ser proveedor de servicios financieros autorizado en Sudáfrica (FSCA); no es un supervisor de la UE y no está inscrita en la CNMV.', 'schindlersx-silverbits', 'SchindlersX · SilverBits SLVR'),
     'documentoEspana': crit(False, 'Hay memorando y términos en inglés; no hay folleto ni KID europeos.', 'schindlersx-silverbits', 'SchindlersX · SilverBits SLVR'),
     'minimoCorto': '1 onza de plata', 'salidaCorta': 'Venta o canje por lingote', 'puntos': [{'texto': 'Plata en Union Vault, con seguro', 'fuente': tr('schindlersx-silverbits', 'SchindlersX · SilverBits SLVR')}]},
    {'escena': 'empresa', 'op': {'forma': 'nave'}, 'lugar': 'Johannesburgo · Sudáfrica', 'pasos': ['Compras onzas en tokens', 'Union Vault guarda la plata', 'Vendes o canjeas un lingote'], 'concepto': 'lingotes de plata',
     'foto': {'semilla': 1151, 'encuadre': '70% 55%', 'concepto': 'plata fundida vertiéndose en un molde de lingote en una fundición, imagen genérica; no la del producto', 'prompt': 'close-up of glowing molten silver being poured from a crucible into a plain steel ingot mold in a small foundry, sparks, dark background, no text, no people'}}),
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

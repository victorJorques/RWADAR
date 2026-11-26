# Entrega 2026-11-26.4 · plataformas del radar del informe global de Codex (sección 09), verificadas a mano el
# 26/11/2026 sin agentes. Solo entran las que se comprobaron reales y activas en su propia web (o en el registro de su
# supervisor), leída ese día como visitante; los avisos de cookies se aceptaron para ver la página (orden de la
# dirección del 26/11/2026). Cada dato lleva su fuente (fuentes/lecturas-2026-11-26.json y sus copias) y las frases
# que la respaldan (comprobaciones), que este guion busca en la copia de hoy.
#
# No entran (y por qué): AndX (anuncia un «24 % de rentabilidad mínima preferente» sin regulador identificable),
# Expedit (dice estar supervisada a la vez por la CNMV, la SEC y la FINRA sin un solo número de registro), Tokenia
# (piloto en una red de pruebas, sin proyectos abiertos), PropertyHandle (aún no ofrece nada: espera al regulador),
# Mercado Bitcoin y WisdomTree (403 a la lectura) y DAMREV (429); RedSwan, Binaryx y NewEarthX las deja fuera el
# propio informe.
#   python3 rwadar-app/data/verificaciones/2026-11-26.4-v2/plataformas.py
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
FECHA = '2026-11-26'
L = json.load(open(os.path.join(AQUI, 'fuentes/lecturas-2026-11-26.json')))
U = {k: v['url'] for k, v in L.items()}

def fuente(fid, tipo, titulo):
    return {'id': fid, 'tipo': tipo, 'titulo': titulo, 'url': U[fid], 'primaria': True, 'consultadaEl': FECHA}

def campo(estado, detalle, *fids):
    return {'estado': estado, 'detalle': detalle, 'fuentes': list(fids)}

def alerta(codigo, detalle, *fids):
    return {'codigo': codigo, 'detalle': detalle, 'fuentes': list(fids)}

REGIONES = [{'slug': 'africa', 'nombre': 'África'}, {'slug': 'oriente-medio', 'nombre': 'Oriente Medio'}]

def P(slug, nombre, cat, region, actor, acceso, ticket, cadenas, web, aval, nota, fuentes, comprobaciones, eo, lic, acc, alertas):
    return {'slug': slug, 'nombre': nombre,
            'publica': {'categoria_slug': cat, 'region_slug': region, 'actor': actor, 'acceso': acceso, 'ticket': ticket,
                        'cadenas': cadenas, 'web': U[web], 'aval': aval, 'nota': nota},
            'fuentes': fuentes, 'comprobaciones': comprobaciones,
            'radar': {'estadoOperativo': eo, 'licenciaRegistro': lic, 'acceso': acc, 'alertasCriticas': alertas}}

FUERA_UE = 'No tiene folleto ni KID europeos y la CNMV no la supervisa: lo que ofrece se rige por la ley de su país.'

PLATAFORMAS = [
  # ---------------------------------------------------------------- Latinoamérica
  P('raiz', 'Raíz', 'inmobiliario', 'latinoamerica', 'Marketplace', 'Minorista', 'Bajo', 'Polygon', 'raiz-web',
    'Empresa con sede en Buenos Aires y Montevideo que publica inmuebles tokenizados con su registro en Polygon. En su web no declara una licencia de valores.',
    'Inmuebles tokenizados (sobre todo viviendas en alquiler en Miami) desde 50 dólares, con renta mensual en dólares y reventa en la propia plataforma.',
    [fuente('raiz-web', 'empresa', 'Raíz · Invierte en real estate tokenizado')],
    {'raiz-web': ['Invierte en real estate tokenizado', 'desde USD 50', 'Polygon']},
    campo('observada', 'Su web enseña propiedades tokenizadas, alguna ya agotada, y explica cómo invertir desde 50 dólares.', 'raiz-web'),
    campo('sin_registro_declarado', 'La web no dice que la plataforma tenga una licencia de valores en Argentina ni en otro país.', 'raiz-web'),
    campo('no_verificable', 'Habla de «inversores registrados», pero no publica qué países admite ni qué requisitos pide.', 'raiz-web'),
    [alerta('sin_licencia_declarada', 'No declara licencia de valores: los tokens no tienen la protección de un producto supervisado. ' + FUERA_UE, 'raiz-web')]),
  P('tokeniza', 'Tokeniza', 'inmobiliario', 'latinoamerica', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'tokeniza-web',
    'Plataforma brasileña de inversión colectiva que dice operar bajo la norma de crowdfunding de la CVM, el supervisor de valores de Brasil.',
    'Captaciones de empresas y promociones inmobiliarias brasileñas (sociedades de propósito específico) en forma de activos tokenizados, en reales.',
    [fuente('tokeniza-web', 'empresa', 'Tokeniza · Página inicial'), fuente('tokeniza-invista', 'empresa', 'Tokeniza · Invista (ofertas)')],
    {'tokeniza-web': ['regulada pela CVM'], 'tokeniza-invista': ['Invista em ativos reais tokenizados', 'Regulamentação Crowdfunding']},
    campo('observada', 'Su página de ofertas presenta las captaciones disponibles y el proceso de alta.', 'tokeniza-invista'),
    campo('no_verificable', 'Dice estar regulada por la CVM como plataforma de crowdfunding; no lo hemos comprobado en el registro de la CVM.', 'tokeniza-web', 'tokeniza-invista'),
    campo('no_verificable', 'Analiza los documentos de cada inversor antes de dejarle invertir; no publica si admite residentes fuera de Brasil.', 'tokeniza-web'),
    [alerta('fuera_ue', 'Ofertas brasileñas en reales. ' + FUERA_UE, 'tokeniza-web')]),
  P('etherfuse', 'Etherfuse', 'tesoro-y-fondos', 'latinoamerica', 'Emisor', 'Empresas', 'No aplica', 'No la publica', 'etherfuse-web',
    'Emisor de bonos soberanos tokenizados (CETES de México, Tesouros de Brasil, letras de EE. UU., Eurobonos y gilts) con prueba de reservas semanal y custodios regulados, según su web.',
    'Deuda pública tokenizada para la tesorería y el «float» de empresas.',
    [fuente('etherfuse-web', 'empresa', 'Etherfuse · Activos soberanos tokenizados')],
    {'etherfuse-web': ['Bonos soberanos tokenizados', 'CETES', 'Prueba de reservas semanal']},
    campo('observada', 'La web presenta sus bonos soberanos tokenizados y las formas de usarlos en tesorerías de empresas.', 'etherfuse-web'),
    campo('no_verificable', 'Habla de custodios regulados y auditorías, pero no dice qué licencia tiene la empresa ni en qué país.', 'etherfuse-web'),
    campo('no_aplica_plataforma', 'Su oferta se dirige a tesorerías corporativas, no a particulares.', 'etherfuse-web'),
    [alerta('licencia_no_declarada', 'La web no identifica la sociedad emisora ni su supervisor. ' + FUERA_UE, 'etherfuse-web')]),
  P('hator', 'HATOR', 'infraestructura', 'latinoamerica', 'Infraestructura', 'Empresas', 'No aplica', 'No la publica', 'hator-web',
    'Hator S.A.S. de C.V. dice estar regulada en El Salvador por la Comisión Nacional de Activos Digitales (CNAD) y la Superintendencia del Sistema Financiero.',
    'Infraestructura de tokenización, emisión, distribución y negociación de activos de empresas latinoamericanas.',
    [fuente('hator-web', 'empresa', 'HATOR Securities · Mercado de capitales digitales de Latinoamérica')],
    {'hator-web': ['Comisión Nacional de Activos Digitales \\(CNAD\\)', 'Hator S\\.A\\.S de C\\.V\\.']},
    campo('observada', 'La web ofrece su infraestructura y un registro previo de inversores.', 'hator-web'),
    campo('no_verificable', 'Dice estar regulada por la CNAD y la Superintendencia del Sistema Financiero de El Salvador; no lo hemos comprobado en el registro de la CNAD.', 'hator-web'),
    campo('no_aplica_plataforma', 'Es infraestructura para emisores e instituciones; los inversores solo pueden pre-registrarse.', 'hator-web'),
    [alerta('registro_no_es_aval', 'La propia web avisa de que estar registrada en la CNAD no es un respaldo del regulador a ninguna inversión. ' + FUERA_UE, 'hator-web')]),
  P('real-tokn', 'Real Tokn', 'infraestructura', 'latinoamerica', 'Infraestructura', 'Empresas', 'No aplica', 'No la publica', 'realtokn-inversores',
    'Marca de Pulpo Fintech, S.A. de C.V., proveedor de servicios de activos digitales registrado en la CNAD de El Salvador con el n.º PSAD-0023, según su web.',
    'Emisión y custodia de activos tokenizados en El Salvador; no ofrece las emisiones al público a través de su web.',
    [fuente('realtokn-inversores', 'empresa', 'Real Tokn · Inversores')],
    {'realtokn-inversores': ['PSAD-0023', 'Pulpo Fintech']},
    campo('observada', 'La web explica cómo registrarse como inversor y cómo custodia los activos digitales.', 'realtokn-inversores'),
    campo('no_verificable', 'Dice estar registrada en la CNAD con el n.º PSAD-0023; no lo hemos comprobado en el registro de la CNAD.', 'realtokn-inversores'),
    campo('confirmado_condicionado', 'Solo admite residentes de jurisdicciones permitidas y revisa el perfil del inversor antes de enseñarle una emisión.', 'realtokn-inversores'),
    [alerta('registro_no_es_aval', 'Su web avisa de que el registro en la CNAD no responde de la solvencia de los emisores ni de lo que paguen sus emisiones. ' + FUERA_UE, 'realtokn-inversores')]),
  P('bloktok', 'Bloktok', 'infraestructura', 'latinoamerica', 'Infraestructura', 'Empresas', 'No aplica', 'No la publica', 'bloktok-web',
    'Empresa chilena de infraestructura de tokenización en marca blanca; dice estar en proceso de autorización ante la CMF bajo la Ley Fintec 21.521.',
    'Plataforma en marca blanca para que inmobiliarias, fondos y emisores tokenicen sus activos en Chile.',
    [fuente('bloktok-web', 'empresa', 'Bloktok · Tokenizar activos, ahora es infraestructura')],
    {'bloktok-web': ['EN PROCESO REGULATORIO CMF', 'white label']},
    campo('observada', 'La web ofrece su plataforma en marca blanca y enseña órdenes abiertas de tokens de inmuebles.', 'bloktok-web'),
    campo('sin_registro_declarado', 'Dice estar en proceso regulatorio ante la CMF (Ley Fintec 21.521): todavía no declara una autorización.', 'bloktok-web'),
    campo('no_aplica_plataforma', 'Es infraestructura para empresas; los inversores llegan por la marca de cada cliente.', 'bloktok-web'),
    [alerta('autorizacion_en_tramite', 'Su autorización de la CMF está en trámite, no concedida.', 'bloktok-web')]),
  # ---------------------------------------------------------------- Europa
  P('bit2me-stx', 'Bit2Me STX', 'acciones-y-capital-privado', 'espana', 'Marketplace', 'Institucional', 'Alto', 'No la publica', 'bit2me-stx-cnmv',
    'Según Bit2Me, la CNMV la autorizó como agencia de valores (noviembre de 2025) y le dio la licencia de sistema de negociación del régimen piloto DLT (octubre de 2026).',
    'Bolsa de valores española nativa en blockchain, del grupo Bit2Me, bajo el régimen piloto europeo de infraestructuras DLT.',
    [fuente('bit2me-stx-cnmv', 'empresa', 'Bit2Me · «Bit2Me STX obtiene la autorización de la CNMV para lanzar su Bolsa de Valores nativa en blockchain»')],
    {'bit2me-stx-cnmv': ['Licencia SNL bajo el Régimen Piloto DLT', 'Agencia de Valores']},
    campo('observada', 'Bit2Me anuncia que la licencia permite lanzar su bolsa de valores en blockchain.', 'bit2me-stx-cnmv'),
    campo('no_verificable', 'Lo dice el blog de Bit2Me (agencia de valores y licencia SNL del régimen piloto DLT); no lo hemos comprobado aún en el registro de la CNMV.', 'bit2me-stx-cnmv'),
    campo('no_verificable', 'La nota no explica cómo puede negociar un particular ni con qué intermediario.', 'bit2me-stx-cnmv'),
    [alerta('lanzamiento', 'La autorización permite lanzar la bolsa; no prueba que ya haya valores negociándose ni que un particular pueda comprarlos.', 'bit2me-stx-cnmv')]),
  P('assetera', 'Assetera', 'acciones-y-capital-privado', 'union-europea', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'assetera-web',
    'Plataforma austriaca de distribución de valores tokenizados que dice estar regulada bajo MiFID II y operar en 30 países del EEE.',
    'Valores tokenizados para inversores del EEE: acciones y ETF tokenizados de EE. UU. (xStocks, Ondo) y financiación de inventarios y facturas.',
    [fuente('assetera-web', 'empresa', 'Assetera · Your gateway to invest in tokenised securities')],
    {'assetera-web': ['MiFID II', 'Your gateway to invest in tokenised securities']},
    campo('observada', 'La web invita a registrarse y anuncia acciones y ETF tokenizados para inversores de 30 países del EEE.', 'assetera-web'),
    campo('no_verificable', 'Dice ser una plataforma austriaca regulada bajo MiFID II; no lo hemos comprobado en el registro de la FMA austriaca ni en la CNMV.', 'assetera-web'),
    campo('no_verificable', 'Habla de «inversores elegibles» en 30 países del EEE sin decir qué requisitos pide en España.', 'assetera-web'),
    [alerta('producto_y_geografia', 'Que la plataforma opere en el EEE no hace que cada producto esté disponible en España: depende del folleto de cada valor.', 'assetera-web')]),
  P('estating', 'Estating', 'inmobiliario', 'union-europea', 'Emisor', 'Institucional', 'Alto', 'No la publica', 'estating-alianza',
    'Estating S.A., de Luxemburgo, estructura cada inversión inmobiliaria como un valor con ISIN a través de un vehículo de titulización luxemburgués propio.',
    'Inmuebles de calidad institucional para gestores de patrimonio y asesores regulados; socio de producto de Reental desde octubre de 2026.',
    [fuente('estating-web', 'empresa', 'Estating · Fintech para inmuebles y mercados privados'),
     fuente('estating-alianza', 'empresa', 'Estating · Alianza con Reental (26/10/2026)')],
    {'estating-web': ['regulated investment professionals'], 'estating-alianza': ['Luxembourg-domiciled infrastructure platform for real-world assets']},
    campo('observada', 'La web describe su plataforma para profesionales y la nota de octubre detalla operaciones ya hechas con Reental.', 'estating-web', 'estating-alianza'),
    campo('no_verificable', 'La web no identifica ninguna licencia: emite a través de un vehículo de titulización de Luxemburgo.', 'estating-alianza'),
    campo('confirmado_condicionado', 'Se dirige a profesionales regulados de la inversión, no a particulares directamente.', 'estating-web'),
    [alerta('no_minorista', 'No es una plataforma para particulares: llega a través de asesores y gestores.', 'estating-web')]),
  P('seturion', 'Seturion', 'infraestructura', 'union-europea', 'Infraestructura', 'Empresas', 'No aplica', 'Varias', 'seturion-web',
    'Plataforma del grupo Boerse Stuttgart para liquidar activos tokenizados, abierta a bancos, brókeres y mercados de toda Europa.',
    'Liquidación, registro y emisión de activos tokenizados para instituciones europeas, con dinero de banco central o efectivo en cadena.',
    [fuente('seturion-web', 'empresa', 'Boerse Stuttgart Group · Seturion')],
    {'seturion-web': ['The European settlement platform for tokenized assets', 'public and private blockchains supported']},
    campo('observada', 'El grupo Boerse Stuttgart presenta Seturion con sus servicios de emisión, registro y liquidación.', 'seturion-web'),
    campo('no_verificable', 'La página no dice qué licencia cubre la plataforma.', 'seturion-web'),
    campo('no_aplica_plataforma', 'Es infraestructura para bancos, brókeres y mercados; no se invierte en ella.', 'seturion-web'),
    [alerta('infraestructura_b2b', 'Es una infraestructura entre instituciones: no ofrece productos a particulares.', 'seturion-web')]),
  P('digishares', 'DigiShares', 'infraestructura', 'union-europea', 'Infraestructura', 'Empresas', 'No aplica', 'Varias', 'digishares-web',
    'Proveedor danés de software de tokenización en marca blanca para gestoras, inmobiliarias y empresas, con precios para empresa publicados.',
    'Software para emitir, gestionar y negociar activos tokenizados (inmuebles, fondos, acciones de empresas).',
    [fuente('digishares-web', 'empresa', 'DigiShares · Asset Tokenization Platform')],
    {'digishares-web': ['Asset Tokenization Platform', 'Enterprise pricing']},
    campo('observada', 'La web ofrece su plataforma de tokenización y publica precios para empresas.', 'digishares-web'),
    campo('no_aplica_plataforma', 'Vende software: la licencia, si hace falta, es de cada cliente que emite.', 'digishares-web'),
    campo('no_aplica_plataforma', 'Su cliente es la empresa que tokeniza, no el inversor.', 'digishares-web'),
    [alerta('software_no_mercado', 'Es software para emisores: lo que se ofrece con él depende de cada cliente y de su licencia.', 'digishares-web')]),
  P('ctrl-alt', 'Ctrl Alt', 'infraestructura', 'reino-unido', 'Infraestructura', 'Empresas', 'No aplica', 'No la publica', 'ctrlalt-web',
    'Grupo con sociedades autorizadas según su web por la FCA británica (FRN 1045023), en Irlanda bajo MiFID y por VARA en Dubái (licencia VL/25/05/002).',
    'Infraestructura para estructurar, emitir y gestionar productos tokenizados (inmuebles, mercados privados) para gestoras y distribuidores.',
    [fuente('ctrlalt-web', 'empresa', 'Ctrl Alt · Institutional-Grade Tokenization Infrastructure')],
    {'ctrlalt-web': ['FRN: 1045023', 'VL/25/05/002']},
    campo('observada', 'La web presenta sus servicios de tokenización para gestoras, distribuidores e inversores.', 'ctrlalt-web'),
    campo('no_verificable', 'Su web cita la FCA (FRN 1045023), una empresa de inversión irlandesa bajo MiFID y la licencia VARA VL/25/05/002; no lo hemos comprobado en esos registros.', 'ctrlalt-web'),
    campo('no_aplica_plataforma', 'Trabaja para gestoras y distribuidores; el inversor llega por ellos.', 'ctrlalt-web'),
    [alerta('grupo_multi_entidad', 'Cada licencia es de una sociedad distinta del grupo (Reino Unido, Irlanda, Dubái) y no cubre a las demás.', 'ctrlalt-web')]),
  # ---------------------------------------------------------------- Asia y Oriente Medio
  P('digift', 'DigiFT', 'tesoro-y-fondos', 'asia-pacifico', 'Marketplace', 'Acreditado', 'Alto', 'No la publica', 'digift-web',
    'DigiFT Tech (Singapore) Pte. Ltd. dice tener licencia de servicios de mercados de capitales de la Autoridad Monetaria de Singapur (MAS).',
    'Mercado regulado de fondos y productos tokenizados en cadena para inversores acreditados e institucionales de Asia.',
    [fuente('digift-web', 'empresa', 'DigiFT · Regulated Exchange For On-Chain RWA')],
    {'digift-web': ['Capital Markets Services License', 'Monetary Authority of Singapore', 'I am an accredited investor']},
    campo('observada', 'La web ofrece el alta y anuncia productos nuevos, como su estrategia de crédito con SBI para Japón.', 'digift-web'),
    campo('no_verificable', 'Dice tener licencia CMS de la MAS; no lo hemos comprobado en el directorio de la MAS.', 'digift-web'),
    campo('confirmado_condicionado', 'Al entrar pregunta si eres inversor acreditado: sus productos son para acreditados e institucionales.', 'digift-web'),
    [alerta('no_minorista', 'No es para particulares: exige ser inversor acreditado.', 'digift-web')]),
  P('sdax', 'SDAX', 'infraestructura', 'asia-pacifico', 'Marketplace', 'Acreditado', 'Alto', 'No la publica', 'sdax-listados',
    'Sus dos sociedades de Singapur dicen tener licencia de la MAS: servicios de mercados de capitales (CMS100573) y operador de mercado reconocido.',
    'Emisiones tokenizadas en el sudeste asiático (infraestructuras, crédito privado) solo para inversores acreditados.',
    [fuente('sdax-listados', 'empresa', 'SDAX · Listings')],
    {'sdax-listados': ['CMS100573', 'Recognised Market Operator', 'For Accredited Investors \\(AI\\) only']},
    campo('observada', 'Su lista enseña emisiones tokenizadas con su mínimo y su estado.', 'sdax-listados'),
    campo('no_verificable', 'Dice tener licencia CMS (CMS100573) y de operador de mercado reconocido de la MAS; no lo hemos comprobado en el directorio de la MAS.', 'sdax-listados'),
    campo('confirmado_condicionado', 'Solo para inversores acreditados, según su propia lista.', 'sdax-listados'),
    [alerta('no_minorista', 'No es para particulares: solo inversores acreditados.', 'sdax-listados')]),
  P('terazo', 'Terazo', 'inmobiliario', 'asia-pacifico', 'Marketplace', 'Minorista', 'Medio', 'No la publica', 'terazo-web',
    'Plataforma de GIFT City (India) que dice operar en el entorno de pruebas regulatorio de la IFSCA; su primer fondo tokenizado es ORYX.',
    'Inmuebles comerciales tokenizados en GIFT City (India), con tokens desde 1.000 dólares y reventa entre inversores.',
    [fuente('terazo-web', 'empresa', 'Terazo · Asset Tokenization Platform'), fuente('terazo-oryx', 'empresa', 'Terazo · Invest in Oryx')],
    {'terazo-web': ['IFSCA', 'ORYX'], 'terazo-oryx': ['Tokens starting as low as USD \\$1000']},
    campo('observada', 'La web presenta ORYX: el tramo inicial está suscrito y la reventa va por lista de espera.', 'terazo-web', 'terazo-oryx'),
    campo('no_verificable', 'Dice operar en el entorno de pruebas regulatorio de la IFSCA (GIFT City); no lo hemos comprobado en la IFSCA.', 'terazo-web'),
    campo('no_verificable', 'No publica qué inversores admite ni desde qué países.', 'terazo-web'),
    [alerta('sandbox', 'Un entorno de pruebas regulatorio no es una licencia definitiva. ' + FUERA_UE, 'terazo-web')]),
  P('tokinvest', 'Tokinvest', 'infraestructura', 'oriente-medio', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'tokinvest-web',
    'Tokinvest DMCC tiene licencia activa de VARA (Dubái), VL/2024/12/004, para intermediación y emisión de activos virtuales, con permiso para atender a minoristas.',
    'Plataforma de Dubái para tokenizar e invertir en activos reales; enseña a cada inversor lo que puede comprar según su perfil.',
    [fuente('tokinvest-vara', 'regulador', 'VARA · Registro público: Tokinvest DMCC'), fuente('tokinvest-web', 'empresa', 'Tokinvest · Tokenise with us')],
    {'tokinvest-vara': ['Tokinvest DMCC', 'VL/2024/12/004', 'Retail Investors'], 'tokinvest-web': ['Tokenise with us']},
    campo('observada', 'La web ofrece tokenizar activos e invertir tras verificar la identidad.', 'tokinvest-web'),
    campo('confirmada_regulador', 'El registro público de VARA recoge a Tokinvest DMCC con licencia VASP activa (VL/2024/12/004, del 30/12/2024) para intermediación y emisión de categoría 1.', 'tokinvest-vara'),
    campo('confirmado_condicionado', 'VARA le permite atender a inversores institucionales, cualificados y minoristas; la web enseña a cada uno lo que puede comprar según su perfil.', 'tokinvest-vara', 'tokinvest-web'),
    [alerta('fuera_ue', 'Licencia de Dubái, sin pasaporte europeo. ' + FUERA_UE, 'tokinvest-vara')]),
  P('prypco-mint', 'PRYPCO Mint', 'inmobiliario', 'oriente-medio', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'prypco-mint',
    'Cada inmueble está registrado en el Departamento de Tierras de Dubái (DLD), que emite el certificado de propiedad de los tokens, según su ayuda.',
    'Viviendas de Dubái tokenizadas desde 1.000 dírhams (AED), con reventa en su propio mercado.',
    [fuente('prypco-mint', 'empresa', 'PRYPCO Mint · Cómo invertir en inmuebles tokenizados')],
    {'prypco-mint': ['starting from AED 1,000', 'Dubai Land Depar']},
    campo('observada', 'Su ayuda explica cómo invertir en las propiedades tokenizadas abiertas tras verificar la cuenta.', 'prypco-mint'),
    campo('no_verificable', 'La ayuda cita el registro de cada inmueble en el DLD; no dice qué licencia tiene la plataforma.', 'prypco-mint'),
    campo('confirmado_condicionado', 'Hay que verificar la cuenta antes de invertir; el mínimo es de 1.000 AED en todas las propiedades.', 'prypco-mint'),
    [alerta('fuera_ue', 'Inmuebles de Dubái en dírhams. ' + FUERA_UE, 'prypco-mint')]),
  # ---------------------------------------------------------------- África y Oceanía
  P('mesh', 'Mesh', 'credito-privado', 'africa', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'mesh-sobre',
    'Mesh Trade South Africa (Pty) Ltd dice ser proveedor de servicios financieros autorizado en Sudáfrica (FSP 53710).',
    'Mercado sudafricano de activos financieros tokenizados: acciones preferentes, bonos y oro, con emisión, negociación y liquidación en la misma plataforma.',
    [fuente('mesh-sobre', 'empresa', 'Mesh · Sobre nosotros'), fuente('mesh-bcfs', 'empresa', 'Mesh · Acciones preferentes tokenizadas de BCFS')],
    {'mesh-sobre': ['Asset Origination, Issuance, and Tokenisation'], 'mesh-bcfs': ['licensed Financial Services Provider \\(53710\\)']},
    campo('observada', 'Su web publica emisiones abiertas, como las acciones preferentes tokenizadas de BCFS.', 'mesh-bcfs'),
    campo('no_verificable', 'Dice ser proveedor de servicios financieros autorizado (FSP 53710); no lo hemos comprobado en el registro de la FSCA.', 'mesh-bcfs'),
    campo('no_verificable', 'No publica qué inversores admite fuera de Sudáfrica.', 'mesh-sobre'),
    [alerta('fuera_ue', 'Productos sudafricanos. ' + FUERA_UE, 'mesh-bcfs')]),
  P('oaksvale', 'Oaksvale', 'inmobiliario', 'africa', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'oaksvale-web',
    'Oaksvale Ventures Limited está inscrita como sociedad en Nigeria (RC 7194242) y en Tanzania. En su web no declara una licencia de valores.',
    'Inmuebles de alquiler en África (hoteles boutique, villas en Zanzíbar) tokenizados a través de sociedades vehículo.',
    [fuente('oaksvale-web', 'empresa', 'Oaksvale · Tokenized African Real Estate')],
    {'oaksvale-web': ['RC: 7194242', 'Tokenized African Real Estate']},
    campo('observada', 'La web enseña inmuebles tokenizados, como una villa en Zanzíbar.', 'oaksvale-web'),
    campo('sin_registro_declarado', 'Solo da su inscripción mercantil en Nigeria y Tanzania; no declara licencia de valores.', 'oaksvale-web'),
    campo('no_verificable', 'Pide verificación de identidad, pero no publica qué países admite.', 'oaksvale-web'),
    [alerta('sin_licencia_declarada', 'No declara licencia de valores: los tokens no tienen la protección de un producto supervisado. ' + FUERA_UE, 'oaksvale-web')]),
  P('cradle', 'Cradle', 'acciones-y-capital-privado', 'africa', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'cradle-web',
    'Se presenta como mercado regulado y en cadena de valores africanos tokenizados (acciones cotizadas, bonos soberanos y monedas estables locales).',
    'Acciones africanas cotizadas (por ejemplo, de la Bolsa de Nairobi), bonos y monedas estables locales tokenizados, con préstamos y salidas a bolsa en token.',
    [fuente('cradle-web', 'empresa', 'Cradle · On-chain real-world assets for Africa')],
    {'cradle-web': ['regulated home for tokenized African securities', 'Nairobi Securities Exchange']},
    campo('observada', 'La web enseña su mercado con cotizaciones de acciones africanas tokenizadas.', 'cradle-web'),
    campo('no_verificable', 'Dice ser un mercado regulado, pero no identifica la sociedad ni el supervisor.', 'cradle-web'),
    campo('no_verificable', 'No publica qué inversores admite ni desde qué países.', 'cradle-web'),
    [alerta('licencia_no_identificada', 'Que la web diga «regulado» sin nombrar supervisor ni licencia no permite comprobarlo. ' + FUERA_UE, 'cradle-web')]),
  P('shard', 'Shard', 'inmobiliario', 'africa', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'shard-web',
    'Shard Developers Ltd, de Abuja (Nigeria), publica inmuebles tokenizados con documentación y restringe las transferencias a inversores verificados. En su web no declara una licencia de valores.',
    'Pisos y locales tokenizados en Nigeria (por ejemplo, en Abuja) para inversores del país y de la diáspora.',
    [fuente('shard-web', 'empresa', 'Shard · A new way to own')],
    {'shard-web': ['Shard Developers Ltd', 'Abuja']},
    campo('observada', 'La web enseña inmuebles tokenizados con su mínimo y su avance de financiación.', 'shard-web'),
    campo('sin_registro_declarado', 'No declara licencia de valores; dice que verifica los activos con autoridades y socios independientes.', 'shard-web'),
    campo('no_verificable', 'Dice que la elegibilidad y las restricciones por país dependen de cada inversión.', 'shard-web'),
    [alerta('sin_licencia_declarada', 'No declara licencia de valores: los tokens no tienen la protección de un producto supervisado. ' + FUERA_UE, 'shard-web')]),
  P('luxivana', 'Luxivana', 'inmobiliario', 'asia-pacifico', 'Emisor', 'Minorista', 'Alto', 'No la publica', 'luxivana-web',
    'Luxivana Pty Ltd es representante autorizada (CAR 1321612) de Trend Capital Group, que tiene licencia australiana de servicios financieros (AFSL 255475), según su web.',
    'Tokens respaldados 1:1 por activos de un fondo de inversión regulado en Australia, desde 25.000 dólares.',
    [fuente('luxivana-web', 'empresa', 'Luxivana · Tokenised Assets & Investment Infrastructure')],
    {'luxivana-web': ['AFSL #255475', 'from \\$25,000']},
    campo('observada', 'La web invita a invertir en activos privados tokenizados desde 25.000 dólares.', 'luxivana-web'),
    campo('no_verificable', 'Dice operar como representante autorizada de un titular de AFSL (255475); no lo hemos comprobado en el registro de ASIC.', 'luxivana-web'),
    campo('no_verificable', 'No publica qué inversores admite fuera de Australia.', 'luxivana-web'),
    [alerta('licencia_de_tercero', 'La licencia es de otra empresa (Trend Capital Group); Luxivana actúa como su representante. ' + FUERA_UE, 'luxivana-web')]),
  P('tangiblex', 'TangibleX', 'inmobiliario', 'asia-pacifico', 'Marketplace', 'Minorista', 'Bajo', 'No la publica', 'tangiblex-web',
    'Mercado australiano de participaciones tokenizadas de fondos; cada producto que lista lo origina una gestora con licencia AFSL, según su web.',
    'Participaciones de fondos y planes de inversión australianos representadas con tokens, para inversores verificados.',
    [fuente('tangiblex-web', 'empresa', 'TangibleX · Marketplace')],
    {'tangiblex-web': ['licensed AFSL fund managers', 'tokenised real-world-assets']},
    campo('observada', 'La web presenta su mercado de participaciones tokenizadas y el proceso para participar.', 'tangiblex-web'),
    campo('no_verificable', 'La licencia es de las gestoras que originan cada fondo; la web no identifica ninguna.', 'tangiblex-web'),
    campo('no_verificable', 'Solo dice que participan «inversores verificados», sin publicar requisitos ni países.', 'tangiblex-web'),
    [alerta('licencia_de_tercero', 'Cada producto depende de la licencia de su gestora, no de la plataforma. ' + FUERA_UE, 'tangiblex-web')]),
  # ---------------------------------------------------------------- Norteamérica
  P('caliber', 'Caliber', 'inmobiliario', 'ee-uu', 'Emisor', 'Acreditado', 'Alto', 'No la publica', 'caliber-nota',
    'CaliberCos Inc., gestora inmobiliaria estadounidense, ha tokenizado tres ofertas más: dos promociones de hoteles y un fondo.',
    'Participaciones tokenizadas de ofertas inmobiliarias de Caliber en EE. UU. (hoteles y fondos).',
    [fuente('caliber-nota', 'empresa', 'Caliber · Tokenización de tres ofertas inmobiliarias más')],
    {'caliber-nota': ['Caliber Goes Live with Tokenization of Three More Real Estate Offerings', 'CaliberCos Inc\\.']},
    campo('observada', 'Caliber anuncia que ya tiene tokenizadas tres ofertas más y que ampliará el programa.', 'caliber-nota'),
    campo('no_verificable', 'La nota no dice con qué exención o registro se ofrecen los tokens.', 'caliber-nota'),
    campo('no_verificable', 'La nota no dice quién puede invertir; las ofertas privadas de este tipo en EE. UU. suelen limitarse a acreditados.', 'caliber-nota'),
    [alerta('fuera_ue', 'Ofertas privadas de EE. UU. ' + FUERA_UE, 'caliber-nota')]),
  P('okxice', 'OKXICE', 'acciones-y-capital-privado', 'ee-uu', 'Marketplace', 'Minorista', 'Bajo', 'Ethereum (X Layer)', 'okxice-nota',
    'Mercado de valores tokenizados de OKX e ICE abierto el 23/11/2026, solo para clientes de OKX Inc. en EE. UU. que cumplan los requisitos.',
    'Acciones y ETF de EE. UU. tokenizados que se negocian las 24 horas en X Layer, la red de OKX.',
    [fuente('okxice-nota', 'empresa', 'OKX · «24/7 Securities Trading Arrives on OKXICE»')],
    {'okxice-nota': ['Tokenized Securities Venue', 'eligible U\\.S\\.-based OKX Inc\\. customers']},
    campo('observada', 'OKX anuncia el inicio de la negociación en su mercado de valores tokenizados.', 'okxice-nota'),
    campo('no_verificable', 'La nota no detalla las licencias que cubren el mercado.', 'okxice-nota'),
    campo('confirmado_condicionado', 'Solo para clientes de OKX Inc. en EE. UU. que verifiquen su identidad y cumplan los requisitos geográficos.', 'okxice-nota'),
    [alerta('solo_eeuu', 'No está abierto desde España: solo clientes de OKX en EE. UU.', 'okxice-nota')]),
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

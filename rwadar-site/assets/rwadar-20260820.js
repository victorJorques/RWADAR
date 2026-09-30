/* =================================================================
   ▸ PLATAFORMAS EN EL RADAR · las que pasan los 4 criterios
     Para añadir una, copia un bloque { … } entero y pégalo al final.
     cat:    Inmobiliario | Crédito privado | Tesoro y fondos |
             Acciones y capital privado | Materias primas | Infraestructura
     acceso: Minorista | Acreditado | Institucional | Empresas
     aval:   el motivo concreto por el que supera el filtro
   ================================================================= */
/* El servidor de revisión solo escucha en loopback. Esta comprobación
   deliberadamente estrecha impide que el escaparate interno se active por
   un parámetro, una ruta o un dominio que simplemente contenga "local". */
const MODO_LOCAL_SEGURO=typeof location!=='undefined'&&
 /^(?:localhost|127\.0\.0\.1)$/.test(String(location.hostname||''))&&
 /^https?:$/.test(String(location.protocol||''));
/* servicios-usuario:inicio */
/* El catálogo público no habilita cuentas. Esta capacidad pertenece al corte
   editorial y no se puede activar con un dominio, un enlace o almacenamiento.
   Es una guarda del cliente: no modifica los permisos del servidor. */
const SERVICIOS_USUARIO_REMOTOS=false;
const SERVICIOS_USUARIO_DISPONIBLES=SERVICIOS_USUARIO_REMOTOS&&!MODO_LOCAL_SEGURO;
function limpiarRetornoSinServiciosUsuario(){
 if(SERVICIOS_USUARIO_DISPONIBLES||typeof location==='undefined'||
    typeof history==='undefined'||typeof history.replaceState!=='function')return;
 try{
  const u=new URL(location.href),fragmento=new URLSearchParams(u.hash.slice(1));
  const sensibles=['access_token','refresh_token','provider_token','provider_refresh_token',
   'token','token_hash','code','error','error_code','error_description'];
  const retorno=sensibles.some(k=>u.searchParams.has(k)||fragmento.has(k));
  if(!retorno)return;
  [...sensibles,'type','token_type','expires_in','expires_at'].forEach(k=>u.searchParams.delete(k));
  if(sensibles.some(k=>fragmento.has(k)))u.hash='';
  history.replaceState(null,'',u.pathname+u.search+u.hash);
 }catch(e){} /* Un enlace defectuoso tampoco inicia autenticación. */
}
/* servicios-usuario:fin */
const FECHA_VERIFICACION_LOCAL='2026-09-21';
let ESCAPARATE_LOCAL=null;
let MANIFIESTO_EDITORIAL_LOCAL=null;
let CATALOGO_EMBEBIDO_BLOQUEADO=false;
/* Activos propios, no fotografías del emisor. La compuerta de publicación
   comprueba por separado el manifiesto y sus huellas antes de copiarlos. */
const EDITORIAL_OFERTA_POR_CATEGORIA={
 'Inmobiliario':{src:'/ofertas-editoriales/inmobiliario-rwadar.webp',alt:'Ilustración editorial de un activo inmobiliario tokenizado'},
 'Tesoro y fondos':{src:'/ofertas-editoriales/tesoro-fondos-rwadar.webp',alt:'Ilustración editorial de tesorería y fondos tokenizados'},
 'Materias primas':{src:'/ofertas-editoriales/materias-primas-rwadar.webp',alt:'Ilustración editorial de materias primas tokenizadas'},
 'Acciones y capital privado':{src:'/ofertas-editoriales/capital-privado-rwadar.webp',alt:'Ilustración editorial de acciones y capital privado tokenizados'},
 'Crédito privado':{src:'/ofertas-editoriales/capital-privado-rwadar.webp',alt:'Ilustración editorial financiera; no representa un activo concreto'}
};

const P=[
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"addx","n":"ADDX","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"Asia-Pacífico","cadenas":"Varias","ticket":"Alto","acceso":"Acreditado","web":"https://addx.co","aval":"Licencia de mercado reconocido del MAS de Singapur; accionistas de referencia: la bolsa SGX y el fondo estatal Temasek.","nota":"Fondos de capital riesgo y private equity troceados para inversores acreditados.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La propia empresa limita el alta a inversores acreditados o institucionales no estadounidenses.","fuentes":[{"id":"addx-acceso","url":"https://www.addx.co/en/inside-addx/","tipo":"empresa","titulo":"Inside ADDX","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"no_minorista","detalle":"No presentar como acceso minorista general ni como disponible automáticamente en España.","fuentes":[{"id":"addx-acceso","url":"https://www.addx.co/en/inside-addx/","tipo":"empresa","titulo":"Inside ADDX","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene alta y catálogo de oportunidades.","fuentes":[{"id":"addx-web","url":"https://addx.co/","tipo":"empresa","titulo":"ADDX","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"ADDX Pte. Ltd. figura en el directorio de MAS como CMS licensee y recognised market operator.","fuentes":[{"id":"addx-mas","url":"https://eservices.mas.gov.sg/fid/institution/detail/246926-ADDX-PTE-LTD","tipo":"regulador","titulo":"MAS Financial Institutions Directory — ADDX Pte. Ltd.","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"archax","n":"Archax","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"Reino Unido","cadenas":"Varias","ticket":"Alto","acceso":"Institucional","web":"https://archax.com","aval":"Autorizada y supervisada por la FCA británica con el número 838656, como exchange, bróker y custodio, e inscrita en su registro de criptoactivos. Tiene permiso para operar un sistema multilateral de negociación, no solo para intermediar.","nota":"Mercado regulado de valores digitales en Londres que reúne emisión, negociación y custodia bajo la misma licencia. Cuidado con los clones: la FCA tiene avisos publicados sobre webs que la suplantan, y el dominio válido es archax.com.","ver":"2026-08-08","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"No se pudo contrastar el proceso de alta ni la disponibilidad por producto y país en las páginas consultadas.","fuentes":[{"id":"archax-eu","url":"https://eu.archax.com/","tipo":"empresa","titulo":"Archax Markets Europe","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"entidad_y_servicio","detalle":"El registro de la sociedad europea no confirma que un producto esté abierto ni que una persona concreta sea elegible.","fuentes":[{"id":"archax-cnmv","url":"https://www.cnmv.es/portal/consultas/listadoentidad?id=1&tipoent=0","tipo":"regulador","titulo":"CNMV — Archax Markets Europe, S.V., S.A.","primaria":true,"consultadaEl":"2026-09-28"},{"id":"archax-eu","url":"https://eu.archax.com/","tipo":"empresa","titulo":"Archax Markets Europe","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"no_verificable","detalle":"Las páginas del grupo y de Europa no devolvieron contenido legible en la consulta; no se confirmó actividad comercial actual.","fuentes":[{"id":"archax-eu","url":"https://eu.archax.com/","tipo":"empresa","titulo":"Archax Markets Europe","primaria":true,"consultadaEl":"2026-09-28"},{"id":"archax-web","url":"https://archax.com/","tipo":"empresa","titulo":"Archax","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"Archax Markets Europe, S.V., S.A. figura en CNMV con registro 289 de 08/08/2019. Este registro no se extiende a otras entidades del grupo.","fuentes":[{"id":"archax-cnmv","url":"https://www.cnmv.es/portal/consultas/listadoentidad?id=1&tipoent=0","tipo":"regulador","titulo":"CNMV — Archax Markets Europe, S.V., S.A.","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"artex-global-markets","n":"ARTEX Global Markets","cat":"Materias primas","tipo":"Marketplace","reg":"Liechtenstein","cadenas":"Mercado regulado (MTF)","ticket":"Alto","acceso":"Acreditado","web":"https://www.artexgm.com","aval":"Licencia de sistema multilateral de negociación (MTF) bajo MiFID II del regulador de Liechtenstein; SIX aporta compensación y liquidación.","nota":"Mercado regulado de acciones sobre obras de arte: cada cuadro se trocea en acciones de 100 €. Ojo: el token «ARTEX» de BNB Chain no tiene relación con esta plataforma.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"No se obtuvo una fuente primaria actual que confirmase alta, países admitidos y elegibilidad.","fuentes":[{"id":"artex-lb","url":"https://www.lb.lt/en/sfi-financial-market-participants/artex-global-markets-ag","tipo":"regulador","titulo":"Bank of Lithuania — ARTEX Global Markets AG","primaria":true,"consultadaEl":"2026-09-28"},{"id":"artex-web","url":"https://www.artexgm.com/","tipo":"empresa","titulo":"ARTEX Global Markets","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"registro_no_equivale_operacion","detalle":"Mantener la fila como no verificable hasta confirmar web, instrumento vivo y proceso de alta.","fuentes":[{"id":"artex-lb","url":"https://www.lb.lt/en/sfi-financial-market-participants/artex-global-markets-ag","tipo":"regulador","titulo":"Bank of Lithuania — ARTEX Global Markets AG","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"no_verificable","detalle":"La portada oficial no pudo leerse durante el barrido; no se confirmó una oferta negociable abierta.","fuentes":[{"id":"artex-web","url":"https://www.artexgm.com/","tipo":"empresa","titulo":"ARTEX Global Markets","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"El Banco de Lituania mantiene ARTEX Global Markets AG, de Liechtenstein, en su lista de empresas de inversión del EEE que prestan servicios sin sucursal. No prueba actividad comercial actual.","fuentes":[{"id":"artex-lb","url":"https://www.lb.lt/en/sfi-financial-market-participants/artex-global-markets-ag","tipo":"regulador","titulo":"Bank of Lithuania — ARTEX Global Markets AG","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"backed-finance","n":"Backed Finance","cat":"Acciones y capital privado","tipo":"Emisor","reg":"Suiza","cadenas":"Ethereum, Base, Gnosis","ticket":"Bajo","acceso":"Minorista","web":"https://backed.fi","aval":"Emisor suizo con el activo real depositado 1:1 en custodia de un tercero y atestaciones públicas de respaldo.","nota":"Réplicas tokenizadas de acciones y bonos cotizados, activas desde 2021.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La distribución minorista en el EEE depende de distribuidores autorizados y términos finales; Estados Unidos está excluido.","fuentes":[{"id":"xstocks-legal","url":"https://docs.xstocks.fi/docs/product-legal-overview","tipo":"documento_legal","titulo":"xStocks product legal overview","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"distribuidor_y_producto","detalle":"No traducir 'folleto aprobado' a disponibilidad minorista universal ni a aval del regulador.","fuentes":[{"id":"xstocks-legal","url":"https://docs.xstocks.fi/docs/product-legal-overview","tipo":"documento_legal","titulo":"xStocks product legal overview","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web muestra xStocks y documentación de producto vigente.","fuentes":[{"id":"backed-legal","url":"https://assets.backed.fi/legal-documentation","tipo":"documento_legal","titulo":"Backed Assets product documentation","primaria":true,"consultadaEl":"2026-09-28"},{"id":"backed-web","url":"https://backed.fi/","tipo":"empresa","titulo":"Backed Finance","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_documento_producto","detalle":"La documentación describe valores emitidos bajo un folleto del EEE; no acredita que Backed sea una plataforma de inversión licenciada en España.","fuentes":[{"id":"backed-legal","url":"https://assets.backed.fi/legal-documentation","tipo":"documento_legal","titulo":"Backed Assets product documentation","primaria":true,"consultadaEl":"2026-09-28"},{"id":"xstocks-legal","url":"https://docs.xstocks.fi/docs/product-legal-overview","tipo":"documento_legal","titulo":"xStocks product legal overview","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"blocksquare","n":"Blocksquare","cat":"Inmobiliario","tipo":"Infraestructura","reg":"Unión Europea","cadenas":"Ethereum","ticket":"No aplica","acceso":"Empresas","web":"https://blocksquare.io","aval":"Vincula cada token a una anotación en el registro de la propiedad, no solo a un contrato inteligente.","nota":"Tecnología para que una inmobiliaria tokenice sus propios activos con respaldo registral.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"Los términos enlazados no pudieron leerse; el acceso debe confirmarse con el operador de cada portal y activo.","fuentes":[{"id":"blocksquare-terms","url":"https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md","tipo":"documento_legal","titulo":"Blocksquare certified partner terms template","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"operador_y_activo","detalle":"No atribuir a cada portal una licencia o vínculo registral por utilizar tecnología de tokenización. Revisar emisor, contrato y jurisdicción del activo.","fuentes":[{"id":"blocksquare-terms","url":"https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md","tipo":"documento_legal","titulo":"Blocksquare certified partner terms template","primaria":true,"consultadaEl":"2026-09-28"},{"id":"blocksquare-web","url":"https://blocksquare.io/","tipo":"empresa","titulo":"Blocksquare","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"no_verificable","detalle":"La consulta solo devolvió el título de la portada; no se comprobó actividad comercial ni disponibilidad de portales actuales.","fuentes":[{"id":"blocksquare-web","url":"https://blocksquare.io/","tipo":"empresa","titulo":"Blocksquare","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"No se pudieron leer los términos actuales ni comprobar un registro regulatorio que identifique entidad y permisos.","fuentes":[{"id":"blocksquare-terms","url":"https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md","tipo":"documento_legal","titulo":"Blocksquare certified partner terms template","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"centrifuge","n":"Centrifuge","cat":"Crédito privado","tipo":"Infraestructura","reg":"Global","cadenas":"Ethereum, Base","ticket":"Alto","acceso":"Institucional","web":"https://centrifuge.io","aval":"Una de las tres plataformas que concentran dos tercios del crédito privado tokenizado; estructura de tramos senior/junior.","nota":"Financiación de carteras de préstamos y facturas con garantía fuera de cadena. Tuvo impagos por 5,8 M$ en 2023 y reforzó su modelo después.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La disponibilidad es por fondo y puede limitarse a inversores sofisticados, acreditados o cualificados.","fuentes":[{"id":"centrifuge-terms","url":"https://centrifuge.io/terms","tipo":"documento_legal","titulo":"Centrifuge website terms","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"protocolo_no_emisor","detalle":"Verificar cada fondo, emisor, jurisdicción y documento de oferta; no atribuir al protocolo la licencia del vehículo.","fuentes":[{"id":"centrifuge-terms","url":"https://centrifuge.io/terms","tipo":"documento_legal","titulo":"Centrifuge website terms","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene infraestructura de gestión de activos on-chain.","fuentes":[{"id":"centrifuge-web","url":"https://centrifuge.io/","tipo":"empresa","titulo":"Centrifuge","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_aplica_plataforma","detalle":"Centrifuge es protocolo/infraestructura; sus términos dicen que ni Centrifuge ni afiliadas se licencian en cada jurisdicción y que los productos pueden ser no regulados.","fuentes":[{"id":"centrifuge-terms","url":"https://centrifuge.io/terms","tipo":"documento_legal","titulo":"Centrifuge website terms","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"courtyard","n":"Courtyard","cat":"Materias primas","tipo":"Marketplace","reg":"EE. UU.","cadenas":"Polygon","ticket":"Bajo","acceso":"Minorista","web":"https://courtyard.io","aval":"El objeto físico se guarda en cámara asegurada y el token es canjeable por él en cualquier momento: respaldo comprobable.","nota":"Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados. Líder por volumen semanal en 2026.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"Los términos contienen restricciones de sanciones, pero no se confirmó admisión operativa desde España.","fuentes":[{"id":"courtyard-terms","url":"https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service","tipo":"documento_legal","titulo":"Courtyard terms of service","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"coleccionable_no_valor","detalle":"No presentar coleccionables, recompra o mercado secundario como inversión regulada ni como liquidez garantizada.","fuentes":[{"id":"courtyard-terms","url":"https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service","tipo":"documento_legal","titulo":"Courtyard terms of service","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web muestra packs y coleccionables tokenizados con custodia física.","fuentes":[{"id":"courtyard-web","url":"https://courtyard.io/","tipo":"empresa","titulo":"Courtyard","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_aplica_plataforma","detalle":"La documentación revisada describe un marketplace de NFT/coleccionables, no una licencia de mercado de valores.","fuentes":[{"id":"courtyard-terms","url":"https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service","tipo":"documento_legal","titulo":"Courtyard terms of service","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"figure","n":"Figure","cat":"Crédito privado","tipo":"Emisor","reg":"EE. UU.","cadenas":"Provenance","ticket":"Alto","acceso":"Institucional","web":"https://figure.com","aval":"Cotiza en Nasdaq (FIGR): cuentas auditadas, información pública trimestral y supervisión de la SEC como emisor.","nota":"Mercado de capitales nativo en blockchain para crédito privado y activos tokenizados, con préstamos hipotecarios (HELOC) en su propia cadena.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"El registro del broker y su actividad ATS no bastan para confirmar condiciones de alta ni elegibilidad desde España.","fuentes":[{"id":"figure-finra","url":"https://files.brokercheck.finra.org/firm/firm_307093.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Figure Securities, Inc.","primaria":true,"consultadaEl":"2026-09-28"},{"id":"figure-open","url":"https://www.figuremarkets.com/c/open","tipo":"empresa","titulo":"Figure Markets OPEN disclosures","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"marca_multi_entidad","detalle":"Distinguir Figure Securities de los servicios de crédito y otras entidades de la marca; comprobar el contrato específico del producto.","fuentes":[{"id":"figure-finra","url":"https://files.brokercheck.finra.org/firm/firm_307093.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Figure Securities, Inc.","primaria":true,"consultadaEl":"2026-09-28"},{"id":"figure-web","url":"https://figure.com/","tipo":"empresa","titulo":"Figure","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"Figure.com mantiene servicios de crédito y enlaces a OPEN y Figure Markets; esto no acredita una oferta de inversión concreta abierta.","fuentes":[{"id":"figure-web","url":"https://figure.com/","tipo":"empresa","titulo":"Figure","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"El informe oficial FINRA de Figure Securities, Inc., CRD 307093, confirma registro SEC y operación de ATS. No se extiende a otras entidades Figure.","fuentes":[{"id":"figure-finra","url":"https://files.brokercheck.finra.org/firm/firm_307093.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Figure Securities, Inc.","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"fireblocks","n":"Fireblocks","cat":"Infraestructura","tipo":"Infraestructura","reg":"Global","cadenas":"Varias","ticket":"No aplica","acceso":"Empresas","web":"https://fireblocks.com","aval":"Custodia institucional con seguros y certificaciones de seguridad, usada por bancos y gestoras de primer nivel.","nota":"El motor de custodia y emisión detrás de decenas de proyectos institucionales de tokenización.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_aplica_plataforma","detalle":"La oferta principal es B2B/institucional, no un marketplace minorista directo.","fuentes":[{"id":"fireblocks-trust","url":"https://www.fireblocks.com/trustco","tipo":"empresa","titulo":"Fireblocks Trust Company","primaria":true,"consultadaEl":"2026-09-28"},{"id":"fireblocks-web","url":"https://fireblocks.com/","tipo":"empresa","titulo":"Fireblocks","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"licencia_entidad_especifica","detalle":"No describir todos los servicios Fireblocks como custodia regulada; separar Trust Company, software y terceros custodios.","fuentes":[{"id":"fireblocks-trust","url":"https://www.fireblocks.com/trustco","tipo":"empresa","titulo":"Fireblocks Trust Company","primaria":true,"consultadaEl":"2026-09-28"},{"id":"nydfs-virtual","url":"https://www.dfs.ny.gov/apps_and_licensing/virtual_currency_businesses","tipo":"regulador","titulo":"NYDFS virtual currency businesses","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web ofrece infraestructura de activos digitales y stablecoins.","fuentes":[{"id":"fireblocks-web","url":"https://fireblocks.com/","tipo":"empresa","titulo":"Fireblocks","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"Fireblocks Trust Company, LLC figura como trust de propósito limitado en NYDFS; la licencia pertenece a esa entidad, no al software completo.","fuentes":[{"id":"fireblocks-trust","url":"https://www.fireblocks.com/trustco","tipo":"empresa","titulo":"Fireblocks Trust Company","primaria":true,"consultadaEl":"2026-09-28"},{"id":"nydfs-virtual","url":"https://www.dfs.ny.gov/apps_and_licensing/virtual_currency_businesses","tipo":"regulador","titulo":"NYDFS virtual currency businesses","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"franklin-templeton","n":"Franklin Templeton","cat":"Tesoro y fondos","tipo":"Emisor","reg":"EE. UU.","cadenas":"Stellar, Varias","ticket":"Bajo","acceso":"Minorista","web":"https://franklintempleton.com","aval":"Gestora tradicional con décadas de historial y fondo registrado ante la SEC. La vía más conservadora para empezar.","nota":"Fondo monetario de deuda pública con el registro de partícipes llevado en cadena desde 2021.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"El folleto contempla app para particulares y portal institucional, con KYC, mínimos y redes sujetos a elegibilidad; no confirma distribución en España.","fuentes":[{"id":"franklin-prospectus","url":"https://www.franklintempleton.com/forms-literature/download-preview/9001-P","tipo":"folleto_regulatorio","titulo":"Franklin OnChain U.S. Government Money Fund prospectus","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"producto_y_geografia","detalle":"No convertir un fondo estadounidense accesible por Benji en oferta minorista global.","fuentes":[{"id":"franklin-prospectus","url":"https://www.franklintempleton.com/forms-literature/download-preview/9001-P","tipo":"folleto_regulatorio","titulo":"Franklin OnChain U.S. Government Money Fund prospectus","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"Benji y el Franklin OnChain U.S. Government Money Fund mantienen superficies y folleto.","fuentes":[{"id":"franklin-benji","url":"https://digitalassets.franklintempleton.com/benji/","tipo":"empresa","titulo":"Franklin Templeton Benji","primaria":true,"consultadaEl":"2026-09-28"},{"id":"franklin-prospectus","url":"https://www.franklintempleton.com/forms-literature/download-preview/9001-P","tipo":"folleto_regulatorio","titulo":"Franklin OnChain U.S. Government Money Fund prospectus","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_documento_producto","detalle":"El folleto y el expediente SEC de 2025 identifican Franklin OnChain U.S. Government Money Fund. La existencia del expediente no significa aprobación o recomendación de SEC ni confirma distribución en España.","fuentes":[{"id":"franklin-prospectus","url":"https://www.franklintempleton.com/forms-literature/download-preview/9001-P","tipo":"folleto_regulatorio","titulo":"Franklin OnChain U.S. Government Money Fund prospectus","primaria":true,"consultadaEl":"2026-09-28"},{"id":"franklin-sec","url":"https://www.sec.gov/Archives/edgar/data/1786958/000174177325002737/c485bpos.htm","tipo":"regulador","titulo":"SEC EDGAR — Franklin OnChain U.S. Government Money Fund","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"inx","n":"INX","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"EE. UU.","cadenas":"Ethereum","ticket":"Bajo","acceso":"Minorista","web":"https://inx.co","aval":"Bróker-dealer registrado ante la SEC y miembro de FINRA; su matriz cotiza en Nasdaq.","nota":"Plataforma regulada de valores digitales con negociación secundaria abierta a minoristas.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"La documentación describe financiación en USD para usuarios estadounidenses y no estadounidenses, pero no acredita admisión desde España ni elegibilidad para cada valor.","fuentes":[{"id":"inx-disclosure","url":"https://inx.co/funds-availability-disclosure","tipo":"documento_legal","titulo":"INX funds availability disclosure","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"no_nasdaq","detalle":"No afirmar que INX cotiza en Nasdaq; la evidencia revisada confirma el broker/ATS, no ese mercado bursátil.","fuentes":[{"id":"inx-finra","url":"https://files.brokercheck.finra.org/firm/firm_162182.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — INX Securities, LLC","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"INX One sigue activo y aparece integrado con el ecosistema Republic.","fuentes":[{"id":"inx-web","url":"https://inx.co/","tipo":"empresa","titulo":"INX One","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"INX Securities, LLC figura en FINRA como broker-dealer registrado y opera un ATS.","fuentes":[{"id":"inx-disclosure","url":"https://inx.co/funds-availability-disclosure","tipo":"documento_legal","titulo":"INX funds availability disclosure","primaria":true,"consultadaEl":"2026-09-28"},{"id":"inx-finra","url":"https://files.brokercheck.finra.org/firm/firm_162182.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — INX Securities, LLC","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"lofty","n":"Lofty","cat":"Inmobiliario","tipo":"Marketplace","reg":"EE. UU.","cadenas":"Algorand","ticket":"Bajo","acceso":"Minorista","web":"https://lofty.ai","aval":"Estructura de LLC por inmueble con oferta registrada; una de las pocas vías reales de entrada minorista al inmobiliario tokenizado.","nota":"Vivienda unifamiliar troceada desde 50 $, con reparto de renta diario y voto de los inversores en cada propiedad.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"Hay información para no estadounidenses, pero no se confirmó base legal, elegibilidad ni comercialización específica en España.","fuentes":[{"id":"lofty-terms","url":"https://www.lofty.ai/terms","tipo":"documento_legal","titulo":"Lofty terms and conditions","primaria":true,"consultadaEl":"2026-09-28"},{"id":"lofty-web","url":"https://lofty.ai/","tipo":"empresa","titulo":"Lofty","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"sin_registro_y_liquidez","detalle":"No llamar 'oferta registrada' al marketplace ni prometer liquidez instantánea; la ejecución ocurre en redes públicas y no se garantiza mejor ejecución.","fuentes":[{"id":"lofty-terms","url":"https://www.lofty.ai/terms","tipo":"documento_legal","titulo":"Lofty terms and conditions","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web y el marketplace de participaciones inmobiliarias siguen activos.","fuentes":[{"id":"lofty-web","url":"https://lofty.ai/","tipo":"empresa","titulo":"Lofty","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"sin_registro_declarado","detalle":"Sus términos declaran que Lofty no está registrada ante la SEC como bolsa de valores ni en otra capacidad.","fuentes":[{"id":"lofty-terms","url":"https://www.lofty.ai/terms","tipo":"documento_legal","titulo":"Lofty terms and conditions","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"maple-finance","n":"Maple Finance","cat":"Crédito privado","tipo":"Emisor","reg":"Global","cadenas":"Ethereum, Solana","ticket":"Alto","acceso":"Institucional","web":"https://maple.finance","aval":"Cifras auditadas y publicadas cada trimestre en formato de resultados; crédito institucional integrado con Robinhood y Kraken.","nota":"El mayor actor del crédito privado tokenizado: cerró el primer semestre de 2026 con 4.600 M$ gestionados (+81 % interanual) y 1.900 M$ en préstamos vivos.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La interfaz syrup excluye varias jurisdicciones, entre ellas EE. UU. La página institucional no permite confirmar en este corte todos los requisitos de alta; comprobar el producto concreto.","fuentes":[{"id":"maple-institutional","url":"https://maple.finance/earn/maple-institutional","tipo":"empresa","titulo":"Maple Institutional","primaria":true,"consultadaEl":"2026-09-28"},{"id":"maple-terms","url":"https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt","tipo":"documento_legal","titulo":"Maple interface terms — syrupUSDC and syrupUSDT","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"producto_a_producto","detalle":"No atribuir licencia o elegibilidad de un pool a todo Maple; protocolo, interfaz, emisor y vehículo son capas distintas.","fuentes":[{"id":"maple-terms","url":"https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt","tipo":"documento_legal","titulo":"Maple interface terms — syrupUSDC and syrupUSDT","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene productos de crédito institucional y syrup.","fuentes":[{"id":"maple-institutional","url":"https://maple.finance/earn/maple-institutional","tipo":"empresa","titulo":"Maple Institutional","primaria":true,"consultadaEl":"2026-09-28"},{"id":"maple-web","url":"https://maple.finance/","tipo":"empresa","titulo":"Maple Finance","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"sin_registro_declarado","detalle":"Los términos de la interfaz syrup declaran que la operadora no está registrada ante ningún regulador.","fuentes":[{"id":"maple-terms","url":"https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt","tipo":"documento_legal","titulo":"Maple interface terms — syrupUSDC and syrupUSDT","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"midas","n":"Midas","cat":"Tesoro y fondos","tipo":"Emisor","reg":"Unión Europea","cadenas":"Ethereum","ticket":"Medio","acceso":"Minorista","web":"https://midas.app","aval":"Emite bajo folleto aprobado en la Unión Europea, lo que obliga a información periódica y responsabilidad del emisor.","nota":"Certificados tokenizados sobre estrategias de renta fija. Levantó 50 M$ con Franklin Templeton y Coinbase Ventures.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"No se obtuvieron términos finales vigentes que permitan confirmar acceso minorista, mínimo de inversión o elegibilidad desde España.","fuentes":[{"id":"midas-mtbill","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill","tipo":"documento_legal","titulo":"Midas mTBILL documentation","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"folleto_vigente_no_confirmado","detalle":"No usar 'aprobado por la FMA' como aval ni como licencia de Midas; exigir folleto y términos finales actualmente vigentes.","fuentes":[{"id":"midas-mtbill","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill","tipo":"documento_legal","titulo":"Midas mTBILL documentation","primaria":true,"consultadaEl":"2026-09-28"},{"id":"midas-old-prospectus","url":"https://www.mfsa.mt/wp-content/uploads/2024/11/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2024.pdf","tipo":"regulador","titulo":"MFSA copy of 2024 Midas base prospectus","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La documentación oficial mantiene una página mTBILL con referencias a folleto y términos finales; la portada transaccional no pudo verificarse.","fuentes":[{"id":"midas-mtbill","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill","tipo":"documento_legal","titulo":"Midas mTBILL documentation","primaria":true,"consultadaEl":"2026-09-28"},{"id":"midas-web","url":"https://midas.app/","tipo":"empresa","titulo":"Midas","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"La nueva página mTBILL enlaza documentos embebidos cuyo contenido vigente no se obtuvo. El folleto regulatorio de 2024 consultado venció el 17/07/2025.","fuentes":[{"id":"midas-mtbill","url":"https://docs.midas.app/resources/legal-product-documentation/mtbill","tipo":"documento_legal","titulo":"Midas mTBILL documentation","primaria":true,"consultadaEl":"2026-09-28"},{"id":"midas-old-prospectus","url":"https://www.mfsa.mt/wp-content/uploads/2024/11/Midas-Software-GmbH-Base-Prospectus-Document-dated-17-July-2024.pdf","tipo":"regulador","titulo":"MFSA copy of 2024 Midas base prospectus","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"ondo-finance","n":"Ondo Finance","cat":"Tesoro y fondos","tipo":"Emisor","reg":"EE. UU.","cadenas":"Ethereum, Solana","ticket":"Alto","acceso":"Acreditado","web":"https://ondo.finance","aval":"La mayor plataforma de valores tokenizados por volumen, con los activos subyacentes en custodia de gestoras reguladas.","nota":"Exposición a deuda pública de EE. UU. y, desde 2026, a ETFs de Franklin Templeton tokenizados.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"Para residentes del EEE, USDY exige cliente profesional o inversor cualificado, además del onboarding del emisor.","fuentes":[{"id":"ondo-usdy-access","url":"https://docs.ondo.finance/general-access-products/usdy/eligibility","tipo":"documento_legal","titulo":"Ondo USDY eligibility","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"no_acceso_general","detalle":"No presentar Ondo como minorista global; incluso productos llamados de acceso general tienen restricciones por jurisdicción.","fuentes":[{"id":"ondo-usdy-access","url":"https://docs.ondo.finance/general-access-products/usdy/eligibility","tipo":"documento_legal","titulo":"Ondo USDY eligibility","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene USDY, OUSG y Ondo Stocks.","fuentes":[{"id":"ondo-web","url":"https://ondo.finance/","tipo":"empresa","titulo":"Ondo Finance","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"No se confirmó una licencia única aplicable a la marca; emisor, producto y jurisdicción deben revisarse por separado.","fuentes":[{"id":"ondo-usdy-access","url":"https://docs.ondo.finance/general-access-products/usdy/eligibility","tipo":"documento_legal","titulo":"Ondo USDY eligibility","primaria":true,"consultadaEl":"2026-09-28"},{"id":"ondo-web","url":"https://ondo.finance/","tipo":"empresa","titulo":"Ondo Finance","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"openeden","n":"OpenEden","cat":"Tesoro y fondos","tipo":"Emisor","reg":"Asia-Pacífico","cadenas":"Ethereum, Arbitrum","ticket":"Alto","acceso":"Institucional","web":"https://openeden.com","aval":"Estructura de fondo con calificación crediticia de agencia y reservas en letras del Tesoro custodiadas por un tercero.","nota":"Letras del Tesoro de EE. UU. envueltas en un token de suscripción y reembolso, para clientes profesionales.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"TBILL es permissioned y se limita a inversores profesionales BVI o acreditados de EE. UU. tras KYC/KYT.","fuentes":[{"id":"openeden-onboarding","url":"https://docs.openeden.com/tbill/investor-onboarding","tipo":"documento_legal","titulo":"OpenEden investor onboarding","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"solo_profesional","detalle":"No presentar TBILL como acceso minorista ni confundir rating del fondo con garantía de capital.","fuentes":[{"id":"openeden-intro","url":"https://docs.openeden.com/tbill/introduction","tipo":"documento_legal","titulo":"OpenEden TBILL introduction","primaria":true,"consultadaEl":"2026-09-28"},{"id":"openeden-onboarding","url":"https://docs.openeden.com/tbill/investor-onboarding","tipo":"documento_legal","titulo":"OpenEden investor onboarding","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La documentación oficial de TBILL y su proceso de onboarding es legible; la portada no aportó contenido verificable.","fuentes":[{"id":"openeden-intro","url":"https://docs.openeden.com/tbill/introduction","tipo":"documento_legal","titulo":"OpenEden TBILL introduction","primaria":true,"consultadaEl":"2026-09-28"},{"id":"openeden-onboarding","url":"https://docs.openeden.com/tbill/investor-onboarding","tipo":"documento_legal","titulo":"OpenEden investor onboarding","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_documento_producto","detalle":"La documentación identifica al emisor TBILL como fondo profesional BVI; no convierte a toda OpenEden en entidad regulada para cada servicio.","fuentes":[{"id":"openeden-intro","url":"https://docs.openeden.com/tbill/introduction","tipo":"documento_legal","titulo":"OpenEden TBILL introduction","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"pax-gold","n":"Pax Gold","cat":"Materias primas","tipo":"Emisor","reg":"EE. UU.","cadenas":"Ethereum","ticket":"Bajo","acceso":"Minorista","web":"https://paxos.com/paxgold","aval":"Emitido por Paxos bajo supervisión del regulador bancario de Nueva York (NYDFS), con atestaciones mensuales del oro asignado.","nota":"Cada token representa una onza concreta de oro asignada en cámaras de Londres, identificable por número de lingote.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"La ficha se dirige a individuos e instituciones, pero no confirmó alta o distribución directa desde España.","fuentes":[{"id":"paxg-web","url":"https://paxos.com/paxgold","tipo":"empresa","titulo":"Pax Gold","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"oro_tokenizado","detalle":"Respaldado y canjeable no significa sin riesgo; verificar custodio, comisiones, tamaño mínimo y canal de redención.","fuentes":[{"id":"paxg-nydfs","url":"https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051","tipo":"regulador","titulo":"NYDFS approval of PAX Gold","primaria":true,"consultadaEl":"2026-09-28"},{"id":"paxg-web","url":"https://paxos.com/paxgold","tipo":"empresa","titulo":"Pax Gold","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"Paxos mantiene la ficha PAXG, custodia y opciones de redención.","fuentes":[{"id":"paxg-web","url":"https://paxos.com/paxgold","tipo":"empresa","titulo":"Pax Gold","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"Paxos Trust Company, National Association figura en la lista OCC de trust banks activos de 31/08/2026. La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.","fuentes":[{"id":"paxg-nydfs","url":"https://www.dfs.ny.gov/reports_and_publications/press_releases/pr1909051","tipo":"regulador","titulo":"NYDFS approval of PAX Gold","primaria":true,"consultadaEl":"2026-09-28"},{"id":"paxg-occ","url":"https://www.occ.gov/topics/charters-and-licensing/financial-institution-lists/trust-by-name.pdf","tipo":"regulador","titulo":"OCC — active national trust banks","primaria":true,"consultadaEl":"2026-09-28"},{"id":"paxg-web","url":"https://paxos.com/paxgold","tipo":"empresa","titulo":"Pax Gold","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental","n":"Reental","cat":"Inmobiliario","tipo":"Emisor","reg":"España","cadenas":"Varias","ticket":"Bajo","acceso":"Minorista","web":"https://reental.co","aval":"Historial de proyectos completados y devueltos, con cientos de reseñas públicas verificadas de inversores.","nota":"Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La FAQ declara alta de adultos tras KYC/AML y exige acreditación a residentes fiscales de EE. UU.; cada emisión conserva sus propios términos.","fuentes":[{"id":"reental-faq","url":"https://www.reental.co/en/faqs","tipo":"empresa","titulo":"Reental FAQ","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"emision_no_licencia_plataforma","detalle":"No convertir el registro de una emisión/ERIR en licencia global de plataforma ni dar por abierta una oportunidad sin ficha actual.","fuentes":[{"id":"reental-emision","url":"https://www.reental.co/en/corporate/reental-lanza-la-primera-emision-de-un-security-token-inmobiliario-en-espana-autorizado-por-la-cnmv","tipo":"empresa","titulo":"Reental — emisión concreta y ERIR","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La FAQ oficial describe registro, KYC/AML y firma del acuerdo; no se comprobó la apertura actual de una emisión concreta.","fuentes":[{"id":"reental-faq","url":"https://www.reental.co/en/faqs","tipo":"empresa","titulo":"Reental FAQ","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"La fuente primaria localizada acredita una emisión española concreta con ERIR; no acredita una autorización general de Reental como empresa de servicios de inversión.","fuentes":[{"id":"reental-emision","url":"https://www.reental.co/en/corporate/reental-lanza-la-primera-emision-de-un-security-token-inmobiliario-en-espana-autorizado-por-la-cnmv","tipo":"empresa","titulo":"Reental — emisión concreta y ERIR","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"republic","n":"Republic","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"EE. UU.","cadenas":"Varias","ticket":"Bajo","acceso":"Minorista","web":"https://republic.com","aval":"Opera con entidades registradas y supervisadas en EE. UU.: OpenDeal Portal LLC como portal de financiación ante la SEC y FINRA desde 2016, y OpenDeal Broker LLC como bróker-dealer miembro de FINRA y SIPC.","nota":"Mercados privados troceados desde importes pequeños: empresas sin cotizar, fondos, cine, deporte y arte. Importante: sus Mirror Tokens no son acciones de la empresa que replican, sino pagarés de la propia Republic que pagan solo si llega una salida a bolsa o una compra.","ver":"2026-08-08","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"Las páginas consultadas no permiten confirmar la elegibilidad vigente para cada oferta ni acceso desde España; debe revisarse la documentación de la emisión.","fuentes":[{"id":"republic-entities","url":"https://republic.com/help/which-entities-comprise-republic-s-family-of-companies","tipo":"empresa","titulo":"Republic group entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"republic-web","url":"https://republic.com/","tipo":"empresa","titulo":"Republic","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"grupo_multi_entidad","detalle":"No atribuir a Republic en bloque el registro de una filial ni omitir el régimen específico de cada oferta.","fuentes":[{"id":"republic-entities","url":"https://republic.com/help/which-entities-comprise-republic-s-family-of-companies","tipo":"empresa","titulo":"Republic group entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"republic-finra","url":"https://files.brokercheck.finra.org/firm/firm_291387.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — OpenDeal Broker LLC","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La plataforma mantiene ofertas y servicios de captación.","fuentes":[{"id":"republic-web","url":"https://republic.com/","tipo":"empresa","titulo":"Republic","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"El informe FINRA CRD 291387 confirma OpenDeal Broker LLC. La página corporativa de entidades declara una actualización de 2022 y no acredita por sí sola todo el organigrama actual.","fuentes":[{"id":"republic-entities","url":"https://republic.com/help/which-entities-comprise-republic-s-family-of-companies","tipo":"empresa","titulo":"Republic group entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"republic-finra","url":"https://files.brokercheck.finra.org/firm/firm_291387.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — OpenDeal Broker LLC","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"securitize","n":"Securitize","cat":"Tesoro y fondos","tipo":"Infraestructura","reg":"EE. UU.","cadenas":"Varias","ticket":"Alto","acceso":"Institucional","web":"https://securitize.io","aval":"Agente de transferencia registrado ante la SEC. Es quien emite y administra el fondo tokenizado BUIDL de BlackRock.","nota":"La infraestructura sobre la que las grandes gestoras sacan sus fondos a la cadena. El nombre más institucional del sector.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"El informe del broker/ATS no acredita alta disponible ni elegibilidad concreta del inversor para cada activo.","fuentes":[{"id":"securitize-finra","url":"https://files.brokercheck.finra.org/firm/firm_283256.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Securitize Markets, LLC","primaria":true,"consultadaEl":"2026-09-28"},{"id":"securitize-web","url":"https://securitize.io/","tipo":"empresa","titulo":"Securitize","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"entidades_separadas","detalle":"Nombrar la filial regulada y no extender su permiso a tokenización, administración o asesoramiento del grupo.","fuentes":[{"id":"securitize-finra","url":"https://files.brokercheck.finra.org/firm/firm_283256.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Securitize Markets, LLC","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"no_verificable","detalle":"La portada no aportó contenido comercial suficiente para verificar la operación actual; el registro de Securitize Markets se comprueba por separado.","fuentes":[{"id":"securitize-finra","url":"https://files.brokercheck.finra.org/firm/firm_283256.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Securitize Markets, LLC","primaria":true,"consultadaEl":"2026-09-28"},{"id":"securitize-web","url":"https://securitize.io/","tipo":"empresa","titulo":"Securitize","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"Securitize Markets, LLC figura como broker-dealer SEC/FINRA y ATS; otras funciones pertenecen a otras filiales.","fuentes":[{"id":"securitize-finra","url":"https://files.brokercheck.finra.org/firm/firm_283256.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — Securitize Markets, LLC","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"spiko","n":"Spiko","cat":"Tesoro y fondos","tipo":"Emisor","reg":"Unión Europea","cadenas":"Varias","ticket":"Bajo","acceso":"Empresas","web":"https://spiko.io","aval":"Fondos monetarios autorizados y supervisados por la AMF, el regulador financiero francés. Marco europeo completo.","nota":"Fondos en euros y dólares pensados para la tesorería de empresas, con reembolso diario.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"Spiko indica que UCITS puede aceptar no profesionales; no se confirmó la comercialización transfronteriza concreta en España.","fuentes":[{"id":"spiko-access","url":"https://www.spiko.io/use-cases/web3","tipo":"empresa","titulo":"Spiko Web3 use case and UCITS access","primaria":true,"consultadaEl":"2026-09-28"},{"id":"spiko-amf","url":"https://geco.amf-france.org/produit-d-epargne/c79399","tipo":"regulador","titulo":"AMF GECO — fondo Spiko","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"distribucion_espana","detalle":"UCITS no equivale por sí solo a onboarding disponible en España; comprobar pasaporte, distribuidor y clase.","fuentes":[{"id":"spiko-amf","url":"https://geco.amf-france.org/produit-d-epargne/c79399","tipo":"regulador","titulo":"AMF GECO — fondo Spiko","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La página oficial Web3 mantiene productos de tesorería, suscripción y reembolso; no se realizó onboarding.","fuentes":[{"id":"spiko-access","url":"https://www.spiko.io/use-cases/web3","tipo":"empresa","titulo":"Spiko Web3 use case and UCITS access","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"La empresa declara fondos UCITS y una licencia ACPR de Spiko Finance, pero GECO no devolvió texto legible y no se verificó directamente el registro actual de la entidad y el fondo.","fuentes":[{"id":"spiko-access","url":"https://www.spiko.io/use-cases/web3","tipo":"empresa","titulo":"Spiko Web3 use case and UCITS access","primaria":true,"consultadaEl":"2026-09-28"},{"id":"spiko-amf","url":"https://geco.amf-france.org/produit-d-epargne/c79399","tipo":"regulador","titulo":"AMF GECO — fondo Spiko","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"superstate","n":"Superstate","cat":"Tesoro y fondos","tipo":"Emisor","reg":"EE. UU.","cadenas":"Ethereum","ticket":"Alto","acceso":"Acreditado","web":"https://superstate.co","aval":"Fondos estadounidenses registrados con administrador y auditor independientes; fundada por un antiguo responsable de Compound.","nota":"Fondos de deuda pública con las participaciones anotadas directamente en cadena.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"USTB exige acreditado y qualified purchaser; no es oferta minorista general.","fuentes":[{"id":"superstate-ustb","url":"https://superstate.com/assets/ustb","tipo":"empresa","titulo":"Superstate USTB","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"solo_cualificados","detalle":"No omitir la doble elegibilidad ni confundir filing/registro con aprobación o garantía.","fuentes":[{"id":"superstate-sec","url":"https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm","tipo":"regulador","titulo":"SEC EDGAR — Superstate Trust filing","primaria":true,"consultadaEl":"2026-09-28"},{"id":"superstate-ustb","url":"https://superstate.com/assets/ustb","tipo":"empresa","titulo":"Superstate USTB","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene fondos tokenizados y FundOS.","fuentes":[{"id":"superstate-ustb","url":"https://superstate.com/assets/ustb","tipo":"empresa","titulo":"Superstate USTB","primaria":true,"consultadaEl":"2026-09-28"},{"id":"superstate-web","url":"https://superstate.co/","tipo":"empresa","titulo":"Superstate","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_documento_producto","detalle":"La ficha actual identifica USTB como Invesco Short Duration US Government Securities Fund. El expediente SEC de Superstate Trust de 2025 se conserva como antecedente, sin atribuirle aprobación ni condiciones actuales.","fuentes":[{"id":"superstate-sec","url":"https://www.sec.gov/Archives/edgar/data/1982577/000110465925042142/tm2513524d1_n1a.htm","tipo":"regulador","titulo":"SEC EDGAR — Superstate Trust filing","primaria":true,"consultadaEl":"2026-09-28"},{"id":"superstate-ustb","url":"https://superstate.com/assets/ustb","tipo":"empresa","titulo":"Superstate USTB","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"swarm","n":"Swarm","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"Unión Europea","cadenas":"Polygon","ticket":"Bajo","acceso":"Minorista","web":"https://swarm.com","aval":"Opera bajo licencia de intermediación financiera de BaFin, el regulador alemán, con respaldo 1:1 verificable.","nota":"Acciones y bonos tokenizados negociables dentro del marco regulatorio alemán.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"No se pudieron leer los términos actuales. El texto de 2022 de la revisión anterior no acredita el acceso de 2026.","fuentes":[{"id":"swarm-terms","url":"https://swarm.com/terms/","tipo":"documento_legal","titulo":"Swarm Markets terms","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"acceso_no_confirmado","detalle":"No presentar Swarm como acceso minorista disponible sin condiciones actuales de alta, entidad y jurisdicción verificables.","fuentes":[{"id":"swarm-terms","url":"https://swarm.com/terms/","tipo":"documento_legal","titulo":"Swarm Markets terms","primaria":true,"consultadaEl":"2026-09-28"},{"id":"swarm-web","url":"https://swarm.com/","tipo":"empresa","titulo":"Swarm","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"no_verificable","detalle":"La web redirige a una aplicación sin contenido extraíble; no se confirmó actividad transaccional ni una oferta abierta.","fuentes":[{"id":"swarm-web","url":"https://swarm.com/","tipo":"empresa","titulo":"Swarm","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_verificable","detalle":"No se obtuvo durante el barrido un registro primario actual que delimitase entidad y permisos; no se reutiliza la etiqueta genérica 'regulada por BaFin'.","fuentes":[{"id":"swarm-terms","url":"https://swarm.com/terms/","tipo":"documento_legal","titulo":"Swarm Markets terms","primaria":true,"consultadaEl":"2026-09-28"},{"id":"swarm-web","url":"https://swarm.com/","tipo":"empresa","titulo":"Swarm","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"taurus","n":"Taurus","cat":"Infraestructura","tipo":"Infraestructura","reg":"Suiza","cadenas":"Varias","ticket":"No aplica","acceso":"Empresas","web":"https://taurushq.com","aval":"Proveedor suizo de custodia para bancos regulados, con despliegues verificables en entidades europeas.","nota":"Custodia y emisión de valores digitales para banca, con la exigencia de auditoría del sector bancario.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"confirmado_condicionado","detalle":"La documentación contempla clientes minoristas, profesionales e institucionales, en ejecución-only; onboarding desde España no confirmado.","fuentes":[{"id":"taurus-disclosure","url":"https://www.taurushq.com/legal/taurus-sa-terms/important-risk-regulatory-disclosure/","tipo":"documento_legal","titulo":"Taurus regulatory disclosure","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"execution_only","detalle":"No confundir clasificación de cliente con disponibilidad universal, asesoramiento o evaluación de idoneidad.","fuentes":[{"id":"taurus-disclosure","url":"https://www.taurushq.com/legal/taurus-sa-terms/important-risk-regulatory-disclosure/","tipo":"documento_legal","titulo":"Taurus regulatory disclosure","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene infraestructura, custodia y T-DX.","fuentes":[{"id":"taurus-web","url":"https://taurushq.com/","tipo":"empresa","titulo":"Taurus","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"Taurus SA figura en FINMA como securities firm y declara operar T-DX como OTF.","fuentes":[{"id":"taurus-disclosure","url":"https://www.taurushq.com/legal/taurus-sa-terms/important-risk-regulatory-disclosure/","tipo":"documento_legal","titulo":"Taurus regulatory disclosure","primaria":true,"consultadaEl":"2026-09-28"},{"id":"taurus-finma","url":"https://www.finma.ch/en/~/media/finma/dokumente/bewilligungstraeger/pdf/beh.pdf","tipo":"regulador","titulo":"FINMA authorised banks and securities firms","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"tokeny","n":"Tokeny","cat":"Infraestructura","tipo":"Infraestructura","reg":"Unión Europea","cadenas":"Varias","ticket":"No aplica","acceso":"Empresas","web":"https://tokeny.com","aval":"Autora del estándar ERC-3643, hoy la referencia del sector para tokens con reglas de cumplimiento incorporadas.","nota":"La capa de cumplimiento normativo que usan decenas de emisores institucionales.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_aplica_plataforma","detalle":"Los servicios son para clientes profesionales; Tokeny no es el punto de acceso inversor a una oferta única.","fuentes":[{"id":"tokeny-terms","url":"https://tokeny.com/general-terms-of-service/","tipo":"documento_legal","titulo":"Tokeny general terms of service","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"proveedor_no_emisor","detalle":"No atribuir a Tokeny la licencia, custodia, solvencia o elegibilidad del emisor que usa su software.","fuentes":[{"id":"tokeny-terms","url":"https://tokeny.com/general-terms-of-service/","tipo":"documento_legal","titulo":"Tokeny general terms of service","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene software de emisión y cumplimiento on-chain.","fuentes":[{"id":"tokeny-web","url":"https://tokeny.com/","tipo":"empresa","titulo":"Tokeny","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"no_aplica_plataforma","detalle":"Sus términos definen a Tokeny como proveedor tecnológico; el cliente/emisor conserva las obligaciones financieras y regulatorias.","fuentes":[{"id":"tokeny-terms","url":"https://tokeny.com/general-terms-of-service/","tipo":"documento_legal","titulo":"Tokeny general terms of service","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"tzero","n":"tZERO","cat":"Acciones y capital privado","tipo":"Marketplace","reg":"EE. UU.","cadenas":"Varias","ticket":"Bajo","acceso":"Minorista","web":"https://tzero.com","aval":"Opera un sistema alternativo de negociación (ATS) autorizado por la SEC y supervisado por FINRA.","nota":"El mercado secundario de referencia en EE. UU. para valores emitidos en cadena.","ver":"2026-07-26","verificacionLocal":{"acceso":{"estado":"no_verificable","detalle":"La web contempla negociación y servicios para inversores, pero no se comprobaron las condiciones de alta y admisión desde España para cada activo.","fuentes":[{"id":"tzero-company","url":"https://tzero.com/company","tipo":"empresa","titulo":"tZERO company and regulatory entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"tzero-web","url":"https://tzero.com/","tipo":"empresa","titulo":"tZERO","primaria":true,"consultadaEl":"2026-09-28"}]},"verificadoEl":"2026-09-28","alertasCriticas":[{"codigo":"entidad_y_activo","detalle":"No extender SEC/FINRA a todo el grupo ni asumir que cada activo del ATS está abierto a minoristas.","fuentes":[{"id":"tzero-company","url":"https://tzero.com/company","tipo":"empresa","titulo":"tZERO company and regulatory entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"tzero-finra","url":"https://files.brokercheck.finra.org/firm/firm_123421.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — tZERO Securities, LLC","primaria":true,"consultadaEl":"2026-09-28"}]}],"estadoOperativo":{"estado":"observada","detalle":"La web mantiene infraestructura de emisión, trading y custodia.","fuentes":[{"id":"tzero-company","url":"https://tzero.com/company","tipo":"empresa","titulo":"tZERO company and regulatory entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"tzero-web","url":"https://tzero.com/","tipo":"empresa","titulo":"tZERO","primaria":true,"consultadaEl":"2026-09-28"}]},"licenciaRegistro":{"estado":"confirmada_regulador","detalle":"tZERO Securities, LLC figura en FINRA como broker-dealer y opera ATS; otras funciones pertenecen a entidades separadas.","fuentes":[{"id":"tzero-company","url":"https://tzero.com/company","tipo":"empresa","titulo":"tZERO company and regulatory entities","primaria":true,"consultadaEl":"2026-09-28"},{"id":"tzero-finra","url":"https://files.brokercheck.finra.org/firm/firm_123421.pdf","tipo":"regulador","titulo":"FINRA BrokerCheck — tZERO Securities, LLC","primaria":true,"consultadaEl":"2026-09-28"}]},"conservaFechaCanonica":true}},
];

/* Estas portadas explican visualmente el tipo de activo. No son fotografías
   de un proyecto concreto de la empresa: el distintivo y la ficha lo dicen
   de forma visible, y la procedencia completa queda en fuentes.json. */
const PORTADAS_GENERADAS_MOVIL=new Set([
 'ADDX','Archax','ARTEX Global Markets','Backed Finance','Blocksquare','Centrifuge',
 'Courtyard','Figure','Fireblocks','Franklin Templeton','INX','Lofty','Maple Finance',
 'Midas','Ondo Finance','OpenEden','Pax Gold','Reental','Republic','Securitize','Spiko',
 'Superstate','Swarm','Taurus','Tokeny','tZERO'
]);
const portadaEsIlustrativa=p=>PORTADAS_GENERADAS_MOVIL.has(p.n);

/* ---- DESCARTADAS · nombre, motivo verificado y fuente ---- */
const FUERA=[
 {n:"Domoblock",badge:"Sin supervisión",why:"La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables. Antes sus emisiones pasaban por una ESI autorizada; dejó de ser así a partir del proyecto DOMO-VLC-4.",fuentes:[{url:"https://redinversora.com/recursos/inversion-alternativa/domoblock",titulo:"RedInversora · análisis de Domoblock con datos verificados"},{url:"https://todocrowdlending.com/domoblock/",titulo:"TodoCrowdlending · situación regulatoria de Domoblock"}]},
 {n:"Goldfinch",badge:"Cierre aprobado",why:"En junio de 2026 la comunidad aprobó el cierre de Goldfinch Prime. Quedan más de 50 M$ sin devolver en los fondos de prestatarios y solo se ha recuperado en torno al 30 % del capital: de ocho prestatarios, dos en impago y seis en reestructuración.",fuentes:[{url:"https://www.theblock.co/post/405825/goldfinch-set-shutter-prime-community-vote-backs-wind-down-proposal",titulo:"The Block · la comunidad aprueba el cierre de Goldfinch Prime"},{url:"https://thedefiant.io/news/defi/goldfinch-finance-winds-down-depositors-report-50m-defaults",titulo:"The Defiant · Goldfinch cierra; los depositantes declaran 50 M$ en impagos"}]},
 {n:"RealT",badge:"En liquidación",why:"Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.",fuentes:[{url:"https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit",titulo:"Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token"},{url:"https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/",titulo:"BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones"},{url:"https://www.bridgedetroit.com/real-token-detroit-rent-repairs/",titulo:"BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar"}]},
 {n:"Toucan Protocol",badge:"Registro bloqueado",why:"El bloqueo no es suyo sino del registro: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.",fuentes:[{url:"https://www.spglobal.com/commodity-insights/en/news-research/latest-news/energy-transition/052522-as-verra-halts-tokenization-of-carbon-credits-toucan-vows-to-keep-web3-ethos-alive",titulo:"S&P Global · Verra detiene la tokenización de créditos de carbono"},{url:"https://carboncredits.com/verra-suspension-carbon-credits-proposes-immobilizing-credits/",titulo:"CarbonCredits · Verra prohíbe tokenizar créditos retirados y propone inmovilizarlos"},{url:"https://blog.toucan.earth/response-to-verras-announcement/",titulo:"Toucan · su propia respuesta al anuncio de Verra"}]},
];

/* ---- EMISIONES · el publicador sustituye este array desde Supabase ----
   Los datos permanecen en JavaScript externo para que la CSP pueda prohibir
   cualquier script inline. Un fallo de la consulta detiene la publicación:
   una lista vacía es válida; fingir que no hay emisiones por un error no. */
const EMI=[
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"boss-info","tipo":"valor","titulo":"Boss Info","plataformaSlug":"aktionariat","plataformaNombre":"Aktionariat · BOSS","categoria":"Acciones y capital privado","pais":"CH","resumen":"Referencia de acciones tokenizadas BOSS de Boss Info. Se recupera la última operación documentada con su fecha original; no se presenta como precio de hoy.","url":"https://shares.bossinfo.com","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"CHF","etiqueta":"Moneda"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.bossinfo.com","https://shares.bossinfo.com/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.bossinfo.com","https://shares.bossinfo.com/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de acciones tokenizadas BOSS de Boss Info. Se recupera la última operación documentada con su fecha original; no se presenta como precio de hoy.","referencias":[{"valor":"8,44 CHF","fuente":"https://shares.bossinfo.com/","alcance":"La revisión del 27/09/2026 seguía mostrando esta operación de agosto. Referencia histórica, no cotización ejecutable ni prueba de liquidez.","etiqueta":"Último cruce documentado","fechaDato":"2026-08-29","fechaConsulta":"2026-09-27"},{"valor":"8,50 CHF · compra directa al emisor · último cruce de mercado: 8,44 CHF, el 29 ago","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Servicios TI a pymes","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Sector · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1998","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Fundada · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"156","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Accionistas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,65 M · el 100 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Tokenizadas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,70 CHF","fuente":"https://shares.bossinfo.com/","alcance":"Último cruce publicado a las 11:32, sin zona horaria indicada en esta lectura. No confirma un precio ejecutable hoy ni el precio de venta directa.","etiqueta":"Último cruce publicado","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"155","fuente":"https://shares.bossinfo.com/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Accionistas publicados","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"10.650.100 BOSS","fuente":"https://shares.bossinfo.com/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Acciones tokenizadas publicadas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Aktionariat · BOSS","etiqueta":"Proveedor"},{"valor":"CHF","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"aktionariat","tipo":"valor","titulo":"Aktionariat","plataformaSlug":"aktionariat","plataformaNombre":"Aktionariat · DAKS","categoria":"Acciones y capital privado","pais":"CH","resumen":"Acciones tokenizadas DAKS de Aktionariat AG, empresa suiza que ofrece tecnología para emitir y gestionar acciones tokenizadas. La página distingue inversión directa y negociación secundaria; los datos observados no garantizan una contraparte.","url":"https://shares.aktionariat.com","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"CHF","etiqueta":"Moneda"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.aktionariat.com","https://shares.aktionariat.com/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.aktionariat.com","https://shares.aktionariat.com/"],"revisadaEl":"2026-09-30","descripcion":"Acciones tokenizadas DAKS de Aktionariat AG, empresa suiza que ofrece tecnología para emitir y gestionar acciones tokenizadas. La página distingue inversión directa y negociación secundaria; los datos observados no garantizan una contraparte.","referencias":[{"valor":"6,25 CHF","fuente":"https://shares.aktionariat.com/","alcance":"La página sigue mostrando el cruce del 22/09/2026 a las 20:21. No es una cotización de ejecución garantizada ni prueba de liquidez actual.","etiqueta":"Último cruce publicado","fechaDato":"2026-09-22","fechaConsulta":"2026-09-30"},{"valor":"7,25 CHF · compra directa al emisor · último cruce de mercado: 6,25 CHF, el 22 sep","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Fintech","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Sector · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2020","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Fundada · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"368","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Accionistas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Transferencia o cripto","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Pago · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,25 CHF","fuente":"https://shares.aktionariat.com/","alcance":"Último cruce fechado por el portal. No es un precio ejecutable hoy, ni verifica el precio de emisión directa del artefacto.","etiqueta":"Último cruce publicado","fechaDato":"2026-09-22","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Aktionariat · DAKS","etiqueta":"Proveedor"},{"valor":"CHF","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"Último cruce, precio de emisión y órdenes de venta son magnitudes distintas.","etiqueta":"Distinción de precios"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"servicehunter-quitt","tipo":"valor","titulo":"ServiceHunter · quitt","plataformaSlug":"aktionariat","plataformaNombre":"Aktionariat · DQTS","categoria":"Acciones y capital privado","pais":"CH","resumen":"Acciones tokenizadas de ServiceHunter AG, operadora de quitt. La ficha conserva el último cruce documentado y distingue la identidad del emisor del nombre comercial de su servicio.","url":"https://shares.quitt.ch","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"CHF","etiqueta":"Moneda"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.quitt.ch","https://shares.quitt.ch/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.quitt.ch","https://shares.quitt.ch/"],"revisadaEl":"2026-09-30","descripcion":"Acciones tokenizadas de ServiceHunter AG, operadora de quitt. La ficha conserva el último cruce documentado y distingue la identidad del emisor del nombre comercial de su servicio.","referencias":[{"valor":"8,00 CHF","fuente":"https://shares.quitt.ch/","alcance":"Operación de julio que continuaba mostrada en la consulta del 27/09/2026. No acredita precio ejecutable ni liquidez actual.","etiqueta":"Último cruce documentado","fechaDato":"2026-07-23","fechaConsulta":"2026-09-27"},{"valor":"8,00 CHF · precio de mercado · último cruce el 23 jul 2026","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"SaaS · empleo doméstico","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Sector · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2010","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Fundada · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"229","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Accionistas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1,66 M de 2,00 M","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Tokenizadas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"8,00 CHF","fuente":"https://shares.quitt.ch/","alcance":"Último cruce publicado a las 15:19, sin zona horaria indicada en esta lectura. No confirma un precio ejecutable hoy ni el precio de venta directa.","etiqueta":"Último cruce publicado","fechaDato":"2026-07-23","fechaConsulta":"2026-09-30"},{"valor":"227","fuente":"https://shares.quitt.ch/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Accionistas publicados","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"1.655.280 DQTS","fuente":"https://shares.quitt.ch/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Acciones tokenizadas publicadas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Aktionariat · DQTS","etiqueta":"Proveedor"},{"valor":"CHF","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"switzerlend","tipo":"valor","titulo":"Switzerlend","plataformaSlug":"aktionariat","plataformaNombre":"Aktionariat · LENDS","categoria":"Acciones y capital privado","pais":"CH","resumen":"Acciones tokenizadas LENDS de Switzerlend. La referencia corresponde al capital de la empresa y es distinta de los préstamos ofrecidos por la plataforma LEND.","url":"https://shares.lend.ch","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"CHF","etiqueta":"Moneda"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.lend.ch","https://shares.lend.ch/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.lend.ch","https://shares.lend.ch/"],"revisadaEl":"2026-09-30","descripcion":"Acciones tokenizadas LENDS de Switzerlend. La referencia corresponde al capital de la empresa y es distinta de los préstamos ofrecidos por la plataforma LEND.","referencias":[{"valor":"68,01 CHF","fuente":"https://shares.lend.ch/","alcance":"Última operación mostrada durante la revisión del 27/09/2026. Referencia histórica; no se garantiza ejecución ni liquidez actual.","etiqueta":"Último cruce documentado","fechaDato":"2026-09-25","fechaConsulta":"2026-09-27"},{"valor":"68,00 CHF · última operación · 25 sep 2026, al mismo precio que el mercado","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Crédito","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Sector · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2015","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Fundada · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"283","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Accionistas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"C1 · 27.277 tokens","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Clase · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"68,01 CHF","fuente":"https://shares.lend.ch/","alcance":"Último cruce publicado a las 13:32, sin zona horaria indicada en esta lectura. No confirma un precio ejecutable hoy ni el precio de venta directa.","etiqueta":"Último cruce publicado","fechaDato":"2026-09-25","fechaConsulta":"2026-09-30"},{"valor":"285","fuente":"https://shares.lend.ch/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Accionistas publicados","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"27.277 LENDS · clase C1","fuente":"https://shares.lend.ch/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Acciones tokenizadas publicadas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Aktionariat · LENDS","etiqueta":"Proveedor"},{"valor":"CHF","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"C1 (LENDS). La capitalización de la empresa no se compara con una sola clase para inferir un descuadre.","etiqueta":"Clase de acciones"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"mf-one","tipo":"rendimiento","titulo":"mF-ONE","plataformaSlug":"midas","plataformaNombre":"Midas","categoria":"Crédito privado","pais":"UE","resumen":"Producto de crédito respaldado por activos mF-ONE del catálogo de Midas. APY ilustrativo de los últimos siete días; variable y no garantizado.","url":"https://midas.app/mfone","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":{"literal":"APY ilustrativo de los últimos siete días; variable y no garantizado.","mostrada":"7,50 %"},"precio":null,"metricas":[{"valor":"USD","etiqueta":"Moneda"},{"valor":"7,50 %","etiqueta":"APY publicado · 7 días"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"},{"tono":"warn","texto":"Los rendimientos son variables. El proveedor advierte que los plazos de reembolso son indicativos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mfone","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mfone","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance"],"revisadaEl":"2026-09-30","descripcion":"Producto de crédito respaldado por activos mF-ONE del catálogo de Midas. APY ilustrativo de los últimos siete días; variable y no garantizado.","referencias":[{"valor":"7,51 %","fuente":"https://midas.app/mfone","alcance":"Instantánea indicativa y variable observada el 21/09/2026; la fuente no establece aquí una fecha de cálculo independiente. No se pudo revalidar en la consulta del 27/09/2026 y no representa rendimiento actual ni garantizado.","etiqueta":"APY observado","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"0,60 % anual sobre AUM","fuente":"https://midas.app/mfone","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas.","etiqueta":"Comisión publicada · Gestión","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"0 %","fuente":"https://midas.app/mfone","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas.","etiqueta":"Comisión publicada · Performance","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"7,54 % · APY 7 d · 7,57 % a 30 d","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Sin plazo Acumulación · reembolso instantáneo TVL 65,6 M$ Sin entrada mínima publicada","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"7,50 % · 7D APY","fuente":"https://midas.app/products","alcance":"APY ilustrativo de los últimos siete días; variable y no garantizado. Observado el 30/09; la fecha de consulta no transforma ese periodo en rentabilidad actual garantizada.","etiqueta":"Rendimiento publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"$65.63M","fuente":"https://midas.app/products","alcance":"TVL mostrado al consultar el catálogo el 30/09/2026; no es una cifra de liquidez disponible para ejecutar una orden.","etiqueta":"TVL publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Midas","etiqueta":"Proveedor"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"mglo","tipo":"rendimiento","titulo":"mGLO","plataformaSlug":"midas","plataformaNombre":"Midas","categoria":"Crédito privado","pais":"UE","resumen":"Producto de crédito respaldado por activos mGLO del catálogo de Midas. Periodo publicado: 1–31 de agosto; dato histórico.","url":"https://midas.app/mglo","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"USD","etiqueta":"Moneda"},{"valor":"1–31 de agosto · dato histórico","etiqueta":"Periodo del rendimiento publicado"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"},{"tono":"warn","texto":"Los rendimientos son variables. El proveedor advierte que los plazos de reembolso son indicativos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mglo","https://midas.app/products"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mglo","https://midas.app/products"],"revisadaEl":"2026-09-30","descripcion":"Producto de crédito respaldado por activos mGLO del catálogo de Midas. Periodo publicado: 1–31 de agosto; dato histórico.","referencias":[{"valor":"7,01 % · APY de agosto (1-31) · TVL 62,9 M$","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Sin plazo Acumulación · reembolso instantáneo TVL 62,9 M$ Sin entrada mínima publicada","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"7,01 % · August 1-31","fuente":"https://midas.app/products","alcance":"Periodo publicado: 1–31 de agosto; dato histórico. Observado el 30/09; la fecha de consulta no transforma ese periodo en rentabilidad actual garantizada.","etiqueta":"Rendimiento publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"$119.02M","fuente":"https://midas.app/products","alcance":"TVL mostrado al consultar el catálogo el 30/09/2026; no es una cifra de liquidez disponible para ejecutar una orden.","etiqueta":"TVL publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Midas","etiqueta":"Proveedor"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"mglobal","tipo":"rendimiento","titulo":"mGLOBAL","plataformaSlug":"midas","plataformaNombre":"Midas","categoria":"Crédito privado","pais":"UE","resumen":"Producto de crédito respaldado por activos mGLOBAL del catálogo de Midas. Periodo publicado: 1–31 de agosto; dato histórico.","url":"https://midas.app/mglobal","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"USD","etiqueta":"Moneda"},{"valor":"1–31 de agosto · dato histórico","etiqueta":"Periodo del rendimiento publicado"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"},{"tono":"warn","texto":"Los rendimientos son variables. El proveedor advierte que los plazos de reembolso son indicativos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mglobal","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mglobal","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance"],"revisadaEl":"2026-09-30","descripcion":"Producto de crédito respaldado por activos mGLOBAL del catálogo de Midas. Periodo publicado: 1–31 de agosto; dato histórico.","referencias":[{"valor":"6,65 % · periodo 1–31 de julio","fuente":"https://midas.app/mglobal","alcance":"La revisión del 21/09/2026 identifica expresamente un periodo histórico de julio. No es un rendimiento de septiembre ni se ha revalidado; se conserva sin inferir una fecha completa del dato.","etiqueta":"Rendimiento histórico publicado","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"0,40 % anual sobre AUM","fuente":"https://midas.app/mglobal","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas.","etiqueta":"Comisión publicada · Gestión","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"6,65 % · APY de agosto (1-31) · TVL 67,7 M$","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Sin plazo Acumulación · reembolso instantáneo TVL 67,7 M$ Sin entrada mínima publicada","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,65 % · August 1-31","fuente":"https://midas.app/products","alcance":"Periodo publicado: 1–31 de agosto; dato histórico. Observado el 30/09; la fecha de consulta no transforma ese periodo en rentabilidad actual garantizada.","etiqueta":"Rendimiento publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"$34.06M","fuente":"https://midas.app/products","alcance":"TVL mostrado al consultar el catálogo el 30/09/2026; no es una cifra de liquidez disponible para ejecutar una orden.","etiqueta":"TVL publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Midas","etiqueta":"Proveedor"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"mtbill","tipo":"rendimiento","titulo":"mTBILL","plataformaSlug":"midas","plataformaNombre":"Midas","categoria":"Tesoro y fondos","pais":"UE","resumen":"Producto de renta fija mTBILL del catálogo de Midas. El APY mostrado es una estimación anualizada de los últimos siete días y puede variar.","url":"https://midas.app/mtbill","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":{"literal":"APY ilustrativo de los últimos siete días; variable y no garantizado.","mostrada":"3,42 %"},"precio":null,"metricas":[{"valor":"USD","etiqueta":"Moneda"},{"valor":"3,42 %","etiqueta":"APY publicado · 7 días"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"},{"tono":"warn","texto":"Los rendimientos son variables. El proveedor advierte que los plazos de reembolso son indicativos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mtbill","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mtbill","https://midas.app/products","https://docs.midas.app/legal/eligibility-and-compliance","https://docs.midas.app/tokens/mtbill"],"revisadaEl":"2026-09-30","descripcion":"Producto de renta fija mTBILL del catálogo de Midas. El APY mostrado es una estimación anualizada de los últimos siete días y puede variar.","referencias":[{"valor":"3,41 %","fuente":"https://midas.app/mtbill","alcance":"Instantánea indicativa y variable observada el 21/09/2026; la fuente no establece aquí una fecha de cálculo independiente. No se pudo revalidar en la consulta del 27/09/2026 y no representa rendimiento actual ni garantizado.","etiqueta":"APY observado","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"0 %","fuente":"https://midas.app/mtbill","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas.","etiqueta":"Comisión publicada · Gestión","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"5 % sobre el rendimiento","fuente":"https://midas.app/mtbill","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas.","etiqueta":"Comisión publicada · Performance","fechaDato":null,"fechaConsulta":"2026-09-21"},{"valor":"3,44 % · APY 7 d · 3,44 % a 30 d","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Sin plazo Acumulación · reembolso instantáneo TVL 76,5 M$ Sin entrada mínima publicada","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"3,42 % · 7D APY","fuente":"https://midas.app/products","alcance":"APY ilustrativo de los últimos siete días; variable y no garantizado. Observado el 30/09; la fecha de consulta no transforma ese periodo en rentabilidad actual garantizada.","etiqueta":"Rendimiento publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"$76.36M","fuente":"https://midas.app/products","alcance":"TVL mostrado al consultar el catálogo el 30/09/2026; no es una cifra de liquidez disponible para ejecutar una orden.","etiqueta":"TVL publicado en Midas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Midas","etiqueta":"Proveedor"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"prosegur-digital-gold","tipo":"valor","titulo":"Prosegur Digital Gold","plataformaSlug":"prosegur-crypto","plataformaNombre":"Prosegur Crypto","categoria":"Materias primas","pais":"ES","resumen":"Oro digital que el proveedor describe como respaldado por oro físico. Cada token representa un gramo. Su valor varía con la cotización del oro.","url":"https://www.prosegurcrypto.com/digital-gold","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"EUR","etiqueta":"Moneda"},{"valor":"1 gramo","etiqueta":"Compra mínima publicada"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"},{"tono":"warn","texto":"El precio del oro puede bajar; el proveedor no garantiza rentabilidad ni valor fijo.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.prosegurcrypto.com/digital-gold","https://prosegurdigitalgold.com/transparency"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.prosegurcrypto.com/digital-gold","https://prosegurdigitalgold.com/transparency"],"revisadaEl":"2026-09-30","descripcion":"Oro digital que el proveedor describe como respaldado por oro físico. Cada token representa un gramo. Su valor varía con la cotización del oro.","referencias":[{"valor":"≈116,98 € · por gramo · cálculo propio sobre 3.638,43 €/onza, leída a las 11:14","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1 g físico, 1:1","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Respaldo · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1 gramo","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Compra mínima · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Sin comisiones","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Custodia · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"menos de 24 h","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Liquidación · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"mensual certificada","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Auditoría · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1 gramo de oro físico por token","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garantía del precio o de ejecución.","etiqueta":"Unidad descrita","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"1 gramo","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garantía del precio o de ejecución.","etiqueta":"Compra mínima publicada","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"Sin tarifas de custodia según el proveedor","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garantía del precio o de ejecución.","etiqueta":"Custodia publicada","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"Menos de 24 horas según el proveedor","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garantía del precio o de ejecución.","etiqueta":"Liquidación publicada","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"Mensuales y certificadas según el proveedor","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garantía del precio o de ejecución.","etiqueta":"Auditorías publicadas","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Prosegur Crypto","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"1 gramo de oro físico por token","etiqueta":"Unidad descrita"},{"valor":"1 gramo","etiqueta":"Compra mínima publicada"},{"valor":"Sin tarifas de custodia según el proveedor","etiqueta":"Custodia publicada"},{"valor":"Menos de 24 horas según el proveedor","etiqueta":"Liquidación publicada"},{"valor":"Mensuales y certificadas según el proveedor","etiqueta":"Auditorías publicadas"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"spiko-letras-del-tesoro-euro","tipo":"rendimiento","titulo":"Spiko Letras del Tesoro Euro","plataformaSlug":"spiko","plataformaNombre":"Spiko","categoria":"Tesoro y fondos","pais":"FR","resumen":"Fondo monetario en euros de valor liquidativo variable a corto plazo, identificado como Spiko EU T-Bills Money Market Fund. La ficha publica documentación y datos del fondo; la elegibilidad y las operaciones corresponden al proveedor.","url":"https://www.spiko.io/es/spiko-letras-del-tesoro-euro","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":{"literal":"Rendimiento anualizado a 30 días observado el 30/09/2026; variable y no garantizado.","mostrada":"2,17 %"},"precio":null,"metricas":[{"valor":"EUR","etiqueta":"Moneda"},{"valor":"1 EUR","etiqueta":"Suscripción inicial publicada"},{"valor":"2,17 %","etiqueta":"Rendimiento publicado · 30 días"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"actual","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.spiko.io/es/spiko-letras-del-tesoro-euro","https://data.spiko.io/eutbl/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.spiko.io/es/spiko-letras-del-tesoro-euro","https://data.spiko.io/eutbl/"],"revisadaEl":"2026-09-30","descripcion":"Fondo monetario en euros de valor liquidativo variable a corto plazo, identificado como Spiko EU T-Bills Money Market Fund. La ficha publica documentación y datos del fondo; la elegibilidad y las operaciones corresponden al proveedor.","referencias":[{"valor":"2,17 %","fuente":"https://data.spiko.io/eutbl/","alcance":"Dato leído el 30/09/2026. La página no fecha por separado el cálculo del rendimiento; no se le atribuye la fecha del NAV. Rendimiento variable, no garantizado ni ejecutable.","etiqueta":"Rendimiento anualizado a 30 días observado","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"1,0597 EUR","fuente":"https://data.spiko.io/eutbl/","alcance":"La fuente fecha expresamente este valor liquidativo el 28/09/2026; la consulta del 30/09/2026 no transforma el dato en un NAV de ese día.","etiqueta":"Último NAV publicado","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1 EUR","fuente":"https://data.spiko.io/eutbl/","alcance":"Condición mostrada durante la consulta; no prueba acceso específico desde España ni aceptación de una suscripción. Confirmar condiciones con el proveedor.","etiqueta":"Suscripción inicial mínima publicada","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"0,25 %","fuente":"https://data.spiko.io/eutbl/","alcance":"La ficha de producto describe esta comisión como anual. Condición observada; no se inventa una fecha de entrada en vigor.","etiqueta":"Gestión publicada","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"2,18 % · neto de comisiones · 31 días","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"EN EUROS Sin plazo · retirada instantánea Desde 1 € 659 M€ en el fondo UCITS · AMF","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2,17 %","fuente":"https://data.spiko.io/eutbl/","alcance":"Observado en el panel de la clase EUR el 30/09/2026. No es el 2,18 % a 31 días del artefacto ni una garantía de rentabilidad.","etiqueta":"Rendimiento anualizado a 30 días","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"1,0597 EUR","fuente":"https://data.spiko.io/eutbl/","alcance":"La fuente fecha el último NAV el 28/09/2026; esa fecha no fecha por sí sola los otros indicadores del panel.","etiqueta":"NAV publicado","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1 EUR","fuente":"https://data.spiko.io/eutbl/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Suscripción inicial mínima","fechaDato":null,"fechaConsulta":"2026-09-30"},{"valor":"0,25 %","fuente":"https://data.spiko.io/eutbl/","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado.","etiqueta":"Gestión publicada","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Spiko","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"wemakeit","tipo":"valor","titulo":"wemakeit","plataformaSlug":"aktionariat","plataformaNombre":"Aktionariat · WMKT","categoria":"Acciones y capital privado","pais":"CH","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://shares.wemakeit.com","verificadaEl":"2026-09-30","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-30"}],"estadoRevision":"fuentes_en_conflicto","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.wemakeit.com","https://shares.wemakeit.com/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://shares.wemakeit.com","https://shares.wemakeit.com/"],"revisadaEl":"2026-09-30","descripcion":"Acciones tokenizadas de wemakeit, la empresa que opera la plataforma de crowdfunding. Esta referencia corresponde al capital de la empresa, no a los proyectos alojados en la plataforma.","referencias":[{"valor":"8,38 CHF","fuente":"https://shares.wemakeit.com/","alcance":"La fuente lo identifica como valor definido por el emisor, no como último cruce. No se conoce aquí una fecha de cálculo independiente ni se garantiza ejecución.","etiqueta":"Valor definido por el emisor","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"0,85 CHF · precio de mercado · último cruce el 22 sep 2026","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Crowdfunding","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Sector · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2012","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Fundada · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"5.276","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Accionistas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"435.384 de 1,05 M","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Tokenizadas · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"8,38 CHF","fuente":"https://shares.wemakeit.com/","alcance":"El portal lo etiqueta Issuer Defined. Esta consulta no cargó el historial que permitiría comprobar el supuesto último cruce de 0,85 CHF del artefacto.","etiqueta":"Valor definido por el emisor","fechaDato":null,"fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Aktionariat · WMKT","etiqueta":"Proveedor"},{"valor":"CHF","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"Valor fijado por el emisor y último cruce del mercado secundario deben mostrarse por separado.","etiqueta":"Distinción de precios"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"casa-de-outeiro","tipo":"valor","titulo":"Casa de Outeiro","plataformaSlug":"alius-capital","plataformaNombre":"Alius Capital","categoria":"Acciones y capital privado","pais":"ES","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://aliuscap.com/invest/","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://aliuscap.com/invest/","https://casadeouteiro.com/emision-capital/","https://aliuscap.com/projects/casa-de-outeiro"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://aliuscap.com/invest/","https://casadeouteiro.com/emision-capital/","https://aliuscap.com/projects/casa-de-outeiro"],"revisadaEl":"2026-09-30","descripcion":"Referencia de emisión de capital de Casa de Outeiro presentada a través de Alius Capital. Es una ficha de capital empresarial; el mínimo total anunciado no equivale al precio de una acción.","referencias":[{"valor":"Desde 2.000 EUR","fuente":"https://casadeouteiro.com/emision-capital/","alcance":"Mínimo total anunciado en la página del emisor, que muestra actualización del 17/09/2026. No confirma el antiguo precio unitario de 25 EUR, número de acciones ni disponibilidad actual.","etiqueta":"Entrada total anunciada","fechaDato":"2026-09-17","fechaConsulta":"2026-09-27"},{"valor":"25,00 € · por token · 1 token = 1 acción","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Precio documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2.000,00 €","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Inversión mínima · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1.091.000 € / 3,22 M€ · 33,9 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Financiado · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"43.640 de 128.800","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Tokens vendidos · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"4,26 M€","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Valoración pre-money · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"33","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Días restantes · artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Alius Capital","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"El artefacto diferencia 25 EUR por token de una inversión mínima de 2.000 EUR; la captación y el plazo necesitan revisión actual.","etiqueta":"Entrada mínima"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"en_camino","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"iod-occasio","tipo":"rendimiento","titulo":"IOD Occasio","plataformaSlug":"alius-capital","plataformaNombre":"Alius Capital","categoria":"Crédito privado","pais":"ES","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://aliuscap.com/projects/iodo1","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"neutro","texto":"Esta referencia está en seguimiento y no representa una oferta abierta.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://aliuscap.com/projects/iodo1"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://aliuscap.com/projects/iodo1"],"revisadaEl":"2026-09-30","descripcion":"Proyecto IOD Occasio presentado en el artefacto como una futura emisión de deuda. Su estado allí es «En estudio»; no se ha comprobado apertura de captación.","referencias":[{"valor":"En estudio","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Estado recogido en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"El artefacto describe un bono con cupón anunciado del 12 %, plazo de doce meses, objetivo de 120.000 EUR y seguro de caución de hasta el 90 %. Estas condiciones y su apertura requieren comprobación primaria.","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Resumen descriptivo del artefacto del 28/09/2026. Sus porcentajes, volúmenes y plazos no están aprobados como condiciones actuales. No es una invitación a contratar.","etiqueta":"Descripción aportada","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"En seguimiento; sin apertura comprobada","etiqueta":"Estado"},{"valor":"EUR","etiqueta":"Moneda indicada"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"apartamento-vacacional-hinterstoder-50","tipo":"rendimiento","titulo":"Apartamento vacacional · Hinterstoder 50","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A31KP7","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A31KP7","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A31KP7","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Apartamento vacacional Hinterstoder 50, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"75 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"4,65 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"4,65 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 75,00 € 3 cruces en 30 días Pagas un 36,4 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"drautalresidenz-paternion","tipo":"rendimiento","titulo":"Drautalresidenz · Paternion","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2YPQ0","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2YPQ0","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2YPQ0","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Referencia inmobiliaria Drautalresidenz en Paternion, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"55 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"5,96 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"5,03 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 65,00 € 1 cruce en 30 días Pagas un 18,2 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"fotovoltaica-cohotel","tipo":"rendimiento","titulo":"Fotovoltaica Cohotel","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A38J40","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A38J40","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A38J40","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Instalación fotovoltaica Cohotel, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"110 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"5,57 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"4,89 % · anuncia 5,57 % · recalculado con la amortización","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 110,00 € 1 cruce en 30 días Pagas un 8,3 % POR DEBAJO del último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"fotovoltaica-greenpoint","tipo":"rendimiento","titulo":"Fotovoltaica GreenPoint","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A38J32","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A38J32","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A38J32","https://app.brickwise.at/desktopWeb/marketplace","https://app.brickwise.at/desktopWeb/asset/AT0000A38J32/details"],"revisadaEl":"2026-09-30","descripcion":"Instalación fotovoltaica GreenPoint, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"100 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"6,11 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"6,14 % · anuncia 6,11 % · recalculado con la amortización","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 100,00 € 4 cruces en 30 días Pagas un 11,1 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"local-de-estanco-klagenfurt","tipo":"rendimiento","titulo":"Local de estanco · Klagenfurt","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2U5V3","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2U5V3","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2U5V3","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Local de estanco de Kohldorfer Straße 102, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"95 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,46 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,46 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 95,00 € Nota del tasador 5/5 40 días sin cruce Pagas un 4,1 % POR DEBAJO del último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"randhartingergasse-9-viena","tipo":"rendimiento","titulo":"Randhartingergasse 9, Viena","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2ZT84","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2ZT84","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2ZT84","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Inmueble de Randhartingergasse 9, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"60 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,09 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"2,47 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 75,00 € 3 cruces en 30 días Pagas un 25,0 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"terreno-con-arrendamiento-billa","tipo":"rendimiento","titulo":"Terreno con arrendamiento BILLA","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A3SE89","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A3SE89","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A3SE89","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Terreno presentado con arrendamiento a BILLA, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"1.000 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Importe mínimo total anunciado en la tarjeta individual, no precio por participación. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Inversión mínima anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"5,07 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"5,07 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Emisión primaria Reparto mensual, día 15 Desde 100,00 € Inquilino hasta 2057 Colocado al 1 %: 62 de 6.404 participaciones","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"},{"valor":"Precio por participación y suscripción mínima son distintos. La documentación primaria anterior recoge 1.000 EUR; el artefacto menciona 100 EUR por participación.","etiqueta":"Entrada mínima"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"vivienda-pluddemanngasse-101-graz","tipo":"rendimiento","titulo":"Vivienda · Plüddemanngasse 101, Graz","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2RAH5","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2RAH5","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2RAH5","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Vivienda de Plüddemanngasse 101, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"84 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,58 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,58 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 84,00 € Nota del tasador 5/5 2 cruces en 30 días Pagas un 10,5 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"vivienda-pottendorfer-stra-e-62-wr-neustadt","tipo":"rendimiento","titulo":"Vivienda · Pottendorfer Straße 62, Wr. Neustadt","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A324B4","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A324B4","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A324B4","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Vivienda de Pottendorfer Straße 62, TOP 2.06, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"80 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,80 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,79 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 80,00 € 1 cruce en 30 días Pagas un 25,0 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"vivienda-schwarzer-weg-18-graz","tipo":"rendimiento","titulo":"Vivienda · Schwarzer Weg 18, Graz","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2WCE8","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2WCE8","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2WCE8","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Vivienda de Schwarzer Weg 18, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"70 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,46 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,46 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo · mercado activo Reparto mensual, día 15 Desde 70,00 € 5 cruces en 30 días Pagas justo el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"vivienda-sonnleithnergasse-2-viena","tipo":"rendimiento","titulo":"Vivienda · Sonnleithnergasse 2, Viena","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2T4D7","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2T4D7","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2T4D7","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Vivienda de Sonnleithnergasse 2, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"75 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,42 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"3,42 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 75,00 € 1 cruce en 30 días Pagas un 25,0 % sobre el último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"principales","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"vivienda-stallhofstra-e-28-gratwein","tipo":"rendimiento","titulo":"Vivienda · Stallhofstraße 28, Gratwein","plataformaSlug":"brickwise","plataformaNombre":"Brickwise","categoria":"Inmobiliario","pais":"AT","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://app.brickwise.at/mobileWeb/asset/AT0000A2WCD0","verificadaEl":"2026-09-27","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-27"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2WCD0","https://www.brickwise.at/marketplace"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://app.brickwise.at/mobileWeb/asset/AT0000A2WCD0","https://app.brickwise.at/desktopWeb/marketplace"],"revisadaEl":"2026-09-30","descripcion":"Vivienda de Stallhofstraße 28, identificado en una tarjeta individual de la aplicación pública de Brickwise durante la consulta del 27/09/2026. La ficha documental conserva lo anunciado entonces sin afirmar que hoy haya participaciones disponibles.","referencias":[{"valor":"65 EUR","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual.","etiqueta":"Precio desde anunciado","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"4,42 %","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni revalidada a la fecha actual.","etiqueta":"Distribución anual prevista anunciada","fechaDato":null,"fechaConsulta":"2026-09-27"},{"valor":"4,42 % · «reparto corriente esperado»","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Rendimiento documentado en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Perpetuo Reparto mensual, día 15 Desde 65,00 € 2 cruces en 30 días Pagas un 9,4 % POR DEBAJO del último cruce","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Condiciones documentadas en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Brickwise","etiqueta":"Proveedor"},{"valor":"EUR","etiqueta":"Moneda del documento"},{"valor":"28/09/2026","etiqueta":"Corte del artefacto"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"en_camino","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"hausera-proximas-ofertas","tipo":"rendimiento","titulo":"Hausera · próximas ofertas","plataformaSlug":"hausera","plataformaNombre":"Hausera","categoria":"Inmobiliario","pais":"ES","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://www.hausera.com/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"neutro","texto":"Esta referencia está en seguimiento y no representa una oferta abierta.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.hausera.com/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.hausera.com/"],"revisadaEl":"2026-09-30","descripcion":"Seguimiento de nuevas ofertas de Hausera. El artefacto declara que no había emisiones abiertas en su corte del 28/09/2026; no se extrapola esa observación al día actual.","referencias":[{"valor":"Nada abierto","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Estado recogido en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Al corte declarado del 28/09, el artefacto recoge doce referencias financiadas, cinco en explotación y veintitrés cerradas, con 118,7 millones EUR colocados. Son observaciones secundarias, no una revisión de apertura actual.","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Resumen descriptivo del artefacto del 28/09/2026. Sus porcentajes, volúmenes y plazos no están aprobados como condiciones actuales. No es una invitación a contratar.","etiqueta":"Descripción aportada","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"En seguimiento; sin apertura comprobada","etiqueta":"Estado"},{"valor":"EUR","etiqueta":"Moneda indicada"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"en_camino","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"mgloeuro","tipo":"rendimiento","titulo":"mGLOeuro","plataformaSlug":"midas","plataformaNombre":"Midas","categoria":"Crédito privado","pais":"UE","resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://midas.app/mgloeuro","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":true,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"neutro","texto":"Esta referencia está en seguimiento y no representa una oferta abierta.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mgloeuro"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://midas.app/mgloeuro"],"revisadaEl":"2026-09-30","descripcion":"Producto de Midas denominado en euros mencionado en el artefacto. Su rendimiento y las condiciones actuales quedan pendientes de comprobación.","referencias":[{"valor":"Sin cifra","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Estado recogido en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"El artefacto recoge 5,8 millones EUR y rendimiento del 0 % a siete y treinta días. No se usan como magnitudes actuales verificadas.","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Resumen descriptivo del artefacto del 28/09/2026. Sus porcentajes, volúmenes y plazos no están aprobados como condiciones actuales. No es una invitación a contratar.","etiqueta":"Descripción aportada","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"En seguimiento; sin apertura comprobada","etiqueta":"Estado"},{"valor":"EUR","etiqueta":"Moneda indicada"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-abu-dhabi-1","tipo":"rendimiento","titulo":"Abu Dhabi 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787855475218-87f4dc55-7908-40fe-af98-5b0df656d676-abu-dhabi-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787855475218-87f4dc55-7908-40fe-af98-5b0df656d676-abu-dhabi-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Abu Dhabi 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"11,43 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $ hace 25 d al mismo precio","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"11,93 tok 1.253 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-atlanta-1","tipo":"rendimiento","titulo":"Atlanta 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787859836487-31a111a4-88e6-4942-a299-02d96d0c6a3c-atlanta-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787859836487-31a111a4-88e6-4942-a299-02d96d0c6a3c-atlanta-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Atlanta 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"12,65 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,02 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"95,00–100,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"90,00 $ hace 3 d +5,6 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"25,50 tok 2.525 $ · 5 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-carolina-del-norte-1","tipo":"rendimiento","titulo":"Carolina del Norte 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787852371029-7af3abf7-654e-4603-8f13-7febae6d1ebc-carolina-del-norte-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787852371029-7af3abf7-654e-4603-8f13-7febae6d1ebc-carolina-del-norte-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Carolina del Norte 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"11,43 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"sin cruce reciente","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2,48 tok 261 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Al vencimiento","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-dania-beach-1","tipo":"rendimiento","titulo":"Dania Beach 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787857589693-447dad95-1362-49ac-b603-effd274a5eed-dania-beach-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787857589693-447dad95-1362-49ac-b603-effd274a5eed-dania-beach-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Dania Beach 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,38 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"11,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"106,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $ ayer +1,0 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"5,00 tok 530 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Trimestral + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"en_camino","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-emision-primaria","tipo":"rendimiento","titulo":"Emisión primaria de Reental","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://www.reental.co/properties","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"neutro","texto":"Esta referencia está en seguimiento y no representa una oferta abierta.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties"],"revisadaEl":"2026-09-30","descripcion":"Seguimiento de futuras emisiones primarias de Reental. El catálogo público de inmuebles no permite confirmar por sí solo cuáles admiten nuevas inversiones.","referencias":[{"valor":"Sin verificar","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Dato recogido en el artefacto aportado, con corte declarado del 28/09/2026. Es evidencia secundaria fechada; no confirma condiciones actuales, disponibilidad ni ejecución.","etiqueta":"Estado recogido en artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"El artefacto indica que la apertura de nuevas emisiones primarias no se ha comprobado en acceso público. El estado de construcción de un inmueble no acredita su disponibilidad para invertir.","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Resumen descriptivo del artefacto del 28/09/2026. Sus porcentajes, volúmenes y plazos no están aprobados como condiciones actuales. No es una invitación a contratar.","etiqueta":"Descripción aportada","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"En seguimiento; sin apertura comprobada","etiqueta":"Estado"},{"valor":"Sin confirmar","etiqueta":"Moneda indicada"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-granada-3","tipo":"rendimiento","titulo":"Granada 3","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787858322699-6ae8ab8c-bd98-4cb8-934b-426d08565080-granada-3","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787858322699-6ae8ab8c-bd98-4cb8-934b-426d08565080-granada-3","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Granada 3 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"11,48 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"13,32 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"116,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"117,00 $ hace 17 d -0,9 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"0,25 tok 29 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-houston-1","tipo":"rendimiento","titulo":"Houston 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787860996401-df29d003-1e5d-4b61-b4e4-ecd4fe23c3a6-houston-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787860996401-df29d003-1e5d-4b61-b4e4-ecd4fe23c3a6-houston-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Houston 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"14,26 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"14,26 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"100,00–101,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"100,00 $ hace 8 d al mismo precio","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"17,33 tok 1.739 $ · 3 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-houston-2","tipo":"rendimiento","titulo":"Houston 2","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787860261558-32021c80-5bc7-437f-a3ab-46491aa68f1c-houston-2","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787860261558-32021c80-5bc7-437f-a3ab-46491aa68f1c-houston-2","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Houston 2 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"14,43 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"14,43 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"100,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"101,00 $ hace 10 d -1,0 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,01 tok 1.001 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-houston-3","tipo":"rendimiento","titulo":"Houston 3","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787859843516-25fd8701-69a9-4e39-ab20-28b8414b7228-houston-3","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787859843516-25fd8701-69a9-4e39-ab20-28b8414b7228-houston-3","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Houston 3 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"12,55 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,42 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"99,00–100,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"98,50 $ hace 27 d +0,5 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,00 tok 995 $ · 2 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-levante-1","tipo":"rendimiento","titulo":"Levante 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787857107976-e599d341-daf3-4b04-8dde-652fd27586ca-levante-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787857107976-e599d341-daf3-4b04-8dde-652fd27586ca-levante-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Levante 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"9,35 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"11,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"117,60 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"117,60 $ hace 11 d al mismo precio","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"2,00 tok 235 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-malaga-6","tipo":"rendimiento","titulo":"Málaga 6","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787863663698-79ac0eff-2c25-46d8-877f-61b289829810-malaga-6","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787863663698-79ac0eff-2c25-46d8-877f-61b289829810-malaga-6","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Málaga 6 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"8,37 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,04 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"120,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"sin cruce reciente","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"4,49 tok 539 $ · 2 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-miami-1","tipo":"rendimiento","titulo":"Miami 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787866211976-3b2d048e-a885-4915-a0bd-d228f55669f8-miami-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787866211976-3b2d048e-a885-4915-a0bd-d228f55669f8-miami-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Miami 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"14,88 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"14,88 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"100,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"101,00 $ hace 10 d -1,0 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,00 tok 1.000 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-miami-2","tipo":"rendimiento","titulo":"Miami 2","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787864202186-cdd25624-974b-4da4-88fc-d0a8945cc0de-miami-2","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787864202186-cdd25624-974b-4da4-88fc-d0a8945cc0de-miami-2","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Miami 2 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,49 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"15,22 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"145,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"sin cruce reciente","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,57 tok 952 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-miami-3","tipo":"rendimiento","titulo":"Miami 3","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787863904813-d4526acf-f44b-47ea-84be-13360b89fdf0-miami-3","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787863904813-d4526acf-f44b-47ea-84be-13360b89fdf0-miami-3","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Miami 3 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"11,57 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"15,03 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"129,95 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"101,00 $ hace 2 d +28,7 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"5,54 tok 721 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-miami-5","tipo":"rendimiento","titulo":"Miami 5","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787852371041-91af96a4-088a-43b0-8f1b-870fb1990f70-miami-5","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787852371041-91af96a4-088a-43b0-8f1b-870fb1990f70-miami-5","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Miami 5 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,48 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"11,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"sin cruce reciente","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1,85 tok 194 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Al vencimiento","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-opportunity-2","tipo":"rendimiento","titulo":"Opportunity 2","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1788186156723-effc8261-b6e5-4bcb-bc9b-0cc8a3669786-opportunity-2","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1788186156723-effc8261-b6e5-4bcb-bc9b-0cc8a3669786-opportunity-2","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Opportunity 2 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"8,70 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"10,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"115,00–118,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"118,00 $ hace 7 d -2,5 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"4,41 tok 516 $ · 3 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-pirineos-1","tipo":"rendimiento","titulo":"Pirineos 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1789120829529-71ae2a4b-91f7-4ed1-a85b-664b758dfa20-pir-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1789120829529-71ae2a4b-91f7-4ed1-a85b-664b758dfa20-pir-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Pirineos 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"9,41 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"11,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"116,95 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"116,00 $ hace 2 d +0,8 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,00 tok 702 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Al vencimiento","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-proyecto-100","tipo":"rendimiento","titulo":"Proyecto 100","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787856383323-4dd13b10-c2ac-434e-86d7-c4f8c87c10ee-proyecto-100","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787856383323-4dd13b10-c2ac-434e-86d7-c4f8c87c10ee-proyecto-100","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Proyecto 100 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"12,25 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,50 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"102,00–105,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $ hace 2 d -2,9 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"50,00 tok 5.130 $ · 3 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-rentas-1","tipo":"rendimiento","titulo":"Rentas 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787856322980-e1042bfc-0830-4e36-9a5a-bd37b59ddeca-rentas-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787856322980-e1042bfc-0830-4e36-9a5a-bd37b59ddeca-rentas-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Rentas 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,43 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"115,00–116,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"114,74 $ hace 10 d +0,2 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"50,75 tok 5.837 $ · 2 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-rentas-2","tipo":"rendimiento","titulo":"Rentas 2","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787855172059-168248bf-3f35-4ba9-8021-f9a95c23583a-rentas-2","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787855172059-168248bf-3f35-4ba9-8021-f9a95c23583a-rentas-2","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Rentas 2 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"120,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"116,11 $ hace 14 d +3,4 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1,00 tok 120 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-rentas-3","tipo":"rendimiento","titulo":"Rentas 3","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1788424803785-5ee312c8-8c80-40ec-84c9-eff7c31dfb73-rentas-3","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1788424803785-5ee312c8-8c80-40ec-84c9-eff7c31dfb73-rentas-3","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble Rentas 3 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"10,71 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"12,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"112,00–114,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"101,00 $ hace 3 d +10,9 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"6,48 tok 728 $ · 2 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Mensual","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
 {"version_esquema":2,"plataformas_esperadas":26,"ofertas_esperadas":49,"colecciones_esperadas":{"en_camino":4,"secundario":21,"principales":24},"verificado_lote_el":"2026-09-28","vigencia_lote_dias":7,"coleccion":"secundario","catalogo":true,"revisionId":"956c00ce-849b-fce8-9f9b-9e89b340168b","slug":"reental-secundario-san-antonio-1","tipo":"rendimiento","titulo":"San Antonio 1","plataformaSlug":"reental","plataformaNombre":"Reental","categoria":"Inmobiliario","pais":null,"resumen":"Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.","url":"https://p2p.rnt.finance/","verificadaEl":"2026-09-28","vigenciaDias":1,"permanente":false,"disponibleEs":null,"eu":null,"fueraLadrillo":false,"puntuacion":null,"rentabilidad":null,"precio":null,"metricas":[{"valor":"Cifras pendientes de nueva revisión","etiqueta":"Revisión"}],"avisos":[{"tono":"warn","texto":"Consulta las condiciones y riesgos del proveedor; el acceso depende de sus requisitos.","esAntiguedad":false,"verificadaEl":"2026-09-28"},{"tono":"warn","texto":"Una orden de venta y el último cruce no garantizan ejecución ni liquidez. El rendimiento ajustado del artefacto no incluye necesariamente el retorno de capital.","esAntiguedad":false,"verificadaEl":"2026-09-28"}],"estadoRevision":"no_verificable","fuentesActuales":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787853287296-05055284-03bb-44ac-8ecb-c7969c05fcda-san-antonio-1","https://p2p.rnt.finance/"],"documentacion":{"fuentes":["https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","https://www.reental.co/properties/1787853287296-05055284-03bb-44ac-8ecb-c7969c05fcda-san-antonio-1","https://p2p.rnt.finance/"],"revisadaEl":"2026-09-30","descripcion":"Referencia de reventa de tokens del inmueble San Antonio 1 recogida en el artefacto del 28/09/2026. El precio pedido corresponde a una orden del vendedor y puede cambiar.","referencias":[{"valor":"13,33 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento ajustado por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"14,00 %","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Rendimiento anunciado recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Precio pedido recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"105,00 $ hace 6 d al mismo precio","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Último cruce recogido por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"1,00 tok 105 $ · 1 ord","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Volumen y órdenes recogidos por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"},{"valor":"Trimestral + final","fuente":"https://claude.ai/code/artifact/09900c9d-b92d-4da9-b2df-09815751ab1f#no_universal_links","alcance":"Foto secundaria con corte declarado del 28/09/2026. No se ha revalidado el libro de órdenes. Las antigüedades relativas que aparecen en el texto pertenecen a esa foto; no se recalculan como si fueran actuales.","etiqueta":"Reparto descrito por el artefacto","fechaDato":"2026-09-28","fechaConsulta":"2026-09-30"}],"caracteristicas":[{"valor":"Reental","etiqueta":"Proveedor"},{"valor":"Secundario entre inversores","etiqueta":"Mercado"},{"valor":"USD","etiqueta":"Moneda del documento"},{"valor":"El enlace de la ficha describe el inmueble; el mercado P2P requiere buscar su nombre.","etiqueta":"Acceso al mercado"}]},"patrocinada":false},
];

/* ---- categorías: seis colores que se distinguen sobre negro ----
   Sobre papel bastaba una rampa de azules; sobre un fondo de noche los
   tonos oscuros desaparecen. Estos seis están elegidos por separación de
   matiz y todos tienen luz suficiente para leerse a 8 px de diámetro. */
const CATMETA={
 "Inmobiliario":{c:"#F2B23C",ic:'<path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'},
 "Crédito privado":{c:"#5B8CFF",ic:'<path d="M3 7h18v11H3z"/><circle cx="12" cy="12.5" r="2.6"/>'},
 "Tesoro y fondos":{c:"#32C9F5",ic:'<path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 9l9-5 9 5z"/>'},
 "Acciones y capital privado":{c:"#B583FF",ic:'<path d="M4 18l5-5 3.5 3.5L20 8"/><path d="M15 8h5v5"/>'},
 "Materias primas":{c:"#FF8A5B",ic:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'},
 "Infraestructura":{c:"#9AA6BF",ic:'<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><circle cx="12" cy="6" r="2.4"/><path d="M12 8.4v3.2M10.3 13.2L7.4 16M13.7 13.2L16.6 16"/>'},
};
const ACCESOS=["Minorista","Acreditado","Institucional","Empresas"];
const TICKETS=["Bajo","Medio","Alto","No aplica"];

/* ---- logotipo inline (CSS puede animarlo; <use> no) ----
   El cubo isométrico del centro se ha ido: ahora es un hexágono, la misma
   forma que las piezas del explicador. Marca y dibujo dicen lo mismo. */
const MARK=`
<g class="aro" fill="none" stroke="currentColor" stroke-width="1.6">
 <circle cx="52" cy="52" r="46"/><circle cx="52" cy="52" r="35"/><circle cx="52" cy="52" r="24"/></g>
<g class="cruz" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
 <path d="M52 4v14M52 86v14M4 52h14M86 52h14"/></g>
<path class="barrido" d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill="#25E39A" opacity=".38"/>
<g>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="#25E39A"/>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57"/>
 <path d="M58.5 40.74L65 52L58.5 63.26" fill="none" stroke="#6BF0C0" stroke-width="1.6" stroke-linejoin="round"/></g>
<g fill="#25E39A">
 <circle class="eco" cx="22" cy="30" r="3.1"/>
 <circle class="eco" cx="25" cy="78" r="2.6"/>
 <circle class="eco" cx="82" cy="76" r="2.9"/></g>`;
document.querySelectorAll('svg.mk').forEach(s=>{s.innerHTML=MARK});

const irA=id=>{const el=document.getElementById(id); if(el&&el.scrollIntoView) el.scrollIntoView()};

/* =================================================================
   EL DIBUJO · 127 fichas hexagonales
   -----------------------------------------------------------------
   Antes era una torre de cubos. Una torre explica un edificio, pero no
   explica un token: para eso hace falta que la pieza suelta ya tenga
   forma de ficha. Un panal de hexágonos resuelve las dos cosas a la vez
   — encaja sin dejar un solo hueco, así que pegado se lee como UNA pieza
   maciza, y separado se lee como 127 fichas idénticas.

   Motor propio de WebGL2 con dibujado instanciado: las 127 piezas salen
   en una sola llamada y la interpolación entre estados, el escalonado y
   el arco al cambiar de mano se calculan en la tarjeta gráfica.
   ================================================================= */
const GL_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 aPosA;
layout(location=3) in vec3 aPosB;
layout(location=4) in vec3 aRotA;
layout(location=5) in vec3 aRotB;
layout(location=6) in vec4 aMeta;   /* x retardo · y semilla · z arco · w luz */
uniform mat4 uProj,uView; uniform float uMix,uSize,uArco,uModo,uSuelo;
out vec3 vN,vW,vFwd; out float vSem,vAlt,vLuz;
mat3 rot3(vec3 r){
 float cx=cos(r.x),sx=sin(r.x),cy=cos(r.y),sy=sin(r.y),cz=cos(r.z),sz=sin(r.z);
 return mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.)*mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)*mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);}
void main(){
 float t=clamp((uMix-aMeta.x*0.42)/0.58,0.0,1.0);
 t=t*t*(3.0-2.0*t);
 vec3 P=mix(aPosA,aPosB,t);
 /* el arco: quien cambia de dueño pasa POR ENCIMA del resto. Sin altura
    las piezas se cruzarían atravesándose y no se leería el intercambio */
 P.y+=aMeta.z*uArco*4.0*t*(1.0-t);
 mat3 M=rot3(mix(aRotA,aRotB,t));
 vec3 w=M*(aPos*uSize)+P;
 vec3 n=M*aNrm;

 /* Un mismo programa pinta las tres pasadas. Cambiar de programa por
    pasada obligaría a duplicar la geometría y los atributos de instancia;
    así las 91 piezas se dibujan tres veces con la misma malla. */
 vAlt=P.y-uSuelo;
 if(uModo>1.5){
   /* SOMBRA · la pieza aplastada contra el suelo. Cuanto más alta vuela,
      más se abre y más se deshace: eso es lo que hace que se lea la
      altura. Sin sombra, un objeto flotando no tiene sitio. */
   w.xz=(w.xz-P.xz)*(1.0+max(vAlt,0.0)*0.13)+P.xz;
   w.y=uSuelo+0.03;
 }else if(uModo>0.5){
   /* REFLEJO · la escena espejada bajo el suelo pulido.
      Se espeja la posición pero NO la normal. Volteándola también, las
      caras de abajo quedaban mirando a la luz principal y el reflejo
      salía encendido, con la retícula del panal marcada como un tablero
      de ajedrez. Sin voltearla, el envés se queda en penumbra —que es lo
      que un suelo pulido devuelve de verdad. */
   w.y=2.0*uSuelo-w.y;
 }
 vN=normalize(n); vW=w; vSem=aMeta.y; vLuz=aMeta.w;
 /* Hacia dónde mira este panel. Se necesita en el fragmento para saber
    qué parte es VIDRIO y qué parte es marco: solo la cara frontal plana
    puede estar encendida. Sin esta distinción se ilumina el panel entero,
    cantos incluidos, y en vez de una ventana parece una bombilla. */
 vFwd=normalize(M*vec3(0.0,0.0,1.0));
 gl_Position=uProj*uView*vec4(w,1.0);}`;

const GL_FS=`#version 300 es
precision highp float;
in vec3 vN,vW,vFwd; in float vSem,vAlt,vLuz;
uniform vec3 uCam,uColA,uNiebla;
uniform float uIndiv,uCerca,uLejos,uModo,uRadioSuelo,uSuelo;
out vec4 o;

/* El color es el dueño.
   Mientras el activo está entero todas las piezas comparten un oro único,
   porque hay un único propietario. Al repartirse, cada participación toma
   el suyo. Ese cambio de color explica la propiedad fraccionada mejor que
   cualquier rótulo. Cuatro tonos y ninguno se parece a otro: tres fríos y
   uno cálido, que es el que impide que se lea "todo igual con matices".

   Bajados de tono respecto a la primera versión: en pastel el conjunto
   parecía un juego de mesa. Un color de propiedad tiene que pesar. */
vec3 duenno(float s){
 vec3 a=vec3(0.106,0.706,0.478);   /* verde  #1BB47A */
 vec3 b=vec3(0.216,0.494,0.925);   /* azul   #377EEC */
 vec3 c=vec3(0.576,0.353,0.918);   /* violeta#935AEA */
 vec3 d=vec3(0.902,0.647,0.243);   /* ámbar  #E6A53E */
 float k=floor(s*4.0);
 if(k<1.0) return a;
 if(k<2.0) return b;
 if(k<3.0) return c;
 return d;}

/* El cielo que se refleja en el metal. No hay mapa de entorno —cargarlo
   serían kilobytes y una petición más—, así que se sintetiza: claro
   arriba, oscuro abajo y una banda caliente en el horizonte, que es lo
   que de verdad hace que una superficie curva parezca metal. */
vec3 cielo(vec3 d){
 float h=d.y*0.5+0.5;
 vec3 arriba=vec3(0.36,0.38,0.44);
 vec3 medio =vec3(0.44,0.42,0.38);
 vec3 abajo =vec3(0.025,0.025,0.028);
 float horiz=exp(-abs(d.y)*7.0);
 return mix(mix(abajo,arriba,smoothstep(0.35,0.9,h)),medio,horiz*0.8);}

void main(){
 /* SOMBRA · no se ilumina, se dibuja. Negro con la opacidad cayendo
    según la altura a la que vuele la pieza. */
 if(uModo>1.5){
   float r=length(vW.xz);
   if(r>uRadioSuelo) discard;
   float a=0.66*exp(-max(vAlt,0.0)*0.36)*(1.0-smoothstep(uRadioSuelo*0.6,uRadioSuelo,r));
   o=vec4(0.0,0.0,0.0,a);
   return;
 }
 vec3 N=normalize(vN), V=normalize(uCam-vW);
 /* Dos luces, como en un plató: una llave alta que define el volumen y un
    relleno frío por el lado contrario para que la sombra no caiga a negro.
    Con una sola luz todo parece plástico. */
 vec3 Lk=normalize(vec3( 0.38,0.90, 0.44));
 vec3 Lf=normalize(vec3(-0.72,0.18,-0.56));

 vec3 tono=mix(uColA,duenno(vSem),uIndiv);
 /* Cada pieza tiñe un pelo distinto para que el conjunto no parezca
    pintado de plano — pero SOLO cuando ya está repartido. Con el activo
    entero la variación delataría las juntas justo en el paso en el que
    hay que creerse que es una sola cosa. */
 tono*=mix(1.0,0.94+vSem*0.12,uIndiv);

 float dif=max(dot(N,Lk),0.0);
 float rel=max(dot(N,Lf),0.0);
 float esp=pow(max(dot(N,normalize(Lk+V)),0.0),150.0);  /* apretado = metal */
 float esp2=pow(max(dot(N,normalize(Lf+V)),0.0),22.0);  /* ancho = volumen */
 float fres=pow(1.0-max(dot(N,V),0.0),4.5);             /* canto encendido */

 /* Ambiente bajo a propósito. Un ambiente alto ilumina por igual la cara
    que da a la luz y la que no, y entonces el volumen desaparece: la
    torre se ve como una silueta plana recortada. Bajándolo, la cara en
    sombra se hunde y el edificio tiene dos lados. */
 vec3 amb=mix(vec3(0.018,0.019,0.024),vec3(0.082,0.086,0.098),0.5+0.5*N.y);
 /* Ese ambiente azul da atmósfera con el activo entero, pero en cuanto
    cada pieza tiene color propio lo aplana todo en un único azul y se
    pierde justo lo que hay que enseñar. Al repartir se vuelve neutro. */
 amb=mix(amb,vec3(0.062,0.066,0.080),uIndiv*0.86);

 /* Lo que separa el metal del plástico no es el brillo puntual sino el
    ENTORNO reflejado: una superficie metálica devuelve la habitación
    entera, deformada. El oro la devuelve teñida de oro; el color de
    dueño, siendo mate, casi no la devuelve. */
 vec3 refl=cielo(reflect(-V,N));
 float metal=1.0-uIndiv*0.72;
 vec3 brillo=mix(uColA*1.8,vec3(1.0),uIndiv*0.78);

 vec3 col = tono*(amb + dif*1.10 + rel*vec3(0.10,0.14,0.23))
          + refl*mix(vec3(1.0),tono,0.55)*metal*0.62
          + brillo*esp*1.35
          + brillo*esp2*0.08
          + mix(vec3(0.86,0.85,0.82),tono*1.5,uIndiv)*fres*0.44;

 /* ---- LA VENTANA ENCENDIDA ----------------------------------------
    Un tercio de los paneles tiene luz dentro. No es un adorno: es lo que
    convierte un volumen geométrico en un edificio habitado, y por tanto
    en algo que apetece. Y explica el reparto sin una palabra — con el
    activo entero todas las ventanas son del mismo oro; repartido, cada
    ventana brilla del color de su dueño.

    La emisión NO se multiplica por la luz de la escena: por eso se ve
    igual de encendida en la cara en sombra, que es exactamente lo que
    hace que se lea como luz propia y no como reflejo. */
 /* Solo el vidrio se enciende, no el marco: la cara frontal plana es la
    única cuya normal coincide con la dirección del panel. Los biseles y
    los cantos quedan oscuros, y ese contraste entre el hueco encendido y
    su marco en sombra es exactamente lo que se ve en una fachada de
    noche. Encendiendo el panel entero parecía una bombilla. */
 float vidrio=smoothstep(0.86,0.985,dot(N,normalize(vFwd)));
 vec3 luzDentro=mix(vec3(1.00,0.78,0.42),duenno(vSem)*1.35+vec3(0.10),uIndiv);
 col+=luzDentro*vLuz*vidrio*0.62;

 col=mix(col,uNiebla,smoothstep(uCerca,uLejos,length(uCam-vW))*0.5);

 /* REFLEJO · más oscuro, y se apaga con la altura y hacia el borde del
    suelo. Un reflejo a plena luz delata que es un truco; medio apagado,
    convence. */
 if(uModo>0.5){
   float r=length(vW.xz);
   if(r>uRadioSuelo) discard;
   /* La caída se mide en cada PÍXEL, no por pieza: la altura original de
      este fragmento sobre el suelo es la distancia especular. Así el
      reflejo es intenso donde la ficha toca el cristal y se deshace hacia
      arriba, que es como se comporta un reflejo de verdad. Midiéndolo por
      pieza, todas se desvanecían por igual y el reflejo quedaba como una
      calcomanía plana debajo. */
   float alto=max(uSuelo-vW.y,0.0);
   float f=exp(-alto*0.85)*(1.0-smoothstep(uRadioSuelo*0.30,uRadioSuelo*0.8,r));
   o=vec4(col*0.40,f*0.80);
   return;
 }
 o=vec4(col,1.0);}`;

/* El suelo es una pantalla de radar: anillos, radios y un barrido que gira.
   Es el logotipo convertido en escenario, y de paso da suelo a las piezas
   —sin nada debajo, los objetos flotan en un vacío sin escala—. */
/* El suelo, justo debajo de la planta baja: la torre se apoya en él.
   Un reflejo solo convence cuando el objeto lo toca —y entonces, además,
   la sombra pasa a ser sombra de contacto y el conjunto deja de flotar en
   la nada para plantarse sobre un cristal negro. Con una torre de quince
   metros reflejándose entera, además, la escena gana el doble de alto. */
const SUELO_Y=-13.1;
const SU_VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aXZ;
uniform mat4 uProj,uView; uniform float uR,uY;
out vec2 vXZ;
void main(){vXZ=aXZ;gl_Position=uProj*uView*vec4(aXZ.x*uR,uY,aXZ.y*uR,1.0);}`;
const SU_FS=`#version 300 es
precision highp float;
in vec2 vXZ; uniform float uR,uAncho,uBarrido; out vec4 o;
void main(){
 float d=length(vXZ);
 if(d>1.0){o=vec4(0.0);return;}
 float w=d*uR;
 float f=fract(w/4.2);
 float anillo=smoothstep(0.962,1.0,f)+smoothstep(0.038,0.0,f);
 float ang=atan(vXZ.y,vXZ.x);
 float radios=smoothstep(0.9962,1.0,abs(cos(ang*3.0)));
 float da=mod(uBarrido-ang,6.28318);
 float barr=exp(-da*2.7);
 float vinneta=1.0-smoothstep(0.12,1.0,d);
 /* Ya no se falsea la sombra apagando el suelo: ahora hay sombras de
    verdad, una por pieza, proyectadas en su pasada. Lo que queda aquí es
    solo el grafismo del radar, y va con poca opacidad a propósito para
    que el reflejo se vea A TRAVÉS de él. Un suelo opaco taparía el
    reflejo y volveríamos a tener las piezas flotando en el vacío. */
 float a=(anillo*0.30+radios*0.09+barr*0.26+0.022)*vinneta;
 vec3 col=mix(vec3(0.14,0.135,0.125),vec3(0.145,0.890,0.604),clamp(barr*0.85+anillo*0.30,0.0,1.0));
 o=vec4(col,a);}`;

/* La viñeta, en una última pasada a pantalla completa.
   Es el detalle que más barato convierte "un render" en "una foto": el ojo
   da por hecho que hay una lente delante, y una lente siempre oscurece las
   esquinas. Sin esto la imagen tiene el mismo brillo en el centro que en
   el borde, que es algo que no ocurre en ninguna fotografía. */
const VI_VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aXY;
out vec2 vUV;
void main(){vUV=aXY;gl_Position=vec4(aXY,0.0,1.0);}`;
const VI_FS=`#version 300 es
precision highp float;
in vec2 vUV; uniform float uAsp,uFase; out vec4 o;
void main(){
 vec2 p=vec2(vUV.x*max(uAsp,1.0),vUV.y);
 float d=length(p)/length(vec2(max(uAsp,1.0),1.0));
 if(uFase<0.5){
   /* HALO · un resplandor cálido bajo y ancho, pintado ANTES que nada y
      sumado. Recorta la silueta de la torre contra algo en vez de contra
      el vacío, y da la sensación de ciudad de noche al fondo. Es el paso
      más barato de todos y el que más cambia la escena. */
   float h=1.0-smoothstep(-0.9,0.75,vUV.y);         /* concentrado abajo */
   float c=exp(-pow(abs(vUV.x)*1.15,2.0));          /* y hacia el centro */
   /* Neutro y apenas cálido: es la bruma de una ciudad de noche, no un
      foco dorado. Con el halo naranja de antes, todo el 3D volvía a
      teñirse del dorado que se ha quitado de la interfaz. */
   o=vec4(vec3(0.132,0.126,0.118)*h*c,1.0);
   return;
 }
 o=vec4(0.0,0.0,0.0,smoothstep(0.42,1.08,d)*0.66);}`;

function mPersp(f,a,n,fa){const t=1/Math.tan(f/2);
 return new Float32Array([t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0]);}
function mMirar(e,c,u){
 let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(z[0],z[1],z[2])||1;z=z.map(v=>v/l);
 let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(x[0],x[1],x[2])||1;x=x.map(v=>v/l);
 const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
  -(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);}

/* azar reproducible: la misma pieza se comporta igual en cada visita */
const gHash=(i,k)=>{const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v);};

/* =================================================================
   EL EDIFICIO
   -----------------------------------------------------------------
   Antes esto era un panal plano de fichas hexagonales. Se veía bien y
   explicaba mal: una moneda partida en gajos es una metáfora, y encima
   una metáfora que hay que traducir. El texto de al lado habla de un
   local, de un edificio, de inquilinos que pagan un alquiler — y el
   dibujo enseñaba galletas.

   Ahora el activo es lo que dice ser: un rascacielos de casi 900 paneles
   de fachada, de pie sobre el cristal negro. Cada panel es una
   participación. Se lee sin traducir.

   Lo que separa esta versión de la anterior —que parecía un montón de
   piezas de Lego— son cuatro decisiones, y ninguna es un ajuste fino:

   1 · PROPORCIÓN. La torre es esbelta (22 plantas sobre una base de siete
       metros escasos) y los paneles son ALTOS Y ESTRECHOS, 0,62 × 1,0,
       como el despiece de un muro cortina de verdad. Con paneles
       cuadrados sobre una caja rechoncha no hay iluminación que salve el
       resultado: se lee como cubos apilados.
   2 · VENTANAS ENCENDIDAS. Un tercio de los paneles emite luz propia.
       Es lo que convierte un volumen en un edificio habitado, y lo que
       hace que apetezca. Además explica sola la idea: con el activo
       entero todas las ventanas son del mismo oro; repartido, cada
       ventana brilla del color de su dueño.
   3 · ORO QUE PARECE ORO. Reflejo de entorno fuerte y brillo especular
       apretado. El oro mate se lee como ocre, que es plástico.
   4 · ATMÓSFERA. Un halo cálido detrás recorta la silueta y da aire a la
       escena. Sin él, el objeto flota en un vacío sin profundidad.
   ================================================================= */
const PISO=1.0;                   /* altura de planta */
const BAHIA=0.62;                 /* ancho de calle vertical de fachada */
function gEdificio(){
 /* Tres cuerpos con retranqueo: la silueta escalonada es lo que hace que
    una caja se lea como "rascacielos" y no como "caja". Cada cuerpo se
    define por su número de bahías por lado, así el ancho de panel sale
    idéntico en los tres y el despiece no baila al subir. */
 /* El cuarto cuerpo es el remate: dos bahías de lado y cuatro plantas.
    Sin él la torre termina de golpe y se lee como tres cajas apiladas;
    con él tiene corona, que es lo que hace iconico a un rascacielos. */
 const cuerpos=[{nb:11,y0:0,y1:10},{nb:8,y0:10,y1:17},{nb:5,y0:17,y1:21},{nb:3,y0:21,y1:25}];
 const ALTO=25, yOff=-(ALTO*PISO)/2;
 const P=[];
 const semiancho=nb=>nb*BAHIA/2;
 cuerpos.forEach((s,si)=>{
  /* Cada panel va en el PLANO de su fachada, no en el centro de una
     celda: puesto en el centro, las cuatro paredes no casan en las
     esquinas y la torre parece un montón de cajas apiladas. */
  const m=semiancho(s.nb);
  for(let y=s.y0;y<s.y1;y++){
   const yy=y*PISO+yOff;
   for(let k=0;k<s.nb;k++){
    const u=-m+BAHIA*(k+0.5);
    P.push({p:[ m,yy,u], r:[0, Math.PI/2,0]});   /* cara +X */
    P.push({p:[-m,yy,u], r:[0,-Math.PI/2,0]});   /* cara -X */
    P.push({p:[ u,yy, m], r:[0,0,0]});           /* cara +Z */
    P.push({p:[ u,yy,-m], r:[0,Math.PI,0]});     /* cara -Z */
   }
  }
  /* La cornisa del retranqueo. El panel tumbado mide 1,0 en radial y 0,62
     en tangencial, que es justo el anillo entre un cuerpo y el siguiente:
     encaja sin tener que escalar nada por instancia. */
  const sig=cuerpos[si+1];
  const y=s.y1*PISO+yOff-PISO*0.5;
  if(sig){
   const mi=semiancho(sig.nb), rc=(m+mi)/2;
   const n=Math.max(4,Math.round(2*rc/BAHIA));
   for(let k=0;k<n;k++){
    const u=-rc+(2*rc/n)*(k+0.5);
    P.push({p:[ rc,y,u], r:[-Math.PI/2, Math.PI/2,0]});
    P.push({p:[-rc,y,u], r:[-Math.PI/2, Math.PI/2,0]});
    P.push({p:[ u,y, rc], r:[-Math.PI/2,0,0]});
    P.push({p:[ u,y,-rc], r:[-Math.PI/2,0,0]});
   }
  }else{
   /* la azotea, para que no se vea el hueco por arriba */
   const n=Math.max(3,Math.round(2*m/BAHIA));
   for(let i=0;i<n;i++) for(let j=0;j<n;j++)
    P.push({p:[-m+(2*m/n)*(i+0.5), y, -m+(2*m/n)*(j+0.5)], r:[-Math.PI/2,0,0]});
  }
 });
 return P;
}

let colocar=()=>{};        // lo sustituye el motor si arranca
let escenaVisible=false;

(function init3D(){
 const cv=document.getElementById('gl');
 const fall=document.getElementById('glfall');
 const pista=document.getElementById('sceneHint');
 const host=document.getElementById('scene');
 if(!cv||!host) return;
 let gl=null;
 try{ gl=cv.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'}); }catch(e){}
 if(!gl){ cv.hidden=true; if(fall) fall.hidden=false; if(pista) pista.hidden=true; return; }

 function sh(t,src){const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);
  if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
 function prog(v,f){const o=gl.createProgram();gl.attachShader(o,sh(gl.VERTEX_SHADER,v));
  gl.attachShader(o,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(o);
  if(!gl.getProgramParameter(o,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(o));return o;}

 let P1,P2,P3;
 try{ P1=prog(GL_VS,GL_FS); P2=prog(SU_VS,SU_FS); P3=prog(VI_VS,VI_FS); }
 catch(e){ cv.hidden=true; if(fall) fall.hidden=false; if(pista) pista.hidden=true; return; }

 /* --- el panel de fachada ---
    Una caja fina con la cara delantera rehundida y un bisel alrededor,
    como un vidrio dentro de su marco. El bisel es lo que recoge la línea
    de luz en todo el contorno y lo que separa el panel de sus vecinos sin
    necesidad de dibujar una junta. Cada cara lleva su propia normal para
    que la luz las distinga; por eso los vértices van repetidos.
    Mira hacia +Z: la rotación de cada instancia lo orienta a su fachada. */
 const gp=[],gn=[],gi=[];
 (function panel(){
  /* 0,62 × 1,0: alto y estrecho. La proporción del panel es la mitad del
     carácter del edificio — cuadrado da cubo, vertical da rascacielos. */
  const A=BAHIA/2, B=PISO/2, D=0.07, BIS=0.055;
  const AI=A-BIS, BI=B-BIS;
  const V=(x,y,z,n)=>{gp.push(x,y,z);gn.push(n[0],n[1],n[2]);return gp.length/3-1;};
  const quad=(a,b,c,d)=>{gi.push(a,b,c,a,c,d);};
  const N_FR=[0,0,1], N_AT=[0,0,-1];
  /* cara delantera, rehundida */
  quad(V(-AI,-BI,D,N_FR),V(AI,-BI,D,N_FR),V(AI,BI,D,N_FR),V(-AI,BI,D,N_FR));
  /* cara trasera */
  quad(V(AI,-BI,-D,N_AT),V(-AI,-BI,-D,N_AT),V(-AI,BI,-D,N_AT),V(AI,BI,-D,N_AT));
  /* el bisel del contorno: cuatro trapecios entre la cara rehundida y el borde */
  const k=0.62, m=0.78;
  const bis=[
   [[-AI,BI,D],[AI,BI,D],[A,B,0],[-A,B,0],[0,m,k]],        /* arriba */
   [[AI,-BI,D],[-AI,-BI,D],[-A,-B,0],[A,-B,0],[0,-m,k]],   /* abajo */
   [[AI,BI,D],[AI,-BI,D],[A,-B,0],[A,B,0],[m,0,k]],        /* derecha */
   [[-AI,-BI,D],[-AI,BI,D],[-A,B,0],[-A,-B,0],[-m,0,k]],   /* izquierda */
  ];
  bis.forEach(([p1,p2,p3,p4,n])=>{
   const l=Math.hypot(n[0],n[1],n[2]), nn=[n[0]/l,n[1]/l,n[2]/l];
   quad(V(p1[0],p1[1],p1[2],nn),V(p2[0],p2[1],p2[2],nn),
        V(p3[0],p3[1],p3[2],nn),V(p4[0],p4[1],p4[2],nn));
  });
  /* los cantos, del borde a la cara trasera */
  const lados=[
   [[-A,B,0],[A,B,0],[AI,BI,-D],[-AI,BI,-D],[0,1,0]],
   [[A,-B,0],[-A,-B,0],[-AI,-BI,-D],[AI,-BI,-D],[0,-1,0]],
   [[A,B,0],[A,-B,0],[AI,-BI,-D],[AI,BI,-D],[1,0,0]],
   [[-A,-B,0],[-A,B,0],[-AI,BI,-D],[-AI,-BI,-D],[-1,0,0]],
  ];
  lados.forEach(([p1,p2,p3,p4,n])=>{
   quad(V(p1[0],p1[1],p1[2],n),V(p2[0],p2[1],p2[2],n),
        V(p3[0],p3[1],p3[2],n),V(p4[0],p4[1],p4[2],n));
  });
 })();
 const N_IDX=gi.length;

 const celdas=gEdificio(), N=celdas.length;
 const SP=[[],[],[],[]], SR=[[],[],[],[]];

 /* Cuatro estados, y la narración está en las diferencias entre ellos:
    0 · entero    · paneles pegados: la torre se lee como UN edificio
    1 · partido   · todos se separan de la fachada; se ve de qué está hecho
    2 · con dueño · misma forma; lo único que cambia es el COLOR
    3 · circulando· unos cuantos se intercambian, y doce salen a orbitar

    Que 2 y 3 conserven la silueta es deliberado: si el edificio se
    deshiciera al vender una parte, el dibujo diría lo contrario que el
    texto. La torre sigue en pie; lo que se mueve son los dueños. */
 const SEPARA=0.80;                 /* cuánto se despega cada panel */
 for(let i=0;i<N;i++){
  const c=celdas[i], p=c.p, r=c.r;
  SP[0].push(p[0],p[1],p[2]);                 SR[0].push(r[0],r[1],r[2]);
  /* Se separan hacia FUERA de su propia fachada, siguiendo su normal: si
     se separasen radialmente desde el centro, las esquinas se abrirían más
     que el resto y la silueta se deformaría. */
  const dx=Math.sin(r[1])*(r[0]===0?1:0), dz=Math.cos(r[1])*(r[0]===0?1:0);
  const dy=r[0]!==0?1:0;
  /* Todos se separan LO MISMO. Con separaciones distintas (0,55 a 1,45)
     parecía una explosión, y una explosión dice justo lo contrario que el
     texto: si las piezas fueran desiguales no serían participaciones.
     Queda un ±8 % de variación, lo justo para que no parezca un patrón
     estampado. */
  const s=SEPARA*(0.92+gHash(i,7)*0.16);
  SP[1].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[1].push(r[0],r[1],r[2]);
  SP[2].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[2].push(r[0],r[1],r[2]);
  SP[3].push(p[0]+dx*s,p[1]+dy*s,p[2]+dz*s);  SR[3].push(r[0],r[1],r[2]);
 }

 /* Quién cambia de manos. Los que se intercambian van en cadena —cada uno
    al sitio del siguiente— así que ningún hueco queda vacío. Y doce salen
    a orbitar la torre: son las participaciones que están en el mercado
    ahora mismo. Doce de 297 es un 4 %: se ven, y no desmontan nada. */
 const arco=new Float32Array(N);
 const mueven=[], orbitan=[];
 for(let i=0;i<N;i++){
  if(gHash(i,41)<0.045 && orbitan.length<12) orbitan.push(i);
  else if(gHash(i,31)<0.10) mueven.push(i);
 }
 for(let k=0;k<mueven.length;k++){
  const a=mueven[k], b=mueven[(k+1)%mueven.length];
  SP[3][a*3]=SP[2][b*3]; SP[3][a*3+1]=SP[2][b*3+1]; SP[3][a*3+2]=SP[2][b*3+2];
  SR[3][a*3+1]=SR[2][b*3+1]+(gHash(a,32)<0.5?1:-1)*Math.PI*2;
  arco[a]=1.6+gHash(a,33)*2.2;
 }
 orbitan.forEach((a,k)=>{
  const ang=k/orbitan.length*Math.PI*2, rad=8.5+gHash(a,34)*3.0;
  SP[3][a*3]  =Math.sin(ang)*rad;
  SP[3][a*3+1]=-8+gHash(a,35)*18;
  SP[3][a*3+2]=Math.cos(ang)*rad;
  SR[3][a*3]  =(gHash(a,36)-0.5)*1.1;
  SR[3][a*3+1]=ang+Math.PI;                 /* mirando hacia la torre */
  SR[3][a*3+2]=(gHash(a,37)-0.5)*0.9;
  arco[a]=2.2+gHash(a,38)*2.0;
 });

 const ST={P:SP.map(x=>new Float32Array(x)),R:SR.map(x=>new Float32Array(x))};
 const ANCHO=[4.2,5.4,5.4,11.5];
 /* La torre mide 27 unidades con la corona. El campo de visión vertical
    abarca 0,73·d, así que 40 la mete entera dejando ver el suelo y el
    reflejo por debajo. */
 const CAMD=[40,41,41,46];
 /* Nada de 0,075 en el primer paso. A cuatro grados la fachada se ve tan
    rasante que los paneles —que tienen 17 cm de canto— se tapan unos a
    otros y la torre parece un derrumbe. El ángulo bajo era heroico y
    también ilegible. */
 const CAMY=[0.17,0.19,0.21,0.14];
 const INDIV=[0,0.08,1,1];
 /* 0,97: ni se tocan ni se solapan, y las dos cosas importan.
    Solapados (1,15) son 353 losas gruesas metidas unas dentro de otras y
    se ven todas las intersecciones: la fachada queda como un empedrado.
    Tocándose justo (1,0) las caras laterales de dos paneles contiguos
    quedan coplanarias y pelean por la profundidad — el clásico
    z-fighting—, que es lo que llenaba la fachada de manchas claras y
    oscuras al azar. Con 0,97 queda una junta limpia de tres centésimas
    entre paneles: exactamente el despiece de un muro cortina. */
 const TAM=[0.97,0.86,0.86,0.86];

 const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
 const mk=(loc,data,size,inst)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,data,inst?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  if(inst)gl.vertexAttribDivisor(loc,1);return b;};
 mk(0,new Float32Array(gp),3,0); mk(1,new Float32Array(gn),3,0);
 const bA=mk(2,ST.P[0],3,1),bB=mk(3,ST.P[0],3,1),rA=mk(4,ST.R[0],3,1),rB=mk(5,ST.R[0],3,1);
 /* El retardo va por ALTURA: la torre se despliega de abajo arriba, como
    se construye y como se mira. Todas a la vez sería un pestañeo.

    Ojo con este cálculo: `celdas` pasó de ser pares [x,z] a ser objetos
    {p,r} al cambiar el panal por el edificio, y mientras siguió leyendo
    `celdas[i][0]` metía NaN en el atributo. Un NaN aquí no rompe nada de
    forma visible — simplemente cada panel interpola por su cuenta y la
    fachada aparece desalineada al azar, que es de los fallos más difíciles
    de encontrar mirando. */
 let minY=Infinity, maxY=-Infinity;
 for(let i=0;i<N;i++){const y=celdas[i].p[1]; if(y<minY)minY=y; if(y>maxY)maxY=y;}
 const rangoY=Math.max(0.0001,maxY-minY);
 const meta=new Float32Array(N*4);
 for(let i=0;i<N;i++){
  meta[i*4]  =(celdas[i].p[1]-minY)/rangoY*0.78+gHash(i,11)*0.22;
  meta[i*4+1]=gHash(i,12);
  meta[i*4+2]=arco[i];
  /* Qué ventanas están encendidas. No es azar puro: se cruzan dos hashes,
     uno por planta y otro por panel, así que la luz sale a manchas —unas
     plantas más despiertas que otras— en vez de en un salpicado uniforme.
     Un edificio de noche nunca tiene las luces repartidas por igual, y esa
     irregularidad es justo lo que hace que parezca habitado.
     Las cornisas y la azotea nunca se encienden: no son ventanas. */
  const esVentana=celdas[i].r[0]===0;
  const planta=Math.round((celdas[i].p[1]-minY)/PISO);
  meta[i*4+3]= esVentana && (gHash(planta,61)*0.55+gHash(i,62)*0.45)<0.26 ? 1 : 0;
 }
 mk(6,meta,4,1);
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(gi),gl.STATIC_DRAW);
 gl.bindVertexArray(null);

 const svao=gl.createVertexArray(); gl.bindVertexArray(svao);
 const sb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,sb);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 gl.bindVertexArray(null);

 const U=(p,n)=>gl.getUniformLocation(p,n);
 const u1={proj:U(P1,'uProj'),view:U(P1,'uView'),mix:U(P1,'uMix'),size:U(P1,'uSize'),arco:U(P1,'uArco'),
  cam:U(P1,'uCam'),cA:U(P1,'uColA'),ind:U(P1,'uIndiv'),cerca:U(P1,'uCerca'),lejos:U(P1,'uLejos'),
  nieb:U(P1,'uNiebla'),modo:U(P1,'uModo'),suelo:U(P1,'uSuelo'),rsuelo:U(P1,'uRadioSuelo')};
 const u2={proj:U(P2,'uProj'),view:U(P2,'uView'),r:U(P2,'uR'),ancho:U(P2,'uAncho'),
  barr:U(P2,'uBarrido'),y:U(P2,'uY')};
 const u3={asp:U(P3,'uAsp'),fase:U(P3,'uFase')};
 const R_SUELO=30;

 let mixT=1, de=0, a=0;
 const lerpArr=(x,y,t)=>{const o=new Float32Array(x.length);
  for(let i=0;i<x.length;i++)o[i]=x[i]+(y[i]-x[i])*t; return o;};
 colocar=function(idx){
  if(idx===a && mixT>=1) return;
  const cp=mixT>=1?ST.P[a]:lerpArr(ST.P[de],ST.P[a],mixT);
  const cr=mixT>=1?ST.R[a]:lerpArr(ST.R[de],ST.R[a],mixT);
  gl.bindBuffer(gl.ARRAY_BUFFER,bA);gl.bufferSubData(gl.ARRAY_BUFFER,0,cp);
  gl.bindBuffer(gl.ARRAY_BUFFER,rA);gl.bufferSubData(gl.ARRAY_BUFFER,0,cr);
  gl.bindBuffer(gl.ARRAY_BUFFER,bB);gl.bufferSubData(gl.ARRAY_BUFFER,0,ST.P[idx]);
  gl.bindBuffer(gl.ARRAY_BUFFER,rB);gl.bufferSubData(gl.ARRAY_BUFFER,0,ST.R[idx]);
  de=a; a=idx; mixT=0;
 };

 /* el puntero orbita la cámara; en táctil se deja para desplazarse */
 let mx=0,my=0;
 const lento=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 host.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  const r=host.getBoundingClientRect();
  mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5;});
 host.addEventListener('pointerleave',()=>{mx=0;my=0;});

 /* sólo se dibuja si la escena está en pantalla: no gasta batería de fondo */
 escenaVisible=true;
 if('IntersectionObserver' in window)
  new IntersectionObserver(e=>{escenaVisible=e[0].isIntersecting;},{threshold:.01}).observe(host);

 let ultimo=performance.now(), giro=0, barrido=0;
 function pintar(ahora){
  requestAnimationFrame(pintar);
  /* El delta se acota por arriba y por abajo. Sin el suelo en 0, un salto
     del reloj hacia atrás deja dt negativo, la interpolación retrocede y
     el explicador se congela sin recuperarse jamás. */
  const dt=Math.max(0,Math.min((ahora-ultimo)/1000,.05)); ultimo=ahora;
  if(!escenaVisible) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(cv.clientWidth*dpr), h=Math.round(cv.clientHeight*dpr);
  if(w<2||h<2) return;
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  gl.viewport(0,0,w,h);
  if(mixT<1) mixT=Math.min(1,mixT+dt/1.45);
  if(!lento){giro+=dt*0.115; barrido-=dt*0.9;}

  const asp=w/h;
  /* Con una torre manda el ALTO, y el alto que abarca la cámara no
     depende de la proporción del lienzo: solo del campo de visión y de la
     distancia. Por eso aquí no hay que alejarse en pantalla estrecha —al
     revés que con el panal plano de antes, donde el ancho era el límite. */
  const ajuste=1;
  const az=giro+mx*0.95;
  const el=(CAMY[de]+(CAMY[a]-CAMY[de])*mixT)+my*0.28;
  const R=(CAMD[de]+(CAMD[a]-CAMD[de])*mixT)*ajuste;
  /* El punto de mira va por debajo del panal a propósito: así el objeto
     monta por encima del centro del cuadro y el suelo ocupa la parte de
     abajo. Mirando al centro exacto queda medio cuadro de cielo vacío. */
  const cam=[R*Math.cos(el)*Math.sin(az),R*Math.sin(el),R*Math.cos(el)*Math.cos(az)];
  const proj=mPersp(0.70,asp,0.1,140), view=mMirar(cam,[0,-0.6,0],[0,1,0]);

  gl.clearColor(0.033,0.031,0.029,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.CULL_FACE);

  /* 0 · HALO — el resplandor del fondo, antes que nada y sin profundidad */
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE,gl.ONE);
  gl.useProgram(P3); gl.bindVertexArray(svao);
  gl.uniform1f(u3.asp,asp); gl.uniform1f(u3.fase,0);
  gl.drawArrays(gl.TRIANGLES,0,6);

  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  /* --- ajustes comunes de las piezas, para las tres pasadas --- */
  gl.useProgram(P1); gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(u1.proj,false,proj); gl.uniformMatrix4fv(u1.view,false,view);
  gl.uniform1f(u1.mix,mixT);
  gl.uniform1f(u1.size,TAM[de]+(TAM[a]-TAM[de])*mixT);
  gl.uniform1f(u1.arco,(de===3||a===3)?1:0);
  gl.uniform3fv(u1.cam,cam);
  /* Piedra clara, no oro. Una torre de oro macizo pedía una interfaz
     dorada, y ese era justo el problema. En piedra caliza con las
     ventanas encendidas en cálido, el edificio se parece a un edificio
     de verdad de noche — y el salto a los colores de dueño es mucho más
     fuerte saliendo de un neutro que saliendo de un dorado. */
  gl.uniform3f(u1.cA,0.815,0.795,0.745);
  /* El reparto de la propiedad entra algo más tarde que el movimiento:
     primero se ve separarse, y entonces aparecen los dueños. */
  gl.uniform1f(u1.ind,INDIV[de]+(INDIV[a]-INDIV[de])*Math.min(1,Math.max(0,(mixT-.18)/.82)));
  gl.uniform1f(u1.cerca,30); gl.uniform1f(u1.lejos,72);
  gl.uniform3f(u1.nieb,0.033,0.031,0.029);
  gl.uniform1f(u1.suelo,SUELO_Y);
  gl.uniform1f(u1.rsuelo,R_SUELO);

  /* 1 · REFLEJO — la escena espejada bajo el suelo. Va primero porque
     todo lo demás se pinta encima. */
  gl.enable(gl.BLEND); gl.depthMask(true);
  gl.uniform1f(u1.modo,1);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 2 · SUELO — el grafismo del radar, translúcido, por encima del
     reflejo. Sin escribir profundidad: no tiene que tapar nada. */
  gl.depthMask(false);
  gl.useProgram(P2); gl.bindVertexArray(svao);
  gl.uniformMatrix4fv(u2.proj,false,proj); gl.uniformMatrix4fv(u2.view,false,view);
  gl.uniform1f(u2.r,R_SUELO); gl.uniform1f(u2.y,SUELO_Y);
  gl.uniform1f(u2.ancho,ANCHO[de]+(ANCHO[a]-ANCHO[de])*mixT);
  gl.uniform1f(u2.barr,barrido);
  gl.drawArrays(gl.TRIANGLES,0,6);

  /* 3 · SOMBRAS — una por pieza, aplastada contra el suelo */
  gl.useProgram(P1); gl.bindVertexArray(vao);
  gl.uniform1f(u1.modo,2);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 4 · LAS PIEZAS — opacas y escribiendo profundidad */
  gl.disable(gl.BLEND); gl.depthMask(true);
  gl.uniform1f(u1.modo,0);
  gl.drawElementsInstanced(gl.TRIANGLES,N_IDX,gl.UNSIGNED_SHORT,0,N);

  /* 5 · VIÑETA — a pantalla completa, lo último de todo */
  gl.enable(gl.BLEND); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
  gl.useProgram(P3); gl.bindVertexArray(svao);
  gl.uniform1f(u3.asp,asp); gl.uniform1f(u3.fase,1);
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.depthMask(true);
 }
 requestAnimationFrame(pintar);

 cv.addEventListener('webglcontextlost',e=>{e.preventDefault();},false);
 /* Asa de inspección. `pinta` existe porque las capturas de pantalla no
    componen fotogramas: sin poder pedir uno a mano no hay forma de
    comprobar que el dibujo sale, y ya perdimos una tarde persiguiendo un
    fallo inexistente por fiarnos de una captura en negro. */
 window.__gl3d={N,estado:()=>a,mix:()=>mixT,visible:()=>escenaVisible,pinta:t=>pintar(t)};
})();

/* ---- el paso a paso ---- */
const ROTULOS=["1 · Entero","2 · Partido en 3.000","3 · Cada trozo, un dueño","4 · Cambiando de mano"];
const VENTAJAS_POR_PASO=[[],[0],[0,1],[0,1,2,3]];
let paso=0, reloj=null;
const menos=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function irPaso(i,manual){
  paso=i;
  colocar(i);
  const rot=document.getElementById('exRot');
  if(rot) rot.textContent=ROTULOS[i];
  document.querySelectorAll('.paso').forEach((d,k)=>{
   const activa=k===i;d.classList.toggle('on',activa);d.setAttribute('aria-pressed',activa?'true':'false');
  });
  document.querySelectorAll('.ventaja').forEach((b,k)=>b.classList.toggle('on',VENTAJAS_POR_PASO[i].indexOf(k)>-1));
  /* La animación automática permanece silenciosa. El sonido solo responde
     cuando la persona elige un paso de forma deliberada. */
  if(manual&&escenaVisible) Sonido.paso(i);
  if(manual && reloj){ clearInterval(reloj); reloj=null;
    const l=document.getElementById('exSteps'); if(l) l.classList.remove('auto'); }
}
function reiniciarPasosAutomaticos(){
  const l=document.getElementById('exSteps'); if(!l) return;
  if(reloj){clearInterval(reloj);reloj=null;}
  if(menos){l.classList.remove('auto');return;}
  l.classList.add('auto');
  reloj=setInterval(()=>irPaso((paso+1)%4),5000);
}
reiniciarPasosAutomaticos();

/* =================================================================
   LA CALCULADORA DEL EXPLICADOR
   -----------------------------------------------------------------
   El ejemplo es fijo y con números redondos a propósito: un local de
   300.000 € partido en 3.000 trozos de 100 €, alquilado por 1.500 € al
   mes. Son 0,50 € de alquiler por trozo y mes. No hay más magia, y esa
   es justamente la idea: que se pueda seguir la cuenta con los dedos.
   ================================================================= */
(function calculadora(){
 const VALOR=300000, TROZO=100;
 const TOTAL=VALOR/TROZO;                 /* 3.000 trozos */
 const $=id=>document.getElementById(id);
 const bEur=$('calcEuros'), bRent=$('calcRent');
 if(!bEur||!bRent||!$('tRent')) return;

 const num=(n,d)=>n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
 const eur=(n,d)=>num(n,d)+' €';
 const pon=(id,v)=>{const el=$(id); if(el) el.textContent=v;};

 function actualiza(){
  const e=parseInt(bEur.value,10)||2500;
  const r=(parseInt(bRent.value,10)||60)/10;      /* la barra va en décimas */
  const trozos=Math.floor(e/TROZO);
  const parte=trozos/TOTAL;                        /* fracción del local */
  const rentaAnual=VALOR*r/100;                    /* lo que renta el local entero */
  const tuyoAnual=rentaAnual*parte;
  const puesto=trozos*TROZO;                       /* lo realmente invertido */
  /* La rentabilidad recibida sale de dividir lo que cobras entre lo que
     pusiste. Con trozos enteros da exactamente la del local, y esa
     coincidencia es justo lo que hay que enseñar. */
  const tuRent=puesto>0?tuyoAnual/puesto*100:0;

  pon('calcEuros_v',eur(e,0));
  pon('calcRent_v',num(r,1)+' % al año');
  bEur.setAttribute('aria-valuetext',eur(e,0));
  bRent.setAttribute('aria-valuetext',num(r,1)+' % al año');
  pon('tRent',num(tuRent,1)+' %');
  pon('tAnual',eur(tuyoAnual,tuyoAnual<100?2:0));
  pon('tMes',eur(tuyoAnual/12,2));

  pon('c1a',eur(e,0));            pon('c1b',num(trozos,0)+(trozos===1?' trozo':' trozos'));
  pon('c2a',num(trozos,0));       pon('c2b',num(parte*100,2)+' % es tuyo');
  pon('c3a',num(r,1)+' %');       pon('c3b',eur(rentaAnual,0)+' al año');
  pon('c4a',num(parte*100,2)+' %');pon('c4b',eur(tuyoAnual,tuyoAnual<100?2:0)+' al año');

 }

 /* El tic del deslizador, como el de una rueda dentada: suena UNA vez por
    escalón, no en cada píxel del arrastre. Sin esta guarda es una
    ametralladora; con ella, engancha. */
 let ultimo=null;
 const tic=b=>{ if(b.value!==ultimo){ ultimo=b.value; Sonido.tic(); } };
 [bEur,bRent].forEach(b=>{
  b.addEventListener('input',()=>{actualiza(); tic(b);});
 });
 actualiza();
})();

/* =================================================================
   RADAR
   ================================================================= */
const initials=n=>n.replace(/[^A-Za-zÀ-ÿ ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
/* Todo lo que llega de la base se trata como texto, aunque sea contenido
   editorial. Así una fila alterada no puede convertirse en HTML al pintar
   el radar, las fichas, el comparador o las fuentes. */
const escHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>
 ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlHttps=s=>{const v=String(s||'').trim();
 if(!/^https:\/\/[^\s<>"'\\]+$/i.test(v))return'';
 try{if(typeof URL==='function'){const u=new URL(v);return u.protocol==='https:'?u.href:''}return v}catch(e){return''}};
/* Las fechas salen del dato, nunca escritas a mano: una fecha de revisión
   que se queda vieja sin que nadie lo note destruye la credibilidad de un
   registro que se vende precisamente por estar al día. */
const fCorta=s=>{if(!s)return'';const[a,m,d]=String(s).split('-');return `${d}.${m}.${a.slice(2)}`};
const fLarga=s=>{if(!s)return'';const[a,m,d]=String(s).split('-');return `${d}.${m}.${a}`};
const revisionVisible=p=>p&&p.verificacionLocal?p.verificacionLocal.verificadoEl:p&&p.ver;
const accesoVisible=p=>p&&p.verificacionLocal
 ?etiquetaVerificacionLocal(p.verificacionLocal.acceso.estado):p&&p.acceso;
const accesoClasificado=p=>p&&p.verificacionLocal&&p.verificacionLocal.acceso.estado==='no_verificable'
 ?'':p&&p.acceso;
const ultimaRevision=()=>{const ds=P.map(revisionVisible).filter(Boolean).sort();return ds.length?fLarga(ds[ds.length-1]):''};
function textoBusquedaPlataforma(p){
 const v=p&&p.verificacionLocal;
 const verificado=v?[
  v.estadoOperativo.estado,v.estadoOperativo.detalle,
  v.licenciaRegistro.estado,v.licenciaRegistro.detalle,
  v.acceso.estado,v.acceso.detalle,
  ...v.alertasCriticas.flatMap(alerta=>[alerta.codigo,alerta.detalle])
 ]:[p.nota,p.aval,p.acceso];
 return [p.n,p.cat,p.reg,p.cadenas,...verificado].filter(Boolean).join(' ').toLowerCase();
}
function resumenVerificacionLocalHtml(verificacion){
 if(!verificacion)return'';
 const campos=[['Estado operativo',verificacion.estadoOperativo],
  ['Licencia / registro',verificacion.licenciaRegistro],['Acceso',verificacion.acceso]];
 return '<div class="verificacion-local-resumen" aria-label="Revisión editorial '+escHtml(verificacion.verificadoEl)+'">'+
  '<div class="verificacion-local-fecha">REVISIÓN EDITORIAL · '+escHtml(verificacion.verificadoEl)+'</div><div class="verificacion-local-estados">'+
  campos.map(([nombre,campo])=>'<span class="verificacion-local-estado '+
   ((campo.estado==='no_verificable'||campo.estado==='sin_registro_declarado')?'atencion':'')+'"><b>'+escHtml(nombre)+'</b>'+escHtml(etiquetaVerificacionLocal(campo.estado))+'</span>').join('')+
  '</div>'+verificacion.alertasCriticas.map(alerta=>'<p class="verificacion-local-alerta"><b>Alerta crítica</b>'+escHtml(alerta.detalle)+'</p>').join('')+'</div>';
}
function detalleVerificacionLocalHtml(verificacion){
 if(!verificacion)return'';
 const campos=[['Estado operativo',verificacion.estadoOperativo],
  ['Licencia / registro',verificacion.licenciaRegistro],['Acceso',verificacion.acceso]];
 return '<section class="pn-seccion pn-verificacion-local" aria-labelledby="dwVerificacionLocalTit">'+
  '<div class="pn-verificacion-local-cab"><h4 id="dwVerificacionLocalTit">Revisión editorial</h4><time datetime="'+
  escHtml(verificacion.verificadoEl)+'">'+escHtml(verificacion.verificadoEl)+'</time></div><div class="pn-verificacion-local-campos">'+
  campos.map(([nombre,campo])=>'<article class="pn-verificacion-local-campo '+
   ((campo.estado==='no_verificable'||campo.estado==='sin_registro_declarado')?'atencion':'')+'"><div><b>'+escHtml(nombre)+'</b><span>'+escHtml(etiquetaVerificacionLocal(campo.estado))+'</span></div><p>'+escHtml(campo.detalle)+'</p></article>').join('')+
  '</div><div class="pn-verificacion-local-alertas"><h5>Alertas críticas</h5><ul>'+
  verificacion.alertasCriticas.map(alerta=>'<li>'+escHtml(alerta.detalle)+'</li>').join('')+
  '</ul></div>'+fuentesVerificacionHtml(verificacion)+'<p class="pn-nota">Registro, documento o web accesible no equivalen a aval, licencia global ni acceso desde España.</p></section>';
}
function fuentesVerificacionHtml(verificacion){
 const fuentes=[...new Map([
  ...['estadoOperativo','licenciaRegistro','acceso'].flatMap(c=>verificacion[c]?.fuentes||[]),
  ...(verificacion.alertasCriticas||[]).flatMap(a=>a.fuentes||[])
 ].filter(f=>f&&urlHttps(f.url)).map(f=>[f.url,f])).values()];
 if(!fuentes.length)return'';
 return '<div class="fuentes"><span class="fuentes-t">Fuentes consultadas</span>'+fuentes.map(f=>
  '<a href="'+escHtml(urlHttps(f.url))+'" target="_blank" rel="noopener nofollow">'+escHtml(f.titulo||f.url)+
  (f.consultadaEl?' · '+escHtml(f.consultadaEl):'')+' ↗</a>').join('')+'</div>';
}
const colOf=p=>(CATMETA[p.cat]||{c:'#7C8699'}).c;
const catClase=p=>' cat-'+Math.max(0,Object.keys(CATMETA).indexOf(p.cat));
const aplicaCat=(el,p)=>{if(!el)return;for(let i=0;i<6;i++)el.classList.remove('cat-'+i);el.classList.add(catClase(p).trim())};
const siglaEl=(p,cls='sigla')=>`<span class="${escHtml(cls)} ${catClase(p)}">${escHtml(initials(String(p.n||'')))}</span>`;
const okSVG=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3FD69B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg>`;
const escudoSVG=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l7.5 3v6c0 4.4-3 7.8-7.5 9-4.5-1.2-7.5-4.6-7.5-9V6z"/><path d="M9 12l2.2 2.2L15.5 10" stroke-linecap="round"/></svg>`;

/* =================================================================
   EL RADAR DE PORTADA
   -----------------------------------------------------------------
   El registro entero, dibujado como lo que dice ser. No es un adorno:
   sale de la misma lista `P` que las fichas, se actualiza cuando la base
   de datos cambia y cada punto abre su ficha.

   Dónde cae cada plataforma:
     · el SECTOR (ángulo) es el tipo de activo — seis, uno por categoría;
     · el RADIO es a quién deja entrar. Las abiertas a cualquiera caen
       cerca del centro, las que solo admiten institucionales quedan en
       el borde. Así "lo que puedo tocar yo" se lee de un vistazo, que es
       la pregunta con la que llega casi todo el que entra.
   ================================================================= */
const RADIO_ACCESO={"Minorista":0.40,"Acreditado":0.60,"Empresas":0.76,"Institucional":0.90};
const VUELTA=8;   /* segundos que tarda el barrido en dar la vuelta */

function pintarRadar(){
 const svg=document.getElementById('radarHero');
 if(!svg) return;
 /* RMAX=140, no 168: los rótulos van FUERA del círculo y con 168 el de la
    izquierda se salía del lienzo y aparecía cortado. */
 const CX=200, CY=200, RMAX=140;
 const cats=Object.keys(CATMETA);
 const CORTO={"Inmobiliario":"Inmuebles","Crédito privado":"Crédito","Tesoro y fondos":"Tesoro",
  "Acciones y capital privado":"Acciones","Materias primas":"Materias","Infraestructura":"Infra"};
 const pol=(ang,rad)=>[CX+Math.cos(ang*Math.PI/180)*rad, CY+Math.sin(ang*Math.PI/180)*rad];

 let s='';
 /* Anillos, uno por nivel de acceso. Sin rótulo dentro: los cuatro nombres
    caían justo encima de los puntos del sector de arriba y no se leía ni
    una cosa ni la otra. La escala se explica en una línea debajo del
    dibujo, que además se lee sin tener que buscarla. */
 [0.40,0.60,0.76,0.90].forEach(f=>{
  s+=`<circle class="radar-anillo" cx="${CX}" cy="${CY}" r="${(RMAX*f).toFixed(1)}"/>`;
 });
 s+=`<circle class="radar-borde" cx="${CX}" cy="${CY}" r="${RMAX}"/>`;

 /* Marcas de grado en el borde. Puro oficio: no informan de nada, pero sin
    ellas el círculo parece un gráfico y con ellas parece un aparato.
    36 y no 72: con una cada cinco grados el borde se convertía en una
    línea gruesa y sucia en vez de en una escala. */
 for(let g=0;g<36;g++){
  const a=g*10, largo=(g%3===0)?7:3.5;
  const [x1,y1]=pol(a,RMAX), [x2,y2]=pol(a,RMAX+largo);
  s+=`<line class="radar-tick${g%6===0?' fuerte':''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
 }

 /* Los seis sectores. El rótulo es un botón: filtra el radar de abajo y
    baja hasta él. Convierte el dibujo en un mando de navegación en vez
    de en una lámina que solo se mira. */
 cats.forEach((c,i)=>{
  const a=-90+i*60-30;
  const [x,y]=pol(a,RMAX);
  s+=`<line class="radar-sector" x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  const [tx,ty]=pol(-90+i*60,RMAX+19);
  s+=`<g class="radar-etg" tabindex="0" role="button" aria-label="Ver solo ${escHtml(c)} en el radar"`
   +` data-filtra="${escHtml(c)}">`
   /* El rótulo va del color de su categoría, y con eso el radar gana la
      leyenda que le faltaba: se ve de un vistazo qué color es cada tipo
      de activo, sin una tabla aparte. Va en `style` y no en `fill`
      porque un atributo de presentación pierde contra la clase CSS. */
   +`<rect class="radar-et-zona" x="${(tx-48).toFixed(1)}" y="${(ty-22).toFixed(1)}" width="96" height="44" rx="13" fill="transparent"/>`
   +`<text class="radar-et" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${CATMETA[c].c}">${escHtml(CORTO[c]||c)}</text></g>`;
 });

 /* El barrido: una cola larga que se apaga, no una porción de tarta. Un
    radar deja estela de fósforo; el borde duro delataba el truco. */
 s+=`<g class="radar-barrido">`
   +`<path d="M${CX} ${CY} L${CX+RMAX} ${CY} A${RMAX} ${RMAX} 0 0 0 ${(CX+RMAX*Math.cos(-88*Math.PI/180)).toFixed(1)} ${(CY+RMAX*Math.sin(-88*Math.PI/180)).toFixed(1)} Z" fill="url(#gBarrido)"/>`
   +`<line x1="${CX}" y1="${CY}" x2="${CX+RMAX}" y2="${CY}" stroke="#25E39A" stroke-width="1.3" opacity=".75"/></g>`;
 s+=`<circle class="radar-centro" cx="${CX}" cy="${CY}" r="2.6"/>`;

 /* y los puntos: uno por plataforma */
 P.forEach((p,i)=>{
  const ci=Math.max(0,cats.indexOf(p.cat));
  const n=P.filter(x=>x.cat===p.cat).length;
  const k=P.filter(x=>x.cat===p.cat).indexOf(p);
  /* Repartidas dentro de su sector, y separadas TAMBIÉN en radio.
     Repartirlas solo en ángulo no bastaba: dos plataformas de la misma
     categoría y el mismo tipo de acceso caen en el mismo anillo y se
     tocaban.

     Estos tres números no son a ojo. Se buscaron probando el espacio
     entero y midiendo la distancia mínima entre puntos, con dos límites
     que no se pueden cruzar: la apertura no puede pasar de 56° o algún
     punto se sale de su sector y parece de otra categoría, y el escalón
     no puede pasar de 0,12 o invade el anillo de al lado y se pierde la
     lectura de "distancia = a quién deja entrar". Dentro de eso, el mejor
     reparto deja 11,2 unidades entre los dos puntos más juntos, frente a
     las 9,4 de antes. Y el azar sobra: jitter 0 gana a cualquier jitter,
     porque desordena sin separar. */
  const ang=-90+ci*60+(((k+0.5)/Math.max(n,1))-0.5)*56;
  /* Un acceso que el overlay actual no pudo confirmar no conserva en el
     dibujo la posición histórica de «Minorista». Se lleva al perímetro,
     fuera de los cuatro anillos con significado, para no codificar como
     hecho visual precisamente lo que la revisión deja abierto. */
  const accesoRadar=p.verificacionLocal&&p.verificacionLocal.acceso.estado==='no_verificable'
   ?'__no_verificable':p.acceso;
  const base=accesoRadar==='__no_verificable'?0.98:
   (RADIO_ACCESO[accesoRadar]!=null?RADIO_ACCESO[accesoRadar]:0.7);
  const mismos=P.filter(x=>x.cat===p.cat&&(
   x.verificacionLocal&&x.verificacionLocal.acceso.estado==='no_verificable'
    ?'__no_verificable':x.acceso)===accesoRadar);
  const kk=mismos.indexOf(p);
  const escalon=mismos.length>1 ? ((kk/(mismos.length-1))-0.5)*0.115 : 0;
  const rad=RMAX*(base+escalon);
  const [x,y]=pol(ang,rad);
  const col=colOf(p);
  /* El retardo negativo hace que el halo se encienda justo cuando el
     barrido cruza este ángulo. El ángulo se mide desde el eje +X, igual
     que la rotación del barrido: sumándole 90 (por empezar los sectores
     arriba) los halos iban un cuarto de vuelta adelantados y encendían
     puntos donde no había nada. */
  const norm=((ang%360)+360)%360;
  s+=`<g class="blip" tabindex="0" role="button" data-cat="${escHtml(p.cat)}" data-i="${i}"`
   +` data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}"`
   +` aria-label="${escHtml(p.n)}. ${escHtml(p.cat)}. Estado de acceso: ${escHtml(accesoVisible(p))}. Abrir ficha.">`
   +`<title>${escHtml(p.n)} · ${escHtml(p.cat)} · acceso: ${escHtml(accesoVisible(p))}</title>`
   +`<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${col}"/>`
   +`<circle class="anillo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${col}"/>`
   /* el borde oscuro separa dos puntos que se rocen: sin él, dos colores
      contiguos se funden en una mancha */
   +`<circle class="punto" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${col}" stroke="#0B0A0A" stroke-width="1.4"/>`
   +`<circle class="zona" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="transparent" pointer-events="none"/>`
   +`</g>`;
 });
 svg.innerHTML=`<defs><radialGradient id="gBarrido" cx="0" cy="0.5" r="1">`
  +`<stop offset="0" stop-color="#25E39A" stop-opacity=".26"/>`
  +`<stop offset=".55" stop-color="#25E39A" stop-opacity=".07"/>`
  +`<stop offset="1" stop-color="#25E39A" stop-opacity="0"/></radialGradient></defs>`+s;
}

/* La lectura: qué plataforma es el punto que tienes debajo del ratón o
   enfocado con el tabulador. Va por delegación en el contenedor porque el
   SVG se vuelve a pintar entero cuando cambia la base de datos. */
(function radarInteractivo(){
 const svg=document.getElementById('radarHero');
 const caja=document.getElementById('radarLee');
 if(!svg||!caja) return;
 const vacio=caja.querySelector('.rl-vacio'), dato=caja.querySelector('.rl-dato');
 const $=id=>document.getElementById(id);

 function lee(i){
  const p=P[i]; if(!p) return;
  caja.classList.add('viva');
  aplicaCat(caja,p);
  vacio.hidden=true; dato.hidden=false;
  aplicaCat($('rlPunto'),p);
  $('rlNom').textContent=p.n;
  $('rlMeta').textContent=p.cat+' · acceso: '+accesoVisible(p)+' · '+p.reg;
 }
 function limpia(){
  caja.classList.remove('viva');
  vacio.hidden=false; dato.hidden=true;
 }
 const deEvento=e=>{const g=e.target.closest?e.target.closest('.blip'):null;
  return g?parseInt(g.dataset.i,10):null;};
 function masCercano(e){
  const matriz=svg.getScreenCTM&&svg.getScreenCTM();
  if(!matriz||!svg.createSVGPoint)return null;
  let punto;
  try{
   punto=svg.createSVGPoint();punto.x=e.clientX;punto.y=e.clientY;
   punto=punto.matrixTransform(matriz.inverse());
  }catch{return null;}
  let mejor=null,distancia=22*22;
  svg.querySelectorAll('.blip').forEach(g=>{
   const dx=punto.x-Number(g.dataset.x),dy=punto.y-Number(g.dataset.y),d=dx*dx+dy*dy;
   if(Number.isFinite(d)&&d<=distancia){distancia=d;mejor=parseInt(g.dataset.i,10);}
  });
  return Number.isInteger(mejor)?mejor:null;
 }

 svg.addEventListener('pointermove',e=>{const i=masCercano(e);i!=null?lee(i):limpia();});
 svg.addEventListener('pointerleave',limpia);
 svg.addEventListener('focusin',e=>{const i=deEvento(e); if(i!=null) lee(i);});
 svg.addEventListener('focusout',limpia);
 svg.addEventListener('click',e=>{
  const et=e.target.closest?e.target.closest('.radar-etg'):null;
  if(et)return filtraDesdeRadar(et.dataset.filtra);
  const i=masCercano(e);if(i!=null)openDrawer(i);
 });
 svg.addEventListener('keydown',e=>{
  const blip=e.target.closest?e.target.closest('.blip'):null;
  if(blip&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDrawer(parseInt(blip.dataset.i,10));return;}
  const et=e.target.closest?e.target.closest('.radar-etg'):null;
  if(et&&(e.key==='Enter'||e.key===' ')){e.preventDefault();filtraDesdeRadar(et.dataset.filtra);}
 });
})();

/* Pulsar el nombre de un sector filtra la lista de abajo y baja hasta
   ella: el radar deja de ser una lámina y pasa a ser el índice. */
function filtraDesdeRadar(cat){
 S2.cat=cat; render();
 llevaAResultados({categoria:cat,devolverFoco:true});
}

let S2={cat:"",reg:"",acc:"",tic:"",q:"",view:"grid"};
let compare=[];
const LIMITE_MOVIL_RESULTADOS=6;
let movilResultadosExpandidos=false;
let movilFiltrosAbiertos=false;

function llevaAResultados({categoria='',devolverFoco=false,soloMovil=false}={}){
 requestAnimationFrame(()=>{
  const esMovil=Boolean(document.documentElement&&document.documentElement.classList&&
   document.documentElement.classList.contains('movil-ui'));
  if(soloMovil&&!esMovil)return;
  const destino=document.getElementById('plataformasResultados')||document.getElementById('count');
  if(destino&&destino.scrollIntoView)
   destino.scrollIntoView({block:'start',behavior:menos?'auto':'smooth'});
  if(!devolverFoco)return;
  const equivalente=[...document.querySelectorAll('[data-filtrar-cat]')]
   .find(nodo=>(nodo.dataset.filtrarCat||'')===categoria);
  if(equivalente)equivalente.focus({preventScroll:true});
 });
}

function actualizarFiltrosMoviles(){
 const boton=document.getElementById('movilFiltrosToggle');
 const panel=document.getElementById('movilFiltrosAvanzados');
 const cuenta=document.getElementById('movilFiltrosCuenta');
 const activos=[S2.reg,S2.acc,S2.tic].filter(Boolean).length;
 if(boton){
  boton.setAttribute('aria-expanded',movilFiltrosAbiertos?'true':'false');
  boton.classList.toggle('tiene-filtros',activos>0);
 }
 if(panel)panel.classList.toggle('abiertos',movilFiltrosAbiertos);
 if(cuenta){cuenta.hidden=activos===0;cuenta.textContent=String(activos);}
}
function alternarFiltrosMoviles(){
 movilFiltrosAbiertos=!movilFiltrosAbiertos;
 actualizarFiltrosMoviles();
 if(movilFiltrosAbiertos)requestAnimationFrame(()=>document.getElementById('fReg')?.focus({preventScroll:true}));
 else document.getElementById('movilFiltrosToggle')?.focus({preventScroll:true});
}

function hayFiltrosPlataformas(){
 return Boolean(S2.cat||S2.reg||S2.acc||S2.tic||S2.q);
}
function actualizarResultadosMoviles(total){
 const g=document.getElementById('grid'),b=document.getElementById('movilResultadosMas');
 if(!g||!b)return;
 const filtrando=hayFiltrosPlataformas();
 const todos=movilResultadosExpandidos||filtrando||S2.view!=='grid';
 g.classList.toggle('movil-resultados-abiertos',todos);
 b.hidden=S2.view!=='grid'||filtrando||total<=LIMITE_MOVIL_RESULTADOS;
 b.setAttribute('aria-expanded',movilResultadosExpandidos?'true':'false');
 b.textContent=movilResultadosExpandidos
  ?'Mostrar solo 6'
  :'Ver '+(total-LIMITE_MOVIL_RESULTADOS)+' más';
}
function alternarResultadosMoviles(){
 movilResultadosExpandidos=!movilResultadosExpandidos;
 const total=filtered().length;
 actualizarResultadosMoviles(total);
 if(!movilResultadosExpandidos){
  const cuenta=document.getElementById('count');
  if(cuenta)cuenta.scrollIntoView({block:'start',behavior:menos?'auto':'smooth'});
 }
}

function rellenaRegiones(){
 const s=document.getElementById('fReg');if(!s)return;
 const elegida=S2&&S2.reg||'';
 if(s.options)while(s.options.length>1)s.remove(1);
 [...new Set(P.map(p=>p.reg))].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>s.add(new Option(r,r)));
 if(!s.options)return; /* el DOM mínimo del pre-render no modela <option> */
 s.value=Array.from(s.options).some(o=>o.value===elegida)?elegida:'';
 if(!s.value)S2.reg='';
}
rellenaRegiones();
ACCESOS.forEach(a=>document.getElementById('fAcc').add(new Option(a,a)));
TICKETS.forEach(t=>document.getElementById('fTic').add(new Option(t==="No aplica"?"Entrada: no aplica":"Entrada "+t.toLowerCase(),t)));
document.getElementById('fReg').onchange=e=>{S2.reg=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('fAcc').onchange=e=>{S2.acc=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('fTic').onchange=e=>{S2.tic=e.target.value;Sonido.filtro();render();llevaAResultados({soloMovil:true})};
document.getElementById('q').oninput=e=>{S2.q=e.target.value.toLowerCase();render()};
function resetAll(){S2={cat:"",reg:"",acc:"",tic:"",q:"",view:S2.view};movilResultadosExpandidos=false;document.getElementById('q').value='';['fReg','fAcc','fTic'].forEach(i=>document.getElementById(i).value='');render()}

document.getElementById('s1').textContent=P.length;
document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
document.getElementById('s4').textContent=FUERA.length;
/* El rotulo del radar tambien: estaba escrito a mano y se quedo en 24
   cuando el registro crecio. Ahora sale de P como todo lo demas. */
{const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';}

function filtered(){
 return P.filter(p=>{
  if(S2.cat&&p.cat!==S2.cat)return false;
  if(S2.reg&&p.reg!==S2.reg)return false;
  if(S2.acc&&accesoClasificado(p)!==S2.acc)return false;
  if(S2.tic&&p.ticket!==S2.tic)return false;
  if(S2.q&&!textoBusquedaPlataforma(p).includes(S2.q))return false;
  return true;
 }).sort((a,b)=>a.n.localeCompare(b.n,'es'));
}
function setView(v){S2.view=v;['vGrid','vMat'].forEach((id,i)=>{const b=document.getElementById(id),on=(i===0)===(v==='grid');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});render();llevaAResultados({soloMovil:true})}

function render(){
 document.getElementById('pills').innerHTML=
  `<button class="f ${S2.cat===''?'on':''}" data-filtrar-cat="" aria-pressed="${S2.cat===''?'true':'false'}">Todas <span class="ct">${P.length}</span></button>`+
  Object.keys(CATMETA).map(c=>{const n=P.filter(p=>p.cat===c).length;
   const cp={cat:c};return `<button class="f ${S2.cat===c?'on':''}" data-cat="${escHtml(c)}" data-filtrar-cat="${escHtml(c)}" aria-pressed="${S2.cat===c?'true':'false'}"><span class="punto ${catClase(cp)}"></span>${escHtml(c)} <span class="ct">${n}</span></button>`}).join('');
 const f=filtered();
 document.getElementById('count').innerHTML=`<b>${f.length}</b> de ${P.length} plataformas · última revisión ${ultimaRevision()}`;
 document.getElementById('grid').classList.toggle('hide',S2.view!=='grid');
 document.getElementById('matrix').classList.toggle('show',S2.view==='matrix');
 S2.view==='grid'?renderGrid(f):renderMatrix(f);
 actualizarResultadosMoviles(f.length);
 actualizarFiltrosMoviles();
 pintarRadar();
 renderCmpBar();
 pulir();   /* al filtrar se crean fichas nuevas: vuelven a entrar animadas */
}
function renderGrid(f){
 const g=document.getElementById('grid');
 if(!f.length){g.innerHTML=`<div class="vacio"><p>El radar no detecta ninguna plataforma con estos filtros.</p><button class="f" data-accion="limpiar">Limpiar filtros</button></div>`;return}
 g.innerHTML=f.map(p=>{const i=P.indexOf(p),on=compare.includes(i),ilustrativa=portadaEsIlustrativa(p);
  const portada=String(p.n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const compararTexto=on?`Quitar ${p.n} de la comparación`:`Añadir ${p.n} a la comparación`;
  const v=p.verificacionLocal;
  const nota=v?v.estadoOperativo.detalle:p.nota;
  const aval=v?v.licenciaRegistro.detalle:p.aval;
  const marcaRevision=v?'Revisión editorial '+v.verificadoEl:'Ficha verificada';
  const marcas=v?resumenVerificacionLocalHtml(v):
   `<div class="marcas"><span class="m acc">${escHtml(p.acceso)}</span><span class="m">Entrada: ${escHtml(String(p.ticket).toLowerCase())}</span><span class="m">${escHtml(p.cadenas)}</span></div>`;
  return `<div class="ficha ${on?'sel':''} ${catClase(p)}">
   <button type="button" class="empresa-visual__abrir" data-abrir="${i}" aria-label="Abrir la ficha de ${escHtml(p.n)}${ilustrativa?'; portada ilustrativa':''}">
    <img class="empresa-visual__imagen" src="/plataformas/${portada}.webp" alt="" width="720" height="720" loading="lazy" decoding="async" draggable="false">
    <span class="empresa-visual__sombra" aria-hidden="true"></span>
    <span class="empresa-visual__categoria">${escHtml(p.cat)}</span>${ilustrativa?'<span class="empresa-visual__origen">Ilustración</span>':''}
    <span class="empresa-visual__texto"><strong>${escHtml(p.n)}</strong><small>${escHtml(p.tipo)} · ${escHtml(p.reg)}</small></span>
    ${v?`<span class="empresa-visual__verificada"><span>${escHtml(marcaRevision)}</span></span>`:
     `<span class="empresa-visual__verificada">${okSVG}<span>Ficha verificada</span></span>`}
    <span class="empresa-visual__flecha" aria-hidden="true">›</span>
   </button>
   <button type="button" class="cmp empresa-visual__comparar ${on?'on':''}" data-comparar="${i}" aria-pressed="${on?'true':'false'}" aria-label="${escHtml(compararTexto)}" title="${escHtml(compararTexto)}"><span aria-hidden="true">${on?'✓':'+'}</span></button>
   <div class="ficha-alto">${siglaEl(p)}<div class="ficha-nom"><h3><button class="abrir" data-cat="${escHtml(p.cat)}" data-abrir="${i}">${escHtml(p.n)}</button></h3><div class="sub">${escHtml(p.tipo)} · ${escHtml(p.reg)}</div></div></div>
   <p class="nota">${escHtml(nota)}</p>
   <div class="aval${v?' aval-local':''}">${v?'':escudoSVG}<span>${escHtml(aval)}</span></div>
   ${marcas}
   <div class="ficha-pie"><span class="verif">${v?'':' '+okSVG}${v?'Revisión editorial '+escHtml(v.verificadoEl):' Verificado '+escHtml(fCorta(p.ver))}</span>
    <button class="cmp ${on?'on':''}" data-comparar="${i}" aria-pressed="${on?'true':'false'}">${on?'✓ Comparando':'+ Comparar'}</button>
    <button class="movil-ficha-abrir" data-abrir="${i}">Ver ficha <span aria-hidden="true">›</span></button></div></div>`}).join('');
}
function renderMatrix(f){
 document.getElementById('matrix').innerHTML=`<table class="tabla">
  <thead><tr><th>Tipo de activo ↓ &nbsp;/&nbsp; Quién puede entrar →</th>${ACCESOS.map(a=>`<th>${escHtml(a)}</th>`).join('')}</tr></thead>
  <tbody>${Object.keys(CATMETA).map(c=>`<tr><th>${escHtml(c)}</th>${ACCESOS.map(a=>{
   const l=f.filter(p=>p.cat===c&&accesoClasificado(p)===a);
   return `<td><div class="celda">${l.length?l.map(p=>{const i=P.indexOf(p);
    return `<button class="mm" data-abrir="${i}"><span class="md ${catClase(p)}">${escHtml(initials(p.n))}</span>${escHtml(p.n)}</button>`}).join(''):'<span class="nada">—</span>'}</div></td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function openDrawer(i){
 const p=P[i];
 if(!p)return;
 const web=urlHttps(p.web);
 const v=p.verificacionLocal;
 const resumen=v?v.estadoOperativo.detalle:p.nota;
 const origenVisual=portadaEsIlustrativa(p)
  ? `<aside class="pn-origen-visual" aria-label="Origen de la portada"><strong>Imagen ilustrativa</strong><span>Representación editorial creada por RWAdar para explicar ${escHtml(p.cat.toLowerCase())}. No muestra un activo concreto de ${escHtml(p.n)}.</span></aside>`
  : `<aside class="pn-origen-visual oficial" aria-label="Origen de la portada"><strong>Imagen oficial</strong><span>Portada procedente de una fuente oficial y usada con finalidad informativa.</span></aside>`;
 document.getElementById('dwId').innerHTML=`${siglaEl(p)}<div><h3 id="dwTitulo">${escHtml(p.n)}</h3><div class="cat">${escHtml(p.cat)}</div></div>`;
 document.getElementById('dwBody').innerHTML=`
  <section class="pn-seccion pn-resumen" aria-labelledby="dwResumenTit">
   <h4 id="dwResumenTit">Resumen</h4>
   <p id="dwResumen">${escHtml(p.nota)}</p>
   <div class="pn-claves" aria-label="Datos principales">
    <span>${escHtml(p.tipo)}</span><span>${escHtml(p.reg)}</span><span>Acceso: ${escHtml(accesoVisible(p))}</span>
   </div>
  </section>
  ${origenVisual}
  ${v?detalleVerificacionLocalHtml(v):`<section class="pn-seccion pn-verificacion" aria-labelledby="dwVerificacionTit">
   <h4 id="dwVerificacionTit">Verificación RWAdar</h4>
   <div class="aval aval-detalle">${escudoSVG}<span>${escHtml(p.aval)}</span></div>
  </section>`}
  <div class="pn-datos-grid">
   <section class="pn-seccion pn-datos" aria-labelledby="dwAccesoTit">
    <h4 id="dwAccesoTit">Acceso e inversión</h4>
    <dl class="datos">
     <div><dt>Tipo de actor</dt><dd>${escHtml(p.tipo)}</dd></div>
     <div><dt>Quién puede entrar</dt><dd>${escHtml(p.acceso)}</dd></div>
     <div><dt>Importe de entrada</dt><dd>${escHtml(p.ticket)}</dd></div>
    </dl>
   </section>
   <section class="pn-seccion pn-datos" aria-labelledby="dwActivoTit">
    <h4 id="dwActivoTit">Activo y alcance</h4>
    <dl class="datos">
     <div><dt>Tipo de activo</dt><dd>${escHtml(p.cat)}</dd></div>
     <div><dt>Región / marco</dt><dd>${escHtml(p.reg)}</dd></div>
     <div><dt>Cadenas</dt><dd>${escHtml(p.cadenas)}</dd></div>
     <div><dt>Última verificación</dt><dd>${escHtml(fLarga(p.ver))}</dd></div>
    </dl>
   </section>
  </div>
  <section class="pn-seccion pn-seguimiento" aria-labelledby="dwSeguimientoTit">
   <h4 id="dwSeguimientoTit">Seguimiento</h4>
   <div id="dwVigilar"></div>
  </section>
  <div class="pn-web-escritorio">
   ${web?`<a class="pn-cta" href="${escHtml(web)}" target="_blank" rel="noopener">Abrir ${escHtml(p.n)} ↗</a>`:'<p class="pn-nota">Web oficial no disponible.</p>'}
   <p class="pn-nota">Se abre la web oficial en otra pestaña. Verifica siempre los datos en origen.</p>
  </div>
  <p class="pn-nota pn-web-movil-nota">El botón «Web oficial» abre otra pestaña. Verifica siempre los datos en origen.</p>
  ${v?'':`<section class="pn-seccion pn-opiniones-seccion" aria-label="Puntuación y opiniones">
   <div id="dwOpiniones"></div>
  </section>`}`;
 if(v){
  const resumenLocal=document.getElementById('dwResumen');
  if(resumenLocal)resumenLocal.textContent=resumen;
  const filas=[...document.querySelectorAll('#dwBody .datos>div')];
  const accesoLocal=filas.find(fila=>fila.querySelector('dt')&&fila.querySelector('dt').textContent==='Quién puede entrar');
  if(accesoLocal){accesoLocal.querySelector('dt').textContent='Estado de acceso';accesoLocal.querySelector('dd').textContent=accesoVisible(p);}
  const revisionLocal=filas.find(fila=>fila.querySelector('dt')&&fila.querySelector('dt').textContent==='Última verificación');
  if(revisionLocal){revisionLocal.querySelector('dt').textContent='Revisión editorial';revisionLocal.querySelector('dd').textContent=v.verificadoEl;}
 }
 const acciones=document.getElementById('dwAcciones');
 acciones.classList.toggle('sin-web',!web);
 acciones.innerHTML=(web
  ? `<a class="pn-accion-principal" href="${escHtml(web)}" target="_blank" rel="noopener" aria-label="Abrir la web oficial de ${escHtml(p.n)}">Web oficial <span aria-hidden="true">↗</span></a>`
  : '<span class="pn-accion-no-web">Web oficial no disponible</span>')+
  '<button class="pn-accion-cerrar" type="button" data-accion="cerrar-panel">Cerrar ficha</button>';
 /* const en el nivel superior NO se cuelga de window: hay que preguntar
    por el nombre, no por la propiedad. */
 if(typeof Cuenta!=="undefined") Cuenta.pintarVigilar(p.n);
 /* Las opiniones se cargan de la red, asi que van despues de abrir el
    panel: primero se ve la ficha, y ellas entran cuando lleguen. */
 if(typeof Opiniones!=="undefined"&&SERVICIOS_USUARIO_DISPONIBLES){const c=document.getElementById("dwOpiniones");if(c)Opiniones.pinta(p.n,c);}
 const cuerpo=document.getElementById('dwBody');if(cuerpo)cuerpo.scrollTop=0;
 openPanel('drawer');
}
function toggleCompare(i){
 const a=compare.indexOf(i);
 if(a>-1)compare.splice(a,1);
 else{if(compare.length>=3){avisar('Puedes comparar hasta tres plataformas a la vez.');return;}compare.push(i)}
 render();requestAnimationFrame(()=>{
  const boton=[...document.querySelectorAll('[data-comparar="'+i+'"]')]
   .find(nodo=>nodo.getClientRects&&nodo.getClientRects().length);
  if(boton)boton.focus({preventScroll:true});
 });
}
function clearCompare(){compare=[];render()}
function renderCmpBar(){
 document.getElementById('cmpbar').classList.toggle('show',compare.length>0);
 document.getElementById('cmpAvs').innerHTML=compare.map(i=>siglaEl(P[i])).join('');
 document.getElementById('cmpTxt').textContent=compare.length===1?'1 seleccionada · elige otra':`${compare.length} seleccionadas`;
 document.getElementById('cmpGo').disabled=compare.length<2;
}
function openCompare(){
 const sel=compare.map(i=>P[i]);
 const datoLocal=(p,campo)=>p.verificacionLocal
  ?`<span class="comp-estado">${escHtml(etiquetaVerificacionLocal(p.verificacionLocal[campo].estado))}</span><span class="comp-nota">${escHtml(p.verificacionLocal[campo].detalle)}</span>`
  :null;
 const rows=[['Tipo de activo',p=>escHtml(p.cat)],['Tipo de actor',p=>escHtml(p.tipo)],['Región / marco',p=>escHtml(p.reg)],
  ['Estado de acceso',p=>datoLocal(p,'acceso')||`<span class="m acc">${escHtml(p.acceso)}</span>`],['Entrada',p=>escHtml(p.ticket)],['Cadenas',p=>escHtml(p.cadenas)],
  ['Licencia / registro',p=>datoLocal(p,'licenciaRegistro')||`<span class="comp-aval">${escHtml(p.aval)}</span>`],
  ['Estado operativo',p=>datoLocal(p,'estadoOperativo')||`<span class="comp-nota">${escHtml(p.nota)}</span>`],
  ['Alertas críticas',p=>p.verificacionLocal?`<span class="comp-alerta">${p.verificacionLocal.alertasCriticas.map(a=>escHtml(a.detalle)).join('<br>')}</span>`:'—'],
  ['Revisión',p=>escHtml(p.verificacionLocal?p.verificacionLocal.verificadoEl:fLarga(p.ver))],
  ['',p=>{const u=urlHttps(p.web);return u?`<a href="${escHtml(u)}" target="_blank" rel="noopener" class="comp-enlace">Abrir ↗</a>`:'—'}]];
 document.getElementById('modalBody').innerHTML=`<table class="comp">
  <thead><tr><th></th>${sel.map(p=>`<th><div class="hc">${siglaEl(p)}<strong>${escHtml(p.n)}</strong></div></th>`).join('')}</tr></thead>
  <tbody>${rows.map(([l,fn])=>`<tr><th>${escHtml(l)}</th>${sel.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 openPanel('modal');
}
/* Paneles: mientras uno está abierto el resto de la página queda inerte, así
   el tabulador no se escapa por detrás y el lector de pantalla no lo anuncia. */
const fondo=()=>[...document.querySelectorAll(
 '.hdr,.movil-cabecera,main,.movil-panel,footer,#cmpbar,#movilNav'
)];
let focoPrevio=null;
let panelHistorialActivo=false;
function openPanel(id){
 focoPrevio=document.activeElement;
 const el=document.getElementById(id);
 el.removeAttribute('inert');
 el.classList.add('show');
 document.getElementById('ovl').classList.add('show');
 document.body.classList.add('locked');
 fondo().forEach(n=>n.setAttribute('inert',''));
 const c=el.querySelector('.cerrar');
 if(c) c.focus();
 if(!panelHistorialActivo){
  const previo=history.state&&typeof history.state==='object'?history.state:{};
  history.pushState({...previo,rwadarPanel:true},'',location.href);
  panelHistorialActivo=true;
 }
}
function cierraPanelVisual(){
 ['drawer','modal','perfilPanel'].forEach(id=>{
  const el=document.getElementById(id);
  el.classList.remove('show');
  el.setAttribute('inert','');
 });
 document.getElementById('ovl').classList.remove('show');
 document.body.classList.remove('locked');
 fondo().forEach(n=>n.removeAttribute('inert'));
 if(focoPrevio && document.contains(focoPrevio)){focoPrevio.focus();focoPrevio=null}
}
function closeAll(){
 const retiraEntrada=panelHistorialActivo&&history.state&&history.state.rwadarPanel===true;
 panelHistorialActivo=false;
 cierraPanelVisual();
 if(retiraEntrada)history.back();
}
window.addEventListener('popstate',()=>{
 if(panelHistorialActivo||document.querySelector('#drawer.show,#modal.show,#perfilPanel.show')){
  panelHistorialActivo=false;cierraPanelVisual();
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});

/* ---- emisiones abiertas ---- */
const milesES=x=>Math.round(Number(x)||0).toLocaleString('es-ES');
const cortoES=x=>{const n=Number(x)||0;
 if(n>=1e6)return (Math.round(n/1e5)/10).toString().replace('.',',')+' M';
 if(n>=1000)return Math.round(n/1000)+' mil';
 return milesES(n)};
const fechaES=iso=>{const p=String(iso||'').split('-');return p.length===3?p[2]+'.'+p[1]+'.'+p[0]:'—'};
const diasHasta=iso=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return null;
 const d=new Date(iso+'T00:00:00'),h=new Date();
 return Number.isFinite(d.getTime())?Math.ceil((d-new Date(h.getFullYear(),h.getMonth(),h.getDate()))/86400000):null};
const numeroFinito=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const emisionValida=e=>e&&typeof e==='object'&&String(e.t||'').trim()&&
 String(e.pl||'').trim()&&Object.hasOwn(CATMETA,String(e.cat||''))&&urlHttps(e.url)&&
 /^\d{4}-\d{2}-\d{2}$/.test(String(e.ver||''));

let emiOrden='cierra',emiCat='';
function emisionesVisibles(){
 const estados=new Set(['abierta','programada','en_estudio']);
 const actuales=EMI.filter(emisionValida).filter(e=>estados.has(e.est||'abierta')).filter(e=>{const d=diasHasta(e.cierra);return d===null||d>=0});
 const filtradas=emiCat?actuales.filter(e=>e.cat===emiCat):actuales;
 const orden={
  cierra:(a,b)=>(diasHasta(a.cierra)??9e9)-(diasHasta(b.cierra)??9e9),
  rent:(a,b)=>numeroFinito(b.rent,-1)-numeroFinito(a.rent,-1),
  min:(a,b)=>numeroFinito(a.min)-numeroFinito(b.min),
  pct:(a,b)=>numeroFinito(b.pct)-numeroFinito(a.pct),
 }[emiOrden]||(()=>0);
 return filtradas.slice().sort(orden);
}
function pintarEmisiones(){
 const caja=document.getElementById('emiLista');if(!caja)return;
 if(MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL){pintarEscaparateLocal();return;}
 if(CATALOGO_EMBEBIDO_BLOQUEADO){
  const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.add('sin-emisiones');
  caja.innerHTML='<div class="emis-vacio"><h3>Revisión pendiente</h3><p>La copia verificada ha caducado o está incompleta. RWAdar no muestra datos anteriores mientras se renueva el lote.</p></div>';
  return;
 }
 const catalogo=EMI.filter(e=>e&&e.catalogo===true);
 if(catalogo.length){
  if(catalogo.length!==EMI.length||!catalogo.every(ofertaLocalValida)){
   caja.innerHTML='<div class="emis-vacio"><h3>Catálogo no disponible</h3><p>La revisión remota no supera el contrato completo. No mostramos una copia parcial.</p></div>';
   return;
  }
  const principales=catalogo.filter(o=>o.coleccion==='principales');
  const visibles=ordenarOfertasLocales(principales.filter(coincideOfertaLocal));
  const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.remove('sin-emisiones');
  const futuro=document.getElementById('movilOfertasFuturo');if(futuro)futuro.hidden=true;
  const informacion=document.getElementById('emisInformacion');if(informacion)informacion.open=true;
  const estado=document.getElementById('movilOfertasEstado');
  if(estado){estado.textContent=visibles.length+' de '+principales.length+' principales';estado.classList.toggle('hay-ofertas',visibles.length>0)}
  caja.innerHTML='<header class="catalogo-coleccion-cab"><h3>Ofertas principales</h3><p>'+visibles.length+' de '+principales.length+' fichas. Comprueba las condiciones actuales con el emisor.</p></header>'+
   (visibles.length?visibles.map(o=>tarjetaOfertaLocal(o)).join(''):
   '<div class="emis-vacio"><h3>Ninguna oferta coincide</h3><p>Cambia los filtros para volver a ver el catálogo verificado.</p></div>')+
   seccionReferenciasCatalogo(catalogo,'secundario')+seccionReferenciasCatalogo(catalogo,'en_camino');
  return;
 }
 const v=emisionesVisibles();
 const hayPublicadas=EMI.some(emisionValida);
 const seccion=document.getElementById('emisiones');
 const futuro=document.getElementById('movilOfertasFuturo');
 const informacion=document.getElementById('emisInformacion');
 const estadoMovil=document.getElementById('movilOfertasEstado');
 if(seccion)seccion.classList.toggle('sin-emisiones',!hayPublicadas);
 if(futuro)futuro.hidden=hayPublicadas;
 if(estadoMovil){
  estadoMovil.textContent=v.length===1?'1 abierta':v.length+' abiertas';
  estadoMovil.classList.toggle('hay-ofertas',v.length>0);
 }
 const movilUI=Boolean(document.documentElement&&document.documentElement.classList&&
  document.documentElement.classList.contains('movil-ui'));
 if(informacion)informacion.open=hayPublicadas||!movilUI;
 if(!v.length){
  caja.innerHTML=hayPublicadas
   ?'<div class="emis-vacio"><h3>Nada abierto con ese filtro</h3><p>Prueba con otra categoría o vuelve en unos días: el registro cambia cuando verificamos novedades.</p></div>'
   :'<div class="emis-vacio"><h3>Sin emisiones abiertas</h3><p>Publicaremos aquí las primeras cuando su origen y sus cifras estén comprobados.</p></div>';
  return;
 }
 caja.innerHTML=v.map(e=>{
  const d=diasHasta(e.cierra),pct=Math.max(0,Math.min(100,numeroFinito(e.pct)));
  let cierre='';
  if(e.cont)cierre='<span class="emi-cierra continua">abierto siempre</span>';
  else if(e.est==='programada'||e.est==='en_estudio'){
   const da=diasHasta(String(e.abre||'').slice(0,10));
   const texto=da===null?(e.est==='en_estudio'?'en estudio':'aún no abre'):da<=0?'abre hoy':da===1?'abre mañana':'abre en '+da+' días';
   cierre='<span class="emi-cierra proximo">'+escHtml(texto)+'</span>';
  }else if(d!==null){
   const urg=d<=3?' ultimo':d<=10?' pronto':'';
   cierre='<span class="emi-cierra'+urg+'">'+(d===0?'cierra hoy':d===1?'cierra mañana':'cierra en '+d+' días')+'</span>';
  }else if(pct>=90)cierre='<span class="emi-cierra ultimo">al '+pct+'%, casi lleno</span>';
  else if(pct>=70)cierre='<span class="emi-cierra pronto">al '+pct+'%</span>';
  else cierre='<span class="emi-cierra">'+(pct>0?'al '+pct+'%':'abierta')+'</span>';

  const donde=['<b>'+escHtml(e.pl)+'</b>',escHtml(e.cat)];
  if(e.ub)donde.push(escHtml(e.ub));
  if(numeroFinito(e.plazo)>0)donde.push(numeroFinito(e.plazo)+' meses');
  if(e.tipo)donde.push(escHtml(e.tipo));
  const objetivo=Math.max(0,numeroFinito(e.obj));
  const avance=objetivo>0
   ?'<progress class="emi-barra" max="100" value="'+pct+'" aria-label="'+pct+'% captado"></progress>'+ 
    '<div class="emi-avance"><span>'+pct+'% captado</span><span>de '+cortoES(objetivo)+' '+escHtml(e.mon)+'</span></div>'
   :'';
  const rent=Number(e.rent),min=Math.max(0,numeroFinito(e.min));
  return '<article class="emi'+catClase(e)+'">'+
   (e.pat?'<span class="emi-pat">Patrocinada</span>':'')+
   '<div class="emi-alto"><div><h3 class="emi-tit">'+escHtml(e.t)+'</h3><div class="emi-donde">'+donde.join('<span>·</span>')+'</div></div>'+cierre+'</div>'+ 
   '<div class="emi-cifras">'+
   (Number.isFinite(rent)?'<div class="emi-cifra"><span class="v oro">'+escHtml(String(rent).replace('.',','))+'<small>%</small></span><span class="l">anual, según la plataforma</span></div>':
    e.rentNo?'<div class="emi-cifra"><span class="v emi-sin-dato">—</span><span class="l">no publica rentabilidad</span></div>':'')+
   (min?'<div class="emi-cifra"><span class="v">'+milesES(min)+'<small> '+escHtml(e.mon)+'</small></span><span class="l">entrada mínima</span></div>':
    '<div class="emi-cifra"><span class="v emi-sin-dato">—</span><span class="l">entrada mínima sin publicar</span></div>')+'</div>'+ 
   (e.esNo===false?'<p class="emi-aviso">No disponible para residentes en España.</p>':'')+
   (e.rest?'<p class="emi-aviso">Acceso restringido: '+escHtml(e.rest)+'</p>':'')+
   (e.vinc===false?'<p class="emi-aviso">Es una reserva sin desembolso, no una compra.</p>':'')+
   (e.res?'<p class="emi-nota">'+escHtml(e.res)+'</p>':'')+avance+
   '<div class="emi-pie"><span class="emi-ver">Cifras de la plataforma,<br>comprobadas el '+fechaES(e.ver)+'</span>'+ 
   '<a class="emi-ir" href="'+escHtml(urlHttps(e.url))+'" target="_blank" rel="noopener nofollow'+(e.pat?' sponsored':'')+'">Ver oferta en '+escHtml(e.pl)+' ↗</a></div></article>';
 }).join('');
}
function seccionReferenciasCatalogo(catalogo,coleccion){
 const todas=catalogo.filter(o=>o.coleccion===coleccion);
 const visibles=todas.filter(o=>(!emiCat||o.categoria===emiCat)&&coincideBusquedaOfertaLocal(o))
  .sort((a,b)=>a.plataformaNombre.localeCompare(b.plataformaNombre,'es')||a.titulo.localeCompare(b.titulo,'es'));
 const titulo=coleccion==='secundario'?'Mercado secundario':'En camino';
 const alcance=coleccion==='secundario'
  ?'Referencias documentadas de mercado secundario. No confirman precio, liquidez ni disponibilidad actuales.'
  :'Anuncios documentados. No confirman apertura, fecha de lanzamiento ni acceso a la inversión.';
 return '<details class="catalogo-referencias"><summary><h3>'+titulo+'</h3><span>'+visibles.length+' de '+todas.length+' referencias</span></summary>'+
  '<p>'+alcance+' La ordenación financiera solo se aplica a las ofertas principales.</p><div class="emis-rejilla">'+
  (visibles.length?visibles.map(o=>tarjetaOfertaLocal(o)).join(''):'<p>Ninguna referencia coincide con la búsqueda y la categoría.</p>')+'</div></details>';
}
function pintarFiltrosEmision(){
 const caja=document.getElementById('emiFiltros');if(!caja)return;
 const cats=[],hayCatalogo=EMI.some(e=>e&&e.catalogo===true);
 const origen=MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL?ESCAPARATE_LOCAL.ofertas:
  hayCatalogo?EMI.filter(ofertaLocalValida):EMI.filter(emisionValida);
 origen.forEach(e=>{const cat=e.categoria||e.cat;if(cat&&!cats.includes(cat))cats.push(cat)});
 caja.innerHTML=cats.length?'<button class="f'+(emiCat?'':' on')+'" data-emi-cat="" aria-pressed="'+(!emiCat)+'">Todas</button>'+cats.map(c=>
  '<button class="f'+(emiCat===c?' on':'')+'" data-emi-cat="'+escHtml(c)+'" aria-pressed="'+(emiCat===c)+'"><span class="punto'+catClase({cat:c})+'"></span>'+escHtml(c)+'</button>').join(''):'';
}
(function mandosEmision(){
 activarDetallesOfertas();
 const filtros=document.getElementById('emiFiltros'),orden=document.getElementById('emiOrden');
 if(filtros&&filtros.addEventListener)filtros.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-emi-cat]');if(!b)return;
  emiCat=b.getAttribute('data-emi-cat')||'';pintarFiltrosEmision();pintarEmisiones();if(typeof Sonido!=='undefined'&&Sonido.marcar)Sonido.marcar()});
 if(orden&&orden.addEventListener)orden.addEventListener('change',()=>{emiOrden=orden.value||'cierra';pintarEmisiones()});
})();

/* ---- escaparate de revisión local ---------------------------------
   Los datos no se incrustan en el sitio. El servidor loopback los sirve
   desde rwadar-movil/fixtures y esta capa los valida antes de pintar. */
let emiTipoLocal='todos',emiBusquedaLocal='';
const textoLocal=v=>typeof v==='string'?v.trim():'';
const fechaLocalValida=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const normalizaBuscaLocal=v=>String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function tipoOfertaLocal(o){
 const t=normalizaBuscaLocal(o&&o.tipo);
 return t==='valor'?'valor':t==='secundario'?'secundario':'rendimiento';
}
function valorLocal(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number')return String(v);
 if(typeof v==='object'){
  for(const k of ['mostrado','mostrada','display','valor','texto','literal','importe']){
   if(v[k]!=null&&String(v[k]).trim())return String(v[k]).trim();
  }
 }
 return '';
}
function numeroLocal(v,def){
 const t=valorLocal(v).replace(/\./g,'').replace(',','.').match(/-?\d+(?:\.\d+)?/);
 const n=t?Number(t[0]):NaN;return Number.isFinite(n)?n:def;
}
function imagenOfertaLocal(o){
 if(o&&o.catalogo===true){const entrada=EDITORIAL_OFERTA_POR_CATEGORIA[o.categoria];
  return entrada?{src:entrada.src,alt:entrada.alt,etiqueta:'Ilustración editorial'}:null;}
 const m=textoLocal(o&&o.imagen).match(/^ofertas\/([a-z0-9-]+\.webp)$/);
 if(!m||!MANIFIESTO_EDITORIAL_LOCAL)return null;
 const entrada=MANIFIESTO_EDITORIAL_LOCAL.porCategoria[o.categoria];
 return entrada?{src:'/ofertas-editoriales/'+entrada.archivo,
  alt:entrada.alt,etiqueta:MANIFIESTO_EDITORIAL_LOCAL.etiqueta}:null;
}
function ofertaLocalValida(o){
 return o&&typeof o==='object'&&textoLocal(o.slug)&&textoLocal(o.titulo)&&
   textoLocal(o.plataformaNombre)&&textoLocal(o.categoria)&&urlHttps(o.url)&&
   fechaLocalValida(o.verificadaEl)&&imagenOfertaLocal(o)&&
   (!o.catalogo||['actual','no_verificable','fuentes_en_conflicto'].includes(o.estadoRevision));
}
function estadoVigenciaLocal(o,ahora=new Date()){
 if(o.coleccion!=null&&o.coleccion!=='principales')return {clase:'caducado',texto:o.coleccion==='en_camino'?'anuncio documentado · apertura no confirmada':'referencia documental · liquidez no confirmada'};
 if(o.estadoRevision==='no_verificable')return {clase:'caducado',texto:'apertura no confirmada'};
 if(o.estadoRevision==='fuentes_en_conflicto')return {clase:'caducado',texto:'fuentes en conflicto'};
 const base=Date.parse(o.verificadaEl+'T00:00:00Z'),ttl=Number(o.vigenciaDias);
 if(!fechaLocalValida(o.verificadaEl)||!Number.isFinite(base)||new Date(base).toISOString().slice(0,10)!==o.verificadaEl||
    !Number.isInteger(ttl)||ttl<1||!Number.isFinite(new Date(base+ttl*86400000).getTime())||!Number.isFinite(ahora.getTime())||
    (o.estadoRevision!=null&&o.estadoRevision!=='actual'))return {clase:'caducado',texto:'vigencia sin definir'};
 const hoyUTC=Date.UTC(ahora.getUTCFullYear(),ahora.getUTCMonth(),ahora.getUTCDate());
 if(base>hoyUTC)return {clase:'caducado',texto:'revisión futura no válida'};
 const resta=Math.floor((base+ttl*86400000-hoyUTC)/86400000);
 if(resta<0)return {clase:'caducado',texto:'cifras por actualizar'};
 if(o.permanente)return {clase:'permanente',texto:resta===0?'revisar hoy':'vigente '+resta+' d'};
 return {clase:'vigente',texto:resta===0?'revisar hoy':resta===1?'vigente 1 d':'vigente '+resta+' d'};
}
// La documentación tiene su propia fecha: no amplía el TTL de una cifra ni
// confirma apertura. Mantener la semántica de validarDocumentacionOferta del
// contrato compartido; las pruebas comparan ambos validadores sin añadir un bundle.
function documentacionOfertaLocal(o,ahora=new Date()){
 const d=o&&o.documentacion,hoy=Number.isFinite(ahora.getTime())?ahora.toISOString().slice(0,10):'';
 const texto=(v,min=1,max=Infinity)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
 const fuente=v=>{try{const u=new URL(v);return typeof v==='string'&&u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
 const fecha=v=>fechaLocalValida(v)&&v<=hoy;
 if(!hoy)return null;
 if(d==null){
  if(!fecha(o&&o.verificadaEl)||!Array.isArray(o&&o.fuentesActuales)||!o.fuentesActuales.length||!o.fuentesActuales.every(fuente))return null;
  return {revisadaEl:o.verificadaEl,descripcion:'',fuentes:[...new Set(o.fuentesActuales)],caracteristicas:[],referencias:[]};
 }
 if(typeof d!=='object'||Array.isArray(d)||!fecha(d.revisadaEl)||!texto(d.descripcion,20,6000)||
    !Array.isArray(d.fuentes)||!d.fuentes.length||!d.fuentes.every(fuente)||new Set(d.fuentes).size!==d.fuentes.length||
    !Array.isArray(d.caracteristicas)||!d.caracteristicas.length||!d.caracteristicas.every(c=>texto(c&&c.etiqueta,1,180)&&texto(c&&c.valor,1,3000))||
    !Array.isArray(d.referencias)||!d.referencias.every(r=>r&&texto(r.etiqueta,1,180)&&texto(r.valor,1,3000)&&texto(r.alcance,12,3000)&&
      fecha(r.fechaConsulta)&&r.fechaConsulta<=d.revisadaEl&&(r.fechaDato===null||(fecha(r.fechaDato)&&r.fechaDato<=r.fechaConsulta))&&
      fuente(r.fuente)&&d.fuentes.includes(r.fuente)))return null;
 return d;
}
function documentacionOfertaHtml(d){
 if(!d)return '';
 const fecha=v=>escHtml(fechaES(v));
 const ficha=d.descripcion?'<section class="escaparate-dialogo-seccion"><h3>Ficha documentada · '+fecha(d.revisadaEl)+'</h3>'+
  '<p class="escaparate-dialogo-resumen">'+escHtml(d.descripcion)+'</p><dl class="escaparate-documentacion-caracteristicas">'+
  d.caracteristicas.map(c=>'<div><dt>'+escHtml(c.etiqueta)+'</dt><dd>'+escHtml(c.valor)+'</dd></div>').join('')+'</dl></section>':'';
 const referencias=d.referencias.length?'<section class="escaparate-dialogo-seccion"><h3>Referencias fechadas</h3>'+
  '<p class="escaparate-documentacion-aviso">Datos publicados en las fechas indicadas. No son precios actuales ni garantizan rentabilidad, apertura o disponibilidad para contratar.</p>'+
  '<div class="escaparate-referencias-fechadas">'+d.referencias.map(r=>'<article><h4>'+escHtml(r.etiqueta)+'</h4><p><b>'+escHtml(r.valor)+'</b></p>'+
    '<p>Fecha del dato: '+(r.fechaDato?fecha(r.fechaDato):'no indicada en la fuente')+' · Consultado el '+fecha(r.fechaConsulta)+'</p>'+
    '<p>'+escHtml(r.alcance)+'</p><a href="'+escHtml(r.fuente)+'" target="_blank" rel="noopener nofollow" aria-label="'+escHtml('Fuente de '+r.etiqueta)+'">Fuente: '+escHtml(r.fuente)+' ↗</a></article>').join('')+'</div></section>':'';
 return ficha+referencias+'<section class="escaparate-dialogo-seccion"><h3>Fuentes documentales · '+fecha(d.revisadaEl)+'</h3><ul class="escaparate-fuentes-documentales">'+
  d.fuentes.map(u=>'<li><a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow">'+escHtml(u)+' ↗</a></li>').join('')+'</ul></section>';
}
function etiquetaMetricaLocal(valor,indice){
 const v=normalizaBuscaLocal(valor);
 if(/meses|sin plazo|perpetuo|emision primaria|en euros/.test(v))return 'Estructura';
 if(/reparto|vencimiento|acumulacion|retirada/.test(v))return 'Cobro / salida';
 if(/^desde /.test(v))return 'Entrada';
 if(/tvl| en el fondo/.test(v))return 'Tamaño';
 if(/financiad|colocado/.test(v))return 'Financiación';
 if(/pagas |prima|descuento/.test(v))return 'Precio relativo';
 if(/cruce|operacion/.test(v))return 'Actividad';
 if(/inquilino|contrato/.test(v))return 'Contrato';
 if(/tasador|valoracion/.test(v))return 'Valoración';
 if(/colateral/.test(v))return 'Garantía / uso';
 return 'Detalle '+(indice+1);
}
const pulirMetricaLocal=v=>String(v).replace(/\bUltima\b/g,'Última').replace(/\bultima\b/g,'última')
 .replace(/\bUltimo\b/g,'Último').replace(/\bultimo\b/g,'último').replace(/\boperacion\b/g,'operación');
function metricasOfertaLocal(o){
 if(estadoVigenciaLocal(o).clase==='caducado')return [];
 const m=Array.isArray(o.metricas)?o.metricas:[];
 const limpias=m.map((x,i)=>typeof x==='string'?{etiqueta:etiquetaMetricaLocal(x,i),valor:pulirMetricaLocal(x)}:{
  etiqueta:pulirMetricaLocal(textoLocal(x&&x.etiqueta)||etiquetaMetricaLocal(valorLocal(x&&x.valor),i)),valor:pulirMetricaLocal(valorLocal(x&&x.valor))
 }).filter(x=>x.valor).slice(0,8);
 if(valorLocal(o.rentabilidad)&&!limpias.some(x=>/rent|apy|tir/i.test(x.etiqueta)))
  limpias.unshift({etiqueta:'Rentabilidad publicada',valor:valorLocal(o.rentabilidad)});
 if(valorLocal(o.precio)&&!limpias.some(x=>/precio|entrada|ticket/i.test(x.etiqueta)))
  limpias.push({etiqueta:'Precio / entrada',valor:valorLocal(o.precio)});
 return limpias.slice(0,8);
}
function avisosOfertaLocal(o){
 return (Array.isArray(o.avisos)?o.avisos:[]).filter(x=>typeof x==='string'||
  (x&&x.tono!=='ok'&&(!x.esAntiguedad||x.tono==='stop'))).map(x=>typeof x==='string'?x:textoLocal(x&&x.texto)).filter(Boolean);
}
function coincideBusquedaOfertaLocal(o){
 if(!emiBusquedaLocal)return true;
 const bolsa=[o.titulo,o.plataformaNombre,o.categoria,o.pais,estadoVigenciaLocal(o).clase==='caducado'?'':o.resumen,
  ...metricasOfertaLocal(o).flatMap(x=>[x.etiqueta,x.valor]),...avisosOfertaLocal(o)].join(' ');
 return normalizaBuscaLocal(bolsa).includes(normalizaBuscaLocal(emiBusquedaLocal));
}
function coincideOfertaLocal(o){
 const tipo=tipoOfertaLocal(o);
 return (emiTipoLocal==='todos'||tipo===emiTipoLocal)&&(!emiCat||o.categoria===emiCat)&&coincideBusquedaOfertaLocal(o);
}
function ordenarOfertasLocales(lista){
 const estado=o=>estadoVigenciaLocal(o).clase==='caducado'?1:0;
 const entrada=o=>{
  if(estado(o))return Infinity;
  const precio=numeroLocal(o&&o.precio,NaN);if(Number.isFinite(precio))return precio;
  const metrica=(Array.isArray(o&&o.metricas)?o.metricas:[]).map(x=>valorLocal(x&&x.valor!=null?x.valor:x))
   .find(x=>/^desde\s/i.test(x));
  return numeroLocal(metrica,Infinity);
 };
 const orden={
  cierra:(a,b)=>estado(a)-estado(b)||String(b.verificadaEl).localeCompare(String(a.verificadaEl)),
  rent:(a,b)=>(estado(b)?-Infinity:numeroLocal(b.rentabilidad,-Infinity))-(estado(a)?-Infinity:numeroLocal(a.rentabilidad,-Infinity)),
  min:(a,b)=>entrada(a)-entrada(b),
  az:(a,b)=>String(a.plataformaNombre||'').localeCompare(String(b.plataformaNombre||''),'es')||
   String(a.titulo||'').localeCompare(String(b.titulo||''),'es'),
 }[emiOrden]||(()=>0);
 return lista.slice().sort(orden);
}
function clavesOfertaLocal(o,secundario){
 if(o.coleccion==='secundario'||o.coleccion==='en_camino')return {
  destacado:{etiqueta:'Referencia documental',valor:'Consultar fuente'},auxiliares:[]};
 if(estadoVigenciaLocal(o).clase==='caducado')return {
  destacado:{etiqueta:'Condiciones actuales',valor:'Consultar emisor'},auxiliares:[]};
 const tipo=tipoOfertaLocal(o),rentabilidad=valorLocal(o.rentabilidad),precio=valorLocal(o.precio);
 const destacado=secundario
  ? {etiqueta:'Precio observado',valor:precio||'Consultar mercado'}
  : tipo==='valor'
   ? {etiqueta:'Precio de referencia',valor:precio||'Consultar fuente'}
   : {etiqueta:'Rentabilidad publicada',valor:rentabilidad||'No publicada'};
 const metricas=metricasOfertaLocal(o).filter(x=>
  !/rentabilidad publicada|precio \/ entrada/i.test(normalizaBuscaLocal(x.etiqueta)));
 const preferidas=[];
 const literalRentabilidad=textoLocal(o&&o.rentabilidad&&o.rentabilidad.literal);
 const unidadPrecio=textoLocal(o&&o.precio&&o.precio.unidad);
 const patrones=secundario
  ? [/rent|apy|tir/i,/ultima operacion|actividad/i,/profundidad|liquidez/i]
  : tipo==='rendimiento'
   ? [/entrada|ticket/i,/estructura|plazo|cobro|salida/i,/actividad|liquidez|tamano/i]
   : [/inversion minima|entrada|ticket/i,/respaldo|representa|sector/i,/prima|descuento|liquidez/i];
 if(secundario&&rentabilidad)preferidas.push({etiqueta:'Rentabilidad ajustada',valor:rentabilidad});
 if(!secundario&&tipo==='rendimiento'&&literalRentabilidad)
  preferidas.push({etiqueta:'Método / ventana',valor:literalRentabilidad});
 if(!secundario&&tipo==='valor'&&unidadPrecio)
  preferidas.push({etiqueta:'Unidad / referencia',valor:unidadPrecio});
 patrones.forEach(p=>{const m=metricas.find(x=>p.test(normalizaBuscaLocal(x.etiqueta))&&!preferidas.includes(x));if(m)preferidas.push(m)});
 metricas.forEach(x=>{if(!preferidas.includes(x))preferidas.push(x)});
 return {destacado,auxiliares:preferidas.slice(0,2)};
}
function tarjetaOfertaLocal(o,{secundario=false}={}){
 const estado=estadoVigenciaLocal(o),tipo=tipoOfertaLocal(o),claves=clavesOfertaLocal(o,secundario);
 const documentacion=documentacionOfertaLocal(o);
 const referencia=estado.clase==='caducado'?'':textoLocal(tipo==='rendimiento'?o.rentabilidad&&o.rentabilidad.literal:o.precio&&o.precio.unidad);
 const avisos=avisosOfertaLocal(o),urlFicha=urlHttps(o.url),urlMercado=urlHttps(o.urlMercado);
  const url=secundario?(urlMercado||urlFicha):urlFicha,imagen=imagenOfertaLocal(o);
  const enlazable=o.estadoRevision==='actual'&&estado.clase!=='caducado';
  const textoEnlace=secundario&&urlMercado?'Abrir mercado':enlazable?'Ver oferta en '+o.plataformaNombre:'Consultar fuente';
 const cat=Object.hasOwn(CATMETA,o.categoria)?catClase({cat:o.categoria}):'';
 const disponibilidad=estado.clase==='caducado'?'Disponibilidad por confirmar':o.disponibleEs===true?'España declarada':o.disponibleEs===false?'No disponible en España':'Disponibilidad por confirmar';
 return '<article class="emi escaparate-oferta'+cat+(secundario?' escaparate-oferta-secundaria':'')+'">'+
  '<div class="escaparate-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+escHtml(imagen.alt)+'" loading="lazy" width="640" height="440">'+
   '<span class="escaparate-editorial" aria-hidden="true">'+escHtml(imagen.etiqueta)+'</span>'+
   '<span class="escaparate-tipo">'+escHtml(o.coleccion==='en_camino'?'En camino':o.coleccion==='secundario'||secundario?'Secundario':tipo==='valor'?'Valor':'Rendimiento')+'</span>'+
   '<span class="escaparate-estado '+estado.clase+'">'+escHtml(estado.texto)+'</span>'+
   '<span class="escaparate-destacado"><b>'+escHtml(claves.destacado.valor)+'</b><small>'+escHtml(claves.destacado.etiqueta)+'</small></span></div>'+
  '<div class="escaparate-cuerpo"><div class="emi-donde"><b>'+escHtml(o.plataformaNombre)+'</b><span>·</span>'+escHtml(o.categoria)+(o.pais?'<span>·</span>'+escHtml(o.pais):'')+'</div>'+
   '<h3 class="emi-tit">'+escHtml(o.titulo)+'</h3>'+
   (documentacion&&documentacion.descripcion?'<p class="catalogo-descripcion">'+escHtml(documentacion.descripcion)+'</p>':'')+
   '<span class="escaparate-disponibilidad">'+escHtml(disponibilidad)+'</span>'+
  (referencia?'<p class="escaparate-referencia">'+escHtml(referencia)+'</p>':'')+
  (claves.auxiliares.length?'<div class="escaparate-metricas">'+claves.auxiliares.map(x=>'<div class="escaparate-metrica"><b>'+escHtml(x.valor)+'</b><span>'+escHtml(x.etiqueta)+'</span></div>').join('')+'</div>':'')+
  (avisos.length?'<p class="escaparate-aviso-compacto"><b>Atención</b> · '+escHtml(avisos[0])+(avisos.length>1?' <span>+'+(avisos.length-1)+'</span>':'')+'</p>':'')+
  '<div class="emi-pie"><span class="emi-ver">'+(documentacion?'Referencia documentada · '+fechaES(documentacion.revisadaEl):'Datos revisados · '+fechaES(o.verificadaEl))+'</span><span class="escaparate-enlaces">'+
    '<button class="escaparate-detalle-boton" type="button" data-oferta-detalle="'+escHtml(o.slug)+'" aria-label="Ver detalles de '+escHtml(o.titulo)+' en '+escHtml(o.plataformaNombre)+'">Detalles</button>'+
    '<a class="emi-ir" href="'+escHtml(url)+'" target="_blank" rel="noopener nofollow'+(o.patrocinada?' sponsored':'')+'" aria-label="'+escHtml(textoEnlace+' · '+o.titulo+' · '+o.plataformaNombre)+'">'+escHtml(textoEnlace)+' ↗</a>'+
   (secundario&&urlMercado&&urlFicha&&urlFicha!==urlMercado?'<a class="emi-ir escaparate-ficha-oficial" href="'+escHtml(urlFicha)+'" target="_blank" rel="noopener nofollow" aria-label="Abrir ficha oficial de '+escHtml(o.titulo)+'">Ficha oficial ↗</a>':'')+
  '</span></div></div></article>';
}
function filaSecundariaLocal(o){
 const estado=estadoVigenciaLocal(o),imagen=imagenOfertaLocal(o),vigente=estado.clase!=='caducado';
 const precio=vigente?(valorLocal(o.precio)||'Consultar'):'Consultar emisor';
 const rentabilidad=vigente?(valorLocal(o.rentabilidad)||'No publicada'):'Consultar emisor';
 const ultima=metricasOfertaLocal(o).find(x=>/ultima operacion/i.test(normalizaBuscaLocal(x.etiqueta)));
 const urlMercado=urlHttps(o.urlMercado),urlFicha=urlHttps(o.url),url=urlMercado||urlFicha;
 return '<article class="escaparate-sec-fila"><div class="escaparate-sec-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+
  escHtml(imagen.alt)+'" loading="lazy" width="640" height="440"><span class="escaparate-editorial escaparate-editorial-compacta" aria-hidden="true">'+
  escHtml(imagen.etiqueta)+'</span></div><div class="escaparate-sec-contenido">'+
  '<div class="escaparate-sec-meta"><b>'+escHtml(o.plataformaNombre)+'</b><span class="escaparate-estado '+estado.clase+'">'+escHtml(estado.texto)+'</span></div>'+
  '<h4>'+escHtml(o.titulo)+'</h4><div class="escaparate-sec-cifras"><span><b>'+escHtml(rentabilidad)+'</b><small>Rentabilidad ajustada</small></span>'+
  '<span><b>'+escHtml(precio)+'</b><small>Precio observado</small></span></div>'+
  '<div class="escaparate-sec-pie">'+(ultima?'<span>'+escHtml(ultima.valor)+'</span>':'<span>Sin última operación publicada</span>')+
  '<span class="escaparate-sec-enlaces"><button type="button" data-oferta-detalle="'+escHtml(o.slug)+'" aria-label="Ver detalles de '+escHtml(o.titulo)+' en '+escHtml(o.plataformaNombre)+'">Detalle</button><a href="'+escHtml(url)+'" target="_blank" rel="noopener nofollow" aria-label="Abrir mercado para '+escHtml(o.titulo)+'">Mercado ↗</a>'+
  (urlMercado&&urlFicha&&urlFicha!==urlMercado?'<a href="'+escHtml(urlFicha)+'" target="_blank" rel="noopener nofollow" aria-label="Abrir ficha oficial de '+escHtml(o.titulo)+'">Ficha</a>':'')+
  '</span></div></div></article>';
}
function ofertaDetalleLocalPorSlug(slug){
 const local=typeof MODO_LOCAL_SEGURO!=='undefined'&&MODO_LOCAL_SEGURO;
 if(local){
  if(!ESCAPARATE_LOCAL)return null;
  return [...ESCAPARATE_LOCAL.ofertas,...ESCAPARATE_LOCAL.secundario]
   .find(o=>textoLocal(o&&o.slug)===textoLocal(slug)&&ofertaLocalValida(o))||null;
 }
 if(typeof CATALOGO_EMBEBIDO_BLOQUEADO!=='undefined'&&CATALOGO_EMBEBIDO_BLOQUEADO)return null;
 const catalogo=typeof EMI!=='undefined'?EMI:[];
 if(!catalogo.length||!catalogo.every(o=>o&&o.catalogo===true&&ofertaLocalValida(o)))return null;
 return catalogo.find(o=>textoLocal(o.slug)===textoLocal(slug))||null;
}
function activarDetallesOfertas(){
 const seccion=document.getElementById('emisiones');
 if(seccion&&!seccion.dataset.detalleOfertaActivo){seccion.dataset.detalleOfertaActivo='1';seccion.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('[data-oferta-detalle]');if(b)abrirDetalleOfertaLocal(b.dataset.ofertaDetalle);
 })}
}
function dialogoOfertaLocal(){
 let d=document.getElementById('escaparateDetalleLocal');
 if(d)return d;
 d=document.createElement('dialog');
 d.id='escaparateDetalleLocal';d.className='escaparate-dialogo';
 d.setAttribute('aria-labelledby','escaparateDetalleTitulo');
 d.addEventListener('click',e=>{
  if(e.target===d||e.target.closest('[data-cerrar-detalle]'))d.close();
 });
 d.addEventListener('close',()=>document.body.classList.remove('detalle-local-abierto'));
 document.body.appendChild(d);return d;
}
function abrirDetalleOfertaLocal(slug){
 const o=ofertaDetalleLocalPorSlug(slug);
 if(!o){
  const anterior=document.getElementById('escaparateDetalleLocal');
  if(anterior){if(anterior.open)anterior.close();anterior.innerHTML='';anterior.removeAttribute('data-oferta-slug')}
  document.body.classList.remove('detalle-local-abierto');return;
 }
 const d=dialogoOfertaLocal(),secundario=tipoOfertaLocal(o)==='secundario';
 d.setAttribute('data-oferta-slug',o.slug);
 const estado=estadoVigenciaLocal(o),claves=clavesOfertaLocal(o,secundario);
 const documentacion=documentacionOfertaLocal(o);
 const metricas=metricasOfertaLocal(o),avisos=avisosOfertaLocal(o),imagen=imagenOfertaLocal(o);
 const urlFicha=urlHttps(o.url),urlMercado=urlHttps(o.urlMercado);
 const disponibilidad=estado.clase==='caducado'?'Disponibilidad para España por confirmar':o.disponibleEs===true?'Disponible para España según la fuente':
  o.disponibleEs===false?'No disponible en España según la fuente':'Disponibilidad para España por confirmar';
 const enlaces=(secundario&&urlMercado?'<a class="emi-ir" href="'+escHtml(urlMercado)+'" target="_blank" rel="noopener nofollow">Abrir mercado ↗</a>':'')+
  (urlFicha?'<a class="emi-ir" href="'+escHtml(urlFicha)+'" target="_blank" rel="noopener nofollow">'+
   escHtml(secundario?'Ficha oficial':'Consultar fuente')+' ↗</a>':'');
 d.innerHTML='<div class="escaparate-dialogo-marco"><header class="escaparate-dialogo-cab">'+
  '<div><span>'+(o.coleccion==='en_camino'?'En camino':o.coleccion==='secundario'||secundario?'Mercado secundario':'Oferta principal')+'</span><h2 id="escaparateDetalleTitulo">'+escHtml(o.titulo)+'</h2></div>'+
  '<button type="button" data-cerrar-detalle aria-label="Cerrar detalle">×</button></header>'+
  '<div class="escaparate-dialogo-cuerpo"><div class="escaparate-dialogo-imagen"><img src="'+escHtml(imagen.src)+'" alt="'+
   escHtml(imagen.alt)+'" width="960" height="540"><span class="escaparate-editorial" aria-hidden="true">'+escHtml(imagen.etiqueta)+'</span>'+
   '<span class="escaparate-estado '+estado.clase+'">'+escHtml(estado.texto)+'</span></div>'+
  '<div class="escaparate-dialogo-identidad"><div><b>'+escHtml(o.plataformaNombre)+'</b><span>'+escHtml(o.categoria)+
   (o.pais?' · '+escHtml(o.pais):'')+'</span></div><div class="escaparate-dialogo-dato"><b>'+escHtml(claves.destacado.valor)+
   '</b><span>'+escHtml(claves.destacado.etiqueta)+'</span></div></div>'+
  (o.resumen&&estado.clase!=='caducado'?'<p class="escaparate-dialogo-resumen">'+escHtml(o.resumen)+'</p>':'')+
  '<div class="escaparate-dialogo-contexto"><span>'+escHtml(disponibilidad)+'</span><span>'+escHtml(documentacion?'Referencia documentada · '+fechaES(documentacion.revisadaEl):'Datos revisados · '+fechaES(o.verificadaEl))+'</span></div>'+
  documentacionOfertaHtml(documentacion)+
  (metricas.length?'<section class="escaparate-dialogo-seccion"><h3>Datos publicados</h3><div class="escaparate-dialogo-metricas">'+
   metricas.map(x=>'<div><b>'+escHtml(x.valor)+'</b><span>'+escHtml(x.etiqueta)+'</span></div>').join('')+'</div></section>':'')+
  (avisos.length?'<section class="escaparate-dialogo-seccion"><h3>Qué conviene revisar</h3><ul class="escaparate-dialogo-avisos">'+
   avisos.map(x=>'<li>'+escHtml(x)+'</li>').join('')+'</ul></section>':'')+
  '<footer class="escaparate-dialogo-pie"><p>Información editorial. Confirma las condiciones actuales con el emisor. RWAdar no recibe ni custodia tu inversión.</p><div>'+enlaces+'</div></footer>'+
  '</div></div>';
 if(d.open)d.close();
 if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
 document.body.classList.add('detalle-local-abierto');
 const cerrar=d.querySelector('[data-cerrar-detalle]');if(cerrar)cerrar.focus();
}
function refrescarDetalleOfertaAbierto(){
 const detalle=document.getElementById('escaparateDetalleLocal');
 if(detalle&&detalle.open)abrirDetalleOfertaLocal(detalle.getAttribute('data-oferta-slug'));
}
function pintarEscaparateLocal(){
 const caja=document.getElementById('emiLista');if(!caja||!ESCAPARATE_LOCAL)return;
 const ofertas=ordenarOfertasLocales(ESCAPARATE_LOCAL.ofertas.filter(ofertaLocalValida).filter(coincideOfertaLocal));
 const sec=ESCAPARATE_LOCAL.secundario.filter(ofertaLocalValida).filter(coincideBusquedaOfertaLocal);
 const seccion=document.getElementById('emisiones');if(seccion)seccion.classList.remove('sin-emisiones');
 caja.innerHTML=ofertas.length?ofertas.map(o=>tarjetaOfertaLocal(o)).join(''):
  '<div class="emis-vacio"><h3>'+escHtml(sec.length&&emiBusquedaLocal?'Sin coincidencias en la selección principal':'Ninguna oferta coincide')+'</h3><p>'+
  (sec.length&&emiBusquedaLocal?'Hay '+sec.length+' coincidencia'+(sec.length===1?'':'s')+' en mercado secundario, justo debajo.':'Cambia la búsqueda o los filtros para volver a ver el escaparate.')+'</p></div>';
 const estado=document.getElementById('movilOfertasEstado');
 if(estado){estado.textContent=ofertas.length+' de '+ESCAPARATE_LOCAL.ofertas.length;estado.classList.toggle('hay-ofertas',ofertas.length>0)}
 const listaSec=document.getElementById('escaparateSecundarioLista');
 if(listaSec)listaSec.innerHTML=sec.length?sec.map(filaSecundariaLocal).join(''):
  '<div class="emis-vacio"><h3>Sin coincidencias en secundario</h3><p>Prueba con otro término de búsqueda.</p></div>';
 const cuentaSec=document.getElementById('escaparateSecundarioCuenta');if(cuentaSec)cuentaSec.textContent=sec.length+' de '+ESCAPARATE_LOCAL.secundario.length;
 const panelSec=document.getElementById('escaparateSecundario');if(panelSec&&emiBusquedaLocal&&sec.length)panelSec.open=true;
}
function pintarTiposOfertaLocal(){
 const caja=document.getElementById('emiTipoFiltros');if(!caja||!ESCAPARATE_LOCAL)return;
 const cuenta=t=>ESCAPARATE_LOCAL.ofertas.filter(o=>tipoOfertaLocal(o)===t).length;
 caja.innerHTML=[['todos','Todas',ESCAPARATE_LOCAL.ofertas.length],['rendimiento','Rendimiento',cuenta('rendimiento')],['valor','Revalorización',cuenta('valor')]]
  .map(x=>'<button class="f'+(emiTipoLocal===x[0]?' on':'')+'" data-emi-tipo="'+x[0]+'" aria-pressed="'+(emiTipoLocal===x[0])+'">'+x[1]+' <small>'+x[2]+'</small></button>').join('');
}
function pintarExclusionesLocales(){
 const caja=document.getElementById('escaparateExclusionesLista');if(!caja||!ESCAPARATE_LOCAL)return;
 caja.innerHTML=ESCAPARATE_LOCAL.exclusionesOfertas.map(x=>{
  const u=urlHttps(x.urlFuente);
  return '<article class="escaparate-exclusion"><b>'+escHtml(x.nombre)+(x.alcance?' · '+escHtml(x.alcance):'')+'</b><p>'+escHtml(x.motivo)+(u?' <a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow">Fuente ↗</a>':'')+'</p></article>';
 }).join('');
 const n=document.getElementById('escaparateExclusionesCuenta');if(n)n.textContent=ESCAPARATE_LOCAL.exclusionesOfertas.length+' exclusiones';
}
function pintarFuenteLocal(){
 const caja=document.getElementById('escaparateFuente');if(!caja||!ESCAPARATE_LOCAL)return;
 const f=ESCAPARATE_LOCAL.fuente||{},u=urlHttps(f.url);
 caja.innerHTML='<b>Procedencia:</b> '+escHtml(f.titulo||'Escaparate RWAdar')+' · barrido '+escHtml(fechaES(f.barridoEl))+
  (u?' · <a href="'+escHtml(u)+'" target="_blank" rel="noopener nofollow">abrir artefacto original ↗</a>':'')+'<br>'+escHtml(f.aviso||'Instantánea interna; confirma cada dato en el origen.')+
  (f.uso?'<br><b>Uso:</b> '+escHtml(f.uso):'');
}
function activaControlesEscaparateLocal(){
 document.querySelectorAll('.solo-escaparate-local').forEach(x=>{x.hidden=false});
 const aviso=document.getElementById('escaparateLocalAviso');if(aviso)aviso.hidden=false;
 const busca=document.getElementById('emiBuscar');
 if(busca&&!busca.dataset.escaparateActivo){busca.dataset.escaparateActivo='1';busca.addEventListener('input',()=>{emiBusquedaLocal=busca.value.trim();pintarEmisiones()})}
 const tipos=document.getElementById('emiTipoFiltros');
 if(tipos&&!tipos.dataset.escaparateActivo){tipos.dataset.escaparateActivo='1';tipos.addEventListener('click',e=>{const b=e.target.closest('[data-emi-tipo]');if(!b)return;emiTipoLocal=b.dataset.emiTipo;pintarTiposOfertaLocal();pintarEmisiones()})}
 activarDetallesOfertas();
 const orden=document.getElementById('emiOrden');
 if(orden)orden.innerHTML='<option value="cierra">Frescura y revisión</option><option value="rent">Cifra de rentabilidad</option><option value="min">Entrada o precio</option><option value="az">Empresa y nombre</option>';
 const fechaOferta=ESCAPARATE_LOCAL&&ESCAPARATE_LOCAL.fuente&&ESCAPARATE_LOCAL.fuente.actualizacionLocal
  ?ESCAPARATE_LOCAL.fuente.actualizacionLocal.verificadoEl:'';
 const tit=document.getElementById('emiTitulo');if(tit)tit.textContent='Ofertas observadas'+
  (fechaLocalValida(fechaOferta)?' · revisión '+fechaES(fechaOferta):'');
 const bajada=document.getElementById('emiBajada');if(bajada)bajada.textContent='28 fichas principales con imagen, cifra clave y vigencia editorial. Las referencias de mercado secundario se consultan en su bloque independiente.';
 const mt=document.getElementById('movilOfertasTitulo');if(mt)mt.textContent='Escaparate interno';
 const mb=document.getElementById('movilOfertasBajada');if(mb)mb.textContent='Copia local, sin conexión a producción.';
}

/* ---- descartadas ---- */
function pintarDescartadas(){
 document.getElementById('outlist').innerHTML=FUERA.map(f=>{
  const src=(Array.isArray(f.fuentes)?f.fuentes:[]).map(s=>{const u=urlHttps(s&&s.url);
   return u?`<a href="${escHtml(u)}" target="_blank" rel="noopener nofollow">${escHtml(s&&s.titulo)}</a>`:''}).join('');
  return `<div class="fila"><div class="fn">${escHtml(f.n)} <span class="sello">${escHtml(f.badge)}</span></div>
   <div><p class="por">${escHtml(f.why)}</p>${src?`<div class="fuentes"><span class="fuentes-t">Comprobado en</span>${src}</div>`:''}</div></div>`;
 }).join('');
}
pintarDescartadas();

/* ---- CSV ---- */
function downloadCSV(){
 const h=['Estado','Nombre','Categoria','Tipo','Region','Cadenas','Entrada','Acceso','Web','Descripcion','Por que','Fuentes'];
 const inR=P.map(p=>{const v=p.verificacionLocal;return ['En el radar',p.n,p.cat,p.tipo,p.reg,p.cadenas,p.ticket,
  accesoVisible(p),p.web,v?v.estadoOperativo.detalle:p.nota,v?v.licenciaRegistro.detalle:p.aval,
  v?[...new Set(['estadoOperativo','licenciaRegistro','acceso'].flatMap(c=>(v[c].fuentes||[]).map(f=>urlHttps(f.url))).filter(Boolean))].join(' | '):''];});
 const outR=FUERA.map(f=>['Descartada',f.n,'','','','','','','','',f.badge+': '+f.why,
   (f.fuentes||[]).map(s=>s.url).join(' | ')]);
 const celda=v=>{let s=String(v==null?'':v);if(/^[\t\r\n ]*[=+\-@]/.test(s))s="'"+s;
   return `"${s.replace(/"/g,'""')}"`};
 const rows=[...inR,...outR].map(r=>r.map(celda).join(','));
 /* El ﻿ de delante hace que Excel en español lea los acentos bien. */
 const blob=new Blob(['﻿'+[h.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
 const u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download='rwadar.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
}

/* =================================================================
   SONIDO DE INTERFAZ
   -----------------------------------------------------------------
   Sintetizado localmente con Web Audio, sin descargar ficheros ni hacer
   peticiones de red. Usa dos parciales suaves, un ataque de 5 ms y un
   paso bajo para evitar el antiguo efecto metálico de «gota». No incluye
   ruido, paneo aleatorio, reverberación ni barridos largos. Empieza
   apagado, solo responde a acciones deliberadas y el avance automático
   de la lección 3D permanece siempre silencioso.
   ================================================================= */
/* En navegación privada o dentro de un iframe restringido, tocar
   localStorage lanza excepción. Se accede siempre protegido. */
const recuerda={
 leer(k){try{return localStorage.getItem(k)}catch{return null}},
 guardar(k,v){try{localStorage.setItem(k,v)}catch{}}
};

const Sonido=(()=>{
 let ctx=null, maestro=null, seco=null;
 /* Opt-in real: una instalación nueva empieza en silencio. */
 let on=recuerda.leer('rwadar.sonido')==='1';
 let despierto=false;    /* ¿ha habido ya un gesto del usuario? */

 const dar=()=>{
  if(ctx&&ctx.state==='closed'){ctx=null;maestro=null;seco=null;}
  if(!ctx){
   const A=window.AudioContext||window.webkitAudioContext; if(!A) return null;
   try{ ctx=new A(); }catch(e){ return null; }
   maestro=ctx.createGain(); maestro.gain.value=.45;

   /* Un paso bajo en la salida general. Es la diferencia entre "sonido de
      interfaz" y "sonido de aviso de electrodoméstico": por encima de 7
      kHz no hay nada que aporte, y sí mucho que moleste. */
   const suave=ctx.createBiquadFilter();
   suave.type='lowpass'; suave.frequency.value=2800; suave.Q.value=0.7;

   /* NO un DynamicsCompressor: tiene detector de envolvente y un sonido
      de interfaz dura milisegundos. Medido en este mismo grafo, aplastaba
      un transitorio de 0,30 hasta 0,074. Un recortador instantáneo hace
      lo que hacía falta: por debajo de 0,6 es una recta y no toca nada. */
   const tope=ctx.createWaveShaper();
   const PTOS=2048, curva=new Float32Array(PTOS), CODO=0.6;
   for(let i=0;i<PTOS;i++){
    const x=i*2/(PTOS-1)-1, a=Math.abs(x);
    curva[i]=a<=CODO ? x : Math.sign(x)*(CODO+(1-CODO)*Math.tanh((a-CODO)/(1-CODO)));
   }
   tope.curve=curva; tope.oversample='2x';

   maestro.connect(suave); suave.connect(tope); tope.connect(ctx.destination);

   seco=ctx.createGain(); seco.gain.value=1; seco.connect(maestro);
  }
  if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  return ctx;
 };

 const salida=c=>{
  const g=c.createGain(); g.gain.value=1;
  g.connect(seco);
  return g;
 };

 /* Pulso cálido: dos parciales fijos, sin ruido, paneo, azar ni barridos
    de varias octavas. La entrada de 5 ms evita el clic digital y todo el
    gesto termina antes de que compita con la lectura. */
 let ultimoTic=0;
 function pulsoCalido(o){
  if(!on||!despierto||(typeof document!=='undefined'&&document.hidden))return;
  const c=dar();if(!c)return;o=o||{};
  const f=o.f||247,f2=o.f2||f,dur=o.dur||.065,vol=o.vol||.07;
  const t=c.currentTime+(o.retraso||0)+.004,out=salida(c);
  const osc=c.createOscillator(),g=c.createGain();osc.type='sine';
  osc.frequency.setValueAtTime(f,t);osc.frequency.linearRampToValueAtTime(f2,t+Math.min(.03,dur*.45));
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.005);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  osc.connect(g);g.connect(out);osc.start(t);osc.stop(t+dur+.012);
  const arm=c.createOscillator(),ga=c.createGain();arm.type='triangle';
  arm.frequency.setValueAtTime(f*1.5,t);ga.gain.setValueAtTime(.0001,t);
  ga.gain.linearRampToValueAtTime(vol*.13,t+.006);ga.gain.exponentialRampToValueAtTime(.0001,t+dur*.72);
  arm.connect(ga);ga.connect(out);arm.start(t);arm.stop(t+dur+.012);
 }

 return {
  get activo(){return on},
  set activo(v){
   if(!v){pulsoCalido({f:294,f2:277,dur:.07,vol:.06});on=false;}
   else{on=true;despierto=true;dar();pulsoCalido({f:262,f2:277,dur:.085,vol:.07});}
   recuerda.guardar('rwadar.sonido',v?'1':'0');
  },
  despertar(){ despierto=true; },
  get listo(){ return despierto; },

  /* El golpecito en el dedo.
     En un móvil Android, ocho milisegundos de vibración al pulsar hacen
     por la sensación de respuesta más que cualquier animación. iOS no lo
     permite desde el navegador, así que allí simplemente no ocurre.
     Va atado al mismo interruptor que el sonido para que haya un único
     mando: quien apaga el sonido no quiere que el móvil le conteste. */
  toca(ms){
   if(!on) return;
   try{ if(navigator.vibrate) navigator.vibrate(ms||8); }catch(e){}
  },

  /* Pulsaciones muy breves y próximas entre sí: informan sin convertirse
     en una melodía ni competir con el contenido. */
  toque : ()=>pulsoCalido({f:220,f2:210,dur:.045,vol:.055}),
  /* el tic del deslizador: lo más pequeño que puede sonar sin desaparecer */
  tic   : ()=>{const ahora=performance.now();if(ahora-ultimoTic<45)return;ultimoTic=ahora;pulsoCalido({f:270,dur:.022,vol:.035});},
  filtro: ()=>pulsoCalido({f:294,f2:311,dur:.05,vol:.05}),
  /* Abrir y cerrar se distinguen con movimientos pequeños, nunca con un
     barrido de varias octavas. */
  abrir : ()=>pulsoCalido({f:262,f2:277,dur:.085,vol:.075}),
  /* Cerrar no es un tobogán. La primera versión caía una octava y media
     de golpe y sonaba a decepción, a "se ha estropeado". Cerrar un panel
     no es un fracaso: es dejar algo bien puesto. Así que apenas baja un
     tono, dura poco y tiene cuerpo — el ruido de una tapa que asienta. */
  cerrar: ()=>pulsoCalido({f:330,f2:294,dur:.065,vol:.06}),
  /* Dos pulsos suaves distinguen cambios de selección y descargas. */
  marcar: ()=>{pulsoCalido({f:392,dur:.05,vol:.06});pulsoCalido({f:523,dur:.06,vol:.055,retraso:.038});},
  desmarcar:()=>{pulsoCalido({f:523,dur:.045,vol:.05});pulsoCalido({f:392,dur:.055,vol:.045,retraso:.038});},
  descarga:()=>{pulsoCalido({f:330,dur:.06,vol:.06});pulsoCalido({f:494,dur:.095,vol:.055,retraso:.045});},

  /* Los filtros comparten una única firma sonora para no crear ruido. */
  categoria:()=>pulsoCalido({f:294,f2:311,dur:.05,vol:.05}),

  /* La lección 3D solo responde a un paso elegido manualmente. El avance
     automático nunca reproduce audio. */
  paso(i){
   if(!on||!despierto) return;
   const pasos=[220,233,247,262];
   pulsoCalido({f:pasos[i%4],dur:.055,vol:.045});
  }
 };
})();

(function interruptorSonido(){
 const b=document.getElementById('snd'); if(!b) return;
 const pinta=()=>b.setAttribute('aria-pressed',Sonido.activo?'true':'false');
 pinta();
 b.addEventListener('click',()=>{Sonido.despertar();Sonido.activo=!Sonido.activo; pinta();});
})();

/* Pointerdown se reserva para la respuesta táctil. Los sonidos viven en
   click para que ratón, tacto, Enter, Espacio y lector de pantalla reciban
   exactamente el mismo cue y nunca dos. */
document.addEventListener('pointerdown',ev=>{
 Sonido.despertar();
 const t=ev.target;
 /* la vibración va con cualquier control, incluido el interruptor de
    sonido: es la respuesta física al dedo, no un aviso */
 if(t.closest('button,.blip,input[type=range],select,a')) Sonido.toca(8);
});
document.addEventListener('click',ev=>{
 Sonido.despertar();
 const t=ev.target;
 if(t.closest('#snd')||t.closest('.paso'))return;
 const marca=t.closest('.cmp');
 if(marca) return marca.classList.contains('on')?Sonido.desmarcar():Sonido.marcar();
 if(t.closest('.abrir,.mm,.movil-ficha-abrir,.empresa-visual__abrir'))return Sonido.abrir();
 const conCat=t.closest('[data-cat]');
 if(conCat && CATMETA[conCat.dataset.cat]) return Sonido.categoria();
 if(t.closest('.cerrar')||t.id==='ovl')      return Sonido.cerrar();
 if(t.closest('.csv'))                       return Sonido.descarga();
 if(t.closest('.f,.paso,.btn-p,.btn-s,.hdr-cta,.limpiar,.vista button,.cmpbar .go,.cmpbar .x'))
   return Sonido.toque();
});
document.addEventListener('keydown',()=>{Sonido.despertar();});

/* =================================================================
   REVELADO Y CONTADORES
   -----------------------------------------------------------------
   El estado inicial (invisible) lo aplica JavaScript mediante la clase
   .anim en <html>. Sin JavaScript no hay nada oculto, que es lo que
   protege el pre-renderizado frente al robot de Google.
   ================================================================= */
let observador=null, redSeguridad=null;
const revelar=el=>{el.classList.add('rev','dentro')};

/* Red de seguridad: una animación de entrada nunca puede dejar contenido
   invisible. Si el observador no llega a ejecutarse —pestaña en segundo
   plano, navegador raro, error nuestro— a los dos segundos se muestra todo. */
function todoVisible(){
 document.querySelectorAll('.rev:not(.dentro)').forEach(el=>el.classList.add('dentro'));
}

let yaPulido=false;
function pulir(){
 /* La entrada escalonada es un saludo, no un tic: se hace una sola vez.
    Repetirla en cada filtro cansaría y retrasaría la respuesta, que es
    justo lo contrario de lo que se busca. */
 if(yaPulido) return;
 yaPulido=true;
 if(menos||!('IntersectionObserver' in window)){todoVisible();return}
 document.documentElement.classList.add('anim');
 if(!observador){
   observador=new IntersectionObserver(entradas=>{
     entradas.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('dentro'); observador.unobserve(e.target); }});
   },{threshold:.06,rootMargin:'0px 0px -40px 0px'});
 }
 const alto=window.innerHeight||800;
 document.querySelectorAll('.ficha,.fila,.criterio,.marcador li,.ventaja').forEach((el,i)=>{
   if(el.classList.contains('rev')) return;
   /* Lo que ya está a la vista se muestra sin esconderse primero: así no
      hay parpadeo al filtrar ni dependemos del observador para lo visible. */
   if(el.getBoundingClientRect().top < alto+120){ revelar(el); return; }
   const demora=Math.min(i,7);el.classList.add('rev');
   if(demora)el.classList.add('rev-d'+demora);
   observador.observe(el);
 });
 clearTimeout(redSeguridad);
 redSeguridad=setTimeout(todoVisible,2000);
}

function contarHasta(el,fin){
 if(!el) return;
 if(menos){el.textContent=fin;return}
 const t0=performance.now(),dur=1100;
 const tic=t=>{
   const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3);
   el.textContent=Math.round(fin*e);
   if(p<1) requestAnimationFrame(tic);
 };
 el.textContent='0';
 requestAnimationFrame(tic);
}

(function contadores(){
 const m=document.querySelector('.marcador'); if(!m) return;
 const cifras=[...m.querySelectorAll('.n')].map(el=>[el,parseInt(el.textContent,10)]);
 if(menos||!('IntersectionObserver' in window)) return;
 const io=new IntersectionObserver(es=>{
   if(es[0].isIntersecting){ cifras.forEach(([el,v])=>contarHasta(el,v)); io.disconnect(); }
 },{threshold:.4});
 io.observe(m);
})();

(function cabeceraElevada(){
 const h=document.querySelector('.hdr'); if(!h) return;
 let ultimo=null;
 const mirarScroll=()=>{
   const debe=window.scrollY>8;
   if(debe!==ultimo){ h.classList.toggle('elevada',debe); ultimo=debe; }
 };
 addEventListener('scroll',mirarScroll,{passive:true});
 mirarScroll();
})();

/* =================================================================
   AL DÍA SIN VOLVER A PUBLICAR
   -----------------------------------------------------------------
   La página se sirve pre-renderizada: rápida, y el robot de Google la
   lee sin ejecutar nada. Pero ese HTML es una foto del momento en que
   se publicó. En cuanto carga, la página pregunta a la base de datos
   y, si el registro ha cambiado desde entonces, se actualiza sola.

   Resultado: el visitante nunca ve una versión vieja aunque nadie
   haya vuelto a publicar el sitio. Si la base no responde, no pasa
   nada: se queda la foto, que es contenido válido.
   ================================================================= */
const API='https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE_PUB='sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';

/* La huella incluye todos los campos visibles. La anterior omitía textos y
   fuentes, de modo que una corrección editorial podía no llegar al visitante. */
const huella=(a,b,e=[])=>JSON.stringify({
 p:a.map(x=>[x.slug,x.n,x.cat,x.tipo,x.reg,x.cadenas,x.ticket,x.acceso,x.web,x.aval,x.nota,x.ver,x.verificacionLocal,x.revisionId])
     .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 f:b.map(x=>[x.n,x.badge,x.why,(Array.isArray(x.fuentes)?x.fuentes:[]).map(s=>[s.url,s.titulo])])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 e:e.map(x=>x.catalogo?['catalogo',x]:[x.s,x.t,x.res,x.pl,x.plw,x.cat,x.ub,x.mon,x.min,x.obj,x.cap,x.pct,
       x.rent,x.plazo,x.tipo,x.cierra,x.abre,x.est,x.cont,x.esNo,x.vinc,x.rest,x.rentNo,x.url,x.ver,x.pat])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es'))
});

function textoDato(v,nombre,max){
 if(typeof v!=='string')throw new Error(nombre+' no es texto');
 const s=v.trim();if(!s||s.length>max)throw new Error(nombre+' no válido');return s;
}
function plataformaRemota(p){
 const x={n:textoDato(p.nombre,'nombre',120),cat:textoDato(p.categoria,'categoría',80),
  tipo:textoDato(p.actor,'actor',80),reg:textoDato(p.region,'región',100),
  cadenas:textoDato(p.cadenas,'cadenas',160),ticket:textoDato(p.ticket,'entrada',40),
  acceso:textoDato(p.acceso,'acceso',40),web:urlHttps(p.web),
  aval:textoDato(p.aval,'aval',2000),nota:textoDato(p.nota,'descripción',3000),
  ver:textoDato(p.verificada_el,'fecha',10)};
 if(!Object.prototype.hasOwnProperty.call(CATMETA,x.cat)||!ACCESOS.includes(x.acceso)||!TICKETS.includes(x.ticket)||
    !x.web||!/^\d{4}-\d{2}-\d{2}$/.test(x.ver))throw new Error('plataforma fuera del contrato público');
 return x;
}
function descarteRemoto(x){
 const fuentes=Array.isArray(x.fuentes)?x.fuentes.map(s=>{
  const url=urlHttps(s&&s.url),titulo=textoDato(s&&s.titulo,'título de fuente',300);
  if(!url)throw new Error('fuente sin HTTPS');return {url:url,titulo:titulo};
 }):[];
 return {n:textoDato(x.nombre,'nombre descartado',120),
  badge:textoDato(x.etiqueta_descarte,'etiqueta',100),
  why:textoDato(x.motivo_descarte,'motivo',3000),fuentes:fuentes};
}

const textoOpcional=(v,nombre,max)=>v==null?'':textoDato(v,nombre,max);
const numeroRemoto=(v,nombre,def=0)=>{if(v==null)return def;const n=Number(v);
 if(!Number.isFinite(n))throw new Error(nombre+' no es numérico');return n};
const booleanoOpcional=(v,nombre)=>{if(v==null)return null;
 if(typeof v!=='boolean')throw new Error(nombre+' no es booleano');return v};
function emisionRemota(e){
 const estado=textoDato(e.estado,'estado de emisión',30);
 if(!['abierta','programada','en_estudio'].includes(estado))throw new Error('estado de emisión no público');
 const x={
  s:textoDato(e.slug,'slug de emisión',140),t:textoDato(e.titulo,'título de emisión',240),
  res:textoOpcional(e.resumen,'resumen de emisión',3000),pl:textoDato(e.plataforma,'plataforma de emisión',120),
  plw:urlHttps(e.plataforma_web),cat:textoDato(e.categoria,'categoría de emisión',80),
  ub:textoOpcional(e.ubicacion,'ubicación de emisión',160),mon:textoDato(e.moneda,'moneda de emisión',12),
  min:numeroRemoto(e.ticket_minimo,'entrada mínima'),obj:numeroRemoto(e.objetivo,'objetivo'),
  cap:numeroRemoto(e.captado,'captado'),pct:numeroRemoto(e.porcentaje,'porcentaje'),
  rent:e.rentabilidad==null?null:numeroRemoto(e.rentabilidad,'rentabilidad'),
  plazo:e.plazo_meses==null?null:numeroRemoto(e.plazo_meses,'plazo'),
  tipo:textoOpcional(e.tipo_rendimiento,'tipo de rendimiento',100),
  cierra:textoOpcional(e.cierra_el,'cierre de emisión',10),abre:textoOpcional(e.abre_en,'apertura de emisión',40),
  est:estado,cont:e.continua===true,esNo:booleanoOpcional(e.disponible_es,'disponibilidad en España'),
  vinc:booleanoOpcional(e.vinculante,'carácter vinculante'),
  rest:textoOpcional(e.acceso_restringido,'restricción de acceso',300),
  rentNo:e.rentabilidad_no_publicada===true,url:urlHttps(e.url),
  ver:textoDato(e.verificada_el,'fecha de emisión',10),pat:e.patrocinada===true,
 };
 if(!Object.prototype.hasOwnProperty.call(CATMETA,x.cat)||!x.plw||!x.url||
    !/^\d{4}-\d{2}-\d{2}$/.test(x.ver)||
    (x.cierra&&!/^\d{4}-\d{2}-\d{2}$/.test(x.cierra))||
    [x.min,x.obj,x.cap,x.pct].some(n=>n<0)||x.min>1e12||x.obj>1e15||x.cap>1e15||x.pct>10000)
   throw new Error('emisión fuera del contrato público');
 return x;
}

const ESTADOS_VERIFICACION_LOCAL={
 estadoOperativo:new Set(['observada','no_verificable']),
 licenciaRegistro:new Set(['confirmada_regulador','confirmada_documento_producto',
  'no_aplica_plataforma','no_verificable','sin_registro_declarado']),
 acceso:new Set(['confirmado_condicionado','no_aplica_plataforma','no_verificable'])
};
const ETIQUETAS_VERIFICACION_LOCAL={
 observada:'Observada',no_verificable:'No verificable',
 confirmada_regulador:'Registro confirmado',
 confirmada_documento_producto:'Documento de producto',
 no_aplica_plataforma:'No aplica a la plataforma',
 sin_registro_declarado:'Sin registro declarado',
 confirmado_condicionado:'Acceso condicionado'
};
function etiquetaVerificacionLocal(estado){
 return ETIQUETAS_VERIFICACION_LOCAL[estado]||'No verificado';
}
function fuenteVerificacionLocal(fuente,fecha,contexto){
 const x={
  id:textoDato(fuente&&fuente.id,contexto+' id',120),
  tipo:textoDato(fuente&&fuente.tipo,contexto+' tipo',40),
  titulo:textoDato(fuente&&fuente.titulo,contexto+' título',300),
  url:urlHttps(fuente&&fuente.url),
  primaria:fuente&&fuente.primaria===true,
  consultadaEl:textoDato(fuente&&fuente.consultadaEl,contexto+' fecha',10)
 };
 if(!x.url||!x.primaria||x.consultadaEl!==fecha)throw new Error(contexto+' fuera del contrato local');
 return x;
}
function campoVerificacionLocal(campo,nombre,fecha){
 const estados=ESTADOS_VERIFICACION_LOCAL[nombre];
 if(!campo||!estados||!estados.has(campo.estado))throw new Error(nombre+' local fuera de contrato');
 const detalle=textoDato(campo.detalle,nombre+' detalle',3000);
 if(detalle.length<24||!Array.isArray(campo.fuentes)||!campo.fuentes.length)
  throw new Error(nombre+' local incompleto');
 return {estado:campo.estado,detalle,
  fuentes:campo.fuentes.map((fuente,indice)=>fuenteVerificacionLocal(
   fuente,fecha,nombre+' fuente '+indice))};
}
function validarVerificacionLocal(verificacion,fechaEsperada=FECHA_VERIFICACION_LOCAL){
 if(!verificacion||verificacion.verificadoEl!==fechaEsperada||
     verificacion.conservaFechaCanonica!==true)
  throw new Error('verificación local ausente, desactualizada o no conservadora');
 const x={
  verificadoEl:verificacion.verificadoEl,
  conservaFechaCanonica:true,
  estadoOperativo:campoVerificacionLocal(verificacion.estadoOperativo,'estadoOperativo',verificacion.verificadoEl),
  licenciaRegistro:campoVerificacionLocal(verificacion.licenciaRegistro,'licenciaRegistro',verificacion.verificadoEl),
  acceso:campoVerificacionLocal(verificacion.acceso,'acceso',verificacion.verificadoEl),
  alertasCriticas:[]
 };
 if(!Array.isArray(verificacion.alertasCriticas)||!verificacion.alertasCriticas.length)
  throw new Error('alertas críticas locales ausentes');
 x.alertasCriticas=verificacion.alertasCriticas.map((alerta,indice)=>{
  if(!alerta||!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(alerta.codigo||''))
   throw new Error('código de alerta local no válido');
  const detalle=textoDato(alerta.detalle,'alerta local',3000);
  if(detalle.length<24||!Array.isArray(alerta.fuentes)||!alerta.fuentes.length)
   throw new Error('alerta crítica local incompleta');
  return {codigo:alerta.codigo,detalle,
   fuentes:alerta.fuentes.map((fuente,j)=>fuenteVerificacionLocal(
    fuente,verificacion.verificadoEl,'alerta '+indice+' fuente '+j))};
 });
 return x;
}

function plataformaCatalogoRemota(p,fecha){
 const x=plataformaRemota(p);
 x.revisionId=textoDato(p.revision_id,'revisión de plataforma',36);
 x.slug=textoDato(p.slug,'slug de plataforma',140);
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug))throw new Error('slug de plataforma no válido');
 x.verificacionLocal=validarVerificacionLocal(p.verificacion_local,fecha);
 if(p.version_esquema===2)Object.assign(x,metadatosCatalogoV2(p));
 return x;
}

function cifraCatalogoRemota(valor,nombre){
 if(valor==null)return null;
 if(!valor||typeof valor!=='object'||Array.isArray(valor))throw new Error(nombre+' no es un objeto');
 const x={};
 for(const clave of ['mostrado','mostrada','literal','unidad']){
  if(valor[clave]!=null)x[clave]=textoDato(valor[clave],nombre+' '+clave,500);
 }
 if(!Object.keys(x).length)throw new Error(nombre+' vacío');
 return x;
}
function ofertaCatalogoRemota(e,fecha){
 if(e?.patrocinada!==false)throw new Error('patrocinio no habilitado en el catálogo editorial gratuito');
 const estado=textoDato(e.estado_revision,'estado de oferta',40);
 if(!['actual','no_verificable','fuentes_en_conflicto'].includes(estado))throw new Error('estado de oferta no público');
 const metricas=Array.isArray(e.metricas)?e.metricas.map((m,i)=>({
  etiqueta:textoDato(m&&m.etiqueta,'métrica '+i+' etiqueta',120),
  valor:textoDato(m&&m.valor,'métrica '+i+' valor',500)})):[];
 const avisos=Array.isArray(e.avisos)?e.avisos.map((a,i)=>{
  if(typeof a==='string')return textoDato(a,'aviso '+i,1000);
  return {texto:textoDato(a&&a.texto,'aviso '+i,1000),
   tono:a&&typeof a.tono==='string'?textoDato(a.tono,'tono '+i,30):'',
   esAntiguedad:a&&a.esAntiguedad===true,
   verificadaEl:a&&a.verificadaEl==null?e.verificada_el:textoDato(a.verificadaEl,'fecha de aviso',10)};
 }):[];
 const fuentes=Array.isArray(e.fuentes_actuales)?e.fuentes_actuales.map((u,i)=>{
  const url=urlHttps(u);if(!url)throw new Error('fuente de oferta '+i+' no HTTPS');return url;
 }):[];
 const vigencia=Number(e.vigencia_dias),disponible=booleanoOpcional(e.disponible_es,'disponibilidad en España');
 const eu=booleanoOpcional(e.eu,'ámbito UE'),puntuacion=e.puntuacion==null?null:numeroRemoto(e.puntuacion,'puntuación');
 const x={catalogo:true,revisionId:textoDato(e.revision_id,'revisión de oferta',36),slug:textoDato(e.slug,'slug de oferta',180),
  tipo:textoDato(e.tipo,'tipo de oferta',30),titulo:textoDato(e.titulo,'título de oferta',180),
  plataformaSlug:textoDato(e.plataforma_slug,'slug de proveedor',140),
  plataformaNombre:textoDato(e.plataforma_nombre,'proveedor',120),
  categoria:textoDato(e.categoria,'categoría de oferta',80),
  pais:e.pais==null?null:textoDato(e.pais,'país de oferta',100),
  resumen:textoDato(e.resumen,'resumen de oferta',3000),url:urlHttps(e.url),
  verificadaEl:textoDato(e.verificada_el,'fecha de oferta',10),vigenciaDias:vigencia,
  permanente:e.permanente===true,disponibleEs:disponible,eu:eu,
  fueraLadrillo:e.fuera_ladrillo===true,puntuacion:puntuacion,
  rentabilidad:cifraCatalogoRemota(e.rentabilidad,'rentabilidad'),
  precio:cifraCatalogoRemota(e.precio,'precio'),metricas:metricas,avisos:avisos,
  estadoRevision:estado,fuentesActuales:fuentes,patrocinada:e.patrocinada===true};
 const documentacion=e.documentacion==null?null:documentacionOfertaLocal({documentacion:e.documentacion});
 if(e.documentacion!=null&&!documentacion)throw new Error('documentación de oferta fuera del contrato público');
 x.documentacion=documentacion?{
  revisadaEl:documentacion.revisadaEl,descripcion:documentacion.descripcion,fuentes:[...documentacion.fuentes],
  caracteristicas:documentacion.caracteristicas.map(({etiqueta,valor})=>({etiqueta,valor})),
  referencias:documentacion.referencias.map(({etiqueta,valor,fechaDato,fechaConsulta,fuente,alcance})=>
   ({etiqueta,valor,fechaDato,fechaConsulta,fuente,alcance}))}:null;
 if(e.version_esquema===2){
  Object.assign(x,metadatosCatalogoV2(e));x.coleccion=e.coleccion;
  if(!['principales','secundario','en_camino'].includes(x.coleccion)||!['rendimiento','valor'].includes(x.tipo)||!x.documentacion||
    (x.coleccion!=='principales'&&(estado!=='no_verificable'||x.precio!==null||x.rentabilidad!==null||
     x.puntuacion!==null||x.disponibleEs!==null)))throw new Error('colección fuera del contrato documental');
 }
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug)||!x.url||!fechaOfertaPublicaValida(x.verificadaEl,fecha)||
    !Number.isInteger(vigencia)||vigencia<1||vigencia>7||!Object.hasOwn(CATMETA,x.categoria)||
    !metricas.length||!avisos.length||!fuentes.length||
    (estado!=='actual'&&(x.rentabilidad!==null||x.precio!==null)))
  throw new Error('oferta fuera del contrato público');
 return x;
}
function fechaOfertaPublicaValida(fecha,fechaRadar){
 return fechaLocalValida(fecha)&&fechaLocalValida(fechaRadar)&&
  fecha<=new Date().toISOString().slice(0,10)&&
  Date.parse(fecha+'T00:00:00Z')<=Date.parse(fechaRadar+'T00:00:00Z')+7*86400000;
}
function validarRevisionCatalogo(revisiones){
 const ids=new Set(revisiones);
 if(ids.size!==1||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test([...ids][0]||''))
  throw new Error('lote público con revisiones mezcladas o sin revision_id');
}
function validarLoteCatalogoRemoto(plataformas,ofertas){
 if(!Array.isArray(plataformas)||plataformas.length!==26||
    !Array.isArray(ofertas)||ofertas.length!==28)throw new Error('lote público incompleto');
 if(new Set(plataformas.map(p=>p.slug)).size!==26||new Set(ofertas.map(o=>o.slug)).size!==28)
  throw new Error('lote público con slugs duplicados');
 validarRevisionCatalogo([...plataformas,...ofertas].map(x=>x.revision_id));
 const fechas=new Set(plataformas.map(p=>p.verificacion_local&&p.verificacion_local.verificadoEl));
 if(fechas.size!==1)throw new Error('lote público con fechas mezcladas');
 const fecha=[...fechas][0];
 if(!fechaLocalValida(fecha))throw new Error('fecha de lote inválida');
 const base=Date.parse(fecha+'T00:00:00Z'),hoy=new Date(),hoyUTC=Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate());
 const edad=Math.floor((hoyUTC-base)/86400000);
 if(!Number.isFinite(base)||edad<0||edad>7)throw new Error('lote público futuro o caducado');
 if(!ofertas.every(o=>fechaOfertaPublicaValida(o.verificada_el,fecha)))throw new Error('fecha individual de oferta inválida');
 return fecha;
}

function metadatosCatalogoV2(fila){
 return {version_esquema:fila.version_esquema,plataformas_esperadas:fila.plataformas_esperadas,
  ofertas_esperadas:fila.ofertas_esperadas,colecciones_esperadas:{...fila.colecciones_esperadas},
  verificado_lote_el:fila.verificado_lote_el,vigencia_lote_dias:fila.vigencia_lote_dias};
}
function validarManifiestoCatalogoV2(plataformas,ofertas){
 // Manifiesto local de esta versión. Nunca deducir completitud del lote recibido.
 const esperadas={principales:24,secundario:21,en_camino:4};
 if(!Array.isArray(plataformas)||plataformas.length!==26||!Array.isArray(ofertas)||ofertas.length!==49||
    new Set(plataformas.map(p=>p.slug)).size!==26||new Set(ofertas.map(o=>o.slug)).size!==49)
  throw new Error('V2: lote incompleto o duplicado');
 const filas=[...plataformas,...ofertas],fecha=filas[0].verificado_lote_el,plazo=filas[0].vigencia_lote_dias;
 if(!fechaLocalValida(fecha)||!Number.isInteger(plazo)||plazo<1||plazo>7)
  throw new Error('V2: fecha o plazo del lote inválido');
 if(!filas.every(f=>f.version_esquema===2&&f.plataformas_esperadas===26&&f.ofertas_esperadas===49&&
    f.verificado_lote_el===fecha&&f.vigencia_lote_dias===plazo&&f.colecciones_esperadas&&
    !Array.isArray(f.colecciones_esperadas)&&Object.keys(f.colecciones_esperadas).length===3&&
    Object.keys(esperadas).every(c=>f.colecciones_esperadas[c]===esperadas[c])))
  throw new Error('V2: metadatos mezclados o ajenos al manifiesto');
 if(!Object.keys(esperadas).every(c=>ofertas.filter(o=>o.coleccion===c).length===esperadas[c]))
  throw new Error('V2: colección incompleta');
 const hoy=new Date(),edad=Math.floor((Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate())-
  Date.parse(fecha+'T00:00:00Z'))/86400000);
 if(!Number.isFinite(edad)||edad<0||edad>plazo)throw new Error('V2: lote futuro o caducado');
 return fecha;
}
function validarLoteCatalogoRemotoV2(plataformas,ofertas){
 const fecha=validarManifiestoCatalogoV2(plataformas,ofertas);
 validarRevisionCatalogo([...plataformas,...ofertas].map(x=>x.revision_id));
 plataformas.forEach(p=>validarVerificacionLocal(p.verificacion_local,fecha));
 ofertas.forEach(o=>ofertaCatalogoRemota(o,fecha));
 return fecha;
}

/* El pre-render es una caché, no una excepción a la vigencia. Si envejece
   mientras Supabase falla o devuelve cero filas, se elimina antes de pintar:
   nunca conservamos lotes antiguos por comodidad. */
function comprobarCatalogoEmbebido(){
 if(CATALOGO_EMBEBIDO_BLOQUEADO)return false;
 const catalogo=EMI.filter(e=>e&&e.catalogo===true);
 if(!catalogo.length)return true; /* fuente interna anterior, aún sin lote */
 try{
  if(EMI.length!==catalogo.length)throw new Error('lote embebido mezclado');
  const fecha=validarManifiestoCatalogoV2(P,catalogo);
  validarRevisionCatalogo([...P,...catalogo].map(x=>x.revisionId));
  const fechas=new Set(P.map(p=>p.verificacionLocal&&p.verificacionLocal.verificadoEl));
  if(fechas.size!==1)throw new Error('fechas embebidas mezcladas');
  if([...fechas][0]!==fecha)throw new Error('fecha de revisión distinta del manifiesto');
  const base=Date.parse(fecha+'T00:00:00Z'),hoy=new Date();
  const hoyUTC=Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate());
  const edad=Math.floor((hoyUTC-base)/86400000);
  if(!fechaLocalValida(fecha)||!Number.isFinite(base)||edad<0||edad>7)
   throw new Error('lote embebido futuro o caducado');
  P.forEach(p=>validarVerificacionLocal(p.verificacionLocal,fecha));
  if(!catalogo.every(o=>ofertaLocalValida(o)&&fechaOfertaPublicaValida(o.verificadaEl,fecha)&&
      Array.isArray(o.metricas)&&o.metricas.length&&Array.isArray(o.avisos)&&o.avisos.length&&
      Array.isArray(o.fuentesActuales)&&o.fuentesActuales.length&&o.fuentesActuales.every(urlHttps)&&
      documentacionOfertaLocal(o)&&o.documentacion&&
      (o.estadoRevision==='actual'||(o.rentabilidad==null&&o.precio==null))&&
      (o.coleccion==='principales'||(o.estadoRevision==='no_verificable'&&o.puntuacion==null&&o.disponibleEs==null))))
   throw new Error('oferta embebida fuera de contrato');
  return true;
 }catch(_){
  P.length=0;EMI.length=0;CATALOGO_EMBEBIDO_BLOQUEADO=true;
  return false;
 }
}

function plataformaDesdeEscaparate(p){
 const x={n:textoDato(p.nombre,'nombre local',120),cat:textoDato(p.categoria,'categoría local',80),
  tipo:textoDato(p.actor,'actor local',80),reg:textoDato(p.region,'región local',100),
  cadenas:textoDato(p.cadenas,'cadenas locales',160),ticket:textoDato(p.ticket,'entrada local',40),
  acceso:textoDato(p.acceso,'acceso local',40),web:urlHttps(p.web),
  aval:textoDato(p.aval,'aval local',2000),nota:textoDato(p.nota,'descripción local',3000),
  ver:textoDato(p.verificadaEl||p.verificada_el,'fecha local',10),
  slug:textoDato(p.slug,'slug local',140),
  verificacionLocal:validarVerificacionLocal(p.verificacionLocal)};
 if(!Object.hasOwn(CATMETA,x.cat)||!ACCESOS.includes(x.acceso)||!TICKETS.includes(x.ticket)||
    !x.web||!fechaLocalValida(x.ver))throw new Error('plataforma local fuera de contrato');
 return x;
}
function descarteDesdeEscaparate(x){
 const fuentes=(Array.isArray(x.fuentes)?x.fuentes:[]).map(s=>{
  const url=urlHttps(s&&s.url),titulo=textoDato(s&&s.titulo,'fuente local',300);
  if(!url)throw new Error('fuente local sin HTTPS');return {url,titulo};
 });
 return {n:textoDato(x.nombre||x.n,'nombre descartado local',120),
  badge:textoDato(x.etiqueta||x.etiquetaDescarte||x.etiqueta_descarte||x.badge,'etiqueta descartada local',100),
  why:textoDato(x.motivo||x.motivoDescarte||x.motivo_descarte||x.why,'motivo descartado local',3000),fuentes};
}
function validarEscaparateLocal(d){
 if(!d||d.versionEsquema!==1||!d.fuente||!urlHttps(d.fuente.url))throw new Error('cabecera local no válida');
 for(const [nombre,n] of [['plataformas',26],['descartes',4],['ofertas',28],['secundario',24],['exclusionesOfertas',15]]){
  if(!Array.isArray(d[nombre])||d[nombre].length!==n)throw new Error(nombre+' no contiene '+n+' elementos');
 }
 if(!d.ofertas.every(ofertaLocalValida)||!d.secundario.every(ofertaLocalValida))throw new Error('oferta local fuera de contrato');
 const plataformas=d.plataformas.map(plataformaDesdeEscaparate);
 if(new Set(plataformas.map(p=>p.slug)).size!==26)throw new Error('slug de plataforma local duplicado');
 const slugs=[...d.ofertas,...d.secundario].map(x=>x.slug);
 if(new Set(slugs).size!==slugs.length)throw new Error('slug local duplicado');
 if(!d.exclusionesOfertas.every(x=>textoLocal(x.nombre)&&textoLocal(x.motivo)&&urlHttps(x.urlFuente)))
  throw new Error('exclusión local fuera de contrato');
 return d;
}
function validarManifiestoEditorialLocal(m){
 if(!m||m.versionEsquema!==1||m.etiquetaVisibleObligatoria!=='Ilustración editorial'||
    !Array.isArray(m.archivos)||m.archivos.length!==4)
  throw new Error('manifiesto editorial local fuera de contrato');
 const categorias=new Set(),archivos=new Set(),porCategoria={};
 for(const x of m.archivos){
  if(!x||!Object.hasOwn(CATMETA,x.categoria)||categorias.has(x.categoria)||
     !/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(x.archivo||'')||archivos.has(x.archivo)||
     x.ancho!==640||x.alto!==440||!Number.isInteger(x.bytes)||x.bytes<=1024||
     !/^[a-f0-9]{64}$/.test(x.hashSha256||'')||
     !textoLocal(x.alt).startsWith(m.etiquetaVisibleObligatoria+' '))
   throw new Error('entrada editorial local fuera de contrato');
  categorias.add(x.categoria);archivos.add(x.archivo);porCategoria[x.categoria]=x;
 }
 return {etiqueta:m.etiquetaVisibleObligatoria,porCategoria};
}
async function cargarEscaparateLocal(){
 if(!MODO_LOCAL_SEGURO)return false;
 document.body.classList.add('modo-local-seguro');
 /* Cierra antes de esperar al fixture: si falta, está incompleto o tiene una
    fecha distinta, nunca se vuelve a la ficha canónica antigua como si fuese
    equivalente a la revisión local. */
 P.length=0;compare=[];render();
 document.getElementById('s1').textContent='0';
 document.getElementById('s3').textContent='0';
 const radarTotalVacio=document.getElementById('rlTotal');
 if(radarTotalVacio)radarTotalVacio.textContent='Verificación local pendiente';
 const aviso=document.getElementById('escaparateLocalAviso');
 if(aviso){aviso.hidden=false;const b=aviso.querySelector('b');if(b)b.textContent='Cargando escaparate local aislado…'}
 const opciones={method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'};
 const [r,m]=await Promise.all([
  fetch('/__rwadar_local/escaparate.json',opciones),
  fetch('/ofertas-editoriales/manifest.json',opciones)
 ]);
 if(!r.ok||!m.ok)throw new Error('HTTP '+(!r.ok?r.status:m.status)+' al leer el escaparate local');
 MANIFIESTO_EDITORIAL_LOCAL=validarManifiestoEditorialLocal(await m.json());
 const d=validarEscaparateLocal(await r.json());
 const categoriasOfertas=new Set([...d.ofertas,...d.secundario].map(o=>o.categoria));
 if(categoriasOfertas.size!==4||[...categoriasOfertas].some(c=>!MANIFIESTO_EDITORIAL_LOCAL.porCategoria[c]))
  throw new Error('el fallback editorial no cubre todas las ofertas locales');
 const plataformas=d.plataformas.map(plataformaDesdeEscaparate);
 const descartes=d.descartes.map(descarteDesdeEscaparate);
 ESCAPARATE_LOCAL=d;
 P.length=0;P.push(...plataformas);
 FUERA.length=0;FUERA.push(...descartes);
 activaControlesEscaparateLocal();
 pintarTiposOfertaLocal();pintarFiltrosEmision();pintarEmisiones();pintarExclusionesLocales();pintarFuenteLocal();
 rellenaRegiones();pintarDescartadas();render();
 document.getElementById('s1').textContent=P.length;
 document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
 document.getElementById('s4').textContent=FUERA.length;
 const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';
 const pie=document.getElementById('pieRevision');if(pie)pie.textContent='Fuentes del radar: '+
  fechaES(d.fuente.actualizacionRadarLocal.verificadoEl)+' · Ofertas: '+
  fechaES(d.fuente.actualizacionLocal.verificadoEl)+' · Secundario: '+
  [...new Set(d.secundario.map(o=>o.verificadaEl))].sort().map(fechaES).join(', ');
 if(aviso){const b=aviso.querySelector('b');if(b)b.textContent='Escaparate de revisión aislado de producción'}
 return true;
}

async function alDia(){
 if(typeof MODO_LOCAL_SEGURO!=='undefined'&&MODO_LOCAL_SEGURO)throw new Error('Supabase está bloqueado en el modo local seguro');
 const cab={apikey:CLAVE_PUB};
 const pide=u=>fetch(API+u,{headers:cab,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'})
   .then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)));
  const [r,f,e]=await Promise.all([
    pide('/catalogo_plataformas_publicas_v2?select=*'),
    pide('/plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)&order=nombre'),
    pide('/catalogo_ofertas_publicas_v2?select=*')
  ]);
  if(!Array.isArray(f)||f.length!==4)throw new Error('descartes públicos incompletos');
  let fecha,nP,nE;
  try{
   fecha=validarLoteCatalogoRemotoV2(r,e);
   nP=r.map(p=>plataformaCatalogoRemota(p,fecha)).sort((a,b)=>a.n.localeCompare(b.n,'es'));
   nE=e.map(o=>ofertaCatalogoRemota(o,fecha)).sort((a,b)=>a.slug.localeCompare(b.slug,'es'));
  }catch(error){
   P.length=0;EMI.length=0;CATALOGO_EMBEBIDO_BLOQUEADO=true;
   refrescarDetalleOfertaAbierto();throw error;
  }
  const nF=f.map(descarteRemoto).sort((a,b)=>a.n.localeCompare(b.n,'es'));

 if(huella(nP,nF,nE)===huella(P,FUERA,EMI)) return false;   /* ya estaba al día */

 P.length=0;    P.push(...nP);
 FUERA.length=0; FUERA.push(...nF);
  EMI.length=0;  EMI.push(...nE);
  CATALOGO_EMBEBIDO_BLOQUEADO=false;
 refrescarDetalleOfertaAbierto();
 rellenaRegiones();
 document.getElementById('s1').textContent=P.length;
 document.getElementById('s3').textContent=new Set(P.map(p=>p.cat)).size;
 document.getElementById('s4').textContent=FUERA.length;
/* El rotulo del radar tambien: estaba escrito a mano y se quedo en 24
   cuando el registro crecio. Ahora sale de P como todo lo demas. */
{const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';}
 pintarDescartadas();
 pintarFiltrosEmision();
 pintarEmisiones();
 render();
 const pie=document.getElementById('pieRevision');
 if(pie) pie.textContent='Última revisión del registro: '+ultimaRevision();
 return true;
}

/* Todo el contrato está inicializado antes del primer render, también cuando
   sincronizar.js ha embebido el nuevo lote. */
comprobarCatalogoEmbebido();
pintarFiltrosEmision();pintarEmisiones();

function avisar(texto){
 let t=document.getElementById('avisoGlobal');
 if(!t){t=document.createElement('div');t.id='avisoGlobal';t.className='aviso';
   t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);}
 t.textContent=texto; clearTimeout(avisar._fuera); clearTimeout(avisar._borra);
 t.classList.remove('dentro');
 requestAnimationFrame(()=>t.classList.add('dentro'));
 avisar._fuera=setTimeout(()=>{t.classList.remove('dentro');
   avisar._borra=setTimeout(()=>{if(t.parentNode)t.remove()},400)},4200);
}

/* Al cargar, y de nuevo si la pestaña vuelve a primer plano tras un rato:
   quien deja la página abierta todo el día también merece ver lo último. */
let ultimaMirada=0;
function refrescarVigenciaOfertas(){
 if(MODO_LOCAL_SEGURO){
  if(ESCAPARATE_LOCAL)pintarEscaparateLocal();
 }else{
  comprobarCatalogoEmbebido();pintarFiltrosEmision();pintarEmisiones();
 }
 refrescarDetalleOfertaAbierto();
}
/* No basta con comprobar al descargar: una pestaña puede cruzar medianoche
   o volver de suspensión sin que el catálogo remoto haya cambiado. */
function programarRevisionVigenciaOfertas(){
 const ahora=new Date(),siguienteDia=new Date(ahora);
 siguienteDia.setUTCHours(24,0,0,100);
 setTimeout(()=>{refrescarVigenciaOfertas();programarRevisionVigenciaOfertas()},siguienteDia-ahora);
}
programarRevisionVigenciaOfertas();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refrescarVigenciaOfertas()});
async function mirar(){
 if(MODO_LOCAL_SEGURO)return;
 comprobarCatalogoEmbebido();
 refrescarDetalleOfertaAbierto();
 if(Date.now()-ultimaMirada<60000) return;
 ultimaMirada=Date.now();
 try{ if(await alDia()) avisar('Registro actualizado'); }
 catch{comprobarCatalogoEmbebido();refrescarDetalleOfertaAbierto();pintarFiltrosEmision();pintarEmisiones();render()}
}
/* Primero se pinta lo que ya venía en el HTML, y solo después se
   consulta la base: así la página está usable de inmediato y la
   actualización, si la hay, llega sin bloquear nada. */
render();
pulir();
(function pieFecha(){const p=document.getElementById('pieRevision');
 if(p) p.textContent='Última revisión del registro: '+ultimaRevision();})();
if(MODO_LOCAL_SEGURO){
 cargarEscaparateLocal().catch(e=>{
  document.body.classList.add('modo-local-seguro');
  const aviso=document.getElementById('escaparateLocalAviso');
  if(aviso){aviso.hidden=false;const b=aviso.querySelector('b');if(b)b.textContent='No se pudo abrir el escaparate local';
   const p=aviso.querySelector('p');if(p)p.textContent='El radar queda oculto: falta una verificación local completa y vigente. No se contacta producción. '+e.message;}
 });
}else{
 mirar();
 document.addEventListener('visibilitychange',()=>{ if(!document.hidden) mirar(); });
}


/* =================================================================
   OPINIONES DE USUARIOS
   -----------------------------------------------------------------
   Tres cosas que NO son adorno y no conviene quitar:

   1 · El aviso de que no comprobamos que quien opina haya sido
       cliente. La normativa europea de reseñas obliga a declarar si
       se verifica y cómo. Decir que sí sin hacerlo es una infracción.
   2 · El botón de denunciar. Alojar lo que escriben terceros solo
       está amparado si existe una vía para avisar y se actúa. Sin él,
       RWAdar respondería como si lo hubiera escrito ella.
   3 · La media no se publica con menos de tres opiniones. Un solo
       enfadado no es una nota, es una anécdota.
   ================================================================= */
const Opiniones=(function(){
 const REST=API;                       /* el mismo que usa el registro */
 const cab=async()=>{const c={apikey:CLAVE_PUB,'Content-Type':'application/json'};
   const t=await Cuenta.token();if(!t){const e=new Error('La sesión ha caducado.');e.status=401;throw e;}
   c.Authorization='Bearer '+t;return c;};

 async function pide(ruta,opc){
  if(!SERVICIOS_USUARIO_DISPONIBLES)throw new Error('Opiniones desactivadas en esta versión editorial');
  const cfg=Object.assign({cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'},opc||{});
  cfg.headers=Object.assign({apikey:CLAVE_PUB},(opc&&opc.headers)||{});
  const r=await fetch(REST+ruta,cfg);
  const texto=await r.text(); let j=null;
  try{j=texto?JSON.parse(texto):null}catch(e){j=texto||null}
  if(!r.ok){
   const err=new Error((j&&typeof j==='object'&&(j.message||j.error_description||j.hint))||('HTTP '+r.status));
   err.status=r.status; err.code=j&&typeof j==='object'&&j.code; throw err;
  }
  return j;
 }

 const idDe=Object.create(null);        /* nombre de plataforma -> uuid, sin prototipo */
 async function idPlataforma(nombre){
  if(idDe[nombre])return idDe[nombre];
  const j=await pide('/plataformas?select=id,nombre&nombre=eq.'+encodeURIComponent(nombre));
  if(!Array.isArray(j)||!j.length)throw new Error('no encuentro la plataforma');
  return (idDe[nombre]=j[0].id);
 }

 const fecha=s=>{const d=new Date(s);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})};
 const limpio=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 const nota=s=>{const n=Number(s);return Number.isInteger(n)&&n>=1&&n<=10?n:null};

 async function pinta(nombre,host){
  if(!SERVICIOS_USUARIO_DISPONIBLES){host.innerHTML='';return;}
  host.innerHTML='<p class="op-cargando">Cargando opiniones…</p>';
  let pid;
  try{ pid=await idPlataforma(nombre); }catch(e){ host.innerHTML=''; return; }

  let lista=[],media=null,mia=null,propiaDisponible=true;
  try{
   const [a,b]=await Promise.all([
     pide('/opiniones_publicas?select=opinion_id,plataforma_id,autor,nota,texto,creado_el,editada&plataforma_id=eq.'+encodeURIComponent(pid)+'&order=creado_el.desc'),
     pide('/nota_media?select=plataforma_id,opiniones,media&plataforma_id=eq.'+encodeURIComponent(pid))
   ]);
   lista=(Array.isArray(a)?a:[]).filter(o=>o&&uuid(o.opinion_id)&&nota(o.nota)!==null&&typeof o.texto==='string')
     .map(o=>Object.assign({},o,{nota:nota(o.nota)}));
   if(Array.isArray(b)&&b[0]){
    const m=Number(b[0].media),n=Number(b[0].opiniones);
    if(Number.isFinite(m)&&Number.isInteger(n)&&n>=3)media={media:Math.round(m*10)/10,opiniones:n};
   }
  }catch(e){ host.innerHTML='<p class="op-cargando">Opiniones temporalmente no disponibles.</p>'; return; }
  if(Cuenta.hay()){
   try{
    const j=await pide('/mis_opiniones?select=opinion_id,plataforma_id,nota,texto,estado,denuncias,creado_el,actualizado_el&plataforma_id=eq.'+encodeURIComponent(pid),{headers:await cab()});
    if(Array.isArray(j)&&j[0]&&uuid(j[0].opinion_id)&&nota(j[0].nota)!==null&&typeof j[0].texto==='string')
      mia=Object.assign({},j[0],{nota:nota(j[0].nota)});
   }catch(e){propiaDisponible=false;}
  }

  const cabecera='<div class="op-cab"><span class="op-tit">Opiniones de usuarios</span>'+
    (media&&media.media!=null
      ? '<span class="op-media"><span class="n">'+media.media+'</span><span class="de">/ 10 · '+media.opiniones+' opiniones</span></span>'
      : '<span class="de op-conteo">'+(lista.length?lista.length+' opini'+(lista.length===1?'ón':'ones'):'sin opiniones todavía')+'</span>')+'</div>';

  const aviso='<p class="op-aviso">Esto lo escriben usuarios, no es la verificación de RWAdar. '+
    '<b>No comprobamos que quien opina haya sido cliente de la plataforma.</b> '+
    'La media solo se publica a partir de tres opiniones. Si ves algo falso o difamatorio, denúncialo.</p>';

  const filas=lista.map(o=>{
    const cls=o.nota>=7?'alta':(o.nota<=4?'baja':'');
    return '<li><div class="op-fila"><span class="op-nota '+cls+'">'+o.nota+'/10</span>'+
      '<span class="op-autor">'+limpio(o.autor)+'</span>'+
      '<span class="op-fecha">'+fecha(o.creado_el)+(o.editada?' · editada':'')+'</span></div>'+
      '<p class="op-texto">'+limpio(o.texto)+'</p>'+
      '<div class="op-acciones"><button class="den" data-den="'+limpio(o.opinion_id)+'">Denunciar</button></div></li>';
  }).join('');

  let formulario;
  if(!Cuenta.hay()){
   formulario='<div class="op-cuenta">Para dejar tu nota y contar tu experiencia hace falta una cuenta. '+
     'Es gratis y también permite guardar las plataformas que quieres vigilar. '+
     '<button type="button" id="opEntrar">Crear cuenta o entrar</button></div>';
  }else if(!propiaDisponible){
   formulario='<p class="op-cargando">Tu editor de opiniones no está disponible ahora. Vuelve a intentarlo más tarde.</p>';
  }else{
   const n=mia?mia.nota:0;
   formulario='<form class="op-form" id="opForm">'+
     '<div class="op-tit op-form-tit">'+(mia?'Tu opinión':'Escribe la tuya')+'</div>'+
     (mia&&mia.estado==='oculta'?'<p class="op-aviso op-aviso-oculta">Tu opinión está retirada tras varias denuncias. Puedes editarla.</p>':'')+
     '<div class="op-notas" id="opNotas" role="group" aria-label="Nota del 1 al 10">'+
       [1,2,3,4,5,6,7,8,9,10].map(i=>'<button type="button" aria-label="'+i+' sobre 10" aria-pressed="'+(i===n?'true':'false')+'" data-n="'+i+'"'+(i===n?' class="on"':'')+'>'+i+'</button>').join('')+
     '</div>'+
     '<label class="op-tit op-experiencia" for="opTexto">Tu experiencia</label>'+
     '<textarea id="opTexto" required maxlength="1200" minlength="20" placeholder="Qué tal te ha ido: cómo entraste, qué cobraste, qué tardó. Concreto y sin insultos.">'+limpio(mia?mia.texto:'')+'</textarea>'+
     '<button class="op-enviar" type="submit">'+(mia?'Guardar cambios':'Publicar opinión')+'</button>'+
     (mia?' <button class="op-enviar op-borrar" type="button" id="opBorrar">Borrar</button>':'')+
     '</form>';
  }

  host.innerHTML='<div class="op-bloque">'+cabecera+aviso+
    (filas?'<ul class="op-lista">'+filas+'</ul>':'')+
    '<div class="op-form-wrap">'+formulario+'</div></div>';

  const ent=host.querySelector('#opEntrar');
  if(ent)ent.onclick=()=>Cuenta.abrir('registro');

  const notas=host.querySelector('#opNotas');
  if(notas)notas.onclick=e=>{const b=e.target.closest('button[data-n]');if(!b)return;
    notas.querySelectorAll('button').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-pressed','false')});
    b.classList.add('on');b.setAttribute('aria-pressed','true');};

  const form=host.querySelector('#opForm');
  if(form)form.onsubmit=async e=>{
    e.preventDefault();
    const sel=notas.querySelector('button.on');
    const texto=host.querySelector('#opTexto').value.trim();
    if(!sel){aviso2('Pon una nota del 1 al 10.');return;}
    if(texto.length<20){aviso2('Cuenta un poco más: mínimo 20 caracteres.');return;}
    const b=form.querySelector('button[type=submit]');b.disabled=true;b.textContent='Guardando…';
    try{
     await pide('/rpc/guardar_opinion',{method:'POST',headers:await cab(),
       body:JSON.stringify({p_plataforma:pid,p_nota:+sel.dataset.n,p_texto:texto})});
     Sonido&&Sonido.marcar&&Sonido.marcar();
     aviso2('Publicada. Gracias.');
     await pinta(nombre,host);
    }catch(err){ b.disabled=false; b.textContent=mia?'Guardar cambios':'Publicar opinión';
      aviso2(err.code==='22023'?'Revisa la nota y el texto antes de guardar.':
        (err.status===401||err.status===403?'La sesión ha caducado. Vuelve a entrar.':'No se ha podido guardar.')); }
  };

  const borrar=host.querySelector('#opBorrar');
  if(borrar)borrar.onclick=async()=>{
    if(!confirm('¿Borrar tu opinión sobre '+nombre+'?'))return;
    borrar.disabled=true;
    try{
     await pide('/rpc/borrar_mi_opinion',{method:'POST',headers:await cab(),
       body:JSON.stringify({p_opinion_id:mia.opinion_id})});
     aviso2('Opinión borrada.'); await pinta(nombre,host);
    }catch(e){borrar.disabled=false;aviso2('No se ha podido borrar la opinión.');}
  };

  host.querySelectorAll('button[data-den]').forEach(b=>{
    b.onclick=async()=>{
      if(!Cuenta.hay()){Cuenta.abrir('entrar');return;}
      const motivo=prompt('¿Por qué la denuncias? (falsa, insultos, datos personales…)');
      if(motivo===null)return;
      b.disabled=true;
      try{
       const limpioMotivo=motivo.trim().slice(0,300);
       await pide('/rpc/denunciar_opinion',{method:'POST',headers:await cab(),
         body:JSON.stringify({p_opinion_id:b.dataset.den,p_motivo:limpioMotivo||null})});
       b.textContent='Denunciada'; aviso2('Denuncia enviada. La revisaremos.');
      }catch(e){
       b.disabled=false;
       if(e.code==='23505') aviso2('Ya habías denunciado esta opinión.');
       else if(e.code==='P0001') aviso2('No puedes denunciar tu propia opinión.');
       else if(e.code==='P0002') aviso2('La opinión ya no está disponible.');
       else if(e.status===401||e.status===403) aviso2('La sesión ha caducado. Vuelve a entrar.');
       else aviso2('No se ha podido enviar la denuncia.');
      }
    };
  });
 }

 function aviso2(t){avisar(t)}

 return {pinta:pinta};
})();

/* correo-consentimiento:inicio */
const VERSION_CONSENTIMIENTO_CORREO='correo-v1-2026-08-22';
function consentimientoCorreoVigente(datos){
 if(!datos||datos.avisos_correo!==true||
    datos.avisos_correo_version!==VERSION_CONSENTIMIENTO_CORREO||
    typeof datos.avisos_correo_aceptado_el!=='string')return false;
 return Number.isFinite(Date.parse(datos.avisos_correo_aceptado_el));
}
function perfilConCorreoSeguro(base,datos){
 const vigente=consentimientoCorreoVigente(datos);
 return Object.assign({},base||{}, {
  avisos_correo:vigente,
  avisos_correo_aceptado_el:vigente?datos.avisos_correo_aceptado_el:null,
  avisos_correo_version:vigente?VERSION_CONSENTIMIENTO_CORREO:null
 });
}
function perfilDesdeRespuestaCorreo(base,fila,esperado){
 if(!fila||fila.habilitado!==esperado)throw new Error('respuesta de consentimiento no válida');
 const datos={avisos_correo:fila.habilitado,
  avisos_correo_aceptado_el:fila.aceptado_el,avisos_correo_version:fila.version};
 if(esperado&&!consentimientoCorreoVigente(datos))
  throw new Error('el consentimiento no quedó registrado');
 if(!esperado&&(fila.aceptado_el!==null||fila.version!==null))
  throw new Error('la retirada no quedó registrada');
 return perfilConCorreoSeguro(base,datos);
}
/* correo-consentimiento:fin */

/* =================================================================
   CUENTA · registro, sesión y lista de vigilancia
   -----------------------------------------------------------------
   Sin librerías: se habla directamente con la API de Supabase, igual
   que hace alDia con el registro. Meter el SDK habría roto lo único
   que hace especial a esta página —un archivo, cero dependencias— a
   cambio de ahorrar unas cuantas llamadas a fetch.

   La cuenta NO es un muro: el registro se lee entero sin ella. Sirve
   para guardar vigilancia y para publicar o gestionar una opinión. La
   entrega de avisos por correo se activará solo cuando esté configurada.
   ================================================================= */
const Cuenta = (function(){
 const AUTH='https://exgpmjpaaebyoolpwced.supabase.co/auth/v1';
 /* El panel de Supabase confirma que Confirm email está activo pero el SMTP
    propio sigue apagado. Hasta que un alta y una recuperación lleguen de
    extremo a extremo, la interfaz no debe recoger datos para crear cuentas
    que la persona no podrá confirmar. Cambiar a true exige esa prueba real. */
 const CORREO_AUTH_E2E=false;
 let ses=null, perfil=null, vigiladas=new Map(), modo='entrar', fichaAbierta=null,
     identidadConfirmada=false,versionSesion=0,renovacion=null,focoCuenta=null,
     correoPendiente='',operacionCuenta=0,temporizadorReenvio=null,cuentaHistorial=false;

 const $=id=>document.getElementById(id);
 function normalizaSesion(s){
  if(!s||typeof s!=='object'||typeof s.access_token!=='string'||!s.access_token) return null;
  const expira=Number(s.expira);
  return {access_token:s.access_token,
    refresh_token:typeof s.refresh_token==='string'?s.refresh_token:'',
    expira:Number.isFinite(expira)?expira:0,
    correo:typeof s.correo==='string'?s.correo:'',
    uid:typeof s.uid==='string'?s.uid:''};
 }
 /* Los tokens se conservan solo en memoria. Una recarga exige volver a entrar,
    pero reduce la exposición: ninguna sesión queda persistida en localStorage. */
 const guarda=s=>{ses=normalizaSesion(s);versionSesion++;};

 /* --- la API de autenticación ------------------------------------ */
 async function auth(ruta,cuerpo,opc){
  if(!SERVICIOS_USUARIO_DISPONIBLES)throw new Error('Cuentas desactivadas en esta versión editorial');
  let r;
  try{
   r=await fetch(AUTH+ruta,{method:(opc&&opc.metodo)||'POST',
     headers:Object.assign({apikey:CLAVE_PUB,'Content-Type':'application/json'},
       (opc&&opc.token)?{Authorization:'Bearer '+opc.token}:{}),
     body:cuerpo?JSON.stringify(cuerpo):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  }catch(e){throw new Error('No se ha podido conectar. Comprueba la conexión y vuelve a intentarlo.');}
  const t=await r.text(); let j={};
  if(t){
   try{j=JSON.parse(t);}
   catch(e){
    if(r.ok)throw new Error('La respuesta de autenticación no es válida. Inténtalo más tarde.');
    j={};
   }
  }
  if(!r.ok){const e=new Error(traduce(j.msg||j.error_description||j.message||('HTTP '+r.status)));
    e.status=r.status;e.code=j.code||j.error_code||'';throw e;}
  return j;
 }
 /* Los mensajes de Supabase llegan en inglés y son crípticos. */
 function traduce(m){
  const t=String(m).toLowerCase();
  if(t.includes('invalid login')) return 'El correo o la contraseña no son correctos.';
  if(t.includes('email not confirmed')) return 'Falta confirmar el correo. Mira tu bandeja, y también el spam.';
  if(t.includes('expired')||t.includes('invalid token')||t.includes('otp_expired')) return 'El enlace no es válido o ha caducado. Solicita uno nuevo.';
  if(t.includes('already registered')||t.includes('already been registered')) return 'Ese correo ya tiene cuenta. Prueba a entrar.';
  if(t.includes('password should be')||t.includes('at least 12')||t.includes('at least 8')) return 'La contraseña necesita al menos 12 caracteres.';
  if(t.includes('rate limit')||t.includes('too many')) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
  if(t.includes('unable to validate email')||t.includes('invalid format')) return 'Esa dirección de correo no parece válida.';
  return m;
 }

 /* Renueva el testigo si ha caducado. Sin esto, la sesión se cae sola
    al cabo de una hora y parece que el sitio te ha echado. */
 async function testigo(){
  if(!SERVICIOS_USUARIO_DISPONIBLES)return null;
  if(!ses) return null;
  if(ses.expira && Date.now() < ses.expira-60000) return ses.access_token;
  if(!ses.refresh_token){guarda(null);identidadConfirmada=false;pinta();return null;}
  if(renovacion)return renovacion;
  const inicio=versionSesion,anterior=Object.assign({},ses);
  renovacion=(async()=>{
   try{
    const j=await auth('/token?grant_type=refresh_token',{refresh_token:anterior.refresh_token});
    if(versionSesion!==inicio)return null; /* hubo logout u otra entrada mientras esperaba */
    guarda({access_token:j.access_token,refresh_token:j.refresh_token||anterior.refresh_token,
            expira:Date.now()+(j.expires_in||3600)*1000,
            correo:(j.user&&j.user.email)||anterior.correo,
            uid:(j.user&&j.user.id)||anterior.uid});
    return ses&&ses.access_token;
   }catch(e){
    if(versionSesion===inicio){guarda(null);identidadConfirmada=false;pinta();}
    return null;
   }finally{renovacion=null;}
  })();
  return renovacion;
 }

 async function confirmarIdentidad(){
  const tk=await testigo(); if(!tk)return false;
  const inicio=versionSesion;
  try{
   const u=await auth('/user',null,{metodo:'GET',token:tk});
   if(!u||!u.id)throw new Error('identidad no válida');
   if(versionSesion!==inicio||!ses||ses.access_token!==tk)return false;
   guarda(Object.assign({},ses,{uid:u.id,correo:u.email||''}));identidadConfirmada=true;return true;
  }catch(e){
   /* Un token que no hemos podido revalidar nunca queda utilizable en memoria,
      tampoco ante cortes de red o errores 5xx. */
   identidadConfirmada=false;guarda(null);pinta();
   return false;
  }
 }

 /* --- datos propios (la base ya filtra por RLS) ------------------- */
 async function rest(ruta,opc){
  if(!SERVICIOS_USUARIO_DISPONIBLES)throw new Error('Datos de cuenta desactivados en esta versión editorial');
  const tk=await testigo();if(!tk){const e=new Error('La sesión ha caducado. Vuelve a entrar.');e.status=401;throw e;}
  const cfg=Object.assign({cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'},opc||{});
  cfg.headers=Object.assign({apikey:CLAVE_PUB,Authorization:'Bearer '+tk,
    'Content-Type':'application/json',Prefer:'return=representation'},(opc&&opc.headers)||{});
  const r=await fetch(API+ruta,cfg);
  const texto=await r.text();let j=null;try{j=texto?JSON.parse(texto):null}catch(e){j=texto||null}
  if(!r.ok){const e=new Error((j&&typeof j==='object'&&(j.message||j.hint))||('HTTP '+r.status));
    e.status=r.status;e.code=j&&typeof j==='object'&&j.code;throw e;}
  return j==null?[]:j;
 }
 async function cargarMio(){
  try{
   const p=await rest('/mi_perfil?select=*'); perfil=(p&&p[0])||null;
   if(perfil){
    let preferencia=null;
    try{
     const filas=await rest('/perfiles?select=avisos_correo,avisos_correo_aceptado_el,avisos_correo_version&id=eq.'+
       encodeURIComponent(ses.uid));
     preferencia=(filas&&filas[0])||null;
    }catch(e){}
    perfil=perfilConCorreoSeguro(perfil,preferencia);
   }
   const v=await rest('/vigilancia?select=plataforma_id,plataformas(nombre)');
   vigiladas=new Map((v||[]).map(x=>[x.plataformas&&x.plataformas.nombre,x.plataforma_id]));
  }catch(e){perfil=null;vigiladas=new Map();}
 }

 /* --- vigilar / dejar de vigilar --------------------------------- */
 async function idDe(nombre){
  const r=await rest('/plataformas?select=id&nombre=eq.'+encodeURIComponent(nombre));
  return r&&r[0]&&r[0].id;
 }
 async function alternar(nombre){
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('El seguimiento está en pausa. Puedes consultar las fichas sin cuenta.');return;}
  if(!identidadConfirmada){abrir('registro','Crea una cuenta para guardar '+nombre+' en tu lista de vigilancia.');return;}
  const b=$('btnVig'); if(b) b.disabled=true;
  try{
   if(vigiladas.has(nombre)){
    await rest('/vigilancia?plataforma_id=eq.'+vigiladas.get(nombre),{method:'DELETE'});
    vigiladas.delete(nombre); aviso(nombre+': ya no la vigilas');
   }else{
    const id=await idDe(nombre); if(!id) throw new Error('no encuentro esa plataforma');
    await rest('/vigilancia',{method:'POST',body:JSON.stringify({usuario_id:ses.uid,plataforma_id:id})});
    vigiladas.set(nombre,id); aviso('Vigilando '+nombre+'. La entrega por correo aún no está activa.');
   }
  }catch(e){ aviso('No se ha podido guardar: '+e.message); }
  if(b) b.disabled=false;
  pintarVigilar(nombre); pinta();
 }
 function pintarVigilar(nombre){
  fichaAbierta=nombre; const c=$('dwVigilar'); if(!c) return;
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   c.innerHTML='<p class="pn-nota pn-nota-separada">El seguimiento está en pausa. Puedes consultar esta ficha y visitar la web del proveedor sin cuenta.</p>';
   return;
  }
  const on=vigiladas.has(nombre);
  c.innerHTML='<button class="btn-vigilar'+(on?' on':'')+'" id="btnVig">'+
   (on?'✓ La estás vigilando':'+ Vigilar esta plataforma')+'</button>'+
   '<p class="pn-nota pn-nota-separada">'+
   (identidadConfirmada?'La vigilancia queda guardada. La entrega por correo aún no está activa.'
       :'Necesita una cuenta para guardar la vigilancia entre visitas.')+'</p>';
  const b=$('btnVig'); if(b) b.addEventListener('click',()=>alternar(nombre));
 }

 /* --- la ventana de entrar / registro / recuperar ------------------ */
 const TEXTOS={
  entrar:{t:'Entrar',s:'Para guardar vigilancia y gestionar tus opiniones.',b:'Entrar',otro:'Crear una cuenta'},
  registro:{t:'Crear cuenta',s:'Es opcional y gratis. Tendrás que confirmar el correo antes de entrar.',b:'Crear cuenta',otro:'Ya tengo cuenta'},
  recuperar:{t:'Recuperar el acceso',s:'Solicita un enlace para poner una contraseña nueva.',b:'Solicitar el enlace',otro:'Volver a entrar'},
  nueva_clave:{t:'Elige una contraseña nueva',s:'El enlace ya ha verificado tu solicitud. Escribe la contraseña que usarás desde ahora.',b:'Guardar contraseña',otro:''},
  registro_pausado:{t:'Alta temporalmente en pausa',s:'Puedes consultar todo RWAdar sin crear una cuenta.'},
  recuperar_pausado:{t:'Recuperación temporalmente en pausa',s:'Las cuentas existentes siguen pudiendo entrar.'},
  confirmacion_pendiente:{t:'Confirma tu correo para entrar',s:'La solicitud se ha recibido.'},
  recuperacion_pendiente:{t:'Revisa tu correo para recuperar el acceso',s:'La solicitud se ha recibido.'}
 };
 const MODOS_ESTADO=new Set(['registro_pausado','recuperar_pausado','confirmacion_pendiente','recuperacion_pendiente']);
 const correoValido=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
 function limpiaSecretos(){
  $('cClave').value='';$('cClave2').value='';
 }
 function limpiaErroresCuenta(){
  ['cNombre','cCorreo','cClave','cClave2'].forEach(id=>{$(id).removeAttribute('aria-invalid');});
 }
 function errorCuenta(texto,campo){
  const e=new Error(texto);e.campo=campo;return e;
 }
 function estadoCuenta(){
  const pausado=modo==='registro_pausado'||modo==='recuperar_pausado';
  const registro=modo==='confirmacion_pendiente';
  const e=$('cuentaEstado');
  $('cuentaEstadoMarca').textContent=pausado?'CUENTAS EN PAUSA':'SOLICITUD RECIBIDA';
  if(pausado){
   $('cuentaEstadoTexto').textContent='La confirmación obligatoria está activa, pero RWAdar todavía no tiene un servicio de correo propio probado. Para no dejar cuentas bloqueadas, no recogemos nuevas altas ni solicitudes de recuperación por ahora.';
   $('cuentaEstadoCorreo').hidden=true;$('cuentaEstadoCorreo').textContent='';
   $('cuentaPaso1').textContent='Puedes usar todo el radar sin cuenta.';
   $('cuentaPaso2').textContent='Las cuentas que ya funcionan pueden seguir entrando.';
   $('cuentaPaso3').textContent='Reabriremos este paso cuando el correo se haya comprobado de extremo a extremo.';
  }else{
   $('cuentaEstadoTexto').textContent=registro
    ?'La solicitud fue aceptada. Abre el enlace del correo si lo recibes; la aceptación no demuestra que el mensaje haya sido entregado.'
    :'La solicitud fue aceptada. Abre el enlace del correo si lo recibes para elegir una contraseña nueva.';
   $('cuentaEstadoCorreo').hidden=!correoPendiente;
   $('cuentaEstadoCorreo').textContent=correoPendiente;
   $('cuentaPaso1').textContent='Solicitud aceptada.';
   $('cuentaPaso2').textContent=registro?'Confirmación del correo pendiente.':'Enlace de recuperación pendiente.';
   $('cuentaPaso3').textContent=registro?'Después vuelve a RWAdar e inicia sesión.':'Elige la contraseña nueva desde el enlace.';
  }
  $('cuentaEstadoEntrar').textContent=pausado?'Ya tengo cuenta · Entrar':'Ya lo he hecho · Entrar';
  $('cuentaReenviar').hidden=pausado||!CORREO_AUTH_E2E;
  $('cuentaCambiarCorreo').hidden=pausado;
  e.hidden=false;
 }
 function abrir(m,motivo){
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('Las cuentas están en pausa. Puedes consultar todo el radar sin registrarte.');return;}
  const solicitado=m||'entrar';
  modo=!CORREO_AUTH_E2E&&solicitado==='registro'?'registro_pausado':
       !CORREO_AUTH_E2E&&solicitado==='recuperar'?'recuperar_pausado':solicitado;
  const T=TEXTOS[modo];if(!T)return;
  operacionCuenta++;limpiaSecretos();limpiaErroresCuenta();
  if(temporizadorReenvio){clearTimeout(temporizadorReenvio);temporizadorReenvio=null;}
  $('cuentaTit').textContent=T.t;
  $('cuentaSub').textContent=(modo===solicitado&&motivo)||T.s;
  $('cuentaEnviar').textContent=T.b||'';
  $('irCambiar').textContent=T.otro||'';
  const esEstado=MODOS_ESTADO.has(modo);
  $('cuentaForm').hidden=esEstado;
  $('cuentaEnlaces').hidden=esEstado;
  $('cuentaEstado').hidden=!esEstado;
  $('campoNombre').hidden=modo!=='registro';
  $('campoCorreo').hidden=modo==='nueva_clave';
  $('cCorreo').required=modo!=='nueva_clave';
  $('campoClave').hidden=modo==='recuperar';
  $('etiquetaClave').textContent=modo==='nueva_clave'?'Contraseña nueva':'Contraseña';
  $('cClave').required=modo!=='recuperar';
  $('cClave').autocomplete=(modo==='registro'||modo==='nueva_clave')?'new-password':'current-password';
  $('campoClave2').hidden=modo!=='nueva_clave';
  $('cClave2').required=modo==='nueva_clave';
  $('irRecuperar').hidden=modo==='recuperar'||modo==='nueva_clave';
  $('irCambiar').hidden=modo==='nueva_clave';
  $('cuentaLegal').hidden=modo!=='registro';
  if(esEstado)estadoCuenta();
  msj('');
  const caja=$('cuentaCaja'),yaAbierta=caja.classList.contains('on');
  if(!yaAbierta){
   if(document.querySelector('#drawer.show,#modal.show,#perfilPanel.show'))closeAll();
   focoCuenta=document.activeElement;
   fondo().forEach(n=>n.setAttribute('inert',''));
  }
  $('velo').classList.add('on');
  caja.classList.add('on'); caja.removeAttribute('inert');
  document.body.classList.add('locked');
  caja.scrollTop=0;
  const movil=typeof matchMedia==='function'&&matchMedia('(max-width:767px),(pointer:coarse)').matches;
  if(!yaAbierta&&movil&&typeof history!=='undefined'&&history.pushState){
   const previo=history.state&&typeof history.state==='object'?history.state:{};
   history.pushState({...previo,rwadarCuenta:true},'',location.href);cuentaHistorial=true;
  }
  setTimeout(()=>{try{
   if(esEstado||movil)caja.focus();
   else $(modo==='nueva_clave'?'cClave':'cCorreo').focus();
  }catch(e){}},60);
 }
 function cerrar(forzar=false){
  const caja=$('cuentaCaja'),estabaAbierta=caja.classList.contains('on');
  if(!forzar&&estabaAbierta&&cuentaHistorial&&history.state&&history.state.rwadarCuenta===true){
   cuentaHistorial=false;history.back();return;
  }
  operacionCuenta++;
  $('velo').classList.remove('on');
  caja.classList.remove('on'); caja.setAttribute('inert','');
  limpiaSecretos();$('cCorreo').value='';$('cNombre').value='';correoPendiente='';
  $('cuentaForm').removeAttribute('aria-busy');
  if(temporizadorReenvio){clearTimeout(temporizadorReenvio);temporizadorReenvio=null;}
  document.body.classList.remove('locked');
  if(estabaAbierta){cuentaHistorial=false;fondo().forEach(n=>n.removeAttribute('inert'));
   if(focoCuenta&&document.contains(focoCuenta))focoCuenta.focus();focoCuenta=null;}
 }
 function msj(txt,bien){
  const m=$('cuentaMsj'); m.className='cuenta-msj'+(txt?(bien?' bien':' mal'):'');
  m.setAttribute('role',txt&&!bien?'alert':'status');
  m.textContent=txt||'';
 }
 function aviso(txt){
  avisar(txt);
 }

 async function enviar(e){
  e.preventDefault();
  if(!SERVICIOS_USUARIO_DISPONIBLES)return;
  const correo=$('cCorreo').value.trim(), clave=$('cClave').value, nombre=$('cNombre').value.trim();
  const modoEnvio=modo,operacion=++operacionCuenta;
  const bot=$('cuentaEnviar'); bot.disabled=true;$('cuentaForm').setAttribute('aria-busy','true');
  limpiaErroresCuenta();msj('');
  try{
   if(['entrar','registro','recuperar'].includes(modoEnvio)&&!correoValido(correo))
    throw errorCuenta('Escribe una dirección de correo válida.','cCorreo');
   if(modoEnvio==='entrar'&&!clave)throw errorCuenta('Escribe tu contraseña.','cClave');
   if(modoEnvio==='registro'&&!CORREO_AUTH_E2E)
    throw new Error('El alta está temporalmente en pausa hasta comprobar el correo de confirmación.');
   if(modoEnvio==='recuperar'&&!CORREO_AUTH_E2E)
    throw new Error('La recuperación está temporalmente en pausa hasta comprobar el correo.');
   if(modoEnvio==='nueva_clave'){
    if(clave.length<12)throw errorCuenta('La contraseña necesita al menos 12 caracteres.','cClave');
    if(clave!==$('cClave2').value)throw errorCuenta('Las dos contraseñas no coinciden.','cClave2');
    const tk=await testigo();if(!tk)throw new Error('El enlace ha caducado. Solicita uno nuevo.');
    await auth('/user',{password:clave},{metodo:'PUT',token:tk});
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    msj('Contraseña cambiada. La sesión sigue abierta.',true);
   }else if(modoEnvio==='recuperar'){
    const vuelta=encodeURIComponent(location.origin+'/');
    await auth('/recover?redirect_to='+vuelta,{email:correo});
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    correoPendiente=correo;abrir('recuperacion_pendiente');
   }else if(modoEnvio==='registro'){
    if(clave.length<12)throw errorCuenta('La contraseña necesita al menos 12 caracteres.','cClave');
    const vuelta=encodeURIComponent(location.origin+'/');
    const j=await auth('/signup?redirect_to='+vuelta,{email:correo,password:clave,
      data:nombre?{nombre:nombre}:undefined});
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    if(j&&typeof j.access_token==='string'&&j.access_token){ await entrarCon(j); }
    else if(j&&typeof j.id==='string'&&j.id&&typeof j.email==='string'){
     correoPendiente=correo;$('cNombre').value='';$('cCorreo').value='';
     abrir('confirmacion_pendiente');
    }else throw new Error('La respuesta del alta no es válida. No damos la cuenta por creada.');
   }else{
    const j=await auth('/token?grant_type=password',{email:correo,password:clave});
    if(operacion!==operacionCuenta||modo!==modoEnvio)return;
    await entrarCon(j);
   }
  }catch(err){
   if(operacion===operacionCuenta&&modo===modoEnvio){
    msj(err.message);if(err.campo){$(err.campo).setAttribute('aria-invalid','true');$(err.campo).focus();}
   }
  }finally{
   limpiaSecretos();
   if(operacion===operacionCuenta){bot.disabled=false;$('cuentaForm').removeAttribute('aria-busy');}
  }
 }
 async function reenviarConfirmacion(){
  if(!CORREO_AUTH_E2E||!correoValido(correoPendiente))return;
  const bot=$('cuentaReenviar'),operacion=++operacionCuenta,modoEnvio=modo;
  bot.disabled=true;bot.setAttribute('aria-busy','true');msj('');
  try{
   const vuelta=encodeURIComponent(location.origin+'/');
   if(modoEnvio==='confirmacion_pendiente')
    await auth('/resend?redirect_to='+vuelta,{type:'signup',email:correoPendiente});
   else if(modoEnvio==='recuperacion_pendiente')
    await auth('/recover?redirect_to='+vuelta,{email:correoPendiente});
   else return;
   if(operacion!==operacionCuenta||modo!==modoEnvio)return;
   msj('La solicitud de reenvío fue aceptada. Esto no confirma la entrega del mensaje.',true);
   bot.textContent='Espera un minuto para reintentar';
   temporizadorReenvio=setTimeout(()=>{
    if(modo===modoEnvio){bot.disabled=false;bot.textContent='Reintentar correo';}
    temporizadorReenvio=null;
   },60000);
  }catch(err){if(operacion===operacionCuenta&&modo===modoEnvio){msj(err.message);bot.disabled=false;}}
  finally{bot.removeAttribute('aria-busy');}
 }
 async function entrarCon(j){
  if(!j||typeof j.access_token!=='string'||!j.access_token)
   throw new Error('La sesión recibida no es válida.');
  guarda({access_token:j.access_token,refresh_token:j.refresh_token,
          expira:Date.now()+(j.expires_in||3600)*1000,
          correo:(j.user&&j.user.email)||'', uid:(j.user&&j.user.id)||''});
  identidadConfirmada=false;
  if(!await confirmarIdentidad()){
   guarda(null);identidadConfirmada=false;pinta();
   throw new Error('No se ha podido verificar la sesión. Vuelve a entrar.');
  }
  if(modo==='registro'&&$('cNombre').value.trim()){
   try{ await rest('/perfiles?id=eq.'+encodeURIComponent(ses.uid),{method:'PATCH',body:JSON.stringify({nombre:$('cNombre').value.trim()})}); }catch(e){}
  }
  await cargarMio(); cerrar(); pinta();
  if(fichaAbierta) pintarVigilar(fichaAbierta);
  aviso('Hola' + (perfil&&perfil.nombre?' '+perfil.nombre:'') + '. Sesión iniciada.');
 }

 /* --- el área de la persona --------------------------------------- */
 function abrirPerfil(soloPintar=false){
  const c=$('perfilCuerpo'); if(!c) return;
  const nom=(perfil&&perfil.nombre)||(ses.correo||'').split('@')[0];
  const dias=Math.max(0,Number.parseInt(perfil&&perfil.dias_de_miembro,10)||0);
  const avisosRecibidos=Math.max(0,Number.parseInt(perfil&&perfil.avisos_recibidos,10)||0);
  const desde=perfil&&perfil.miembro_desde?new Date(perfil.miembro_desde).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}):'—';
  const lista=[...vigiladas.keys()].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
  const correoConsentido=consentimientoCorreoVigente(perfil);
  c.innerHTML=
   '<div class="perfil-cab"><div class="perfil-ini">'+esc(nom.slice(0,1))+'</div>'+
   '<div><div class="quien">'+esc(nom)+'</div><div class="correo">'+esc(ses.correo||'')+'</div></div></div>'+
   '<div class="perfil-cifras">'+
    '<div><span class="n">'+dias+'</span><span class="l">Días<br>de miembro</span></div>'+
    '<div><span class="n">'+lista.length+'</span><span class="l">Plataformas<br>vigiladas</span></div>'+
    '<div><span class="n">'+avisosRecibidos+'</span><span class="l">Alertas<br>generadas</span></div>'+
   '</div>'+
   '<p class="perfil-nota">Miembro desde el '+desde+'.</p>'+ 
   '<div class="perfil-sec">Identidad pública</div>'+
   '<div class="perfil-editar"><label for="pfNombre">Nombre junto a tus opiniones'+
     '<input id="pfNombre" type="text" maxlength="60" autocomplete="name" value="'+esc((perfil&&perfil.nombre)||'')+'"></label>'+
     '<button id="pfGuardarNombre" type="button">Guardar nombre</button></div>'+
   '<p class="perfil-nota perfil-ayuda">Si lo dejas vacío, tus opiniones aparecen como «Anónimo».</p>'+ 
   '<div class="perfil-sec">Lo que vigilas</div>'+
   (lista.length
     ? '<ul class="vig-lista">'+lista.map(n=>'<li><span>'+esc(n)+'</span><button data-q="'+esc(n)+'">quitar</button></li>').join('')+'</ul>'
     : '<p class="perfil-nota">Todavía no vigilas ninguna. Abre la ficha de cualquier plataforma del radar y pulsa «Vigilar» para guardarla aquí.</p>')+
   '<div class="perfil-sec">Avisos</div>'+
   '<label class="fila-opcion"><input type="checkbox" id="optAvisos" aria-describedby="optAvisosAyuda"'+(correoConsentido?' checked':'')+'>'+
   '<span><b>Quiero recibir por correo avisos de cambios</b> en las plataformas que vigilo. Al marcarlo doy mi consentimiento explícito, que puedo retirar aquí cuando quiera.</span></label>'+
   '<p class="perfil-nota perfil-ayuda" id="optAvisosAyuda">Está desactivado por defecto. Aunque lo aceptes, el envío todavía no está activo: faltan configurar Brevo y verificar la entrega de extremo a extremo. Consulta la <a href="/privacidad">política de privacidad</a>.</p>'+
   '<div class="perfil-pie">'+
    '<button id="pfSalir">Cerrar sesión</button>'+
    '<button class="peligro" id="pfBorrar">Borrar mi cuenta</button>'+
   '</div>';
  c.querySelectorAll('.vig-lista button').forEach(b=>b.addEventListener('click',async()=>{
   const nombre=b.dataset.q;b.disabled=true;await alternar(nombre);abrirPerfil(true);
  }));
  const g=$('pfGuardarNombre');if(g)g.addEventListener('click',async()=>{
   const n=$('pfNombre').value.trim();g.disabled=true;
   try{await rest('/perfiles?id=eq.'+encodeURIComponent(ses.uid),{method:'PATCH',body:JSON.stringify({nombre:n||null})});
     if(perfil)perfil.nombre=n||null;pinta();abrirPerfil();aviso('Nombre público guardado.');
   }catch(e){g.disabled=false;aviso('No se ha podido guardar el nombre.');}
  });
  const o=$('optAvisos'); if(o) o.addEventListener('change',async()=>{
   const anterior=correoConsentido,deseado=o.checked;o.disabled=true;
   try{
    const filas=await rest('/rpc/configurar_avisos_correo',{method:'POST',body:JSON.stringify({
     p_habilitado:deseado,p_version:VERSION_CONSENTIMIENTO_CORREO
    })});
    perfil=perfilDesdeRespuestaCorreo(perfil,filas&&filas[0],deseado);
    o.checked=consentimientoCorreoVigente(perfil);
    aviso(deseado
     ? 'Consentimiento guardado. El correo aún no está activo: faltan Brevo y la prueba de extremo a extremo.'
     : 'Consentimiento retirado. No se enviarán nuevos avisos de cambios por correo.');
   }catch(e){
    o.checked=anterior;
    aviso(deseado
     ? 'No se ha guardado el consentimiento; sigue desactivado.'
     : 'No se ha podido confirmar la retirada; la preferencia sigue activada. Vuelve a intentarlo.');
   }finally{o.disabled=false;}
  });
  const s=$('pfSalir'); if(s) s.addEventListener('click',salir);
  const b=$('pfBorrar'); if(b) b.addEventListener('click',borrar);
  if(!soloPintar)openPanel('perfilPanel');
  /* La moderación se pide DESPUÉS de abrir: si la base dice que no eres
     administrador devuelve cero filas y aquí no aparece nada. */
  if(perfil && perfil.es_admin) pintarModeracion();
 }
 /* --- moderación (solo administradores) --------------------------- */
 async function pintarModeracion(){
  const c=$('perfilCuerpo'); if(!c) return;
  let caja=$('modZona');
  if(!caja){ caja=document.createElement('div'); caja.id='modZona';
    c.querySelector('.perfil-pie').insertAdjacentElement('beforebegin',caja); }
  caja.innerHTML='<div class="perfil-sec">Moderación</div><p class="perfil-nota">Cargando…</p>';

  let filas=[];
  try{ filas=(await rest('/cola_moderacion?select=*'))||[]; }
  catch(e){ caja.innerHTML='<div class="perfil-sec">Moderación</div><p class="perfil-nota">No se ha podido cargar la cola.</p>'; return; }

  if(!filas.length){
   caja.innerHTML='<div class="perfil-sec">Moderación</div>'+
     '<p class="perfil-nota">Nada pendiente. Aquí aparecen las opiniones denunciadas y las que se han ocultado solas.</p>';
   return;
  }

  caja.innerHTML='<div class="perfil-sec">Moderación · '+filas.length+' pendiente'+(filas.length===1?'':'s')+'</div>'+
   '<p class="mod-aviso">Con tres denuncias la opinión se oculta sola. Revísala: si la queja no justifica retirarla, restáurala — '+
   'restaurar borra las denuncias para que no la vuelvan a tumbar. Cada decisión queda fechada y asociada a tu cuenta mientras exista.</p>'+
   '<ul class="mod-lista">'+filas.map(f=>{
     const motivos=(Array.isArray(f.motivos)?f.motivos:[]).map(m=>esc(m)).join(' · ');
     const denuncias=Math.max(0,Number.parseInt(f.denuncias,10)||0);
     const nota=Number(f.nota);const notaVisible=Number.isFinite(nota)?Math.max(1,Math.min(10,nota)):'—';
     return '<li class="'+(f.estado==='oculta'?'oculta':'')+'">'+
      '<div class="mod-cab"><span class="mod-den">'+denuncias+' denuncia'+(denuncias===1?'':'s')+'</span>'+
      '<span class="op-nota">'+notaVisible+'/10</span>'+
      '<span class="op-autor">'+esc(f.autor)+'</span>'+
      '<span class="mod-estado">'+esc(f.plataforma)+' · '+(f.estado==='oculta'?'oculta':'visible')+'</span></div>'+
      '<p class="mod-texto">'+esc(f.texto)+'</p>'+
      (motivos?'<p class="mod-motivos"><b>Motivos:</b> '+motivos+'</p>':'')+
      '<div class="mod-bot">'+
        (f.estado==='oculta'
          ? '<button class="restaurar" data-a="restaurar" data-o="'+esc(f.opinion_id)+'">Restaurar</button>'
          : '<button class="ocultar" data-a="ocultar" data-o="'+esc(f.opinion_id)+'">Ocultar</button>')+
      '</div></li>';
   }).join('')+'</ul>';

  caja.querySelectorAll('.mod-bot button').forEach(b=>b.addEventListener('click',async()=>{
    const motivo=prompt(b.dataset.a==='ocultar'
      ? '¿Por qué la ocultas? (queda registrado)'
      : '¿Por qué la restauras? (queda registrado)');
    if(motivo===null) return;
    b.disabled=true; b.textContent='…';
    try{
     await rest('/rpc/moderar',{method:'POST',body:JSON.stringify({
       p_opinion_id:b.dataset.o,p_accion:b.dataset.a,p_motivo:motivo.trim().slice(0,500)||null})});
     aviso(b.dataset.a==='ocultar'?'Opinión ocultada.':'Opinión restaurada.');
     await pintarModeracion();
    }catch(e){ b.disabled=false; b.textContent=b.dataset.a==='ocultar'?'Ocultar':'Restaurar'; aviso('No se ha podido.'); }
  }));
 }
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 async function salir(){
  try{ const tk=await testigo(); if(tk) await auth('/logout',null,{token:tk}); }catch(e){}
  guarda(null);identidadConfirmada=false;perfil=null;vigiladas=new Map();cerrarPanelPerfil();pinta();
  if(fichaAbierta) pintarVigilar(fichaAbierta);
  aviso('Sesión cerrada.');
 }
 async function borrar(){
  if(!confirm('Se borran tu cuenta, perfil, vigilancia, opiniones y denuncias. Las decisiones de moderación ya tomadas pueden conservarse sin vínculo con tu cuenta para atender reclamaciones.\n\nNo se puede deshacer. ¿Seguimos?')) return;
  try{
   await rest('/rpc/borrar_mi_cuenta',{method:'POST',body:'{}'});
   guarda(null);identidadConfirmada=false;perfil=null;vigiladas=new Map();cerrarPanelPerfil();pinta();
   if(fichaAbierta) pintarVigilar(fichaAbierta);
   aviso('Cuenta y datos asociados borrados.');
  }catch(e){aviso(e.status===401?'La sesión ha caducado. Vuelve a entrar.':'No se ha podido borrar la cuenta. Vuelve a intentarlo.');}
 }
 function cerrarPanelPerfil(){
  closeAll();
 }

 /* --- estado del botón de la cabecera ----------------------------- */
 function pinta(){
  const b=$('btnCuenta'); if(!b) return;
  b.disabled=!SERVICIOS_USUARIO_DISPONIBLES;
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   b.textContent='Cuentas en pausa';b.setAttribute('aria-label','Cuentas en pausa; consulta el radar sin registrarte');
   pintaMovil();return;
  }
  if(identidadConfirmada&&ses){
   const nom=(perfil&&perfil.nombre)||(ses.correo||'?').split('@')[0];
   b.innerHTML='<span class="ini">'+esc(nom.slice(0,1))+'</span>'+esc(nom.split(' ')[0].slice(0,12));
   b.setAttribute('aria-label','Tu cuenta');
  }else{ b.textContent='Entrar'; b.setAttribute('aria-label','Entrar o crear una cuenta'); }
  pintaMovil();
 }
 function pintaMovil(){
  const cantidad=vigiladas.size;
  const numero=$('movilSiguiendoCuenta'),unidad=$('movilSiguiendoUnidad');
  const texto=$('movilSiguiendoTexto'),accion=$('movilCuentaAccion');
  const insignia=$('movilSiguiendoBadge'),tab=$('movilTabSiguiendo');
  const lista=$('movilSiguiendoLista'),vacio=$('movilSiguiendoVacio'),masCuenta=$('movilMasCuenta');
  if(!SERVICIOS_USUARIO_DISPONIBLES){
   if(numero)numero.textContent='—';
   if(masCuenta)masCuenta.textContent='—';
   if(unidad)unidad.textContent='seguimiento en pausa';
   if(texto)texto.textContent='Esta versión de la web no accede a tus favoritos anteriores ni guarda seguimiento remoto.';
   if(accion){accion.textContent='Cuentas en pausa';accion.disabled=true;}
   if(insignia){insignia.textContent='';insignia.hidden=true;}
   if(tab)tab.setAttribute('aria-label','Favoritos, seguimiento en pausa');
   if(lista){lista.hidden=true;lista.innerHTML='';}
   if(vacio)vacio.hidden=false;
   return;
  }
  if(numero)numero.textContent=String(cantidad);
  if(masCuenta)masCuenta.textContent=String(cantidad);
  if(unidad)unidad.textContent=cantidad===1?'plataforma favorita':'plataformas favoritas';
  if(texto)texto.textContent=identidadConfirmada
   ?(cantidad?'Tus favoritos están guardados y puedes gestionarlos desde aquí.':'Todavía no has guardado ninguna plataforma.')
   :'Entra para consultar las plataformas que has guardado.';
  if(accion)accion.textContent=identidadConfirmada?'Abrir mis favoritos':'Entrar y abrir mis favoritos';
  if(insignia){insignia.textContent=cantidad>99?'99+':String(cantidad);insignia.hidden=!cantidad;}
  if(tab)tab.setAttribute('aria-label',cantidad?'Favoritos, '+cantidad:'Favoritos');
  if(lista&&vacio){
   const seguidas=identidadConfirmada?P.filter(p=>vigiladas.has(p.n)):[];
   const hay=seguidas.length>0;
   lista.hidden=!hay;vacio.hidden=hay;
   lista.innerHTML=hay?seguidas.map(p=>{const i=P.indexOf(p);return `
    <article class="movil-seguida ${catClase(p)}">
     ${siglaEl(p)}
     <div><h3>${escHtml(p.n)}</h3><p>${escHtml(p.tipo)} · ${escHtml(p.reg)}</p></div>
     <button type="button" data-abrir="${i}" aria-label="Abrir la ficha de ${escHtml(p.n)}">›</button>
    </article>`;}).join(''):'';
  }
 }
 function abrirGestion(){
  if(!SERVICIOS_USUARIO_DISPONIBLES){avisar('Las cuentas están en pausa. Para gestionar datos anteriores, escribe a RWAdar@protonmail.com.');return;}
  if(identidadConfirmada&&ses)abrirPerfil();
  else abrir('entrar','Entra para consultar y gestionar las plataformas que vigilas.');
 }

 /* --- arranque ---------------------------------------------------- */
 function iniciar(){
  if(!SERVICIOS_USUARIO_DISPONIBLES)return;
  const b=$('btnCuenta'); if(!b) return;          /* en el pre-renderizado no hay DOM */
  b.addEventListener('click',()=>identidadConfirmada?abrirPerfil():abrir('entrar'));
  $('cuentaX').addEventListener('click',cerrar);
  $('velo').addEventListener('click',()=>{cerrar();cerrarPanelPerfil();});
  $('perfilX').addEventListener('click',cerrarPanelPerfil);
  $('cuentaForm').addEventListener('submit',enviar);
  $('irCambiar').addEventListener('click',()=>abrir(modo==='entrar'?'registro':'entrar'));
  $('irRecuperar').addEventListener('click',()=>abrir('recuperar'));
  $('cuentaEstadoEntrar').addEventListener('click',()=>{
   const correo=correoPendiente;abrir('entrar');
   if(correo)$('cCorreo').value=correo;
  });
  $('cuentaReenviar').addEventListener('click',reenviarConfirmacion);
  $('cuentaCambiarCorreo').addEventListener('click',()=>{
   const correo=correoPendiente;abrir('registro');
   if(CORREO_AUTH_E2E&&correo)$('cCorreo').value=correo;
  });
  $('cuentaVolver').addEventListener('click',cerrar);
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&$('cuentaCaja').classList.contains('on')){e.preventDefault();cerrar();}
  });
  window.addEventListener('popstate',()=>{
   if($('cuentaCaja').classList.contains('on')&&!(history.state&&history.state.rwadarCuenta===true))cerrar(true);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){cerrar();cerrarPanelPerfil();}});

  const parametrosRetorno=typeof location!=='undefined'&&location.hash
    ?new URLSearchParams(location.hash.slice(1)):null;
  const retorno=!!(parametrosRetorno&&(parametrosRetorno.get('access_token')||
    parametrosRetorno.get('error')||parametrosRetorno.get('error_description')));
  pinta();

  /* Confirmación de correo y recuperación usan un fragmento para que los
     testigos no viajen al servidor ni queden en su registro de accesos. */
  if(retorno){
   const p=parametrosRetorno;
   const error=p.get('error_description')||p.get('error');
   const tipo=p.get('type')||'';
   const acceso=p.get('access_token');
   history.replaceState(null,'',location.pathname+location.search);
   if(error){abrir('entrar');msj(traduce(error));}
   else if(acceso&&!['signup','recovery'].includes(tipo)){
    guarda(null);identidadConfirmada=false;abrir('entrar');
    msj('El tipo de enlace no es válido. Solicita uno nuevo desde RWAdar.');
   }else if(acceso){
    guarda({access_token:acceso,refresh_token:p.get('refresh_token')||'',
      expira:Date.now()+(Number(p.get('expires_in'))||3600)*1000,correo:'',uid:''});
    confirmarIdentidad().then(async ok=>{
     if(!ok){pinta();abrir('entrar');msj('El enlace no es válido o ha caducado. Solicita uno nuevo.');return;}
     await cargarMio();pinta();if(fichaAbierta)pintarVigilar(fichaAbierta);
     if(tipo==='recovery')abrir('nueva_clave');
     else aviso('Correo confirmado en esta pestaña. Ya puedes iniciar sesión en RWAdar.');
    });
   }
  }
 }
 /* El pre-renderizado ejecuta este script en un DOM de juguete donde NO
    existen fetch ni location. Sin fetch este modulo no puede hacer nada,
    asi que esa es la senal mas fiable para salirse sin ruido. Ojo: no
    vale mirar el DOM, porque alli getElementById devuelve un nodo falso
    para cualquier id y la comprobacion pasaria igual. */
 if(typeof fetch!=='undefined' && typeof location!=='undefined'){
  if(SERVICIOS_USUARIO_DISPONIBLES)iniciar();
  else{limpiarRetornoSinServiciosUsuario();pinta();}
 }

 return {abrir:abrir,abrirGestion:abrirGestion,pintarVigilar:pintarVigilar,
         actualizarMovil:pintaMovil,hay:()=>SERVICIOS_USUARIO_DISPONIBLES&&identidadConfirmada,
         uid:()=>SERVICIOS_USUARIO_DISPONIBLES&&identidadConfirmada&&ses&&ses.uid,token:testigo};
})();

/* =================================================================
   SHELL MÓVIL / PWA
   -----------------------------------------------------------------
   Cuatro pestañas comunes a iPhone y Android, sin convertir la web de
   escritorio en otra cosa. La composición móvil cambia de jerarquía,
   pero comparte el mismo DOM y estado: no duplica datos, filtros, 3D ni
   lógica de cuenta.
   ================================================================= */
const Movil = (function(){
 const media=window.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 540px) and (hover: none) and (pointer: coarse)');
 const tabs=[...document.querySelectorAll('#movilNav [data-movil-tab]')];
 const paneles=new Map([...document.querySelectorAll('[data-movil-panel]')]
  .map(p=>[p.dataset.movilPanel,p]));
 const panelBuscar=paneles.get('buscar');
 const emisiones=document.getElementById('emisiones');
 const portada=document.querySelector('#movilPanelRadar>.portada');
 const portadaTexto=document.querySelector('.portada-txt');
 const marcador=document.querySelector('.marcador');
 const radarIntro=document.getElementById('movilRadarIntro');
 const radarPortada=document.querySelector('.portada-radar');
 const bannerAcademy=document.getElementById('movilAbrirAcademy');
 const herramienta=document.getElementById('tool');
 const barra=document.querySelector('#movilPanelRadar>.barra');
 const resultados=document.getElementById('plataformasResultados');
 const transparencia=document.getElementById('movilTransparencia');
 const academia=document.getElementById('academy');
 const explicador=document.getElementById('explain');
 const academyLeccion=document.getElementById('academyLeccion');
 const metodo=document.getElementById('metodo');
 const fuera=document.getElementById('fuera');
 const detalles=new Map([
  ['presentacion',portadaTexto],['metodo',metodo],['fuera',fuera]
 ].filter(([,nodo])=>Boolean(nodo)));
 const ordenMovil=[emisiones,herramienta,barra,radarIntro,radarPortada,marcador,bannerAcademy,resultados,transparencia,academia,portadaTexto,portada].filter(Boolean);
 const movibles=[...ordenMovil,explicador].filter(Boolean);
 const anclas=new Map();
 if(typeof document.createComment==='function')movibles.forEach((nodo,indice)=>{
  if(!nodo.parentNode)return;
  const ancla=document.createComment('rwadar: posición de escritorio '+indice);
  nodo.parentNode.insertBefore(ancla,nodo);anclas.set(nodo,ancla);
 });
 const cabEtiqueta=document.getElementById('movilCabeceraEtiqueta');
 const cabTitulo=document.getElementById('movilCabeceraTitulo');
 const cabSub=document.getElementById('movilCabeceraSub');
 const total=(document.getElementById('s1')&&document.getElementById('s1').textContent.trim())||'26';
 const textos={
  buscar:['EXPLORAR RWADAR','Buscar','Ofertas y '+total+' plataformas contrastadas'],
  favoritos:['TU SELECCIÓN','Favoritos','Plataformas guardadas, no inversiones'],
  inversiones:['SIN DATOS DE OPERACIONES','Inversiones','RWAdar todavía no registra operaciones'],
  cuenta:['TU ESPACIO','Mi cuenta','Perfil, seguridad, privacidad y preferencias']
 };
 let activa='buscar',academyAbierta=false,academyOrigen=null,academyHistorial=false,avisosHistorial=false;
 let detalleAbierto=null,detalleOrigen=null,detalleHistorial=false;
 let modoMovilPrevio=media.matches;

 const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const visible=nodo=>Boolean(nodo&&nodo.isConnected&&nodo.getClientRects&&nodo.getClientRects().length);
 const enVista=nodo=>{
  if(!visible(nodo)||!nodo.getBoundingClientRect)return false;
  const r=nodo.getBoundingClientRect();
  return r.bottom>0&&r.top<window.innerHeight&&r.right>0&&r.left<window.innerWidth;
 };
 function devolverFoco(origen,alternativo){
  const destino=visible(origen)?origen:alternativo;
  if(!visible(destino))return;
  setTimeout(()=>{
   if(!visible(destino))return;
   if(!enVista(destino)&&destino.scrollIntoView)
    destino.scrollIntoView({block:'center',behavior:'auto'});
   destino.focus({preventScroll:true});
  },60);
 }
 function estadoBaseSubvista(){
  const estado=typeof history!=='undefined'&&history.state&&typeof history.state==='object'
   ?{...history.state}:{};
  delete estado.rwadarDetalle;delete estado.rwadarAcademy;delete estado.rwadarAvisos;
  return estado;
 }
 function geometria(){
  /* hidden deja canvas y SVG a ancho cero. Dos fotogramas permiten que
     el navegador recomponga antes de que WebGL vuelva a medir. */
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.dispatchEvent(new Event('resize'))));
 }
 function cabecera(id){
  const t=textos[id]||textos.buscar;
  if(cabEtiqueta)cabEtiqueta.textContent=t[0];
  if(cabTitulo)cabTitulo.textContent=t[1];
  if(cabSub)cabSub.textContent=t[2];
 }
 function restaurarEscritorio(){
  anclas.forEach((ancla,nodo)=>{
   if(ancla&&ancla.parentNode&&ancla.nextSibling!==nodo)ancla.parentNode.insertBefore(nodo,ancla.nextSibling);
  });
 }
 function ordenarBuscar(esMovil){
  if(!panelBuscar)return;
  if(esMovil){
   /* Mover los nodos reales evita que flex order enseñe una cosa mientras
      Tab y el lector de pantalla recorren otra. No se clona ningún dato. */
   const referencia=metodo&&metodo.parentNode===panelBuscar?metodo:null;
   ordenMovil.forEach(nodo=>panelBuscar.insertBefore(nodo,referencia));
   if(explicador&&academyLeccion&&explicador.parentNode!==academyLeccion)academyLeccion.appendChild(explicador);
   if(academia)academia.hidden=!academyAbierta;
   const informacion=document.getElementById('emisInformacion');
   if(informacion)informacion.open=!emisiones||!emisiones.classList.contains('sin-emisiones');
  }else{
   restaurarEscritorio();
   academyAbierta=false;academyHistorial=false;academyOrigen=null;
   detalleAbierto=null;detalleHistorial=false;detalleOrigen=null;
   detalles.forEach(nodo=>nodo.classList.remove('movil-detalle-activo'));
   if(academia)academia.hidden=false;
   const informacion=document.getElementById('emisInformacion');if(informacion)informacion.open=true;
   panelBuscar.classList.remove('movil-academy-abierta','movil-detalle-abierto');
  }
 }
 function cabeceraAcademy(){
  if(cabEtiqueta)cabEtiqueta.textContent='APRENDE A TU RITMO';
  if(cabTitulo)cabTitulo.textContent='RWAdar Academy';
  if(cabSub)cabSub.textContent='Tokenización, inversión, seguridad y riesgos';
 }
 function cerrarAcademyVisual(enfocar=true){
  if(!academyAbierta)return;
  academyAbierta=false;academyHistorial=false;
  if(panelBuscar)panelBuscar.classList.remove('movil-academy-abierta');
  if(academia)academia.hidden=true;
  document.querySelectorAll('[data-movil-action="academy"]').forEach(b=>b.setAttribute('aria-expanded','false'));
  cabecera('buscar');
  window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  const origen=academyOrigen;academyOrigen=null;
  if(enfocar)devolverFoco(origen,document.getElementById('q')||document.getElementById('movilTabRadar'));
 }
 function mostrarAcademy(mostrar,enfocar=true,gestionarHistorial=true,origen=null){
  if(!media.matches||!academia||!panelBuscar)return;
  if(mostrar){
   if(!academyAbierta){
    academyOrigen=origen||document.activeElement;
    academyAbierta=true;academia.hidden=false;
    panelBuscar.classList.add('movil-academy-abierta');
    document.querySelectorAll('[data-movil-action="academy"]').forEach(b=>b.setAttribute('aria-expanded','true'));
    cabeceraAcademy();
    /* La lección se abre siempre por el principio. El temporizador puede
       seguir contando mientras la subvista está oculta, pero nunca debe
       recibir a la persona en el último paso sin haberlo elegido. */
    if(typeof irPaso==='function')irPaso(0,false);
    if(typeof reiniciarPasosAutomaticos==='function')reiniciarPasosAutomaticos();
    if(gestionarHistorial&&typeof history!=='undefined'&&history.pushState){
     history.pushState({...estadoBaseSubvista(),rwadarAcademy:true},'',location.href);academyHistorial=true;
    }
   }
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});geometria();
   if(enfocar)setTimeout(()=>document.getElementById('movilCerrarAcademy')?.focus({preventScroll:true}),60);
  }else if(academyAbierta){
   if(gestionarHistorial&&academyHistorial&&history.state&&history.state.rwadarAcademy===true)history.back();
   else cerrarAcademyVisual(enfocar);
  }
 }
 function abrirAcademyDesde(origen){
  if(academyAbierta){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
   setTimeout(()=>document.getElementById('movilCerrarAcademy')?.focus({preventScroll:true}),60);
   return;
  }
  /* Si Academy sustituye a un detalle abierto, reutiliza la misma entrada
     del historial. Así Atrás vuelve una sola vez a Buscar y el popstate del
     detalle anterior no cierra la lección recién abierta. */
  const sustituyeDetalle=detalleAbierto&&detalleHistorial&&history.state&&
   history.state.rwadarDetalle===detalleAbierto;
  const vistaAvisos=document.getElementById('movilVistaAvisos');
  const sustituyeAvisos=vistaAvisos&&!vistaAvisos.hidden&&avisosHistorial&&history.state&&
   history.state.rwadarAvisos===true;
  if(detalleAbierto)cerrarDetalleVisual(false);
  if(vistaAvisos&&!vistaAvisos.hidden){avisosHistorial=false;mostrarAvisos(false,false,false);}
  cambiar('buscar',{arriba:false});
  if((sustituyeDetalle||sustituyeAvisos)&&typeof history!=='undefined'&&history.replaceState){
   const estado={...estadoBaseSubvista(),rwadarAcademy:true};
   history.replaceState(estado,'',location.href);
   mostrarAcademy(true,true,false,origen);academyHistorial=true;
  }else mostrarAcademy(true,true,true,origen);
 }
 const textosDetalle={
  presentacion:['QUÉ INCLUYE EL RADAR','Qué analiza RWAdar','Alcance, límites y lectura del registro'],
  metodo:['CRITERIOS CONTRASTADOS','Método de selección','Cómo decidimos qué plataformas entran'],
  fuera:['TRANSPARENCIA','Fuera del radar','Descartes publicados con su motivo y sus fuentes']
 };
 function cabeceraDetalle(id){
  const t=textosDetalle[id]||textos.buscar;
  if(cabEtiqueta)cabEtiqueta.textContent=t[0];
  if(cabTitulo)cabTitulo.textContent=t[1];
  if(cabSub)cabSub.textContent=t[2];
 }
 function cerrarDetalleVisual(enfocar=true){
  if(!detalleAbierto)return;
  const anterior=detalleAbierto;
  detalleAbierto=null;detalleHistorial=false;
  if(panelBuscar)panelBuscar.classList.remove('movil-detalle-abierto');
  detalles.forEach(nodo=>nodo.classList.remove('movil-detalle-activo'));
  document.querySelectorAll('[data-movil-action="detalle"]').forEach(b=>
   b.setAttribute('aria-expanded','false'));
  cabecera('buscar');
  window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  const origen=detalleOrigen;detalleOrigen=null;
  const alternativo=document.getElementById('q')||document.getElementById('movilTabRadar');
  if(enfocar)devolverFoco(origen,alternativo);
  return anterior;
 }
 function mostrarDetalle(id,enfocar=true,gestionarHistorial=true,origen=null){
  const objetivo=detalles.get(id);
  if(!media.matches||!objetivo||!panelBuscar)return;
  if(detalleAbierto===id){
   if(gestionarHistorial&&detalleHistorial&&history.state&&history.state.rwadarDetalle===id)history.back();
   else cerrarDetalleVisual(enfocar);
   return;
  }
  if(detalleAbierto)cerrarDetalleVisual(false);
  if(academyAbierta)cerrarAcademyVisual(false);
  movilFiltrosAbiertos=false;actualizarFiltrosMoviles();
  detalleOrigen=origen||document.activeElement;
  detalleAbierto=id;
  detalles.forEach((nodo,clave)=>nodo.classList.toggle('movil-detalle-activo',clave===id));
  panelBuscar.classList.add('movil-detalle-abierto');
  document.querySelectorAll('[data-movil-action="detalle"]').forEach(b=>
   b.setAttribute('aria-expanded',b.dataset.movilDetalle===id?'true':'false'));
  cabeceraDetalle(id);
  if(gestionarHistorial&&typeof history!=='undefined'&&history.pushState){
   history.pushState({...estadoBaseSubvista(),rwadarDetalle:id},'',location.href);detalleHistorial=true;
  }
  window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});geometria();
  if(enfocar)setTimeout(()=>objetivo.querySelector('.movil-subvista-volver')?.focus({preventScroll:true}),60);
 }
 function mostrarAvisos(mostrar,enfocar=true,gestionarHistorial=true){
  const panel=document.getElementById('movilPanelMas');
  const vista=document.getElementById('movilVistaAvisos');
  const abre=document.getElementById('movilAbrirAvisos');
  if(!panel||!vista||!abre)return;
  const estabaAbierta=!vista.hidden;
  if(mostrar&&!estabaAbierta&&gestionarHistorial&&media.matches&&typeof history!=='undefined'&&history.pushState){
   history.pushState({...estadoBaseSubvista(),rwadarAvisos:true},'',location.href);avisosHistorial=true;
  }
  if(!mostrar&&estabaAbierta&&gestionarHistorial&&avisosHistorial&&history.state&&history.state.rwadarAvisos===true){
   avisosHistorial=false;history.back();if(enfocar)return;
  }
  vista.hidden=!mostrar;
  panel.classList.toggle('movil-subvista-abierta',mostrar);
  abre.setAttribute('aria-expanded',mostrar?'true':'false');
  if(!mostrar)avisosHistorial=false;
  if(!enfocar)return;
  if(mostrar){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
   requestAnimationFrame(()=>document.getElementById('movilCerrarAvisos')?.focus({preventScroll:true}));
  }else abre.focus({preventScroll:true});
 }
 function pintarSonidoMovil(){
  const boton=document.getElementById('movilSonido');
  const estado=document.getElementById('movilSonidoEstado');
  if(boton)boton.setAttribute('aria-pressed',Sonido.activo?'true':'false');
  if(estado)estado.textContent=Sonido.activo?'Activado':'Desactivado';
 }
 function cambiar(id,opciones){
  if(!media.matches||!paneles.has(id))return;
  if(detalleAbierto){
   const volver=detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto;
   cerrarDetalleVisual(false);if(volver)history.back();
  }
  if(academyAbierta){
   const volver=academyHistorial&&history.state&&history.state.rwadarAcademy===true;
   cerrarAcademyVisual(false);if(volver)history.back();
  }
  if(id!=='buscar'&&movilFiltrosAbiertos){movilFiltrosAbiertos=false;actualizarFiltrosMoviles();}
  if(id!=='cuenta'||activa==='cuenta')mostrarAvisos(false,false);
  activa=id;
  document.body.dataset.movilPestana=id;
  paneles.forEach((panel,nombre)=>{panel.hidden=nombre!==id;});
  tabs.forEach(tab=>{
   const elegida=tab.dataset.movilTab===id;
   tab.setAttribute('aria-selected',elegida?'true':'false');
   tab.tabIndex=elegida?0:-1;
  });
  cabecera(id);
  if(!opciones||opciones.arriba!==false){
   window.scrollTo({top:0,behavior:reduce()?'auto':'smooth'});
  }
  if(id==='buscar')geometria();
 }
 function adaptar(){
  const esMovil=media.matches;
  modoMovilPrevio=esMovil;
  ordenarBuscar(esMovil);
  if(document.documentElement&&document.documentElement.classList)
   document.documentElement.classList.toggle('movil-ui',esMovil);
  if(esMovil){cambiar(activa,{arriba:false});Cuenta.actualizarMovil();pintarSonidoMovil();}
  else{
   mostrarAvisos(false,false);
   document.body.removeAttribute('data-movil-pestana');
   document.body.classList.remove('movil-teclado');
   paneles.forEach((panel,nombre)=>{panel.hidden=nombre!=='buscar';});
   geometria();
  }
 }
 function ir(destino,origen=null){
  cambiar('buscar',{arriba:false});
  if(detalles.has(destino)){
   requestAnimationFrame(()=>mostrarDetalle(destino,true,true,origen));
   return;
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const objetivo=destino==='top'?document.getElementById('top'):document.getElementById(destino);
   if(objetivo)objetivo.scrollIntoView({block:'start',behavior:reduce()?'auto':'smooth'});
   geometria();
  }));
 }

 tabs.forEach((tab,indice)=>{
  tab.addEventListener('click',()=>cambiar(tab.dataset.movilTab));
  tab.addEventListener('keydown',e=>{
   let siguiente=null;
   if(e.key==='ArrowRight')siguiente=(indice+1)%tabs.length;
   if(e.key==='ArrowLeft')siguiente=(indice-1+tabs.length)%tabs.length;
   if(e.key==='Home')siguiente=0;
   if(e.key==='End')siguiente=tabs.length-1;
   if(siguiente==null)return;
   e.preventDefault();cambiar(tabs[siguiente].dataset.movilTab);
   tabs[siguiente].focus({preventScroll:true});
  });
 });
 document.addEventListener('click',e=>{
  if(!media.matches)return;
  const cambio=e.target.closest&&e.target.closest('[data-movil-cambiar]');
  if(cambio){e.preventDefault();e.stopImmediatePropagation();cambiar(cambio.dataset.movilCambiar);return;}
  const destino=e.target.closest&&e.target.closest('[data-movil-ir]');
  if(destino){e.preventDefault();e.stopImmediatePropagation();ir(destino.dataset.movilIr,destino);return;}
  const accion=e.target.closest&&e.target.closest('[data-movil-action]');
  if(!accion)return;
  e.stopImmediatePropagation();
  if(accion.dataset.movilAction==='ayuda'){
   e.preventDefault();abrirAcademyDesde(accion);
  }
  if(accion.dataset.movilAction==='academy'){
   e.preventDefault();abrirAcademyDesde(accion);
  }
  if(accion.dataset.movilAction==='detalle'){
   e.preventDefault();cambiar('buscar',{arriba:false});mostrarDetalle(accion.dataset.movilDetalle,true,true,accion);
  }
  if(accion.dataset.movilAction==='cerrar-detalle'){
   e.preventDefault();
   if(detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto)history.back();
   else cerrarDetalleVisual(true);
  }
  if(accion.dataset.movilAction==='cerrar-academy'){e.preventDefault();mostrarAcademy(false);}
  if(accion.dataset.movilAction==='cuenta'){e.preventDefault();Cuenta.abrirGestion();}
  if(accion.dataset.movilAction==='avisos'){e.preventDefault();mostrarAvisos(true);}
  if(accion.dataset.movilAction==='cerrar-avisos'){e.preventDefault();mostrarAvisos(false);}
  if(accion.dataset.movilAction==='sonido'){
   e.preventDefault();
   const interruptor=document.getElementById('snd');
   if(interruptor)interruptor.click();
   pintarSonidoMovil();
  }
 });
 document.addEventListener('focusin',e=>{
  if(media.matches&&e.target.matches&&e.target.matches('input:not([type="range"]),textarea,select'))
   document.body.classList.add('movil-teclado');
 });
 document.addEventListener('focusout',()=>setTimeout(()=>{
  const a=document.activeElement;
  if(!a||!a.matches||!a.matches('input:not([type="range"]),textarea,select'))
   document.body.classList.remove('movil-teclado');
 },80));
 document.addEventListener('keydown',e=>{
  if(!media.matches||e.key!=='Escape')return;
  if(detalleAbierto){
   e.preventDefault();
   if(detalleHistorial&&history.state&&history.state.rwadarDetalle===detalleAbierto)history.back();
   else cerrarDetalleVisual(true);
   return;
  }
  if(academyAbierta){e.preventDefault();mostrarAcademy(false);return;}
  if(movilFiltrosAbiertos){
   e.preventDefault();movilFiltrosAbiertos=false;actualizarFiltrosMoviles();
   document.getElementById('movilFiltrosToggle')?.focus({preventScroll:true});return;
  }
  const avisos=document.getElementById('movilVistaAvisos');
  if(avisos&&!avisos.hidden){e.preventDefault();mostrarAvisos(false);}
 });
 function reconciliarEstadoSubvista(enfocar=true){
  if(!media.matches)return;
  const estado=history.state&&typeof history.state==='object'?history.state:{};
  if(estado.rwadarDetalle&&detalles.has(estado.rwadarDetalle)){
   if(detalleAbierto!==estado.rwadarDetalle){
    if(detalleAbierto)cerrarDetalleVisual(false);
    if(academyAbierta)cerrarAcademyVisual(false);
    cambiar('buscar',{arriba:false});
    const origen=document.querySelector('[data-movil-action="detalle"][data-movil-detalle="'+estado.rwadarDetalle+'"]');
    mostrarDetalle(estado.rwadarDetalle,enfocar,false,origen);detalleHistorial=true;
   }
  }else if(estado.rwadarAcademy===true){
   if(!academyAbierta){
    if(detalleAbierto)cerrarDetalleVisual(false);
    cambiar('buscar',{arriba:false});
    mostrarAcademy(true,enfocar,false,document.getElementById('movilAbrirAcademy'));academyHistorial=true;
   }
  }else{
   if(detalleAbierto)cerrarDetalleVisual(enfocar);
   if(academyAbierta)cerrarAcademyVisual(enfocar);
  }
  const avisos=document.getElementById('movilVistaAvisos');
  if(avisos&&avisos.hidden&&estado.rwadarAvisos===true){
   cambiar('cuenta',{arriba:false});
   mostrarAvisos(true,enfocar,false);avisosHistorial=true;
  }else if(avisos&&!avisos.hidden&&estado.rwadarAvisos!==true){
   avisosHistorial=false;mostrarAvisos(false,enfocar,false);
  }
 }
 window.addEventListener('popstate',()=>reconciliarEstadoSubvista(true));
 const standalone=(typeof navigator!=='undefined'&&navigator.standalone===true)||
  window.matchMedia('(display-mode: standalone)').matches;
 if(document.documentElement&&document.documentElement.classList)
  document.documentElement.classList.toggle('pwa-standalone',standalone);
 if(media.addEventListener)media.addEventListener('change',adaptar);
 else if(media.addListener)media.addListener(adaptar);
 window.addEventListener('resize',()=>{
  /* Algunos WebViews cambian el viewport sin emitir change en MediaQueryList
     (por ejemplo, al pasar de una ventana compacta a una grande). */
  if(media.matches!==modoMovilPrevio)adaptar();
 });
 window.addEventListener('pageshow',e=>{
  /* BFCache conserva DOM y variables. Repetir adaptar() en ese caso
     cerraría una subvista válida y podría lanzar un history.back() antes
     de reconciliarla. Solo se recompone si hubo carga real o cambió el
     breakpoint mientras la página estaba aparcada. */
  if(!e.persisted||media.matches!==modoMovilPrevio)adaptar();
  if(media.matches){reconciliarEstadoSubvista(false);if(activa==='buscar')geometria();}
 });
 adaptar();
 return {cambiar:cambiar};
})();

/* Una sola delegación sustituye todos los atributos onclick/onkeydown.
   Mantener el comportamiento fuera del marcado permite una CSP estricta. */
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-ir],[data-vista],[data-accion],[data-filtrar-cat],[data-abrir],[data-comparar],.paso[data-s]');
 if(!b)return;
 if(b.dataset.ir)return irA(b.dataset.ir);
 if(b.classList.contains('paso'))return irPaso(Number(b.dataset.s),true);
 if(b.dataset.vista)return setView(b.dataset.vista);
 if(b.hasAttribute('data-filtrar-cat')){
  const valor=b.dataset.filtrarCat||'';S2.cat=valor;render();
  requestAnimationFrame(()=>[...document.querySelectorAll('[data-filtrar-cat]')]
   .find(x=>(x.dataset.filtrarCat||'')===valor)?.focus({preventScroll:true}));return;
 }
 if(b.dataset.abrir!=null){const i=Number(b.dataset.abrir);if(Number.isInteger(i))return openDrawer(i);}
 if(b.dataset.comparar!=null){const i=Number(b.dataset.comparar);if(Number.isInteger(i))return toggleCompare(i);}
 if(b.dataset.accion==='limpiar')return resetAll();
 if(b.dataset.accion==='alternar-filtros')return alternarFiltrosMoviles();
 if(b.dataset.accion==='alternar-resultados')return alternarResultadosMoviles();
 if(b.dataset.accion==='comparar')return openCompare();
 if(b.dataset.accion==='vaciar-comparacion')return clearCompare();
 if(b.dataset.accion==='cerrar-panel')return closeAll();
 if(b.dataset.accion==='descargar-csv')return downloadCSV();
});

/* El trabajador solo se registra en HTTP(S), nunca durante el pre-render ni
   al abrir el archivo directamente. `updateViaCache:none` y update() evitan
   que iOS reanude durante horas un trabajador ya superado. Cuando cambia el
   controlador se recarga una sola vez el documento que ya estaba abierto:
   en la página nueva el controlador ya existe y no se crea ningún bucle. */
if(typeof navigator!=='undefined'&&'serviceWorker' in navigator&&
   typeof location!=='undefined'&&/^https?:$/.test(location.protocol)){
 window.addEventListener('load',async()=>{
  const trabajador=navigator.serviceWorker;
  const yaControlada=!!trabajador.controller;
  let recargando=false;
  trabajador.addEventListener('controllerchange',()=>{
   if(!yaControlada||recargando)return;
   recargando=true;
   location.reload();
  });
  try{
   const registro=await trabajador.register('/sw.js',{updateViaCache:'none'});
   const revisar=()=>registro.update().catch(()=>{});
   window.addEventListener('pageshow',e=>{if(e.persisted)revisar();});
   document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')revisar();
   });
   await revisar();
  }catch(_){}
 },{once:true});
}

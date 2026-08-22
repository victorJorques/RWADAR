/* =================================================================
   ▸ PLATAFORMAS EN EL RADAR · las que pasan los 4 criterios
     Para añadir una, copia un bloque { … } entero y pégalo al final.
     cat:    Inmobiliario | Crédito privado | Tesoro y fondos |
             Acciones y capital privado | Materias primas | Infraestructura
     acceso: Minorista | Acreditado | Institucional | Empresas
     aval:   el motivo concreto por el que supera el filtro
   ================================================================= */
const P=[
 {n:"ADDX",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"Asia-Pacífico",cadenas:"Varias",ticket:"Alto",acceso:"Acreditado",web:"https://addx.co",aval:"Licencia de mercado reconocido del MAS de Singapur; accionistas de referencia: la bolsa SGX y el fondo estatal Temasek.",nota:"Fondos de capital riesgo y private equity troceados para inversores acreditados.",ver:"2026-07-26"},
 {n:"Archax",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"Reino Unido",cadenas:"Varias",ticket:"Alto",acceso:"Institucional",web:"https://archax.com",aval:"Autorizada y supervisada por la FCA británica con el número 838656, como exchange, bróker y custodio, e inscrita en su registro de criptoactivos. Tiene permiso para operar un sistema multilateral de negociación, no solo para intermediar.",nota:"Mercado regulado de valores digitales en Londres que reúne emisión, negociación y custodia bajo la misma licencia. Cuidado con los clones: la FCA tiene avisos publicados sobre webs que la suplantan, y el dominio válido es archax.com.",ver:"2026-08-08"},
 {n:"ARTEX Global Markets",cat:"Materias primas",tipo:"Marketplace",reg:"Liechtenstein",cadenas:"Mercado regulado (MTF)",ticket:"Alto",acceso:"Acreditado",web:"https://www.artexgm.com",aval:"Licencia de sistema multilateral de negociación (MTF) bajo MiFID II del regulador de Liechtenstein; SIX aporta compensación y liquidación.",nota:"Mercado regulado de acciones sobre obras de arte: cada cuadro se trocea en acciones de 100 €. Ojo: el token «ARTEX» de BNB Chain no tiene relación con esta plataforma.",ver:"2026-07-26"},
 {n:"Backed Finance",cat:"Acciones y capital privado",tipo:"Emisor",reg:"Suiza",cadenas:"Ethereum, Base, Gnosis",ticket:"Bajo",acceso:"Minorista",web:"https://backed.fi",aval:"Emisor suizo con el activo real depositado 1:1 en custodia de un tercero y atestaciones públicas de respaldo.",nota:"Réplicas tokenizadas de acciones y bonos cotizados, activas desde 2021.",ver:"2026-07-26"},
 {n:"Blocksquare",cat:"Inmobiliario",tipo:"Infraestructura",reg:"Unión Europea",cadenas:"Ethereum",ticket:"No aplica",acceso:"Empresas",web:"https://blocksquare.io",aval:"Vincula cada token a una anotación en el registro de la propiedad, no solo a un contrato inteligente.",nota:"Tecnología para que una inmobiliaria tokenice sus propios activos con respaldo registral.",ver:"2026-07-26"},
 {n:"Centrifuge",cat:"Crédito privado",tipo:"Infraestructura",reg:"Global",cadenas:"Ethereum, Base",ticket:"Alto",acceso:"Institucional",web:"https://centrifuge.io",aval:"Una de las tres plataformas que concentran dos tercios del crédito privado tokenizado; estructura de tramos senior/junior.",nota:"Financiación de carteras de préstamos y facturas con garantía fuera de cadena. Tuvo impagos por 5,8 M$ en 2023 y reforzó su modelo después.",ver:"2026-07-26"},
 {n:"Courtyard",cat:"Materias primas",tipo:"Marketplace",reg:"EE. UU.",cadenas:"Polygon",ticket:"Bajo",acceso:"Minorista",web:"https://courtyard.io",aval:"El objeto físico se guarda en cámara asegurada y el token es canjeable por él en cualquier momento: respaldo comprobable.",nota:"Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados. Líder por volumen semanal en 2026.",ver:"2026-07-26"},
 {n:"Figure",cat:"Crédito privado",tipo:"Emisor",reg:"EE. UU.",cadenas:"Provenance",ticket:"Alto",acceso:"Institucional",web:"https://figure.com",aval:"Cotiza en Nasdaq (FIGR): cuentas auditadas, información pública trimestral y supervisión de la SEC como emisor.",nota:"Mercado de capitales nativo en blockchain para crédito privado y activos tokenizados, con préstamos hipotecarios (HELOC) en su propia cadena.",ver:"2026-07-26"},
 {n:"Fireblocks",cat:"Infraestructura",tipo:"Infraestructura",reg:"Global",cadenas:"Varias",ticket:"No aplica",acceso:"Empresas",web:"https://fireblocks.com",aval:"Custodia institucional con seguros y certificaciones de seguridad, usada por bancos y gestoras de primer nivel.",nota:"El motor de custodia y emisión detrás de decenas de proyectos institucionales de tokenización.",ver:"2026-07-26"},
 {n:"Franklin Templeton",cat:"Tesoro y fondos",tipo:"Emisor",reg:"EE. UU.",cadenas:"Stellar, Varias",ticket:"Bajo",acceso:"Minorista",web:"https://franklintempleton.com",aval:"Gestora tradicional con décadas de historial y fondo registrado ante la SEC. La vía más conservadora para empezar.",nota:"Fondo monetario de deuda pública con el registro de partícipes llevado en cadena desde 2021.",ver:"2026-07-26"},
 {n:"INX",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"EE. UU.",cadenas:"Ethereum",ticket:"Bajo",acceso:"Minorista",web:"https://inx.co",aval:"Bróker-dealer registrado ante la SEC y miembro de FINRA; su matriz cotiza en Nasdaq.",nota:"Plataforma regulada de valores digitales con negociación secundaria abierta a minoristas.",ver:"2026-07-26"},
 {n:"Lofty",cat:"Inmobiliario",tipo:"Marketplace",reg:"EE. UU.",cadenas:"Algorand",ticket:"Bajo",acceso:"Minorista",web:"https://lofty.ai",aval:"Estructura de LLC por inmueble con oferta registrada; una de las pocas vías reales de entrada minorista al inmobiliario tokenizado.",nota:"Vivienda unifamiliar troceada desde 50 $, con reparto de renta diario y voto de los inversores en cada propiedad.",ver:"2026-07-26"},
 {n:"Maple Finance",cat:"Crédito privado",tipo:"Emisor",reg:"Global",cadenas:"Ethereum, Solana",ticket:"Alto",acceso:"Institucional",web:"https://maple.finance",aval:"Cifras auditadas y publicadas cada trimestre en formato de resultados; crédito institucional integrado con Robinhood y Kraken.",nota:"El mayor actor del crédito privado tokenizado: cerró el primer semestre de 2026 con 4.600 M$ gestionados (+81 % interanual) y 1.900 M$ en préstamos vivos.",ver:"2026-07-26"},
 {n:"Midas",cat:"Tesoro y fondos",tipo:"Emisor",reg:"Unión Europea",cadenas:"Ethereum",ticket:"Medio",acceso:"Minorista",web:"https://midas.app",aval:"Emite bajo folleto aprobado en la Unión Europea, lo que obliga a información periódica y responsabilidad del emisor.",nota:"Certificados tokenizados sobre estrategias de renta fija. Levantó 50 M$ con Franklin Templeton y Coinbase Ventures.",ver:"2026-07-26"},
 {n:"Ondo Finance",cat:"Tesoro y fondos",tipo:"Emisor",reg:"EE. UU.",cadenas:"Ethereum, Solana",ticket:"Alto",acceso:"Acreditado",web:"https://ondo.finance",aval:"La mayor plataforma de valores tokenizados por volumen, con los activos subyacentes en custodia de gestoras reguladas.",nota:"Exposición a deuda pública de EE. UU. y, desde 2026, a ETFs de Franklin Templeton tokenizados.",ver:"2026-07-26"},
 {n:"OpenEden",cat:"Tesoro y fondos",tipo:"Emisor",reg:"Asia-Pacífico",cadenas:"Ethereum, Arbitrum",ticket:"Alto",acceso:"Institucional",web:"https://openeden.com",aval:"Estructura de fondo con calificación crediticia de agencia y reservas en letras del Tesoro custodiadas por un tercero.",nota:"Letras del Tesoro de EE. UU. envueltas en un token de suscripción y reembolso, para clientes profesionales.",ver:"2026-07-26"},
 {n:"Pax Gold",cat:"Materias primas",tipo:"Emisor",reg:"EE. UU.",cadenas:"Ethereum",ticket:"Bajo",acceso:"Minorista",web:"https://paxos.com/paxgold",aval:"Emitido por Paxos bajo supervisión del regulador bancario de Nueva York (NYDFS), con atestaciones mensuales del oro asignado.",nota:"Cada token representa una onza concreta de oro asignada en cámaras de Londres, identificable por número de lingote.",ver:"2026-07-26"},
 {n:"Reental",cat:"Inmobiliario",tipo:"Emisor",reg:"España",cadenas:"Varias",ticket:"Bajo",acceso:"Minorista",web:"https://reental.co",aval:"Historial de proyectos completados y devueltos, con cientos de reseñas públicas verificadas de inversores.",nota:"Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.",ver:"2026-07-26"},
 {n:"Republic",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"EE. UU.",cadenas:"Varias",ticket:"Bajo",acceso:"Minorista",web:"https://republic.com",aval:"Opera con entidades registradas y supervisadas en EE. UU.: OpenDeal Portal LLC como portal de financiación ante la SEC y FINRA desde 2016, y OpenDeal Broker LLC como bróker-dealer miembro de FINRA y SIPC.",nota:"Mercados privados troceados desde importes pequeños: empresas sin cotizar, fondos, cine, deporte y arte. Importante: sus Mirror Tokens no son acciones de la empresa que replican, sino pagarés de la propia Republic que pagan solo si llega una salida a bolsa o una compra.",ver:"2026-08-08"},
 {n:"Securitize",cat:"Tesoro y fondos",tipo:"Infraestructura",reg:"EE. UU.",cadenas:"Varias",ticket:"Alto",acceso:"Institucional",web:"https://securitize.io",aval:"Agente de transferencia registrado ante la SEC. Es quien emite y administra el fondo tokenizado BUIDL de BlackRock.",nota:"La infraestructura sobre la que las grandes gestoras sacan sus fondos a la cadena. El nombre más institucional del sector.",ver:"2026-07-26"},
 {n:"Spiko",cat:"Tesoro y fondos",tipo:"Emisor",reg:"Unión Europea",cadenas:"Varias",ticket:"Bajo",acceso:"Empresas",web:"https://spiko.io",aval:"Fondos monetarios autorizados y supervisados por la AMF, el regulador financiero francés. Marco europeo completo.",nota:"Fondos en euros y dólares pensados para la tesorería de empresas, con reembolso diario.",ver:"2026-07-26"},
 {n:"Superstate",cat:"Tesoro y fondos",tipo:"Emisor",reg:"EE. UU.",cadenas:"Ethereum",ticket:"Alto",acceso:"Acreditado",web:"https://superstate.co",aval:"Fondos estadounidenses registrados con administrador y auditor independientes; fundada por un antiguo responsable de Compound.",nota:"Fondos de deuda pública con las participaciones anotadas directamente en cadena.",ver:"2026-07-26"},
 {n:"Swarm",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"Unión Europea",cadenas:"Polygon",ticket:"Bajo",acceso:"Minorista",web:"https://swarm.com",aval:"Opera bajo licencia de intermediación financiera de BaFin, el regulador alemán, con respaldo 1:1 verificable.",nota:"Acciones y bonos tokenizados negociables dentro del marco regulatorio alemán.",ver:"2026-07-26"},
 {n:"Taurus",cat:"Infraestructura",tipo:"Infraestructura",reg:"Suiza",cadenas:"Varias",ticket:"No aplica",acceso:"Empresas",web:"https://taurushq.com",aval:"Proveedor suizo de custodia para bancos regulados, con despliegues verificables en entidades europeas.",nota:"Custodia y emisión de valores digitales para banca, con la exigencia de auditoría del sector bancario.",ver:"2026-07-26"},
 {n:"Tokeny",cat:"Infraestructura",tipo:"Infraestructura",reg:"Unión Europea",cadenas:"Varias",ticket:"No aplica",acceso:"Empresas",web:"https://tokeny.com",aval:"Autora del estándar ERC-3643, hoy la referencia del sector para tokens con reglas de cumplimiento incorporadas.",nota:"La capa de cumplimiento normativo que usan decenas de emisores institucionales.",ver:"2026-07-26"},
 {n:"tZERO",cat:"Acciones y capital privado",tipo:"Marketplace",reg:"EE. UU.",cadenas:"Varias",ticket:"Bajo",acceso:"Minorista",web:"https://tzero.com",aval:"Opera un sistema alternativo de negociación (ATS) autorizado por la SEC y supervisado por FINRA.",nota:"El mercado secundario de referencia en EE. UU. para valores emitidos en cadena.",ver:"2026-07-26"},
];

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
  document.querySelectorAll('.paso').forEach((d,k)=>d.classList.toggle('on',k===i));
  document.querySelectorAll('.ventaja').forEach((b,k)=>b.classList.toggle('on',VENTAJAS_POR_PASO[i].indexOf(k)>-1));
  if(escenaVisible) Sonido.paso(i);
  if(manual && reloj){ clearInterval(reloj); reloj=null;
    const l=document.getElementById('exSteps'); if(l) l.classList.remove('auto'); }
}
(function arrancarPasos(){
  const l=document.getElementById('exSteps'); if(!l) return;
  if(menos) return;
  l.className='pasos auto';
  reloj=setInterval(()=>irPaso((paso+1)%4),5000);
})();

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
const ultimaRevision=()=>{const ds=P.map(p=>p.ver).filter(Boolean).sort();return ds.length?fLarga(ds[ds.length-1]):''};
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
  "Acciones y capital privado":"Acciones","Materias primas":"Materias"};
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
  const base=RADIO_ACCESO[p.acceso]!=null?RADIO_ACCESO[p.acceso]:0.7;
  const mismos=P.filter(x=>x.cat===p.cat&&x.acceso===p.acceso);
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
   +` aria-label="${escHtml(p.n)}. ${escHtml(p.cat)}. Acceso: ${escHtml(p.acceso)}. Abrir ficha.">`
   +`<title>${escHtml(p.n)} · ${escHtml(p.cat)} · ${escHtml(p.acceso)}</title>`
   +`<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${col}"/>`
   +`<circle class="anillo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${col}"/>`
   /* el borde oscuro separa dos puntos que se rocen: sin él, dos colores
      contiguos se funden en una mancha */
   +`<circle class="punto" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${col}" stroke="#0B0A0A" stroke-width="1.4"/>`
   +`<circle class="zona" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="transparent"/>`
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
  $('rlMeta').textContent=p.cat+' · '+p.acceso+' · '+p.reg;
 }
 function limpia(){
  caja.classList.remove('viva');
  vacio.hidden=false; dato.hidden=true;
 }
 const deEvento=e=>{const g=e.target.closest?e.target.closest('.blip'):null;
  return g?parseInt(g.dataset.i,10):null;};

 svg.addEventListener('pointerover',e=>{const i=deEvento(e); if(i!=null) lee(i);});
 svg.addEventListener('pointerout',e=>{ if(!e.relatedTarget||!svg.contains(e.relatedTarget)) limpia(); });
 svg.addEventListener('focusin',e=>{const i=deEvento(e); if(i!=null) lee(i);});
 svg.addEventListener('focusout',limpia);
 svg.addEventListener('click',e=>{
  const g=e.target.closest?e.target.closest('.blip'):null;
  if(g) return openDrawer(parseInt(g.dataset.i,10));
  const et=e.target.closest?e.target.closest('.radar-etg'):null;
  if(et) filtraDesdeRadar(et.dataset.filtra);
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
 const t=document.getElementById('tool');
 if(t&&t.scrollIntoView) t.scrollIntoView();
}

let S2={cat:"",reg:"",acc:"",tic:"",q:"",view:"grid"};
let compare=[];

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
document.getElementById('fReg').onchange=e=>{S2.reg=e.target.value;Sonido.filtro();render()};
document.getElementById('fAcc').onchange=e=>{S2.acc=e.target.value;Sonido.filtro();render()};
document.getElementById('fTic').onchange=e=>{S2.tic=e.target.value;Sonido.filtro();render()};
document.getElementById('q').oninput=e=>{S2.q=e.target.value.toLowerCase();render()};
function resetAll(){S2={cat:"",reg:"",acc:"",tic:"",q:"",view:S2.view};document.getElementById('q').value='';['fReg','fAcc','fTic'].forEach(i=>document.getElementById(i).value='');render()}

document.getElementById('s1').textContent=P.length;
document.getElementById('s3').textContent=P.filter(p=>p.acceso==="Minorista").length;
document.getElementById('s4').textContent=FUERA.length;
/* El rotulo del radar tambien: estaba escrito a mano y se quedo en 24
   cuando el registro crecio. Ahora sale de P como todo lo demas. */
{const rt=document.getElementById('rlTotal');if(rt)rt.textContent=P.length+' plataformas en el radar';}

function filtered(){
 return P.filter(p=>{
  if(S2.cat&&p.cat!==S2.cat)return false;
  if(S2.reg&&p.reg!==S2.reg)return false;
  if(S2.acc&&p.acceso!==S2.acc)return false;
  if(S2.tic&&p.ticket!==S2.tic)return false;
  if(S2.q){const h=(p.n+' '+p.nota+' '+p.aval+' '+p.cat+' '+p.reg+' '+p.cadenas).toLowerCase();if(!h.includes(S2.q))return false}
  return true;
 }).sort((a,b)=>a.n.localeCompare(b.n,'es'));
}
function setView(v){S2.view=v;document.getElementById('vGrid').classList.toggle('on',v==='grid');document.getElementById('vMat').classList.toggle('on',v==='matrix');render()}

function render(){
 document.getElementById('pills').innerHTML=
  `<button class="f ${S2.cat===''?'on':''}" data-filtrar-cat="">Todas <span class="ct">${P.length}</span></button>`+
  Object.keys(CATMETA).map(c=>{const n=P.filter(p=>p.cat===c).length;
   const cp={cat:c};return `<button class="f ${S2.cat===c?'on':''}" data-cat="${escHtml(c)}" data-filtrar-cat="${escHtml(c)}"><span class="punto ${catClase(cp)}"></span>${escHtml(c)} <span class="ct">${n}</span></button>`}).join('');
 const f=filtered();
 document.getElementById('count').innerHTML=`<b>${f.length}</b> de ${P.length} plataformas · última revisión ${ultimaRevision()}`;
 document.getElementById('grid').classList.toggle('hide',S2.view!=='grid');
 document.getElementById('matrix').classList.toggle('show',S2.view==='matrix');
 S2.view==='grid'?renderGrid(f):renderMatrix(f);
 pintarRadar();
 renderCmpBar();
 pulir();   /* al filtrar se crean fichas nuevas: vuelven a entrar animadas */
}
function renderGrid(f){
 const g=document.getElementById('grid');
 if(!f.length){g.innerHTML=`<div class="vacio"><p>El radar no detecta ninguna plataforma con estos filtros.</p><button class="f" data-accion="limpiar">Limpiar filtros</button></div>`;return}
 g.innerHTML=f.map(p=>{const i=P.indexOf(p),on=compare.includes(i);
  return `<div class="ficha ${on?'sel':''} ${catClase(p)}">
   <div class="ficha-alto">${siglaEl(p)}<div class="ficha-nom"><h3><button class="abrir" data-cat="${escHtml(p.cat)}" data-abrir="${i}">${escHtml(p.n)}</button></h3><div class="sub">${escHtml(p.tipo)} · ${escHtml(p.reg)}</div></div></div>
   <p class="nota">${escHtml(p.nota)}</p>
   <div class="aval">${escudoSVG}<span>${escHtml(p.aval)}</span></div>
   <div class="marcas"><span class="m acc">${escHtml(p.acceso)}</span><span class="m">Entrada: ${escHtml(String(p.ticket).toLowerCase())}</span><span class="m">${escHtml(p.cadenas)}</span></div>
   <div class="ficha-pie"><span class="verif">${okSVG} Verificado ${escHtml(fCorta(p.ver))}</span>
    <button class="cmp ${on?'on':''}" data-comparar="${i}">${on?'✓ Comparando':'+ Comparar'}</button>
    <button class="movil-ficha-abrir" data-abrir="${i}">Abrir ficha <span aria-hidden="true">›</span></button></div></div>`}).join('');
}
function renderMatrix(f){
 document.getElementById('matrix').innerHTML=`<table class="tabla">
  <thead><tr><th>Tipo de activo ↓ &nbsp;/&nbsp; Quién puede entrar →</th>${ACCESOS.map(a=>`<th>${escHtml(a)}</th>`).join('')}</tr></thead>
  <tbody>${Object.keys(CATMETA).map(c=>`<tr><th>${escHtml(c)}</th>${ACCESOS.map(a=>{
   const l=f.filter(p=>p.cat===c&&p.acceso===a);
   return `<td><div class="celda">${l.length?l.map(p=>{const i=P.indexOf(p);
    return `<button class="mm" data-abrir="${i}"><span class="md ${catClase(p)}">${escHtml(initials(p.n))}</span>${escHtml(p.n)}</button>`}).join(''):'<span class="nada">—</span>'}</div></td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function openDrawer(i){
 const p=P[i];
 if(!p)return;
 const web=urlHttps(p.web);
 document.getElementById('dwId').innerHTML=`${siglaEl(p)}<div><h3 id="dwTitulo">${escHtml(p.n)}</h3><div class="cat">${escHtml(p.cat)}</div></div>`;
 document.getElementById('dwBody').innerHTML=`
  <section class="pn-seccion pn-resumen" aria-labelledby="dwResumenTit">
   <h4 id="dwResumenTit">Resumen</h4>
   <p id="dwResumen">${escHtml(p.nota)}</p>
   <div class="pn-claves" aria-label="Datos principales">
    <span>${escHtml(p.tipo)}</span><span>${escHtml(p.reg)}</span><span>${escHtml(p.acceso)}</span>
   </div>
  </section>
  <section class="pn-seccion pn-verificacion" aria-labelledby="dwVerificacionTit">
   <h4 id="dwVerificacionTit">Verificación RWAdar</h4>
   <div class="aval aval-detalle">${escudoSVG}<span>${escHtml(p.aval)}</span></div>
  </section>
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
  <section class="pn-seccion pn-opiniones-seccion" aria-label="Puntuación y opiniones">
   <div id="dwOpiniones"></div>
  </section>`;
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
 if(typeof Opiniones!=="undefined"){const c=document.getElementById("dwOpiniones");if(c)Opiniones.pinta(p.n,c);}
 const cuerpo=document.getElementById('dwBody');if(cuerpo)cuerpo.scrollTop=0;
 openPanel('drawer');
}
function toggleCompare(i){const a=compare.indexOf(i);if(a>-1)compare.splice(a,1);else{if(compare.length>=3)return;compare.push(i)}render()}
function clearCompare(){compare=[];render()}
function renderCmpBar(){
 document.getElementById('cmpbar').classList.toggle('show',compare.length>0);
 document.getElementById('cmpAvs').innerHTML=compare.map(i=>siglaEl(P[i])).join('');
 document.getElementById('cmpTxt').textContent=compare.length===1?'1 seleccionada · elige otra':`${compare.length} seleccionadas`;
 document.getElementById('cmpGo').disabled=compare.length<2;
}
function openCompare(){
 const sel=compare.map(i=>P[i]);
 const rows=[['Tipo de activo',p=>escHtml(p.cat)],['Tipo de actor',p=>escHtml(p.tipo)],['Región / marco',p=>escHtml(p.reg)],
  ['Quién entra',p=>`<span class="m acc">${escHtml(p.acceso)}</span>`],['Entrada',p=>escHtml(p.ticket)],['Cadenas',p=>escHtml(p.cadenas)],
  ['Por qué está aquí',p=>`<span class="comp-aval">${escHtml(p.aval)}</span>`],
  ['Qué hace',p=>`<span class="comp-nota">${escHtml(p.nota)}</span>`],
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
 const v=emisionesVisibles();
 if(!v.length){
  caja.innerHTML=EMI.some(emisionValida)
   ?'<div class="emis-vacio"><h3>Nada abierto con ese filtro</h3><p>Prueba con otra categoría o vuelve en unos días: el registro cambia cuando verificamos novedades.</p></div>'
   :'<div class="emis-vacio"><h3>Todavía no hay emisiones publicadas</h3><p>Estamos verificando las primeras. Cada una llevará el enlace a su plataforma y la fecha en que comprobamos sus cifras.</p></div>';
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
   '<a class="emi-ir" href="'+escHtml(urlHttps(e.url))+'" target="_blank" rel="noopener nofollow">Ver en '+escHtml(e.pl)+' ↗</a></div></article>';
 }).join('');
}
function pintarFiltrosEmision(){
 const caja=document.getElementById('emiFiltros');if(!caja)return;
 const cats=[];EMI.filter(emisionValida).forEach(e=>{if(!cats.includes(e.cat))cats.push(e.cat)});
 caja.innerHTML=cats.length?'<button class="f'+(emiCat?'':' on')+'" data-emi-cat="">Todas</button>'+cats.map(c=>
  '<button class="f'+(emiCat===c?' on':'')+'" data-emi-cat="'+escHtml(c)+'"><span class="punto'+catClase({cat:c})+'"></span>'+escHtml(c)+'</button>').join(''):'';
}
pintarFiltrosEmision();pintarEmisiones();
(function mandosEmision(){
 const filtros=document.getElementById('emiFiltros'),orden=document.getElementById('emiOrden');
 if(filtros&&filtros.addEventListener)filtros.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-emi-cat]');if(!b)return;
  emiCat=b.getAttribute('data-emi-cat')||'';pintarFiltrosEmision();pintarEmisiones();if(typeof Sonido!=='undefined'&&Sonido.marcar)Sonido.marcar()});
 if(orden&&orden.addEventListener)orden.addEventListener('change',()=>{emiOrden=orden.value||'cierra';pintarEmisiones()});
})();

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
 const inR=P.map(p=>['En el radar',p.n,p.cat,p.tipo,p.reg,p.cadenas,p.ticket,p.acceso,p.web,p.nota,p.aval,'']);
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
   Sintetizado con Web Audio: ni un fichero que descargar, ni una
   petición de red.

   La versión anterior se oía, pero sonaba tosca, y el motivo era la
   receta: ruido blanco por un paso banda de Q alto. Eso es un resonador
   metálico —una lámina golpeada—, y todo el registro caía entre 2 y 4
   kHz, que es justo donde el oído humano es más sensible y donde antes
   se cansa. Cuanto más se subía el volumen, más chillaba.

   Cómo suena lo que hacen en Cupertino, que es a lo que vamos:

     · TONO, no ruido. La base es un seno con una caída de altura
       mínima. Redondo, sin filo.
     · GRAVE, no agudo. Casi todo entre 250 y 900 Hz. El ruido queda
       como una pizca de textura, filtrado por arriba y a un cuarto del
       volumen — se nota si se quita, no se oye si está.
     · SIN CHASQUIDO. El ataque no es una rampa recta sino un coseno
       elevado de unos milisegundos. Ese detalle es el que separa un
       "toc" de un "clac": una rampa recta introduce una discontinuidad
       en la derivada y el oído la oye como un chasquido.
     · UNA SOLA FAMILIA. Todo sale del mismo timbre y de una escala
       pentatónica, así que dos sonidos seguidos nunca disuenan.

   LA ALTURA SUBE, NO BAJA. Esta es la decisión que define el carácter y
   se tomó a oído, comparando cinco familias en un banco de pruebas. Un
   tono que cae suena a algo que se posa, a algo que termina; un tono que
   sube en cincuenta milisegundos suena a algo que se suelta, que sale
   despedido. La segunda sensación es la que engancha, y es la del "pop"
   de enviar un mensaje en un Mac. Todo el juego de sonidos está montado
   sobre ese gesto ascendente.

   La única excepción es cerrar, que baja: es el gesto contrario y tiene
   que oírse como tal. Marcar sube y desmarcar baja por lo mismo.

   Esto corrige la norma anterior de "golpes de material, nunca notas".
   Se escribió para huir del tono puro sostenido, que efectivamente suena
   a juguete — pero la conclusión era demasiado amplia. Lo que no puede
   haber es melodía: la altura solo cambia cuando significa algo, y
   siempre dentro de la misma escala.

   Las reglas de convivencia no cambian: solo al pulsar algo a propósito,
   nunca al pasar por encima ni al hacer scroll.
   ================================================================= */
/* En navegación privada o dentro de un iframe restringido, tocar
   localStorage lanza excepción. Se accede siempre protegido. */
const recuerda={
 leer(k){try{return localStorage.getItem(k)}catch{return null}},
 guardar(k,v){try{localStorage.setItem(k,v)}catch{}}
};

/* Escala pentatónica sobre do. Cualquier par de estas notas suena bien
   junto, así que dos sonidos que se solapen nunca chocan. */
const NOTAS={do1:261.63, mib:311.13, fa:349.23, sol:392.00, sib:466.16,
             do2:523.25, re:587.33, fa2:698.46, sol2:783.99, la:880.00, do3:1046.50};

const Sonido=(()=>{
 let ctx=null, maestro=null, seco=null, sala=null, ruido=null;
 let on=recuerda.leer('rwadar.sonido')!=='0';
 let despierto=false;    /* ¿ha habido ya un gesto del usuario? */

 /* Una sala pequeña generada a mano: ruido que se apaga deprisa. No es
    una grabación de una iglesia, es el aire de un despacho. */
 function impulso(c,dur,caida){
  const n=Math.max(1,Math.floor(c.sampleRate*dur));
  const b=c.createBuffer(2,n,c.sampleRate);
  for(let ch=0;ch<2;ch++){
   const d=b.getChannelData(ch);
   for(let i=0;i<n;i++){const t=i/n; d[i]=(Math.random()*2-1)*Math.pow(1-t,caida);}
  }
  return b;
 }

 /* La envolvente, como curva y no como rampa.
    `exponentialRampToValueAtTime` va de un valor a otro en línea recta
    (en logaritmo), y al llegar cambia de pendiente de golpe. Ese quiebre
    es audible: es el chasquido. Una curva calculada con coseno elevado
    al principio entra sin borde, y la caída en potencia se parece a como
    se apaga un objeto de verdad. */
 const CACHE={};
 function envolvente(ataque,forma){
  const clave=ataque+'|'+forma;
  if(CACHE[clave]) return CACHE[clave];
  const n=256, c=new Float32Array(n);
  for(let i=0;i<n;i++){
   const t=i/(n-1);
   c[i]= t<ataque ? 0.5-0.5*Math.cos(Math.PI*t/ataque)
                  : Math.pow(1-(t-ataque)/(1-ataque),forma);
  }
  c[n-1]=0;
  return CACHE[clave]=c;
 }
 const escalar=(c,v)=>{const o=new Float32Array(c.length);
  for(let i=0;i<c.length;i++) o[i]=c[i]*v; return o;};

 const dar=()=>{
  if(!ctx){
   const A=window.AudioContext||window.webkitAudioContext; if(!A) return null;
   try{ ctx=new A(); }catch(e){ return null; }
   maestro=ctx.createGain(); maestro.gain.value=1;

   /* Un paso bajo en la salida general. Es la diferencia entre "sonido de
      interfaz" y "sonido de aviso de electrodoméstico": por encima de 7
      kHz no hay nada que aporte, y sí mucho que moleste. */
   const suave=ctx.createBiquadFilter();
   suave.type='lowpass'; suave.frequency.value=7000; suave.Q.value=0.7;

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

   const rev=ctx.createConvolver(); rev.buffer=impulso(ctx,0.34,9);
   const corte=ctx.createBiquadFilter(); corte.type='highpass'; corte.frequency.value=380;
   sala=ctx.createGain(); sala.gain.value=0.34;
   sala.connect(corte); corte.connect(rev); rev.connect(maestro);

   const n=Math.floor(ctx.sampleRate*0.4);
   ruido=ctx.createBuffer(1,n,ctx.sampleRate);
   const d=ruido.getChannelData(0);
   for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  }
  if(ctx.state==='suspended') ctx.resume();
  return ctx;
 };

 const salida=(c,pan,envio)=>{
  const g=c.createGain(); g.gain.value=1;
  if(c.createStereoPanner){
   const p=c.createStereoPanner(); p.pan.value=pan||0;
   g.connect(p); p.connect(seco);
  }else g.connect(seco);
  const s=c.createGain(); s.gain.value=envio==null?0.22:envio;
  g.connect(s); s.connect(sala);
  return g;
 };

 /* El sonido base: un tono breve que SUBE de altura, con una pizca de
    aire encima. Todo lo demás son ajustes de esta receta. */
 function pop(o){
  if(!on) return;
  const c=dar(); if(!c) return;
  o=o||{};
  /* Una pizca de desafinación por pulsación, ±1,2 %. Es inaudible como
     nota y decisiva como sensación: dos toques idénticos delatan que el
     sonido está grabado; dos toques que varían un pelo se perciben como
     algo que ocurre, no como algo que se reproduce. */
  const desv=1+(Math.random()-0.5)*0.024;
  const f=(o.f||NOTAS.sol)*desv, f2=(o.f2||(o.f||NOTAS.sol)*2.1)*desv,
        dur=o.dur||0.055, vol=o.vol||0.30,
        ataque=o.ataque||0.06, forma=o.forma||3.4,
        /* `glis` es qué parte de la nota tarda en llegar arriba. Cuanto
           más corto, más "salto" y menos "sirena". 0,6 es el punto donde
           deja de parecer un barrido y empieza a parecer un gesto. */
        glis=o.glis||0.60,
        aire=o.aire==null?0.18:o.aire, cuerpo=o.cuerpo==null?0.22:o.cuerpo;
  const t=c.currentTime+(o.retraso||0)+0.004;
  const out=salida(c,o.pan||0,o.envio);
  const env=envolvente(ataque,forma);

  /* fundamental */
  const osc=c.createOscillator(); osc.type='sine';
  osc.frequency.setValueAtTime(f,t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40,f2),t+dur*glis);
  const g=c.createGain(); g.gain.setValueAtTime(0,t);
  g.gain.setValueCurveAtTime(escalar(env,vol),t,dur);
  osc.connect(g); g.connect(out); osc.start(t); osc.stop(t+dur+0.02);

  /* Un armónico a la octava, muy por debajo. Es lo que impide que suene
     a tono de prueba de laboratorio: un seno solo no existe en la
     naturaleza; con su octava ya parece un objeto. */
  if(cuerpo>0){
   const o2=c.createOscillator(); o2.type='sine';
   o2.frequency.setValueAtTime(f*2,t);
   o2.frequency.exponentialRampToValueAtTime(Math.max(40,f2*2),t+dur*glis*0.85);
   const g2=c.createGain(); g2.gain.setValueAtTime(0,t);
   g2.gain.setValueCurveAtTime(escalar(envolvente(ataque,forma*1.9),vol*cuerpo),t,dur*0.75);
   o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t+dur+0.02);
  }

  /* El aire: ruido con paso BAJO, no paso banda. El paso banda de Q alto
     es lo que sonaba a lámina metálica; un paso bajo suave deja solo el
     soplo del contacto y se queda debajo del tono. */
  if(aire>0){
   const s=c.createBufferSource(); s.buffer=ruido; s.loop=true;
   s.playbackRate.value=0.9+Math.random()*0.2;
   const lp=c.createBiquadFilter(); lp.type='lowpass';
   lp.frequency.setValueAtTime(Math.min(5200,f*5.5),t);
   lp.frequency.exponentialRampToValueAtTime(Math.max(300,f*1.6),t+dur*0.4);
   lp.Q.value=0.6;
   const gn=c.createGain(); gn.gain.setValueAtTime(0,t);
   const dAire=Math.max(0.012,dur*0.34);
   gn.gain.setValueCurveAtTime(escalar(envolvente(0.10,3.4),vol*aire*2.2),t,dAire);
   s.connect(lp); lp.connect(gn); gn.connect(out);
   s.start(t); s.stop(t+dAire+0.02);
  }
 }

 /* Un roce de aire: para cuando algo viaja, no cuando algo se toca. */
 function roce(o){
  if(!on) return;
  const c=dar(); if(!c) return;
  o=o||{};
  const desde=o.desde||400, hasta=o.hasta||1800, dur=o.dur||0.42, vol=o.vol||0.13;
  const t=c.currentTime+(o.retraso||0)+0.004;
  const out=salida(c,o.pan||0,o.envio==null?0.45:o.envio);
  const s=c.createBufferSource(); s.buffer=ruido; s.loop=true;
  const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=0.9;
  bp.frequency.setValueAtTime(desde,t);
  bp.frequency.exponentialRampToValueAtTime(hasta,t+dur*0.8);
  const g=c.createGain(); g.gain.setValueAtTime(0,t);
  g.gain.setValueCurveAtTime(escalar(envolvente(0.42,2.2),vol*2.6),t,dur);
  s.connect(bp); bp.connect(g); g.connect(out);
  s.start(t); s.stop(t+dur+0.03);
 }

 return {
  get activo(){return on},
  set activo(v){
   /* apagar baja, encender sube: el interruptor se oye en su dirección */
   if(!v){ pop({f:NOTAS.fa2,f2:NOTAS.do1,dur:.15,vol:.26,glis:.55,envio:.3}); on=false; }
   else { on=true; dar();
          pop({f:NOTAS.do1,f2:NOTAS.do2,dur:.07,vol:.28});
          pop({f:NOTAS.sol,f2:NOTAS.sol2,dur:.12,vol:.26,retraso:.07,envio:.4}); }
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

  /* --- pulsaciones corrientes ---
     Todas parten de una nota de la pentatónica y suben hasta otra nota de
     la misma pentatónica, casi siempre su octava. Así el gesto ascendente
     nunca cae en un intervalo raro por mucho que se repita. */
  toque : ()=>pop({f:NOTAS.sol,f2:NOTAS.la,dur:.055,vol:.32,envio:.14}),
  /* el tic del deslizador: lo más pequeño que puede sonar sin desaparecer */
  tic   : ()=>pop({f:NOTAS.fa2,f2:NOTAS.do3*1.15,dur:.028,vol:.13,ataque:.08,forma:3.8,
                   glis:.5,aire:.10,cuerpo:.10,envio:.08}),
  filtro: ()=>pop({f:NOTAS.do2,f2:NOTAS.do3,dur:.045,vol:.22,aire:.14,envio:.12}),
  /* Abrir arranca grave y sube mucho: es el sonido de algo que se
     despliega hacia arriba. Cerrar hace exactamente el camino contrario,
     y por eso es la única excepción a la regla de que todo sube. */
  abrir : ()=>pop({f:NOTAS.do1,f2:NOTAS.fa2,dur:.12,vol:.34,ataque:.07,forma:2.6,
                   glis:.55,aire:.16,cuerpo:.30,envio:.35}),
  /* Cerrar no es un tobogán. La primera versión caía una octava y media
     de golpe y sonaba a decepción, a "se ha estropeado". Cerrar un panel
     no es un fracaso: es dejar algo bien puesto. Así que apenas baja un
     tono, dura poco y tiene cuerpo — el ruido de una tapa que asienta. */
  cerrar: ()=>pop({f:NOTAS.sol,f2:NOTAS.fa,dur:.085,vol:.28,ataque:.07,forma:3.0,
                   glis:.7,aire:.12,cuerpo:.38,envio:.22}),
  /* Marcar sube dos veces, desmarcar baja dos veces: la dirección del
     gesto se oye sin tener que mirar. */
  marcar: ()=>{pop({f:NOTAS.sol,f2:NOTAS.sol2,dur:.05,vol:.28,pan:-.10});
               pop({f:NOTAS.do2,f2:NOTAS.do3,dur:.06,vol:.28,retraso:.05,pan:.10,envio:.30});},
  desmarcar:()=>{pop({f:NOTAS.do2,f2:NOTAS.do1,dur:.05,vol:.24,glis:.55,pan:.10});
                 pop({f:NOTAS.sol,f2:NOTAS.sol/2,dur:.07,vol:.24,glis:.55,retraso:.05,pan:-.10,envio:.28});},
  descarga:()=>{pop({f:NOTAS.do2,f2:NOTAS.sol2,dur:.06,vol:.28});
                pop({f:NOTAS.sol,f2:NOTAS.do3,dur:.13,vol:.28,retraso:.08,envio:.45,cuerpo:.34});},

  /* Cada tipo de activo arranca en su nota de la pentatónica, de lo más
     pesado a lo más técnico, y todas suben a su octava. Al recorrer los
     filtros se oye una escala, no seis ruidos distintos — y como todas
     pertenecen al mismo acorde, dos seguidas nunca suenan a error. */
  categoria:i=>{
   const esc=[NOTAS.do1,NOTAS.mib,NOTAS.fa,NOTAS.sol,NOTAS.sib,NOTAS.do2];
   const f=esc[i%esc.length];
   pop({f,f2:f*2.15,dur:.07,vol:.30,cuerpo:.28,envio:.22});
  },

  /* --- el dibujo suena ---
     Solo después del primer gesto del usuario. Un explicador que empieza
     a hacer ruido solo, antes de que nadie haya tocado nada, es
     exactamente lo que hace que se cierre la pestaña. */
  /* UNA GOTA POR PASO. Nada más.
     Antes cada paso disparaba una ráfaga: cinco chispas, cuatro destellos,
     dos roces… Sonaba a fuegos artificiales y, sobre todo, a algo que se
     alargaba. Un explicador que avanza solo no puede sonar sostenido: la
     atención se va al sonido en vez de al dibujo.

     Una gota de agua es exactamente esto — un tono que sube muy rápido de
     altura y se apaga en cien milisegundos. La subida rápida es lo que el
     oído reconoce como «gota»: es la resonancia de la cavidad cerrándose.
     Cada paso cae en una nota distinta de la pentatónica, subiendo, así
     que los cuatro seguidos suenan a una frase y no a cuatro avisos. */
  paso(i){
   if(!on||!despierto) return;
   const gotas=[NOTAS.fa,NOTAS.sol,NOTAS.sib,NOTAS.do2];
   const f=gotas[i%4];
   pop({f,f2:f*2.7,dur:.10,vol:.26,ataque:.11,forma:3.6,glis:.42,
        aire:.05,cuerpo:.14,envio:.42});
  }
 };
})();

/* La nota de cada categoría, por orden en CATMETA: de lo más pesado
   (inmobiliario) a lo más técnico (infraestructura). */
const NOTA_CAT={
 'Inmobiliario'               :0,
 'Crédito privado'            :1,
 'Tesoro y fondos'            :2,
 'Acciones y capital privado' :3,
 'Materias primas'            :4,
 'Infraestructura'            :5,
};

(function interruptorSonido(){
 const b=document.getElementById('snd'); if(!b) return;
 const pinta=()=>b.setAttribute('aria-pressed',Sonido.activo?'true':'false');
 pinta();
 b.addEventListener('click',()=>{Sonido.despertar();Sonido.activo=!Sonido.activo; pinta();});
})();

/* Sonido en el gesto de pulsar, no al soltar: así responde antes que la vista. */
document.addEventListener('pointerdown',ev=>{
 Sonido.despertar();
 const t=ev.target;
 /* la vibración va con cualquier control, incluido el interruptor de
    sonido: es la respuesta física al dedo, no un aviso */
 if(t.closest('button,.blip,input[type=range],select,a')) Sonido.toca(8);
 if(t.closest('#snd')) return;
 /* el pestillo va en la dirección correcta: marcar y desmarcar no suenan
    igual, y se sabe cuál toca mirando si el botón ya estaba encendido */
 const marca=t.closest('.cmp');
 if(marca) return marca.classList.contains('on')?Sonido.desmarcar():Sonido.marcar();
 const conCat=t.closest('[data-cat]');
 if(conCat && NOTA_CAT[conCat.dataset.cat]!=null) return Sonido.categoria(NOTA_CAT[conCat.dataset.cat]);
 if(t.closest('.abrir,.mm'))                 return Sonido.abrir();
 if(t.closest('.cerrar')||t.id==='ovl')      return Sonido.cerrar();
 if(t.closest('.csv'))                       return Sonido.descarga();
 if(t.closest('.f,.paso,.btn-p,.btn-s,.hdr-cta,.limpiar,.vista button,.cmpbar .go,.cmpbar .x'))
   return Sonido.toque();
},{passive:true});
document.addEventListener('keydown',e=>{Sonido.despertar();if(e.key==='Escape')Sonido.cerrar();});

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
const CLAVE_PUB='sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';

/* La huella incluye todos los campos visibles. La anterior omitía textos y
   fuentes, de modo que una corrección editorial podía no llegar al visitante. */
const huella=(a,b,e=[])=>JSON.stringify({
 p:a.map(x=>[x.n,x.cat,x.tipo,x.reg,x.cadenas,x.ticket,x.acceso,x.web,x.aval,x.nota,x.ver])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 f:b.map(x=>[x.n,x.badge,x.why,(Array.isArray(x.fuentes)?x.fuentes:[]).map(s=>[s.url,s.titulo])])
    .sort((x,y)=>String(x[0]).localeCompare(String(y[0]),'es')),
 e:e.map(x=>[x.s,x.t,x.res,x.pl,x.plw,x.cat,x.ub,x.mon,x.min,x.obj,x.cap,x.pct,
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

async function alDia(){
 const cab={apikey:CLAVE_PUB};
 const pide=u=>fetch(API+u,{headers:cab,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'})
   .then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)));
 const [r,f,e]=await Promise.all([
   pide('/radar_publico?select=*'),
   pide('/plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)&order=nombre'),
   pide('/emisiones_publicas?select=*&estado=in.(abierta,programada,en_estudio)')
 ]);
 if(!Array.isArray(r)||!r.length||!Array.isArray(f)||!Array.isArray(e)) throw new Error('respuesta vacia');

 const nP=r.map(plataformaRemota).sort((a,b)=>a.n.localeCompare(b.n,'es'));
 const nF=f.map(descarteRemoto).sort((a,b)=>a.n.localeCompare(b.n,'es'));
 const nE=e.map(emisionRemota).sort((a,b)=>a.s.localeCompare(b.s,'es'));

 if(huella(nP,nF,nE)===huella(P,FUERA,EMI)) return false;   /* ya estaba al día */

 P.length=0;    P.push(...nP);
 FUERA.length=0; FUERA.push(...nF);
 EMI.length=0;  EMI.push(...nE);
 rellenaRegiones();
 document.getElementById('s1').textContent=P.length;
 document.getElementById('s3').textContent=P.filter(p=>p.acceso==='Minorista').length;
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
async function mirar(){
 if(Date.now()-ultimaMirada<60000) return;
 ultimaMirada=Date.now();
 try{ if(await alDia()) avisar('Registro actualizado'); }catch{}
}
/* Primero se pinta lo que ya venía en el HTML, y solo después se
   consulta la base: así la página está usable de inmediato y la
   actualización, si la hay, llega sin bloquear nada. */
render();
pulir();
(function pieFecha(){const p=document.getElementById('pieRevision');
 if(p) p.textContent='Última revisión del registro: '+ultimaRevision();})();
mirar();
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) mirar(); });


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
 let ses=null, perfil=null, vigiladas=new Map(), modo='entrar', fichaAbierta=null,
     identidadConfirmada=false,versionSesion=0,renovacion=null,focoCuenta=null;

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
  const r=await fetch(AUTH+ruta,{method:(opc&&opc.metodo)||'POST',
    headers:Object.assign({apikey:CLAVE_PUB,'Content-Type':'application/json'},
      (opc&&opc.token)?{Authorization:'Bearer '+opc.token}:{}),
    body:cuerpo?JSON.stringify(cuerpo):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  const t=await r.text(); let j={}; try{j=t?JSON.parse(t):{}}catch(e){}
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
   identidadConfirmada=false;
   if(e.status===401||e.status===403)guarda(null);
   return false;
  }
 }

 /* --- datos propios (la base ya filtra por RLS) ------------------- */
 async function rest(ruta,opc){
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
  registro:{t:'Crear cuenta',s:'Es opcional y gratis. Después tendrás que confirmar el correo antes de entrar; la entrega del mensaje aún no está verificada.',b:'Crear cuenta',otro:'Ya tengo cuenta'},
  recuperar:{t:'Recuperar el acceso',s:'Solicita a Supabase un enlace para poner una contraseña nueva. La entrega del mensaje aún no está verificada.',b:'Solicitar el enlace',otro:'Volver a entrar'},
  nueva_clave:{t:'Elige una contraseña nueva',s:'El enlace ya ha verificado tu solicitud. Escribe la contraseña que usarás desde ahora.',b:'Guardar contraseña',otro:''}
 };
 function abrir(m,motivo){
  modo=m||'entrar'; const T=TEXTOS[modo];
  $('cuentaTit').textContent=T.t;
  $('cuentaSub').textContent=motivo||T.s;
  $('cuentaEnviar').textContent=T.b;
  $('irCambiar').textContent=T.otro;
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
  setTimeout(()=>{try{$(modo==='nueva_clave'?'cClave':'cCorreo').focus()}catch(e){}},60);
 }
 function cerrar(){
  const caja=$('cuentaCaja'),estabaAbierta=caja.classList.contains('on');
  $('velo').classList.remove('on');
  caja.classList.remove('on'); caja.setAttribute('inert','');
  $('cClave').value='';$('cClave2').value='';
  document.body.classList.remove('locked');
  if(estabaAbierta){fondo().forEach(n=>n.removeAttribute('inert'));
   if(focoCuenta&&document.contains(focoCuenta))focoCuenta.focus();focoCuenta=null;}
 }
 function msj(txt,bien){
  const m=$('cuentaMsj'); m.className='cuenta-msj'+(txt?(bien?' bien':' mal'):'');
  m.textContent=txt||'';
 }
 function aviso(txt){
  avisar(txt);
 }

 async function enviar(e){
  e.preventDefault();
  const correo=$('cCorreo').value.trim(), clave=$('cClave').value, nombre=$('cNombre').value.trim();
  const bot=$('cuentaEnviar'); bot.disabled=true; msj('');
  try{
   if(modo==='nueva_clave'){
    if(clave.length<12)throw new Error('La contraseña necesita al menos 12 caracteres.');
    if(clave!==$('cClave2').value)throw new Error('Las dos contraseñas no coinciden.');
    const tk=await testigo();if(!tk)throw new Error('El enlace ha caducado. Solicita uno nuevo.');
    await auth('/user',{password:clave},{metodo:'PUT',token:tk});
    $('cClave').value='';$('cClave2').value='';
    msj('Contraseña cambiada. La sesión sigue abierta.',true);
   }else if(modo==='recuperar'){
    const vuelta=encodeURIComponent(location.origin+'/');
    await auth('/recover?redirect_to='+vuelta,{email:correo});
    msj('Solicitud aceptada por Supabase. La entrega del correo y la recuperación completa aún no están verificadas; no podemos asegurar que el mensaje llegue.',true);
   }else if(modo==='registro'){
    const vuelta=encodeURIComponent(location.origin+'/');
    const j=await auth('/signup?redirect_to='+vuelta,{email:correo,password:clave,
      data:nombre?{nombre:nombre}:undefined});
    if(j.access_token){ await entrarCon(j); }
    else { msj('Solicitud de alta aceptada. Para entrar tienes que confirmar tu correo. La entrega del mensaje y el flujo completo aún no están verificados; no podemos asegurar que llegue.',true); }
   }else{
    const j=await auth('/token?grant_type=password',{email:correo,password:clave});
    await entrarCon(j);
   }
  }catch(err){ msj(err.message); }
  bot.disabled=false;
 }
 async function entrarCon(j){
  guarda({access_token:j.access_token,refresh_token:j.refresh_token,
          expira:Date.now()+(j.expires_in||3600)*1000,
          correo:(j.user&&j.user.email)||'', uid:(j.user&&j.user.id)||''});
  identidadConfirmada=false;
  if(!await confirmarIdentidad())throw new Error('No se ha podido verificar la sesión.');
  if(modo==='registro'&&$('cNombre').value.trim()){
   try{ await rest('/perfiles?id=eq.'+encodeURIComponent(ses.uid),{method:'PATCH',body:JSON.stringify({nombre:$('cNombre').value.trim()})}); }catch(e){}
  }
  await cargarMio(); cerrar(); pinta();
  if(fichaAbierta) pintarVigilar(fichaAbierta);
  aviso('Hola' + (perfil&&perfil.nombre?' '+perfil.nombre:'') + '. Sesión iniciada.');
 }

 /* --- el área de la persona --------------------------------------- */
 function abrirPerfil(){
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
  c.querySelectorAll('.vig-lista button').forEach(b=>b.addEventListener('click',()=>alternar(b.dataset.q).then?0:0));
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
  openPanel('perfilPanel');
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
  if(numero)numero.textContent=String(cantidad);
  if(masCuenta)masCuenta.textContent=String(cantidad);
  if(unidad)unidad.textContent=cantidad===1?'plataforma seguida':'plataformas seguidas';
  if(texto)texto.textContent=identidadConfirmada
   ?(cantidad?'Tu vigilancia está guardada y puedes gestionarla desde aquí.':'Todavía no vigilas ninguna plataforma.')
   :'Entra para consultar la vigilancia que tienes guardada.';
  if(accion)accion.textContent=identidadConfirmada?'Abrir mi lista':'Entrar y abrir mi lista';
  if(insignia){insignia.textContent=cantidad>99?'99+':String(cantidad);insignia.hidden=!cantidad;}
  if(tab)tab.setAttribute('aria-label',cantidad?'Siguiendo, '+cantidad:'Siguiendo');
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
  if(identidadConfirmada&&ses)abrirPerfil();
  else abrir('entrar','Entra para consultar y gestionar las plataformas que vigilas.');
 }

 /* --- arranque ---------------------------------------------------- */
 function iniciar(){
  const b=$('btnCuenta'); if(!b) return;          /* en el pre-renderizado no hay DOM */
  b.addEventListener('click',()=>identidadConfirmada?abrirPerfil():abrir('entrar'));
  $('cuentaX').addEventListener('click',cerrar);
  $('velo').addEventListener('click',()=>{cerrar();cerrarPanelPerfil();});
  $('perfilX').addEventListener('click',cerrarPanelPerfil);
  $('cuentaForm').addEventListener('submit',enviar);
  $('irCambiar').addEventListener('click',()=>abrir(modo==='entrar'?'registro':'entrar'));
  $('irRecuperar').addEventListener('click',()=>abrir('recuperar'));
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
   else if(acceso){
    guarda({access_token:acceso,refresh_token:p.get('refresh_token')||'',
      expira:Date.now()+(Number(p.get('expires_in'))||3600)*1000,correo:'',uid:''});
    confirmarIdentidad().then(async ok=>{
     if(!ok){pinta();abrir('entrar');msj('El enlace no es válido o ha caducado. Solicita uno nuevo.');return;}
     await cargarMio();pinta();if(fichaAbierta)pintarVigilar(fichaAbierta);
     if(tipo==='recovery')abrir('nueva_clave');
     else aviso('Correo confirmado. La cuenta ya está lista.');
    });
   }
  }
 }
 /* El pre-renderizado ejecuta este script en un DOM de juguete donde NO
    existen fetch ni location. Sin fetch este modulo no puede hacer nada,
    asi que esa es la senal mas fiable para salirse sin ruido. Ojo: no
    vale mirar el DOM, porque alli getElementById devuelve un nodo falso
    para cualquier id y la comprobacion pasaria igual. */
 if(typeof fetch!=='undefined' && typeof location!=='undefined') iniciar();

 return {abrir:abrir,abrirGestion:abrirGestion,pintarVigilar:pintarVigilar,
         actualizarMovil:pintaMovil,hay:()=>identidadConfirmada,
         uid:()=>identidadConfirmada&&ses&&ses.uid,token:testigo};
})();

/* =================================================================
   SHELL MÓVIL / PWA
   -----------------------------------------------------------------
   Cuatro pestañas como en la app instalada, sin convertir la web de
   escritorio en otra cosa. La composición móvil cambia de jerarquía,
   pero comparte el mismo DOM y estado: no duplica datos, filtros, 3D ni
   lógica de cuenta.
   ================================================================= */
const Movil = (function(){
 const media=window.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 540px) and (hover: none) and (pointer: coarse)');
 const tabs=[...document.querySelectorAll('#movilNav [data-movil-tab]')];
 const paneles=new Map([...document.querySelectorAll('[data-movil-panel]')]
  .map(p=>[p.dataset.movilPanel,p]));
 const cabEtiqueta=document.getElementById('movilCabeceraEtiqueta');
 const cabTitulo=document.getElementById('movilCabeceraTitulo');
 const cabSub=document.getElementById('movilCabeceraSub');
 const total=(document.getElementById('s1')&&document.getElementById('s1').textContent.trim())||'26';
 const textos={
  radar:['RADAR DE ACTIVOS REALES','Explora lo verificado',total+' plataformas · datos contrastados'],
  siguiendo:['TU SEGUIMIENTO','Plataformas seguidas','Guarda y gestiona lo que quieres vigilar'],
  avisos:['ESTADO Y NOVEDADES','Avisos claros','Preferencia y entrega son estados distintos'],
  mas:['CONTROL DE LA PWA','Más','Aprendizaje, cuenta, datos y privacidad']
 };
 let activa='radar';

 const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function geometria(){
  /* hidden deja canvas y SVG a ancho cero. Dos fotogramas permiten que
     el navegador recomponga antes de que WebGL vuelva a medir. */
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.dispatchEvent(new Event('resize'))));
 }
 function cabecera(id){
  const t=textos[id]||textos.radar;
  if(cabEtiqueta)cabEtiqueta.textContent=t[0];
  if(cabTitulo)cabTitulo.textContent=t[1];
  if(cabSub)cabSub.textContent=t[2];
 }
 function cambiar(id,opciones){
  if(!media.matches||!paneles.has(id))return;
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
  if(id==='radar')geometria();
 }
 function adaptar(){
  const esMovil=media.matches;
  if(document.documentElement&&document.documentElement.classList)
   document.documentElement.classList.toggle('movil-ui',esMovil);
  if(esMovil){cambiar(activa,{arriba:false});Cuenta.actualizarMovil();}
  else{
   document.body.removeAttribute('data-movil-pestana');
   document.body.classList.remove('movil-teclado');
   paneles.forEach((panel,nombre)=>{panel.hidden=nombre!=='radar';});
   geometria();
  }
 }
 function ir(destino){
  cambiar('radar',{arriba:false});
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
  if(cambio){e.preventDefault();cambiar(cambio.dataset.movilCambiar);return;}
  const destino=e.target.closest&&e.target.closest('[data-movil-ir]');
  if(destino){e.preventDefault();ir(destino.dataset.movilIr);return;}
  const accion=e.target.closest&&e.target.closest('[data-movil-action]');
  if(!accion)return;
  if(accion.dataset.movilAction==='ayuda'){e.preventDefault();ir('explain');}
  if(accion.dataset.movilAction==='cuenta'){e.preventDefault();Cuenta.abrirGestion();}
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
 const standalone=(typeof navigator!=='undefined'&&navigator.standalone===true)||
  window.matchMedia('(display-mode: standalone)').matches;
 if(document.documentElement&&document.documentElement.classList)
  document.documentElement.classList.toggle('pwa-standalone',standalone);
 if(media.addEventListener)media.addEventListener('change',adaptar);
 else if(media.addListener)media.addListener(adaptar);
 window.addEventListener('pageshow',()=>{adaptar();if(media.matches&&activa==='radar')geometria();});
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
 if(b.hasAttribute('data-filtrar-cat')){S2.cat=b.dataset.filtrarCat||'';return render();}
 if(b.dataset.abrir!=null){const i=Number(b.dataset.abrir);if(Number.isInteger(i))return openDrawer(i);}
 if(b.dataset.comparar!=null){const i=Number(b.dataset.comparar);if(Number.isInteger(i))return toggleCompare(i);}
 if(b.dataset.accion==='limpiar')return resetAll();
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

'use strict';

// Catálogo y estado originales intactos: la traducción afecta a presentación.
// No consulta servicios, no envía textos, no cambia cifras/URLs ni interpreta HTML.
(function(raiz,fabrica){
  const diccionario=typeof module==='object'&&module.exports ? require('./idioma-en') : raiz.RWAdarEnglish;
  const api=fabrica(diccionario || {});
  if(typeof module==='object'&&module.exports) module.exports=api;
  else raiz.RWAdarIdioma=api;
})(typeof globalThis==='object'?globalThis:this,function(diccionario){
  const CLAVE_IDIOMA='rwadar.idioma';
  const IDIOMAS=Object.freeze(['es','en']);
  const normalizar=texto=>String(texto).replace(/\s+/g,' ').trim();
  const mapa=new Map(Object.entries(diccionario).map(([es,en])=>[normalizar(es),en]));
  const mayusculas=new Map([...mapa].map(([es,en])=>[es.toLocaleUpperCase('es'),en.toUpperCase()]));
  const cache=new Map();
  const destinos=texto=>texto.match(/https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi)||[];
  function ingles(texto,profundidad=0){
    if(typeof texto!=='string'||!texto||/^(?:https?:\/\/|mailto:|rwadar\.|sb_|#[a-f0-9]{3,8}$)/i.test(texto))return texto;
    const literal=texto.trim(),limpio=normalizar(texto);
    if(!limpio)return texto;
    const anterior=profundidad===0?cache.get(literal):undefined;
    let resultado=anterior;
    if(resultado===undefined){
      resultado=mapa.get(limpio)||mayusculas.get(limpio);
      if(resultado===undefined&&profundidad<3){
        const t=s=>ingles(s,profundidad+1);
        const patrones=[
          // Inglés que faltaba (corrector de remates, 04/11/2026): avisos del catálogo, Plataformas, Academy y etiquetas accesibles.
          [/^Revisión pendiente[.:] [Ee]stos datos se revisaron el (.+?) y su revisión semanal ha caducado\. Las cifras caducadas se ocultan; comprueba cada dato en la web del emisor( antes de decidir)?\.$/,(m,f,d)=>'Review pending: these data were reviewed on '+f+' and their weekly review has expired. Out-of-date figures are hidden; check every detail on the issuer\'s website'+(d?' before deciding':'')+'.'],
          [/^No hemos podido comprobar la revisión más reciente\. Mostramos la última revisión completa, del (.+?)\. Comprueba cada dato en la web del emisor antes de decidir\.$/,(m,f)=>'We could not check the latest review. We are showing the last complete review, from '+f+'. Check every detail on the issuer\'s website before deciding.'],
          [/^Última revisión del catálogo: ([^·]+?)( · pendiente de renovar)?$/,(m,f,p)=>'Latest catalogue review: '+f+(p?' · pending renewal':'')],
          [/^de (\d+) plataformas · última revisión ([^·]+?)( · pendiente de renovar)?$/,(m,n,f,p)=>'of '+n+' platforms · last review '+f+(p?' · pending renewal':'')],
          [/^Revisión editorial( ·|:)? (\d.*)$/,(m,s,f)=>'Editorial review'+(s||'')+' '+f],
          // Ficha de oferta: referencias fechadas y enlaces a sus fuentes (QA móvil 04/11/2026).
          [/^Fecha del dato: (.+?) · Consultado el (.+)$/,(m,f,c)=>'Data date: '+(f==='no indicada en la fuente'?'not stated in the source':f)+' · Checked on '+c],
          [/^Ver fuente · (\S+) de (.+?): (https:\/\/\S+)$/,(m,h,r,u)=>'View source · '+h+' for '+t(r)+': '+u],
          [/^Ver fuente · (\S+) ↗$/,(m,h)=>'View source · '+h+' ↗'],
          [/^Fuente (\d+) · (\S+): (https:\/\/\S+)$/,(m,n,h,u)=>'Source '+n+' · '+h+': '+u],
          [/^Fuente (\d+) · (.+?) de (.+)$/,(m,n,r,d)=>'Source '+n+' · '+t(r)+' for '+t(d)],
          [/^Fuente (\d+) · (.+) ↗$/,(m,n,r)=>'Source '+n+' · '+t(r)+' ↗'],
          [/^Fuente de (.+)$/,(m,x)=>{const y=t(x);return y===x?m:'Source for '+y;}],
          [/^Ninguna oferta coincide con «(.+)»$/,(m,q)=>'No offer matches «'+q+'»'],
          [/^Ver (\d+) más$/,(m,n)=>'Show '+n+' more'],
          [/^Mostrar solo (\d+)$/,(m,n)=>'Show only '+n],
          [/^(\d+) de (\d+) lecciones leídas$/,(m,n,total)=>n+' of '+total+' lessons read'],
          [/^de (\d+) lecciones leídas en este navegador$/,(m,n)=>'of '+n+' lessons read in this browser'],
          [/^(\d+) de (\d+) lecci(?:ón disponible|ones disponibles) · (\d+) min de lectura$/,(m,n,total,min)=>n+' of '+total+(total==='1'?' lesson':' lessons')+' available · '+min+' min read'],
          [/^Lección (\d+) · (.+) · (\d+) min$/,(m,n,c,min)=>'Lesson '+n+' · '+t(c)+' · '+min+' min'],
          [/^Lección (\d+) de (\d+) · Nivel (\d+) · (.+)$/,(m,n,total,nv,nombre)=>'Lesson '+n+' of '+total+' · Level '+nv+' · '+t(nombre)],
          [/^(← Anterior|Siguiente →) · Lección (\d+)$/,(m,a,n)=>(a==='← Anterior'?'← Previous':'Next →')+' · Lesson '+n],
          [/^(\d+) preguntas\. No hay nota ni se envía nada: al responder verás si has acertado y por qué\.$/,(m,n)=>n+' questions. There is no score and nothing is sent: when you answer, you will see whether you got it right and why.'],
          [/^test de (\d+) preguntas$/,(m,n)=>n+'-question quiz'],
          [/^(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})$/,(m,d,mes,a)=>d+' '+{enero:'January',febrero:'February',marzo:'March',abril:'April',mayo:'May',junio:'June',julio:'July',agosto:'August',septiembre:'September',octubre:'October',noviembre:'November',diciembre:'December'}[mes]+' '+a],
          [/^\. Jurisdicción de referencia: (.+)\.$/,(m,j)=>'. Reference jurisdiction: '+t(j)+'.'],
          [/^(\d+) de (\d+) fichas\. (.+)$/,(m,n,total,resto)=>n+' of '+total+' entries. '+t(resto)],
          [/^Ver solo (.+) en el radar$/,(m,c)=>'Show only '+t(c)+' on the radar'],
          [/^(.+?)\. (.+?)\. (?:Estado de acceso|Acceso): (.+?)\. Abrir ficha\.$/,(m,n,c,a)=>n+'. '+t(c)+'. Access: '+t(a)+'. Open details.'],
          [/^(.+) · (.+) · acceso: (.+)$/,(m,n,c,a)=>n+' · '+t(c)+' · access: '+t(a)],
          [/^Abrir la ficha de (.+?)(; portada ilustrativa)?$/,(m,n,p)=>'Open the details for '+n+(p?'; illustrative cover':'')],
          [/^Abrir la web oficial de (.+)$/,(m,n)=>'Open the official website of '+n],
          [/^Añadir (.+) a la comparación$/,(m,n)=>'Add '+n+' to the comparison'],
          [/^Quitar (.+) de la comparación$/,(m,n)=>'Remove '+n+' from the comparison'],
          [/^Guardar: (.+)$/,(m,n)=>'Save: '+n],
          [/^Quitar de guardadas: (.+)$/,(m,n)=>'Remove from saved: '+n],
          [/^Ver oferta en (.+)$/,(m,n)=>'See the offer on '+n],
          [/^Ficha oficial: (.+)$/,(m,n)=>'Official page: '+n],
          [/^Paso (\d+): (.+)$/,(m,n,c)=>'Step '+n+': '+t(c)],
          [/^✕ No es esa\. La correcta es la ([A-D]): aquí tienes por qué\.$/,(m,l)=>'✕ Not that one. The correct answer is '+l+': here is why.'],
          [/^✓ Leída · (Test \d+\/\d+)$/,(m,x)=>'✓ Read · '+x],
          [/^(\d+) de (\d+) lecciones leídas en este dispositivo$/,(m,n,total)=>n+' of '+total+' lessons read on this device'],
          [/^Lección (\d+): (.+)\. Próximamente$/,(m,n,ti)=>'Lesson '+n+': '+t(ti)+'. Coming soon'],
          [/^Lección (\d+): (.+)\. (\d+) minutos\.(?: (.+)\.)?$/,(m,n,ti,min,e)=>'Lesson '+n+': '+t(ti)+'. '+min+' minutes.'+(e?' '+t(e)+'.':'')],
          [/^(Anterior|Siguiente): lección (\d+), (.+)$/,(m,a,n,ti)=>(a==='Anterior'?'Previous':'Next')+': lesson '+n+', '+t(ti)],
          [/^(.+): próximamente$/,(m,n)=>t(n)+': coming soon'],
          [/^LECCIÓN (\d+) →$/,(m,n)=>'LESSON '+n+' →'],
          [/^← LECCIÓN (\d+)$/,(m,n)=>'← LESSON '+n],
          [/^([A-D])\. (.+?)\. Respuesta (correcta|incorrecta)$/,(m,l,o,r)=>l+'. '+t(o)+'. '+(r==='correcta'?'Correct answer':'Incorrect answer')],
          [/^Has acertado (\d+) de (\d+)\.(?: (.+))?$/,(m,n,total,r)=>'You got '+n+' out of '+total+' right.'+(r?' '+t(r):'')],
          [/^(Ofertas guardadas|Plataformas guardadas) · (\d+)$/,(m,tipo,n)=>(tipo==='Ofertas guardadas'?'Saved offers':'Saved platforms')+' · '+n],
          [/^Lección (\d+) de (\d+)$/,(m,n,total)=>'Lesson '+n+' of '+total],
          [/^Ver (\d+) exclusiones$/,(m,n)=>'View '+n+' exclusions'],
          [/^(\d+) guardad[oa]s? en este dispositivo$/,(m,n)=>n+' saved on this device'],
          [/^Información comprobada el (\d{2}\/\d{2}\/\d{4})\.$/,(m,f)=>'Information checked on '+f+'.'],
          [/^· (\d+) más en la ficha$/,(m,n)=>'· '+n+' more in the full details'],
          [/^Movimientos y fechas · (\d+)$/,(m,n)=>'Transactions and dates · '+n],
          [/^(Añadir movimiento|Actualizar precio|Eliminar inversión) · (.+)$/,(m,accion,n)=>({'Añadir movimiento':'Add transaction','Actualizar precio':'Update price','Eliminar inversión':'Delete investment'}[accion])+' · '+n],
          [/^Se eliminarán «(.+)» y sus movimientos de tu cuenta\. La copia local anterior se conserva\.$/,(m,n)=>'«'+n+'» and its transactions will be deleted from your account. The previous local copy is kept.'],
          [/^Se eliminarán «(.+)» y sus movimientos de este dispositivo\.$/,(m,n)=>'«'+n+'» and its transactions will be deleted from this device.'],

          [/^Fuente consultada (\d{2}\/\d{2}\/\d{4})$/,(m,f)=>'Source checked on '+f],
          [/^(\d+) de (\d+) (principales|en reventa|próximas)$/,(m,n,total,c)=>n+' of '+total+' '+({principales:'main offers','en reventa':'on resale','próximas':'upcoming'}[c])],
          [/^cifras vigentes (\d+) d$/,(m,n)=>'figures valid for '+n+' d'],
          [/^cifras vigentes hasta hoy$/,()=>'figures valid until today'],
          [/^cifras válidas (\d+) días? más$/,(m,n)=>'figures valid for '+n+(n==='1'?' more day':' more days')],
          [/^cifras válidas hasta hoy$/,()=>'figures valid until today'],
          [/^(\d+) avisos? en la ficha$/,(m,n)=>n+(n==='1'?' warning':' warnings')+' in the details'],
          [/^Desde (\d+(?:,\d+)?) € en reventa \((\d{2}\/\d{2})\)$/,(m,n,f)=>'From €'+n+' on resale ('+f+')'],
          [/^· consultada el (.+)$/,(m,f)=>'· checked on '+f],
          [/^Revisada el (\d{2}[./]\d{2}[./]\d{4}); (.+)\.$/,(m,f,e)=>'Reviewed on '+f+'; '+t(e)+'.'],
          [/^(.+) · fuente de: (.+)$/,(m,n,c)=>n+' · source for: '+t(c)],
          [/^(\d+) acci(?:ón|ones) \((.+)\)$/,(m,n,r)=>n+(n==='1'?' share':' shares')+' ('+r+')'],
          [/^Revisión documental (\d{2}\/\d{2}\/\d{4})$/,(m,f)=>'Documentary review '+f],
          [/^Próximas (\d+)$/,(m,n)=>'Upcoming '+n],
          [/^(Inicio|Buscar|Academy|Perfil), (\d+\+?)$/,(m,n,total)=>t(n)+', '+total],
          [/^Filtrar por (.+)$/,(m,n)=>'Filter by '+t(n)],
          [/^Cerrar ficha de (.+)$/,(m,n)=>'Close platform details for '+n],
          [/^Abrir fuente: (.+)$/,(m,n)=>'Open source: '+n],
          [/^Dejar de seguir (.+)$/,(m,n)=>'Unfollow '+n],
          [/^Seguir (.+)$/,(m,n)=>'Follow '+n],
          [/^(\d+) de (\d+) fichas · (\d+) en el catálogo$/,(m,n,total,todas)=>n+' of '+total+' entries · '+todas+' in the catalogue'],
          [/^(\d+) principales · (\d+) referencias secundarias$/,(m,n,s)=>n+' main offers · '+s+' secondary references'],
          [/^Filtros adicionales(?:, (\d+) activos)?$/,(m,n)=>'Additional filters'+(n?', '+n+' active':'')],
          [/^Guardar (.+) en Perfil$/,(m,n)=>'Save '+n+' to Profile'],
          [/^Quitar (.+) de guardadas$/,(m,n)=>'Remove '+n+' from saved items'],
          [/^Ver (\d+) referencias\s*→$/,(m,n)=>'View '+n+' references →'],
          [/^Ver sus (\d+) ofertas\s*→$/,(m,n)=>'View its '+n+' offers →'],
          [/^(.+): ver sus (\d+) ofertas$/,(m,p,n)=>p+': view its '+n+' offers'],
          [/^Consultamos la fuente por última vez el (.+)$/,(m,f)=>'We last checked the source on '+f],
          [/^El dato es del (.+)$/,(m,f)=>'The data is from '+f],
          [/^(Guardar|Quitar|Cerrar|Abrir) (.+)$/,(m,a,b)=>({Guardar:'Save',Quitar:'Remove',Cerrar:'Close',Abrir:'Open'}[a])+' '+t(b)],
          [/^Ver ficha de (.+?)(?: en (.+))?$/,(m,a,b)=>'View details for '+t(a)+(b?' from '+t(b):'')],
          [/^Ver (\d+) referencias de (.+)$/,(m,n,p)=>'View '+n+' references from '+p],
          [/^Ver (\d+) referencias$/,(m,n)=>'View '+n+' references'],
          [/^(.+): ver (\d+) referencias$/,(m,n,total)=>n+': view '+total+' references'],
          [/^Mostrar (principales|secundario|en camino|en_camino|próximas) (\d+)$/,(m,g,n)=>'Show '+({principales:'main offers',secundario:'secondary market','en camino':'upcoming',en_camino:'upcoming','próximas':'upcoming'}[g])+' '+n],
          [/^Registrar inversión en (.+)$/,(m,n)=>'Record investment in '+n],
          [/^(\d+) de (\d+) (fichas?|plataformas?|ofertas?)(.*)$/,(m,n,total,tipo,resto)=>n+' of '+total+' '+({ficha:'entry',fichas:'entries',plataforma:'platform',plataformas:'platforms',oferta:'offer',ofertas:'offers'}[tipo])+t(resto)],
          [/^(\d+) (fichas?|plataformas?|ofertas?|referencias|días?|lecciones)(.*)$/,(m,n,tipo,resto)=>n+' '+({ficha:'entry',fichas:'entries',plataforma:'platform',plataformas:'platforms',oferta:'offer',ofertas:'offers',referencias:'references','día':'day','días':'days',lecciones:'lessons'}[tipo])+t(resto)],
          [/^(Consultada|Consultado|Comprobada|Comprobado|Revisada|Revisado) (?:el )?(.+)$/,(m,tipo,fecha)=>(/^Consult/.test(tipo)?'Checked on ':/^Comprob/.test(tipo)?'Verified on ':'Reviewed on ')+fecha],
          [/^(.+?)\. (?:Estado de acceso|Acceso): (.+?)\. Abrir ficha\.$/,(m,n,a)=>t(n)+'. Access: '+t(a)+'. Open details.'],
          [/^(.+?)\. Filtro activo\. Quitar filtro\.$/,(m,n)=>t(n)+'. Filter active. Clear filter.'],
          [/^(.+)\. Abrir ficha\.$/,(m,n)=>n+'. Open details.'],
          [/^(.+?)\. Filtrar plataformas de esta categoría\.$/,(m,n)=>t(n)+'. Filter platforms by this category.'],
          [/^(\d+) seleccionadas?$/,(m,n)=>n+' selected'],
          // Chips con su recuento («Inmobiliario 8», «Todas 26»): solo si el nombre entero tiene traducción.
          [/^(.+?) (\d+)$/,(m,n,k)=>{const x=t(n);return x===n?m:x+' '+k;}],
        ];
        for(const [patron,reemplazo]of patrones)if(patron.test(literal)){resultado=literal.replace(patron,reemplazo);break;}
      }
      // Solo frases completas revisadas o plantillas explícitas de interfaz.
      // Nunca sustituir palabras sueltas dentro de documentos o nombres.
      if(resultado===undefined)resultado=literal;
      const origenes=destinos(literal),salidas=destinos(resultado);
      if(origenes.length!==salidas.length||origenes.some((s,i)=>s!==salidas[i]))resultado=literal;
      if(profundidad===0){if(cache.size>5000)cache.clear();cache.set(literal,resultado);}
    }
    return (texto.match(/^\s*/)?.[0]||'')+resultado+(texto.match(/\s*$/)?.[0]||'');
  }
  function crearGestorIdioma(){
    let actual='es',version=0,almacen=null,cola=Promise.resolve();
    const escuchas=new Set();
    const obtener=()=>actual;
    const suscribir=fn=>{escuchas.add(fn);return()=>escuchas.delete(fn);};
    function aplicar(idioma){
      if(!IDIOMAS.includes(idioma))throw new RangeError('Idioma no admitido');
      version++;
      if(actual!==idioma){actual=idioma;for(const fn of [...escuchas])fn();}
    }
    function cambiar(idioma){
      aplicar(idioma);
      if(!almacen)return Promise.resolve(idioma);
      cola=cola.catch(()=>{}).then(()=>almacen.setItem(CLAVE_IDIOMA,idioma));
      return cola.then(()=>idioma);
    }
    async function cargar(entrada){
      if(!entrada||typeof entrada.getItem!=='function'||typeof entrada.setItem!=='function')throw new TypeError('Almacenamiento de idioma no válido');
      almacen=entrada;
      const antes=version;
      let guardado;
      try{guardado=await entrada.getItem(CLAVE_IDIOMA);}catch{return actual;}
      if(version===antes&&IDIOMAS.includes(guardado))aplicar(guardado);
      return actual;
    }
    const traducir=(texto,idioma=actual)=>idioma==='en'?ingles(texto):texto;
    return Object.freeze({obtener,suscribir,cambiar,cargar,traducir});
  }
  const gestor=crearGestorIdioma();
  const fuenteOriginal=(texto,idioma='es')=>Object.freeze({texto,idioma,esOriginal:true});
  return Object.freeze({CLAVE_IDIOMA,IDIOMAS,crearGestorIdioma,ingles,fuenteOriginal,
    obtenerIdioma:gestor.obtener,suscribirIdioma:gestor.suscribir,
    cambiarIdioma:gestor.cambiar,cargarIdioma:gestor.cargar,traducir:gestor.traducir});
});

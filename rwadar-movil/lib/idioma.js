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
          [/^(Guardar|Quitar|Cerrar|Abrir) (.+)$/,(m,a,b)=>({Guardar:'Save',Quitar:'Remove',Cerrar:'Close',Abrir:'Open'}[a])+' '+t(b)],
          [/^Ver ficha de (.+?)(?: en (.+))?$/,(m,a,b)=>'View details for '+t(a)+(b?' from '+t(b):'')],
          [/^Ver (\d+) referencias de (.+)$/,(m,n,p)=>'View '+n+' references from '+p],
          [/^Ver (\d+) referencias$/,(m,n)=>'View '+n+' references'],
          [/^(.+): ver (\d+) referencias$/,(m,n,total)=>n+': view '+total+' references'],
          [/^Mostrar (principales|secundario|en camino|en_camino) (\d+)$/,(m,g,n)=>'Show '+({principales:'main offers',secundario:'secondary market','en camino':'upcoming',en_camino:'upcoming'}[g])+' '+n],
          [/^(\d+) de (\d+) (fichas?|plataformas?|ofertas?)(.*)$/,(m,n,total,tipo,resto)=>n+' of '+total+' '+({ficha:'entry',fichas:'entries',plataforma:'platform',plataformas:'platforms',oferta:'offer',ofertas:'offers'}[tipo])+t(resto)],
          [/^(\d+) (fichas?|plataformas?|ofertas?|referencias|días?|lecciones)(.*)$/,(m,n,tipo,resto)=>n+' '+({ficha:'entry',fichas:'entries',plataforma:'platform',plataformas:'platforms',oferta:'offer',ofertas:'offers',referencias:'references','día':'day','días':'days',lecciones:'lessons'}[tipo])+t(resto)],
          [/^(Consultada|Consultado|Comprobada|Comprobado|Revisada|Revisado) (?:el )?(.+)$/,(m,tipo,fecha)=>(/^Consult/.test(tipo)?'Checked on ':/^Comprob/.test(tipo)?'Verified on ':'Reviewed on ')+fecha],
          [/^(.+?)\. (?:Estado de acceso|Acceso): (.+?)\. Abrir ficha\.$/,(m,n,a)=>t(n)+'. Access: '+t(a)+'. Open details.'],
          [/^(.+?)\. Filtro activo\. Quitar filtro\.$/,(m,n)=>t(n)+'. Filter active. Clear filter.'],
          [/^(.+?)\. Filtrar plataformas de esta categoría\.$/,(m,n)=>t(n)+'. Filter platforms by this category.'],
          [/^(\d+) seleccionadas?$/,(m,n)=>n+' selected'],
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

'use strict';
/* Metadatos geográficos separados del catálogo. Sin red ni almacenamiento. */
(function(raiz,fabrica){
 const api=fabrica();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else raiz.RWADARMapaUtil=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const normalizar=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
  .replace(/\b(viena|vienna)\b/g,'wien').replace(/\babu dhabi\b/g,'abu dabi');
 const coordenadas=p=>p&&typeof p.lat==='number'&&typeof p.lng==='number'&&
  Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
 function validar(documento){
  if(documento?.version!==1||!Array.isArray(documento.ubicaciones))throw Error('Formato de ubicaciones no reconocido');
  const slugs=new Set();
  return documento.ubicaciones.map(p=>{
   let url;try{url=new URL(p.fuente);}catch{throw Error('Falta una fuente válida de ubicación');}
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug||'')||slugs.has(p.slug)||!coordenadas(p)||
     !['activo','ciudad'].includes(p.precision)||url.protocol!=='https:'||url.username||url.password||
     ![p.lugar,p.localidad,p.pais].every(v=>typeof v==='string'&&v.trim())||
     !/^\d{4}-\d{2}-\d{2}$/.test(p.fechaConsulta||'')||
     !Number.isFinite(Date.parse(p.fechaConsulta+'T00:00:00Z'))||
     new Date(p.fechaConsulta+'T00:00:00Z').toISOString().slice(0,10)!==p.fechaConsulta)
    throw Error('Una ubicación no supera el contrato documental');
   slugs.add(p.slug);
   return Object.freeze({slug:p.slug,lat:p.lat,lng:p.lng,precision:p.precision,lugar:p.lugar.trim(),
    localidad:p.localidad.trim(),pais:p.pais.trim(),fuente:url.href,fechaConsulta:p.fechaConsulta,nota:String(p.nota||'')});
  });
 }
 function unir(ofertas,ubicaciones){
  const porSlug=new Map(ubicaciones.map(p=>[p.slug,p]));
  return ofertas.filter(o=>o?.catalogo===true&&porSlug.has(o.slug)).map(o=>({oferta:o,ubicacion:porSlug.get(o.slug)}));
 }
 function distancia(a,b){
  if(!coordenadas(a)||!coordenadas(b))return null;
  const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLng=(b.lng-a.lng)*r;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;
  return 6371.0088*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
 }
 function buscar(filas,consulta){
  const palabras=normalizar(consulta).split(/\s+/).filter(Boolean);
  return filas.filter(({oferta:o,ubicacion:p})=>{
   const texto=normalizar([o.titulo,o.plataformaNombre,p.lugar,p.localidad,p.pais].join(' '));
   return palabras.every(palabra=>texto.includes(palabra));
  });
 }
 function ordenar(filas,origen){
  return filas.map(f=>({...f,distanciaKm:distancia(origen,f.ubicacion)})).sort((a,b)=>
   (a.distanciaKm??Infinity)-(b.distanciaKm??Infinity)||
   String(a.oferta.titulo).localeCompare(String(b.oferta.titulo),'es'));
 }
 function agrupar(filas){
  const grupos=new Map();
  for(const f of filas){const p=f.ubicacion,clave=p.lat.toFixed(6)+','+p.lng.toFixed(6);
   if(!grupos.has(clave))grupos.set(clave,[]);grupos.get(clave).push(f);}
  return [...grupos.values()];
 }
 // Agrupa lo que se taparía en pantalla: «proyectar» pasa cada punto a
 // píxeles del zoom actual y quedan juntos los que están a menos de «radio».
 function agruparCerca(filas,proyectar,radio=36){
  const grupos=[],cerca=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<radio;
  const sumar=(g,x,y,n)=>{const total=g.n+n;g.x=(g.x*g.n+x*n)/total;g.y=(g.y*g.n+y*n)/total;g.n=total;};
  for(const f of filas){
   const p=proyectar(f.ubicacion);let mejor=null;
   for(const g of grupos)if(cerca(g,p)&&(!mejor||Math.hypot(g.x-p.x,g.y-p.y)<Math.hypot(mejor.x-p.x,mejor.y-p.y)))mejor=g;
   if(mejor){mejor.filas.push(f);sumar(mejor,p.x,p.y,1);}else grupos.push({x:p.x,y:p.y,n:1,filas:[f]});
  }
  // Al moverse el centro de un grupo puede quedar encima de otro: se unen.
  for(let i=0;i<grupos.length;i++)for(let j=i+1;j<grupos.length;j++)if(cerca(grupos[i],grupos[j])){
   const b=grupos.splice(j,1)[0];grupos[i].filas.push(...b.filas);sumar(grupos[i],b.x,b.y,b.n);i=-1;break;
  }
  return grupos.map(g=>g.filas);
 }
 return Object.freeze({normalizar,coordenadas,validar,unir,distancia,buscar,ordenar,agrupar,agruparCerca});
});

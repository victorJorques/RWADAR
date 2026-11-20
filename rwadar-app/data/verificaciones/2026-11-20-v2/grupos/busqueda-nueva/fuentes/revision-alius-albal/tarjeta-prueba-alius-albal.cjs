const path=require('path'),fs=require('fs');
const ROOT='/home/user/RWADAR';
const {resumenOferta,idiomaCita}=require(path.join(ROOT,'rwadar-site/assets/ficha-editorial-20261022.js'));
const exp=JSON.parse(fs.readFileSync(path.join(ROOT,'rwadar-app/data/verificaciones/2026-11-20-v2/expedientes/candidata-alius-albal-token-flip.json'),'utf8'));
const esc=JSON.parse(fs.readFileSync(path.join(ROOT,'rwadar-app/data/verificaciones/2026-11-13-v2/escaparate-publicacion.json'),'utf8'));
const modelo=esc.ofertas.find(o=>o.slug==='hausera-proximas-ofertas');
const p=exp.propuestaTarjeta, rt=p.resumenTarjeta||{};
// helpers copiados de rwadar-site/assets/rwadar-20260820.js (2571, 2644-2645, 2688-2712), sin TRANSPARENCIA_POR_SLUG
const textoLocal=v=>typeof v==='string'?v.trim():'';
function textoCortoLocal(v,max=40){const t=textoLocal(v);if(t.length<=max)return t;const c=t.slice(0,max+1),i=c.lastIndexOf(' ');return (i>12?c.slice(0,i):t.slice(0,max)).replace(/[\s,;:·.(-]+$/,'')+'…';}
function textoBreveDatoTarjetaLocal(campo){if(campo&&campo.texto==='No documentado en euros'&&textoLocal(campo.unidadDocumentada))return textoLocal(campo.unidadDocumentada);
 return ({'No documentado en euros':'No verificado','Sin mínimo vigente en euros':'No verificado','Sin comprobar si se puede contratar desde España':'Sin confirmar','Salida no documentada':'Sin documentar','Disponible desde España según la fuente':'Disponible','No disponible desde España según la fuente':'No disponible'})[campo.texto]||campo.texto;}
const minimoDoc=r=>!!(r&&r.minimo&&(Number.isFinite(r.minimo.euros)||textoLocal(r.minimo.unidadDocumentada)));
const salidaDoc=r=>!!(r&&r.salida&&textoLocal(r.salida.texto)&&!['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto));
const espana=(r,c=false)=>{const a=r&&r.accesoEspana&&r.accesoEspana.estado;return a==='si'?(c?'Sí':'Sí, según la fuente'):a==='no'?(c?'No':'No, según la fuente'):'Sin confirmar';};
function cortos(r){const minimo=minimoDoc(r)?textoCortoLocal(textoBreveDatoTarjetaLocal(r.minimo)):textoBreveDatoTarjetaLocal(r.minimo);
 const salida=salidaDoc(r)?textoCortoLocal(textoBreveDatoTarjetaLocal(r.salida).replace(/^Salida:\s*/,'')):(r.vencida?'Pendiente de volver a comprobar':'Sin documentar');
 return {lineaTarjeta:`Mínimo ${minimo} · España ${espana(r,true)}`,loEsencial:{minimo:r.minimo.texto,espana:espana(r),salida:r.salida.texto,salidaCorta:salida},estado:r.estado.texto,cifrasVigentes:r.cifrasVigentes,vencida:r.vencida};}
const KIIS='https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/182/document/334';
const ref=(etiqueta,valor,fuente,fechaDato)=>({etiqueta,valor,fuente,fechaConsulta:'2026-11-20',fechaDato});
const refs=[];
if(rt.minimo)refs.push(ref('Mínimo de inversión',rt.minimo,KIIS,'2026-11-08'));
if(rt.accesoEspana)refs.push(ref('Acceso desde España',rt.accesoEspana,KIIS,'2026-11-08'));
if(rt.salida)refs.push(ref('Salida',rt.salida,KIIS,'2026-11-08'));
const base={...Object.fromEntries(Object.keys(modelo).map(k=>[k,null])),slug:exp.slug.replace(/^candidata-/,''),tipo:p.tipo,titulo:p.titulo,plataformaSlug:exp.plataformaSlug,
 plataformaNombre:exp.proveedor,categoria:p.categoria,pais:p.pais,resumen:p.resumen,url:p.url,cta:'Ver fuente',imagenAlt:p.titulo,verificadaEl:'2026-11-20',vigenciaDias:7,permanente:false,
 disponibleEs:exp.disponibleEs==='si'?true:exp.disponibleEs==='no'?false:null,eu:null,fueraLadrillo:false,puntuacion:null,rentabilidad:p.rentabilidad,precio:null,metricas:p.metricas,avisos:p.avisos,
 fuentesActuales:p.fuentesActuales,coleccion:p.coleccion,moneda:exp.moneda,patrocinada:false,documentacion:{revisadaEl:'2026-11-20',fuentes:p.fuentesActuales,referencias:refs}};
const hoy=new Date('2026-11-20T21:35:00Z');
const casos={
 'A · tal cual (coleccion null = principales, estadoRevision no_verificable)':{...base,estadoRevision:'no_verificable'},
 'B · como «Próximas» (en_camino, no_verificable), como Hausera':{...base,coleccion:'en_camino',estadoRevision:'no_verificable'},
 'C · hipotético principales «actual»':{...base,estadoRevision:'actual'},
 'D · próximas con salida y acceso redactados (hipotético)':{...base,coleccion:'en_camino',estadoRevision:'no_verificable',documentacion:{revisadaEl:'2026-11-20',fuentes:p.fuentesActuales,referencias:[...refs,
   ref('Acceso desde España','Disponible para particulares en España (plataforma inscrita en la CNMV)',KIIS,'2026-11-08'),
   ref('Salida','Sin mercado secundario: se cobra al vencimiento, 15 meses después del cierre',KIIS,'2026-11-08')]}},
};
for(const [k,o] of Object.entries(casos)){const r=resumenOferta(o,[],hoy);console.log('\n=== '+k);console.log(JSON.stringify(cortos(r),null,1));}
console.log('\n=== claves del modelo ausentes en la prueba:',Object.keys(modelo).filter(k=>!(k in base)).join(', ')||'(ninguna)');
const textos={titulo:p.titulo,resumen:p.resumen,minimo:rt.minimo,resumenCorto:exp.resumenCorto};
console.log('\n=== textos');
for(const [k,v] of Object.entries(textos))if(v)console.log(`${k}: ${v.length} caracteres · idioma «${idiomaCita(v)}» · ${/por (participaci[oó]n|token|acci[oó]n)/i.test(v)?'CON «por …»':'sin «por …»'} · ${/rentab|garantiz|oportunidad|\d\s?%/i.test(v)?'PALABRA/CIFRA VIGILADA':'sin palabras vigiladas'} · fechas: ${(v.match(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g)||[]).join(' ')||'-'}`);

const path='/home/user/RWADAR/rwadar-site/assets/ficha-editorial-20261022.js';
const {resumenOferta}=require(path);
const exp=require('/home/user/RWADAR/rwadar-app/data/verificaciones/2026-11-20-v2/expedientes/candidata-crowdedhero-bonos-dlt.json');
const p=exp.propuestaTarjeta, rt=p.resumenTarjeta;
const NYALA='https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf';
const DLT='https://www.crowdedhero.com/legal?category=dlt';
const CNMV='https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001';
const P50='https://www.crowdedhero.com/project/view?id=50';
// helpers copiados de rwadar-site/assets/rwadar-20260820.js (lineas 2571, 2644-2645, 2688-2712)
const textoLocal=v=>typeof v==='string'?v.trim():'';
function textoCortoLocal(v,max=40){const t=textoLocal(v);if(t.length<=max)return t;const c=t.slice(0,max+1),i=c.lastIndexOf(' ');return (i>12?c.slice(0,i):t.slice(0,max)).replace(/[\s,;:·.(-]+$/,'')+'…';}
function textoBreveDatoTarjetaLocal(campo){if(campo&&campo.texto==='No documentado en euros'&&textoLocal(campo.unidadDocumentada))return textoLocal(campo.unidadDocumentada);
 return ({'No documentado en euros':'No verificado','Sin mínimo vigente en euros':'No verificado','Sin comprobar si se puede contratar desde España':'Sin confirmar','Salida no documentada':'Sin documentar','Disponible desde España según la fuente':'Disponible','No disponible desde España según la fuente':'No disponible'})[campo.texto]||campo.texto;}
function minimoDocumentadoLocal(r){return !!(r&&r.minimo&&(Number.isFinite(r.minimo.euros)||textoLocal(r.minimo.unidadDocumentada)))}
function salidaDocumentadaLocal(r){return !!(r&&r.salida&&textoLocal(r.salida.texto)&&!['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto))}
function textoEspanaOferta(resumen,corto=false){const a=resumen&&resumen.accesoEspana&&resumen.accesoEspana.estado;return a==='si'?(corto?'Sí':'Sí, según la fuente'):a==='no'?(corto?'No':'No, según la fuente'):'Sin confirmar';}
function datosCortos(resumen){const minimo=minimoDocumentadoLocal(resumen)?textoCortoLocal(textoBreveDatoTarjetaLocal(resumen.minimo)):textoBreveDatoTarjetaLocal(resumen.minimo);
 const salida=salidaDocumentadaLocal(resumen)?textoCortoLocal(textoBreveDatoTarjetaLocal(resumen.salida).replace(/^Salida:\s*/,'')):'Sin documentar';
 return {lineaTarjeta:`Mínimo ${minimo} · España ${textoEspanaOferta(resumen,true)}`,fichaLoEsencial:{minimo:resumen.minimo.texto,espana:textoEspanaOferta(resumen),salida:resumen.salida.texto,salidaCorta:salida},estado:resumen.estado.texto};}
function oferta(refs,extra={}){return {slug:'candidata-crowdedhero-bonos-dlt',tipo:p.tipo,titulo:p.titulo,plataformaSlug:null,plataformaNombre:'CrowdedHero',categoria:p.categoria,pais:p.pais,resumen:p.resumen,url:p.url,cta:'Ver fuente',imagenAlt:p.titulo,verificadaEl:'2026-11-20',vigenciaDias:7,permanente:false,disponibleEs:true,eu:null,fueraLadrillo:true,puntuacion:null,rentabilidad:null,precio:null,metricas:p.metricas,avisos:p.avisos,estadoRevision:'actual',fuentesActuales:p.fuentesActuales,coleccion:'principales',moneda:'EUR',patrocinada:false,
 documentacion:{revisadaEl:'2026-11-20',fuentes:p.fuentesActuales,referencias:refs},...extra};}
const hoy=new Date('2026-11-20T21:30:00Z');
const ref=(etiqueta,valor,fuente,fechaDato)=>({etiqueta,valor,fuente,fechaConsulta:'2026-11-20',fechaDato});
const casos={
 'A · tal cual propuestaTarjeta (salida con fuente terminos NYALA)':[ref('Mínimo de inversión',rt.minimo,P50,'2026-11-20'),ref('Acceso desde España',rt.accesoEspana,CNMV,'2022-09-01'),ref('Salida',rt.salida,NYALA,'2026-07-03')],
 'A2 · tal cual, salida con fuente contrato DLT (no esta en fuentesActuales)':[ref('Mínimo de inversión',rt.minimo,P50,'2026-11-20'),ref('Acceso desde España',rt.accesoEspana,CNMV,'2022-09-01'),ref('Salida',rt.salida,DLT,'2026-07-01')],
 'B · textos corregidos':[ref('Mínimo de inversión','Desde 250 €',P50,'2026-11-20'),ref('Acceso desde España','Disponible para residentes en España: la plataforma está notificada a la CNMV (n.º 1)',CNMV,'2022-09-01'),ref('Salida','Sin mercado secundario: se cobra al vencimiento (Simpleros, 15/11/2028)',NYALA,'2026-07-03')],
 'C · revision en conflicto (estadoRevision fuentes_en_conflicto)':null,
};
for(const [k,refs] of Object.entries(casos)){
 const o=refs?oferta(refs):oferta(casos['A · tal cual propuestaTarjeta (salida con fuente terminos NYALA)'],{estadoRevision:'fuentes_en_conflicto'});
 const r=resumenOferta(o,[],hoy);
 console.log('\n=== '+k);console.log(JSON.stringify(datosCortos(r),null,1));
 console.log('minimo:',JSON.stringify(r.minimo));console.log('accesoEspana:',JSON.stringify(r.accesoEspana));
}
const textos={titulo:p.titulo,resumen:p.resumen,minimo:rt.minimo,accesoEspana:rt.accesoEspana,salida:rt.salida};
console.log('\n=== longitudes');for(const [k,v] of Object.entries(textos))console.log(k,v.length,/por (token|participaci[oó]n|acci[oó]n)/i.test(v)?'CONTIENE por token/participacion/accion':'', /rentab|garantiz|oportunidad|\d+[,.]?\d*\s?%/i.test(v)?'tiene % o palabra vetada':'' , /\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(v)?'fecha DD/MM/AAAA':'');

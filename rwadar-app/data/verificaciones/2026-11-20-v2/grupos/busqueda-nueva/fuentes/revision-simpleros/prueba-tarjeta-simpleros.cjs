// Prueba de presentación: oferta de prueba con la forma de escaparate-publicacion.json (13/11)
// a partir de propuestaTarjeta del expediente candidata-crowdedhero-simpleros-bonos-dlt, y
// resumenOferta() de rwadar-site/assets/ficha-editorial-20261022.js. Helpers de la tarjeta copiados
// de rwadar-site/assets/rwadar-20260820.js (textoCortoLocal, textoBreveDatoTarjetaLocal,
// minimoDocumentadoLocal, salidaDocumentadaLocal, textoEspanaOferta, datosCortosOferta sin transparencia).
const RAIZ = '/home/user/RWADAR';
const {resumenOferta} = require(RAIZ + '/rwadar-site/assets/ficha-editorial-20261022.js');
const exp = require(RAIZ + '/rwadar-app/data/verificaciones/2026-11-20-v2/expedientes/candidata-crowdedhero-simpleros-bonos-dlt.json');
const p = exp.propuestaTarjeta, rt = p.resumenTarjeta;
const P50 = 'https://www.crowdedhero.com/project/view?id=50';
const TERM = 'https://de000a4exnm2.register.nyala.de/BondProspectus_SIMPLEROS%2003.07.2026.pdf';
const CNMV = 'https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor-Europeo?nreg=1&nif=PSFPUE0001';
const textoLocal = v => typeof v === 'string' ? v.trim() : '';
function textoCortoLocal(v, max = 40) { const t = textoLocal(v); if (t.length <= max) return t; const c = t.slice(0, max + 1), i = c.lastIndexOf(' '); return (i > 12 ? c.slice(0, i) : t.slice(0, max)).replace(/[\s,;:·.(-]+$/, '') + '…'; }
function textoBreveDatoTarjetaLocal(campo) {
  if (campo && campo.texto === 'No documentado en euros' && textoLocal(campo.unidadDocumentada)) return textoLocal(campo.unidadDocumentada);
  return ({'No documentado en euros':'No verificado','Sin mínimo vigente en euros':'No verificado','Sin comprobar si se puede contratar desde España':'Sin confirmar','Salida no documentada':'Sin documentar','Disponible desde España según la fuente':'Disponible','No disponible desde España según la fuente':'No disponible'})[campo.texto] || campo.texto;
}
const minimoDoc = r => !!(r && r.minimo && (Number.isFinite(r.minimo.euros) || textoLocal(r.minimo.unidadDocumentada)));
const salidaDoc = r => !!(r && r.salida && textoLocal(r.salida.texto) && !['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto));
const espana = (r, corto) => { const a = r && r.accesoEspana && r.accesoEspana.estado; return a === 'si' ? (corto ? 'Sí' : 'Sí, según la fuente') : a === 'no' ? (corto ? 'No' : 'No, según la fuente') : 'Sin confirmar'; };
function tarjeta(r) {
  const minimo = minimoDoc(r) ? textoCortoLocal(textoBreveDatoTarjetaLocal(r.minimo)) : textoBreveDatoTarjetaLocal(r.minimo);
  const salida = salidaDoc(r) ? textoCortoLocal(textoBreveDatoTarjetaLocal(r.salida).replace(/^Salida:\s*/, '')) : 'Sin documentar';
  return {lineaTarjeta: `Mínimo ${minimo} · España ${espana(r, true)}`, loEsencial: {minimo: textoBreveDatoTarjetaLocal(r.minimo), espana: espana(r), salida: r.salida.texto, salidaCorta: salida}, estado: r.estado.texto, costes: r.costes.texto};
}
const ref = (etiqueta, valor, fuente, fechaDato, alcance = 'Dato leído hoy en la fuente primaria citada.') => ({etiqueta, valor, fuente, fechaConsulta: '2026-11-20', fechaDato, alcance});
function oferta(refs, extra = {}) {
  return {slug: exp.slug, tipo: p.tipo, titulo: p.titulo, plataformaSlug: null, plataformaNombre: 'CrowdedHero', categoria: p.categoria, pais: p.pais,
    resumen: p.resumen, url: p.url, cta: 'Ver fuente', imagenAlt: p.titulo, verificadaEl: '2026-11-20', vigenciaDias: 7, permanente: false,
    disponibleEs: true, eu: null, fueraLadrillo: true, puntuacion: null, rentabilidad: p.rentabilidad, precio: null, metricas: p.metricas, avisos: p.avisos,
    estadoRevision: 'actual', fuentesActuales: p.fuentesActuales, coleccion: 'principales', moneda: 'EUR', patrocinada: false,
    documentacion: {revisadaEl: '2026-11-20', descripcion: p.resumen, fuentes: p.fuentesActuales, caracteristicas: [{etiqueta: 'Emisor', valor: 'Simpleros, S.L.'}], referencias: refs}, ...extra};
}
const hoy = new Date('2026-11-20T21:40:00Z');
const casos = {
  'A · propuestaTarjeta tal cual': [ref('Mínimo de inversión', rt.minimo, TERM, '2026-07-03'), ref('Acceso desde España', rt.accesoEspana, CNMV, '2022-09-01'), ref('Salida', rt.salida, TERM, '2026-07-03')],
  'B · textos que sí entiende resumenOferta (solo para ver la forma; no es propuesta de publicación)': [ref('Mínimo de inversión', '250 €', TERM, '2026-07-03'), ref('Acceso desde España', 'Disponible para residentes en España (plataforma notificada a la CNMV, n.º 1)', CNMV, '2022-09-01'), ref('Salida', 'Sin reventa: se cobra al vencimiento, el 15/11/2028', TERM, '2026-07-03')],
};
for (const [k, refs] of Object.entries(casos)) {
  const r = resumenOferta(oferta(refs), [], hoy);
  console.log('\n=== ' + k);
  console.log(JSON.stringify(tarjeta(r), null, 1));
  console.log('minimo  ->', JSON.stringify(r.minimo));
  console.log('acceso  ->', JSON.stringify(r.accesoEspana));
}
console.log('\n=== Comprobaciones de normas sobre los textos propuestos');
const textos = {titulo: p.titulo, resumen: p.resumen, minimo: rt.minimo, accesoEspana: rt.accesoEspana, salida: rt.salida};
for (const [k, v] of Object.entries(textos)) {
  const f = [];
  if (v.length > 120) f.push('> 120 caracteres');
  if (/por (token|participaci[oó]n|acci[oó]n)/i.test(v)) f.push('«por token/participación/acción»');
  if (/rentab|garantiz|oportunidad/i.test(v)) f.push('palabra vetada');
  if (/%/.test(v)) f.push('lleva %');
  if (/hoy no se propone tarjeta/i.test(v)) f.push('texto interno en el resumen público');
  console.log(k.padEnd(13), String(v.length).padStart(4), f.join(', ') || 'ok');
}

const path = require('path');
const fs = require('fs');
const ROOT = '/home/user/RWADAR';
const { resumenOferta, idiomaCita } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const exp = JSON.parse(fs.readFileSync(path.join(ROOT, 'rwadar-app/data/verificaciones/2026-11-20-v2/expedientes/candidata-franklin-templeton-onchain-euro-liquidity.json'), 'utf8'));
const esc = JSON.parse(fs.readFileSync(path.join(ROOT, 'rwadar-app/data/verificaciones/2026-11-13-v2/escaparate-publicacion.json'), 'utf8'));
const modelo = esc.ofertas.find(o => o.plataformaSlug === 'spiko') || esc.ofertas[0];
const p = exp.propuestaTarjeta;
const folleto = p.url;
const refs = [];
const rt = p.resumenTarjeta || {};
if (rt.minimo) refs.push({ etiqueta: 'Mínimo de inversión', valor: rt.minimo, fuente: folleto, fechaConsulta: '2026-11-20', fechaDato: '2026-09-01', alcance: 'Folleto p. 39' });
if (rt.accesoEspana) refs.push({ etiqueta: 'Acceso desde España', valor: rt.accesoEspana, fuente: folleto, fechaConsulta: '2026-11-20', fechaDato: null });
if (rt.salida) refs.push({ etiqueta: 'Salida', valor: rt.salida, fuente: folleto, fechaConsulta: '2026-11-20', fechaDato: null });
const base = {
  ...Object.fromEntries(Object.keys(modelo).map(k => [k, null])),
  slug: exp.slug.replace(/^candidata-/, ''), tipo: p.tipo, titulo: p.titulo, plataformaSlug: exp.plataformaSlug,
  plataformaNombre: 'Franklin Templeton', categoria: p.categoria, pais: p.pais, resumen: p.resumen, url: p.url,
  cta: 'Ver fuente', imagenAlt: p.titulo, verificadaEl: '2026-11-20', vigenciaDias: 7, permanente: false,
  disponibleEs: exp.disponibleEs === 'si' ? true : exp.disponibleEs === 'no' ? false : null,
  rentabilidad: p.rentabilidad, precio: null, metricas: p.metricas, avisos: p.avisos,
  fuentesActuales: p.fuentesActuales, coleccion: p.coleccion, moneda: exp.moneda, patrocinada: false,
  documentacion: { revisadaEl: '2026-11-20', fuentes: p.fuentesActuales, referencias: refs },
};
const casos = {
  'tal cual (estado no_verificable, como dice el expediente)': { ...base, estadoRevision: 'no_verificable' },
  'hipotético: si se publicara como «actual»': { ...base, estadoRevision: 'actual' },
};
const hoy = new Date('2026-11-20T12:00:00Z');
for (const [nombre, o] of Object.entries(casos)) {
  const s = resumenOferta(o, [], hoy);
  console.log('### ' + nombre);
  console.log(JSON.stringify({ minimo: s.minimo.unidadDocumentada || s.minimo.texto, minimoEuros: s.minimo.euros ?? null,
    espana: s.accesoEspana.texto, espanaEstado: s.accesoEspana.estado, salida: s.salida.texto, costes: s.costes.texto,
    estado: s.estado, cifrasVigentes: s.cifrasVigentes, vencida: s.vencida, fechas: s.fechas }, null, 1));
}
console.log('### claves del modelo (2026-11-13-v2):', Object.keys(modelo).join(', '));
console.log('### claves de la prueba ausentes en el modelo:', Object.keys(base).filter(k => !(k in modelo)).join(', '));
const textos = { titulo: p.titulo, resumen: p.resumen, minimo: rt.minimo };
for (const [k, v] of Object.entries(textos)) if (v) console.log(`${k}: ${v.length} caracteres · idioma cita «${idiomaCita(v)}» · ${/por (participaci[oó]n|token|acci[oó]n)/i.test(v) ? 'CON «por …»' : 'sin «por …»'} · ${/rentab|garantiz|oportunidad|%/i.test(v) ? 'palabra vigilada' : 'sin palabras vigiladas'} · fechas: ${(v.match(/\d{1,2}\/\d{1,2}(\/\d{4})?/g) || []).join(' ')}`);
// Línea de la tarjeta tal como la escriben la web (rwadar-20260820.js) y la app
// (rwadar-movil/lib/transparencia.js): mismas reglas copiadas aquí.
const textoLocal = v => typeof v === 'string' ? v.trim() : '';
function textoBreve(c) {
  if (c && c.texto === 'No documentado en euros' && textoLocal(c.unidadDocumentada)) return textoLocal(c.unidadDocumentada);
  return ({'No documentado en euros':'No verificado','Sin mínimo vigente en euros':'No verificado',
    'Sin comprobar si se puede contratar desde España':'Sin confirmar','Salida no documentada':'Sin documentar',
    'Disponible desde España según la fuente':'Disponible','No disponible desde España según la fuente':'No disponible'})[c.texto] || c.texto;
}
function textoCorto(v, max = 40) { const t = textoLocal(v); if (t.length <= max) return t;
  const c = t.slice(0, max + 1), i = c.lastIndexOf(' '); return (i > 12 ? c.slice(0, i) : t.slice(0, max)).replace(/[\s,;:·.(-]+$/, '') + '…'; }
for (const [nombre, o] of Object.entries(casos)) {
  const s = resumenOferta(o, [], hoy);
  const documentado = Number.isFinite(s.minimo.euros) || !!textoLocal(s.minimo.unidadDocumentada);
  const minimo = documentado ? textoCorto(textoBreve(s.minimo)) : textoBreve(s.minimo);
  const esp = s.accesoEspana.estado === 'si' ? 'Sí' : s.accesoEspana.estado === 'no' ? 'No' : 'Sin confirmar';
  const problema = o.estadoRevision === 'no_verificable' ? ' · aviso «apertura no confirmada»' : '';
  console.log(`Línea de tarjeta (${nombre}): «Mínimo ${minimo} · España ${esp}»${problema}`);
}

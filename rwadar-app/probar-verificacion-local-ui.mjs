import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(
  RAIZ, 'rwadar-movil', 'fixtures', 'escaparate-local.json'), 'utf8'));
const web = fs.readFileSync(path.join(
  RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js'), 'utf8');
const css = fs.readFileSync(path.join(
  RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.css'), 'utf8');
const indice = fs.readFileSync(path.join(RAIZ, 'rwadar-site', 'index.html'), 'utf8');
const explicador = fs.readFileSync(path.join(RAIZ, 'rwadar-movil', 'componentes', 'ExplicadorNativo.js'), 'utf8');

let correctas = 0;
function paso(nombre, condicion) {
  assert.ok(condicion, nombre);
  correctas += 1;
  console.log(`  OK    ${nombre}`);
}

console.log('=== UI DE VERIFICACIÓN LOCAL ===');

paso('la portada no promete aprobación, apertura universal ni acceso minorista',
  !/pasan el filtro|superan el filtro|aceptan dinero hoy|solo entran plataformas con supervisor|Abiertas a minoristas|cumple los cuatro criterios/i.test(indice) &&
  indice.includes('Categorías de activos') && indice.includes('no es exhaustivo ni un sello de aprobación') &&
  /document\.getElementById\('s3'\)\.textContent=new Set\(P\.map\(p=>p\.cat\)\)\.size/.test(web));
paso('web y explicador móvil distinguen el pago al proveedor de los ingresos de RWAdar',
  /La inversión y el pago se realizan directamente con la\s+empresa/.test(indice) &&
  indice.includes('no recibimos ni custodiamos el dinero de tu inversión') &&
  explicador.includes('el pago se realiza directamente con la empresa; RWAdar'));
paso('el material educativo no garantiza propiedad directa ni venta inmediata',
  !/cada trozo es propiedad de verdad|ni esperar meses a que aparezca comprador|lista plataformas con supervisión verificable|fracción legal de la propiedad/i.test(indice + explicador) &&
  indice.includes('no te convierte automáticamente en propietario') &&
  explicador.includes('No hay venta inmediata ni liquidez garantizada'));

paso('las 26 plataformas entregan verificacionLocal del 2026-09-21',
  fixture.plataformas.length === 26
  && fixture.plataformas.every((plataforma) => {
    const v = plataforma.verificacionLocal;
    return v?.verificadoEl === '2026-09-21'
      && v.conservaFechaCanonica === true
      && v.estadoOperativo?.estado && v.estadoOperativo?.detalle
      && v.licenciaRegistro?.estado && v.licenciaRegistro?.detalle
      && v.acceso?.estado && v.acceso?.detalle
      && Array.isArray(v.alertasCriticas) && v.alertasCriticas.length > 0;
  }));

paso('la web valida el overlay antes de adjuntarlo al modelo visible',
  web.includes("const FECHA_VERIFICACION_LOCAL='2026-09-21'")
  && web.includes('verificacionLocal:validarVerificacionLocal(p.verificacionLocal)')
  && web.includes("d.plataformas.map(plataformaDesdeEscaparate)")
  && web.includes("verificación local ausente, desactualizada o no conservadora"));

const cargaLocal = web.slice(web.indexOf('async function cargarEscaparateLocal(){'),
  web.indexOf('\nasync function alDia('));
paso('una revisión local incompleta conserva la copia completa sin contactar producción',
  web.includes('Se conserva la última copia completa del catálogo.')
  && !/P\.length=0|EMI\.length=0|P\.splice/.test(cargaLocal.slice(0,
    cargaLocal.indexOf("fetch('/__rwadar_local/escaparate.json'")))
  && cargaLocal.indexOf('validarEscaparateLocalV2(recibido)') < cargaLocal.indexOf('P.splice(')
  && !/fetch\((?:API|SUPABASE)/.test(cargaLocal)
  && !web.includes('Se mantiene el radar incluido en la fuente'));

// Rótulos en llano: «Actividad» y «Licencia o registro» (LISTA-FINAL.md fila 13,
// revisión de frases que pidió Víctor, 04/11/2026).
paso('las fichas y el detalle muestran fecha, tres estados y alertas críticas',
  web.includes('resumenVerificacionLocalHtml(v)')
  && web.includes('detalleVerificacionLocalHtml(v,resumen)')
  && web.includes("['Actividad',verificacion.estadoOperativo]")
  && web.includes("['Licencia o registro',verificacion.licenciaRegistro]")
  && web.includes("['Acceso',verificacion.acceso]")
  && web.includes('verificacion.alertasCriticas.map')
  && css.includes('.verificacion-local-fecha')
  && css.includes('.pn-verificacion-local-alertas'));

const porSlug = new Map(fixture.plataformas.map((plataforma) => [plataforma.slug, plataforma]));
paso('INX no se presenta como cotizada en Nasdaq',
  porSlug.get('inx')?.verificacionLocal.alertasCriticas
    .some((alerta) => alerta.codigo === 'no_nasdaq' && /No afirmar que INX cotiza en Nasdaq/i.test(alerta.detalle)));
paso('ARTEX no se presenta como operativa por tener un registro',
  porSlug.get('artex-global-markets')?.verificacionLocal.estadoOperativo.estado === 'no_verificable'
  && /no prueba actividad comercial actual/i.test(
    porSlug.get('artex-global-markets')?.verificacionLocal.licenciaRegistro.detalle));
paso('Lofty muestra su declaración de ausencia de registro',
  porSlug.get('lofty')?.verificacionLocal.licenciaRegistro.estado === 'sin_registro_declarado'
  && /no está registrada ante la SEC/i.test(
    porSlug.get('lofty')?.verificacionLocal.licenciaRegistro.detalle));
paso('Swarm no conserva como visibles Minorista ni la etiqueta genérica BaFin',
  porSlug.get('swarm')?.verificacionLocal.acceso.estado === 'no_verificable'
  && /no se reutiliza la etiqueta genérica 'regulada por BaFin'/i.test(
    porSlug.get('swarm')?.verificacionLocal.licenciaRegistro.detalle)
  && web.includes("accesoClasificado=p=>p&&p.verificacionLocal&&p.verificacionLocal.acceso.estado==='no_verificable'"));

const bloqueFuentes = web.slice(web.indexOf('function fuentesVerificacionHtml('), web.indexOf('\nconst colOf='));
const contexto = vm.createContext({
  escHtml: s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  urlHttps: s => typeof s === 'string' && /^https:\/\/[^\s<>"']+$/.test(s) ? s : '',
  fechaES: iso => String(iso).split('-').reverse().join('/'),
});
vm.runInContext(bloqueFuentes, contexto);
const fuente = {url:'https://example.com/fuente', titulo:'Informe <b>regulatorio</b>', consultadaEl:'2026-09-28'};
const fuenteNoSegura = {url:'javascript:alert(1)', titulo:'No abrir'};
const fuentesHtml = contexto.fuentesVerificacionHtml({
  estadoOperativo:{fuentes:[fuente]}, licenciaRegistro:{fuentes:[fuente,fuenteNoSegura]},
  acceso:{fuentes:[]}, alertasCriticas:[{fuentes:[fuente]}],
});
paso('el detalle permite consultar las fuentes sin duplicarlas ni ejecutar HTML',
  (fuentesHtml.match(/href=/g)||[]).length===1 && fuentesHtml.includes('&lt;b&gt;regulatorio&lt;/b&gt;') &&
  fuentesHtml.includes('28/09/2026') && !fuentesHtml.includes('javascript:') &&
  web.includes("'</ul></div>'+fuentesVerificacionHtml(verificacion)"));
paso('el escaparate público no afirma que todas las referencias estén abiertas',
  indice.includes('Activos y ofertas documentados') && !indice.includes('Abierto ahora mismo'));

console.log(`\n${correctas} correctas, 0 fallidas`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lee = (relativa) => fs.readFileSync(path.join(raiz, ...relativa.split('/')), 'utf8');
const normaliza = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').toLowerCase();

const pagina = lee('rwadar-site/transparencia-comercial.html');
const privacidad = lee('rwadar-site/privacidad.html');
const index = lee('rwadar-site/index.html');
const cliente = lee('rwadar-site/assets/rwadar-20260820.js');
const manifiesto = lee('rwadar-publicacion-segura.js');
const publicador = lee('rwadar-publicar.js');
const sitemap = lee('rwadar-site/sitemap.xml');
const redirecciones = lee('rwadar-site/_redirects');
const cabeceras = lee('rwadar-site/_headers');
const worker = lee('rwadar-site/sw.js');

let correctas = 0;
const paso = (texto, prueba) => {
  assert.ok(prueba, texto);
  correctas += 1;
  console.log(`  OK    ${texto}`);
};

console.log('=== TRANSPARENCIA COMERCIAL DEL MVP ===');
const texto = normaliza(pagina);

paso('prioriza anuncios pendientes y deja las comisiones para una fase futura',
  /data-commercial-model="in-app-advertising-pending"/.test(pagina)
  && /data-commercial-status="inactive"/.test(pagina)
  && /data-investor-commission="0"/.test(pagina)
  && texto.includes('comision por conversion pagada por la')
  && texto.includes('no hay comisiones ni enlaces remunerados activos')
  && texto.includes('no tiene comision para el inversor'));

paso('exige contrato, revisión jurídica y conversión válida sin tratar clics como ventas',
  texto.includes('revision juridica favorable, contrato')
  && texto.includes('un clic, una visita o un registro no bastan')
  && texto.includes('sin conversion valida no habria cobro')
  && texto.includes('base, el porcentaje y los ajustes')
  && texto.includes('sin la estructura autorizada exigible'));

paso('delimita asesoramiento, órdenes y custodia',
  texto.includes('no presta asesoramiento financiero')
  && texto.includes('no recibe ni transmite ordenes')
  && texto.includes('no custodia dinero'));

paso('protege el ranking editorial frente al patrocinio',
  texto.includes('el ranking editorial no se vende')
  && texto.includes('no compra una posicion en el ranking')
  && texto.includes('no puede pagar para borrar advertencias'));

paso('obliga a identificar el patrocinio de forma visible',
  texto.includes('la tarjeta muestra la etiqueta')
  && pagina.includes('«Patrocinada»')
  && cliente.includes("e.pat?' sponsored':'"));

paso('la tarjeta abre una ficha identificada y los enlaces externos conservan el proveedor en el detalle',
  cliente.includes("Ver oferta en '+escHtml(e.pl)")
  && cliente.includes('data-oferta-detalle=')
  && cliente.includes('>Ver ficha ')
  // El enlace final dice «Ver oferta en <proveedor> ↗», como la página aparte (NOTAS 3 del coordinador, 04/11/2026).
  && cliente.includes("(secundario?'Ficha oficial':'Ver oferta en '+o.plataformaNombre)+': '+o.titulo")
  && cliente.includes("o.patrocinada?' sponsored':''"));

paso('la página no activa el modelo porcentual 3–5 %',
  !/(?:3\s*(?:%|\/)|5\s*%)/.test(pagina));

paso('privacidad y transparencia describen el mismo modelo comercial',
  privacidad.includes('href="/transparencia-comercial"')
  && normaliza(privacidad).includes('no cobra comision al inversor')
  && normaliza(privacidad).includes('comision por conversion pagada por la empresa')
  && normaliza(privacidad).includes('no hay atribucion comercial activa')
  && !normaliza(privacidad).includes('no hay publicidad ni espacios vendidos a terceros'));

// «no cambia el orden editorial»: LISTA-FINAL.md fila 32 (revisión de frases que pidió Víctor, 04/11/2026).
paso('la transparencia es descubrible desde la portada',
  index.includes('href="/transparencia-comercial">Transparencia comercial</a>')
  && index.includes('RWAdar no cobra comisión al inversor')
  && index.includes('no cambia el orden editorial'));

paso('la página forma parte del árbol local publicable y de sus validaciones',
  manifiesto.includes("'transparencia-comercial.html'")
  && manifiesto.includes('canonical de transparencia-comercial.html')
  && /const PAGINAS_HTML = \[[^\]]*'transparencia-comercial\.html'/.test(publicador)
  && (publicador.match(/PAGINAS_HTML/g)?.length || 0) >= 4);

paso('la ruta conserva canonical, sitemap y redirección; el worker no ofrece una copia offline',
  pagina.includes('href="https://rwadar.pages.dev/transparencia-comercial"')
  && sitemap.includes('<loc>https://rwadar.pages.dev/transparencia-comercial</loc>')
  && redirecciones.includes('/transparencia-comercial.html  /transparencia-comercial   301')
  && cabeceras.includes('/transparencia-comercial\n')
  && /nombre\.startsWith\('rwadar-v'\)/.test(worker)
  && /caches\.delete\(nombre\)/.test(worker)
  && !/addEventListener\(\s*['"]fetch['"]|caches\.open\(|cache\.(?:put|addAll|match)\(/.test(worker));

const scriptsCsp = [
  '<script src="/assets/analitica-20260927.js" defer></script>',
  '<script src="/assets/idioma-en-20261022.js" defer></script>',
  '<script src="/assets/idioma-20261022.js" defer></script>',
  '<script src="/assets/idioma-web-20261022.js" defer></script>'
];
const scriptsExternosCerrados = html => {
  const encontrados = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)].map(m => m[0]);
  return encontrados.length === scriptsCsp.length
    && encontrados.every((s,i) => s === scriptsCsp[i])
    && !/<script\b/i.test(scriptsCsp.reduce((resto,s) => resto.replace(s,''),html));
};
paso('el documento respeta la CSP sin estilos, scripts ni eventos inline',
  !/<style\b/i.test(pagina)
  && scriptsExternosCerrados(pagina)
  && !/\sstyle\s*=/i.test(pagina)
  && !/\son[a-z]+\s*=/i.test(pagina));

paso('la lista CSP rechaza scripts inline, desconocidos, duplicados y async',
  !scriptsExternosCerrados(pagina+'<script>alert(1)</script>')
  && !scriptsExternosCerrados(pagina.replace(scriptsCsp[1],'<script src="/otro.js" defer></script>'))
  && !scriptsExternosCerrados(pagina+scriptsCsp[1])
  && !scriptsExternosCerrados(pagina.replace(scriptsCsp[1],scriptsCsp[1].replace(' defer',' async'))));

paso('la publicación remota exige revisión y conserva los controles comerciales',
  /comprobarPreparacionRelanzamiento/.test(publicador) && /comprobarContenidoPerfilPublicacion/.test(publicador));

const movil = lee('rwadar-movil/App.js');
const tarjetasMoviles = lee('rwadar-movil/componentes/Ofertas.js');
const estado = JSON.parse(lee('rwadar-app/data/relanzamiento/estado.json'));
paso('web, móvil y manifiesto no fingen un modelo o cobro ya aprobado',
  normaliza(movil).includes('no hay comisiones ni enlaces remunerados activos')
  && ![pagina, privacidad, index, movil, tarjetasMoviles].some(f => /tarifa fija B2B/.test(f))
  && estado.modeloComercial === 'publicidad-en-app-pendiente'
  && estado.perfilPublicacion === 'editorial-gratuito'
  && Object.values(estado.actividadComercial).every(valor => valor === false)
  && estado.comisionVariableSobreInversion === false
  && estado.controles.primer_acuerdo_patrocinio.estado === 'pendiente');

paso('inclusión editorial gratuita y destino B2B del cobro quedan separados',
  texto.includes('aparecer en el radar es gratis')
  && texto.includes('sin coste de alta ni mantenimiento')
  && texto.includes('el dinero de la inversion nunca pasaria por rwadar')
  && texto.includes('facturaria a la empresa contratante'));

paso('publicidad opcional se presenta como estudio, sin campañas ni red activa',
  pagina.includes('data-advertising-status="under-review"')
  && texto.includes('publicidad dentro de la app')
  && texto.includes('tampoco cobramos ahora a las empresas')
  && texto.includes('no se aplicara retroactivamente')
  && texto.includes('no hay campanas activas')
  && normaliza(movil).includes('no hay campanas activas ni redes de anuncios integradas'));

console.log(`\n${correctas} correctas, 0 fallidas`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lee = relativa => fs.readFileSync(path.join(raiz, ...relativa.split('/')), 'utf8');
const normaliza = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').toLowerCase();

const pagina = lee('rwadar-site/para-empresas.html');
const texto = normaliza(pagina);
const textoVisible = normaliza(pagina.replace(/<[^>]+>/g, ' '));
const portada = lee('rwadar-site/index.html');
const privacidad = lee('rwadar-site/privacidad.html');
const transparencia = lee('rwadar-site/transparencia-comercial.html');
const publicador = lee('rwadar-publicar.js');
const manifiesto = lee('rwadar-publicacion-segura.js');
const servidor = lee('rwadar-servir.js');
const sitemap = lee('rwadar-site/sitemap.xml');
const redirecciones = lee('rwadar-site/_redirects');
const cabeceras = lee('rwadar-site/_headers');
const worker = lee('rwadar-site/sw.js');
const securityTxt = lee('rwadar-site/.well-known/security.txt');

let correctas = 0;
const paso = (nombre, condicion) => {
  assert.ok(condicion, nombre);
  correctas += 1;
  console.log(`  OK    ${nombre}`);
};

console.log('=== EXPRESIÓN DE INTERÉS B2B PARA EMPRESAS ===');

paso('declara un canal exploratorio bloqueado hasta la aprobación legal',
  /data-partner-status="interest-only"/.test(pagina)
  && /data-commercial-status="legal-approval-pending"/.test(pagina)
  && /data-revenue-model="in-app-advertising-pending"/.test(pagina)
  && /data-investor-commission="0"/.test(pagina)
  && texto.includes('no ofrece ahora patrocinio, precios, contratacion, facturacion ni publicacion')
  && texto.includes('no es una oferta comercial'));

paso('no inventa un precio ni presenta presupuesto, contrato o factura como disponibles',
  !/\b[1-9]\d*(?:[.,]\d+)?\s*(?:€|eur)\b/i.test(pagina)
  && !/(?:3\s*(?:%|\/)|5\s*%)/.test(textoVisible)
  && texto.includes('por conversion valida')
  && texto.includes('sin cuota fija de presencia')
  && texto.includes('solo tras una aprobacion legal expresa podria existir una propuesta, presupuesto, contrato, factura o publicacion')
  && !texto.includes('el piloto comercial se contrata'));

paso('presenta el formato futuro como esquema preliminar, no como servicio adquirido',
  ['ficha de oferta', 'identificacion comercial', 'trazabilidad', 'control de vigencia',
    'cierre del piloto'].every(fragmento => texto.includes(fragmento))
  && texto.includes('fuente primaria')
  && texto.includes('descripcion preliminar, no un catalogo de servicios ni un compromiso de entrega'));

paso('minimiza el primer contacto y prohíbe datos de inversores o clientes',
  ['organizacion', 'enlace oficial', 'motivo', 'sin datos de terceros']
    .every(fragmento => textoVisible.includes(fragmento))
  && textoVisible.includes('no envies informacion personal de clientes o inversores ni adjuntos confidenciales')
  && textoVisible.includes('nada de datos de inversores o clientes'));

paso('separa expresamente el patrocinio del criterio editorial',
  texto.includes('criterios que no cambiarian')
  && texto.includes('no se permitiria comprar')
  && texto.includes('entrada automatica o posicion organica')
  && texto.includes('nunca obligaria a rwadar a aceptar o conservar una ficha'));

paso('no promete resultados ni presenta un clic como venta o cobro activo',
  texto.includes('no prometemos trafico, inversores, registros, contactos, capital captado ni conversion')
  && texto.includes('un clic o registro no genera comision')
  && texto.includes('no hay comisiones activas')
  && texto.includes('sin conversion valida no habria cobro')
  && texto.includes('cancelaciones, devoluciones, fraude e impagos'));

const ctas = [...pagina.matchAll(/<a\b([^>]*\bclass="[^"]*boton-correo[^"]*"[^>]*)>/gi)];
paso('el único CTA de contacto abre correo y no existe formulario de captación',
  ctas.length === 1
  && /\bhref="mailto:RWAdar@protonmail\.com\?/.test(ctas[0][1])
  && !/<form\b/i.test(pagina)
  && !/<button\b/i.test(pagina));

paso('muestra el correo copiable y enlaza la privacidad junto al CTA',
  /class="correo-copiable"[\s\S]*?>RWAdar@protonmail\.com<\/a>/.test(pagina)
  && /class="boton-correo"\s+aria-describedby="contactoPrivacidad"/.test(pagina)
  && /id="contactoPrivacidad"[\s\S]*?href="\/privacidad#consultas-b2b"/.test(pagina));

paso('el proceso deja claro que un correo no contrata, factura ni publica',
  texto.includes('solo expresa interes: no solicita ni acepta un presupuesto')
  && texto.includes('el mensaje no reserva espacio ni activa presupuesto, contrato o facturacion')
  && texto.includes('no hay siguiente fase disponible todavia'));

paso('la página es descubrible desde portada y políticas',
  portada.includes('href="/para-empresas">Para empresas</a>')
  && privacidad.includes('href="/para-empresas">Para empresas</a>')
  && transparencia.includes('href="/para-empresas"'));

paso('canonical y ruta limpia se conservan, pero la página no es indexable ni está en sitemap',
  pagina.includes('href="https://rwadar.pages.dev/para-empresas"')
  && /<meta name="robots" content="noindex,nofollow">/.test(pagina)
  && !sitemap.includes('<loc>https://rwadar.pages.dev/para-empresas</loc>')
  && /^\/para-empresas\.html\s+\/para-empresas\s+301$/m.test(redirecciones)
  && /^\/para-empresas\r?\n\s+Cache-Control:\s*public, max-age=0, must-revalidate\r?\n\s+X-Robots-Tag:\s*noindex, nofollow$/m.test(cabeceras)
  && /^\/para-empresas\.html\r?\n\s+Cache-Control:\s*public, max-age=0, must-revalidate\r?\n\s+X-Robots-Tag:\s*noindex, nofollow$/m.test(cabeceras));

paso('el estado estático no usa una región viva y las colecciones conservan semántica de lista',
  !/class="estado-piloto"[^>]*\brole="status"/.test(pagina)
  && /<section class="estado-piloto" aria-labelledby="estadoPilotoTitulo">/.test(pagina)
  && /<ul class="principios" role="list"/.test(pagina)
  && /<ul class="lista-control" role="list">/.test(pagina)
  && /<ol class="pasos" role="list">/.test(pagina)
  && (pagina.match(/<span aria-hidden="true">\d<\/span>/g) || []).length === 3);

paso('privacidad cubre de forma específica y conservadora las consultas B2B',
  /<h2 id="consultas-b2b">7 · Consultas B2B por correo<\/h2>/.test(privacidad)
  && ['datos minimos', 'finalidad', 'base juridica', 'acceso y proveedor', 'conservacion']
    .every(fragmento => normaliza(privacidad).includes(fragmento))
  && normaliza(privacidad).includes('interes legitimo en atender la consulta profesional que tu inicias')
  && normaliza(privacidad).includes('proton mail')
  && normaliza(privacidad).includes('como maximo seis meses desde el ultimo intercambio')
  && normaliza(privacidad).includes('no envies datos de inversores, clientes u otras personas')
  && normaliza(privacidad).includes('no se incorporan a supabase, brevo ni un crm'));

paso('publica instrucciones de reporte de seguridad y security.txt no revela el repo privado',
  /id="reporte-seguridad"/.test(privacidad)
  && privacidad.includes('href="/.well-known/security.txt"')
  && securityTxt.includes('Policy: https://rwadar.pages.dev/privacidad#reporte-seguridad')
  && !/github\.com/i.test(securityTxt));

paso('el árbol publicable y el servidor local incluyen la página de forma explícita',
  manifiesto.includes("'para-empresas.html'")
  && manifiesto.includes('canonical/noindex de para-empresas.html')
  && /const PAGINAS_HTML = \[[^\]]*'para-empresas\.html'/.test(publicador)
  && (publicador.match(/PAGINAS_HTML/g) || []).length >= 4
  && servidor.includes("p === '/para-empresas'")
  && servidor.includes("p = '/para-empresas.html'"));

paso('la PWA elimina sus copias antiguas y no sirve la página desde caché',
  /nombre\.startsWith\('rwadar-v'\)/.test(worker)
  && /caches\.delete\(nombre\)/.test(worker)
  // La página recarga al cambiar el controlador; navegar ventanas desde la
  // activación dejaba la web bloqueada en Chrome (29/10).
  && /self\.clients\.claim\(\)/.test(worker)
  && !/\.navigate\(|clients\.matchAll\(/.test(worker)
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
paso('el documento respeta la CSP estricta',
  !/<style\b/i.test(pagina)
  && scriptsExternosCerrados(pagina)
  && !/\sstyle\s*=/i.test(pagina)
  && !/\son[a-z]+\s*=/i.test(pagina));

paso('la lista CSP rechaza scripts inline, desconocidos, duplicados y async',
  !scriptsExternosCerrados(pagina+'<script>alert(1)</script>')
  && !scriptsExternosCerrados(pagina.replace(scriptsCsp[1],'<script src="/otro.js" defer></script>'))
  && !scriptsExternosCerrados(pagina+scriptsCsp[1])
  && !scriptsExternosCerrados(pagina.replace(scriptsCsp[1],scriptsCsp[1].replace(' defer',' async'))));

paso('el publicador conserva el control que impide contratar desde el perfil editorial',
  /comprobarContenidoPerfilPublicacion/.test(publicador) && /comprobarPreparacionRelanzamiento/.test(publicador));

console.log(`\n${correctas} correctas, 0 fallidas`);

/* =====================================================================
   RWAdar · dominio de correo: Cloudflare (DNS) y Lettermint (dominio,
   rutas y token de la base)
   ---------------------------------------------------------------------
   Lo usa el flujo «Dominio de correo» (.github/workflows/dominio-correo.yml):

     node rwadar-app/dominio-correo.mjs comprobar   valida la rama y las entradas
     node rwadar-app/dominio-correo.mjs ejecutar    hace la acción de ACCION

   Entradas (en el entorno): ACCION, CONFIRMAR, REMITENTE y ROTAR. Acciones:

   · estado (solo lee): la zona rwadar.app en Cloudflare y sus registros DNS
     del correo (nombre y tipo, el valor acortado); en Lettermint, el plan y
     la verificación de la cuenta, el proyecto «RWAdar», el dominio y cómo va
     cada registro, las rutas (con el seguimiento) y los nombres de los tokens
     del proyecto. Si hay las dos claves, también lo que haría
     preparar-dominio, sin hacerlo.
   · preparar-dominio: crea en Lettermint el dominio rwadar.app si no existe
     y lo asocia al proyecto «RWAdar»; pone en Cloudflare SOLO los registros
     que faltan (los CNAME en «DNS only», proxied false); y pide a Lettermint
     que los verifique. Nunca borra ni cambia un registro que ya exista: si
     uno choca con lo que pide Lettermint (otro CNAME, otro SPF, otra clave
     DKIM…), para ANTES de crear nada y explica qué hay que hacer a mano.
     Repetirlo no cambia nada.
   · verificar-dominio: pide a Lettermint que verifique los registros y cuenta
     cómo sale cada uno. Sale en rojo mientras falte alguno necesario.
   · ajustar-rutas: deja apagado el seguimiento de aperturas y de clics en
     todas las rutas (en el plan gratis ese ajuste no existe: es lo correcto)
     y prueba a quitar el enlace de baja de Lettermint en la ruta de difusión
     (disable_hosted_unsubscribe). Si Lettermint lo rechaza, es lo esperable en
     el plan gratis: las bajas ya las trae «Correo Lettermint» (sincronizar-bajas).
   · crear-token-base: crea el token de proyecto «RWAdar base (API)» y lo
     guarda directamente en el Vault de la base con
     db/31_correo_lettermint_guardar.sql (el mismo camino que «guardar-correo»
     de «Avisos a registrados (base)»), junto con el remitente. Antes comprueba
     que la base responde y tiene Vault, para no dejar un token sin dueño. Si
     ya hay un token con ese nombre, no crea otro sin ROTAR = SI; al rotar,
     borra el viejo solo DESPUÉS de guardar el nuevo. Si guardar falla, borra
     el recién creado.

   Claves (secretos de GitHub): CLOUDFLARE_DNS_TOKEN, LETTERMINT_TEAM_TOKEN y,
   solo en crear-token-base, SUPABASE_DB_URL. Ninguna se escribe nunca: ver
   rwadar-app/claves-comun.mjs.

   Pruebas sin red: node --test .github/claves.test.mjs
   ===================================================================== */
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CLOUDFLARE, DOMINIO, PROYECTO_LETTERMINT, TOKEN_BASE, TOKEN_SMTP, Parada, falla, acortar, crearSalida, crearCliente,
  leerSecreto, explicarHttp, detalleError, objeto, clienteLettermint, listarLettermint, buscarProyecto, buscarDominio, tokensDelProyecto,
  crearTokenProyecto, borrarTokenProyecto, fechaCorta, ejecutarPsql, remitenteDelDominio,
} from './claves-comun.mjs';

export const ACCIONES = ['estado', 'preparar-dominio', 'verificar-dominio', 'ajustar-rutas', 'crear-token-base'];
export const PALABRA = 'CORREO';
const QUE_CAMBIA = {
  'preparar-dominio': 'crea el dominio en Lettermint y registros DNS en Cloudflare',
  'ajustar-rutas': 'cambia los ajustes de las rutas de Lettermint',
  'crear-token-base': 'crea un token en Lettermint y lo guarda en el Vault de la base',
};
const SQL_GUARDAR = fileURLToPath(new URL('./db/31_correo_lettermint_guardar.sql', import.meta.url));
const COMENTARIO_DNS = 'Lettermint (flujo «Dominio de correo» de RWAdar)';

/* ---------------------------------------------------------------- entradas */
export function comprobarEntradas(entorno, salida) {
  if (entorno.GITHUB_REF !== 'refs/heads/main') {
    falla(`Este flujo solo se lanza desde main (se pidió desde ${acortar(entorno.GITHUB_REF || 'ninguna rama', 80)}).`);
  }
  const accion = entorno.ACCION || '';
  if (!ACCIONES.includes(accion)) falla(`Acción no válida: «${acortar(accion, 40)}». Elige una de estas: ${ACCIONES.join(', ')}.`);
  if (QUE_CAMBIA[accion] && entorno.CONFIRMAR !== PALABRA) {
    falla(`${accion} ${QUE_CAMBIA[accion]}: escribe ${PALABRA} en «confirmar» (y lánzalo solo con orden de Víctor).`);
  }
  const rotar = entorno.ROTAR || '';
  if (rotar && rotar !== 'SI') falla('«rotar» solo admite SI, en mayúsculas, o dejarlo vacío.');
  const remitente = entorno.REMITENTE || '';
  if (accion === 'crear-token-base') {
    if (!remitenteDelDominio(remitente)) {
      falla(`crear-token-base necesita en «remitente» la dirección desde la que salen los avisos, del dominio ${DOMINIO} ` +
        `(por ejemplo, avisos@${DOMINIO}), sin nombre ni <>. Se guarda en Vault junto al token, como hace «guardar-correo».`);
    }
  } else if (remitente || rotar) {
    salida.linea('(«remitente» y «rotar» solo valen para crear-token-base: aquí no se usan.)');
  }
  return { accion, rotar: rotar === 'SI', remitente };
}

/* ---------------------------------------------------------------- DNS */
export const nombreDNS = (n) => String(n ?? '').trim().toLowerCase().replace(/\.$/, '');
/* El texto de un TXT, sin las comillas con que lo puede devolver Cloudflare
   ("a" "b" es «ab», como lo lee quien consulta el DNS). */
export function textoTXT(c) {
  const t = String(c ?? '').trim();
  if (/^".*"$/s.test(t)) {
    const trozos = [...t.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
    if (trozos.length) return trozos.join('');
  }
  return t;
}
export function claseTXT(v) {
  if (/^v=spf1(\s|$)/i.test(v)) return 'spf';
  if (/^v=dmarc1(\s*;|\s|$)/i.test(v)) return 'dmarc';
  if (/^v=dkim1(\s*;|\s|$)/i.test(v)) return 'dkim';
  return null;
}
const HOST = /^[a-z0-9_]([a-z0-9_-]{0,62})(\.[a-z0-9_]([a-z0-9_-]{0,62}))+$/;
const dentroDelDominio = (n) => n === DOMINIO || n.endsWith(`.${DOMINIO}`);

/* Un registro de Cloudflare, con su contenido en la misma forma que los de Lettermint. */
export function registroCF(r) {
  const tipo = String(r.type || '').toUpperCase();
  let valor = String(r.content ?? '');
  if (tipo === 'TXT') valor = textoTXT(valor);
  else if (tipo === 'MX') valor = `${Number.isInteger(r.priority) ? r.priority : '?'} ${nombreDNS(valor)}`;
  else if (tipo === 'CNAME') valor = nombreDNS(valor);
  return { id: String(r.id || ''), tipo, nombre: nombreDNS(r.name), valor, proxied: r.proxied === true };
}

/* Los registros que pide Lettermint (DomainDnsRecordData). Se ponen los
   «required» y los «recommended»; los de «migration» y «deprecated» no
   (verificar con la primera respuesta real si alguno de esos hiciera falta). */
export function registrosPedidos(dominio) {
  const lista = dominio && Array.isArray(dominio.dns_records) ? dominio.dns_records : null;
  if (!lista) falla('Lettermint no ha dado la lista de registros DNS del dominio (dns_records). No se pone nada.');
  return lista.filter((r) => r && typeof r === 'object').map((r) => {
    const tipo = String(r.type || '').toUpperCase();
    let nombre = nombreDNS(r.fqdn);
    if (!nombre) {
      const h = nombreDNS(r.hostname);
      nombre = !h || h === '@' ? DOMINIO : (dentroDelDominio(h) ? h : `${h}.${DOMINIO}`);
    }
    const original = String(r.content ?? '').trim();
    const alcance = typeof r.verification_scope === 'string' ? r.verification_scope : 'required';
    const pedido = {
      id: String(r.id || ''), tipo, nombre, original, alcance, proposito: String(r.purpose || ''),
      estado: String(r.status || ''), necesario: r.required_for_verification !== false && alcance === 'required',
      poner: alcance === 'required' || alcance === 'recommended',
    };
    if (!['TXT', 'CNAME', 'MX'].includes(tipo)) {
      falla(`Lettermint pide un registro de tipo «${acortar(tipo, 10)}» en ${acortar(nombre, 80)}, que este flujo no sabe poner. No se pone nada: pide a Claude o a Codex que lo revise.`);
    }
    if (!dentroDelDominio(nombre) || !(nombre === DOMINIO || HOST.test(nombre))) {
      falla(`Lettermint pide un registro fuera de ${DOMINIO} o con un nombre raro («${acortar(nombre, 80)}»). No se pone nada.`);
    }
    if (tipo === 'TXT') {
      if (!/^[ -~]{1,4096}$/.test(original)) falla(`El TXT que pide Lettermint en ${nombre} tiene una forma rara. No se pone nada.`);
      pedido.valor = textoTXT(original);
    } else if (tipo === 'CNAME') {
      pedido.valor = nombreDNS(original);
      if (!HOST.test(pedido.valor)) falla(`El CNAME que pide Lettermint en ${nombre} no apunta a un nombre válido. No se pone nada.`);
    } else {
      const m = /^(\d{1,5})\s+(\S+)$/.exec(original);
      if (!m || !HOST.test(nombreDNS(m[2]))) {
        falla(`Lettermint pide un MX en ${nombre} sin prioridad o con una forma rara («${acortar(original, 60)}»). Este flujo no adivina la prioridad: ponlo a mano con la que diga su panel.`);
      }
      pedido.valor = `${Number(m[1])} ${nombreDNS(m[2])}`;
    }
    return pedido;
  });
}

function explicarSPF(actual, pedido) {
  const partes = (v) => v.trim().split(/\s+/).slice(1);
  const esAll = (t) => /^[+~?-]?all$/i.test(t);
  const a = partes(actual), b = partes(pedido);
  const faltan = b.filter((t) => !esAll(t) && !a.some((x) => x.toLowerCase() === t.toLowerCase()));
  if (!faltan.length) return null;
  const final = a.filter(esAll).length ? a.filter(esAll) : b.filter(esAll);
  const fusion = ['v=spf1', ...a.filter((t) => !esAll(t)), ...faltan, ...final].join(' ');
  return `ya hay un SPF en ese nombre («${acortar(actual, 200)}») y solo puede haber uno: dos SPF hacen fallar los dos. ` +
    `No se crea otro ni se toca el que hay. Hay que fusionarlos a mano: en Cloudflare › ${DOMINIO} › DNS, edita ese TXT ` +
    `y déjalo así: «${acortar(fusion, 300)}» (se añade ${faltan.join(' ')}). Después, vuelve a lanzar preparar-dominio.`;
}

/* Qué hacer con cada registro pedido, sin tocar nada: «ya» (está igual),
   «crear», «propio» (hay uno nuestro que vale y no se toca) o «conflicto». */
export function planificar(pedidos, existentes) {
  return pedidos.filter((p) => p.poner).map((p) => {
    const res = (decision, explicacion = '') => ({ ...p, decision, explicacion });
    const enNombre = existentes.filter((e) => e.nombre === p.nombre);
    const cname = enNombre.find((e) => e.tipo === 'CNAME');
    if (p.tipo === 'CNAME') {
      if (cname && cname.valor === p.valor) {
        return cname.proxied
          ? res('conflicto', `el CNAME ya está, pero en naranja («Proxied»): así no se ve desde fuera. Cámbialo a «DNS only» (nube gris) en Cloudflare › ${DOMINIO} › DNS.`)
          : res('ya');
      }
      if (cname) return res('conflicto', `ya hay un CNAME que apunta a ${acortar(cname.valor, 80)}, y Lettermint pide que apunte a ${acortar(p.valor, 80)}. No se cambia: si ese CNAME no es de nada que uséis, bórralo a mano en Cloudflare y relanza.`);
      if (enNombre.length) {
        const tipos = [...new Set(enNombre.map((e) => e.tipo))].join(', ');
        return res('conflicto', `ya hay otros registros en ese nombre (${tipos}) y un CNAME no puede convivir con ninguno. No se toca nada: mira para qué son antes de quitarlos.`);
      }
      return res('crear');
    }
    if (cname) return res('conflicto', `ya hay un CNAME en ese nombre (apunta a ${acortar(cname.valor, 80)}) y no puede convivir con un ${p.tipo}. No se toca nada.`);
    if (p.tipo === 'TXT') {
      const txt = enNombre.filter((e) => e.tipo === 'TXT');
      if (txt.some((e) => e.valor === p.valor)) return res('ya');
      const clase = claseTXT(p.valor);
      const misma = clase ? txt.filter((e) => claseTXT(e.valor) === clase) : [];
      if (clase === 'spf' && misma.length) {
        const explicacion = explicarSPF(misma[0].valor, p.valor);
        return explicacion ? res('conflicto', explicacion) : res('propio', 'el SPF que ya hay incluye ya lo que pide Lettermint: no se toca.');
      }
      if (clase === 'dmarc' && misma.length) {
        return res('propio', `ya hay un DMARC propio («${acortar(misma[0].valor, 80)}»). Solo puede haber uno y Lettermint admite el que ya hay, así que no se añade otro ni se cambia.`);
      }
      if (clase === 'dkim' && misma.length) {
        return res('conflicto', `ya hay otra clave DKIM en ese nombre («${acortar(misma[0].valor, 50)}») y Lettermint pide otra. No se sobrescribe: mira de quién es antes de quitarla.`);
      }
      return res('crear');
    }
    const mx = enNombre.filter((e) => e.tipo === 'MX');
    if (mx.some((e) => e.valor === p.valor)) return res('ya');
    if (mx.length) return res('conflicto', `ya hay otros MX en ese nombre (${mx.map((e) => acortar(e.valor, 60)).join(', ')}): añadir el de Lettermint cambiaría adónde llega el correo de ${p.nombre}. No se toca nada.`);
    return res('crear');
  });
}

function cuerpoCF(p) {
  const base = { type: p.tipo, name: p.nombre, ttl: 1, comment: COMENTARIO_DNS };
  if (p.tipo === 'CNAME') return { ...base, content: p.valor, proxied: false };
  if (p.tipo === 'MX') { const [prioridad, destino] = p.valor.split(' '); return { ...base, content: destino, priority: Number(prioridad) }; }
  // El TXT tal como lo da Lettermint (Cloudflare lo parte si pasa de 255; verificar con el primero largo).
  return { ...base, content: p.original };
}

/* ---------------------------------------------------------------- Cloudflare */
function clienteCloudflare(entorno, salida) {
  const token = leerSecreto(entorno, salida, 'CLOUDFLARE_DNS_TOKEN',
    `token de la API de Cloudflare con Zone:Read y DNS:Edit solo sobre ${DOMINIO}`);
  return crearCliente({ servicio: 'Cloudflare', base: CLOUDFLARE, cabeceras: { Authorization: `Bearer ${token}` }, salida });
}
function exigirCF(r, que) {
  if (r.estado >= 200 && r.estado < 300 && r.datos && r.datos.success === true) return r.datos;
  falla(`Cloudflare: ${que} no salió bien. ${explicarHttp('Cloudflare', r)}`);
}
async function buscarZona(cf) {
  const d = exigirCF(await cf.pedir('GET', '/zones', { consulta: `name=${DOMINIO}` }), `buscar la zona ${DOMINIO}`);
  const zonas = (Array.isArray(d.result) ? d.result : []).filter((z) => z && nombreDNS(z.name) === DOMINIO && typeof z.id === 'string');
  if (zonas.length > 1) falla(`Cloudflare devuelve ${zonas.length} zonas ${DOMINIO}: revísalo a mano.`);
  return zonas[0] || null;
}
async function registrosDeLaZona(cf, zona) {
  const todos = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const d = exigirCF(await cf.pedir('GET', `/zones/${encodeURIComponent(zona.id)}/dns_records`,
      { consulta: `per_page=100&page=${pagina}` }), `leer los registros DNS de ${DOMINIO}`);
    if (!Array.isArray(d.result)) falla('Cloudflare devolvió los registros DNS con una forma inesperada.');
    todos.push(...d.result.filter((r) => r && typeof r === 'object').map(registroCF));
    const paginas = d.result_info && Number.isInteger(d.result_info.total_pages) ? d.result_info.total_pages : null;
    if (d.result.length < 100 || (paginas !== null && pagina >= paginas)) return todos;
  }
  falla(`${DOMINIO} tiene más de 5000 registros DNS: revísalo a mano.`);
}
const zonaSinNombre = () => falla(`Cloudflare no tiene la zona ${DOMINIO}. Primero hay que comprar el dominio (Cloudflare › Domain Registration, ronda 1 del plan); si ya está comprado, el token CLOUDFLARE_DNS_TOKEN no tiene acceso a esa zona.`);
const ESTADO_ZONA = { active: 'activa', pending: 'pendiente (Cloudflare aún no ve sus servidores de nombres)', initializing: 'preparándose', moved: 'movida a otro sitio', deleted: 'borrada', deactivated: 'desactivada' };

/* ---------------------------------------------------------------- Lettermint */
const ESTADO_DOMINIO = { verified: 'verificado', partially_verified: 'verificado a medias', pending_verification: 'pendiente de verificar', failed_verification: 'sin verificar (falló)' };
const ESTADO_REGISTRO = { active: 'verificado', failed: 'falla', pending: 'pendiente' };
async function leerDominio(lm, id) {
  const d = objeto(lm.exigir(await lm.pedir('GET', `/domains/${encodeURIComponent(id)}`, { consulta: 'include=dnsRecords,projects' }), 200, `leer el dominio ${DOMINIO}`));
  if (!d || typeof d !== 'object' || typeof d.id !== 'string') falla(`Lettermint devolvió el dominio ${DOMINIO} con una forma inesperada.`);
  return d;
}
function lineaRegistro(p) {
  const estado = ESTADO_REGISTRO[p.estado] || (p.estado ? acortar(p.estado, 20) : 'sin estado');
  const alcance = p.alcance === 'required' ? 'necesario' : (p.alcance === 'recommended' ? 'recomendado' : acortar(p.alcance, 20));
  return `  ${p.tipo.padEnd(5)} ${p.nombre}: ${estado} (${alcance})`;
}
function seguimiento(s) {
  if (!s || typeof s !== 'object' || (!('track_opens' in s) && !('track_clicks' in s))) {
    return { existe: false, apagado: true, texto: 'seguimiento: no existe en este plan (correcto: nada que apagar)' };
  }
  const si = (v) => (v === true ? 'sí' : 'no');
  const encendido = s.track_opens === true || s.track_clicks === true;
  return { existe: true, apagado: !encendido, texto: encendido ? `seguimiento ENCENDIDO (aperturas: ${si(s.track_opens)}, clics: ${si(s.track_clicks)})` : 'seguimiento apagado' };
}
async function rutasDelProyecto(lm, proyecto) {
  const lista = await listarLettermint(lm, `/projects/${encodeURIComponent(proyecto.id)}/routes`);
  const rutas = [];
  for (const r of lista.filter((x) => typeof x.id === 'string')) {
    rutas.push(objeto(lm.exigir(await lm.pedir('GET', `/routes/${encodeURIComponent(r.id)}`), 200, `leer la ruta ${acortar(r.slug || r.id, 40)}`)));
  }
  return rutas.filter((r) => r && typeof r === 'object');
}
const nombreRuta = (r) => `«${acortar(r.slug || r.name || r.id, 40)}» (${acortar(r.route_type || '?', 15)}${r.is_default ? ', la de por defecto' : ''})`;

async function verificar(lm, dominio, salida) {
  const r = await lm.pedir('POST', `/domains/${encodeURIComponent(dominio.id)}/dns-records/verify`);
  if (r.estado !== 200 && r.estado !== 422) falla(`Lettermint: pedir la verificación no salió bien. ${explicarHttp('Lettermint', r)}`);
  const d = await leerDominio(lm, dominio.id);
  const pedidos = registrosPedidos(d);
  const necesarios = pedidos.filter((p) => p.necesario);
  const bien = necesarios.filter((p) => p.estado === 'active').length;
  salida.linea(`Verificación de ${DOMINIO} en Lettermint: ${ESTADO_DOMINIO[d.status] || acortar(d.status || 'sin estado', 30)}.`);
  for (const p of pedidos) salida.linea(lineaRegistro(p));
  const recomendadosMal = pedidos.filter((p) => p.alcance === 'recommended' && p.estado !== 'active').length;
  salida.linea(`Necesarios verificados: ${bien} de ${necesarios.length}.${recomendadosMal ? ` Recomendados que aún fallan: ${recomendadosMal} (no impiden enviar).` : ''}`);
  if (r.estado === 422) {
    const mensaje = detalleError(r.datos);
    if (mensaje) salida.linea(`Lettermint dice: «${mensaje}».`);
  }
  salida.resumen(`**Verificación de ${DOMINIO}:** ${ESTADO_DOMINIO[d.status] || '-'} · necesarios verificados ${bien} de ${necesarios.length}.`);
  return { verificado: r.estado === 200 && bien === necesarios.length, bien, total: necesarios.length };
}

/* ---------------------------------------------------------------- acciones */
async function estado({ entorno, salida }) {
  const faltan = [];
  let cf = null, lm = null, zona = null, existentes = null, dominio = null;
  try { cf = clienteCloudflare(entorno, salida); } catch (e) { if (!(e instanceof Parada)) throw e; faltan.push(e.message); }
  try { lm = clienteLettermint(entorno, salida); } catch (e) { if (!(e instanceof Parada)) throw e; faltan.push(e.message); }

  salida.linea('== Cloudflare ==');
  if (cf) {
    zona = await buscarZona(cf);
    if (!zona) salida.linea(`No está la zona ${DOMINIO}: el dominio aún no está comprado en Cloudflare, o el token no tiene acceso a ella.`);
    else {
      salida.linea(`Zona ${DOMINIO}: ${ESTADO_ZONA[zona.status] || acortar(zona.status || 'sin estado', 30)}.`);
      existentes = await registrosDeLaZona(cf, zona);
    }
  } else salida.linea('(sin CLOUDFLARE_DNS_TOKEN: no se mira Cloudflare)');

  salida.linea('== Lettermint ==');
  let proyecto = null;
  if (lm) {
    const eq = await lm.pedir('GET', '/team');
    if (eq.estado === 200 && objeto(eq.datos)) {
      const t = objeto(eq.datos);
      salida.linea(`Equipo: plan ${acortar(t.plan || '?', 20)}; verificación de la cuenta: ${t.verified_at ? `aprobada (${fechaCorta(t.verified_at)})` : 'sin aprobar todavía'} (campo verified_at).`);
    } else salida.linea(`Equipo: no se pudo leer (HTTP ${eq.estado}${eq.estado === 403 ? ': al token le falta read:team' : ''}).`);
    try { proyecto = await buscarProyecto(lm); } catch (e) { if (!(e instanceof Parada)) throw e; salida.linea(e.message); }
    if (proyecto) {
      const p = objeto(lm.exigir(await lm.pedir('GET', `/projects/${encodeURIComponent(proyecto.id)}`), 200, 'leer el proyecto'));
      salida.linea(`Proyecto «${PROYECTO_LETTERMINT}»: existe; envío ${p.delivery_mode === 'sandbox' ? 'en modo Sandbox (simula, no entrega)' : 'real (live)'}; SMTP ${p.smtp_enabled ? 'activado' : 'sin activar'}.`);
      const resumenDominio = await buscarDominio(lm);
      if (!resumenDominio) salida.linea(`Dominio ${DOMINIO}: no está añadido en Lettermint (lo añade preparar-dominio).`);
      else {
        dominio = await leerDominio(lm, resumenDominio.id);
        const asociado = (dominio.projects || []).some((x) => x && x.id === proyecto.id);
        salida.linea(`Dominio ${DOMINIO}: ${ESTADO_DOMINIO[dominio.status] || acortar(dominio.status || 'sin estado', 30)}; ${asociado ? `asociado al proyecto «${PROYECTO_LETTERMINT}»` : `SIN asociar al proyecto «${PROYECTO_LETTERMINT}» (lo hace preparar-dominio)`}.`);
        for (const r of registrosPedidos(dominio)) salida.linea(lineaRegistro(r));
      }
      const rutas = await rutasDelProyecto(lm, proyecto);
      salida.linea(`Rutas (${rutas.length}):`);
      for (const r of rutas) {
        if (r.route_type === 'inbound') { salida.linea(`  ${nombreRuta(r)}: de entrada, no envía`); continue; }
        const s = r.settings && typeof r.settings === 'object' ? r.settings : {};
        const baja = r.route_type === 'broadcast'
          ? `; enlace de baja de Lettermint: ${s.disable_hosted_unsubscribe === true ? 'quitado' : 'puesto (lo normal en el plan gratis)'}` : '';
        salida.linea(`  ${nombreRuta(r)}: ${seguimiento(s).texto}${baja}`);
      }
      const tokens = await tokensDelProyecto(lm, proyecto);
      salida.linea(`Tokens del proyecto (${tokens.length}; solo nombres y fechas, nunca el valor):`);
      for (const t of tokens) {
        salida.linea(`  «${acortar(t.name || '?', 60)}»: creado ${fechaCorta(t.created_at)}, último uso ${t.last_used_at ? fechaCorta(t.last_used_at) : 'nunca'}`);
      }
      for (const n of [TOKEN_BASE, TOKEN_SMTP]) if (!tokens.some((t) => t.name === n)) salida.linea(`  (no hay ninguno «${n}»)`);
    }
  } else salida.linea('(sin LETTERMINT_TEAM_TOKEN: no se mira Lettermint)');

  if (existentes) {
    const pedidos = dominio ? registrosPedidos(dominio) : [];
    const nombres = new Set(pedidos.map((p) => p.nombre));
    const importa = existentes.filter((r) => r.tipo === 'MX' || r.tipo === 'TXT' || nombres.has(r.nombre)
      || /(^|\.)_domainkey\./.test(r.nombre) || /(^|\.)lmta\.net$/.test(r.valor));
    salida.linea(`== Registros DNS de ${DOMINIO} que importan para el correo (${importa.length}) ==`);
    for (const r of importa) salida.linea(`  ${r.tipo.padEnd(5)} ${r.nombre} → ${acortar(r.valor, 40)}${r.proxied ? ' (en naranja: Proxied)' : ''}`);
    if (dominio) {
      const plan = planificar(pedidos, existentes);
      const cuenta = (d) => plan.filter((p) => p.decision === d).length;
      salida.linea(`Lo que haría preparar-dominio (sin hacerlo): crear ${cuenta('crear')} · ya están ${cuenta('ya') + cuenta('propio')} · conflictos ${cuenta('conflicto')}.`);
      for (const p of plan.filter((x) => x.decision === 'conflicto')) salida.linea(`  CONFLICTO en ${p.tipo} ${p.nombre}: ${p.explicacion}`);
    }
  }
  salida.resumen(`**Estado (solo lectura):** Cloudflare ${zona ? `zona ${ESTADO_ZONA[zona.status] || zona.status}` : 'sin zona'} · Lettermint ${dominio ? `dominio ${ESTADO_DOMINIO[dominio.status] || dominio.status}` : 'sin dominio'}.`);
  if (faltan.length) falla(faltan.join(' '));
}

async function prepararDominio({ entorno, salida }) {
  // Las dos claves antes de tocar nada.
  const cf = clienteCloudflare(entorno, salida);
  const lm = clienteLettermint(entorno, salida);
  salida.linea(`1/5 · Cloudflare: zona ${DOMINIO}`);
  const zona = await buscarZona(cf) || zonaSinNombre();
  salida.linea(`  ${ESTADO_ZONA[zona.status] || acortar(zona.status || 'sin estado', 30)}.`);
  if (zona.status !== 'active') salida.aviso(`La zona ${DOMINIO} de Cloudflare no está activa (${acortar(zona.status, 20)}): los registros se crean, pero no se verán hasta que lo esté.`);

  salida.linea(`2/5 · Lettermint: proyecto «${PROYECTO_LETTERMINT}» y dominio ${DOMINIO}`);
  const proyecto = await buscarProyecto(lm);
  let resumenDominio = await buscarDominio(lm);
  if (!resumenDominio) {
    const creado = objeto(lm.exigir(await lm.pedir('POST', '/domains', { cuerpo: { domain: DOMINIO } }), [200, 201], `añadir el dominio ${DOMINIO}`));
    if (!creado || typeof creado.id !== 'string') falla(`Lettermint añadió el dominio ${DOMINIO} sin decir su id: míralo en su panel.`);
    resumenDominio = creado;
    salida.linea(`  Dominio ${DOMINIO} añadido en Lettermint.`);
  } else salida.linea(`  El dominio ${DOMINIO} ya estaba en Lettermint.`);
  let dominio = await leerDominio(lm, resumenDominio.id);
  const asociados = (Array.isArray(dominio.projects) ? dominio.projects : []).map((p) => p && p.id).filter((id) => typeof id === 'string');
  if (!asociados.includes(proyecto.id)) {
    // Se suman los que ya tuviera: nunca se quita una asociación.
    lm.exigir(await lm.pedir('PUT', `/domains/${encodeURIComponent(dominio.id)}/projects`, { cuerpo: { project_ids: [...asociados, proyecto.id] } }),
      200, `asociar el dominio al proyecto «${PROYECTO_LETTERMINT}»`);
    salida.linea(`  Asociado al proyecto «${PROYECTO_LETTERMINT}».`);
    dominio = await leerDominio(lm, dominio.id);
  } else salida.linea(`  Ya estaba asociado al proyecto «${PROYECTO_LETTERMINT}».`);

  salida.linea('3/5 · Registros que pide Lettermint, comparados con los de Cloudflare');
  const pedidos = registrosPedidos(dominio);
  const sinPoner = pedidos.filter((p) => !p.poner);
  const existentes = await registrosDeLaZona(cf, zona);
  const plan = planificar(pedidos, existentes);
  const texto = { ya: 'ya está, igual', crear: 'falta: se crea', propio: 'hay uno propio que vale: no se toca', conflicto: 'CONFLICTO' };
  for (const p of plan) salida.linea(`  ${p.tipo.padEnd(5)} ${p.nombre}: ${texto[p.decision]}${p.explicacion && p.decision !== 'conflicto' ? ` (${p.explicacion})` : ''}`);
  for (const p of sinPoner) salida.linea(`  ${p.tipo.padEnd(5)} ${p.nombre}: no se pone (Lettermint lo marca «${acortar(p.alcance, 20)}»)`);
  const conflictos = plan.filter((p) => p.decision === 'conflicto');
  if (conflictos.length) {
    salida.resumen(`**Conflictos en el DNS de ${DOMINIO}:** ${conflictos.length}. No se ha creado ningún registro.`);
    falla(`No se ha creado ningún registro en Cloudflare: ${conflictos.length === 1 ? 'hay un registro que choca' : `hay ${conflictos.length} registros que chocan`} con lo que pide Lettermint, y este flujo nunca borra ni cambia lo que ya existe. ` +
      conflictos.map((p) => `${p.tipo} ${p.nombre}: ${p.explicacion}`).join(' · '));
  }

  salida.linea('4/5 · Cloudflare: crear los que faltan');
  const crear = plan.filter((p) => p.decision === 'crear');
  if (!crear.length) salida.linea('  Ninguno: ya estaban todos.');
  for (const p of crear) {
    exigirCF(await cf.pedir('POST', `/zones/${encodeURIComponent(zona.id)}/dns_records`, { cuerpo: cuerpoCF(p) }), `crear el ${p.tipo} ${p.nombre}`);
    salida.linea(`  Creado ${p.tipo} ${p.nombre}${p.tipo === 'CNAME' ? ' (DNS only, sin proxy)' : ''}.`);
  }
  salida.resumen(`**DNS de ${DOMINIO}:** ${crear.length} creados · ${plan.length - crear.length} ya estaban.`);

  salida.linea('5/5 · Lettermint: verificar');
  const v = await verificar(lm, dominio, salida);
  if (!v.verificado) {
    salida.linea(crear.length
      ? 'Aún no sale todo verificado: es normal justo después de crear los registros. Espera entre 10 y 30 minutos y lanza verificar-dominio.'
      : 'Aún no sale todo verificado. Lanza verificar-dominio dentro de un rato; si sigue igual, mira el estado de cada registro arriba.');
  } else salida.linea(`${DOMINIO} verificado en Lettermint.`);
}

async function verificarDominio({ entorno, salida }) {
  const lm = clienteLettermint(entorno, salida);
  await buscarProyecto(lm);
  const d = await buscarDominio(lm);
  if (!d) falla(`El dominio ${DOMINIO} no está en Lettermint: lanza antes preparar-dominio.`);
  const v = await verificar(lm, d, salida);
  if (!v.verificado) {
    falla(`${DOMINIO} todavía no está verificado del todo (${v.bien} de ${v.total} registros necesarios). Si los registros se acaban de poner, espera entre 10 y 30 minutos y relánzalo; si alguno sigue fallando, compáralo con Cloudflare (acción estado).`);
  }
  salida.linea(`${DOMINIO} verificado: ya se puede enviar desde él.`);
}

const rechazoDePermiso = (r) => r.estado === 403 && /abilit|permission|permiso/i.test(detalleError(r.datos));

async function ajustarRutas({ entorno, salida }) {
  const lm = clienteLettermint(entorno, salida);
  const proyecto = await buscarProyecto(lm);
  const rutas = (await rutasDelProyecto(lm, proyecto)).filter((r) => r.route_type !== 'inbound');
  if (!rutas.length) falla(`El proyecto «${PROYECTO_LETTERMINT}» no tiene rutas de envío: míralo en su panel.`);
  const malas = [];
  for (const ruta of rutas) {
    const s = ruta.settings && typeof ruta.settings === 'object' ? ruta.settings : {};
    const seg = seguimiento(s);
    if (!seg.existe) salida.linea(`${nombreRuta(ruta)}: el seguimiento de aperturas y clics no existe en este plan. Correcto: no hay nada que apagar.`);
    else if (seg.apagado) salida.linea(`${nombreRuta(ruta)}: seguimiento ya apagado.`);
    else {
      const r = await lm.pedir('PUT', `/routes/${encodeURIComponent(ruta.id)}`, { cuerpo: { settings: { track_opens: false, track_clicks: false } } });
      const despues = r.estado === 200 ? objeto(r.datos) : null;
      if (despues && seguimiento(despues.settings).apagado) salida.linea(`${nombreRuta(ruta)}: seguimiento APAGADO ahora.`);
      else {
        malas.push(nombreRuta(ruta));
        salida.linea(`${nombreRuta(ruta)}: el seguimiento está encendido y no se ha podido apagar. ${explicarHttp('Lettermint', r)}`);
      }
    }
  }
  const difusion = rutas.filter((r) => r.route_type === 'broadcast');
  if (!difusion.length) salida.linea('No hay ruta de difusión (broadcast): nada que hacer con el enlace de baja de Lettermint.');
  for (const ruta of difusion) {
    if (ruta.settings && ruta.settings.disable_hosted_unsubscribe === true) { salida.linea(`${nombreRuta(ruta)}: el enlace de baja de Lettermint ya estaba quitado.`); continue; }
    const r = await lm.pedir('PUT', `/routes/${encodeURIComponent(ruta.id)}`, { cuerpo: { settings: { disable_hosted_unsubscribe: true } } });
    const despues = r.estado === 200 ? objeto(r.datos) : null;
    if (despues && despues.settings && despues.settings.disable_hosted_unsubscribe === true) {
      salida.linea(`${nombreRuta(ruta)}: enlace de baja de Lettermint QUITADO. RWAdar ya pone el suyo en cada aviso.`);
    } else if (r.estado === 401 || rechazoDePermiso(r) || r.estado === 0 || r.estado === 429 || r.estado >= 500) {
      falla(`No se pudo pedir a Lettermint que quite su enlace de baja en ${nombreRuta(ruta)}. ${explicarHttp('Lettermint', r)}`);
    } else {
      const dice = detalleError(r.datos);
      salida.linea(`${nombreRuta(ruta)}: Lettermint NO deja quitar su enlace de baja (HTTP ${r.estado}${dice ? `: «${dice}»` : ''}). ` +
        'Es lo esperable en el plan gratis: solo lo concede a «trusted senders» de planes superiores. No pasa nada: las bajas que guarde Lettermint ' +
        'las pasa a RWAdar el flujo «Correo Lettermint» (sincronizar-bajas).');
      salida.resumen(`**Enlace de baja de Lettermint** en ${nombreRuta(ruta)}: rechazado (lo esperable en el plan gratis; lo cubre sincronizar-bajas).`);
    }
  }
  if (malas.length) falla(`El seguimiento sigue encendido en ${malas.join(', ')}. Apágalo a mano en Lettermint › Projects › ${PROYECTO_LETTERMINT} › Routes antes de enviar nada.`);
  salida.resumen(`**Seguimiento:** apagado o inexistente en las ${rutas.length} rutas de envío.`);
}

/* Comprueba la base sin cambiar nada: que responde, que tiene Vault y si ya
   guarda un LETTERMINT_API_TOKEN (solo cuántos, nunca el valor). */
const CONSULTA_VAULT = [
  'begin transaction read only;',
  "select (to_regprocedure('vault.create_secret(text,text,text,uuid)') is not null",
  "    and to_regprocedure('vault.update_secret(uuid,text,text,text,uuid)') is not null)::text",
  "  || '|' || (select count(*) from vault.secrets where name = 'LETTERMINT_API_TOKEN')::text;",
  'rollback;', ''].join('\n');
const errorPsql = (salida, r) => (r.fallo === 'ENOENT' ? 'no está psql' : acortar(salida.limpio(r.error || `código ${r.codigo}`).replace(/\s+/g, ' ').trim(), 300));

async function crearTokenBase({ entorno, entradas, salida }) {
  // Las dos claves antes de crear nada.
  const lm = clienteLettermint(entorno, salida);
  const dbUrl = entorno.SUPABASE_DB_URL || '';
  if (!dbUrl) {
    falla('Falta el secreto de GitHub SUPABASE_DB_URL (la dirección del «Session pooler» de Supabase, el mismo de «Copia de seguridad»). ' +
      'Sin él no se puede guardar el token en el Vault, así que no se crea ninguno.');
  }
  salida.ocultar(dbUrl);
  if (!/^postgres(ql)?:\/\/\S+$/.test(dbUrl)) falla('El secreto SUPABASE_DB_URL no tiene forma de dirección de Postgres (postgresql://…). No se crea ningún token.');

  salida.linea('1/4 · Base: que responde y tiene Vault (solo lee)');
  const r = ejecutarPsql(entorno, dbUrl, ['-f', '-'], { entrada: CONSULTA_VAULT });
  const m = r.codigo === 0 ? r.salida.split('\n').map((l) => /^(true|false)\|(\d+)$/.exec(l.trim())).find(Boolean) : null;
  if (!m) falla(`No se pudo comprobar la base antes de crear nada (${errorPsql(salida, r)}). No se ha creado ningún token. Mira que SUPABASE_DB_URL sea la del «Session pooler» y que la base esté en marcha.`);
  if (m[1] !== 'true') falla('La base no tiene Vault (vault.create_secret / vault.update_secret). No se ha creado ningún token.');
  const enVault = Number(m[2]);
  salida.linea(`  Responde. Vault ${enVault ? `ya guarda ${enVault === 1 ? 'un' : enVault} LETTERMINT_API_TOKEN` : 'no guarda ningún LETTERMINT_API_TOKEN'}.`);

  salida.linea(`2/4 · Lettermint: proyecto «${PROYECTO_LETTERMINT}» y tokens «${TOKEN_BASE}»`);
  const proyecto = await buscarProyecto(lm);
  const viejos = await tokensDelProyecto(lm, proyecto, TOKEN_BASE);
  salida.linea(`  ${viejos.length ? `Ya hay ${viejos.length}: ${viejos.map((t) => `creado ${fechaCorta(t.created_at)}`).join(', ')}.` : 'No hay ninguno.'}`);
  if (!entradas.rotar) {
    if (viejos.length && enVault) {
      salida.linea(`Ya está hecho: hay un token «${TOKEN_BASE}» y Vault guarda un LETTERMINT_API_TOKEN. No se crea otro. Para cambiarlo por uno nuevo, relanza con «rotar» = SI.`);
      salida.resumen(`**Token de la base:** ya estaba (no se ha creado otro).`);
      return;
    }
    if (viejos.length) {
      falla(`Ya hay un token «${TOKEN_BASE}» en Lettermint, pero Vault no guarda ninguno. No se crea otro sin permiso: relanza con «rotar» = SI (se crea uno nuevo, se guarda en Vault y después se borra el viejo).`);
    }
    if (enVault) {
      falla(`Vault ya guarda un LETTERMINT_API_TOKEN (quizá de «guardar-correo», con otro nombre en Lettermint), pero no hay ningún token «${TOKEN_BASE}». No se sustituye sin permiso: relanza con «rotar» = SI. El que hay ahora, si es de otro nombre, bórralo tú en Lettermint después (este flujo no sabe cuál es).`);
    }
  }

  salida.linea(`3/4 · Lettermint: crear «${TOKEN_BASE}» (se enmascara al llegar y nunca se enseña)`);
  const nuevo = await crearTokenProyecto(lm, proyecto, TOKEN_BASE, salida);
  salida.linea('  Creado.');

  salida.linea('4/4 · Vault: guardarlo con el remitente (db/31_correo_lettermint_guardar.sql)');
  // El token va a psql como variable (-v), como en «guardar-correo»; el SQL
  // solo lo usa en un SELECT (set_config) y nunca lo escribe.
  const g = ejecutarPsql(entorno, dbUrl, ['-v', `token=${nuevo.token}`, '-v', `remitente=${entradas.remitente}`, '-f', SQL_GUARDAR]);
  if (g.codigo !== 0 || !/guardados en Vault con forma válida/.test(g.error)) {
    const borrado = await borrarTokenProyecto(lm, proyecto, nuevo.id);
    falla(`No se pudo guardar el token nuevo en el Vault (${errorPsql(salida, g)}). ` +
      (borrado ? 'Se ha borrado el token recién creado en Lettermint: no queda ninguno sin usar.'
        : `Y NO se pudo borrar el token recién creado: bórralo en Lettermint › Projects › ${PROYECTO_LETTERMINT} › API tokens (el «${TOKEN_BASE}» de hoy).`) +
      (viejos.length ? ' El token anterior sigue como estaba, en Lettermint y en Vault.' : ''));
  }
  salida.linea(`  Guardado en Vault: LETTERMINT_API_TOKEN y RWADAR_REMITENTE (${entradas.remitente}). El correo sigue apagado (encenderlo es «activar-correo»).`);

  const quedan = [];
  for (const t of viejos) {
    if (await borrarTokenProyecto(lm, proyecto, t.id)) salida.linea(`  Borrado el token anterior (creado ${fechaCorta(t.created_at)}).`);
    else quedan.push(fechaCorta(t.created_at));
  }
  salida.resumen(`**Token de la base:** «${TOKEN_BASE}» creado y guardado en Vault${viejos.length ? `; ${viejos.length - quedan.length} anterior(es) borrado(s)` : ''}.`);
  if (quedan.length) {
    falla(`El token nuevo ya funciona (está en Vault), pero no se pudo borrar ${quedan.length === 1 ? 'el anterior' : `${quedan.length} anteriores`} (creado ${quedan.join(', ')}). Bórralo en Lettermint › Projects › ${PROYECTO_LETTERMINT} › API tokens.`);
  }
}

const HACER = {
  estado, 'preparar-dominio': prepararDominio, 'verificar-dominio': verificarDominio,
  'ajustar-rutas': ajustarRutas, 'crear-token-base': crearTokenBase,
};

export async function main({ argv = process.argv.slice(2), entorno = process.env } = {}) {
  const salida = crearSalida(entorno);
  try {
    const orden = argv[0];
    if (orden !== 'comprobar' && orden !== 'ejecutar') falla('Uso: node rwadar-app/dominio-correo.mjs comprobar|ejecutar (con ACCION y las demás entradas en el entorno).');
    const entradas = comprobarEntradas(entorno, salida);
    if (orden === 'comprobar') { salida.linea(`Acción: ${entradas.accion}. Entradas correctas.`); return 0; }
    await HACER[entradas.accion]({ entorno, entradas, salida });
    return 0;
  } catch (e) {
    if (e instanceof Parada) {
      salida.linea(`PARADO: ${e.message}`);
      salida.error(e.message);
      salida.resumen('', `**Parado:** ${e.message}`);
      return 1;
    }
    salida.error(`Error inesperado: ${e?.message || e}. Pide a Claude o a Codex que lo revise.`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = await main();
}

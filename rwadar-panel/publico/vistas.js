/* RWAdar · panel · vistas de control: resumen, interruptores, salud,
   registro y ajustes. Las de datos (tráfico, app, cuentas) están en
   vistas-datos.js. */
import { api, h, numero, fecha, haceCuanto, etiquetaEstado, bloqueError, confirmar, tostada, sesion } from './util.js';
import { lineas, SERIE_1, SERIE_2 } from './graficos.js';

const resultado = p => p.status === 'fulfilled' ? { datos: p.value } : { error: p.reason };
const textoGlobal = salud => ({
  ok: ['Todo en marcha', 'La web, la app y la base de datos responden bien.'],
  aviso: ['Funciona, con avisos', `${salud.problemas.length} cosa${salud.problemas.length === 1 ? '' : 's'} para mirar cuando puedas.`],
  fallo: ['Hay cosas que arreglar', `${salud.problemas.filter(p => p.estado === 'fallo').length} fallo(s) y ${salud.problemas.filter(p => p.estado === 'aviso').length} aviso(s).`],
}[salud.global]);

export function puntosTrafico(trafico) {
  return trafico.serie.map(p => {
    const d = new Date(trafico.porHora ? p.momento : `${p.momento}T12:00:00Z`);
    return {
      etiqueta: trafico.porHora ? fecha(d) : fecha(d, { hora: false }),
      corta: trafico.porHora ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }) : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }),
      valores: { visitas: p.visitas, paginas: p.paginas },
    };
  });
}

export const SERIES_TRAFICO = [{ clave: 'visitas', nombre: 'Visitas', color: SERIE_1 }, { clave: 'paginas', nombre: 'Páginas vistas', color: SERIE_2 }];

function kpi(etiqueta, valor, extra) {
  return h('div', { class: 'kpi' }, h('span', { class: 'kpi-etiqueta' }, etiqueta), h('span', { class: 'kpi-valor' }, valor), extra ? h('span', { class: 'kpi-extra' }, extra) : null);
}

function kpiDe(r, etiqueta, valor, extra) {
  if (r.error) return h('div', { class: 'kpi' }, h('span', { class: 'kpi-etiqueta' }, etiqueta), bloqueError(r.error));
  return kpi(etiqueta, valor(r.datos), extra?.(r.datos));
}

export function listaProblemas(problemas) {
  if (!problemas.length) return h('div', { class: 'todo-bien' }, etiquetaEstado('ok'), 'No hay nada que corregir ahora mismo.');
  return h('div', { class: 'problemas' }, ...problemas.map(p => h('div', { class: `problema ${p.estado}` },
    etiquetaEstado(p.estado), h('h3', {}, `${p.area} · ${p.nombre}`),
    h('p', { class: 'detalle' }, p.detalle), p.arreglo ? h('p', { class: 'arreglo' }, p.arreglo) : null)));
}

function chipInterruptor(etiqueta, encendida, textoSi, textoNo) {
  return h('a', { class: 'chip', href: '#interruptores' }, h('span', { class: `luz ${encendida === null ? '' : encendida ? 'encendida' : 'apagada'}` }),
    `${etiqueta}: `, h('strong', {}, encendida === null ? 'sin datos' : encendida ? textoSi : textoNo));
}

export async function resumen(raiz) {
  const [inter, salud, trafico, app, cuentas] = (await Promise.allSettled([
    api('/api/interruptores'), api('/api/salud'), api('/api/trafico?periodo=7d'), api('/api/app'), api('/api/cuentas'),
  ])).map(resultado);
  const web = inter.datos?.web;
  const catalogo = inter.datos?.catalogo;
  const global = salud.datos?.global || 'aviso';
  const [titulo, sub] = salud.datos ? textoGlobal(salud.datos) : ['Sin datos de salud', salud.error?.message || ''];
  raiz.replaceChildren(
    h('section', { class: `pulso-global ${global}` },
      h('div', { class: 'radar', 'aria-hidden': 'true' }),
      h('div', {}, h('h2', {}, titulo), h('p', {}, sub, salud.datos ? ` Comprobado ${haceCuanto(salud.datos.comprobado)}.` : '')),
      h('div', { class: 'interruptores-mini' },
        chipInterruptor('Web', web && !web.error ? web.encendida : null, 'encendida', 'apagada'),
        chipInterruptor('Catálogo', catalogo && !catalogo.error ? !catalogo.retirado : null, 'visible', 'retirado'))),
    h('div', { class: 'rejilla kpis' },
      kpiDe(trafico, 'Visitas · 7 días', d => numero(d.visitas), d => `${numero(d.paginasVistas)} páginas vistas`),
      kpiDe(cuentas, 'Cuentas creadas', d => numero(d.resumen.total), d => `+${numero(d.resumen.nuevas7d)} esta semana`),
      kpiDe(app, 'Aperturas de la app · 24 h', d => d.uso.datos ? numero(d.uso.datos.app) : '—', d => d.descargas.datos ? `${numero(d.descargas.datos.totalApk)} descargas del APK` : ''),
      kpiDe(cuentas, 'Activas · 30 días', d => numero(d.resumen.activas30d), d => `${numero(d.resumen.sinConfirmar)} sin confirmar`)),
    h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Cosas que corregir'),
        salud.datos ? listaProblemas(salud.datos.problemas) : bloqueError(salud.error)),
      h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Visitas de la última semana'), h('a', { href: '#trafico', class: 'nota' }, 'Ver el tráfico completo')),
        trafico.datos ? lineas(puntosTrafico(trafico.datos), SERIES_TRAFICO) : bloqueError(trafico.error))),
  );
  return salud.datos?.global;
}

function tarjetaWeb(datos, recargar) {
  const web = datos.web;
  if (web.error) return h('section', { class: 'tarjeta' }, h('h2', {}, 'La web'), bloqueError({ message: `No pude comprobar la web: ${web.error}` }));
  const apagada = web.enMantenimiento;
  const boton = apagada
    ? h('button', { class: 'boton', disabled: !datos.puedeApagar, onclick: () => confirmar({
      titulo: 'Encender la web',
      texto: ['Cloudflare volverá a poner en producción el despliegue que había antes de apagarla. Tarda unos segundos.'],
      aceptar: 'Encender', esperando: 'Encendiendo…',
      accion: () => api('/api/web/encender', { metodo: 'POST', cuerpo: {} }),
    }).then(r => { if (r) { tostada('Web encendida. Puede tardar un minuto en verse en todos los sitios.'); recargar(); } }) }, 'Encender la web')
    : h('button', { class: 'boton peligro', disabled: !datos.puedeApagar, onclick: () => confirmar({
      titulo: '¿Apagar la web?',
      texto: ['Quien entre en rwadar.pages.dev verá «Estamos haciendo mantenimiento». La app y el enlace de descarga siguen funcionando.',
        'Subir la página de mantenimiento tarda alrededor de un minuto. Podrás encenderla de nuevo desde aquí.'],
      campos: [{ nombre: 'confirmacion', etiqueta: 'Escribe APAGAR para confirmar', ejemplo: 'APAGAR' }],
      aceptar: 'Apagar la web', peligro: true, esperando: 'Subiendo mantenimiento…',
      accion: v => { if (v.confirmacion !== 'APAGAR') throw new Error('Escribe APAGAR en mayúsculas'); return api('/api/web/apagar', { metodo: 'POST', cuerpo: v }); },
    }).then(r => { if (r) { tostada('Web apagada: ya se ve la página de mantenimiento.'); recargar(); } }) }, 'Apagar la web');
  return h('section', { class: 'tarjeta interruptor' },
    h('div', {},
      h('p', { class: 'nota' }, 'La web · rwadar.pages.dev'),
      h('div', { class: 'interruptor-estado' }, h('span', { class: `luz ${apagada ? 'apagada' : 'encendida'}` }),
        h('strong', {}, apagada ? 'Apagada (mantenimiento)' : web.encendida ? 'Encendida' : `Con problemas (${web.estadoHttp})`)),
      h('p', { class: 'nota' }, apagada && web.guardado ? `Apagada ${haceCuanto(web.guardado.apagadaEl)} · volverá al despliegue ${web.guardado.anterior.corto}` : `Responde ${web.estadoHttp} en ${web.ms} ms`)),
    boton,
    h('p', { class: 'explica' }, 'Apagar sube a Cloudflare una página de «Volvemos enseguida» en lugar de la web (con el código 503, que Google entiende como una pausa). Encender vuelve exactamente a la web que había, sin publicar nada nuevo.'),
    datos.puedeApagar ? null : h('p', { class: 'requisito' }, 'Necesita la clave de Cloudflare. ', h('a', { href: '#ajustes' }, 'Cómo configurarla')));
}

function tarjetaCatalogo(datos, recargar) {
  const c = datos.catalogo;
  if (c.error) return h('section', { class: 'tarjeta' }, h('h2', {}, 'El catálogo'), bloqueError({ message: `No pude leer el catálogo: ${c.error}` }));
  const boton = c.retirado
    ? h('button', { class: 'boton', disabled: !datos.puedeRetirar, onclick: () => confirmar({
      titulo: 'Volver a mostrar el catálogo',
      texto: ['La web y la app enseñarán otra vez la última revisión publicada.'],
      aceptar: 'Mostrar el catálogo', esperando: 'Guardando…',
      accion: () => api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: false } }),
    }).then(r => { if (r) { tostada('Catálogo visible otra vez en la web y en la app.'); recargar(); } }) }, 'Mostrar el catálogo')
    : h('button', { class: 'boton peligro', disabled: !datos.puedeRetirar, onclick: () => confirmar({
      titulo: '¿Retirar el catálogo?',
      texto: ['Las plataformas y ofertas dejan de verse en la web y en la app hasta que lo vuelvas a mostrar. El resto de la web sigue en pie.'],
      campos: [{ nombre: 'motivo', etiqueta: 'Motivo (se guarda en la base)', tipo: 'texto-largo', ejemplo: 'Revisión urgente de una ficha' },
        { nombre: 'confirmacion', etiqueta: 'Escribe RETIRAR para confirmar', ejemplo: 'RETIRAR' }],
      aceptar: 'Retirar el catálogo', peligro: true, esperando: 'Guardando…',
      accion: v => {
        if (v.motivo.length < 3) throw new Error('Escribe un motivo (mínimo 3 letras)');
        if (v.confirmacion !== 'RETIRAR') throw new Error('Escribe RETIRAR en mayúsculas');
        return api('/api/catalogo', { metodo: 'POST', cuerpo: { retirado: true, motivo: v.motivo, confirmacion: v.confirmacion } });
      },
    }).then(r => { if (r) { tostada('Catálogo retirado de la web y de la app.'); recargar(); } }) }, 'Retirar el catálogo');
  return h('section', { class: 'tarjeta interruptor' },
    h('div', {},
      h('p', { class: 'nota' }, 'El catálogo · en la web y en la app'),
      h('div', { class: 'interruptor-estado' }, h('span', { class: `luz ${c.retirado ? 'apagada' : 'encendida'}` }), h('strong', {}, c.retirado ? 'Retirado' : 'Visible')),
      h('p', { class: 'nota' }, c.retirado ? `Motivo: ${c.motivo || 'sin motivo'} · ${fecha(c.actualizadoEl)}` : `Última orden: ${fecha(c.actualizadoEl)}`)),
    boton,
    h('p', { class: 'explica' }, 'La web y la app consultan esta orden en Supabase cada vez que cargan el catálogo. Retirarlo lo oculta en las dos a la vez, sin publicar nada.'),
    datos.puedeRetirar ? null : h('p', { class: 'requisito' }, 'Necesita la clave secreta de Supabase. ', h('a', { href: '#ajustes' }, 'Cómo configurarla')));
}

export async function interruptores(raiz, recargar) {
  const [datos, despliegues] = (await Promise.allSettled([api('/api/interruptores'), api('/api/despliegues')])).map(resultado);
  if (datos.error) { raiz.replaceChildren(bloqueError(datos.error)); return; }
  raiz.replaceChildren(
    h('div', { class: 'rejilla dos' }, tarjetaWeb(datos.datos, recargar), tarjetaCatalogo(datos.datos, recargar)),
    h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Despliegues de la web en producción'), h('span', { class: 'nota' }, 'Cloudflare Pages · los más recientes primero')),
      despliegues.error ? bloqueError(despliegues.error) : h('div', { class: 'tabla-caja' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Cuándo'), h('th', {}, 'Despliegue'), h('th', {}, 'Resultado'), h('th', {}, 'Qué era'))),
        h('tbody', {}, ...despliegues.datos.map(d => h('tr', {},
          h('td', {}, fecha(d.creado)), h('td', { class: 'num' }, d.corto),
          h('td', {}, etiquetaEstado(d.estado === 'success' ? 'ok' : d.estado === 'failure' ? 'fallo' : 'sin-datos', d.estado === 'success' ? 'Correcto' : d.estado === 'failure' ? 'Falló' : d.estado)),
          h('td', { class: 'tenue' }, d.mensaje.includes('RWADAR-MANTENIMIENTO') ? 'Página de mantenimiento (apagado desde el panel)' : d.mensaje.split('\n')[0] || '—'))))))),
  );
}

export async function salud(raiz, recargar, { fresco = false } = {}) {
  const datos = await api(`/api/salud${fresco ? '?fresco=1' : ''}`);
  const [titulo, sub] = textoGlobal(datos);
  const aFondo = h('div', {});
  const botonFondo = h('button', { class: 'boton secundario', onclick: async () => {
    botonFondo.setAttribute('aria-busy', 'true');
    botonFondo.textContent = 'Comprobando página a página…';
    try {
      const r = await api('/api/salud/a-fondo', { metodo: 'POST', cuerpo: {} });
      aFondo.replaceChildren(!r.disponible ? h('p', { class: 'nota' }, r.motivo)
        : r.fallos.length ? h('div', { class: 'problemas' }, h('p', {}, `${r.correctas} controles correctos y ${r.fallos.length} con diferencias:`), ...r.fallos.map(f => h('div', { class: 'problema aviso' }, etiquetaEstado('aviso'), h('h3', {}, f))))
          : h('div', { class: 'todo-bien' }, etiquetaEstado('ok'), `Los ${r.correctas} controles de la web publicada son correctos.`));
    } catch (e) { aFondo.replaceChildren(bloqueError(e)); }
    botonFondo.removeAttribute('aria-busy');
    botonFondo.textContent = 'Comprobación a fondo';
  } }, 'Comprobación a fondo');
  raiz.replaceChildren(
    h('section', { class: `pulso-global ${datos.global}` }, h('div', { class: 'radar', 'aria-hidden': 'true' }),
      h('div', {}, h('h2', {}, titulo), h('p', {}, `${sub} Comprobado ${fecha(datos.comprobado)}.`)),
      h('div', { class: 'interruptores-mini' }, h('button', { class: 'boton', onclick: () => recargar({ fresco: true }) }, 'Comprobar ahora'))),
    h('section', { class: 'tarjeta' }, h('h2', {}, 'Todas las comprobaciones'), h('div', { class: 'tabla-caja' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Área'), h('th', {}, 'Comprobación'), h('th', {}, 'Estado'), h('th', {}, 'Detalle'), h('th', {}, 'Qué hacer'))),
      h('tbody', {}, ...datos.comprobaciones.map(c => h('tr', {},
        h('td', { class: 'tenue' }, c.area), h('td', {}, c.nombre), h('td', {}, etiquetaEstado(c.estado)), h('td', {}, c.detalle), h('td', { class: 'tenue' }, c.arreglo || '—'))))))),
    h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Tareas automáticas'), h('span', { class: 'nota' }, 'GitHub Actions del repositorio RWADAR')),
      datos.tareas.length ? h('div', { class: 'tabla-caja' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Tarea'), h('th', {}, 'Última vez'), h('th', {}, 'Resultado'), h('th', {}, ''))),
        h('tbody', {}, ...datos.tareas.map(t => h('tr', {},
          h('td', {}, t.nombre), h('td', { class: 'tenue' }, `${fecha(t.fecha)} · ${t.evento || ''}`),
          h('td', {}, etiquetaEstado(t.resultado === 'success' ? 'ok' : t.resultado === 'en-curso' ? 'sin-datos' : ['skipped', 'cancelled'].includes(t.resultado) ? 'sin-datos' : 'fallo',
            { success: 'Correcta', 'en-curso': 'En curso', skipped: 'Omitida', cancelled: 'Cancelada', failure: 'Falló' }[t.resultado] || t.resultado)),
          h('td', { class: 'acciones' }, t.url ? h('a', { href: t.url, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir') : null))))))
        : h('p', { class: 'vacio' }, 'No pude leer las tareas de GitHub (¿gh tiene la sesión iniciada?).')),
    sesion.ajustes?.puedeAFondo === false ? null : h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Comprobación a fondo'), botonFondo),
      h('p', { class: 'nota' }, 'Recorre la web publicada página a página (portada, Academy, fichas, recursos y CSP) con el mismo control que se pasa tras cada publicación. Compara con el repositorio de este PC: si aquí hay cambios sin publicar, saldrán como diferencias.'),
      aFondo),
  );
  return datos.global;
}

export async function registro(raiz) {
  const entradas = await api('/api/registro');
  const nube = sesion.ajustes?.modo === 'nube';
  raiz.replaceChildren(h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Lo que se ha hecho desde el panel'),
      h('span', { class: 'nota' }, nube ? 'Se guarda en Cloudflare, con el correo de quien lo hizo' : 'Se guarda en rwadar-panel/datos/registro.jsonl, solo en este PC')),
    entradas.length ? h('div', { class: 'tabla-caja' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Cuándo'), h('th', {}, 'Quién'), h('th', {}, 'Acción'), h('th', {}, 'Sobre'), h('th', {}, 'Resultado'))),
      h('tbody', {}, ...entradas.map(e => h('tr', {},
        h('td', { class: 'tenue' }, fecha(e.fecha)), h('td', { class: 'correo' }, e.quien || '—'), h('td', {}, e.accion), h('td', { class: 'correo' }, e.objetivo || '—'),
        h('td', {}, e.resultado === 'hecho' ? etiquetaEstado('ok', 'Hecho') : etiquetaEstado('fallo', 'Error'), e.detalle ? h('div', { class: 'tenue' }, e.detalle) : null))))))
      : h('p', { class: 'vacio' }, 'Todavía no se ha hecho nada desde el panel.')));
}

function credencial(nombre, lista, pasos, nota) {
  return h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, nombre), lista ? etiquetaEstado('ok', 'Configurada') : etiquetaEstado('aviso', 'Falta')),
    h('ol', { class: 'pasos' }, ...pasos.map(p => h('li', {}, ...[].concat(p)))),
    nota ? h('p', { class: 'nota', style: 'margin-top:12px' }, nota) : null);
}

const enlace = (texto, href) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, texto);

function copiar(texto, aviso) {
  return async () => {
    try { await navigator.clipboard.writeText(texto); tostada(aviso); } catch { tostada('No pude copiarlo: selecciónalo a mano.', { error: true }); }
  };
}

/* La tarjeta para mandar a cada socio su enlace personal por WhatsApp.
   Solo existe en el panel del ordenador de Víctor. */
function tarjetaCompartir(a) {
  if (!a.urlNube) {
    return h('section', { class: 'tarjeta compartir' },
      h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Compartir el panel con tus socios'), etiquetaEstado('sin-datos', 'Sin subir')),
      h('p', { class: 'nota' }, 'Este panel solo se abre en este ordenador. Para que Eric y Samuel entren desde el móvil, hay que subir la versión compartida a Cloudflare. Cada uno recibe su enlace personal: lo abre y ya está dentro, sin cuentas ni contraseñas.'),
      h('ol', { class: 'pasos' },
        h('li', {}, 'En el archivo de claves, escribe los nombres detrás de ', h('code', {}, 'PANEL_SOCIOS='), ', separados por comas. Por ejemplo: ', h('code', {}, 'PANEL_SOCIOS=Víctor,Eric,Samuel'), '.'),
        h('li', {}, 'En la carpeta Downloads, ejecuta ', h('code', {}, 'npm.cmd run panel:nube'), '.'),
        h('li', {}, 'Vuelve aquí: aparecerá un botón de WhatsApp para cada uno.')));
  }
  const filas = a.enlaces.map(e => {
    const mensaje = `Hola ${e.nombre}, este es tu enlace personal al panel de control de RWAdar:\n${e.url}\nÁbrelo y entrarás directamente. Es solo para ti: no lo reenvíes.`;
    return h('div', { class: 'socio' },
      h('div', {}, h('strong', {}, e.nombre), h('div', { class: 'nota' }, 'Enlace personal: quien lo tenga entra con tus mismos permisos')),
      h('div', { class: 'botonera' },
        h('a', { class: 'boton whatsapp pequeno', href: `https://wa.me/?text=${encodeURIComponent(mensaje)}`, target: '_blank', rel: 'noopener noreferrer' }, 'Enviar por WhatsApp'),
        h('button', { class: 'boton secundario pequeno', onclick: copiar(e.url, `Enlace de ${e.nombre} copiado.`) }, 'Copiar')));
  });
  return h('section', { class: 'tarjeta compartir' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Compartir el panel con tus socios'), etiquetaEstado('ok', 'En la nube')),
    h('p', { class: 'enlace-nube' }, enlace(a.urlNube, a.urlNube)),
    filas.length ? h('div', {}, ...filas)
      : h('p', { class: 'nota' }, 'Este panel se abre con Cloudflare Access (correo + código): manda la dirección de arriba.'),
    h('p', { class: 'nota', style: 'margin-top:12px' }, 'Cada enlace es una llave. Si alguien pierde el móvil o reenvía el mensaje, anula su enlace con ',
      h('code', {}, 'npm.cmd run panel:nube -- --enlace-nuevo=Nombre'), ' y mándale el nuevo. Todo lo que hagan queda en el Registro con su nombre.'));
}

/* En el panel compartido: quién ha entrado y cómo salir. */
function tarjetaSesion(a) {
  return h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, `Has entrado como ${a.quien}`), etiquetaEstado('ok', 'Dentro')),
    h('p', { class: 'nota' }, 'Este móvil u ordenador queda dentro 90 días. Si es un aparato compartido, cierra la sesión al terminar.'),
    h('div', { class: 'botonera' }, h('button', { class: 'boton secundario', onclick: async () => {
      await fetch('/api/salir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      location.replace('/entrar');
    } }, 'Cerrar sesión')));
}

export async function ajustes(raiz) {
  const a = await api('/api/ajustes');
  sesion.ajustes = a;
  if (a.modo === 'nube') {
    raiz.replaceChildren(
      tarjetaSesion(a),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Cómo funciona'),
        h('p', { class: 'nota' }, `Este es el panel compartido: lo mismo que el del ordenador de Víctor, salvo la comprobación a fondo. Las claves están guardadas en Cloudflare y nunca llegan a tu navegador.`),
        h('p', { class: 'nota', style: 'margin-top:8px' }, 'Para cambiar las claves o la lista de socios, Víctor edita su archivo de claves y vuelve a subir el panel con npm.cmd run panel:nube.')),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Qué está configurado'),
        h('div', { class: 'problemas' },
          h('div', { class: 'problema' }, etiquetaEstado(a.credenciales.cloudflare ? 'ok' : 'aviso', a.credenciales.cloudflare ? 'Sí' : 'Falta'), h('h3', {}, 'Cloudflare: visitas y encender/apagar')),
          h('div', { class: 'problema' }, etiquetaEstado(a.credenciales.supabase ? 'ok' : 'aviso', a.credenciales.supabase ? 'Sí' : 'Falta'), h('h3', {}, 'Supabase: cuentas y catálogo')),
          h('div', { class: 'problema' }, etiquetaEstado(a.credenciales.github ? 'ok' : 'sin-datos', a.credenciales.github ? 'Sí' : 'Opcional'), h('h3', {}, 'GitHub: tareas automáticas')))),
    );
    return;
  }
  const archivo = h('code', {}, a.archivoEnv);
  raiz.replaceChildren(
    tarjetaCompartir(a),
    h('section', { class: 'tarjeta' }, h('h2', {}, 'Cómo funciona'),
      h('p', { class: 'nota' }, 'Este panel solo se abre en este ordenador. Las claves se guardan en ', archivo,
        ', un archivo que Git ignora y que nunca sale de aquí. Después de cambiarlo, cierra la ventana negra del panel y vuelve a abrirlo.'),
      h('p', { class: 'nota', style: 'margin-top:8px' }, `Web vigilada: ${a.web} · proyecto de Cloudflare «${a.proyecto}»${a.modoDemo ? ' · MODO DEMOSTRACIÓN' : ''}`),
      a.puedeAbrirClaves ? h('div', { style: 'margin-top:14px' }, h('button', { class: 'boton secundario', onclick: async () => {
        try {
          const r = await api('/api/ajustes/abrir-claves', { metodo: 'POST', cuerpo: {} });
          tostada(r.abierto ? 'Abierto en el Bloc de notas. Pega las claves, guarda y vuelve a abrir el panel.' : r.motivo);
        } catch (e) { tostada(e.message, { error: true }); }
      } }, 'Abrir el archivo de claves')) : null),
    h('div', { class: 'rejilla dos' },
      credencial('Clave de Cloudflare', a.credenciales.cloudflare, [
        ['Entra en ', enlace('dash.cloudflare.com › Mi perfil › API Tokens', 'https://dash.cloudflare.com/profile/api-tokens'), ' y pulsa «Create Token».'],
        'Al final elige «Create Custom Token».',
        'Permisos: «Account · Cloudflare Pages · Edit» y «Account · Account Analytics · Read».',
        'En «Account Resources» elige tu cuenta. Crea el token y cópialo (solo se ve una vez).',
        ['Pulsa «Abrir el archivo de claves» (arriba) y pégalo detrás de ', h('code', {}, 'CLOUDFLARE_API_TOKEN='), '. Guarda.'],
      ], 'Sirve para ver las visitas, la lista de despliegues y para apagar y encender la web.'),
      credencial('Clave secreta de Supabase', a.credenciales.supabase, [
        ['Entra en ', enlace('Supabase › Project Settings › API Keys', 'https://supabase.com/dashboard/project/exgpmjpaaebyoolpwced/settings/api-keys'), '.'],
        'En «Secret keys» crea una llamada «panel-rwadar» y cópiala (empieza por sb_secret_).',
        ['En el archivo de claves, pégala detrás de ', h('code', {}, 'SUPABASE_SECRET_KEY='), '. Guarda.'],
      ], 'Es la llave maestra de la base: permite borrar cuentas. No la pegues en ningún chat ni la mandes por correo. Si algún día se escapa, bórrala en Supabase y crea otra.'),
      credencial('Registros de Supabase (uso de la app)', a.credenciales.registros, [
        ['Entra en ', enlace('Supabase › Account › Access Tokens', 'https://supabase.com/dashboard/account/tokens'), ' y crea un token llamado «panel-rwadar».'],
        'Si te deja elegir permisos, marca solo la lectura de registros (analytics logs read).',
        ['En el archivo de claves, pégalo detrás de ', h('code', {}, 'SUPABASE_ACCESS_TOKEN='), '. Guarda.'],
      ], 'Sirve para contar cuántas veces se abre la app y la web cada hora. Solo se usa para leer registros.'),
      credencial('GitHub', true, [
        a.credenciales.github === 'gh' ? 'Se usa el programa gh, que ya tiene tu sesión iniciada en este PC.' : 'En modo demostración se usan datos simulados.',
        'Las descargas del APK se leen de RWAdar-downloads, que es público: no necesita clave.',
      ])),
  );
}

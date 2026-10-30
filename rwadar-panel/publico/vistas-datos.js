/* RWAdar · panel · vistas de datos: tráfico web, app y cuentas. */
import { api, h, poner, kpi, segmentos, numero, fecha, haceCuanto, etiquetaEstado, bloqueError, confirmar, tostada } from './util.js';
import { lineas, columnas, barras, SERIE_1, SERIE_2 } from './graficos.js';
import { puntosTrafico, SERIES_TRAFICO } from './vistas.js';

const PERIODOS = [['24h', '24 horas'], ['7d', '7 días'], ['30d', '30 días']];
let periodo = '7d';

/* ---------- Velocidad real ---------- */
const NOTA_VELOCIDAD = { ok: 'Bien', aviso: 'Mejorable', fallo: 'Lenta', 'sin-datos': 'Sin datos' };
const segundos = ms => ms === null ? '—' : ms < 1000 ? `${numero(ms)} ms` : `${numero(Math.round(ms / 100) / 10)} s`;
const METRICAS_VELOCIDAD = [
  ['lcp', 'Se ve lo principal', segundos, 'Bien si tarda menos de 2,5 s'],
  ['inp', 'Reacciona al tocar', segundos, 'Bien si tarda menos de 200 ms'],
  ['cls', 'No salta al cargar', v => v === null ? '—' : numero(v), 'Bien si se queda por debajo de 0,1'],
];

function columnaVelocidad(nombre, a, minimo) {
  const pocas = a.muestras < minimo;
  return h('div', { class: 'velocidad-col' },
    h('div', { class: 'velocidad-cab' }, h('strong', {}, nombre), h('span', { class: 'nota' }, `${numero(a.muestras)} visitas medidas${pocas ? ' · pocas: orientativo' : ''}`)),
    ...METRICAS_VELOCIDAD.map(([clave, texto, formato, meta]) => {
      /* Con pocas visitas no se da nota: un solo visitante lento lo estropea todo. */
      const estado = pocas ? 'sin-datos' : a.notas[clave];
      return h('div', { class: 'metrica' },
        h('div', {}, h('div', {}, texto), h('div', { class: 'nota' }, meta)),
        h('span', { class: 'metrica-valor num' }, formato(a[clave])),
        etiquetaEstado(estado, pocas && a[clave] !== null ? 'Sin nota' : NOTA_VELOCIDAD[estado]));
    }),
    h('div', { class: 'metrica' }, h('div', {}, h('div', {}, 'Carga completa'), h('div', { class: 'nota' }, 'La visita típica (la mitad tarda menos)')),
      h('span', { class: 'metrica-valor num' }, segundos(a.cargaMediana)), h('span', {})));
}

function tarjetaVelocidad(v) {
  const cab = h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Velocidad real · últimos 7 días'),
    h('span', { class: 'nota' }, 'Lo que tarda a la gente de verdad: 3 de cada 4 visitas van igual o más rápido'));
  if (v.status === 'rejected') return h('section', { class: 'tarjeta' }, cab, bloqueError(v.reason));
  const d = v.value;
  return h('section', { class: 'tarjeta' }, cab, h('div', { class: 'rejilla dos velocidad' },
    columnaVelocidad('En el móvil', d.movil, d.minimoMuestras), columnaVelocidad('En el ordenador', d.ordenador, d.minimoMuestras)));
}

const porcentaje = (parte, total) => total ? `${Math.round((parte / total) * 100)} %` : '0 %';
/* La ruta la escribe quien visita: «/ofertas/%zz» no se puede descodificar y no debe tumbar la sección. */
const ficha = ruta => {
  const trozo = ruta.split('/').filter(Boolean)[1] || ruta;
  try { return decodeURIComponent(trozo).replace(/[-_]/g, ' '); } catch { return trozo; }
};

export async function trafico(raiz, recargar) {
  const cambiar = valor => { periodo = valor; recargar(); };
  const cabecera = h('div', { class: 'filtros' }, segmentos(PERIODOS, periodo, cambiar),
    h('span', { class: 'nota' }, 'Sin bots · sin cookies · «visita» es una llegada desde fuera, no una persona'));
  const [traf, velocidad] = await Promise.allSettled([api(`/api/trafico?periodo=${periodo}`), api('/api/velocidad')]);
  if (traf.status === 'rejected') { poner(raiz, cabecera, bloqueError(traf.reason), tarjetaVelocidad(velocidad)); return; }
  const t = traf.value;
  const total = t.flujo.secciones.reduce((s, x) => s + x.paginas, 0);
  poner(raiz, 
    cabecera,
    /* Cloudflare guarda las visitas de hace más de una semana solo como muestra. */
    t.estimado ? h('div', { class: 'falta-clave' }, `Cifras aproximadas: de lo que pasó hace más de 7 días, Cloudflare solo guarda una muestra (1 de cada 10 visitas). El panel apunta cada día las visitas exactas, así que esto se irá corrigiendo solo: ahora ${t.diasExactos ?? 0} de ${t.serie.length} días son exactos.`) : null,
    h('div', { class: 'rejilla kpis' },
      kpi(t.estimado ? 'Visitas (aprox.)' : 'Visitas', numero(t.visitas), `${fecha(t.desde, { hora: t.porHora })} – ${fecha(t.hasta, { hora: t.porHora })}`),
      kpi('Páginas vistas', numero(t.paginasVistas)),
      kpi('Páginas por visita', numero(t.paginasPorVisita), 'Cuánto se mueve cada visita'),
      kpi('Llegan de fuera', numero(t.procedencia.filter(p => p.nombre !== 'Directo o sin dato').reduce((s, p) => s + p.visitas, 0)), 'Visitas con web de procedencia')),
    h('section', { class: 'tarjeta' }, h('h2', {}, t.porHora ? 'Visitas por hora' : 'Visitas por día'), lineas(puntosTrafico(t), SERIES_TRAFICO)),
    tarjetaVelocidad(velocidad),
    h('section', { class: 'tarjeta' },
      h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Por dónde se mueve la gente'), h('span', { class: 'nota' }, 'Páginas vistas por sección de la web')),
      t.flujo.secciones.length ? h('div', { class: 'flujo' }, ...t.flujo.secciones.map(s => h('div', { class: 'flujo-paso' },
        h('div', { class: 'nombre' }, s.nombre), h('div', { class: 'cifra' }, numero(s.paginas)),
        h('div', { class: 'parte' }, `${porcentaje(s.paginas, total)} de lo visto`),
        h('span', { class: 'relleno', style: `width:${total ? (s.paginas / total) * 100 : 0}%` })))) : h('p', { class: 'vacio' }, 'Sin datos en este periodo.')),
    h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Fichas más vistas'),
        barras(t.flujo.fichas.map(f => ({ nombre: `${f.tipo} · ${ficha(f.nombre)}`, valor: f.paginas })), { unidad: 'páginas vistas' })),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Páginas más vistas'),
        barras(t.paginas.slice(0, 10).map(p => ({ nombre: p.nombre, valor: p.paginas })), { unidad: 'páginas vistas', color: SERIE_2 }))),
    h('div', { class: 'rejilla tres' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'De dónde llegan'), barras(t.procedencia.map(p => ({ nombre: p.nombre, valor: p.visitas })), { unidad: 'visitas' })),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Países'), barras(t.paises.map(p => ({ nombre: p.nombre, valor: p.visitas })), { unidad: 'visitas' })),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Dispositivos'), barras(t.dispositivos.map(p => ({ nombre: { desktop: 'Ordenador', mobile: 'Móvil', tablet: 'Tableta' }[p.nombre] || p.nombre, valor: p.visitas })), { unidad: 'visitas' }))),
    h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Navegadores'), barras(t.navegadores.map(p => ({ nombre: p.nombre, valor: p.visitas })), { unidad: 'visitas' })),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Sistemas'), barras(t.sistemas.map(p => ({ nombre: p.nombre, valor: p.visitas })), { unidad: 'visitas' }))),
  );
}

const horaCorta = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
const diaCorto = f => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
const SERIE_3 = '#d19a2a';
const SERIES_USO = [{ clave: 'app', nombre: 'Desde la app', color: SERIE_1 }, { clave: 'web', nombre: 'Desde la web', color: SERIE_2 },
  { clave: 'pasarela', nombre: 'Por la pasarela (app o web)', color: SERIE_3 }];
/* Todas las cargas del catálogo, se sepa o no de dónde vienen. */
export const cargasTotales = u => (u.app || 0) + (u.web || 0) + (u.pasarela || 0);
const NOTA_PASARELA = 'Desde la versión 1.4.1 la web (y la app) piden el catálogo a través de rwadar.pages.dev, y Supabase ya no ve si es la app o la web: esas cargas salen juntas como «pasarela». Para volver a separarlas hay que tocar esa pasarela de la web.';

function seccionUso(uso) {
  if (uso.error) {
    return h('section', { class: 'tarjeta' }, h('h2', {}, 'Uso de la app · últimas 24 horas'),
      bloqueError({ message: uso.error, codigo: uso.codigo }),
      h('p', { class: 'nota', style: 'margin-top:10px' }, 'Se mide contando en los registros de Supabase las veces que la app y la web cargan el catálogo. No hace falta cambiar la app.'));
  }
  const u = uso.datos;
  const puntos = u.serie.map(f => ({ etiqueta: fecha(f.hora), corta: horaCorta(f.hora), valores: { app: f.app, web: f.web, pasarela: f.pasarela || 0 } }));
  return h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Veces que se abre el catálogo · por hora'), h('span', { class: 'nota' }, 'Últimas 24 horas, según los registros de Supabase')),
    /* Supabase no contestó: se enseña lo apuntado cada hora y se avisa. */
    u.desdeHistorial ? h('div', { class: 'falta-clave', style: 'margin-bottom:12px' }, `Supabase no ha contestado ahora: estas cifras son las que el panel apuntó (${u.horasApuntadas} de 24 horas). Se pondrán al día solas.`) : null,
    lineas(puntos, SERIES_USO),
    u.pasarela ? h('p', { class: 'nota', style: 'margin-top:10px' }, NOTA_PASARELA) : null);
}

function seccionHistorial(historial) {
  if (!historial) return null;
  const uso = historial.usoPorDia.map(d => ({ etiqueta: fecha(d.fecha, { hora: false }) + (d.horasApuntadas && d.horasApuntadas < 24 ? ` (${d.horasApuntadas} h apuntadas)` : d.app === null ? ' (sin apuntar)' : ''), corta: diaCorto(d.fecha), valor: cargasTotales(d) }));
  const descargas = historial.descargasPorDia.map(d => ({ etiqueta: fecha(d.fecha, { hora: false }) + (d.nuevas === null ? ' (sin apuntar)' : ''), corta: diaCorto(d.fecha), valor: d.nuevas || 0 }));
  const aviso = 'El panel lo va apuntando cada vez que se abre; el de la nube, además, cada hora. Los días sin apunte salen a cero.';
  return h('div', { class: 'rejilla dos' },
    h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Cargas del catálogo (app y web) · por día'), h('span', { class: 'nota' }, `${historial.diasConUso} días con datos`)),
      historial.diasConUso ? columnas(uso, { nombre: 'Cargas del catálogo' }) : h('p', { class: 'vacio' }, 'Todavía no hay días apuntados.'), h('p', { class: 'nota' }, aviso)),
    h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Descargas del APK · por día'), h('span', { class: 'nota' }, `${historial.diasConDescargas} días con datos`)),
      historial.diasConDescargas ? columnas(descargas, { nombre: 'Descargas', color: SERIE_2 }) : h('p', { class: 'vacio' }, 'Hacen falta dos días apuntados seguidos para saber las descargas de un día.'), h('p', { class: 'nota' }, aviso)));
}

export async function app(raiz) {
  const [datosApp, cuentas] = await Promise.allSettled([api('/api/app'), api('/api/cuentas')]);
  if (datosApp.status === 'rejected') { poner(raiz, bloqueError(datosApp.reason)); return; }
  const { descargas, uso, historial } = datosApp.value;
  const d = descargas.datos;
  const u = uso.datos;
  const c = cuentas.status === 'fulfilled' ? cuentas.value.resumen : null;
  poner(raiz,
    h('div', { class: 'rejilla kpis' },
      kpi('Cargas del catálogo · 24 h', u ? numero(cargasTotales(u)) : '—',
        u ? `${numero(u.app)} app · ${numero(u.web)} web${u.pasarela ? ` · ${numero(u.pasarela)} sin distinguir` : ''}` : 'Falta la clave de registros'),
      kpi('Descargas del APK', d ? numero(d.totalApk) : '—', d?.ultima ? `Última: ${d.ultima.version} (${numero(d.ultima.descargasApk)})` : null),
      c ? kpi('Cuentas (web y app)', numero(c.total), `${numero(c.activas30d)} activas en 30 días`) : kpi('Cuentas (web y app)', '—', 'Falta la clave de Supabase')),
    seccionUso(uso),
    seccionHistorial(historial),
    descargas.error ? bloqueError({ message: descargas.error }) : h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Descargas por versión'), h('a', { href: 'https://github.com/victorJorques/RWAdar-downloads/releases', target: '_blank', rel: 'noopener noreferrer', class: 'nota' }, 'Abrir en GitHub')),
        barras(d.versiones.filter(v => !v.previa).map(v => ({ nombre: v.version, valor: v.descargasApk, extra: fecha(v.publicada, { hora: false }) })), { unidad: 'descargas' })),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Todas las versiones'), h('div', { class: 'tabla-caja' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Versión'), h('th', {}, 'Publicada'), h('th', {}, 'Descargas'))),
        h('tbody', {}, ...d.versiones.map(v => h('tr', {},
          h('td', {}, h('a', { href: v.url, target: '_blank', rel: 'noopener noreferrer' }, v.version), v.previa ? h('span', { class: 'tenue' }, ' · prueba') : v === d.ultima ? h('span', { class: 'tenue' }, ' · última') : null),
          h('td', { class: 'tenue' }, fecha(v.publicada, { hora: false })),
          h('td', { class: 'num' }, v.tieneApk ? numero(v.descargasApk) : 'sin APK')))))))),
    h('section', { class: 'tarjeta' }, h('h2', {}, 'Qué significan estas cifras'),
      h('p', { class: 'nota' }, 'Una «apertura» es cada vez que la app (o la web) carga el catálogo; quien la abre tres veces cuenta tres. No se sabe quién es ni se guarda ninguna dirección. Una descarga del APK no es una instalación: cuentan también nuestras pruebas y las descargas repetidas. Las cuentas son las mismas en la web y en la app.')),
  );
}

/* ---------- Cuentas ---------- */
const filtro = { texto: '', tipo: 'todas' };
const FILTROS = [['todas', 'Todas'], ['sin-confirmar', 'Sin confirmar'], ['bloqueadas', 'Bloqueadas'], ['nuevas', 'Nuevas (7 días)']];

function pasaFiltro(c) {
  const t = filtro.texto.toLowerCase();
  if (t && !`${c.correo} ${c.nombre || ''}`.toLowerCase().includes(t)) return false;
  if (filtro.tipo === 'sin-confirmar') return !c.confirmada;
  if (filtro.tipo === 'bloqueadas') return Boolean(c.bloqueadaHasta);
  if (filtro.tipo === 'nuevas') return Date.now() - new Date(c.creada).getTime() < 7 * 86400000;
  return true;
}

function celdaCsv(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // que Excel no lo ejecute como fórmula
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportarCsv(cuentas) {
  const filas = [['correo', 'nombre', 'alta', 'ultima_entrada', 'confirmada', 'bloqueada', 'vigiladas'],
    ...cuentas.map(c => [c.correo, c.nombre, c.creada, c.ultimaEntrada, c.confirmada ? 'si' : 'no', c.bloqueadaHasta ? 'si' : 'no', c.vigiladas])];
  const blob = new Blob(['﻿' + filas.map(f => f.map(celdaCsv).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `rwadar-cuentas-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function accionesCuenta(c, recargar) {
  const hecho = mensaje => r => { if (r) { tostada(mensaje); recargar(); } };
  return h('td', { class: 'acciones' },
    c.confirmada ? null : h('button', { class: 'boton texto pequeno', onclick: () => confirmar({
      titulo: 'Confirmar el correo a mano', texto: [`${c.correo} podrá entrar sin pulsar el enlace del correo de alta. Hazlo solo si sabes que el correo es suyo.`],
      aceptar: 'Confirmar', esperando: 'Confirmando…',
      accion: () => api(`/api/cuentas/${c.id}/confirmar`, { metodo: 'POST', cuerpo: {} }),
    }).then(hecho('Cuenta confirmada.')) }, 'Confirmar'),
    h('button', { class: 'boton texto pequeno', onclick: () => confirmar({
      titulo: c.bloqueadaHasta ? 'Desbloquear la cuenta' : 'Bloquear la cuenta',
      texto: [c.bloqueadaHasta ? `${c.correo} podrá volver a entrar.` : `${c.correo} no podrá entrar ni renovar su sesión hasta que la desbloquees. No se borra nada.`],
      aceptar: c.bloqueadaHasta ? 'Desbloquear' : 'Bloquear', peligro: !c.bloqueadaHasta, esperando: 'Guardando…',
      accion: () => api(`/api/cuentas/${c.id}/bloquear`, { metodo: 'POST', cuerpo: { bloquear: !c.bloqueadaHasta } }),
    }).then(hecho(c.bloqueadaHasta ? 'Cuenta desbloqueada.' : 'Cuenta bloqueada.')) }, c.bloqueadaHasta ? 'Desbloquear' : 'Bloquear'),
    h('button', { class: 'boton texto pequeno peligro-texto', onclick: () => confirmar({
      titulo: '¿Borrar esta cuenta para siempre?',
      texto: [`Se borran la cuenta, su perfil, su lista de vigilancia y sus avisos. No se puede deshacer.`, h('strong', {}, c.correo)],
      campos: [{ nombre: 'confirmacion', etiqueta: 'Escribe el correo de la cuenta para confirmar' }],
      aceptar: 'Borrar la cuenta', peligro: true, esperando: 'Borrando…',
      accion: v => {
        if (v.confirmacion.toLowerCase() !== c.correo.toLowerCase()) throw new Error('El correo no coincide');
        return api(`/api/cuentas/${c.id}/borrar`, { metodo: 'POST', cuerpo: v });
      },
    }).then(hecho('Cuenta borrada.')) }, 'Borrar'));
}

function estadoCuenta(c) {
  if (c.bloqueadaHasta) return etiquetaEstado('fallo', 'Bloqueada');
  return c.confirmada ? etiquetaEstado('ok', 'Confirmada') : etiquetaEstado('aviso', 'Sin confirmar');
}

/* ---------- Correos de las cuentas ---------- */
const minutos = m => m === null ? '—' : m < 60 ? `${numero(m)} min` : m < 2880 ? `${numero(Math.round(m / 60))} h` : `${numero(Math.round(m / 1440))} días`;

function tarjetaCorreos(c) {
  const cab = h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Correos de alta y de contraseña'), h('span', { class: 'nota' }, '¿Salen y llegan?'));
  if (c.status === 'rejected') return h('section', { class: 'tarjeta' }, cab, bloqueError(c.reason));
  const { cuentas: cu, registros: reg, remitente: rem } = c.value;
  const r = rem.datos;
  const d = cu.datos;
  const g = reg.datos;
  const parte = x => x.error ? h('div', { class: 'falta-clave' }, x.codigo === 'falta-credencial' ? x.error.replace(' Mira la pestaña Ajustes.', '') : `No pude leerlo: ${x.error}`) : null;
  return h('section', { class: 'tarjeta' }, cab,
    r ? h('p', { class: 'remitente' }, 'Salen de ', h('strong', {}, r.servidor), r.nombre ? [' como «', h('strong', {}, r.nombre), '»'] : null,
      r.limiteHora ? ` · hasta ${numero(r.limiteHora)} por hora` : '', r.confirmacionObligatoria ? ' · hay que confirmar el correo para entrar' : ' · se entra sin confirmar el correo',
      r.altasAbiertas ? '' : ' · las altas están cerradas') : parte(rem),
    d ? h('div', { class: 'mini-cifras' },
      h('div', {}, h('span', {}, 'Altas · 30 días'), h('strong', { class: 'num' }, numero(d.altas30d))),
      h('div', {}, h('span', {}, 'Confirmadas'), h('strong', { class: 'num' }, numero(d.confirmadas30d))),
      h('div', { class: d.sinConfirmar24h ? 'aviso' : '' }, h('span', {}, 'Altas de esta semana sin confirmar tras 1 día'), h('strong', { class: 'num' }, numero(d.sinConfirmar24h))),
      h('div', {}, h('span', {}, 'Tardan en confirmar'), h('strong', { class: 'num' }, minutos(d.minutosHastaConfirmar))),
      h('div', {}, h('span', {}, 'Recuperar contraseña · 30 días'), h('strong', { class: 'num' }, numero(d.recuperaciones30d))),
      h('div', {}, h('span', {}, 'Último correo enviado'), h('strong', {}, haceCuanto(d.ultimoEnviado)))) : parte(cu),
    g ? h('p', { class: 'nota' }, `Últimas 24 horas: ${numero(g.altas)} altas · ${numero(g.reenvios)} reenvíos · ${numero(g.recuperaciones)} recuperaciones · `,
      h('strong', { class: g.errores ? 'texto-fallo' : '' }, `${numero(g.errores)} errores`), g.frenadas ? ` · ${numero(g.frenadas)} frenados por el límite por hora` : '') : parte(reg),
    g?.ultimosErrores.length ? h('ul', { class: 'lista-errores' }, ...g.ultimosErrores.map(e => h('li', {}, h('span', { class: 'num' }, `${numero(e.veces)}×`), ' ', e.mensaje))) : null,
    h('p', { class: 'nota' }, 'Si alguien no confirma en un día, lo normal es que el correo no le llegara o acabara en spam. Las direcciones no salen aquí.'));
}

export async function cuentas(raiz, recargar) {
  const [lista, correos] = await Promise.allSettled([api('/api/cuentas'), api('/api/correos')]);
  if (lista.status === 'rejected') { poner(raiz, bloqueError(lista.reason), tarjetaCorreos(correos)); return; }
  const datos = lista.value;
  const r = datos.resumen;
  const cuerpoTabla = h('tbody', {});
  const contador = h('span', { class: 'nota' });
  const pintar = () => {
    const visibles = datos.cuentas.filter(pasaFiltro);
    contador.textContent = `${numero(visibles.length)} de ${numero(datos.cuentas.length)}`;
    cuerpoTabla.replaceChildren(...(visibles.length ? visibles.map(c => h('tr', {},
      h('td', {}, h('div', { class: 'correo' }, c.correo), c.nombre ? h('div', { class: 'tenue' }, c.nombre) : null),
      h('td', { class: 'tenue', 'data-etiqueta': 'Alta' }, fecha(c.creada)),
      h('td', { class: 'tenue', 'data-etiqueta': 'Última entrada' }, c.ultimaEntrada ? haceCuanto(c.ultimaEntrada) : 'nunca'),
      h('td', {}, estadoCuenta(c)),
      datos.perfilesLeidos ? h('td', { class: 'num', 'data-etiqueta': 'Vigila' }, numero(c.vigiladas)) : null,
      accionesCuenta(c, recargar))) : [h('tr', {}, h('td', { colspan: 6, class: 'vacio' }, 'Ninguna cuenta coincide.'))]));
  };
  const botonesFiltro = FILTROS.map(([valor, texto]) => h('button', { type: 'button', 'aria-pressed': String(filtro.tipo === valor), onclick: ev => {
    filtro.tipo = valor;
    botonesFiltro.forEach(b => b.setAttribute('aria-pressed', String(b === ev.currentTarget)));
    pintar();
  } }, texto));
  const buscador = h('input', { class: 'buscador', type: 'search', placeholder: 'Buscar por correo o nombre', value: filtro.texto, 'aria-label': 'Buscar cuentas',
    oninput: ev => { filtro.texto = ev.target.value; pintar(); } });
  pintar();
  const altas = r.altasPorDia.map(d => {
    const dia = new Date(`${d.fecha}T12:00:00Z`);
    return { etiqueta: fecha(dia, { hora: false }), corta: dia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), valor: d.altas };
  });
  poner(raiz, 
    h('div', { class: 'rejilla kpis' },
      kpi('Cuentas', numero(r.total)), kpi('Confirmadas', numero(r.confirmadas), `${numero(r.sinConfirmar)} sin confirmar`),
      kpi('Nuevas · 7 días', numero(r.nuevas7d), `${numero(r.nuevas30d)} en 30 días`), kpi('Activas · 30 días', numero(r.activas30d), 'Han entrado este mes'),
      kpi('Bloqueadas', numero(r.bloqueadas))),
    h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Altas por día · últimos 30 días'), columnas(altas, { nombre: 'Altas' })),
      tarjetaCorreos(correos)),
    h('section', { class: 'tarjeta' },
      h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Todas las cuentas'), contador),
      h('div', { class: 'filtros' }, buscador, h('div', { class: 'segmentos', role: 'group', 'aria-label': 'Filtrar' }, ...botonesFiltro),
        h('button', { class: 'boton secundario', onclick: () => exportarCsv(datos.cuentas.filter(pasaFiltro)) }, 'Descargar CSV')),
      h('div', { class: 'tabla-caja caja-cuentas' }, h('table', { class: 'tabla-cuentas' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Cuenta'), h('th', {}, 'Alta'), h('th', {}, 'Última entrada'), h('th', {}, 'Estado'), datos.perfilesLeidos ? h('th', {}, 'Vigila') : null, h('th', {}, ''))),
        cuerpoTabla)),
      datos.perfilesLeidos ? null : h('p', { class: 'nota', style: 'margin-top:10px' }, 'La base protege los nombres y las listas de vigilancia de cada cuenta, así que aquí solo sale el correo. Borrar, bloquear y confirmar funcionan igual.')),
  );
}

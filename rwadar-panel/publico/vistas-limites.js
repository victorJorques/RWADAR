/* RWAdar · panel · límites y fechas: lo que caduca y lo que queda de
   cada plan gratis. */
import { api, h, poner, numero, fecha, etiquetaEstado, bloqueError } from './util.js';
import { columnas } from './graficos.js';

const NOTA_FECHA = { ok: 'Bien', aviso: 'Pronto', fallo: 'Caducado', 'sin-datos': 'Sin datos' };
const NO_VALE = 'No vale';

const dias = n => `${numero(n)} ${n === 1 ? 'día' : 'días'}`;

function cuandoCaduca(f) {
  if (f.diasRestantes === null) return { ok: 'No caduca', fallo: 'Ya no vale', 'sin-datos': 'No se pudo comprobar' }[f.estado] || '—';
  if (f.diasRestantes < 0) return `Caducó hace ${dias(-f.diasRestantes)} (${fecha(f.fecha, { hora: false })})`;
  if (f.diasRestantes === 0) return `Caduca hoy (${fecha(f.fecha, { hora: false })})`;
  return `Quedan ${dias(f.diasRestantes)} · ${fecha(f.fecha, { hora: false })}`;
}

function tarjetaFechas(r) {
  const cab = h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Fechas que caducan'), h('span', { class: 'nota' }, 'Avisa 14 días antes (el catálogo, que se renueva cada semana, 2)'));
  if (r.error) return h('section', { class: 'tarjeta' }, cab, bloqueError({ message: r.error, codigo: r.codigo }));
  return h('section', { class: 'tarjeta' }, cab, h('div', { class: 'lista-fechas' }, ...r.datos.map(f => h('div', { class: `fecha-fila ${f.estado}` },
    etiquetaEstado(f.estado, f.estado === 'fallo' && f.diasRestantes === null ? NO_VALE : NOTA_FECHA[f.estado]),
    h('div', {}, h('strong', {}, f.nombre), h('div', { class: 'nota' }, cuandoCaduca(f))),
    f.estado === 'ok' && f.diasRestantes === null ? null : h('p', { class: 'que-hacer' }, f.que)))));
}

/* Barra de cuánto se ha gastado. Lo muy pequeño se ve igual como una raya. */
function medidor(m) {
  const ancho = m.limite ? Math.min(100, Math.max(m.usado > 0 ? 1.5 : 0, (m.usado / m.limite) * 100)) : 0;
  return h('div', { class: `medidor ${m.estado}` },
    h('div', { class: 'medidor-cab' }, h('span', {}, m.nombre),
      h('span', { class: 'num' }, `${m.aproximado ? '≈ ' : ''}${numero(m.usado)} de ${numero(m.limite)}`, h('span', { class: 'tenue' }, ` · ${numero(m.porcentaje)} %`))),
    h('div', { class: 'medidor-pista', role: 'img', 'aria-label': `${numero(m.porcentaje)} % gastado` }, h('span', { style: `width:${ancho}%` })),
    m.detalle || m.reinicia ? h('p', { class: 'nota' }, [m.detalle, m.reinicia ? `Vuelve a cero ${m.reinicia}.` : null].filter(Boolean).join(' · ')) : null);
}

function detalleSupabase(s) {
  const pausa = s.pausaEstado;
  const dias = s.porDia.map(d => {
    const dia = new Date(`${d.fecha}T12:00:00Z`);
    return { etiqueta: fecha(dia, { hora: false }), corta: dia.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), valor: d.peticiones };
  });
  return [
    h('div', { class: 'mini-cifras' },
      h('div', { class: s.serviciosSanos === false ? 'fallo' : '' }, h('span', {}, 'Proyecto'), h('strong', {}, s.serviciosSanos === false ? `Con problemas: ${s.serviciosConProblemas.join(', ')}` : s.serviciosSanos ? 'Sano' : 'Sin dato')),
      h('div', { class: pausa === 'ok' ? '' : pausa }, h('span', {}, 'Último uso'), h('strong', {}, s.ultimoUso ? (s.diasSinUso === 0 ? 'Hoy' : `Hace ${numero(s.diasSinUso)} días`) : 'Sin dato')),
      h('div', {}, h('span', {}, 'Peticiones · 7 días'), h('strong', { class: 'num' }, numero(s.peticiones7d)))),
    dias.length ? columnas(dias, { nombre: 'Peticiones' }) : null,
  ];
}

function tarjetaServicio(s) {
  const cab = h('div', { class: 'tarjeta-cab' }, h('h2', {}, s.servicio), s.plan ? h('span', { class: 'plan' }, `Plan ${s.plan.toLowerCase()}`) : null);
  if (s.error) return h('section', { class: 'tarjeta' }, cab, bloqueError({ message: s.error, codigo: s.codigo }));
  return h('section', { class: 'tarjeta' }, cab,
    s.servicio === 'Supabase' ? detalleSupabase(s) : null,
    h('div', { class: 'medidores' }, ...(s.medidores || []).map(medidor)),
    s.notas?.length ? h('ul', { class: 'notas' }, ...s.notas.map(n => h('li', {}, n))) : null);
}

export async function limites(raiz) {
  const d = await api('/api/limites');
  const servicios = d.planes.datos?.servicios || [];
  poner(raiz, 
    tarjetaFechas(d.fechas),
    d.planes.error ? bloqueError({ message: d.planes.error, codigo: d.planes.codigo }) : h('div', { class: 'rejilla dos' }, ...servicios.map(tarjetaServicio)),
    h('p', { class: 'nota' }, 'Topes de los planes gratis comprobados el 23 de octubre de 2026. Lo gastado se vuelve a leer cada 10 minutos.'),
  );
}

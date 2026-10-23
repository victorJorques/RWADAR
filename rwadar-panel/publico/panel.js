/* RWAdar · panel · arranque y navegación entre secciones.
   La sección vive en la dirección (#cuentas…) para que «Actualizar» y
   volver atrás del navegador funcionen como se espera. */
import { api, h, bloqueError, haceCuanto, sesion } from './util.js';
import * as control from './vistas.js';
import * as datos from './vistas-datos.js';

const REFRESCO_MS = 2 * 60 * 1000;
const VISTAS = {
  resumen: ['Resumen', 'Cómo está todo de un vistazo.', control.resumen],
  interruptores: ['Interruptores', 'Si la web está encendida y si el catálogo se ve.', control.interruptores],
  salud: ['Salud', 'Qué funciona, qué no y qué hacer.', control.salud],
  trafico: ['Tráfico web', 'Visitas de rwadar.pages.dev según Cloudflare Web Analytics.', datos.trafico],
  app: ['App', 'Descargas de la app Android y lo que se puede saber de ella.', datos.app],
  cuentas: ['Cuentas', 'Las cuentas creadas en la web y en la app, y qué hacer con ellas.', datos.cuentas],
  registro: ['Registro', 'Todo lo que se ha cambiado desde este panel.', control.registro],
  ajustes: ['Ajustes', 'Las claves que necesita el panel y cómo conseguirlas.', control.ajustes],
};

const vista = document.getElementById('vista');
const titulo = document.getElementById('titulo');
const subtitulo = document.getElementById('subtitulo');
const actualizado = document.getElementById('actualizado');
const puntoSalud = document.getElementById('punto-salud');
let ultimaCarga = null;
let cargando = 0;

function actual() {
  const nombre = location.hash.slice(1);
  return VISTAS[nombre] ? nombre : 'resumen';
}

async function pintar(opciones = {}) {
  const nombre = actual();
  const [t, sub, fn] = VISTAS[nombre];
  const turno = ++cargando;
  titulo.textContent = t;
  subtitulo.textContent = sub;
  document.title = `${t} · RWAdar`;
  for (const a of document.querySelectorAll('#menu a')) {
    if (a.dataset.vista !== nombre) { a.removeAttribute('aria-current'); continue; }
    a.setAttribute('aria-current', 'page');
    if (window.innerWidth <= 860) a.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (!opciones.silencioso) vista.replaceChildren(h('p', { class: 'cargando' }, 'Cargando…'));
  const destino = h('div', { class: 'vista' });
  try {
    const global = await fn(destino, otras => pintar(otras || {}), opciones);
    if (turno !== cargando) return; // el usuario ya cambió de sección
    if (global) puntoSalud.className = `punto ${global}`;
    vista.replaceChildren(...destino.childNodes);
  } catch (e) {
    if (turno !== cargando) return;
    vista.replaceChildren(bloqueError(e));
  }
  ultimaCarga = new Date();
  actualizado.textContent = 'Actualizado ahora mismo';
}

async function arrancar() {
  try {
    const a = await api('/api/ajustes');
    sesion.ajustes = a;
    document.getElementById('aviso-demo').hidden = !a.modoDemo;
    const faltan = [!a.credenciales.cloudflare && 'Cloudflare', !a.credenciales.supabase && 'Supabase'].filter(Boolean);
    document.getElementById('lateral-pie').replaceChildren(
      h('span', {}, a.modoDemo ? 'Modo demostración' : a.modo === 'nube' ? 'Panel compartido' : 'Panel de este ordenador'),
      a.modo === 'nube' ? h('span', { class: 'correo' }, a.quien) : null,
      h('span', {}, faltan.length ? `Falta la clave de ${faltan.join(' y ')}` : 'Todas las claves configuradas'));
  } catch (e) {
    vista.replaceChildren(bloqueError(e));
    return;
  }
  /* El punto de salud del menú se rellena aunque no se abra esa sección. */
  api('/api/salud').then(s => { puntoSalud.className = `punto ${s.global}`; }).catch(() => {});
  pintar();
}

window.addEventListener('hashchange', () => { window.scrollTo(0, 0); pintar(); });
document.getElementById('recargar').addEventListener('click', () => pintar({ fresco: true }));
setInterval(() => {
  if (ultimaCarga) actualizado.textContent = `Actualizado ${haceCuanto(ultimaCarga.toISOString())}`;
}, 30000);
setInterval(() => {
  if (document.hidden || document.getElementById('dialogo').open) return;
  /* Todas las secciones se refrescan solas, salvo mientras se escribe. */
  if (document.activeElement?.matches('input, textarea')) return;
  pintar({ silencioso: true });
}, REFRESCO_MS);

arrancar();

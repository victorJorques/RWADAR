/* RWAdar · panel · la puerta del enlace personal.
   Lee la llave que va detrás de «#», la borra de la barra de direcciones
   (para que no quede en el historial ni se comparta al copiar la
   dirección) y la cambia por una sesión. Luego entra al panel. */
const titulo = document.getElementById('puerta-titulo');
const texto = document.getElementById('puerta-texto');
const llave = decodeURIComponent(location.hash.slice(1));
history.replaceState(null, '', '/entrar');

function aviso(t, mensaje) {
  titulo.textContent = t;
  texto.textContent = mensaje;
  document.querySelector('.radar')?.classList.add('quieto');
}

async function entrar() {
  if (!llave) {
    aviso('Hace falta tu enlace', 'Abre el enlace personal que te mandó Víctor por WhatsApp. Si ya entraste antes desde este móvil, prueba directamente la portada del panel.');
    return;
  }
  try {
    const res = await fetch('/api/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ llave }) });
    const datos = await res.json().catch(() => ({}));
    if (!res.ok || !datos.ok) { aviso('No se ha podido entrar', datos.error || 'Inténtalo otra vez en un momento.'); return; }
    titulo.textContent = `Hola, ${datos.datos.quien}`;
    location.replace('/');
  } catch {
    aviso('Sin conexión', 'No hay conexión con el panel. Comprueba internet y vuelve a abrir el enlace.');
  }
}

entrar();

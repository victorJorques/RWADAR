'use strict';
// Texto, fuentes y vigencia del mismo contrato que la app. Sin peticiones remotas.
(() => {
  const pagina=document.querySelector('main[data-oferta]');
  if (!pagina || !globalThis.RWAdarFichaEditorial) return;
  let oferta;
  try {oferta=JSON.parse(pagina.dataset.oferta);} catch {return;}
  function pintar() {
    const resumen=globalThis.RWAdarFichaEditorial.resumenOferta(oferta);
    for (const nombre of ['minimo','accesoEspana','salida','costes','estado']) {
      const nodo=pagina.querySelector('[data-campo="'+nombre+'"]');
      const campo=resumen[nombre];
      if (!nodo || !campo) continue;
      nodo.textContent=campo.texto;
      const referencias=Array.isArray(campo.referencias) && campo.referencias.length
        ? campo.referencias.map(r=>({fuente:r.fuente,consultadaEl:r.fechaConsulta,etiqueta:r.etiqueta}))
        : campo.fuente ? [campo] : [];
      for (const referencia of referencias) {
        const fuente=document.createElement('a'); fuente.href=referencia.fuente;
        fuente.target='_blank'; fuente.rel='noopener noreferrer';
        fuente.textContent=' · '+(referencia.etiqueta || 'Fuente')+
          (referencia.consultadaEl ? ' · consulta '+referencia.consultadaEl.split('-').reverse().join('/') : '')+' ↗';
        nodo.appendChild(fuente);
      }
    }
  }
  pintar();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) pintar();});
  window.setInterval(pintar,60000);
})();

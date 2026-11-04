'use strict';
// Texto, fuentes y vigencia del mismo contrato que la app. Sin peticiones remotas.
(() => {
  const pagina=document.querySelector('main[data-oferta]');
  if (!pagina || !globalThis.RWAdarFichaEditorial) return;
  let oferta;
  try {oferta=JSON.parse(pagina.dataset.oferta);} catch {return;}
  // La misma regla que rwadar-fichas.js y la web: /api/ o JSON = consulta técnica.
  const consultaTecnica=url=>{
    try {const u=new URL(String(url)); return /(?:^|\/)api(?:\/|$)/i.test(u.pathname) || /\.json$/i.test(u.pathname) ||
      /(?:^|&)(?:format|output)=json(?:&|$)/i.test(u.search.slice(1));} catch {return false;}
  };
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
        const fecha=referencia.consultadaEl ? referencia.consultadaEl.split('-').reverse().join('/') : '';
        const rotulo=globalThis.RWAdarFichaEditorial.rotuloReferencia(referencia.etiqueta);
        // Una API o una respuesta JSON no es una página para personas: no se enlaza (QA 04/11/2026, n.º 12).
        if (consultaTecnica(referencia.fuente)) {
          const tecnica=document.createElement('span'); tecnica.className='consulta-tecnica';
          tecnica.textContent=' · '+(rotulo ? rotulo+' · ' : '')+'Consulta técnica'+(fecha ? ' · '+fecha : '');
          nodo.appendChild(tecnica); continue;
        }
        const fuente=document.createElement('a'); fuente.href=referencia.fuente;
        fuente.target='_blank'; fuente.rel='noopener noreferrer';
        fuente.textContent=' · '+(rotulo || 'Fuente')+(fecha ? ' · consultada el '+fecha : '')+' ↗';
        nodo.appendChild(fuente);
      }
    }
    // Contratable y mínimo/salida: con la revisión vencida no se afirma nada sobre «hoy» (falla cerrado).
    for (const [campo,motivo] of [['contratable','Pendiente de volver a comprobar: la revisión semanal ha caducado.'],
      ['minimoSalida','Mínimo y salida por volver a comprobar: la revisión semanal ha caducado.']]) {
      const nodo=pagina.querySelector('[data-campo="'+campo+'"]'), fila=nodo && nodo.parentElement;
      const caduca=resumen.vencida===true || campo==='contratable' && !(resumen.accesoEspana && resumen.accesoEspana.estado==='si');
      if (!nodo || !fila || !fila.dataset || fila.dataset.cumple!=='si' || !caduca) continue;
      fila.dataset.cumple='no'; nodo.textContent=motivo;
      const marca=fila.querySelector && fila.querySelector('.comprobacion-marca');
      if (marca) marca.textContent='✗ No';
    }
    // Quinta comprobación de transparencia: revisada esta semana y sin fuentes en conflicto.
    const vigencia=pagina.querySelector('[data-campo="vigencia"]');
    if (vigencia) {
      const vigente=!resumen.vencida && oferta.estadoRevision==='actual';
      vigencia.textContent=vigente ? 'Sí: la revisión está vigente y las fuentes coinciden.' :
        'No: la revisión semanal ha caducado o no se pudo confirmar; consulta las condiciones en la fuente.';
      const fila=vigencia.parentElement, marca=fila && fila.querySelector('.comprobacion-marca');
      if (fila && fila.dataset) fila.dataset.cumple=vigente ? 'si' : 'no';
      if (marca) marca.textContent=vigente ? '✓ Sí' : '✗ No';
    }
  }
  pintar();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) pintar();});
  window.setInterval(pintar,60000);
})();

(function () {
  'use strict';
  const MAX = 2 * 1024 * 1024;
  function fallo(code, status) { const e = new Error(code === 'cartera_conflicto'
    ? 'El registro cambió en otro dispositivo. Vuelve a cargarlo antes de guardar.'
    : code === 'cancelada' ? 'La cuenta ha cambiado.' : 'No se pudo completar el registro. Tus datos no se han sobrescrito.'); e.code = code; e.status = status; return e; }
  function paraUsuario(uid, { vigente = () => true } = {}) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid || '')) throw fallo('sin_sesion',401);
    const modelo = window.RWAdarCarteraModelo;
    if (!modelo) throw fallo('cartera_no_disponible');
    let activa = true, pendiente = false;
    const abortos = new Set();
    function actual(signal) {
      if (!activa || !vigente() || signal?.aborted || window.RWADAR_ACCESO?.usuario()?.id !== uid
          || sessionStorage.getItem('rwadar.cierre.pendiente') === 'si') { activa = false; throw fallo('cancelada'); }
    }
    async function solicitar(method, body, opciones = {}) {
      actual(opciones.signal);
      if (pendiente) throw fallo('cartera_ocupada');
      pendiente = true;
      const abort = new AbortController(), cancelar = () => abort.abort(); abortos.add(abort);
      opciones.signal?.addEventListener?.('abort',cancelar,{once:true});
      let timer;
      try {
        return await Promise.race([
          (async () => {
            const user = await window.RWADAR_ACCESO.verificar(); actual(abort.signal);
            if (user.id !== uid) throw fallo('cancelada');
            const response = await fetch('/api/acceso/cartera', { method, credentials:'same-origin',cache:'no-store',redirect:'error',signal:abort.signal,
              headers:{'X-RWAdar-Usuario':uid,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}) });
            if (Number(response.headers.get('content-length'))>MAX) throw fallo('cartera_respuesta_invalida');
            const reader = response.body?.getReader(), partes = []; let size = 0, texto;
            if (reader) {
              try { while (true) { const {value,done}=await reader.read(); if(done)break; size+=value.byteLength;
                if(size>MAX){await reader.cancel();throw fallo('cartera_respuesta_invalida');} partes.push(value); } }
              finally { reader.releaseLock(); }
              const bytes=new Uint8Array(size); let offset=0; for(const p of partes){bytes.set(p,offset);offset+=p.byteLength;} texto=new TextDecoder().decode(bytes);
            } else { texto=await response.text(); if(new TextEncoder().encode(texto).length>MAX)throw fallo('cartera_respuesta_invalida'); }
            actual(abort.signal);
            if (!response.ok) throw fallo(response.status===409?'cartera_conflicto':response.status===401?'sin_sesion':'cartera_no_disponible',response.status);
            let data; try { data=JSON.parse(texto); } catch { throw fallo('cartera_respuesta_invalida'); }
            if(!Number.isSafeInteger(data?.version)||data.version<0||data.version>2147483647)throw fallo('cartera_respuesta_invalida');
            return {version:data.version,posiciones:modelo.deserializarCartera(modelo.serializarCartera(data.posiciones))};
          })(),
          new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(fallo('cartera_plazo'));},15000);}),
        ]);
      } finally {clearTimeout(timer);pendiente=false;abortos.delete(abort);opciones.signal?.removeEventListener?.('abort',cancelar);}
    }
    return { modelo,
      cargar(opciones={}) {return solicitar('GET',null,opciones);},
      async guardar(posiciones,version,opciones={}) {
        actual(opciones.signal);
        if(!Number.isSafeInteger(version)||version<0||version>=2147483647)throw fallo('cartera_version_invalida');
        const limpias=modelo.deserializarCartera(modelo.serializarCartera(posiciones));
        const body={posiciones:limpias,version};
        if(new TextEncoder().encode(JSON.stringify(body)).length>MAX)throw fallo('cartera_tamano');
        const result=await solicitar('POST',body,opciones);
        if(result.version!==version+1)throw fallo('cartera_respuesta_invalida');
        return result;
      },
      destruir(){activa=false;for(const abort of abortos)abort.abort();},
    };
  }
  window.RWAdarCarteraCuenta=Object.freeze({paraUsuario});
})();

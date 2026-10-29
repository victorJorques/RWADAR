(function (global) {
 'use strict';
 const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cantidad = (centimos, moneda) => centimos == null ? 'Sin valoración' :
  new Intl.NumberFormat('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}).format(centimos / 100) + ' ' + moneda;
 const fecha = value => value ? value.split('-').reverse().join('/') : 'Sin fecha';
 const dato = (label, value) => '<div><dt>'+esc(label)+'</dt><dd'+(/\d/.test(String(value)) ? ' translate="no"' : '')+'>'+esc(value)+'</dd></div>';
 const boton = (texto, accion, id = '', secundario = false) => '<button type="button" data-cartera-accion="'+accion+'"'+
  (id ? ' data-posicion="'+esc(id)+'"' : '')+' class="'+(secundario ? 'cartera-secundario' : 'cartera-principal')+'">'+esc(texto)+'</button>';
 function montar(contenedor, opciones) {
  if (!contenedor || !opciones || !opciones.usuarioId || !opciones.modelo || typeof opciones.vigente !== 'function' ||
   typeof opciones.cargar !== 'function' || typeof opciones.guardar !== 'function') throw new Error('No se puede abrir el registro de inversiones.');
  const modelo = opciones.modelo;
  const controlador = new AbortController();
  let destruido = false, cargando = true, correcto = false, ocupado = false;
  let posiciones = [], version = null, formulario = null, error = '', mensaje = '', detalle = '';
  const vigente = () => !destruido && opciones.vigente();
  const formularioNuevo = () => ({modo:'alta', tipo:'compra', moneda:'', nombre:'', proveedor:'', fecha:modelo.fechaHoy(), cantidad:'', precio:'', comision:'', importe:''});
  function campo(etiqueta, nombre, valor, decimal = false, tipo = 'text') {
   return '<label>'+esc(etiqueta)+'<input name="'+nombre+'" type="'+tipo+'" value="'+esc(valor)+'" '+
    (decimal ? 'inputmode="decimal" ' : '')+(tipo === 'date' ? 'max="'+modelo.fechaHoy()+'" ' : '')+
    'maxlength="'+(decimal ? 32 : 160)+'" autocomplete="off"'+(nombre !== 'proveedor' ? ' required' : '')+'></label>';
  }
  function pintarFormulario() {
   if (!formulario) return boton('Registrar inversión', 'alta');
   const f = formulario;
   const alta = f.modo === 'alta', valoracion = f.modo === 'valoracion';
   return '<form class="cartera-formulario" data-cartera-formulario>'+
    '<h4>'+ (alta ? 'Registrar compra' : valoracion ? 'Actualizar valoración' : 'Añadir movimiento')+'</h4>'+
    (alta ? campo('Nombre de la inversión','nombre',f.nombre)+campo('Proveedor (opcional)','proveedor',f.proveedor)+
     '<label>Moneda de las operaciones<select name="moneda" required><option value="">Elige una moneda</option>'+modelo.MONEDAS.map(moneda =>
      '<option'+(f.moneda === moneda ? ' selected' : '')+' value="'+esc(moneda)+'">'+esc(moneda)+'</option>').join('')+'</select></label>' :
     '<p translate="no">'+esc(f.nombre)+' · '+esc(f.moneda)+'</p>')+
    (f.modo === 'movimiento' ? '<label>Tipo de movimiento<select name="tipo">'+[['compra','Compra'],['venta','Venta'],['cobro','Cobro'],['gasto','Gasto']].map(([tipo,texto]) =>
     '<option value="'+tipo+'"'+(f.tipo === tipo ? ' selected' : '')+'>'+texto+'</option>').join('')+'</select></label>' : '')+
    campo(valoracion ? 'Fecha del precio' : 'Fecha del movimiento','fecha',f.fecha,false,'date')+
    (valoracion ? campo('Precio actual por unidad','precio',f.precio,true) : ['compra','venta'].includes(f.tipo) ?
     campo('Cantidad de unidades','cantidad',f.cantidad,true)+campo(f.tipo === 'venta' ? 'Precio de venta por unidad' : 'Precio pagado por unidad','precio',f.precio,true)+
     campo('Comisión (escribe 0 si no hubo)','comision',f.comision,true) : campo(f.tipo === 'cobro' ? 'Importe cobrado' : 'Importe del gasto','importe',f.importe,true))+
    '<p>Introduce datos reales, con coma o punto y sin separadores de miles. Una rentabilidad anunciada no es un cobro.</p>'+
    '<div class="cartera-acciones"><button class="cartera-principal" type="submit">'+(ocupado ? 'Guardando…' : valoracion ? 'Guardar valoración' : 'Guardar movimiento')+'</button>'+boton('Cancelar','cancelar','',true)+'</div></form>';
  }
  function pintarPosicion(posicion) {
   const r = modelo.resumirPosicion(posicion), abierto = detalle === posicion.id;
   return '<article class="cartera-posicion"><h4 translate="no">'+esc(r.nombre)+'</h4>'+
    (r.proveedor ? '<p translate="no">'+esc(r.proveedor)+'</p>' : '')+
    '<p><span translate="no">'+esc(r.cantidad)+'</span> <span>unidades</span> · <span translate="no">'+esc(r.moneda)+'</span></p>'+
    '<dl class="cartera-cifras">'+dato('Invertido',cantidad(r.aportadoCentimos,r.moneda))+dato('Valor registrado',cantidad(r.valorActualCentimos,r.moneda))+
     dato('Cobrado',cantidad(r.cobradoCentimos,r.moneda))+dato('Resultado',cantidad(r.resultadoCentimos,r.moneda))+'</dl>'+
    (r.requiereValoracion ? '<p class="cartera-aviso">Falta un precio con fecha posterior o igual al último movimiento. No se supone un resultado de cero.</p>' : '')+
    (r.fechaValoracion ? '<p>Valoración manual: <span translate="no">'+esc(r.precioActual)+' '+esc(r.moneda)+' · '+esc(fecha(r.fechaValoracion))+'</span>.</p>' : '')+
    (r.valoracionAntigua ? '<p class="cartera-aviso">La valoración tiene más de siete días. Revisa el precio y su fecha.</p>' : '')+
    '<div class="cartera-acciones">'+boton('Añadir movimiento','movimiento',posicion.id,true)+(!r.cerrada ? boton('Actualizar valoración','valoracion',posicion.id,true) : '')+'</div>'+
    '<button class="cartera-desplegable" type="button" data-cartera-accion="detalle" data-posicion="'+esc(posicion.id)+'" aria-expanded="'+abierto+'"><span>Movimientos y fechas</span> · <span translate="no">'+r.movimientos.length+' '+(abierto ? '−' : '+')+'</span></button>'+
    (abierto ? '<ul class="cartera-movimientos">'+r.movimientos.map(m => '<li><b>'+({compra:'Compra',venta:'Venta',cobro:'Cobro',gasto:'Gasto'}[m.tipo])+'</b> · <span translate="no">'+esc(fecha(m.fecha))+'</span><br>'+(['compra','venta'].includes(m.tipo) ?
      '<span translate="no">'+esc(m.cantidad)+'</span> <span>unidades</span> × <span translate="no">'+esc(m.precio+' '+r.moneda)+'</span> · <span>comisión</span> <span translate="no">'+esc(m.comision+' '+r.moneda)+'</span>' : '<span translate="no">'+esc(m.importe+' '+r.moneda)+'</span>')+'</li>').join('')+'</ul>'+boton('Eliminar inversión','eliminar',posicion.id,true) : '')+'</article>';
  }
  function pintar() {
   if (!vigente()) { desmontar(); return; }
   const grupos = correcto ? modelo.resumirCartera(posiciones) : [];
   contenedor.innerHTML = '<section class="cartera-cuenta" aria-labelledby="carteraTitulo"><h3 id="carteraTitulo">Mis inversiones</h3>'+
    '<p class="cartera-intro">Lo que compraste, lo que vale según tus datos y lo que has cobrado.</p>'+
    '<p class="cartera-nota">Registro manual de tu cuenta. RWAdar no consulta proveedores ni actualiza precios automáticamente. Cada moneda se mantiene separada.</p>'+
    (cargando ? '<p role="status">Cargando tus inversiones…</p>' : '')+
    (error ? '<p class="cartera-error" role="alert">'+esc(error)+'</p>' : '')+
    (mensaje ? '<p class="cartera-mensaje" role="status">'+esc(mensaje)+'</p>' : '')+
    (correcto ? '<div class="cartera-resumen">'+(grupos.length ? grupos.map(g => '<div><h4 translate="no">'+esc(g.moneda)+'</h4><dl class="cartera-cifras">'+
      dato('Invertido',cantidad(g.aportadoCentimos,g.moneda))+dato('Valor registrado',cantidad(g.valorActualCentimos,g.moneda))+
      dato('Cobrado',cantidad(g.cobradoCentimos,g.moneda))+dato('Resultado',cantidad(g.resultadoCentimos,g.moneda))+'</dl>'+
      (g.pendientesValoracion ? '<p class="cartera-aviso">Faltan valoraciones. Añade los precios y sus fechas para calcular el total y el resultado.</p>' : '')+'</div>').join('') :
     '<dl class="cartera-cifras">'+dato('Invertido','Sin compras')+dato('Valor registrado','Sin valoración')+dato('Cobrado','Sin movimientos')+dato('Resultado','Sin valoración')+'</dl>')+
     '<p>Invertido incluye compras, comisiones y gastos. Cobrado incluye ventas y cobros. El resultado no está anualizado.</p></div>'+pintarFormulario()+
     (!posiciones.length && !formulario ? '<p>Empieza por registrar tu primera compra. Las valoraciones y los cobros se añaden después.</p>' : '')+
     posiciones.map(pintarPosicion).join('') : (!cargando ? boton('Reintentar carga','reintentar') : ''))+'</section>';
   contenedor.querySelectorAll('button,input,select').forEach(elemento => { elemento.disabled = ocupado || cargando; });
  }
  async function cargar() {
   if (!vigente()) return;
   cargando = true; correcto = false; posiciones = []; formulario = null; error = ''; mensaje = ''; pintar();
   try {
    const respuesta = await opciones.cargar({signal:controlador.signal});
    if (!vigente()) return;
    posiciones = modelo.validarCartera(respuesta.posiciones); version = respuesta.version; correcto = true;
   } catch (_) { if (vigente()) error = 'No se pudieron leer tus inversiones. No se sobrescribirá lo guardado. Reintenta cuando tengas conexión.'; }
   finally { if (vigente()) { cargando = false; pintar(); } }
  }
  async function persistir(siguientes, texto) {
   if (!vigente() || !correcto || ocupado) return;
   ocupado = true; error = ''; mensaje = ''; pintar();
   try {
    const limpias = modelo.validarCartera(siguientes);
    const respuesta = await opciones.guardar(limpias,version,{signal:controlador.signal});
    if (!vigente()) return;
    posiciones = modelo.validarCartera(respuesta.posiciones); version = respuesta.version;
    formulario = null; mensaje = texto;
   } catch (_) {
    if (vigente()) error = 'No se confirmó el guardado. Tus registros anteriores se conservan. Si los cambiaste en otro dispositivo, recarga antes de volver a editar.';
   } finally { if (vigente()) { ocupado = false; pintar(); } }
  }
  function click(evento) {
   const b = evento.target.closest('[data-cartera-accion]');
   if (!b || !contenedor.contains(b) || !vigente() || ocupado || cargando) return;
   const accion = b.dataset.carteraAccion, posicion = posiciones.find(p => p.id === b.dataset.posicion);
   error = ''; mensaje = '';
   if (accion === 'reintentar') { cargar(); return; }
   if (accion === 'alta') formulario = formularioNuevo();
   if (accion === 'cancelar') formulario = null;
   if (accion === 'movimiento' || accion === 'valoracion') {
    if (!posicion) return;
    formulario = {...formularioNuevo(),modo:accion,posicionId:posicion.id,nombre:posicion.nombre,moneda:posicion.moneda};
   }
   if (accion === 'detalle') detalle = detalle === posicion?.id ? '' : posicion?.id || '';
   if (accion === 'eliminar') {
    const pregunta = 'Se eliminarán esta inversión y sus movimientos de tu cuenta. ¿Quieres continuar?';
    if (posicion && global.confirm((global.RWAdarIdioma?.traducir(pregunta) || pregunta)+'\n'+posicion.nombre)) persistir(posiciones.filter(p => p.id !== posicion.id),'Inversión eliminada.');
    return;
   }
   pintar();
   if (formulario) contenedor.querySelector('form input,form select')?.focus();
  }
  function recordar(evento) {
   if (!formulario || !evento.target.name || !evento.target.closest('[data-cartera-formulario]')) return;
   formulario[evento.target.name] = evento.target.value;
  }
  function cambiar(evento) {
   recordar(evento);
   if (evento.target.name === 'tipo') pintar();
  }
  function guardar(evento) {
   if (!evento.target.matches('[data-cartera-formulario]')) return;
   evento.preventDefault();
   if (!vigente() || !correcto || ocupado || !formulario) return;
   try {
    const f = formulario;
    let posicion = posiciones.find(p => p.id === f.posicionId);
    const id = prefijo => prefijo+'-'+(global.crypto?.randomUUID ? global.crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    if (f.modo === 'alta') posicion = modelo.crearPosicion({id:id('pos'),nombre:f.nombre,proveedor:f.proveedor,moneda:f.moneda});
    if (!posicion) throw new Error('No se encontró la inversión. Abre de nuevo el formulario.');
    if (f.modo === 'valoracion') posicion = modelo.fijarValoracion(posicion,{precio:f.precio,fecha:f.fecha});
    else {
     const tipo = f.modo === 'alta' ? 'compra' : f.tipo;
     if (['compra','venta'].includes(tipo) && !f.comision.trim()) throw new Error('Indica la comisión; escribe 0 si no hubo comisión.');
     posicion = modelo.anadirMovimiento(posicion,{id:id('mov'),tipo,fecha:f.fecha,...(['compra','venta'].includes(tipo) ?
      {cantidad:f.cantidad,precio:f.precio,comision:f.comision} : {importe:f.importe})});
    }
    persistir(f.modo === 'alta' ? [...posiciones,posicion] : posiciones.map(p => p.id === posicion.id ? posicion : p),'Movimiento guardado.');
   } catch (fallo) { error = fallo.message || 'Revisa los datos.'; pintar(); }
  }
  function cambioSesion() { if (!vigente()) desmontar(); }
  function desmontar() {
   if (destruido) return;
   destruido = true; controlador.abort(); posiciones = []; formulario = null; version = null;
   contenedor.replaceChildren();
   contenedor.removeEventListener('click',click); contenedor.removeEventListener('input',recordar);
   contenedor.removeEventListener('change',cambiar); contenedor.removeEventListener('submit',guardar);
   document.removeEventListener('rwadar:sesion',cambioSesion);
  }
  contenedor.addEventListener('click',click); contenedor.addEventListener('input',recordar);
  contenedor.addEventListener('change',cambiar); contenedor.addEventListener('submit',guardar);
  document.addEventListener('rwadar:sesion',cambioSesion);
  cargar();
  return {desmontar};
 }
 global.RWAdarInversionesUI = Object.freeze({montar});
})(typeof window === 'undefined' ? globalThis : window);

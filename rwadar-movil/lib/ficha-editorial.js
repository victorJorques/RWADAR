/* Presentación compartida web/app. Solo lee el catálogo recibido: no red,
   cotizaciones, dependencias de Node ni datos añadidos por slug/proveedor. */
(function publicarFichaEditorial(raiz) {
  'use strict';
  const texto = valor => typeof valor === 'string' ? valor.trim() : '';
  const normal = valor => texto(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function fecha(valor, limite) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const n = Date.parse(valor + 'T00:00:00Z');
    return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === valor &&
      (!limite || valor <= limite) ? valor : null;
  }
  function fuente(valor) {
    try {
      const url = new URL(valor);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  function referenciasDe(oferta, hoy) {
    const fuentes = new Set((Array.isArray(oferta.documentacion?.fuentes) ? oferta.documentacion.fuentes : []).map(fuente).filter(Boolean));
    return (Array.isArray(oferta.documentacion?.referencias) ? oferta.documentacion.referencias : [])
      .filter(r => r && texto(r.etiqueta) && texto(r.valor) && fuentes.has(fuente(r.fuente)) && fecha(r.fechaConsulta, hoy) &&
        (r.fechaDato == null || fecha(r.fechaDato, r.fechaConsulta)))
      .map(r => ({...r, fuente:fuente(r.fuente), fechaConsulta:fecha(r.fechaConsulta,hoy),
        fechaDato:fecha(r.fechaDato, r.fechaConsulta)}))
      .sort((a,b) => b.fechaConsulta.localeCompare(a.fechaConsulta) ||
        (b.fechaDato || '').localeCompare(a.fechaDato || '') ||
        a.etiqueta.localeCompare(b.etiqueta, 'es') || a.fuente.localeCompare(b.fuente));
  }
  const campo = (ref, valor) => ref ? {texto:valor ?? texto(ref.valor),fuente:ref.fuente,
    consultadaEl:ref.fechaConsulta,fechaDato:ref.fechaDato || null} : {texto:valor};
  function importeEuros(valor) {
    const limpio = texto(valor).replace(/\u00a0/g,' ');
    const m = /^(?:desde\s+)?([0-9][0-9., ]*)\s*(?:EUR|€|euros?)$/i.exec(limpio);
    if (!m) return null;
    let numero = m[1].replace(/ /g,'');
    const coma = numero.lastIndexOf(','); const punto = numero.lastIndexOf('.');
    if (coma >= 0 && punto >= 0) numero = coma > punto
      ? numero.replace(/\./g,'').replace(',','.') : numero.replace(/,/g,'');
    else if (coma >= 0) numero = /,\d{1,2}$/.test(numero) ? numero.replace(',','.') : numero.replace(/,/g,'');
    else if (punto >= 0) numero = /\.\d{3}(?:\.|$)/.test(numero) ? numero.replace(/\./g,'') : numero;
    const n = Number(numero);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function resumenOferta(entrada, plataformas = [], ahora = new Date()) {
    const oferta = entrada && typeof entrada === 'object' ? entrada : {};
    const reloj = ahora === Date ? new Date() : new Date(ahora);
    const hoy = Number.isFinite(reloj.getTime()) ? reloj.toISOString().slice(0,10) : null;
    const referencias = hoy ? referenciasDe(oferta,hoy) : [];
    const revisadaEl = fecha(oferta.documentacion?.revisadaEl, hoy) || fecha(oferta.verificadaEl,hoy);
    const revisionCifras = fecha(oferta.verificadaEl,hoy);
    const dias = Number(oferta.vigenciaDias);
    const vencida = !hoy || !revisionCifras || !Number.isInteger(dias) || dias < 1 ||
      Date.parse(hoy + 'T00:00:00Z') > Date.parse(revisionCifras + 'T00:00:00Z') + dias * 86400000;
    const principal = !oferta.coleccion || oferta.coleccion === 'principales';
    const actual = !vencida && oferta.estadoRevision === 'actual' && !oferta.cifrasPendientes && principal;
    // Reventa y próximas (03/11/2026, Víctor): no llevan rentabilidad ni precio
    // principal, pero sí enseñan el mínimo, el acceso y la salida documentados
    // con fuente y fecha mientras la ficha está vigente.
    const documental = !vencida && !principal && !oferta.cifrasPendientes;
    const conDatos = actual || documental;
    // En reventa y próximas solo cuentan las referencias redactadas para la
    // tarjeta, con etiqueta fija; las citas literales se quedan en la ficha.
    const paraTarjeta = r => principal ||
      /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/.test(texto(r.etiqueta));
    const ultimo = referencias[0];
    const estado = oferta.estadoRevision === 'fuentes_en_conflicto'
      ? {texto:'Las fuentes no coinciden',tono:'stop'}
      : vencida ? {texto:'Revisión pendiente · cifras ocultas',tono:'warn'}
      : oferta.coleccion === 'secundario' ? {texto:'Referencia de reventa · disponibilidad sin confirmar',tono:'neutro'}
      : oferta.coleccion === 'en_camino' ? {texto:'Anuncio documentado · apertura sin confirmar',tono:'neutro'}
      : oferta.estadoRevision !== 'actual' ? {texto:'No se pudo confirmar la apertura',tono:'warn'}
      : {texto:'Datos con fuente y fecha · consulta las condiciones',tono:'ok'};
    const elegible = referencias.filter(paraTarjeta).filter(r => {
      const etiqueta = normal(r.etiqueta);
      return !/precio|cotizacion|valor liquidativo|por (?:token|participacion|accion)/.test(etiqueta) &&
        /minim|suscripcion inicial/.test(etiqueta) &&
        !/por (?:token|participacion|accion)/.test(normal(r.valor));
    });
    const minimoRef = elegible[0];
    let minimo = {texto:conDatos ? 'No documentado en euros' : 'Sin mínimo vigente en euros'};
    if (conDatos && minimoRef) {
      const euros = importeEuros(minimoRef.valor);
      minimo = euros === null ? {...campo(minimoRef,'No documentado en euros'),unidadDocumentada:texto(minimoRef.valor)}
        : {...campo(minimoRef, new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(euros) + ' €'),euros};
    }
    const accesoRef = referencias.filter(paraTarjeta).find(r => /espana|spain/.test(normal(r.etiqueta)) &&
      /acceso|disponib|elegibil|residen/.test(normal(r.etiqueta)));
    const accesoExplicito = oferta.disponibleEs === true || oferta.disponibleEs === false;
    const accesoValor = normal(accesoRef?.valor);
    const accesoPositivo = /^(?:si|true)$/.test(accesoValor) ||
      (!/no |sin confirmar|no confirm|no acredita|consultar/.test(accesoValor) &&
       /disponible|admit|permit|acceso/.test(accesoValor));
    const accesoNegativo = /^(?:no|false)$/.test(accesoValor) || /no disponible|no admit|no permit|excluid/.test(accesoValor);
    let accesoEspana = {texto:'Sin comprobar si se puede contratar desde España',estado:'sin_comprobar'};
    if (actual && accesoExplicito && accesoRef &&
        (oferta.disponibleEs === true ? accesoPositivo : accesoNegativo)) {
      accesoEspana = {...campo(accesoRef,oferta.disponibleEs ? 'Disponible desde España según la fuente' : 'No disponible desde España según la fuente'),
        estado:oferta.disponibleEs ? 'si' : 'no'};
    } else if (documental && accesoRef && accesoPositivo !== accesoNegativo) {
      // Sin indicador propio (el contrato lo reserva a las principales): manda la referencia.
      accesoEspana = {...campo(accesoRef,accesoPositivo ? 'Disponible desde España según la fuente' : 'No disponible desde España según la fuente'),
        estado:accesoPositivo ? 'si' : 'no'};
    }
    const salidaRef = referencias.filter(paraTarjeta).find(r => /reembols|devolucion|salida|liquidacion|plazo/.test(normal(r.etiqueta)) &&
      !/emision|campana|suscripcion|captacion|cierre/.test(normal(r.etiqueta)));
    let salida = {texto:'Salida no documentada'};
    if (conDatos && salidaRef) salida = campo(salidaRef, texto(salidaRef.etiqueta).replace(/\s*·.*$/,'') + ': ' + texto(salidaRef.valor));
    else if (oferta.coleccion === 'secundario' && referencias.length &&
        Array.isArray(oferta.documentacion?.fuentes) && oferta.documentacion.fuentes.some(fuente)) {
      salida = campo(ultimo,'Reventa entre inversores; depende de que haya compradores');
    } else if (vencida && salidaRef) salida = {texto:'Salida por volver a comprobar'};
    const costesRefs = referencias.filter(r => /comision|coste|tarifa|gastos|fee|expense/.test(normal(r.etiqueta)) ||
      (/^(?:gestion|custodia) publicada(?:\s*·|$)/.test(normal(r.etiqueta)) && /%|tarifa|coste|gratis|gratuit|comision/.test(normal(r.valor))));
    const ultimaPorConcepto = new Map();
    for (const ref of costesRefs) {
      const etiqueta = normal(ref.etiqueta).replace(/\s*·\s*\d{2}\/\d{2}\/\d{4}\s*$/,'');
      // Solo equivalencias de etiquetas simples. Un gasto de gestión del
      // fondo y otro de la plataforma siguen siendo conceptos distintos.
      const simple = /^(?:comision publicada\s*·\s*|comision de |)(gestion|exito|performance|custodia)(?: publicada)?$/.exec(etiqueta);
      const concepto = simple ? (simple[1] === 'performance' ? 'exito' : simple[1]) : etiqueta;
      const clave = ref.fuente + '|' + concepto;
      if (!ultimaPorConcepto.has(clave)) ultimaPorConcepto.set(clave,ref);
    }
    const gastos = [...ultimaPorConcepto.values()];
    let costes = {texto:vencida && gastos.length ? 'Costes por volver a comprobar' : 'Costes no documentados',referencias:[]};
    if (actual && gastos.length) {
      costes = {texto:gastos.map(r => texto(r.etiqueta).replace(/\s*·\s*\d{2}\/\d{2}\/\d{4}\s*$/,'') + ': ' + texto(r.valor)).join('; '),
        referencias:gastos.map(r=>({...r}))};
      const fuentes = new Set(gastos.map(r=>r.fuente)), consultas = new Set(gastos.map(r=>r.fechaConsulta));
      if (fuentes.size === 1) costes.fuente = gastos[0].fuente;
      if (consultas.size === 1) costes.consultadaEl = gastos[0].fechaConsulta;
    }
    // No se usa la localización del activo ni el marco de su plataforma para
    // deducir elegibilidad, ticket o condiciones de salida de una oferta.
    void plataformas;
    return {minimo,accesoEspana,salida,costes,fechas:{revisadaEl:revisadaEl || null,
      comprobadaEl:ultimo?.fechaConsulta || null,fechaDato:ultimo?.fechaDato || null},estado,
      cifrasVigentes:actual,vencida};
  }
  const api = {resumenOferta};
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (raiz) raiz.RWAdarFichaEditorial = api;
})(typeof globalThis === 'object' ? globalThis : this);

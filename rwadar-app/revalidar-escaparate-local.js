'use strict';

// Adaptador de evidencia editorial local. No red, SQL, aprobación ni publicación.
const assert = require('node:assert/strict');
const fechaValida = valor => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
  Number.isFinite(Date.parse(`${valor}T00:00:00Z`)) &&
  new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
const https = valor => {
  try { const u = new URL(valor); return u.protocol === 'https:' && !u.username && !u.password; }
  catch { return false; }
};
const texto = valor => typeof valor === 'string' && valor.trim().length > 0;

function aplicarRevalidacion(ofertas, registro) {
  assert.ok(registro?.version === 1 && registro.publicable === false &&
    registro.aplicadoASupabase === false && fechaValida(registro.consultadaEl), 'cabecera de revalidación inválida');
  assert.ok(Array.isArray(ofertas) && ofertas.length === 28 &&
    Array.isArray(registro.ofertas) && registro.ofertas.length === 28, 'se requieren las 28 ofertas');
  const porSlug = new Map(registro.ofertas.map(o => [o.slug, o]));
  assert.equal(porSlug.size, 28, 'slugs de revalidación duplicados');
  assert.equal(new Set(ofertas.map(o => o.slug)).size, 28, 'slugs de origen duplicados');
  assert.ok(Array.isArray(registro.fuentes) && registro.fuentes.length > 0, 'faltan fuentes');
  const fuentes = new Map(registro.fuentes.map(f => [f.id, f]));
  assert.equal(fuentes.size, registro.fuentes.length, 'fuentes duplicadas');
  for (const f of fuentes.values()) assert.ok(texto(f.id) && f.primaria === true &&
    f.consultadaEl === registro.consultadaEl && https(f.url) && texto(f.resultado), 'fuente no trazable');

  return ofertas.map(oferta => {
    const r = porSlug.get(oferta.slug);
    assert.ok(r && r.plataformaSlug === oferta.plataformaSlug && r.titulo === oferta.titulo,
      `identidad distinta en ${oferta.slug}`);
    assert.ok(r.fechaRevisionAnterior === oferta.verificadaEl && r.estadoAnterior === oferta.estadoRevision &&
      r.consultadaEl === registro.consultadaEl && r.consultadaEl >= r.fechaRevisionAnterior,
    `cadena de revisión inválida en ${oferta.slug}`);
    assert.ok(['actual', 'no_verificable', 'fuentes_en_conflicto'].includes(r.estadoRevision), 'estado desconocido');
    assert.equal(r.disponibleEs, null, 'este corte no acredita admisión en España');
    assert.ok(Array.isArray(r.fuentes) && r.fuentes.length > 0 &&
      r.fuentes.every(id => fuentes.has(id)), `fuente desconocida en ${oferta.slug}`);
    const resultado = r.resultado || registro.grupos?.[r.grupo]?.resultado;
    assert.ok(texto(resultado) && resultado.length >= 20, `falta alcance en ${oferta.slug}`);
    const actual = r.estadoRevision === 'actual';
    for (const [nombre, campo, clave] of [['precio', r.precio, 'mostrado'], ['rentabilidad', r.rentabilidad, 'mostrada']]) {
      assert.ok(campo === null || actual && typeof campo === 'object' && !Array.isArray(campo) &&
        texto(campo[clave]) && texto(campo.unidad || campo.literal), `${nombre} sin alcance en ${oferta.slug}`);
    }
    const metricas = actual && r.metricas?.length ? r.metricas :
      [{ etiqueta: 'Revisión', valor: actual ? 'Descripción documental contrastada; consulta las condiciones.' : 'Condiciones actuales no verificadas.' }];
    assert.ok(metricas.every(m => texto(m.etiqueta) && texto(m.valor)), 'métrica sin etiqueta o valor');
    assert.ok(!r.urlPropuesta || https(r.urlPropuesta), 'URL propuesta insegura');
    // Reemplazar, no mezclar: una nueva consulta no valida los claims del snapshot.
    return {
      ...oferta,
      estadoRevision: r.estadoRevision,
      verificadaEl: r.consultadaEl,
      vigenciaDias: Math.min(oferta.vigenciaDias, 1),
      permanente: false,
      disponibleEs: null,
      eu: null,
      puntuacion: null,
      precio: r.precio && { ...r.precio },
      rentabilidad: r.rentabilidad && { ...r.rentabilidad },
      resumen: resultado,
      metricas: metricas.map(m => ({ ...m })),
      avisos: [{
        texto: 'Consulta editorial de fuentes; no acredita oferta abierta, admisión desde España ni precio ejecutable. Confirma las condiciones con el proveedor.',
        tono: actual ? 'warn' : 'stop', esAntiguedad: false, verificadaEl: r.consultadaEl,
      }, {
        texto: resultado, tono: 'warn', esAntiguedad: false, verificadaEl: r.consultadaEl,
      }],
      fuentesActuales: [...new Set(r.fuentes.map(id => fuentes.get(id).url))],
      url: r.urlPropuesta || oferta.url,
    };
  });
}

module.exports = { aplicarRevalidacion };

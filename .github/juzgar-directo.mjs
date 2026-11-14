/* =====================================================================
   RWAdar · qué vale como respuesta de /api/tokenizacion/directo al publicar
   ---------------------------------------------------------------------
   Lo usa .github/comprobar-publicado.mjs (revisión del 14/11/2026): una
   respuesta 503 con un código conocido es legítima (unos minutos tras
   publicar otra lista, una racha de 429 en la base) y NO debe tumbar la
   publicación, también la automática de cada mañana. Vale:
     200 con { version: 1, fina, sinLectura } que pase validarDirecto;
     404 {"error":"directo_apagado"} (sin la 35, deshecha o apagada);
     503 {"error": un código conocido} → vale, con un aviso en el registro.
   Falla: 5xx sin JSON, un 200 que no vale, un código desconocido o
   cualquier otro estado.
   ===================================================================== */
export const CODIGOS_503 = Object.freeze(['directo_sin_datos', 'directo_no_valido', 'directo_no_casa', 'directo_atrasado', 'directo_no_responde']);

export function juzgarDirecto(estado, texto, modelo) {
  let cuerpo = null;
  try { cuerpo = JSON.parse(texto); } catch { cuerpo = null; }
  const error = cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) && typeof cuerpo.error === 'string' ? cuerpo.error : null;
  if (estado === 200) {
    try { modelo.validarDirecto(cuerpo); return { bien: true, aviso: null }; } catch (e) { return { bien: false, aviso: `200 que no vale (${e.message})` }; }
  }
  if (estado === 404 && error === 'directo_apagado' && Object.keys(cuerpo).length === 1) return { bien: true, aviso: null };
  if (estado === 503 && CODIGOS_503.includes(error) && Object.keys(cuerpo).length === 1) {
    return { bien: true, aviso: `el directo responde 503 ${error}: se ve el archivo publicado (mira «Mercado en directo (base)», acción estado, si dura)` };
  }
  return { bien: false, aviso: `respuesta no esperada (${estado}${error ? ' ' + error : cuerpo ? '' : ', sin JSON'})` };
}

/* =====================================================================
   RWAdar · la app móvil contra PRODUCCIÓN
   ---------------------------------------------------------------------
       node probar-app-movil.mjs

   La app no usa cuenta: se identifica con un código anónimo de
   instalación y habla con la base usando solo la clave pública. Eso la
   deja expuesta a exactamente el mismo fallo que tumbó las opiniones de
   la web — un GRANT que falta no se ve en el código y las pruebas
   locales pasan en verde igualmente.

   Aquí se repiten, una por una, las consultas que hace `lib/datos.js` y
   `lib/avisos.js`, con la misma clave y el mismo formato. Al terminar
   borra la instalación de prueba que ha creado.
   ===================================================================== */
const URL_BASE = 'https://exgpmjpaaebyoolpwced.supabase.co';
const CLAVE = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';
const REST = URL_BASE + '/rest/v1';

/* El identificador se genera con el mismo formato que `lib/supabase.js`.
   No es un uuid a propósito: es una cadena opaca que no identifica a
   nadie, solo separa un móvil de otro. */
const instalacion = 'inst_' + Date.now().toString(36) + '_' +
  Math.random().toString(36).slice(2, 10);

/* LA CABECERA ES EL TODO. Las políticas de seguridad de `dispositivos` y
   `seguimiento` comparan la fila con `instalacion_actual()`, que lee
   `x-instalacion` de la petición. Sin esa cabecera el insert se rechaza
   con un 42501 que parece un fallo de permisos y no lo es — es la
   política haciendo exactamente su trabajo. La app la pone al crear el
   cliente (`lib/supabase.js:36`), así que aquí también. */
const cab = (extra = {}) =>
  Object.assign(
    { apikey: CLAVE, 'Content-Type': 'application/json', 'x-instalacion': instalacion },
    extra);

const pide = async (ruta, opc = {}) => {
  const { headers: extra, ...resto } = opc;
  const r = await fetch(REST + ruta, Object.assign({ headers: cab(extra || {}) }, resto));
  const t = await r.text();
  let c = null; try { c = t ? JSON.parse(t) : null; } catch { c = t; }
  return { ok: r.ok, estado: r.status, cuerpo: c };
};

const ok = [], fail = [], notas = [];
const paso = (t, c, detalle) => {
  (c ? ok : fail).push(t);
  if (!c && detalle) notas.push(`${t} → ${detalle}`);
};

console.log('\nRWAdar · la app móvil contra producción\n' + '─'.repeat(58));

/* --- 1 · la pantalla principal: cargarRadar() ------------------------ */
const radar = await pide('/radar_publico?select=*');
paso(`el radar carga sin cuenta (${(radar.cuerpo || []).length} plataformas)`,
  radar.ok && radar.cuerpo.length > 20, `${radar.estado} ${JSON.stringify(radar.cuerpo).slice(0, 120)}`);

/* La app pinta campos concretos: si alguno desapareciera del esquema,
   las fichas saldrían a medias sin dar ningún error. */
const p = (radar.cuerpo || [])[0] || {};
const campos = ['slug', 'nombre', 'categoria', 'actor', 'region', 'acceso', 'ticket', 'cadenas', 'nota', 'aval', 'web', 'plataforma_id'];
const faltan = campos.filter((c) => !(c in p));
paso('la ficha trae todos los campos que pinta la app', faltan.length === 0,
  'faltan: ' + faltan.join(', '));

/* --- 2 · cargarFuera() ----------------------------------------------- */
const fuera = await pide('/plataformas?select=slug,nombre,etiqueta_descarte,motivo_descarte,fuentes(url,titulo)&estado=eq.descartada&order=nombre');
paso(`las descartadas cargan con sus fuentes (${(fuera.cuerpo || []).length})`,
  fuera.ok && fuera.cuerpo.length > 0 && fuera.cuerpo.every((d) => (d.fuentes || []).length > 0),
  `${fuera.estado} ${JSON.stringify(fuera.cuerpo).slice(0, 120)}`);

/* --- 3 · novedades() -------------------------------------------------- */
const cambios = await pide('/cambios_estado?select=id,titular,detalle,ocurrido_el,plataformas(slug,nombre)&order=ocurrido_el.desc&limit=30');
paso('los cambios de estado se pueden leer', cambios.ok,
  `${cambios.estado} ${JSON.stringify(cambios.cuerpo).slice(0, 120)}`);

/* --- 4 · alternarSeguimiento(): lo que de verdad importa -------------- */
/* Es la función que justifica que exista la app. Si esto falla, seguir
   una plataforma no llega al servidor y el aviso no se genera nunca. */
/* `on_conflict` no es un adorno: sin él PostgREST hace un INSERT a secas
   y la segunda vez choca con la clave única en lugar de actualizar. La
   librería lo añade sola desde `upsert(..., { onConflict: 'instalacion' })`. */
const disp = await pide('/dispositivos?on_conflict=instalacion', {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify({ instalacion, sistema: 'android' }),
});
paso('la app puede registrar su instalación', disp.ok,
  `${disp.estado} ${JSON.stringify(disp.cuerpo).slice(0, 160)}`);

const plataformaId = p.plataforma_id;
const seguir = await pide('/seguimiento', {
  method: 'POST',
  body: JSON.stringify({ instalacion, plataforma_id: plataformaId }),
});
paso(`se puede seguir ${p.nombre || 'una plataforma'}`, seguir.ok,
  `${seguir.estado} ${JSON.stringify(seguir.cuerpo).slice(0, 160)}`);

const dejar = await pide(`/seguimiento?instalacion=eq.${instalacion}&plataforma_id=eq.${plataformaId}`,
  { method: 'DELETE' });
paso('y se puede dejar de seguir', dejar.ok,
  `${dejar.estado} ${JSON.stringify(dejar.cuerpo).slice(0, 160)}`);

/* --- 5 · registrarParaAvisos(): el token push ------------------------- */
const token = await pide('/dispositivos?on_conflict=instalacion', {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify({
    instalacion, token_push: 'ExponentPushToken[prueba-automatica]',
    sistema: 'android', version_app: '1.0.0',
  }),
});
paso('la app puede guardar su token push', token.ok,
  `${token.estado} ${JSON.stringify(token.cuerpo).slice(0, 160)}`);

/* --- 6 · y que no pueda hacer lo que no debe -------------------------- */
/* Un `select *` sin filtro: la política tiene que devolver la fila propia
   y ninguna otra. Devolver cero sería un falso aprobado —«está vacío» no
   demuestra que esté protegido—, así que se comprueba que devuelve
   exactamente la suya. */
const cotilla = await pide('/dispositivos?select=*');
const filas = Array.isArray(cotilla.cuerpo) ? cotilla.cuerpo : [];
paso('un dispositivo solo se ve a sí mismo, nunca a los demás',
  cotilla.ok && filas.length === 1 && filas[0].instalacion === instalacion,
  `devuelve ${filas.length} fila(s): ${JSON.stringify(filas.map((f) => f.instalacion))}`);
paso('y el token guardado es el suyo',
  filas[0] && filas[0].token_push === 'ExponentPushToken[prueba-automatica]',
  JSON.stringify(filas[0] || null).slice(0, 120));

await pide(`/dispositivos?instalacion=eq.${instalacion}`, { method: 'DELETE' });

/* --------------------------------------------------------------------- */
console.log('');
ok.forEach((t) => console.log('  OK    ' + t));
fail.forEach((t) => console.log('  FALLA ' + t));
if (notas.length) { console.log(''); notas.forEach((t) => console.log('  nota  ' + t)); }
console.log(`\n${ok.length} correctas, ${fail.length} fallidas\n`);
process.exit(fail.length ? 1 : 0);

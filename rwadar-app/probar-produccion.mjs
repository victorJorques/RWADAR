/* =====================================================================
   RWAdar · comprobación contra PRODUCCIÓN
   ---------------------------------------------------------------------
       node probar-produccion.mjs

   Las otras pruebas corren contra un Postgres embebido y demuestran que
   el esquema del repositorio es correcto. Esta demuestra otra cosa
   distinta y más incómoda: qué hace **la base que está en línea ahora
   mismo**, que no es necesariamente la misma. Vale para saber qué se
   puede enseñar en una presentación sin llevarse un susto.

   Hace lo mismo que hace la web, con la clave pública y nada más: se
   registra, se lee el perfil, opina, vigila, intenta moderar y al final
   **borra la cuenta con `borrar_mi_cuenta()`**, que es la misma función
   que usa el botón de la web. No deja rastro: es lo último que hace y
   lo comprueba después.

   No escribe nada en las tablas del registro (plataformas, fuentes):
   solo crea y destruye una cuenta de usar y tirar.
   ===================================================================== */
const URL_BASE = 'https://exgpmjpaaebyoolpwced.supabase.co';
const CLAVE    = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';
const REST     = URL_BASE + '/rest/v1';

const ok = [], fail = [], notas = [];
const paso = (t, c) => (c ? ok : fail).push(t);
const nota = (t) => notas.push(t);

let sesion = null;
const cab = (extra = {}) => Object.assign(
  { apikey: CLAVE, 'Content-Type': 'application/json' },
  sesion ? { Authorization: 'Bearer ' + sesion.access_token } : {},
  extra);

async function pide(ruta, opc = {}) {
  /* Ojo con el orden: las cabeceras extra se AÑADEN a las de siempre.
     Escrito al revés, un `Prefer` se llevaba por delante la apikey y el
     fallo parecía de producción. */
  const { headers: extra, ...resto } = opc;
  const r = await fetch((ruta.startsWith('/auth') ? URL_BASE : REST) + ruta,
    Object.assign({ headers: cab(extra || {}) }, resto));
  const txt = await r.text();
  let cuerpo = null;
  try { cuerpo = txt ? JSON.parse(txt) : null; } catch { cuerpo = txt; }
  return { estado: r.status, ok: r.ok, cuerpo };
}

console.log('\nRWAdar · contra producción\n' + '─'.repeat(58));

/* --- 1 · lo público, sin cuenta -------------------------------------- */
const radar = await pide('/radar_publico?select=nombre');
paso(`el radar público responde sin cuenta (${(radar.cuerpo || []).length} plataformas)`,
  radar.ok && radar.cuerpo.length > 20);

const fuera = await pide('/plataformas?estado=eq.descartada&select=nombre,fuentes(url)');
paso('las descartadas siguen llevando su fuente',
  fuera.ok && fuera.cuerpo.length > 0 && fuera.cuerpo.every(d => (d.fuentes || []).length > 0));

/* --- 2 · registrarse -------------------------------------------------- */
const correo = `prueba-${Date.now()}@rwadar-pruebas.example.com`;
const clave  = 'p' + Math.random().toString(36).slice(2) + 'Aa9!';

const alta = await pide('/auth/v1/signup', {
  method: 'POST', body: JSON.stringify({ email: correo, password: clave }),
});
paso('el registro no da error', alta.ok);

if (alta.ok && alta.cuerpo && alta.cuerpo.access_token) {
  sesion = alta.cuerpo;
  paso('da sesión al momento: «Confirm email» está apagado', true);
} else if (alta.ok) {
  paso('da sesión al momento: «Confirm email» está apagado', false);
  nota('El alta devuelve usuario pero NO sesión: sigue exigiendo confirmar por correo.');
  const entrar = await pide('/auth/v1/token?grant_type=password', {
    method: 'POST', body: JSON.stringify({ email: correo, password: clave }),
  });
  if (entrar.ok) sesion = entrar.cuerpo;
} else {
  nota('No se ha podido crear la cuenta de prueba: ' + JSON.stringify(alta.cuerpo).slice(0, 200));
}

if (!sesion) {
  console.log('\nSin sesión no se puede comprobar el resto.\n');
  ok.forEach(t => console.log('  OK    ' + t));
  fail.forEach(t => console.log('  FALLA ' + t));
  notas.forEach(t => console.log('  nota  ' + t));
  process.exit(1);
}

const uid = sesion.user.id;

/* --- 3 · el perfil nace solo ------------------------------------------ */
const perfil = await pide('/perfiles?select=*');
paso('el perfil se crea solo al registrarse',
  perfil.ok && perfil.cuerpo.length === 1 && perfil.cuerpo[0].id === uid);
paso('y nace con los avisos por correo encendidos',
  perfil.ok && perfil.cuerpo[0] && perfil.cuerpo[0].avisos_correo === true);

/* --- 4 · opinar -------------------------------------------------------- */
const pl = await pide('/plataformas?estado=eq.en_radar&select=id,nombre&limit=1');
const plataforma = pl.cuerpo && pl.cuerpo[0];

/* Producción no deja escribir en `opiniones` a pelo: publica
   guardar_opinion() y rechaza el INSERT con un 403. Se prueba la vía
   publicada, y si no existiera —una base levantada solo del
   repositorio— se cae al INSERT, que es lo mismo que hace la web. */
const texto = 'Opinion de prueba automatica: se escribe y se borra sola al terminar la comprobacion.';
let opinar = await pide('/rpc/guardar_opinion', {
  method: 'POST',
  body: JSON.stringify({ p_plataforma: plataforma.id, p_nota: 8, p_texto: texto }),
});
if (!opinar.ok && opinar.estado === 404) {
  nota('guardar_opinion() no existe: se prueba el INSERT directo');
  opinar = await pide('/opiniones', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ usuario_id: uid, plataforma_id: plataforma.id, nota: 8, texto }),
  });
}
paso(`se puede opinar sobre ${plataforma.nombre}`, opinar.ok);
if (!opinar.ok) nota(`opinar → ${opinar.estado} ${JSON.stringify(opinar.cuerpo)}`);
const opinionId = typeof opinar.cuerpo === 'string' ? opinar.cuerpo : null;

const publicas = await pide(`/opiniones_publicas?plataforma_id=eq.${plataforma.id}&select=*`);
paso('la opinión sale en la vista pública', publicas.ok && publicas.cuerpo.some(o => o.texto === texto));
paso('y la vista pública no expone ningún correo',
  publicas.ok && !JSON.stringify(publicas.cuerpo).includes('@'));

paso('la vista pública trae el id que hace falta para denunciar y borrar',
  publicas.ok && publicas.cuerpo.some(o => o.texto === texto && o.opinion_id));

const corta = await pide('/rpc/guardar_opinion', {
  method: 'POST',
  body: JSON.stringify({ p_plataforma: plataforma.id, p_nota: 8, p_texto: 'muy corta' }),
});
paso('rechaza un texto demasiado corto', !corta.ok);

/* Borrar la propia opinión, por la vía publicada. Denunciar no se prueba
   aquí: haría falta una segunda cuenta, y nadie puede denunciarse a sí
   mismo. Está comprobado aparte, de punta a punta. */
if (opinionId) {
  const borrada = await pide('/rpc/borrar_mi_opinion', {
    method: 'POST', body: JSON.stringify({ p_opinion_id: opinionId }),
  });
  paso('se puede borrar la propia opinión', borrada.ok);
}

/* --- 5 · vigilar -------------------------------------------------------- */
const vigilar = await pide('/vigilancia', {
  method: 'POST', body: JSON.stringify({ usuario_id: uid, plataforma_id: plataforma.id }),
});
paso('se puede vigilar una plataforma', vigilar.ok);

/* --- 6 · la cola de moderación NO se filtra ---------------------------- */
const cola = await pide('/cola_moderacion?select=*');
paso('un usuario normal NO ve la cola de moderación',
  !cola.ok || (Array.isArray(cola.cuerpo) && cola.cuerpo.length === 0));

/* --- 6b · qué tablas tienen permiso y cuáles no ------------------------ */
/* Un 42501 aquí no es RLS: es que al rol `authenticated` le falta el
   GRANT de tabla. Se distingue bien porque RLS devuelve una lista vacía
   y la falta de permiso devuelve 403. */
const tablas = ['opiniones','opiniones_publicas','nota_media','denuncias','moderacion',
                'cola_moderacion','vigilancia','perfiles','mi_perfil','plataformas'];
const sinPermiso = [];
for (const t of tablas) {
  const r = await pide(`/${t}?select=*&limit=1`);
  if (r.estado === 403 || (r.cuerpo && r.cuerpo.code === '42501')) sinPermiso.push(t);
}
paso('ninguna tabla de la web se queda sin permiso', sinPermiso.length === 0);
if (sinPermiso.length) nota('SIN PERMISO para `authenticated`: ' + sinPermiso.join(', '));

/* --- 7 · moderar: qué firma existe de verdad --------------------------- */
const conPar = await pide('/rpc/moderar', {
  method: 'POST',
  body: JSON.stringify({ p_usuario: uid, p_plataforma: plataforma.id, p_accion: 'ocultar', p_motivo: 'prueba' }),
});
const conId = await pide('/rpc/moderar', {
  method: 'POST',
  body: JSON.stringify({ p_opinion_id: uid, p_accion: 'ocultar', p_motivo: 'prueba' }),
});
const noExiste = r => r.estado === 404 ||
  (r.cuerpo && typeof r.cuerpo === 'object' && r.cuerpo.code === 'PGRST202');

nota(`moderar(p_usuario, p_plataforma, …) → ${conPar.estado} ${noExiste(conPar) ? 'NO EXISTE' : 'existe'}`);
nota(`moderar(p_opinion_id, …)            → ${conId.estado} ${noExiste(conId) ? 'NO EXISTE' : 'existe'}`);
paso('la firma que espera la web existe en producción', !noExiste(conPar));
paso('y de todas formas rechaza a quien no es administrador',
  noExiste(conPar) ? !conPar.ok : (!conPar.ok && JSON.stringify(conPar.cuerpo).includes('administrador')));

/* --- 8 · borrarse sin dejar rastro -------------------------------------- */
const borrado = await pide('/rpc/borrar_mi_cuenta', { method: 'POST', body: '{}' });
paso('la cuenta se puede borrar desde la propia web', borrado.ok);

const quedaPerfil = await pide('/perfiles?select=id');
paso('tras borrarla no queda perfil',
  !quedaPerfil.ok || (Array.isArray(quedaPerfil.cuerpo) && quedaPerfil.cuerpo.length === 0));

sesion = null;
const quedaOpinion = await pide(`/opiniones_publicas?plataforma_id=eq.${plataforma.id}&select=texto`);
paso('ni queda la opinión de prueba',
  quedaOpinion.ok && !JSON.stringify(quedaOpinion.cuerpo).includes('prueba automatica'));

/* ------------------------------------------------------------------------ */
console.log('');
ok.forEach(t => console.log('  OK    ' + t));
fail.forEach(t => console.log('  FALLA ' + t));
if (notas.length) { console.log(''); notas.forEach(t => console.log('  nota  ' + t)); }
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
console.log('Cuenta de prueba usada y borrada: ' + correo + '\n');
process.exit(fail.length ? 1 : 0);

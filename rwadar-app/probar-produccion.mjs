/* =====================================================================
   RWAdar · comprobación contra PRODUCCIÓN
   ---------------------------------------------------------------------
       node probar-produccion.mjs

   Las otras pruebas corren contra un Postgres embebido y demuestran que
   el esquema del repositorio es correcto. Esta demuestra otra cosa
   distinta y más incómoda: qué hace **la base que está en línea ahora
   mismo**, que no es necesariamente la misma. Vale para saber qué se
   puede enseñar en una presentación sin llevarse un susto.

   Por defecto SOLO lee superficies públicas. El modo que crea una cuenta y
   prueba mutaciones requiere tres variables explícitas y una confirmación;
   nunca forma parte de npm test ni se ejecuta automáticamente.

   No escribe nada en las tablas del registro (plataformas, fuentes):
   solo crea y destruye una cuenta de usar y tirar.
   ===================================================================== */
const URL_BASE = (process.env.RWADAR_SMOKE_URL || '').replace(/\/$/, '');
const CLAVE    = process.env.RWADAR_SMOKE_ANON_KEY || '';
const MUTANTE  = process.env.RWADAR_SMOKE_MUTANTE === 'SI';
let referencia = '';
try {
  const objetivo = new URL(URL_BASE);
  referencia = objetivo.hostname.split('.')[0];
  if (objetivo.protocol !== 'https:'
      || !/^[a-z0-9]{20}$/.test(referencia)
      || objetivo.hostname !== `${referencia}.supabase.co`) throw new Error();
} catch {
  console.error('Define RWADAR_SMOKE_URL con un proyecto Supabase HTTPS explícito.');
  process.exit(1);
}
if (!CLAVE) {
  console.error('Falta RWADAR_SMOKE_ANON_KEY; no se usa ninguna clave predeterminada.');
  process.exit(1);
}
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

if (!MUTANTE) {
  nota('Modo solo lectura: no se creó cuenta ni se intentó ninguna mutación.');
  console.log('');
  ok.forEach(t => console.log('  OK    ' + t));
  fail.forEach(t => console.log('  FALLA ' + t));
  notas.forEach(t => console.log('  nota  ' + t));
  console.log(`\n${ok.length} correctas, ${fail.length} fallidas\n`);
  process.exit(fail.length ? 1 : 0);
}

const confirmacionEsperada = `PROBAR-MUTACIONES-${referencia}`;
if (process.env.RWADAR_SMOKE_CONFIRMACION !== confirmacionEsperada) {
  console.error(`Modo mutante bloqueado. Define RWADAR_SMOKE_CONFIRMACION=${confirmacionEsperada}`);
  process.exit(2);
}

let correo = '';
let clave = '';
let cuentaCreada = false;
let altaIntentada = false;
let altaRespondio = false;
let limpiezaConfirmada = false;
let plataforma = null;
let texto = '';

try {
/* --- 2 · registrarse -------------------------------------------------- */
correo = `prueba-${Date.now()}@rwadar-pruebas.example.com`;
clave  = 'p' + Math.random().toString(36).slice(2) + 'Aa9!';

altaIntentada = true;
const alta = await pide('/auth/v1/signup', {
  method: 'POST', body: JSON.stringify({ email: correo, password: clave }),
});
altaRespondio = true;
paso('el registro no da error', alta.ok);
cuentaCreada = alta.ok;

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
  throw new Error('el alta pudo crear una cuenta, pero no entregó sesión para limpiarla');
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
plataforma = pl.cuerpo && pl.cuerpo[0];

/* El contrato vigente solo admite la RPC. Un 404 de guardar_opinion es fallo,
   nunca permiso para degradar a INSERT directo. */
texto = 'Opinion de prueba automatica: se escribe y se borra sola al terminar la comprobacion.';
const dmlDirecto = await pide('/opiniones', {
  method: 'POST',
  body: JSON.stringify({ usuario_id: uid, plataforma_id: plataforma.id,
    nota: 8, texto: `${texto} DML directo` }),
});
const prohibido = (r) => r.estado === 401 || r.estado === 403
  || (r.cuerpo && r.cuerpo.code === '42501');
paso('el INSERT directo en opiniones está prohibido',
  !dmlDirecto.ok && prohibido(dmlDirecto));

const opinar = await pide('/rpc/guardar_opinion', {
  method: 'POST',
  body: JSON.stringify({ p_plataforma: plataforma.id, p_nota: 8, p_texto: texto }),
});
paso(`la RPC nueva permite opinar sobre ${plataforma.nombre}`, opinar.ok);
if (!opinar.ok) nota(`opinar → ${opinar.estado} ${JSON.stringify(opinar.cuerpo)}`);
const opinionId = typeof opinar.cuerpo === 'string' ? opinar.cuerpo : null;

if (opinionId) {
  const actualizarDirecto = await pide(`/opiniones?opinion_id=eq.${opinionId}`, {
    method: 'PATCH', body: JSON.stringify({ texto: `${texto} alterado` }),
  });
  const borrarDirecto = await pide(`/opiniones?opinion_id=eq.${opinionId}`, {
    method: 'DELETE',
  });
  paso('UPDATE y DELETE directos también están prohibidos',
    !actualizarDirecto.ok && prohibido(actualizarDirecto)
    && !borrarDirecto.ok && prohibido(borrarDirecto));
} else {
  paso('UPDATE y DELETE directos también están prohibidos', false);
}

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

/* --- 6b · solo las superficies deliberadamente públicas de la web ------ */
const tablas = ['opiniones_publicas','nota_media','vigilancia','perfiles',
                'mi_perfil','plataformas'];
const sinPermiso = [];
for (const t of tablas) {
  const r = await pide(`/${t}?select=*&limit=1`);
  if (r.estado === 403 || (r.cuerpo && r.cuerpo.code === '42501')) sinPermiso.push(t);
}
paso('las superficies deliberadas de la web conservan permiso', sinPermiso.length === 0);
if (sinPermiso.length) nota('SIN PERMISO para `authenticated`: ' + sinPermiso.join(', '));

/* --- 7 · moderar: solo existe la firma desacoplada por opinion_id ------- */
const firmaVieja = await pide('/rpc/moderar', {
  method: 'POST',
  body: JSON.stringify({ p_usuario: uid, p_plataforma: plataforma.id, p_accion: 'ocultar', p_motivo: 'prueba' }),
});
const firmaNueva = await pide('/rpc/moderar', {
  method: 'POST',
  body: JSON.stringify({ p_opinion_id: opinionId, p_accion: 'ocultar', p_motivo: 'prueba' }),
});
const noExiste = r => r.estado === 404 ||
  (r.cuerpo && typeof r.cuerpo === 'object' && r.cuerpo.code === 'PGRST202');

nota(`moderar(p_usuario, p_plataforma, …) → ${firmaVieja.estado} ${noExiste(firmaVieja) ? 'NO EXISTE' : 'existe'}`);
nota(`moderar(p_opinion_id, …)            → ${firmaNueva.estado} ${noExiste(firmaNueva) ? 'NO EXISTE' : 'existe'}`);
paso('la firma antigua de moderación no existe', noExiste(firmaVieja));
paso('la firma nueva existe y rechaza a quien no es administrador',
  !noExiste(firmaNueva) && !firmaNueva.ok
  && JSON.stringify(firmaNueva.cuerpo).includes('administrador'));

} catch (error) {
  fail.push('el smoke mutante terminó sin completar su recorrido');
  nota(`error inesperado → ${error instanceof Error ? error.message : String(error)}`);
} finally {
  /* La limpieza se intenta aunque falle cualquier comprobación anterior. La
     cuenta solo se declara borrada si RPC, revocación de login y ausencia de
     contenido público quedan verificadas. */
  // Si la respuesta del alta se perdió o no trajo sesión, se intenta obtenerla
  // con las mismas credenciales antes de declarar una cuenta inaccesible.
  if (altaIntentada && !sesion && correo && clave) {
    try {
      const recuperarSesion = await pide('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email: correo, password: clave }),
      });
      if (recuperarSesion.ok) {
        sesion = recuperarSesion.cuerpo;
        cuentaCreada = true;
      }
    } catch (error) {
      nota(`recuperar sesión para limpiar → ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (sesion && altaIntentada) {
    let borrado = null;
    for (let intento = 1; intento <= 2 && !borrado?.ok; intento += 1) {
      try {
        borrado = await pide('/rpc/borrar_mi_cuenta', { method: 'POST', body: '{}' });
      } catch (error) {
        nota(`limpieza intento ${intento} → ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (borrado?.ok) {
      sesion = null;
      let credencialesRevocadas = false;
      let contenidoEliminado = plataforma === null;
      try {
        const reingreso = await pide('/auth/v1/token?grant_type=password', {
          method: 'POST', body: JSON.stringify({ email: correo, password: clave }),
        });
        const detalle = JSON.stringify(reingreso.cuerpo || '').toLowerCase();
        credencialesRevocadas = !reingreso.ok
          && [400, 401].includes(reingreso.estado)
          && /invalid|credential|login/.test(detalle);

        if (plataforma) {
          const quedaOpinion = await pide(
            `/opiniones_publicas?plataforma_id=eq.${plataforma.id}&select=texto`,
          );
          contenidoEliminado = quedaOpinion.ok
            && !JSON.stringify(quedaOpinion.cuerpo).includes(texto);
        }
      } catch (error) {
        nota(`verificación de limpieza → ${error instanceof Error ? error.message : String(error)}`);
      }
      limpiezaConfirmada = credencialesRevocadas && contenidoEliminado;
    } else {
      nota(`ALERTA: borrar_mi_cuenta no confirmó el borrado de ${correo}`);
    }
  } else if (altaRespondio && !cuentaCreada) {
    limpiezaConfirmada = true; // el servidor rechazó el alta: no creó la cuenta
  } else if (altaIntentada) {
    nota(`ALERTA: posible cuenta residual ${correo}; el alta no dejó sesión para borrarla`);
  } else {
    limpiezaConfirmada = true; // no hubo alta aceptada que limpiar
  }

  paso('la limpieza final queda confirmada o no hubo cuenta creada',
    limpiezaConfirmada);
}

/* ------------------------------------------------------------------------ */
console.log('');
ok.forEach(t => console.log('  OK    ' + t));
fail.forEach(t => console.log('  FALLA ' + t));
if (notas.length) { console.log(''); notas.forEach(t => console.log('  nota  ' + t)); }
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
if (cuentaCreada && limpiezaConfirmada) {
  console.log('Cuenta de prueba borrada y revocación verificada: ' + correo + '\n');
} else if (altaRespondio && !cuentaCreada) {
  console.log('El servidor rechazó el alta; no se creó una cuenta de prueba.\n');
} else if (altaIntentada) {
  console.log('ALERTA: limpieza NO confirmada; revisar manualmente: ' + correo + '\n');
} else {
  console.log('No se creó ninguna cuenta de prueba.\n');
}
process.exit(fail.length ? 1 : 0);

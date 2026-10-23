/* =====================================================================
   RWAdar · panel · salud de la web y la app
   ---------------------------------------------------------------------
   Cada comprobación devuelve un estado y, si algo va mal, qué hacer en
   palabras llanas. Estados: ok · aviso · fallo · sin-datos (falta una
   clave o un servicio no contesta y no se puede saber).

   Solo usa fetch: corre igual en el ordenador y dentro de Cloudflare.
   La comprobación «a fondo», que necesita el repositorio, está aparte
   en a-fondo.js y solo existe en el panel del ordenador.
   ===================================================================== */
'use strict';
const { FaltaCredencial, pedir } = require('./pedir');

const LENTA_MS = 3000;
const COPIA_MAX_HORAS = 36;
const PAGINAS_CLAVE = ['/academy/', '/privacidad', '/metodologia', '/sitemap.xml', '/novedades.xml', '/sw.js', '/manifest.webmanifest'];
const ORDEN = { fallo: 0, aviso: 1, 'sin-datos': 2, ok: 3 };

const fechaCorta = iso => iso ? new Date(iso).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' }) : '—';
const r = (estado, detalle, arreglo = null) => ({ estado, detalle, arreglo });

function crearSalud({ config, supabase, github }) {
  const COMPROBACIONES = [
    { id: 'web', area: 'Web', nombre: 'La portada responde', ejecutar: async ctx => {
      const p = await ctx.portada();
      if (!p.ok) return r('fallo', `La portada responde ${p.estado}`, 'Si no la habéis apagado a propósito, pídele a Claude o a Codex que miren el último despliegue.');
      if (p.ms > LENTA_MS) return r('aviso', `Tarda ${(p.ms / 1000).toFixed(1)} s en responder`, 'Si se repite, revisa el estado de Cloudflare.');
      return r('ok', `Responde en ${p.ms} ms`);
    } },
    { id: 'seguridad', area: 'Web', nombre: 'Cabeceras de seguridad', ejecutar: async ctx => {
      const p = await ctx.portada();
      if (!p.ok) return r('sin-datos', 'La portada no responde');
      const csp = p.cabeceras.get('content-security-policy') || '';
      const faltan = [!/script-src 'self'/.test(csp) && 'CSP estricta', !p.cabeceras.get('strict-transport-security') && 'HSTS'].filter(Boolean);
      return faltan.length ? r('fallo', `Falta: ${faltan.join(', ')}`, 'Revisa rwadar-site/_headers y vuelve a publicar.') : r('ok', 'CSP estricta y HSTS presentes');
    } },
    { id: 'paginas', area: 'Web', nombre: 'Páginas clave', ejecutar: async ctx => {
      if (!(await ctx.portada()).ok) return r('sin-datos', 'La portada no responde');
      const respuestas = await Promise.all(PAGINAS_CLAVE.map(async ruta => [ruta, await pedir(config.web + ruta)]));
      const malas = respuestas.filter(([, x]) => !x.ok).map(([ruta, x]) => `${ruta} (${x.estado})`);
      return malas.length ? r('fallo', `No cargan: ${malas.join(', ')}`, 'Pídele a Claude o a Codex que vuelvan a publicar la web.') : r('ok', `${PAGINAS_CLAVE.length} de ${PAGINAS_CLAVE.length} cargan`);
    } },
    { id: 'android', area: 'App', nombre: 'Enlace de descarga Android', ejecutar: async () => {
      const x = await pedir(`${config.web}/android`, { redirect: 'manual' });
      const destino = x.cabeceras.get('location') || '';
      return x.estado >= 300 && x.estado < 400 && destino.includes(config.repoDescargas.split('/')[1])
        ? r('ok', 'rwadar.pages.dev/android lleva a la última versión')
        : r('fallo', `/android responde ${x.estado} y no lleva a GitHub`, 'Revisa la línea /android de rwadar-site/_redirects.');
    } },
    { id: 'app', area: 'App', nombre: 'Última versión publicada', ejecutar: async ctx => {
      const { ultima } = await ctx.app();
      if (!ultima) return r('fallo', 'No hay ninguna versión final publicada en RWAdar-downloads');
      if (!ultima.tieneApk) return r('fallo', `${ultima.version} no tiene APK adjunto`, 'Sube el APK a esa versión en GitHub.');
      return r('ok', `${ultima.version} · ${fechaCorta(ultima.publicada)}`);
    } },
    { id: 'supabase', area: 'Base de datos', nombre: 'Lectura pública del catálogo', ejecutar: async ctx => {
      const c = await ctx.catalogo();
      return r('ok', `Responde en ${c.ms} ms`);
    } },
    { id: 'auth', area: 'Base de datos', nombre: 'Servicio de cuentas', ejecutar: async () => {
      const a = await supabase.saludAuth();
      return a.ok ? r('ok', `Responde en ${a.ms} ms`) : r('fallo', `Responde ${a.estado}`, 'Nadie puede entrar ni registrarse. Mira Supabase › Logs › Auth.');
    } },
    { id: 'retirado', area: 'Catálogo', nombre: 'Catálogo visible', ejecutar: async ctx => {
      const c = await ctx.catalogo();
      return c.retirado
        ? r('fallo', `Retirado: ni la web ni la app lo enseñan${c.motivo ? ` («${c.motivo}»)` : ''}`, 'Si no fue a propósito, vuelve a mostrarlo en Interruptores.')
        : r('ok', 'Visible en la web y en la app');
    } },
    { id: 'vigencia', area: 'Catálogo', nombre: 'Revisión al día', ejecutar: async () => {
      const v = await supabase.vigenciaCatalogo();
      if (v.diasRestantes === null) return r('fallo', 'La base no devuelve ninguna revisión publicada');
      const incompleto = v.plataformasEsperadas && (v.plataformas < v.plataformasEsperadas || v.ofertas < v.ofertasEsperadas);
      const cifras = `${v.plataformas} plataformas y ${v.ofertas} ofertas`;
      if (v.diasRestantes < 0) return r('fallo', `Caducó el ${v.caducaEl}. Se enseña con aviso y sin cifras vencidas`, 'Pide «haz la investigación» para renovar el catálogo.');
      if (incompleto) return r('aviso', `Faltan filas: ${cifras} de ${v.plataformasEsperadas} y ${v.ofertasEsperadas}`, 'La web conserva la última copia completa; revisa la importación.');
      if (v.diasRestantes <= 2) return r('aviso', `Caduca el ${v.caducaEl} (quedan ${v.diasRestantes} días) · ${cifras}`, 'Pide «haz la investigación» antes de que caduque.');
      return r('ok', `Vigente hasta el ${v.caducaEl} · ${cifras}`);
    } },
    { id: 'copias', area: 'Mantenimiento', nombre: 'Copia de seguridad nocturna', ejecutar: async ctx => {
      const copia = (await ctx.tareas()).find(t => /copia/i.test(t.nombre));
      if (!copia) return r('aviso', 'No encuentro la tarea de copia en GitHub Actions');
      const horas = (Date.now() - new Date(copia.fecha).getTime()) / 3600000;
      if (copia.resultado !== 'success' && copia.resultado !== 'en-curso') return r('fallo', `La última falló (${fechaCorta(copia.fecha)})`, 'Ábrela en GitHub para ver el motivo; sin copia no hay red si algo se rompe.');
      if (horas > COPIA_MAX_HORAS) return r('aviso', `La última es de hace ${Math.round(horas)} h`, 'Debería correr cada noche a las 02:43 UTC.');
      return r('ok', `Correcta · ${fechaCorta(copia.fecha)}`);
    } },
    { id: 'tareas', area: 'Mantenimiento', nombre: 'Otras tareas automáticas', ejecutar: async ctx => {
      const fallidas = (await ctx.tareas()).filter(t => !/copia/i.test(t.nombre) && ['failure', 'timed_out', 'startup_failure'].includes(t.resultado));
      return fallidas.length
        ? r('aviso', `Última ejecución fallida: ${fallidas.map(t => t.nombre).join(', ')}`, 'Míralas en Salud › Tareas automáticas y ábrelas en GitHub para ver el motivo.')
        : r('ok', 'Ninguna con la última ejecución fallida');
    } },
  ];

  function contexto() {
    const una = f => { let p; return () => (p ??= f()); };
    return {
      portada: una(() => pedir(`${config.web}/`, { redirect: 'manual' })),
      catalogo: una(() => supabase.estadoCatalogo()),
      app: una(() => github.descargasApp()),
      tareas: una(() => github.tareasAutomaticas()),
    };
  }

  async function comprobar() {
    const ctx = contexto();
    const comprobaciones = await Promise.all(COMPROBACIONES.map(async c => {
      let resultado;
      try { resultado = await c.ejecutar(ctx); } catch (e) {
        resultado = e instanceof FaltaCredencial ? r('sin-datos', e.message)
          : r('fallo', e.message, e.codigo === 'permiso' ? e.detalle : 'Puede ser un corte momentáneo: vuelve a comprobar en un minuto.');
      }
      return { id: c.id, area: c.area, nombre: c.nombre, ...resultado };
    }));
    const problemas = comprobaciones.filter(c => c.estado === 'fallo' || c.estado === 'aviso').sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);
    const global = problemas.some(p => p.estado === 'fallo') ? 'fallo' : problemas.length ? 'aviso' : 'ok';
    let tareas = [];
    try { tareas = await ctx.tareas(); } catch { tareas = []; }
    return { global, comprobado: new Date().toISOString(), comprobaciones, problemas, tareas };
  }

  return { comprobar };
}

module.exports = { crearSalud, PAGINAS_CLAVE };

'use strict';

// External QA helper. Importing this file never performs I/O. Credentials,
// session cookies and response bodies stay in memory and never enter its report.
const ORIGENES = Object.freeze({ preview: 'https://revision.rwadar.pages.dev', produccion: 'https://rwadar.pages.dev' });
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PAGINAS = ['/', '/academy/', '/academy/que-significa-tokenizar-un-activo'];
const COOKIE = '__Host-rwadar-acceso';
const MAX_TOTAL = 32 * 1024 * 1024;
const MAX_RECURSOS = 160;

class FalloQa extends Error {
  constructor(codigo) { super(codigo); this.codigo = codigo; }
}

function conAborto(promesa, signal) {
  return new Promise((resolve, reject) => {
    const cancelar = () => reject(new FalloQa('plazo_agotado'));
    if (signal.aborted) cancelar();
    else signal.addEventListener('abort', cancelar, { once: true });
    Promise.resolve(promesa).then(resolve, reject).finally(() => signal.removeEventListener('abort', cancelar));
  });
}

function cookieDe(response) {
  const valores = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie() : [response.headers.get('set-cookie') || ''];
  const candidatas = valores.filter(v => v.startsWith(COOKIE + '='));
  if (candidatas.length !== 1) throw new FalloQa('cookie_ausente_o_duplicada');
  const partes = candidatas[0].split(';').map(v => v.trim());
  const par = partes[0];
  if (!/^__Host-rwadar-acceso=[A-Za-z0-9_.-]+$/.test(par)) throw new FalloQa('cookie_formato_invalido');
  const atributos = partes.slice(1).map(v => v.toLowerCase());
  return { par, flags: {
    httpOnly: atributos.includes('httponly'), secure: atributos.includes('secure'),
    sameSite: atributos.includes('samesite=lax'), path: atributos.includes('path=/'),
    sinDomain: !atributos.some(v => v.startsWith('domain=')),
  } };
}

function recursosDe(html, origen, ruta) {
  const recursos = new Set();
  for (const [, tipo, atributos] of html.matchAll(/<(script|link|img|source)\b([^>]*)>/gi)) {
    const leer = nombre => atributos.match(new RegExp('\\b' + nombre + '\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]', 'i'))?.[1] || '';
    if (tipo.toLowerCase() === 'link' && !/^(?:stylesheet|icon|preload|modulepreload)$/i.test(leer('rel'))) continue;
    const valores = [leer(tipo.toLowerCase() === 'link' ? 'href' : 'src')];
    if (['img', 'source'].includes(tipo.toLowerCase())) valores.push(...leer('srcset').split(',').map(v => v.trim().split(/\s+/)[0]));
    for (const valor of valores.filter(Boolean)) {
      let url;
      try { url = new URL(valor.replace(/&amp;/g, '&'), origen + ruta); } catch { throw new FalloQa('recurso_url_invalida'); }
      if (url.origin !== origen) continue;
      if (url.username || url.password || /^\/api\//.test(url.pathname)) throw new FalloQa('recurso_ruta_rechazada');
      url.hash = '';
      recursos.add(url.pathname + url.search);
    }
  }
  return recursos;
}

async function verificarWebQa({ modo, correo, clave, accessToken, fetchImpl = fetch } = {}) {
  if (!Object.hasOwn(ORIGENES, modo)) throw new FalloQa('modo_invalido');
  if (typeof correo !== 'string' || !correo || typeof clave !== 'string' || !clave ||
      (accessToken != null && (typeof accessToken !== 'string' || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken) || accessToken.length > 3800)) ||
      typeof fetchImpl !== 'function') throw new FalloQa('credenciales_qa_invalidas');

  const origen = ORIGENES[modo], inicio = Date.now(), limite = inicio + 90000;
  const aborto = new AbortController();
  // Reserve the last 15 seconds for logging out this fresh BFF session.
  const temporizador = setTimeout(() => aborto.abort(), 75000);
  const informe = { scope: 'web-authenticated-qa-only', modo, origen, startedAt: new Date(inicio).toISOString(),
    status: 'failed', checks: [], counts: { requests: 0, bytesRead: 0, pages: 0, assets: 0 },
    credentialsRecorded: false, mailSent: false, authenticatedAndroidQA: false, releaseApproved: false };
  let cookie = '', fallo = null;
  const secretos = [correo, clave, accessToken].filter(v => typeof v === 'string' && v.length);

  function comprobar(nombre, ok, datos = {}) {
    informe.checks.push({ name: nombre, passed: Boolean(ok), ...datos });
    if (!ok) throw new FalloQa(nombre);
  }
  async function pedir(ruta, { metodo = 'GET', sesion = '', datos, bearer = '', signal = aborto.signal, maxBytes = 2 * 1024 * 1024 } = {}) {
    if (Date.now() >= limite || signal.aborted) throw new FalloQa('plazo_agotado');
    const url = new URL(ruta, origen);
    if (url.origin !== origen || url.username || url.password || url.hash) throw new FalloQa('origen_rechazado');
    informe.counts.requests++;
    const response = await conAborto(Promise.resolve().then(() => fetchImpl(url.href, { method: metodo, redirect: 'manual', cache: 'no-store',
      credentials: 'omit', referrerPolicy: 'no-referrer', signal,
      headers: { Accept: ruta.startsWith('/api/') ? 'application/json' : 'text/html,*/*;q=0.8',
        ...(metodo === 'POST' ? { Origin: origen, 'Content-Type': 'application/json' } : {}),
        ...(sesion ? { Cookie: sesion } : {}), ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}) },
      ...(datos === undefined ? {} : { body: JSON.stringify(datos) }) })), signal);
    if (Number(response.headers.get('content-length')) > maxBytes) { await conAborto(response.body?.cancel(), signal); throw new FalloQa('respuesta_excesiva'); }
    const reader = response.body?.getReader();
    let bytes = 0, texto = '';
    if (reader) {
      const decoder = new TextDecoder();
      try {
        while (true) {
          if (signal.aborted || Date.now() >= limite) throw new FalloQa('plazo_agotado');
          const parte = await conAborto(reader.read(), signal);
          if (parte.done) break;
          bytes += parte.value.byteLength;
          informe.counts.bytesRead += parte.value.byteLength;
          if (bytes > maxBytes || informe.counts.bytesRead > MAX_TOTAL) { await conAborto(reader.cancel(), signal); throw new FalloQa('respuesta_excesiva'); }
          texto += decoder.decode(parte.value, { stream: true });
        }
        texto += decoder.decode();
      } finally { reader.releaseLock(); }
    }
    return { response, texto, bytes };
  }
  function json(texto) { try { return JSON.parse(texto); } catch { throw new FalloQa('json_invalido'); } }
  function privado(response) {
    return /(?:^|,)\s*private(?:,|$)/i.test(response.headers.get('cache-control') || '') &&
      /\bno-store\b/i.test(response.headers.get('cache-control') || '');
  }
  function bloqueada(response) {
    if (response.status !== 303) return false;
    try { const url = new URL(response.headers.get('location') || '', origen); return url.origin === origen && url.pathname === '/acceso'; }
    catch { return false; }
  }

  try {
    const anonima = await pedir('/');
    comprobar('anonimo_raiz_bloqueada', bloqueada(anonima.response), { path: '/', status: anonima.response.status });
    const anonCatalogo = await pedir('/api/acceso/catalogo/catalogo_ofertas_publicas_v2?select=slug&limit=49', { maxBytes: 65536 });
    comprobar('anonimo_catalogo_bloqueado', [401, 403].includes(anonCatalogo.response.status),
      { path: '/api/acceso/catalogo/catalogo_ofertas_publicas_v2', status: anonCatalogo.response.status });

    const entrada = await pedir('/api/acceso/entrar', { metodo: 'POST', datos: { correo, clave }, maxBytes: 65536 });
    comprobar('entrada_qa', entrada.response.status === 200, { path: '/api/acceso/entrar', status: entrada.response.status });
    const extraida = cookieDe(entrada.response);
    cookie = extraida.par; // Only the cookie minted by this login may be logged out.
    const tokenBff = cookie.slice(COOKIE.length + 1);
    secretos.push(tokenBff);
    accessToken ||= tokenBff;
    comprobar('jwt_tutorial_formato', /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken) && accessToken.length <= 3800);
    comprobar('cookie_protegida', Object.values(extraida.flags).every(Boolean), { flags: extraida.flags });
    const inicioSesion = json(entrada.texto);
    comprobar('entrada_uuid', inicioSesion.autenticada === true && UUID.test(inicioSesion.usuario?.id || ''));
    const sesion = await pedir('/api/acceso/sesion', { sesion: cookie, maxBytes: 65536 });
    const estado = json(sesion.texto);
    comprobar('sesion_uuid', sesion.response.status === 200 && estado.autenticada === true &&
      UUID.test(estado.usuario?.id || '') && estado.usuario.id === inicioSesion.usuario.id && privado(sesion.response),
    { path: '/api/acceso/sesion', status: sesion.response.status });
    let sub;
    try { sub = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8')).sub; } catch { throw new FalloQa('token_setup_invalido'); }
    comprobar('misma_cuenta_tutorial_y_bff', sub === estado.usuario.id);

    const recursos = new Set();
    for (const ruta of PAGINAS) {
      const pagina = await pedir(ruta, { sesion: cookie });
      comprobar('pagina_privada', pagina.response.status === 200 && /text\/html/i.test(pagina.response.headers.get('content-type') || '') &&
        /<html\b/i.test(pagina.texto) && privado(pagina.response), { path: ruta, status: pagina.response.status, bytes: pagina.bytes });
      informe.counts.pages++;
      for (const recurso of recursosDe(pagina.texto, origen, ruta)) recursos.add(recurso);
    }
    comprobar('recursos_observados_acotados', recursos.size > 0 && recursos.size <= MAX_RECURSOS, { count: recursos.size });
    const lista = [...recursos];
    for (let i = 0; i < lista.length; i += 6) {
      const resultados = await Promise.allSettled(lista.slice(i, i + 6).map(async ruta => {
        const recurso = await pedir(ruta, { sesion: cookie, maxBytes: 4 * 1024 * 1024 });
        comprobar('recurso_html', recurso.response.status === 200 && recurso.bytes > 0,
          { path: new URL(ruta, origen).pathname, status: recurso.response.status, bytes: recurso.bytes });
        informe.counts.assets++;
      }));
      const rechazado = resultados.find(r => r.status === 'rejected');
      if (rechazado) throw rechazado.reason;
    }
    for (const [tabla, esperadas] of [['catalogo_plataformas_publicas_v2', 26], ['catalogo_ofertas_publicas_v2', 49]]) {
      const ruta = '/api/acceso/catalogo/' + tabla;
      const catalogo = await pedir(ruta + '?select=slug&limit=1001', { sesion: cookie, maxBytes: 1024 * 1024 });
      const filas = json(catalogo.texto);
      const unicas = Array.isArray(filas) ? new Set(filas.map(f => f.slug)).size : 0;
      comprobar('conteo_' + tabla, catalogo.response.status === 200 && Array.isArray(filas) && filas.length === esperadas &&
        unicas === esperadas && filas.every(f => typeof f.slug === 'string' && f.slug.length > 0) && privado(catalogo.response),
      { path: ruta, status: catalogo.response.status, count: Array.isArray(filas) ? filas.length : null, expected: esperadas });
    }

    const tutorial = await pedir('/api/acceso/tutorial', { bearer: accessToken, maxBytes: 65536 });
    comprobar('tutorial_bearer_html', tutorial.response.status === 200 && /text\/html/i.test(tutorial.response.headers.get('content-type') || '') &&
      /<html\b/i.test(tutorial.texto) && privado(tutorial.response) && !tutorial.texto.includes(accessToken),
    { path: '/api/acceso/tutorial', status: tutorial.response.status });
    const tutorialCookie = cookieDe(tutorial.response);
    comprobar('tutorial_cookie_protegida', Object.values(tutorialCookie.flags).every(Boolean) && tutorialCookie.par === COOKIE + '=' + accessToken,
      { flags: tutorialCookie.flags });
  } catch (error) {
    fallo = error instanceof FalloQa ? error.codigo : aborto.signal.aborted ? 'plazo_agotado' : 'fallo_transporte';
  } finally {
    clearTimeout(temporizador);
    aborto.abort();
    if (cookie) {
      const limpiar = new AbortController();
      const tiempo = Math.max(1, Math.min(15000, limite - Date.now()));
      const reloj = setTimeout(() => limpiar.abort(), tiempo);
      try {
        const cierre = await pedir('/api/acceso/salir', { metodo: 'POST', datos: {}, sesion: cookie, signal: limpiar.signal, maxBytes: 65536 });
        const resultado = json(cierre.texto);
        const borrada = cierre.response.headers.get('set-cookie') || '';
        comprobar('logout_solo_sesion_bff', cierre.response.status === 200 && resultado.cerrado === true && resultado.cierreRemoto === true &&
          borrada.startsWith(COOKIE + '=;') && /(?:^|;)\s*Max-Age=0(?:;|$)/i.test(borrada),
        { path: '/api/acceso/salir', status: cierre.response.status, scope: 'local-fresh-bff-session' });
        const vieja = await pedir('/', { sesion: cookie, signal: limpiar.signal, maxBytes: 65536 });
        comprobar('cookie_revocada_no_abre_raiz', bloqueada(vieja.response), { path: '/', status: vieja.response.status });
      } catch (error) {
        informe.cleanupError = error instanceof FalloQa ? error.codigo : limpiar.signal.aborted ? 'plazo_cierre_agotado' : 'fallo_cierre_transporte';
        fallo ||= 'cierre_no_verificado';
      } finally { clearTimeout(reloj); limpiar.abort(); cookie = ''; }
    }
  }
  informe.status = fallo ? 'failed' : 'passed-scoped-only';
  if (fallo) informe.error = fallo;
  informe.durationMs = Date.now() - inicio;
  // Defensive final pass, including any unexpected credential-shaped HTML path.
  let salida = JSON.stringify(informe);
  for (const secreto of secretos) {
    salida = salida.split(secreto).join('[redactado]').split(encodeURIComponent(secreto)).join('[redactado]');
  }
  accessToken = ''; secretos.fill('');
  return JSON.parse(salida);
}

module.exports = { verificarWebQa };

if (require.main === module) {
  (async () => {
    const fs = require('node:fs/promises');
    const path = require('node:path');
    let resultado;
    try {
      if (process.argv.length !== 2) throw new FalloQa('argumentos_no_permitidos');
      resultado = await verificarWebQa({ modo: 'preview', correo: process.env.RWADAR_QA_EMAIL, clave: process.env.RWADAR_QA_PASSWORD });
    } catch (error) {
      resultado = { scope: 'web-authenticated-qa-only', modo: 'preview', status: 'failed',
        error: error instanceof FalloQa ? error.codigo : 'qa_ejecucion_fallida',
        credentialsRecorded: false, mailSent: false, releaseApproved: false };
    }
    try {
      const directorio = path.join(process.cwd(), 'evidence-private');
      await fs.mkdir(directorio, { recursive: true, mode: 0o700 });
      await fs.writeFile(path.join(directorio, 'web-preview-result.json'), JSON.stringify(resultado, null, 2) + '\n', { mode: 0o600 });
      console.log(JSON.stringify({ status: resultado.status, counts: resultado.counts || {}, ...(resultado.error ? { error: resultado.error } : {}) }));
      if (resultado.status !== 'passed-scoped-only') process.exitCode = 1;
    } catch {
      console.error('No se pudo guardar el informe saneado de QA web.');
      process.exitCode = 1;
    }
  })().catch(() => { console.error('La QA web no pudo terminar.'); process.exitCode = 1; });
}

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const sitio = path.join(raiz, 'rwadar-site');
const publicado = path.join(raiz, 'rwadar-publicado');
const lee = nombre => fs.readFileSync(path.join(sitio, nombre), 'utf8');
const require = createRequire(import.meta.url);
const { adelgazarJS, sinComentariosJS } = require('./rwadar-adelgazar.js');
const {
  ORIGEN_LEGADO,
  ORIGEN_PUBLICO,
  PROYECTO_CLOUDFLARE,
  comprobarConfiguracionAuth,
  comprobarEstadoLegalPublicacion,
  comprobarOrigenPublico,
  huellaContenido,
  listarArchivosRegulares,
  nombreAssetVersionado,
  validarOrigenPublicable,
  versionCacheDesdeEntradas,
} = require('./rwadar-publicacion-segura.js');
const { celdaCSV } = require('./rwadar-app/sincronizar.js');
const html = lee('index.html');
const privacidad = lee('privacidad.html');
const error404 = lee('404.html');
const headers = lee('_headers');
const redirecciones = lee('_redirects');
const sw = lee('sw.js');
const publicador = fs.readFileSync(path.join(raiz, 'rwadar-publicar.js'), 'utf8');
const capturadorPortadas = fs.readFileSync(path.join(raiz, 'rwadar-capturar-portadas.mjs'), 'utf8');
const sincronizador = fs.readFileSync(path.join(raiz, 'rwadar-app', 'sincronizar.js'), 'utf8');
const servidor = fs.readFileSync(path.join(raiz, 'rwadar-servir.js'), 'utf8');
const arrancador = fs.readFileSync(path.join(raiz, 'rwadar-arrancar.js'), 'utf8');
const documentos = ['CLAUDE.md','RWADAR-MAPA.md','RWADAR-TRASPASO.md','RWADAR-ESTADO.md','RWADAR-MANANA.md']
  .map(n=>fs.readFileSync(path.join(raiz,n),'utf8')).join('\n');
let correctas = 0;

function prueba(nombre, condicion) {
  if (!condicion) throw new Error(`FALLA: ${nombre}`);
  console.log(`  OK    ${nombre}`);
  correctas++;
}

async function capturaError(promesa) {
  try { await promesa; return null; }
  catch (e) { return e; }
}

async function authRechazaJson2xxInvalido(codigo) {
  const inicio = codigo.indexOf('async function auth(');
  const fin = codigo.indexOf('function traduce(', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const fabrica = new Function('fetch', 'CLAVE_PUB', `
    const AUTH='https://auth.invalid';
    const traduce=mensaje=>mensaje;
    ${fuente}
    return auth;
  `);
  const auth = fabrica(async()=>({
    ok:true,status:200,
    async text(){ return '<!doctype html>'; },
  }), 'sb_publishable_prueba');
  const error = await capturaError(auth('/signup', { email:'persona@example.test' }));
  return /respuesta de autenticaci[oó]n no es v[aá]lida/i.test(error?.message || '');
}

function nodoCuentaPrueba(id, valores) {
  const atributos = new Map();
  const clases = new Set();
  return {
    id, value:valores[id] || '', textContent:'', className:'', hidden:false,
    required:false, autocomplete:'', disabled:false, focused:false,
    classList:{
      contains:clase=>clases.has(clase),
      add:(...nombres)=>nombres.forEach(nombre=>clases.add(nombre)),
      remove:(...nombres)=>nombres.forEach(nombre=>clases.delete(nombre)),
    },
    setAttribute:(nombre, valor='')=>atributos.set(nombre, String(valor)),
    removeAttribute:nombre=>atributos.delete(nombre),
    getAttribute:nombre=>atributos.get(nombre) ?? null,
    focus(){ this.focused=true; },
  };
}

function estadoPendienteOcultaFormulario(codigo) {
  const inicio = codigo.indexOf('const TEXTOS={');
  const fin = codigo.indexOf('function cerrar(', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const nodos = new Map();
  const valores = { cClave:'secreto principal', cClave2:'secreto repetido' };
  const $ = id => {
    if (!nodos.has(id)) nodos.set(id, nodoCuentaPrueba(id, valores));
    return nodos.get(id);
  };
  const clasesCuerpo = new Set();
  const document = {
    activeElement:{ focus(){} },
    body:{ classList:{ add:nombre=>clasesCuerpo.add(nombre) } },
    querySelector(){ return null; },
  };
  const fabrica = new Function('$', 'document', 'matchMedia', 'setTimeout', 'clearTimeout',
    'fondo', 'closeAll', 'msj', `
      const CORREO_AUTH_E2E=true;
      let modo='entrar',correoPendiente='persona@example.test',operacionCuenta=0,
          temporizadorReenvio=null,focoCuenta=null;
      ${fuente}
      return {abrir};
    `);
  const api = fabrica($, document, ()=>({matches:true}), fn=>{ fn(); return 1; }, ()=>{},
    ()=>[], ()=>{}, ()=>{});
  api.abrir('confirmacion_pendiente');
  return $('cuentaForm').hidden === true && $('cuentaEnlaces').hidden === true &&
    $('cuentaEstado').hidden === false && $('cClave').value === '' && $('cClave2').value === '' &&
    $('cuentaEstadoCorreo').textContent === 'persona@example.test' &&
    $('cuentaReenviar').hidden === false && $('cuentaCambiarCorreo').hidden === false &&
    $('cuentaEstadoEntrar').textContent.includes('Entrar') && $('cuentaCaja').focused === true;
}

function arnesEnvioRegistro(codigo) {
  const inicio = codigo.indexOf('async function enviar(e){');
  const fin = codigo.indexOf('async function reenviarConfirmacion(){', inicio);
  if (inicio < 0 || fin < 0) throw new Error('no se encuentra enviar de Cuenta');
  const fuente = codigo.slice(inicio, fin);
  const nodos = new Map();
  const valores = {
    cCorreo:'persona@example.test', cClave:'contraseña-larga-segura', cNombre:'Persona', cClave2:'',
  };
  const $ = id => {
    if (!nodos.has(id)) nodos.set(id, nodoCuentaPrueba(id, valores));
    return nodos.get(id);
  };
  let resolver;
  const respuesta = new Promise(resuelve=>{ resolver=resuelve; });
  const aperturas = [], mensajes = [];
  let entradas = 0, limpiezas = 0;
  const fabrica = new Function('$', 'auth', 'abrir', 'entrarCon', 'testigo',
    'limpiaErroresCuenta', 'msj', 'limpiaSecretos', 'errorCuenta', 'correoValido', 'location', `
      const CORREO_AUTH_E2E=true;
      let modo='registro',operacionCuenta=0,correoPendiente='';
      ${fuente}
      return {enviar,invalidar(){operacionCuenta++;modo='entrar';}};
    `);
  const api = fabrica($, ()=>respuesta, modo=>aperturas.push(modo), async()=>{ entradas++; },
    async()=>'testigo', ()=>{}, texto=>{ if (texto) mensajes.push(texto); }, ()=>{
      limpiezas++;$('cClave').value='';$('cClave2').value='';
    }, (texto,campo)=>{ const e=new Error(texto);e.campo=campo;return e; },
    valor=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor), {origin:'https://rwadar.example'});
  const ejecucion = api.enviar({ preventDefault(){} });
  return { api, resolver, ejecucion, nodos, aperturas, mensajes,
    entradas:()=>entradas, limpiezas:()=>limpiezas };
}

async function altaSinUsuarioValidoFallaCerrada(codigo) {
  const pruebaAlta = arnesEnvioRegistro(codigo);
  pruebaAlta.resolver({ id:'usuario-sin-correo' });
  await pruebaAlta.ejecucion;
  return pruebaAlta.aperturas.length === 0 && pruebaAlta.entradas() === 0 &&
    pruebaAlta.mensajes.some(m=>/alta no es v[aá]lida/i.test(m)) && pruebaAlta.limpiezas() === 1;
}

async function operacionCuentaObsoletaNoMutaVista(codigo) {
  const pruebaAlta = arnesEnvioRegistro(codigo);
  pruebaAlta.api.invalidar();
  pruebaAlta.resolver({ id:'usuario-válido', email:'persona@example.test' });
  await pruebaAlta.ejecucion;
  return pruebaAlta.aperturas.length === 0 && pruebaAlta.entradas() === 0 &&
    pruebaAlta.mensajes.length === 0 && pruebaAlta.limpiezas() === 1 &&
    pruebaAlta.nodos.get('cuentaEnviar')?.disabled === true;
}

async function confirmarIdentidadLimpiaSesionAnteFallos(codigo) {
  const inicio = codigo.indexOf('async function confirmarIdentidad(){');
  const fin = codigo.indexOf('async function rest(', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const ejecutar = async auth => {
    const fabrica = new Function('testigo', 'auth', `
      let ses={access_token:'testigo'},versionSesion=1,identidadConfirmada=true,pintadas=0;
      const guarda=s=>{ses=s;versionSesion++;};
      const pinta=()=>{pintadas++;};
      ${fuente}
      return {confirmarIdentidad,estado:()=>({ses,identidadConfirmada,pintadas})};
    `);
    const api = fabrica(async()=>'testigo', auth);
    const resultado = await api.confirmarIdentidad();
    const estado = api.estado();
    return resultado === false && estado.ses === null && estado.identidadConfirmada === false && estado.pintadas === 1;
  };
  return await ejecutar(async()=>{ throw new Error('red caída'); }) &&
    await ejecutar(async()=>({ email:'sin-id@example.test' }));
}

function pruebaInstalacionAtomica(codigo) {
  const escuchas = {};
  let saltos = 0;
  const contexto = {
    self: {
      location: { origin:'https://rwadar.example' },
      clients: { claim:async()=>{} },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){ saltos++; },
    },
    caches: {
      async open(){ return { async addAll(){ throw new Error('recurso ausente'); } }; },
      async keys(){ return []; }, async delete(){ return true; },
    },
    URL, Response, fetch,
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let instalacion;
  escuchas.install({ waitUntil(promesa){ instalacion = promesa; } });
  return capturaError(instalacion).then(error => Boolean(error) && saltos === 0);
}

function marcadoEstricto(nombre, contenido) {
  prueba(`${nombre} no contiene bloques style`, !/<style\b/i.test(contenido));
  prueba(`${nombre} no contiene atributos style`, !/\sstyle\s*=/i.test(contenido));
  prueba(`${nombre} no contiene manejadores on*`, !/\son[a-z]+\s*=/i.test(contenido));
  const inline = [...contenido.matchAll(/<script\b([^>]*)>/gi)].filter(m =>
    !/\bsrc\s*=/i.test(m[1]) &&
    !/\btype\s*=\s*["']application\/ld\+json["']/i.test(m[1]));
  prueba(`${nombre} no contiene JavaScript ejecutable inline`, inline.length === 0);
}

function arrayDe(codigo, nombre) {
  const marca = `const ${nombre}=`;
  const inicio = codigo.indexOf(marca);
  const fin = codigo.indexOf('\n];', inicio);
  if (inicio < 0 || fin < 0) throw new Error(`no se encuentra ${nombre}`);
  return new Function(`return ${codigo.slice(inicio + marca.length, fin + 2)}`)();
}

function arrayConstante(codigo, nombre) {
  const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const encontrado = codigo.match(new RegExp(`\\bconst\\s+${escapado}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`));
  if (!encontrado) throw new Error(`no se encuentra ${nombre}`);
  return new Function(`return (${encontrado[1]})`)();
}

function atributoHTML(atributos, nombre) {
  const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const encontrado = atributos.match(new RegExp(
    `(?:^|\\s)${escapado}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=\\s|$)`, 'i'));
  return encontrado ? (encontrado[1] ?? encontrado[2] ?? encontrado[3] ?? '') : null;
}

function textoHTML(contenido) {
  return contenido.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function bloquesMediaCSS(codigo) {
  const limpio = codigo.replace(/\/\*[\s\S]*?\*\//g, comentario => ' '.repeat(comentario.length));
  const bloques = [];
  let desde = 0;
  for (;;) {
    const inicio = limpio.indexOf('@media', desde);
    if (inicio < 0) break;
    const abre = limpio.indexOf('{', inicio + 6);
    if (abre < 0) throw new Error('bloque @media sin apertura');
    let profundidad = 1;
    let i = abre + 1;
    for (; i < limpio.length && profundidad; i++) {
      if (limpio[i] === '{') profundidad++;
      else if (limpio[i] === '}') profundidad--;
    }
    if (profundidad) throw new Error('bloque @media sin cierre');
    bloques.push({
      inicio,
      fin:i,
      consulta:limpio.slice(inicio + 6, abre).trim(),
      contenido:limpio.slice(abre + 1, i - 1),
    });
    desde = i;
  }
  return bloques;
}

function cssSinBloques(codigo, bloques) {
  let resultado = codigo;
  for (const bloque of [...bloques].sort((a, b) => b.inicio - a.inicio))
    resultado = resultado.slice(0, bloque.inicio) + resultado.slice(bloque.fin);
  return resultado;
}

function declaracionesCSS(codigo, selectorBuscado) {
  return [...codigo.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(m => m[1].split(',').some(selector => selector.trim() === selectorBuscado))
    .map(m => m[2]);
}

async function pruebaActivacionCache(codigo) {
  const escuchas = {};
  const version = (codigo.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1];
  const borradas = [];
  const navegadas = [];
  const consultas = [];
  let reclamos = 0;
  const clienteAnterior = {
    id:'documento-antiguo', url:'https://rwadar.example/',
    async navigate(url){ navegadas.push(url); },
  };
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{
        async claim(){ reclamos++; },
        async matchAll(opciones){ consultas.push(opciones); return [clienteAnterior]; },
      },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return { async addAll(){}, async match(){}, async put(){} }; },
      async keys(){ return [version, 'rwadar-v-antigua', 'otra-cache-antigua']; },
      async delete(nombre){ borradas.push(nombre); return true; },
    },
    URL, Response, fetch, Set,
    setTimeout(fn){ fn(); },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let activacion;
  escuchas.activate({ waitUntil(promesa){ activacion = promesa; } });
  await activacion;
  return version && reclamos === 1 && !borradas.includes(version) &&
    borradas.length === 2 && borradas.includes('rwadar-v-antigua') && borradas.includes('otra-cache-antigua') &&
    consultas.length === 2 && consultas.every(x => x.type === 'window' && x.includeUncontrolled === true) &&
    navegadas.length === 1 && navegadas[0] === clienteAnterior.url;
}

async function pruebaActivacionSinMigracion(codigo, clienteYaRecargado) {
  const escuchas = {};
  const version = (codigo.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1];
  let consultas = 0;
  let navegaciones = 0;
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{
        async claim(){},
        async matchAll(){
          consultas++;
          const id = clienteYaRecargado && consultas > 1 ? 'documento-nuevo' : 'documento-antiguo';
          return [{ id, url:'https://rwadar.example/', async navigate(){ navegaciones++; } }];
        },
      },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return { async addAll(){}, async match(){}, async put(){} }; },
      async keys(){ return clienteYaRecargado ? [version, 'rwadar-v-anterior'] : [version, 'otra-cache']; },
      async delete(){ return true; },
    },
    URL, Response, fetch, Set,
    setTimeout(fn){ fn(); },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let activacion;
  escuchas.activate({ waitUntil(promesa){ activacion = promesa; } });
  await activacion;
  return { consultas, navegaciones };
}

async function pruebaRedConCacheRota(codigo) {
  const escuchas = {};
  const respuestasRed = new Map();
  let escrituras = 0;
  const contexto = {
    self: {
      location:{ origin:'https://rwadar.example' },
      clients:{ async claim(){} },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){},
    },
    caches: {
      async open(){ return {
        async addAll(){}, async match(){ return null; },
        async put(){ escrituras++; throw new Error('cuota de caché agotada'); },
      }; },
      async keys(){ return []; }, async delete(){ return true; },
    },
    async fetch(peticion){ return respuestasRed.get(peticion.url); },
    URL, Response,
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  try {
    for (const peticion of [
      { method:'GET', mode:'navigate', url:'https://rwadar.example/radar' },
      { method:'GET', mode:'same-origin', url:'https://rwadar.example/assets/interfaz.css' },
    ]) {
      const recibida = { status:200, type:'basic', clone(){ return this; } };
      respuestasRed.set(peticion.url, recibida);
      let respuesta;
      escuchas.fetch({ request:peticion, respondWith(promesa){ respuesta = promesa; } });
      if (await respuesta !== recibida) return false;
    }
    return escrituras === 2;
  }
  catch { return false; }
}

async function pruebaActualizacionPWACliente(codigo, controlada) {
  const marca = '/* El trabajador solo se registra en HTTP(S)';
  const inicio = codigo.indexOf(marca);
  if (inicio < 0) throw new Error('no se encuentra el registro del service worker');
  const bloque = codigo.slice(inicio);
  const escuchasVentana = {};
  const escuchasDocumento = {};
  const escuchasTrabajador = {};
  let recargas = 0;
  let actualizaciones = 0;
  let registro = null;
  const registroSW = {
    async update(){ actualizaciones++; },
  };
  const contexto = {
    navigator: {
      serviceWorker: {
        controller: controlada ? {} : null,
        addEventListener(tipo, fn){ escuchasTrabajador[tipo] = fn; },
        async register(ruta, opciones){ registro = { ruta, opciones }; return registroSW; },
      },
    },
    location: { protocol:'https:', reload(){ recargas++; } },
    window: { addEventListener(tipo, fn){ escuchasVentana[tipo] = fn; } },
    document: {
      visibilityState:'visible',
      addEventListener(tipo, fn){ escuchasDocumento[tipo] = fn; },
    },
  };
  vm.createContext(contexto);
  vm.runInContext(bloque, contexto);
  await escuchasVentana.load();
  escuchasVentana.pageshow({ persisted:true });
  escuchasDocumento.visibilitychange();
  escuchasTrabajador.controllerchange();
  escuchasTrabajador.controllerchange();
  await Promise.resolve();
  return {
    registro,
    actualizaciones,
    recargas,
    escuchaCambio:typeof escuchasTrabajador.controllerchange === 'function',
  };
}

function renderEmisionHostil(codigo) {
  const dato = [{
    s:'prueba', t:'<img src=x onerror=alert(1)>', res:'</script><script>alert(2)</script>',
    pl:'Midas', cat:'Tesoro y fondos', mon:'EUR', min:100, obj:1000, cap:500,
    pct:50, rent:3.2, plazo:12, tipo:'estimada', est:'abierta', cont:false,
    url:'https://example.com/emision', ver:'2026-08-20', pat:false,
  }];
  const preparado = codigo.replace(/const EMI=\[\s*\];/, `const EMI=${JSON.stringify(dato)};`);
  const capturado = {};
  const lista = [];
  lista.forEach = Array.prototype.forEach.bind(lista);
  const nodos = new Map();
  const nodo = id => {
    if (nodos.has(id)) return nodos.get(id);
    let contenidoTexto = '';
    const n = { id, value:'', hidden:false, style:{},
      set textContent(v){ contenidoTexto=String(v ?? ''); }, get textContent(){ return contenidoTexto; },
      set innerHTML(v){ capturado[id]=v; }, get innerHTML(){ return capturado[id]||''; },
      classList:{add(){},remove(){},toggle(){},contains(){return false}},
      add(){},focus(){},setAttribute(){},removeAttribute(){},hasAttribute(){return false},
      querySelector(){return null},querySelectorAll(){return lista},addEventListener(){},
      getBoundingClientRect(){return {left:0,top:0,width:0,height:0}},getContext(){return null},
    };
    nodos.set(id,n); return n;
  };
  const document = {
    getElementById(id){ return id==='gl'?null:nodo(id); },
    querySelector(){return null},querySelectorAll(){return lista},addEventListener(){},
    createElement(){return nodo('tmp')},body:nodo('body'),contains(){return false},activeElement:null,
  };
  const contexto = {
    document, console, Option:function(){},
    window:{matchMedia:()=>({matches:true}),addEventListener(){},document},
    matchMedia:()=>({matches:true}),requestAnimationFrame(){},setInterval(){},clearInterval(){},
    setTimeout(){},clearTimeout(){},addEventListener(){},removeEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},performance:{now:()=>0},
    IntersectionObserver:function(){this.observe=()=>{};this.unobserve=()=>{};this.disconnect=()=>{}},
    URL, Blob, Math, JSON, Date, Set, Array, Object, String, Number, Float32Array, Uint16Array,
  };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  vm.runInContext(preparado, contexto, { timeout:15000 });
  return capturado.emiLista || '';
}

function reparentadoEmisionesEsReversible(codigo) {
  const limpio = sinComentariosJS(codigo);
  return /function ordenarBuscar\(esMovil\)/.test(limpio) &&
    /const ordenMovil=\[emisiones,herramienta,barra,radarIntro,radarPortada,marcador,bannerAcademy,resultados,transparencia,academia,portadaTexto,portada\]/.test(limpio) &&
    /ordenMovil\.forEach\(nodo=>panelBuscar\.insertBefore\(nodo,referencia\)\)/.test(limpio) &&
    /function restaurarEscritorio\(\)/.test(limpio) &&
    /ancla\.parentNode\.insertBefore\(nodo,ancla\.nextSibling\)/.test(limpio) &&
    /academyLeccion\.appendChild\(explicador\)/.test(limpio);
}

function cambioTabsMovilEsCoherente(codigo) {
  const inicio = codigo.indexOf('function cambiar(id,opciones){');
  const fin = codigo.indexOf('function adaptar(){', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const nombres = ['buscar','favoritos','inversiones','cuenta'];
  const paneles = new Map(nombres.map(nombre => [nombre, { hidden:nombre !== 'buscar' }]));
  const tabs = nombres.map(nombre => ({
    dataset:{ movilTab:nombre }, tabIndex:nombre === 'buscar' ? 0 : -1,
    atributos:new Map([['aria-selected', nombre === 'buscar' ? 'true' : 'false']]),
    setAttribute(clave, valor){ this.atributos.set(clave, String(valor)); },
    getAttribute(clave){ return this.atributos.get(clave) ?? null; },
  }));
  const document = { body:{ dataset:{} } };
  let cabeceraActual = '', mediciones = 0, cierresAvisos = 0;
  const fabrica = new Function('media', 'paneles', 'tabs', 'document', 'window', 'reduce',
    'mostrarAvisos', 'cabecera', 'geometria', `
      let activa='buscar',academyAbierta=false,academyHistorial=false;
      let detalleAbierto=null,detalleHistorial=false,movilFiltrosAbiertos=false;
      ${fuente}
      return {cambiar, activa:()=>activa};
    `);
  const api = fabrica({matches:true}, paneles, tabs, document, {scrollTo(){}}, ()=>true,
    ()=>{ cierresAvisos++; }, id=>{ cabeceraActual=id; }, ()=>{ mediciones++; });
  for (const nombre of nombres) {
    api.cambiar(nombre, { arriba:false });
    if (api.activa() !== nombre || document.body.dataset.movilPestana !== nombre || cabeceraActual !== nombre)
      return false;
    for (const otro of nombres) {
      const indice = nombres.indexOf(otro);
      const elegida = otro === nombre;
      if (paneles.get(otro).hidden === elegida ||
          tabs[indice].getAttribute('aria-selected') !== (elegida ? 'true' : 'false') ||
          tabs[indice].tabIndex !== (elegida ? 0 : -1)) return false;
    }
  }
  api.cambiar('sistema-operativo-inventado', { arriba:false });
  return api.activa() === 'cuenta' && document.body.dataset.movilPestana === 'cuenta' &&
    mediciones === 1 && cierresAvisos >= 3;
}

function subvistaAvisosConservaEstadoYFoco(codigo) {
  const inicio = codigo.indexOf('function mostrarAvisos(mostrar,enfocar=true,gestionarHistorial=true){');
  const fin = codigo.indexOf('function pintarSonidoMovil(){', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const clases = new Set();
  const atributos = new Map([['aria-expanded','false']]);
  const panel = { classList:{ toggle(clase, activo){ activo ? clases.add(clase) : clases.delete(clase); } } };
  const vista = { hidden:true };
  const abre = {
    focused:false,
    setAttribute(clave, valor){ atributos.set(clave, String(valor)); },
    focus(){ this.focused=true; },
  };
  const cierra = { focused:false, focus(){ this.focused=true; } };
  const nodos = new Map([
    ['movilPanelMas',panel], ['movilVistaAvisos',vista], ['movilAbrirAvisos',abre],
    ['movilCerrarAvisos',cierra],
  ]);
  const document = { getElementById:id=>nodos.get(id) || null };
  let desplazamientos = 0;
  const mostrarAvisos = new Function('document', 'window', 'reduce', 'requestAnimationFrame', `
    const media={matches:false};
    let avisosHistorial=false;
    ${fuente}
    return mostrarAvisos;
  `)(document, {scrollTo(){ desplazamientos++; }}, ()=>true, fn=>fn());
  mostrarAvisos(true);
  const abierta = vista.hidden === false && clases.has('movil-subvista-abierta') &&
    atributos.get('aria-expanded') === 'true' && cierra.focused && desplazamientos === 1;
  mostrarAvisos(false);
  const cerrada = vista.hidden === true && !clases.has('movil-subvista-abierta') &&
    atributos.get('aria-expanded') === 'false' && abre.focused;
  return abierta && cerrada;
}

console.log('=== PRUEBAS ESTÁTICAS DE LA WEB ===');
marcadoEstricto('index.html', html);
marcadoEstricto('privacidad.html', privacidad);
marcadoEstricto('404.html', error404);

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(m => m[1]);
const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
prueba('index.html no tiene ID duplicados', repetidos.length === 0);

const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const estilos = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)];
prueba('la aplicación carga un único JavaScript propio versionado',
  scripts.length === 1 && scripts[0][1] === '/assets/rwadar-20260820.js');
prueba('la aplicación carga una hoja propia versionada',
  estilos.length === 1 && estilos[0][1] === '/assets/rwadar-20260820.css');
for (const recurso of [scripts[0][1], estilos[0][1], '/assets/privacidad-20260820.css', '/assets/error-20260820.css'])
  prueba(`existe ${recurso}`, fs.existsSync(path.join(sitio, '.' + recurso)));

const js = lee('.' + scripts[0][1]);
const css = lee('.' + estilos[0][1]);
new Function(js);
prueba('el JavaScript externo compila', true);
prueba('el pre-render contiene las 26 fichas', (html.match(/class="abrir"/g) || []).length === 26);
prueba('el pre-render contiene los 4 descartes', (html.match(/class="fila"/g) || []).length === 4);
prueba('todos los formularios fallan cerrados bajo form-action none',
  [...html.matchAll(/<form\b([^>]*)>/gi)].every(m => !/\baction\s*=/i.test(m[1])));

const jsonLd = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
prueba('hay exactamente un JSON-LD', jsonLd.length === 1);
const datosLd = JSON.parse(jsonLd[0][1]);
prueba('el JSON-LD es JSON válido', true);
prueba('la página y el conjunto de datos comparten la revisión actual',
  datosLd['@graph'].filter(x=>x.dateModified).every(x=>x.dateModified==='2026-08-22'));
const descripcion = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '';
prueba('la meta description es precisa y tiene longitud útil para buscadores',
  descripcion.length >= 150 && descripcion.length <= 160 && /26 plataformas/.test(descripcion) && /4 descartes/.test(descripcion));
const ultimaVerificacion = arrayDe(lee('.' + scripts[0][1]), 'P').map(p=>p.ver).filter(Boolean).sort().at(-1);
const fechaPie = ultimaVerificacion.split('-').reverse().join('.');
prueba('el HTML sin JavaScript contiene la revisión real derivada de los datos',
  html.includes(`<p id="pieRevision">Última revisión del registro: ${fechaPie}</p>`) && !html.includes('26.07.2026'));

console.log('\n=== CSP, SESIÓN Y CONTRATOS ===');
prueba('la CSP no permite unsafe-inline ni eval', !/unsafe-inline|unsafe-eval/i.test(headers));
prueba('la CSP limita script, estilo, worker y manifest a recursos propios',
  /script-src\s+'self'/i.test(headers) && /style-src\s+'self'/i.test(headers) &&
  /worker-src\s+'self'/i.test(headers) && /manifest-src\s+'self'/i.test(headers));
prueba('la CSP impide formularios, marcos y objetos',
  /form-action\s+'none'/i.test(headers) && /frame-ancestors\s+'none'/i.test(headers) && /object-src\s+'none'/i.test(headers));
prueba('los assets versionados tienen caché immutable', /\/assets\/\*[\s\S]*max-age=31536000, immutable/i.test(headers));
prueba('el service worker se entrega siempre revalidado', /\/sw\.js[\s\S]*no-cache, no-store/i.test(headers));
prueba('portada y manifest se revalidan para descubrir cada nueva entrega',
  /^\/\r?\n\s+Cache-Control:\s*public, max-age=0, must-revalidate/im.test(headers) &&
  /\/manifest\.webmanifest[\s\S]*?Cache-Control:\s*public, max-age=86400, must-revalidate/i.test(headers));

prueba('la contraseña mínima es de 12 caracteres en HTML y JS',
  (html.match(/minlength="12"/g) || []).length === 2 && /clave\.length<12/.test(js));
prueba('los testigos de sesión solo se guardan en memoria',
  /const guarda=s=>\{ses=normalizaSesion\(s\)/.test(js) &&
  !/localStorage\.(?:setItem|getItem)\([^)]*(?:access_token|refresh_token)/.test(js));
prueba('la identidad se revalida contra Auth antes de usar la sesión', /auth\('\/user',null,\{metodo:'GET',token:tk\}\)/.test(js));
prueba('la recuperación limpia el fragmento y abre cambio de contraseña',
  /history\.replaceState\(null,'',location\.pathname\+location\.search\)/.test(js) &&
  /tipo==='recovery'\)abrir\('nueva_clave'\)/.test(js));
prueba('la recuperación cambia la contraseña autenticada con PUT /user',
  /auth\('\/user',\{password:clave\},\{metodo:'PUT',token:tk\}\)/.test(js));

const inicioCuentaHTML = html.search(/<div\b[^>]*\bid=["']cuentaCaja["'][^>]*>/i);
const finCuentaHTML = html.search(/<aside\b[^>]*\bid=["']perfilPanel["'][^>]*>/i);
const cuentaHTML = inicioCuentaHTML >= 0 && finCuentaHTML > inicioCuentaHTML
  ? html.slice(inicioCuentaHTML, finCuentaHTML) : '';
const cuentaEstadoHTML = (cuentaHTML.match(
  /<section\b[^>]*\bid=["']cuentaEstado["'][^>]*>[\s\S]*?<\/section>/i) || [''])[0];
const botonesCuentaEstado = [...cuentaEstadoHTML.matchAll(/<button\b([^>]*)>[\s\S]*?<\/button>/gi)];
prueba('la cuenta tiene una vista de estado accesible separada del formulario',
  /id=["']cuentaCaja["'][^>]*role=["']dialog["'][^>]*aria-modal=["']true["'][^>]*tabindex=["']-1["']/i.test(cuentaHTML) &&
  /id=["']cuentaForm["']/.test(cuentaHTML) && /id=["']cuentaEnlaces["']/.test(cuentaHTML) &&
  /id=["']cuentaEstado["'][^>]*aria-labelledby=["']cuentaEstadoMarca["'][^>]*tabindex=["']-1["'][^>]*hidden/i.test(cuentaEstadoHTML));
prueba('la vista de estado ofrece solo botones explícitos y accionables',
  botonesCuentaEstado.length === 4 &&
  ['cuentaEstadoEntrar','cuentaReenviar','cuentaCambiarCorreo','cuentaVolver'].every(id =>
    botonesCuentaEstado.some(b => atributoHTML(b[1], 'id') === id && atributoHTML(b[1], 'type') === 'button')));
prueba('abrir una confirmación pendiente oculta el formulario y borra las contraseñas',
  estadoPendienteOcultaFormulario(js));
prueba('Auth rechaza una respuesta 2xx cuyo cuerpo no sea JSON válido',
  await authRechazaJson2xxInvalido(js));
prueba('un signup sin usuario raíz válido nunca se presenta como alta aceptada',
  await altaSinUsuarioValidoFallaCerrada(js));
prueba('el reenvío de confirmación usa /resend con type signup y no promete entrega',
  /auth\('\/resend\?redirect_to='\+vuelta,\{type:'signup',email:correoPendiente\}\)/.test(js) &&
  /solicitud de reenvío fue aceptada[^']*no confirma la entrega/i.test(js));
prueba('una operación de cuenta obsoleta no muta la vista que la sustituyó',
  await operacionCuentaObsoletaNoMutaVista(js) &&
  (js.match(/if\(operacion!==operacionCuenta\|\|modo!==modoEnvio\)return;/g) || []).length >= 4 &&
  /if\(operacion===operacionCuenta&&modo===modoEnvio\)/.test(js));
prueba('confirmar la identidad elimina la sesión ante cualquier fallo de revalidación',
  await confirmarIdentidadLimpiaSesionAnteFallos(js));
prueba('el callback solo acepta signup o recovery y borra cualquier otro testigo',
  /acceso\s*&&\s*!\[\s*['"]signup['"]\s*,\s*['"]recovery['"]\s*\]\.includes\(tipo\)/.test(js) &&
  /acceso\s*&&\s*!\[[^\]]+\]\.includes\(tipo\)\)\{\s*guarda\(null\);identidadConfirmada=false;/.test(js));

const bloqueConsentimientoCorreo = (js.match(
  /\/\* correo-consentimiento:inicio \*\/[\s\S]*?\/\* correo-consentimiento:fin \*\//) || [])[0] || '';
const contratoCorreo = new Function(`${bloqueConsentimientoCorreo}\nreturn {
  VERSION_CONSENTIMIENTO_CORREO, consentimientoCorreoVigente,
  perfilConCorreoSeguro, perfilDesdeRespuestaCorreo
}`)();
const versionCorreo = 'correo-v1-2026-08-22';
const consentimientoValido = {
  avisos_correo:true,
  avisos_correo_aceptado_el:'2026-08-22T10:00:00.000Z',
  avisos_correo_version:versionCorreo,
};
prueba('el consentimiento de correo usa exactamente la versión cerrada por la migración 23',
  contratoCorreo.VERSION_CONSENTIMIENTO_CORREO === versionCorreo &&
  (js.match(/correo-v1-2026-08-22/g) || []).length === 1);
prueba('el correo nace fail-closed sin booleano, fecha y versión válidos',
  contratoCorreo.consentimientoCorreoVigente(consentimientoValido) === true &&
  [null, {}, {avisos_correo:true},
    {...consentimientoValido,avisos_correo:false},
    {...consentimientoValido,avisos_correo_aceptado_el:null},
    {...consentimientoValido,avisos_correo_aceptado_el:'fecha-inválida'},
    {...consentimientoValido,avisos_correo_version:'correo-v0'}]
    .every(caso => contratoCorreo.consentimientoCorreoVigente(caso) === false));
prueba('normalizar datos ausentes o heredados fuerza la preferencia de correo a OFF',
  [null, {}, {avisos_correo:true}].every(caso => {
    const seguro = contratoCorreo.perfilConCorreoSeguro({avisos_correo:true}, caso);
    return seguro.avisos_correo === false && seguro.avisos_correo_aceptado_el === null &&
      seguro.avisos_correo_version === null;
  }));
prueba('alta y retirada validan la respuesta completa antes de reflejarla',
  contratoCorreo.perfilDesdeRespuestaCorreo({}, {
    habilitado:true,aceptado_el:consentimientoValido.avisos_correo_aceptado_el,version:versionCorreo,
  }, true).avisos_correo === true &&
  contratoCorreo.perfilDesdeRespuestaCorreo(consentimientoValido, {
    habilitado:false,aceptado_el:null,version:null,
  }, false).avisos_correo === false &&
  Boolean(await capturaError(Promise.resolve().then(() => contratoCorreo.perfilDesdeRespuestaCorreo({}, {
    habilitado:true,aceptado_el:null,version:versionCorreo,
  }, true)))));
prueba('alta y baja usan la RPC versionada; no escriben avisos_correo directamente',
  /rest\('\/rpc\/configurar_avisos_correo',\{method:'POST',body:JSON\.stringify\(\{[\s\S]*?p_habilitado:deseado,p_version:VERSION_CONSENTIMIENTO_CORREO/.test(js) &&
  !/rest\('\/perfiles[^']*',\{method:'PATCH',[\s\S]{0,180}avisos_correo/.test(js));
prueba('la UX no cambia el estado mientras la RPC está pendiente y revierte ante fallo',
  /const anterior=correoConsentido,deseado=o\.checked;o\.disabled=true;/.test(js) &&
  /o\.checked=anterior;/.test(js) && /finally\{o\.disabled=false;\}/.test(js) &&
  /No se ha podido confirmar la retirada; la preferencia sigue activada/.test(js));

for (const firma of ['/rpc/guardar_opinion','/rpc/borrar_mi_opinion','/rpc/denunciar_opinion',
  'p_opinion_id','/mis_opiniones?select=opinion_id'])
  prueba(`el frontend incluye el contrato ${firma}`, js.includes(firma));
prueba('las opiniones públicas no solicitan usuario_id', !/opiniones_publicas\?select=[^'\n]*usuario_id/.test(js));
prueba('no hay escrituras directas a opiniones o denuncias',
  !/pide\('\/(?:opiniones|denuncias)'\s*,\s*\{\s*method\s*:/.test(js));

console.log('\n=== EMISIONES, PWA Y ADELGAZADO ===');
for (const id of ['emisiones','emiFiltros','emiLista','emiOrden']) prueba(`existe el control ${id}`, ids.includes(id));
prueba('las emisiones viven en el JavaScript externo, no en un script inline', /const EMI=\[/.test(js));
prueba('el estado de emisiones también queda pre-renderizado para buscadores',
  /id="emiLista"><!--pre:ini-->[\s\S]+<!--pre:fin-->/.test(html));
prueba('las tarjetas usan progress y clases, no estilos inline',
  /<progress class="emi-barra"/.test(js) && !/<(?:article|span|i)[^>]*style=/.test(js));
prueba('el estado vacío no promete una alerta de emisiones inexistente',
  !/Crea una cuenta y te avisamos en cuanto se abra la primera/.test(js));
const hostil = renderEmisionHostil(js);
prueba('texto hostil de una emisión se escapa como texto', hostil.includes('&lt;img src=x onerror=alert(1)&gt;') && !hostil.includes('<img'));
prueba('un cierre script hostil no crea otro script', hostil.includes('&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;'));
prueba('la emisión renderizada no genera style ni manejadores inline',
  !/<[^>]*\s(?:style|on[a-z]+)\s*=/i.test(hostil));

console.log('\n=== ADAPTACIÓN MÓVIL Y ACCESIBILIDAD ===');
const contratoTabs = [
  { valor:'buscar', id:'movilTabRadar', panel:'movilPanelRadar', etiqueta:'Buscar' },
  { valor:'favoritos', id:'movilTabSiguiendo', panel:'movilPanelSiguiendo', etiqueta:'Favoritos' },
  { valor:'inversiones', id:'movilTabInversiones', panel:'movilPanelInversiones', etiqueta:'Inversiones' },
  { valor:'cuenta', id:'movilTabMas', panel:'movilPanelMas', etiqueta:'Mi cuenta' },
];
const navegaciones = [...html.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi)];
const navMovil = navegaciones.find(n => atributoHTML(n[1], 'id') === 'movilNav');
prueba('hay una única navegación móvil identificable como lista de pestañas',
  navegaciones.filter(n => atributoHTML(n[1], 'id') === 'movilNav').length === 1 &&
  atributoHTML(navMovil?.[1] || '', 'class')?.split(/\s+/).includes('movil-nav') &&
  atributoHTML(navMovil?.[1] || '', 'role') === 'tablist' &&
  atributoHTML(navMovil?.[1] || '', 'aria-label') === 'Navegación principal');

const botonesNavMovil = navMovil
  ? [...navMovil[2].matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)]
      .filter(b => atributoHTML(b[1], 'class')?.split(/\s+/).includes('movil-nav-item'))
  : [];
prueba('la barra móvil tiene exactamente cuatro pestañas y ningún control improvisado',
  botonesNavMovil.length === 4 &&
  !/<a\b[^>]*\bclass=["'][^"']*\bmovil-nav-item\b/i.test(navMovil?.[2] || ''));
prueba('las cuatro pestañas conservan orden, destino y nombre accesible',
  contratoTabs.every((esperada, i) => {
    const boton = botonesNavMovil[i];
    if (!boton) return false;
    return atributoHTML(boton[1], 'type') === 'button' &&
      atributoHTML(boton[1], 'role') === 'tab' &&
      atributoHTML(boton[1], 'id') === esperada.id &&
      atributoHTML(boton[1], 'data-movil-tab') === esperada.valor &&
      atributoHTML(boton[1], 'aria-controls') === esperada.panel &&
      textoHTML(boton[2]).includes(esperada.etiqueta);
  }));
prueba('solo Buscar empieza seleccionada y el foco sigue el patrón roving-tabindex',
  botonesNavMovil.filter(b => atributoHTML(b[1], 'aria-selected') === 'true').length === 1 &&
  contratoTabs.every((_, i) =>
    atributoHTML(botonesNavMovil[i]?.[1] || '', 'aria-selected') === (i === 0 ? 'true' : 'false') &&
    atributoHTML(botonesNavMovil[i]?.[1] || '', 'tabindex') === (i === 0 ? '0' : '-1')));

const etiquetasInicio = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)];
const panelesMoviles = etiquetasInicio.filter(e => atributoHTML(e[2], 'data-movil-panel') !== null);
prueba('cada pestaña controla un panel accesible y los paneles inactivos nacen ocultos',
  panelesMoviles.length === 4 && contratoTabs.every((esperada, i) => {
    const panel = panelesMoviles.find(p => atributoHTML(p[2], 'id') === esperada.panel);
    return panel && atributoHTML(panel[2], 'data-movil-panel') === esperada.valor &&
      atributoHTML(panel[2], 'role') === 'tabpanel' &&
      atributoHTML(panel[2], 'aria-labelledby') === esperada.id &&
      (i === 0 ? atributoHTML(panel[2], 'hidden') === null : atributoHTML(panel[2], 'hidden') !== null);
  }));
prueba('Buscar, Favoritos, Inversiones y Mi cuenta son las únicas rutas de primer nivel',
  new Set(botonesNavMovil.map(b => atributoHTML(b[1], 'data-movil-tab'))).size === 4 &&
  contratoTabs.every(esperada => botonesNavMovil.some(b =>
    atributoHTML(b[1], 'data-movil-tab') === esperada.valor)) &&
  !botonesNavMovil.some(b => ['radar','siguiendo','avisos','mas'].includes(
    atributoHTML(b[1], 'data-movil-tab'))));

const viewport = (html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
const mediasCSS = bloquesMediaCSS(css);
const cssBase = cssSinBloques(css, mediasCSS);
const mediasMoviles = mediasCSS.filter(media => /max-width\s*:\s*767px/i.test(media.consulta));
const cssMovil = mediasMoviles.map(media => media.contenido).join('\n');
const navBase = declaracionesCSS(cssBase, '.movil-nav').join(';');
const navEnMovil = declaracionesCSS(cssMovil, '.movil-nav').join(';');
const itemEnMovil = declaracionesCSS(cssMovil, '.movil-nav-item').join(';');
const cuerpoEnMovil = declaracionesCSS(cssMovil, 'body').join(';');
const rejillaEnMovil = declaracionesCSS(cssMovil, '.rejilla').join(';');
const compararEnMovil = declaracionesCSS(cssMovil, '.cmpbar').join(';');
const avisoEnMovil = declaracionesCSS(cssMovil, '.aviso').join(';');
const drawerBase = declaracionesCSS(cssBase, '.panel').join(';');
const drawerEnMovil = declaracionesCSS(cssMovil, '#drawer.panel').join(';');
const drawerCuerpoEnMovil = declaracionesCSS(cssMovil, '#drawer .pn-body').join(';');
const drawerCerrarEnMovil = declaracionesCSS(cssMovil, '#drawer .pn-cerrar').join(';');
const drawerAccionesEnMovil = declaracionesCSS(cssMovil, '#drawer .pn-acciones-movil').join(';');
const drawerAccionesBase = declaracionesCSS(cssBase, '.pn-acciones-movil').join(';');
const drawerWebEscritorioEnMovil = declaracionesCSS(cssMovil, '#drawer .pn-web-escritorio').join(';');
const drawerAccionesConTeclado = declaracionesCSS(cssMovil,
  'body.movil-teclado #drawer .pn-acciones-movil').join(';');
const cuentaCajaEnMovil = declaracionesCSS(cssMovil, '.cuenta-caja').join(';');
const cuentaContenidoEnMovil = declaracionesCSS(cssMovil, '.cuenta-contenido').join(';');
const cuentaInputEnMovil = declaracionesCSS(cssMovil, '.cuenta-caja input').join(';');
const cuentaCerrarBase = declaracionesCSS(cssBase, '.cuenta-caja .cerrar-x').join(';');
const cuentaCerrarEnMovil = declaracionesCSS(cssMovil, '.cuenta-caja .cerrar-x').join(';');
const cuentaAutofill = declaracionesCSS(cssBase, '.cuenta-caja input:-webkit-autofill').join(';');
const cuentaAutofillFoco = declaracionesCSS(cssBase, '.cuenta-caja input:-webkit-autofill:focus').join(';');
const ofertasBase = declaracionesCSS(cssBase, '.movil-ofertas-intro').join(';');
const ofertasEnMovil = declaracionesCSS(cssMovil, '#movilPanelRadar>.emis').join(';');
const ofertasOrdenEnMovil = declaracionesCSS(cssMovil, '#movilPanelRadar .emis-orden select').join(';');
const menuFilaEnMovil = declaracionesCSS(cssMovil, '.movil-menu-fila').join(';');
const volverAvisosEnMovil = declaracionesCSS(cssMovil, '.movil-subvista-volver').join(';');
const cabeceraAccionEnMovil = declaracionesCSS(cssMovil, '.movil-cabecera-accion').join(';');
const vistasRadarEnMovil = declaracionesCSS(cssMovil, '#movilPanelRadar .vista button').join(';');
const cssMuyEstrecho = mediasCSS.filter(media => /max-width\s*:\s*359px/i.test(media.consulta))
  .map(media => media.contenido).join('\n');
const altoMinimo = Number((itemEnMovil.match(/min-height\s*:\s*([\d.]+)px/i) || [])[1] || 0);
const minimoPx = (reglas, propiedad) => {
  const valores = [...reglas.matchAll(new RegExp(`${propiedad}\\s*:\\s*([\\d.]+)px`, 'gi'))]
    .map(coincidencia => Number(coincidencia[1]));
  return valores.length ? Math.min(...valores) : 0;
};
prueba('el viewport permite aprovechar las áreas seguras de iOS y Android',
  /(?:^|,)\s*viewport-fit\s*=\s*cover\s*(?:,|$)/i.test(viewport));
prueba('el modo instalado se detecta con el estándar display-mode, no solo con metadatos iOS',
  mediasCSS.some(media => /max-width\s*:\s*767px/i.test(media.consulta) &&
    /display-mode\s*:\s*standalone/i.test(media.consulta)));
prueba('la interfaz móvil queda limitada al breakpoint de 767 px y oculta en escritorio',
  mediasMoviles.length >= 1 && /display\s*:\s*none/i.test(navBase) &&
  /display\s*:\s*(?:grid|flex)/i.test(navEnMovil) &&
  !/display\s*:\s*(?:grid|flex|block)/i.test(navBase));
prueba('320, 375, 390 y 430 px comparten el mismo shell fluido sin ancho mínimo',
  [320,375,390,430].every(ancho => ancho <= 767) &&
  /minmax\(\s*0\s*,\s*1fr\s*\)/i.test(navEnMovil) &&
  /min-width\s*:\s*0/i.test(itemEnMovil) &&
  /--movil-margen\s*:\s*12px/i.test(cssMuyEstrecho) &&
  /grid-template-columns\s*:\s*minmax\(\s*0\s*,\s*1fr\s*\)\s+52px/i
    .test(declaracionesCSS(cssMuyEstrecho, '#movilPanelRadar .barra-in').join(';')));
prueba('la barra es inferior, tiene cuatro columnas y reserva el safe-area',
  /position\s*:\s*fixed/i.test(navEnMovil) && /bottom\s*:\s*0/i.test(navEnMovil) &&
  (/grid-template-columns\s*:\s*repeat\(\s*4\s*,/i.test(navEnMovil) ||
    (/display\s*:\s*flex/i.test(navEnMovil) && /flex\s*:\s*1(?:\s|;|$)/i.test(itemEnMovil))) &&
  /padding(?:-bottom)?\s*:[^;{}]*env\(\s*safe-area-inset-bottom/i.test(navEnMovil));
prueba('las pestañas ofrecen dianas táctiles de al menos 48 px y foco visible',
  altoMinimo >= 48 && declaracionesCSS(css, '.movil-nav-item:focus-visible').length > 0 &&
  declaracionesCSS(css, ':focus-visible')
    .some(declaraciones => /(?:outline|box-shadow)\s*:(?!\s*none)/i.test(declaraciones)));
prueba('cabecera, selector de vista y radar conservan dianas táctiles suficientes',
  minimoPx(cabeceraAccionEnMovil, 'width') >= 44 &&
  minimoPx(cabeceraAccionEnMovil, 'height') >= 44 &&
  minimoPx(vistasRadarEnMovil, 'min-height') >= 44 &&
  Number((js.match(/<circle class="zona"[^>]*\br="([\d.]+)"/) || [])[1] || 0) >= 22 &&
  Number((js.match(/<rect class="radar-et-zona"[^>]*\bheight="([\d.]+)"/) || [])[1] || 0) >= 44);
prueba('el radar resuelve zonas solapadas por el punto geométricamente más cercano',
  /class="zona"[^>]*pointer-events="none"/.test(js) &&
  /function masCercano\(e\)/.test(js) &&
  /getScreenCTM/.test(js) && /matriz\.inverse\(\)/.test(js) &&
  /let mejor=null,distancia=22\*22/.test(js) &&
  /const i=masCercano\(e\);if\(i!=null\)openDrawer\(i\)/.test(js));
prueba('ofertas, menús y vuelta de Avisos conservan dianas móviles utilizables',
  Number((ofertasOrdenEnMovil.match(/min-height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  Number((menuFilaEnMovil.match(/min-height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  Number((volverAvisosEnMovil.match(/width\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  Number((volverAvisosEnMovil.match(/height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48);
prueba('las superficies exclusivas de ofertas siguen ocultas en escritorio',
  /display\s*:\s*none/i.test(ofertasBase) &&
  /width\s*:\s*100%/i.test(ofertasEnMovil) && /max-width\s*:\s*560px/i.test(ofertasEnMovil));
prueba('las fichas móviles usan una columna que puede encogerse sin desbordar',
  /grid-template-columns\s*:\s*minmax\(\s*0\s*,\s*1fr\s*\)/i.test(rejillaEnMovil));
prueba('contenido, comparador y avisos reservan sitio sobre la barra y el área segura',
  /padding-bottom\s*:[^;{}]*(?:safe-area-inset-bottom|var\(\s*--movil-[^)]+\))/i.test(cuerpoEnMovil) &&
  /bottom\s*:[^;{}]*(?:safe-area-inset-bottom|var\(\s*--movil-[^)]+\))/i.test(compararEnMovil) &&
  /bottom\s*:[^;{}]*(?:safe-area-inset-bottom|var\(\s*--movil-[^)]+\))/i.test(avisoEnMovil));
prueba('la cuenta móvil evita zoom de iOS y conserva dianas táctiles de 48 px',
  Number((cuentaInputEnMovil.match(/font-size\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 16 &&
  Number((cuentaInputEnMovil.match(/min-height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  [cuentaCerrarBase, cuentaCerrarEnMovil].every(reglas =>
    Number((reglas.match(/width\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
    Number((reglas.match(/height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48));
prueba('la hoja de cuenta respeta safe-area superior e inferior y mantiene el cuerpo desplazable',
  /(?:inset|top)\s*:[^;{}]*env\(\s*safe-area-inset-top\s*\)/i.test(cuentaCajaEnMovil) &&
  /overflow\s*:\s*hidden/i.test(cuentaCajaEnMovil) &&
  /overflow-y\s*:\s*auto/i.test(cuentaContenidoEnMovil) &&
  /overscroll-behavior\s*:\s*contain/i.test(cuentaContenidoEnMovil) &&
  /padding\s*:[^;{}]*env\(\s*safe-area-inset-bottom\s*\)/i.test(cuentaContenidoEnMovil));
prueba('la cuenta no enfoca campos automáticamente en móvil',
  !/\bautofocus(?:\s|=|>)/i.test(cuentaHTML) &&
  /id=["']cuentaCaja["'][^>]*tabindex=["']-1["']/i.test(cuentaHTML) &&
  /if\(esEstado\|\|movil\)caja\.focus\(\)/.test(js));
prueba('los campos declaran autofill seguro y siguen legibles con autocompletado',
  /id=["']cCorreo["'][^>]*autocomplete=["']username["']/i.test(cuentaHTML) &&
  /id=["']cClave["'][^>]*autocomplete=["']current-password["']/i.test(cuentaHTML) &&
  /id=["']cClave2["'][^>]*autocomplete=["']new-password["']/i.test(cuentaHTML) &&
  /-webkit-text-fill-color\s*:\s*var\(--tx\)/i.test(cuentaAutofill) &&
  /-webkit-box-shadow\s*:[^;{}]*inset/i.test(cuentaAutofill) &&
  /-webkit-text-fill-color\s*:\s*var\(--tx\)/i.test(cuentaAutofillFoco) &&
  /0\s+0\s+0\s+4px\s+rgba\(/i.test(cuentaAutofillFoco));

const drawerHTML = (html.match(/<aside\b[^>]*\bid=["']drawer["'][^>]*>[\s\S]*?<\/aside>/i) || [''])[0];
prueba('la ficha es un diálogo descrito y ofrece cierre textual accesible',
  /role=["']dialog["']/.test(drawerHTML) && /aria-modal=["']true["']/.test(drawerHTML) &&
  /aria-labelledby=["']dwTitulo["']/.test(drawerHTML) && /aria-describedby=["']dwResumen["']/.test(drawerHTML) &&
  /class=["'][^"']*\bpn-cerrar\b[^"']*["'][^>]*aria-label=["']Cerrar ficha["'][^>]*>[\s\S]*?\bCerrar\b[\s\S]*?<\/button>/i.test(drawerHTML) &&
  /id=["']dwAcciones["'][^>]*aria-label=["']Acciones de la ficha["']/.test(drawerHTML));
prueba('la ficha móvil separa cabecera, contenido desplazable y acciones persistentes',
  /display\s*:\s*grid/i.test(drawerEnMovil) &&
  /grid-template-rows\s*:\s*auto\s+minmax\(\s*0\s*,\s*1fr\s*\)\s+auto/i.test(drawerEnMovil) &&
  /overflow\s*:\s*hidden/i.test(drawerEnMovil) &&
  /min-height\s*:\s*0/i.test(drawerCuerpoEnMovil) &&
  /overflow-y\s*:\s*auto/i.test(drawerCuerpoEnMovil) &&
  /overscroll-behavior\s*:\s*contain/i.test(drawerCuerpoEnMovil) &&
  /display\s*:\s*grid/i.test(drawerAccionesEnMovil));
prueba('cabecera, cierre y pie respetan las áreas seguras y dianas de 48 px',
  /inset\s*:[^;{}]*env\(\s*safe-area-inset-top\s*\)/i.test(drawerEnMovil) &&
  Number((drawerCerrarEnMovil.match(/height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  Number((drawerCerrarEnMovil.match(/min-width\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48 &&
  /padding\s*:[^;{}]*env\(\s*safe-area-inset-bottom\s*\)/i.test(drawerAccionesEnMovil) &&
  Number((declaracionesCSS(cssMovil, '#drawer .pn-accion-principal')
    .join(';').match(/min-height\s*:\s*([\d.]+)px/i) || [])[1] || 0) >= 48);
prueba('el teclado oculta solo el pie móvil para no tapar campos u opiniones',
  /display\s*:\s*none/i.test(drawerAccionesConTeclado) &&
  /movil-teclado/.test(js) && /input:not\(\[type=["']range["']\]\),textarea,select/.test(js));
prueba('las acciones móviles no alteran la ficha lateral de escritorio',
  /display\s*:\s*none/i.test(drawerAccionesBase) &&
  /width\s*:\s*min\(\s*480px\s*,\s*100%\s*\)/i.test(drawerBase) &&
  /transform\s*:\s*translateX\(\s*103%\s*\)/i.test(drawerBase) &&
  /display\s*:\s*none/i.test(drawerWebEscritorioEnMovil) &&
  !/display\s*:\s*grid/i.test(drawerBase));

const jsSinComentarios = sinComentariosJS(js);
const inicioDetalle = jsSinComentarios.indexOf('function openDrawer(i){');
const finDetalle = jsSinComentarios.indexOf('function toggleCompare(i)', inicioDetalle);
const codigoDetalle = inicioDetalle >= 0 && finDetalle > inicioDetalle
  ? jsSinComentarios.slice(inicioDetalle, finDetalle) : '';
const inicioPaneles = jsSinComentarios.indexOf('const fondo=');
const finPaneles = jsSinComentarios.indexOf('const milesES=', inicioPaneles);
const codigoPaneles = inicioPaneles >= 0 && finPaneles > inicioPaneles
  ? jsSinComentarios.slice(inicioPaneles, finPaneles) : '';
const camposDetalle = [
  ['Tipo de actor', 'p.tipo'],
  ['Quién puede entrar', 'p.acceso'],
  ['Importe de entrada', 'p.ticket'],
  ['Tipo de activo', 'p.cat'],
  ['Región / marco', 'p.reg'],
  ['Cadenas', 'p.cadenas'],
  ['Última verificación', 'fLarga(p.ver)'],
];
prueba('el detalle ordena la información en resumen, verificación, datos, seguimiento y opiniones',
  ['pn-resumen','pn-verificacion','pn-datos-grid','pn-seguimiento','pn-opiniones-seccion']
    .every(clase => codigoDetalle.includes(clase)) &&
  ['Resumen','Verificación RWAdar','Acceso e inversión','Activo y alcance','Seguimiento','Puntuación y opiniones']
    .every(titulo => codigoDetalle.includes(titulo)));
prueba('el detalle conserva exactamente sus siete datos de ficha',
  (codigoDetalle.match(/<dt>/g) || []).length === 7 && camposDetalle.every(([etiqueta, valor]) =>
    codigoDetalle.includes(`<dt>${etiqueta}</dt><dd>\${escHtml(${valor})}</dd>`)));
prueba('el detalle conserva nota, aval, web oficial, vigilancia y opiniones',
  codigoDetalle.includes('id="dwResumen">${escHtml(p.nota)}</p>') &&
  codigoDetalle.includes('${escudoSVG}<span>${escHtml(p.aval)}</span>') &&
  codigoDetalle.includes('const web=urlHttps(p.web)') &&
  (codigoDetalle.match(/target="_blank" rel="noopener"/g) || []).length === 2 &&
  codigoDetalle.includes('id="dwVigilar"') && codigoDetalle.includes('Cuenta.pintarVigilar(p.n)') &&
  codigoDetalle.includes('id="dwOpiniones"') && codigoDetalle.includes('Opiniones.pinta(p.n,c)'));
prueba('la acción oficial y el cierre quedan disponibles al pie sin duplicar estado',
  codigoDetalle.includes("document.getElementById('dwAcciones')") &&
  /class="pn-accion-principal"[\s\S]*?href="\$\{escHtml\(web\)\}"[\s\S]*?rel="noopener"/.test(codigoDetalle) &&
  /class="pn-accion-cerrar"[^>]*type="button"[^>]*data-accion="cerrar-panel"/.test(codigoDetalle) &&
  /class="pn-web-escritorio"/.test(codigoDetalle));
prueba('cada empresa abre desde el principio y conserva el aviso de verificar la fuente',
  /const cuerpo=document\.getElementById\(['"]dwBody['"]\);if\(cuerpo\)cuerpo\.scrollTop=0/.test(codigoDetalle) &&
  codigoDetalle.includes('pn-web-movil-nota') &&
  codigoDetalle.includes('Verifica siempre los datos en origen') &&
  /display\s*:\s*block/i.test(declaracionesCSS(cssMovil, '#drawer .pn-web-movil-nota').join(';')));
prueba('Escape, velo y ambos botones cierran la ficha y restauran el foco',
  /id=["']ovl["'][^>]*data-accion=["']cerrar-panel["']/.test(html) &&
  /data-accion=["']cerrar-panel["']/.test(drawerHTML) &&
  codigoDetalle.includes('data-accion="cerrar-panel"') &&
  /e\.key===['"]Escape['"]\)closeAll\(\)/.test(codigoPaneles) &&
  /dataset\.accion===['"]cerrar-panel['"]\)return closeAll\(\)/.test(jsSinComentarios) &&
  /focoPrevio=document\.activeElement/.test(codigoPaneles) &&
  /document\.contains\(focoPrevio\)[\s\S]*?focoPrevio\.focus\(\)/.test(codigoPaneles));
prueba('Atrás de Android o del navegador cierra la ficha antes de abandonar RWAdar',
  /history\.pushState\([\s\S]*?rwadarPanel:true/.test(codigoPaneles) &&
  /addEventListener\(['"]popstate['"][\s\S]*?cierraPanelVisual\(\)/.test(codigoPaneles) &&
  /if\(retiraEntrada\)history\.back\(\)/.test(codigoPaneles));
prueba('el detalle dinámico mantiene CSP estricta y escapa los datos antes de usar HTML',
  camposDetalle.every(([, valor]) => codigoDetalle.includes(`escHtml(${valor})`)) &&
  ['p.n','p.nota','p.aval'].every(valor => codigoDetalle.includes(`escHtml(${valor})`)) &&
  /const web=urlHttps\(p\.web\)/.test(codigoDetalle) && /href="\$\{escHtml\(web\)\}"/.test(codigoDetalle) &&
  !/(?:\bdocument\.write\s*\(|\.insertAdjacentHTML\s*\(|\.outerHTML\s*=|setAttribute\(\s*['"]on[a-z]+['"]|\beval\s*\(|javascript\s*:|\sstyle\s*=|\son[a-z]+\s*=)/i.test(codigoDetalle));
const normalizaConsultaMedia = consulta => consulta.toLowerCase().replace(/\s+/g, '');
const ramaMovilVertical = '(max-width:767px)';
const ramaPaisajeTactil = '(max-width:960px)and(max-height:540px)and(hover:none)and(pointer:coarse)';
const bloqueShellMovil = mediasCSS.find(media =>
  /display\s*:\s*(?:grid|flex)/i.test(declaracionesCSS(media.contenido, '.movil-nav').join(';')));
const consultaShellJS = (jsSinComentarios.match(
  /const\s+media\s*=\s*window\.matchMedia\(\s*(["'])([^"']+)\1\s*\)/) || [])[2] || '';
const ramasShellCSS = (bloqueShellMovil?.consulta || '').split(',').map(normalizaConsultaMedia);
const ramasShellJS = consultaShellJS.split(',').map(normalizaConsultaMedia);
prueba('CSS y JS limitan el paisaje móvil a 960 × 540 con entrada exclusivamente táctil',
  ramasShellCSS.length === 2 && ramasShellJS.length === 2 &&
  [ramaMovilVertical, ramaPaisajeTactil].every(rama =>
    ramasShellCSS.includes(rama) && ramasShellJS.includes(rama)));
const inicioShellMovil = js.indexOf('const Movil = (function(){');
const finShellMovil = js.indexOf('/* Una sola delegación', inicioShellMovil);
const codigoShellMovil = inicioShellMovil >= 0 && finShellMovil > inicioShellMovil
  ? sinComentariosJS(js.slice(inicioShellMovil, finShellMovil)) : '';
prueba('iPhone y Android ejecutan el mismo shell sin bifurcaciones por agente de usuario',
  codigoShellMovil.length > 0 &&
  !/(?:navigator\.(?:userAgent|userAgentData|platform)|\biPhone\b|\biPad\b|\biPod\b|\bAndroid\b|\bCriOS\b|\bSafari\b)/i
    .test(codigoShellMovil) &&
  /display-mode:\s*standalone/.test(codigoShellMovil));
prueba('la navegación móvil sincroniza selección, panel, foco y teclado',
  /movilNav/.test(jsSinComentarios) && /data-movil-tab/.test(jsSinComentarios) &&
  /setAttribute\(\s*['"]aria-selected['"]/.test(jsSinComentarios) &&
  /(?:\.tabIndex\s*=|setAttribute\(\s*['"]tabindex['"])/.test(jsSinComentarios) &&
  /\.hidden\s*=/.test(jsSinComentarios) && /addEventListener\(\s*['"]keydown['"]/.test(jsSinComentarios) &&
  ['ArrowLeft','ArrowRight','Home','End'].every(tecla => jsSinComentarios.includes(tecla)));
prueba('el cambio dinámico mantiene una sola pestaña y un solo panel activos',
  cambioTabsMovilEsCoherente(js));
const declaracionFondo = (jsSinComentarios.match(/const\s+fondo\s*=\s*\(\)\s*=>[^;]+;/) || [])[0] || '';
prueba('la navegación inferior queda inerte detrás de fichas, comparativas y cuenta',
  declaracionFondo.includes('#movilNav') &&
  /fondo\(\)\.forEach\([^)]*setAttribute\(\s*['"]inert['"]/.test(jsSinComentarios) &&
  /fondo\(\)\.forEach\([^)]*removeAttribute\(\s*['"]inert['"]/.test(jsSinComentarios));
const codigoNavMovil = jsSinComentarios.slice(jsSinComentarios.indexOf('movilNav'));
prueba('volver a Buscar programa una medición nueva después de mostrar el panel',
  /data-movil-tab/.test(codigoNavMovil) && /buscar/.test(codigoNavMovil) &&
  /requestAnimationFrame/.test(codigoNavMovil) &&
  /(?:dispatchEvent\([^)]*(?:resize|rwadar)|clientWidth|redimension|recalcular)/i.test(codigoNavMovil) &&
  /cv\.clientWidth/.test(jsSinComentarios) && /cv\.width\s*!==\s*w/.test(jsSinComentarios));
const ordenMovil = selector => Number((declaracionesCSS(cssMovil, selector).join(';').match(/order\s*:\s*(\d+)/i) || [])[1] || 0);
prueba('Buscar prioriza ofertas, búsqueda, radar animado, Academy y resultados',
  ordenMovil('#movilPanelRadar>.emis') === 1 &&
  ordenMovil('#movilPanelRadar>.tool') === 2 &&
  ordenMovil('#movilPanelRadar>.barra') === 3 &&
  ordenMovil('#movilPanelRadar>.movil-radar-intro') === 4 &&
  ordenMovil('#movilPanelRadar>.portada-radar') === 5 &&
  ordenMovil('#movilPanelRadar>.movil-banner-explica') === 7 &&
  ordenMovil('#movilPanelRadar>#plataformasResultados') === 8 &&
  ordenMovil('#movilPanelRadar>.movil-transparencia') === 9 &&
  ordenMovil('#movilPanelRadar>.portada-txt') > 9);
prueba('Buscar mueve los mismos nodos y restaura su lugar al volver a escritorio',
  (html.match(/\bid=["']emisiones["']/g) || []).length === 1 &&
  /paneles\.get\(['"]buscar['"]\)/.test(codigoShellMovil) &&
  /createComment\(['"]rwadar: posici[oó]n de escritorio ['"]\+indice\)/i.test(codigoShellMovil) &&
  /ordenMovil\.forEach/.test(codigoShellMovil) && /restaurarEscritorio/.test(codigoShellMovil) &&
  reparentadoEmisionesEsReversible(js));
prueba('la portada móvil conserva un acceso táctil explícito a Academy y a la lección 3D',
  /class="movil-banner-explica"[^>]*data-movil-action="academy"/.test(html) &&
  /RWAdar Academy/.test(html) && /Abrir la primera lección/.test(html) &&
  /display\s*:\s*grid/i.test(declaracionesCSS(cssMovil, '.movil-banner-explica').join(';')));
prueba('los resultados móviles muestran seis fichas y conservan las 26 en el DOM',
  /id="plataformasResultados"/.test(html) &&
  /id="movilResultadosMas"[^>]*data-accion="alternar-resultados"[^>]*aria-controls="grid"/.test(html) &&
  /#grid:not\(\.movil-resultados-abiertos\)>\.ficha:nth-child\(n\+7\)/.test(cssMovil) &&
  /LIMITE_MOVIL_RESULTADOS=6/.test(jsSinComentarios) &&
  /filtrando\|\|S2\.view!==['"]grid['"]/.test(jsSinComentarios));
prueba('Academy es una subvista de Buscar sin vídeos ni canvas inventados',
  /id="academy"[^>]*aria-labelledby="academyTit"/.test(html) &&
  /data-movil-action="cerrar-academy"/.test(html) &&
  /La videoteca todavía no tiene vídeos publicados/.test(html) &&
  (html.match(/\bid=["'](?:explain|scene|gl)["']/g) || []).length === 3 &&
  /academyLeccion\.appendChild\(explicador\)/.test(jsSinComentarios) &&
  /rwadarAcademy/.test(jsSinComentarios));
prueba('Academy vuelve al primer paso y reinicia su ciclo completo al abrirse',
  /irPaso\(0,false\);\s*if\(typeof reiniciarPasosAutomaticos===['"]function['"]\)reiniciarPasosAutomaticos\(\)/
    .test(jsSinComentarios) &&
  /function reiniciarPasosAutomaticos\(\)[\s\S]*?clearInterval\(reloj\)[\s\S]*?setInterval\(\(\)=>irPaso/.test(jsSinComentarios));
prueba('la información extensa de Buscar usa detalle progresivo sin perder contenido',
  /id="movilTransparencia"/.test(html) &&
  ['presentacion','metodo','fuera'].every(id =>
    new RegExp(`data-movil-action="detalle"[^>]*data-movil-detalle="${id}"[^>]*aria-controls="${id}"`).test(html)) &&
  /function mostrarDetalle\(/.test(jsSinComentarios) && /rwadarDetalle/.test(jsSinComentarios) &&
  /movil-detalle-abierto/.test(jsSinComentarios) &&
  /#movilPanelRadar\.movil-detalle-abierto>\*/.test(cssMovil) &&
  /#movilPanelRadar\.movil-detalle-abierto>\.movil-detalle-activo/.test(cssMovil));
prueba('Atrás y Adelante restauran las tres subvistas sin mezclar estados',
  /function estadoBaseSubvista\(\)/.test(codigoShellMovil) &&
  ['rwadarDetalle','rwadarAcademy','rwadarAvisos'].every(marca =>
    new RegExp(`delete estado\\.${marca}`).test(codigoShellMovil)) &&
  /function reconciliarEstadoSubvista\(enfocar=true\)/.test(codigoShellMovil) &&
  /mostrarDetalle\([^;]+enfocar,false,origen\)/.test(codigoShellMovil) &&
  /mostrarAcademy\(true,enfocar,false,document\.getElementById\(['"]movilAbrirAcademy['"]\)\)/.test(codigoShellMovil) &&
  /mostrarAvisos\(true,enfocar,false\)/.test(codigoShellMovil) &&
  /pageshow[\s\S]*?!e\.persisted\|\|media\.matches!==modoMovilPrevio[\s\S]*?reconciliarEstadoSubvista\(false\)/.test(codigoShellMovil));
prueba('el cierre devuelve el foco a un control que también queda dentro de pantalla',
  /getClientRects&&nodo\.getClientRects\(\)\.length/.test(codigoShellMovil) &&
  /function devolverFoco\(origen,alternativo\)/.test(codigoShellMovil) &&
  /if\(!enVista\(destino\)&&destino\.scrollIntoView\)/.test(codigoShellMovil) &&
  /scrollIntoView\(\{block:['"]center['"],behavior:['"]auto['"]\}\)/.test(codigoShellMovil) &&
  /document\.getElementById\(['"]q['"]\)\|\|document\.getElementById\(['"]movilTabRadar['"]\)/.test(codigoShellMovil));
prueba('Ayuda sustituye Detalle o Avisos sin encadenar back y push',
  /if\(academyAbierta\)[\s\S]{0,240}?return/.test(codigoShellMovil) &&
  /const sustituyeAvisos=[\s\S]{0,180}?rwadarAvisos===true/.test(codigoShellMovil) &&
  /mostrarAvisos\(false,false,false\)/.test(codigoShellMovil) &&
  /\(sustituyeDetalle\|\|sustituyeAvisos\)[\s\S]{0,180}?history\.replaceState/.test(codigoShellMovil));
prueba('el sonido es voluntario, cálido y la animación automática permanece silenciosa',
  /recuerda\.leer\(['"]rwadar\.sonido['"]\)===['"]1['"]/.test(jsSinComentarios) &&
  /function pulsoCalido\(/.test(jsSinComentarios) &&
  /document\.hidden/.test(jsSinComentarios) &&
  /if\(manual&&escenaVisible\)\s*Sonido\.paso\(i\)/.test(jsSinComentarios) &&
  !/paso\(i\)[\s\S]{0,250}f\*2\.7/.test(jsSinComentarios));
prueba('el buscador móvil es un panel principal y las fichas tienen un CTA propio',
  /class="movil-busqueda-cab"/.test(html) && /Encuentra una plataforma/.test(html) &&
  /class="movil-ficha-abrir" data-abrir=/.test(js) &&
  /min-height\s*:\s*48px/i.test(declaracionesCSS(cssMovil, '.movil-ficha-abrir').join(';')));
const plataformasFuente = arrayDe(js, 'P');
const slugPortada = valor => String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rutasPortada = plataformasFuente.map(p => `/plataformas/${slugPortada(p.n)}.webp`);
const manifiestoPortadas = JSON.parse(lee('plataformas/fuentes.json'));
const entradasPortadas = manifiestoPortadas.plataformas || [];
const portadasPorEmpresa = new Map(entradasPortadas.map(x => [x?.empresa, x]));
const botonesEmpresaVisual = etiquetasInicio.filter(e => e[1].toLowerCase() === 'button' &&
  (atributoHTML(e[2], 'class') || '').split(/\s+/).includes('empresa-visual__abrir'));
const imagenesEmpresaVisual = etiquetasInicio.filter(e => e[1].toLowerCase() === 'img' &&
  (atributoHTML(e[2], 'class') || '').split(/\s+/).includes('empresa-visual__imagen'));
prueba('las 26 empresas usan portadas WebP locales y trazables a su página oficial',
  rutasPortada.length === 26 && new Set(rutasPortada).size === 26 &&
  entradasPortadas.length === 26 && portadasPorEmpresa.size === 26 &&
  new Set(entradasPortadas.map(x => x?.archivo)).size === 26 &&
  rutasPortada.every((ruta, i) => {
    const plataforma = plataformasFuente[i];
    const entrada = portadasPorEmpresa.get(plataforma.n);
    const bytes = fs.readFileSync(path.join(sitio, ...ruta.slice(1).split('/')));
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    return entrada && !entrada.error && entrada.empresa === plataforma.n &&
      entrada.archivo === ruta.slice(1) && /^https:\/\//.test(entrada.pagina) &&
      /^https:\/\//.test(entrada.imagenOrigen) && entrada.bytes === bytes.length &&
      entrada.sha256 === sha256 && /^[a-f0-9]{64}$/.test(entrada.sha256) &&
      bytes.length > 1024 && bytes.subarray(0,4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8,12).toString('ascii') === 'WEBP';
  }));
prueba('cada portada móvil es el botón accesible que abre su ficha y carga la imagen de forma eficiente',
  botonesEmpresaVisual.length === 26 && imagenesEmpresaVisual.length === 26 &&
  botonesEmpresaVisual.every((b, i) => atributoHTML(b[2], 'type') === 'button' &&
    atributoHTML(b[2], 'data-abrir') === String(i) &&
    atributoHTML(b[2], 'aria-label') === `Abrir la ficha de ${plataformasFuente[i].n}` &&
    atributoHTML(imagenesEmpresaVisual[i]?.[2] || '', 'src') === rutasPortada[i]) &&
  imagenesEmpresaVisual.every(img => atributoHTML(img[2], 'alt') === '' &&
    atributoHTML(img[2], 'width') === '720' && atributoHTML(img[2], 'height') === '720' &&
    atributoHTML(img[2], 'decoding') === 'async' &&
    atributoHTML(img[2], 'loading') === 'lazy'));
prueba('la galería visual solo sustituye las fichas en móvil y mantiene dos columnas táctiles',
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.empresa-visual__abrir').join(';')) &&
  /grid-template-columns\s*:\s*repeat\(2,minmax\(0,1fr\)\)/i.test(
    declaracionesCSS(cssMovil, '#movilPanelRadar .rejilla').join(';')) &&
  /display\s*:\s*block/i.test(declaracionesCSS(cssMovil, '#movilPanelRadar .empresa-visual__abrir').join(';')) &&
  /display\s*:\s*none!important/i.test(declaracionesCSS(cssMovil, '#movilPanelRadar .ficha>.ficha-alto').join(';')) &&
  /width\s*:\s*44px/i.test(declaracionesCSS(cssMovil, '#movilPanelRadar .empresa-visual__comparar').join(';')) &&
  /height\s*:\s*44px/i.test(declaracionesCSS(cssMovil, '#movilPanelRadar .empresa-visual__comparar').join(';')));
prueba('comparar restaura el foco al control visible tras reconstruir las fichas',
  js.includes(`const boton=[...document.querySelectorAll('[data-comparar="'+i+'"]')]`) &&
  js.includes('.find(nodo=>nodo.getClientRects&&nodo.getClientRects().length);') &&
  js.includes('if(boton)boton.focus({preventScroll:true});'));
prueba('las superficies nuevas solo aparecen dentro de la interfaz móvil',
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-banner-explica').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-busqueda-cab').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-ficha-abrir').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-ofertas-intro').join(';')));
prueba('Favoritos pinta fichas reales desde la vigilancia existente y escapa el contenido',
  /id="movilSiguiendoLista"[^>]*aria-live="polite"[^>]*hidden/.test(html) &&
  /P\.filter\(p=>vigiladas\.has\(p\.n\)\)/.test(jsSinComentarios) &&
  /class="movil-seguida/.test(js) && /escHtml\(p\.n\)/.test(js) &&
  /Eso no significa que hayas invertido ni activa envíos/.test(html));

const inicioInversiones = html.indexOf('<section class="movil-panel" id="movilPanelInversiones"');
const finInversiones = html.indexOf('</section>', inicioInversiones);
const panelInversionesHTML = inicioInversiones >= 0 && finInversiones > inicioInversiones
  ? html.slice(inicioInversiones, finInversiones + 10) : '';
const textoInversiones = textoHTML(panelInversionesHTML);
prueba('Inversiones declara la ausencia de registro sin inventar cartera, saldos ni contadores',
  /RWAdar todavía no registra inversiones/.test(textoInversiones) &&
  /no intermedia operaciones ni recibe saldos/.test(textoInversiones) &&
  /Favoritos y comparaciones nunca se presentan como inversiones/.test(textoInversiones) &&
  !/(?:movil-resumen-numero|movil-seguida|\bemi(?:-|\b)|data-abrir|data-comparar)/i.test(panelInversionesHTML) &&
  !/(?:rentabilidad|beneficio|confirmada|reservada|saldo\s*[:：]|\b[1-9]\d*(?:[.,]\d+)?\s*%)/i.test(textoInversiones));
prueba('Inversiones solo deriva hacia las ofertas verificadas de Buscar',
  /data-movil-ir=["']emisiones["']/.test(panelInversionesHTML) &&
  /function ir\(destino,origen=null\)\{\s*cambiar\(['"]buscar['"]/.test(codigoShellMovil) &&
  !/data-movil-action=["']cuenta["']/.test(panelInversionesHTML));

const vistaAvisosHTML = (html.match(
  /<section\b([^>]*)\bid=["']movilVistaAvisos["']([^>]*)>[\s\S]*?<\/section>/i) || [''])[0];
const etiquetaVistaAvisos = (html.match(
  /<section\b([^>]*)\bid=["']movilVistaAvisos["']([^>]*)>/i) || []);
const atributosVistaAvisos = `${etiquetaVistaAvisos[1] || ''} ${etiquetaVistaAvisos[2] || ''}`;
prueba('Avisos es una subvista oculta de Mi cuenta y nunca una quinta pestaña',
  Boolean(vistaAvisosHTML) && atributoHTML(atributosVistaAvisos, 'data-movil-panel') === null &&
  atributoHTML(atributosVistaAvisos, 'role') !== 'tabpanel' &&
  atributoHTML(atributosVistaAvisos, 'hidden') !== null &&
  /id=["']movilAbrirAvisos["'][^>]*data-movil-action=["']avisos["'][^>]*aria-controls=["']movilVistaAvisos["'][^>]*aria-expanded=["']false["']/i.test(html) &&
  !botonesNavMovil.some(b => /Avisos/i.test(textoHTML(b[2]))));
prueba('la subvista conserva los tres estados reales sin prometer entrega activa',
  (vistaAvisosHTML.match(/class="movil-estado-paso(?:\s|"|$)/g) || []).length === 3 &&
  /Correo y push siguen cerrados hasta superar la prueba real/.test(vistaAvisosHTML) &&
  !/Entrega activa/.test(textoHTML(vistaAvisosHTML)) &&
  /data-movil-action=["']cerrar-avisos["']/.test(vistaAvisosHTML));
prueba('abrir y cerrar Avisos sincroniza hidden, aria-expanded y devuelve el foco',
  subvistaAvisosConservaEstadoYFoco(js));

const inicioCuentaMovil = html.indexOf('<section class="movil-panel" id="movilPanelMas"');
const finCuentaMovil = html.indexOf('<nav class="movil-nav"', inicioCuentaMovil);
const panelCuentaMovilHTML = inicioCuentaMovil >= 0 && finCuentaMovil > inicioCuentaMovil
  ? html.slice(inicioCuentaMovil, finCuentaMovil) : '';
prueba('Mi cuenta agrupa acceso, avisos, privacidad y seguridad sin ocultar herramientas',
  /Perfil y seguridad/.test(panelCuentaMovilHTML) && /Avisos y preferencias/.test(panelCuentaMovilHTML) &&
  /id=["']movilVistaAvisos["']/.test(panelCuentaMovilHTML) &&
  /href=["']\/privacidad["']/.test(panelCuentaMovilHTML) &&
  /no pide datos bancarios, claves de monedero ni frases de recuperación/.test(panelCuentaMovilHTML) &&
  /data-movil-action=["']academy["']/.test(panelCuentaMovilHTML) &&
  ['metodo','fuera'].every(destino =>
    new RegExp(`data-movil-ir=["']${destino}["']`).test(panelCuentaMovilHTML)));

const inicioEmisionesHTML = html.indexOf('<section class="emis wrap" id="emisiones"');
const finEmisionesHTML = html.indexOf('</section>', inicioEmisionesHTML);
const emisionesHTML = inicioEmisionesHTML >= 0 && finEmisionesHTML > inicioEmisionesHTML
  ? html.slice(inicioEmisionesHTML, finEmisionesHTML + 10) : '';
const emisionesFuente = arrayDe(js, 'EMI');
prueba('Buscar presenta emisiones comprobadas, no anuncios ni recomendaciones inventadas',
  /OFERTAS ESPECÍFICAS/.test(emisionesHTML) && /Ofertas verificadas/.test(emisionesHTML) &&
  /Con origen, fecha y revisión independiente/.test(emisionesHTML) &&
  /RWAdar no intermedia, no custodia dinero y no recomienda/.test(emisionesHTML) &&
  !/(?:recomendada para ti|rentabilidad garantizada|oferta exclusiva)/i.test(textoHTML(emisionesHTML)));
prueba('cero emisiones mantiene un vacío explícito y oculta filtros inútiles',
  (emisionesFuente.length > 0 ||
    (/Sin emisiones abiertas/.test(emisionesHTML) &&
     /Publicaremos aquí las primeras cuando su origen y sus cifras estén comprobados/.test(emisionesHTML))) &&
  /const hayPublicadas=EMI\.some\(emisionValida\)/.test(jsSinComentarios) &&
  /seccion\.classList\.toggle\(['"]sin-emisiones['"],!hayPublicadas\)/.test(jsSinComentarios) &&
  /futuro\.hidden=hayPublicadas/.test(jsSinComentarios) &&
  /\.emis\.sin-emisiones \.emis-orden/.test(cssMovil) &&
  /\.emis\.sin-emisiones \.emis-filtros\s*\{display\s*:\s*none/.test(cssMovil));
prueba('el escritorio recupera emisiones en su posición editorial y no muestra la decoración móvil',
  html.indexOf('<section class="portada"') < inicioEmisionesHTML &&
  inicioEmisionesHTML < html.indexOf('<section class="explica wrap" id="explain"') &&
  /ordenarBuscar\(esMovil\)/.test(codigoShellMovil) &&
  /paneles\.forEach\(\(panel,nombre\)=>\{panel\.hidden=nombre!==['"]buscar['"]/.test(codigoShellMovil) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-ofertas-intro').join(';')) &&
  !/display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.emis').join(';')));
prueba('radar, fichas, comparador, método, descartes y 3D siguen en el único panel Buscar',
  ['radarHero','tool','grid','cmpbar','explain','scene','gl','metodo','fuera']
    .every(id => ids.includes(id)) &&
  /data-movil-action=["']academy["']/.test(html) &&
  ['metodo','fuera'].every(destino =>
    new RegExp(`data-movil-ir=["']${destino}["']`).test(html)) &&
  /function ir\(destino,origen=null\)\{\s*cambiar\(['"]buscar['"]/.test(codigoShellMovil));
prueba('la barra no introduce manejadores inline ni atributos ejecutables',
  botonesNavMovil.every(b => !/\son[a-z]+\s*=|javascript\s*:/i.test(b[1])) &&
  !/\son[a-z]+\s*=|javascript\s*:/i.test(navMovil?.[0] || ''));
const enlaces = [...html.matchAll(/<a\b([^>]*)>/gi)];
prueba('los enlaces no usan javascript: y todo target blank corta window.opener',
  enlaces.every(enlace => {
    const href = atributoHTML(enlace[1], 'href') || '';
    const target = atributoHTML(enlace[1], 'target');
    const rel = (atributoHTML(enlace[1], 'rel') || '').toLowerCase().split(/\s+/);
    return !/^\s*javascript\s*:/i.test(href) &&
      (target?.toLowerCase() !== '_blank' || rel.includes('noopener'));
  }));
prueba('el JavaScript de cliente evita sinks ejecutables de alto riesgo',
  !/(?:\bdocument\.write\s*\(|\.insertAdjacentHTML\s*\(|\.outerHTML\s*=|setAttribute\(\s*['"]on[a-z]+['"]|\beval\s*\()/i.test(jsSinComentarios));

const manifest = JSON.parse(lee('manifest.webmanifest'));
prueba('la portada declara el manifest y el icono Apple',
  /rel="manifest" href="\/manifest\.webmanifest"/.test(html) && /rel="apple-touch-icon"/.test(html));
prueba('el manifest es instalable y tiene iconos 192, 512 y maskable',
  manifest.start_url==='/' && manifest.display==='standalone' &&
  manifest.icons.some(i=>i.sizes==='192x192') && manifest.icons.some(i=>i.sizes==='512x512') &&
  manifest.icons.some(i=>i.purpose==='maskable'));
prueba('el service worker se registra solo bajo HTTP(S)',
  /trabajador\.register\('\/sw\.js'/.test(js) && /\^https\?:\$/.test(js));
prueba('el service worker fuente identifica la entrega móvil actual',
  /const VERSION\s*=\s*['"]rwadar-v20260822-recarga['"]/.test(sw));
prueba('el precache crítico se instala de forma atómica',
  /await c\.addAll\(ARMAZON\)/.test(sw) && !/\.add\(u\)\.catch/.test(sw) && await pruebaInstalacionAtomica(sw));
prueba('cada navegación se guarda bajo su propia ruta',
  /const clave = url\.pathname/.test(sw) && /cache\.put\(clave, res\.clone\(\)\)/.test(sw) &&
  !/cache\.put\('\/', res\.clone\(\)\)/.test(sw));
prueba('solo se cachean recursos estáticos públicos del mismo origen',
  /url\.origin !== self\.location\.origin/.test(sw) && /esEstaticoPublico/.test(sw));
prueba('las emisiones se revalidan desde Supabase sin vaciar la copia ante un fallo',
  /emisiones_publicas\?select=\*&estado=in\.\(abierta,programada,en_estudio\)/.test(js) &&
  /const nE=e\.map\(emisionRemota\)/.test(js) && /EMI\.length=0;\s+EMI\.push/.test(js) &&
  /try\{ if\(await alDia\(\)\)/.test(js));

const armazon = arrayConstante(sw, 'ARMAZON');
const recursosCriticos = ['/', '/privacidad', scripts[0][1], estilos[0][1],
  '/assets/privacidad-20260820.css', '/manifest.webmanifest', ...manifest.icons.map(icono => icono.src),
  ...rutasPortada];
const existeRutaArmazon = ruta => {
  if (ruta === '/') return fs.existsSync(path.join(sitio, 'index.html'));
  if (ruta === '/privacidad') return fs.existsSync(path.join(sitio, 'privacidad.html'));
  return fs.existsSync(path.join(sitio, ...ruta.slice(1).split('/')));
};
prueba('el armazón PWA contiene una sola vez toda la interfaz crítica que declara la portada',
  armazon.length === new Set(armazon).size && recursosCriticos.every(ruta => armazon.includes(ruta)) &&
  armazon.every(ruta => /^\/(?:[^?#]*)$/.test(ruta) && existeRutaArmazon(ruta)));
prueba('las 26 portadas forman parte del precache de la primera instalación',
  armazon.filter(ruta => /^\/plataformas\/.+\.webp$/.test(ruta)).length === 26 &&
  rutasPortada.every(ruta => armazon.includes(ruta)));
prueba('el armazón no persiste el worker, APIs, sesiones ni respuestas dinámicas',
  !armazon.includes('/sw.js') &&
  armazon.every(ruta => !/(?:supabase|\/auth\/|\/rest\/|access_token|refresh_token|rwadar\.csv)/i.test(ruta)));
prueba('la PWA es standalone de forma estándar además de declarar compatibilidad Apple',
  manifest.id === '/' && manifest.scope === '/' && manifest.start_url === '/' &&
  manifest.display === 'standalone' && manifest.display_override?.includes('standalone') &&
  /<meta\s+name=["']mobile-web-app-capable["']\s+content=["']yes["']/i.test(html) &&
  /<meta\s+name=["']apple-mobile-web-app-capable["']\s+content=["']yes["']/i.test(html));
const colorTema = (html.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
prueba('portada y manifest comparten los colores de arranque para evitar destellos al instalar',
  colorTema.toLowerCase() === manifest.theme_color.toLowerCase() &&
  manifest.background_color.toLowerCase() === manifest.theme_color.toLowerCase());
prueba('activar una entrega elimina cachés anteriores y toma control de los clientes',
  await pruebaActivacionCache(sw));
const primeraActivacion = await pruebaActivacionSinMigracion(sw, false);
const clienteRecargado = await pruebaActivacionSinMigracion(sw, true);
prueba('la primera instalación no navega clientes si no había otra caché RWAdar',
  primeraActivacion.consultas === 0 && primeraActivacion.navegaciones === 0);
prueba('la migración no duplica la recarga si controllerchange ya renovó el documento',
  clienteRecargado.consultas === 2 && clienteRecargado.navegaciones === 0);
prueba('un fallo al escribir caché nunca sustituye navegación ni assets recibidos de la red',
  await pruebaRedConCacheRota(sw));
const actualizacionControlada = await pruebaActualizacionPWACliente(js, true);
const primeraInstalacion = await pruebaActualizacionPWACliente(js, false);
prueba('la PWA consulta el worker sin caché al cargar, reanudarse y volver a primer plano',
  actualizacionControlada.registro?.ruta === '/sw.js' &&
  actualizacionControlada.registro?.opciones?.updateViaCache === 'none' &&
  actualizacionControlada.actualizaciones === 3);
prueba('un cambio de controlador recarga una sola vez una PWA ya instalada',
  actualizacionControlada.escuchaCambio && actualizacionControlada.recargas === 1);
prueba('la primera instalación no provoca una recarga ni puede entrar en bucle',
  primeraInstalacion.recargas === 0);
prueba('la navegación sigue siendo red primero y solo cae a caché ante un fallo',
  /if \(req\.mode === 'navigate'\)[\s\S]*?try \{\s*const res = await fetch\(req\);[\s\S]*?catch \(_\) \{\s*return \(await cache\.match\(clave\)\)/.test(sw));

const casoRegex = 'function f(c){return /[/*]/.test(c)}';
const casoReducido = sinComentariosJS(casoRegex);
new Function(casoReducido);
prueba('el adelgazador conserva regex con marcas de comentario', casoReducido === casoRegex);
const jsReducido = adelgazarJS(js);
new Function(jsReducido);
prueba('el JavaScript adelgazado compila y pesa menos', jsReducido.length < js.length);
for (const nombre of ['P','FUERA','EMI'])
  prueba(`el adelgazado conserva exactamente ${nombre}`, JSON.stringify(arrayDe(js,nombre)) === JSON.stringify(arrayDe(jsReducido,nombre)));
const htmlPublicado = fs.readFileSync(path.join(publicado, 'index.html'), 'utf8');
const privacidadPublicada = fs.readFileSync(path.join(publicado, 'privacidad.html'), 'utf8');
const swPublicado = fs.readFileSync(path.join(publicado, 'sw.js'), 'utf8');
const scriptsPublicados = [...htmlPublicado.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const recursoJSPublicado = scriptsPublicados.at(-1)?.[1] || '';
const hojasPublicadas = [htmlPublicado, privacidadPublicada].flatMap(documento =>
  [...documento.matchAll(/<link\b([^>]*)>/gi)]
    .filter(link => (atributoHTML(link[1], 'rel') || '').toLowerCase().split(/\s+/).includes('stylesheet'))
    .map(link => atributoHTML(link[1], 'href')));
const armazonPublicado = arrayConstante(swPublicado, 'ARMAZON');
const rutaJSPublicado = path.join(publicado, '.' + recursoJSPublicado);
const jsPublicado = fs.readFileSync(rutaJSPublicado, 'utf8');
const huellaJSIndependiente = crypto.createHash('sha256').update(jsPublicado).digest('hex').slice(0, 12);
prueba('el árbol generado existe y usa el JavaScript adelgazado con huella real',
  fs.existsSync(path.join(publicado,'.well-known','security.txt')) &&
  fs.readFileSync(path.join(publicado,'.well-known','security.txt'),'utf8') === lee('.well-known/security.txt') &&
  jsPublicado === jsReducido &&
  new RegExp(`/assets/rwadar-20260820\\.${huellaJSIndependiente}\\.js$`).test(recursoJSPublicado));
const archivosPublicados = listarArchivosRegulares(publicado);
const assetsPublicados = archivosPublicados.filter(x=>x.startsWith('assets/'));
const portadasPublicadas = archivosPublicados.filter(x=>/^plataformas\/.+\.webp$/.test(x));
prueba('todo asset desplegable lleva su huella de contenido y no queda el nombre estable',
  assetsPublicados.length === 4 && assetsPublicados.every(x=>/\.[a-f0-9]{12}\.(?:css|js)$/.test(x)) &&
  !archivosPublicados.some(x=>/^assets\/(?:error|privacidad|rwadar)-20260820\.(?:css|js)$/.test(x)));
prueba('el paquete desplegable incluye las 26 portadas y su manifiesto de procedencia',
  portadasPublicadas.length === 26 &&
  archivosPublicados.includes('plataformas/fuentes.json') &&
  rutasPortada.every(ruta => portadasPublicadas.includes(ruta.slice(1))));
prueba('HTML y service worker apuntan al mismo JavaScript versionado',
  htmlPublicado.includes(recursoJSPublicado) && swPublicado.includes(recursoJSPublicado));
prueba('el worker publicado precachea los assets con huella que realmente usan ambas páginas',
  recursoJSPublicado && hojasPublicadas.length === 2 &&
  ['/', '/privacidad', recursoJSPublicado, ...hojasPublicadas,
    '/manifest.webmanifest', ...manifest.icons.map(icono => icono.src), ...rutasPortada]
    .every(ruta => armazonPublicado.includes(ruta)) &&
  armazonPublicado.length === new Set(armazonPublicado).size &&
  !armazonPublicado.some(ruta => /^\/assets\/(?:privacidad|rwadar)-20260820\.(?:css|js)$/.test(ruta)));

const artefactosVersion = [...archivosPublicados].sort();
const hashVersionIndependiente = crypto.createHash('sha256');
const entradasVersion = {};
for (const nombre of artefactosVersion) {
  const originales = fs.readFileSync(path.join(publicado, ...nombre.split('/')));
  const bytes = nombre === 'sw.js'
    ? Buffer.from(originales.toString('utf8').replace(
      /const VERSION = 'rwadar-v[^']+';/, "const VERSION = '__RWADAR_VERSION__';"), 'utf8')
    : originales;
  entradasVersion[nombre] = bytes;
  hashVersionIndependiente.update(nombre).update('\0').update(bytes).update('\0');
}
const versionEsperada = `rwadar-v-${hashVersionIndependiente.digest('hex').slice(0,16)}`;
prueba('VERSION se deriva de todo el artefacto desplegable',
  swPublicado.includes(`const VERSION = '${versionEsperada}';`) &&
  versionCacheDesdeEntradas(entradasVersion) === versionEsperada);
prueba('un cambio de código o datos invalida nombre de asset y VERSION',
  nombreAssetVersionado('assets/prueba.js', 'const dato=1') !== nombreAssetVersionado('assets/prueba.js', 'const dato=2') &&
  versionCacheDesdeEntradas({a:'uno'}) !== versionCacheDesdeEntradas({a:'dos'}) &&
  huellaContenido('const dato=1') !== huellaContenido('const dato=2'));

console.log('\n=== PUBLICADOR, SINCRONIZADOR Y SERVIDOR ===');
prueba('el publicador exige exactamente un modo explícito',
  /modos\.length !== 1/.test(publicador) && /--local \| --preview \| --produccion/.test(publicador));
prueba('Wrangler está fijado a una versión exacta', /WRANGLER_VERSION = '\d+\.\d+\.\d+'/.test(publicador));
prueba('el publicador usa ComSpec en Windows y evita el EINVAL de ejecutar npx.cmd directamente',
  /process\.env\.ComSpec \|\| 'cmd\.exe'/.test(publicador) &&
  /\['\/d', '\/s', '\/c', 'npx\.cmd'\]/.test(publicador) &&
  /\.\.\.prefijoWrangler/.test(publicador));
prueba('el origen Cloudflare está fijado y se valida como origen HTTPS exacto',
  ORIGEN_PUBLICO === 'https://rwadar.pages.dev' && ORIGEN_LEGADO === 'https://rwadar.netlify.app' &&
  PROYECTO_CLOUDFLARE === 'rwadar' && comprobarOrigenPublico() === ORIGEN_PUBLICO);
prueba('solo se despliega rwadar-publicado al proyecto Cloudflare declarado',
  /'pages', 'deploy', SALIDA/.test(publicador) && /'--project-name', PROYECTO_CLOUDFLARE/.test(publicador));
prueba('producción usa main, preview usa una rama separada y no queda despliegue Netlify',
  /const rama = preview \? 'revision' : 'main'/.test(publicador) &&
  /'--branch', rama/.test(publicador) && !/netlify-cli|\bnetlify\s*,\s*args/.test(publicador));
prueba('la salida se construye desde lista cerrada y nunca por copia recursiva',
  /ARCHIVOS_PUBLICABLES/.test(publicador) && /fs\.copyFileSync/.test(publicador) && !/fs\.cpSync/.test(publicador));
prueba('el publicador bloquea una plataforma sin portada WebP local y publicable',
  /vm\.runInContext\('P\.map\(plataforma => plataforma\.n\)'/.test(publicador) &&
  /function validarPortadasPlataformas\(contenido, nombres\)/.test(publicador) &&
  /const esperadas = nombres\.map\(nombre => `\/plataformas\/\$\{slugPortada\(nombre\)\}\.webp`\)/.test(publicador) &&
  /ruta !== esperadas\[i\]/.test(publicador) &&
  /rutas\.length !== fichas/.test(publicador) && /new Set\(rutas\)\.size !== fichas/.test(publicador) &&
  /ARCHIVOS_PUBLICABLES\.includes\(relativa\)/.test(publicador) &&
  /fs\.existsSync\(archivo\)/.test(publicador) && /RIFF/.test(publicador) && /WEBP/.test(publicador) &&
  publicador.indexOf('validarPortadasPlataformas(capturado.grid, nombresPlataformas)') > -1 &&
  publicador.indexOf('validarPortadasPlataformas(capturado.grid, nombresPlataformas)') <
    publicador.indexOf("html = inyectar(html, 'grid'"));
prueba('el capturador de portadas bloquea SSRF y limita cada respuesta mientras la lee',
  /async function urlPublicaHttps\(valor\)/.test(capturadorPortadas) &&
  /url\.protocol !== 'https:'/.test(capturadorPortadas) && /dns\.lookup/.test(capturadorPortadas) &&
  /ipNoPublica/.test(capturadorPortadas) && /redirect: 'manual'/.test(capturadorPortadas) &&
  /MAX_REDIRECCIONES/.test(capturadorPortadas) && /res\.body\.getReader\(\)/.test(capturadorPortadas) &&
  /total > maximo/.test(capturadorPortadas));
prueba('el capturador conserva el encuadre y sustituye cada WebP solo tras validar un temporal',
  /force_original_aspect_ratio=decrease/.test(capturadorPortadas) &&
  /scale=720:720/.test(capturadorPortadas) && !/crop=720:480/.test(capturadorPortadas) &&
  /temporalSalida/.test(capturadorPortadas) && /WebP convertido no válido/.test(capturadorPortadas) &&
  /await fs\.rename\(temporalSalida, destino\)/.test(capturadorPortadas));
prueba('el publicador genera y valida JS/CSS adelgazados',
  /adelgazarJS/.test(publicador) && /adelgazarCSS/.test(publicador) && /new Function\(reducido\)/.test(publicador));
prueba('no existe promoción ni despliegue alternativo tras un fallo',
  !/restoreSiteDeploy|api\/v1\/deploys|deployId|--prod-if-unlocked/.test(publicador));
prueba('todo remoto valida el estado legal declarado antes de sincronizar',
  /const remoto = preview \|\| produccion/.test(publicador) &&
  /if \(remoto\)[\s\S]*comprobarEstadoLegalPublicacion\(privacidad\)/.test(publicador) &&
  publicador.indexOf('comprobarEstadoLegalPublicacion(privacidad)') < publicador.indexOf("execFileSync('node'"));
prueba('todo remoto hace preflight Auth de solo lectura y falla cerrado',
  /if \(remoto\)[\s\S]*await comprobarConfiguracionAuth\(\)/.test(publicador) &&
  /mailer_autoconfirm !== false/.test(fs.readFileSync(path.join(raiz,'rwadar-publicacion-segura.js'),'utf8')));

prueba('el sincronizador escribe los datos en el JS externo',
  /const JS = path\.join\(SITIO, 'assets', 'rwadar-20260820\.js'\)/.test(sincronizador));
prueba('radar, descartes y emisiones se consultan juntos y fallan cerrados',
  /Promise\.all\(\[/.test(sincronizador) && !/let emisiones\s*=\s*\[\]/.test(sincronizador));
prueba('el sincronizador neutraliza <, > y separadores Unicode',
  /replace\(\/<\/g, '\\\\u003c'\)/.test(sincronizador) &&
  /replace\(\/>\/g, '\\\\u003e'\)/.test(sincronizador) && /\\u2028/.test(sincronizador));
prueba('las emisiones exigen URL HTTPS y fecha verificable', /esHttps\(e\.url\)/.test(sincronizador) && /verificada_el/.test(sincronizador));
prueba('el sincronizador valida que el JS generado compile', /new Function\(script\)/.test(sincronizador));
prueba('el CSV estable neutraliza fórmulas incluso tras espacios o tabuladores',
  celdaCSV('=HYPERLINK("https://evil.example")') === '"\'=HYPERLINK(""https://evil.example"")"' &&
  celdaCSV(' \t@SUM(1,1)').startsWith('"\' \t@') && celdaCSV('texto "normal"') === '"texto ""normal"""');
prueba('el publicador pre-renderiza también el escaparate de emisiones',
  /inyectar\(html, 'emiLista', capturado\.emiLista\)/.test(publicador));
prueba('el publicador captura y escribe la revisión derivada en el HTML',
  /capturadoTexto\.pieRevision/.test(publicador) && /marcaPie/.test(publicador));

prueba('el servidor escucha solo en loopback', /\.listen\(PUERTO, '127\.0\.0\.1'/.test(servidor));
prueba('guardar capturas requiere flag, origen local, PNG y límite',
  /const CAPTURAS = process\.argv\.includes\('--capturas'\)/.test(servidor) &&
  /ORIGENES_LOCALES\.includes\(origen\)/.test(servidor) && /firmaPng/.test(servidor) && /LIMITE_CAPTURA/.test(servidor));
prueba('el servidor local replica la CSP de worker/manifest',
  /worker-src 'self'/.test(servidor) && /manifest-src 'self'/.test(servidor));
prueba('servidor, worker y CDN tratan las portadas como imágenes estáticas propias',
  /'\.webp': 'image\/webp'/.test(servidor) &&
  /url\.pathname\.startsWith\('\/plataformas\/'\)/.test(sw) &&
  /\/plataformas\/\*[\s\S]{0,120}max-age=0, must-revalidate/.test(headers));

console.log('\n=== PRIVACIDAD, ÍNDICE Y BLOQUEOS ===');
prueba('la privacidad declara el acuerdo pendiente sin conservar un blocker remoto',
  /data-deploy-legal-status=["']acuerdo-pendiente-de-documentar["']/.test(privacidad) &&
  !/data-deploy-blocker/.test(privacidad));
const privacidadLineal = privacidad.replace(/\s+/g, ' ');
prueba('RWAdar exige una edad mínima de 18 años sin conservar el umbral antiguo',
  /exclusivamente a personas mayores de 18 años/i.test(privacidadLineal) &&
  /personas menores de 18 años no deben crear una cuenta/i.test(privacidadLineal) &&
  !/menores de 14 años/i.test(privacidadLineal));
for (const texto of ['Eric Almiñana','Samuel Rodriguez','Victor Jorques','RWAdar@protonmail.com'])
  prueba(`la privacidad identifica ${texto}`, privacidadLineal.includes(texto));
prueba('el estado pendiente es por acuerdo y plazos, no por los nombres ya facilitados',
  /pendiente de documentar/.test(privacidadLineal) && /propuestas no aprobadas ni automatizadas/.test(privacidadLineal) &&
  /Publicar no significa que ese acuerdo ya esté firmado/.test(privacidadLineal) &&
  !/grafía[\s\S]{0,100}pendiente de confirmación/.test(privacidad));
prueba('la privacidad declara Cloudflare sin analítica ni Zaraz',
  /no activa Cloudflare[\s\S]*Web Analytics[\s\S]*Zaraz/.test(privacidad) &&
  /Cloudflare Pages/.test(privacidad) && /cloudflare-customer-dpa/.test(privacidad));
prueba('la privacidad explica memoria de sesión y caché PWA sin tokens',
  /Memoria de la pestaña/.test(privacidad) && /No se guardan respuestas de Supabase,[\s\S]*tokens de sesión/.test(privacidad));
prueba('la privacidad distingue dispositivo preparado de entrega push no operativa',
  /permiso y token[\s\S]*no significa que vayas a recibir[\s\S]*avisos/.test(privacidadLineal) &&
  /entrega automática está desactivada/.test(privacidadLineal) &&
  /no se ha verificado de extremo a extremo/.test(privacidadLineal) &&
  /Tampoco están conectados los avisos de nuevas emisiones/.test(privacidadLineal));
prueba('la privacidad tampoco promete correos de cambio del radar',
  /entrega de correos por cambios del radar[\s\S]*todavía no está activa/.test(privacidadLineal));
prueba('privacidad y UI explican el consentimiento versionado, reversible y todavía inoperativo',
  /correo-v1-2026-08-22/.test(privacidadLineal) &&
  /desactivad[oa] por defecto/.test(privacidadLineal) &&
  /Puede retirarse en el mismo control en cualquier momento/.test(privacidadLineal) &&
  /consentimiento explícito/.test(privacidadLineal) &&
  /El consentimiento para correo está desactivado por defecto/.test(html) &&
  /faltan configurar Brevo y verificar la entrega de extremo a extremo/.test(html) &&
  /Está desactivado por defecto[\s\S]*faltan configurar Brevo y verificar la entrega de extremo a extremo/.test(js));
prueba('privacidad y UI pausan altas y recuperación hasta probar el correo completo',
  /mailer_autoconfirm=false/.test(privacidadLineal) &&
  /debe confirmar su dirección antes de poder iniciar sesión/.test(privacidadLineal) &&
  /no tiene configurado un SMTP propio/.test(privacidadLineal) &&
  /en pausa las nuevas altas y la recuperación/.test(privacidadLineal) &&
  /no recoge esas solicitudes mientras el correo no sea fiable/.test(privacidadLineal) &&
  /cuentas existentes pueden seguir entrando/.test(privacidadLineal) &&
  !/mailer_autoconfirm=true|publicación remota[\s\S]{0,80}permanece bloqueada/.test(privacidadLineal) &&
  /const CORREO_AUTH_E2E=false/.test(js) &&
  /solicitado==='registro'\?'registro_pausado'/.test(js) &&
  /solicitado==='recuperar'\?'recuperar_pausado'/.test(js) &&
  /no recogemos nuevas altas ni solicitudes de recuperación/.test(js) &&
  !/Te hemos enviado un correo|ya va en camino un enlace|esta versión no se publicará/.test(js));
prueba('la privacidad conserva pendientes los plazos de 12 meses y 3 años',
  /máximo de 12 meses[\s\S]*PENDIENTE/.test(privacidad) && /durante 3 años[\s\S]*PENDIENTE/.test(privacidad));

prueba('los redirects usan sintaxis portable de Cloudflare Pages',
  /^\/index\.html\s+\/\s+301$/m.test(redirecciones) &&
  /^\/privacidad\.html\s+\/privacidad\s+301$/m.test(redirecciones) && !/301!/.test(redirecciones));
prueba('security.txt tiene contacto, canonical, política de reporte y caducidad futura',
  /Contact: mailto:RWAdar@protonmail\.com/.test(lee('.well-known/security.txt')) &&
  /Canonical: https:\/\/rwadar\.pages\.dev\/\.well-known\/security\.txt/.test(lee('.well-known/security.txt')) &&
  /Policy: https:\/\/github\.com\/victorJorques\/RWADAR\/security\/policy/.test(lee('.well-known/security.txt')) &&
  !/Policy: https:\/\/rwadar\.pages\.dev\/privacidad/.test(lee('.well-known/security.txt')) &&
  /Expires: 2027-08-22T00:00:00\.000Z/.test(lee('.well-known/security.txt')));
prueba('sitemap y metadatos usan la revisión 2026-08-22',
  (lee('sitemap.xml').match(/<lastmod>2026-08-22<\/lastmod>/g)||[]).length===2 &&
  /"dateModified":"2026-08-22"/.test(html));
prueba('todo el SEO absoluto usa el origen canónico de Cloudflare',
  html.includes(`<link rel="canonical" href="${ORIGEN_PUBLICO}/">`) &&
  !/rwadar\.netlify\.app/.test(html) &&
  lee('robots.txt').includes(`${ORIGEN_PUBLICO}/sitemap.xml`) &&
  (lee('sitemap.xml').match(/https:\/\/rwadar\.pages\.dev/g) || []).length === 2 &&
  validarOrigenPublicable(sitio) === ORIGEN_PUBLICO);
prueba('el auditor compara lo publicado con el árbol adelgazado y rechaza analítica inyectada',
  /path\.join\(PUBLICADO, 'index\.html'\)/.test(arrancador) &&
  /netlify-rum-container/.test(arrancador) && /cloudflareinsights/.test(arrancador));
prueba('el auditor extrae el asset con huella desde el index generado',
  /scriptsPublicados = \[\.\.\.htmlPublicable\.matchAll/.test(arrancador) &&
  /recursoJSPublicado/.test(arrancador) && /\{12\}\\\.js/.test(arrancador));
prueba('el auditor reutiliza el contrato legal fail-closed del publicador',
  /comprobarEstadoLegalPublicacion/.test(arrancador) &&
  !/data-deploy-blocker=["']legal["']/.test(arrancador));
prueba('la documentación exige modo explícito y no recomienda promoción automática',
  /--local[\s\S]*--preview[\s\S]*--produccion/.test(documentos) &&
  !/sube como borrador y lo promueve|Promovido a produccion|Forbidden[^\n]*es normal/.test(documentos));

const sinModo = spawnSync(process.execPath, ['rwadar-publicar.js'], { cwd:raiz, encoding:'utf8' });
prueba('invocar el publicador sin modo falla sin desplegar', sinModo.status===2 && /modo es obligatorio/.test(sinModo.stderr));
prueba('el contrato legal acepta el pendiente transparente y rechaza todo blocker',
  comprobarEstadoLegalPublicacion(privacidad) === 'acuerdo-pendiente-de-documentar' &&
  /data-deploy-blocker/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main data-deploy-blocker="legal" data-deploy-legal-status="acuerdo-pendiente-de-documentar">'))))?.message || ''));
prueba('el contrato legal falla cerrado ante estado ausente, desconocido o contradictorio',
  /una sola vez/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main>'))))?.message || '') &&
  /ausente o no reconocido/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main data-deploy-legal-status="inventado">'))))?.message || '') &&
  /una sola vez/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main data-deploy-legal-status="acuerdo-documentado" data-deploy-legal-status="inventado">'))))?.message || '') &&
  /dentro de <main>/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<div data-deploy-legal-status="acuerdo-documentado"></div><main></main>'))))?.message || ''));

for (const origenMalo of [
  'http://rwadar.pages.dev',
  'https://rwadar.pages.dev.ejemplo.test',
  'https://usuario:clave@rwadar.pages.dev',
  'https://rwadar.pages.dev:444',
  'https://rwadar.pages.dev/ruta',
  'https://rwadar.pages.dev?x=1',
]) {
  prueba(`el origen público rechaza ${origenMalo}`,
    Boolean(await capturaError(Promise.resolve().then(() => comprobarOrigenPublico(origenMalo)))));
}

let llamadaAuth;
const authSeguro = await comprobarConfiguracionAuth({ fetchFn:async (url, opciones) => {
  llamadaAuth = { url, opciones };
  return { ok:true, status:200, async json(){ return { mailer_autoconfirm:false }; } };
} });
prueba('el preflight acepta únicamente autoconfirmación desactivada y petición sin caché',
  authSeguro.mailer_autoconfirm === false && /\/auth\/v1\/settings$/.test(llamadaAuth.url) &&
  llamadaAuth.opciones.method === 'GET' && llamadaAuth.opciones.cache === 'no-store' &&
  llamadaAuth.opciones.credentials === 'omit' && /^sb_publishable_/.test(llamadaAuth.opciones.headers.apikey));
const authActivo = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:true, status:200, async json(){ return { mailer_autoconfirm:true }; },
}) }));
const authAusente = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:true, status:200, async json(){ return {}; },
}) }));
const authHttp = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:false, status:503, async json(){ return {}; },
}) }));
prueba('el preflight Auth falla cerrado ante true, campo ausente o error HTTP',
  /exactamente false/.test(authActivo?.message || '') && /exactamente false/.test(authAusente?.message || '') &&
  /HTTP 503/.test(authHttp?.message || ''));

const intruso = path.join(sitio, `.env.auditoria-${process.pid}`);
try {
  fs.writeFileSync(intruso, 'SECRETO_SIMULADO=no-publicar\n', 'utf8');
  const rechazado = spawnSync(process.execPath, ['rwadar-publicar.js','--local','--sin-sincronizar'], { cwd:raiz, encoding:'utf8' });
  prueba('un archivo accidental hace fallar cerrado el paquete antes de copiarse',
    rechazado.status===2 && /archivo no permitido/.test(rechazado.stderr) &&
    !fs.existsSync(path.join(publicado, path.basename(intruso))));
} finally {
  fs.rmSync(intruso, { force:true });
}

console.log('\n=== PRUEBA HTTP LOCAL ===');
const puerto = 43173;
const proceso = spawn(process.execPath, ['rwadar-servir.js',`--puerto=${puerto}`], { cwd:raiz, stdio:['ignore','pipe','pipe'] });
try {
  const limite = Date.now()+5000;
  let inicio;
  while (Date.now()<limite) {
    try { inicio = await fetch(`http://127.0.0.1:${puerto}/`); break; }
    catch { await new Promise(r=>setTimeout(r,50)); }
  }
  prueba('el servidor local responde por loopback', inicio && inicio.status===200);
  const cspLocal = inicio.headers.get('content-security-policy') || '';
  prueba('la respuesta local aplica CSP estricta y permite el worker propio',
    !/unsafe-inline|unsafe-eval/.test(cspLocal) && /worker-src 'self'/.test(cspLocal));
  const politica = await fetch(`http://127.0.0.1:${puerto}/privacidad`);
  prueba('la URL limpia de privacidad funciona localmente', politica.status===200);
  const post = await fetch(`http://127.0.0.1:${puerto}/guardar?n=prueba.png`, {
    method:'POST',headers:{Origin:`http://127.0.0.1:${puerto}`,'Content-Type':'image/png'},body:new Uint8Array([1,2,3]),
  });
  prueba('POST /guardar está desactivado por defecto', post.status===403);
} finally {
  proceso.kill();
}

console.log(`\n${correctas} correctas, 0 fallidas`);

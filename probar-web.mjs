import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { request as solicitarHttp } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { pruebaActivacionCache, pruebaActivacionSinMigracion, pruebaRedConCacheRota, pruebaActualizacionPWACliente } from './probar-web-pwa.mjs';
import { probarEscritorio, probarTarjetaYComparador } from './rwadar-app/probar-web-escritorio.mjs';
import { probarTarjetaEnIngles, probarFocoAlCerrarFicha } from './rwadar-app/probar-web-tarjeta.mjs';
import { spawn, spawnSync } from 'node:child_process';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const sitio = path.join(raiz, 'rwadar-site');
const publicado = path.join(raiz, 'rwadar-publicado');
const lee = nombre => fs.readFileSync(path.join(sitio, nombre), 'utf8');
const require = createRequire(import.meta.url);
const { adelgazarJS, sinComentariosJS } = require('./rwadar-adelgazar.js');
const { leerBloquesCatalogo } = require('./rwadar-fichas.js');
// Cantidades del catálogo publicado, leídas de su propio manifiesto: desde el
// 02/11/2026 un lote coherente puede tener más o menos fichas que 49.
const CATALOGO_REAL = leerBloquesCatalogo(fs.readFileSync(path.join(raiz, 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8'));
const N_OFERTAS = CATALOGO_REAL.ofertas.length, N_PLATAFORMAS = CATALOGO_REAL.plataformas.length;
// Descartadas: también salen del catálogo (04/11/2026, ARTEX pasa a Descartadas y son 5).
const N_DESCARTADAS = CATALOGO_REAL.fuera.length;
const COL_REAL = { ...CATALOGO_REAL.ofertas[0].colecciones_esperadas };
const {
  ARCHIVOS_PUBLICABLES,
  ORIGEN_LEGADO,
  ORIGEN_PUBLICO,
  PROYECTO_CLOUDFLARE,
  comprobarConfiguracionAuth,
  comprobarEstadoLegalPublicacion,
  comprobarPreparacionRelanzamiento,
  comprobarOrigenPublico,
  evaluarPreparacionRelanzamiento,
  huellaContenido,
  huellaAlcancePublicacion,
  listarArchivosRegulares,
  nombreAssetVersionado,
  validarOrigenPublicable,
  versionCacheDesdeEntradas,
} = require('./rwadar-publicacion-segura.js');
const { celdaCSV, ofertaPublica } = require('./rwadar-app/sincronizar.js');
const { cargarActivosEditoriales } = require('./rwadar-ofertas-editoriales.js');
const activosEditoriales = cargarActivosEditoriales(raiz);
const codigoFichaEditorial = fs.readFileSync(path.join(raiz, 'rwadar-movil', 'lib', 'ficha-editorial.js'), 'utf8');
const html = lee('index.html');
const privacidad = lee('privacidad.html');
const transparenciaComercial = lee('transparencia-comercial.html');
const paraEmpresas = lee('para-empresas.html');
const error404 = lee('404.html');
const headers = lee('_headers');
const redirecciones = lee('_redirects');
const sw = lee('sw.js');
const publicador = fs.readFileSync(path.join(raiz, 'rwadar-publicar.js'), 'utf8');
const estadoRelanzamiento = JSON.parse(fs.readFileSync(
  path.join(raiz, 'rwadar-app', 'data', 'relanzamiento', 'estado.json'), 'utf8'));
const capturadorPortadas = fs.readFileSync(path.join(raiz, 'rwadar-capturar-portadas.mjs'), 'utf8');
const sincronizador = fs.readFileSync(path.join(raiz, 'rwadar-app', 'sincronizar.js'), 'utf8');
const servidor = fs.readFileSync(path.join(raiz, 'rwadar-servir.js'), 'utf8');
const servidorAcceso = fs.readFileSync(path.join(raiz, 'rwadar-acceso', 'servidor.mjs'), 'utf8');
const arrancador = fs.readFileSync(path.join(raiz, 'rwadar-arrancar.js'), 'utf8');
const documentos = ['AGENTS.md','CLAUDE.md','docs/INTERNO.md','docs/RUNBOOK.md']
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

function arnesServiciosEditoriales(codigo, direccion) {
  const capacidad = codigo.match(/\/\* servicios-usuario:inicio \*\/[\s\S]*?\/\* servicios-usuario:fin \*\//)?.[0];
  if (!capacidad) throw new Error('Falta la capacidad explícita de servicios de usuario');
  const modulo = marca => {
    const inicio = codigo.indexOf(marca), fin = codigo.indexOf('\n})();', inicio);
    if (inicio < 0 || fin < 0) throw new Error(`No se encuentra ${marca}`);
    return codigo.slice(inicio, fin + '\n})();'.length);
  };
  const funcion = (inicio, fin) => {
    const posicion = codigo.indexOf(inicio);
    if (posicion < 0 || codigo.indexOf(fin, posicion) < 0) throw new Error(`No se encuentra ${inicio}`);
    return codigo.slice(posicion, codigo.indexOf(fin, posicion));
  };
  const nodos = new Map(), avisos = [], peticiones = [], historial = [], escuchas = [];
  const nodo = id => {
    if (!nodos.has(id)) nodos.set(id, {
      ...nodoCuentaPrueba(id, {}), innerHTML:'',
      addEventListener(tipo){ escuchas.push([id, tipo]); },
    });
    return nodos.get(id);
  };
  const url = new URL(direccion);
  const contexto = {
    API:'https://datos.invalid/rest/v1', CLAVE_PUB:'publicable-prueba',
    MODO_LOCAL_SEGURO:['localhost','127.0.0.1'].includes(url.hostname),
    URL, URLSearchParams, location:url,
    history:{replaceState(_estado, _titulo, ruta){historial.push(ruta);}},
    document:{getElementById:nodo, addEventListener(tipo){escuchas.push(['document',tipo]);}},
    avisar:mensaje=>avisos.push(mensaje),
    fetch:async(...args)=>{peticiones.push(args);throw new Error('Ninguna petición permitida en esta prueba');},
    localStorage:{getItem(){throw new Error('No debe leer sesiones anteriores');},
      setItem(){throw new Error('No debe guardar sesiones');},removeItem(){throw new Error('No debe borrar datos anteriores');}},
  };
  vm.createContext(contexto);
  vm.runInContext(`${capacidad}\n${modulo('const Opiniones=')}\n${modulo('const Cuenta =')}
    globalThis.apiEditorial={Cuenta,Opiniones,disponible:SERVICIOS_USUARIO_DISPONIBLES};
    globalThis.redEditorial=(function(){
      let ses={access_token:'sesion-anterior',refresh_token:'renovacion-anterior',expira:Date.now()+3600000};
      ${funcion('async function auth(', 'function traduce(')}
      ${funcion('async function testigo(){', 'async function confirmarIdentidad(){')}
      ${funcion('async function rest(', 'async function cargarMio(')}
      ${funcion('async function pide(', 'const idDe=')}
      return {auth,rest,pide,testigo};
    })();`, contexto);
  return {contexto, nodos, avisos, peticiones, historial, escuchas,
    ...contexto.apiEditorial, red:contexto.redEditorial};
}

function solicitarConHost(puerto, host) {
  return new Promise((resolve, reject) => {
    const peticion = solicitarHttp({
      hostname: '127.0.0.1',
      port: puerto,
      path: '/',
      method: 'GET',
      headers: { Host: host },
    }, respuesta => {
      const trozos = [];
      respuesta.on('data', trozo => trozos.push(trozo));
      respuesta.on('end', () => resolve({
        status: respuesta.statusCode,
        cuerpo: Buffer.concat(trozos).toString('utf8'),
      }));
    });
    peticion.on('error', reject);
    peticion.end();
  });
}

async function authRechazaJson2xxInvalido(codigo) {
  const inicio = codigo.indexOf('async function peticionCuenta(');
  const fin = codigo.indexOf('function traduce(', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const fabrica = new Function('fetch', 'CLAVE_PUB', `
    // Regresión del transporte Auth anterior, elegido explícitamente.
    const servidor=false;
    const AUTH='https://auth.invalid';
    const SERVICIOS_USUARIO_DISPONIBLES=true;
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

async function authUsaPasarelaSinCredenciales(codigo) {
  const inicio = codigo.indexOf('async function auth(');
  const fin = codigo.indexOf('function traduce(', inicio);
  const adaptador = codigo.slice(codigo.indexOf('const usuarioServidor='), codigo.indexOf(" const AUTH=", codigo.indexOf('const usuarioServidor=')));
  if (inicio < 0 || fin < 0 || !adaptador.startsWith('const usuarioServidor=')) return false;
  const llamadas = [];
  let peticionesDirectas = 0;
  const usuario = {id:'cuenta-prueba',correo:'persona@example.test',correoConfirmadoEl:'2026-10-23T10:00:00Z'};
  const pasarela = {
    async verificar(){llamadas.push(['verificar']);return usuario;},
    async reautenticar(clave){llamadas.push(['reautenticar',clave]);return usuario;},
    async salir(){llamadas.push(['salir']);},
  };
  const crear = new Function('servidor', 'fetch', `
    const SERVICIOS_USUARIO_DISPONIBLES=true;
    ${adaptador}
    ${codigo.slice(inicio, fin)}
    return auth;
  `);
  const auth = crear(pasarela, async()=>{peticionesDirectas++;throw new Error('No se permite Auth directo');});
  const identidad = await auth('/user', null, {metodo:'GET'});
  const entrada = await auth('/token?grant_type=password', {email:'ignorado@example.test',password:'solo-prueba-local'});
  await auth('/logout');
  const cerrada = await capturaError(auth('/signup', {email:'persona@example.test'}));
  const errorServidor = Object.assign(new Error('Sesión no disponible'), {status:401});
  pasarela.verificar = async()=>{throw errorServidor;};
  const fallo = await capturaError(auth('/user', null, {metodo:'GET'}));
  return identidad.id === usuario.id && identidad.email === usuario.correo &&
    identidad.email_confirmed_at === usuario.correoConfirmadoEl && entrada.user.id === usuario.id &&
    entrada.access_token === 'sesion-http-only' && llamadas.length === 3 &&
    llamadas[1][1] === 'solo-prueba-local' && peticionesDirectas === 0 &&
    /página de tu cuenta/.test(cerrada?.message || '') && fallo === errorServidor && fallo.status === 401;
}

async function transporteAuthConservaEstadoYTimeout(codigo) {
  const inicio=codigo.indexOf('async function peticionCuenta('),fin=codigo.indexOf('function traduce(',inicio);
  const crear=new Function('fetch','setTimeout','clearTimeout',`
    const servidor=false,AUTH='https://auth.invalid',CLAVE_PUB='publicable-prueba',SERVICIOS_USUARIO_DISPONIBLES=true;
    const traduce=t=>t;
    ${codigo.slice(inicio,fin)}
    return {auth,peticionCuenta};
  `);
  const estados=[];
  for(const status of [401,503]){
    const api=crear(async()=>({ok:false,status,text:async()=>JSON.stringify({message:'Error controlado',code:'prueba_http'})}),setTimeout,clearTimeout);
    const error=await capturaError(api.auth('/user',null,{metodo:'GET'}));
    estados.push(error?.status===status&&error.code==='prueba_http');
  }
  let abortada=false,limpiado=false;
  const api=crear(async(_url,opciones)=>{opciones.signal.addEventListener('abort',()=>{abortada=true;});return new Promise(()=>{});},
    fn=>{queueMicrotask(fn);return 1;},()=>{limpiado=true;});
  const error=await capturaError(api.peticionCuenta('https://auth.invalid/user',{}));
  return estados.every(Boolean)&&abortada&&limpiado&&/tardado demasiado/.test(error?.message||'');
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
      const servidor=false; // Estado pendiente del formulario conservado, sin BFF.
      const SERVICIOS_USUARIO_DISPONIBLES=true;
      const OPINIONES_DISPONIBLES=false,MANUAL_BIENVENIDA='';
      let modo='entrar',correoPendiente='persona@example.test',operacionCuenta=0,
          temporizadorReenvio=null,focoCuenta=null;
      const quitaAntiRobots=()=>{};
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
      const servidor=false; // Registro heredado aislado; ninguna llamada de red real.
      const SERVICIOS_USUARIO_DISPONIBLES=true;
      let modo='registro',operacionCuenta=0,correoPendiente='';
      const conAntiRobots=async cuerpo=>cuerpo,quitaAntiRobots=()=>{};
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
    pruebaAlta.mensajes.some(m=>/no podemos confirmar que se haya creado/i.test(m)) && pruebaAlta.limpiezas() === 1;
}

async function operacionCuentaObsoletaNoMutaVista(codigo) {
  const pruebaAlta = arnesEnvioRegistro(codigo);
  pruebaAlta.api.invalidar();
  pruebaAlta.resolver({ id:'usuario-válido', email:'persona@example.test' });
  await pruebaAlta.ejecucion;
  return pruebaAlta.aperturas.length === 0 && pruebaAlta.entradas() === 0 &&
    pruebaAlta.mensajes.length === 0 && pruebaAlta.limpiezas() === 0 &&
    pruebaAlta.nodos.get('cuentaEnviar')?.disabled === true;
}

async function confirmarIdentidadLimpiaSesionAnteFallos(codigo) {
  const inicio = codigo.indexOf('async function confirmarIdentidad(){');
  const fin = codigo.indexOf('async function rest(', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const ejecutar = async auth => {
    const fabrica = new Function('testigo', 'auth', `
      let ses={access_token:'testigo'},versionSesion=1,versionCuenta=1,identidadConfirmada=true,pintadas=0;
      const guarda=s=>{ses=s;versionSesion++;};
      const vigente=inicio=>inicio===versionCuenta&&!!ses;
      const correoValido=valor=>/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(valor);
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

// Ejecuta el trabajador que retira el modo offline, sin red ni almacenamiento real.
async function probarRetiradaOffline(codigo) {
  const escuchas = {}, borradas = [], navegadas = [];
  let saltos = 0, reclamos = 0, consultas = 0, abiertas = 0;
  const contexto = {
    self: {
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){ saltos++; },
      clients: {
        async claim(){ reclamos++; },
        async matchAll(opciones){
          if(opciones.type !== 'window' || opciones.includeUncontrolled !== true) throw new Error('clientes incompletos');
          consultas++;
          return [
            {url:'https://rwadar.example/', async navigate(url){ navegadas.push(url); }},
            {url:'https://rwadar.example/radar', async navigate(url){ navegadas.push(url); throw new Error('ventana cerrada'); }},
          ];
        },
      },
    },
    caches: {
      async keys(){ return ['rwadar-v-antigua', 'rwadar-v-anterior', 'otra-aplicacion']; },
      async delete(nombre){ borradas.push(nombre); return true; },
      async open(){ abiertas++; throw new Error('No se permite abrir caché'); },
    },
    fetch(){ throw new Error('El worker no debe interceptar ni pedir datos'); },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let instalacion, activacion;
  escuchas.install({waitUntil(p){instalacion=p;}});
  await instalacion;
  escuchas.activate({waitUntil(p){activacion=p;}});
  await activacion;
  return saltos === 1 && reclamos === 1 && consultas === 0 && abiertas === 0 &&
    JSON.stringify(borradas.sort()) === JSON.stringify(['rwadar-v-antigua','rwadar-v-anterior'].sort()) &&
    navegadas.length === 0 && !Object.hasOwn(escuchas,'fetch');
}

function tutorialManualRespetaPasos(codigo) {
  const inicio=codigo.indexOf('const ROTULOS='),fin=codigo.indexOf("document.getElementById('exVolverAcademy')",inicio);
  if(inicio<0||fin<inicio)return false;
  const bloque=codigo.slice(inicio,fin);
  if(/setInterval\s*\(/.test(bloque))return false;
  for(const reducir of [false,true]){
    const nodos=new Map(),sonidos=[],cancelados=[],posiciones=[];
    const nodo=id=>{
      if(!nodos.has(id))nodos.set(id,{disabled:false,hidden:true,textContent:'',eventos:{},
        classList:{remove(){},toggle(){}},setAttribute(){},
        addEventListener(tipo,fn){this.eventos[tipo]=fn;}});
      return nodos.get(id);
    };
    const contexto={document:{getElementById:nodo,querySelectorAll:()=>[0,1,2,3].map(n=>nodo('paso-'+n))},
      window:{matchMedia:()=>({matches:reducir})},escenaVisible:true,
      colocar:i=>posiciones.push(i),Sonido:{paso:i=>sonidos.push(i)},
      clearInterval:id=>cancelados.push(id),setInterval(){throw new Error('El tutorial debe ser manual');}};
    vm.createContext(contexto);
    vm.runInContext(bloque+`;globalThis.guia={irPaso,reiniciar:reiniciarPasosAutomaticos,
      paso:()=>paso,reloj:v=>{reloj=v;}};`,contexto);
    const guia=contexto.guia,anterior=nodo('exAnterior'),siguiente=nodo('exSiguiente');
    const estado=(i,final)=>guia.paso()===i&&anterior.disabled===(i===0)&&siguiente.disabled===(i===3)&&
      nodo('exProgreso').textContent===`Paso ${i+1} de 4`&&nodo('exFinal').hidden===!final;
    if(!estado(0,false)||sonidos.length!==0)return false;
    for(const valor of [-1,4,0.5,null,'1',NaN])guia.irPaso(valor,true);
    if(!estado(0,false)||posiciones.length!==1||sonidos.length!==0)return false;
    for(let i=1;i<=3;i++){siguiente.eventos.click();if(!estado(i,i===3))return false;}
    if(sonidos.length!==3)return false;
    siguiente.eventos.click();if(!estado(3,true)||sonidos.length!==3)return false;
    anterior.eventos.click();if(!estado(2,false)||sonidos.length!==4)return false;
    guia.reloj(42);guia.reiniciar();
    if(!estado(0,false)||cancelados.length!==1||cancelados[0]!==42||sonidos.length!==4)return false;
    contexto.escenaVisible=false;siguiente.eventos.click();
    if(!estado(1,false)||sonidos.length!==4)return false;
  }
  return true;
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
  return leerBloquesCatalogo(codigo)[{P:'plataformas',EMI:'ofertas',FUERA:'fuera'}[nombre]];
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

function renderEmisionHostil(codigo, cambios = {}) {
  const dato = [{
    s:'prueba', t:'<img src=x onerror=alert(1)>', res:'</script><script>alert(2)</script>',
    pl:'Midas', cat:'Tesoro y fondos', mon:'EUR', min:100, obj:1000, cap:500,
    pct:50, rent:3.2, plazo:12, tipo:'estimada', est:'abierta', cont:false,
    url:'https://example.com/emision', ver:'2026-08-20', pat:false, ...cambios,
  }];
  const capturado = {};
  const lista = [];
  lista.forEach = Array.prototype.forEach.bind(lista);
  const nodos = new Map();
  const nodo = id => {
    if (nodos.has(id)) return nodos.get(id);
    let contenidoTexto = '';
    const n = { id, value:'', hidden:false, style:{}, dataset:{},
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
  vm.runInContext(jsCatalogo, contexto);
  vm.runInContext(codigoFichaEditorial, contexto);
  vm.runInContext(codigo, contexto, { timeout:15000 });
  // Inyectar después del arranque: el snapshot público ya no es una lista vacía.
  // Ejecutamos el render real sin alterar la fuente ni depender de su contenido.
  vm.runInContext(`EMI.splice(0,EMI.length,...${JSON.stringify(dato)});pintarEmisiones();`, contexto);
  return capturado.emiLista || '';
}

function reparentadoEmisionesEsReversible(codigo) {
  const limpio = sinComentariosJS(codigo);
  return /function ordenarBuscar\(esMovil\)/.test(limpio) &&
    /const ordenMovil=\[emisiones,herramienta,barra,radarIntro,radarPortada,marcador,resultados,transparencia,academia,portadaTexto,portada\]/.test(limpio) &&
    /ordenMovil\.forEach\(nodo=>panelBuscar\.insertBefore\(nodo,referencia\)\)/.test(limpio) &&
    /function restaurarEscritorio\(\)/.test(limpio) &&
    /ancla\.parentNode\.insertBefore\(nodo,ancla\.nextSibling\)/.test(limpio) &&
    /academyLeccion\.appendChild\(explicador\)/.test(limpio);
}

// Barra de 5 (decisión de Víctor, 04/11/2026; ESPEC-INICIO §4): Ofertas y
// Plataformas son dos vistas de Buscar y nunca salen marcadas a la vez.
function cambioTabsMovilEsCoherente(codigo) {
  const inicio = codigo.indexOf('function cambiar(id,opciones){');
  const fin = codigo.indexOf('function adaptar(){', inicio);
  if (inicio < 0 || fin < 0) return false;
  const fuente = codigo.slice(inicio, fin);
  const nombres = ['inicio','buscar','academy','cuenta'],pasos=[['inicio'],['buscar','ofertas'],['buscar','plataformas'],['academy'],['cuenta']];
  const paneles = new Map(nombres.map(nombre => [nombre, { hidden:nombre !== 'buscar' }]));
  const tabs = pasos.map(([nombre,vista]) => ({
    dataset:vista?{ movilTab:nombre, navVista:vista }:{ movilTab:nombre }, tabIndex:-1, atributos:new Map(),
    setAttribute(clave, valor){ this.atributos.set(clave, String(valor)); },
    getAttribute(clave){ return this.atributos.get(clave) ?? null; },
  }));
  const document = { body:{ dataset:{} } };
  let cabeceraActual = '', mediciones = 0;
  let perfiles = 0, academias = 0;
  const fabrica = new Function('media', 'paneles', 'tabs', 'document', 'window', 'reduce',
    'cabecera', 'geometria', 'pintarPerfil', 'pintarAcademy', `
      let activa='buscar',academyAbierta=false,academyHistorial=false;
      let detalleAbierto=null,detalleHistorial=false,movilFiltrosAbiertos=false;
      ${fuente}
      return {cambiar, activa:()=>activa};
    `);
  const api = fabrica({matches:true}, paneles, tabs, document, {scrollTo(){}}, ()=>true,
    id=>{ cabeceraActual=id; }, ()=>{ mediciones++; },
    ()=>{ perfiles++; }, ()=>{ academias++; });
  for (const [nombre,vista] of pasos) {
    if (vista) document.body.dataset.movilBuscar = vista;
    api.cambiar(nombre, { arriba:false });
    const marcadas = tabs.filter(t => t.getAttribute('aria-selected') === 'true');
    if (api.activa() !== nombre || document.body.dataset.movilPestana !== nombre || cabeceraActual !== nombre ||
      nombres.some(otro => paneles.get(otro).hidden === (otro === nombre)) || marcadas.length !== 1 ||
      marcadas[0] !== tabs[pasos.findIndex(x => x[0] === nombre && x[1] === vista)] ||
      tabs.some(t => t.tabIndex !== (t === marcadas[0] ? 0 : -1))) return false;
  }
  api.cambiar('sistema-operativo-inventado', { arriba:false });
  return api.activa() === 'cuenta' && document.body.dataset.movilPestana === 'cuenta' &&
    mediciones === 2 && perfiles === 1 && academias === 1;
}

console.log('=== PRUEBAS ESTÁTICAS DE LA WEB ===');
marcadoEstricto('index.html', html);
marcadoEstricto('privacidad.html', privacidad);
marcadoEstricto('transparencia-comercial.html', transparenciaComercial);
marcadoEstricto('para-empresas.html', paraEmpresas);
marcadoEstricto('404.html', error404);

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(m => m[1]);
const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
prueba('index.html no tiene ID duplicados', repetidos.length === 0);

const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const estilos = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)];
const rutaScriptApp = '/assets/rwadar-20260820.js';
const rutaAnalitica = '/assets/analitica-20260927.js';
const rutaCatalogo = '/assets/catalogo-publico-20261022.js';
// El orden de los scripts (con idioma-previo en <head>) se prueba en rwadar-app/probar-web-escritorio.mjs.
// La quinta, el candado de las lecciones sin cuenta (08/11/2026), compartida con /academy/.
// La sexta, «Noticias del sector» (10/11/2026); la séptima, «Mercado y noticias» al estilo de una app de bolsa (11/11/2026);
// la novena, «Calcula tus números» (11/11/2026); la décima, «Novedades de RWAdar» (12/11/2026).
prueba('las diez hojas propias versionadas cargan en el orden declarado',
  JSON.stringify(estilos.map(estilo=>estilo[1])) === JSON.stringify([
    '/assets/rwadar-20260820.css','/assets/cartera-cuenta-ui-20261028.css','/assets/idioma-20261022.css','/assets/mapa-buscar-20261027.css',
    '/assets/academy-candado-20261108.css','/assets/noticias-sector-20261110.css','/assets/mercado-20261111.css',
    '/assets/secciones-20261110.css','/assets/calculadora-20261111.css','/assets/novedades-producto-20261112.css']));
for (const recurso of [rutaScriptApp, rutaCatalogo, rutaAnalitica, estilos[0][1], '/assets/privacidad-20260820.css', '/assets/error-20260820.css'])
  prueba(`existe ${recurso}`, fs.existsSync(path.join(sitio, '.' + recurso)));

const js = lee('.' + rutaScriptApp);
const jsCatalogo = lee('.' + rutaCatalogo);
// El candidato abre las cuentas tras comprobar los correos reales de alta y
// recuperación. También se prueba el cierre completo sobre el mismo código,
// sin recoger ni enviar datos de cuentas en este ensayo aislado.
const jsCerrado = js.replace('const SERVICIOS_USUARIO_REMOTOS=true;', 'const SERVICIOS_USUARIO_REMOTOS=false;')
  .replace(' const CORREO_AUTH_E2E=true;', ' const CORREO_AUTH_E2E=false;');
const css = lee('.' + estilos[0][1]);
new Function(js);
prueba('el JavaScript externo compila', true);
prueba(`el pre-render contiene las ${N_PLATAFORMAS} fichas`, (html.match(/class="abrir"/g) || []).length === N_PLATAFORMAS);
prueba(`el pre-render contiene los ${N_DESCARTADAS} descartes`, (html.match(/class="fila"/g) || []).length === N_DESCARTADAS);
probarEscritorio({ js, html, lee, prueba, ARCHIVOS_PUBLICABLES, privacidad, transparenciaComercial, paraEmpresas });
prueba('todos los formularios fallan cerrados bajo form-action none',
  [...html.matchAll(/<form\b([^>]*)>/gi)].every(m => !/\baction\s*=/i.test(m[1])));

const jsonLd = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
prueba('hay exactamente un JSON-LD', jsonLd.length === 1);
const datosLd = JSON.parse(jsonLd[0][1]);
prueba('el JSON-LD es JSON válido', true);
prueba('la página y el conjunto de datos comparten la revisión actual',
  datosLd['@graph'].filter(x=>x.dateModified).every(x=>x.dateModified===
    [...arrayDe(jsCatalogo,'P').map(p=>p.verificacionLocal?.verificadoEl || p.ver),
     ...arrayDe(jsCatalogo,'EMI').map(o=>o.verificadaEl || o.ver)].filter(Boolean).sort().at(-1)));
const descripcion = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '';
prueba('la meta description es precisa y tiene longitud útil para buscadores',
  descripcion.length >= 120 && descripcion.length <= 190 &&
  /activos tokenizados/.test(descripcion) && /fuentes, fechas y advertencias/.test(descripcion) &&
  !/superan|pasan el filtro|garantizada|abiertas/.test(descripcion));
prueba('la presentación no convierte presencia editorial en acceso minorista o autorización universal',
  !/pasan el filtro|superan el filtro|aceptan dinero hoy|Abiertas a minoristas|solo entran plataformas con supervisor/.test(html) &&
  html.includes('no es exhaustivo ni un sello de aprobación') && html.includes('Categorías de activos'));
prueba('las cifras de cabecera cuentan categorías, no supuestas ofertas abiertas a minoristas',
  [...js.matchAll(/document\.getElementById\('s3'\)\.textContent=([^;\n]+)/g)].length>0&&
  [...js.matchAll(/document\.getElementById\('s3'\)\.textContent=([^;\n]+)/g)].every(x=>x[1]==='new Set(P.map(p=>p.cat)).size'));
prueba('la inversión se paga al proveedor y no a RWAdar',
  /La inversión y el pago se realizan directamente con la\s+empresa/.test(html) &&
  html.includes('no recibimos ni custodiamos el dinero de tu inversión'));
const ultimaVerificacion = arrayDe(jsCatalogo, 'P').map(p=>p.verificacionLocal?.verificadoEl || p.ver).filter(Boolean).sort().at(-1);
// Fechas en dd/mm/aaaa en toda la web (revisión de lectura, 04/11/2026).
const fechaPie = ultimaVerificacion.split('-').reverse().join('/');
prueba('el HTML sin JavaScript contiene la revisión real derivada de los datos',
  html.includes(`<p id="pieRevision">Última revisión del catálogo: ${fechaPie}</p>`));

console.log('\n=== CSP, SESIÓN Y CONTRATOS ===');
prueba('la CSP no permite unsafe-inline ni eval', !/unsafe-inline|unsafe-eval/i.test(headers));
prueba('la CSP permite solo el beacon adicional y conserva estilo, worker y manifest propios',
  /script-src 'self' https:\/\/static\.cloudflareinsights\.com;/i.test(headers) && /style-src\s+'self'/i.test(headers) &&
  /worker-src\s+'self'/i.test(headers) && /manifest-src\s+'self'/i.test(headers));
prueba('la CSP limita las conexiones a Supabase y al colector de métricas declarado',
  /connect-src 'self' https:\/\/exgpmjpaaebyoolpwced\.supabase\.co https:\/\/cloudflareinsights\.com;/.test(headers));
prueba('la CSP impide formularios, marcos y objetos',
  /form-action\s+'none'/i.test(headers) && /frame-ancestors\s+'none'/i.test(headers) && /object-src\s+'none'/i.test(headers));
prueba('los assets versionados tienen caché immutable', /\/assets\/\*[\s\S]*max-age=31536000, immutable/i.test(headers));
prueba('el service worker se entrega siempre revalidado', /\/sw\.js[\s\S]*no-cache, no-store/i.test(headers));
prueba('portada y manifest se revalidan para descubrir cada nueva entrega',
  /^\/\r?\n\s+Cache-Control:\s*public, max-age=0, must-revalidate/im.test(headers) &&
  /\/manifest\.webmanifest[\s\S]*?Cache-Control:\s*public, max-age=86400, must-revalidate/i.test(headers));

console.log('\n=== ANALÍTICA Y FRONTERAS DE PRIVACIDAD ===');
const codigoAnalitica = lee('.' + rutaAnalitica);
function simularAnalitica(href, opciones = {}) {
  const creados = [];
  const contexto = {
    URL,
    location: { href },
    navigator: { onLine: true, ...opciones.navigator },
    document: {
      referrer: opciones.referrer || '',
      get cookie() { throw new Error('La analítica no debe acceder a cookies'); },
      querySelector: () => opciones.yaExiste || creados.find(s => s.atributos['data-cf-beacon']),
      createElement: () => ({ atributos: {}, setAttribute(n, v) { this.atributos[n] = v; } }),
      head: { appendChild: script => creados.push(script) },
    },
    get localStorage() { throw new Error('La analítica no debe acceder a localStorage'); },
    get sessionStorage() { throw new Error('La analítica no debe acceder a sessionStorage'); },
  };
  vm.createContext(contexto);
  for (let i = 0; i < (opciones.veces || 1); i++) vm.runInContext(codigoAnalitica, contexto);
  return creados;
}
const medicion = simularAnalitica('https://rwadar.pages.dev/', { veces: 2 });
prueba('la página pública carga una sola medición sin tocar cookies ni almacenamiento',
  medicion.length === 1 && medicion[0].src === 'https://static.cloudflareinsights.com/beacon.min.js' &&
  medicion[0].type === 'module' && medicion[0].referrerPolicy === 'no-referrer');
const configuracionMedicion = JSON.parse(medicion[0].atributos['data-cf-beacon']);
prueba('la configuración del proveedor desactiva navegación SPA y no añade identidad de usuario',
  configuracionMedicion.spa === false && /^[a-f0-9]{32}$/.test(configuracionMedicion.token) &&
  Object.keys(configuracionMedicion).sort().join(',') === 'spa,token');
for (const url of [
  'http://localhost:4173/', 'http://127.0.0.1:4173/', 'file:///index.html',
  'https://preview.rwadar.pages.dev/', 'https://rwadar.netlify.app/',
  'https://rwadar.pages.dev.ejemplo.com/', 'http://rwadar.pages.dev/',
  'https://rwadar.pages.dev:8443/', 'https://rwadar.pages.dev/cuenta',
  'https://rwadar.pages.dev/?code=prueba', 'https://rwadar.pages.dev/#access_token=prueba',
  'https://rwadar.pages.dev/?utm_source=prueba', 'https://rwadar.pages.dev/privacidad#aviso-legal',
]) prueba(`la analítica no se carga en ${url}`, simularAnalitica(url).length === 0);
prueba('la analítica respeta Do Not Track, Global Privacy Control y ausencia de conexión',
  [{ doNotTrack: '1' }, { globalPrivacyControl: true }, { onLine: false }]
    .every(navigator => simularAnalitica('https://rwadar.pages.dev/', { navigator }).length === 0));
prueba('un referente con parámetros o fragmentos tampoco se comunica al proveedor',
  ['https://rwadar.pages.dev/?email=prueba', 'https://ejemplo.com/#token=prueba', 'url inválida']
    .every(referrer => simularAnalitica('https://rwadar.pages.dev/', { referrer }).length === 0));
prueba('la Academy se mide solo con sus URL limpias, sin parámetros ni rutas raras',
  ['/academy/', '/academy/que-significa-tokenizar-un-activo'].every(ruta =>
    simularAnalitica('https://rwadar.pages.dev' + ruta).length === 1) &&
  ['/academy', '/academy/Mayusculas', '/academy/a/b', '/academy/leccion.html',
    '/academy/?q=1', '/academy/leccion#seccion', '/academy/-leccion'].every(ruta =>
    simularAnalitica('https://rwadar.pages.dev' + ruta).length === 0));
prueba('las páginas públicas auxiliares incluyen medición y un beacon existente no se duplica',
  [privacidad, transparenciaComercial, paraEmpresas].every(pagina => pagina.includes(rutaAnalitica)) &&
  ['/privacidad', '/transparencia-comercial', '/para-empresas'].every(ruta =>
    simularAnalitica('https://rwadar.pages.dev' + ruta).length === 1) &&
  simularAnalitica('https://rwadar.pages.dev/', { yaExiste: true }).length === 0);

console.log('\n=== SERVICIOS DE USUARIO CERRADOS EN LA VERSIÓN EDITORIAL ===');
for (const direccion of [
  'https://rwadar.pages.dev/', 'https://rwadar.netlify.app/',
  'https://preview.example/?cuentas=true&SERVICIOS_USUARIO_REMOTOS=true',
  'http://127.0.0.1:4173/',
]) {
  const editorial = arnesServiciosEditoriales(jsCerrado, direccion);
  for (const modo of ['entrar','registro','recuperar','nueva_clave']) editorial.Cuenta.abrir(modo);
  editorial.Cuenta.abrirGestion();
  editorial.Cuenta.pintarVigilar('Plataforma de prueba');
  editorial.Cuenta.actualizarMovil();
  const opiniones = {innerHTML:'contenido anterior'};
  await editorial.Opiniones.pinta('Plataforma de prueba', opiniones);
  prueba(`la versión editorial no abre cuentas ni pide datos de usuario en ${new URL(direccion).hostname}`,
    editorial.disponible === false && editorial.Cuenta.hay() === false &&
    editorial.Cuenta.uid() === false && await editorial.Cuenta.token() === null &&
    editorial.peticiones.length === 0 && editorial.escuchas.length === 0 &&
    opiniones.innerHTML === '' && editorial.nodos.get('btnCuenta').disabled === true &&
    editorial.nodos.get('movilCuentaAccion').disabled === true &&
    /seguimiento está en pausa/.test(editorial.nodos.get('dwVigilar').innerHTML));
}
const redEditorial = arnesServiciosEditoriales(jsCerrado, 'https://rwadar.pages.dev/');
for (const [nombre, argumentos] of [
  ['auth',['/token?grant_type=password',{email:'prueba@example.test',password:'solo-prueba'}]],
  ['rest',['/vigilancia',{method:'POST',body:'{}'}]],
  ['pide',['/opiniones_publicas?select=*']],
]) prueba(`la entrada de red ${nombre} rechaza el uso directo con la capacidad cerrada`,
  /desactivad/.test((await capturaError(redEditorial.red[nombre](...argumentos)))?.message || '') &&
  redEditorial.peticiones.length === 0);
prueba('ni siquiera una sesión previa en memoria entrega o renueva su token',
  await redEditorial.red.testigo() === null && redEditorial.peticiones.length === 0);
for (const [direccion, salida] of [
  ['https://rwadar.pages.dev/?sector=inmobiliario#access_token=prueba&refresh_token=prueba&type=recovery', '/?sector=inmobiliario'],
  ['https://rwadar.pages.dev/?code=prueba&type=signup&sector=oro#metodo', '/?sector=oro#metodo'],
  ['https://rwadar.pages.dev/#error=access_denied&error_description=prueba', '/'],
]) {
  const editorial = arnesServiciosEditoriales(jsCerrado, direccion);
  prueba('un retorno antiguo se limpia sin iniciar sesión ni guardar o transmitir sus credenciales',
    editorial.historial.length === 1 && editorial.historial[0] === salida &&
    editorial.peticiones.length === 0 && editorial.Cuenta.hay() === false &&
    await editorial.Cuenta.token() === null);
}
prueba('la pausa no elimina anclas o filtros editoriales normales',
  arnesServiciosEditoriales(jsCerrado, 'https://rwadar.pages.dev/?sector=oro#metodo').historial.length === 0);
prueba('los accesos a cuenta nacen desactivados incluso antes de ejecutar JavaScript',
  /id="btnCuenta"[^>]*\bdisabled/.test(html) &&
  [...html.matchAll(/<button\b([^>]*data-movil-action="cuenta"[^>]*)>/g)]
    .every(m => /\bdisabled/.test(m[1])) && /href="\/privacidad#derechos"/.test(html));
const inicioLectorPublico = js.indexOf('async function alDia(){');
const finLectorPublico = js.indexOf('\n}\n', inicioLectorPublico);
const lecturasEditoriales = [];
let lecturasDirectasEditoriales = 0;
const lectorPublico = new Function('window', 'fetch', `
  const MODO_LOCAL_SEGURO=false,SERVICIOS_USUARIO_REMOTOS=false,SERVICIOS_USUARIO_DISPONIBLES=false;
  const API='https://catalogo.invalid/rest/v1',CLAVE_PUB='publicable-prueba';
  ${js.slice(inicioLectorPublico, finLectorPublico + 2)}
  return alDia;
`)({RWADAR_ACCESO:{catalogo:async(tabla,consulta)=>{
  lecturasEditoriales.push('/'+tabla+'?'+consulta);
  throw Object.assign(new Error('HTTP 503 de la pasarela simulada'),{status:503});
}}}, async()=>{lecturasDirectasEditoriales++;throw new Error('No se permite acceso directo al catálogo');});
await capturaError(lectorPublico());
prueba('el lector conserva sus cuatro consultas por la pasarela autenticada, sin acceso directo',
  lecturasEditoriales.length === 4 && lecturasDirectasEditoriales === 0 &&
  lecturasEditoriales.some(u => u.includes('/catalogo_publicacion?select=retirado,motivo')) &&
  lecturasEditoriales.some(u => u.includes('/catalogo_plataformas_publicas_v2?')) &&
  lecturasEditoriales.some(u => u.includes('/catalogo_ofertas_publicas_v2?')) &&
  lecturasEditoriales.some(u => u.includes('/plataformas?estado=eq.descartada&')));

/* Las siguientes regresiones prueban el código de cuenta conservado para una
   su transporte anterior. Sus arneses eligen servidor=false explícitamente;
   el candidato usa la pasarela, comprobada por separado sin credenciales. */
prueba('la contraseña mínima es de 12 caracteres en HTML y JS',
  (html.match(/minlength="12"/g) || []).length === 2 && /clave\.length<12/.test(js));
prueba('la cuenta no persiste tokens en localStorage y el servidor usa cookie protegida',
  /const guarda=\(s,mismaCuenta=false\)=>\{ses=normalizaSesion\(s\)/.test(js) &&
  !/localStorage\.(?:setItem|getItem)\([^)]*(?:access_token|refresh_token)/.test(js) &&
  /const servidor=typeof window!=='undefined'&&window\.RWADAR_ACCESO/.test(js) &&
  /; Path=\/; HttpOnly; Secure; SameSite=Lax/.test(servidorAcceso) &&
  /Max-Age=0/.test(servidorAcceso));
prueba('la identidad se revalida contra Auth antes de usar la sesión', /auth\('\/user',null,\{metodo:'GET',token:tk\}\)/.test(js));
prueba('la recuperación limpia el fragmento y abre cambio de contraseña',
  /history\.replaceState\(null,'',location\.pathname\+location\.search\)/.test(js) &&
  /tipo==='recovery'\)abrir\('nueva_clave'\)/.test(js));
prueba('la recuperación cambia la contraseña autenticada con PUT /user',
  /auth\('\/user',\{password:clave\},\{metodo:'PUT',token:tk\}\)/.test(js));
{
  const inicio = js.indexOf('function mensajeErrorRetorno(');
  const fin = js.indexOf('function traduce(', inicio);
  const errorRetorno = new Function(js.slice(inicio, fin) + '\nreturn mensajeErrorRetorno;')();
  const mensajes = ['<script>roba()</script>', 'Contacta con banco-falso.example y comparte tu clave',
    'invalid login — TU_CODIGO_PRIVADO', '__proto__'];
  prueba('el error de un enlace no refleja HTML, instrucciones, secretos ni texto arbitrario',
    mensajes.every(texto => {
      const p = new URLSearchParams({error_description:texto, error:'desconocido'});
      return errorRetorno(p) === 'No se ha podido validar el enlace. Solicita uno nuevo desde RWAdar.';
    }) && /caducado/.test(errorRetorno(new URLSearchParams({error_code:'otp_expired',error_description:'texto ajeno'}))));
  const callback = js.slice(js.indexOf('  const parametrosRetorno='), js.indexOf('\n }\n /* El pre-renderizado'));
  const simular = new Function('URL', 'URLSearchParams', `return async function(url, inicial=null){
    const location=new URL(url),history={replaceState(){}};
    const servidor=false; // Retorno heredado, sin adoptar una cookie de sesión.
    let ses=inicial,identidadConfirmada=false,versionCuenta=0,operacionCuenta=0,fichaAbierta=null;
    let verificaciones=0;const mensajes=[],modos=[];
    const pinta=()=>{},pintarVigilar=()=>{},abrirPerfil=()=>{},msj=t=>mensajes.push(t),aviso=t=>mensajes.push(t);
    const abrir=modo=>modos.push(modo),guarda=s=>{ses=s;versionCuenta++;};
    const confirmarIdentidad=async()=>{verificaciones++;ses={...ses,uid:'usuario-verificado',correo:'cuenta-verificada@example.test'};identidadConfirmada=true;return true;};
    const cargarMio=async()=>true;
    ${js.slice(inicio, fin)}
    ${callback}
    for(let i=0;i<5;i++)await Promise.resolve();
    return {ses,modos,mensajes,verificaciones};
  };`)(URL, URLSearchParams);
  const adoptada = await simular('https://rwadar.pages.dev/#type=signup&access_token=prueba&email=cuenta-ajena@example.test');
  prueba('un enlace verificado anuncia la identidad devuelta por Auth, nunca el correo del fragmento',
    adoptada.verificaciones === 1 && adoptada.mensajes.some(t=>t.includes('cuenta-verificada@example.test')) &&
    adoptada.mensajes.every(t=>!t.includes('cuenta-ajena@example.test')));
  const anterior = {uid:'anterior',correo:'anterior@example.test',access_token:'anterior-sintetico'};
  const conservada = await simular('https://rwadar.pages.dev/#type=recovery&access_token=otra-prueba', anterior);
  prueba('un enlace recibido mientras hay otra sesión no la sustituye ni consulta sus datos',
    conservada.verificaciones === 0 && conservada.ses === anterior &&
    conservada.mensajes.some(t=>t.includes('Cierra la sesión')));
}

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
prueba('Auth usa la pasarela verificada sin tokens reales ni peticiones directas y conserva el estado HTTP',
  await authUsaPasarelaSinCredenciales(js));
prueba('el transporte Auth conservado propaga 401/503 y aborta el timeout sin dejar el reloj pendiente',
  await transporteAuthConservaEstadoYTimeout(js));
prueba('un signup sin usuario raíz válido nunca se presenta como alta aceptada',
  await altaSinUsuarioValidoFallaCerrada(js));
prueba('el reenvío de confirmación usa /resend con type signup y no promete entrega',
  /auth\('\/resend\?redirect_to='\+vuelta,await conAntiRobots\(\{type:'signup',email:correoPendiente\}\)\)/.test(js) &&
  /Hemos pedido el reenvío[^']*no podemos confirmar que el correo te llegue/i.test(js));
prueba('alta, entrada, recuperación y reenvío pasan por el anti-robots; renovar la sesión y cambiar la clave no',
  (js.match(/auth\('\/(signup|recover|resend)\?redirect_to='\+vuelta,await conAntiRobots\(/g) || []).length === 4 &&
  /auth\('\/token\?grant_type=password',await conAntiRobots\(/.test(js) &&
  /auth\('\/token\?grant_type=refresh_token',\{refresh_token:/.test(js) &&
  /auth\('\/user',\{password:clave\},\{metodo:'PUT'/.test(js) &&
  /gotrue_meta_security:\{captcha_token:t\}/.test(js));
prueba('el anti-robots nace apagado, solo carga el script de Cloudflare al pedirlo y no sigue si se cerró la ventana',
  /const TURNSTILE_SITEKEY='';/.test(js) &&
  /async function antiRobots\(\)\{\n  if\(!TURNSTILE_SITEKEY\)return null;\n[^]*?await cargaTurnstile\(\)/.test(js) &&
  /if\(op!==operacionCuenta\)throw new Error\('Operación cancelada\.'\);\n  quitaAntiRobots\(\);/.test(js) &&
  (js.match(/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/g) || []).length === 1 &&
  !/challenges\.cloudflare\.com/.test(html) && !/challenges\.cloudflare\.com/.test(headers));
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
  /o\.checked=anterior;/.test(js) && /finally\{if\(vigente\(cuenta\)\)o\.disabled=false;\}/.test(js) &&
  /No se ha podido confirmar la retirada; la preferencia sigue activada/.test(js));

for (const firma of ['/rpc/guardar_opinion','/rpc/borrar_mi_opinion','/rpc/denunciar_opinion',
  'p_opinion_id','/mis_opiniones?select=opinion_id'])
  prueba(`el frontend incluye el contrato ${firma}`, js.includes(firma));
prueba('las opiniones públicas no solicitan usuario_id', !/opiniones_publicas\?select=[^'\n]*usuario_id/.test(js));
prueba('no hay escrituras directas a opiniones o denuncias',
  !/pide\('\/(?:opiniones|denuncias)'\s*,\s*\{\s*method\s*:/.test(js));

console.log('\n=== EMISIONES, PWA Y ADELGAZADO ===');
for (const id of ['emisiones','emiFiltros','emiLista','emiOrden']) prueba(`existe el control ${id}`, ids.includes(id));
prueba('las tres colecciones solo viven en el snapshot generado externo',
  ['P','FUERA','EMI'].every(n => new RegExp('^const '+n+'=\\[','m').test(jsCatalogo) && !new RegExp('^const '+n+'=\\[','m').test(js)));
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
// Revisión legal 06/11/2026, 5.3: la tarjeta antigua (emisiones sin ficha del catálogo)
// no trae la comprobación de supervisión, así que nunca dice «Ver oferta en».
for (const esNo of [true, false, null]) {
  const antigua = renderEmisionHostil(js, { esNo });
  prueba(`tarjeta antigua con disponible_es ${esNo}: el enlace dice que sales de RWAdar, nunca «Ver oferta en»`,
    antigua.includes('>Ir a la web del proveedor (sales de RWAdar) ↗</a>') && !antigua.includes('Ver oferta en'));
}

console.log('\n=== ADAPTACIÓN MÓVIL Y ACCESIBILIDAD ===');
// Barra de 5 (decisión de Víctor, 04/11/2026; ESPEC-INICIO §4): Ofertas y
// Plataformas son las dos vistas de Buscar; los valores de data-movil-tab no cambian.
const contratoTabs = [
  { valor:'inicio', id:'movilTabInicio', panel:'movilPanelInicio', etiqueta:'Inicio' },
  { valor:'buscar', vista:'ofertas', id:'movilTabRadar', panel:'movilPanelRadar', etiqueta:'Ofertas' },
  { valor:'buscar', vista:'plataformas', id:'movilTabPlataformas', panel:'movilPanelRadar', etiqueta:'Plataformas' },
  { valor:'academy', id:'movilTabAcademy', panel:'movilPanelAcademy', etiqueta:'Academy' },
  { valor:'cuenta', id:'movilTabMas', panel:'movilPanelMas', etiqueta:'Perfil' },
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
prueba('la barra móvil tiene exactamente cinco botones y ningún control improvisado',
  botonesNavMovil.length === 5 &&
  !/<a\b[^>]*\bclass=["'][^"']*\bmovil-nav-item\b/i.test(navMovil?.[2] || ''));
prueba('los cinco botones conservan orden, destino, vista y nombre accesible',
  contratoTabs.every((esperada, i) => {
    const boton = botonesNavMovil[i];
    if (!boton) return false;
    return atributoHTML(boton[1], 'type') === 'button' &&
      atributoHTML(boton[1], 'role') === 'tab' &&
      atributoHTML(boton[1], 'id') === esperada.id &&
      atributoHTML(boton[1], 'data-movil-tab') === esperada.valor &&
      atributoHTML(boton[1], 'aria-controls') === esperada.panel &&
      atributoHTML(boton[1], 'data-nav-vista') === (esperada.vista || null) &&
      textoHTML(boton[2]).includes(esperada.etiqueta);
  }));
/* Sin JavaScript se ve Buscar (es el contenido de <main> y el escritorio);
   con JavaScript, el móvil abre Inicio salvo que la URL traiga un ancla. */
prueba('en el HTML solo Ofertas (Buscar) empieza seleccionada y el foco sigue el patrón roving-tabindex',
  botonesNavMovil.filter(b => atributoHTML(b[1], 'aria-selected') === 'true').length === 1 &&
  contratoTabs.every((esperada, i) =>
    atributoHTML(botonesNavMovil[i]?.[1] || '', 'aria-selected') === (esperada.vista === 'ofertas' ? 'true' : 'false') &&
    atributoHTML(botonesNavMovil[i]?.[1] || '', 'tabindex') === (esperada.vista === 'ofertas' ? '0' : '-1')));
// Un ancla que vive en Inicio (#fuentes-cap3) se queda en Inicio (revisión técnica, 04/11/2026).
prueba('en el móvil la app abre en Inicio, y un enlace con ancla abre Buscar salvo que el ancla sea de Inicio',
  /const destinoInicial=typeof location!=='undefined'&&location\.hash&&location\.hash\.length>1\?\(anclaEnInicio\(\)\?'inicio':'buscar'\):'inicio';/.test(js) &&
  /n\.closest\('#movilPanelInicio'\)/.test(js) &&
  /let activa=destinoInicial,/.test(js));

const etiquetasInicio = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)];
const panelesMoviles = etiquetasInicio.filter(e => atributoHTML(e[2], 'data-movil-panel') !== null);
prueba('cada pestaña controla un panel accesible y los paneles inactivos nacen ocultos',
  panelesMoviles.length === 4 && contratoTabs.every((esperada, i) => {
    const panel = panelesMoviles.find(p => atributoHTML(p[2], 'id') === esperada.panel);
    return panel && atributoHTML(panel[2], 'data-movil-panel') === esperada.valor &&
      atributoHTML(panel[2], 'role') === 'tabpanel' &&
      atributoHTML(panel[2], 'aria-labelledby') === (esperada.vista ? 'movilTabRadar' : esperada.id) &&
      (esperada.valor === 'buscar' ? atributoHTML(panel[2], 'hidden') === null : atributoHTML(panel[2], 'hidden') !== null);
  }));
prueba('Inicio, Buscar (Ofertas y Plataformas), Academy y Perfil son las únicas rutas de primer nivel',
  new Set(botonesNavMovil.map(b => atributoHTML(b[1], 'data-movil-tab'))).size === 4 &&
  contratoTabs.every(esperada => botonesNavMovil.some(b =>
    atributoHTML(b[1], 'data-movil-tab') === esperada.valor)) &&
  !botonesNavMovil.some(b => ['radar','siguiendo','avisos','mas','favoritos','inversiones'].includes(
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
prueba('la barra es inferior, tiene cinco columnas y reserva el safe-area',
  /position\s*:\s*fixed/i.test(navEnMovil) && /bottom\s*:\s*0/i.test(navEnMovil) &&
  (/grid-template-columns\s*:\s*repeat\(\s*5\s*,/i.test(navEnMovil) ||
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
  /radio=Math\.max\(22,22\/escala\)/.test(js) && /let mejor=null,distancia=radio\*radio/.test(js) &&
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
// Rótulos en llano: LISTA-FINAL.md (revisión de frases que pidió Víctor, 04/11/2026), filas 42, 48, 7, 24, 25, 26 y 55.
const camposDetalle = [
  ['Tipo de empresa', 'p.tipo'],
  // «Acreditado» se lee «Inversor acreditado» (LISTA-FINAL fila 21); el valor no cambia.
  ['Quién puede entrar', 'etiquetaAcceso(p.acceso)'],
  ['Importe de entrada', 'p.ticket'],
  ['Tipo de activo', 'p.cat'],
  ['Región y normativa', 'p.reg'],
  ['Blockchains', 'p.cadenas'],
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
  codigoDetalle.includes('Comprueba siempre los datos en la web oficial') &&
  /display\s*:\s*block/i.test(declaracionesCSS(cssMovil, '#drawer .pn-web-movil-nota').join(';')));
prueba('Escape, velo y ambos botones cierran la ficha y restauran el foco',
  /id=["']ovl["'][^>]*data-accion=["']cerrar-panel["']/.test(html) &&
  /data-accion=["']cerrar-panel["']/.test(drawerHTML) &&
  codigoDetalle.includes('data-accion="cerrar-panel"') &&
  /e\.key===['"]Escape['"]\)closeAll\(\)/.test(codigoPaneles) &&
  /dataset\.accion===['"]cerrar-panel['"]\)return closeAll\(\)/.test(jsSinComentarios) &&
  /focoPrevio=document\.activeElement/.test(codigoPaneles) &&
  /document\.contains\(focoPrevio\)[\s\S]*?focoPrevio\.focus\(\{preventScroll:true\}\)/.test(codigoPaneles));
{
  let desplazamiento = 640, foco = '';
  const clases=()=>({add(){},remove(){}});
  const origen={focus(opciones){foco='origen';if(!opciones?.preventScroll)desplazamiento=0;}};
  const cuerpo={scrollTop:360};
  const cierre={focus(opciones){foco='cerrar';if(!opciones?.preventScroll)desplazamiento=2000;}};
  const panel={scrollTop:700,classList:clases(),removeAttribute(){},setAttribute(){},
    querySelector:s=>s==='.cerrar'?cierre:cuerpo};
  const document={activeElement:origen,body:{classList:clases()},contains:n=>n===origen,
    querySelectorAll:()=>[],getElementById:id=>id==='ovl'?{classList:clases()}:panel,addEventListener(){}};
  const history={state:null,pushState(state){this.state=state;},back(){}};
  const api=new Function('document','window','history','location',codigoPaneles+';return {openPanel,cierraPanelVisual};')(
    document,{addEventListener(){}},history,{href:'https://rwadar.example/'});
  api.openPanel('drawer');
  const abreDesdeArriba=panel.scrollTop===0&&cuerpo.scrollTop===0&&foco==='cerrar'&&desplazamiento===640;
  api.cierraPanelVisual();
  prueba('reabrir una ficha con scroll anterior empieza arriba y cerrar conserva posición y foco de la lista',
    abreDesdeArriba&&foco==='origen'&&desplazamiento===640);
}
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
prueba('Buscar prioriza ofertas, búsqueda, radar animado y resultados',
  ordenMovil('#movilPanelRadar>.emis') === 1 &&
  ordenMovil('#movilPanelRadar>.tool') === 2 &&
  ordenMovil('#movilPanelRadar>.barra') === 3 &&
  ordenMovil('#movilPanelRadar>.movil-radar-intro') === 4 &&
  ordenMovil('#movilPanelRadar>.portada-radar') === 5 &&
  ordenMovil('#movilPanelRadar>#plataformasResultados') === 8 &&
  ordenMovil('#movilPanelRadar>.movil-transparencia') === 9 &&
  ordenMovil('#movilPanelRadar>.portada-txt') > 9);
prueba('Buscar mueve los mismos nodos y restaura su lugar al volver a escritorio',
  (html.match(/\bid=["']emisiones["']/g) || []).length === 1 &&
  /paneles\.get\(['"]buscar['"]\)/.test(codigoShellMovil) &&
  /createComment\(['"]rwadar: posici[oó]n de escritorio ['"]\+indice\)/i.test(codigoShellMovil) &&
  /ordenMovil\.forEach/.test(codigoShellMovil) && /restaurarEscritorio/.test(codigoShellMovil) &&
  reparentadoEmisionesEsReversible(js));
prueba('Academy reúne el aprendizaje sin repetir sus accesos en Buscar e Inicio',
  !/id="movilAbrirAcademy"|id="inicioEmpezarTit"/.test(html) &&
  /id="movilTabAcademy"/.test(html) && /Lección en 3D: qué es tokenizar/.test(html) &&
  !/class="hdr-link" href="#explain"/.test(html));
prueba('escritorio coloca ofertas y plataformas antes de la transparencia y Academy sin duplicar nodos',
  /const ordenEscritorio=\[portada,emisiones,herramienta,barra,resultados,metodo,fuera,academia\]/.test(codigoShellMovil) &&
  /ordenEscritorio\.forEach\(nodo=>panelBuscar\.appendChild\(nodo\)\)/.test(codigoShellMovil));
prueba(`los resultados móviles muestran seis fichas y conservan las ${N_PLATAFORMAS} en el DOM`,
  /id="plataformasResultados"/.test(html) &&
  /id="movilResultadosMas"[^>]*data-accion="alternar-resultados"[^>]*aria-controls="grid"/.test(html) &&
  /#grid:not\(\.movil-resultados-abiertos\)>\.ficha:nth-child\(n\+7\)/.test(cssMovil) &&
  /LIMITE_MOVIL_RESULTADOS=6/.test(jsSinComentarios) &&
  /filtrando\|\|S2\.view!==['"]grid['"]/.test(jsSinComentarios));
prueba('Academy ofrece el tutorial guiado manual sin vídeos ni canvas inventados',
  /id="academy"[^>]*aria-labelledby="academyTit"/.test(html) &&
  /data-movil-action="cerrar-academy"/.test(html) &&
  /Academy · Tutorial guiado · 4 pasos/.test(html) && !/<video\b|<iframe\b/i.test(html) &&
  /data-ir="explain">Empezar tutorial 3D/.test(html) &&
  /<!--academy:ini-->[\s\S]*href="\/academy\/"[\s\S]*<!--academy:fin-->/.test(html) &&
  (html.match(/\bid=["'](?:explain|scene|gl)["']/g) || []).length === 3 &&
  /academyLeccion\.appendChild\(explicador\)/.test(jsSinComentarios) &&
  /rwadarAcademy/.test(jsSinComentarios));
prueba('Academy abre en el primer paso y el tutorial avanza solo con sus controles manuales',
  /irPaso\(0,false\);\s*if\(typeof reiniciarPasosAutomaticos===['"]function['"]\)reiniciarPasosAutomaticos\(\)/
    .test(jsSinComentarios) &&
  /function reiniciarPasosAutomaticos\(\)\{[^}]*if\(reloj\)\{clearInterval\(reloj\);reloj=null;\}/.test(jsSinComentarios) &&
  ['exAnterior','exSiguiente','exProgreso','exFinal'].every(id=>html.includes(`id="${id}"`)) &&
  tutorialManualRespetaPasos(js));
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
  /mostrarAcademy\(true,enfocar,false,document\.getElementById\(['"]movilTabAcademy['"]\)\)/.test(codigoShellMovil) &&
  /cambiar\('academy',\{arriba:false\}\)/.test(codigoShellMovil) &&
  /pageshow[\s\S]*?!e\.persisted\|\|media\.matches!==modoMovilPrevio[\s\S]*?reconciliarEstadoSubvista\(false\)/.test(codigoShellMovil));
prueba('el cierre devuelve el foco a un control que también queda dentro de pantalla',
  /getClientRects&&nodo\.getClientRects\(\)\.length/.test(codigoShellMovil) &&
  /function devolverFoco\(origen,alternativo\)/.test(codigoShellMovil) &&
  /if\(!enVista\(destino\)&&destino\.scrollIntoView\)/.test(codigoShellMovil) &&
  /scrollIntoView\(\{block:['"]center['"],behavior:['"]auto['"]\}\)/.test(codigoShellMovil) &&
  /document\.getElementById\(['"]q['"]\)\|\|document\.getElementById\(['"]movilTabRadar['"]\)/.test(codigoShellMovil));
// La subvista móvil de Avisos se quitó el 13/11/2026 (no estaba en la página): Ayuda solo sustituye a Detalle.
prueba('Ayuda sustituye Detalle sin encadenar back y push',
  /if\(academyAbierta\)[\s\S]{0,240}?return/.test(codigoShellMovil) &&
  /if\(sustituyeDetalle&&typeof history!=='undefined'&&history\.replaceState\)[\s\S]{0,180}?history\.replaceState/.test(codigoShellMovil));
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
const plataformasFuente = arrayDe(jsCatalogo, 'P');
const slugPortada = valor => String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rutasPortada = plataformasFuente.map(p => `/plataformas/${slugPortada(p.n)}.webp`);
const manifiestoPortadas = JSON.parse(lee('plataformas/fuentes.json'));
const entradasPortadas = manifiestoPortadas.plataformas || [];
const portadasPorEmpresa = new Map(entradasPortadas.map(x => [x?.empresa, x]));
const portadasGeneradas = entradasPortadas.filter(x => x?.origenVisual === 'representacion-editorial-generada');
const portadasOficiales = entradasPortadas.filter(x => x?.origenVisual === 'fuente-oficial');
const bloqueGeneradasMovil = js.match(/const PORTADAS_GENERADAS_MOVIL=new Set\(\[([\s\S]*?)\]\);/);
const nombresGeneradasMovil = bloqueGeneradasMovil
  ? vm.runInNewContext(`[${bloqueGeneradasMovil[1]}]`, Object.create(null), { timeout: 1_000 }) : [];
const botonesEmpresaVisual = etiquetasInicio.filter(e => e[1].toLowerCase() === 'button' &&
  (atributoHTML(e[2], 'class') || '').split(/\s+/).includes('empresa-visual__abrir'));
const imagenesEmpresaVisual = etiquetasInicio.filter(e => e[1].toLowerCase() === 'img' &&
  (atributoHTML(e[2], 'class') || '').split(/\s+/).includes('empresa-visual__imagen'));
/* Cada empresa del radar tiene su portada; el manifiesto de portadas puede conservar la de
   una plataforma que pasó a Descartadas (ARTEX, 04/11/2026): no se enseña en ninguna lista. */
const nombresDescartadas = new Set(CATALOGO_REAL.fuera.map(f => f.n));
prueba(`las ${N_PLATAFORMAS} empresas usan portadas WebP editoriales propias sin imagen externa y con hash verificable`,
  rutasPortada.length === N_PLATAFORMAS && new Set(rutasPortada).size === N_PLATAFORMAS &&
  portadasPorEmpresa.size === entradasPortadas.length && portadasOficiales.length === 0 &&
  portadasGeneradas.length === entradasPortadas.length &&
  entradasPortadas.every(x => plataformasFuente.some(p => p.n === x?.empresa) || nombresDescartadas.has(x?.empresa)) &&
  new Set(entradasPortadas.map(x => x?.sha256)).size === entradasPortadas.length &&
  new Set(entradasPortadas.map(x => x?.archivo)).size === entradasPortadas.length &&
  rutasPortada.every((ruta, i) => {
    const plataforma = plataformasFuente[i];
    const entrada = portadasPorEmpresa.get(plataforma.n);
    const bytes = fs.readFileSync(path.join(sitio, ...ruta.slice(1).split('/')));
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    return entrada && !entrada.error && entrada.empresa === plataforma.n &&
      entrada.archivo === ruta.slice(1) && entrada.bytes === bytes.length &&
      entrada.sha256 === sha256 && /^[a-f0-9]{64}$/.test(entrada.sha256) &&
      entrada.origenVisual === 'representacion-editorial-generada' && entrada.pagina === null &&
      entrada.imagenOrigen === null && /^https:\/\//.test(entrada.paginaReferencia) &&
      entrada.creador === 'RWAdar' && /ImageGen/.test(entrada.herramienta || '') &&
      entrada.tipoVisual === 'Representación editorial generada' &&
      /sin metadatos/i.test(entrada.metodo || '') &&
      bytes.length > 1024 && bytes.subarray(0,4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8,12).toString('ascii') === 'WEBP';
  }));
prueba('el distintivo móvil coincide exactamente con las portadas generadas del manifiesto',
  nombresGeneradasMovil.length === portadasGeneradas.length && new Set(nombresGeneradasMovil).size === nombresGeneradasMovil.length &&
  [...nombresGeneradasMovil].sort().join('|') === portadasGeneradas.map(x => x.empresa).sort().join('|'));
prueba('las portadas explican qué muestran y conservan el encuadre editorial elegido',
  entradasPortadas.every(entrada =>
    entrada?.tipoVisual === 'Representación editorial generada' &&
    typeof entrada?.descripcionVisual === 'string' && entrada.descripcionVisual.length >= 28 &&
    ['cover', 'contain'].includes(entrada?.encuadre) && /^\d+% \d+%$/.test(entrada?.foco || '') &&
    /(?:no|ni) implica afiliación, patrocinio (?:ni|o) recomendación de inversión/i.test(entrada?.uso || '') &&
    Number(entrada?.revisionPortada) >= 6));
prueba('cada portada móvil es el botón accesible que abre su ficha y carga la imagen de forma eficiente',
  botonesEmpresaVisual.length === N_PLATAFORMAS && imagenesEmpresaVisual.length === N_PLATAFORMAS &&
  botonesEmpresaVisual.every((b, i) => atributoHTML(b[2], 'type') === 'button' &&
    atributoHTML(b[2], 'data-abrir') === String(i) &&
    atributoHTML(b[2], 'aria-label') === `Abrir la ficha de ${plataformasFuente[i].n}${
      portadasPorEmpresa.get(plataformasFuente[i].n)?.origenVisual === 'representacion-editorial-generada'
        ? '; portada ilustrativa' : ''}` &&
    atributoHTML(imagenesEmpresaVisual[i]?.[2] || '', 'src') === rutasPortada[i]) &&
  imagenesEmpresaVisual.every(img => atributoHTML(img[2], 'alt') === '' &&
    atributoHTML(img[2], 'width') === '720' && atributoHTML(img[2], 'height') === '720' &&
    atributoHTML(img[2], 'decoding') === 'async' &&
    atributoHTML(img[2], 'loading') === 'lazy'));
// Imágenes limpias (decisión de Víctor, 03/11/2026, ESPEC-FINAL §1): ninguna
// etiqueta encima de la portada. La honestidad va en el nombre accesible
// («; portada ilustrativa»), en la ficha y en una línea visible bajo la galería.
prueba('las portadas ilustrativas se declaran sin taparlas: nombre accesible, ficha y línea bajo la galería',
  !/empresa-visual__origen/.test(js) && !/empresa-visual__origen/.test(html) &&
  js.includes("aria-label=\"Abrir la ficha de ${escHtml(p.n)}${ilustrativa?'; portada ilustrativa':''}\"") &&
  /<p class="nota-ilustrativa nota-portadas">Portadas ilustrativas, no logotipos ni fotos de la empresa<\/p>/.test(html) &&
  /display\s*:\s*block/i.test(declaracionesCSS(cssMovil, '#movilPanelRadar .nota-portadas').join(';')) &&
  /<span>Ficha verificada<\/span>/.test(js) &&
  /Imagen ilustrativa/.test(js) && /No muestra un activo concreto/.test(js) &&
  /minmax\(0,1fr\)/i.test(declaracionesCSS(cssBase, '.pn-origen-visual').join(';')));
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
prueba('la barra de comparación vacía queda oculta y fuera de interacción',
  /visibility\s*:\s*hidden/i.test(declaracionesCSS(cssBase, '.cmpbar:not(.show)').join(';')) &&
  /pointer-events\s*:\s*none/i.test(declaracionesCSS(cssBase, '.cmpbar:not(.show)').join(';')) &&
  /visibility\s*:\s*visible/i.test(declaracionesCSS(cssBase, '.cmpbar.show').join(';')) &&
  /pointer-events\s*:\s*auto/i.test(declaracionesCSS(cssBase, '.cmpbar.show').join(';')));
prueba('las superficies nuevas solo aparecen dentro de la interfaz móvil',
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-banner-explica').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-busqueda-cab').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-ficha-abrir').join(';')) &&
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.movil-ofertas-intro').join(';')));
const panelHTML = id => {
  const a = html.indexOf(`<section class="movil-panel" id="${id}"`);
  const b = a >= 0 ? html.indexOf('\n</section>', a) : -1;
  return a >= 0 && b > a ? html.slice(a, b + 11) : '';
};
const panelInicioHTML = panelHTML('movilPanelInicio');
const panelAcademyHTML = panelHTML('movilPanelAcademy');
const panelPerfilHTML = panelHTML('movilPanelMas');
// Inicio por bloques (rediseño del 10/11/2026, encargo de Víctor: «mucho lío en Inicio»): Cabecera,
// Ofertas, Mercado y noticias (unidos el 11/11/2026), Aprende y Pie, cada uno con su «Ver …» a su sección. La historia en
// seis capítulos, sus fuentes y la nota legal completa van en /aprende/; nada se repite.
const aprendeHTML = lee('aprende/index.html');
{
  // «Calcula tus números» (11/11/2026) va entre «Mercado y noticias» y Aprende: sus campos son los únicos de Inicio.
  const orden = ['id="relPortada"', 'id="relNuevas"', 'id="mercado"', 'id="ntLista"', 'id="calculadora"', 'id="iniAprendeTit"', 'class="ini-pie"'].map(x => panelInicioHTML.indexOf(x));
  const aCalc = panelInicioHTML.indexOf('<section class="ini-bloque calc-ini" id="calculadora"');
  const inicioSinCalc = panelInicioHTML.slice(0, aCalc) + panelInicioHTML.slice(panelInicioHTML.indexOf('</section>', aCalc));
  prueba('Inicio son bloques cortos en orden (Cabecera, Ofertas, Mercado y noticias, Calcula tus números, Aprende y Pie), cada uno con su «Ver …», sin buscador',
    orden.every((x, i) => x > 0 && (i === 0 || x > orden[i - 1])) &&
    ['href="/mercado/"', 'href="/aprende/"', 'href="/aprende/#nota-legal"'].every(x => panelInicioHTML.includes(x)) && !panelInicioHTML.includes('href="/noticias/"') &&
    // La cifra de ofertas sale una vez (en las cifras): ni el botón ni el enlace del carrusel la repiten.
    /<button class="b1 rel-cta" type="button" data-movil-ir="emisiones">Ver las ofertas<\/button>/.test(panelInicioHTML) &&
    /<span>Ver todas las ofertas<\/span>/.test(panelInicioHTML) && !/\{ofertas\}/.test(panelInicioHTML) &&
    // El pie no es un <footer>: en el móvil, la hoja principal esconde los <footer> fuera de «Buscar».
    /<div class="ini-pie" role="note" aria-label="Nota legal">/.test(panelInicioHTML) && !/<footer\b/.test(panelInicioHTML) &&
    aCalc > 0 && !/<(?:textarea|input|form|select)\b/i.test(inicioSinCalc) && !/<(?:textarea|form|select)\b/i.test(panelInicioHTML) &&
    !/inicioEmpezarTit|data-movil-action="academy"|data-movil-ir="metodo"|inicioComunidad/.test(panelInicioHTML) &&
    /<section class="movil-menu-grupo" id="perfilComunidad"[^>]*\shidden>/.test(panelPerfilHTML));
  prueba('Inicio no repite: sin capítulos, sin franja de novedades, sin escaparate aparte y un solo aviso de riesgo',
    !/id="relCap\d"|rel-novedades|noticias:ini|rel-refs|rel-empieza|class="rel-escaparate"|relTarjetas/.test(panelInicioHTML) &&
    (panelInicioHTML.match(/Invertir tiene riesgos/g) || []).length === 1 &&
    (panelInicioHTML.match(/class="ini-bloque-tit"/g) || []).length === 4);
  // «¿Quieres colaborar con nosotros?» (12/11/2026): un solo bloque (#colaboraPlantilla) que
  // ponerColabora() copia al final de Inicio (tras Aprende, antes del pie) y de Perfil (antes de
  // la nota final) y en la cuenta de escritorio.
  {
    const plantilla = (html.match(/<template id="colaboraPlantilla">([\s\S]*?)<\/template>/) || [])[1] || '';
    const app = lee('assets/rwadar-20260820.js');
    const en = require('./rwadar-site/assets/idioma-en-20261022.js');
    const textosColabora = ['¿Quieres colaborar con nosotros?',
      'Si eres una plataforma o un emisor, trabajas en el sector o quieres proponer una mejora, escríbenos.',
      'Colaborar no compra un puesto en el catálogo: las ofertas se eligen con criterios editoriales y hoy RWAdar no cobra comisiones por las inversiones.',
      'Escríbenos: rwadares@gmail.com'];
    const [iAprende, iColabora, iPie] = ['id="iniAprendeTit"', '<div data-colabora="inicio" hidden></div>', 'class="ini-pie"'].map(x => panelInicioHTML.indexOf(x));
    const [iPerfil, iNota] = [panelPerfilHTML.indexOf('<div data-colabora="perfil" hidden></div>'), panelPerfilHTML.indexOf('class="movil-nota-final"')];
    prueba('«¿Quieres colaborar con nosotros?»: un solo bloque, al final de Inicio y de Perfil, con h2, mailto:rwadares@gmail.com y su inglés',
      (html.match(/id="colaboraPlantilla"/g) || []).length === 1 &&
      /^\s*<section class="ini-bloque colabora">[\s\S]*<h2 class="ini-bloque-tit colabora-tit">¿Quieres colaborar con nosotros\?<\/h2>/.test(plantilla) &&
      /<a class="b1 colabora-boton" href="mailto:rwadares@gmail\.com">[\s\S]*<span>Escríbenos: rwadares@gmail\.com<\/span>\s*<\/a>/.test(plantilla) &&
      textosColabora.every(t => plantilla.includes(t) && typeof en[t] === 'string' && en[t] !== t) &&
      en['Escríbenos: rwadares@gmail.com'] === 'Write to us: rwadares@gmail.com' &&
      iAprende > 0 && iColabora > iAprende && iPie > iColabora &&
      iPerfil > 0 && iNota > iPerfil && !/<section\b/.test(panelPerfilHTML.slice(iPerfil)) &&
      /function ponerColabora\(raiz\)/.test(app) && /'<div data-colabora="cuenta" hidden><\/div>';[^\n]*\n[^\n]*\n\s*if\(typeof ponerColabora==='function'\)ponerColabora\(c\);/.test(app));
  }
  // Revisión del 12/11/2026: tras el botón, el enlace a la transparencia comercial (de qué vive
  // RWAdar); la fila «Contactar» de Perfil dice para qué es; y rwadares@gmail.com es el único
  // correo que ve un visitante de la web o de la app (sin el antiguo de Proton en ningún sitio).
  {
    const plantilla = (html.match(/<template id="colaboraPlantilla">([\s\S]*?)<\/template>/) || [])[1] || '';
    const en = require('./rwadar-site/assets/idioma-en-20261022.js');
    const visibles = (dir, filtro) => fs.readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter(f => f.isFile() && filtro(f.name) && !/node_modules|[\/\\]\.expo/.test(path.join(f.parentPath || f.path, f.name)))
      .map(f => path.join(f.parentPath || f.path, f.name));
    const conProton = [...visibles(sitio, n => /\.(html|js|css|txt|xml|json|webmanifest)$/.test(n) || n === 'security.txt'),
      ...['rwadar-movil/App.js', 'rwadar-movil/app.json'].map(f => path.join(raiz, f)).filter(f => fs.existsSync(f)),
      ...visibles(path.join(raiz, 'rwadar-movil/lib'), n => n.endsWith('.js')), ...visibles(path.join(raiz, 'rwadar-movil/componentes'), n => n.endsWith('.js'))]
      .filter(f => /proton[m]ail/i.test(fs.readFileSync(f, 'utf8')));
    prueba('«¿Quieres colaborar…?»: tras el botón, enlace a /transparencia-comercial; Perfil dice para qué es «Contactar»; ningún correo antiguo a la vista',
      /<a class="b1 colabora-boton" href="mailto:rwadares@gmail\.com">[\s\S]*?<\/a>\s*<p class="colabora-mas"><a href="\/transparencia-comercial">Transparencia comercial<\/a><\/p>\s*<\/section>\s*$/.test(plantilla) &&
      /<a class="movil-menu-fila" href="mailto:rwadares@gmail\.com">[\s\S]*?<b>Contactar<\/b><small>Datos y privacidad · rwadares@gmail\.com<\/small>/.test(panelPerfilHTML) &&
      en['Datos y privacidad · rwadares@gmail.com'] === 'Data and privacy · rwadares@gmail.com' &&
      /"email":"rwadares@gmail\.com"/.test(html) &&
      (conProton.length === 0 || (console.log('   con el correo antiguo:', conProton.join(', ')), false)));
  }
  prueba('/aprende/ trae los seis capítulos, su carrusel, la Academy, las fuentes y la nota legal, sin cifras de mercado en el 03',
    ['relCap1', 'relCap2', 'relCap3', 'relCap4', 'relCap5', 'relCap6', 'relQuienLista', 'relRefs', 'nota-legal', 'notaLegalCompleta'].every(id => aprendeHTML.includes(`id="${id}"`)) &&
    /<!--academy-inicio:ini-->[\s\S]*href="\/academy\/"[\s\S]*<!--academy-inicio:fin-->/.test(aprendeHTML) &&
    /<a class="rel-enlace" href="\/mercado\/">Mercado y noticias<\/a>/.test(aprendeHTML) &&
    !/14\.230|125 veces|3,9 %/.test(aprendeHTML) &&
    // Las frases con cifras del catálogo (04: mínimos de 1 € y su aviso; 06: vigencia), escondidas en la fuente:
    // rwadar-publicar.js escribe las cifras en <main> y aprende-20261110.js las enseña mientras la revisión siga vigente.
    ['relMinimos', 'relMinimosAviso', 'relVigencia'].every(id => new RegExp(`id="${id}"[^>]*\\shidden>`).test(aprendeHTML)) &&
    (aprendeHTML.match(/data-rel-plantilla="[^"]*" data-rel-plantilla-en="[^"]*" data-rel-sin="" hidden>/g) || []).length === 2 &&
    /<main id="contenido" class="sec-aprende inicio-cuerpo rel">/.test(aprendeHTML) &&
    !/data-movil-ir|data-inicio-radar/.test(aprendeHTML) &&
    /<script src="\/assets\/aprende-20261110\.js" defer><\/script>/.test(aprendeHTML) &&
    /<link rel="canonical" href="https:\/\/rwadar\.pages\.dev\/aprende\/">/.test(aprendeHTML));
}
// Cada apartado lleva a su grupo de fuentes y la lista tiene todas las de HISTORIA-v2 §4 (ahora en /aprende/;
// la Selección, desde las 5 comprobaciones de Inicio). Sin pruebas de redacción (decisión de Víctor, 04/11/2026).
{
  const f=JSON.parse(fs.readFileSync(path.join(raiz,'rwadar-editorial-source/inicio/fuentes.json'),'utf8'));
  const ir=[...aprendeHTML.matchAll(/<a class="b3 rel-fuentes" href="#fuentes-(\w+)" data-rel-fuentes="\1">([^<]+)</g)];
  const grupos=new Set([...aprendeHTML.matchAll(/<section class="rel-refs-grupo" id="fuentes-(\w+)"/g)].map(m=>m[1]));
  const enlaces=[...aprendeHTML.matchAll(/<a class="rel-refs-url"([^>]*)>/g)].map(m=>m[1]);
  prueba('Aprende: cada apartado lleva a su grupo de fuentes y están todas las de HISTORIA-v2 §4, con enlace',
    f.fuentes.length===38&&['portada','cap1','cap2','cap3','cap4','cap5','cap6','legal'].every(g=>ir.some(m=>m[1]===g))&&
    /href="\/aprende\/#fuentes-seleccion"/.test(panelInicioHTML)&&grupos.has('seleccion')&&
    ir.every(m=>grupos.has(m[1]))&&f.fuentes.every(x=>aprendeHTML.includes(`data-fuente="${x.n}"`))&&
    enlaces.length>=f.fuentes.length&&enlaces.every(a=>/href="https:\/\//.test(a)&&/target="_blank"/.test(a)&&/rel="noopener nofollow"/.test(a))&&
    (aprendeHTML.match(/class="b3 rel-refs-volver" type="button" hidden>/g)||[]).length===grupos.size);
  prueba('los enlaces de siempre siguen: emisiones, tool, fuera, el radar, los hash, la barra y las fichas',
    ['data-movil-ir="emisiones"','data-inicio-radar'].every(x=>panelInicioHTML.includes(x))&&
    ['href="/#tool"','href="/#fuera"','href="/#emisiones"'].every(x=>aprendeHTML.includes(x))&&
    /if\(destino==='emisiones'\)verEnBuscar\('ofertas'\);\s*else if\(DE_PLATAFORMAS\.has\(destino\)\)verEnBuscar\('plataformas'\);/.test(codigoShellMovil)&&
    /verEnBuscar\(typeof location!=='undefined'&&DE_PLATAFORMAS\.has\(\(location\.hash\|\|''\)\.slice\(1\)\)\?'plataformas':'ofertas'\)/.test(codigoShellMovil)&&
    /function elegirTab\(tab\)\{\s*if\(tab\.dataset\.navVista\)verEnBuscar\(tab\.dataset\.navVista\);\s*cambiar\(tab\.dataset\.movilTab\);/.test(codigoShellMovil)&&
    /closest\('\[data-perfil-oferta\]'\)/.test(codigoShellMovil)&&/Movil\.ir\('movilRadarIntro',r\)/.test(js));
  prueba('Inicio: sin style= ni on…= y quieto con «reducir movimiento»',
    !/<[^>]*\s(?:style|on[a-z]+)\s*=/i.test(panelInicioHTML)&&
    !/\.rel-anim/.test(css)&&/\.rel-progreso\{transition:none!important\}/.test(css)&&/\.panel\[inert\]\{box-shadow:none\}/.test(css));
}
// «Fuera del radar» pasa a «Descartadas» (decisión de Víctor, 04/11/2026); /fuera-del-radar/ y #fuera se quedan.
// El rótulo no se fija en una prueba (decisión de Víctor, 04/11/2026: sin reglas de redacción).
prueba('la ruta /fuera-del-radar/ y el enlace #fuera se quedan',
  /href="#fuera" data-movil-ir="fuera"/.test(html)&&/\/fuera-del-radar\/realt/.test(lee('./sitemap.xml')));
prueba('Academy mueve el bloque real de lecciones y cuenta solo el progreso local de la cuenta',
  /id="movilAcademyLecciones"/.test(panelAcademyHTML) &&
  !/class="academia-lecciones"/.test(panelAcademyHTML) &&
  /const leccionesAcademy=document\.querySelector\('\.academia-lecciones'\);/.test(js) &&
  /const movibles=\[\.\.\.ordenMovil,explicador,leccionesAcademy\]\.filter\(Boolean\);/.test(js) &&
  /contenedorAcademy\.appendChild\(leccionesAcademy\)/.test(js) &&
  /const uid=window\.RWADAR_ACCESO\?\.usuario\(\)\?\.id/.test(js) &&
  /localStorage\.getItem\('rwadar\.academy\.v1:'\+uid\)/.test(js));
prueba('Perfil conserva favoritos locales separados por cuenta y explica su alcance',
  /id="perfilEmpresas"[^>]*aria-live="polite"[^>]*hidden/.test(panelPerfilHTML) &&
  /id="perfilOfertas"[^>]*aria-live="polite"[^>]*hidden/.test(panelPerfilHTML) &&
  /const CLAVE='rwadar\.favoritos\.v1'/.test(js) &&
  /const claveCuenta=\(\)=>\{const id=uid\(\);return id\?CLAVE\+':'\+id:null;\}/.test(js) &&
  /localStorage\.setItem\(clave,JSON\.stringify\(datos\)\)/.test(js) &&
  /class="movil-seguida/.test(js) && /escHtml\(p\.n\)/.test(js) &&
  /data-guardar-oferta="'\+escHtml\(o\.slug\)\+'"/.test(js) &&
  /data-movil-action="borrar-guardados"/.test(panelPerfilHTML));
prueba('guardar solo existe en el móvil, donde está Perfil',
  /display\s*:\s*none/i.test(declaracionesCSS(cssBase, '.fav-local').join(';')) &&
  /display\s*:\s*inline-flex/i.test(declaracionesCSS(cssMovil, '.escaparate-guardar.fav-local').join(';')) &&
  /function ir\(destino,origen=null\)\{\s*if\(destino==='explain'\)\{abrirAcademyDesde\(origen\);return;\}\s*cambiar\(['"]buscar['"]/.test(codigoShellMovil));
// Sin fijar frases (decisión de Víctor, 04/11/2026).
prueba('Avisos nunca es una pestaña',
  !/id=["']movilVistaAvisos["']/.test(html) &&
  !botonesNavMovil.some(b => /Avisos/i.test(textoHTML(b[2]))));

prueba('Perfil agrupa cuenta, guardados, avisos y privacidad sin ocultar herramientas',
  /id="movilCuentaAccion"[^>]*disabled/.test(panelPerfilHTML) &&
  /Datos de una cuenta anterior/.test(panelPerfilHTML) &&
  /href=["']\/privacidad["']/.test(panelPerfilHTML) && /href=["']\/privacidad#derechos["']/.test(panelPerfilHTML) &&
  /data-accion=["']descargar-csv["']/.test(panelPerfilHTML) &&
  /no pide datos bancarios, claves de monedero ni frases de recuperación/.test(panelPerfilHTML));

const inicioEmisionesHTML = html.indexOf('<section class="emis wrap" id="emisiones"');
const finEmisionesHTML = html.indexOf('</section>', inicioEmisionesHTML);
const emisionesHTML = inicioEmisionesHTML >= 0 && finEmisionesHTML > inicioEmisionesHTML
  ? html.slice(inicioEmisionesHTML, finEmisionesHTML + 10) : '';
const emisionesFuente = arrayDe(jsCatalogo, 'EMI');
// «Buscar presenta emisiones comprobadas…» fijaba frases: fuera (decisión de Víctor, 04/11/2026).
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
prueba('radar, fichas, comparador, método y descartes quedan en Buscar; el tutorial 3D abre Academy',
  ['radarHero','tool','grid','cmpbar','explain','scene','gl','metodo','fuera']
    .every(id => ids.includes(id)) &&
  /data-ir=["']explain["']/.test(html) &&
  ['metodo','fuera'].every(destino =>
    new RegExp(`data-movil-detalle=["']${destino}["']`).test(html)) &&
  /function ir\(destino,origen=null\)\{\s*if\(destino==='explain'\)\{abrirAcademyDesde\(origen\);return;\}\s*cambiar\(['"]buscar['"]/.test(codigoShellMovil) &&
  /academyLeccion\.appendChild\(explicador\)/.test(js));
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
prueba('el service worker fuente identifica la retirada del modo offline',
  /const VERSION\s*=\s*['"]rwadar-vacceso-obligatorio-20261023['"]/.test(sw));
prueba('el worker elimina copias RWAdar y activa sin navegar ventanas ni abrir cachés ni red',
  await probarRetiradaOffline(sw));
prueba('el ensayo rechaza reintroducir fetch o conservar las copias de RWAdar',
  !(await probarRetiradaOffline(sw + "\nself.addEventListener('fetch',()=>{});")) &&
  !(await probarRetiradaOffline(sw.replace('caches.delete(nombre)', 'Promise.resolve(true)'))));
prueba('la limpieza de RWAdar no puede borrar cachés de otra aplicación',
  !(await probarRetiradaOffline(sw.replace(".filter(nombre => nombre.startsWith('rwadar-v'))", ''))));
prueba('ninguna navegación ni dato de cuenta puede volver por el worker offline',
  !/addEventListener\(\s*['"]fetch['"]|caches\.open\(|cache\.(?:put|addAll|match)\(/.test(sw));
prueba('el catálogo remoto exige vistas V2 y manifiesto completo, sin volver a V1',
  /catalogo_plataformas_publicas_v2\?select=\*/.test(js) &&
  /catalogo_ofertas_publicas_v2\?select=\*/.test(js) &&
  /validarLoteCatalogoRemotoV2\(r,e\)/.test(js) &&
  /nE=e\.map\(o=>ofertaCatalogoRemota\(o,fecha\)\)/.test(js) &&
  /EMI\.length=0;\s+EMI\.push/.test(js) &&
  !/\/radar_publico\?select=\*|\/emisiones_publicas\?select=\*/.test(js));
prueba('el snapshot V2 caducado se conserva con aviso y solo la orden expresa lo retira',
  /function comprobarCatalogoEmbebido\(\)/.test(js) && /\|\|edad<0\)\n\s+throw new Error\('lote embebido fechado en el futuro'\)/.test(js) &&
  !/edad>7/.test(js.slice(js.indexOf('function comprobarCatalogoEmbebido'), js.indexOf('function plataformaDesdeEscaparate'))) &&
  /\/catalogo_publicacion\?select=retirado,motivo/.test(js) &&
  /orden\.retirado===true\)\{\n\s+P\.length=0;EMI\.length=0;CATALOGO_EMBEBIDO_BLOQUEADO=true;CATALOGO_RETIRADO=true/.test(js) &&
  /catch\{refrescarVigenciaOfertas\(\)\}/.test(js));

const recursosCriticos = ['/', '/privacidad', '/transparencia-comercial', '/para-empresas', rutaScriptApp, rutaCatalogo, '/assets/ficha-editorial-20261022.js', rutaAnalitica, estilos[0][1],
  '/assets/privacidad-20260820.css', '/manifest.webmanifest', ...manifest.icons.map(icono => icono.src),
  ...rutasPortada];
const existeRutaArmazon = ruta => {
  if (ruta === '/') return fs.existsSync(path.join(sitio, 'index.html'));
  if (ruta === '/privacidad') return fs.existsSync(path.join(sitio, 'privacidad.html'));
  if (ruta === '/transparencia-comercial') return fs.existsSync(path.join(sitio, 'transparencia-comercial.html'));
  if (ruta === '/para-empresas') return fs.existsSync(path.join(sitio, 'para-empresas.html'));
  return fs.existsSync(path.join(sitio, ...ruta.slice(1).split('/')));
};
prueba('la interfaz crítica sigue existiendo sin precache ni fallback offline',
  recursosCriticos.every(ruta => existeRutaArmazon(ruta)) && !/\bARMAZON\b/.test(sw));
prueba(`las ${N_PLATAFORMAS} portadas siguen disponibles sin quedar guardadas por el worker`,
  rutasPortada.length === N_PLATAFORMAS && rutasPortada.every(existeRutaArmazon) && !/cache\.put\(/.test(sw));
prueba('la PWA es standalone de forma estándar además de declarar compatibilidad Apple',
  manifest.id === '/' && manifest.scope === '/' && manifest.start_url === '/' &&
  manifest.display === 'standalone' && manifest.display_override?.includes('standalone') &&
  /<meta\s+name=["']mobile-web-app-capable["']\s+content=["']yes["']/i.test(html) &&
  /<meta\s+name=["']apple-mobile-web-app-capable["']\s+content=["']yes["']/i.test(html));
const colorTema = (html.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i) || [])[1] || '';
prueba('portada y manifest comparten los colores de arranque para evitar destellos al instalar',
  colorTema.toLowerCase() === manifest.theme_color.toLowerCase() &&
  manifest.background_color.toLowerCase() === manifest.theme_color.toLowerCase());
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
prueba('el worker no instala una ruta alternativa que evite comprobar la sesión en servidor',
  !/respondWith|fetch\(/.test(sw));

const casoRegex = 'function f(c){return /[/*]/.test(c)}';
const casoReducido = sinComentariosJS(casoRegex);
new Function(casoReducido);
prueba('el adelgazador conserva regex con marcas de comentario', casoReducido === casoRegex);
const jsReducido = adelgazarJS(js);
const catalogoReducido = adelgazarJS(jsCatalogo);
new Function(catalogoReducido + "\n" + jsReducido);
new Function(jsReducido);
prueba('el JavaScript adelgazado compila y pesa menos', jsReducido.length < js.length);
for (const nombre of ['P','FUERA','EMI'])
  prueba(`el adelgazado conserva exactamente ${nombre}`, JSON.stringify(arrayDe(jsCatalogo,nombre)) === JSON.stringify(arrayDe(catalogoReducido,nombre)));
const htmlPublicado = fs.readFileSync(path.join(publicado, 'index.html'), 'utf8');
const privacidadPublicada = fs.readFileSync(path.join(publicado, 'privacidad.html'), 'utf8');
const transparenciaComercialPublicada = fs.readFileSync(
  path.join(publicado, 'transparencia-comercial.html'), 'utf8');
const paraEmpresasPublicada = fs.readFileSync(path.join(publicado, 'para-empresas.html'), 'utf8');
const swPublicado = fs.readFileSync(path.join(publicado, 'sw.js'), 'utf8');
/* Limpieza de la web (13/11/2026): lo publicado va sin comentarios HTML, salvo las
   marcas de los generadores, y el JSON-LD (dentro de <script>) se copia tal cual. */
{
  const comentarios = documento => [...documento.matchAll(/<!--([\s\S]*?)-->/g)].map(m => m[1]);
  const jsonLd = documento => [...documento.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const { sinComentariosHTML } = require('./rwadar-adelgazar.js');
  prueba('el HTML publicado va sin comentarios, salvo las marcas de los generadores, con el JSON-LD intacto',
    comentarios(html).length > 20 && comentarios(htmlPublicado).length > 0 &&
    comentarios(htmlPublicado).every(c => /^[a-z][a-z0-9-]*:(?:ini|fin)$/.test(c)) &&
    ['pre:ini', 'pre:fin', 'academy:ini', 'academy:fin'].every(m => comentarios(htmlPublicado).includes(m)) &&
    [privacidadPublicada, transparenciaComercialPublicada, paraEmpresasPublicada].every(d => comentarios(d).length === 0) &&
    JSON.stringify(jsonLd(htmlPublicado)) === JSON.stringify(jsonLd(html)) && jsonLd(html).length > 0 &&
    sinComentariosHTML('<p>a</p>\n  <!-- x -->\n<p title="<!-- t -->">b <!-- y --> c</p><pre><!-- z --></pre>') ===
      '<p>a</p>\n  \n<p title="<!-- t -->">b <!-- y --> c</p><pre><!-- z --></pre>');
}
const scriptsPublicados =[...htmlPublicado.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const recursoJSPublicado = scriptsPublicados.at(-1)?.[1] || '';
const recursoCatalogoPublicado = scriptsPublicados.find(s => /\/catalogo-publico-20261022\./.test(s[1]))?.[1] || '';
const catalogoPublicado = fs.readFileSync(path.join(publicado, '.' + recursoCatalogoPublicado), 'utf8');
const huellaCatalogo = crypto.createHash('sha256').update(catalogoPublicado).digest('hex').slice(0, 12);
prueba('el snapshot publicado único conserva los datos, su huella y el orden antes del comportamiento',
  catalogoPublicado === catalogoReducido &&
  scriptsPublicados.filter(s => /\/catalogo-publico-20261022\./.test(s[1])).length === 1 &&
  recursoCatalogoPublicado === `/assets/catalogo-publico-20261022.${huellaCatalogo}.js` &&
  scriptsPublicados.findIndex(s=>s[1]===recursoCatalogoPublicado) < scriptsPublicados.length-1 &&
  ['P','FUERA','EMI'].every(n=>JSON.stringify(arrayDe(catalogoPublicado,n))===JSON.stringify(arrayDe(jsCatalogo,n))));
const hojasPublicadas = [...new Set(
  [htmlPublicado, privacidadPublicada, transparenciaComercialPublicada, paraEmpresasPublicada].flatMap(documento =>
    [...documento.matchAll(/<link\b([^>]*)>/gi)]
      .filter(link => (atributoHTML(link[1], 'rel') || '').toLowerCase().split(/\s+/).includes('stylesheet'))
      .map(link => atributoHTML(link[1], 'href'))))];
const rutaJSPublicado = path.join(publicado, '.' + recursoJSPublicado);
const jsPublicado = fs.readFileSync(rutaJSPublicado, 'utf8');
const huellaJSIndependiente = crypto.createHash('sha256').update(jsPublicado).digest('hex').slice(0, 12);
prueba('el árbol generado existe y usa el JavaScript adelgazado con huella real',
  fs.existsSync(path.join(publicado,'.well-known','security.txt')) &&
  fs.readFileSync(path.join(publicado,'.well-known','security.txt'),'utf8') === lee('.well-known/security.txt') &&
  jsPublicado === jsReducido &&
  new RegExp(`/assets/rwadar-20260820\\.${huellaJSIndependiente}\\.js$`).test(recursoJSPublicado));
const archivosPublicados = listarArchivosRegulares(publicado);
const assetsPublicados = archivosPublicados.filter(x=>x.startsWith('assets/')&&/\.(css|js)$/.test(x));
const codigoPublicable=ARCHIVOS_PUBLICABLES.filter(x=>x.startsWith('assets/')&&/\.(css|js)$/.test(x));
const portadasPublicadas = archivosPublicados.filter(x=>/^plataformas\/.+\.webp$/.test(x));
prueba('todo JS/CSS desplegable lleva su huella de contenido y no queda el nombre estable',
  assetsPublicados.length === codigoPublicable.length && assetsPublicados.every(x=>/\.[a-f0-9]{12}\.(?:css|js)$/.test(x)) &&
  !codigoPublicable.some(x=>archivosPublicados.includes(x)));
const analiticaPublicada = scriptsPublicados.find(script => /\/analitica-/.test(script[1]))?.[1];
prueba('la analítica se versiona en todas las páginas y el worker no la persiste',
  analiticaPublicada && [htmlPublicado, privacidadPublicada, transparenciaComercialPublicada, paraEmpresasPublicada]
    .every(pagina => pagina.includes(analiticaPublicada)) &&
  !/caches\.open\(|cache\.(?:put|addAll|match)\(|cloudflareinsights/.test(swPublicado));
prueba(`el paquete desplegable incluye las ${N_PLATAFORMAS} portadas y su manifiesto de procedencia`,
  portadasPublicadas.length === entradasPortadas.length &&
  archivosPublicados.includes('plataformas/fuentes.json') &&
  rutasPortada.every(ruta => portadasPublicadas.includes(ruta.slice(1))));
const editorialesPublicadas = archivosPublicados.filter(x=>x.startsWith('ofertas-editoriales/'));
prueba('la salida incluye solo el manifiesto, los cuatro fallback y las ilustraciones por ficha validadas',
  activosEditoriales.fichas.length > 0 &&
  editorialesPublicadas.length === 1 + 4 + activosEditoriales.fichas.length &&
  activosEditoriales.publicables.every((activo) => {
    const destino = path.join(publicado, ...activo.salida.split('/'));
    return editorialesPublicadas.includes(activo.salida) && fs.statSync(destino).size === activo.bytes &&
      crypto.createHash('sha256').update(fs.readFileSync(destino)).digest('hex') === activo.hashSha256;
  }));
{
  const conPropia = [...htmlPublicado.matchAll(
    /<img src="\/ofertas-editoriales\/oferta-([a-z0-9-]+)\.webp" alt="Ilustración editorial[^"]*" data-respaldo="\/ofertas-editoriales\/[a-z-]+-rwadar\.webp"/g)]
    .map(m => m[1]);
  const detalles = new Set([...htmlPublicado.matchAll(/data-oferta-detalle="([a-z0-9-]+)"/g)].map(m => m[1]));
  const esperadas = activosEditoriales.fichas.filter(f => detalles.has(f.slug)).map(f => f.slug);
  prueba('las tarjetas pre-pintadas usan la ilustración de cada ficha, con la de su categoría de respaldo',
    esperadas.length > 0 && JSON.stringify([...new Set(conPropia)].sort()) === JSON.stringify(esperadas.sort()));
}
prueba('HTML conserva sus recursos con huella sin depender de un precache del worker',
  recursoJSPublicado && hojasPublicadas.length === 11 &&
  hojasPublicadas.filter(ruta => /\/secciones-20261110\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/novedades-producto-20261112\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/calculadora-20261111\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/noticias-sector-20261110\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/mapa-buscar-20261027\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/mercado-20261111\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  hojasPublicadas.filter(ruta => /\/academy-candado-20261108\.[a-f0-9]{12}\.css$/.test(ruta)).length === 1 &&
  [recursoJSPublicado, recursoCatalogoPublicado,
    ...scriptsPublicados.map(s=>s[1]), ...hojasPublicadas,
    '/manifest.webmanifest', ...manifest.icons.map(icono => icono.src), ...rutasPortada]
    .every(ruta => fs.existsSync(path.join(publicado, '.' + ruta))) &&
  !/\bARMAZON\b|addEventListener\(\s*['"]fetch['"]/.test(swPublicado));
/* «La tokenización en el mundo» (10/11/2026); desde el 11/11/2026, «Mercado y noticias» al estilo de una app de bolsa. */
{
  const tk = require('./rwadar-movil/lib/tokenizacion.js');
  const mercadoHTML = lee('mercado/index.html');
  const a1 = html.indexOf('<section class="ini-bloque mk mk--inicio nt nt--portada" id="mercado"'), bloque = html.slice(a1, html.indexOf('</section>', a1));
  prueba('«Mercado y noticias» va en Inicio tras «Ofertas» y antes de «Aprende»: la cotización y las noticias, con «Ver mercado y noticias →»; el HTML no trae cifras',
    a1 > html.indexOf('id="relNuevas"') && a1 < html.indexOf('id="iniAprendeTit"') && !html.includes('data-tokenizacion') &&
    bloque.includes('<h2 class="ini-bloque-tit" id="mkTit">Mercado y noticias</h2>') &&
    /data-mercado="inicio" data-noticias="portada"/.test(bloque) && bloque.includes('<ul class="nt-v" id="ntLista" aria-labelledby="ntTit" hidden></ul>') &&
    /<a class="ini-ver" href="\/mercado\/"><span>Ver mercado y noticias<\/span>/.test(bloque) &&
    !/\d/.test(bloque.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '')) &&
    /<script src="\/assets\/mercado-20261111\.js" defer><\/script>/.test(html) && !/tokenizacion-20261110\.(js|css)/.test(html));
  const a2 = mercadoHTML.indexOf('<section class="mk mk--completo" id="tokenizacion"'), seccionMercado = mercadoHTML.slice(a2, mercadoHTML.indexOf('</section>', a2));
  prueba('/mercado/ trae el mercado de activos tokenizados (h1) y, debajo, las noticias relacionadas, sin cifras en el HTML',
    a2 > 0 && seccionMercado.includes('<h1 class="mk-tit" id="mkTit">Mercado de activos tokenizados</h1>') &&
    /data-mercado="completo"/.test(seccionMercado) && !/\d/.test(seccionMercado.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '')) &&
    mercadoHTML.indexOf('id="noticias"') > a2 && /data-noticias="lista" data-noticias-nivel="3"/.test(mercadoHTML) &&
    mercadoHTML.includes('<dialog class="nt-dialogo" id="ntDialogo"') && (mercadoHTML.match(/<h1\b/g) || []).length === 1 &&
    /<script src="\/assets\/mercado-20261111\.js" defer><\/script>/.test(mercadoHTML) && !/tokenizacion-20261110\.(js|css)/.test(mercadoHTML) &&
    /<link rel="canonical" href="https:\/\/rwadar\.pages\.dev\/mercado\/">/.test(mercadoHTML) &&
    /<title>Mercado y noticias · RWAdar<\/title>/.test(mercadoHTML));
  const scriptMercado = lee('assets/mercado-20261111.js');
  prueba('el gráfico de /mercado/ es SVG propio, sin bibliotecas ni estilos en línea, con su tabla, su cruz por teclado y «Datos: CoinGecko»',
    /createElementNS\(SVG/.test(scriptMercado) && /'\/datos\/tokenizacion-serie\.json'/.test(scriptMercado) && /'\/api\/tokenizacion'/.test(scriptMercado) &&
    /role', 'slider'/.test(scriptMercado) && /ArrowLeft/.test(scriptMercado) && /aria-pressed/.test(scriptMercado) && /tablaSerie/.test(scriptMercado) &&
    /modelo\.notaSerie/.test(scriptMercado) && /'CoinGecko'/.test(scriptMercado) && !/innerHTML|setAttribute\('style'|\.style\.[a-z]+\s*=/.test(scriptMercado) &&
    !/https?:\/\/(?!www\.w3\.org)/.test(scriptMercado.replace(/\/\*[\s\S]*?\*\//g, '')));
  const serieSemilla = tk.validarSerie(JSON.parse(lee('datos/tokenizacion-serie.json')));
  const seriePublicada = fs.readFileSync(path.join(publicado, 'datos', 'tokenizacion-serie.json'), 'utf8');
  const conRamaSerie = spawnSync('git', ['cat-file', '-e', 'origin/datos-tokenizacion:tokenizacion-serie.json'], { cwd: raiz }).status === 0;
  prueba('la serie de un año se publica en /datos/tokenizacion-serie.json, validada; sin la rama, la semilla de main',
    tk.serieValida(JSON.parse(seriePublicada)) && (conRamaSerie || seriePublicada === tk.serializarSerie(serieSemilla)) &&
    serieSemilla.puntos.length >= 300 && /serieTokenizacion\(\{ dirSitio: DIR \}\)/.test(publicador));
  /* Las series finas (13/11/2026): /datos/tokenizacion-serie-fina.json, válida y de la misma ejecución que la
     diaria publicada (si no casa, «sin serie fina» y el gráfico usa la diaria). */
  const finaPublicada = JSON.parse(fs.readFileSync(path.join(publicado, 'datos', 'tokenizacion-serie-fina.json'), 'utf8'));
  prueba('las series finas se publican en /datos/tokenizacion-serie-fina.json, validadas y de la misma ejecución que la diaria publicada',
    tk.serieFinaValida(finaPublicada) && finaPublicada.generado === JSON.parse(seriePublicada).generado &&
    Object.entries(finaPublicada.series).every(([clave, x]) => x === null || Object.keys(tk.seriesEnlazadas(JSON.parse(seriePublicada), finaPublicada)).includes(clave)) &&
    /serieFinaTokenizacion\(\{ dirSitio: DIR, diaria: serie\.serie \}\)/.test(publicador));
  /* /noticias/ y /noticias/#<id> llevan a /mercado/, sin romper enlaces. */
  const noticiasHTML = lee('noticias/index.html');
  const paso = lee('assets/noticias-a-mercado-20261111.js');
  prueba('/noticias/ lleva a /mercado/#noticias y /noticias/#<id> a /mercado/#<id>, con refresco y enlace sin JavaScript',
    /<script src="\/assets\/noticias-a-mercado-20261111\.js"><\/script>/.test(noticiasHTML) &&
    /<meta http-equiv="refresh" content="0; url=\/mercado\/#noticias">/.test(noticiasHTML) &&
    /<link rel="canonical" href="https:\/\/rwadar\.pages\.dev\/mercado\/">/.test(noticiasHTML) && /noindex/.test(noticiasHTML) &&
    /href="\/mercado\/#noticias"/.test(noticiasHTML) && /location\.replace\('\/mercado\/' \+ ancla\)/.test(paso) &&
    /\^#\[a-z0-9-\]\{1,80\}\$/.test(paso) && !lee('sitemap.xml').includes('/noticias/'));
  const historicoPublicado = fs.readFileSync(path.join(publicado, 'datos', 'tokenizacion-historico.json'), 'utf8');
  const semillaTk = tk.validarHistorico(JSON.parse(lee('datos/tokenizacion-historico.json')));
  // Sin la variable de publicar.yml, el generador usa origin/datos-tokenizacion si este clon la tiene.
  const conRamaTk = spawnSync('git', ['rev-parse', '--verify', '-q', 'origin/datos-tokenizacion'], { cwd: raiz }).status === 0;
  const publicadoTk = (() => { try { return tk.validarHistorico(JSON.parse(historicoPublicado)); } catch { return null; } })();
  const moduloTk = fs.readFileSync(path.join(raiz, 'rwadar-tokenizacion-historico.js'), 'utf8');
  prueba('el histórico de la tokenización se publica en /datos/, validado; sin la rama, la semilla de main',
    publicadoTk !== null && historicoPublicado === tk.serializarHistorico(publicadoTk) &&
    (conRamaTk ? semillaTk.fotos.every(f => publicadoTk.fotos.some(p => p.fecha === f.fecha))
      : historicoPublicado === tk.serializarHistorico(semillaTk)) &&
    /historicoTokenizacion\(\{ dirSitio: DIR \}\)/.test(publicador) && /se publica solo la semilla/.test(publicador) &&
    /RWADAR_TOKENIZACION_HISTORICO/.test(moduloTk) && /'show', `\$\{REF\}:tokenizacion-historico\.json`/.test(moduloTk));
  const tkPublicados = scriptsPublicados.map(s => s[1]).filter(r => /\/(tokenizacion|mercado)-/.test(r));
  prueba('el motor de la tokenización y «Mercado y noticias» salen con huella, antes del snapshot del catálogo',
    tkPublicados.length === 2 && /^\/assets\/tokenizacion-modelo-20261110\.[a-f0-9]{12}\.js$/.test(tkPublicados[0]) &&
    /^\/assets\/mercado-20261111\.[a-f0-9]{12}\.js$/.test(tkPublicados[1]) &&
    scriptsPublicados.findIndex(s => s[1] === tkPublicados[1]) < scriptsPublicados.findIndex(s => s[1] === recursoCatalogoPublicado));
}
/* «Noticias del sector» en Inicio (10/11/2026). */
{
  const nt = require('./rwadar-movil/lib/noticias-sector.js');
  const inicio = html.indexOf('<section class="nt" id="noticias"');
  const fuente = lee('datos/noticias-v2.json');
  const datosNt = nt.validarNoticias(JSON.parse(fuente));
  // «Mercado y noticias» (11/11/2026): en Inicio, 3 noticias compactas (las pinta el script); las 8 y su detalle, en /mercado/.
  const mercadoNt = lee('mercado/index.html');
  const enLista = mercadoNt.slice(mercadoNt.indexOf('<section class="mk-noticias nt nt--lista"'), mercadoNt.indexOf('</section>', mercadoNt.indexOf('<section class="mk-noticias nt nt--lista"')));
  prueba('las noticias van en Inicio dentro de «Mercado y noticias», tras la cotización, y el HTML no trae ninguna',
    inicio < 0 && html.indexOf('data-noticias="portada"') > html.indexOf('id="relNuevas"') && html.indexOf('id="ntLista"') > html.indexOf('id="mkCuerpo"') &&
    html.indexOf('data-noticias="portada"') < html.indexOf('id="iniAprendeTit"') && !/ntDialogo/.test(panelInicioHTML) &&
    panelInicioHTML.includes('Imágenes ilustrativas generadas con IA, no fotos de la noticia.') &&
    datosNt.noticias.every(n => !html.includes(n.titulo)));
  const scriptNt = lee('assets/noticias-sector-20261110.js');
  prueba('/mercado/ trae la lista y el diálogo del detalle, sin ninguna noticia escrita en el HTML; Inicio enlaza a /mercado/#<id>',
    /data-noticias="lista"/.test(enLista) && enLista.includes('<dialog class="nt-dialogo" id="ntDialogo"') &&
    enLista.includes('<ul class="nt-v" id="ntLista" aria-labelledby="ntTit" hidden></ul>') && datosNt.noticias.every(n => !mercadoNt.includes(n.titulo)) &&
    /\.href = '\/mercado\/#' \+ encodeURIComponent\(n\.id\)/.test(scriptNt) && !/'\/noticias\/#'/.test(scriptNt) && /function metaFuente/.test(scriptNt));
  prueba('/datos/noticias-v2.json se publica tal cual y con la forma que leen la web y la app nuevas, todas con su foto',
    fs.readFileSync(path.join(publicado, 'datos', 'noticias-v2.json'), 'utf8') === fuente && datosNt.noticias.length > 0 &&
    nt.noticiasSinFoto(JSON.parse(fuente)).length === 0 && /noticiasModelo\.validarNoticias/.test(publicador));
  // La app ya instalada (OTA sobre 26664c9) rechaza cualquier campo nuevo: lee /datos/noticias.json sin «imagen».
  const v1 = require('./rwadar-app/noticias/noticias-v1.cjs');
  const publicadoV1 = fs.readFileSync(path.join(publicado, 'datos', 'noticias.json'), 'utf8');
  let v1Acepta = false;
  try { v1Acepta = v1.validarComoAppInstalada(publicadoV1).noticias.length === datosNt.noticias.length; } catch { v1Acepta = false; }
  prueba('/datos/noticias.json se publica sin «imagen» y lo acepta el motor de la app instalada',
    publicadoV1 === v1.derivarV1(fuente) && publicadoV1 === lee('datos/noticias.json') && v1Acepta && !/"imagen"/.test(publicadoV1));
  // Las herramientas de las noticias, aquí y no en test:tools: un cambio en el package.json de la raíz
  // obliga al guardián de la OTA a pedir otro APK (rediseño de Inicio, 10/11/2026).
  for (const args of [['--check', 'rwadar-noticias-editoriales.js'], ['rwadar-noticias-editoriales.js', '--comprobar'],
    ['--check', 'rwadar-app/noticias/noticias-v1.cjs'], ['rwadar-app/noticias/noticias-v1.cjs', '--comprobar'],
    ['rwadar-app/noticias/copiar-modelo-web.cjs', '--comprobar']]) {
    const r = spawnSync(process.execPath, args, { cwd: raiz, encoding: 'utf8' });
    prueba(`node ${args.join(' ')} pasa`, r.status === 0);
  }
  // Las fotos: cada «imagen» tiene su WebP en noticias-editoriales/, con los bytes y el sha256 de fotos.json, y no sobra ninguno.
  // Desde el 14/11/2026, también sus variantes de 480 y 960 (en sus carpetas), ni más ni menos.
  const fotosNt = JSON.parse(fs.readFileSync(path.join(raiz, 'rwadar-editorial-source/noticias/fotos.json'), 'utf8')).fotos;
  const dirFotos = path.join(publicado, 'noticias-editoriales');
  const publicadas = fs.existsSync(dirFotos) ? fs.readdirSync(dirFotos).sort() : [];
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  prueba('las fotos de las noticias se publican en /noticias-editoriales/ tal cual fotos.json, sin que falte ni sobre ninguna',
    publicadas.join('|') === ['480', '960', ...Object.keys(fotosNt).map(k => k + '.webp')].sort().join('|') &&
    nt.clavesFotos(datosNt).every(k => publicadas.includes(k + '.webp')) &&
    Object.entries(fotosNt).every(([k, f]) => {
      const b = fs.readFileSync(path.join(dirFotos, k + '.webp'));
      return b.length === f.bytes && sha(b) === f.sha256;
    }));
  prueba('y sus variantes en /noticias-editoriales/480/ y /960/, tal cual fotos.json, sin que falte ni sobre ninguna',
    ['480', '960'].every(w => {
      const dir = path.join(dirFotos, w);
      const hay = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
      return hay.join('|') === Object.keys(fotosNt).map(k => k + '.webp').sort().join('|') &&
        Object.entries(fotosNt).every(([k, f]) => { const b = fs.readFileSync(path.join(dir, k + '.webp')); return b.length === f.variantes[w].bytes && sha(b) === f.variantes[w].sha256; });
    }));
  /* Noticias que entran por los ojos (14/11/2026): Inicio llega con la portada y dos tarjetas ya
     escritas (solo en el publicado; la fuente sigue vacía), y lo importante del diseño se comprueba
     aquí, sin navegador, para que lo vigile la CI. */
  const portadaNt = require('./rwadar-noticias-portada.js');
  const ulPublicada = (htmlPublicado.match(/<ul class="nt-v" id="ntLista"[^>]*>([\s\S]*?)<\/ul>/) || [])[0] || '';
  const firmaNt = nt.firmaPrepintado(datosNt);
  const lisNt = [...ulPublicada.matchAll(/<li\b[^>]*>/g)].map(m => m[0]);
  const imgsNt = [...ulPublicada.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  const enInicio = datosNt.noticias.slice(0, nt.EN_INICIO);
  prueba('el Inicio publicado trae la portada y dos tarjetas escritas, con la firma de la edición; rwadar-site/index.html, la lista vacía',
    ulPublicada.includes(`data-nt-prepintado="${firmaNt}"`) && !/<ul class="nt-v" id="ntLista"[^>]*\shidden/.test(ulPublicada) &&
    lisNt.length === enInicio.length && lisNt[0] === '<li class="nt-v-portada">' &&
    enInicio.every(n => ulPublicada.includes(`href="/mercado/#${n.id}" data-nt-id="${n.id}"`) && ulPublicada.includes(portadaNt.esc(n.titulo))) &&
    /<p class="nt-estado" id="ntEstado" role="status" hidden>/.test(htmlPublicado) && /<p class="nt-nota" id="ntNota">Imágenes ilustrativas/.test(htmlPublicado) &&
    !html.includes('data-nt-prepintado') && html.includes('<ul class="nt-v" id="ntLista" aria-labelledby="ntTit" hidden></ul>') &&
    !/\sstyle\s*=/.test(ulPublicada) &&
    portadaNt.sinNoticiasInicio(htmlPublicado).includes('<ul class="nt-v" id="ntLista" aria-labelledby="ntTit" hidden></ul>') &&
    /prepararInicioPublicado\(fs\.readFileSync\(inicioTemporal, 'utf8'\), noticias\)/.test(publicador) && !/writeFileSync\(FILE[^;]*prepararInicio/.test(publicador));
  prueba('las fotos de Inicio llevan srcset y sizes del modelo; la portada no es perezosa y las tarjetas sí',
    imgsNt.length === enInicio.length && imgsNt.every((img, i) => {
      const a = nt.atributosFoto(enInicio[i], i === 0 ? 'portada' : nt.papelTarjeta(i, enInicio.length));
      return img.includes(`srcset="${a.srcset}"`) && img.includes(`sizes="${a.sizes}"`) && img.includes(`src="${a.src}"`) &&
        img.includes('decoding="async"') && (i === 0 ? !/\sloading=/.test(img) : img.includes('loading="lazy"'));
    }));
  prueba('el publicador revisa la guía de titulares (revisarEdicion) antes de publicar, con la biblioteca de fotos',
    /noticiasModelo\.revisarEdicion\(JSON\.parse\(textoNoticias\), \{ fotos: fotosNoticias\.fotos\.map\(f => f\.clave\) \}\)/.test(publicador) &&
    /if \(guia\.errores\.length\)/.test(publicador) && nt.revisarEdicion(JSON.parse(fuente), { fotos: Object.keys(fotosNt) }).errores.length === 0);
  // El CSS de la rejilla, leído como texto: el velo, el relleno, nada que recorte un titular, cortes en em y el movimiento.
  const cssNt = lee('assets/noticias-sector-20261110.css');
  const reglasNt = [...cssNt.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), cuerpo: m[2] }));
  const veloNt = [...cssNt.matchAll(/linear-gradient\(180deg,rgba\(var\(--velo\),0\) 0,rgba\(var\(--velo\),\.72\) (\d+)px,rgba\(var\(--velo\),\.92\) 100%\)/g)].map(m => Number(m[1]));
  const rellenoNt = sel => reglasNt.filter(r => r.sel.endsWith(sel)).map(r => Number((r.cuerpo.match(/padding:(\d+)px/) || [])[1])).filter(Boolean);
  // Cada @media con su bloque (llaves emparejadas); los de la rejilla son los que tocan .nt-v, .nt-p o .nt-t.
  const mediasNt = [];
  for (const m of cssNt.matchAll(/@media([^{]*)\{/g)) {
    let n = 1, i = m.index + m[0].length;
    for (; i < cssNt.length && n; i++) n += cssNt[i] === '{' ? 1 : cssNt[i] === '}' ? -1 : 0;
    const cuerpo = cssNt.slice(m.index + m[0].length, i);
    if (/width/.test(m[1]) && /\.nt-(?:v|p|t)\b|\.nt-(?:p|t)-/.test(cuerpo)) mediasNt.push(m[1]);
  }
  prueba('el velo de la portada y de las tarjetas llega a .72 al final de la rampa y a .92 abajo; el texto empieza 8 px por debajo de la rampa',
    veloNt.length === 3 && veloNt[0] === 48 && veloNt[1] === 64 && veloNt[2] === 40 &&
    Math.min(...rellenoNt('.nt-p-txt')) >= 48 + 8 && rellenoNt('.nt-p-txt').includes(72) && rellenoNt('.nt-t-txt').includes(48) &&
    /--velo:11,10,10/.test(cssNt));
  prueba('ningún titular se corta: ni overflow:hidden ni line-clamp en la rejilla (salvo la caja de la foto), y sin silabeo',
    reglasNt.filter(r => /\.nt-(?:v|p|t)\b|\.nt-(?:p|t)-/.test(r.sel)).every(r => !/line-clamp/.test(r.cuerpo) &&
      (!/overflow:hidden/.test(r.cuerpo) || r.sel.split(',').every(x => /-foto$|nt-dlg-arte$/.test(x.trim())))) &&
    /\.nt-p-tit\{[^}]*hyphens:manual/.test(cssNt) && /\.nt-t-tit\{[^}]*hyphens:manual/.test(cssNt));
  prueba('los cortes de la rejilla van en em (con la letra grande, una columna) y la portada crece con el texto',
    mediasNt.length > 0 && mediasNt.every(m => /em\b/.test(m) && !/\dpx/.test(m)) &&
    !/\.nt-p\{[^}]*(?:^|;)height:/.test(cssNt) && /\.nt-p\{[^}]*aspect-ratio:4\/3/.test(cssNt));
  prueba('el zoom de la foto, solo si se puede pasar el ratón y nadie pidió reducir el movimiento',
    reglasNt.filter(r => /(?:^|;)\s*transform:/.test(r.cuerpo)).length === 1 &&
    /@media \(hover:hover\) and \(prefers-reduced-motion:no-preference\)\{\s*\.nt-p-foto img,\.nt-t-foto img\{transition:transform[^}]*\}\s*\.nt-p:hover img,\.nt-t:hover img\{transform:scale\(1\.03\)\}/.test(cssNt));
  prueba('los colores de la píldora de categoría son los del modelo',
    Object.entries(nt.CATEGORIAS).every(([k, c]) => cssNt.includes(`.nt-cat--${k}{color:${c.color}}`)));
  prueba('el JS de las noticias no escribe srcset, sizes ni loading a mano (solo con atributosFoto), y pinta la nota de las fotos',
    /modelo\.atributosFoto\(n, papel\)/.test(scriptNt) && !/\.(?:srcset|sizes|loading)\s*=/.test(scriptNt) &&
    !/setAttribute\('(?:srcset|sizes|loading)'/.test(scriptNt) && !/['"](?:lazy|eager)['"]/.test(scriptNt) &&
    /modelo\.debeRepintar\(\{ prepintado: lista\.dataset\.ntPrepintado, datos, idioma: idioma\(\) \}\)/.test(scriptNt) &&
    panelInicioHTML.includes('Imágenes ilustrativas generadas con IA, no fotos de la noticia.') && !/\.nt-compacta|\.nt-c\b|\.nt-art|\.nt-fila/.test(lee('assets/mercado-20261111.css') + cssNt));
  const ntPublicados = scriptsPublicados.map(s => s[1]).filter(r => /\/noticias-sector-/.test(r));
  prueba('el motor y la sección de las noticias salen con huella, tras la tokenización y antes del snapshot del catálogo',
    ntPublicados.length === 2 && /^\/assets\/noticias-sector-modelo-20261110\.[a-f0-9]{12}\.js$/.test(ntPublicados[0]) &&
    /^\/assets\/noticias-sector-20261110\.[a-f0-9]{12}\.js$/.test(ntPublicados[1]) &&
    scriptsPublicados.findIndex(s => /\/mercado-20261111\./.test(s[1])) < scriptsPublicados.findIndex(s => s[1] === ntPublicados[0]) &&
    scriptsPublicados.findIndex(s => s[1] === ntPublicados[1]) < scriptsPublicados.findIndex(s => s[1] === recursoCatalogoPublicado));
}
/* «Calcula tus números» en Inicio (11/11/2026): que la gente ponga sus números (no sí o sí los 300.000 €). */
{
  const calc = require('./rwadar-movil/lib/calculadora.js');
  const en = require('./rwadar-movil/lib/idioma-en.js');
  const a = html.indexOf('<section class="ini-bloque calc-ini" id="calculadora"'), bloque = html.slice(a, html.indexOf('\n    </section>', a));
  const r = spawnSync(process.execPath, ['rwadar-app/calculadora/copiar-modelo-web.cjs', '--comprobar'], { cwd: raiz, encoding: 'utf8' });
  prueba('el motor de la calculadora de la web es una copia exacta del de la app (node rwadar-app/calculadora/copiar-modelo-web.cjs --comprobar)', r.status === 0);
  const inputs = [...bloque.matchAll(/<input\b[^>]*>/g)].map(m => m[0]);
  const textos = inputs.filter(i => /type="text"/.test(i));
  prueba('«Calcula tus números» va en Inicio entre «Mercado y noticias» y Aprende, con su título y la misma piel de bloque',
    a > html.indexOf('id="ntLista"') && a < html.indexOf('id="iniAprendeTit"') &&
    bloque.includes('<h2 class="ini-bloque-tit" id="ciTit">Calcula tus números</h2>') && /aria-labelledby="ciTit" data-calculadora="inicio"/.test(bloque));
  prueba('campos de escritura libre, cada uno con su <label>, teclado decimal y su error; el ejemplo de partida (1.000 €, 4 %, 5 años), editable y marcado',
    textos.length === 8 && !/type="range"/.test(bloque) &&
    textos.every(i => { const id = (i.match(/id="([^"]+)"/) || [])[1]; return id && bloque.includes(`<label class="ci-etq" for="${id}">`) && /inputmode="(?:decimal|numeric)"/.test(i) &&
      new RegExp(`aria-describedby="[^"]*${id}Error"`).test(i) && bloque.includes(`<p class="ci-error" id="${id}Error" hidden></p>`); }) &&
    /id="ciInversion"[^>]*value="1\.000"/.test(bloque) && /id="ciRentabilidad"[^>]*value="4"/.test(bloque) && /id="ciAnios"[^>]*value="5"/.test(bloque) &&
    /id="ciImpuestos"[^>]*value="19"/.test(bloque) && bloque.includes('<span class="ci-ejemplo" id="ciEjemplo">Ejemplo: cámbialo</span>') &&
    calc.PREDETERMINADOS.inversion === 1000 && calc.PREDETERMINADOS.rentabilidad === 4 && calc.PREDETERMINADOS.anios === 5 && calc.PREDETERMINADOS.impuestos === 19);
  prueba('el resultado va arriba y se anuncia en role="status" (#ciAnuncio, no a cada tecla); «Afinar» y «Ver la cuenta paso a paso» son desplegables; la nota legal se ve',
    bloque.includes('<div class="ci-estado" id="ciEstado">') && bloque.indexOf('id="ciEstado"') < bloque.indexOf('class="ci-datos"') &&
    bloque.includes('<p class="solo-lector" id="ciAnuncio" role="status" aria-live="polite" aria-atomic="true"></p>') &&
    bloque.indexOf('id="ciAnuncio"') < bloque.indexOf('class="ci-datos"') && /relojAnuncio = setTimeout\([\s\S]*?\}, 700\);/.test(lee('assets/calculadora-20261111.js')) &&
    /<details class="ci-afinar" id="ciAfinar">\s*<summary><span>Afinar: comisiones e impuestos<\/span>/.test(bloque) &&
    ['comisionAnual', 'comisionEntrada', 'impuestos', 'valorActivo', 'precioParticipacion'].every(c => bloque.indexOf(`data-ci-campo="${c}"`) > bloque.indexOf('id="ciAfinar"')) &&
    /<details class="ci-cuenta" id="ciCuenta">\s*<summary>Ver la cuenta paso a paso<\/summary>/.test(bloque) &&
    /<fieldset class="ci-modo" aria-describedby="ciModoAyuda">\s*<legend/.test(bloque) &&
    bloque.includes('<p class="ci-ayuda" id="ciModoAyuda">Lo cobro: te lo pagan cada año. Lo reinvierto: se suma a lo que tienes y crece.</p>') && /name="ciModo"[^>]*value="cobrar" checked/.test(bloque) && /name="ciModo"[^>]*value="reinvertir"/.test(bloque) &&
    bloque.includes('<div class="solo-lector"><table id="ciTabla"></table></div>') &&
    html.includes('<p class="ci-legal">Simulación con tus números: no es una previsión ni una oferta. La rentabilidad pasada no garantiza la futura y puedes perder dinero.</p>') &&
    bloque.includes('En España (salvo País Vasco y Navarra), la ganancia del ahorro paga un 19 % hasta 6.000 € al año y más por encima, hasta el 30 %.') &&
    // Los ejemplos vacíos no parecen cifras escritas.
    /id="ciValorActivo"[^>]*value="" placeholder="Ej\.: 300\.000"/.test(bloque) && /id="ciPrecioParticipacion"[^>]*value="" placeholder="Ej\.: 100"/.test(bloque));
  // Las ofertas: nunca escritas a mano; las pinta el script con el catálogo que la web ya carga.
  const datosCat = arrayDe(jsCatalogo, 'EMI');
  const conRent = datosCat.filter(o => o.rentabilidad && o.rentabilidad.mostrada);
  prueba('las rentabilidades de las ofertas no van escritas en el bloque: salen del catálogo que ya carga la web',
    /<div class="ci-ofertas" id="ciOfertas" hidden>/.test(bloque) && conRent.length > 0 &&
    conRent.every(o => !bloque.includes(o.rentabilidad.mostrada) && !bloque.includes(o.slug)) &&
    /if\(typeof RWAdarCalculadoraInicio!=='undefined'&&RWAdarCalculadoraInicio\.ofertas\)RWAdarCalculadoraInicio\.ofertas\(EMI,catalogoSinCifrasLocal\(\)\);/.test(js) &&
    js.indexOf('RWAdarCalculadoraInicio.ofertas(EMI') > js.indexOf('function pintarEmisiones(') && js.indexOf('RWAdarCalculadoraInicio.ofertas(EMI') < js.indexOf('const caja=document.getElementById(\'emiLista\')'));
  const scriptCalc = lee('assets/calculadora-20261111.js');
  prueba('el bloque se dibuja con el motor común, gráfico SVG propio y tabla; sin innerHTML, sin estilos en línea y sin hablar con nadie',
    /globalThis\.RWAdarCalculadoraModelo/.test(scriptCalc) && /createElementNS\(SVG/.test(scriptCalc) && /modelo\.barras\(/.test(scriptCalc) &&
    /modelo\.ofertasConRentabilidad\(/.test(scriptCalc) && /modelo\.pasos\(/.test(scriptCalc) && /'aria-pressed'/.test(scriptCalc) && /caption/.test(scriptCalc) &&
    !/innerHTML|insertAdjacentHTML|setAttribute\('style'|\.style\.[a-z]+\s*=|fetch\(|XMLHttpRequest/.test(scriptCalc.replace(/\/\*[\s\S]*?\*\//g, '')) &&
    !/https?:\/\/(?!www\.w3\.org)/.test(scriptCalc.replace(/\/\*[\s\S]*?\*\//g, '')));
  // El explicador deja de estar atado a 300.000 €: dos campos y la cuenta del motor común.
  prueba('el explicador lleva el valor del activo y el precio de cada trozo (300.000 € y 100 € de partida), recalcula con el motor y enlaza con Inicio',
    /<input id="calcValor" type="text" inputmode="decimal"[^>]*value="300\.000" aria-describedby="calcValorError">/.test(html) &&
    /<input id="calcPrecio" type="text" inputmode="decimal"[^>]*value="100" aria-describedby="calcPrecioError">/.test(html) &&
    html.includes('<label for="calcValor">Valor del activo') && html.includes('<label for="calcPrecio">Precio de cada trozo') &&
    /<a class="calc-ir" id="calcIrInicio" href="\/#calculadora"><span>Calcula con tus números<\/span>/.test(html) &&
    /const M=window\.RWAdarCalculadoraModelo;/.test(js) && /M\.tituloExplicador\(/.test(js) && /M\.calcular\(/.test(js) &&
    !/const VALOR=300000/.test(js) && /'rwadar:tutorial-calculadora'/.test(js) &&
    calc.EJEMPLO_EXPLICADOR.valorActivo === 300000 && calc.EJEMPLO_EXPLICADOR.precioParticipacion === 100 &&
    calc.tituloExplicador(calc.EJEMPLO_EXPLICADOR) === 'Un local de 300.000 €, partido en 3.000 trozos de 100 €');
  // Inglés: cada texto fijo nuevo (el bloque y los campos del explicador) tiene su traducción en el diccionario.
  const explicaNuevo = html.slice(html.indexOf('<div class="calc-mando calc-mando--campo">'), html.indexOf('<div class="calc-total"'));
  const sueltos = [bloque, explicaNuevo, '<p>Mueve las barras, cambia los importes y</p><p>Calcula con tus números</p>'].flatMap(h => [
    ...[...h.replace(/<!--[\s\S]*?-->/g, '').matchAll(/>([^<]+)</g)].map(m => m[1]),
    ...[...h.matchAll(/\s(?:aria-label|placeholder)="([^"]+)"/g)].map(m => m[1])])
    .map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x && /[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(x) && x !== '€');
  const sinIngles = [...new Set(sueltos)].filter(x => !Object.hasOwn(en, x));
  prueba(`cada texto fijo de «Calcula tus números» y del explicador tiene su inglés (sin traducir: ${sinIngles.join(' | ') || 'ninguno'})`, sinIngles.length === 0);
  const calcPublicados = scriptsPublicados.map(s => s[1]).filter(ruta => /\/calculadora-/.test(ruta));
  prueba('el motor y el bloque de la calculadora salen con huella, tras las noticias y antes del snapshot del catálogo',
    calcPublicados.length === 2 && /^\/assets\/calculadora-modelo-20261111\.[a-f0-9]{12}\.js$/.test(calcPublicados[0]) &&
    /^\/assets\/calculadora-20261111\.[a-f0-9]{12}\.js$/.test(calcPublicados[1]) &&
    scriptsPublicados.findIndex(s => /\/noticias-sector-20261110\./.test(s[1])) < scriptsPublicados.findIndex(s => s[1] === calcPublicados[0]) &&
    scriptsPublicados.findIndex(s => s[1] === calcPublicados[1]) < scriptsPublicados.findIndex(s => s[1] === recursoCatalogoPublicado) &&
    ['assets/calculadora-modelo-20261111.js', 'assets/calculadora-20261111.js', 'assets/calculadora-20261111.css'].every(x => ARCHIVOS_PUBLICABLES.includes(x)));
}
prueba('el worker generado conserva la retirada efectiva de cachés y no deja copias offline',
  await probarRetiradaOffline(swPublicado));

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
  /modos\.length !== 1/.test(publicador) &&
  /--local \[--sin-sincronizar\] \| --preview \| --produccion/.test(publicador));
prueba('omitir la sincronización está limitado de forma explícita al modo local',
  /remoto && sinSincronizar/.test(publicador) &&
  publicador.indexOf('remoto && sinSincronizar') < publicador.indexOf('MODO_PRIVADO && remoto'));
prueba('el modo privado bloquea cualquier publicación antes de preparar el artefacto',
  /const MODO_PRIVADO = (?:true|false)/.test(publicador) &&
  /MODO_PRIVADO && remoto/.test(publicador) &&
  publicador.indexOf('MODO_PRIVADO && remoto') < publicador.indexOf('async function main()'));
prueba('Wrangler está fijado a una versión exacta', /WRANGLER_VERSION = '\d+\.\d+\.\d+'/.test(publicador));
// Ejecutar el simulador exacto del generador, sin su sincronización ni escrituras.
// Un mock URL que deja de ser constructor invalida toda la documentación HTTPS.
const inicioSimulador = publicador.indexOf('const capturado = {};');
const finSimulador = publicador.indexOf('/* ---- 3 · comprobar', inicioSimulador);
prueba('el simulador del generador se puede ensayar de forma aislada', inicioSimulador > 0 && finSimulador > inicioSimulador);
const simulacionPublicador = vm.runInNewContext(
  publicador.slice(inicioSimulador, finSimulador) + '\n({capturado, contexto});',
  { vm, script: js, scriptCatalogo: jsCatalogo, URL, console, require }, { timeout: 20000 });
prueba(`el simulador real conserva URL HTTPS, las ${N_PLATAFORMAS} plataformas y las ${N_OFERTAS} referencias documentadas`,
  vm.runInContext("new URL('https://example.test/fuente').protocol", simulacionPublicador.contexto) === 'https:' &&
  (simulacionPublicador.capturado.grid.match(/class="abrir"/g) || []).length === N_PLATAFORMAS &&
  (simulacionPublicador.capturado.emiLista.match(/data-oferta-detalle=/g) || []).length === N_OFERTAS &&
  // Tarjeta sencilla (Víctor, 05/11/2026): sin fechas, recuentos de avisos ni puntos fuertes; esos datos, en la ficha.
  !/<time\b|escaparate-avisos-n|escaparate-puntos|avisos? en la ficha/.test(simulacionPublicador.capturado.emiLista));
// Ejecutar el cliente entero, con un reloj y un DOM persistentes como los de
// una pestaña abierta. No se sustituye la validación ni el render del catálogo.
const fechaLoteEmbebido = jsCatalogo.match(/"verificado_lote_el":"(\d{4}-\d{2}-\d{2})"/)?.[1];
if (!fechaLoteEmbebido) throw new Error('el JavaScript no incrusta verificado_lote_el');
// Las correcciones individuales pueden ser posteriores al lote sin renovarlo.
// El reloj inicial debe alcanzarlas; la validación real sigue rechazando
// fechas posteriores al margen documental del lote y futuros explícitos.
const fechaInicioCatalogo = [fechaLoteEmbebido, ...arrayDe(jsCatalogo,'EMI').flatMap(o=>[o.verificadaEl,o.documentacion?.revisadaEl])]
  .filter(fecha=>/^\d{4}-\d{2}-\d{2}$/.test(fecha||'')).sort().at(-1);
function pestanaCatalogo({ inicio, codigo = js } = {}) {
  const prefijo = publicador.slice(inicioSimulador, publicador.indexOf('vm.createContext(contexto);', inicioSimulador));
  const { contexto, nodo } = vm.runInNewContext(prefijo + '\n({contexto,nodo});', { URL, console, require });
  const nodos = new Map(), escuchas = new Map(), tiempos = [];
  // El reloj inicial alcanza la última corrección individual del snapshot.
  // No modifica la fecha editorial del lote ni los inicios explícitos.
  let instante = Date.parse(inicio ?? `${fechaInicioCatalogo}T12:00:00Z`);
  contexto.Date = class extends Date {
    constructor(...args) { super(...(args.length ? args : [instante])); }
    static now() { return instante; }
  };
  function obtiene(id) {
    if (id === 'gl') return null;
    if (!nodos.has(id)) {
      const el = nodo(id), clases = new Set(), atributos = new Map();
      Object.assign(el, {
        classList: { add(...xs) { xs.forEach(x => clases.add(x)); }, remove(...xs) { xs.forEach(x => clases.delete(x)); },
          contains(x) { return clases.has(x); }, toggle(x, forzar) { const on = forzar ?? !clases.has(x); on ? clases.add(x) : clases.delete(x); return on; } },
        setAttribute(k,v) { atributos.set(k,String(v)); }, getAttribute(k) { return atributos.get(k); },
        removeAttribute(k) { atributos.delete(k); }, hasAttribute(k) { return atributos.has(k); },
        showModal() { el.open = true; }, close() { el.open = false; },
        options: [{value:''}], add(o) { el.options.push(o); }, remove(i) { el.options.splice(i,1); },
        querySelector(s) { return id==='radarLee'&&['.rl-dato','.rl-vacio'].includes(s)?obtiene(id+s):null; },
        addEventListener(evento, fn) { const k=id+':'+evento;if(!escuchas.has(k))escuchas.set(k,[]);escuchas.get(k).push(fn); },
      });
      if(['escaparateBusqueda','escaparateLocalAviso','emiTipoFiltros'].includes(id))el.hidden=true;
      nodos.set(id, el);
    }
    return nodos.get(id);
  }
  contexto.document.getElementById = obtiene;
  contexto.document.body = obtiene('body');
  contexto.document.contains = () => false;
  contexto.document.addEventListener = (evento, fn) => { if (!escuchas.has(evento)) escuchas.set(evento,[]); escuchas.get(evento).push(fn); };
  contexto.Option = function(text, value) { this.text=text; this.value=value; };
  contexto.setTimeout = (fn, demora) => { tiempos.push({fn,demora}); return tiempos.length; };
  contexto.location = {href:'https://rwadar.pages.dev/'};
  contexto.history = {state:null, pushState(state) { this.state=state; }, back() { this.state=null; }};
  // Solo transporte de prueba: las respuestas HTTP siguen siendo las que cada
  // caso configura en contexto.fetch. No se simulan cookies ni credenciales.
  contexto.window.RWADAR_ACCESO = {
    usuario:()=>null,
    async verificar(){throw Object.assign(new Error('Sin sesión en este fixture'),{status:401});},
    async catalogo(tabla,consulta){
      const respuesta = await contexto.fetch('/__pasarela_catalogo_prueba/'+tabla+'?'+consulta);
      if (!respuesta.ok) throw Object.assign(new Error('HTTP '+respuesta.status),{status:respuesta.status});
      return respuesta.json();
    },
  };
  vm.createContext(contexto);
  vm.runInContext(jsCatalogo, contexto);
  vm.runInContext(codigoFichaEditorial, contexto);
  vm.runInContext(codigo, contexto, {timeout:20000});
  return {contexto, obtiene, escuchas, tiempos, reloj(valor) { instante = Date.parse(valor); }};
}
// El servidor aislado devuelve la forma pública normalizada. Las pruebas
// validan el lote completo antes de reemplazar las tres colecciones juntas.
function snapshotLocalV2(contexto) {
  return JSON.parse(vm.runInContext("JSON.stringify({versionEsquema:2,lote:'snapshot-publicable',preparado:false,plataformas:P,descartes:FUERA,ofertas:EMI,fuente:{url:'https://rwadar.pages.dev/',revision:P[0].verificado_lote_el}})", contexto));
}
const cargaSnapshotLocalParaPruebas = js.slice(js.indexOf('async function cargarEscaparateLocal()'),
  js.indexOf('\nasync function alDia()',js.indexOf('async function cargarEscaparateLocal()')))
  .replace('if(!MODO_LOCAL_SEGURO)return false;','');
{
  const p=pestanaCatalogo({codigo:jsPublicado}),c=p.contexto;
  prueba('el JS público reducido activa Buscar sin fixture ni controles locales',
    !p.obtiene('escaparateBusqueda').hidden&&p.obtiene('escaparateLocalAviso').hidden&&p.obtiene('emiTipoFiltros').hidden&&
    vm.runInContext('!MODO_LOCAL_SEGURO&&ESCAPARATE_LOCAL===null&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&FUERA.length==='+N_DESCARTADAS,c)&&
    (p.escuchas.get('emiBuscar:input')||[]).length===1);
  p.obtiene('emiBuscar').value='Klagenfurt';p.escuchas.get('emiBuscar:input')[0]();
  prueba('Buscar público reducido encuentra la ficha de reventa y cambia de colección',
    p.obtiene('emiLista').innerHTML.includes('data-oferta-detalle="local-de-estanco-klagenfurt"')&&
    !p.obtiene('emiLista').innerHTML.includes('data-oferta-detalle="boss-info"')&&
    vm.runInContext("emiColeccion==='secundario'&&emiBusquedaLocal==='Klagenfurt'",c));
  vm.runInContext('activarBusquedaOfertas();activarBusquedaOfertas()',c);
  prueba('reinicializar Buscar público no duplica eventos ni sustituye el catálogo',
    (p.escuchas.get('emiBuscar:input')||[]).length===1&&
    vm.runInContext('P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&FUERA.length==='+N_DESCARTADAS+'&&ESCAPARATE_LOCAL===null',c));
  p.obtiene('emiBuscar').value='';p.escuchas.get('emiBuscar:input')[0]();
  vm.runInContext("emiColeccion='principales'",c);
  p.escuchas.get('emiFiltros:click')[0]({target:{closest:()=>({getAttribute:()=> 'Tesoro y fondos'})}});
  p.obtiene('emiOrden').value='min';p.escuchas.get('emiOrden:change')[0]();
  prueba('filtro y orden públicos reducidos funcionan con el catálogo íntegro sin fixture',
    vm.runInContext("emiCat==='Tesoro y fondos'&&emiOrden==='min'&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&FUERA.length==="+N_DESCARTADAS,c)&&
    p.obtiene('emiLista').innerHTML.includes('data-oferta-detalle="spiko-letras-del-tesoro-euro"')&&
    !p.obtiene('emiLista').innerHTML.includes('data-oferta-detalle="boss-info"'));
  const recarga=pestanaCatalogo({codigo:jsPublicado});
  prueba('una carga nueva del JS público reducido vuelve a activar Buscar sin banner local',
    !recarga.obtiene('escaparateBusqueda').hidden&&recarga.obtiene('escaparateLocalAviso').hidden&&
    (recarga.escuchas.get('emiBuscar:input')||[]).length===1);
}
for(const fallo of ['incompleto','transporte']){
  const p=pestanaCatalogo({codigo:jsPublicado}),c=p.contexto;
  const antes=vm.runInContext('JSON.stringify([P,EMI,FUERA])',c);
  c.fetch=async()=>fallo==='incompleto'?{ok:true,status:200,json:async()=>[]}:{ok:false,status:500};
  const error=await capturaError(vm.runInContext('alDia()',c));
  p.obtiene('emiBuscar').value='Klagenfurt';p.escuchas.get('emiBuscar:input')[0]();
  prueba('el JS público reducido conserva el lote completo y Buscar tras fallo '+fallo,Boolean(error)&&
    antes===vm.runInContext('JSON.stringify([P,EMI,FUERA])',c)&&
    !p.obtiene('escaparateBusqueda').hidden&&p.obtiene('escaparateLocalAviso').hidden&&
    p.obtiene('emiLista').innerHTML.includes('data-oferta-detalle="local-de-estanco-klagenfurt"'));
}
{
  const p=pestanaCatalogo({codigo:jsPublicado}),c=p.contexto,focos=[];
  const boton=(slug,visible=true)=>({dataset:{ofertaDetalle:slug},getClientRects:()=>visible?[{}]:[],focus:opciones=>focos.push({slug,opciones})});
  const slug='spiko-letras-del-tesoro-euro',vivo=boton('origen-vivo'),nuevo=boton(slug);
  const consultaAnterior=c.document.querySelectorAll;
  c.document.querySelectorAll=selector=>selector==='[data-oferta-detalle],[data-perfil-oferta]'
    ?[boton('otra-oferta'),boton(slug,false),nuevo]:consultaAnterior(selector);
  c.document.contains=n=>n===vivo;
  c.dialogoPrueba={rwadarOrigen:boton(slug),getAttribute:()=>slug};
  vm.runInContext('restaurarFocoOfertaLocal(dialogoPrueba)',c);
  prueba('cerrar una ficha pública repintada devuelve foco al botón visible del mismo slug sin desplazar',
    focos.length===1&&focos[0].slug===slug&&focos[0].opciones.preventScroll===true&&c.dialogoPrueba.rwadarOrigen===null);
  c.dialogoPrueba.rwadarOrigen=vivo;
  vm.runInContext('restaurarFocoOfertaLocal(dialogoPrueba)',c);
  prueba('cerrar la ficha mantiene primero el origen vivo aunque exista otro botón del mismo slug',
    focos.length===2&&focos[1].slug==='origen-vivo'&&focos[1].opciones.preventScroll===true);
}
probarFocoAlCerrarFicha({ p: pestanaCatalogo(), prueba });
{
  const p=pestanaCatalogo({codigo:jsPublicado}),c=p.contexto;
  for(const slug of ['backed-finance','franklin-templeton','midas','openeden','superstate']){
    c.slugSupervision=slug;
    // supervisionOferta (la etiqueta de la tarjeta antigua) se quitó el 13/11/2026: la que se ve es la del radar.
    const etiqueta=vm.runInContext('etiquetaVerificacionLocal(P.find(p=>p.slug===slugSupervision).verificacionLocal.licenciaRegistro.estado)',c);
    prueba(slug+' conserva consulta documental sin atribuir aprobación genérica del producto',
      etiqueta==='Consta en el documento del producto'&&!/aprobad|aval|garant/i.test(etiqueta));
  }
  prueba('Spiko conserva el registro de plataforma ante su supervisor sin atribuirlo a un producto',
    vm.runInContext("etiquetaVerificacionLocal(P.find(p=>p.slug==='spiko').verificacionLocal.licenciaRegistro.estado)==='Registro confirmado'",c));
}
{
  const p=pestanaCatalogo();
  const puntos=[...p.obtiene('radarHero').innerHTML.matchAll(/<g class="blip"[^>]*data-x="([\d.]+)" data-y="([\d.]+)"/g)].map(x=>({x:Number(x[1]),y:Number(x[2])}));
  // El círculo de selección mide9+0.6 de trazo; el halo llega a3.4x3.4.
  prueba(`las ${N_PLATAFORMAS} plataformas quedan dentro del radar con punto, anillo y halo de hover/foco completos`,
    puntos.length===N_PLATAFORMAS&&puntos.every(({x,y})=>Math.hypot(x-200,y-200)+11.56+2<=140.1));
  vm.runInContext('renderMatrix(P)',p.contexto);
  prueba('la matriz conserva todas las plataformas y separa el acceso sin comprobar sin asignar permiso histórico',
    (p.obtiene('matrix').innerHTML.match(/data-abrir=/g)||[]).length===N_PLATAFORMAS&&/<th>Sin comprobar<\/th>/.test(p.obtiene('matrix').innerHTML));
  p.contexto.resumenPrueba={minimo:{texto:'No documentado en euros'},accesoEspana:{texto:'Sin comprobar'},salida:{texto:'No documentada'},
    costes:{texto:'Gestión: 0,6 %; Éxito: 0 %',referencias:[
      {etiqueta:'Gestión',valor:'0,6 %',fuente:'https://gestor.example/gestion',fechaConsulta:'2026-10-21',fechaDato:'2026-10-20'},
      {etiqueta:'Éxito',valor:'0 %',fuente:'https://emisor.example/exito',fechaConsulta:'2026-10-22'}]}};
  const costes=vm.runInContext('datosClaveOfertaHtml(resumenPrueba,true)',p.contexto);
  prueba('varios costes mantienen cada fuente y consulta propias sin atribuirlos a un solo origen',
    costes.replace(/<[^>]+>/g,'').includes('Gestión: 0,6 %; Éxito: 0 %')&&costes.includes('https://gestor.example/gestion')&&costes.includes('https://emisor.example/exito')&&
    costes.includes('Consultada el 21/10/2026 · Dato del 20/10/2026')&&costes.includes('Consultada el 22/10/2026'));
}
{
  const p=pestanaCatalogo(), c=p.contexto, llamadas=[];
  c.snapshot=snapshotLocalV2(c);
  vm.runInContext('globalThis.arraysAntes={plataformas:P,ofertas:EMI,descartes:FUERA};',c);
  c.fetch=async(url,opciones)=>{llamadas.push({url,opciones});return {ok:true,json:async()=>
    JSON.parse(JSON.stringify(url.includes('manifest.json')?activosEditoriales.manifiesto:c.snapshot))};};
  const resultado=await vm.runInContext('('+cargaSnapshotLocalParaPruebas+')()',c);
  prueba(`snapshot local V2 muestra las ${N_PLATAFORMAS}/${N_OFERTAS}/${N_DESCARTADAS} y las colecciones de su manifiesto con arrays de identidad conservada`,resultado===true&&
    vm.runInContext("P===arraysAntes.plataformas&&EMI===arraysAntes.ofertas&&FUERA===arraysAntes.descartes&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&FUERA.length==="+N_DESCARTADAS+"&&ESCAPARATE_LOCAL===null&&['principales','secundario','en_camino'].every(k=>EMI.filter(o=>o.coleccion===k).length===EMI[0].colecciones_esperadas[k])",c));
  prueba('snapshot local V2 abre fichas normales y conserva las fechas y metadatos del lote',
    vm.runInContext('Boolean(ofertaDetalleLocalPorSlug(EMI[0].slug))&&P[0].verificacionLocal.verificadoEl===snapshot.fuente.revision&&EMI.every(o=>o.version_esquema===2&&o.revisionId===P[0].revisionId)',c));
  prueba('la carga aislada solo pide snapshot e imágenes editoriales con credenciales omitidas',
    llamadas.length===2&&llamadas.every(x=>['/__rwadar_local/escaparate.json','/ofertas-editoriales/manifest.json'].includes(x.url)&&x.opciones.credentials==='omit'));
}
for(const [nombre,alterar] of [
  ['lote incompleto',d=>d.ofertas.pop()],
  ['slug duplicado',d=>d.ofertas[1].slug=d.ofertas[0].slug],
  ['revisión mezclada',d=>d.ofertas[0].revisionId='00000000-0000-0000-0000-000000000001'],
  ['fecha del manifiesto distinta',d=>d.fuente.revision='2026-01-01'],
  ['fuente con credenciales',d=>d.ofertas[0].fuentesActuales=['https://usuario:clave@example.test/']],
  ['cifra en secundario',d=>d.ofertas.find(o=>o.coleccion==='secundario').precio={mostrada:'100 EUR'}],
  ['descarte sin fuente',d=>d.descartes[0].fuentes=[]],
  ['fecha canónica imposible',d=>d.plataformas[0].ver='2026-02-30'],
]){
  const p=pestanaCatalogo(), c=p.contexto;
  c.snapshot=snapshotLocalV2(c);alterar(c.snapshot);
  const antes=vm.runInContext('JSON.stringify([P,EMI,FUERA])',c);
  c.fetch=async url=>({ok:true,json:async()=>JSON.parse(JSON.stringify(url.includes('manifest.json')?activosEditoriales.manifiesto:c.snapshot))});
  const error=await capturaError(vm.runInContext('('+cargaSnapshotLocalParaPruebas+')()',c));
  prueba('snapshot local V2 rechaza '+nombre+' y conserva íntegra la última copia completa',Boolean(error)&&
    antes===vm.runInContext('JSON.stringify([P,EMI,FUERA])',c));
}
{
  const p=pestanaCatalogo(),c=p.contexto;
  c.snapshot=snapshotLocalV2(c);
  const antes=vm.runInContext('JSON.stringify([P,EMI,FUERA])',c),incompleto=JSON.parse(JSON.stringify(activosEditoriales.manifiesto));incompleto.fichas.pop();
  c.fetch=async url=>({ok:true,json:async()=>url.includes('manifest.json')?incompleto:c.snapshot});
  const error=await capturaError(vm.runInContext('('+cargaSnapshotLocalParaPruebas+')()',c));
  prueba('un manifiesto de imágenes incompleto tampoco sustituye las colecciones anteriores',Boolean(error)&&antes===vm.runInContext('JSON.stringify([P,EMI,FUERA])',c));
  c.snapshot=snapshotLocalV2(c);
  const corte=new Date(Date.parse(`${fechaLoteEmbebido}T00:00:00Z`)+30*864e5).toISOString();p.reloj(corte);
  c.fetch=async url=>({ok:true,json:async()=>url.includes('manifest.json')?activosEditoriales.manifiesto:c.snapshot});
  await vm.runInContext('('+cargaSnapshotLocalParaPruebas+')()',c);
  prueba('un snapshot completo envejecido sigue disponible con aviso y sin cifras vencidas',
    vm.runInContext('P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&CATALOGO_CADUCADO&&!CATALOGO_EMBEBIDO_BLOQUEADO',c)&&/cifras por actualizar/.test(p.obtiene('emiLista').innerHTML));
}
{
  const p=pestanaCatalogo(), c=p.contexto;
  // ESPEC-FINAL §3: sin grupos por proveedor en el móvil; en escritorio siguen.
  const movilSinGrupos=vm.runInContext("tarjetasPorProveedorHtml(EMI.filter(o=>o.coleccion==='principales'))",c);
  prueba('en el móvil las filas van sueltas, sin grupos por proveedor ni su párrafo repetido',
    !/class="ofertas-grupo"/.test(movilSinGrupos) && !/Cada una conserva su fuente/.test(movilSinGrupos) &&
    (movilSinGrupos.match(/data-oferta-detalle=/g)||[]).length===vm.runInContext("EMI.filter(o=>o.coleccion==='principales').length",c));
  vm.runInContext("window.matchMedia=()=>({matches:false})",c);
  const todo=vm.runInContext("tarjetasPorProveedorHtml(EMI.filter(o=>o.coleccion==='principales'))",c);
  const esperado=JSON.parse(vm.runInContext("(()=>{const l=EMI.filter(o=>o.coleccion==='principales'),g={};"+
    "l.forEach(o=>{g[o.plataformaSlug]=(g[o.plataformaSlug]||0)+1});return JSON.stringify({n:l.length,g:Object.values(g).filter(x=>x>1)})})()",c));
  prueba('agrupar proveedores conserva cada referencia individual y el nombre común sin escoger un ticker',
    (todo.match(/data-oferta-detalle=/g)||[]).length===esperado.n&&esperado.g.length>0&&
    esperado.g.every(k=>new RegExp('Ver sus '+k+' ofertas').test(todo))&&
    /<summary><b>[^<]+<\/b>/.test(todo)&&/Cada una tiene su fuente/.test(todo));
  vm.runInContext("emiBusquedaLocal='Klagenfurt'",c);
  const filtrado=vm.runInContext("tarjetasPorProveedorHtml(EMI.filter(o=>o.coleccion==='secundario'&&coincideBusquedaOfertaLocal(o)))",c);
  prueba('una búsqueda exacta recupera fichas individuales sin encerrarlas en la agrupación',
    !/class="ofertas-grupo"/.test(filtrado)&&/data-oferta-detalle=/.test(filtrado));
  vm.runInContext("emiColeccion='principales';pintarEmisiones()",c);
  prueba('buscar una referencia de reventa cambia a su colección y mantiene visible su ficha individual',
    p.obtiene('emiLista').dataset.coleccion==='secundario'&&
    /data-coleccion="secundario" open/.test(p.obtiene('emiLista').innerHTML)&&
    /en reventa$/.test(p.obtiene('movilOfertasEstado').textContent));
}
// ---- Corrección de la versión final (03/11, ESPEC-FINAL §4 y §6) ----
{
  const d=(c,s)=>declaracionesCSS(c,s).join(';'),iw=fs.readFileSync(path.join(raiz,'rwadar-site/assets/idioma-web-20261022.js'),'utf8');
  const {ingles}=require('./rwadar-movil/lib/idioma.js'),p=pestanaCatalogo(),c=p.contexto;
  const r=JSON.parse(vm.runInContext(`(()=>{const s=new Set(),una=()=>EMI.forEach(o=>comprobacionesOferta(o).forEach(k=>{if(!k.deFuente)(k.partes?k.partes.map(x=>x[0]):[k.motivo]).forEach(m=>s.add(m))}));
    const o=EMI.find(x=>x.slug==='robinhood-classic-stock-tokens'),antes=comprobacionesOferta(o).map(x=>x.cumple);una();CATALOGO_CADUCADO=true;una();
    const k=Object.fromEntries(comprobacionesOferta(o).map(x=>[x.id,[x.cumple,x.motivo]]));CATALOGO_CADUCADO=false;return JSON.stringify({m:[...s],antes,k})})()`,c));
  prueba('inglés: se traduce lo que escribe RWAdar; solo transparencia.json va como fuente',
    r.m.length>=8&&r.m.every(m=>ingles(m)!==m)&&!iw.includes("'.escaparate-comprobaciones p'")&&iw.includes("'.escaparate-comprobacion-motivo-fuente'")&&
    !/superficies='[^']*#inicio(?:Seleccion|Recientes)/.test(iw)&&ingles('cnmv.es · fuente de: Se contrata hoy desde España')==='cnmv.es · source for: Can be bought from Spain today'&&
    ingles('Revisada el 03/11/2026; cifras válidas 7 días más.')==='Reviewed on 03/11/2026; figures valid for 7 more days.'&&ingles('· consultada el 03/11/2026')==='· checked on 03/11/2026');
  prueba('caducado: «se contrata hoy» y «mínimo y salida» en ✗, por volver a comprobar',
    r.antes.every(Boolean)&&!r.k.contratable[0]&&/^Pendiente de volver a comprobar: la revisión semanal ha caducado\.$/.test(r.k.contratable[1])&&
    !r.k.minimoSalida[0]&&/por volver a comprobar/.test(r.k.minimoSalida[1])&&!/sin documentar/i.test(r.k.minimoSalida[1])&&!r.k.vigente[0]);
  const n=(s,re)=>Number((s.match(re)||[])[1]),chip=d(cssMovil,'#movilPanelRadar .emis-filtros .f');
  const ic=n(cssMovil,/:is\(\.emis-filtros,\.fichas-f\) \.f::before\{[^}]*inset:-(\d+)px/),est=d(cssMovil,'#emiLista .escaparate-oferta .escaparate-imagen>.escaparate-guardar');
  const ie=n(d(cssMovil,'#emiLista .escaparate-oferta .escaparate-imagen>.escaparate-guardar::before'),/inset:-(\d+)px/),en=d(css,'.escaparate-comprobaciones a');
  prueba('chips, estrella y fuentes con diana de 44 px, sin pisarse ni recortarse',
    n(chip,/min-height:(\d+)px/)-2+2*ic>=44&&n(d(cssMovil,'#movilPanelRadar .emis-filtros'),/gap:(\d+)px/)>=2*ic&&n(est,/(?:^|;)width:(\d+)px/)-2+2*ie>=44&&
    n(est,/top:(\d+)px/)+1>=ie&&n(est,/right:(\d+)px/)+1>=ie&&/min-height:44px/.test(en)&&/display:inline-flex/.test(en));
  const sec=html.slice(html.indexOf('id="emisiones"')),pos=['"emis-cab"','"emis-criterio-orden"','"escaparateBusqueda"','"buscar-vistas"','"emiColecciones"','"emiFiltros"'].map(s=>sec.indexOf(s));
  const fila=s=>n(d(cssMovil,'#movilPanelRadar>.emis>'+s),/grid-row:(\d+)/),cab=d(cssMovil,'.movil-cabecera'),barra=d(cssMovil,'.movil-nav');
  prueba('Buscar: el foco sigue el orden de la vista y la barra fija no lo tapa',
    pos.every((x,i)=>x>0&&(!i||x>pos[i-1]))&&['.emis-cab','.emis-criterio-orden','.escaparate-busqueda','.buscar-vistas'].map(fila).join()==='2,2,3,3'&&
    /scroll-padding-bottom:calc\(var\(--movil-nav-alto\)/.test(cssMovil));
  // GUIA-ACABADOS.md §6: barra en --s0
  prueba('cabecera y barra inferior opacas, sin cristal',
    /background:var\(--noche\)/.test(cab)&&/background:var\(--noche\)/.test(barra)&&!/backdrop-filter/.test(cab+barra));
  vm.runInContext("emiColeccion='principales';emiCat='Tesoro y fondos';emiBusquedaLocal='';pintarEmisiones()",c);
  const filtrada=p.obtiene('emiLista').innerHTML,anuncio=p.obtiene('movilOfertasEstado').textContent;
  vm.runInContext("emiCat='';pintarEmisiones()",c);
  const sin=p.obtiene('emiLista').innerHTML,dt=d(cssMovil,'#emiLista .escaparate-oferta .escaparate-datos-clave dt');
  prueba('al filtrar, el recuento queda a la vista',
    /^\d+ de \d+ principales$/.test(anuncio)&&filtrada.includes('<p class="catalogo-recuento" aria-hidden="true">'+anuncio+'</p>')&&
    !sin.includes('catalogo-recuento')&&!/opacity/.test(d(css,'.emis-colecciones button em')));
  prueba('fila: etiquetas de 12 px, lugar sin cortar y títulos h4 bajo el bloque',
    /font:\d+ \.75rem/.test(dt)&&!/text-transform/.test(dt)&&/flex-wrap:wrap/.test(d(cssMovil,'#emiLista .escaparate-oferta .escaparate-procedencia'))&&
    /flex:none/.test(d(cssMovil,'#emiLista .escaparate-oferta .emi-lugar'))&&/<h3 id="emiSeleccionTit">[\s\S]*?<h4 class="emi-tit"/.test(sin)&&
    !/<h3 class="emi-tit"/.test(sin.slice(0,sin.indexOf('catalogo-referencias'))));
  // 21/11/2026: la franja de 16 px que esconde el «·» del primer dato se recorta, así que un
  // mínimo largo que baja de línea («Desde 100 € · suscripción desde el 25/11», a 390 px)
  // perdía sus primeras letras. Cada dato lleva sangría francesa (en escritorio y en el
  // móvil, que anula el relleno) y el «·» no la hereda.
  const cssLimpio=css.replace(/\/\*[\s\S]*?\*\//g,''),datoLinea=d(cssLimpio,'.escaparate-datos-linea>div'),
    datoMovil=d(cssMovil,'#emiLista .escaparate-oferta .escaparate-datos-clave>div'),punto=d(cssLimpio,'.escaparate-datos-linea>div::before');
  prueba('tarjeta: un mínimo de dos líneas no pierde letras bajo la franja recortada del «·»',
    /\.escaparate-oferta :is\(\.escaparate-procedencia,\.escaparate-datos-linea\)\{clip-path:inset\(0 0 0 16px\)\}/.test(cssLimpio)&&
    /padding-left:16px/.test(datoLinea)&&/text-indent:-16px/.test(datoLinea)&&
    /padding:0 0 0 16px/.test(datoMovil)&&/text-indent:-16px/.test(datoMovil)&&/text-indent:0/.test(punto));
  // Revisión de la tarjeta sencilla (05/11/2026): lo patrocinado no lleva el verde
  // de «Nueva» ni de la acción; «No disponible en España», en rojo como en la app;
  // en escritorio, sin hueco bajo los títulos cortos y con la línea de datos al pie.
  const patrocinada=['.escaparate-patrocinada','.escaparate-oferta .escaparate-marcas>.escaparate-patrocinada'].map(x=>d(css,x)).join(';')+';'+
    d(cssMovil,'#emiLista .escaparate-oferta .escaparate-marcas>.escaparate-patrocinada');
  prueba('tarjeta: «Patrocinada» en gris neutro, «Nueva» en verde y «No disponible en España» en rojo',
    /color:var\(--tx(?:-2)?\)/.test(patrocinada)&&!/senal/.test(patrocinada)&&/color:var\(--senal\)/.test(d(css,'.escaparate-oferta .escaparate-marcas>span'))&&
    /color:var\(--alarma\)/.test(d(css,'.escaparate-no-disponible')));
  const cssSinNotas=css.replace(/\/\*[\s\S]*?\*\//g,''),cuerpoEsc=d(cssSinNotas,'.escaparate-oferta .escaparate-cuerpo');
  prueba('escritorio: sin hueco bajo los títulos cortos y la línea Mínimo · España al pie de la tarjeta',
    /min-height:0/.test(d(css,'.escaparate-oferta .escaparate-cuerpo .emi-tit'))&&/grid-template-rows:auto auto 1fr auto auto/.test(cuerpoEsc)&&
    /"tit tit" "proc proc" "datos ver"/.test(cuerpoEsc)&&!/align-content:start/.test(cuerpoEsc)&&/align-self:end/.test(d(css,'.escaparate-oferta .escaparate-datos-linea'))&&
    /align-self:stretch/.test(d(cssSinNotas,'.emis-rejilla .escaparate-oferta')));
}
// ---- Versión final de Inicio y Buscar (ESPEC-FINAL, 03/11/2026) ----
{
  const p=pestanaCatalogo(),c=p.contexto;
  const texto=h=>String(h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  const transparencia=JSON.parse(fs.readFileSync(path.join(raiz,'rwadar-editorial-source','ofertas','transparencia.json'),'utf8'));
  const {resumenOferta}=require('./rwadar-site/assets/ficha-editorial-20261022.js');
  const ahora=new Date(vm.runInContext('Date.now()',c));
  const emi=JSON.parse(vm.runInContext('JSON.stringify(EMI)',c)),plataformas=JSON.parse(vm.runInContext('JSON.stringify(P)',c));
  // Cálculo independiente de las cinco comprobaciones, a partir del JSON y del catálogo.
  const cinco=o=>{const t=transparencia.ofertas[o.slug],r=resumenOferta(o,plataformas,ahora);
    return !!t&&t.verificadaEl===o.verificadaEl&&o.coleccion==='principales'&&o.disponibleEs===true&&
      t.supervisada.cumple===true&&t.documentoEspana.cumple===true&&
      (Number.isFinite(r.minimo.euros)||!!r.minimo.unidadDocumentada)&&!['Salida no documentada','Salida por volver a comprobar'].includes(r.salida.texto)&&
      o.estadoRevision==='actual'&&!r.vencida;};
  const esperadas=emi.filter(cinco).map(o=>o.slug).sort();
  vm.runInContext("huellaInicio='';emiColeccion='principales';emiCat='';emiBusquedaLocal='';pintarEmisiones()",c);
  // Desde el rediseño de Inicio (10/11/2026) la Selección va en el carrusel «Ofertas», con «Pasa las 5 comprobaciones».
  const tarjetasInicio=p.obtiene('relNuevasLista').innerHTML.split('<li class="rel-tarjeta').slice(1);
  const inicioSel=tarjetasInicio.filter(t=>/Pasa las 5 comprobaciones/.test(t)).map(t=>(t.match(/data-perfil-oferta="([^"]+)"/)||[])[1]).sort();
  const lista=p.obtiene('emiLista').innerHTML;
  const bloqueSel=lista.slice(lista.indexOf('catalogo-seleccion'),lista.indexOf('emiRestoTit'));
  const buscarSel=[...bloqueSel.matchAll(/data-oferta-detalle="([^"]+)"/g)].map(m=>m[1]).sort();
  // Sin fijar la redacción de los avisos (decisión de Víctor, 04/11/2026).
  prueba('la Selección son las ofertas con las 5 comprobaciones, en el carrusel de Inicio y en Principales',
    esperadas.length>0&&JSON.stringify(inicioSel)===JSON.stringify(esperadas)&&JSON.stringify(buscarSel)===JSON.stringify(esperadas)&&
    p.obtiene('relEscaparate').hidden===false&&lista.indexOf('catalogo-seleccion')<lista.indexOf('emiRestoTit'));
  const criterios=p.obtiene('inicioCriterios').innerHTML;
  // ESPEC-INICIO §2.8: las 5 comprobaciones van abiertas y en llano, en el orden del archivo.
  // Rediseño del 10/11/2026: sin superlativo («las mejor documentadas»); la tarjeta dice «Pasa las 5
  // comprobaciones» y, justo debajo del carrusel, «¿Qué son las 5 comprobaciones?» las enseña con su aviso.
  prueba('Inicio enseña las 5 comprobaciones bajo las ofertas, en llano y en el orden de transparencia.json',
    (criterios.match(/<li>/g)||[]).length===5&&transparencia.criterios.every((k,i)=>vm.runInContext('CRITERIOS_INICIO',c)[k.id]===(criterios.match(/<li>([^<]+)<\/li>/g)||[])[i]?.slice(4,-5))&&
    /<details class="ini-cinco" id="relEscaparate">\s*<summary>¿Qué son las 5 comprobaciones\?<\/summary>\s*<ol class="rel-cinco" id="inicioCriterios"/.test(html)&&
    !/mejor documentadas/.test(panelInicioHTML));
  // Falla cerrado: con otra verificadaEl la oferta pierde sus puntos fuertes y sale de la Selección.
  const sacada=esperadas[0];
  const cerrado=vm.runInContext(`(()=>{const e=TRANSPARENCIA_POR_SLUG['${sacada}'],antes=e.verificadaEl;e.verificadaEl='2000-01-01';
    const o=EMI.find(x=>x.slug==='${sacada}');const r={sel:enSeleccionOferta(o),puntos:puntosFuertesOferta(o).length,tarjeta:tarjetaOfertaLocal(o)};
    e.verificadaEl=antes;return r;})()`,c);
  prueba('sin una entrada de transparencia con la misma verificadaEl no hay puntos fuertes ni Selección',
    cerrado.sel===false&&cerrado.puntos===0&&!/escaparate-puntos/.test(cerrado.tarjeta)&&
    vm.runInContext(`enSeleccionOferta(EMI.find(x=>x.slug==='${sacada}'))`,c)===true);
  // Tarjeta sencilla (Víctor, 05/11/2026): una línea con Mínimo y España; la Salida, en la ficha.
  const fila=vm.runInContext(`tarjetaOfertaLocal(EMI.find(x=>x.slug==='${sacada}'))`,c);
  const datos=[...fila.matchAll(/<div><dt>([^<]+)<\/dt><dd>([^<]+)<\/dd><\/div>/g)].map(m=>[m[1],m[2]]);
  const ocultaDatos=[...cssMovil.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/escaparate-datos-clave/.test(m[1])&&/display\s*:\s*none/.test(m[2]));
  prueba('la tarjeta enseña solo Mínimo y España, en corto, y no esconde ninguno',
    JSON.stringify(datos)===JSON.stringify([['Mínimo',transparencia.ofertas[sacada].minimoCorto],['España','Sí']])&&ocultaDatos.length===0&&
    /title="[^"]+"/.test((fila.match(/<h3 class="emi-tit"[^>]*>/)||[''])[0]));
  probarTarjetaYComparador({ c, prueba });
  await probarTarjetaEnIngles({ c, prueba });
  // El aviso crítico nunca se resume ni se esconde en el móvil.
  const conBloqueo=vm.runInContext(`tarjetaOfertaLocal({...EMI.find(x=>x.slug==='${sacada}'),avisos:[{tono:'stop',texto:'AVISO_CRITICO_ENTERO_EN_LA_FILA'},{tono:'warn',texto:'Otro aviso.'}]})`,c);
  const reglasAviso=[...cssMovil.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/escaparate-aviso/.test(m[1]));
  prueba('.escaparate-aviso-bloqueo nunca se oculta en el móvil y va entero en la fila',
    texto((conBloqueo.match(/<p class="escaparate-aviso-compacto escaparate-aviso-bloqueo">[\s\S]*?<\/p>/)||[''])[0]).trim()==='Importante · AVISO_CRITICO_ENTERO_EN_LA_FILA'&&
    !/Otro aviso|en la ficha/.test(conBloqueo)&&reglasAviso.length>0&&
    reglasAviso.every(m=>!/display\s*:\s*none|visibility\s*:\s*hidden|line-clamp|overflow\s*:\s*hidden/.test(m[2])||
      m[1].split(',').every(sel=>!/escaparate-aviso/.test(sel)||/:not\(\.escaparate-aviso-bloqueo\)/.test(sel))));
  // Encima de la lista, una sola línea pequeña; la Selección ya no repite la frase.
  prueba('una sola línea pequeña encima de la lista: no es una recomendación · RWAdar no recibe dinero',
    (lista.match(/No es una recomendación de inversión/g)||[]).length===1&&/<h3 id="emiSeleccionTit">.*?<\/h3><\/header>/.test(lista)&&
    lista.includes('<p class="catalogo-nota-movil">No es una recomendación de inversión · RWAdar no recibe dinero de las inversiones.</p>'));
  // Inicio sale del catálogo y sin cifras cuando caduca (ESPEC-INICIO §2 y §2.10).
  const cifras=p.obtiene('inicioCifras').innerHTML,ci=JSON.parse(vm.runInContext('JSON.stringify(cifrasInicio())',c));
  const n=JSON.parse(vm.runInContext('JSON.stringify([EMI.length,P.length,FUERA.length])',c)),pl=(t,en)=>vm.runInContext(`plantillaInicio(${JSON.stringify(t)},cifrasInicio(),${en})`,c);
  const htmlInicio=panelInicioHTML.replace(/<!--noticias:ini-->[\s\S]*<!--noticias:fin-->/,'');
  const minimos=emi.filter(o=>['1 €','1 USD'].includes(transparencia.ofertas[o.slug]?.minimoCorto));
  prueba('Inicio calcula sus cifras, mínimos y vigencia del catálogo, sin números escritos en el HTML',
    // El rótulo antes que el valor, en el orden en que se ve (WCAG 1.3.2), y la fecha en <time datetime>.
    cifras.includes('<span>ofertas</span> <b>'+n[0]+'</b>')&&cifras.includes('<span>plataformas</span> <b>'+n[1]+'</b>')&&
    (cifras.match(/<li /g)||[]).length===3&&/<span>revisado el<\/span> <b><time datetime="\d{4}-\d\d-\d\d">/.test(cifras)&&!/descartadas/.test(cifras)&&ci.minimos===minimos.length&&ci.usd===minimos.filter(o=>/USD/.test(transparencia.ofertas[o.slug].minimoCorto)).length&&
    pl('Ver las {ofertas} ofertas',false)==='Ver las '+n[0]+' ofertas'&&pl('See the {plataformas} platforms',true)==='See the '+n[1]+' platforms'&&
    /^Catálogo revisado el \d\d\/\d\d\/\d{4}\. Próxima revisión: \d\d\/\d\d\/\d{4}\.$/.test(pl('Catálogo revisado el {revisado}. Próxima revisión: {hasta}.',false))&&
    // Las frases con cifra ya no viven en Inicio: la cifra de ofertas sale una sola vez, en las cifras.
    !/data-rel-plantilla="/.test(htmlInicio)&&
    /<ul class="ini-cifras" id="inicioCifras" aria-label="El catálogo en cifras"><\/ul>/.test(htmlInicio)&&
    !new RegExp(`\\b(?:${n.join('|')}) (?:ofertas|plataformas|descartadas)\\b`).test(texto(htmlInicio)));
  // /aprende/ publicada lleva en <main> las mismas cifras que calcula Inicio (mínimos, ofertas y vigencia).
  const mainAprende=(fs.readFileSync(path.join(publicado,'aprende','index.html'),'utf8').match(/<main id="contenido"[^>]*>/)||[''])[0];
  prueba('/aprende/ publicada lleva las cifras del catálogo de Inicio para los mínimos del 04 y la vigencia del 06',
    ci.minimos>0&&mainAprende===`<main id="contenido" class="sec-aprende inicio-cuerpo rel" data-catalogo-ofertas="${ci.ofertas}" data-catalogo-minimos="${ci.minimos}" data-catalogo-usd="${ci.usd}" data-catalogo-revisado="${ci.revisado}" data-catalogo-hasta="${ci.hasta}">`);
  vm.runInContext("CATALOGO_CADUCADO=true;huellaInicio='';pintarInicio()",c);
  const sinCifras=['inicioCifras','inicioRadar','relNuevasLista','inicioRadarLista'].map(id=>p.obtiene(id).innerHTML);
  // La leyenda del radar (13/11/2026) se queda con los seis nombres, sin números.
  prueba('con el catálogo caducado Inicio no enseña cifras ni ofertas y la línea de riesgo se queda',
    !/<b>\d+<\/b>/.test(sinCifras[0])&&/Revisión pendiente/.test(sinCifras[0])&&!/ir-et-n/.test(sinCifras[1])&&!sinCifras[2]&&
    (sinCifras[3].match(/<li class="ir-ley">/g)||[]).length===6&&!/ir-ley-n"|solo-lector|plataforma/.test(sinCifras[3])&&
    !/\d<\/span>/.test(sinCifras[3])&&p.obtiene('inicioRadarLista').hidden===false&&
    ['relEscaparate','relNuevas'].every(id=>p.obtiene(id).hidden===true)&&pl('Ver las {ofertas} ofertas',false)===null&&
    /Invertir tiene riesgos/.test(panelInicioHTML));
  // Sin cifras, cada frase vuelve a su texto en castellano del HTML (data-rel-sin), no al que hubiera en pantalla
  // (si la web arrancó en inglés, ese texto ya estaba traducido y se quedaba en inglés al pasar a castellano).
  const conPlantilla=[...htmlInicio.matchAll(/<[^>]*\sdata-rel-plantilla="[^>]*>/g)].map(m=>m[0]);
  // Desde el rediseño (10/11/2026) Inicio no lleva frases con plantilla (la cifra sale una vez, en las cifras);
  // el mecanismo se queda para la que vuelva, y cualquiera necesita su data-rel-sin.
  prueba('sin cifras, las frases con plantilla vuelven a su texto en castellano y el idioma lo traduce',
    conPlantilla.every(t=>/\sdata-rel-sin="/.test(t))&&/\?\?el\.getAttribute\('data-rel-sin'\)/.test(js)&&!/relInicial/.test(js));
  vm.runInContext("CATALOGO_CADUCADO=false;huellaInicio='';pintarInicio()",c);
  // Inicio, «Ofertas» (21/11/2026, orden de Víctor): las de Principales por fecha de alta, de la más nueva a la más antigua y 6 como
  // mucho; a igual fecha, primero las que pasan las 5 comprobaciones y después por proveedor y título. Sin huecos guardados.
  const altaIni=o=>transparencia.ofertas[o.slug]?.anadidaEl||'';
  const enSelIni=new Set(JSON.parse(vm.runInContext("JSON.stringify(cifrasInicio().seleccion.map(o=>o.slug))",c)));
  const espInicio=()=>emi.filter(o=>o.coleccion==='principales').sort((a,b)=>altaIni(b).localeCompare(altaIni(a))||(enSelIni.has(b.slug)?1:0)-(enSelIni.has(a.slug)?1:0)||
    a.plataformaNombre.localeCompare(b.plataformaNombre,'es')||a.titulo.localeCompare(b.titulo,'es')).slice(0,6).map(o=>o.slug);
  const destacadas=JSON.parse(vm.runInContext("JSON.stringify(ofertasInicio(cifrasInicio()).map(o=>o.slug))",c)),carrusel=()=>[...p.obtiene('relNuevasLista').innerHTML.matchAll(/data-perfil-oferta="([^"]+)"/g)].map(m=>m[1]);
  const conAltas=carrusel(),oculto=p.obtiene('relNuevas').hidden,espHoy=espInicio();
  vm.runInContext("var _a=Object.values(TRANSPARENCIA_POR_SLUG).map(e=>[e,e.anadidaEl]);_a.forEach(([e])=>e.anadidaEl='2000-01-01');huellaInicio='';pintarInicio()",c);
  for(const e of Object.values(transparencia.ofertas))e._f=e.anadidaEl,e.anadidaEl='2000-01-01';
  const sinAltas=[carrusel(),p.obtiene('relNuevas').hidden],espSin=espInicio();
  for(const e of Object.values(transparencia.ofertas))e.anadidaEl=e._f,delete e._f;
  vm.runInContext("_a.forEach(([e,f])=>e.anadidaEl=f);huellaInicio='';pintarInicio()",c);
  prueba('Inicio: «Ofertas» pone las de Principales de la más nueva a la más antigua (a igual fecha, la Selección primero), sin duplicados y 6 como mucho',
    JSON.stringify(conAltas)===JSON.stringify(destacadas)&&JSON.stringify(conAltas)===JSON.stringify(espHoy)&&conAltas.length<=6&&
    new Set(conAltas).size===conAltas.length&&oculto===!conAltas.length&&
    // Todas con la misma fecha: primero las de la Selección.
    JSON.stringify(sinAltas[0])===JSON.stringify(espSin)&&sinAltas[0].slice(0,Math.min(6,enSelIni.size)).every(x=>enSelIni.has(x))&&!sinAltas[1]&&
    /id="relPortada"[\s\S]*id="relNuevas"[\s\S]*id="mercado"/.test(panelInicioHTML));
  // 21/11/2026, orden de Víctor («lo que más actualizado esté, si la documentación la hemos actualizado o hemos añadido
  // la ficha»): cada tarjeta de Inicio lleva su fecha más reciente: «Añadida el» (alta), «Verificada el» (catálogo, solo
  // si la revisión pudo verificarla) o «Actualizada el» (documentación); a igual fecha, en ese orden.
  {
    const fechas=[...p.obtiene('relNuevasLista').innerHTML.matchAll(/<p class="rel-nueva-fecha"><span>([^<]+)<\/span> <time datetime="([^"]+)">([^<]+)<\/time><\/p>/g)].map(m=>[m[1],m[2],m[3]]);
    // Lo esperado, con los datos de cada oferta (con el catálogo del 20/11, las seis salen «Verificada el 20/11/2026»).
    const esperadas=conAltas.map(slug=>{const o=emi.find(x=>x.slug===slug);let m=null;
      for(const [e,f] of [['Añadida el',altaIni(o)],['Verificada el',o.estadoRevision==='actual'?o.verificadaEl:''],['Actualizada el',o.documentacion?.revisadaEl||'']])
        if(f&&(!m||f>m[1]))m=[e,f];
      return m;});
    const base=emi.find(x=>x.slug===conAltas[0]);
    // D: la fecha de revisión de su documentación (la del catálogo); antes10: diez días antes.
    const D=base.documentacion?.revisadaEl||base.verificadaEl,antes10=new Date(Date.parse(D+'T00:00:00Z')-10*86400000).toISOString().slice(0,10);
    const caso=(alta,verificadaEl,{estado='actual',doc=null}={})=>JSON.parse(vm.runInContext(`(()=>{const e=TRANSPARENCIA_POR_SLUG['${conAltas[0]}'],f=e.anadidaEl;e.anadidaEl='${alta}';
      const o={slug:'${conAltas[0]}',verificadaEl:'${verificadaEl}',estadoRevision:'${estado}',documentacion:${doc?`{...${JSON.stringify(base.documentacion)},revisadaEl:'${doc}'}`:'null'}};
      const r=fechaTarjetaInicio(o);e.anadidaEl=f;return JSON.stringify(r)})()`,c));
    const es=(r,etiqueta,fecha)=>JSON.stringify(r)===JSON.stringify({etiqueta,fecha});
    prueba('Inicio: cada tarjeta pone su fecha más reciente, «Añadida», «Verificada» (solo si se pudo verificar) o «Actualizada» (la del 03/11 ya no sale como «Añadida»)',
      fechas.length===conAltas.length&&fechas.length>0&&esperadas.every(Boolean)&&base.documentacion&&
      // Ninguna tarjeta pone «Añadida» si después se verificó o se actualizó.
      conAltas.every((slug,i)=>{const o=emi.find(x=>x.slug===slug);return fechas[i][0]!=='Añadida el'||fechas[i][1]>=o.verificadaEl||o.estadoRevision!=='actual';})&&
      JSON.stringify(fechas.map(([e,f])=>[e,f]))===JSON.stringify(esperadas)&&fechas.every(([,f,v])=>v===vm.runInContext(`fechaES('${f}')`,c))&&
      // Las fechas, relativas a la documentación de la ficha que se usa (D): la prueba vale con cualquier catálogo.
      es(caso('2026-11-03',D),'Verificada el',D)&&
      es(caso(D,D),'Añadida el',D)&&
      es(caso('2026-11-03','2999-01-01'),'Añadida el','2026-11-03')&&
      // Fuentes en conflicto o no verificable: nunca «Verificada»; con documentación del día, «Actualizada».
      es(caso('2026-11-03',D,{estado:'fuentes_en_conflicto'}),'Añadida el','2026-11-03')&&
      es(caso('2026-11-03',D,{estado:'no_verificable',doc:D}),'Actualizada el',D)&&
      // Documentación más reciente que la verificación: «Actualizada»; a igual fecha, «Verificada»; futura, no cuenta.
      es(caso('2026-11-03',antes10,{doc:D}),'Actualizada el',D)&&
      es(caso('2026-11-03',D,{doc:D}),'Verificada el',D)&&
      es(caso('2026-11-03',antes10,{doc:'2999-01-01'}),'Verificada el',antes10)&&
      vm.runInContext("(()=>{CATALOGO_CADUCADO=true;const r=fechaTarjetaInicio({slug:'x',verificadaEl:'2026-11-20'});CATALOGO_CADUCADO=false;return r})()",c)===null&&
      /"Verificada el": "Verified on"/.test(lee('assets/idioma-en-20261022.js'))&&/"Actualizada el": "Updated on"/.test(lee('assets/idioma-en-20261022.js')));
  }
  // La prueba de notas «x/5» y la del título exacto fijaban redacción: fuera (decisión de Víctor, 04/11/2026).
  vm.runInContext(`abrirDetalleOfertaLocal('${sacada}')`,c);
  const detalle=p.obtiene('escaparateDetalleLocal').innerHTML;
  prueba('la ficha enseña los cinco criterios con su motivo y su fuente',
    (detalle.match(/<li class="(?:cumple|no-cumple)">/g)||[]).length===5&&
    transparencia.criterios.every(k=>detalle.includes('<b>'+k.texto))&&
    detalle.includes(transparencia.ofertas[sacada].supervisada.fuente.url.replace(/&/g,'&amp;'))&&
    [...detalle.matchAll(/<a\b([^>]*)>/g)].every(m=>/^\/ofertas\//.test(atributoHTML(m[1],'href')||'')||
      atributoHTML(m[1],'target')==='_blank'&&/\bnoopener\b/.test(atributoHTML(m[1],'rel')||'')));
  // Ninguna etiqueta encima de las imágenes y la línea de honestidad a la vista.
  const cajasFila=[...lista.matchAll(/<div class="escaparate-imagen">([\s\S]*?)<\/div>/g)].map(m=>m[1]);
  const cajasInicio=[...p.obtiene('relNuevasLista').innerHTML.matchAll(/<div class="rel-tarjeta-img">([\s\S]*?)<\/div>/g)].map(m=>m[1]);
  const cajaDetalle=(detalle.match(/<div class="escaparate-dialogo-imagen">([\s\S]*?)<\/div>/)||['',''])[1];
  prueba('ninguna etiqueta encima de las imágenes y la línea «Imágenes ilustrativas…» presente',
    cajasFila.length>0&&cajasFila.every(h=>/^<img [^>]*alt="Ilustración editorial[^"]*"[^>]*>(?:<button [^>]*data-guardar-oferta[^>]*>[^<]*<\/button>)?$/.test(h))&&
    cajasInicio.length>0&&cajasInicio.every(h=>/^<img [^>]*alt="Ilustración editorial[^"]*"[^>]*loading="lazy" decoding="async"[^>]*>$/.test(h))&&
    /^<img [^>]*alt="Ilustración editorial[^"]*"[^>]*>$/.test(cajaDetalle)&&
    lista.includes('<p class="nota-ilustrativa catalogo-nota-imagenes">Imágenes ilustrativas, no fotos del activo</p>')&&
    detalle.includes('<p class="nota-ilustrativa">Imágenes ilustrativas, no fotos del activo</p>')&&
    (htmlInicio.match(/<p class="nota-ilustrativa">Imágenes ilustrativas, no fotos del activo<\/p>/g)||[]).length===1&&
    !/Ilustración(?: editorial)?<\/span>/.test(p.obtiene('grid').innerHTML+lista)&&
    !/(?:font-size|font)\s*:[^;]*\.[0-6]\d*rem/.test(declaracionesCSS(css,'.nota-ilustrativa').join(';')));
  // Chips de categoría: orden fijo, nombre corto y sin cortar; recuentos en Plataformas.
  vm.runInContext("emiCat='';pintarFiltrosEmision();render()",c);
  const chips=p.obtiene('emiFiltros').innerHTML,pills=p.obtiene('pills').innerHTML;
  const cortos=['Inmobiliario','Crédito','Tesoro','Acciones','Materias primas','Infraestructura'];
  const filtrosMovil=declaracionesCSS(cssMovil,'#movilPanelRadar .emis-filtros').join(';');
  prueba('chips sin cortar con nombre corto, en dos líneas y con recuento en Plataformas',
    [...chips.matchAll(/<span class="f-corto">([^<]+)<\/span>/g)].every(m=>cortos.includes(m[1]))&&
    /\.f-largo\{display:none\}\.f-corto\{display:inline\}/.test(css)&&
    /flex-wrap\s*:\s*wrap/.test(filtrosMovil)&&/overflow\s*:\s*visible/.test(filtrosMovil)&&
    /white-space\s*:\s*nowrap/.test(declaracionesCSS(cssMovil,'#movilPanelRadar .emis-filtros .f').join(';'))&&
    /Todas <span class="ct">\d+<\/span>/.test(pills)&&!/display\s*:\s*none/.test(declaracionesCSS(cssMovil,'#movilPanelRadar .fichas-f .ct').join(';'))&&
    /<span class="empresa-visual__categoria">(?:Inmobiliario|Crédito|Tesoro|Acciones|Materias primas|Infraestructura)<\/span>/.test(p.obtiene('grid').innerHTML));
  // Radar de Inicio (13/11/2026, «el radar de inicio se ve mal»): en el móvil, el radar sin texto
  // (recortado al aro) y la leyenda en texto real a su lado; en tableta y escritorio
  // (html.escritorio-relato), los rótulos alrededor. Los mismos nombres cortos y movimiento reducido en vivo.
  const radar=p.obtiene('inicioRadar').innerHTML,vistaMovil=p.obtiene('inicioRadar').getAttribute('viewBox');
  const leyenda=p.obtiene('inicioRadarLista').innerHTML,filas=[...leyenda.matchAll(/<li class="ir-ley( ir-ley-cero)?">([\s\S]*?)<\/li>/g)];
  const porCat=JSON.parse(vm.runInContext('JSON.stringify(Object.keys(CATMETA).map(k=>[CATMETA[k].c,P.filter(p=>p.cat===k).length]))',c));
  prueba('Inicio en el móvil: el radar sin rótulos dentro y la leyenda de seis filas, en su orden, con su color y su cifra',
    !/<text\b/.test(radar)&&/class="radar-borde"/.test(radar)&&vistaMovil==='55 55 290 290'&&
    filas.length===6&&filas.every((m,i)=>{const [col,n]=porCat[i];
      return m[2]==='<svg class="ir-ley-punto" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5" fill="'+col+'"/></svg>'+
        '<span class="ir-ley-nombre">'+cortos[i]+'</span><span class="ir-ley-n" aria-hidden="true">'+n+'</span><span class="solo-lector">'+n+(n===1?' plataforma':' plataformas')+'</span>'&&
        Boolean(m[1])===(n===0);}));
  // Una categoría sin plataformas no desaparece: su fila sigue, con «0» atenuado.
  vm.runInContext("var _p=[...P];P.splice(0,P.length,..._p.filter(x=>x.cat!=='Materias primas'));huellaInicio='';pintarInicio()",c);
  const conCero=p.obtiene('inicioRadarLista').innerHTML;
  vm.runInContext("P.splice(0,P.length,..._p);huellaInicio='';pintarInicio()",c);
  // En tableta y escritorio, los rótulos alrededor del radar, con su viewBox ancho.
  vm.runInContext("document.documentElement={classList:{contains:x=>x==='escritorio-relato'}};huellaInicio='';pintarInicio()",c);
  const radarEsc=p.obtiene('inicioRadar').innerHTML,vistaEsc=p.obtiene('inicioRadar').getAttribute('viewBox');
  // En escritorio, la categoría sin plataformas también lleva su «0» atenuado (antes, el nombre suelto).
  vm.runInContext("P.splice(0,P.length,..._p.filter(x=>x.cat!=='Materias primas'));huellaInicio='';pintarInicio()",c);
  const radarEscCero=p.obtiene('inicioRadar').innerHTML;
  vm.runInContext("P.splice(0,P.length,..._p);huellaInicio='';pintarInicio()",c);
  const rotulosEsc=[...radarEsc.matchAll(/<text class="ir-et" x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)"[^>]*>([\s\S]*?)<\/text>/g)]
    .map(m=>({x:+m[1],y:+m[2],ancla:m[3],lineas:Math.max(1,(m[4].match(/<tspan[^>]* x=/g)||[]).length)}));
  vm.runInContext("delete document.documentElement;huellaInicio='';pintarInicio()",c);
  prueba('el radar de Inicio usa los nombres cortos, cuenta plataformas y atiende el cambio de movimiento reducido',
    (conCero.match(/<li class="ir-ley/g)||[]).length===6&&
    /<li class="ir-ley ir-ley-cero"><svg [^>]*><circle [^>]*\/><\/svg><span class="ir-ley-nombre">Materias primas<\/span><span class="ir-ley-n" aria-hidden="true">0<\/span><span class="solo-lector">0 plataformas<\/span><\/li>/.test(conCero)&&
    (conCero.match(/ir-ley-cero/g)||[]).length===porCat.filter(([,n],i)=>n===0||i===4).length&&
    vistaEsc==='-14 6 416 388'&&(radarEsc.match(/<text class="ir-et"/g)||[]).length===6&&
    /<tspan class="ir-et-n ir-et-cero" x="3" dy="15">0<\/tspan>/.test(radarEscCero)&&(radarEscCero.match(/ir-et-cero/g)||[]).length===porCat.filter(([,n],i)=>n===0||i===4).length&&
    (radarEsc.match(/ir-et-cero/g)||[]).length===porCat.filter(([,n])=>n===0).length&&/\.rel \.ir-et-n\.ir-et-cero\{fill:var\(--tx-3\)\}/.test(css)&&
    // Dónde van (medido en Chromium: con la letra a 14,6 unidades ninguno pisa el aro de 136 ni sus marcas de 144):
    // arriba y abajo, a 24 del aro; los de los lados, en las esquinas, apoyados en y = 76 (arriba) o desde y = 340 (abajo).
    rotulosEsc.length===6&&rotulosEsc.every(({x,y,ancla,lineas})=>ancla==='middle'?(y<=200-136-24||y>=200+136+24)&&x===200:
      (ancla==='start'?x<=3:x>=385)&&(y+15*(lineas-1)<=76||y>=340))&&
    cortos.every(nombre=>radarEsc.includes('>'+nombre+(nombre==='Inmobiliario'||nombre==='Acciones'?' ':'<')))&&
    !/Inmuebles|>Infra<|>Materias</i.test(radarEsc)&&p.obtiene('inicioRadar').getAttribute('viewBox')==='55 55 290 290'&&
    /matchMedia\('\(prefers-reduced-motion: reduce\)'\)[\s\S]{0,40}addEventListener==='function'\)mq\.addEventListener\('change'/.test(js));
  // Los rótulos de escritorio, fuera del aro y de las marcas (medido en Chromium en
  // rwadar-acceso/radar-inicio-navegador.test.mjs); sin la regla que los escondía en pantallas bajas.
  const cssSecciones=lee('./assets/secciones-20261110.css').replace(/\/\*[\s\S]*?\*\//g,'');
  prueba('CSS del radar de Inicio: radar y leyenda lado a lado en el móvil, leyenda solo para el lector en escritorio',
    !/\.ir-et\{display:none\}/.test(css)&&
    /display:flex/.test(declaracionesCSS(cssSecciones,':root:not(.escritorio-relato) .ini-cab .rel-radar').join(';'))&&
    // Sin min-width:0 la caja del radar ensanchaba la rejilla de la cabecera (a 320 × 720 la página se salía 24 px).
    /(^|;)min-width:0(;|$)/.test(declaracionesCSS(cssSecciones,':root:not(.escritorio-relato) .ini-cab .rel-radar').join(';'))&&
    /aspect-ratio:1\b/.test(declaracionesCSS(cssSecciones,':root:not(.escritorio-relato) .rel .ini-cab .rel-radar .inicio-radar').join(';'))&&
    /clip-path:inset\(50%\)/.test(declaracionesCSS(cssSecciones,'.escritorio-relato .ir-leyenda').join(';'))&&
    /white-space:nowrap/.test(declaracionesCSS(cssSecciones,'.ir-ley-nombre').join(';'))&&
    // 320 × 568: el titular en tres líneas y la fecha sin crecer, para que «Ver las ofertas» quede sobre la barra de abajo.
    /@media \(max-width:340px\) and \(max-height:700px\)\{\.ini-cab \.rel-portada-tit\{font-size:1\.375rem\}\}/.test(cssSecciones)&&
    /@media \(max-width:359px\)\{[^@]*\.ini-cifra b\{font-size:1\.375rem\}[^@]*\.ini-cifra-fecha b\{font-size:1rem;/.test(cssSecciones));
  // Corrección (03/11), con el Inicio nuevo (04/11): Selección, aviso crítico y radar para el lector.
  const dc=s=>declaracionesCSS(css,s).join(';'),stop=vm.runInContext(`(()=>{const o={...EMI.find(x=>x.slug==='${sacada}')};
    o.avisos=[...(o.avisos||[]),{tono:'stop',texto:'AVISO_STOP'}];return {sel:enSeleccionOferta(o)}})()`,c);
  const conNota=JSON.parse(vm.runInContext("JSON.stringify(ofertasInicio(cifrasInicio()).filter(o=>NOTAS_SELECCION[o.slug]).length)",c));
  prueba('Ofertas de Inicio: tarjetas que encogen, del mismo ancho, con su nota propia y nunca una Selección con aviso crítico',
    /min-width:0/.test(dc('.rel-tarjeta'))&&/grid-auto-columns:\d+%/.test(dc('.rel-tarjetas'))&&!stop.sel&&vm.runInContext(`enSeleccionOferta(EMI.find(x=>x.slug==='${sacada}'))`,c)===true&&
    (p.obtiene('relNuevasLista').innerHTML.match(/<p class="rel-tarjeta-nota">[^<]+</g)||[]).length===conNota);
  // La leyenda es la lista para el lector (13/11/2026): oye «Inmobiliario, 3 plataformas» una vez
  // (el número a la vista va oculto y el SVG también); vive dentro del radar, que lleva a Plataformas.
  prueba('radar: recuentos para el lector',
    (p.obtiene('inicioRadarLista').innerHTML.match(/<span class="ir-ley-nombre">(?:Inmobiliario|Crédito|Tesoro|Acciones|Materias primas|Infraestructura)<\/span><span class="ir-ley-n" aria-hidden="true">(\d+)<\/span><span class="solo-lector">\1 plataformas?<\/span><\/li>/g)||[]).length===6&&
    /<div class="rel-radar inicio-radar-caja" data-inicio-radar>\s*<svg class="inicio-radar" id="inicioRadar" viewBox="55 55 290 290" aria-hidden="true" focusable="false"><\/svg>\s*<ul class="ir-leyenda" id="inicioRadarLista" aria-label="Plataformas por tipo de activo"><\/ul>\s*<\/div>/.test(htmlInicio)&&
    !/class="solo-lector" id="inicioRadarLista"/.test(htmlInicio)&&!/data-inicio-buscar/.test(htmlInicio));
}
{
  const p=pestanaCatalogo(),c=p.contexto,ampliado=snapshotLocalV2(c);
  const nueva={...ampliado.ofertas.find(o=>o.coleccion==='principales'),slug:'ampliacion-sintetica-validada'};
  ampliado.ofertas.push(nueva);
  [...ampliado.plataformas,...ampliado.ofertas].forEach(x=>{x.ofertas_esperadas=N_OFERTAS+1;x.colecciones_esperadas={...COL_REAL,principales:COL_REAL.principales+1};});
  c.ampliado=ampliado;c.anterior=snapshotLocalV2(c);
  prueba('el cliente acepta una ampliación solo con todas las filas y conteos de colección coherentes',
    vm.runInContext('validarEscaparateLocalV2(ampliado).ofertas.length===ampliado.ofertas.length',c)&&ampliado.ofertas.length===N_OFERTAS+1);
  const incompleto=structuredClone(ampliado);incompleto.ofertas.pop();c.incompleto=incompleto;
  prueba('la ampliación declarada no acepta una respuesta truncada al tamaño del lote anterior',
    Boolean(await capturaError(Promise.resolve().then(()=>vm.runInContext('validarEscaparateLocalV2(incompleto)',c)))));
  vm.runInContext('recordarManifiestoCatalogoV2(ampliado.plataformas)',c);
  prueba('tras aceptar una ampliación acepta un lote coherente más pequeño (retirada deliberada, 02/11/2026)',
    vm.runInContext('validarEscaparateLocalV2(anterior).ofertas.length===anterior.ofertas.length',c)&&c.anterior.ofertas.length===N_OFERTAS);
  const reducido=snapshotLocalV2(c),secundarias=reducido.ofertas.filter(o=>o.coleccion==='secundario');
  const quitar=new Set(secundarias.slice(0,Math.max(1,secundarias.length-1)).map(o=>o.slug));
  reducido.ofertas=reducido.ofertas.filter(o=>!quitar.has(o.slug));
  [...reducido.plataformas,...reducido.ofertas].forEach(x=>{x.ofertas_esperadas=reducido.ofertas.length;
    x.colecciones_esperadas={...COL_REAL,secundario:COL_REAL.secundario-quitar.size};});
  c.reducido=reducido;
  prueba('el cliente acepta un lote reducido a propósito si todas sus filas y colecciones cuadran con su manifiesto',
    vm.runInContext('validarEscaparateLocalV2(reducido).ofertas.length===reducido.ofertas.length',c)&&reducido.ofertas.length===N_OFERTAS-quitar.size);
  const reducidoCortado=structuredClone(reducido);reducidoCortado.ofertas.pop();c.reducidoCortado=reducidoCortado;
  prueba('un lote reducido al que le falta una fila declarada se sigue rechazando',
    Boolean(await capturaError(Promise.resolve().then(()=>vm.runInContext('validarEscaparateLocalV2(reducidoCortado)',c)))));
  const exceso=structuredClone(ampliado);exceso.plataformas[0].ofertas_esperadas=1001;c.exceso=exceso;
  prueba('la ampliación mantiene límites explícitos de tamaño y no admite metadatos aislados',
    Boolean(await capturaError(Promise.resolve().then(()=>vm.runInContext('validarEscaparateLocalV2(exceso)',c)))));
}
for (const causa of ['medianoche','reactivacion','consulta-limitada']) {
  const p = pestanaCatalogo(), c = p.contexto;
  const corte = vm.runInContext("new Date(Date.parse(P[0].verificado_lote_el+'T00:00:00Z')+(P[0].vigencia_lote_dias+1)*86400000).toISOString()", c);
  p.reloj(new Date(Date.parse(corte)-50).toISOString());
  vm.runInContext("setView('matrix');setView('grid');compare=[0,1];openDrawer(0);openCompare();abrirDetalleOfertaLocal(EMI[0].slug);programarRevisionVigenciaOfertas();ultimaMirada=Date.now();", c);
  p.escuchas.get('radarHero:focusin').forEach(fn=>fn({target:{closest:()=>({dataset:{i:'0'}})}}));
  prueba(`pestaña ${causa}: radar, matriz y detalles contienen el lote antes del vencimiento`,
    /data-abrir=/.test(p.obtiene('grid').innerHTML) && /data-abrir=/.test(p.obtiene('matrix').innerHTML) &&
    p.obtiene('modalBody').innerHTML.length > 100 && p.obtiene('escaparateDetalleLocal').open &&
    p.obtiene('rlNom').textContent.length>0 && p.obtiene('radarLee.rl-dato').hidden===false);
  p.reloj(corte);
  if (causa === 'medianoche') p.tiempos.at(-1).fn();
  else if (causa === 'reactivacion') p.escuchas.get('visibilitychange').forEach(fn => fn());
  else await vm.runInContext('mirar()', c);
  prueba(`pestaña ${causa}: al caducar, radar, vistas y ofertas siguen visibles con el aviso de revisión pendiente`,
    vm.runInContext('P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&!CATALOGO_EMBEBIDO_BLOQUEADO&&CATALOGO_CADUCADO',c) &&
    /data-abrir=/.test(p.obtiene('grid').innerHTML) && /data-oferta-detalle=/.test(p.obtiene('emiLista').innerHTML) &&
    p.obtiene('avisoCatalogoRadar').hidden===false && /^Revisión pendiente\. Estos datos se revisaron el /.test(p.obtiene('avisoCatalogoRadar').textContent) &&
    p.obtiene('avisoCatalogoOfertas').textContent===p.obtiene('avisoCatalogoRadar').textContent &&
    /pendiente de renovar$/.test(p.obtiene('pieRevision').textContent));
  p.reloj(new Date(Date.parse(corte)+30*86400000).toISOString());
  vm.runInContext('refrescarVigenciaOfertas()', c);
  prueba(`pestaña ${causa}: un mes después sigue visible y ninguna cifra comercial vencida se muestra`,
    vm.runInContext("P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas&&EMI.filter(o=>o.coleccion==='principales').every(o=>estadoVigenciaLocal(o).clase==='caducado')",c) &&
    /data-oferta-detalle=/.test(p.obtiene('emiLista').innerHTML) && /cifras por actualizar/.test(p.obtiene('emiLista').innerHTML) &&
    p.obtiene('avisoCatalogoRadar').hidden===false);
}
for (const vacia of ['plataformas','ofertas']) {
  const p=pestanaCatalogo(), c=p.contexto;
  c.fetch=async url=>{const ok=url.includes('catalogo_'+vacia+'_');return{ok,status:ok?200:500,json:async()=>[]};};
  vm.runInContext('render()', c);
  const error=await capturaError(vm.runInContext('alDia()',c));
  prueba(`una vista ${vacia} vacía con otra HTTP 500 conserva la última copia completa y avisa`, Boolean(error) &&
    vm.runInContext('!CATALOGO_EMBEBIDO_BLOQUEADO&&CATALOGO_SIN_COMPROBAR&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas',c) &&
    /data-abrir=/.test(p.obtiene('grid').innerHTML) && /data-oferta-detalle=/.test(p.obtiene('emiLista').innerHTML) &&
    /^No hemos podido comprobar la revisión más reciente/.test(p.obtiene('avisoCatalogoRadar').textContent));
}
{
  const p=pestanaCatalogo(), c=p.contexto;
  c.fetch=async url=>url.includes('catalogo_publicacion')
    ? {ok:true,status:200,json:async()=>[{retirado:true,motivo:'Orden de prueba'}]}
    : {ok:false,status:500};
  const error=await capturaError(vm.runInContext('alDia()',c));
  prueba('solo la orden expresa de retirada oculta radar, ofertas y contadores', Boolean(error) &&
    vm.runInContext('CATALOGO_EMBEBIDO_BLOQUEADO&&CATALOGO_RETIRADO&&P.length===0&&EMI.length===0',c) &&
    !/data-abrir=/.test(p.obtiene('grid').innerHTML) && !/data-oferta-detalle=/.test(p.obtiene('emiLista').innerHTML) &&
    p.obtiene('movilOfertasEstado').textContent==='Catálogo no disponible' &&
    p.obtiene('avisoCatalogoRadar').hidden===true && p.obtiene('pieRevision').textContent==='Catálogo no disponible temporalmente');
}
{
  const p=pestanaCatalogo(), c=p.contexto;
  c.fetch=async url=>url.includes('catalogo_publicacion')
    ? {ok:false,status:404}
    : {ok:true,status:200,json:async()=>[]};
  const error=await capturaError(vm.runInContext('alDia()',c));
  prueba('sin la tabla de la orden (base antigua), las vistas vacías no ocultan el catálogo', Boolean(error) &&
    vm.runInContext('!CATALOGO_EMBEBIDO_BLOQUEADO&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas',c));
}
{
  const p=pestanaCatalogo(), c=p.contexto;
  c.fetch=async()=>({ok:false,status:500});
  const error=await capturaError(vm.runInContext('alDia()',c));
  prueba('un fallo de transporte aislado conserva solo el lote completo que todavía está vigente', Boolean(error) &&
    vm.runInContext('!CATALOGO_EMBEBIDO_BLOQUEADO&&P.length===P[0].plataformas_esperadas&&EMI.length===EMI[0].ofertas_esperadas',c));
}
prueba('las etiquetas públicas de ordenación describen los comparadores documentales reales',
  /value="cierra">Las más al día primero/.test(html) && /value="rent">Rentabilidad publicada \(mayor primero\)/.test(html) &&
  /value="min">Mínimo en euros \(menor primero\)/.test(html) && /value="az">Empresa \(A-Z\)/.test(html) &&
  !/Lo que cierra antes|Más avanzada/.test(html));
prueba('el publicador usa ComSpec en Windows y evita el EINVAL de ejecutar npx.cmd directamente',
  /process\.env\.ComSpec \|\| 'cmd\.exe'/.test(publicador) &&
  /\['\/d', '\/s', '\/c', 'npx\.cmd'\]/.test(publicador) &&
  /\.\.\.prefijoWrangler/.test(publicador));
prueba('el origen Cloudflare está fijado y se valida como origen HTTPS exacto',
  ORIGEN_PUBLICO === 'https://rwadar.pages.dev' && ORIGEN_LEGADO === 'https://rwadar.netlify.app' &&
  PROYECTO_CLOUDFLARE === 'rwadar' && comprobarOrigenPublico() === ORIGEN_PUBLICO);
prueba('solo se despliega rwadar-publicado al proyecto Cloudflare declarado',
  /'pages', 'deploy', SALIDA/.test(publicador) && /'--project-name', PROYECTO_CLOUDFLARE/.test(publicador));
prueba('el remoto coteja Git y la huella aprobada antes y después de sincronizar',
  /comprobarRevisionGitPublicable/.test(publicador) &&
  /antes de acceder a servicios externos/.test(publicador) &&
  /después de sincronizar/.test(publicador) &&
  /antes de invocar el proveedor de alojamiento/.test(publicador));
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
  /scale=\$\{anchoSalida\}:\$\{altoSalida\}/.test(capturadorPortadas) &&
  /crop=\$\{anchoSalida\}:\$\{altoSalida\}/.test(capturadorPortadas) &&
  /temporalSalida/.test(capturadorPortadas) && /WebP convertido no válido/.test(capturadorPortadas) &&
  /await fs\.rename\(temporalSalida, destino\)/.test(capturadorPortadas));
prueba('la selección editorial activa las 26 fuentes propias y falla cerrada',
  /const PORTADAS_EDITORIALES = Object\.freeze\(/.test(capturadorPortadas) &&
  /const PORTADAS_GENERADAS = Object\.freeze\(/.test(capturadorPortadas) &&
  /'ARTEX Global Markets': \{[\s\S]{0,220}?archivoFuente: 'artex-global-markets\.webp'/.test(capturadorPortadas) &&
  /Lofty: \{[\s\S]{0,220}?archivoFuente: 'lofty\.webp'/.test(capturadorPortadas) &&
  /'Pax Gold': \{[\s\S]{0,220}?archivoFuente: 'pax-gold\.webp'/.test(capturadorPortadas) &&
  /origenVisual: 'representacion-editorial-generada'/.test(capturadorPortadas) &&
  /paginaReferencia: PAGINAS_PORTADA\[p\.n\]/.test(capturadorPortadas) &&
  /imagenOrigen: null/.test(capturadorPortadas) && /creador: 'RWAdar'/.test(capturadorPortadas) &&
  /if \(PORTADAS_ACTIVAS\[p\.n\]\) \{\s*throw new Error/.test(capturadorPortadas) &&
  !/favicon[^\n]+PORTADAS_EDITORIALES/i.test(capturadorPortadas));
prueba('las portadas generadas pierden metadatos y nunca reutilizan la vía de descarga oficial',
  /if \(esGenerada\) \{[\s\S]{0,900}?rwadar-editorial-source/.test(capturadorPortadas) &&
  /-map_metadata/.test(capturadorPortadas) &&
  capturadorPortadas.indexOf('if (esGenerada) {') < capturadorPortadas.indexOf('const recursoLocal = RECURSOS_LOCALES.get(p.n)'));
// La foto va limpia y el texto debajo, como en las ofertas (NOTAS 1 del coordinador, confirmada por los revisores, 04/11/2026).
prueba('las fotografías móviles se muestran vivas y sin texto encima',
  /saturate\(1\.06\)/.test(declaracionesCSS(cssMovil, '#movilPanelRadar .empresa-visual__imagen').join(';')) &&
  /contrast\(1\.035\)/.test(declaracionesCSS(cssMovil, '#movilPanelRadar .empresa-visual__imagen').join(';')) &&
  ['.empresa-visual__texto','.empresa-visual__categoria','.empresa-visual__verificada'].every(x=>
    !/position\s*:\s*absolute/.test(declaracionesCSS(cssMovil, '#movilPanelRadar '+x).join(';'))));
prueba('el publicador genera y valida JS/CSS adelgazados',
  /adelgazarJS/.test(publicador) && /adelgazarCSS/.test(publicador) && /new Function\(reducido\)/.test(publicador));
prueba('no existe promoción ni despliegue alternativo tras un fallo',
  !/restoreSiteDeploy|api\/v1\/deploys|deployId|--prod-if-unlocked/.test(publicador));
prueba('todo remoto exige estado legal documentado y corte operativo antes de sincronizar',
  /const remoto = preview \|\| produccion/.test(publicador) &&
  /if \(remoto\)[\s\S]*comprobarEstadoLegalPublicacion\(privacidad, \{ exigirDocumentado: true \}\)/.test(publicador) &&
  /comprobarPreparacionRelanzamiento\(estadoRelanzamiento, \{ destino: preview \? 'preview' : 'produccion' \}\)/.test(publicador) &&
  publicador.indexOf('comprobarEstadoLegalPublicacion(privacidad') < publicador.indexOf("execFileSync('node'") &&
  publicador.indexOf('comprobarPreparacionRelanzamiento(estadoRelanzamiento,') >= 0 &&
  publicador.indexOf('comprobarPreparacionRelanzamiento(estadoRelanzamiento,') < publicador.indexOf("execFileSync('node'"));
prueba('todo remoto hace preflight Auth de solo lectura y falla cerrado',
  /if \(remoto\)[\s\S]*await comprobarConfiguracionAuth\(\)/.test(publicador) &&
  /mailer_autoconfirm !== false/.test(fs.readFileSync(path.join(raiz,'rwadar-publicacion-segura.js'),'utf8')));

prueba('el sincronizador escribe los datos en el JS externo',
  /const JS = path\.join\(SITIO, 'assets', 'catalogo-publico-20261022\.js'\)/.test(sincronizador));
prueba('radar, descartes y emisiones se consultan juntos y fallan cerrados',
  /Promise\.all\(\[/.test(sincronizador) && !/let emisiones\s*=\s*\[\]/.test(sincronizador));
prueba('el sincronizador neutraliza <, > y separadores Unicode',
  /replace\(\/<\/g, '\\\\u003c'\)/.test(sincronizador) &&
  /replace\(\/>\/g, '\\\\u003e'\)/.test(sincronizador) && /\\u2028/.test(sincronizador));
const ofertaNormalizador = {
  revision_id:'00000000-0000-0000-0000-000000000001',
  slug:'prueba-contrato', tipo:'rendimiento', titulo:'Oferta de prueba',
  plataforma_slug:'proveedor', plataforma_nombre:'Proveedor', categoria:'Inmobiliario',
  resumen:'Oferta sintética para comprobar el contrato del normalizador.',
  url:'https://example.test/oferta', verificada_el:'2026-09-21', vigencia_dias:1,
  estado_revision:'actual', metricas:[], avisos:[], fuentes_actuales:[],
};
prueba('el normalizador de ofertas conserva HTTPS y fecha explícita',
  ofertaPublica(ofertaNormalizador).url === ofertaNormalizador.url &&
  ofertaPublica(ofertaNormalizador).verificadaEl === ofertaNormalizador.verificada_el);
for (const entrada of [
  { url:'http://example.test/oferta' }, { url:'javascript:alert(1)' },
  { url:'/sin-origen' }, { verificada_el:null }, { verificada_el:'21/09/2026' },
]) {
  prueba(`el normalizador rechaza ${JSON.stringify(entrada)}`,
    Boolean(await capturaError(Promise.resolve().then(() =>
      ofertaPublica({ ...ofertaNormalizador, ...entrada })))));
}
prueba('el sincronizador exige validar el lote antes de normalizar y escribir',
  sincronizador.indexOf('validarLotePublico(radar, emisiones, { hoy })') > 0 &&
  sincronizador.indexOf('validarLotePublico(radar, emisiones, { hoy })') <
    sincronizador.indexOf('emisiones.map(ofertaPublica)') &&
  sincronizador.indexOf('emisiones.map(ofertaPublica)') <
    sincronizador.indexOf('escribirAtomico(jsPath, script)'));
prueba('el sincronizador valida que el JS generado compile', /new Function\(script\)/.test(sincronizador));
prueba('el CSV estable neutraliza fórmulas incluso tras espacios o tabuladores',
  celdaCSV('=HYPERLINK("https://evil.example")') === '"\'=HYPERLINK(""https://evil.example"")"' &&
  celdaCSV(' \t@SUM(1,1)').startsWith('"\' \t@') && celdaCSV('texto "normal"') === '"texto ""normal"""');
prueba('el publicador pre-renderiza también el escaparate de emisiones',
  /inyectar\(html, 'emiLista', capturado\.emiLista\)/.test(publicador));
prueba('el publicador captura y escribe la revisión derivada en el HTML',
  /capturadoTexto\.pieRevision/.test(publicador) && /marcaPie/.test(publicador));
prueba('con el catálogo caducado el publicador acepta el mismo aviso que ve el navegador',
  publicador.includes('\\d{4}( · pendiente de renovar)?$/.test(pieRevision)') &&
  js.includes("' · pendiente de renovar'"));

prueba('el servidor escucha solo en loopback', /\.listen\(PUERTO, '127\.0\.0\.1'/.test(servidor));
prueba('guardar capturas requiere flag, origen local, PNG y límite',
  /const CAPTURAS = process\.argv\.includes\('--capturas'\)/.test(servidor) &&
  /ORIGENES_LOCALES\.includes\(origen\)/.test(servidor) && /firmaPng/.test(servidor) && /LIMITE_CAPTURA/.test(servidor));
prueba('el servidor local replica la CSP de worker/manifest',
  /worker-src 'self'/.test(servidor) && /manifest-src 'self'/.test(servidor));
prueba('el servidor local corta físicamente cualquier conexión a producción',
  /connect-src 'self'; form-action 'none'/.test(servidor) &&
  !/connect-src[^;]*supabase/i.test(servidor));
prueba('el escaparate local se sirve desde una lista de rutas cerrada y fuera del árbol público',
  /ESCAPARATE_LOCAL = path\.join\(RAIZ, 'rwadar-movil', 'fixtures', 'escaparate-local\.json'\)/.test(servidor) &&
  /DIR_OFERTAS_LOCAL = path\.join\(RAIZ, 'rwadar-movil', 'assets', 'ofertas'\)/.test(servidor) &&
  /\^\[a-z0-9-\]\+\\\.webp\$/.test(servidor) && /fs\.realpathSync\(archivo\)/.test(servidor));
prueba('el cliente activa el catálogo solo en loopback y bloquea las APIs remotas en ese modo',
  /\^\(\?:localhost\|127\\\.0\\\.0\\\.1\)\$/.test(js) &&
  /MODO_LOCAL_SEGURO\)throw new Error\('Supabase está bloqueado/.test(js) &&
  /if\(MODO_LOCAL_SEGURO\)\{[\s\S]{0,500}?cargarEscaparateLocal\(\)/.test(js) &&
  /else\{\s*mirar\(\)/.test(js));
{
  const detalleOfertaParaPruebas = js.slice(js.indexOf('function abrirDetalleOfertaLocal('),
    js.indexOf('function refrescarDetalleOfertaAbierto('));
  prueba('la ficha conserva el enlace al mercado secundario y distingue su ficha oficial',
    /urlFicha=urlHttps\(o\.url\),urlMercado=urlHttps\(o\.urlMercado\)/.test(detalleOfertaParaPruebas) &&
    /secundario&&urlMercado\?enlace\(urlMercado,'Abrir mercado'/.test(detalleOfertaParaPruebas) &&
    // El enlace final dice «Ver oferta en <proveedor> ↗», como la página aparte (NOTAS 3 del coordinador, 04/11/2026),
    // solo si se contrata hoy desde España y la entidad está supervisada; si no, que sales de RWAdar (revisión legal 06/11/2026, 5.3).
    /const verOferta=comprobacionesOferta\(o,resumen\)\.some\(c=>c\.id==='contratable'&&c\.cumple===true\)&&!!supervisada&&supervisada\.cumple===true;/.test(detalleOfertaParaPruebas) &&
    /secundario\?'Ficha oficial':verOferta\?'Ver oferta en '\+o\.plataformaNombre:SALIR_AL_PROVEEDOR/.test(detalleOfertaParaPruebas) &&
    /const SALIR_AL_PROVEEDOR='Ir a la web del proveedor \(sales de RWAdar\)';/.test(js));
  prueba('revisión legal 5.3: la web ya no dice «Puntos fuertes», sino «Datos comprobados a favor»',
    !/Puntos fuertes, con su fuente/.test(js) && js.includes("'<h4>Datos comprobados a favor, con su fuente</h4>"));
}
// REGRESION_TARJETAS_EDITORIALES: fixtures sintéticos, sin consultar ni editar
// el catálogo real. Se comprueba el HTML generado, no solo CSS que lo esconda.
{
  // Fixtures fechados respecto al inicio del reloj de esta pestaña:
  // así no caducan ni quedan «en el futuro» cuando llega una revisión nueva.
  const p = pestanaCatalogo();
  const dia = n => new Date(Date.parse(`${fechaInicioCatalogo}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  const fuentes = ['https://proveedor.example.test/ficha', 'https://documentos.example.test/referencia'];
  const literal = 'Método publicado: rendimiento anual simple de referencia, antes de gastos e impuestos. ' +
    'La ventana documental no garantiza rentabilidad futura ni disponibilidad. REFERENCIA_INTEGRA_FINAL.';
  const unidad = 'Precio publicado por participación indivisible, denominada en euros y sin incluir comisiones. ' +
    'La unidad no representa el inmueble completo ni garantiza liquidez. UNIDAD_INTEGRA_FINAL.';
  const descripcion = 'DOCUMENTO_LARGO_SOLO_EN_FICHA. ' +
    'Texto documental completo que explica la estructura, los derechos, los costes y sus límites. '.repeat(15) +
    'DOCUMENTO_FINAL_INTEGRO.';
  const avisoCritico = 'Acceso restringido a clientes elegibles: confirma los requisitos antes de contratar.';
  const avisoAmpliado = 'AVISO_COMPLETO_SOLO_EN_FICHA. ' +
    'La información publicada no garantiza apertura, liquidez ni recuperación del capital. '.repeat(4) +
    'AVISO_FINAL_INTEGRO.';
  const base = {
    catalogo:true, slug:'regresion-rendimiento', coleccion:'principales', tipo:'rendimiento',
    titulo:'Activo sintético de regresión', plataformaNombre:'Proveedor sintético',
    plataformaSlug:'proveedor-sintetico', categoria:'Inmobiliario', pais:'ES',
    resumen:'RESUMEN_COMPLETO_SOLO_EN_FICHA. Condiciones y contexto de la oferta sintética.',
    url:fuentes[0], urlMercado:'https://proveedor.example.test/mercado',
    verificadaEl:dia(0), vigenciaDias:7, estadoRevision:'actual', disponibleEs:true,
    rentabilidad:{mostrada:'6,50 %', literal}, precio:{mostrada:'100 EUR', unidad},
    metricas:[
      {etiqueta:'Entrada mínima', valor:'AUXILIAR_ENTRADA_SOLO_EN_FICHA 100 EUR'},
      {etiqueta:'Estructura', valor:'AUXILIAR_PLAZO_SOLO_EN_FICHA 24 meses'},
      {etiqueta:'Garantía / uso', valor:'AUXILIAR_GARANTIA_SOLO_EN_FICHA'},
    ],
    // El aviso crítico se coloca después del ordinario para probar su prioridad.
    avisos:[{tono:'warn', texto:avisoAmpliado}, {tono:'stop', texto:avisoCritico}],
    fuentesActuales:fuentes,
    documentacion:{
      revisadaEl:dia(-1), descripcion, fuentes,
      caracteristicas:[{etiqueta:'Derechos documentados', valor:'CARACTERISTICA_COMPLETA_SOLO_EN_FICHA'}],
      referencias:[{
        etiqueta:'Referencia económica histórica', valor:'DATO_DOCUMENTAL_COMPLETO 5,00 %',
        alcance:'Alcance documental íntegro: dato histórico con fecha, no una condición actual. ALCANCE_FINAL_INTEGRO.',
        fechaDato:dia(-2), fechaConsulta:dia(-1), fuente:fuentes[1],
      }],
    },
  };
  const casos = [
    // Tarjeta sencilla (Víctor, 05/11/2026): «cifras válidas» y «Liquidez/Apertura no
    // confirmada» van a la ficha (fuera); la tarjeta solo dice un problema de revisión (linea).
    {nombre:'rendimiento vigente', cambios:{}, fuera:'cifras válidas 7 días más'},
    {nombre:'valor vigente', cambios:{slug:'regresion-valor', tipo:'valor'}, fuera:'cifras válidas 7 días más'},
    {nombre:'caducada con documentación reciente', cambios:{slug:'regresion-caducada', verificadaEl:'2026-09-01', vigenciaDias:1}, estado:'cifras por actualizar', linea:true},
    {nombre:'apertura no confirmada', cambios:{slug:'regresion-apertura', estadoRevision:'no_verificable'}, estado:'apertura no confirmada', linea:true},
    {nombre:'fuentes en conflicto', cambios:{slug:'regresion-conflicto', estadoRevision:'fuentes_en_conflicto'}, estado:'fuentes en conflicto', linea:true},
    {nombre:'mercado secundario', cambios:{slug:'regresion-secundario', coleccion:'secundario', tipo:'secundario'}, fuera:'Liquidez no confirmada'},
    {nombre:'anuncio en camino', cambios:{slug:'regresion-en-camino', coleccion:'en_camino'}, fuera:'Apertura no confirmada'},
    {nombre:'restricción territorial', cambios:{slug:'regresion-no-es', disponibleEs:false}, estado:'No disponible en España', espana:'No'},
    {nombre:'patrocinio declarado', cambios:{slug:'regresion-patrocinada', patrocinada:true}, estado:'Patrocinada'},
  ];
  const ofertas = casos.map(caso => ({...base, ...caso.cambios}));
  vm.runInContext(`EMI.splice(0, EMI.length, ...${JSON.stringify(ofertas)});`, p.contexto);
  for (let i = 0; i < casos.length; i++) {
    const caso = casos[i], oferta = ofertas[i];
    const render = vm.runInContext(`(() => {
      const o = EMI[${i}], estado = estadoVigenciaLocal(o);
      const tarjeta = tarjetaOfertaLocal(o, {secundario:o.coleccion==='secundario'});
      abrirDetalleOfertaLocal(o.slug);
      const d = document.getElementById('escaparateDetalleLocal');
      return {tarjeta, detalle:d.innerHTML, abierto:d.open, valida:!!ofertaLocalValida(o),
        docValida:!!documentacionOfertaLocal(o), vigente:estado.clase!=='caducado',
        metricas:metricasOfertaLocal(o), avisos:avisosOfertaLocal(o),
        referencia:estado.clase==='caducado'?'':textoLocal(tipoOfertaLocal(o)==='rendimiento'?o.rentabilidad.literal:o.precio.unidad),
        titulo:escHtml(o.titulo), proveedor:escHtml(o.plataformaNombre),
        estado:escHtml(estado.texto), fecha:fechaES(o.documentacion.revisadaEl)};
    })()`, p.contexto);
    const {tarjeta, detalle} = render;
    const cuerpo = tarjeta.slice(tarjeta.indexOf('<div class="escaparate-cuerpo">'));
    /* «☆ Guardar» (favoritos locales, solo móvil) se comprueba aparte. */
    const todosBotones = [...tarjeta.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
    const botones = todosBotones.filter(b => atributoHTML(b[1], 'data-guardar-oferta') === null);
    prueba(`tarjeta ${caso.nombre}: un botón «Guardar» solo para el móvil, con su oferta`,
      todosBotones.filter(b => atributoHTML(b[1], 'data-guardar-oferta') === oferta.slug &&
        /\bfav-local\b/.test(atributoHTML(b[1], 'class') || '')).length === 1);
    prueba(`tarjeta ${caso.nombre}: fixture válido y documento largo aceptado`, render.valida && render.docValida);
    prueba(`tarjeta ${caso.nombre}: imagen, título, proveedor y dos datos siguen el orden de lectura`,
      /<img\b[^>]*alt="[^"]+"[^>]*loading="lazy"[^>]*width="\d+"[^>]*height="\d+"/.test(tarjeta) &&
      tarjeta.indexOf('escaparate-imagen') < tarjeta.indexOf('escaparate-cuerpo') &&
      // ESPEC-FINAL §3: el título lleva title= con el texto completo (la fila lo corta a dos líneas).
      cuerpo.includes('<h3 class="emi-tit" title="'+render.titulo+'">'+render.titulo+'</h3>') &&
      cuerpo.includes('<b class="emi-donde">'+render.proveedor+'</b>') &&
      cuerpo.indexOf('<h3') < cuerpo.indexOf('class="emi-donde"') &&
      cuerpo.indexOf('class="emi-donde"') < cuerpo.indexOf('class="escaparate-datos-clave escaparate-datos-linea"') &&
      (cuerpo.match(/class="escaparate-datos-clave escaparate-datos-linea"/g)||[]).length === 1 &&
      // «Mínimo · España» (05/11/2026); el valor corto ya lleva su unidad («1 €», «500 CHF»). La Salida, en la ficha.
      ['Mínimo','España'].every(etiqueta=>cuerpo.includes('<dt>'+etiqueta+'</dt>')) && !cuerpo.includes('<dt>Salida</dt>') &&
      // Fuera de España, el dato dice «No», nunca «Sin confirmar» al lado de «No disponible en España».
      (!caso.espana || cuerpo.includes('<dt>España</dt><dd>'+caso.espana+'</dd>') && !cuerpo.includes('Sin confirmar')) &&
      !/escaparate-destacado|escaparate-dato-principal/.test(tarjeta));
    prueba(`tarjeta ${caso.nombre}: no contiene documento, descripción, métricas auxiliares ni enlaces externos`,
      !/<a\b|catalogo-descripcion|escaparate-metrica|escaparate-disponibilidad/.test(tarjeta) &&
      !['DOCUMENTO_LARGO_SOLO_EN_FICHA','DOCUMENTO_FINAL_INTEGRO','RESUMEN_COMPLETO_SOLO_EN_FICHA',
        'AUXILIAR_ENTRADA_SOLO_EN_FICHA','AUXILIAR_PLAZO_SOLO_EN_FICHA','AUXILIAR_GARANTIA_SOLO_EN_FICHA',
        'CARACTERISTICA_COMPLETA_SOLO_EN_FICHA','DATO_DOCUMENTAL_COMPLETO','AVISO_COMPLETO_SOLO_EN_FICHA']
        .some(marca => tarjeta.includes(marca)));
    prueba(`tarjeta ${caso.nombre}: dice solo los problemas de revisión y el aviso crítico íntegro`,
      (caso.estado ? tarjeta.includes(caso.estado) : !tarjeta.includes(caso.fuera)) &&
      tarjeta.includes('escaparate-estado-linea') === !!caso.linea &&
      tarjeta.includes('escaparate-aviso-bloqueo') && tarjeta.includes(avisoCritico) && !tarjeta.includes(avisoAmpliado.slice(0, 40)));
    prueba(`tarjeta ${caso.nombre}: sin fechas y un único botón «›» con nombre accesible`,
      !/<time\b/.test(tarjeta) && !tarjeta.includes(render.fecha) &&
      botones.length === 1 && atributoHTML(botones[0][1], 'type') === 'button' &&
      atributoHTML(botones[0][1], 'data-oferta-detalle') === oferta.slug &&
      atributoHTML(botones[0][1], 'aria-label').startsWith('Ver ficha de ') &&
      atributoHTML(botones[0][1], 'aria-label').includes(render.titulo) &&
      atributoHTML(botones[0][1], 'aria-label') === 'Ver ficha de '+render.titulo+' en '+render.proveedor &&
      botones[0][2] === '<span aria-hidden="true">›</span>');
    prueba(`tarjeta y ficha ${caso.nombre}: cifras y contexto van completos al detalle y no reviven si caducan`,
      !tarjeta.includes(literal) && !tarjeta.includes(unidad) && !/6,50 %|100 EUR/.test(tarjeta) &&
      (render.vigente ? detalle.includes(render.referencia) : !detalle.includes(literal) && !detalle.includes(unidad)));
    prueba(`ficha ${caso.nombre}: abre y conserva documento, características, referencias y avisos completos`,
      render.abierto && /<h2 id="escaparateDetalleTitulo">/.test(detalle) &&
      /data-cerrar-detalle aria-label="Cerrar detalle"/.test(detalle) &&
      detalle.includes(descripcion) && detalle.includes(oferta.documentacion.caracteristicas[0].valor) &&
      oferta.documentacion.referencias.every(r => [r.etiqueta,r.valor,r.alcance].every(v=>detalle.includes(v))) &&
      [dia(-2), dia(-1)].every(f => detalle.includes(f.split('-').reverse().join('/'))) &&
      detalle.includes(avisoAmpliado) && detalle.includes(avisoCritico) &&
      render.avisos.every(aviso => detalle.includes(aviso)) &&
      render.metricas.every(m => detalle.includes(m.etiqueta) && detalle.includes(m.valor)) &&
      (render.vigente ? detalle.includes(oferta.resumen) &&
        oferta.metricas.every(m=>detalle.includes(m.etiqueta) && detalle.includes(m.valor)) : detalle.includes(render.estado)));
    const enlaces = [...detalle.matchAll(/<a\b([^>]*)>/g)].map(m=>m[1]);
    const urlsEsperadas = [...new Set([...fuentes, oferta.url, ...(oferta.tipo==='secundario'?[oferta.urlMercado]:[])])];
    prueba(`ficha ${caso.nombre}: las fuentes y enlaces completos permanecen fuera de la tarjeta`,
      urlsEsperadas.every(url=>enlaces.some(a=>atributoHTML(a,'href')===url)) &&
      enlaces.every(a=>/^\/ofertas\/[a-z0-9-]+$/.test(atributoHTML(a,'href')||'') || atributoHTML(a,'target')==='_blank' &&
        /\bnoopener\b/.test(atributoHTML(a,'rel')) && /\bnofollow\b/.test(atributoHTML(a,'rel'))) &&
      (oferta.tipo!=='secundario' || detalle.includes('Abrir mercado ↗') && detalle.includes('Ficha oficial')));
    prueba(`ficha ${caso.nombre}: los nombres accesibles conservan la etiqueta visible de cada enlace`,
      [...detalle.matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)].every(m => {
        const visible = m[2].replace(/ ↗$/, '').trim();
        return atributoHTML(m[1], 'aria-label').startsWith(visible);
      }));
  }
  const warnCompleto = 'Liquidez condicionada: la venta depende de encontrar una contraparte. '.repeat(3)+'WARN_FINAL_INTEGRO.';
  const warnSecundario = 'Segunda advertencia documentada que permanece en la ficha.';
  const avisoSinStop = {...base,slug:'regresion-warn-integro',avisos:[{tono:'warn',texto:warnCompleto},{tono:'warn',texto:warnSecundario}]};
  vm.runInContext('EMI.push('+JSON.stringify(avisoSinStop)+');',p.contexto);
  const renderWarn = vm.runInContext(`(() => {const tarjeta=tarjetaOfertaLocal(EMI[EMI.length-1]);abrirDetalleOfertaLocal('regresion-warn-integro');return {tarjeta,detalle:document.getElementById('escaparateDetalleLocal').innerHTML};})()`,p.contexto);
  prueba('la tarjeta no enseña los avisos ordinarios ni su recuento; el detalle los mantiene todos',
    !renderWarn.tarjeta.includes('WARN_FINAL_INTEGRO') && !renderWarn.tarjeta.includes(warnSecundario) &&
    !/en la ficha|escaparate-aviso-compacto/.test(renderWarn.tarjeta) &&
    renderWarn.detalle.includes(warnCompleto) && renderWarn.detalle.includes(warnSecundario));
  // Revisión legal 06/11/2026, 5.3: «Ver oferta en X» solo con «Se contrata hoy desde España» y «supervisada» en «Sí».
  {
    const accesoSi = {etiqueta:'Acceso desde España', valor:'Disponible para residentes en España',
      alcance:'Acceso documentado para residentes en España.', fechaDato:dia(-1), fechaConsulta:dia(-1), fuente:fuentes[1]};
    const contratable = {...base, slug:'regresion-contratable', avisos:[],
      documentacion:{...base.documentacion, referencias:[...base.documentacion.referencias, accesoSi]}};
    const sinEspana = {...base, slug:'regresion-sin-espana', avisos:[], disponibleEs:null};
    vm.runInContext('EMI.push('+JSON.stringify(contratable)+','+JSON.stringify(sinEspana)+');',p.contexto);
    const enlaceFinal = slug => vm.runInContext(`(() => {abrirDetalleOfertaLocal(${JSON.stringify(slug)});
      const o=EMI.find(x=>x.slug===${JSON.stringify(slug)});
      return {detalle:document.getElementById('escaparateDetalleLocal').innerHTML,
        cumple:comprobacionesOferta(o).find(c=>c.id==='contratable').cumple};})()`, p.contexto);
    const sinSupervision = enlaceFinal('regresion-contratable'), no = enlaceFinal('regresion-sin-espana');
    const supervisadaDe = slug => vm.runInContext(`comprobacionesOferta(EMI.find(x=>x.slug===${JSON.stringify(slug)})).find(c=>c.id==='supervisada').cumple`, p.contexto);
    prueba('revisión legal 5.3: «Ver oferta en <proveedor>» no sale si no se contrata hoy desde España, ni si la entidad no consta supervisada',
      // Se contrata desde España, pero sin la comprobación «supervisada» en «Sí» (no hay entrada en transparencia.json).
      sinSupervision.cumple === true && supervisadaDe('regresion-contratable') === false &&
      sinSupervision.detalle.includes('>Ir a la web del proveedor (sales de RWAdar) ↗</a>') && !sinSupervision.detalle.includes('Ver oferta en') &&
      no.cumple === false && no.detalle.includes('aria-label="Ir a la web del proveedor (sales de RWAdar): Activo sintético de regresión">Ir a la web del proveedor (sales de RWAdar) ↗</a>') &&
      !no.detalle.includes('Ver oferta en') &&
      // Después de los avisos y de «Antes de invertir».
      no.detalle.indexOf('sales de RWAdar') > no.detalle.indexOf('Antes de invertir'));
    // Con las fichas reales del catálogo: Robinhood (se contrata y está supervisada) dice «Ver oferta en»;
    // Aktionariat y Prosegur Digital Gold se contratan desde España, pero quien las vende no está supervisado.
    // (En otra pestaña: esta ya tiene EMI cambiado por ofertas sintéticas.)
    const q = pestanaCatalogo();
    const real = slug => vm.runInContext(`(() => {const o=EMI.find(x=>x.slug===${JSON.stringify(slug)});if(!o)return null;
      abrirDetalleOfertaLocal(${JSON.stringify(slug)});const c=comprobacionesOferta(o);
      return {detalle:document.getElementById('escaparateDetalleLocal').innerHTML,
        cumple:c.find(x=>x.id==='contratable').cumple,supervisada:c.find(x=>x.id==='supervisada').cumple};})()`, q.contexto);
    const robinhood = real('robinhood-classic-stock-tokens'), aktionariat = real('aktionariat'), prosegur = real('prosegur-digital-gold');
    prueba('revisión legal 5.3 con las fichas reales: «Ver oferta en» en Robinhood; Aktionariat y Prosegur (no supervisadas), «sales de RWAdar»',
      !!robinhood && !!aktionariat && !!prosegur &&
      robinhood.cumple === true && robinhood.supervisada === true && robinhood.detalle.includes('>Ver oferta en Robinhood Europe ↗</a>') &&
      aktionariat.cumple === true && aktionariat.supervisada === false && !aktionariat.detalle.includes('Ver oferta en') &&
      aktionariat.detalle.includes('>Ir a la web del proveedor (sales de RWAdar) ↗</a>') &&
      prosegur.supervisada === false && !prosegur.detalle.includes('Ver oferta en') &&
      prosegur.detalle.includes('>Ir a la web del proveedor (sales de RWAdar) ↗</a>'));
  }
  prueba('las tarjetas editoriales no convierten los datos documentales en un ranking',
    !/Ordenar por puntuaci[oó]n/.test(js));
  const reglasImagen = declaracionesCSS(cssBase, '.escaparate-imagen');
  const reglasImagenMovil = declaracionesCSS(cssMovil, '#movilPanelRadar .escaparate-oferta .escaparate-imagen');
  const reglasMiniaturaMovil = declaracionesCSS(cssMovil, '#movilPanelRadar .escaparate-oferta .escaparate-imagen img');
  // Móvil (03/11/2026, ESPEC-FINAL §1): las ilustraciones ya no llevan texto
  // dibujado, así que la miniatura de ancho fijo se encuadra al centro, sin el
  // desplazamiento ni la ampliación que lo escondían, y sin nada encima.
  prueba('las tarjetas mantienen portada 16/10 en escritorio y una miniatura limpia y centrada en el móvil',
    reglasImagen.some(d=>/aspect-ratio\s*:\s*16\s*\/\s*10/.test(d)) &&
    reglasImagenMovil.some(d=>/(?:^|;)\s*width\s*:\s*\d+px/.test(d)) &&
    reglasMiniaturaMovil.length > 0 &&
    reglasMiniaturaMovil.every(d=>!/object-position\s*:\s*100%|transform\s*:\s*scale|width\s*:\s*2\d\d%/.test(d)) &&
    !/escaparate-editorial|inicio-ilustracion|escaparate-tipo/.test(js));
  const controles = ['.escaparate-detalle-boton','.escaparate-oferta .escaparate-detalle-boton',
    '#movilPanelRadar .escaparate-oferta .escaparate-detalle-boton'];
  const reglasBoton = controles.flatMap(selector=>declaracionesCSS(css,selector));
  prueba('Ver ficha mantiene diana de al menos 44 px y foco visible sin override táctil menor',
    reglasBoton.some(d=>/min-height\s*:\s*44px/.test(d)) &&
    reglasBoton.every(d=>[...d.matchAll(/min-height\s*:\s*(\d+(?:\.\d+)?)px/g)].every(m=>Number(m[1])>=44)) &&
    declaracionesCSS(css,'.escaparate-detalle-boton:focus-visible').some(d=>/outline\s*:\s*[1-9]\d*px/.test(d)));
  const reglasSeguridad = ['.escaparate-referencia','.escaparate-dato-principal .escaparate-referencia',
    // La referencia en la ficha vigente va en «Lo esencial» (antes, .escaparate-dialogo-dato, retirado el 13/11/2026).
    '.escaparate-esencial dd small','.escaparate-aviso-compacto',
    '.escaparate-estado.escaparate-estado-linea'].flatMap(selector=>declaracionesCSS(css,selector));
  prueba('referencia obligatoria, aviso crítico y estado no se ocultan ni recortan por CSS',
    reglasSeguridad.length >= 5 && reglasSeguridad.every(d=>
      !/(?:line-clamp|text-overflow\s*:\s*ellipsis|overflow(?:-y)?\s*:\s*hidden|display\s*:\s*none|visibility\s*:\s*hidden)/.test(d)));
}
// FIN_REGRESION_TARJETAS_EDITORIALES
prueba('el secundario usa filas compactas y la carga local devuelve los controles visibles',
  /function filaSecundariaLocal\(o\)/.test(js) && /sec\.map\(filaSecundariaLocal\)/.test(js) &&
  /seccion\.classList\.remove\('sin-emisiones'\)/.test(js));
prueba('cada tarjeta compacta conserva la información completa en un diálogo accesible',
  /function abrirDetalleOfertaLocal\(slug\)/.test(js) && /showModal/.test(js) &&
  /aria-labelledby/.test(js) && /data-cerrar-detalle/.test(js) &&
  /Instantánea interna/.test(js));
{
  const p = pestanaCatalogo();
  vm.runInContext("ESCAPARATE_LOCAL={ofertas:[{tipo:'rendimiento'},{tipo:'valor'}]};emiTipoLocal='valor';pintarTiposOfertaLocal();", p.contexto);
  const filtros = [...p.obtiene('emiTipoFiltros').innerHTML.matchAll(/<button\b([^>]*)>/g)].map(m=>m[1]);
  prueba('los controles compactos distinguen cada oferta y anuncian el filtro seleccionado',
    /aria-label="Ver ficha de /.test(js) && /aria-label="Detalle de /.test(js) && /aria-label="Abrir mercado para /.test(js) &&
    js.includes("data-oferta-detalle=\"'+escHtml(o.slug)") &&
    filtros.length === 3 && filtros.every(f=>atributoHTML(f,'aria-pressed') ===
      (atributoHTML(f,'data-emi-tipo') === 'valor' ? 'true' : 'false')));
}
prueba('el secundario conserva dianas táctiles y microtexto legible en móvil',
  /\.escaparate-sec-enlaces a,\.escaparate-sec-enlaces button\{min-height:40px/.test(css) &&
  /\.escaparate-sec-cifras small[,{][^}]*font:600 \.75rem/.test(css)); // GUIA-ACABADOS.md §5
{
  const p=pestanaCatalogo(), c=p.contexto;
  const slugs=vm.runInContext(`(()=>{
    const fuente='https://proveedor.example.test/ficha',base={...EMI.find(o=>o.coleccion==='principales'),
      estadoRevision:'actual',verificadaEl:P[0].verificado_lote_el,vigenciaDias:7,
      documentacion:{revisadaEl:P[0].verificado_lote_el,fuentes:[fuente],referencias:[]}};
    const minimo={...base,slug:'minimo-documentado',precio:{mostrada:'9000 EUR'},documentacion:{...base.documentacion,
      referencias:[{etiqueta:'Entrada mínima',valor:'200 EUR',fechaConsulta:P[0].verificado_lote_el,fuente}]}};
    const token={...base,slug:'precio-token',precio:{mostrada:'1 EUR'}};
    emiOrden='min';return ordenarOfertasLocales([token,minimo]).map(o=>o.slug).join(',');
  })()`,c);
  prueba('ordenar por mínimo usa euros documentados y no convierte precio por token en entrada mínima',slugs==='minimo-documentado,precio-token');
}
{
  const { crearAccesoServidor } = await import(pathToFileURL(path.join(raiz,'rwadar-acceso','servidor.mjs')).href);
  let llamadasAuth=0, entregasPublicas=0;
  const acceso=crearAccesoServidor({fetchImpl:async()=>{llamadasAuth++;throw new Error('No debe contactar Auth sin sesión');}});
  const portada=await acceso.atender({request:new Request('https://rwadar.pages.dev/plataformas/spiko.webp'),env:{},
    next:async()=>{entregasPublicas++;return new Response('portada-publica',{status:200});}});
  const cuenta=await acceso.atender({request:new Request('https://rwadar.pages.dev/api/acceso/sesion'),env:{},
    next:async()=>{throw new Error('La sesión no debe delegarse a ASSETS');}});
  prueba('las portadas son públicas por el worker; la sesión sigue protegida y el SW no guarda copias',
    /'\.webp': 'image\/webp'/.test(servidor) &&
    /crearAccesoServidor/.test(fs.readFileSync(path.join(raiz,'functions','_middleware.js'),'utf8')) &&
    portada.status===200&&(await portada.text())==='portada-publica'&&entregasPublicas===1&&llamadasAuth===0&&
    cuenta.status===401&&cuenta.headers.get('cache-control')==='private, no-store'&&
    !/addEventListener\(['"]fetch['"]|caches\.open\(/.test(sw) &&
    /\/plataformas\/\*[\s\S]{0,120}max-age=0, must-revalidate/.test(headers));
}

console.log('\n=== PRIVACIDAD, ÍNDICE Y BLOQUEOS ===');
prueba('la privacidad identifica al titular y documenta el alcance editorial',
  /data-deploy-legal-status=["']acuerdo-documentado["']/.test(privacidad) &&
  !/data-deploy-blocker/.test(privacidad));
const privacidadLineal = privacidad.replace(/\s+/g, ' ');
prueba('RWAdar exige una edad mínima de 18 años sin conservar el umbral antiguo',
  /exclusivamente a personas mayores de 18 años/i.test(privacidadLineal) &&
  /personas menores de 18 años no deben crear una cuenta/i.test(privacidadLineal) &&
  !/menores de 14 años/i.test(privacidadLineal));
for (const texto of ['Víctor Manuel Jorques Granero','persona física','rwadares@gmail.com'])
  prueba(`la privacidad identifica ${texto}`, privacidadLineal.includes(texto));
prueba('la identidad declarada incluye aviso legal sin aprobar funciones ni extinguir obligaciones anteriores',
  /id="aviso-legal"/.test(privacidad) && /id="identificacion-titular"/.test(privacidad) &&
  /<b>NIF:<\/b>\s*\d{8}[A-Z]/.test(privacidad) &&
  /<b>Domicilio:<\/b>/.test(privacidad) &&
  /criterios de conservación/.test(privacidadLineal) &&
  /no extingue las obligaciones anteriores/.test(privacidadLineal) &&
  /Alcance de esta versión/.test(privacidadLineal) &&
  !/<b>Corresponsables del tratamiento:/.test(privacidad));
prueba('la privacidad identifica la medición agregada, sus límites y su estado sin despliegue',
  /Cloudflare Web Analytics/.test(privacidad) && /No se utiliza Zaraz/.test(privacidad) &&
  /Do Not Track o Global Privacy Control/.test(privacidad) && /no representan personas únicas/.test(privacidad) &&
  /no permite reconstruir el tráfico anterior/.test(privacidad) &&
  /Cloudflare Pages/.test(privacidad) && /cloudflare-customer-dpa/.test(privacidad));
prueba('la privacidad explica las cookies necesarias, enlaces limpios y retirada de las copias PWA',
  /dos cookies necesarias para tu sesión, protegidas con HttpOnly, Secure y SameSite/.test(privacidadLineal) &&
  /el JavaScript no puede leerlas/.test(privacidadLineal) &&
  /Deja de autorizar al caducar o cerrar sesión/.test(privacidadLineal) &&
  /se canjean una vez y se\s+retiran de la dirección/.test(privacidad) &&
  /history\.replaceState\(null,'',location\.pathname\+location\.search\)/.test(js) &&
  /elimina la antigua caché PWA/.test(privacidadLineal));
/* Sesión que se mantiene (12/11/2026). La casilla de /acceso sale sin marcar y
   solo al entrar; su nota, la privacidad y el servidor dicen lo mismo: dos
   cookies, cuál es cada una, para qué, cuánto duran (una hora y 30 días con la
   casilla; hasta cerrar el navegador sin ella) y que son estrictamente
   necesarias para la sesión que se pide. */
{
  const enComun = require('./rwadar-site/assets/idioma-en-20261022.js');
  const accesoHTML = lee('acceso.html'), accesoJS = lee('assets/acceso.js');
  const ETIQUETA_MANTENER = 'Mantener la sesión iniciada en este dispositivo';
  const NOTA_MANTENER = 'Si la marcas, este navegador guarda tu sesión con una cookie hasta 30 días desde la última vez que la usas, aunque lo cierres. Se borra al cerrar sesión. No la marques en un dispositivo compartido. Más en';
  const diasServidor = Number((servidorAcceso.match(/const MANTENER_S = (\d+) \* 24 \* 60 \* 60;/) || [])[1]);
  prueba('/acceso: casilla «Mantener la sesión iniciada en este dispositivo» sin marcar, solo al entrar, con su nota y su inglés',
    accesoHTML.includes('<div id="campo-mantener" class="mantener">\n      <label class="consentimiento"><input id="mantener" type="checkbox">' + ETIQUETA_MANTENER + '</label>\n      <p id="nota-mantener" class="consentimiento">' + NOTA_MANTENER + ' <a href="/privacidad#cookies-sesion">Privacidad</a>.</p>\n    </div>') &&
    !/<input id="mantener"[^>]*\bchecked\b/.test(accesoHTML) &&
    accesoJS.includes("$('mantener').checked = false; $('campo-mantener').hidden = vista !== 'entrar';") &&
    accesoJS.includes("if (vista === 'entrar') data.mantener = $('mantener').checked === true;") &&
    // Al confirmar la cuenta desde el correo: la misma casilla, sin marcar y fuera del cambio de contraseña.
    accesoHTML.includes('<div id="campo-mantener-enlace" class="mantener" hidden>\n      <label class="consentimiento"><input id="mantener-enlace" type="checkbox">' + ETIQUETA_MANTENER + '</label>\n      <p class="consentimiento">' + NOTA_MANTENER + ' <a href="/privacidad#cookies-sesion">Privacidad</a>.</p>\n    </div>') &&
    !/<input id="mantener-enlace"[^>]*\bchecked\b/.test(accesoHTML) &&
    accesoJS.includes("$('mantener-enlace').checked = false; $('campo-mantener-enlace').hidden = enlace.tipo === 'recovery';") &&
    accesoJS.includes("mantener: $('mantener-enlace').checked === true, confirmarIdentidad: true });") &&
    enComun[ETIQUETA_MANTENER] === 'Keep me signed in on this device' && /^If you tick it, .* More in$/.test(enComun[NOTA_MANTENER] || ''));
  prueba('privacidad: nombre, finalidad y duración de las dos cookies de la sesión, estrictamente necesarias; 30 días como en el servidor',
    diasServidor === 30 &&
    /<tr id="cookies-sesion">/.test(privacidad) &&
    privacidadLineal.includes('<span class="codigo">__Host-rwadar-acceso</span> lleva el pase de tu sesión, que caduca en una hora;') &&
    privacidadLineal.includes('<span class="codigo">__Host-rwadar-renovar</span>, el código con el que el servidor de la web pide un pase nuevo sin volver a pedirte la contraseña.') &&
    privacidadLineal.includes('Son estrictamente necesarias para darte la sesión que pides y solo sirven para eso (LSSI, art. 22.2).') &&
    privacidadLineal.includes('<b>Cuánto duran:</b> hasta que cierras el navegador. Si al entrar (o al confirmar tu cuenta desde el correo) marcas «' + ETIQUETA_MANTENER + '» (sale sin marcar), la del pase dura una hora y se renueva sola, y la de renovar, ' + diasServidor + ' días desde la última vez que usas tu cuenta en ese navegador, aunque lo cierres. Esa duración larga solo se aplica si la pides marcando la casilla, y la retiras cerrando sesión.') &&
    // Sin llamarlas «de sesión» (en la guía de la AEPD, las que se borran al cerrar el navegador).
    !/dos cookies de sesión/.test(privacidadLineal) &&
    privacidadLineal.includes('al salir o al borrar la cuenta se borran las dos y la sesión se cierra también en el servicio de autenticación (si en ese momento no responde, las cookies se borran igual de tu navegador). Al volver a entrar en el mismo navegador, la sesión anterior se cierra.') &&
    privacidadLineal.includes('<li><b>Datos locales:</b> la sesión web usa dos cookies necesarias (apartado 2): sin marcar «' + ETIQUETA_MANTENER + '», se borran al cerrar el navegador; con ella, la del pase dura una hora y la de renovar, ' + diasServidor + ' días desde la última vez que usas tu cuenta en ese navegador.') &&
    NOTA_MANTENER.includes('hasta ' + diasServidor + ' días') &&
    /const COOKIE_RENOVAR = '__Host-rwadar-renovar';/.test(servidorAcceso) &&
    /const ATRIBUTOS_COOKIE = '; Path=\/; HttpOnly; Secure; SameSite=Lax';/.test(servidorAcceso));
}
// 12/11/2026: en la web las notificaciones ya se pueden activar aunque el envío esté apagado
// (llegarán cuando empecemos); en la app, el botón espera al envío (revisión del 12/11).
prueba('la privacidad describe favoritos locales y las notificaciones del móvil (activables en la web y en la app; se envían desde el 12/11/2026), sin prometer borrado histórico',
  /favoritos solo en el dispositivo/.test(privacidadLineal) &&
  privacidadLineal.includes('<p id="notificaciones-movil"><b>Notificaciones en el móvil:</b> en la web ya puedes activarlas en Perfil › Avisos, con «Notificaciones en este móvil», desde el navegador del móvil o la tableta (en iPhone y iPad, con RWAdar añadida a la pantalla de inicio). En la app de Android, desde la versión 1.4.2, con el mismo botón. Desde el 12/11/2026 ya las enviamos a quien las activa.') &&
  !/cuando empecemos a enviarlas/.test(privacidadLineal) &&
  !/ya puedes activarlas en Perfil › Avisos, con «Notificaciones en este móvil»: en la app de Android/.test(privacidadLineal) &&
  /La app no crea una identidad remota de instalación ni activa seguimiento por instalación/.test(privacidadLineal) &&
  /no quedan revocados por los cambios de versión/.test(privacidadLineal) &&
  !/no obtiene ni registra tokens push|entrega automática está desactivada|Los avisos de nuevas emisiones tampoco están conectados|no solicita permiso de\s+notificaciones/.test(privacidadLineal));
prueba('la privacidad tampoco promete correos de cambio del radar',
  /entrega de correos por cambios del radar[\s\S]*todavía no está activa/.test(privacidadLineal));
prueba('privacidad y UI permiten solicitar la retirada del consentimiento anterior sin recoger otro',
  /correo-v1-2026-08-22/.test(privacidadLineal) &&
  /desactivad[oa] por defecto/.test(privacidadLineal) &&
  /retirar cualquier consentimiento anterior escribiendo/.test(privacidadLineal) &&
  /consentimiento explícito/.test(privacidadLineal) &&
  /Esta versión no recoge nuevas preferencias de correo ni envía avisos del radar/.test(html) &&
  /puedes retirarlo escribiendo a rwadares@gmail.com/.test(html) &&
  /Está desactivado por defecto[\s\S]*todavía no enviamos estos avisos/.test(js));
prueba('privacidad distingue consulta pública y cuenta confirmada para funciones personales, conservando correos, sesión y borrado',
  /La consulta de la web es pública/.test(privacidadLineal) &&
  /Necesitas una cuenta con el correo confirmado para las funciones personales/.test(privacidadLineal) &&
  /correo para confirmar la dirección/.test(privacidadLineal) &&
  /enlace para poner una contraseña nueva/.test(privacidadLineal) &&
  /cuenta de Gmail de RWAdar/.test(privacidadLineal) &&
  /cookies necesarias para tu sesión/.test(privacidadLineal) &&
  /borrar tu cuenta tú mismo/.test(privacidadLineal) &&
  /opiniones y\s+los avisos por correo siguen en pausa/i.test(privacidadLineal) &&
  /Las notificaciones en el móvil solo llegan si\s+las activas tú en Perfil › Avisos/.test(privacidadLineal) &&
  /id="derechos"/.test(privacidad) && /El titular verificará la identidad/.test(privacidadLineal) &&
  !/Las altas, el acceso y la recuperación de cuentas están en pausa/.test(privacidadLineal) &&
  /const SERVICIOS_USUARIO_REMOTOS=true;/.test(js) &&
  / const CORREO_AUTH_E2E=true;/.test(js) && jsCerrado !== js &&
  /const SERVICIOS_USUARIO_REMOTOS=false;/.test(jsCerrado) && / const CORREO_AUTH_E2E=false;/.test(jsCerrado) &&
  /solicitado==='registro'\?'registro_pausado'/.test(js) &&
  /solicitado==='recuperar'\?'recuperar_pausado'/.test(js) &&
  /no recogemos nuevas altas ni solicitudes de recuperación/.test(js) &&
  !/Te hemos enviado un correo|ya va en camino un enlace|esta versión no se publicará/.test(js));
prueba('las cuentas se reabren por fases: opiniones, avisos por correo y manual siguen apagados',
  /const OPINIONES_REMOTAS=false;/.test(js) && /const AVISOS_CORREO_REMOTOS=false;/.test(js) &&
  /const MANUAL_BIENVENIDA='';/.test(js) &&
  /const OPINIONES_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&OPINIONES_REMOTAS;/.test(js) &&
  /const AVISOS_CORREO_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_CORREO_REMOTOS;/.test(js) &&
  /if\(!OPINIONES_DISPONIBLES\)throw new Error\('Opiniones desactivadas/.test(js) &&
  /OPINIONES_DISPONIBLES && perfil && perfil\.es_admin\) pintarModeracion\(\)/.test(js));
prueba('la comunidad está preparada pero apagada: sin red y con «próximamente» a la vista',
  /const PUBLICACIONES_REMOTAS=false;/.test(js) &&
  /const PUBLICACIONES_DISPONIBLES=SERVICIOS_USUARIO_DISPONIBLES&&PUBLICACIONES_REMOTAS;/.test(js) &&
  /if\(!PUBLICACIONES_DISPONIBLES\)throw new Error\('Comunidad desactivada en esta versión'\)/.test(js) &&
  /<div class="comunidad" id="comunidad" hidden>/.test(html) && /id="comunidadProximamente"/.test(html) &&
  /una publicación al día por cuenta, sin enlaces/.test(html));
prueba('con las cuentas abiertas no se quedan botones bloqueados (fallos hallados en el ensayo del 5/10)',
  /\$\('cuentaEnviar'\)\.disabled=false;\$\('cuentaForm'\)\.removeAttribute\('aria-busy'\);/.test(js) &&
  /if\(accion\)\{accion\.disabled=false;/.test(js));
prueba('la privacidad explica criterios de conservación y la limpieza de instalaciones comprobada',
  /más de 180 días sin actividad/.test(privacidadLineal) &&
  /atender derechos, incidencias u obligaciones/.test(privacidadLineal) &&
  /Este proceso no borra cuentas/.test(privacidadLineal));
// Academy con cuenta y avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
const accesoHTML = lee('acceso.html'), accesoJS = lee('assets/acceso.js'), bajaHTML = lee('baja.html');
prueba('privacidad: la Academy es gratuita con cuenta y no guardamos qué lecciones lees',
  /consultar el radar de RWAdar sin registrarte/.test(privacidadLineal) &&
  /y para abrir las lecciones de RWAdar Academy, que son gratuitas/.test(privacidadLineal) &&
  /RWAdar Academy<\/b> es gratuita con una cuenta confirmada/.test(privacidadLineal) &&
  privacidadLineal.includes('para abrir una lección comprobamos tu sesión; no guardamos qué lecciones lees') &&
  /con la que también abres las lecciones de RWAdar Academy/.test(privacidadLineal) &&
  !/consultar la web de RWAdar sin registrarte/.test(privacidadLineal));
prueba('privacidad: los avisos de novedades se explican, ya se activan en Perfil y el correo todavía no sale',
  /<h3 id="avisos-novedades">Avisos de novedades \(correo y notificaciones\)<\/h3>\s*<p><b>Ya puedes activarlos en Perfil › Avisos\.<\/b> El envío por correo todavía no está activo y\s+la casilla del alta todavía no se muestra/.test(privacidad) &&
  !/Todavía no están activos/.test(privacidad) &&
  /casilla aparte y sin marcar/.test(privacidadLineal) && /<code>novedades-v2-2026-11-06<\/code>/.test(privacidad) &&
  !/novedades-v1-2026-11-05/.test(privacidad) &&
  /el permiso se guarda solo cuando confirmas el correo/.test(privacidadLineal) &&
  /La baja corta a la vez los correos y las notificaciones de novedades/.test(privacidadLineal) &&
  /no llevarán píxel de apertura ni seguimiento de clics/.test(privacidadLineal) &&
  /Lettermint, una empresa de los Países Bajos, enviaría los correos/.test(privacidadLineal) && !/Brevo enviaría/.test(privacidadLineal) &&
  /Firebase Cloud Messaging \(FCM\) de Google/.test(privacidadLineal) &&
  /servicio de notificaciones de Apple/.test(privacidadLineal) &&
  /90 días después de terminar/.test(privacidadLineal) && /no se actualicen en 180 días/.test(privacidadLineal) &&
  /Al crear la cuenta confirmas que tienes 18 años o más/.test(privacidadLineal));
// El «latido» de Firebase, que ya ocurre en la app 1.4.2 (APK-1.4.2-NOTIFICACIONES.md, «Al día 06/11/2026, tarde», punto 3).
{
  const firebase = privacidadLineal.slice(privacidadLineal.indexOf('<p id="firebase-android">'));
  prueba('privacidad: el componente de notificaciones de Google de la 1.4.2, sin prometer el botón oculto, y la fecha al día',
    privacidadLineal.includes('<p id="firebase-android"><b>Componente de notificaciones de Google (Firebase) en Android:</b>') &&
    /^[^]*?desde la versión 1\.4\.2, la app de Android lleva el componente de notificaciones de Google \(Firebase Cloud Messaging\)\./.test(firebase) &&
    /^[^]*?Mientras no actives «Notificaciones en este móvil», no envía nada a Google\. Aun así/.test(firebase) &&
    !/hoy ese botón no aparece en la app/.test(firebase) &&
    /^[^]*?las fechas recientes en que se abrió la app \(hasta 30\)/.test(firebase) &&
    // Lo que manda Firebase y para qué, según la guía de Google para Play (firebase.google.com/docs/android/play-data-disclosure):
    // el «Firebase user agent», para sus estadísticas internas, no para entregar las notificaciones (revisión del 07/11/2026).
    /^[^]*?Google recibe esas fechas junto con qué componentes de Firebase lleva la app y sus versiones, y datos técnicos del móvil \(versión de Android, marca, modelo, tipo de dispositivo y tienda desde la que se instaló la app\)\. Según Google, los usa para sus estadísticas internas de uso de esos componentes, sin unirlos a un identificador de la persona ni del móvil\./.test(firebase) &&
    !/solo para su uso|para poder entregarlas/.test(firebase.slice(0, firebase.indexOf('</p>'))) &&
    // Anexo legal del 12/11/2026, apartado 2: el envío del latido se basa en el consentimiento de quien pulsa el botón.
    /^[^]*?del móvil\. Al activar las notificaciones consientes también ese envío \(art\. 22\.2 de la Ley 34\/2002\); si no las activas, verás los mismos avisos en Inicio\. Esas fechas se borran/.test(firebase) &&
    // El botón de RWAdar no las borra: hay que decirlo, está en la misma pantalla de la app.
    /^[^]*?Esas fechas se borran del móvil al desinstalar la app o al borrar sus datos desde los ajustes de Android\. El botón «Borrar datos del dispositivo» de RWAdar no las borra\.<\/p>/.test(firebase) &&
    privacidadLineal.indexOf('<p id="firebase-android">') < privacidadLineal.indexOf('<h2>6 · Correos de servicio</h2>') &&
    privacidadLineal.includes('<a href="#firebase-android">apartado 5</a>') &&
    // 14/11/2026: notificaciones sin cuenta (§6 «Notificaciones sin cuenta»). 21/11/2026: la campana sin cuenta.
    privacidad.includes('Versión revisada el <time datetime="2026-11-21">21 de noviembre de 2026</time>'));
}
// Revisión legal del 06/11/2026: lo que ya es cierto con los avisos todavía apagados.
const seccionAvisos =privacidadLineal.slice(privacidadLineal.indexOf('<h3 id="avisos-novedades">'), privacidadLineal.indexOf('<h2 id="consultas-b2b">'));
const seccionCondiciones = privacidadLineal.slice(privacidadLineal.indexOf('<h3 id="condiciones">'), privacidadLineal.indexOf('<h3 id="mapa-ubicacion">'));
prueba('privacidad: condiciones de la cuenta dentro de #condiciones (adonde va /condiciones)',
  /<p id="condiciones-cuenta"><b>Condiciones de la cuenta\.<\/b>/.test(seccionCondiciones) &&
  /<li>Es gratuita y personal\.<\/li>/.test(seccionCondiciones) &&
  /<li>Es solo para mayores de 18 años\.<\/li>/.test(seccionCondiciones) &&
  /lecciones de RWAdar Academy, para tu uso personal: no se pueden redistribuir/.test(seccionCondiciones) &&
  /Puedes borrarla cuando quieras desde Perfil/.test(seccionCondiciones) &&
  /lo avisaremos en la web y, cuando el cambio sea importante, te pediremos que las aceptes de nuevo/.test(seccionCondiciones));
prueba('privacidad: baja, retirada, conservación bloqueada y Lettermint (UE, sin el nombre ni seguimiento) en los avisos',
  /<b>Ya puedes activarlos en Perfil › Avisos\.<\/b>/.test(seccionAvisos) && /fichas nuevas en el radar/.test(seccionAvisos) &&
  !/ofertas nuevas/.test(seccionAvisos) &&
  /darte de baja en Perfil y, cuando haya correos, con el enlace de cada\s+correo/.test(seccionAvisos) &&
  // La baja en cada notificación de la web (LSSI, art. 21.2, párr. 2): la lista de avisos la indica.
  /Cada notificación de la web abre la lista de\s+tus avisos, donde se indica cómo darte de baja/.test(seccionAvisos) &&
  /Las notificaciones al móvil ya llegan, desde el\s+12\/11\/2026, a quien las activa\./.test(seccionAvisos) &&
  !/si activas las notificaciones, llegan a tu móvil/.test(seccionAvisos) &&
  /Las notificaciones también se quitan en los ajustes del móvil/.test(seccionAvisos) &&
  seccionAvisos.includes('Puedes retirar tu permiso cuando quieras, sin que afecte a los envíos anteriores.') &&
  /el permiso y su historial de altas y bajas, mientras exista la cuenta/.test(seccionAvisos) &&
  /queda bloqueado durante 3 años, solo para atender reclamaciones \(art\. 32 de la Ley Orgánica 3\/2018, LOPDGDD\)/.test(seccionAvisos) &&
  !/se borra todo lo anterior/.test(privacidadLineal) &&
  /recibiría tu dirección de correo y el contenido del mensaje, no tu nombre/.test(seccionAvisos) &&
  !/el nombre si existe/.test(privacidadLineal) &&
  /guarda y trata esos datos en la UE\./.test(seccionAvisos) &&
  privacidadLineal.includes('<li><b>Lettermint</b> (Países Bajos) — solo si se activa en el futuro el envío de avisos por correo; ' +
    'enviaría esos correos y recibiría tu dirección de correo y el contenido del mensaje necesario para entregarlo, no tu nombre. ' +
    'Los correos irían sin píxel de apertura ni seguimiento de clics. Lettermint guarda y trata en la UE los datos de los correos, ' +
    'y su contrato de encargo del tratamiento forma parte de sus condiciones. Consulta su ' +
    '<a href="https://lettermint.co/privacy-policy" rel="noopener">política de privacidad</a> y su ' +
    '<a href="https://lettermint.co/dpa" rel="noopener">contrato de encargo</a>.</li>') &&
  !/<b>Brevo<\/b> — solo si se activa/.test(privacidadLineal) &&
  /historial de ese permiso \(sus altas y bajas\), que queda bloqueado durante 3 años/.test(privacidadLineal) &&
  /documentados en el registro de actividades de tratamiento de RWAdar/.test(privacidadLineal) &&
  !/deben documentarse en el registro interno/.test(privacidadLineal));
prueba('privacidad: notificaciones en la web (qué se guarda, quién las entrega, cifradas, cuándo se borran) y lo que guarda el navegador',
  privacidadLineal.includes('<li id="notificaciones-web"><b>Notificaciones en la web:</b> solo se ofrecen en móviles y tabletas') &&
  /guardamos en tu cuenta la suscripción de tu navegador: la dirección del servicio de\s+notificaciones de tu navegador y sus dos claves de cifrado/.test(privacidadLineal) &&
  /Se borra al desactivarlas, al\s+cerrar sesión, cuando ese servicio la da por caducada, tras 180 días sin entrar en tu\s+cuenta desde ese navegador o al borrar la cuenta/.test(privacidadLineal) &&
  // La web renueva la suscripción al entrar (db/32 borra las que llevan 180 días sin renovarse).
  /la de la web, también cuando su servicio la da por\s+caducada o tras 180 días sin entrar en tu cuenta desde ese navegador/.test(privacidadLineal) &&
  /Apple \(Safari\), Google \(Chrome y la mayoría de navegadores de\s+Android\), Mozilla \(Firefox\) o Microsoft \(Edge\)/.test(privacidadLineal) &&
  /cifrada de extremo a\s+extremo con las claves de tu navegador, así que ese servicio no puede leer su texto/.test(privacidadLineal) &&
  /<b>Servicios de notificaciones de los navegadores<\/b> \(Apple, Google, Mozilla o Microsoft,/.test(privacidadLineal) &&
  // Desde la migración 33 las envía Supabase (pg_net) y las cifra y entrega el servidor de la web en Cloudflare
  // (/api/interno/webpush): destinatarios (art. 13.1.e), los dos ya encargados con contrato. GitHub ya no
  // interviene (solo envía la prueba a las cuentas de administración, que son los datos del titular).
  /Las envía\s+la base de datos de RWAdar \(Supabase\) a través del servidor de su web \(Cloudflare\), que\s+las cifra y las entrega sin guardarlas\s+\(<a href="#proveedores-cloudflare">apartado 8<\/a>\)/.test(privacidadLineal) &&
  /<li id="proveedores-cloudflare"><b>Cloudflare Pages<\/b>/.test(privacidad) &&
  /si\s+activas las notificaciones en la web, el servidor de la web cifra y entrega cada una: para\s+cada envío recibe de la base de datos de RWAdar la dirección de entrega de tu navegador,\s+sus dos claves de cifrado y el texto del aviso, nunca tu correo, y no los guarda al\s+terminar el envío/.test(privacidadLineal) &&
  /Guarda también la suscripción de las notificaciones en la web\s+y desde allí se pide cada envío al servidor de la web/.test(privacidadLineal) &&
  /<li id="proveedores-github"><b>GitHub<\/b>/.test(privacidad) && /GitHub no interviene en las notificaciones de la web\./.test(privacidadLineal) &&
  !/GitHub Actions|servidores de GitHub|GitHub, que envía/.test(privacidadLineal) &&
  privacidadLineal.includes('GitHub, Google LLC y Microsoft Corporation están adheridas al Marco de Privacidad de Datos UE-EE. UU.') &&
  // Anexo legal del 12/11/2026 (docs/legal/ANEXO-NOTIFICACIONES-2026-11-12.md): la garantía de cada servicio de push,
  // comprobada en la lista oficial del DPF, en lugar de la promesa de comprobarla. Ni Apple ni Mozilla figuran como adheridas.
  !/se comprobará la garantía/.test(privacidadLineal) &&
  (privacidadLineal.match(/[^.]*están adheridas al Marco de Privacidad de Datos[^.]*\./g) || []).length === 1 &&
  !/Apple|Mozilla/.test(privacidadLineal.match(/[^.]*están adheridas al Marco de Privacidad de Datos[^.]*\./)?.[0] ?? 'Apple') &&
  privacidadLineal.includes('<a href="https://www.dataprivacyframework.gov/list" rel="noopener">dataprivacyframework.gov</a>') &&
  /sus garantías se explican <a href="#garantias-push">debajo de esta lista<\/a>/.test(privacidadLineal) &&
  privacidadLineal.includes('<p id="garantias-push"><b>Servicios de notificaciones de los navegadores:</b> comprobado el 12 de noviembre de 2026. No trabajan por encargo de RWAdar: los elige tu navegador') &&
  privacidadLineal.includes('Sobre ti, de RWAdar solo reciben la dirección que ellos mismos dieron a tu navegador, la hora y el tamaño de cada notificación y su texto cifrado, que no pueden leer.') &&
  privacidadLineal.includes('en el EEE responden Google Ireland Limited y Microsoft Ireland Operations Limited, y Google LLC y Microsoft Corporation están en el Marco UE-EE. UU.') &&
  privacidadLineal.includes('<li><b>Apple</b> (Safari y las webs añadidas a la pantalla de inicio del iPhone y el iPad): no está en el Marco UE-EE. UU. Según su política de privacidad, los datos de las personas del EEE los controla Apple Distribution International Limited, en Irlanda, y Apple los saca del EEE con cláusulas contractuales tipo.</li>') &&
  privacidadLineal.includes('<li><b>Mozilla</b> (Firefox): no está en el Marco UE-EE. UU. Según su aviso de privacidad, Mozilla y sus servidores están en Estados Unidos, y usa cláusulas contractuales tipo cuando corresponde.') &&
  privacidadLineal.includes('no actives las notificaciones en el móvil: verás los mismos avisos en la campana de tu cuenta. RWAdar no promete que cada notificación llegue') &&
  /<td>Avisos leídos y <br>número del icono<\/td>/.test(privacidad) &&
  /Es lo estrictamente necesario para esas funciones y no sale del navegador/.test(privacidadLineal) &&
  /el número vuelve a 0 al ver los avisos o al cerrar sesión/.test(privacidadLineal) &&
  /<b>Base jurídica:<\/b> tu consentimiento/.test(seccionAvisos));
prueba('privacidad: los datos locales cuentan la vuelta a la lección de 24 horas y su borrado',
  /En la web, al crear la cuenta desde una lección, el navegador guarda durante 24 horas a qué lección volver; se borra al usarlo o al caducar\./.test(privacidadLineal) &&
  /const CLAVE_VOLVER = 'rwadar\.alta\.volver', DURACION_VOLVER = 24 \* 60 \* 60 \* 1000;/.test(accesoJS) &&
  /\n  limpiarVolver\(\);\n/.test(accesoJS));
// Texto versionado v2 y la información básica (fuera de la versión), en /acceso y en Perfil.
const TEXTO_AVISOS_V2 = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en ';
const INFO_DATOS = 'Información básica sobre tus datos. Responsable: el titular de RWAdar (persona física), identificado con nombre, NIF y domicilio en el aviso legal. Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en rwadares@gmail.com; también puedes reclamar ante la AEPD. Más información en ';
// 12/11/2026: el nombre del titular ya no sale en la información básica (petición de Víctor); en la web,
// «aviso legal» enlaza a sus datos (/privacidad#aviso-legal), que son lo único que lo identifica.
const INFO_DATOS_HTML = INFO_DATOS.replace(' domicilio en el aviso legal.', ' domicilio en el <a href="/privacidad#aviso-legal">aviso legal</a>.');
// 12/11/2026: Perfil › Avisos encendido en la web; la casilla del alta, con su propio interruptor, sigue apagada.
prueba('acceso y Perfil: casilla de 18 años, casilla de avisos del alta apagada y Perfil › Avisos encendido',
  /Tengo 18 años o más, acepto las <a href="\/privacidad#condiciones">condiciones<\/a> y he leído la <a href="\/privacidad">privacidad<\/a>\./.test(accesoHTML) &&
  accesoHTML.includes('<label id="campo-avisos-novedades" hidden class="consentimiento"><input id="avisos-novedades" type="checkbox">' + TEXTO_AVISOS_V2 + '<a href="/privacidad#avisos-novedades">Privacidad</a>.</label>') &&
  accesoHTML.includes('<div id="info-datos" hidden class="consentimiento">' + INFO_DATOS_HTML + '<a href="/privacidad">Privacidad</a>.</div>') &&
  panelPerfilHTML.includes('<span>' + TEXTO_AVISOS_V2 + '<a href="/privacidad#avisos-novedades">Privacidad</a>.</span>') &&
  panelPerfilHTML.includes('<p class="perfil-aviso-detalle" id="perfilNovedadesDatos">' + INFO_DATOS_HTML + '<a href="/privacidad">Privacidad</a>.</p>') &&
  / const VERSION_AVISOS_NOVEDADES='novedades-v2-2026-11-06';/.test(js) &&
  /const AVISOS_CASILLA_ALTA = false;/.test(accesoJS) && !/AVISOS_NOVEDADES_REMOTOS =/.test(accesoJS) &&
  / const AVISOS_NOVEDADES_REMOTOS=true;/.test(js) && / const AVISOS_BANDEJA_REMOTA=true;/.test(js) && / const AVISOS_WEBPUSH_REMOTO=true;/.test(js) &&
  /<div id="perfilAvisosProximamente">\s*<article class="movil-estado">/.test(panelPerfilHTML) &&
  /<div id="perfilAvisosNovedades" hidden>\s*<article class="movil-estado">/.test(panelPerfilHTML) &&
  !/<article class="movil-estado"[^>]*\shidden/.test(panelPerfilHTML) &&
  /Los avisos llegarán a la app en una próxima actualización\./.test(panelPerfilHTML));
// 12/11/2026, Víctor: «No quiero que salga mi nombre aquí». Fuera del aviso legal y la privacidad
// (LSSI, art. 10; RGPD, art. 13) la web no lo enseña; las direcciones de GitHub no son texto de cara a nadie.
{
  const conNombre = [];
  const recorrer = carpeta => {
    for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = path.join(carpeta, entrada.name);
      if (entrada.isDirectory()) { recorrer(ruta); continue; }
      if (!/\.(?:html|js|json|xml|txt|webmanifest)$/.test(entrada.name)) continue;
      const relativa = path.relative(sitio, ruta).split(path.sep).join('/');
      if (relativa === 'privacidad.html') continue;
      if (conElNombre(relativa, fs.readFileSync(ruta, 'utf8'))) conNombre.push(relativa);
    }
  };
  // El nombre completo, en cualquier sitio; el de pila, en los comentarios del HTML, que el publicador
  // no quita (los del JS y el CSS, sí). Los datos (noticias, fichas) pueden nombrar a otros «Víctor».
  const conElNombre = (relativa, contenido) => {
    const texto = contenido.replace(/victorJorques/g, '');
    return /Jorques|V[íi]ctor Manuel/i.test(texto) ||
      (relativa.endsWith('.html') && (texto.match(/<!--[\s\S]*?-->/g) || []).some(c => /V[íi]ctor/i.test(c)));
  };
  recorrer(sitio);
  // Y lo publicado, ya reducido, salvo la privacidad y lo que Pages no sirve (_worker.js y _redirects).
  for (const relativa of archivosPublicados) {
    if (['privacidad.html', '_worker.js', '_redirects'].includes(relativa)) continue;
    if (!/\.(?:html|js|css|json|xml|txt|webmanifest|svg)$/.test(relativa)) continue;
    if (conElNombre(relativa, fs.readFileSync(path.join(publicado, ...relativa.split('/')), 'utf8'))) conNombre.push(`publicado/${relativa}`);
  }
  const enAvisos = require('./rwadar-site/assets/idioma-en-avisos-20261112.js');
  const enComun = require('./rwadar-site/assets/idioma-en-20261022.js');
  const avisosCuenta = require('./rwadar-movil/lib/avisos-cuenta.js');
  // En la web el texto llega en trozos (entre los enlaces): cada uno con su inglés y, juntos, el de la app.
  const trozos = INFO_DATOS.split(' aviso legal').map(t => t.trim());
  const ingles = enAvisos[trozos[0]] + ' ' + enAvisos['aviso legal'] + enAvisos[trozos[1]] + ' ' + enComun.Privacidad + '.';
  prueba(`información básica sin el nombre del titular fuera de la privacidad (con él: ${conNombre.join(', ') || 'ninguno'}), «aviso legal» enlazado y su inglés igual que en la app`,
    conNombre.length === 0 && /Víctor Manuel Jorques Granero/.test(privacidad) &&
    INFO_DATOS + 'Privacidad.' === avisosCuenta.INFO_BASICA_ES && trozos.length === 2 &&
    ingles === avisosCuenta.INFO_BASICA_EN && enComun[avisosCuenta.INFO_BASICA_ES] === avisosCuenta.INFO_BASICA_EN &&
    js.includes(" const conEnlacesInfoDatos=texto=>conEnlacePrivacidad(texto,'/privacidad')") &&
    js.includes("'<p class=\"perfil-nota perfil-ayuda\">'+conEnlacesInfoDatos(INFO_DATOS_AVISOS)+'</p>'+"));
}
// 12/11/2026, Víctor: «todo lo que puedas quitar mi nombre hazlo». Los enlaces a la app de Android van
// a /android (la redirección de _redirects), no a la dirección de GitHub, que lleva su usuario.
{
  const conGithub = [];
  const recorrer = carpeta => {
    for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = path.join(carpeta, entrada.name);
      if (entrada.isDirectory()) { recorrer(ruta); continue; }
      const relativa = path.relative(sitio, ruta).split(path.sep).join('/');
      if (relativa === '_redirects') continue;
      if (/victorJorques/i.test(fs.readFileSync(ruta, 'latin1'))) conGithub.push(relativa);
    }
  };
  recorrer(sitio);
  const generadores = ['rwadar-fichas.js', 'rwadar-academy.js', 'rwadar-publicar.js'].filter(f => /victorJorques/i.test(fs.readFileSync(path.join(raiz, f), 'utf8')));
  const accesoHTML = lee('acceso.html');
  prueba(`la app de Android se enlaza por /android, sin el usuario de GitHub en la web (con él: ${[...conGithub, ...generadores].join(', ') || 'ninguno'})`,
    conGithub.length === 0 && generadores.length === 0 &&
    accesoHTML.includes('<a href="/android" target="_blank" rel="noopener">Descubre la app para Android <span aria-hidden="true">↗</span></a>') &&
    /^\/android +https:\/\/github\.com\/[^/\s]+\/RWAdar-downloads\/releases\/latest +302$/m.test(lee('_redirects')));
}
// Campana con número y «Notificaciones en este móvil» (12/11/2026): su inglés va en un diccionario
// solo de la web (el común es copia exacta del de la app), cargado entre el común y el motor.
{
  const enComun = require('./rwadar-site/assets/idioma-en-20261022.js');
  const enAvisos = require('./rwadar-site/assets/idioma-en-avisos-20261112.js');
  const textosPush = [...(js.match(/ const TEXTOS_PUSH=\{([\s\S]*?)\n \};/) || [, ''])[1].matchAll(/:'([^']+)'/g)].map(m => m[1]);
  // Por qué no se han podido activar (12/11/2026): cada motivo, también en inglés.
  const textosActivar = [...(js.match(/ const TEXTOS_ACTIVAR_PUSH=\{([\s\S]*?)\n \};/) || [, ''])[1].matchAll(/:'([^']+)'/g)].map(m => m[1]);
  const fijos = ['Avisos, ninguno sin leer', 'Tus avisos', 'Ver tus avisos', 'Notificaciones y avisos en Perfil', 'Sin leer',
    'Avisos de RWAdar', 'Fichas nuevas y novedades', 'Cargando los avisos…',
    'Notificaciones en este móvil', 'Activar notificaciones en este móvil', 'Desactivar las notificaciones de este móvil', 'Ver cómo añadirla',
    'Pulsa el botón Compartir (un cuadrado con una flecha hacia arriba).', 'Elige «Añadir a pantalla de inicio» y pulsa Añadir.',
    'Abre RWAdar desde el icono nuevo, entra en tu cuenta y vuelve a Perfil › Avisos.', 'Un momento…',
    'Notificaciones activadas en este móvil.', 'Notificaciones desactivadas en este móvil.',
    'El envío por correo todavía no está activo.', 'El envío por correo y al móvil todavía no está activo. Mientras tanto, los avisos se ven en la campana.',
    '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.',
    'Entra en tu cuenta para ver tus avisos. ¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.',
    'Notificaciones activadas en este móvil. Te llegarán cuando empecemos a enviarlas.',
    'Avisos de novedades activados. Puedes darte de baja aquí cuando quieras.',
    // Junto al botón (anexo legal, 2.4): el trozo antes del enlace a Privacidad.
    'El servicio de tu navegador puede estar fuera de la UE: ve la hora de cada aviso, pero no puede leer su texto. Si no las activas, seguirás viendo los avisos en la campana. Más en'];
  const sinIngles = [...textosPush, ...textosActivar, 'Reintentar', 'Entrar de nuevo', ...fijos].filter(t => typeof (enAvisos[t] ?? enComun[t]) !== 'string');
  const scriptsIndex = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
  /* Desde el 13/11/2026 los diccionarios no se piden con <script>: van, en este orden, en
     data-idioma-en de idioma-previo (en <head>), que los carga antes del motor solo en inglés. */
  const enDiferido = (html.match(/<script src="\/assets\/idioma-previo-20261104\.js" data-idioma-en="([^"]+)"><\/script>/) || [, ''])[1].split(' ');
  const iComun = enDiferido.indexOf('/assets/idioma-en-20261022.js'), iAvisos = enDiferido.indexOf('/assets/idioma-en-avisos-20261112.js');
  prueba(`campana y notificaciones: cada texto tiene su inglés (sin traducir: ${sinIngles.join(' | ') || 'ninguno'}) y el diccionario de la web va entre el común y el motor`,
    textosPush.length === 16 && textosActivar.length === 6 && sinIngles.length === 0 && iComun === 0 && iAvisos === 1 && enDiferido.length === 2 &&
    scriptsIndex.indexOf('/assets/idioma-previo-20261104.js') === 0 && scriptsIndex.includes('/assets/idioma-20261022.js') &&
    !scriptsIndex.some(ruta => /\/assets\/idioma-en-/.test(ruta)) &&
    Object.keys(enAvisos).every(k => !Object.hasOwn(enComun, k)) &&
    /const suma=Object\.assign\(\{\},extra,base\);/.test(lee('assets/idioma-en-avisos-20261112.js')));
  // 12/11/2026, Víctor en su iPhone: el bloque se quedaba en «Comprobando…». Cada llamada lleva plazo y el
  // fallo se dice: sin sesión, «Entrar de nuevo»; otro fallo, «Reintentar» (las pruebas de Chromium, en
  // rwadar-acceso/notificaciones-fallos-navegador.test.mjs).
  prueba('notificaciones: con plazo y nunca «Comprobando…» para siempre (sin sesión, «Entrar de nuevo»; otro fallo, «Reintentar»)',
    js.includes(' const PLAZO_AVISOS_MS=15000;') &&
    js.includes("estadoNovedades(await conPlazo(rest('/rpc/estado_mis_avisos'") &&
    js.includes("conPlazo(rest('/rpc/mi_aviso_webpush_registrado'") && js.includes("conPlazo(rest('/rpc/clave_publica_webpush'") &&
    js.includes("conPlazo(rest('/rpc/registrar_aviso_webpush'") &&
    js.includes('data-push-reintentar hidden>Reintentar</button>') && js.includes('data-push-entrar hidden>Entrar de nuevo</button>') &&
    js.includes("else if(t.closest('[data-push-reintentar]'))reintentarPush();") && js.includes("else if(t.closest('[data-push-entrar]'))entrarPush();") &&
    /if\(fallo==='sesion'\|\|novedadesError==='sesion'\)return 'sesion-caducada';/.test(js) &&
    /if\(fallo\|\|novedadesError\)return 'error-comprobar';/.test(js));
  // 21/11/2026, la dirección: «me gustaría que los avisos salieran en Inicio arriba a la derecha, al lado
  // del interrogante» y «al leerlas, desaparezca como que está pendiente». La campana es para todos (sin
  // sesión, los avisos publicados, con lo visto en una clave propia del navegador que borra «Borrar lo
  // guardado aquí»), en el móvil va justo a la izquierda del «?» y redonda como él, y sin «Marcar como
  // leídos»: la lista de Perfil se da por vista tras 1,5 s en pantalla (en Chromium, en
  // rwadar-acceso/campana-avisos-navegador.test.mjs).
  const cssPlano = css.replace(/\n\s*/g, '');
  const campanaMovil = html.indexOf('id="movilAvisos"'), ayudaMovil = html.indexOf('data-movil-action="ayuda"'), descargaMovil = html.indexOf('class="movil-cabecera-accion movil-descarga"');
  prueba('campana para todos: sin sesión cuenta los avisos publicados con su propia clave, junto al «?» y redonda, y sin «Marcar como leídos»',
    js.includes(" const CLAVE_LEIDOS_PUBLICOS='rwadar.avisos.leidos.publicos.v1';") &&
    /function modoCampana\(\)\{\n  if\(identidadConfirmada&&ses\)return AVISOS_BANDEJA_DISPONIBLE\?'cuenta':'';/.test(js) &&
    js.includes("return restauracionCuenta||!sesionResuelta?'comprobando':'publico';") &&
    js.includes("for(const id of ['btnAvisos','movilAvisos']){const b=$(id);if(b)b.addEventListener('click',()=>abrirCampana(b));}") &&
    js.includes("if(modo==='publico'){abrirAvisosSinCuenta(origen);return;}") &&
    js.includes("const {status,j}=await pedirSinCuenta('/api/avisos/recientes');") &&
    /function avisosPublicosVistos\(\)\{[\s\S]{0,400}guardarLeidosPublicos\(/.test(js) &&
    js.includes("Cuenta.olvidarAvisosVistosAqui();") && js.includes("try{localStorage.removeItem(CLAVE_LEIDOS_PUBLICOS);}catch(e){}") &&
    !/data-avisos-marcar|bandeja-marcar|Marcar como leídos<\/button>/.test(js + css + html) &&
    js.includes(' const VISTA_BANDEJA_MS=1500;') && /new IntersectionObserver\(entradas=>\{\n      if\(vistaBandeja\.obs!==obs\)return;/.test(js) &&
    js.includes('if(!vistaBandeja.obs)vistaBandeja.visible=true;') &&
    campanaMovil > 0 && descargaMovil > campanaMovil && ayudaMovil > descargaMovil &&
    /\.movil-cabecera-accion\.movil-campana\{margin-right:47px\}/.test(cssPlano) &&
    /\.hdr-campana\{[^}]*border-radius:var\(--r-p\)/.test(cssPlano) &&
    /Sin cuenta, recuerda igual qué avisos publicados has visto en la campana/.test(privacidad.replace(/\s+/g, ' ')));
  prueba('campana: botones en las dos cabeceras (ocultos hasta que arranca la cuenta), número oculto al nacer, anuncio educado y hueco de las notificaciones en Perfil',
    /<button class="hdr-campana campana" id="btnAvisos" type="button" hidden aria-label="Avisos, ninguno sin leer">/.test(html) &&
    /<button class="movil-cabecera-accion movil-campana campana" id="movilAvisos" type="button" hidden aria-label="Avisos, ninguno sin leer">/.test(html) &&
    /<span class="campana-n" id="btnAvisosN" aria-hidden="true" translate="no" hidden>0<\/span>/.test(html) &&
    /<p class="solo-lector" id="avisosAnuncio" aria-live="polite" aria-atomic="true"><\/p>/.test(html) &&
    /<div id="perfilPushHueco" hidden><\/div>/.test(panelPerfilHTML) && /<p class="perfil-aviso-detalle" id="perfilNovedadesCorreo" hidden><\/p>/.test(panelPerfilHTML) &&
    /navigator\.setAppBadge/.test(js) && /navigator\.clearAppBadge/.test(js) && /CLAVE_LEIDOS='rwadar\.avisos\.leidos\.v1:'/.test(js) &&
    /self\.addEventListener\('push'/.test(sw) && /showNotification\(/.test(sw) && /self\.addEventListener\('notificationclick'/.test(sw));
  // Revisión del 12/11: la baja en cada notificación (LSSI, art. 21.2, párr. 2), suscribirse con el envío
  // apagado (para probar antes), abrir la campana ya es ver los avisos, y sin «badge» opaco.
  prueba('notificaciones: cada una lleva a la lista con la baja a la vista en un pie fijo (?avisos=1), se pueden activar con el envío apagado y abrir la campana pone el número a 0',
    js.includes("'<p class=\"avisos-baja\" id=\"avisosDialogoBaja\">¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.</p>'") &&
    // La baja y su botón, en un pie fijo fuera de la lista que se desplaza: se ven al abrir con 10 avisos.
    js.includes("'<div class=\"avisos-dialogo-cuerpo\"><div id=\"avisosDialogoLista\"></div></div>'+") &&
    js.includes("'<div class=\"avisos-dialogo-pie\">'+") &&
    /\.avisos-dialogo \.escaparate-dialogo-marco\{[^}]*grid-template-rows:auto minmax\(0,1fr\) auto/.test(css.replace(/\n\s*/g, '')) &&
    /searchParams\.get\('avisos'\)==='1'/.test(js) && js.includes("e.data.tipo==='abrir-avisos')abrirAvisosPedido()") &&
    sw.includes("ventana.postMessage({ tipo: 'abrir-avisos' })") &&
    !/if\(!novedades\.push_activo\)return 'pendiente';/.test(js) && /clavePush\.valor===null\)return 'pendiente'/.test(js) &&
    /function avisosVistos\(\)\{/.test(js) && /pintarBandeja\(\);pintarCampana\(\);avisosVistos\(\);/.test(js) &&
    !/badge:/.test(sw.replace(/\/\*[\s\S]*?\*\//g, '')) && !/badge:'\/icono-192\.png'/.test(js) &&
    /--globo:#D92D20;/.test(css) && /\.campana-n\{[^}]*background:var\(--globo\)/.test(css.replace(/\n\s*/g, '')));
  // Primera capa junto al botón (condiciones C2 y C5 del anexo legal): las frases de la web y de la app son
  // las del anexo, palabra por palabra y con su inglés, y «Más en Privacidad» lleva a un apartado que existe.
  const anexo = fs.readFileSync(path.join(raiz, 'docs/legal/ANEXO-NOTIFICACIONES-2026-11-12.md'), 'utf8')
    .replace(/^> ?/gm, '').replace(/\*\*(ES|EN):\*\* /g, '').replace(/\s+/g, ' ');
  const quienWeb = (js.match(/ const TEXTO_PUSH_QUIEN='([^']+)';/) || [, ''])[1];
  const avisosMovil = fs.readFileSync(path.join(raiz, 'rwadar-movil/componentes/AvisosNovedades.js'), 'utf8');
  const quienMovil = (avisosMovil.match(/\nconst TEXTO_MOVIL_QUIEN = '([^']+)';/) || [, ''])[1];
  const webSinEnlace = quienWeb.replace(/ Más en Privacidad\.$/, '');
  const enWeb = enAvisos[webSinEnlace + ' Más en'] || '', enMovil = enComun[quienMovil] || '';
  prueba('notificaciones: junto al botón, la frase del anexo legal en la web y en la app (con su inglés) y el enlace a #garantias-push',
    quienWeb.endsWith(' Más en Privacidad.') && webSinEnlace.length > 80 && anexo.includes(webSinEnlace) &&
    anexo.includes(enWeb.replace(/ More in$/, '')) && enWeb.endsWith(' More in') &&
    quienMovil.length > 80 && anexo.includes(quienMovil) && enMovil.length > 80 && anexo.includes(enMovil) &&
    js.includes("conEnlacePrivacidad(TEXTO_PUSH_QUIEN,'/privacidad#garantias-push')") && /<p id="garantias-push">/.test(privacidad) &&
    /Si no las activas, seguirás viendo los avisos en la campana\./.test(quienWeb) && /Firebase/.test(quienMovil));
}
marcadoEstricto('baja.html', bajaHTML);
// El mismo asunto que el pie y List-Unsubscribe de los correos de avisos.
const MAILTO_BAJA = 'mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';
prueba('baja: sin indexar, fuera del sitemap, sin formulario y con la baja por correo a la vista, también sin JavaScript',
  /<meta name="robots" content="noindex,nofollow">/.test(bajaHTML) &&
  /<script defer src="\/assets\/baja-20261105\.js"><\/script>/.test(bajaHTML) &&
  !/<form\b/i.test(bajaHTML) && bajaHTML.includes('href="' + MAILTO_BAJA + '"') &&
  [...bajaHTML.matchAll(/href="(mailto:[^"]+)"/g)].every(m => m[1] === MAILTO_BAJA) &&
  /<noscript><p class="estado">[^<]*<a href="mailto:rwadares@gmail\.com\?subject=Baja%20de%20los%20avisos%20de%20RWAdar">rwadares@gmail\.com<\/a> con el asunto «Baja de los avisos de RWAdar»/.test(bajaHTML) &&
  lee('assets/baja-20261105.js').includes('con el asunto «Baja de los avisos de RWAdar»') &&
  !/asunto «baja»/.test(bajaHTML + lee('assets/baja-20261105.js')) &&
  !/\/baja</.test(lee('sitemap.xml')));

prueba('los redirects usan sintaxis portable de Cloudflare Pages',
  /^\/index\.html\s+\/\s+301$/m.test(redirecciones) &&
  /^\/privacidad\.html\s+\/privacidad\s+301$/m.test(redirecciones) &&
  /^\/condiciones\s+\/privacidad#condiciones\s+301$/m.test(redirecciones) &&
  /^\/transparencia-comercial\.html\s+\/transparencia-comercial\s+301$/m.test(redirecciones) &&
  /^\/para-empresas\.html\s+\/\s+302$/m.test(redirecciones) && /^\/para-empresas\s+\/\s+302$/m.test(redirecciones) &&
  !/301!/.test(redirecciones));
prueba('security.txt tiene contacto, canonical, política de reporte y caducidad futura',
  /Contact: mailto:rwadares@gmail\.com/.test(lee('.well-known/security.txt')) &&
  /Canonical: https:\/\/rwadar\.pages\.dev\/\.well-known\/security\.txt/.test(lee('.well-known/security.txt')) &&
  /Policy: https:\/\/rwadar\.pages\.dev\/privacidad#reporte-seguridad/.test(lee('.well-known/security.txt')) &&
  !/github\.com/i.test(lee('.well-known/security.txt')) &&
  /Expires: 2027-08-22T00:00:00\.000Z/.test(lee('.well-known/security.txt')));
const fechasSitemap = new Map([...lee('sitemap.xml').matchAll(
  /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g,
)].map(m => [m[1], m[2]]));
const fechaRadarSEO = html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/)?.[1];
const fechaPrivacidadSEO = privacidad.match(/datetime=["'](\d{4}-\d{2}-\d{2})["']/)?.[1];
const fechaTransparenciaSEO = transparenciaComercial.match(/datetime=["'](\d{4}-\d{2}-\d{2})["']/)?.[1];
prueba('la web publicada no cita documentos privados de claude.ai como fuente',
  !/claude\.ai\/code\/artifact/i.test(js) && !/claude\.ai\/code\/artifact/i.test(html));
prueba('sitemap conserva por ruta las fechas reales del radar y de cada política',
  Boolean(fechaRadarSEO && fechaPrivacidadSEO && fechaTransparenciaSEO) &&
  fechasSitemap.get(`${ORIGEN_PUBLICO}/`) === fechaRadarSEO &&
  fechasSitemap.get(`${ORIGEN_PUBLICO}/privacidad`) === fechaPrivacidadSEO &&
  fechasSitemap.get(`${ORIGEN_PUBLICO}/transparencia-comercial`) === fechaTransparenciaSEO &&
  /data-partner-status=["']interest-only["']/.test(paraEmpresas) &&
  !/<loc>https:\/\/rwadar\.pages\.dev\/para-empresas<\/loc>/.test(lee('sitemap.xml')));
prueba('todo el SEO absoluto usa el origen canónico de Cloudflare',
  html.includes(`<link rel="canonical" href="${ORIGEN_PUBLICO}/">`) &&
  transparenciaComercial.includes(
    `<link rel="canonical" href="${ORIGEN_PUBLICO}/transparencia-comercial">`) &&
  paraEmpresas.includes(`<link rel="canonical" href="${ORIGEN_PUBLICO}/para-empresas">`) &&
  /<meta name="robots" content="noindex,nofollow">/.test(paraEmpresas) &&
  !/rwadar\.netlify\.app/.test(html) &&
  lee('robots.txt').includes(`${ORIGEN_PUBLICO}/sitemap.xml`) &&
  (lee('sitemap.xml').match(/https:\/\/rwadar\.pages\.dev/g) || []).length ===
    (lee('sitemap.xml').match(/<loc>/g) || []).length &&
  require('./rwadar-fichas-manifiesto').filter(r=>r.endsWith('.html')).every(r=>
    fechasSitemap.has(`${ORIGEN_PUBLICO}/${r.slice(0,-5)}`)) &&
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
const remotoSinSincronizar = spawnSync(
  process.execPath, ['rwadar-publicar.js','--preview','--sin-sincronizar'], { cwd:raiz, encoding:'utf8' });
prueba('invocar un remoto con --sin-sincronizar falla antes de cualquier otra compuerta',
  remotoSinSincronizar.status===2 && /solo se permite con --local/.test(remotoSinSincronizar.stderr) &&
  !/modo privado y apagado/.test(remotoSinSincronizar.stderr));
// Probar el cierre privado sin que npm test pueda desplegar la versión real.
const publicadorPrivado = publicador.replace(/const MODO_PRIVADO = (?:true|false);/, 'const MODO_PRIVADO = true;');
const remotoBloqueado = spawnSync(process.execPath, ['-e',
  "process.argv=['node','rwadar-publicar.js','--preview'];\n"+publicadorPrivado], { cwd:raiz, encoding:'utf8' });
prueba('invocar un modo remoto falla por privacidad antes de usar red',
  remotoBloqueado.status===2 && /modo privado y apagado/.test(remotoBloqueado.stderr));
prueba('el contrato legal acepta el pendiente transparente y rechaza todo blocker',
  comprobarEstadoLegalPublicacion(privacidad) === 'acuerdo-documentado' &&
  /data-deploy-blocker/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main data-deploy-blocker="legal" data-deploy-legal-status="acuerdo-pendiente-de-documentar">'))))?.message || ''));
const estadoIncompleto = structuredClone(estadoRelanzamiento);
estadoIncompleto.controles.catalogo_actual_y_citable.estado = 'pendiente';
prueba('el contrato remoto rechaza el estado pendiente y un corte incompleto',
  /exige data-deploy-legal-status/.test((await capturaError(Promise.resolve().then(() =>
    comprobarEstadoLegalPublicacion('<main data-deploy-legal-status="titular-identificado-revision-pendiente">', { exigirDocumentado: true }))))?.message || '') &&
  /CONTROL_NO_APROBADO/.test((await capturaError(Promise.resolve().then(() =>
    comprobarPreparacionRelanzamiento(estadoIncompleto, {
      ahora: new Date('2026-09-21T12:00:00.000Z'),
    }))))?.message || ''));
const manifiestoConOk = structuredClone(estadoRelanzamiento);
manifiestoConOk.actualizadoEl = '2026-09-21';
manifiestoConOk.revisionAprobada = {
  commit: 'a'.repeat(40),
  contenidoSha256: `sha256:${'b'.repeat(64)}`,
  alcanceSha256: huellaAlcancePublicacion(manifiestoConOk),
};
for (const control of Object.values(manifiestoConOk.controles)) {
  control.estado = 'aprobado';
  control.evidencias = ['ok'];
}
const fallosEvidenciaTrivial = evaluarPreparacionRelanzamiento(manifiestoConOk, {
  ahora: new Date('2026-09-21T12:00:00.000Z'),
});
prueba('el manifiesto v3 exige fecha reciente y evidencia estructurada no trivial',
  estadoRelanzamiento.version===3 &&
  fallosEvidenciaTrivial.some(({codigo}) => codigo==='EVIDENCIA_INVALIDA') &&
  evaluarPreparacionRelanzamiento({...manifiestoConOk, actualizadoEl:'2026-09-13'}, {
    ahora:new Date('2026-09-21T12:00:00.000Z'),
  }).some(({codigo}) => codigo==='MANIFIESTO_CADUCADO') &&
  evaluarPreparacionRelanzamiento({...manifiestoConOk, actualizadoEl:'2026-02-30'}, {
    ahora:new Date('2026-09-21T12:00:00.000Z'),
  }).some(({codigo}) => codigo==='FECHA_MANIFIESTO_INVALIDA'));
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

console.log('\n=== NOVEDADES DE RWADAR ===');
/* «Novedades de RWAdar» (12/11/2026). Víctor: «que salga al abrir la app y como las novedades, tipo un
   texto informativo muy fácil de leer con las novedades y si clickan que salga en detalle». Una sola
   fuente (/datos/novedades-producto.json) para la ventana de Inicio, /novedades-rwadar/ y la app. Lo que
   hace en el navegador se prueba en rwadar-acceso/novedades-producto-navegador.test.mjs. */
{
  const modelo = require('./rwadar-site/assets/novedades-producto-modelo-20261112.js');
  const { PAGINAS_SECCIONES } = require('./rwadar-publicacion-segura.js');
  const textoJSON = lee('datos/novedades-producto.json');
  const datos = modelo.validarTexto(textoJSON);
  // 1 · La forma del archivo.
  prueba(`el archivo de novedades vale (versión ${datos.version}, ${Buffer.byteLength(textoJSON)} bytes de ${modelo.MAX_BYTES}) y lleva su inglés en «en»`,
    /^\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?$/.test(datos.version) && Buffer.byteLength(textoJSON) <= modelo.MAX_BYTES &&
    datos.titulo === 'Novedades de RWAdar' && datos.en.titulo === 'RWAdar news' &&
    datos.resumen.every(p => p.en.titulo && p.en.texto) && datos.detalle.every(s => s.en.titulo && s.en.parrafos.length === s.parrafos.length));
  prueba('el resumen son 4 o 5 puntos de una línea, cada uno con un icono conocido y su sección en el detalle',
    datos.resumen.length >= 4 && datos.resumen.length <= 5 &&
    datos.resumen.every(p => Object.hasOwn(modelo.ICONOS, p.icono) && datos.detalle.some(s => s.id === p.id) &&
      [p.titulo, p.en.titulo].every(t => t.length <= 45) && [p.texto, p.en.texto].every(t => t.length <= 72)));
  // Desde el 14/11/2026, primero el mercado en directo y las noticias con foto; lo del 11 y el 12/11 sigue debajo.
  const seccionAvisos = datos.detalle.find(s => s.id === 'avisos-movil');
  prueba('el detalle explica lo publicado del 11 al 14/11 en frases cortas (el mercado en directo, las noticias con foto, avisos, el «1», la sesión de 30 días, el correo y la calculadora)',
    ['mercado-directo', 'noticias-foto', 'avisos-movil', 'avisos-sin-leer', 'sesion-30-dias', 'contacto', 'calcula-y-mercado'].every(id => datos.detalle.some(s => s.id === id)) &&
    datos.detalle[0].id === 'mercado-directo' && /cada 5 minutos/.test(datos.detalle[0].parrafos.join(' ')) &&
    /no fotos de la noticia/.test(datos.detalle.find(s => s.id === 'noticias-foto').parrafos.join(' ')) &&
    datos.detalle.every(s => [...s.parrafos, ...s.pasos].every(f => f.split(/(?<=[.:!?])\s+/).every(frase => frase.length <= 160))) &&
    /Perfil › Avisos/.test(JSON.stringify(seccionAvisos)) && /Safari/.test(seccionAvisos.parrafos.join(' ')) &&
    /Mantener la sesión iniciada en este dispositivo/.test(JSON.stringify(datos.detalle)) && /rwadares@gmail\.com/.test(JSON.stringify(datos.detalle)));
  prueba('sin promesas de rentabilidad: la calculadora dice que no es una promesa y que se puede perder dinero',
    !/garantizad|asegurad|sin riesgo|ganar[áa]s|\d+\s?%/i.test(textoJSON) &&
    /No es una promesa de lo que vas a ganar: al invertir puedes perder dinero\./.test(textoJSON) &&
    /It is not a promise of what you will earn: when you invest you can lose money\./.test(textoJSON));
  // La app lleva una copia de respaldo: tiene que decir lo mismo que la web (node rwadar-novedades-producto.js).
  const copiaApp = require('./rwadar-novedades-producto.js');
  prueba('la copia de la app (rwadar-movil/lib/novedades-producto.js y su ejemplo) dice lo mismo que el archivo de la web',
    copiaApp.diferencias().length === 0 &&
    JSON.stringify(require('./rwadar-movil/lib/novedades-producto.js').NOVEDADES_PRODUCTO) === JSON.stringify(JSON.parse(textoJSON)) &&
    fs.readFileSync(copiaApp.COPIA_EJEMPLO, 'utf8') === textoJSON);
  // Lo que solo existe en la web (la campana, «Mantener la sesión iniciada») lo dice, porque la app lee el mismo texto.
  prueba('lo que solo vale en la web lo dice («en la web»): la app no tiene campana ni casilla de sesión',
    [...datos.resumen.map(p => [p.titulo + ' ' + p.texto]), ...datos.detalle.map(s => [...s.parrafos, ...s.pasos].map(f => s.titulo + ' ' + f))].flat()
      .every(t => !/campana|Mantener la sesión/.test(t) || /en la web/i.test(t)) &&
    [...datos.resumen.map(p => [p.en.titulo + ' ' + p.en.texto]), ...datos.detalle.map(s => [...s.en.parrafos, ...s.en.pasos].map(f => s.en.titulo + ' ' + f))].flat()
      .every(t => !/\bbell\b|Keep me signed in/.test(t) || /on the website/i.test(t)));
  // El modelo rechaza lo que no es el contrato (y la web no enseña nada; el publicador no publica).
  const rechaza = cambio => { const d = JSON.parse(textoJSON); cambio(d); try { modelo.validar(d); return false; } catch { return true; } };
  prueba('el modelo rechaza campos desconocidos, falta de inglés, marcado, listas descompensadas, id repetidos, versiones malas y archivos grandes',
    rechaza(d => { d.extra = 1; }) && rechaza(d => { delete d.resumen[0].en; }) && rechaza(d => { d.detalle[0].parrafos[0] = '<b>hola</b>'; }) &&
    rechaza(d => { d.detalle[0].en.parrafos.pop(); }) && rechaza(d => { d.resumen[1].id = d.resumen[0].id; }) &&
    rechaza(d => { d.version = '2026-02-30'; }) && rechaza(d => { d.resumen = []; }) && rechaza(d => { d.resumen[0].texto = ' con espacios'; }) &&
    rechaza(d => { d.detalle[0].pasos[0] = 'línea partida'; }) &&
    (() => { try { modelo.validarTexto(JSON.stringify({ ...JSON.parse(textoJSON), relleno: 'x'.repeat(modelo.MAX_BYTES) })); return false; } catch (e) { return /kB/.test(e.message); } })() &&
    (() => { try { modelo.validarTexto('{'); return false; } catch { return true; } })());
  // «Ya visto»: solo la cadena de la versión, con try/catch; sin almacenamiento, no sale.
  const memoria = {}, almacen = { getItem: k => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = String(v); } };
  const bloqueado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  prueba('lo visto guarda solo la versión (rwadar.novedades.vista), una vez por versión y nunca hacia atrás; sin almacenamiento, no sale',
    modelo.CLAVE_VISTA === 'rwadar.novedades.vista' && modelo.pendiente(almacen, datos.version) && modelo.marcarVista(almacen, datos.version) &&
    JSON.stringify(memoria) === JSON.stringify({ 'rwadar.novedades.vista': datos.version }) && !modelo.pendiente(almacen, datos.version) &&
    modelo.marcarVista(almacen, '2026-11-01') && memoria['rwadar.novedades.vista'] === datos.version &&
    modelo.pendiente(almacen, '2026-11-14.5') && modelo.posterior('2026-11-12.10', '2026-11-12.9') &&
    !modelo.pendiente(bloqueado, datos.version) && modelo.marcarVista(bloqueado, datos.version) === false && !modelo.pendiente(null, datos.version));
  const ui = lee('assets/novedades-producto-20261112.js');
  // Cuándo sale la ventana, sin navegador (revisión del 12/11/2026: en CI no hay Chromium). Funciones puras del modelo
  // con un documento y un almacenamiento falsos; la ventana (assets/novedades-producto-20261112.js) solo las llama.
  {
    const docFalso = ({ dialogo = false, modal = false, local = false } = {}) => ({
      querySelector: sel => (sel === 'dialog[open]' && dialogo) || (sel.startsWith('[aria-modal="true"]') && modal) ? {} : null,
      body: { classList: { contains: c => c === 'detalle-local-abierto' && local } } });
    const nuevoAlmacen = (falla = {}) => {
      const m = {};
      return { m, getItem: k => { if (falla.leer) throw new Error('no'); return m[k] ?? null; },
        setItem: (k, v) => { if (falla.guardar) throw new Error('lleno'); m[k] = String(v); }, removeItem: k => { delete m[k]; } };
    };
    const a = nuevoAlmacen(), v = datos.version;
    const motivo = (extra = {}) => modelo.motivoSinVentana({ busqueda: '', ancla: '', almacen: nuevoAlmacen(), ...extra });
    prueba('la ventana sale si no hay nada encima y espera a otro diálogo (dialog abierto, panel modal, ficha) o a la pestaña oculta',
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso() }) === 'ensenar' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso({ dialogo: true }) }) === 'esperar' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso({ modal: true }) }) === 'esperar' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso({ local: true }) }) === 'esperar' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso(), oculta: true }) === 'esperar' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: null }) === 'esperar' &&
      modelo.marcarVista(a, v) && modelo.estadoVentana({ almacen: a, version: v, doc: docFalso() }) === 'vista' &&
      modelo.estadoVentana({ almacen: a, version: v, doc: docFalso({ dialogo: true }) }) === 'vista');
    prueba('no sale con ?avisos=1, #explain, #perfil-avisos, la vuelta de un correo, en la app, automatizada, sin leer ni sin poder guardar',
      motivo() === '' && motivo({ busqueda: '?avisos=1' }) === 'direccion' && motivo({ busqueda: '?x=1&avisos=1' }) === 'direccion' &&
      motivo({ ancla: '#explain' }) === 'direccion' && motivo({ ancla: '#perfil-avisos' }) === 'direccion' &&
      motivo({ ancla: '#access_token=x&type=signup' }) === 'direccion' && motivo({ ancla: '#error=access_denied' }) === 'direccion' &&
      motivo({ busqueda: '?avisos=0', ancla: '#emisiones' }) === '' && motivo({ enApp: true }) === 'app' &&
      motivo({ automatizado: true }) === 'automatizado' && motivo({ almacen: nuevoAlmacen({ leer: true }) }) === 'sin-lectura' &&
      motivo({ almacen: null }) === 'sin-lectura' && motivo({ almacen: nuevoAlmacen({ guardar: true }) }) === 'sin-guardar' &&
      // La prueba de escritura no deja nada guardado.
      (() => { const b = nuevoAlmacen(); return modelo.puedeGuardar(b) && JSON.stringify(b.m) === '{}'; })());
    prueba('la ventana decide con el modelo (motivoSinVentana y estadoVentana) y no repite la lógica',
      ui.includes('modelo.motivoSinVentana({ ...llegada, enApp: !!globalThis.ReactNativeWebView,') &&
      ui.includes("const ahora = () => modelo.estadoVentana({ almacen, version: datos.version, doc: document, oculta: document.visibilityState === 'hidden' });") &&
      ui.includes("if (estado === 'ensenar') { mostrar(datos, almacen, avisos, rec); return; }") && ui.includes("if (estado === 'esperar') setTimeout(mirar, REVISION_MS);") &&
      !/function hayOtroDialogo|pideOtraCosa/.test(ui));
    /* El recuadro «Activa los avisos» (14/11/2026): «que para activar las notificaciones salga el aviso al salir la
       notificación de novedades al entrar a la app, para recordar e incitar a la gente a que las activen». Sale salvo
       con las notificaciones ya activas en este navegador (soporte, permiso y suscripción de push); si no se sabe, sale. */
    const avisos = (o) => modelo.estadoAvisosNavegador(o);
    prueba('el recuadro «Activa los avisos» sale salvo con las notificaciones activas en este navegador; si no se sabe, sale',
      avisos({ soporte: true, permiso: 'granted', suscrito: true }) === 'activos' &&
      avisos({ soporte: true, permiso: 'granted', suscrito: false }) === 'inactivos' &&
      avisos({ soporte: true, permiso: 'default' }) === 'inactivos' && avisos({ soporte: true, permiso: 'denied', suscrito: true }) === 'inactivos' &&
      avisos({ soporte: true, permiso: 'granted' }) === 'desconocido' && avisos({ soporte: true, permiso: 'raro', suscrito: true }) === 'desconocido' &&
      avisos({ soporte: false, permiso: 'granted', suscrito: true }) === 'desconocido' && avisos() === 'desconocido' &&
      modelo.conRecordatorioAvisos('activos') === false &&
      ['inactivos', 'desconocido', undefined, '', 'basura'].every(e => modelo.conRecordatorioAvisos(e) === true));
    const enComunRec = require('./rwadar-site/assets/idioma-en-20261022.js');
    /* Desde la 2026-11-14.3 (sin cuenta): ARRIBA del cuerpo, antes de los puntos, y su botón, según la web
       (window.RWAdarAvisosSinCuenta.paraVentana): 'directo' activa aquí mismo con el texto versionado a la vista
       (la ventana no pide permisos ella misma: lo hace la web, en el mismo toque), 'instalar' lleva a los pasos
       del iPhone y 'perfil' cierra y lleva a /#perfil-avisos. */
    prueba('el recuadro: arriba, antes de los puntos; «Activar avisos» activa sin cuenta en el mismo toque, lleva a los pasos del iPhone o a /#perfil-avisos; con el inglés del diccionario común',
      ui.includes("if (modelo.conRecordatorioAvisos(avisos)) cuerpo.append(recordatorio(t, rec));\n    cuerpo.append(lista);") &&
      ui.includes('boton.href = RUTA_AVISOS; boton.dataset.novAvisos = \'\'; boton.dataset.novFoco = \'avisos\';') &&
      ui.includes("const promesa = globalThis.RWAdarAvisosSinCuenta.activar('novedades');") &&
      ui.indexOf("const promesa = globalThis.RWAdarAvisosSinCuenta.activar('novedades');") < ui.indexOf("rec.paso = 'espera';") &&
      ui.includes("globalThis.rwadarInstalarIphone(null);") &&
      ui.includes("let avisos = await avisosDelNavegador();") && ui.includes("await modoRecordatorio()") &&
      ui.includes('registro.pushManager.getSubscription()') && !/requestPermission|pushManager\.subscribe|\.subscribe\(/.test(ui) &&
      ui.indexOf("recTit: 'Activa los avisos'") > 0 && ui.indexOf("recTit: 'Turn on alerts'") > 0 &&
      [['Activa los avisos', 'Turn on alerts'], ['Activar avisos', 'Turn on alerts'],
        ['Recibe cada novedad en el móvil, como un WhatsApp. Es gratis y puedes quitar los avisos cuando quieras.',
          'Get RWAdar news on your phone, like a WhatsApp message. It is free and you can turn alerts off whenever you like.']]
        .every(([es, en]) => enComunRec[es] === en && ui.includes(`'${es}'`) && ui.includes(`'${en}'`)) &&
      /\.nov-rec-boton\{[^}]*min-height:48px[^}]*\}/.test(lee('assets/novedades-producto-20261112.css')) &&
      /\.nov-rec-boton:focus-visible\{outline:2px solid var\(--senal\)/.test(lee('assets/novedades-producto-20261112.css')));
  }

  // 2 · Enlaces y piezas: la ventana en Inicio, la página, Perfil (móvil y cuenta) y el pie.
  const pagina = lee('novedades-rwadar/index.html');
  const scriptsInicio = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m => m[1]);
  const scriptsPagina = [...pagina.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m => [m[1], /\bdefer\b/.test(m[0])]);
  marcadoEstricto('novedades-rwadar/index.html', pagina);
  prueba('Inicio carga el modelo y la ventana (defer, antes del catálogo), su hoja y el hueco [data-novedades-producto="ventana"]',
    scriptsInicio.indexOf('/assets/novedades-producto-modelo-20261112.js') >= 0 &&
    scriptsInicio.indexOf('/assets/novedades-producto-modelo-20261112.js') + 1 === scriptsInicio.indexOf('/assets/novedades-producto-20261112.js') &&
    scriptsInicio.indexOf('/assets/novedades-producto-20261112.js') < scriptsInicio.indexOf('/assets/catalogo-publico-20261022.js') &&
    html.includes('<link rel="stylesheet" href="/assets/novedades-producto-20261112.css">') &&
    (html.match(/data-novedades-producto="ventana"/g) || []).length === 1);
  prueba('/novedades-rwadar/ es una sección publicable, con su canonical, un h1, el detalle del archivo, la hoja y los scripts con defer',
    PAGINAS_SECCIONES.includes('novedades-rwadar/index.html') &&
    ['novedades-rwadar/index.html', 'datos/novedades-producto.json', 'assets/novedades-producto-modelo-20261112.js',
      'assets/novedades-producto-20261112.js', 'assets/novedades-producto-20261112.css'].every(x => ARCHIVOS_PUBLICABLES.includes(x)) &&
    pagina.includes('<link rel="canonical" href="https://rwadar.pages.dev/novedades-rwadar/">') && (pagina.match(/<h1\b/g) || []).length === 1 &&
    pagina.includes('<main id="contenido" class="sec sec-estrecha nov-pagina" data-novedades-producto="detalle" aria-busy="true">') &&
    pagina.includes('<link rel="stylesheet" href="/assets/novedades-producto-20261112.css">') &&
    JSON.stringify(scriptsPagina.slice(1, 4)) === JSON.stringify([['/assets/analitica-20260927.js', true],
      ['/assets/novedades-producto-modelo-20261112.js', true], ['/assets/novedades-producto-20261112.js', true]]) &&
    pagina.includes('<p class="nov-estado" id="novEstado" role="status">Cargando las novedades…</p>') && /<noscript>/.test(pagina));
  const hojaNov = lee('assets/novedades-producto-20261112.css');
  const modeloTexto = lee('assets/novedades-producto-modelo-20261112.js');
  prueba('accesible y legible: las listas conservan su papel de lista (VoiceOver), el título no parte palabras y la página enlaza las anteriores',
    pagina.includes('<ul class="nov-puntos" id="novResumen" role="list" hidden></ul>') &&
    /lista\.id = 'novedadesPuntos';\s*lista\.setAttribute\('role', 'list'\);/.test(ui) && /const ol = el\('ol', 'nov-pasos'\);[\s\S]{0,160}ol\.setAttribute\('role', 'list'\);/.test(ui) &&
    !/overflow-wrap:anywhere/.test(hojaNov) &&
    /\.nov-tit\{[^}]*font:700 clamp\(1\.125rem,5\.5vw,1\.375rem\)\/1\.2 var\(--display\)[^}]*overflow-wrap:break-word;hyphens:auto\}/.test(hojaNov) &&
    /\.nov-punto-frase\{[^}]*overflow-wrap:break-word\}/.test(hojaNov) &&
    /<ul class="sec-sigue" aria-label="Sigue por aquí">[\s\S]*<li><a href="\/cambios"><span>Novedades anteriores<\/span>/.test(pagina) &&
    require('./rwadar-site/assets/idioma-en-avisos-20261112.js')['Novedades anteriores'] === 'Earlier news');
  prueba('«Ver en detalle» lleva a /novedades-rwadar/ y la página, a Perfil › Avisos (/#perfil-avisos), que Inicio abre con irAPerfilAvisos',
    modelo.PAGINA === '/novedades-rwadar/' && /ver\.href = modelo\.PAGINA;/.test(ui) && /const RUTA_AVISOS = '\/#perfil-avisos';/.test(ui) &&
    js.includes("if(location.hash!=='#perfil-avisos')return;") && js.includes('Cuenta.irAPerfilAvisos();') &&
    js.includes('irAPerfilAvisos:irAPerfilAvisos,') && js.indexOf("if(location.hash!=='#perfil-avisos')return;") > js.indexOf('const Movil = (function(){'));
  const enComun = require('./rwadar-site/assets/idioma-en-20261022.js');
  const enAvisos = require('./rwadar-site/assets/idioma-en-avisos-20261112.js');
  prueba('Perfil (móvil), la cuenta de escritorio y el pie llevan «Novedades de RWAdar», con su inglés',
    /<a class="movil-menu-fila" href="\/novedades-rwadar\/" data-novedades-producto-enlace="perfil">[\s\S]*?<b>Novedades de RWAdar<\/b><small>Lo nuevo de la web y la app, explicado fácil<\/small>/.test(panelPerfilHTML) &&
    /<h3 id="perfilNovedadesProductoTit">Novedades<\/h3>/.test(panelPerfilHTML) &&
    js.includes(`'<a class="perfil-manual perfil-novedades" href="/novedades-rwadar/" data-novedades-producto-enlace="cuenta">Novedades de RWAdar</a>'+`) &&
    /<footer>[\s\S]*<a href="\/novedades-rwadar\/">Novedades de RWAdar<\/a>[\s\S]*<\/footer>/.test(html) &&
    enComun['Novedades de RWAdar'] === datos.en.titulo && typeof enComun.Novedades === 'string' &&
    enAvisos['Lo nuevo de la web y la app, explicado fácil'] === "What's new on the website and the app, made simple");
  prueba('la ventana y la página: sin innerHTML, con translate="no", y la ventana no sale sin almacenamiento, con ?avisos=1, en la app ni en navegadores automatizados',
    !/innerHTML|insertAdjacentHTML|outerHTML/.test(ui) && ui.includes("n.setAttribute('translate', 'no');") &&
    ui.includes("enApp: !!globalThis.ReactNativeWebView,") && ui.includes("automatizado: globalThis.navigator?.webdriver === true, almacen })) return;") &&
    ui.includes("try { return { busqueda: location.search || '', ancla: location.hash || '' }; } catch { return null; }") &&
    modeloTexto.includes("b.get('avisos') === '1'") && modeloTexto.includes("if (doc.querySelector('dialog[open]')) return true;") &&
    modeloTexto.includes('[aria-modal="true"]:not([inert]):not([hidden])'));
  prueba('/novedades-rwadar/ va con su caché corta, en el sitemap, y el publicador y la comprobación de lo publicado miran el archivo',
    /^\/novedades-rwadar\n  Cache-Control: public, max-age=0, must-revalidate$/m.test(headers) &&
    /^\/novedades-rwadar\/\*\n  Cache-Control: public, max-age=0, must-revalidate$/m.test(headers) &&
    lee('sitemap.xml').includes('<loc>https://rwadar.pages.dev/novedades-rwadar/</loc>') &&
    publicador.includes("novedadesModelo.validarTexto(fs.readFileSync(path.join(temporal, 'datos', 'novedades-producto.json'), 'utf8'))") &&
    fs.readFileSync(path.join(raiz, '.github', 'comprobar-publicado.mjs'), 'utf8').includes("pedir('/datos/novedades-producto.json')"));
  const paginaPublicada = fs.readFileSync(path.join(publicado, 'novedades-rwadar', 'index.html'), 'utf8');
  prueba('lo publicado lleva el mismo archivo de novedades y la página con sus recursos con huella',
    fs.readFileSync(path.join(publicado, 'datos', 'novedades-producto.json'), 'utf8') === textoJSON &&
    /\/assets\/novedades-producto-modelo-20261112\.[a-f0-9]{12}\.js/.test(paginaPublicada) &&
    /\/assets\/novedades-producto-20261112\.[a-f0-9]{12}\.js/.test(paginaPublicada) &&
    /\/assets\/novedades-producto-20261112\.[a-f0-9]{12}\.css/.test(paginaPublicada) &&
    [...paginaPublicada.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].every(m => fs.existsSync(path.join(publicado, '.' + m[1]))));

  // 3 · Privacidad: la marca de «ya visto», estrictamente necesaria y sin datos personales.
  const lineal = privacidad.replace(/\s+/g, ' ');
  prueba('la privacidad explica la marca de novedades ya vistas: solo la fecha de la versión, estrictamente necesaria (LSSI, art. 22.2), sin datos personales',
    /<tr id="novedades-vistas">/.test(privacidad) &&
    lineal.includes('el navegador guarda qué versión de las novedades has visto (solo su fecha, por ejemplo 2026-11-12) para no volver a enseñártela') &&
    lineal.includes('Es estrictamente necesario para lo que pides, ver cada novedad una sola vez (LSSI, art. 22.2), no es un dato personal y no sale del navegador') &&
    lineal.includes('con o sin cuenta, qué versión de las novedades ya has visto; nada de eso sale de tu navegador') &&
    /<li><b>Datos locales:<\/b>(?:(?!<\/li>).)*La marca de «Novedades de RWAdar» ya vistas \(solo la fecha de la versión, sin datos personales\) es estrictamente necesaria para no repetirte la ventana \(LSSI, art\. 22\.2\)/.test(lineal));
}

console.log('\n=== NOTIFICACIONES SIN CUENTA (14/11/2026) ===');
/* Encargo de la dirección: «muy importante que funcionen las notificaciones y los avisos aunque no tengan cuenta
   o no hayan iniciado sesión: que puedan activarlas». Contrato: docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md. La
   base nace apagada (migración 36); la web, el servidor y la app, encendidos en el código. Sin navegador: lo que se
   ve en Chromium está en rwadar-acceso/avisos-sin-cuenta-navegador.test.mjs. */
{
  const raiz = path.join(sitio, '..');
  const leerRaiz = (...p) => fs.readFileSync(path.join(raiz, ...p), 'utf8');
  const web = lee('assets/rwadar-20260820.js'), indice = lee('index.html'), priv = lee('privacidad.html').replace(/\s+/g, ' ');
  const sql36 = leerRaiz('rwadar-app', 'db', '36_avisos_sin_cuenta.sql');
  const versionSC = sql36.match(/sin_cuenta_version = '([^']+)'/)?.[1];
  const textoSC = sql36.match(/sin_cuenta_texto_es = '((?:[^']|'')+)'/)?.[1]?.replace(/''/g, "'");
  const textoSCen = sql36.match(/sin_cuenta_texto_en = '((?:[^']|'')+)'/)?.[1]?.replace(/''/g, "'");
  prueba('interruptores encendidos en el código (web, servidor y app) y la base nace apagada',
    web.includes(' const AVISOS_SIN_CUENTA_REMOTO=true;') &&
    web.includes(' const AVISOS_SIN_CUENTA_DISPONIBLE=SERVICIOS_USUARIO_DISPONIBLES&&AVISOS_SIN_CUENTA_REMOTO;') &&
    leerRaiz('rwadar-acceso', 'servidor.mjs').includes('const AVISOS_SIN_CUENTA = true;') &&
    leerRaiz('rwadar-movil', 'lib', 'modo-local.js').includes('export const AVISOS_SIN_CUENTA_REMOTOS = true;') &&
    /sin_cuenta_activa boolean not null default false/.test(sql36));
  prueba('el texto del permiso es uno solo: la base lo da (36), la web y la app lo piden al servidor y la privacidad lo cita igual',
    versionSC === 'sin-cuenta-v1-2026-11-14' && /Solo para mayores de 18 años\. Más información en Privacidad\.$/.test(textoSC || '') &&
    /Only for people aged 18 or over\. More information in Privacy\.$/.test(textoSCen || '') &&
    !web.includes(textoSC) && !leerRaiz('rwadar-movil', 'componentes', 'AvisosSinCuenta.js').includes(textoSC) &&
    web.includes("pedirSinCuenta('/api/avisos/texto')") && leerRaiz('rwadar-movil', 'lib', 'avisos-sin-cuenta.js').includes("pedir('/texto')") &&
    priv.includes('(<code>' + versionSC + '</code>): «' + textoSC + '»') &&
    leerRaiz('docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md').includes('**Castellano:** ' + textoSC));
  prueba('Perfil › Avisos: el bloque sin cuenta va primero, con su botón, los pasos del iPhone sin «entra en tu cuenta» y sin tocar Supabase',
    indice.indexOf('<div id="perfilAvisosSinCuenta" hidden>') > 0 &&
    indice.indexOf('<div id="perfilAvisosSinCuenta" hidden>') < indice.indexOf('<div id="perfilAvisosProximamente">') &&
    /id="perfilScActivar" data-sc-activar hidden disabled>Activar notificaciones en este móvil</.test(indice) &&
    /id="perfilScDesactivar" data-sc-desactivar hidden>Desactivar las notificaciones de este móvil</.test(indice) &&
    indice.includes('<li>Abre RWAdar desde el icono nuevo y vuelve a Perfil › Avisos. No hace falta cuenta.</li>') &&
    /<p class="avisos-sc-permiso" id="perfilScTexto" translate="no" hidden><\/p>/.test(indice) &&
    !/rpc\/(?:alta|baja)_aviso_sin_cuenta|aviso_sin_cuenta_web_activo/.test(web) &&
    (web.match(/credentials:'omit'/g) || []).length >= 2);
  const activar = web.slice(web.indexOf(' function activarSinCuenta('), web.indexOf(' function desactivarSinCuenta('));
  prueba('activar sin cuenta: el permiso en el mismo toque (antes de cualquier espera), alta con versión, idioma y origen, y la notificación de muestra',
    activar.indexOf('Notification.requestPermission()') > 0 && activar.indexOf('Notification.requestPermission()') < activar.indexOf('await') &&
    activar.includes("{accion:'alta',endpoint:datos.p_endpoint,p256dh:datos.p_p256dh,auth:datos.p_auth,version,idioma,origen}") === false &&
    web.includes("{accion:'alta',endpoint:datos.p_endpoint,p256dh:datos.p_p256dh,auth:datos.p_auth,version,idioma,origen}") &&
    activar.includes("if(!alta.ok&&alta.error==='en_uso')") && activar.includes("tag:'rwadar-activadas'"));
  prueba('convivencia con la cuenta: una suscripción por navegador; cerrar sesión no quita la de sin cuenta, «Desactivar» de la cuenta quita las dos y activar con cuenta la reutiliza',
    web.includes('if(AVISOS_SIN_CUENTA_DISPONIBLE&&esDeSinCuenta(datosSeguros(sub)))return ok;') &&
    web.includes('(AVISOS_SIN_CUENTA_DISPONIBLE?bajaSinCuentaAntes():Promise.resolve()).then(()=>soltarPush(cuenta))') &&
    web.includes('const reutilizada=vieja&&AVISOS_SIN_CUENTA_DISPONIBLE&&mismaClave(vieja,k)&&esDeSinCuenta(datosSeguros(vieja))?vieja:null;'));
  prueba('?avisos=1 sin sesión: los avisos publicados y la baja de este móvil; renovación como mucho cada 12 horas',
    web.includes('if(AVISOS_SIN_CUENTA_DISPONIBLE){abrirAvisosSinCuenta();return;}') &&
    web.includes("pedirSinCuenta('/api/avisos/recientes')") && web.includes("avisarTrabajador({tipo:'avisos-vistos',n:0});") &&
    web.includes("¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.") &&
    web.includes('const RENOVAR_SC_MS=432e5;') && web.includes("const CLAVE_SC='rwadar.avisos.sin-cuenta.v1';"));
  prueba('privacidad: §2 (la marca), §5, §6 «Notificaciones sin cuenta», §8, §9, §11 (art. 11) y §12 (ni activar notificaciones sin cuenta)',
    priv.includes('<tr id="marca-sin-cuenta">') && priv.includes('<h3 id="avisos-sin-cuenta">Notificaciones sin cuenta</h3>') &&
    priv.includes('<li id="plazos-sin-cuenta">') && /art\. 11 RGPD/.test(priv) &&
    priv.includes('ni activar las notificaciones, tampoco sin cuenta') && priv.includes('<h2 id="edad-minima">12 · Edad mínima</h2>') &&
    /Lo mismo vale para las notificaciones sin cuenta/.test(priv) && /<b>También sin cuenta<\/b> \(desde el 14\/11\/2026\)/.test(priv) &&
    /<b>Base jurídica:<\/b> tu consentimiento \(art\. 6\.1\.a RGPD y arts\. 21 y 22\.2 de la Ley 34\/2002\)/.test(priv));
  const avisosMovil = JSON.parse(lee('datos/novedades-producto.json')).detalle.find(s => s.id === 'avisos-movil');
  prueba('novedades 2026-11-14.4: en los pasos, sin «Entra en tu cuenta», con «No hace falta cuenta» y, con cuenta, en la web o en la app',
    JSON.parse(lee('datos/novedades-producto.json')).version === '2026-11-14.4' &&
    !avisosMovil.pasos.some(p => /Entra en tu cuenta/.test(p)) && avisosMovil.pasos.some(p => /No hace falta cuenta/.test(p)) &&
    avisosMovil.pasos.includes('Si has entrado en tu cuenta (en la web o en la app), activa «Avisos de novedades» y después «Notificaciones en este móvil».') &&
    avisosMovil.en.pasos.includes('If you have signed in to your account (on the website or in the app), turn on «News notices» and then «Notifications on this phone».') &&
    !avisosMovil.en.pasos.some(p => /Sign in to your RWAdar account/.test(p)));
  const enComunSC = require('./rwadar-site/assets/idioma-en-20261022.js'), enAvisosSC = require('./rwadar-site/assets/idioma-en-avisos-20261112.js');
  prueba('el inglés de lo nuevo: en el común (web y app) o en el de la campana (solo web)',
    ['Sin cuenta', 'Activar notificaciones en este móvil', 'Desactivar las notificaciones de este móvil',
      '¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.',
      'Las notificaciones sin cuenta todavía no están disponibles. Pronto podrás activarlas aquí.'].every(k => typeof enComunSC[k] === 'string') &&
    ['Avisos de RWAdar', 'Ver los últimos avisos', 'Fichas nuevas y novedades',
      'Abre RWAdar desde el icono nuevo y vuelve a Perfil › Avisos. No hace falta cuenta.'].every(k => typeof enAvisosSC[k] === 'string') &&
    Object.keys(enAvisosSC).every(k => !Object.hasOwn(enComunSC, k)));
}

console.log('\n=== RWADAR ACADEMY ===');
{
  const academyMod = require('./rwadar-academy.js');
  const { PAGINAS_ACADEMY } = require('./rwadar-publicacion-segura.js');
  const academy = academyMod.cargarAcademy();
  const publicadasA = academy.lecciones.filter(l => l.estado === 'publicado');
  const pendientesA = academy.lecciones.filter(l => l.estado !== 'publicado');
  const paginaDe = slug => lee(`academy/${slug}.html`);
  const indiceAcademy = lee('academy/index.html');
  const sitemapAcademy = lee('sitemap.xml');
  const avisoComun = academy.avisoComun.map(tramos => academyMod.textoPlano(tramos));
  const textoDe = pagina => pagina.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');

  prueba('las páginas de la Academy están generadas desde las lecciones y al día',
    academyMod.comprobar(academy).length === 0);
  // Las lecciones 8 y 9 se publican por orden de Víctor del 06/11/2026 («Publicar las 9 ya»).
  prueba('las nueve lecciones se validan y las nueve están publicadas, en orden de módulo',
    academy.lecciones.length === 9 && publicadasA.length === 9 && pendientesA.length === 0 &&
    publicadasA.every((l, k) => l.modulo === k + 1) &&
    academy.config.lecciones.every(l => l.estado === 'publicado' && !('motivo' in l)));
  prueba('el manifiesto publicable lista exactamente el índice y las lecciones publicadas',
    JSON.stringify(academyMod.paginasAcademy(academy)) === JSON.stringify([...PAGINAS_ACADEMY]) &&
    fs.readdirSync(path.join(sitio, 'academy')).length === publicadasA.length + 1 &&
    pendientesA.every(l => !fs.existsSync(path.join(sitio, 'academy', `${l.slug}.html`))));
  for (const l of publicadasA) {
    const pagina = paginaDe(l.slug);
    const canonica = `https://rwadar.pages.dev/academy/${l.slug}`;
    const ld = JSON.parse(pagina.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const articulo = ld['@graph'].find(x => x['@type'] === 'Article');
    prueba(`lección ${l.modulo}: CSP estricta, URL canónica y datos estructurados Article`,
      !/<style\b|\sstyle\s*=|\son[a-z]+\s*=/i.test(pagina) &&
      [...pagina.matchAll(/<script\b([^>]*)>/gi)].every(m => /\bsrc=|application\/ld\+json/.test(m[1])) &&
      pagina.includes(`<link rel="canonical" href="${canonica}">`) &&
      pagina.includes(`<title>${academyMod.tituloPestana(l.titulo)}</title>`) &&
      academyMod.tituloPestana(l.titulo).length <= 65 &&
      pagina.includes(`<meta property="og:title" content="${l.titulo}">`) &&
      articulo.datePublished === l.fechaPublicacion && articulo.dateModified === l.revisionLegal &&
      pagina.includes('/assets/academy-20261002.css') && pagina.includes('/assets/academy-20261002.js') &&
      pagina.includes(rutaAnalitica));
    prueba(`lección ${l.modulo}: minutos corregidos, TL;DR destacado antes del cuerpo y revisión legal visible`,
      pagina.includes(`<li><span>Lectura</span>${l.minutos} min</li>`) &&
      (pagina.match(/<section class="ac-tldr"[\s\S]*?<\/section>/)?.[0].match(/<li>/g) || []).length === 3 &&
      pagina.indexOf('class="ac-tldr"') < pagina.indexOf('class="ac-articulo"') &&
      pagina.includes(`<li><span>Última revisión legal</span><time datetime="${l.revisionLegal}">`) &&
      /<p class="ac-revision">Contenido revisado el <time datetime="\d{4}-\d{2}-\d{2}">[^<]+<\/time>\. Jurisdicción de referencia: España \/ Unión Europea\.<\/p>/.test(pagina));
    const preguntas = [...pagina.matchAll(/data-academy-pregunta data-correcta="(\d)"[\s\S]*?<\/details>/g)];
    prueba(`lección ${l.modulo}: test de ${l.quiz.length} preguntas con explicación siempre disponible`,
      preguntas.length === l.quiz.length && preguntas.every((m, k) =>
        Number(m[1]) === l.quiz[k].correcta && /Respuesta correcta: [A-D]\./.test(m[0]) &&
        (m[0].match(/type="radio"/g) || []).length === l.quiz[k].opciones.length) &&
      pagina.includes('data-academy-resumen') && pagina.includes('href="#siguiente-paso"'));
    const texto = textoDe(pagina);
    prueba(`lección ${l.modulo}: aviso legal de una sola fuente${l.avisoReforzado ? ' y variante reforzada' : ''}`,
      avisoComun.every(parrafo => texto.split(parrafo).length === 2) &&
      pagina.includes('ac-legal-reforzado') === l.avisoReforzado &&
      fs.readFileSync(path.join(raiz, 'rwadar-academy', 'lecciones',
        `${String(l.modulo).padStart(2, '0')}-${l.slug}.md`), 'utf8').includes('## Aviso importante'));
    const anclasPropias = new Set([...pagina.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    const anclasPortada = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
    const enlaces = [...pagina.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => m[1]);
    const roto = enlaces.find(href => {
      if (href.startsWith('#')) return !anclasPropias.has(href.slice(1));
      if (href.startsWith('mailto:')) return href !== 'mailto:rwadares@gmail.com';
      if (['/', '/privacidad', '/transparencia-comercial', '/academy/'].includes(href)) return false;
      const ancla = href.match(/^\/#([a-z]+)$/);
      if (ancla) return !anclasPortada.has(ancla[1]);
      const otra = href.match(/^\/academy\/(#[a-z]+|[a-z0-9-]+)$/);
      if (otra && otra[1].startsWith('#')) return !academy.niveles.some(n => '#' + n.id === otra[1]);
      if (otra) return !fs.existsSync(path.join(sitio, 'academy', `${otra[1]}.html`));
      return true;
    });
    prueba(`lección ${l.modulo}: termina en su CTA y ningún enlace lleva a un 404`,
      roto === undefined && pagina.includes('id="siguiente-paso"') && /class="ac-(?:accion|enlinea)[ "]/.test(
        pagina.match(/<section class="ac-siguiente"[\s\S]*?<\/section>/)[0]));
  }
  const leccion1 = paginaDe('que-significa-tokenizar-un-activo');
  prueba('los dos tipos de recuadro (idea y aviso) se distinguen en el marcado',
    leccion1.includes('ac-recuadro ac-recuadro-idea') && leccion1.includes('ac-recuadro ac-recuadro-aviso'));
  const leccion8 = paginaDe('expediente-de-tokenizacion'), leccion9 = paginaDe('despues-de-emitir-ciclo-de-vida');
  const prontoAccion = etiqueta => new RegExp(`<span class="ac-accion ac-accion-pronto">${etiqueta} <small>Próximamente</small></span>`);
  prueba('un destino que aún no existe se muestra como «Próximamente», nunca como enlace',
    prontoAccion('Evaluador de Viabilidad').test(leccion1) &&
    prontoAccion('Evaluador de Viabilidad').test(leccion8) && prontoAccion('Checklist del expediente').test(leccion8) &&
    leccion8.includes('<span class="ac-enlinea-pronto">Checklist del expediente <small>Próximamente</small></span>') &&
    prontoAccion('Evaluador de Viabilidad').test(leccion9) &&
    ['evaluador-viabilidad', 'checklist-expediente'].every(d => academy.destinos[d].estado === 'proximamente') &&
    // (la lección 8 tiene un apartado propio, #tu-checklist: un ancla de la página no es un destino)
    !/href="(?!#)[^"]*(?:evaluador|checklist)/i.test(publicadasA.map(l => paginaDe(l.slug)).join('')));
  prueba('un destino parcial enlaza al radar y explica qué falta',
    paginaDe('quien-es-quien-actores-tokenizacion').includes('todavía no filtra por tipo de proveedor') &&
    paginaDe('marco-legal-cuando-tu-token-es-un-valor').includes('Todavía no hay un filtro por supervisión'));
  prueba('las tablas tienen desplazamiento propio y cabeceras accesibles',
    (paginaDe('es-tu-activo-tokenizable').match(/<div class="ac-tabla ac-tabla-c\d" role="region" tabindex="0"/g) || []).length >= 1 &&
    /\.ac-tabla\{overflow-x:auto/.test(lee('assets/academy-20261002.css')) &&
    /body\{[^}]*overflow-x:hidden/.test(lee('assets/academy-20261002.css')));
  prueba('las lecciones 7, 8 y 9 se enlazan en orden y la 9, la última, no anuncia ninguna siguiente',
    paginaDe('como-leer-el-radar').includes('<a class="ac-vecina ac-vecina-siguiente" href="/academy/expediente-de-tokenizacion" rel="next">') &&
    leccion8.includes('<a class="ac-vecina ac-vecina-anterior" href="/academy/como-leer-el-radar" rel="prev">') &&
    leccion8.includes('<a class="ac-vecina ac-vecina-siguiente" href="/academy/despues-de-emitir-ciclo-de-vida" rel="next">') &&
    leccion9.includes('<a class="ac-vecina ac-vecina-anterior" href="/academy/expediente-de-tokenizacion" rel="prev">') &&
    !leccion9.includes('ac-vecina-siguiente') && publicadasA.every(l => !paginaDe(l.slug).includes('ac-vecina-pronto')) &&
    paginaDe('liquidez-como-evaluarla').includes('href="/academy/como-leer-el-radar"'));
  // Sin lecciones pendientes de verdad, el camino «Próximamente» se prueba con una
  // Academy simulada en la que la 9 vuelve a «en revisión» (no se escribe nada).
  const academyPendiente = { ...academy, lecciones: academy.lecciones.map(l =>
    l.slug === 'despues-de-emitir-ciclo-de-vida' ? { ...l, estado: 'en_revision' } : l) };
  const salidasPendiente = academyMod.construirSalidas(academyPendiente);
  const salidaPendiente = nombre => salidasPendiente.get(path.join(sitio, ...nombre.split('/')));
  prueba('si una lección vuelve a «en revisión», sale como «Próximamente» sin página ni enlace',
    salidaPendiente('academy/expediente-de-tokenizacion.html').includes('<div class="ac-vecina ac-vecina-siguiente ac-vecina-pronto"><span>Siguiente → · Lección 9 · Próximamente</span>') &&
    !salidaPendiente('academy/expediente-de-tokenizacion.html').includes('href="/academy/despues-de-emitir-ciclo-de-vida"') &&
    salidaPendiente('academy/expediente-de-tokenizacion.html').includes('Lección 8 de 8 ·') &&
    salidaPendiente('academy/despues-de-emitir-ciclo-de-vida.html') === undefined &&
    (salidaPendiente('academy/index.html').match(/ac-tarjeta ac-tarjeta-pronto/g) || []).length === 1 &&
    !salidaPendiente('academy/index.html').includes('href="/academy/despues-de-emitir-ciclo-de-vida"') &&
    salidaPendiente('index.html').includes('<h3 id="academiaLeccionesTit">8 de 9 lecciones disponibles</h3>') &&
    // Desde el rediseño de Inicio (10/11/2026), la tarjeta de la Academy va al final de /aprende/.
    salidaPendiente('aprende/index.html').includes('<p>8 lecciones gratis en tres niveles:') &&
    !salidaPendiente('index.html').includes('href="/academy/despues-de-emitir-ciclo-de-vida"') &&
    !academyMod.paginasAcademy(academyPendiente).includes('academy/despues-de-emitir-ciclo-de-vida.html'));
  prueba('el índice muestra los tres niveles, el progreso local y las pendientes como «Próximamente»',
    academy.niveles.every(n => indiceAcademy.includes(`<section class="ac-nivel" id="${n.id}"`)) &&
    indiceAcademy.includes(`<progress max="${publicadasA.length}" value="0"`) &&
    (indiceAcademy.match(/ac-tarjeta ac-tarjeta-pronto/g) || []).length === pendientesA.length &&
    publicadasA.every(l => indiceAcademy.includes(`href="/academy/${l.slug}" data-academy-tarjeta="${l.slug}"`)) &&
    indiceAcademy.includes('<link rel="canonical" href="https://rwadar.pages.dev/academy/">'));
  prueba('la portada enlaza la Academy desde la cabecera, el pie y el bloque de lecciones',
    html.includes('<a class="hdr-link" href="/academy/">Academy</a>') &&
    html.includes('<a href="/academy/">RWAdar Academy</a>') &&
    publicadasA.every(l => html.includes(`<a href="/academy/${l.slug}">`)) &&
    pendientesA.every(l => !html.includes(`href="/academy/${l.slug}"`)) &&
    html.includes('<p id="comparador">'));
  // Academy con cuenta (05/11/2026): las lecciones piden cuenta, llevan noindex y
  // salen del sitemap; el índice sigue público e indexable.
  const conCuentaA = academy.acceso === 'cuenta';
  prueba('academy.json declara quién abre las lecciones y hoy es "cuenta"',
    academyMod.ACCESOS.join('|') === 'cuenta|publico' && conCuentaA);
  prueba('el sitemap lleva el índice de la Academy y ninguna lección (van con cuenta)',
    sitemapAcademy.includes('<loc>https://rwadar.pages.dev/academy/</loc>') &&
    academy.lecciones.every(l => !sitemapAcademy.includes(`/academy/${l.slug}`)));
  prueba('cada lección publicada lleva una sola etiqueta robots con noindex; el índice se indexa',
    publicadasA.every(l => (paginaDe(l.slug).match(/<meta name="robots"[^>]*>/g) || []).join() === '<meta name="robots" content="noindex, nofollow">') &&
    indiceAcademy.includes('<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">'));
  const ldIndice = JSON.parse(indiceAcademy.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  prueba('los datos estructurados del índice no anuncian lecciones que no se indexan',
    ldIndice['@type'] === 'CollectionPage' && !('hasPart' in ldIndice) && /gratis con tu cuenta/.test(ldIndice.description) &&
    !/academy\/[a-z]/.test(JSON.stringify(ldIndice)));
  const textoIndice = textoDe(indiceAcademy), bloqueAcademy = html.slice(html.indexOf('<!--academy:ini-->'), html.indexOf('<!--academy:fin-->'));
  // En el índice, el que lleva a crear la cuenta es el recuadro del candado, justo bajo la
  // entradilla (revisión del 08/11/2026); la cabecera ya no repite el enlace.
  prueba('el índice y la portada dicen «Gratis con tu cuenta» y llevan a crear la cuenta, sin prometer lecciones que no hay',
    textoIndice.includes('Gratis con tu cuenta') && textoIndice.includes('Las lecciones se abren con tu cuenta gratuita') &&
    indiceAcademy.includes(`<a class="candado-boton candado-boton-p" href="${academyMod.ALTA_ACADEMY}">Crear cuenta gratis</a>`) && academyMod.ALTA_ACADEMY === '/acceso?volver=/academy/' &&
    textoDe(bloqueAcademy).includes('Gratis con tu cuenta') && textoDe(bloqueAcademy).includes('Crea tu cuenta gratis para abrir las lecciones') &&
    textoDe(bloqueAcademy).includes(`${publicadasA.length} de ${academy.lecciones.length} lecciones disponibles`) &&
    !/\b9 lecciones (?:gratuitas|en 3 niveles)/.test(textoIndice + textoDe(bloqueAcademy)) &&
    !/lecciones gratuitas/i.test(indiceAcademy.match(/<meta name="description" content="([^"]+)"/)[1]));
  const { ingles: inglesAcademy } = require('./rwadar-movil/lib/idioma.js');
  const textosBloque = [...bloqueAcademy.matchAll(/<(h3|h4|b|small|p)\b[^>]*>([^<]+)<\/\1>/g)].map(m => m[2]);
  prueba('en inglés, el bloque de lecciones de la portada se traduce entero (también el recuento y las lecciones 8 y 9)',
    textosBloque.length >= 30 && textosBloque.every(t => inglesAcademy(t) !== t) &&
    inglesAcademy(`${publicadasA.length} de ${academy.lecciones.length} lecciones disponibles`) === `${publicadasA.length} of ${academy.lecciones.length} lessons available` &&
    inglesAcademy('Preparación · 15 min') === 'Preparation · 15 min' && inglesAcademy('Post-emisión · 17 min') === 'After issuance · 17 min');
  // Con "publico" (el interruptor de vuelta atrás), todo vuelve a como estaba.
  const salidasPublicas = academyMod.construirSalidas({ ...academy, acceso: 'publico' });
  const salidaPublica = nombre => salidasPublicas.get(path.join(sitio, ...nombre.split('/')));
  prueba('con "acceso": "publico", las lecciones se indexan, vuelven al sitemap y el índice las enumera',
    publicadasA.every(l => salidaPublica(`academy/${l.slug}.html`).includes('<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">') &&
      salidaPublica('sitemap.xml').includes(`<loc>https://rwadar.pages.dev/academy/${l.slug}</loc>`)) &&
    /"hasPart":\[/.test(salidaPublica('academy/index.html')) && !salidaPublica('academy/index.html').includes('Gratis con tu cuenta') &&
    salidaPublica('index.html').includes(`<h3 id="academiaLeccionesTit">${academy.lecciones.length} lecciones en 3 niveles</h3>`));
  prueba('el generador de la Academy rechaza un "acceso" desconocido',
    /"acceso" debe ser "cuenta" o "publico"/.test(fs.readFileSync(path.join(raiz, 'rwadar-academy.js'), 'utf8')));
  prueba('las URL limpias de la Academy no se quedan en caché del CDN',
    /\/academy\/\*\n\s+Cache-Control: public, max-age=0, must-revalidate/.test(headers));
  prueba('la baja de avisos no se indexa ni se guarda en ninguna caché',
    /\n\/baja\n\s+Cache-Control: no-store\n\s+X-Robots-Tag: noindex, nofollow\n/.test(headers));
  prueba('el publicado de cada lección lleva su contenido y noindex antes de subir',
    academyMod.comprobarLeccionesPublicadas(publicado, academy).length === 0 &&
    /comprobarLeccionesPublicadas\(temporal\)/.test(publicador) &&
    publicador.indexOf('comprobarLeccionesPublicadas(temporal)') < publicador.indexOf("'pages', 'deploy', SALIDA"));
  prueba('la baja de avisos se publica con su script con huella y sin el ayudante de sesión',
    ARCHIVOS_PUBLICABLES.includes('baja.html') && ARCHIVOS_PUBLICABLES.includes('assets/baja-20261105.js') &&
    /'baja\.html', \.\.\.PAGINAS_SECCIONES,/.test(publicador) &&
    /\['acceso\.html', 'baja\.html', 'privacidad\.html', 'transparencia-comercial\.html'\]\.includes\(nombre\)/.test(publicador) &&
    /\/assets\/baja-20261105\.[0-9a-f]{12}\.js/.test(fs.readFileSync(path.join(publicado, 'baja.html'), 'utf8')) &&
    !fs.readFileSync(path.join(publicado, 'baja.html'), 'utf8').includes('/assets/acceso-privado'));
  const workerPublicado = fs.readFileSync(path.join(publicado, '_worker.js'), 'utf8');
  prueba('el worker publicado lleva la puerta de la Academy con la lista cerrada de lecciones',
    workerPublicado.includes('const academyRWAdar = Object.freeze(' + JSON.stringify({ acceso: 'cuenta', lecciones: publicadasA.map(l => l.slug).sort() }) + ');') &&
    workerPublicado.includes('crearAccesoServidor({ academy: academyRWAdar })') &&
    pendientesA.every(l => !workerPublicado.includes(l.slug)));
  const codigoAcademy = lee('assets/academy-20261002.js');
  prueba('el progreso es local y separado por cuenta tras verificar la sesión, sin enviar resultados',
    /CLAVE = 'rwadar\.academy\.v1:' \+ cuenta\.id/.test(codigoAcademy) && /if \(!CLAVE\) return vacio\(\)/.test(codigoAcademy) &&
    /await window\.RWADAR_ACCESO\.verificar\(\)/.test(codigoAcademy) &&
    (codigoAcademy.match(/try \{/g) || []).length >= 3 &&
    !/innerHTML|fetch\(|XMLHttpRequest|sendBeacon|document\.cookie/.test(codigoAcademy));
  prueba('el publicado reescribe los assets de la Academy con su huella',
    PAGINAS_ACADEMY.every(nombre => {
      const salida = fs.readFileSync(path.join(publicado, ...nombre.split('/')), 'utf8');
      return /\/assets\/academy-20261002\.[0-9a-f]{12}\.css/.test(salida) &&
        /\/assets\/academy-20261002\.[0-9a-f]{12}\.js/.test(salida) && !salida.includes('/assets/academy-20261002.css');
    }));
  // Candado de las lecciones sin cuenta (08/11/2026): índice y portada nacen bloqueados
  // y llevan la misma hoja y el mismo script, con huella; las lecciones no los cargan.
  prueba('el publicado sale bloqueado por defecto en el índice y la portada, con la hoja y el script del candado con huella',
    ['academy/index.html', 'index.html'].every(nombre => {
      const salida = fs.readFileSync(path.join(publicado, ...nombre.split('/')), 'utf8');
      return salida.includes('<div class="candado" data-academy-candado data-estado="bloqueado">') &&
        salida.includes('<div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">') &&
        /\/assets\/academy-candado-20261108\.[0-9a-f]{12}\.css/.test(salida) && /\/assets\/academy-candado-20261108\.[0-9a-f]{12}\.js/.test(salida) &&
        !salida.includes('/assets/academy-candado-20261108.js"');
    }) && publicadasA.every(l => !fs.readFileSync(path.join(publicado, 'academy', `${l.slug}.html`), 'utf8').includes('academy-candado')));
  let rechazoMarca = null, rechazoBoton = null;
  try { academyMod.parsearInline('texto **sin cerrar', 'prueba', {}); } catch (e) { rechazoMarca = e; }
  try { academyMod.parsearInline('**[Botón inventado →]**', 'prueba', {}); } catch (e) { rechazoBoton = e; }
  prueba('el generador se para ante negritas sin cerrar o botones sin destino',
    rechazoMarca instanceof academyMod.ErrorAcademy && rechazoBoton instanceof academyMod.ErrorAcademy &&
    /sin destino conocido/.test(rechazoBoton.message));
  const textosLecciones = fs.readdirSync(path.join(raiz, 'rwadar-academy', 'lecciones'))
    .map(n => fs.readFileSync(path.join(raiz, 'rwadar-academy', 'lecciones', n), 'utf8'));
  const parrafosLecciones = textosLecciones.flatMap(t => t.split(/\n\s*>?\s*\n/))
    .map(p => p.replace(/^>\s?/gm, '').replace(/\*\*\[[^\]]+\]\*\*/g, '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim());
  const criteriosMetodo = ['Entidad y permisos', 'Actividad y fecha', 'Acceso y condiciones', 'Riesgos y alertas'];
  prueba('los cuatro criterios de las lecciones son los mismos que publica el Método',
    criteriosMetodo.every(c => html.includes(`<h3>${c}</h3>`)) &&
    criteriosMetodo.every((c, k) => textosLecciones.some(t => t.includes(`**${k + 1} · ${c}.**`))) &&
    !textosLecciones.some(t => /supervisión regulatoria\*\*\.|Operativa verificable|Ausencia de crisis activas|\*\*4 · Trayectoria|no superan (?:nuestros|los) (?:cuatro )?criterios|enterprise/i.test(t)));
  const sinProximamente = parrafosLecciones.filter(p =>
    /Evaluador de Viabilidad|checklist del expediente|filtrar (?:a los proveedores )?por categoría|filtro por (?:categoría|capacidad regulatoria)/i.test(p) &&
    !/próximamente/i.test(p));
  prueba('toda función que aún no existe se anuncia como «próximamente» en el texto',
    sinProximamente.length === 0);
  const cssPortada = lee('assets/rwadar-20260820.css');
  const fuentesDe = css => [...css.matchAll(/font-family:'(Geist(?: Mono)?)';font-style:(\w+)[^}]*?src:url\(\/assets\/fuentes\/([a-z0-9-]+\.woff2)\)/g)]
    .map(m => ({ familia: m[1], estilo: m[2], bytes: fs.readFileSync(path.join(raiz, 'rwadar-site/assets/fuentes', m[3])) }));
  const fuentesPortada = fuentesDe(cssPortada), fuentesAcademy = fuentesDe(lee('assets/academy-20261002.css'));
  prueba('las fuentes locales conservan la Geist completa para español, sin base64 duplicada',
    fuentesPortada.length === 2 && fuentesAcademy.length === 3 &&
    [...fuentesPortada, ...fuentesAcademy].every(f => f.bytes.subarray(0, 4).toString('latin1') === 'wOF2' && f.bytes.length > 15000) &&
    fuentesAcademy.some(f => f.estilo === 'italic') &&
    !/data:font[^;]*;base64/.test(cssPortada + lee('assets/academy-20261002.css')) &&
    !(cssPortada + lee('assets/academy-20261002.css')).includes('d09GMgABAAAAAECAABQAAAAAjngAAEALAAEAA'));
  prueba('la cabecera compacta móvil no monta el título sobre la marca',
    /\.movil-cabecera\{display:grid;grid-template-columns:minmax\(max-content,1fr\) minmax\(0,auto\) minmax\(max-content,1fr\);\s*column-gap:10px/.test(cssPortada) &&
    /\.movil-cabecera-titulo\{[^}]*min-width:0;[^}]*text-overflow:ellipsis/.test(cssPortada) &&
    /cabTitulo\.textContent='Academy'/.test(lee('assets/rwadar-20260820.js')));
  prueba('el publicador se niega a construir si la Academy no está al día',
    /comprobarAcademy\(\)/.test(publicador) && /ACADEMY BLOQUEADA/.test(publicador) &&
    /\.\.\.PAGINAS_ACADEMY\]/.test(publicador));
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
  const htmlLocal = await inicio.text();
  prueba('el HTML local no expone fichas antiguas antes de validar el fixture',
    !htmlLocal.includes('Ficha verificada') &&
    htmlLocal.includes('Cargando catálogo local verificado') &&
    htmlLocal.includes('Cargando exclusiones verificadas'));
  const hostLocal = await solicitarConHost(puerto, `localhost:${puerto}`);
  const hostHostil = await solicitarConHost(puerto, 'rwadar.example.test');
  const hostSinPuerto = await solicitarConHost(puerto, 'localhost');
  prueba('el servidor acepta solo Host exacto de localhost o 127.0.0.1 con su puerto',
    hostLocal.status===200 && hostHostil.status===421 && hostHostil.cuerpo==='host no permitido' &&
    hostSinPuerto.status===421 && /HOSTS_LOCALES/.test(servidor));
  const cspLocal = inicio.headers.get('content-security-policy') || '';
  prueba('la respuesta local aplica CSP estricta y permite el worker propio',
    !/unsafe-inline|unsafe-eval/.test(cspLocal) && /worker-src 'self'/.test(cspLocal) &&
    /connect-src 'self'(?:;|$)/.test(cspLocal) && !/supabase/i.test(cspLocal));
  const recursoCatalogoLocal = await fetch(`http://127.0.0.1:${puerto}${rutaCatalogo}`);
  prueba('el snapshot separado se sirve completo como JavaScript propio con nosniff',
    recursoCatalogoLocal.status===200 && /(?:javascript)/.test(recursoCatalogoLocal.headers.get('content-type') || '') &&
    recursoCatalogoLocal.headers.get('x-content-type-options')==='nosniff' &&
    await recursoCatalogoLocal.text()===jsCatalogo);
  const escaparateRespuesta = await fetch(`http://127.0.0.1:${puerto}/__rwadar_local/escaparate.json`);
  const escaparate = await escaparateRespuesta.json();
  prueba('el endpoint local entrega por defecto el snapshot publicable V2 completo sin caché',
    escaparateRespuesta.status===200 && escaparateRespuesta.headers.get('cache-control')==='no-store' &&
    escaparate.versionEsquema===2 && escaparate.lote==='snapshot-publicable'&&escaparate.preparado===false&&
    escaparate.plataformas?.length===N_PLATAFORMAS&&escaparate.ofertas?.length===N_OFERTAS&&escaparate.descartes?.length===N_DESCARTADAS&&
    escaparate.ofertas.every(o=>o.revisionId===escaparate.plataformas[0].revisionId)&&!escaparate.secundario&&!escaparate.exclusionesOfertas);
  const imagenNombre = activosEditoriales.fichas[0].archivo;
  const imagenRespuesta = await fetch(`http://127.0.0.1:${puerto}/ofertas-editoriales/${imagenNombre}`);
  const imagenBytes = Buffer.from(await imagenRespuesta.arrayBuffer());
  prueba('las imágenes locales son WebP propias y se entregan con nosniff',
    imagenRespuesta.status===200 && imagenRespuesta.headers.get('content-type')==='image/webp' &&
    imagenRespuesta.headers.get('x-content-type-options')==='nosniff' &&
    imagenBytes.subarray(0,4).toString('ascii')==='RIFF' && imagenBytes.subarray(8,12).toString('ascii')==='WEBP');
  const cabeza = await fetch(`http://127.0.0.1:${puerto}/ofertas-editoriales/${imagenNombre}`, {method:'HEAD'});
  prueba('los activos locales aceptan HEAD sin abrir métodos de escritura', cabeza.status===200);
  const manifiestoEditorialRespuesta = await fetch(
    `http://127.0.0.1:${puerto}/ofertas-editoriales/manifest.json`);
  const manifiestoEditorial = await manifiestoEditorialRespuesta.json();
  prueba('el servidor entrega el manifiesto editorial exacto, sin caché y con etiqueta visible',
    manifiestoEditorialRespuesta.status===200 &&
    manifiestoEditorialRespuesta.headers.get('cache-control')==='no-store' &&
    manifiestoEditorialRespuesta.headers.get('x-content-type-options')==='nosniff' &&
    manifiestoEditorial.etiquetaVisibleObligatoria==='Ilustración editorial' &&
    manifiestoEditorial.archivos?.length===4);
  let editorialesValidas = (manifiestoEditorial.fichas?.length || 0) > 0;
  for (const entrada of [...manifiestoEditorial.archivos, ...(manifiestoEditorial.fichas || [])]) {
    const respuesta = await fetch(`http://127.0.0.1:${puerto}/ofertas-editoriales/${entrada.archivo}`);
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    const cabezaEditorial = await fetch(
      `http://127.0.0.1:${puerto}/ofertas-editoriales/${entrada.archivo}`, {method:'HEAD'});
    editorialesValidas &&= respuesta.status===200 && cabezaEditorial.status===200 &&
      respuesta.headers.get('content-type')==='image/webp' && bytes.length===entrada.bytes &&
      crypto.createHash('sha256').update(bytes).digest('hex')===entrada.hashSha256;
  }
  prueba('los WebP editoriales (categoría y ficha) se sirven por lista cerrada con bytes y SHA-256 exactos',
    editorialesValidas);
  const editorialNoListada = await fetch(
    `http://127.0.0.1:${puerto}/ofertas-editoriales/no-listada.webp`);
  const editorialPost = await fetch(
    `http://127.0.0.1:${puerto}/ofertas-editoriales/${manifiestoEditorial.archivos[0].archivo}`,
    {method:'POST'});
  prueba('la ruta editorial rechaza nombres no listados y métodos de escritura',
    editorialNoListada.status===404 && editorialPost.status===405);
  const traversal = await fetch(`http://127.0.0.1:${puerto}/__rwadar_local/ofertas/%2e%2e%2fescaparate-local.json`);
  const metodoLocal = await fetch(`http://127.0.0.1:${puerto}/__rwadar_local/escaparate.json`, {method:'POST'});
  prueba('el endpoint rechaza traversal y cualquier método de mutación', traversal.status===404 && metodoLocal.status===405);
  const politica = await fetch(`http://127.0.0.1:${puerto}/privacidad`);
  prueba('la URL limpia de privacidad funciona localmente', politica.status===200);
  const transparencia = await fetch(`http://127.0.0.1:${puerto}/transparencia-comercial`);
  prueba('la URL limpia de transparencia comercial funciona localmente', transparencia.status===200);
  // «Para empresas» queda pendiente (Víctor, 04/11/2026): su dirección lleva a Inicio.
  const empresas = await fetch(`http://127.0.0.1:${puerto}/para-empresas`, { redirect:'manual' });
  const empresasHtml = await fetch(`http://127.0.0.1:${puerto}/para-empresas.html`, { redirect:'manual' });
  prueba('/para-empresas lleva a Inicio localmente', empresas.status===302 && empresas.headers.get('location')==='/' &&
    empresasHtml.status===302 && empresasHtml.headers.get('location')==='/');
  const post = await fetch(`http://127.0.0.1:${puerto}/guardar?n=prueba.png`, {
    method:'POST',headers:{Origin:`http://127.0.0.1:${puerto}`,'Content-Type':'image/png'},body:new Uint8Array([1,2,3]),
  });
  prueba('POST /guardar está desactivado por defecto', post.status===403);
  const academySinBarra = await fetch(`http://127.0.0.1:${puerto}/academy`, { redirect:'manual' });
  const academyIndice = await fetch(`http://127.0.0.1:${puerto}/academy/`);
  const academyLeccion = await fetch(`http://127.0.0.1:${puerto}/academy/que-significa-tokenizar-un-activo`);
  const academyHtml = await fetch(`http://127.0.0.1:${puerto}/academy/que-significa-tokenizar-un-activo.html`, { redirect:'manual' });
  const academyLeccion9 = await fetch(`http://127.0.0.1:${puerto}/academy/despues-de-emitir-ciclo-de-vida`);
  const academyInventada = await fetch(`http://127.0.0.1:${puerto}/academy/leccion-inventada`);
  prueba('las URL limpias de la Academy funcionan localmente como en Cloudflare',
    academySinBarra.status===308 && academySinBarra.headers.get('location')==='/academy/' &&
    academyIndice.status===200 && (await academyIndice.text()).includes('data-academy-indice-pagina') &&
    academyLeccion.status===200 && (await academyLeccion.text()).includes('data-academy-leccion="que-significa-tokenizar-un-activo"') &&
    academyHtml.status===308 && academyHtml.headers.get('location')==='/academy/que-significa-tokenizar-un-activo' &&
    academyLeccion9.status===200 && (await academyLeccion9.text()).includes('data-academy-leccion="despues-de-emitir-ciclo-de-vida"') &&
    academyInventada.status===404);
} finally {
  proceso.kill();
}
{
  const puertoHistorico=puerto+1;
  const historico=spawn(process.execPath,['rwadar-servir.js',`--puerto=${puertoHistorico}`,'--fixture-historico'],{cwd:raiz,stdio:'ignore'});
  try{
    let respuesta;const limite=Date.now()+5000;
    while(Date.now()<limite){try{respuesta=await fetch(`http://127.0.0.1:${puertoHistorico}/__rwadar_local/escaparate.json`);break}catch{await new Promise(r=>setTimeout(r,50))}}
    const d=respuesta&&await respuesta.json();
    prueba('el fixture histórico solo se conserva bajo su flag explícito',respuesta?.status===200&&d.versionEsquema===1&&
      d.ofertas?.length===28&&d.secundario?.length===24&&d.exclusionesOfertas?.length===15);
  }finally{historico.kill()}
}

console.log(`\n${correctas} correctas, 0 fallidas`);
